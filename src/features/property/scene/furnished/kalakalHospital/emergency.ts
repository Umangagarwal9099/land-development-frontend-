import { Group, Mesh, PlaneGeometry, PointLight, SphereGeometry, type Material, type Object3D } from 'three'
import { Kit, PI } from '../kit'
import { rng } from '../textures'
import { Tris } from '../kalakalMall/skin'
import { box } from '../kalakalA01/building'
import { bake, castor, face, group, makeCtx, put, rod, signPanel, type Ctx } from './erKit'
import {
  bed, binders, cushion, furnMats, shell, counter, crashCart, credenza, cylinder, cylinderRack, examCouch, locker, overbedTable, pedestal, supplyUnit, taskChair, visitorChair, wheelchair,
} from './erFurniture'
import {
  computerOnWheels, ecgCart, examLight, gasAlarm, gasPanel, headwall, ivStand, servicePendant, ultrasound, ventilator, vitalsStand, zoneValves,
} from './erEquipment'
import type { HospitalCtx } from './building'
import { EMERGENCY as E, ER, GL } from './plan'

/*
 * The emergency department, fitted out on the ground floor: the red strip of the client's floor
 * plan (one 8.4 m structural bay along the side of the building, from the lobby's back wall to the
 * stores at the back), behind the existing ambulance entrance in the north wing's side. The
 * fit-out follows the interior reference: an open treatment area of curtained bays along a solid
 * headwall, each bay numbered on a charcoal plate hung at the curtain line, a white solid-surface
 * nurses' station facing them across a dark vinyl corridor, a white 600 mm tile ceiling with flat
 * LED panels, and a lower plasterboard bulkhead carrying continuous linear lights.
 *
 * Front to back (z falling, +x north towards the exit road):
 *
 *   reception  z 4.85 … −6.2: the ambulance and walk-in doors at z = 1 in the north wall; the
 *              registration counter facing them across the hall; two rows of waiting seats along
 *              the lobby wall; the glazed triage room in the south-west corner; and automatic
 *              doors through the partition into the treatment area.
 *   treatment  z −6.2 … −21.8: bays 1–5 (bay 1 the resuscitation bay) along the inner wall,
 *              3.0 m wide by 3.0 m deep; the 2.4 m clinical corridor; the nurses' station against
 *              the window wall, with mobile equipment parked either side of it; clean supply and
 *              a hand-wash sink on the back wall.
 *
 * Clear heights: 3.0 m to the tiles, 2.7 m under the bulkheads. Everything is built at true size
 * from manufacturers' typical dimensions (ED stretcher-beds 2.12 × 0.92 m, bed-head trunking at
 * 1.42 m, transaction ledge at 1.10 m, worktops at 0.75 m).
 */

/** The department's hotspot, and its light zone. */
export const ER_ROOM = 'room_emergency'

const FLOOR = GL + 0.012
const CEIL = E.ceiling
const BULK = E.bulkhead
const T = 0.12

type R = [number, number]


/* ---------- small helpers ---------- */






/** Pleated curtain cloth hung in the local xy plane: `w` wide, `h` tall, folds `depth` deep. */
function pleats(e: Ctx, w: number, h: number, period: number, depth: number) {
  const key = `pleat${w.toFixed(2)}|${h.toFixed(2)}|${period}|${depth}`
  let g = e.geos.get(key)
  if (!g) {
    const geo = new PlaneGeometry(w, h, Math.max(2, Math.round((w / period) * 6)), 1)
    const pos = geo.getAttribute('position')
    // Folds as cloth hangs: uneven in depth and spacing, never a regular wave.
    const r = rng(Math.round(w * 1000 + h * 10))
    const ph = [r() * 6, r() * 6, r() * 6]
    for (let i = 0; i < pos.count; i++) {
      const s = pos.getX(i) + w / 2
      const t = (s / period) * PI * 2
      const fold = Math.sin(t + 0.6 * Math.sin(t * 0.37 + ph[0])) * (0.65 + 0.35 * Math.sin(t * 0.21 + ph[1])) + 0.25 * Math.sin(t * 2.3 + ph[2])
      pos.setZ(i, depth * fold)
    }
    geo.computeVertexNormals()
    e.geos.set(key, (g = geo))
  }
  return g
}

/* ---------- the shell ---------- */

/**
 * Floors, walls, ceilings, bulkheads, linings and skirtings, in true-scale finishes, each built as
 * one mesh.
 */
function buildShell(e: Ctx) {
  const { m, root } = e
  const light = new Tris()
  const dark = new Tris()
  const wall = new Tris()
  const skirt = new Tris()
  const tiles = new Tris()
  const board = new Tris()
  const sill = new Tris()
  const { x0, x1, z0, z1, partition: P } = E
  const [c0, c1] = E.corridor

  // Floors: dark taupe down the clinical corridor, pale grey everywhere else, welded at the joints.
  const fy: R = [GL, FLOOR]
  box(light, [x0, x1], fy, [P, z1])
  box(light, [x0, c0], fy, [z0, P])
  box(dark, [c0, c1], fy, [z0, P])
  box(light, [c1, x1], fy, [z0, P])

  // Walls, from the floor to just above the tiles. The inner (south) wall, the back wall to the
  // stores, the lobby's back wall with the door through to the main hospital, and the partition.
  const wy: R = [GL, CEIL + 0.05]
  box(wall, [x0 - T, x0], wy, [z0 - T, z1 + T])
  box(wall, [x0, x1], wy, [z0 - T, z0])
  const [d0, d1] = E.hospitalDoor
  box(wall, [x0, d0], wy, [z1, z1 + T])
  box(wall, [d1, x1 + 0.05], wy, [z1, z1 + T])
  box(wall, [d0, d1], [GL + 2.2, wy[1]], [z1, z1 + T])
  const [o0, o1] = E.treatmentDoor
  box(wall, [x0, o0], wy, [P - T / 2, P + T / 2])
  box(wall, [o1, x1], wy, [P - T / 2, P + T / 2])
  box(wall, [o0, o1], [GL + 2.3, wy[1]], [P - T / 2, P + T / 2])
  // The triage room's solid wall to the hall.
  box(wall, [x0, E.triage.x1 + 0.05], wy, [E.triage.z1 - T / 2, E.triage.z1 + T / 2])
  // The window wall's lining under the sill, the window board, and the pelmet that closes the
  // ceiling void behind the glass (seen from outside as a white band above the ceiling line).
  box(wall, [x1 - 0.04, x1], [GL, GL + 0.95], [z0, ER.z0])
  box(sill, [x1 - 0.1, x1 + 0.17], [GL + 0.95, GL + 0.975], [z0, ER.z0])
  box(board, [x1 + 0.02, x1 + 0.06], [CEIL, GL + 4.5], [z0, z1 + T])

  // Coved skirting round every wall face.
  const sk: R = [GL, GL + 0.1]
  box(skirt, [x0, x0 + 0.012], sk, [z0, z1])
  box(skirt, [x0, x1], sk, [z0, z0 + 0.012])
  box(skirt, [x0, d0], sk, [z1 - 0.012, z1])
  box(skirt, [d1, x1], sk, [z1 - 0.012, z1])
  for (const s of [-1, 1]) {
    const z = P + s * (T / 2 + 0.006)
    box(skirt, [x0, o0], sk, [z - 0.006, z + 0.006])
    box(skirt, [o1, x1], sk, [z - 0.006, z + 0.006])
  }

  // The tile ceiling, and the bulkheads: along the bays' front over the corridor, and over the
  // nurses' station; each a plasterboard box down to 2.7 m.
  box(tiles, [x0, x1], [CEIL, CEIL + 0.015], [z0, z1])
  const bk = E.bayBulkhead
  box(board, [bk[0], bk[1]], [BULK, CEIL], [z0, P - T / 2])
  const st = E.station
  box(board, [st.x0 - 0.15, x1], [BULK, CEIL], [st.z0 - 0.3, st.z1 + 0.3])
  // The bulkhead over the registration counter.
  box(board, [x0, E.registration.x + 0.35], [BULK, CEIL], [E.registration.z0 - 0.2, E.registration.z1 + 0.2])

  light.mesh(m.vinylLight, root, 'er_floor', false)
  dark.mesh(m.vinylDark, root, 'er_corridor_floor', false)
  wall.mesh(m.paint, root, 'er_walls')
  skirt.mesh(m.skirting, root, 'er_skirting', false)
  tiles.mesh(m.tiles, root, 'er_ceiling', false)
  board.mesh(m.plasterboard, root, 'er_bulkheads', false)
  sill.mesh(m.solidSurface, root, 'er_window_boards', false)
}

