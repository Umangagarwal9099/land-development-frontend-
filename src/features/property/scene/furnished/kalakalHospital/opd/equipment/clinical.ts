import type { Material, Object3D } from 'three'
import { PI } from '../../../kit'
import { bentTube, carcass, castor, cupboardDoor, drawer, face, group, lathe, put, rod, starBase } from '../../erKit'
import { packs } from '../../erFurniture'
import type { OpdCtx } from '../ctx'
import { SANS } from '../paints'

/*
 * The consultation floor's specialty equipment: the pieces that make a cardiology room a
 * cardiology room and an ENT room an ENT room, each at a manufacturer's typical size, front towards
 * +z, standing on y = 0 (or, for small things, at (x, y, z) on a surface). Finishes are the shared
 * ones (e.m, e.o); printed faces are painted once per model by key.
 */

/* ---------- printed faces ---------- */

const scopePaint = (g: CanvasRenderingContext2D, w: number, h: number) => {
  // An endoscopic view of the nasal cavity: a pink circle in black, the console's text.
  g.fillStyle = '#040404'
  g.fillRect(0, 0, w, h)
  const r = h * 0.42
  const grad = g.createRadialGradient(w * 0.48, h * 0.5, r * 0.1, w * 0.5, h * 0.5, r)
  grad.addColorStop(0, '#f3b4a2')
  grad.addColorStop(0.55, '#c8665a')
  grad.addColorStop(0.9, '#5a1c18')
  grad.addColorStop(1, '#000')
  g.fillStyle = grad
  g.beginPath()
  g.arc(w * 0.5, h * 0.5, r, 0, PI * 2)
  g.fill()
  g.fillStyle = '#c9d6e6'
  g.font = SANS(h * 0.05, 500)
  g.fillText('ENT · 0° SCOPE', w * 0.03, h * 0.08)
}

const cauteryPaint = (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.fillStyle = '#0d1a2b'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#ffd45a'
  g.font = SANS(h * 0.4, 700)
  g.fillText('25', w * 0.08, h * 0.55)
  g.fillStyle = '#5ec8ff'
  g.fillText('15', w * 0.56, h * 0.55)
  g.font = SANS(h * 0.16, 500)
  g.fillStyle = '#ffffff'
  g.fillText('CUT W', w * 0.08, h * 0.85)
  g.fillText('COAG W', w * 0.56, h * 0.85)
}

const lcd = (lines: string[]) => (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.fillStyle = '#bfd2c0'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#16251a'
  g.font = SANS(h / (lines.length + 0.6), 700)
  lines.forEach((l, i) => g.fillText(l, w * 0.08, (h * (i + 1)) / (lines.length + 0.3)))
}

/* ---------- on the desk and the trays ---------- */

/** A blood glucose meter with its strip vial and lancet pen, on a surface at (x, y, z). */
export function glucometer(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.soft(g, 0.055, 0.02, 0.09, 0.01, m.darkPlastic, 0, 0.01, 0)
  k.box(g, 0.035, 0.002, 0.03, e.o.screen('gluco', 64, 48, lcd(['112', 'mg/dL'])), 0, 0.021, -0.012, false)
  k.cyl(g, 0.012, 0.012, 0.06, m.whitePlastic, 0.06, 0.03, 0.01, 12)
  k.cyl(g, 0.009, 0.009, 0.1, m.blue, 0.1, 0.005, 0.0, 10).rotation.x = PI / 2
  return g
}

/** A neurological examination tray: Taylor reflex hammer, 128 and 512 Hz tuning forks, a pin wheel, cotton wisps, a torch. */
export function neuroTray(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.box(g, 0.32, 0.015, 0.22, m.stainless, 0, 0.0075, 0)
  // The hammer: a red triangular rubber head on a chrome handle.
  rod(e, g, 0.005, 0.2, m.chrome, -0.04, 0.022, -0.06, 'x', 8)
  k.box(g, 0.025, 0.02, 0.06, m.red, -0.15, 0.025, -0.06)
  // Two tuning forks.
  for (const [dz, len] of [[0.0, 0.18], [0.05, 0.13]] as const) {
    rod(e, g, 0.004, 0.06, m.chrome, -0.08, 0.02, dz, 'x', 8)
    for (const s of [-1, 1]) rod(e, g, 0.003, len - 0.06, m.chrome, -0.05 + (len - 0.06) / 2, 0.02, dz + s * 0.008, 'x', 6)
  }
  // Pin wheel, cotton, pen torch.
  rod(e, g, 0.004, 0.12, m.chrome, 0.08, 0.02, -0.07, 'x', 8)
  k.cyl(g, 0.012, 0.012, 0.004, m.chrome, 0.15, 0.02, -0.07, 14).rotation.x = PI / 2
  k.soft(g, 0.06, 0.02, 0.05, 0.01, m.paper, 0.1, 0.02, 0.05)
  rod(e, g, 0.007, 0.13, m.darkPlastic, 0.06, 0.022, 0.085, 'x', 10)
  return g
}

