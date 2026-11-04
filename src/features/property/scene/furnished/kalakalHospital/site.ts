import { PointLight, type Material, type Object3D } from 'three'
import type { Point2 } from '../../../../../api/types'
import { PI } from '../kit'
import { parkedCar } from '../car'
import { hedge, lawn, shrub, SPECIES, tree } from '../kalakalMall/foliage'
import { metricBox, rect, slab } from '../kalakalMall/solids'
import { signLine } from '../kalakalHotel/building'
import { ambulance } from './ambulance'
import { NAME, NAVY, type HospitalCtx } from './building'
import { BACK_Z, BODY, clipHalf, DRIVE, ER, EXIT, FRONTAGE, FRONTAGE_Z, FT, GARDEN, GL, LANE, MAIN, PARK, PLOT, RAMP, TOWER, WALK, WALL_T, YARD } from './plan'

/*
 * The grounds, one way round. Cars come in off the HMDA road by the entry drive along the south
 * boundary: some turn north along the drop-off lane in front of the building, under the
 * porte-cochère, to the exit road; the rest carry on down the drive to the basement ramp, the
 * parking and the service court behind, and round by the aisle to the exit road, which runs back
 * up the north side past the emergency entrance's drive-through bay and out to the road. The back
 * is walled off from the cross road with no gate. Between the lane and the road is
 * the garden: lawns with neem and rain trees, a seating court, and the entrance walk straight to
 * the main doors across a zebra. Behind the building, the covered ramp down to the basements,
 * a row of bays on an aisle off the drive, the service court and the fenced utility yard with
 * the liquid oxygen tank, the transformer and the generator.
 */

type R = [number, number]

/** Inside the plot as the plan draws it (with a margin), or anywhere in the property's own view. */
const within = (ctx: HospitalCtx, x: number, z: number, margin = 0.6) => !ctx.onPlan || z <= FRONTAGE_Z(x) - margin

/** A box from extents; its UVs in metres unless `unit` (for materials mapped once per face: railings, kerbs). */
function bx({ k }: HospitalCtx, p: Object3D, [x0, x1]: R, [y0, y1]: R, [z0, z1]: R, mat: Material | Material[], cast = true, unit = false) {
  if (unit) return k.box(p, x1 - x0, y1 - y0, z1 - z0, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, cast)
  return k.mesh(metricBox(x1 - x0, y1 - y0, z1 - z0), mat, p, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, cast)
}

/** A box running east whose front may be cut back to the plan's road edge. */
function bxIn(ctx: HospitalCtx, p: Object3D, xs: R, ys: R, [z0, z1]: R, mat: Material | Material[], cast = true, unit = false): R | null {
  const end = ctx.onPlan ? Math.min(z1, FRONTAGE_Z(xs[0]) - 0.4, FRONTAGE_Z(xs[1]) - 0.4) : z1
  if (end - z0 <= 0.05) return null
  bx(ctx, p, xs, ys, [z0, end], mat, cast, unit)
  return [z0, end]
}

/** A box running north at depth z, its north end cut back to the plan's road edge. */
function bxAcross(ctx: HospitalCtx, p: Object3D, [x0, x1]: R, ys: R, zs: R, mat: Material | Material[], cast = true, unit = false): R | null {
  const end = ctx.onPlan ? Math.min(x1, (FRONTAGE.c - 0.4 - zs[1]) / -FRONTAGE.k) : x1
  if (end - x0 <= 0.05) return null
  bx(ctx, p, [x0, end], ys, zs, mat, cast, unit)
  return [x0, end]
}

/** A ground surface laid at true scale, trimmed to the plan's road edge on the master plan. */
function ground(ctx: HospitalCtx, p: Object3D, poly: Point2[], y: number, mat: Material) {
  const shape = ctx.onPlan ? clipHalf(poly, FRONTAGE.k, -1, FRONTAGE.c - 0.3) : poly
  if (shape.length >= 3) slab(p, shape, 0, y, [mat, ctx.c.concrete], [], false)
}

/** Precast kerbs: along z at x, or along x at z; their shade on both sides. */
function kerbZ(ctx: HospitalCtx, p: Object3D, x: number, zs: R, h = GL + 0.02) {
  const run = bxIn(ctx, p, [x - 0.075, x + 0.075], [0, h], zs, ctx.c.kerb(zs[1] - zs[0]), true, true)
  if (!run) return
  for (const side of [-1, 1] as const) ctx.shade.edge([[x + side * 0.075, run[0]], [x + side * 0.075, run[1]]], 0.035, 0.18, side > 0 ? -1 : 1, 0.35)
}
function kerbX(ctx: HospitalCtx, p: Object3D, z: number, xs: R, h = GL + 0.02) {
  const run = bxAcross(ctx, p, xs, [0, h], [z - 0.075, z + 0.075], ctx.c.kerb(xs[1] - xs[0]), true, true)
  if (!run) return
  for (const side of [-1, 1] as const) ctx.shade.edge([[run[0], z + side * 0.075], [run[1], z + side * 0.075]], 0.035, 0.18, side > 0 ? 1 : -1, 0.35)
}

