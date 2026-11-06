import { Group, MeshStandardMaterial, type Material, type Object3D } from 'three'
import { PI } from '../../../kit'
import { rng } from '../../../textures'
import { carcass, castor, cupboardDoor, drawer, face, group, put, bentTube, rod, lathe, signPanel } from '../../erKit'
import { packs } from '../../erFurniture'
import type { OpdCtx } from '../ctx'
import { medicineBoxes } from '../furniture'
import { board, NAVY, tokenScreen } from '../paints'

/*
 * The ground floor's own equipment: what the shared library (../furniture.ts) doesn't have — the
 * report pigeonholes, the pharmacy's strip-drawer cabinet, chest freezers and ice-lined
 * refrigerators, pallets of cartons, the air-handling units and the LT panel, queue stanchions,
 * the RO water cooler, the CCTV wall, the photocopier. Front towards +z, standing on y = 0.
 */

const std = (color: string, roughness = 0.6, metalness = 0) => new MeshStandardMaterial({ color, roughness, metalness })

const cache = new WeakMap<object, ReturnType<typeof makeMats>>()
function makeMats() {
  return {
    carton: std('#b88a57', 0.85),
    cartonDark: std('#a37645', 0.85),
    pallet: std('#9c7a52', 0.9),
    ahu: std('#c9ccce', 0.45, 0.35),
    ahuDark: std('#7f8589', 0.5, 0.4),
    duct: std('#b7bcbf', 0.38, 0.65),
    panelGrey: std('#d6d4cc', 0.5, 0.2),
    freezer: std('#f1f1ee', 0.35),
    carrier: std('#2f6fb8', 0.45),
    mop: std('#f0c419', 0.5),
    copier: std('#e4e4e0', 0.45),
    wrap: new MeshStandardMaterial({ color: '#e6eef0', roughness: 0.15, transparent: true, opacity: 0.35, depthWrite: false }),
  }
}
export function gmats(e: OpdCtx) {
  let m = cache.get(e.o)
  if (!m) cache.set(e.o, (m = makeMats()))
  return m
}

/** A sign panel at local (x, y, z) in `p`, its artwork painted once per key. */
export function sign(e: OpdCtx, p: Object3D, key: string, text: string, sub: string | null, w: number, h: number, x: number, y: number, z: number, ry = 0) {
  const lines: [string, number, string, number?][] = [[text, sub ? 0.36 : 0.46, '#ffffff']]
  if (sub) lines.push([sub, 0.2, '#c7d3e6', 500])
  const mat = e.o.sign(`g_${key}`, 768, Math.round((768 * h) / w), board(NAVY, lines, { cross: w / h > 3 }))
  return signPanel(e, p, w, h, mat, x, y, z, ry, 0.02)
}

/** A token display screen (its content painted once per key). */
export function tokens(e: OpdCtx, key: string, title: string, rows: [string, string][], seed: number) {
  return e.o.screen(`g_tok_${key}`, 768, 432, tokenScreen(title, rows, seed), 0.9)
}

/**
 * Report pigeonholes: an open grid of white laminate cubbies, each holding envelopes of reports
 * waiting to be collected, w × h × d.
 */
export function pigeonholes(e: OpdCtx, p: Object3D, w: number, h: number, d: number, cols: number, rows: number) {
  const { k, m } = e
  const r = rng(Math.round(w * 991 + h * 37))
  const cw = w / cols
  const rh = (h - 0.1) / rows
  k.box(p, w, 0.1, d - 0.02, m.skirting, 0, 0.05, -d / 2)
  k.box(p, w, h - 0.1, 0.012, m.hpl, 0, 0.1 + (h - 0.1) / 2, -d + 0.006)
  for (let i = 0; i <= cols; i++) k.box(p, 0.016, h - 0.1, d, m.hpl, -w / 2 + i * cw, 0.1 + (h - 0.1) / 2, -d / 2)
  for (let j = 0; j <= rows; j++) k.box(p, w, 0.016, d, m.hpl, 0, 0.1 + j * rh, -d / 2)
  const env = [m.paper, gmats(e).carton, m.paper, m.whitePlastic]
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const n = Math.floor(r() * 5)
      for (let q = 0; q < n; q++) {
        const ew = cw * (0.7 + r() * 0.2)
        k.box(p, ew, 0.012, d * 0.85, env[Math.floor(r() * env.length)], -w / 2 + (i + 0.5) * cw + (r() - 0.5) * 0.02, 0.1 + j * rh + 0.015 + q * 0.013, -d / 2 + 0.02, false)
      }
    }
}

/**
 * The pharmacy's strip cabinet: a carcass of small drawers in rows (tablets and capsule strips,
 * each drawer labelled), every drawer on runners (operated), a solid-surface top with a basket of
 * prescriptions waiting.
 */
