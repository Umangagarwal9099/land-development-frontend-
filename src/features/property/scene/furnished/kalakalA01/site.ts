import { PointLight, type Material, type Object3D } from 'three'
import type { Point2 } from '../../../../../api/types'
import { PI } from '../kit'
import { parkedCar } from '../car'
import { lawn, shrub, SPECIES, tree } from '../kalakalMall/foliage'
import { metricBox, rect, slab } from '../kalakalMall/solids'
import { signLine } from '../kalakalHotel/building'
import { NAME, type A01Ctx } from './building'
import { BLOCK, clipHalf, COURT_REAR, DRIVE, DRUM, EXIT, FORE, FRONTAGE_Z, FT, GL, LAWNS, PLOT, polar, PORTALS, YARD } from './plan'

/*
 * The grounds. The forecourt opens east to the road: granite paving along the shopfronts and
 * round the drum, with an entrance walk straight to the drum's doors between two lawns planted
 * with neem and rain trees. Traffic runs one way round the block: in off the HMDA road down the
 * 5.7 m entry drive along the south boundary, past the vehicle portals in the block's south end,
 * across the 6.5 m connector behind the block (past the service doors) and out up the 4.2 m exit
 * road along the north boundary to its give-way line at the road. Behind the connector are a lawn
 * with rain trees and the substation and generator yard; the back wall runs unbroken the full
 * width of the plot, so nothing opens onto the cross road.
 */

type R = [number, number]

const WALL_T = 0.23

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
function ground(ctx: A01Ctx, p: Object3D, poly: Point2[], y: number, mat: Material) {
  const shape = ctx.onPlan ? clipHalf(poly, -0.3636, -1, 24.66 - 0.3) : poly
  if (shape.length >= 3) slab(p, shape, 0, y, [mat, ctx.c.concrete], [], false)
}

/** Precast kerb along z at x, its shade on both sides. */
function kerbZ(ctx: A01Ctx, p: Object3D, x: number, [z0, z1]: R, h: number) {
  const run = bxIn(ctx, p, [x - 0.075, x + 0.075], [0, h], [z0, z1], ctx.c.kerb(z1 - z0), true, true)
  if (!run) return
  for (const side of [-1, 1] as const) ctx.shade.edge([[x + side * 0.075, run[0]], [x + side * 0.075, run[1]]], 0.035, 0.18, side > 0 ? -1 : 1, 0.35)
}

const { x0: BX0, x1: BX1, z0: BZ0, z1: BZ1 } = BLOCK
/** The entrance walk, between the lawns, on the drum's axis. */
const WALK = { x0: LAWNS[0].x1, x1: LAWNS[1].x0 }

export function buildSite(ctx: A01Ctx, p: Object3D) {
  const { c } = ctx
  // Asphalt, one way round: the entry drive down the south side, the connector behind the block,
  // and the exit road up the north side.
  ground(ctx, p, rect(DRIVE.x0, BX0, COURT_REAR.z1, BZ1), 0.02, c.asphalt)
  ground(ctx, p, rect(DRIVE.x0, DRIVE.x1, BZ1, PLOT.z1), 0.02, c.asphalt)
  ground(ctx, p, rect(COURT_REAR.x0, COURT_REAR.x1, COURT_REAR.z0, COURT_REAR.z1), 0.02, c.asphalt)
  ground(ctx, p, rect(EXIT.x0, EXIT.x1, COURT_REAR.z1, PLOT.z1), 0.02, c.asphalt)
  // A paved walk along the back of the block and a strip along its north end, kerbed from the roads.
  ground(ctx, p, rect(BX0, EXIT.x0 - 0.15, COURT_REAR.z1, BZ0), GL, c.paving)
  ground(ctx, p, rect(BX1, EXIT.x0 - 0.15, BZ0, BZ1), GL, c.paving)
  // A lawn along the back wall, beside the yard.
  ground(ctx, p, rect(DRIVE.x0, YARD.x0, PLOT.z0 + WALL_T, COURT_REAR.z0), GL - 0.04, c.lawnGround)
  // The forecourt: flamed granite at ground level, laid round the two lawns.
  const [ls, ln] = LAWNS
  for (const [x0, x1, z0, z1] of [
    [FORE.x0, FORE.x1, BZ1, ln.z0],
    [FORE.x0, ls.x0, ln.z0, PLOT.z1],
    [ls.x0, ls.x1, ln.z0, ls.z0],
    [ls.x0, ls.x1, ls.z1, PLOT.z1],
    [WALK.x0, WALK.x1, ln.z0, PLOT.z1],
    [ln.x0, ln.x1, ln.z1, PLOT.z1],
    [ln.x1, FORE.x1, ln.z0, PLOT.z1],
  ])
    ground(ctx, p, rect(x0, x1, z0, z1), GL, c.paving)
  for (const l of LAWNS) ground(ctx, p, rect(l.x0, l.x1, l.z0, l.z1), GL - 0.05, c.lawnGround)

  buildEdges(ctx, p)
  buildCars(ctx, p)
  buildYard(ctx, p)
  buildWalls(ctx, p)
  buildFurniture(ctx, p)
  buildPlanting(ctx)
  buildLighting(ctx, p)
  buildPylon(ctx, p)
}

