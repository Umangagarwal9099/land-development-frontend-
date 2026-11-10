import { DoubleSide, MeshStandardMaterial, PlaneGeometry, type Material, type Object3D } from 'three'
import { PI } from '../../../kit'
import { rng, type Paint } from '../../../textures'
import { bentTube, carcass, castor, cupboardDoor, drawer, face, geo, group, lathe, panel, pillow, put } from '../../erKit'
import { cushion, pedestal } from '../../erFurniture'
import type { OpdCtx } from '../../opd/ctx'
import { itemMats } from '../../opd/equipment/items'
import { SANS } from '../../opd/paints'
import { computer, deskPhone } from '../../opd/smalls'
import { kitMats } from '../kit'

/*
 * The international patient wing's furniture, as such suites and lounges are fitted: a clinical
 * recliner for the patient (castored, its back and leg rest reclining), an attendant's sofa-cum-
 * bed, club chairs and a lounge sofa in a woven boucle, walnut casegoods with quartz tops (a
 * bedside cabinet, a credenza holding the minibar), floor and table lamps that glow, framed
 * artwork, a concierge desk with its world clocks and flags of the countries most patients come
 * from, a bean-to-cup coffee machine on a refreshment counter. Front +z, standing on y = 0.
 */

const cache = new WeakMap<object, ReturnType<typeof make>>()

function make(e: OpdCtx) {
  const std = (color: string, roughness: number, metalness = 0) => new MeshStandardMaterial({ color, roughness, metalness })
  const glow = (color: string, emissive: string, intensity: number, side = false) => e.lighting.glow(new MeshStandardMaterial({ color, emissive, emissiveIntensity: intensity, roughness: 0.8, side: side ? DoubleSide : undefined }), 0.25)
  return {
    /** Upholstery: an oatmeal boucle, a warm taupe, a deep teal velvet; the recliner's wipe-clean vinyl. */
    boucle: std('#d5cbbb', 1),
    taupe: std('#8c7c6c', 0.95),
    teal: std('#2f5a5e', 0.85),
    vinyl: std('#6f645b', 0.55),
    /** Quartz tops, brushed bronze trims, black powder-coat. */
    quartz: new MeshStandardMaterial({ map: e.k.tex.finish('marble', 1, 1), color: '#f2f0ec', roughness: 0.25 }),
    bronze: std('#8a6a45', 0.35, 0.75),
    black: std('#1d1d1f', 0.45, 0.2),
    glossBlack: std('#0e0f11', 0.18, 0.2),
    /** A lamp's shade lit from within, and its bulb. */
    shade: glow('#efe4cf', '#ffd9a3', 0.55, true),
    bulb: glow('#fff3dc', '#ffe2b0', 2.2),
    /** Linen for a made-up attendant bed, a throw. */
    throwRust: std('#a5643f', 1),
    cream: std('#eee8dc', 1),
  }
}

/** The wing's own finishes, made once per model. */
export function intlMats(e: OpdCtx) {
  let c = cache.get(e.m)
  if (!c) cache.set(e.m, (c = make(e)))
  return c
}

/* ---------- seating ---------- */

/**
 * A clinical recliner for the patient (after the high-back day chairs on ward and suite): a
 * steel chassis on four 100 mm castors (the rear braked), walnut-laminate side shrouds carrying
 * padded arms, a welted seat, the high back reclined on its gas strut with a headrest cushion,
 * the leg rest folded under the seat, the push handle and release lever behind. Faces +z.
 */
export function recliner(e: OpdCtx, p: Object3D, cover?: Material) {
  const { k, m } = e
  const c = intlMats(e)
  const w = kitMats(e)
  const up = cover ?? c.vinyl
  for (const [x, z, b] of [[-0.24, -0.27, true], [0.24, -0.27, true], [-0.24, 0.25, false], [0.24, 0.25, false]] as const) castor(e, p, x, z, 0.05, 0.3 * x, b)
  k.soft(p, 0.56, 0.06, 0.6, 0.02, w.frame, 0, 0.14, -0.01)
  for (const s of [-1, 1]) {
    put(p, panel(e, 0.62, 0.4, 0.04, 0.06), w.walnut, s * 0.31, 0.38, 0.0).rotation.y = PI / 2
    k.soft(p, 0.1, 0.07, 0.62, 0.03, up, s * 0.31, 0.615, 0.01)
  }
  cushion(e, p, 0.5, 0.13, 0.54, up, 0, 0.47, 0.03)
  const back = group(p, 0, 0.5, -0.24)
  back.rotation.x = -0.32
  k.soft(back, 0.52, 0.74, 0.14, 0.05, up, 0, 0.37, -0.04)
  cushion(e, back, 0.4, 0.18, 0.1, up, 0, 0.7, 0.04, { welt: 'top', r: 0.04 })
  for (let i = 0; i < 3; i++) k.box(back, 0.44, 0.006, 0.004, w.absDark, 0, 0.15 + i * 0.18, 0.031, false)
  put(back, bentTube(e, 'rcHandle', [[-0.2, 0, 0], [-0.2, 0.05, -0.06], [0.2, 0.05, -0.06], [0.2, 0, 0]], 0.012, 0.03), w.frame, 0, 0.74, -0.1)
  // The leg rest folded down under the seat's front.
  const leg = group(p, 0, 0.42, 0.3)
  leg.rotation.x = 0.18
  k.soft(leg, 0.46, 0.3, 0.06, 0.025, up, 0, -0.15, 0)
  k.box(p, 0.03, 0.12, 0.02, m.black, 0.33, 0.52, -0.2)
}

