import { ExtrudeGeometry, Mesh, PointLight, Shape, type Material, type Object3D } from 'three'
import type { Point2 } from '../../../../../api/types'
import { PI } from '../kit'
import { channelLetters, MALL_NAME, podiumOutline, PORTALS, type MallCtx } from './building'
import { parkedCar } from '../car'
import { hedge, lawn, shrub, SPECIES, tree } from './foliage'
import { BAYS, BX0, BX1, clipHalf, DRIVE, ENTRY_X, FRONTAGE_Z, FT, GL, PLAZA_Z, PLOT, REAR_Z } from './plan'
import { metricBox, rect, slab } from './solids'

/*
 * The grounds: a raised forecourt before the entrance, stepping down to a drop-off lane and a row
 * of visitor parking, with a landscaped strip and the mall's pylon on the road edge. Traffic runs
 * one way round the building: in at the south gate, either north along the drop-off lane or down
 * the entry road on the south (left) side; along the service road across the back, past the
 * loading bays and the basement car park's IN and OUT portals in the rear wall; and up the exit
 * road on the north (right) side to the drop-off lane's end and out at the north gate. The plot's
 * back is closed by an unbroken compound wall: nothing reaches the cross road behind. The
 * substation and generator stand in a shallow fenced enclosure against that wall.
 *
 * Finishes are those such a site is built in: flamed granite on the forecourt, broom-finished
 * concrete on the apron, grey concrete pavers in the bays and on footpaths, bituminous concrete on
 * the drives, 900 mm precast kerbs. Everything that stands on the ground sits in a pool of
 * contact shade (contact.ts); the planting is grown in foliage.ts.
 */

type R = [number, number]

export interface SiteCtx extends MallCtx {
  /** On the master plan: trim the forecourt to the layout's skewed road edge. */
  onPlan: boolean
}

const WALL_T = 0.23
const SOUTH_GATE: R = [PLOT.x0, -16.4]
const NORTH_GATE: R = [16.4, PLOT.x1]
const WALK: R = [ENTRY_X - 2.4, ENTRY_X + 2.4]
/** The substation and generator enclosure against the back wall, clear of the service road's turns. */
const YARD = { x0: -2, x1: 10, z0: PLOT.z0 + WALL_T, z1: -30.7 }
/** Where the podium's edge runs across the back, and the service road's lane between it and the enclosure. */
const REAR_EDGE = REAR_Z - 0.4


/** Inside the plot as the plan draws it (with a margin), or anywhere in the property's own view. */
const within = (ctx: SiteCtx, x: number, z: number, margin = 0.6) => !ctx.onPlan || z <= FRONTAGE_Z(x) - margin

/** A box from extents; its UVs in metres unless `unit` (for materials mapped once per face: railings, kerbs). */
function bx({ k }: SiteCtx, p: Object3D, [x0, x1]: R, [y0, y1]: R, [z0, z1]: R, mat: Material | Material[], cast = true, unit = false) {
  if (unit) return k.box(p, x1 - x0, y1 - y0, z1 - z0, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, cast)
  return k.mesh(metricBox(x1 - x0, y1 - y0, z1 - z0), mat, p, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, cast)
}

/** A box whose front may be cut back to the plan's road edge (walls and kerbs running east). */
function bxIn(ctx: SiteCtx, p: Object3D, xs: R, ys: R, [z0, z1]: R, mat: Material | Material[], cast = true, unit = false): R | null {
  const end = ctx.onPlan ? Math.min(z1, FRONTAGE_Z(xs[0]) - 0.4, FRONTAGE_Z(xs[1]) - 0.4) : z1
  if (end - z0 <= 0.05) return null
  bx(ctx, p, xs, ys, [z0, end], mat, cast, unit)
  return [z0, end]
}

/** A ground surface laid at true scale, trimmed to the plan's road edge on the master plan. */
function ground(ctx: SiteCtx, p: Object3D, poly: Point2[], y: number, mat: Material) {
  const shape = ctx.onPlan ? clipHalf(poly, -0.3636, -1, 33.53 - 0.3) : poly
  if (shape.length >= 3) slab(p, shape, 0, y, [mat, ctx.c.concrete], [], false)
}