/* ---------- edges, lawns and the drive ---------- */

function buildEdges(ctx: A01Ctx, p: Object3D) {
  const { c, shade } = ctx
  // The forecourt's kerb along the drive.
  kerbZ(ctx, p, DRIVE.x1 + 0.075, [BZ1, PLOT.z1], GL + 0.02)
  // Granite edging round the lawns, a hand's breadth above the grass.
  for (const l of LAWNS) {
    for (const x of [l.x0, l.x1]) {
      const run = bxIn(ctx, p, [x - 0.06, x + 0.06], [GL - 0.12, GL + 0.03], [l.z0, l.z1], c.granite)
      if (run) shade.edge([[x, run[0]], [x, run[1]]], GL - 0.045, 0.25, x === l.x0 ? 1 : -1, 0.3)
    }
    for (const z of [l.z0, l.z1])
      if (within(ctx, (l.x0 + l.x1) / 2, z, 0.3)) {
        const x1 = ctx.onPlan ? Math.min(l.x1, (24.66 - 0.6 - z) / 0.3636) : l.x1
        if (x1 > l.x0) bx(ctx, p, [l.x0, x1], [GL - 0.12, GL + 0.03], [z - 0.06, z + 0.06], c.granite)
      }
  }
  // The exit road's kerb along the block, the walk's along the connector, the rear lawn's.
  kerbZ(ctx, p, EXIT.x0 - 0.075, [COURT_REAR.z1, PLOT.z1], GL + 0.02)
  for (const [x0, x1, z, h] of [[BX0, EXIT.x0 - 0.15, COURT_REAR.z1, GL + 0.02], [DRIVE.x0, YARD.x0, COURT_REAR.z0, GL]] as const) {
    bx(ctx, p, [x0, x1], [0, h], [z - 0.075, z + 0.075], c.kerb(x1 - x0), true, true)
    for (const side of [-1, 1] as const) shade.edge([[x0, z + side * 0.075], [x1, z + side * 0.075]], 0.035, 0.18, side, 0.35)
  }
  // One-way arrows: in down the drive, round behind the block, out up the exit road.
  const arrow = (x: number, z: number, dir: 'in' | 'across' | 'out') => {
    if (!within(ctx, x, z + 1.6)) return
    const along = dir === 'across' ? 'x' : 'z'
    const sgn = dir === 'in' ? -1 : 1
    const shaft: [R, R] = along === 'x' ? [[x - 1.0, x + 1.0], [z - 0.08, z + 0.08]] : [[x - 0.08, x + 0.08], [z - 1.0, z + 1.0]]
    bx(ctx, p, shaft[0], [0.02, 0.024], shaft[1], c.lane, false)
    for (const s of [-1, 1]) {
      const m = bx(ctx, p, [-0.38, 0.38], [0.02, 0.024], [-0.06, 0.06], c.lane, false)
      if (along === 'x') {
        m.position.set(x + 0.75, 0.022, z + s * 0.2)
        m.rotation.y = s * 0.65
      } else {
        m.position.set(x + s * 0.2, 0.022, z + sgn * 0.75)
        m.rotation.y = PI / 2 - sgn * s * 0.65
      }
    }
  }
  const mid = (DRIVE.x0 + DRIVE.x1) / 2
  for (const z of [19, 3, -12]) arrow(mid, z, 'in')
  for (const x of [-10, 6]) arrow(x, (COURT_REAR.z0 + COURT_REAR.z1) / 2, 'across')
  const exitMid = (EXIT.x0 + EXIT.x1) / 2
  for (const z of [-11, 2, 12]) arrow(exitMid, z, 'out')
  // A speed table inside each gate, and the exit's give-way line at the road.
  bxIn(ctx, p, [DRIVE.x0, DRIVE.x1], [0.02, 0.09], [PLOT.z1 - 4.2, PLOT.z1 - 2.6], c.interlock)
  const giveWay = (ctx.onPlan ? Math.min(PLOT.z1, FRONTAGE_Z(EXIT.x1)) : PLOT.z1) - 2.2
  bx(ctx, p, [EXIT.x0, EXIT.x1], [0.02, 0.09], [giveWay - 3.0, giveWay - 1.4], c.interlock)
  for (let x = EXIT.x0 + 0.3; x < EXIT.x1 - 0.5; x += 0.9) bx(ctx, p, [x, x + 0.5], [0.02, 0.025], [giveWay - 0.15, giveWay + 0.15], c.lane, false)
  // Entry and exit arrows painted in front of the portals.
  for (const pt of PORTALS) {
    const into = pt.label === 'in'
    const z = (pt.z0 + pt.z1) / 2
    const x = BX0 - 2.4
    bx(ctx, p, [x - 1.1, x + 0.4], [0.02, 0.024], [z - 0.08, z + 0.08], c.lane, false)
    const head = into ? x + 0.4 : x - 1.1
    for (const s of [-1, 1]) {
      const m = bx(ctx, p, [head - 0.35, head + 0.35], [0.02, 0.024], [z - 0.06, z + 0.06], c.lane, false)
      m.rotation.y = s * (into ? 0.6 : -0.6)
      m.position.x += into ? -0.25 : 0.25
      m.position.z += s * 0.18
    }
  }
}

