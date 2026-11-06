import { Group, PointLight, type Material, type Object3D } from 'three'
import type { Point2 } from '../../../../../api/types'
import { rectPoly, type Openings } from '../basement'
import type { Kit } from '../kit'
import type { Lighting } from '../shared'
import { rng } from '../textures'
import type { Contact } from '../kalakalMall/contact'
import { shrub, type Planting } from '../kalakalMall/foliage'
import { Tris } from '../kalakalMall/skin'
import { rect, slab } from '../kalakalMall/solids'
import { signLine, type LetterTone } from '../kalakalHotel/building'
import { box, fbox, fplane, onFace, type Face } from '../kalakalA01/building'
import { buildEmergency } from './emergency'
import type { HospitalMaterials } from './materials'
import { insideOpd, levelAt } from './opd/plan'
import {
  BACK_Z, BODY, CANOPY, COURT, EMERGENCY, ER, footprint, GL, L1, LINK, MAIN, outline, PARAPET, ROOF, STOREYS, TOWER, UPPER, WING,
} from './plan'

export interface HospitalCtx {
  k: Kit
  c: HospitalMaterials
  lighting: Lighting
  /** Planting gathered across the site, built as a few meshes at the end. */
  plant: Planting
  /** Contact shadows and occlusion, likewise. */
  shade: Contact
  /** On the master plan: trim the forecourt to the layout's skewed road edge. */
  onPlan: boolean
  /** In the property view: what to leave open for the way down to the basements (see basement/). */
  openings?: Openings
}

type R = [number, number]

/* ---------- faces ---------- */

/** Faces of the building by the way they look; s runs left to right seen from outside. */
const eastFace = (z: number, x0: number, x1: number): Face => ({ o: [x0, z], u: [1, 0], n: [0, 1], len: x1 - x0 })
const westFace = (z: number, x0: number, x1: number): Face => ({ o: [x1, z], u: [-1, 0], n: [0, -1], len: x1 - x0 })
const southFace = (x: number, z0: number, z1: number): Face => ({ o: [x, z0], u: [0, 1], n: [-1, 0], len: z1 - z0 })
const northFace = (x: number, z0: number, z1: number): Face => ({ o: [x, z1], u: [0, -1], n: [1, 0], len: z1 - z0 })

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

/** Everything on the faces, gathered by material and built as one mesh each. */
class Parts {
  wall = new Tris()
  band = new Tris()
  skirt = new Tris()
  coping = new Tris()
  glass = new Tris()
  curtain = new Tris(true)
  spandrel = new Tris()
  frame = new Tris()
  ward = new Tris(true)
  lounge = new Tris()
  hall = new Tris()
  ceiling = new Tris()
  floor = new Tris()
  inner = new Tris()
  mat = new Tris()
  shutter = new Tris()
  louvre = new Tris()
  soffit = new Tris()
  roof = new Tris()

  build({ c }: HospitalCtx, parent: Object3D) {
    const all: [Tris, Material, string, boolean][] = [
      [this.wall, c.wall, 'cladding', true],
      [this.band, c.band, 'white_bands', true],
      [this.skirt, c.granite, 'granite_skirting', false],
      [this.coping, c.coping, 'coping', true],
      [this.glass, c.windowGlass, 'window_glass', false],
      [this.curtain, c.curtainGlass, 'curtain_glass', false],
      [this.spandrel, c.spandrel, 'spandrel_glass', true],
      [this.frame, c.silver, 'mullions', true],
      [this.ward, c.ward, 'ward_interiors', false],
      [this.lounge, c.lounge, 'lounge_interiors', false],
      [this.hall, c.hall, 'ground_interiors', false],
      [this.ceiling, c.ceiling, 'ground_ceilings', false],
      [this.floor, c.floor, 'ground_floors', false],
      [this.inner, c.interior, 'interior_walls', false],
      [this.mat, c.plantDark, 'door_mats', false],
      [this.shutter, c.shutter, 'service_shutters', false],
      [this.louvre, c.louvre, 'louvres', true],
      [this.soffit, c.soffit, 'canopy_soffits', false],
      [this.roof, c.roofDeck, 'canopy_roofs', true],
    ]
    for (const [t, mat, name, cast] of all) if (!t.empty) t.mesh(mat, parent, name, cast)
  }
}

/* ---------- façade systems ---------- */

/**
 * In the property view the outpatient department is built in full behind the glass (opd/): where
 * it stands, the façades draw no painted room behind their windows. Set while the building is
 * built; null on the master plan, where every window shows its painted room.
 */
let fittedBehind: ((x: number, z: number, y: number) => boolean) | null = null

/** The runs of s0 … s1 along a face, at depth d, with no real interior behind them on the storey from y. */
function painted(f: Face, s0: number, s1: number, y: number, d: number): R[] {
  if (!fittedBehind) return [[s0, s1]]
  const out: R[] = []
  const step = 0.1
  let start: number | null = null
  for (let s = s0; s <= s1 + 1e-6; s += step) {
    const [x, z] = onFace(f, Math.min(s, s1), d)
    const open = !fittedBehind(x, z, y + 1.5)
    if (open && start === null) start = s
    if ((!open || s + step > s1 + 1e-6) && start !== null) {
      const end = open ? s1 : s
      if (end - start > 0.05) out.push([start, end])
      start = null
    }
  }
  return out
}

/** Depth of the cladding: the windows' reveals. */
const WALL_D = 0.3
/** How far the white bands stand proud, and how far they run past a corner to meet the next face's. */
const BAND_OUT = 0.12
/** A room behind the glass: most lit, some dim, each a little different. */
const lit = (r: () => number): [number, number, number] => {
  const v = r() < 0.2 ? 0.55 + r() * 0.15 : 0.9 + r() * 0.14
  return [v, v, v * (0.97 + r() * 0.05)]
}

