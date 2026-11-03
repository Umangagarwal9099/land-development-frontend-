import { PointLight, Sphere, Vector3, type Material, type Object3D } from 'three'
import type { Point2 } from '../../../../../api/types'
import { PI } from '../kit'
import { parkedCar } from '../kalakalMall/car'
import { lawn, shrub, SPECIES, tree } from '../kalakalMall/foliage'
import { Tris } from '../kalakalMall/skin'
import { metricBox, rect, slab } from '../kalakalMall/solids'
import { NAME, signLine, type A01Ctx } from './building'
import { buildFountain, type Fountain, type Jet } from './fountain'
import { BAYS, circle, clipHalf, DRIVE, FRONTAGE_Z, FT, GL, P, PAVED_R, PLAZA_R, PLOT, polar, RAMP, WALL, YARD } from './plan'

/*
 * The grounds. The fountain plaza opens east to the road across a stone forecourt; a 5.5 m drive
 * runs the length of the south boundary from the HMDA road to the cross road behind, with
 * parallel visitor bays along it, the covered ramp to the basement car park off its far end, and
 * the substation and generator yard in the north-west corner. A paved fire walk runs down the
 * north side.
 *
 * The plaza is the reference's: concentric rings of polished black granite and travertine, with
 * a dry-deck fountain set flush in them (fountain.ts): three rings of nozzles and one at the
 * centre, no basin, the run-off taken by a concealed slot drain round the jets.
 */

type R = [number, number]

const WALL_T = 0.23
/** The plaza and forecourt, between the drive and the north wall. */
const COURT = { x0: BAYS.x1, x1: PLOT.x1 - WALL_T }

/** Inside the plot as the plan draws it (with a margin), or anywhere in the property's own view. */
const within = (ctx: A01Ctx, x: number, z: number, margin = 0.6) => !ctx.onPlan || z <= FRONTAGE_Z(x) - margin

/** A box from extents; its UVs in metres unless `unit` (for materials mapped once per face: railings, kerbs). */
function bx({ k }: A01Ctx, p: Object3D, [x0, x1]: R, [y0, y1]: R, [z0, z1]: R, mat: Material | Material[], cast = true, unit = false) {
  if (unit) return k.box(p, x1 - x0, y1 - y0, z1 - z0, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, cast)
  return k.mesh(metricBox(x1 - x0, y1 - y0, z1 - z0), mat, p, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, cast)
}

/** A box running east whose front may be cut back to the plan's road edge. */
function bxIn(ctx: A01Ctx, p: Object3D, xs: R, ys: R, [z0, z1]: R, mat: Material | Material[], cast = true, unit = false): R | null {
  const end = ctx.onPlan ? Math.min(z1, FRONTAGE_Z(xs[0]) - 0.4, FRONTAGE_Z(xs[1]) - 0.4) : z1
  if (end - z0 <= 0.05) return null
  bx(ctx, p, xs, ys, [z0, end], mat, cast, unit)
  return [z0, end]
}

/** A ground surface laid at true scale, trimmed to the plan's road edge on the master plan. */
function ground(ctx: A01Ctx, p: Object3D, poly: Point2[], y: number, mat: Material, holes: Point2[][] = []) {
  const shape = ctx.onPlan ? clipHalf(poly, -0.3636, -1, 24.66 - 0.3) : poly
  if (shape.length >= 3) slab(p, shape, 0, y, [mat, ctx.c.concrete], holes, false)
}

/** Precast kerb along z at x, its shade on both sides. */
function kerbZ(ctx: A01Ctx, p: Object3D, x: number, [z0, z1]: R, h: number) {
  const run = bxIn(ctx, p, [x - 0.075, x + 0.075], [0, h], [z0, z1], ctx.c.kerb(z1 - z0), true, true)
  if (!run) return
  for (const side of [-1, 1] as const) ctx.shade.edge([[x + side * 0.075, run[0]], [x + side * 0.075, run[1]]], 0.035, 0.18, side > 0 ? -1 : 1, 0.35)
}