/** A two-arm goniometer, the clear plastic protractor orthopaedics measures joints with. */
export function goniometer(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.cyl(g, 0.05, 0.05, 0.003, m.clearPlastic, 0, 0.002, 0, 24)
  k.box(g, 0.3, 0.003, 0.025, m.clearPlastic, 0.12, 0.004, 0)
  const arm = k.box(g, 0.3, 0.003, 0.025, m.clearPlastic, 0.1, 0.006, 0.06)
  arm.rotation.y = 0.6
  return g
}

/** A handheld dermatoscope: the polarised lens head, the grip, its charging stand. */
export function dermatoscope(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.cyl(g, 0.035, 0.04, 0.05, m.whitePlastic, 0, 0.025, 0, 18)
  k.cyl(g, 0.016, 0.016, 0.12, m.black, 0, 0.1, 0, 12)
  const head = k.cyl(g, 0.03, 0.03, 0.025, m.black, 0, 0.17, 0.015, 18)
  head.rotation.x = PI / 2
  k.cyl(g, 0.024, 0.024, 0.004, m.clearPlastic, 0, 0.17, 0.03, 18).rotation.x = PI / 2
  return g
}

/** A handheld foetal Doppler: the unit with its display, the probe on its cable. */
export function foetalDoppler(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.soft(g, 0.08, 0.035, 0.14, 0.015, m.whitePlastic, 0, 0.0175, 0)
  k.box(g, 0.05, 0.002, 0.035, e.o.screen('doppler', 64, 48, lcd(['FHR', '142'])), 0, 0.036, -0.03, false)
  put(g, lathe(e, 'dopProbe', [[0, 0], [0.022, 0], [0.024, 0.02], [0.012, 0.09], [0, 0.1]], 16), m.blue, 0.1, 0.0, 0.02, false).rotation.z = PI / 2
  put(g, bentTube(e, 'dopCable', [[0.04, 0.02, 0.06], [0.08, 0.01, 0.1], [0.1, 0.01, 0.04]], 0.003, 0.02), m.charcoal, 0, 0, 0, false)
  return g
}

/** A covered speculum tray: Cusco's specula in three sizes, sponge-holding forceps, swabs, a gallipot. */
export function speculumTray(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.box(g, 0.36, 0.03, 0.24, m.stainless, 0, 0.015, 0)
  for (let i = 0; i < 3; i++) {
    const s = 0.8 + i * 0.12
    const sp = k.cyl(g, 0.018 * s, 0.014 * s, 0.11 * s, m.chrome, -0.12 + i * 0.06, 0.045, -0.04, 12)
    sp.rotation.x = PI / 2
  }
  rod(e, g, 0.004, 0.24, m.chrome, 0.06, 0.04, 0.06, 'x', 8)
  for (let i = 0; i < 4; i++) k.soft(g, 0.05, 0.02, 0.05, 0.01, m.paper, 0.1 + (i % 2) * 0.05, 0.04 + Math.floor(i / 2) * 0.02, -0.06)
  put(g, lathe(e, 'gallipotS', [[0, 0], [0.03, 0], [0.04, 0.04]], 16), m.stainless, -0.03, 0.03, 0.06, false)
  return g
}

/** A suture tray: needle holder, toothed forceps, scissors, a curved needle pack and sutures, on a green drape. */
export function sutureTray(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.box(g, 0.42, 0.004, 0.3, m.oxygen, 0, 0.002, 0)
  k.box(g, 0.34, 0.022, 0.22, m.stainless, 0, 0.015, 0)
  for (let i = 0; i < 4; i++) {
    const t = k.box(g, 0.16, 0.006, 0.01, m.chrome, -0.05, 0.03, -0.07 + i * 0.045, false)
    t.rotation.y = 0.08 * (i - 1.5)
    k.cyl(g, 0.012, 0.012, 0.005, m.chrome, -0.14, 0.03, -0.07 + i * 0.045, 10)
  }
  for (let i = 0; i < 3; i++) k.box(g, 0.05, 0.004, 0.1, i === 1 ? m.purple : m.paper, 0.1 + i * 0.03, 0.03 + i * 0.002, 0.03, false)
  return g
}

/** An ENT headlight: the LED lamp on its padded band, lying on a surface. */
export function headlight(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  const band = k.cyl(g, 0.09, 0.09, 0.03, m.black, 0, 0.015, 0, 24)
  band.scale.set(1, 1, 0.85)
  k.cyl(g, 0.08, 0.08, 0.032, m.charcoal, 0, 0.016, 0, 24).scale.set(1, 1, 0.85)
  k.cyl(g, 0.022, 0.025, 0.05, m.aluminium, 0, 0.03, 0.09, 14).rotation.x = PI / 2
  return g
}

