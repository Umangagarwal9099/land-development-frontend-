import { CylinderGeometry, DoubleSide, ExtrudeGeometry, MeshPhysicalMaterial, MeshStandardMaterial, Shape, TorusGeometry, type Material, type Object3D } from 'three'
import { PI } from '../../../kit'
import { rng } from '../../../textures'
import { bentTube, carcass, castor, cupboardDoor, drawer, face, geo, group, lathe, panel, put, rod, tube } from '../../erKit'
import { packs } from '../../erFurniture'
import type { OpdCtx } from '../ctx'
import { bottle, reagentBottles } from '../furniture'

/*
 * The laboratory's furniture and analysers, modelled on the products a hospital laboratory in
 * India actually runs, at their catalogue sizes: epoxy-resin benches on laminate base units with
 * cantilevered reagent shelving, gooseneck lab taps and an eyewash; 5-part and 3-part haematology
 * counters, a floor-standing chemistry analyser, chemiluminescence and ELISA systems, benchtop and
 * refrigerated centrifuges, binocular microscopes, a Class II biosafety cabinet, incubators, a
 * vertical autoclave; and the collection room's phlebotomy chairs, trays, barcoded tubes.
 *
 * Products are built as products are made: moulded shells with radiused edges, the seams between
 * their panels, vent grilles, rubber feet, labels and status LEDs, live screens. Every piece is in
 * its own frame, front towards +z, standing on y = 0 (a benchtop piece on the bench's top: place
 * its group at the worktop's height).
 */

/* ---------- finishes ---------- */

const cache = new WeakMap<object, ReturnType<typeof make>>()

function make(e: OpdCtx) {
  const std = (color: string, roughness = 0.5, metalness = 0) => new MeshStandardMaterial({ color, roughness, metalness })
  const phys = (color: string, roughness: number, clearcoat = 0.25) => new MeshPhysicalMaterial({ color, roughness, clearcoat, clearcoatRoughness: 0.5 })
  const clear = (color: string, opacity: number, roughness = 0.08) => {
    const mat = new MeshPhysicalMaterial({ color, roughness, transparent: true, opacity, depthWrite: false })
    mat.userData.mergeable = true
    return mat
  }
  return {
    /** Black epoxy-resin worktop, chemical resistant, a faint satin. */
    resin: std('#1e2124', 0.42),
    /** Analyser casings: off-white ABS mouldings, the light warm grey of their side panels, a darker trim. */
    shell: phys('#ebece8', 0.42),
    shellGrey: phys('#c3c7c9', 0.45),
    trim: phys('#5b6168', 0.4),
    darkTrim: phys('#2c3035', 0.38),
    accent: std('#2b6fa8', 0.45),
    /** The shadow of a seam between moulded panels. */
    seam: std('#55595e', 0.7),
    foot: std('#151618', 0.85),
    /** Satin stainless for large surfaces (autoclave drums, sinks, pass boxes), lighter than polished. */
    satin: std('#c9cdd0', 0.38, 0.55),
    /** Powder-coated steel (stands, frames), brushed stainless is the department's. */
    powderWhite: std('#e2e3e0', 0.5, 0.15),
    /** Blood tube caps, colour-coded: EDTA lavender, plain red, SST gold, citrate light blue, fluoride grey, heparin green. */
    caps: [std('#8e6bbf', 0.48), std('#c8161d', 0.48), std('#e2b21c', 0.48), std('#7fc4e8', 0.48), std('#9aa0a6', 0.48), std('#2e9b4f', 0.48)],
    blood: std('#4f0a0d', 0.3),
    serum: clear('#e7c56a', 0.85, 0.15),
    urine: clear('#e9c94a', 0.82, 0.12),
    tubeGlass: clear('#eef4f5', 0.32, 0.06),
    smoked: clear('#6c7a80', 0.42, 0.1),
    agar: std('#b8442b', 0.35),
    agarBlood: std('#8c1e1c', 0.35),
    cuvette: std('#d6dadc', 0.3),
    /** A tube's barcode label, the printed white paper with its bars. */
    label: (() => {
      const mat = e.o.sign('tubeLabel', 128, 64, (g, w, h) => {
        g.fillStyle = '#fbfbf7'
        g.fillRect(0, 0, w, h)
        const r = rng(331)
        g.fillStyle = '#111'
        for (let x = 6; x < w * 0.62; ) {
          const bw = 1 + Math.floor(r() * 3)
          g.fillRect(x, h * 0.18, bw, h * 0.5)
          x += bw + 1 + Math.floor(r() * 2)
        }
        g.font = `600 ${h * 0.16}px Helvetica`
        g.fillText('L-24-0113', 6, h * 0.86)
        g.fillRect(w * 0.7, h * 0.2, w * 0.25, h * 0.06)
        g.fillRect(w * 0.7, h * 0.35, w * 0.2, h * 0.06)
      }, 0.7)
      mat.side = DoubleSide
      return mat
    })(),
    /** Slotted vent grilles, moulded into casings. */
    vent: e.o.sign('ventGrille', 128, 128, (g, w, h) => {
      g.fillStyle = '#d9dbd8'
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#2b2e31'
      for (let y = 6; y < h - 6; y += 12) g.fillRect(8, y, w - 16, 5)
    }, 0.6),
    ventDark: e.o.sign('ventGrilleDark', 128, 128, (g, w, h) => {
      g.fillStyle = '#3a3e42'
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#0d0e10'
      for (let y = 6; y < h - 6; y += 12) g.fillRect(8, y, w - 16, 5)
    }, 0.6),
    /** Perforated stainless (a work tray, a drainboard). */
    perforated: e.o.sign('perforated', 128, 128, (g, w, h) => {
      g.fillStyle = '#c7cacc'
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#41464b'
      for (let y = 4; y < h; y += 8) for (let x = (y / 8) % 2 ? 4 : 8; x < w; x += 8) g.fillRect(x - 1.5, y - 1.5, 3, 3)
    }, 0.4),
  }
}

/** The lab's own finishes, made once per model. */
export function labMats(e: OpdCtx) {
  let c = cache.get(e.o)
  if (!c) cache.set(e.o, (c = make(e)))
  return c
}

/* ---------- details every product has ---------- */

/** Rubber feet under a benchtop unit's footprint, w × d about its centre (cx, cz). */
export function feet(e: OpdCtx, p: Object3D, w: number, d: number, cx = 0, cz = 0) {
  const L = labMats(e)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) e.k.cyl(p, 0.012, 0.014, 0.012, L.foot, cx + sx * (w / 2 - 0.04), 0.006, cz + sz * (d / 2 - 0.04), 12)
}

/** A seam line on a face at z: a hairline of shadow between two moulded panels, horizontal or vertical. */
export function seam(e: OpdCtx, p: Object3D, len: number, x: number, y: number, z: number, vertical = false) {
  const L = labMats(e)
  e.k.box(p, vertical ? 0.0025 : len, vertical ? len : 0.0025, 0.002, L.seam, x, y, z, false)
}

/** A slotted vent grille on a face at z (facing +z, or turned by ry). */
export function grille(e: OpdCtx, p: Object3D, w: number, h: number, x: number, y: number, z: number, ry = 0, dark = false) {
  const L = labMats(e)
  return face(e, p, w, h, dark ? L.ventDark : L.vent, x, y, z, ry)
}

/** A status LED: a small lit lens. */
export function led(e: OpdCtx, p: Object3D, x: number, y: number, z: number, colour: 'green' | 'amber' | 'blue' | 'red' = 'green') {
  const mat = e.o.screen(`led_${colour}`, 8, 8, (g, w, h) => {
    g.fillStyle = { green: '#3dff7a', amber: '#ffb020', blue: '#4aa8ff', red: '#ff3b30' }[colour]
    g.fillRect(0, 0, w, h)
  }, 1.6)
  return e.k.cyl(p, 0.0035, 0.0035, 0.003, mat, x, y, z, 10).rotateX(PI / 2)
}

/** A segment display or small LCD's picture: lines of text in a colour on a dark ground. */
export function lcd(e: OpdCtx, key: string, lines: string[], ink = '#7fd4ff', bg = '#081018', w = 128, h = 48) {
  return e.o.screen(`lcd_${key}`, w, h, (g, ww, hh) => {
    g.fillStyle = bg
    g.fillRect(0, 0, ww, hh)
    g.fillStyle = ink
    const n = lines.length
    g.font = `700 ${Math.floor((hh / n) * 0.62)}px "Helvetica Neue", Helvetica, Arial`
    g.textBaseline = 'middle'
    lines.forEach((l, i) => g.fillText(l, ww * 0.05, (hh * (i + 0.5)) / n))
  }, 1.05)
}

/** A membrane keypad: a dark panel with rows of small grey keys, w × h at (x, y, z) facing +z. */
export function keypad(e: OpdCtx, p: Object3D, w: number, h: number, cols: number, rows: number, x: number, y: number, z: number) {
  const { k, m } = e
  const L = labMats(e)
  k.box(p, w, h, 0.003, L.darkTrim, x, y, z + 0.0015, false)
  const kw = (w - 0.01) / cols
  const kh = (h - 0.01) / rows
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) k.box(p, kw * 0.72, kh * 0.62, 0.003, (i + j) % 5 === 4 ? L.accent : m.greyPlastic, x - w / 2 + 0.005 + kw * (i + 0.5), y - h / 2 + 0.005 + kh * (j + 0.5), z + 0.004, false)
}

/** A flat touch screen in a thin black bezel, w × h, its picture `mat`, centred at (x, y, z) in p, tilted back by `tilt`. */
export function touchScreen(e: OpdCtx, p: Object3D, w: number, h: number, mat: Material, x: number, y: number, z: number, tilt = 0) {
  const { k, m } = e
  const g = group(p, x, y, z)
  g.rotation.x = -tilt
  k.soft(g, w + 0.024, h + 0.024, 0.022, 0.006, m.black, 0, 0, -0.011)
  face(e, g, w, h, mat, 0, 0, 0.0005)
  return g
}

/* ---------- blood tubes ---------- */

/**
 * A 13 × 75 mm evacuated blood tube: PET with its rounded bottom, the blood (or separated serum
 * over the clot) inside, the barcode label wrapped round it, the colour-coded safety cap with its
 * grip ribs. Standing on y = 0 at (x, z) in p.
 */
export function bloodTube(e: OpdCtx, p: Object3D, x: number, y: number, z: number, cap: number, fill: 'blood' | 'serum' | 'empty' = 'blood', labelled = true) {
  const L = labMats(e)
  const glass = lathe(e, 'bloodTubeGlass', [[0, 0.002], [0.0042, 0.0004], [0.0063, 0.004], [0.0064, 0.075], [0, 0.075]], 10)
  const fillGeo = lathe(e, 'bloodTubeFill', [[0, 0.0026], [0.0039, 0.0012], [0.0058, 0.0045], [0.0058, 0.05], [0, 0.05]], 10)
  const clot = lathe(e, 'bloodTubeClot', [[0, 0.0026], [0.0039, 0.0012], [0.0058, 0.0045], [0.0058, 0.026], [0, 0.026]], 10)
  const capGeo = lathe(e, 'bloodTubeCap', [[0, 0.069], [0.0068, 0.069], [0.0082, 0.072], [0.0082, 0.086], [0.0072, 0.0905], [0.0035, 0.0915], [0, 0.0915]], 12)
  const labelGeo = geo(e, 'bloodTubeLabel', () => new CylinderGeometry(0.00655, 0.00655, 0.04, 10, 1, true, -0.4, 4.4))
  put(p, glass, L.tubeGlass, x, y, z, false)
  if (fill === 'blood') put(p, fillGeo, L.blood, x, y, z, false)
  else if (fill === 'serum') {
    put(p, clot, L.blood, x, y, z, false)
    put(p, lathe(e, 'bloodTubeSerum', [[0, 0.026], [0.0058, 0.026], [0.0058, 0.052], [0, 0.052]], 10), L.serum, x, y, z, false)
  }
  put(p, capGeo, L.caps[cap % L.caps.length], x, y, z, false)
  if (labelled) put(p, labelGeo, L.label, x, y + 0.04, z, false)
}

/**
 * A white 50-place tube rack (5 × 10 at 22 mm) in polypropylene: its perforated top deck and its
 * base on end walls, the tubes standing in it; `cols` × `rows` of it filled.
 */