/**
 * An attendant's sofa-cum-bed, `len` long: a walnut plinth on recessed feet, the seat platform
 * with two welted cushions (they pull out to sleep on), loose back cushions, padded arms with
 * walnut caps; a pillow and a folded blanket waiting at one end. Faces +z, 0.88 deep.
 */
export function sofaBed(e: OpdCtx, p: Object3D, len = 1.8, cover?: Material, made = true) {
  const { k, m } = e
  const c = intlMats(e)
  const w = kitMats(e)
  const up = cover ?? c.taupe
  k.box(p, len - 0.1, 0.05, 0.78, m.black, 0, 0.025, 0)
  k.box(p, len, 0.14, 0.86, w.walnut, 0, 0.12, 0)
  k.soft(p, len - 0.3, 0.2, 0.64, 0.03, up, 0, 0.29, 0.07)
  const n = 2
  const cw = (len - 0.3) / n
  for (let i = 0; i < n; i++) cushion(e, p, cw - 0.01, 0.14, 0.62, up, -len / 2 + 0.15 + cw * (i + 0.5), 0.46, 0.09)
  k.soft(p, len - 0.02, 0.42, 0.16, 0.05, up, 0, 0.45, -0.35)
  for (let i = 0; i < n; i++) {
    const b = group(p, -len / 2 + 0.15 + cw * (i + 0.5), 0.56, -0.2)
    b.rotation.x = -0.18
    cushion(e, b, cw - 0.03, 0.4, 0.16, up, 0, 0.12, 0, { welt: 'both', r: 0.05 })
  }
  for (const s of [-1, 1]) {
    k.soft(p, 0.15, 0.42, 0.86, 0.05, up, s * (len / 2 - 0.075), 0.4, 0)
    k.soft(p, 0.15, 0.025, 0.86, 0.008, w.walnut, s * (len / 2 - 0.075), 0.625, 0)
  }
  if (!made) return
  // Pillow and folded blanket at the right-hand end.
  put(p, pillow(e, 0.5, 0.12, 0.34), c.cream, len / 2 - 0.45, 0.6, -0.05).rotation.set(-0.5, 0.1, 0)
  for (let i = 0; i < 3; i++) k.soft(p, 0.42, 0.03, 0.3, 0.012, i === 1 ? c.cream : c.throwRust, -len / 2 + 0.45, 0.545 + i * 0.03, 0.15)
}

/**
 * A club chair: four turned and tapered walnut legs, an upholstered shell (seat base, rounded
 * arms and a gently raked back in one), a welted seat cushion and a lumbar cushion. Faces +z.
 */
export function clubChair(e: OpdCtx, p: Object3D, cover?: Material) {
  const { k } = e
  const c = intlMats(e)
  const w = kitMats(e)
  const up = cover ?? c.boucle
  const leg = lathe(e, 'ccLeg', [[0, 0], [0.014, 0], [0.022, 0.16], [0.024, 0.18], [0, 0.18]], 14)
  for (const [x, z] of [[-0.3, -0.28], [0.3, -0.28], [-0.3, 0.28], [0.3, 0.28]]) put(p, leg, w.walnut, x, 0, z)
  k.soft(p, 0.74, 0.16, 0.7, 0.05, up, 0, 0.26, 0)
  for (const s of [-1, 1]) k.soft(p, 0.13, 0.32, 0.7, 0.06, up, s * 0.305, 0.5, 0)
  const back = group(p, 0, 0.34, -0.29)
  back.rotation.x = -0.16
  k.soft(back, 0.74, 0.46, 0.14, 0.06, up, 0, 0.23, 0)
  cushion(e, p, 0.48, 0.12, 0.54, up, 0, 0.4, 0.07, { welt: 'top', r: 0.04 })
  k.soft(p, 0.36, 0.18, 0.1, 0.05, c.teal, 0.04, 0.55, -0.16).rotation.x = -0.2
}

/** A dining chair: tapered walnut legs, an upholstered seat and a curved upholstered back. Faces +z. */
export function diningChair(e: OpdCtx, p: Object3D, cover?: Material) {
  const { k } = e
  const c = intlMats(e)
  const w = kitMats(e)
  const up = cover ?? c.teal
  const leg = lathe(e, 'dcLeg', [[0, 0], [0.012, 0], [0.018, 0.44], [0, 0.44]], 12)
  for (const [x, z] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) put(p, leg, w.walnut, x, 0, z)
  cushion(e, p, 0.46, 0.07, 0.46, up, 0, 0.475, 0)
  for (const s of [-1, 1]) k.box(p, 0.03, 0.42, 0.03, w.walnut, s * 0.19, 0.68, -0.2).rotation.x = -0.1
  const b = group(p, 0, 0.72, -0.22)
  b.rotation.x = -0.12
  k.soft(b, 0.44, 0.3, 0.06, 0.025, up, 0, 0.0, 0)
}

/* ---------- tables, casegoods ---------- */

