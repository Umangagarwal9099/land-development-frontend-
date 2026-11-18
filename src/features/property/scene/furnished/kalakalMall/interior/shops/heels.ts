import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, Group, Mesh, OctahedronGeometry, SphereGeometry, TubeGeometry, Vector3, type Material, type Object3D } from 'three'

/*
 * Women's high heels, built on a last. Every shoe stands with its heel at local z = 0 and its toe
 * towards +z, on the ground at y = 0, a left shoe (the inside of the foot towards −x); the right
 * is the left mirrored.
 *
 * The parts, as a shoe is made:
 *   the sole     the footprint (heel cup, waist, ball, the toe of its kind: pointed, almond,
 *                round) bent to the pitch of its heel: the seat high at the back, falling through
 *                the shank to the ball on the ground, with a little toe spring
 *   the upper    each side wall rises from the sole's edge over the last's crown, and stops at the
 *                topline of its cut (a pump's low sides and vamp, a slingback's open back, a
 *                d'Orsay's open waist, a sandal's bare footbed); lined inside, bound along its edge
 *   the heel     lofted from the seat to the ground in sections: a stiletto's curve and pinpoint
 *                top-lift, a pencil's straight column, a block, a kitten's tucked heel, a flare, a
 *                sculpted metal heel, a clear heel; or a wedge or a platform under the sole
 *   the straps   ribbons over the last (toe and instep straps), round the ankle, a slingback's band,
 *                a back stay, with their buckles; and the trims: a bow, a crystal brooch, pearls, a
 *                metal toe cap
 */

export type Toe = 'pointed' | 'almond' | 'round'
export type HeelShape = 'stiletto' | 'pencil' | 'block' | 'kitten' | 'flare' | 'sculpted' | 'clear' | 'wedge'
export type Cut = 'pump' | 'slingback' | 'mule' | 'maryjane' | 'ankle' | 'dorsay' | 'sandal' | 'strappy'
export type Trim = 'none' | 'bow' | 'crystal' | 'pearl' | 'toecap' | 'buckle'

export interface HeelSpec {
  cut: Cut
  toe: Toe
  heel: HeelShape
  /** Heel height at the back, in metres (a 100 mm stiletto is 0.1). */
  height: number
  /** A platform under the forefoot, in metres. */
  platform?: number
  upper: Material
  /** The heel's covering, if not the upper's leather. */
  heelMat?: Material
  /** The straps, if not the upper's. */
  strap?: Material
  sole?: Material
  trim?: Trim
  trimMat?: Material
  metal?: Material
}

/** The finishes every shoe shares: lining, sock, soles, top-lifts, findings. */
export interface HeelKit {
  lining: Material
  sock: Material
  sole: Material
  toplift: Material
  gold: Material
  crystal: Material
  pearl: Material
  /** The house's stamp on the sock, painted once (hi detail only). */
  stamp?: Material
}

export type Detail = 'lo' | 'hi'

const PI = Math.PI
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const smooth = (v: number) => {
  const c = clamp01(v)
  return c * c * (3 - 2 * c)
}
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/* ---------- geometry ---------- */

export type P3 = [number, number, number]

