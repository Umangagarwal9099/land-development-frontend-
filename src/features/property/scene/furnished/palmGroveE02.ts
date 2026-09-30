import { BoxGeometry, CylinderGeometry, Group, IcosahedronGeometry, InstancedMesh, Mesh, MeshBasicMaterial, Object3D, PointLight, TorusKnotGeometry } from 'three'
import { GOLD } from '../../../../lib/palette'
import { FACE, FLOOR_Y, Kit, PI, WALL_H } from './kit'
import { buildWalls, type Wall } from './walls'

/*
 * Palm Grove Farmhouse, Plot E-02: luxury modern farmhouse interior design model.
 *
 * Plan in metres, x across the house, +z towards the verandah and pool (the showroom's "front").
 * The Great Room (x -10..0), Kitchen (0..10, z -5..0), Bedroom 1 (0..10, z 0..5), pool, orchard
 * and parking keep the positions and sizes of the project's placeholder model; the bedroom wing
 * behind the Great Room, the verandah and the courts complete the 3-bed, 3,000 sq ft brief.
 */

/** Site extent for the plinth and camera bounds. */
export const SITE = { minX: -27, maxX: 24, minZ: -18, maxZ: 21 }

const T_EXT = 0.3
const T_INT = 0.15

// Axis-aligned walls; openings are given as ranges along the wall's own axis.
const WALLS: Wall[] = [
  { a: [-10, 5], b: [10, 5], t: T_EXT, o: [[-9.4, -6.6, 'glass'], [-5.6, -4.4, 'door'], [-3.6, -0.6, 'glass'], [0.6, 2.6, 'window', 0.75], [3.2, 7.0, 'glass'], [7.9, 9.6, 'window', 0.9]] },
  { a: [10, -5], b: [10, 5], t: T_EXT, o: [[1.0, 2.2, 'window', 1.5], [3.2, 4.6, 'window', 0.9]] },
  { a: [0, -5], b: [10, -5], t: T_EXT, o: [[1.0, 4.6, 'window', 1.05], [5.1, 6.0, 'door'], [7.8, 9.2, 'window', 1.05]] },
  { a: [0, -13], b: [0, -5], t: T_EXT, o: [[-11.3, -5.2, 'glass']] },
  { a: [-10, -13], b: [0, -13], t: T_EXT, o: [[-9.0, -6.0, 'window', 0.45], [-4.2, -2.2, 'window', 0.6], [-1.1, -0.4, 'window', 1.7]] },
  { a: [-10, -13], b: [-10, 5], t: T_EXT, o: [[-12.3, -9.3, 'glass'], [-7.9, -5.7, 'window', 0.45], [-4.2, -1.8, 'window', 0.45], [2.9, 4.4, 'window', 0.45]] },
  { a: [-10, -5], b: [-1.5, -5], t: T_INT },
  { a: [0, -5], b: [0, 0], t: T_INT, o: [[-4.4, -0.6, 'open']] },
  { a: [0, 0], b: [0, 5], t: T_INT, o: [[0.4, 1.4, 'door']] },
  { a: [0, 0], b: [10, 0], t: T_INT },
  { a: [7, -5], b: [7, 0], t: T_INT, o: [[-1.3, -0.4, 'door']] },
  { a: [7.6, 0], b: [7.6, 2.8], t: T_INT, o: [[1.9, 2.7, 'door']] },
  { a: [7.6, 2.8], b: [10, 2.8], t: T_INT },
  { a: [-1.5, -13], b: [-1.5, -5], t: T_INT, o: [[-8.5, -7.7, 'door'], [-10.2, -9.2, 'door']] },
  { a: [-1.5, -11.5], b: [0, -11.5], t: T_INT, o: [[-1.3, -0.5, 'door']] },
  { a: [-5.5, -7.6], b: [-1.5, -7.6], t: T_INT, o: [[-3.4, -2.6, 'door']] },
  { a: [-5.5, -8.6], b: [-5.5, -5], t: T_INT, o: [[-8.5, -7.8, 'open']] },
  { a: [-10, -8.6], b: [-1.5, -8.6], t: T_INT },
  { a: [-5, -13], b: [-5, -8.6], t: T_INT, o: [[-9.5, -8.7, 'door']] },
  { a: [-5, -10.4], b: [-1.5, -10.4], t: T_INT, o: [[-3.6, -2.8, 'door']] },
]

type Zone = [x0: number, x1: number, z0: number, z1: number]

/**
 * Tappable room hotspots, keyed by the mesh names the property's rooms refer to. Zones of one
 * room may be split so no two rooms overlap.
 */
