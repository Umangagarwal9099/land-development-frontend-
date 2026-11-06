import { type Object3D } from 'three'
import { PI } from '../../../kit'
import { castor, cupboardDoor, face, group, put, rod, bentTube } from '../../erKit'
import type { OpdCtx } from '../ctx'
import { labMats } from './lab'

/*
 * The second floor's diagnostic radiology and physiology equipment: a ceiling-suspended digital
 * radiography system (tube on its rails and telescopic column, floating-top table with its
 * detector bucky, wall stand), its generator console, lead aprons on their rack, a premium
 * cart-based ultrasound, and the lung function laboratory's spirometer and body box. Built at true
 * size in their own frames, front towards +z, on y = 0.
 */

/**
 * The ceiling tube support: two longitudinal rails along local z (length `len`, `span` apart)
 * fixed under the ceiling at `ceiling`, the bridge across them at `at` along them, the carriage,
 * the telescopic column down to the tube head at `head` above the floor, the collimator and its
 * handle and display. Built under a group at the floor (its origin the rails' centre in plan).
 */
export function ceilingTube(e: OpdCtx, p: Object3D, len: number, span: number, ceiling: number, at: number, cross: number, head: number) {
  const { k, m } = e
  const L = labMats(e)
  for (const s of [-1, 1]) {
    k.box(p, 0.12, 0.08, len, m.aluminium, s * span / 2, ceiling - 0.04, 0)
    for (let i = 0; i < 4; i++) k.box(p, 0.08, 0.02, 0.12, m.aluminium, s * span / 2, ceiling - 0.01, -len / 2 + 0.2 + (i * (len - 0.4)) / 3, false)
  }
  // The bridge, and the carriage running across it.
  k.box(p, span + 0.3, 0.12, 0.3, L.shell, 0, ceiling - 0.14, at)
  k.box(p, 0.4, 0.16, 0.4, L.shell, cross, ceiling - 0.28, at)
  // The telescopic column: three nested sections.
  const top = ceiling - 0.36
  const len3 = top - (head + 0.25)
  for (let i = 0; i < 3; i++) {
    const w = 0.2 - i * 0.025
    const seg = len3 / 3 + 0.05
    k.box(p, w, seg, w, i === 1 ? L.shellGrey : L.shell, cross, top - seg / 2 - (i * len3) / 3, at)
  }
  // The tube head on its yoke: the housing turned across, the collimator under it.
  const yoke = group(p, cross, head, at)
  k.box(yoke, 0.26, 0.28, 0.24, L.shell, 0, 0.18, 0)
  const housing = k.cyl(yoke, 0.13, 0.13, 0.52, L.shellGrey, 0, 0.12, 0.05, 24)
  housing.rotation.z = PI / 2
  for (const s of [-1, 1]) k.cyl(yoke, 0.135, 0.135, 0.04, L.shell, s * 0.27, 0.12, 0.05, 24).rotation.z = PI / 2
  k.box(yoke, 0.26, 0.2, 0.26, L.shell, 0, -0.08, 0.05)
  k.box(yoke, 0.18, 0.004, 0.18, m.clearPlastic, 0, -0.182, 0.05, false)
  k.box(yoke, 0.04, 0.04, 0.03, e.o.cove, 0, -0.18, 0.05, false)
  // The control handle and its touch display at the front.
  put(yoke, bentTube(e, 'tubeHandle', [[-0.2, 0, 0], [-0.2, -0.05, 0.12], [0.2, -0.05, 0.12], [0.2, 0, 0]], 0.014, 0.04), m.darkPlastic, 0, -0.05, 0.13)
  face(e, yoke, 0.12, 0.08, e.o.his('tubeDisplay', 'SID 100', 'form'), 0, 0.0, 0.181)
  return yoke
}

/**
 * The radiographic table, 2.2 × 0.8 m along local z: a pedestal base, a carbon-fibre floating
 * top, the detector bucky tray under it, foot pedals, a patient mattress and a hand grip.
 */
export function xrayTable(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.box(p, 0.6, 0.06, 1.2, L.shellGrey, 0, 0.03, 0)
  k.soft(p, 0.5, 0.56, 0.7, 0.04, L.shell, 0, 0.34, 0)
  // Bucky tray rides under the top in its long housing.
  k.box(p, 0.7, 0.1, 2.0, L.shell, 0, 0.66, 0)
  k.box(p, 0.46, 0.012, 0.46, m.black, 0, 0.711, 0.15, false)
  k.box(p, 0.8, 0.04, 2.2, m.charcoal, 0, 0.74, 0)
  k.soft(p, 0.62, 0.04, 1.8, 0.02, m.vinylSeat, 0, 0.78, 0.1)
  k.box(p, 0.5, 0.004, 1.7, m.paper, 0, 0.8, 0.1, false)
  for (const s of [-1, 1]) rod(e, p, 0.012, 0.5, m.chrome, s * 0.45, 0.74, -0.7, 'z', 10)
  for (const s of [-1, 1]) k.box(p, 0.12, 0.03, 0.18, m.darkPlastic, s * 0.2, 0.015, 0.7)
}

