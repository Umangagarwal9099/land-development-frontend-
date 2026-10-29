import { Group, PointLight, type Material, type Object3D } from 'three'
import { PI, type Kit } from '../kit'
import type { Lighting } from '../shared'
import type { D65Materials } from './materials'
import { arecaPot } from './pieces'

export interface Ctx {
  /** Builds the house, in its own frame (front face of the first-floor box at z = 0). */
  k: Kit
  /** Builds the plot and its surroundings, in site coordinates. */
  out: Kit
  c: D65Materials
  lighting: Lighting
}

/*
 * The residence on Plot D-65, modelled from the client's reference elevation and floor plans
 * (no dimensioned drawing exists). Elevation measurements were scaled at 142 px per metre on the
 * 2× crop, fixed by the 2.13 m main door and a 3.26 m floor-to-floor height:
 *
 *   overall façade 7.62 m (25′) wide · top of the charcoal frame +7.90 m · parapet +7.09 m
 *   ground floor +0.61 m (three risers) · first floor +3.87 m · first-floor ceiling +6.52 m
 *
 * Depth comes from the plans (13.14 m to the rear wall). The plans and the render are mirror
 * images; the render governs, so the carport is on the right (+x) looking from the road.
 * House frame: x across the front (−3.81 … 3.81), +z towards the road, y up from site ground.
 */

type R = [number, number]

export const W = 7.62
const X0 = -W / 2
const X1 = W / 2
export const DEPTH = 13.14
const BACK = -DEPTH
export const GFL = 0.61
export const FFL = 3.87
const GF_CEIL = 3.72
/** Underside of the first-floor box (porch and carport ceiling line). */
const BEAM = 3.43
const FF_CEIL = 6.52
const ROOF = 6.67
export const PARAPET = 7.09
const FRAME_Y = 7.62
export const FRAME_TOP = 7.9
/** Outer face of the ground-floor front wall and of the balcony's back wall. */
export const FACE = -2.1
const T = 0.23
const WALL: R = [FACE - T, FACE]
/** Inner face of the carport's back wall. */
export const CAR_BACK = -5.3
export const CARPORT: R = [0.45, 3.51]
/** The first-floor box projects 2.1 m from the house; its legs and bands are 280 mm. */
const BOX: R = [-1.4, X1]
const LEG = 0.28
/** Front plane of the charcoal frame. */
const FRAME_Z = -1.2
/** The stone-clad pier and its tall window. */
const STONE: R = [-2.94, -1.11]
const TALL: R = [-2.73, -1.68]
const DOOR: R = [-1.02, -0.14]
export const STEPS: R = [-1.45, 0.2]

/** A box given by its extents. */
function bx(k: Kit, p: Object3D, [x0, x1]: R, [y0, y1]: R, [z0, z1]: R, mat: Material | Material[], cast = true) {
  return k.box(p, x1 - x0, y1 - y0, z1 - z0, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, cast)
}

type Hole = [a0: number, a1: number, y0: number, y1: number]

/**
 * A wall with rectangular openings. `axis` is the direction the wall runs: 'x' for the front and
 * back, 'z' for the sides. `mat` may be a function of the piece's face size, for finishes that
 * must keep their true scale on every piece.
 */
function holed(k: Kit, axis: 'x' | 'z', [a0, a1]: R, ys: R, t: R, holes: Hole[], mat: Material | ((w: number, h: number) => Material)) {
  const piece = (a: number, b: number, y0: number, y1: number) => {
    if (b - a < 0.002 || y1 - y0 < 0.002) return
    const m = typeof mat === 'function' ? mat(b - a, y1 - y0) : mat
    if (axis === 'x') bx(k, k.root, [a, b], [y0, y1], t, m)
    else bx(k, k.root, t, [y0, y1], [a, b], m)
  }
  let cursor = a0
  for (const [h0, h1, hy0, hy1] of [...holes].sort((p, q) => p[0] - q[0])) {
    piece(cursor, h0, ys[0], ys[1])
    piece(h0, h1, ys[0], hy0)
    piece(h0, h1, hy1, ys[1])
    cursor = h1
  }
  piece(cursor, a1, ys[0], ys[1])
}

/**
 * Black aluminium glazing filling an opening: a perimeter frame, mullions at `mullions` (along
 * the wall) and transoms at `transoms` (heights), with the glass on `plane`.
 */
