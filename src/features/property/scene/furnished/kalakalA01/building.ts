import { PointLight, Vector3, type Material, type Object3D } from 'three'
import type { Point2 } from '../../../../../api/types'
import type { Kit } from '../kit'
import type { Lighting } from '../shared'
import { rng } from '../textures'
import type { Contact } from '../kalakalMall/contact'
import { shrub, type Planting } from '../kalakalMall/foliage'
import { Tris } from '../kalakalMall/skin'
import { slab } from '../kalakalMall/solids'
import { channelLetter } from '../kalakalHotel/building'
import { SHOP_NAMES, type A01Materials } from './materials'
import {
  BLOCK, circle, clipHalf, DOOR_T, DRUM, footprint, GL, GLASS_T, L1, L2, L3, LIFT, MEET_T, MEET_X, PARAPET, perDeg, polar, PORTAL_H, PORTALS, radial, RETURN, ROOF, SLAB, STAIR,
} from './plan'

export interface A01Ctx {
  k: Kit
  c: A01Materials
  lighting: Lighting
  /** Planting gathered across the site, built as a few meshes at the end. */
  plant: Planting
  /** Contact shadows and occlusion, likewise. */
  shade: Contact
  /** On the master plan: trim the forecourt to the layout's skewed road edge. */
  onPlan: boolean
}

type R = [number, number]
const D = Math.PI / 180

/* ---------- geometry helpers ---------- */

/** A quad turned to face `want`, whichever way round its corners were given. */
export function facing(t: Tris, a: Vector3, b: Vector3, c: Vector3, d: Vector3, ua: number[], ub: number[], uc: number[], ud: number[], want: Vector3) {
  const n = new Vector3().subVectors(b, a).cross(new Vector3().subVectors(d, a))
  if (n.dot(want) >= 0) t.quad(a, b, c, d, ua, ub, uc, ud)
  else t.quad(a, d, c, b, ua, ud, uc, ub)
}

/** An axis-aligned box into a mesh under construction, its UVs in metres on every face. */
export function box(t: Tris, [x0, x1]: R, [y0, y1]: R, [z0, z1]: R) {
  const v = (x: number, y: number, z: number) => new Vector3(x, y, z)
  t.quad(v(x0, y0, z1), v(x1, y0, z1), v(x1, y1, z1), v(x0, y1, z1), [x0, y0], [x1, y0], [x1, y1], [x0, y1])
  t.quad(v(x1, y0, z0), v(x0, y0, z0), v(x0, y1, z0), v(x1, y1, z0), [-x1, y0], [-x0, y0], [-x0, y1], [-x1, y1])
  t.quad(v(x1, y0, z1), v(x1, y0, z0), v(x1, y1, z0), v(x1, y1, z1), [-z1, y0], [-z0, y0], [-z0, y1], [-z1, y1])
  t.quad(v(x0, y0, z0), v(x0, y0, z1), v(x0, y1, z1), v(x0, y1, z0), [z0, y0], [z1, y0], [z1, y1], [z0, y1])
  t.quad(v(x0, y1, z1), v(x1, y1, z1), v(x1, y1, z0), v(x0, y1, z0), [x0, z1], [x1, z1], [x1, z0], [x0, z0])
  t.quad(v(x0, y0, z0), v(x1, y0, z0), v(x1, y0, z1), v(x0, y0, z1), [x0, z0], [x1, z0], [x1, z1], [x0, z1])
}

/**
 * One face of the block, as a frame: s runs along it from `o` (left to right seen from outside),
 * d outwards from it.
 */
export interface Face {
  o: Point2
  u: Point2
  n: Point2
  len: number
}
const { x0: BX0, x1: BX1, z0: BZ0, z1: BZ1 } = BLOCK
const FACES = {
  east: { o: [BX0, BZ1], u: [1, 0], n: [0, 1], len: BX1 - BX0 },
  west: { o: [BX1, BZ0], u: [-1, 0], n: [0, -1], len: BX1 - BX0 },
  south: { o: [BX0, BZ0], u: [0, 1], n: [-1, 0], len: BZ1 - BZ0 },
  north: { o: [BX1, BZ1], u: [0, -1], n: [1, 0], len: BZ1 - BZ0 },
} satisfies Record<string, Face>

export const onFace = (f: Face, s: number, d: number): Point2 => [f.o[0] + f.u[0] * s + f.n[0] * d, f.o[1] + f.u[1] * s + f.n[1] * d]

/** A box on a face: s0..s1 along it, d0..d1 out from it. */
export function fbox(t: Tris, f: Face, [s0, s1]: R, ys: R, [d0, d1]: R) {
  const [ax, az] = onFace(f, s0, d0)
  const [bx, bz] = onFace(f, s1, d1)
  box(t, [Math.min(ax, bx), Math.max(ax, bx)], ys, [Math.min(az, bz), Math.max(az, bz)])
}

/** A sheet parallel to a face at depth d, facing out; UVs from (s, y), metres unless given. */
export function fplane(t: Tris, f: Face, [s0, s1]: R, [y0, y1]: R, d: number, uv = (s: number, y: number) => [s, y]) {
  const p = (s: number, y: number) => {
    const [x, z] = onFace(f, s, d)
    return new Vector3(x, y, z)
  }
  facing(t, p(s0, y0), p(s1, y0), p(s1, y1), p(s0, y1), uv(s0, y0), uv(s1, y0), uv(s1, y1), uv(s0, y1), new Vector3(f.n[0], 0, f.n[1]))
}

