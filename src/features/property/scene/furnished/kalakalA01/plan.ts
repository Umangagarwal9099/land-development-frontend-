import type { Point2 } from '../../../../../api/types'

/*
 * Commercial Plot A-01, Kallakal: 166′1″ of frontage (north → south) × 165′5″ deep (west → east),
 * 3,022 sq yd, facing east onto the HMDA master plan road on NH-44, with the 33 ft cross road
 * behind it and Plot A-02 (Prime Mall) to the south.
 *
 * Site frame, as for D-65 and the mall: +z east (the road), +x north, y up, origin at the plot
 * centre. The reference design is fitted to the plot like this:
 *
 *   a G+2 ring of curved glass pavilions round a circular fountain plaza that opens east to the
 *   road: the south wing ends in a rounded white wall; the centre wing, with the main entrance,
 *   carries a cantilevered roof; the north wing stands behind a white wall that sweeps up out of
 *   the plaza, pierced by two arches. Three black mesh "capsules" with round openings, grown over
 *   with creepers, rise over the south wing, the centre and (the tallest) the north wing.
 *
 *   ring:     centred on the plaza at P, glass lines at radius 10.5 (plaza side) and 18.5
 *   setbacks: south 9.3 m (the drive and visitor bays), north 4.3 m (fire walk), rear 7.2 m
 *   levels:   ground +0.15 (the plaza), first +5.15, second +9.35, roof +13.55
 *             (5.0 / 4.2 / 4.2 m floor to floor); north capsule to +23.4
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

/** Centre of the plaza and of the ring of buildings round it. */
export const P = { x: 2.5, z: 0.5 }
/** Glass lines of the ring: the plaza side and the outside. */
export const R_IN = 10.5
export const R_OUT = 18.5
/** Slab edges stand this far proud of the glass. */
export const NOSE = 0.3

/** Floor levels; slabs are SLAB deep below each. */
export const GL = 0.15
export const L1 = 5.15
export const L2 = 9.35
export const ROOF = 13.55
export const SLAB = 0.55
export const LEVELS = [GL, L1, L2] as const

/**
 * Angles round P in degrees: 0 is east (towards the road), −90 south, −180 west. The ring runs
 * from the south wing's tip at −62° round the west to the north wing's tip at −296° (+64°).
 */
export const SOUTH = { t0: -128, t1: -62 }
/** Centre and north wings are one building; the centre is the part between the white wall and the gap. */
export const MAIN = { t0: -296, t1: -140 }
export const CENTRE = { t0: -212, t1: -140 }
/** The white wall in front of the north wing, its foot rising out of the plaza at the centre's edge. */
export const WALL = { t0: -295, t1: -212, r: R_IN - 1.8, rise: -240, thick: 0.38 }
/** The main entrance, on the centre wing's axis. */
export const ENTRY_T = -180

/** The fountain's rings, and the outer rings of the paving, which run on under the wings and out into the forecourt. */
export const PLAZA_R = 8.6
export const PAVED_R = 15.4

/** The south drive (asphalt), its parallel visitor bays, and the covered ramp to the basement. */
export const DRIVE = { x0: PLOT.x0 + 0.23, x1: -19.6 }
export const BAYS = { x0: -19.6, x1: -17.1, z0: -12.4, z1: 12.8 }
export const RAMP = { x0: -14, x1: 5, z0: -24.85, z1: -19.4, h: 3.3 }
export const YARD = { x0: 9, x1: PLOT.x1 - 0.23, z0: PLOT.z0 + 0.23, z1: -18.6 }

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
  { t: -256, half: 1.3, spring: 2.5 },
  { t: -280, half: 1.3, spring: 2.5 },
] as const
