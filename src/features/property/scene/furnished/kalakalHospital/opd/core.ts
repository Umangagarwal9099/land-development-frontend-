import { Group, MeshStandardMaterial, type Material, type Object3D, type Vector3 } from 'three'
import { Lift, type Level as LiftLevel } from '../../basement/access'
import { B1, B2 } from '../../basement/spec'
import { stairFlights } from '../../basement/access'
import { Decals, type Ctx as BasementCtx } from '../../basement/build'
import { basementMaterials } from '../../basement/materials'
import type { AccessSpec, StairSpec } from '../../basement/spec'
import type { Kit } from '../../kit'
import { Contact } from '../../kalakalMall/contact'
import type { LiftHost, Lighting } from '../../shared'
import { rng } from '../../textures'
import { signPanel } from '../erKit'
import { HOSPITAL_BASEMENT } from '../basement'
import { ROOF } from '../plan'
import type { OpdCtx } from './ctx'
import { board, NAVY } from './paints'
import { FIRE_STAIR, LEVELS, LIFTS, MAIN_LIFTS, MAIN_STAIR, STAIR } from './plan'

/*
 * The OPD's core: two 13-person stretcher lifts from the ground to the third floor, side by side
 * in the bank across the south corridor from the stair, run by the same controller as the
 * basement's (collective control, real doors, buttons and indicators: see ../../basement/access.ts);
 * the OPD stair, a 4.1 m wide dog-leg, and the fire stair at the back, every tread a real step.
 */

/** The OPD floors as the lifts know them, top down: their finished levels and their buttons. */
const LIFT_LEVELS: LiftLevel[] = [
  { level: 3, y: LEVELS[3] + 0.012, name: '3' },
  { level: 2, y: LEVELS[2] + 0.012, name: '2' },
  { level: 1, y: LEVELS[1] + 0.012, name: '1' },
  { level: 0, y: LEVELS[0] + 0.012, name: 'G' },
]

/** The landings' face: the corridor side of the bank's wall. */
const ACCESS: AccessSpec = {
  rect: { x0: LIFTS.x0 - 0.1, x1: LIFTS.x1, z0: LIFTS.z0, z1: LIFTS.z1 },
  face: '-x',
  ground: { y: LEVELS[0], top: LEVELS[0] + 3, label: 'OPD', frontWall: true },
  lifts: LIFTS.cars.map((c, i) => ({ ...c, door: '-x' as const, call: (i === 0 ? 1 : -1) as 1 | -1 })),
  stair: { zone: { x0: STAIR.x0, x1: STAIR.x1, z0: STAIR.z0, z1: STAIR.z1 }, entry: '+z', door: '+x', at: 3.2 },
}

export interface Core {
  lifts: Lift[]
  host: LiftHost
  /** The cars, riding their shafts through every floor. */
  cars: Group
  /** What the main block's lifts bring down into the car park, by basement level (see Basement.onBuild). */
  basement: Map<-1 | -2, Group>
}

/** The main block's lifts' levels, top down: the four floors, then the car park's two. */
const MAIN_LEVELS: LiftLevel[] = [
  ...LIFT_LEVELS,
  { level: -1, y: B1, name: 'B1' },
  { level: -2, y: B2, name: 'B2' },
]

/** The landing face of the main lift bank: the lift lobby side of its front wall. */
const MAIN_ACCESS: AccessSpec = {
  rect: { x0: MAIN_LIFTS.x0, x1: MAIN_LIFTS.x1, z0: MAIN_LIFTS.z0 - 0.1, z1: MAIN_LIFTS.z1 },
  face: '-z',
  ground: { y: LEVELS[0], top: LEVELS[0] + 3, label: 'Main', frontWall: true },
  lifts: MAIN_LIFTS.cars.map((c) => ({ x: c.x, z: c.z, w: c.w, d: c.d, door: '-z' as const, call: 1 as const, plate: c.plate })),
  stair: { zone: { x0: MAIN_STAIR.x0, x1: MAIN_STAIR.x1, z0: MAIN_STAIR.z0, z1: MAIN_STAIR.z1 }, entry: '+x', door: '+z', at: MAIN_STAIR.door },
}

