import type { Point2 } from '../../../../../api/types'

/*
 * Commercial Plot A-01, Kallakal: 166′1″ of frontage (north → south) × 165′5″ deep (west → east),
 * 3,022 sq yd, facing east onto the HMDA master plan road on NH-44, with the 33 ft cross road
 * behind it and Plot A-02 (Kallakal Mall) to the south.
 *
 * Site frame, as for the mall and the hotel: +z east (the road), +x north, y up, origin at the
 * plot centre. The reference design, a multi-storey car park with shops below, is fitted to the
 * plot like this:
 *
 *   a long G+3 block parallel to the road, its three parking decks screened in vertical timber
 *   slats hung in staggered panels between grey slab edges, with dark storefronts below. A fully
 *   glazed drum holding the helical ramp stands proud of the front, under a deep black crown with
 *   black returns either side; the main entrance is at its foot. A cream stair tower and a dark
 *   lift core close the north end of the front, the stair's end wall glazed.
 *
 *   block:    38.8 m along the road × 17.2 m deep; south setback 6.7 m (the entry drive), north
 *             5.1 m (the exit road), rear 12.8 m (the connector and the yard), front 20.4 m (the
 *             forecourt)
 *   traffic:  one way round the block. In from the HMDA road down the drive on the south side,
 *             past the vehicle portals, along the connector behind the block and out by the exit
 *             road on the north side. The back is walled the full width of the plot: nothing
 *             opens onto the cross road.
 *   drum:     7.4 m radius, centred 1.8 m in front of the block's face, so it stands 9.2 m proud
 *   levels:   ground +0.15 (shops), decks +4.35, +7.55, +10.75, roof +13.95, parapet +15.15;
 *             the drum's crown to +16.75
 */

export const FT = 0.3048

/** The plot: 166′1″ along the road × 165′5″ deep, as the plan's plot table gives it. */
export const PLOT = { x0: (-166 - 1 / 12) * FT * 0.5, x1: (166 + 1 / 12) * FT * 0.5, z0: (-165 - 5 / 12) * FT * 0.5, z1: (165 + 5 / 12) * FT * 0.5 }

/**
 * The layout plan draws the plot's road edge along the HMDA road, which runs at a skew to the
 * layout grid: at depth z = FRONTAGE_Z(x). The master plan trims the forecourt to it.
 */
export const FRONTAGE_Z = (x: number) => 24.66 - 0.3636 * x
/** Where the plan's plot polygon centre (the mean of its corners) sits in this frame. */
export const PLAN_CENTRE_Z = (2 * PLOT.z0 + FRONTAGE_Z(PLOT.x0) + FRONTAGE_Z(PLOT.x1)) / 4

/** The block's footprint, to the face of its slab edges. */
export const BLOCK = { x0: -18.6, x1: 20.2, z0: -12.4, z1: 4.8 }

/** Floor levels: ground, the three parking decks, the roof, and the top of the parapet. */
export const GL = 0.15
export const L1 = 4.35
export const L2 = 7.55
export const L3 = 10.75
export const ROOF = 13.95
export const PARAPET = 15.15
/** Slab edges: this deep below each level, and a little proud above it. */
export const SLAB = 0.3

/** The glazed ramp drum: centre, glass radius, and its crown. */
export const DRUM = { x: -5.6, z: 6.6, r: 7.4, crown0: PARAPET, crown1: 16.75 }
/**
 * Angles round the drum in degrees: 0 is east (the road), +90 north, −90 south. The glass runs
 * between ±GLASS_T; black returns run on from there to where the drum meets the block's face.
 */
export const GLASS_T = 88
export const MEET_T = (Math.acos((BLOCK.z1 - DRUM.z) / DRUM.r) * 180) / Math.PI
/** The entrance doors, on the chord of the glass either side of the drum's axis. */
export const DOOR_T = 14
/** The black returns run this far along the block's face from where the drum meets it. */
export const RETURN = 1.2