/** A vertical band on a circle round the drum's centre, t0..t1 degrees, facing out or in. */
function arcBand(t: Tris, r: number, t0: number, t1: number, y0: number, y1: number, inward: boolean, step = 0.35) {
  const n = Math.max(1, Math.ceil((Math.abs(t1 - t0) * perDeg(r)) / step))
  for (let i = 0; i < n; i++) {
    const ta = t0 + ((t1 - t0) * i) / n
    const tb = t0 + ((t1 - t0) * (i + 1)) / n
    const [sa, sb] = [(ta - t0) * perDeg(r), (tb - t0) * perDeg(r)]
    const [ax, az] = polar(ta, r)
    const [bx, bz] = polar(tb, r)
    const [nx, nz] = radial((ta + tb) / 2)
    const want = new Vector3(nx, 0, nz).multiplyScalar(inward ? -1 : 1)
    facing(t, new Vector3(ax, y0, az), new Vector3(bx, y0, bz), new Vector3(bx, y1, bz), new Vector3(ax, y1, az), [sa, y0], [sb, y0], [sb, y1], [sa, y1], want)
  }
}

/** A flat ring round the drum's centre between radii r0 and r1, t0..t1, facing up or down. */
function annulus(t: Tris, r0: number, r1: number, t0: number, t1: number, y: number, up: boolean, step = 3) {
  const n = Math.max(1, Math.ceil(Math.abs(t1 - t0) / step))
  for (let i = 0; i < n; i++) {
    const ta = t0 + ((t1 - t0) * i) / n
    const tb = t0 + ((t1 - t0) * (i + 1)) / n
    const pts = [polar(ta, r0), polar(tb, r0), polar(tb, r1), polar(ta, r1)].map(([x, z]) => new Vector3(x, y, z))
    const uvs = pts.map((p) => [p.x, p.z])
    facing(t, pts[0], pts[1], pts[2], pts[3], uvs[0], uvs[1], uvs[2], uvs[3], new Vector3(0, up ? 1 : -1, 0))
  }
}

/** A box on the drum at angle t, radius r: `w` along the arc, `d` across it. */
function drumBox(k: Kit, parent: Object3D, t: number, r: number, w: number, h: number, d: number, y: number, mat: Material, cast = true) {
  const [x, z] = polar(t, r)
  const m = k.box(parent, w, h, d, mat, x, y, z, cast)
  m.rotation.y = t * D
  return m
}

/** The side of a closed polygon that is outside it, for contact shade (see Contact.edge). */
const outside = (poly: Point2[]): 1 | -1 => {
  let a = 0
  for (let i = 0; i < poly.length; i++) {
    const [x0, z0] = poly[i]
    const [x1, z1] = poly[(i + 1) % poly.length]
    a += x0 * z1 - x1 * z0
  }
  return a > 0 ? -1 : 1
}

/* ---------- the timber screen and the decks behind it ---------- */

/** Everything on the faces, gathered by material and built as one mesh each. */
class Parts {
  slat = new Tris(true)
  slab = new Tris()
  deck = new Tris()
  charcoal = new Tris()
  grey = new Tris()
  black = new Tris()
  glass = new Tris()
  frame = new Tris()
  shops = new Tris()
  ceiling = new Tris()
  floor = new Tris()
  partition = new Tris()
  sign = new Tris()
  shutter = new Tris()
  void = new Tris()
  asphalt = new Tris()
  granite = new Tris()
  hazard = new Tris()

  build({ c }: A01Ctx, parent: Object3D) {
    const all: [Tris, Material, string, boolean][] = [
      [this.slat, c.slat, 'screen_slats', true],
      [this.slab, c.slabEdge, 'slab_edges', true],
      [this.deck, c.deck, 'deck_interiors', false],
      [this.charcoal, c.charcoal, 'charcoal_panels', true],
      [this.grey, c.greyPanel, 'grey_panels', true],
      [this.black, c.black, 'black_returns', true],
      [this.glass, c.shopGlass, 'shop_glass', false],
      [this.frame, c.aluminium, 'shop_frames', true],
      [this.shops, c.shops, 'shop_interiors', false],
      [this.ceiling, c.ceiling, 'shop_ceilings', false],
      [this.floor, c.floor, 'shop_floors', false],
      [this.partition, c.interior, 'shop_partitions', false],
      [this.sign, c.fascia, 'shop_signs', false],
      [this.shutter, c.shutter, 'service_shutters', false],
      [this.void, c.void, 'portal_dark', false],
      [this.asphalt, c.asphalt, 'portal_floor', false],
      [this.granite, c.granite, 'portal_island', true],
      [this.hazard, c.hazard, 'height_bars', true],
    ]
    for (const [t, mat, name, cast] of all) if (!t.empty) t.mesh(mat, parent, name, cast)
  }
}

/** Width of the screen's panels along a face (fitted to divide each run) and its slats. */
const MODULE = 1.8
const SLAT = { w: 0.045, d: 0.09, pitch: 0.115 }
/** How far the panels stand proud of the slab edges: flush ones and those hung forward. */
const PROUD = { flat: 0.08, deep: 0.3 }
/** The corner fins: this far along each face from the corner, and this far proud. */
const CORNER = 0.15
const FIN_OUT = 0.45
/** The decks' interiors are seen this far behind the screen. */
const DECK_D = -2.2

/** The storeys the screen covers: each deck, the top one carried on up to hide the roof. */
const TIERS: R[] = [
  [L1 + 0.05, L2 - SLAB],
  [L2 + 0.05, L3 - SLAB],
  [L3 + 0.05, PARAPET],
]
type Panel = 'flat' | 'deep' | 'grey' | 'open'

/**
 * The decks' face along s0..s1: grey slab edges at every level with the decks dark behind them,
 * and the screen of timber panels in front, staggered as in the reference: most hung flush, some
 * forward, with mid-grey infill panels and open bays (the decks' barrier rails showing) among
 * them, never two open bays side by side or one above another.
 */