const HOTSPOTS: Record<string, { y: number; zones: Zone[] }> = {
  room_foyer: { y: FLOOR_Y, zones: [[-6.2, -3.8, 2.6, 5]] },
  room_living: { y: FLOOR_Y, zones: [[-10, -6.2, -1, 5], [-6.2, -5, -1, 2.6]] },
  room_family: { y: FLOOR_Y, zones: [[-3.8, 0, -1, 5], [-5, -3.8, -1, 2.6]] },
  room_dining: { y: FLOOR_Y, zones: [[-10, 0, -5, -1]] },
  room_kitchen: { y: FLOOR_Y, zones: [[0, 10, -5, 0]] },
  room_bed_1: { y: FLOOR_Y, zones: [[3, 7.6, 0, 5], [7.6, 10, 0, 5]] },
  room_study: { y: FLOOR_Y, zones: [[0, 3, 0, 5]] },
  room_gallery: { y: FLOOR_Y, zones: [[-1.5, 0, -13, -5]] },
  room_bed_master: { y: FLOOR_Y, zones: [[-10, -5, -13, -8.6], [-5, -1.5, -10.4, -8.6]] },
  room_bath_master: { y: FLOOR_Y, zones: [[-5, -1.5, -13, -10.4]] },
  room_bed_3: { y: FLOOR_Y, zones: [[-10, -5.5, -8.6, -5], [-5.5, -1.5, -8.6, -5]] },
  amenity_verandah: { y: FLOOR_Y, zones: [[-10, 10, 5.15, 8.6]] },
  amenity_pool: { y: 0.08, zones: [[-9, 9, 8.6, 17.2], [9, 11.8, 9.6, 14.4]] },
  amenity_court: { y: 0.04, zones: [[0.15, 10, -13, -5.15]] },
  amenity_garden: { y: 0.01, zones: [[-25, -11, -10, 18]] },
}

// Warm interior lights, one per space, at 2700 K-ish colour; always on (the showroom is at dusk).
const LIGHTS: [x: number, y: number, z: number, intensity: number][] = [
  [-5, 2.2, 3.4, 5], [-7.6, 2.3, 1.3, 5], [-1.9, 2.3, 3.1, 4], [-5.2, 1.9, -2.6, 5], [3, 1.9, -2.2, 5], [5, 2.2, 2.0, 4.5],
  [-7, 2.2, -11, 4.5], [-7.6, 2.2, -6.6, 4], [-0.75, 2.1, -8.3, 3], [-3.3, 2.1, -11.7, 3.5], [-5, 2.35, 7, 4], [4, 2.35, 7, 4],
]

export interface FurnishedModel {
  root: Group
  /** Hotspot overlay material per room mesh name, used to highlight the selection. */
  highlights: Map<string, MeshBasicMaterial>
  /** Switches the model's own lights between the evening scheme and daylight. */
  setDaylight?: (daylight: boolean) => void
}

export function buildPalmGroveE02(): FurnishedModel {
  const root = new Group()
  root.name = 'palm_grove_e02'
  const house = new Group()
  house.name = 'floor_G'
  const site = new Group()
  site.name = 'outdoor'
  root.add(site, house)

  const k = new Kit(house)
  const outside = new Kit(site, k)

  buildGrounds(outside)
  buildShell(k)
  buildGreatRoom(k)
  buildKitchen(k)
  buildBedroomOne(k)
  buildWing(k)
  buildOutdoors(outside)

  for (const [x, y, z, intensity] of LIGHTS) {
    const l = new PointLight('#ffc98a', intensity, 8, 2)
    l.position.set(x, FLOOR_Y + y, z)
    house.add(l)
  }
  const fire = new PointLight('#ff8a3d', 3, 5, 2)
  fire.position.set(-9.1, FLOOR_Y + 0.7, 1.3)
  house.add(fire)

  const highlights = new Map<string, MeshBasicMaterial>()
  for (const [name, { y, zones }] of Object.entries(HOTSPOTS)) {
    const g = new Group()
    g.name = name
    const mat = new MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0, depthWrite: false })
    for (const [x0, x1, z0, z1] of zones) {
      const s = new Mesh(new BoxGeometry(x1 - x0, 0.01, z1 - z0), mat)
      s.position.set((x0 + x1) / 2, y + 0.02, (z0 + z1) / 2)
      s.renderOrder = 2
      g.add(s)
    }
    ;(name.startsWith('room_') ? house : site).add(g)
    highlights.set(name, mat)
  }

  return { root, highlights }
}

/* ------------------------------------------------------------------ */

