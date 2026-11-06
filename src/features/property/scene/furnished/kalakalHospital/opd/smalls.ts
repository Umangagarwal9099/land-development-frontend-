import { TorusGeometry, type Material, type Object3D } from 'three'
import { PI } from '../../kit'
import { rng } from '../../textures'
import { bentTube, cupboardDoor, carcass, castor, drawer, face, geo, group, lathe, panel, pillow, put, rod, type Ctx } from '../erKit'
import { packs } from '../erFurniture'
import type { OpdCtx } from './ctx'
import {
  antisepticBottle, bandageRoll, bpDigital, coil, cottonRoll, cpuTower, extrude, gallipot, gauzePacks, hose, instrumentTray, irThermometer, itemMats,
  keyboard, kidneyTray, laserPrinter, monitor24, mouse, oximeterClip, phone, regulator, stethoscopeItem, syringe, tapeRoll,
} from './equipment/items'
import { notice } from './paints'

/*
 * The OPD's small clinical items and equipment, shared by every floor: what stands on a doctor's
 * desk (computer, phone, printer, stethoscope, BP monitor, thermometer, oximeter), what hangs on
 * clinical walls (diagnostic sets, dispensers, basins, clocks, screens, viewers), the colour-coded
 * biomedical waste bins, sharps, gloves and bottles, dressings and trolleys, scales, refrigerators
 * and what fills shelves. Each is modelled from the product (see equipment/items.ts for the
 * detailed parts): own frame, front +z, standing on y = 0.
 */

/* ---------- on the desk ---------- */

/**
 * A desktop computer at a desk: a 24" monitor on its stand, the keyboard and mouse in front, the
 * small-form-factor PC standing beside the screen; the screen faces +z (turn the group to face the user).
 */
export function computer(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry: number, screen: Material) {
  const g = group(p, x, y, z, ry)
  monitor24(e, g, screen, 0, 0, -0.02)
  keyboard(e, g, 0, 0, 0.24)
  mouse(e, g, 0.31, 0, 0.25, -0.1)
  // The mouse mat under the mouse.
  e.k.box(g, 0.22, 0.003, 0.18, itemMats(e).graphite, 0.31, 0.0015, 0.25, false)
  cpuTower(e, g, 0.42, 0, -0.08, -PI / 2)
  return g
}

/** A desk telephone: backlit display, keypad, the handset in its cradle and its coiled cord. */
export function deskPhone(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  return phone(e, p, x, y, z, ry)
}

/** A desktop laser printer, a printed page in its output tray. */
export function printer(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  return laserPrinter(e, p, x, y, z, ry)
}

/** A stethoscope lying on a desk: dual-head chest piece, Y-tubing, binaurals with their spring. */
export function stethoscope(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  return stethoscopeItem(e, p, x, y, z, ry)
}

/** A digital upper-arm blood pressure monitor with its cuff and air hose, on a desk. */
export function bpMonitor(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  return bpDigital(e, p, x, y, z, ry)
}

/** An infrared non-contact thermometer, lying on its side. */
export function thermometer(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  return irThermometer(e, p, x, y, z, ry)
}

/** A fingertip pulse oximeter. */
export function oximeter(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  return oximeterClip(e, p, x, y, z, ry)
}

/** A few case papers in a clip folder, a prescription pad and a pen on a desk. */
export function papers(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const t = itemMats(e)
  const g = group(p, x, y, z, ry)
  const sheet = t.printed('casePaper', 256, 362, (c, w, h) => {
    const r = rng(17)
    c.fillStyle = '#fbfaf6'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#1c3966'
    c.fillRect(w * 0.06, h * 0.04, w * 0.88, h * 0.05)
    c.fillStyle = '#5a6270'
    for (let i = 0; i < 22; i++) c.fillRect(w * 0.08, h * (0.14 + i * 0.037), w * (0.3 + r() * 0.55), 1.5)
    c.strokeStyle = '#1a3a8a'
    c.lineWidth = 1.5
    c.beginPath()
    for (let i = 0; i < 40; i++) c.lineTo(w * (0.1 + i * 0.019), h * (0.55 + Math.sin(i * 1.3) * 0.012 + (i % 9) * 0.004))
    c.stroke()
  }, 0.85)
  // A clipboard: hardboard, the sheets, the steel clip.
  k.box(g, 0.23, 0.004, 0.32, t.graphite, 0, 0.002, 0, false)
  face(e, g, 0.21, 0.297, sheet, 0, 0.0055, 0.01).rotation.x = -PI / 2
  k.box(g, 0.1, 0.012, 0.03, t.satin, 0, 0.008, -0.14, false)
  // Loose sheets, the prescription pad, the pen.
  face(e, g, 0.21, 0.297, sheet, 0.25, 0.002, 0.03).rotation.set(-PI / 2, 0, 0.08)
  k.box(g, 0.15, 0.012, 0.21, m.paper, 0.27, 0.006, -0.02, false)
  const pen = group(g, 0.12, 0.006, 0.12, 0.4)
  put(pen, lathe(e, 'pen', [[0, 0], [0.004, 0.004], [0.0045, 0.12], [0.003, 0.135], [0, 0.138]], 10), m.blue).rotation.z = PI / 2
  rod(e, pen, 0.0012, 0.04, t.satin, -0.03, 0.004, 0.003, 'x', 6)
  return g
}

/* ---------- on the walls ---------- */

/**
 * The wall diagnostic set beside a couch: the transformer with its two handles (otoscope and
 * ophthalmoscope heads) in their cradles and coiled cords, the specula dispenser; beside it the
 * aneroid sphygmomanometer with its cuff basket and coiled hose.
 */