function screen(parts: Parts, f: Face, s0: number, s1: number, seed: number) {
  const r = rng(seed)
  // The first deck's edge goes with the ground floor below it (see buildFaces).
  for (const lv of [L2, L3, ROOF]) fbox(parts.slab, f, [s0, s1], [lv - SLAB, lv + 0.05], [DECK_D, 0.02])
  for (const [y0, y1] of [[L1, L2 - SLAB], [L2, L3 - SLAB], [L3, ROOF - SLAB]] as R[]) fplane(parts.deck, f, [s0, s1], [y0, y1], DECK_D, (s, y) => [s + seed, (y - y0) / (y1 - y0)])
  // The parapet behind the top tier, and its black coping over the panels.
  fbox(parts.charcoal, f, [s0, s1], [ROOF + 0.05, PARAPET], [-0.35, -0.1])
  fbox(parts.black, f, [s0, s1], [PARAPET, PARAPET + 0.08], [-0.4, PROUD.deep + SLAT.d + 0.08])

  const n = Math.max(1, Math.round((s1 - s0) / MODULE))
  const w = (s1 - s0) / n
  let below: Panel[] = []
  TIERS.forEach(([y0, y1], tier) => {
    const row: Panel[] = []
    for (let i = 0; i < n; i++) {
      const x = r()
      let kind: Panel = x < 0.15 ? 'open' : x < 0.27 ? 'grey' : x < 0.57 ? 'deep' : 'flat'
      if (kind === 'open' && (row[i - 1] === 'open' || below[i] === 'open')) kind = 'flat'
      row.push(kind)
      const a = s0 + i * w + 0.02
      const b = s0 + (i + 1) * w - 0.02
      const [p0, p1] = [y0 + 0.03, y1 - 0.03]
      if (kind === 'open') {
        // The deck's barrier: two steel rails between the columns.
        const deckY = TIERS[tier][0]
        for (const h of [0.5, 1.05]) fbox(parts.charcoal, f, [a, b], [deckY + h - 0.03, deckY + h + 0.03], [0, 0.06])
        continue
      }
      if (kind === 'grey') {
        fbox(parts.grey, f, [a, b], [p0, p1], [0.03, 0.07])
        continue
      }
      const out = PROUD[kind]
      // Slats centred in the panel at their pitch, each its own shade of the timber.
      const count = Math.floor((b - a - 0.08 - SLAT.w) / SLAT.pitch) + 1
      const first = (a + b) / 2 - ((count - 1) * SLAT.pitch + SLAT.w) / 2
      for (let j = 0; j < count; j++) {
        const m = 0.8 + r() * 0.32
        parts.slat.tint = [m, m * (0.95 + r() * 0.06), m * (0.9 + r() * 0.1)]
        const s = first + j * SLAT.pitch
        fbox(parts.slat, f, [s, s + SLAT.w], [p0, p1], [out, out + SLAT.d])
      }
      // Rails behind the slats top and bottom, on brackets back to the slab where hung forward.
      for (const ry of [p0 + 0.1, p1 - 0.16]) {
        fbox(parts.charcoal, f, [a + 0.03, b - 0.03], [ry, ry + 0.06], [out - 0.05, out])
        if (out > 0.1) for (const s of [a + 0.15, b - 0.15]) fbox(parts.charcoal, f, [s - 0.03, s + 0.03], [ry, ry + 0.06], [0.02, out - 0.05])
      }
    }
    below = row
  })
}

/* ---------- the ground floor ---------- */

/** Height of the shops' glass; the fascia runs from here up to the first deck's slab edge. */
const SHOP_H = L1 - 1.05
const SHOP_DEEP = -5

/**
 * Shopfronts along s0..s1 of a face: charcoal piers and fascia, clear glass in black frames with a
 * door in each, and the shop itself behind; with `firstSign`, a lit lightbox name over each shop.
 */
function storefronts(parts: Parts, f: Face, s0: number, s1: number, shops: number, firstSign: number | null) {
  const w = (s1 - s0) / shops
  fbox(parts.charcoal, f, [s0, s1], [SHOP_H, L1 - SLAB], [-0.05, 0.12])
  fplane(parts.shops, f, [s0, s1], [GL, SHOP_H], SHOP_DEEP, (s, y) => [(s + s0) / 16, (y - GL) / (SHOP_H - GL)])
  fbox(parts.ceiling, f, [s0, s1], [SHOP_H - 0.02, SHOP_H], [SHOP_DEEP, -0.25])
  fbox(parts.floor, f, [s0, s1], [GL, GL + 0.012], [SHOP_DEEP, -0.25])
  for (let i = 0; i <= shops; i++) {
    const s = s0 + i * w
    const [a, b] = [Math.max(s0, s - 0.22), Math.min(s1, s + 0.22)]
    fbox(parts.charcoal, f, [a, b], [GL, SHOP_H], [-0.3, 0.12])
    if (i > 0 && i < shops) fbox(parts.partition, f, [s - 0.06, s + 0.06], [GL, SHOP_H], [SHOP_DEEP, -0.3])
  }
  for (let i = 0; i < shops; i++) {
    const a = s0 + i * w + 0.22
    const b = s0 + (i + 1) * w - 0.22
    fplane(parts.glass, f, [a, b], [GL, SHOP_H], -0.25)
    // The lightbox: its share of the painted names.
    const mid = (a + b) / 2
    const half = Math.min(1.3, (b - a) * 0.42)
    if (firstSign !== null) {
      const k = (firstSign + i) % SHOP_NAMES.length
      fbox(parts.charcoal, f, [mid - half - 0.03, mid + half + 0.03], [SHOP_H + 0.17, SHOP_H + 0.63], [0.12, 0.2])
      fplane(parts.sign, f, [mid - half, mid + half], [SHOP_H + 0.2, SHOP_H + 0.6], 0.205, (s, y) => [(k + (s - (mid - half)) / (2 * half)) / SHOP_NAMES.length, (y - SHOP_H - 0.2) / 0.4])
    }
    // Frames: sill, head, a transom over the door, mullions; the door a pair of leaves.
    const fr = (ss: R, ys: R) => fbox(parts.frame, f, ss, ys, [-0.31, -0.19])
    fr([a, b], [GL, GL + 0.08])
    fr([a, b], [SHOP_H - 0.07, SHOP_H])
    const door: R = i % 2 ? [b - 2.0, b - 0.25] : [a + 0.25, a + 2.0]
    fr([door[0], door[1]], [GL + 2.45, GL + 2.53])
    for (const s of [door[0], door[1], (door[0] + door[1]) / 2]) fr([s - 0.035, s + 0.035], [GL, GL + 2.45])
    const other = i % 2 ? (a + door[0]) / 2 : (door[1] + b) / 2
    if (Math.abs(b - a) > 2.8) fr([other - 0.03, other + 0.03], [GL, SHOP_H])
    // Door pulls: tall brushed bars either side of the meeting stiles.
    for (const s of [(door[0] + door[1]) / 2 - 0.12, (door[0] + door[1]) / 2 + 0.12]) fbox(parts.frame, f, [s - 0.015, s + 0.015], [GL + 0.8, GL + 1.9], [-0.18, -0.12])
  }
}