function buildGrounds(k: Kit) {
  const { m } = k
  const r = k.root
  const w = SITE.maxX - SITE.minX
  const d = SITE.maxZ - SITE.minZ
  k.box(r, w, 0.02, d, k.finish('grass', w / 3, d / 3, 1), (SITE.minX + SITE.maxX) / 2, 0.0, (SITE.minZ + SITE.maxZ) / 2, false)
  // Verandah in leather-finish Kota, flush with the interior floor.
  k.box(r, 20.3, 0.1, 3.45, k.finish('kota', 20 / 0.9, 3.45 / 0.9, 0.6), 0, FLOOR_Y - 0.05, 6.875, false)
  // Travertine pool deck around the model's 14 × 6 m pool, plus the cabana pad.
  for (const [x0, x1, z0, z1] of [[-9, 9, 8.6, 9], [-9, 9, 15, 17.2], [-9, -7, 9, 15], [7, 9, 9, 15], [9, 11.8, 9.6, 14.4]])
    k.box(r, x1 - x0, 0.08, z1 - z0, k.finish('travertineTile', (x1 - x0) / 1.6, (z1 - z0) / 0.8, 0.6), (x0 + x1) / 2, 0.04, (z0 + z1) / 2, false)
  k.box(r, 14, 0.04, 6, m.water, 0, 0.03, 12, false)
  k.box(r, 14, 0.02, 6, k.finish('kota', 1, 1, 0.9), 0, 0.005, 12, false)
  // Kitchen court gravel and the parking court.
  k.box(r, 9.85, 0.04, 7.85, k.finish('gravel', 6, 5, 1), 5.075, 0.02, -9.075, false)
  k.box(r, 8, 0.03, 12, k.finish('gravel', 5, 8, 1), 17, 0.015, 0, false)
}

function buildShell(k: Kit) {
  const { m } = k
  const r = k.root
  // Stone plinth under the house and wing.
  k.box(r, 20.3, 0.13, 10.15, m.travertine, 0, FLOOR_Y - 0.085, -0.075, false)
  k.box(r, 10.3, 0.13, 8.15, m.travertine, -5, FLOOR_Y - 0.085, -9.075, false)

  const floor = (x0: number, x1: number, z0: number, z1: number, mat: ReturnType<Kit['finish']>) =>
    k.box(r, x1 - x0, 0.02, z1 - z0, mat, (x0 + x1) / 2, FLOOR_Y - 0.01, (z0 + z1) / 2, false)
  const trav = (x0: number, x1: number, z0: number, z1: number) => floor(x0, x1, z0, z1, k.finish('travertineTile', (x1 - x0) / 1.6, (z1 - z0) / 0.8, 0.42))
  const oak = (x0: number, x1: number, z0: number, z1: number) => floor(x0, x1, z0, z1, k.finish('oak', (x1 - x0) / 0.88, (z1 - z0) / 2.4, 0.5))
  const marble = (x0: number, x1: number, z0: number, z1: number) => floor(x0, x1, z0, z1, k.finish('marble', (x1 - x0) / 1.2, (z1 - z0) / 1.2, 0.3))
  trav(-10, 0, -5, 5)
  trav(0, 10, -5, 0)
  trav(-1.5, 0, -11.5, -5)
  trav(-5.5, -1.5, -7.6, -5)
  oak(0, 7.6, 0, 5)
  oak(7.6, 10, 2.8, 5)
  oak(-10, -5.5, -8.6, -5)
  oak(-5.5, -1.5, -8.6, -7.6)
  oak(-10, -5, -13, -8.6)
  oak(-5, -1.5, -10.4, -8.6)
  marble(7.6, 10, 0, 2.8)
  marble(-5, -1.5, -13, -10.4)
  floor(-1.5, 0, -13, -11.5, m.basalt)

  // Walls: plaster faces with a dark section cap on the cut top, openings left as gaps or glazing.
  buildWalls(k, WALLS, {
    height: WALL_H,
    faces: [m.plaster, m.plaster, m.wallCap, m.plaster, m.plaster, m.plaster],
    sill: m.plaster,
    glass: m.glass,
    frame: m.frame,
  })
}

