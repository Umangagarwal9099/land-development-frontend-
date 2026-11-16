import { CylinderGeometry, Group, Mesh, PointLight, type Material, type Object3D } from 'three'
import type { Point2 } from '../../../../../../api/types'
import type { Kit } from '../../kit'
import type { Lighting } from '../../shared'
import { BACKING } from '../skin'
import { clipHalf, LOOP, SHOPFRONT } from '../plan'
import { sheet, slab } from '../solids'
import { Contact } from '../contact'
import { ceiling, floorPattern, frontDetail } from './architecture'
import type { Lux } from './luxury'
import type { InteriorMaterials } from './materials'
import type { Signs } from './signs'
import { place } from './signs'
import {
  areaOf, COLUMNS, ENV, ENV_G, ESC, ESCALATORS, LEVELS, LIFTS, LINK_X0, LINK_X1, ROOF, STAIRS, VOID, VZ0, VZ1, isLettable,
  type FloorPlan, type Front, type Rect, type Unit,
} from './units'

/*
 * One floor of the mall: its slab (open at the atrium, the stairs, the lift shafts and the pits at
 * the escalators' tops), the galleries in polished stone under a lit gypsum ceiling, the glass
 * balustrade round the void, and the units marked out as handed over for fit-out: partitions,
 * a frameless glass shopfront with its entrance and a lit fascia naming the trade, a bare screed
 * floor with the unit's number and area painted on it, the slab's soffit left exposed above.
 */

export interface FloorCtx {
  k: Kit
  m: InteriorMaterials
  s: Signs
  /** The luxury palette and each floor's scheme. */
  lux: Lux
  /** Contact shadows under furniture and along walls, built once the floor is furnished. */
  shade: Contact
  lighting: Lighting
  plan: FloorPlan
  level: number
  /** Finished floor level. */
  y: number
  g: Group
  /** Inner face of the outer wall (the glass at the ground, the skin's backing above), as a plan polygon. */
  env: Point2[]
  box: typeof ENV
  /** Height of the corridors' false ceiling above the floor, and the underside of the slab over the floor. */
  ceiling: number
  soffit: number
  /** Glass height of a shopfront (the bulkhead runs from it to the ceiling). */
  glass: number
}

export function floorCtx(k: Kit, m: InteriorMaterials, s: Signs, lux: Lux, lighting: Lighting, plan: FloorPlan, g: Group): FloorCtx {
  const level = plan.level
  const y = LEVELS[level]
  const ground = level === 0
  return {
    k, m, s, lux, shade: new Contact(), lighting, plan, level, y, g,
    env: LOOP.polygon(ground ? SHOPFRONT - 0.02 : BACKING - 0.02, 0.4),
    box: ground ? ENV_G : ENV,
    ceiling: ground ? 4.2 : level === 4 ? 4.8 : 3.6,
    soffit: level === 0 ? LEVELS[1] - 0.25 : level < 4 ? LEVELS[level + 1] - 0.3 : ROOF - 0.35,
    glass: ground ? 3.6 : level === 4 ? 3.0 : 3.0,
  }
}

/* ---------- plan geometry ---------- */

/** A rectangle clipped to the floor's outline (its rounded corners, the entrance link). */
export function clipped(e: FloorCtx, [x0, x1, z0, z1]: Rect): Point2[] {
  let p = e.env
  p = clipHalf(p, 1, 0, -x0)
  p = clipHalf(p, -1, 0, x1)
  p = clipHalf(p, 0, 1, -z0)
  p = clipHalf(p, 0, -1, z1)
  return p
}

export function inside(poly: Point2[], x: number, z: number) {
  let hit = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i]
    const [xj, zj] = poly[j]
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) hit = !hit
  }
  return hit
}

const rectPoly = ([x0, x1, z0, z1]: Rect): Point2[] => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]
const within = (r: Rect, x: number, z: number, pad = 0) => x > r[0] - pad && x < r[1] + pad && z > r[2] - pad && z < r[3] + pad

/** The pits in a floor's slab at the escalators that arrive on it: the top transition and flat steps. */
export function escalatorPits(level: number): Rect[] {
  const reach = ESC.flat + ESC.ease
  return ESCALATORS.filter((s) => s.to === level).map((s) => {
    const z = s.rises > 0 ? [VZ1, VZ1 + reach] : [VZ0 - reach, VZ0]
    return [s.x - 0.515, s.x + 0.515, z[0], z[1]] as Rect
  })
}

