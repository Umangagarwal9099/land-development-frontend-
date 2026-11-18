import { Vector3, type Material, type Object3D } from 'three'
import type { Point2 } from '../../../../../api/types'
import type { Kit } from '../kit'
import { Tris } from '../kalakalMall/skin'

/*
 * Geometry for curved facades: plan paths carrying their outward normals and running length, and
 * vertical bands, level strips, fins and lofted skins built along them. UVs are in metres (along
 * the path, and height), so true-scale finishes and the curtain-wall tiles lay without stretching.
 */

/** A point on a plan path: where, which way is out, and how far along the path. */
export interface PP {
  x: number
  z: number
  nx: number
  nz: number
  s: number
}

/** Signed area of a closed plan polygon (positive one way round, negative the other). */
export const area = (poly: Point2[]) => {
  let a = 0
  for (let i = 0; i < poly.length; i++) {
    const [x0, z0] = poly[i]
    const [x1, z1] = poly[(i + 1) % poly.length]
    a += x0 * z1 - x1 * z0
  }
  return a / 2
}

/**
 * A path through `pts` with outward normals. `turn` is which side is out: +1 for the right of the
 * direction of travel seen from above (x right, z down the page), −1 for the left. For a closed
 * outline, pass `closed` and the side is worked out from the outline's winding.
 */
export function path(pts: Point2[], turn: 1 | -1 | 'closed', closed = turn === 'closed'): PP[] {
  const n = pts.length
  const side = turn === 'closed' ? (area(pts) > 0 ? -1 : 1) : turn
  let s = 0
  const out: PP[] = []
  for (let i = 0; i < n; i++) {
    const prev = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)]
    const next = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)]
    let tx = next[0] - prev[0]
    let tz = next[1] - prev[1]
    const l = Math.hypot(tx, tz) || 1
    tx /= l
    tz /= l
    if (i > 0) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
    // The right of travel, seen from above with x across and z down, is (−tz, tx).
    out.push({ x: pts[i][0], z: pts[i][1], nx: -tz * side, nz: tx * side, s })
  }
  if (closed) {
    const [a, b] = [pts[n - 1], pts[0]]
    out.push({ ...out[0], s: s + Math.hypot(b[0] - a[0], b[1] - a[1]) })
  }
  return out
}

/** The part of a path between running lengths a and b, its ends interpolated. */
export function slice(p: PP[], a: number, b: number): PP[] {
  const at = (s: number): PP => {
    for (let i = 1; i < p.length; i++)
      if (p[i].s >= s) {
        const q = p[i - 1]
        const r = p[i]
        const t = r.s === q.s ? 0 : (s - q.s) / (r.s - q.s)
        const nx = q.nx + (r.nx - q.nx) * t
        const nz = q.nz + (r.nz - q.nz) * t
        const l = Math.hypot(nx, nz) || 1
        return { x: q.x + (r.x - q.x) * t, z: q.z + (r.z - q.z) * t, nx: nx / l, nz: nz / l, s }
      }
    return p[p.length - 1]
  }
  return [at(a), ...p.filter((q) => q.s > a && q.s < b), at(b)]
}

/** Where a path point lies `off` metres out from it. */
export const out = (p: PP, off: number): Point2 => [p.x + p.nx * off, p.z + p.nz * off]

type Height = number | ((p: PP) => number)
const h = (y: Height, p: PP) => (typeof y === 'number' ? y : y(p))

/** A quad turned to face `want`, whichever way round its corners were given. */
export function facing(t: Tris, a: Vector3, b: Vector3, c: Vector3, d: Vector3, ua: number[], ub: number[], uc: number[], ud: number[], want: Vector3) {
  const n = new Vector3().subVectors(b, a).cross(new Vector3().subVectors(d, a))
  if (n.dot(want) >= 0) t.quad(a, b, c, d, ua, ub, uc, ud)
  else t.quad(a, d, c, b, ua, ud, uc, ub)
}