function buildGreatRoom(k: Kit) {
  const { m } = k
  const r = k.root
  const { west, east, north, south } = FACE

  // Fireplace: book-matched travertine chimney breast, basalt firebox, long hearth ledge.
  const fp = k.at(-9.65, 1.3)
  k.box(fp, 0.4, WALL_H, 2.4, k.finish('travertine', 1, 2, 0.5), 0, WALL_H / 2, 0)
  k.box(fp, 0.06, 0.52, 1.3, m.basalt, 0.2, 0.62, 0, false)
  k.box(fp, 0.02, 0.36, 1.1, m.fire, 0.235, 0.56, 0, false)
  k.box(fp, 0.55, 0.3, 2.8, m.travertine, 0.05, 0.15, 0)
  k.cyl(fp, 0.14, 0.1, 0.55, m.ceramic, 0.1, 0.58, -1.05)
  k.cyl(fp, 0.11, 0.14, 0.38, m.basalt, 0.1, 0.5, 1.1)

  // Living: LV-01 sofa to the fire, LV-02 lounge chairs, LV-03 nested tables, LV-04 console.
  k.rug(-7.6, 1.3, 3.4, 4.2, '#d6ccbb', '#8b8a6c', 31)
  k.sofa(-6.45, 1.3, west, 3.2, 1.05, m.boucle)
  const console_ = k.cabinet(-5.7, 1.3, west, 2.6, 0.38, 0.7, k.fluted('flutedWalnut', 2.6), m.bronze)
  k.cyl(console_, 0.07, 0.08, 0.28, m.ceramic, -0.9, 0.86, 0)
  k.cyl(console_, 0.05, 0.05, 0.22, m.basalt, 0.8, 0.83, 0)
  k.loungeChair(-8.5, -0.45, south)
  k.loungeChair(-8.5, 3.05, north)
  k.drumTable(-7.75, 1.0, 0.55, 0.38, m.travertine)
  k.drumTable(-7.25, 1.95, 0.33, 0.3, m.walnut)
  k.drumTable(-6.5, -0.6, 0.24, 0.5, m.bronze)
  k.drumTable(-6.5, 3.2, 0.24, 0.5, m.bronze)
  k.floorLamp(-9.35, -0.85)
  k.plant(-9.35, 4.45, 1.1, true)

  // Foyer: FY-01 travertine drum table on the arrival axis under the smoked-glass chandelier.
  const fy = k.at(-5, 3.4)
  k.cyl(fy, 0.6, 0.6, 0.05, m.travertine, 0, 0.735, 0, 56)
  k.cyl(fy, 0.32, 0.42, 0.71, m.travertine, 0, 0.355, 0)
  k.cyl(fy, 0.1, 0.16, 0.5, m.ceramic, 0.1, 1.0, 0)
  for (let i = 0; i < 7; i++) k.cyl(fy, 0.006, 0.006, 0.9, m.trunk, 0.1 + Math.sin(i) * 0.08, 1.6, Math.cos(i * 1.7) * 0.08, 5).rotation.z = (i - 3) * 0.12
  k.chandelier(-5, 3.4, 2.12)

  // Family lounge: FL-02 fluted walnut media wall and floating console, FL-01 sofa, FL-03 swivel chair.
  k.box(r, 0.06, WALL_H, 3.0, k.fluted('flutedWalnut', 3.0), -0.105, FLOOR_Y + WALL_H / 2, 3.1)
  k.box(r, 0.04, 0.96, 1.7, m.black, -0.155, FLOOR_Y + 1.3, 3.1)
  const media = k.cabinet(-0.4, 3.1, west, 2.8, 0.45, 0.34, k.fluted('flutedWalnut', 2.8), m.travertine, 0)
  media.position.y += 0.2
  k.rug(-1.9, 3.1, 3.0, 3.4, '#b9ae9b', '#6f7358', 33)
  k.sofa(-2.95, 3.1, east, 2.6, 1.0, m.linen)
  const ct = k.at(-1.75, 3.1, east)
  k.box(ct, 1.3, 0.33, 0.7, m.travertine, 0, 0.18, 0)
  k.box(ct, 1.31, 0.03, 0.71, m.bronze, 0, 0.345, 0)
  const swivel = k.at(-1.3, 1.05, Math.atan2(-0.9, 1.9))
  k.cyl(swivel, 0.3, 0.3, 0.04, m.bronze, 0, 0.02, 0)
  k.soft(swivel, 0.8, 0.3, 0.78, 0.12, m.boucle, 0, 0.3, 0)
  k.soft(swivel, 0.8, 0.4, 0.2, 0.1, m.boucle, 0, 0.55, -0.28)
  k.soft(k.at(-1.1, 4.35), 0.5, 0.38, 0.5, 0.12, m.leather, 0, 0.19, 0)
  k.floorLamp(-3.95, 4.55)

  // Dining: DN-01 walnut table on travertine pedestals, ten DN-02 chairs, DN-03 sideboard, art on axis.
  const tbl = k.at(-5.2, -2.6)
  k.box(tbl, 3.2, 0.06, 1.15, m.walnut, 0, 0.72, 0)
  for (const x of [-0.95, 0.95]) k.box(tbl, 0.26, 0.69, 0.78, m.travertine, x, 0.345, 0)
  k.cyl(tbl, 0.13, 0.09, 0.12, m.ceramic, -0.4, 0.81, 0)
  k.cyl(tbl, 0.2, 0.16, 0.08, m.bronze, 0.35, 0.79, 0)
  for (const dx of [-1.2, -0.4, 0.4, 1.2]) {
    k.diningChair(-5.2 + dx, -1.78, north)
    k.diningChair(-5.2 + dx, -3.42, south)
  }
  k.diningChair(-7.15, -2.6, east)
  k.diningChair(-3.25, -2.6, west)
  k.linearPendant(-5.2, -2.6, 1.95, 2.6)
  k.cabinet(-5.2, -4.67, south, 2.8, 0.5, 0.7, k.fluted('flutedWalnut', 2.8), m.quartzite, 0.1)
  k.artwork(-5.2, 1.62, -4.9, south, 1.8, 1.2, k.art(41, ['#d9cfbf', '#6b5442', '#8e7453', '#2f2d2a', '#6f7358']))
  k.plant(-9.35, -4.45, 1.05)
  k.plant(-0.55, -4.55, 0.9)
}

