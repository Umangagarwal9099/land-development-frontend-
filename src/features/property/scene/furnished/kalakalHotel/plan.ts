import type { Point2 } from '../../../../../api/types'

/*
 * Terranova Hotel on commercial Plot A-04, Kallakal: 124′3″ of frontage (north → south) × 340′7″
 * deep (west → east), 4,676 sq yd, facing east onto the HMDA master plan road on NH-44, with the
 * 33 ft cross road behind it, Plot A-03 to the north and the site boundary to the south.
 *
 * Site frame, as for D-65 and the mall: +z east (the road), +x north, y up, origin at the plot
 * centre. Seen from the forecourt (looking west) south is on the left and north on the right.
 *
 * The client's two references, fitted to the plot:
 *
 *   the podium (reference 1, left to right): a glass block with a rounded corner at the south end;
 *   above it a glass drum, its lower floor set back, its roof sweeping down to the south in a silver
 *   blade; a silver band that hugs the drum's foot and rises to the north, the roofline of the
 *   main block, whose roof climbs with it; the double-height lobby under a deep curved canopy
 *   edged in warm LED light on stainless columns; the main block's front bowing out to the north.
 *   behind the drum: four floors in the drum's glass and silver bands, in place of the towers of
 *   reference 1, which the client had taken off.
 *   Starbucks (reference 2): the giant coffee cup at the north end, set into a notch in the main
 *   block's front so the block wraps round behind it, as the tower does in the reference: glass
 *   ground floor, a sleeve band, a tall glazed upper café with the siren, the lettered top band
 *   and the white lid.
 *
 *   Floors and heights are read from reference 1 by perspective, scaled by the canopy (about 7 m
 *   to its top): the podium is a double-height ground floor and two more to the silver band at
 *   about 12 m; the drum three floors over it to about 23 m; behind the drum, four floors to 26 m.
 *
 *   The podium runs back over most of the plot's depth; behind it there is only the pool deck.
 *   Parking is in two basements (basement.ts) under the building and the forecourt, by a two-way
 *   ramp down the south side; the service and fire lane runs down the north side to the deck.
 *
 *   levels:   ground +0.15; podium floors every 4.0 m from +4.15 (the lobby double height to
 *             +8.15); the drum's and the block behind it every 3.5 m from the podium roof at +12.15
 *   heights:  silver band +11.5 to +12.65 over the south block, rising with the main block's roof
 *             to +24.65 behind the cup; drum roof +23.1; the block behind it +26.15, parapet +26.9
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

export const WALL_T = 0.23

/* ---------- levels ---------- */

export const GL = 0.15
/** Podium floors, 4 m apart; the lobby runs double height to the third. */
export const LV = [GL, 4.15, 8.15, 12.15, 16.15, 20.15] as const
export const PODIUM_ROOF = 12.15
export const SLAB = 0.45

/* ---------- the podium ---------- */

/** The south block under the drum: its south face, its front, the rounded corner between. */
export const LEFT = { x0: -11.9, x1: -4.0, front: 34.5, r: 3.5 }
/** The main block: the lobby's straight front, then the bowed front to the north end. */
export const MAIN = { x0: -4.0, x1: 14.4, front: 33.0, bowFrom: 3.5 }
/**
 * The podium's back half, filling the plot's width and depth behind the ramp: its back face, and
 * where it steps out south beside the ramp's foot.
 */
export const REAR = { x0: -17.5, z1: 7.8, back: -26.0 }
/** Where the bowed front passes: from the lobby's front at bowFrom, out and back to the north end. */
const BOW: [Point2, Point2, Point2] = [[MAIN.bowFrom, MAIN.front], [9.0, 34.6], [MAIN.x1, 32.2]]

