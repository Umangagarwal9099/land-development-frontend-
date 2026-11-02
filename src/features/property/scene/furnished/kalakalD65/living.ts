import { CylinderGeometry, DoubleSide, ExtrudeGeometry, Group, LatheGeometry, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Path, PlaneGeometry, PointLight, Shape, ShapeGeometry, Vector2, type Material, type MeshStandardMaterialParameters, type Object3D } from 'three'
import { PI, type Kit } from '../kit'
import { GFL, HALL, type Ctx } from './house'
import { cabinet, type Bay, type Unit } from './cabinets'
import { circuit, switchPlate, type Circuit } from './fixtures'
import { abstractArt } from './paints'
import { fiddleLeafFig, pottedPothos } from './plant'
import { diningChair, fabric, loungeChair, sectional, type SeatMats } from './seating'
import { bowls, placeSetting, plates, servingBowl } from './tableware'

/*
 * The ground floor's open living and dining hall, after the client's "Residence Rayan — Warm
 * Modern Comfort" board: an open plan in light oak, travertine, beige fabric, warm white, taupe
 * and bronze. Living: the oak-slatted TV wall of elevation E1 (TV over a floating console, lit
 * display niches either side), a three-seat sofa, the taupe lounge chair and the
 * round stone coffee table on a large wool rug, sheers and indoor plants, under a lit coffer.
 * Dining: the natural-stone table for six with upholstered chairs, built-in oak cabinetry with
 * LED-lit shelves, the dining wall of elevation E2 (abstract canvas between two wall sconces),
 * and bronze dome pendants. Lighting follows the board's plan: recessed spots, pendants, LED
 * strips and wall washers, on separate dining and living switches.
 *
 * The hall is 3.80 × 5.67 m: dining at the back (2.72 m, by the side window), living at the
 * front (2.95 m, by the double-height window and the main door). The way from the main door to
 * the bedroom door runs between the sofa and the coffee table.
 *
 * Hall frame: X from the left wall (0) to the carport wall (3.80), Z from the back wall (0) to
 * the façade (5.665), h above the floor. `dining_g` and `living_g` hold each room's fittings
 * and lights, so each room is switched on its own.
 */

const W = HALL.w
const D = HALL.d
/** Where the dining room ends and the living room begins, from the back wall. */
export const HALL_SPLIT = D - 2.95
/** False ceiling, and the raised, lit coffer over the living room. */
const H = 2.95
const COFFER = { x0: 0.6, x1: 2.3, z0: HALL_SPLIT + 0.25, z1: D - 0.45, h: 3.07 }
/** The opening from the hall to the passage (and the bathroom), at the back of the right wall. */
const PASS = 0.9

/** Built-in cabinetry on the back wall, short of the bedroom door's architrave. */
const BI = { x1: 2.43, d: 0.42, base: 0.86, top: 2.62, shelfD: 0.32 }
/** The side window, on the left wall. */
const WIN = { z0: 0.645, z1: 1.845 }
/** Dining table, along x: a racetrack top for six. */
const TABLE = { x0: 0.6, x1: 2.1, z0: 1.37, z1: 2.27, h: 0.76 }
/**
 * Living: the sofa set back against the right-hand (carport) wall, facing the TV wall; it stops
 * short of the main door's swing, and the way through runs between it and the coffee table.
 */
const SOFA = { back: W - 0.02, deep: 0.92, z0: 2.15, z1: 4.35 }
/** TV wall (elevation E1): slatted centre panel and lit niches either side. */
const TV = { z: 3.25, panel: 1.4, niche: 0.42, d: 0.35 }

type R = [number, number]
const std = (p: MeshStandardMaterialParameters) => new MeshStandardMaterial({ roughness: 0.8, ...p })