export function diagnosticWall(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const t = itemMats(e)
  // The transformer: a moulded white wall unit with the two cradles, each handle with its head.
  put(p, panel(e, 0.36, 0.2, 0.06, 0.02), t.shell, -0.14, 1.45, 0.03)
  k.box(p, 0.32, 0.004, 0.004, t.shellGrey, -0.14, 1.52, 0.061, false)
  for (const [x, head] of [[-0.24, 'oto'], [-0.11, 'oph']] as const) {
    put(p, lathe(e, 'diagHandle', [[0, 0], [0.014, 0], [0.016, 0.01], [0.016, 0.1], [0.013, 0.13], [0, 0.13]], 18), t.graphite, x, 1.42, 0.075)
    for (let i = 0; i < 5; i++) put(p, geo(e, 'knurl', () => new TorusGeometry(0.0162, 0.0012, 4, 18)), t.satin, x, 1.45 + i * 0.012, 0.075).rotation.x = PI / 2
    if (head === 'oto') {
      put(p, lathe(e, 'otoHead', [[0, 0], [0.016, 0], [0.018, 0.02], [0.009, 0.05], [0.004, 0.065], [0, 0.065]], 16), t.graphite, x, 1.55, 0.075)
    } else {
      put(p, panel(e, 0.034, 0.05, 0.022, 0.008), t.graphite, x, 1.575, 0.075)
      k.cyl(p, 0.012, 0.012, 0.004, t.shellGrey, x, 1.585, 0.087, 16).rotation.x = PI / 2
    }
    put(p, coil(e, `diagCord${x}`, [x, 1.42, 0.07], [x + 0.04, 1.32, 0.05], 10, 0.007, 0.0015), t.graphite)
  }
  // Specula dispenser at the end of the unit.
  put(p, panel(e, 0.05, 0.12, 0.05, 0.01), t.clear, 0.0, 1.45, 0.06)
  for (let i = 0; i < 6; i++) put(p, lathe(e, 'speculum', [[0, 0], [0.006, 0], [0.002, 0.02], [0, 0.02]], 10), t.graphite, 0.0, 1.4 + i * 0.016, 0.06).rotation.x = PI / 2
  // The wall aneroid: case, dial, cuff basket, coiled hose to the bulb-less cuff.
  const ga = group(p, 0.18, 1.5, 0)
  put(ga, lathe(e, 'aneroidCase', [[0, 0], [0.075, 0], [0.078, 0.01], [0.075, 0.04], [0, 0.04]], 28), t.shell).rotation.x = PI / 2
  face(e, ga, 0.13, 0.13, e.o.sign('aneroid2', 256, 256, (c, w, h) => {
    c.fillStyle = '#fbfbf8'
    c.beginPath()
    c.arc(w / 2, h / 2, w * 0.49, 0, PI * 2)
    c.fill()
    c.strokeStyle = '#222'
    c.fillStyle = '#222'
    for (let i = 0; i <= 30; i++) {
      const a = PI * 0.6 + (i / 30) * PI * 1.8
      const r0 = i % 5 ? 0.4 : 0.34
      c.lineWidth = i % 5 ? 1.5 : 3
      c.beginPath()
      c.moveTo(w / 2 + Math.cos(a) * w * r0, h / 2 + Math.sin(a) * h * r0)
      c.lineTo(w / 2 + Math.cos(a) * w * 0.45, h / 2 + Math.sin(a) * h * 0.45)
      c.stroke()
      if (i % 5 === 0) {
        c.font = `700 ${w * 0.075}px Helvetica`
        c.textAlign = 'center'
        c.fillText(String(i * 10), w / 2 + Math.cos(a) * w * 0.26, h / 2 + Math.sin(a) * h * 0.26 + w * 0.025)
      }
    }
    c.font = `700 ${w * 0.06}px Helvetica`
    c.fillText('mmHg', w / 2, h * 0.7)
    c.strokeStyle = '#111'
    c.lineWidth = 3
    c.beginPath()
    c.moveTo(w / 2, h / 2)
    c.lineTo(w / 2 + Math.cos(PI * 0.62) * w * 0.4, h / 2 + Math.sin(PI * 0.62) * h * 0.4)
    c.stroke()
  }), 0, 0, 0.041)
  k.cyl(ga, 0.066, 0.066, 0.002, t.clear, 0, 0, 0.043, 24).rotation.x = PI / 2
  put(ga, panel(e, 0.14, 0.09, 0.07, 0.012), t.shell, 0, -0.2, 0.035)
  put(ga, pillow(e, 0.12, 0.035, 0.07), t.cuff, 0, -0.17, 0.04)
  put(ga, coil(e, 'aneroidHose', [0, -0.07, 0.03], [0.02, -0.16, 0.06], 12, 0.008, 0.0025), t.tubeGrey)
  void m
}

/** A wall-mounted soap or alcohol-rub dispenser (1 L cartridge): its shell, window, push lever and drip tray. */
function dispenser(e: Ctx, p: Object3D, x: number, y: number, tint: Material, label: string) {
  const { k } = e
  const t = itemMats(e)
  const g = group(p, x, y, 0)
  put(g, panel(e, 0.11, 0.26, 0.11, 0.02), t.shell, 0, 0.13, 0.055)
  k.box(g, 0.05, 0.08, 0.004, t.clear, 0, 0.18, 0.111, false)
  k.box(g, 0.044, 0.05, 0.003, tint, 0, 0.165, 0.11, false)
  put(g, extrude(e, 'dispLever', [[-0.045, 0], [0.045, 0], [0.04, 0.05], [-0.04, 0.05]], 0.02, 0.003), t.shellGrey, 0, 0.0, 0.1).rotation.x = -PI / 2
  face(e, g, 0.08, 0.025, t.printed(`disp_${label}`, 160, 50, (c, w, h) => {
    c.fillStyle = '#ffffff'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#1c3966'
    c.font = `700 ${h * 0.45}px Helvetica`
    c.fillText(label, w * 0.06, h * 0.7)
  }), 0, 0.235, 0.1115)
  return g
}

/** A wall-mounted clinical hand-hygiene set: alcohol rub and liquid soap dispensers, a paper towel dispenser. */
export function dispensers(e: OpdCtx, p: Object3D, y = 1.3) {
  const { k, m } = e
  const t = itemMats(e)
  dispenser(e, p, -0.22, y, m.blue, 'HAND RUB')
  dispenser(e, p, 0, y, m.green, 'SOAP')
  // The towel dispenser: front cover with its sight window, the slot, the folded towels showing.
  const tw = group(p, 0.3, y + 0.05, 0)
  put(tw, panel(e, 0.28, 0.36, 0.12, 0.02), t.shell, 0, 0.18, 0.06)
  k.box(tw, 0.1, 0.012, 0.004, t.clear, 0, 0.26, 0.121, false)
  k.box(tw, 0.18, 0.008, 0.03, t.graphite, 0, 0.01, 0.1, false)
  k.box(tw, 0.17, 0.03, 0.01, m.paper, 0, -0.008, 0.1, false)
}

/**
 * A clinical hand-wash basin: wall-hung vitreous china without overflow, a non-concussive elbow
 * lever mixer on its swan neck, the bottle trap and its waste to the wall, the angle valves on the
 * supplies; the dispensers and the hand-washing poster over it.
 */
