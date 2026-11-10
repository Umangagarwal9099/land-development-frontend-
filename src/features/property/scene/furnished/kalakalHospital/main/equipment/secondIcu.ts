import {
  CatmullRomCurve3, MeshPhysicalMaterial, MeshStandardMaterial, Object3D, Quaternion, TorusGeometry, TubeGeometry, Vector3,
  type Material,
} from 'three'
import { PI } from '../../../kit'
import { bentTube, carcass, castor, drawer, face, geo, group, lathe, panel, pillow, put, rod, starBase } from '../../erKit'
import { flowmeter, outlet, patientMonitor, suction } from '../../erEquipment'
import { hose, itemMats, ivBag } from '../../opd/equipment/items'
import type { OpdCtx } from '../../opd/ctx'
import { ledDigits, pressurePaint, pumpLcd } from './secondPaints'

/*
 * The ICU's equipment, modelled on the devices such units are fitted with: a ceiling supply
 * pendant (a drop column on a two-link arm, its supply unit carrying the gas terminal units,
 * power and data, shelves, the monitor on its own arm and the suction on the side rail); a
 * critical-care ventilator in the Evita / Hamilton-C / SV-series manner (a castored trolley with
 * its column and accessory rails, the breathing unit with its expiratory valve and inspiratory
 * port, a separate swivelling touch display with a rotary knob, an articulated support arm
 * holding a corrugated dual-limb circuit through a heated humidifier, the proximal flow sensor
 * and a test lung at the Y-piece, the high-pressure hoses to the outlets); volumetric and syringe
 * infusion pumps in a docking station on an IV stand; a mobile electric suction unit; the
 * isolation room's pressure monitor and the anteroom's PPE station. Every piece in its own frame,
 * front +z, on y = 0, at the products' sizes.
 */

type P3 = [number, number, number]

const cache = new WeakMap<object, ReturnType<typeof make>>()

function make(e: OpdCtx) {
  const phys = (color: string, roughness: number) => new MeshPhysicalMaterial({ color, roughness, clearcoat: 0.3, clearcoatRoughness: 0.45 })
  const std = (color: string, roughness: number, metalness = 0) => new MeshStandardMaterial({ color, roughness, metalness })
  const glow = (color: string, intensity = 1.4) => e.lighting.glow(new MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.4 }), 0.9)
  const clearTube = (color: string, opacity: number) => new MeshPhysicalMaterial({ color, roughness: 0.28, clearcoat: 0.6, transparent: true, opacity, depthWrite: false })
  return {
    /** Device housings: a warm white moulded polymer, its grey counterpart, the dark front fascia. */
    body: phys('#eeeeea', 0.34),
    bodyGrey: phys('#c3c8cd', 0.4),
    fascia: std('#3f464f', 0.48),
    accent: std('#2f6ea8', 0.42),
    /** The trolley's and pendant's anodised aluminium extrusions, grey powder coat. */
    trolley: std('#8f979f', 0.42, 0.35),
    extrusion: std('#b9bec2', 0.35, 0.6),
    knob: std('#2a2e33', 0.55),
    /** Breathing circuit: blue inspiratory limb, clear-white expiratory; their cuffs. */
    insp: clearTube('#6fa9da', 0.86),
    exp: clearTube('#dfe8ee', 0.8),
    cuffBlue: std('#2d68ad', 0.4),
    cuffWhite: std('#e6eaec', 0.4),
    /** Low-pressure hoses: oxygen white, medical air black. */
    o2Hose: std('#f3f3f0', 0.5),
    airHose: std('#26282b', 0.45),
    cable: std('#3a3d42', 0.6),
    /** The test lung's rubber bag; the resuscitator's silicone. */
    lung: std('#2b2d30', 0.7),
    silicone: new MeshPhysicalMaterial({ color: '#e7c39a', roughness: 0.35, transparent: true, opacity: 0.88 }),
    /** Status lights: green (power / running), the frosted alarm lens unlit, amber. */
    ledGreen: glow('#3ce07a'),
    ledAmber: glow('#ffb12a'),
    ledBlue: glow('#4fb7ff', 1.2),
    lens: std('#f4f2ec', 0.3),
    /** PPE: isolation gowns (yellow), N95 respirators (white), face shields. */
    gown: std('#e9cf4b', 0.9),
    gownBlue: std('#5f8fc8', 0.9),
    visor: new MeshPhysicalMaterial({ color: '#e9f3f6', roughness: 0.05, transparent: true, opacity: 0.35, depthWrite: false }),
    acrylic: new MeshPhysicalMaterial({ color: '#eef6f8', roughness: 0.08, transparent: true, opacity: 0.3, depthWrite: false }),
  }
}

/** The ICU equipment's own finishes, made once per model. */
export function icuMats(e: OpdCtx) {
  let c = cache.get(e.m)
  if (!c) cache.set(e.m, (c = make(e)))
  return c
}

/* ---------- shapes ---------- */

/**
 * Corrugated tubing (a breathing circuit's limb) through `pts`, outer radius r: a tube whose
 * radius ripples every `pitch` along its length, as the moulded convolutions of a 22 mm limb.
 */
export function corrugated(e: OpdCtx, key: string, pts: P3[], r: number, pitch = 0.0085) {
  return geo(e, `corr${key}|${r}`, () => {
    const curve = new CatmullRomCurve3(pts.map(([x, y, z]) => new Vector3(x, y, z)), false, 'catmullrom', 0.4)
    const len = curve.getLength()
    const per = 4
    const segs = Math.max(24, Math.round(len / pitch) * per)
    const radial = 10
    const g = new TubeGeometry(curve, segs, r, radial, false)
    const pos = g.getAttribute('position')
    const c = new Vector3()
    const v = new Vector3()
    for (let i = 0; i <= segs; i++) {
      curve.getPointAt(i / segs, c)
      // Ridge and groove; the last centimetre at each end smooth, where the cuffs are.
      const s = (i / segs) * len
      const f = s < 0.012 || s > len - 0.012 ? 0.9 : 1 - 0.13 * (0.5 + 0.5 * Math.cos((i / per) * PI * 2))
      for (let j = 0; j <= radial; j++) {
        const n = i * (radial + 1) + j
        v.fromBufferAttribute(pos, n).sub(c).multiplyScalar(f).add(c)
        pos.setXYZ(n, v.x, v.y, v.z)
      }
    }
    g.computeVertexNormals()
    return g
  })
}

const UP = new Vector3(0, 1, 0)

/** Turns `o` so its local +y points along `dir`. */
function aim(o: Object3D, dir: Vector3) {
  o.quaternion.copy(new Quaternion().setFromUnitVectors(UP, dir.clone().normalize()))
  return o
}

/** A 22 mm cuff (the moulded end of a limb, a port's connector) at `at`, its axis along `dir`. */
function cuff(e: OpdCtx, p: Object3D, at: P3, dir: P3, mat: Material, len = 0.035, r = 0.0125) {
  const c = put(p, lathe(e, `cuff${len}|${r}`, [[0, 0], [r, 0], [r, len * 0.8], [r * 0.92, len], [0, len]], 16), mat, ...at)
  aim(c, new Vector3(...dir))
  return c
}

/** A short straight part (a probe, a connector body) from a towards b, radius r. */
function link(e: OpdCtx, p: Object3D, a: Vector3, b: Vector3, r: number, mat: Material, seg = 12) {
  const d = b.clone().sub(a)
  const c = e.k.cyl(p, r, r, d.length(), mat, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, seg)
  aim(c, d)
  return c
}

