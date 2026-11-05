import type { Point2 } from '../../../../../api/types'

/*
 * Kallakal Hotel on commercial Plot A-04, Kallakal: 124′3″ of frontage (north → south) × 340′7″
 * deep (west → east), 4,676 sq yd, facing east onto the HMDA master plan road on NH-44, with the
 * 33 ft cross road behind it, Plot A-03 to the north and the site boundary to the south.
 *
 * Site frame, as for D-65 and the mall: +z east (the road), +x north, y up, origin at the plot
 * centre. The reference design is fitted to the plot like this:
 *
 *   a G+2 ring of curved glass pavilions round a circular plaza that opens east to the
 *   road: the south wing ends in a rounded white wall; the centre wing, with the main entrance,
 *   carries a cantilevered roof; the north wing stands behind a white wall that sweeps up out of
 *   the plaza, pierced by two arches. Three black mesh "capsules" with round openings, grown over
 *   with creepers, rise over the south wing, the centre and (the tallest) the north wing.
 *
 *   The plot is narrow and deep, so the ring stands at the front, scaled to its frontage, and
 *   the guests' car park fills the depth behind it. Traffic runs one way round the plot: in by
 *   the entry road down the south side, through the car park, and out by the exit road up the
 *   north side to the HMDA road. The back is walled along its full width: no way through to the
 *   cross road behind. To make room for the exit road the ring's wings are 0.8 m shallower than
 *   first drawn and the ring stands 1.9 m further south.
 *
 *   ring:     centred on the plaza at P, glass lines at radius 8.2 (plaza side) and 13.5
 *   rear wing: 18 m wide behind the centre, G+3, guest rooms either side of a corridor
 *   setbacks: south 5.2 m (the 4.6 m entry road), north 5.0 m (the 4.4 m exit road), front
 *             10 m (forecourt)
 *   levels:   ground +0.15 (lobby and restaurant), first +5.15, second +8.75, roof +12.35
 *             (5.0 / 3.6 / 3.6 m floor to floor, guest rooms above); the rear wing's third
 *             floor at +12.35 and its roof at +15.95; north capsule to +23
 *   behind:   a car park of four rows of bays on two aisles and the entry road, 44 bays, with
 *             the utility yard and a planted strip against the back wall
 */

export const FT = 0.3048

/** The plot: 124′3″ along the road × 340′7″ deep, as the plan's plot table gives it. */
export const PLOT = { x0: (-124 - 3 / 12) * FT * 0.5, x1: (124 + 3 / 12) * FT * 0.5, z0: (-340 - 7 / 12) * FT * 0.5, z1: (340 + 7 / 12) * FT * 0.5 }

/**
 * The layout plan draws the plot's road edge along the HMDA road, which runs at a skew to the
 * layout grid: at depth z = FRONTAGE_Z(x). The master plan trims the forecourt to it.
 */
export const FRONTAGE = { c: 51.21, k: -0.3636 }
export const FRONTAGE_Z = (x: number) => FRONTAGE.c + FRONTAGE.k * x
/** Where the plan's plot polygon centre (the mean of its corners) sits in this frame. */
export const PLAN_CENTRE_Z = (2 * PLOT.z0 + FRONTAGE_Z(PLOT.x0) + FRONTAGE_Z(PLOT.x1)) / 4

/** Centre of the plaza and of the ring of buildings round it. */
export const P = { x: 0.1, z: 30 }
/** Glass lines of the ring: the plaza side and the outside. */
export const R_IN = 8.2
export const R_OUT = 13.5
/** The wing's depth, glass to glass: what fittings inside are placed by. */
export const DEPTH = R_OUT - R_IN
/** Slab edges stand this far proud of the glass. */
export const NOSE = 0.3

/** Floor levels; slabs are SLAB deep below each. */
export const GL = 0.15
export const L1 = 5.15
export const L2 = 8.75
export const ROOF = 12.35
export const SLAB = 0.5
export const LEVELS = [GL, L1, L2] as const
/** The rear wing rises a floor above the ring: its third floor is at the ring's roof. */
export const L3 = ROOF
export const ROOF_B = ROOF + 3.6

/**
 * The rear wing: guest rooms behind the centre, 18 m wide on the plaza's axis, its front following
 * the ring's outer glass and its back end a half circle. Plan: x0..x1 across, the half circle's
 * centre at zc.
 */
export const ANNEX = { x0: P.x - 9, x1: P.x + 9, zc: 5 }

/**
 * Angles round P in degrees: 0 is east (towards the road), −90 south, −180 west. The ring runs
 * from the south wing's tip at −62° round the west to the north wing's tip at −296° (+64°).
 */