export function buildSite(ctx: A01Ctx, p: Object3D): Fountain {
  const { c } = ctx
  // The drive and the back court, asphalt; the bays in pavers; the yard in concrete.
  ground(ctx, p, rect(DRIVE.x0, DRIVE.x1, PLOT.z0 + WALL_T, PLOT.z1), 0.02, c.asphalt)
  ground(ctx, p, rect(DRIVE.x1, RAMP.x0, PLOT.z0 + WALL_T, BAYS.z0 - 1.5), 0.02, c.asphalt)
  ground(ctx, p, rect(BAYS.x0, BAYS.x1, BAYS.z0, BAYS.z1), 0.03, c.interlock)
  // The forecourt: flamed granite at plaza level over the rest of the plot, the plaza's rings inlaid.
  ground(ctx, p, rect(COURT.x0, COURT.x1, BAYS.z0 - 1.5, PLOT.z1), GL, c.paving, [circle(P.x, P.z, PAVED_R, 160)])
  ground(ctx, p, rect(DRIVE.x1, BAYS.x1, BAYS.z1, PLOT.z1), GL, c.paving)
  // Behind the wings, between the ramp and the yard, and along the north: paving at plaza level.
  ground(ctx, p, rect(RAMP.x0, YARD.x0, RAMP.z1, BAYS.z0 - 1.5), GL, c.paving)
  ground(ctx, p, rect(DRIVE.x1, BAYS.x1, BAYS.z0 - 1.5, BAYS.z0), 0.02, c.asphalt)
  ground(ctx, p, rect(RAMP.x0, RAMP.x0 + 3.25, RAMP.z0, RAMP.z1), 0.02, c.asphalt)
  ground(ctx, p, rect(YARD.x0, COURT.x1, YARD.z1, BAYS.z0 - 1.5), GL, c.paving)
  ground(ctx, p, rect(RAMP.x1, YARD.x0, PLOT.z0 + WALL_T, RAMP.z1), GL, c.apron)

  const fountain = buildPlaza(ctx, p)
  buildEdges(ctx, p)
  buildParking(ctx, p)
  buildRamp(ctx, p)
  buildYard(ctx, p)
  buildWalls(ctx, p)
  buildFurniture(ctx, p)
  buildPlanting(ctx, p)
  buildLighting(ctx, p)
  buildPylon(ctx, p)
  return fountain
}

/* ---------- the plaza ---------- */

/** Rings of the plaza from the centre out: radius and finish. */
const RINGS: [r: number, dark: boolean][] = [
  [1.25, true],
  [2.1, false],
  [2.7, true],
  [5.2, false],
  [6.1, true],
  [7.9, false],
  [PLAZA_R, true],
  [12.4, false],
  [13.1, true],
  [14.9, false],
  [PAVED_R, true],
]
/** The fountain's nozzles: three rings in the dark bands (with a crown of six at the centre); base jet heights. */
const JET_RINGS = [
  { r: 2.4, n: 10, h: 1.1 },
  { r: 5.65, n: 22, h: 1.6 },
  { r: 8.25, n: 30, h: 1.2 },
]
/** The white wall's foot stands just outside the outer ring; no nozzles or drain where it runs (degrees round P). */
const UNDER_WALL: [number, number] = [WALL.t0 + 360 - 5, WALL.t1 + 360 + 5]
const tOf = (x: number, z: number) => {
  const t = (Math.atan2(x - P.x, z - P.z) * 180) / PI
  return t < 0 ? t + 360 : t
}