/** A round pedestal table, `d` across, top at `h`: walnut top, a bronze column on a weighted disc. */
export function pedestalTable(e: OpdCtx, p: Object3D, d = 0.8, h = 0.74) {
  const { k } = e
  if (d < 0.3) return
  const c = intlMats(e)
  const w = kitMats(e)
  k.cyl(p, d / 2, d / 2, 0.03, w.walnut, 0, h - 0.015, 0, 40)
  const b = Math.min(0.22, d * 0.35)
  put(p, lathe(e, `ptCol${h}|${b}`, [[0, 0], [b, 0], [b, 0.02], [0.05, 0.04], [0.035, 0.08], [0.035, h - 0.06], [0.08, h - 0.035], [0, h - 0.03]], 28), c.bronze)
}

/**
 * A walnut bedside cabinet for a suite, 0.5 × 0.62 × 0.45 m: a quartz top with a raised back
 * edge, a drawer (operated) over a cupboard (operated), on hidden castors; a carafe and glass
 * on it.
 */
export function bedsideCabinet(e: OpdCtx, p: Object3D) {
  const { k } = e
  const c = intlMats(e)
  const w = kitMats(e)
  const t = itemMats(e)
  for (const [x, z] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.15], [0.19, 0.15]]) castor(e, p, x, z, 0.025)
  const g = group(p, 0, 0.05, 0.225)
  carcass(e, g, 0.5, 0.57, 0.45, w.walnut, [0.28], 0.02, c.quartz)
  k.box(g, 0.5, 0.05, 0.02, c.quartz, 0, 0.62, -0.44)
  drawer(e, g, 0, 0.48, 0, { w: 0.49, h: 0.16, d: 0.42, front: w.walnut, handle: 'bar', label: 'Bedside Drawer' })
  cupboardDoor(e, g, -0.245, 0.215, 0, { w: 0.49, h: 0.35, hinge: 'left', face: w.walnut, label: 'Bedside Cupboard' })
  put(p, lathe(e, 'carafe', [[0, 0], [0.042, 0], [0.045, 0.1], [0.03, 0.16], [0.022, 0.2], [0.026, 0.22], [0, 0.22]], 20), t.glass, -0.12, 0.646, 0.05)
  put(p, lathe(e, 'carafeWater', [[0, 0.004], [0.04, 0.004], [0.043, 0.09], [0, 0.09]], 18), t.saline, -0.12, 0.646, 0.05)
  put(p, lathe(e, 'tumbler', [[0, 0], [0.03, 0], [0.034, 0.1], [0.031, 0.1], [0.027, 0.006], [0, 0.006]], 18), t.glass, -0.01, 0.646, 0.08)
}

/**
 * A low walnut credenza, `len` long and 0.45 deep, its top quartz at 0.76 m: with `minibar`, a
 * compact minibar fridge behind a tinted glass door at the left (bottles and cans inside, its
 * interior lit), drawers to its right; on top a tray with an electric kettle, cups and bottled
 * water.
 */
export function credenza(e: OpdCtx, p: Object3D, len: number, minibar = true) {
  const { k, m } = e
  const c = intlMats(e)
  const w = kitMats(e)
  const t = itemMats(e)
  const g = group(p, 0, 0, 0.45)
  carcass(e, g, len, 0.72, 0.45, w.walnut, [], 0.06, c.quartz)
  const mb = minibar ? 0.5 : 0
  if (minibar) {
    // The fridge's black liner and its shelves of drinks, the light at the top, the glass door.
    const x0 = -len / 2 + 0.02 + mb / 2
    k.box(g, mb - 0.02, 0.6, 0.4, c.glossBlack, x0, 0.39, -0.23)
    k.box(g, mb - 0.06, 0.008, 0.36, e.o.cove, x0, 0.66, -0.23, false)
    for (const [y, n] of [[0.12, 5], [0.38, 4]] as const) {
      k.box(g, mb - 0.06, 0.008, 0.34, t.clear, x0, y, -0.23, false)
      for (let i = 0; i < n; i++) {
        const x = x0 - (mb - 0.14) / 2 + (i * (mb - 0.14)) / (n - 1)
        if (y < 0.2) put(g, lathe(e, 'mbBottle', [[0, 0], [0.032, 0], [0.032, 0.17], [0.012, 0.21], [0.012, 0.235], [0, 0.235]], 16), i % 2 ? t.clear : m.green, x, y + 0.005, -0.12)
        else k.cyl(g, 0.033, 0.033, 0.12, [m.red, c.bronze, m.blue, m.whitePlastic][i], x, y + 0.065, -0.13, 18)
      }
    }
    cupboardDoor(e, g, -len / 2 + 0.02, 0.39, 0, { w: mb - 0.004, h: 0.6, hinge: 'left', face: c.glossBlack, glass: true, label: 'Minibar', angle: 1.6 })
  }
  // Drawers across the rest.
  const dx0 = -len / 2 + 0.02 + mb
  const dw = len - 0.04 - mb
  const nd = Math.max(1, Math.round(dw / 0.6))
  for (let i = 0; i < nd; i++) for (let j = 0; j < 2; j++) drawer(e, g, dx0 + (i + 0.5) * (dw / nd), 0.54 - j * 0.31, 0, { w: dw / nd - 0.006, h: 0.3, d: 0.4, front: w.walnut, handle: 'bar', label: 'Drawer' })
  // The tray on top: kettle, cups and saucers, two bottles of water.
  const tray = group(p, len / 2 - 0.35, 0.735, 0.22)
  k.soft(tray, 0.42, 0.02, 0.3, 0.008, w.walnut, 0, 0.01, 0)
  put(tray, lathe(e, 'ctKettle', [[0, 0], [0.075, 0], [0.08, 0.04], [0.078, 0.16], [0.06, 0.2], [0.02, 0.21], [0, 0.21]], 24), m.stainless, -0.1, 0.02, 0)
  put(tray, bentTube(e, 'ctKettleH', [[-0.065, 0.18, 0], [-0.11, 0.16, 0], [-0.11, 0.06, 0], [-0.075, 0.04, 0]], 0.011, 0.03), c.black, -0.1, 0.02, 0)
  for (const [x, z] of [[0.07, -0.07], [0.15, 0.06]]) {
    k.cyl(tray, 0.06, 0.055, 0.008, m.whitePlastic, x, 0.024, z, 20)
    put(tray, lathe(e, 'ctCup', [[0, 0], [0.03, 0], [0.042, 0.06], [0.039, 0.062], [0.027, 0.006], [0, 0.006]], 18), m.whitePlastic, x, 0.028, z)
  }
  for (const x of [0.06, 0.14]) put(tray, lathe(e, 'ctWater', [[0, 0], [0.032, 0], [0.032, 0.18], [0.014, 0.21], [0.014, 0.24], [0, 0.24]], 16), t.clear, x - 0.28, 0.02, -0.25)
}