/** The garden: a paved strip along the lane, the entrance walk, a seating court, lawns round them. */
const STRIP = LANE.z1 + 1.7
const FRONT_WALK = PLOT.z1 - 2
const COURT = { x0: -9.5, x1: -3.5, z0: 31, z1: 37 }
const PATH = { z0: 33.4, z1: 34.6 }
const LAWNS: [number, number, number, number][] = [
  [GARDEN.x0, WALK.x0, STRIP, COURT.z0],
  [GARDEN.x0, COURT.x0, COURT.z0, COURT.z1],
  [COURT.x1, WALK.x0, COURT.z0, PATH.z0],
  [COURT.x1, WALK.x0, PATH.z1, COURT.z1],
  [GARDEN.x0, WALK.x0, COURT.z1, FRONT_WALK],
  [WALK.x1, GARDEN.x1, STRIP, FRONT_WALK],
]

export function buildSite(ctx: HospitalCtx, p: Object3D) {
  const { c } = ctx
  // Asphalt: the entry drive, the drop-off lane, the exit road.
  ground(ctx, p, rect(DRIVE.x0, DRIVE.x1, PLOT.z0 + WALL_T, PLOT.z1), 0.02, c.asphalt)
  ground(ctx, p, rect(DRIVE.x1, EXIT.x0, LANE.z0, LANE.z1), 0.02, c.asphalt)
  ground(ctx, p, rect(EXIT.x0, EXIT.x1, PLOT.z0 + WALL_T, PLOT.z1), 0.02, c.asphalt)
  // At the back: the bays, the aisle round to the exit road, the ramp's floor and the service court.
  ground(ctx, p, rect(DRIVE.x1, YARD.x0, PARK.z0, PARK.z1), 0.02, c.asphalt)
  ground(ctx, p, rect(DRIVE.x1, EXIT.x0, PARK.z1, RAMP.z0), 0.02, c.asphalt)
  ground(ctx, p, rect(DRIVE.x1, RAMP.x1, RAMP.z0, RAMP.z1), 0.02, c.asphalt)
  ground(ctx, p, rect(RAMP.x1, EXIT.x0, RAMP.z0, BODY.z0), 0.02, c.asphalt)
  // Paving: the terrace before the fronts, the walks round the building, the verge by the north wall.
  ground(ctx, p, rect(DRIVE.x1, EXIT.x0, BACK_Z, LANE.z0), GL, c.paving)
  ground(ctx, p, rect(DRIVE.x1, BODY.x0, RAMP.z1, BACK_Z), GL, c.paving)
  ground(ctx, p, rect(DRIVE.x1, RAMP.x1, RAMP.z1, BODY.z0), GL, c.paving)
  ground(ctx, p, rect(BODY.x1, EXIT.x0, BODY.z0, BACK_Z), GL, c.paving)
  ground(ctx, p, rect(EXIT.x1, PLOT.x1 - WALL_T, PLOT.z0 + WALL_T, PLOT.z1), GL, c.paving)
  // The garden.
  ground(ctx, p, rect(GARDEN.x0, GARDEN.x1, LANE.z1, STRIP), GL, c.paving)
  ground(ctx, p, rect(WALK.x0, WALK.x1, STRIP, FRONT_WALK), GL, c.paving)
  ground(ctx, p, rect(GARDEN.x0, GARDEN.x1, FRONT_WALK, PLOT.z1), GL, c.paving)
  ground(ctx, p, rect(COURT.x0, COURT.x1, COURT.z0, COURT.z1), GL, c.paving)
  ground(ctx, p, rect(COURT.x1, WALK.x0, PATH.z0, PATH.z1), GL, c.paving)
  for (const [x0, x1, z0, z1] of LAWNS) ground(ctx, p, rect(x0, x1, z0, z1), GL - 0.05, c.lawnGround)

  buildEdges(ctx, p)
  buildVehicles(ctx, p)
  buildRamp(ctx, p)
  buildYard(ctx, p)
  buildWalls(ctx, p)
  buildFurniture(ctx, p)
  buildPlanting(ctx)
  buildLighting(ctx, p)
  buildDirectory(ctx, p)
}

/* ---------- kerbs and markings ---------- */

