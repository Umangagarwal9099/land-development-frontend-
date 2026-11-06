import { BoxGeometry, Group, Mesh, MeshBasicMaterial, type Material, type MeshStandardMaterial } from 'three'
import type { Point2 } from '../../../../../../api/types'
import { GOLD } from '../../../../../../lib/palette'
import { box } from '../../kalakalA01/building'
import { switchPlate } from '../../kalakalD65/fixtures'
import { rect, slab } from '../../kalakalMall/solids'
import { Tris } from '../../kalakalMall/skin'
import { bake, bentTube, face, put, signPanel } from '../erKit'
import { COURT, ROOF } from '../plan'
import { inward, Room, type OpdCtx } from './ctx'
import { lampFace, magnet, radiation, roomPlate, board } from './paints'
import { CEILING, CORE_WALL, FIRE_STAIR, LEVELS, LIFTS, STAIR, WALL, circulationZone, roomMesh, type Dir, type DoorSpec, type Glazing, type RoomSpec } from './plan'

type R = [number, number]
const PI = Math.PI

/* ---------- walls from the rooms ---------- */

interface Seg {
  axis: 'x' | 'z'
  c: number
  a: number
  b: number
  room: RoomSpec
  side: Dir
  /** The room lies on the line's high side. */
  pos: boolean
}

/** A run of wall on a line (x = c along z, or z = c along x), and the rooms either side of it. */
export interface WallRun {
  axis: 'x' | 'z'
  c: number
  a: number
  b: number
  t: number
  pos?: RoomSpec
  neg?: RoomSpec
}

const sidesOf = (r: RoomSpec): Seg[] => {
  const [x0, x1, z0, z1] = r.rect
  return [
    { axis: 'x', c: x0, a: z0, b: z1, room: r, side: '-x', pos: true },
    { axis: 'x', c: x1, a: z0, b: z1, room: r, side: '+x', pos: false },
    { axis: 'z', c: z0, a: x0, b: x1, room: r, side: '-z', pos: true },
    { axis: 'z', c: z1, a: x0, b: x1, room: r, side: '+z', pos: false },
  ]
}

const joins = (r: RoomSpec) => r.kind === 'circulation' || r.kind === 'public'
const opened = (r: RoomSpec, side: Dir, m: number) => !!r.open?.includes(side) || !!r.gaps?.some((g) => g.side === side && g.from <= m && m <= g.to)

/**
 * Every wall on the floor: wherever a room's side meets another room or nothing, unless the
 * building's façade (or a neighbour's wall) is there already, both sides are circulation, or a
 * room leaves that side open.
 */
export function wallRuns(e: OpdCtx): WallRun[] {
  const lines = new Map<string, Seg[]>()
  for (const r of e.plan.rooms)
    for (const s of sidesOf(r)) {
      const key = `${s.axis}:${Math.round(s.c * 100)}`
      if (!lines.has(key)) lines.set(key, [])
      lines.get(key)!.push(s)
    }
  const runs: WallRun[] = []
  for (const segs of lines.values()) {
    const { axis, c } = segs[0]
    const pts = [...new Set(segs.flatMap((s) => [s.a, s.b]))].sort((p, q) => p - q)
    let cur: WallRun | null = null
    for (let i = 0; i + 1 < pts.length; i++) {
      const [p, q] = [pts[i], pts[i + 1]]
      if (q - p < 0.005) continue
      const m = (p + q) / 2
      const pos = segs.find((s) => s.pos && s.a <= m && m <= s.b)
      const neg = segs.find((s) => !s.pos && s.a <= m && m <= s.b)
      // Two rooms' sides on one line with nothing between them: no wall in the gap.
      if (!pos && !neg) {
        cur = null
        continue
      }
      const facade = e.plan.facade.some((f) => f.axis === axis && Math.abs(f.c - c) < 0.08 && f.from - 0.01 <= m && m <= f.to + 0.01)
      let wall = !facade
      if (pos && neg && joins(pos.room) && joins(neg.room)) wall = false
      if ((pos && opened(pos.room, pos.side, m)) || (neg && opened(neg.room, neg.side, m))) wall = false
      if (!wall) {
        cur = null
        continue
      }
      const t = pos?.room.thick?.includes(pos.side) || neg?.room.thick?.includes(neg.side) ? CORE_WALL : WALL
      if (cur && cur.b === p && cur.t === t && cur.pos === pos?.room && cur.neg === neg?.room) cur.b = q
      else runs.push((cur = { axis, c, a: p, b: q, t, pos: pos?.room, neg: neg?.room }))
    }
  }
  return runs
}

/** An opening cut into a run: a door to `head`, or a window from `sill` to `head`. */
interface Cut {
  a: number
  b: number
  sill: number
  head: number
}

/* ---------- the shell ---------- */

export interface Shell {
  rooms: Room[]
  /** Each room's hotspot overlay material, by hotspot name. */
  highlights: Map<string, MeshBasicMaterial>
}

