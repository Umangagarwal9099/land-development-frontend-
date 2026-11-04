import { Vector3 } from 'three'
import type { Point2 } from '../../../../../api/types'

/*
 * Kallakal Mall on commercial Plot A-02, Kallakal: 222′3″ deep (west → east) × 150′ of frontage
 * (north → south), 3,704 sq yd, facing east onto the HMDA master plan road on NH-44, with the
 * 60 ft main avenue along its south side and the 33 ft cross road behind it.
 *
 * Site frame, as for D-65: +z east (the road the mall faces), +x north, y up, origin at the plot
 * centre. The reference design (a G+2 mall with a basement, wrapped in a faceted aluminium and
 * glass skin) is fitted to the plot like this:
 *
 *   setbacks: 4.5 m each side (fire access drives), 20.4 m in front, 7.9 m at the rear
 *   envelope: 36.7 m frontage × 39.5 m deep, rounded corners, the entrance link set back 2.7 m
 *   levels:   ground floor +0.45 (podium), first +5.85, second +10.65, roof +15.45
 *             (5.4 / 4.8 / 4.8 m floor to floor); skin crown to +18.4 (south) and +17.2 (north)
 *
 * Read off the reference elevation: the taller south block carries the name, the lower link
 * between the blocks dips the skin over a double-height glazed entrance, and the north block
 * carries the media screen, its skin sweeping down towards the north-east corner above a white
 * band that continues the entrance canopy.
 */

export const FT = 0.3048

/** The plot boundary (222′3″ × 150′ = 33,337.5 sq ft = 3,704 sq yd). */
export const PLOT = { x0: -75 * FT, x1: 75 * FT, z0: -111.125 * FT, z1: 111.125 * FT }

/**
 * The layout plan draws the plot's road edge along the HMDA road, which runs at a slight skew to
 * the layout grid: at depth z = FRONTAGE_Z(x). The master plan trims the forecourt to it.
 */
export const FRONTAGE_Z = (x: number) => 33.53 - 0.3636 * x
/** Where the plan's plot polygon centre (the mean of its corners) sits in this frame. */
export const PLAN_CENTRE_Z = (2 * PLOT.z0 + FRONTAGE_Z(PLOT.x0) + FRONTAGE_Z(PLOT.x1)) / 4

export const SIDE_SETBACK = 4.5
export const BX0 = PLOT.x0 + SIDE_SETBACK
export const BX1 = PLOT.x1 - SIDE_SETBACK
/** Line of the skin on the main front, and the rear wall. */
export const FRONT_Z = 13.5
export const REAR_Z = -26
/** The entrance link: set back between the two blocks, centred on ENTRY_X. */
export const LINK = { x0: -6.6, x1: 4.6, z: 10.8 }
export const ENTRY_X = -1

export const GL = 0.45
export const L1 = 5.85
export const L2 = 10.65
export const ROOF = 15.45
/** The entrance lobby rises through two floors under a lower roof, so the skin can dip over it. */
export const LOBBY_ROOF = 13.0
/** The lobby: behind the link, between the blocks. */
export const LOBBY = { x0: LINK.x0, x1: LINK.x1, z0: 1 }

/** Ground-floor shopfronts stand this far inside the skin, under its overhang. */
export const SHOPFRONT = -1.3
/** Front edge of the raised forecourt, and the drive and parking rows beyond it. */
export const PLAZA_Z = 19
export const DRIVE = { z0: 20.3, z1: 27 }
export const BAYS = { z0: 27, z1: 32 }

/* ---------- small maths ---------- */

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
export const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
/** A raised-cosine bump: 1 at `c`, falling to 0 at c ± w. */
export const bump = (v: number, c: number, w: number) => (Math.abs(v - c) >= w ? 0 : 0.5 * (1 + Math.cos((Math.PI * (v - c)) / w)))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/* ---------- the envelope's plan: a closed loop with filleted corners ---------- */

/** Corners of the skin line, anticlockwise seen from above, each with its fillet radius. */
const CORNERS: [x: number, z: number, r: number][] = [
  [LINK.x0, FRONT_Z, 2],
  [LINK.x0 + 2, LINK.z, 2],
  [LINK.x1 - 2, LINK.z, 2],
  [LINK.x1, FRONT_Z, 2],
  [BX1, FRONT_Z, 5],
  [BX1, REAR_Z, 2.5],
  [BX0, REAR_Z, 2.5],
  [BX0, FRONT_Z, 5],
]

