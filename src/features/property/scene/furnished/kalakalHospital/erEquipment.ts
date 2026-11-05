import { TorusGeometry, type Material, type Object3D } from 'three'
import { PI } from '../kit'
import { bentTube, castor, face, geo, group, lathe, panel, pillow, put, rod, starBase, tube, type Ctx } from './erKit'
import { infusionBag } from './erFurniture'

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
 * An oxygen flowmeter in the outlet at (x, y): its probe, the chrome body, the clear tube on its
 * scale with the float, the green control knob; a humidifier bottle under it; and the green
 * tubing looped down to a mask hung on the rail beside.
 */
export function flowmeter(e: Ctx, p: Object3D, x: number, y: number, mask: [number, number] | null) {
  const { k, m } = e
  const g = group(p, x, y + 0.005, 0.03)
  k.cyl(g, 0.012, 0.012, 0.05, m.chrome, 0, 0, 0.0, 12).rotation.x = PI / 2
  k.soft(g, 0.05, 0.06, 0.04, 0.008, m.chrome, 0, 0.0, 0.045)
  k.cyl(g, 0.017, 0.017, 0.16, m.clearPlastic, 0, 0.11, 0.05, 14)
  face(e, g, 0.022, 0.15, m.flowScale, 0, 0.11, 0.068)
  k.sphere(g, 0.007, m.chrome, 0, 0.07, 0.05)
  k.cyl(g, 0.02, 0.02, 0.012, m.chrome, 0, 0.195, 0.05, 14)
  k.cyl(g, 0.016, 0.016, 0.025, m.green, 0, 0.215, 0.05, 14)
  // The humidifier, below, filled.
  k.cyl(g, 0.012, 0.012, 0.03, m.chrome, 0, -0.045, 0.045, 10)
  k.cyl(g, 0.034, 0.03, 0.12, m.clearPlastic, 0, -0.12, 0.045, 18)
  k.cyl(g, 0.03, 0.027, 0.08, m.water, 0, -0.14, 0.045, 18)
  k.cyl(g, 0.036, 0.036, 0.02, m.whitePlastic, 0, -0.055, 0.045, 18)
  if (!mask) return
  // Tubing from the humidifier's nipple, sagging, to the mask on its hook.
  const [mx, my] = mask
  const dx = mx - x
  const dy = my - y
  put(g, tube(e, `o2line${dx.toFixed(2)}|${dy.toFixed(2)}`, [[0.03, -0.09, 0.05], [0.06, -0.25, 0.08], [dx * 0.5, dy - 0.35, 0.1], [dx, dy - 0.08, 0.06]], 0.0035), m.tubing, 0, 0, 0)
  const mk = group(g, dx, dy - 0.05, 0.05)
  put(mk, lathe(e, 'mask', [[0, 0], [0.03, 0.005], [0.045, 0.03], [0.05, 0.06], [0.04, 0.085], [0.015, 0.1]], 20), m.mask).rotation.x = PI / 2 + 0.2
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
 * A patient monitor, w wide, in a charcoal case: the screen behind its bezel, the alarm light bar
 * across the top, the carry handle, the rotary knob; front towards +z, centred on the origin.
 */
export function patientMonitor(e: Ctx, p: Object3D, screen: Material, w = 0.38, shell: Material = e.m.charcoal) {
  const { k, m } = e
  const h = w * 0.8
  k.soft(p, w, h, 0.09, 0.02, shell, 0, 0, -0.045)
  put(p, panel(e, w + 0.004, h + 0.004, 0.012, 0.02, [[w - 0.06, h - 0.07, -0.01, -0.006]]), m.black, 0, 0, 0.004)
  face(e, p, w - 0.06, h - 0.07, screen, -0.01, -0.006, 0.0015)
  k.box(p, w * 0.5, 0.008, 0.006, m.alarmBar, 0, h / 2 - 0.012, 0.009, false)
  put(p, bentTube(e, `monHandle${w}`, [[-w * 0.3, h / 2, -0.05], [-w * 0.28, h / 2 + 0.04, -0.05], [w * 0.28, h / 2 + 0.04, -0.05], [w * 0.3, h / 2, -0.05]], 0.01, 0.02), shell)
  put(p, lathe(e, 'monKnob', [[0, 0], [0.018, 0], [0.018, 0.012], [0, 0.014]], 16), m.greyPlastic, w / 2 - 0.022, -h / 2 + 0.03, 0.01).rotation.x = PI / 2
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

/** An IV stand: five-star base, chrome pole with its height collar, four ram's-horn hooks, an infusion pump with its bag and line. */
export function ivStand(e: Ctx, p: Object3D, pump = true) {
  const { k, m } = e
  starBase(e, p, 0.3, 0.08, m.stainless, 0.028)
  put(p, lathe(e, 'ivPole', [[0, 0.1], [0.014, 0.1], [0.014, 1.3], [0.022, 1.3], [0.022, 1.36], [0.011, 1.36], [0.011, 2.05], [0, 2.05]], 14), m.chrome)
  for (let i = 0; i < 4; i++) {
    const h = put(p, bentTube(e, 'ramshorn', [[0, 0, 0], [0.07, 0.01, 0], [0.085, 0.05, 0], [0.07, 0.07, 0]], 0.004, 0.02), m.chrome, 0, 2.02, 0)
    h.rotation.y = (i / 4) * PI * 2 + 0.4
  }
  infusionBag(e, p, 0.08, 1.88, 0.0, pump ? 0.42 : 1.2)
  if (!pump) return
  const pu = group(p, 0, 1.3, 0.06)
  k.soft(pu, 0.17, 0.23, 0.12, 0.02, m.whitePlastic, 0, 0, 0)
  face(e, pu, 0.1, 0.055, e.m.board, -0.02, 0.06, 0.061)
  for (let i = 0; i < 6; i++) k.box(pu, 0.022, 0.014, 0.004, i === 5 ? m.green : m.greyPlastic, -0.05 + (i % 3) * 0.035, -0.02 - Math.floor(i / 3) * 0.025, 0.061, false)
  k.box(pu, 0.04, 0.16, 0.004, m.greyPlastic, 0.06, 0, 0.061, false)
  k.box(pu, 0.05, 0.05, 0.06, m.greyPlastic, 0, 0, -0.08)
  put(p, tube(e, 'ivline', [[0.08, 1.45, 0.0], [0.07, 1.4, 0.07], [0.06, 1.35, 0.12]], 0.002), m.tubing)
  put(p, tube(e, 'ivline2', [[0.06, 1.22, 0.12], [0.1, 0.9, 0.2], [0.3, 0.75, 0.45]], 0.002), m.tubing)
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

/** An ECG machine on its cart: the recorder with its tilted screen, keys and paper, the patient cable coiled on its arm. */
export function ecgCart(e: Ctx, p: Object3D, screen: Material) {
  const { k, m } = e
  starBase(e, p, 0.28, 0.08, m.greyPlastic, 0.035)
  put(p, lathe(e, 'ecgPole', [[0, 0.1], [0.025, 0.1], [0.025, 0.86], [0, 0.86]], 14), m.aluminium)
  k.soft(p, 0.44, 0.03, 0.36, 0.012, m.greyPlastic, 0, 0.88, 0)
  put(p, bentTube(e, 'ecgRim', [[-0.22, 0.9, -0.18], [-0.22, 0.95, -0.18], [0.22, 0.95, -0.18], [0.22, 0.9, -0.18]], 0.006, 0.02), m.greyPlastic)
  k.soft(p, 0.38, 0.08, 0.3, 0.02, m.whitePlastic, 0, 0.935, 0.01)
  const s = group(p, -0.06, 0.98, -0.05)
  s.rotation.x = -0.9
  k.soft(s, 0.22, 0.16, 0.025, 0.01, m.whitePlastic, 0, 0.08, 0)
  face(e, s, 0.19, 0.12, screen, 0, 0.08, 0.013)
  for (let i = 0; i < 12; i++) k.box(p, 0.022, 0.006, 0.018, m.greyPlastic, -0.13 + (i % 6) * 0.03, 0.976, 0.09 + Math.floor(i / 6) * 0.026, false)
  k.box(p, 0.2, 0.004, 0.06, m.paper, 0.1, 0.978, -0.08, false)
  k.box(p, 0.1, 0.25, 0.012, m.greyPlastic, 0.26, 0.98, 0)
  put(p, tube(e, 'ecgCable', Array.from({ length: 22 }, (_, i): [number, number, number] => [0.27 + Math.cos(i * 0.9) * 0.05, 1.05 - i * 0.012, Math.sin(i * 0.9) * 0.05]), 0.004), m.charcoal)
  k.box(p, 0.3, 0.12, 0.25, m.greyPlastic, 0, 0.5, 0)
}

/** A portable ultrasound: the cart, the control panel with its trackball, the screen on its arm, probes in their holders. */
export function ultrasound(e: Ctx, p: Object3D) {
  const { k, m } = e
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * 0.22, sz * 0.25, 0.05, sx * 0.3, sz > 0)
  k.soft(p, 0.5, 0.18, 0.62, 0.05, m.whitePlastic, 0, 0.2, 0)
  k.soft(p, 0.24, 0.55, 0.2, 0.04, m.greyPlastic, 0, 0.56, -0.12)
  k.soft(p, 0.56, 0.07, 0.44, 0.03, m.whitePlastic, 0, 0.88, 0.04)
  k.box(p, 0.44, 0.008, 0.24, m.charcoal, 0, 0.917, 0.06)
  k.sphere(p, 0.022, m.black, 0, 0.925, 0.12)
  for (let i = 0; i < 10; i++) k.box(p, 0.03, 0.008, 0.02, m.greyPlastic, -0.18 + (i % 5) * 0.035, 0.925, -0.02 + Math.floor(i / 5) * 0.03, false)
  put(p, bentTube(e, 'usArm', [[0, 0.9, -0.14], [0, 1.02, -0.16]], 0.02), m.greyPlastic)
  const s = group(p, 0, 1.24, -0.16)
  s.rotation.x = -0.12
  patientMonitor(e, s, m.off, 0.48, m.whitePlastic)
  for (const x of [-0.25, 0.25]) {
    k.soft(p, 0.05, 0.08, 0.06, 0.01, m.greyPlastic, x * 1.08, 0.86, 0.18)
    put(p, lathe(e, 'probe', [[0, 0], [0.015, 0], [0.022, 0.05], [0.02, 0.1], [0.008, 0.12], [0, 0.12]], 14), m.whitePlastic, x * 1.08, 0.84, 0.18)
    put(p, tube(e, `probeCable${x}`, [[x * 1.08, 0.84, 0.18], [x * 1.1, 0.5, 0.26], [x * 0.6, 0.35, 0.3]], 0.004), m.charcoal)
  }
}


/** A computer on wheels: base and column, the tray with its keyboard, the screen, the battery box. */
export function computerOnWheels(e: Ctx, p: Object3D, screen: Material) {
  const { k, m } = e
  starBase(e, p, 0.3, 0.08, m.greyPlastic, 0.035)
  put(p, lathe(e, 'cowPole', [[0, 0.1], [0.035, 0.1], [0.035, 1.0], [0, 1.0]], 16), m.aluminium)
  k.soft(p, 0.3, 0.22, 0.2, 0.02, m.greyPlastic, 0, 0.3, 0)
  k.soft(p, 0.58, 0.04, 0.44, 0.015, m.whitePlastic, 0, 1.02, 0.04)
  k.box(p, 0.44, 0.016, 0.14, m.charcoal, 0, 1.048, 0.12)
  const s = group(p, 0, 1.32, -0.12)
  s.rotation.x = -0.08
  k.box(s, 0.54, 0.33, 0.022, m.black, 0, 0, 0)
  face(e, s, 0.52, 0.3, screen, 0, 0.008, 0.012)
  put(p, bentTube(e, 'cowHandle', [[-0.3, 1.02, 0.2], [-0.3, 1.06, 0.28], [0.3, 1.06, 0.28], [0.3, 1.02, 0.2]], 0.012, 0.03), m.greyPlastic)
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
