import { CylinderGeometry, DoubleSide, ExtrudeGeometry, FrontSide, Group, LatheGeometry, Mesh, MeshPhysicalMaterial, Shape, SphereGeometry, TorusGeometry, Vector2, type BufferGeometry, type Material, type Object3D } from 'three'
import type { Kit } from '../kit'
import { upholstery } from './paints'
import { pillow } from './cloth'

/*
 * Seating for the living and dining hall, after the board's furniture schedule: an upholstered
 * dining chair on oak legs, a curved lounge chair, and the modular sofa with a chaise. Built as
 * manufactured furniture is: solid oak legs and rails, bent upholstered backs, and cushions that
 * are full in the middle and pinched at their seams rather than boxed. Every piece is built facing
 * +z, centred on x, standing on y = 0.
 */

export interface SeatMats {
  oak: Material
  /** Dining chair upholstery. */
  chair: Material
  /** Sofa upholstery. */
  linen: Material
  /** Lounge chair upholstery (double-sided: its back is seen from inside). */
  lounge: Material
  /** Throw cushions, in the board's warm neutrals. */
  accents: Material[]
  dark: Material
}

/** Upholstery: a woven fabric with a sheen and a fine normal relief, at its true scale. */
export function fabric(k: Kit, tone: number[], seed: number, repeat: number, sheen = 0.45, double = false) {
  const paint = upholstery(tone, seed)
  const map = k.tex.painted(256, 256, paint)
  map.repeat.set(repeat, repeat)
  return new MeshPhysicalMaterial({
    map,
    normalMap: k.tex.normalPainted(`d65_fabric_${seed}`, 256, 256, paint, repeat, repeat),
    normalScale: new Vector2(0.35, 0.35),
    roughness: 0.95,
    sheen,
    sheenRoughness: 0.6,
    sheenColor: '#f3ece2',
    side: double ? DoubleSide : FrontSide,
  })
}

const cache = new WeakMap<Kit, Map<string, BufferGeometry>>()
function geo(k: Kit, key: string, make: () => BufferGeometry) {
  let m = cache.get(k)
  if (!m) cache.set(k, (m = new Map()))
  let g = m.get(key)
  if (!g) m.set(key, (g = make()))
  return g
}

function add(parent: Object3D, g: BufferGeometry, mat: Material, x: number, y: number, z: number) {
  const m = new Mesh(g, mat)
  m.position.set(x, y, z)
  m.castShadow = m.receiveShadow = true
  parent.add(m)
  return m
}

/** A tapered round leg, `h` tall, from `r0` at the top to `r1` at the foot. */
function leg(k: Kit, p: Object3D, mat: Material, x: number, z: number, h: number, r0: number, r1: number, y = 0) {
  return add(p, geo(k, `leg${h}|${r0}|${r1}`, () => new CylinderGeometry(r0, r1, h, 14)), mat, x, y + h / 2, z)
}

/**
 * A bent panel: an arc of a circle (radius `R`, centred `R` in front of the panel's middle)
 * across `w`, `t` thick and `h` tall, with softened edges; a chair back curving round the sitter.
 */
function bent(k: Kit, w: number, R: number, t: number, h: number, edge = 0.003) {
  return geo(k, `bent${w}|${R}|${t}|${h}|${edge}`, () => {
    const span = 2 * Math.asin(w / 2 / R)
    const s = new Shape()
    const n = 20
    const pt = (r: number, i: number) => {
      const th = Math.PI - span / 2 + (span * i) / n
      // Plan (x, z) = (r sin θ, R + r cos θ): the arc's middle on z = 0. Shape y = −z.
      return [r * Math.sin(th), -(R + r * Math.cos(th))] as const
    }
    for (let i = 0; i <= n; i++) {
      const [x, y] = pt(R + t / 2, i)
      if (i === 0) s.moveTo(x, y)
      else s.lineTo(x, y)
    }
    for (let i = n; i >= 0; i--) s.lineTo(...pt(R - t / 2, i))
    s.closePath()
    const g = new ExtrudeGeometry(s, { depth: h - 2 * edge, bevelEnabled: true, bevelThickness: edge, bevelSize: edge, bevelSegments: 3 })
    g.rotateX(-Math.PI / 2)
    g.translate(0, edge, 0)
    return g
  })
}

/**
 * The board's dining chair: an upholstered seat and a curved upholstered back on a solid oak
 * frame (tapered legs, the back legs rising as posts that rake back). Seat 470 mm high, 480 ×
 * 500 mm; back 850 mm.
 */