/* ---------- lamps and art ---------- */

/** A floor lamp: a weighted bronze base, slim stem, a linen drum shade lit from within. */
export function floorLamp(e: OpdCtx, p: Object3D, h = 1.55) {
  const { k } = e
  const c = intlMats(e)
  put(p, lathe(e, 'flBase', [[0, 0], [0.16, 0], [0.165, 0.012], [0.14, 0.03], [0, 0.035]], 28), c.bronze)
  k.cyl(p, 0.011, 0.011, h - 0.25, c.bronze, 0, (h - 0.25) / 2 + 0.03, 0, 12)
  put(p, lathe(e, `flShade${h}`, [[0.2, 0], [0.205, 0], [0.18, 0.32], [0.175, 0.32]], 36), c.shade, 0, h - 0.32, 0)
  k.sphere(p, 0.035, c.bulb, 0, h - 0.18, 0)
  put(p, lathe(e, 'flHarp', [[0, 0], [0.012, 0], [0.012, 0.03], [0, 0.03]], 10), c.bronze, 0, h - 0.24, 0)
}

/** A table lamp: a turned ceramic base and a linen drum shade lit from within. */
export function tableLamp(e: OpdCtx, p: Object3D, glaze?: Material) {
  const c = intlMats(e)
  put(p, lathe(e, 'tlBase', [[0, 0], [0.06, 0], [0.085, 0.08], [0.08, 0.18], [0.03, 0.27], [0.012, 0.3], [0, 0.3]], 28), glaze ?? c.teal)
  put(p, lathe(e, 'tlShade', [[0.15, 0], [0.153, 0], [0.12, 0.2], [0.117, 0.2]], 32), c.shade, 0, 0.3, 0)
  e.k.sphere(p, 0.025, c.bulb, 0, 0.36, 0)
}

const PALETTES = [
  ['#e9dcc4', '#c9a27a', '#8d6b4f', '#4f5d58', '#d7b46a'],
  ['#dfe6e6', '#9db7b8', '#5d8086', '#2f4b52', '#e2c08d'],
  ['#efe3d3', '#d39a76', '#a35f45', '#5c3b32', '#f0cf8a'],
  ['#e6e1d6', '#b6b48e', '#7d8460', '#465040', '#d9b86a'],
]

/** A calm abstract landscape: a washed sky, layered hills, a low sun, brushed texture. */
export const landscape = (seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  const pal = PALETTES[seed % PALETTES.length]
  const sky = g.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, pal[0])
  sky.addColorStop(0.6, pal[1])
  g.fillStyle = sky
  g.fillRect(0, 0, w, h)
  g.globalAlpha = 0.85
  g.fillStyle = pal[4]
  g.beginPath()
  g.arc(w * (0.25 + r() * 0.5), h * (0.3 + r() * 0.15), h * 0.09, 0, PI * 2)
  g.fill()
  for (let layer = 0; layer < 4; layer++) {
    g.globalAlpha = 0.55 + layer * 0.12
    g.fillStyle = pal[Math.min(3, 1 + layer)]
    const base = h * (0.5 + layer * 0.12)
    g.beginPath()
    g.moveTo(0, h)
    for (let x = 0; x <= w; x += w / 40) g.lineTo(x, base - Math.sin((x / w) * PI * (1.2 + layer * 0.7) + r() * 0.3 + seed) * h * 0.06 - r() * h * 0.015)
    g.lineTo(w, h)
    g.fill()
  }
  // Brush texture: short translucent strokes.
  for (let i = 0; i < 260; i++) {
    g.globalAlpha = 0.05 + r() * 0.08
    g.strokeStyle = r() > 0.5 ? '#ffffff' : '#000000'
    g.lineWidth = 1 + r() * 3
    const x = r() * w
    const y = r() * h
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + (r() - 0.5) * w * 0.12, y + (r() - 0.5) * h * 0.02)
    g.stroke()
  }
  g.globalAlpha = 1
}

/**
 * Framed artwork on a wall (z = 0), w × h centred at y: a slim walnut frame, a white mat, the
 * print behind glass.
 */
