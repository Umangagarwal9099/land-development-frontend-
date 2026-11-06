import {
  CanvasTexture, ExtrudeGeometry, MeshPhysicalMaterial, MeshStandardMaterial, RepeatWrapping, Shape, SRGBColorSpace, TorusGeometry, Vector2,
  type Material, type Object3D,
} from 'three'
import { PI } from '../../../kit'
import { rng } from '../../../textures'
import { bentTube, carcass, castor, cupboardDoor, drawer, face, geo, group, lathe, put, rod, starBase } from '../../erKit'
import { packs } from '../../erFurniture'
import type { OpdCtx } from '../ctx'
import { SANS } from '../paints'

/*
 * The consultation floor's specialty equipment, modelled on the products found in Indian
 * multispecialty OPDs (no makes or marks): the gynaecological chair with its Goepel leg holders and
 * drainage bowl, the motorised ENT chair and the ENT treatment workstation with its trays, sprays,
 * suction and endoscope tower, the 12-channel ECG on its trolley, the electrosurgical generator,
 * the cryo dewar, the magnifying lamp, the plaster trolley and splints, the AED cabinet, the infant
 * scale, infantometer and nebuliser, the hand instruments of each specialty, the records room's
 * mobile shelving. Each is built at its catalogue size from its real construction: moulded shells
 * with soft edges over a frame, upholstery on boards, turned and tube-bent metalwork, lit displays.
 * Front towards +z, standing on y = 0 (or, for small things, at (x, y, z) on a surface).
 */

/* ---------- materials ---------- */

const cache = new WeakMap<object, ReturnType<typeof makeMats>>()