function glazing(
  { k, c }: Ctx,
  axis: 'x' | 'z',
  [a0, a1]: R,
  [y0, y1]: R,
  plane: number,
  { mullions = [], transoms = [], face = 0.05 }: { mullions?: number[]; transoms?: number[]; face?: number } = {},
) {
  const r = k.root
  const depth = 0.08
  const t: R = [plane - depth / 2, plane + depth / 2]
  const along = (a: number, b: number, ya: number, yb: number, m: Material, tt: R, cast = true) =>
    axis === 'x' ? bx(k, r, [a, b], [ya, yb], tt, m, cast) : bx(k, r, tt, [ya, yb], [a, b], m, cast)
  along(a0, a1, y0, y1, c.glass, [plane - 0.006, plane + 0.006], false)
  for (const a of [a0 + face / 2, ...mullions, a1 - face / 2]) along(a - face / 2, a + face / 2, y0, y1, c.aluminium, t)
  for (const y of [y0 + face / 2, ...transoms, y1 - face / 2]) along(a0, a1, y - face / 2, y + face / 2, c.aluminium, t)
}

/** Gathered sheer curtain: slim staggered panels read as soft folds through the glass. */
function curtain({ k, c }: Ctx, axis: 'x' | 'z', [a0, a1]: R, [y0, y1]: R, plane: number) {
  const n = Math.max(2, Math.round((a1 - a0) / 0.07))
  const fw = (a1 - a0) / n
  for (let i = 0; i < n; i++) {
    const a = a0 + fw * (i + 0.5)
    const off = i % 2 ? 0.035 : 0
    if (axis === 'x') k.box(k.root, fw * 1.1, y1 - y0, 0.01, c.sheer, a, (y0 + y1) / 2, plane + off, false)
    else k.box(k.root, 0.01, y1 - y0, fw * 1.1, c.sheer, plane + off, (y0 + y1) / 2, a, false)
  }
}

/** Recessed downlight: a glowing disc set into a ceiling whose underside is at `y`. */
function downlight({ k, c }: Ctx, x: number, y: number, z: number) {
  k.cyl(k.root, 0.055, 0.055, 0.01, c.downlight, x, y - 0.004, z, 16).castShadow = false
}

function lamp(ctx: Ctx, x: number, y: number, z: number, intensity: number, distance: number, dayFactor = 0, color = '#ffd29a') {
  const l = new PointLight(color, intensity, distance, 2)
  l.position.set(x, y, z)
  ctx.k.root.add(l)
  ctx.lighting.light(l, dayFactor)
}

