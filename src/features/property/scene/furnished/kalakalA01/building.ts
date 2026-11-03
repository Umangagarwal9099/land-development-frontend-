import { CatmullRomCurve3, DoubleSide, ExtrudeGeometry, Group, Mesh, MeshStandardMaterial, PlaneGeometry, PointLight, Shape, TubeGeometry, Vector2, Vector3, type Material, type Object3D } from 'three'
import type { Point2 } from '../../../../../api/types'
import type { Kit } from '../kit'
import type { Lighting } from '../shared'
import type { Contact } from '../kalakalMall/contact'
import { shrub, type Planting } from '../kalakalMall/foliage'
import { Tris } from '../kalakalMall/skin'
import { metricBox, sheet } from '../kalakalMall/solids'
import type { A01Materials } from './materials'
import {
  ARCHES, CENTRE, ENTRY_T, GL, L1, L2, LEVELS, MAIN, mainOutline, NOSE, perDeg, polar, R_IN, R_OUT, radial, ROOF, SLAB, SOUTH, southOutline, tangent, WALL, wallTop, wingOutline,
} from './plan'
import { buildCapsule, type Capsule } from './towers'

export interface A01Ctx {
  k: Kit
  c: A01Materials
  lighting: Lighting
  /** Planting gathered across the site, built as a few meshes at the end. */
  plant: Planting
  /** Contact shadows and occlusion, likewise. */
  shade: Contact
  /** On the master plan: trim the forecourt to the layout's skewed road edge. */
  onPlan: boolean
}

const D = Math.PI / 180
const v3 = ([x, z]: Point2, y: number) => new Vector3(x, y, z)
/** Degrees of arc at radius r that span `len` metres. */
const deg = (len: number, r: number) => len / perDeg(r)

/** The rounded end walls wrap this far along each face before the glass begins. */
const CAP_WRAP = 2
/** The entrance doors stand on the chord of the plaza-side glass, ±2.4 m about the axis. */
const DOOR_HALF = 2.4
const DOOR_DEG = Math.asin(DOOR_HALF / R_IN) / D
/** The service frontage at the back of the main building is solid on the ground floor. */
const REAR: [number, number] = [-212, -150]

/** A quad turned to face `want`, whichever way round its corners were given. */
function facing(t: Tris, a: Vector3, b: Vector3, c: Vector3, d: Vector3, ua: number[], ub: number[], uc: number[], ud: number[], want: Vector3) {
  const n = new Vector3().subVectors(b, a).cross(new Vector3().subVectors(d, a))
  if (n.dot(want) >= 0) t.quad(a, b, c, d, ua, ub, uc, ud)
  else t.quad(a, d, c, b, ua, ud, uc, ub)
}

type Level = number | ((t: number) => number)
const at = (l: Level, t: number) => (typeof l === 'number' ? l : l(t))

/**
 * A vertical band on the circle of radius r round P, from angle t0 to t1 and from y0 to y1,
 * facing the plaza (`inward`) or away from it; UVs in metres unless `uv` says otherwise.
 */
function arcBand(t: Tris, r: number, t0: number, t1: number, y0: Level, y1: Level, inward: boolean, uv = (s: number, y: number) => [s, y], step = 0.3) {
  const n = Math.max(1, Math.ceil((Math.abs(t1 - t0) * perDeg(r)) / step))
  for (let i = 0; i < n; i++) {
    const ta = t0 + ((t1 - t0) * i) / n
    const tb = t0 + ((t1 - t0) * (i + 1)) / n
    const sa = (ta - t0) * perDeg(r)
    const sb = (tb - t0) * perDeg(r)
    const [a0, a1, b0, b1] = [at(y0, ta), at(y1, ta), at(y0, tb), at(y1, tb)]
    const [nx, nz] = radial((ta + tb) / 2)
    const want = new Vector3(nx, 0, nz).multiplyScalar(inward ? -1 : 1)
    facing(t, v3(polar(ta, r), a0), v3(polar(tb, r), b0), v3(polar(tb, r), b1), v3(polar(ta, r), a1), uv(sa, a0), uv(sb, b0), uv(sb, b1), uv(sa, a1), want)
  }
}

/** A box on the ring at angle t, radius r: `w` along the arc, `d` across it. */
function ringBox(k: Kit, parent: Object3D, t: number, r: number, w: number, h: number, d: number, y: number, mat: Material, cast = true) {
  const [x, z] = polar(t, r)
  const m = k.box(parent, w, h, d, mat, x, y, z, cast)
  m.rotation.y = t * D
  return m
}

/** [a, b] less the given ranges. */
function less(a: number, b: number, cuts: [number, number][]): [number, number][] {
  let runs: [number, number][] = [[a, b]]
  for (const [c0, c1] of cuts)
    runs = runs.flatMap(([r0, r1]): [number, number][] => {
      if (c1 <= r0 || c0 >= r1) return [[r0, r1]]
      return [[r0, Math.max(r0, c0)], [Math.min(r1, c1), r1]].filter(([x, y]) => y - x > 0.05) as [number, number][]
    })
  return runs
}