/** The top of a wall: the core's go up to the slab over them (shafts), the rest stop above the ceiling. */
function wallTop(e: OpdCtx, t: number) {
  const next = e.level < 3 ? LEVELS[e.level + 1] : ROOF
  return t >= CORE_WALL ? next - 0.3 : e.y + CEILING + 0.06
}

/** Builds a floor's shell into e.root and returns its rooms, ready for their fitters. */
export function buildShell(e: OpdCtx): Shell {
  const { m, o } = e
  const y = e.y
  const runs = wallRuns(e)
  const paint = new Tris()
  const skirting = new Tris()
  const tiles = new Tris()
  const rails = new Tris()
  const board = new Tris()
  const floors = new Map<Material, Tris>()
  const floorOf = (mat: Material) => {
    let t = floors.get(mat)
    if (!t) floors.set(mat, (t = new Tris()))
    return t
  }

  // The rooms: their clear insides (half the wall in from each walled side), their façade sides.
  const rooms = new Map<RoomSpec, Room>()
  for (const spec of e.plan.rooms) {
    const inset: Record<Dir, number> = { '-x': 0, '+x': 0, '-z': 0, '+z': 0 }
    const exterior: Dir[] = []
    for (const s of sidesOf(spec)) {
      const mine = runs.filter((w) => w.axis === s.axis && Math.abs(w.c - s.c) < 0.005 && w.b > s.a && w.a < s.b && (s.pos ? w.pos === spec : w.neg === spec))
      if (mine.length) inset[s.side] = Math.max(...mine.map((w) => w.t)) / 2
      const mid = (s.a + s.b) / 2
      if (e.plan.facade.some((f) => f.axis === s.axis && Math.abs(f.c - s.c) < 0.08 && f.from <= mid && mid <= f.to)) exterior.push(s.side)
    }
    const quiet = !!spec.quiet
    const room = new Room(e, spec, inset, exterior, quiet ? circulationZone(e.level) : roomMesh(e.level, spec.id), quiet ? circulationZone(e.level) : roomMesh(e.level, spec.id))
    rooms.set(spec, room)
  }

  // Openings, by line: each room's doors and glazing on the side they are in.
  const cuts = new Map<WallRun, Cut[]>()
  const doorAt: { room: Room; spec: DoorSpec; run: WallRun }[] = []
  const glassAt: { room: Room; spec: Glazing; run: WallRun }[] = []
  for (const [spec, room] of rooms) {
    for (const s of sidesOf(spec)) {
      const onSide = (at: number) =>
        runs.find((w) => w.axis === s.axis && Math.abs(w.c - s.c) < 0.005 && w.a <= at && at <= w.b && (w.pos === spec || w.neg === spec))
      for (const d of spec.doors ?? []) {
        if (d.side !== s.side) continue
        const run = onSide(d.at)
        if (!run) continue
        const w = d.w ?? 1.0
        const head = d.kind === 'double' || d.kind === 'lead' || d.kind === 'mri' ? 2.25 : 2.15
        if (!cuts.has(run)) cuts.set(run, [])
        cuts.get(run)!.push({ a: d.at - w / 2 - 0.05, b: d.at + w / 2 + 0.05, sill: 0, head: head + 0.05 })
        doorAt.push({ room, spec: d, run })
      }
      for (const gz of spec.glazing ?? []) {
        if (gz.side !== s.side) continue
        const run = onSide((gz.from + gz.to) / 2)
        if (!run) continue
        if (!cuts.has(run)) cuts.set(run, [])
        cuts.get(run)!.push({ a: gz.from, b: gz.to, sill: gz.sill, head: gz.head })
        glassAt.push({ room, spec: gz, run })
      }
    }
  }
  // The lift landings: openings for the doors of each car in the bank's corridor wall.
  const lifts = e.plan.rooms.find((r) => r.id === 'lifts')
  if (lifts) {
    const run = runs.find((w) => w.axis === 'x' && Math.abs(w.c - LIFTS.x0) < 0.005 && (w.pos === lifts || w.neg === lifts))
    if (run) {
      if (!cuts.has(run)) cuts.set(run, [])
      for (const car of LIFTS.cars) cuts.get(run)!.push({ a: car.z - 0.62, b: car.z + 0.62, sill: 0, head: 2.3 })
    }
  }

  // Build every run, cut for its openings, with its skirtings and its linings either side.
  for (const run of runs) {
    const top = wallTop(e, run.t)
    const own = (cuts.get(run) ?? []).sort((p, q) => p.a - q.a)
    // Solid spans between openings run full height; over and under each opening, the wall above its head and below its sill.
    const pieces: { a: number; b: number; y0: number; y1: number; floor: boolean }[] = []
    let at = run.a
    for (const cut of own) {
      if (cut.a > at) pieces.push({ a: at, b: cut.a, y0: y, y1: top, floor: true })
      if (cut.sill > 0) pieces.push({ a: cut.a, b: cut.b, y0: y, y1: y + cut.sill, floor: true })
      if (y + cut.head < top) pieces.push({ a: cut.a, b: cut.b, y0: y + cut.head, y1: top, floor: false })
      at = Math.max(at, cut.b)
    }
    if (at < run.b) pieces.push({ a: at, b: run.b, y0: y, y1: top, floor: true })
    const half = run.t / 2
    for (const p of pieces) {
      // Full-height ends reach past the line's end into the crossing wall, so corners close.
      const ea = p.a === run.a ? half : 0
      const eb = p.b === run.b ? half : 0
      const span: R = [p.a - ea, p.b + eb]
      const across: R = [run.c - half, run.c + half]
      if (run.axis === 'x') box(paint, across, [p.y0, p.y1], span)
      else box(paint, span, [p.y0, p.y1], across)
      if (!p.floor) continue
      // Each face: skirting; tiles in wet rooms; a crash rail along corridors.
      for (const [r, s] of [[run.pos, 1], [run.neg, -1]] as const) {
        const f = run.c + s * half
        const along: R = [p.a, p.b]
        const lining = (t: Tris, d: number, ys: R) => {
          const off: R = s > 0 ? [f, f + d] : [f - d, f]
          if (run.axis === 'x') box(t, off, ys, along)
          else box(t, along, ys, off)
        }
        if (r?.tiled) lining(tiles, 0.008, [y, Math.min(y + 2.1, p.y1)])
        lining(skirting, r?.tiled ? 0.014 : 0.012, [y, y + 0.1])
        if (r?.kind === 'circulation' && p.y1 - y > 1.2) lining(rails, 0.03, [y + 0.84, y + 0.99])
      }
    }
  }

  // Floors, ceilings and the pelmets behind the façade's glass above them.
  const ceilingMats = new Map<Room, MeshStandardMaterial>()
  for (const [spec, room] of rooms) {
    const [x0, x1, z0, z1] = spec.rect
    const shaft = spec.id === 'lifts' || ((spec.id === 'stair' || spec.id === 'firestair') && e.level > 0)
    if (!shaft) {
      const mat = o.floor[spec.floor ?? 'vinyl']
      box(floorOf(mat), [x0, x1], [y, y + 0.012], [z0, z1])
    }
    if ((spec.ceiling ?? 'tiles') === 'open') continue
    const kind = spec.ceiling ?? 'tiles'
    const mat = (kind === 'board' ? m.plasterboard : m.tiles).clone()
    e.lighting.glow(mat, 0.3)
    room.circuit.glows.push(mat)
    ceilingMats.set(room, mat)
    const t = new Tris()
    box(t, [x0, x1], [y + CEILING, y + CEILING + 0.015], [z0, z1])
    t.mesh(mat, room.group, `ceiling_${spec.id}`, false)
  }
  for (const f of e.plan.facade) {
    // Which side of the line the OPD is on.
    const mid = (f.from + f.to) / 2
    const probe = (d: number): [number, number] => (f.axis === 'x' ? [f.c + d, mid] : [mid, f.c + d])
    const inside = (d: number) => e.plan.rooms.some((r) => {
      const [px, pz] = probe(d)
      return px > r.rect[0] && px < r.rect[1] && pz > r.rect[2] && pz < r.rect[3]
    })
    const s = inside(0.2) ? 1 : inside(-0.2) ? -1 : 0
    if (!s) continue
    const next = e.level < 3 ? LEVELS[e.level + 1] : ROOF
    const off: R = s > 0 ? [f.c, f.c + 0.04] : [f.c - 0.04, f.c]
    if (f.axis === 'x') box(board, off, [y + CEILING, next - 0.3], [f.from, f.to])
    else box(board, [f.from, f.to], [y + CEILING, next - 0.3], off)
  }

  paint.mesh(m.paint, e.root, 'opd_walls')
  skirting.mesh(m.skirting, e.root, 'opd_skirting', false)
  if (!tiles.empty) tiles.mesh(o.wallTile, e.root, 'opd_wall_tiles', false)
  if (!rails.empty) rails.mesh(o.rail, e.root, 'opd_crash_rails', false)
  if (!board.empty) board.mesh(m.plasterboard, e.root, 'opd_pelmets', false)
  for (const [mat, t] of floors) t.mesh(mat, e.root, 'opd_floor', false)

  // The structural slab under an upper floor, open over the stairs, the lifts and the court.
  if (e.level > 0) {
    const holes: Point2[][] = [
      rect(STAIR.x0 + 0.01, STAIR.x1 - 0.1, STAIR.z0 + 0.1, STAIR.z1 - 0.1),
      rect(FIRE_STAIR.x0 + 0.01, FIRE_STAIR.x1 - 0.1, FIRE_STAIR.z0 + 0.01, FIRE_STAIR.z1 - 0.1),
      rect(LIFTS.x0 + 0.1, LIFTS.x1 - 0.1, LIFTS.z0 + 0.1, LIFTS.z1 - 0.1),
    ]
    if (e.level >= 2) holes.push(rect(COURT.x0, COURT.x1, COURT.z0, COURT.z1))
    slab(e.root, e.plan.plate, y - 0.3, y, o.concrete, holes, false, `opd_slab_${e.level}`)
  }

  for (const d of doorAt) buildDoor(e, d.room, d.spec, d.run)
  for (const g of glassAt) buildGlazing(e, g.room, g.spec, g.run)
  for (const room of rooms.values()) overhead(e, room, ceilingMats.has(room))
  for (const room of rooms.values()) sockets(e, room)
  windowBoards(e)

  // Hotspots: the floor of every room a visitor can open, faintly lit when chosen.
  const highlights = new Map<string, MeshBasicMaterial>()
  for (const room of rooms.values()) {
    if (room.spec.quiet) continue
    const g = new Group()
    g.name = room.mesh
    g.userData.height = CEILING - 0.1
    // Rooms whose middle is taken by a machine open from their door, looking along it.
    const eye = ENTRY[`${e.level}:${room.spec.id}`]
    if (eye) g.userData.eye = { from: [eye[0], y + eye[1], eye[2]], to: [eye[3], y + eye[4], eye[5]] }
    const mat = new MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0, depthWrite: false })
    const s = new Mesh(new BoxGeometry(room.w, 0.01, room.d), mat)
    s.position.set(room.cx, y + 0.03, room.cz)
    s.renderOrder = 2
    g.add(s)
    room.group.add(g)
    highlights.set(room.mesh, mat)
  }
  return { rooms: [...rooms.values()], highlights }
}