/** The rear's ground floor: charcoal cladding, roller shutters to the service rooms, louvred plant rooms. */
function serviceFront(parts: Parts, f: Face, s0: number, s1: number, shutters: number[], louvres: number[]) {
  fbox(parts.charcoal, f, [s0, s1], [GL, L1 - SLAB], [-0.25, 0])
  for (const s of shutters) {
    fplane(parts.shutter, f, [s - 1.5, s + 1.5], [GL, GL + 3], 0.01)
    fbox(parts.frame, f, [s - 1.6, s + 1.6], [GL + 3, GL + 3.35], [0, 0.18])
    for (const e of [s - 1.6, s + 1.6]) fbox(parts.frame, f, [e - 0.06, e + 0.06], [GL, GL + 3], [0, 0.08])
  }
  for (const s of louvres)
    for (let y = GL + 1.2; y < GL + 3.2; y += 0.12) fbox(parts.frame, f, [s - 1, s + 1], [y, y + 0.05], [0.01, 0.06])
}

function buildFaces(ctx: A01Ctx, parent: Object3D) {
  const parts = new Parts()
  const { east, west, south, north } = FACES
  const sOf = (x: number) => x - BX0
  const southRun: R = [CORNER, sOf(MEET_X.south) - RETURN]
  const northRun: R = [sOf(MEET_X.north) + RETURN, sOf(LIFT.x0)]
  const stairS = BZ1 - STAIR.z0

  screen(parts, east, ...southRun, 11)
  screen(parts, east, ...northRun, 23)
  screen(parts, west, CORNER, west.len - CORNER, 37)
  screen(parts, south, CORNER, south.len - CORNER, 41)
  screen(parts, north, stairS, north.len - CORNER, 53)

  storefronts(parts, east, ...southRun, 1, 0)
  storefronts(parts, east, ...northRun, 4, null)
  // The ground floor's slab edge over the shops.
  for (const run of [southRun, northRun]) fbox(parts.slab, east, run, [L1 - SLAB, L1 + 0.05], [DECK_D, 0.12])
  serviceFront(parts, west, CORNER, west.len - CORNER, [22, 30], [8, 13])
  serviceFront(parts, north, stairS, north.len - CORNER, [], [12])
  fbox(parts.slab, west, [CORNER, west.len - CORNER], [L1 - SLAB, L1 + 0.05], [DECK_D, 0.02])
  fbox(parts.slab, north, [stairS, north.len - CORNER], [L1 - SLAB, L1 + 0.05], [DECK_D, 0.02])
  // The fire exit in the north end onto the exit road's kerb, under a shallow canopy.
  fplane(parts.grey, north, [7.4, 8.6], [GL, GL + 2.2], 0.005)
  fbox(parts.frame, north, [7.3, 8.7], [GL + 2.2, GL + 2.28], [0, 0.08])
  fbox(parts.black, north, [6.9, 9.1], [GL + 2.6, GL + 2.72], [0, 0.5])
  buildPortals(ctx, parts, south, parent)

  // Corner fins, full height, closing the screen at each corner (the stair tower closes the fourth).
  for (const [cx, cz, sx, sz] of [[BX0, BZ0, -1, -1], [BX1, BZ0, 1, -1], [BX0, BZ1, -1, 1]] as const) {
    const xs = [cx - sx * CORNER, cx + sx * FIN_OUT].sort((p, q) => p - q) as R
    const zs = [cz - sz * CORNER, cz + sz * FIN_OUT].sort((p, q) => p - q) as R
    box(parts.charcoal, xs, [GL, PARAPET + 0.08], zs)
    ctx.shade.rect((xs[0] + xs[1]) / 2, GL + 0.004, (zs[0] + zs[1]) / 2, 1.1, 1.1, 0, 0.5)
  }
  parts.build(ctx, parent)
}

/**
 * The vehicle entry and exit in the block's south end, off the drive: two portals with height
 * bars and a kerbed island between, the ramp up to the decks lost in the dark behind.
 */
function buildPortals(ctx: A01Ctx, parts: Parts, f: Face, parent: Object3D) {
  const ss = PORTALS.map((p) => [p.z0 - BZ0, p.z1 - BZ0] as R)
  const top = L1 - SLAB
  let s = CORNER
  for (const [a, b] of ss) {
    fbox(parts.charcoal, f, [s, a], [GL, top], [-0.25, 0])
    s = b
  }
  fbox(parts.charcoal, f, [s, f.len - CORNER], [GL, top], [-0.25, 0])
  fbox(parts.slab, f, [CORNER, f.len - CORNER], [L1 - SLAB, L1 + 0.05], [DECK_D, 0.02])
  for (const [a, b] of ss) {
    fbox(parts.charcoal, f, [a, b], [PORTAL_H, top], [-0.25, 0])
    fbox(parts.charcoal, f, [a, b], [PORTAL_H, PORTAL_H + 0.05], [-3.5, 0])
    for (const e of [a, b]) fbox(parts.charcoal, f, [e - 0.1, e + 0.1], [0.02, PORTAL_H], [-3.5, 0])
    fplane(parts.void, f, [a, b], [0.02, PORTAL_H], -3.5)
    fbox(parts.asphalt, f, [a, b], [0, 0.022], [-3.5, 0])
    // A height bar across the mouth, striped, hung from the header.
    for (let i = 0; i < 6; i++) {
      const p = a + 0.2 + ((b - a - 0.4) * i) / 6
      fbox(i % 2 ? parts.charcoal : parts.hazard, f, [p, p + (b - a - 0.4) / 6], [PORTAL_H - 0.38, PORTAL_H - 0.24], [0.5, 0.58])
    }
    for (const e of [a + 0.25, b - 0.25]) fbox(parts.frame, f, [e - 0.02, e + 0.02], [PORTAL_H - 0.24, PORTAL_H], [0.52, 0.56])
    ctx.shade.rect(...onFace(f, (a + b) / 2, -1.5), 0.03, b - a, 3, 0, 0.7)
  }
  // The island between them, and the P sign over it.
  const [g0, g1] = [ss[0][1], ss[1][0]]
  fbox(parts.granite, f, [g0 + 0.05, g1 - 0.05], [0.02, 0.17], [-3.5, 1.2])
  const [px, pz] = onFace(f, (g0 + g1) / 2, 0.06)
  ctx.k.box(parent, 0.04, 0.9, 0.9, ctx.c.pSign, px, PORTAL_H + 0.6, pz, false)
}