function materials(ctx: Ctx) {
  const { k, lighting, c } = ctx
  const glow = (color: string, intensity: number) => lighting.glow(std({ color: '#fff3df', emissive: color, emissiveIntensity: intensity, roughness: 0.5 }), 1)
  const mergeable = <T extends Material>(mat: T) => {
    mat.userData.mergeable = true
    return mat
  }
  return {
    paint: std({ color: '#f2eee7', roughness: 0.92 }),
    ceiling: new MeshStandardMaterial({ color: '#f4f1ec', roughness: 0.95, emissive: '#c9c0b2', emissiveIntensity: 0.35 }),
    skirting: std({ color: '#e6dfd4', roughness: 0.6 }),
    oak: (w: number, h: number) => c.surface('oak', w, h),
    slats: (w: number, h: number) => c.surface('oakSlats', w, h),
    travertine: (w: number, h: number) => c.surface('travertine', w, h),
    rug: (w: number, d: number) => c.surface('woolRug', w, d),
    oakSolid: c.surface('oak', 0.5, 0.5),
    // Beige fabric, taupe accent and warm white, as the board's palette.
    linen: fabric(k, [216, 207, 192], 301, 6),
    chair: fabric(k, [205, 194, 177], 305, 8),
    lounge: fabric(k, [150, 128, 108], 302, 10, 0.5, true),
    accents: [fabric(k, [164, 142, 118], 303, 4), fabric(k, [232, 225, 212], 304, 4), fabric(k, [190, 162, 128], 306, 4)] as Material[],
    lacquer: std({ color: '#e9e3d8', roughness: 0.5 }),
    interior: std({ color: '#ddd3c4', roughness: 0.8 }),
    dark: std({ color: '#2a2622', roughness: 0.8 }),
    black: c.aluminium,
    bronze: std({ color: '#7a5a3c', roughness: 0.38, metalness: 0.85 }),
    brass: std({ color: '#b08d57', roughness: 0.3, metalness: 0.9 }),
    screen: new MeshPhysicalMaterial({ color: '#0c0d0f', roughness: 0.42, metalness: 0.1, clearcoat: 0.25, clearcoatRoughness: 0.45 }),
    sheer: new MeshPhysicalMaterial({ color: '#f6f2ea', roughness: 1, transparent: true, opacity: 0.62, side: DoubleSide, depthWrite: false }),
    stoneware: std({ color: '#cbbfae', roughness: 0.75 }),
    clay: std({ color: '#b8896a', roughness: 0.85 }),
    ceramicDark: new MeshPhysicalMaterial({ color: '#4a4440', roughness: 0.5, clearcoat: 0.4 }),
    ceramicWhite: new MeshPhysicalMaterial({ color: '#f1ece3', roughness: 0.45, clearcoat: 0.3 }),
    glassVase: mergeable(new MeshPhysicalMaterial({ color: '#dfe7e2', roughness: 0.05, transparent: true, opacity: 0.3, clearcoat: 1 })),
    book: [std({ color: '#d9cdb8', roughness: 0.8 }), std({ color: '#6b5a4c', roughness: 0.8 }), std({ color: '#3f4a4e', roughness: 0.8 }), std({ color: '#b8a58a', roughness: 0.8 })],
    canvas: std({ map: k.tex.painted(512, 384, abstractArt), roughness: 0.9 }),
    pot: std({ color: '#d9d2c6', roughness: 0.7 }),
    plate: std({ color: '#d8d1c6', roughness: 0.45 }),
    rocker: std({ color: '#ece8e1', roughness: 0.35 }),
    // One glow per circuit, so a switch puts out exactly its own fittings.
    domeInner: glow('#ffe2b8', 1.6),
    sconceGlow: glow('#ffd29a', 1.8),
    shelfLed: glow('#ffc98a', 2.2),
    diningSpot: glow('#fff0dc', 2.6),
    livingSpot: glow('#fff0dc', 2.6),
    cove: glow('#ffc98a', 2.2),
    tvLed: glow('#ffc98a', 2.0),
    locator: glow('#ff9a3a', 1.4),
  }
}

type LM = ReturnType<typeof materials>
type Circuits = { pendant: Circuit; ambient: Circuit; diningSpots: Circuit; livingSpots: Circuit; cove: Circuit; tvWall: Circuit }
type BC = { k: Kit; ctx: Ctx; m: LM; c: Circuits; bx: (x: R, h: R, z: R, mat: Material | Material[], cast?: boolean, p?: Object3D) => Mesh; dining: Group; living: Group; hall: Group }

export function buildLiving(ctx: Ctx) {
  const { k } = ctx
  const hall = new Group()
  hall.name = 'hall_g'
  hall.position.set(HALL.x0, GFL, HALL.z0)
  k.root.add(hall)
  const dining = new Group()
  dining.name = 'dining_g'
  const living = new Group()
  living.name = 'living_g'
  hall.add(dining, living)
  const m = materials(ctx)
  const bx = ([x0, x1]: R, [h0, h1]: R, [z0, z1]: R, mat: Material | Material[], cast = true, p: Object3D = hall) =>
    k.box(p, x1 - x0, h1 - h0, z1 - z0, mat, (x0 + x1) / 2, (h0 + h1) / 2, (z0 + z1) / 2, cast)
  const c: Circuits = { pendant: circuit(), ambient: circuit(), diningSpots: circuit(), livingSpots: circuit(), cove: circuit(), tvWall: circuit() }
  c.pendant.glows.push(m.domeInner)
  c.ambient.glows.push(m.sconceGlow, m.shelfLed)
  c.diningSpots.glows.push(m.diningSpot)
  c.livingSpots.glows.push(m.livingSpot)
  c.cove.glows.push(m.cove)
  c.tvWall.glows.push(m.tvLed)
  const B: BC = { k, ctx, m, c, bx, dining, living, hall }
  shell(B)
  builtIn(B)
  diningTable(B)
  diningWall(B)
  tvWall(B)
  lounge(B)
  sheers(B)
  switches(B)
  lights(B)
}

/** A lathed vessel from a radius/height profile. */
function vessel(p: Object3D, profile: number[][], mat: Material, x: number, y: number, z: number, s = 1) {
  const v = new Mesh(new LatheGeometry(profile.map(([r, h]) => new Vector2(r * s, h * s)), 36), mat)
  v.position.set(x, y, z)
  v.castShadow = v.receiveShadow = true
  p.add(v)
  return v
}
const VASE = [[0, 0], [0.05, 0], [0.065, 0.06], [0.07, 0.14], [0.05, 0.22], [0.03, 0.27], [0.034, 0.3], [0.03, 0.3], [0.026, 0.27], [0, 0.26]]
const JUG = [[0, 0], [0.04, 0], [0.06, 0.04], [0.07, 0.1], [0.06, 0.15], [0.035, 0.18], [0.04, 0.2], [0.036, 0.2], [0, 0.19]]
const BOWL = [[0, 0], [0.04, 0], [0.07, 0.03], [0.09, 0.06], [0.086, 0.062], [0.066, 0.034], [0, 0.012]]
const BOTTLE = [[0, 0], [0.04, 0], [0.045, 0.1], [0.03, 0.2], [0.012, 0.28], [0.014, 0.3], [0, 0.3]]

