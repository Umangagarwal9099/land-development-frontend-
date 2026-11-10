import { CatmullRomCurve3, Group, Mesh, MeshStandardMaterial, TorusGeometry, Vector3, type Material, type Object3D } from 'three'
import { PI } from '../../../kit'
import { click } from '../../../basement/sound'
import { castor, drape, geo, group, lathe, panel, put, rod, tube } from '../../erKit'
import { outlet } from '../../erEquipment'
import { patientMonitor } from '../../erEquipment'
import { instrumentTray, kidneyTray, gauzePacks } from '../../opd/equipment/items'
import { tapSensor } from '../../opd/equipment/sanitary'
import type { OpdCtx } from '../../opd/ctx'
import { kitMats } from '../kit'

/*
 * The operation theatres' equipment, built after the products such theatres are fitted with: an
 * electro-hydraulic operating table (column table with a radiolucent four-section top, after the
 * Maquet / Trumpf class), ceiling LED surgical lights on spring arms, an anaesthesia workstation
 * (trolley, flowmeters, vaporisers, bellows, absorber, its screen and the breathing circuit in
 * corrugated tube), ceiling service pendants, instrument tables and Mayo stands under sterile
 * drapes, scrub troughs with sensor taps, the surgeon's control panel, a laparoscopy tower and a
 * mobile C-arm. Each in its own frame, front towards +z, on y = 0.
 */

const cache = new WeakMap<object, ReturnType<typeof make>>()
function make(e: OpdCtx) {
  const std = (color: string, roughness: number, metalness = 0) => new MeshStandardMaterial({ color, roughness, metalness })
  return {
    steel: std('#c8cdd0', 0.28, 0.85),
    brushed: std('#b7bcbf', 0.4, 0.75),
    pad: std('#1d2226', 0.55),
    drape: std('#3f78a8', 0.85),
    drapeGreen: std('#3e7f6a', 0.85),
    body: std('#eef0ee', 0.35),
    grey: std('#8e9599', 0.45),
    dark: std('#2c3135', 0.5),
    glass: new MeshStandardMaterial({ color: '#cfe3ea', roughness: 0.05, transparent: true, opacity: 0.35 }),
    lens: e.lighting.glow(new MeshStandardMaterial({ color: '#ffffff', emissive: '#f4f8ff', emissiveIntensity: 1.6, roughness: 0.3 }), 1),
    lensOff: std('#d9dde0', 0.25, 0.2),
    sevo: std('#e6c21a', 0.4),
    iso: std('#7b4aa0', 0.4),
    soda: std('#b7a1d6', 0.7),
    o2Cyl: std('#1b1c1e', 0.45, 0.3),
    o2Top: std('#f2f2f0', 0.4),
    n2oCyl: std('#2d5fa8', 0.4, 0.3),
    bag: std('#2b2b2b', 0.7),
  }
}
export function otMats(e: OpdCtx) {
  let c = cache.get(e.o)
  if (!c) cache.set(e.o, (c = make(e)))
  return c
}

/** A corrugated breathing tube along `pts`: the hose and its ribs. */
export function corrugated(e: OpdCtx, p: Object3D, key: string, pts: [number, number, number][], mat: Material, r = 0.011) {
  put(p, tube(e, `corr${key}`, pts, r * 0.9), mat)
  const curve = new CatmullRomCurve3(pts.map((q) => new Vector3(...q)))
  const rib = geo(e, `rib${r}`, () => new TorusGeometry(r, r * 0.22, 6, 12))
  const n = Math.max(6, Math.round(curve.getLength() / 0.018))
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const at = curve.getPointAt(t)
    const tan = curve.getTangentAt(t)
    const m = new Mesh(rib, mat)
    m.position.copy(at)
    m.lookAt(at.clone().add(tan))
    p.add(m)
  }
}

/* ---------- the operating table ---------- */

/**
 * An electro-hydraulic operating table along local z, head at −z: the floor-locking base with its
 * stainless cover, the telescopic column, the radiolucent top in head, back, seat and leg sections
 * on stainless side rails, black pressure-care pads, two padded arm boards, the remote on its hook.
 * Orthopaedic: the leg plates removed and the traction extension with its two boots fitted.
 */