/* ---------- overhead ---------- */

/** The nearest 600 mm tile centre, or tile joint, to v. */
const tile = (v: number) => Math.floor(v / 0.6) * 0.6 + 0.3
const joint = (v: number) => Math.round(v / 0.6) * 0.6

const clear = (e: Ctx, x: number, z: number, r: number) => !e.placed.some(([a, b, c, d]) => x > a - r && x < b + r && z > c - r && z < d + r)
/** The ceiling's height at (x, z): under a bulkhead, its soffit. */
function soffitAt(x: number, z: number) {
  const bk = E.bayBulkhead
  const st = E.station
  const rg = E.registration
  if (x > bk[0] && x < bk[1] && z < E.partition) return BULK
  if (x > st.x0 - 0.15 && z > st.z0 - 0.3 && z < st.z1 + 0.3) return BULK
  if (x < rg.x + 0.35 && z > rg.z0 - 0.2 && z < rg.z1 + 0.2) return BULK
  return CEIL
}

/** A recessed flat LED panel, w × d (x × z), its white frame flush with the tiles at y. */
function ledPanel(e: Ctx, x: number, z: number, w: number, d: number, y = CEIL) {
  const { k, m, root } = e
  e.placed.push([x - w / 2, x + w / 2, z - d / 2, z + d / 2])
  k.box(root, w, 0.012, d, m.ledFrame, x, y - 0.006, z, false)
  k.box(root, w - 0.04, 0.004, d - 0.04, m.ledPanel, x, y - 0.013, z, false)
}

/** A continuous linear LED slot set into a bulkhead's soffit, along z. */
function ledSlot(e: Ctx, x: number, z0: number, z1: number, y = BULK) {
  const { k, m, root } = e
  k.box(root, 0.07, 0.01, z1 - z0, m.ledFrame, x, y - 0.005, (z0 + z1) / 2, false)
  k.box(root, 0.05, 0.004, z1 - z0 - 0.02, m.ledLine, x, y - 0.011, (z0 + z1) / 2, false)
}

