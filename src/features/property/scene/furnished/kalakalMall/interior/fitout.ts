import { RingGeometry, Group, Mesh, TorusGeometry, type Material, type Object3D } from 'three'
import { sheet } from '../solids'
import { alabasterPendants, ceiling, liftWall, onyxWall, waterNiche } from './architecture'
import { arcLamp, banquette, barrelChair, channelSofa, clubChair, coffeeTable, curvedSofa, diningChair, longTable, pillTable, plinthTable, roundTable, rug, sectional, sofa, wingChair } from './furniture'
import { blades, crystalChandelier, globeCluster, molecular } from './installations'
import { plantedFicus, plantedMonstera, plantedPalm } from './plants'
import { place } from './signs'
import { bx, clipped, partitions, rectPoly, subtract, wallOn, type FloorCtx } from './shell'
import { ENV, VOID, VZ0, VZ1, XV0, XV1, ZSC0, type Front, type Rect, type Zone } from './units'
import { luxuryWashrooms } from './washroom'

/*
 * The public spaces furnished and finished (the shops stay bare until their own fit-outs): designer
 * lounge seating in groups, planted landscaping, statement light fittings, a concierge desk, the
 * drinking-water niches and the washrooms; and the two big open spaces marked out (the gaming
 * hall's zones on its floor, the cinema's auditoria, box office and concessions).
 */

const PI = Math.PI

/* ---------- signs ---------- */

function at(e: FloorCtx, p: Object3D, x: number, z: number, yaw: number) {
  const g = new Group()
  g.position.set(x, e.y, z)
  g.rotation.y = yaw
  p.add(g)
  return g
}

/** A hanging wayfinding sign across a gallery, both faces, in a bronze frame on stainless rods. */
function hangingSign(e: FloorCtx, p: Object3D, x: number, z: number, yaw: number, lines: string[]) {
  const uv = e.s.wayfinding(lines)
  const y = e.y + Math.min(e.ceiling - 0.55, 3.1)
  const g = at(e, p, x, z, yaw)
  g.position.y = y
  e.k.box(g, 1.66, 0.46, 0.06, e.lux.bronze, 0, 0, 0)
  e.k.box(g, 1.66, 0.012, 0.064, e.lux.schemes[e.level].metal, 0, -0.23, 0)
  place(g, 1.6, 0.4, uv, e.s.lit, 0, 0, 0.031, 0)
  place(g, 1.6, 0.4, uv, e.s.lit, 0, 0, -0.031, PI)
  const rise = e.ceiling - (y - e.y)
  for (const dx of [-0.65, 0.65]) e.k.box(g, 0.008, rise - 0.23, 0.008, e.lux.steel, dx, rise / 2 + 0.115, 0)
}

/* ---------- the floors ---------- */

/** Where each floor's second drinking-water niche stands, with the way it faces. */
const WATER: Record<number, [number, number, number]> = { 0: [12.2, -3.33, 0], 1: [12.2, -3.33, 0], 2: [12.2, -3.33, 0], 3: [-17.92, 7.5, PI / 2], 4: [13.02, -4.2, -PI / 2] }

export function fitFloor(e: FloorCtx) {
  const g = e.g
  luxuryWashrooms(e, g)
  waterNiche(e, g, -11.6, ZSC0 + 0.08, 0)
  const [wx, wz, wy] = WATER[e.level]
  waterNiche(e, g, wx, wz, wy)
  liftWall(e)
  alabasterPendants(e)
  hangingSign(e, g, -5.1, -1.0, 0, ['LIFTS · WASHROOMS', 'Straight ahead'])
  hangingSign(e, g, -5.1, -16.9, PI / 2, ['WASHROOMS', 'Ladies · Gents · Accessible'])
  switch (e.level) {
    case 0:
      ground(e)
      break
    case 1:
    case 2:
      retail(e)
      break
    case 3:
      gamingHall(e)
      familyLounge(e)
      break
    case 4:
      foodCourt(e)
      cinema(e)
      break
  }
}