/* ---------- standing equipment ---------- */

/** A wall-mounted AED in its alarmed white cabinet, the green sign over it. */
export function aedCabinet(e: OpdCtx, p: Object3D, y = 1.25) {
  const { k, m } = e
  k.box(p, 0.42, 0.48, 0.18, m.whitePlastic, 0, y, 0.09)
  k.box(p, 0.36, 0.38, 0.004, e.o.screenGlass, 0, y - 0.02, 0.182, false)
  k.soft(p, 0.28, 0.24, 0.1, 0.03, m.oxygen, 0, y - 0.04, 0.1)
  k.box(p, 0.1, 0.1, 0.004, m.whitePlastic, 0, y - 0.04, 0.152, false)
  face(e, p, 0.42, 0.14, e.o.sign('aedSign', 384, 128, (g, w, h) => {
    g.fillStyle = '#0f8a3c'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#fff'
    g.font = SANS(h * 0.5, 700)
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText('AED', w / 2, h / 2)
  }), 0, y + 0.34, 0.005)
}

/** A plaster-of-Paris trolley: POP rolls, cotton padding, a plaster bucket, shears and a saw on two stainless tiers. */
export function plasterTrolley(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const w = 0.8
  const d = 0.5
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    k.cyl(p, 0.012, 0.012, 0.86, m.stainless, sx * (w / 2 - 0.02), 0.52, sz * (d / 2 - 0.02), 10)
    castor(e, p, sx * (w / 2 - 0.02), sz * (d / 2 - 0.02), 0.04)
  }
  for (const y of [0.3, 0.88]) k.box(p, w, 0.012, d, m.stainless, 0, y, 0)
  for (let i = 0; i < 8; i++) {
    const roll = k.cyl(p, 0.04, 0.04, 0.12, m.paper, -0.3 + (i % 4) * 0.09, 0.93 + Math.floor(i / 4) * 0.08, -0.12, 14)
    roll.rotation.z = PI / 2
  }
  for (let i = 0; i < 3; i++) k.cyl(p, 0.05, 0.05, 0.1, m.sheet, 0.25, 0.94, -0.15 + i * 0.12, 16).rotation.x = PI / 2
  k.cyl(p, 0.16, 0.14, 0.24, m.whitePlastic, -0.15, 0.43, 0.02, 20)
  k.cyl(p, 0.15, 0.15, 0.002, m.water, -0.15, 0.5, 0.02, 20)
  rod(e, p, 0.006, 0.22, m.chrome, 0.15, 0.9, 0.13, 'x', 8)
  k.box(p, 0.06, 0.02, 0.05, m.blue, 0.29, 0.9, 0.13)
}

/** A wall rack of splints: aluminium-padded finger and Cramer wire splints, a Thomas splint, cervical collars. */
export function splintRack(e: OpdCtx, p: Object3D, y = 1.2) {
  const { k, m } = e
  k.box(p, 1.0, 0.04, 0.12, m.powder, 0, y + 0.55, 0.06)
  k.box(p, 1.0, 0.04, 0.12, m.powder, 0, y - 0.35, 0.06)
  for (let i = 0; i < 6; i++) k.box(p, 0.08, 0.8, 0.01, i % 2 ? m.aluminium : m.blue, -0.42 + i * 0.1, y + 0.1, 0.08)
  put(p, bentTube(e, 'thomas', [[0, -0.4, 0], [0, 0.5, 0], [0.12, 0.6, 0], [0.24, 0.5, 0], [0.24, -0.4, 0]], 0.008, 0.08), m.chrome, 0.2, y, 0.1)
  for (let i = 0; i < 2; i++) {
    const c = k.cyl(p, 0.07, 0.07, 0.08, m.paper, 0.38, y + 0.62 + i * 0.09, 0.08, 18)
    c.scale.set(1, 1, 0.6)
  }
}

/** A magnifying lamp on a mobile five-star stand: the column, the spring-balanced arm, the lens in its LED ring. */
export function magnifierLamp(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  starBase(e, p, 0.26, 0.07, m.whitePlastic, 0.03)
  k.cyl(p, 0.015, 0.015, 0.95, m.whitePlastic, 0, 0.55, 0, 12)
  put(p, bentTube(e, 'magArm', [[0, 1.02, 0], [0, 1.25, 0.15], [0, 1.25, 0.45], [0, 1.15, 0.6]], 0.012, 0.06), m.whitePlastic)
  const head = group(p, 0, 1.12, 0.66)
  head.rotation.x = -1.0
  k.cyl(head, 0.11, 0.11, 0.035, m.whitePlastic, 0, 0, 0, 24)
  k.cyl(head, 0.085, 0.085, 0.04, m.clearPlastic, 0, 0, 0, 24)
  k.cyl(head, 0.1, 0.1, 0.004, e.m.ledPanel, 0, -0.019, 0, 24)
}