/** Builds the lifts and stairs into the floors' groups (`floors[level]`), the cars into their own. */
export function buildCore(k: Kit, lighting: Lighting, floors: Group[], es: OpdCtx[]): Core {
  // The basement's finishes, but a hospital car's: satin brushed stainless walls and doors (the
  // emergency department's), and a satin-finished back panel in place of a mirror, which here
  // would reflect only the painted sky the materials carry.
  const er = es[0].m
  const base = basementMaterials(k, lighting)
  const satin = new MeshStandardMaterial({ color: '#c9cdd0', metalness: 0.6, roughness: 0.42 })
  const ctx: BasementCtx = { k, m: { ...base, stainless: er.stainless, mirror: satin, steel: er.aluminium }, spec: HOSPITAL_BASEMENT, lighting, shade: new Contact(), decals: new Decals(), r: rng(7711) }
  const cars = new Group()
  cars.name = 'opd_lift_cars'
  const lifts = ACCESS.lifts.map((spec, i) => {
    const lift = new Lift(ctx, spec, ACCESS, LIFT_LEVELS, 10 + i, (level) => floors[level])
    cars.add(lift.car)
    lift.park(0)
    return lift
  })
  // The main block's three lifts, from B2 to the third floor: their landings in the car park go
  // into groups of their own, added to the basement levels when those are built.
  const basement = new Map<-1 | -2, Group>([[-1, new Group()], [-2, new Group()]])
  for (const [level, g] of basement) g.name = `main_lifts_B${-level}`
  MAIN_ACCESS.lifts.forEach((spec, i) => {
    const lift = new Lift(ctx, spec, MAIN_ACCESS, MAIN_LEVELS, 20 + i, (level) => (level < 0 ? basement.get(level as -1 | -2)! : floors[level]))
    cars.add(lift.car)
    lift.park(0)
    lifts.push(lift)
  })
  mainShafts(ctx, floors, es, basement)
  const { m } = ctx
  // The shafts: the wall between them, a pit floor under them at the ground.
  for (const [level, g] of floors.entries()) {
    const y = LEVELS[level]
    const top = level < 3 ? LEVELS[level + 1] - 0.3 : ROOF - 0.3
    const mid = (LIFTS.cars[0].z + LIFTS.cars[1].z) / 2
    k.box(g, LIFTS.x1 - LIFTS.x0 - 0.2, top - y, 0.2, m.blockwork, (LIFTS.x0 + LIFTS.x1) / 2 + 0.05, (y + top) / 2, mid)
    if (level === 0) k.box(g, LIFTS.x1 - LIFTS.x0 - 0.2, 0.1, LIFTS.z1 - LIFTS.z0 - 0.2, m.concrete, (LIFTS.x0 + LIFTS.x1) / 2, y - 0.1, (LIFTS.z0 + LIFTS.z1) / 2, false)
  }

  // The stairs, a storey at a time, each into the floor it rises from; the top landings.
  const stairs: [StairSpec, string][] = [
    [{ zone: { x0: STAIR.x0, x1: STAIR.x1 - 0.1, z0: STAIR.z0 + 0.1, z1: STAIR.z1 - 0.1 }, entry: '+z', door: '+x', at: 3.2 }, 'OPD STAIR'],
    [{ zone: { x0: FIRE_STAIR.x0, x1: FIRE_STAIR.x1 - 0.1, z0: FIRE_STAIR.z0, z1: FIRE_STAIR.z1 - 0.1 }, entry: '+z', door: '+x', at: -20.4 }, 'FIRE STAIR'],
  ]
  for (const [spec, label] of stairs) {
    const z = spec.zone
    for (let level = 0; level < 3; level++) {
      const g = new Group()
      g.name = `opd_stair_${label.split(' ')[0].toLowerCase()}_${level}`
      stairFlights(ctx, g, spec, LEVELS[level + 1] + 0.008, LEVELS[level] + 0.008)
      floors[level].add(g)
    }
    // The top floor's landing, and the balustrade across the well beside it.
    const y3 = LEVELS[3]
    k.box(floors[3], z.x1 - z.x0, 0.2, 1.2, m.concrete, (z.x0 + z.x1) / 2, y3 - 0.1 + 0.004, z.z1 - 0.6)
    k.box(floors[3], z.x1 - z.x0 - 0.04, 0.008, 1.18, m.lobbyTile, (z.x0 + z.x1) / 2, y3 + 0.008, z.z1 - 0.6, false)
    const fw = (z.x1 - z.x0 - 0.16) / 2
    k.box(floors[3], fw + 0.1, 0.04, 0.04, m.aluminium, z.x1 - fw / 2 - 0.05, y3 + 1.0, z.z1 - 1.2)
    for (let i = 0; i <= 4; i++) k.box(floors[3], 0.03, 1.0, 0.03, m.steel, z.x1 - 0.05 - (i * fw) / 4, y3 + 0.5, z.z1 - 1.2)
    for (const h of [0.35, 0.65]) k.box(floors[3], fw, 0.012, 0.012, m.steel, z.x1 - fw / 2 - 0.05, y3 + h, z.z1 - 1.2)
    // Each landing's sign: the stair, the floor, and where it leads.
    for (const [level, g] of floors.entries()) {
      const floorName = level === 0 ? 'GROUND FLOOR · EXIT' : `FLOOR ${level}`
      const mat = es[level].o.sign(`stair_${label}_${level}`, 512, 256, board(NAVY, [[label, 0.18, '#c7d3e6'], [level === 0 ? 'G' : String(level), 0.42, '#ffffff'], [floorName, 0.13, '#ffffff', 500]]))
      signPanel(es[level], g, 0.5, 0.25, mat, z.x0 + 0.012, LEVELS[level] + 1.75, z.z1 - 0.6, Math.PI / 2, 0.012)
    }
  }

  mainStair(ctx, floors, es)

  const host: LiftHost = {
    tick: (dt: number, walker: Vector3 | null) => {
      let busy = false
      const rider = walker ? { position: walker } : null
      for (const lift of lifts) {
        lift.tick(dt, rider)
        busy ||= lift.busy
      }
      // Cars and landing doors moved: the walker's collisions this frame must meet them where they are.
      if (busy) {
        cars.updateMatrixWorld()
        for (const f of floors) f.updateMatrixWorld()
      }
      return busy
    },
    liftNear: (p: Vector3) => lifts.find((l) => l.reachable(p)) ?? null,
  }
  return { lifts, host, cars, basement }
}

