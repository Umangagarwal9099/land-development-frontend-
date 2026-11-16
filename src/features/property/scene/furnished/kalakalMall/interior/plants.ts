import { BufferGeometry, CircleGeometry, CylinderGeometry, Float32BufferAttribute, LatheGeometry, Mesh, MeshStandardMaterial, Quaternion, Vector2, Vector3, type Material, type Object3D } from 'three'
import { rng } from '../../textures'
import type { FloorCtx } from './shell'

/*
 * Indoor landscaping as a landscape contractor would supply it: Kentia palms of three stems with
 * arching fronds, ficus standards with braided trunks and dense crowns, monsteras in low bowls.
 * Leaves are cards cut from a painted atlas (sprigs, frond leaflets, split monstera leaves) and lit
 * as a crown rather than card by card; planters are turned stone or bronze with a brass band, the
 * soil dressed with white river pebbles.
 */

const PI = Math.PI
/** Atlas cells, as UV rectangles [u0, v0, u1, v1] (the canvas's top is v = 1). */
const SPRIG = [0, 0.5, 0.5, 1]
const FROND = [0.5, 0.5, 1, 1]
const MONSTERA = [0, 0, 0.5, 0.5]
const PEBBLES = [0.5, 0, 1, 0.5]

class Cards {
  pos: number[] = []
  nor: number[] = []
  uv: number[] = []
  private add(p: Vector3, n: Vector3, u: number, v: number) {
    this.pos.push(p.x, p.y, p.z)
    this.nor.push(n.x, n.y, n.z)
    this.uv.push(u, v)
  }
  /** A quad from its four corners (a, b along the bottom, c, d along the top), with a shared normal. */
  quad(a: Vector3, b: Vector3, c: Vector3, d: Vector3, n: Vector3, cell: number[], ua = 0, ub = 1, va = 0, vb = 1) {
    const [u0, v0, u1, v1] = cell
    const U = (t: number) => u0 + (u1 - u0) * t
    const V = (t: number) => v0 + (v1 - v0) * t
    this.add(a, n, U(ua), V(va))
    this.add(b, n, U(ub), V(va))
    this.add(c, n, U(ub), V(vb))
    this.add(a, n, U(ua), V(va))
    this.add(c, n, U(ub), V(vb))
    this.add(d, n, U(ua), V(vb))
  }
  geometry() {
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(this.pos, 3))
    g.setAttribute('normal', new Float32BufferAttribute(this.nor, 3))
    g.setAttribute('uv', new Float32BufferAttribute(this.uv, 2))
    return g
  }
}

const stemMats = new WeakMap<object, MeshStandardMaterial>()
function stemMaterial(e: FloorCtx) {
  let m = stemMats.get(e.lux)
  if (!m) {
    m = new MeshStandardMaterial({ color: '#5b6b3a', roughness: 0.7 })
    m.userData.interior = true
    stemMats.set(e.lux, m)
  }
  return m
}

function add(p: Object3D, g: BufferGeometry, m: Material, cast = true) {
  const o = new Mesh(g, m)
  o.castShadow = cast
  o.receiveShadow = true
  p.add(o)
  return o
}

/** A cylinder between two points. */
function rod(p: Object3D, a: Vector3, b: Vector3, r0: number, r1: number, m: Material) {
  const len = a.distanceTo(b)
  const o = add(p, new CylinderGeometry(r1, r0, len, 8), m)
  o.position.copy(a).add(b).multiplyScalar(0.5)
  o.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), b.clone().sub(a).normalize())
  return o
}

/* ---------- planters ---------- */

export type PlanterStyle = 'travertine' | 'nero' | 'bronze' | 'white'