/** The void's outline on a floor, with the escalators' pits as notches in it (one hole, so it triangulates cleanly). */
function voidOutline(level: number): Point2[] {
  const [x0, x1, z0, z1] = VOID
  const pits = escalatorPits(level)
  const back = pits.filter((p) => Math.abs(p[3] - z0) < 1e-6).sort((a, b) => a[0] - b[0])
  const front = pits.filter((p) => Math.abs(p[2] - z1) < 1e-6).sort((a, b) => b[0] - a[0])
  const pts: Point2[] = [[x0, z0]]
  for (const p of back) pts.push([p[0], z0], [p[0], p[2]], [p[1], p[2]], [p[1], z0])
  pts.push([x1, z0], [x1, z1])
  for (const p of front) pts.push([p[1], z1], [p[1], p[3]], [p[0], p[3]], [p[0], z1])
  pts.push([x0, z1])
  return pts
}

/** A gallery's floor outline, notched where escalator pits come in from its edge. */
function notched([x0, x1, z0, z1]: Rect, pits: Rect[]): Point2[] {
  const lo = pits.filter((p) => Math.abs(p[2] - z0) < 1e-6 && p[0] > x0 && p[1] < x1).sort((a, b) => a[0] - b[0])
  const hi = pits.filter((p) => Math.abs(p[3] - z1) < 1e-6 && p[0] > x0 && p[1] < x1).sort((a, b) => b[0] - a[0])
  const pts: Point2[] = [[x0, z0]]
  for (const p of lo) pts.push([p[0], z0], [p[0], p[3]], [p[1], p[3]], [p[1], z0])
  pts.push([x1, z0], [x1, z1])
  for (const p of hi) pts.push([p[1], z1], [p[1], p[2]], [p[0], p[2]], [p[0], z1])
  pts.push([x0, z1])
  return pts
}

/** Where escalators meet a floor's edge of the void: their spans along it, which the balustrade stops for. */
function escalatorSpans(level: number, edge: number): [number, number][] {
  return ESCALATORS.filter((s) => {
    const top = s.to === level && (s.rises > 0 ? VZ1 : VZ0) === edge
    const bottom = s.from === level && level > 0 && (s.rises > 0 ? VZ0 : VZ1) === edge
    return top || bottom
  }).map((s) => [s.x - ESC.width / 2 - 0.02, s.x + ESC.width / 2 + 0.02])
}

/**
 * Every escalator lane that meets a void edge on a floor: arriving or leaving there, or (from the
 * floor below) rising through the slab's edge zone. A fascia or balustrade must leave these clear.
 */
function lanesAt(edge: number, level: number): [number, number][] {
  return ESCALATORS.filter((s) => {
    const topEdge = s.rises > 0 ? VZ1 : VZ0
    const lowEdge = s.rises > 0 ? VZ0 : VZ1
    return (s.to === level && topEdge === edge) || (s.from === level && lowEdge === edge)
  }).map((s) => [s.x - ESC.width / 2 - 0.03, s.x + ESC.width / 2 + 0.03])
}

/** Removes `cut` intervals from [a, b]. */
export function subtract([a, b]: [number, number], cuts: [number, number][]): [number, number][] {
  let out: [number, number][] = [[a, b]]
  for (const [c, d] of cuts) out = out.flatMap(([p, q]): [number, number][] => (d <= p || c >= q ? [[p, q]] : ([[p, Math.min(q, c)], [Math.max(p, d), q]] as [number, number][]).filter(([s, t]) => t - s > 0.02)))
  return out
}

/** Merges overlapping intervals. */
function union(list: [number, number][]): [number, number][] {
  const s = [...list].sort((a, b) => a[0] - b[0])
  const out: [number, number][] = []
  for (const [a, b] of s) {
    const last = out[out.length - 1]
    if (last && a <= last[1] + 0.01) last[1] = Math.max(last[1], b)
    else out.push([a, b])
  }
  return out
}

/* ---------- boxes ---------- */