/** The coping along the top of a face's parapet. */
const coping = (p: Parts, f: Face, top: number, wrap: number) => fbox(p.coping, f, [-wrap, f.len + wrap], [top, top + 0.06], [-WALL_D - 0.06, BAND_OUT + 0.04])

/**
 * White cladding with windows punched through it in bays, storey by storey, as on the reference's
 * left-hand tower: each window deep in its reveal, framed in silver with a mullion and a fixed
 * upper light, on a slim white sill; a ward bay behind each one. The cladding runs up to `top`.
 */
function punched(p: Parts, f: Face, storeys: R[], top: number, seed: number, cols?: number) {
  const r = rng(seed)
  const n = cols ?? Math.max(1, Math.round(f.len / 3.2))
  const bay = f.len / n
  const W = Math.min(2.0, bay - 1.0)
  for (const [y, next] of storeys) {
    const sill = y + 0.9
    const head = y + 3.2
    fbox(p.wall, f, [0, f.len], [y, sill], [-WALL_D, 0])
    fbox(p.wall, f, [0, f.len], [head, next], [-WALL_D, 0])
    let prev = 0
    for (let i = 0; i < n; i++) {
      const a = i * bay + (bay - W) / 2
      const b = a + W
      fbox(p.wall, f, [prev, a], [sill, head], [-WALL_D, 0])
      prev = b
      fplane(p.glass, f, [a, b], [sill, head], -0.18)
      const fr = (ss: R, ys: R) => fbox(p.frame, f, ss, ys, [-0.22, -0.13])
      fr([a, b], [sill, sill + 0.06])
      fr([a, b], [head - 0.06, head])
      fr([a, a + 0.06], [sill, head])
      fr([b - 0.06, b], [sill, head])
      fr([(a + b) / 2 - 0.03, (a + b) / 2 + 0.03], [sill, head])
      fr([a, b], [head - 0.72, head - 0.67])
      fbox(p.band, f, [a - 0.05, b + 0.05], [sill - 0.06, sill], [-0.2, 0.05])
      p.ward.tint = lit(r)
      const [b0, b1] = [i * bay, (i + 1) * bay]
      for (const run of painted(f, b0, b1, y, -0.9)) fplane(p.ward, f, run, [y, next], -0.9, (s, yy) => [(s - b0) / bay, (yy - y) / (next - y)])
    }
    fbox(p.wall, f, [prev, f.len], [sill, head], [-WALL_D, 0])
  }
  const last = storeys[storeys.length - 1][1]
  if (top > last) fbox(p.wall, f, [0, f.len], [last, top], [-WALL_D, 0])
  if (storeys[0][0] === GL) fbox(p.skirt, f, [0, f.len], [0, GL + 0.45], [0, 0.02])
  coping(p, f, top, 0)
}

/**
 * White bands at every floor with ribbon glazing between, as on the reference's right-hand wing:
 * the bands proud of the glass and carried round the corners, silver mullions at 1.5 m, ward
 * bays behind. The last band rises to `top` as the parapet.
 */
function ribbon(p: Parts, f: Face, storeys: R[], top: number, seed: number, wrap = BAND_OUT, rooms = true) {
  const r = rng(seed)
  const n = Math.max(1, Math.round(f.len / 1.5))
  const w = f.len / n
  const bays = Math.max(1, Math.round(f.len / 3.6))
  const bw = f.len / bays
  for (const [y, next] of storeys) {
    const sill = y + 0.95
    const head = next - 0.35
    fbox(p.band, f, [-wrap, f.len + wrap], [Math.max(0, y - 0.35), sill], [-WALL_D, BAND_OUT])
    fplane(p.glass, f, [0, f.len], [sill, head], -0.12)
    for (let i = 0; i <= n; i++) fbox(p.frame, f, [i * w - 0.03, i * w + 0.03], [sill, head], [-0.16, -0.05])
    fbox(p.frame, f, [0, f.len], [sill, sill + 0.05], [-0.17, -0.04])
    // Without `rooms` the real interior stands behind the glass (the emergency department).
    for (let j = 0; j < (rooms ? bays : 0); j++) {
      p.ward.tint = lit(r)
      const [b0, b1] = [j * bw, (j + 1) * bw]
      for (const run of painted(f, b0, b1, y, -0.8)) fplane(p.ward, f, run, [y, next], -0.8, (s, yy) => [(s - b0) / bw, (yy - y) / (next - y)])
    }
  }
  // The last band rises to `top` as the parapet; a run of ground floor alone stops under the next band.
  const last = storeys[storeys.length - 1][1]
  if (top > last - 0.35) fbox(p.band, f, [-wrap, f.len + wrap], [last - 0.35, top], [-WALL_D, BAND_OUT])
  if (storeys[0][0] === GL) fbox(p.skirt, f, [-wrap, f.len + wrap], [0, GL + 0.45], [BAND_OUT, BAND_OUT + 0.02])
  if (top >= PARAPET - 1e-6) coping(p, f, top, wrap)
}

/**
 * A curtain wall from y0 to y1: blue-grey vision glass pane by pane, opaque spandrel bands at
 * each floor line in `lines`, slim silver fins at 1.25 m and transoms, the floors' lounges behind.
 */