export function artwork(e: OpdCtx, p: Object3D, w: number, h: number, seed: number, y = 1.55) {
  const { k, m } = e
  const wm = kitMats(e)
  const t = itemMats(e)
  const f = 0.03
  for (const s of [-1, 1]) {
    k.box(p, w + 2 * f, f, 0.035, wm.walnut, 0, y + s * (h / 2 + f / 2), 0.0175)
    k.box(p, f, h, 0.035, wm.walnut, s * (w / 2 + f / 2), y, 0.0175)
  }
  k.box(p, w, h, 0.01, m.paper, 0, y, 0.008)
  const mat = e.o.sign(`art_${seed}_${w.toFixed(2)}x${h.toFixed(2)}`, 512, Math.round((512 * h) / w), landscape(seed), 0.7)
  face(e, p, w - 0.12, h - 0.12, mat, 0, y, 0.0135)
  k.box(p, w, h, 0.002, t.glass, 0, y, 0.03, false)
}

/** A box of facial tissues, one drawn up through its slot. */
export function tissueBox(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k } = e
  const c = intlMats(e)
  const g = group(p, x, y, z, ry)
  k.soft(g, 0.24, 0.085, 0.125, 0.008, c.teal, 0, 0.0425, 0)
  k.box(g, 0.13, 0.002, 0.04, e.m.black, 0, 0.086, 0, false)
  put(g, pillow(e, 0.08, 0.06, 0.05), c.cream, 0, 0.11, 0)
}

/* ---------- the concierge ---------- */

/**
 * The international patient desk, `len` long: a fluted walnut front under a raised quartz
 * transaction top with a lit reveal, closed ends, the 0.75 m work surface behind with drawer
 * pedestals; two workstations facing the staff side (−z), a phone, a document scanner, a
 * brochure holder and table flags on the counter. The public side is +z; 0.9 m deep.
 */
export function conciergeDesk(e: OpdCtx, p: Object3D, len: number, screens: [Material, Material]) {
  const { k, m } = e
  const c = intlMats(e)
  const front = e.k.fluted('flutedWalnut', len)
  k.box(p, len, 1.02, 0.05, front, 0, 0.53, 0.38)
  k.box(p, len, 0.08, 0.04, c.black, 0, 0.04, 0.37)
  k.soft(p, len + 0.04, 0.04, 0.34, 0.01, c.quartz, 0, 1.06, 0.3)
  k.box(p, len - 0.08, 0.008, 0.01, m.ledLine, 0, 1.035, 0.405, false)
  for (const s of [-1, 1]) k.soft(p, 0.05, 1.04, 0.86, 0.015, kitMats(e).walnut, s * (len / 2 - 0.025), 0.52, -0.02)
  k.soft(p, len - 0.06, 0.03, 0.62, 0.01, m.solidSurface, 0, 0.75, -0.12)
  k.box(p, len - 0.1, 0.3, 0.02, m.hpl, 0, 0.9, 0.17)
  for (const x of [-len / 2 + 0.3, len / 2 - 0.3]) pedestal(e, group(p, x, 0, -0.14, PI))
  // On the work surface, facing the staff.
  computer(e, p, -len / 4, 0.765, -0.02, PI, screens[0])
  computer(e, p, len / 4, 0.765, -0.02, PI, screens[1])
  deskPhone(e, p, 0, 0.765, -0.2, PI)
  k.soft(p, 0.3, 0.05, 0.22, 0.01, c.black, len / 2 - 0.65, 0.79, -0.2)
  k.box(p, 0.26, 0.004, 0.18, m.glass, len / 2 - 0.65, 0.817, -0.2, false)
  // On the transaction top: a brochure holder, table flags.
  const bh = group(p, -len / 2 + 0.3, 1.08, 0.3)
  for (let i = 0; i < 3; i++) {
    k.box(bh, 0.12, 0.2, 0.004, itemMats(e).clear, -0.13 + i * 0.13, 0.1, -0.03, false)
    k.box(bh, 0.1, 0.18, 0.003, [m.blue, m.paper, c.teal][i], -0.13 + i * 0.13, 0.095, -0.035, false)
  }
  const tf = group(p, len / 2 - 0.25, 1.08, 0.3)
  put(tf, lathe(e, 'tfBase', [[0, 0], [0.05, 0], [0.05, 0.015], [0, 0.02]], 20), c.bronze)
  FLAGS.slice(0, 3).forEach(([key, paint], i) => {
    const a = (i - 1) * 0.35
    const pole = group(tf, 0, 0.02, 0, a)
    pole.rotation.z = (i - 1) * 0.18
    e.k.cyl(pole, 0.002, 0.002, 0.3, c.bronze, 0, 0.15, 0, 6)
    face(e, pole, 0.13, 0.085, flagMat(e, key, paint), 0.067, 0.25, 0)
    face(e, pole, 0.13, 0.085, flagMat(e, key, paint), 0.067, 0.25, -0.001, PI)
  })
}

/* ---------- flags ---------- */

