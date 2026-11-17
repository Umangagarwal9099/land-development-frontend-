import type { Point2 } from '../../../../../api/types'

/*
 * The Kallakal clubhouse: 3,678.19 sq yd, 150′ (S) × 150′3.6″ (N) × 215′3.6″ (W) × 225′10.8″ (E),
 * entered from the south. The south edge is square to the plan; the east side runs 10′7″ deeper
 * than the west, so the north edge falls slightly from west to east.
 *
 * Site frame: +x east, +z south (towards the entrance road), y up; origin on the plot's centre line.
 *
 * The building is the client's reference, measured from the aerial and the south elevation:
 *
 *   A   the entrance block: a 34 m east–west bar of glass-walled wings under terracotta gable
 *       roofs, crossed by a gable of the same height and pitch (10 m across the fascia) that runs
 *       from the bar's ridge to a laterite entrance portal 8.15 m proud of its front: a gable wall
 *       of laterite block on two piers, pierced by a segmental arch. Both 50°.
 *   B   the west pavilion (44°): laterite outside, full-height glass to the courtyard.
 *   D   the east pavilion (52°). Both stand free, 3 m behind the bar, as separate buildings.
 *
 *   All four share the north block's height: eaves 4.5 m, ridges 10.5 m (see EAVE, RIDGE).
 *   C   the north block, as long as the bar (34 m), with a 2.5 m verandah on timber posts facing
 *       the courtyard.
 *
 * The four enclose a landscaped courtyard. In front of the portal a kerbed island carries a
 * charcoal planter with a clipped hedge, tropical foliage behind it and a tall conifer at each end;
 * the forecourt round it is laid in grey circle-and-fan pavers.
 */

export const FT = 0.3048

/** Plot corners: SW, SE, NE, NW. */
const W = 150 * FT
/** The plot's south edge on the avenue: a narrow strip of forecourt in front of the island, as in the aerial. */
export const Z_SOUTH = 26.9
const DEPTH_W = (215 + 3.6 / 12) * FT
const DEPTH_E = (225 + 10.8 / 12) * FT
export const PLOT: Point2[] = [
  [-W / 2, Z_SOUTH],
  [W / 2, Z_SOUTH],
  [W / 2, Z_SOUTH - DEPTH_E],
  [-W / 2, Z_SOUTH - DEPTH_W],
]
export const PLOT_X = { x0: -W / 2, x1: W / 2 }
/** The north boundary's z at x. */
export const northZ = (x: number) => Z_SOUTH - DEPTH_W - ((x + W / 2) / W) * (DEPTH_E - DEPTH_W)

/** Finished floor level inside, and the courtyard's level. */
export const FFL = 0.3
export const YARD_Y = 0.15

/* ---------- roof geometry ---------- */

/** A gable roof's top-of-tile plane: y = ridge − t · (horizontal distance from the ridge). */
export interface Gable {
  /** 'x' when the ridge runs east–west. */
  axis: 'x' | 'z'
  /** The ridge line's position across the roof (z for an 'x' ridge, x for a 'z' ridge). */
  at: number
  ridge: number
  /** tan(pitch). */
  t: number
  /** Vertical thickness of the roof slab, which shows as the white fascia on every edge. */
  thick: number
}

/**
 * All four buildings stand to one height, the north block's: the tiles at the eave fascias at
 * EAVE, every ridge at RIDGE. Each roof's pitch follows from its own span (fascia to ridge,
 * `half` metres), so the wider pavilion is a little shallower and the narrower one steeper.
 */
export const EAVE = 4.5
export const RIDGE = 10.5
/** Roof slabs are 300 mm thick across the slope. */
const gable = (axis: 'x' | 'z', at: number, half: number): Gable => {
  const t = (RIDGE - EAVE) / half
  return { axis, at, ridge: RIDGE, t, thick: 0.3 * Math.hypot(1, t) }
}

/** The bar's wings. */
export const A = {
  x0: -17, x1: 17, z0: -1.75, z1: 6.75,
  /** Fascia: eaves 0.75 m beyond the walls, gables 0.6 m. */
  fx: 17.6,
  roof: gable('x', 2.5, 5),
}
export const A_EAVE = 5.0

