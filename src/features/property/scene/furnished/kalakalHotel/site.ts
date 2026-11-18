import { PointLight, type Material, type Object3D } from 'three'
import type { Point2 } from '../../../../../api/types'
import { PI } from '../kit'
import { parkedCar } from '../car'
import { lawn, shrub } from '../kalakalMall/foliage'
import { metricBox, rect, slab } from '../kalakalMall/solids'
import { NAME, signLine, type HotelCtx } from './ctx'
import { rectPoly } from '../basement'
import { clipHalf, DECK, DRIVE, FORECOURT, FRONTAGE, FRONTAGE_Z, FT, GL, PLOT, RAMP, REAR, SERVICE, WALL_T } from './plan'
import { buildPoolDeck } from './pool'

/*
 * The grounds. Cars come in off the HMDA road by the south lane: straight on for the basements,
 * down the covered ramp beside the south block; or right, across the forecourt under the canopy to
 * drop guests at the lobby, and out by the north lane, which carries on down the north side to the
 * pool deck as the service and fire lane. There is no parking above ground. Behind the hotel there
 * is only the pool deck (pool.ts), closed by stone walls; no lawns, trees or planting anywhere on
 * the plot. The back wall runs unbroken across it.
 */

type R = [number, number]

/** Inside the plot as the plan draws it (with a margin), or anywhere in the property's own view. */
const within = (ctx: HotelCtx, x: number, z: number, margin = 0.6) => !ctx.onPlan || z <= FRONTAGE_Z(x) - margin

/** A box from extents; its UVs in metres unless `unit` (for materials mapped once per face: railings, kerbs). */
function bx({ k }: HotelCtx, p: Object3D, [x0, x1]: R, [y0, y1]: R, [z0, z1]: R, mat: Material | Material[], cast = true, unit = false) {
  if (unit) return k.box(p, x1 - x0, y1 - y0, z1 - z0, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, cast)
  return k.mesh(metricBox(x1 - x0, y1 - y0, z1 - z0), mat, p, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, cast)
}

/** A box running east whose front may be cut back to the plan's road edge. */
function bxIn(ctx: HotelCtx, p: Object3D, xs: R, ys: R, [z0, z1]: R, mat: Material | Material[], cast = true, unit = false): R | null {
  const end = ctx.onPlan ? Math.min(z1, FRONTAGE_Z(xs[0]) - 0.4, FRONTAGE_Z(xs[1]) - 0.4) : z1
  if (end - z0 <= 0.05) return null
  bx(ctx, p, xs, ys, [z0, end], mat, cast, unit)
  return [z0, end]
}

/** A ground surface laid at true scale, trimmed to the plan's road edge on the master plan. */
function ground(ctx: HotelCtx, p: Object3D, poly: Point2[], y: number, mat: Material, holes: Point2[][] = [], name = '') {
  const shape = ctx.onPlan ? clipHalf(poly, FRONTAGE.k, -1, FRONTAGE.c - 0.3) : poly
  if (shape.length >= 3) slab(p, shape, 0, y, [mat, ctx.c.concrete], holes, false, name)
}

/** Precast kerb along z at x, its shade on both sides. */
function kerbZ(ctx: HotelCtx, p: Object3D, x: number, [z0, z1]: R, h: number) {
  const run = bxIn(ctx, p, [x - 0.075, x + 0.075], [0, h], [z0, z1], ctx.c.kerb(z1 - z0), true, true)
  if (!run) return
  for (const side of [-1, 1] as const) ctx.shade.edge([[x + side * 0.075, run[0]], [x + side * 0.075, run[1]]], 0.035, 0.18, side > 0 ? -1 : 1, 0.35)
}

/** A precast kerb along x at z, its shade on the low side. */
function kerbX(ctx: HotelCtx, p: Object3D, [x0, x1]: R, z: number, h: number, low: 1 | -1) {
  const xs: R = ctx.onPlan ? [x0, Math.min(x1, (FRONTAGE.c - z - 0.5) / -FRONTAGE.k)] : [x0, x1]
  if (ctx.onPlan && z > FRONTAGE_Z(x0) - 0.5) return
  bx(ctx, p, xs, [0, h], [z - 0.075, z + 0.075], ctx.c.kerb(xs[1] - xs[0]), true, true)
  ctx.shade.edge([[xs[0], z + low * 0.075], [xs[1], z + low * 0.075]], 0.025, 0.22, low, 0.45)
}

