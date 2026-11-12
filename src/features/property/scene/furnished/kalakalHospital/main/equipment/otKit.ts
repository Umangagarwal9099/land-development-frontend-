import { Group, Mesh, MeshStandardMaterial, TorusGeometry, type Material, type Object3D } from 'three'
import { PI } from '../../../kit'
import { castor, cupboardDoor, drape, drawer, face, geo, group, lathe, put, tube } from '../../erKit'
import { outlet, patientMonitor } from '../../erEquipment'
import { instrumentTray, kidneyTray, gauzePacks } from '../../opd/equipment/items'
import type { OpdCtx } from '../../opd/ctx'
import { corrugated, otMats } from './thirdOt'

/*
 * The operation theatres' principal equipment, modelled on the hospital-grade products a modern
 * modular theatre is fitted with, at true size, each in its own frame (front towards +z, on y = 0):
 *
 *   operating table      a mobile-column table (Maquet / Getinge / Stryker class): floor-locking
 *                        stainless base, telescopic column under the tilt head, a radiolucent
 *                        carbon-fibre top in head, back, seat and split leg sections on stainless
 *                        accessory rails, 80 mm pressure-care pads, arm boards on rail clamps,
 *                        the anaesthesia screen, the wired hand control on the rail;
 *   surgical lights      LED lightheads of hexagonal lens cells round a sterile handle, on spring
 *                        arms and cardanic yokes from one ceiling axis; an arm with a 27″ surgical
 *                        display from the same axis;
 *   theatre pendants     two-link ceiling supply units: the anaesthesia pendant (O₂, N₂O, air,
 *                        vacuum, AGSS, the patient monitor, drawers) and the surgical pendant
 *                        (O₂, air, CO₂, vacuum, the electrosurgical generator on its shelf);
 *   anaesthesia station  the workstation at the patient's head: electronic gas mixing, two
 *                        vaporisers on their rail, compact breathing system with CO₂ absorber,
 *                        bag arm and APL valve, the ventilator's bellows, the main and gas-module
 *                        screens, pipeline hoses to the pendant, reserve cylinders on the back;
 *   fittings             a wall gas-outlet panel, recessed stainless storage with glass doors and
 *                        drawers, a pass box, low-level return-air grilles, a bowl stand, a swab
 *                        rack, a lead-apron rack, a PACS display.
 */

const cache = new WeakMap<object, ReturnType<typeof make>>()
function make(e: OpdCtx) {
  const std = (color: string, roughness: number, metalness = 0) => new MeshStandardMaterial({ color, roughness, metalness })
  const glow = (color: string, emissive: string, intensity = 1.4) => e.lighting.glow(new MeshStandardMaterial({ color, emissive, emissiveIntensity: intensity, roughness: 0.3 }), 1)
  return {
    /** Radiolucent carbon-fibre top plates. */
    carbon: std('#202326', 0.32, 0.25),
    /** Pressure-care pads: charcoal PU skin over visco-elastic foam, a slightly lighter welt. */
    pad: std('#2b3035', 0.62),
    padWelt: std('#3c4247', 0.55),
    gel: std('#2f5d8c', 0.35),
    /** Satin 304 stainless (cabinet fronts, frames), its brushed finish. */
    ss: std('#d6dadc', 0.34, 0.62),
    ssDark: std('#a9aeb1', 0.4, 0.6),
    /** The equipment's enamelled bodies: warm white, a light grey trim, the dark grey bezels. */
    enamel: std('#f1f2ef', 0.32),
    trim: std('#b9bec1', 0.4),
    bezel: std('#30353a', 0.45),
    /** Ceiling-unit covers: white powder-coated aluminium, the extrusions. */
    pendant: std('#eef0ee', 0.3, 0.1),
    extrusion: std('#c9cdcf', 0.35, 0.7),
    /** LED lens cells, lit, and off. */
    cell: glow('#ffffff', '#f6f9ff', 2.2),
    cellOff: std('#dfe3e6', 0.15, 0.3),
    reflector: std('#e9ecee', 0.12, 0.85),
    /** Gas plates: N₂O blue, AGSS magenta, CO₂ grey, as ISO 32 colours them. */
    n2o: std('#2a5ea8', 0.4),
    agss: std('#b0307f', 0.4),
    co2: std('#7d8487', 0.4),
    /** Sterile wraps (blue SMS), suture boxes, the vaporisers' liquids. */
    wrap: std('#4c86bb', 0.85),
    wrapGreen: std('#4f8f78', 0.85),
    sutures: std('#e7eef4', 0.5),
    sevo: std('#e8c21f', 0.4),
    iso: std('#7c4aa3', 0.4),
    soda: std('#c7b4e2', 0.75),
    flowGlass: new MeshStandardMaterial({ color: '#e6f2f6', roughness: 0.05, transparent: true, opacity: 0.4 }),
    lead: std('#36506b', 0.7),
    leadGrey: std('#5e6870', 0.7),
    green: std('#1f9d55', 0.45),
    yellowGreen: std('#b8c22a', 0.45),
  }
}
/** The theatres' finishes, made once per model. */
export function otKitMats(e: OpdCtx) {
  let c = cache.get(e.o)
  if (!c) cache.set(e.o, (c = make(e)))
  return c
}

/** A painted label: white type on a colour, `w` × `h`, at (x, y, z) facing +z. */
function label(e: OpdCtx, p: Object3D, key: string, text: string, bg: string, w: number, h: number, x: number, y: number, z: number, fg = '#ffffff') {
  const mat = e.o.sign(`otlab_${key}`, Math.max(64, Math.round(w * 1400)), Math.max(24, Math.round(h * 1400)), (g, ww, hh) => {
    g.fillStyle = bg
    g.fillRect(0, 0, ww, hh)
    g.fillStyle = fg
    g.font = `700 ${hh * 0.62}px Helvetica`
    g.textAlign = 'center'
    g.fillText(text, ww / 2, hh * 0.76)
  })
  return face(e, p, w, h, mat, x, y, z)
}

export type OtGas = 'o2' | 'air' | 'vac' | 'n2o' | 'agss' | 'co2'

/** A theatre gas terminal unit of any gas on a face at z = 0, with its gas-coloured name label under it. */
export function otOutlet(e: OpdCtx, p: Object3D, gas: OtGas, x: number, y: number, z = 0) {
  const { m } = e
  const c = otKitMats(e)
  if (gas === 'o2' || gas === 'air' || gas === 'vac') outlet(e, p, gas, x, y, z)
  else {
    const ring = gas === 'n2o' ? c.n2o : gas === 'agss' ? c.agss : c.co2
    e.k.box(p, 0.075, 0.075, 0.002, m.whitePlastic, x, y, z + 0.001, false)
    put(p, lathe(e, 'otOutletCollar', [[0, 0], [0.026, 0], [0.026, 0.012], [0.02, 0.02], [0, 0.02]], 24), ring, x, y + 0.005, z).rotation.x = PI / 2
    put(p, lathe(e, gas === 'agss' ? 'agssSocket' : 'otOutletSocket', gas === 'agss' ? [[0, 0], [0.016, 0], [0.016, 0.04], [0.012, 0.045], [0, 0.045]] : [[0, 0], [0.012, 0], [0.012, 0.026], [0.008, 0.03], [0, 0.03]], 18), m.chrome, x, y + 0.005, z).rotation.x = PI / 2
  }
  const [text, bg, fg] = ({ o2: ['O₂', '#ffffff', '#111111'], air: ['AIR', '#1a1a1a', '#ffffff'], vac: ['VAC', '#f2d21b', '#111111'], n2o: ['N₂O', '#2a5ea8', '#ffffff'], agss: ['AGSS', '#b0307f', '#ffffff'], co2: ['CO₂', '#7d8487', '#ffffff'] } as const)[gas]
  label(e, p, `gas_${gas}`, text, bg, 0.07, 0.022, x, y - 0.058, z + 0.0025, fg)
}