function buildOverhead(e: Ctx) {
  const { k, m, root } = e
  const { x0, x1, z0, z1, partition: P } = E
  const [c0, c1] = E.corridor
  const bays = bayRects()

  // Each bay: a 1200 × 600 panel over the bed, its long side along the bed.
  for (const b of bays) ledPanel(e, joint((b.x0 + b.x1) / 2 + 0.2), tile(b.zc), 1.2, 0.6)
  // The bays' bulkhead and the station's carry continuous slots; the corridor has square panels.
  const bk = E.bayBulkhead
  ledSlot(e, (bk[0] + bk[1]) / 2, z0 + 0.4, P - 0.4)
  const st = E.station
  for (const x of [st.x0 + 0.45, st.x0 + 1.35]) ledSlot(e, x, st.z0 - 0.1, st.z1 + 0.1)
  for (let z = P - 1.8; z > z0 + 0.6; z -= 3.6) ledPanel(e, tile((c0 + c1) / 2 + 0.3), tile(z), 0.6, 0.6)
  // Reception: panels on a 2.4 m grid, and slots in the registration bulkhead.
  for (const x of [9.3, 11.7]) for (const z of [-4.5, -2.1, 0.3, 2.7]) ledPanel(e, tile(x), tile(z), 0.6, 0.6)
  ledPanel(e, tile(7.2), tile(-4.4), 1.2, 0.6)
  ledSlot(e, E.registration.x - 0.15, E.registration.z0 - 0.05, E.registration.z1 + 0.05)

  // Supply diffusers and return grilles, in tiles of their own.
  const vent = (mat: Material, x: number, z: number) => {
    e.placed.push([tile(x) - 0.3, tile(x) + 0.3, tile(z) - 0.3, tile(z) + 0.3])
    k.box(root, 0.6, 0.02, 0.6, m.ledFrame, tile(x), CEIL - 0.01, tile(z), false)
    face(e, root, 0.56, 0.56, mat, tile(x), CEIL - 0.021, tile(z)).rotation.x = PI / 2
  }
  for (const b of bays) vent(m.diffuser, 6.0, b.z1 - 0.7)
  for (const z of [-8.4, -15.6]) vent(m.grille, 10.5, z)
  for (const z of [-19.2, -12.0]) vent(m.diffuser, 10.2, z)
  vent(m.diffuser, 10.5, 1.5)
  vent(m.grille, 8.1, 3.9)
  vent(m.diffuser, 7.2, -3.6)

  // Concealed sprinklers (chrome cover plates) on a 3 m grid, and smoke detectors between them,
  // each moved along to the next tile centre where a light or a vent is in the way.
  const fit = (x: number, z: number, r: number) => {
    for (const dz of [0, 0.6, -0.6, 1.2, -1.2]) if (clear(e, x, z + dz, r)) return z + dz
    return null
  }
  let n = 0
  for (const x of [tile(x0 + 1.4), tile(9.9), tile(x1 - 1.2)])
    for (let z = z1 - 1.5; z > z0 + 0.5; z -= 3.0) {
      const at = fit(x, tile(z), 0.08)
      if (at === null) continue
      k.cyl(root, 0.04, 0.04, 0.008, m.chrome, x, soffitAt(x, at) - 0.004, at, 20).castShadow = false
      const dz = tile(z - 1.5)
      if (n++ % 2 === 0 && clear(e, x, dz, 0.1) && dz > z0 + 0.5) k.cyl(root, 0.055, 0.06, 0.045, m.whitePlastic, x, soffitAt(x, dz) - 0.023, dz, 24).castShadow = false
    }
  // A CCTV dome at each end of the corridor.
  for (const [x, z] of [[c1 - 0.3, P - 0.6], [c1 - 0.3, z0 + 0.6]] as const) {
    k.cyl(root, 0.07, 0.07, 0.03, m.whitePlastic, x, CEIL - 0.015, z, 20)
    const dome = new Mesh(new SphereGeometry(0.055, 18, 10, 0, PI * 2, PI / 2, PI / 2), m.off)
    dome.position.set(x, CEIL - 0.03, z)
    root.add(dome)
  }

  // Curtain tracks: along the bays' front and between them, ceiling-fixed aluminium.
  const ty = CEIL - 0.025
  const front = E.bays.x1 - 0.12
  k.box(root, 0.03, 0.03, bays[0].z1 - bays[bays.length - 1].z0 - 0.1, m.aluminium, front, ty, (bays[0].z1 + bays[bays.length - 1].z0) / 2, false)
  for (const b of bays.slice(1).map((b) => b.z1)) k.box(root, front - x0, 0.03, 0.03, m.aluminium, (x0 + front) / 2, ty, b, false)

  // The bays' numbers, hung from the bulkhead over each bay's mouth, facing the corridor.
  bays.forEach((b, i) => {
    const x = (bk[0] + bk[1]) / 2
    for (const s of [-1, 1]) k.cyl(root, 0.004, 0.004, 0.22, m.stainless, x, BULK - 0.11, b.zc + s * 0.1, 6)
    signPanel(e, root, 0.3, 0.3, m.bays[i], x, BULK - 0.37, b.zc, PI / 2, 0.02, m.darkPlastic)
    signPanel(e, root, 0.3, 0.3, m.bays[i], x - 0.021, BULK - 0.37, b.zc, -PI / 2, 0.001, m.darkPlastic)
  })
  signPanel(e, root, 1.0, 0.24, m.resus, bk[1] + 0.007, (BULK + CEIL) / 2, bays[0].zc, PI / 2, 0.012)

  // Exit signs over the doors out: the ambulance entrance, and the door to the main hospital.
  const exit = (mat: Material, x: number, z: number, ry: number) => {
    const g = new Group()
    g.position.set(x, CEIL - 0.3, z)
    g.rotation.y = ry
    root.add(g)
    for (const s of [-1, 1]) k.cyl(g, 0.005, 0.005, 0.2, m.stainless, s * 0.13, 0.2, 0, 6)
    k.box(g, 0.36, 0.16, 0.05, m.whitePlastic, 0, 0.0, 0, false)
    for (const s of [-1, 1]) face(e, g, 0.33, 0.13, s > 0 ? mat : mat === m.exitL ? m.exitR : m.exitL, 0, 0, s * 0.026, s > 0 ? 0 : PI)
  }
  exit(m.exitR, 12.6, 1.0, -PI / 2)
  exit(m.exitL, (E.hospitalDoor[0] + E.hospitalDoor[1]) / 2, z1 - 0.4, PI)
  exit(m.exitL, (E.treatmentDoor[0] + E.treatmentDoor[1]) / 2, P - 0.35, PI)

  // A hanging sign in the hall, double-sided, pointing the way to treatment.
  const hs = new Group()
  hs.position.set(10.6, CEIL - 0.55, -3.2)
  root.add(hs)
  for (const s of [-1, 1]) k.cyl(hs, 0.004, 0.004, 0.35, m.stainless, s * 0.6, 0.38, 0, 6)
  k.box(hs, 1.5, 0.24, 0.03, m.whitePlastic, 0, 0, 0, false)
  face(e, hs, 1.48, 0.23, m.treatment, 0, 0, 0.016)
  face(e, hs, 1.48, 0.23, m.treatment, 0, 0, -0.016, PI)
}

/* ---------- treatment bays ---------- */

interface Bay {
  x0: number
  x1: number
  z0: number
  z1: number
  zc: number
}

function bayRects(): Bay[] {
  const { x0 } = E
  const { x1, z1, w, n } = E.bays
  return Array.from({ length: n }, (_, i) => {
    const top = z1 - i * w
    return { x0, x1, z0: top - w, z1: top, zc: top - w / 2 }
  })
}








/** A cubicle curtain: its mesh head, the cloth below in pleats, w across at local x, hung from y. */
function curtain(e: Ctx, p: Object3D, w: number, period = 0.17, depth = 0.032) {
  const head = 0.5
  const top = CEIL - 0.05
  const cloth = top - head - (GL + 0.3)
  const n = new Mesh(pleats(e, w, head, period, depth), e.m.curtainNet)
  n.position.set(0, top - head / 2, 0)
  p.add(n)
  const c = new Mesh(pleats(e, w, cloth, period, depth), e.m.curtain)
  c.position.set(0, GL + 0.3 + cloth / 2, 0)
  c.castShadow = true
  c.receiveShadow = true
  p.add(c)
}

type BayFit = {
  back: number
  linen: 'made' | 'used' | 'sheet'
  railsDown?: boolean
  /** How far the curtain on the bay's back (−z) side is drawn out from the wall, and the front's. */
  divider: number
  front: number
  extras: ('chair' | 'locker' | 'table' | 'iv' | 'vitals' | 'light')[]
}

/** The bays as found: resus ready for the next patient, the rest occupied, made up, or in use. */
const FIT: BayFit[] = [
  { back: 0.12, linen: 'sheet', divider: 2.6, front: 0, extras: ['vitals'] },
  { back: 0.55, linen: 'used', divider: 1.9, front: 0, extras: ['chair', 'locker', 'iv'] },
  { back: 0.28, linen: 'used', railsDown: true, divider: 2.5, front: 0, extras: ['table', 'vitals', 'locker', 'light'] },
  { back: 0.0, linen: 'made', railsDown: true, divider: 1.4, front: 1.5, extras: ['locker', 'chair', 'light'] },
  { back: 0.7, linen: 'used', divider: 2.2, front: 0, extras: ['iv', 'table', 'locker'] },
]