/**
 * A vertical band `off` out from the path, from y0 to y1 (either may vary along it), facing out
 * (or in). UVs: metres along the path and up, with `v0` as the height of v = 0.
 */
export function band(t: Tris, p: PP[], off: number, y0: Height, y1: Height, inward = false, v0 = 0) {
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i]
    const b = p[i + 1]
    if (b.s - a.s < 1e-4) continue
    const [ax, az] = out(a, off)
    const [bx, bz] = out(b, off)
    const [a0, a1, b0, b1] = [h(y0, a), h(y1, a), h(y0, b), h(y1, b)]
    if (a1 - a0 < 1e-4 && b1 - b0 < 1e-4) continue
    const want = new Vector3(a.nx + b.nx, 0, a.nz + b.nz).multiplyScalar(inward ? -1 : 1)
    facing(t, new Vector3(ax, a0, az), new Vector3(bx, b0, bz), new Vector3(bx, b1, bz), new Vector3(ax, a1, az), [a.s, a0 - v0], [b.s, b0 - v0], [b.s, b1 - v0], [a.s, a1 - v0], want)
  }
}

/** A level strip at height y between offsets `from` and `to` out from the path, facing up or down; UVs in plan metres. */
export function strip(t: Tris, p: PP[], from: number, to: number, y: Height, up: boolean) {
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i]
    const b = p[i + 1]
    if (b.s - a.s < 1e-4) continue
    const [a0, a1, b0, b1] = [out(a, from), out(a, to), out(b, from), out(b, to)]
    const [ya, yb] = [h(y, a), h(y, b)]
    const v = (q: Point2, y2: number) => new Vector3(q[0], y2, q[1])
    facing(t, v(a0, ya), v(b0, yb), v(b1, yb), v(a1, ya), [a0[0], a0[1]], [b0[0], b0[1]], [b1[0], b1[1]], [a1[0], a1[1]], new Vector3(0, up ? 1 : -1, 0))
  }
}

/**
 * A solid ribbon along the path: a box section `from`..`to` out from it and y0..y1, its top,
 * underside and both faces (and its two ends) — for slab edges, bands, copings.
 */
export function rail(t: Tris, p: PP[], from: number, to: number, y0: Height, y1: Height, ends = true) {
  band(t, p, to, y0, y1)
  band(t, p, from, y0, y1, true)
  strip(t, p, from, to, y1, true)
  strip(t, p, from, to, y0, false)
  if (!ends) return
  for (const [i, j] of [[0, 1], [p.length - 1, p.length - 2]]) {
    const a = p[i]
    const [fx, fz] = out(a, from)
    const [tx, tz] = out(a, to)
    const want = new Vector3(a.x - p[j].x, 0, a.z - p[j].z)
    const [ya, yb] = [h(y0, a), h(y1, a)]
    facing(t, new Vector3(fx, ya, fz), new Vector3(tx, ya, tz), new Vector3(tx, yb, tz), new Vector3(fx, yb, fz), [0, ya], [to - from, ya], [to - from, yb], [0, yb], want)
  }
}

/**
 * Boxes standing along the path every `pitch` metres (evenly spread to fit), `off` out from it:
 * mullions and fins, `w` wide along the path and `d` deep across it, from y0 to y1.
 */
export function fins(k: Kit, parent: Object3D, p: PP[], off: number, y0: Height, y1: Height, pitch: number, w: number, d: number, mat: Material, ends = true) {
  const len = p[p.length - 1].s - p[0].s
  const n = Math.max(1, Math.round(len / pitch))
  for (let i = ends ? 0 : 1; i <= (ends ? n : n - 1); i++) {
    const at = slice(p, p[0].s, p[0].s + (len * i) / n)
    const q = at[at.length - 1]
    const [x, z] = out(q, off)
    const [ya, yb] = [h(y0, q), h(y1, q)]
    if (yb - ya < 0.05) continue
    const m = k.box(parent, w, yb - ya, d, mat, x, (ya + yb) / 2, z)
    m.rotation.y = Math.atan2(q.nx, q.nz)
  }
}

