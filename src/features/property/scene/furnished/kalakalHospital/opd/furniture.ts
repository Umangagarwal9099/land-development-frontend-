import { CatmullRomCurve3, Mesh, PlaneGeometry, TubeGeometry, Vector3, type Material, type Object3D } from 'three'
import { PI } from '../../kit'
import { rng } from '../../textures'
import { bentTube, cupboardDoor, carcass, castor, drawer, face, geo, group, lathe, put, rod, starBase, type Ctx } from '../erKit'
import { binders, packs, pedestal, supplies, taskChair } from '../erFurniture'
import type { OpdCtx } from './ctx'
import { notice } from './paints'

/*
 * The OPD's furniture and small fittings, shared by every floor: desks, cupboards and racks whose
 * doors and drawers open, sinks and dispensers, the colour-coded biomedical waste bins of the 2016
 * rules, curtains on their tracks, trolleys laid with dressings, the instruments on a doctor's desk.
 * Every piece is built in its own frame at true size, front towards +z, standing on y = 0, as in
 * the emergency department's workshop (../erKit.ts), whose pieces these sit beside.
 */

/* ---------- desks and seating ---------- */

/**
 * A doctor's desk, `w` × `d`: an oak-laminate top on white panel ends, a modesty panel to the
 * patient's side (+z), a mobile drawer pedestal on the doctor's side (−z) at `ped` (−1 left, 1
 * right, 0 none) whose drawers open (operated); a cable tray and grommet.
 */
export function desk(e: OpdCtx, p: Object3D, w = 1.4, d = 0.75, ped: -1 | 0 | 1 = 1, top: Material = e.o.oak) {
  const { k, m } = e
  k.soft(p, w, 0.028, d, 0.006, top, 0, 0.736, 0)
  for (const s of [-1, 1]) k.box(p, 0.025, 0.722, d - 0.04, m.hpl, s * (w / 2 - 0.0125), 0.361, 0)
  k.box(p, w - 0.05, 0.4, 0.018, m.hpl, 0, 0.5, d / 2 - 0.08)
  k.box(p, w * 0.6, 0.08, 0.12, m.powder, 0, 0.66, -d / 2 + 0.18, false)
  put(p, lathe(e, 'deskGrommet', [[0.025, 0], [0.032, 0], [0.032, 0.004], [0.025, 0.004]], 16), m.darkPlastic, w / 2 - 0.2, 0.751, -d / 2 + 0.12, false)
  if (ped) pedestal(e, group(p, ped * (w / 2 - 0.27), 0, -d / 2 + 0.33, PI), 'Desk Drawer')
}

/** The doctor's chair: a high-backed task chair, pulled in or pushed back by `back` (m), turned `turn`. */
export function doctorChair(e: OpdCtx, p: Object3D, x: number, z: number, ry: number) {
  taskChair(e, group(p, x, 0, z, ry))
}

/** A visitor's chair: a chrome cantilever frame, a navy upholstered seat and back, arms. */
export function patientChair(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  for (const s of [-1, 1]) put(p, bentTube(e, 'cantilever', [[0, 0.45, 0.2], [0, 0.42, -0.2], [0, 0.0, -0.22], [0, 0.0, 0.25], [0, 0.04, 0.3]], 0.011, 0.06), m.chrome, s * 0.22, 0, 0)
  for (const s of [-1, 1]) put(p, bentTube(e, 'chairArm', [[0, 0.45, -0.18], [0, 0.65, -0.16], [0, 0.65, 0.18], [0, 0.45, 0.2]], 0.01, 0.04), m.chrome, s * 0.24, 0, 0)
  for (const s of [-1, 1]) k.box(p, 0.04, 0.02, 0.28, m.black, s * 0.24, 0.66, 0.01)
  k.soft(p, 0.46, 0.07, 0.44, 0.025, m.vinylSeat, 0, 0.47, 0.01)
  const b = k.soft(p, 0.46, 0.4, 0.06, 0.025, m.vinylSeat, 0, 0.8, -0.2)
  b.rotation.x = -0.1
}

/** A round doctor's stool on castors with a gas lift, as at an examination couch. */
export function stool(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  starBase(e, p, 0.26, 0.09, m.powder, 0.025)
  k.cyl(p, 0.02, 0.02, 0.38, m.chrome, 0, 0.3, 0, 12)
  k.cyl(p, 0.035, 0.035, 0.14, m.black, 0, 0.18, 0, 14)
  k.cyl(p, 0.19, 0.18, 0.07, m.vinylSeat, 0, 0.53, 0, 28)
}

/* ---------- on the desk ---------- */

/** A desktop computer at a desk: a 24" screen on its stand, keyboard and mouse; the screen faces +z (turn the group to face the user). */
export function computer(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry: number, screen: Material) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.box(g, 0.22, 0.012, 0.17, m.darkPlastic, 0, 0.006, -0.05)
  k.box(g, 0.045, 0.24, 0.025, m.darkPlastic, 0, 0.13, -0.09)
  const s = group(g, 0, 0.33, -0.07)
  s.rotation.x = -0.06
  k.box(s, 0.55, 0.33, 0.02, m.black, 0, 0, 0)
  k.box(s, 0.18, 0.12, 0.03, m.black, 0, 0, -0.022)
  face(e, s, 0.53, 0.3, screen, 0, 0.008, 0.0105)
  k.box(g, 0.44, 0.015, 0.14, m.darkPlastic, 0, 0.0075, 0.24)
  k.box(g, 0.42, 0.004, 0.12, m.black, 0, 0.017, 0.24, false)
  k.soft(g, 0.06, 0.028, 0.1, 0.012, m.darkPlastic, 0.32, 0.014, 0.24)
  return g
}