/** A liquid nitrogen dewar (cryotherapy): the aluminium flask on a wheeled base, the spray unit on top. */
export function cryoCanister(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  k.cyl(p, 0.22, 0.22, 0.04, m.darkPlastic, 0, 0.06, 0, 20)
  for (let i = 0; i < 4; i++) castor(e, p, Math.cos(i * PI / 2 + 0.7) * 0.18, Math.sin(i * PI / 2 + 0.7) * 0.18, 0.03)
  put(p, lathe(e, 'dewar', [[0, 0.08], [0.17, 0.08], [0.2, 0.2], [0.2, 0.55], [0.13, 0.68], [0.05, 0.7], [0, 0.7]], 24), m.aluminium)
  k.cyl(p, 0.04, 0.04, 0.08, m.chrome, 0, 0.74, 0, 14)
  k.soft(p, 0.06, 0.12, 0.08, 0.02, m.blue, 0.05, 0.84, 0)
  rod(e, p, 0.006, 0.12, m.chrome, 0.12, 0.88, 0, 'x', 8)
}

/** A radiofrequency cautery unit on its trolley: the generator with its displays, the pencil and the footswitch. */
export function cauteryTrolley(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * 0.2, sz * 0.18, 0.04)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.cyl(p, 0.012, 0.012, 0.76, m.chrome, sx * 0.21, 0.46, sz * 0.19, 10)
  for (const y of [0.16, 0.5, 0.84]) k.box(p, 0.46, 0.015, 0.42, m.whitePlastic, 0, y, 0)
  k.soft(p, 0.36, 0.13, 0.32, 0.015, m.whitePlastic, 0, 0.915, 0)
  k.box(p, 0.24, 0.07, 0.004, e.o.screen('cautery', 128, 64, cauteryPaint), 0, 0.92, 0.161, false)
  for (let i = 0; i < 3; i++) k.cyl(p, 0.012, 0.012, 0.01, [m.sharps, m.blue, m.darkPlastic][i], -0.13 + i * 0.03, 0.88, 0.163, 10).rotation.x = PI / 2
  rod(e, p, 0.008, 0.16, m.sharps, 0.1, 0.99, 0.05, 'x', 8)
  k.soft(p, 0.22, 0.05, 0.14, 0.02, m.blue, 0, 0.025, 0.35)
}

/**
 * A gynaecological examination table: the base column and hood, the seat with its drainage
 * cut-out and stainless pan, the backrest raised, the two padded leg supports on their posts,
 * the paper roll at the head, the pull-out step. Along local x, the head at −x.
 */
export function gyneTable(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  k.soft(p, 1.2, 0.1, 0.5, 0.03, m.whitePlastic, 0, 0.05, 0)
  k.soft(p, 0.5, 0.45, 0.38, 0.04, m.whitePlastic, 0.05, 0.32, 0)
  k.soft(p, 0.62, 0.09, 0.6, 0.03, m.vinylSeat, 0.12, 0.66, 0)
  k.box(p, 0.16, 0.012, 0.3, m.stainless, 0.5, 0.6, 0, false)
  const back = group(p, -0.19, 0.68, 0)
  back.rotation.z = -0.62
  k.soft(back, 0.78, 0.09, 0.6, 0.03, m.vinylSeat, -0.39, 0, 0)
  k.soft(back, 0.2, 0.08, 0.36, 0.03, m.vinylSeat, -0.86, 0.04, 0)
  for (const s of [-1, 1]) {
    put(p, bentTube(e, 'stirrupPost', [[0.42, 0.62, s * 0.24], [0.62, 0.78, s * 0.34], [0.72, 1.02, s * 0.36]], 0.014, 0.06), m.chrome)
    const leg = k.soft(p, 0.36, 0.06, 0.13, 0.03, m.vinylSeat, 0.78, 1.06, s * 0.36)
    leg.rotation.z = 0.35
  }
  k.soft(p, 0.36, 0.06, 0.3, 0.02, m.whitePlastic, 0.62, 0.22, 0)
  put(p, lathe(e, 'gyneRoll', [[0, -0.27], [0.045, -0.27], [0.045, 0.27], [0, 0.27]], 16), m.paper, -0.95, 0.98, 0, false).rotation.x = PI / 2
  k.box(p, 0.5, 0.004, 0.52, m.paper, -0.5, 0.95, 0, false).rotation.z = -0.62
}