/** A level slab with softly rounded edges, its UVs in plan metres. */
function roundSlab(parent: Object3D, poly: Point2[], y0: number, y1: number, mat: Material, name = '') {
  const b = 0.06
  const shape = new Shape(poly.map(([x, z]) => new Vector2(x, -z)))
  const g = new ExtrudeGeometry(shape, { depth: Math.max(0.01, y1 - y0 - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b - 0.005, bevelSegments: 3, curveSegments: 2 })
  g.rotateX(-Math.PI / 2)
  g.translate(0, y0 + b, 0)
  const m = new Mesh(g, mat)
  m.castShadow = true
  m.receiveShadow = true
  m.name = name
  parent.add(m)
  return m
}

/** The side of a closed polygon that is outside it, for contact shade (see Contact.edge). */
const outside = (poly: Point2[]): 1 | -1 => {
  let a = 0
  for (let i = 0; i < poly.length; i++) {
    const [x0, z0] = poly[i]
    const [x1, z1] = poly[(i + 1) % poly.length]
    a += x0 * z1 - x1 * z0
  }
  return a > 0 ? -1 : 1
}

/* ---------- the wings: glass, slabs, interiors ---------- */

interface Wing {
  t0: number
  t1: number
  /** Which end is the rounded white end wall. */
  roundAt: 'start' | 'end'
  outline: (grow?: number, step?: number) => Point2[]
}
const WINGS: Wing[] = [
  { ...SOUTH, roundAt: 'end', outline: southOutline },
  { ...MAIN, roundAt: 'start', outline: mainOutline },
]

/**
 * The glazed run of a wing's face at radius r. On the plaza side the glass runs on round the
 * rounded end; outside, it stops short where the white end wall wraps round.
 */
function glazedRun(w: Wing, r: number, inward = false): [number, number] {
  const wrap = inward ? 0 : deg(CAP_WRAP, r)
  return w.roundAt === 'end' ? [w.t0, w.t1 - wrap] : [w.t0 + wrap, w.t1]
}

/**
 * Points round a wing's rounded end at `out` beyond its glass line, from φ0 to φ1: φ = 0 where
 * it leaves the plaza-side face, π where it meets the outside face.
 */
function capPath(w: Wing, out: number, f0: number, f1: number, n: number): { pts: Point2[]; centre: Point2 } {
  const tEnd = w.roundAt === 'end' ? w.t1 : w.t0
  const dir = w.roundAt === 'end' ? 1 : -1
  const a = (R_OUT - R_IN) / 2 + out
  const centre = polar(tEnd, (R_IN + R_OUT) / 2)
  const [nx, nz] = radial(tEnd)
  const [tx, tz] = tangent(tEnd)
  const pts = Array.from({ length: n + 1 }, (_, i): Point2 => {
    const f = f0 + ((f1 - f0) * i) / n
    return [centre[0] + a * (-Math.cos(f) * nx + dir * Math.sin(f) * tx), centre[1] + a * (-Math.cos(f) * nz + dir * Math.sin(f) * tz)]
  })
  return { pts, centre }
}

/** Where the white end wall takes over from the glass round a rounded end. */
const CAP_SPLIT = Math.PI * 0.72

/** A vertical band along a plan path from y0 to y1, facing away from `centre`; UVs in metres. */
function pathBand(t: Tris, pts: Point2[], y0: number, y1: number, centre: Point2) {
  let s = 0
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, b] = [pts[i], pts[i + 1]]
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    const want = new Vector3((a[0] + b[0]) / 2 - centre[0], 0, (a[1] + b[1]) / 2 - centre[1])
    facing(t, v3(a, y0), v3(b, y0), v3(b, y1), v3(a, y1), [s, y0], [s + len, y0], [s + len, y1], [s, y1], want)
    s += len
  }
}

/** Curtain walls on both faces, floor by floor: glass between white slab bands, mullions at 1.6 m. */
function buildGlazing(ctx: A01Ctx, parent: Object3D) {
  const { c, k } = ctx
  const glass = new Tris()
  const frames = new Tris()
  const solid = new Tris()
  for (const w of WINGS)
    LEVELS.forEach((y, i) => {
      const top = (i < 2 ? LEVELS[i + 1] : ROOF) - SLAB
      for (const [r, inward] of [[R_IN, true], [R_OUT, false]] as const) {
        const [a, b] = glazedRun(w, r, inward)
        const cuts: [number, number][] = []
        if (i === 0 && inward) cuts.push([ENTRY_T - DOOR_DEG, ENTRY_T + DOOR_DEG])
        if (i === 0 && !inward) cuts.push(REAR)
        for (const [t0, t1] of less(a, b, cuts)) {
          arcBand(glass, r, t0, t1, y, top, inward)
          // Sill and head profiles, and a transom over the ground floor's doors.
          const d = inward ? -0.05 : 0.05
          arcBand(frames, r + d, t0, t1, y, y + 0.09, inward)
          arcBand(frames, r + d, t0, t1, top - 0.07, top, inward)
          if (i === 0) arcBand(frames, r + d, t0, t1, 3.3, 3.4, inward)
          const n = Math.max(1, Math.round(((t1 - t0) * perDeg(r)) / 1.6))
          for (let j = 0; j <= n; j++) ringBox(k, parent, t0 + ((t1 - t0) * j) / n, r + d, 0.07, top - y, 0.16, (y + top) / 2, c.mullion)
        }
      }
      // Round the end, the glass carries on as far as the white wall.
      const { pts, centre } = capPath(w, 0, 0, CAP_SPLIT, 16)
      pathBand(glass, pts, y, top, centre)
      const rim = capPath(w, 0.05, 0, CAP_SPLIT, 16).pts
      pathBand(frames, rim, y, y + 0.09, centre)
      pathBand(frames, rim, top - 0.07, top, centre)
      if (i === 0) pathBand(frames, rim, 3.3, 3.4, centre)
      for (let j = 1; j <= 4; j++) {
        const [px, pz] = capPath(w, 0.05, 0, (CAP_SPLIT * j) / 4.4, 1).pts[1]
        const m = k.box(parent, 0.07, top - y, 0.16, c.mullion, px, (y + top) / 2, pz)
        m.rotation.y = Math.atan2(px - centre[0], pz - centre[1])
      }
    })
  // The service frontage behind: white GRC with louvred plant-room openings and service doors.
  arcBand(solid, R_OUT, REAR[0], REAR[1], GL - 0.02, L1 - SLAB, false)
  for (const t of [-202, -187, -163]) {
    const isDoor = t !== -187
    const wid = isDoor ? 1.5 : 3.2
    ringBox(k, parent, t, R_OUT + 0.03, wid, isDoor ? 2.4 : 1.6, 0.06, isDoor ? GL + 1.2 : 2.6, isDoor ? c.greigeMetric : c.shutter)
    ringBox(k, parent, t, R_OUT + 0.06, wid + 0.16, 0.1, 0.1, isDoor ? GL + 2.45 : 3.45, c.mullion)
    if (isDoor) ringBox(k, parent, t, R_OUT + 0.08, 0.5, 0.22, 0.06, GL + 2.75, c.lamp, false)
  }
  glass.mesh(c.shopGlass, parent, 'curtain_glass', false)
  frames.mesh(c.mullion, parent, 'curtain_frames')
  solid.mesh(c.grc, parent, 'service_wall')

  for (const w of WINGS) {
    const line = w.outline(0, 0.5)
    ctx.shade.edge(line, GL + 0.004, 0.9, outside(line), 0.45, true)
  }
}