/* ---------- the ceiling supply pendant ---------- */

export interface PendantFit {
  /** The room's ceiling above the floor. */
  ceiling: number
  /** Where the arm's ceiling mount is, from the column (local x, z). */
  mount: [number, number]
  /** The monitor's screen; on the column's side `monitorSide`, turned `monitorYaw` from the column's front. */
  monitor?: Material
  monitorSide?: 1 | -1
  monitorYaw?: number
  /** Suction regulator and canister, and an O₂ flowmeter, on the column's other side. */
  suction?: boolean
}

export interface PendantOutlets {
  o2: Object3D
  air: Object3D
  vac: Object3D
}

/**
 * A ceiling supply pendant over an ICU bed head (after the two-link arm systems in critical
 * care): the ceiling flange and the drop tube, a horizontal arm in two links on their bearings,
 * and the supply unit hanging from it, 0.3 × 0.24 m and 1.2 m tall from 0.85 m: aluminium corner
 * extrusions, white covers, the front with its rows of gas terminal units (O₂, medical air,
 * vacuum, a second O₂ and vacuum), UPS (red) and raw power, data and the equipotential stud; two
 * cantilevered shelves with rails and a drawer under the lower; the patient monitor on its
 * articulated arm off one side, the suction regulator, canister and an O₂ flowmeter on the other.
 * Built at the column (its front +z). Returns markers at the O₂, air and vacuum sockets.
 */
export function icuPendant(e: OpdCtx, p: Object3D, o: PendantFit): PendantOutlets {
  const { k, m } = e
  const c = icuMats(e)
  const C = o.ceiling
  const armY = 2.36
  const [mx, mz] = o.mount
  // Ceiling flange and the drop tube, the arm's first bearing.
  put(p, lathe(e, 'pdCanopy', [[0, 0], [0.21, 0], [0.21, -0.035], [0.15, -0.075], [0, -0.075]], 32), c.body, mx, C, mz)
  k.cyl(p, 0.075, 0.075, C - 0.075 - (armY + 0.07), c.body, mx, (C - 0.075 + armY + 0.07) / 2, mz, 28)
  const drum = lathe(e, 'pdDrum', [[0, -0.07], [0.085, -0.07], [0.095, -0.05], [0.095, 0.05], [0.085, 0.07], [0, 0.07]], 28)
  // The arm: two links meeting at an elbow set off to one side of the straight line.
  const dx = -mx
  const dz = -mz
  const L = Math.hypot(dx, dz)
  const ex = mx + dx / 2 + (-dz / L) * 0.22
  const ez = mz + dz / 2 + (dx / L) * 0.22
  const arm = (ax: number, az: number, bx: number, bz: number) => {
    const g = group(p, ax, armY, az, Math.atan2(bx - ax, bz - az))
    const len = Math.hypot(bx - ax, bz - az)
    k.soft(g, 0.14, 0.13, len, 0.045, c.body, 0, 0, len / 2)
    k.box(g, 0.004, 0.06, len - 0.18, c.bodyGrey, 0.071, 0, len / 2, false)
    k.box(g, 0.004, 0.06, len - 0.18, c.bodyGrey, -0.071, 0, len / 2, false)
  }
  arm(mx, mz, ex, ez)
  arm(ex, ez, 0, 0)
  for (const [x, z] of [[mx, mz], [ex, ez], [0, 0]]) put(p, drum, c.body, x, armY, z)
  // The supply unit: the rotation hub, top cap, column body with corner extrusions, bottom cap.
  k.cyl(p, 0.055, 0.055, 0.16, c.extrusion, 0, armY - 0.14, 0, 20)
  k.soft(p, 0.28, 0.07, 0.22, 0.03, c.body, 0, 2.09, 0)
  k.soft(p, 0.3, 1.18, 0.24, 0.02, c.body, 0, 1.45, 0)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(p, 0.022, 1.2, 0.022, c.extrusion, sx * 0.145, 1.45, sz * 0.115)
  k.soft(p, 0.31, 0.05, 0.25, 0.02, c.bodyGrey, 0, 0.84, 0)
  k.box(p, 0.26, 1.12, 0.006, m.aluminium, 0, 1.45, 0.121, false)
  // The front: gas terminal units, power, data.
  const fz = 0.124
  const mark = (x: number, y: number, z = fz + 0.03) => {
    const n = new Object3D()
    n.position.set(x, y, z)
    p.add(n)
    return n
  }
  const gases: ['o2' | 'air' | 'vac', number, number][] = [['o2', -0.08, 1.92], ['air', 0.0, 1.92], ['vac', 0.08, 1.92], ['o2', -0.08, 1.8], ['vac', 0.08, 1.8]]
  for (const [g, x, y] of gases) outlet(e, p, g, x, y, fz)
  for (let i = 0; i < 4; i++) {
    const x = -0.07 + (i % 2) * 0.14
    const y = 1.64 - Math.floor(i / 2) * 0.1
    k.soft(p, 0.085, 0.085, 0.012, 0.006, i < 2 ? m.red : m.whitePlastic, x, y, fz + 0.006)
    for (const s of [-1, 1]) k.box(p, 0.007, 0.014, 0.004, m.black, x + s * 0.016, y + 0.008, fz + 0.013, false)
    k.box(p, 0.018, 0.012, 0.004, m.greyPlastic, x, y - 0.02, fz + 0.013, false)
  }
  for (const x of [-0.06, 0.0]) {
    k.soft(p, 0.05, 0.05, 0.01, 0.004, m.whitePlastic, x, 1.43, fz + 0.005)
    k.box(p, 0.018, 0.014, 0.004, m.black, x, 1.43, fz + 0.011, false)
  }
  k.cyl(p, 0.012, 0.012, 0.02, m.green, 0.08, 1.43, fz + 0.01, 12).rotation.x = PI / 2
  k.box(p, 0.004, 0.024, 0.004, m.vacuum, 0.08, 1.43, fz + 0.021, false)
  // Shelves: a moulded tray on two brackets, its aluminium rail round the front; a drawer under the lower.
  for (const y of [1.0, 1.28]) {
    k.soft(p, 0.5, 0.025, 0.36, 0.01, c.body, 0, y, fz + 0.18)
    for (const sx of [-1, 1]) k.box(p, 0.02, 0.1, 0.3, c.extrusion, sx * 0.11, y - 0.06, fz + 0.15)
    k.box(p, 0.5, 0.03, 0.012, m.aluminium, 0, y - 0.004, fz + 0.36)
  }
  const dr = group(p, 0, 0.855, fz + 0.35)
  carcass(e, dr, 0.44, 0.13, 0.33, c.body, [], 0)
  drawer(e, dr, 0, 0.065, 0, { w: 0.42, h: 0.11, d: 0.3, front: c.body, handle: 'grip', label: 'Pendant Drawer' })
  // A sharps box and a glove dispenser ride the upper shelf; a spare oxygen mask on the lower.
  k.box(p, 0.16, 0.12, 0.1, m.sharps, -0.15, 1.355, fz + 0.18)
  k.box(p, 0.17, 0.03, 0.11, m.red, -0.15, 1.43, fz + 0.18)
  k.soft(p, 0.25, 0.09, 0.12, 0.01, m.blue, 0.1, 1.34, fz + 0.2)
  k.box(p, 0.12, 0.004, 0.03, m.whitePlastic, 0.1, 1.386, fz + 0.2, false)
  // The monitor on its arm: a side bracket, two links, the tilting head.
  const ms = o.monitorSide ?? 1
  if (o.monitor) {
    const b = group(p, ms * 0.15, 1.9, 0.0)
    k.soft(b, 0.04, 0.16, 0.12, 0.012, c.extrusion, ms * 0.02, 0, 0)
    const joint = lathe(e, 'pdArmJoint', [[0, -0.03], [0.03, -0.03], [0.032, 0], [0.03, 0.03], [0, 0.03]], 18)
    const a1 = group(b, ms * 0.07, 0, 0, ms * PI / 2 - ms * 0.35)
    put(a1, joint, c.extrusion)
    k.soft(a1, 0.05, 0.045, 0.28, 0.018, c.extrusion, 0, 0, 0.14)
    const a2 = group(a1, 0, 0, 0.28)
    put(a2, joint, c.extrusion)
    const head = group(a2, 0, -0.16, 0)
    k.cyl(a2, 0.015, 0.015, 0.16, c.extrusion, 0, -0.08, 0, 12)
    // Turn back to world: the monitor faces the column's front, then by monitorYaw.
    head.rotation.y = -(ms * PI / 2 - ms * 0.35) + (o.monitorYaw ?? 0)
    const t = group(head, 0, -0.05, 0.05)
    t.rotation.x = -0.12
    patientMonitor(e, t, o.monitor, 0.42, m.charcoal)
  }
  // The other side: an O₂ outlet with its flowmeter, a vacuum outlet with the suction set.
  const side = group(p, -ms * 0.15, 0, 0, -ms * PI / 2)
  k.box(side, 0.21, 1.1, 0.004, m.aluminium, 0, 1.45, 0.001, false)
  k.box(side, 0.2, 0.025, 0.012, m.stainless, 0, 1.22, 0.012)
  outlet(e, side, 'o2', -0.05, 1.84, 0.006)
  flowmeter(e, side, -0.05, 1.84, null)
  if (o.suction !== false) {
    outlet(e, side, 'vac', 0.05, 1.58, 0.006)
    suction(e, side, 0.05, 1.58, 0.0)
  }
  return { o2: mark(-0.08, 1.925), air: mark(0.0, 1.925), vac: mark(0.08, 1.805) }
}