/** A row of power sockets on a face at z = 0 from x, `n` of them, the first `ups` red (UPS), and an equipotential stud after them. */
function sockets(e: OpdCtx, p: Object3D, x: number, y: number, z: number, n: number, ups: number, step = 0.085) {
  const { k, m } = e
  for (let i = 0; i < n; i++) {
    const sx = x + i * step
    k.soft(p, 0.075, 0.075, 0.012, 0.006, i < ups ? m.red : m.whitePlastic, sx, y, z + 0.006)
    for (const dx of [-0.014, 0.014]) k.cyl(p, 0.005, 0.005, 0.004, m.black, sx + dx, y + 0.004, z + 0.013, 8).rotation.x = PI / 2
    k.cyl(p, 0.006, 0.006, 0.004, m.black, sx, y - 0.016, z + 0.013, 8).rotation.x = PI / 2
  }
  // The equipotential bonding stud, green and yellow.
  const ex = x + n * step
  k.cyl(p, 0.016, 0.016, 0.01, otKitMats(e).green, ex, y, z + 0.005, 16).rotation.x = PI / 2
  k.cyl(p, 0.006, 0.006, 0.03, m.brass, ex, y, z + 0.02, 10).rotation.x = PI / 2
}

/* ---------- the operating table ---------- */

export interface TableFit {
  /** The orthopaedic extension (traction spars and boots) in place of the leg plates. */
  ortho?: boolean
  /** Made up for the next case: a sheet and the folded sterile drapes, or bare pads. */
  made?: boolean
  /** Top height to the pads' surface (0.72 – 1.1 m). */
  height?: number
}

/**
 * A mobile-column operating table along local z, head at −z (about 2.05 × 0.6 m over its rails):
 *   base     a low stainless base on four floor locks and two retracted transport castors, its
 *            foot pedals (lock green, unlock red) at the foot end;
 *   column   two telescopic stainless stages under the dark tilt head (Trendelenburg ±30°,
 *            lateral tilt ±25°);
 *   top      radiolucent carbon plates: head (with its gel head ring), back (in two with the
 *            kidney-bridge break), seat, and the leg plates split in two; under 80 mm charcoal
 *            pads with welted edges; 25 × 10 mm stainless accessory rails both sides;
 *   kit      two arm boards on rail clamps with straps, the anaesthesia screen, the knee strap,
 *            the wired hand control hung on the rail.
 * Orthopaedic: the leg plates off, two traction spars from the seat with boots on their carriages,
 * the padded perineal post.
 */
export function operatingTable(e: OpdCtx, p: Object3D, o: TableFit = {}) {
  const { k, m } = e
  const c = otKitMats(e)
  const top = (o.height ?? 0.9) - 0.08
  // The base: a stainless shell with chamfered edges on its floor locks.
  k.soft(p, 0.6, 0.13, 1.0, 0.04, c.ss, 0, 0.075, 0.18)
  k.soft(p, 0.5, 0.02, 0.9, 0.01, c.ssDark, 0, 0.145, 0.18)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.cyl(p, 0.04, 0.045, 0.012, m.rubber, sx * 0.24, 0.006, 0.18 + sz * 0.42, 18)
  for (const sz of [-1, 1]) castor(e, p, 0, 0.18 + sz * 0.46, 0.04)
  // Foot pedals at the foot end: floor lock (green) and release (red).
  for (const [x, mat] of [[-0.09, c.green], [0.09, m.red]] as const) {
    k.soft(p, 0.12, 0.03, 0.08, 0.01, mat, x, 0.06, 0.72)
    k.box(p, 0.03, 0.03, 0.06, c.ssDark, x, 0.06, 0.66)
  }
  // The column: two stainless stages, a shadow gap, the tilt head.
  k.soft(p, 0.38, 0.36, 0.28, 0.035, c.ss, 0, 0.33, 0.18)
  k.box(p, 0.34, 0.012, 0.24, c.bezel, 0, 0.516, 0.18, false)
  const upper = top - 0.6
  k.soft(p, 0.32, upper + 0.08, 0.23, 0.03, c.ss, 0, 0.52 + (upper + 0.08) / 2, 0.18)
  k.soft(p, 0.46, 0.08, 0.36, 0.02, c.bezel, 0, top - 0.08, 0.18)
  k.box(p, 0.5, 0.025, 0.3, c.ssDark, 0, top - 0.035, 0.18)
  // The top: sections as [z0, z1, width, name].
  const secs: [number, number, number, string][] = [
    [-1.03, -0.76, 0.3, 'head'],
    [-0.74, -0.43, 0.52, 'back1'],
    [-0.41, -0.08, 0.52, 'back2'],
    [-0.06, 0.4, 0.52, 'seat'],
  ]
  if (!o.ortho) secs.push([0.42, 1.02, 0.25, 'legL'], [0.42, 1.02, 0.25, 'legR'])
  const padT = 0.08
  for (const [z0, z1, w, name] of secs) {
    const x = name === 'legL' ? -0.135 : name === 'legR' ? 0.135 : 0
    const len = z1 - z0
    const zc = (z0 + z1) / 2
    // Carbon plate and the grey frame under it.
    k.box(p, w - 0.02, 0.018, len, c.carbon, x, top - 0.009, zc)
    if (name !== 'head') k.box(p, w - 0.06, 0.035, 0.03, c.trim, x, top - 0.035, z0 + 0.03)
    // The pad with its welt round the top edge.
    k.soft(p, w, padT, len - 0.008, 0.035, c.pad, x, top + padT / 2, zc)
    k.box(p, w - 0.03, 0.004, len - 0.04, c.padWelt, x, top + padT - 0.001, zc, false)
    // Accessory rails along the sides of the back, seat and leg sections, on their stand-offs.
    if (name !== 'head') {
      const sides = name === 'legL' ? [-1] : name === 'legR' ? [1] : [-1, 1]
      for (const s of sides) {
        const rx = x + s * (w / 2 + 0.025)
        k.box(p, 0.01, 0.025, len - 0.06, c.ss, rx, top - 0.012, zc)
        for (const dz of [-len / 2 + 0.06, len / 2 - 0.06]) k.box(p, 0.03, 0.015, 0.02, c.ss, rx - s * 0.015, top - 0.012, zc + dz)
      }
    }
  }
  // The gel head ring on the head section.
  const ring = put(p, geo(e, 'gelRing', () => new TorusGeometry(0.075, 0.025, 12, 28)), c.gel, 0, top + padT + 0.022, -0.9)
  ring.rotation.x = PI / 2
  // Arm boards out square on their rail clamps at the upper back section, padded, a strap over each.
  for (const s of [-1, 1]) {
    const a = group(p, s * 0.29, top - 0.012, -0.58, 0)
    k.box(a, 0.05, 0.05, 0.06, c.ssDark, s * 0.02, 0, 0)
    k.box(a, 0.06, 0.03, 0.14, c.carbon, s * 0.08, 0.035, 0)
    k.soft(a, 0.62, 0.06, 0.15, 0.025, c.pad, s * 0.4, 0.075, 0)
    k.box(a, 0.03, 0.065, 0.16, m.blue, s * 0.5, 0.076, 0, false)
  }
  // The anaesthesia screen: a bow on two posts clamped to the rails at the head.
  for (const s of [-1, 1]) k.box(p, 0.04, 0.04, 0.05, c.ssDark, s * 0.29, top - 0.012, -0.72)
  put(p, tube(e, 'anaesBow', [[-0.29, top, -0.72], [-0.3, top + 0.55, -0.72], [-0.2, top + 0.72, -0.72], [0.2, top + 0.72, -0.72], [0.3, top + 0.55, -0.72], [0.29, top, -0.72]], 0.009), c.ss)
  // The knee strap across the seat's foot, its buckle.
  if (!o.ortho) {
    k.box(p, 0.6, 0.004, 0.07, c.bezel, 0, top + padT + 0.002, 0.52, false)
    for (const s of [-1, 1]) k.box(p, 0.004, 0.08, 0.07, c.bezel, s * 0.3, top + padT - 0.035, 0.52, false)
    k.box(p, 0.05, 0.008, 0.06, c.ss, 0.1, top + padT + 0.005, 0.52, false)
  }
  // The hand control: a moulded pendant on its rail hook, the coiled cord to the column.
  const hc = group(p, 0.315, top - 0.15, 0.12)
  k.soft(hc, 0.035, 0.2, 0.075, 0.015, c.enamel, 0, 0, 0)
  for (let i = 0; i < 8; i++) k.box(hc, 0.004, 0.018, 0.024, i < 2 ? c.green : c.trim, 0.019, 0.07 - Math.floor(i / 2) * 0.034, (i % 2 - 0.5) * 0.03, false)
  k.box(hc, 0.02, 0.03, 0.02, c.ss, -0.02, 0.1, 0)
  put(p, tube(e, 'tableCord', [[0.32, top - 0.25, 0.12], [0.33, top - 0.4, 0.14], [0.26, top - 0.5, 0.18], [0.18, top - 0.52, 0.2]], 0.004), c.bezel)
  if (o.ortho) {
    // Traction spars from the seat, the boots on their carriages, the perineal post.
    for (const s of [-1, 1]) {
      put(p, tube(e, `orthoSpar${s}`, [[s * 0.1, top - 0.03, 0.38], [s * 0.2, top - 0.06, 0.8], [s * 0.36, top - 0.1, 1.3], [s * 0.44, top - 0.11, 1.6]], 0.022), c.ss)
      const b = group(p, s * 0.42, top - 0.08, 1.48, -s * 0.15)
      k.box(b, 0.08, 0.06, 0.18, c.ssDark, 0, -0.03, 0)
      k.soft(b, 0.12, 0.3, 0.26, 0.05, c.bezel, 0, 0.16, 0.02)
      k.soft(b, 0.11, 0.08, 0.16, 0.03, c.pad, 0, 0.32, 0.03)
      k.cyl(b, 0.012, 0.012, 0.3, c.ss, 0, 0.0, 0.25, 10).rotation.x = PI / 2
      put(b, lathe(e, 'tractionWheel', [[0.01, 0], [0.04, 0], [0.04, 0.012], [0.01, 0.012]], 20), c.bezel, 0, 0, 0.4).rotation.x = PI / 2
    }
    k.cyl(p, 0.055, 0.055, 0.32, c.pad, 0, top + 0.16, 0.36, 20)
    k.cyl(p, 0.02, 0.02, 0.08, c.ss, 0, top - 0.02, 0.36, 12)
  }
  if (o.made) {
    // A fresh sheet over the pads, the folded drape pack and gown pack at the foot.
    put(p, drape(e, 'otSheet', 0.56, 1.5, 0.12, 0.02, 9), m.sheet, 0, top + padT + 0.003, -0.25)
    k.soft(p, 0.36, 0.05, 0.28, 0.012, c.wrapGreen, 0, top + padT + 0.03, 0.62)
    k.soft(p, 0.3, 0.04, 0.22, 0.012, c.wrap, 0.02, top + padT + 0.075, 0.62)
  }
}