export function basin(e: OpdCtx, p: Object3D, w = 0.6) {
  const { k } = e
  const t = itemMats(e)
  // The bowl: a turned basin squared off at the back, its rim at 0.86.
  const bowl = group(p, 0, 0.86, 0.24)
  const sx = w / 0.5
  put(bowl, lathe(e, 'basinOuter', [[0.03, -0.2], [0.12, -0.19], [0.2, -0.13], [0.24, -0.05], [0.25, 0.0], [0.24, 0.012], [0.22, 0.012], [0.21, -0.02], [0.17, -0.1], [0.08, -0.15], [0.03, -0.155], [0, -0.155]], 32), t.china).scale.set(sx, 1, 0.9)
  k.box(bowl, w, 0.22, 0.04, t.china, 0, -0.09, -0.22)
  put(bowl, lathe(e, 'basinWaste', [[0, 0], [0.024, 0], [0.024, 0.004], [0, 0.004]], 18), t.chrome, 0, -0.154, 0.02)
  // The trap below, and its waste into the wall; the two supplies with their angle valves.
  put(p, lathe(e, 'bottleTrap', [[0, -0.12], [0.03, -0.12], [0.034, -0.1], [0.034, -0.02], [0.016, 0], [0.016, 0.1], [0, 0.1]], 18), t.chrome, 0, 0.6, 0.26)
  put(p, bentTube(e, 'trapWaste', [[0, 0, 0], [0, 0, -0.1], [0, 0, -0.24]], 0.016, 0.03), t.chrome, 0, 0.62, 0.25)
  for (const s of [-1, 1]) {
    put(p, lathe(e, 'angleValve', [[0, 0], [0.012, 0], [0.012, 0.04], [0, 0.04]], 12), t.chrome, s * 0.12, 0.56, 0.0).rotation.x = PI / 2
    put(p, lathe(e, 'avHandle', [[0, 0], [0.014, 0], [0.012, 0.012], [0, 0.014]], 12), t.chrome, s * 0.12, 0.6, 0.025)
    put(p, hose(e, `supply${s}`, [[s * 0.12, 0.56, 0.04], [s * 0.1, 0.66, 0.08], [s * 0.04, 0.74, 0.07]], 0.004, 8), t.satin)
  }
  // The mixer on the wall above the bowl: a swan neck outlet and a long elbow lever.
  const mx = group(p, 0, 1.0, 0)
  put(mx, lathe(e, 'mixerBody', [[0, 0], [0.028, 0], [0.028, 0.07], [0, 0.07]], 20), t.chrome).rotation.x = PI / 2
  put(mx, bentTube(e, 'swanNeck', [[0, 0.0, 0.06], [0, 0.07, 0.1], [0, 0.04, 0.2], [0, -0.04, 0.2]], 0.011, 0.05), t.chrome)
  put(mx, extrude(e, 'elbowLever', [[0, -0.008], [0.18, -0.004], [0.18, 0.004], [0, 0.008]], 0.01, 0.003), t.chrome, 0.02, 0.0, 0.06)
  dispensers(e, group(p, 0, 0, 0), 1.3)
  face(e, p, 0.3, 0.42, e.m.poster, w / 2 + 0.32, 1.5, 0.004)
}

/** A wall clock: a 300 mm white case with its glass, the face, the hands. */
export function clock(e: OpdCtx, p: Object3D, y = 2.3) {
  const t = itemMats(e)
  const c = put(p, lathe(e, 'clockCase', [[0, 0], [0.155, 0], [0.16, 0.01], [0.158, 0.04], [0.15, 0.045], [0.14, 0.04], [0, 0.04]], 32), t.shell, 0, y, 0)
  c.rotation.x = PI / 2
  face(e, p, 0.28, 0.28, e.m.clock, 0, y, 0.0402)
  e.k.cyl(p, 0.142, 0.142, 0.002, t.clear, 0, y, 0.044, 32).rotation.x = PI / 2
}

/** A framed notice or poster on a wall at height y (its centre): a slim aluminium snap frame. */
export function poster(e: OpdCtx, p: Object3D, title: string, band: string, w = 0.42, h = 0.6, y = 1.55) {
  const { k, m } = e
  let seed = 0
  for (const c of title) seed = (seed * 31 + c.charCodeAt(0)) % 9973
  for (const s of [-1, 1]) {
    k.box(p, w + 0.03, 0.015, 0.012, m.aluminium, 0, y + s * (h / 2 + 0.0075), 0.006)
    k.box(p, 0.015, h, 0.012, m.aluminium, s * (w / 2 + 0.0075), y, 0.006)
  }
  k.box(p, w, h, 0.004, m.paper, 0, y, 0.002, false)
  face(e, p, w, h, e.o.sign(`poster_${title}`, 360, Math.round((360 * h) / w), notice(title, band, seed)), 0, y, 0.0045)
  k.box(p, w, h, 0.001, itemMats(e).clear, 0, y, 0.008, false)
}

/** A wall-mounted flat screen (a token display, a TV), w wide: its thin bezel, tapered back, the wall bracket. */
export function wallScreen(e: OpdCtx, p: Object3D, w: number, y: number, mat: Material) {
  const { k } = e
  const t = itemMats(e)
  const h = w * 0.5625
  k.box(p, 0.3, 0.3, 0.02, t.powderGrey, 0, y, 0.01)
  put(p, panel(e, w * 0.8, h * 0.8, 0.03, 0.02), t.matteBlack, 0, y, 0.035)
  put(p, panel(e, w, h, 0.016, 0.004), t.glossBlack, 0, y, 0.058)
  face(e, p, w - 0.022, h - 0.022, mat, 0, y + 0.002, 0.0665)
  k.box(p, 0.03, 0.006, 0.004, t.shellGrey, 0, y - h / 2 + 0.006, 0.0665, false)
}

/** An X-ray film viewer: a wall lightbox of `n` panels, its white enamelled case, film clips across the top, a film on the first. */
export function viewer(e: OpdCtx, p: Object3D, n = 2, y = 1.55) {
  const { k, m } = e
  const t = itemMats(e)
  const w = 0.4 * n + 0.06
  put(p, panel(e, w, 0.56, 0.08, 0.01), t.shell, 0, y, 0.04)
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 0.03 + 0.2 + i * 0.4
    face(e, p, 0.38, 0.46, e.o.screen('viewerPanel', 32, 32, (c, ww, hh) => {
      c.fillStyle = '#f2f6fb'
      c.fillRect(0, 0, ww, hh)
    }, 1.2), x, y + 0.02, 0.0805)
    k.box(p, 0.36, 0.012, 0.012, t.shellGrey, x, y + 0.24, 0.085, false)
    for (const dx of [-0.12, 0.12]) k.box(p, 0.03, 0.02, 0.008, t.graphite, x + dx, y + 0.24, 0.093, false)
    if (i === 0) face(e, p, 0.34, 0.42, e.o.sign('chestFilm', 256, 320, (c, ww, hh) => {
      c.fillStyle = '#0b0b0b'
      c.fillRect(0, 0, ww, hh)
      const gr = c.createRadialGradient(ww / 2, hh * 0.5, 10, ww / 2, hh * 0.5, ww * 0.6)
      gr.addColorStop(0, 'rgba(120,120,120,.2)')
      gr.addColorStop(1, 'rgba(0,0,0,0)')
      c.fillStyle = gr
      c.fillRect(0, 0, ww, hh)
      c.strokeStyle = 'rgba(230,230,230,.75)'
      c.lineWidth = 3
      for (let r = 0; r < 8; r++) {
        c.beginPath()
        c.ellipse(ww / 2, hh * (0.28 + r * 0.07), ww * 0.32, hh * 0.035, 0, PI, 2 * PI)
        c.stroke()
      }
      c.fillStyle = 'rgba(220,220,220,.8)'
      c.fillRect(ww / 2 - 6, hh * 0.15, 12, hh * 0.7)
    }), x, y + 0.02, 0.083)
  }
  k.box(p, 0.03, 0.02, 0.01, m.green, w / 2 - 0.05, y - 0.25, 0.082, false)
}

