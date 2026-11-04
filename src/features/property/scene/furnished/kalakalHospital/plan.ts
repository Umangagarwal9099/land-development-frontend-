import type { Point2 } from '../../../../../api/types'

/*
 * Commercial Plot A-03, Kallakal: 125′ of frontage (north → south) × 294′6″ deep (west → east),
 * 4,090 sq yd, facing east onto the HMDA master plan road on NH-44. The 60 ft main avenue runs
 * along its north side (it is a corner plot), the 33 ft cross road behind it, and Plot A-04
 * (Kallakal Hotel) lies to the south.
 *
 * Site frame, as for the other Kallakal designs: +z east (the road), +x north, y up, origin at
 * the plot centre. The reference hospital, built here as B2 + G + 3, is far longer along its front than the
 * plot's 38 m of frontage allows, so its front elevation is kept piece for piece but closed up,
 * and the building runs back into the depth of the plot instead:
 *
 *   left to right from the road (south to north): a white tower with a grid of punched windows
 *   and the outpatient entrance at its foot; a lower, fully glazed link, set back; the main block,
 *   a curtain wall held in a deep white frame whose top band carries the blue cross and the name,
 *   with a porte-cochère over the drop-off in front of the main entrance; and the end of the north
 *   wing, white bands and ribbon glazing. The north wing's long side, the same white bands, runs
 *   back along the exit road, as the reference's right-hand wing recedes, with the emergency
 *   entrance halfway along it: a drive-through ambulance bay under a canopy that spans the road. Behind the fronts the wards are one deep block
 *   round a light court that opens from the second floor up, over a podium garden.
 *
 *   body:     25.7 m along the road × 41 m deep; south setback 7.25 m (the entry drive), north
 *             5.15 m (the exit road), rear 18.9 m (basement ramp, parking and the utility yard),
 *             front to the road 30 m at the main block (drop-off lane and the garden)
 *   traffic:  one way round. In from the HMDA road by the drive down the south side, either along
 *             the drop-off lane in front or on to the back; out by the exit road down the north side
 *             to the road again. The back is walled off from the cross road: no gate, no way through.
 *   levels:   ground +0.15 (4.8 m: lobby, outpatients, emergency), three floors at 4.2 m from +4.95,
 *             roof +17.55, parapet +18.75, the main block's frame to +20.25
 */

export const FT = 0.3048

/** The plot: 125′ along the road × 294′6″ deep, as the plan's plot table gives it. */
export const PLOT = { x0: -125 * FT * 0.5, x1: 125 * FT * 0.5, z0: (-294 - 6 / 12) * FT * 0.5, z1: (294 + 6 / 12) * FT * 0.5 }

/**
 * The layout plan draws the plot's road edge along the HMDA road, which runs at a skew to the
 * layout grid: at depth z = FRONTAGE_Z(x). The master plan trims the forecourt to it.
 */
export const FRONTAGE = { c: 44.42, k: -0.3636 }
export const FRONTAGE_Z = (x: number) => FRONTAGE.c + FRONTAGE.k * x
/** Where the plan's plot polygon centre (the mean of its corners) sits in this frame. */
export const PLAN_CENTRE_Z = (2 * PLOT.z0 + FRONTAGE_Z(PLOT.x0) + FRONTAGE_Z(PLOT.x1)) / 4
export const WALL_T = 0.23

/** Floor levels: ground, then three upper floors 4.2 m apart; the roof, and the top of the parapet. */
export const GL = 0.15
export const FLOOR = 4.2
export const L1 = 4.95
export const UPPER = Array.from({ length: 3 }, (_, i) => L1 + i * FLOOR)
export const ROOF = L1 + UPPER.length * FLOOR
export const PARAPET = ROOF + 1.2
/** Every storey as [floor, next floor]: the ground floor's is 4.8 m. */
export const STOREYS: [number, number][] = [[GL, L1], ...UPPER.map((y): [number, number] => [y, y + FLOOR])]

/** The ward block behind the fronts: its sides and back. */
export const BODY = { x0: -11.8, x1: 13.9, z0: -26 }
/** Where the fronts meet it: the link stands in front of this line, the body rising behind it. */
export const BACK_Z = 4
/** The south tower, punched windows, the outpatient entrance at its foot. */
export const TOWER = { x0: BODY.x0, x1: -2.4, z1: 12 }
/** The glazed link, G + 2, set back between the tower and the main block. */
export const LINK = { x0: TOWER.x1, x1: 0.6, z1: 9, roof: UPPER[2], top: UPPER[2] + 0.9 }
/**
 * The main block: its frame's face, the curtain wall set back inside it, the lobby's glass set back
 * further under the canopy, the frame's piers, and the band across its top that carries the name.
 */