function buildKitchen(k: Kit) {
  const { m } = k
  const r = k.root
  const { west, south } = FACE

  // KT-02 counter run under the court window, with hob, sink and a quartzite upstand.
  const run = k.at(2.6, -4.525)
  k.box(run, 4.6, 0.84, 0.65, m.lacquer, 0, 0.46, 0)
  k.box(run, 4.6, 0.04, 0.67, m.quartzite, 0, 0.9, 0)
  k.box(run, 0.62, 0.006, 0.5, m.black, 0.9, 0.923, 0, false)
  k.box(run, 0.6, 0.02, 0.42, m.steel, -0.9, 0.915, 0, false)
  k.box(run, 4.6, 0.04, 0.02, k.glow, 0, 0.04, 0.33, false)
  k.box(r, 3.6, 0.15, 0.02, m.quartzite, 2.8, FLOOR_Y + 0.975, -4.84, false)

  // KT-02 tall wall: integrated fridge columns and ovens, with a lit oak niche.
  const tall = k.at(6.615, -2.85, west)
  k.box(tall, 2.9, 2.3, 0.62, m.lacquer, 0, 1.15, 0)
  k.box(tall, 0.9, 0.5, 0.02, m.black, 0.5, 1.25, 0.315, false)
  k.box(tall, 0.7, 0.9, 0.02, m.oak, -0.9, 1.3, 0.3, false)
  k.box(tall, 0.66, 0.02, 0.5, k.glow, -0.9, 1.73, 0.06, false)

  // KT-01 island: leathered quartzite with waterfall ends on a fluted smoked-oak base.
  const island = k.at(3.0, -2.2)
  k.box(island, 3.1, 0.86, 1.1, k.fluted('flutedOak', 3.1), 0, 0.45, 0)
  k.box(island, 3.2, 0.05, 1.2, m.quartzite, 0, 0.905, 0)
  for (const x of [-1.575, 1.575]) k.box(island, 0.05, 0.9, 1.2, m.quartzite, x, 0.45, 0)
  k.box(island, 0.5, 0.01, 0.38, m.steel, -0.6, 0.93, -0.2, false)
  k.cyl(island, 0.14, 0.1, 0.14, m.ceramic, 0.8, 1.0, 0.1)
  for (const x of [1.9, 2.63, 3.37, 4.1]) k.stool(x, -1.25)
  for (const x of [2.0, 3.0, 4.0]) k.globe(x, 1.9, -2.2)

  // Walk-in pantry and wet kitchen.
  const shelves = k.at(9.6, -2.2, west)
  k.box(shelves, 3.8, 2.1, 0.42, m.oak, 0, 1.05, 0)
  for (const y of [0.4, 0.8, 1.2, 1.6]) k.box(shelves, 3.7, 0.03, 0.4, m.oak, 0, y, 0.02)
  k.cabinet(8.4, -4.55, south, 2.4, 0.6, 0.86, m.lacquer, m.quartzite)
  const prep = k.at(8.2, -2.2)
  k.box(prep, 1.2, 0.86, 0.7, m.oak, 0, 0.43, 0)
  k.box(prep, 1.22, 0.04, 0.72, m.travertine, 0, 0.88, 0)
}