function buildEdges(ctx: HospitalCtx, p: Object3D) {
  const { c, shade } = ctx
  // The lane's kerbs, dropped flush where the walk crosses it on the zebra.
  kerbX(ctx, p, LANE.z0, [DRIVE.x1, WALK.x0])
  kerbX(ctx, p, LANE.z0, [WALK.x1, EXIT.x0])
  kerbX(ctx, p, LANE.z1, [GARDEN.x0, WALK.x0])
  kerbX(ctx, p, LANE.z1, [WALK.x1, GARDEN.x1])
  // Along the drive, the exit road (flush at the emergency doors) and the service court.
  kerbZ(ctx, p, DRIVE.x1, [LANE.z1, PLOT.z1])
  kerbZ(ctx, p, DRIVE.x1, [RAMP.z1, LANE.z0])
  kerbZ(ctx, p, EXIT.x0, [LANE.z1, PLOT.z1])
  kerbZ(ctx, p, EXIT.x0, [BODY.z0, ER.door - 1.5])
  kerbZ(ctx, p, EXIT.x0, [ER.door + 1.5, LANE.z0])
  bx(ctx, p, [EXIT.x0 - 0.075, EXIT.x0 + 0.075], [0, 0.04], [ER.door - 1.5, ER.door + 1.5], c.kerb(3), false, true)
  bx(ctx, p, [EXIT.x0 - 0.6, EXIT.x0 - 0.075], [GL, GL + 0.006], [ER.door - 1.5, ER.door + 1.5], c.tactile, false)
  kerbZ(ctx, p, EXIT.x1, [PLOT.z0 + WALL_T, PLOT.z1])
  kerbZ(ctx, p, RAMP.x1, [RAMP.z1, BODY.z0])
  // Granite edging round the lawns, a hand's breadth above the grass.
  for (const [x0, x1, z0, z1] of LAWNS) {
    for (const x of [x0, x1]) bxIn(ctx, p, [x - 0.05, x + 0.05], [GL - 0.12, GL + 0.02], [z0, z1], c.granite)
    for (const z of [z0, z1]) bxAcross(ctx, p, [x0, x1], [GL - 0.12, GL + 0.02], [z - 0.05, z + 0.05], c.granite)
  }

  // The zebra across the lane, tactile paving at both ends, the walk's flush kerb.
  for (let z = LANE.z0 + 0.5; z < LANE.z1 - 0.4; z += 1.0) bx(ctx, p, [WALK.x0 + 0.1, WALK.x1 - 0.1], [0.02, 0.025], [z, z + 0.5], c.lane, false)
  for (const [z0, z1] of [[LANE.z0 - 0.6, LANE.z0], [LANE.z1, LANE.z1 + 0.6]] as R[]) bx(ctx, p, [WALK.x0, WALK.x1], [GL, GL + 0.006], [z0, z1], c.tactile, false)
  for (const z of [LANE.z0, LANE.z1]) bx(ctx, p, [WALK.x0, WALK.x1], [0, 0.04], [z - 0.075, z + 0.075], c.kerb(WALK.x1 - WALK.x0), false, true)
  // The lane's arrows (one way, north), the exit road's (towards the road) and its give-way line.
  const arrow = (x: number, z: number, along: 'x' | 'z') => {
    const shaft: [R, R] = along === 'x' ? [[x - 1.6, x + 0.4], [z - 0.08, z + 0.08]] : [[x - 0.08, x + 0.08], [z - 1.6, z + 0.4]]
    bx(ctx, p, shaft[0], [0.02, 0.024], shaft[1], c.lane, false)
    for (const s of [-1, 1]) {
      const m = bx(ctx, p, [-0.38, 0.38], [0.02, 0.024], [-0.06, 0.06], c.lane, false)
      if (along === 'x') {
        m.position.set(x + 0.15, 0.022, z + s * 0.2)
        m.rotation.y = s * 0.65
      } else {
        m.position.set(x + s * 0.2, 0.022, z + 0.15)
        m.rotation.y = PI / 2 - s * 0.65
      }
    }
  }
  // An arrow along the drive towards the back (−z).
  const arrow2 = (x: number, z: number) => {
    bx(ctx, p, [x - 0.08, x + 0.08], [0.02, 0.024], [z - 0.4, z + 1.6], c.lane, false)
    for (const s of [-1, 1]) {
      const m = bx(ctx, p, [-0.38, 0.38], [0.02, 0.024], [-0.06, 0.06], c.lane, false)
      m.position.set(x + s * 0.2, 0.022, z - 0.15)
      m.rotation.y = PI / 2 + s * 0.65
    }
  }
  arrow(-9, (LANE.z0 + LANE.z1) / 2, 'x')
  arrow(10.5, (LANE.z0 + LANE.z1) / 2 + 0.8, 'x')
  const ex = (EXIT.x0 + EXIT.x1) / 2
  for (const z of [-30, -14, 12, 30]) if (within(ctx, ex, z + 1)) arrow(ex, z, 'z')
  bxIn(ctx, p, [EXIT.x0 + 0.2, EXIT.x1 - 0.2], [0.02, 0.025], [PLOT.z1 - 3.0, PLOT.z1 - 2.7], c.lane, false)
  // The ambulance bay under the emergency canopy: a yellow box on the exit road.
  for (const [xs, zs] of [
    [[EXIT.x0 + 0.2, EXIT.x0 + 0.32], [ER.z0, ER.z1]],
    [[EXIT.x1 - 0.32, EXIT.x1 - 0.2], [ER.z0, ER.z1]],
    [[EXIT.x0 + 0.2, EXIT.x1 - 0.2], [ER.z0, ER.z0 + 0.12]],
    [[EXIT.x0 + 0.2, EXIT.x1 - 0.2], [ER.z1 - 0.12, ER.z1]],
  ] as [R, R][])
    bx(ctx, p, xs, [0.02, 0.025], zs, c.hazard, false)
  // The entry drive: one way in, its arrows pointing to the back; a speed table at the gate.
  const mid = (DRIVE.x0 + DRIVE.x1) / 2
  for (const z of [36, 8, -20]) if (within(ctx, mid, z + 0.5)) arrow2(mid, z)
  bxIn(ctx, p, [DRIVE.x0, DRIVE.x1], [0.02, 0.09], [PLOT.z1 - 4.2, PLOT.z1 - 2.6], c.interlock)
  // Bay lines and wheel stops along the back wall.
  for (let i = 0; i <= PARK.bays; i++) {
    const x = PARK.x0 + i * PARK.bay
    bx(ctx, p, [x - 0.05, x + 0.05], [0.02, 0.024], [PARK.z0 + 0.3, PARK.z1], c.lane, false)
    if (i < PARK.bays) bx(ctx, p, [x + 0.5, x + PARK.bay - 0.5], [0.02, 0.14], [PARK.z0 + 0.9, PARK.z0 + 1.05], c.concrete)
  }
  shade.rect(PARK.x0 + (PARK.bays * PARK.bay) / 2, 0.025, PARK.z0 + 0.97, PARK.bays * PARK.bay, 0.4, 0, 0.3)
}

