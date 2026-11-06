import { TorusGeometry, type Material, type Object3D } from 'three'
import { PI } from '../kit'
import { bentTube, castor, face, geo, group, lathe, panel, pillow, put, rod, starBase, tube, type Ctx } from './erKit'
import { infusionBag } from './erFurniture'
import { cpuTower, extrude, hose, itemMats, keyboard, monitor24, mouse } from './opd/equipment/items'

/*
 * The emergency department's equipment and medical gas installation. The gases come from the
 * hospital's plant along copper pipelines above the ceiling, drop to the department's zone valve
 * box on the back wall (one isolating valve and line gauge per gas, behind a break-glass lid),
 * and run on to the terminal units: the bed-head trunking at every bay, the service pendant in
 * resus, the panel in triage. Each outlet is gas-specific and colour-coded (ISO 32: oxygen white,
 * medical air black and white, vacuum yellow), labelled on its plate; the area alarm watches the
 * line pressures at the nurses' station's end of the department.
 */

/* ---------- terminal units and what plugs into them ---------- */

type Gas = 'o2' | 'air' | 'vac'

/** A gas terminal unit on a face at z = 0 (facing +z): its labelled plate, collar and socket. */
export function outlet(e: Ctx, p: Object3D, gas: Gas, x: number, y: number, z = 0) {
  const { m } = e
  const plate = { o2: m.plateO2, air: m.plateAir, vac: m.plateVac }[gas]
  const ring = { o2: m.whitePlastic, air: m.black, vac: m.vacuum }[gas]
  face(e, p, 0.075, 0.075, plate, x, y, z + 0.001)
  put(p, lathe(e, 'outletCollar', [[0, 0], [0.026, 0], [0.026, 0.012], [0.02, 0.02], [0, 0.02]], 24), ring, x, y + 0.005, z).rotation.x = PI / 2
  put(p, lathe(e, 'outletSocket', [[0, 0], [0.012, 0], [0.012, 0.026], [0.008, 0.03], [0, 0.03]], 18), m.chrome, x, y + 0.005, z).rotation.x = PI / 2
}

/**
 * An oxygen flowmeter in the outlet at (x, y): its probe into the socket, the chromed body, the
 * Thorpe tube in its guard with the float and the printed scale, the green flow knob; a humidifier
 * bottle threaded on below (two-thirds full); and the green tubing looped down to a mask on its hook.
 */
export function flowmeter(e: Ctx, p: Object3D, x: number, y: number, mask: [number, number] | null) {
  const { k, m } = e
  const t = itemMats(e)
  const g = group(p, x, y + 0.005, 0.03)
  put(g, lathe(e, 'fmProbe', [[0, 0], [0.011, 0], [0.012, 0.03], [0.016, 0.034], [0.016, 0.05], [0, 0.05]], 16), m.chrome).rotation.x = PI / 2
  put(g, panel(e, 0.046, 0.07, 0.036, 0.008), m.chrome, 0, 0.005, 0.05)
  // The tube's guard: two chromed side bars, the clear tube between, the scale behind.
  for (const s of [-1, 1]) k.box(g, 0.006, 0.17, 0.012, m.chrome, s * 0.02, 0.12, 0.055)
  k.box(g, 0.046, 0.014, 0.03, m.chrome, 0, 0.205, 0.055)
  put(g, lathe(e, 'fmTube', [[0, 0], [0.008, 0], [0.011, 0.15], [0, 0.15]], 16), t.clear, 0, 0.042, 0.055)
  face(e, g, 0.016, 0.14, m.flowScale, 0, 0.115, 0.045)
  k.sphere(g, 0.0055, m.chrome, 0, 0.09, 0.055)
  put(g, lathe(e, 'fmKnob', [[0, 0], [0.014, 0], [0.016, 0.006], [0.016, 0.018], [0.012, 0.022], [0, 0.022]], 20), m.green, 0, 0.212, 0.055)
  for (let i = 0; i < 10; i++) k.box(g, 0.002, 0.016, 0.003, m.green, Math.cos((i / 10) * PI * 2) * 0.0158, 0.223, 0.055 + Math.sin((i / 10) * PI * 2) * 0.0158, false)
  // The humidifier bottle under the outlet.
  put(g, lathe(e, 'humCap2', [[0, 0], [0.034, 0], [0.034, 0.022], [0.012, 0.026], [0, 0.026]], 20), t.shell, 0, -0.072, 0.05)
  put(g, lathe(e, 'humBottle2', [[0, -0.12], [0.03, -0.12], [0.033, -0.11], [0.033, 0], [0, 0]], 20), t.clear, 0, -0.072, 0.05)
  put(g, lathe(e, 'humWater2', [[0, -0.117], [0.03, -0.117], [0.03, -0.05], [0, -0.05]], 18), t.saline, 0, -0.072, 0.05)
  k.cyl(g, 0.002, 0.002, 0.1, t.clear, 0, -0.12, 0.05, 6)
  rod(e, g, 0.004, 0.03, t.shell, 0.04, -0.06, 0.05, 'x', 8)
  if (!mask) return
  // Tubing from the humidifier's nipple, sagging, to the mask on its hook.
  const [mx, my] = mask
  const dx = mx - x
  const dy = my - y
  put(g, tube(e, `o2line${dx.toFixed(2)}|${dy.toFixed(2)}`, [[0.055, -0.065, 0.05], [0.07, -0.25, 0.08], [dx * 0.5, dy - 0.35, 0.1], [dx, dy - 0.08, 0.06]], 0.0035), m.tubing, 0, 0, 0)
  const mk = group(g, dx, dy - 0.05, 0.05)
  put(mk, lathe(e, 'mask2', [[0, 0], [0.012, 0.0], [0.03, 0.01], [0.045, 0.035], [0.05, 0.062], [0.047, 0.07], [0.04, 0.085], [0.015, 0.1]], 20), m.mask).rotation.x = PI / 2 + 0.2
  put(mk, geo(e, 'maskStrap', () => new TorusGeometry(0.07, 0.002, 4, 24)), m.tubing, 0, 0.02, -0.01).rotation.y = PI / 2
  k.cyl(mk, 0.006, 0.006, 0.05, m.chrome, 0, 0.06, -0.03, 8).rotation.x = PI / 2
}