function buildBedroomOne(k: Kit) {
  const { m } = k
  const r = k.root
  const { west, north, south } = FACE

  // Garden Suite: fluted oak bed wall, BR-05 king bed, bench, lounge chair, dressing alcove.
  k.box(r, 4.4, WALL_H, 0.03, k.fluted('flutedOak', 4.4), 5.0, FLOOR_Y + WALL_H / 2, 0.09)
  k.rug(5.0, 1.9, 3.2, 3.0, '#c7bca8', '#9c8a78', 35)
  k.bed(5.0, 1.43, south, 2.0, 2.2, 3.4, m.stoneLinen, m.oak)
  k.nightstand(3.5, 0.52, south)
  k.nightstand(6.5, 0.52, south)
  const bench = k.at(5.0, 2.85)
  k.box(bench, 1.6, 0.08, 0.45, m.oak, 0, 0.38, 0)
  k.soft(bench, 1.6, 0.1, 0.45, 0.03, m.boucle, 0, 0.47, 0)
  for (const [a, b] of [[-0.72, -0.18], [0.72, -0.18], [-0.72, 0.18], [0.72, 0.18]]) k.cyl(bench, 0.015, 0.015, 0.34, m.bronze, a, 0.17, b, 6)
  k.loungeChair(7.0, 4.05, -PI * 0.7, m.oak, m.linen)
  k.wardrobe(8.8, 3.175, south, 2.2)
  const dresser = k.at(9.6, 4.05, west)
  k.box(dresser, 1.0, 0.05, 0.45, m.walnut, 0, 0.74, 0)
  k.box(dresser, 0.9, 0.3, 0.4, m.walnut, 0, 0.56, 0)
  k.box(dresser, 0.6, 0.8, 0.02, m.mirror, 0, 1.4, -0.2)
  k.artwork(3.5, 1.85, 0.13, south, 0.5, 0.65, k.art(44, ['#ece5d8', '#6f7358', '#8e7453']))
  k.artwork(6.5, 1.85, 0.13, south, 0.5, 0.65, k.art(45, ['#ece5d8', '#8a5a3a', '#6f7358']))

  // Study bay: ST-01 library desk facing the garden window, ST-02 lit oak library wall.
  k.desk(1.5, 4.25, north, 1.6, 0.7)
  k.deskChair(1.5, 3.55, south)
  const lib = k.at(0.275, 3.35, FACE.east)
  k.box(lib, 2.7, 2.3, 0.4, m.oak, 0, 1.15, 0)
  for (const y of [0.45, 0.85, 1.25, 1.65, 2.05]) k.box(lib, 2.6, 0.02, 0.02, k.glow, 0, y, 0.19, false)
  const spines = [m.olive, m.leather, m.boucle, m.basalt, m.throw]
  for (let s = 0; s < 4; s++)
    for (let b = 0; b < 9; b++) {
      const h = 0.2 + ((s * 9 + b) % 4) * 0.03
      k.box(lib, 0.035, h, 0.22, spines[(s * 3 + b) % spines.length], -1.15 + b * 0.085, 0.47 + s * 0.4 + h / 2 + 0.01, 0.05)
    }
  const lampG = k.at(1.95, 4.35)
  k.cyl(lampG, 0.05, 0.07, 0.02, m.bronze, 0, 0.77, 0)
  k.cyl(lampG, 0.008, 0.008, 0.4, m.bronze, 0, 0.96, 0, 6)
  k.sphere(lampG, 0.07, k.glow, 0, 1.18, 0)

  // Bath 1: fluted oak vanity, walk-in shower.
  k.vanity(8.5, 0.33, south, 1.2, k.fluted('flutedOak', 1.2), m.travertine)
  k.wc(9.6, 1.3, west)
  k.screen(8.9, 1.75, 9.85, 1.75)
  k.screen(8.9, 1.75, 8.9, 2.72)
}