export const MAIN = { x0: LINK.x1, x1: 11.6, z1: 15, glass: 14.3, lobby: 13.0, pier: 1.4, band: [ROOF - 0.6, PARAPET + 1.5] as [number, number] }
/** The end of the north wing, ribbon glazing, the red cross over its foot. */
export const WING = { x0: MAIN.x1, x1: BODY.x1, z1: 11 }
/** The light court, open from the second floor (its podium garden) to the sky. */
export const COURT = { x0: -4.5, x1: 7.5, z0: -18, z1: -6, floor: UPPER[1] }

/** The entry drive along the south boundary, one way in from the road; the drop-off lane off it. */
export const DRIVE = { x0: PLOT.x0 + WALL_T, x1: -13.2 }
export const LANE = { z0: 18, z1: 24.5 }
/** The exit road along the north side, one way out to the road, and the verge between it and the wall. */
export const EXIT = { x0: BODY.x1 + 0.3, x1: PLOT.x1 - WALL_T - 0.4 }

/** The porte-cochère over the drop-off. */
export const CANOPY = { x0: -1.2, x1: 11.4, z0: MAIN.lobby, z1: 26, y0: 4.25, y1: 4.9, columns: [0.0, 4.2, 9.6], colZ: 25.3 }
/**
 * The emergency entrance, in the wing's north side: a canopy over the exit road from the building
 * to the verge, the ambulance bay under it (ambulances drive through, nose to the road), the doors
 * at `door` along the side.
 */
export const ER = { x0: BODY.x1, x1: PLOT.x1 - WALL_T - 0.02, z0: -4, z1: 6, y0: 4.1, y1: 4.7, door: 1 }
/** The garden between the lane and the road, and the entrance walk across it on the main doors' axis. */
export const GARDEN = { x0: DRIVE.x1, x1: EXIT.x0, z0: LANE.z1 }
export const WALK = { x0: 4.9, x1: 7.3 }

/**
 * Behind the body: the covered ramp down to the basements, from the drive northwards; a service
 * court beyond its mouth; a row of parking bays along the back wall; the utility yard beside them
 * (oxygen, transformer, generator); and the aisle between them and the ramp, which carries the
 * traffic round from the entry drive to the exit road.
 */
export const RAMP = { x0: DRIVE.x1, x1: 4.8, z0: -34, z1: -28, h: 2.9 }
export const PARK = { x0: -12.9, bays: 7, bay: 2.5, z0: PLOT.z0 + WALL_T, z1: PLOT.z0 + WALL_T + 5 }
export const YARD = { x0: 4.8, x1: EXIT.x0 - 0.3, z0: PLOT.z0 + WALL_T, z1: PARK.z1 }

/** The body's outline at its full height (the link, lower, is left out), and grown by `grow`. */
export function outline(grow = 0): Point2[] {
  const g = grow
  return [
    [BODY.x0 - g, BODY.z0 - g],
    [BODY.x1 + g, BODY.z0 - g],
    [BODY.x1 + g, WING.z1 + g],
    [MAIN.x1 + g, WING.z1 + g],
    [MAIN.x1 + g, MAIN.z1 + g],
    [MAIN.x0 - g, MAIN.z1 + g],
    [MAIN.x0 - g, BACK_Z - g],
    [TOWER.x1 + g, BACK_Z - g],
    [TOWER.x1 + g, TOWER.z1 + g],
    [BODY.x0 - g, TOWER.z1 + g],
  ]
}

/** The whole footprint at the ground, the link included. */
export function footprint(grow = 0): Point2[] {
  const g = grow
  return [
    [BODY.x0 - g, BODY.z0 - g],
    [BODY.x1 + g, BODY.z0 - g],
    [BODY.x1 + g, WING.z1 + g],
    [MAIN.x1 + g, WING.z1 + g],
    [MAIN.x1 + g, MAIN.z1 + g],
    [MAIN.x0 - g, MAIN.z1 + g],
    [MAIN.x0 - g, LINK.z1 + g],
    [TOWER.x1 + g, LINK.z1 + g],
    [TOWER.x1 + g, TOWER.z1 + g],
    [BODY.x0 - g, TOWER.z1 + g],
  ]
}

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