/** Composed room-viewer entries (plan x, height, z from; and to), by `level:id`. */
const ENTRY: Record<string, [number, number, number, number, number, number]> = {
  '3:mri': [8.6, 1.65, -21.1, 3.8, 1.0, -23.4],
  '3:ct': [-7.9, 1.65, -7.45, -9.5, 0.95, -11.6],
}

/* ---------- doors ---------- */

/** A frame on a door: origin at the opening's centre on the wall's centre line, +z into the room, +x to the right looking out. */
function doorFrame(e: OpdCtx, room: Room, d: DoorSpec, run: WallRun) {
  const [nx, nz] = inward(d.side)
  const g = new Group()
  const x = run.axis === 'x' ? run.c : d.at
  const z = run.axis === 'x' ? d.at : run.c
  g.position.set(x, e.y, z)
  g.rotation.y = Math.atan2(nx, nz)
  room.group.add(g)
  room.doors.push({ spec: d, x, z, n: [nx, nz], u: run.axis === 'x' ? [0, 1] : [1, 0], w: d.w ?? 1.0 })
  return g
}

let doorCount = 0

/**
 * A hospital door in its frame: flush leaves in pale ash laminate (white in wet and service
 * rooms, grey enamel lead-lined for X-ray and CT, the MRI's RF door with its copper edge), each on
 * its hinges as a door_* the visitor opens; a vision panel, stainless kick plates and levers; the
 * room's number plate outside and its light switch inside, by the latch.
 */