function buildBays(e: Ctx) {
  const { k, m, root } = e
  const bays = bayRects()
  bays.forEach((b, i) => {
    const fit = FIT[i]
    const resus = i === 0
    // The headwall on the inner wall, facing +x.
    const hw = k.at(b.x0, b.zc, PI / 2, GL)
    headwall(e, hw, m.monitors[i], resus)
    // The bed, its head 0.3 m off the wall, square to it; a little off true, as left by staff.
    const g = k.at(b.x0 + 0.3 + 1.08, b.zc + (e.r() - 0.5) * 0.08, PI / 2 + (e.r() - 0.5) * 0.05, FLOOR)
    bed(e, g, { back: fit.back, linen: fit.linen, railsDown: fit.railsDown, height: resus ? 0.74 : 0.62 + e.r() * 0.06, o2: resus || i === 4, iv: i === 2 })
    // Equipment either side of the bed: −z side (the bed's right, seen from its foot) and +z.
    const side = (s: number, along: number, ry: number) => k.at(b.x0 + along, b.zc + s * 0.98, ry, FLOOR)
    for (const x of fit.extras) {
      if (x === 'chair') visitorChair(e, side(1, 1.85, PI + 0.5))
      if (x === 'locker') locker(e, side(-1, 0.43, PI / 2))
      if (x === 'table') overbedTable(e, k.at(b.x0 + 1.75, b.zc + 0.64, PI, FLOOR))
      if (x === 'iv') ivStand(e, side(1, 0.58, -0.4))
      if (x === 'vitals') vitalsStand(e, side(-1, 1.5, PI / 2 - 0.3), m.monitors[(i + 3) % m.monitors.length])
      if (x === 'light') examLight(e, side(-1, 2.35, 0.25), 0.55)
    }
    // Curtains: the divider on the bay's −z side (shared with the next bay), the front ones
    // stacked back at the bay's corners unless drawn.
    if (i < bays.length - 1) {
      const d = new Group()
      d.position.set(b.x0 + 0.06 + fit.divider / 2, 0, b.z0)
      root.add(d)
      curtain(e, d, fit.divider)
    }
    const front = E.bays.x1 - 0.12
    for (const [z, len] of [[b.z1 - 0.2, fit.front > 0 ? fit.front : 0.32], [b.z0 + 0.2, 0.32]] as const) {
      const f = new Group()
      f.position.set(front, 0, z + (z > b.zc ? -1 : 1) * (len - 0.32) / 2)
      f.rotation.y = PI / 2
      root.add(f)
      curtain(e, f, len, len > 0.4 ? 0.17 : 0.06, len > 0.4 ? 0.032 : 0.05)
    }
  })
  buildResus(e, bays[0])
}

/**
 * The resuscitation bay's own: the crash cart at the bed's foot, the ventilator at its head, the
 * ceiling service pendant with its outlets and monitor, the procedure light on its arm, the clock.
 */
function buildResus(e: Ctx, b: Bay) {
  const { k, m, root } = e
  crashCart(e, k.at(b.x0 + 2.25, b.z1 - 0.45, -PI / 2 - 0.2, FLOOR), m.monitors[5])
  ventilator(e, k.at(b.x0 + 0.55, b.z0 + 0.45, PI / 2 + 0.5, FLOOR), m.monitors[2])
  // The pendant hangs from the ceiling at the bed head's corner, its column swung in beside the bed.
  servicePendant(e, group(root, b.x0 + 1.0, 0, b.z1 - 0.15, PI), CEIL, m.monitors[1])
  // The procedure light on its ceiling arm, swung over the bed.
  const pl = group(root, b.x0 + 1.5, CEIL, b.zc + 0.4)
  k.cyl(pl, 0.09, 0.09, 0.05, m.whitePlastic, 0, -0.025, 0, 20)
  k.cyl(pl, 0.025, 0.025, 0.5, m.greyPlastic, 0, -0.3, 0, 12)
  k.soft(pl, 0.06, 0.06, 0.72, 0.02, m.greyPlastic, 0, -0.55, -0.3)
  k.cyl(pl, 0.25, 0.27, 0.09, m.whitePlastic, 0, -0.65, -0.68, 36)
  k.cyl(pl, 0.2, 0.2, 0.01, m.ledPanel, 0, -0.7, -0.68, 36)
  k.cyl(pl, 0.02, 0.02, 0.12, m.greyPlastic, 0, -0.76, -0.68, 10)
  // The clock, over the headwall.
  k.cyl(root, 0.17, 0.17, 0.04, m.whitePlastic, b.x0 + 0.02, 2.55, b.zc, 32).rotation.z = PI / 2
  face(e, root, 0.3, 0.3, m.clock, b.x0 + 0.045, 2.55, b.zc, PI / 2)
}


/* ---------- the nurses' station ---------- */

/** A flat-screen monitor, keyboard and mouse at a workstation; its front towards local +z. */
export function workstation(e: Ctx, p: Object3D, x: number, y: number, z: number, ry: number, screen: Material) {
  const { k, m } = e
  const g = new Group()
  g.position.set(x, y, z)
  g.rotation.y = ry
  p.add(g)
  k.box(g, 0.22, 0.012, 0.18, m.darkPlastic, 0, 0.006, -0.06)
  k.box(g, 0.05, 0.22, 0.025, m.darkPlastic, 0, 0.12, -0.1)
  const s = new Group()
  s.position.set(0, 0.32, -0.07)
  s.rotation.x = -0.06
  g.add(s)
  k.box(s, 0.54, 0.33, 0.022, m.black, 0, 0, 0)
  face(e, s, 0.52, 0.3, screen, 0, 0.008, 0.012)
  k.box(g, 0.44, 0.016, 0.14, m.darkPlastic, 0, 0.008, 0.22)
  k.soft(g, 0.06, 0.03, 0.1, 0.012, m.darkPlastic, 0.32, 0.015, 0.22)
}