/** A neat stack of books, from the bottom. */
function books(B: BC, p: Object3D, x: number, y: number, z: number, n: number, ry = 0) {
  let by = y
  for (let i = 0; i < n; i++) {
    const t = 0.024 + ((i * 7) % 3) * 0.006
    B.k.box(p, 0.22 - i * 0.012, t, 0.16 - i * 0.008, B.m.book[(i + Math.round(x * 10)) % B.m.book.length], x, by + t / 2, z).rotation.y = ry + i * 0.06
    by += t
  }
  return by
}

/* ---------- Shell ---------- */

/** Skirting, the right-hand wall, the false ceiling with the living room's lit coffer, and spots. */
function shell(B: BC) {
  const { bx, m, k, hall } = B
  bx([0, 0.012], [0, 0.08], [BI.d, D], m.skirting, false)
  bx([3.51, W], [0, 0.08], [0, 0.012], m.skirting, false)
  bx([W - 0.012, W], [0, 0.08], [PASS, D], m.skirting, false)
  bx([0, 0.85], [0, 0.08], [D - 0.012, D], m.skirting, false)
  bx([1.9, 2.56], [0, 0.08], [D - 0.012, D], m.skirting, false)
  bx([3.44, W], [0, 0.08], [D - 0.012, D], m.skirting, false)
  // The bedroom door's architrave on the hall side.
  const DOOR: R = [2.545, 3.445]
  bx([DOOR[0] - 0.065, DOOR[0]], [0, 2.17], [0, 0.014], m.skirting)
  bx([DOOR[1], DOOR[1] + 0.065], [0, 2.17], [0, 0.014], m.skirting)
  bx([DOOR[0] - 0.065, DOOR[1] + 0.065], [2.1, 2.17], [0, 0.014], m.skirting)
  // The hall's right wall, from the carport's back wall to the opening to the passage, and a
  // bulkhead over that opening carrying the false ceiling across.
  bx([W, W + 0.115], [0, 3.11], [PASS, D - 3.2], m.paint)
  bx([W - 0.05, W + 0.23], [2.1, H], [0, PASS], m.paint, false)

  // False ceiling, with the coffer cut out of it.
  const s = new Shape()
  s.moveTo(0, 0)
  s.lineTo(W, 0)
  s.lineTo(W, D)
  s.lineTo(0, D)
  s.closePath()
  const hole = new Path()
  hole.moveTo(COFFER.x0, COFFER.z0)
  hole.lineTo(COFFER.x0, COFFER.z1)
  hole.lineTo(COFFER.x1, COFFER.z1)
  hole.lineTo(COFFER.x1, COFFER.z0)
  hole.closePath()
  s.holes.push(hole)
  const ceiling = new Mesh(new ShapeGeometry(s), m.ceiling)
  // Shape (x, y) → plan (x, z), facing down.
  ceiling.rotation.x = PI / 2
  ceiling.position.y = H
  ceiling.receiveShadow = true
  hall.add(ceiling)
  const top = new Mesh(new PlaneGeometry(COFFER.x1 - COFFER.x0, COFFER.z1 - COFFER.z0), m.ceiling)
  top.rotation.x = PI / 2
  top.position.set((COFFER.x0 + COFFER.x1) / 2, COFFER.h, (COFFER.z0 + COFFER.z1) / 2)
  hall.add(top)
  for (const [x, z] of [[[COFFER.x0 - 0.01, COFFER.x0], [COFFER.z0, COFFER.z1]], [[COFFER.x1, COFFER.x1 + 0.01], [COFFER.z0, COFFER.z1]], [[COFFER.x0, COFFER.x1], [COFFER.z0 - 0.01, COFFER.z0]], [[COFFER.x0, COFFER.x1], [COFFER.z1, COFFER.z1 + 0.01]]] as [R, R][])
    bx(x, [H, COFFER.h], z, m.paint, false)
  // The LED strip on a ledge just inside the coffer's lip, all round.
  const lip = 0.08
  for (const [x, z] of [[[COFFER.x0 + 0.01, COFFER.x0 + lip], [COFFER.z0 + 0.01, COFFER.z1 - 0.01]], [[COFFER.x1 - lip, COFFER.x1 - 0.01], [COFFER.z0 + 0.01, COFFER.z1 - 0.01]], [[COFFER.x0 + 0.01, COFFER.x1 - 0.01], [COFFER.z0 + 0.01, COFFER.z0 + lip]], [[COFFER.x0 + 0.01, COFFER.x1 - 0.01], [COFFER.z1 - lip, COFFER.z1 - 0.01]]] as [R, R][])
    bx(x, [H + 0.005, H + 0.02], z, m.cove, false, B.living)

  // Recessed spots in slim trims, as the board's lighting plan: round the dining room, and along
  // the living room's walls as wall washers.
  const spot = (x: number, z: number, mat: Material, p: Group) => {
    k.cyl(p, 0.042, 0.042, 0.006, m.skirting, x, H - 0.003, z, 20).castShadow = false
    k.cyl(p, 0.03, 0.03, 0.008, mat, x, H - 0.002, z, 16).castShadow = false
  }
  for (const [x, z] of [[0.35, 0.65], [2.1, 0.65], [3.15, 0.45], [3.15, 1.6], [0.35, 2.25]]) spot(x, z, m.diningSpot, B.dining)
  for (const [x, z] of [[0.3, TV.z - 0.9], [0.3, TV.z + 0.9], [3.1, D - 2.2], [3.1, D - 0.9], [1.45, D - 0.25]]) spot(x, z, m.livingSpot, B.living)
}

