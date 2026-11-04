import { CatmullRomCurve3, Color, CylinderGeometry, Mesh, TubeGeometry, Vector3, type Material, type Object3D } from 'three'
import { rng } from '../textures'
import type { Planting } from '../kalakalMall/foliage'
import { Tris } from '../kalakalMall/skin'
import type { HotelMaterials } from './materials'

/*
 * The reference's three "capsules": tall screens of black expanded metal, stadium-shaped (round
 * at the top), curved in plan, framed in black steel tube and cut through by a round opening,
 * with creepers climbing them from planters at their foot and trailing from the frame.
 *
 * Each is laid out on its own cylinder: `s` is the distance across the screen (0 on its axis), `y`
 * the height; the screen faces `face` and curves back from it with radius `rc`.
 */

export interface Capsule {
  /** Plan position of the screen's centre line, and the unit direction it faces. */
  x: number
  z: number
  face: [number, number]
  /** Width across (arc length), foot height and overall height. */
  w: number
  y0: number
  h: number
  /** Plan radius of its curve. */
  rc: number
  /** The round opening: centre height and radius. */
  hole?: { y: number; r: number }
  /** Frame tube radius. */
  tube: number
  /** Struts back to the building: how far, and the highest level they can reach (a slab or roof). */
  brace?: { back: number; top: number }
  /** Creepers: 0 for none, 1 for the reference's growth. */
  green: number
  seed: number
}

export class CapsuleFrame {
  private readonly ax: number
  private readonly az: number
  private readonly fx: number
  private readonly fz: number
  readonly rr: number
  readonly spec: Capsule

  constructor(spec: Capsule) {
    this.spec = spec
    const [fx, fz] = spec.face
    this.fx = fx
    this.fz = fz
    this.ax = spec.x - fx * spec.rc
    this.az = spec.z - fz * spec.rc
    this.rr = spec.w / 2
  }

  /** Outward normal at s. */
  normal(s: number) {
    const a = s / this.spec.rc
    // Across the screen runs to the right of the face direction.
    return new Vector3(this.fx * Math.cos(a) + this.fz * Math.sin(a), 0, this.fz * Math.cos(a) - this.fx * Math.sin(a))
  }

  /** The screen's surface at (s, y), `off` in front of it. */
  at(s: number, y: number, off = 0) {
    const n = this.normal(s)
    const r = this.spec.rc + off
    return new Vector3(this.ax + n.x * r, y, this.az + n.z * r)
  }

  /** Top of the screen at s (its round head). */
  top(s: number) {
    const { y0, h } = this.spec
    const rr = this.rr
    return y0 + h - rr + Math.sqrt(Math.max(0, rr * rr - s * s))
  }

  /** The opening's extent at s, or null where s misses it. */
  hole(s: number): [number, number] | null {
    const o = this.spec.hole
    if (!o || Math.abs(s) >= o.r) return null
    const d = Math.sqrt(o.r * o.r - s * s)
    return [o.y - d, o.y + d]
  }

  inside(s: number, y: number) {
    if (Math.abs(s) > this.rr || y < this.spec.y0 || y > this.top(s)) return false
    const o = this.hole(s)
    return !o || y < o[0] || y > o[1]
  }
}

const tube = (parent: Object3D, pts: Vector3[], r: number, mat: Material, closed: boolean, name = '') => {
  if (pts.length < 2) return
  const curve = new CatmullRomCurve3(pts, closed, 'centripetal')
  const m = new Mesh(new TubeGeometry(curve, Math.max(8, pts.length * 2), r, 10, closed), mat)
  m.castShadow = true
  m.receiveShadow = true
  m.name = name
  parent.add(m)
}

const strut = (parent: Object3D, a: Vector3, b: Vector3, r: number, mat: Material) => {
  const len = a.distanceTo(b)
  const m = new Mesh(new CylinderGeometry(r, r, len, 10), mat)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), b.clone().sub(a).normalize())
  m.castShadow = true
  parent.add(m)
}