function filleted(corners: typeof CORNERS): Point2[] {
  const out: Point2[] = []
  const n = corners.length
  for (let i = 0; i < n; i++) {
    const [px, pz, r] = corners[i]
    const [ax, az] = corners[(i + n - 1) % n]
    const [bx, bz] = corners[(i + 1) % n]
    const la = Math.hypot(ax - px, az - pz)
    const lb = Math.hypot(bx - px, bz - pz)
    const u1 = [(ax - px) / la, (az - pz) / la]
    const u2 = [(bx - px) / lb, (bz - pz) / lb]
    const phi = Math.acos(Math.max(-1, Math.min(1, u1[0] * u2[0] + u1[1] * u2[1])))
    const d = Math.min(r / Math.tan(phi / 2), la * 0.45, lb * 0.45)
    const rr = d * Math.tan(phi / 2)
    const bis = [u1[0] + u2[0], u1[1] + u2[1]]
    const bl = Math.hypot(bis[0], bis[1])
    const cx = px + (bis[0] / bl) * (rr / Math.sin(phi / 2))
    const cz = pz + (bis[1] / bl) * (rr / Math.sin(phi / 2))
    const a0 = Math.atan2(pz + u1[1] * d - cz, px + u1[0] * d - cx)
    let a1 = Math.atan2(pz + u2[1] * d - cz, px + u2[0] * d - cx)
    while (a1 - a0 > Math.PI) a1 -= 2 * Math.PI
    while (a1 - a0 < -Math.PI) a1 += 2 * Math.PI
    const steps = Math.max(4, Math.ceil((Math.abs(a1 - a0) * rr) / 0.15))
    for (let k = 0; k <= steps; k++) {
      const a = a0 + ((a1 - a0) * k) / steps
      out.push([cx + Math.cos(a) * rr, cz + Math.sin(a) * rr])
    }
  }
  return out
}

/**
 * The skin line resampled by arc length: position, tangent and outward normal at every sample.
 * Everything that follows the façade (skin, shopfronts, soffits, coping, screen) is laid out
 * along `s`, the distance round the building from the south end of the link.
 */
export class Loop {
  readonly length: number
  private xs: number[] = []
  private zs: number[] = []
  private nx: number[] = []
  private nz: number[] = []
  private readonly step = 0.05

  constructor(points: Point2[]) {
    const seg: number[] = [0]
    for (let i = 1; i <= points.length; i++) {
      const [ax, az] = points[i - 1]
      const [bx, bz] = points[i % points.length]
      seg.push(seg[i - 1] + Math.hypot(bx - ax, bz - az))
    }
    this.length = seg[points.length]
    const count = Math.ceil(this.length / this.step)
    let j = 0
    for (let k = 0; k < count; k++) {
      const s = (k * this.length) / count
      while (seg[j + 1] < s) j++
      const [ax, az] = points[j]
      const [bx, bz] = points[(j + 1) % points.length]
      const t = (s - seg[j]) / Math.max(1e-9, seg[j + 1] - seg[j])
      this.xs.push(lerp(ax, bx, t))
      this.zs.push(lerp(az, bz, t))
    }
    // Outward normals from central differences; the loop runs anticlockwise, so outward is (−tz, tx).
    for (let k = 0; k < count; k++) {
      const a = (k + count - 2) % count
      const b = (k + 2) % count
      const tx = this.xs[b] - this.xs[a]
      const tz = this.zs[b] - this.zs[a]
      const l = Math.hypot(tx, tz)
      this.nx.push(-tz / l)
      this.nz.push(tx / l)
    }
  }

  private sample(s: number) {
    const count = this.xs.length
    const f = ((((s % this.length) + this.length) % this.length) / this.length) * count
    const i = Math.floor(f) % count
    return { i, j: (i + 1) % count, t: f - Math.floor(f) }
  }

  /** Plan position offset `d` along the outward normal (negative is inside). */
  at(s: number, d = 0): Point2 {
    const { i, j, t } = this.sample(s)
    const [nx, nz] = this.normal(s)
    return [lerp(this.xs[i], this.xs[j], t) + nx * d, lerp(this.zs[i], this.zs[j], t) + nz * d]
  }