/**
 * Wall suction in the vacuum outlet at (x, y): the regulator with its gauge and knob, the tubing
 * to a collection canister in its bracket on the rail, and on to the Yankauer sucker hooked beside it.
 */
export function suction(e: Ctx, p: Object3D, x: number, y: number, canX: number) {
  const { k, m } = e
  const g = group(p, x, y + 0.005, 0.03)
  k.cyl(g, 0.012, 0.012, 0.05, m.chrome, 0, 0, 0, 12).rotation.x = PI / 2
  k.soft(g, 0.07, 0.1, 0.05, 0.012, m.whitePlastic, 0, -0.02, 0.05)
  put(g, lathe(e, 'vacBezel', [[0, 0], [0.03, 0], [0.032, 0.012], [0, 0.012]], 20), m.chrome, 0, 0.0, 0.076).rotation.x = PI / 2
  face(e, g, 0.05, 0.05, m.vacuumGauge, 0, 0.0, 0.089)
  k.cyl(g, 0.012, 0.012, 0.03, m.black, 0, -0.06, 0.08, 12).rotation.x = PI / 2
  const dx = canX - x
  const can = group(p, canX, y - 0.3, 0.09)
  k.box(can, 0.1, 0.06, 0.03, m.stainless, 0, 0.12, -0.045)
  k.cyl(can, 0.065, 0.06, 0.22, m.clearPlastic, 0, 0.0, 0, 22)
  k.cyl(can, 0.062, 0.057, 0.08, m.water, 0, -0.07, 0, 22)
  k.cyl(can, 0.07, 0.07, 0.025, m.blue, 0, 0.12, 0, 22)
  put(p, tube(e, `vacline${dx.toFixed(2)}`, [[x, y - 0.07, 0.11], [x + dx * 0.3, y - 0.2, 0.15], [canX - 0.02, y - 0.12, 0.1]], 0.004), m.clearPlastic)
  put(p, tube(e, `yankline${dx.toFixed(2)}`, [[canX + 0.03, y - 0.17, 0.1], [canX + 0.1, y - 0.55, 0.16], [canX + 0.16, y - 0.2, 0.08]], 0.004), m.clearPlastic)
  put(p, bentTube(e, 'yankauer', [[0, 0, 0], [0, -0.18, 0], [0.02, -0.25, 0.01]], 0.006, 0.05), m.clearPlastic, canX + 0.16, y - 0.12, 0.07)
}

/**
 * A patient monitor, w wide: a moulded case (front bezel and a deeper rear housing with its
 * cooling slots), the screen recessed in its bezel, the alarm light bar across the top, the carry
 * handle moulded into the top, the rotary encoder and hard keys under the screen; front +z,
 * centred on the origin.
 */
export function patientMonitor(e: Ctx, p: Object3D, screen: Material, w = 0.38, shell: Material = e.m.charcoal) {
  const { k, m } = e
  const t = itemMats(e)
  const h = w * 0.8
  // The rear housing, narrower and rounded, behind the front bezel.
  put(p, panel(e, w * 0.86, h * 0.84, 0.08, 0.04), shell, 0, -0.005, -0.055)
  for (let i = 0; i < 6; i++) k.box(p, w * 0.5, 0.004, 0.004, t.graphite, 0, -h * 0.25 + i * 0.022, -0.096, false)
  put(p, panel(e, w, h, 0.032, 0.018, [[w - 0.05, h - 0.1, -0.008, 0.012, 0.006]]), shell, 0, 0, -0.012)
  face(e, p, w - 0.05, h - 0.1, screen, -0.008, 0.012, -0.008)
  k.box(p, w - 0.04, h - 0.09, 0.003, t.glossBlack, -0.008, 0.012, -0.0105, false)
  // The alarm light bar and the moulded carry handle along the top.
  k.box(p, w * 0.42, 0.01, 0.012, m.alarmBar, 0, h / 2 - 0.004, -0.004, false)
  put(p, extrude(e, `monGrip${w.toFixed(2)}`, [[-w * 0.32, 0], [w * 0.32, 0], [w * 0.28, 0.035], [-w * 0.28, 0.035]], 0.03, 0.008), shell, 0, h / 2 - 0.004, -0.05)
  // Hard keys and the encoder knob along the foot of the bezel.
  for (let i = 0; i < 5; i++) put(p, panel(e, 0.026, 0.012, 0.005, 0.004), i === 0 ? m.red : t.shellGrey, -w / 2 + 0.05 + i * 0.034, -h / 2 + 0.024, 0.006)
  put(p, lathe(e, 'monKnob2', [[0, 0], [0.019, 0], [0.02, 0.006], [0.018, 0.014], [0, 0.016]], 20), t.shellGrey, w / 2 - 0.035, -h / 2 + 0.026, 0.004).rotation.x = PI / 2
}

/** A wall arm for a monitor: wall plate, two arm links and their joints, the tilting head; returns the head. */
function monitorArm(e: Ctx, p: Object3D, x: number, y: number, reach: number, swing: number) {
  const { k, m } = e
  k.soft(p, 0.11, 0.24, 0.03, 0.01, m.greyPlastic, x, y, 0.015)
  const joint = lathe(e, 'armJoint', [[0, -0.03], [0.028, -0.03], [0.03, 0], [0.028, 0.03], [0, 0.03]], 18)
  const a = group(p, x, y, 0.05, swing)
  put(a, joint, m.greyPlastic)
  k.soft(a, 0.05, 0.045, reach, 0.018, m.greyPlastic, 0, 0, reach / 2)
  const b = group(a, 0, 0, reach, -swing * 1.6)
  put(b, joint, m.greyPlastic)
  k.soft(b, 0.05, 0.045, reach * 0.8, 0.018, m.greyPlastic, 0, 0, (reach * 0.8) / 2)
  const head = group(b, 0, 0, reach * 0.8 + 0.06, swing * 0.6)
  put(head, joint, m.greyPlastic, 0, 0, -0.04)
  return head
}