/* ---------- surgical lights ---------- */

export interface LightHead {
  /** The extension arm's turn about the axis, its reach, how far the spring arm drops the head. */
  turn: number
  reach: number
  drop: number
  /** The head's tilt towards the table. */
  tilt?: number
}

/**
 * Ceiling surgical lights from one central axis: the canopy, the axis tube and its stacked
 * bearings; for each head an extension arm, a spring arm in twin tubes down to the cardanic yoke
 * and the lighthead: a slim domed housing 0.7 m across with a field of hexagonally packed LED
 * cells in their reflectors round the sterile handle. With `display`, a third arm from the axis
 * holds a 27″ surgical monitor. Returns the lit cells (in live_ groups) for the panel's switch.
 */
export function surgicalLights(e: OpdCtx, p: Object3D, ceiling: number, heads: LightHead[], display?: { screen: Material; turn: number; reach: number; y: number }) {
  const { k } = e
  const c = otKitMats(e)
  put(p, lathe(e, 'slCanopy2', [[0, 0], [0.26, 0], [0.26, -0.04], [0.16, -0.09], [0, -0.09]], 40), c.pendant, 0, ceiling, 0)
  const axisLen = 0.3 + heads.length * 0.11 + (display ? 0.12 : 0)
  k.cyl(p, 0.055, 0.055, axisLen, c.pendant, 0, ceiling - 0.09 - axisLen / 2, 0, 24)
  const lit: Mesh[] = []
  // The cell layout: a ring of 6 and a ring of 12 round the handle, as hexagonal packing gives.
  const cells: [number, number][] = []
  for (let i = 0; i < 6; i++) cells.push([Math.cos((i / 6) * PI * 2 + PI / 6) * 0.115, Math.sin((i / 6) * PI * 2 + PI / 6) * 0.115])
  for (let i = 0; i < 12; i++) {
    const r = i % 2 ? 0.215 : 0.23
    cells.push([Math.cos((i / 12) * PI * 2) * r, Math.sin((i / 12) * PI * 2) * r])
  }
  heads.forEach((h, i) => {
    const y = ceiling - 0.25 - i * 0.11
    const arm = group(p, 0, y, 0, h.turn)
    put(arm, lathe(e, 'slBearing', [[0, -0.04], [0.075, -0.04], [0.08, -0.03], [0.08, 0.03], [0.075, 0.04], [0, 0.04]], 24), c.pendant)
    k.soft(arm, 0.085, 0.07, h.reach, 0.032, c.pendant, 0, 0, h.reach / 2)
    put(arm, lathe(e, 'slElbow', [[0, -0.05], [0.055, -0.05], [0.06, 0], [0.055, 0.05], [0, 0.05]], 20), c.pendant, 0, -0.01, h.reach)
    // The spring arm: twin tubes down and out to the yoke's bearing.
    const sp = group(arm, 0, -0.04, h.reach)
    const reach2 = 0.42
    for (const dx of [-0.022, 0.022]) put(sp, tube(e, `slSpring${h.drop.toFixed(2)}${dx}`, [[dx, 0, 0], [dx, -h.drop * 0.45, reach2 * 0.55], [dx, -h.drop, reach2]], 0.017), c.pendant)
    put(sp, lathe(e, 'slKnuckle', [[0, -0.04], [0.04, -0.04], [0.045, 0], [0.04, 0.04], [0, 0.04]], 18), c.pendant, 0, -h.drop, reach2)
    // The cardanic yoke round the head.
    const yoke = group(sp, 0, -h.drop - 0.05, reach2)
    put(yoke, tube(e, 'slYoke2', [[0, 0.03, 0], [0, -0.04, 0], [-0.38, -0.06, 0], [-0.4, -0.14, 0]], 0.02), c.pendant)
    // The lighthead, tilted towards the field.
    const head = group(yoke, -0.02, -0.17, 0)
    head.rotation.x = h.tilt ?? 0.32
    head.rotation.z = 0.08
    put(head, lathe(e, 'slHousing', [[0, 0.07], [0.1, 0.068], [0.26, 0.05], [0.335, 0.025], [0.35, 0.0], [0.348, -0.022], [0.33, -0.03], [0, -0.03]], 48), c.pendant)
    k.cyl(head, 0.345, 0.345, 0.006, c.bezel, 0, -0.032, 0, 48)
    // The cells: each a reflector cup and its lens, kept whole in a live_ group for switching.
    const holder = new Group()
    holder.name = `live_otlight_${e.ids++}`
    head.add(holder)
    for (const [cx, cz] of cells) {
      put(head, lathe(e, 'slCup', [[0.012, 0], [0.05, 0], [0.056, -0.012], [0.012, -0.012]], 18), c.reflector, cx, -0.03, cz, false)
      const lens = k.cyl(holder, 0.043, 0.043, 0.006, c.cell, cx, -0.044, cz, 18)
      lens.castShadow = false
      lit.push(lens)
    }
    // The sterile handle in the middle, its grip rings; a camera module in the first head.
    put(head, lathe(e, 'slHandle2', [[0, 0], [0.034, 0], [0.034, -0.03], [0.026, -0.04], [0.026, -0.14], [0.03, -0.15], [0.03, -0.16], [0, -0.165]], 20), i === 0 ? c.bezel : c.trim, 0, -0.035, 0)
    for (let j = 0; j < 3; j++) k.cyl(head, 0.028, 0.028, 0.006, c.trim, 0, -0.08 - j * 0.025, 0, 20)
  })
  if (display) {
    // The display arm: a spring arm off the axis to a 27″ surgical monitor turned to the team.
    const a = group(p, 0, ceiling - 0.3 - heads.length * 0.11, 0, display.turn)
    put(a, lathe(e, 'slBearing', [[0, -0.04], [0.075, -0.04], [0.08, -0.03], [0.08, 0.03], [0.075, 0.04], [0, 0.04]], 24), c.pendant)
    k.soft(a, 0.085, 0.07, display.reach, 0.032, c.pendant, 0, 0, display.reach / 2)
    const drop = ceiling - 0.3 - heads.length * 0.11 - display.y - 0.25
    put(a, tube(e, `dispSpring${drop.toFixed(2)}`, [[0, 0, display.reach], [0, -drop * 0.5, display.reach + 0.15], [0, -drop, display.reach + 0.22]], 0.02), c.pendant)
    const mon = group(a, 0, -drop - 0.22, display.reach + 0.24, PI)
    k.box(mon, 0.12, 0.12, 0.05, c.pendant, 0, 0.16, -0.03)
    k.soft(mon, 0.66, 0.42, 0.06, 0.012, c.bezel, 0, 0, 0)
    face(e, mon, 0.62, 0.36, display.screen, 0, 0.005, 0.031)
  }
  return lit
}