/* ---------- vehicles ---------- */

function buildVehicles(ctx: HospitalCtx, p: Object3D) {
  const { shade } = ctx
  // The ambulance at the emergency doors, nose to the road; a car setting down at the main doors; one coming in.
  ambulance(ctx, p, (EXIT.x0 + EXIT.x1) / 2, 0.02, ER.door + 0.6, 0)
  const dropX = 3.2
  const dropZ = LANE.z0 + 1.25
  parkedCar(p, 'sedan', '#e9eaea', dropX, dropZ, PI / 2, 0.02)
  shade.rect(dropX, 0.03, dropZ, 1.9, 4.6, PI / 2, 0.75)
  const dx = (DRIVE.x0 + DRIVE.x1) / 2 - 1.3
  if (within(ctx, dx, 34 + 2.4)) {
    parkedCar(p, 'crossover', '#30435c', dx, 34, PI, 0.02)
    shade.rect(dx, 0.03, 34, 1.9, 4.5, 0, 0.75)
  }
  // Staff cars in the bays at the back, nose to the wall.
  const cars: [number, 'sedan' | 'hatch' | 'crossover', string][] = [[0, 'hatch', '#8b1f22'], [1, 'sedan', '#d8d9da'], [3, 'crossover', '#1e2023'], [4, 'hatch', '#9a9a92'], [6, 'sedan', '#6d7a86']]
  for (const [i, body, colour] of cars) {
    const x = PARK.x0 + (i + 0.5) * PARK.bay
    const z = PARK.z0 + 2.6
    parkedCar(p, body, colour, x, z, PI, 0.02)
    shade.rect(x, 0.03, z, 1.85, 4.4, 0, 0.75)
  }
}

/* ---------- the covered ramp ---------- */

/**
 * The ramp down to the basements, covered over its length as it falls: white rendered walls, a
 * planted roof, the mouth onto the drive with its height bar and the lit sign over it.
 */
function buildRamp(ctx: HospitalCtx, p: Object3D) {
  const { c, k, shade, plant } = ctx
  const { x0, x1, z0, z1, h } = RAMP
  const T = 0.25
  bx(ctx, p, [x0, x1], [0, h], [z0, z0 + T], c.wall)
  bx(ctx, p, [x0, x1], [0, h], [z1 - T, z1], c.wall)
  bx(ctx, p, [x1 - T, x1], [0, h], [z0, z1], c.wall)
  bx(ctx, p, [x0, x1], [h - 0.3, h], [z0, z1], c.concrete)
  bx(ctx, p, [x0 - 0.05, x1 + 0.05], [h, h + 0.5], [z0 - 0.05, z0 + 0.2], c.wall)
  bx(ctx, p, [x0 - 0.05, x1 + 0.05], [h, h + 0.5], [z1 - 0.2, z1 + 0.05], c.wall)
  bx(ctx, p, [x1 - 0.2, x1 + 0.05], [h, h + 0.5], [z0, z1], c.wall)
  bx(ctx, p, [x0 - 0.05, x0 + 0.2], [h, h + 0.5], [z0, z1], c.wall)
  bx(ctx, p, [x0 + 0.2, x1 - 0.2], [h, h + 0.35], [z0 + 0.2, z1 - 0.2], c.lawnGround, false)
  let seed = 3300
  for (let x = x0 + 0.8; x < x1 - 0.5; x += 1.1) shrub(plant, x, h + 0.35, (z0 + z1) / 2 + ((seed % 3) - 1) * 0.9, 0.5, 0.7, seed++, seed % 2 ? 'shrub' : 'hedge')
  // The mouth: a header over the opening, the dark beyond it, the height bar and the sign.
  const zc = (z0 + z1) / 2
  const open: R = [z0 + T, z1 - T]
  bx(ctx, p, [x0, x0 + 0.3], [2.4, h - 0.3], open, c.wall)
  k.box(p, 0.02, 2.4, open[1] - open[0], c.void, x0 + 2.2, 1.22, zc, false)
  for (let i = 0; i < 8; i++) {
    const w = (open[1] - open[0] - 0.4) / 8
    const z = open[0] + 0.2 + i * w
    bx(ctx, p, [x0 - 0.5, x0 - 0.42], [2.12, 2.26], [z, z + w], i % 2 ? c.charcoal : c.hazard)
  }
  for (const z of [open[0] + 0.25, open[1] - 0.25]) bx(ctx, p, [x0 - 0.48, x0 - 0.44], [2.26, 2.4], [z - 0.02, z + 0.02], c.silver)
  k.box(p, 0.04, 0.42, 3.4, c.basementSign, x0 - 0.02, (2.4 + h - 0.3) / 2 + 0.03, zc, false)
  shade.rect(x0 + 2, 0.025, zc, 4, open[1] - open[0], 0, 0.75)
  shade.edge([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], 0.03, 0.6, 1, 0.45, true)
}

/* ---------- the utility yard ---------- */

/**
 * Liquid oxygen, the transformer and the generator, behind a chain-link fence between the parking
 * bays and the exit road, its gate onto the aisle.
 */