/** The stair tower (cream render, its north end glazed) and the dark lift core beside it. */
export const STAIR = { x0: BLOCK.x1 - 3.2, x1: BLOCK.x1, z0: -1.6, z1: BLOCK.z1 + 0.5, top: 16.2 }
export const LIFT = { x0: 16.6, x1: STAIR.x0, z0: 1.4, z1: BLOCK.z1 + 0.3, top: 15.9 }

/** The entry drive along the south boundary, one way in, and the vehicle portals in the block's south end. */
export const DRIVE = { x0: PLOT.x0 + 0.23, x1: -19.3 }
export const PORTALS = [
  { z0: -9.5, z1: -5.9, label: 'in' },
  { z0: -5.3, z1: -1.7, label: 'out' },
] as const
export const PORTAL_H = 2.75
/**
 * The exit road along the north boundary, one way out to the HMDA road: its carriageway from the
 * kerb by the block to the compound wall.
 */
export const EXIT = { x0: BLOCK.x1 + 0.65, x1: PLOT.x1 - 0.23 }
/** The connector behind the block, from the entry drive across to the exit road, past the service doors. */
export const COURT_REAR = { x0: DRIVE.x0, x1: EXIT.x1, z0: -20.3, z1: BLOCK.z0 - 1.4 }
/** The substation and generator yard, behind the connector against the back wall. */
export const YARD = { x0: 11, x1: PLOT.x1 - 0.23, z0: PLOT.z0 + 0.23, z1: COURT_REAR.z0 }

/** The forecourt: paving between the entry drive and the exit road, with two lawns either side of the entrance walk. */
export const FORE = { x0: DRIVE.x1 + 0.15, x1: EXIT.x0 - 0.15 }
export const LAWNS = [
  { x0: -18.2, x1: -11.2, z0: 15.8, z1: 22.2 },
  { x0: 3.4, x1: EXIT.x0 - 0.6, z0: 12.8, z1: 22.2 },
] as const

const D = Math.PI / 180

/** A plan point at angle `t` (degrees) and radius `r` from the drum's centre. */
export const polar = (t: number, r: number): Point2 => [DRUM.x + r * Math.sin(t * D), DRUM.z + r * Math.cos(t * D)]
/** Unit vector away from the drum's centre at angle t. */
export const radial = (t: number): Point2 => [Math.sin(t * D), Math.cos(t * D)]
/** Arc length per degree at radius r. */
export const perDeg = (r: number) => r * D

/** Where the drum meets the block's face, either side. */
export const MEET_X = { south: polar(-MEET_T, DRUM.r)[0], north: polar(MEET_T, DRUM.r)[0] }

/** A circle as a plan polygon. */
export const circle = (cx: number, cz: number, r: number, n = 96): Point2[] =>
  Array.from({ length: n }, (_, i) => [cx + r * Math.cos((i / n) * Math.PI * 2), cz + r * Math.sin((i / n) * Math.PI * 2)] as Point2)

/** Keeps the part of a polygon where a·x + b·z + c ≥ 0 (Sutherland–Hodgman against one edge). */
export function clipHalf(poly: Point2[], a: number, b: number, c: number): Point2[] {
  const out: Point2[] = []
  const f = ([x, z]: Point2) => a * x + b * z + c
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]
    const q = poly[(i + 1) % poly.length]
    const fp = f(p)
    const fq = f(q)
    if (fp >= 0) out.push(p)
    if (fp >= 0 !== fq >= 0) {
      const t = fp / (fp - fq)
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t])
    }
  }
  return out
}

/** The block and drum together in plan, `grow` beyond their faces: the roof, and the shade round the foot. */
export function footprint(grow = 0, step = 3): Point2[] {
  const { x0, x1, z0, z1 } = BLOCK
  const out: Point2[] = [[x0 - grow, z0 - grow], [x1 + grow, z0 - grow], [x1 + grow, z1 + grow]]
  // Along the face to the drum, round its front, and back along the face.
  const tm = (Math.acos((z1 + grow - DRUM.z) / (DRUM.r + grow)) * 180) / Math.PI
  for (let t = tm; t >= -tm; t -= step) out.push(polar(t, DRUM.r + grow))
  out.push(polar(-tm, DRUM.r + grow), [x0 - grow, z1 + grow])
  return out
}