/**
 * A bay's headwall, against the wall at z = 0 (the bay at +z, x along the wall, y from the floor):
 * the crash rail; the bed-head trunking with its reading and uplight lenses, the terminal units
 * (O₂, air, vacuum; in resus a second O₂ and vacuum), raw and UPS (red) power, data and nurse call;
 * the flowmeter with its humidifier and mask, wall suction with its canister and sucker; the
 * patient monitor on its arm; gloves, sharps, alcohol rub, the diagnostic set.
 */
export function headwall(e: Ctx, p: Object3D, monitor: Material, resus: boolean) {
  const { k, m } = e
  k.soft(p, 2.4, 0.16, 0.03, 0.012, m.greyPlastic, 0, 0.78, 0.015)
  k.soft(p, 2.3, 0.26, 0.085, 0.02, m.whitePlastic, 0, 1.42, 0.0425)
  k.box(p, 2.24, 0.008, 0.04, m.ledLine, 0, 1.553, 0.04, false)
  k.box(p, 0.5, 0.006, 0.03, m.ledLine, 0.0, 1.288, 0.06, false)
  for (const x of [-0.55, 0.25]) k.box(p, 0.004, 0.25, 0.004, m.reveal, x, 1.42, 0.086, false)
  const z = 0.086
  outlet(e, p, 'o2', -0.98, 1.44, z)
  outlet(e, p, 'air', -0.87, 1.44, z)
  outlet(e, p, 'vac', -0.76, 1.44, z)
  if (resus) {
    outlet(e, p, 'o2', -0.65, 1.44, z)
    outlet(e, p, 'vac', -0.65 + 0.11, 1.44, z)
  }
  for (let i = 0; i < 5; i++) {
    const x = 0.36 + i * 0.12
    k.soft(p, 0.09, 0.09, 0.012, 0.006, i < 2 ? m.red : m.whitePlastic, x, 1.44, z + 0.004)
    for (const dx of [-0.018, 0.018]) k.box(p, 0.007, 0.015, 0.004, m.black, x + dx, 1.45, z + 0.011, false)
    k.box(p, 0.02, 0.012, 0.004, m.greyPlastic, x, 1.475, z + 0.011, false)
  }
  k.soft(p, 0.09, 0.09, 0.012, 0.006, m.greyPlastic, 1.0, 1.44, z + 0.004)
  rod(e, p, 0.02, 0.012, m.red, 1.0, 1.44, z + 0.012, 'z', 14)
  // The equipment rail along under the trunking, and what hangs on it.
  k.box(p, 1.2, 0.025, 0.01, m.stainless, -0.65, 1.17, 0.03)
  for (const x of [-1.2, -0.1]) k.box(p, 0.02, 0.04, 0.03, m.stainless, x, 1.17, 0.015)
  flowmeter(e, p, -0.98, 1.44, [-1.2, 1.12])
  suction(e, p, -0.76, 1.44, -0.48)
  // The patient monitor, swung towards the bed.
  const head = monitorArm(e, p, 0.78, 2.0, 0.22, -0.35)
  patientMonitor(e, head, monitor)
  // Gloves in a wire holder, the sharps bin, alcohol rub; the diagnostic set.
  put(p, bentTube(e, 'gloveRack', [[-0.14, 0.0, 0.0], [-0.14, 0.0, 0.14], [0.14, 0.0, 0.14], [0.14, 0.0, 0.0]], 0.003, 0.01), m.stainless, 1.3, 1.14, 0)
  for (const [i, mat] of [m.purple, m.blue, m.whitePlastic].entries()) {
    k.box(p, 0.25, 0.115, 0.12, mat, 1.3, 1.2 + i * 0.125, 0.065)
    put(p, panel(e, 0.11, 0.035, 0.003, 0.015), m.black, 1.3, 1.2 + i * 0.125 + 0.01, 0.127)
  }
  k.soft(p, 0.22, 0.28, 0.15, 0.02, m.sharps, 1.3, 0.92, 0.08)
  k.soft(p, 0.23, 0.05, 0.16, 0.015, m.red, 1.3, 1.08, 0.08)
  k.soft(p, 0.11, 0.24, 0.1, 0.02, m.whitePlastic, -1.34, 1.26, 0.05)
  k.box(p, 0.03, 0.02, 0.03, m.greyPlastic, -1.34, 1.13, 0.09)
  face(e, p, 0.07, 0.08, m.paper, -1.34, 1.3, 0.101)
  k.soft(p, 0.34, 0.15, 0.07, 0.02, m.whitePlastic, -0.25, 1.85, 0.035)
  for (const dx of [-0.1, 0.1]) {
    put(p, lathe(e, 'otoscope', [[0, 0], [0.017, 0], [0.017, 0.15], [0.02, 0.16], [0.012, 0.2], [0, 0.2]], 14), m.black, -0.25 + dx, 1.86, 0.09)
    put(p, tube(e, `lead${dx}`, [[-0.25 + dx, 1.86, 0.09], [-0.25 + dx + 0.02, 1.7, 0.1], [-0.25, 1.62, 0.095], [-0.25 - dx * 0.3, 1.74, 0.075]], 0.003), m.charcoal)
  }
}

/** A terminal-unit panel on a wall (triage): oxygen and vacuum in a white housing, the flowmeter, suction. */
export function gasPanel(e: Ctx, p: Object3D) {
  const { k } = e
  k.soft(p, 0.36, 0.16, 0.06, 0.015, e.m.whitePlastic, 0, 1.44, 0.03)
  outlet(e, p, 'o2', -0.09, 1.44, 0.061)
  outlet(e, p, 'vac', 0.09, 1.44, 0.061)
  flowmeter(e, p, -0.09, 1.44, [-0.3, 1.2])
  suction(e, p, 0.09, 1.44, 0.3)
}

