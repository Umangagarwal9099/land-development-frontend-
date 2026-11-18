import { BoxGeometry, Group, Mesh, MeshStandardMaterial, type Material, type Object3D, type Vector3 } from 'three'
import { Lift, stairFlights, type Level as LiftLevel } from '../../basement/access'
import { Decals, type Ctx as BasementCtx } from '../../basement/build'
import { basementMaterials } from '../../basement/materials'
import { B1, B2, type AccessSpec, type StairSpec } from '../../basement/spec'
import type { Kit } from '../../kit'
import type { Lighting } from '../../shared'
import { rng } from '../../textures'
import { MALL_BASEMENT } from '../basement'
import { Contact } from '../contact'
import { place } from './signs'
import { bx, type FloorCtx } from './shell'
import { FLOORS, LEVELS, LIFTS, STAIRS, type StairPlan } from './units'

/*
 * The mall's vertical circulation apart from the escalators: the two passenger lifts, side by
 * side off the west spine, serving every level from B2 to the fourth floor (the same controller
 * as the car parks' lifts: real doors, collective control, call buttons and indicators, the
 * walker rides the car), and the three fire stairs, each a continuous dog-leg in a fire-rated
 * enclosure from the ground to the fourth floor, with a fire door onto every level, an exit
 * door out of the building at the ground, and every tread a real step.
 */

/** The lifts' levels, top down: the five floors, then the car park's two. */
const LIFT_LEVELS: LiftLevel[] = [
  ...[4, 3, 2, 1, 0].map((l) => ({ level: l, y: LEVELS[l] + 0.006, name: l === 0 ? 'G' : String(l) })),
  { level: -1, y: B1, name: 'B1' },
  { level: -2, y: B2, name: 'B2' },
]

/** The lifts' landing face: the west spine's side of their front wall. */
const ACCESS: AccessSpec = {
  rect: { x0: LIFTS.x0, x1: LIFTS.x1, z0: LIFTS.z0, z1: LIFTS.z1 },
  face: '+x',
  ground: { y: LEVELS[0], top: LEVELS[1] - 0.25, label: 'Mall', frontWall: true },
  lifts: LIFTS.cars.map((c) => ({ x: c.x, z: c.z, w: 1.6, d: 1.6, door: '+x' as const, call: 1 as const, plate: ['16 persons', '1088 kg'] as [string, string] })),
  stair: { zone: { x0: LIFTS.x0, x1: LIFTS.x1, z0: LIFTS.z0, z1: LIFTS.z1 }, entry: '+z', door: '+x', at: 0 },
}

export interface Core {
  lifts: Lift[]
  cars: Group
  /** What the lifts bring down into the car park, by basement level (see Basement.onBuild). */
  basement: Map<-1 | -2, Group>
  tick: (dt: number, walker: Vector3 | null) => boolean
  liftNear: (p: Vector3) => Lift | null
}

export function buildCore(k: Kit, lighting: Lighting, floors: Group[], es: FloorCtx[]): Core {
  // The car parks' finishes, with a mall car's: champagne stainless doors and walls, a bronze mirror.
  const base = basementMaterials(k, lighting)
  const champagne = new MeshStandardMaterial({ color: '#cdb892', metalness: 0.85, roughness: 0.28 })
  const mirror = new MeshStandardMaterial({ color: '#c9b9a0', metalness: 1, roughness: 0.06 })
  const ctx: BasementCtx = { k, m: { ...base, stainless: champagne, mirror }, spec: MALL_BASEMENT, lighting, shade: new Contact(), decals: new Decals(), r: rng(9101) }

  const cars = new Group()
  cars.name = 'mall_lift_cars'
  const basement = new Map<-1 | -2, Group>([[-1, new Group()], [-2, new Group()]])
  for (const [level, g] of basement) g.name = `mall_lifts_B${-level}`
  const lifts = ACCESS.lifts.map((spec, i) => {
    const lift = new Lift(ctx, spec, ACCESS, LIFT_LEVELS, 30 + i, (level) => (level < 0 ? basement.get(level as -1 | -2)! : floors[level]))
    cars.add(lift.car)
    lift.park(0)
    return lift
  })
  shafts(ctx, floors, es, basement)
  for (const s of STAIRS) stair(ctx, floors, es, s)

  return {
    lifts,
    cars,
    basement,
    tick: (dt, walker) => {
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
        for (const g of basement.values()) g.updateMatrixWorld()
      }
      return busy
    },
    liftNear: (p) => lifts.find((l) => l.reachable(p)) ?? null,
  }
}