/** A grid of points triangulated row to row (rows[i][j]); uvs from the grid's indices scaled. */
export function grid(rows: P3[][], us = 1, vs = 1) {
  const n = rows.length
  const m = rows[0].length
  const pos: number[] = []
  const uv: number[] = []
  for (let i = 0; i < n; i++)
    for (let j = 0; j < m; j++) {
      pos.push(...rows[i][j])
      uv.push((i / (n - 1)) * us, (j / (m - 1)) * vs)
    }
  const idx: number[] = []
  for (let i = 0; i + 1 < n; i++)
    for (let j = 0; j + 1 < m; j++) {
      const a = i * m + j
      const b = (i + 1) * m + j
      idx.push(a, b, b + 1, a, b + 1, a + 1)
    }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/**
 * A strap, band or bar: a flat ribbon of `w` across and `t` thick along a path, its thickness
 * along each point's `out` (the surface's normal under it), its width across the path.
 */
export function ribbon(path: Vector3[], out: Vector3[], w: number, t: number) {
  // Four faces, each its own strip: smooth along the path, crisp at the edges, as a flat strap or bar is.
  const corners: P3[][] = []
  for (let i = 0; i < path.length; i++) {
    const a = path[Math.max(0, i - 1)]
    const b = path[Math.min(path.length - 1, i + 1)]
    const tan = b.clone().sub(a).normalize()
    const o = out[i].clone().normalize()
    const side = new Vector3().crossVectors(tan, o).normalize()
    const p = path[i]
    const c = (sw: number, st: number): P3 => {
      const v = p.clone().addScaledVector(side, (sw * w) / 2).addScaledVector(o, (st * t) / 2)
      return [v.x, v.y, v.z]
    }
    corners.push([c(-1, -1), c(1, -1), c(1, 1), c(-1, 1)])
  }
  const faces = [0, 1, 2, 3].map((f) => grid(corners.map((r) => [r[f], r[(f + 1) % 4]]), path.length / 8, 1))
  return mergeGeometries(faces)!
}

function put(p: Object3D, g: BufferGeometry, m: Material, cast = true) {
  const o = new Mesh(g, m)
  o.castShadow = cast
  o.receiveShadow = true
  p.add(o)
  return o
}

/* ---------- the last ---------- */

interface Last {
  /** Length on the ground, heel back to toe tip. */
  len: number
  /** Underside of the sole over t (0 heel … 1 toe). */
  yb: (t: number) => number
  /** Top of the sole (the footbed). */
  yt: (t: number) => number
  /** Half-widths of the footprint, outside (+x) and inside (−x), and its centre line. */
  wo: (t: number) => number
  wi: (t: number) => number
  xc: (t: number) => number
  /** Height of the last's crown over the footbed. */
  hc: (t: number) => number
}

const SOLE = 0.0042

function last(spec: HeelSpec): Last {
  const H = spec.height
  const P = spec.platform ?? 0
  const foot = spec.toe === 'pointed' ? 0.272 : spec.toe === 'almond' ? 0.262 : 0.252
  // Walked along its curve the sole keeps the foot's length; on the ground a high heel shortens it.
  const len = foot - 0.42 * Math.max(0, H - P) + 0.04 * P
  const ball = 0.64
  const yb = (t: number) => {
    const s = clamp01((t - 0.04) / (ball - 0.04))
    // A steep heel holds the seat level a little longer before the shank falls.
    const f = 1 - smooth(s ** (1 + H * 3))
    const spring = t > 0.86 ? 0.007 * ((t - 0.86) / 0.14) ** 2 : 0
    return P + (H - P) * f + spring
  }
  const W = 0.0415
  const base = (t: number) => {
    if (t < 0.13) {
      const k = (0.13 - t) / 0.13
      return 0.029 * Math.sqrt(Math.max(0, 1 - k * k))
    }
    if (t < 0.45) return lerp(0.029, 0.0265, smooth((t - 0.13) / 0.32))
    if (t < 0.68) return lerp(0.0265, W, smooth((t - 0.45) / 0.23))
    const u = clamp01((t - 0.68) / 0.32)
    if (spec.toe === 'pointed') return W * Math.max(0, 1 - u ** 1.5) ** 0.95
    if (spec.toe === 'almond') return W * Math.max(0, 1 - u ** 2.4) ** 0.55
    return W * Math.max(0, 1 - u ** 3.2) ** 0.45
  }
  // The crown: full over the heel and instep, falling smoothly through the vamp to the toe's tip.
  const tip = spec.toe === 'pointed' ? 0.008 : spec.toe === 'almond' ? 0.012 : 0.018
  const fall = spec.toe === 'pointed' ? 1.25 : spec.toe === 'almond' ? 1.1 : 0.95
  const hc = (t: number) => {
    const s = clamp01((t - 0.3) / 0.7)
    return tip + (0.07 - tip) * (1 - s) ** fall * (1 - 0.06 * smooth(s * 3))
  }
  return {
    len,
    yb,
    yt: (t) => yb(t) + SOLE,
    wo: (t) => base(t),
    wi: (t) => base(t) * (t > 0.5 ? 0.9 : 0.95),
    // The toe of a pointed last points a little to the inside, where the big toe is.
    xc: (t) => (t > 0.6 ? -0.007 * ((t - 0.6) / 0.4) ** 1.5 * (spec.toe === 'pointed' ? 1 : 0.6) : 0),
    hc,
  }
}

/** A point on the last's surface: side σ (+1 outside, −1 inside), angle θ up from the sole's edge. */
function onLast(L: Last, t: number, side: 1 | -1, theta: number, grow = 0): P3 {
  const w = (side > 0 ? L.wo(t) : L.wi(t)) + grow
  const c = Math.cos(theta)
  const s = Math.sin(theta)
  // A squared-off section: the walls rise steeply, then roll over the crown.
  const x = L.xc(t) + side * w * Math.sign(c) * Math.abs(c) ** 0.72
  const y = L.yt(t) - 0.0012 + (L.hc(t) + grow) * Math.abs(s) ** 1.15
  return [x, y, t * L.len]
}

/** How high each cut's upper rises at the sides (above the footbed); at or over the crown it is closed. */
function topline(cut: Cut, toe: Toe, hc: (t: number) => number) {
  const vamp = toe === 'pointed' ? 0.6 : 0.56
  const closedFrom = (t0: number, t1: number, low: number) => (t: number) => (t >= t1 ? 1 : t <= t0 ? low : lerp(low, hc(t) * 1.02, smooth((t - t0) / (t1 - t0))))
  const counter = (t: number) => (t < 0.05 ? 0.058 : t < 0.22 ? lerp(0.058, 0.044, (t - 0.05) / 0.17) : lerp(0.044, 0.03, clamp01((t - 0.22) / 0.2)))
  switch (cut) {
    case 'pump':
    case 'maryjane':
    case 'ankle': {
      const v = closedFrom(vamp - 0.14, vamp, 0.03)
      return (t: number) => (t >= vamp - 0.14 ? v(t) : counter(t))
    }
    case 'dorsay': {
      const v = closedFrom(vamp - 0.12, vamp, 0.004)
      return (t: number) => (t >= vamp - 0.12 ? v(t) : t < 0.2 ? counter(t) : t < 0.27 ? lerp(counter(0.2), 0.004, smooth((t - 0.2) / 0.07)) : 0.004)
    }
    case 'slingback':
    case 'mule': {
      const v = closedFrom(0.36, vamp - 0.02, 0.004)
      return (t: number) => (t >= 0.36 ? v(t) : 0.004)
    }
    case 'sandal':
    case 'strappy':
      return () => 0.004
  }
}

/* ---------- the parts ---------- */

/** One side wall of the upper (or its lining, grown inwards), from the sole's edge up to the topline. */
function sideWall(L: Last, side: 1 | -1, top: (t: number) => number, t0: number, t1: number, nt: number, nth: number, grow: number) {
  const rows: P3[][] = []
  for (let i = 0; i <= nt; i++) {
    const t = lerp(t0, t1, i / nt)
    const h = L.hc(t) + grow
    const th = Math.asin(Math.min(1, Math.max(0, top(t)) / Math.max(h, 1e-4)) ** (1 / 1.15))
    const row: P3[] = []
    for (let j = 0; j <= nth; j++) row.push(onLast(L, t, side, (th * j) / nth, grow))
    rows.push(row)
  }
  return grid(rows, (t1 - t0) * L.len * 12, 0.6)
}

/** The sole as a slab, the footbed on top, its edge all round; `inset` narrows it (for the sock). */
function soleSlab(L: Last, nt: number, y0: (t: number) => number, y1: (t: number) => number, t0 = 0, t1 = 1, inset = 0) {
  const nk = 6
  const at = (t: number, k: number, y: number): P3 => {
    const x = L.xc(t) + lerp(-(Math.max(0, L.wi(t) - inset)), Math.max(0, L.wo(t) - inset), k / nk)
    return [x, y, t * L.len]
  }
  const ts = Array.from({ length: nt + 1 }, (_, i) => lerp(t0, t1, i / nt))
  const top = grid(ts.map((t) => Array.from({ length: nk + 1 }, (_, k) => at(t, k, y1(t)))), L.len * 10, 1)
  const geos = [top]
  if (y0 !== y1) {
    geos.push(grid(ts.map((t) => Array.from({ length: nk + 1 }, (_, k) => at(t, nk - k, y0(t)))), L.len * 10, 1))
    // The edge: outside and inside walls, and the end caps where the slab stops short of heel or toe.
    geos.push(grid(ts.map((t) => [at(t, nk, y0(t)), at(t, nk, y1(t))]), L.len * 10, 0.1))
    geos.push(grid(ts.map((t) => [at(t, 0, y1(t)), at(t, 0, y0(t))]), L.len * 10, 0.1))
    for (const t of [t0, t1]) if (L.wo(t) > 0.002) geos.push(grid([Array.from({ length: nk + 1 }, (_, k) => at(t, k, y0(t))), Array.from({ length: nk + 1 }, (_, k) => at(t, k, y1(t)))], 1, 0.1))
  }
  return geos
}

/** A heel's section at a height: centre z, half-width across and along, squareness. */
interface Section {
  z: number
  a: number
  b: number
  e: number
}

function heelSections(shape: HeelShape, H: number): (u: number) => Section {
  // u: 0 at the ground, 1 at the seat.
  switch (shape) {
    case 'stiletto':
      return (u) => {
        // Slender most of its length, swelling only into the seat.
        const a = 0.0047 + 0.0035 * u + (0.021 - 0.0082) * u ** 4.2
        const b = 0.0049 + 0.0045 * u + (0.027 - 0.0094) * u ** 3.6
        // The back runs nearly straight down; the front curves in to the pin.
        const back = 0.005 + 0.024 * (1 - u) ** 1.4
        return { z: back + b, a, b, e: 2.2 }
      }
    case 'pencil':
      return (u) => {
        const a = 0.0055 + 0.0145 * smooth((u - 0.82) / 0.18)
        const b = 0.006 + 0.021 * smooth((u - 0.82) / 0.18)
        return { z: 0.022 + b * 0.35 + 0.012 * u, a, b, e: 2 }
      }
    case 'block':
      return (u) => ({ z: 0.006 + 0.01 * (1 - u) + lerp(0.021, 0.026, u), a: lerp(0.0175, 0.021, u), b: lerp(0.021, 0.026, u), e: 3.4 })
    case 'clear':
      return (u) => ({ z: 0.008 + 0.006 * (1 - u) + lerp(0.017, 0.024, u), a: lerp(0.014, 0.02, u), b: lerp(0.017, 0.024, u), e: 3.0 })
    case 'kitten':
      return (u) => {
        const waist = 1 - 0.55 * Math.sin(u * PI) ** 0.8
        const a = lerp(0.0065, 0.017, u ** 1.6) * (u > 0.3 ? 1 : waist + 0.2)
        const b = lerp(0.007, 0.022, u ** 1.4)
        // Set under the heel and tucked forward at the tip.
        return { z: 0.007 + 0.018 * (1 - u) ** 1.2 + b, a, b, e: 2.2 }
      }
    case 'flare':
      return (u) => {
        const k = Math.abs(u - 0.42) / 0.58
        return { z: 0.008 + lerp(0.012, 0.024, k ** 1.4) + 0.004 * (1 - u), a: lerp(0.0085, 0.019, k ** 1.4), b: lerp(0.012, 0.024, k ** 1.4), e: 2.4 }
      }
    case 'sculpted':
      return (u) => {
        const a = 0.0062 + (0.019 - 0.0062) * u ** 1.8
        const b = 0.0068 + (0.025 - 0.0068) * u ** 1.6
        // An S in profile: swept back under the seat, forward to the tip.
        return { z: b + 0.006 + 0.016 * Math.sin((1 - u) * PI) * (1 - u * 0.3) + 0.012 * (1 - u), a, b, e: 2 }
      }
    case 'wedge':
      return () => ({ z: 0.03, a: 0.02, b: 0.025, e: 2 })
  }
  void H
}

/** A heel lofted from its seat (the sole's underside) to the ground, with its top-lift. */
function heelLoft(L: Last, shape: HeelShape, ring: number, rows: number) {
  const sec = heelSections(shape, L.yb(0))
  const lift = 0.006
  const seatAt = (z: number) => L.yb(clamp01(z / L.len)) + 0.0015
  const out: P3[][] = []
  for (let k = 0; k <= rows; k++) {
    const u = k / rows
    const s = sec(u)
    const row: P3[] = []
    for (let j = 0; j <= ring; j++) {
      const a = (j / ring) * PI * 2
      const c = Math.cos(a)
      const sn = Math.sin(a)
      const x = Math.sign(c) * Math.abs(c) ** (2 / s.e) * s.a
      const z = s.z + Math.sign(sn) * Math.abs(sn) ** (2 / s.e) * s.b
      // The top ring lies against the sole's pitch; the rest stand evenly up to it.
      const yTop = seatAt(z)
      const y = u >= 1 ? yTop : lift + (seatAt(s.z) - lift) * u
      row.push([x, Math.min(y, yTop), z])
    }
    out.push(row)
  }
  const tip = sec(0)
  return { body: grid(out, 1, 3), tip }
}

/* ---------- the shoe ---------- */

/**
 * One shoe of `spec`, standing heel at the origin, toe to +z. `right` mirrors it. 'hi' detail is
 * for close inspection; 'lo' for the shelves.
 */
export function heelShoe(kit: HeelKit, p: Object3D, spec: HeelSpec, detail: Detail = 'lo', right = false) {
  const outer = new Group()
  p.add(outer)
  if (right) outer.scale.x = -1
  const L = last(spec)
  const hi = detail === 'hi'
  const nt = hi ? 64 : 26
  const nth = hi ? 14 : 6
  const metal = spec.metal ?? kit.gold
  const strapMat = spec.strap ?? spec.upper
  const sole = spec.sole ?? kit.sole

  // The sole and the sock lining over it.
  for (const g of soleSlab(L, nt, L.yb, L.yt)) put(outer, g, sole)
  put(outer, soleSlab(L, nt, (t) => L.yt(t) + 0.0009, (t) => L.yt(t) + 0.0009, 0.0, 1, 0.0018)[0], kit.sock, false)
  if (hi && kit.stamp) {
    // The house's stamp, foil on the sock at the heel seat.
    const t = 0.16
    const g = new BufferGeometry()
    const w = 0.022
    const d = 0.012
    const z0 = t * L.len - d / 2
    const z1 = t * L.len + d / 2
    const y0 = L.yt(z0 / L.len) + 0.0013
    const y1 = L.yt(z1 / L.len) + 0.0013
    g.setAttribute('position', new Float32BufferAttribute([-w / 2, y0, z0, w / 2, y0, z0, w / 2, y1, z1, -w / 2, y1, z1], 3))
    g.setAttribute('uv', new Float32BufferAttribute([1, 0, 0, 0, 0, 1, 1, 1], 2))
    g.setIndex([0, 2, 1, 0, 3, 2])
    g.computeVertexNormals()
    put(outer, g, kit.stamp, false)
  }

  // The upper, lined, bound along its topline.
  const top = topline(spec.cut, spec.toe, L.hc)
  for (const side of [1, -1] as const) {
    put(outer, sideWall(L, side, top, 0, 1, nt, nth, 0), spec.upper)
    put(outer, sideWall(L, side, top, 0, 1, nt, nth, -0.0016), kit.lining, false)
  }
  {
    // The binding: along the outside's edge to the vamp, back along the inside's.
    const pts: Vector3[] = []
    const n = hi ? 60 : 24
    const edge = (t: number, side: 1 | -1) => {
      const h = L.hc(t)
      const tt = top(t)
      if (tt >= h * 0.99 || tt < 0.006) return null
      const th = Math.asin(Math.min(1, tt / h) ** (1 / 1.15))
      return new Vector3(...onLast(L, t, side, th, 0.0004))
    }
    const runs: Vector3[][] = []
    let cur: Vector3[] = []
    const order: [number, 1 | -1][] = []
    for (let i = 0; i <= n; i++) order.push([1 - i / n, 1])
    for (let i = 0; i <= n; i++) order.push([i / n, -1])
    for (const [t, side] of order) {
      const v = edge(t, side)
      if (v) cur.push(v)
      else if (cur.length) {
        runs.push(cur)
        cur = []
      }
    }
    if (cur.length) runs.push(cur)
    void pts
    for (const r of runs) if (r.length > 2) put(outer, new TubeGeometry(new CatmullRomCurve3(r), r.length * 2, 0.0014, hi ? 6 : 4, false), spec.upper, false)
  }

  // The heel, wedge or platform.
  const heelMat = spec.heelMat ?? spec.upper
  if (spec.heel === 'wedge') {
    for (const g of soleSlab(L, nt, () => 0, L.yb, 0, 0.66)) put(outer, g, heelMat)
  } else {
    const { body, tip } = heelLoft(L, spec.heel, hi ? 20 : 9, hi ? 18 : 7)
    put(outer, body, heelMat)
    // The top-lift: a rubber cap at the tip.
    const cap = grid(
      [0, 1].map((k) => {
        const y = k ? 0.006 : 0
        return Array.from({ length: 13 }, (_, j): P3 => {
          const a = (j / 12) * PI * 2
          return [Math.cos(a) * tip.a * 1.02, y, tip.z + Math.sin(a) * tip.b * 1.02]
        })
      }),
    )
    put(outer, cap, kit.toplift, false)
  }
  if ((spec.platform ?? 0) > 0) for (const g of soleSlab(L, nt, () => 0, L.yb, 0.57, 1)) put(outer, g, heelMat)

  /* ---------- straps ---------- */
  const strapOver = (t: number, w: number, from = 0, to = PI) => {
    // Over the foot at t, from the outside's edge to the inside's, standing just off the last.
    const n = hi ? 24 : 10
    const path: Vector3[] = []
    const outs: Vector3[] = []
    for (let i = 0; i <= n; i++) {
      const th = lerp(from, to, i / n)
      const side: 1 | -1 = th <= PI / 2 ? 1 : -1
      const thl = side > 0 ? th : PI - th
      const [x, y, z] = onLast(L, t, side, thl, 0.0016)
      path.push(new Vector3(x, y, z))
      outs.push(new Vector3(x - L.xc(t), y - L.yt(t), 0))
    }
    put(outer, ribbon(path, outs, w, 0.0022), strapMat)
  }
  const strapAcross = (t0: number, t1: number, w: number) => {
    // A strap from the outside at t0 over the instep to the inside at t1.
    const n = hi ? 24 : 10
    const path: Vector3[] = []
    const outs: Vector3[] = []
    for (let i = 0; i <= n; i++) {
      const k = i / n
      const t = lerp(t0, t1, k)
      const th = k * PI
      const side: 1 | -1 = th <= PI / 2 ? 1 : -1
      const [x, y, z] = onLast(L, t, side, side > 0 ? th : PI - th, 0.0018)
      path.push(new Vector3(x, y, z))
      outs.push(new Vector3(x - L.xc(t), y - L.yt(t), 0))
    }
    put(outer, ribbon(path, outs, w, 0.0022), strapMat)
  }
  const ankleY = L.yt(0) + 0.08
  const ankleZ = 0.05
  const ankleStrap = (buckle: boolean, pearls: boolean) => {
    const n = hi ? 40 : 16
    const path: Vector3[] = []
    const outs: Vector3[] = []
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * PI * 2
      // Round the ankle, a little lower at the front than at the back.
      const v = new Vector3(Math.cos(a) * 0.034, ankleY + Math.sin(a) * 0.006, ankleZ + Math.sin(a) * 0.044)
      path.push(v)
      outs.push(new Vector3(Math.cos(a), 0, Math.sin(a)))
    }
    put(outer, ribbon(path, outs, 0.009, 0.0022), strapMat)
    // The back stay, from the counter up to the strap.
    const stay: Vector3[] = []
    const so: Vector3[] = []
    for (let i = 0; i <= 6; i++) {
      const k = i / 6
      stay.push(new Vector3(0, lerp(L.yt(0) + 0.004, ankleY, k), lerp(-0.002, ankleZ - 0.044, k) - 0.001))
      so.push(new Vector3(0, 0, -1))
    }
    put(outer, ribbon(stay, so, 0.012, 0.0022), strapMat)
    if (buckle) buckleAt(outer, metal, 0.0355, ankleY, ankleZ + 0.004, PI / 2)
    if (pearls) {
      const ps = new SphereGeometry(0.0034, hi ? 10 : 6, hi ? 8 : 4)
      for (let i = 0; i < 22; i++) {
        const a = (i / 22) * PI * 2
        const o = new Mesh(ps, kit.pearl)
        o.position.set(Math.cos(a) * 0.0372, ankleY + Math.sin(a) * 0.006, ankleZ + Math.sin(a) * 0.0475)
        o.castShadow = false
        outer.add(o)
      }
    }
  }

  switch (spec.cut) {
    case 'maryjane':
      strapOver(0.44, 0.011, 0, PI)
      buckleAt(outer, metal, L.wo(0.44) + 0.002, L.yt(0.44) + L.hc(0.44) * 0.55, 0.44 * L.len, 0)
      break
    case 'ankle':
      ankleStrap(true, spec.trim === 'pearl')
      break
    case 'slingback': {
      // The band round the heel, from the vamp's sides.
      const n = hi ? 32 : 14
      const path: Vector3[] = []
      const outs: Vector3[] = []
      const ta = 0.4
      for (let i = 0; i <= n; i++) {
        const k = i / n
        const a = -PI / 2 + k * PI * 2 * 0.5
        void a
        const side = k < 0.5 ? 1 : -1
        const kk = k < 0.5 ? k * 2 : (1 - k) * 2
        // From the vamp's side (kk = 0) round the back (kk = 1).
        const tt = lerp(ta, 0, kk ** 0.8)
        const w = (side > 0 ? L.wo(tt) : L.wi(tt)) + 0.003
        const yy = lerp(L.yt(ta) + 0.022, L.yt(0) + 0.05, kk ** 0.9)
        const x = side * w * Math.cos((kk * PI) / 2) ** 0.6
        const z = tt * L.len - (kk > 0.85 ? 0.004 * ((kk - 0.85) / 0.15) : 0)
        path.push(new Vector3(x, yy, z))
        outs.push(new Vector3(x, 0, z - 0.06))
      }
      put(outer, ribbon(path, outs, 0.008, 0.0022), strapMat)
      buckleAt(outer, metal, L.wo(0.16) + 0.004, L.yt(0.16) + 0.042, 0.16 * L.len, PI / 2 - 0.15)
      break
    }
    case 'sandal':
      strapOver(0.84, 0.012)
      strapOver(0.74, 0.008)
      ankleStrap(true, spec.trim === 'pearl')
      break
    case 'strappy':
      strapOver(0.86, 0.006)
      strapOver(0.79, 0.006)
      strapAcross(0.5, 0.66, 0.006)
      strapAcross(0.66, 0.5, 0.006)
      ankleStrap(true, spec.trim === 'pearl')
      break
  }

  /* ---------- trims ---------- */
  const vampT = spec.cut === 'pump' || spec.cut === 'maryjane' || spec.cut === 'ankle' || spec.cut === 'dorsay' ? (spec.toe === 'pointed' ? 0.62 : 0.58) : 0.6
  const crownAt = (t: number) => new Vector3(L.xc(t), L.yt(t) + L.hc(t), t * L.len)
  const trimMat = spec.trimMat ?? spec.upper
  switch (spec.trim) {
    case 'bow': {
      const c = crownAt(vampT + 0.03)
      const bow = new Group()
      bow.position.copy(c)
      bow.rotation.x = -0.35
      outer.add(bow)
      const lobe = new SphereGeometry(1, hi ? 20 : 10, hi ? 12 : 6)
      for (const sx of [-1, 1]) {
        const l = new Mesh(lobe, trimMat)
        l.scale.set(0.016, 0.0055, 0.011)
        l.position.set(sx * 0.0135, 0.002, 0)
        l.rotation.y = sx * 0.25
        l.castShadow = false
        bow.add(l)
        const tail = new Mesh(lobe, trimMat)
        tail.scale.set(0.0045, 0.0025, 0.014)
        tail.position.set(sx * 0.006, -0.001, 0.011)
        tail.rotation.y = sx * 0.4
        bow.add(tail)
      }
      const knot = new Mesh(lobe, trimMat)
      knot.scale.set(0.0055, 0.0055, 0.0065)
      knot.position.set(0, 0.003, 0)
      bow.add(knot)
      break
    }
    case 'crystal':
    case 'buckle': {
      const c = crownAt(vampT + 0.04)
      const b = new Group()
      b.position.copy(c)
      b.position.y += 0.001
      b.rotation.x = -0.4
      outer.add(b)
      const w = 0.03
      const d = 0.02
      // A rounded-square frame, set with stones for the crystal trim.
      for (const [bw, bd, x, z] of [[w, 0.003, 0, -d / 2], [w, 0.003, 0, d / 2], [0.003, d, -w / 2, 0], [0.003, d, w / 2, 0]] as const) {
        const o = put(b, boxGeo(bw, 0.0025, bd), metal, false)
        o.position.set(x, 0, z)
      }
      if (spec.trim === 'crystal') {
        const st = new OctahedronGeometry(0.0028, 0)
        for (let i = 0; i < 5; i++)
          for (let j = 0; j < 3; j++) {
            const o = new Mesh(st, kit.crystal)
            o.position.set(-0.011 + i * 0.0055, 0.0016, -0.0055 + j * 0.0055)
            o.scale.y = 0.6
            o.rotation.y = PI / 4
            b.add(o)
          }
        const fr = new OctahedronGeometry(0.002, 0)
        for (let i = 0; i < 16; i++) {
          const k = i / 16
          const per = k * 2 * (w + d)
          const [x, z] = per < w ? [-w / 2 + per, -d / 2] : per < w + d ? [w / 2, -d / 2 + (per - w)] : per < 2 * w + d ? [w / 2 - (per - w - d), d / 2] : [-w / 2, d / 2 - (per - 2 * w - d)]
          const o = new Mesh(fr, kit.crystal)
          o.position.set(x, 0.0022, z)
          b.add(o)
        }
      }
      break
    }
    case 'toecap': {
      // A metal cap over the point of the toe.
      for (const side of [1, -1] as const) put(outer, sideWall(L, side, () => 1, 0.9, 1, hi ? 10 : 4, nth, 0.0007), metal)
      break
    }
    case 'pearl':
      if (spec.cut !== 'ankle' && spec.cut !== 'sandal' && spec.cut !== 'strappy') {
        const ps = new SphereGeometry(0.0034, hi ? 10 : 6, hi ? 8 : 4)
        for (let i = 0; i < 9; i++) {
          const th = (i / 8) * PI
          const side: 1 | -1 = th <= PI / 2 ? 1 : -1
          const [x, y, z] = onLast(L, vampT + 0.01, side, side > 0 ? th : PI - th, 0.003)
          const o = new Mesh(ps, kit.pearl)
          o.position.set(x, y, z)
          outer.add(o)
        }
      }
      break
  }
  outer.userData.len = L.len
  outer.userData.height = spec.height
  return outer
}