export function tubeRack(e: OpdCtx, p: Object3D, x: number, y: number, z: number, cols = 6, rows = 2, ry = 0, seed = 1) {
  const { k } = e
  const g = group(p, x, y, z, ry)
  const pitch = 0.022
  const w = cols * pitch + 0.016
  const dd = rows * pitch + 0.016
  const deck = geo(e, `rackDeck${cols}|${rows}`, () => panel(e, w, dd, 0.004, 0.004, Array.from({ length: cols * rows }, (_, i) => [0.015, 0.015, -w / 2 + 0.008 + pitch * ((i % cols) + 0.5), -dd / 2 + 0.008 + pitch * (Math.floor(i / cols) + 0.5), 0.0074])))
  for (const yy of [0.05, 0.003]) put(g, deck, e.m.whitePlastic, 0, yy, 0, false).rotation.x = PI / 2
  for (const s of [-1, 1]) k.box(g, 0.005, 0.05, dd, e.m.whitePlastic, s * (w / 2 - 0.0025), 0.026, 0, false)
  const r = rng(seed)
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      if (r() < 0.22) continue
      const tx = -w / 2 + 0.008 + pitch * (i + 0.5)
      const tz = -dd / 2 + 0.008 + pitch * (j + 0.5)
      const c = Math.floor(r() * 6)
      bloodTube(e, g, tx, 0.004, tz, c, c === 1 || c === 2 ? 'serum' : 'blood', j === rows - 1)
    }
  return g
}

/** Unopened evacuated tubes in their cardboard dispenser boxes, one box per cap colour, on a tray. */
export function tubeTray(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const L = labMats(e)
  const g = group(p, x, y, z, ry)
  k.box(g, 0.34, 0.012, 0.22, m.whitePlastic, 0, 0.006, 0, false)
  for (let i = 0; i < 5; i++) {
    const bx = -0.13 + i * 0.065
    k.box(g, 0.058, 0.06, 0.2, m.paper, bx, 0.042, 0, false)
    k.box(g, 0.058, 0.012, 0.2, L.caps[i], bx, 0.066, 0, false)
    for (let j = 0; j < 3; j++) put(g, lathe(e, 'bloodTubeCap', [[0, 0.069], [0.0068, 0.069], [0.0082, 0.072], [0.0082, 0.086], [0.0072, 0.0905], [0.0035, 0.0915], [0, 0.0915]], 12), L.caps[i], bx, 0.004, -0.06 + j * 0.03, false)
  }
  return g
}

/** A disposable syringe lying on its side, `ml` 2, 5 or 10: the barrel with its graduations, plunger, the capped needle. */
export function syringe(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0, ml: 2 | 5 | 10 = 5) {
  const { m } = e
  const L = labMats(e)
  const s = ml === 10 ? 1.2 : ml === 5 ? 1 : 0.8
  const g = group(p, x, y + 0.0075 * s, z, ry)
  const barrel = lathe(e, `syrBarrel${ml}`, [[0, 0], [0.0035 * s, 0], [0.0075 * s, 0.006], [0.0075 * s, 0.07 * s], [0.012 * s, 0.071 * s], [0.012 * s, 0.074 * s], [0, 0.074 * s]], 12)
  const plunger = lathe(e, `syrPlunger${ml}`, [[0, 0.02 * s], [0.0068 * s, 0.02 * s], [0.0068 * s, 0.028 * s], [0.002 * s, 0.03 * s], [0.002 * s, 0.1 * s], [0.009 * s, 0.1 * s], [0.009 * s, 0.103 * s], [0, 0.103 * s]], 10)
  const tip = lathe(e, 'syrTip', [[0, -0.022], [0.0045, -0.022], [0.0045, 0.0], [0, 0.0]], 10)
  for (const [gg, mat] of [[barrel, L.tubeGlass], [plunger, m.whitePlastic], [tip, L.caps[3]]] as const) put(g, gg, mat, 0, 0, 0, false).rotation.z = PI / 2
  // The graduations: a strip of fine black lines printed on the barrel.
  e.k.box(g, 0.05 * s, 0.0005, 0.004, m.black, -0.035 * s, 0.0075 * s, 0, false)
  return g
}

/** A needle holder with a multi-sample needle capped in it, lying on its side. */
export function needleHolder(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0, cap = 5) {
  const { m } = e
  const L = labMats(e)
  const g = group(p, x, y + 0.009, z, ry)
  const h = lathe(e, 'needleHolder', [[0.0075, 0], [0.0085, 0], [0.0085, 0.045], [0.013, 0.047], [0.013, 0.05], [0.0075, 0.05]], 12)
  put(g, h, m.clearPlastic, 0, 0, 0, false).rotation.z = PI / 2
  put(g, lathe(e, 'needleCap', [[0, 0], [0.004, 0], [0.004, 0.03], [0.0025, 0.034], [0, 0.034]], 10), L.caps[cap], 0, 0, 0, false).rotation.z = -PI / 2
  return g
}

/** A latex-free tourniquet: a blue elastic strap with its push-release buckle, lying looped. */
export function tourniquet(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { m } = e
  const g = group(p, x, y, z, ry)
  const pts: [number, number, number][] = []
  for (let i = 0; i <= 18; i++) {
    const a = (i / 18) * PI * 1.85
    pts.push([Math.cos(a) * 0.07, 0.004 + Math.sin(i * 0.7) * 0.001, Math.sin(a) * 0.04])
  }
  put(g, tube(e, 'tourniquetBand', pts, 0.006), m.blue, 0, 0, 0, false).scale.set(1, 0.4, 1)
  e.k.soft(g, 0.035, 0.014, 0.03, 0.005, m.black, 0.07, 0.007, 0)
  e.k.box(g, 0.012, 0.004, 0.016, m.greyPlastic, 0.07, 0.015, 0, false)
  return g
}

/**
 * A phlebotomist's tray: a moulded tray with compartments, laid with needle holders and capped
 * needles, syringes, a tourniquet, a cotton wool dispenser, alcohol swab sachets, plasters.
 */
export function phlebotomyTray(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  const tray = geo(e, 'phlebTray', () => panel(e, 0.36, 0.25, 0.008, 0.02))
  put(g, tray, m.blue, 0, 0.004, 0, false).rotation.x = PI / 2
  for (const s of [-1, 1]) k.box(g, 0.36, 0.035, 0.006, m.blue, 0, 0.022, s * 0.122, false)
  for (const s of [-1, 1]) k.box(g, 0.006, 0.035, 0.25, m.blue, s * 0.177, 0.022, 0, false)
  k.box(g, 0.006, 0.03, 0.24, m.blue, 0.03, 0.02, 0, false)
  for (let i = 0; i < 3; i++) needleHolder(e, g, -0.1, 0.008, -0.08 + i * 0.03, 0, [5, 3, 1][i])
  syringe(e, g, -0.1, 0.008, 0.03, 0, 5)
  syringe(e, g, -0.1, 0.008, 0.06, 0, 2)
  tourniquet(e, g, 0.11, 0.008, -0.05, 0.4)
  // Cotton wool in its dispenser jar, swab sachets, a strip of plasters.
  k.cyl(g, 0.03, 0.03, 0.05, m.clearPlastic, 0.12, 0.033, 0.07, 18)
  k.blob(g, 0.026, m.paper, 0.12, 0.05, 0.07, 0.8)
  for (let i = 0; i < 6; i++) k.box(g, 0.03, 0.002, 0.03, i % 2 ? m.paper : e.m.whitePlastic, 0.065 + (i % 2) * 0.006, 0.01 + i * 0.002, 0.07 + (i % 3) * 0.004, false)
  k.box(g, 0.07, 0.002, 0.02, e.m.vacuum, -0.02, 0.009, 0.1, false)
  return g
}

/** A desktop barcode label printer (thermal transfer, 4") with a label hanging from its mouth. */
export function labelPrinter(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const L = labMats(e)
  const g = group(p, x, y, z, ry)
  k.soft(g, 0.12, 0.11, 0.2, 0.025, m.charcoal, 0, 0.055, 0)
  seam(e, g, 0.115, 0, 0.085, 0.1)
  k.box(g, 0.08, 0.004, 0.002, m.black, 0, 0.04, 0.1, false)
  k.box(g, 0.06, 0.0008, 0.03, L.label, 0, 0.038, 0.115, false)
  led(e, g, 0.04, 0.09, 0.1, 'green')
  k.cyl(g, 0.007, 0.007, 0.004, m.greyPlastic, -0.04, 0.09, 0.1, 12).rotateX(PI / 2)
  return g
}

/* ---------- benches ---------- */

export interface BenchOpts {
  d?: number
  /** A sink inset at this x, with its gooseneck tap and an eyewash beside it. */
  sink?: number
  /** Reagent shelving on the wall over it. */
  upper?: boolean
  /** One unit of drawers that open (at this x); the rest of the run's fronts are fixed. */
  drawers?: number
  /** Leave this span (x0, x1) open under the top, a knee space for sitting work. */
  knee?: [number, number]
}

/**
 * A gooseneck laboratory tap: a chrome swan neck on its deck flange, a three-way hand wheel each
 * side (water and the second service), the serrated nozzle; standing on y = 0.
 */
export function labTap(e: OpdCtx, p: Object3D, x: number, y: number, z: number) {
  const { m } = e
  const g = group(p, x, y, z)
  put(g, lathe(e, 'labTapFlange', [[0, 0], [0.028, 0], [0.028, 0.008], [0.018, 0.016], [0.014, 0.05], [0, 0.05]], 18), m.chrome, 0, 0, 0, false)
  put(g, bentTube(e, 'labGooseneck', [[0, 0.05, 0], [0, 0.3, 0], [0, 0.36, 0.06], [0, 0.32, 0.17], [0, 0.26, 0.19]], 0.011, 0.07), m.chrome, 0, 0, 0, false)
  put(g, lathe(e, 'labNozzle', [[0, 0], [0.006, 0], [0.007, 0.012], [0.005, 0.016], [0.0065, 0.022], [0, 0.022]], 12), m.chrome, 0, 0.238, 0.19, false)
  for (const s of [-1, 1]) {
    rod(e, g, 0.008, 0.06, m.chrome, s * 0.04, 0.045, 0, 'x', 10)
    const wheel = group(g, s * 0.075, 0.045, 0)
    for (let i = 0; i < 3; i++) {
      const arm = e.k.cyl(wheel, 0.004, 0.004, 0.06, m.chrome, 0, 0, 0, 8)
      arm.rotation.x = (i / 3) * PI
    }
    e.k.cyl(wheel, 0.01, 0.01, 0.012, s < 0 ? m.blue : m.red, 0, 0, 0, 12).rotation.z = PI / 2
  }
}

/**
 * A bench-mounted emergency eyewash: the twin spray heads with their yellow flip-off dust caps on
 * a green bowl, swung over the sink, its push flag; on y = 0.
 */
export function eyewash(e: OpdCtx, p: Object3D, x: number, y: number, z: number) {
  const { k, m } = e
  const g = group(p, x, y, z)
  put(g, lathe(e, 'eyewashFlange', [[0, 0], [0.026, 0], [0.026, 0.006], [0.013, 0.012], [0.012, 0.08], [0, 0.08]], 16), m.chrome, 0, 0, 0, false)
  put(g, bentTube(e, 'eyewashArm', [[0, 0.08, 0], [0, 0.1, 0.02], [0, 0.1, 0.14]], 0.011, 0.03), m.chrome, 0, 0, 0, false)
  put(g, lathe(e, 'eyewashBowl', [[0, 0], [0.05, 0.002], [0.075, 0.03], [0.077, 0.034], [0, 0.026]], 20), m.green, 0, 0.1, 0.16, false)
  for (const s of [-1, 1]) {
    k.cyl(g, 0.012, 0.012, 0.03, m.chrome, s * 0.028, 0.125, 0.16, 12)
    k.cyl(g, 0.015, 0.015, 0.008, m.sharps, s * 0.028, 0.143, 0.16, 14)
  }
  k.box(g, 0.05, 0.035, 0.004, m.green, 0.07, 0.11, 0.08, false)
}

/**
 * A twin switched socket plate on a bench upstand or wall (Indian 6/16 A modular, white), facing
 * +z, centred at (x, y, z).
 */
export function socketPlate(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.soft(g, 0.15, 0.086, 0.01, 0.003, e.m.whitePlastic, 0, 0, 0.005)
  for (const s of [-1, 1]) {
    k.box(g, 0.022, 0.05, 0.004, e.m.whitePlastic, s * 0.05, 0, 0.011, false)
    for (const [dx, dy, r] of [[0, 0.012, 0.0035], [-0.008, -0.006, 0.0026], [0.008, -0.006, 0.0026]] as const) k.cyl(g, r, r, 0.003, m.darkPlastic, s * 0.018 + dx, dy, 0.0105, 8).rotation.x = PI / 2
  }
  led(e, g, 0, 0.03, 0.011, 'red')
  return g
}

/**
 * A laboratory bench, `len` along x: white laminate base units on a recessed plinth (drawer and
 * door fronts with their reveals and D-pulls), a 25 mm black epoxy-resin worktop at 0.9 m with a
 * marine edge and a 100 mm upstand against the wall carrying the bench's socket plates; front at
 * z = 0 and back at −d.
 */