/** Floor slabs and the roof, banded white; floors, lit ceilings and shop interiors behind the glass. */
function buildFloors(ctx: A01Ctx, parent: Object3D) {
  const { c, k } = ctx
  for (const w of WINGS) {
    const edge = w.outline(NOSE)
    const inner = w.outline(-0.02)
    for (const y of [L1, L2]) roundSlab(parent, edge, y - SLAB, y, c.band, 'slab')
    roundSlab(parent, edge, ROOF - SLAB, ROOF, c.band, 'roof_slab')
    LEVELS.forEach((y, i) => {
      const top = (i < 2 ? LEVELS[i + 1] : ROOF) - SLAB
      sheet(parent, inner, y + 0.004, c.floor)
      sheet(parent, inner, top - 0.004, c.ceiling, true)
      // The shops' back walls, lit, on a line through the middle of the wing; partitions at 7 m.
      const spine = new Tris()
      const [a, b] = glazedRun(w, R_IN + 4.6)
      const uv = (s: number, yy: number) => [s / 22, (yy - y) / (top - y)]
      arcBand(spine, R_IN + 4.6, a, b, y, top, true, uv, 0.6)
      arcBand(spine, R_IN + 4.8, a, b, y, top, false, uv, 0.6)
      spine.mesh(c.shops, parent, 'shops', false)
      const n = Math.max(1, Math.round(((b - a) * perDeg(R_IN)) / 7))
      for (let j = 1; j < n; j++) {
        const t = a + ((b - a) * j) / n
        if (i === 0 && Math.abs(t - ENTRY_T) < DOOR_DEG + 4) continue
        ringBox(k, parent, t, R_IN + 2.4, 0.14, top - y, 4.0, (y + top) / 2, c.whiteMetric, false)
      }
    })
  }
}

/* ---------- white walls ---------- */

/**
 * A wall standing on a plan path, `thick` deep behind its face, from y0 to `top(i)` at each point;
 * `outAt` says roughly which way its face looks.
 */
function pathWall(t: Tris, pts: Point2[], y0: number, top: (i: number) => number, thick: number, outAt: (p: Point2) => Point2) {
  const n = pts.length
  const normals = pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)]
    const b = pts[Math.min(n - 1, i + 1)]
    let nx = -(b[1] - a[1])
    let nz = b[0] - a[0]
    const l = Math.hypot(nx, nz) || 1
    nx /= l
    nz /= l
    const [ox, oz] = outAt(p)
    return (nx * ox + nz * oz >= 0 ? [nx, nz] : [-nx, -nz]) as Point2
  })
  const back = pts.map(([x, z], i): Point2 => [x - normals[i][0] * thick, z - normals[i][1] * thick])
  let s = 0
  for (let i = 0; i < n - 1; i++) {
    const len = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1])
    const want = new Vector3(normals[i][0] + normals[i + 1][0], 0, normals[i][1] + normals[i + 1][1])
    const [ya, yb] = [top(i), top(i + 1)]
    facing(t, v3(pts[i], y0), v3(pts[i + 1], y0), v3(pts[i + 1], yb), v3(pts[i], ya), [s, y0], [s + len, y0], [s + len, yb], [s, ya], want)
    facing(t, v3(back[i], y0), v3(back[i + 1], y0), v3(back[i + 1], yb), v3(back[i], ya), [s, y0], [s + len, y0], [s + len, yb], [s, ya], want.clone().negate())
    facing(t, v3(pts[i], ya), v3(pts[i + 1], yb), v3(back[i + 1], yb), v3(back[i], ya), [s, 0], [s + len, 0], [s + len, thick], [s, thick], new Vector3(0, 1, 0))
    s += len
  }
  // Its two ends.
  for (const [i, j] of [[0, 1], [n - 1, n - 2]]) {
    const dir = new Vector3(pts[i][0] - pts[j][0], 0, pts[i][1] - pts[j][1])
    facing(t, v3(pts[i], y0), v3(back[i], y0), v3(back[i], top(i)), v3(pts[i], top(i)), [0, y0], [thick, y0], [thick, top(i)], [0, top(i)], dir)
  }
}