/** The upright chest stand (wall bucky): a column on its floor plate and wall, the detector carriage at chest height. */
export function chestStand(e: OpdCtx, p: Object3D, centre = 1.35) {
  const { k, m } = e
  const L = labMats(e)
  k.box(p, 0.35, 0.02, 0.5, L.shellGrey, 0, 0.01, 0.22)
  k.box(p, 0.24, 2.2, 0.16, L.shell, 0, 1.1, 0.08)
  k.box(p, 0.58, 0.58, 0.14, L.shell, 0, centre, 0.23)
  k.box(p, 0.46, 0.46, 0.004, m.black, 0, centre, 0.302, false)
  k.box(p, 0.46, 0.004, 0.006, m.red, 0, centre, 0.305, false)
  k.box(p, 0.004, 0.46, 0.006, m.red, 0, centre, 0.305, false)
  for (const s of [-1, 1]) rod(e, p, 0.012, 0.3, m.chrome, s * 0.36, centre + 0.18, 0.28, 'x', 10).rotation.z = PI / 2
}

/** A rack of lead aprons on hangers and thyroid shields on pegs, `n` aprons wide. */
export function apronRack(e: OpdCtx, p: Object3D, n = 4) {
  const { k, m } = e
  const w = n * 0.22 + 0.1
  k.box(p, w, 0.06, 0.04, m.stainless, 0, 1.75, 0.02)
  const colours = [m.blue, e.o.navy, m.purple, m.green]
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 0.16 + i * 0.22
    rod(e, p, 0.008, 0.18, m.chrome, x, 1.72, 0.1, 'z', 6)
    const apron = k.soft(p, 0.48, 0.95, 0.05, 0.03, colours[i % colours.length], x, 1.22, 0.2)
    apron.rotation.y = PI / 2
    apron.scale.set(1, 1, 1)
  }
  for (let i = 0; i < 3; i++) {
    rod(e, p, 0.006, 0.1, m.chrome, -w / 2 + 0.15 + i * 0.12, 0.95, 0.06, 'z', 6)
    k.soft(p, 0.1, 0.12, 0.03, 0.015, colours[(i + 1) % colours.length], -w / 2 + 0.15 + i * 0.12, 0.88, 0.1)
  }
}

/** The X-ray generator console: a sloped desk unit with its touch panel, exposure hand switch and the intercom. */
export function generatorConsole(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.42, 0.08, 0.3, 0.02, L.shell, 0, 0.04, -0.15)
  const top = group(p, 0, 0.08, -0.1)
  top.rotation.x = -0.45
  k.box(top, 0.4, 0.2, 0.02, m.charcoal, 0, 0.1, 0)
  face(e, top, 0.3, 0.16, e.o.screen('genPanel', 192, 128, (g, w, h) => {
    g.fillStyle = '#0b1622'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#ffffff'
    g.font = `700 ${h * 0.16}px Helvetica`
    g.fillText('CHEST PA', 8, h * 0.18)
    g.fillStyle = '#7fd4ff'
    g.font = `700 ${h * 0.22}px Helvetica`
    g.fillText('125 kV', 8, h * 0.48)
    g.fillText('4.0 mAs', 8, h * 0.76)
    g.fillStyle = '#2ecc71'
    g.fillRect(w * 0.66, h * 0.32, w * 0.26, h * 0.5)
    g.fillStyle = '#05140a'
    g.font = `700 ${h * 0.12}px Helvetica`
    g.fillText('READY', w * 0.68, h * 0.62)
  }, 1), 0, 0.1, 0.011)
  // The two-stage exposure hand switch on its coiled lead, hanging in its holder.
  k.cyl(p, 0.022, 0.022, 0.12, m.darkPlastic, 0.27, 0.1, -0.05, 12)
  k.cyl(p, 0.012, 0.012, 0.02, m.red, 0.27, 0.17, -0.05, 10)
  // The intercom.
  k.soft(p, 0.1, 0.04, 0.12, 0.01, m.darkPlastic, -0.3, 0.02, -0.08)
  k.cyl(p, 0.006, 0.006, 0.14, m.black, -0.3, 0.11, -0.12, 6)
}

