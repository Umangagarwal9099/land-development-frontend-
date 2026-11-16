import { CapsuleGeometry, CylinderGeometry, DoubleSide, ExtrudeGeometry, Group, LatheGeometry, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Path, PointLight, RingGeometry, Shape, ShapeGeometry, Vector2, type Material, type Object3D } from 'three'
import { circuit, setCircuit, switchPlate, type Circuit } from '../../kalakalD65/fixtures'
import { sheet } from '../solids'
import { downlight } from './architecture'
import { bx, clipped, rectPoly, type FloorCtx } from './shell'
import { place } from './signs'
import { LIFTS, WC_DOORS, XV0, ZSC0, ZSC1, ZWC, type Rect } from './units'

/*
 * The washrooms, laid out and finished as a five-star hotel's, and working:
 *
 *   Ladies   the whole strip across the corridor from the lifts, 74 m² on the upper floors: one
 *            door in the middle of its long wall, a free-standing backlit onyx screen inside it
 *            with a powder bench, a row of floor-to-ceiling walnut cubicles along the back wall
 *            (an accessible one at its end), and a long Calacatta vanity down each side wall.
 *   Gents    the block behind the lifts: the same door, an onyx feature wall facing it, the vanity
 *            along the corridor wall, cubicles and urinals along the back.
 *
 * Everything a visitor would touch is live: cubicle doors swing on their hinges, toilet seats and
 * lids lift (the seat brings the lid, the lid brings the seat down), the flush plates flush, the
 * taps run and stop, the hand dryers switch on, and a switch plate inside each door works the
 * room's lights, which fade down together with its backlit mirrors and onyx.
 */

const PI = Math.PI
const H_CEIL = 3.0

/** Flushes under way: the viewer keeps drawing until the last has finished (see index.ts). */
let flushingUntil = 0
export const flushing = () => Date.now() < flushingUntil

function mesh(p: Object3D, g: Mesh['geometry'], m: Material, x = 0, y = 0, z = 0, cast = true) {
  const o = new Mesh(g, m)
  o.position.set(x, y, z)
  o.castShadow = cast
  o.receiveShadow = true
  p.add(o)
  return o
}

/** A group on the floor at (x, z) whose local +z faces yaw (into the room, away from its wall). */
function at(e: FloorCtx, p: Object3D, x: number, z: number, yaw: number) {
  const g = new Group()
  g.position.set(x, e.y, z)
  g.rotation.y = yaw
  p.add(g)
  return g
}

/** One washroom's lit finishes and lamps, on a circuit of their own, with its zone for the light pool. */
interface Room {
  zone: string
  circuit: Circuit
  led: MeshStandardMaterial
  ledCool: MeshStandardMaterial
  opal: MeshStandardMaterial
  onyx: MeshStandardMaterial
  mirror: MeshStandardMaterial
  water: MeshPhysicalMaterial
  bowl: MeshStandardMaterial
}

function room(e: FloorCtx, id: 'wc_l' | 'wc_g'): Room {
  const { lux } = e
  const c = circuit()
  const glow = (m: Material) => {
    const n = (m as MeshStandardMaterial).clone()
    n.userData.interior = true
    c.glows.push(n)
    return n
  }
  const bowl = (lux.porcelain as MeshStandardMaterial).clone()
  bowl.side = DoubleSide
  bowl.userData.interior = true
  const water = new MeshPhysicalMaterial({ color: '#cfe6ea', roughness: 0.02, transparent: true, opacity: 0.45, envMap: e.m.env, envMapIntensity: 1.4 })
  water.userData.interior = true
  return { zone: `room_mall_${e.level === 0 ? 'g' : e.level}_${id}`, circuit: c, led: glow(lux.led), ledCool: glow(lux.ledCool), opal: glow(lux.opal), onyx: glow(lux.onyx), mirror: lux.mirror as MeshStandardMaterial, water, bowl }
}

/* ---------- sanitaryware ---------- */

/**
 * A wall-hung WC as the premium makers build them: a rimless elongated bowl in one piece of
 * vitreous china (a revolved profile stretched to its 370 × 540 mm plan), its back boxed to the
 * wall, on a concealed cistern behind a marble-faced duct with the brass flush plate; a slim
 * seat ring and lid on chrome hinges. The seat and lid are doors about their hinge: tap the lid
 * and it lifts (and the seat with it when the lid comes down), the flush plate flushes.
 */