/* ---------- waste, sharps, hygiene ---------- */

export type BinColour = 'yellow' | 'red' | 'blue' | 'white' | 'black' | 'green'

const binCache = new WeakMap<object, Record<BinColour, Material>>()
/** Moulded polypropylene bin colours. */
function binTones(e: Ctx): Record<BinColour, Material> {
  let c = binCache.get(e.m)
  if (c) return c
  const t = itemMats(e)
  c = { yellow: t.caps.gold, red: t.caps.red, blue: t.caps.blue, white: t.shell, black: t.graphite, green: t.caps.green }
  binCache.set(e.m, c)
  return c
}

/**
 * A row of foot-pedal bins for segregation at source, as the Bio-Medical Waste Management Rules
 * require: yellow (anatomical, soiled dressings), red (contaminated plastics), white translucent
 * (sharps), blue (glass), black (general), green (wet). Each a tapered moulded body on a steel
 * pedal frame, its hinged lid shut over the liner's turned-down lip, its category label; large
 * ones on two wheels with a rear handle.
 */
export function bins(e: OpdCtx, p: Object3D, colours: BinColour[], size: 'small' | 'large' = 'small') {
  const { k, m } = e
  const t = itemMats(e)
  const tone = binTones(e)
  const R = size === 'large' ? 0.2 : 0.15
  const H = size === 'large' ? 0.62 : 0.46
  colours.forEach((c, i) => {
    const x = (i - (colours.length - 1) / 2) * (R * 2 + 0.05)
    const g = group(p, x, 0, 0)
    put(g, lathe(e, `binBody${size}`, [[0, 0.02], [R * 0.86, 0.02], [R * 0.88, 0.035], [R, H - 0.02], [R * 1.02, H], [0, H]], 28), tone[c])
    // The liner's lip folded over the rim.
    put(g, lathe(e, `binLip${size}`, [[R * 0.99, H - 0.035], [R * 1.035, H - 0.03], [R * 1.035, H + 0.002], [R * 0.99, H + 0.002]], 28), c === 'white' ? t.clear : tone[c])
    // The lid, domed a little, its hinge at the back.
    put(g, lathe(e, `binLid${size}`, [[0, 0.018], [R * 0.6, 0.016], [R * 1.04, 0.004], [R * 1.05, 0], [0, 0]], 28), tone[c], 0, H + 0.002, 0)
    k.box(g, R * 0.5, 0.02, 0.025, t.graphite, 0, H, -R - 0.006)
    // The pedal frame: a steel bar under the front, the pedal plate, the rod up the back.
    k.box(g, R * 0.9, 0.012, 0.06, t.satin, 0, 0.03, R + 0.02)
    put(g, extrude(e, 'binPedal', [[-0.05, 0], [0.05, 0], [0.045, 0.012], [-0.045, 0.012]], 0.06, 0.003), t.graphite, 0, 0.035, R + 0.04).rotation.x = 0
    k.cyl(g, 0.005, 0.005, H - 0.05, t.satin, 0, H / 2, -R - 0.012, 8)
    if (size === 'large') {
      for (const s of [-1, 1]) {
        const w = put(g, lathe(e, 'binWheel', [[0.012, -0.015], [0.05, -0.015], [0.055, 0], [0.05, 0.015], [0.012, 0.015]], 16), t.rubber, s * (R * 0.7), 0.055, -R + 0.02)
        w.rotation.z = PI / 2
      }
      put(g, bentTube(e, 'binHandle', [[-0.08, 0, 0], [-0.08, 0, -0.03], [0.08, 0, -0.03], [0.08, 0, 0]], 0.008, 0.015), t.graphite, 0, H - 0.04, -R)
    }
    face(e, g, R * 0.9, R * 0.6, e.o.sign(`binlabel_${c}`, 128, 96, (gg, w, hh) => {
      gg.fillStyle = '#ffffff'
      gg.fillRect(0, 0, w, hh)
      gg.fillStyle = '#111'
      gg.beginPath()
      gg.arc(w * 0.18, hh * 0.45, hh * 0.22, 0, PI * 2)
      gg.lineWidth = 3
      gg.strokeStyle = '#111'
      gg.stroke()
      for (let a = 0; a < 3; a++) {
        gg.beginPath()
        gg.arc(w * 0.18 + Math.cos(a * 2.1 - PI / 2) * hh * 0.11, hh * 0.45 + Math.sin(a * 2.1 - PI / 2) * hh * 0.11, hh * 0.1, 0, PI * 2)
        gg.stroke()
      }
      gg.font = `700 ${hh * 0.2}px Helvetica`
      gg.textAlign = 'left'
      gg.fillText('BIOHAZARD', w * 0.36, hh * 0.38)
      gg.font = `500 ${hh * 0.15}px Helvetica`
      gg.fillText(c === 'black' ? 'GENERAL WASTE' : c === 'green' ? 'WET WASTE' : `${c.toUpperCase()} CATEGORY`, w * 0.36, hh * 0.66)
    }), 0, H * 0.62, R * 0.96 + 0.004)
    void m
  })
}

/**
 * A sharps container on its wall bracket: the moulded yellow box with its red lid, the aperture
 * with its temporary closure flap, the fill line, the steel bracket behind.
 */