export function bx(e: FloorCtx, p: Object3D, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mat: Material, cast = true) {
  if (x1 - x0 < 1e-3 || y1 - y0 < 1e-3 || z1 - z0 < 1e-3) return null
  return e.k.box(p, x1 - x0, y1 - y0, z1 - z0, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, cast)
}

/** A wall along an axis line: `axis` 'x' is a wall at x = at running along z (and vice versa). */
export function wallOn(e: FloorCtx, p: Object3D, axis: 'x' | 'z', at: number, from: number, to: number, y0: number, y1: number, t: number, mat: Material) {
  if (axis === 'x') return bx(e, p, at - t / 2, at + t / 2, y0, y1, from, to, mat)
  return bx(e, p, from, to, y0, y1, at - t / 2, at + t / 2, mat)
}

/* ---------- the floor ---------- */

export function buildFloor(e: FloorCtx) {
  buildSlab(e)
  buildCommons(e)
  floorPattern(e)
  buildUnits(e)
  buildBalustrade(e)
  buildColumns(e)
  buildLamps(e)
}

/** The structural slab (from the first floor up) and, at the ground, the floor finishes on the podium. */
function buildSlab(e: FloorCtx) {
  const { m, g, y, level } = e
  if (level === 0) {
    // The podium is the ground floor's slab (see ../building.ts): the units get a screed topping on it.
    for (const u of e.plan.units)
      if (u.kind !== 'kiosk' && u.kind !== 'lounge' && u.kind !== 'washroom' && !u.id.startsWith('RAMP'))
        for (const r of u.rects) sheet(g, clipped(e, r), y + 0.004, m.screed, false, [], 'unit_floor')
    return
  }
  const holes: Point2[][] = [
    voidOutline(level),
    ...STAIRS.map((s) => rectPoly(s.zone)),
    rectPoly([LIFTS.x0 + 0.2, LIFTS.x1 - 0.2, LIFTS.z0 + 0.2, LIFTS.z1 - 0.2]),
  ]
  // The first floor's underside sits just above the skin's soffit, which closes the arcade below it.
  const bottom = level === 1 ? y - 0.25 : y - 0.3
  slab(g, e.env, bottom, y, [m.screed, m.cladWhite], holes, true, 'slab')
}

/** The galleries: stone floor with a dark inlay along the void, the false ceiling and its downlights. */
function buildCommons(e: FloorCtx) {
  const { g, y, level, lux } = e
  const sc = lux.schemes[level]
  const pits = escalatorPits(level)
  for (const r of e.plan.commons) {
    const poly = clipped(e, r)
    if (poly.length < 3) continue
    // A gallery an escalator arrives on is notched for its pit (the pits all come in from a gallery's edge).
    const edgePits = pits.filter((p) => p[0] > r[0] && p[1] < r[1] && (Math.abs(p[2] - r[2]) < 1e-6 || Math.abs(p[3] - r[3]) < 1e-6))
    sheet(g, edgePits.length ? notched(r, edgePits) : poly, y + 0.005, sc.field, false, [], 'common_floor')
    // The ceiling over it (none under the atrium's void; the gaming hall's is its own).
    if (r === VOID || (r[0] >= VOID[0] && r[1] <= VOID[1] && r[2] >= VOID[2] && r[3] <= VOID[3])) continue
    ceiling(e, r)
  }
  // A band of the border stone round the void on the upper floors, brass either side.
  if (level > 0) {
    const [x0, x1, z0, z1] = VOID
    const band = 0.3
    const spans: [Rect, 'x' | 'z', number][] = [
      [[x0 - band - 0.6, x1 + band + 0.6, z0 - 0.6 - band, z0 - 0.6], 'z', z0],
      [[x0 - band - 0.6, x1 + band + 0.6, z1 + 0.6, z1 + 0.6 + band], 'z', z1],
      [[x0 - 0.6 - band, x0 - 0.6, z0 - 0.6, z1 + 0.6], 'x', x0],
      [[x1 + 0.6, x1 + 0.6 + band, z0 - 0.6, z1 + 0.6], 'x', x1],
    ]
    for (const [r, axis, edge] of spans) {
      // Broken where escalators and their pits meet the edge.
      const cuts = axis === 'z' ? [...escalatorSpans(level, edge), ...pits.map((p): [number, number] => [p[0] - 0.4, p[1] + 0.4])] : []
      // On the third floor the gaming hall's own floor runs to the balustrade at the back and east.
      if (level === 3 && (axis === 'x' ? edge === x1 : edge === z0)) continue
      for (const [a, b] of axis === 'z' ? subtract([r[0], r[1]], cuts) : [[r[2], r[3]] as [number, number]]) {
        const piece: Rect = axis === 'z' ? [a, b, r[2], r[3]] : [r[0], r[1], a, b]
        sheet(g, rectPoly(piece), y + 0.008, sc.border, false, [], 'inlay')
        const t = 0.012
        const lines: Rect[] = axis === 'z' ? [[a, b, r[2] - t, r[2]], [a, b, r[3], r[3] + t]] : [[r[0] - t, r[0], a, b], [r[1], r[1] + t, a, b]]
        for (const l of lines) sheet(g, rectPoly(l), y + 0.0085, sc.metal, false, [], 'inlay_brass')
      }
    }
  }
}