function wc(e: FloorCtx, g: Object3D, r: Room, name: string) {
  const { lux, k } = e
  // The duct: marble front, Calacatta cap, the plate on it.
  k.box(g, 0.9, 1.05, 0.2, lux.bianco, 0, 0.525, 0.1)
  k.box(g, 0.94, 0.03, 0.24, lux.calacattaOro, 0, 1.065, 0.12)
  const plate = new Group()
  plate.name = `button_flush_${name}`
  plate.userData.label = 'Flush'
  plate.position.set(0, 0.92, 0.2)
  g.add(plate)
  k.soft(plate, 0.24, 0.16, 0.012, 0.004, lux.brass, 0, 0, 0.006).userData.front = true
  const keys = [k.soft(plate, 0.1, 0.12, 0.008, 0.004, lux.chrome, -0.055, 0, 0.014), k.soft(plate, 0.07, 0.12, 0.008, 0.004, lux.chrome, 0.065, 0, 0.014)]
  // The bowl: outer shell and inner basin in one revolved profile, stretched along the room.
  const prof = [
    new Vector2(0, 0.09), new Vector2(0.1, 0.09), new Vector2(0.155, 0.14), new Vector2(0.18, 0.22), new Vector2(0.19, 0.32), new Vector2(0.19, 0.4), new Vector2(0.185, 0.42),
    new Vector2(0.165, 0.42), new Vector2(0.155, 0.4), new Vector2(0.135, 0.34), new Vector2(0.085, 0.27), new Vector2(0.03, 0.245), new Vector2(0, 0.245),
  ]
  const pan = mesh(g, new LatheGeometry(prof, 56), r.bowl, 0, 0, 0.43)
  pan.scale.set(1, 1, 1.42)
  // The water in the trap, and the swirl that shows while it flushes.
  const still = mesh(g, new CylinderGeometry(0.075, 0.075, 0.004, 32), r.water, 0, 0.255, 0.43, false)
  still.scale.set(1, 1, 1.42)
  const swirl = mesh(g, new CylinderGeometry(0.14, 0.14, 0.004, 40), r.water, 0, 0.345, 0.43, false)
  swirl.scale.set(1, 1, 1.42)
  swirl.visible = false
  // Boxed back to the wall under the rim (the china runs square to the duct), and the seat's hinge block.
  k.soft(g, 0.37, 0.3, 0.3, 0.04, r.bowl, 0, 0.26, 0.14)
  k.soft(g, 0.37, 0.04, 0.2, 0.012, r.bowl, 0, 0.4, 0.22)
  for (const s of [-0.1, 0.1]) k.cyl(g, 0.016, 0.016, 0.03, lux.chrome, s, 0.44, 0.235, 16).rotation.z = PI / 2
  // The seat ring, then the lid over it, each hinged at the back; the lid lifts first.
  const seat = new Group()
  seat.name = `door_seat_${name}`
  seat.userData.label = 'Toilet seat'
  seat.userData.axis = 'x'
  seat.userData.openAngle = -1.75
  seat.position.set(0, 0.44, 0.235)
  g.add(seat)
  const ring = mesh(seat, new LatheGeometry([new Vector2(0.125, 0), new Vector2(0.19, 0), new Vector2(0.2, 0.012), new Vector2(0.19, 0.024), new Vector2(0.125, 0.024), new Vector2(0.115, 0.012)], 48), lux.porcelain, 0, 0, 0.215)
  ring.scale.set(1, 1, 1.42)
  ring.userData.front = true
  const lid = new Group()
  lid.name = `door_lid_${name}`
  lid.userData.label = 'Toilet lid'
  lid.userData.axis = 'x'
  lid.userData.openAngle = -1.85
  lid.position.set(0, 0.466, 0.235)
  g.add(lid)
  const cap = mesh(lid, new LatheGeometry([new Vector2(0, 0), new Vector2(0.19, 0), new Vector2(0.2, 0.014), new Vector2(0.185, 0.028), new Vector2(0, 0.03)], 48), lux.porcelain, 0, 0, 0.215)
  cap.scale.set(1, 1, 1.42)
  cap.userData.front = true
  seat.userData.alsoOpen = [lid]
  lid.userData.alsoClose = [seat]
  // Flushing: the keys go in, the swirl shows, for a few seconds.
  plate.userData.press = () => {
    swirl.visible = true
    for (const key of keys) key.position.z = 0.008
    flushingUntil = Date.now() + 2800
    setTimeout(() => {
      swirl.visible = false
      for (const key of keys) key.position.z = 0.014
    }, 2600)
  }
  // Health faucet on its brass hook, paper holder.
  k.box(g, 0.05, 0.08, 0.02, lux.brass, -0.36, 0.72, 0.21)
  const spray = mesh(g, new CapsuleGeometry(0.018, 0.1, 4, 12), lux.brass, -0.36, 0.78, 0.25)
  spray.rotation.z = 0.3
  mesh(g, new CapsuleGeometry(0.006, 0.5, 4, 6), lux.chrome, -0.37, 0.48, 0.23).rotation.z = 0.08
  k.box(g, 0.16, 0.012, 0.11, lux.brass, 0.38, 0.75, 0.25)
  k.cyl(g, 0.055, 0.055, 0.12, lux.porcelain, 0.38, 0.69, 0.25, 24).rotation.z = PI / 2
}