export function operatingTable(e: OpdCtx, p: Object3D, o: { ortho?: boolean; draped?: boolean } = {}) {
  const { k } = e
  const c = otMats(e)
  // Base and its floor locks.
  k.soft(p, 0.62, 0.12, 1.05, 0.04, c.brushed, 0, 0.07, 0.15)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.cyl(p, 0.045, 0.05, 0.03, c.dark, sx * 0.24, 0.015, 0.15 + sz * 0.42, 16)
  // The column: stepped telescopic covers.
  k.soft(p, 0.4, 0.42, 0.34, 0.05, c.brushed, 0, 0.34, 0.15)
  k.soft(p, 0.34, 0.26, 0.28, 0.04, c.steel, 0, 0.65, 0.15)
  k.box(p, 0.56, 0.06, 0.5, c.steel, 0, 0.8, 0.15)
  const top = 0.86
  // The top's frame and side rails, sections and pads.
  const sections: [number, number, string][] = [[-1.02, -0.72, 'head'], [-0.7, -0.08, 'back'], [-0.06, 0.42, 'seat'], [0.44, 1.02, 'leg']]
  for (const [z0, z1, name] of sections) {
    if (o.ortho && name === 'leg') continue
    const w = name === 'head' ? 0.3 : 0.52
    k.box(p, w - 0.04, 0.03, z1 - z0, c.grey, 0, top, (z0 + z1) / 2)
    k.soft(p, w, 0.07, z1 - z0 - 0.01, 0.03, c.pad, 0, top + 0.05, (z0 + z1) / 2)
    if (name !== 'head') for (const s of [-1, 1]) k.box(p, 0.012, 0.03, z1 - z0 - 0.02, c.steel, s * 0.285, top - 0.005, (z0 + z1) / 2)
  }
  // Arm boards at the back section's foot, swung out square.
  for (const s of [-1, 1]) {
    const a = group(p, s * 0.3, top + 0.02, -0.25)
    k.box(a, 0.05, 0.03, 0.06, c.steel, s * 0.02, 0, 0)
    k.soft(a, 0.66, 0.05, 0.16, 0.025, c.pad, s * 0.38, 0.03, 0)
  }
  if (o.ortho) {
    // The traction extension: two bars from the seat, the boots on their spars, the perineal post.
    for (const s of [-1, 1]) {
      put(p, tube(e, `orthoBar${s}`, [[s * 0.08, top, 0.42], [s * 0.22, top - 0.05, 0.9], [s * 0.38, top - 0.08, 1.45]], 0.02), c.steel)
      k.soft(p, 0.12, 0.28, 0.22, 0.04, c.dark, s * 0.38, top + 0.05, 1.45)
      k.cyl(p, 0.02, 0.02, 0.5, c.steel, s * 0.38, top - 0.3, 1.5, 12)
    }
    k.cyl(p, 0.05, 0.05, 0.3, c.pad, 0, top + 0.18, 0.4, 16)
  }
  // The anaesthesia screen frame at the head, the remote on its hook.
  put(p, tube(e, 'anaesScreen', [[-0.32, top, -0.72], [-0.32, top + 0.75, -0.72], [0.32, top + 0.75, -0.72], [0.32, top, -0.72]], 0.01), c.steel)
  const r = group(p, 0.31, top - 0.18, 0.2)
  k.soft(r, 0.07, 0.2, 0.035, 0.015, c.body, 0, 0, 0)
  for (let i = 0; i < 6; i++) k.box(r, 0.022, 0.016, 0.004, c.grey, (i % 2 - 0.5) * 0.028, 0.06 - Math.floor(i / 2) * 0.03, 0.018, false)
  if (o.draped) put(p, drape(e, 'otDrape', 0.7, 1.9, 0.25, 0.1, 5), c.drape, 0, top + 0.09, 0.05)
}

/* ---------- surgical lights and pendants ---------- */

/**
 * Ceiling-mounted LED surgical lights from one central axis at the ceiling: canopy, axis tube,
 * spring arms, yokes and dome lightheads with their LED fields and sterile handles. `heads` gives
 * each head's arm turn and its reach. Returns the lit faces (kept whole, see live_) for switching.
 */