/* ---------- ceiling supply pendants ---------- */

export interface TheatrePendantFit {
  ceiling: number
  /** The ceiling mount in the column's frame (x, z): the arm runs up and over to it. */
  mount: [number, number]
  kind: 'anaes' | 'surg'
  /** The anaesthesia pendant's patient monitor. */
  monitor?: Material
  /** The surgical pendant's generator display. */
  esu?: Material
}

/**
 * A theatre's ceiling supply pendant, built at its column (front +z): the ceiling flange and drop
 * tube at the mount, a two-link arm on braked bearings, and the service column, 0.42 × 0.3 m and
 * 1.3 m tall from 0.82 m: aluminium corner extrusions and white covers; the gas terminal units with
 * their colour-coded labels, UPS (red) and mains sockets with the equipotential stud, data; three
 * cantilevered shelves on rails and a drawer. The anaesthesia pendant carries the patient monitor
 * on its top shelf and an infusion pole; the surgical pendant the electrosurgical generator.
 * Returns markers at its gas sockets, by gas.
 */
export function theatrePendant(e: OpdCtx, p: Object3D, o: TheatrePendantFit) {
  const { k, m } = e
  const c = otKitMats(e)
  const C = o.ceiling
  const armY = C - 0.62
  const [mx, mz] = o.mount
  // The ceiling flange and drop tube at the mount.
  put(p, lathe(e, 'tpCanopy', [[0, 0], [0.24, 0], [0.24, -0.04], [0.16, -0.08], [0, -0.08]], 36), c.pendant, mx, C, mz)
  k.cyl(p, 0.085, 0.085, C - 0.08 - armY, c.pendant, mx, (C - 0.08 + armY) / 2, mz, 28)
  // The two links, the elbow off the straight line, their bearings.
  const ex = mx * 0.5 + mz * 0.18
  const ez = mz * 0.5 - mx * 0.18
  const drum = lathe(e, 'tpDrum', [[0, -0.075], [0.1, -0.075], [0.11, -0.055], [0.11, 0.055], [0.1, 0.075], [0, 0.075]], 28)
  const link = (x0: number, z0: number, x1: number, z1: number, y: number) => {
    const len = Math.hypot(x1 - x0, z1 - z0)
    const g = group(p, (x0 + x1) / 2, y, (z0 + z1) / 2, Math.atan2(x1 - x0, z1 - z0))
    k.soft(g, 0.17, 0.13, len, 0.05, c.pendant, 0, 0, 0)
    k.box(g, 0.004, 0.06, len - 0.12, c.extrusion, 0.086, 0, 0, false)
  }
  put(p, drum, c.pendant, mx, armY, mz)
  link(mx, mz, ex, ez, armY)
  put(p, drum, c.pendant, ex, armY, ez)
  link(ex, ez, 0, 0, armY - 0.14)
  put(p, drum, c.pendant, 0, armY - 0.14, 0)
  // The column: from the arm down to 0.82 m.
  const top = armY - 0.22
  const bot = 0.82
  const H = top - bot
  const yc = (top + bot) / 2
  k.soft(p, 0.42, H, 0.3, 0.03, c.pendant, 0, yc, 0)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(p, 0.03, H + 0.01, 0.03, c.extrusion, sx * 0.2, yc, sz * 0.14)
  k.cyl(p, 0.075, 0.075, 0.08, c.pendant, 0, top + 0.04, 0, 24)
  // Gases along the top of the front, sockets and data under them.
  const fz = 0.151
  const gases: OtGas[] = o.kind === 'anaes' ? ['o2', 'n2o', 'air', 'vac', 'agss'] : ['o2', 'air', 'co2', 'vac']
  const marks: Partial<Record<OtGas, Object3D>> = {}
  const gy = top - 0.22
  gases.forEach((g, i) => {
    const x = -((gases.length - 1) * 0.082) / 2 + i * 0.082
    otOutlet(e, p, g, x, gy, fz)
    marks[g] = group(p, x, gy, fz)
  })
  sockets(e, p, -0.17, gy - 0.16, fz, 4, 2)
  for (let i = 0; i < 2; i++) {
    k.soft(p, 0.06, 0.06, 0.01, 0.005, m.greyPlastic, 0.12 + i * 0.07, gy - 0.25, fz + 0.005)
    k.box(p, 0.022, 0.016, 0.004, m.black, 0.12 + i * 0.07, gy - 0.25, fz + 0.011, false)
  }
  // Shelves on their rails (the top one under the gases), a drawer under the lowest.
  const shelves = o.kind === 'anaes' ? [gy - 0.42, bot + 0.36] : [gy - 0.42, bot + 0.3]
  for (const y of shelves) {
    k.soft(p, 0.6, 0.03, 0.44, 0.012, c.pendant, 0, y, 0.33)
    k.box(p, 0.64, 0.025, 0.012, c.ss, 0, y + 0.01, 0.56)
    for (const sx of [-1, 1]) k.box(p, 0.012, 0.025, 0.42, c.ss, sx * 0.32, y + 0.01, 0.34)
    for (const sx of [-1, 1]) k.box(p, 0.04, 0.12, 0.08, c.extrusion, sx * 0.17, y - 0.06, 0.18)
  }
  const dr = group(p, 0, bot + 0.18, 0.33)
  k.soft(dr, 0.56, 0.16, 0.42, 0.012, c.pendant, 0, 0, 0)
  k.box(dr, 0.2, 0.02, 0.02, c.ss, 0, 0.03, 0.22)
  if (o.kind === 'anaes') {
    // The patient monitor on the upper shelf, turned to the anaesthetist; the infusion pole.
    if (o.monitor) {
      const mo = group(p, 0, shelves[0] + 0.25, 0.33)
      mo.rotation.x = -0.08
      patientMonitor(e, mo, o.monitor, 0.44, c.enamel)
      k.box(p, 0.16, 0.05, 0.12, c.trim, 0, shelves[0] + 0.04, 0.3)
    }
    k.cyl(p, 0.013, 0.013, 0.95, m.chrome, 0.24, top + 0.0, -0.1, 14)
    for (const a of [0, PI]) {
      const hk = group(p, 0.24, top + 0.47, -0.1, a)
      k.box(hk, 0.09, 0.01, 0.01, m.chrome, 0.045, 0, 0)
    }
    // Spare circuit and filters, a laryngoscope tray on the lower shelf.
    k.soft(p, 0.22, 0.08, 0.16, 0.012, m.clearPlastic, -0.15, shelves[1] + 0.055, 0.32)
    k.soft(p, 0.2, 0.04, 0.12, 0.01, c.ss, 0.14, shelves[1] + 0.035, 0.34)
  } else {
    // The electrosurgical generator on the upper shelf, its foot switch hung under.
    const g = group(p, 0, shelves[0] + 0.015, 0.34)
    k.soft(g, 0.42, 0.16, 0.38, 0.015, c.enamel, 0, 0.08, 0)
    if (o.esu) face(e, g, 0.16, 0.09, o.esu, -0.08, 0.09, 0.191)
    for (let i = 0; i < 3; i++) put(g, lathe(e, 'esuKnob', [[0, 0], [0.016, 0], [0.016, 0.012], [0, 0.014]], 16), [m.blue, m.amber, m.blue][i], 0.06 + i * 0.045, 0.09, 0.19, false).rotation.x = PI / 2
    for (let i = 0; i < 3; i++) k.cyl(g, 0.008, 0.008, 0.004, [m.blue, m.amber, m.black][i], 0.06 + i * 0.045, 0.035, 0.191, 12).rotation.x = PI / 2
    // A smoke evacuator under it on the lower shelf.
    k.soft(p, 0.36, 0.14, 0.34, 0.015, c.enamel, 0, shelves[1] + 0.085, 0.34)
    k.box(p, 0.1, 0.05, 0.004, c.bezel, -0.09, shelves[1] + 0.1, 0.512, false)
    put(p, tube(e, 'smokeHose', [[0.1, shelves[1] + 0.1, 0.51], [0.15, shelves[1] + 0.25, 0.6], [0.05, shelves[1] + 0.5, 0.65]], 0.014), m.clearPlastic)
  }
  return marks
}