/** A wall-hung urinal with its sensor plate, facing local +z from the wall. */
function urinal(e: FloorCtx, g: Object3D, r: Room) {
  const { lux, k } = e
  const prof = [new Vector2(0, 0), new Vector2(0.12, 0.02), new Vector2(0.17, 0.12), new Vector2(0.18, 0.3), new Vector2(0.17, 0.5), new Vector2(0.12, 0.62), new Vector2(0, 0.66)]
  const u = mesh(g, new LatheGeometry(prof, 40, PI, PI), r.bowl, 0, 0.55, 0.0)
  u.scale.set(1, 1, 0.75)
  k.soft(g, 0.09, 0.14, 0.012, 0.004, lux.brass, 0, 1.32, 0.008)
  k.box(g, 0.03, 0.03, 0.004, lux.blackSteel, 0, 1.3, 0.016)
}

/**
 * A vanity on a wall: its back on the wall line at (x, z), facing yaw, `len` long, `n` basins. A
 * Calacatta counter with undermount basins cut into it on a floating walnut cabinet lit beneath;
 * the feature stone behind to the ceiling; at each basin an arched backlit mirror in a brass frame
 * and a brushed-brass sensor spout that runs when tapped; opal sconces between; soap at each.
 */
function vanity(e: FloorCtx, p: Object3D, r: Room, name: string, x: number, z: number, yaw: number, len: number, n: number, feature: Material) {
  const { k, lux } = e
  const g = at(e, p, x, z, yaw)
  const d = 0.6
  const top = 0.86
  k.box(g, len + 0.6, H_CEIL - 0.02, 0.03, feature, 0, H_CEIL / 2, 0.015)
  const shape = new Shape()
  shape.moveTo(-len / 2, 0.03)
  shape.lineTo(len / 2, 0.03)
  shape.lineTo(len / 2, d)
  shape.lineTo(-len / 2, d)
  shape.closePath()
  const centres: number[] = []
  for (let i = 0; i < n; i++) {
    const u = -len / 2 + ((i + 0.5) * len) / n
    centres.push(u)
    const hole = new Path()
    hole.absellipse(u, 0.33, 0.23, 0.16, 0, PI * 2, true, 0)
    shape.holes.push(hole)
  }
  const slab = new ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false, curveSegments: 32 })
  slab.rotateX(PI / 2)
  slab.translate(0, top + 0.05, 0)
  mesh(g, slab, lux.calacattaOro)
  k.box(g, len, 0.2, 0.03, lux.calacattaOro, 0, top - 0.05, d - 0.015)
  k.box(g, len - 0.04, 0.3, d - 0.1, lux.walnutPanel, 0, top - 0.32, d / 2 - 0.02)
  k.box(g, len - 0.2, 0.008, 0.01, r.led, 0, top - 0.475, d - 0.12, false)
  const sconce = (u: number) => {
    k.box(g, 0.08, 0.36, 0.02, lux.brass, u, 1.75, 0.04)
    k.cyl(g, 0.045, 0.045, 0.3, r.opal, u, 1.75, 0.1, 24)
    k.cyl(g, 0.05, 0.05, 0.02, lux.brass, u, 1.91, 0.1, 24)
    k.cyl(g, 0.05, 0.05, 0.02, lux.brass, u, 1.59, 0.1, 24)
  }
  const arch = (w: number, h: number) => {
    const s2 = new Shape()
    s2.moveTo(-w / 2, 0)
    s2.lineTo(w / 2, 0)
    s2.lineTo(w / 2, h - w / 2)
    s2.absarc(0, h - w / 2, w / 2, 0, PI, false)
    s2.closePath()
    return s2
  }
  const mw = Math.min(0.75, len / n - 0.32)
  for (const [i, u] of centres.entries()) {
    const b = mesh(g, new LatheGeometry([new Vector2(0.001, -0.15), new Vector2(0.1, -0.145), new Vector2(0.2, -0.1), new Vector2(0.245, -0.03), new Vector2(0.26, 0)], 48), r.bowl, u, top + 0.048, 0.33, false)
    b.scale.set(1, 1, 0.7)
    k.cyl(g, 0.02, 0.02, 0.006, lux.chrome, u, top - 0.098, 0.33, 16)
    // The spout: a sensor tap that runs when tapped (its stream and the ripple where it lands).
    const tap = new Group()
    tap.name = `switch_tap_${name}_${i}`
    tap.userData.label = 'Tap'
    tap.userData.on = false
    tap.position.set(u, 1.1, 0.036)
    g.add(tap)
    k.soft(tap, 0.06, 0.16, 0.012, 0.004, lux.brass, 0, 0.02, 0)
    k.soft(tap, 0.035, 0.025, 0.2, 0.008, lux.brass, 0, 0, 0.094).userData.front = true
    k.cyl(tap, 0.006, 0.006, 0.004, lux.blackSteel, 0, -0.013, 0.184, 10)
    const stream = mesh(tap, new CylinderGeometry(0.004, 0.006, 0.19, 10), r.water, 0, -0.11, 0.184, false)
    const ripple = mesh(g, new RingGeometry(0.02, 0.07, 32), r.water, u, top + 0.052, 0.22, false)
    ripple.rotation.x = -PI / 2
    stream.visible = ripple.visible = false
    tap.userData.toggle = (on: boolean) => {
      stream.visible = ripple.visible = on
    }
    mesh(g, new ShapeGeometry(arch(mw + 0.08, 1.38), 24), r.led, u, 1.08, 0.032, false)
    const frame = arch(mw + 0.04, 1.34)
    frame.holes.push(new Path(arch(mw, 1.3).getPoints(24)))
    mesh(g, new ExtrudeGeometry(frame, { depth: 0.025, bevelEnabled: false, curveSegments: 24 }), lux.brass, u, 1.1, 0.04, false)
    mesh(g, new ShapeGeometry(arch(mw, 1.3), 24), r.mirror, u, 1.12, 0.05, false)
    if (i < centres.length - 1) sconce((u + centres[i + 1]) / 2)
    // Soap: a walnut bottle with a brass pump.
    k.cyl(g, 0.03, 0.032, 0.14, lux.walnutPanel, u + 0.3, top + 0.12, 0.12, 20)
    k.cyl(g, 0.008, 0.008, 0.05, lux.brass, u + 0.3, top + 0.21, 0.12, 8)
    k.box(g, 0.035, 0.008, 0.02, lux.brass, u + 0.3, top + 0.235, 0.135)
  }
  sconce(-len / 2 - 0.15)
  sconce(len / 2 + 0.15)
  e.shade.rect(x, e.y + 0.012, z, len, 0.9, yaw, 0.3)
}