function buildPlaza(ctx: A01Ctx, p: Object3D): Fountain {
  const { c, k, shade } = ctx
  let inner = 0
  for (const [r, dark] of RINGS) {
    const holes = inner ? [circle(P.x, P.z, inner, 160)] : []
    // Clipped to the plan's road edge, like the rest of the forecourt.
    const ring = ctx.onPlan ? clipHalf(circle(P.x, P.z, r, 160), -0.3636, -1, 24.66 - 0.3) : circle(P.x, P.z, r, 160)
    slab(p, ring, 0, GL, [dark ? c.darkStone : c.lightStone, c.concrete], holes, false)
    inner = r
  }

  // Nozzles flush in the stone: a stainless ring round a dark orifice, nothing standing proud.
  const jets: Jet[] = []
  const nozzle = (x: number, z: number, h: number) => {
    k.cyl(p, 0.055, 0.055, 0.004, c.chromeRail, x, GL + 0.002, z, 16).castShadow = false
    k.cyl(p, 0.022, 0.022, 0.005, c.void, x, GL + 0.0025, z, 12).castShadow = false
    jets.push({ x, z, h, angle: Math.atan2(z - P.z, x - P.x) })
  }
  // The centre feature: a tight crown of six nozzles throwing highest.
  for (let i = 0; i < 6; i++) nozzle(P.x + 0.5 * Math.cos((i * PI) / 3), P.z + 0.5 * Math.sin((i * PI) / 3), 1.9)
  for (const ring of JET_RINGS)
    for (let i = 0; i < ring.n; i++) {
      const a = (i / ring.n) * PI * 2 + 0.13
      const [x, z] = [P.x + ring.r * Math.cos(a), P.z + ring.r * Math.sin(a)]
      const t = tOf(x, z)
      if (ring.r > PLAZA_R - 1 && t > UNDER_WALL[0] && t < UNDER_WALL[1]) continue
      nozzle(x, z, ring.h)
    }
  const fountain = buildFountain(p, jets, GL, c.env, new Sphere(new Vector3(P.x, GL + 1.4, P.z), PLAZA_R + 1.5))

  // A concealed slot drain round the jets: a 12 mm slot between stainless lips, flush in the stone,
  // where the run-off from the wet stone goes. It stops where the white wall stands.
  const lips = new Tris()
  const slot = new Tris()
  const on = (pt: Point2) => new Vector3(pt[0], GL + 0.003, pt[1])
  const band = (t: Tris, r0: number, r1: number, a: number, b: number) => {
    const step = 1.5
    for (let x = a; x < b - 1e-6; x += step) {
      const y = Math.min(b, x + step)
      t.quad(on(polar(x, r0)), on(polar(x, r1)), on(polar(y, r1)), on(polar(y, r0)), [0, 0], [0, 1], [1, 1], [1, 0])
    }
  }
  const dr = PLAZA_R + 0.45
  const [a, b] = [UNDER_WALL[1] - 360, UNDER_WALL[0]]
  band(lips, dr - 0.03, dr - 0.006, a, b)
  band(slot, dr - 0.006, dr + 0.006, a, b)
  band(lips, dr + 0.006, dr + 0.03, a, b)
  lips.mesh(c.chromeRail, p, 'drain_lips', false)
  slot.mesh(c.void, p, 'drain_slot', false)
  shade.edge(circle(P.x, P.z, 1.2, 64), GL + 0.004, 0.2, -1, 0.12, true)
  return fountain
}

/* ---------- drive edges, bays and cars ---------- */

function buildEdges(ctx: A01Ctx, p: Object3D) {
  const { c } = ctx
  // Kerbs between the drive and the bays, and between the bays and the forecourt.
  kerbZ(ctx, p, BAYS.x1 + 0.075, [BAYS.z0 - 1.5, PLOT.z1], GL + 0.02)
  kerbZ(ctx, p, BAYS.x0 - 0.075, [BAYS.z1, PLOT.z1], 0.17)
  kerbZ(ctx, p, BAYS.x0 - 0.075, [BAYS.z0 - 1.5, BAYS.z0], 0.17)
  // Bay lines, the drive's centre line and its yellow kerb edge.
  for (let i = 0; i <= 4; i++) {
    const z = BAYS.z0 + ((BAYS.z1 - BAYS.z0) * i) / 4
    bx(ctx, p, [BAYS.x0 + 0.1, BAYS.x1 - 0.1], [0.03, 0.034], [z - 0.05, z + 0.05], c.lane, false)
  }
  const mid = (DRIVE.x0 + DRIVE.x1) / 2
  for (let z = PLOT.z0 + 2; z < PLOT.z1 - 2; z += 4.5) bxIn(ctx, p, [mid - 0.06, mid + 0.06], [0.02, 0.024], [z, z + 2.5], c.lane, false)
  // Speed table at the gate, in the bays' pavers.
  bxIn(ctx, p, [DRIVE.x0, DRIVE.x1], [0.02, 0.09], [PLOT.z1 - 4.2, PLOT.z1 - 2.6], c.interlock)
}