function buildStation(e: Ctx) {
  const { k, m, root } = e
  const st = E.station
  const len = st.z1 - st.z0
  const zc = (st.z0 + st.z1) / 2
  // Public side towards the bays (−x): turned so local +z points −x. Drawer pedestals between the seats.
  const g = k.at(st.x0 + 0.77, zc, -PI / 2, GL)
  counter(e, g, len, [-2.7, -1.3, 0.15, 1.5, 2.72])
  // Four workstations along it, a phone, document trays, a printer at one end.
  // Screens face the staff (local −z).
  for (const [i, x] of [-2.2, -0.7, 0.8, 2.0].entries()) workstation(e, g, x, 0.765, 0.05, PI + (i % 2 ? 0.08 : -0.06), i === 1 ? m.monitors[4] : m.board)
  k.soft(g, 0.2, 0.05, 0.22, 0.015, m.darkPlastic, -1.5, 0.79, 0.15)
  k.soft(g, 0.21, 0.045, 0.06, 0.02, m.black, -1.5, 0.83, 0.09)
  for (const [x, n] of [[0.1, 3], [-2.8, 2]] as const) for (let j = 0; j < n; j++) k.box(g, 0.25, 0.045, 0.33, j % 2 ? m.whitePlastic : m.greyPlastic, x, 0.79 + j * 0.05, 0.2)
  k.soft(g, 0.45, 0.24, 0.38, 0.02, m.greyPlastic, 2.75, 0.89, 0.15)
  k.box(g, 0.34, 0.01, 0.2, m.paper, 2.75, 1.015, 0.25)
  k.cyl(g, 0.035, 0.035, 0.1, m.black, 1.4, 0.815, 0.2, 14)
  // Chairs, pulled in to varying depths (clear of the cupboards' doors behind them).
  const chairs: [number, number, number][] = [[-2.0, -0.5, 0.15], [-0.6, -0.58, -0.25], [0.9, -0.48, 0.05], [2.1, -0.6, 0.4]]
  for (const [x, z, ry] of chairs) taskChair(e, group(g, x, 0, z, ry))
  // The cupboards behind the staff along the window wall, under the sill: doors that open (operated), files.
  const cr = k.at(E.x1 - 0.5, zc, -PI / 2, FLOOR)
  credenza(e, cr, len)
  binders(e, cr, 1.3, 0.805, -0.12, 0.26)
  k.soft(cr, 0.5, 0.28, 0.42, 0.02, m.whitePlastic, 1.6, 0.945, -0.24)
  k.box(cr, 0.42, 0.01, 0.22, m.paper, 1.6, 1.09, -0.2)
  // Its sign on the bulkhead, facing the corridor.
  signPanel(e, root, 1.4, 0.26, m.station, st.x0 - 0.15 - 0.007, BULK + 0.14, zc, -PI / 2, 0.012)
}


/* ---------- along the window wall, and the back wall ---------- */



/** A linen trolley: stainless frame, a blue bag on one side, folded linen on shelves on the other. */
export function linenTrolley(e: Ctx, p: Object3D) {
  const { k, m } = e
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    castor(e, p, sx * 0.4, sz * 0.22, 0.04)
    k.cyl(p, 0.012, 0.012, 0.95, m.stainless, sx * 0.42, 0.58, sz * 0.24, 8)
  }
  for (const y of [0.18, 1.05]) k.box(p, 0.88, 0.02, 0.5, m.stainless, 0, y, 0)
  k.soft(p, 0.42, 0.75, 0.46, 0.05, m.blue, -0.2, 0.6, 0)
  for (const y of [0.5, 0.8]) {
    k.box(p, 0.4, 0.015, 0.46, m.stainless, 0.21, y, 0)
    for (let j = 0; j < 3; j++) k.soft(p, 0.36, 0.05, 0.38, 0.015, j % 2 ? m.blanket : m.sheet, 0.21, y + 0.035 + j * 0.05, 0)
  }
}





/**
 * A clinical hand-wash station on a wall: solid-surface vanity, a deep basin, a sensor tap; the
 * soap, alcohol rub and paper towel dispensers over it, the poster, a pedal bin.
 */
export function handwash(e: Ctx, p: Object3D) {
  const { k, m } = e
  k.box(p, 0.9, 0.12, 0.55, m.solidSurface, 0, 0.86, 0.275)
  k.box(p, 0.9, 0.08, 0.03, m.solidSurface, 0, 0.76, 0.535)
  k.box(p, 0.44, 0.09, 0.34, m.stainless, 0, 0.88, 0.29)
  k.box(p, 0.9, 0.25, 0.012, m.solidSurface, 0, 1.05, 0.006)
  k.cyl(p, 0.022, 0.022, 0.24, m.chrome, 0, 1.04, 0.09, 14)
  rod(e, p, 0.018, 0.2, m.chrome, 0, 1.15, 0.18, 'z', 12)
  k.soft(p, 0.11, 0.24, 0.1, 0.02, m.whitePlastic, -0.32, 1.38, 0.05)
  k.soft(p, 0.11, 0.24, 0.1, 0.02, m.whitePlastic, 0.32, 1.38, 0.05)
  k.box(p, 0.3, 0.38, 0.12, m.whitePlastic, 0, 1.52, 0.06)
  k.box(p, 0.2, 0.01, 0.02, m.darkPlastic, 0, 1.34, 0.12, false)
  face(e, p, 0.3, 0.42, m.poster, 0.62, 1.55, 0.004)
  k.cyl(p, 0.15, 0.14, 0.45, m.sharps, -0.62, 0.23, 0.25, 24)
  k.cyl(p, 0.155, 0.155, 0.03, m.whitePlastic, -0.62, 0.465, 0.25, 24)
}

function buildPerimeter(e: Ctx) {
  const { k, m, root } = e
  const { x1, z0, partition: P } = E
  const st = E.station
  // Beside the station, towards the doors: a stretcher waiting, made up; the linen trolley (clear
  // of the door leaves' path along the partition).
  bed(e, k.at(x1 - 0.5, (st.z1 + P) / 2 - 0.6, 0.03, FLOOR), { back: 0.3, linen: 'made', height: 0.8 })
  linenTrolley(e, k.at(x1 - 0.32, P - 0.85, PI / 2, FLOOR))
  // Beyond it, towards the back: the ECG cart, the ultrasound, a computer on wheels, the cylinders.
  ecgCart(e, k.at(x1 - 0.32, st.z0 - 0.55, -PI / 2 + 0.1, FLOOR), m.monitors[1])
  ultrasound(e, k.at(x1 - 0.45, st.z0 - 1.55, -PI / 2 - 0.2, FLOOR))
  computerOnWheels(e, k.at(x1 - 0.5, st.z0 - 2.75, -PI / 2 + 0.3, FLOOR), m.board)
  cylinderRack(e, k.at(x1 - 0.18, z0 + 1.2, -PI / 2, FLOOR))
  // The back wall: clean supply in three units, the zone valves with their drops from the ceiling,
  // the hand-wash station, the sign.
  const [c0] = E.corridor
  for (let i = 0; i < 3; i++) supplyUnit(e, k.at(c0 + 0.55 + i * 0.96, z0 + 0.55, 0, FLOOR), 0.94)
  zoneValves(e, group(root, 0, GL, z0), 11.92, 1.55, CEIL - GL)
  handwash(e, k.at(x1 - 0.85, z0, 0, FLOOR))
  signPanel(e, root, 1.2, 0.22, m.supply, c0 + 1.5, 2.6, z0 + 0.012, 0)
  // The medical gas alarm on the partition's treatment side, past the door leaves' run.
  gasAlarm(e, group(root, x1 - 0.32, GL, P - T / 2, PI), 0, 1.55)
  // The fire extinguisher on its bracket, on the partition's hall side between triage and the doors.
  const ext = k.at((E.triage.x1 + E.treatmentDoor[0]) / 2, P + T / 2, 0, FLOOR)
  k.box(ext, 0.16, 0.08, 0.04, m.stainless, 0, 0.9, 0.02)
  k.cyl(ext, 0.08, 0.08, 0.5, m.red, 0, 0.6, 0.11, 20)
  k.cyl(ext, 0.03, 0.03, 0.08, m.black, 0, 0.89, 0.11, 12)
  k.box(ext, 0.03, 0.12, 0.03, m.black, 0.06, 0.92, 0.14)
}