/** A run of precast kerb along x (at z) or along z (at x), with its shade on the low side. */
function kerbX(ctx: SiteCtx, p: Object3D, [x0, x1]: R, z: number, h: number, low: 1 | -1, y = 0) {
  bx(ctx, p, [x0, x1], [y, y + h], [z - 0.075, z + 0.075], ctx.c.kerb(x1 - x0), true, true)
  ctx.shade.edge([[x0, z + low * 0.075], [x1, z + low * 0.075]], y + 0.025, 0.22, low, 0.45)
}
function kerbZ(ctx: SiteCtx, p: Object3D, x: number, [z0, z1]: R, h: number) {
  const run = bxIn(ctx, p, [x - 0.075, x + 0.075], [0, h], [z0, z1], ctx.c.kerb(z1 - z0), true, true)
  if (!run) return
  for (const side of [-1, 1] as const) ctx.shade.edge([[x + side * 0.075, run[0]], [x + side * 0.075, run[1]]], 0.035, 0.18, side > 0 ? -1 : 1, 0.35)
}

export function buildSite(ctx: SiteCtx, p: Object3D) {
  const { c } = ctx

  /* ---- surfaces ---- */
  // Front drive and drop-off lane, the gates, the side drives and the service yard.
  ground(ctx, p, rect(PLOT.x0, PLOT.x1, DRIVE.z0, DRIVE.z1), 0.02, c.asphalt)
  ground(ctx, p, rect(...SOUTH_GATE, DRIVE.z1, PLOT.z1), 0.02, c.asphalt)
  ground(ctx, p, rect(...NORTH_GATE, DRIVE.z1, PLOT.z1), 0.02, c.asphalt)
  ground(ctx, p, rect(PLOT.x0, BX0, REAR_Z, DRIVE.z0), 0.02, c.asphalt)
  ground(ctx, p, rect(BX1, PLOT.x1, REAR_Z, DRIVE.z0), 0.02, c.asphalt)
  ground(ctx, p, rect(PLOT.x0, PLOT.x1, PLOT.z0, REAR_Z), 0.02, c.asphalt)
  // The apron at kerb height below the forecourt, and the walk from the road to the crossing.
  ground(ctx, p, rect(BX0, BX1, PLAZA_Z, DRIVE.z0), 0.15, c.apron)
  ground(ctx, p, rect(...WALK, BAYS.z0, PLOT.z1), 0.15, c.paving)
  // Visitor parking in concrete pavers, and the lawn strip on the road edge.
  ground(ctx, p, rect(SOUTH_GATE[1], WALK[0], BAYS.z0, BAYS.z1), 0.03, c.interlock)
  ground(ctx, p, rect(WALK[1], NORTH_GATE[0], BAYS.z0, BAYS.z1), 0.03, c.interlock)
  ground(ctx, p, rect(SOUTH_GATE[1], WALK[0], BAYS.z1, PLOT.z1), 0.1, c.lawnGround)
  ground(ctx, p, rect(WALK[1], NORTH_GATE[0], BAYS.z1, PLOT.z1), 0.1, c.lawnGround)

  // The podium's foot: shade where its granite edge meets the drives and apron.
  ctx.shade.edge(podiumOutline(), 0.035, 0.5, 1, 0.5, true)

  buildForecourt(ctx, p)
  buildMarkings(ctx, p)
  buildParking(ctx, p)
  buildRearAccess(ctx, p)
  buildYard(ctx, p)
  buildWalls(ctx, p)
  buildPlanting(ctx, p)
  buildLighting(ctx, p)
  buildPylon(ctx, p)
}

