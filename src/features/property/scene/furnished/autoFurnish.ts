import { Group } from 'three'
import { FACE, FLOOR_Y, Kit, PI, WALL_H } from './kit'

/*
 * Furnished interiors for placeholder rooms, so every project's rooms can be opened and explored
 * in 3D before the artist's model arrives. The room type is read from the hotspot mesh name
 * (room_bed_master, room_kitchen, amenity_pool, room_office_1, ...) and a layout in the house
 * style is fitted to the room's footprint.
 */

export type RoomType =
  | 'bedroom' | 'living' | 'dining' | 'kitchen' | 'bath' | 'study' | 'office' | 'retail'
  | 'terrace' | 'pool' | 'garden' | 'parking' | 'generic'

const RULES: [RegExp, RoomType][] = [
  [/bath|wc|powder|toilet/, 'bath'],
  [/bed|suite|guest/, 'bedroom'],
  [/kitchen|pantry/, 'kitchen'],
  [/dining/, 'dining'],
  [/living|lounge|great|family|foyer/, 'living'],
  [/study|library/, 'study'],
  [/office/, 'office'],
  [/shop|retail|showroom|store/, 'retail'],
  [/terrace|verandah|veranda|balcony|deck|patio/, 'terrace'],
  [/pool/, 'pool'],
  [/garden|orchard|lawn|park/, 'garden'],
  [/parking|garage/, 'parking'],
]

export function roomTypeOf(meshName: string): RoomType {
  const n = meshName.toLowerCase()
  return RULES.find(([re]) => re.test(n))?.[1] ?? 'generic'
}

const OUTDOOR: RoomType[] = ['terrace', 'pool', 'garden', 'parking']

/**
 * Builds a furnished room centred on the origin, `w` × `d` metres, standing on y = 0.
 * Indoor rooms get plaster walls (cut at 2.6 m) with a window on the front and a door on one side.
 */
export function buildRoomInterior(meshName: string, w: number, d: number): Group {
  const root = new Group()
  // Kit places furniture at its finished floor level; shift so that sits on y = 0.
  const inner = new Group()
  inner.position.y = -FLOOR_Y
  root.add(inner)
  const k = new Kit(inner)
  const type = roomTypeOf(meshName)
  const hw = w / 2 - 0.15
  const hd = d / 2 - 0.15

  if (!OUTDOOR.includes(type)) shell(k, type, w, d)

  const recipes: Record<RoomType, () => void> = {
    bedroom: () => bedroom(k, hw, hd, /master/.test(meshName)),
    living: () => living(k, hw, hd),
    dining: () => dining(k, hw, hd),
    kitchen: () => kitchen(k, hw, hd),
    bath: () => bath(k, hw, hd),
    study: () => study(k, hw, hd),
    office: () => office(k, hw, hd),
    retail: () => retail(k, hw, hd),
    terrace: () => terrace(k, w, d),
    pool: () => pool(k, w, d),
    garden: () => garden(k, w, d),
    parking: () => parking(k, w, d),
    generic: () => living(k, hw, hd),
  }
  recipes[type]()
  return root
}

/* ---------- architecture ---------- */

function shell(k: Kit, type: RoomType, w: number, d: number) {
  const { m } = k
  const r = k.root
  const floor =
    type === 'bedroom' || type === 'study' ? k.finish('oak', w / 0.88, d / 2.4)
    : type === 'bath' ? k.finish('marble', w / 1.2, d / 1.2, 0.3)
    : k.finish('travertineTile', w / 1.6, d / 0.8, 0.42)
  k.box(r, w, 0.02, d, floor, 0, FLOOR_Y - 0.01, 0, false)

  const faces = [m.plaster, m.plaster, m.wallCap, m.plaster, m.plaster, m.plaster]
  const t = 0.15
  const y = FLOOR_Y + WALL_H / 2
  // Back wall solid; front wall with a wide window at sill height; side walls with a door opening.
  k.box(r, w, WALL_H, t, faces, 0, y, -d / 2 + t / 2)
  const win = Math.min(w * 0.55, 4)
  const pier = (w - win) / 2
  for (const s of [-1, 1]) k.box(r, pier, WALL_H, t, faces, s * (w / 2 - pier / 2), y, d / 2 - t / 2)
  k.box(r, win, 0.6, t, m.plaster, 0, FLOOR_Y + 0.3, d / 2 - t / 2)
  k.box(r, win, WALL_H - 0.6, 0.02, m.glass, 0, FLOOR_Y + 0.6 + (WALL_H - 0.6) / 2, d / 2 - t / 2, false)
  const door = Math.min(1.0, d * 0.3)
  const seg = (d - door) / 2
  k.box(r, t, WALL_H, d, faces, w / 2 - t / 2, y, 0)
  for (const s of [-1, 1]) k.box(r, t, WALL_H, seg, faces, -w / 2 + t / 2, y, s * (d / 2 - seg / 2))
}