/* ---------- reception: registration, waiting, triage ---------- */

/**
 * A beam of `n` linked seats (tandem seating), facing local +z: a rectangular steel beam on two
 * T-legs with levelling feet, cast aluminium arms between the seats with PU pads, and the seats
 * themselves, by `style`: upholstered (a cushioned seat and back in healthcare vinyl on black
 * shells), perforated (a one-piece formed steel shell, powder-coated), or polypropylene (a
 * moulded one-piece shell). Unless given, the style follows the floor: each department its own.
 */
export function beamSeating(e: Ctx, p: Object3D, n: number, style?: 'upholstered' | 'perforated' | 'polypropylene') {
  const { k } = e
  const f = furnMats(e)
  const y = p.position.y
  const kind = style ?? (y < 3 ? 'upholstered' : y < 8 ? 'upholstered' : y < 12 ? 'perforated' : 'polypropylene')
  const vinyl = y < 3 ? f.vinylNavy : f.vinylTeal
  const pitch = 0.62
  const len = n * pitch
  // The beam and its end caps; the two T-legs with their feet and levellers.
  k.soft(p, len - 0.02, 0.05, 0.09, 0.008, f.powderSilver, 0, 0.36, -0.06)
  for (const s of [-1, 1]) k.box(p, 0.012, 0.045, 0.085, f.nylon, s * (len / 2 - 0.006), 0.36, -0.06)
  for (const x of [-len / 2 + Math.min(0.5, len * 0.2), len / 2 - Math.min(0.5, len * 0.2)]) {
    k.soft(p, 0.065, 0.32, 0.065, 0.01, f.powderSilver, x, 0.18, -0.06)
    k.soft(p, 0.07, 0.04, 0.6, 0.012, f.powderSilver, x, 0.03, -0.06)
    for (const z of [-0.33, 0.21]) k.cyl(p, 0.016, 0.018, 0.012, f.nylon, x, 0.006, z, 12).castShadow = false
  }
  // Arms: one at each end and between seats.
  for (let i = 0; i <= n; i++) {
    const x = -len / 2 + pitch * i
    put(p, shell(e, 'beamArm', [[-0.22, 0.38], [-0.2, 0.6], [0.0, 0.64], [0.2, 0.62]], 0.03, 0.04, 0.006), f.castAlu, x, 0, 0)
    k.soft(p, 0.05, 0.025, 0.36, 0.01, f.pu, x, 0.66, 0.0)
  }
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + pitch * (i + 0.5)
    // The seat's bracket off the beam.
    k.box(p, 0.3, 0.04, 0.06, f.powderBlack, x, 0.4, -0.06)
    if (kind === 'upholstered') {
      k.soft(p, 0.52, 0.02, 0.46, 0.008, f.nylon, x, 0.425, 0.0)
      cushion(e, p, 0.53, 0.07, 0.47, vinyl, x, 0.47, 0.01)
      const b = group(p, x, 0.78, -0.25)
      b.rotation.x = -0.14
      k.soft(b, 0.51, 0.42, 0.02, 0.008, f.nylon, 0, 0, -0.04)
      cushion(e, b, 0.52, 0.42, 0.065, vinyl, 0, 0, 0, { welt: 'none', r: 0.028 })
      k.box(p, 0.05, 0.3, 0.025, f.powderBlack, x, 0.55, -0.27).rotation.x = -0.14
    } else {
      const mat = kind === 'perforated' ? f.perforated : y > 12 ? f.ppBlue : f.ppGrey
      const t = kind === 'perforated' ? 0.004 : 0.012
      put(p, shell(e, `beamShell${kind}`, [[0.24, 0.43], [0.2, 0.455], [0.0, 0.45], [-0.18, 0.44], [-0.24, 0.52], [-0.28, 0.72], [-0.3, 0.87]], t, 0.52, kind === 'perforated' ? 0.001 : 0.004), mat, x, 0, 0)
      // The back's support spine behind the shell.
      k.box(p, 0.06, 0.34, 0.02, f.powderSilver, x, 0.6, -0.27).rotation.x = -0.2
    }
  }
}

/** A swing door, w × 2.1, white laminate with a vision panel, kick plate and handle; hinge at local x = 0. */
function swingDoor(e: Ctx, p: Object3D, w: number, open: number, glazed = true) {
  const { k, m } = e
  const leaf = new Group()
  leaf.rotation.y = open
  p.add(leaf)
  k.box(leaf, w, 2.1, 0.045, m.hpl, w / 2, 1.05, 0)
  if (glazed) {
    k.box(leaf, 0.2, 0.8, 0.05, m.glass, w / 2, 1.45, 0, false)
    k.box(leaf, 0.24, 0.84, 0.048, m.aluminium, w / 2, 1.45, 0, false).scale.set(1, 1, 0.98)
  }
  k.box(leaf, w - 0.04, 0.3, 0.05, m.stainless, w / 2, 0.17, 0)
  for (const s of [-1, 1]) k.box(leaf, 0.025, 0.3, 0.04, m.stainless, w - 0.1, 1.0, s * 0.045)
}