function buildDoor(e: OpdCtx, room: Room, d: DoorSpec, run: WallRun) {
  const { k, m, o } = e
  const G = doorFrame(e, room, d, run)
  const w = d.w ?? 1.0
  const t = run.t
  const kind = d.kind ?? 'single'
  const H = kind === 'double' || kind === 'lead' || kind === 'mri' ? 2.25 : 2.15
  const spec = room.spec
  const wet = spec.kind === 'wet' || spec.kind === 'service' || spec.kind === 'core'
  // The frame: steel jambs and head wrapping the wall, white.
  for (const s of [-1, 1]) k.box(G, 0.05, H + 0.05, t + 0.03, o.frame, s * (w / 2 + 0.025), (H + 0.05) / 2, 0)
  k.box(G, w + 0.1, 0.05, t + 0.03, o.frame, 0, H + 0.025, 0)
  const pair = kind === 'double' || ((kind === 'lead' || kind === 'mri') && w >= 1.4)
  const leafMat = kind === 'lead' || kind === 'mri' ? o.leadDoor : kind === 'fire' || wet ? o.doorWhite : o.door
  const out = d.out ? -1 : 1
  const leaves: [number, number][] = pair ? [[-1, w * 0.5], [1, w * 0.5]] : [[d.hinge ?? 1, w]]
  for (const [side, lw] of leaves) {
    const node = new Group()
    node.name = `door_opd_${e.level}_${spec.id}_${doorCount++}`
    node.position.set(side * (w / 2), 0, out * (t / 2 - 0.004))
    node.userData.openAngle = out * side * 1.62
    node.userData.label = d.internal ? 'Door' : kind === 'fire' ? `${spec.name} Door` : `${spec.name} Door`
    G.add(node)
    const L = new Group()
    L.position.set(-side * (lw / 2 - 0.003), 0, -out * 0.0225)
    node.add(L)
    const th = kind === 'lead' || kind === 'mri' ? 0.06 : 0.045
    const leaf = k.box(L, lw - 0.008, H - 0.012, th, kind === 'glass' ? o.frame : leafMat, 0, (H - 0.012) / 2 + 0.006, 0)
    leaf.userData.front = true
    // Vision panel near the latch, in rooms where staff look in before entering.
    const latch = -side * (lw / 2 - 0.26)
    if (kind === 'glass') k.box(L, lw - 0.12, H - 0.15, th + 0.004, o.screenGlass, 0, H / 2, 0, false)
    else if (!wet && kind !== 'mri' && spec.kind !== 'restricted' && !d.internal && spec.fit !== 'toilet_f') {
      const vh = kind === 'lead' ? 0.3 : 0.7
      k.box(L, 0.2, vh, th + 0.004, kind === 'lead' ? o.leadGlass : o.screenGlass, latch, 1.48, 0, false)
      for (const s of [-1, 1]) k.box(L, 0.24, 0.02, th + 0.006, m.aluminium, latch, 1.48 + s * (vh / 2 + 0.01), 0, false)
      for (const s of [-1, 1]) k.box(L, 0.02, vh + 0.04, th + 0.006, m.aluminium, latch + s * 0.11, 1.48, 0, false)
    }
    // Kick plates, both faces; lever handles on roses, both faces.
    // Kick plates; on each face a round rose, a returned lever towards the hinges, and under it
    // the lock: a thumb-turn inside, a cylinder (or the toilets' emergency release) outside.
    const hx = -side * (lw / 2 - 0.075)
    for (const s of [-1, 1]) {
      k.box(L, lw - 0.06, 0.3, 0.002, m.stainless, 0, 0.17, s * (th / 2 + 0.001), false)
      k.cyl(L, 0.026, 0.026, 0.01, m.stainless, hx, 1.04, s * (th / 2 + 0.005), 20).rotation.x = PI / 2
      const lever = put(L, bentTube(e, `lever${side}`, [[0, 0, 0], [0, 0, 0.055], [side * 0.03, 0, 0.068], [side * 0.13, 0, 0.068], [side * 0.135, -0.004, 0.055]], 0.0095, 0.02), m.stainless, hx, 1.04, s * (th / 2 + 0.008), false)
      if (s < 0) lever.scale.z = -1
      k.cyl(L, 0.02, 0.02, 0.008, m.stainless, hx, 0.92, s * (th / 2 + 0.004), 18).rotation.x = PI / 2
      k.box(L, 0.008, 0.024, 0.006, s > 0 ? m.stainless : m.black, hx, 0.92, s * (th / 2 + 0.01), false)
    }
    // Three butt hinges on the hinge edge, their knuckles showing on the side it swings to.
    for (const hy of [0.24, H / 2 + 0.1, H - 0.24]) k.cyl(L, 0.009, 0.009, 0.1, m.stainless, side * (lw / 2 + 0.002), hy, out * (th / 2), 12)
    // An overhead closer on the push side of doors to the corridors.
    if (!wet && !d.internal && kind !== 'glass') {
      k.soft(L, 0.26, 0.05, 0.055, 0.012, m.aluminium, side * (lw / 2 - 0.2), H - 0.08, -out * (th / 2 + 0.028))
      k.box(L, 0.24, 0.012, 0.02, m.aluminium, side * (lw / 2 - 0.12), H - 0.03, -out * (th / 2 + 0.07), false)
    }
    if (kind === 'mri') {
      // The RF door's copper fingers round its edge, and the long pull handle.
      k.box(L, 0.012, H - 0.03, th + 0.004, o.copper, -side * (lw / 2 - 0.006), H / 2, 0, false)
      k.box(L, 0.03, 0.9, 0.04, m.stainless, -side * (lw / 2 - 0.12), 1.1, -out * (th / 2 + 0.03), false)
    }
    // Toilets: an engaged indicator on the outside.
    if (spec.kind === 'wet') k.box(L, 0.06, 0.03, 0.004, m.red, -side * (lw / 2 - 0.075), 1.15, -out * (th / 2 + 0.003), false)
    // The leaf's parts straight into the hinge's frame (baking keeps the leaf's front apart and
    // would re-attach it without the offset group's placement).
    L.updateMatrix()
    for (const c of [...L.children]) {
      c.applyMatrix4(L.matrix)
      node.add(c)
    }
    L.removeFromParent()
    bake(node, leaf)
  }
  // A threshold strip across the opening where the floor finish changes.
  if (kind !== 'glass') k.box(G, w, 0.005, t + 0.06, wet ? m.aluminium : m.stainless, 0, 0.0145, 0, false)
  // Outside, by the latch: the room's plate (or the hazard signs of the rooms behind lead and RF).
  const latchX = pair ? w / 2 + 0.38 : -(d.hinge ?? 1) * (w / 2 + 0.36)
  const outside = -(t / 2) - 0.007
  if (spec.no && !d.internal) {
    const sub = spec.kind === 'wet' ? undefined : kind === 'lead' ? 'Radiation area' : undefined
    signPanel(e, G, 0.4, 0.2, o.sign(`plate_${e.level}_${spec.id}`, 512, 256, roomPlate(spec.no, spec.name, sub)), latchX, 1.55, outside, PI, 0.008)
  }
  if (kind === 'lead' && !d.internal) {
    signPanel(e, G, 0.32, 0.4, o.sign('radiation', 320, 400, radiation(['CAUTION', 'X-RAY RADIATION', 'Pregnant women: inform staff'])), -latchX, 1.5, outside, PI, 0.006)
    warningLamp(e, G, H, outside, ['X-RAY', 'IN USE'])
  }
  if (kind === 'mri') {
    signPanel(e, G, 0.42, 0.56, o.sign('magnet', 420, 560, magnet), latchX, 1.45, outside, PI, 0.006)
    warningLamp(e, G, H, outside, ['MRI', 'SCANNING'])
  }
  if (kind === 'fire') face(e, G, 0.3, 0.1, o.sign('firedoor', 300, 100, board('#ffffff', [['FIRE DOOR · KEEP SHUT', 0.36, '#c8161d']], { border: '#c8161d' })), 0, 1.6, outside - 0.004, PI)
  // Inside, by the latch: the room's light switch (not in the halls, the lounges or the core).
  const switchable = !d.internal && (spec.kind === 'room' || spec.kind === 'wet' || spec.kind === 'service') && !spec.quiet
  if (switchable || (spec.kind === 'service' && !d.internal)) {
    const sx = pair ? -(w / 2 + 0.22) : -(d.hinge ?? 1) * (w / 2 + 0.22)
    const sg = new Group()
    sg.position.set(sx, 1.2, t / 2 + 0.001)
    G.add(sg)
    // A modular plate: the lights' switch and a 6 A socket beside it.
    switchPlate(e.k, sg, `opd_${e.level}_${spec.id}`, ['switch', 'socket'], o.switches, [room.circuit])
  }
}