/* ---------- units ---------- */

interface Seg {
  axis: 'x' | 'z'
  at: number
  from: number
  to: number
}

/** Does a unit (or a set of rects) cover the point? */
const covers = (rects: Rect[], x: number, z: number) => rects.some((r) => within(r, x, z))

/**
 * The partitions of a set of spaces: every rect edge not shared with another rect of the same
 * space, not on the building's outline and not a shopfront; walls shared by two neighbours are
 * built once.
 */
export function partitions(e: FloorCtx, spaces: { rects: Rect[]; fronts: Front[] }[], skip: (s: Seg) => boolean = () => false) {
  const lines = new Map<string, Seg[]>()
  const onOutline = (axis: 'x' | 'z', at: number, from: number, to: number) => {
    const b = e.box
    if (axis === 'x') return Math.abs(at - b.x0) < 0.02 || Math.abs(at - b.x1) < 0.02
    if (Math.abs(at - b.z0) < 0.02 || Math.abs(at - b.z1) < 0.02) return true
    return Math.abs(at - b.link) < 0.02 && from >= LINK_X0 - 0.01 && to <= LINK_X1 + 0.01
  }
  for (const sp of spaces) {
    for (const [x0, x1, z0, z1] of sp.rects) {
      const edges: Seg[] = [
        { axis: 'z', at: z0, from: x0, to: x1 },
        { axis: 'z', at: z1, from: x0, to: x1 },
        { axis: 'x', at: x0, from: z0, to: z1 },
        { axis: 'x', at: x1, from: z0, to: z1 },
      ]
      for (const ed of edges) {
        if (onOutline(ed.axis, ed.at, ed.from, ed.to)) continue
        // Split where the space's own other rects begin and end along this line.
        const cutsAt = new Set<number>([ed.from, ed.to])
        for (const r of sp.rects) for (const v of ed.axis === 'z' ? [r[0], r[1]] : [r[2], r[3]]) if (v > ed.from && v < ed.to) cutsAt.add(v)
        const pts = [...cutsAt].sort((a, b) => a - b)
        for (let i = 0; i + 1 < pts.length; i++) {
          const a = pts[i]
          const b = pts[i + 1]
          const mid = (a + b) / 2
          const [px, pz] = ed.axis === 'z' ? [mid, ed.at] : [ed.at, mid]
          const d = 0.05
          const sideA = ed.axis === 'z' ? covers(sp.rects, px, pz - d) : covers(sp.rects, px - d, pz)
          const sideB = ed.axis === 'z' ? covers(sp.rects, px, pz + d) : covers(sp.rects, px + d, pz)
          if (sideA && sideB) continue
          // Less its shopfronts.
          const fronts = sp.fronts.filter((f) => f.axis === ed.axis && Math.abs(f.at - ed.at) < 0.02).map((f): [number, number] => [f.from, f.to])
          for (const [p, q] of subtract([a, b], fronts)) {
            const seg = { axis: ed.axis, at: ed.at, from: p, to: q }
            if (skip(seg)) continue
            const key = `${ed.axis}${ed.at.toFixed(2)}`
            if (!lines.has(key)) lines.set(key, [])
            lines.get(key)!.push(seg)
          }
        }
      }
    }
  }
  const out: Seg[] = []
  for (const segs of lines.values()) for (const [a, b] of union(segs.map((s) => [s.from, s.to]))) out.push({ ...segs[0], from: a, to: b })
  // Clipped to the outline: a partition stops at the façade's rounded corners.
  return out.flatMap((s) => clipSeg(e, s))
}