/**
 * The arrival: a crystal chandelier over the lobby, lounge seating either side of the way in,
 * palms at the doors; under the skylight a still pool with a brass sculpture in a ring of curved
 * bouclé sofas on the compass medallion; the onyx wall beyond; the concierge desk.
 */
function ground(e: FloorCtx) {
  const { k, lux, g, y } = e
  const cx = 2.0
  const cz = (VZ0 + VZ1) / 2
  // The pool: a Nero drum with a brass lip, still water, the sculpture on its plinth.
  k.cyl(g, 0.8, 0.82, 0.42, lux.wallNero, cx, y + 0.21, cz, 64)
  const lip = new Mesh(new RingGeometry(0.7, 0.81, 64), lux.brass)
  lip.rotation.x = -PI / 2
  lip.position.set(cx, y + 0.421, cz)
  g.add(lip)
  k.cyl(g, 0.7, 0.7, 0.02, e.m.water, cx, y + 0.39, cz, 64)
  k.cyl(g, 0.2, 0.24, 0.5, lux.nero, cx, y + 0.5, cz, 32)
  for (const [ry, rz, s, dy] of [[0, 0.35, 0.55, 1.5], [1.1, -0.5, 0.45, 1.4], [2.2, 0.15, 0.38, 1.62]] as const) {
    const ring = new Mesh(new TorusGeometry(s, 0.032, 16, 96), lux.brass)
    ring.position.set(cx, y + dy, cz)
    ring.rotation.set(PI / 2 + rz, ry, 0)
    ring.castShadow = true
    g.add(ring)
  }
  curvedSofa(e, g, cx, cz, 1.72, 0.55, PI - 1.1, lux.boucle, true, 3)
  curvedSofa(e, g, cx, cz, 1.72, PI + 0.55, PI - 1.1, lux.boucle, true, 3)
  // The lobby: a crystal chandelier in its coffered ceiling.
  crystalChandelier(e, g, -1.0, 6.7, y + e.ceiling + 0.1)
  // The concierge: a desk of Calacatta with a brass band and a stone top.
  bx(e, g, -6.15, -5.45, y, y + 1.0, 4.6, 6.8, lux.wallOro)
  bx(e, g, -6.2, -5.4, y + 1.0, y + 1.06, 4.55, 6.85, lux.calacattaOro)
  bx(e, g, -5.45, -5.43, y + 0.12, y + 0.16, 4.6, 6.8, lux.brass)
  bx(e, g, -5.45, -5.43, y + 0.85, y + 0.89, 4.6, 6.8, lux.brass)
  // The basement stair's face on the lobby: Calacatta, its door to the car park, signs over.
  const face = -6.6
  for (const [a, b] of subtract([3.4, 9.0], [[7.65, 8.75]])) bx(e, g, face, face + 0.03, y, y + e.ceiling, a, b, lux.wallOro)
  bx(e, g, face, face + 0.03, y + 2.3, y + e.ceiling, 7.65, 8.75, lux.wallOro)
  place(g, 1.6, 0.4, e.s.wayfinding(['CONCIERGE', 'Information · Lost & found · Wheelchairs']), e.s.lit, face + 0.032, y + 2.6, 5.7, PI / 2)
  place(g, 1.0, 0.25, e.s.wayfinding(['PARKING B1 · B2', 'Stairs'], '#1f3a5f', '#ffffff', '#ffd23f'), e.s.lit, face + 0.032, y + 2.6, 8.2, PI / 2)
  // Palms either side of the doors (the lobby itself is kept clear: it is the way in, and the
  // car park's stair opens onto it).
  plantedPalm(e, g, -3.95, 9.05, 11, 'travertine')
  plantedPalm(e, g, 1.95, 9.05, 12, 'travertine')
  onyxWall(e)
  // A rug under the ring of sofas, side tables at its two openings' flanks.
  for (const a of [0.45, PI - 0.45, PI + 0.45, -0.45]) pillTable(e, g, cx + Math.sin(a) * 2.75, cz + Math.cos(a) * 2.75)
  hangingSign(e, g, 6.0, -4.6, 0, ['ESCALATORS UP', 'Fashion 1 · Lifestyle 2 · Gaming 3 · Food & cinema 4'])
}