export function bench(e: OpdCtx, p: Object3D, len: number, o: BenchOpts = {}) {
  const { k, m } = e
  const L = labMats(e)
  const d = o.d ?? 0.75
  const n = Math.max(1, Math.round(len / 0.6))
  const uw = len / n
  const inKnee = (x: number) => !!o.knee && x > o.knee[0] && x < o.knee[1]
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + uw * (i + 0.5)
    if (inKnee(x)) continue
    if (o.drawers !== undefined && Math.abs(x - o.drawers) < uw / 2) {
      const u = group(p, x, 0, -0.02)
      carcass(e, u, uw, 0.87, d - 0.07, m.hpl, [], 0.1)
      for (let j = 0; j < 3; j++) drawer(e, u, 0, 0.74 - j * 0.24, 0, { w: uw - 0.006, h: 0.235, d: d - 0.12, front: m.hpl, handle: 'bar', label: 'Bench Drawer', fill: packs(e, [m.whitePlastic, m.blue, m.paper, m.binBlue], [0.08, 0.05, 0.12]) })
      continue
    }
    // A fixed unit: carcass on its plinth, the door front with its reveal and pull.
    k.box(p, uw - 0.004, 0.1, d - 0.12, m.skirting, x, 0.05, -d / 2 - 0.04)
    k.box(p, uw - 0.004, 0.77, d - 0.07, m.hpl, x, 0.485, -d / 2 - 0.035)
    k.box(p, uw - 0.008, 0.755, 0.018, m.hpl, x, 0.4825, -0.029, false)
    seam(e, p, 0.755, x - uw / 2 + 0.002, 0.4825, -0.019, true)
    if (i % 2 === 0) seam(e, p, uw - 0.01, x, 0.72, -0.019)
    put(p, bentTube(e, 'benchPull', [[0, -0.06, 0], [0, -0.06, 0.025], [0, 0.06, 0.025], [0, 0.06, 0]], 0.005, 0.01), m.stainless, x + uw / 2 - 0.06, 0.6, -0.019, false)
  }
  if (o.knee) {
    // A modesty panel at the back of the knee space; the worktop's support rail under its front.
    k.box(p, o.knee[1] - o.knee[0], 0.6, 0.018, m.hpl, (o.knee[0] + o.knee[1]) / 2, 0.55, -d + 0.04)
    k.box(p, o.knee[1] - o.knee[0], 0.04, 0.03, m.powder, (o.knee[0] + o.knee[1]) / 2, 0.85, -0.05)
  }
  // The worktop: 25 mm resin with a raised marine edge at the front, the upstand at the back.
  k.box(p, len + 0.02, 0.025, d, L.resin, 0, 0.8875, -d / 2)
  k.box(p, len + 0.02, 0.006, 0.012, L.resin, 0, 0.903, -0.006, false)
  k.box(p, len + 0.02, 0.1, 0.015, L.resin, 0, 0.95, -d + 0.0075)
  // Socket plates along the upstand every 1.2 m (clear of the sink).
  const sockets = Math.max(1, Math.round(len / 1.2))
  for (let i = 0; i < sockets; i++) {
    const sx = -len / 2 + ((i + 0.5) * len) / sockets
    if (o.sink !== undefined && Math.abs(sx - o.sink) < 0.55) continue
    socketPlate(e, p, sx, 0.955, -d + 0.016)
  }
  if (o.sink !== undefined) {
    const sx = o.sink
    // An undermounted polypropylene lab sink, its drain grid, the gooseneck tap and the eyewash.
    k.box(p, 0.46, 0.006, 0.34, L.resin, sx, 0.9015, -d / 2 - 0.02, false)
    k.box(p, 0.42, 0.003, 0.3, m.black, sx, 0.9035, -d / 2 - 0.02, false)
    k.box(p, 0.42, 0.22, 0.3, L.darkTrim, sx, 0.79, -d / 2 - 0.02, false)
    k.cyl(p, 0.03, 0.03, 0.002, m.stainless, sx, 0.9055, -d / 2 - 0.02, 16)
    labTap(e, p, sx, 0.9, -d + 0.07)
    eyewash(e, p, sx + 0.38, 0.9, -d + 0.07)
  }
  if (o.upper) {
    // Cantilevered reagent shelving on twin-slot uprights: two shelves of bottles and kits.
    const ups = Math.max(2, Math.round(len / 1.0) + 1)
    for (let i = 0; i < ups; i++) {
      const ux = -len / 2 + 0.05 + (i * (len - 0.1)) / (ups - 1)
      k.box(p, 0.025, 0.95, 0.012, m.aluminium, ux, 1.52, -d + 0.006)
      for (const y of [1.28, 1.66]) k.box(p, 0.01, 0.06, 0.3, m.aluminium, ux, y - 0.035, -d + 0.16)
    }
    for (const y of [1.28, 1.66]) {
      k.box(p, len - 0.04, 0.018, 0.3, m.hpl, 0, y, -d + 0.165)
      reagentBottles(e, p, len - 0.1, y + 0.01, -d + 0.31, 0.26)
    }
  }
}

/* ---------- haematology ---------- */

/**
 * A 5-part differential haematology analyser (a 0.62 × 0.75 × 0.68 m cabinet, as the XN-class
 * counters are): moulded front covers with the seams between them, the touch screen set in the
 * sloped top, the closed-tube sampler bay with its start button and a tube in it, the status lamp
 * bar, side vents, the reagent lines out of its side to the diluent cube on the floor; with
 * `loader`, the rack sampler along its front with its racks of tubes and the IPU's monitor.
 * Compact (no loader) it is a 3-part counter: smaller, its screen on the front.
 */
export function haemAnalyser(e: OpdCtx, p: Object3D, loader = false) {
  const { k, m } = e
  const L = labMats(e)
  if (!loader) {
    // A 3-part benchtop counter: 0.34 × 0.42 × 0.38 m.
    k.soft(p, 0.34, 0.42, 0.38, 0.03, L.shell, 0, 0.21, -0.19)
    k.box(p, 0.3, 0.03, 0.35, L.shellGrey, 0, 0.015, -0.19)
    seam(e, p, 0.32, 0, 0.36, 0.001)
    touchScreen(e, p, 0.2, 0.13, e.o.his('haem3', 'CBC · 3-DIFF', 'table'), -0.03, 0.27, 0.01, 0.12)
    // The open-tube aspiration probe under its shield, the start plate behind it.
    k.box(p, 0.07, 0.06, 0.04, L.shellGrey, 0.12, 0.13, 0.01)
    k.cyl(p, 0.0015, 0.0015, 0.04, m.chrome, 0.12, 0.09, 0.02, 6)
    k.box(p, 0.04, 0.02, 0.006, L.accent, 0.12, 0.18, 0.033, false)
    led(e, p, 0.14, 0.38, 0.002, 'green')
    grille(e, p, 0.25, 0.2, 0.171, 0.22, -0.19, PI / 2)
    feet(e, p, 0.3, 0.34, 0, -0.19)
    return
  }
  // The cabinet stands back from the group's origin (z −0.2 … −0.68); its rack sampler fills the
  // 0.2 m in front of it, so the whole fits a 0.75 m bench placed with its origin 0.22 m back.
  const W = 0.62
  const D = 0.48
  const H = 0.74
  const back = group(p, 0, 0, -0.2)
  p = back
  k.box(p, W - 0.02, 0.05, D - 0.04, L.darkTrim, 0, 0.025, -D / 2)
  k.soft(p, W, H - 0.05, D, 0.035, L.shell, 0, 0.05 + (H - 0.05) / 2, -D / 2)
  // Front covers: an upper and a lower, split by a seam; the lower one's two latches.
  seam(e, p, W - 0.04, 0, 0.42, 0.001)
  seam(e, p, 0.36, -0.12, 0.25, 0.001, true)
  for (const x of [-0.24, 0.24]) k.box(p, 0.04, 0.012, 0.006, L.shellGrey, x, 0.4, 0.004, false)
  // The status lamp bar across the top of the front.
  k.box(p, W - 0.1, 0.012, 0.006, e.o.screen('haemStatus', 16, 4, (g, w, h) => {
    g.fillStyle = '#39d97a'
    g.fillRect(0, 0, w, h)
  }, 1.4), 0, H - 0.05, 0.004, false)
  // The sampler bay: a recess with the tube holder, a capped tube in it, the start button.
  k.box(p, 0.16, 0.16, 0.08, L.darkTrim, 0.17, 0.55, -0.03)
  k.box(p, 0.14, 0.012, 0.06, L.shellGrey, 0.17, 0.48, -0.02)
  bloodTube(e, p, 0.17, 0.486, -0.02, 0, 'blood')
  k.cyl(p, 0.014, 0.014, 0.008, L.accent, 0.27, 0.6, 0.001, 18).rotation.x = PI / 2
  // The sloped top with the touch screen; vents on both sides.
  touchScreen(e, p, 0.3, 0.19, e.o.his('haemScreen', 'XN · CBC + 5-DIFF', 'table'), -0.12, 0.6, 0.01, 0.14)
  for (const s of [-1, 1]) grille(e, p, 0.4, 0.3, s * (W / 2 + 0.001), 0.4, -D / 2, s * PI / 2)
  // Reagent lines from its side down to the diluent cube on the floor beside it.
  const cube = group(p, W / 2 + 0.2, 0, -0.25)
  k.box(cube, 0.24, 0.3, 0.26, m.paper, 0, 0.15, 0)
  k.box(cube, 0.24, 0.06, 0.004, L.accent, 0, 0.22, 0.131, false)
  k.cyl(cube, 0.03, 0.03, 0.03, m.blue, 0.06, 0.315, 0, 14)
  put(p, tube(e, 'haemDiluentLine', [[W / 2, 0.3, -0.4], [W / 2 + 0.08, 0.25, -0.35], [W / 2 + 0.26, 0.35, -0.25]], 0.004), m.clearPlastic, 0, 0, 0, false)
  // The rack sampler along its front: two lanes of 10-tube racks moving across, its own cover.
  const sampler = group(p, 0, 0, 0.1)
  k.soft(sampler, W + 0.1, 0.07, 0.19, 0.02, L.shellGrey, 0.05, 0.035, 0)
  k.box(sampler, W + 0.06, 0.004, 0.15, L.darkTrim, 0.05, 0.072, 0, false)
  for (let i = 0; i < 4; i++) {
    const r = group(sampler, -0.17 + (i % 2) * 0.27, 0.072, i < 2 ? -0.035 : 0.035)
    k.box(r, 0.22, 0.03, 0.025, e.m.whitePlastic, 0, 0.015, 0, false)
    for (let j = 0; j < 10; j++) if ((i * 10 + j) % 7 !== 3) bloodTube(e, r, -0.1 + j * 0.0222, 0.02, 0, 0, 'blood', j % 2 === 0)
  }
  // The IPU's monitor and keyboard on a swing arm at its left.
  const arm = group(p, -W / 2 - 0.2, 0, -0.25)
  k.cyl(arm, 0.02, 0.02, 0.02, L.darkTrim, 0, 0.75, 0, 16)
  const mon = group(arm, 0, 0.98, 0.05)
  k.box(mon, 0.52, 0.32, 0.03, m.black, 0, 0, 0)
  face(e, mon, 0.5, 0.3, e.o.his('haemIPU', 'IPU · VALIDATION', 'table'), 0, 0, 0.016)
  k.box(mon, 0.1, 0.18, 0.04, m.black, 0, -0.18, -0.03)
}

/**
 * A fully automated coagulation analyser (benchtop, 0.66 × 0.5 × 0.55 m): the moulded body with
 * its hinged smoked cover over the cuvette rotor and the 15 °C reagent tray, the sample rack bay,
 * the touch screen on the right, vents at the side.
 */