export function sharps(e: OpdCtx, p: Object3D, y = 1.2) {
  const { k } = e
  const t = itemMats(e)
  put(p, panel(e, 0.18, 0.3, 0.02, 0.01), t.satin, 0, y - 0.02, 0.01)
  put(p, extrude(e, 'sharpsBody', [[-0.11, -0.14], [0.11, -0.14], [0.115, 0.12], [-0.115, 0.12]], 0.14, 0.012), t.caps.gold, 0, y, 0.09)
  put(p, extrude(e, 'sharpsLid', [[-0.118, 0], [0.118, 0], [0.11, 0.05], [-0.11, 0.05]], 0.15, 0.008), t.caps.red, 0, y + 0.12, 0.09)
  k.box(p, 0.09, 0.006, 0.04, t.graphite, 0, y + 0.172, 0.11, false)
  k.box(p, 0.1, 0.004, 0.05, t.caps.red, 0, y + 0.176, 0.105, false)
  k.box(p, 0.2, 0.004, 0.002, t.graphite, 0, y + 0.06, 0.161, false)
  face(e, p, 0.12, 0.08, e.o.sign('sharpsLabel', 128, 96, (c, w, h) => {
    c.fillStyle = '#ffd400'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#111'
    c.font = `700 ${h * 0.22}px Helvetica`
    c.fillText('SHARPS', w * 0.08, h * 0.38)
    c.font = `500 ${h * 0.14}px Helvetica`
    c.fillText('Do not fill above line', w * 0.08, h * 0.66)
  }), 0, y - 0.04, 0.161)
}

/** A box of nitrile examination gloves in its wall-mounted wire holder (or flat on a surface): printed carton, oval slot, a glove cuff showing. */
export function gloveBox(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const t = itemMats(e)
  const g = group(p, x, y, z, ry)
  const top = t.printed('gloveTop', 256, 128, (c, w, h) => {
    c.fillStyle = '#ffffff'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#2f62b0'
    c.fillRect(0, 0, w, h * 0.18)
    c.fillRect(0, h * 0.82, w, h * 0.18)
    c.fillStyle = '#c7d3e6'
    c.beginPath()
    c.ellipse(w / 2, h / 2, w * 0.3, h * 0.2, 0, 0, PI * 2)
    c.fill()
    c.fillStyle = '#2f62b0'
    c.font = `700 ${h * 0.12}px Helvetica`
    c.fillText('NITRILE  M', w * 0.06, h * 0.13)
  })
  k.box(g, 0.24, 0.07, 0.12, m.paper, 0, 0.035, 0)
  face(e, g, 0.24, 0.12, top, 0, 0.0705, 0).rotation.x = -PI / 2
  put(g, pillow(e, 0.06, 0.03, 0.05), m.blue, 0.0, 0.08, 0.0)
  return g
}

/** A bottle: a turned body of radius r with its shoulder and neck, `body` and `cap` materials, a label band. */
export function bottle(e: OpdCtx, p: Object3D, x: number, y: number, z: number, h: number, r: number, body: Material, cap: Material) {
  const { k } = e
  const t = itemMats(e)
  put(p, lathe(e, `bottle${h.toFixed(3)}|${r.toFixed(3)}`, [[0, 0], [r * 0.9, 0], [r, r * 0.12], [r, h * 0.74], [r * 0.55, h * 0.84], [r * 0.45, h * 0.86], [r * 0.45, h * 0.88], [0, h * 0.88]], 18), body, x, y, z)
  put(p, lathe(e, `bcap${(r * 0.5).toFixed(3)}`, [[0, 0], [r * 0.5, 0], [r * 0.5, h * 0.1], [r * 0.44, h * 0.12], [0, h * 0.12]], 14), cap, x, y + h * 0.87, z)
  const lb = k.cyl(p, r + 0.0005, r + 0.0005, h * 0.36, t.printed('reagentLabel', 128, 64, (c, w, hh) => {
    c.fillStyle = '#fbfbf7'
    c.fillRect(0, 0, w, hh)
    c.fillStyle = '#1c3966'
    c.fillRect(0, 0, w, hh * 0.25)
    c.fillStyle = '#444'
    for (let i = 0; i < 3; i++) c.fillRect(w * 0.08, hh * (0.4 + i * 0.17), w * (0.5 + i * 0.1), hh * 0.06)
  }), x, y + h * 0.42, z, 16)
  lb.castShadow = false
}

/* ---------- dressings and trolleys ---------- */

/**
 * Dressing supplies laid out w × d on a tray or shelf at y: cotton wool in its blue wrap, crêpe and
 * gauze bandage rolls, sterile gauze packs, povidone-iodine and chlorhexidine, surgical tape, a box
 * of gloves, a kidney tray, a sealed syringe.
 */
export function dressingSupplies(e: OpdCtx, p: Object3D, w: number, d: number, y: number) {
  const r = rng(Math.round(w * 1000 + d * 100 + y * 10))
  const back = -d / 2 + 0.07
  const front = d / 2 - 0.07
  if (w > 0.55) cottonRoll(e, p, -w / 2 + 0.07, y, front - 0.02, PI / 2)
  bandageRoll(e, p, -w / 2 + 0.06, y, back, 0.1)
  bandageRoll(e, p, -w / 2 + 0.14, y, back, -0.05, true)
  gauzePacks(e, p, w * 0.02, y, back + 0.01, 3 + Math.floor(r() * 2), (r() - 0.5) * 0.2)
  antisepticBottle(e, p, w / 2 - 0.06, y, back, 'iodine', 0.16)
  antisepticBottle(e, p, w / 2 - 0.14, y, back, 'chlorhexidine', 0.14)
  tapeRoll(e, p, w / 2 - 0.07, y, front)
  if (w > 0.4) gloveBox(e, p, w * 0.08, y, front - 0.01, (r() - 0.5) * 0.2)
  if (w > 0.6) kidneyTray(e, p, -w / 2 + 0.25, y, 0.0, 0.2)
  syringe(e, p, w / 2 - 0.2, y, front - 0.02, 0.3, 5)
}

/**
 * A stainless two-tier dressing trolley on castors: a tubular frame with a push handle, two
 * dished shelves with raised edges, a drawer; on top an instrument tray on its green drape, a
 * gallipot of antiseptic and dressings; packs and bottles below; a yellow bag on its ring.
 */