/* ---------- the anaesthesia workstation ---------- */

/**
 * An anaesthesia workstation (Dräger Perseus / GE Aisys class) at the patient's head, built facing
 * +z: the trolley on four 125 mm castors, the lower body with three drawers and recessed grips;
 * the worktop with its raised edge and the writing tray under; the upper housing with electronic
 * gas mixing (the virtual flowtubes on screen, a total-flow tube, the O₂ flush and auxiliary O₂
 * flowmeter), pipeline and cylinder gauges; two vaporisers (sevoflurane, isoflurane) on their
 * rail; the main 15″ screen on its arm and the gas-module display; on the left the compact
 * breathing system: absorber with its soda lime, the ventilator's bellows in its dome, APL valve,
 * bag arm and reservoir bag; the corrugated circuit to the Y-piece and filter, its mask; side rails
 * with the suction regulator; reserve cylinders on the back; the pipeline hoses (O₂ white, N₂O
 * blue, air black) and the purple AGSS hose leave the back for the pendant (`hoses`: their ends, local).
 */
export function anaesthesiaWorkstation(e: OpdCtx, p: Object3D, o: { screen: Material; gas: Material; hoses?: Partial<Record<'o2' | 'n2o' | 'air' | 'agss', [number, number, number]>> }) {
  const { k, m } = e
  const c = otKitMats(e)
  const t = otMats(e)
  for (const [x, z, b] of [[-0.31, -0.24, false], [0.31, -0.24, false], [-0.31, 0.25, true], [0.31, 0.25, true]] as const) castor(e, p, x, z, 0.0625, 0, b)
  // The lower body and its drawers.
  k.soft(p, 0.76, 0.62, 0.6, 0.05, c.enamel, 0, 0.45, 0)
  for (let i = 0; i < 3; i++) {
    const y = 0.27 + i * 0.19
    k.soft(p, 0.68, 0.17, 0.02, 0.01, c.enamel, 0, y, 0.302)
    k.box(p, 0.24, 0.012, 0.012, c.trim, 0, y + 0.065, 0.31, false)
  }
  k.box(p, 0.78, 0.06, 0.6, c.trim, 0, 0.13, 0)
  // The worktop, its lip, the writing tray.
  k.soft(p, 0.82, 0.035, 0.6, 0.012, c.trim, 0, 0.78, 0.03)
  k.box(p, 0.82, 0.02, 0.012, c.trim, 0, 0.805, 0.33)
  k.soft(p, 0.5, 0.02, 0.3, 0.008, c.enamel, 0.05, 0.74, 0.3)
  // Side rails with their end caps, both sides.
  for (const s of [-1, 1]) {
    k.box(p, 0.012, 0.03, 0.5, c.ss, s * 0.43, 0.82, 0.02)
    for (const z of [-0.2, 0.24]) k.box(p, 0.035, 0.03, 0.02, c.ss, s * 0.415, 0.82, z)
  }
  // The upper housing: gas controls, flush, gauges.
  k.soft(p, 0.66, 0.56, 0.28, 0.035, c.enamel, 0.04, 1.08, -0.16)
  k.box(p, 0.6, 0.22, 0.004, c.bezel, 0.04, 0.93, -0.019, false)
  // Total-flow tube and its float, the aux O₂ flowmeter, the flush button.
  k.box(p, 0.035, 0.18, 0.02, c.flowGlass, -0.18, 0.95, -0.012, false)
  k.cyl(p, 0.008, 0.008, 0.012, m.whitePlastic, -0.18, 0.96, -0.01, 10)
  k.box(p, 0.03, 0.14, 0.02, c.flowGlass, -0.11, 0.95, -0.012, false)
  k.cyl(p, 0.02, 0.02, 0.03, c.green, -0.11, 0.86, 0.0, 16).rotation.x = PI / 2
  k.cyl(p, 0.022, 0.022, 0.02, m.whitePlastic, 0.27, 0.9, -0.01, 18).rotation.x = PI / 2
  label(e, p, 'o2flush', 'O₂ +', '#ffffff', 0.05, 0.016, 0.27, 0.95, -0.013, '#1f9d55')
  // The control knob (electronic mixer) and three pipeline gauges.
  put(p, lathe(e, 'mixKnob', [[0, 0], [0.04, 0], [0.04, 0.022], [0.03, 0.03], [0, 0.03]], 24), c.bezel, 0.1, 0.92, -0.02, false).rotation.x = PI / 2
  for (let i = 0; i < 3; i++) {
    const x = -0.02 + i * 0.07
    put(p, lathe(e, 'pipeGauge', [[0, 0], [0.024, 0], [0.026, 0.01], [0, 0.012]], 20), m.chrome, x, 1.0, -0.02, false).rotation.x = PI / 2
    face(e, p, 0.04, 0.04, m.lineGauge, x, 1.0, -0.007)
  }
  // The vaporiser rail and two vaporisers on it.
  k.box(p, 0.4, 0.035, 0.05, c.ss, 0.1, 1.24, -0.005)
  for (const [x, mat] of [[0.0, c.sevo], [0.2, c.iso]] as const) {
    k.soft(p, 0.14, 0.24, 0.17, 0.02, mat, x, 1.38, 0.03)
    put(p, lathe(e, 'vapDial', [[0, 0], [0.05, 0], [0.05, 0.03], [0.045, 0.04], [0, 0.04]], 28), c.enamel, x, 1.5, 0.03, false)
    k.box(p, 0.03, 0.08, 0.006, c.flowGlass, x + 0.04, 1.34, 0.118, false)
    k.box(p, 0.02, 0.04, 0.004, mat, x + 0.04, 1.32, 0.121, false)
  }
  // The gas-module display and the main screen on its arm, turned a little towards the bed.
  k.soft(p, 0.36, 0.22, 0.12, 0.02, c.enamel, -0.17, 1.47, -0.2)
  face(e, p, 0.3, 0.16, o.gas, -0.17, 1.47, -0.139)
  k.cyl(p, 0.03, 0.03, 0.3, c.trim, 0.04, 1.73, -0.22, 16)
  const scr = group(p, 0.04, 1.97, -0.17)
  scr.rotation.x = -0.12
  k.soft(scr, 0.44, 0.34, 0.06, 0.015, c.bezel, 0, 0, 0)
  face(e, scr, 0.4, 0.29, o.screen, 0, 0.005, 0.031)
  // The compact breathing system on the left: block, absorber, bellows dome, APL, bag arm, bag.
  const bs = group(p, -0.47, 0, 0.0)
  k.soft(bs, 0.2, 0.16, 0.24, 0.02, c.trim, 0, 0.92, 0.05)
  k.cyl(bs, 0.085, 0.085, 0.22, c.flowGlass, 0, 0.71, 0.05, 24)
  k.cyl(bs, 0.078, 0.078, 0.2, c.soda, 0, 0.71, 0.05, 24)
  k.cyl(bs, 0.088, 0.088, 0.02, c.bezel, 0, 0.6, 0.05, 24)
  k.cyl(bs, 0.1, 0.1, 0.26, c.flowGlass, 0, 1.13, -0.08, 28)
  put(bs, lathe(e, 'bellows2', Array.from({ length: 9 }, (_, i): [number, number] => [i % 2 ? 0.08 : 0.09, i * 0.024]), 24), c.bezel, 0, 1.02, -0.08)
  put(bs, lathe(e, 'bellowsCap', [[0, 0], [0.1, 0], [0.1, 0.015], [0.04, 0.03], [0, 0.03]], 24), c.trim, 0, 1.26, -0.08)
  put(bs, lathe(e, 'aplKnob', [[0, 0], [0.026, 0], [0.026, 0.02], [0.018, 0.03], [0, 0.03]], 18), c.sevo, 0.06, 1.0, 0.17, false)
  // Bag arm out to the side, the reservoir bag hanging from its elbow.
  put(bs, tube(e, 'bagArm', [[-0.05, 0.95, 0.1], [-0.15, 1.05, 0.12], [-0.22, 1.0, 0.18]], 0.012), c.trim)
  put(bs, lathe(e, 'resBag2', [[0, 0], [0.02, 0.01], [0.065, 0.07], [0.07, 0.15], [0.055, 0.22], [0.02, 0.26], [0, 0.27]], 20), t.bag, -0.22, 0.7, 0.18)
  // The circuit: inspiratory and expiratory limbs to the Y-piece, filter and the mask on its hook.
  corrugated(e, p, 'aw_insp', [[-0.42, 0.94, 0.18], [-0.38, 1.1, 0.45], [-0.18, 1.12, 0.78], [0.0, 1.02, 1.0]], m.blue)
  corrugated(e, p, 'aw_exp', [[-0.52, 0.94, 0.18], [-0.5, 1.04, 0.5], [-0.25, 1.04, 0.85], [0.0, 1.0, 1.01]], m.blue)
  k.cyl(p, 0.022, 0.022, 0.05, m.clearPlastic, 0.0, 1.01, 1.04, 16).rotation.x = PI / 2
  k.cyl(p, 0.035, 0.035, 0.04, m.whitePlastic, 0.0, 1.01, 1.09, 18).rotation.x = PI / 2
  put(p, lathe(e, 'faceMask', [[0, 0], [0.02, 0], [0.05, 0.02], [0.055, 0.045], [0, 0.05]], 18), m.clearPlastic, 0.43, 0.84, 0.15, false).rotation.z = PI / 2
  // The suction regulator and canister on the right rail.
  const sr = group(p, 0.45, 0.82, 0.1)
  k.box(sr, 0.04, 0.06, 0.05, c.ss, 0, 0, 0)
  k.cyl(sr, 0.055, 0.055, 0.2, c.flowGlass, 0.04, -0.14, 0, 20)
  k.cyl(sr, 0.05, 0.05, 0.06, m.amber, 0.04, -0.2, 0, 20)
  k.cyl(sr, 0.058, 0.058, 0.025, c.bezel, 0.04, -0.03, 0, 20)
  // Reserve cylinders in their yokes on the back: oxygen (black body, white shoulder), N₂O (blue).
  for (const [x, body, top] of [[-0.17, t.o2Cyl, t.o2Top], [0.17, t.n2oCyl, t.n2oCyl]] as const) {
    k.cyl(p, 0.055, 0.055, 0.6, body, x, 0.6, -0.36, 20)
    k.cyl(p, 0.05, 0.055, 0.07, top, x, 0.935, -0.36, 20)
    k.box(p, 0.08, 0.06, 0.05, c.ss, x, 0.99, -0.33)
  }
  // Pipeline hoses from the back to the pendant's outlets, the AGSS hose.
  const hoseMat: Record<'o2' | 'n2o' | 'air' | 'agss', Material> = { o2: m.whitePlastic, n2o: c.n2o, air: m.black, agss: c.agss }
  const starts: Record<'o2' | 'n2o' | 'air' | 'agss', [number, number, number]> = { o2: [-0.1, 0.95, -0.3], n2o: [0.0, 0.95, -0.3], air: [0.1, 0.95, -0.3], agss: [-0.3, 0.85, -0.25] }
  for (const g of ['o2', 'n2o', 'air', 'agss'] as const) {
    const end = o.hoses?.[g]
    if (!end) continue
    const s = starts[g]
    const mid: [number, number, number] = [(s[0] + end[0]) / 2, Math.min(s[1], end[1]) - 0.25, (s[2] + end[2]) / 2]
    put(p, tube(e, `awHose_${g}_${end.map((v) => v.toFixed(2)).join('_')}`, [s, [s[0], s[1] - 0.12, s[2] - 0.08], mid, [end[0], end[1] - 0.1, end[2]], end], g === 'agss' ? 0.012 : 0.007, false, 0.5), hoseMat[g])
  }
}