/**
 * The front block's gables lean out at the top, a prow, as the side views show: the fascia stands
 * 0.6 m off the wall at the eave corners and this much further out at the ridge, so a deep white
 * soffit opens under each gable, widest at the apex. On the wings' ends and the portal's front.
 */
export const PROW = 3
/** The entrance gable across the bar, and its portal. */
export const P = {
  /** Walls of the portal: the laterite piers' outer faces and the front wall. */
  hw: 4.25,
  front: 14.9,
  /** Fascia: 0.75 m beyond the side walls; in front, 0.6 m at the eave corners (8 m out from the wings' eave), the apex PROW further. */
  fw: 5.0,
  ffront: 15.5,
  roof: gable('z', 0, 5),
  /** The arch: half its span, the springing and the crown. */
  arch: { half: 3.1, spring: 4.5, crown: 5.25 },
  /** The lobby under the gable has a taller ceiling than the wings. */
  lobbyCeiling: 5.1,
}

/** The pavilions stand free of the bar, this far behind its back wall: lawn between, eaves clear of each other. */
export const GAP = 3

/** West pavilion. */
export const B = {
  x0: -14, x1: -3, z0: -14.5, z1: A.z0 - GAP,
  roof: gable('z', -8.5, 6.25),
  eave: 6.25,
}
/** East pavilion. */
export const D = {
  x0: 6.5, x1: 14.5, z0: -13, z1: A.z0 - GAP,
  roof: gable('z', 10.5, 4.75),
  eave: 4.75,
}
/** North block, its verandah on the courtyard side. */
export const C = {
  /** As long as the front block: its ends line up with the bar's. */
  x0: A.x0, x1: A.x1, z0: -28, z1: -17.5,
  /** The glass wall behind the verandah. */
  glass: -20,
  roof: gable('x', -22.75, 6),
  eave: 6.0,
}
/** Gable overhang at the open ends of B, C and D. */
export const GABLE_OUT = 0.6

/** The courtyard between them. */
export const YARD = { x0: B.x1, x1: D.x0, z0: C.z1, z1: A.z0 }

/** Height of a gable's top surface at a plan point. */
export function roofY(g: Gable, x: number, z: number) {
  const d = Math.abs(g.axis === 'x' ? z - g.at : x - g.at)
  return g.ridge - g.t * d
}
/** Underside of the roof slab where it crosses a wall `d` metres from the ridge: the wall plate. */
export const plate = (g: Gable, d: number) => g.ridge - g.t * d - g.thick

/**
 * Where the entrance gable's slopes meet the bar's: |x| at which the two planes are level, for a
 * point `dz` metres from the bar's ridge. The valleys run straight from the ridge to the eave corners.
 */
export const valleyX = (dz: number) => (P.roof.ridge - A.roof.ridge + A.roof.t * Math.abs(dz)) / P.roof.t

/* ---------- the forecourt ---------- */

/** The kerbed island in front of the portal: the footpath and, behind it, the planter. */
export const ISLAND = {
  /** The footpath's rounded ends. */
  x: 9.9,
  z0: 18.9,
  z1: 21.1,
  kerbH: 0.16,
  planter: { x: 9.5, z0: 17.4, z1: 18.9, h: 0.6 },
  /** The hedge runs between the conifers, which stand in the planter's ends. */
  hedge: 7.75,
  trees: 8.65,
}

/** Interior ceilings: each block's wall plate. */
export const CEIL = {
  wings: plate(A.roof, A.z1 - A.roof.at),
  b: plate(B.roof, B.roof.at - B.x0),
  d: plate(D.roof, D.x1 - D.roof.at),
  c: plate(C.roof, C.roof.at - C.z0),
}

/** The west drive past the building, where cars stand, and the east garden path. */
export const DRIVE = { x0: PLOT_X.x0 + 0.3, x1: A.x0 - 1.4 }
export const PATH = { x0: 18.9, x1: 20.4 }