/* ---------- Dining ---------- */

/**
 * Built-in oak cabinetry with LED lighting on the back wall: a run of drawers and doors under
 * an oak top, and open shelving above in three bays, each shelf lit along its front, styled with
 * ceramics, books and a plant.
 */
function builtIn(B: BC) {
  const { bx, m, k, dining: g } = B
  const w = BI.x1
  const bw = w / 4
  const units: Unit[] = [
    { kind: 'drawers', id: 'dining_unit_1', rows: [0.26, 0.52], fill: [
      (p, b) => cutlery(B, p, b),
      (p, b) => { for (let i = 0; i < 3; i++) k.box(p, b.x1 - b.x0 - 0.04, 0.012, 0.32, m.book[i], (b.x0 + b.x1) / 2, b.floors[0] + 0.006 + i * 0.013, (b.z0 + b.z1) / 2) },
      (p, b) => { for (let i = 0; i < 4; i++) k.cyl(p, 0.045, 0.045, 0.06, m.oakSolid, b.x0 + 0.08 + i * 0.12, b.floors[0] + 0.03, (b.z0 + b.z1) / 2, 18) },
    ] },
    { kind: 'door', id: 'dining_unit_2', hinge: 'left', shelves: [0.4], fill: (p, b) => {
      plates(k, p, (b.x0 + b.x1) / 2, b.floors[0], (b.z0 + b.z1) / 2, 8)
      bowls(k, p, (b.x0 + b.x1) / 2, b.floors[1], (b.z0 + b.z1) / 2, 4)
    } },
    { kind: 'door', id: 'dining_unit_3', hinge: 'right', shelves: [0.4], fill: (p, b) => {
      servingBowl(k, p, (b.x0 + b.x1) / 2, b.floors[0], (b.z0 + b.z1) / 2, 0.85)
      plates(k, p, (b.x0 + b.x1) / 2, b.floors[1], (b.z0 + b.z1) / 2, 6, 'side', 'oatmeal')
    } },
    { kind: 'drawers', id: 'dining_unit_4', rows: [0.26, 0.52], fill: [
      (p, b) => cutlery(B, p, b),
      (p, b) => { for (let i = 0; i < 2; i++) k.box(p, b.x1 - b.x0 - 0.06, 0.03, 0.34, m.accents[i], (b.x0 + b.x1) / 2, b.floors[0] + 0.015 + i * 0.031, (b.z0 + b.z1) / 2) },
      undefined,
    ] },
  ]
  bx([0, w], [0, 0.08], [0.02, BI.d - 0.04], m.dark, false, g)
  // Fronts are split in pairs within the middle bays: two 300 mm doors, so they open clear of the chairs.
  units.forEach((unit, i) => {
    const pair = unit.kind === 'door' ? 2 : 1
    for (let j = 0; j < pair; j++) {
      const f = new Group()
      const uw = bw / pair
      f.position.set(i * bw + j * uw, 0.08, BI.d)
      g.add(f)
      const u: Unit = unit.kind === 'door' ? { ...unit, id: `${unit.id}_${j + 1}`, hinge: j === 0 ? 'left' : 'right', fill: j === 0 ? unit.fill : undefined } : unit
      cabinet(k, f, uw, BI.base - 0.08, BI.d, u, { front: m.oak(uw, BI.base), interior: m.interior, drawer: m.oakSolid })
      // A slim bronze pull on each front: upright by a door's free edge, level across a drawer's top.
      for (const o of f.children.filter((c) => /^(door_|drawer_)/.test(c.name))) {
        if (o.name.startsWith('door_')) {
          const fx = u.kind === 'door' && u.hinge === 'left' ? uw - 0.04 : -uw + 0.04
          k.box(o, 0.012, 0.12, 0.014, m.bronze, fx, BI.base - 0.08 - 0.12, 0.007)
        } else k.box(o, 0.14, 0.012, 0.014, m.bronze, uw / 2, drawerTop(o) - 0.03, 0.007)
      }
    }
  })
  // Oak top, and the open shelving above: oak back, sides and shelves, LEDs under each shelf front.
  bx([0, w], [BI.base, BI.base + 0.035], [0, BI.d + 0.015], m.oak(w, BI.d), true, g)
  const y0 = BI.base + 0.035
  bx([0, w], [y0, BI.top], [0, 0.018], m.oak(w, BI.top - y0), true, g)
  for (const x of [0, w / 3, (2 * w) / 3, w]) bx([Math.max(0, x - 0.012), Math.min(w, x + 0.012)], [y0, BI.top], [0.018, BI.shelfD], m.oak(BI.shelfD, BI.top - y0), true, g)
  bx([0, w], [BI.top, BI.top + 0.03], [0, BI.shelfD], m.oak(w, BI.shelfD), true, g)
  const shelves = [1.32, 1.76, 2.2]
  for (const sy of shelves) {
    for (let i = 0; i < 3; i++) {
      const x0 = (i * w) / 3 + 0.012
      const x1 = ((i + 1) * w) / 3 - 0.012
      bx([x0, x1], [sy, sy + 0.025], [0.018, BI.shelfD], m.oak(x1 - x0, BI.shelfD), true, g)
      bx([x0 + 0.01, x1 - 0.01], [sy - 0.006, sy], [BI.shelfD - 0.04, BI.shelfD - 0.025], m.shelfLed, false, g)
    }
  }
  // LED under the top shelf's underside too, washing the countertop.
  bx([0.02, w - 0.02], [BI.top - 0.006, BI.top], [BI.shelfD - 0.04, BI.shelfD - 0.025], m.shelfLed, false, g)
  // Light styling, bay by bay, low to high: one or two pieces a shelf, no two alike.
  const bayX = (i: number) => ((i + 0.5) * w) / 3
  const z = 0.17
  const cy = BI.base + 0.035
  vessel(g, VASE, m.stoneware, 0.3, cy, z)
  books(B, g, 0.62, cy, z, 3, 0.1)
  vessel(g, BOWL, m.ceramicDark, 1.25, cy, z, 1.6)
  pottedPothos(k, g, 1.95, cy, z, 1.1, m.pot, 5)
  const s1 = shelves[0] + 0.025
  books(B, g, bayX(0) - 0.12, s1, z, 2)
  vessel(g, BOWL, m.ceramicWhite, bayX(0) + 0.15, s1, z)
  vessel(g, VASE, m.ceramicWhite, bayX(1) + 0.12, s1, z, 0.8)
  const s2 = shelves[1] + 0.025
  vessel(g, JUG, m.ceramicDark, bayX(0), s2, z, 1.1)
  books(B, g, bayX(1) - 0.1, s2, z, 4, -0.08)
  vessel(g, VASE, m.clay, bayX(2) - 0.08, s2, z, 0.75)
  const s3 = shelves[2] + 0.025
  vessel(g, BOTTLE, m.glassVase, bayX(0) - 0.1, s3, z, 0.9)
  pottedPothos(k, g, bayX(1), s3, z, 0.9, m.pot, 8)
}