/** The ramp's trench, from its mouth west to its foot under the basement's slab. */
const TRENCH = { x0: RAMP.x0 - 0.2, x1: RAMP.x1 + 0.2, z0: RAMP.top - 22.92, z1: RAMP.top }
/** The ramp's cover: from 2.5 m inside its mouth back to its foot. */
const COVER_Z = RAMP.top - 2.5

export function buildSite(ctx: HotelCtx, p: Object3D) {
  const { c } = ctx
  const fx0 = DRIVE.x1
  const fx1 = SERVICE.x0
  // The two lanes in asphalt; the forecourt's drive in granite setts; under the canopy and along
  // the front, flamed granite at the lobby's level.
  ground(ctx, p, rect(DRIVE.x0, DRIVE.x1, RAMP.top, PLOT.z1), 0.02, c.asphalt)
  ground(ctx, p, rect(SERVICE.x0, SERVICE.x1, DECK.z1, PLOT.z1), 0.02, c.asphalt)
  ground(ctx, p, rect(fx0, fx1, FORECOURT.z0, FORECOURT.kerb), 0.03, c.interlock)
  ground(ctx, p, rect(fx0, fx1, DECK.z1, FORECOURT.z0), GL, c.paving, ctx.openings?.wells.map(rectPoly) ?? [])
  ground(ctx, p, rect(fx0, fx1, FORECOURT.kerb, PLOT.z1), GL, c.paving)
  // The ramp: open to the sky at its mouth, covered over the rest; until the basements are built,
  // a dark floor in its trench. Behind its foot the podium's back half fills the south side.
  ground(ctx, p, rect(TRENCH.x0, TRENCH.x1, TRENCH.z0, TRENCH.z1), 0.02, c.asphalt, [], ctx.openings ? 'void_ramp_floor' : '')
  ground(ctx, p, rect(DRIVE.x0, TRENCH.x0, TRENCH.z0, RAMP.top), 0.02, c.asphalt)
  ground(ctx, p, rect(DRIVE.x0, fx0, DECK.z1, TRENCH.z0), GL, c.paving)

  buildEdges(ctx, p)
  buildRamp(ctx, p)
  buildWalls(ctx, p)
  buildFrontage(ctx, p)
  buildLighting(ctx, p)
  buildPylon(ctx, p)
  buildPoolDeck(ctx, p)
  buildCars(ctx, p)
}

/* ---------- the drive ---------- */

function buildEdges(ctx: HotelCtx, p: Object3D) {
  const { c } = ctx
  const fx0 = DRIVE.x1
  const fx1 = SERVICE.x0
  // Kerbs: the walk under the canopy above the drive, the planted front edge, the lanes' sides.
  kerbX(ctx, p, [fx0, fx1], FORECOURT.z0 - 0.075, GL + 0.02, 1)
  kerbX(ctx, p, [fx0, fx1], FORECOURT.kerb + 0.075, GL + 0.02, -1)
  kerbZ(ctx, p, fx0 - 0.075, [FORECOURT.kerb, PLOT.z1], GL + 0.02)
  kerbZ(ctx, p, fx1 + 0.075, [FORECOURT.kerb, PLOT.z1], GL + 0.02)
  kerbZ(ctx, p, fx0 - 0.075, [RAMP.top, FORECOURT.z0], GL + 0.02)
  kerbZ(ctx, p, fx1 + 0.075, [DECK.z1, FORECOURT.z0], GL + 0.02)
  // Arrows: in and down the south lane, across the drop-off, out up the north lane.
  const arrow = (x: number, z: number, dx: number, dz: number) => {
    const g = ctx.k.at(x, z, Math.atan2(dx, dz), 0.022)
    if (!within(ctx, x, z + 1.5, 0.4)) return
    ctx.k.box(g, 0.16, 0.004, 2.0, c.lane, 0, 0, 0, false)
    // Barbs sweeping back from the tip either side of the shaft.
    for (const s of [-1, 1]) {
      const m = ctx.k.box(g, 0.12, 0.004, 0.66, c.lane, s * 0.175, 0, 0.725, false)
      m.rotation.y = -s * 0.567
    }
    p.add(g)
  }
  const sx = (DRIVE.x0 + DRIVE.x1) / 2
  for (const z of [48.5, 37]) arrow(sx - 1.4, z, 0, -1)
  for (const z of [44.5, 34]) arrow(sx + 1.4, z, 0, 1)
  for (const x of [-6, 3]) arrow(x, (FORECOURT.z0 + FORECOURT.kerb) / 2, 1, 0)
  const nx = (SERVICE.x0 + SERVICE.x1) / 2
  for (const z of [45, 20, -10]) arrow(nx, z, 0, z > 30 ? 1 : -1)
  // The south lane's centre line, a speed table at the way in and a give-way line at the way out.
  bxIn(ctx, p, [sx - 0.06, sx + 0.06], [0.02, 0.024], [RAMP.top + 0.5, FORECOURT.z0 - 0.5], c.hazard, false)
  bxIn(ctx, p, [DRIVE.x0, DRIVE.x1], [0.02, 0.09], [PLOT.z1 - 3.4, PLOT.z1 - 2.0], c.interlock)
  bxIn(ctx, p, [SERVICE.x0 + 0.1, SERVICE.x1 - 0.1], [0.02, 0.025], [PLOT.z1 - 2.6, PLOT.z1 - 2.3], c.lane, false)
  // A zebra across the drive from the road's footpath to the canopy.
  for (let x = -3.0; x <= 1.0; x += 0.8) bx(ctx, p, [x, x + 0.45], [0.03, 0.034], [FORECOURT.z0 + 0.3, FORECOURT.kerb - 0.3], c.lane, false)
}