/* ---------- on stands and carts ---------- */

/** A vital-signs monitor on its rolling stand: basket, the cuff hose coiled on its hook, the SpO₂ lead. */
export function vitalsStand(e: Ctx, p: Object3D, screen: Material) {
  const { k, m } = e
  starBase(e, p, 0.28, 0.09, m.greyPlastic, 0.028)
  put(p, lathe(e, 'vitalsPole', [[0, 0.1], [0.02, 0.1], [0.02, 1.08], [0.024, 1.1], [0, 1.1]], 14), m.aluminium)
  put(p, bentTube(e, 'vitalsBasket', [[-0.11, 0.0, 0.0], [-0.11, 0.0, 0.16], [0.11, 0.0, 0.16], [0.11, 0.0, 0.0]], 0.004, 0.02), m.stainless, 0, 0.8, 0.03)
  k.box(p, 0.22, 0.006, 0.16, m.stainless, 0, 0.73, 0.11)
  k.box(p, 0.15, 0.04, 0.1, m.blue, 0, 0.76, 0.1)
  const head = group(p, 0, 1.24, 0.02)
  head.rotation.x = -0.15
  patientMonitor(e, head, screen, 0.28, m.whitePlastic)
  put(p, geo(e, 'hoseCoil', () => new TorusGeometry(0.06, 0.006, 6, 24)), m.charcoal, 0.0, 0.98, 0.05).rotation.y = PI / 2
  put(p, tube(e, 'spo2', [[0.12, 1.15, 0.02], [0.18, 0.95, 0.06], [0.1, 0.84, 0.12]], 0.003), m.charcoal)
}

/**
 * An IV stand: a five-leg cast base on twin-wheel castors, the lower chromed tube with its height
 * collar and tightening knob, the telescopic upper tube, the four ram's-horn hooks on their boss;
 * the infusion bag on a hook; with `pump`, the volumetric infusion pump on its pole clamp, the line
 * running through it.
 */
export function ivStand(e: Ctx, p: Object3D, pump = true) {
  const { k, m } = e
  const t = itemMats(e)
  starBase(e, p, 0.3, 0.08, m.stainless, 0.028)
  put(p, lathe(e, 'ivPoleLow', [[0, 0.1], [0.0145, 0.1], [0.0145, 1.3], [0, 1.3]], 16), m.chrome)
  put(p, lathe(e, 'ivCollar', [[0.014, 1.28], [0.024, 1.28], [0.026, 1.3], [0.026, 1.35], [0.02, 1.36], [0.011, 1.36]], 18), t.graphite)
  rod(e, p, 0.006, 0.05, t.graphite, 0.04, 1.33, 0, 'x', 10)
  put(p, lathe(e, 'ivKnob', [[0, 0], [0.016, 0], [0.016, 0.012], [0, 0.012]], 14), t.graphite, 0.068, 1.33, 0).rotation.z = -PI / 2
  put(p, lathe(e, 'ivPoleHigh', [[0, 1.36], [0.011, 1.36], [0.011, 2.03], [0, 2.03]], 14), m.chrome)
  put(p, lathe(e, 'ivBoss', [[0, 2.0], [0.02, 2.0], [0.022, 2.03], [0.012, 2.06], [0, 2.065]], 16), m.chrome)
  for (let i = 0; i < 4; i++) {
    const h = put(p, bentTube(e, 'ramshorn2', [[0, 0, 0], [0.06, 0.005, 0], [0.085, 0.03, 0], [0.08, 0.06, 0], [0.065, 0.07, 0]], 0.0045, 0.02), m.chrome, 0, 2.025, 0)
    h.rotation.y = (i / 4) * PI * 2 + 0.4
    put(p, lathe(e, 'hookTip', [[0, 0], [0.0065, 0], [0.0065, 0.006], [0, 0.008]], 10), m.chrome, Math.cos(-((i / 4) * PI * 2 + 0.4)) * 0.065, 2.095, Math.sin(-((i / 4) * PI * 2 + 0.4)) * 0.065)
  }
  infusionBag(e, p, 0.075, 1.86, -0.03, pump ? 0.36 : 1.1)
  if (!pump) return
  // The pump: a moulded case on its pole clamp, display, keypad, the door over the line.
  const pu = group(p, 0, 1.3, 0.075)
  put(pu, panel(e, 0.18, 0.24, 0.12, 0.02), t.shell, 0, 0, 0)
  face(e, pu, 0.1, 0.055, e.m.board, -0.03, 0.065, 0.061)
  k.box(pu, 0.104, 0.059, 0.002, t.glossBlack, -0.03, 0.065, 0.0605, false)
  for (let i = 0; i < 9; i++) put(pu, panel(e, 0.022, 0.014, 0.004, 0.003), i === 8 ? m.green : i === 6 ? m.red : t.shellGrey, -0.06 + (i % 3) * 0.03, -0.005 - Math.floor(i / 3) * 0.024, 0.061)
  put(pu, panel(e, 0.045, 0.2, 0.012, 0.01), t.shellGrey, 0.058, 0, 0.062)
  k.box(pu, 0.004, 0.16, 0.004, t.clear, 0.058, 0, 0.07, false)
  put(pu, panel(e, 0.06, 0.06, 0.05, 0.006), t.graphite, 0, 0, -0.085)
  put(pu, lathe(e, 'clampScrew', [[0, 0], [0.012, 0], [0.012, 0.025], [0, 0.025]], 12), t.graphite, 0, 0, -0.14).rotation.x = PI / 2
  put(p, hose(e, 'ivline3', [[0.055, 1.44, -0.03], [0.065, 1.42, 0.06], [0.058, 1.4, 0.13]], 0.0018, 6), t.clear)
  put(p, hose(e, 'ivline4', [[0.058, 1.2, 0.13], [0.09, 0.9, 0.2], [0.25, 0.75, 0.42], [0.35, 0.78, 0.55]], 0.0018, 6), t.clear)
}