export function stripCabinet(e: OpdCtx, p: Object3D, cols: number, rows: number, w = 1.8, h = 1.05, d = 0.45) {
  const { k, m } = e
  carcass(e, p, w, h, d, m.hpl, [], 0.1, m.solidSurface)
  const dw = (w - 0.04) / cols
  const dh = (h - 0.12) / rows
  const fill = packs(e, [m.paper, m.whitePlastic, m.blue, m.purple], [0.06, 0.02, 0.1])
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const dr = drawer(e, p, -w / 2 + 0.02 + dw * (i + 0.5), 0.11 + dh * (j + 0.5), 0, { w: dw - 0.006, h: dh - 0.006, d: d - 0.04, front: m.hpl, handle: 'cup', label: 'Medicine Drawer', fill })
      dr.userData.label = 'Medicine Drawer'
      k.box(p, dw * 0.5, 0.025, 0.002, m.paper, -w / 2 + 0.02 + dw * (i + 0.5), 0.11 + dh * (j + 0.5) + dh * 0.22, 0.004, false)
    }
  // Prescriptions waiting on top, in a wire basket.
  k.box(p, 0.34, 0.08, 0.25, m.powder, w / 2 - 0.3, h + 0.065, -d / 2)
  for (let i = 0; i < 4; i++) k.box(p, 0.21, 0.004, 0.27, m.paper, w / 2 - 0.3, h + 0.06 + i * 0.006, -d / 2, false)
}

/** Open medicine display shelving, w × h × d: white laminate, six shelves of cartons, a label strip on each. */
export function medicineShelves(e: OpdCtx, p: Object3D, w = 1.2, h = 2.1, d = 0.4, levels = 6) {
  const { k, m } = e
  for (const s of [-1, 1]) k.box(p, 0.02, h, d, m.hpl, s * (w / 2 - 0.01), h / 2, -d / 2)
  k.box(p, w, h, 0.012, m.hpl, 0, h / 2, -d + 0.006)
  k.box(p, w, 0.1, d - 0.02, m.skirting, 0, 0.05, -d / 2)
  for (let i = 0; i < levels; i++) {
    const y = 0.1 + (i * (h - 0.15)) / levels
    k.box(p, w - 0.04, 0.018, d - 0.01, m.hpl, 0, y, -d / 2)
    k.box(p, w - 0.04, 0.025, 0.004, m.paper, 0, y + 0.003, 0.002, false)
    medicineBoxes(e, p, w - 0.06, y + 0.01, -0.01, d - 0.04, ((h - 0.15) / levels) * 0.8)
  }
  k.box(p, w, 0.018, d, m.hpl, 0, h - 0.009, -d / 2)
}

/** Brown cartons stacked on a wooden pallet, shrink-wrapped, w × d. */
export function pallet(e: OpdCtx, p: Object3D, w = 1.2, d = 1.0, layers = 4) {
  const { k } = e
  const g = gmats(e)
  for (const s of [-1, 0, 1]) k.box(p, w, 0.1, 0.1, g.pallet, 0, 0.05, s * (d / 2 - 0.05))
  for (let i = 0; i < 7; i++) k.box(p, 0.12, 0.022, d, g.pallet, -w / 2 + 0.06 + (i * (w - 0.12)) / 6, 0.111, 0)
  const r = rng(Math.round(w * 313 + layers))
  const bw = w / 3
  const bd = d / 2
  for (let l = 0; l < layers; l++)
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 2; j++) k.box(p, bw - 0.01, 0.28, bd - 0.01, r() < 0.5 ? g.carton : g.cartonDark, -w / 2 + bw * (i + 0.5), 0.122 + 0.14 + l * 0.285, -d / 2 + bd * (j + 0.5), true)
  k.box(p, w + 0.01, layers * 0.285 + 0.02, d + 0.01, g.wrap, 0, 0.122 + (layers * 0.285) / 2, 0, false)
}

/** Brown cartons on a shelf, w wide, d deep, h high. */
export function cartons(e: OpdCtx, p: Object3D, w: number, y: number, d: number, h: number) {
  const { k } = e
  const g = gmats(e)
  const r = rng(Math.round(w * 101 + y * 53))
  for (let x = -w / 2 + 0.01; x < w / 2 - 0.15; ) {
    const bw = 0.25 + r() * 0.2
    const bh = Math.min(h, 0.2 + r() * 0.15)
    if (x + bw > w / 2) break
    k.box(p, bw, bh, d - 0.04, r() < 0.5 ? g.carton : g.cartonDark, x + bw / 2, y + bh / 2, -d / 2)
    k.box(p, 0.1, 0.06, 0.003, e.m.paper, x + bw / 2, y + bh * 0.6, -0.018, false)
    x += bw + 0.015
  }
}