function curtain(p: Parts, f: Face, y0: number, y1: number, lines: number[], seed: number) {
  const r = rng(seed)
  const n = Math.max(1, Math.round(f.len / 1.25))
  const w = f.len / n
  const cuts = [y0, ...lines.flatMap((y) => [y - 0.35, y + 0.25]), y1]
  for (let i = 0; i < cuts.length - 1; i++) {
    const [a, b] = [cuts[i], cuts[i + 1]]
    if (i % 2) {
      fplane(p.spandrel, f, [0, f.len], [a, b], 0.005)
      continue
    }
    for (let j = 0; j < n; j++) {
      const t = 0.92 + r() * 0.12
      p.curtain.tint = [t, t, t * (0.98 + r() * 0.05)]
      fplane(p.curtain, f, [j * w, (j + 1) * w], [a, b], 0)
    }
  }
  for (let j = 0; j <= n; j++) fbox(p.frame, f, [j * w - 0.03, j * w + 0.03], [y0, y1], [-0.02, 0.16])
  for (const c of cuts) fbox(p.frame, f, [0, f.len], [c - 0.025, c + 0.025], [-0.02, 0.06])
  const floors = [y0, ...lines, y1]
  for (let i = 0; i < floors.length - 1; i++) {
    const [a, b] = [floors[i], floors[i + 1]]
    for (const run of painted(f, 0, f.len, a, -1.6)) fplane(p.lounge, f, run, [a, b], -1.6, (s, y) => [s / 8 + i * 0.29, (y - a) / (b - a)])
  }
}

/**
 * A glazed ground floor along a face, up to `top`: the hall `deep` metres behind, its ceiling and
 * floor, silver mullions with a transom, and automatic sliding doors at each of `doors` (centres
 * along the face) with their operator housings and mats.
 */
function lobbyFront(p: Parts, f: Face, top: number, deep: number, doors: number[], offset: number, walk?: { ctx: HospitalCtx; parent: Object3D; fitted?: boolean }) {
  // A fitted hall (the emergency department) is modelled in full behind the glass: no backdrop,
  // ceiling or floor of its own.
  if (!walk?.fitted) {
    fplane(p.hall, f, [0, f.len], [GL, top], -deep, (s, y) => [(s + offset) / 20, (y - GL) / (top - GL)])
    fbox(p.ceiling, f, [0, f.len], [top - 0.02, top], [-deep, -0.15])
    for (const s of [0, f.len - 0.12]) fbox(p.inner, f, [s, s + 0.12], [GL, top], [-deep, -0.15])
  }
  if (!walk) {
    fbox(p.floor, f, [0, f.len], [GL, GL + 0.012], [-deep, -0.15])
    fplane(p.glass, f, [0, f.len], [GL, top], -0.15)
  } else {
    // Walkable: the floor left open over the lifts' shafts and the stair well down to the
    // basements, and the glass open at each door, where the leaves slide aside for a walker.
    const { ctx, parent } = walk
    if (!walk.fitted) {
      const [ax, az] = onFace(f, 0, -deep)
      const [bx, bz] = onFace(f, f.len, -0.15)
      const floor = rect(Math.min(ax, bx), Math.max(ax, bx), Math.min(az, bz), Math.max(az, bz))
      slab(parent, floor, GL, GL + 0.012, ctx.c.floor, ctx.openings!.wells.map(rectPoly), false, 'lobby_floor')
      // Closed over until the basement (and so the lifts and stair) is built.
      ctx.openings!.wells.forEach((w, i) => slab(parent, rectPoly(w), GL, GL + 0.012, ctx.c.floor, [], false, `void_lobby_well_${i}`))
    }
    let at = 0
    for (const d of doors) {
      fplane(p.glass, f, [at, d - 1.22], [GL, top], -0.15)
      at = d + 1.22
      for (const side of [-1, 1]) {
        const leaf = new Group()
        leaf.name = `autoleaf_lobby_${d.toFixed(1)}_${side}`
        const [lx, lz] = onFace(f, d + side * 0.61, -0.13)
        ctx.k.box(leaf, Math.abs(f.u[0]) * 1.2 + 0.03, GL + 2.45 - GL - 0.02, Math.abs(f.u[1]) * 1.2 + 0.03, ctx.c.windowGlass, 0, 0, 0, false)
        for (const e of [-0.6, 0.6]) {
          const [ex, ez] = [f.u[0] * e, f.u[1] * e]
          ctx.k.box(leaf, Math.abs(f.u[1]) * 0.05 + 0.04, 2.43, Math.abs(f.u[0]) * 0.05 + 0.04, ctx.c.silver, ex, 0, ez)
        }
        leaf.position.set(lx, GL + 1.225, lz)
        leaf.userData.slide = [f.u[0] * side * 1.15, 0, f.u[1] * side * 1.15]
        parent.add(leaf)
      }
    }
    fplane(p.glass, f, [at, f.len], [GL, top], -0.15)
  }
  const n = Math.max(1, Math.round(f.len / 1.6))
  for (let i = 0; i <= n; i++) {
    const s = (i * f.len) / n
    if (doors.some((d) => Math.abs(s - d) < 1.35)) continue
    fbox(p.frame, f, [s - 0.035, s + 0.035], [GL, top], [-0.21, -0.08])
  }
  fbox(p.frame, f, [0, f.len], [GL, GL + 0.06], [-0.21, -0.08])
  fbox(p.frame, f, [0, f.len], [top - 0.06, top], [-0.21, -0.08])
  for (const d of doors) {
    fbox(p.frame, f, [0, d - 1.3], [GL + 2.65, GL + 2.72], [-0.21, -0.08])
    fbox(p.frame, f, [d + 1.3, f.len], [GL + 2.65, GL + 2.72], [-0.21, -0.08])
    // Jambs, the leaves' edges and meeting stiles, and the operator's housing over them.
    for (const s of [d - 1.3, d + 1.3]) fbox(p.frame, f, [s - 0.05, s + 0.05], [GL, top], [-0.24, -0.06])
    // The leaves' edges and meeting stiles (walkable, the leaves carry their own and slide).
    if (!walk) for (const s of [d - 1.2, d - 0.04, d + 0.04, d + 1.2]) fbox(p.frame, f, [s - 0.025, s + 0.025], [GL, GL + 2.45], [-0.11, -0.06])
    for (const y of [GL + 0.02, GL + 2.4]) fbox(p.frame, f, [d - 1.2, d + 1.2], [y, y + 0.05], [-0.11, -0.06])
    fbox(p.frame, f, [d - 1.35, d + 1.35], [GL + 2.45, GL + 2.72], [-0.32, -0.06])
    fbox(p.mat, f, [d - 1.3, d + 1.3], [GL, GL + 0.01], [0.02, 1.5])
  }
}