/* ---------- recipes (half-extents hw, hd are to the inside face of the walls) ---------- */

function bedroom(k: Kit, hw: number, hd: number, master: boolean) {
  const { m } = k
  const wid = hw > 1.9 ? 2.0 : 1.8
  const bedZ = -hd + 0.25 + 1.1
  const headW = Math.min(3.2, hw * 2 - 1.2)
  k.box(k.root, Math.min(hw * 2 - 0.4, headW + 1.4), WALL_H, 0.03, k.fluted('flutedWalnut', headW + 1.4), 0, FLOOR_Y + WALL_H / 2, -hd - 0.01)
  k.rug(0, bedZ + 0.4, Math.min(3.2, hw * 2 - 0.6), Math.min(3.0, hd * 2 - 0.6), '#d2c7b5', '#8e7453', 37)
  k.bed(0, bedZ, FACE.south, wid, 2.2, headW, master ? m.taupe : m.stoneLinen)
  if (hw > 1.8) for (const s of [-1, 1]) k.nightstand(s * (wid / 2 + 0.45), -hd + 0.36, FACE.south)
  if (hd > 2.2) {
    const bench = k.at(0, bedZ + 1.4)
    k.box(bench, 1.6, 0.4, 0.45, m.walnut, 0, 0.2, 0)
    k.soft(bench, 1.6, 0.1, 0.45, 0.03, m.boucle, 0, 0.45, 0)
  }
  if (hw > 2.4) k.wardrobe(-hw + 0.3, Math.min(hd - 1.5, 1), FACE.east, Math.min(2.4, hd * 2 - 1.8))
  if (hw > 2.2 && hd > 2) k.loungeChair(hw - 0.7, hd - 0.8, -PI * 0.78)
  k.plant(hw - 0.35, -hd + 0.35, 0.8)
}

function living(k: Kit, hw: number, hd: number) {
  const { m } = k
  const len = Math.min(3.2, hw * 2 - 1.4)
  const mediaW = Math.min(3.0, hw * 2 - 0.8)
  k.box(k.root, mediaW, WALL_H, 0.05, k.fluted('flutedWalnut', mediaW), 0, FLOOR_Y + WALL_H / 2, -hd - 0.02)
  k.box(k.root, Math.min(1.7, mediaW - 0.4), 0.96, 0.04, m.black, 0, FLOOR_Y + 1.3, -hd + 0.03)
  const media = k.cabinet(0, -hd + 0.25, FACE.south, Math.min(2.8, mediaW), 0.45, 0.34, k.fluted('flutedWalnut', 2.8), m.travertine)
  media.position.y += 0.2
  const sofaZ = Math.min(hd - 0.7, 1.9)
  k.rug(0, sofaZ - 1.2, Math.min(3.6, hw * 2 - 0.6), Math.min(3.4, hd * 2 - 0.8), '#d6ccbb', '#8b8a6c', 31)
  k.sofa(0, sofaZ, FACE.north, len, 1.0, m.boucle)
  k.drumTable(0, sofaZ - 1.35, 0.5, 0.38, m.travertine)
  if (hw > 2.3) {
    const cx = Math.min(hw - 0.6, 2.1)
    k.loungeChair(-cx, sofaZ - 1.35, FACE.east)
    k.loungeChair(cx, sofaZ - 1.35, FACE.west)
  }
  k.floorLamp(hw - 0.4, sofaZ + 0.2)
  k.plant(-hw + 0.4, -hd + 0.4, 1.05, true)
}