/**
 * A skin lofted through closed plan sections at rising heights (each the same number of points):
 * UVs are metres round the section (measured on the first) and height, so a curtain-wall tile
 * keeps its floors level.
 */
export function loft(t: Tris, sections: { y: number; pts: Point2[] }[], v0 = 0) {
  const n = sections[0].pts.length
  // Running length round the first section, so the mullions stay plumb up the skin.
  const s: number[] = [0]
  const first = sections[0].pts
  for (let i = 1; i <= n; i++) s.push(s[i - 1] + Math.hypot(first[i % n][0] - first[i - 1][0], first[i % n][1] - first[i - 1][1]))
  for (let j = 0; j < sections.length - 1; j++) {
    const A = sections[j]
    const B = sections[j + 1]
    const ca = centroid(A.pts)
    for (let i = 0; i < n; i++) {
      const i2 = (i + 1) % n
      const a0 = new Vector3(A.pts[i][0], A.y, A.pts[i][1])
      const a1 = new Vector3(A.pts[i2][0], A.y, A.pts[i2][1])
      const b1 = new Vector3(B.pts[i2][0], B.y, B.pts[i2][1])
      const b0 = new Vector3(B.pts[i][0], B.y, B.pts[i][1])
      const want = new Vector3((A.pts[i][0] + A.pts[i2][0]) / 2 - ca[0], 0, (A.pts[i][1] + A.pts[i2][1]) / 2 - ca[1])
      facing(t, a0, a1, b1, b0, [s[i], A.y - v0], [s[i + 1], A.y - v0], [s[i + 1], B.y - v0], [s[i], B.y - v0], want)
    }
  }
}

export const centroid = (pts: Point2[]): Point2 => {
  let x = 0
  let z = 0
  for (const [a, b] of pts) {
    x += a
    z += b
  }
  return [x / pts.length, z / pts.length]
}

/** A flat cap over a star-shaped section (fanned from its centroid), facing up or down. */
export function cap(t: Tris, pts: Point2[], y: number, up: boolean) {
  const [cx, cz] = centroid(pts)
  const c = new Vector3(cx, y, cz)
  const want = new Vector3(0, up ? 1 : -1, 0)
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    const va = new Vector3(a[0], y, a[1])
    const vb = new Vector3(b[0], y, b[1])
    const n = new Vector3().subVectors(va, c).cross(new Vector3().subVectors(vb, c))
    if (n.dot(want) >= 0) t.tri(c, va, vb, [cx, cz], [a[0], a[1]], [b[0], b[1]])
    else t.tri(c, vb, va, [cx, cz], [b[0], b[1]], [a[0], a[1]])
  }
}

/** Points along a Catmull-Rom curve through the control points, about `step` metres apart. */
export function spline(ctrl: Point2[], step = 0.3): Point2[] {
  const out: Point2[] = []
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)]
    const p1 = ctrl[i]
    const p2 = ctrl[i + 1]
    const p3 = ctrl[Math.min(ctrl.length - 1, i + 2)]
    const n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step))
    for (let k = 0; k < n; k++) {
      const t = k / n
      const t2 = t * t
      const t3 = t2 * t
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])])
    }
  }
  out.push(ctrl[ctrl.length - 1])
  return out
}

/** Points along a circle's arc round (cx, cz), from angle a0 to a1 (radians, 0 = +z, π/2 = +x). */
export function arc(cx: number, cz: number, r: number, a0: number, a1: number, step = 0.3): Point2[] {
  const n = Math.max(2, Math.ceil((Math.abs(a1 - a0) * r) / step))
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n
    return [cx + r * Math.sin(a), cz + r * Math.cos(a)] as Point2
  })
}