export function surgicalLights(e: OpdCtx, p: Object3D, ceiling: number, heads: [number, number, number][]) {
  const { k } = e
  const c = otMats(e)
  put(p, lathe(e, 'slCanopy', [[0, 0], [0.24, 0], [0.24, -0.06], [0.12, -0.1], [0, -0.1]], 32), c.body, 0, ceiling, 0)
  k.cyl(p, 0.05, 0.05, 0.5, c.body, 0, ceiling - 0.35, 0, 20)
  const lit: Mesh[] = []
  heads.forEach(([turn, reach, drop], i) => {
    const arm = group(p, 0, ceiling - 0.55 - i * 0.12, 0, turn)
    k.cyl(arm, 0.06, 0.06, 0.08, c.body, 0, 0, 0, 20)
    k.soft(arm, 0.08, 0.07, reach, 0.03, c.body, 0, 0, reach / 2)
    // The spring arm, down to the yoke.
    const sp = group(arm, 0, 0, reach)
    k.cyl(sp, 0.04, 0.04, 0.06, c.body, 0, 0, 0, 16)
    put(sp, tube(e, `slSpring${drop}`, [[0, 0, 0], [0, -drop * 0.5, 0.15], [0, -drop, 0.18]], 0.03), c.body)
    // The yoke and the dome.
    const head = group(sp, 0, -drop - 0.12, 0.18)
    head.rotation.x = 0.35
    put(head, tube(e, 'slYoke', [[-0.36, -0.05, 0], [-0.36, 0.1, 0], [0.36, 0.1, 0], [0.36, -0.05, 0]], 0.018), c.body)
    put(head, lathe(e, 'slDome', [[0, 0.1], [0.12, 0.09], [0.3, 0.04], [0.34, -0.02], [0.33, -0.05], [0, -0.05]], 40), c.body)
    // The LED field: a ring of modules round the centre, kept whole so it can switch.
    const holder = new Group()
    holder.name = `live_otlight_${e.ids++}`
    head.add(holder)
    const field = put(holder, lathe(e, 'slField', [[0.04, 0], [0.3, 0], [0.3, 0.004], [0.04, 0.004]], 40), c.lens, 0, -0.056, 0, false)
    field.rotation.x = PI
    lit.push(field as Mesh)
    for (let j = 0; j < 12; j++) {
      const a = (j / 12) * PI * 2
      k.cyl(head, 0.035, 0.035, 0.01, c.grey, Math.cos(a) * 0.2, -0.058, Math.sin(a) * 0.2, 16)
    }
    // The sterile handle in the middle.
    put(head, lathe(e, 'slHandle', [[0, 0], [0.03, 0], [0.028, -0.12], [0.035, -0.14], [0, -0.15]], 16), c.dark, 0, -0.05, 0)
  })
  return lit
}

/**
 * A ceiling service pendant: canopy, a twin arm out to `reach`, the column with its gas outlets,
 * sockets and two shelves; the anaesthesia pendant carries the patient monitor on its top shelf.
 */
export function otPendant(e: OpdCtx, p: Object3D, ceiling: number, reach: number, turn: number, monitor?: Material) {
  const { k, m } = e
  const c = otMats(e)
  put(p, lathe(e, 'pdCanopy', [[0, 0], [0.2, 0], [0.2, -0.05], [0.1, -0.08], [0, -0.08]], 28), c.body, 0, ceiling, 0)
  k.cyl(p, 0.07, 0.07, 0.3, c.body, 0, ceiling - 0.22, 0, 20)
  const arm = group(p, 0, ceiling - 0.42, 0, turn)
  k.soft(arm, 0.16, 0.12, reach, 0.04, c.body, 0, 0, reach / 2)
  const col = group(arm, 0, 0, reach, -turn)
  k.cyl(col, 0.09, 0.09, 0.14, c.body, 0, -0.07, 0, 20)
  k.soft(col, 0.32, 1.2, 0.3, 0.05, c.body, 0, -0.78, 0)
  k.box(col, 0.26, 1.05, 0.004, m.reveal, 0, -0.78, 0.151, false)
  const gases = ['o2', 'o2', 'air', 'vac', 'vac'] as const
  gases.forEach((g, i) => outlet(e, col, g, -0.08 + (i % 3) * 0.08, -0.32 - Math.floor(i / 3) * 0.1, 0.152))
  for (let i = 0; i < 6; i++) k.soft(col, 0.07, 0.07, 0.01, 0.004, i < 3 ? m.red : m.whitePlastic, -0.08 + (i % 3) * 0.08, -0.62 - Math.floor(i / 3) * 0.09, 0.155)
  for (const y of [-1.0, -1.32]) {
    k.soft(col, 0.56, 0.025, 0.42, 0.01, c.body, 0, y, 0.22)
    k.box(col, 0.6, 0.025, 0.03, c.steel, 0, y, 0.44)
  }
  if (monitor) {
    const mo = group(col, 0, -0.985, 0.22)
    patientMonitor(e, mo, monitor, 0.4)
  }
  return col
}