/** A desk telephone with its handset on the cradle and the coiled cord. */
export function deskPhone(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  const body = k.soft(g, 0.2, 0.06, 0.2, 0.02, m.darkPlastic, 0, 0.03, 0)
  body.rotation.x = 0.12
  k.box(g, 0.1, 0.004, 0.08, m.greyPlastic, 0.03, 0.065, 0.04, false)
  k.soft(g, 0.06, 0.04, 0.22, 0.018, m.black, -0.06, 0.08, 0)
  return g
}

/** A desktop laser printer, paper in its tray. */
export function printer(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.soft(g, 0.4, 0.26, 0.38, 0.02, m.whitePlastic, 0, 0.13, 0)
  k.box(g, 0.34, 0.006, 0.2, m.paper, 0, 0.265, 0.03, false)
  k.box(g, 0.3, 0.012, 0.06, m.darkPlastic, 0, 0.16, 0.19, false)
  k.box(g, 0.08, 0.04, 0.01, m.black, 0.12, 0.22, 0.191, false)
  return g
}

/** A stethoscope lying coiled on a desk: the chest piece, the tubing looped, the ear tubes. */
export function stethoscope(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { m } = e
  const g = group(p, x, y, z, ry)
  const pts: [number, number, number][] = []
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * PI * 1.7
    pts.push([Math.cos(a) * 0.09, 0.008, Math.sin(a) * 0.07])
  }
  put(g, geo(e, 'stethTube', () => tubeGeo(pts, 0.005)), m.black, 0, 0, 0, false)
  put(g, lathe(e, 'stethChest', [[0, 0], [0.022, 0], [0.024, 0.008], [0.016, 0.014], [0, 0.014]], 20), m.chrome, 0.09, 0, 0.0, false)
  put(g, bentTube(e, 'stethEars', [[-0.04, 0.01, -0.08], [-0.02, 0.01, -0.13], [0.02, 0.01, -0.13], [0.04, 0.01, -0.08]], 0.003, 0.02), m.chrome, -0.02, 0, 0.0, false)
  return g
}

/** Soft rubber tubing through points, along a smooth curve. */
function tubeGeo(pts: [number, number, number][], r: number) {
  return new TubeGeometry(new CatmullRomCurve3(pts.map(([a, b, c]) => new Vector3(a, b, c))), 48, r, 6, false)
}

/** A digital blood pressure monitor with its cuff and tube, on a desk. */
export function bpMonitor(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.soft(g, 0.12, 0.07, 0.15, 0.02, m.whitePlastic, 0, 0.035, 0)
  const scr = k.box(g, 0.08, 0.004, 0.06, e.o.screen('bpLcd', 64, 48, (c, w, h) => {
    c.fillStyle = '#c9d6c2'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#1d2a1c'
    c.font = `700 ${h * 0.34}px Helvetica`
    c.fillText('128', w * 0.1, h * 0.42)
    c.fillText('82', w * 0.1, h * 0.8)
    c.font = `500 ${h * 0.2}px Helvetica`
    c.fillText('72', w * 0.66, h * 0.8)
  }, 0.4), 0, 0.071, -0.02, false)
  scr.rotation.x = 0
  k.soft(g, 0.13, 0.025, 0.24, 0.012, m.blue, 0.14, 0.012, 0.0)
  put(g, bentTube(e, 'bpTube', [[0.06, 0.03, 0.03], [0.1, 0.03, 0.06], [0.12, 0.02, 0.0]], 0.003, 0.02), m.greyPlastic, 0, 0, 0, false)
  return g
}

/** An infrared forehead thermometer, lying on its side. */
export function thermometer(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.soft(g, 0.035, 0.03, 0.14, 0.012, m.whitePlastic, 0, 0.015, 0)
  k.soft(g, 0.03, 0.028, 0.05, 0.01, m.blue, 0, 0.015, 0.08)
  k.box(g, 0.022, 0.003, 0.03, m.black, 0, 0.031, -0.03, false)
  return g
}

/** A fingertip pulse oximeter. */
export function oximeter(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.soft(g, 0.036, 0.034, 0.06, 0.012, m.blue, 0, 0.017, 0)
  k.box(g, 0.024, 0.002, 0.02, m.black, 0, 0.035, 0.008, false)
  return g
}

/** A few papers, a prescription pad and a pen on a desk. */
export function papers(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  for (let i = 0; i < 3; i++) k.box(g, 0.21, 0.002, 0.297, m.paper, (i - 1) * 0.01, 0.001 + i * 0.002, i * 0.008, false).rotation.y = (i - 1) * 0.06
  k.box(g, 0.15, 0.012, 0.21, m.whitePlastic, 0.26, 0.006, 0.02, false)
  rod(e, g, 0.004, 0.14, m.blue, 0.1, 0.012, 0.08, 'x', 6).rotation.y = 0.4
  return g
}

/* ---------- on the walls ---------- */

/**
 * The wall diagnostic set beside a couch: a white rail with the otoscope and ophthalmoscope
 * handles in their cradles, the aneroid BP gauge and its cuff basket, a thermometer and a
 * specula dispenser.
 */