/** The rounded white ends of the wings, rising past the roof as a solid parapet, and the flat cheeks at the gap. */
function buildEndWalls(ctx: A01Ctx, parent: Object3D) {
  const { c, k } = ctx
  const walls = new Tris()
  const out = NOSE + 0.1
  const rOut = R_OUT + out
  for (const w of WINGS) {
    // A white fin round the outer side of the rounded end, wrapping onto the outside face: the
    // reference's white curve beside the glass corner.
    const tEnd = w.roundAt === 'end' ? w.t1 : w.t0
    const dir = w.roundAt === 'end' ? 1 : -1
    const { pts, centre } = capPath(w, out, CAP_SPLIT, Math.PI, 24)
    const wrapOut = deg(CAP_WRAP + 0.2, rOut)
    for (let i = 1; i <= 8; i++) pts.push(polar(tEnd - dir * wrapOut * (i / 8), rOut))
    // Deep enough that its back reaches behind the glass it meets.
    pathWall(walls, pts, GL - 0.02, () => ROOF + 1.2, out + 0.08, ([x, z]) => [x - centre[0], z - centre[1]])
    ctx.shade.edge(pts, GL + 0.004, 0.9, 1, 0.45)
    ctx.shade.edge(pts, GL + 0.004, 0.9, -1, 0.45)
  }
  // Flat cheeks either side of the gap between the south wing and the centre.
  for (const [t, side] of [[SOUTH.t0, -1], [MAIN.t1, 1]] as const) {
    const [tx, tz] = tangent(t)
    const [x, z] = polar(t, (R_IN + R_OUT) / 2)
    const h = ROOF + 1.2 - GL + 0.02
    const m = k.mesh(metricBox(0.3, h, R_OUT - R_IN + 2 * out), c.grc, parent, x + tx * side * 0.15, GL - 0.02 + h / 2, z + tz * side * 0.15)
    m.rotation.y = t * D
  }
  walls.mesh(c.grc, parent, 'end_walls')
}

/**
 * The white wall before the north wing: rising out of the plaza at the centre's edge in a long
 * curve to the first floor, then running on to the north tip, cut through by two round arches.
 */
function buildSweepWall(ctx: A01Ctx, parent: Object3D) {
  const { c, k } = ctx
  const wall = new Tris()
  const rf = WALL.r - WALL.thick / 2
  const rb = WALL.r + WALL.thick / 2
  const arch = (t: number) => ARCHES.find((a) => Math.abs((t - a.t) * perDeg(WALL.r)) < a.half - 1e-6)
  const archTop = (t: number, a: (typeof ARCHES)[number]) => {
    const s = (t - a.t) * perDeg(WALL.r)
    return GL + a.spring + Math.sqrt(Math.max(0, a.half * a.half - s * s))
  }
  // Column breakpoints every ~8 cm, plus each arch's sides.
  const cuts = new Set<number>()
  const n = Math.ceil(((WALL.t1 - WALL.t0) * perDeg(WALL.r)) / 0.08)
  for (let i = 0; i <= n; i++) cuts.add(WALL.t0 + ((WALL.t1 - WALL.t0) * i) / n)
  for (const a of ARCHES) for (const s of [-1, 1]) cuts.add(a.t + s * deg(a.half, WALL.r))
  const ts = [...cuts].sort((x, y) => x - y)
  const up = new Vector3(0, 1, 0)
  for (let i = 0; i < ts.length - 1; i++) {
    const ta = ts[i]
    const tb = ts[i + 1]
    const sa = (ta - WALL.t0) * perDeg(WALL.r)
    const sb = (tb - WALL.t0) * perDeg(WALL.r)
    const ar = arch((ta + tb) / 2)
    const [ya0, yb0] = ar ? [archTop(ta, ar), archTop(tb, ar)] : [GL - 0.02, GL - 0.02]
    const [ya1, yb1] = [wallTop(ta) + GL, wallTop(tb) + GL]
    const [nx, nz] = radial((ta + tb) / 2)
    const toPlaza = new Vector3(-nx, 0, -nz)
    facing(wall, v3(polar(ta, rf), ya0), v3(polar(tb, rf), yb0), v3(polar(tb, rf), yb1), v3(polar(ta, rf), ya1), [sa, ya0], [sb, yb0], [sb, yb1], [sa, ya1], toPlaza)
    facing(wall, v3(polar(ta, rb), ya0), v3(polar(tb, rb), yb0), v3(polar(tb, rb), yb1), v3(polar(ta, rb), ya1), [sa, ya0], [sb, yb0], [sb, yb1], [sa, ya1], toPlaza.clone().negate())
    facing(wall, v3(polar(ta, rf), ya1), v3(polar(tb, rf), yb1), v3(polar(tb, rb), yb1), v3(polar(ta, rb), ya1), [sa, 0], [sb, 0], [sb, WALL.thick], [sa, WALL.thick], up)
    if (ar) facing(wall, v3(polar(ta, rf), ya0), v3(polar(tb, rf), yb0), v3(polar(tb, rb), yb0), v3(polar(ta, rb), ya0), [sa, 0], [sb, 0], [sb, WALL.thick], [sa, WALL.thick], up.clone().negate())
  }
  // The arches' jambs, and the wall's two ends.
  const jamb = (t: number, y0: number, y1: number, want: Vector3) =>
    facing(wall, v3(polar(t, rf), y0), v3(polar(t, rb), y0), v3(polar(t, rb), y1), v3(polar(t, rf), y1), [0, y0], [WALL.thick, y0], [WALL.thick, y1], [0, y1], want)
  for (const a of ARCHES)
    for (const s of [-1, 1] as const) {
      const t = a.t + s * deg(a.half, WALL.r)
      const [tx, tz] = tangent(t)
      jamb(t, GL - 0.02, GL + a.spring, new Vector3(-s * tx, 0, -s * tz))
    }
  for (const [t, s] of [[WALL.t0, -1], [WALL.t1, 1]] as const) {
    const [tx, tz] = tangent(t)
    jamb(t, GL - 0.02, wallTop(t) + GL, new Vector3(s * tx, 0, s * tz))
  }
  wall.mesh(c.grc, parent, 'sweep_wall')

  // The arcade behind it: its roof is the first floor carried out to the wall, lit by downlights.
  const flat = wingOutline(WALL.t0, WALL.rise, WALL.r + WALL.thick / 2 - 0.02, R_IN - NOSE + 0.02, { start: false, end: false })
  roundSlab(parent, flat, L1 - SLAB, L1, c.band, 'arcade_roof')
  for (let t = WALL.t0 + 3; t < WALL.rise - 1; t += deg(2.2, 9.6)) k.cyl(parent, 0.09, 0.09, 0.02, c.downlight, ...xz(polar(t, 9.6), L1 - SLAB - 0.01), 14).castShadow = false

  // Shade at its foot: running round with increasing t, the plaza lies to the right.
  const foot = (r: number) => Array.from({ length: Math.ceil(WALL.t1 - WALL.t0) * 2 + 1 }, (_, i) => polar(Math.min(WALL.t1, WALL.t0 + i / 2), r))
  ctx.shade.edge(foot(rf), GL + 0.004, 0.6, -1, 0.4)
  ctx.shade.edge(foot(rb), GL + 0.004, 0.6, 1, 0.4)
}