function buildParking(ctx: A01Ctx, p: Object3D) {
  const park = (z: number, body: 'crossover' | 'sedan', paint: string, nudge = 0) => {
    const x = (BAYS.x0 + BAYS.x1) / 2 + nudge
    if (!within(ctx, x, z + 2.4)) return
    parkedCar(p, body, paint, x, z, 0, 0.03)
    ctx.shade.rect(x, 0.035, z, 1.9, 4.5, 0, 0.75)
  }
  const bay = (i: number) => BAYS.z0 + ((BAYS.z1 - BAYS.z0) * (i + 0.5)) / 4
  park(bay(0), 'crossover', '#e9eaea', 0.05)
  park(bay(1) + 0.2, 'sedan', '#2a2c30', -0.06)
  park(bay(3) - 0.1, 'sedan', '#a6aaae', 0.03)
  // One on the drive, waiting to turn in.
  parkedCar(p, 'crossover', '#7d8186', (DRIVE.x0 + DRIVE.x1) / 2 + 1.1, -15, PI, 0.02)
  ctx.shade.rect((DRIVE.x0 + DRIVE.x1) / 2 + 1.1, 0.03, -15, 1.9, 4.5, 0, 0.75)
}

/** The covered ramp to the basement car park, its mouth on the drive's far end. */
function buildRamp(ctx: A01Ctx, p: Object3D) {
  const { c, k, shade } = ctx
  const { x0, x1, z0, z1, h } = RAMP
  const wall = c.grc
  bx(ctx, p, [x0, x1], [0, h], [z0, z0 + 0.25], wall)
  bx(ctx, p, [x0, x1], [0, h], [z1 - 0.25, z1], wall)
  bx(ctx, p, [x0 + 0.6, x1], [h - 0.35, h], [z0, z1], c.concrete)
  bx(ctx, p, [x0 + 0.6, x1], [h, h + 0.12], [z0, z1], c.apron)
  bx(ctx, p, [x1 - 0.25, x1], [0, h], [z0, z1], wall)
  shade.edge([[x0, z1], [x1, z1]], GL + 0.004, 0.6, 1, 0.5)
  // The mouth: a white header with the car park sign and a height bar, the ramp falling away into the dark.
  bx(ctx, p, [x0, x0 + 0.6], [h - 0.75, h + 0.12], [z0, z1], c.band)
  k.box(p, 0.04, 0.9, 0.9, c.pSign, x0 - 0.03, h - 0.33, (z0 + z1) / 2 + 1.6, false)
  for (let i = 0; i < 5; i++) bx(ctx, p, [x0 - 0.35, x0 - 0.25], [2.35, 2.5], [z0 + 0.3 + i * 0.95, z0 + 0.8 + i * 0.95], i % 2 ? c.plantDark : c.hazard)
  for (const z of [z0 + 0.3, z1 - 0.3]) bx(ctx, p, [x0 - 0.35, x0 - 0.25], [0, 2.5], [z - 0.05, z + 0.05], c.plantDark)
  bx(ctx, p, [x0 + 3.2, x0 + 3.25], [0, h - 0.35], [z0 + 0.25, z1 - 0.25], c.void, false)
  bx(ctx, p, [x0 + 0.1, x0 + 3.1], [h - 0.37, h - 0.35], [(z0 + z1) / 2 - 0.05, (z0 + z1) / 2 + 0.05], c.led, false)
  shade.rect(x0 + 1.8, 0.03, (z0 + z1) / 2, 3.2, z1 - z0 - 0.5, 0, 0.6)
  bx(ctx, p, [x0 - 1.6, x0 - 1.2], [0.02, 0.08], [z0 + 0.3, z1 - 0.3], c.hazard)
}