/* ---------- the drum ---------- */

const DOOR_H = 3.1
const MULLION = 1.25

/**
 * The glazed drum holding the helical ramp: clear glass in black mullions round its front, black
 * solid either side where it returns to the block, a deep black crown carrying the name; the
 * lobby at its foot behind the entrance, the ramp turning up through the decks above.
 */
function buildDrum(ctx: A01Ctx, parent: Object3D) {
  const { c, k, shade } = ctx
  const { r } = DRUM
  const glass = new Tris()
  const black = new Tris()
  const transom = new Tris()
  const inner = new Tris()

  arcBand(glass, r, -GLASS_T, -DOOR_T, GL, PARAPET, false)
  arcBand(glass, r, -DOOR_T, DOOR_T, DOOR_H, PARAPET, false)
  arcBand(glass, r, DOOR_T, GLASS_T, GL, PARAPET, false)
  // Mullions at even spacing; over the doors they stop at the head.
  const n = Math.round((2 * GLASS_T * perDeg(r)) / MULLION)
  for (let i = 1; i < n; i++) {
    const t = -GLASS_T + (2 * GLASS_T * i) / n
    const low = Math.abs(t) < DOOR_T + 0.5 ? DOOR_H : GL
    drumBox(k, parent, t, r + 0.04, 0.07, PARAPET - low, 0.2, (PARAPET + low) / 2, c.aluminium)
  }
  // Transoms at the deck levels and a sill, as black bands round the glass.
  for (const y of [GL, L1, L2, L3, ROOF]) {
    arcBand(transom, r + 0.13, -GLASS_T, GLASS_T, y, y + (y === GL ? 0.15 : 0.1), false)
    annulus(transom, r - 0.02, r + 0.13, -GLASS_T, GLASS_T, y + (y === GL ? 0.15 : 0.1), true)
  }

  // The black returns either side, solid from the glass round to the block's face, and on along it.
  for (const sign of [-1, 1]) {
    const [t0, t1] = [sign * GLASS_T, sign * (MEET_T + 2)].sort((a, b) => a - b)
    arcBand(black, r + 0.25, t0, t1, GL, PARAPET, false)
    arcBand(black, r - 0.15, t0, t1, GL, PARAPET, true)
    // The end beside the glass, facing along the arc towards it.
    const te = sign * GLASS_T
    const [ex, ez] = polar(te, r - 0.15)
    const [fx, fz] = polar(te, r + 0.25)
    const along = new Vector3(Math.cos(te * D), 0, -Math.sin(te * D)).multiplyScalar(-sign)
    facing(black, new Vector3(ex, GL, ez), new Vector3(fx, GL, fz), new Vector3(fx, PARAPET, fz), new Vector3(ex, PARAPET, ez), [0, GL], [0.4, GL], [0.4, PARAPET], [0, PARAPET], along)
    const x = sign > 0 ? MEET_X.north : MEET_X.south
    const xs = [x - sign * 0.6, x + sign * RETURN].sort((a, b) => a - b) as R
    box(black, xs, [GL, PARAPET + 0.08], [BZ1 - 0.3, BZ1 + 0.25])
  }
  // Where the drum stands inside the block, its wall seen from within, and its black outside above the roof.
  arcBand(inner, r, MEET_T, 360 - MEET_T, GL, PARAPET, true)
  arcBand(black, r + 0.02, MEET_T, 360 - MEET_T, ROOF - SLAB, PARAPET, false)

  // The crown: a deep black band right round, over the glass.
  const [c0, c1] = [DRUM.crown0, DRUM.crown1]
  arcBand(black, r + 0.3, 0, 360, c0, c1, false, 0.5)
  arcBand(black, r - 0.25, 0, 360, c0, c1, true, 0.5)
  annulus(black, r - 0.25, r + 0.3, 0, 360, c1, true)
  annulus(black, r - 0.02, r + 0.3, -MEET_T, MEET_T, c0, false)

  glass.mesh(c.shopGlass, parent, 'drum_glass', false)
  black.mesh(c.black, parent, 'drum_black')
  transom.mesh(c.aluminium, parent, 'drum_transoms')
  inner.mesh(c.slabEdge, parent, 'drum_inner_wall', false)
  // Its roof, inside the crown.
  slab(parent, circle(DRUM.x, DRUM.z, r - 0.2, 96), PARAPET - 0.3, PARAPET - 0.05, [c.roof, c.slabEdge], [], true, 'drum_roof')

  buildEntrance(ctx, parent)
  buildLobby(ctx, parent)
  buildHelix(ctx, parent)
  buildCrownName(ctx, parent)
  shade.edge(footprint(0.05, 3), GL + 0.004, 0.9, outside(footprint(0.05, 3)), 0.45, true)
}