export function diningChair(k: Kit, parent: Object3D, x: number, z: number, ry: number, m: SeatMats) {
  const g = new Group()
  g.position.set(x, 0, z)
  g.rotation.y = ry
  parent.add(g)
  const W = 0.48
  const D = 0.5
  const SEAT = 0.42
  for (const s of [-1, 1]) {
    leg(k, g, m.oak, s * (W / 2 - 0.035), D / 2 - 0.04, SEAT, 0.018, 0.013)
    leg(k, g, m.oak, s * (W / 2 - 0.035), -D / 2 + 0.045, SEAT, 0.018, 0.014)
    const post = add(g, geo(k, 'chairPost', () => new CylinderGeometry(0.015, 0.018, 0.42, 12)), m.oak, s * (W / 2 - 0.04), SEAT + 0.2, -D / 2 + 0.035)
    post.rotation.x = -0.16
    // Side stretchers between front and back legs.
    k.box(g, 0.016, 0.02, D - 0.1, m.oak, s * (W / 2 - 0.035), 0.15, 0)
  }
  // Seat rail in oak, a fitted upholstered seat over it, full and pinched at the welt.
  k.box(g, W - 0.04, 0.05, D - 0.06, m.oak, 0, SEAT - 0.025, 0)
  const pad = add(g, geo(k, 'chairSeat', () => pillow(W, D, 0.1, 43)), m.chair, 0, SEAT + 0.028, 0.005)
  pad.rotation.x = -Math.PI / 2
  pad.scale.z = 0.75
  // Back: a curved upholstered panel between the posts, its top rolled and fuller.
  const back = new Group()
  back.position.set(0, SEAT + 0.13, -D / 2 + 0.03)
  back.rotation.x = -0.16
  g.add(back)
  add(back, bent(k, W - 0.03, 0.55, 0.055, 0.3, 0.02), m.chair, 0, 0, 0)
  return g
}

/** Lathed seat cushion for a round chair: a disc with a full, rolled edge. */
function roundCushion(k: Kit, r: number, t: number) {
  return geo(k, `roundCushion${r}|${t}`, () => {
    const pts: Vector2[] = [new Vector2(0, 0)]
    for (let i = 0; i <= 12; i++) {
      const a = -Math.PI / 2 + (Math.PI * i) / 12
      pts.push(new Vector2(r - t / 2 + (t / 2) * Math.cos(a) * 0.9, t / 2 + (t / 2) * Math.sin(a)))
    }
    pts.push(new Vector2(0, t * 1.08))
    return new LatheGeometry(pts, 48)
  })
}

/**
 * The board's lounge chair: a deep barrel chair in taupe, its rounded back wrapping two-thirds of
 * the way round and finished in a rolled edge, over a fat round seat cushion, on four short
 * splayed oak legs.
 */
export function loungeChair(k: Kit, parent: Object3D, x: number, z: number, ry: number, m: SeatMats) {
  const g = new Group()
  g.position.set(x, 0, z)
  g.rotation.y = ry
  parent.add(g)
  const r = 0.33
  const legH = 0.16
  const seat = 0.41
  const backTop = 0.74
  const wrap = 3.9
  const f = m.lounge
  for (const a of [0.8, 2.35, 3.95, 5.5]) {
    const l = leg(k, g, m.oak, Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72, legH, 0.019, 0.013)
    l.rotation.set(Math.sin(a) * 0.1, 0, -Math.cos(a) * 0.1)
  }
  add(g, geo(k, 'loungeBase', () => new CylinderGeometry(r * 0.96, r * 0.9, 0.1, 40)), f, 0, legH + 0.05, 0)
  // The wrapping back: an outer and an inner wall (slightly flared), closed by a rolled top.
  const th0 = Math.PI - wrap / 2
  const H = backTop - legH
  add(g, geo(k, 'loungeOuter', () => new CylinderGeometry(r + 0.02, r, H, 48, 1, true, th0, wrap)), f, 0, legH + H / 2, 0)
  add(g, geo(k, 'loungeInner', () => new CylinderGeometry(r - 0.07, r - 0.08, H - 0.05, 48, 1, true, th0, wrap)), f, 0, legH + 0.025 + H / 2, 0)
  // A torus arc runs from +x round towards +y; laid flat, that is towards +z, so start it at the
  // back's left end and it wraps behind the seat to the right end.
  const roll = add(g, geo(k, 'loungeRoll', () => new TorusGeometry(r - 0.025, 0.048, 12, 56, wrap)), f, 0, backTop - 0.02, 0)
  roll.rotation.set(Math.PI / 2, 0, -Math.PI / 2 - wrap / 2)
  // The ends of the wrap: rounded arm fronts, the roll finishing in a domed cap over each.
  for (const s of [-1, 1]) {
    const ex = s * Math.sin(wrap / 2) * (r - 0.025)
    const ez = -Math.cos(wrap / 2) * (r - 0.025)
    add(g, geo(k, 'loungeEnd', () => new CylinderGeometry(0.047, 0.047, H - 0.05, 20)), f, ex, legH + (H - 0.05) / 2 + 0.03, ez)
    add(g, geo(k, 'loungeCap', () => new SphereGeometry(0.048, 20, 12)), f, ex, backTop - 0.02, ez)
  }
  add(g, roundCushion(k, r - 0.04, 0.13), f, 0, seat - 0.13, 0.02)
  // A small lumbar cushion against the back.
  const c = add(g, geo(k, 'loungeLumbar', () => pillow(0.4, 0.26, 0.13, 81)), m.accents[1], 0, seat + 0.13, -r + 0.14)
  c.rotation.x = -0.25
  return g
}