/**
 * The ramp down to the basements beside the south block: its mouth open between low granite walls
 * with the striped height bar and the lit sign over the way in; beyond, a covered run under rendered
 * walls and a stone-capped roof down to the foot, where the podium's back half takes over.
 */
function buildRamp(ctx: HotelCtx, p: Object3D) {
  const { c, k, shade } = ctx
  const { x0, x1, z0, z1 } = TRENCH
  const T = 0.25
  const h = RAMP.h
  // Side walls: low parapets at the mouth, full height under the cover.
  for (const [a, b] of [[x0 - T, x0], [x1, x1 + T]] as R[]) {
    bx(ctx, p, [a, b], [0, 1.0], [COVER_Z, z1], c.granite)
    bx(ctx, p, [a, b], [0, h], [z0, COVER_Z], c.whiteMetric)
    bx(ctx, p, [a - 0.03, b + 0.03], [h, h + 0.45], [z0, COVER_Z], c.coping)
  }
  bx(ctx, p, [x0 - T, x1 + T], [h - 0.3, h], [z0, COVER_Z], c.concrete)
  bx(ctx, p, [x0 - T, x1 + T], [0, h], [z0 - T, z0], c.whiteMetric)
  // The roof, finished in pale stone inside its coping.
  bx(ctx, p, [x0, x1], [h, h + 0.3], [z0 + 0.2, COVER_Z - 0.2], c.poolCoping, false)
  // The mouth: its header with the height bar and the sign; the dark beyond until it is built.
  bx(ctx, p, [x0 - T, x1 + T], [2.6, h + 0.45], [COVER_Z - 0.3, COVER_Z], c.granite)
  const xc = (x0 + x1) / 2
  k.box(p, x1 - x0, 2.6, 0.02, c.void, xc, 1.3, COVER_Z - 2.2, false).name = 'void_ramp_mouth'
  const bars = 8
  for (let i = 0; i < bars; i++) {
    const w = (x1 - x0 - 0.4) / bars
    const x = x0 + 0.2 + i * w
    bx(ctx, p, [x, x + w], [2.3, 2.44], [COVER_Z + 0.42, COVER_Z + 0.5], i % 2 ? c.plantDark : c.hazard)
  }
  for (const x of [x0 + 0.25, x1 - 0.25]) bx(ctx, p, [x - 0.02, x + 0.02], [2.44, 2.6], [COVER_Z + 0.44, COVER_Z + 0.48], c.chromeRail)
  k.box(p, 3.4, 0.42, 0.04, c.pSign, xc, (2.6 + h + 0.45) / 2, COVER_Z + 0.02, false)
  shade.rect(xc, 0.025, COVER_Z - 1.5, x1 - x0, 3, 0, 0.7)
  // The south block's side lit over the mouth.
  const l = ctx.lighting.light(new PointLight('#ffe0b8', 4, 8, 2), 0)
  l.position.set(xc, 2.2, COVER_Z + 1.2)
  p.add(l)
}