function buildYard(ctx: HospitalCtx, p: Object3D) {
  const { c, k, shade } = ctx
  const { x0, x1, z0, z1 } = YARD
  bx(ctx, p, [x0, x1], [0, GL], [z0, z1], c.apron)
  const fence = (xs: R, zs: R) => bx(ctx, p, xs, [GL, 2.4], zs, c.fence(Math.max(xs[1] - xs[0], zs[1] - zs[0]), 2.25), false, true)
  const gate: R = [x0 + 3.2, x0 + 6.2]
  fence([x0, x0 + 0.02], [z0, z1])
  fence([x1 - 0.02, x1], [z0, z1])
  fence([x0, gate[0]], [z1 - 0.02, z1])
  fence([gate[1], x1], [z1 - 0.02, z1])
  for (const [x, z] of [[x0, z1], [x1, z1], [gate[0], z1], [gate[1], z1], [x0, (z0 + z1) / 2], [x1, (z0 + z1) / 2]] as const) bx(ctx, p, [x - 0.04, x + 0.04], [GL, 2.45], [z - 0.04, z + 0.04], c.mullion)

  // The liquid oxygen tank on its legs, with the vaporiser banks beside it.
  const [ox, oz] = [x0 + 1.4, (z0 + z1) / 2 - 0.3]
  for (const [dx, dz] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) bx(ctx, p, [ox + dx - 0.08, ox + dx + 0.08], [GL, 1.0], [oz + dz - 0.08, oz + dz + 0.08], c.galvanised)
  k.cyl(p, 1.15, 1.15, 6.2, c.tank, ox, 1.0 + 3.1, oz, 40)
  k.blob(p, 1.15, c.tank, ox, 7.2, oz, 0.35)
  k.blob(p, 1.15, c.tank, ox, 1.0, oz, 0.35)
  for (let i = 0; i < 6; i++) {
    const vx = ox + 1.75 + (i % 3) * 0.5
    const vz = oz - 0.9 + Math.floor(i / 3) * 1.4
    k.box(p, 0.4, 3.4, 0.06, c.galvanised, vx, GL + 1.85, vz)
    k.box(p, 0.06, 3.4, 0.4, c.galvanised, vx, GL + 1.85, vz)
  }
  bx(ctx, p, [ox + 0.3, ox + 3.0], [3.9, 4.0], [oz - 0.05, oz + 0.05], c.galvanised)
  shade.pool(ox, GL + 0.005, oz, 1.8, 1.8, 0.6)
  shade.rect(ox + 2.25, GL + 0.005, oz, 1.6, 2.6, 0, 0.5)

  // The transformer on its plinth, and the generator in its acoustic enclosure with the stack.
  const tx = x0 + 5.5
  const tz = z0 + 1.4
  bx(ctx, p, [tx - 1.0, tx + 1.0], [GL, 1.95], [tz - 0.7, tz + 0.7], c.plant)
  for (let i = -3; i <= 3; i++) bx(ctx, p, [tx + i * 0.26 - 0.02, tx + i * 0.26 + 0.02], [0.3, 1.7], [tz + 0.7, tz + 1.05], c.plant)
  for (const dx of [-0.5, 0, 0.5]) k.cyl(p, 0.07, 0.09, 0.45, c.white, tx + dx, 2.15, tz, 10)
  shade.rect(tx, GL + 0.005, tz + 0.2, 2.2, 2.0, 0, 0.6)
  const gx = x1 - 1.4
  const gz = (z0 + z1) / 2
  bx(ctx, p, [gx - 1.1, gx + 1.1], [GL, 2.55], [gz - 2.2, gz + 2.2], c.greigeMetric)
  bx(ctx, p, [gx - 1.15, gx + 1.15], [2.55, 2.65], [gz - 2.25, gz + 2.25], c.coping)
  for (let z = gz - 1.8; z < gz + 1.9; z += 0.25) bx(ctx, p, [gx - 1.12, gx - 1.1], [1.2, 2.2], [z, z + 0.12], c.plantDark, false)
  k.cyl(p, 0.14, 0.14, 2.6, c.galvanised, gx + 0.6, 3.9, gz - 1.5, 12)
  shade.rect(gx, GL + 0.005, gz, 2.4, 4.6, 0, 0.6)
}

/* ---------- boundaries ---------- */