/* ---------- anaesthesia ---------- */

/**
 * An anaesthesia workstation: the trolley with its worktop and three drawers on castors, the
 * flowmeter bank and the vaporisers on their rail, the ventilator's bellows in its clear housing,
 * the CO₂ absorber, the screen on its arm, the breathing circuit in corrugated tube to the Y-piece
 * and the reservoir bag, O₂ and N₂O reserve cylinders on the back.
 */
export function anaesthesiaMachine(e: OpdCtx, p: Object3D, screen: Material) {
  const { k, m } = e
  const c = otMats(e)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * 0.32, sz * 0.25, 0.06, 0, sz > 0)
  k.soft(p, 0.78, 0.7, 0.6, 0.04, c.body, 0, 0.47, 0)
  for (let i = 0; i < 3; i++) {
    k.box(p, 0.7, 0.18, 0.02, c.body, 0, 0.3 + i * 0.2, 0.305)
    k.box(p, 0.18, 0.02, 0.02, c.grey, 0, 0.36 + i * 0.2, 0.32)
  }
  k.soft(p, 0.84, 0.04, 0.64, 0.015, c.grey, 0, 0.84, 0.02)
  // The upper tower: flowmeters, vaporisers, the control panel.
  k.soft(p, 0.62, 0.62, 0.3, 0.03, c.body, 0, 1.17, -0.12)
  for (let i = 0; i < 3; i++) {
    k.box(p, 0.04, 0.3, 0.02, c.glass, -0.22 + i * 0.06, 1.25, 0.035, false)
    k.cyl(p, 0.007, 0.007, 0.012, [m.green, m.blue, c.dark][i], -0.22 + i * 0.06, 1.18 + i * 0.05, 0.035, 8)
    k.cyl(p, 0.018, 0.018, 0.03, [m.green, m.blue, c.dark][i], -0.22 + i * 0.06, 1.05, 0.05, 16).rotation.x = PI / 2
  }
  for (const [x, mat] of [[0.08, c.sevo], [0.24, c.iso]] as const) {
    k.soft(p, 0.12, 0.26, 0.16, 0.02, mat, x, 1.08, 0.1)
    k.cyl(p, 0.035, 0.035, 0.02, c.grey, x, 1.22, 0.1, 20)
  }
  k.box(p, 0.5, 0.02, 0.06, c.steel, 0.16, 0.94, 0.1)
  // The screen on its arm.
  const s = group(p, -0.05, 1.62, -0.05)
  s.rotation.x = -0.15
  patientMonitor(e, s, screen, 0.42, c.dark)
  // The bellows in its clear housing at the side, the absorber canister below it.
  k.cyl(p, 0.1, 0.1, 0.3, c.glass, -0.47, 1.05, 0.05, 24)
  put(p, lathe(e, 'bellows', Array.from({ length: 11 }, (_, i): [number, number] => [i % 2 ? 0.075 : 0.085, i * 0.024]), 24), c.dark, -0.47, 0.92, 0.05)
  k.cyl(p, 0.09, 0.09, 0.26, c.glass, -0.47, 0.62, 0.05, 24)
  k.cyl(p, 0.082, 0.082, 0.22, c.soda, -0.47, 0.62, 0.05, 24)
  // The breathing circuit: inspiratory and expiratory limbs to the Y-piece; the bag on its port.
  corrugated(e, p, 'insp', [[-0.45, 0.95, 0.2], [-0.4, 1.1, 0.5], [-0.15, 1.15, 0.85], [0.05, 1.05, 1.05]], m.blue)
  corrugated(e, p, 'exp', [[-0.52, 0.95, 0.2], [-0.5, 1.05, 0.55], [-0.2, 1.05, 0.9], [0.05, 1.03, 1.06]], m.blue)
  k.cyl(p, 0.015, 0.015, 0.06, m.clearPlastic, 0.06, 1.04, 1.08, 12)
  put(p, lathe(e, 'resBag', [[0, 0], [0.03, 0.01], [0.075, 0.08], [0.08, 0.15], [0.06, 0.22], [0.02, 0.26], [0, 0.27]], 20), c.bag, -0.55, 0.62, 0.3)
  // Reserve cylinders on the back: oxygen (black, white shoulder) and nitrous oxide (blue).
  for (const [x, body, top] of [[-0.18, c.o2Cyl, c.o2Top], [0.18, c.n2oCyl, c.n2oCyl]] as const) {
    k.cyl(p, 0.055, 0.055, 0.6, body, x, 0.62, -0.36, 20)
    k.cyl(p, 0.05, 0.055, 0.08, top, x, 0.96, -0.36, 20)
    k.cyl(p, 0.015, 0.015, 0.06, c.steel, x, 1.03, -0.36, 10)
  }
}