function clipSeg(e: FloorCtx, s: Seg): Seg[] {
  const step = 0.05
  const n = Math.max(1, Math.ceil((s.to - s.from) / step))
  const out: Seg[] = []
  let start: number | null = null
  for (let i = 0; i <= n; i++) {
    const v = s.from + ((s.to - s.from) * i) / n
    const [x, z] = s.axis === 'z' ? [v, s.at] : [s.at, v]
    // Inset a little, so a wall ending on the outline still counts as inside.
    const ok = inside(e.env, x + (s.axis === 'x' ? 0 : 0), z) || inside(e.env, x + 0.06, z) || inside(e.env, x - 0.06, z) || inside(e.env, x, z + 0.06) || inside(e.env, x, z - 0.06)
    if (ok && start === null) start = v
    if ((!ok || i === n) && start !== null) {
      const end = ok ? v : v - (s.to - s.from) / n
      if (end - start > 0.05) out.push({ ...s, from: start, to: end })
      start = null
    }
  }
  return out
}

function buildUnits(e: FloorCtx) {
  const { m, g, y } = e
  const walled = e.plan.units.filter((u) => u.kind !== 'kiosk' && u.kind !== 'lounge')
  // Walls round the units, floor to the slab above. The ramp tunnels at the ground are walled to
  // the soffit too: the car park's own walls stand inside them.
  for (const s of partitions(e, walled)) wallOn(e, g, s.axis, s.at, s.from, s.to, y, e.soffit, 0.15, m.wallPaint)
  for (const u of e.plan.units) {
    if (u.kind === 'kiosk') kiosk(e, u)
    for (const f of u.fronts) shopfront(e, u, f)
    if (isLettable(u) && u.kind !== 'kiosk') unitMark(e, u)
  }
}

