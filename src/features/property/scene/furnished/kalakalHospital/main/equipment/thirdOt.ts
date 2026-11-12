import { CatmullRomCurve3, Group, Mesh, MeshStandardMaterial, TorusGeometry, Vector3, type Material, type Object3D } from 'three'
import { PI } from '../../../kit'
import { click } from '../../../basement/sound'
import { castor, drape, geo, group, lathe, panel, put, rod, tube } from '../../erKit'
import { instrumentTray, kidneyTray, gauzePacks } from '../../opd/equipment/items'
import { tapSensor } from '../../opd/equipment/sanitary'
import type { OpdCtx } from '../../opd/ctx'
import { kitMats } from '../kit'

/*
 * The operation theatres' smaller equipment, built after the products such theatres are fitted
 * with: instrument tables and Mayo stands under sterile drapes, kick buckets, the electrosurgical
 * unit, suction, a laparoscopy tower and a mobile C-arm, scrub troughs with sensor taps, the
 * surgeon's control panel, the laminar-flow plenum and the seamless wall panels. (The table, the
 * lights, the pendants and the anaesthesia workstation are in ./otKit.ts.) Each in its own frame,
 * front towards +z, on y = 0.
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
