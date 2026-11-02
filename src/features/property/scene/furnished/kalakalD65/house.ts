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
 * Depth comes from the plans (13.14 m to the rear wall; now 1.8 m deeper, see DEPTH). The plans and the render are mirror
 * images; the render governs, so the carport is on the right (+x) looking from the road.
 * House frame: x across the front (−3.81 … 3.81), +z towards the road, y up from site ground.
 *
 * The ground floor follows the client's plan, mirrored with it. Down the carport side from the back
 * wall: bedroom, bathroom, stair hall, carport. Down the other: kitchen, its entry lobby, dining, living.
 */

type R = [number, number]
type Hole = [a0: number, a1: number, y0: number, y1: number]

export const W = 7.62
const X0 = -W / 2
const X1 = W / 2
/**
 * Depth to the rear wall: the plans' 13.14 m, plus 1.8 m taken from the rear yard to give the
 * living and dining hall more room (as far as the rear boundary wall allows, leaving a 120 mm
 * gap). Everything behind the hall moves back with the rear wall.
 */
const EXTRA = 1.8
export const DEPTH = 13.14 + EXTRA
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
export const CAR_BACK = -4.6
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
/** The kitchen (see kitchen.ts): inner extents in the back-left corner, with its 2.50 m false ceiling. */
export const KITCHEN = { x0: X0 + T, z0: BACK + T, w: 3.4, d: 3.7, h: 2.5 }
/** Bedroom 1 (see bedroom.ts): from the back wall forwards on the carport side, as long as the reference's 5.20 m bed wall. */
export const BEDROOM = { x0: KITCHEN.x0 + KITCHEN.w + 0.115, z0: BACK + T + 5.2, w: X1 - T - (KITCHEN.x0 + KITCHEN.w + 0.115), l: 5.2 }
/** The open living and dining hall: from the left wall to the carport wall, the bedroom's front wall to the façade. */
export const HALL = { x0: X0 + T, z0: BEDROOM.z0 + 0.115, w: CARPORT[0] - T - (X0 + T), d: FACE - T - (BEDROOM.z0 + 0.115) }
/** The side window, beside the dining table: house z. */
export const HALL_WINDOW: R = [HALL.z0 + 0.945, HALL.z0 + 2.145]
/** The ground-floor bathroom (see bathroom.ts): on the right wall, in front of the bedroom. */
export const BATHROOM = { x0: X1 - T - 2.5, z0: HALL.z0, w: 2.5, d: 1.9 }
/** The clear width of the door from the hall to the kitchen's lobby, beside the bedroom's wall (house x). */
export const CORRIDOR: R = [KITCHEN.x0 + KITCHEN.w - 0.785, KITCHEN.x0 + KITCHEN.w]
/** The stair hall behind the carport, in front of the bathroom: x and z of its floor, stair included. */
export const STAIR_HALL = { x0: CARPORT[0] - T + 0.115, x1: X1 - T, z0: BATHROOM.z0 + BATHROOM.d + 0.115, z1: CAR_BACK - T }
/**
 * Eighteen 181 mm risers on 250 mm goings, 1 m wide, read from the ground and first-floor plans
 * together: four treads along the carport's back wall, two winders in its corner, six up the right
 * wall, two more winders, and three back towards the middle of the house, over the bathroom, arriving
 * in the first-floor hall.
 */
export const STAIR = { risers: 18, rise: (FFL - GFL) / 18, going: 0.25, width: 1, lower: 4, winders: 2, upper: 6, top: 3 }
/** The first winders' square, in the corner of the carport's back wall and the right wall. */
export const LANDING = { x0: STAIR_HALL.x1 - STAIR.width, z0: STAIR_HALL.z1 - STAIR.width }
/** The second turn: where the upper flight ends, and where the top flight ends (house z and x). */
export const STAIR_TOP = { z: LANDING.z0 - STAIR.upper * STAIR.going, x: LANDING.x0 - STAIR.top * STAIR.going }
/**
 * Well through the first-floor slab, from the back: over the top flight, the upper flight, and the
 * first winders with a little of the lower flight, far enough for 2.1 m of headroom under its edge.
 */