export function coagAnalyser(e: OpdCtx, p: Object3D) {
  const { k } = e
  const L = labMats(e)
  k.soft(p, 0.66, 0.36, 0.55, 0.03, L.shell, 0, 0.18, -0.275)
  seam(e, p, 0.62, 0, 0.25, 0.001)
  // The deck under the smoked cover: reagent wells, the cuvette rotor, the probe arm.
  k.box(p, 0.46, 0.012, 0.42, L.darkTrim, -0.08, 0.366, -0.27, false)
  k.cyl(p, 0.08, 0.08, 0.02, L.cuvette, -0.18, 0.38, -0.25, 24)
  for (let i = 0; i < 8; i++) k.cyl(p, 0.013, 0.013, 0.03, L.caps[i % 6], 0.02 + (i % 4) * 0.035, 0.385, -0.36 + Math.floor(i / 4) * 0.05, 12)
  k.cyl(p, 0.012, 0.012, 0.09, e.m.whitePlastic, -0.05, 0.41, -0.4, 12)
  k.box(p, 0.16, 0.02, 0.02, e.m.whitePlastic, -0.05, 0.455, -0.33, false)
  const cover = group(p, -0.08, 0.37, -0.48)
  cover.rotation.x = -0.12
  k.box(cover, 0.47, 0.006, 0.44, L.smoked, 0, 0.0, 0.21, false)
  k.box(cover, 0.12, 0.012, 0.012, L.shellGrey, 0, 0.0, 0.43, false)
  // The sample rack bay on the right of the deck, with a rack of citrate tubes.
  k.box(p, 0.14, 0.05, 0.3, L.darkTrim, 0.24, 0.345, -0.2)
  const r = group(p, 0.24, 0.37, -0.2, PI / 2)
  for (let j = 0; j < 8; j++) bloodTube(e, r, -0.08 + j * 0.022, 0, 0, 3, 'serum', j % 2 === 0)
  touchScreen(e, p, 0.17, 0.11, e.o.his('coagScreen', 'PT / INR · APTT', 'graph'), 0.2, 0.2, 0.012, 0.0)
  led(e, p, -0.29, 0.32, 0.002, 'green')
  grille(e, p, 0.3, 0.2, -0.331, 0.17, -0.27, -PI / 2)
  feet(e, p, 0.6, 0.5, 0, -0.275)
}

/** An automated slide stainer: a moulded body with its smoked lid over the reagent baths and slide carrier, a keypad and display. */
export function slideStainer(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.52, 0.22, 0.4, 0.025, L.shell, 0, 0.11, -0.2)
  seam(e, p, 0.48, 0, 0.17, 0.001)
  // The baths in a row under the lid, the slide basket on its transport arm.
  for (let i = 0; i < 6; i++) {
    k.box(p, 0.07, 0.01, 0.12, L.darkTrim, -0.18 + i * 0.072, 0.225, -0.22, false)
    k.box(p, 0.058, 0.004, 0.1, [m.blue, m.purple, m.red, e.m.whitePlastic, m.blue, m.purple][i], -0.18 + i * 0.072, 0.231, -0.22, false)
  }
  k.box(p, 0.06, 0.07, 0.04, m.stainless, -0.04, 0.28, -0.22, false)
  for (let i = 0; i < 5; i++) k.box(p, 0.002, 0.06, 0.026, L.tubeGlass, -0.055 + i * 0.008, 0.28, -0.22, false)
  const lid = group(p, 0, 0.225, -0.4)
  k.soft(lid, 0.5, 0.12, 0.38, 0.02, L.smoked, 0, 0.06, 0.19)
  keypad(e, p, 0.12, 0.05, 4, 2, 0.14, 0.09, 0.0)
  face(e, p, 0.08, 0.03, lcd(e, 'stainer', ['PROG 3  MGG', '04:12'], '#9cff9c', '#06140a'), -0.08, 0.1, 0.0015)
  feet(e, p, 0.46, 0.34, 0, -0.2)
}

/** A Westergren ESR stand: a white acrylic rack on levelling feet, ten tall graduated pipettes with their blood columns settled to different heights. */
export function esrStand(e: OpdCtx, p: Object3D) {
  const { k } = e
  const L = labMats(e)
  k.box(p, 0.3, 0.02, 0.08, e.m.whitePlastic, 0, 0.012, 0)
  for (const s of [-1, 1]) k.cyl(p, 0.008, 0.01, 0.006, L.foot, s * 0.13, 0.003, 0, 10)
  k.box(p, 0.3, 0.015, 0.03, e.m.whitePlastic, 0, 0.27, -0.01)
  for (const s of [-1, 1]) k.box(p, 0.015, 0.26, 0.03, e.m.whitePlastic, s * 0.142, 0.14, -0.01)
  for (let i = 0; i < 10; i++) {
    const x = -0.12 + i * 0.026
    k.cyl(p, 0.0032, 0.0032, 0.3, L.tubeGlass, x, 0.17, 0, 8)
    const fall = 0.02 + ((i * 37) % 10) * 0.004
    k.cyl(p, 0.0026, 0.0026, 0.2 - fall, L.blood, x, 0.03 + (0.2 - fall) / 2, 0, 8)
    k.cyl(p, 0.0026, 0.0026, fall, L.serum, x, 0.03 + 0.2 - fall / 2, 0, 8)
  }
}

/** A tube roller-mixer: six black rubber rollers in a white tray turning a row of EDTA tubes. */
export function tubeRoller(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.38, 0.07, 0.3, 0.02, L.shell, 0, 0.035, 0)
  k.box(p, 0.34, 0.01, 0.26, L.darkTrim, 0, 0.072, 0, false)
  for (let i = 0; i < 6; i++) rod(e, p, 0.011, 0.25, m.rubber, -0.14 + i * 0.056, 0.085, 0, 'z', 14)
  for (let i = 0; i < 5; i++) {
    const t = group(p, -0.112 + i * 0.056, 0.1, -0.04)
    t.rotation.x = PI / 2
    bloodTube(e, t, 0, -0.045, 0, 0, 'blood', true)
  }
  k.cyl(p, 0.012, 0.012, 0.01, L.accent, 0.15, 0.035, 0.151, 14).rotation.x = PI / 2
  led(e, p, 0.12, 0.04, 0.151, 'green')
}

/**
 * A binocular laboratory microscope: the cast stand with its C-arm and LED illuminator in the base,
 * the coaxial coarse and fine focus knobs on both sides, the rectangular mechanical stage with its
 * slide clips and X–Y knobs, the Abbe condenser under it, the quadruple nosepiece with four colour-
 * banded objectives, the binocular head at 30° with its two eyepiece tubes and rubber eyecups.
 */
export function microscope(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const L = labMats(e)
  const g = group(p, x, y, z, ry)
  const paint = e.m.whitePlastic
  // The base: a rounded slab, the field lens, the brightness dial and switch.
  k.soft(g, 0.2, 0.05, 0.25, 0.02, paint, 0, 0.025, 0)
  put(g, lathe(e, 'microFieldLens', [[0, 0.05], [0.022, 0.05], [0.025, 0.056], [0.018, 0.06], [0, 0.06]], 20), m.black, 0, 0, 0.04, false)
  k.cyl(g, 0.016, 0.016, 0.012, m.darkPlastic, 0.1, 0.025, -0.03, 18).rotation.z = PI / 2
  // The C-arm: an extruded curved casting, rising at the back and leaning over the stage.
  const arm = geo(e, 'microArm', () => {
    const s = new Shape()
    s.moveTo(-0.025, 0)
    s.lineTo(0.03, 0)
    s.quadraticCurveTo(0.045, 0.18, 0.02, 0.3)
    s.lineTo(-0.035, 0.31)
    s.quadraticCurveTo(-0.03, 0.15, -0.025, 0)
    const ex = new ExtrudeGeometry(s, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 8 })
    ex.translate(0, 0, -0.035)
    ex.rotateY(PI / 2)
    return ex
  })
  put(g, arm, paint, 0, 0.05, -0.08)
  // Focus knobs: the large coarse and small fine, both sides, with their knurling.
  for (const s of [-1, 1]) {
    const coarse = k.cyl(g, 0.028, 0.028, 0.018, m.darkPlastic, s * 0.052, 0.13, -0.075, 22)
    coarse.rotation.z = PI / 2
    const fine = k.cyl(g, 0.017, 0.017, 0.016, m.black, s * 0.069, 0.13, -0.075, 18)
    fine.rotation.z = PI / 2
    put(g, geo(e, 'microKnurl', () => new TorusGeometry(0.028, 0.002, 4, 24)), m.black, s * 0.052, 0.13, -0.075, false).rotation.y = PI / 2
  }
  // The condenser under the stage, its aperture lever.
  put(g, lathe(e, 'microCondenser', [[0, 0], [0.022, 0], [0.026, 0.025], [0.02, 0.035], [0, 0.035]], 18), m.black, 0, 0.1, 0.035, false)
  k.box(g, 0.03, 0.004, 0.006, m.chrome, 0.03, 0.12, 0.045, false)
  // The mechanical stage: a black plate, the slide holder and its clip arm, the drop-down X–Y knobs.
  k.box(g, 0.15, 0.012, 0.14, m.black, 0, 0.165, 0.03)
  k.box(g, 0.075, 0.001, 0.025, L.tubeGlass, -0.01, 0.1715, 0.04, false)
  k.box(g, 0.06, 0.008, 0.01, m.chrome, 0.03, 0.175, 0.055, false)
  put(g, bentTube(e, 'microClip', [[-0.05, 0, 0], [-0.03, 0, 0.012], [0.0, 0, 0.012]], 0.003, 0.01), m.chrome, 0.05, 0.175, 0.03, false)
  for (const [yy, r] of [[0.125, 0.012], [0.105, 0.01]] as const) k.cyl(g, r, r, 0.018, m.black, 0.072, yy, 0.06, 16)
  k.cyl(g, 0.004, 0.004, 0.06, m.chrome, 0.072, 0.135, 0.06, 8)
  // The nosepiece: a tilted revolver with four objectives (4× red, 10× yellow, 40× blue, 100× white oil).
  const nose = group(g, 0, 0.25, 0.01)
  nose.rotation.x = 0.35
  put(nose, lathe(e, 'microNose', [[0, 0], [0.035, 0], [0.038, -0.012], [0.03, -0.02], [0, -0.02]], 22), m.chrome, 0, 0, 0)
  const bands = [m.red, m.vacuum, m.blue, e.m.whitePlastic]
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * PI * 2 + PI / 4
    const ob = group(nose, Math.cos(a) * 0.022, -0.02, Math.sin(a) * 0.022)
    const len = 0.032 + i * 0.004
    put(ob, lathe(e, `microObj${i}`, [[0, 0], [0.009, 0], [0.009, -len * 0.6], [0.0065, -len], [0.004, -len - 0.004], [0, -len - 0.004]], 14), m.chrome, 0, 0, 0)
    k.cyl(ob, 0.0092, 0.0092, 0.004, bands[i], 0, -len * 0.45, 0, 14)
  }
  // The binocular head: its body on the arm, the two eyepiece tubes at 30°, eyecups.
  k.soft(g, 0.08, 0.06, 0.11, 0.012, paint, 0, 0.3, -0.005)
  const head = group(g, 0, 0.33, 0.03)
  head.rotation.x = -0.52
  k.soft(head, 0.1, 0.03, 0.06, 0.01, paint, 0, 0.0, 0.02)
  for (const s of [-1, 1]) {
    put(head, lathe(e, 'microEyepiece', [[0, 0], [0.012, 0], [0.012, 0.07], [0.015, 0.072], [0.016, 0.088], [0.012, 0.09], [0, 0.088]], 16), m.black, s * 0.032, 0.0, 0.035).rotation.x = PI / 2
  }
  return g
}

/* ---------- biochemistry ---------- */

/**
 * A floor-standing clinical chemistry analyser, 1.55 × 0.82 × 1.2 m (as the 800-test/hour
 * photometric systems are): the long moulded body on its levelling castors with three service
 * doors (seams, latches, louvres), the work deck under hinged smoked covers (reagent carousel in
 * its refrigerated compartment, the reaction disc, the sample turntable with its tubes, probe
 * arms on their columns, the mixer), the status lamp tower, the water and waste cans beside it
 * on their hoses, and the operation PC's monitor and keyboard on a swing arm at its end.
 */