/* ---------- the humidifier ---------- */

/**
 * A servo-controlled heated humidifier (after the MR850 class): the grey heater base with its
 * temperature display and mode key, the hotplate in front with the retaining collar, the clear
 * auto-feed chamber on it (water in its float-valved base, the inlet and outlet ports on top).
 * Front +z, the base's back at z = −0.12. Returns the ports (local).
 */
export function humidifier(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const c = icuMats(e)
  const t = itemMats(e)
  k.soft(p, 0.15, 0.17, 0.12, 0.022, c.bodyGrey, 0, 0.085, -0.06)
  k.soft(p, 0.152, 0.03, 0.18, 0.012, c.bodyGrey, 0, 0.015, 0.03)
  put(p, panel(e, 0.12, 0.05, 0.006, 0.006), c.fascia, 0, 0.14, 0.002)
  face(e, p, 0.07, 0.03, e.o.screen('humid37', 140, 60, ledDigits('37.0')), -0.015, 0.142, 0.0055)
  k.cyl(p, 0.009, 0.009, 0.006, c.ledGreen, 0.04, 0.142, 0.004, 12).rotation.x = PI / 2
  // The hotplate and the chamber on it.
  k.cyl(p, 0.07, 0.07, 0.01, m.aluminium, 0, 0.034, 0.06, 28)
  put(p, lathe(e, 'humChamber', [[0, 0], [0.068, 0], [0.068, 0.075], [0.06, 0.095], [0.03, 0.105], [0, 0.106]], 28), t.clear, 0, 0.04, 0.06)
  put(p, lathe(e, 'humChWater', [[0, 0], [0.064, 0], [0.064, 0.03], [0, 0.03]], 24), t.saline, 0, 0.042, 0.06)
  put(p, lathe(e, 'humFloat', [[0, 0], [0.02, 0], [0.02, 0.012], [0, 0.014]], 14), t.shell, 0.02, 0.072, 0.06)
  const ports: P3[] = [[-0.03, 0.145, 0.06], [0.03, 0.145, 0.06]]
  for (const [x, y, z] of ports) put(p, lathe(e, 'humPort', [[0, -0.01], [0.0125, -0.01], [0.0125, 0.02], [0.0115, 0.025], [0, 0.025]], 16), t.clear, x, y - 0.01, z)
  // The collar that holds the chamber, the feed-line spike port at the side.
  k.soft(p, 0.15, 0.022, 0.03, 0.008, c.bodyGrey, 0, 0.05, 0.14)
  k.cyl(p, 0.005, 0.005, 0.03, t.clear, 0.05, 0.12, 0.08, 8)
  return ports
}

/* ---------- the ventilator ---------- */

export interface VentFit {
  screen: Material
  /** Which side the patient is on (local x): the circuit's arm swings that way. */
  side?: 1 | -1
  /** The O₂ and air outlets the hoses run to: [socket, a point 0.1 m out in front of it], local. */
  o2?: [Vector3, Vector3]
  air?: [Vector3, Vector3]
}

/**
 * A critical-care ventilator on its trolley (after the Evita / Hamilton-C / SV-series class):
 *   trolley    four 100 mm twin castors (the front pair braked) under a U-base, the central
 *              column, a wire basket with the manual resuscitator, the top tray with a standard
 *              accessory rail down each side and the push handle at the back;
 *   unit       the breathing unit, 0.44 × 0.30 × 0.36 m: the expiratory valve housing with its
 *              membrane cover and port, the inspiratory port with its bacterial filter, the
 *              proximal flow sensor's sockets, cooling grille, the O₂ and air NIST inlets behind;
 *   display    a separate 15.6″ touch display on a swivel post and tilt hinge, the alarm lens
 *              along its top, hard keys and the rotary knob under the screen;
 *   circuit    a heated-wire dual-limb circuit in 22 mm corrugated tubing: the dry line from the
 *              filter to the humidifier chamber, the blue inspiratory limb on to the Y-piece, the
 *              expiratory limb back to the valve; an articulated support arm clamped to the rail
 *              holding the Y-piece, with the flow sensor's lines and a test lung on it (the
 *              ventilator ready, in standby, between patients);
 *   humidifier on the patient-side rail, its sterile water bag on the trolley's pole.
 */