/**
 * The retail floors' lounges, each in the gallery no escalator lands on, along the balustrade
 * looking over the atrium with a 2 m walk kept clear in front of the shops:
 *   1   the rear gallery: a caramel leather sectional and a pair of emerald wing chairs on a rug
 *       round a Statuario plinth table, an arc lamp, under a molecular brass chandelier
 *   2   the front gallery: a curved bouclé sofa facing the void, two club chairs, a travertine
 *       table, under a chandelier of smoked glass blades
 */
function retail(e: FloorCtx) {
  const { lux, g, y } = e
  if (e.level === 1) {
    // The walk along the shops (z −7.8 to −5.85) stays clear; the lounge sits between it and the glass.
    rug(e, g, 2.1, -4.85, 0, 6.2, 2.3, '#d8cbb6', '#5a4630', 11)
    sectional(e, g, 1.4, -5.35, 0, 3.6, 1.1, lux.leatherCognac)
    plinthTable(e, g, 2.0, -4.25, 0, 1.3, 0.7, lux.statuario)
    wingChair(e, g, 4.45, -4.3, -PI / 2 - 0.35, lux.velvetEmerald)
    wingChair(e, g, 4.45, -5.45, -PI / 2 + 0.2, lux.velvetEmerald)
    pillTable(e, g, 5.15, -4.9)
    arcLamp(e, g, -0.85, -5.55, PI / 2)
    molecular(e, g, 2.2, -4.7, y + e.ceiling + 0.3)
    plantedFicus(e, g, -2.6, -5.6, 41, 'nero', 0.9)
    plantedPalm(e, g, 6.9, -5.6, 42, 'travertine', 0.85)
  } else {
    const zc = 5.6
    rug(e, g, 2.2, zc - 0.2, 0, 6.0, 2.6, '#e9e2d6', '#3b3530', 12)
    curvedSofa(e, g, 2.2, 2.6, 3.4, -0.48, 0.96, lux.boucle, true, 3)
    coffeeTable(e, g, 2.2, zc - 0.85, 0.48, 1.6, lux.travertine)
    clubChair(e, g, -0.55, zc - 0.85, PI / 2 + 0.25, lux.leatherTaupe)
    clubChair(e, g, 4.95, zc - 0.85, -PI / 2 - 0.25, lux.leatherTaupe)
    blades(e, g, 2.2, zc - 0.6, y + e.ceiling + 0.3, 2.4)
    plantedMonstera(e, g, -1.9, zc + 0.6, 43, 'bronze')
    plantedPalm(e, g, 6.6, zc + 0.6, 44, 'travertine', 0.85)
  }
  // Palms at the ends of the lounge behind the entrance glass, clear of the kiosks.
  plantedPalm(e, g, 4.25, 9.95, 31 + e.level, 'travertine', 0.85)
}

/** The third floor's family lounge: two conversation groups and planting, outside the gaming hall. */
function familyLounge(e: FloorCtx) {
  const { lux, g } = e
  rug(e, g, -12.4, 6.6, 0, 4.6, 3.2, '#2c2b31', '#b9a07a', 21)
  channelSofa(e, g, -12.4, 5.5, 0, 2.6, lux.velvetEmerald)
  plinthTable(e, g, -12.4, 6.75, 0, 1.4, 0.7, lux.grigio)
  clubChair(e, g, -14.3, 7.6, 2.2, lux.leatherCognac)
  clubChair(e, g, -10.5, 7.6, -2.2, lux.leatherCognac)
  arcLamp(e, g, -15.0, 5.3, 0.9)
  rug(e, g, -11.4, 10.9, 0, 4.2, 3.4, '#ece6db', '#3b3530', 22)
  curvedSofa(e, g, -11.4, 10.9, 1.5, -1.9, 3.8, lux.velvetNavy, true, 4)
  coffeeTable(e, g, -11.4, 10.9, 0.5, 1, lux.grigio)
  plantedPalm(e, g, -16.6, 5.4, 51, 'nero')
  plantedMonstera(e, g, -16.7, 9.4, 52, 'bronze')
  plantedFicus(e, g, -7.5, 12.3, 53, 'nero', 0.85)
  hangingSign(e, g, 6.0, 6.2, PI / 2, ['GAME ZONE', 'Bowling · Arcade · VR · Racing · Kids\' play'])
}