/** A turned planter, top at `h`, radius r; returns the soil level. */
export function planter(e: FloorCtx, p: Object3D, x: number, z: number, r: number, h: number, style: PlanterStyle = 'travertine') {
  const { lux } = e
  const mat = style === 'travertine' ? lux.travertine : style === 'nero' ? lux.wallNero : style === 'white' ? lux.plaster : lux.bronze
  const prof = [new Vector2(0, 0), new Vector2(r * 0.72, 0), new Vector2(r * 0.78, 0.02), new Vector2(r * 0.96, h * 0.85), new Vector2(r, h - 0.03), new Vector2(r, h), new Vector2(r - 0.04, h), new Vector2(r - 0.05, h - 0.06), new Vector2(0, h - 0.06)]
  const body = add(p, new LatheGeometry(prof, 48), mat)
  body.position.set(x, e.y, z)
  const band = add(p, new CylinderGeometry(r * 0.985 + 0.004, r * 0.975 + 0.004, 0.025, 48, 1, true), lux.brass, false)
  band.position.set(x, e.y + h - 0.12, z)
  // Pebbles over the soil.
  const top = new CircleGeometry(r - 0.05, 32)
  const uv = top.getAttribute('uv')
  const [u0, v0, u1, v1] = PEBBLES
  for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + (u1 - u0) * uv.getX(i), v0 + (v1 - v0) * uv.getY(i))
  const peb = add(p, top, lux.leaves, false)
  peb.rotation.x = -PI / 2
  peb.position.set(x, e.y + h - 0.055, z)
  e.shade.pool(x, e.y + 0.012, z, r * 1.25, r * 1.25, 0.45)
  return e.y + h - 0.06
}

/* ---------- plants ---------- */

/** A Kentia palm of three stems, about `height` tall over the soil at y0. */
export function kentia(e: FloorCtx, p: Object3D, x: number, z: number, y0: number, height: number, seed: number) {
  const r = rng(seed)
  const cards = new Cards()
  const stems = stemMaterial(e)
  for (let s = 0; s < 3; s++) {
    const lean = 0.12 + r() * 0.12
    const ang = (s / 3) * PI * 2 + r()
    const h = height * (0.62 + r() * 0.25)
    const base = new Vector3(x + Math.cos(ang) * 0.06, y0, z + Math.sin(ang) * 0.06)
    const top = new Vector3(x + Math.cos(ang) * lean * h * 0.45, y0 + h * 0.62, z + Math.sin(ang) * lean * h * 0.45)
    rod(p, base, top, 0.035, 0.025, stems)
    const fronds = 6 + Math.floor(r() * 3)
    for (let f = 0; f < fronds; f++) {
      const az = (f / fronds) * PI * 2 + r() * 0.5
      const len = h * (0.55 + r() * 0.25)
      const rise = 0.45 + r() * 0.35
      const dir = new Vector3(Math.cos(az), 0, Math.sin(az))
      const side = new Vector3(-dir.z, 0, dir.x)
      const segs = 9
      // The rachis arches up and out, then droops; the leaflets hang either side.
      const at = (t: number) => top.clone().addScaledVector(dir, len * t).add(new Vector3(0, len * (rise * Math.sin(t * PI * 0.75) - 0.35 * t * t), 0))
      for (let i = 0; i < segs; i++) {
        const t0 = i / segs
        const t1 = (i + 1) / segs
        const a = at(t0)
        const b = at(t1)
        const w0 = 0.32 * Math.sin(PI * Math.min(1, t0 + 0.1)) + 0.04
        const w1 = 0.32 * Math.sin(PI * Math.min(1, t1 + 0.1)) + 0.04
        const droop = (t: number) => new Vector3(0, -0.12 * (0.4 + t), 0)
        const n = new Vector3().subVectors(b, a).cross(side).normalize().multiplyScalar(-1).add(new Vector3(0, 0.6, 0)).normalize()
        cards.quad(a.clone().addScaledVector(side, -w0).add(droop(t0)), b.clone().addScaledVector(side, -w1).add(droop(t1)), b.clone().addScaledVector(side, w1).add(droop(t1)), a.clone().addScaledVector(side, w0).add(droop(t0)), n, FROND, t0, t1, 0, 1)
      }
    }
  }
  add(p, cards.geometry(), e.lux.leaves)
}