function buildReception(e: Ctx) {
  const { k, m, root } = e
  const { x0, x1, z1, partition: P } = E
  const rg = E.registration
  const len = rg.z1 - rg.z0
  const zc = (rg.z0 + rg.z1) / 2
  // The registration counter facing the doors across the hall, a low run for wheelchair users.
  const g = k.at(rg.x - 0.77, zc, PI / 2, GL)
  counter(e, g, len, [-1.75, -0.15, 1.3], [len / 2 - 1.1, len / 2 - 0.2])
  for (const [i, x] of [-1.15, 0.55].entries()) {
    workstation(e, g, x, 0.765, 0.05, PI + (i ? 0.1 : -0.1), m.board)
    taskChair(e, group(g, x + 0.1, 0, -0.65, i ? -0.3 : 0.2))
    // A card terminal and a token printer on the ledge.
    k.box(g, 0.08, 0.04, 0.15, m.darkPlastic, x + 0.3, 1.14, 0.62)
  }
  k.box(g, 0.2, 0.05, 0.2, m.darkPlastic, -0.25, 0.79, 0.15)
  k.soft(g, 0.42, 0.22, 0.36, 0.02, m.greyPlastic, 1.65, 0.88, 0.1)
  // The sign over it on the wall behind, and the clock.
  signPanel(e, root, 2.8, 0.52, m.registration, x0 + 0.012, 2.25, zc, PI / 2, 0.012)
  k.cyl(root, 0.17, 0.17, 0.04, m.whitePlastic, x0 + 0.02, 2.25, zc - 2.0, 32).rotation.z = PI / 2
  face(e, root, 0.3, 0.3, m.clock, x0 + 0.045, 2.25, zc - 2.0, PI / 2)

  // Waiting: two beams of five along the lobby wall, facing the hall and the display.
  for (const z of [z1 - 0.42, z1 - 1.72]) beamSeating(e, k.at(10.75, z, PI, FLOOR), 5)
  // The queue display on the partition, the token kiosk, a water dispenser, bins.
  const q = k.at(12.65, P + T / 2, 0, GL)
  k.box(q, 1.0, 0.6, 0.05, m.black, 0, 2.0, 0.025)
  face(e, q, 0.96, 0.56, m.queue, 0, 2.0, 0.051)
  const ks = k.at(8.55, 3.6, PI / 2 + 0.25, FLOOR)
  k.soft(ks, 0.42, 0.06, 0.36, 0.02, m.greyPlastic, 0, 0.03, 0)
  k.soft(ks, 0.4, 1.1, 0.16, 0.03, m.whitePlastic, 0, 0.6, -0.06)
  const scr = new Group()
  scr.position.set(0, 1.32, 0.02)
  scr.rotation.x = -0.35
  ks.add(scr)
  k.soft(scr, 0.42, 0.56, 0.08, 0.03, m.whitePlastic, 0, 0, 0)
  face(e, scr, 0.34, 0.46, m.kiosk, 0, 0.02, 0.041)
  k.box(ks, 0.14, 0.02, 0.06, m.darkPlastic, 0, 1.0, 0.04)
  const wd = k.at(x1 - 0.3, z1 - 0.3, -PI * 0.75, FLOOR)
  k.soft(wd, 0.32, 1.0, 0.32, 0.03, m.whitePlastic, 0, 0.5, 0)
  k.cyl(wd, 0.14, 0.14, 0.4, m.clearPlastic, 0, 1.2, 0, 24)
  k.box(wd, 0.12, 0.08, 0.04, m.greyPlastic, 0, 0.82, 0.17)
  for (const [x, mat] of [[8.35, m.darkPlastic], [8.75, m.sharps]] as const) {
    const b = k.at(x, z1 - 0.3, 0, FLOOR)
    k.cyl(b, 0.16, 0.15, 0.62, mat, 0, 0.31, 0, 24)
    k.cyl(b, 0.165, 0.165, 0.03, m.whitePlastic, 0, 0.635, 0, 24)
  }
  // Wheelchairs and a stretcher waiting inside the ambulance doors, the alcohol rub on its stand.
  for (const [i, z] of [-1.6, -2.35].entries()) wheelchair(e, k.at(x1 - 0.55 - i * 0.05, z, -PI / 2 + 0.1 * i, FLOOR))
  bed(e, k.at(x1 - 0.5, P + 1.6, 0.02, FLOOR), { back: 0.35, linen: 'made', height: 0.82, iv: true })
  // A portable oxygen cylinder on its trolley, ready to go out with a patient.
  const ot = k.at(x1 - 1.35, P + 0.45, 0.4, FLOOR)
  k.soft(ot, 0.28, 0.03, 0.26, 0.01, m.powder, 0, 0.1, 0)
  for (const s of [-1, 1]) castor(e, ot, s * 0.11, -0.08, 0.05)
  cylinder(e, group(ot, 0, 0.12, 0), 0.09, 1.0, 'in use')
  const rub = k.at(x1 - 0.55, ER.door + 1.6, 0, FLOOR)
  k.box(rub, 0.3, 0.02, 0.3, m.powder, 0, 0.01, 0)
  k.cyl(rub, 0.02, 0.02, 1.2, m.powder, 0, 0.6, 0, 10)
  k.soft(rub, 0.12, 0.24, 0.11, 0.02, m.whitePlastic, 0, 1.3, 0.05)
  // The entrance matting, recessed flush inside the doors.
  k.box(root, 1.8, 0.004, 2.8, m.matting, x1 - 0.95, FLOOR + 0.002, ER.door, false)

  // The door through to the main hospital, in the lobby wall: a pair, closed, with its signs.
  const [d0, d1] = E.hospitalDoor
  for (const [x, s] of [[d0, 1], [d1, -1]] as const) {
    const dg = k.at(x, z1 + T / 2, 0, GL)
    swingDoor(e, dg, (d1 - d0) / 2 - 0.02, 0, true)
    if (s < 0) dg.rotation.y = PI
  }
  k.box(root, d1 - d0 + 0.1, 0.06, T + 0.03, m.aluminium, (d0 + d1) / 2, GL + 2.23, z1 + T / 2)
  signPanel(e, root, 1.9, 0.32, m.hospital, (d0 + d1) / 2, 2.55, z1 - 0.007, PI, 0.012)
  signPanel(e, root, 0.5, 0.19, m.staff, (d0 + d1) / 2 + 0.4, 1.6, z1 + T / 2 - 0.026, PI, 0.004)

  buildTriage(e)
  buildTreatmentDoors(e)
}

/**
 * The triage room in the hall's south-west corner: a glazed front to the hall with a frosted
 * band and its door, open; inside, the nurse's desk, a patient chair, the vitals monitor, an
 * examination couch, scales and a hand-wash sink.
 */