/* ---------- tables, stands, trolleys ---------- */

/** A stainless instrument table on castors, `w` × `d`, under its sterile drape with instrument sets laid out. */
export function instrumentTable(e: OpdCtx, p: Object3D, w = 1.2, d = 0.6, sets = 2, seed = 1) {
  const { k } = e
  const c = otMats(e)
  const h = 0.9
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    k.cyl(p, 0.015, 0.015, h - 0.1, c.steel, sx * (w / 2 - 0.04), (h - 0.1) / 2 + 0.08, sz * (d / 2 - 0.04), 10)
    castor(e, p, sx * (w / 2 - 0.04), sz * (d / 2 - 0.04), 0.04)
  }
  k.box(p, w - 0.06, 0.012, d - 0.06, c.steel, 0, 0.3, 0)
  k.box(p, w, 0.02, d, c.steel, 0, h - 0.01, 0)
  put(p, drape(e, `itDrape${w}${d}`, w + 0.02, d + 0.02, 0.32, 0.05, seed), c.drapeGreen, 0, h + 0.002, 0)
  for (let i = 0; i < sets; i++) instrumentTray(e, p, -w / 2 + (i + 0.5) * (w / sets), h + 0.01, -0.05, 0, seed + i)
  kidneyTray(e, p, w / 2 - 0.15, h + 0.01, d / 2 - 0.12)
  gauzePacks(e, p, -w / 2 + 0.15, h + 0.01, d / 2 - 0.12, 3)
}

/** A Mayo stand: a castored base, the single adjustable post and the tray reaching over the patient, draped. */
export function mayoStand(e: OpdCtx, p: Object3D, seed = 2) {
  const { k } = e
  const c = otMats(e)
  put(p, tube(e, 'mayoBase', [[-0.25, 0.08, -0.25], [0.25, 0.08, -0.25], [0, 0.08, 0.25], [-0.25, 0.08, -0.25]], 0.015), c.steel)
  for (const [x, z] of [[-0.25, -0.25], [0.25, -0.25], [0, 0.25]]) castor(e, p, x, z, 0.035)
  k.cyl(p, 0.022, 0.022, 0.95, c.steel, 0, 0.55, -0.25, 12)
  k.box(p, 0.03, 0.03, 0.4, c.steel, 0, 1.03, -0.05)
  k.box(p, 0.5, 0.012, 0.36, c.steel, 0, 1.05, 0.15)
  put(p, drape(e, 'mayoDrape', 0.52, 0.38, 0.2, 0.04, seed), c.drapeGreen, 0, 1.057, 0.15)
  instrumentTray(e, p, 0, 1.06, 0.15, 0, seed + 3)
}

/** A two-tier stainless trolley with a rail, its lower shelf stocked. */
export function steelTrolley(e: OpdCtx, p: Object3D, w = 0.8, d = 0.5) {
  const { k, m } = e
  const c = otMats(e)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    k.cyl(p, 0.013, 0.013, 0.82, c.steel, sx * (w / 2 - 0.03), 0.5, sz * (d / 2 - 0.03), 10)
    castor(e, p, sx * (w / 2 - 0.03), sz * (d / 2 - 0.03), 0.04)
  }
  for (const y of [0.3, 0.86]) k.box(p, w, 0.015, d, c.steel, 0, y, 0)
  rod(e, p, 0.011, w - 0.06, c.steel, 0, 0.98, -d / 2 + 0.03, 'x', 10)
  k.soft(p, 0.3, 0.1, 0.22, 0.02, m.paper, -0.15, 0.36, 0)
  k.soft(p, 0.22, 0.08, 0.18, 0.02, m.blue, 0.18, 0.35, 0.05)
}