/**
 * The main lift bank's shafts: the partitions between the cars on every floor (the bank's own
 * walls are the plan's), each lift's name over its landing, the staff lift's card reader; and in
 * the car park, the whole core in blockwork, its landings opening onto the aisle, the pits below
 * B2, a hatched pedestrian zone in front and the sign over it.
 */
function mainShafts(ctx: BasementCtx, floors: Group[], es: OpdCtx[], basement: Map<-1 | -2, Group>) {
  const { k, m } = ctx
  const { x0, x1, z0, z1 } = MAIN_LIFTS
  const dividers = [(MAIN_LIFTS.cars[0].x + MAIN_LIFTS.cars[1].x) / 2, (MAIN_LIFTS.cars[1].x + MAIN_LIFTS.cars[2].x) / 2 + 0.075]
  const face = z0 - 0.1
  const wall = (p: Object3D, xs: [number, number], ys: [number, number], zs: [number, number], mat: Material = m.blockwork) =>
    k.box(p, xs[1] - xs[0], ys[1] - ys[0], zs[1] - zs[0], mat, (xs[0] + xs[1]) / 2, (ys[0] + ys[1]) / 2, (zs[0] + zs[1]) / 2)
  // Above the ground: the partitions, the names over the doors.
  for (const [level, g] of floors.entries()) {
    const y = LEVELS[level]
    const top = level < 3 ? LEVELS[level + 1] - 0.3 : ROOF - 0.3
    for (const x of dividers) wall(g, [x - 0.1, x + 0.1], [y, top], [z0 + 0.1, z1 - 0.1])
    landingSigns(es[level], g, y, face)
  }
  // Below: the core's walls from each level's floor to the slab over it, its landings' openings.
  for (const [level, g] of basement) {
    const y = level === -1 ? B1 : B2
    const top = level === -1 ? 0 : B1
    const bottom = level === -2 ? B2 - 1.45 : y
    let at = x0 - 0.1
    for (const car of MAIN_LIFTS.cars) {
      wall(g, [at, car.x - 0.62], [bottom, top], [face, z0 + 0.1])
      wall(g, [car.x - 0.62, car.x + 0.62], [y + 2.3, top], [face, z0 + 0.1])
      if (level === -2) wall(g, [car.x - 0.62, car.x + 0.62], [bottom, y], [face, z0 + 0.1])
      at = car.x + 0.62
    }
    wall(g, [at, x1 + 0.1], [bottom, top], [face, z0 + 0.1])
    wall(g, [x0 - 0.1, x1 + 0.1], [bottom, top], [z1 - 0.1, z1 + 0.1])
    for (const x of [x0, x1]) wall(g, [x - 0.1, x + 0.1], [bottom, top], [z0 + 0.1, z1 - 0.1])
    for (const x of dividers) wall(g, [x - 0.1, x + 0.1], [bottom, top], [z0 + 0.1, z1 - 0.1])
    if (level === -2) k.box(g, x1 - x0, 0.1, z1 - z0, m.concrete, (x0 + x1) / 2, bottom - 0.05, (z0 + z1) / 2, false)
    // The pedestrian zone before the doors: hatched, kerbed by bollards from the aisle's traffic.
    k.box(g, x1 - x0 + 0.4, 0.004, 1.6, m.hazard, (x0 + x1) / 2, y + 0.006, face - 0.8, false)
    for (const x of [x0 - 0.1, (x0 + x1) / 2, x1 + 0.1]) {
      k.cyl(g, 0.08, 0.08, 0.9, m.yellow, x, y + 0.45, face - 1.75, 16)
      k.cyl(g, 0.085, 0.085, 0.06, m.black, x, y + 0.75, face - 1.75, 16)
    }
    const sign = es[0].o.sign(`mainLiftsB${-level}`, 1024, 224, board(NAVY, [['MAIN HOSPITAL LIFTS', 0.3, '#ffffff'], ['Ground · Wards 1 · ICU & International 2 · Theatres 3', 0.15, '#c7d3e6', 500]], { cross: true }))
    signPanel(es[0], g, 2.4, 0.52, sign, (x0 + x1) / 2, y + 2.62, face - 0.02, Math.PI, 0.02)
  }
}