/** The circle through three points. */
function circleThrough([a, b, c]: [Point2, Point2, Point2]) {
  const [ax, az] = a
  const [bx, bz] = b
  const [cx, cz] = c
  const d = 2 * (ax * (bz - cz) + bx * (cz - az) + cx * (az - bz))
  const ux = ((ax * ax + az * az) * (bz - cz) + (bx * bx + bz * bz) * (cz - az) + (cx * cx + cz * cz) * (az - bz)) / d
  const uz = ((ax * ax + az * az) * (cx - bx) + (bx * bx + bz * bz) * (ax - cx) + (cx * cx + cz * cz) * (bx - ax)) / d
  return { x: ux, z: uz, r: Math.hypot(ax - ux, az - uz) }
}
export const BOW_CIRCLE = circleThrough(BOW)

/** The podium's front line: z at x, from the left block's corner to the north end. */
export function frontZ(x: number) {
  if (x <= LEFT.x0 + LEFT.r) {
    const dx = Math.max(0, LEFT.x0 + LEFT.r - x)
    return LEFT.front - LEFT.r + Math.sqrt(Math.max(0, LEFT.r * LEFT.r - dx * dx))
  }
  if (x <= LEFT.x1) return LEFT.front
  if (x <= MAIN.bowFrom) return MAIN.front
  const { x: cx, z: cz, r } = BOW_CIRCLE
  return cz + Math.sqrt(Math.max(0, r * r - (x - cx) ** 2))
}

/**
 * The silver band's underside. Along the front: level at 11.5 m round the drum's foot, then rising
 * gently past the lobby to run into the cup's lettered band, as in reference 1 it runs into the
 * right-hand volume. Behind the cup the main block's roof rises as a silver shell to about 24.5 m
 * between the towers and the north face, and falls back to the podium's level towards the back and
 * the front, so its band climbs and falls along the north face.
 */
export const SWOOSH_H = 1.15
export const SWOOSH_BASE = 11.5
const smooth = (t: number) => {
  const u = Math.min(1, Math.max(0, t))
  return u * u * (3 - 2 * u)
}
export function swooshY(x: number, z: number) {
  const front = 3.0 * smooth((x + 4) / 8.8)
  const across = Math.pow(Math.sin((Math.min(1, Math.max(0, (x - 3.5) / (14.4 - 3.5))) * Math.PI) / 2), 1.2)
  const depth = z > 24 ? smooth((33 - z) / 9) : z > 12 ? 1 : smooth((z + 2) / 14)
  return SWOOSH_BASE + front + 10.0 * across * depth
}
/** The podium's roof at (x, z): the band's top. */
export const roofY = (x: number, z: number) => swooshY(x, z) + SWOOSH_H

/** The drum over the left block: its glass at r, its first floor set back to rIn. */
export const DRUM = { x: -3.6, z: 29.6, r: 7.2, rIn: 6.2, y0: PODIUM_ROOF, mid: 15.65, floor: 3.5, top: 22.65, roof: 23.1 }

/** The lobby: double height behind the canopy, between the left block and the bow. */
export const LOBBY = { x0: -4.0, x1: 3.5, z0: 21.0, z1: MAIN.front }
/** The canopy over the drop-off: its ends, its front's furthest reach, its soffit and top. */
export const CANOPY = { x0: -10.6, x1: 4.6, reach: 41.6, peak: -2.5, soffit: 5.7, top: 7.9 }
/** The canopy's front edge at x, before its ends are rounded. */
export function canopyFrontZ(x: number) {
  const u = (x - CANOPY.x0) / (CANOPY.x1 - CANOPY.x0)
  const up = (CANOPY.peak - CANOPY.x0) / (CANOPY.x1 - CANOPY.x0)
  // A skewed bow: furthest out at `peak`, falling back to the facade at both ends.
  const w = u < up ? Math.sin((u / up) * (Math.PI / 2)) : Math.cos(((u - up) / (1 - up)) * (Math.PI / 2))
  const base = frontZ(Math.min(Math.max(x, CANOPY.x0), CANOPY.x1))
  return base + (CANOPY.reach - MAIN.front) * Math.pow(Math.max(0, w), 0.55)
}
/** Stainless columns under the canopy, 1.8 m behind its front edge. */
export const COLUMNS_X = [-7.0, -1.8, 2.6]

/* ---------- Starbucks ---------- */