/** A heavy-duty steel pallet rack, w × h × d, `levels` shelves, cartons and cartons of medicines. */
export function bulkRack(e: OpdCtx, p: Object3D, w = 1.5, h = 2.2, d = 0.55, levels = 4) {
  const { k, m } = e
  for (const sx of [-1, 1]) for (const sz of [0, 1]) k.box(p, 0.05, h, 0.05, e.o.navy, sx * (w / 2 - 0.025), h / 2, -0.025 - sz * (d - 0.05))
  for (let i = 0; i < levels; i++) {
    const y = 0.1 + (i * (h - 0.25)) / (levels - 1)
    for (const sz of [0, 1]) k.box(p, w, 0.06, 0.04, m.sharps, 0, y - 0.03, -0.025 - sz * (d - 0.05))
    k.box(p, w - 0.08, 0.02, d, m.galvanised, 0, y + 0.01, -d / 2)
    if (i < levels - 1) {
      if (i % 2) medicineBoxes(e, p, w - 0.1, y + 0.02, -0.02, d - 0.06, 0.4)
      else cartons(e, group(p, 0, 0, 0), w - 0.1, y + 0.02, d, 0.45)
    }
  }
}

/**
 * A chest-type unit: the vaccine ice-lined refrigerator (ILR) or the deep freezer, its lid hinged
 * at the back (operated, about x), the thermostat panel and its lit thermometer, baskets inside.
 */
export function chest(e: OpdCtx, p: Object3D, kind: 'ilr' | 'freezer', w = 1.1, d = 0.7, h = 0.88) {
  const { k, m } = e
  const g = gmats(e)
  k.box(p, w, 0.08, d - 0.04, m.skirting, 0, 0.04, -d / 2)
  for (const s of [-1, 1]) k.box(p, 0.05, h - 0.08, d, g.freezer, s * (w / 2 - 0.025), 0.08 + (h - 0.08) / 2, -d / 2)
  for (const z of [-0.025, -d + 0.025]) k.box(p, w - 0.1, h - 0.08, 0.05, g.freezer, 0, 0.08 + (h - 0.08) / 2, z)
  k.box(p, w - 0.1, 0.04, d - 0.1, g.freezer, 0, 0.28, -d / 2)
  // Inside: wire baskets of vaccine vials (ILR) or frozen ice packs (freezer).
  for (let i = 0; i < 3; i++) {
    const bx = -w / 2 + 0.2 + i * ((w - 0.4) / 2)
    k.box(p, 0.3, 0.2, d - 0.18, m.powder, bx, 0.62, -d / 2)
    if (kind === 'ilr') packs(e, [m.whitePlastic, m.blue, m.paper], [0.05, 0.05, 0.08])(group(p, bx, 0.72, -0.1), 0.26, d - 0.22, 0.08)
    else for (let q = 0; q < 3; q++) k.box(p, 0.24, 0.03, 0.16, m.blue, bx, 0.74 + q * 0.035, -d / 2, false)
  }
  k.box(p, w - 0.2, 0.004, d - 0.2, e.m.melamine, 0, h - 0.02, -d / 2, false)
  // The lid: hinged along its back edge, lifting about x.
  const lid = new Group()
  lid.name = `door_g_chest_${kind}_${Math.round(w * 1000)}`
  lid.position.set(0, h, -d)
  lid.userData.axis = 'x'
  lid.userData.openAngle = -1.15
  lid.userData.label = kind === 'ilr' ? 'Ice-Lined Refrigerator Lid' : 'Deep Freezer Lid'
  p.add(lid)
  const top = k.box(lid, w + 0.01, 0.07, d + 0.01, g.freezer, 0, 0.035, d / 2)
  top.userData.front = true
  k.box(lid, 0.3, 0.025, 0.04, m.greyPlastic, 0, 0.0, d + 0.01)
  // The control panel on the front, a lit temperature readout.
  k.box(p, 0.3, 0.12, 0.02, m.greyPlastic, w / 2 - 0.25, h - 0.15, 0.01)
  k.box(p, 0.09, 0.035, 0.004, e.o.screen(`g_chest_${kind}`, 64, 24, (c, ww, hh) => {
    c.fillStyle = '#081208'
    c.fillRect(0, 0, ww, hh)
    c.fillStyle = kind === 'ilr' ? '#4bff72' : '#5fd0ff'
    c.font = `700 ${hh * 0.78}px Helvetica`
    c.fillText(kind === 'ilr' ? '+4.0°C' : '-21°C', 3, hh * 0.85)
  }, 1.1), w / 2 - 0.25, h - 0.15, 0.022, false)
  face(e, p, 0.22, 0.08, e.o.sign(`g_chestlabel_${kind}`, 256, 96, board('#ffffff', [[kind === 'ilr' ? 'ILR · VACCINES' : 'DEEP FREEZER · ICE PACKS', 0.36, NAVY]])), -w / 2 + 0.25, h - 0.18, 0.001)
}

/** A blue vaccine carrier box with its lid and strap. */
export function carrier(e: OpdCtx, p: Object3D, x: number, y: number, z: number, s = 1) {
  const { k, m } = e
  const g = gmats(e)
  k.soft(p, 0.26 * s, 0.24 * s, 0.22 * s, 0.03, g.carrier, x, y + 0.12 * s, z)
  k.box(p, 0.27 * s, 0.03, 0.23 * s, m.whitePlastic, x, y + 0.245 * s, z)
  put(p, bentTube(e, `carrierStrap${s}`, [[-0.1 * s, 0, 0], [-0.08 * s, 0.07, 0], [0.08 * s, 0.07, 0], [0.1 * s, 0, 0]], 0.006, 0.02), m.black, x, y + 0.26 * s, z, false)
}