/** The top of a drawer front, in the drawer's frame. */
function drawerTop(o: Object3D) {
  let top = 0
  o.traverse((c) => {
    if (c.userData.front && c instanceof Mesh) {
      c.geometry.computeBoundingBox()
      top = c.position.y + (c.geometry.boundingBox?.max.y ?? 0)
    }
  })
  return top
}

/** A drawer's cutlery: an oak organiser with forks, knives and spoons laid in its slots. */
function cutlery(B: BC, p: Group, b: Bay) {
  const { k, m } = B
  const cz = (b.z0 + b.z1) / 2
  k.box(p, b.x1 - b.x0 - 0.02, 0.008, b.z1 - b.z0 - 0.02, m.oakSolid, (b.x0 + b.x1) / 2, b.floors[0] + 0.004, cz)
  for (let i = 1; i < 4; i++) k.box(p, 0.008, 0.04, b.z1 - b.z0 - 0.04, m.oakSolid, b.x0 + ((b.x1 - b.x0) * i) / 4, b.floors[0] + 0.02, cz)
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) k.box(p, 0.016, 0.003, 0.19, m.plate, b.x0 + ((b.x1 - b.x0) * (i + 0.5)) / 4 + (j - 1) * 0.008, b.floors[0] + 0.01 + j * 0.003, cz)
}

/** The natural-stone dining table on two oak slab legs, eight upholstered chairs, and the places. */
function diningTable(B: BC) {
  const { bx, m, k, dining: g } = B
  const { x0, x1, z0, z1, h } = TABLE
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2
  const tw = x1 - x0
  const td = z1 - z0
  // Racetrack top: straight sides, round ends, 30 mm with an eased edge.
  const r = td / 2
  const slab = new Shape()
  slab.moveTo(-tw / 2 + r, -td / 2)
  slab.lineTo(tw / 2 - r, -td / 2)
  slab.absarc(tw / 2 - r, 0, r, -PI / 2, PI / 2, false)
  slab.lineTo(-tw / 2 + r, td / 2)
  slab.absarc(-tw / 2 + r, 0, r, PI / 2, (3 * PI) / 2, false)
  const topGeo = new ExtrudeGeometry(slab, { depth: 0.018, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 3, curveSegments: 24 })
  topGeo.rotateX(-PI / 2)
  // Extruded UVs are in metres; the stone's texture repeats once per 1.2 m.
  const uv = topGeo.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 1.2, uv.getY(i) / 1.2)
  const top = new Mesh(topGeo, m.travertine(1.2, 1.2))
  top.position.set(cx, h - 0.024, cz)
  top.castShadow = top.receiveShadow = true
  g.add(top)
  // Two oak slab legs, set in from the ends, with a rail between them under the top.
  for (const lx of [x0 + 0.42, x1 - 0.42]) {
    const leg = k.soft(g, 0.09, h - 0.03, td - 0.36, 0.02, m.oak(0.6, h), lx, (h - 0.03) / 2, cz)
    leg.castShadow = true
  }
  bx([x0 + 0.42, x1 - 0.42], [h - 0.09, h - 0.03], [cz - 0.03, cz + 0.03], m.oakSolid, true, g)

  // Six chairs, drawn up: two a side and one at each end; the back row clears the cabinet doors.
  const sm: SeatMats = { oak: m.oakSolid, chair: m.chair, linen: m.linen, lounge: m.lounge, accents: m.accents, dark: m.dark }
  const side = [x0 + 0.4, x1 - 0.4]
  for (const x of side) diningChair(k, g, x, z0 - 0.12, 0, sm)
  for (const x of side) diningChair(k, g, x, z1 + 0.12, PI, sm)
  diningChair(k, g, x0 - 0.12, cz, PI / 2, sm)
  diningChair(k, g, x1 + 0.12, cz, -PI / 2, sm)

  // Places for six, plates 200 mm in from the edge.
  for (const x of side) placeSetting(k, g, x, h, z0 + 0.2, PI, m.bronze)
  for (const x of side) placeSetting(k, g, x, h, z1 - 0.2, 0, m.bronze)
  placeSetting(k, g, x0 + 0.2, h, cz, -PI / 2, m.bronze, true)
  placeSetting(k, g, x1 - 0.2, h, cz, PI / 2, m.bronze, true)
  // Centrepiece, as the board: a single small plant in a white pot.
  pottedPothos(k, g, cx, h, cz, 0.75, m.ceramicWhite, 12)
}