/** Recessed in the stone at a wall: a brushed-steel dryer that switches on, and a bin under it, facing local +z. */
function dryer(e: FloorCtx, p: Object3D, r: Room, name: string, x: number, z: number, yaw: number) {
  const { k, lux } = e
  const g = at(e, p, x, z, yaw)
  k.box(g, 0.42, 1.6, 0.03, lux.brass, 0, 0.95, 0.015)
  const unit = new Group()
  unit.name = `switch_dryer_${name}`
  unit.userData.label = 'Hand dryer'
  unit.userData.on = false
  unit.position.set(0, 1.25, 0.08)
  g.add(unit)
  k.soft(unit, 0.32, 0.5, 0.12, 0.02, lux.steel, 0, 0, 0).userData.front = true
  k.box(unit, 0.22, 0.02, 0.06, lux.blackSteel, 0, -0.23, 0.04)
  const lamp = k.box(unit, 0.05, 0.006, 0.004, lux.blackSteel, 0.1, 0.2, 0.062, false)
  const air = mesh(unit, new CylinderGeometry(0.06, 0.1, 0.3, 16, 1, true), r.water, 0, -0.42, 0.04, false)
  air.visible = false
  unit.userData.toggle = (on: boolean) => {
    lamp.material = on ? r.ledCool : lux.blackSteel
    air.visible = on
  }
  k.soft(g, 0.34, 0.6, 0.18, 0.01, lux.steel, 0, 0.32, 0.1)
  k.box(g, 0.26, 0.02, 0.04, lux.blackSteel, 0, 0.6, 0.17)
}