/** A floor-standing RO water cooler: stainless body, two taps, a drip tray, a paper-cup dispenser. */
export function waterCooler(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  k.box(p, 0.5, 1.25, 0.45, m.stainless, 0, 0.625, -0.225)
  k.box(p, 0.46, 0.25, 0.012, m.darkPlastic, 0, 0.98, 0.004, false)
  for (const x of [-0.1, 0.1]) {
    k.box(p, 0.04, 0.05, 0.06, x < 0 ? m.blue : m.red, x, 1.0, 0.03)
    k.cyl(p, 0.008, 0.008, 0.04, m.chrome, x, 0.96, 0.05, 10)
  }
  k.box(p, 0.36, 0.03, 0.14, m.stainless, 0, 0.72, 0.06)
  face(e, p, 0.4, 0.12, e.o.sign('g_ro', 256, 80, board('#ffffff', [['RO DRINKING WATER', 0.4, NAVY]])), 0, 1.15, 0.002)
  k.cyl(p, 0.04, 0.04, 0.3, m.clearPlastic, 0.32, 1.1, -0.05, 14)
  k.box(p, 0.06, 0.04, 0.06, m.whitePlastic, 0.32, 0.93, -0.05)
  k.cyl(p, 0.035, 0.035, 0.03, m.whitePlastic, 0.32, 1.27, -0.05, 14)
}

/** A queue stanchion: a weighted base, a chrome post, the belt cassette at its top. */
export function stanchion(e: OpdCtx, p: Object3D, x: number, z: number) {
  const { k, m } = e
  k.cyl(p, 0.16, 0.17, 0.03, m.chrome, x, 0.015, z, 20)
  k.cyl(p, 0.03, 0.03, 0.92, m.chrome, x, 0.48, z, 14)
  k.cyl(p, 0.04, 0.04, 0.06, m.chrome, x, 0.95, z, 16)
}

/** A queue belt between two stanchions at (x0, z0) and (x1, z1). */
export function belt(e: OpdCtx, p: Object3D, x0: number, z0: number, x1: number, z1: number) {
  const len = Math.hypot(x1 - x0, z1 - z0)
  const b = e.k.box(p, len - 0.08, 0.05, 0.004, e.o.navy, (x0 + x1) / 2, 0.93, (z0 + z1) / 2, false)
  b.rotation.y = -Math.atan2(z1 - z0, x1 - x0)
}

/** A card / UPI payment terminal on its swivel stand, a QR standee beside it. */
export function payTerminal(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.cyl(g, 0.05, 0.05, 0.015, m.darkPlastic, 0, 0.008, 0, 18)
  const t = group(g, 0, 0.06, 0)
  t.rotation.x = -0.6
  k.soft(t, 0.08, 0.17, 0.035, 0.012, m.black, 0, 0, 0)
  k.box(t, 0.06, 0.05, 0.002, m.board, 0, 0.045, 0.018, false)
  k.box(t, 0.06, 0.06, 0.002, m.greyPlastic, 0, -0.03, 0.018, false)
  k.box(g, 0.1, 0.15, 0.004, e.o.sign('g_upi', 96, 144, (c, w, h) => {
    c.fillStyle = '#ffffff'
    c.fillRect(0, 0, w, h)
    c.fillStyle = NAVY
    c.fillRect(0, 0, w, h * 0.18)
    c.fillStyle = '#111'
    const r = rng(77)
    for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) if (r() < 0.5) c.fillRect(w * 0.15 + i * w * 0.058, h * 0.28 + j * w * 0.058, w * 0.058, w * 0.058)
    c.font = `700 ${h * 0.09}px Helvetica`
    c.fillText('SCAN · PAY', w * 0.2, h * 0.93)
  }), 0.12, 0.075, -0.02, false).rotation.x = -0.15
  return g
}

/** A handheld barcode scanner in its stand. */
export function scanner(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.box(g, 0.07, 0.02, 0.09, m.darkPlastic, 0, 0.01, 0)
  const s = group(g, 0, 0.07, -0.01)
  s.rotation.x = 0.5
  k.soft(s, 0.05, 0.12, 0.04, 0.012, m.black, 0, 0, 0)
  k.soft(s, 0.07, 0.04, 0.08, 0.012, m.sharps, 0, 0.07, 0.02)
  return g
}

/** A thermal receipt / token printer. */
export function receiptPrinter(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.soft(g, 0.15, 0.13, 0.19, 0.02, m.darkPlastic, 0, 0.065, 0)
  k.box(g, 0.08, 0.002, 0.06, m.paper, 0, 0.131, 0.07, false)
  return g
}