export function diagnosticWall(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  k.soft(p, 0.62, 0.22, 0.05, 0.015, m.whitePlastic, 0, 1.45, 0.025)
  for (const [x, head] of [[-0.18, m.black], [-0.04, m.black]] as const) {
    k.cyl(p, 0.016, 0.016, 0.16, m.greyPlastic, x, 1.48, 0.065, 12)
    k.soft(p, 0.04, 0.05, 0.05, 0.01, head, x, 1.59, 0.07)
    put(p, bentTube(e, 'diagCord', [[0, 0, 0], [0.02, -0.15, 0.02], [0.05, -0.22, 0.02], [0.08, -0.08, 0]], 0.003, 0.02), m.black, x, 1.4, 0.06, false)
  }
  // The aneroid gauge.
  k.cyl(p, 0.07, 0.07, 0.03, m.whitePlastic, 0.17, 1.5, 0.05, 28).rotation.x = PI / 2
  k.cyl(p, 0.06, 0.06, 0.002, e.o.sign('aneroid', 128, 128, (c, w, h) => {
    c.fillStyle = '#fbfbf8'
    c.fillRect(0, 0, w, h)
    c.strokeStyle = '#222'
    c.lineWidth = 2
    for (let i = 0; i <= 30; i++) {
      const a = PI * 0.75 + (i / 30) * PI * 1.5
      const r0 = i % 5 ? 0.4 : 0.34
      c.beginPath()
      c.moveTo(w / 2 + Math.cos(a) * w * r0, h / 2 + Math.sin(a) * h * r0)
      c.lineTo(w / 2 + Math.cos(a) * w * 0.46, h / 2 + Math.sin(a) * h * 0.46)
      c.stroke()
    }
    c.strokeStyle = '#c8161d'
    c.beginPath()
    c.moveTo(w / 2, h / 2)
    c.lineTo(w * 0.32, h * 0.7)
    c.stroke()
  }), 0.17, 1.5, 0.066, 28).rotation.x = PI / 2
  k.box(p, 0.12, 0.08, 0.06, m.whitePlastic, 0.17, 1.3, 0.05)
  k.soft(p, 0.1, 0.06, 0.05, 0.012, m.blue, 0.17, 1.32, 0.06)
  k.soft(p, 0.06, 0.12, 0.04, 0.01, m.whitePlastic, -0.27, 1.45, 0.07)
}

/** A wall-mounted clinical hand-hygiene set: alcohol rub and soap dispensers, a paper towel dispenser. */
export function dispensers(e: OpdCtx, p: Object3D, y = 1.3) {
  const { k, m } = e
  k.soft(p, 0.11, 0.24, 0.1, 0.02, m.whitePlastic, -0.22, y + 0.12, 0.05)
  k.box(p, 0.06, 0.03, 0.03, m.blue, -0.22, y + 0.02, 0.09, false)
  k.soft(p, 0.11, 0.24, 0.1, 0.02, m.whitePlastic, 0, y + 0.12, 0.05)
  k.box(p, 0.06, 0.03, 0.03, m.green, 0, y + 0.02, 0.09, false)
  k.box(p, 0.28, 0.36, 0.12, m.whitePlastic, 0.3, y + 0.25, 0.06)
  k.box(p, 0.18, 0.01, 0.02, m.darkPlastic, 0.3, y + 0.08, 0.12, false)
}

/** A clinical hand-wash basin: wall-hung vitreous china, an elbow-lever mixer, the dispensers over it. */
export function basin(e: OpdCtx, p: Object3D, w = 0.6) {
  const { k, m } = e
  k.soft(p, w, 0.18, 0.45, 0.04, m.whitePlastic, 0, 0.8, 0.23)
  k.box(p, w - 0.12, 0.02, 0.3, m.stainless, 0, 0.88, 0.25, false)
  k.cyl(p, 0.022, 0.026, 0.2, m.chrome, 0, 0.98, 0.05, 14)
  rod(e, p, 0.012, 0.18, m.chrome, 0, 1.06, 0.13, 'z', 10)
  rod(e, p, 0.007, 0.22, m.chrome, 0.08, 1.0, 0.06, 'x', 8)
  k.cyl(p, 0.03, 0.04, 0.08, m.chrome, 0, 0.68, 0.12, 14)
  dispensers(e, group(p, 0, 0, 0), 1.25)
  face(e, p, 0.3, 0.42, e.m.poster, w / 2 + 0.32, 1.5, 0.004)
}

/** A wall clock: white rim, black hands, the hospital's. */
export function clock(e: OpdCtx, p: Object3D, y = 2.3) {
  const { k, m } = e
  k.cyl(p, 0.16, 0.16, 0.04, m.whitePlastic, 0, y, 0.02, 32).rotation.x = PI / 2
  face(e, p, 0.28, 0.28, m.clock, 0, y, 0.042)
}

/** A framed notice or poster on a wall at height y (its centre). */
export function poster(e: OpdCtx, p: Object3D, title: string, band: string, w = 0.42, h = 0.6, y = 1.55) {
  const { k, m } = e
  let seed = 0
  for (const c of title) seed = (seed * 31 + c.charCodeAt(0)) % 9973
  k.box(p, w + 0.02, h + 0.02, 0.012, m.aluminium, 0, y, 0.006)
  face(e, p, w, h, e.o.sign(`poster_${title}`, 360, Math.round((360 * h) / w), notice(title, band, seed)), 0, y, 0.0125)
}

/** A wall-mounted flat screen (a token display, a TV), w wide, its picture `mat`. */
export function wallScreen(e: OpdCtx, p: Object3D, w: number, y: number, mat: Material) {
  const { k, m } = e
  const h = w * 0.5625
  k.box(p, w, h, 0.05, m.black, 0, y, 0.035)
  face(e, p, w - 0.03, h - 0.03, mat, 0, y, 0.0605)
  k.box(p, 0.2, 0.2, 0.01, m.darkPlastic, 0, y, 0.005)
}