/** Automatic sliding doors on the chord of the glass at the drum's front, in a black frame. */
function buildEntrance(ctx: A01Ctx, parent: Object3D) {
  const { c, k } = ctx
  const [ax, az] = polar(-DOOR_T, DRUM.r)
  const [bx, bz] = polar(DOOR_T, DRUM.r)
  const z = (az + bz) / 2
  const half = (bx - ax) / 2
  const xm = (ax + bx) / 2
  // Head, jambs and a glazed panel over the head on the chord; the curved glass carries on above.
  k.box(parent, bx - ax + 0.2, DOOR_H - 2.9, 0.22, c.black, xm, (DOOR_H + 2.9) / 2, z)
  for (const s of [-1, 1]) k.box(parent, 0.14, 2.9 - GL, 0.22, c.black, xm + s * (half + 0.03), (2.9 + GL) / 2, z)
  // The curved glass's cut edge over the doors: a soffit closing the gap back to the chord.
  const soffit = new Tris()
  for (let t = -DOOR_T; t < DOOR_T - 1e-6; t += 2) {
    const pts = [polar(t, DRUM.r), polar(t + 2, DRUM.r), [polar(t + 2, DRUM.r)[0], z] as Point2, [polar(t, DRUM.r)[0], z] as Point2]
    const v = pts.map(([x, zz]) => new Vector3(x, DOOR_H, zz))
    facing(soffit, v[0], v[1], v[2], v[3], [0, 0], [1, 0], [1, 1], [0, 1], new Vector3(0, -1, 0))
  }
  soffit.mesh(c.black, parent, 'door_soffit', false)
  // Fixed side panels and the two leaves, drawn a little apart.
  const leafW = half / 2
  for (const s of [-1, 1]) {
    const fixed = xm + s * (half - leafW / 2)
    k.box(parent, leafW - 0.02, 2.9 - GL - 0.04, 0.012, c.shopGlass, fixed, (2.9 + GL) / 2, z - 0.04, false)
    const leaf = xm + s * (leafW / 2 + 0.35)
    k.box(parent, leafW - 0.02, 2.9 - GL - 0.04, 0.012, c.shopGlass, leaf, (2.9 + GL) / 2, z + 0.04, false)
    for (const e of [-1, 1]) k.box(parent, 0.04, 2.9 - GL - 0.04, 0.05, c.aluminium, leaf + (e * (leafW - 0.02)) / 2, (2.9 + GL) / 2, z + 0.04)
    for (const e of [-1, 1]) k.box(parent, leafW, 0.04, 0.05, c.aluminium, leaf, e > 0 ? 2.88 : GL + 0.04, z + 0.04)
  }
  // The operator's housing behind the head, and a recessed mat at the door.
  k.box(parent, bx - ax, 0.18, 0.25, c.aluminium, xm, 2.81, z - 0.2)
  k.box(parent, bx - ax - 0.2, 0.01, 1.6, c.plantDark, xm, GL + 0.006, z + 0.3, false)
}

/** The lobby at the drum's foot: terrazzo floor, a lit ceiling, the lifts and the directory on its back wall. */
function buildLobby(ctx: A01Ctx, parent: Object3D) {
  const { c, k, lighting } = ctx
  const disc = circle(DRUM.x, DRUM.z, DRUM.r - 0.02, 96)
  slab(parent, clipHalf(disc, 0, 1, -BZ1), 0, GL + 0.012, [c.terrazzo, c.slabEdge], [], false, 'lobby_floor')
  slab(parent, disc, L1 - SLAB, L1 - 0.02, [c.ceiling, c.slabEdge], [], false, 'lobby_ceiling')
  // The back wall on the block's face, in granite, with two lifts and the directory between.
  const [x0, x1] = [MEET_X.south, MEET_X.north]
  k.box(parent, x1 - x0, L1 - SLAB - GL, 0.3, c.granite, (x0 + x1) / 2, (L1 - SLAB + GL) / 2, BZ1 - 0.15)
  for (const dx of [-2.1, 2.1]) {
    const x = DRUM.x + dx
    k.box(parent, 1.5, 2.55, 0.04, c.aluminium, x, GL + 1.275, BZ1 + 0.02)
    k.box(parent, 1.2, 2.3, 0.04, c.chromeRail, x, GL + 1.15, BZ1 + 0.04)
    k.box(parent, 0.01, 2.3, 0.045, c.void, x, GL + 1.15, BZ1 + 0.045, false)
    k.box(parent, 0.1, 0.16, 0.03, c.directory, x + 0.95, GL + 1.2, BZ1 + 0.03, false)
  }
  k.box(parent, 0.9, 1.8, 0.05, c.directory, DRUM.x, GL + 1.6, BZ1 + 0.03, false)
  // Slim white columns under the ramp's first turn.
  for (const t of [-115, -40, 40, 115]) {
    const [x, z] = polar(t, 3.3)
    k.cyl(parent, 0.22, 0.22, L1 - SLAB - GL, c.whiteMetric, x, (L1 - SLAB + GL) / 2, z, 24)
    ctx.shade.pool(x, GL + 0.02, z, 0.45, 0.45, 0.5)
  }
  // A pair of benches and a planter of mother-in-law's tongue.
  for (const s of [-1, 1]) {
    const [x, z] = polar(s * 62, 5.6)
    const g = k.at(x, z, s * 62 * D + Math.PI, GL)
    k.box(g, 1.8, 0.08, 0.5, c.bench, 0, 0.44, 0)
    for (const e of [-0.75, 0.75]) k.box(g, 0.06, 0.42, 0.45, c.aluminium, e, 0.21, 0)
  }
  for (const dx of [-4.3, 4.3]) {
    k.cyl(parent, 0.45, 0.4, 0.55, c.black, DRUM.x + dx, GL + 0.29, BZ1 + 0.9, 28)
    shrub(ctx.plant, DRUM.x + dx, GL + 0.56, BZ1 + 0.9, 0.36, 0.75, dx > 0 ? 2911 : 2912, 'hedge')
  }
  const l = lighting.light(new PointLight('#ffe2bc', 9, 12, 2), 0.15)
  l.position.set(DRUM.x, 3.2, DRUM.z + 2)
  parent.add(l)
}