/** Over each landing of the main bank: the lift's name, and at the staff lift its card reader. */
function landingSigns(e: OpdCtx, g: Group, y: number, face: number) {
  for (const car of MAIN_LIFTS.cars) {
    const mat = e.o.sign(`liftname_${car.name}`, 512, 96, board(car.staff ? '#7a1f1f' : NAVY, [[car.name, 0.5, '#ffffff']]))
    signPanel(e, g, 0.92, 0.17, mat, car.x, y + 2.7, face - 0.012, Math.PI, 0.012)
    if (!car.staff) continue
    // Staff only: an access-card reader beside the call buttons, and the notice under it.
    const rx = car.x + 0.87
    e.k.box(g, 0.08, 0.12, 0.025, e.m.charcoal, rx, y + 1.45, face - 0.013)
    e.k.box(g, 0.05, 0.05, 0.002, e.m.black, rx, y + 1.47, face - 0.027, false)
    e.k.box(g, 0.012, 0.012, 0.004, e.m.green, rx, y + 1.41, face - 0.027, false)
    const note = e.o.sign('staffonly', 256, 128, board('#ffffff', [['STAFF ONLY', 0.32, '#7a1f1f'], ['Card access · Doctors & nurses', 0.14, '#333', 500]], { border: '#7a1f1f' }))
    signPanel(e, g, 0.2, 0.1, note, rx, y + 1.65, face - 0.008, Math.PI, 0.004)
  }
}

/** The main stair, the ground to the third floor: a storey of flights each into its floor, the top landing, the signs. */
function mainStair(ctx: BasementCtx, floors: Group[], es: OpdCtx[]) {
  const { k, m } = ctx
  const spec = MAIN_ACCESS.stair
  const zone = { x0: MAIN_STAIR.x0 + 0.1, x1: MAIN_STAIR.x1 - 0.1, z0: MAIN_STAIR.z0, z1: MAIN_STAIR.z1 - 0.1 }
  const st: StairSpec = { ...spec, zone }
  for (let level = 0; level < 3; level++) {
    const g = new Group()
    g.name = `main_stair_${level}`
    stairFlights(ctx, g, st, LEVELS[level + 1] + 0.008, LEVELS[level] + 0.008)
    floors[level].add(g)
  }
  // The top landing across the entry end, and the balustrade along its edge over the well.
  const y3 = LEVELS[3]
  const W = zone.z1 - zone.z0
  const fw = (W - 0.16) / 2
  k.box(floors[3], 1.2, 0.2, W, m.concrete, zone.x1 - 0.6, y3 - 0.1 + 0.004, (zone.z0 + zone.z1) / 2)
  k.box(floors[3], 1.18, 0.008, W - 0.04, m.lobbyTile, zone.x1 - 0.6, y3 + 0.008, (zone.z0 + zone.z1) / 2, false)
  const zb = zone.z1 - fw / 2 - 0.05
  k.box(floors[3], 0.04, 0.04, fw + 0.1, m.aluminium, zone.x1 - 1.2, y3 + 1.0, zb)
  for (let i = 0; i <= 4; i++) k.box(floors[3], 0.03, 1.0, 0.03, m.steel, zone.x1 - 1.2, y3 + 0.5, zone.z1 - 0.05 - (i * fw) / 4)
  for (const h of [0.35, 0.65]) k.box(floors[3], 0.012, 0.012, fw, m.steel, zone.x1 - 1.2, y3 + h, zb)
  for (const [level, g] of floors.entries()) {
    const name = level === 0 ? 'GROUND FLOOR · EXIT' : ['', 'FLOOR 1 · WARDS', 'FLOOR 2 · ICU', 'FLOOR 3 · THEATRES'][level]
    const mat = es[level].o.sign(`stair_MAIN_${level}`, 512, 256, board(NAVY, [['MAIN STAIR', 0.18, '#c7d3e6'], [level === 0 ? 'G' : String(level), 0.42, '#ffffff'], [name, 0.13, '#ffffff', 500]]))
    signPanel(es[level], g, 0.5, 0.25, mat, zone.x1 - 0.6, LEVELS[level] + 1.75, zone.z0 + 0.012, 0, 0.012)
  }
}