/** Substation and generator yard behind the north wing. */
function buildYard(ctx: A01Ctx, p: Object3D) {
  const { c, shade } = ctx
  const { x0, x1, z0, z1 } = YARD
  bx(ctx, p, [x0, x1], [0, GL], [z0, z1], c.apron)
  const fence = (xs: R, zs: R) => bx(ctx, p, xs, [GL, 2.4], zs, c.fence(Math.max(xs[1] - xs[0], zs[1] - zs[0]), 2.25), false, true)
  fence([x0, x0 + 0.02], [z0, z1])
  fence([x0 + 3, x1], [z1 - 0.02, z1])
  for (const [x, z] of [[x0, z0], [x0, z1], [x0 + 3, z1], [x1, z1], [x0, (z0 + z1) / 2]] as const) bx(ctx, p, [x - 0.04, x + 0.04], [GL, 2.45], [z - 0.04, z + 0.04], c.mullion)
  const tx = x0 + 2.4
  const tz = z0 + 2.0
  bx(ctx, p, [tx - 1.0, tx + 1.0], [GL, 1.95], [tz - 0.7, tz + 0.7], c.plant)
  for (let i = -3; i <= 3; i++) bx(ctx, p, [tx + i * 0.26 - 0.02, tx + i * 0.26 + 0.02], [0.3, 1.7], [tz + 0.7, tz + 1.05], c.plant)
  for (const dx of [-0.5, 0, 0.5]) ctx.k.cyl(p, 0.07, 0.09, 0.45, c.white, tx + dx, 2.15, tz, 10)
  shade.rect(tx, GL + 0.005, tz + 0.2, 2.2, 2.0, 0, 0.6)
  const gx = x1 - 2.4
  bx(ctx, p, [gx - 1.25, gx + 1.25], [GL, 2.55], [z0 + 0.6, z0 + 5.0], c.greigeMetric)
  bx(ctx, p, [gx - 1.3, gx + 1.3], [2.55, 2.65], [z0 + 0.55, z0 + 5.05], c.coping)
  for (let z = z0 + 1.0; z < z0 + 4.8; z += 0.25) bx(ctx, p, [gx - 1.27, gx - 1.25], [1.2, 2.2], [z, z + 0.12], c.plantDark, false)
  ctx.k.cyl(p, 0.14, 0.14, 2.2, c.aluminium, gx + 0.7, 3.7, z0 + 1.2, 12)
  shade.rect(gx, GL + 0.005, z0 + 2.8, 2.6, 4.5, 0, 0.6)
}