export function icuVentilator(e: OpdCtx, p: Object3D, o: VentFit) {
  const { k, m } = e
  const c = icuMats(e)
  const t = itemMats(e)
  const s = o.side ?? 1
  // The trolley: castors, U-base, its cover, the column.
  for (const [x, z, b] of [[-0.24, -0.25, false], [0.24, -0.25, false], [-0.24, 0.25, true], [0.24, 0.25, true]] as const) castor(e, p, x, z, 0.05, (x * 7 + z * 3) % 1, b)
  for (const sx of [-1, 1]) k.soft(p, 0.07, 0.05, 0.62, 0.02, c.trolley, sx * 0.24, 0.155, 0)
  k.soft(p, 0.54, 0.05, 0.08, 0.02, c.trolley, 0, 0.155, -0.25)
  put(p, panel(e, 0.42, 0.44, 0.03, 0.06), c.bodyGrey, 0, 0.19, 0.02).rotation.x = -PI / 2
  k.soft(p, 0.13, 0.6, 0.1, 0.02, c.trolley, 0, 0.49, -0.17)
  k.box(p, 0.09, 0.56, 0.004, c.extrusion, 0, 0.49, -0.119, false)
  // The basket on the column: wire frame, mesh floor; the manual resuscitator in it.
  put(p, bentTube(e, 'vtBasket', [[-0.19, 0, -0.1], [-0.19, 0, 0.14], [0.19, 0, 0.14], [0.19, 0, -0.1]], 0.005, 0.03), m.stainless, 0, 0.5, 0)
  put(p, bentTube(e, 'vtBasketLow', [[-0.19, 0, -0.1], [-0.19, 0, 0.14], [0.19, 0, 0.14], [0.19, 0, -0.1]], 0.004, 0.03), m.stainless, 0, 0.42, 0)
  k.box(p, 0.38, 0.004, 0.24, m.stainless, 0, 0.42, 0.02, false)
  for (const sx of [-0.19, 0.19]) k.box(p, 0.008, 0.08, 0.008, m.stainless, sx, 0.46, 0.14, false)
  const bag = put(p, lathe(e, 'bvmBag', [[0, -0.13], [0.03, -0.12], [0.055, -0.07], [0.062, 0], [0.055, 0.07], [0.028, 0.12], [0.014, 0.135], [0, 0.135]], 20), c.silicone, -0.04, 0.485, 0.03)
  bag.rotation.z = PI / 2
  k.cyl(p, 0.016, 0.016, 0.07, t.clear, 0.13, 0.485, 0.03, 12).rotation.z = PI / 2
  const mask = put(p, lathe(e, 'bvmMask', [[0, 0], [0.018, 0.002], [0.045, 0.02], [0.055, 0.045], [0.05, 0.05], [0, 0.05]], 20), t.clear, 0.12, 0.44, 0.03)
  mask.rotation.x = PI
  // The top tray, its rails, the push handle.
  k.soft(p, 0.52, 0.035, 0.46, 0.012, c.trolley, 0, 0.8, 0)
  for (const sx of [-1, 1]) {
    k.box(p, 0.01, 0.025, 0.42, m.stainless, sx * 0.275, 0.775, 0)
    for (const z of [-0.15, 0.15]) k.box(p, 0.016, 0.02, 0.02, c.trolley, sx * 0.264, 0.775, z)
  }
  put(p, bentTube(e, 'vtHandle', [[-0.22, 0.8, -0.22], [-0.22, 0.98, -0.3], [0.22, 0.98, -0.3], [0.22, 0.8, -0.22]], 0.012, 0.05), c.knob)
  // The breathing unit.
  const U = group(p, 0, 0.82, -0.02)
  k.soft(U, 0.44, 0.3, 0.36, 0.04, c.body, 0, 0.15, 0)
  put(U, panel(e, 0.41, 0.25, 0.012, 0.02), c.fascia, 0, 0.15, 0.181)
  k.box(U, 0.41, 0.012, 0.004, c.accent, 0, 0.285, 0.18, false)
  for (let i = 0; i < 7; i++) k.box(U, 0.004, 0.012, 0.22, c.fascia, -0.222, 0.08 + i * 0.022, 0, false)
  // The expiratory valve: its housing, the membrane cover, the port pointing forward-down.
  const ev = group(U, -s * 0.08, 0.1, 0.19)
  k.soft(ev, 0.13, 0.12, 0.05, 0.03, c.bodyGrey, 0, 0, 0.0)
  put(ev, lathe(e, 'expDome', [[0, 0], [0.045, 0], [0.046, 0.012], [0.035, 0.03], [0, 0.034]], 24), t.clear, 0, 0.012, 0.025).rotation.x = PI / 2
  k.cyl(ev, 0.03, 0.03, 0.004, c.fascia, 0, 0.012, 0.03, 20).rotation.x = PI / 2
  const expPort = new Vector3(-s * 0.08, 0.82 + 0.05, -0.02 + 0.27)
  cuff(e, p, [expPort.x, expPort.y - 0.012, expPort.z - 0.035], [0, 0.3, 1], c.bodyGrey, 0.04, 0.0115)
  // The inspiratory port and its bacterial filter.
  const ip = new Vector3(s * 0.13, 0.82 + 0.07, 0.17)
  cuff(e, p, [ip.x, ip.y, ip.z], [0, 0, 1], c.bodyGrey, 0.03, 0.0115)
  const filt = group(p, ip.x, ip.y, ip.z + 0.045)
  put(filt, lathe(e, 'bactFilter', [[0, -0.018], [0.012, -0.02], [0.036, -0.012], [0.038, 0], [0.036, 0.012], [0.012, 0.02], [0, 0.018]], 24), t.shell).rotation.x = PI / 2
  k.cyl(filt, 0.0385, 0.0385, 0.006, c.accent, 0, 0, 0, 24).rotation.x = PI / 2
  const filtOut = new Vector3(ip.x, ip.y, ip.z + 0.07)
  cuff(e, p, [filtOut.x, filtOut.y, filtOut.z - 0.012], [0, 0, 1], t.shell, 0.03, 0.0115)
  // Flow sensor sockets, an O₂ cell cover, the nebuliser outlet.
  for (const [x, mat] of [[0.0, c.cuffBlue], [0.025, c.cuffWhite]] as const) k.cyl(U, 0.007, 0.007, 0.012, mat, s * x, 0.13, 0.19, 12).rotation.x = PI / 2
  k.soft(U, 0.06, 0.04, 0.01, 0.008, c.bodyGrey, s * 0.13, 0.2, 0.188)
  k.cyl(U, 0.005, 0.005, 0.014, m.chrome, -s * 0.17, 0.05, 0.19, 10).rotation.x = PI / 2
  // The NIST inlets behind: O₂ (white collar), air (black).
  const inO2 = new Vector3(-s * 0.1, 0.82 + 0.13, -0.02 - 0.2)
  const inAir = new Vector3(-s * 0.03, 0.82 + 0.13, -0.02 - 0.2)
  for (const [v, mat] of [[inO2, m.whitePlastic], [inAir, m.black]] as const) {
    put(p, lathe(e, 'nistNut', [[0, 0], [0.016, 0], [0.016, 0.03], [0.012, 0.035], [0, 0.035]], 6), m.brass, v.x, v.y, v.z + 0.02).rotation.x = -PI / 2
    k.cyl(p, 0.019, 0.019, 0.012, mat, v.x, v.y, v.z + 0.022, 16).rotation.x = PI / 2
  }
  // The display: post, swivel, hinge block, the housing tilted back and turned a little to the side.
  k.cyl(U, 0.025, 0.025, 0.14, c.trolley, 0, 0.37, -0.12, 16)
  put(U, lathe(e, 'vtSwivel', [[0, 0], [0.04, 0], [0.043, 0.02], [0.04, 0.04], [0, 0.04]], 20), c.knob, 0, 0.44, -0.12)
  const yaw = group(U, 0, 0.48, -0.12, s * 0.22)
  k.soft(yaw, 0.09, 0.1, 0.07, 0.02, c.bodyGrey, 0, 0.04, 0.0)
  const D = group(yaw, 0, 0.19, 0.06)
  D.rotation.x = -0.2
  k.soft(D, 0.3, 0.22, 0.05, 0.03, c.body, 0, -0.01, -0.045)
  put(D, panel(e, 0.41, 0.32, 0.04, 0.025, [[0.352, 0.21, 0, 0.03, 0.006]]), c.body, 0, 0, 0)
  face(e, D, 0.35, 0.207, o.screen, 0, 0.03, 0.006)
  k.box(D, 0.354, 0.211, 0.003, t.glossBlack, 0, 0.03, 0.004, false)
  // Alarm lens along the top, the power LED; hard keys and the rotary knob along the foot.
  k.soft(D, 0.22, 0.016, 0.03, 0.007, c.lens, 0, 0.158, -0.006)
  k.cyl(D, 0.005, 0.005, 0.004, c.ledGreen, -0.17, -0.128, 0.021, 10).rotation.x = PI / 2
  for (let i = 0; i < 5; i++) put(D, panel(e, 0.034, 0.018, 0.006, 0.005), i === 0 ? c.ledAmber : c.bodyGrey, -0.12 + i * 0.045, -0.128, 0.021)
  const knob = group(D, 0.155, -0.122, 0.02)
  knob.rotation.x = PI / 2
  put(knob, lathe(e, 'vtKnob', [[0, 0], [0.028, 0], [0.03, 0.006], [0.029, 0.024], [0.024, 0.03], [0, 0.031]], 28), c.knob)
  put(knob, geo(e, 'vtKnobRing', () => new TorusGeometry(0.0285, 0.0025, 6, 28)), c.accent, 0, 0.006, 0).rotation.x = PI / 2
  put(D, bentTube(e, 'vtDispHandle', [[-0.12, 0, 0], [-0.12, 0.03, -0.01], [0.12, 0.03, -0.01], [0.12, 0, 0]], 0.008, 0.02), c.bodyGrey, 0, 0.16, -0.035)
  // The humidifier on the patient-side rail, on its bracket.
  const hum = group(p, s * 0.37, 0.5, 0.06)
  const ports = humidifier(e, hum)
  k.box(p, 0.016, 0.16, 0.08, c.trolley, s * 0.287, 0.7, 0.02)
  k.box(p, 0.09, 0.02, 0.08, c.trolley, s * 0.32, 0.62, 0.02)
  const hIn = new Vector3(s * 0.37 + ports[0][0] * s, 0.5 + ports[0][1] + 0.015, 0.06 + ports[0][2])
  const hOut = new Vector3(s * 0.37 + ports[1][0] * s, 0.5 + ports[1][1] + 0.015, 0.06 + ports[1][2])
  // The support arm: clamp on the rail, post, three links on knuckles, the Y-piece holder.
  const ar: P3[] = [[s * 0.3, 1.04, 0.16], [s * 0.44, 1.24, 0.3], [s * 0.58, 1.36, 0.36], [s * 0.66, 1.37, 0.42]]
  k.soft(p, 0.04, 0.06, 0.06, 0.01, c.knob, s * 0.29, 0.79, 0.16)
  k.cyl(p, 0.013, 0.013, 0.26, c.extrusion, s * 0.3, 0.91, 0.16, 14)
  const knuckle = lathe(e, 'vtKnuckle', [[0, -0.022], [0.02, -0.022], [0.022, 0], [0.02, 0.022], [0, 0.022]], 16)
  for (let i = 0; i < ar.length - 1; i++) {
    put(p, knuckle, c.knob, ...ar[i])
    link(e, p, new Vector3(...ar[i]), new Vector3(...ar[i + 1]), 0.011, c.extrusion)
  }
  put(p, bentTube(e, `vtClip${s}`, [[0, 0.02, -0.02], [0, -0.03, -0.02], [0, -0.03, 0.02], [0, 0.0, 0.02]], 0.004, 0.01), c.knob, ...ar[3])
  // The Y-piece under the holder, the flow sensor and the test lung on its catheter mount.
  const Y = new Vector3(s * 0.66, 1.31, 0.42)
  const yp = group(p, Y.x, Y.y, Y.z)
  put(yp, lathe(e, 'yPiece', [[0, -0.02], [0.013, -0.02], [0.016, 0], [0.013, 0.02], [0, 0.02]], 16), c.cuffWhite)
  cuff(e, yp, [0, 0.01, 0], [s * 0.6, 0.8, -0.1], c.cuffBlue, 0.03)
  cuff(e, yp, [0, 0.01, 0], [-s * 0.3, 0.8, 0.5], c.cuffWhite, 0.03)
  k.cyl(yp, 0.013, 0.013, 0.05, t.clear, 0, -0.045, 0, 14)
  k.box(yp, 0.012, 0.016, 0.012, c.cuffBlue, 0.016, -0.04, 0, false)
  k.box(yp, 0.012, 0.016, 0.012, c.cuffWhite, -0.016, -0.04, 0, false)
  k.cyl(yp, 0.009, 0.009, 0.03, c.cuffWhite, 0, -0.085, 0, 12)
  put(yp, pillow(e, 0.1, 0.06, 0.16), c.lung, 0, -0.18, 0).rotation.x = PI / 2
  // The limbs: dry line, heated inspiratory limb, expiratory limb.
  const fs = Math.round(s)
  put(p, corrugated(e, `vtDry${fs}`, [[filtOut.x, filtOut.y, filtOut.z], [s * 0.15, 0.89, 0.31], [s * 0.24, 0.81, 0.33], [s * 0.33, 0.73, 0.24], [hIn.x, hIn.y + 0.06, hIn.z + 0.04], [hIn.x, hIn.y, hIn.z]], 0.011), c.insp)
  put(p, corrugated(e, `vtInsp${fs}`, [[hOut.x, hOut.y, hOut.z], [hOut.x, hOut.y + 0.05, hOut.z + 0.02], [s * 0.46, 0.76, 0.24], [s * 0.53, 0.94, 0.44], [s * 0.62, 1.16, 0.5], [s * 0.66, 1.29, 0.46], [Y.x + s * 0.018, Y.y + 0.034, Y.z - 0.003]], 0.011), c.insp)
  put(p, corrugated(e, `vtExp${fs}`, [[Y.x - s * 0.009, Y.y + 0.034, Y.z + 0.015], [s * 0.6, 1.16, 0.6], [s * 0.42, 0.9, 0.7], [s * 0.16, 0.78, 0.56], [-s * 0.05, 0.84, 0.38], [expPort.x, expPort.y + 0.003, expPort.z]], 0.011), c.exp)
  cuff(e, p, [hIn.x, hIn.y + 0.012, hIn.z], [0, 1, 0], c.cuffBlue, 0.03)
  cuff(e, p, [hOut.x, hOut.y + 0.012, hOut.z], [0, 1, 0], c.cuffBlue, 0.03)
  // The heater wire adaptor and the temperature probe leads, the flow sensor's two lines.
  put(p, hose(e, `vtHeat${fs}`, [[s * 0.4, 0.66, 0.06], [s * 0.44, 0.7, 0.16], [s * 0.47, 0.8, 0.28]], 0.003, 6), c.cable)
  put(p, hose(e, `vtProbe${fs}`, [[s * 0.35, 0.66, 0.05], [s * 0.4, 0.9, 0.2], [s * 0.58, 1.12, 0.45], [s * 0.64, 1.25, 0.45]], 0.0022, 6), c.cable)
  for (const [dx, mat] of [[0.0, c.cuffBlue], [0.025, c.cuffWhite]] as const) put(p, hose(e, `vtFs${fs}${dx}`, [[Y.x + 0.01, Y.y - 0.04, Y.z + 0.01], [s * 0.52, 1.1, 0.52], [s * 0.26, 0.98, 0.34], [s * (0.0 + dx), 0.95, 0.19]], 0.0022, 6), mat)
  // The water bag on the trolley's pole and its feed line to the chamber.
  k.cyl(p, 0.009, 0.009, 0.8, m.stainless, s * 0.25, 1.22, -0.22, 10)
  put(p, bentTube(e, 'vtBagHook', [[0, 0, 0], [0.04, 0.0, 0], [0.05, 0.03, 0]], 0.003, 0.01), m.stainless, s * 0.25, 1.6, -0.22).rotation.y = s > 0 ? 0 : PI
  ivBag(e, p, s * 0.29, 1.62, -0.22, 0, 'Sterile Water', 'for Inhalation · 1000 mL')
  put(p, hose(e, `vtFeed${fs}`, [[s * 0.27, 1.2, -0.22], [s * 0.33, 0.95, -0.08], [s * 0.42, 0.72, 0.06], [s * 0.42, 0.62, 0.14]], 0.0022, 6), t.clear)
  // High-pressure hoses: to the outlets if given, otherwise coiled on the handle.
  const hp = (from: Vector3, to: [Vector3, Vector3] | undefined, mat: Material, key: string) => {
    put(p, lathe(e, 'nistProbe', [[0, 0], [0.012, 0], [0.012, 0.04], [0, 0.04]], 12), mat, from.x, from.y, from.z - 0.03).rotation.x = -PI / 2
    if (!to) {
      put(p, geo(e, 'hpCoil', () => new TorusGeometry(0.1, 0.007, 8, 32)), mat, from.x, 0.92, -0.32).rotation.x = 0.2
      return
    }
    const [sock, out] = to
    const a = from.clone().add(new Vector3(0, 0, -0.08))
    const low = Math.min(from.y, sock.y) - 0.45
    const mid = a.clone().lerp(out, 0.5)
    mid.y = Math.max(0.25, low)
    const pts: P3[] = [[from.x, from.y, from.z - 0.04], [a.x, a.y - 0.03, a.z], [mid.x, mid.y, mid.z], [out.x, out.y - 0.12, out.z], [out.x, out.y, out.z], [sock.x, sock.y, sock.z]]
    const k2 = pts.map((v) => v.map((n) => n.toFixed(2)).join(',')).join(';')
    put(p, hose(e, `hp${key}${k2}`, pts, 0.0065, 8), mat)
    link(e, p, out.clone().lerp(sock, 0.55), sock, 0.012, m.chrome)
  }
  hp(inO2, o.o2, c.o2Hose, 'o2')
  hp(inAir, o.air, c.airHose, 'air')
  // Mains lead to the floor.
  put(p, hose(e, 'vtMains', [[s * 0.15, 0.95, -0.2], [s * 0.18, 0.7, -0.33], [s * 0.1, 0.02, -0.5], [-s * 0.2, 0.01, -0.7]], 0.004, 6), c.cable)
}