export function dressingTrolley(e: OpdCtx, p: Object3D, w = 0.75, d = 0.48) {
  const { k } = e
  const t = itemMats(e)
  // Frame: four uprights bent into a push handle at one end, castors under, two with brakes.
  for (const sz of [-1, 1]) {
    put(p, bentTube(e, `dtFrame${w}|${d}`, [[-w / 2 + 0.02, 0.07, 0], [-w / 2 + 0.02, 0.95, 0], [w / 2 - 0.02, 0.95, 0], [w / 2 - 0.02, 0.07, 0]], 0.0125, 0.04), t.satin, 0, 0, sz * (d / 2 - 0.02))
    for (const sx of [-1, 1]) castor(e, p, sx * (w / 2 - 0.03), sz * (d / 2 - 0.03), 0.04, 0.2 * sx, sx > 0)
  }
  put(p, bentTube(e, `dtHandle${d}`, [[0, 0, -d / 2 + 0.02], [0.08, 0.06, -d / 2 + 0.02], [0.08, 0.06, d / 2 - 0.02], [0, 0, d / 2 - 0.02]], 0.011, 0.03), t.satin, -w / 2 + 0.02, 0.95, 0)
  // Shelves: dished stainless sheets with upturned edges.
  for (const y of [0.3, 0.86]) {
    k.box(p, w - 0.04, 0.0015, d - 0.04, t.satin, 0, y, 0)
    for (const s of [-1, 1]) {
      k.box(p, w - 0.04, 0.025, 0.0015, t.satin, 0, y + 0.012, s * (d / 2 - 0.02))
      k.box(p, 0.0015, 0.025, d - 0.04, t.satin, s * (w / 2 - 0.02), y + 0.012, 0)
    }
  }
  // A shallow drawer under the top shelf.
  drawer(e, p, 0, 0.8, d / 2 - 0.02, { w: w - 0.1, h: 0.08, d: d - 0.08, front: itemMats(e).satin, handle: 'bar', label: 'Trolley Drawer', fill: packs(e, [e.m.paper, e.m.whitePlastic, e.m.blue], [0.06, 0.03, 0.1]) })
  // Top: the instrument tray, a gallipot of iodine and one of saline, dressings.
  instrumentTray(e, p, -w / 4 + 0.02, 0.862, -0.02, 0, Math.round(w * 100))
  gallipot(e, p, 0.08, 0.862, -d / 2 + 0.08, true)
  gallipot(e, p, 0.08, 0.862, -d / 2 + 0.16)
  dressingSupplies(e, group(p, w / 4 + 0.04, 0, 0), w / 2 - 0.12, d - 0.08, 0.862)
  dressingSupplies(e, group(p, 0, 0, 0), w - 0.1, d - 0.08, 0.302)
  // The waste ring on its bracket at the far end, a yellow bag in it.
  rod(e, p, 0.006, 0.12, t.satin, w / 2 + 0.06, 0.85, 0, 'x', 8)
  put(p, geo(e, 'wasteRing', () => new TorusGeometry(0.11, 0.006, 6, 24)), t.satin, w / 2 + 0.17, 0.85, 0).rotation.x = PI / 2
  put(p, lathe(e, 'wasteBag', [[0, -0.32], [0.06, -0.31], [0.1, -0.2], [0.11, -0.02], [0.115, 0.01], [0, 0.01]], 18), t.caps.gold, w / 2 + 0.17, 0.85, 0)
}

/**
 * A medicine or injection trolley: a moulded ABS body on four castors, a raised-edge top with a
 * syringe tray, two drawers that open (stocked), a cupboard below, a sharps box on its side bracket.
 */
export function injectionTrolley(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const t = itemMats(e)
  const w = 0.6
  const d = 0.45
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * (w / 2 - 0.04), sz * (d / 2 - 0.04), 0.04, 0, sz > 0)
  carcass(e, p, w, 0.86, d, t.shell, [0.3], 0.12, undefined)
  put(p, panel(e, w + 0.03, d + 0.03, 0.04, 0.02), t.shellGrey, 0, 0.88, -d / 2).rotation.x = PI / 2
  for (const s of [-1, 1]) k.box(p, w + 0.03, 0.03, 0.012, t.shellGrey, 0, 0.915, -d / 2 + s * (d / 2 + 0.01))
  for (let i = 0; i < 2; i++) drawer(e, p, 0, 0.76 - i * 0.16, 0, { w: w - 0.006, h: 0.155, d: d - 0.04, front: m.blue, handle: 'grip', label: 'Trolley Drawer', fill: packs(e, [m.whitePlastic, m.blue, m.paper, m.purple], [0.06, 0.04, 0.12]) })
  cupboardDoor(e, p, -w / 2 + 0.002, 0.21, 0, { w: w - 0.006, h: 0.18, hinge: 'left', face: t.shell, label: 'Trolley Cupboard', angle: 1.6 })
  // On top: a kidney tray, syringes, ampoules in a rack, a bottle of spirit.
  kidneyTray(e, p, -0.12, 0.9, -d / 2 + 0.02, 0.1)
  for (let i = 0; i < 3; i++) syringe(e, p, 0.06, 0.9, -d / 2 - 0.08 + i * 0.03, 0, i === 0 ? 10 : 5)
  antisepticBottle(e, p, 0.22, 0.9, -d / 2 + 0.1, 'spirit', 0.13)
  for (let i = 0; i < 6; i++) put(p, lathe(e, 'ampoule', [[0, 0], [0.006, 0], [0.006, 0.035], [0.002, 0.042], [0.003, 0.05], [0, 0.052]], 10), m.amber, -0.05 + i * 0.016, 0.9, -d / 2 + 0.14)
  // The sharps box on its side bracket.
  const sg = group(p, w / 2 + 0.06, 0.6, -d / 2)
  k.box(sg, 0.012, 0.18, 0.12, t.satin, -0.06, 0.1, 0)
  put(sg, extrude(e, 'sharpsSmall', [[-0.05, 0], [0.05, 0], [0.052, 0.17], [-0.052, 0.17]], 0.1, 0.008), t.caps.gold)
  put(sg, panel(e, 0.11, 0.1, 0.03, 0.008), t.caps.red, 0, 0.18, 0).rotation.x = PI / 2
}

/* ---------- equipment that stands about ---------- */

/**
 * A weighing scale: an adult digital column scale (platform with its anti-slip mat, the column,
 * the head with its LCD and keys, the telescopic height rod with its headpiece), or a flat
 * digital floor scale with its glass top.
 */