const flagIndia: Paint = (g, w, h) => {
  g.fillStyle = '#ff9933'
  g.fillRect(0, 0, w, h / 3)
  g.fillStyle = '#ffffff'
  g.fillRect(0, h / 3, w, h / 3)
  g.fillStyle = '#138808'
  g.fillRect(0, (2 * h) / 3, w, h / 3)
  g.strokeStyle = '#000080'
  g.lineWidth = h * 0.012
  const r = h * 0.14
  g.beginPath()
  g.arc(w / 2, h / 2, r, 0, PI * 2)
  g.stroke()
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * PI * 2
    g.beginPath()
    g.moveTo(w / 2, h / 2)
    g.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r)
    g.stroke()
  }
}
const flagBangladesh: Paint = (g, w, h) => {
  g.fillStyle = '#006a4e'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#f42a41'
  g.beginPath()
  g.arc(w * 0.45, h / 2, h * 0.3, 0, PI * 2)
  g.fill()
}
const flagUae: Paint = (g, w, h) => {
  g.fillStyle = '#00732f'
  g.fillRect(0, 0, w, h / 3)
  g.fillStyle = '#ffffff'
  g.fillRect(0, h / 3, w, h / 3)
  g.fillStyle = '#000000'
  g.fillRect(0, (2 * h) / 3, w, h / 3)
  g.fillStyle = '#ff0000'
  g.fillRect(0, 0, w / 4, h)
}
const flagNigeria: Paint = (g, w, h) => {
  g.fillStyle = '#008751'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#ffffff'
  g.fillRect(w / 3, 0, w / 3, h)
}
const flagUzbekistan: Paint = (g, w, h) => {
  g.fillStyle = '#0099b5'
  g.fillRect(0, 0, w, h / 3)
  g.fillStyle = '#ffffff'
  g.fillRect(0, h / 3, w, h / 3)
  g.fillStyle = '#1eb53a'
  g.fillRect(0, (2 * h) / 3, w, h / 3)
  g.fillStyle = '#ce1126'
  g.fillRect(0, h / 3 - h * 0.015, w, h * 0.03)
  g.fillRect(0, (2 * h) / 3 - h * 0.015, w, h * 0.03)
  g.fillStyle = '#ffffff'
  g.beginPath()
  g.arc(w * 0.13, h * 0.16, h * 0.11, 0, PI * 2)
  g.fill()
  g.fillStyle = '#0099b5'
  g.beginPath()
  g.arc(w * 0.16, h * 0.16, h * 0.1, 0, PI * 2)
  g.fill()
  g.fillStyle = '#ffffff'
  const rows = [3, 4, 5]
  rows.forEach((n, j) => {
    for (let i = 0; i < n; i++) {
      g.beginPath()
      g.arc(w * (0.4 - (n - 3 + i) * 0.045 + 0.09), h * (0.06 + j * 0.08), h * 0.018, 0, PI * 2)
      g.fill()
    }
  })
}
const flagMaldives: Paint = (g, w, h) => {
  g.fillStyle = '#d21034'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#007e3a'
  g.fillRect(w / 4, h / 4, w / 2, h / 2)
  g.fillStyle = '#ffffff'
  g.beginPath()
  g.arc(w / 2, h / 2, h * 0.17, 0, PI * 2)
  g.fill()
  g.fillStyle = '#007e3a'
  g.beginPath()
  g.arc(w / 2 + h * 0.06, h / 2, h * 0.15, 0, PI * 2)
  g.fill()
}

/** The flags flown in the lounge, by key: the host country and those most patients come from. */
export const FLAGS: [string, Paint][] = [['india', flagIndia], ['bangladesh', flagBangladesh], ['uae', flagUae], ['uzbekistan', flagUzbekistan], ['nigeria', flagNigeria], ['maldives', flagMaldives]]

function flagMat(e: OpdCtx, key: string, paint: Paint) {
  const m = e.o.sign(`flag_${key}`, 384, 256, paint, 0.9)
  m.side = DoubleSide
  return m
}

/**
 * An indoor flag on its stand: a weighted bronze base, the two-piece pole with its spear finial,
 * the flag (0.9 × 0.6) hanging from the cross-bar in soft vertical folds, its fly falling.
 */
export function flagStand(e: OpdCtx, p: Object3D, key: string, paint: Paint) {
  const { k } = e
  const c = intlMats(e)
  put(p, lathe(e, 'fsBase', [[0, 0], [0.17, 0], [0.17, 0.02], [0.12, 0.05], [0.03, 0.07], [0, 0.07]], 28), c.bronze)
  k.cyl(p, 0.013, 0.013, 2.25, c.bronze, 0, 1.18, 0, 12)
  put(p, lathe(e, 'fsFinial', [[0, 0], [0.018, 0], [0.02, 0.02], [0.012, 0.04], [0.02, 0.07], [0, 0.12]], 14), c.bronze, 0, 2.3, 0)
  k.cyl(p, 0.005, 0.005, 0.62, c.bronze, 0.31, 2.22, 0, 8).rotation.z = PI / 2
  const flag = geo(e, 'flagCloth', () => {
    const g = new PlaneGeometry(0.6, 0.9, 24, 12)
    const pos = g.getAttribute('position')
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + 0.3
      const y = pos.getY(i) - 0.45
      // Folds deepening towards the fly and down the hem, the fly corner falling a little.
      const fold = Math.sin(x * 26) * 0.025 * (0.3 + x / 0.6) * (0.6 + (-y / 0.9) * 0.6)
      pos.setXYZ(i, x - (-y / 0.9) * 0.03 * (x / 0.6), y - (x / 0.6) ** 2 * 0.03, fold)
    }
    g.computeVertexNormals()
    return g
  })
  const f = put(p, flag, flagMat(e, key, paint), 0.015, 2.21, 0)
  f.castShadow = true
  k.box(p, 0.03, 0.004, 0.004, c.bronze, 0.6, 2.21, 0, false)
}

/* ---------- world clocks ---------- */