const xz = ([x, z]: Point2, y: number): [number, number, number] => [x, y, z]

/* ---------- the entrance ---------- */

function buildEntrance(ctx: A01Ctx, parent: Object3D) {
  const { c, k, lighting } = ctx
  // The doors stand on the chord between the ends of the curved glass, facing the plaza.
  const chord = Math.sqrt(R_IN * R_IN - DOOR_HALF * DOOR_HALF)
  const g = new Group()
  const [x, z] = polar(ENTRY_T, chord)
  g.position.set(x, 0, z)
  g.rotation.y = ENTRY_T * D + Math.PI
  parent.add(g)

  // Automatic sliding doors under a head box, two fixed side lights, a glazed transom to the slab.
  const head = 3.3
  const top = L1 - SLAB
  const leaf = (2 * DOOR_HALF) / 4
  for (let i = 0; i <= 4; i++) k.box(g, 0.09, top - GL, 0.16, c.mullion, -DOOR_HALF + i * leaf, (GL + top) / 2, 0)
  for (let i = 0; i < 4; i++) {
    const lx = -DOOR_HALF + (i + 0.5) * leaf
    const slide = i === 1 || i === 2 ? 0.1 : 0
    k.box(g, leaf - 0.1, head - GL - 0.1, 0.03, c.tintGlass, lx, (GL + head) / 2, 0.02 + slide, false)
    if (slide) k.box(g, 0.03, 1.1, 0.05, c.chromeRail, lx + (i === 1 ? leaf / 2 - 0.14 : -leaf / 2 + 0.14), GL + 1.1, 0.08 + slide)
  }
  k.box(g, 2 * DOOR_HALF, top - head - 0.32, 0.03, c.tintGlass, 0, (head + 0.32 + top) / 2, 0, false)
  k.box(g, 2 * DOOR_HALF + 0.1, 0.32, 0.36, c.mullion, 0, head + 0.16, 0.12)
  k.box(g, 0.3, 0.06, 0.08, c.plantDark, 0, head - 0.02, 0.33, false)
  k.box(g, 2 * DOOR_HALF + 0.1, 0.1, 0.18, c.mullion, 0, top - 0.05, 0)
  // Entrance mat, flush in the stone.
  k.box(g, 2 * DOOR_HALF, 0.008, 2.0, c.plantDark, 0, GL + 0.004, 1.1, false)

  // A white blade canopy over the doors, its front corners rounded, lit from beneath.
  const cw = 7.4
  const cd = 3.0
  const cr = 1.2
  const s = new Shape()
  s.moveTo(-cw / 2, 0)
  s.lineTo(cw / 2, 0)
  s.lineTo(cw / 2, -(cd - cr))
  s.absarc(cw / 2 - cr, -(cd - cr), cr, 0, -Math.PI / 2, true)
  s.lineTo(-cw / 2 + cr, -cd)
  s.absarc(-cw / 2 + cr, -(cd - cr), cr, -Math.PI / 2, -Math.PI, true)
  s.closePath()
  const geo = new ExtrudeGeometry(s, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 })
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, 3.95, 0.05)
  const canopy = new Mesh(geo, c.band)
  canopy.castShadow = true
  canopy.receiveShadow = true
  canopy.name = 'entrance_canopy'
  g.add(canopy)
  for (const lx of [-2.6, -0.9, 0.9, 2.6]) for (const lz of [0.9, 2.1]) k.cyl(g, 0.08, 0.08, 0.02, c.downlight, lx, 3.9, lz, 14).castShadow = false
  for (const lx of [-1.6, 1.6]) {
    const l = lighting.light(new PointLight('#ffd7a3', 7, 10, 2), 0)
    l.position.set(lx, 3.4, 1.6)
    g.add(l)
  }
  ctx.shade.rect(x, GL + 0.006, z + 1.6, cw * 0.9, cd * 0.8, 0, 0.14)
  const lobby = lighting.light(new PointLight('#ffe2bb', 12, 14, 2), 0.2)
  lobby.position.set(...xz(polar(ENTRY_T, R_IN + 3), 3.6))
  parent.add(lobby)
}