/** A lit warning lamp over a door, outside: its words glowing red. */
function warningLamp(e: OpdCtx, G: Group, H: number, z: number, words: string[]) {
  const { k, m, o } = e
  const g = new Group()
  g.position.set(0, H + 0.2, z - 0.04)
  g.rotation.y = PI
  G.add(g)
  k.box(g, 0.42, 0.16, 0.07, m.whitePlastic, 0, 0, 0)
  const lit = o.screen(`lamp_${words.join('_')}`, 256, 96, lampFace(words), 1.4)
  face(e, g, 0.38, 0.12, lit, 0, 0, 0.036)
}

/* ---------- internal glazing ---------- */

/** A window in an internal wall: a counter's open hatch, a frosted screen, lead glass at a control desk, RF mesh glass at the MRI's. */
function buildGlazing(e: OpdCtx, room: Room, g: Glazing, run: WallRun) {
  const { k, m, o } = e
  const kind = g.kind ?? 'clear'
  const along = (g.from + g.to) / 2
  const len = g.to - g.from
  const cx = run.axis === 'x' ? run.c : along
  const cz = run.axis === 'x' ? along : run.c
  const G = new Group()
  G.position.set(cx, e.y, cz)
  // Local +x along the wall, local z across it.
  G.rotation.y = run.axis === 'x' ? PI / 2 : 0
  room.group.add(G)
  const t = run.t
  const h = g.head - g.sill
  // Frame round the opening.
  for (const s of [-1, 1]) k.box(G, 0.04, h, t + 0.02, o.frame, s * (len / 2 - 0.02), g.sill + h / 2, 0)
  k.box(G, len, 0.04, t + 0.02, o.frame, 0, g.head - 0.02, 0)
  if (kind === 'hatch') {
    // A transaction counter through the wall: a solid-surface ledge, a low glass screen over it.
    k.box(G, len, 0.04, t + 0.5, m.solidSurface, 0, g.sill + 0.02, 0)
    k.box(G, len - 0.08, h * 0.55, 0.01, o.screenGlass, 0, g.head - 0.04 - h * 0.275, 0, false)
    k.box(G, len - 0.08, 0.02, 0.012, m.aluminium, 0, g.head - 0.04 - h * 0.55, 0, false)
    return
  }
  k.box(G, len, 0.04, t + 0.04, kind === 'lead' || kind === 'rf' ? m.solidSurface : o.frame, 0, g.sill + 0.02, 0)
  // Frosted (privacy) glazing is one acid-etched pane, not a clear pane with a film over it.
  const glass = kind === 'lead' ? o.leadGlass : kind === 'rf' ? o.rfGlass : kind === 'frosted' ? m.frosted : o.screenGlass
  k.box(G, len - 0.08, h - 0.08, kind === 'lead' ? 0.02 : 0.012, glass, 0, g.sill + h / 2, 0, false)
}