/* ---------- infusion: pumps, their docking station, the stand ---------- */

export type PumpKind = { kind: 'vol' | 'syr'; drug: string; rate: string; sub: string; milky?: boolean }

/**
 * A low-profile volumetric infusion pump (after the Space-system class): 0.25 × 0.07 × 0.15 m, a
 * white housing, the grey front with its LCD and keys, the hinged pump door over the line with
 * its release lever and the line through it. Built standing on y = 0, front at z = 0.
 */
export function infusionPump(e: OpdCtx, p: Object3D, lcd: Material) {
  const { k, m } = e
  const c = icuMats(e)
  const t = itemMats(e)
  k.soft(p, 0.25, 0.068, 0.15, 0.012, c.body, 0, 0.034, -0.075)
  put(p, panel(e, 0.236, 0.056, 0.008, 0.008), c.bodyGrey, 0, 0.034, 0.002)
  face(e, p, 0.07, 0.034, lcd, -0.074, 0.037, 0.0065)
  k.box(p, 0.074, 0.038, 0.002, t.glossBlack, -0.074, 0.037, 0.0055, false)
  for (let i = 0; i < 4; i++) put(p, panel(e, 0.016, 0.011, 0.004, 0.003), i === 0 ? m.green : i === 3 ? m.red : c.body, -0.022 + (i % 2) * 0.02, 0.046 - Math.floor(i / 2) * 0.017, 0.007)
  // The pump door: a clear-windowed flap, its lever; the line in and out at its ends.
  put(p, panel(e, 0.1, 0.044, 0.008, 0.006), c.body, 0.062, 0.034, 0.008)
  k.box(p, 0.06, 0.016, 0.002, t.clear, 0.055, 0.038, 0.0125, false)
  k.soft(p, 0.016, 0.044, 0.012, 0.005, c.accent, 0.11, 0.034, 0.012)
  rod(e, p, 0.0018, 0.13, t.clear, 0.062, 0.022, 0.012, 'x', 6)
  k.cyl(p, 0.004, 0.004, 0.005, c.ledGreen, -0.115, 0.058, 0.004, 8).rotation.x = PI / 2
}