/** A spiral stair in the centre's lobby, seen through the glass beside the entrance as in the reference. */
function buildStair(ctx: A01Ctx, parent: Object3D) {
  const { c, k } = ctx
  const [cx, cz] = polar(-197, R_IN + 2.5)
  const steps = 26
  const rise = (L1 - GL) / steps
  const turn = (300 / steps) * D
  k.cyl(parent, 0.11, 0.11, L1 - GL + 1.0, c.steel, cx, (GL + L1 + 1.0) / 2, cz, 16)
  const helix: Vector3[] = []
  const rail: Vector3[] = []
  for (let i = 0; i < steps; i++) {
    const a = i * turn
    const y = GL + (i + 1) * rise
    const tread = k.box(parent, 1.25, 0.05, 0.42, c.tread, cx + Math.cos(a) * 0.75, y - 0.025, cz + Math.sin(a) * 0.75)
    tread.rotation.y = -a
    helix.push(new Vector3(cx + Math.cos(a) * 1.4, y - 0.12, cz + Math.sin(a) * 1.4))
    rail.push(new Vector3(cx + Math.cos(a) * 1.4, y + 0.95, cz + Math.sin(a) * 1.4))
  }
  for (const [pts, r] of [[helix, 0.07], [rail, 0.025]] as const) {
    const m = new Mesh(new TubeGeometry(new CatmullRomCurve3(pts), steps * 4, r, 8), c.steel)
    m.castShadow = true
    parent.add(m)
  }
  // A glass balustrade along the outer edge.
  const bal = new Tris()
  for (let i = 0; i < steps - 1; i++) bal.quad(helix[i], helix[i + 1], rail[i + 1], rail[i], [0, 0], [1, 0], [1, 1], [0, 1])
  bal.mesh(c.tintGlass, parent, 'stair_glass', false)
}

/* ---------- roof ---------- */

function buildRoof(ctx: A01Ctx, parent: Object3D) {
  const { c, k } = ctx
  // The centre's roof runs out over the plaza as a thin cantilevered canopy.
  const canopy = wingOutline(CENTRE.t0 + 3, CENTRE.t1 - 3, R_IN - 2.4, R_IN - NOSE + 0.05, { start: false, end: false })
  roundSlab(parent, canopy, ROOF - 0.5, ROOF + 0.05, c.band, 'roof_canopy')
  for (let t = CENTRE.t0 + 5; t < CENTRE.t1 - 4; t += deg(2.0, R_IN - 1.4)) k.cyl(parent, 0.08, 0.08, 0.02, c.downlight, ...xz(polar(t, R_IN - 1.4), ROOF - 0.51), 14).castShadow = false

  // Frameless glass balustrades round the roof terraces, with a slim steel top rail.
  const glass = new Tris()
  const rail = new Tris()
  for (const w of WINGS) {
    const { pts, centre } = capPath(w, NOSE - 0.12, 0, CAP_SPLIT, 16)
    pathBand(glass, pts, ROOF, ROOF + 1.1, centre)
    pathBand(rail, capPath(w, NOSE - 0.09, 0, CAP_SPLIT, 16).pts, ROOF + 1.1, ROOF + 1.16, centre)
    for (const [r, inward] of [[R_IN - NOSE + 0.12, true], [R_OUT + NOSE - 0.12, false]] as const) {
      const [a, b] = glazedRun(w, r, inward)
      for (const [t0, t1] of inward ? less(a, b, [[CENTRE.t0 + 3, CENTRE.t1 - 3]]) : [[a, b] as [number, number]]) {
        arcBand(glass, r, t0, t1, ROOF, ROOF + 1.1, inward)
        arcBand(rail, r + (inward ? -0.03 : 0.03), t0, t1, ROOF + 1.1, ROOF + 1.16, inward)
      }
    }
  }
  const edge = R_IN - 2.4 + 0.15
  arcBand(glass, edge, CENTRE.t0 + 3, CENTRE.t1 - 3, ROOF + 0.05, ROOF + 1.15, true)
  arcBand(rail, edge - 0.03, CENTRE.t0 + 3, CENTRE.t1 - 3, ROOF + 1.15, ROOF + 1.21, true)
  glass.mesh(c.tintGlass, parent, 'roof_balustrade', false)
  rail.mesh(c.steel, parent, 'roof_rail')

  // Stair and lift headrooms, and condensers set back on the main roof's outer side.
  const room = (t: number, r: number, w: number, d: number, h: number) => {
    const [x, z] = polar(t, r)
    const m = k.mesh(metricBox(w, h, d), c.grc, parent, x, ROOF + h / 2, z)
    m.rotation.y = t * D
    ringBox(k, parent, t, r, w + 0.15, 0.12, d + 0.15, ROOF + h + 0.06, c.coping)
    ctx.shade.rect(x, ROOF + 0.005, z, w + 0.6, d + 0.6, -t * D, 0.5)
  }
  room(-214, 15.6, 4.2, 4.6, 3.0)
  room(-100, 15.4, 3.6, 4.4, 2.8)
  for (const t of [-178, -186, -194]) {
    const [x, z] = polar(t, 16.6)
    ringBox(k, parent, t, 16.6, 1.0, 0.25, 1.9, ROOF + 0.125, c.plantDark)
    ringBox(k, parent, t, 16.6, 0.9, 1.0, 1.8, ROOF + 0.75, c.plant)
    for (const dz of [-0.45, 0.45]) {
      const [fx, fz] = [x + radial(t)[0] * dz, z + radial(t)[1] * dz]
      k.cyl(parent, 0.36, 0.36, 0.05, c.plantDark, fx, ROOF + 1.27, fz, 24)
    }
  }
}