function dining(k: Kit, hw: number, hd: number) {
  const { m } = k
  const len = Math.max(1.6, Math.min(3.2, hw * 2 - 2.2))
  const t = k.at(0, 0.2)
  k.box(t, len, 0.06, 1.1, m.walnut, 0, 0.72, 0)
  for (const x of [-len * 0.3, len * 0.3]) k.box(t, 0.26, 0.69, 0.76, m.travertine, x, 0.345, 0)
  const n = Math.max(2, Math.floor(len / 0.8))
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + (len / n) * (i + 0.5)
    k.diningChair(x, 0.2 - 0.82, FACE.south)
    k.diningChair(x, 0.2 + 0.82, FACE.north)
  }
  k.diningChair(-len / 2 - 0.45, 0.2, FACE.east)
  k.diningChair(len / 2 + 0.45, 0.2, FACE.west)
  k.linearPendant(0, 0.2, 1.95, Math.min(2.6, len))
  if (hd > 2) k.cabinet(0, -hd + 0.25, FACE.south, Math.min(2.8, hw * 2 - 1), 0.5, 0.7, k.fluted('flutedWalnut', 2.8), m.quartzite, 0.1)
  k.plant(hw - 0.4, -hd + 0.4, 1)
}

function kitchen(k: Kit, hw: number, hd: number) {
  const { m } = k
  const run = k.at(0.3, -hd + 0.33)
  const len = hw * 2 - 1.2
  k.box(run, len, 0.84, 0.65, m.lacquer, 0, 0.46, 0)
  k.box(run, len, 0.04, 0.67, m.quartzite, 0, 0.9, 0)
  k.box(run, 0.62, 0.006, 0.5, m.black, len * 0.2, 0.923, 0, false)
  k.box(run, 0.6, 0.02, 0.42, m.steel, -len * 0.2, 0.915, 0, false)
  k.box(k.root, len, 0.9, 0.02, m.quartzite, 0.3, FLOOR_Y + 1.35, -hd + 0.01, false)
  const tall = k.at(-hw + 0.31, 0, FACE.east)
  k.box(tall, Math.min(2.8, hd * 2 - 1.6), 2.3, 0.62, m.lacquer, 0, 1.15, 0)
  if (hd > 2 && hw > 1.9) {
    const iw = Math.min(3.0, hw * 2 - 2.4)
    const island = k.at(0.3, 0.1)
    k.box(island, iw - 0.1, 0.86, 1.0, k.fluted('flutedOak', iw), 0, 0.45, 0)
    k.box(island, iw, 0.05, 1.1, m.quartzite, 0, 0.905, 0)
    const stools = Math.max(2, Math.floor(iw / 0.7))
    for (let i = 0; i < stools; i++) {
      const x = 0.3 - iw / 2 + (iw / stools) * (i + 0.5)
      k.stool(x, 1.0)
      if (i < 3) k.globe(0.3 - iw / 3 + (iw / 3) * i, 1.9, 0.1)
    }
  }
}

function bath(k: Kit, hw: number, hd: number) {
  const { m } = k
  k.box(k.root, hw * 2, WALL_H, 0.02, m.marble, 0, FLOOR_Y + WALL_H / 2, -hd - 0.005)
  k.vanity(-hw + Math.min(0.9, hw * 0.45), -hd + 0.3, FACE.south, Math.min(1.6, hw), m.walnut)
  k.wc(hw - 0.3, -hd + 0.4, FACE.west)
  if (hw * 2 > 2.6) k.tub(0, hd - 0.5, FACE.north)
  k.screen(hw - 1.1, 0, hw, 0)
}

function study(k: Kit, hw: number, hd: number) {
  const { m } = k
  k.desk(0, hd - 0.7, FACE.north, 1.6, 0.7)
  k.deskChair(0, hd - 1.4, FACE.south)
  const lib = k.at(0, -hd + 0.22)
  k.box(lib, Math.min(3, hw * 2 - 0.4), 2.3, 0.4, m.oak, 0, 1.15, 0)
  for (const y of [0.45, 0.85, 1.25, 1.65, 2.05]) k.box(lib, Math.min(2.9, hw * 2 - 0.5), 0.02, 0.02, k.glow, 0, y, 0.19, false)
  k.loungeChair(hw - 0.7, 0, FACE.west)
  k.floorLamp(hw - 0.4, -0.8)
}

function office(k: Kit, hw: number, hd: number) {
  const { m } = k
  for (let x = -hw + 1.3; x <= hw - 1.3; x += 2.6)
    for (let z = -hd + 1.5; z <= hd - 1.8; z += 2.4) {
      k.desk(x, z, FACE.north, 1.4, 0.7)
      k.deskChair(x, z - 0.65, FACE.south)
    }
  k.sofa(hw - 1.6, hd - 0.7, FACE.north, 2.4, 0.9, m.linen)
  for (const [x, z] of [[-hw + 0.4, hd - 0.4], [hw - 0.4, -hd + 0.4], [-hw + 0.4, -hd + 0.4]]) k.plant(x, z, 1)
}