/** Elevation E2: the abstract canvas between two bronze wall sconces, and the dome pendants. */
function diningWall(B: BC) {
  const { m, k, dining: g } = B
  // The dining wall is the hall's right wall beside the table, facing it.
  const cz = (PASS + D - 3.2) / 2
  const art = new Group()
  art.position.set(W - 0.005, 1.55, cz)
  art.rotation.y = -PI / 2
  g.add(art)
  // Stretched canvas in a slim oak floater frame.
  k.box(art, 0.84, 0.62, 0.035, m.oakSolid, 0, 0, 0.0175)
  k.box(art, 0.8, 0.58, 0.004, m.canvas, 0, 0, 0.036)
  // Sconces: a bronze backplate and arm carrying an opal half-shade, uplighting the wall.
  for (const s of [-1, 1]) {
    const sc = new Group()
    sc.position.set(W - 0.005, 1.7, cz + s * 0.55)
    sc.rotation.y = -PI / 2
    g.add(sc)
    k.cyl(sc, 0.05, 0.05, 0.012, m.bronze, 0, 0, 0.006, 24).rotation.x = PI / 2
    k.box(sc, 0.012, 0.012, 0.1, m.bronze, 0, 0, 0.06)
    vessel(sc, [[0, -0.06], [0.06, -0.06], [0.075, 0.02], [0.07, 0.02], [0.055, -0.052], [0, -0.052]], m.bronze, 0, 0, 0.12)
    k.sphere(sc, 0.05, m.sconceGlow, 0, 0.0, 0.12).scale.y = 0.6
  }

  // Two bronze dome pendants over the table, opal diffusers glowing inside.
  const pz = (TABLE.z0 + TABLE.z1) / 2
  for (const px of [TABLE.x0 + 0.5, TABLE.x1 - 0.5]) {
    const y = 1.58
    k.cyl(g, 0.0012, 0.0012, H - y - 0.18, m.black, px, (H + y + 0.18) / 2, pz, 4).castShadow = false
    k.cyl(g, 0.04, 0.04, 0.012, m.bronze, px, H - 0.006, pz, 20)
    vessel(g, [[0.012, 0.18], [0.05, 0.17], [0.12, 0.12], [0.17, 0.04], [0.19, 0.0], [0.185, 0.0], [0.165, 0.035], [0.115, 0.112], [0.048, 0.163], [0.012, 0.172]], m.bronze, px, y, pz)
    const inner = new Mesh(new CylinderGeometry(0.16, 0.16, 0.004, 32), m.domeInner)
    inner.position.set(px, y + 0.03, pz)
    g.add(inner)
  }
}

/* ---------- Living ---------- */