/** Builds a capsule: mesh, frame, ribs and bracing into `parent`, creepers into `plant`. */
export function buildCapsule(c: HotelMaterials, plant: Planting, parent: Object3D, spec: Capsule, screens: Tris) {
  const f = new CapsuleFrame(spec)
  const { y0, w } = spec
  const rr = f.rr

  // The mesh, in narrow vertical strips (the screen is curved only across), clipped to the
  // round head and round the opening; breakpoints at the opening's sides keep its edge exact.
  const cuts = new Set<number>()
  const n = Math.ceil(w / 0.1)
  for (let i = 0; i <= n; i++) cuts.add(-rr + (w * i) / n)
  if (spec.hole) for (const s of [-spec.hole.r, spec.hole.r]) cuts.add(s)
  const xs = [...cuts].sort((a, b) => a - b)
  for (let i = 0; i < xs.length - 1; i++) {
    const sa = xs[i]
    const sb = xs[i + 1]
    const band = (ya0: number, ya1: number, yb0: number, yb1: number) =>
      screens.quad(f.at(sa, ya0), f.at(sb, yb0), f.at(sb, yb1), f.at(sa, ya1), [sa, ya0], [sb, yb0], [sb, yb1], [sa, ya1])
    if (spec.hole && f.hole((sa + sb) / 2)) {
      // At the opening's very sides its extent closes to a point.
      const shut: [number, number] = [spec.hole.y, spec.hole.y]
      const ha = f.hole(sa) ?? shut
      const hb = f.hole(sb) ?? shut
      band(y0, ha[0], y0, hb[0])
      band(ha[1], f.top(sa), hb[1], f.top(sb))
    } else band(y0, f.top(sa), y0, f.top(sb))
  }

  // The frame: a tube round the outline, a ring round the opening.
  const outline: Vector3[] = []
  for (let y = y0; y < spec.h + y0 - rr; y += 0.5) outline.push(f.at(-rr, y))
  for (let k = 0; k <= 24; k++) {
    const a = Math.PI - (k / 24) * Math.PI
    outline.push(f.at(rr * Math.cos(a), y0 + spec.h - rr + rr * Math.sin(a)))
  }
  for (let y = y0 + spec.h - rr - 0.5; y > y0; y -= 0.5) outline.push(f.at(rr, y))
  outline.push(f.at(rr, y0))
  for (let s = rr - 0.5; s > -rr; s -= 0.5) outline.push(f.at(s, y0))
  outline.push(f.at(-rr, y0))
  tube(parent, outline, spec.tube, c.steel, true, 'capsule_frame')
  if (spec.hole) {
    const { y, r } = spec.hole
    const ring = Array.from({ length: 32 }, (_, k) => f.at(r * Math.cos((k / 32) * Math.PI * 2), y + r * Math.sin((k / 32) * Math.PI * 2)))
    tube(parent, ring, spec.tube * 0.8, c.steel, true, 'capsule_ring')
  }
  // Ribs just behind the mesh: verticals at thirds, rails every 2.4 m, each stopping at the opening.
  const rib = (pts: Vector3[]) => tube(parent, pts, 0.035, c.steel, false)
  for (const s of [-rr / 3, rr / 3]) {
    const o = f.hole(s)
    const run = (a: number, b: number) => {
      const pts: Vector3[] = []
      for (let y = a; y < b; y += 0.8) pts.push(f.at(s, y, -0.07))
      pts.push(f.at(s, b, -0.07))
      rib(pts)
    }
    if (o) {
      run(y0, o[0])
      run(o[1], f.top(s))
    } else run(y0, f.top(s))
  }
  for (let y = y0 + 2.4; y < y0 + spec.h - rr; y += 2.4) {
    let seg: Vector3[] = []
    for (let s = -rr; s <= rr + 1e-6; s += 0.25) {
      if (f.inside(s, y)) seg.push(f.at(s, y, -0.07))
      else {
        rib(seg)
        seg = []
      }
    }
    rib(seg)
  }

  // Bracing back to the building's slab edges, up to the last floor it reaches; above that the
  // screen stands on its own frame.
  if (spec.brace) {
    const { back, top } = spec.brace
    for (const s of [-rr * 0.75, rr * 0.75]) {
      const n = f.normal(s)
      for (let y = y0 + 1.2; y <= Math.min(top, f.top(s)) - 0.4; y += 3) {
        const a = f.at(s, y, -0.07)
        strut(parent, a, a.clone().addScaledVector(n, -back), 0.06, c.steel)
      }
    }
  }

  if (spec.green > 0) creepers(plant, f, spec)
}

/* ---------- creepers ---------- */

/**
 * Creepers on a capsule as in the reference: climbing up the screen from its foot in loose ropes,
 * thickest low down and along the frame; trailing strands hanging from the head and the opening;
 * and a few patches that have taken hold on the open mesh.
 */