/** A ficus standard: a braided trunk and a dense rounded crown, `height` over the soil. */
export function ficus(e: FloorCtx, p: Object3D, x: number, z: number, y0: number, height: number, seed: number) {
  const r = rng(seed)
  const { lux } = e
  const crown = new Vector3(x, y0 + height * 0.68, z)
  const R = height * 0.26
  // Three stems braided round each other up to the crown, branching into it.
  for (let s = 0; s < 3; s++) {
    let prev = new Vector3(x, y0, z)
    for (let i = 1; i <= 8; i++) {
      const t = i / 8
      const a = s * (PI * 2 / 3) + t * PI * 2.2
      const pt = new Vector3(x + Math.cos(a) * 0.035, y0 + (crown.y - y0 - R * 0.4) * t, z + Math.sin(a) * 0.035)
      rod(p, prev, pt, 0.03 - t * 0.008, 0.028 - t * 0.008, lux.bark)
      prev = pt
    }
    for (let b = 0; b < 3; b++) {
      const a = r() * PI * 2
      rod(p, prev, crown.clone().add(new Vector3(Math.cos(a) * R * 0.6, (r() - 0.3) * R * 0.6, Math.sin(a) * R * 0.6)), 0.016, 0.008, lux.bark)
    }
  }
  const cards = new Cards()
  const q = new Quaternion()
  const count = Math.round(260 * (height / 2.4) ** 1.5)
  for (let i = 0; i < count; i++) {
    // Points through the crown, denser at its surface.
    const th = r() * PI * 2
    const ph = Math.acos(2 * r() - 1)
    const rr = R * (0.55 + 0.45 * Math.sqrt(r()))
    const out = new Vector3(Math.cos(th) * Math.sin(ph), Math.cos(ph) * 0.8, Math.sin(th) * Math.sin(ph))
    const c = crown.clone().addScaledVector(out, rr)
    c.x += (r() - 0.5) * 0.05
    q.setFromAxisAngle(new Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), r() * PI)
    const s = 0.16 + r() * 0.1
    const ux = new Vector3(s, 0, 0).applyQuaternion(q)
    const uy = new Vector3(0, s, 0).applyQuaternion(q)
    const n = out.clone().normalize().add(new Vector3(0, 0.4, 0)).normalize()
    cards.quad(c.clone().sub(ux).sub(uy), c.clone().add(ux).sub(uy), c.clone().add(ux).add(uy), c.clone().sub(ux).add(uy), n, SPRIG)
  }
  add(p, cards.geometry(), lux.leaves)
}

/** A monstera: big split leaves on long stalks, rising from a low bowl. */
export function monstera(e: FloorCtx, p: Object3D, x: number, z: number, y0: number, seed: number) {
  const r = rng(seed)
  const cards = new Cards()
  const stems = stemMaterial(e)
  for (let i = 0; i < 9; i++) {
    const az = (i / 9) * PI * 2 + r() * 0.4
    const len = 0.45 + r() * 0.4
    const dir = new Vector3(Math.cos(az), 0, Math.sin(az))
    const tip = new Vector3(x, y0, z).addScaledVector(dir, len * 0.55).add(new Vector3(0, len, 0))
    rod(p, new Vector3(x, y0, z), tip, 0.012, 0.009, stems)
    // The blade hangs off the stalk's tip, tilted out and down.
    const s = 0.24 + r() * 0.12
    const side = new Vector3(-dir.z, 0, dir.x)
    const fwd = dir.clone().multiplyScalar(Math.cos(0.5)).add(new Vector3(0, -Math.sin(0.5), 0)).normalize()
    const n = new Vector3().crossVectors(side, fwd).normalize()
    if (n.y < 0) n.negate()
    const a = tip.clone().addScaledVector(side, -s)
    const b = tip.clone().addScaledVector(side, s)
    cards.quad(a, b, b.clone().addScaledVector(fwd, s * 2), a.clone().addScaledVector(fwd, s * 2), n, MONSTERA)
  }
  add(p, cards.geometry(), e.lux.leaves)
}

/** A tall planter with a palm or a ficus in it. */
export function plantedPalm(e: FloorCtx, p: Object3D, x: number, z: number, seed: number, style: PlanterStyle = 'travertine', size = 1) {
  const soil = planter(e, p, x, z, 0.36 * size, 0.72 * size, style)
  kentia(e, p, x, z, soil, 2.0 * size, seed)
}

export function plantedFicus(e: FloorCtx, p: Object3D, x: number, z: number, seed: number, style: PlanterStyle = 'nero', size = 1) {
  const soil = planter(e, p, x, z, 0.4 * size, 0.62 * size, style)
  ficus(e, p, x, z, soil, 2.3 * size, seed)
}

export function plantedMonstera(e: FloorCtx, p: Object3D, x: number, z: number, seed: number, style: PlanterStyle = 'bronze') {
  const soil = planter(e, p, x, z, 0.4, 0.45, style)
  monstera(e, p, x, z, soil, seed)
}
