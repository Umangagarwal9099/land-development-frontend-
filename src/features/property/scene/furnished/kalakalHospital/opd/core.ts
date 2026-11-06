import { Group, type Vector3 } from 'three'
import { Lift, type Level as LiftLevel } from '../../basement/access'
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
import { FIRE_STAIR, LEVELS, LIFTS, STAIR } from './plan'

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
}

/** Builds the lifts and stairs into the floors' groups (`floors[level]`), the cars into their own. */
export function buildCore(k: Kit, lighting: Lighting, floors: Group[], es: OpdCtx[]): Core {
  const ctx: BasementCtx = { k, m: basementMaterials(k, lighting), spec: HOSPITAL_BASEMENT, lighting, shade: new Contact(), decals: new Decals(), r: rng(7711) }
  const cars = new Group()
  cars.name = 'opd_lift_cars'
  const lifts = ACCESS.lifts.map((spec, i) => {
    const lift = new Lift(ctx, spec, ACCESS, LIFT_LEVELS, 10 + i, (level) => floors[level])
    cars.add(lift.car)
    lift.park(0)
    return lift
  })
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

  const host: LiftHost = {
    tick: (dt: number, walker: Vector3 | null) => {
      let busy = false
      const rider = walker ? { position: walker } : null
      for (const lift of lifts) {
        lift.tick(dt, rider)
        busy ||= lift.busy
      }
      if (busy) cars.updateMatrixWorld()
      return busy
    },
    liftNear: (p: Vector3) => lifts.find((l) => l.reachable(p)) ?? null,
  }
  return { lifts, host, cars }
}