/* ---------- overhead: lights, air, sprinklers ---------- */

/** The nearest 600 mm grid line's tile centre. */
const tile = (v: number) => Math.floor(v / 0.6) * 0.6 + 0.3

/**
 * A room's ceiling services: its lights (flat LED panels in the tiles, downlights in the boards,
 * battens in the plant rooms), a supply diffuser and return grille, sprinklers and a smoke
 * detector; and the lamps that light it, on its circuit.
 */
function overhead(e: OpdCtx, room: Room, ceiling: boolean) {
  const { k, m } = e
  const spec = room.spec
  if (!ceiling && spec.id !== 'riser' && spec.fit !== 'ahu') {
    lamps(room)
    return
  }
  const yc = room.y + CEILING
  const light = spec.light ?? (spec.kind === 'service' ? 'service' : spec.ceiling === 'board' ? 'lounge' : 'clinical')
  const panel = m.ledPanel.clone()
  e.lighting.glow(panel, 1)
  room.circuit.glows.push(panel)
  if (light === 'dim') panel.emissiveIntensity *= 0.55
  const taken: [number, number][] = []
  const g = room.group
  const long = room.w > room.d ? 'x' : 'z'
  if (spec.kind === 'circulation') {
    // Corridors: square panels down the middle every 2.4 m.
    const n = Math.max(1, Math.round((long === 'x' ? room.w : room.d) / 2.4))
    for (let i = 0; i < n; i++) {
      const s = (i + 0.5) / n
      const x = long === 'x' ? tile(room.x0 + s * room.w) : tile(room.cx)
      const z = long === 'x' ? tile(room.cz) : tile(room.z0 + s * room.d)
      k.box(g, 0.6, 0.012, 0.6, m.ledFrame, x, yc - 0.006, z, false)
      k.box(g, 0.56, 0.004, 0.56, panel, x, yc - 0.013, z, false)
      taken.push([x, z])
    }
  } else if (light === 'lounge' || spec.kind === 'wet') {
    // Round recessed downlights on a grid.
    const step = spec.kind === 'wet' ? 1.4 : 1.6
    const nx = Math.max(1, Math.round(room.w / step))
    const nz = Math.max(1, Math.round(room.d / step))
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < nz; j++) {
        const x = room.x0 + ((i + 0.5) * room.w) / nx
        const z = room.z0 + ((j + 0.5) * room.d) / nz
        k.cyl(g, 0.085, 0.085, 0.012, m.ledFrame, x, yc - 0.006, z, 20).castShadow = false
        k.cyl(g, 0.07, 0.07, 0.004, panel, x, yc - 0.013, z, 20).castShadow = false
        taken.push([x, z])
      }
  } else if (light === 'service') {
    for (let i = 0; i < Math.max(1, Math.round(room.d / 2.4)); i++) {
      const z = room.z0 + ((i + 0.5) * room.d) / Math.max(1, Math.round(room.d / 2.4))
      k.box(g, 0.08, 0.06, 1.2, m.whitePlastic, room.cx, yc - 0.03, z, false)
      k.box(g, 0.06, 0.004, 1.16, panel, room.cx, yc - 0.062, z, false)
    }
  } else {
    // Clinical rooms: 600 mm panels on a grid of about 1.8 m (2.4 m where light is kept low).
    const step = light === 'dim' ? 2.4 : 1.8
    const nx = Math.max(1, Math.round(room.w / step))
    const nz = Math.max(1, Math.round(room.d / step))
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < nz; j++) {
        const x = tile(room.x0 + ((i + 0.5) * room.w) / nx)
        const z = tile(room.z0 + ((j + 0.5) * room.d) / nz)
        if (x < room.x0 + 0.3 || x > room.x1 - 0.3 || z < room.z0 + 0.3 || z > room.z1 - 0.3) continue
        k.box(g, 0.6, 0.012, 0.6, m.ledFrame, x, yc - 0.006, z, false)
        k.box(g, 0.56, 0.004, 0.56, panel, x, yc - 0.013, z, false)
        taken.push([x, z])
      }
  }
  // Air: a supply diffuser, and in larger rooms a return grille; each in a tile of its own.
  if (spec.kind !== 'circulation' && room.w * room.d > 5) {
    const spots: [number, number][] = [[tile(room.x0 + room.w * 0.3), tile(room.z0 + room.d * 0.7)], [tile(room.x0 + room.w * 0.7), tile(room.z0 + room.d * 0.3)]]
    spots.slice(0, room.w * room.d > 14 ? 2 : 1).forEach(([x, z], i) => {
      if (taken.some(([a, b]) => Math.abs(a - x) < 0.5 && Math.abs(b - z) < 0.5)) return
      if (x < room.x0 + 0.3 || x > room.x1 - 0.3 || z < room.z0 + 0.3 || z > room.z1 - 0.3) return
      k.box(g, 0.6, 0.02, 0.6, m.ledFrame, x, yc - 0.01, z, false)
      face(e, g, 0.56, 0.56, i ? m.grille : m.diffuser, x, yc - 0.021, z).rotation.x = PI / 2
      taken.push([x, z])
    })
  }
  // Sprinklers on a 3 m grid and a smoke detector, clear of what is already there.
  const free = (x: number, z: number) => !taken.some(([a, b]) => Math.abs(a - x) < 0.4 && Math.abs(b - z) < 0.4) && x > room.x0 + 0.3 && x < room.x1 - 0.3 && z > room.z0 + 0.3 && z < room.z1 - 0.3
  const sx = Math.max(1, Math.round(room.w / 3))
  const sz = Math.max(1, Math.round(room.d / 3))
  let detector = false
  for (let i = 0; i < sx; i++)
    for (let j = 0; j < sz; j++) {
      const x = room.x0 + ((i + 0.5) * room.w) / sx + 0.3
      const z = room.z0 + ((j + 0.5) * room.d) / sz - 0.3
      if (!free(x, z)) continue
      k.cyl(g, 0.035, 0.035, 0.008, m.chrome, x, yc - 0.004, z, 16).castShadow = false
      if (!detector && free(x - 0.6, z + 0.6) && spec.kind !== 'circulation') {
        k.cyl(g, 0.055, 0.06, 0.045, m.whitePlastic, x - 0.6, yc - 0.023, z + 0.6, 20).castShadow = false
        detector = true
      }
    }
  lamps(room)
}