/** The ground floor of the back: cladding, roller shutters to the stores, louvred plant rooms, the staff door. */
function serviceFront(p: Parts, f: Face, shutters: number[], louvres: number[], door: number, walk?: { ctx: HospitalCtx; parent: Object3D }) {
  const top = L1 - 0.35
  const solid: R[] = []
  let s = 0
  const openings = [...shutters.map((c) => [c - 1.7, c + 1.7]), [door - 0.9, door + 0.9]].sort((a, b) => a[0] - b[0])
  for (const [a, b] of openings) {
    solid.push([s, a])
    s = b
  }
  solid.push([s, f.len])
  for (const run of solid) fbox(p.wall, f, run, [0, top], [-WALL_D, 0])
  for (const c of shutters) {
    fbox(p.wall, f, [c - 1.7, c + 1.7], [GL + 3.3, top], [-WALL_D, 0])
    fplane(p.shutter, f, [c - 1.6, c + 1.6], [GL, GL + 3.3], -0.2)
    fbox(p.frame, f, [c - 1.7, c + 1.7], [GL + 3.3, GL + 3.65], [-0.2, 0.15])
    for (const e of [c - 1.65, c + 1.65]) fbox(p.frame, f, [e - 0.05, e + 0.05], [GL, GL + 3.3], [-0.2, 0.02])
    // Granite buffers either side, against reversing trucks.
    fbox(p.skirt, f, [c - 2.0, c - 1.75], [0, 1.0], [0, 0.25])
    fbox(p.skirt, f, [c + 1.75, c + 2.0], [0, 1.0], [0, 0.25])
  }
  for (const c of louvres) for (let y = GL + 1.2; y < GL + 3.2; y += 0.12) fbox(p.louvre, f, [c - 1.1, c + 1.1], [y, y + 0.05], [0.01, 0.07])
  // The staff door: a glazed pair under a small canopy. With the OPD fitted behind it, the door
  // out of its south corridor (and the fire stair beside it): a pair of automatic leaves.
  fbox(p.wall, f, [door - 0.9, door + 0.9], [GL + 2.4, top], [-WALL_D, 0])
  if (walk) {
    for (const side of [-1, 1]) {
      const leaf = new Group()
      leaf.name = `autoleaf_staff_${side}`
      const [lx, lz] = onFace(f, door + side * 0.42, -0.13)
      walk.ctx.k.box(leaf, Math.abs(f.u[0]) * 0.84 + 0.03, 2.38, Math.abs(f.u[1]) * 0.84 + 0.03, walk.ctx.c.windowGlass, 0, 0, 0, false)
      for (const e of [-0.42, 0.42]) walk.ctx.k.box(leaf, Math.abs(f.u[1]) * 0.05 + 0.04, 2.38, Math.abs(f.u[0]) * 0.05 + 0.04, walk.ctx.c.silver, f.u[0] * e, 0, f.u[1] * e)
      leaf.position.set(lx, GL + 1.2, lz)
      leaf.userData.slide = [f.u[0] * side * 0.8, 0, f.u[1] * side * 0.8]
      walk.parent.add(leaf)
    }
    for (const e of [door - 0.85, door + 0.85]) fbox(p.frame, f, [e - 0.03, e + 0.03], [GL, GL + 2.4], [-0.18, -0.1])
  } else {
    fplane(p.glass, f, [door - 0.85, door + 0.85], [GL, GL + 2.4], -0.15)
    for (const e of [door - 0.85, door, door + 0.85]) fbox(p.frame, f, [e - 0.03, e + 0.03], [GL, GL + 2.4], [-0.18, -0.1])
    fplane(p.hall, f, [door - 0.9, door + 0.9], [GL, GL + 2.4], -2, (ss, y) => [0.4 + ss / 30, (y - GL) / 4.8])
    for (const e of [door - 0.9, door + 0.84]) fbox(p.inner, f, [e, e + 0.06], [GL, GL + 2.4], [-2, -0.15])
    fbox(p.inner, f, [door - 0.9, door + 0.9], [GL + 2.4, GL + 2.46], [-2, -0.15])
  }
  fbox(p.band, f, [door - 1.4, door + 1.4], [GL + 2.75, GL + 2.9], [0, 1.4])
  fbox(p.skirt, f, [0, f.len], [0, GL + 0.45], [0, 0.02])
}

/* ---------- the building ---------- */

/** Storeys from the one whose windows clear `y` upwards. */
const above = (y: number) => STOREYS.filter(([s]) => s + 0.9 >= y - 1e-6)