const OPEN = 0.69
const OPEN_H = 2.29

/** The shafts' walls on every level, the lobby's feature wall round the doors, and the car park's landings. */
function shafts(ctx: BasementCtx, floors: Group[], es: FloorCtx[], basement: Map<-1 | -2, Group>) {
  const { x0, x1, z0, z1, cars } = LIFTS
  const T = 0.2
  const mid = (cars[0].z + cars[1].z) / 2
  const walls = (p: Object3D, y: number, top: number, bottom = y, mat: Material = ctx.m.blockwork) => {
    const b = (a: number, c: number, y0: number, y1: number, d: number, f: number, mm: Material = mat) => bx(es[0], p, a, c, y0, y1, d, f, mm)
    b(x0, x0 + T, bottom, top, z0, z1)
    b(x0, x1, bottom, top, z0, z0 + T)
    b(x0, x1, bottom, top, z1 - T, z1)
    b(x0 + T, x1 - T, bottom, top, mid - 0.1, mid + 0.1)
    // The front wall, open at each car's doors.
    let at = z0 + T
    for (const c of [...cars].sort((a, b) => a.z - b.z)) {
      b(x1 - T, x1, bottom, top, at, c.z - OPEN + 0.07)
      b(x1 - T, x1, y + OPEN_H - 0.14, top, c.z - OPEN + 0.07, c.z + OPEN - 0.07)
      if (bottom < y) b(x1 - T, x1, bottom, y, c.z - OPEN + 0.07, c.z + OPEN - 0.07)
      at = c.z + OPEN - 0.07
    }
    b(x1 - T, x1, bottom, top, at, z1 - T)
  }
  for (const [level, g] of floors.entries()) {
    const e = es[level]
    walls(g, e.y, e.soffit)
    // (The lobby's face of the wall, in marble with bronze portals, is architecture.ts's liftWall.)
    const sign = e.s.wayfinding(['LIFTS', 'B2 · B1 · G · 1 · 2 · 3 · 4'])
    place(g, 1.5, 0.375, sign, e.s.lit, x1 + 0.03, e.y + e.ceiling - 0.45, mid, Math.PI / 2)
    lobbyLevel(e, g)
  }
  // Below ground: the core in blockwork from each level's floor to the slab over it, the pits under B2.
  for (const [level, g] of basement) {
    const y = level === -1 ? B1 : B2
    const top = level === -1 ? 0 : B1
    walls(g, y, top, level === -2 ? B2 - 1.45 : y)
    if (level === -2) bx(es[0], g, x0, x1, B2 - 1.5, B2 - 1.45, z0, z1, ctx.m.concrete, false)
    // The hatched pedestrian zone before the doors and the bollards guarding it from the lane.
    bx(es[0], g, x1, x1 + 0.65, y + 0.002, y + 0.006, z0 - 0.2, z1 + 0.2, ctx.m.hazard, false)
    for (const z of [z0 - 0.15, mid, z1 + 0.15]) {
      ctx.k.cyl(g, 0.08, 0.08, 0.9, ctx.m.yellow, x1 + 0.55, y + 0.45, z, 16)
      ctx.k.cyl(g, 0.085, 0.085, 0.06, ctx.m.black, x1 + 0.55, y + 0.75, z, 16)
    }
    const sign = es[0].s.wayfinding(['MALL LIFTS', 'G · 1 · 2 · 3 · 4 · Food court & cinema 4'], '#1f3a5f', '#ffffff', '#ffd23f')
    place(g, 1.8, 0.45, sign, es[0].s.lit, x1 + 0.012, y + 2.55, mid, Math.PI / 2)
  }
}

