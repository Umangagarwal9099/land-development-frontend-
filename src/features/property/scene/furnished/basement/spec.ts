/*
 * The two basement car-park levels under each commercial design, described as data: the retaining
 * wall box, the column grid, the ramps, the stair and lift cores and the parking rows. build.ts
 * turns a spec into structure, finishes, services, signage and parked cars; this file holds the
 * shared levels and the layout rules (bay sizes, column spacing, ramp profiles).
 *
 * Levels, as built across all three designs: B1 at −3.30 and B2 at −6.60 (3.30 m floor to floor),
 * 300 mm slabs, so 3.00 m to the soffit and about 2.4 m under the beams. Bays are 2.5 × 5.0 m on
 * 6 m aisles; three bays between columns on an 8.1 m grid; ramps at 1:6 with 3 m transitions.
 */

export const B1 = -3.3
export const B2 = -6.6
/** Floor level of each basement, by level number. */
export const LEVEL_Y: Record<number, number> = { [-1]: B1, [-2]: B2 }
/** The structural slab between levels (and under the ground). */
export const SLAB = 0.3
export const WALL = 0.3
export const COLUMN = 0.6
export const BAY = { w: 2.5, d: 5.0, parallel: 6.0 }

export type Level = -1 | -2
export type Dir = '+x' | '-x' | '+z' | '-z'
export interface Rect {
  x0: number
  x1: number
  z0: number
  z1: number
}

export interface RampSpec {
  id: string
  /** The level at its top (0, the ground) and at its foot. */
  from: 0 | -1
  to: Level
  /** Which way a car going down drives. */
  down: Dir
  /** Where the top of the ramp starts, along `down`'s axis, and its clear width across it. */
  s0: number
  across: [number, number]
  /** Height of the top (the drive or podium at the mouth). */
  top: number
  slope: number
  traffic: 'two-way' | 'in' | 'out'
  /**
   * On a two-way ramp, which side (0 the low edge of `across`, 1 the high) carries the cars going
   * down: the side the drive reaches first, so cars coming in never cross those going out.
   */
  downSide?: 0 | 1
  /**
   * How far down the ramp the opening to the sky runs (under the ground-level cover or building,
   * which the basement view cuts away); beyond it the ramp is roofed by the slab above.
   */
  open?: number
  /** Headroom posted at the ramp's top. */
  headroom: number
  /**
   * For a ramp from the ground that starts inside the building: the height of the tunnel's roof
   * over its first stretch (to `open`), where the slab overhead is still too high to roof it.
   */
  roof?: number
}

export interface CoreSpec {
  rect: Rect
  kind: 'lifts' | 'stair'
  /** The face the lobby doors open onto the car park from. */
  door: Dir
  label: string
}

export interface RowSpec {
  rect: Rect
  /** The way a car's nose points when parked front-in. */
  face: Dir
  parallel?: boolean
  /** Only on these levels (both if omitted). */
  levels?: Level[]
}

export interface AisleSpec {
  rect: Rect
  /** One-way aisles carry arrows this way; two-way get a centre line. */
  flow?: Dir
  /** Only on these levels (both if omitted). */
  levels?: Level[]
}

export interface RoomSpec {
  rect: Rect
  label: string
  levels: Level[]
  /** The wall of the room the door is in. */
  door: Dir
}

/** A lift: the car's centre in plan, its inside width (across the doors) and depth, the way its doors face. */
export interface LiftSpec {
  x: number
  z: number
  w: number
  d: number
  door: Dir
  /** Which side of the doors (across them) the call buttons are on; +1 unless something stands there. */
  call?: 1 | -1
}

/**
 * A dog-leg stair in `zone`: at each level a floor landing across the `entry` end, two flights side
 * by side running away from it and back via a half landing at the far end. Its door is in the
 * core's `door` face at `at` along that face.
 */
export interface StairSpec {
  zone: Rect
  entry: Dir
  door: Dir
  at: number
}