/**
 * A row of floor-to-ceiling walnut cubicles along a wall (local x along it, +z out of the wall):
 * partitions on brass feet, a door in each on a piano hinge with a brass lever and occupancy
 * indicator, a WC and a downlight inside. `wide` makes the last one accessible: 1.8 m, with grab
 * rails and a pull cord.
 */
function cubicles(e: FloorCtx, p: Object3D, r: Room, name: string, x: number, z: number, yaw: number, n: number, w: number, depth: number, wide: boolean) {
  const { k, lux } = e
  const g = at(e, p, x, z, yaw)
  const h = H_CEIL - 0.06
  const widths = Array.from({ length: n }, (_, i) => (wide && i === n - 1 ? 1.8 : w))
  const len = widths.reduce((a, b) => a + b, 0)
  let u0 = -len / 2
  k.box(g, 0.035, h - 0.12, depth, lux.walnutPanel, u0, 0.12 + (h - 0.12) / 2, depth / 2)
  k.box(g, 0.04, 0.12, depth - 0.1, lux.brass, u0, 0.06, depth / 2)
  widths.forEach((cw, i) => {
    const u1 = u0 + cw
    k.box(g, 0.035, h - 0.12, depth, lux.walnutPanel, u1, 0.12 + (h - 0.12) / 2, depth / 2)
    k.box(g, 0.04, 0.12, depth - 0.1, lux.brass, u1, 0.06, depth / 2)
    const cg = new Group()
    cg.position.set(u0 + cw / 2, 0, 0)
    g.add(cg)
    wc(e, cg, r, `${name}_${i}`)
    downlight(e, g, u0 + cw / 2, H_CEIL, depth / 2)
    if (wide && i === n - 1) {
      for (const s of [-0.5, 0.5]) mesh(cg, new CapsuleGeometry(0.017, 0.8, 4, 10), lux.brass, s * 1.02, 0.78, 0.6).rotation.x = PI / 2
      k.box(cg, 0.5, 0.012, 0.012, lux.brass, 0.45, 0.72, 0.21)
      bx(e, cg, 0.75, 0.76, 0.2, 2.2, 1.3, 1.31, e.m.neon('#d42a2a'))
    }
    // The door, hung on the left, opening in; the lever, the indicator; the hinge's knuckles.
    const dw = cw - 0.19
    k.box(g, 0.14, h, 0.04, lux.walnutPanel, u0 + 0.09, h / 2, depth)
    const door = new Group()
    door.name = `door_cubicle_${name}_${i}`
    door.userData.label = 'Cubicle door'
    door.userData.openAngle = -PI / 2 + 0.2
    door.position.set(u0 + 0.16, 0, depth)
    g.add(door)
    k.box(door, dw, h - 0.04, 0.04, lux.walnutPanel, dw / 2, h / 2, 0).userData.front = true
    k.box(door, 0.02, 0.02, 0.14, lux.brass, dw - 0.13, 1.02, 0.07)
    k.box(door, 0.03, 0.03, 0.03, lux.brass, dw - 0.13, 1.02, 0.03)
    k.box(door, 0.06, 0.03, 0.01, lux.blackSteel, dw - 0.13, 1.25, 0.025)
    for (const yy of [0.3, 1.5, 2.7]) k.cyl(door, 0.008, 0.008, 0.08, lux.brass, 0, yy, 0, 10)
    u0 = u1
  })
  k.box(g, len, 0.02, 0.05, lux.brass, 0, h, depth)
  const c = Math.cos(yaw)
  const s = Math.sin(yaw)
  const o = depth + 0.03
  e.shade.foot(x - (len / 2) * c + o * s, z + (len / 2) * s + o * c, x + (len / 2) * c + o * s, z - (len / 2) * s + o * c, e.y + 0.01, 0.2, 0.3)
}

/* ---------- rooms ---------- */