/** A unit's shopfront: frameless glass and its entrance, the bulkhead over them with the fascia sign. */
function shopfront(e: FloorCtx, u: Unit, f: Front) {
  const { m, g, y } = e
  const len = f.to - f.from
  const door = Math.min(f.door ?? 2.2, len)
  const counter = u.kind === 'food' && door >= len - 0.01
  const service = u.kind === 'service' || u.kind === 'washroom'
  const top = y + e.ceiling
  // Which way the front faces out of the unit (towards the gallery).
  const [cx, cz] = centreOf(u)
  const out = f.axis === 'x' ? Math.sign(f.at - cx) || 1 : Math.sign(f.at - cz) || 1
  const mid = (f.from + f.to) / 2
  const along = (a: number, b: number, y0: number, y1: number, depth: number, off: number, mat: Material, cast = true) =>
    f.axis === 'x' ? bx(e, g, f.at + out * off - depth / 2, f.at + out * off + depth / 2, y0, y1, a, b, mat, cast) : bx(e, g, a, b, y0, y1, f.at + out * off - depth / 2, f.at + out * off + depth / 2, mat, cast)

  if (service) {
    // A door in a wall: the wall either side, a head over the opening.
    for (const [a, b] of subtract([f.from, f.to], [[mid - door / 2, mid + door / 2]])) along(a, b, y, e.soffit, 0.15, 0, m.wallPaint)
    along(mid - door / 2, mid + door / 2, y + 2.25, e.soffit, 0.15, 0, m.wallPaint)
    if (u.kind === 'service') along(mid - door / 2 + 0.02, mid + door / 2 - 0.02, y, y + 2.24, 0.05, 0, m.darkMetal)
    // The plenum wall above the ceiling and a frame round the opening.
    along(mid - door / 2 - 0.05, mid - door / 2, y, y + 2.3, 0.18, 0, m.stainless)
    along(mid + door / 2, mid + door / 2 + 0.05, y, y + 2.3, 0.18, 0, m.stainless)
    along(mid - door / 2 - 0.05, mid + door / 2 + 0.05, y + 2.25, y + 2.3, 0.18, 0, m.stainless)
    return
  }

  const glassTop = y + e.glass
  // The wall over the bulkhead, up to the slab, hidden above the ceiling.
  along(f.from, f.to, top, e.soffit, 0.15, 0, m.wallPaint)
  // Bulkhead: a bronze band from the glass to the ceiling, with a champagne reveal under it.
  along(f.from, f.to, glassTop, top, 0.22, 0.04, m.bronze)
  along(f.from, f.to, glassTop - 0.03, glassTop, 0.24, 0.04, m.champagne, false)
  // The fascia sign on the bulkhead.
  const signW = Math.min(len - 0.5, u.kind === 'food' ? 2.6 : 3.4)
  const signH = Math.min(top - glassTop - 0.16, u.kind === 'food' ? 0.52 : 0.48)
  if (signW > 0.6 && signH > 0.2) {
    const uv = u.kind === 'food' ? e.s.foodFascia(u.name, u.id) : e.s.shopFascia(u.name, u.id, areaOf(u.rects))
    const yaw = f.axis === 'x' ? (out > 0 ? Math.PI / 2 : -Math.PI / 2) : out > 0 ? 0 : Math.PI
    const [sx, sz] = f.axis === 'x' ? [f.at + out * 0.155, mid] : [mid, f.at + out * 0.155]
    place(g, signW, signH, uv, e.s.lit, sx, (glassTop + top) / 2, sz, yaw)
  }
  if (counter) {
    // An open serving counter: a stone-topped counter across the front, a gap at one end for staff.
    along(f.from + 0.1, f.to - 0.75, y, y + 1.0, 0.6, -0.3, m.bronze)
    along(f.from + 0.05, f.to - 0.7, y + 1.0, y + 1.05, 0.7, -0.3, m.tableTop)
    // Uprights either side.
    along(f.from, f.from + 0.1, y, glassTop, 0.24, 0.04, m.bronze)
    along(f.to - 0.1, f.to, y, glassTop, 0.24, 0.04, m.bronze)
    return
  }
  // Glass either side of the entrance (or all along a display front), in floor and head channels.
  const doorSpan: [number, number][] = door > 0 ? [[mid - door / 2, mid + door / 2]] : []
  for (const [a, b] of subtract([f.from + 0.32, f.to - 0.32], doorSpan)) {
    along(a, b, y + 0.06, glassTop - 0.03, 0.012, 0, m.shopGlass, false)
    // Patch fittings at the joints, every 1.8 m.
    const n = Math.max(1, Math.round((b - a) / 1.8))
    for (let i = 1; i < n; i++) {
      const v = a + ((b - a) * i) / n
      along(v - 0.006, v + 0.006, y + 0.06, glassTop - 0.03, 0.03, 0, m.stainless, false)
    }
  }
  along(f.from, f.to, y, y + 0.06, 0.06, 0, m.stainless, false)
  // Marble pilasters at its ends, a dark plinth, a light line under the bulkhead.
  frontDetail(e, f.axis, f.at, f.from, f.to, out, glassTop)
  e.shade.foot(...(f.axis === 'x' ? [f.at + out * 0.09, f.from, f.at + out * 0.09, f.to] as const : [f.from, f.at + out * 0.09, f.to, f.at + out * 0.09] as const), y + 0.01, 0.2, 0.25)
  if (door > 0) {
    // The entrance: a stainless threshold and a slim frame round the opening.
    along(mid - door / 2, mid + door / 2, y, y + 0.008, 0.25, 0, m.stainless, false)
    along(mid - door / 2 - 0.04, mid - door / 2, y, glassTop, 0.08, 0, m.stainless, false)
    along(mid + door / 2, mid + door / 2 + 0.04, y, glassTop, 0.08, 0, m.stainless, false)
  }
}

export function centreOf(u: { rects: Rect[] }): [number, number] {
  const r = [...u.rects].sort((a, b) => (b[1] - b[0]) * (b[3] - b[2]) - (a[1] - a[0]) * (a[3] - a[2]))[0]
  return [(r[0] + r[1]) / 2, (r[2] + r[3]) / 2]
}