/** An X-ray film viewer: a wall lightbox of `n` panels, lit, a film clipped to one. */
export function viewer(e: OpdCtx, p: Object3D, n = 2, y = 1.55) {
  const { k, m } = e
  const w = 0.4 * n + 0.06
  k.box(p, w, 0.56, 0.08, m.whitePlastic, 0, y, 0.04)
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 0.03 + 0.2 + i * 0.4
    face(e, p, 0.38, 0.46, e.o.screen('viewerPanel', 32, 32, (c, ww, hh) => {
      c.fillStyle = '#f2f6fb'
      c.fillRect(0, 0, ww, hh)
    }, 1.2), x, y + 0.02, 0.081)
    if (i === 0) face(e, p, 0.34, 0.42, e.o.sign('chestFilm', 256, 320, (c, ww, hh) => {
      c.fillStyle = '#0b0b0b'
      c.fillRect(0, 0, ww, hh)
      const g = c.createRadialGradient(ww / 2, hh * 0.5, 10, ww / 2, hh * 0.5, ww * 0.6)
      g.addColorStop(0, 'rgba(120,120,120,.2)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
      c.fillStyle = g
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
  k.box(p, w - 0.06, 0.03, 0.02, m.greyPlastic, 0, y + 0.26, 0.085, false)
}

/* ---------- storage ---------- */

export type Fill = 'files' | 'supplies' | 'medicines' | 'linen' | 'reagents' | 'none'

/** What a shelf holds, w wide and d deep, standing on y (its front at z = 0). */
export function fillShelf(e: OpdCtx, p: Object3D, fill: Fill, w: number, y: number, d: number, h = 0.3) {
  const { k, m } = e
  if (fill === 'files') binders(e, p, w, y, -0.01, Math.min(0.28, d - 0.02))
  else if (fill === 'supplies') supplies(e, p, w, y, -0.01, d - 0.02, h)
  else if (fill === 'medicines') medicineBoxes(e, p, w, y, -0.01, d - 0.02, h)
  else if (fill === 'reagents') reagentBottles(e, p, w, y, -0.02, d - 0.04)
  else if (fill === 'linen') for (let i = 0; i < Math.floor(w / 0.42); i++) for (let j = 0; j < 4; j++) k.soft(p, 0.38, 0.05, d - 0.06, 0.012, j % 2 ? m.blanket : m.sheet, -w / 2 + 0.21 + i * 0.42, y + 0.026 + j * 0.052, -d / 2)
}

/**
 * A floor cupboard, w × h × d, white laminate: a pair (or one) of hinged doors that open
 * (operated; glazed if asked), shelves inside holding `fill`; drawers at the bottom if asked.
 */
export function cupboard(e: OpdCtx, p: Object3D, w: number, h: number, d: number, opts: { glass?: boolean; fill?: Fill; shelves?: number; drawers?: number; label?: string; top?: Material } = {}) {
  const { m } = e
  const nDr = opts.drawers ?? 0
  const drH = 0.18
  const base = nDr ? 0.1 + nDr * drH : 0
  const ns = opts.shelves ?? Math.max(1, Math.round((h - base) / 0.38) - 1)
  const plinth = 0.1
  const inner = h - Math.max(base, plinth) - 0.02
  const shelfYs = Array.from({ length: ns }, (_, i) => Math.max(base, plinth) + ((i + 1) * inner) / (ns + 1))
  carcass(e, p, w, h, d, m.hpl, shelfYs, plinth, opts.top)
  const levels = [Math.max(base, plinth) + 0.02, ...shelfYs.map((s) => s + 0.01)]
  for (let i = 0; i < levels.length; i++) {
    const room = (i + 1 < levels.length ? levels[i + 1] : h - 0.02) - levels[i]
    if (opts.fill && opts.fill !== 'none') fillShelf(e, p, opts.fill, w - 0.06, levels[i], d - 0.04, room * 0.85)
  }
  for (let i = 0; i < nDr; i++) drawer(e, p, 0, plinth + drH / 2 + i * drH, 0, { w: w - 0.006, h: drH - 0.004, d: d - 0.04, front: m.hpl, handle: 'bar', label: opts.label ? `${opts.label} Drawer` : 'Drawer', fill: packs(e, [m.whitePlastic, m.blue, m.paper], [0.09, 0.05, 0.12]) })
  const dh = h - base - (opts.top ? 0 : 0.004) - 0.01
  const dy = base + dh / 2 + 0.005
  const pair = w > 0.6
  const lbl = opts.label ?? 'Cupboard'
  if (pair) {
    cupboardDoor(e, p, -w / 2 + 0.002, dy, 0, { w: w / 2 - 0.004, h: dh, hinge: 'left', face: opts.glass ? m.aluminium : m.hpl, glass: opts.glass, label: lbl, angle: 1.6 })
    cupboardDoor(e, p, w / 2 - 0.002, dy, 0, { w: w / 2 - 0.004, h: dh, hinge: 'right', face: opts.glass ? m.aluminium : m.hpl, glass: opts.glass, label: lbl, angle: 1.6 })
  } else cupboardDoor(e, p, -w / 2 + 0.002, dy, 0, { w: w - 0.006, h: dh, hinge: 'left', face: opts.glass ? m.aluminium : m.hpl, glass: opts.glass, label: lbl, angle: 1.6 })
}

/** A wall cupboard hung at `y` (its bottom), w × h × d: shelves of `fill` behind doors that open. */
export function wallCupboard(e: OpdCtx, p: Object3D, w: number, h: number, d: number, y: number, opts: { glass?: boolean; fill?: Fill; label?: string } = {}) {
  const up = group(p, 0, y, 0)
  cupboard(e, up, w, h, d, { ...opts, shelves: Math.max(1, Math.round(h / 0.35) - 1) })
  // A wall cupboard has no plinth: the carcass's own bottom closes it (the plinth box is under it, hidden by its depth).
  return up
}

/** A run of base units with a worktop: drawers and doors that open, `len` long, a solid-surface top at 0.9. */
export function baseRun(e: OpdCtx, p: Object3D, len: number, opts: { sink?: number; fill?: Fill; top?: Material } = {}) {
  const { k, m } = e
  const n = Math.max(1, Math.round(len / 0.6))
  const uw = len / n
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + uw * (i + 0.5)
    const u = group(p, x, 0, 0)
    if (i % 3 === 0) {
      carcass(e, u, uw, 0.88, 0.6, m.hpl, [], 0.1)
      for (let j = 0; j < 4; j++) drawer(e, u, 0, 0.78 - j * 0.19, 0, { w: uw - 0.006, h: 0.185, d: 0.56, front: m.hpl, handle: 'bar', label: 'Drawer', fill: packs(e, [m.whitePlastic, m.blue, m.paper, m.binBlue], [0.09, 0.05, 0.12]) })
    } else cupboard(e, u, uw, 0.88, 0.6, { fill: opts.fill ?? 'supplies', shelves: 1 })
  }
  k.box(p, len + 0.02, 0.03, 0.64, opts.top ?? m.solidSurface, 0, 0.895, -0.3)
  k.box(p, len + 0.02, 0.1, 0.012, opts.top ?? m.solidSurface, 0, 0.96, -0.606)
  if (opts.sink !== undefined) {
    // An inset stainless sink with a swan-neck mixer.
    k.box(p, 0.5, 0.012, 0.4, m.stainless, opts.sink, 0.913, -0.3, false)
    k.box(p, 0.42, 0.004, 0.32, m.black, opts.sink, 0.915, -0.3, false)
    put(p, bentTube(e, 'swan', [[0, 0, 0], [0, 0.3, 0], [0, 0.32, 0.18], [0, 0.22, 0.2]], 0.012, 0.06), m.chrome, opts.sink, 0.91, -0.56, false)
  }
}

/** A slotted-angle steel storage rack, w × h × d, `levels` shelves of `fill`. */
export function rack(e: OpdCtx, p: Object3D, w: number, h: number, d: number, levels: number, fill: Fill) {
  const { k, m } = e
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(p, 0.035, h, 0.035, m.galvanised, sx * (w / 2 - 0.018), h / 2, -d / 2 + sz * (d / 2 - 0.018))
  for (let i = 0; i < levels; i++) {
    const y = 0.12 + (i * (h - 0.2)) / Math.max(1, levels - 1)
    k.box(p, w, 0.02, d, m.galvanised, 0, y, -d / 2)
    if (i < levels - 1) fillShelf(e, p, fill, w - 0.06, y + 0.01, d, ((h - 0.2) / Math.max(1, levels - 1)) * 0.8)
  }
}

/** A four-drawer steel filing cabinet whose drawers open. */
export function fileCabinet(e: OpdCtx, p: Object3D, n = 4) {
  const { k, m } = e
  const h = 0.33 * n + 0.05
  const steel = e.o.frame
  for (const s of [-1, 1]) k.box(p, 0.012, h, 0.62, steel, s * 0.234, h / 2, -0.31)
  k.box(p, 0.47, 0.012, 0.62, steel, 0, h - 0.006, -0.31)
  k.box(p, 0.47, h, 0.012, steel, 0, h / 2, -0.616)
  for (let i = 0; i < n; i++) drawer(e, p, 0, 0.05 + 0.165 + i * 0.33, 0, { w: 0.462, h: 0.32, d: 0.58, front: steel, handle: 'cup', label: 'Filing Drawer', fill: (g, iw, id, ih) => {
    for (let z = -0.04; z > -id + 0.04; z -= 0.03) k.box(g, iw - 0.04, ih * 0.75, 0.004, [m.paper, m.vacuum, m.blue][Math.floor(Math.abs(z * 77)) % 3], 0, (ih * 0.75) / 2, z, false)
  } })
}

/** Staff lockers, `n` wide, each a full-height door that opens (operated), a number on each. */
export function lockers(e: OpdCtx, p: Object3D, n = 4) {
  const { k, m } = e
  const w = 0.4
  for (let i = 0; i < n; i++) {
    const g = group(p, (i - (n - 1) / 2) * w, 0, 0)
    carcass(e, g, w, 1.8, 0.5, e.o.frame, [1.55], 0.08)
    k.cyl(g, 0.012, 0.012, 1.0, m.chrome, 0, 1.4, -0.1, 8).rotation.x = PI / 2
    cupboardDoor(e, g, -w / 2 + 0.002, 0.94, 0, { w: w - 0.006, h: 1.7, hinge: 'left', face: e.o.frame, label: 'Locker', angle: 1.6 })
  }
}

/* ---------- waste, sharps, hygiene ---------- */

export type BinColour = 'yellow' | 'red' | 'blue' | 'white' | 'black' | 'green'

/**
 * A row of foot-pedal bins for segregation at source, as the Bio-Medical Waste Management Rules
 * require: yellow (anatomical, soiled dressings), red (contaminated plastics), white translucent
 * (sharps), blue (glass), black (general), green (wet); each with its liner and its label.
 */
export function bins(e: OpdCtx, p: Object3D, colours: BinColour[], size: 'small' | 'large' = 'small') {
  const { k, m } = e
  const r = size === 'large' ? 0.2 : 0.15
  const h = size === 'large' ? 0.62 : 0.46
  const tone: Record<BinColour, Material> = { yellow: m.sharps, red: m.red, blue: m.blue, white: m.whitePlastic, black: m.darkPlastic, green: m.green }
  colours.forEach((c, i) => {
    const x = (i - (colours.length - 1) / 2) * (r * 2 + 0.05)
    k.cyl(p, r, r * 0.92, h, tone[c], x, h / 2, 0, 24)
    k.cyl(p, r + 0.005, r + 0.005, 0.03, tone[c], x, h + 0.015, 0, 24)
    k.box(p, 0.08, 0.02, 0.06, m.darkPlastic, x, 0.03, r + 0.02, false)
    face(e, p, r * 0.9, r * 0.6, e.o.sign(`binlabel_${c}`, 128, 96, (g, w, hh) => {
      g.fillStyle = '#ffffff'
      g.fillRect(0, 0, w, hh)
      g.fillStyle = '#111'
      g.font = `700 ${hh * 0.24}px Helvetica`
      g.textAlign = 'center'
      g.fillText('BIOHAZARD', w / 2, hh * 0.35)
      g.font = `500 ${hh * 0.18}px Helvetica`
      g.fillText(c === 'black' ? 'GENERAL WASTE' : c === 'green' ? 'WET WASTE' : `${c.toUpperCase()} CATEGORY`, w / 2, hh * 0.72)
    }), x, h * 0.6, r + 0.002)
  })
}

/** A yellow sharps container on its wall bracket, puncture-proof, its aperture lid. */
export function sharps(e: OpdCtx, p: Object3D, y = 1.2) {
  const { k, m } = e
  k.box(p, 0.22, 0.04, 0.02, m.stainless, 0, y - 0.13, 0.01)
  k.box(p, 0.2, 0.28, 0.14, m.sharps, 0, y, 0.09)
  k.box(p, 0.2, 0.04, 0.15, m.red, 0, y + 0.16, 0.09)
  k.box(p, 0.08, 0.01, 0.05, m.black, 0, y + 0.18, 0.1, false)
}

/** Disposable gloves in their box (nitrile blue), on a surface or a wall holder. */
export function gloveBox(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.box(g, 0.24, 0.07, 0.12, m.whitePlastic, 0, 0.035, 0)
  k.box(g, 0.24, 0.004, 0.12, m.blue, 0, 0.068, 0, false)
  k.soft(g, 0.05, 0.03, 0.04, 0.012, m.blue, 0, 0.08, 0)
  return g
}

/** A bottle: body radius r, height h, its liquid and its cap. */
export function bottle(e: OpdCtx, p: Object3D, x: number, y: number, z: number, h: number, r: number, body: Material, cap: Material) {
  const { k } = e
  k.cyl(p, r, r, h * 0.82, body, x, y + h * 0.41, z, 14)
  k.cyl(p, r * 0.75, r, h * 0.08, body, x, y + h * 0.86, z, 14)
  k.cyl(p, r * 0.5, r * 0.5, h * 0.1, cap, x, y + h * 0.95, z, 12)
}

/* ---------- dressings and trolleys ---------- */

/**
 * Dressing supplies laid out w × d on a tray or shelf at y: crêpe bandage rolls, cotton wool rolls
 * in blue paper, gauze swab packs, an antiseptic (povidone-iodine) bottle and a chlorhexidine one,
 * micropore tape, a box of gloves, a kidney tray.
 */
export function dressingSupplies(e: OpdCtx, p: Object3D, w: number, d: number, y: number) {
  const { k, m } = e
  const r = rng(Math.round(w * 1000 + d * 100 + y * 10))
  for (let i = 0; i < 3; i++) {
    const roll = k.cyl(p, 0.035, 0.035, 0.1, m.paper, -w / 2 + 0.06 + i * 0.08, y + 0.035, -d / 2 + 0.07, 18)
    roll.rotation.z = PI / 2
  }
  k.cyl(p, 0.06, 0.06, 0.12, m.blue, -w / 2 + 0.08, y + 0.06, d / 2 - 0.1, 20).rotation.x = PI / 2
  for (let i = 0; i < 4; i++) k.box(p, 0.1, 0.02, 0.1, m.paper, w * 0.05 + (i % 2) * 0.11, y + 0.01 + Math.floor(i / 2) * 0.02, -d / 2 + 0.08)
  bottle(e, p, w / 2 - 0.07, y, -d / 2 + 0.07, 0.17, 0.035, m.amber, m.black)
  bottle(e, p, w / 2 - 0.15, y, -d / 2 + 0.07, 0.15, 0.03, m.whitePlastic, m.red)
  for (let i = 0; i < 2; i++) k.cyl(p, 0.025, 0.025, 0.025, m.whitePlastic, w / 2 - 0.08 - i * 0.07, y + 0.0125, d / 2 - 0.07, 16)
  gloveBox(e, p, 0, y, d / 2 - 0.08, (r() - 0.5) * 0.2)
  put(p, lathe(e, 'kidney', [[0, 0], [0.09, 0], [0.11, 0.03], [0.115, 0.035]], 20), m.stainless, -w / 2 + 0.25, y, 0.0, false).scale.set(1, 1, 0.55)
}

/**
 * A stainless two-tier dressing trolley on castors: the tray of instruments (forceps, scissors,
 * gallipots) and dressings on top, packs and bottles below, a waste bag on its ring.
 */
export function dressingTrolley(e: OpdCtx, p: Object3D, w = 0.75, d = 0.48) {
  const { k, m } = e
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    k.cyl(p, 0.012, 0.012, 0.86, m.stainless, sx * (w / 2 - 0.02), 0.52, sz * (d / 2 - 0.02), 10)
    castor(e, p, sx * (w / 2 - 0.02), sz * (d / 2 - 0.02), 0.04)
  }
  for (const y of [0.3, 0.88]) {
    k.box(p, w, 0.012, d, m.stainless, 0, y, 0)
    for (const s of [-1, 1]) k.box(p, w, 0.03, 0.008, m.stainless, 0, y + 0.015, s * d / 2)
  }
  // Instruments in a tray on top, dressings beside.
  k.box(p, 0.36, 0.025, 0.24, m.stainless, -w / 4, 0.9, 0)
  for (let i = 0; i < 4; i++) k.box(p, 0.14, 0.006, 0.008, m.chrome, -w / 4 - 0.06, 0.918, -0.08 + i * 0.05, false).rotation.y = 0.15 * (i - 1.5)
  for (let i = 0; i < 2; i++) put(p, lathe(e, 'gallipot', [[0, 0], [0.03, 0], [0.04, 0.045]], 16), m.stainless, -w / 4 + 0.1, 0.9, -0.06 + i * 0.09, false)
  dressingSupplies(e, p, w / 2 - 0.04, d - 0.06, 0.894)
  dressingSupplies(e, group(p, 0, 0, 0), w - 0.08, d - 0.06, 0.306)
  // The waste ring on its arm, a yellow bag in it.
  rod(e, p, 0.008, 0.18, m.stainless, w / 2 + 0.09, 0.8, 0, 'x', 8)
  k.cyl(p, 0.12, 0.12, 0.012, m.stainless, w / 2 + 0.2, 0.8, 0, 20)
  k.soft(p, 0.22, 0.3, 0.22, 0.08, m.sharps, w / 2 + 0.2, 0.66, 0)
}

/** A medicine or injection trolley: a stainless frame, a top tray, two drawers that open, a sharps box clipped on. */
export function injectionTrolley(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const w = 0.6
  const d = 0.45
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * (w / 2 - 0.03), sz * (d / 2 - 0.03), 0.04)
  carcass(e, p, w, 0.88, d, m.whitePlastic, [0.3], 0.12, m.stainless)
  for (let i = 0; i < 2; i++) drawer(e, p, 0, 0.78 - i * 0.16, d / 2 - d / 2, { w: w - 0.006, h: 0.155, d: d - 0.04, front: m.blue, handle: 'grip', label: 'Trolley Drawer', fill: packs(e, [m.whitePlastic, m.blue, m.paper, m.purple], [0.06, 0.04, 0.12]) })
  k.box(p, w - 0.04, 0.03, d - 0.04, m.stainless, 0, 0.92, -d / 2)
  for (let i = 0; i < 6; i++) k.cyl(p, 0.008, 0.008, 0.07, m.clearPlastic, -0.2 + i * 0.05, 0.96, -d / 2 + 0.06, 8)
  k.box(p, 0.12, 0.16, 0.1, m.sharps, w / 2 - 0.08, 1.02, -d / 2 - 0.1)
}

/* ---------- privacy ---------- */

/**
 * A privacy curtain on its ceiling track, `len` along local x from 0, hung from the ceiling
 * (at `ceiling` above the floor) to 0.3 m off the floor; `drawn` is how much of the track it covers.
 */
export function curtain(e: OpdCtx, p: Object3D, len: number, ceiling: number, drawn = 1) {
  const { k, m } = e
  k.box(p, len, 0.03, 0.03, m.aluminium, len / 2, ceiling - 0.015, 0, false)
  for (const x of [0.02, len - 0.02]) k.box(p, 0.03, 0.05, 0.03, m.aluminium, x, ceiling - 0.04, 0, false)
  const w = Math.max(0.25, len * drawn)
  const head = 0.45
  const top = ceiling - 0.05
  const cloth = top - head - 0.3
  const pleat = (h: number) => geo(e, `opdPleat${w.toFixed(2)}|${h.toFixed(2)}`, () => {
    const g = new PlaneGeometry(w, h, Math.max(4, Math.round(w / 0.03)), 1)
    const pos = g.getAttribute('position')
    const rr = rng(Math.round(w * 1000))
    const ph = rr() * 6
    for (let i = 0; i < pos.count; i++) {
      const s = pos.getX(i) + w / 2
      const t = (s / 0.16) * PI * 2
      pos.setZ(i, 0.03 * (Math.sin(t + 0.6 * Math.sin(t * 0.37 + ph)) * (0.7 + 0.3 * Math.sin(t * 0.2))))
    }
    g.computeVertexNormals()
    return g
  })
  const net = new Mesh(pleat(head), m.curtainNet)
  net.position.set(w / 2, top - head / 2, 0)
  p.add(net)
  const c = new Mesh(pleat(cloth), m.curtain)
  c.position.set(w / 2, 0.3 + cloth / 2, 0)
  c.castShadow = true
  p.add(c)
}

/* ---------- equipment that stands about ---------- */

/** A weighing scale: an adult column scale with its beam, or a flat digital floor scale. */
export function scale(e: OpdCtx, p: Object3D, kind: 'column' | 'floor' = 'column') {
  const { k, m } = e
  if (kind === 'floor') {
    k.soft(p, 0.32, 0.05, 0.32, 0.02, m.greyPlastic, 0, 0.025, 0)
    k.box(p, 0.28, 0.004, 0.28, m.black, 0, 0.052, 0, false)
    k.box(p, 0.08, 0.002, 0.03, m.board, 0, 0.055, 0.1, false)
    return
  }
  k.soft(p, 0.36, 0.08, 0.42, 0.02, m.whitePlastic, 0, 0.04, 0)
  k.box(p, 0.3, 0.004, 0.34, m.black, 0, 0.082, 0.02, false)
  k.box(p, 0.05, 1.25, 0.05, m.whitePlastic, 0, 0.7, -0.18)
  k.box(p, 0.24, 0.12, 0.08, m.whitePlastic, 0, 1.35, -0.16)
  k.box(p, 0.16, 0.06, 0.004, m.board, 0, 1.36, -0.118, false)
  // The height rod, a sliding headpiece.
  k.box(p, 0.02, 0.7, 0.02, m.aluminium, 0, 1.75, -0.2)
  k.box(p, 0.16, 0.012, 0.04, m.aluminium, 0, 1.8, -0.15)
}

/** A wall-mounted height rod (stadiometer) with its sliding head plate. */
export function stadiometer(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  k.box(p, 0.06, 2.0, 0.02, m.whitePlastic, 0, 1.1, 0.01)
  k.box(p, 0.005, 1.8, 0.002, m.black, -0.015, 1.1, 0.021, false)
  k.box(p, 0.3, 0.015, 0.25, m.whitePlastic, 0, 1.72, 0.13)
  k.box(p, 0.4, 0.004, 0.4, m.black, 0, 0.003, 0.25, false)
}

/** A medical refrigerator with a glass door (operated) on shelves of vials and boxes, its temperature display lit. */
export function medFridge(e: OpdCtx, p: Object3D, label = 'Medical Refrigerator', h = 1.75, w = 0.6) {
  const { k, m } = e
  const d = 0.62
  carcass(e, p, w, h, d, m.whitePlastic, [0.45, 0.8, 1.15, 1.45].filter((s) => s < h - 0.15), 0.08)
  for (const y of [0.45, 0.8, 1.15, 1.45].filter((s) => s < h - 0.15)) medicineBoxes(e, p, w - 0.08, y + 0.01, -0.03, d - 0.1, 0.25)
  k.box(p, w - 0.06, 0.004, d - 0.1, e.o.cove, 0, h - 0.04, -d / 2, false)
  cupboardDoor(e, p, -w / 2 + 0.002, h / 2 + 0.04, 0, { w: w - 0.006, h: h - 0.1, hinge: 'left', face: m.aluminium, glass: true, label, angle: 1.7 })
  k.box(p, 0.1, 0.04, 0.012, e.o.screen('fridgeTemp', 64, 24, (g, ww, hh) => {
    g.fillStyle = '#081208'
    g.fillRect(0, 0, ww, hh)
    g.fillStyle = '#4bff72'
    g.font = `700 ${hh * 0.8}px Helvetica`
    g.fillText('+4.6°C', 3, hh * 0.85)
  }, 1.1), 0, h - 0.04, 0.012, false)
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
/** Medicine cartons: white boards printed in a dozen pharmaceutical house styles. */
function medicineMats(e: OpdCtx) {
  let list = medCache.get(e.o)
  if (list) return list
  const styles: [string, string][] = [
    ['#ffffff', '#c8161d'], ['#ffffff', '#1f6fd1'], ['#ffffff', '#1f9d55'], ['#f3efe2', '#7a4fa0'], ['#ffffff', '#f08a00'], ['#eaf4fb', '#0e5aa7'],
    ['#ffffff', '#00897b'], ['#fff6e5', '#b5651d'], ['#ffffff', '#5d6b7c'], ['#fdeef2', '#c2185b'], ['#ffffff', '#2e7d32'], ['#eef1f8', '#283593'],
  ]
  list = styles.map(([bg, ink], i) => e.o.sign(`carton${i}`, 64, 64, (g, w, h) => {
    g.fillStyle = bg
    g.fillRect(0, 0, w, h)
    g.fillStyle = ink
    g.fillRect(0, h * (0.15 + (i % 3) * 0.1), w, h * 0.18)
    g.fillRect(w * 0.1, h * 0.6, w * 0.5, h * 0.06)
    g.fillRect(w * 0.1, h * 0.72, w * 0.35, h * 0.05)
  }, 0.6))
  medCache.set(e.o, list)
  return list
}

/** Reagent bottles and kits on a shelf: amber and clear bottles, coloured caps, kit boxes. */
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
    bottle(e, p, x + rr, y, z - rr - 0.01 - r() * (d - 2 * rr - 0.02), 0.1 + r() * 0.12, rr, r() < 0.5 ? m.amber : m.clearPlastic, [m.blue, m.red, m.black, m.whitePlastic, m.sharps][Math.floor(r() * 5)])
    x += rr * 2 + 0.012
  }
}