function buildCars(ctx: A01Ctx, p: Object3D) {
  const { shade } = ctx
  // One turning in at the entry portal, one on its way out to the road, one at the back.
  const entry = PORTALS.find((pt) => pt.label === 'in')!
  const ez = (entry.z0 + entry.z1) / 2
  parkedCar(p, 'crossover', '#e9eaea', BX0 - 3.0, ez, PI / 2 - 0.08, 0.02)
  shade.rect(BX0 - 3.0, 0.03, ez, 1.9, 4.5, PI / 2, 0.75)
  const dx = (DRIVE.x0 + DRIVE.x1) / 2
  if (within(ctx, dx, 14 + 2.4)) {
    parkedCar(p, 'sedan', '#2a2c30', dx, 14, PI, 0.02)
    shade.rect(dx, 0.03, 14, 1.9, 4.6, 0, 0.75)
  }
  const xx = (EXIT.x0 + EXIT.x1) / 2
  parkedCar(p, 'hatch', '#8b1f22', xx, -4, 0, 0.02)
  shade.rect(xx, 0.03, -4, 1.8, 4.0, 0, 0.75)
}

/** Substation and generator yard in the north-west corner, behind the connector against the back wall. */
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
  // The generator lies along the back wall, its louvres facing the connector.
  const gx = x0 + 3.6
  bx(ctx, p, [gx - 2.2, gx + 2.2], [GL, 2.55], [z0 + 0.5, z0 + 3.0], c.greigeMetric)
  bx(ctx, p, [gx - 2.25, gx + 2.25], [2.55, 2.65], [z0 + 0.45, z0 + 3.05], c.coping)
  for (let x = gx - 1.9; x < gx + 1.9; x += 0.25) bx(ctx, p, [x, x + 0.12], [1.2, 2.2], [z0 + 3.0, z0 + 3.02], c.plantDark, false)
  ctx.k.cyl(p, 0.14, 0.14, 2.2, c.aluminium, gx + 1.6, 3.7, z0 + 1.2, 12)
  shade.rect(gx, GL + 0.005, z0 + 1.75, 4.8, 2.9, 0, 0.6)
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
  // The back wall, unbroken the full width of the plot: nothing opens onto the cross road.
  wallX(PLOT.x0 + WALL_T, PLOT.x1 - WALL_T, PLOT.z0)
  // Gate piers in granite at the way in and the way out.
  for (const [x, z] of [[DRIVE.x1 + 0.3, PLOT.z1 - 0.4], [EXIT.x0 - 0.45, PLOT.z1 - 0.4]] as const)
    if (within(ctx, x, z)) {
      bx(ctx, p, [x - 0.3, x + 0.3], [0, 1.6], [z - 0.3, z + 0.3], c.granite)
      shade.rect(x, 0.03, z, 0.9, 0.9, 0, 0.55)
    }
  // The forecourt's road edge: stainless bollards, open to the footpath.
  const edge = PLOT.z1 - 0.2
  for (let x = FORE.x0 + 0.8; x < FORE.x1 - 0.4; x += 1.8)
    if (within(ctx, x, edge, 0.5)) {
      ctx.k.cyl(p, 0.085, 0.09, 0.9, c.chromeRail, x, GL + 0.45, edge - 0.3, 20)
      shade.pool(x, GL + 0.004, edge - 0.3, 0.22, 0.22, 0.5)
    }
}