/** Compound walls on the south, north and west boundaries: rendered base, stone coping, bar railing; bollards and gate piers at the road. */
function buildWalls(ctx: HospitalCtx, p: Object3D) {
  const { c, shade } = ctx
  const white = c.whiteMetric
  const wallZ = (xs: R, zs: R) => {
    const run = bxIn(ctx, p, xs, [0, 0.9], zs, white)
    bxIn(ctx, p, [xs[0] - 0.03, xs[1] + 0.03], [0.9, 0.96], zs, c.coping)
    bxIn(ctx, p, [(xs[0] + xs[1]) / 2 - 0.01, (xs[0] + xs[1]) / 2 + 0.01], [0.96, 1.8], zs, c.railing(zs[1] - zs[0]), false, true)
    if (run) for (const [x, side] of [[xs[0], 1], [xs[1], -1]] as const) shade.edge([[x, run[0]], [x, run[1]]], 0.03, 0.4, side, 0.5)
  }
  wallZ([PLOT.x0, PLOT.x0 + WALL_T], [PLOT.z0, PLOT.z1])
  wallZ([PLOT.x1 - WALL_T, PLOT.x1], [PLOT.z0, PLOT.z1])
  // The back wall, unbroken across the whole plot: nothing comes in or goes out from the cross road.
  const [x0, x1, z] = [PLOT.x0 + WALL_T, PLOT.x1 - WALL_T, PLOT.z0]
  bx(ctx, p, [x0, x1], [0, 0.9], [z, z + WALL_T], white)
  bx(ctx, p, [x0, x1], [0.9, 0.96], [z - 0.03, z + WALL_T + 0.03], c.coping)
  bx(ctx, p, [x0, x1], [0.96, 1.8], [z + WALL_T / 2 - 0.01, z + WALL_T / 2 + 0.01], c.railing(x1 - x0), false, true)
  shade.edge([[x0, z + WALL_T], [x1, z + WALL_T]], 0.03, 0.4, 1, 0.5)
  // Gate piers in granite beside the way in and the way out.
  for (const [x, zz] of [
    [DRIVE.x1 + 0.3, PLOT.z1 - 0.4], [EXIT.x0 - 0.3, PLOT.z1 - 0.4],
  ] as const)
    if (within(ctx, x, zz)) {
      bx(ctx, p, [x - 0.3, x + 0.3], [0, 1.8], [zz - 0.3, zz + 0.3], c.granite)
      bx(ctx, p, [x - 0.34, x + 0.34], [1.8, 1.88], [zz - 0.34, zz + 0.34], c.coping)
      shade.rect(x, 0.03, zz, 0.9, 0.9, 0, 0.55)
    }
  // The garden's road edge: stainless bollards, open to the footpath.
  const edge = PLOT.z1 - 0.2
  for (let x = GARDEN.x0 + 1.4; x < GARDEN.x1 - 0.8; x += 1.8)
    if (within(ctx, x, edge, 0.5)) {
      ctx.k.cyl(p, 0.085, 0.09, 0.9, c.chromeRail, x, GL + 0.45, edge - 0.3, 20)
      shade.pool(x, GL + 0.004, edge - 0.3, 0.22, 0.22, 0.5)
    }
}

/* ---------- furniture ---------- */

/** Benches in the seating court and before the outpatient doors, planters on the terrace, cycle stands. */
function buildFurniture(ctx: HospitalCtx, p: Object3D) {
  const { c, k, shade, plant } = ctx
  const seat = c.surface('teak', 1, 1)
  const bench = (x: number, z: number, ry: number) => {
    if (!within(ctx, x, z)) return
    const g = k.at(x, z, ry, GL)
    k.box(g, 2.2, 0.38, 0.5, c.granite, 0, 0.19, 0)
    for (let i = 0; i < 4; i++) k.box(g, 2.3, 0.05, 0.11, seat, 0, 0.405, -0.19 + i * 0.125)
    k.box(g, 2.3, 0.4, 0.06, seat, 0, 0.66, -0.26)
    shade.rect(x, GL + 0.004, z, 2.4, 0.7, ry, 0.5)
  }
  // The seating court: benches round a raised bed with its tree.
  const cx = (COURT.x0 + COURT.x1) / 2
  const cz = (COURT.z0 + COURT.z1) / 2
  if (within(ctx, cx, cz + 3)) {
    bx(ctx, p, [cx - 1.1, cx + 1.1], [GL, GL + 0.5], [cz - 1.1, cz + 1.1], c.granite)
    bx(ctx, p, [cx - 1.0, cx + 1.0], [GL + 0.5, GL + 0.52], [cz - 1.0, cz + 1.0], c.mulch, false)
  }
  bench(cx, COURT.z0 + 0.6, 0)
  bench(cx, COURT.z1 - 0.6, PI)
  bench(COURT.x0 + 0.6, cz, PI / 2)
  // Before the outpatient doors, where people wait for their cars, and at the lane's edge.
  for (const x of [TOWER.x0 + 1.8, TOWER.x1 - 1.8]) bench(x, TOWER.z1 + 4.6, PI)
  // Round planters along the terrace's edge, either side of the walk.
  let seed = 3400
  for (const x of [-11.6, -1.6, 1.6, 10.6]) {
    const z = LANE.z0 - 0.9
    k.cyl(p, 0.55, 0.47, 0.6, c.charcoal, x, GL + 0.3, z, 32)
    k.cyl(p, 0.5, 0.5, 0.02, c.mulch, x, GL + 0.59, z, 24).castShadow = false
    shrub(plant, x, GL + 0.6, z, 0.45, 0.75, seed++, seed % 2 ? 'shrub' : 'hedge')
    shade.pool(x, GL + 0.005, z, 0.8, 0.8, 0.5)
  }
  // Cycle stands on the footpath by the tower.
  for (let i = 0; i < 4; i++) {
    const z = TOWER.z1 - 3 - i * 0.8
    const x = DRIVE.x1 + 0.7
    for (const dx of [-0.28, 0.28]) k.box(p, 0.05, 0.75, 0.05, c.galvanised, x + dx, GL + 0.375, z)
    k.box(p, 0.61, 0.05, 0.05, c.galvanised, x, GL + 0.75, z)
  }
  // Wheelchairs parked by the main doors, under the canopy.
  for (let i = 0; i < 3; i++) wheelchair(ctx, MAIN.x0 + 1.9 + i * 0.75, MAIN.lobby + 1.0, 0)
}