/**
 * A syringe pump of the same family: the housing with its LCD and keys in front, a 50 mL syringe
 * lying in the cradle along its top (barrel, the drug in it, plunger and flange), the barrel
 * clamp, the drive head gripping the plunger, the extension line leaving the tip.
 */
export function syringePump(e: OpdCtx, p: Object3D, lcd: Material, milky = false) {
  const { k, m } = e
  const c = icuMats(e)
  const t = itemMats(e)
  k.soft(p, 0.25, 0.068, 0.15, 0.012, c.body, 0, 0.034, -0.075)
  put(p, panel(e, 0.236, 0.034, 0.008, 0.008), c.bodyGrey, 0, 0.022, 0.002)
  face(e, p, 0.062, 0.026, lcd, -0.078, 0.022, 0.0065)
  for (let i = 0; i < 5; i++) put(p, panel(e, 0.016, 0.011, 0.004, 0.003), i === 0 ? m.green : i === 4 ? m.red : c.body, -0.025 + i * 0.022, 0.022, 0.007)
  // The cradle along the top, the syringe in it.
  k.box(p, 0.2, 0.012, 0.04, c.bodyGrey, -0.01, 0.07, -0.03)
  const sy = group(p, -0.035, 0.088, -0.03)
  sy.rotation.z = -PI / 2
  put(sy, lathe(e, 'syr50', [[0, -0.07], [0.0145, -0.07], [0.0145, 0.07], [0.006, 0.075], [0.003, 0.085], [0, 0.085]], 20), t.clear)
  put(sy, lathe(e, 'syr50Fluid', [[0, -0.02], [0.0135, -0.02], [0.0135, 0.068], [0, 0.068]], 16), milky ? m.whitePlastic : t.saline)
  k.cyl(sy, 0.0135, 0.0135, 0.008, t.stopper, 0, -0.024, 0, 16)
  k.box(sy, 0.05, 0.004, 0.02, t.clear, 0, -0.068, 0, false)
  k.box(sy, 0.006, 0.07, 0.006, t.clear, 0, -0.06, 0, false)
  // Barrel clamp, the drive head on the plunger flange.
  k.soft(p, 0.022, 0.04, 0.05, 0.008, c.bodyGrey, -0.02, 0.1, -0.03)
  k.soft(p, 0.045, 0.06, 0.055, 0.012, c.body, 0.09, 0.098, -0.03)
  k.box(p, 0.03, 0.004, 0.012, c.accent, 0.09, 0.129, -0.03, false)
  k.cyl(p, 0.004, 0.004, 0.005, c.ledGreen, -0.115, 0.058, 0.004, 8).rotation.x = PI / 2
}