/** Elevation E1: the slatted TV panel over a floating console, lit display niches either side. */
function tvWall(B: BC) {
  const { bx, m, k, living: g } = B
  const p0 = TV.z - TV.panel / 2
  const p1 = TV.z + TV.panel / 2
  bx([0, 0.035], [0, H], [p0, p1], m.slats(TV.panel, H), true, g)
  // Niches: oak boxes with oak shelves, an LED line under each, a closed base below.
  const niche = (z0: number, z1: number, id: string, drawers: boolean) => {
    const d = TV.d
    bx([0, 0.018], [0, H], [z0, z1], m.oak(z1 - z0, H), true, g)
    bx([0.018, d], [0, H], [z0, z0 + 0.02], m.oak(d, H), true, g)
    bx([0.018, d], [0, H], [z1 - 0.02, z1], m.oak(d, H), true, g)
    for (const sy of [0.98, 1.48, 1.98]) {
      bx([0.018, d], [sy, sy + 0.025], [z0 + 0.02, z1 - 0.02], m.oak(d, z1 - z0), true, g)
      bx([d - 0.04, d - 0.025], [sy - 0.006, sy], [z0 + 0.03, z1 - 0.03], m.tvLed, false, g)
    }
    // Base cupboard (or drawers), its front flush with the niche.
    const f = new Group()
    f.position.set(d, 0.08, z1 - 0.02)
    f.rotation.y = PI / 2
    g.add(f)
    const nw = z1 - z0 - 0.04
    const unit: Unit = drawers ? { kind: 'drawers', id, rows: [0.38] } : { kind: 'door', id, hinge: 'right', shelves: [0.38] }
    cabinet(k, f, nw, 0.88, d - 0.02, unit, { front: m.oak(nw, 0.88), interior: m.interior, drawer: m.oakSolid })
    bx([0.018, d - 0.02], [0, 0.08], [z0 + 0.02, z1 - 0.02], m.dark, false, g)
    bx([0.018, d], [0.96, 0.98], [z0 + 0.02, z1 - 0.02], m.oak(d, z1 - z0), true, g)
  }
  niche(p0 - TV.niche, p0, 'living_niche_1', false)
  niche(p1, p1 + TV.niche, 'living_niche_2', true)
  // Styling the niches: ceramics, books, a trailing plant.
  const n1 = p0 - TV.niche / 2
  const n2 = p1 + TV.niche / 2
  const x = 0.17
  vessel(g, VASE, m.ceramicWhite, x, 1.005, n1)
  books(B, g, x, 1.505, n1, 3, 0.2)
  pottedPothos(k, g, x, 1.005, n2, 1.0, m.pot, 4)
  vessel(g, JUG, m.stoneware, x, 1.505, n2)

  // Television: a slim 55″ panel off the slats, with a warm LED wash behind it.
  const tv = new Group()
  tv.position.set(0.07, 1.34, TV.z)
  tv.rotation.y = PI / 2
  g.add(tv)
  k.box(tv, 1.232, 0.712, 0.024, m.dark, 0, 0, -0.012)
  k.box(tv, 1.222, 0.702, 0.002, m.screen, 0, 0, 0.001, false)
  k.box(tv, 1.1, 0.6, 0.004, m.tvLed, 0, 0, -0.03, false)
  k.box(tv, 0.3, 0.2, 0.03, m.dark, 0, 0, -0.035)

  // Floating console across the panel: two handle-less oak drawers on a dark rail, an oak top.
  const cw = TV.panel
  const f = new Group()
  f.position.set(0.42, 0.24, TV.z + cw / 2)
  f.rotation.y = PI / 2
  g.add(f)
  for (let i = 0; i < 2; i++) {
    const u = new Group()
    u.position.x = i * (cw / 2)
    f.add(u)
    cabinet(k, u, cw / 2, 0.3, 0.38, {
      kind: 'drawers', id: `living_console_${i + 1}`, rows: [], fill: [(p, b) => {
        const cz = (b.z0 + b.z1) / 2
        // Remotes, a coaster set and magazines, as a console drawer really holds.
        k.box(p, 0.045, 0.018, 0.17, m.dark, b.x0 + 0.06, b.floors[0] + 0.009, cz)
        k.box(p, 0.04, 0.016, 0.14, m.book[2], b.x0 + 0.13, b.floors[0] + 0.008, cz + 0.02)
        k.box(p, 0.23, 0.012, 0.3, m.book[i ? 1 : 3], b.x1 - 0.14, b.floors[0] + 0.006, cz)
        k.cyl(p, 0.05, 0.05, 0.03, m.oakSolid, b.x0 + 0.24, b.floors[0] + 0.015, cz - 0.08, 20)
      }],
    }, { front: m.oak(cw / 2, 0.3), interior: m.interior, drawer: m.oakSolid })
  }
  bx([0.035, 0.06], [0.24, 0.54], [TV.z - cw / 2 + 0.05, TV.z + cw / 2 - 0.05], m.dark, false, g)
  bx([0.035, 0.43], [0.54, 0.558], [TV.z - cw / 2, TV.z + cw / 2], m.oak(cw, 0.4), true, g)
  books(B, g, 0.22, 0.558, TV.z + 0.5, 2, 0.12)
  vessel(g, VASE, m.ceramicDark, 0.22, 0.558, TV.z - 0.52, 0.8)
}

/** Sofa, lounge chair, coffee table, rug and the floor plants. */
function lounge(B: BC) {
  const { bx, m, k, living: g } = B
  const sm: SeatMats = { oak: m.oakSolid, chair: m.chair, linen: m.linen, lounge: m.lounge, accents: m.accents, dark: m.dark }
  // A large wool rug under the coffee table and the sofa's front legs.
  bx([0.5, 3.0], [0.002, 0.016], [2.75, 4.6], m.rug(2.5, 1.85), false, g)
  // A straight three-seat sofa faces the TV wall, its back to the wall.
  sectional(k, g, SOFA.back - SOFA.deep / 2, (SOFA.z0 + SOFA.z1) / 2, -PI / 2, sm, SOFA.z1 - SOFA.z0, SOFA.deep, 0)
  // The taupe lounge chair in the corner by the tall window, turned to the room.
  loungeChair(k, g, 0.62, D - 0.42, (3 * PI) / 4, sm)

  // Round coffee table: a travertine top on a fluted oak drum.
  const cx = 1.06
  const cz = TV.z
  const R0 = 0.36
  const top = new Mesh(new LatheGeometry([[0, 0], [R0 - 0.01, 0], [R0, 0.008], [R0 + 0.002, 0.03], [R0 - 0.005, 0.038], [0, 0.038]].map(([r, h]) => new Vector2(r, h)), 64), m.travertine(2 * R0, 2 * R0))
  top.position.set(cx, 0.36, cz)
  top.castShadow = top.receiveShadow = true
  g.add(top)
  k.cyl(g, 0.2, 0.22, 0.36, m.oak(1.3, 0.36), cx, 0.18, cz, 40)
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * PI * 2
    k.box(g, 0.012, 0.34, 0.02, m.oakSolid, cx + Math.cos(a) * 0.216, 0.18, cz + Math.sin(a) * 0.216).rotation.y = PI / 2 - a
  }
  // On it: books and a low bowl.
  books(B, g, cx - 0.12, 0.398, cz + 0.1, 2, 0.3)
  servingBowl(k, g, cx + 0.14, 0.398, cz - 0.08, 0.6)

  // The fiddle-leaf fig beside the main door.
  fiddleLeafFig(k, g, 3.58, 0, D - 0.35, 1, m.pot, 3)
}

