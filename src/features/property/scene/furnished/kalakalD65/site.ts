import type { Material } from 'three'
import { CARPORT, CAR_BACK, DEPTH, FACE, STEPS, W, type Ctx } from './house'
import { car, frangipani, hedge, palm, shrub } from './pieces'

/*
 * Plot D-65: 40 ft × 60 ft (12.19 × 18.29 m), a corner plot facing east onto the 33 ft cross road,
 * with the 60 ft main avenue along its north side. Site frame: +z east (the road the house faces),
 * +x north (the avenue), origin at the plot centre. The house is centred on the plot's width with
 * a 3 m front setback; side and rear setbacks follow from the 25 ft façade and 43 ft plan depth.
 */

type R = [number, number]

export const PLOT = { x0: -6.096, x1: 6.096, z0: -9.144, z1: 9.144 }
/** Front face of the first-floor box, in site z. */
export const HOUSE_Z = PLOT.z1 - 3.0
const EAST_ROAD = 10.06
const AVENUE_PART = 7.9
/** Plot, roads and neighbouring ground shown around the house. */
export const SITE = { minX: PLOT.x0 - 1.9, maxX: PLOT.x1 + AVENUE_PART, minZ: PLOT.z0 - 1.9, maxZ: PLOT.z1 + EAST_ROAD }

const WALL_T = 0.23
const WALL_H = 1.8
const hz = (z: number) => HOUSE_Z + z
const HX: R = [-W / 2, W / 2]

function bx({ out }: Ctx, [x0, x1]: R, [y0, y1]: R, [z0, z1]: R, mat: Material | Material[], cast = true, p = out.root) {
  return out.box(p, x1 - x0, y1 - y0, z1 - z0, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, cast)
}

/** A flat ground surface with a true-scale finish. */
function ground(ctx: Ctx, xs: R, zs: R, y: number, mat: (w: number, d: number) => Material) {
  bx(ctx, xs, [0, y], zs, mat(xs[1] - xs[0], zs[1] - zs[0]), false)
}

/** The plot: paving, lawn and planting, compound walls and garden lighting. */
export function buildPlot(ctx: Ctx) {
  const { out, c } = ctx
  const p = { k: out, c }
  const { x0, x1, z0, z1 } = PLOT
  const inX0 = x0 + WALL_T
  const inX1 = x1 - WALL_T
  const front = hz(FACE)
  const grass = (w: number, d: number) => out.finish('grass', w / 3, d / 3, 1)
  const paved = (w: number, d: number) => c.surface('pavers', w, d)

  // Paving: the driveway into the carport, the side passages and the rear yard.
  ground(ctx, [CARPORT[0] - 0.23, inX1], [hz(CAR_BACK), z1], 0.05, paved)
  ground(ctx, [inX0, HX[1]], [z0 + WALL_T, hz(-DEPTH)], 0.04, paved)
  ground(ctx, [inX0, HX[0]], [hz(-DEPTH), front], 0.04, paved)
  ground(ctx, [HX[1], inX1], [hz(-DEPTH), hz(CAR_BACK)], 0.04, paved)

  // Front garden: lawn, a hedge along the road edge and a planted bed at the foot of the stone.
  ground(ctx, [inX0, STEPS[0] - 0.05], [front, z1], 0.035, grass)
  ground(ctx, [STEPS[0] - 0.05, CARPORT[0] - 0.23], [hz(0.3), z1], 0.035, grass)
  bx(ctx, [inX0, STEPS[0] - 0.05], [0.035, 0.05], [front + 0.05, front + 0.75], c.soil, false)
  hedge(p, [inX0 + 0.1, STEPS[0] - 0.15], z1 - 0.3, 0.45)
  hedge(p, [inX0 + 0.1, STEPS[0] - 0.15], front + 1.15, 0.35)
  for (const [x, s] of [[-3.35, 0.95], [-2.75, 1.15], [-2.15, 0.9], [-1.6, 1.05]] as const) shrub(p, x, front + 0.38, s)
  for (const x of [-4.6, -5.3]) shrub(p, x, front + 0.5, 1.1)

  // Stepping slabs from the road to the entrance steps, set in the lawn.
  for (let z = hz(0.3) + 0.25; z < z1 - 0.15; z += 0.55)
    bx(ctx, [STEPS[0] + 0.05, STEPS[1] - 0.05], [0.035, 0.06], [z, z + 0.36], c.stepStone, false)

  // Planted strip against the north wall, beside the drive.
  ground(ctx, [HX[1] + 0.35, inX1], [hz(0.2), z1 - 0.2], 0.065, () => c.soil)
  for (let z = hz(0.6); z < z1 - 0.4; z += 0.9) shrub(p, inX1 - 0.55, z, 0.9 + Math.abs((z * 7) % 0.3), 0.05)

  // Compound walls on the sides and rear, white with a stone coping; the road front stays open.
  const wall = (xs: R, zs: R) => {
    bx(ctx, xs, [0, WALL_H], zs, c.white)
    bx(ctx, [xs[0] - 0.02, xs[1] + 0.02], [WALL_H, WALL_H + 0.05], zs, c.coping)
  }
  wall([x0, inX0], [z0, z1])
  wall([inX1, x1], [z0, z1])
  wall([inX0, inX1], [z0, z0 + WALL_T])

  // Garden lights: a spike light in the front bed, path lights, and wall lamps on the compound walls.
  for (const [x, z] of [[-2.45, front + 0.55], [STEPS[0] - 0.2, hz(0.9)], [STEPS[0] - 0.2, z1 - 1.0]]) bollard(ctx, x, z)
  for (const z of [z1 - 1.8, hz(-6)]) {
    wallLamp(ctx, inX0, z, 1)
    wallLamp(ctx, inX1, z, -1)
  }

  // Coconut palms in the rear corners and a frangipani at the front corner, as framed in the reference.
  palm(p, x0 + 1.1, z0 + 1.1, 8.6)
  palm(p, x1 - 1.1, z0 + 1.2, 9.4, -0.05)
  frangipani(p, x0 + 0.95, z1 - 0.9, 1.0)

  car(p, (CARPORT[0] + CARPORT[1]) / 2, hz(-0.12) - 2.2, 0.05)
}