function buildFaces(ctx: HospitalCtx, p: Parts, parent: Object3D) {
  // The south side, along the drive: the tower's punched windows the whole depth of the building.
  punched(p, southFace(BODY.x0, BODY.z0, TOWER.z1), STOREYS, PARAPET, 11)
  // The tower's front: three bays of windows over the outpatient entrance.
  const tower = eastFace(TOWER.z1, TOWER.x0, TOWER.x1)
  punched(p, tower, STOREYS.slice(1), PARAPET, 13, 3)
  // In the property view the outpatient hall is built in full behind the glass (opd/).
  lobbyFront(p, tower, L1 - 0.95, 7, [tower.len / 2], 0, fittedBehind ? { ctx, parent, fitted: true } : undefined)
  fbox(p.wall, tower, [0, tower.len], [L1 - 0.95, L1], [-WALL_D, 0])
  // The returns either side of the link: full height in front of it, above its roof behind.
  punched(p, northFace(TOWER.x1, LINK.z1, TOWER.z1), STOREYS, PARAPET, 17, 1)
  punched(p, northFace(TOWER.x1, BACK_Z, LINK.z1), above(LINK.top), PARAPET, 19, 1)
  punched(p, southFace(MAIN.x0, LINK.z1, MAIN.glass - 0.3), STOREYS, PARAPET, 23, 1)
  punched(p, southFace(MAIN.x0, BACK_Z, LINK.z1), above(LINK.top), PARAPET, 29, 1)
  punched(p, northFace(MAIN.x1, WING.z1, MAIN.glass - 0.3), STOREYS, PARAPET, 31, 1)
  // The wing's end; its long north side down the exit road, the emergency entrance's glazed front
  // halfway along at the ground; and the back.
  ribbon(p, eastFace(WING.z1, WING.x0, WING.x1), STOREYS, PARAPET, 37)
  ribbon(p, northFace(BODY.x1, BODY.z0, WING.z1), STOREYS.slice(1), PARAPET, 41)
  // In the property view the emergency department is fitted out behind the ground floor's glass
  // (emergency.ts), from the stores at the back to the entrance; on the master plan the glass
  // shows a painted hall 6 m deep.
  const fitted = !ctx.onPlan
  if (fitted) {
    ribbon(p, northFace(BODY.x1, BODY.z0, EMERGENCY.z0), STOREYS.slice(0, 1), L1 - 0.35, 42, 0)
    ribbon(p, northFace(BODY.x1, EMERGENCY.z0, ER.z0), STOREYS.slice(0, 1), L1 - 0.35, 46, 0, false)
  } else ribbon(p, northFace(BODY.x1, BODY.z0, ER.z0), STOREYS.slice(0, 1), L1 - 0.35, 42, 0)
  ribbon(p, northFace(BODY.x1, ER.z1, WING.z1), STOREYS.slice(0, 1), L1 - 0.35, 44, 0)
  lobbyFront(p, northFace(BODY.x1, ER.z0, ER.z1), L1 - 0.35, 6, [ER.z1 - ER.door], 9, fitted ? { ctx, parent, fitted } : undefined)
  if (fitted) buildEmergency(ctx, parent)
  const back = westFace(BODY.z0, BODY.x0, BODY.x1)
  ribbon(p, back, STOREYS.slice(1), PARAPET, 43)
  // The staff door at the back of the OPD's south corridor, beside the fire stair's foot.
  serviceFront(p, back, [3.0, 7.0], [12, 16], 19.9, fittedBehind ? { ctx, parent } : undefined)
  // Behind the link's roof, the body's face between the returns.
  ribbon(p, eastFace(BACK_Z, LINK.x0, LINK.x1), STOREYS.filter(([y]) => y >= LINK.roof - 1e-6), PARAPET, 47, 0)
  // The light court, from its podium garden up.
  const court = STOREYS.filter(([y]) => y >= COURT.floor - 1e-6)
  ribbon(p, eastFace(COURT.z0, COURT.x0, COURT.x1), court, PARAPET, 53, 0)
  ribbon(p, westFace(COURT.z1, COURT.x0, COURT.x1), court, PARAPET, 59, 0)
  ribbon(p, northFace(COURT.x0, COURT.z0, COURT.z1), court, PARAPET, 61, 0)
  ribbon(p, southFace(COURT.x1, COURT.z0, COURT.z1), court, PARAPET, 67, 0)

  buildLink(ctx, p, parent)
  buildMain(ctx, p, parent)
  const shape = footprint(0.05)
  ctx.shade.edge(shape, GL + 0.004, 0.9, outside(shape), 0.45, true)
}

/** The glazed link, set back between the tower and the main block, G + 2 under a white parapet. */
function buildLink(ctx: HospitalCtx, p: Parts, parent: Object3D) {
  const { c } = ctx
  const f = eastFace(LINK.z1, LINK.x0, LINK.x1)
  curtain(p, f, GL, LINK.roof - 0.4, UPPER.filter((y) => y < LINK.roof - 1), 71)
  fbox(p.band, f, [-0.05, f.len + 0.05], [LINK.roof - 0.4, LINK.top], [-0.3, 0.1])
  coping(p, f, LINK.top, 0.05)
  fbox(p.skirt, f, [0, f.len], [0, GL + 0.1], [0, 0.18])
  slab(parent, rect(LINK.x0, LINK.x1, BACK_Z, LINK.z1 - 0.3), LINK.roof - 0.3, LINK.roof, [c.roofDeck, c.wall], [], true, 'link_roof')
}

/**
 * The main block: a curtain wall held in a deep white frame, two piers and the band across the
 * top that carries the blue cross and the name; under the first floor, the lobby's glass set back
 * behind the canopy, the main entrance at its centre.
 */