/** Sheer curtains: the tall window's, drawn to each side, and the side window's, to one side. */
function sheers(B: BC) {
  const { m, k, hall } = B
  const sheer = (axis: 'x' | 'z', a0: number, a1: number, plane: number, h0: number, h1: number) => {
    // Gathered fabric: a pleated sheet, the folds deepening towards the hem.
    const w = a1 - a0
    const geo = new PlaneGeometry(w, h1 - h0, Math.max(8, Math.round(w / 0.012)), 12)
    const p = geo.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i)
      const y = p.getY(i)
      const depth = 0.022 + 0.01 * (0.5 - y / (h1 - h0))
      p.setZ(i, depth * Math.sin((x / 0.075) * PI * 2) + 0.004 * Math.sin(x * 61 + y * 3))
    }
    geo.computeVertexNormals()
    const s = new Mesh(geo, m.sheer)
    s.renderOrder = 1
    if (axis === 'x') s.position.set((a0 + a1) / 2, (h0 + h1) / 2, plane)
    else {
      s.position.set(plane, (h0 + h1) / 2, (a0 + a1) / 2)
      s.rotation.y = PI / 2
    }
    hall.add(s)
    if (axis === 'x') k.box(hall, w + 0.06, 0.02, 0.03, m.black, (a0 + a1) / 2, H - 0.01, plane)
    else k.box(hall, 0.03, 0.02, w + 0.06, m.black, plane, H - 0.01, (a0 + a1) / 2)
  }
  sheer('x', 0.55, 0.84, D - 0.1, 0.02, H - 0.03)
  sheer('x', 1.91, 2.2, D - 0.1, 0.02, H - 0.03)
  // The side window's sheer is drawn to its far side, clear of the cabinetry's drawers.
  sheer('z', WIN.z1 + 0.05, WIN.z1 + 0.4, 0.11, 0.02, H - 0.03)
}

/** Switch plates: the dining room's by the bedroom door, the living room's by the main door. */
function switches(B: BC) {
  const { m, k, c } = B
  const mats = { plate: m.plate, rocker: m.rocker, dark: m.dark, locator: m.locator }
  // Dining: pendants; sconces and cabinetry LEDs; ceiling spots.
  const dp = switchPlate(k, B.dining, 'dining', ['switch', 'switch', 'switch'], mats, [c.pendant, c.ambient, c.diningSpots])
  dp.position.set(3.64, 1.2, 0.0005)
  // Living: spots and wall washers; the coffer's cove; the TV wall's LEDs; and a socket.
  const lp = switchPlate(k, B.living, 'living', ['switch', 'switch', 'switch', 'socket'], mats, [c.livingSpots, c.cove, c.tvWall])
  lp.position.set(W - 0.0005, 1.2, D - 0.565)
  lp.rotation.y = -PI / 2
}

/** The hall's real lights: eight in all, so both rooms are lit together from either one. */
function lights(B: BC) {
  const { c, ctx, dining, living } = B
  const add = (p: Group, x: number, h: number, z: number, intensity: number, distance: number, color = '#ffd6a8') => {
    const l = new PointLight(color, intensity, distance, 2)
    l.position.set(x, h, z)
    p.add(l)
    ctx.lighting.light(l, 1)
    return l
  }
  const cz = (TABLE.z0 + TABLE.z1) / 2
  c.pendant.lights.push(add(dining, (TABLE.x0 + TABLE.x1) / 2, 1.45, cz, 3.4, 3.4, '#ffd9a8'))
  c.ambient.lights.push(add(dining, 1.6, 1.8, 0.9, 2.2, 3.4, '#ffc890'))
  c.diningSpots.lights.push(add(dining, 1.4, 2.75, 1.3, 3.6, 5.5, '#fff0dc'))
  c.livingSpots.lights.push(add(living, 0.6, 2.75, TV.z, 2.6, 3.4, '#fff0dc'), add(living, 2.5, 2.75, D - 1.2, 3.6, 5, '#fff0dc'))
  c.cove.lights.push(add(living, 1.45, 2.85, D - 1.6, 3.4, 4.8, '#ffd6a8'))
  // The TV wall's lamp sits behind the panel, washing the slats and niches.
  c.tvWall.lights.push(add(living, 0.06, 1.4, TV.z, 1.0, 1.6, '#ffc98a'))
  // Daylight from the tall window and the side window, as one soft cool fill across the hall.
  add(living, 1.4, 2.1, D / 2, 3, 6, '#e6edf5')
}