/** A mobile LED examination light: five-star base, pole, gooseneck, the lamp head with its handle. */
export function examLight(e: Ctx, p: Object3D, reach = 0.5) {
  const { k, m } = e
  starBase(e, p, 0.28, 0.08, m.whitePlastic, 0.028)
  put(p, lathe(e, 'lightPole', [[0, 0.1], [0.016, 0.1], [0.016, 1.05], [0, 1.05]], 12), m.aluminium)
  put(p, tube(e, `gooseneck${reach}`, [[0, 1.05, 0], [0, 1.35, 0.05], [0, 1.55, reach * 0.5], [0, 1.45, reach]], 0.011), m.charcoal)
  const head = group(p, 0, 1.43, reach + 0.03)
  head.rotation.x = 0.9
  put(head, lathe(e, 'lampHead', [[0, 0], [0.07, 0], [0.085, 0.03], [0.08, 0.06], [0.03, 0.07], [0, 0.07]], 28), m.whitePlastic)
  k.cyl(head, 0.065, 0.065, 0.004, m.ledPanel, 0, -0.002, 0, 24)
  k.cyl(head, 0.01, 0.01, 0.08, m.greyPlastic, 0.09, 0.03, 0, 10).rotation.z = PI / 2
}

/**
 * A 12-lead ECG machine on its cart: the cart's five-star base and column, the tray with its
 * bumper rail and the storage basket; the recorder (a moulded case with a tilting colour screen, a
 * full keyboard, the thermal paper roll in its bay with a strip coming out); the patient cable on
 * its arm with the ten lead wires and their clips coiled; the electrode basket.
 */
export function ecgCart(e: Ctx, p: Object3D, screen: Material) {
  const { k, m } = e
  const t = itemMats(e)
  starBase(e, p, 0.28, 0.08, t.shellGrey, 0.035)
  put(p, lathe(e, 'ecgPole2', [[0, 0.1], [0.028, 0.1], [0.028, 0.86], [0, 0.86]], 18), m.aluminium)
  put(p, panel(e, 0.46, 0.38, 0.03, 0.03), t.shellGrey, 0, 0.88, 0).rotation.x = PI / 2
  put(p, bentTube(e, 'ecgRim', [[-0.22, 0.9, -0.18], [-0.22, 0.95, -0.18], [0.22, 0.95, -0.18], [0.22, 0.9, -0.18]], 0.008, 0.02), t.shellGrey)
  // The recorder.
  put(p, extrude(e, 'ecgBody', [[-0.15, 0], [0.15, 0], [0.15, 0.04], [-0.12, 0.075], [-0.15, 0.075]], 0.36, 0.008), t.shell, 0, 0.895, 0.0).rotation.y = -PI / 2
  const kb = face(e, p, 0.3, 0.13, t.printed('ecgKeys', 256, 112, (c, w, h) => {
    c.fillStyle = '#e9e9e4'
    c.fillRect(0, 0, w, h)
    for (let r = 0; r < 4; r++) for (let q = 0; q < 12; q++) {
      c.fillStyle = r === 0 && q > 8 ? '#2e9b4f' : '#cfd2d4'
      c.fillRect(q * w / 12 + 2, r * h / 4 + 2, w / 12 - 4, h / 4 - 4)
    }
  }), 0.0, 0.952, 0.06)
  kb.rotation.x = -PI / 2 + Math.atan2(0.035, 0.27)
  const s = group(p, 0, 0.97, -0.07)
  s.rotation.x = -0.75
  put(s, panel(e, 0.28, 0.2, 0.025, 0.012), t.shell, 0, 0.1, 0)
  face(e, s, 0.25, 0.16, screen, 0, 0.1, 0.0128)
  // The paper bay at the back, a strip of trace curling out.
  put(p, lathe(e, 'ecgRoll', [[0.01, -0.105], [0.03, -0.105], [0.03, 0.105], [0.01, 0.105]], 18), m.paper, 0, 0.94, -0.16).rotation.z = PI / 2
  put(p, drapeStrip(e), m.paper, 0, 0.97, -0.17)
  // The cable arm and the patient cable with its lead wires and clips.
  put(p, bentTube(e, 'ecgArm', [[0.22, 0.88, 0], [0.3, 0.9, 0], [0.3, 1.25, 0]], 0.009, 0.04), t.shellGrey)
  // The trunk cable hangs from the arm in a loose loop to the lead-wire block.
  put(p, hose(e, 'ecgTrunk2', [[0.3, 1.24, 0], [0.33, 1.15, 0.03], [0.36, 1.02, 0.02], [0.34, 1.08, -0.03], [0.32, 1.02, 0.04]], 0.0045, 8), t.graphite)
  put(p, panel(e, 0.05, 0.07, 0.025, 0.008), t.shellGrey, 0.32, 1.0, 0.04)
  const colours = [t.caps.red, t.caps.gold, t.caps.green, t.graphite, t.shell, t.caps.red, t.caps.gold, t.caps.green, t.caps.lavender, t.caps.blue]
  colours.forEach((c, i) => {
    const a = (i / colours.length) * PI * 2
    put(p, hose(e, `ecgLead${i}`, [[0.32, 1.0, 0.04], [0.32 + Math.cos(a) * 0.05, 0.92, 0.04 + Math.sin(a) * 0.05], [0.31 + Math.cos(a) * 0.04, 0.85 - (i % 3) * 0.04, 0.05 + Math.sin(a) * 0.04]], 0.0018, 5), t.graphite)
    put(p, panel(e, 0.012, 0.03, 0.01, 0.004), c, 0.31 + Math.cos(a) * 0.04, 0.83 - (i % 3) * 0.04, 0.05 + Math.sin(a) * 0.04)
  })
  // The basket under the tray with electrodes and gel.
  put(p, bentTube(e, 'ecgBasket', [[-0.16, 0, -0.1], [-0.16, 0, 0.1], [0.16, 0, 0.1], [0.16, 0, -0.1], [-0.16, 0, -0.1]], 0.004, 0.01), m.stainless, 0, 0.6, 0)
  k.box(p, 0.32, 0.004, 0.2, m.stainless, 0, 0.55, 0)
  k.box(p, 0.12, 0.05, 0.08, m.paper, -0.06, 0.58, 0.02)
  put(p, lathe(e, 'gelBottle', [[0, 0], [0.025, 0], [0.025, 0.12], [0.01, 0.14], [0.004, 0.16], [0, 0.16]], 14), m.blue, 0.08, 0.552, 0.0)
}