/* ---------- wall fittings ---------- */

/**
 * A wall gas-outlet panel (its face at z = 0, centred at x = 0, height y): a recessed stainless
 * fascia with O₂, N₂O, air, vacuum and AGSS terminal units and their labels, four sockets (two
 * on UPS) and the equipotential stud under them; a backup to the pendants.
 */
export function otGasPanel(e: OpdCtx, p: Object3D, y = 1.45) {
  const { k } = e
  const c = otKitMats(e)
  k.box(p, 0.58, 0.34, 0.02, c.ss, 0, y, 0.01)
  k.box(p, 0.6, 0.36, 0.006, c.ssDark, 0, y, 0.003, false)
  const gases: OtGas[] = ['o2', 'n2o', 'air', 'vac', 'agss']
  gases.forEach((g, i) => otOutlet(e, p, g, -0.2 + i * 0.1, y + 0.08, 0.021))
  sockets(e, p, -0.17, y - 0.1, 0.021, 4, 2)
}

/**
 * Recessed theatre storage along a wall (face at z = 0): `bays` stainless bays 0.6 m wide, flush
 * with a stainless surround to the ceiling: glazed doors above (they open) on shelves of sterile
 * packs, suture boxes and drapes; two stainless drawers in each bay below (they open). Projects
 * 0.4 m (the modular wall's depth).
 */