export function chemAnalyser(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  const W = 1.55
  const D = 0.82
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * (W / 2 - 0.08), -D / 2 + sz * (D / 2 - 0.08), 0.035)
  k.box(p, W - 0.04, 0.08, D - 0.06, L.darkTrim, 0, 0.11, -D / 2)
  k.soft(p, W, 0.9, D, 0.04, L.shell, 0, 0.6, -D / 2)
  // The front: three service doors, each with its seams, its latch, a louvre band.
  for (let i = 0; i < 3; i++) {
    const cx = -W / 3 + (i * W) / 3
    seam(e, p, 0.74, cx - W / 6 + 0.01, 0.52, 0.001, true)
    k.box(p, 0.03, 0.05, 0.008, L.shellGrey, cx + W / 6 - 0.06, 0.62, 0.004, false)
    grille(e, p, 0.36, 0.06, cx, 0.24, 0.0015)
  }
  seam(e, p, W - 0.06, 0, 0.88, 0.001)
  k.box(p, W - 0.1, 0.004, 0.003, L.accent, 0, 0.87, 0.0015, false)
  // The deck.
  k.box(p, W - 0.04, 0.04, D - 0.04, L.shellGrey, 0, 1.07, -D / 2)
  // The reagent compartment: a round lid with its handle and the carousel inside, 4–12 °C.
  put(p, lathe(e, 'chemReagentLid', [[0, 0], [0.25, 0], [0.26, 0.02], [0.24, 0.05], [0, 0.055]], 32), L.shell, -0.45, 1.09, -0.42)
  k.box(p, 0.12, 0.025, 0.03, L.trim, -0.45, 1.16, -0.25, false)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * PI * 2
    k.box(p, 0.03, 0.006, 0.05, i % 3 ? e.m.whitePlastic : L.accent, -0.45 + Math.cos(a) * 0.18, 1.145, -0.42 + Math.sin(a) * 0.18, false).rotation.y = -a
  }
  // The reaction disc, the sample turntable with its tubes.
  k.cyl(p, 0.17, 0.17, 0.03, m.black, 0.08, 1.105, -0.44, 32)
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * PI * 2
    k.box(p, 0.008, 0.03, 0.008, L.cuvette, 0.08 + Math.cos(a) * 0.15, 1.13, -0.44 + Math.sin(a) * 0.15, false)
  }
  k.cyl(p, 0.18, 0.18, 0.05, e.m.whitePlastic, 0.52, 1.115, -0.44, 32)
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * PI * 2
    bloodTube(e, p, 0.52 + Math.cos(a) * 0.14, 1.14, -0.44 + Math.sin(a) * 0.14, i % 4, 'serum', false)
  }
  // Probe arms on their columns: the sample probe, two reagent probes, the stirrer.
  for (const [x, z, a, l] of [[0.32, -0.25, 0.4, 0.22], [-0.2, -0.22, -0.6, 0.24], [-0.1, -0.66, 0.9, 0.2], [0.24, -0.66, 2.6, 0.16]] as const) {
    k.cyl(p, 0.02, 0.022, 0.16, e.m.whitePlastic, x, 1.17, z, 16)
    const arm = group(p, x, 1.26, z, a)
    k.soft(arm, 0.04, 0.03, l, 0.01, e.m.whitePlastic, 0, 0, -l / 2 + 0.02)
    k.cyl(arm, 0.002, 0.002, 0.07, m.chrome, 0, -0.04, -l + 0.03, 6)
  }
  // The smoked covers over the deck, hinged at the back, their front lip.
  for (const [cx, w] of [[-0.45, 0.6], [0.3, 0.86]] as const) {
    const cv = group(p, cx, 1.33, -D + 0.02)
    cv.rotation.x = -0.06
    k.box(cv, w, 0.006, D - 0.08, L.smoked, 0, 0, (D - 0.08) / 2, false)
    k.box(cv, w, 0.02, 0.012, L.shellGrey, 0, -0.008, D - 0.08, false)
  }
  // The status lamp tower at the back corner.
  k.cyl(p, 0.022, 0.022, 0.14, L.shellGrey, W / 2 - 0.08, 1.16, -D + 0.08, 16)
  for (const [i, c] of [[0, '#39d97a'], [1, '#ffb020'], [2, '#ff3b30']] as const)
    k.cyl(p, 0.025, 0.025, 0.04, e.o.screen(`tower${i}`, 4, 4, (g, w, h) => {
      g.fillStyle = i === 0 ? c : '#3a2a20'
      g.fillRect(0, 0, w, h)
    }, i === 0 ? 1.4 : 0.2), W / 2 - 0.08, 1.25 + i * 0.042, -D + 0.08, 16)
  // Purified water in and waste out: two 20 l cans on the floor at the left end, their hoses.
  for (const [i, cap] of [[0, m.blue], [1, m.red]] as const) {
    const can = group(p, -W / 2 - 0.2, 0, -0.2 - i * 0.32)
    k.soft(can, 0.24, 0.36, 0.26, 0.03, i ? m.whitePlastic : m.clearPlastic, 0, 0.18, 0)
    k.cyl(can, 0.03, 0.03, 0.03, cap, 0.06, 0.375, 0, 14)
    put(p, tube(e, `chemHose${i}`, [[-W / 2 - 0.14, 0.39, -0.2 - i * 0.32], [-W / 2 - 0.05, 0.42, -0.25 - i * 0.2], [-W / 2, 0.35, -0.3 - i * 0.1]], 0.006), i ? m.whitePlastic : m.clearPlastic, 0, 0, 0, false)
  }
  // The operation PC on its swing arm at the right-hand end: column, keyboard tray, monitor.
  const arm = group(p, W / 2 + 0.06, 0, -0.12)
  k.box(arm, 0.08, 1.05, 0.08, L.shellGrey, 0, 0.6, 0)
  k.box(arm, 0.3, 0.03, 0.05, L.darkTrim, 0.15, 1.05, 0.0)
  const tray = group(arm, 0.32, 1.04, 0.1)
  k.box(tray, 0.5, 0.02, 0.28, L.darkTrim, 0, 0, 0)
  k.box(tray, 0.44, 0.012, 0.14, m.darkPlastic, 0, 0.016, 0.04, false)
  k.box(tray, 0.42, 0.003, 0.12, m.black, 0, 0.023, 0.04, false)
  const s = group(arm, 0.32, 1.32, -0.02)
  k.box(s, 0.52, 0.32, 0.03, m.black, 0, 0, 0)
  face(e, s, 0.5, 0.3, e.o.his('chemPC', 'BIOCHEMISTRY · RUN STATUS', 'table'), 0, 0, 0.016)
  k.box(s, 0.12, 0.12, 0.04, m.black, 0, -0.16, -0.03)
}

/**
 * An ion-selective electrolyte analyser (Na⁺ K⁺ Cl⁻), 0.3 × 0.4 × 0.34 m: the moulded body, the
 * electrode module behind its window, the sample probe and its drip tray, the LCD and keypad, the
 * built-in thermal printer with its paper, the reagent pack slotted in at the side.
 */
export function electrolyteAnalyser(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.3, 0.4, 0.34, 0.025, L.shell, 0, 0.2, -0.17)
  seam(e, p, 0.28, 0, 0.22, 0.001)
  // The electrode window: four electrodes stacked in their flow path.
  k.box(p, 0.1, 0.12, 0.01, L.smoked, -0.07, 0.3, 0.0, false)
  for (let i = 0; i < 4; i++) k.box(p, 0.07, 0.018, 0.02, [m.blue, m.red, m.green, e.m.whitePlastic][i], -0.07, 0.26 + i * 0.024, -0.012, false)
  face(e, p, 0.1, 0.05, lcd(e, 'ise', ['Na 138  K 4.1', 'Cl 102  mmol/L'], '#1b2b14', '#b6c99c'), 0.07, 0.33, 0.0015)
  keypad(e, p, 0.1, 0.06, 4, 3, 0.07, 0.25, 0.0)
  // The sample probe over its drip tray.
  k.box(p, 0.06, 0.012, 0.05, L.darkTrim, -0.07, 0.17, 0.015)
  k.cyl(p, 0.0015, 0.0015, 0.05, m.chrome, -0.07, 0.205, 0.02, 6)
  // The printer and its paper.
  k.box(p, 0.08, 0.006, 0.03, L.darkTrim, 0.07, 0.4, -0.03, false)
  k.box(p, 0.06, 0.002, 0.05, m.paper, 0.07, 0.405, -0.01, false)
  // The reagent pack at the side.
  k.soft(p, 0.12, 0.18, 0.2, 0.01, L.accent, 0.21, 0.09, -0.2)
  k.box(p, 0.1, 0.06, 0.002, m.paper, 0.271, 0.12, -0.2, false)
  feet(e, p, 0.26, 0.3, 0, -0.17)
}

/**
 * A semi-automatic chemistry analyser: a photometer with its sloped control face (backlit LCD,
 * membrane keypad), the flow-cell aspiration tube and its push plate, the built-in printer.
 */
export function semiAuto(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.4, 0.12, 0.36, 0.02, L.shell, 0, 0.06, -0.18)
  const top = group(p, 0, 0.12, -0.03)
  top.rotation.x = -0.32
  k.soft(top, 0.38, 0.03, 0.26, 0.01, L.shell, 0, 0, -0.1)
  face(e, top, 0.15, 0.07, lcd(e, 'semiauto', ['ALT  37°C  KIN', 'ABS 0.412  42 U/L'], '#bff5ff', '#0b2a3a'), -0.08, 0.016, -0.08).rotation.x = -PI / 2
  const kp = group(top, 0.09, 0.016, -0.08)
  kp.rotation.x = -PI / 2
  keypad(e, kp, 0.14, 0.11, 4, 4, 0, 0, 0)
  // The aspiration tube from the flow cell, its push plate behind.
  k.box(p, 0.04, 0.05, 0.03, L.shellGrey, 0.17, 0.08, 0.005)
  k.cyl(p, 0.0012, 0.0012, 0.06, m.clearPlastic, 0.17, 0.03, 0.015, 6)
  k.box(p, 0.06, 0.004, 0.03, m.paper, -0.12, 0.124, -0.3, false)
  feet(e, p, 0.36, 0.32, 0, -0.18)
}

/** A reverse-osmosis water purification unit: a cabinet with its three filter housings, the conductivity readout, the tank. */
export function roUnit(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.38, 0.6, 0.42, 0.02, L.shell, 0, 0.3, -0.21)
  seam(e, p, 0.36, 0, 0.45, 0.001)
  for (let i = 0; i < 3; i++) {
    put(p, lathe(e, 'roHousing', [[0, 0], [0.038, 0], [0.042, 0.02], [0.042, 0.29], [0.036, 0.31], [0, 0.31]], 18), i === 1 ? m.whitePlastic : m.clearPlastic, -0.12 + i * 0.12, 0.06, 0.05)
    k.cyl(p, 0.046, 0.046, 0.035, L.accent, -0.12 + i * 0.12, 0.36, 0.05, 18)
  }
  face(e, p, 0.12, 0.05, lcd(e, 'ro', ['0.8 µS/cm', 'TANK 82%'], '#5cff8a', '#062012'), 0, 0.53, 0.0015)
  led(e, p, 0.1, 0.53, 0.0015, 'green')
}

/* ---------- centrifuges ---------- */

/**
 * A benchtop clinical centrifuge (≈ 0.4 × 0.3 × 0.5 m): a moulded body with its domed lid hinged
 * at the back and a round window in it over the swing-out rotor and its buckets, the lid-release
 * button, the sloped control panel at the front with its LED display, set and start/stop keys.
 */
export function centrifuge(e: OpdCtx, p: Object3D, size = 1) {
  const { k, m } = e
  const L = labMats(e)
  const g = group(p, 0, 0, 0)
  g.scale.setScalar(size)
  k.soft(g, 0.42, 0.26, 0.5, 0.05, L.shell, 0, 0.13, -0.25)
  seam(e, g, 0.38, 0, 0.255, -0.03)
  // The rotor chamber, the rotor and its four buckets, seen through the lid's window.
  k.cyl(g, 0.15, 0.15, 0.01, L.darkTrim, 0, 0.262, -0.29, 28)
  k.cyl(g, 0.04, 0.04, 0.03, m.stainless, 0, 0.27, -0.29, 18)
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * PI * 2 + 0.3
    const b = k.cyl(g, 0.03, 0.026, 0.06, m.aluminium, Math.cos(a) * 0.09, 0.27, -0.29 + Math.sin(a) * 0.09, 16)
    b.rotation.z = 0
  }
  // The domed lid with its window.
  const lid = group(g, 0, 0.26, -0.5)
  put(lid, lathe(e, 'centLid', [[0, 0.06], [0.11, 0.055], [0.17, 0.035], [0.19, 0.012], [0.19, 0], [0, 0]], 28), L.shellGrey, 0, 0, 0.21)
  put(lid, lathe(e, 'centWindow', [[0, 0.062], [0.1, 0.057], [0, 0.057]], 24), L.smoked, 0, 0.001, 0.21, false)
  k.box(lid, 0.06, 0.02, 0.04, L.shellGrey, 0, 0.01, 0.0)
  // The control panel: sloped, with the display and its keys.
  const panelG = group(g, 0, 0.17, -0.02)
  panelG.rotation.x = -0.6
  k.box(panelG, 0.34, 0.11, 0.012, L.darkTrim, 0, 0, 0)
  face(e, panelG, 0.13, 0.045, lcd(e, 'cent', ['4000 rpm', '10:00 min'], '#7fd4ff'), -0.08, 0.012, 0.007)
  for (let i = 0; i < 4; i++) k.box(panelG, 0.022, 0.016, 0.004, e.m.greyPlastic, 0.04 + (i % 2) * 0.03, 0.015 - Math.floor(i / 2) * 0.026, 0.008, false)
  k.cyl(panelG, 0.012, 0.012, 0.006, m.green, 0.13, 0.014, 0.008, 16).rotation.x = PI / 2
  k.cyl(panelG, 0.012, 0.012, 0.006, m.red, 0.13, -0.014, 0.008, 16).rotation.x = PI / 2
  k.box(g, 0.05, 0.015, 0.012, L.accent, 0.15, 0.225, 0.0, false)
  feet(e, g, 0.38, 0.46, 0, -0.25)
  return g
}