/* ---------- the third floor's gaming hall ---------- */

const ZONE_INK: Record<Zone['finish'], string> = {
  lanes: '#ffd23f', approach: '#ffd23f', arcade: '#ff3fa4', vr: '#36e0ff', racing: '#ff6b3f', esports: '#5f6bff', hockey: '#ffd23f', kids: '#ff7aa8', counter: '#ffffff',
  audi: '#d9a441', foyer: '#d9a441', concession: '#d9a441', boxoffice: '#d9a441', cinemaWc: '#d9a441',
}

/** The walls of a big open space against the galleries: its doorways left open, its sides on the void left to the balustrade. */
function hallWalls(e: FloorCtx, rects: Rect[], doors: Front[], inner: Material) {
  const onVoid = (s: { axis: 'x' | 'z'; at: number; from: number; to: number }) =>
    (s.axis === 'z' && (Math.abs(s.at - VZ0) < 0.02 || Math.abs(s.at - VZ1) < 0.02) && s.from >= VOID[0] - 0.01 && s.to <= VOID[1] + 0.01) ||
    (s.axis === 'x' && (Math.abs(s.at - XV0) < 0.02 || Math.abs(s.at - XV1) < 0.02) && s.from >= VZ0 - 0.01 && s.to <= VZ1 + 0.01)
  for (const s of partitions(e, [{ rects, fronts: doors }], onVoid)) wallOn(e, e.g, s.axis, s.at, s.from, s.to, e.y, e.soffit, 0.2, inner)
  // A portal round each doorway: champagne frame, the name over it.
  for (const d of doors) {
    const mid = (d.from + d.to) / 2
    const w = d.door ?? d.to - d.from
    const [a, b] = [mid - w / 2, mid + w / 2]
    const head = e.y + Math.min(3.0, e.ceiling - 0.3)
    const box = (p: number, q: number, y0: number, y1: number, t: number, mat: Material) =>
      d.axis === 'x' ? bx(e, e.g, d.at - t, d.at + t, y0, y1, p, q, mat) : bx(e, e.g, p, q, y0, y1, d.at - t, d.at + t, mat)
    for (const [p, q] of subtract([d.from, d.to], [[a, b]])) box(p, q, e.y, e.soffit, 0.1, e.m.wallPaint)
    box(a, b, head, e.soffit, 0.1, e.m.wallPaint)
    box(a - 0.12, a, e.y, head, 0.14, e.m.champagne)
    box(b, b + 0.12, e.y, head, 0.14, e.m.champagne)
    box(a - 0.12, b + 0.12, head, head + 0.12, 0.14, e.m.champagne)
  }
}

function zoneFloor(e: FloorCtx, z: Zone, mat: Material) {
  sheet(e.g, clipped(e, z.rect), e.y + 0.007, mat, false, [], `zone_${z.id}`)
  // A glowing line round the zone, in its colour, and its name painted at its edge.
  const [x0, x1, z0, z1] = z.rect
  const neon = e.m.neon(ZONE_INK[z.finish])
  const t = 0.05
  for (const r of [[x0, x1, z0, z0 + t], [x0, x1, z1 - t, z1], [x0, x0 + t, z0, z1], [x1 - t, x1, z0, z1]] as Rect[]) {
    const poly = clipped(e, r)
    if (poly.length > 2) sheet(e.g, poly, e.y + 0.009, neon, false, [], 'zone_line')
  }
  const uv = e.s.zoneMark(z.name, ZONE_INK[z.finish])
  const w = Math.min(3.4, (x1 - x0) * 0.8)
  place(e.g, w, w / 4, uv, e.s.paint, (x0 + x1) / 2, e.y + 0.013, (z0 + z1) / 2, 0, true)
}