/** Floor, full-height cladding, stepped ceiling and its lighting for one room, on the room's circuit. */
function shell(e: FloorCtx, p: Object3D, r: Room, rect: Rect, door: [number, number], doorZ: number) {
  const { lux } = e
  const [x0, x1, z0, z1] = rect
  const top = e.y + H_CEIL
  const poly = clipped(e, rect)
  sheet(p, poly, e.y + 0.006, lux.nero, false, [], 'wc_border')
  const xa = Math.max(x0, e.box.x0)
  sheet(p, rectPoly([xa + 0.3, x1 - 0.3, z0 + 0.3, z1 - 0.3]), e.y + 0.0075, lux.calacattaOro, false, [], 'wc_floor')
  const t = 0.025
  const ia = xa + (x0 <= e.box.x0 + 0.01 ? 0.003 : 0.078)
  const ib = x1 - 0.078
  const ja = z0 + 0.078
  const jb = z1 - 0.078
  const face = (a: number, b: number, c: number, d: number) => bx(e, p, a, b, e.y, top, c, d, lux.bianco)
  face(ia, ia + t, ja, jb)
  face(ib - t, ib, ja, jb)
  for (const zz of [ja, jb]) {
    const [c, d] = zz === ja ? [zz, zz + t] : [zz - t, zz]
    const onDoorSide = (doorZ === z0) === (zz === ja)
    if (onDoorSide) {
      face(ia, door[0], c, d)
      bx(e, p, door[0], door[1], e.y + 2.25, top, c, d, lux.bianco)
      face(door[1], ib, c, d)
    } else face(ia, ib, c, d)
  }
  // Stepped ceiling round a raised, cove-lit raft; downlights in the band; the room's lamps.
  const [a, b, c, d] = [ia + 0.45, ib - 0.45, ja + 0.45, jb - 0.45]
  sheet(p, poly, top, e.m.gypsum, true, [rectPoly([a, b, c, d])], 'wc_ceiling')
  sheet(p, rectPoly([a, b, c, d]), top + 0.25, e.m.gypsum, true, [], 'wc_raft')
  for (const [p0, p1, q0, q1] of [[a, b, c, c + 0.02], [a, b, d - 0.02, d], [a, a + 0.02, c, d], [b - 0.02, b, c, d]]) bx(e, p, p0, p1, top, top + 0.25, q0, q1, e.m.gypsum, false)
  for (const [p0, p1, q0, q1] of [[a + 0.03, b - 0.03, c + 0.03, c + 0.05], [a + 0.03, b - 0.03, d - 0.05, d - 0.03], [a + 0.03, a + 0.05, c + 0.03, d - 0.03], [b - 0.05, b - 0.03, c + 0.03, d - 0.03]]) bx(e, p, p0, p1, top + 0.02, top + 0.03, q0, q1, r.led, false)
  const nx = Math.max(2, Math.round((b - a) / 2.2))
  const nz = Math.max(1, Math.round((d - c) / 2.2))
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < nz; j++) {
      const lx = a + ((b - a) * (i + 0.5)) / nx
      const lz = c + ((d - c) * (j + 0.5)) / nz
      downlight(e, p, lx, top + 0.25, lz)
      if (i % 2 === 0 || nx < 3) {
        const l = e.lighting.light(new PointLight('#fff1dc', 7, 8, 1.8), 0.7)
        l.position.set(lx, top - 0.3, lz)
        l.userData.zone = r.zone
        p.add(l)
        r.circuit.lights.push(l)
      }
    }
}

/** The switch plate inside the door that works the room's lights: two rockers, both on the circuit. */
function lightSwitch(e: FloorCtx, p: Object3D, r: Room, name: string, x: number, z: number, yaw: number) {
  const g = new Group()
  g.position.set(x, e.y + 1.2, z)
  g.rotation.y = yaw
  p.add(g)
  const plate = switchPlate(e.k, g, `${name}_lights`, ['switch', 'switch'], { plate: e.lux.brass, rocker: e.lux.brass, dark: e.lux.blackSteel, locator: e.lux.ledCool as MeshStandardMaterial }, [r.circuit, r.circuit])
  plate.traverse((o) => {
    if (o.name.startsWith('switch_')) o.userData.label = 'Lights'
  })
}