/** A folding wheelchair: two big wheels, the seat and back in navy, steel frame, footplates. */
function wheelchair(ctx: HospitalCtx, x: number, z: number, ry: number) {
  const { c, k } = ctx
  const g = k.at(x, z, ry, GL)
  for (const s of [-1, 1]) {
    const w = k.cyl(g, 0.3, 0.3, 0.03, c.plantDark, s * 0.3, 0.3, -0.05, 24)
    w.rotation.z = PI / 2
    const caster = k.cyl(g, 0.07, 0.07, 0.03, c.plantDark, s * 0.22, 0.07, 0.32, 12)
    caster.rotation.z = PI / 2
    k.box(g, 0.025, 0.55, 0.025, c.chromeRail, s * 0.23, 0.72, -0.2)
    k.box(g, 0.025, 0.025, 0.5, c.chromeRail, s * 0.23, 0.48, 0.05)
  }
  k.box(g, 0.44, 0.04, 0.42, c.crossBlue, 0, 0.5, 0.05)
  k.box(g, 0.44, 0.38, 0.03, c.crossBlue, 0, 0.75, -0.2)
  k.box(g, 0.36, 0.02, 0.12, c.chromeRail, 0, 0.12, 0.38)
}

/* ---------- planting ---------- */

function buildPlanting(ctx: HospitalCtx) {
  const { plant } = ctx
  // Shade trees in the garden, framing the walk and the canopy from the road.
  for (const [x, z, sp, seed, s] of [
    [-10.2, 28.6, 'rain', 1901, 0.75],
    [-11.2, 39.6, 'neem', 1902, 0.8],
    [-1.0, 39.4, 'neem', 1903, 0.75],
    [-6.5, 34.0, 'ashoka', 1904, 0.7],
    [0.4, 29.0, 'neem', 1905, 0.7],
    [11.0, 33.6, 'neem', 1906, 0.75],
    [10.4, 28.2, 'ashoka', 1907, 0.7],
  ] as const)
    if (within(ctx, x, z, 2)) tree(plant, SPECIES[sp], x, GL - 0.05, z, seed, s)
  // Clipped hedges along the lane's garden side, broken for the walk; low along the walk itself.
  hedge(plant, GARDEN.x0 + 0.4, WALK.x0 - 0.5, GL - 0.05, STRIP + 0.5, 0.75, 0.6, 1950)
  if (within(ctx, GARDEN.x1 - 0.4, STRIP + 0.5)) hedge(plant, WALK.x1 + 0.5, GARDEN.x1 - 0.4, GL - 0.05, STRIP + 0.5, 0.75, 0.6, 1951)
  let seed = 1960
  for (let z = STRIP + 1.4; z < FRONT_WALK - 0.4; z += 0.7) {
    if (z > PATH.z0 - 0.3 && z < PATH.z1 + 0.3) continue
    if (within(ctx, WALK.x0 - 0.45, z)) shrub(plant, WALK.x0 - 0.45, GL - 0.05, z, 0.32, 0.5, seed++, 'hedge')
    if (within(ctx, WALK.x1 + 0.45, z)) shrub(plant, WALK.x1 + 0.45, GL - 0.05, z, 0.32, 0.5, seed++, 'hedge')
  }
  // Grass on the lawns, in the property's own view (the master plan is seen from too far for it).
  if (!ctx.onPlan) for (const [x0, x1, z0, z1] of LAWNS) lawn(plant, x0 + 0.1, x1 - 0.1, z0 + 0.1, z1 - 0.1, GL - 0.05, 1980 + Math.round(x0 * 7 + z0), 160)
  for (const f of plant.footprints) ctx.shade.pool(f.x, f.y + 0.006, f.z, f.r, f.r, f.strength)
}

/* ---------- lighting ---------- */

/** Pole lights on the drive and at the back, bollards along the walk, the garden's own glow. */
function buildLighting(ctx: HospitalCtx, p: Object3D) {
  const { c, k, shade } = ctx
  const pole = (x: number, z: number, h: number, dir: 1 | -1 = 1) => {
    if (!within(ctx, x, z)) return
    k.cyl(p, 0.055, 0.1, h, c.galvanised, x, h / 2 + 0.03, z, 8)
    k.box(p, 0.36, 0.03, 0.36, c.galvanised, x, 0.045, z)
    const arm = k.cyl(p, 0.035, 0.04, 1.2, c.galvanised, x + dir * 0.55, h - 0.05, z, 8)
    arm.rotation.z = PI / 2
    k.box(p, 0.62, 0.07, 0.3, c.luminaire, x + dir * 1.15, h - 0.08, z)
    k.box(p, 0.5, 0.01, 0.24, c.lamp, x + dir * 1.15, h - 0.12, z, false)
    shade.pool(x, 0.03, z, 0.35, 0.35, 0.5)
  }
  for (const z of [-40, -24, -8, 8, 30]) pole(DRIVE.x0 + 0.4, z, 7)
  for (const z of [-40, -20, 14, 30]) pole(PLOT.x1 - WALL_T - 0.2, z, 7, -1)
  pole(0, PLOT.z0 + 0.6, 6, 1)
  const bollard = (x: number, z: number) => {
    if (!within(ctx, x, z)) return
    k.cyl(p, 0.09, 0.09, 0.85, c.luminaire, x, GL + 0.425, z, 16)
    k.cyl(p, 0.085, 0.085, 0.12, c.lamp, x, GL + 0.72, z, 16).castShadow = false
    shade.pool(x, GL + 0.004, z, 0.25, 0.25, 0.5)
  }
  for (const z of [28, 32, 36, 40]) {
    bollard(WALK.x0 - 0.15, z)
    bollard(WALK.x1 + 0.15, z)
  }
  bollard(COURT.x0 + 0.3, COURT.z0 + 0.3)
  bollard(COURT.x1 - 0.3, COURT.z1 - 0.3)
  for (const [x, z] of [[-6.5, 33], [10, 31], [(EXIT.x0 + EXIT.x1) / 2, 20]] as const) {
    const l = ctx.lighting.light(new PointLight('#ffd9ad', 6, 13, 2), 0)
    l.position.set(x, 1.6, z)
    p.add(l)
  }
}