/* ---------- the capsules ---------- */

/** A planter trough along a capsule's foot for its creepers, `off` in front of the screen (behind if negative). */
function trough(ctx: A01Ctx, parent: Object3D, cap: Capsule, off: number) {
  const { c, k } = ctx
  const [fx, fz] = cap.face
  const len = cap.w * (off > 0 ? 0.92 : 0.7)
  const x = cap.x + fx * off
  const z = cap.z + fz * off
  const m = k.mesh(metricBox(len, 0.55, 0.6), c.grc, parent, x, cap.y0 + 0.275, z)
  m.rotation.y = Math.atan2(fx, fz)
  const soil = k.box(parent, len - 0.12, 0.02, 0.48, c.mulch, x, cap.y0 + 0.54, z, false)
  soil.rotation.y = m.rotation.y
  let seed = cap.seed + 7
  for (let s = -len / 2 + 0.3; s < len / 2 - 0.2; s += 0.55) {
    // Across the trough runs to the right of the face direction.
    shrub(ctx.plant, x + fz * s, cap.y0 + 0.55, z - fx * s, 0.3, 0.45, seed++, 'hedge')
  }
}

function buildCapsules(ctx: A01Ctx, parent: Object3D) {
  const screens = new Tris()
  const toPlaza = (t: number): [number, number] => {
    const [nx, nz] = radial(t)
    return [-nx, -nz]
  }
  const place = (t: number, r: number, rest: Omit<Capsule, 'x' | 'z' | 'face'>): Capsule => {
    const [x, z] = polar(t, r)
    return { x, z, face: toPlaza(t), ...rest }
  }
  const capsules: Capsule[] = [
    // Over the south wing's tip: the smallest, on the roof terrace.
    place(-77, 13.2, { w: 4.2, y0: ROOF, h: 6.6, rc: 4, tube: 0.13, green: 0.6, seed: 2101 }),
    // Behind the centre, rising over its roof.
    place(-158, 16.4, { w: 4.6, y0: ROOF, h: 8.6, rc: 5, hole: { y: ROOF + 8.6 - 2.3, r: 1.35 }, tube: 0.14, green: 0.8, seed: 2102 }),
    // The north wing's, the tallest: rising off the white wall, to +23.2. It bulges towards the
    // plaza while the glass behind it curves away, so it stands on the wall's line to clear it.
    place(-268, WALL.r, { w: 7.2, y0: L1, h: 18, rc: 10, hole: { y: L1 + 18 - 3.6, r: 1.9 }, tube: 0.19, brace: { back: 1.0, top: ROOF }, green: 1, seed: 2103 }),
  ]
  capsules.forEach((cap, i) => {
    buildCapsule(ctx.c, ctx.plant, parent, cap, screens)
    // On the roofs the trough stands in front; on the wall, behind it on the arcade roof.
    trough(ctx, parent, cap, i < 2 ? 0.45 : -0.75)
  })
  screens.mesh(ctx.c.mesh, parent, 'capsule_mesh')
  // An uplight in each trough, washing the mesh and the creepers at dusk.
  const l = ctx.lighting.light(new PointLight('#ffe6c4', 10, 16, 2), 0)
  l.position.set(capsules[2].x + capsules[2].face[0] * 2, L1 + 1.5, capsules[2].z + capsules[2].face[1] * 2)
  parent.add(l)
}

/* ---------- signage ---------- */

const FONT = (px: number) => `700 ${px}px Helvetica, Arial, sans-serif`
/** Cap height of the face as a fraction of the font size. */
const CAP = 0.72
let measure: CanvasRenderingContext2D | null = null
const advanceOf = (ch: string) => {
  measure ??= document.createElement('canvas').getContext('2d')!
  measure.font = FONT(100)
  return measure.measureText(ch).width / 100
}

const glyphCache = new WeakMap<Kit, Map<string, { face: Material; side: Material }>>()