/** Plinth, walls, slabs, roof and parapets: the house as a built shell with real openings. */
export function buildShell(ctx: Ctx) {
  const { k, c } = ctx
  const r = k.root
  const white = c.white

  // Plinth under the ground floor (the carport stays at drive level).
  bx(k, r, [X0, CARPORT[0]], [0, GFL], [BACK, FACE - T], white)
  bx(k, r, [CARPORT[0], X1], [0, GFL], [BACK, CAR_BACK - T], white)
  bx(k, r, [STONE[1], CARPORT[0] - T], [0, GFL], WALL, white)

  // Interior floors, so every window looks into a room rather than a void.
  bx(k, r, [X0 + T, CARPORT[0] - T], [GFL, GFL + 0.01], [BACK + T, FACE - T], c.interiorFloor, false)
  bx(k, r, [CARPORT[0] - T, X1 - T], [GFL, GFL + 0.01], [BACK + T, CAR_BACK - T], c.interiorFloor, false)
  bx(k, r, [X0 + T, X1 - T], [FFL, FFL + 0.01], [BACK + T, FACE - T], c.interiorFloor, false)

  // Front: the stone pier and slatted bay run up past the roof to the frame; the door wall beside them.
  holed(k, 'x', [X0, STONE[1]], [0, FRAME_Y], WALL, [[TALL[0], TALL[1], 1.27, 6.33]], white)
  holed(k, 'x', [STONE[1], CARPORT[0] - T], [GFL, FFL], WALL, [[DOOR[0], DOOR[1], GFL, 2.74]], white)

  // Carport: side wall to the hall, the back wall to the house, and the 300 mm pier carrying the box.
  bx(k, r, [CARPORT[0] - T, CARPORT[0]], [0, FFL], [CAR_BACK, FACE], white)
  holed(k, 'x', CARPORT, [0, FFL], [CAR_BACK - T, CAR_BACK], [[0.72, 2.48, 1.34, 2.44]], c.greige)
  bx(k, r, [CARPORT[1], X1], [0, BEAM], [CAR_BACK - T, 0], white)
  bx(k, r, [CARPORT[1], X1], [BEAM, GF_CEIL], [CAR_BACK - T, FACE], white)
  // Shadow grooves across the carport's back wall, every 500 mm.
  for (let y = 0.55; y < BEAM; y += 0.5) {
    if (y > 1.3 && y < 2.48) {
      bx(k, r, [CARPORT[0], 0.72], [y - 0.006, y + 0.006], [CAR_BACK, CAR_BACK + 0.008], c.groove, false)
      bx(k, r, [2.48, CARPORT[1]], [y - 0.006, y + 0.006], [CAR_BACK, CAR_BACK + 0.008], c.groove, false)
    } else bx(k, r, CARPORT, [y - 0.006, y + 0.006], [CAR_BACK, CAR_BACK + 0.008], c.groove, false)
  }

  // Sides and back. Openings follow the floor plans (toilet ventilators, dining and bedroom windows).
  holed(k, 'z', [BACK, FACE - T], [0, ROOF], [X0, X0 + T], [[-8.57, -7.33, 1.31, 2.71], [-8.57, -7.9, 5.2, 5.8]], white)
  holed(k, 'z', [BACK + T, CAR_BACK - T], [0, FFL], [X1 - T, X1], [[-8.76, -8.1, 2.3, 2.9]], white)
  holed(k, 'z', [BACK + T, FACE], [FFL, ROOF], [X1 - T, X1], [[-3.81, -2.95, 5.0, 5.6]], white)
  holed(k, 'x', [X0, X1], [0, ROOF], [BACK, BACK + T], [
    [-2.48, -1.33, 1.31, 2.71], [1.43, 2.67, 1.31, 2.71], [-2.1, -0.95, 4.57, 5.97], [1.52, 2.67, 4.57, 5.97],
  ], white)

  // First floor slab, then the projecting box: slab and beam, legs, roof and fascia.
  bx(k, r, [X0, X1], [GF_CEIL, FFL], [BACK, FACE - T], white)
  bx(k, r, [STONE[1], X1], [GF_CEIL, FFL], [FACE - T, FACE], white)
  bx(k, r, BOX, [BEAM, FFL], [FACE, 0], white)
  bx(k, r, [BOX[0], BOX[0] + LEG], [FFL, FF_CEIL], [FACE, 0], white)
  bx(k, r, [X1 - 0.3, X1], [FFL, FF_CEIL], [FACE, 0], white)
  bx(k, r, BOX, [FF_CEIL, ROOF], [FACE, 0], white)
  bx(k, r, BOX, [ROOF, PARAPET], [-0.2, 0], white)
  bx(k, r, [BOX[0], BOX[0] + 0.2], [ROOF, PARAPET], [FACE, -0.2], white)
  bx(k, r, [X1 - 0.2, X1], [ROOF, PARAPET], [BACK, -0.2], white)

  // Balcony back wall with its two glazed doors.
  holed(k, 'x', [BOX[0] + LEG, X1 - T], [FFL, FF_CEIL], WALL, [
    [-0.97, -0.26, FFL, 5.72], [0.28, 2.16, FFL, 5.71],
  ], c.greige)

  // Roof slab and terrace parapets (the front parapet is the box's top band).
  bx(k, r, [X0, X1], [FF_CEIL, ROOF], [BACK, FACE], white)
  bx(k, r, [X0 + 0.2, X1 - 0.2], [ROOF, ROOF + 0.02], [BACK + 0.2, FACE - T], c.roofing, false)
  bx(k, r, [BOX[0] + 0.2, X1 - 0.2], [ROOF, ROOF + 0.02], [FACE - T, -0.2], c.roofing, false)
  bx(k, r, [X0, X0 + 0.2], [ROOF, PARAPET], [BACK, FACE - T], white)
  bx(k, r, [X0, X1], [ROOF, PARAPET], [BACK, BACK + 0.2], white)

  // Interior partitions close the visible rooms off from the rest of the plan.
  bx(k, r, [X0 + T, X1 - T], [GFL, GF_CEIL], [-8.62, -8.5], c.interior)
  bx(k, r, [X0 + T, X1 - T], [FFL, FF_CEIL], [-7.12, -7.0], c.interior)
}