/**
 * A premium cart ultrasound: a heavy console on four castors, the articulated main monitor, the
 * touch panel over the control deck with its trackball, three transducers in their holders, a
 * thermal printer and the gel warmer.
 */
export function ultrasoundCart(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * 0.24, sz * 0.3, 0.055)
  k.soft(p, 0.58, 0.16, 0.74, 0.05, L.shell, 0, 0.18, 0)
  k.soft(p, 0.46, 0.6, 0.5, 0.06, L.shell, 0, 0.55, -0.08)
  k.box(p, 0.3, 0.12, 0.02, m.black, 0, 0.6, 0.18, false)
  // The control deck: keys, the trackball, the touch panel raised behind it.
  const deck = group(p, 0, 0.9, 0.1)
  deck.rotation.x = -0.12
  k.soft(deck, 0.62, 0.06, 0.44, 0.03, L.shell, 0, 0, 0)
  k.box(deck, 0.5, 0.006, 0.18, m.darkPlastic, 0, 0.033, 0.1, false)
  k.sphere(deck, 0.025, m.black, 0, 0.04, 0.1)
  for (let i = 0; i < 8; i++) k.cyl(deck, 0.012, 0.012, 0.01, i % 3 ? m.greyPlastic : L.accent, -0.2 + (i % 4) * 0.04, 0.035, 0.05 + Math.floor(i / 4) * 0.08, 10)
  const touch = group(deck, 0, 0.1, -0.13)
  touch.rotation.x = -0.6
  k.box(touch, 0.3, 0.2, 0.015, m.black, 0, 0, 0)
  face(e, touch, 0.28, 0.18, e.o.his('usTouch', 'ABDOMEN · PRESETS', 'form'), 0, 0, 0.008)
  // Probes in their holders at the side: convex, linear, phased array.
  for (const [i, s] of [[0, -1], [1, -1], [2, 1]] as const) {
    const h = group(p, s * 0.34, 0.92, -0.1 + i * 0.12 * s)
    k.box(h, 0.06, 0.08, 0.06, m.darkPlastic, 0, 0, 0)
    k.soft(h, 0.04, 0.12, 0.03, 0.012, m.whitePlastic, 0, 0.06, 0)
    put(h, bentTube(e, `probeCable${i}`, [[0, 0.12, 0], [0, 0.2, 0.02], [s * 0.02, 0.05, 0.1], [s * 0.02, -0.4, 0.1]], 0.006, 0.08), m.black, 0, 0, 0)
  }
  // The main monitor on its articulated arm.
  k.cyl(p, 0.03, 0.03, 0.35, m.aluminium, 0, 1.12, -0.25, 12)
  const mon = group(p, 0, 1.52, -0.18)
  mon.rotation.x = -0.08
  k.box(mon, 0.56, 0.36, 0.04, m.black, 0, 0, 0)
  face(e, mon, 0.53, 0.33, e.o.screen('usImage', 256, 160, (g, w, h) => {
    g.fillStyle = '#000'
    g.fillRect(0, 0, w, h)
    const gr = g.createRadialGradient(w / 2, 0, 10, w / 2, 0, h)
    gr.addColorStop(0, 'rgba(160,160,160,.75)')
    gr.addColorStop(0.7, 'rgba(70,70,70,.5)')
    gr.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = gr
    g.beginPath()
    g.moveTo(w / 2, 6)
    g.lineTo(w * 0.15, h * 0.95)
    g.lineTo(w * 0.85, h * 0.95)
    g.closePath()
    g.fill()
    g.fillStyle = 'rgba(10,10,10,.85)'
    g.beginPath()
    g.ellipse(w * 0.55, h * 0.55, w * 0.1, h * 0.08, 0.3, 0, PI * 2)
    g.fill()
    g.fillStyle = '#d9d9d9'
    g.font = `500 ${h * 0.06}px Helvetica`
    g.fillText('C5-1  ABD  12cm', 6, h * 0.08)
  }, 0.9), 0, 0, 0.021)
  // Gel warmer and thermal printer on the console.
  k.box(p, 0.12, 0.1, 0.12, m.whitePlastic, -0.2, 0.9, -0.28)
  k.cyl(p, 0.025, 0.025, 0.14, m.blue, -0.2, 1.0, -0.28, 12)
  k.box(p, 0.16, 0.08, 0.14, m.darkPlastic, 0.18, 0.88, -0.28)
}

