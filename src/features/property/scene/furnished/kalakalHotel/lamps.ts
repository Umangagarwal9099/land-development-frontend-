import { AdditiveBlending, LatheGeometry, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, Vector2, type BufferGeometry, type Object3D } from 'three'
import { PI } from '../kit'
import type { Paint } from '../textures'
import type { HotelCtx } from './building'
import { GL, P, polar } from './plan'

/*
 * The plaza's decorative lamps, set in its dark granite bands from the centre out: a bronze
 * candelabrum of opal globes on a granite drum at the centre, a ring of glowing opal orbs round
 * it, slim post-top lanterns in the middle band and low lantern bollards in the outer one. Gaps
 * are left on the axis from the road to the entrance.
 *
 * Everything is static: plain meshes in a few shared materials, which the model's optimiser merges
 * into a handful of draw calls. The glass glows by its emissive at dusk and is dark opal by day;
 * the warm light each lamp throws on the stone is a soft additive decal, not a real light, so
 * nothing adds to the light count or the shadow pass.
 */

export interface Lamps {
  setDaylight(day: boolean): void
}

/** A turned profile, [radius, height] pairs from the bottom up. */
const turned = (pts: [number, number][], seg = 32) => new LatheGeometry(pts.map(([r, y]) => new Vector2(r, y)), seg)

/** Warm light falling off from the foot of a lamp. */
const pool: Paint = (g, w, h) => {
  const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
  grad.addColorStop(0, 'rgba(255,255,255,0.55)')
  grad.addColorStop(0.35, 'rgba(255,255,255,0.22)')
  grad.addColorStop(0.7, 'rgba(255,255,255,0.06)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, w, h)
}

/** Builds the lamps into `p`; `clear(t)` says whether the outer band is free at `t` degrees round the plaza. */
export function buildLamps(ctx: HotelCtx, p: Object3D, clear: (t: number) => boolean): Lamps {
  const { c, k, lighting, shade } = ctx
  // Dark statuary bronze, and opal glass lit warm from within.
  const bronze = new MeshStandardMaterial({ color: '#3b2f25', metalness: 0.85, roughness: 0.38 })
  const opal = (intensity: number) => lighting.glow(new MeshStandardMaterial({ color: '#efe9de', emissive: '#ffcf96', emissiveIntensity: intensity, roughness: 0.25 }), 0)
  const globe = opal(1.8)
  const orb = opal(1.1)
  const glowMat = new MeshBasicMaterial({ color: '#ffc98c', map: k.tex.painted(128, 128, pool), transparent: true, depthWrite: false, blending: AdditiveBlending })
  const glowGeo = new PlaneGeometry(1, 1).rotateX(-PI / 2)
  const glow = (x: number, z: number, r: number) => {
    const m = new Mesh(glowGeo, glowMat)
    m.position.set(x, GL + 0.006, z)
    m.scale.set(r * 2, 1, r * 2)
    // Light on the stone: seen, never walked into or tapped (see walk/collider.ts).
    m.renderOrder = 2
    m.raycast = () => {}
    m.castShadow = false
    m.receiveShadow = false
    p.add(m)
  }
  const add = (geo: BufferGeometry, mat: MeshStandardMaterial, x: number, y: number, z: number, cast = true) => k.mesh(geo, mat, p, x, y, z, cast)

  // The centrepiece: a granite drum, a fluted bronze column and a crown of six opal globes round a seventh.
  const column = turned([[0, 0], [0.2, 0], [0.2, 0.05], [0.15, 0.1], [0.11, 0.22], [0.075, 0.4], [0.065, 2.7], [0.09, 2.78], [0.09, 2.84], [0.05, 2.9], [0.05, 3.1], [0, 3.1]])
  const cup = turned([[0, 0], [0.07, 0.02], [0.1, 0.08], [0.09, 0.09], [0, 0.04]], 24)
  const crown = turned([[0, 0], [0.46, 0.02], [0.46, 0.045], [0, 0.03]], 48)
  const top = GL + 0.42
  k.cyl(p, 0.55, 0.58, 0.42, c.granite, P.x, GL + 0.21, P.z, 48)
  add(column, bronze, P.x, top, P.z)
  add(crown, bronze, P.x, top + 2.86, P.z)
  for (let i = 0; i < 6; i++) {
    const a = (i * PI) / 3
    const [x, z] = [P.x + 0.42 * Math.cos(a), P.z + 0.42 * Math.sin(a)]
    add(cup, bronze, x, top + 2.88, z)
    k.sphere(p, 0.13, globe, x, top + 3.08, z).castShadow = false
  }
  add(cup, bronze, P.x, top + 3.1, P.z)
  k.sphere(p, 0.17, globe, P.x, top + 3.33, P.z).castShadow = false
  shade.pool(P.x, GL + 0.004, P.z, 0.8, 0.8, 0.55)
  glow(P.x, P.z, 2.6)

  // Opal orbs seated in bronze rings on the inner dark band.
  const seat = turned([[0.2, 0], [0.24, 0], [0.24, 0.05], [0.2, 0.08], [0.2, 0]], 32)
  for (let i = 0; i < 8; i++) {
    const t = 22.5 + i * 45
    const [x, z] = polar(t, 1.8)
    add(seat, bronze, x, GL, z)
    k.sphere(p, 0.26, orb, x, GL + 0.27, z).castShadow = false
    shade.pool(x, GL + 0.004, z, 0.35, 0.35, 0.45)
    glow(x, z, 1.0)
  }

  // Post-top lanterns on the middle dark band: a turned post, an opal drum, a bronze cap and finial.
  const post = turned([[0, 0], [0.13, 0], [0.13, 0.04], [0.1, 0.08], [0.07, 0.2], [0.045, 0.35], [0.042, 2.12], [0.07, 2.16], [0.07, 2.2], [0, 2.2]], 24)
  const cap = turned([[0, 0], [0.15, 0], [0.15, 0.02], [0.06, 0.1], [0.025, 0.13], [0.03, 0.17], [0, 0.2]], 32)
  for (let i = 0; i < 8; i++) {
    const t = 22.5 + i * 45
    const [x, z] = polar(t, 4.22)
    add(post, bronze, x, GL, z)
    k.cyl(p, 0.11, 0.1, 0.36, globe, x, GL + 2.38, z, 32).castShadow = false
    add(cap, bronze, x, GL + 2.56, z)
    shade.pool(x, GL + 0.004, z, 0.3, 0.3, 0.5)
    glow(x, z, 1.7)
  }

  // Low lantern bollards on the outer dark band, an opal window under a bronze cap; none where the white wall stands.
  const body = turned([[0, 0], [0.09, 0], [0.09, 0.02], [0.075, 0.04], [0.075, 0.5], [0, 0.5]], 24)
  const hat = turned([[0, 0], [0.1, 0], [0.1, 0.025], [0.06, 0.06], [0, 0.07]], 24)
  for (let i = 0; i < 12; i++) {
    const t = 15 + i * 30
    if (!clear(t)) continue
    const [x, z] = polar(t, 6.15)
    add(body, bronze, x, GL, z)
    k.cyl(p, 0.07, 0.07, 0.16, orb, x, GL + 0.58, z, 24).castShadow = false
    add(hat, bronze, x, GL + 0.66, z)
    shade.pool(x, GL + 0.004, z, 0.22, 0.22, 0.45)
    glow(x, z, 0.85)
  }

  return {
    setDaylight(day) {
      glowMat.visible = !day
    },
  }
}
