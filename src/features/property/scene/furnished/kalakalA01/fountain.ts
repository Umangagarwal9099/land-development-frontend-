import {
  BufferAttribute, Color, Frustum, InstancedBufferAttribute, InstancedBufferGeometry, Matrix4, Mesh, ShaderMaterial, Sphere, Vector3, type Camera, type Object3D, type Texture,
} from 'three'
import { rng } from '../textures'

/*
 * The plaza's dry-deck fountain: flush nozzles in the stone, each throwing a jet of water that
 * rises, breaks up and falls back, splashes on the stone and runs off across it to the drains.
 *
 * Every drop is simulated on the GPU, in closed form: a drop launched at time t0 from a nozzle
 * running at height H leaves at v0 = √(2gH) (plus a little sideways drift as the jet breaks up)
 * and follows its ballistic path until it reaches the stone. Each nozzle's height varies on its
 * own slow swell and with a programmed wave travelling round its ring; a drop takes the height
 * of the moment it left, so a change rises up the jet as it would in water. Drops are drawn as
 * streaks blurred by their own speed, so the fast column near the nozzle reads as a clear rod and
 * the slow water at the crown as separate drops, shaded as water: a Fresnel reflection of the sky,
 * the sun's glint, and a clear body that whitens as it takes in air on the way down. Where it
 * lands: splash drops, ripples running out over a wet film, and a faint mist.
 *
 * Every period divides WRAP, so time can wrap without a visible reset.
 */

const WRAP = 240
const G = 9.81
const PERIOD = { stream: 2.4, splash: 0.6, mist: 8 }
const PER_JET = { stream: 200, splash: 56, mist: 5 }

export interface Jet {
  x: number
  z: number
  /** Base height of its jet, metres. */
  h: number
  /** Its angle round the plaza, radians (for the travelling wave). */
  angle: number
}

const HEIGHT = /* glsl */ `
uniform float uTime;
uniform float uGround;
attribute vec4 aJet;
attribute vec4 aVar;
attribute vec4 aP;
const float W = 6.28318530718 / ${WRAP}.0;
// The jet's height at time t: three crests travelling round its ring every 40 s, the nozzle's own
// slow swell, and the small unsteadiness of any real jet.
float jetHeight(float t) {
  float wave = 0.14 * sin(W * 6.0 * t - aJet.w * 3.0);
  float own = aVar.z * sin(W * aVar.x * t + aVar.w) + 0.5 * aVar.z * sin(W * aVar.y * t + 2.1 * aVar.w);
  float flutter = 0.025 * sin(W * 97.0 * t + 5.0 * aVar.w);
  return max(0.05, aJet.z * (1.0 + wave + own + flutter));
}
`

const SHADE = /* glsl */ `
uniform sampler2D uEnv;
uniform float uEnvI;
uniform vec3 uSun;
uniform vec3 uSunCol;
uniform vec3 uSky;
vec3 envAt(vec3 d) {
  vec2 uv = vec2(atan(d.z, d.x) * 0.15915494 + 0.5, asin(clamp(d.y, -1.0, 1.0)) * 0.31830989 + 0.5);
  return texture2D(uEnv, uv).rgb * uEnvI;
}
// Water seen across a round column: n across it, v towards the eye; foam 0 clear, 1 aerated.
vec4 water(vec3 n, vec3 v, float foam) {
  float ndv = max(dot(n, v), 0.0);
  float fres = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
  vec3 refl = envAt(reflect(-v, n));
  float spec = pow(max(dot(n, normalize(uSun + v)), 0.0), 160.0) * 5.0;
  vec3 clear = vec3(0.6, 0.7, 0.74) * uSky * 0.55;
  vec3 aerated = uSky * 0.78 + uSunCol * 0.5 * max(dot(n, uSun), 0.0) + 0.04;
  vec3 col = mix(mix(clear, aerated, foam), refl, fres * (1.0 - 0.5 * foam)) + uSunCol * spec;
  return vec4(col, mix(0.24, 0.72, foam) + 0.6 * fres + spec);
}
`