/**
 * The helical ramp: three turns from the first deck to the roof, one deck to a turn, round a
 * concrete core; a concrete upstand at its outer edge with an LED strip under it, so the turns
 * read through the glass as rising bands, lit at night.
 */
function buildHelix(ctx: A01Ctx, parent: Object3D) {
  const { c, k } = ctx
  const [rIn, rOut, up] = [2.0, 6.8, 0.9]
  const deck = new Tris()
  const conc = new Tris()
  const led = new Tris()
  const rise = (L2 - L1) / 360
  const step = 4
  const pt = (t: number, rr: number, y: number) => {
    const [x, z] = polar(t, rr)
    return new Vector3(x, y, z)
  }
  for (let th = 0; th < 1080 - 1e-6; th += step) {
    const [ta, tb] = [180 - th, 180 - th - step]
    const [ya, yb] = [L1 + th * rise, L1 + (th + step) * rise]
    const q = (t: Tris, ra: number, rb: number, ya0: number, yb0: number, ya1: number, yb1: number, want: Vector3) =>
      facing(t, pt(ta, ra, ya0), pt(tb, ra, yb0), pt(tb, rb, yb1), pt(ta, rb, ya1), [ta * perDeg(ra) * 0.1, ra], [tb * perDeg(ra) * 0.1, ra], [tb * perDeg(rb) * 0.1, rb], [ta * perDeg(rb) * 0.1, rb], want)
    const [nx, nz] = radial(ta - step / 2)
    const outN = new Vector3(nx, 0, nz)
    q(deck, rIn, rOut, ya, yb, ya, yb, new Vector3(0, 1, 0))
    q(conc, rIn, rOut, ya - 0.3, yb - 0.3, ya - 0.3, yb - 0.3, new Vector3(0, -1, 0))
    // The upstand's outer and inner faces, its top, and the slab's outer edge below it.
    facing(conc, pt(ta, rOut, ya - 0.3), pt(tb, rOut, yb - 0.3), pt(tb, rOut, yb + up), pt(ta, rOut, ya + up), [0, 0], [1, 0], [1, 1], [0, 1], outN)
    facing(conc, pt(ta, rOut - 0.15, ya), pt(tb, rOut - 0.15, yb), pt(tb, rOut - 0.15, yb + up), pt(ta, rOut - 0.15, ya + up), [0, 0], [1, 0], [1, 1], [0, 1], outN.clone().negate())
    q(conc, rOut - 0.15, rOut, ya + up, yb + up, ya + up, yb + up, new Vector3(0, 1, 0))
    q(led, rOut - 0.5, rOut - 0.3, ya - 0.305, yb - 0.305, ya - 0.305, yb - 0.305, new Vector3(0, -1, 0))
  }
  deck.mesh(c.rampDeck, parent, 'helix_deck')
  conc.mesh(c.slabEdge, parent, 'helix_concrete')
  led.mesh(c.led, parent, 'helix_led', false)
  k.cyl(parent, rIn, rIn, PARAPET - 0.3 - L1, c.slabEdge, DRUM.x, (PARAPET - 0.3 + L1) / 2, DRUM.z, 48)
}

export const NAME = 'KALLAKAL SQUARE'

/** The name on the crown over the entrance, letter by letter round the curve. */
function buildCrownName(ctx: A01Ctx, parent: Object3D) {
  const cap = 0.62
  const base = (DRUM.crown0 + DRUM.crown1) / 2 - cap / 2
  const r = DRUM.r + 0.31
  const letters = [...NAME].map((ch) => (ch === ' ' ? { group: null, advance: cap * 0.6 } : channelLetter(ctx, ch, cap, 0.06)))
  const total = letters.reduce((s, l) => s + l.advance, 0)
  let s = -total / 2
  for (const l of letters) {
    // Reading left to right from the road runs north, increasing t.
    const t = (s + l.advance / 2) / perDeg(r)
    if (l.group) {
      const [x, z] = polar(t, r + 0.06)
      l.group.position.set(x, base, z)
      l.group.rotation.y = t * D
      parent.add(l.group)
    }
    s += l.advance
  }
}

/* ---------- the stair tower, lift core and roof ---------- */

/**
 * The stair tower at the north end of the front: cream render with a tall glazed slit facing the
 * road, its north end a curtain wall showing the flights inside.
 */