function buildMain(ctx: HospitalCtx, p: Parts, parent: Object3D) {
  const { x0, x1, z1, glass, lobby, pier, band } = MAIN
  const back = glass - 0.3
  // The piers run back to the lobby's line, closing the curtain wall's ends and the lobby's.
  box(p.wall, [x0, x0 + pier], [GL, band[0]], [lobby, z1])
  box(p.wall, [x1 - pier, x1], [GL, band[0]], [lobby, z1])
  box(p.wall, [x0, x1], [band[0], band[1]], [back, z1 + 0.25])
  box(p.coping, [x0 - 0.03, x1 + 0.03], [band[1], band[1] + 0.06], [back - 0.03, z1 + 0.28])
  // Shadow gaps where the frame meets the glass, a dark reveal up each pier's inner edge.
  for (const x of [x0 + pier, x1 - pier]) box(p.spandrel, [x - 0.04, x + 0.04], [L1 + 0.4, band[0]], [glass - 0.01, glass + 0.02])
  fbox(p.skirt, eastFace(z1, x0, x0 + pier), [0, pier], [0, GL + 0.45], [0, 0.02])
  fbox(p.skirt, eastFace(z1, x1 - pier, x1), [0, pier], [0, GL + 0.45], [0, 0.02])

  const cw = eastFace(glass, x0 + pier, x1 - pier)
  curtain(p, cw, L1 + 0.4, band[0], UPPER.slice(1), 73)
  // The first floor's edge, white, over the lobby's glass, and the lobby itself.
  box(p.wall, [x0 + pier, x1 - pier], [L1 - 0.65, L1 + 0.4], [lobby, glass])
  const lb = eastFace(lobby, x0 + pier, x1 - pier)
  lobbyFront(p, lb, L1 - 0.65, 8, [lb.len / 2], 4, ctx.openings ? { ctx, parent } : undefined)
  buildName(ctx, parent)
}

/* ---------- canopies and signs ---------- */

export const NAME = 'KALLAKAL HOSPITAL'
/** Navy letters, lit blue at night; the emergency's red. */
export const NAVY: LetterTone = { face: '#1c3966', emissive: '#3b78ff', intensity: 0.6, side: '#9aa3ad' }
const RED: LetterTone = { face: '#c8161d', emissive: '#ff2a22', intensity: 1.3, side: '#b4b8bc' }

/** A line of letters fitted to `width` (no taller than `cap`), centred at (x, y, z), facing +z. */
function fittedLine(ctx: HospitalCtx, parent: Object3D, text: string, cap: number, width: number, depth: number, tone: LetterTone, x: number, y: number, z: number) {
  const g = signLine(ctx, text, 1, depth, tone)
  const s = Math.min(cap, width / (g.userData.width as number))
  g.scale.setScalar(s)
  g.position.set(x, y - s / 2, z)
  parent.add(g)
  return g
}

/** The blue cross and the name across the main block's top band, as in the reference. */
function buildName(ctx: HospitalCtx, parent: Object3D) {
  const { k, c } = ctx
  const { x0, x1, z1, band } = MAIN
  const z = z1 + 0.25
  const y = (band[0] + band[1]) / 2
  const cross = 1.55
  const gap = 0.45
  const name = signLine(ctx, NAME, 1, 0.1, NAVY)
  const cap = Math.min(0.9, (x1 - x0 - 0.8 - cross - gap) / (name.userData.width as number))
  const textW = (name.userData.width as number) * cap
  const left = (x0 + x1) / 2 - (cross + gap + textW) / 2
  name.scale.setScalar(cap)
  name.position.set(left + cross + gap + textW / 2, y - cap / 2, z + 0.1)
  parent.add(name)
  const cx = left + cross / 2
  k.box(parent, cross * 0.34, cross, 0.16, c.crossBlue, cx, y, z + 0.08)
  k.box(parent, cross, cross * 0.34, 0.16, c.crossBlue, cx, y, z + 0.08)
}

/**
 * The porte-cochère: a thin white slab over the drop-off from the lobby out over the lane, on slim
 * round columns at its outer edge, with a linear soffit and downlights; and the emergency
 * entrance's lower canopy beside it over the ambulance bay, with its red name and stripe.
 */