export const SOUTH = { t0: -128, t1: -62 }
/** Centre and north wings are one building; the centre is the part between the white wall and the gap. */
export const MAIN = { t0: -296, t1: -140 }
export const CENTRE = { t0: -212, t1: -140 }
/** The white wall in front of the north wing, its foot rising out of the plaza at the centre's edge. */
export const WALL = { t0: -295, t1: -212, r: R_IN - 1.5, rise: -240, thick: 0.34 }
/** The main entrance, on the centre wing's axis. */
export const ENTRY_T = -180
/** How far the centre's roof runs out over the plaza. */
export const CANTILEVER = 1.8

/** The plaza's rings, and the outer rings of the paving, which run on under the wings and out into the forecourt. */
export const PLAZA_R = 6.4
export const PAVED_R = 11.5

/** The entry road down the south side, one way from the HMDA road to the car park. */
export const DRIVE = { x0: PLOT.x0 + 0.23, x1: PLOT.x0 + 0.23 + 4.6 }
/** The exit road up the north side, one way from the car park out to the HMDA road. */
export const EXIT = { x0: 14.3, x1: PLOT.x1 - 0.23 }
/** The car park: rows of 2.5 × 5 m bays between the drive and two aisles, between two cross aisles. */
export const PARK = {
  z0: -40,
  z1: -10,
  /** Cross aisles at the back and the front of the car park. */
  back: [-46, -40] as [number, number],
  front: [-10, -4] as [number, number],
  /** Rows of bays (x ranges) and which way their cars face (+1 north, −1 south). */
  rows: [[-13.2, -8.2, -1], [-8.2, -3.2, 1], [2.8, 7.8, -1], [7.8, 12.8, 1]] as [number, number, 1 | -1][],
  aisles: [[-3.2, 2.8], [12.8, PLOT.x1 - 0.23]] as [number, number][],
}
export const YARD = { x0: 6, x1: PLOT.x1 - 0.23, z0: PLOT.z0 + 0.23, z1: -46.5 }

const D = Math.PI / 180

/** A plan point at angle `t` (degrees) and radius `r` from P. */
export const polar = (t: number, r: number): Point2 => [P.x + r * Math.sin(t * D), P.z + r * Math.cos(t * D)]
/** Unit vector away from P at angle t. */
export const radial = (t: number): Point2 => [Math.sin(t * D), Math.cos(t * D)]
/** Unit vector along increasing t. */
export const tangent = (t: number): Point2 => [Math.cos(t * D), -Math.sin(t * D)]
/** Arc length per degree at radius r. */
export const perDeg = (r: number) => r * D

/**
 * A wing's plan between angles t0 < t1 and radii rIn..rOut, its ends either rounded (a half
 * circle across the wing) or square, sampled every `step` metres along the arcs.
 */
export function wingOutline(t0: number, t1: number, rIn: number, rOut: number, round: { start: boolean; end: boolean }, step = 0.4): Point2[] {
  const out: Point2[] = []
  const arc = (r: number, a: number, b: number) => {
    const n = Math.max(2, Math.ceil(Math.abs(b - a) * perDeg(r) / step))
    for (let i = 0; i <= n; i++) out.push(polar(a + ((b - a) * i) / n, r))
  }
  const cap = (t: number, dir: 1 | -1, fromInner: boolean) => {
    const rm = (rIn + rOut) / 2
    const a = (rOut - rIn) / 2
    const [cx, cz] = polar(t, rm)
    const [nx, nz] = radial(t)
    const [tx, tz] = tangent(t)
    const n = 18
    for (let i = 1; i < n; i++) {
      const f = (i / n) * Math.PI
      const sgnN = fromInner ? -Math.cos(f) : Math.cos(f)
      out.push([cx + a * (sgnN * nx + dir * Math.sin(f) * tx), cz + a * (sgnN * nz + dir * Math.sin(f) * tz)])
    }
  }
  arc(rIn, t0, t1)
  if (round.end) cap(t1, 1, true)
  arc(rOut, t1, t0)
  if (round.start) cap(t0, -1, false)
  return out
}

/** The south wing (rounded at its tip) and the main building (rounded at the north tip). */
export const southOutline = (grow = 0, step = 0.4) => wingOutline(SOUTH.t0, SOUTH.t1, R_IN - grow, R_OUT + grow, { start: false, end: true }, step)
export const mainOutline = (grow = 0, step = 0.4) => wingOutline(MAIN.t0, MAIN.t1, R_IN - grow, R_OUT + grow, { start: true, end: false }, step)

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

/** Top of the white wall at angle t: low at the centre's edge, sweeping up to the first floor. */
export function wallTop(t: number) {
  const low = 0.95
  const high = L1 + 0.35
  if (t <= WALL.rise) return high
  const u = Math.min(1, (t - WALL.rise) / (WALL.t1 - WALL.rise))
  // A quarter ellipse: level where it leaves the plaza, vertical where it meets the first floor.
  return low + (high - low) * (1 - Math.sqrt(1 - (1 - u) ** 2))
}

/** The two arches through the white wall: centre angle, half-width and spring height (m). */
export const ARCHES = [
  { t: -256, half: 1.1, spring: 2.4 },
  { t: -280, half: 1.1, spring: 2.4 },
] as const