function buildTriage(e: Ctx) {
  const { k, m, root } = e
  const tr = E.triage
  const gx = tr.x1
  const [dz0, dz1] = tr.door
  // The glass front from the partition to the door; a transom over the door.
  const pane = (za: number, zb: number, y0: number, y1: number) => {
    k.box(root, 0.012, y1 - y0, zb - za, m.glass, gx, (y0 + y1) / 2, (za + zb) / 2, false)
    if (y0 === GL) k.box(root, 0.014, 0.4, zb - za, m.frosted, gx, GL + 1.25, (za + zb) / 2, false)
  }
  pane(E.partition + T / 2, dz0, GL, CEIL)
  pane(dz0, dz1, GL + 2.15, CEIL)
  // Frame: head and sill tracks, mullions, the door frame.
  k.box(root, 0.06, 0.05, tr.z1 - E.partition, m.aluminium, gx, CEIL - 0.025, (tr.z1 + E.partition) / 2)
  k.box(root, 0.06, 0.05, dz0 - E.partition - T / 2, m.aluminium, gx, GL + 0.025, (dz0 + E.partition + T / 2) / 2)
  for (let z = E.partition + T / 2; z < dz0 + 0.01; z += (dz0 - E.partition - T / 2) / 2) k.box(root, 0.06, CEIL - GL, 0.05, m.aluminium, gx, (CEIL + GL) / 2, z)
  for (const z of [dz0, dz1]) k.box(root, 0.08, 2.15, 0.06, m.aluminium, gx, GL + 1.075, z)
  k.box(root, 0.08, 0.06, dz1 - dz0, m.aluminium, gx, GL + 2.15, (dz0 + dz1) / 2)
  // The door, hinged on the partition's side, closed; it opens into the room (operated).
  const door = k.at(gx, dz0 + 0.03, -PI / 2, GL)
  door.name = 'door_er_triage'
  door.userData = { openAngle: -1.3, label: 'Triage Door' }
  swingDoor(e, door, dz1 - dz0 - 0.08, 0, true)
  bake(door)
  signPanel(e, root, 0.8, 0.2, m.triage, gx + 0.01, GL + 2.45, (dz0 + dz1) / 2, PI / 2, 0.008)
  // The desk against the inner wall, the nurse's chair, the patient's chair.
  const dk = k.at(E.x0 + 0.38, (tr.z0 + dz0) / 2 + 0.3, PI / 2, FLOOR)
  k.box(dk, 1.4, 0.03, 0.7, m.laminate, 0, 0.74, 0.0)
  for (const sx of [-1, 1]) k.box(dk, 0.04, 0.72, 0.66, m.powder, sx * 0.68, 0.37, 0)
  pedestal(e, group(dk, 0.42, 0, 0.32), 'Desk Drawer')
  workstation(e, dk, -0.2, 0.755, -0.1, 0.1, m.board)
  const ch = k.at(E.x0 + 1.05, (tr.z0 + dz0) / 2 + 0.5, -PI / 2 + 0.3, FLOOR)
  taskChair(e, ch)
  // The patient's chair at the desk's end, facing the nurse.
  visitorChair(e, k.at(E.x0 + 1.4, (tr.z0 + dz0) / 2 + 0.05, -PI / 2 - 0.3, FLOOR))
  vitalsStand(e, k.at(E.x0 + 0.42, tr.z1 - 0.6, PI / 2, FLOOR), m.monitors[3])
  // The examination couch along the partition, and the oxygen and suction on the wall at its head.
  examCouch(e, k.at(E.x0 + 1.6, E.partition + T / 2 + 0.42, 0, FLOOR))
  gasPanel(e, k.at(E.x0, E.partition + T / 2 + 0.45, PI / 2, GL))
  // Scales by the door, the sink on the room's wall to the hall.
  const sc = k.at(gx - 0.5, dz0 - 0.4, 0, FLOOR)
  k.box(sc, 0.32, 0.05, 0.32, m.greyPlastic, 0, 0.025, 0)
  k.box(sc, 0.28, 0.005, 0.28, m.black, 0, 0.052, 0, false)
  handwash(e, k.at(gx - 1.05, tr.z1 - T / 2, PI, FLOOR))
}

/**
 * The automatic doors through the partition: a bi-parting pair of glass leaves with a frosted
 * band, sliding on the treatment side under the operator's box. Leaves named autoleaf_ open for
 * a walker (see walk/WalkController).
 */
function buildTreatmentDoors(e: Ctx) {
  const { k, m, root } = e
  const [a, b] = E.treatmentDoor
  const P = E.partition
  const z = P - T / 2 - 0.035
  const w = (b - a) / 2
  for (const [s, x] of [[-1, a + w / 2], [1, b - w / 2]] as const) {
    const leaf = new Group()
    leaf.name = `autoleaf_er_treatment_${s}`
    leaf.position.set(x, GL + 1.12, z)
    leaf.userData.slide = [s * (w - 0.1), 0, 0]
    root.add(leaf)
    k.box(leaf, w + 0.02, 2.2, 0.012, m.glass, 0, 0, 0, false)
    k.box(leaf, w, 0.35, 0.014, m.frosted, 0, 0.1, 0, false)
    for (const ex of [-w / 2, w / 2]) k.box(leaf, 0.04, 2.24, 0.04, m.stainless, ex, 0, 0)
    for (const ey of [-1.1, 1.1]) k.box(leaf, w, 0.05, 0.04, m.stainless, 0, ey, 0)
  }
  // The operator's housing over the opening, both ways along the wall the leaves stack against.
  k.box(root, b - a + 2 * w, 0.18, 0.1, m.aluminium, (a + b) / 2, GL + 2.35, z - 0.02)
  // Stainless corner guards on the opening's jambs, both sides.
  for (const x of [a, b]) k.box(root, 0.05, 1.5, T + 0.02, m.stainless, x, GL + 0.75, P)
  k.box(root, b - a, 0.006, T + 0.06, m.stainless, (a + b) / 2, FLOOR + 0.002, P, false)
  signPanel(e, root, 1.6, 0.25, m.treatment, (a + b) / 2, GL + 2.62, P + T / 2 + 0.007, 0, 0.012)
}

/* ---------- light ---------- */

/** The department's lights: a few true lamps to model the light, the rest carried by the panels' glow. */
function buildLights(e: Ctx) {
  const { lighting, root } = e
  const [c0, c1] = E.corridor
  const lamps: [number, number, number, number][] = [
    [10.4, CEIL - 0.25, 0.6, 7],
    [7.2, CEIL - 0.25, -4.4, 4],
    [(c0 + c1) / 2 - 0.4, CEIL - 0.25, -9.4, 7],
    [(c0 + c1) / 2 - 0.4, CEIL - 0.25, -15.4, 7],
    [(c0 + c1) / 2 - 0.4, CEIL - 0.25, -20.0, 6],
    [12.1, BULK - 0.2, (E.station.z0 + E.station.z1) / 2, 5],
  ]
  for (const [x, y, z, i] of lamps) {
    const l = lighting.light(new PointLight('#fff1e2', i, 11, 2), 1)
    l.position.set(x, y, z)
    root.add(l)
  }
}

/**
 * Builds the department into `parent`, as one group (its point lights the department's light
 * zone, see index.ts).
 */
export function buildEmergency(ctx: HospitalCtx, parent: Object3D) {
  const root = new Group()
  root.name = 'emergency_department'
  parent.add(root)
  const k = new Kit(root, ctx.k)
  const e = makeCtx(k, ctx.lighting, root, 4471)
  buildShell(e)
  buildOverhead(e)
  buildBays(e)
  buildStation(e)
  buildPerimeter(e)
  buildReception(e)
  buildLights(e)
  return root
}