/** The floor's name and what is on it, on a directory board by the lifts (the ground floor has none). */
function lobbyLevel(e: FloorCtx, g: Group) {
  if (e.level === 0) return
  const plan = FLOORS[e.level]
  const entries = plan.units
    .filter((u) => u.kind !== 'service' && u.kind !== 'washroom')
    .map((u) => `${u.id}|${u.name}`)
  if (plan.hall) entries.push(`${plan.label}-H|${plan.hall.name}`)
  const uv = e.s.directory(plan.label === 'G' ? 'G' : plan.label, plan.title.split('·')[1]?.trim() ?? plan.title, entries.slice(0, 20))
  // A free-standing totem on the spine, opposite the lifts.
  const x = LIFTS.x1 + 2.55
  const z = LIFTS.z1 + 0.9
  bx(e, g, x - 0.06, x + 0.06, e.y, e.y + 2.1, z - 0.36, z + 0.36, e.m.bronze)
  place(g, 0.6, 0.9, uv, e.s.board, x - 0.062, e.y + 1.35, z, -Math.PI / 2)
  place(g, 0.6, 0.9, uv, e.s.board, x + 0.062, e.y + 1.35, z, Math.PI / 2)
}

/* ---------- fire stairs ---------- */

type Face = '+x' | '-x' | '+z' | '-z'

/** A face of the stair's enclosure: its wall line, and which way is out of the stair. */
function faceOf(s: StairPlan, f: Face) {
  const [x0, x1, z0, z1] = s.zone
  const T = 0.2
  switch (f) {
    case '+x':
      return { axis: 'x' as const, at: x1 + T / 2, from: z0 - T, to: z1 + T, out: 1 }
    case '-x':
      return { axis: 'x' as const, at: x0 - T / 2, from: z0 - T, to: z1 + T, out: -1 }
    case '+z':
      return { axis: 'z' as const, at: z1 + T / 2, from: x0 - T, to: x1 + T, out: 1 }
    default:
      return { axis: 'z' as const, at: z0 - T / 2, from: x0 - T, to: x1 + T, out: -1 }
  }
}

function stair(ctx: BasementCtx, floors: Group[], es: FloorCtx[], s: StairPlan) {
  const [x0, x1, z0, z1] = s.zone
  const spec: StairSpec = { zone: { x0, x1, z0, z1 }, entry: s.entry, door: s.door, at: s.at }
  const faces: Face[] = ['+x', '-x', '+z', '-z']
  for (const [level, g] of floors.entries()) {
    const e = es[level]
    // The storey up to the next floor: flights, half landing and this floor's landing.
    if (level < floors.length - 1) {
      const st = new Group()
      st.name = `stair_${s.id}_${level}`
      stairFlights(ctx, st, spec, LEVELS[level + 1] + 0.006, LEVELS[level] + 0.006)
      g.add(st)
    } else {
      // The top landing, and a balustrade across the well beside it.
      const lz = s.entry === '+z' ? [z1 - 1.2, z1] : [z0, z0 + 1.2]
      bx(e, g, x0, x1, e.y - 0.2, e.y + 0.006, lz[0], lz[1], ctx.m.lobbyTile)
      const zr = s.entry === '+z' ? lz[0] : lz[1]
      bx(e, g, x0, x1, e.y + 0.98, e.y + 1.02, zr - 0.02, zr + 0.02, ctx.m.aluminium)
      for (let i = 0; i <= 5; i++) bx(e, g, x0 + ((x1 - x0) * i) / 5 - 0.015, x0 + ((x1 - x0) * i) / 5 + 0.015, e.y, e.y + 1.0, zr - 0.015, zr + 0.015, ctx.m.steel)
    }
    // The enclosure, with its doors.
    for (const f of faces) {
      const w = faceOf(s, f)
      const doors: { at: number; exit: boolean }[] = []
      if (f === s.door) doors.push({ at: s.at, exit: false })
      if (level === 0 && f === s.exit.face && !(f === s.door && s.exit.at === s.at)) doors.push({ at: s.exit.at, exit: true })
      const cuts = doors.map((d): [number, number] => [d.at - 0.55, d.at + 0.55])
      let from = w.from
      for (const [a, b] of [...cuts.sort((p, q) => p[0] - q[0]), [w.to, w.to] as [number, number]]) {
        wall(e, g, w.axis, w.at, from, a, e.y, e.soffit, ctx.m.blockwork)
        from = b
      }
      for (const d of doors) {
        wall(e, g, w.axis, w.at, d.at - 0.55, d.at + 0.55, e.y + 2.25, e.soffit, ctx.m.blockwork)
        fireDoor(ctx, e, g, w.axis, w.at, d.at, w.out, `${s.id}_${level}${d.exit ? '_exit' : ''}`, d.exit)
      }
    }
    // The landing's sign: the stair, the level, the way out.
    const uv = e.s.wayfinding([`${s.name}`, level === 0 ? 'GROUND · EXIT TO OUTSIDE' : `LEVEL ${level} · DOWN TO EXIT`], '#14843f', '#ffffff', '#ffffff')
    const [sx, sz, yaw] = s.entry === '+z' ? [(x0 + x1) / 2, z1 - 0.005, Math.PI] : [(x0 + x1) / 2, z0 + 0.005, 0]
    place(g, 1.0, 0.25, uv, e.s.lit, sx, e.y + 2.05, sz, yaw)
  }
}