/**
 * A refrigerated floor-standing centrifuge (0.7 × 0.9 × 0.8 m): the cabinet on castors with its
 * door panels and louvres, the motor-driven lid on the work top with its window, the control
 * panel (temperature, g-force, time) under the lid's front, the lid release.
 */
export function floorCentrifuge(e: OpdCtx, p: Object3D) {
  const { k } = e
  const L = labMats(e)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * 0.28, -0.4 + sz * 0.3, 0.035)
  k.box(p, 0.66, 0.06, 0.76, L.darkTrim, 0, 0.1, -0.4)
  k.soft(p, 0.7, 0.8, 0.8, 0.04, L.shell, 0, 0.53, -0.4)
  seam(e, p, 0.66, 0, 0.82, 0.001)
  seam(e, p, 0.62, -0.25, 0.45, 0.001, true)
  grille(e, p, 0.5, 0.12, 0, 0.25, 0.0015)
  k.box(p, 0.62, 0.004, 0.003, L.accent, 0, 0.78, 0.0015, false)
  // The lid on the top: a low dome with its window, hinged at the back.
  put(p, lathe(e, 'fcentLid', [[0, 0.07], [0.15, 0.065], [0.27, 0.035], [0.29, 0.01], [0.29, 0], [0, 0]], 32), L.shellGrey, 0, 0.93, -0.45)
  put(p, lathe(e, 'fcentWindow', [[0, 0.072], [0.13, 0.066], [0, 0.066]], 24), L.smoked, 0, 0.932, -0.45, false)
  // The control panel at the top's front edge.
  const panelG = group(p, 0, 0.9, -0.05)
  panelG.rotation.x = -0.9
  k.box(panelG, 0.56, 0.1, 0.012, L.darkTrim, 0, 0, 0)
  face(e, panelG, 0.22, 0.05, lcd(e, 'fcent', ['4°C  3500 g', '05:00  RUN'], '#7fd4ff', '#081018', 160, 48), -0.13, 0.008, 0.007)
  keypad(e, panelG, 0.18, 0.06, 6, 2, 0.15, 0, 0.006)
  k.box(p, 0.08, 0.02, 0.03, L.accent, 0.28, 0.9, -0.05, false)
}

/** A vortex mixer: a small heavy base with its rubber cup, the speed knob and mode switch. */
export function vortex(e: OpdCtx, p: Object3D, x: number, y: number, z: number) {
  const { k, m } = e
  const L = labMats(e)
  const g = group(p, x, y, z)
  k.soft(g, 0.12, 0.08, 0.16, 0.03, L.shell, 0, 0.04, 0)
  put(g, lathe(e, 'vortexCup', [[0, 0.08], [0.028, 0.08], [0.032, 0.095], [0.018, 0.1], [0, 0.098]], 18), m.rubber, 0, 0, -0.02, false)
  k.cyl(g, 0.012, 0.012, 0.012, m.darkPlastic, 0.03, 0.045, 0.081, 16).rotation.x = PI / 2
  k.box(g, 0.016, 0.01, 0.006, m.darkPlastic, -0.03, 0.045, 0.081, false)
  feet(e, g, 0.1, 0.14)
  return g
}

/* ---------- clinical pathology ---------- */

/**
 * A urine chemistry strip analyser: the moulded body, the strip conveyor tray at the front with
 * strips on it, the reflectance reading head over it, the built-in printer, the touch screen.
 */
export function urineAnalyser(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.38, 0.2, 0.36, 0.025, L.shell, 0, 0.1, -0.18)
  seam(e, p, 0.36, 0, 0.14, 0.001)
  // The strip tray: a grooved plate sliding out of the front, three strips on it.
  k.box(p, 0.16, 0.012, 0.18, L.darkTrim, -0.08, 0.075, 0.06)
  for (let i = 0; i < 3; i++) {
    k.box(p, 0.005, 0.002, 0.12, e.m.whitePlastic, -0.11 + i * 0.03, 0.082, 0.06, false)
    for (let j = 0; j < 6; j++) k.box(p, 0.0052, 0.0022, 0.0055, [m.sharps, m.green, m.purple, m.blue, L.agar, m.vacuum][j], -0.11 + i * 0.03, 0.083, 0.02 + j * 0.012, false)
  }
  k.box(p, 0.18, 0.03, 0.06, L.shellGrey, -0.08, 0.12, 0.0)
  touchScreen(e, p, 0.15, 0.1, e.o.his('urine', 'URINE STRIP · 11 PARAM', 'table'), 0.1, 0.16, -0.05, 0.6)
  k.box(p, 0.07, 0.004, 0.025, L.darkTrim, 0.1, 0.2, -0.22, false)
  k.box(p, 0.06, 0.002, 0.05, m.paper, 0.1, 0.205, -0.2, false)
  feet(e, p, 0.34, 0.32, 0, -0.18)
}

/** A rack of urine sample containers: clear 60 ml pots with screw caps, yellow, in a white rack. */
export function urineRack(e: OpdCtx, p: Object3D, x: number, y: number, z: number, n = 8) {
  const { k } = e
  const L = labMats(e)
  const g = group(p, x, y, z)
  k.box(g, n * 0.06 + 0.02, 0.015, 0.08, e.m.whitePlastic, 0, 0.0075, 0, false)
  for (let i = 0; i < n; i++) {
    const cx = -((n - 1) * 0.06) / 2 + i * 0.06
    put(g, lathe(e, 'urinePot', [[0, 0.015], [0.022, 0.015], [0.024, 0.02], [0.025, 0.075], [0, 0.075]], 14), e.m.clearPlastic, cx, 0, 0, false)
    put(g, lathe(e, `urineFill${i % 3}`, [[0, 0.017], [0.022, 0.017], [0.023, 0.04 + (i % 3) * 0.01], [0, 0.04 + (i % 3) * 0.01]], 14), L.urine, cx, 0, 0, false)
    put(g, lathe(e, 'urineCap', [[0, 0.073], [0.027, 0.073], [0.027, 0.088], [0.024, 0.09], [0, 0.09]], 14), i % 4 ? e.m.whitePlastic : e.m.red, cx, 0, 0, false)
    k.box(g, 0.03, 0.025, 0.0008, L.label, cx, 0.045, 0.0251, false)
  }
  return g
}

/* ---------- microbiology ---------- */

/**
 * A Class II A2 biological safety cabinet, 1.3 m, on its stand: the powder-coated cabinet with its
 * side windows, the stainless interior with its perforated work tray and the front air grille
 * slots, the sloped glass sash in its aluminium frame with the handle, the lit work zone, the
 * blower housing above with the control panel (airflow display, keys), levelling feet.
 */
export function biosafetyCabinet(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  const w = 1.3
  // The stand: four legs with levelling feet, rails.
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    k.box(p, 0.05, 0.68, 0.05, L.powderWhite, sx * (w / 2 - 0.06), 0.36, -0.4 + sz * 0.3)
    k.cyl(p, 0.025, 0.025, 0.02, L.foot, sx * (w / 2 - 0.06), 0.01, -0.4 + sz * 0.3, 12)
  }
  for (const sz of [-1, 1]) k.box(p, w - 0.12, 0.04, 0.03, L.powderWhite, 0, 0.2, -0.4 + sz * 0.3)
  // The cabinet: the base pan, the sides with their windows, the back, the top housing.
  k.box(p, w, 0.12, 0.8, L.powderWhite, 0, 0.76, -0.4)
  for (const sx of [-1, 1]) {
    k.box(p, 0.06, 0.8, 0.8, L.powderWhite, sx * (w / 2 - 0.03), 1.22, -0.4)
    k.box(p, 0.062, 0.45, 0.4, L.smoked, sx * (w / 2 - 0.03), 1.2, -0.32, false)
  }
  k.box(p, w - 0.12, 0.8, 0.03, L.satin, 0, 1.22, -0.78)
  k.box(p, w, 0.42, 0.82, L.powderWhite, 0, 1.83, -0.41)
  seam(e, p, w - 0.04, 0, 1.64, 0.0)
  // The interior: the perforated stainless work tray, the front grille slots, a light.
  k.box(p, w - 0.14, 0.015, 0.56, L.perforated, 0, 0.83, -0.42)
  k.box(p, w - 0.14, 0.02, 0.1, L.ventDark, 0, 0.83, -0.08)
  k.box(p, w - 0.14, 0.01, 0.06, e.o.cove, 0, 1.6, -0.55, false)
  // The sash: glass in its frame, sloped back 10°, the handle along its foot.
  const sash = group(p, 0, 1.05, 0.0)
  sash.rotation.x = -0.17
  k.box(sash, w - 0.14, 0.6, 0.008, L.smoked, 0, 0.3, 0, false)
  for (const sx of [-1, 1]) k.box(sash, 0.025, 0.62, 0.02, m.aluminium, sx * (w / 2 - 0.08), 0.3, 0)
  k.box(sash, w - 0.14, 0.03, 0.03, m.aluminium, 0, 0.0, 0.0)
  k.box(sash, 0.5, 0.02, 0.03, m.aluminium, 0, -0.02, 0.025)
  // The front of the base pan, the control panel on the top housing.
  k.box(p, w - 0.14, 0.11, 0.02, L.powderWhite, 0, 0.94, 0.01)
  const cp = group(p, 0.25, 1.85, 0.0)
  k.box(cp, 0.5, 0.12, 0.012, L.darkTrim, 0, 0, 0)
  face(e, cp, 0.2, 0.07, lcd(e, 'bsc', ['IN 0.53 m/s', 'DOWN 0.33 m/s'], '#4bff72', '#071b0e', 160, 64), -0.12, 0, 0.007)
  keypad(e, cp, 0.18, 0.06, 5, 2, 0.13, 0, 0.006)
  led(e, cp, 0.24, 0.04, 0.007, 'green')
  grille(e, p, 0.6, 0.12, -0.25, 1.92, 0.0005)
  // Inside: the electric loop sterilizer, a stack of plates, a pipette in its stand.
  k.cyl(p, 0.035, 0.04, 0.12, m.darkPlastic, -0.4, 0.9, -0.45, 16)
  k.cyl(p, 0.022, 0.022, 0.005, m.red, -0.4, 0.962, -0.45, 14)
  for (let i = 0; i < 4; i++) k.cyl(p, 0.045, 0.045, 0.014, i % 2 ? L.agarBlood : L.agar, 0.2, 0.845 + i * 0.015, -0.45, 20)
  k.cyl(p, 0.012, 0.008, 0.18, e.m.whitePlastic, 0.45, 0.93, -0.55, 12)
}

/**
 * A bacteriological / CO₂ incubator (≈ 0.65 × 0.95 × 0.65 m): the insulated cabinet, the inner
 * glass door behind the outer door (operated) with its gasket and handle, wire shelves stacked with
 * Petri dishes, the controller with its display at the top.
 */
export function incubator(e: OpdCtx, p: Object3D, h = 0.9, label = 'Incubator Door') {
  const { k, m } = e
  const L = labMats(e)
  const w = 0.65
  const d = 0.65
  carcass(e, p, w, h, d, L.powderWhite, [], 0.05)
  // Wire shelves inside, dishes on them, the inner chamber's stainless lining.
  k.box(p, w - 0.06, h - 0.2, 0.004, L.satin, 0, h / 2, -d + 0.02, false)
  for (const y of [h * 0.3, h * 0.58]) {
    k.box(p, w - 0.06, 0.006, d - 0.08, L.perforated, 0, y, -d / 2 - 0.02, false)
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) k.cyl(p, 0.045, 0.045, 0.012, (i + j) % 2 ? L.agar : L.agarBlood, -0.18 + i * 0.12, y + 0.009 + j * 0.013, -0.24, 20)
  }
  // The inner glass door, a little back from the front, its frame.
  k.box(p, w - 0.06, h - 0.16, 0.006, e.o.screenGlass, 0, h / 2 + 0.01, -0.035, false)
  k.box(p, w - 0.05, 0.02, 0.012, m.aluminium, 0, 0.11, -0.035, false)
  // The controller on the top band.
  k.box(p, w - 0.02, 0.1, 0.02, L.darkTrim, 0, h - 0.05, 0.01)
  face(e, p, 0.12, 0.045, lcd(e, label.startsWith('CO') ? 'co2' : 'inc', label.startsWith('CO') ? ['37.0°C', 'CO₂ 5.0%'] : ['37.0°C', 'SET 37.0'], '#ff6a3a', '#1a0606'), -0.15, h - 0.05, 0.021)
  keypad(e, p, 0.14, 0.05, 4, 1, 0.12, h - 0.05, 0.02)
  cupboardDoor(e, p, -w / 2 + 0.002, (h - 0.1) / 2 + 0.02, 0.0, { w: w - 0.006, h: h - 0.14, hinge: 'left', face: L.powderWhite, label, angle: 1.7 })
}