export const STAIR_WELL: { x: R; z: R }[] = [
  { x: [STAIR_TOP.x, STAIR_HALL.x1], z: [STAIR_TOP.z - STAIR.width, STAIR_TOP.z] },
  { x: [LANDING.x0, STAIR_HALL.x1], z: [STAIR_TOP.z, LANDING.z0] },
  { x: [LANDING.x0 - 0.28, STAIR_HALL.x1], z: [LANDING.z0, STAIR_HALL.z1] },
]
/**
 * Bedroom 2 (see bedroom2.ts): the first-floor rear room on the stair side, its door wall facing the
 * head of the stair, at the plan's 3.50 × 3.60 m. Its frame runs from the house's right wall inwards.
 */
export const BEDROOM2 = {
  x1: X1 - T, z0: -7.12 - EXTRA - 3.6, w: 3.5, d: 3.6,
  /** Across the room's frame. */
  door: [3.5 - 0.85, 3.5 - 0.1] as R,
  window: { z: [0.55, 2.05] as R, h: [0.75, 2.35] as R },
}
/** The bedroom window in the back wall, over the desk beside the wardrobe (house x); its sill clears the desk. */
const BED_WINDOW: [number, number, number, number] = [BEDROOM.x0 + 2.65, BEDROOM.x0 + 3.45, GFL + 0.95, GFL + 2.3]
/** The bathroom's high ventilator and its shower niche, on the right wall (house z, heights above site ground). */
const BATH_VENT: Hole = [BATHROOM.z0 + 1.0, BATHROOM.z0 + 1.6, 2.3, 2.85]
const BATH_NICHE: Hole = [BATHROOM.z0 + 0.45, BATHROOM.z0 + 0.75, GFL + 1.05, GFL + 1.35]
/** The kitchen window in the left wall, centred over the window-side run: house z, and heights above site ground. */
const KW_MID = KITCHEN.z0 + (0.6 + (KITCHEN.d - 2.7) + 1.63) / 2
export const KITCHEN_WINDOW = { z0: KW_MID - 0.3, z1: KW_MID + 0.3, y0: GFL + 1.05, y1: GFL + 2.25 }

/** A box given by its extents. */
function bx(k: Kit, p: Object3D, [x0, x1]: R, [y0, y1]: R, [z0, z1]: R, mat: Material | Material[], cast = true) {
  return k.box(p, x1 - x0, y1 - y0, z1 - z0, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, cast)
}