/** A kick bucket: a stainless bowl in its ring on a castored stand. */
export function kickBucket(e: OpdCtx, p: Object3D) {
  const { k } = e
  const c = otMats(e)
  for (let i = 0; i < 4; i++) castor(e, p, Math.cos((i * PI) / 2) * 0.17, Math.sin((i * PI) / 2) * 0.17, 0.03)
  k.cyl(p, 0.17, 0.17, 0.015, c.steel, 0, 0.08, 0, 24)
  put(p, lathe(e, 'kickBowl', [[0, 0], [0.12, 0], [0.17, 0.2], [0.18, 0.22], [0.17, 0.22], [0.115, 0.012], [0, 0.012]], 28), c.steel, 0, 0.1, 0)
}

/** An electrosurgical unit on its cart: the generator with its display, the foot switch and leads. */
export function esu(e: OpdCtx, p: Object3D, screen: Material) {
  const { k, m } = e
  const c = otMats(e)
  steelTrolley(e, p, 0.55, 0.45)
  k.soft(p, 0.42, 0.16, 0.38, 0.02, c.body, 0, 0.95, 0)
  k.box(p, 0.16, 0.08, 0.004, screen, -0.08, 0.97, 0.191, false)
  for (let i = 0; i < 3; i++) k.cyl(p, 0.015, 0.015, 0.01, [m.blue, m.amber, m.blue][i], 0.08 + i * 0.05, 0.95, 0.19, 12).rotation.x = PI / 2
  k.soft(p, 0.22, 0.05, 0.15, 0.02, m.blue, 0.1, 0.025, 0.45)
  put(p, tube(e, 'esuLead', [[0.1, 0.05, 0.4], [0.15, 0.3, 0.3], [0.1, 0.9, 0.2]], 0.004), c.dark)
}

/** A suction machine: the twin canisters on a castored stand with the pump below and its tubing. */
export function suctionUnit(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const c = otMats(e)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * 0.17, sz * 0.15, 0.035)
  k.soft(p, 0.4, 0.3, 0.36, 0.03, c.body, 0, 0.28, 0)
  k.box(p, 0.12, 0.05, 0.004, c.dark, 0.08, 0.36, 0.181, false)
  for (const x of [-0.1, 0.1]) {
    k.cyl(p, 0.07, 0.07, 0.24, c.glass, x, 0.58, 0, 20)
    k.cyl(p, 0.065, 0.065, 0.08, m.amber, x, 0.5, 0, 20)
    k.cyl(p, 0.072, 0.072, 0.03, c.dark, x, 0.71, 0, 20)
  }
  put(p, tube(e, 'sucTube', [[0.1, 0.72, 0], [0.15, 0.9, 0.1], [0.05, 0.85, 0.3], [-0.1, 0.4, 0.3]], 0.006), m.clearPlastic)
}

/** A laparoscopy tower: the stack trolley with the camera unit, light source, insufflator and recorder, its monitor on top and the CO₂ cylinder. */
export function lapTower(e: OpdCtx, p: Object3D, screen: Material) {
  const { k, m } = e
  const c = otMats(e)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * 0.26, sz * 0.24, 0.05, 0, sz > 0)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(p, 0.04, 1.35, 0.04, c.body, sx * 0.29, 0.75, sz * 0.27)
  const units = ['Camera control unit', 'LED light source', 'Insufflator', 'Recorder']
  units.forEach((_, i) => {
    const y = 0.35 + i * 0.26
    k.box(p, 0.62, 0.02, 0.58, c.body, 0, y - 0.02, 0)
    k.soft(p, 0.5, 0.15, 0.42, 0.015, i === 1 ? c.body : c.dark, 0, y + 0.07, 0.04)
    k.box(p, 0.12, 0.06, 0.004, i === 2 ? m.monitors[3] : c.grey, -0.12, y + 0.08, 0.252, false)
    k.cyl(p, 0.02, 0.02, 0.01, m.blue, 0.15, y + 0.08, 0.252, 12).rotation.x = PI / 2
  })
  const mon = group(p, 0, 1.55, 0)
  k.soft(mon, 0.7, 0.44, 0.06, 0.01, c.dark, 0, 0.2, 0)
  k.box(mon, 0.66, 0.38, 0.004, screen, 0, 0.2, 0.031, false)
  k.box(p, 0.08, 0.12, 0.06, c.dark, 0, 1.5, -0.02)
  k.cyl(p, 0.07, 0.07, 0.7, c.o2Top, -0.36, 0.45, -0.2, 20)
  k.cyl(p, 0.06, 0.07, 0.08, c.grey, -0.36, 0.84, -0.2, 20)
  // The scope and light cable coiled on the top shelf.
  put(p, tube(e, 'lapCable', [[-0.2, 1.24, 0.1], [0.1, 1.27, 0.25], [0.2, 1.24, -0.1], [-0.1, 1.25, -0.2], [-0.2, 1.24, 0.1]], 0.007, true), c.dark)
}