/** The room's lamps: one over a small room, two or more along a large one or a corridor. */
function lamps(room: Room) {
  const spec = room.spec
  if (spec.id === 'lifts') return
  const area = room.w * room.d
  const long = Math.max(room.w, room.d)
  const n = spec.kind === 'circulation' ? Math.max(1, Math.round(long / 7)) : area > 45 ? 3 : area > 22 ? 2 : 1
  const light = spec.light ?? (spec.kind === 'service' ? 'service' : 'clinical')
  const each = Math.min(8, Math.max(2.4, (area * (light === 'dim' ? 0.12 : 0.24)) / n))
  for (let i = 0; i < n; i++) {
    const s = (i + 0.5) / n
    const x = room.w >= room.d ? room.x0 + s * room.w : room.cx
    const z = room.w >= room.d ? room.cz : room.z0 + s * room.d
    room.lamp(x, z, each, Math.min(12, Math.max(5, long / n + 3.5)), light === 'dim' ? '#ffe9cf' : '#fff3e4')
  }
}


/* ---------- small electrical and window details ---------- */

/**
 * Power at working height: in rooms and offices, a pair of modular socket plates low on a wall
 * that has no door in it (beside where furniture stands), as an electrical layout would put them.
 */
function sockets(e: OpdCtx, room: Room) {
  const spec = room.spec
  if (spec.kind !== 'room' || spec.quiet) return
  const sides: Dir[] = ['-z', '+z', '-x', '+x']
  const doorSides = new Set((spec.doors ?? []).map((d) => d.side))
  const d = sides.find((s) => !room.exterior.includes(s) && !doorSides.has(s) && !(spec.glazing ?? []).some((g) => g.side === s))
  if (!d) return
  const [a0, a1] = room.side(d)
  const len = a1 - a0
  if (len < 1.6) return
  for (const t of [0.28, 0.72]) {
    const g = room.onWall(d, a0 + len * t, 0.32, 0.001)
    switchPlate(e.k, g, `opd_${e.level}_${spec.id}_sockets`, ['socket', 'socket'], e.o.switches)
  }
}