/** A world clock: a brushed ring, its face with the hands set to the city's time, the city below. */
export function worldClock(e: OpdCtx, p: Object3D, city: string, offsetMin: number, y: number) {
  const { k } = e
  const c = intlMats(e)
  const now = new Date()
  const mins = (now.getUTCHours() * 60 + now.getUTCMinutes() + offsetMin + 1440) % 1440
  const mat = e.o.sign(`wclock_${city}`, 256, 300, (g, w, h) => {
    g.fillStyle = '#f7f4ee'
    g.fillRect(0, 0, w, h)
    const cx = w / 2
    const cy = w / 2
    g.fillStyle = '#1c1c1c'
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * PI * 2
      g.save()
      g.translate(cx + Math.sin(a) * w * 0.4, cy - Math.cos(a) * w * 0.4)
      g.rotate(a)
      g.fillRect(-2.5, -9, 5, i % 3 ? 14 : 22)
      g.restore()
    }
    const hand = (a: number, len: number, wd: number, col: string) => {
      g.strokeStyle = col
      g.lineWidth = wd
      g.lineCap = 'round'
      g.beginPath()
      g.moveTo(cx, cy)
      g.lineTo(cx + Math.sin(a) * len, cy - Math.cos(a) * len)
      g.stroke()
    }
    hand(((mins / 60) % 12) * (PI / 6), w * 0.24, 9, '#1c1c1c')
    hand((mins % 60) * (PI / 30), w * 0.36, 6, '#1c1c1c')
    g.fillStyle = '#8a6a45'
    g.beginPath()
    g.arc(cx, cy, 8, 0, PI * 2)
    g.fill()
    g.fillStyle = '#1c1c1c'
    g.font = SANS(h * 0.075, 700)
    g.textAlign = 'center'
    g.fillText(city.toUpperCase(), cx, h * 0.96)
  })
  put(p, lathe(e, 'wcRing', [[0, 0], [0.15, 0], [0.155, 0.01], [0.15, 0.035], [0.14, 0.035], [0.135, 0.01], [0, 0.01]], 40), c.bronze, 0, y, 0).rotation.x = PI / 2
  face(e, p, 0.27, 0.27, mat, 0, y, 0.012)
  // The city's name on a plate under it (the face's lower band, cut out of the same canvas).
  k.box(p, 0.24, 0.05, 0.008, c.black, 0, y - 0.2, 0.004)
  const plate = face(e, p, 0.22, 0.04, e.o.sign(`wcity_${city}`, 256, 48, (g, w, h) => {
    g.fillStyle = '#1d1d1f'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#e9d9b8'
    g.font = SANS(h * 0.56, 600)
    g.textAlign = 'center'
    g.fillText(city.toUpperCase(), w / 2, h * 0.72)
  }), 0, y - 0.2, 0.0085)
  plate.castShadow = false
}

/* ---------- refreshments ---------- */

/**
 * A bean-to-cup coffee machine: a gloss black body with a brushed front, the bean hopper's
 * smoked lid on top, a colour touch screen, the height-adjustable twin spout and milk outlet,
 * the drip tray with its grille and a cup under the spout, the water tank at the side. Faces +z.
 */
export function coffeeMachine(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const c = intlMats(e)
  const t = itemMats(e)
  k.soft(p, 0.3, 0.44, 0.44, 0.03, c.glossBlack, 0, 0.22, -0.22)
  k.box(p, 0.26, 0.2, 0.006, m.stainless, 0, 0.32, 0.001)
  face(e, p, 0.1, 0.07, e.o.screen('coffeeUi', 200, 140, (g, w, h) => {
    g.fillStyle = '#16120f'
    g.fillRect(0, 0, w, h)
    const items = ['Espresso', 'Cappuccino', 'Latte', 'Americano', 'Hot water', 'Milk']
    items.forEach((s, i) => {
      const x = (i % 3) * (w / 3)
      const y = Math.floor(i / 3) * (h / 2)
      g.fillStyle = '#3a2a1e'
      g.fillRect(x + 4, y + 4, w / 3 - 8, h / 2 - 8)
      g.fillStyle = '#e9d6b8'
      g.font = SANS(h * 0.1, 600)
      g.textAlign = 'center'
      g.fillText(s, x + w / 6, y + h * 0.3)
    })
  }), 0, 0.36, 0.0045)
  // The spout block, twin nozzles and the milk outlet.
  k.soft(p, 0.12, 0.06, 0.1, 0.015, m.stainless, 0, 0.2, 0.02)
  for (const x of [-0.02, 0.02]) k.cyl(p, 0.006, 0.004, 0.02, m.chrome, x, 0.162, 0.04, 10)
  k.cyl(p, 0.004, 0.004, 0.02, m.chrome, 0, 0.162, 0.015, 8)
  // Drip tray, its grille, a cup.
  k.soft(p, 0.26, 0.03, 0.12, 0.008, c.black, 0, 0.015, 0.04)
  k.box(p, 0.24, 0.004, 0.1, m.stainless, 0, 0.031, 0.04, false)
  put(p, lathe(e, 'cmCup', [[0, 0], [0.028, 0], [0.04, 0.075], [0.037, 0.077], [0.026, 0.006], [0, 0.006]], 18), m.whitePlastic, 0, 0.033, 0.04)
  // Bean hopper lid, the water tank at the left side.
  put(p, lathe(e, 'cmHopper', [[0, 0], [0.08, 0], [0.078, 0.03], [0.05, 0.045], [0, 0.048]], 24), t.amberGlass, 0.05, 0.44, -0.3)
  k.box(p, 0.03, 0.34, 0.3, t.clear, -0.165, 0.24, -0.25, false)
  k.box(p, 0.024, 0.18, 0.28, t.saline, -0.165, 0.16, -0.25, false)
}