/** Compound walls on the south, west and north boundaries: rendered base, stone coping, bar railing. */
function buildWalls(ctx: A01Ctx, p: Object3D) {
  const { c, shade } = ctx
  const white = c.whiteMetric
  const wallZ = (xs: R, zs: R) => {
    const run = bxIn(ctx, p, xs, [0, 0.9], zs, white)
    bxIn(ctx, p, [xs[0] - 0.03, xs[1] + 0.03], [0.9, 0.96], zs, c.coping)
    bxIn(ctx, p, [(xs[0] + xs[1]) / 2 - 0.01, (xs[0] + xs[1]) / 2 + 0.01], [0.96, 1.8], zs, c.railing(zs[1] - zs[0]), false, true)
    if (run) for (const [x, side] of [[xs[0], 1], [xs[1], -1]] as const) shade.edge([[x, run[0]], [x, run[1]]], 0.03, 0.4, side, 0.5)
  }
  const wallX = (x0: number, x1: number, z: number) => {
    bx(ctx, p, [x0, x1], [0, 0.9], [z, z + WALL_T], white)
    bx(ctx, p, [x0, x1], [0.9, 0.96], [z - 0.03, z + WALL_T + 0.03], c.coping)
    bx(ctx, p, [x0, x1], [0.96, 1.8], [z + WALL_T / 2 - 0.01, z + WALL_T / 2 + 0.01], c.railing(x1 - x0), false, true)
    shade.edge([[x0, z + WALL_T], [x1, z + WALL_T]], 0.03, 0.4, 1, 0.5)
  }
  wallZ([PLOT.x0, PLOT.x0 + WALL_T], [PLOT.z0, PLOT.z1])
  wallZ([PLOT.x1 - WALL_T, PLOT.x1], [PLOT.z0, PLOT.z1])
  // The back wall, open where the drive runs through to the cross road.
  wallX(DRIVE.x1 + 0.6, PLOT.x1 - WALL_T, PLOT.z0)
  // Gate piers in granite at both ends of the drive.
  for (const [x, z] of [[DRIVE.x1 + 0.3, PLOT.z1 - 0.4], [DRIVE.x1 + 0.3, PLOT.z0 + 0.35]] as const)
    if (within(ctx, x, z)) {
      bx(ctx, p, [x - 0.3, x + 0.3], [0, 1.6], [z - 0.3, z + 0.3], c.granite)
      shade.rect(x, 0.03, z, 0.9, 0.9, 0, 0.55)
    }
  // The forecourt's road edge: a low granite step with stainless bollards, open to the footpath.
  const edge = PLOT.z1 - 0.2
  for (let x = COURT.x0 + 0.8; x < COURT.x1 - 0.4; x += 1.8)
    if (within(ctx, x, edge, 0.5)) {
      ctx.k.cyl(p, 0.085, 0.09, 0.9, c.chromeRail, x, GL + 0.45, edge - 0.3, 20)
      shade.pool(x, GL + 0.004, edge - 0.3, 0.22, 0.22, 0.5)
    }
}

/** Curved stone benches round the plaza and planters along the forecourt. */
function buildFurniture(ctx: A01Ctx, p: Object3D) {
  const { c, k, shade } = ctx
  const seat = c.surface('teak', 1, 1)
  for (const t of [-45, -25, 25, 45]) {
    const [x, z] = polar(t, PLAZA_R + 1.6)
    const g = k.at(x, z, (t * PI) / 180 + PI, GL)
    k.box(g, 2.2, 0.38, 0.5, c.granite, 0, 0.19, 0)
    for (let i = 0; i < 4; i++) k.box(g, 2.3, 0.05, 0.11, seat, 0, 0.405, -0.19 + i * 0.125)
    shade.rect(x, GL + 0.004, z, 2.4, 0.7, (t * PI) / 180, 0.5)
  }
  // Raised planters along the forecourt, with seats on their edges.
  let seed = 2500
  const planter = (x0: number, x1: number, z0: number, z1: number) => {
    if (!within(ctx, x1, z1)) return
    bx(ctx, p, [x0, x1], [GL, GL + 0.48], [z0, z1], c.granite)
    bx(ctx, p, [x0 - 0.03, x1 + 0.03], [GL + 0.48, GL + 0.52], [z0 - 0.03, z1 + 0.03], c.granite)
    bx(ctx, p, [x0 + 0.15, x1 - 0.15], [GL + 0.52, GL + 0.525], [z0 + 0.15, z1 - 0.15], c.mulch, false)
    shade.edge([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], GL + 0.004, 0.35, -1, 0.45, true)
    for (let x = x0 + 0.5; x < x1 - 0.35; x += 0.7) shrub(ctx.plant, x, GL + 0.52, (z0 + z1) / 2 + (((seed * 0.61) % 0.3) - 0.15), 0.36, 0.6, seed++)
  }
  planter(COURT.x0 + 0.8, COURT.x0 + 6.5, 19.5, 21)
  planter(COURT.x1 - 6.5, COURT.x1 - 0.8, 13.5, 15)
}