/** A cash drawer (under a billing desk), its till front. */
export function cashDrawer(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.box(g, 0.41, 0.1, 0.42, m.black, 0, 0.05, 0)
  k.box(g, 0.39, 0.06, 0.003, m.darkPlastic, 0, 0.05, 0.211, false)
  k.box(g, 0.05, 0.03, 0.01, m.greyPlastic, 0.12, 0.05, 0.215, false)
  return g
}

/** A currency counting machine. */
export function noteCounter(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.soft(g, 0.26, 0.2, 0.24, 0.03, m.greyPlastic, 0, 0.1, 0)
  k.box(g, 0.16, 0.03, 0.08, m.black, 0, 0.18, -0.06, false)
  k.box(g, 0.06, 0.02, 0.003, m.board, 0.06, 0.12, 0.121, false)
  return g
}

/** A self-service registration kiosk: pedestal, the angled touch screen, a printer slot and card reader. */
export function kiosk(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  k.soft(p, 0.5, 0.06, 0.42, 0.02, m.greyPlastic, 0, 0.03, 0)
  k.soft(p, 0.46, 1.1, 0.2, 0.03, m.whitePlastic, 0, 0.6, -0.08)
  const scr = group(p, 0, 1.32, 0.02)
  scr.rotation.x = -0.35
  k.soft(scr, 0.48, 0.6, 0.08, 0.03, m.whitePlastic, 0, 0, 0)
  face(e, scr, 0.4, 0.5, m.kiosk, 0, 0.02, 0.041)
  k.box(p, 0.16, 0.02, 0.06, m.darkPlastic, 0, 1.0, 0.04)
  k.box(p, 0.08, 0.04, 0.04, m.black, 0.14, 1.06, 0.03)
  k.box(p, 0.3, 0.06, 0.004, e.o.navy, 0, 0.82, 0.022, false)
}

/** The CCTV wall: `cols` × `rows` screens on a black frame, each showing a camera's view. */
export function cctvWall(e: OpdCtx, p: Object3D, cols: number, rows: number, sw = 0.6, y0 = 1.25) {
  const { k, m } = e
  const sh = sw * 0.5625
  const w = cols * sw
  k.box(p, w + 0.06, rows * sh + 0.06, 0.06, m.black, 0, y0 + (rows * sh) / 2, 0.03)
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const n = i + j * cols
      const mat = e.o.screen(`g_cctv${n % 6}`, 256, 144, cctvPaint(n % 6), 0.8)
      face(e, p, sw - 0.012, sh - 0.012, mat, -w / 2 + (i + 0.5) * sw, y0 + (j + 0.5) * sh, 0.061)
    }
}

function cctvPaint(seed: number) {
  return (c: CanvasRenderingContext2D, w: number, h: number) => {
    const r = rng(9100 + seed)
    for (let v = 0; v < 4; v++) {
      const x0 = (v % 2) * (w / 2)
      const y0 = Math.floor(v / 2) * (h / 2)
      const base = 60 + Math.floor(r() * 50)
      c.fillStyle = `rgb(${base},${base + 4},${base + 2})`
      c.fillRect(x0, y0, w / 2, h / 2)
      // A corridor in perspective: floor, walls, a figure or two.
      c.fillStyle = `rgb(${base + 40},${base + 40},${base + 36})`
      c.beginPath()
      c.moveTo(x0, y0 + h / 2)
      c.lineTo(x0 + w / 2, y0 + h / 2)
      c.lineTo(x0 + w * 0.3, y0 + h * 0.25)
      c.lineTo(x0 + w * 0.2, y0 + h * 0.25)
      c.closePath()
      c.fill()
      c.fillStyle = 'rgba(20,20,20,.7)'
      for (let q = 0; q < 2; q++) if (r() < 0.6) c.fillRect(x0 + w * (0.15 + r() * 0.2), y0 + h * (0.25 + r() * 0.1), 3, 10)
      c.fillStyle = '#fff'
      c.font = '9px Helvetica'
      c.fillText(`CAM ${String(seed * 4 + v + 1).padStart(2, '0')}`, x0 + 3, y0 + 10)
      c.strokeStyle = '#000'
      c.strokeRect(x0, y0, w / 2, h / 2)
    }
  }
}

/** A key cabinet on the wall: steel box with its hinged door (operated), hooks of tagged keys. */
export function keyCabinet(e: OpdCtx, p: Object3D, y = 1.3) {
  const { k, m } = e
  const g = group(p, 0, y, 0)
  carcass(e, g, 0.45, 0.55, 0.1, e.o.frame, [], 0)
  for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) {
    k.box(g, 0.006, 0.006, 0.04, m.chrome, -0.16 + i * 0.08, 0.15 + j * 0.15, -0.05, false)
    k.box(g, 0.02, 0.035, 0.004, [m.red, m.blue, m.sharps, m.green][(i + j) % 4], -0.16 + i * 0.08, 0.12 + j * 0.15, -0.03, false)
  }
  cupboardDoor(e, g, -0.225 + 0.002, 0.275, 0, { w: 0.445, h: 0.54, hinge: 'left', face: e.o.frame, label: 'Key Cabinet', angle: 1.6 })
}