/** A mobile C-arm: the base unit on castors with its column and swivel, the C with the X-ray tube and flat detector at its ends; its monitor cart beside. */
export function cArm(e: OpdCtx, p: Object3D, screen: Material) {
  const { k } = e
  const c = otMats(e)
  for (const [x, z] of [[-0.3, -0.5], [0.3, -0.5], [-0.3, 0.6], [0.3, 0.6]]) castor(e, p, x, z, 0.07)
  k.soft(p, 0.7, 0.95, 1.1, 0.06, c.body, 0, 0.58, 0)
  k.box(p, 0.5, 0.004, 0.3, c.grey, 0, 1.06, -0.2)
  k.soft(p, 0.26, 0.5, 0.26, 0.04, c.body, 0, 1.3, 0.35)
  k.soft(p, 0.2, 0.2, 0.6, 0.04, c.body, 0, 1.5, 0.75)
  // The C: a half ring, the tube housing below, the detector above.
  const ring = put(p, geo(e, 'carmC', () => new TorusGeometry(0.42, 0.05, 12, 40, PI)), c.body, 0, 1.15, 1.25)
  ring.rotation.set(0, PI / 2, PI / 2)
  k.soft(p, 0.28, 0.2, 0.28, 0.04, c.grey, 0, 0.72, 1.25)
  k.soft(p, 0.36, 0.1, 0.36, 0.03, c.body, 0, 1.58, 1.25)
  k.box(p, 0.32, 0.004, 0.32, c.dark, 0, 1.528, 1.25, false)
  // The monitor cart: two screens on a column.
  const cart = group(p, 1.0, 0, -0.2)
  for (const [x, z] of [[-0.25, -0.2], [0.25, -0.2], [-0.25, 0.2], [0.25, 0.2]]) castor(e, cart, x, z, 0.05)
  k.soft(cart, 0.6, 0.9, 0.5, 0.04, c.body, 0, 0.55, 0)
  k.cyl(cart, 0.05, 0.05, 0.5, c.body, 0, 1.25, 0, 16)
  for (const x of [-0.27, 0.27]) {
    k.soft(cart, 0.5, 0.36, 0.05, 0.01, c.dark, x, 1.6, 0.05)
    k.box(cart, 0.46, 0.32, 0.004, screen, x, 1.6, 0.077, false)
  }
}

/** A scrub trough for `n` surgeons: a stainless trough on wall brackets, splashback, sensor taps, brush and antiseptic dispensers, the clock over it. */
export function scrubTrough(e: OpdCtx, p: Object3D, n = 2) {
  const { k, m } = e
  const c = otMats(e)
  const w = 0.65 * n
  k.box(p, w, 0.6, 0.02, c.steel, 0, 1.25, 0.01)
  k.soft(p, w, 0.3, 0.55, 0.03, c.steel, 0, 0.72, 0.28)
  k.box(p, w - 0.06, 0.02, 0.48, c.brushed, 0, 0.86, 0.29, false)
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 0.325 + i * 0.65
    tapSensor(e, p, x, 1.0, 0.08)
    k.box(p, 0.1, 0.22, 0.08, m.whitePlastic, x + 0.2, 1.35, 0.06)
    k.box(p, 0.1, 0.14, 0.08, m.whitePlastic, x - 0.2, 1.3, 0.06)
  }
  for (const s of [-1, 1]) k.box(p, 0.03, 0.4, 0.4, c.steel, s * (w / 2 - 0.05), 0.4, 0.2)
}