/** Backlit onyx in a brass frame on a wall running along z at x (facing dir). */
function onyxPanel(e: FloorCtx, p: Object3D, r: Room, x: number, dir: 1 | -1, z0: number, z1: number) {
  const { lux } = e
  const y0 = e.y + 0.35
  const y1 = e.y + 2.65
  bx(e, p, Math.min(x, x + dir * 0.03), Math.max(x, x + dir * 0.03), y0, y1, z0, z1, r.onyx, false)
  for (const [a, b, c, d] of [[y0 - 0.03, y0, z0 - 0.03, z1 + 0.03], [y1, y1 + 0.03, z0 - 0.03, z1 + 0.03], [y0, y1, z0 - 0.03, z0], [y0, y1, z1, z1 + 0.03]])
    bx(e, p, Math.min(x, x + dir * 0.045), Math.max(x, x + dir * 0.045), a, b, c, d, lux.brass, false)
}

/** A free-standing screen across the entrance: onyx both faces in a brass frame, from x0 to x1 at z. */
function onyxScreen(e: FloorCtx, p: Object3D, r: Room, x0: number, x1: number, z: number) {
  const { lux } = e
  const y0 = e.y + 0.1
  const y1 = e.y + 2.5
  bx(e, p, x0, x1, e.y, e.y + 0.1, z - 0.1, z + 0.1, lux.wallNero)
  bx(e, p, x0, x1, y0, y1, z - 0.04, z + 0.04, r.onyx, false)
  for (const [a, b] of [[x0 - 0.04, x0], [x1, x1 + 0.04]]) bx(e, p, a, b, y0, y1 + 0.04, z - 0.06, z + 0.06, lux.brass)
  bx(e, p, x0 - 0.04, x1 + 0.04, y1, y1 + 0.04, z - 0.06, z + 0.06, lux.brass)
}

/** A powder bench: a marble block with a leather pad, facing local +z. */
function powderBench(e: FloorCtx, p: Object3D, x: number, z: number, yaw: number, len: number) {
  const g = at(e, p, x, z, yaw)
  e.k.soft(g, len, 0.42, 0.45, 0.015, e.lux.wallNero, 0, 0.21, 0)
  e.k.soft(g, len - 0.04, 0.07, 0.42, 0.03, e.lux.leatherCognac, 0, 0.455, 0)
  e.shade.rect(x, e.y + 0.012, z, len, 0.5, yaw, 0.35)
}

/** The marble portal round a washroom doorway in the corridor, its pictograms over it. */
function portal(e: FloorCtx, p: Object3D, x0: number, x1: number, z: number, out: 1 | -1, kind: 'w' | 'm') {
  const sc = e.lux.schemes[e.level]
  const zf = z + out * 0.08
  const zz = (a: number, b: number) => [Math.min(zf + out * a, zf + out * b), Math.max(zf + out * a, zf + out * b)] as const
  const [q0, q1] = zz(0, 0.05)
  bx(e, p, x0 - 0.2, x0, e.y, e.y + 2.5, q0, q1, sc.wall)
  bx(e, p, x1, x1 + 0.2, e.y, e.y + 2.5, q0, q1, sc.wall)
  bx(e, p, x0 - 0.2, x1 + 0.2, e.y + 2.28, e.y + 2.5, q0, q1, sc.wall)
  const [r0, r1] = zz(0.05, 0.06)
  bx(e, p, x0 - 0.01, x1 + 0.01, e.y + 2.27, e.y + 2.29, r0, r1, e.lux.brass)
  const yaw = out > 0 ? 0 : PI
  place(p, 0.26, 0.26, e.s.pictogram(kind), e.s.lit, (x0 + x1) / 2 - 0.15, e.y + 2.75, zf + out * 0.055, yaw)
  place(p, 0.26, 0.26, e.s.pictogram('a'), e.s.lit, (x0 + x1) / 2 + 0.15, e.y + 2.75, zf + out * 0.055, yaw)
}

/** The washrooms' rectangles with their light zones (see index.ts). */
export function washroomRects(e: FloorCtx): { zone: string; rect: Rect }[] {
  const back = e.level === 0 ? -22.3 : -25.6
  const tag = e.level === 0 ? 'g' : String(e.level)
  return [
    { zone: `room_mall_${tag}_wc_l`, rect: [-13.4, XV0, back, ZSC0] },
    { zone: `room_mall_${tag}_wc_g`, rect: [e.box.x0, LIFTS.x0, ZSC1, ZWC] },
  ]
}