/**
 * The cup: centre, and its profile as [y, outer radius] by band, from the ground up. Read from
 * reference 2 against the people at its foot: 9.2 m across at the ground, 12 m across the lid.
 */
export const CUP = { x: 9.8, z: 35.4 }
export const CUP_BANDS = {
  glass: [GL, 4.0, 4.6, 4.72] as const,
  sleeve: [4.0, 5.6, 4.85, 4.9] as const,
  upper: [5.6, 12.6, 4.8, 5.3] as const,
  band: [12.6, 16.9, 5.45, 5.8] as const,
  rim: [16.9, 17.7, 5.98, 6.02] as const,
  lid: [17.7, 18.75, 5.85, 5.15] as const,
}
/** The cup's radius at height y, through its bands (the notch in the main block follows it). */
export function cupR(y: number) {
  for (const [y0, y1, r0, r1] of Object.values(CUP_BANDS)) if (y >= y0 && y <= y1) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0)
  return CUP_BANDS.glass[2]
}
/** The café's upper floor, hidden behind the sleeve band. */
export const CUP_FLOOR = 5.0

/* ---------- behind the drum ---------- */

/**
 * Four floors behind the drum, glazed and banded like it: a rounded block on the podium's roof whose
 * front reaches into the drum's back. (The towers of the first versions were taken off.)
 */
export const BACK_BLOCK = { x: -4.0, z: 16.5, hx: 7.5, hz: 8.5, floors: 4, floor: 3.5 }
/** The block's roof, above which its parapet stands. */
export const backTop = () => PODIUM_ROOF + BACK_BLOCK.floors * BACK_BLOCK.floor

/** A rounded rectangle (superellipse) round (cx, cz), half-widths hx and hz. */
export function superellipse(cx: number, cz: number, hx: number, hz: number, n = 2.8, seg = 64): Point2[] {
  return Array.from({ length: seg }, (_, i) => {
    const t = (i / seg) * Math.PI * 2
    const c = Math.cos(t)
    const s = Math.sin(t)
    return [cx + hx * Math.sign(c) * Math.abs(c) ** (2 / n), cz + hz * Math.sign(s) * Math.abs(s) ** (2 / n)] as Point2
  })
}

/* ---------- the drive, the ramp, the lanes ---------- */

/** The south lane, two-way, from the road to the ramp's mouth. */
export const DRIVE = { x0: PLOT.x0 + WALL_T, x1: -12.25 }
/** The ramp down to B1: its clear width and where its top is (it falls west, −z). */
export const RAMP = { x0: -18.25, x1: -12.45, top: 31.0, h: 3.1 }
/** The service and fire lane down the north side, to the pool deck at the back. */
export const SERVICE = { x0: 14.75, x1: PLOT.x1 - WALL_T }
/** The forecourt's drive: in from the south lane, under the canopy, out by the north lane. */
export const FORECOURT = { z0: 41.0, kerb: 47.0 }

/* ---------- behind the hotel ---------- */

/** The pool deck: travertine from wall to wall behind the hotel, and the pool on it, parallel to the building. */
export const DECK = { x0: PLOT.x0 + WALL_T, x1: PLOT.x1 - WALL_T, z0: PLOT.z0 + WALL_T, z1: REAR.back }
export const POOL = { x0: -9.0, x1: 9.0, z0: -42.6, z1: -35.4, depth: 1.45, water: GL - 0.07 }
/** The pool's shallow sun shelf at its south end. */
export const SHELF = { x0: -9.0, x1: -6.0, depth: 0.3 }

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

/** Rounds a closed polygon's corners by Chaikin's corner cutting. */
export function chaikin(poly: Point2[], passes = 3): Point2[] {
  let p = poly
  for (let k = 0; k < passes; k++) {
    const out: Point2[] = []
    for (let i = 0; i < p.length; i++) {
      const [ax, az] = p[i]
      const [bx, bz] = p[(i + 1) % p.length]
      out.push([0.75 * ax + 0.25 * bx, 0.75 * az + 0.25 * bz], [0.25 * ax + 0.75 * bx, 0.25 * az + 0.75 * bz])
    }
    p = out
  }
  return p
}