/** Steps and the accessible ramp down from the forecourt, planters along its edge, benches. */
function buildForecourt(ctx: SiteCtx, p: Object3D) {
  const { c, k, shade } = ctx
  // Two risers of 150 mm across the centre, onto the apron, with a contrasting nosing strip.
  bx(ctx, p, [ENTRY_X - 6, ENTRY_X + 6], [0, 0.3], [PLAZA_Z, PLAZA_Z + 0.35], c.granite)
  bx(ctx, p, [ENTRY_X - 6, ENTRY_X + 6], [0.3, 0.303], [PLAZA_Z + 0.3, PLAZA_Z + 0.35], c.plantDark, false)
  bx(ctx, p, [ENTRY_X - 6, ENTRY_X + 6], [GL, GL + 0.003], [PLAZA_Z - 0.05, PLAZA_Z], c.plantDark, false)
  shade.edge([[ENTRY_X - 6, PLAZA_Z + 0.35], [ENTRY_X + 6, PLAZA_Z + 0.35]], 0.155, 0.25, 1, 0.4)
  // An accessible ramp at 1:20 along the forecourt's north end, with handrails both sides.
  const ramp = new Shape()
  ramp.moveTo(8, 0)
  ramp.lineTo(14.2, 0)
  ramp.lineTo(14.2, 0.15)
  ramp.lineTo(8, GL)
  ramp.closePath()
  const geo = new ExtrudeGeometry(ramp, { depth: 1.5, bevelEnabled: false })
  geo.translate(0, 0, PLAZA_Z - 1.5)
  const r = new Mesh(geo, c.apron)
  r.receiveShadow = true
  p.add(r)
  bx(ctx, p, [14.2, 15.8], [0, 0.15], [PLAZA_Z - 1.5, PLAZA_Z], c.apron, false)
  const surface = (x: number) => GL - ((GL - 0.15) * (x - 8)) / 6.2
  for (const z of [PLAZA_Z - 1.48, PLAZA_Z - 0.02]) {
    const rail = k.cyl(p, 0.024, 0.024, 6.3, c.chromeRail, 11.1, surface(11.1) + 0.9, z, 12)
    rail.rotation.z = PI / 2 - Math.atan2(GL - 0.15, 6.2)
    for (let x = 8.2; x <= 14.2; x += 1.5) {
      k.cyl(p, 0.021, 0.021, 0.9, c.chromeRail, x, surface(x) + 0.45, z, 10)
      k.cyl(p, 0.05, 0.05, 0.01, c.chromeRail, x, surface(x) + 0.005, z, 12)
    }
  }

  // Planters on the forecourt's edge: granite upstands round mulched beds of shrubs, wide enough to sit on.
  let seed = 40
  const planter = ([x0, x1]: R) => {
    const z0 = PLAZA_Z - 1.5
    const z1 = PLAZA_Z - 0.1
    bx(ctx, p, [x0, x1], [GL, GL + 0.48], [z0, z1], c.granite)
    bx(ctx, p, [x0 - 0.03, x1 + 0.03], [GL + 0.48, GL + 0.52], [z0 - 0.03, z1 + 0.03], c.granite)
    bx(ctx, p, [x0 + 0.15, x1 - 0.15], [GL + 0.52, GL + 0.525], [z0 + 0.15, z1 - 0.15], c.mulch, false)
    shade.edge([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], GL + 0.004, 0.35, -1, 0.45, true)
    for (let x = x0 + 0.55; x < x1 - 0.4; x += 0.75 + ((seed * 0.37) % 0.3)) {
      shrub(ctx.plant, x, GL + 0.52, (z0 + z1) / 2 + (((seed * 0.61) % 0.3) - 0.15), 0.38 + ((seed * 0.17) % 0.14), 0.55 + ((seed * 0.29) % 0.25), seed++)
    }
  }
  planter([BX0 + 0.5, ENTRY_X - 6.3])
  planter([ENTRY_X + 6.3, 7.6])
  planter([16.2, BX1 - 0.4])

  // Benches facing the entrance: granite plinths with hardwood slatted seats on steel brackets.
  const seat = c.surface('teak', 1, 1)
  for (const x of [-12.5, -8.5, 5.5]) {
    bx(ctx, p, [x - 1.1, x + 1.1], [GL, GL + 0.36], [15.65, 16.05], c.granite)
    for (let i = 0; i < 5; i++) bx(ctx, p, [x - 1.25, x + 1.25], [GL + 0.37, GL + 0.42], [15.52 + i * 0.13, 15.63 + i * 0.13], seat)
    for (const dx of [-0.9, 0.9]) bx(ctx, p, [x + dx - 0.03, x + dx + 0.03], [GL + 0.36, GL + 0.37], [15.5, 16.2], c.chromeRail)
    shade.rect(x, GL + 0.004, 15.85, 2.4, 0.6, 0, 0.5)
  }
  // Stainless bollards keeping vehicles off the apron at the crossing.
  for (let x = WALK[0] - 1.6; x <= WALK[1] + 1.6; x += 1.6) {
    k.cyl(p, 0.085, 0.09, 0.9, c.chromeRail, x, 0.15 + 0.45, DRIVE.z0 - 0.35, 20)
    k.cyl(p, 0.088, 0.088, 0.04, c.garden, x, 0.15 + 0.8, DRIVE.z0 - 0.35, 20).castShadow = false
    shade.pool(x, 0.155, DRIVE.z0 - 0.35, 0.22, 0.22, 0.5)
  }
}

/** Bays of at least 2.5 m across a run of parking. */
const bayCount = (x0: number, x1: number) => Math.floor((x1 - x0) / 2.5)
const bayCentre = (x0: number, x1: number, i: number) => x0 + ((x1 - x0) * (i + 0.5)) / bayCount(x0, x1)