/* ---------- wayfinding ---------- */

/** The monolith at the way in, as in the reference: the name and cross on top, the directions below. */
function buildDirectory(ctx: HospitalCtx, p: Object3D) {
  const { c, k, shade } = ctx
  const x = GARDEN.x0 + 2.0
  const z = PLOT.z1 - 3.4
  if (!within(ctx, x, z + 0.6)) return
  bx(ctx, p, [x - 1.25, x + 1.25], [GL, GL + 0.2], [z - 0.5, z + 0.5], c.granite)
  bx(ctx, p, [x - 1.05, x + 1.05], [GL + 0.2, 4.6], [z - 0.3, z + 0.3], c.charcoal)
  bx(ctx, p, [x - 1.05, x + 1.05], [3.75, 4.6], [z - 0.32, z + 0.32], c.wall)
  k.box(p, 1.7, 2.55, 0.02, c.directory, x, GL + 0.35 + 1.3, z + 0.31, false)
  // The cross and the name on the white head.
  k.box(p, 0.12, 0.38, 0.05, c.crossBlue, x - 0.78, 4.18, z + 0.34)
  k.box(p, 0.38, 0.12, 0.05, c.crossBlue, x - 0.78, 4.18, z + 0.34)
  const words = NAME.split(' ')
  words.forEach((line, i) => {
    const g = signLine(ctx, line, 0.17, 0.02, NAVY)
    g.scale.setScalar(Math.min(1, 1.45 / (g.userData.width as number)))
    g.position.set(x + 0.2, 4.27 - i * 0.26, z + 0.33)
    p.add(g)
  })
  shade.rect(x, GL + 0.004, z, 2.7, 1.2, 0, 0.55)
}

/* ---------- surroundings ---------- */

const CROSS = 33 * FT
const AVENUE = 60 * FT
/** The plot and what is shown round it: the HMDA road in front, the main avenue to the north, the cross road behind, the hotel's plot to the south. */
export const SITE = { minX: PLOT.x0 - 8, maxX: PLOT.x1 + AVENUE + 6, minZ: PLOT.z0 - CROSS - 2, maxZ: PLOT.z1 + 26 }

/**
 * The roads round the plot, for the property's own view (the master plan draws its own): the HMDA
 * road's footpath, service lane, median and carriageway; the 60 ft main avenue along the north
 * side with its footpaths and avenue trees; the 33 ft cross road behind; the hotel's plot to the
 * south and the first residential plots across the avenue.
 */
export function buildContext(ctx: HospitalCtx, p: Object3D) {
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
  // The main avenue to the north: a footpath either side of the carriageway, avenue trees on the far side.
  const ax0 = PLOT.x1
  const ax1 = PLOT.x1 + AVENUE
  const az0 = PLOT.z0 - CROSS
  ground(ctx, p, rect(ax0, ax0 + 2.0, az0, zf), 0.15, c.interlock)
  ground(ctx, p, rect(ax0 + 2.0, ax1 - 2.0, az0, zf), 0.02, c.asphalt)
  ground(ctx, p, rect(ax1 - 2.0, ax1, az0, zf), 0.15, c.interlock)
  for (const x of [ax0 + 2.0, ax1 - 2.0]) bx(ctx, p, [x - 0.075, x + 0.075], [0, 0.18], [az0, zf], c.kerb(zf - az0), true, true)
  const amid = (ax0 + ax1) / 2
  for (let z = az0 + 1; z < zf - 3; z += 9) bx(ctx, p, [amid - 0.06, amid + 0.06], [0.02, 0.024], [z, z + 3], c.lane, false)
  for (let z = az0 + 6; z < zf - 2; z += 9) tree(plant, SPECIES.neem, ax1 - 1.0, 0.15, z, 1780 + Math.round(z), 0.7)
  // The cross road behind, with a footpath on the plot's side.
  ground(ctx, p, rect(SITE.minX, ax0, PLOT.z0 - CROSS, PLOT.z0 - 1.5), 0.02, c.asphalt)
  ground(ctx, p, rect(SITE.minX, ax0, PLOT.z0 - 1.5, PLOT.z0), 0.15, c.interlock)
  ground(ctx, p, rect(SITE.minX, SITE.maxX, SITE.minZ, PLOT.z0 - CROSS), 0.02, c.fallow)
  // The hotel's plot to the south and the residential plots across the avenue.
  ground(ctx, p, rect(SITE.minX, PLOT.x0, PLOT.z0, zf), 0.02, c.fallow)
  ground(ctx, p, rect(ax1, SITE.maxX, PLOT.z0 - CROSS, zf), 0.02, c.fallow)
}