function boxGeo(w: number, h: number, d: number) {
  const x = w / 2
  const y = h / 2
  const z = d / 2
  const f: P3[][][] = [
    [[[-x, -y, z], [-x, y, z]], [[x, -y, z], [x, y, z]]],
    [[[x, -y, -z], [x, y, -z]], [[-x, -y, -z], [-x, y, -z]]],
    [[[x, -y, z], [x, y, z]], [[x, -y, -z], [x, y, -z]]],
    [[[-x, -y, -z], [-x, y, -z]], [[-x, -y, z], [-x, y, z]]],
    [[[-x, y, z], [-x, y, -z]], [[x, y, z], [x, y, -z]]],
    [[[-x, -y, -z], [-x, -y, z]], [[x, -y, -z], [x, -y, z]]],
  ]
  const pos: number[] = []
  for (const [[a, b], [c, d2]] of f) pos.push(...a, ...c, ...d2, ...a, ...d2, ...b)
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.computeVertexNormals()
  return g
}

/** A small buckle: a frame and its prong, facing out along yaw. */
function buckleAt(p: Object3D, metal: Material, x: number, y: number, z: number, yaw: number) {
  const b = new Group()
  b.position.set(x, y, z)
  b.rotation.y = yaw
  p.add(b)
  for (const [w, h, bx, by] of [[0.013, 0.0018, 0, 0.0055], [0.013, 0.0018, 0, -0.0055], [0.0018, 0.013, 0.0056, 0], [0.0018, 0.013, -0.0056, 0]] as const) {
    const o = put(b, boxGeo(w, h, 0.0016), metal, false)
    o.position.set(bx, by, 0.0012)
  }
  const prong = put(b, boxGeo(0.009, 0.0012, 0.0012), metal, false)
  prong.position.set(0.001, 0, 0.002)
  return b
}

/**
 * A pair, as it is shown: the left standing, the right beside it a little behind and turned, both
 * centred on the pair's middle. Returns the group and the pair's length.
 */
export function heelPair(kit: HeelKit, p: Object3D, spec: HeelSpec, detail: Detail = 'lo', gap = 0.11) {
  const g = new Group()
  p.add(g)
  const l = heelShoe(kit, g, spec, detail, false)
  const len = l.userData.len as number
  l.position.set(-gap / 2, 0, -len / 2)
  l.rotation.y = 0.04
  const r = heelShoe(kit, g, spec, detail, true)
  r.position.set(gap / 2, 0, -len / 2 - 0.018)
  r.rotation.y = -0.04
  g.userData.len = len
  return g
}