/**
 * Compound walls: along the lanes, a rendered base, stone coping and bar railing; round the pool
 * deck, solid 2.4 m walls in pale stone with a warm wash of light at their foot, the back one
 * unbroken across the plot.
 */
function buildWalls(ctx: HotelCtx, p: Object3D) {
  const { c, shade } = ctx
  const white = c.whiteMetric
  const wallZ = (xs: R, zs: R) => {
    const run = bxIn(ctx, p, xs, [0, 0.9], zs, white)
    bxIn(ctx, p, [xs[0] - 0.03, xs[1] + 0.03], [0.9, 0.96], zs, c.coping)
    bxIn(ctx, p, [(xs[0] + xs[1]) / 2 - 0.01, (xs[0] + xs[1]) / 2 + 0.01], [0.96, 1.8], zs, c.railing(zs[1] - zs[0]), false, true)
    if (run) for (const [x, side] of [[xs[0], 1], [xs[1], -1]] as const) shade.edge([[x, run[0]], [x, run[1]]], 0.03, 0.4, side, 0.5)
  }
  wallZ([PLOT.x0, PLOT.x0 + WALL_T], [REAR.back, PLOT.z1])
  wallZ([PLOT.x1 - WALL_T, PLOT.x1], [REAR.back, PLOT.z1])
  // Round the deck: stone privacy walls, a coping, and a hidden LED line washing their foot.
  const H = 2.4
  const stone = (xs: R, zs: R, inward: [number, number]) => {
    bx(ctx, p, xs, [0, H], zs, c.poolCoping)
    bx(ctx, p, [xs[0] - 0.03, xs[1] + 0.03], [H, H + 0.06], [zs[0] - 0.03, zs[1] + 0.03], c.coping)
    const [ix, iz] = inward
    const lx = ix > 0 ? xs[1] + 0.02 : ix < 0 ? xs[0] - 0.02 : (xs[0] + xs[1]) / 2
    const lz = iz > 0 ? zs[1] + 0.02 : iz < 0 ? zs[0] - 0.02 : (zs[0] + zs[1]) / 2
    if (ix) ctx.k.box(p, 0.03, 0.03, zs[1] - zs[0] - 0.4, c.led, lx, GL + 0.03, lz, false)
    else ctx.k.box(p, xs[1] - xs[0] - 0.4, 0.03, 0.03, c.led, lx, GL + 0.03, lz, false)
  }
  stone([PLOT.x0, PLOT.x0 + WALL_T], [PLOT.z0, REAR.back], [1, 0])
  stone([PLOT.x1 - WALL_T, PLOT.x1], [PLOT.z0, REAR.back], [-1, 0])
  stone([PLOT.x0 + WALL_T, PLOT.x1 - WALL_T], [PLOT.z0, PLOT.z0 + WALL_T], [0, 1])
  for (const [x, z] of [[DRIVE.x1 - 0.3, PLOT.z1 - 0.4], [SERVICE.x0 + 0.3, PLOT.z1 - 0.4]] as const)
    if (within(ctx, x, z)) {
      bx(ctx, p, [x - 0.3, x + 0.3], [0, 1.6], [z - 0.3, z + 0.3], c.granite)
      shade.rect(x, 0.03, z, 0.9, 0.9, 0, 0.55)
    }
}

/** The front between the drive and the road: paved, with a line of stainless bollards along the road edge. */
function buildFrontage(ctx: HotelCtx, p: Object3D) {
  const { c, k, shade } = ctx
  for (let x = DRIVE.x1 + 0.9; x < SERVICE.x0 - 0.4; x += 1.8)
    if (within(ctx, x, PLOT.z1 - 0.4, 0.4)) {
      k.cyl(p, 0.085, 0.09, 0.9, c.chromeRail, x, GL + 0.45, PLOT.z1 - 0.45, 20)
      shade.pool(x, GL + 0.004, PLOT.z1 - 0.45, 0.22, 0.22, 0.5)
    }
}