/** Kerbs, lane lines, the zebra crossing and the parking bays. */
function buildMarkings(ctx: SiteCtx, p: Object3D) {
  const { c } = ctx
  // Kerb along the apron and round the parking row.
  kerbX(ctx, p, [BX0, BX1], DRIVE.z0 - 0.075, 0.17, 1)
  bxIn(ctx, p, [SOUTH_GATE[1], NORTH_GATE[0]], [0, 0.14], [BAYS.z1 - 0.15, BAYS.z1], c.kerb(NORTH_GATE[0] - SOUTH_GATE[1]), true, true)
  for (const x of [SOUTH_GATE[1], WALK[0], WALK[1], NORTH_GATE[0]]) kerbZ(ctx, p, x, [BAYS.z0, PLOT.z1], 0.17)
  // The drop-off lane's yellow edge.
  bx(ctx, p, [BX0, BX1], [0.02, 0.024], [DRIVE.z0 + 0.1, DRIVE.z0 + 0.25], c.hazard, false)
  // Zebra crossing to the walk.
  for (let x = WALK[0] + 0.25; x < WALK[1] - 0.3; x += 1.0) bx(ctx, p, [x, x + 0.5], [0.02, 0.025], [DRIVE.z0 + 0.4, DRIVE.z1 - 0.3], c.lane, false)
  // Bay lines and precast wheel stops.
  for (const [x0, x1] of [[SOUTH_GATE[1], WALK[0]], [WALK[1], NORTH_GATE[0]]] as R[]) {
    const n = bayCount(x0, x1)
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n
      if (within(ctx, x, BAYS.z1)) bx(ctx, p, [x - 0.05, x + 0.05], [0.03, 0.034], [BAYS.z0 + 0.2, BAYS.z1 - 0.2], c.lane, false)
      if (i < n && within(ctx, x + 1.25, BAYS.z1)) {
        const xs: R = [x + 0.5, x + (x1 - x0) / n - 0.5]
        bx(ctx, p, xs, [0.03, 0.13], [BAYS.z1 - 0.78, BAYS.z1 - 0.62], c.kerb(xs[1] - xs[0]), true, true)
        ctx.shade.rect((xs[0] + xs[1]) / 2, 0.034, BAYS.z1 - 0.7, xs[1] - xs[0], 0.3, 0, 0.45)
      }
    }
  }
}

/** Visitor cars in the bays and one at the drop-off, each on its own shadow. */
function buildParking(ctx: SiteCtx, p: Object3D) {
  const park = (x: number, z: number, yaw: number, body: 'crossover' | 'sedan', paint: string) => {
    if (!within(ctx, x, z + 2.4)) return
    parkedCar(p, body, paint, x, z, yaw, 0.03)
    ctx.shade.rect(x, 0.035, z, 1.9, 4.5, yaw, 0.75)
  }
  const southBay = (i: number) => bayCentre(SOUTH_GATE[1], WALK[0], i)
  const northBay = (i: number) => bayCentre(WALK[1], NORTH_GATE[0], i)
  const z = (BAYS.z0 + BAYS.z1) / 2 - 0.15
  // A real car park's mix: mostly white, silver and grey, a dark car, one in colour, parked a little unevenly.
  park(southBay(0), z + 0.1, 0.02, 'crossover', '#e9eaea')
  park(southBay(1), z - 0.12, -0.015, 'sedan', '#2a2c30')
  park(southBay(3), z + 0.05, 0.01, 'sedan', '#a6aaae')
  park(northBay(0), z, -0.02, 'crossover', '#6e1a1c')
  park(northBay(2), z + 0.14, 0.012, 'sedan', '#ecebe7')
  park(northBay(3), z - 0.06, 0.025, 'crossover', '#7d8186')
  park(northBay(5), z + 0.08, -0.01, 'crossover', '#e9eaea')
  park(ENTRY_X - 7.5, DRIVE.z0 + 1.6, PI / 2, 'sedan', '#c8c9c6')
}

/** A painted arrow on the road: its tip at (x, z), pointing along +x, −x, +z or −z. */
function arrow(ctx: SiteCtx, p: Object3D, x: number, z: number, dir: '+x' | '-x' | '+z' | '-z') {
  if (!within(ctx, x, z + 1)) return
  const s = dir[0] === '+' ? 1 : -1
  const alongX = dir[1] === 'x'
  const shaft: [R, R] = alongX ? [[Math.min(x, x - s * 2), Math.max(x, x - s * 2)], [z - 0.08, z + 0.08]] : [[x - 0.08, x + 0.08], [Math.min(z, z - s * 2), Math.max(z, z - s * 2)]]
  bx(ctx, p, shaft[0], [0.02, 0.025], shaft[1], ctx.c.lane, false)
  for (const side of [-1, 1]) {
    const m = bx(ctx, p, [-0.4, 0.4], [0.02, 0.025], [-0.06, 0.06], ctx.c.lane, false)
    if (alongX) {
      m.position.set(x - s * 0.28, 0.0225, z + side * 0.2)
      m.rotation.y = side * s * 0.65
    } else {
      m.position.set(x + side * 0.2, 0.0225, z - s * 0.28)
      m.rotation.y = PI / 2 - side * s * 0.65
    }
  }
}