/**
 * A vertical autoclave, the kind a hospital laboratory sterilises its media and decontaminates its
 * cultures in: the stainless double-walled chamber (100 l) on its powder-coated stand-base with the
 * control panel, the domed lid clamped by radial wing nuts, the pressure gauge, the safety valve and
 * steam release, the drain cock at the foot.
 */
export function autoclave(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  const r = 0.27
  // The base with its control panel.
  k.soft(p, 0.68, 0.3, 0.68, 0.02, L.powderWhite, 0, 0.15, -0.34)
  const cp = group(p, 0, 0.17, 0.0)
  k.box(cp, 0.46, 0.18, 0.01, L.darkTrim, 0, 0, 0.005)
  face(e, cp, 0.16, 0.06, lcd(e, 'autoclave', ['121°C  15 psi', 'HOLD 14:52'], '#7dff9c', '#05140a', 160, 56), -0.1, 0.03, 0.011)
  for (const [x, c] of [[0.06, m.green], [0.12, m.red], [0.18, m.vacuum]] as const) k.cyl(cp, 0.015, 0.015, 0.008, c, x, 0.03, 0.012, 14).rotation.x = PI / 2
  for (let i = 0; i < 3; i++) led(e, cp, 0.06 + i * 0.06, -0.04, 0.011, i === 0 ? 'green' : 'amber')
  // The chamber: a stainless drum with its flange, the domed lid, the wing nuts round it.
  put(p, lathe(e, 'acDrum', [[0, 0], [r, 0], [r, 0.68], [r + 0.03, 0.68], [r + 0.03, 0.72], [0, 0.72]], 32), L.satin, 0, 0.3, -0.34)
  put(p, lathe(e, 'acLid', [[0, 0.1], [0.12, 0.095], [0.22, 0.06], [r + 0.03, 0.02], [r + 0.03, 0], [0, 0]], 32), L.satin, 0, 1.02, -0.34)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * PI * 2
    const nut = group(p, Math.cos(a) * (r + 0.015), 1.04, -0.34 + Math.sin(a) * (r + 0.015), -a)
    k.cyl(nut, 0.008, 0.008, 0.06, m.chrome, 0, -0.01, 0, 8)
    k.box(nut, 0.012, 0.012, 0.06, m.chrome, 0, 0.03, 0, false)
  }
  // On the lid: the pressure gauge, the safety valve, the steam release handle.
  const gauge = group(p, -0.08, 1.12, -0.36)
  k.cyl(gauge, 0.006, 0.006, 0.05, m.chrome, 0, 0.0, 0, 8)
  const dial = group(gauge, 0, 0.06, 0)
  dial.rotation.x = -0.6
  k.cyl(dial, 0.045, 0.045, 0.025, m.chrome, 0, 0, 0, 24).rotation.x = PI / 2
  face(e, dial, 0.075, 0.075, e.m.cylinderGauge, 0, 0, 0.0128)
  k.cyl(p, 0.012, 0.016, 0.06, m.brass, 0.1, 1.15, -0.32, 12)
  k.cyl(p, 0.02, 0.02, 0.01, m.brass, 0.1, 1.185, -0.32, 12)
  put(p, bentTube(e, 'acRelease', [[0.0, 0, 0], [0.0, 0.05, 0], [0.08, 0.06, 0]], 0.006, 0.02), m.black, 0.02, 1.12, -0.24, false)
  // The drain cock at the drum's foot.
  rod(e, p, 0.008, 0.08, m.brass, 0.18, 0.36, -0.12, 'z', 8)
  k.box(p, 0.03, 0.008, 0.012, m.red, 0.18, 0.37, -0.08, false)
}

/**
 * An automated blood-culture system (≈ 0.6 × 1.0 × 0.65 m): the incubating cabinet with its three
 * drawer doors, each with its window onto the bottle cells and a status strip, the touch screen and
 * barcode scanner on the top section.
 */
export function bloodCulture(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.62, 1.0, 0.64, 0.03, L.shell, 0, 0.5, -0.32)
  for (let i = 0; i < 3; i++) {
    const y = 0.16 + i * 0.24
    seam(e, p, 0.58, 0, y + 0.115, 0.001)
    k.box(p, 0.42, 0.13, 0.006, L.smoked, -0.04, y, 0.003, false)
    for (let j = 0; j < 12; j++) k.cyl(p, 0.012, 0.012, 0.02, i === 1 && j === 4 ? m.red : L.cuvette, -0.22 + j * 0.034, y + 0.02, -0.02, 10)
    k.box(p, 0.06, 0.02, 0.012, L.shellGrey, 0.24, y, 0.006, false)
    for (let j = 0; j < 8; j++) led(e, p, -0.22 + j * 0.05, y - 0.08, 0.004, i === 1 && j === 3 ? 'red' : 'green')
  }
  touchScreen(e, p, 0.3, 0.19, e.o.his('bcScreen', 'BLOOD CULTURE · 3 POSITIVE', 'table'), -0.08, 0.87, 0.01, 0.18)
  k.soft(p, 0.05, 0.08, 0.05, 0.012, m.darkPlastic, 0.22, 0.88, 0.0)
}

/** A digital colony counter: a lit stage under a magnifier on its arm, the counting pen and display. */
export function colonyCounter(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.32, 0.09, 0.3, 0.02, L.shell, 0, 0.045, -0.15)
  k.cyl(p, 0.085, 0.085, 0.006, e.o.cove, 0, 0.093, -0.15, 24)
  k.cyl(p, 0.045, 0.045, 0.014, L.agar, 0, 0.103, -0.15, 20)
  face(e, p, 0.07, 0.025, lcd(e, 'colony', ['0147'], '#ff4a3a', '#1a0505'), 0.1, 0.06, 0.0015)
  k.cyl(p, 0.01, 0.01, 0.26, m.chrome, 0.13, 0.22, -0.27, 10)
  rod(e, p, 0.008, 0.13, m.chrome, 0.065, 0.34, -0.27, 'x', 8)
  put(p, geo(e, 'colonyLensRing', () => new TorusGeometry(0.06, 0.008, 8, 28)), m.darkPlastic, 0, 0.32, -0.15, false).rotation.x = PI / 2
  k.cyl(p, 0.058, 0.058, 0.006, m.clearPlastic, 0, 0.32, -0.15, 24)
  put(p, bentTube(e, 'colonyPen', [[0.12, 0.09, -0.02], [0.17, 0.095, 0.02], [0.2, 0.01, 0.05]], 0.003, 0.02), m.black, 0, 0, 0, false)
}

/* ---------- serology ---------- */

/** A 96-well microplate in its frame, a few rows coloured. */
function microplate(e: OpdCtx, p: Object3D, x: number, y: number, z: number) {
  const { k, m } = e
  k.box(p, 0.128, 0.014, 0.085, e.m.whitePlastic, x, y + 0.007, z, false)
  k.box(p, 0.11, 0.0015, 0.07, e.o.sign('microplateWells', 128, 80, (g, w, h) => {
    g.fillStyle = '#f2f2ef'
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 12; i++)
      for (let j = 0; j < 8; j++) {
        g.fillStyle = j < 3 && i < 8 ? (i + j) % 3 ? '#f2d64a' : '#e8b821' : '#d9dcd8'
        g.beginPath()
        g.arc(5 + i * 10.3, 5 + j * 9.6, 3.6, 0, Math.PI * 2)
        g.fill()
      }
  }), x, y + 0.0145, z, false)
  void m
}

/** A microplate (ELISA) reader: the moulded body, its plate carrier out of the front with a plate on it, the display and keys. */
export function elisaReader(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.42, 0.18, 0.44, 0.025, L.shell, 0, 0.09, -0.22)
  seam(e, p, 0.4, 0, 0.13, 0.001)
  k.box(p, 0.18, 0.05, 0.004, L.darkTrim, -0.08, 0.07, 0.001, false)
  k.box(p, 0.15, 0.008, 0.11, L.darkTrim, -0.08, 0.07, 0.055, false)
  microplate(e, p, -0.08, 0.074, 0.055)
  face(e, p, 0.1, 0.045, lcd(e, 'elisa', ['OD 450 nm', 'PLATE 3 / 12'], '#bff5ff', '#0b2a3a'), 0.11, 0.13, 0.0015)
  keypad(e, p, 0.1, 0.05, 4, 2, 0.11, 0.07, 0.0)
  feet(e, p, 0.38, 0.4, 0, -0.22)
  void m
}

/** A microplate washer: the manifold head over the plate carrier, the keypad, the wash and waste bottles beside it on their lines. */
export function elisaWasher(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.36, 0.16, 0.44, 0.025, L.shell, 0, 0.08, -0.22)
  k.soft(p, 0.2, 0.1, 0.18, 0.02, L.shell, 0, 0.21, -0.32)
  k.box(p, 0.14, 0.03, 0.04, m.stainless, 0, 0.2, -0.2)
  for (let i = 0; i < 8; i++) k.cyl(p, 0.0012, 0.0012, 0.02, m.chrome, -0.05 + i * 0.014, 0.178, -0.2, 6)
  microplate(e, p, 0, 0.16, -0.17)
  keypad(e, p, 0.12, 0.05, 4, 2, 0.08, 0.08, 0.0)
  bottle(e, p, 0.27, 0, -0.1, 0.28, 0.06, m.clearPlastic, m.blue)
  bottle(e, p, 0.27, 0, -0.3, 0.28, 0.06, e.m.whitePlastic, m.red)
  for (const z of [-0.1, -0.3]) put(p, tube(e, `washLine${z}`, [[0.27, 0.29, z], [0.22, 0.3, z + 0.02], [0.18, 0.12, -0.2]], 0.003), m.clearPlastic, 0, 0, 0, false)
  feet(e, p, 0.32, 0.4, 0, -0.22)
}

/**
 * A benchtop chemiluminescence immunoassay analyser, 1.1 × 0.75 m: the long moulded body (the
 * reaction and wash modules behind the front covers with their seams and latches), the reagent
 * and sample loading bays on the deck under a smoked cover with racks of tubes, the status bar,
 * the touch screen on its arm.
 */
export function cliaAnalyser(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 1.1, 0.58, 0.72, 0.04, L.shell, 0, 0.29, -0.36)
  for (let i = 0; i < 3; i++) seam(e, p, 0.42, -0.36 + i * 0.36, 0.3, 0.001, true)
  seam(e, p, 1.06, 0, 0.5, 0.001)
  for (let i = 0; i < 2; i++) k.box(p, 0.04, 0.012, 0.006, L.shellGrey, -0.2 + i * 0.36, 0.46, 0.004, false)
  k.box(p, 1.0, 0.012, 0.006, e.o.screen('cliaStatus', 16, 4, (g, w, h) => {
    g.fillStyle = '#4aa8ff'
    g.fillRect(0, 0, w, h)
  }, 1.2), 0, 0.53, 0.004, false)
  grille(e, p, 0.4, 0.08, 0.3, 0.12, 0.0015)
  // The loading deck: sample racks and the reagent bay, under its smoked cover.
  k.box(p, 1.04, 0.012, 0.6, L.darkTrim, 0, 0.586, -0.36, false)
  for (let i = 0; i < 3; i++) {
    const r = group(p, 0.12 + i * 0.1, 0.592, -0.3, PI / 2)
    k.box(r, 0.22, 0.03, 0.03, e.m.whitePlastic, 0, 0.015, 0, false)
    for (let j = 0; j < 10; j++) if ((i + j) % 4) bloodTube(e, r, -0.1 + j * 0.0222, 0.02, 0, 2, 'serum', j % 3 === 0)
  }
  for (let i = 0; i < 6; i++) k.box(p, 0.06, 0.08, 0.1, i % 2 ? e.m.whitePlastic : L.accent, -0.3 + (i % 3) * 0.075, 0.632, -0.42 + Math.floor(i / 3) * 0.12, false)
  const cover = group(p, 0, 0.59, -0.7)
  cover.rotation.x = -0.05
  k.box(cover, 1.0, 0.006, 0.6, L.smoked, 0, 0.13, 0.3, false)
  for (const s of [-1, 1]) k.box(cover, 0.01, 0.13, 0.6, L.smoked, s * 0.5, 0.065, 0.3, false)
  // The screen on its arm at the left.
  const arm = group(p, -0.45, 0.58, -0.25)
  k.cyl(arm, 0.015, 0.015, 0.24, m.aluminium, 0, 0.12, 0, 12)
  touchScreen(e, arm, 0.3, 0.19, e.o.his('clia', 'IMMUNOASSAY · TSH FT4 HBsAg', 'table'), 0, 0.36, 0.04, 0.2)
}