/** Charcoal frame, ledgestone pier, teak battens, lattice, soffits, door, glazing and lighting. */
export function buildFacade(ctx: Ctx) {
  const { k, c } = ctx
  const r = k.root

  // Charcoal frame: a full-height post on the left and a top band cantilevering over the box.
  bx(k, r, [X0, X0 + LEG], [0, FRAME_Y], [FACE - T, FRAME_Z], c.charcoal)
  bx(k, r, [X0, 0.31], [FRAME_Y, FRAME_TOP], [FACE - T, FRAME_Z], c.charcoal)
  bx(k, r, [X0 + LEG, 0.31], [FRAME_Y - 0.025, FRAME_Y], [FACE - T, FRAME_Z], c.surface('teak', 4.1, 1.2))
  bx(k, r, [X0 + LEG, 0.31], [FRAME_Y - 0.04, FRAME_Y - 0.025], [FRAME_Z - 0.06, FRAME_Z - 0.03], c.led, false)
  downlight(ctx, -0.2, FRAME_Y - 0.025, -1.7)

  // Split-face ledgestone over the pier, cut around the tall window and returned at its edges.
  holed(k, 'x', STONE, [0, FRAME_Y - 0.025], [FACE, FACE + 0.05], [[TALL[0], TALL[1], 1.27, 6.33]], (w, h) => c.surface('stone', w, h))

  // Vertical teak battens on a dark ground, inside the frame.
  const slatX: R = [X0 + LEG, STONE[0]]
  bx(k, r, slatX, [0.1, FRAME_Y - 0.025], [FACE, FACE + 0.02], c.darkWood)
  const n = 9
  const pitch = (slatX[1] - slatX[0]) / n
  const batten = c.surface('teak', 0.034 * 4, 7.5)
  for (let i = 0; i < n; i++) {
    const x = slatX[0] + pitch * (i + 0.5)
    bx(k, r, [x - 0.017, x + 0.017], [0.1, FRAME_Y - 0.03], [FACE + 0.02, FACE + 0.07], batten)
  }

  // Teak soffits: carport, balcony and the strip over the porch; the porch itself stays white.
  bx(k, r, [-0.16, CARPORT[1]], [BEAM - 0.03, BEAM], [FACE, -0.25], c.surface('teak', 3.7, 1.9), false)
  bx(k, r, CARPORT, [BEAM - 0.03, BEAM], [CAR_BACK, FACE], c.surface('teak', 3.1, 3.2), false)
  bx(k, r, [BOX[0] + LEG, CARPORT[1]], [FF_CEIL - 0.03, FF_CEIL], [FACE, -0.25], c.surface('teak', 4.6, 1.9), false)
  for (const [x, z] of [[0.64, -1.0], [2.79, -1.0], [0.64, -3.4], [2.79, -3.4]]) downlight(ctx, x, BEAM - 0.03, z)
  downlight(ctx, -0.76, BEAM, -1.0)
  for (const x of [-0.71, 1.84]) downlight(ctx, x, FF_CEIL - 0.03, -1.0)

  // Main door: flush teak with horizontal grooves, a dark jamb and a full-height black pull.
  const dz = FACE - 0.12
  bx(k, r, [DOOR[0] + 0.04, DOOR[1] - 0.04], [GFL, 2.7], [dz, dz + 0.05], c.surface('teak', 0.8, 2.1))
  for (let y = GFL + 0.16; y < 2.66; y += 0.16) bx(k, r, [DOOR[0] + 0.06, DOOR[1] - 0.06], [y - 0.004, y + 0.004], [dz + 0.05, dz + 0.054], c.darkWood, false)
  bx(k, r, [DOOR[0], DOOR[0] + 0.04], [GFL, 2.74], [FACE - T, FACE - 0.02], c.darkWood)
  bx(k, r, [DOOR[1] - 0.04, DOOR[1]], [GFL, 2.74], [FACE - T, FACE - 0.02], c.darkWood)
  bx(k, r, [DOOR[0], DOOR[1]], [2.7, 2.74], [FACE - T, FACE - 0.02], c.darkWood)
  bx(k, r, [-0.31, -0.28], [1.0, 2.25], [dz + 0.1, dz + 0.125], c.aluminium)
  for (const y of [1.05, 2.2]) bx(k, r, [-0.305, -0.285], [y - 0.01, y + 0.01], [dz + 0.05, dz + 0.1], c.aluminium)

  // Entrance landing and three risers in white stone.
  bx(k, r, STEPS, [0, GFL], [FACE, -0.3], c.stepStone)
  bx(k, r, STEPS, [0, 0.41], [-0.3, 0], c.stepStone)
  bx(k, r, STEPS, [0, 0.2], [0, 0.3], c.stepStone)

  // Glazing.
  glazing(ctx, 'x', TALL, [1.27, 6.33], FACE - 0.1, { transoms: [3.825, 4.6], face: 0.065 })
  glazing(ctx, 'x', [-0.97, -0.26], [FFL, 5.72], FACE - 0.1)
  glazing(ctx, 'x', [0.28, 2.16], [FFL, 5.71], FACE - 0.1, { mullions: [1.22] })
  glazing(ctx, 'x', [0.72, 2.48], [1.34, 2.44], CAR_BACK - 0.1, { mullions: [1.31, 1.73] })
  for (const [a0, a1, y0, y1] of [[-2.48, -1.33, 1.31, 2.71], [1.43, 2.67, 1.31, 2.71], [-2.1, -0.95, 4.57, 5.97], [1.52, 2.67, 4.57, 5.97]])
    glazing(ctx, 'x', [a0, a1], [y0, y1], BACK + 0.1, { mullions: [(a0 + a1) / 2] })
  glazing(ctx, 'z', [-8.57, -7.33], [1.31, 2.71], X0 + 0.1, { mullions: [-7.95] })
  glazing(ctx, 'z', [-8.57, -7.9], [5.2, 5.8], X0 + 0.1)
  glazing(ctx, 'z', [-8.76, -8.1], [2.3, 2.9], X1 - 0.1)
  glazing(ctx, 'z', [-3.81, -2.95], [5.0, 5.6], X1 - 0.1)

  // Sheers drawn to the sides, as in the reference.
  const inside = FACE - T - 0.1
  curtain(ctx, 'x', [TALL[0] + 0.03, TALL[0] + 0.3], [GFL + 0.02, GF_CEIL - 0.02], inside)
  curtain(ctx, 'x', [TALL[1] - 0.3, TALL[1] - 0.03], [GFL + 0.02, GF_CEIL - 0.02], inside)
  curtain(ctx, 'x', [TALL[0] + 0.03, TALL[0] + 0.3], [FFL + 0.02, FF_CEIL - 0.02], inside)
  curtain(ctx, 'x', [TALL[1] - 0.3, TALL[1] - 0.03], [FFL + 0.02, FF_CEIL - 0.02], inside)
  curtain(ctx, 'x', [-0.95, -0.72], [FFL + 0.02, FF_CEIL - 0.02], inside)
  curtain(ctx, 'x', [0.3, 0.62], [FFL + 0.02, FF_CEIL - 0.02], inside)
  curtain(ctx, 'x', [1.84, 2.14], [FFL + 0.02, FF_CEIL - 0.02], inside)
  curtain(ctx, 'x', [0.74, 0.98], [1.2, 2.62], CAR_BACK - T - 0.1)
  curtain(ctx, 'x', [2.22, 2.46], [1.2, 2.62], CAR_BACK - T - 0.1)

  // Warm rooms behind the glass: ceiling downlights and a low fill per room.
  for (const [x, z] of [[-2.2, -3.0], [-2.2, -5.2], [-0.6, -5.2]]) downlight(ctx, x, GF_CEIL, z)
  for (const [x, z] of [[1.6, -6.6], [2.6, -7.6]]) downlight(ctx, x, GF_CEIL, z)
  for (const [x, z] of [[-2.2, -3.2], [-0.6, -3.4], [1.2, -3.4], [1.2, -5.4]]) downlight(ctx, x, FF_CEIL, z)
  bx(k, r, [X0 + T, X1 - T], [GF_CEIL - 0.01, GF_CEIL], [-8.5, FACE - T], c.room, false)
  bx(k, r, [X0 + T, X1 - T], [FF_CEIL - 0.01, FF_CEIL], [-7.0, FACE - T], c.room, false)
  lamp(ctx, -2.0, 3.1, -4.2, 6, 7, 0.6)
  lamp(ctx, 1.6, 3.1, -7.0, 4, 5, 0.6)
  lamp(ctx, -2.0, 6.0, -4.0, 5, 6, 0.6)
  lamp(ctx, 1.0, 6.0, -4.2, 6, 7, 0.6)
  arecaPot({ k, c }, -2.05, FACE - T - 0.6, 1.4, GFL)
  arecaPot({ k, c }, -2.35, FACE - T - 0.6, 1.1, FFL)
  arecaPot({ k, c }, 0.12, FACE + 0.35, 0.9, GFL, c.potDark)

  // Façade lights: the downlights' wash, the frame's LED line, and two up-down wall lamps.
  lamp(ctx, 1.7, BEAM - 0.3, -1.6, 5, 6)
  lamp(ctx, -0.7, BEAM - 0.3, -1.2, 3, 5)
  lamp(ctx, 0.6, FF_CEIL - 0.3, -1.0, 4, 5)
  lamp(ctx, -1.6, FRAME_Y - 0.4, -1.5, 3, 6)
  wallLamp(ctx, -3.235, 3.52, FACE + 0.07)
  wallLamp(ctx, 0.03, 2.11, FACE)
}