/** A paediatric examination couch, 1.5 m: a pastel blue mattress, a raised head section, side guard rails, the paper roll. Along local x. */
export function paedCouch(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  for (const s of [-1, 1]) put(p, bentTube(e, 'paedLeg', [[-0.65, 0.0, 0], [-0.65, 0.66, 0], [0.65, 0.66, 0], [0.65, 0.0, 0]], 0.02, 0.05), m.powder, 0, 0, s * 0.24)
  k.soft(p, 1.0, 0.08, 0.6, 0.03, m.blanket, 0.18, 0.7, 0)
  const head = group(p, -0.32, 0.7, 0)
  head.rotation.z = -0.25
  k.soft(head, 0.48, 0.08, 0.6, 0.03, m.blanket, -0.24, 0, 0)
  for (const s of [-1, 1]) put(p, bentTube(e, 'paedRail', [[-0.2, 0.74, 0], [-0.2, 0.92, 0], [0.5, 0.92, 0], [0.5, 0.74, 0]], 0.012, 0.04), m.chrome, 0, 0, s * 0.31)
  put(p, lathe(e, 'paedRoll', [[0, -0.26], [0.04, -0.26], [0.04, 0.26], [0, 0.26]], 16), m.paper, -0.74, 0.66, 0, false).rotation.x = PI / 2
}

/** A digital infant weighing scale: the curved tray on its platform and display, at (x, y, z) on a surface. */
export function infantScale(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.soft(g, 0.55, 0.06, 0.32, 0.02, m.whitePlastic, 0, 0.03, 0)
  k.box(g, 0.08, 0.03, 0.004, e.o.screen('infantKg', 64, 32, lcd(['3.42 kg'])), 0.18, 0.04, 0.162, false)
  const tray = k.soft(g, 0.52, 0.06, 0.28, 0.08, m.blanket, -0.02, 0.1, 0)
  tray.scale.set(1, 0.6, 1)
  return g
}

/** An infantometer: the measuring board with its fixed head piece and the sliding foot piece. */
export function infantometer(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.box(g, 0.9, 0.025, 0.3, m.whitePlastic, 0, 0.0125, 0)
  k.box(g, 0.86, 0.002, 0.02, e.o.sign('tape', 256, 16, (c, w, h) => {
    c.fillStyle = '#ffd23f'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#111'
    for (let i = 0; i < 90; i++) c.fillRect((i / 90) * w, 0, 1, i % 10 ? h * 0.4 : h)
  }), 0, 0.026, 0.12, false)
  k.box(g, 0.025, 0.16, 0.3, m.whitePlastic, -0.44, 0.08, 0)
  k.box(g, 0.025, 0.12, 0.28, m.blue, 0.2, 0.06, 0)
  return g
}

/** A compressor nebuliser: the box with its switch, tubing and a child's mask, at (x, y, z) on a surface. */
export function nebuliser(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.soft(g, 0.2, 0.1, 0.16, 0.02, m.whitePlastic, 0, 0.05, 0)
  k.box(g, 0.04, 0.02, 0.004, m.blue, 0.05, 0.07, 0.081, false)
  put(g, bentTube(e, 'nebTube', [[-0.08, 0.06, 0.08], [-0.12, 0.02, 0.15], [0.0, 0.01, 0.2], [0.12, 0.03, 0.14]], 0.004, 0.03), m.tubing, 0, 0, 0, false)
  k.soft(g, 0.07, 0.05, 0.06, 0.025, m.mask, 0.14, 0.04, 0.12)
  return g
}

/** A child's activity table, white laminate with rounded corners, and two low chairs. */
export function kidsTable(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  k.soft(p, 0.7, 0.025, 0.5, 0.06, m.hpl, 0, 0.5, 0)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.cyl(p, 0.02, 0.02, 0.49, m.powder, sx * 0.29, 0.245, sz * 0.19, 10)
  for (const s of [-1, 1]) {
    const c = group(p, s * 0.55, 0, 0, -s * PI / 2)
    k.soft(c, 0.3, 0.03, 0.3, 0.02, m.binBlue, 0, 0.3, 0)
    k.soft(c, 0.3, 0.25, 0.03, 0.02, m.binBlue, 0, 0.45, -0.14)
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.cyl(c, 0.012, 0.012, 0.29, m.powder, sx * 0.12, 0.145, sz * 0.12, 8)
  }
}

/** A low plastic toy crate in a corner: a few wooden blocks and a soft ball, kept tidy. */
export function toyCrate(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  k.box(p, 0.5, 0.3, 0.36, m.binBlue, 0, 0.15, 0)
  const cols: Material[] = [m.red, m.sharps, m.green, m.blue]
  for (let i = 0; i < 5; i++) k.box(p, 0.07, 0.07, 0.07, cols[i % 4], -0.15 + i * 0.07, 0.33, -0.05 + (i % 2) * 0.08, false).rotation.y = i * 0.4
  k.sphere(p, 0.07, m.red, 0.15, 0.36, 0.06)
}

/**
 * The ENT treatment unit, 1.2 m: a white cabinet with its worktop of instrument trays (specula,
 * tongue depressors, aural and nasal forceps), spray bottles, the suction jar and its vacuum, the
 * cold light source with its cable, warming lamp, two drawers and a door (operated), and the
 * endoscopy monitor on its arm.
 */