export function luxuryWashrooms(e: FloorCtx, p: Object3D) {
  const { lux } = e
  const x0 = e.box.x0
  const ground = e.level === 0
  const back = ground ? -22.3 : -25.6
  const tag = ground ? 'g' : String(e.level)
  const ladies: Rect = [-13.4, XV0, back, ZSC0]
  const gents: Rect = [x0, LIFTS.x0, ZSC1, ZWC]
  const L = room(e, 'wc_l')
  const G = room(e, 'wc_g')
  const ld = WC_DOORS.ladies as [number, number]
  const gd = WC_DOORS.gents as [number, number]
  shell(e, p, L, ladies, ld, ZSC0)
  shell(e, p, G, gents, gd, ZSC1)
  portal(e, p, ld[0], ld[1], ZSC0, 1, 'w')
  portal(e, p, gd[0], gd[1], ZSC1, -1, 'm')

  /* Ladies: cubicles along the back wall, vanities down the sides (or, at the shallower ground, flanking the door). */
  const cubDepth = ground ? 1.6 : 1.75
  const span = ladies[1] - 0.2 - (ladies[0] + 0.2)
  const n = Math.floor((span - 1.8) / 1.15)
  cubicles(e, p, L, `l${tag}`, (ladies[0] + ladies[1]) / 2, back + 0.105, 0, n + 1, 1.15, cubDepth, true)
  lightSwitch(e, p, L, `l${tag}`, ld[1] + 0.4, ZSC0 - 0.108, PI)
  if (ground) {
    const wl = ld[0] - 0.5 - (ladies[0] + 0.3)
    const el = ladies[1] - 0.3 - (ld[1] + 0.9)
    vanity(e, p, L, `l${tag}w`, ladies[0] + 0.3 + wl / 2, ZSC0 - 0.105, PI, wl, 4, lux.wallViola)
    vanity(e, p, L, `l${tag}e`, ld[1] + 0.9 + el / 2, ZSC0 - 0.105, PI, el, 2, lux.wallViola)
    dryer(e, p, L, `l${tag}`, ladies[1] - 0.105, ZSC0 - 1.5, -PI / 2)
  } else {
    const vz0 = ZSC0 - 0.7
    const vz1 = back + cubDepth + 0.6
    const vl = vz0 - vz1
    vanity(e, p, L, `l${tag}e`, ladies[1] - 0.105, (vz0 + vz1) / 2, -PI / 2, vl, 4, lux.wallViola)
    vanity(e, p, L, `l${tag}w`, ladies[0] + 0.105, (vz0 + vz1) / 2, PI / 2, vl, 4, lux.wallViola)
    onyxScreen(e, p, L, ld[0] - 0.7, ld[1] + 0.7, ZSC0 - 2.3)
    powderBench(e, p, (ld[0] + ld[1]) / 2, ZSC0 - 2.75, PI, 1.6)
    dryer(e, p, L, `l${tag}a`, ld[0] - 2.0, ZSC0 - 0.105, PI)
    dryer(e, p, L, `l${tag}b`, ld[1] + 2.0, ZSC0 - 0.105, PI)
  }

  /* Gents: the vanity along the corridor wall, cubicles and urinals along the back, the onyx wall facing the door. */
  const gx = x0 + 0.35
  const gn = Math.floor((-11.1 - gx - 1.8) / 1.1)
  const row = gn * 1.1 + 1.8
  cubicles(e, p, G, `g${tag}`, gx + row / 2, ZWC - 0.105, PI, gn + 1, 1.1, 1.6, true)
  const ux0 = gx + row + 0.5
  const urinals = Math.max(1, Math.floor((gents[1] - 0.4 - ux0) / 0.85))
  for (let i = 0; i < urinals; i++) {
    const ux = ux0 + i * 0.85
    urinal(e, at(e, p, ux, ZWC - 0.105, PI), G)
    if (i < urinals - 1) bx(e, p, ux + 0.405, ux + 0.445, e.y + 0.5, e.y + 1.8, ZWC - 0.7, ZWC - 0.1, lux.wallNero)
  }
  const vl = gd[0] - 0.5 - gx
  vanity(e, p, G, `g${tag}`, (gx + gd[0] - 0.5) / 2, ZSC1 + 0.105, 0, vl, Math.floor(vl / 1.25), lux.emperador)
  onyxPanel(e, p, G, gents[1] - 0.105, -1, ZSC1 + 0.5, ZWC - 0.5)
  dryer(e, p, G, `g${tag}`, gents[0] + 0.105, ZWC - 1.3, PI / 2)
  lightSwitch(e, p, G, `g${tag}`, gd[0] - 0.4, ZSC1 + 0.108, 0)
  for (const r of [L, G]) setCircuit(r.circuit, true)
}