/**
 * The one-way circuit's markings and the way into the basement: arrows in on the south road,
 * across the back and out on the north road, and along the drop-off lane; a give-way line at the
 * exit gate; ramped aprons up to the basement portals in the rear wall.
 */
function buildRearAccess(ctx: SiteCtx, p: Object3D) {
  const { c, shade } = ctx
  const southX = (PLOT.x0 + WALL_T + BX0 - 0.4) / 2
  const northX = (BX1 + 0.4 + PLOT.x1 - WALL_T) / 2
  const laneZ = (YARD.z1 + REAR_EDGE) / 2
  for (const z of [12, -4, -20]) arrow(ctx, p, southX, z, '-z')
  for (const z of [-20, -4, 12]) arrow(ctx, p, northX, z, '+z')
  for (const x of [-12, 13.5]) arrow(ctx, p, x, (PLOT.z0 + REAR_EDGE) / 2, '+x')
  arrow(ctx, p, 3.5, laneZ, '+x')
  for (const x of [-12, 9]) arrow(ctx, p, x, (DRIVE.z0 + DRIVE.z1) / 2 + 1.2, '+x')
  // The give-way line across the exit gate, and stop bars where the side roads meet the front lane.
  bxIn(ctx, p, [NORTH_GATE[0] + 0.3, PLOT.x1 - WALL_T - 0.2], [0.02, 0.026], [PLOT.z1 - 2.6, PLOT.z1 - 2.3], c.lane, false)
  bx(ctx, p, [BX1 + 0.5, PLOT.x1 - WALL_T - 0.2], [0.02, 0.026], [DRIVE.z0 - 0.6, DRIVE.z0 - 0.3], c.lane, false)
  // A kerb along the enclosure's front, between it and the service road.
  kerbX(ctx, p, [YARD.x0, YARD.x1], YARD.z1 + 0.075, 0.15, 1)
  // Ramped aprons up the podium's edge to the portals, and the shade of their mouths.
  // In the property view they run on to the podium's edge, so a walker can go up them and in.
  const top = ctx.openings ? REAR_Z + 0.05 : REAR_EDGE
  for (const x of [PORTALS.in, PORTALS.out]) {
    const w = PORTALS.w
    const shape = new Shape()
    shape.moveTo(REAR_EDGE - 2.2, 0.02)
    shape.lineTo(REAR_EDGE, GL)
    shape.lineTo(top, GL)
    shape.lineTo(top, 0)
    shape.lineTo(REAR_EDGE - 2.2, 0)
    shape.closePath()
    const geo = new ExtrudeGeometry(shape, { depth: w, bevelEnabled: false })
    geo.rotateY(-PI / 2)
    geo.translate(x + w / 2, 0, 0)
    const m = new Mesh(geo, c.asphalt)
    m.receiveShadow = true
    p.add(m)
    shade.rect(x, GL + 0.01, REAR_Z + 0.6, w, 1.4, 0, 0.6)
  }
}

/** Substation and generator enclosure against the back wall: chain-link fence, transformer, DG set with its stack. */
function buildYard(ctx: SiteCtx, p: Object3D) {
  const { c, shade } = ctx
  const { x0, x1, z0, z1 } = YARD
  bx(ctx, p, [x0, x1], [0, 0.15], [z0, z1], c.apron)
  const fence = (xs: R, zs: R) => bx(ctx, p, xs, [0.15, 2.4], zs, c.fence(Math.max(xs[1] - xs[0], zs[1] - zs[0]), 2.25), false, true)
  fence([x0, x0 + 0.02], [z0, z1])
  fence([x1 - 0.02, x1], [z0, z1])
  fence([x0, x1 - 2.4], [z1 - 0.02, z1])
  for (const [x, z] of [[x0, z1], [x1, z1], [x1 - 2.4, z1], [(x0 + x1) / 2, z1]] as const) bx(ctx, p, [x - 0.04, x + 0.04], [0.15, 2.45], [z - 0.04, z + 0.04], c.mullion)
  // Transformer: tank with cooling fins and bushings.
  const tx = x0 + 1.6
  const tz = z0 + 1.1
  bx(ctx, p, [tx - 1.0, tx + 1.0], [0.15, 1.95], [tz - 0.7, tz + 0.7], c.plant)
  for (let i = -3; i <= 3; i++) bx(ctx, p, [tx + i * 0.26 - 0.02, tx + i * 0.26 + 0.02], [0.3, 1.7], [tz + 0.7, tz + 1.05], c.plant)
  for (const dx of [-0.5, 0, 0.5]) ctx.k.cyl(p, 0.07, 0.09, 0.45, c.white, tx + dx, 2.15, tz, 10)
  shade.rect(tx, 0.155, tz + 0.2, 2.2, 2.0, 0, 0.6)
  // Diesel generator in its acoustic enclosure, lying along the wall.
  const gx = x0 + 6.6
  const gz = z0 + 1.35
  bx(ctx, p, [gx - 2.4, gx + 2.4], [0.15, 2.55], [gz - 1.1, gz + 1.1], c.surface('greige', 1, 1))
  bx(ctx, p, [gx - 2.45, gx + 2.45], [2.55, 2.65], [gz - 1.15, gz + 1.15], c.coping)
  for (let x = gx - 2.0; x < gx + 2.0; x += 0.25) bx(ctx, p, [x, x + 0.12], [1.2, 2.2], [gz + 1.1, gz + 1.12], c.plantDark, false)
  ctx.k.cyl(p, 0.14, 0.14, 2.2, c.aluminium, gx - 1.8, 3.7, gz - 0.5, 12)
  shade.rect(gx, 0.155, gz, 5.0, 2.4, 0, 0.6)
}