/** Benches facing the entrance walk, planters along the shopfronts, cycle stands by the drum. */
function buildFurniture(ctx: A01Ctx, p: Object3D) {
  const { c, k, shade } = ctx
  const seat = c.surface('teak', 1, 1)
  const bench = (x: number, z: number, ry: number) => {
    if (!within(ctx, x, z)) return
    const g = k.at(x, z, ry, GL)
    k.box(g, 2.2, 0.38, 0.5, c.granite, 0, 0.19, 0)
    for (let i = 0; i < 4; i++) k.box(g, 2.3, 0.05, 0.11, seat, 0, 0.405, -0.19 + i * 0.125)
    shade.rect(x, GL + 0.004, z, 2.4, 0.7, ry, 0.5)
  }
  // Along the lawns' edges, looking across the walk.
  for (const z of [17.2, 20.6]) {
    bench(WALK.x0 + 0.6, z, PI / 2)
    bench(WALK.x1 - 0.6, z, -PI / 2)
  }
  // Round planters between the shopfronts and the forecourt, one before each pier.
  let seed = 2600
  for (const x of [4.5, 8.0, 11.5, 15.0, 18.4]) {
    const z = BZ1 + 2.6
    k.cyl(p, 0.55, 0.47, 0.6, c.charcoal, x, GL + 0.3, z, 32)
    k.cyl(p, 0.5, 0.5, 0.02, c.mulch, x, GL + 0.59, z, 24).castShadow = false
    shrub(ctx.plant, x, GL + 0.6, z, 0.45, 0.75, seed++, seed % 2 ? 'shrub' : 'hedge')
    shade.pool(x, GL + 0.005, z, 0.8, 0.8, 0.5)
  }
  // Cycle stands on the paving south of the drum.
  for (let i = 0; i < 5; i++) {
    const x = BX0 + 1.6 + i * 0.8
    const z = BZ1 + 3.2
    for (const dz of [-0.28, 0.28]) k.box(p, 0.05, 0.75, 0.05, c.galvanised, x, GL + 0.375, z + dz)
    k.box(p, 0.05, 0.05, 0.61, c.galvanised, x, GL + 0.75, z)
  }
  shade.rect(BX0 + 3.2, GL + 0.004, BZ1 + 3.2, 4.2, 0.9, 0, 0.35)
}