function gamingHall(e: FloorCtx) {
  const { m, g, y } = e
  const hall = e.plan.hall!
  hallWalls(e, hall.rects, hall.doors, m.acoustic)
  // One floor and one ceiling over the whole hall: dark polished concrete, a black open ceiling.
  for (const r of hall.rects) {
    sheet(g, clipped(e, r), y + 0.005, m.approach, false, [], 'hall_floor')
    sheet(g, clipped(e, r), e.soffit - 0.02, m.blackCeiling, true, [], 'hall_ceiling')
  }
  const fin: Record<string, Material> = { lanes: m.approach, approach: m.counterFloor, arcade: m.arcade, vr: m.vr, racing: m.racing, esports: m.esports, hockey: m.hockey, kids: m.kids, counter: m.counterFloor }
  for (const z of hall.zones) zoneFloor(e, z, fin[z.finish] ?? m.approach)
  // The bowling lanes marked out: maple lanes between gutters, the foul line, the pin decks.
  const bowl = hall.zones.find((z) => z.id === 'BOWL')!.rect
  const lanes = 5
  const pitch = (bowl[3] - bowl[2]) / lanes
  for (let i = 0; i < lanes; i++) {
    const zc = bowl[2] + (i + 0.5) * pitch
    sheet(g, rectPoly([bowl[0] + 0.3, bowl[1] - 2.3, zc - 0.53, zc + 0.53]), y + 0.011, m.maple, false, [], 'lane')
    for (const s of [-1, 1]) sheet(g, rectPoly([bowl[0] + 1.0, bowl[1] - 1.9, zc + s * 0.53 + (s > 0 ? 0 : -0.24), zc + s * 0.53 + (s > 0 ? 0.24 : 0)]), y + 0.011, m.black, false, [], 'gutter')
    sheet(g, rectPoly([bowl[0] + 1.0, bowl[0] + 1.03, zc - 0.53, zc + 0.53]), y + 0.013, m.black, false, [], 'foul_line')
    sheet(g, rectPoly([bowl[1] - 2.3, bowl[1] - 1.9, zc - 0.53, zc + 0.53]), y + 0.012, m.tableTop, false, [], 'pin_deck')
  }
  // The pinsetters' zone at the lanes' far end, marked on the floor in black.
  sheet(g, rectPoly([bowl[1] - 1.9, bowl[1], bowl[2], bowl[3]]), y + 0.012, m.black, false, [], 'pinsetter_zone')
}

/* ---------- the fourth floor: food court and cinema ---------- */

/**
 * The food court's dining: four-seat rounds and six-seat tables on walnut herringbone, a long
 * group table, a banquette along the glass with tables for two, family tables along the gallery,
 * clusters of glass globes over the tables.
 */
function foodCourt(e: FloorCtx) {
  const { lux, g, y } = e
  const kiosks = e.plan.units.filter((u) => u.kind === 'kiosk').map((u) => u.rects[0])
  const clear = (x: number, z: number, rx: number, rz: number) => !kiosks.some((k) => x + rx > k[0] && x - rx < k[1] && z + rz > k[2] && z - rz < k[3])
  for (const z of [-5.7, -3.0, -0.3, 2.4, 5.1]) if (clear(-10.85, z, 1.05, 1.05)) roundTable(e, g, -10.85, z, 0.45, 4, lux.velvetOchre)
  for (const z of [-5.4, -2.6, 0.2, 3.0, 5.8]) if (clear(-8.0, z, 1.1, 1.2)) longTable(e, g, -8.0, z, PI / 2, 1.8, 3, lux.leatherTaupe)
  longTable(e, g, -9.6, 7.95, 0, 2.6, 4, lux.velvetEmerald)
  // Along the glass: a leather banquette, tables for two before it.
  banquette(e, g, -1.25, 10.12, PI, 4.6, lux.leatherCognac)
  for (const x of [-3.0, -1.25, 0.5]) {
    roundTable(e, g, x, 9.25, 0.32, 0, lux.velvetOchre)
    diningChair(e, g, x, 8.55, 0, lux.velvetOchre)
  }
  for (const x of [-2.0, 1.4]) roundTable(e, g, x, 6.3, 0.45, 4, lux.velvetEmerald)
  const top = y + e.ceiling + 0.31
  globeCluster(e, g, -10.85, -0.3, top, 1)
  globeCluster(e, g, -8.0, 3.0, top, 2)
  globeCluster(e, g, -9.6, 7.95, top, 3)
  plantedPalm(e, g, 4.25, 9.95, 62, 'travertine', 0.85)
  hangingSign(e, g, -5.1, 6.0, PI / 2, ['FOOD COURT', '20 kitchens · Indian · World · Quick bites'])
}