/** A rack of walkie-talkies charging, on a low cabinet. */
export function radioChargers(e: OpdCtx, p: Object3D, y: number, n = 6) {
  const { k, m } = e
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 0.09
    k.box(p, 0.08, 0.05, 0.1, m.darkPlastic, x, y + 0.025, 0)
    k.box(p, 0.055, 0.15, 0.035, m.black, x, y + 0.12, -0.01)
    k.cyl(p, 0.006, 0.006, 0.07, m.black, x + 0.015, y + 0.23, -0.01, 8)
    k.box(p, 0.01, 0.005, 0.004, i % 3 ? m.green : m.red, x - 0.02, y + 0.04, 0.051, false)
  }
}

/** A floor-standing multifunction photocopier with its paper trays and document feeder. */
export function photocopier(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const g = gmats(e)
  k.box(p, 0.6, 0.55, 0.62, g.copier, 0, 0.3, -0.31)
  for (let i = 0; i < 3; i++) k.box(p, 0.56, 0.003, 0.004, m.reveal, 0, 0.17 + i * 0.13, 0.001, false)
  k.box(p, 0.6, 0.38, 0.6, g.copier, 0, 0.77, -0.3)
  k.box(p, 0.5, 0.1, 0.42, m.greyPlastic, 0, 1.01, -0.32)
  k.box(p, 0.22, 0.012, 0.3, m.paper, 0.18, 0.62, -0.05, false)
  const pnl = group(p, -0.18, 0.98, 0.03)
  pnl.rotation.x = -0.6
  k.box(pnl, 0.2, 0.12, 0.02, m.darkPlastic, 0, 0, 0)
  k.box(pnl, 0.16, 0.08, 0.002, m.board, 0, 0, 0.011, false)
  for (const x of [-0.25, 0.25]) for (const z of [-0.55, -0.07]) castor(e, p, x, z, 0.03)
}

/** A round meeting table on a pedestal base, d across. */
export function roundTable(e: OpdCtx, p: Object3D, d = 1.0) {
  const { k, m } = e
  k.cyl(p, d / 2, d / 2, 0.028, e.o.oak, 0, 0.736, 0, 32)
  k.cyl(p, 0.035, 0.04, 0.7, m.powder, 0, 0.37, 0, 16)
  k.cyl(p, 0.26, 0.28, 0.02, m.powder, 0, 0.01, 0, 24)
}

/**
 * An air-handling unit, L × W × H along local x: a double-skinned casing in sections (filter,
 * cooling coil, fan), panel joints and hinged access doors (one operated), the drain trap, the
 * supply and return ducts rising from its top to the slab at `slab` above the floor.
 */
export function ahu(e: OpdCtx, p: Object3D, L: number, W: number, H: number, slab: number, label: string) {
  const { k, m } = e
  const g = gmats(e)
  k.box(p, L + 0.1, 0.15, W + 0.1, m.galvanised, 0, 0.075, 0)
  k.box(p, L, H, W, g.ahu, 0, 0.15 + H / 2, 0)
  for (const s of [0.22, 0.47]) k.box(p, 0.03, H + 0.01, W + 0.01, g.ahuDark, -L / 2 + L * s, 0.15 + H / 2, 0, false)
  // Access doors on the front face: hinges and lever latches; the fan section's door opens.
  const doors: [number, number][] = [[-L / 2 + L * 0.11, L * 0.18], [-L / 2 + L * 0.345, L * 0.2], [-L / 2 + L * 0.735, L * 0.42]]
  doors.forEach(([cx, dw], i) => {
    for (const s of [-1, 1]) k.box(p, 0.06, 0.03, 0.03, g.ahuDark, cx - dw / 2 + 0.06, 0.15 + H / 2 + s * (H * 0.3), W / 2 + 0.015, false)
    if (i === 2) {
      cupboardDoor(e, group(p, 0, 0.15, W / 2), cx - dw / 2 + 0.03, H / 2, 0.022, { w: dw - 0.06, h: H - 0.15, hinge: 'left', face: g.ahu, label: 'AHU Access Door', angle: 1.4 })
      // Inside it: the fan wheel and motor.
      k.cyl(p, H * 0.3, H * 0.3, W * 0.5, g.ahuDark, cx, 0.15 + H / 2, 0, 24).rotation.x = PI / 2
      k.cyl(p, 0.14, 0.14, 0.4, m.blue, cx + 0.45, 0.15 + 0.3, 0, 18).rotation.z = PI / 2
    } else {
      k.box(p, dw - 0.06, H - 0.15, 0.012, g.ahu, cx, 0.15 + H / 2, W / 2 + 0.008, false)
      k.box(p, 0.03, 0.1, 0.04, m.black, cx + dw / 2 - 0.08, 0.15 + H / 2, W / 2 + 0.03)
    }
  })
  // The condensate drain, its trap and pipe to the floor.
  put(p, bentTube(e, 'ahuTrap', [[0, 0.3, 0], [0, 0.18, 0.1], [0.1, 0.12, 0.1], [0.1, 0.25, 0.2], [0.1, 0.02, 0.35]], 0.016, 0.04), m.darkPlastic, -L / 2 + 0.25, 0, W / 2, false)
  // Ducts: supply up from the fan end, return down to the filter end, flexible connectors.
  const top = 0.15 + H
  for (const [x, w] of [[L / 2 - 0.45, 0.6], [-L / 2 + 0.4, 0.55]] as const) {
    k.box(p, w + 0.04, 0.12, W * 0.55 + 0.04, m.darkPlastic, x, top + 0.06, 0)
    k.box(p, w, slab - top - 0.12, W * 0.55, g.duct, x, (top + 0.12 + slab) / 2, 0)
    for (let y = top + 0.5; y < slab - 0.2; y += 0.6) k.box(p, w + 0.03, 0.03, W * 0.55 + 0.03, g.duct, x, y, 0, false)
  }
  // Chilled water: insulated flow and return pipes with valves.
  for (const [i, c] of [m.blue, m.green].entries()) {
    rod(e, p, 0.04, slab - 0.8, c, L / 2 + 0.15 + i * 0.12, (0.8 + slab) / 2, W / 2 - 0.2, 'x', 12).rotation.set(0, 0, 0)
    k.cyl(p, 0.05, 0.05, 0.1, m.red, L / 2 + 0.15 + i * 0.12, 1.0, W / 2 - 0.2, 12)
  }
  face(e, p, 0.6, 0.2, e.o.sign(`g_ahu_${label}`, 384, 128, board('#ffffff', [[label, 0.4, NAVY], ['Supply 6,000 CFM · Chilled water', 0.2, '#555', 500]])), L / 2 - L * 0.13, 0.15 + H - 0.25, W / 2 + 0.008)
}