export function entUnit(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const w = 1.2
  const d = 0.55
  carcass(e, p, w, 0.85, d, m.whitePlastic, [0.4], 0.08, m.solidSurface)
  const fill = packs(e, [m.whitePlastic, m.blue, m.paper], [0.08, 0.04, 0.1])
  for (let i = 0; i < 2; i++) drawer(e, p, -w / 4, 0.74 - i * 0.2, 0, { w: w / 2 - 0.006, h: 0.19, d: d - 0.04, front: m.whitePlastic, handle: 'grip', label: 'ENT Unit Drawer', fill })
  cupboardDoor(e, p, w / 2 - 0.002, 0.46, 0, { w: w / 2 - 0.004, h: 0.75, hinge: 'right', face: m.whitePlastic, label: 'ENT Unit Cupboard', angle: 1.6 })
  carcass(e, group(p, -w / 4, 0, 0), w / 2 - 0.02, 0.36, d - 0.02, m.whitePlastic, [], 0.08)
  // Worktop: instrument trays in a stainless well, sprays, the warmer, the light source.
  k.box(p, 0.5, 0.03, 0.26, m.stainless, -0.3, 0.885, -0.22)
  for (let i = 0; i < 10; i++) k.box(p, 0.008, 0.006, 0.18, m.chrome, -0.5 + i * 0.045, 0.904, -0.22, false)
  for (let i = 0; i < 3; i++) {
    k.cyl(p, 0.025, 0.025, 0.14, [m.whitePlastic, m.amber, m.clearPlastic][i], 0.05 + i * 0.07, 0.95, -0.35, 12)
    k.cyl(p, 0.008, 0.008, 0.04, m.black, 0.05 + i * 0.07, 1.04, -0.35, 8)
  }
  k.soft(p, 0.26, 0.12, 0.22, 0.015, m.darkPlastic, 0.4, 0.94, -0.3)
  k.box(p, 0.16, 0.04, 0.004, e.o.screen('ledSource', 96, 24, lcd(['LED 80%'])), 0.4, 0.96, -0.189, false)
  put(p, bentTube(e, 'lightCable', [[0.4, 0.95, -0.19], [0.45, 0.8, -0.05], [0.55, 0.95, 0.05]], 0.006, 0.05), m.charcoal)
  // Suction: the jar on the side, the tubing to the tip holder.
  k.cyl(p, 0.07, 0.07, 0.2, m.clearPlastic, w / 2 + 0.08, 0.74, -0.15, 16)
  k.cyl(p, 0.072, 0.072, 0.03, m.blue, w / 2 + 0.08, 0.86, -0.15, 16)
  k.box(p, 0.08, 0.02, 0.14, m.stainless, w / 2 + 0.05, 0.62, -0.15)
  // The monitor on its arm.
  put(p, bentTube(e, 'entArm', [[-0.5, 0.9, -0.45], [-0.5, 1.45, -0.45], [-0.45, 1.5, -0.3]], 0.018, 0.06), m.whitePlastic)
  const s = group(p, -0.42, 1.55, -0.24, 0.3)
  k.box(s, 0.5, 0.31, 0.04, m.black, 0, 0, 0)
  face(e, s, 0.47, 0.28, e.o.screen('entScope', 320, 192, scopePaint), 0, 0, 0.021)
}

/**
 * A motorised ENT examination chair: the round base and lift column, the upholstered seat and
 * back, the adjustable headrest, armrests and the fold-down footrest; it faces +z.
 */
export function entChair(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  k.cyl(p, 0.32, 0.34, 0.06, m.whitePlastic, 0, 0.03, 0, 24)
  k.cyl(p, 0.09, 0.1, 0.36, m.whitePlastic, 0, 0.24, 0, 20)
  k.soft(p, 0.5, 0.1, 0.5, 0.04, m.vinylSeat, 0, 0.47, 0.02)
  const back = k.soft(p, 0.5, 0.62, 0.1, 0.04, m.vinylSeat, 0, 0.84, -0.24)
  back.rotation.x = -0.12
  k.soft(p, 0.26, 0.16, 0.08, 0.04, m.vinylSeat, 0, 1.25, -0.3)
  rod(e, p, 0.014, 0.12, m.chrome, 0, 1.13, -0.31, 'z', 8).rotation.x = 0
  for (const s of [-1, 1]) {
    k.soft(p, 0.07, 0.05, 0.38, 0.02, m.vinylSeat, s * 0.3, 0.66, 0.0)
    k.box(p, 0.03, 0.18, 0.03, m.chrome, s * 0.3, 0.56, -0.12)
  }
  const foot = k.soft(p, 0.44, 0.04, 0.22, 0.015, m.darkPlastic, 0, 0.18, 0.42)
  foot.rotation.x = 0.2
  k.box(p, 0.3, 0.3, 0.04, m.whitePlastic, 0, 0.3, 0.3).rotation.x = -0.6
  k.soft(p, 0.16, 0.03, 0.1, 0.01, m.darkPlastic, 0.3, 0.02, 0.4)
}