function cinema(e: FloorCtx) {
  const { m, g, y, lux } = e
  const hall = e.plan.hall!
  hallWalls(e, hall.rects, hall.doors, m.acoustic)
  const zone = (id: string) => hall.zones.find((z) => z.id === id)!
  // The foyer: dark stone, a gypsum ceiling with downlights over the lobby and the walk along the void.
  const foyer: Rect[] = [[0.6, 13.1, -7.8, VZ0], [XV1, 13.1, VZ0, 3.7], [XV1, 11.3, 3.7, ENV.z1]]
  for (const r of foyer) {
    sheet(g, clipped(e, r), y + 0.006, lux.nero, false, [], 'cinema_foyer')
    ceiling(e, r)
  }
  // The auditoria and the cinema's washrooms: walled, doors onto the foyer.
  const doors: Record<string, Front[]> = {
    AUDI1: [{ axis: 'z', at: -8.0, from: 1.2, to: 2.8, door: 1.4 }, { axis: 'z', at: -8.0, from: 7.2, to: 8.8, door: 1.4 }],
    AUDI2: [{ axis: 'z', at: -8.0, from: 9.8, to: 11.2, door: 1.4 }, { axis: 'z', at: -8.0, from: 11.6, to: 13.0, door: 1.4 }],
    AUDI3: [{ axis: 'x', at: 11.3, from: 4.2, to: 5.8, door: 1.4 }, { axis: 'x', at: 11.3, from: 10.4, to: 12.0, door: 1.4 }],
    CWC: [{ axis: 'x', at: 13.1, from: -6.4, to: -5.0, door: 1.2 }],
  }
  const rooms = ['AUDI1', 'AUDI2', 'AUDI3', 'CWC'].map((id) => ({ rects: [zone(id).rect], fronts: doors[id] }))
  const outline = (s: { axis: 'x' | 'z'; at: number; from: number; to: number }) => (s.axis === 'x' && Math.abs(s.at - ENV.x1) < 0.02) || (s.axis === 'z' && (Math.abs(s.at - ENV.z1) < 0.02 || Math.abs(s.at - -16.0) < 0.02))
  for (const s of partitions(e, rooms, outline)) wallOn(e, g, s.axis, s.at, s.from, s.to, y, e.soffit, 0.2, m.acoustic)
  for (const [id, list] of Object.entries(doors))
    for (const d of list) {
      const mid = (d.from + d.to) / 2
      const box = (p: number, q: number, y0: number, y1: number, t: number, mat: Material) =>
        d.axis === 'x' ? bx(e, g, d.at - t, d.at + t, y0, y1, p, q, mat) : bx(e, g, p, q, y0, y1, d.at - t, d.at + t, mat)
      box(d.from, d.to, y + 2.3, e.soffit, 0.1, m.acoustic)
      box(mid - 0.72, mid - 0.68, y, y + 2.3, 0.12, m.champagne)
      box(mid + 0.68, mid + 0.72, y, y + 2.3, 0.12, m.champagne)
      box(mid - 0.72, mid + 0.72, y + 2.26, y + 2.3, 0.12, m.champagne)
      if (id !== 'CWC') {
        const uv = e.s.wayfinding([zone(id).name.toUpperCase()], '#1e1a18', '#f3ead9', '#d9a441')
        const out = d.axis === 'z' ? -1 : -1
        place(g, 0.9, 0.225, uv, e.s.lit, d.axis === 'x' ? d.at + out * 0.115 : mid, y + 2.55, d.axis === 'z' ? d.at - out * 0.115 : mid, d.axis === 'x' ? -PI / 2 : 0)
      }
    }
  // In each auditorium: a dark floor, a black ceiling, the screen wall marked in white, its name on the floor.
  for (const id of ['AUDI1', 'AUDI2', 'AUDI3']) {
    const z = zone(id)
    const [x0, x1, z0, z1] = z.rect
    const poly = clipped(e, z.rect)
    sheet(g, poly, y + 0.006, m.audiFloor, false, [], 'audi_floor')
    sheet(g, poly, e.soffit - 0.02, m.blackCeiling, true, [], 'audi_ceiling')
    // The screen: on the back wall for the two big ones, the far (north) wall for the recliner screen.
    if (id === 'AUDI3') bx(e, g, ENV.x1 - 0.12, ENV.x1 - 0.1, y + 1.0, y + 4.6, z0 + 1.2, Math.min(z1, 11.2) - 0.8, m.porcelain)
    else bx(e, g, x0 + 0.8, x1 - 0.8, y + 1.0, y + 4.8, z0 + 0.12, z0 + 0.14, m.porcelain)
    zoneFloor(e, z, m.audiFloor)
  }
  zoneFloor(e, zone('CWC'), m.wcFloor)
  // Box office and concessions: counters marked out with their signs (their fit-outs come later).
  const box = zone('BOX').rect
  bx(e, g, box[0], box[1], y, y + 1.05, box[2] + 0.05, box[2] + 0.65, lux.wallNero)
  bx(e, g, box[0], box[1], y + 0.95, y + 0.97, box[2] + 0.65, box[2] + 0.67, lux.brass)
  bx(e, g, box[0] - 0.02, box[1] + 0.02, y + 1.05, y + 1.1, box[2], box[2] + 0.7, lux.calacattaOro)
  place(g, 2.4, 0.6, e.s.wayfinding(['BOX OFFICE', 'Tickets · Booking pick-up'], '#1e1a18', '#f3ead9', '#d9a441'), e.s.lit, (box[0] + box[1]) / 2, y + 3.0, -7.8 - 0.115 + 0.23, 0)
  const candy = zone('CANDY').rect
  bx(e, g, candy[0] + 0.7, candy[0] + 1.3, y, y + 1.05, candy[2], candy[3], lux.wallNero)
  bx(e, g, candy[0] + 0.68, candy[0] + 0.7, y + 0.95, y + 0.97, candy[2], candy[3], lux.brass)
  bx(e, g, candy[0] + 0.68, candy[0] + 1.35, y + 1.05, y + 1.1, candy[2] - 0.02, candy[3] + 0.02, lux.calacattaOro)
  place(g, 2.6, 0.65, e.s.wayfinding(['POPCORN & CONCESSIONS'], '#1e1a18', '#f3ead9', '#d9a441'), e.s.lit, 13.1 - 0.105, y + 3.0, (candy[2] + candy[3]) / 2, -PI / 2)
  zoneFloor(e, zone('BOX'), lux.nero)
  zoneFloor(e, zone('CANDY'), lux.nero)
  // The cinema's name over its entrance from the food court.
  const brand = e.s.wayfinding(['TERRANOVA CINEMAS', 'Audi 1 · Audi 2 · Audi 3 Recliners'], '#14100e', '#f3ead9', '#d9a441')
  place(g, 3.4, 0.85, brand, e.s.lit, 0.6 - 0.105, y + 3.6, (-7.8 + VZ0) / 2, -PI / 2)
  // Waiting lounge in the cinema lobby.
  rug(e, g, 9.5, 10.7, 0, 3.0, 3.0, '#2a2522', '#b9a07a', 31)
  sofa(e, g, 9.5, 11.75, PI, 2.4, lux.velvetNavy, lux.velvetOchre)
  plinthTable(e, g, 9.5, 10.6, 0, 1.1, 0.6, lux.nero)
  barrelChair(e, g, 8.4, 9.5, 2.3, lux.velvetOchre)
  barrelChair(e, g, 10.6, 9.5, -2.3, lux.velvetOchre)
  plantedPalm(e, g, 8.3, 12.4, 71, 'nero', 0.8)
}