/** A strip of ECG trace paper curling out of the recorder. */
function drapeStrip(e: Ctx) {
  return hose(e, 'ecgStrip', [[-0.0, 0, 0], [0, 0.01, -0.04], [0, -0.03, -0.08], [0, -0.09, -0.08]], 0.001, 2)
}

/**
 * A portable (cart-based) ultrasound system: the cart's four castors (fronts braked) under a
 * moulded base with its storage bay and printer, the column, the control console with its push
 * handle, alphanumeric keys, TGC slide pots, the trackball in its ring and the rotary gain knobs;
 * the 21" monitor on its articulating arm; three transducers (linear, convex, phased array) in
 * their holders with their cables, and a gel bottle in its warmer cup.
 */
export function ultrasound(e: Ctx, p: Object3D) {
  const { k, m } = e
  const t = itemMats(e)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * 0.22, sz * 0.27, 0.055, sx * 0.3, sz > 0)
  put(p, panel(e, 0.52, 0.64, 0.16, 0.05), t.shell, 0, 0.21, 0).rotation.x = PI / 2
  put(p, panel(e, 0.3, 0.22, 0.2, 0.03), t.shellGrey, 0, 0.36, -0.06)
  k.box(p, 0.24, 0.06, 0.004, t.graphite, 0, 0.38, 0.042, false)
  put(p, extrude(e, 'usColumn', [[-0.14, 0], [0.14, 0], [0.11, 0.42], [-0.11, 0.42]], 0.2, 0.02), t.shell, 0, 0.45, -0.12)
  // The console: tilted toward the user, the handle bar along its front.
  const c = group(p, 0, 0.9, 0.04)
  c.rotation.x = 0.12
  put(c, panel(e, 0.58, 0.44, 0.07, 0.04), t.shell, 0, 0, 0).rotation.x = PI / 2
  face(e, c, 0.5, 0.36, t.printed('usConsole', 512, 380, (g, w, h) => {
    g.fillStyle = '#d7dadc'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#4a5058'
    g.fillRect(w * 0.04, h * 0.05, w * 0.92, h * 0.28)
    for (let r = 0; r < 3; r++) for (let q = 0; q < 12; q++) {
      g.fillStyle = '#e9ebec'
      g.fillRect(w * (0.06 + q * 0.075), h * (0.08 + r * 0.085), w * 0.06, h * 0.065)
    }
    for (let i = 0; i < 8; i++) {
      g.fillStyle = '#2b2e33'
      g.fillRect(w * (0.06 + i * 0.035), h * 0.42, w * 0.008, h * 0.22)
      g.fillStyle = '#f2f2ef'
      g.fillRect(w * (0.05 + i * 0.035), h * (0.48 + (i % 3) * 0.04), w * 0.028, h * 0.025)
    }
    for (let i = 0; i < 6; i++) {
      g.fillStyle = ['#2e9b4f', '#1f6fd1', '#f2f2ef', '#f2f2ef', '#c8161d', '#f2f2ef'][i]
      g.fillRect(w * (0.68 + (i % 3) * 0.09), h * (0.42 + Math.floor(i / 3) * 0.1), w * 0.07, h * 0.07)
    }
  }), 0, 0.036, 0.0).rotation.x = -PI / 2
  put(c, geo(e, 'tbRing', () => new TorusGeometry(0.035, 0.008, 8, 24)), t.graphite, 0.05, 0.04, 0.08).rotation.x = PI / 2
  k.sphere(c, 0.026, t.matteBlack, 0.05, 0.042, 0.08)
  for (const x of [-0.13, 0.2]) put(c, lathe(e, 'usKnob', [[0, 0], [0.018, 0], [0.018, 0.018], [0.014, 0.022], [0, 0.022]], 18), t.graphite, x, 0.036, 0.09)
  put(c, bentTube(e, 'usHandle', [[-0.27, 0, 0.18], [-0.27, 0.02, 0.26], [0.27, 0.02, 0.26], [0.27, 0, 0.18]], 0.013, 0.04), t.shellGrey)
  // The monitor on its arm.
  put(p, bentTube(e, 'usArm2', [[0, 0.97, -0.17], [0, 1.08, -0.2], [0, 1.12, -0.16]], 0.022, 0.04), t.shellGrey)
  const s = group(p, 0, 1.36, -0.15)
  s.rotation.x = -0.1
  put(s, panel(e, 0.52, 0.34, 0.03, 0.012), t.matteBlack, 0, 0, 0)
  put(s, panel(e, 0.4, 0.24, 0.04, 0.03), t.shell, 0, 0, -0.03)
  face(e, s, 0.5, 0.31, t.lit('usImage', 512, 320, (g, w, h) => {
    g.fillStyle = '#050505'
    g.fillRect(0, 0, w, h)
    g.save()
    g.beginPath()
    g.moveTo(w * 0.5, h * 0.1)
    g.arc(w * 0.5, h * 0.1, h * 0.85, PI * 0.3, PI * 0.7)
    g.closePath()
    g.clip()
    const r = (n: number) => (Math.sin(n * 12.9898) * 43758.5453) % 1
    for (let i = 0; i < 2600; i++) {
      const v = 60 + Math.abs(r(i)) * 160
      g.fillStyle = `rgba(${v},${v},${v},${0.25 + Math.abs(r(i + 7)) * 0.5})`
      g.fillRect(w * Math.abs(r(i * 3)), h * Math.abs(r(i * 5)), 3, 2)
    }
    g.fillStyle = '#000'
    g.beginPath()
    g.ellipse(w * 0.5, h * 0.55, w * 0.08, h * 0.12, 0.3, 0, PI * 2)
    g.fill()
    g.restore()
    g.fillStyle = '#d8d8d8'
    g.font = `600 ${h * 0.04}px Helvetica`
    g.fillText('C5-1  ABD  12 cm  Gn 54', w * 0.02, h * 0.05)
  }, 0.9), 0, 0, 0.0155)
  // Transducers in their holders on both sides of the console, cables to the connectors.
  for (const [x, kind] of [[-0.31, 'convex'], [0.31, 'linear'], [0.36, 'phased']] as const) {
    const hx = group(p, x, 0.9, 0.05)
    put(hx, panel(e, 0.06, 0.09, 0.07, 0.012), t.shellGrey, 0, -0.03, 0)
    const pr = group(hx, 0, 0.0, 0)
    put(pr, lathe(e, `probe_${kind}`, kind === 'convex' ? [[0, 0], [0.012, 0], [0.024, 0.06], [0.03, 0.1], [0.026, 0.12], [0, 0.125]] : kind === 'linear' ? [[0, 0], [0.012, 0], [0.016, 0.08], [0.022, 0.115], [0, 0.12]] : [[0, 0], [0.012, 0], [0.015, 0.09], [0.014, 0.11], [0, 0.112]], 16), t.shell).rotation.x = PI
    put(p, hose(e, `usCable_${kind}`, [[x, 0.9, 0.05], [x * 1.05, 0.6, 0.18], [x * 0.7, 0.42, 0.26], [x * 0.4, 0.35, 0.2]], 0.0045, 6), t.graphite)
  }
  put(p, lathe(e, 'gelWarmer', [[0, 0], [0.04, 0], [0.04, 0.07], [0, 0.07]], 18), t.shellGrey, -0.24, 0.88, -0.1)
  put(p, lathe(e, 'gelBottle2', [[0, 0], [0.03, 0], [0.03, 0.12], [0.012, 0.15], [0.004, 0.17], [0, 0.17]], 16), t.caps.blue, -0.24, 0.92, -0.1)
  void m
}