/**
 * A refreshment counter, `len` long: walnut base cupboards (operated) under a quartz top at
 * 0.9 m; the coffee machine, a hot-water urn, glass cookie jars, a stack of cups and saucers,
 * glasses and a napkin holder on it. Faces +z, 0.6 deep.
 */
export function refreshmentCounter(e: OpdCtx, p: Object3D, len: number) {
  const { k, m } = e
  const c = intlMats(e)
  const w = kitMats(e)
  const t = itemMats(e)
  const g = group(p, 0, 0, 0.6)
  carcass(e, g, len, 0.88, 0.58, w.walnut, [0.45], 0.1, c.quartz)
  const n = Math.max(2, Math.round(len / 0.5))
  const uw = (len - 0.04) / n
  for (let i = 0; i < n; i++) cupboardDoor(e, g, -len / 2 + 0.02 + i * uw + (i % 2 ? uw : 0), 0.49, 0, { w: uw - 0.006, h: 0.74, hinge: i % 2 ? 'right' : 'left', face: w.walnut, label: 'Cupboard', angle: 1.6 })
  const top = 0.905
  coffeeMachine(e, group(p, -len / 2 + 0.3, top, 0.48))
  // The urn: a brushed steel cylinder on its base, the tap, the drip tray.
  const u = group(p, -len / 2 + 0.72, top, 0.32)
  put(u, lathe(e, 'urn', [[0, 0], [0.12, 0], [0.12, 0.04], [0.11, 0.05], [0.11, 0.36], [0.06, 0.4], [0.02, 0.42], [0, 0.42]], 28), m.stainless)
  k.box(u, 0.04, 0.04, 0.05, c.black, 0, 0.1, 0.13)
  k.soft(u, 0.12, 0.02, 0.08, 0.006, c.black, 0, 0.01, 0.15)
  // Cookie jars, cups and saucers, glasses, napkins.
  for (let i = 0; i < 3; i++) {
    const x = len / 2 - 0.65 + i * 0.16
    put(p, lathe(e, 'jar', [[0, 0], [0.06, 0], [0.062, 0.16], [0.045, 0.18], [0, 0.18]], 22), t.glass, x, top, 0.2)
    put(p, lathe(e, 'jarFill', [[0, 0.002], [0.056, 0.002], [0.056, 0.09 + i * 0.02], [0, 0.09 + i * 0.02]], 18), [w.oakFront, c.bronze, c.throwRust][i], x, top, 0.2)
    k.cyl(p, 0.05, 0.05, 0.02, w.walnut, x, top + 0.19, 0.2, 18)
  }
  for (let j = 0; j < 4; j++) {
    k.cyl(p, 0.07, 0.065, 0.008, m.whitePlastic, len / 2 - 0.2, top + 0.004 + j * 0.07, 0.38, 22)
    put(p, lathe(e, 'rcCup', [[0, 0], [0.03, 0], [0.042, 0.06], [0.039, 0.062], [0.027, 0.006], [0, 0.006]], 18), m.whitePlastic, len / 2 - 0.2, top + 0.008 + j * 0.07, 0.38)
  }
  for (let i = 0; i < 6; i++) put(p, lathe(e, 'rcGlass', [[0, 0], [0.032, 0], [0.036, 0.11], [0.033, 0.11], [0.029, 0.006], [0, 0.006]], 18), t.glass, len / 2 - 0.12 - (i % 3) * 0.08, top, 0.15 + Math.floor(i / 3) * 0.08)
  k.box(p, 0.16, 0.08, 0.06, c.bronze, -len / 2 + 0.95, top + 0.04, 0.4)
  k.box(p, 0.14, 0.1, 0.04, m.paper, -len / 2 + 0.95, top + 0.07, 0.4, false)
}

/**
 * A full-motion TV wall mount: the wall plate, two arm links on their pivots swung `swing` and
 * reaching out `reach`; returns the group the TV is built in (at the mount's head, its +z the
 * screen's facing).
 */
export function tvArm(e: OpdCtx, p: Object3D, y: number, reach = 0.35, swing = 0.3) {
  const { k } = e
  const c = intlMats(e)
  k.soft(p, 0.12, 0.3, 0.02, 0.008, c.black, 0, y, 0.01)
  const piv = lathe(e, 'tvPivot', [[0, -0.05], [0.02, -0.05], [0.022, 0], [0.02, 0.05], [0, 0.05]], 14)
  const a = group(p, 0, y, 0.03, -swing * 1.4)
  put(a, piv, c.black)
  k.soft(a, 0.04, 0.03, reach * 0.55, 0.01, c.black, 0, 0, reach * 0.275)
  const b = group(a, 0, 0, reach * 0.55, swing * 2.2)
  put(b, piv, c.black)
  k.soft(b, 0.04, 0.03, reach * 0.45, 0.01, c.black, 0, 0, reach * 0.225)
  const head = group(b, 0, 0, reach * 0.45, swing - swing * 0.8)
  put(head, piv, c.black)
  k.soft(head, 0.2, 0.06, 0.03, 0.01, c.black, 0, 0, 0.02)
  // wallTV builds its own plate and stand-off: place it so they sit on this head.
  return group(head, 0, -y, -0.0)
}