/** Pole lights on both lanes, and a pair lighting the drop-off. */
function buildLighting(ctx: HotelCtx, p: Object3D) {
  const { c, k, shade } = ctx
  const pole = (x: number, z: number, h: number, dir: 1 | -1) => {
    if (!within(ctx, x, z)) return
    k.cyl(p, 0.055, 0.1, h, c.galvanised, x, h / 2 + 0.03, z, 8)
    k.box(p, 0.36, 0.03, 0.36, c.galvanised, x, 0.045, z)
    const arm = k.cyl(p, 0.035, 0.04, 1.2, c.galvanised, x + dir * 0.55, h - 0.05, z, 8)
    arm.rotation.z = PI / 2
    k.box(p, 0.62, 0.07, 0.3, c.luminaire, x + dir * 1.15, h - 0.08, z)
    k.box(p, 0.5, 0.01, 0.24, c.lamp, x + dir * 1.15, h - 0.12, z, false)
    shade.pool(x, 0.03, z, 0.35, 0.35, 0.5)
  }
  for (const z of [44, 34]) pole(DRIVE.x0 + 0.4, z, 7, 1)
  for (const z of [44, 20, -5]) pole(SERVICE.x1 - 0.4, z, 7, -1)
  for (const x of [-7, 7]) {
    const l = ctx.lighting.light(new PointLight('#ffd9ad', 6, 14, 2), 0)
    l.position.set(x, 1.5, FORECOURT.kerb - 1)
    p.add(l)
  }
}

/** A stone monolith at the way in carrying the name in channel letters. */
function buildPylon(ctx: HotelCtx, p: Object3D) {
  const { c } = ctx
  const x = DRIVE.x1 + 2.2
  const z = PLOT.z1 - 2.2
  if (!within(ctx, x, z)) return
  bx(ctx, p, [x - 1.6, x + 1.6], [GL, GL + 0.25], [z - 0.8, z + 0.8], c.granite)
  bx(ctx, p, [x - 1.4, x + 1.4], [GL + 0.25, 5.2], [z - 0.55, z + 0.55], c.silver)
  bx(ctx, p, [x - 1.25, x + 1.25], [3.6, 4.9], [z + 0.55, z + 0.58], c.plantDark)
  NAME.split(' ').forEach((line, i) => {
    const g = signLine(ctx, line, 0.36, 0.04)
    g.position.set(x, 4.35 - i * 0.6, z + 0.6)
    p.add(g)
  })
  ctx.shade.rect(x, GL + 0.004, z, 3.4, 1.8, 0, 0.55)
}

/** A car dropping guests under the canopy, and one going down the ramp. */
function buildCars(ctx: HotelCtx, p: Object3D) {
  const dz = (FORECOURT.z0 + FORECOURT.kerb) / 2 - 1.1
  if (within(ctx, -1.5, dz + 2.4)) {
    parkedCar(p, 'sedan', '#1c1d1f', -1.5, dz, PI / 2, 0.03)
    ctx.shade.rect(-1.5, 0.035, dz, 4.5, 1.9, 0, 0.75)
  }
  const lx = (DRIVE.x0 + DRIVE.x1) / 2 - 1.4
  parkedCar(p, 'crossover', '#e9eaea', lx, RAMP.top + 4.5, PI, 0.02)
  ctx.shade.rect(lx, 0.03, RAMP.top + 4.5, 1.9, 4.5, 0, 0.75)
}

/* ---------- surroundings ---------- */

const CROSS = 33 * FT
/** The plot and what is shown round it: the HMDA road in front, the cross road behind, open ground either side. */
export const SITE = { minX: PLOT.x0 - 10, maxX: PLOT.x1 + 8, minZ: PLOT.z0 - CROSS - 2, maxZ: PLOT.z1 + 26 }

/**
 * The roads round the plot, for the property's own view (the master plan draws its own): the HMDA
 * road's footpath, service lane, median and carriageway; the 33 ft cross road behind; Plot A-03
 * to the north and the open ground beyond the site's boundary to the south.
 */
export function buildContext(ctx: HotelCtx, p: Object3D) {
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
  ground(ctx, p, rect(SITE.minX, SITE.maxX, PLOT.z0 - CROSS, PLOT.z0 - 1.5), 0.02, c.asphalt)
  ground(ctx, p, rect(SITE.minX, SITE.maxX, PLOT.z0 - 1.5, PLOT.z0), 0.15, c.interlock)
  ground(ctx, p, rect(SITE.minX, SITE.maxX, SITE.minZ, PLOT.z0 - CROSS), 0.02, c.fallow)
  ground(ctx, p, rect(SITE.minX, PLOT.x0, PLOT.z0, zf), 0.02, c.fallow)
  ground(ctx, p, rect(PLOT.x1, SITE.maxX, PLOT.z0, zf), 0.02, c.fallow)
}