function buildPlanting(ctx: A01Ctx) {
  const { plant } = ctx
  const [ls, ln] = LAWNS
  // Neem on the north lawn and a rain tree on the south, framing the drum from the road.
  for (const [x, z, sp, seed, s] of [
    [8.2, 16.4, 'neem', 1801, 0.9],
    [15.4, 19.2, 'neem', 1802, 0.85],
    [18.4, 15.6, 'neem', 1803, 0.8],
    [(ls.x0 + ls.x1) / 2, 19.0, 'rain', 1804, 0.7],
  ] as const)
    if (within(ctx, x, z, 2)) tree(plant, SPECIES[sp], x, GL - 0.05, z, seed, s)
  // Clipped hedges along the walk's side of each lawn, low enough to see over.
  let seed = 2700
  for (let z = ls.z0 + 0.6; z < ls.z1 - 0.4; z += 0.7) if (within(ctx, ls.x1 - 0.5, z)) shrub(plant, ls.x1 - 0.5, GL - 0.05, z, 0.38, 0.55, seed++, 'hedge')
  for (let z = ln.z0 + 0.6; z < ln.z1 - 0.4; z += 0.7) if (within(ctx, ln.x0 + 0.5, z)) shrub(plant, ln.x0 + 0.5, GL - 0.05, z, 0.38, 0.55, seed++, 'hedge')
  // Rain trees and a neem on the lawn along the back wall.
  const backZ = (PLOT.z0 + COURT_REAR.z0) / 2
  tree(plant, SPECIES.rain, -17, GL - 0.04, backZ, 1740, 0.7)
  tree(plant, SPECIES.neem, -5, GL - 0.04, backZ, 1741, 0.7)
  tree(plant, SPECIES.rain, 6, GL - 0.04, backZ, 1742, 0.65)
  // Grass on the lawns, in the property's own view (the master plan is seen from too far for it).
  if (!ctx.onPlan) {
    for (const l of LAWNS) lawn(plant, l.x0 + 0.1, l.x1 - 0.1, l.z0 + 0.1, l.z1 - 0.1, GL - 0.05, 1850 + Math.round(l.x0), 160)
    lawn(plant, DRIVE.x0 + 0.2, YARD.x0 - 0.2, PLOT.z0 + WALL_T + 0.2, COURT_REAR.z0 - 0.2, GL - 0.04, 1870, 160)
  }
  for (const f of plant.footprints) ctx.shade.pool(f.x, f.y + 0.006, f.z, f.r, f.r, f.strength)
}

/** Pole lights on the drive, bollards along the walk, and the forecourt's own glow. */
function buildLighting(ctx: A01Ctx, p: Object3D) {
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
  for (const z of [-19, -5, 9, 20]) pole(DRIVE.x0 + 0.4, z, 7)
  const bollard = (x: number, z: number) => {
    if (!within(ctx, x, z)) return
    k.cyl(p, 0.09, 0.09, 0.85, c.luminaire, x, GL + 0.425, z, 16)
    k.cyl(p, 0.085, 0.085, 0.12, c.lamp, x, GL + 0.72, z, 16).castShadow = false
    shade.pool(x, GL + 0.004, z, 0.25, 0.25, 0.5)
  }
  for (const z of [16, 19.5, 23]) {
    bollard(WALK.x0 + 0.25, z)
    bollard(WALK.x1 - 0.25, z)
  }
  for (const z of [-17, -2, 12]) pole(PLOT.x1 - 0.5, z, 7, -1)
  for (const [x, z] of [polar(-40, DRUM.r + 2.5), polar(40, DRUM.r + 2.5), [11, BZ1 + 4]] as Point2[]) {
    const l = ctx.lighting.light(new PointLight('#ffd9ad', 7, 14, 2), 0)
    l.position.set(x, 1.4, z)
    p.add(l)
  }
}

/** A stone monolith at the gate carrying the name in channel letters. */
function buildPylon(ctx: A01Ctx, p: Object3D) {
  const { c } = ctx
  const x = FORE.x0 + 2.0
  const z = PLOT.z1 - 1.8
  if (!within(ctx, x, z)) return
  // Broadside to the road, the name on a black panel near its top, the parking sign below it.
  bx(ctx, p, [x - 1.6, x + 1.6], [GL, GL + 0.25], [z - 0.8, z + 0.8], c.granite)
  bx(ctx, p, [x - 1.4, x + 1.4], [GL + 0.25, 5.2], [z - 0.55, z + 0.55], c.render)
  bx(ctx, p, [x - 1.25, x + 1.25], [3.6, 4.9], [z + 0.55, z + 0.58], c.black)
  NAME.split(' ').forEach((line, i) => {
    const g = signLine(ctx, line, 0.27, 0.04)
    g.position.set(x, 4.32 - i * 0.48, z + 0.6)
    p.add(g)
  })
  ctx.k.box(p, 0.9, 0.9, 0.04, c.pSign, x, 2.6, z + 0.58, false)
  ctx.shade.rect(x, GL + 0.004, z, 3.4, 1.8, 0, 0.55)
}

/* ---------- surroundings ---------- */

const CROSS = 33 * FT
/** The plot and what is shown round it: the HMDA road in front, the cross road behind, Terranova Mall's plot to the south. */
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
  // Terranova Mall's plot to the south and open ground to the north.
  ground(ctx, p, rect(SITE.minX, PLOT.x0, PLOT.z0, zf), 0.02, c.fallow)
  ground(ctx, p, rect(PLOT.x1, SITE.maxX, PLOT.z0, zf), 0.02, c.fallow)
}