/**
 * A docking station for `pumps` (bottom up), clamped to a pole at its back: the back frame with
 * power and data rails, side cheeks, the top cover with its carry handle and lit status bar,
 * the pole clamp and its screw. The pole runs through (0, *, −0.2); pumps' fronts at z = 0.
 */
export function pumpStation(e: OpdCtx, p: Object3D, pumps: PumpKind[], key: string) {
  const { k } = e
  const c = icuMats(e)
  const pitch = 0.078
  const H = pumps.length * pitch + 0.02
  k.soft(p, 0.27, H, 0.02, 0.008, c.bodyGrey, 0, H / 2, -0.162)
  for (const sx of [-1, 1]) k.soft(p, 0.012, H, 0.16, 0.004, c.bodyGrey, sx * 0.132, H / 2, -0.08)
  k.soft(p, 0.28, 0.035, 0.18, 0.012, c.body, 0, H + 0.0175, -0.085)
  k.box(p, 0.2, 0.006, 0.004, c.ledGreen, 0, H + 0.02, 0.006, false)
  put(p, bentTube(e, 'psHandle', [[-0.08, 0, 0], [-0.08, 0.04, -0.02], [0.08, 0.04, -0.02], [0.08, 0, 0]], 0.008, 0.02), c.bodyGrey, 0, H + 0.035, -0.08)
  k.soft(p, 0.06, 0.08, 0.05, 0.01, c.knob, 0, H * 0.6, -0.195)
  put(p, lathe(e, 'psScrew', [[0, 0], [0.016, 0], [0.016, 0.02], [0, 0.02]], 14), c.knob, 0.035, H * 0.6, -0.2).rotation.z = -PI / 2
  pumps.forEach((pu, i) => {
    const g = group(p, 0, 0.012 + i * pitch, 0)
    const lcd = e.o.screen(`pump_${key}_${i}`, 192, 96, pumpLcd(pu.drug, pu.rate, pu.sub), 0.9)
    if (pu.kind === 'vol') infusionPump(e, g, lcd)
    else syringePump(e, g, lcd, pu.milky)
  })
  return pitch
}

export interface TowerFit {
  pumps: PumpKind[]
  /** Bags on the hooks (one per volumetric pump, the rest without a line). */
  bags?: [string, string][]
  /** Where the lines leave for the patient (local). */
  toward?: P3
  key: string
}

/**
 * An infusion stand for the ICU: a five-leg base on castors, the chromed pole to 2.05 m, four
 * hooks with the bags on them, and the docking station of pumps clamped at 0.95 m; each bag's
 * giving set runs down into its volumetric pump, and every pump's line leaves for the patient.
 */
export function infusionTower(e: OpdCtx, p: Object3D, o: TowerFit) {
  const { m } = e
  const t = itemMats(e)
  starBase(e, p, 0.33, 0.08, m.stainless, 0.03)
  put(p, lathe(e, 'itPole', [[0, 0.1], [0.016, 0.1], [0.016, 1.35], [0.012, 1.37], [0.012, 2.05], [0, 2.05]], 16), m.chrome)
  put(p, lathe(e, 'itBoss', [[0, 2.02], [0.022, 2.02], [0.024, 2.05], [0.012, 2.08], [0, 2.085]], 16), m.chrome)
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * PI * 2 + PI / 4
    put(p, bentTube(e, 'itHook', [[0, 0, 0], [0.075, 0.005, 0], [0.095, 0.035, 0], [0.09, 0.06, 0]], 0.0045, 0.02), m.chrome, 0, 2.045, 0).rotation.y = a
  }
  const st = group(p, 0, 0.95, 0.2)
  const pitch = pumpStation(e, st, o.pumps, o.key)
  const bags = o.bags ?? []
  const vols = o.pumps.map((pu, i) => [pu, i] as const).filter(([pu]) => pu.kind === 'vol')
  bags.forEach(([name, strength], i) => {
    const a = (i / 4) * PI * 2 + PI / 4
    const hx = Math.cos(-a) * 0.09
    const hz = Math.sin(-a) * 0.09
    ivBag(e, p, hx, 2.1, hz, 0, name, strength)
    const v = vols[i]
    if (!v) return
    // Down from the drip chamber into the pump's left end.
    const py = 0.95 + 0.012 + v[1] * pitch + 0.022
    put(p, hose(e, `itLine${o.key}${i}`, [[hx - 0.02, 2.1 - 0.42, hz], [hx - 0.06, 1.6, hz + 0.08], [-0.17, py + 0.15, 0.25], [-0.14, py, 0.22]], 0.0018, 6), t.clear)
  })
  // Each pump's line out to the patient, sagging.
  if (o.toward) {
    const [tx, ty, tz] = o.toward
    o.pumps.forEach((pu, i) => {
      const py = 0.95 + 0.012 + i * pitch + (pu.kind === 'vol' ? 0.022 : 0.088)
      const sx = pu.kind === 'vol' ? 0.14 : -0.13
      put(p, hose(e, `itOut${o.key}${i}`, [[sx, py, 0.2 + (pu.kind === 'vol' ? 0.012 : -0.03)], [sx * 1.2, py - 0.25 - i * 0.03, 0.3], [(sx + tx) / 2, Math.min(py, ty) - 0.35, (0.3 + tz) / 2], [tx, ty, tz]], 0.0018, 6), t.clear)
    })
  }
}

/* ---------- suction, stores ---------- */

/**
 * A mobile electric suction unit (after the high-flow ward and ICU aspirators): a five-castor
 * base, the column, the motor housing with its vacuum gauge, regulator knob and rocker switch,
 * two 2 L polycarbonate collection jars in their holders with lids and tubing, the patient line
 * coiled on its hook.
 */
export function suctionUnit(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const c = icuMats(e)
  const t = itemMats(e)
  starBase(e, p, 0.27, 0.08, c.trolley, 0.03)
  k.cyl(p, 0.025, 0.025, 0.55, c.extrusion, 0, 0.38, 0, 14)
  k.soft(p, 0.34, 0.2, 0.26, 0.03, c.body, 0, 0.75, 0)
  put(p, panel(e, 0.32, 0.16, 0.01, 0.015), c.bodyGrey, 0, 0.76, 0.131)
  put(p, lathe(e, 'suGauge', [[0, 0], [0.042, 0], [0.044, 0.012], [0, 0.014]], 24), m.chrome, -0.07, 0.77, 0.135).rotation.x = PI / 2
  face(e, p, 0.074, 0.074, m.vacuumGauge, -0.07, 0.77, 0.15)
  put(p, lathe(e, 'suKnob', [[0, 0], [0.024, 0], [0.025, 0.02], [0, 0.022]], 18), c.knob, 0.04, 0.77, 0.136).rotation.x = PI / 2
  k.box(p, 0.03, 0.02, 0.012, m.green, 0.11, 0.8, 0.14)
  k.box(p, 0.06, 0.012, 0.004, m.whitePlastic, 0.04, 0.715, 0.137, false)
  put(p, bentTube(e, 'suHandle', [[-0.12, 0, 0], [-0.12, 0.06, 0], [0.12, 0.06, 0], [0.12, 0, 0]], 0.009, 0.02), c.bodyGrey, 0, 0.85, -0.05)
  for (const sx of [-1, 1]) {
    const j = group(p, sx * 0.12, 0.38, 0.06)
    k.box(j, 0.13, 0.012, 0.13, c.trolley, 0, -0.01, 0)
    put(j, lathe(e, 'suJar', [[0, 0], [0.058, 0], [0.062, 0.2], [0.06, 0.215], [0, 0.215]], 22), t.clear)
    put(j, lathe(e, 'suJarLevel', [[0, 0.002], [0.055, 0.002], [0.057, 0.04], [0, 0.04]], 18), sx > 0 ? t.saline : t.clear)
    k.cyl(j, 0.066, 0.066, 0.025, c.accent, 0, 0.225, 0, 22)
    k.cyl(j, 0.008, 0.008, 0.03, t.clear, 0.03, 0.245, 0, 8)
  }
  put(p, hose(e, 'suLine', [[0.15, 0.62, 0.06], [0.2, 0.7, 0.12], [0.12, 0.74, 0.14]], 0.004, 8), t.clear)
  put(p, geo(e, 'suCoil', () => new TorusGeometry(0.07, 0.004, 6, 28)), t.clear, 0.2, 0.68, 0.0).rotation.y = PI / 2
}