/* ---------- records and staff ---------- */

/**
 * Mobile compactor shelving: `n` carriages on floor rails, each a double-sided steel shelving
 * unit `len` long (along local z) and 2.2 m high, full of patient files, with its three-spoke
 * hand wheel on the aisle end (+z); one aisle opened at `gap`.
 */
export function compactor(e: OpdCtx, p: Object3D, n: number, len: number, gap: number) {
  const { k, m } = e
  const dep = 0.6
  const total = n * dep + 0.85
  for (let i = 0; i < 4; i++) k.box(p, total, 0.01, 0.06, m.galvanised, total / 2 - dep / 2, 0.005, -len / 2 + 0.3 + (i * (len - 0.6)) / 3, false)
  let x = 0
  for (let i = 0; i < n; i++) {
    if (i === gap) x += 0.85
    const g = group(p, x, 0, 0)
    k.box(g, dep, 0.12, len, m.powder, 0, 0.08, 0)
    for (const s of [-1, 1]) k.box(g, dep, 2.1, 0.03, e.o.frame, 0, 1.17, s * (len / 2 - 0.015))
    k.box(g, 0.012, 2.1, len, e.o.frame, 0, 1.17, 0)
    k.box(g, dep, 0.02, len, e.o.frame, 0, 2.23, 0)
    for (let j = 0; j < 6; j++) {
      const y = 0.16 + j * 0.34
      k.box(g, dep, 0.012, len - 0.04, e.o.frame, 0, y, 0)
      // Files on both faces, their coloured spines out.
      for (const s of [-1, 1]) {
        const files = k.box(g, 0.26, 0.28, len - 0.1, [m.vacuum, m.blue, m.paper, m.green][(i + j) % 4], s * 0.15, y + 0.15, 0, false)
        files.scale.set(1, 0.92 + ((i * 7 + j * 3) % 5) * 0.015, 1)
      }
    }
    // The end panel's hand wheel.
    const hub = k.cyl(g, 0.04, 0.04, 0.05, m.chrome, 0, 1.1, len / 2 + 0.03, 14)
    hub.rotation.x = PI / 2
    for (let s = 0; s < 3; s++) {
      const a = (s * 2 * PI) / 3
      const spoke = rod(e, g, 0.008, 0.18, m.chrome, Math.cos(a) * 0.09, 1.1 + Math.sin(a) * 0.09, len / 2 + 0.06, 'x', 8)
      spoke.rotation.set(0, 0, a)
      k.sphere(g, 0.018, m.black, Math.cos(a) * 0.18, 1.1 + Math.sin(a) * 0.18, len / 2 + 0.07)
    }
    k.box(g, 0.2, 0.08, 0.004, e.o.sign(`compactorLabel${i}`, 128, 48, (c, w, h) => {
      c.fillStyle = '#ffffff'
      c.fillRect(0, 0, w, h)
      c.fillStyle = '#1c3966'
      c.font = SANS(h * 0.55, 700)
      c.fillText(`OPD ${2026 - (i % 3)} · ${String.fromCharCode(65 + i * 3)}–${String.fromCharCode(67 + i * 3)}`, 6, h * 0.7)
    }), 0, 1.6, len / 2 + 0.002, false)
    x += dep
  }
}

/** A flatbed document scanner, at (x, y, z) on a desk. */
export function scanner(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.soft(g, 0.3, 0.12, 0.2, 0.02, m.darkPlastic, 0, 0.06, 0)
  k.box(g, 0.24, 0.08, 0.004, m.paper, 0, 0.16, -0.06, false).rotation.x = -0.4
  k.box(g, 0.26, 0.006, 0.12, m.greyPlastic, 0, 0.03, 0.14, false)
  return g
}

/** A file trolley: a two-tier powder-coated cart of patient files on castors. */
export function fileTrolley(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    castor(e, p, sx * 0.3, sz * 0.18, 0.04)
    k.cyl(p, 0.012, 0.012, 0.82, m.powder, sx * 0.32, 0.5, sz * 0.2, 8)
  }
  for (const y of [0.25, 0.75]) {
    k.box(p, 0.68, 0.015, 0.44, m.powder, 0, y, 0)
    for (let i = 0; i < 14; i++) k.box(p, 0.03, 0.26, 0.32, [m.vacuum, m.blue, m.paper][i % 3], -0.3 + i * 0.045, y + 0.14, 0, false)
  }
  put(p, bentTube(e, 'ftHandle', [[-0.32, 0.9, -0.2], [-0.32, 1.0, -0.2], [-0.32, 1.0, 0.2], [-0.32, 0.9, 0.2]], 0.012, 0.04), m.chrome)
}