/** Compound walls on the south, west and north boundaries, the back one unbroken: rendered base, stone coping, bar railing. */
function buildWalls(ctx: SiteCtx, p: Object3D) {
  const { c, shade } = ctx
  const white = c.surface('white', 1, 1)
  const wall = (xs: R, zs: R) => {
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
  wall([PLOT.x0, PLOT.x0 + WALL_T], [PLOT.z0, PLOT.z1])
  wall([PLOT.x1 - WALL_T, PLOT.x1], [PLOT.z0, PLOT.z1])
  wallX(PLOT.x0 + WALL_T, PLOT.x1 - WALL_T, PLOT.z0)
  // Piers at the gates.
  for (const [x, z] of [[SOUTH_GATE[1] + 0.3, PLOT.z1 - 0.4], [NORTH_GATE[0] - 0.3, PLOT.z1 - 0.4]] as const)
    if (within(ctx, x, z)) {
      bx(ctx, p, [x - 0.3, x + 0.3], [0, 1.6], [z - 0.3, z + 0.3], c.granite)
      shade.rect(x, 0.11, z, 0.9, 0.9, 0, 0.55)
    }
}

function buildPlanting(ctx: SiteCtx, p: Object3D) {
  const { plant } = ctx
  // Street trees in the road-edge strip, neem and rain tree alternately, each its own shape.
  const street: [number, 'neem' | 'rain'][] = [[-13.6, 'rain'], [-7.4, 'neem'], [4.6, 'neem'], [12.6, 'rain']]
  street.forEach(([x, sp], i) => {
    if (within(ctx, x, PLOT.z1 - 0.9, 1.2)) tree(plant, SPECIES[sp], x, 0.1, PLOT.z1 - 0.95, 1100 + i * 17, sp === 'rain' ? 0.8 : 0.9)
  })
  // A clipped duranta hedge behind the parking kerb.
  for (const [x0, x1] of [[SOUTH_GATE[1] + 0.4, WALK[0] - 0.4], [WALK[1] + 0.4, NORTH_GATE[0] - 0.4]] as R[]) {
    // On the plan, the hedge stops at the road edge.
    const end = ctx.onPlan ? Math.min(x1, (33.53 - 0.6 - (BAYS.z1 + 0.45)) / 0.3636) : x1
    if (end > x0 + 0.5) {
      hedge(plant, x0, end, 0.1, BAYS.z1 + 0.45, 0.75, 0.6, 1200 + Math.round(x0))
      ctx.shade.edge([[x0, BAYS.z1 + 0.15], [end, BAYS.z1 + 0.15]], 0.105, 0.3, -1, 0.5)
      ctx.shade.edge([[x0, BAYS.z1 + 0.75], [end, BAYS.z1 + 0.75]], 0.105, 0.3, 1, 0.5)
    }
  }
  if (!ctx.onPlan) {
    lawn(plant, SOUTH_GATE[1] + 0.1, WALK[0] - 0.1, BAYS.z1 + 0.8, PLOT.z1 - 0.05, 0.1, 1300)
    lawn(plant, WALK[1] + 0.1, NORTH_GATE[0] - 0.1, BAYS.z1 + 0.8, PLOT.z1 - 0.05, 0.1, 1301)
  }
  // Mast Ashoka at the forecourt's corners: slim columns that frame the building without hiding it,
  // each in a granite-edged tree pit with a cast-iron grate.
  for (const [x, z, seed] of [[BX0 + 1.4, 16.4, 1400], [BX0 + 3.6, 16.9, 1401], [BX1 - 1.3, 16.2, 1402]] as const) {
    tree(plant, SPECIES.ashoka, x, GL, z, seed, 0.95)
    bx(ctx, p, [x - 0.6, x + 0.6], [GL, GL + 0.01], [z - 0.6, z + 0.6], ctx.c.plantDark, false)
  }
  for (const f of plant.footprints) ctx.shade.pool(f.x, f.y + 0.006, f.z, f.r, f.r, f.strength)
}

/** Octagonal tapered steel poles with LED heads on the drive and in the yard, and the façade's uplights. */
function buildLighting(ctx: SiteCtx, p: Object3D) {
  const { c, k, lighting, shade } = ctx
  const pole = (x: number, z: number, h: number, dir: number) => {
    if (!within(ctx, x, z)) return
    k.cyl(p, 0.055, 0.1, h, c.galvanised, x, h / 2 + 0.03, z, 8)
    k.box(p, 0.36, 0.03, 0.36, c.galvanised, x, 0.045, z)
    for (const [dx, dz] of [[-0.13, -0.13], [0.13, -0.13], [0.13, 0.13], [-0.13, 0.13]]) k.cyl(p, 0.012, 0.012, 0.05, c.galvanised, x + dx, 0.07, z + dz, 6)
    if (dir) {
      const arm = k.cyl(p, 0.035, 0.04, 1.2, c.galvanised, x, h - 0.05, z + dir * 0.55, 8)
      arm.rotation.x = PI / 2 - 0.1 * dir
    }
    k.box(p, 0.3, 0.07, 0.62, c.luminaire, x, h - 0.08, z + dir * 1.15)
    k.box(p, 0.24, 0.01, 0.5, c.lamp, x, h - 0.12, z + dir * 1.15, false)
    shade.pool(x, 0.03, z, 0.35, 0.35, 0.5)
  }
  for (const x of [-15, -8.5, 5.5, 12]) pole(x, DRIVE.z0 - 0.6, 8, 1)
  for (const z of [-14, 2]) {
    pole(PLOT.x0 + 0.6, z, 7, 0)
    pole(PLOT.x1 - 0.6, z, 7, 0)
  }
  pole(-10, PLOT.z0 + 0.6, 7, 1)
  pole(16, PLOT.z0 + 0.6, 7, 1)
  // Ground uplights washing the skin's underside at the forecourt planters.
  for (const x of [-12, 9]) {
    const l = lighting.light(new PointLight('#ffd9ad', 8, 14, 2), 0)
    l.position.set(x, 1.5, 15.5)
    p.add(l)
  }
}

/** The mall's pylon beside the south gate: aluminium with a faceted panel and the name lit at the top. */
function buildPylon(ctx: SiteCtx, p: Object3D) {
  const { c } = ctx
  const x = PLOT.x0 + 1.3
  const z = PLOT.z1 - 1.6
  if (!within(ctx, x, z)) return
  bx(ctx, p, [x - 1.2, x + 1.2], [0, 0.3], [z - 0.45, z + 0.45], c.granite)
  bx(ctx, p, [x - 1.05, x + 1.05], [0.3, 6.4], [z - 0.3, z + 0.3], c.frame)
  bx(ctx, p, [x - 0.9, x + 0.9], [0.8, 5.2], [z + 0.3, z + 0.32], c.pylonPanel)
  bx(ctx, p, [x - 1.05, x + 1.05], [5.35, 6.4], [z + 0.3, z + 0.33], c.plantDark)
  // The name in two lines on the head, KALLAKAL over MALL.
  MALL_NAME.split(' ').forEach((line, i) => {
    const name = channelLetters(c, line, 0.26, 0.05)
    name.position.set(x, 5.98 - i * 0.42, z + 0.33)
    p.add(name)
  })
  ctx.shade.rect(x, 0.025, z, 2.6, 1.1, 0, 0.6)
}

const AVENUE = 60 * FT
const CROSS = 33 * FT
/** The plot and what is shown round it: the main avenue to the south, the cross road behind, the HMDA road in front. */
export const SITE = { minX: PLOT.x0 - AVENUE - 2, maxX: PLOT.x1 + 6, minZ: PLOT.z0 - CROSS - 2, maxZ: PLOT.z1 + 26 }

/**
 * The roads round the plot, for the property's own view (the master plan draws its own): the HMDA
 * road's footpath, service lane, median and carriageway; the 60 ft avenue; the 33 ft cross road;
 * and Plot A-01 to the north, still open ground.
 */
export function buildContext(ctx: SiteCtx, p: Object3D) {
  const { c, plant } = ctx
  const zf = PLOT.z1
  const ax0 = PLOT.x0 - AVENUE

  // HMDA road: footpath, kerbs, service lane, planted median and the near carriageway.
  ground(ctx, p, rect(PLOT.x0, SITE.maxX, zf, zf + 3), 0.15, c.interlock)
  ground(ctx, p, rect(SITE.minX, ax0, zf, zf + 3), 0.15, c.interlock)
  ground(ctx, p, rect(SITE.minX, SITE.maxX, zf + 3, zf + 10.5), 0.02, c.asphalt)
  ground(ctx, p, rect(SITE.minX, SITE.maxX, zf + 10.5, zf + 12.5), 0.2, c.lawnGround)
  ground(ctx, p, rect(SITE.minX, SITE.maxX, zf + 12.5, SITE.maxZ), 0.02, c.asphalt)
  kerbX(ctx, p, [SITE.minX, SITE.maxX], zf + 3, 0.18, 1)
  kerbX(ctx, p, [SITE.minX, SITE.maxX], zf + 10.5, 0.24, -1)
  kerbX(ctx, p, [SITE.minX, SITE.maxX], zf + 12.5, 0.24, 1)
  for (const z of [zf + 16.2, zf + 19.9])
    for (let x = SITE.minX + 1; x < SITE.maxX - 3; x += 9) bx(ctx, p, [x, x + 3], [0.02, 0.024], [z - 0.06, z + 0.06], c.lane, false)
  // Low planting on the median, so the road view stays open: bougainvillea-like shrubs on mown grass.
  lawn(plant, SITE.minX, SITE.maxX, zf + 10.6, zf + 12.4, 0.2, 1500, 180)
  let seed = 1600
  for (let x = SITE.minX + 2; x < SITE.maxX - 1; x += 2.8 + ((seed * 0.53) % 1.2)) shrub(plant, x, 0.2, zf + 11.5 + (((seed * 0.31) % 0.4) - 0.2), 0.45 + ((seed * 0.13) % 0.2), 0.7 + ((seed * 0.41) % 0.3), seed++)
  for (const x of [-18, 0, 18]) streetLight(ctx, p, x, zf + 2.4)

  // The main avenue: footpaths each side, its carriageway running out to the HMDA road.
  ground(ctx, p, rect(PLOT.x0 - 1.5, PLOT.x0, PLOT.z0, zf), 0.15, c.interlock)
  ground(ctx, p, rect(ax0, ax0 + 1.5, PLOT.z0, zf), 0.15, c.interlock)
  ground(ctx, p, rect(ax0 + 1.5, PLOT.x0 - 1.5, PLOT.z0 - CROSS, zf + 3), 0.02, c.asphalt)
  for (let z = PLOT.z0 - CROSS + 1; z < zf; z += 4.5) bx(ctx, p, [PLOT.x0 - AVENUE / 2 - 0.06, PLOT.x0 - AVENUE / 2 + 0.06], [0.02, 0.024], [z, z + 2.5], c.lane, false)
  ground(ctx, p, rect(SITE.minX, ax0, SITE.minZ, zf), 0.02, c.fallow)

  // The cross road behind, with a footpath on the plot's side, and open ground beyond.
  ground(ctx, p, rect(PLOT.x0 - 1.5, SITE.maxX, PLOT.z0 - CROSS, PLOT.z0 - 1.5), 0.02, c.asphalt)
  ground(ctx, p, rect(PLOT.x0 - 1.5, SITE.maxX, PLOT.z0 - 1.5, PLOT.z0), 0.15, c.interlock)
  ground(ctx, p, rect(ax0 + 1.5, SITE.maxX, SITE.minZ, PLOT.z0 - CROSS), 0.02, c.fallow)
  // Plot A-01, to the north.
  ground(ctx, p, rect(PLOT.x1, SITE.maxX, PLOT.z0, zf), 0.02, c.fallow)
}

function streetLight({ k, c, shade }: SiteCtx, p: Object3D, x: number, z: number) {
  k.cyl(p, 0.07, 0.12, 9, c.galvanised, x, 4.65, z, 8)
  k.box(p, 0.4, 0.03, 0.4, c.galvanised, x, 0.165, z)
  const arm = k.cyl(p, 0.04, 0.045, 1.9, c.galvanised, x, 8.95, z + 0.9, 8)
  arm.rotation.x = PI / 2 - 0.12
  k.box(p, 0.36, 0.08, 0.75, c.luminaire, x, 9.02, z + 1.8)
  k.box(p, 0.3, 0.01, 0.62, c.lamp, x, 8.975, z + 1.8, false)
  shade.pool(x, 0.155, z, 0.4, 0.4, 0.5)
}