function buildPlanting(ctx: A01Ctx, p: Object3D) {
  const { plant } = ctx
  // Tall, slim trees in the gap between the south wing and the centre, as in the reference, and a
  // rain tree beyond it.
  for (const [t, r, sp, seed, s] of [[-134, 12.4, 'ashoka', 1701, 1.1], [-134, 16.4, 'ashoka', 1702, 1.25], [-131, 21.6, 'rain', 1703, 0.8]] as const) {
    const [x, z] = polar(t, r)
    tree(plant, SPECIES[sp], x, GL, z, seed, s)
    ctx.k.box(p, 1.2, 0.01, 1.2, ctx.c.plantDark, x, GL + 0.006, z, false)
  }
  // A screen of mast Ashoka along the north fire walk, and rain trees in the back corners.
  for (let z = -20; z < 16; z += 4.2) if (within(ctx, PLOT.x1 - 1.3, z, 1)) tree(plant, SPECIES.ashoka, PLOT.x1 - 1.3, GL, z, 1720 + Math.round(z), 0.85)
  tree(plant, SPECIES.rain, YARD.x0 - 1.5, GL, -22.6, 1740, 0.75)
  // Street trees on the forecourt edge, clear of the plaza's view.
  for (const [x, sp, seed] of [[-13.5, 'neem', 1750], [17.5, 'neem', 1751]] as const)
    if (within(ctx, x, PLOT.z1 - 2.2, 1.2)) {
      tree(plant, SPECIES[sp], x, GL, PLOT.z1 - 2.2, seed, 0.8)
      ctx.k.box(p, 1.2, 0.01, 1.2, ctx.c.plantDark, x, GL + 0.006, PLOT.z1 - 2.2, false)
    }
  // Lawn on the strip behind the ramp.
  if (!ctx.onPlan) lawn(plant, RAMP.x1 + 0.3, YARD.x0 - 0.3, PLOT.z0 + 0.4, RAMP.z1 - 0.2, GL, 1850)
  for (const f of plant.footprints) ctx.shade.pool(f.x, f.y + 0.006, f.z, f.r, f.r, f.strength)
}

/** Pole lights on the drive, bollards on the plaza, and the building's own wash lights. */
function buildLighting(ctx: A01Ctx, p: Object3D) {
  const { c, k, shade } = ctx
  const pole = (x: number, z: number, h: number) => {
    if (!within(ctx, x, z)) return
    k.cyl(p, 0.055, 0.1, h, c.galvanised, x, h / 2 + 0.03, z, 8)
    k.box(p, 0.36, 0.03, 0.36, c.galvanised, x, 0.045, z)
    const arm = k.cyl(p, 0.035, 0.04, 1.2, c.galvanised, x + 0.55, h - 0.05, z, 8)
    arm.rotation.z = PI / 2
    k.box(p, 0.62, 0.07, 0.3, c.luminaire, x + 1.15, h - 0.08, z)
    k.box(p, 0.5, 0.01, 0.24, c.lamp, x + 1.15, h - 0.12, z, false)
    shade.pool(x, 0.03, z, 0.35, 0.35, 0.5)
  }
  for (const z of [-18, -4, 10]) pole(DRIVE.x0 + 0.4, z, 7)
  // Bollard lights round the plaza and along the north walk.
  const bollard = (x: number, z: number) => {
    if (!within(ctx, x, z)) return
    k.cyl(p, 0.09, 0.09, 0.85, c.luminaire, x, GL + 0.425, z, 16)
    k.cyl(p, 0.085, 0.085, 0.12, c.lamp, x, GL + 0.72, z, 16).castShadow = false
    shade.pool(x, GL + 0.004, z, 0.25, 0.25, 0.5)
  }
  for (const t of [-60, -25, 25, 60]) bollard(...polar(t, PLAZA_R + 2.8))
  for (let z = -14; z < 14; z += 7) bollard(PLOT.x1 - 2.7, z)
  for (const x of [-9, 9]) {
    const l = ctx.lighting.light(new PointLight('#ffd9ad', 7, 14, 2), 0)
    l.position.set(P.x + x, 1.2, P.z + 9)
    p.add(l)
  }
}