function wall(e: FloorCtx, g: Object3D, axis: 'x' | 'z', at: number, from: number, to: number, y0: number, y1: number, mat: Material) {
  if (to - from < 0.02) return
  if (axis === 'x') bx(e, g, at - 0.1, at + 0.1, y0, y1, from, to, mat)
  else bx(e, g, from, to, y0, y1, at - 0.1, at + 0.1, mat)
}

/**
 * A fire door in the enclosure: a steel frame, a red-painted leaf on its hinge (a `door_` node the
 * walker opens), push bar on the stair side, and the lit EXIT sign over it on both sides.
 */
function fireDoor(ctx: BasementCtx, e: FloorCtx, g: Object3D, axis: 'x' | 'z', at: number, along: number, out: number, name: string, exit: boolean) {
  const { m } = ctx
  const W = 1.0
  const H = 2.1
  const y = e.y
  const box = (a0: number, a1: number, y0: number, y1: number, o0: number, o1: number, mat: Material, p: Object3D = g) =>
    axis === 'x' ? bx(e, p, at + o0, at + o1, y0, y1, a0, a1, mat) : bx(e, p, a0, a1, y0, y1, at + o0, at + o1, mat)
  // Frame.
  box(along - W / 2 - 0.06, along - W / 2, y, y + H + 0.06, -0.11, 0.11, m.steel)
  box(along + W / 2, along + W / 2 + 0.06, y, y + H + 0.06, -0.11, 0.11, m.steel)
  box(along - W / 2 - 0.06, along + W / 2 + 0.06, y + H, y + H + 0.06, -0.11, 0.11, m.steel)
  // The leaf, hinged at its −along edge, opening outwards (the way of escape).
  const hinge = new Group()
  hinge.name = `door_fire_${name}`
  hinge.userData.label = exit ? 'Fire Exit' : 'Fire Door'
  const hx = axis === 'x' ? at + out * 0.08 : along - W / 2
  const hz = axis === 'x' ? along - W / 2 : at + out * 0.08
  hinge.position.set(hx, 0, hz)
  // Swinging the leaf's free end out of the stair: a quarter turn the right way round.
  hinge.userData.openAngle = (axis === 'x' ? out : -out) * (Math.PI / 2)
  g.add(hinge)
  const leaf = new Mesh(new BoxGeometry(axis === 'x' ? 0.05 : W - 0.01, H - 0.01, axis === 'x' ? W - 0.01 : 0.05), exit ? m.fireDoor : m.fireDoor)
  leaf.position.set(axis === 'x' ? 0 : W / 2, y + H / 2, axis === 'x' ? W / 2 : 0)
  leaf.castShadow = true
  leaf.receiveShadow = true
  leaf.userData.front = true
  hinge.add(leaf)
  // Push bar on the stair side, pull handle outside.
  const bar = new Mesh(new BoxGeometry(axis === 'x' ? 0.04 : W * 0.7, 0.05, axis === 'x' ? W * 0.7 : 0.04), m.aluminium)
  bar.position.set(axis === 'x' ? -out * 0.05 : W * 0.5, y + 1.0, axis === 'x' ? W * 0.5 : -out * 0.05)
  hinge.add(bar)
  // EXIT signs over it, lit, both faces.
  const uv = e.s.pictogram('exit')
  for (const side of [-1, 1]) {
    const [sx, sz] = axis === 'x' ? [at + side * 0.125, along] : [along, at + side * 0.125]
    const yaw = axis === 'x' ? (side > 0 ? Math.PI / 2 : -Math.PI / 2) : side > 0 ? 0 : Math.PI
    place(g, 0.34, 0.34, uv, e.s.lit, sx, y + H + 0.3, sz, yaw)
  }
}