/**
 * A computer on wheels: a five-star base on castors, the gas-spring column, the battery and PC box
 * on it, the work surface with its keyboard tray and mouse, the monitor on its tilting mount, the
 * push handle round the work surface.
 */
export function computerOnWheels(e: Ctx, p: Object3D, screen: Material) {
  const { k, m } = e
  const t = itemMats(e)
  starBase(e, p, 0.3, 0.08, t.shellGrey, 0.035)
  put(p, lathe(e, 'cowPole2', [[0, 0.1], [0.04, 0.1], [0.04, 0.6], [0.032, 0.62], [0.032, 1.0], [0, 1.0]], 18), m.aluminium)
  put(p, panel(e, 0.3, 0.24, 0.18, 0.02), t.shellGrey, 0, 0.32, 0)
  k.box(p, 0.08, 0.02, 0.004, m.green, 0.08, 0.4, 0.091, false)
  cpuTower(e, p, -0.1, 0.44, 0, PI / 2)
  put(p, panel(e, 0.6, 0.46, 0.035, 0.03), t.shell, 0, 1.02, 0.04).rotation.x = PI / 2
  put(p, bentTube(e, 'cowHandle2', [[-0.3, 1.02, 0.18], [-0.3, 1.05, 0.29], [0.3, 1.05, 0.29], [0.3, 1.02, 0.18]], 0.012, 0.03), t.shellGrey)
  keyboard(e, p, 0, 1.04, 0.13)
  mouse(e, p, 0.25, 1.04, 0.14)
  monitor24(e, p, screen, 0, 1.04, -0.12)
}

/** A ventilator on its stand: the unit, its touch screen, and the blue breathing circuit looped on the arm. */
export function ventilator(e: Ctx, p: Object3D, screen: Material) {
  const { k, m } = e
  starBase(e, p, 0.32, 0.09, m.greyPlastic, 0.03)
  put(p, lathe(e, 'ventPole', [[0, 0.1], [0.028, 0.1], [0.028, 0.9], [0, 0.9]], 14), m.aluminium)
  k.soft(p, 0.36, 0.3, 0.3, 0.035, m.whitePlastic, 0, 1.06, 0)
  const s = group(p, 0, 1.36, 0.06)
  s.rotation.x = -0.3
  patientMonitor(e, s, screen, 0.3, m.whitePlastic)
  put(p, tube(e, 'ventCircuit', [[0.12, 1.0, 0.15], [0.3, 1.2, 0.3], [0.42, 1.55, 0.1], [0.32, 1.65, -0.1], [0.2, 1.3, -0.05]], 0.011), m.blue)
  put(p, bentTube(e, 'ventArm', [[0.15, 1.1, -0.1], [0.32, 1.6, -0.1], [0.4, 1.62, 0.0]], 0.008, 0.06), m.stainless)
}

/* ---------- the installation ---------- */

/**
 * The zone valve box on a wall (its face at z = 0, centred at x, y): a steel box behind a clear
 * lid, a ball valve with its lever and line gauge for each gas, the warning panel over them; and
 * the three copper drops from the ceiling into its top, clipped to the wall and labelled.
 */