/**
 * The board's modular sofa: a low, deep run with a chaise at its right-hand end (as seen sitting
 * in it), in oatmeal linen-weave. A recessed plinth; a seat deck with loose seat cushions; loose
 * back cushions leaning on a low back frame; rounded arms; and throw cushions in the board's
 * neutrals. `len` is the run along x, `deep` its depth; the chaise reaches `chaise` forward.
 */
export function sectional(k: Kit, parent: Object3D, x: number, z: number, ry: number, m: SeatMats, len: number, deep: number, chaise: number, chaiseW = 0.8) {
  // Without a chaise (`chaise` 0) it is a straight sofa of three seats.
  if (chaise <= 0) chaiseW = 0
  const g = new Group()
  g.position.set(x, 0, z)
  g.rotation.y = ry
  parent.add(g)
  const ARM = 0.18
  const DECK = 0.3
  const f = m.linen
  const cx = len / 2 - ARM - chaiseW / 2
  // Plinth, set back so the sofa seems to float.
  k.box(g, len - 0.1, 0.07, deep - 0.1, m.dark, 0, 0.035, 0)
  if (chaise > 0) k.box(g, chaiseW - 0.08, 0.07, chaise, m.dark, cx, 0.035, deep / 2 + chaise / 2 - 0.05)
  // Seat deck, the low back frame and the arms.
  k.soft(g, len, DECK - 0.07, deep, 0.035, f, 0, 0.07 + (DECK - 0.07) / 2, 0)
  if (chaise > 0) k.soft(g, chaiseW, DECK - 0.07, chaise + 0.04, 0.035, f, cx, 0.07 + (DECK - 0.07) / 2, deep / 2 + chaise / 2 - 0.02)
  k.soft(g, len, 0.38, 0.2, 0.06, f, 0, DECK + 0.17, -deep / 2 + 0.1)
  k.soft(g, ARM, 0.32, deep, 0.07, f, -len / 2 + ARM / 2, DECK + 0.1, 0)
  k.soft(g, ARM, 0.32, deep + chaise, 0.07, f, len / 2 - ARM / 2, DECK + 0.1, chaise / 2)
  // Loose seat cushions: two across the run, one long on the chaise; from just in front of the
  // back cushions to the deck's front edge.
  const runW = len - 2 * ARM - chaiseW
  const seatAt = (sx: number, sz: number, w: number, d: number, seed: number) => {
    const c = add(g, geo(k, `seat${w.toFixed(2)}|${d.toFixed(2)}|${seed}`, () => pillow(w, d, 0.16, seed)), f, sx, DECK + 0.055, sz)
    c.rotation.x = -Math.PI / 2
    c.scale.z = 0.72
  }
  const n = chaise > 0 ? 2 : 3
  const back = -deep / 2 + 0.4
  const front = deep / 2 - 0.02
  for (let i = 0; i < n; i++) seatAt(-len / 2 + ARM + (runW / n) * (i + 0.5), (back + front) / 2, runW / n - 0.01, front - back, 50 + i)
  if (chaise > 0) seatAt(cx, (back + front + chaise) / 2, chaiseW - 0.01, front + chaise - back, 53)
  // Back cushions lean on the frame, one per seat and one over the chaise.
  const backAt = (bx: number, w: number, seed: number, lean: number) => {
    const c = add(g, geo(k, `back${w.toFixed(2)}|${seed}`, () => pillow(w, 0.5, 0.2, seed)), f, bx, DECK + 0.29, -deep / 2 + 0.29)
    c.rotation.x = -lean
  }
  for (let i = 0; i < n; i++) backAt(-len / 2 + ARM + (runW / n) * (i + 0.5), runW / n - 0.02, 60 + i, 0.2 + i * 0.03)
  if (chaise > 0) backAt(cx, chaiseW - 0.02, 62, 0.22)
  const throwAt = (tx: number, tz: number, s: number, mat: Material, seed: number, roll: number, yaw: number) => {
    const c = add(g, geo(k, `throw${s}|${seed}`, () => pillow(s, s, 0.15, seed)), mat, tx, DECK + 0.33, tz)
    c.rotation.set(-0.32, yaw, roll)
  }
  // Throw cushions, one at each end, set at slightly different angles.
  throwAt(-len / 2 + ARM + 0.28, -deep / 2 + 0.47, 0.48, m.accents[0], 70, 0.12, 0.25)
  throwAt(len / 2 - ARM - 0.28, -deep / 2 + 0.47, 0.46, m.accents[2], 72, -0.1, -0.2)
  return g
}