function buildCanopies(ctx: HospitalCtx, p: Parts, parent: Object3D) {
  const { c, k, shade, lighting } = ctx
  const { x0, x1, z0, z1, y0, y1, columns, colZ } = CANOPY
  canopySlab(p, x0, x1, z0, z1, y0, y1)
  box(p.soffit, [x0 + 0.25, x1 - 0.25], [y0 - 0.012, y0], [z0 + 0.1, z1 - 0.25])
  for (let x = x0 + 1.6; x < x1 - 1; x += 2.8)
    for (let z = z0 + 1.8; z < z1 - 0.8; z += 2.6) {
      k.cyl(parent, 0.09, 0.09, 0.02, c.downlight, x, y0 - 0.02, z, 16).castShadow = false
    }
  for (const x of columns) {
    k.cyl(parent, 0.2, 0.2, y0 - GL, c.band, x, (y0 + GL) / 2, colZ, 28)
    k.cyl(parent, 0.3, 0.3, 0.06, c.silver, x, GL + 0.03, colZ, 28)
    shade.pool(x, GL + 0.006, colZ, 0.55, 0.55, 0.5)
  }
  shade.rect((x0 + x1) / 2, 0.035, (z0 + z1) / 2 + 1, x1 - x0, z1 - z0, 0, 0.32)
  for (const x of [3, 9]) {
    const l = lighting.light(new PointLight('#ffe6c4', 8, 13, 2), 0)
    l.position.set(x, y0 - 0.6, 20)
    parent.add(l)
  }

  // The emergency entrance's canopy, spanning the exit road from the wing to the verge and open at
  // both ends for ambulances driving through; EMERGENCY on both fascias and on the wing over it.
  const er = ER
  canopySlab(p, er.x0, er.x1, er.z0, er.z1, er.y0, er.y1, true)
  box(p.soffit, [er.x0 + 0.15, er.x1 - 0.15], [er.y0 - 0.012, er.y0], [er.z0 + 0.15, er.z1 - 0.15])
  const xm = (er.x0 + er.x1) / 2
  for (const [z, s] of [[er.z1, 1], [er.z0, -1]] as const) {
    k.box(parent, er.x1 - er.x0, 0.1, 0.03, c.redPanel, xm, er.y0 + 0.05, z + s * 0.015)
    const g = fittedLine(ctx, parent, 'EMERGENCY', 0.34, er.x1 - er.x0 - 0.8, 0.06, RED, xm, (er.y0 + er.y1) / 2 + 0.05, z + s * 0.03)
    if (s < 0) g.rotation.y = Math.PI
  }
  for (const z of [er.z0 + 0.4, er.z1 - 0.4]) {
    k.cyl(parent, 0.13, 0.13, er.y0 - 0.02, c.band, er.x1 - 0.2, er.y0 / 2, z, 20)
    shade.pool(er.x1 - 0.2, 0.035, z, 0.4, 0.4, 0.5)
  }
  for (let z = er.z0 + 1.5; z < er.z1 - 1; z += 2.5) k.cyl(parent, 0.09, 0.09, 0.02, c.downlight, xm, er.y0 - 0.02, z, 16).castShadow = false
  const side = fittedLine(ctx, parent, 'EMERGENCY', 0.55, er.z1 - er.z0 - 1, 0.08, RED, BODY.x1 + BAND_OUT + 0.01, L1 + 0.3, er.door)
  side.rotation.y = Math.PI / 2
  // The red cross lightbox on the wing's end, seen from the road.
  const wx = (WING.x0 + WING.x1) / 2
  k.box(parent, 1.15, 1.15, 0.14, c.redPanel, wx, UPPER[1] + 0.3, WING.z1 + 0.19)
  k.box(parent, 1.0, 1.0, 0.02, c.redCross, wx, UPPER[1] + 0.3, WING.z1 + 0.27, false)
  const l = lighting.light(new PointLight('#ffe9d0', 5, 9, 2), 0)
  l.position.set(xm, er.y0 - 0.5, er.door)
  parent.add(l)

  // The outpatient entrance: a flat white canopy on tension rods, the name on the fascia above it.
  const tx = (TOWER.x0 + TOWER.x1) / 2
  const ty = L1 - 1.35
  box(p.band, [tx - 2.6, tx + 2.6], [ty, ty + 0.2], [TOWER.z1, TOWER.z1 + 2.4])
  // Each rod from the canopy's front edge back up to the wall, 2.2 m out and 1.4 m up.
  for (const dx of [-2.2, 2.2]) {
    const rod = k.cyl(parent, 0.02, 0.02, Math.hypot(2.2, 1.4), c.silver, tx + dx, ty + 0.9, TOWER.z1 + 1.1, 8)
    rod.rotation.x = -Math.atan2(2.2, 1.4)
  }
  fittedLine(ctx, parent, 'OUTPATIENT', 0.38, TOWER.x1 - TOWER.x0 - 1.4, 0.06, NAVY, tx, L1 - 0.48, TOWER.z1 + 0.02)
  const lo = lighting.light(new PointLight('#ffe6c4', 4, 9, 2), 0)
  lo.position.set(tx, ty - 0.5, TOWER.z1 + 1.5)
  parent.add(lo)
}

/**
 * A canopy's slab: a grey membrane roof inside a white fascia that stands a little above it, on
 * its front and sides (and its back too, when it stands free of the building there).
 */
function canopySlab(p: Parts, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, back = false) {
  const T = 0.12
  const zb = back ? z0 + T : z0
  if (back) box(p.band, [x0, x1], [y0, y1], [z0, zb])
  box(p.roof, [x0 + T, x1 - T], [y0 + 0.1, y1 - 0.06], [zb, z1 - T])
  box(p.band, [x0, x1], [y0, y1], [z1 - T, z1])
  box(p.band, [x0, x0 + T], [y0, y1], [z0, z1 - T])
  box(p.band, [x1 - T, x1], [y0, y1], [z0, z1 - T])
  box(p.band, [x0 + T, x1 - T], [y0, y0 + 0.1], [z0, z1 - T])
}

/* ---------- roof, court and podium ---------- */