export function zoneValves(e: Ctx, p: Object3D, x: number, y: number, ceiling: number) {
  const { k, m } = e
  const g = group(p, x, y, 0)
  k.soft(g, 0.56, 0.5, 0.12, 0.012, m.whitePlastic, 0, 0, 0.06)
  face(e, g, 0.52, 0.2, m.zvsu, 0, 0.13, 0.121)
  const gas: [Material, Material][] = [[m.whitePlastic, m.lineGauge], [m.black, m.lineGauge], [m.vacuum, m.vacuumGauge]]
  gas.forEach(([lever, dial], i) => {
    const vx = -0.17 + i * 0.17
    k.cyl(g, 0.016, 0.016, 0.22, m.copper, vx, -0.09, 0.07, 12)
    k.box(g, 0.05, 0.05, 0.05, m.brass, vx, -0.1, 0.07)
    k.box(g, 0.1, 0.014, 0.012, lever, vx + 0.04, -0.1, 0.1)
    put(g, lathe(e, 'zvGauge', [[0, 0], [0.026, 0], [0.028, 0.01], [0, 0.012]], 20), m.chrome, vx, -0.01, 0.08).rotation.x = PI / 2
    face(e, g, 0.044, 0.044, dial, vx, -0.01, 0.093)
  })
  k.box(g, 0.53, 0.26, 0.006, m.glass, 0, -0.09, 0.122, false)
  k.box(g, 0.08, 0.03, 0.02, m.red, 0.2, -0.24, 0.125)
  // The drops: copper, from the ceiling into the box's top, on saddle clips, each labelled.
  const labels = [m.labelO2, m.labelAir, m.labelVac]
  const len = ceiling - (y + 0.25)
  labels.forEach((label, i) => {
    const px = x - 0.17 + i * 0.17
    k.cyl(p, 0.011, 0.011, len, m.copper, px, y + 0.25 + len / 2, 0.035, 12)
    for (let cy = y + 0.45; cy < ceiling - 0.1; cy += 0.45) k.box(p, 0.03, 0.02, 0.05, m.stainless, px, cy, 0.025)
    const l = face(e, p, 0.18, 0.024, label, px, y + 0.7, 0.047)
    l.rotation.z = PI / 2
    put(p, lathe(e, 'escutcheon', [[0.011, 0], [0.03, 0], [0.03, 0.006], [0.011, 0.006]], 16), m.chrome, px, ceiling - 0.006, 0.035, false)
  })
}

/** The medical gas area alarm panel, its face at z = 0 centred at (x, y). */
export function gasAlarm(e: Ctx, p: Object3D, x: number, y: number) {
  const g = group(p, x, y, 0)
  e.k.soft(g, 0.26, 0.2, 0.05, 0.01, e.m.greyPlastic, 0, 0, 0.025)
  face(e, g, 0.24, 0.18, e.m.alarm, 0, 0, 0.051)
}

/**
 * A ceiling service pendant, as fitted over a resuscitation bed: the ceiling mount and its
 * canopy, a jointed arm, and the service column with gas terminal units, power sockets and two
 * equipment shelves, a monitor on the top one; hung from the ceiling at y = ceiling.
 */
export function servicePendant(e: Ctx, p: Object3D, ceiling: number, monitor: Material) {
  const { k, m } = e
  put(p, lathe(e, 'pendantCanopy', [[0, 0], [0.22, 0], [0.22, -0.05], [0.14, -0.09], [0, -0.09]], 32), m.whitePlastic, 0, ceiling, 0)
  k.cyl(p, 0.08, 0.08, 0.25, m.whitePlastic, 0, ceiling - 0.2, 0, 24)
  const arm = group(p, 0, ceiling - 0.36, 0, 0.5)
  k.soft(arm, 0.14, 0.12, 0.8, 0.04, m.whitePlastic, 0, 0, 0.36)
  const col = group(arm, 0, 0, 0.76, -0.5)
  k.soft(col, 0.26, 1.15, 0.26, 0.05, m.whitePlastic, 0, -0.62, 0)
  k.box(col, 0.2, 1.0, 0.004, m.reveal, 0, -0.62, 0.131, false)
  const outs: Gas[] = ['o2', 'o2', 'air', 'vac', 'vac']
  outs.forEach((gas, i) => outlet(e, col, gas, -0.05 + (i % 2) * 0.1, -0.25 - Math.floor(i / 2) * 0.1, 0.132))
  for (let i = 0; i < 4; i++) k.soft(col, 0.08, 0.08, 0.01, 0.005, i < 2 ? m.red : m.whitePlastic, -0.05 + (i % 2) * 0.1, -0.62 - Math.floor(i / 2) * 0.1, 0.135)
  for (const y of [-0.95, -1.22]) {
    k.soft(col, 0.5, 0.025, 0.36, 0.01, m.whitePlastic, 0, y, 0.2)
    k.box(col, 0.03, 0.025, 0.36, m.aluminium, 0, y - 0.025, 0.2)
  }
  const mon = group(col, 0, -0.78, 0.2)
  patientMonitor(e, mon, monitor, 0.34)
  flowmeter(e, col, -0.05, -0.25, null)
}

/** An oxygen mask set waiting on a hook: the mask, its reservoir bag and the coiled tubing. */
export function maskSet(e: Ctx, p: Object3D, x: number, y: number, z: number) {
  const { k, m } = e
  k.box(p, 0.02, 0.04, 0.04, m.stainless, x, y, z + 0.02)
  put(p, lathe(e, 'mask', [[0, 0], [0.03, 0.005], [0.045, 0.03], [0.05, 0.06], [0.04, 0.085], [0.015, 0.1]], 20), m.mask, x, y - 0.12, z + 0.06).rotation.x = PI / 2 + 0.2
  put(p, pillow(e, 0.09, 0.08, 0.14), m.mask, x, y - 0.26, z + 0.05)
  put(p, geo(e, 'maskCoil', () => new TorusGeometry(0.07, 0.004, 6, 28)), m.tubing, x, y - 0.1, z + 0.035).rotation.y = PI / 2
}