/** The cross road in front and part of the main avenue to the north, with kerbs and a footpath. */
export function buildContext(ctx: Ctx) {
  const { c } = ctx
  const { x0, x1, z0, z1 } = PLOT
  const asphalt = (w: number, d: number) => c.surface('asphalt', w, d)
  ground(ctx, [SITE.minX, SITE.maxX], [z1, SITE.maxZ], 0.01, asphalt)
  ground(ctx, [x1 + 1.5, SITE.maxX], [SITE.minZ, z1], 0.01, asphalt)
  ground(ctx, [x1, x1 + 1.5], [SITE.minZ, z1], 0.15, (w, d) => c.surface('pavers', w, d))
  bx(ctx, [x1 + 1.35, x1 + 1.5], [0, 0.16], [SITE.minZ, z1], c.curb)
  // Kerb along the plot's road edge, broken at the drive and the path.
  for (const xs of [[x0, STEPS[0]], [STEPS[1], CARPORT[0] - 0.23]] as R[]) bx(ctx, xs, [0, 0.12], [z1, z1 + 0.15], c.curb)
  // Dashed centre line on the cross road.
  for (let x = SITE.minX + 0.5; x < x1 - 1; x += 3) bx(ctx, [x, x + 1.5], [0.01, 0.014], [z1 + EAST_ROAD / 2 - 0.06, z1 + EAST_ROAD / 2 + 0.06], c.lane, false)
  // Neighbouring plots: open ground to the south and west.
  const fallow = (w: number, d: number) => {
    const m = ctx.out.finish('grass', w / 3, d / 3, 1)
    m.color.set('#b8a98c')
    return m
  }
  ground(ctx, [SITE.minX, x0], [SITE.minZ, z1], 0.02, fallow)
  ground(ctx, [x0, x1], [SITE.minZ, z0], 0.02, fallow)
}

function bollard(ctx: Ctx, x: number, z: number) {
  const { out, c } = ctx
  out.cyl(out.root, 0.03, 0.03, 0.42, c.aluminium, x, 0.21, z, 10)
  out.cyl(out.root, 0.045, 0.045, 0.06, c.garden, x, 0.45, z, 12).castShadow = false
}

function wallLamp(ctx: Ctx, x: number, z: number, side: 1 | -1) {
  const { out, c } = ctx
  const fx = x + side * 0.06
  out.box(out.root, 0.12, 0.22, 0.08, c.aluminium, fx, 1.45, z)
  out.box(out.root, 0.01, 0.16, 0.05, c.lamp, fx + side * 0.061, 1.45, z, false)
}