/** The roof inside the parapets, round the court, with the building's plant on it. */
function buildRoof(ctx: HospitalCtx, p: Parts, parent: Object3D) {
  const { c, k, shade } = ctx
  const hole = rect(COURT.x0, COURT.x1, COURT.z0, COURT.z1)
  slab(parent, outline(), ROOF - 0.3, ROOF, [c.roofDeck, c.wall], [hole], true, 'roof')
  // Stair and lift overruns, rendered like the walls.
  // Stair and lift overruns: the OPD's core and its fire stair, the north wing's plant room, the main lobby's core.
  for (const [ox0, ox1, oz0, oz1, h] of [
    [-11.6, -1.9, -2.5, 4.0, 3.8],
    [-11.6, -7.1, -25.8, -19.5, 3.4],
    [8.2, 13.2, -4.0, 1.2, 4.6],
    [2.6, 7.8, 5.2, 9.8, 3.6],
  ] as const) {
    box(p.wall, [ox0, ox1], [ROOF, ROOF + h], [oz0, oz1])
    box(p.coping, [ox0 - 0.05, ox1 + 0.05], [ROOF + h, ROOF + h + 0.08], [oz0 - 0.05, oz1 + 0.05])
    shade.rect((ox0 + ox1) / 2, ROOF + 0.005, (oz0 + oz1) / 2, ox1 - ox0 + 1, oz1 - oz0 + 1, 0, 0.45)
  }
  // Air-handling units in a row along the back, on plinths.
  for (let i = 0; i < 4; i++) {
    const x = 1 + i * 3.4
    box(p.louvre, [x - 1.2, x + 1.2], [ROOF + 0.3, ROOF + 2.3], [-24.4, -19.4])
    box(p.skirt, [x - 1.3, x + 1.3], [ROOF, ROOF + 0.3], [-24.5, -19.3])
    shade.rect(x, ROOF + 0.005, -21.9, 2.8, 5.4, 0, 0.5)
  }
  // Two cooling towers over the north wing, beside the court, their fan stacks on top.
  for (const z of [-15.7, -11.7]) {
    const x = 10.4
    box(p.louvre, [x - 1.7, x + 1.7], [ROOF + 0.3, ROOF + 3.3], [z - 1.7, z + 1.7])
    for (let y = ROOF + 0.6; y < ROOF + 2.4; y += 0.14) box(p.frame, [x - 1.72, x + 1.72], [y, y + 0.05], [z + 1.68, z + 1.75])
    k.cyl(parent, 1.2, 1.3, 0.9, c.plantDark, x, ROOF + 3.75, z, 32)
    shade.rect(x, ROOF + 0.005, z, 3.8, 3.8, 0, 0.5)
  }
  // Water tanks over the court's south side.
  for (const z of [-15, -10.5]) {
    k.cyl(parent, 1.4, 1.4, 2.2, c.whiteMetric, -8.2, ROOF + 1.1, z, 32)
    shade.pool(-8.2, ROOF + 0.005, z, 1.8, 1.8, 0.5)
  }
  // A paver walkway round the court's edge to the plant.
  k.box(parent, COURT.x1 - COURT.x0 + 2, 0.04, 0.9, c.apron, (COURT.x0 + COURT.x1) / 2, ROOF + 0.02, COURT.z0 - 1.2, false)
  k.box(parent, COURT.x1 - COURT.x0 + 2, 0.04, 0.9, c.apron, (COURT.x0 + COURT.x1) / 2, ROOF + 0.02, COURT.z1 + 1.2, false)
}

/** The podium garden at the foot of the light court: paving, planted beds, benches. */
function buildCourt(ctx: HospitalCtx, parent: Object3D) {
  const { c, k, shade, plant } = ctx
  const { x0, x1, z0, z1, floor } = COURT
  slab(parent, rect(x0, x1, z0, z1), floor - 0.3, floor, [c.paving, c.wall], [], false, 'podium')
  const beds: [number, number, number, number][] = [
    [x0 + 0.9, x0 + 3.4, z0 + 0.9, z1 - 0.9],
    [x1 - 3.4, x1 - 0.9, z0 + 0.9, z1 - 0.9],
    [x0 + 4.6, x1 - 4.6, z0 + 4.2, z1 - 4.2],
  ]
  let seed = 3100
  for (const [a, b, d, e] of beds) {
    solid(parent, [a, b], [floor, floor + 0.45], [d, e], c.wall)
    k.box(parent, b - a - 0.2, 0.02, e - d - 0.2, c.mulch, (a + b) / 2, floor + 0.44, (d + e) / 2, false)
    for (let x = a + 0.5; x < b - 0.3; x += 0.9)
      for (let z = d + 0.5; z < e - 0.3; z += 1.1) shrub(plant, x, floor + 0.45, z, 0.42, 0.8, seed++, seed % 3 ? 'shrub' : 'hedge')
    shade.edge([[a, d], [b, d], [b, e], [a, e]], floor + 0.004, 0.35, 1, 0.4, true)
  }
  for (const z of [z0 + 2.2, z1 - 2.2]) {
    const g = k.at((x0 + x1) / 2, z, Math.PI / 2, floor)
    k.box(g, 2.0, 0.42, 0.5, c.granite, 0, 0.21, 0)
    k.box(g, 2.1, 0.05, 0.48, c.surface('teak', 1, 1), 0, 0.445, 0)
  }
}

/** A box with UVs in metres, for small built pieces in true-scale finishes. */
function solid(parent: Object3D, xs: R, ys: R, zs: R, mat: Material) {
  const t = new Tris()
  box(t, xs, ys, zs)
  return t.mesh(mat, parent)
}

export function buildBuilding(ctx: HospitalCtx, parent: Object3D) {
  fittedBehind = ctx.onPlan ? null : (x, z, y) => insideOpd(levelAt(y), x, z)
  const p = new Parts()
  buildFaces(ctx, p, parent)
  buildCanopies(ctx, p, parent)
  buildRoof(ctx, p, parent)
  buildCourt(ctx, parent)
  p.build(ctx, parent)
  fittedBehind = null
  // The lobby's light, and the outpatient hall's.
  for (const [x, z] of [[(MAIN.x0 + MAIN.x1) / 2, MAIN.lobby - 3], [(TOWER.x0 + TOWER.x1) / 2, TOWER.z1 - 3]]) {
    const l = ctx.lighting.light(new PointLight('#ffe2bc', 6, 12, 2), 0.15)
    l.position.set(x, 3.4, z)
    parent.add(l)
  }
}