/** A three-seater staff sofa in charcoal fabric on a slim metal base, facing +z. */
export function sofa(e: OpdCtx, p: Object3D, len = 1.9) {
  const { k, m } = e
  k.box(p, len, 0.06, 0.8, m.powder, 0, 0.09, 0)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(p, 0.04, 0.08, 0.04, m.chrome, sx * (len / 2 - 0.08), 0.04, sz * 0.32)
  const n = Math.round(len / 0.62)
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + 0.12 + ((i + 0.5) * (len - 0.24)) / n
    k.soft(p, (len - 0.24) / n - 0.01, 0.16, 0.58, 0.05, m.fabric, x, 0.24, 0.08)
    const b = k.soft(p, (len - 0.24) / n - 0.01, 0.42, 0.16, 0.06, m.fabric, x, 0.52, -0.3)
    b.rotation.x = -0.12
  }
  for (const s of [-1, 1]) k.soft(p, 0.12, 0.42, 0.8, 0.04, m.fabric, s * (len / 2 - 0.06), 0.33, 0)
  k.box(p, len - 0.24, 0.18, 0.12, m.fabric, 0, 0.25, -0.36)
}

/** A low coffee table, oak top on powder-coated legs, with a few journals. */
export function coffeeTable(e: OpdCtx, p: Object3D, w = 1.0, d = 0.55) {
  const { k, m } = e
  k.box(p, w, 0.025, d, e.o.oak, 0, 0.42, 0)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(p, 0.03, 0.41, 0.03, m.powder, sx * (w / 2 - 0.05), 0.205, sz * (d / 2 - 0.05))
  for (let i = 0; i < 3; i++) k.box(p, 0.21, 0.006, 0.28, [m.paper, m.blue, m.whitePlastic][i], -0.2 + i * 0.03, 0.436 + i * 0.006, 0.02 * i, false).rotation.y = 0.2 * i
}

/** An electric kettle and two mugs, at (x, y, z) on a counter. */
export function kettle(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.cyl(g, 0.09, 0.09, 0.02, m.darkPlastic, 0, 0.01, 0, 18)
  put(g, lathe(e, 'kettle', [[0, 0.02], [0.08, 0.02], [0.085, 0.12], [0.07, 0.22], [0, 0.23]], 20), m.stainless)
  k.box(g, 0.03, 0.14, 0.04, m.black, -0.09, 0.15, 0)
  for (const [dx, mat] of [[0.18, m.whitePlastic], [0.26, m.blue]] as const) k.cyl(g, 0.04, 0.035, 0.1, mat, dx, 0.05, 0.04, 16)
  return g
}

/** A coat stand: a weighted base, the pole and its hooks, a white coat hanging from one. */
export function coatStand(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  k.cyl(p, 0.2, 0.22, 0.03, m.powder, 0, 0.015, 0, 20)
  k.cyl(p, 0.02, 0.02, 1.75, m.powder, 0, 0.9, 0, 10)
  for (let i = 0; i < 4; i++) rod(e, p, 0.008, 0.16, m.chrome, Math.cos(i * PI / 2) * 0.07, 1.72, Math.sin(i * PI / 2) * 0.07, 'x', 6).rotation.y = i * PI / 2
  k.soft(p, 0.44, 0.95, 0.14, 0.06, m.sheet, 0.0, 1.22, 0.12)
}

/** A token-calling keypad with its small display, at (x, y, z) on a counter. */
export function tokenCaller(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  const b = k.soft(g, 0.16, 0.04, 0.12, 0.01, m.darkPlastic, 0, 0.02, 0)
  b.rotation.x = 0.2
  k.box(g, 0.1, 0.002, 0.03, e.o.screen('caller', 64, 24, lcd(['A-117'])), 0, 0.046, -0.03, false)
  for (let i = 0; i < 6; i++) k.box(g, 0.025, 0.004, 0.018, m.greyPlastic, -0.04 + (i % 3) * 0.04, 0.045, 0.01 + Math.floor(i / 3) * 0.025, false)
  return g
}

/** ECG electrodes and the patient cable's clips laid ready on a couch's foot, at (x, y, z). */
export function electrodes(e: OpdCtx, p: Object3D, x: number, y: number, z: number) {
  const { k, m } = e
  const g = group(p, x, y, z)
  for (let i = 0; i < 10; i++) {
    const a = i * 0.6
    k.cyl(g, 0.012, 0.012, 0.004, i < 6 ? m.whitePlastic : m.paper, Math.cos(a) * 0.08 * (1 + i * 0.05), 0.003, Math.sin(a) * 0.06, 12)
  }
  k.box(g, 0.1, 0.01, 0.07, m.paper, -0.12, 0.006, 0.05, false)
  return g
}

/** Re-exported for the fitters. */
export { carcass }