function buildStair(ctx: A01Ctx, parent: Object3D) {
  const { c, k, shade } = ctx
  const { x0, x1, z0, z1, top } = STAIR
  const wall = new Tris()
  const T = 0.25
  const slit: R = [x0 + 0.95, x0 + 1.75]
  // East face, either side of the slit and over it.
  box(wall, [x0, slit[0]], [GL, top], [z1 - T, z1])
  box(wall, [slit[1], x1], [GL, top], [z1 - T, z1])
  box(wall, slit, [top - 0.9, top], [z1 - T, z1])
  // West and south walls, and the frame round the north curtain wall.
  box(wall, [x0, x1], [GL, top], [z0, z0 + T])
  box(wall, [x0, x0 + T], [GL, top], [z0, z1])
  box(wall, [x1 - T, x1], [GL, top], [z0, z0 + 0.4])
  box(wall, [x1 - T, x1], [GL, top], [z1 - 0.4, z1])
  box(wall, [x1 - T, x1], [top - 0.7, top], [z0, z1])
  box(wall, [x0, x1], [top - 0.3, top], [z0, z1])
  wall.mesh(c.render, parent, 'stair_render')
  k.box(parent, x1 - x0 + 0.1, 0.08, z1 - z0 + 0.1, c.coping, (x0 + x1) / 2, top + 0.04, (z0 + z1) / 2)

  const glass = new Tris()
  const frame = new Tris()
  const north = { o: [x1 - 0.12, z1 - 0.4], u: [0, -1], n: [1, 0], len: z1 - z0 - 0.8 } satisfies Face
  fplane(glass, north, [0, north.len], [GL, top - 0.7], 0)
  for (let s = 0; s <= north.len + 1e-6; s += north.len / 3) fbox(frame, north, [s - 0.035, s + 0.035], [GL, top - 0.7], [-0.05, 0.12])
  for (const y of [GL, L1, L2, L3, ROOF, top - 0.75]) fbox(frame, north, [0, north.len], [y, y + 0.06], [-0.05, 0.12])
  fbox(frame, north, [0.4, 1.4], [GL, GL + 2.3], [0.02, 0.08])
  // The slit: glass in a black frame, a glazed door at its foot.
  const east = { o: [slit[0], z1 - 0.1], u: [1, 0], n: [0, 1], len: slit[1] - slit[0] } satisfies Face
  fplane(glass, east, [0, east.len], [GL, top - 0.9], 0)
  for (const s of [0, east.len]) fbox(frame, east, [s - 0.04, s + 0.04], [GL, top - 0.9], [-0.05, 0.08])
  for (const y of [GL, GL + 2.3, L2, ROOF]) fbox(frame, east, [0, east.len], [y, y + 0.06], [-0.05, 0.08])
  glass.mesh(c.shopGlass, parent, 'stair_glass', false)
  frame.mesh(c.aluminium, parent, 'stair_frames')

  // Inside: dog-leg flights between landings at each level and half level, seen through the glass.
  const levels = [GL, L1, L2, L3, ROOF]
  const flight = (x: number, ya: number, yb: number, za: number, zb: number) => {
    const len = Math.hypot(yb - ya, zb - za)
    const m = k.box(parent, 1.2, 0.2, len, c.slabEdge, x, (ya + yb) / 2 - 0.1, (za + zb) / 2)
    m.rotation.x = -Math.atan2(yb - ya, zb - za)
  }
  const [zl0, zl1] = [z0 + T + 1.2, z1 - T - 1.2]
  for (let i = 0; i < levels.length - 1; i++) {
    const [a, b] = [levels[i], levels[i + 1]]
    const mid = (a + b) / 2
    flight(x0 + T + 0.65, a, mid, zl0, zl1)
    k.box(parent, x1 - x0 - 2 * T, 0.2, 1.2, c.slabEdge, (x0 + x1) / 2, mid - 0.1, z1 - T - 0.6)
    flight(x1 - T - 0.65, mid, b, zl1, zl0)
    k.box(parent, x1 - x0 - 2 * T, 0.2, 1.2, c.slabEdge, (x0 + x1) / 2, b - 0.1, z0 + T + 0.6)
  }
  const l = ctx.lighting.light(new PointLight('#fff1dc', 3, 7, 2), 0)
  l.position.set((x0 + x1) / 2, L2, (z0 + z1) / 2)
  parent.add(l)
  shade.rect((x0 + x1) / 2, GL + 0.004, (z0 + z1) / 2, x1 - x0 + 0.8, z1 - z0 + 0.8, 0, 0.45)
}

/** The lift core beside the stair: a dark grey shaft rising past the parapet, its panels jointed at each deck. */
function buildLiftCore(ctx: A01Ctx, parent: Object3D) {
  const { c } = ctx
  const { x0, x1, z0, z1, top } = LIFT
  const core = new Tris()
  box(core, [x0, x1], [GL, top], [z0, z1])
  core.mesh(c.greyPanel, parent, 'lift_core')
  const joints = new Tris()
  for (const y of [L1, L2, L3, ROOF, (GL + L1) / 2]) box(joints, [x0 - 0.01, x1 + 0.01], [y - 0.012, y + 0.012], [z0 - 0.01, z1 + 0.01])
  joints.mesh(c.black, parent, 'lift_joints', false)
  ctx.k.box(parent, x1 - x0 + 0.1, 0.08, z1 - z0 + 0.1, c.black, (x0 + x1) / 2, top + 0.04, (z0 + z1) / 2)
}

/** The roof: a membrane over the top deck inside the parapet, with the building's plant on it. */
function buildRoof(ctx: A01Ctx, parent: Object3D) {
  const { c, k, shade } = ctx
  // The block's outline less the drum, which carries on up through it.
  const poly: Point2[] = [[BX1, BZ0], [BX1, BZ1], [MEET_X.north, BZ1]]
  for (let t = MEET_T; t <= 360 - MEET_T + 1e-6; t += 4) poly.push(polar(t, DRUM.r + 0.02))
  poly.push([MEET_X.south, BZ1], [BX0, BZ1], [BX0, BZ0])
  slab(parent, poly, ROOF - SLAB, ROOF, [c.roof, c.slabEdge], [], true, 'roof')
  // Condensers in a row, the tanks, and the stair's headroom (the tower itself).
  for (let i = 0; i < 5; i++) {
    const x = -14 + i * 2.2
    k.box(parent, 1.0, 0.25, 1.9, c.plantDark, x, ROOF + 0.125, -9.5)
    k.box(parent, 0.9, 1.0, 1.8, c.plant, x, ROOF + 0.75, -9.5)
    for (const dz of [-0.45, 0.45]) k.cyl(parent, 0.36, 0.36, 0.05, c.plantDark, x, ROOF + 1.27, -9.5 + dz, 24)
    shade.rect(x, ROOF + 0.005, -9.5, 1.4, 2.3, 0, 0.5)
  }
  for (const x of [6, 8.4]) {
    k.cyl(parent, 0.95, 0.95, 1.8, c.whiteMetric, x, ROOF + 0.9, -8.5, 28)
    shade.pool(x, ROOF + 0.005, -8.5, 1.3, 1.3, 0.5)
  }
  // Rainwater outlets' trays and a walkway of pavers to the plant.
  k.box(parent, 30, 0.04, 0.9, c.apron, 0, ROOF + 0.02, -7.6, false)
}

export function buildBuilding(ctx: A01Ctx, parent: Object3D) {
  buildFaces(ctx, parent)
  buildDrum(ctx, parent)
  buildStair(ctx, parent)
  buildLiftCore(ctx, parent)
  buildRoof(ctx, parent)
}