/**
 * One channel letter, cap height `cap`, `depth` deep: an opal face lit from within over aluminium
 * returns, built as a stack of cut-outs. Baseline at y = 0, centred on x = 0, facing +z.
 */
function channelLetter(ctx: A01Ctx, ch: string, cap: number, depth: number) {
  const { k, lighting } = ctx
  let cache = glyphCache.get(k)
  if (!cache) glyphCache.set(k, (cache = new Map()))
  let mats = cache.get(ch)
  if (!mats) {
    const map = k.tex.painted(256, 256, (g, w, h) => {
      g.fillStyle = '#000'
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#fff'
      g.font = FONT(h * 0.7)
      g.textAlign = 'center'
      g.textBaseline = 'alphabetic'
      g.fillText(ch, w / 2, h / 2 + (h * 0.7 * CAP) / 2)
    })
    mats = {
      face: lighting.glow(new MeshStandardMaterial({ color: '#ffffff', emissive: '#fff6e8', emissiveIntensity: 1.3, roughness: 0.3, alphaMap: map, alphaTest: 0.5 }), 0.1),
      side: new MeshStandardMaterial({ color: '#c9ccd0', metalness: 0.7, roughness: 0.35, alphaMap: map, alphaTest: 0.5, side: DoubleSide }),
    }
    cache.set(ch, mats)
  }
  const size = cap / (0.7 * CAP)
  const g = new Group()
  const plane = new PlaneGeometry(size, size)
  const layers = Math.max(2, Math.round(depth / 0.012))
  for (let i = 0; i <= layers; i++) {
    const m = new Mesh(plane, i === 0 ? mats.face : mats.side)
    m.position.set(0, cap / 2, -(i * depth) / layers)
    m.castShadow = i === layers
    g.add(m)
  }
  return { group: g, advance: advanceOf(ch) * size * 0.7 + cap * 0.1 }
}

/** A line of letters centred on x = 0, facing +z, baseline at y = 0. */
export function signLine(ctx: A01Ctx, text: string, cap: number, depth: number) {
  const g = new Group()
  const letters = [...text].map((ch) => (ch === ' ' ? { group: null, advance: cap * 0.45 } : channelLetter(ctx, ch, cap, depth)))
  const total = letters.reduce((s, l) => s + l.advance, 0)
  let x = -total / 2
  for (const l of letters) {
    if (l.group) {
      l.group.position.x = x + l.advance / 2
      g.add(l.group)
    }
    x += l.advance
  }
  return g
}

export const NAME = 'KALLAKAL SQUARE'

/** The name along the canopy's edge over the entrance, letter by letter round the curve. */
function buildSignage(ctx: A01Ctx, parent: Object3D) {
  // Above the canopy's glass balustrade, on a rail carried by posts from the canopy.
  const cap = 0.9
  const base = ROOF + 1.32
  const r = R_IN - 2.4 + 0.5
  const letters = [...NAME].map((ch) => (ch === ' ' ? { group: null, advance: cap * 0.45 } : channelLetter(ctx, ch, cap, 0.1)))
  const total = letters.reduce((s, l) => s + l.advance, 0)
  let s = -total / 2
  for (const l of letters) {
    // Reading left to right from the plaza runs clockwise seen from above (decreasing t).
    const t = ENTRY_T - (s + l.advance / 2) / perDeg(r)
    if (l.group) {
      const [x, z] = polar(t, r)
      l.group.position.set(x, base, z)
      l.group.rotation.y = t * D + Math.PI
      parent.add(l.group)
    }
    s += l.advance
  }
  const rail = new Tris()
  const span = deg(total / 2 + 0.2, r)
  arcBand(rail, r - 0.08, ENTRY_T - span, ENTRY_T + span, base - 0.1, base, true)
  rail.mesh(ctx.c.steel, parent, 'sign_rail')
  for (let t = ENTRY_T - span + 0.5; t <= ENTRY_T + span; t += deg(1.6, r)) ctx.k.cyl(parent, 0.03, 0.03, base - ROOF, ctx.c.steel, ...xz(polar(t, r - 0.12), (base + ROOF) / 2), 8)
}

/** Planters along the foot of the glass on the plaza side, as in the reference. */
function buildPlanters(ctx: A01Ctx, parent: Object3D) {
  const { c, k } = ctx
  let seed = 2300
  for (const t of [-118, -104, -90, -148, -160, -167, -193, -200, -207]) {
    const [x, z] = polar(t, R_IN - 1.0)
    k.cyl(parent, 0.5, 0.42, 0.62, c.grc, x, GL + 0.31, z, 32)
    k.cyl(parent, 0.45, 0.45, 0.02, c.mulch, x, GL + 0.6, z, 24).castShadow = false
    shrub(ctx.plant, x, GL + 0.6, z, 0.42, 0.7, seed++, seed % 3 ? 'shrub' : 'hedge')
    ctx.shade.pool(x, GL + 0.005, z, 0.75, 0.75, 0.5)
  }
}

export function buildBuilding(ctx: A01Ctx, parent: Object3D) {
  buildGlazing(ctx, parent)
  buildFloors(ctx, parent)
  buildEndWalls(ctx, parent)
  buildSweepWall(ctx, parent)
  buildEntrance(ctx, parent)
  buildStair(ctx, parent)
  buildRoof(ctx, parent)
  buildCapsules(ctx, parent)
  buildSignage(ctx, parent)
  buildPlanters(ctx, parent)
}