/**
 * Window boards inside the façade's windows: white solid surface at the sill, one per punched
 * window on the south side and the tower's front, continuous under the ribbon glazing elsewhere.
 */
function windowBoards(e: OpdCtx) {
  const t = new Tris()
  const y = e.y
  const inside = (x: number, z: number) => e.plan.rooms.some((r) => x > r.rect[0] && x < r.rect[1] && z > r.rect[2] && z < r.rect[3])
  // Punched windows on the south side: 12 bays of 3.167 m from the back, each 2.0 m wide.
  const bay = 38 / 12
  for (let i = 0; i < 12; i++) {
    const z0 = -26 + i * bay + (bay - 2.0) / 2
    if (!inside(-11.3, z0 + 1.0)) continue
    box(t, [-11.5, -11.43], [y + 0.9, y + 0.925], [z0, z0 + 2.0])
  }
  // The tower's front, above the ground: 3 bays of 3.133 m.
  if (e.level > 0) for (let i = 0; i < 3; i++) {
    const x0 = -11.8 + i * (9.4 / 3) + (9.4 / 3 - 2.0) / 2
    box(t, [x0, x0 + 2.0], [y + 0.9, y + 0.925], [11.63, 11.7])
  }
  // Ribbon glazing above the ground: the back, the north side, the court (2nd, 3rd), the front behind the link's roof (3rd).
  if (e.level > 0) {
    const sill: R = [y + 0.95, y + 0.975]
    box(t, [-11.5, 13.6], sill, [-25.78, -25.67])
    box(t, [13.57, 13.78], sill, [-25.7, 10.7])
    if (e.level >= 2) {
      box(t, [-4.83, -4.62], sill, [-18.0, -6.0])
      box(t, [-4.5, 7.5], sill, [-5.88, -5.67])
      box(t, [-4.5, 7.5], sill, [-18.33, -18.12])
      box(t, [7.62, 7.83], sill, [-18.0, -6.0])
    }
    if (e.level === 3) box(t, [-2.4, 0.6], sill, [3.67, 3.88])
  }
  if (!t.empty) t.mesh(e.m.solidSurface, e.root, 'opd_window_boards', false)
}