/**
 * The LT panel: a run of grey cubicles, each with its door, meters and breaker handles, a danger
 * plate, a rubber mat before it; `n` cubicles wide.
 */
export function ltPanel(e: OpdCtx, p: Object3D, n = 3, h = 2.0) {
  const { k, m } = e
  const g = gmats(e)
  const w = 0.8
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * w
    k.box(p, w - 0.01, h, 0.5, g.panelGrey, x, h / 2, -0.25)
    k.box(p, w - 0.06, h - 0.25, 0.01, g.panelGrey, x, h / 2 + 0.05, 0.005, false)
    for (let j = 0; j < 2; j++) k.cyl(p, 0.045, 0.045, 0.02, m.black, x - 0.15 + j * 0.3, h - 0.3, 0.012, 20).rotation.x = PI / 2
    for (let j = 0; j < 3; j++) k.box(p, 0.06, 0.12, 0.05, m.black, x - 0.18 + j * 0.18, 1.1, 0.03)
    k.box(p, 0.04, 0.08, 0.02, m.red, x + 0.3, 1.1, 0.015)
    face(e, p, 0.22, 0.16, e.o.sign('g_danger', 220, 160, (c, ww, hh) => {
      c.fillStyle = '#ffffff'
      c.fillRect(0, 0, ww, hh)
      c.fillStyle = '#c8161d'
      c.font = `700 ${hh * 0.24}px Helvetica`
      c.textAlign = 'center'
      c.fillText('DANGER', ww / 2, hh * 0.3)
      c.fillText('415 VOLTS', ww / 2, hh * 0.62)
      c.fillStyle = '#111'
      c.font = `500 ${hh * 0.12}px Helvetica`
      c.fillText('खतरा · Authorised only', ww / 2, hh * 0.86)
    }), x, 1.5, 0.012)
  }
  k.box(p, n * w, 0.012, 0.9, m.rubber, 0, 0.006, 0.45, false)
}

/** A wall-mounted fire extinguisher on its bracket, its sign above. */
export function extinguisher(e: OpdCtx, p: Object3D, kind: 'co2' | 'abc' = 'abc') {
  const { k, m } = e
  k.box(p, 0.16, 0.08, 0.04, m.stainless, 0, 0.9, 0.02)
  k.cyl(p, 0.08, 0.08, kind === 'co2' ? 0.65 : 0.5, m.red, 0, 0.6, 0.11, 20)
  k.cyl(p, 0.03, 0.03, 0.08, m.black, 0, kind === 'co2' ? 0.97 : 0.89, 0.11, 12)
  if (kind === 'co2') put(p, bentTube(e, 'co2horn', [[0, 0, 0], [0.06, -0.15, 0], [0.08, -0.35, 0]], 0.012, 0.04), m.black, 0.04, 0.95, 0.11)
  else k.box(p, 0.03, 0.12, 0.03, m.black, 0.06, 0.92, 0.14)
  face(e, p, 0.2, 0.2, e.o.sign('g_fireext', 200, 200, board('#c8161d', [['FIRE', 0.26, '#ffffff'], ['EXTINGUISHER', 0.16, '#ffffff']])), 0, 1.4, 0.003)
}