/** A rotary shaker: the platform with its non-slip mat and a plate clamp, a microplate on it, the speed and timer display. */
export function shaker(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.32, 0.08, 0.32, 0.02, L.shell, 0, 0.04, -0.16)
  k.box(p, 0.3, 0.012, 0.3, m.rubber, 0, 0.09, -0.16, false)
  for (const s of [-1, 1]) k.box(p, 0.28, 0.015, 0.012, m.aluminium, 0, 0.104, -0.16 + s * 0.06, false)
  microplate(e, p, -0.06, 0.096, -0.16)
  microplate(e, p, 0.08, 0.096, -0.16)
  face(e, p, 0.07, 0.025, lcd(e, 'shaker', ['300 rpm 30:00'], '#7fd4ff'), 0, 0.045, 0.0015)
  feet(e, p, 0.28, 0.28, 0, -0.16)
}

/* ---------- storage and preparation ---------- */

/** A −20 °C chest deep freezer, its lid (operated, hinged at the back) with its handle and lock, the controller, the compressor grille. */
export function deepFreezer(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  const w = 1.1
  const d = 0.65
  k.soft(p, w, 0.8, d, 0.02, L.powderWhite, 0, 0.44, -d / 2)
  k.box(p, w - 0.04, 0.04, d - 0.04, L.foot, 0, 0.02, -d / 2)
  grille(e, p, 0.3, 0.1, w / 2 - 0.2, 0.14, 0.0005)
  // The lid on its back hinges: a door_ turning about local x.
  const lid = group(p, 0, 0.84, -d, 0, `door_opd_freezer_${(p.id % 1000)}`)
  lid.userData.axis = 'x'
  lid.userData.openAngle = -1.2
  lid.userData.label = 'Freezer Lid'
  const top = k.soft(lid, w, 0.07, d, 0.02, L.powderWhite, 0, 0.035, d / 2)
  top.userData.front = true
  k.box(lid, 0.42, 0.035, 0.035, L.trim, 0, 0.01, d + 0.015, false)
  k.cyl(lid, 0.01, 0.01, 0.01, m.chrome, 0.28, 0.01, d + 0.02, 12).rotation.x = PI / 2
  face(e, p, 0.12, 0.05, lcd(e, 'freezer', ['-20°C'], '#6fd2ff', '#04101c'), -w / 2 + 0.15, 0.74, 0.0005)
  led(e, p, -w / 2 + 0.25, 0.74, 0.0005, 'green')
}

/**
 * An analytical balance on its anti-vibration table: a granite slab on an isolated powder-coated
 * frame, the balance's glass draught shield with its sliding doors, the pan, the display and keys,
 * a box of weighing boats and a spatula.
 */
export function balanceTable(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(p, 0.05, 0.72, 0.05, L.powderWhite, sx * 0.36, 0.36, -0.3 + sz * 0.24)
  for (const sz of [-1, 1]) k.box(p, 0.7, 0.04, 0.04, L.powderWhite, 0, 0.15, -0.3 + sz * 0.24)
  k.box(p, 0.8, 0.06, 0.6, e.m.black, 0, 0.75, -0.3)
  const b = group(p, 0, 0.78, -0.33)
  k.soft(b, 0.22, 0.08, 0.36, 0.015, L.shell, 0, 0.04, 0)
  k.box(b, 0.2, 0.22, 0.22, e.o.screenGlass, 0, 0.19, -0.06, false)
  for (const sx of [-1, 1]) k.box(b, 0.012, 0.22, 0.22, L.shellGrey, sx * 0.105, 0.19, -0.06, false)
  k.box(b, 0.2, 0.012, 0.22, L.shellGrey, 0, 0.306, -0.06, false)
  k.cyl(b, 0.04, 0.04, 0.004, m.chrome, 0, 0.09, -0.06, 20)
  face(e, b, 0.09, 0.025, lcd(e, 'balance', ['0.0000 g'], '#86ff9f', '#0a1a10'), 0, 0.05, 0.181)
  for (let i = 0; i < 4; i++) k.box(b, 0.02, 0.012, 0.006, e.m.greyPlastic, -0.07 + i * 0.047, 0.025, 0.181, false)
  k.box(p, 0.12, 0.05, 0.08, e.m.whitePlastic, 0.27, 0.805, -0.2, false)
  k.box(p, 0.16, 0.003, 0.01, m.stainless, 0.25, 0.782, -0.08, false)
}

/** A wall-mounted water still: the stainless boiler with its heater, the condenser on its bracket, the glass delivery to the reservoir under it. */
export function waterStill(e: OpdCtx, p: Object3D, y = 1.2) {
  const { k, m } = e
  const L = labMats(e)
  k.box(p, 0.55, 0.05, 0.04, L.satin, 0, y + 0.6, 0.02)
  put(p, lathe(e, 'stillBoiler', [[0, 0], [0.1, 0], [0.105, 0.02], [0.105, 0.33], [0.08, 0.36], [0.03, 0.37], [0, 0.37]], 24), L.satin, -0.14, y + 0.05, 0.14)
  put(p, lathe(e, 'stillCondenser', [[0, 0], [0.055, 0], [0.06, 0.02], [0.06, 0.44], [0.05, 0.46], [0, 0.46]], 20), L.satin, 0.13, y + 0.06, 0.12)
  put(p, bentTube(e, 'stillPipe', [[-0.14, y + 0.42, 0.14], [-0.14, y + 0.56, 0.14], [0.13, y + 0.56, 0.12], [0.13, y + 0.52, 0.12]], 0.012, 0.03), m.chrome, 0, 0, 0)
  put(p, bentTube(e, 'stillDelivery', [[0.13, y + 0.06, 0.12], [0.13, y - 0.02, 0.12], [0.13, y - 0.1, 0.14]], 0.006, 0.02), m.clearPlastic, 0, 0, 0, false)
  put(p, lathe(e, 'stillReservoir', [[0, 0], [0.11, 0], [0.12, 0.02], [0.12, 0.3], [0.05, 0.33], [0.03, 0.36], [0, 0.36]], 20), e.m.clearPlastic, 0.13, y - 0.48, 0.14)
  k.cyl(p, 0.008, 0.008, 0.04, m.chrome, 0.13, y - 0.44, 0.27, 10).rotation.x = PI / 2
  face(e, p, 0.08, 0.035, lcd(e, 'still', ['4.0 l/h'], '#7dff9c', '#05140a'), -0.14, y + 0.25, 0.246)
}

/** A pneumatic tube station: the wall unit with its receiving door, the carrier in its tray, the dispatch keypad and display, the tube rising to the ceiling. */
export function pneumaticStation(e: OpdCtx, p: Object3D, y = 0.9) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.36, 0.9, 0.24, 0.02, e.m.whitePlastic, 0, y + 0.45, 0.12)
  put(p, lathe(e, 'ptsTube', [[0.058, 0], [0.062, 0], [0.062, 1.2], [0.058, 1.2]], 20), e.m.whitePlastic, 0, y + 0.9, 0.12)
  // The receiving bay: a hinged clear door over the carrier lying in its tray.
  k.box(p, 0.28, 0.2, 0.04, L.darkTrim, 0, y + 0.2, 0.22)
  rod(e, p, 0.052, 0.26, m.blue, 0, y + 0.18, 0.18, 'x', 18)
  for (const s of [-1, 1]) k.cyl(p, 0.054, 0.054, 0.02, L.darkTrim, s * 0.13, y + 0.18, 0.18, 18).rotation.z = PI / 2
  k.box(p, 0.3, 0.22, 0.006, L.smoked, 0, y + 0.2, 0.245, false)
  face(e, p, 0.14, 0.05, lcd(e, 'pts', ['STN 212', 'READY'], '#ffd45a', '#071423'), 0, y + 0.62, 0.2405)
  keypad(e, p, 0.14, 0.1, 3, 4, 0, y + 0.5, 0.24)
}

/** A stainless pass box through a wall, at height y: its frame, the glazed door with its interlock handle and the lamp. */
export function passBox(e: OpdCtx, p: Object3D, y = 0.9, w = 0.45) {
  const { k, m } = e
  k.box(p, w + 0.08, w + 0.08, 0.03, labMats(e).satin, 0, y + w / 2, 0.015)
  k.box(p, w, w, 0.02, labMats(e).satin, 0, y + w / 2, 0.04)
  k.box(p, w - 0.12, w - 0.12, 0.004, e.o.screenGlass, 0, y + w / 2, 0.052, false)
  put(p, bentTube(e, 'passHandle', [[0, -0.06, 0], [0, -0.06, 0.03], [0, 0.06, 0.03], [0, 0.06, 0]], 0.007, 0.012), m.chrome, w / 2 - 0.04, y + w / 2, 0.05, false)
  led(e, p, -w / 2 + 0.03, y + w + 0.02, 0.031, 'green')
  led(e, p, -w / 2 + 0.06, y + w + 0.02, 0.031, 'red')
}

/* ---------- the collection room ---------- */

/**
 * A phlebotomy chair (as the hospital blood-collection chairs are built): a powder-coated pedestal
 * base with levelling glides and the gas-spring column, the moulded seat and the reclining back with
 * a headrest in navy vinyl with stitched panels, two padded arm boards on swing-and-height brackets
 * with their locking knobs (the right one swung in and raised for a draw), the flip-up footrest.
 */
export function phlebotomyChair(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  // The base: a broad plate with glides, the column and its shroud.
  k.soft(p, 0.62, 0.05, 0.62, 0.02, L.powderWhite, 0, 0.025, 0)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.cyl(p, 0.02, 0.022, 0.012, L.foot, sx * 0.27, 0.006, sz * 0.27, 12)
  put(p, lathe(e, 'phlebColumn', [[0, 0], [0.075, 0], [0.07, 0.05], [0.05, 0.1], [0.05, 0.3], [0, 0.3]], 20), L.powderWhite, 0, 0.05, -0.02)
  // The seat: a frame pan and the cushion, a stitched seam.
  k.box(p, 0.5, 0.04, 0.5, L.trim, 0, 0.38, 0.02)
  k.soft(p, 0.56, 0.1, 0.54, 0.04, m.vinylSeat, 0, 0.45, 0.03)
  k.box(p, 0.5, 0.004, 0.004, L.darkTrim, 0, 0.5, 0.29, false)
  // The back, reclined, with its headrest and the frame behind it.
  const back = group(p, 0, 0.47, -0.24)
  back.rotation.x = -0.25
  k.box(back, 0.5, 0.66, 0.03, L.trim, 0, 0.36, -0.07)
  k.soft(back, 0.54, 0.66, 0.11, 0.045, m.vinylSeat, 0, 0.36, -0.01)
  for (const y of [0.18, 0.4]) k.box(back, 0.48, 0.004, 0.004, L.darkTrim, 0, y, 0.048, false)
  k.soft(back, 0.32, 0.16, 0.12, 0.05, m.vinylSeat, 0, 0.8, 0.0)
  k.box(back, 0.04, 0.12, 0.03, L.trim, 0, 0.66, -0.06)
  // Arm boards: padded, on swing brackets with height knobs; the right one raised for the draw.
  for (const s of [-1, 1]) {
    const post = group(p, s * 0.33, 0.38, -0.12)
    k.cyl(post, 0.018, 0.018, s > 0 ? 0.36 : 0.28, m.chrome, 0, (s > 0 ? 0.36 : 0.28) / 2, 0, 12)
    k.cyl(post, 0.016, 0.016, 0.03, m.black, s * 0.025, 0.12, 0, 12).rotation.z = PI / 2
    const arm = group(post, 0, s > 0 ? 0.36 : 0.28, 0.0)
    arm.rotation.y = s > 0 ? -0.18 : 0
    k.box(arm, 0.08, 0.02, 0.5, L.trim, 0, 0.0, 0.22)
    k.soft(arm, 0.15, 0.06, 0.56, 0.025, m.vinylSeat, 0, 0.04, 0.24)
    k.box(arm, 0.13, 0.003, 0.004, L.darkTrim, 0, 0.07, 0.04, false)
  }
  // The footrest: a flip-up plate on its bracket.
  k.box(p, 0.06, 0.04, 0.3, L.trim, 0, 0.33, 0.38)
  const fr = group(p, 0, 0.2, 0.5)
  fr.rotation.x = 0.45
  k.soft(fr, 0.46, 0.035, 0.28, 0.012, m.black, 0, 0, 0.1)
  for (let i = 0; i < 5; i++) k.box(fr, 0.42, 0.004, 0.012, m.rubber, 0, 0.02, 0.0 + i * 0.05, false)
}
