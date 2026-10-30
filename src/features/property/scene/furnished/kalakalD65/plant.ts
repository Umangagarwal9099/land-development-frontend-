import { BufferGeometry, CatmullRomCurve3, DoubleSide, Float32BufferAttribute, Group, LatheGeometry, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, TubeGeometry, Vector2, Vector3, type Material, type Object3D } from 'three'
import type { Kit } from '../kit'
import { rng, type Paint } from '../textures'

/*
 * A potted pothos (Epipremnum), the small trailing houseplant the references show on shelves and
 * counters. Each leaf is its own surface: a heart-shaped blade folded along its midrib, arched to
 * a drooping tip, on a curving stem from the soil; sizes, angles and droop vary leaf by leaf,
 * with a waxy, veined leaf texture in two greens. The pot is turned with a real wall and rim.
 */

/** A pothos leaf: deep green, lighter midrib and curving side veins, faint marbling. */
const leafPaint = (base: number[], seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  const grad = g.createLinearGradient(0, 0, w, 0)
  const c = (d: number) => `rgb(${base.map((v) => Math.max(0, Math.min(255, v + d))).join(',')})`
  grad.addColorStop(0, c(-18))
  grad.addColorStop(0.5, c(8))
  grad.addColorStop(1, c(-18))
  g.fillStyle = grad
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 60; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '210,220,150' : '20,40,10'},${r() * 0.08})`
    g.beginPath()
    g.ellipse(r() * w, r() * h, 2 + r() * 8, 1 + r() * 4, r() * 3, 0, 7)
    g.fill()
  }
  g.strokeStyle = 'rgba(200,215,150,.55)'
  g.lineWidth = 2.2
  g.beginPath()
  g.moveTo(w / 2, 0)
  g.lineTo(w / 2, h)
  g.stroke()
  g.lineWidth = 1
  g.strokeStyle = 'rgba(190,205,140,.35)'
  for (let i = 1; i < 7; i++)
    for (const s of [-1, 1]) {
      const y = (i / 7) * h
      g.beginPath()
      g.moveTo(w / 2, y)
      g.quadraticCurveTo(w / 2 + s * w * 0.25, y + h * 0.04, w / 2 + s * w * 0.46, y + h * 0.16)
      g.stroke()
    }
}

const cache = new WeakMap<Kit, { leaves: BufferGeometry[]; mats: Material[]; stem: Material; soil: Material; pot: BufferGeometry }>()

/**
 * One leaf blade along +z from its base, 1 unit long: heart-shaped outline, folded up along the
 * midrib, arching and drooping to the tip, with a slight wave at the margin.
 */
function leafGeometry(seed: number): BufferGeometry {
  const r = rng(seed)
  const fold = 0.18 + r() * 0.12
  const droop = 0.18 + r() * 0.2
  const wave = 0.01 + r() * 0.015
  const nu = 14
  const nv = 8
  const pos: number[] = []
  const uv: number[] = []
  for (let i = 0; i <= nu; i++) {
    const u = i / nu
    // Heart shape: lobed at the base, widest a third along, tapering to an acuminate tip.
    const hw = 0.42 * Math.pow(Math.sin(Math.PI * (u * 0.88 + 0.12)), 0.7) * (1 - 0.2 * u)
    const notch = u < 0.08 ? (0.08 - u) * 1.2 : 0
    for (let j = 0; j <= nv; j++) {
      const v = (j / nv) * 2 - 1
      const x = v * hw
      const y = Math.abs(v) * hw * fold - u * u * droop + wave * Math.sin(v * 7 + u * 11) * Math.abs(v)
      const z = u - notch * Math.abs(v)
      pos.push(x, y, z)
      uv.push((v + 1) / 2, u)
    }
  }
  const idx: number[] = []
  for (let i = 0; i < nu; i++)
    for (let j = 0; j < nv; j++) {
      const a = i * (nv + 1) + j
      idx.push(a, a + nv + 1, a + 1, a + 1, a + nv + 1, a + nv + 2)
    }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

function assets(k: Kit) {
  let a = cache.get(k)
  if (a) return a
  const leafMat = (base: number[], seed: number) =>
    new MeshPhysicalMaterial({ map: k.tex.painted(128, 256, leafPaint(base, seed)), roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.4, side: DoubleSide })
  const soilPaint: Paint = (g, w, h) => {
    const r = rng(77)
    g.fillStyle = '#3a2c22'
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 2500; i++) {
      g.fillStyle = `rgba(${r() < 0.5 ? '15,10,8' : '110,90,70'},${r() * 0.5})`
      g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2)
    }
  }
  a = {
    leaves: [11, 12, 13, 14, 15].map(leafGeometry),
    mats: [leafMat([58, 96, 46], 1), leafMat([72, 112, 52], 2), leafMat([50, 84, 40], 3)],
    stem: new MeshStandardMaterial({ color: '#5b7a3a', roughness: 0.7 }),
    soil: new MeshStandardMaterial({ map: k.tex.painted(64, 64, soilPaint), roughness: 1 }),
    // A plain cylinder pot with a real wall and a softly rolled rim, 1 unit tall.
    pot: new LatheGeometry([[0, 0], [0.42, 0], [0.44, 0.02], [0.47, 0.92], [0.5, 0.97], [0.49, 1], [0.44, 1], [0.43, 0.95], [0.41, 0.1], [0, 0.1]].map(([x, y]) => new Vector2(x, y)), 40),
  }
  cache.set(k, a)
  return a
}

/**
 * A potted pothos standing at (x, y, z): the pot `s` × 0.13 m tall, with leaves on arching stems
 * spilling over its rim. `pot` is the planter's finish.
 */
export function pottedPothos(k: Kit, parent: Object3D, x: number, y: number, z: number, s: number, pot: Material, seed = 1) {
  const { leaves, mats, stem, soil, pot: potGeo } = assets(k)
  const r = rng(seed * 97 + 3)
  const g = new Group()
  g.position.set(x, y, z)
  g.rotation.y = r() * Math.PI * 2
  parent.add(g)
  const ph = 0.13 * s
  const pr = 0.075 * s
  const p = new Mesh(potGeo, pot)
  p.scale.set(pr * 2, ph, pr * 2)
  p.castShadow = p.receiveShadow = true
  g.add(p)
  const top = ph * 0.9
  const dirt = new Mesh(new LatheGeometry([new Vector2(0, 0.004), new Vector2(pr * 0.86, 0), new Vector2(pr * 0.86, -0.002)], 24), soil)
  dirt.position.y = top
  g.add(dirt)

  // Vines rise from the soil and arch outwards, a few trailing over the rim and down the pot's
  // side; each carries two or three leaves along it on short petioles, the youngest at the tip.
  const leaf = (at: Vector3, heading: number, size: number, i: number) => {
    const m = new Mesh(leaves[i % leaves.length], mats[i % mats.length])
    m.position.copy(at)
    m.scale.setScalar(size)
    // Blade along +z from its base: turned to face out along the vine, tipped down a little
    // (positive x) as pothos leaves hang, and rolled slightly.
    m.rotation.set(0.1 + r() * 0.6, heading + (r() - 0.5) * 0.9, (r() - 0.5) * 0.6, 'YXZ')
    m.castShadow = true
    g.add(m)
  }
  const n = 9 + Math.floor(r() * 4)
  let count = 0
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.5
    const out = new Vector3(Math.cos(a), 0, Math.sin(a))
    const trailing = i % 3 === 0
    const reach = (trailing ? 0.11 + r() * 0.04 : 0.04 + r() * 0.07) * s
    const rise = trailing ? -(0.04 + r() * 0.06) * s : (0.05 + r() * 0.09) * s
    const start = new Vector3(Math.cos(a) * pr * 0.3 * r(), top, Math.sin(a) * pr * 0.3 * r())
    const pts = trailing
      ? [start, start.clone().addScaledVector(out, pr * 0.8).setY(top + 0.025 * s), start.clone().addScaledVector(out, pr * 1.15).setY(top - 0.01 * s), out.clone().multiplyScalar(reach).setY(top + rise)]
      : [start, start.clone().lerp(out.clone().multiplyScalar(reach), 0.4).setY(top + rise * 0.85), out.clone().multiplyScalar(reach).setY(top + rise)]
    const curve = new CatmullRomCurve3(pts)
    g.add(new Mesh(new TubeGeometry(curve, 10, 0.0014 * s + 0.0008, 5, false), stem))
    const heading = Math.PI / 2 - a
    for (const t of trailing ? [0.45, 0.72, 1] : [0.55, 1]) {
      const size = (0.045 + r() * 0.035) * s * (t === 1 ? 0.8 : 1)
      leaf(curve.getPoint(t), heading, size, count++)
    }
  }
  return g
}