export function storageWall(e: OpdCtx, p: Object3D, bays: number, ceiling: number) {
  const { k, m } = e
  const c = otKitMats(e)
  const W = bays * 0.6
  const D = 0.4
  // The surround: sides, the bulkhead to the ceiling, the plinth.
  for (const s of [-1, 1]) k.box(p, 0.03, ceiling, D, c.ss, s * (W / 2 + 0.015), ceiling / 2, D / 2)
  k.box(p, W, ceiling - 2.25, D, c.ss, 0, (ceiling + 2.25) / 2, D / 2)
  k.box(p, W, 0.1, D - 0.04, c.ssDark, 0, 0.05, D / 2 - 0.02)
  for (let b = 0; b < bays; b++) {
    const x = -W / 2 + 0.3 + b * 0.6
    // The body (dark inside), shelves and their stock.
    k.box(p, 0.58, 2.15, 0.01, c.ss, x, 1.175, 0.005)
    for (const s of [-1, 1]) k.box(p, 0.01, 2.15, D, c.ss, x + s * 0.295, 1.175, D / 2)
    k.box(p, 0.58, 0.02, D - 0.02, c.ss, x, 0.96, D / 2)
    for (const [i, y] of [1.27, 1.6, 1.93].entries()) {
      k.box(p, 0.56, 0.012, D - 0.04, c.ss, x, y, D / 2 - 0.01)
      const kind = (b + i) % 3
      if (kind === 0) {
        // Wrapped instrument sets.
        for (let j = 0; j < 2; j++) k.soft(p, 0.24, 0.1 + j * 0.02, 0.3, 0.015, j ? c.wrapGreen : c.wrap, x - 0.13 + j * 0.26, y + 0.06 + j * 0.01, D / 2 - 0.02)
      } else if (kind === 1) {
        // Suture boxes in a row.
        for (let j = 0; j < 5; j++) k.box(p, 0.09, 0.12, 0.22, c.sutures, x - 0.22 + j * 0.11, y + 0.066, D / 2 - 0.02)
        for (let j = 0; j < 5; j++) k.box(p, 0.08, 0.02, 0.002, [m.purple, m.blue, m.green, m.amber, m.red][j], x - 0.22 + j * 0.11, y + 0.1, D / 2 + 0.091, false)
      } else {
        // Peel packs and gloves.
        for (let j = 0; j < 3; j++) k.box(p, 0.16, 0.09, 0.26, j === 1 ? m.whitePlastic : m.blue, x - 0.18 + j * 0.18, y + 0.05, D / 2 - 0.02)
      }
    }
    // Two glazed doors above, each 0.29 wide, hung at the bay's sides.
    cupboardDoor(e, p, x - 0.29, 1.6, D, { w: 0.29, h: 1.24, hinge: 'left', face: c.ss, glass: true, label: 'Sterile Storage' })
    cupboardDoor(e, p, x + 0.29, 1.6, D, { w: 0.29, h: 1.24, hinge: 'right', face: c.ss, glass: true, label: 'Sterile Storage' })
    // Two drawers below.
    for (const [j, y] of [0.72, 0.36].entries()) drawer(e, p, x, y, D, { w: 0.58, h: 0.34, d: D - 0.04, front: c.ss, label: j ? 'Drapes & Gowns' : 'Consumables', fill: (g, iw, id) => {
      for (let q = 0; q < 3; q++) e.k.soft(g, iw / 3 - 0.02, 0.08, id - 0.04, 0.01, q % 2 ? c.wrap : m.whitePlastic, -iw / 3 + q * (iw / 3), 0.04, -id / 2)
    } })
  }
}

/** A pass box through a wall (face at z = 0, centred at y): stainless, its interlocked door with a window, the UV and interlock lamps. */
export function passBox(e: OpdCtx, p: Object3D, y = 1.1) {
  const { k } = e
  const c = otKitMats(e)
  k.box(p, 0.7, 0.7, 0.03, c.ss, 0, y, 0.015)
  const d = cupboardDoor(e, p, -0.27, y, 0.05, { w: 0.54, h: 0.54, t: 0.02, hinge: 'left', face: c.ss, glass: true, label: 'Pass Box' })
  void d
  for (const [x, mat] of [[0.22, c.green], [0.27, e.m.red]] as const) k.cyl(p, 0.01, 0.01, 0.006, mat, x, y + 0.31, 0.032, 12).rotation.x = PI / 2
  label(e, p, 'passbox', 'PASS BOX · UV', '#1c3966', 0.2, 0.03, -0.1, y + 0.31, 0.031)
}

/** A low-level return-air grille in a theatre's wall (face at z = 0): stainless louvres in a frame, at 0.15–0.45 m. */
export function returnGrille(e: OpdCtx, p: Object3D, w = 0.6) {
  const { k } = e
  const c = otKitMats(e)
  k.box(p, w, 0.32, 0.02, c.ss, 0, 0.3, 0.01)
  for (let i = 0; i < 7; i++) k.box(p, w - 0.06, 0.012, 0.02, c.ssDark, 0, 0.18 + i * 0.04, 0.02).rotation.x = -0.6
}

/** A coved skirting along a theatre's wall (face at z = 0): the floor turned up 100 mm on a cove former. */
export function cove(e: OpdCtx, p: Object3D, len: number, floor: Material) {
  const { k } = e
  // The upturn, the cove former's 45° fillet at its foot, and the stainless capping strip on top.
  k.box(p, len, 0.1, 0.008, floor, 0, 0.062, 0.004, false)
  k.box(p, len, 0.03, 0.03, floor, 0, 0.012, 0.012, false).rotation.x = PI / 4
  k.box(p, len, 0.006, 0.012, otKitMats(e).ss, 0, 0.114, 0.006, false)
}