/** A streak: corners of a unit quad laid along the drop's velocity, `wid` across, `len` along. */
const STREAK = /* glsl */ `
varying vec2 vC;
varying vec3 vSide;
varying vec3 vToCam;
varying float vA;
varying float vFoam;
void streak(vec3 p, vec3 vel, float wid, float len, float alpha, float foam) {
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vec3 axis = normalize(mat3(modelMatrix) * vel + vec3(0.0, 1e-4, 0.0));
  vec3 toCam = normalize(cameraPosition - wp.xyz);
  vec3 side = cross(axis, toCam);
  side = length(side) < 1e-4 ? vec3(1.0, 0.0, 0.0) : normalize(side);
  vec3 world = wp.xyz + side * position.x * wid + axis * position.y * len;
  vC = position.xy * 2.0;
  vSide = side;
  vToCam = toCam;
  vA = alpha;
  vFoam = foam;
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
`

const STREAK_FRAG = /* glsl */ `
${SHADE}
varying vec2 vC;
varying vec3 vSide;
varying vec3 vToCam;
varying float vA;
varying float vFoam;
void main() {
  // A rounded rod across, tapering at both ends.
  float shape = (1.0 - vC.x * vC.x) * smoothstep(1.0, 0.5, abs(vC.y));
  if (shape * vA < 0.004) discard;
  vec3 n = normalize(vSide * vC.x + vToCam * sqrt(max(0.0, 1.0 - vC.x * vC.x)));
  vec4 w = water(n, vToCam, vFoam);
  gl_FragColor = vec4(w.rgb, clamp(w.a * shape * vA, 0.0, 1.0));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

const STREAM_VERT = /* glsl */ `
${HEIGHT}
${STREAK}
void main() {
  float P = ${PERIOD.stream.toFixed(2)};
  float age = mod(uTime + aP.x * P, P);
  float H = jetHeight(uTime - age);
  float v0 = sqrt(2.0 * ${G} * H);
  float T = 2.0 * v0 / ${G};
  // The jet stays a coherent rod at first and breaks up higher: drift grows with the throw.
  vec2 ld = vec2(cos(aP.y), sin(aP.y));
  float vl = aP.z * (0.4 + 0.6 * H / 1.6);
  vec3 vel = vec3(ld.x * vl, v0 - ${G} * age, ld.y * vl);
  vec3 p = vec3(aJet.x + ld.x * vl * age, uGround + v0 * age - 0.5 * ${G} * age * age, aJet.y + ld.y * vl * age);
  float alive = step(age, T) * step(0.0, p.y - uGround);
  float u = age / T;
  float wid = aP.w * (1.0 + 0.6 * smoothstep(0.4, 1.0, u)) * alive;
  // Blurred over 1/25 s of travel, as a camera sees moving water.
  float len = (aP.w * 2.0 + length(vel) * 0.04) * alive;
  // Clear as it leaves the nozzle, taking in air as it rises, breaks and falls.
  float foam = mix(0.3, 0.92, smoothstep(0.1, 0.75, u));
  streak(p, vel, wid, len, alive * smoothstep(0.0, 0.015, age), foam);
}
`

const SPLASH_VERT = /* glsl */ `
${HEIGHT}
${STREAK}
void main() {
  float P = ${PERIOD.splash.toFixed(2)};
  float age = mod(uTime + aP.x * P, P);
  float H = jetHeight(uTime - age);
  float k = clamp(H / 1.6, 0.25, 1.6);
  // Thrown up from where the falling water strikes the stone round the nozzle.
  vec2 ld = vec2(cos(aP.y), sin(aP.y));
  float at = 0.04 + aP.z * 0.32 * k;
  float up = (0.45 + fract(aP.w * 3.7) * 1.0) * sqrt(k);
  float outv = 0.2 + aP.w * 0.7;
  vec3 vel = vec3(ld.x * outv, up - ${G} * age, ld.y * outv);
  vec3 p = vec3(aJet.x + ld.x * (at + outv * age), uGround + 0.01 + up * age - 0.5 * ${G} * age * age, aJet.y + ld.y * (at + outv * age));
  float alive = step(age, 2.0 * up / ${G}) * step(0.0, p.y - uGround);
  float size = (0.004 + 0.008 * fract(aP.w * 7.31)) * alive;
  streak(p, vel, size, (size * 2.0 + length(vel) * 0.02) * alive, alive * min(1.0, k * 1.2), 0.65);
}
`

const MIST_VERT = /* glsl */ `
${HEIGHT}
varying vec2 vC;
varying float vA;
void main() {
  float P = ${PERIOD.mist.toFixed(1)};
  float age = mod(uTime + aP.x * P, P);
  float u = age / P;
  float k = clamp(jetHeight(uTime) / 1.6, 0.25, 1.6);
  vec2 ld = vec2(cos(aP.y), sin(aP.y));
  float r = 0.1 + aP.z * 0.45 + 0.06 * age;
  vec3 p = vec3(aJet.x + ld.x * r, uGround + 0.08 + 0.55 * u * k, aJet.y + ld.y * r);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vec3 toCam = normalize(cameraPosition - wp.xyz);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toCam) + vec3(1e-4, 0.0, 0.0));
  vec3 upv = cross(toCam, right);
  float size = (0.35 + 0.55 * u) * k * (0.7 + 0.6 * aP.w);
  vC = position.xy * 2.0;
  vA = sin(3.14159265 * u) * k;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp.xyz + (right * position.x + upv * position.y) * size, 1.0);
}
`

const MIST_FRAG = /* glsl */ `
uniform vec3 uSky;
uniform vec3 uSunCol;
varying vec2 vC;
varying float vA;
void main() {
  float d = dot(vC, vC);
  if (d > 1.0) discard;
  float a = (1.0 - d) * (1.0 - d) * 0.045 * vA;
  gl_FragColor = vec4(uSky * 0.85 + uSunCol * 0.25, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

/** The wet stone round each nozzle: a thin film of water with rings running out from the falling water. */
const FILM_VERT = /* glsl */ `
${HEIGHT}
varying vec2 vL;
varying vec3 vW;
varying float vK;
varying float vSeed;
void main() {
  float k = clamp(jetHeight(uTime) / 1.6, 0.25, 1.6);
  float R = 0.5 + 0.45 * k;
  vec3 p = vec3(aJet.x + position.x * 2.0 * R, uGround + 0.004, aJet.y + position.y * 2.0 * R);
  vL = position.xy * 2.0 * R;
  vK = k;
  vSeed = aVar.w;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

const FILM_FRAG = /* glsl */ `
${SHADE}
uniform float uTime;
varying vec2 vL;
varying vec3 vW;
varying float vK;
varying float vSeed;
float hash(float n) { return fract(sin(n) * 43758.5453); }
// A ring of height running out from c, phase 0 → 1 over its life; adds its slope to s.
void ring(inout vec2 s, vec2 c, float ph, float reach, float amp) {
  vec2 d = vL - c;
  float r = length(d) + 1e-4;
  float x = (r - ph * reach) / 0.025;
  s += d / r * (-2.0 * x * exp(-x * x)) * amp * (1.0 - ph) * smoothstep(0.0, 0.1, ph);
}
void main() {
  float R = 0.5 + 0.45 * vK;
  float d = length(vL);
  if (d > R) discard;
  vec2 s = vec2(0.0);
  // Rings from the falling water's footprint, and smaller ones from single drops landing about it.
  for (int i = 0; i < 3; i++) ring(s, vec2(0.0), fract(uTime / 1.2 + float(i) / 3.0 + vSeed), R, 0.05);
  for (int i = 0; i < 4; i++) {
    float t = uTime / 0.8 + float(i) / 4.0 + vSeed * 1.7;
    float n = floor(t) * 7.13 + float(i) * 3.1 + vSeed * 11.0;
    vec2 c = (vec2(hash(n), hash(n + 1.7)) - 0.5) * 1.2 * R;
    ring(s, c, fract(t), 0.18, 0.04);
  }
  vec3 n = normalize(vec3(-s.x, 1.0, -s.y));
  vec3 v = normalize(cameraPosition - vW);
  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
  vec3 refl = envAt(reflect(-v, n));
  float spec = pow(max(dot(n, normalize(uSun + v)), 0.0), 300.0) * 4.0;
  // Wettest under the jet, drying towards the edge of the film.
  float wet = 1.0 - smoothstep(0.35 * R, R, d);
  vec3 col = mix(vec3(0.015, 0.018, 0.02), refl, fres) + uSunCol * spec;
  gl_FragColor = vec4(col, clamp(wet * (0.28 + 0.7 * fres) + spec * wet, 0.0, 1.0));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export interface Fountain {
  setDaylight(day: boolean): void
  /** Advances the water; true while the fountain is in view and needs another frame. */
  animate(elapsed: number, camera: Camera): boolean
}

/** Builds the fountain's water for `jets` on stone at height `ground` into `parent`. */
export function buildFountain(parent: Object3D, jets: Jet[], ground: number, env: { day: Texture; dusk: Texture }, bounds: Sphere): Fountain {
  const r = rng(4401)
  // Each nozzle's own swell: whole cycles per WRAP, so it repeats seamlessly.
  const variation = jets.map(() => [7 + Math.floor(r() * 7), 17 + Math.floor(r() * 13), 0.04 + r() * 0.05, r() * Math.PI * 2])

  const uniforms = {
    uTime: { value: 0 },
    uGround: { value: ground },
    uEnv: { value: env.dusk },
    uEnvI: { value: 0.45 },
    uSun: { value: new Vector3(0.5, 1.8, 0.4).normalize() },
    uSunCol: { value: new Color(1, 0.96, 0.9) },
    uSky: { value: new Color(0.75, 0.82, 0.9) },
  }

  const quad = (n: number, perJet: number, particle: (i: number) => number[]) => {
    const g = new InstancedBufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]), 3))
    g.setIndex([0, 1, 2, 0, 2, 3])
    const jet = new Float32Array(n * 4)
    const vari = new Float32Array(n * 4)
    const p = new Float32Array(n * 4)
    for (let i = 0; i < n; i++) {
      const j = Math.floor(i / perJet)
      jet.set([jets[j].x, jets[j].z, jets[j].h, jets[j].angle], i * 4)
      vari.set(variation[j], i * 4)
      p.set(particle(i % perJet), i * 4)
    }
    g.setAttribute('aJet', new InstancedBufferAttribute(jet, 4))
    g.setAttribute('aVar', new InstancedBufferAttribute(vari, 4))
    g.setAttribute('aP', new InstancedBufferAttribute(p, 4))
    g.instanceCount = n
    g.boundingSphere = bounds.clone()
    return g
  }

  const meshes: Mesh[] = []
  const add = (geo: InstancedBufferGeometry, vertexShader: string, fragmentShader: string, name: string, order: number) => {
    const mat = new ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: false })
    const m = new Mesh(geo, mat)
    m.name = name
    // Water is seen through, never walked into or tapped (see walk/collider.ts).
    m.renderOrder = order
    m.raycast = () => {}
    m.castShadow = false
    m.receiveShadow = false
    parent.add(m)
    meshes.push(m)
  }

  const n = jets.length
  // Stream drops, launched evenly through the period so the jet never breaks: two in five hold
  // together as the jet's core, the rest drift apart as it breaks into spray at the crown.
  const drop = (i: number) => {
    const core = i % 5 < 2
    const drift = core ? 0.005 + 0.03 * r() : 0.06 + 0.4 * r() ** 1.8
    const width = core ? 0.017 + 0.01 * r() : 0.008 + 0.012 * r()
    return [(i + r() * 0.6) / PER_JET.stream, r() * Math.PI * 2, drift, width]
  }
  add(
    quad(n * PER_JET.stream, PER_JET.stream, drop),
    STREAM_VERT, STREAK_FRAG, 'fountain_jets', 3,
  )
  add(quad(n * PER_JET.splash, PER_JET.splash, () => [r(), r() * Math.PI * 2, r(), r()]), SPLASH_VERT, STREAK_FRAG, 'fountain_splash', 3)
  add(quad(n * PER_JET.mist, PER_JET.mist, () => [r(), r() * Math.PI * 2, r(), r()]), MIST_VERT, MIST_FRAG, 'fountain_mist', 4)
  add(quad(n, 1, () => [0, 0, 0, 0]), FILM_VERT, FILM_FRAG, 'fountain_film', 2)

  const frustum = new Frustum()
  const m4 = new Matrix4()
  const sphere = new Sphere()
  return {
    setDaylight(day) {
      uniforms.uEnv.value = day ? env.day : env.dusk
      uniforms.uEnvI.value = day ? 0.9 : 0.45
      uniforms.uSun.value.set(...((day ? [0.5, 1.8, 0.4] : [0.8, 1.3, 0.55]) as [number, number, number])).normalize()
      uniforms.uSunCol.value.setRGB(...((day ? [1.0, 0.96, 0.9] : [0.75, 0.62, 0.48]) as [number, number, number]))
      uniforms.uSky.value.setRGB(...((day ? [0.75, 0.82, 0.9] : [0.2, 0.23, 0.3]) as [number, number, number]))
    },
    animate(elapsed, camera) {
      uniforms.uTime.value = elapsed % WRAP
      const mesh = meshes[0]
      sphere.copy(bounds).applyMatrix4(mesh.matrixWorld)
      if (camera.position.distanceTo(sphere.center) > 160) return false
      m4.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
      return frustum.setFromProjectionMatrix(m4).intersectsSphere(sphere)
    },
  }
}