/** Up-down cylinder wall lamp in black, washing light both ways along the wall. */
function wallLamp(ctx: Ctx, x: number, y: number, z: number) {
  const { k, c } = ctx
  const g = new Group()
  g.position.set(x, y, z)
  k.root.add(g)
  k.box(g, 0.07, 0.24, 0.02, c.aluminium, 0, 0, 0.01)
  k.cyl(g, 0.035, 0.035, 0.18, c.aluminium, 0, 0, 0.07, 16)
  for (const s of [-1, 1]) k.cyl(g, 0.028, 0.028, 0.004, c.lamp, 0, s * 0.092, 0.07, 16).castShadow = false
  lamp(ctx, x, y + 0.5, z + 0.2, 1.6, 2.4)
  lamp(ctx, x, y - 0.5, z + 0.2, 1.6, 2.4)
}

/** The balcony: floor, frameless glass balustrade, teak lattice screen, planters and a chair. */
export function buildBalcony(ctx: Ctx) {
  const { k, c } = ctx
  const r = k.root
  const rail: R = [BOX[0] + LEG, 2.52]
  bx(k, r, [BOX[0] + LEG, CARPORT[1]], [FFL, FFL + 0.012], [FACE, 0], c.stepStone, false)
  bx(k, r, rail, [FFL, FFL + 0.08], [-0.21, -0.11], c.aluminium)
  bx(k, r, rail, [FFL + 0.07, 4.73], [-0.166, -0.154], c.railGlass, false)
  bx(k, r, rail, [4.73, 4.77], [-0.185, -0.135], c.aluminium)

  // Lattice: teak verticals at 124 mm and rails at 250 mm, in a teak surround.
  const lx: R = [2.52, CARPORT[1]]
  const ly: R = [FFL, FF_CEIL - 0.03]
  const teak = c.surface('teak', 0.4, 2.6)
  const lz: R = [-0.2, -0.12]
  for (let i = 0; i <= 8; i++) {
    const x = lx[0] + 0.02 + ((lx[1] - lx[0] - 0.04) * i) / 8
    bx(k, r, [x - 0.02, x + 0.02], ly, lz, teak)
  }
  for (let y = ly[0] + 0.02; y <= ly[1]; y += 0.25) bx(k, r, lx, [y - 0.02, y + 0.02], [lz[0] + 0.01, lz[1] - 0.01], teak)
  bx(k, r, lx, [ly[1] - 0.04, ly[1]], lz, teak)

  arecaPot({ k, c }, -0.92, -0.5, 0.8, FFL)
  arecaPot({ k, c }, -0.5, -0.85, 1.3, FFL)
  arecaPot({ k, c }, 2.28, -0.6, 1.0, FFL)
  // A low lounge chair in charcoal rattan, angled towards the room, as in the reference.
  const g = k.at(1.62, -1.1, -PI / 7, FFL)
  for (const s of [-1, 1]) bx(k, g, [s * 0.36 - 0.02, s * 0.36 + 0.02], [0, 0.55], [-0.36, 0.36], c.aluminium)
  k.soft(g, 0.7, 0.12, 0.68, 0.04, c.groove, 0, 0.36, 0.02)
  k.soft(g, 0.7, 0.48, 0.1, 0.04, c.groove, 0, 0.64, -0.32).rotation.x = -0.22
}