function buildWing(k: Kit) {
  const { m } = k
  const r = k.root
  const { west, east, north, south } = FACE

  // Gallery: two lit works and a bronze sculpture on a travertine plinth at the end.
  k.artwork(-1.4, 1.2, -6.4, east, 1.0, 1.3, k.art(52, ['#d9cfbf', '#2f2d2a', '#8e7453']))
  k.artwork(-1.4, 1.35, -10.85, east, 0.5, 0.7, k.art(53, ['#e2d9ca', '#6b5442', '#6f7358']))
  const plinth = k.at(-0.35, -11.2)
  k.box(plinth, 0.34, 1.0, 0.34, m.travertine, 0, 0.5, 0)
  k.mesh(new TorusKnotGeometry(0.12, 0.04, 80, 10, 2, 3), m.bronze, plinth, 0, 1.2, 0)

  // Master suite: walnut bed wall, BR-01 bed, BR-03 TV-lift bench, MS-02 chaise, MS-01 desk.
  k.box(r, 0.03, WALL_H, 3.6, k.fluted('flutedWalnut', 3.6), -5.09, FLOOR_Y + WALL_H / 2, -11.1)
  k.rug(-6.7, -11.1, 3.4, 3.6, '#d2c7b5', '#8e7453', 37)
  k.bed(-6.42, -11.1, west, 2.0, 2.2, 3.0, m.taupe)
  k.nightstand(-5.33, -12.35, west)
  k.nightstand(-5.33, -9.85, west)
  const foot = k.at(-7.75, -11.1, west)
  k.box(foot, 1.8, 0.4, 0.5, m.walnut, 0, 0.2, 0)
  k.soft(foot, 1.8, 0.1, 0.5, 0.03, m.boucle, 0, 0.45, 0)
  const chaise = k.at(-8.9, -12.45)
  k.box(chaise, 1.4, 0.1, 0.6, m.walnut, 0, 0.12, 0)
  k.soft(chaise, 1.5, 0.16, 0.66, 0.06, m.boucle, 0, 0.28, 0)
  k.soft(chaise, 0.5, 0.4, 0.66, 0.1, m.boucle, -0.55, 0.46, 0).rotation.z = 0.5
  k.desk(-8.4, -8.975, north, 1.4, 0.6)
  k.deskChair(-8.4, -9.6, south)
  k.artwork(-8.4, 1.62, -8.71, north, 1.1, 0.75, k.art(58, ['#ede7dc', '#2f2d2a', '#9c8a78']))
  k.plant(-9.5, -9.9, 0.85)
  // Dressing room: BR-04 wardrobes and an ottoman.
  k.wardrobe(-2.9, -8.975, north, 2.6, 'flutedWalnut')
  k.cyl(k.at(-3.6, -9.75), 0.3, 0.3, 0.42, m.boucle, 0, 0.21, 0)

  // Master bath: freestanding tub under the window, marble vanity, walk-in shower.
  k.vanity(-4.65, -11.8, east, 1.6, m.walnut)
  k.tub(-3.3, -12.4, south)
  k.wc(-1.95, -12.5, west)
  k.screen(-2.6, -11.7, -1.575, -11.7)
  k.screen(-2.6, -11.7, -2.6, -10.5)
  k.globe(-3.3, 1.85, -12.4, 0.13)

  // Powder room: monolithic travertine basin and smoked mirror.
  const basin = k.at(-0.75, -12.62)
  k.box(basin, 0.6, 0.85, 0.4, m.travertine, 0, 0.425, 0)
  k.box(basin, 0.5, 0.7, 0.02, m.mirror, 0, 1.5, -0.21)
  k.wc(-0.45, -12.1, west)

  // Bedroom 3: olive mohair bed wall, BR-06 bed, desk under the window, fluted oak wardrobe.
  k.box(r, 0.03, WALL_H, 2.6, m.olive, -5.59, FLOOR_Y + WALL_H / 2, -6.4)
  k.rug(-7.4, -6.4, 2.4, 3.0, '#c9bda9', '#6f7358', 39)
  k.bed(-6.87, -6.4, west, 1.8, 2.1, 2.6, m.olive, m.oak)
  k.nightstand(-5.83, -7.5, west)
  k.nightstand(-5.83, -5.3, west)
  k.wardrobe(-8.85, -8.25, south, 2.0, 'flutedOak', 0.55)
  k.desk(-9.55, -6.4, east, 1.3, 0.6)
  k.deskChair(-8.9, -6.4, west)

  // Bath 3.
  k.vanity(-3.5, -5.35, north, 1.4, k.fluted('flutedOak', 1.4), m.travertine)
  k.wc(-2.0, -5.45, north)
  k.screen(-5.425, -6.3, -4.2, -6.3)
  k.screen(-4.2, -7.5, -4.2, -6.3)
}