export function scale(e: OpdCtx, p: Object3D, kind: 'column' | 'floor' = 'column') {
  const { k, m } = e
  const t = itemMats(e)
  const disp = t.lit('scaleLcd', 128, 64, (c, w, h) => {
    c.fillStyle = '#b9c7b4'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#1b2219'
    c.font = `700 ${h * 0.6}px Helvetica`
    c.textAlign = 'right'
    c.fillText('68.4', w * 0.8, h * 0.75)
    c.font = `700 ${h * 0.25}px Helvetica`
    c.fillText('kg', w * 0.95, h * 0.75)
  }, 0.35)
  if (kind === 'floor') {
    put(p, panel(e, 0.32, 0.32, 0.03, 0.03), t.graphite, 0, 0.018, 0).rotation.x = PI / 2
    put(p, panel(e, 0.31, 0.31, 0.008, 0.028), t.glossBlack, 0, 0.037, 0).rotation.x = PI / 2
    face(e, p, 0.07, 0.03, disp, 0, 0.0415, 0.12).rotation.x = -PI / 2
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.cyl(p, 0.012, 0.012, 0.008, t.rubber, sx * 0.12, 0.004, sz * 0.12, 12)
    return
  }
  put(p, panel(e, 0.36, 0.42, 0.07, 0.03), t.shellGrey, 0, 0.035, 0).rotation.x = PI / 2
  k.box(p, 0.3, 0.004, 0.34, t.rubber, 0, 0.072, 0.02, false)
  put(p, extrude(e, 'scaleCol', [[-0.035, 0], [0.035, 0], [0.03, 1.2], [-0.03, 1.2]], 0.05, 0.008), t.shell, 0, 0.07, -0.18)
  const head = group(p, 0, 1.3, -0.16)
  head.rotation.x = -0.35
  put(head, panel(e, 0.26, 0.14, 0.07, 0.025), t.shell)
  face(e, head, 0.12, 0.055, disp, -0.03, 0.01, 0.036)
  for (let i = 0; i < 3; i++) k.cyl(head, 0.01, 0.01, 0.006, i === 0 ? m.blue : t.shellGrey, 0.07, 0.035 - i * 0.03, 0.036, 12).rotation.x = PI / 2
  // The telescopic height rod with its scale and the sliding headpiece.
  k.box(p, 0.022, 0.75, 0.018, t.satin, 0, 1.75, -0.2)
  k.box(p, 0.006, 0.7, 0.002, m.black, 0.012, 1.75, -0.19, false)
  put(p, panel(e, 0.18, 0.06, 0.012, 0.01), t.shellGrey, 0, 1.92, -0.14).rotation.x = PI / 2
}

/** A wall-mounted height rod (stadiometer): the graduated aluminium track, the sliding headboard, the floor plate. */
export function stadiometer(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const t = itemMats(e)
  put(p, panel(e, 0.07, 2.05, 0.022, 0.006), t.satin, 0, 1.08, 0.011)
  face(e, p, 0.03, 1.9, t.printed('stadioScale', 32, 512, (c, w, h) => {
    c.fillStyle = '#f7f7f4'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#111'
    for (let i = 0; i <= 190; i++) c.fillRect(0, h - (i / 190) * h, i % 10 ? w * 0.3 : w * 0.7, 1)
  }), 0, 1.1, 0.0225)
  const hb = group(p, 0, 1.72, 0.02)
  k.box(hb, 0.09, 0.06, 0.035, t.shell, 0, 0, 0.0175)
  put(hb, panel(e, 0.26, 0.24, 0.012, 0.02), t.shell, 0, 0.0, 0.14).rotation.x = PI / 2
  put(p, panel(e, 0.4, 0.38, 0.006, 0.01), m.black, 0, 0.003, 0.22).rotation.x = PI / 2
}

/**
 * A medical (pharmacy) refrigerator: the cabinet on its plinth with the compressor grille, a
 * double-glazed door with its magnetic seal and full-height handle (operated), wire shelves
 * stocked, the interior light, the digital temperature controller and alarm in the top panel.
 */
export function medFridge(e: OpdCtx, p: Object3D, label = 'Medical Refrigerator', h = 1.75, w = 0.6) {
  const { k, m } = e
  const t = itemMats(e)
  const d = 0.62
  const shelves = [0.45, 0.8, 1.15, 1.45].filter((s) => s < h - 0.25)
  carcass(e, p, w, h - 0.12, d, t.shell, [], 0.12)
  for (const y of shelves) {
    // A chromed wire shelf: a frame and its wires.
    k.box(p, w - 0.06, 0.006, 0.006, t.satin, 0, y, -0.04)
    k.box(p, w - 0.06, 0.006, 0.006, t.satin, 0, y, -d + 0.06)
    for (let i = 0; i < 9; i++) k.box(p, 0.003, 0.003, d - 0.1, t.satin, -w / 2 + 0.05 + i * ((w - 0.1) / 8), y, -d / 2 - 0.01, false)
    medicineBoxes(e, p, w - 0.08, y + 0.005, -0.05, d - 0.14, 0.22)
  }
  // The top control panel with its display and alarm keys; the compressor grille below.
  put(p, panel(e, w, 0.12, 0.05, 0.01), t.shellGrey, 0, h - 0.06, -0.02)
  k.box(p, 0.1, 0.04, 0.006, t.lit('fridgeTemp', 96, 40, (g, ww, hh) => {
    g.fillStyle = '#071007'
    g.fillRect(0, 0, ww, hh)
    g.fillStyle = '#58ff7a'
    g.font = `700 ${hh * 0.75}px Helvetica`
    g.fillText('+4.6°C', 4, hh * 0.82)
  }, 1.1), -0.12, h - 0.06, 0.006, false)
  for (let i = 0; i < 3; i++) k.cyl(p, 0.009, 0.009, 0.005, i === 2 ? m.red : t.shell, 0.04 + i * 0.035, h - 0.06, 0.006, 12).rotation.x = PI / 2
  for (let i = 0; i < 5; i++) k.box(p, w - 0.1, 0.008, 0.004, t.graphite, 0, 0.03 + i * 0.018, 0.002, false)
  k.box(p, w - 0.06, 0.004, d - 0.1, e.o.cove, 0, h - 0.16, -d / 2, false)
  cupboardDoor(e, p, -w / 2 + 0.002, (h - 0.12) / 2 + 0.06, 0, { w: w - 0.006, h: h - 0.24, hinge: 'left', face: m.aluminium, glass: true, label, angle: 1.7 })
}

/** Medicine cartons and blister packs filling a shelf, w wide and d deep at y, many brands and sizes. */
export function medicineBoxes(e: OpdCtx, p: Object3D, w: number, y: number, z: number, d: number, h = 0.2) {
  const { k } = e
  const mats = medicineMats(e)
  const r = rng(Math.round(w * 977 + y * 131 + d * 17))
  for (let x = -w / 2 + 0.005; x < w / 2 - 0.03; ) {
    const bw = 0.03 + r() * 0.07
    const bh = Math.min(h, 0.06 + r() * 0.12)
    const bd = Math.min(d, 0.08 + r() * 0.1)
    const n = 1 + Math.floor(r() * Math.max(1, (d - 0.02) / bd))
    const mat = mats[Math.floor(r() * mats.length)]
    for (let j = 0; j < n; j++) k.box(p, bw, bh, bd - 0.004, mat, x + bw / 2, y + bh / 2, z - bd / 2 - j * bd, false)
    x += bw + 0.004
  }
}