/**
 * The core that joins the basements to the building above: lifts and a stair, from B2 to the
 * ground-floor lobby. In the basements its walls stand on `rect` with their doors in the `face`;
 * at the ground it opens into the lobby at `ground.y`, under a ceiling at `ground.top`.
 */
export interface AccessSpec {
  rect: Rect
  face: Dir
  ground: { y: number; top: number; label: string; frontWall: boolean }
  lifts: LiftSpec[]
  stair: StairSpec
}

export interface BasementSpec {
  name: string
  /** Inner faces of the retaining walls. */
  box: Rect
  /** Column centre lines across x and along z; columns stand where these cross outside aisles and ramps. */
  colX: number[]
  colZ: number[]
  ramps: RampSpec[]
  cores: CoreSpec[]
  rows: RowSpec[]
  aisles: AisleSpec[]
  rooms: RoomSpec[]
  access: AccessSpec
  /** Share of bays with a car in them. */
  occupancy: number
  seed: number
}

/* ---------- geometry helpers ---------- */

export const axisOf = (d: Dir) => (d[1] as 'x' | 'z')
export const signOf = (d: Dir) => (d[0] === '+' ? 1 : -1)
export const overlaps = (a: Rect, b: Rect, pad = 0) => a.x0 < b.x1 + pad && a.x1 > b.x0 - pad && a.z0 < b.z1 + pad && a.z1 > b.z0 - pad
export const inside = (r: Rect, x: number, z: number, pad = 0) => x > r.x0 - pad && x < r.x1 + pad && z > r.z0 - pad && z < r.z1 + pad
export const centre = (r: Rect): [number, number] => [(r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2]

/** Ramp transitions at each end, over which the gradient eases in and out. */
const TRANSITION = 3

export const rampBottom = (r: RampSpec) => LEVEL_Y[r.to]
export const rampLength = (r: RampSpec) => (r.top - rampBottom(r)) / r.slope + TRANSITION

/** The ramp's surface height at distance s from its top: eased in, a straight run, eased out. */
export function rampY(r: RampSpec, s: number) {
  const L = rampLength(r)
  const t = TRANSITION
  const k = r.slope
  const c = Math.max(0, Math.min(L, s))
  let drop: number
  if (c < t) drop = (k * c * c) / (2 * t)
  else if (c > L - t) drop = k * (L - t) - (k * (L - c) * (L - c)) / (2 * t)
  else drop = (k * t) / 2 + k * (c - t)
  return r.top - drop
}

/** The ramp's plan rectangle, its walls included. */
export function rampRect(r: RampSpec, wall = 0.2): Rect {
  const L = rampLength(r)
  const sign = signOf(r.down)
  const [a, b] = [r.s0, r.s0 + sign * L].sort((p, q) => p - q)
  const [c0, c1] = [r.across[0] - wall, r.across[1] + wall]
  return axisOf(r.down) === 'x' ? { x0: a, x1: b, z0: c0, z1: c1 } : { x0: c0, x1: c1, z0: a, z1: b }
}

/** A plan point on the ramp: `s` down it from the top, `t` across it (0..1 between its walls). */
export function rampPoint(r: RampSpec, s: number, t: number): [number, number] {
  const along = r.s0 + signOf(r.down) * s
  const across = r.across[0] + (r.across[1] - r.across[0]) * t
  return axisOf(r.down) === 'x' ? [along, across] : [across, along]
}

/** The ramps present in a level's storey: those landing on it, and those leaving it downwards. */
export const rampsIn = (spec: BasementSpec, level: Level) => spec.ramps.filter((r) => r.to === level || r.from === level)

/* ---------- the parking layout ---------- */

export interface Bay {
  /** Centre of the bay, the way a front-in car's nose points, its number. */
  x: number
  z: number
  face: Dir
  parallel: boolean
  label: string
}

export interface Column {
  x: number
  z: number
  label: string
}

/** What stands in a level's floor plan, that bays and columns keep clear of. */
export function obstacles(spec: BasementSpec, level: Level): Rect[] {
  return [
    ...rampsIn(spec, level).map((r) => rampRect(r)),
    ...spec.cores.map((c) => c.rect),
    spec.access.rect,
    ...spec.rooms.filter((r) => r.levels.includes(level)).map((r) => r.rect),
  ]
}

/** The aisles of a level. */
export const aislesOn = (spec: BasementSpec, level: Level) => spec.aisles.filter((a) => !a.levels || a.levels.includes(level))

/**
 * Columns where the grid lines cross, named by grid: clear of ramps, cores and rooms, and of the
 * aisles' running width (a column may stand on an aisle's edge, between the bays, as built).
 */
export function columns(spec: BasementSpec, level: Level): Column[] {
  const block = obstacles(spec, level)
  const aisles = aislesOn(spec, level).map((a) => a.rect)
  const out: Column[] = []
  spec.colX.forEach((x, i) =>
    spec.colZ.forEach((z, j) => {
      if (!inside(spec.box, x, z, -0.2)) return
      if (block.some((r) => inside(r, x, z, 0.05)) || aisles.some((r) => inside(r, x, z, -0.31))) return
      out.push({ x, z, label: `${String.fromCharCode(65 + j)}${i + 1}` })
    }),
  )
  return out
}

/**
 * Fills each row with bays between the columns and whatever else stands in it: each clear run
 * takes as many whole bays as fit, centred in the run.
 */
export function bays(spec: BasementSpec, level: Level, cols: Column[]): Bay[] {
  const block = obstacles(spec, level)
  const out: Bay[] = []
  let n = 1
  for (const row of spec.rows) {
    if (row.levels && !row.levels.includes(level)) continue
    const faceAxis = axisOf(row.face)
    // Bays run side by side along the row's other axis; parallel bays run nose to tail along `face`.
    const runAxis = row.parallel ? faceAxis : faceAxis === 'x' ? 'z' : 'x'
    const pitch = row.parallel ? BAY.parallel : BAY.w
    const [r0, r1] = runAxis === 'x' ? [row.rect.x0, row.rect.x1] : [row.rect.z0, row.rect.z1]
    const depth: [number, number] = runAxis === 'x' ? [row.rect.z0, row.rect.z1] : [row.rect.x0, row.rect.x1]
    // Blocked spans along the run: columns standing in the row, and obstacles crossing it.
    const spans: [number, number][] = []
    for (const c of cols) {
      const a = runAxis === 'x' ? c.x : c.z
      const d = runAxis === 'x' ? c.z : c.x
      if (d > depth[0] - COLUMN / 2 && d < depth[1] + COLUMN / 2) spans.push([a - COLUMN / 2, a + COLUMN / 2])
    }
    for (const o of block) {
      if (!overlaps(o, row.rect, -0.01)) continue
      spans.push(runAxis === 'x' ? [o.x0 - 0.3, o.x1 + 0.3] : [o.z0 - 0.3, o.z1 + 0.3])
    }
    spans.sort((a, b) => a[0] - b[0])
    const free: [number, number][] = []
    let at = r0
    for (const [a, b] of spans) {
      if (a > at) free.push([at, Math.min(a, r1)])
      at = Math.max(at, b)
    }
    if (at < r1) free.push([at, r1])
    const mid = (depth[0] + depth[1]) / 2
    for (const [a, b] of free) {
      const count = Math.floor((b - a + 0.02) / pitch)
      const start = (a + b) / 2 - (count * pitch) / 2
      for (let i = 0; i < count; i++) {
        const along = start + (i + 0.5) * pitch
        const [x, z] = runAxis === 'x' ? [along, mid] : [mid, along]
        out.push({ x, z, face: row.face, parallel: !!row.parallel, label: `B${-level}-${String(n++).padStart(3, '0')}` })
      }
    }
  }
  return out
}