/** A portable oxygen cylinder (B-type) on its two-wheeled trolley, the regulator and flowmeter on it. */
export function oxygenTrolley(e: Ctx, p: Object3D, cylinderFn: (e: Ctx, p: Object3D, r: number, h: number, kind: 'in use' | 'full' | 'portable') => void) {
  const { k, m } = e
  k.soft(p, 0.3, 0.03, 0.28, 0.01, m.powder, 0, 0.1, 0)
  for (const s of [-1, 1]) castor(e, p, s * 0.12, -0.08, 0.06)
  put(p, bentTube(e, 'o2handle', [[-0.1, 0.1, -0.12], [-0.1, 1.05, -0.12], [0.1, 1.05, -0.12], [0.1, 0.1, -0.12]], 0.012, 0.05), m.powder)
  cylinderFn(e, group(p, 0, 0.12, 0), 0.09, 0.95, 'in use')
}

/** A wheelchair, open, as kept at a bay, brakes on (the emergency department's model). */
export { wheelchair } from '../erFurniture'

/** A white coat on a hook, hanging: the doctor's, by the door. */
export function coatOnHook(e: OpdCtx, p: Object3D, y = 1.75) {
  const { k, m } = e
  k.box(p, 0.06, 0.04, 0.05, m.chrome, 0, y, 0.025)
  k.soft(p, 0.46, 0.95, 0.12, 0.06, m.sheet, 0, y - 0.5, 0.08)
  k.soft(p, 0.2, 0.06, 0.1, 0.03, m.sheet, 0, y - 0.02, 0.06)
}

/** An adult examination couch with its paper roll and a step (the emergency department's model), turned along local x. */
export { examCouch } from '../erFurniture'

/** A simple solid-surface counter top on legs for a workroom, w × d at h, with a shelf below. */
export function workbench(e: OpdCtx, p: Object3D, w: number, d: number, h = 0.9, top?: Material) {
  const { k, m } = e
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(p, 0.04, h - 0.03, 0.04, m.powder, sx * (w / 2 - 0.04), (h - 0.03) / 2, -d / 2 + sz * (d / 2 - 0.04))
  k.box(p, w, 0.03, d, top ?? m.solidSurface, 0, h - 0.015, -d / 2)
  k.box(p, w - 0.1, 0.018, d - 0.1, m.hpl, 0, 0.2, -d / 2)
}

/** A group in p, for builders that take (e, p): re-exported so fitters need only this module. */
export { group, rod, face, put, castor }