/** A janitor's low mop sink with its stainless guard and wall taps, a hose. */
export function mopSink(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  k.box(p, 0.6, 0.3, 0.5, m.whitePlastic, 0, 0.15, 0.25)
  k.box(p, 0.5, 0.01, 0.4, m.stainless, 0, 0.3, 0.27, false)
  k.box(p, 0.6, 0.04, 0.03, m.stainless, 0, 0.32, 0.49)
  for (const x of [-0.12, 0.12]) {
    k.cyl(p, 0.015, 0.015, 0.1, m.chrome, x, 0.95, 0.05, 10).rotation.x = PI / 2
    k.cyl(p, 0.025, 0.025, 0.02, x < 0 ? m.blue : m.red, x, 1.0, 0.04, 12)
  }
  put(p, bentTube(e, 'hose', [[0, 0.95, 0.1], [0.1, 0.6, 0.15], [0.05, 0.35, 0.3], [-0.1, 0.32, 0.35]], 0.012, 0.06), m.green, 0, 0, 0, false)
}

/** A housekeeping trolley: a mop wringer bucket, yellow, a frame with a bin bag, a mop. */
export function mopTrolley(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const g = gmats(e)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * 0.3, sz * 0.18, 0.03)
  k.box(p, 0.75, 0.04, 0.42, g.mop, 0, 0.09, 0)
  k.box(p, 0.36, 0.28, 0.32, g.mop, -0.18, 0.25, 0)
  k.box(p, 0.3, 0.02, 0.26, m.water, -0.18, 0.35, 0, false)
  k.box(p, 0.14, 0.16, 0.12, m.blue, -0.18, 0.47, 0.06)
  rod(e, p, 0.012, 1.3, m.chrome, 0.05, 0.75, -0.1, 'z', 8).rotation.set(0.2, 0, 0)
  k.box(p, 0.06, 0.95, 0.3, m.blue, 0.33, 0.6, 0)
  k.soft(p, 0.28, 0.5, 0.3, 0.08, m.darkPlastic, 0.18, 0.4, 0)
  k.box(p, 0.25, 0.3, 0.01, e.o.sign('g_wetfloor', 128, 160, board('#f7d117', [['CAUTION', 0.24, '#111'], ['WET FLOOR', 0.2, '#111']])), 0.18, 0.75, 0.21, false)
}

/** Cleaning chemicals on a shelf: canisters of disinfectant, floor cleaner and hand-rub refills. */
export function chemicals(e: OpdCtx, p: Object3D, w: number, y: number) {
  const { k, m } = e
  const r = rng(Math.round(w * 400 + y * 10))
  const bodies: Material[] = [m.blue, m.whitePlastic, m.green, m.sharps, m.red]
  for (let x = -w / 2 + 0.08; x < w / 2 - 0.08; ) {
    const big = r() < 0.4
    const bw = big ? 0.2 : 0.09
    const bh = big ? 0.3 : 0.24
    k.box(p, bw, bh, big ? 0.14 : 0.07, bodies[Math.floor(r() * bodies.length)], x + bw / 2, y + bh / 2, -0.12)
    k.cyl(p, 0.025, 0.025, 0.04, m.whitePlastic, x + bw / 2, y + bh + 0.02, -0.12, 12)
    x += bw + 0.02
  }
}

/** A row of steel wall shelves on brackets: `levels` shelves from y0, w × d. */
export function wallShelves(e: OpdCtx, p: Object3D, w: number, d: number, ys: number[]) {
  const { k, m } = e
  for (const y of ys) {
    k.box(p, w, 0.02, d, m.galvanised, 0, y, d / 2)
    for (const s of [-1, 1]) k.box(p, 0.02, 0.15, d - 0.05, m.galvanised, s * (w / 2 - 0.1), y - 0.08, d / 2 - 0.02)
  }
}

/** A lit sign: the hospital's backlit name on a navy band (on a wall facing +z). */
export function backlitSign(e: OpdCtx, p: Object3D, w: number, h: number, y: number) {
  const { k, m } = e
  k.box(p, w + 0.08, h + 0.08, 0.06, e.o.navy, 0, y, 0.03)
  const lit = e.o.screen('g_brand', 1536, Math.round((1536 * h) / w), board(NAVY, [['KALLAKAL HOSPITAL', 0.4, '#ffffff'], ['OUTPATIENT DEPARTMENT  ·  बाह्य रोगी विभाग', 0.17, '#c7d3e6', 500]], { cross: true }), 0.55)
  face(e, p, w, h, lit, 0, y, 0.0605)
  k.box(p, w + 0.04, 0.012, 0.012, m.ledLine, 0, y - h / 2 - 0.04, 0.07, false)
}

export { lathe, rod }