/** The unit's number, trade, area and size painted on its bare floor. */
function unitMark(e: FloorCtx, u: Unit) {
  const r = [...u.rects].sort((a, b) => (b[1] - b[0]) * (b[3] - b[2]) - (a[1] - a[0]) * (a[3] - a[2]))[0]
  const w = r[1] - r[0]
  const d = r[3] - r[2]
  const size = u.rects.length > 1 ? 'L-shaped' : `${w.toFixed(1)} × ${d.toFixed(1)} m`
  const uv = e.s.unitMark(u.id, u.name, areaOf(u.rects), size)
  const span = Math.min(3.2, Math.max(w, d) * 0.7, Math.min(w, d) * 1.6)
  // Read from the unit's entrance.
  const f = u.fronts[0]
  const [cx, cz] = [(r[0] + r[1]) / 2, (r[2] + r[3]) / 2]
  let yaw = 0
  if (f) yaw = f.axis === 'x' ? (f.at > cx ? -Math.PI / 2 : Math.PI / 2) : f.at > cz ? Math.PI : 0
  place(e.g, span, span / 2, uv, e.s.paint, cx, e.y + 0.012, cz, yaw + Math.PI, true)
}

/** A kiosk pad in a gallery: its footprint inlaid in the floor, a low plinth, its name hung over it. */
function kiosk(e: FloorCtx, u: Unit) {
  const { m, g, y } = e
  const [x0, x1, z0, z1] = u.rects[0]
  const t = 0.08
  for (const [a, b, c, d] of [[x0, x1, z0, z0 + t], [x0, x1, z1 - t, z1], [x0, x0 + t, z0, z1], [x1 - t, x1, z0, z1]] as Rect[])
    sheet(g, rectPoly([a, b, c, d]), y + 0.009, m.champagne, false, [], 'kiosk_inlay')
  sheet(g, rectPoly([x0 + t, x1 - t, z0 + t, z1 - t]), y + 0.008, m.screed, false, [], 'kiosk_pad')
  // The sign, hung from the ceiling on two rods, both faces.
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2
  const along = x1 - x0 >= z1 - z0
  const w = Math.min(2.0, Math.max(x1 - x0, z1 - z0) - 0.2)
  const uv = e.s.shopFascia(u.name, u.id, areaOf(u.rects))
  const sy = y + Math.min(2.9, e.ceiling - 0.5)
  for (const side of [0, Math.PI]) place(g, w, w * 0.156, uv, e.s.lit, cx + (along ? 0 : Math.cos(side) * 0.03), sy, cz + (along ? Math.cos(side) * 0.03 : 0), (along ? 0 : Math.PI / 2) + side)
  bx(e, g, cx - w / 2, cx + w / 2, sy - w * 0.08 - 0.02, sy + w * 0.08 + 0.02, cz - 0.025, cz + 0.025, m.bronze)
  for (const dx of [-w / 2 + 0.15, w / 2 - 0.15]) bx(e, g, cx + dx - 0.006, cx + dx + 0.006, sy + w * 0.08, y + e.ceiling, cz - 0.006, cz + 0.006, m.stainless, false)
}

/* ---------- the void's edge ---------- */