/** A horizontal plate with the stair well left out of it. */
function plate(k: Kit, [x0, x1]: R, ys: R, [z0, z1]: R, mat: Material, cast = true) {
  const piece = (x: R, z: R) => {
    if (x[1] - x[0] > 0.002 && z[1] - z[0] > 0.002) bx(k, k.root, x, ys, z, mat, cast)
  }
  let cursor = z0
  for (const well of STAIR_WELL) {
    piece([x0, x1], [cursor, well.z[0]])
    piece([x0, well.x[0]], well.z)
    piece([well.x[1], x1], well.z)
    cursor = well.z[1]
  }
  piece([x0, x1], [cursor, z1])
}

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
  plate(k, [X0 + T, X1 - T], [FFL, FFL + 0.01], [BACK + T, FACE - T], c.interiorFloor, false)

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

  // Sides and back. Openings follow the floor plans (toilet ventilators, dining, kitchen and bedroom windows).
  holed(k, 'z', [BACK, FACE - T], [0, ROOF], [X0, X0 + T], [
    [KITCHEN_WINDOW.z0, KITCHEN_WINDOW.z1, KITCHEN_WINDOW.y0, KITCHEN_WINDOW.y1], [-8.57 - EXTRA, -7.9 - EXTRA, 5.2, 5.8], [HALL_WINDOW[0], HALL_WINDOW[1], 1.31, 2.71],
  ], white)
  holed(k, 'z', [BACK + T, CAR_BACK - T], [0, FFL], [X1 - T, X1], [BATH_NICHE, BATH_VENT], white)
  // The shower's niche is let into the right wall's inner leaf; the outer leaf stays whole.
  bx(k, r, [X1 - 0.115, X1], [BATH_NICHE[2], BATH_NICHE[3]], [BATH_NICHE[0], BATH_NICHE[1]], white)
  const B2 = BEDROOM2
  holed(k, 'z', [BACK + T, FACE], [FFL, ROOF], [X1 - T, X1], [
    [B2.z0 + B2.window.z[0], B2.z0 + B2.window.z[1], FFL + B2.window.h[0], FFL + B2.window.h[1]], [-3.81, -2.95, 5.0, 5.6],
  ], white)
  holed(k, 'x', [X0, X1], [0, ROOF], [BACK, BACK + T], [
    BED_WINDOW, [-2.1, -0.95, 4.57, 5.97], [1.52, 2.67, 4.57, 5.97],
  ], white)

  // First floor slab, then the projecting box: slab and beam, legs, roof and fascia.
  plate(k, [X0, X1], [GF_CEIL, FFL], [BACK, FACE - T], white)
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
  // Upstairs, this wall is Bedroom 2's door wall on the stair side, cut for its door.
  holed(k, 'x', [X0 + T, X1 - T], [FFL, FF_CEIL], [-7.12 - EXTRA, -7.0 - EXTRA], [[B2.x1 - B2.door[1], B2.x1 - B2.door[0], FFL, FFL + 2.1]], c.interior)
  // Bedroom 2's bed wall and its wall on the middle of the house.
  bx(k, r, [B2.x1 - B2.w - 0.115, X1 - T], [FFL, FF_CEIL], [B2.z0 - 0.12, B2.z0], c.interior)
  bx(k, r, [B2.x1 - B2.w - 0.115, B2.x1 - B2.w], [FFL, FF_CEIL], [B2.z0, B2.z0 + B2.d], c.interior)
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
  // It swings inwards about its left edge, into the hall, as on the plan.
  const leaf = new Group()
  leaf.name = 'door_main'
  leaf.position.set(DOOR[0] + 0.04, 0, dz)
  leaf.userData.openAngle = 1.5
  r.add(leaf)
  const lx = (x: number) => x - (DOOR[0] + 0.04)
  bx(k, leaf, [0, lx(DOOR[1] - 0.04)], [GFL, 2.7], [0, 0.05], c.surface('teak', 0.8, 2.1)).userData.front = true
  for (let y = GFL + 0.16; y < 2.66; y += 0.16) bx(k, leaf, [lx(DOOR[0] + 0.06), lx(DOOR[1] - 0.06)], [y - 0.004, y + 0.004], [0.05, 0.054], c.darkWood, false)
  bx(k, r, [DOOR[0], DOOR[0] + 0.04], [GFL, 2.74], [FACE - T, FACE - 0.02], c.darkWood)
  bx(k, r, [DOOR[1] - 0.04, DOOR[1]], [GFL, 2.74], [FACE - T, FACE - 0.02], c.darkWood)
  bx(k, r, [DOOR[0], DOOR[1]], [2.7, 2.74], [FACE - T, FACE - 0.02], c.darkWood)
  bx(k, leaf, [lx(-0.31), lx(-0.28)], [1.0, 2.25], [0.1, 0.125], c.aluminium)
  for (const y of [1.05, 2.2]) bx(k, leaf, [lx(-0.305), lx(-0.285)], [y - 0.01, y + 0.01], [0.05, 0.1], c.aluminium)

  // Entrance landing and three risers in white stone.
  bx(k, r, STEPS, [0, GFL], [FACE, -0.3], c.stepStone)
  bx(k, r, STEPS, [0, 0.41], [-0.3, 0], c.stepStone)
  bx(k, r, STEPS, [0, 0.2], [0, 0.3], c.stepStone)

  // Glazing.
  glazing(ctx, 'x', TALL, [1.27, 6.33], FACE - 0.1, { transoms: [3.825, 4.6], face: 0.065 })
  glazing(ctx, 'x', [-0.97, -0.26], [FFL, 5.72], FACE - 0.1)
  glazing(ctx, 'x', [0.28, 2.16], [FFL, 5.71], FACE - 0.1, { mullions: [1.22] })
  glazing(ctx, 'x', [0.72, 2.48], [1.34, 2.44], CAR_BACK - 0.1, { mullions: [1.31, 1.73] })
  for (const [a0, a1, y0, y1] of [BED_WINDOW, [-2.1, -0.95, 4.57, 5.97], [1.52, 2.67, 4.57, 5.97]])
    glazing(ctx, 'x', [a0, a1], [y0, y1], BACK + 0.1, { mullions: [(a0 + a1) / 2] })
  glazing(ctx, 'z', HALL_WINDOW, [1.31, 2.71], X0 + 0.1, { mullions: [(HALL_WINDOW[0] + HALL_WINDOW[1]) / 2] })
  glazing(ctx, 'z', [-8.57 - EXTRA, -7.9 - EXTRA], [5.2, 5.8], X0 + 0.1)
  glazing(ctx, 'z', [BATH_VENT[0], BATH_VENT[1]], [BATH_VENT[2], BATH_VENT[3]], X1 - 0.1)
  glazing(ctx, 'z', [KITCHEN_WINDOW.z0, KITCHEN_WINDOW.z1], [KITCHEN_WINDOW.y0, KITCHEN_WINDOW.y1], X0 + 0.1, { mullions: [(KITCHEN_WINDOW.z0 + KITCHEN_WINDOW.z1) / 2] })
  glazing(ctx, 'z', [BEDROOM2.z0 + BEDROOM2.window.z[0], BEDROOM2.z0 + BEDROOM2.window.z[1]], [FFL + BEDROOM2.window.h[0], FFL + BEDROOM2.window.h[1]], X1 - 0.1, { mullions: [BEDROOM2.z0 + (BEDROOM2.window.z[0] + BEDROOM2.window.z[1]) / 2] })
  glazing(ctx, 'z', [-3.81, -2.95], [5.0, 5.6], X1 - 0.1)

  // Sheers drawn to the sides, as in the reference.
  const inside = FACE - T - 0.1
  curtain(ctx, 'x', [TALL[0] + 0.03, TALL[0] + 0.3], [FFL + 0.02, FF_CEIL - 0.02], inside)
  curtain(ctx, 'x', [TALL[1] - 0.3, TALL[1] - 0.03], [FFL + 0.02, FF_CEIL - 0.02], inside)
  curtain(ctx, 'x', [-0.95, -0.72], [FFL + 0.02, FF_CEIL - 0.02], inside)
  curtain(ctx, 'x', [0.3, 0.62], [FFL + 0.02, FF_CEIL - 0.02], inside)
  curtain(ctx, 'x', [1.84, 2.14], [FFL + 0.02, FF_CEIL - 0.02], inside)
  // The stair runs behind the carport's window: obscured glass, on a panel at the stair side of the wall.
  bx(k, r, [0.72, 2.48], [1.34, 2.44], [CAR_BACK - T, CAR_BACK - T + 0.012], c.interior, false)

  // Warm rooms behind the glass: ceiling downlights and a low fill per room.
  for (const [x, z] of [[1.4, -6.6], [(CORRIDOR[0] + CORRIDOR[1]) / 2, -10.2]]) downlight(ctx, x, GF_CEIL - 0.01, z)
  for (const [x, z] of [[-2.2, -3.2], [-0.6, -3.4], [1.2, -3.4], [1.2, -5.4]]) downlight(ctx, x, FF_CEIL, z)
  plate(k, [X0 + T, X1 - T], [GF_CEIL - 0.01, GF_CEIL], [BACK + T, FACE - T], c.room, false)
  bx(k, r, [X0 + T, X1 - T], [FF_CEIL - 0.01, FF_CEIL], [-7.0 - EXTRA, FACE - T], c.room, false)
  lamp(ctx, -2.0, 3.1, -4.2, 6, 7, 0.6)
  lamp(ctx, 1.4, 3.1, -6.6, 4, 5, 0.6)
  lamp(ctx, -2.0, 6.0, -4.0, 5, 6, 0.6)
  lamp(ctx, 1.0, 6.0, -4.2, 6, 7, 0.6)
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