function creepers(plant: Planting, f: CapsuleFrame, spec: Capsule) {
  const r = rng(spec.seed)
  const tint = new Color()
  const rr = f.rr
  const leaf = (s: number, y: number, size: number, hang: boolean) => {
    if (!f.inside(s, y) && !hang) return
    const n = f.normal(s)
    const p = f.at(s, y, 0.03 + r() * 0.14)
    const axis = hang
      ? new Vector3((r() - 0.5) * 0.8, -1, (r() - 0.5) * 0.8).addScaledVector(n, 0.4).normalize()
      : new Vector3((r() - 0.5) * 1.4, 0.9, (r() - 0.5) * 1.4).addScaledVector(n, 0.5).normalize()
    // Older leaves low and inside are darker; new growth at the tips is a fresher green.
    const fresh = r() < 0.18 ? 1.15 : 1
    const shade = (0.62 + r() * 0.3) * fresh
    tint.setRGB(0.78 * shade, 0.96 * shade, 0.66 * shade * (fresh > 1 ? 0.9 : 1))
    plant.card(r() < 0.7 ? 'hedge' : 'neem', p, axis, n, size, size * 1.1, Math.floor(r() * 4), tint, n)
  }
  const stem = (pts: [number, number][]) => {
    for (let i = 1; i < pts.length; i++) plant.limb(f.at(pts[i - 1][0], pts[i - 1][1], 0.04), f.at(pts[i][0], pts[i][1], 0.04), 0.012, 0.008)
  }
  const g = spec.green

  // Climbers from the foot.
  const climbers = Math.round(spec.w * 2.6 * g)
  for (let i = 0; i < climbers; i++) {
    // Most hug the frame's sides.
    const edge = r() < 0.55
    let s = edge ? (r() < 0.5 ? -1 : 1) * (rr - 0.15 - r() * 0.5) : (r() * 2 - 1) * (rr - 0.3)
    const reach = spec.y0 + (spec.h - rr) * (0.18 + r() ** 0.7 * (edge ? 0.95 : 0.6))
    let y = spec.y0
    const path: [number, number][] = [[s, y]]
    while (y < reach) {
      y += 0.14
      s += (r() - 0.5) * 0.12
      s = Math.max(-rr + 0.08, Math.min(rr - 0.08, s))
      if (!f.inside(s, y)) {
        // Round the opening's edge rather than through it.
        const o = f.hole(s)
        if (o && y > o[0] && y < o[1]) {
          s += s > 0 ? 0.25 : -0.25
          continue
        }
        break
      }
      if (path.length % 3 === 0) path.push([s, y])
      const density = 1 - (y - spec.y0) / (reach - spec.y0 + 0.01)
      const leaves = 1 + Math.round(density * 2.5 + r())
      for (let k = 0; k < leaves; k++) leaf(s + (r() - 0.5) * 0.35, y + (r() - 0.5) * 0.15, 0.13 + r() * 0.12, false)
    }
    stem(path)
  }

  // Strands trailing down from the head, the sides of the frame and the opening's lower rim.
  const hang = (s: number, y: number, len: number) => {
    let x = s
    for (let d = 0; d < len; d += 0.12) {
      x += (r() - 0.5) * 0.05
      const k = d < len * 0.35 ? 2 : 1
      for (let j = 0; j < k; j++) leaf(x + (r() - 0.5) * 0.12, y - d, 0.11 + r() * 0.1, true)
    }
    plant.limb(f.at(s, y, 0.06), f.at(x, y - len, 0.08), 0.008, 0.004)
  }
  const strands = Math.round(spec.w * 2.2 * g)
  for (let i = 0; i < strands; i++) {
    const s = (r() * 2 - 1) * (rr - 0.1)
    hang(s, f.top(s) - 0.05, 0.6 + r() ** 1.6 * spec.h * 0.28)
  }
  if (spec.hole) {
    const { y, r: hr } = spec.hole
    for (let i = 0; i < Math.round(hr * 5 * g); i++) {
      const a = -Math.PI * (0.15 + r() * 0.7)
      hang(hr * Math.cos(a), y + hr * Math.sin(a), 0.4 + r() * 1.6)
    }
  }

  // Patches holding on to the open mesh.
  for (let p = 0; p < Math.round(spec.w * 0.8 * g); p++) {
    const cs = (r() * 2 - 1) * (rr - 0.4)
    const cy = spec.y0 + (spec.h - rr) * (0.2 + r() * 0.75)
    const size = 0.4 + r() * 0.9
    for (let k = 0; k < size * 40; k++) {
      const a = r() * Math.PI * 2
      const d = Math.sqrt(r()) * size
      leaf(cs + Math.cos(a) * d, cy + Math.sin(a) * d * 1.3, 0.12 + r() * 0.1, false)
    }
  }
}