/** Glass balustrade round the void on an upper floor, a clad fascia over the slab's edge and a cove light under it. */
function buildBalustrade(e: FloorCtx) {
  const { m, g, y, level } = e
  if (level === 0) return
  const [x0, x1, z0, z1] = VOID
  const H = 1.1
  const edges: { axis: 'x' | 'z'; at: number; from: number; to: number; out: number }[] = [
    { axis: 'z', at: z0, from: x0, to: x1, out: -1 },
    { axis: 'z', at: z1, from: x0, to: x1, out: 1 },
    { axis: 'x', at: x0, from: z0, to: z1, out: -1 },
    { axis: 'x', at: x1, from: z0, to: z1, out: 1 },
  ]
  // The fascia runs down to the ceiling of the floor below.
  const below = LEVELS[level - 1] + (level - 1 === 0 ? 4.2 : 3.6)
  for (const ed of edges) {
    // Offsets `o` measured from the edge into the floor (away from the void).
    const span = (a: number, b: number, y0: number, y1: number, o0: number, o1: number, mat: Material, cast = true) => {
      const p = -ed.out * o0
      const q = -ed.out * o1
      if (ed.axis === 'z') return bx(e, g, a, b, y0, y1, ed.at + Math.min(p, q), ed.at + Math.max(p, q), mat, cast)
      return bx(e, g, ed.at + Math.min(p, q), ed.at + Math.max(p, q), y0, y1, a, b, mat, cast)
    }
    // The fascia: a smooth plaster band over the slab edge down to the ceiling below, banded in the
    // floor's metal at the slab line and at its foot, a concealed light under its lip.
    const sc = e.lux.schemes[level]
    const ext = ed.axis === 'z' ? 0.06 : 0
    // Stopped either side of every escalator that crosses this edge (on this floor or rising past it
    // from the one below), so nothing stands across a lane: the steps run through at floor level.
    const lanes = ed.axis === 'z' ? lanesAt(ed.at, level) : []
    for (const [a, b] of subtract([ed.from - ext, ed.to + ext], lanes)) {
      span(a, b, below, y + 0.12, -0.06, 0.0, e.lux.plaster)
      span(a, b, y - 0.42, y - 0.3, -0.068, -0.055, sc.metal, false)
      span(a, b, below, below + 0.05, -0.068, -0.055, sc.metal, false)
      span(Math.max(a, ed.from), Math.min(b, ed.to), below - 0.02, below, 0.0, 0.35, m.cove, false)
    }
    const cuts = ed.axis === 'z' ? escalatorSpans(level, ed.at) : []
    for (const [a, b] of subtract([ed.from, ed.to], cuts)) {
      // A metal shoe, frameless 12 mm glass, a round handrail on the glass's top edge.
      span(a, b, y, y + 0.12, 0.02, 0.14, sc.metal)
      span(a + 0.02, b - 0.02, y + 0.12, y + H - 0.05, 0.072, 0.084, m.railGlass, false)
      const rail = new Mesh(new CylinderGeometry(0.025, 0.025, b - a, 16), sc.metal)
      rail.rotation.set(ed.axis === 'z' ? 0 : Math.PI / 2, 0, ed.axis === 'z' ? Math.PI / 2 : 0)
      const o = -ed.out * 0.078
      rail.position.set(ed.axis === 'z' ? (a + b) / 2 : ed.at + o, y + H - 0.025, ed.axis === 'z' ? ed.at + o : (a + b) / 2)
      rail.castShadow = true
      g.add(rail)
      // A light line in the shoe, washing the floor.
      span(a, b, y + 0.1, y + 0.112, 0.14, 0.152, m.cove, false)
    }
  }
}

function buildColumns(e: FloorCtx) {
  const { k, m, g, y } = e
  const sc = e.lux.schemes[e.level]
  for (const [x, z] of COLUMNS) {
    if (e.level === 3 && x > 8) continue
    const h = e.ceiling
    // Stone cladding with brass reveals, a dark stone base, a brass capital collar.
    k.cyl(g, 0.34, 0.34, h, sc.wall, x, y + h / 2, z, 48)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      k.box(g, 0.012, h - 0.4, 0.012, sc.metal, x + Math.cos(a) * 0.342, y + 0.2 + (h - 0.4) / 2, z + Math.sin(a) * 0.342, false)
    }
    k.cyl(g, 0.36, 0.36, 0.2, e.lux.wallNero, x, y + 0.1, z, 48)
    k.cyl(g, 0.365, 0.365, 0.015, sc.metal, x, y + 0.2, z, 48)
    k.cyl(g, 0.37, 0.37, 0.1, sc.metal, x, y + h - 0.05, z, 48)
    e.shade.pool(x, y + 0.012, z, 0.6, 0.6, 0.3)
    k.cyl(g, 0.28, 0.28, e.soffit - y - h, m.blockwork, x, y + h + (e.soffit - y - h) / 2, z, 16)
  }
}

/** The floor's own lamps, lit while it is looked at or walked (the light pool holds a few at a time). */
function buildLamps(e: FloorCtx) {
  const spots: [number, number][] = [[1.9, 0.3], [-5.1, -10.0], [-5.1, 6.0], [9.5, -1.0], [0.0, 9.3], [-9.0, 0.0]]
  for (const [x, z] of spots) {
    const l = e.lighting.light(new PointLight('#ffe9cc', e.level === 0 ? 16 : 11, 18, 1.6), 0.55)
    l.position.set(x, e.y + e.ceiling - 0.4, z)
    l.userData.zone = `mall_${e.plan.label.toLowerCase()}`
    e.g.add(l)
  }
}

export { within, rectPoly }