/** A PC-based spirometer: the flow sensor on its handle and hose, a disposable filter, on a desk. */
export function spirometer(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.box(g, 0.12, 0.02, 0.18, m.darkPlastic, 0, 0.01, 0)
  const h = group(g, 0, 0.02, 0)
  h.rotation.z = PI / 2
  k.cyl(h, 0.02, 0.02, 0.14, m.whitePlastic, 0.02, 0.0, 0, 14)
  k.cyl(h, 0.028, 0.028, 0.06, m.clearPlastic, 0.02, 0.09, 0, 14)
  put(g, bentTube(e, 'spiroCable', [[0.07, 0.02, 0], [0.12, 0.01, 0.05], [0.2, 0.01, -0.05]], 0.004, 0.03), m.greyPlastic, 0, 0, 0)
  return g
}

/** A 3-litre calibration syringe for the spirometer. */
export function calibrationSyringe(e: OpdCtx, p: Object3D, x: number, y: number, z: number) {
  const { k, m } = e
  const g = group(p, x, y, z)
  const b = k.cyl(g, 0.065, 0.065, 0.55, m.aluminium, 0, 0.065, 0, 20)
  b.rotation.z = PI / 2
  rod(e, g, 0.012, 0.3, m.chrome, 0.42, 0.065, 0, 'x', 10)
  k.cyl(g, 0.04, 0.04, 0.02, m.black, 0.57, 0.065, 0, 14).rotation.z = PI / 2
  k.cyl(g, 0.018, 0.018, 0.08, m.whitePlastic, -0.31, 0.065, 0, 12).rotation.z = PI / 2
  return g
}

/**
 * A whole-body plethysmograph (body box): a transparent cabin, 0.85 × 0.85 × 1.85 m, on its
 * base, a seat inside, the mouthpiece and shutter on an arm; its door opens (operated).
 */
export function bodyBox(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  const w = 0.85
  const h = 1.85
  k.soft(p, w + 0.06, 0.12, w + 0.06, 0.03, L.shell, 0, 0.06, -w / 2)
  k.box(p, w + 0.06, 0.1, w + 0.06, L.shell, 0, h + 0.05, -w / 2)
  for (const sx of [-1, 1]) for (const sz of [0, -1]) k.box(p, 0.04, h - 0.1, 0.04, m.aluminium, sx * w / 2, h / 2 + 0.05, sz * w)
  for (const sx of [-1, 1]) k.box(p, 0.008, h - 0.12, w - 0.04, e.o.screenGlass, sx * w / 2, h / 2 + 0.05, -w / 2, false)
  k.box(p, w - 0.04, h - 0.12, 0.008, e.o.screenGlass, 0, h / 2 + 0.05, -w, false)
  // The seat, the pneumotach and shutter on its swinging arm.
  k.soft(p, 0.45, 0.08, 0.42, 0.02, m.vinylSeat, 0, 0.5, -w * 0.62)
  k.box(p, 0.06, 0.38, 0.06, m.powder, 0, 0.3, -w * 0.62)
  rod(e, p, 0.015, 0.3, m.aluminium, 0.18, 1.1, -w * 0.4, 'z', 10)
  k.cyl(p, 0.025, 0.025, 0.1, m.whitePlastic, 0.18, 1.1, -w * 0.25, 14).rotation.x = PI / 2
  cupboardDoor(e, p, -w / 2 + 0.02, h / 2 + 0.05, 0.0, { w: w - 0.04, h: h - 0.12, hinge: 'left', face: m.aluminium, glass: true, label: 'Body Box Door', angle: 1.6 })
}

/** A Snellen vision chart, lit, on a wall at eye height. */
export function visionChart(e: OpdCtx, p: Object3D, y = 1.55) {
  const { k, m } = e
  k.box(p, 0.4, 0.62, 0.05, m.whitePlastic, 0, y, 0.025)
  face(e, p, 0.36, 0.58, e.o.screen('snellen', 180, 290, (g, w, hh) => {
    g.fillStyle = '#ffffff'
    g.fillRect(0, 0, w, hh)
    g.fillStyle = '#111'
    g.textAlign = 'center'
    const rows = ['E', 'F P', 'T O Z', 'L P E D', 'P E C F D', 'E D F C Z P', 'F E L O P Z D']
    let yy = 10
    rows.forEach((r, i) => {
      const s = Math.max(8, 70 - i * 10)
      g.font = `700 ${s}px Helvetica`
      yy += s + 4
      g.fillText(r, w / 2, yy)
    })
    g.fillStyle = '#c8161d'
    g.fillRect(10, hh - 30, w - 20, 2)
  }, 0.7), 0, y, 0.051)
}