/**
 * The surgeon's control panel on the wall at height 1.5: a glass touch panel with the clock, the
 * operation timer, temperature, humidity and pressure, and the lights' switch (a button_ that
 * switches the surgical lights `lights` on and off).
 */
export function surgeonPanel(e: OpdCtx, p: Object3D, lights: Mesh[]) {
  const { k } = e
  const c = otMats(e)
  k.box(p, 1.2, 0.62, 0.03, c.dark, 0, 1.55, 0.015)
  const screen = e.o.screen('otPanel', 768, 400, (g, w, h) => {
    g.fillStyle = '#05080b'
    g.fillRect(0, 0, w, h)
    const now = new Date()
    const cells: [string, string, string][] = [
      ['TIME', `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`, '#ffffff'],
      ['OP TIMER', '01:24:37', '#3ee07a'],
      ['ANAES TIMER', '01:41:02', '#3ee07a'],
      ['TEMP °C', '21.0', '#4fb3ff'],
      ['RH %', '52', '#4fb3ff'],
      ['PRESSURE Pa', '+15', '#ffb030'],
    ]
    cells.forEach(([label, v, col], i) => {
      const x = (i % 3) * (w / 3) + 20
      const y = Math.floor(i / 3) * (h / 2) + 40
      g.fillStyle = '#7d8a96'
      g.font = '600 26px Helvetica'
      g.fillText(label, x, y)
      g.fillStyle = col
      g.font = '700 70px Helvetica'
      g.fillText(v, x, y + 80)
    })
  }, 1.1)
  k.box(p, 1.14, 0.48, 0.002, screen, 0, 1.6, 0.031, false)
  const btn = new Group()
  btn.name = `button_otlights_${e.ids++}`
  btn.position.set(0.45, 1.31, 0.032)
  p.add(btn)
  k.soft(btn, 0.16, 0.07, 0.01, 0.01, c.grey, 0, 0, 0)
  btn.userData.label = 'Surgical Lights'
  btn.userData.verb = 'Switch'
  let on = true
  btn.userData.press = () => {
    on = !on
    for (const l of lights) l.material = on ? c.lens : c.lensOff
    click(btn.getWorldPosition(new Vector3()))
  }
}

/** A HEPA laminar-flow ceiling plenum over the table, `w` × `d`, its perforated face and its curtain edge. */
export function laminarPlenum(e: OpdCtx, p: Object3D, ceiling: number, w = 2.4, d = 2.8) {
  const { k, m } = e
  k.box(p, w, 0.06, d, m.whitePlastic, 0, ceiling - 0.03, 0)
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) k.box(p, w / 3 - 0.1, 0.004, d / 3 - 0.1, m.diffuser, -w / 3 + i * (w / 3), ceiling - 0.062, -d / 3 + j * (d / 3), false)
  for (const s of [-1, 1]) {
    k.box(p, 0.01, 0.25, d, m.clearPlastic, s * (w / 2), ceiling - 0.155, 0, false)
    k.box(p, w, 0.25, 0.01, m.clearPlastic, 0, ceiling - 0.155, s * (d / 2), false)
  }
}

/** Seamless wall panelling inside a theatre: HPL panels 1.2 m wide with their shadow joints, to the ceiling, on wall `p` (face at z = 0) along `len`. */
export function wallPanels(e: OpdCtx, p: Object3D, len: number, h: number) {
  const { k } = e
  const c = kitMats(e)
  const panelMat = otPanel(e)
  k.box(p, len, h, 0.012, panelMat, 0, h / 2, 0.006, false)
  for (let x = -len / 2 + 1.2; x < len / 2 - 0.1; x += 1.2) k.box(p, 0.004, h, 0.002, c.absGrey, x, h / 2, 0.0125, false)
}

const panelCache = new WeakMap<object, MeshStandardMaterial>()
function otPanel(e: OpdCtx) {
  let mat = panelCache.get(e.o)
  if (!mat) panelCache.set(e.o, (mat = new MeshStandardMaterial({ color: '#dfe9ec', roughness: 0.3 })))
  return mat
}

export { panel }