const medCache = new WeakMap<object, Material[]>()
/** Medicine cartons: white boards printed in a dozen pharmaceutical house styles, the drug name, strength and batch block. */
function medicineMats(e: OpdCtx) {
  let list = medCache.get(e.o)
  if (list) return list
  const styles: [string, string, string][] = [
    ['#ffffff', '#c8161d', 'AMOXYCILLIN 500'], ['#ffffff', '#1f6fd1', 'PARACETAMOL 650'], ['#ffffff', '#1f9d55', 'METFORMIN 500'], ['#f3efe2', '#7a4fa0', 'ATORVASTATIN 10'],
    ['#ffffff', '#f08a00', 'CETIRIZINE 10'], ['#eaf4fb', '#0e5aa7', 'PANTOPRAZOLE 40'], ['#ffffff', '#00897b', 'AZITHROMYCIN 500'], ['#fff6e5', '#b5651d', 'IBUPROFEN 400'],
    ['#ffffff', '#5d6b7c', 'AMLODIPINE 5'], ['#fdeef2', '#c2185b', 'CEFIXIME 200'], ['#ffffff', '#2e7d32', 'TELMISARTAN 40'], ['#eef1f8', '#283593', 'ONDANSETRON 4'],
  ]
  list = styles.map(([bg, ink, name], i) => e.o.sign(`carton2_${i}`, 128, 128, (g, w, h) => {
    g.fillStyle = bg
    g.fillRect(0, 0, w, h)
    g.fillStyle = ink
    g.fillRect(0, h * (0.08 + (i % 3) * 0.04), w, h * 0.16)
    g.fillStyle = '#ffffff'
    g.font = `800 ${h * 0.1}px Helvetica`
    g.fillText(name.split(' ')[0].slice(0, 10), w * 0.05, h * (0.2 + (i % 3) * 0.04))
    g.fillStyle = ink
    g.font = `700 ${h * 0.12}px Helvetica`
    g.fillText(`${name.split(' ')[1]} mg`, w * 0.05, h * 0.5)
    g.fillStyle = '#555'
    g.fillRect(w * 0.05, h * 0.62, w * 0.6, h * 0.04)
    g.fillRect(w * 0.05, h * 0.72, w * 0.45, h * 0.04)
    g.fillStyle = '#111'
    for (let x = w * 0.62; x < w * 0.95; x += 3) g.fillRect(x, h * 0.78, x % 2 ? 1 : 2, h * 0.14)
  }, 0.6))
  medCache.set(e.o, list)
  return list
}

/** Reagent bottles and kits on a shelf: amber and clear bottles with labels and coloured caps, kit boxes. */
export function reagentBottles(e: OpdCtx, p: Object3D, w: number, y: number, z: number, d: number) {
  const { k, m } = e
  const r = rng(Math.round(w * 733 + y * 97))
  for (let x = -w / 2 + 0.04; x < w / 2 - 0.04; ) {
    if (r() < 0.3) {
      const bw = 0.12 + r() * 0.1
      k.box(p, bw, 0.08 + r() * 0.06, Math.min(d, 0.2), [m.whitePlastic, m.paper, m.blue][Math.floor(r() * 3)], x + bw / 2, y + 0.06, z - 0.1, false)
      x += bw + 0.01
      continue
    }
    const rr = 0.025 + r() * 0.025
    bottle(e, p, x + rr, y, z - rr - 0.01 - r() * Math.max(0, d - 2 * rr - 0.02), 0.1 + r() * 0.12, rr, r() < 0.5 ? itemMats(e).amberGlass : itemMats(e).clear, [m.blue, m.red, m.black, m.whitePlastic, m.sharps][Math.floor(r() * 5)])
    x += rr * 2 + 0.012
  }
}

/**
 * A portable oxygen cylinder (B-type, 1.5 m³) on its two-wheeled trolley: the steel base plate and
 * frame with its push handle and retaining strap, rubber wheels, the cylinder with its regulator,
 * flowmeter and humidifier, the green tubing looped on the handle.
 */
export function oxygenTrolley(e: Ctx, p: Object3D, cylinderFn: (e: Ctx, p: Object3D, r: number, h: number, kind: 'in use' | 'full' | 'portable') => void) {
  const { k } = e
  const t = itemMats(e)
  put(p, panel(e, 0.3, 0.26, 0.012, 0.02), t.powderGrey, 0, 0.09, 0).rotation.x = PI / 2
  for (const s of [-1, 1]) {
    const w = put(p, lathe(e, 'o2Wheel', [[0.02, -0.02], [0.07, -0.02], [0.075, 0], [0.07, 0.02], [0.02, 0.02]], 20), t.rubber, s * 0.16, 0.075, -0.1)
    w.rotation.z = PI / 2
    put(p, lathe(e, 'o2Hub', [[0, -0.022], [0.03, -0.022], [0.03, 0.022], [0, 0.022]], 14), t.shellGrey, s * 0.16, 0.075, -0.1).rotation.z = PI / 2
  }
  rod(e, p, 0.008, 0.34, t.satin, 0, 0.075, -0.1, 'x', 8)
  // The frame: two uprights behind the cylinder, the push handle, a strap round the cylinder.
  put(p, bentTube(e, 'o2frame', [[-0.1, 0.1, -0.13], [-0.1, 1.05, -0.13], [-0.08, 1.12, -0.16], [0.08, 1.12, -0.16], [0.1, 1.05, -0.13], [0.1, 0.1, -0.13]], 0.012, 0.05), t.powderGrey)
  for (const y of [0.45, 0.85]) {
    put(p, geo(e, 'o2strap', () => new TorusGeometry(0.098, 0.006, 4, 28, PI * 1.6)), t.graphite, 0, y, 0).rotation.set(PI / 2, 0, -PI * 0.3)
    k.box(p, 0.22, 0.03, 0.01, t.powderGrey, 0, y, -0.125)
  }
  cylinderFn(e, group(p, 0, 0.1, 0), 0.09, 0.95, 'portable')
  // A portable regulator on the cylinder's valve, the tubing looped over the handle.
  regulator(e, p, 0, 0.1 + 0.95 * 0.86 + 0.09 * 0.25 + 0.05, 0.02, 0, false)
  put(p, hose(e, 'o2loop', [[0.05, 1.0, 0.07], [0.15, 0.9, 0.05], [0.12, 1.1, -0.16], [-0.05, 1.12, -0.18], [-0.15, 0.95, -0.1]], 0.0035), e.m.tubing)
}