/** A double bowl stand: a stainless ring frame on castors with two lotion bowls. */
export function bowlStand(e: OpdCtx, p: Object3D) {
  const { k } = e
  const c = otKitMats(e)
  for (const [x, z] of [[-0.3, -0.18], [0.3, -0.18], [-0.3, 0.18], [0.3, 0.18]]) castor(e, p, x, z, 0.03)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.cyl(p, 0.011, 0.011, 0.78, c.ss, sx * 0.3, 0.46, sz * 0.18, 10)
  for (const y of [0.12, 0.85]) {
    k.box(p, 0.62, 0.016, 0.016, c.ss, 0, y, -0.18)
    k.box(p, 0.62, 0.016, 0.016, c.ss, 0, y, 0.18)
    for (const sx of [-1, 1]) k.box(p, 0.016, 0.016, 0.38, c.ss, sx * 0.3, y, 0)
  }
  for (const x of [-0.15, 0.15]) {
    put(p, geo(e, 'bowlRing', () => new TorusGeometry(0.13, 0.008, 8, 28)), c.ss, x, 0.85, 0).rotation.x = PI / 2
    put(p, lathe(e, 'lotionBowl', [[0, 0], [0.08, 0], [0.13, 0.08], [0.14, 0.09], [0.13, 0.09], [0.075, 0.008], [0, 0.008]], 28), c.ss, x, 0.77, 0)
  }
}

/** A swab rack on a wall (face at z = 0): a stainless frame of 10 counted pockets with the swab count board. */
export function swabRack(e: OpdCtx, p: Object3D, y = 1.0) {
  const { k, m } = e
  const c = otKitMats(e)
  k.box(p, 0.62, 0.62, 0.01, c.ss, 0, y + 0.31, 0.005)
  for (let i = 0; i < 10; i++) {
    const x = -0.24 + (i % 5) * 0.12
    const yy = y + 0.45 - Math.floor(i / 5) * 0.25
    k.box(p, 0.1, 0.18, 0.04, m.clearPlastic, x, yy, 0.03, false)
    if (i < 6) k.soft(p, 0.08, 0.12, 0.025, 0.01, m.whitePlastic, x, yy - 0.02, 0.03)
  }
  label(e, p, 'swabs', 'SWAB COUNT · 10 / POCKET', '#1c3966', 0.5, 0.035, 0, y + 0.06, 0.012)
}

/** A lead-apron rack on a wall (face at z = 0): a stainless rail of hangers with aprons and thyroid shields. */
export function apronRack(e: OpdCtx, p: Object3D, n = 4) {
  const { k } = e
  const c = otKitMats(e)
  const W = 0.3 * n + 0.1
  k.box(p, W, 0.06, 0.03, c.ss, 0, 1.7, 0.015)
  for (let i = 0; i < n; i++) {
    const x = -W / 2 + 0.2 + i * 0.3
    k.box(p, 0.02, 0.02, 0.32, c.ss, x, 1.7, 0.16)
    k.soft(p, 0.5, 0.85, 0.035, 0.03, i % 2 ? c.lead : c.leadGrey, x, 1.24, 0.3)
    k.soft(p, 0.16, 0.12, 0.03, 0.02, i % 2 ? c.leadGrey : c.lead, x, 1.62, 0.33)
  }
}

/** Instruments laid out under a sterile drape on a large back table (instrumentTable's bigger set). */
export function backTable(e: OpdCtx, p: Object3D, w = 1.5, d = 0.7, seed = 1) {
  const { k } = e
  const c = otKitMats(e)
  const t = otMats(e)
  const h = 0.9
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    k.cyl(p, 0.016, 0.016, h - 0.1, c.ss, sx * (w / 2 - 0.04), (h - 0.1) / 2 + 0.08, sz * (d / 2 - 0.04), 10)
    castor(e, p, sx * (w / 2 - 0.04), sz * (d / 2 - 0.04), 0.04)
  }
  k.box(p, w - 0.06, 0.012, d - 0.06, c.ss, 0, 0.3, 0)
  k.box(p, w, 0.025, d, c.ss, 0, h - 0.012, 0)
  put(p, drape(e, `btDrape${w}${d}`, w + 0.04, d + 0.04, 0.45, 0.06, seed), t.drapeGreen, 0, h + 0.002, 0)
  for (let i = 0; i < 3; i++) instrumentTray(e, p, -w / 2 + 0.25 + i * 0.5, h + 0.012, -0.08, 0, seed + i)
  kidneyTray(e, p, w / 2 - 0.15, h + 0.012, d / 2 - 0.13)
  kidneyTray(e, p, w / 2 - 0.42, h + 0.012, d / 2 - 0.13, 0.3)
  gauzePacks(e, p, -w / 2 + 0.15, h + 0.012, d / 2 - 0.12, 4)
  // A gown and towel pack, opened, at the back corner.
  k.soft(p, 0.3, 0.05, 0.22, 0.012, c.wrapGreen, -w / 2 + 0.25, h + 0.04, -d / 2 + 0.14)
}

/** A theatre wall display (face at z = 0) with the patient's imaging, `w` across at centre height y. */
export function pacsDisplay(e: OpdCtx, p: Object3D, key: string, w: number, y: number) {
  const { k } = e
  const c = otKitMats(e)
  const h = w * 0.5625
  k.soft(p, w + 0.04, h + 0.04, 0.05, 0.01, c.bezel, 0, y, 0.025)
  const scr = e.o.screen(`pacs_${key}`, 1024, 576, (g, ww, hh) => {
    g.fillStyle = '#000000'
    g.fillRect(0, 0, ww, hh)
    // Four panes of cross-sectional images: an axial slice's body outline, organs, the spine.
    const pane = (px: number, py: number, pw: number, ph: number, s: number) => {
      g.save()
      g.translate(px + pw / 2, py + ph / 2)
      g.fillStyle = '#2a2a2a'
      g.beginPath()
      g.ellipse(0, 0, pw * 0.42, ph * 0.36, 0, 0, PI * 2)
      g.fill()
      g.fillStyle = '#8c8c8c'
      g.beginPath()
      g.ellipse(0, 0, pw * 0.39, ph * 0.33, 0, 0, PI * 2)
      g.fill()
      g.fillStyle = '#5b5b5b'
      g.beginPath()
      g.ellipse(-pw * 0.14, -ph * 0.04, pw * 0.15, ph * 0.13, 0.3 + s, 0, PI * 2)
      g.fill()
      g.beginPath()
      g.ellipse(pw * 0.15, ph * 0.02, pw * 0.09, ph * 0.1, -0.2, 0, PI * 2)
      g.fill()
      g.fillStyle = '#e8e8e8'
      g.beginPath()
      g.arc(0, ph * 0.2, pw * 0.05, 0, PI * 2)
      g.fill()
      g.fillStyle = '#d0d0d0'
      g.fillRect(-pw * 0.02, ph * 0.08, pw * 0.04, ph * 0.06)
      g.restore()
      g.fillStyle = '#e0c060'
      g.font = '600 13px Helvetica'
      g.fillText(`SE ${3 + s} · IM ${42 + s * 7}`, px + 8, py + 18)
    }
    pane(0, 0, ww / 2 - 2, hh / 2 - 2, 0)
    pane(ww / 2 + 2, 0, ww / 2 - 2, hh / 2 - 2, 1)
    pane(0, hh / 2 + 2, ww / 2 - 2, hh / 2 - 2, 2)
    pane(ww / 2 + 2, hh / 2 + 2, ww / 2 - 2, hh / 2 - 2, 3)
    g.fillStyle = '#ffffff'
    g.font = '700 16px Helvetica'
    g.fillText('PACS · CT ABDOMEN WITH CONTRAST', 10, hh - 10)
  }, 0.9)
  face(e, p, w, h, scr, 0, y, 0.051)
}