function retail(k: Kit, hw: number, hd: number) {
  const { m } = k
  for (const s of [-1, 1]) {
    const run = k.at(s * (hw - 0.3), 0, s > 0 ? FACE.west : FACE.east)
    k.box(run, hd * 2 - 1.2, 2.2, 0.5, m.oak, 0, 1.1, 0)
    for (const y of [0.5, 1.0, 1.5]) k.box(run, hd * 2 - 1.3, 0.02, 0.02, k.glow, 0, y, 0.24, false)
  }
  for (const [x, z] of [[-1.4, -0.6], [1.4, -0.6], [0, 1.2]]) {
    k.drumTable(x, z, 0.45, 0.9, m.travertine)
    k.cyl(k.at(x, z), 0.12, 0.16, 0.34, m.ceramic, 0, 1.07, 0)
  }
  k.cabinet(0, -hd + 0.5, FACE.south, Math.min(3, hw * 2 - 2), 0.6, 1.0, m.walnut, m.quartzite)
}

function terrace(k: Kit, w: number, d: number) {
  const { m } = k
  k.box(k.root, w, 0.04, d, k.finish('kota', w / 0.9, d / 0.9, 0.6), 0, FLOOR_Y - 0.02, 0, false)
  k.sofa(0, -d / 2 + 0.7, FACE.south, Math.min(2.6, w - 1.2), 0.95, m.outdoor)
  k.box(k.at(0, -d / 2 + 1.8), 1.2, 0.36, 0.6, m.teak, 0, 0.18, 0)
  if (w > 3.4) {
    k.loungeChair(-1.4, -d / 2 + 2.6, PI * 0.85, m.teak, m.outdoor)
    k.loungeChair(1.4, -d / 2 + 2.6, -PI * 0.85, m.teak, m.outdoor)
  }
  for (const [x, z] of [[-w / 2 + 0.4, d / 2 - 0.4], [w / 2 - 0.4, d / 2 - 0.4]]) k.plant(x, z, 1.1, true)
}

function pool(k: Kit, w: number, d: number) {
  const { m } = k
  const pw = Math.max(2, w - 1.6)
  const pd = Math.max(2, d - 2.4)
  const deck = k.finish('travertineTile', w / 1.6, d / 0.8, 0.6)
  k.box(k.root, w, 0.02, d, deck, 0, FLOOR_Y - 0.01, 0, false)
  k.box(k.root, pw, 0.03, pd, m.water, 0, FLOOR_Y + 0.005, -0.3, false)
  const n = Math.max(1, Math.min(4, Math.floor(pw / 2.4)))
  for (let i = 0; i < n; i++) k.lounger(-pw / 2 + (pw / n) * (i + 0.5), d / 2 - 1.05, PI, FLOOR_Y)
}

function garden(k: Kit, w: number, d: number) {
  const { m } = k
  for (let x = -w / 2 + 1.6; x < w / 2 - 1; x += 3.2)
    for (let z = -d / 2 + 1.6; z < d / 2 - 1; z += 3.2) {
      const g = new Group()
      g.position.y = FLOOR_Y
      k.root.add(g)
      new Kit(g, k).tree(x, z, 0.9, (Math.round(x + z) & 1) === 0 ? m.leaf : m.sage)
    }
  const bench = k.at(0, 0, 0)
  k.box(bench, 1.6, 0.08, 0.45, m.teak, 0, 0.44, 0)
  k.box(bench, 1.6, 0.4, 0.05, m.teak, 0, 0.66, -0.2)
}

function parking(k: Kit, w: number, d: number) {
  const { m } = k
  const car = m.basalt
  const bays = Math.max(1, Math.floor(w / 2.8))
  for (let i = 0; i < bays; i++) {
    const x = -w / 2 + (w / bays) * (i + 0.5)
    k.box(k.root, 0.06, 0.005, Math.min(5, d - 1), m.bedding, x - w / bays / 2 + 0.1, FLOOR_Y + 0.003, 0, false)
    const c = k.at(x, 0)
    k.soft(c, 1.85, 0.7, 4.6, 0.2, car, 0, 0.5, 0)
    k.soft(c, 1.6, 0.5, 2.4, 0.2, m.glass, 0, 1.05, -0.2)
  }
}