/* ---------- isolation ---------- */

/**
 * A room pressure monitor beside an isolation room's door (face at z = 0, centred at y): its
 * display of the differential pressure, the status band, the alarm mute key and the sounder.
 */
export function pressureMonitor(e: OpdCtx, p: Object3D, y = 1.55) {
  const { k } = e
  const c = icuMats(e)
  put(p, panel(e, 0.16, 0.22, 0.035, 0.01), c.body, 0, y, 0.0175)
  face(e, p, 0.135, 0.16, e.o.screen('isoPressure', 270, 320, pressurePaint, 0.8), 0, y + 0.015, 0.0356)
  k.cyl(p, 0.01, 0.01, 0.006, c.ledGreen, -0.04, y - 0.085, 0.036, 12).rotation.x = PI / 2
  put(p, panel(e, 0.04, 0.016, 0.006, 0.004), c.bodyGrey, 0.03, y - 0.085, 0.036)
}

/**
 * The anteroom's PPE station, against a wall (z = 0), w ≈ 0.95: a white powder-coated steel
 * frame with three compartments: isolation gowns folded in a stack and one on a hook; boxes of
 * N95 respirators and surgical masks; glove boxes in three sizes in their holders; face shields
 * on pegs; caps and shoe covers in clear dispensers. Its top at 1.85 m.
 */
export function ppeStation(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const c = icuMats(e)
  const t = itemMats(e)
  const W = 0.95
  // The frame: back panel, sides, three shelves at 0.95, 1.3, 1.62.
  k.box(p, W, 0.95, 0.012, t.powderWhite, 0, 1.38, 0.006)
  for (const sx of [-1, 1]) k.box(p, 0.012, 0.95, 0.24, t.powderWhite, sx * (W / 2 - 0.006), 1.38, 0.12)
  for (const y of [0.91, 1.26, 1.58]) k.box(p, W - 0.02, 0.012, 0.24, t.powderWhite, 0, y, 0.12)
  k.box(p, W, 0.02, 0.24, t.powderWhite, 0, 1.85, 0.12)
  // The labels along the shelf edges.
  const lab = (key: string, text: string, x: number, y: number, w: number, bg: string) => face(e, p, w, 0.03, e.o.sign(`ppe_${key}`, 256, 32, (g, ww, hh) => {
    g.fillStyle = bg
    g.fillRect(0, 0, ww, hh)
    g.fillStyle = '#ffffff'
    g.font = `700 ${hh * 0.62}px Helvetica`
    g.textAlign = 'center'
    g.fillText(text, ww / 2, hh * 0.75)
  }), x, y, 0.2445)
  // Lowest shelf: gowns folded, the next one ready on its hook beside.
  for (let i = 0; i < 4; i++) k.soft(p, 0.36, 0.035, 0.2, 0.012, c.gown, -0.22 + (i % 2) * 0.004, 0.935 + i * 0.036, 0.12)
  k.soft(p, 0.2, 0.05, 0.18, 0.012, c.gownBlue, 0.18, 0.94, 0.12)
  k.box(p, 0.24, 0.12, 0.2, c.acrylic, 0.18, 0.98, 0.12, false)
  lab('gowns', 'ISOLATION GOWNS', -0.22, 0.895, 0.36, '#c49a00')
  lab('covers', 'SHOE COVERS', 0.18, 0.895, 0.3, '#2f6ea8')
  // Middle: N95 and surgical mask boxes; caps.
  for (const [x, col, w] of [[-0.3, m.whitePlastic, 0.2], [-0.07, m.blue, 0.2], [0.2, m.green, 0.24]] as const) {
    k.box(p, w, 0.12, 0.13, col, x, 1.33, 0.1)
    k.box(p, w * 0.6, 0.02, 0.004, m.paper, x, 1.35, 0.166, false)
  }
  k.soft(p, 0.07, 0.03, 0.05, 0.012, m.whitePlastic, -0.3, 1.405, 0.14)
  lab('n95', 'N95 RESPIRATORS', -0.3, 1.245, 0.21, '#1c3966')
  lab('masks', 'SURGICAL MASKS', -0.07, 1.245, 0.21, '#1c3966')
  lab('caps', 'CAPS', 0.2, 1.245, 0.2, '#1c3966')
  // Top: glove boxes in three sizes, standing on edge with their slots forward.
  const gloves = [m.blue, m.purple, m.blue]
  const sizes = ['S', 'M', 'L']
  sizes.forEach((sz, i) => {
    const x = -0.28 + i * 0.25
    k.box(p, 0.24, 0.12, 0.13, gloves[i], x, 1.655, 0.08)
    k.box(p, 0.14, 0.03, 0.004, m.whitePlastic, x, 1.67, 0.146, false)
    k.box(p, 0.04, 0.02, 0.012, gloves[i], x, 1.7, 0.15, false)
    lab(`gl${sz}`, `GLOVES ${sz}`, x, 1.575, 0.2, '#555a60')
  })
  // Face shields on pegs under the lowest shelf.
  for (let i = 0; i < 3; i++) {
    const x = -0.3 + i * 0.3
    k.cyl(p, 0.006, 0.006, 0.08, m.stainless, x, 0.82, 0.04, 8).rotation.x = PI / 2
    k.box(p, 0.22, 0.24, 0.004, c.visor, x, 0.69, 0.07 + i * 0.004, false)
    k.box(p, 0.22, 0.03, 0.02, m.blue, x, 0.81, 0.07)
  }
}

/**
 * A patient monitor on a wall arm (a suite's bed head): the wall channel, a two-link arm swung
 * out, the tilting head with the monitor on it; its face towards +z, `reach` out from the wall.
 */
export function wallMonitor(e: OpdCtx, p: Object3D, screen: Material, y: number, reach = 0.32, w = 0.32) {
  const { k, m } = e
  const c = icuMats(e)
  k.soft(p, 0.06, 0.22, 0.03, 0.01, c.extrusion, 0, y, 0.015)
  const joint = lathe(e, 'wmJoint', [[0, -0.025], [0.024, -0.025], [0.026, 0], [0.024, 0.025], [0, 0.025]], 16)
  put(p, joint, c.extrusion, 0, y, 0.04)
  k.soft(p, 0.04, 0.035, reach - 0.06, 0.012, c.extrusion, 0, y, 0.04 + (reach - 0.06) / 2)
  put(p, joint, c.extrusion, 0, y, reach - 0.02)
  const head = group(p, 0, y + 0.02, reach + 0.06)
  head.rotation.x = -0.1
  patientMonitor(e, head, screen, w, m.whitePlastic)
}