function buildOutdoors(k: Kit) {
  const { m } = k
  const { north } = FACE

  // Verandah: teak columns framing the door, OD-01 lounge, OD-02 dining, daybed, shoe bench.
  for (const x of [-9.85, -7.4, -2.6, 2.5, 7.4, 9.85]) k.box(k.root, 0.3, WALL_H, 0.3, m.teak, x, FLOOR_Y + WALL_H / 2, 8.35)
  k.sofa(-8.4, 7.7, north, 2.4, 0.95, m.outdoor)
  k.loungeChair(-9.3, 5.95, 0, m.teak, m.outdoor)
  k.loungeChair(-7.4, 5.95, 0, m.teak, m.outdoor)
  k.box(k.at(-8.4, 6.85), 1.2, 0.36, 0.6, m.teak, 0, 0.18, 0)
  const od = k.at(0, 6.9)
  k.box(od, 2.2, 0.05, 1.0, m.teak, 0, 0.73, 0)
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.box(od, 0.07, 0.7, 0.07, m.teak, a, 0.35, b * 0.42)
  for (const dx of [-0.75, 0, 0.75])
    for (const [s, ry] of [[-1, 0], [1, PI]]) {
      const c = k.at(dx, 6.9 + s * 0.82, ry)
      k.box(c, 0.52, 0.06, 0.5, m.outdoor, 0, 0.45, 0)
      k.box(c, 0.52, 0.4, 0.05, m.teak, 0, 0.7, -0.23)
      for (const [a, b] of [[-0.22, -0.2], [0.22, -0.2], [-0.22, 0.2], [0.22, 0.2]]) k.box(c, 0.04, 0.44, 0.04, m.teak, a, 0.22, b)
    }
  const daybed = k.at(5.0, 7.35)
  k.box(daybed, 2.0, 0.3, 1.0, m.teak, 0, 0.15, 0)
  k.soft(daybed, 1.96, 0.16, 0.96, 0.05, m.outdoor, 0, 0.38, 0)
  k.soft(daybed, 1.9, 0.36, 0.2, 0.08, m.outdoor, 0, 0.6, -0.36)
  k.box(k.at(-6.2, 5.45), 1.0, 0.42, 0.4, m.teak, 0, 0.21, 0)
  k.plant(-3.95, 5.45, 0.9)

  // Pool deck: OD-03 loungers facing the water, side tables, OD-04 cabana with daybed.
  for (const x of [-4.5, -1.5, 1.5, 4.5]) k.lounger(x, 16.1, PI, 0.08)
  for (const x of [-3, 0, 3]) k.cyl(k.at(x, 16.1, 0, 0.08), 0.22, 0.22, 0.42, m.teak, 0, 0.21, 0)
  const cabana = k.at(10.2, 12, 0, 0.08)
  for (const [a, b] of [[-1.3, -1.8], [1.3, -1.8], [-1.3, 1.8], [1.3, 1.8]]) k.box(cabana, 0.12, 2.5, 0.12, m.teak, a, 1.25, b)
  k.box(cabana, 2.8, 0.08, 3.8, m.outdoor, 0, 2.5, 0)
  k.box(cabana, 1.4, 0.3, 2.0, m.teak, 0, 0.15, 0)
  k.soft(cabana, 1.36, 0.16, 1.96, 0.05, m.outdoor, 0, 0.38, 0)
  for (const x of [-0.4, 0.4]) k.soft(cabana, 0.5, 0.3, 0.2, 0.1, m.stoneLinen, x, 0.6, -0.85)
  k.palm(-10.6, 10.5, 4.4)
  k.palm(-10.8, 15.5, 5.2)
  k.palm(12.2, 16.4, 4.8)
  k.palm(12.4, 9.0, 4.1)

  // Kitchen court: champa tree, OD-05 stone breakfast table, weathering-steel herb beds.
  k.tree(3.4, -9.6, 1.05, m.sage)
  const bt = k.at(7.0, -8.6, 0, 0.04)
  k.cyl(bt, 0.5, 0.5, 0.04, m.travertine, 0, 0.74, 0)
  k.cyl(bt, 0.08, 0.2, 0.72, m.basalt, 0, 0.36, 0)
  for (let i = 0; i < 4; i++) {
    const a = (i * PI) / 2
    const c = k.at(7 + Math.sin(a) * 0.8, -8.6 + Math.cos(a) * 0.8, a + PI, 0.04)
    k.box(c, 0.46, 0.05, 0.44, m.teak, 0, 0.45, 0)
    k.box(c, 0.46, 0.36, 0.04, m.teak, 0, 0.66, -0.2)
    for (const [p, q] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]]) k.box(c, 0.035, 0.44, 0.035, m.teak, p, 0.22, q)
  }
  k.box(k.root, 8.0, 0.45, 0.5, m.corten, 5.0, 0.225, -12.55)
  k.box(k.root, 7.9, 0.05, 0.4, m.leaf, 5.0, 0.47, -12.55)
  k.box(k.root, 0.5, 0.45, 5.5, m.corten, 9.55, 0.225, -9.0)
  k.box(k.root, 0.4, 0.05, 5.4, m.leaf, 9.55, 0.47, -9.0)

  // Mango and guava orchard in the project model's orchard area: two instanced draw calls.
  const pts: [number, number, number][] = []
  let seed = 21
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let x = -23; x <= -13; x += 3.2) for (let z = -8; z <= 16; z += 3.2) pts.push([x + rand() * 0.6, z + rand() * 0.6, 0.8 + rand() * 0.35])
  const trunks = new InstancedMesh(new CylinderGeometry(0.08, 0.12, 1.4, 7), m.trunk, pts.length)
  const crowns = new InstancedMesh(new IcosahedronGeometry(1, 1), m.leaf, pts.length)
  const o = new Object3D()
  pts.forEach(([x, z, s], i) => {
    o.position.set(x, 0.7 * s, z)
    o.scale.set(s, s, s)
    o.rotation.set(0, 0, 0)
    o.updateMatrix()
    trunks.setMatrixAt(i, o.matrix)
    o.position.set(x, 1.85 * s, z)
    o.scale.set(1.25 * s, s, 1.25 * s)
    o.rotation.y = i
    o.updateMatrix()
    crowns.setMatrixAt(i, o.matrix)
  })
  trunks.castShadow = crowns.castShadow = crowns.receiveShadow = true
  trunks.computeBoundingSphere()
  crowns.computeBoundingSphere()
  k.root.add(trunks, crowns)
}