/** A stone monolith at the gate carrying the name in channel letters. */
function buildPylon(ctx: A01Ctx, p: Object3D) {
  const { c } = ctx
  const x = BAYS.x1 + 1.9
  const z = PLOT.z1 - 1.8
  if (!within(ctx, x, z)) return
  // Broadside to the road, the name on a dark panel near its top.
  bx(ctx, p, [x - 1.6, x + 1.6], [GL, GL + 0.25], [z - 0.8, z + 0.8], c.granite)
  bx(ctx, p, [x - 1.4, x + 1.4], [GL + 0.25, 5.2], [z - 0.55, z + 0.55], c.grc)
  bx(ctx, p, [x - 1.25, x + 1.25], [3.6, 4.9], [z + 0.55, z + 0.58], c.plantDark)
  NAME.split(' ').forEach((line, i) => {
    const g = signLine(ctx, line, 0.36, 0.04)
    g.position.set(x, 4.35 - i * 0.6, z + 0.6)
    p.add(g)
  })
  ctx.shade.rect(x, GL + 0.004, z, 3.4, 1.8, 0, 0.55)
}

/* ---------- surroundings ---------- */

const CROSS = 33 * FT
/** The plot and what is shown round it: the HMDA road in front, the cross road behind, Prime Mall's plot to the south. */
export const SITE = { minX: PLOT.x0 - 10, maxX: PLOT.x1 + 8, minZ: PLOT.z0 - CROSS - 2, maxZ: PLOT.z1 + 26 }

/**
 * The roads round the plot, for the property's own view (the master plan draws its own): the HMDA
 * road's footpath, service lane, median and carriageway; the 33 ft cross road behind; Plot A-02
 * to the south and the open ground to the north.
 */
export function buildContext(ctx: A01Ctx, p: Object3D) {
  const { c, plant } = ctx
  const zf = PLOT.z1
  ground(ctx, p, rect(SITE.minX, SITE.maxX, zf, zf + 3), 0.15, c.interlock)
  ground(ctx, p, rect(SITE.minX, SITE.maxX, zf + 3, zf + 10.5), 0.02, c.asphalt)
  ground(ctx, p, rect(SITE.minX, SITE.maxX, zf + 10.5, zf + 12.5), 0.2, c.lawnGround)
  ground(ctx, p, rect(SITE.minX, SITE.maxX, zf + 12.5, SITE.maxZ), 0.02, c.asphalt)
  for (const [z, h] of [[zf + 3, 0.18], [zf + 10.5, 0.24], [zf + 12.5, 0.24]] as const) {
    bx(ctx, p, [SITE.minX, SITE.maxX], [0, h], [z - 0.075, z + 0.075], c.kerb(SITE.maxX - SITE.minX), true, true)
  }
  for (const z of [zf + 16.2, zf + 19.9])
    for (let x = SITE.minX + 1; x < SITE.maxX - 3; x += 9) bx(ctx, p, [x, x + 3], [0.02, 0.024], [z - 0.06, z + 0.06], c.lane, false)
  lawn(plant, SITE.minX, SITE.maxX, zf + 10.6, zf + 12.4, 0.2, 1500, 180)
  let seed = 1600
  for (let x = SITE.minX + 2; x < SITE.maxX - 1; x += 2.8 + ((seed * 0.53) % 1.2)) shrub(plant, x, 0.2, zf + 11.5 + (((seed * 0.31) % 0.4) - 0.2), 0.45 + ((seed * 0.13) % 0.2), 0.7 + ((seed * 0.41) % 0.3), seed++)
  // The cross road behind, with a footpath on the plot's side.
  ground(ctx, p, rect(SITE.minX, SITE.maxX, PLOT.z0 - CROSS, PLOT.z0 - 1.5), 0.02, c.asphalt)
  ground(ctx, p, rect(SITE.minX, SITE.maxX, PLOT.z0 - 1.5, PLOT.z0), 0.15, c.interlock)
  ground(ctx, p, rect(SITE.minX, SITE.maxX, SITE.minZ, PLOT.z0 - CROSS), 0.02, c.fallow)
  // Prime Mall's plot to the south and open ground to the north.
  ground(ctx, p, rect(SITE.minX, PLOT.x0, PLOT.z0, zf), 0.02, c.fallow)
  ground(ctx, p, rect(PLOT.x1, SITE.maxX, PLOT.z0, zf), 0.02, c.fallow)
}