  normal(s: number): Point2 {
    const { i, j, t } = this.sample(s)
    const x = lerp(this.nx[i], this.nx[j], t)
    const z = lerp(this.nz[i], this.nz[j], t)
    const l = Math.hypot(x, z)
    return [x / l, z / l]
  }

  /** The loop offset by `d`, as a plan polygon sampled every `step` metres. */
  polygon(d = 0, step = 0.5): Point2[] {
    const n = Math.ceil(this.length / step)
    return Array.from({ length: n }, (_, k) => this.at((k * this.length) / n, d))
  }

  /** Arc length of the sample nearest a plan point. */
  nearest(x: number, z: number) {
    let best = 0
    let dist = Infinity
    for (let k = 0; k < this.xs.length; k++) {
      const d = (this.xs[k] - x) ** 2 + (this.zs[k] - z) ** 2
      if (d < dist) {
        dist = d
        best = k
      }
    }
    return (best * this.length) / this.xs.length
  }

  /** Arc-length runs over which `pred` holds, sampled every `step` metres (wrapping at s = 0). */
  runs(pred: (s: number) => boolean, step = 0.25): [number, number][] {
    const n = Math.ceil(this.length / step)
    const ds = this.length / n
    const out: [number, number][] = []
    let start: number | null = null
    for (let k = 0; k <= n; k++) {
      const s = k * ds
      const ok = k < n && pred(s)
      if (ok && start === null) start = s
      if (!ok && start !== null) {
        out.push([start, s])
        start = null
      }
    }
    // A run through s = 0 is one run.
    if (out.length > 1 && out[0][0] === 0 && Math.abs(out[out.length - 1][1] - this.length) < ds * 1.5) {
      const last = out.pop()!
      out[0] = [last[0], out[0][1] + this.length]
    }
    return out
  }
}

export const LOOP = new Loop(filleted(CORNERS))

/* ---------- the skin's profile ---------- */

/** How much a façade point belongs to the main (east) front, from its plan depth. */
const frontness = (z: number) => smooth(4, 11, z)

/** Top of the skin: the crown over each block, dipping over the link and gently along the sides. */
export function skinTop(s: number) {
  const [x, z] = LOOP.at(s)
  const f = frontness(z)
  const base = lerp(18.4, 17.2, smooth(-6, 6, x))
  const link = 4.2 * f * bump(x, ENTRY_X, 5.6)
  const sides = 0.8 * (1 - f) * bump(z, -7, 9) * smooth(12, 17, Math.abs(x))
  return base - link - sides
}

/** Underside of the skin: over the shopfronts, raised over the entrance, sweeping down to the north-east. */
export function skinBottom(s: number) {
  const [x, z] = LOOP.at(s)
  const f = frontness(z)
  return 5.6 + 3.0 * f * bump(x, ENTRY_X, 4.6) - 2.4 * f * smooth(3, 17, x)
}

/** The skin leans out as it rises above the first floor. */
export const lean = (h: number) => 0.05 * Math.max(0, h - 5.6)

/** A point on the façade: `s` round the loop, `h` up, `out` beyond the skin's base surface. */
export function facadePoint(s: number, h: number, out = 0, target = new Vector3()) {
  const [x, z] = LOOP.at(s)
  const [nx, nz] = LOOP.normal(s)
  const d = lean(h) + out
  return target.set(x + nx * d, h, z + nz * d)
}

/** The white band under the skin arches over the entrance from the south block and sweeps down round the north-east corner. */
export function inSwoosh(s: number) {
  const [x, z] = LOOP.at(s)
  return frontness(z) > 0.35 && x > LINK.x0 - 1.2
}

/* ---------- plan polygons ---------- */

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

/** A footprint split round the lobby: the main part behind it and the two blocks either side. */
export function aroundLobby(poly: Point2[]): Point2[][] {
  const behind = clipHalf(poly, 0, -1, LOBBY.z0)
  const front = clipHalf(poly, 0, 1, -LOBBY.z0)
  return [behind, clipHalf(front, -1, 0, LOBBY.x0), clipHalf(front, 1, 0, -LOBBY.x1)].filter((p) => p.length >= 3)
}

/** The lobby's own footprint, inside a loop polygon. */
export function lobbyOf(poly: Point2[]): Point2[] {
  return clipHalf(clipHalf(clipHalf(poly, 0, 1, -LOBBY.z0), 1, 0, -LOBBY.x0), -1, 0, LOBBY.x1)
}