/** A fine leather-grain for upholstery and textured plastics, tiling every ~6 cm. */
function grainTexture(seed: number, base: string, spread: number) {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')!
  g.fillStyle = base
  g.fillRect(0, 0, 256, 256)
  const r = rng(seed)
  for (let i = 0; i < 9000; i++) {
    const v = (r() - 0.5) * spread
    g.fillStyle = v > 0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`
    const s = 1 + r() * 2.4
    g.beginPath()
    g.ellipse(r() * 256, r() * 256, s, s * (0.6 + r() * 0.6), r() * PI, 0, PI * 2)
    g.fill()
  }
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.wrapS = t.wrapT = RepeatWrapping
  t.repeat.set(14, 14)
  t.anisotropy = 4
  return t
}

function makeMats(e: OpdCtx) {
  const phys = (color: string, roughness: number, clearcoat = 0, extra: Partial<MeshPhysicalMaterial> = {}) => {
    const m = new MeshPhysicalMaterial({ color, roughness, clearcoat, clearcoatRoughness: 0.45 })
    Object.assign(m, extra)
    return m
  }
  const uphol = (color: string, seed: number) => {
    const m = new MeshPhysicalMaterial({ color: '#ffffff', map: grainTexture(seed, color, 0.09), roughness: 0.58, sheen: 0.25, sheenRoughness: 0.6, sheenColor: '#ffffff' })
    return m
  }
  return {
    /** Moulded ABS shells of medical furniture: a warm white, satin; and the light grey of bases and trims. */
    shell: phys('#eeeeea', 0.36, 0.15),
    trim: phys('#c5cacd', 0.42, 0.1),
    darkTrim: phys('#4a4f55', 0.45, 0.1),
    /** Medical upholstery: seamless PU-coated fabric in the hospital's blue-grey, a dark charcoal, a soft aqua for paediatrics. */
    uphol: uphol('#4b6a82', 7101),
    upholDark: uphol('#3a3f45', 7103),
    upholAqua: uphol('#6fa7a7', 7105),
    /** Equipment housings: the off-white of instruments, and a dark grey-blue panel. */
    housing: phys('#f3f3f0', 0.32, 0.25),
    panel: phys('#2c3238', 0.38, 0.2),
    rubber: new MeshStandardMaterial({ color: '#1d1e20', roughness: 0.9 }),
    lens: new MeshPhysicalMaterial({ color: '#eef6f7', roughness: 0.02, transmission: 0.0, transparent: true, opacity: 0.32, ior: 1.5, clearcoat: 1, depthWrite: false }),
    jar: new MeshPhysicalMaterial({ color: '#e9f3f5', roughness: 0.08, transparent: true, opacity: 0.38, depthWrite: false }),
    fluid: new MeshPhysicalMaterial({ color: '#d7b48a', roughness: 0.15, transparent: true, opacity: 0.7, depthWrite: false }),
    yellowPad: phys('#f2b928', 0.5),
    greenCase: phys('#1f8f4a', 0.42, 0.2),
    orange: phys('#f08a1f', 0.5),
    pastelYellow: phys('#f4d77a', 0.5),
    redRubber: new MeshStandardMaterial({ color: '#b3231f', roughness: 0.7 }),
    paperRoll: new MeshStandardMaterial({ color: '#f7f6f1', roughness: 0.95 }),
    led: e.lighting.glow(new MeshStandardMaterial({ color: '#ffffff', emissive: '#f3f7ff', emissiveIntensity: 1.6, roughness: 0.4 }), 1),
    ledGreen: e.lighting.glow(new MeshStandardMaterial({ color: '#7dffb0', emissive: '#2fe07a', emissiveIntensity: 1.4, roughness: 0.4 }), 1),
    ledAmber: e.lighting.glow(new MeshStandardMaterial({ color: '#ffcf7a', emissive: '#ffa21f', emissiveIntensity: 1.3, roughness: 0.4 }), 1),
    wood: new MeshStandardMaterial({ map: e.k.tex.finish('oak', 1, 1), color: '#d4b48d', roughness: 0.55 }),
    cork: new MeshStandardMaterial({ color: '#b98d5f', roughness: 0.95 }),
    foamBlue: new MeshStandardMaterial({ color: '#2f5f9e', roughness: 0.85 }),
    beige: phys('#e6d8bf', 0.75),
    /** Rows of patient files seen by their spines: manila, blue and green folders, labels, year bands. */
    files: [0, 1, 2].map((v) => new MeshStandardMaterial({ map: spinesTexture(7200 + v), roughness: 0.85 })),
  }
}

/** File spines across ~0.8 m of shelf: folders of a few thicknesses, muted record-room colours, white labels and coloured year tabs. */
function spinesTexture(seed: number) {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 192
  const g = c.getContext('2d')!
  const r = rng(seed)
  const tones = ['#d8c39a', '#cdb68a', '#3f6ea6', '#5b8bc0', '#4d8a62', '#e0d4b8', '#b9a27a', '#7a8ea6']
  let x = 0
  while (x < 512) {
    const w = 6 + Math.floor(r() * 12)
    const top = 8 + r() * 30
    g.fillStyle = tones[Math.floor(r() * tones.length)]
    g.fillRect(x, top, w - 1, 192 - top)
    g.fillStyle = 'rgba(0,0,0,.25)'
    g.fillRect(x + w - 1, top, 1, 192 - top)
    g.fillStyle = '#f6f4ee'
    g.fillRect(x + 1, top + 30 + r() * 20, w - 3, 22)
    g.fillStyle = ['#c8161d', '#f2c200', '#1f9d55', '#1f6fd1'][Math.floor(r() * 4)]
    g.fillRect(x + 1, 150 + r() * 10, w - 3, 8)
    x += w
  }
  g.fillStyle = 'rgba(0,0,0,.35)'
  g.fillRect(0, 0, 512, 6)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

/** The equipment's own finishes, made once per model. */
export function cm(e: OpdCtx) {
  let c = cache.get(e.o)
  if (!c) cache.set(e.o, (c = makeMats(e)))
  return c
}

/* ---------- shapes ---------- */

/** A closed outline in plan (x, z) with every corner rounded to `r` (quadratic fillets). */
function rounded(pts: [number, number][], r: number) {
  const s = new Shape()
  const n = pts.length
  // Shape space is (x, −z): extruded upwards it lands the right way round in plan.
  const P = pts.map(([x, z]) => new Vector2(x, -z))
  for (let i = 0; i < n; i++) {
    const a = P[(i + n - 1) % n]
    const b = P[i]
    const c = P[(i + 1) % n]
    const ab = b.clone().sub(a)
    const bc = c.clone().sub(b)
    const ra = Math.min(r, ab.length() / 2)
    const rc = Math.min(r, bc.length() / 2)
    const p0 = b.clone().sub(ab.normalize().multiplyScalar(ra))
    const p1 = b.clone().add(bc.normalize().multiplyScalar(rc))
    if (i === 0) s.moveTo(p0.x, p0.y)
    else s.lineTo(p0.x, p0.y)
    s.quadraticCurveTo(b.x, b.y, p1.x, p1.y)
  }
  s.closePath()
  return s
}

/**
 * An upholstered cushion or moulded slab with the outline `pts` in plan, `t` thick, soft-edged by
 * `bevel`, its underside at y = 0.
 */
function slabGeo(e: OpdCtx, key: string, pts: [number, number][], t: number, r: number, bevel: number) {
  return geo(e, `cslab${key}`, () => {
    const b = Math.min(bevel, t / 2.2)
    const g = new ExtrudeGeometry(rounded(pts, r), { depth: Math.max(0.001, t - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b * 0.9, bevelSegments: 3, curveSegments: 6 })
    g.rotateX(-PI / 2)
    g.translate(0, b, 0)
    return g
  })
}

/** A rectangle w × d (x × z) as an outline, centred. */
const rectPts = (w: number, d: number): [number, number][] => [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]]

/** A padded cradle (a half pipe, open upwards) of radius R and wall `t`, `len` long along local x. */
function cradleGeo(e: OpdCtx, R: number, t: number, len: number) {
  return geo(e, `cradle${R}|${t}|${len}`, () => {
    const s = new Shape()
    s.absarc(0, 0, R, PI * 1.05, PI * 1.95, false)
    s.absarc(0, 0, R - t, PI * 1.95, PI * 1.05, true)
    s.closePath()
    const g = new ExtrudeGeometry(s, { depth: len - 0.02, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.008, bevelSegments: 2, curveSegments: 14 })
    g.translate(0, 0, -(len - 0.02) / 2)
    g.rotateY(PI / 2)
    return g
  })
}

/** A turned bellows (a lift column's rubber gaiter): `n` folds from y0 to y1, radius r. */
function bellowsGeo(e: OpdCtx, r: number, y0: number, y1: number, n: number) {
  const prof: [number, number][] = [[0, y0]]
  for (let i = 0; i <= n * 2; i++) prof.push([i % 2 ? r * 0.86 : r, y0 + ((y1 - y0) * i) / (n * 2)])
  prof.push([0, y1])
  return lathe(e, `bellows${r}|${y0}|${y1}|${n}`, prof, 24)
}

/** A ring (a lamp head's rim, a lens bezel): radius R, tube r, flat in xz. */
function ringGeo(e: OpdCtx, R: number, r: number) {
  return geo(e, `ring${R}|${r}`, () => {
    const g = new TorusGeometry(R, r, 10, 32)
    g.rotateX(PI / 2)
    return g
  })
}

/** A prism of a triangle (a reflex hammer's head), side s, length l along z. */
function prismGeo(e: OpdCtx, s: number, l: number) {
  return geo(e, `prism${s}|${l}`, () => {
    const sh = new Shape()
    sh.moveTo(-s / 2, -s * 0.29)
    sh.lineTo(s / 2, -s * 0.29)
    sh.lineTo(0, s * 0.58)
    sh.closePath()
    const g = new ExtrudeGeometry(sh, { depth: l, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2 })
    g.translate(0, 0, -l / 2)
    return g
  })
}

/** A soft box (rounded edges) shorthand. */
const sbox = (e: OpdCtx, p: Object3D, w: number, h: number, d: number, r: number, mat: Material, x: number, y: number, z: number) => e.k.soft(p, w, h, d, r, mat, x, y, z)

/* ---------- printed faces ---------- */

const scopePaint = (g: CanvasRenderingContext2D, w: number, h: number) => {
  // An endoscopic view of the nasal cavity: the round image of the 4 mm scope in black, the overlay.
  g.fillStyle = '#030303'
  g.fillRect(0, 0, w, h)
  const r = h * 0.43
  const grad = g.createRadialGradient(w * 0.47, h * 0.47, r * 0.08, w * 0.5, h * 0.5, r)
  grad.addColorStop(0, '#f6c3b0')
  grad.addColorStop(0.35, '#e08f7c')
  grad.addColorStop(0.7, '#a2463c')
  grad.addColorStop(0.95, '#3d100d')
  grad.addColorStop(1, '#000')
  g.fillStyle = grad
  g.beginPath()
  g.arc(w * 0.5, h * 0.5, r, 0, PI * 2)
  g.fill()
  // The septum and a turbinate, darker folds.
  g.strokeStyle = 'rgba(90,20,18,.55)'
  g.lineWidth = h * 0.03
  g.beginPath()
  g.ellipse(w * 0.36, h * 0.52, r * 0.18, r * 0.6, 0.1, 0, PI * 2)
  g.stroke()
  g.fillStyle = '#c9d6e6'
  g.font = SANS(h * 0.045, 500)
  g.fillText('ENT  ·  0° 4 mm  ·  WB AUTO', w * 0.03, h * 0.07)
  g.fillText('REC ●', w * 0.85, h * 0.07)
}

const lcd = (lines: string[], bg = '#c5d6c6', ink = '#15241a') => (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.fillStyle = bg
  g.fillRect(0, 0, w, h)
  g.fillStyle = ink
  g.font = SANS(h / (lines.length + 0.6), 700)
  lines.forEach((l, i) => g.fillText(l, w * 0.08, (h * (i + 1)) / (lines.length + 0.3)))
}

/** The ESU's front: two lit power readouts, mode keys and the output sockets' legend. */
const esuPaint = (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.fillStyle = '#e9ebec'
  g.fillRect(0, 0, w, h)
  for (const [x, col, val, lab] of [[0.06, '#f2c200', '40', 'CUT'], [0.38, '#2c7be5', '30', 'COAG']] as const) {
    g.fillStyle = '#10161c'
    g.fillRect(w * x, h * 0.12, w * 0.26, h * 0.42)
    g.fillStyle = col
    g.font = SANS(h * 0.3, 700)
    g.fillText(val, w * (x + 0.04), h * 0.45)
    g.font = SANS(h * 0.1, 700)
    g.fillStyle = '#20262c'
    g.fillText(lab, w * (x + 0.06), h * 0.68)
    for (let i = 0; i < 2; i++) {
      g.fillStyle = '#c9cdd0'
      g.fillRect(w * (x + 0.03 + i * 0.12), h * 0.75, w * 0.08, h * 0.12)
    }
  }
  g.fillStyle = '#20262c'
  g.font = SANS(h * 0.08, 700)
  g.fillText('MONOPOLAR   BIPOLAR   NE', w * 0.68, h * 0.2)
}

/** A 12-lead resting ECG on the cart's screen: three rows of four leads and a rhythm strip on the grid. */
export const ecgPaint = (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.fillStyle = '#fbf3f2'
  g.fillRect(0, 0, w, h)
  g.strokeStyle = 'rgba(220,120,120,.35)'
  g.lineWidth = 1
  for (let x = 0; x < w; x += w / 50) {
    g.beginPath()
    g.moveTo(x, h * 0.08)
    g.lineTo(x, h)
    g.stroke()
  }
  for (let y = h * 0.08; y < h; y += w / 50) {
    g.beginPath()
    g.moveTo(0, y)
    g.lineTo(w, y)
    g.stroke()
  }
  g.fillStyle = '#1c3966'
  g.fillRect(0, 0, w, h * 0.08)
  g.fillStyle = '#fff'
  g.font = SANS(h * 0.05, 700)
  g.fillText('HR 72  ·  PR 156  QRS 88  QT/QTc 384/412  ·  25 mm/s  10 mm/mV', w * 0.02, h * 0.055)
  g.strokeStyle = '#111'
  g.lineWidth = 1.4
  const leads = ['I', 'aVR', 'V1', 'V4', 'II', 'aVL', 'V2', 'V5', 'III', 'aVF', 'V3', 'V6']
  const beat = (t: number) => (t > 0.1 && t < 0.16 ? 0.12 * Math.sin(((t - 0.1) / 0.06) * PI) : t > 0.24 && t < 0.26 ? -0.1 : t > 0.26 && t < 0.29 ? 0.95 : t > 0.29 && t < 0.32 ? -0.25 : t > 0.45 && t < 0.6 ? 0.22 * Math.sin(((t - 0.45) / 0.15) * PI) : 0)
  for (let row = 0; row < 4; row++) {
    const y0 = h * (0.24 + row * 0.2)
    g.beginPath()
    for (let x = 0; x <= w; x += 1) {
      const t = (x / (w / 4.6)) % 1
      const col = Math.floor((x / w) * 4)
      const sign = row < 3 && (leads[row * 4 + col] === 'aVR' || leads[row * 4 + col] === 'V1') ? -0.6 : 1
      const y = y0 - beat(t) * h * 0.08 * sign
      if (x) g.lineTo(x, y)
      else g.moveTo(x, y)
    }
    g.stroke()
    if (row < 3) leads.slice(row * 4, row * 4 + 4).forEach((l, i) => {
      g.fillStyle = '#111'
      g.font = SANS(h * 0.035, 700)
      g.fillText(l, (w * i) / 4 + 4, y0 - h * 0.07)
    })
  }
}

/* ---------- small instruments on desks and trays ---------- */

/** A blood glucose meter (with a strip in), its strip vial and lancing pen, on a surface at (x, y, z). */
export function glucometer(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const c = cm(e)
  const g = group(p, x, y, z, ry)
  put(g, slabGeo(e, 'gluco', [[-0.03, -0.048], [0.03, -0.048], [0.026, 0.05], [-0.026, 0.05]], 0.02, 0.014, 0.006), c.housing, 0, 0, 0, false)
  k.box(g, 0.036, 0.002, 0.034, e.o.screen('gluco', 64, 60, lcd(['112', 'mg/dL'])), 0, 0.021, -0.016, false)
  for (const dx of [-0.012, 0.012]) k.cyl(g, 0.006, 0.006, 0.003, c.trim, dx, 0.021, 0.025, 12)
  k.box(g, 0.005, 0.001, 0.028, m.paper, 0, 0.012, -0.062, false)
  put(g, lathe(e, 'stripVial', [[0, 0], [0.013, 0], [0.013, 0.055], [0.015, 0.056], [0.015, 0.07], [0, 0.07]], 16), c.housing, 0.065, 0, 0.01, false)
  const pen = put(g, lathe(e, 'lancetPen', [[0, 0], [0.008, 0.004], [0.009, 0.07], [0.006, 0.09], [0, 0.092]], 14), c.darkTrim, 0.1, 0.009, -0.03, false)
  pen.rotation.x = PI / 2
  return g
}

/**
 * The neurological examination tray: a Taylor reflex hammer (red rubber triangle on a chrome
 * handle), 128 Hz and 512 Hz tuning forks, a Wartenberg pin wheel, a pen torch, cotton wisps and
 * a tongue depressor, on a stainless instrument tray.
 */
export function neuroTray(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const c = cm(e)
  const g = group(p, x, y, z, ry)
  trayBase(e, g, 0.3, 0.2)
  // Taylor hammer.
  const hm = group(g, -0.04, 0.016, -0.06, 0.2)
  rod(e, hm, 0.0045, 0.19, m.chrome, 0.02, 0, 0, 'x', 10)
  put(hm, prismGeo(e, 0.03, 0.018), c.redRubber, -0.085, 0.006, 0, false).rotation.x = PI / 2
  // Tuning forks: a stem and two tines in a U.
  for (const [dz, len, s] of [[0.0, 0.16, 1], [0.05, 0.12, 0.8]] as const) {
    const f = group(g, -0.06, 0.012, dz)
    rod(e, f, 0.004 * s, 0.05, m.chrome, -0.045, 0, 0, 'x', 8)
    put(f, bentTube(e, `fork${len}`, [[len - 0.02, 0, -0.008], [0, 0, -0.008], [-0.012, 0, 0], [0, 0, 0.008], [len - 0.02, 0, 0.008]], 0.0028, 0.01), m.chrome, -0.02, 0, 0, false)
    k.cyl(f, 0.006, 0.006, 0.004, m.chrome, -0.072, 0, 0, 10).rotation.z = PI / 2
  }
  // Wartenberg wheel: a handle and the spiked disc.
  rod(e, g, 0.0035, 0.13, m.chrome, 0.07, 0.016, -0.06, 'x', 8)
  const wheel = put(g, geo(e, 'wartenberg', () => {
    const s = new Shape()
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * PI * 2
      const rr = i % 2 ? 0.011 : 0.016
      if (i) s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
      else s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr)
    }
    const eg = new ExtrudeGeometry(s, { depth: 0.002, bevelEnabled: false })
    return eg
  }), m.chrome, 0.142, 0.022, -0.061, false)
  wheel.rotation.y = PI / 2
  // Pen torch, cotton wisps, a wooden tongue depressor.
  const torch = put(g, lathe(e, 'penTorch', [[0, 0], [0.0065, 0], [0.0065, 0.12], [0.006, 0.13], [0, 0.13]], 14), c.darkTrim, 0.04, 0.019, 0.07, false)
  torch.rotation.z = PI / 2
  k.box(g, 0.012, 0.004, 0.006, m.chrome, 0.015, 0.024, 0.07, false)
  k.soft(g, 0.05, 0.016, 0.04, 0.008, m.paper, 0.1, 0.018, 0.04)
  k.box(g, 0.15, 0.002, 0.018, c.beige, 0.05, 0.012, 0.02, false)
  return g
}

/** A shallow stainless instrument tray w × d with rolled edges, on y = 0. */
function trayBase(e: OpdCtx, p: Object3D, w: number, d: number, h = 0.018) {
  const { m } = e
  put(p, slabGeo(e, `tray${w}|${d}`, rectPts(w, d), 0.002, 0.02, 0.001), m.stainless, 0, 0, 0, false)
  for (const s of [-1, 1]) {
    const a = e.k.box(p, w - 0.02, h, 0.0015, m.stainless, 0, h / 2, s * (d / 2 - 0.003), false)
    a.rotation.x = s * 0.25
    const b = e.k.box(p, 0.0015, h, d - 0.02, m.stainless, s * (w / 2 - 0.003), h / 2, 0, false)
    b.rotation.z = -s * 0.25
  }
}

/** A two-arm 30 cm clear goniometer lying open, its 360° protractor body at the hinge. */
export function goniometer(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const c = cm(e)
  const g = group(p, x, y, z, ry)
  const disc = e.k.cyl(g, 0.055, 0.055, 0.003, c.jar, 0, 0.0015, 0, 32)
  disc.castShadow = false
  for (const [a, dy] of [[0, 0.0035], [0.55, 0.006]] as const) {
    const arm = group(g, 0, dy, 0, a)
    put(arm, slabGeo(e, 'gonioArm', [[0, -0.013], [0.3, -0.013], [0.3, 0.013], [0, 0.013]], 0.0025, 0.01, 0.0008), c.jar, 0, 0, 0, false)
  }
  e.k.cyl(g, 0.007, 0.007, 0.01, c.darkTrim, 0, 0.005, 0, 12)
  return g
}

/** A handheld polarised dermatoscope standing in its charging cradle: the grip, the head, the 10× lens. */
export function dermatoscope(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const c = cm(e)
  const g = group(p, x, y, z, ry)
  put(g, lathe(e, 'dermBase', [[0, 0], [0.04, 0], [0.042, 0.008], [0.03, 0.045], [0.022, 0.05], [0, 0.05]], 24), c.panel, 0, 0, 0, false)
  put(g, lathe(e, 'dermGrip', [[0, 0], [0.016, 0], [0.018, 0.04], [0.016, 0.11], [0.014, 0.12], [0, 0.12]], 18), c.darkTrim, 0, 0.04, 0, false)
  const head = group(g, 0, 0.18, 0.012)
  head.rotation.x = PI / 2 - 0.25
  put(head, lathe(e, 'dermHead', [[0, -0.012], [0.032, -0.012], [0.034, 0.01], [0.03, 0.016], [0, 0.016]], 28), c.darkTrim, 0, 0, 0, false)
  put(head, ringGeo(e, 0.026, 0.002), c.led, 0, 0.0165, 0, false)
  e.k.cyl(head, 0.022, 0.022, 0.003, c.lens, 0, 0.017, 0, 28)
  e.k.box(g, 0.01, 0.004, 0.006, c.ledGreen, 0, 0.12, 0.018, false)
  return g
}

/** A handheld foetal Doppler: the unit with its LCD, the 2 MHz probe in its clip on the side, the coiled cable. */
export function foetalDoppler(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k } = e
  const c = cm(e)
  const g = group(p, x, y, z, ry)
  put(g, slabGeo(e, 'doppler', [[-0.04, -0.075], [0.04, -0.075], [0.035, 0.075], [-0.035, 0.075]], 0.032, 0.025, 0.01), c.housing, 0, 0, 0, false)
  k.box(g, 0.05, 0.002, 0.035, e.o.screen('doppler', 80, 56, lcd(['FHR', '142'], '#bcd7e8', '#0d2238')), 0, 0.033, -0.035, false)
  for (let i = 0; i < 3; i++) k.cyl(g, 0.007, 0.007, 0.003, i === 1 ? c.darkTrim : c.trim, -0.02 + i * 0.02, 0.033, 0.02, 14)
  const probe = group(g, 0.065, 0.02, 0.0, 0)
  probe.rotation.z = PI / 2
  put(probe, lathe(e, 'dopProbe', [[0, 0], [0.022, 0], [0.025, 0.012], [0.02, 0.03], [0.012, 0.085], [0.01, 0.1], [0, 0.1]], 20), c.housing, 0, 0, 0, false)
  k.cyl(probe, 0.0215, 0.0215, 0.002, c.panel, 0, 0.0005, 0, 20)
  put(g, bentTube(e, 'dopCable', [[0.0, 0.03, 0.075], [0.05, 0.012, 0.11], [0.12, 0.008, 0.08], [0.15, 0.02, 0.02]], 0.0025, 0.02), c.darkTrim, 0, 0, 0, false)
  return g
}

/** A sterile speculum tray: Cusco's bivalve specula (S, M, L), sponge-holding forceps, swabs, a gallipot, a slide jar. */
export function speculumTray(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  trayBase(e, g, 0.34, 0.24, 0.025)
  for (let i = 0; i < 3; i++) {
    const s = 0.85 + i * 0.13
    const sp = group(g, -0.11 + i * 0.065, 0.016, -0.04)
    // Two blades closed into a duck-bill, the thumb lever and screw at the handle.
    const blades = put(sp, lathe(e, `cusco${i}`, [[0, 0], [0.012 * s, 0.004], [0.016 * s, 0.03], [0.016 * s, 0.1 * s], [0.008, 0.11 * s], [0, 0.11 * s]], 14), m.chrome, 0, 0.012, 0, false)
    blades.rotation.x = PI / 2
    blades.scale.set(1, 1, 0.7)
    k.box(sp, 0.008, 0.05, 0.006, m.chrome, 0, 0.03, -0.004, false)
  }
  // Sponge-holding forceps: two long shanks, ring handles, oval jaws.
  const f = group(g, 0.06, 0.018, 0.07, 0.05)
  for (const s of [-1, 1]) {
    const sh = rod(e, f, 0.0025, 0.22, m.chrome, 0, 0, s * 0.004, 'x', 6)
    sh.rotation.y = s * 0.02
    put(f, ringGeo(e, 0.012, 0.0025), m.chrome, -0.12, 0, s * 0.016, false)
  }
  put(f, ringGeo(e, 0.01, 0.003), m.chrome, 0.115, 0, 0, false).scale.set(1.5, 1, 1)
  for (let i = 0; i < 4; i++) k.soft(g, 0.045, 0.018, 0.045, 0.01, m.paper, 0.09 + (i % 2) * 0.05, 0.02 + Math.floor(i / 2) * 0.016, -0.07)
  put(g, lathe(e, 'gallipotS', [[0, 0], [0.028, 0], [0.032, 0.004], [0.04, 0.038], [0.042, 0.04]], 20), m.stainless, -0.02, 0.003, 0.06, false)
  put(g, lathe(e, 'slideJar', [[0, 0], [0.018, 0], [0.018, 0.08], [0.02, 0.082], [0.02, 0.095], [0, 0.095]], 14), cm(e).jar, -0.13, 0.003, 0.07, false)
  return g
}

/** A suture tray on its green drape: needle holder, toothed forceps, Metzenbaum scissors, a scalpel, suture packs. */
export function sutureTray(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.box(g, 0.44, 0.003, 0.32, m.oxygen, 0, 0.0015, 0, false)
  const t = group(g, 0, 0.003, 0)
  trayBase(e, t, 0.34, 0.22, 0.02)
  // Ring-handled instruments: two shanks crossing at the box joint, the finger rings.
  const ringInst = (dx: number, dz: number, len: number, a: number) => {
    const ins = group(t, dx, 0.008, dz, a)
    for (const s of [-1, 1]) {
      const sh = rod(e, ins, 0.0022, len, m.chrome, 0, 0, s * 0.004, 'x', 6)
      sh.rotation.y = s * 0.03
      put(ins, ringGeo(e, 0.011, 0.0022), m.chrome, -len / 2 - 0.01, 0, s * 0.014, false)
    }
    k.box(ins, 0.01, 0.004, 0.008, m.chrome, len * 0.18, 0, 0, false)
  }
  ringInst(-0.04, -0.06, 0.14, 0.04)
  ringInst(-0.03, 0.0, 0.16, -0.03)
  // Toothed forceps (a V of two leaves), a scalpel with its blade.
  const fc = group(t, 0.0, 0.008, 0.06, 0.06)
  for (const s of [-1, 1]) {
    const leaf = k.box(fc, 0.13, 0.002, 0.006, m.chrome, 0, 0, s * 0.006, false)
    leaf.rotation.y = s * 0.05
  }
  const sc = group(t, 0.08, 0.008, -0.04, 0.1)
  k.box(sc, 0.11, 0.004, 0.009, m.chrome, 0, 0, 0, false)
  k.box(sc, 0.03, 0.001, 0.008, m.stainless, 0.07, 0, 0, false)
  for (let i = 0; i < 3; i++) k.box(t, 0.05, 0.004, 0.11, i === 1 ? m.purple : m.paper, 0.12 + i * 0.012, 0.006 + i * 0.002, 0.04, false).rotation.y = 0.1 * i
  return g
}

/** An ENT LED headlight: the adjustable padded head band, the lamp on its swivel, the battery lead. */
export function headlight(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const c = cm(e)
  const g = group(p, x, y, z, ry)
  const band = put(g, ringGeo(e, 0.085, 0.012), c.upholDark, 0, 0.012, 0, false)
  band.scale.set(1, 1, 0.82)
  put(g, bentTube(e, 'hlTop', [[-0.07, 0.012, 0], [-0.04, 0.05, 0], [0.04, 0.05, 0], [0.07, 0.012, 0]], 0.008, 0.04), c.upholDark, 0, 0, 0, false)
  const lamp = group(g, 0, 0.03, 0.085)
  lamp.rotation.x = PI / 2 - 0.4
  put(lamp, lathe(e, 'hlLamp', [[0, 0], [0.018, 0], [0.022, 0.03], [0.022, 0.045], [0, 0.045]], 18), c.darkTrim, 0, 0, 0, false)
  e.k.cyl(lamp, 0.019, 0.019, 0.002, c.led, 0, 0.0455, 0, 18)
  put(g, bentTube(e, 'hlLead', [[0.07, 0.02, -0.03], [0.12, 0.01, -0.06], [0.16, 0.005, 0.0]], 0.002, 0.02), c.darkTrim, 0, 0, 0, false)
  return g
}

/* ---------- wall equipment ---------- */

/**
 * A wall-mounted AED in its alarmed cabinet: a white powder-coated steel box with a clear
 * polycarbonate door, the AED inside (its green carry handle, the pads in their pouch), the alarm
 * module on top, and the green AED sign with its heart over it.
 */
export function aedCabinet(e: OpdCtx, p: Object3D, y = 1.25) {
  const { k, m } = e
  const c = cm(e)
  const w = 0.4
  const h = 0.46
  const d = 0.2
  // The box: back, sides, top and bottom, white, rounded edges; the door's clear panel and frame.
  sbox(e, p, w, 0.02, d, 0.006, c.shell, 0, y - h / 2 + 0.01, d / 2)
  sbox(e, p, w, 0.02, d, 0.006, c.shell, 0, y + h / 2 - 0.01, d / 2)
  for (const s of [-1, 1]) sbox(e, p, 0.02, h, d, 0.006, c.shell, s * (w / 2 - 0.01), y, d / 2)
  k.box(p, w - 0.02, h - 0.02, 0.01, c.shell, 0, y, 0.005)
  k.box(p, w - 0.06, h - 0.08, 0.004, c.lens, 0, y - 0.01, d - 0.003, false)
  for (const s of [-1, 1]) k.box(p, 0.03, h - 0.04, 0.012, c.shell, s * (w / 2 - 0.02), y, d - 0.006)
  k.box(p, w - 0.04, 0.05, 0.012, c.shell, 0, y + h / 2 - 0.035, d - 0.006)
  k.box(p, w - 0.04, 0.03, 0.012, c.shell, 0, y - h / 2 + 0.025, d - 0.006)
  k.box(p, 0.016, 0.07, 0.02, c.darkTrim, w / 2 - 0.05, y, d + 0.004)
  // The AED: a green rounded case, its yellow-green handle, the grey pad compartment, the shock button.
  const a = group(p, 0, y - 0.05, 0.1)
  sbox(e, a, 0.28, 0.27, 0.1, 0.03, c.greenCase, 0, 0, 0)
  sbox(e, a, 0.2, 0.05, 0.05, 0.02, c.yellowPad, 0, 0.16, 0)
  sbox(e, a, 0.2, 0.12, 0.012, 0.01, c.trim, 0, -0.04, 0.052)
  k.cyl(a, 0.022, 0.022, 0.008, m.red, 0.08, 0.06, 0.053, 20).rotation.x = PI / 2
  k.cyl(a, 0.016, 0.016, 0.008, c.ledAmber, -0.08, 0.06, 0.053, 20).rotation.x = PI / 2
  // The alarm module.
  sbox(e, p, 0.12, 0.05, 0.06, 0.012, c.darkTrim, 0, y + h / 2 + 0.025, 0.06)
  k.box(p, 0.02, 0.01, 0.004, m.red, 0.03, y + h / 2 + 0.03, 0.091, false)
  face(e, p, 0.36, 0.14, e.o.sign('aedSign2', 384, 150, (g, ww, hh) => {
    g.fillStyle = '#0f8a3c'
    g.fillRect(0, 0, ww, hh)
    // A heart with the lightning bolt, the letters beside it.
    g.fillStyle = '#ffffff'
    const cx = hh * 0.55
    const cy = hh * 0.52
    const s = hh * 0.3
    g.beginPath()
    g.moveTo(cx, cy + s)
    g.bezierCurveTo(cx - s * 1.6, cy, cx - s * 0.7, cy - s * 1.2, cx, cy - s * 0.45)
    g.bezierCurveTo(cx + s * 0.7, cy - s * 1.2, cx + s * 1.6, cy, cx, cy + s)
    g.fill()
    g.fillStyle = '#0f8a3c'
    g.beginPath()
    g.moveTo(cx + s * 0.1, cy - s * 0.6)
    g.lineTo(cx - s * 0.25, cy + s * 0.05)
    g.lineTo(cx + s * 0.05, cy + s * 0.05)
    g.lineTo(cx - s * 0.12, cy + s * 0.65)
    g.lineTo(cx + s * 0.3, cy - s * 0.1)
    g.lineTo(cx, cy - s * 0.1)
    g.closePath()
    g.fill()
    g.fillStyle = '#ffffff'
    g.font = SANS(hh * 0.42, 700)
    g.textBaseline = 'middle'
    g.fillText('AED', hh * 1.15, hh * 0.45)
    g.font = SANS(hh * 0.13, 500)
    g.fillText('DEFIBRILLATOR', hh * 1.15, hh * 0.78)
  }), 0, y + h / 2 + 0.17, 0.004)
}

/**
 * A slotted wall panel of splints: aluminium-backed foam finger splints, a rolled SAM splint,
 * padded Cramer wire splints, a Thomas splint with its ring, and soft and Philadelphia collars on
 * their hooks.
 */
export function splintRack(e: OpdCtx, p: Object3D, y = 1.2) {
  const { k, m } = e
  const c = cm(e)
  // The slat panel.
  k.box(p, 1.0, 1.0, 0.018, c.trim, 0, y + 0.1, 0.009)
  for (let i = 0; i < 9; i++) k.box(p, 1.0, 0.012, 0.022, c.darkTrim, 0, y - 0.35 + i * 0.11, 0.019, false)
  // Finger splints, a row hanging from a rail.
  for (let i = 0; i < 6; i++) {
    const f = group(p, -0.42 + i * 0.05, y + 0.38, 0.03)
    k.box(f, 0.022, 0.14 + (i % 3) * 0.03, 0.006, c.foamBlue, 0, -0.07, 0.003)
    k.box(f, 0.02, 0.14 + (i % 3) * 0.03, 0.002, m.aluminium, 0, -0.07, -0.002)
    k.box(f, 0.008, 0.02, 0.02, m.chrome, 0, 0.012, -0.005)
  }
  // A rolled SAM splint, orange, on a shelf bracket.
  k.box(p, 0.24, 0.012, 0.12, m.chrome, -0.32, y - 0.02, 0.07)
  const sam = put(p, lathe(e, 'samRoll', [[0.03, -0.055], [0.06, -0.055], [0.06, 0.055], [0.03, 0.055]], 22), c.orange, -0.32, y + 0.04, 0.08)
  sam.rotation.x = PI / 2
  // Cramer wire splints, padded, leaning in a ladder.
  for (let i = 0; i < 2; i++) {
    const cw = group(p, -0.06 + i * 0.09, y + 0.05, 0.03 + i * 0.01)
    k.box(cw, 0.08, 0.7, 0.008, c.beige, 0, 0, 0)
    for (let j = 0; j < 8; j++) k.box(cw, 0.082, 0.004, 0.01, m.aluminium, 0, -0.33 + j * 0.095, 0.002, false)
  }
  // The Thomas splint: the padded ring and the two side bars meeting at the foot.
  const th = group(p, 0.24, y - 0.33, 0.06)
  put(th, bentTube(e, 'thomas2', [[-0.09, 0, 0], [-0.09, 0.66, 0], [-0.07, 0.72, 0]], 0.007, 0.05), m.chrome)
  put(th, bentTube(e, 'thomas3', [[0.09, 0, 0], [0.09, 0.66, 0], [0.07, 0.72, 0]], 0.007, 0.05), m.chrome)
  put(th, bentTube(e, 'thomasFoot', [[-0.09, 0, 0], [-0.05, -0.05, 0], [0.05, -0.05, 0], [0.09, 0, 0]], 0.007, 0.03), m.chrome)
  const ring = put(th, ringGeo(e, 0.11, 0.022), c.upholDark, 0, 0.76, 0.0)
  ring.rotation.x = PI / 2 - 0.3
  // Cervical collars on hooks: a soft one (beige) and a two-piece Philadelphia (white, blue-edged).
  for (const [dx, mat] of [[0.42, c.beige], [0.42, c.shell]] as const) {
    const col = group(p, dx, mat === c.beige ? y + 0.4 : y + 0.12, 0.07)
    k.box(col, 0.02, 0.02, 0.06, m.chrome, 0, 0.07, -0.03, false)
    const cg = put(col, geo(e, 'collar', () => {
      const s = new Shape()
      s.absarc(0, 0, 0.075, -PI * 0.15, PI * 1.15, false)
      s.absarc(0, 0, 0.06, PI * 1.15, -PI * 0.15, true)
      const g2 = new ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.005, bevelSegments: 2, curveSegments: 14 })
      g2.translate(0, 0, -0.04)
      g2.rotateX(PI / 2)
      return g2
    }), mat, 0, 0, 0)
    cg.rotation.x = 0.5
  }
}

/* ---------- standing equipment ---------- */

/**
 * A plaster (POP) trolley: a stainless two-tier trolley with gallery rails, POP bandages in their
 * open cartons and cotton padding rolls on top, the plaster bucket of water with a strainer below,
 * plaster shears, and the oscillating cast cutter with its coiled flex.
 */
export function plasterTrolley(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const c = cm(e)
  const w = 0.8
  const d = 0.5
  trolleyFrame(e, p, w, d, [0.28, 0.86], true)
  // POP bandages: open cartons of 10 and 15 cm rolls, white in foil-ended rolls.
  for (const [dx, rr] of [[-0.25, 0.038], [-0.08, 0.048]] as const) {
    k.box(p, 0.16, 0.06, 0.24, c.beige, dx, 0.9, -0.08)
    for (let i = 0; i < 3; i++) {
      const r = put(p, lathe(e, `pop${rr}`, [[0.006, -0.05], [rr, -0.05], [rr, 0.05], [0.006, 0.05]], 18), m.paper, dx, 0.93 + rr * 0.3, -0.16 + i * 0.075)
      r.rotation.z = PI / 2
    }
  }
  // Cotton padding rolls, a stack.
  for (let i = 0; i < 3; i++) {
    const r = put(p, lathe(e, 'padRoll', [[0.01, -0.06], [0.045, -0.06], [0.048, -0.05], [0.048, 0.05], [0.045, 0.06], [0.01, 0.06]], 18), m.sheet, 0.14, 0.92 + (i % 2) * 0.09, -0.12 + (i > 1 ? 0.1 : 0))
    r.rotation.x = PI / 2
  }
  // Plaster shears: two long blades and the curved handles.
  const sh = group(p, 0.25, 0.89, 0.12, 0.3)
  for (const s of [-1, 1]) {
    k.box(sh, 0.12, 0.004, 0.012, m.chrome, 0.04, 0, s * 0.006, false).rotation.y = s * 0.05
    put(sh, bentTube(e, 'shearHandle', [[-0.02, 0, s * 0.008], [-0.1, 0, s * 0.03], [-0.17, 0, s * 0.02]], 0.006, 0.04), c.panel, 0, 0, 0, false)
  }
  // The bucket on the lower tier, its water, and the strainer.
  put(p, lathe(e, 'popBucket', [[0, 0], [0.13, 0], [0.155, 0.26], [0.16, 0.265], [0.16, 0.27], [0, 0.27]], 28), c.shell, -0.15, 0.295, 0.02)
  k.cyl(p, 0.148, 0.148, 0.004, m.water, -0.15, 0.5, 0.02, 28)
  // The cast cutter: the motor body with its round blade, lying on the lower tier, the flex coiled.
  const cc = group(p, 0.2, 0.3, 0.05, 0.4)
  put(cc, lathe(e, 'castCutter', [[0, 0], [0.032, 0.0], [0.036, 0.04], [0.034, 0.18], [0.024, 0.22], [0, 0.23]], 18), c.panel, 0, 0.035, 0).rotation.z = PI / 2
  k.cyl(cc, 0.03, 0.03, 0.002, m.stainless, 0.25, 0.035, 0, 24).rotation.x = PI / 2
  put(cc, bentTube(e, 'cutterFlex', [[-0.02, 0.03, 0], [-0.1, 0.02, 0.06], [-0.14, 0.01, -0.02], [-0.06, 0.01, -0.06]], 0.004, 0.03), c.darkTrim, 0, 0, 0, false)
}

/**
 * A stainless steel trolley: four round posts on twin-wheel castors (brakes at one end), flat
 * shelves at `levels`, a gallery rail round the top if asked, a push handle at the −x end.
 */
function trolleyFrame(e: OpdCtx, p: Object3D, w: number, d: number, levels: number[], gallery = false) {
  const { k, m } = e
  const top = levels[levels.length - 1]
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    put(p, lathe(e, `tpost${top}`, [[0, 0.07], [0.013, 0.07], [0.013, top + 0.005], [0.011, top + 0.012], [0, top + 0.012]], 14), m.stainless, sx * (w / 2 - 0.02), 0, sz * (d / 2 - 0.02))
    castor(e, p, sx * (w / 2 - 0.02), sz * (d / 2 - 0.02), 0.04, 0, sx < 0)
  }
  for (const y of levels) {
    put(p, slabGeo(e, `tshelf${w}|${d}`, rectPts(w, d), 0.012, 0.015, 0.003), m.stainless, 0, y - 0.012, 0)
    for (const s of [-1, 1]) k.box(p, w - 0.03, 0.025, 0.002, m.stainless, 0, y + 0.01, s * (d / 2 - 0.004), false)
  }
  if (gallery) {
    const rail = (pts: [number, number, number][], key: string) => put(p, bentTube(e, key, pts, 0.006, 0.03), m.stainless, 0, 0, 0, false)
    rail([[-w / 2 + 0.02, top + 0.06, -d / 2 + 0.02], [w / 2 - 0.02, top + 0.06, -d / 2 + 0.02], [w / 2 - 0.02, top + 0.06, d / 2 - 0.02], [-w / 2 + 0.02, top + 0.06, d / 2 - 0.02], [-w / 2 + 0.02, top + 0.06, -d / 2 + 0.02]], `gallery${w}|${d}|${top}`)
  }
  put(p, bentTube(e, `thandle${d}|${top}`, [[-w / 2 + 0.02, top - 0.05, -d / 2 + 0.06], [-w / 2 - 0.06, top + 0.05, -d / 2 + 0.06], [-w / 2 - 0.06, top + 0.05, d / 2 - 0.06], [-w / 2 + 0.02, top - 0.05, d / 2 - 0.06]], 0.011, 0.04), m.stainless, 0, 0, 0)
}

/**
 * A magnifying examination lamp on its mobile five-star stand: the column, the spring-balanced
 * double arm with its tension springs and knuckles, the round head with its 5-dioptre lens in a
 * ring of LEDs, the hinged dust cover open, the handle.
 */
export function magnifierLamp(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const c = cm(e)
  starBase(e, p, 0.28, 0.08, c.trim, 0.03)
  put(p, lathe(e, 'magCol', [[0, 0.1], [0.016, 0.1], [0.016, 1.02], [0.02, 1.03], [0.02, 1.07], [0, 1.07]], 16), c.shell)
  // The arm: two parallel tubes from the knuckle at the column to the knuckle at the head, the spring between.
  const arm = group(p, 0, 1.07, 0)
  arm.rotation.x = -0.25
  for (const dy of [0, 0.035]) put(arm, bentTube(e, `magArm${dy}`, [[0, dy, 0], [0, dy, 0.5]], 0.008, 0.02), c.shell, 0, 0, 0)
  put(arm, lathe(e, 'magSpring', geoSpringProfile(), 10), m.chrome, 0, 0.018, 0.1).rotation.x = PI / 2
  for (const z of [0, 0.5]) sbox(e, arm, 0.05, 0.07, 0.05, 0.015, c.shell, 0, 0.018, z)
  // The second arm, down to the head.
  const fore = group(arm, 0, 0.018, 0.5)
  fore.rotation.x = 0.9
  put(fore, bentTube(e, 'magFore', [[0, 0, 0], [0, 0, 0.3]], 0.009, 0.02), c.shell, 0, 0, 0)
  const head = group(fore, 0, -0.02, 0.38)
  head.rotation.x = -0.65
  put(head, lathe(e, 'magHead', [[0.072, -0.02], [0.115, -0.02], [0.122, -0.008], [0.122, 0.012], [0.112, 0.022], [0.072, 0.02]], 32), c.shell, 0, 0, 0)
  put(head, ringGeo(e, 0.094, 0.006), c.led, 0, -0.021, 0, false)
  e.k.cyl(head, 0.074, 0.074, 0.008, c.lens, 0, 0, 0, 32)
  k.box(head, 0.08, 0.02, 0.03, c.shell, 0, 0, 0.13)
  // The dust cover hinged open behind.
  const cover = group(head, 0, 0.022, -0.122)
  cover.rotation.x = -1.9
  put(cover, lathe(e, 'magCover', [[0, 0], [0.118, 0], [0.12, 0.008], [0, 0.01]], 32), c.shell, 0, 0, 0.12)
}

/** A short coil spring's profile for lathe (a stack of rings standing for the coils). */
function geoSpringProfile(): [number, number][] {
  const out: [number, number][] = [[0, 0]]
  for (let i = 0; i <= 18; i++) out.push([i % 2 ? 0.006 : 0.009, i * 0.012])
  out.push([0, 18 * 0.012])
  return out
}

/**
 * A liquid nitrogen dewar for cryotherapy: the 35 L aluminium vessel on its roller base, the
 * neck tube and cap, the carry handles; and the handheld 500 ml cryo spray unit (canister,
 * trigger, angled nozzle) parked in its holster on the dewar's side.
 */
export function cryoCanister(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const c = cm(e)
  // Roller base: a ring with four castors.
  put(p, lathe(e, 'dewarBase', [[0.16, 0.05], [0.23, 0.05], [0.23, 0.08], [0.16, 0.08]], 28), c.darkTrim)
  for (let i = 0; i < 4; i++) castor(e, p, Math.cos(i * PI / 2 + PI / 4) * 0.195, Math.sin(i * PI / 2 + PI / 4) * 0.195, 0.025)
  // The vessel: a rolled aluminium body with its ribs, the shoulder, the neck tube and its cap.
  put(p, lathe(e, 'dewar2', [[0, 0.08], [0.19, 0.08], [0.205, 0.1], [0.205, 0.48], [0.19, 0.56], [0.12, 0.64], [0.06, 0.66], [0.045, 0.7], [0, 0.7]], 32), m.aluminium)
  for (const y of [0.2, 0.36]) put(p, ringGeo(e, 0.206, 0.006), m.aluminium, 0, y, 0, false)
  put(p, lathe(e, 'dewarCap', [[0, 0.7], [0.05, 0.7], [0.055, 0.73], [0.04, 0.76], [0, 0.765]], 20), c.panel)
  // Carry handles at the shoulder.
  for (const s of [-1, 1]) put(p, bentTube(e, `dewarHandle${s}`, [[s * 0.14, 0.6, -0.06], [s * 0.18, 0.66, -0.04], [s * 0.18, 0.66, 0.04], [s * 0.14, 0.6, 0.06]], 0.008, 0.02), c.panel, 0, 0, 0)
  // The handheld cryo spray in its holster on the side.
  const h = group(p, 0, 0.42, 0.205)
  k.box(h, 0.09, 0.06, 0.03, c.darkTrim, 0, -0.06, 0.015)
  put(h, lathe(e, 'cryoCan', [[0, -0.12], [0.034, -0.12], [0.036, -0.1], [0.036, 0.05], [0.025, 0.07], [0.015, 0.08], [0, 0.08]], 22), m.stainless, 0, 0, 0.05)
  sbox(e, h, 0.03, 0.05, 0.05, 0.01, c.panel, 0, 0.1, 0.05)
  const trig = k.box(h, 0.012, 0.06, 0.012, c.darkTrim, 0, 0.07, 0.085)
  trig.rotation.x = -0.4
  put(h, bentTube(e, 'cryoNozzle', [[0, 0.11, 0.05], [0, 0.13, 0.1], [0, 0.11, 0.15]], 0.004, 0.02), m.chrome, 0, 0, 0, false)
}

/**
 * The electrosurgical (radiofrequency) unit on its trolley: a white trolley with a handle and two
 * shelves on castors; the generator with its lit CUT and COAG readouts, keys and output sockets;
 * the handpiece in its holster, the neutral plate cable, and the two-pedal footswitch on its lead.
 */
export function cauteryTrolley(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const c = cm(e)
  // The trolley: a moulded column frame, two shelves.
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * 0.19, sz * 0.17, 0.04, 0, sz > 0)
  sbox(e, p, 0.44, 0.04, 0.4, 0.012, c.trim, 0, 0.11, 0)
  for (const sx of [-1, 1]) put(p, lathe(e, 'esuPost', [[0, 0], [0.016, 0], [0.016, 0.78], [0, 0.78]], 14), c.trim, sx * 0.17, 0.12, -0.15)
  sbox(e, p, 0.44, 0.03, 0.4, 0.012, c.shell, 0, 0.5, 0)
  sbox(e, p, 0.44, 0.03, 0.4, 0.012, c.shell, 0, 0.83, 0)
  put(p, bentTube(e, 'esuHandle', [[-0.17, 0.92, -0.2], [-0.17, 1.0, -0.24], [0.17, 1.0, -0.24], [0.17, 0.92, -0.2]], 0.01, 0.04), c.trim)
  // The generator.
  sbox(e, p, 0.38, 0.14, 0.34, 0.02, c.housing, 0, 0.915, 0.0)
  const f = k.box(p, 0.33, 0.1, 0.004, e.o.screen('esu', 256, 80, esuPaint, 0.75), 0, 0.915, 0.171, false)
  f.castShadow = false
  for (let i = 0; i < 4; i++) {
    const col = [m.sharps, m.blue, c.trim, c.trim][i]
    k.cyl(p, 0.009, 0.009, 0.01, col, 0.075 + i * 0.025, 0.885, 0.172, 14).rotation.x = PI / 2
  }
  k.box(p, 0.06, 0.06, 0.12, c.panel, 0, 0.25, 0.02)
  // The pencil in its holster, the neutral plate on the lower shelf, the footswitch.
  const hol = group(p, 0.22, 0.85, 0.05)
  k.box(hol, 0.03, 0.1, 0.03, c.panel, 0, -0.03, 0)
  put(hol, lathe(e, 'esuPencil', [[0, -0.1], [0.008, -0.08], [0.009, 0.06], [0.006, 0.08], [0, 0.11]], 12), c.housing, 0, 0.04, 0)
  put(p, bentTube(e, 'esuLead', [[0.19, 0.84, 0.05], [0.25, 0.7, 0.1], [0.2, 0.55, 0.12], [0.1, 0.52, 0.06]], 0.004, 0.03), c.darkTrim, 0, 0, 0, false)
  k.box(p, 0.12, 0.004, 0.18, c.panel, -0.1, 0.517, 0.04, false)
  const fs = group(p, 0.05, 0, 0.4, -0.2)
  sbox(e, fs, 0.26, 0.05, 0.18, 0.02, c.darkTrim, 0, 0.025, 0)
  for (const [dx, col] of [[-0.06, m.sharps], [0.06, m.blue]] as const) {
    const ped = sbox(e, fs, 0.09, 0.025, 0.12, 0.01, col, dx, 0.06, 0.01)
    ped.rotation.x = 0.12
  }
  put(p, bentTube(e, 'esuFoot', [[0.05, 0.02, 0.32], [0.08, 0.02, 0.2], [0.1, 0.2, 0.05], [0.1, 0.25, 0.0]], 0.004, 0.04), c.darkTrim, 0, 0, 0, false)
}

/**
 * A gynaecological examination chair: a moulded base and lift column in its bellows, the seat
 * section with its U cut-out over the stainless drainage bowl on its slide, the backrest raised on
 * its gas spring with the head cushion and the paper roll, side rails, two Goepel leg holders
 * (padded cradles on clamped, swivelling posts), the pull-out step and the hand control.
 * Along local x, the head at −x.
 */
export function gyneTable(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const c = cm(e)
  // Base and column.
  put(p, slabGeo(e, 'gyneBase', [[-0.42, -0.27], [0.38, -0.27], [0.38, 0.27], [-0.42, 0.27]], 0.05, 0.08, 0.015), c.trim, -0.02, 0, 0)
  for (const [x, z] of [[-0.38, -0.23], [-0.38, 0.23], [0.34, -0.23], [0.34, 0.23]]) k.cyl(p, 0.025, 0.028, 0.012, c.rubber, x, 0.006, z, 14)
  put(p, bellowsGeo(e, 0.11, 0.05, 0.5, 8), c.darkTrim, 0.0, 0, 0)
  sbox(e, p, 0.3, 0.12, 0.26, 0.04, c.shell, 0.0, 0.11, 0)
  // The seat carriage under the seat.
  sbox(e, p, 0.62, 0.1, 0.5, 0.03, c.shell, 0.06, 0.55, 0)
  // Seat cushion with its U cut-out at the foot end.
  const seat: [number, number][] = [[-0.26, -0.29], [0.32, -0.29], [0.32, -0.12], [0.16, -0.12], [0.16, 0.12], [0.32, 0.12], [0.32, 0.29], [-0.26, 0.29]]
  put(p, slabGeo(e, 'gyneSeat', seat, 0.08, 0.04, 0.025), c.uphol, 0.02, 0.6, 0)
  // The drainage bowl under the cut-out, on its slide.
  put(p, lathe(e, 'gyneBowl', [[0, 0], [0.09, 0.0], [0.13, 0.05], [0.14, 0.06], [0.14, 0.065], [0, 0.065]], 24), m.stainless, 0.26, 0.5, 0).scale.set(1, 1, 0.85)
  for (const s of [-1, 1]) k.box(p, 0.3, 0.012, 0.012, m.stainless, 0.24, 0.54, s * 0.12, false)
  // Side rails, the leg holders clamped on them.
  for (const s of [-1, 1]) {
    k.box(p, 0.6, 0.03, 0.01, m.stainless, 0.04, 0.63, s * 0.305)
    for (const x of [-0.22, 0.3]) k.box(p, 0.02, 0.03, 0.025, m.stainless, x, 0.63, s * 0.293, false)
    const clamp = group(p, 0.24, 0.63, s * 0.322)
    sbox(e, clamp, 0.07, 0.07, 0.04, 0.01, c.darkTrim, 0, 0, 0)
    k.cyl(clamp, 0.014, 0.014, 0.04, c.darkTrim, 0, 0, s * 0.03, 14).rotation.x = PI / 2
    // The post angled up and out, the cradle at its top tilted along the thigh.
    put(clamp, bentTube(e, `goepel${s}`, [[0, 0.02, s * 0.03], [0.08, 0.22, s * 0.06], [0.16, 0.38, s * 0.08]], 0.013, 0.08), m.chrome, 0, 0, 0)
    const crad = group(clamp, 0.2, 0.43, s * 0.08)
    crad.rotation.z = 0.5
    put(crad, cradleGeo(e, 0.075, 0.03, 0.36), c.upholDark, 0, 0.075, 0)
    k.cyl(crad, 0.018, 0.018, 0.04, c.darkTrim, 0, 0.0, 0, 12)
  }
  // The backrest: its frame and cushion raised, the head cushion; the gas spring under it.
  const back = group(p, -0.24, 0.66, 0)
  back.rotation.z = -0.62
  sbox(e, back, 0.74, 0.04, 0.5, 0.015, c.shell, -0.38, -0.01, 0)
  put(back, slabGeo(e, 'gyneBack', rectPts(0.72, 0.58), 0.08, 0.05, 0.025), c.uphol, -0.37, 0.01, 0)
  put(back, slabGeo(e, 'gyneHead', rectPts(0.24, 0.4), 0.07, 0.06, 0.025), c.uphol, -0.88, 0.04, 0)
  for (const s of [-1, 1]) k.box(back, 0.7, 0.03, 0.01, m.stainless, -0.38, 0.02, s * 0.3)
  // The paper roll on its holder at the head.
  for (const s of [-1, 1]) k.box(back, 0.03, 0.07, 0.012, m.stainless, -1.0, 0.02, s * 0.29, false)
  put(back, lathe(e, 'gyneRoll2', [[0.012, -0.27], [0.045, -0.27], [0.045, 0.27], [0.012, 0.27]], 20), c.paperRoll, -1.02, 0.06, 0).rotation.x = PI / 2
  // Couch paper laid down the backrest and seat.
  k.box(back, 0.86, 0.003, 0.5, m.paper, -0.5, 0.093, 0, false)
  const gs = put(p, lathe(e, 'gasSpring', [[0, 0], [0.012, 0], [0.012, 0.22], [0.008, 0.22], [0.008, 0.36], [0, 0.36]], 12), m.chrome, -0.36, 0.45, 0)
  gs.rotation.z = 0.9
  // The pull-out step at the foot, its rubber tread.
  sbox(e, p, 0.2, 0.04, 0.46, 0.012, c.shell, 0.48, 0.24, 0)
  k.box(p, 0.16, 0.004, 0.4, c.rubber, 0.48, 0.262, 0, false)
  // The hand control hung on the rail.
  const hc = group(p, -0.05, 0.6, 0.33)
  sbox(e, hc, 0.05, 0.13, 0.025, 0.01, c.shell, 0, -0.07, 0.012)
  for (let i = 0; i < 4; i++) k.box(hc, 0.016, 0.016, 0.003, c.trim, (i % 2 ? 0.01 : -0.01), -0.05 - Math.floor(i / 2) * 0.025, 0.026, false)
  put(hc, bentTube(e, 'gyneCord', [[0, -0.14, 0.01], [0.02, -0.25, 0.0], [0.08, -0.2, -0.02], [0.1, -0.05, -0.04]], 0.003, 0.03), c.darkTrim, 0, 0, 0, false)
}

/**
 * A paediatric examination couch, 1.5 m: a powder-coated frame with a storage shelf, a one-piece
 * upholstered top in soft aqua with the head section raised, folding side guard rails, the paper
 * roll on its holder at the foot. Along local x, the head at −x.
 */
export function paedCouch(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const c = cm(e)
  for (const s of [-1, 1]) put(p, bentTube(e, 'paedLeg2', [[-0.68, 0.0, 0], [-0.68, 0.62, 0], [0.68, 0.62, 0], [0.68, 0.0, 0]], 0.019, 0.05), c.trim, 0, 0, s * 0.25)
  for (const x of [-0.68, 0.68]) {
    rod(e, p, 0.016, 0.5, c.trim, x, 0.22, 0, 'z', 10)
    for (const s of [-1, 1]) k.cyl(p, 0.022, 0.024, 0.02, c.rubber, x, 0.01, s * 0.25, 12)
  }
  sbox(e, p, 1.3, 0.02, 0.46, 0.01, c.shell, 0, 0.22, 0)
  sbox(e, p, 1.42, 0.03, 0.58, 0.01, c.shell, 0, 0.635, 0)
  put(p, slabGeo(e, 'paedTop', rectPts(0.98, 0.62), 0.075, 0.05, 0.025), c.upholAqua, 0.2, 0.65, 0)
  const head = group(p, -0.3, 0.66, 0)
  head.rotation.z = -0.28
  put(head, slabGeo(e, 'paedHead', rectPts(0.44, 0.62), 0.075, 0.05, 0.025), c.upholAqua, -0.22, 0, 0)
  for (const s of [-1, 1]) {
    put(p, bentTube(e, 'paedRail2', [[-0.25, 0.7, 0], [-0.25, 0.9, 0], [0.55, 0.9, 0], [0.55, 0.7, 0]], 0.011, 0.04), m.chrome, 0, 0, s * 0.325)
    for (const x of [-0.12, 0.05, 0.22, 0.39]) rod(e, p, 0.006, 0.19, m.chrome, x, 0.8, s * 0.325, 'x', 6).rotation.z = PI / 2
  }
  for (const s of [-1, 1]) k.box(p, 0.03, 0.07, 0.012, m.stainless, 0.72, 0.62, s * 0.27, false)
  put(p, lathe(e, 'paedRoll2', [[0.012, -0.25], [0.04, -0.25], [0.04, 0.25], [0.012, 0.25]], 20), c.paperRoll, 0.74, 0.6, 0).rotation.x = PI / 2
  k.box(p, 0.7, 0.003, 0.5, m.paper, 0.32, 0.727, 0, false)
}

/**
 * A digital infant weighing scale on a surface at (x, y, z): the moulded base with its display and
 * keys, the curved weighing tray on it, a folded cloth in the tray.
 */
export function infantScale(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const c = cm(e)
  const g = group(p, x, y, z, ry)
  put(g, slabGeo(e, 'infBase', [[-0.27, -0.16], [0.27, -0.16], [0.27, 0.16], [-0.27, 0.16]], 0.055, 0.06, 0.02), c.housing, 0, 0, 0, false)
  k.box(g, 0.09, 0.03, 0.004, e.o.screen('infantKg2', 96, 32, lcd(['3.420 kg'], '#c9dbe6', '#0b2236')), 0.17, 0.033, 0.162, false).rotation.x = -0.15
  for (let i = 0; i < 3; i++) k.cyl(g, 0.006, 0.006, 0.004, c.trim, 0.05 + i * 0.025, 0.054, 0.12, 12)
  // The tray: a dished shell (a lathe of a shallow bowl stretched long).
  const tray = put(g, lathe(e, 'infTray', [[0, 0.0], [0.12, 0.0], [0.15, 0.02], [0.155, 0.06], [0.15, 0.065], [0.14, 0.06], [0.12, 0.02], [0, 0.015]], 32), c.shell, -0.02, 0.06, 0, false)
  tray.scale.set(1.75, 1, 1)
  k.soft(g, 0.32, 0.012, 0.16, 0.006, m.blanket, -0.02, 0.085, 0)
  return g
}

/** An infantometer on a surface at (x, y, z): the board with its tape, the fixed headboard and the sliding footboard on its track. */
export function infantometer(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k } = e
  const c = cm(e)
  const g = group(p, x, y, z, ry)
  put(g, slabGeo(e, 'infBoard', rectPts(0.9, 0.3), 0.022, 0.03, 0.006), c.shell, 0, 0, 0, false)
  k.box(g, 0.86, 0.002, 0.03, e.o.sign('tape2', 512, 18, (cc, w, h) => {
    cc.fillStyle = '#ffd23f'
    cc.fillRect(0, 0, w, h)
    cc.fillStyle = '#111'
    for (let i = 0; i < 180; i++) cc.fillRect((i / 180) * w, 0, 1, i % 10 ? h * 0.35 : h * 0.75)
  }), 0, 0.023, 0.11, false)
  put(g, slabGeo(e, 'infHead', rectPts(0.025, 0.3), 0.18, 0.012, 0.005), c.shell, -0.44, 0.02, 0, false)
  for (const s of [-1, 1]) k.box(g, 0.86, 0.01, 0.012, c.trim, 0, 0.026, s * 0.14, false)
  const foot = group(g, 0.18, 0.02, 0)
  put(foot, slabGeo(e, 'infFoot', rectPts(0.022, 0.28), 0.13, 0.01, 0.005), c.upholAqua, 0, 0, 0, false)
  k.box(foot, 0.05, 0.02, 0.3, c.trim, 0.02, 0.01, 0, false)
  return g
}

/** A compressor nebuliser on a surface at (x, y, z): the housing with its carry handle and switch, the tubing, the cup and a child's mask. */
export function nebuliser(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const c = cm(e)
  const g = group(p, x, y, z, ry)
  put(g, slabGeo(e, 'nebBody', [[-0.1, -0.08], [0.1, -0.08], [0.09, 0.08], [-0.09, 0.08]], 0.095, 0.04, 0.02), c.housing, 0, 0, 0, false)
  put(g, bentTube(e, 'nebHandle', [[-0.06, 0.09, -0.02], [-0.05, 0.13, -0.02], [0.05, 0.13, -0.02], [0.06, 0.09, -0.02]], 0.008, 0.02), c.trim, 0, 0, 0, false)
  k.box(g, 0.03, 0.018, 0.004, c.trim, 0.05, 0.06, 0.081, false)
  k.cyl(g, 0.006, 0.006, 0.004, c.ledGreen, 0.02, 0.06, 0.081, 10).rotation.x = PI / 2
  for (let i = 0; i < 6; i++) k.box(g, 0.004, 0.04, 0.004, c.trim, -0.07 + i * 0.012, 0.05, 0.081, false)
  put(g, bentTube(e, 'nebTube2', [[-0.08, 0.05, 0.08], [-0.13, 0.02, 0.13], [-0.02, 0.008, 0.2], [0.1, 0.01, 0.16]], 0.0035, 0.03), m.tubing, 0, 0, 0, false)
  const cup = group(g, 0.13, 0.0, 0.14)
  put(cup, lathe(e, 'nebCup', [[0, 0], [0.018, 0], [0.022, 0.04], [0.012, 0.06], [0.006, 0.07], [0, 0.07]], 16), c.jar, 0, 0, 0, false)
  put(cup, lathe(e, 'nebMask', [[0, 0.07], [0.012, 0.072], [0.04, 0.09], [0.042, 0.1]], 20), m.mask, 0, 0, 0, false)
  return g
}

/** A child's activity table, white laminate with rounded corners on beech legs, and two low moulded chairs. */
export function kidsTable(e: OpdCtx, p: Object3D) {
  const { k } = e
  const c = cm(e)
  put(p, slabGeo(e, 'kidsTop', rectPts(0.7, 0.5), 0.025, 0.08, 0.008), c.shell, 0, 0.48, 0)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(p, lathe(e, 'kidsLeg', [[0, 0], [0.018, 0], [0.022, 0.48], [0, 0.48]], 12), c.wood, sx * 0.28, 0, sz * 0.18)
  for (const s of [-1, 1]) {
    const ch = group(p, s * 0.55, 0, 0, -s * PI / 2)
    put(ch, slabGeo(e, 'kidsSeat', [[-0.15, -0.15], [0.15, -0.15], [0.14, 0.15], [-0.14, 0.15]], 0.025, 0.04, 0.01), c.upholAqua, 0, 0.28, 0)
    const back = put(ch, slabGeo(e, 'kidsBack', rectPts(0.28, 0.025), 0.2, 0.012, 0.008), c.upholAqua, 0, 0.32, -0.15)
    back.rotation.x = -0.1
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(ch, lathe(e, 'kidsChairLeg', [[0, 0], [0.012, 0], [0.014, 0.28], [0, 0.28]], 10), c.wood, sx * 0.12, 0, sz * 0.12)
    k.cyl(ch, 0.01, 0.01, 0.005, c.rubber, 0, 0.0, 0, 8)
  }
}

/** A low lidded toy box in a corner, wooden blocks on it: kept tidy, washable. */
export function toyCrate(e: OpdCtx, p: Object3D) {
  const { m } = e
  const c = cm(e)
  put(p, slabGeo(e, 'toyBox', rectPts(0.5, 0.36), 0.3, 0.03, 0.01), c.upholAqua, 0, 0, 0)
  put(p, slabGeo(e, 'toyLid', rectPts(0.52, 0.38), 0.025, 0.03, 0.008), c.shell, 0, 0.3, 0)
  const cols: Material[] = [m.red, c.pastelYellow, m.green, m.blue]
  for (let i = 0; i < 5; i++) put(p, slabGeo(e, 'block', rectPts(0.055, 0.055), 0.055, 0.006, 0.004), cols[i % 4], -0.16 + i * 0.075, 0.325 + (i === 2 ? 0.055 : 0), -0.04 + (i % 2) * 0.07).rotation.y = i * 0.35
}

/**
 * The ENT treatment unit, 1.2 m: a white modular cabinet with a solid-surface worktop; on it the
 * instrument tray rack (stainless trays of aural and nasal specula, tongue depressors, Tilley's and
 * Hartmann forceps), the three spray guns and the two suction handpieces in their holsters with
 * their hoses, the LED cold light source with its fibre cable, the endoscope holder with two
 * rigid scopes; the twin suction canisters on the side; the endoscopy monitor on its articulated
 * arm; two drawers and a door that open.
 */
export function entUnit(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const c = cm(e)
  const w = 1.2
  const d = 0.55
  carcass(e, p, w, 0.86, d, c.shell, [0.4], 0.08)
  k.box(p, w - 0.04, 0.012, 0.006, c.trim, 0, 0.84, 0.003, false)
  const fill = packs(e, [m.whitePlastic, m.blue, m.paper], [0.08, 0.04, 0.1])
  for (let i = 0; i < 2; i++) drawer(e, p, -w / 4, 0.74 - i * 0.2, 0, { w: w / 2 - 0.006, h: 0.19, d: d - 0.04, front: c.shell, handle: 'grip', label: 'ENT Unit Drawer', fill })
  cupboardDoor(e, p, w / 2 - 0.002, 0.46, 0, { w: w / 2 - 0.004, h: 0.75, hinge: 'right', face: c.shell, label: 'ENT Unit Cupboard', angle: 1.6 })
  carcass(e, group(p, -w / 4, 0, 0), w / 2 - 0.02, 0.36, d - 0.02, c.shell, [], 0.08)
  // Worktop: solid surface with a rounded front, a raised rear upstand carrying the instrument rack.
  put(p, slabGeo(e, 'entTop', [[-w / 2 - 0.01, -d - 0.01], [w / 2 + 0.01, -d - 0.01], [w / 2 + 0.01, 0.03], [-w / 2 - 0.01, 0.03]], 0.035, 0.03, 0.012), m.solidSurface, 0, 0.86, 0)
  sbox(e, p, w, 0.32, 0.12, 0.02, c.shell, 0, 1.05, -d + 0.06)
  // Instrument trays in the upstand: four stainless trays of instruments, angled to the doctor.
  for (let i = 0; i < 4; i++) {
    const t = group(p, -0.42 + i * 0.23, 1.05, -d + 0.13)
    t.rotation.x = -0.5
    trayBase(e, t, 0.2, 0.12, 0.02)
    for (let j = 0; j < 6; j++) {
      const inst = j % 3 === 0 ? put(t, lathe(e, 'auralSpec', [[0, 0], [0.004, 0], [0.012, 0.04], [0.013, 0.045], [0, 0.045]], 12), m.chrome, -0.075 + j * 0.03, 0.012, 0.02, false) : rod(e, t, 0.0025, 0.14, m.chrome, -0.075 + j * 0.03, 0.01, 0, 'z', 6)
      inst.rotation.x = PI / 2
    }
  }
  // Spray guns and suction handpieces in their holsters on the right, hoses looping down.
  for (let i = 0; i < 5; i++) {
    const hx = 0.12 + i * 0.09
    sbox(e, p, 0.05, 0.08, 0.05, 0.012, c.trim, hx, 0.94, -0.05)
    const tool = group(p, hx, 0.98, -0.05)
    tool.rotation.x = -0.35
    if (i < 3) {
      put(tool, lathe(e, 'sprayGun', [[0, 0], [0.012, 0], [0.014, 0.08], [0.008, 0.1], [0.003, 0.17], [0, 0.17]], 12), i === 0 ? c.housing : i === 1 ? m.chrome : c.darkTrim, 0, 0, 0, false)
    } else {
      put(tool, lathe(e, 'suctionTip', [[0, 0], [0.01, 0], [0.011, 0.09], [0.004, 0.11], [0.002, 0.2], [0, 0.2]], 12), m.chrome, 0, 0, 0, false)
    }
    put(p, bentTube(e, `entHose${i}`, [[hx, 0.92, -0.02], [hx + 0.02, 0.78, 0.06], [hx - 0.01, 0.66, 0.05], [hx + 0.02, 0.6, -0.1]], 0.006, 0.03), i < 3 ? c.trim : m.tubing, 0, 0, 0, false)
  }
  // The cold light source and its fibre cable to the scope holder.
  sbox(e, p, 0.3, 0.1, 0.28, 0.015, c.panel, -0.38, 0.95, -0.26)
  k.box(p, 0.16, 0.045, 0.004, e.o.screen('ledSource2', 128, 36, lcd(['LED  85 %', '◀  ▶'], '#0b1a2a', '#7fe3ff')), -0.42, 0.955, -0.119, false)
  k.cyl(p, 0.014, 0.014, 0.01, c.trim, -0.27, 0.95, -0.118, 14).rotation.x = PI / 2
  put(p, bentTube(e, 'fibre', [[-0.27, 0.95, -0.11], [-0.2, 0.92, 0.02], [-0.06, 0.97, -0.02], [-0.02, 1.06, -0.18]], 0.0045, 0.04), c.darkTrim, 0, 0, 0, false)
  // The scope holder: two rigid endoscopes standing in a block.
  sbox(e, p, 0.1, 0.05, 0.06, 0.01, c.trim, -0.02, 0.9, -0.18)
  for (const dx of [-0.025, 0.025]) {
    rod(e, p, 0.002, 0.18, m.chrome, -0.02 + dx, 1.0, -0.18, 'z', 8).rotation.x = 0
    put(p, lathe(e, 'scopeEye', [[0, 0], [0.008, 0], [0.012, 0.03], [0.014, 0.04], [0, 0.04]], 14), m.chrome, -0.02 + dx, 1.09, -0.18, false)
  }
  // The suction canisters on the side bracket.
  sbox(e, p, 0.08, 0.3, 0.22, 0.012, c.trim, w / 2 + 0.04, 0.68, -0.22)
  for (const dz of [-0.28, -0.16]) {
    put(p, lathe(e, 'canister', [[0, 0], [0.05, 0], [0.055, 0.02], [0.055, 0.2], [0.05, 0.21], [0, 0.21]], 20), c.jar, w / 2 + 0.13, 0.62, dz)
    k.cyl(p, 0.05, 0.05, 0.05, c.fluid, w / 2 + 0.13, 0.65, dz, 18)
    put(p, lathe(e, 'canLid', [[0, 0], [0.057, 0], [0.057, 0.025], [0.02, 0.03], [0, 0.03]], 20), m.blue, w / 2 + 0.13, 0.83, dz)
  }
  // The endoscopy monitor on its articulated arm from the upstand's left end.
  put(p, lathe(e, 'entPole', [[0, 0], [0.02, 0], [0.02, 0.62], [0, 0.62]], 14), c.shell, -w / 2 + 0.06, 1.2, -d + 0.06)
  const a1 = group(p, -w / 2 + 0.06, 1.78, -d + 0.06, 0.6)
  put(a1, bentTube(e, 'entArm1', [[0, 0, 0], [0, 0, 0.32]], 0.016, 0.02), c.shell, 0, 0, 0)
  sbox(e, a1, 0.05, 0.06, 0.05, 0.015, c.shell, 0, 0, 0.32)
  const mon = group(a1, 0, 0, 0.36, -0.9)
  sbox(e, mon, 0.08, 0.08, 0.04, 0.01, c.darkTrim, 0, 0, 0.0)
  sbox(e, mon, 0.52, 0.33, 0.045, 0.012, m.black, 0, 0, 0.04)
  face(e, mon, 0.49, 0.29, e.o.screen('entScope2', 384, 228, scopePaint), 0, 0.005, 0.0632)
}

/**
 * A motorised ENT examination chair: a round steel base under a moulded cover, the lift column in
 * its bellows, a seat and back in moulded white shells with seamless upholstered pads, an
 * adjustable headrest on its chrome bar, armrests on stalks, the integrated footrest with its
 * tread, and the foot control on its cable; it faces +z.
 */
export function entChair(e: OpdCtx, p: Object3D) {
  const { k } = e
  const c = cm(e)
  put(p, lathe(e, 'entBase', [[0, 0], [0.32, 0], [0.33, 0.012], [0.3, 0.05], [0.12, 0.08], [0, 0.08]], 32), c.trim)
  put(p, bellowsGeo(e, 0.1, 0.08, 0.38, 6), c.darkTrim)
  put(p, lathe(e, 'entCollar', [[0, 0.36], [0.13, 0.36], [0.14, 0.4], [0.12, 0.43], [0, 0.43]], 24), c.shell)
  // Seat shell and pad.
  put(p, slabGeo(e, 'entSeatShell', [[-0.27, -0.25], [0.27, -0.25], [0.29, 0.25], [-0.29, 0.25]], 0.07, 0.07, 0.02), c.shell, 0, 0.42, 0.02)
  put(p, slabGeo(e, 'entSeatPad', [[-0.24, -0.22], [0.24, -0.22], [0.26, 0.23], [-0.26, 0.23]], 0.075, 0.06, 0.03), c.uphol, 0, 0.48, 0.02)
  // Back shell and pad, reclined a little.
  const back = group(p, 0, 0.5, -0.22)
  back.rotation.x = -0.16
  put(back, geoUpright(e, 'entBackShell', [[-0.26, 0], [0.26, 0], [0.24, 0.66], [-0.24, 0.66]], 0.07, 0.07), c.shell, 0, 0, -0.04)
  put(back, geoUpright(e, 'entBackPad', [[-0.23, 0.04], [0.23, 0.04], [0.21, 0.62], [-0.21, 0.62]], 0.07, 0.05), c.uphol, 0, 0, 0.02)
  // The headrest on its bar.
  k.box(back, 0.04, 0.14, 0.03, c.trim, 0, 0.7, -0.03)
  put(back, geoUpright(e, 'entHeadPad', [[-0.13, 0], [0.13, 0], [0.12, 0.13], [-0.12, 0.13]], 0.08, 0.05), c.uphol, 0, 0.74, 0.01)
  // Armrests on their stalks.
  for (const s of [-1, 1]) {
    sbox(e, p, 0.05, 0.16, 0.05, 0.012, c.shell, s * 0.3, 0.58, -0.1)
    put(p, slabGeo(e, 'entArm', rectPts(0.075, 0.36), 0.05, 0.03, 0.018), c.upholDark, s * 0.3, 0.66, 0.0)
  }
  // The footrest, moulded, with its rubber tread.
  const fr = group(p, 0, 0.42, 0.25)
  fr.rotation.x = 0.85
  put(fr, slabGeo(e, 'entFoot', rectPts(0.46, 0.36), 0.04, 0.05, 0.015), c.shell, 0, 0, 0.18)
  k.box(fr, 0.38, 0.004, 0.24, c.rubber, 0, 0.042, 0.22, false)
  // The foot control on the floor, its cable to the base.
  const fc = group(p, 0.38, 0, 0.36, -0.3)
  put(fc, slabGeo(e, 'entFootCtl', [[-0.12, -0.08], [0.12, -0.08], [0.1, 0.08], [-0.1, 0.08]], 0.04, 0.03, 0.012), c.darkTrim, 0, 0, 0)
  for (const dx of [-0.05, 0.05]) k.box(fc, 0.06, 0.006, 0.08, c.trim, dx, 0.043, 0.01, false)
  put(p, bentTube(e, 'entFootCable', [[0.3, 0.01, 0.3], [0.2, 0.01, 0.22], [0.1, 0.01, 0.12], [0.05, 0.04, 0.05]], 0.004, 0.04), c.darkTrim, 0, 0, 0, false)
}

/** An upright moulded slab (a chair back, a headrest) of the outline (x, y), `t` thick along z, soft-edged. */
function geoUpright(e: OpdCtx, key: string, pts: [number, number][], t: number, r: number) {
  return geo(e, `upr${key}`, () => {
    const s = new Shape()
    const P = pts.map(([x, y]) => new Vector2(x, y))
    const n = P.length
    for (let i = 0; i < n; i++) {
      const a = P[(i + n - 1) % n]
      const b = P[i]
      const cc = P[(i + 1) % n]
      const ab = b.clone().sub(a)
      const bc = cc.clone().sub(b)
      const p0 = b.clone().sub(ab.normalize().multiplyScalar(Math.min(r, ab.length() / 2)))
      const p1 = b.clone().add(bc.normalize().multiplyScalar(Math.min(r, bc.length() / 2)))
      if (i === 0) s.moveTo(p0.x, p0.y)
      else s.lineTo(p0.x, p0.y)
      s.quadraticCurveTo(b.x, b.y, p1.x, p1.y)
    }
    const bv = Math.min(0.02, t / 2.4)
    const g = new ExtrudeGeometry(s, { depth: t - 2 * bv, bevelEnabled: true, bevelThickness: bv, bevelSize: bv * 0.9, bevelSegments: 3, curveSegments: 6 })
    g.translate(0, 0, -(t - 2 * bv) / 2)
    return g
  })
}

/**
 * A 12-channel resting ECG on its trolley: a five-castor base, the column and its basket, the
 * tilted top with a rail; the electrocardiograph with its colour screen, membrane keyboard and the
 * Z-fold thermal paper coming out; the patient cable on its articulated arm with the ten lead wires
 * hanging in their colours and their clips.
 */
export function ecgTrolley(e: OpdCtx, p: Object3D, screen: Material) {
  const { k, m } = e
  const c = cm(e)
  starBase(e, p, 0.27, 0.08, c.trim, 0.035)
  put(p, lathe(e, 'ecgCol', [[0, 0.1], [0.028, 0.1], [0.028, 0.8], [0, 0.8]], 16), c.shell)
  sbox(e, p, 0.36, 0.14, 0.26, 0.02, c.trim, 0, 0.42, 0.02)
  // The top shelf, tilted toward the user, and its rail.
  const top = group(p, 0, 0.82, 0)
  top.rotation.x = 0.1
  put(top, slabGeo(e, 'ecgShelf', rectPts(0.44, 0.38), 0.025, 0.03, 0.01), c.shell, 0, 0, 0)
  put(top, bentTube(e, 'ecgRail', [[-0.2, 0.025, -0.17], [-0.2, 0.08, -0.17], [0.2, 0.08, -0.17], [0.2, 0.025, -0.17]], 0.008, 0.02), c.trim, 0, 0, 0)
  // The recorder: body, the screen hinged up, keys, the paper outlet with paper.
  const r = group(top, 0, 0.025, 0.02)
  put(r, slabGeo(e, 'ecgBody', rectPts(0.34, 0.27), 0.06, 0.025, 0.012), c.housing, 0, 0, 0)
  const scr = group(r, 0, 0.06, -0.1)
  scr.rotation.x = -1.1
  sbox(e, scr, 0.24, 0.17, 0.02, 0.008, c.darkTrim, 0, 0.09, 0)
  face(e, scr, 0.21, 0.145, screen, 0, 0.09, 0.0105)
  for (let i = 0; i < 24; i++) k.box(r, 0.018, 0.003, 0.014, i % 7 === 0 ? c.ledGreen : c.trim, -0.13 + (i % 8) * 0.025, 0.061, 0.03 + Math.floor(i / 8) * 0.022, false)
  k.box(r, 0.16, 0.012, 0.004, c.darkTrim, 0.04, 0.03, 0.137, false)
  const paper = k.box(r, 0.11, 0.002, 0.1, m.paper, 0.04, 0.018, 0.18, false)
  paper.rotation.x = 0.4
  // The cable arm and the lead wires.
  const arm = group(p, 0.2, 0.86, -0.12)
  put(arm, bentTube(e, 'ecgArm', [[0, 0, 0], [0.04, 0.35, 0], [0.18, 0.5, 0.05], [0.3, 0.48, 0.1]], 0.009, 0.06), c.trim, 0, 0, 0)
  sbox(e, arm, 0.06, 0.04, 0.03, 0.01, c.darkTrim, 0.3, 0.46, 0.1)
  const cols = [m.whitePlastic, m.black, m.red, m.green, m.red, m.sharps, m.green, m.blue, m.darkPlastic, m.purple]
  cols.forEach((col, i) => {
    const dz = 0.07 + (i - 4.5) * 0.008
    const len = 0.32 + (i % 3) * 0.05
    put(arm, bentTube(e, `lead${i}`, [[0.3, 0.44, dz], [0.31 + (i % 2) * 0.01, 0.44 - len * 0.5, dz + 0.01], [0.32, 0.44 - len, dz]], 0.0018, 0.02), col, 0, 0, 0, false)
    k.box(arm, 0.012, 0.03, 0.012, col, 0.32, 0.43 - len, dz, false)
  })
}

/* ---------- records and staff ---------- */

/**
 * Mobile compactor shelving: `n` carriages on floor rails, each a double-sided steel shelving
 * unit `len` long (along local z) and 2.2 m high, full of patient files in their coloured
 * folders, with a laminated end panel carrying the label holder and its three-spoke hand wheel on
 * the aisle end (+z); one aisle opened at `gap`.
 */
export function compactor(e: OpdCtx, p: Object3D, n: number, len: number, gap: number) {
  const { k, m } = e
  const c = cm(e)
  const dep = 0.6
  const total = n * dep + 0.85
  for (let i = 0; i < 4; i++) k.box(p, total + 0.2, 0.008, 0.05, m.galvanised, total / 2 - dep / 2, 0.004, -len / 2 + 0.3 + (i * (len - 0.6)) / 3, false)
  let x = 0
  for (let i = 0; i < n; i++) {
    if (i === gap) x += 0.85
    const g = group(p, x, 0, 0)
    k.box(g, dep, 0.12, len, m.powder, 0, 0.07, 0)
    for (const s of [-1, 1]) k.box(g, dep, 2.1, 0.025, e.o.frame, 0, 1.17, s * (len / 2 - 0.0125))
    k.box(g, 0.012, 2.1, len, e.o.frame, 0, 1.17, 0)
    k.box(g, dep, 0.02, len, e.o.frame, 0, 2.23, 0)
    for (let j = 0; j < 6; j++) {
      const y = 0.16 + j * 0.34
      k.box(g, dep - 0.01, 0.012, len - 0.05, e.o.frame, 0, y, 0)
      // Files on both faces, spines out: runs of folders, each run a printed row of spines.
      for (const s of [-1, 1]) {
        const runs = 5
        for (let q = 0; q < runs; q++) {
          const l = (len - 0.1) / runs
          const mat = c.files[(i + j * 2 + q) % c.files.length]
          // A box's ±x faces carry the texture along its length: the spines face the aisle either side.
          k.box(g, 0.25, 0.28, l - 0.006, mat, s * 0.15, y + 0.15, -len / 2 + 0.05 + (q + 0.5) * l, false)
        }
      }
    }
    // The end panel at the aisle end: laminated, its label holder and the hand wheel.
    put(g, slabGeo(e, 'compEnd', rectPts(dep + 0.02, 0.03), 2.2, 0.012, 0.006), c.wood, 0, 0.06, len / 2 + 0.015)
    const hub = put(g, lathe(e, 'compHub', [[0, 0], [0.045, 0], [0.045, 0.04], [0.03, 0.06], [0, 0.06]], 20), m.chrome, 0, 1.1, len / 2 + 0.03)
    hub.rotation.x = PI / 2
    for (let s = 0; s < 3; s++) {
      const a = (s * 2 * PI) / 3 + 0.3
      const sp = group(g, 0, 1.1, len / 2 + 0.08, 0)
      sp.rotation.z = a
      rod(e, sp, 0.008, 0.17, m.chrome, 0.085, 0, 0, 'x', 8)
      k.cyl(sp, 0.016, 0.014, 0.07, c.darkTrim, 0.17, 0, 0.03, 12).rotation.x = PI / 2
    }
    k.box(g, 0.22, 0.09, 0.006, m.aluminium, 0, 1.6, len / 2 + 0.031, false)
    k.box(g, 0.2, 0.07, 0.002, e.o.sign(`compactorLabel${i}`, 160, 56, (cc, w, h) => {
      cc.fillStyle = '#ffffff'
      cc.fillRect(0, 0, w, h)
      cc.fillStyle = '#1c3966'
      cc.font = SANS(h * 0.36, 700)
      cc.fillText(`OPD ${2026 - (i % 3)}`, 8, h * 0.42)
      cc.font = SANS(h * 0.3, 500)
      cc.fillText(`MRD ${String(i * 2000 + 1).padStart(5, '0')}–${String(i * 2000 + 2000).padStart(5, '0')}`, 8, h * 0.82)
    }), 0, 1.6, len / 2 + 0.035, false)
    x += dep
  }
}

/** A flatbed document scanner with its feeder, at (x, y, z) on a desk. */
export function scanner(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const c = cm(e)
  const g = group(p, x, y, z, ry)
  put(g, slabGeo(e, 'scanBody', rectPts(0.3, 0.22), 0.07, 0.02, 0.008), c.panel, 0, 0, 0, false)
  const feeder = put(g, slabGeo(e, 'scanFeed', rectPts(0.24, 0.12), 0.012, 0.01, 0.004), c.darkTrim, 0, 0.09, -0.06, false)
  feeder.rotation.x = -0.45
  k.box(g, 0.21, 0.002, 0.1, m.paper, 0, 0.1, -0.07, false).rotation.x = -0.45
  k.box(g, 0.24, 0.004, 0.08, c.darkTrim, 0, 0.03, 0.15, false)
  k.box(g, 0.02, 0.006, 0.004, c.ledGreen, 0.12, 0.05, 0.111, false)
  return g
}

/** A patient-file trolley: a powder-coated two-tier cart of files on castors, a push handle. */
export function fileTrolley(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  trolleyFrame(e, p, 0.7, 0.44, [0.25, 0.75])
  for (const y of [0.25, 0.75]) for (let i = 0; i < 14; i++) k.box(p, 0.03, 0.27, 0.32, [m.vacuum, m.blue, m.paper, m.green][i % 4], -0.29 + i * 0.044, y + 0.14, 0, false)
}

/** A three-seat staff sofa: a slim powder-coated frame on legs, loose seat and back cushions in charcoal fabric, padded arms. */
export function sofa(e: OpdCtx, p: Object3D, len = 1.9) {
  const { m } = e
  const c = cm(e)
  put(p, slabGeo(e, `sofaBase${len}`, rectPts(len, 0.8), 0.12, 0.03, 0.01), c.upholDark, 0, 0.12, 0)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(p, lathe(e, 'sofaLeg', [[0, 0], [0.018, 0], [0.024, 0.12], [0, 0.12]], 12), m.aluminium, sx * (len / 2 - 0.08), 0, sz * 0.32)
  const n = Math.round(len / 0.62)
  for (let i = 0; i < n; i++) {
    const w = (len - 0.24) / n
    const x = -len / 2 + 0.12 + (i + 0.5) * w
    put(p, slabGeo(e, `sofaSeat${w.toFixed(2)}`, rectPts(w - 0.01, 0.56), 0.14, 0.06, 0.05), c.upholDark, x, 0.24, 0.08)
    const b = put(p, geoUpright(e, `sofaBack${w.toFixed(2)}`, [[-(w - 0.01) / 2, 0], [(w - 0.01) / 2, 0], [(w - 0.01) / 2, 0.42], [-(w - 0.01) / 2, 0.42]], 0.16, 0.06), c.upholDark, x, 0.36, -0.28)
    b.rotation.x = -0.14
  }
  for (const s of [-1, 1]) put(p, slabGeo(e, 'sofaArm', rectPts(0.12, 0.8), 0.4, 0.05, 0.04), c.upholDark, s * (len / 2 - 0.06), 0.12, 0)
  put(p, geoUpright(e, `sofaRear${len}`, [[-len / 2 + 0.12, 0], [len / 2 - 0.12, 0], [len / 2 - 0.12, 0.3], [-len / 2 + 0.12, 0.3]], 0.1, 0.03), c.upholDark, 0, 0.22, -0.35)
}

/** A low coffee table: an oak-veneer top with a radiused edge on a powder-coated frame, a shelf, a few journals. */
export function coffeeTable(e: OpdCtx, p: Object3D, w = 1.0, d = 0.55) {
  const { k, m } = e
  const c = cm(e)
  put(p, slabGeo(e, `ctTop${w}|${d}`, rectPts(w, d), 0.03, 0.04, 0.008), c.wood, 0, 0.4, 0)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(p, 0.03, 0.4, 0.03, c.darkTrim, sx * (w / 2 - 0.05), 0.2, sz * (d / 2 - 0.05))
  k.box(p, w - 0.08, 0.012, d - 0.08, c.darkTrim, 0, 0.12, 0)
  for (let i = 0; i < 3; i++) k.box(p, 0.21, 0.005, 0.28, [m.paper, m.blue, m.whitePlastic][i], -0.2 + i * 0.03, 0.434 + i * 0.005, 0.02 * i, false).rotation.y = 0.2 * i
}

/** An electric kettle on its base and two mugs, at (x, y, z) on a counter. */
export function kettle(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { m } = e
  const c = cm(e)
  const g = group(p, x, y, z, ry)
  put(g, lathe(e, 'kettleBase', [[0, 0], [0.09, 0], [0.092, 0.015], [0.085, 0.02], [0, 0.02]], 24), c.darkTrim, 0, 0, 0, false)
  put(g, lathe(e, 'kettle2', [[0, 0.02], [0.078, 0.02], [0.084, 0.05], [0.082, 0.17], [0.07, 0.21], [0.03, 0.225], [0, 0.225]], 24), m.stainless, 0, 0, 0, false)
  put(g, bentTube(e, 'kettleHandle', [[-0.07, 0.19, 0], [-0.12, 0.17, 0], [-0.12, 0.07, 0], [-0.08, 0.05, 0]], 0.012, 0.03), c.darkTrim, 0, 0, 0, false)
  put(g, bentTube(e, 'kettleSpout', [[0.07, 0.15, 0], [0.11, 0.19, 0]], 0.012, 0.01), m.stainless, 0, 0, 0, false)
  for (const [dx, mat] of [[0.18, c.shell], [0.26, m.blue]] as const) {
    put(g, lathe(e, 'mug', [[0, 0], [0.036, 0], [0.04, 0.095], [0.035, 0.095], [0.032, 0.006], [0, 0.006]], 20), mat, dx, 0, 0.04, false)
    put(g, ringGeo(e, 0.022, 0.005), mat, dx + 0.045, 0.05, 0.04, false).rotation.x = 0
  }
  return g
}

/** A coat stand: a weighted round base, the tubular pole, its turned hook crown, a white coat hanging. */
export function coatStand(e: OpdCtx, p: Object3D) {
  const { m } = e
  const c = cm(e)
  put(p, lathe(e, 'csBase', [[0, 0], [0.21, 0], [0.22, 0.012], [0.18, 0.03], [0, 0.035]], 28), c.darkTrim)
  put(p, lathe(e, 'csPole', [[0, 0.03], [0.018, 0.03], [0.018, 1.72], [0.025, 1.74], [0.022, 1.78], [0, 1.79]], 14), c.darkTrim)
  for (let i = 0; i < 4; i++) {
    const h = group(p, 0, 1.68, 0, (i * PI) / 2)
    put(h, bentTube(e, 'csHook', [[0, 0, 0], [0.09, 0.05, 0], [0.13, 0.12, 0]], 0.007, 0.03), m.chrome, 0, 0, 0, false)
  }
  // The white coat hung by its loop: a draped body flaring to the hem, the sleeves down its sides, the collar.
  whiteCoat(e, group(p, 0, 1.74, 0.11))
}

/** A white coat hanging from a hook at its collar (the group's origin), falling 1 m. */
export function whiteCoat(e: OpdCtx, p: Object3D) {
  const { m } = e
  const prof: [number, number][] = [[0, 0], [0.06, -0.02], [0.17, -0.1], [0.2, -0.25], [0.21, -0.6], [0.24, -0.98], [0.23, -1.0], [0, -1.0]]
  const body = put(p, lathe(e, 'coatDrape', prof, 28), m.sheet, 0, 0, 0)
  body.scale.set(1, 1, 0.42)
  for (const s of [-1, 1]) {
    const sl = put(p, lathe(e, 'coatSleeve', [[0, 0], [0.045, -0.02], [0.05, -0.55], [0.055, -0.6], [0, -0.6]], 14), m.sheet, s * 0.2, -0.1, 0)
    sl.rotation.z = s * 0.1
    sl.scale.set(1, 1, 0.8)
  }
  const collar = put(p, lathe(e, 'coatCollar', [[0.05, 0.0], [0.075, -0.02], [0.08, -0.06], [0.05, -0.05]], 20), m.sheet, 0, -0.02, 0)
  collar.scale.set(1, 1, 0.6)
  return p
}

/** A token-calling keypad with its display, at (x, y, z) on a counter. */
export function tokenCaller(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k } = e
  const c = cm(e)
  const g = group(p, x, y, z, ry)
  const b = put(g, slabGeo(e, 'caller', [[-0.08, -0.06], [0.08, -0.06], [0.08, 0.06], [-0.08, 0.06]], 0.035, 0.015, 0.008), c.panel, 0, 0, 0, false)
  b.rotation.x = 0.18
  k.box(g, 0.1, 0.002, 0.026, e.o.screen('caller2', 96, 24, lcd(['NEXT  A-118'], '#061423', '#ffd45a')), 0, 0.045, -0.03, false).rotation.x = 0.18
  for (let i = 0; i < 6; i++) k.box(g, 0.025, 0.004, 0.016, i === 0 ? c.ledGreen : c.trim, -0.04 + (i % 3) * 0.04, 0.034 + Math.floor(i / 3) * 0.004, 0.005 + Math.floor(i / 3) * 0.024, false)
  return g
}

/** ECG electrodes (pre-gelled tabs on their liner) and the limb clamps, laid ready at (x, y, z). */
export function electrodes(e: OpdCtx, p: Object3D, x: number, y: number, z: number) {
  const { k, m } = e
  const g = group(p, x, y, z)
  k.box(g, 0.12, 0.002, 0.16, m.paper, 0, 0.001, 0, false)
  for (let i = 0; i < 10; i++) {
    const ex = -0.035 + (i % 3) * 0.035
    const ez = -0.06 + Math.floor(i / 3) * 0.04
    if (i >= 9) continue
    k.cyl(g, 0.013, 0.013, 0.002, m.whitePlastic, ex, 0.003, ez, 16)
    k.cyl(g, 0.004, 0.004, 0.004, m.chrome, ex, 0.005, ez, 8)
  }
  for (const [dx, col] of [[0.12, m.red], [0.17, m.sharps], [0.22, m.green], [0.27, m.black]] as const) {
    const cl = group(g, dx, 0.012, 0.02, 0.3)
    e.k.soft(cl, 0.03, 0.022, 0.06, 0.008, col, 0, 0, 0)
  }
  return g
}

/** A wall-mounted glass-door instrument sterilising cabinet (UV) for the dressing rooms: unused here, kept small. */
export function uvCabinet(e: OpdCtx, p: Object3D, y = 1.4) {
  const c = cm(e)
  sbox(e, p, 0.46, 0.36, 0.22, 0.015, c.shell, 0, y, 0.11)
  e.k.box(p, 0.4, 0.28, 0.004, c.lens, 0, y, 0.222, false)
  e.k.box(p, 0.06, 0.02, 0.004, c.ledGreen, 0.16, y + 0.15, 0.223, false)
}

/** Re-exported for the fitters. */
export { carcass }
