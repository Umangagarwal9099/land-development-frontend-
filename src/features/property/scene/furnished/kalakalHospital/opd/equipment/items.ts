import {
  CatmullRomCurve3, DoubleSide, ExtrudeGeometry, MeshPhysicalMaterial, MeshStandardMaterial, Shape, TorusGeometry, TubeGeometry, Vector3,
  type Material, type Object3D,
} from 'three'
import { PI } from '../../../kit'
import { paintedMat } from '../../../shared'
import { rng, type Paint } from '../../../textures'
import { bentTube, castor, face, geo, group, lathe, panel, pillow, put, rod, type Ctx } from '../../erKit'

/*
 * Small clinical items modelled from the products themselves, at their catalogue sizes: what is on
 * a doctor's desk and a nurse's trolley, what hangs on an IV pole, what fills a phlebotomy tray.
 * Every builder takes the emergency department's workshop context (so the ER and the OPD share
 * them), builds in its own frame (front +z, standing on y = 0 unless said otherwise), and uses
 * the materials below, made once per model. Round parts are turned (lathe profiles), shells are
 * bevelled extrusions, tubing is swept along its curve, and screens, scales, keycaps and labels
 * are painted at their real resolution.
 */

type P3 = [number, number, number]

/* ---------- materials, once per model ---------- */

const std = (p: ConstructorParameters<typeof MeshStandardMaterial>[0]) => new MeshStandardMaterial({ roughness: 0.6, ...p })
const phys = (p: ConstructorParameters<typeof MeshPhysicalMaterial>[0]) => new MeshPhysicalMaterial(p)

function make(e: Ctx) {
  return {
    /** Injection-moulded ABS housings: warm white, light grey, mid grey, graphite; a fine satin finish. */
    shell: phys({ color: '#eceae5', roughness: 0.42, clearcoat: 0.15, clearcoatRoughness: 0.6 }),
    shellGrey: phys({ color: '#c3c7cb', roughness: 0.45, clearcoat: 0.12, clearcoatRoughness: 0.6 }),
    shellMid: std({ color: '#8a9096', roughness: 0.5 }),
    graphite: std({ color: '#2b2e33', roughness: 0.55 }),
    /** Monitor and phone plastics: textured matte black, a gloss black for screen surrounds. */
    matteBlack: std({ color: '#1a1b1e', roughness: 0.72 }),
    glossBlack: std({ color: '#0d0e10', roughness: 0.22, metalness: 0.1 }),
    rubber: std({ color: '#151516', roughness: 0.9 }),
    /** Stethoscope and pump tubing: soft PVC, black and grey. */
    tubeBlack: std({ color: '#121314', roughness: 0.35 }),
    tubeGrey: std({ color: '#7d8186', roughness: 0.4 }),
    /** Chrome-plated brass, satin stainless, anodised aluminium. */
    // Under the interiors' dim reflections fully metallic finishes read black; these keep the look of
    // polished and satin steel with part of their tone from their own colour.
    chrome: std({ color: '#e1e4e7', metalness: 0.7, roughness: 0.2 }),
    satin: std({ color: '#d3d6d8', metalness: 0.55, roughness: 0.36 }),
    brass: std({ color: '#c4a35c', metalness: 0.6, roughness: 0.32 }),
    /** Clear plastics: PVC bags, polypropylene barrels, PET bottles; the liquids in them. */
    pvc: phys({ color: '#eef4f4', roughness: 0.18, transparent: true, opacity: 0.3, depthWrite: false, side: DoubleSide }),
    clear: phys({ color: '#f2f6f6', roughness: 0.1, transparent: true, opacity: 0.38, depthWrite: false }),
    glass: phys({ color: '#e9f1f1', roughness: 0.05, transparent: true, opacity: 0.28, depthWrite: false }),
    amberGlass: phys({ color: '#7a3d0c', roughness: 0.08, transparent: true, opacity: 0.82 }),
    saline: phys({ color: '#d9eef6', roughness: 0.05, transparent: true, opacity: 0.35, depthWrite: false }),
    blood: std({ color: '#5a0a10', roughness: 0.3 }),
    iodine: std({ color: '#4a1d08', roughness: 0.25 }),
    /** Rubber stoppers and plunger tips. */
    stopper: std({ color: '#26272a', roughness: 0.6 }),
    /** Vacutainer cap colours (ISO 6710): red, lavender (EDTA), light blue (citrate), gold (SST), grey (fluoride), green (heparin). */
    caps: {
      red: std({ color: '#c0262d', roughness: 0.45 }),
      lavender: std({ color: '#8d73b8', roughness: 0.45 }),
      blue: std({ color: '#6aa5d8', roughness: 0.45 }),
      gold: std({ color: '#d9a628', roughness: 0.45 }),
      grey: std({ color: '#8e9398', roughness: 0.45 }),
      green: std({ color: '#3f9a57', roughness: 0.45 }),
    },
    /** Cuff and tourniquet fabric, cotton wool, crêpe bandage, gauze. */
    cuff: std({ color: '#2b4a7a', roughness: 0.92 }),
    cotton: std({ color: '#fbfbf8', roughness: 1 }),
    crepe: std({ color: '#e9d8c0', roughness: 0.95 }),
    bluePaper: std({ color: '#3d6cb0', roughness: 0.85 }),
    /** Galvanised and powder-coated steel; chromed wire. */
    powderWhite: std({ color: '#e8e9e6', roughness: 0.5, metalness: 0.1 }),
    powderGrey: std({ color: '#7b8187', roughness: 0.5, metalness: 0.2 }),
    /** Vitreous china (basins), a soft gloss. */
    china: phys({ color: '#f7f7f3', roughness: 0.16, clearcoat: 0.6, clearcoatRoughness: 0.15 }),
    /** Painted faces, made on demand. */
    printed: (key: string, w: number, h: number, paint: Paint, rough = 0.5) => paintedMat({ k: e.k }, `item_${key}`, w, h, paint, { roughness: rough }),
    lit: (key: string, w: number, h: number, paint: Paint, intensity = 0.9) => {
      const mat = paintedMat({ k: e.k }, `itemlit_${key}`, w, h, paint, { roughness: 0.25 })
      if (!mat.emissiveMap) {
        mat.emissiveMap = mat.map
        mat.emissive.set('#ffffff')
        mat.emissiveIntensity = intensity
        e.lighting.glow(mat, 0.9)
      }
      return mat
    },
  }
}

export type ItemMats = ReturnType<typeof make>
const cache = new WeakMap<object, ItemMats>()
/** The items' materials, made once per model. */
export function itemMats(e: Ctx): ItemMats {
  let c = cache.get(e.m)
  if (!c) cache.set(e.m, (c = make(e)))
  return c
}

/* ---------- small shared shapes ---------- */

/** A swept tube through points (Catmull-Rom), radius r: tubing, cords, cables. */
export function hose(e: Ctx, key: string, pts: P3[], r: number, radial = 8) {
  return geo(e, `hose${key}|${r}`, () => new TubeGeometry(new CatmullRomCurve3(pts.map(([x, y, z]) => new Vector3(x, y, z))), Math.max(16, pts.length * 8), r, radial, false))
}

/** A coiled cord (a phone's, a monitor lead) from a to b, `turns` coils of radius rc. */
export function coil(e: Ctx, key: string, a: P3, b: P3, turns: number, rc: number, r: number) {
  return geo(e, `coil${key}`, () => {
    const pts: Vector3[] = []
    const A = new Vector3(...a)
    const B = new Vector3(...b)
    const dir = B.clone().sub(A)
    const len = dir.length()
    dir.normalize()
    const side = Math.abs(dir.y) < 0.9 ? new Vector3(0, 1, 0).cross(dir).normalize() : new Vector3(1, 0, 0)
    const up = dir.clone().cross(side).normalize()
    const n = Math.max(40, turns * 14)
    for (let i = 0; i <= n; i++) {
      const t = i / n
      const ang = t * turns * PI * 2
      const sag = Math.sin(t * PI) * len * 0.08
      pts.push(A.clone().addScaledVector(dir, t * len).addScaledVector(side, Math.cos(ang) * rc).addScaledVector(up, Math.sin(ang) * rc - sag))
    }
    return new TubeGeometry(new CatmullRomCurve3(pts), n * 2, r, 6, false)
  })
}

/** A profile in the xy plane extruded `d` along z (centred), its edges bevelled `b`. */
export function extrude(e: Ctx, key: string, pts: [number, number][], d: number, b = 0.003) {
  return geo(e, `ext${key}`, () => {
    const s = new Shape()
    s.moveTo(pts[0][0], pts[0][1])
    for (const [x, y] of pts.slice(1)) s.lineTo(x, y)
    s.closePath()
    const g = new ExtrudeGeometry(s, { depth: Math.max(0.001, d - 2 * b), bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 8 })
    g.translate(0, 0, -(d - 2 * b) / 2)
    return g
  })
}

/* ---------- painted faces ---------- */

const SANS = (px: number, w = 600) => `${w} ${Math.round(px)}px "Helvetica Neue", Helvetica, Arial, sans-serif`

/** A keyboard's keys from above: a full-size layout, light legends on dark caps. */
const keyboardPaint: Paint = (g, w, h) => {
  g.fillStyle = '#16171a'
  g.fillRect(0, 0, w, h)
  const u = w / 23
  const rows: [number, number][][] = [
    [[0, 1], [1.5, 1], [2.5, 1], [3.5, 1], [4.5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10.5, 1], [11.5, 1], [12.5, 1], [13.5, 1], [15.2, 1], [16.2, 1], [17.2, 1]],
    [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 2], [15.2, 1], [16.2, 1], [17.2, 1], [18.7, 1], [19.7, 1], [20.7, 1], [21.7, 1]],
    [[0, 1.5], [1.5, 1], [2.5, 1], [3.5, 1], [4.5, 1], [5.5, 1], [6.5, 1], [7.5, 1], [8.5, 1], [9.5, 1], [10.5, 1], [11.5, 1], [12.5, 1], [13.5, 1.5], [15.2, 1], [16.2, 1], [17.2, 1], [18.7, 1], [19.7, 1], [20.7, 1], [21.7, 1]],
    [[0, 1.75], [1.75, 1], [2.75, 1], [3.75, 1], [4.75, 1], [5.75, 1], [6.75, 1], [7.75, 1], [8.75, 1], [9.75, 1], [10.75, 1], [11.75, 1], [12.75, 2.25], [18.7, 1], [19.7, 1], [20.7, 1]],
    [[0, 2.25], [2.25, 1], [3.25, 1], [4.25, 1], [5.25, 1], [6.25, 1], [7.25, 1], [8.25, 1], [9.25, 1], [10.25, 1], [11.25, 1], [12.25, 2.75], [16.2, 1], [18.7, 1], [19.7, 1], [20.7, 1], [21.7, 1]],
    [[0, 1.25], [1.25, 1.25], [2.5, 1.25], [3.75, 6.25], [10, 1.25], [11.25, 1.25], [12.5, 1.25], [13.75, 1.25], [15.2, 1], [16.2, 1], [17.2, 1], [18.7, 2], [20.7, 1]],
  ]
  const kh = h / 6.4
  rows.forEach((row, ri) => {
    const y = (ri + (ri ? 0.3 : 0)) * kh + kh * 0.05
    for (const [x, wd] of row) {
      const gx = x * u + u * 0.05
      const gw = wd * u - u * 0.1
      const grad = g.createLinearGradient(0, y, 0, y + kh * 0.9)
      grad.addColorStop(0, '#3a3c41')
      grad.addColorStop(1, '#25272b')
      g.fillStyle = grad
      g.fillRect(gx, y, gw, kh * 0.88)
      g.fillStyle = 'rgba(0,0,0,.5)'
      g.fillRect(gx, y + kh * 0.84, gw, kh * 0.04)
      if (wd < 2 && ri > 0) {
        g.fillStyle = 'rgba(225,228,232,.75)'
        g.fillRect(gx + gw * 0.2, y + kh * 0.25, gw * 0.18, kh * 0.18)
      }
    }
  })
}

/** Syringe barrel graduations: black ticks and figures on clear (painted on white; used as alpha-like decal). */
const graduations = (ml: number): Paint => (g, w, h) => {
  g.clearRect(0, 0, w, h)
  g.fillStyle = 'rgba(255,255,255,0)'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#111'
  const n = ml * 5
  for (let i = 0; i <= n; i++) {
    const x = w * 0.04 + (i / n) * w * 0.92
    const major = i % 5 === 0
    g.fillRect(x, h * 0.1, Math.max(1, w * 0.004), h * (major ? 0.55 : 0.3))
    if (major && i) {
      g.font = SANS(h * 0.3, 700)
      g.fillText(String(i / 5), x - w * 0.012, h * 0.95)
    }
  }
}

/** A tube label: white with a printed barcode and patient lines. */
const tubeLabel: Paint = (g, w, h) => {
  const r = rng(91)
  g.fillStyle = '#fbfbf7'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#111'
  for (let x = w * 0.08; x < w * 0.92; ) {
    const b = 1 + Math.floor(r() * 3)
    g.fillRect(x, h * 0.08, b, h * 0.3)
    x += b + 1 + Math.floor(r() * 2)
  }
  for (let i = 0; i < 3; i++) g.fillRect(w * 0.08, h * (0.5 + i * 0.15), w * (0.4 + r() * 0.4), h * 0.06)
}

/** An infusion bag's printed face: the product, its strength and volume, the graduated scale. */
const bagPrint = (name: string, strength: string): Paint => (g, w, h) => {
  g.clearRect(0, 0, w, h)
  g.fillStyle = '#ffffff'
  g.fillRect(w * 0.12, h * 0.12, w * 0.76, h * 0.42)
  g.fillStyle = '#1f4f9a'
  g.fillRect(w * 0.12, h * 0.12, w * 0.76, h * 0.07)
  g.fillStyle = '#163463'
  g.font = SANS(h * 0.065, 800)
  g.fillText(name, w * 0.16, h * 0.27)
  g.font = SANS(h * 0.045, 600)
  g.fillText(strength, w * 0.16, h * 0.35)
  g.font = SANS(h * 0.04, 500)
  g.fillText('Sterile · Non-pyrogenic · Single use', w * 0.16, h * 0.43)
  g.fillText('1000 mL', w * 0.16, h * 0.5)
  g.fillStyle = '#163463'
  for (let i = 0; i <= 10; i++) {
    const y = h * (0.58 + i * 0.033)
    g.fillRect(w * 0.82, y, w * (i % 5 === 0 ? 0.06 : 0.035), 2)
  }
}

/** An oxygen regulator's contents gauge: 0–250 bar, the green band, the needle at 160. */
const o2Gauge: Paint = (g, w, h) => {
  g.fillStyle = '#fbfbf8'
  g.beginPath()
  g.arc(w / 2, h / 2, w * 0.49, 0, PI * 2)
  g.fill()
  const a0 = PI * 0.75
  const span = PI * 1.5
  g.strokeStyle = '#2e9b4f'
  g.lineWidth = w * 0.06
  g.beginPath()
  g.arc(w / 2, h / 2, w * 0.38, a0 + span * 0.4, a0 + span)
  g.stroke()
  g.strokeStyle = '#c8161d'
  g.beginPath()
  g.arc(w / 2, h / 2, w * 0.38, a0, a0 + span * 0.12)
  g.stroke()
  g.strokeStyle = '#111'
  for (let i = 0; i <= 25; i++) {
    const a = a0 + (i / 25) * span
    const r0 = i % 5 ? 0.41 : 0.36
    g.lineWidth = i % 5 ? 1 : 2
    g.beginPath()
    g.moveTo(w / 2 + Math.cos(a) * w * r0, h / 2 + Math.sin(a) * h * r0)
    g.lineTo(w / 2 + Math.cos(a) * w * 0.45, h / 2 + Math.sin(a) * h * 0.45)
    g.stroke()
    if (i % 5 === 0) {
      g.fillStyle = '#111'
      g.font = SANS(w * 0.08, 700)
      g.textAlign = 'center'
      g.fillText(String(i * 10), w / 2 + Math.cos(a) * w * 0.27, h / 2 + Math.sin(a) * h * 0.27 + w * 0.03)
    }
  }
  g.font = SANS(w * 0.07, 700)
  g.fillText('O₂  bar', w / 2, h * 0.75)
  const a = a0 + span * 0.64
  g.strokeStyle = '#111'
  g.lineWidth = w * 0.02
  g.beginPath()
  g.moveTo(w / 2, h / 2)
  g.lineTo(w / 2 + Math.cos(a) * w * 0.4, h / 2 + Math.sin(a) * h * 0.4)
  g.stroke()
  g.fillStyle = '#111'
  g.beginPath()
  g.arc(w / 2, h / 2, w * 0.04, 0, PI * 2)
  g.fill()
}

/** A segment LCD (BP monitor, thermometer, glucometer): grey-green ground, dark digits. */
const lcd = (lines: [string, number, number, number][]): Paint => (g, w, h) => {
  g.fillStyle = '#b9c7b4'
  g.fillRect(0, 0, w, h)
  const grad = g.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, 'rgba(255,255,255,.18)')
  grad.addColorStop(1, 'rgba(0,0,0,.08)')
  g.fillStyle = grad
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#1b2219'
  for (const [t, x, y, s] of lines) {
    g.font = SANS(h * s, 700)
    g.textAlign = 'right'
    g.fillText(t, w * x, h * y)
  }
}

/** A pulse oximeter's OLED: SpO₂ in yellow, pulse in cyan, the pleth bar. */
const oled: Paint = (g, w, h) => {
  g.fillStyle = '#030405'
  g.fillRect(0, 0, w, h)
  g.font = SANS(h * 0.42, 700)
  g.fillStyle = '#ffd23a'
  g.fillText('98', w * 0.06, h * 0.62)
  g.fillStyle = '#4fd8ff'
  g.fillText('76', w * 0.56, h * 0.62)
  g.font = SANS(h * 0.13, 600)
  g.fillStyle = '#ffd23a'
  g.fillText('%SpO₂', w * 0.06, h * 0.86)
  g.fillStyle = '#4fd8ff'
  g.fillText('PRbpm', w * 0.56, h * 0.86)
  g.fillStyle = '#7dff8a'
  for (let i = 0; i < 6; i++) g.fillRect(w * 0.94, h * (0.75 - i * 0.1), w * 0.04, h * 0.07)
}

/** A desk phone's keypad and display from above. */
const phoneFace: Paint = (g, w, h) => {
  g.fillStyle = '#1d1e21'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#9fb4a7'
  g.fillRect(w * 0.1, h * 0.06, w * 0.8, h * 0.18)
  g.fillStyle = '#1d2a22'
  g.font = SANS(h * 0.07, 600)
  g.fillText('EXT 1102   10:42', w * 0.14, h * 0.17)
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 3; c++) {
      const x = w * (0.2 + c * 0.22)
      const y = h * (0.34 + r * 0.15)
      g.fillStyle = '#3a3c40'
      g.fillRect(x, y, w * 0.16, h * 0.1)
      g.fillStyle = '#e8e8e8'
      g.font = SANS(h * 0.07, 600)
      g.fillText('123456789*0#'[r * 3 + c], x + w * 0.06, y + h * 0.075)
    }
  for (let i = 0; i < 4; i++) {
    g.fillStyle = '#4a4c50'
    g.fillRect(w * 0.88, h * (0.34 + i * 0.12), w * 0.08, h * 0.07)
  }
}

/* ---------- on a desk ---------- */

/**
 * A 24" LED monitor: a 4 mm bezel round the panel, a slim tapered back with its VESA boss, the
 * neck on a hinge, a flat oval foot. Its screen shows `screen`; the group faces +z.
 */
export function monitor24(e: Ctx, p: Object3D, screen: Material, x = 0, y = 0, z = 0, ry = 0) {
  const { k } = e
  const t = itemMats(e)
  const g = group(p, x, y, z, ry)
  put(g, lathe(e, 'monFoot', [[0, 0], [0.11, 0], [0.115, 0.004], [0.11, 0.01], [0, 0.012]], 32), t.matteBlack, 0, 0, -0.04).scale.set(1, 1, 0.75)
  put(g, extrude(e, 'monNeck', [[-0.025, 0], [0.025, 0], [0.02, 0.27], [-0.02, 0.27]], 0.018, 0.004), t.matteBlack, 0, 0.01, -0.085)
  const s = group(g, 0, 0.33, -0.065)
  s.rotation.x = -0.05
  put(s, panel(e, 0.541, 0.322, 0.016, 0.006), t.glossBlack, 0, 0, 0)
  put(s, panel(e, 0.48, 0.27, 0.03, 0.03), t.matteBlack, 0, 0.0, -0.02)
  k.box(s, 0.1, 0.1, 0.012, t.matteBlack, 0, 0, -0.038, false)
  face(e, s, 0.527, 0.297, screen, 0, 0.008, 0.0082)
  k.box(s, 0.006, 0.003, 0.002, e.m.alarmBar, 0.24, -0.155, 0.0085, false)
  return g
}

/** A full-size keyboard (0.44 × 0.13 m) with its keys painted on a stepped deck, and the cable. */
export function keyboard(e: Ctx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k } = e
  const t = itemMats(e)
  const g = group(p, x, y, z, ry)
  put(g, extrude(e, 'kbBody', [[-0.065, 0], [0.065, 0], [0.065, 0.014], [-0.065, 0.024]], 0.44, 0.002), t.matteBlack, 0, 0, 0).rotation.y = PI / 2
  const keys = t.printed('keyboard', 512, 152, keyboardPaint, 0.65)
  const top = face(e, g, 0.43, 0.122, keys, 0, 0.0195, 0)
  top.rotation.x = -PI / 2 + Math.atan2(0.01, 0.13)
  k.box(g, 0.02, 0.004, 0.06, t.rubber, -0.18, 0.002, -0.04, false)
  k.box(g, 0.02, 0.004, 0.06, t.rubber, 0.18, 0.002, -0.04, false)
  return g
}

/** A wired optical mouse, ambidextrous, on its pad. */
export function mouse(e: Ctx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const t = itemMats(e)
  const g = group(p, x, y, z, ry)
  put(g, lathe(e, 'mouseShell', [[0, 0], [0.03, 0.0], [0.032, 0.012], [0.026, 0.03], [0.012, 0.037], [0, 0.038]], 20), t.matteBlack).scale.set(1, 1, 1.75)
  put(g, lathe(e, 'mouseWheel', [[0, -0.004], [0.007, -0.004], [0.007, 0.004], [0, 0.004]], 12), t.rubber, 0, 0.034, 0.02).rotation.z = PI / 2
  return g
}

/** A small-form-factor desktop PC (0.1 × 0.3 × 0.29 m), standing: its front panel, power button, USB ports and side vents. */
export function cpuTower(e: Ctx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k } = e
  const t = itemMats(e)
  const g = group(p, x, y, z, ry)
  put(g, panel(e, 0.29, 0.3, 0.1, 0.008), t.matteBlack, 0, 0.15, 0).rotation.y = PI / 2
  k.box(g, 0.096, 0.28, 0.006, t.graphite, 0, 0.15, 0.146, false)
  put(g, lathe(e, 'pwrBtn', [[0, 0], [0.008, 0], [0.008, 0.003], [0, 0.004]], 16), t.satin, 0, 0.26, 0.15).rotation.x = PI / 2
  for (let i = 0; i < 2; i++) k.box(g, 0.014, 0.006, 0.002, t.glossBlack, -0.02 + i * 0.04, 0.22, 0.15, false)
  for (let i = 0; i < 9; i++) k.box(g, 0.002, 0.008, 0.2, t.glossBlack, 0.051, 0.06 + i * 0.022, 0, false)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(g, 0.012, 0.004, 0.02, t.rubber, sx * 0.035, 0.002, sz * 0.12, false)
  return g
}

/** A desk telephone with a backlit display, keypad, speakerphone grille, the handset on its cradle and the coiled cord. */
export function phone(e: Ctx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k } = e
  const t = itemMats(e)
  const g = group(p, x, y, z, ry)
  put(g, extrude(e, 'phoneBody', [[-0.1, 0], [0.1, 0], [0.1, 0.032], [-0.09, 0.07], [-0.1, 0.066]], 0.2, 0.006), t.matteBlack, 0, 0, 0).rotation.y = -PI / 2
  const face0 = face(e, g, 0.17, 0.12, t.printed('phoneFace', 256, 180, phoneFace, 0.5), 0.02, 0.054, 0.012)
  face0.rotation.set(-PI / 2 + Math.atan2(0.035, 0.2), 0, 0)
  // The handset in its cradle along the left: two cups joined by a curved grip.
  const hs = group(g, -0.065, 0.06, 0)
  hs.rotation.x = Math.atan2(0.035, 0.2)
  put(hs, extrude(e, 'handset', [[-0.105, 0], [-0.09, 0.022], [-0.06, 0.03], [0.06, 0.03], [0.09, 0.022], [0.105, 0], [0.08, -0.008], [-0.08, -0.008]], 0.05, 0.006), t.matteBlack).rotation.y = PI / 2
  put(g, coil(e, 'phoneCord', [-0.09, 0.03, -0.1], [-0.15, 0.0, 0.05], 22, 0.007, 0.0015), t.matteBlack)
  k.box(g, 0.02, 0.002, 0.03, t.glossBlack, 0.07, 0.045, -0.06, false)
  return g
}

/** A desktop mono laser printer: shaped body, output tray recess with a page, control panel, the paper cassette. */
export function laserPrinter(e: Ctx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const t = itemMats(e)
  const g = group(p, x, y, z, ry)
  put(g, extrude(e, 'prnBody', [[-0.18, 0], [0.18, 0], [0.18, 0.2], [0.12, 0.25], [-0.18, 0.25]], 0.38, 0.01), t.shell, 0, 0, 0).rotation.y = -PI / 2
  k.box(g, 0.3, 0.004, 0.22, t.graphite, 0, 0.252, 0.0, false)
  k.box(g, 0.21, 0.003, 0.29, m.paper, 0, 0.256, -0.01, false)
  k.box(g, 0.34, 0.07, 0.006, t.shellGrey, 0, 0.05, 0.181, false)
  k.box(g, 0.08, 0.008, 0.004, t.graphite, 0, 0.07, 0.185, false)
  const cp = face(e, g, 0.07, 0.035, t.lit('prnPanel', 128, 64, lcd([['READY', 0.92, 0.65, 0.4]]), 0.5), 0.12, 0.22, 0.186)
  cp.rotation.x = -0.5
  for (let i = 0; i < 3; i++) k.box(g, 0.01, 0.006, 0.004, i === 0 ? m.green : t.graphite, 0.08 - i * 0.02, 0.2, 0.184, false)
  return g
}

/** A barcode scanner on its stand (as at a pharmacy or phlebotomy counter). */
export function barcodeScanner(e: Ctx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const t = itemMats(e)
  const g = group(p, x, y, z, ry)
  put(g, lathe(e, 'scanStand', [[0, 0], [0.045, 0], [0.04, 0.012], [0.015, 0.02], [0, 0.02]], 20), t.matteBlack)
  const gun = group(g, 0, 0.06, 0)
  gun.rotation.x = -0.6
  put(gun, extrude(e, 'scanGun', [[-0.02, -0.06], [0.015, -0.06], [0.02, 0.04], [0.045, 0.08], [0.03, 0.1], [-0.02, 0.06]], 0.045, 0.006), t.graphite).rotation.y = PI / 2
  k.box(gun, 0.03, 0.002, 0.012, m.red, 0, 0.09, 0.03, false)
  return g
}

/* ---------- diagnostic instruments ---------- */

/**
 * A dual-head stethoscope lying on a desk: the chest piece (diaphragm and bell on a stem), the
 * Y-tube looped, the binaural ear tubes with their tension spring and soft tips.
 */
export function stethoscopeItem(e: Ctx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k } = e
  const t = itemMats(e)
  const g = group(p, x, y, z, ry)
  // Chest piece: diaphragm (wide, black rim) and bell (smaller) back to back on the stem.
  const cp = group(g, 0.095, 0.011, 0.01)
  cp.rotation.z = PI / 2
  put(cp, lathe(e, 'stethDia', [[0, 0], [0.022, 0], [0.023, 0.004], [0.021, 0.008], [0.012, 0.011], [0, 0.011]], 28), t.satin, 0, 0, 0)
  put(cp, lathe(e, 'stethRim', [[0.021, -0.001], [0.024, -0.001], [0.024, 0.003], [0.021, 0.003]], 28), t.rubber, 0, 0, 0)
  put(cp, lathe(e, 'stethBell', [[0, 0], [0.006, 0], [0.012, -0.008], [0.015, -0.016], [0, -0.016]], 24), t.satin, 0, -0.004, 0)
  rod(e, cp, 0.003, 0.03, t.satin, 0.024, -0.004, 0, 'x', 10)
  // The tubing: from the stem in a loose loop to the Y, then two branches to the ear tubes.
  const loop: P3[] = []
  for (let i = 0; i <= 18; i++) {
    const a = (i / 18) * PI * 1.65 - 0.3
    loop.push([0.125 - 0.06 + Math.cos(a) * 0.08, 0.006, 0.01 + Math.sin(a) * 0.065])
  }
  loop.push([-0.06, 0.006, 0.0], [-0.1, 0.006, -0.02])
  put(g, hose(e, 'stethMain', loop, 0.0045), t.tubeBlack)
  for (const s of [-1, 1]) {
    put(g, hose(e, `stethBranch${s}`, [[-0.1, 0.006, -0.02], [-0.13, 0.006, -0.02 + s * 0.015], [-0.16, 0.006, -0.02 + s * 0.03]], 0.0035), t.tubeBlack)
    put(g, bentTube(e, `stethEar${s}`, [[-0.16, 0.006, -0.02 + s * 0.03], [-0.22, 0.008, -0.02 + s * 0.028], [-0.24, 0.01, -0.02 + s * 0.012]], 0.0022, 0.02), t.satin)
    k.sphere(g, 0.006, t.rubber, -0.243, 0.011, -0.02 + s * 0.01)
  }
  put(g, hose(e, 'stethSpring', [[-0.17, 0.007, -0.05], [-0.172, 0.007, -0.02], [-0.17, 0.007, 0.01]], 0.0016), t.satin)
  return g
}

/**
 * A digital upper-arm BP monitor on a desk: the sloped body with its segment display and the
 * START button, the cuff (folded, with its Velcro edge) and the air hose with its connector.
 */
export function bpDigital(e: Ctx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const t = itemMats(e)
  const g = group(p, x, y, z, ry)
  put(g, extrude(e, 'bpBody', [[-0.07, 0], [0.07, 0], [0.065, 0.045], [-0.07, 0.065]], 0.12, 0.012), t.shell, 0, 0, 0).rotation.y = -PI / 2
  const d = face(e, g, 0.075, 0.055, t.lit('bpLcd', 128, 96, lcd([['128', 0.7, 0.42, 0.34], ['82', 0.7, 0.8, 0.34], ['72', 0.95, 0.8, 0.2]]), 0.35), 0, 0.058, -0.005)
  d.rotation.x = -PI / 2 + Math.atan2(0.02, 0.14)
  put(g, lathe(e, 'bpStart', [[0, 0], [0.012, 0], [0.012, 0.004], [0, 0.005]], 18), t.caps.blue, 0, 0.044, 0.045).rotation.x = -0.15
  k.box(g, 0.02, 0.004, 0.01, t.shellGrey, -0.035, 0.044, 0.048, false)
  // The cuff folded beside it: a soft pad with its D-ring and a Velcro strip.
  const cuff = group(g, 0.15, 0, 0.0, 0.2)
  put(cuff, pillow(e, 0.13, 0.03, 0.2), t.cuff, 0, 0.015, 0)
  k.box(cuff, 0.11, 0.003, 0.04, t.graphite, 0, 0.031, 0.06, false)
  put(cuff, geo(e, 'dring', () => new TorusGeometry(0.014, 0.0025, 6, 20)), t.satin, 0.068, 0.02, -0.04).rotation.y = PI / 2
  put(g, hose(e, 'bpHose', [[0.06, 0.03, -0.04], [0.1, 0.03, -0.09], [0.15, 0.03, -0.06], [0.14, 0.03, -0.02]], 0.0028), t.tubeGrey)
  k.cyl(g, 0.005, 0.005, 0.012, m.whitePlastic, 0.068, 0.03, -0.035, 10).rotation.z = PI / 2
  return g
}

/** An infrared non-contact thermometer, lying on its side: the gun-shaped shell, probe lens, trigger and display. */
export function irThermometer(e: Ctx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const t = itemMats(e)
  const g = group(p, x, y, z, ry)
  const body = put(g, extrude(e, 'irBody', [[-0.07, 0.0], [0.0, 0.0], [0.035, 0.03], [0.075, 0.03], [0.08, 0.05], [0.075, 0.065], [-0.035, 0.065], [-0.06, 0.05], [-0.075, 0.02]], 0.035, 0.008), t.shell, 0, 0.0175, 0)
  body.rotation.x = -PI / 2
  const tr = put(g, extrude(e, 'irTrigger', [[-0.015, 0], [0.005, 0], [0.004, 0.015], [-0.012, 0.012]], 0.012, 0.002), t.caps.blue, 0.01, 0.0175, 0.0)
  tr.rotation.x = -PI / 2
  face(e, g, 0.028, 0.02, t.lit('irLcd', 96, 64, lcd([['36.7', 0.92, 0.72, 0.5]]), 0.35), -0.03, 0.0365, -0.045).rotation.x = -PI / 2
  put(g, lathe(e, 'irLens', [[0, 0], [0.008, 0], [0.008, 0.006], [0, 0.006]], 16), t.graphite, 0.083, 0.0175, -0.05).rotation.z = -PI / 2
  return g
}

/** A fingertip pulse oximeter: the hinged two-part clip, its spring, the OLED display and button. */
export function oximeterClip(e: Ctx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k } = e
  const t = itemMats(e)
  const g = group(p, x, y, z, ry)
  put(g, panel(e, 0.033, 0.06, 0.016, 0.012), t.shellGrey, 0, 0.008, 0).rotation.x = -PI / 2
  put(g, panel(e, 0.034, 0.058, 0.018, 0.012), t.caps.blue, 0, 0.026, 0.001).rotation.x = -PI / 2
  face(e, g, 0.022, 0.016, t.lit('oled', 128, 96, oled, 1.0), 0, 0.0355, -0.008).rotation.x = -PI / 2
  k.cyl(g, 0.004, 0.004, 0.002, t.shell, 0, 0.0355, 0.014, 12)
  k.box(g, 0.026, 0.008, 0.006, t.graphite, 0, 0.017, -0.027, false)
  return g
}

/** A glucometer with its test-strip vial and lancing device. */
export function glucometer(e: Ctx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k } = e
  const t = itemMats(e)
  const g = group(p, x, y, z, ry)
  put(g, panel(e, 0.055, 0.09, 0.018, 0.018), t.shell, 0, 0.009, 0).rotation.x = -PI / 2
  face(e, g, 0.04, 0.03, t.lit('gluLcd', 96, 72, lcd([['112', 0.8, 0.62, 0.48], ['mg/dL', 0.95, 0.9, 0.16]]), 0.3), 0, 0.0185, -0.015).rotation.x = -PI / 2
  for (const s of [-1, 1]) k.cyl(g, 0.006, 0.006, 0.003, t.shellGrey, s * 0.012, 0.019, 0.025, 12)
  put(g, lathe(e, 'stripVial', [[0, 0], [0.012, 0], [0.012, 0.045], [0.014, 0.046], [0.014, 0.058], [0, 0.058]], 16), t.shellMid, 0.06, 0, -0.01)
  const lan = group(g, 0.055, 0.008, 0.04, 0.4)
  lan.rotation.z = PI / 2
  put(lan, lathe(e, 'lancet', [[0, 0], [0.008, 0], [0.009, 0.06], [0.006, 0.09], [0, 0.092]], 14), t.caps.blue)
  return g
}

/* ---------- needles, tubes, bags ---------- */

/** A disposable syringe of `ml` (2, 5, 10, 20) lying along x: graduated barrel, finger flange, plunger with its rubber tip, the needle on its hub and the cap. */
export function syringe(e: Ctx, p: Object3D, x: number, y: number, z: number, ry = 0, ml: 2 | 5 | 10 | 20 = 5, capped = true) {
  const t = itemMats(e)
  const dims = { 2: [0.0045, 0.05], 5: [0.0065, 0.06], 10: [0.0085, 0.075], 20: [0.011, 0.085] }[ml]
  const [r, len] = dims
  const g = group(p, x, y + r + 0.001, z, ry)
  const b = group(g, 0, 0, 0)
  b.rotation.z = -PI / 2
  put(b, lathe(e, `syrBarrel${ml}`, [[r * 0.4, -0.004], [r, 0], [r, len], [r * 0.35, len + 0.004], [r * 0.25, len + 0.01], [0, len + 0.01]], 16), t.clear)
  const grad = t.printed(`grad${ml}`, 256, 64, graduations(ml), 0.5)
  grad.transparent = true
  grad.depthWrite = false
  const gr = face(e, b, len * 0.9, r * 1.2, grad, 0, len * 0.5, r + 0.0004)
  gr.rotation.z = PI / 2
  put(b, panel(e, r * 4.6, r * 1.6, 0.0015, r * 0.7), t.clear, 0, -0.002, 0).rotation.x = PI / 2
  // The plunger: the rubber tip inside the barrel, the cruciform rod out of it, the thumb press.
  put(b, lathe(e, `syrTip${ml}`, [[0, 0], [r * 0.97, 0], [r * 0.97, 0.006], [0, 0.008]], 14), t.stopper, 0, len * 0.35, 0)
  put(b, lathe(e, `syrRod${ml}`, [[0, -0.03], [r * 0.6, -0.03], [r * 0.6, len * 0.35], [0, len * 0.35]], 6), t.clear)
  put(b, lathe(e, `syrPress${ml}`, [[0, -0.034], [r * 1.6, -0.034], [r * 1.6, -0.031], [0, -0.031]], 16), t.clear)
  // Hub, needle and its coloured cap.
  put(b, lathe(e, 'needleHub', [[0, 0], [0.0035, 0], [0.003, 0.01], [0, 0.011]], 10), t.caps.green, 0, len + 0.01, 0)
  if (capped) put(b, lathe(e, 'needleCap', [[0, 0], [0.0035, 0], [0.003, 0.032], [0, 0.034]], 10), t.clear, 0, len + 0.019, 0)
  else e.k.cyl(b, 0.0004, 0.0004, 0.03, t.chrome, 0, len + 0.035, 0, 4)
  return g
}

export type CapColour = keyof ItemMats['caps']

/** A vacuum blood collection tube (13 × 75 or 13 × 100 mm) standing: clear PET, its coloured hemogard cap, label, and blood in it if `filled`. */
export function bloodTube(e: Ctx, p: Object3D, x: number, y: number, z: number, cap: CapColour, filled = 0, long = false) {
  const { k } = e
  const t = itemMats(e)
  const h = long ? 0.1 : 0.075
  const g = group(p, x, y, z)
  put(g, lathe(e, `vacTube${h}`, [[0, 0.004], [0.0045, 0.0], [0.0065, 0.004], [0.0065, h - 0.012], [0, h - 0.012]], 12), t.clear)
  if (filled > 0) k.cyl(g, 0.0058, 0.0058, (h - 0.02) * filled, t.blood, 0, 0.004 + ((h - 0.02) * filled) / 2, 0, 10)
  put(g, lathe(e, 'vacCap', [[0, 0], [0.0075, 0], [0.0078, 0.012], [0.007, 0.018], [0, 0.019]], 12), t.caps[cap], 0, h - 0.016, 0)
  const lb = k.cyl(g, 0.0067, 0.0067, h * 0.45, t.printed('tubeLabel', 128, 64, tubeLabel, 0.6), 0, h * 0.42, 0, 12)
  lb.castShadow = false
  return g
}

/** A polypropylene tube rack, `cols` × `rows` holes at 18 mm, with tubes in some holes (caps given per tube, null for an empty hole). */
export function tubeRack(e: Ctx, p: Object3D, x: number, y: number, z: number, ry: number, cols: number, rows: number, caps: (CapColour | null)[]) {
  const { k } = e
  const t = itemMats(e)
  const g = group(p, x, y, z, ry)
  const pitch = 0.018
  const w = cols * pitch + 0.01
  const d = rows * pitch + 0.01
  const plate = t.printed(`rackPlate${cols}x${rows}`, 64, 64, (c, ww, hh) => {
    c.fillStyle = '#f2f2ee'
    c.fillRect(0, 0, ww, hh)
    c.fillStyle = '#9ca0a3'
    c.beginPath()
    c.arc(ww / 2, hh / 2, ww * 0.36, 0, PI * 2)
    c.fill()
  })
  plate.map!.repeat.set(cols, rows)
  plate.map!.wrapS = plate.map!.wrapT = 1000
  for (const yy of [0.012, 0.045]) k.box(g, w, 0.003, d, yy > 0.04 ? plate : t.shell, 0, yy, 0)
  for (const sx of [-1, 1]) k.box(g, 0.003, 0.05, d, t.shell, sx * (w / 2 - 0.0015), 0.025, 0)
  let i = 0
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const cap = caps[i++ % Math.max(1, caps.length)]
      if (!cap) continue
      bloodTube(e, g, -w / 2 + 0.005 + pitch * (c + 0.5), 0.012, -d / 2 + 0.005 + pitch * (r + 0.5), cap, 0.4 + ((r * 7 + c * 3) % 5) * 0.1)
    }
  return g
}

/** A phlebotomy tray's small things: a vacutainer holder with its needle, a latex-free tourniquet strip, alcohol swab sachets and a cotton-ball jar. */
export function phlebotomyKit(e: Ctx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const t = itemMats(e)
  const g = group(p, x, y, z, ry)
  const holder = group(g, -0.06, 0.01, 0.03)
  holder.rotation.z = PI / 2
  put(holder, lathe(e, 'vacHolder', [[0.008, 0], [0.011, 0], [0.011, 0.07], [0.016, 0.072], [0.016, 0.076], [0, 0.076]], 14), t.clear)
  put(holder, lathe(e, 'vacNeedleHub', [[0, -0.012], [0.004, -0.012], [0.004, 0], [0, 0]], 10), t.caps.green)
  put(g, hose(e, 'tourniquet', [[0.0, 0.003, -0.06], [0.06, 0.003, -0.05], [0.1, 0.003, -0.02], [0.14, 0.003, -0.05]], 0.0028, 4), t.caps.blue).scale.set(1, 0.4, 1)
  for (let i = 0; i < 4; i++) k.box(g, 0.035, 0.003, 0.03, m.paper, 0.05 + (i % 2) * 0.038, 0.0015 + Math.floor(i / 2) * 0.003, 0.04, false)
  put(g, lathe(e, 'cottonJar', [[0, 0], [0.035, 0], [0.036, 0.07], [0, 0.07]], 20), t.glass, -0.12, 0, -0.04)
  put(g, pillow(e, 0.06, 0.04, 0.06), t.cotton, -0.12, 0.04, -0.04)
  put(g, lathe(e, 'cottonLid', [[0, 0], [0.038, 0], [0.038, 0.014], [0, 0.014]], 20), m.stainless, -0.12, 0.07, -0.04)
  return g
}

/**
 * An infusion bag hanging from a hook at (x, y, z) in `p` (y the hook's height): the PVC bag with
 * its hanger eyelet, printed face and graduations, the saline in it, the two ports at its foot;
 * the giving set's spike, drip chamber, line with its roller clamp, falling `line` metres.
 */
export function ivBag(e: Ctx, p: Object3D, x: number, y: number, z: number, line = 0.9, name = '0.9% Sodium Chloride', strength = 'Injection IP · 1000 mL') {
  const { k } = e
  const t = itemMats(e)
  const g = group(p, x, y, z)
  // The bag: a flat pillow 0.14 × 0.26, hung by its eyelet tab.
  k.box(g, 0.03, 0.025, 0.002, t.pvc, 0, -0.012, 0, false)
  put(g, geo(e, 'bagEye', () => new TorusGeometry(0.006, 0.0015, 6, 14)), t.pvc, 0, -0.008, 0)
  put(g, pillow(e, 0.14, 0.026, 0.26), t.pvc, 0, -0.16, 0).rotation.x = PI / 2
  put(g, pillow(e, 0.126, 0.02, 0.17), t.saline, 0, -0.2, 0).rotation.x = PI / 2
  const label = t.printed(`bag_${name}`, 256, 460, bagPrint(name, strength), 0.5)
  label.transparent = true
  face(e, g, 0.13, 0.24, label, 0, -0.16, 0.0135)
  // Ports: the administration port (with the spike in it) and the capped medication port.
  k.cyl(g, 0.004, 0.004, 0.025, t.pvc, -0.02, -0.3, 0, 8)
  put(g, lathe(e, 'medPort', [[0, 0], [0.006, 0], [0.006, 0.012], [0, 0.012]], 10), t.caps.blue, 0.02, -0.31, 0)
  k.cyl(g, 0.006, 0.004, 0.03, t.clear, -0.02, -0.325, 0, 10)
  // Drip chamber with its fluid level, then the line and the roller clamp on it.
  put(g, lathe(e, 'dripChamber', [[0, 0], [0.004, 0], [0.008, 0.008], [0.008, 0.055], [0.005, 0.062], [0, 0.062]], 14), t.clear, -0.02, -0.405, 0)
  k.cyl(g, 0.0072, 0.0072, 0.022, t.saline, -0.02, -0.393, 0, 12)
  if (line > 0) {
    put(g, hose(e, `ivLine${line.toFixed(2)}`, [[-0.02, -0.41, 0], [-0.025, -0.41 - line * 0.35, 0.02], [-0.01, -0.41 - line * 0.7, 0.05], [0.02, -0.41 - line, 0.08]], 0.0018, 6), t.clear)
    const clamp = group(g, -0.024, -0.41 - line * 0.3, 0.015)
    put(clamp, panel(e, 0.02, 0.045, 0.012, 0.004), t.shell)
    k.cyl(clamp, 0.006, 0.006, 0.006, t.caps.blue, 0, 0.004, 0.006, 12).rotation.z = PI / 2
  }
  return g
}

/** A glass or PET infusion bottle hanging neck-down in its hanger strap (as for dextrose or a reagent). */
export function ivBottle(e: Ctx, p: Object3D, x: number, y: number, z: number, line = 0.6) {
  const { k } = e
  const t = itemMats(e)
  const g = group(p, x, y, z)
  put(g, bentTube(e, 'bottleStrap', [[-0.035, -0.06, 0], [-0.02, -0.005, 0], [0.02, -0.005, 0], [0.035, -0.06, 0]], 0.0015, 0.01), t.pvc)
  const b = group(g, 0, -0.06, 0)
  b.rotation.z = PI
  put(b, lathe(e, 'ivBottleBody', [[0, 0.0], [0.035, 0.0], [0.038, 0.01], [0.038, 0.16], [0.02, 0.19], [0.012, 0.2], [0.012, 0.215], [0, 0.215]], 20), t.glass, 0, -0.215, 0)
  put(b, lathe(e, 'ivBottleLiquid', [[0, 0.0], [0.034, 0.0], [0.034, 0.12], [0, 0.12]], 18), t.saline, 0, -0.205, 0)
  k.cyl(b, 0.014, 0.014, 0.012, t.stopper, 0, 0.004, 0, 14)
  if (line > 0) put(g, hose(e, `bottleLine${line}`, [[0, -0.285, 0], [0.01, -0.285 - line * 0.5, 0.02], [0.03, -0.285 - line, 0.05]], 0.0018, 6), t.clear)
  return g
}

/* ---------- trays and dressings ---------- */

/** Forceps, scissors and artery forceps laid on a tray, along x, at y; seeded so each tray differs. */
export function instruments(e: Ctx, p: Object3D, x: number, y: number, z: number, seed = 1) {
  const t = itemMats(e)
  const r = rng(seed)
  const g = group(p, x, y, z, (r() - 0.5) * 0.2)
  // Artery forceps: two shanks crossing at a box joint, finger rings, a ratchet.
  const forceps = (dx: number, dz: number, len: number, ry: number) => {
    const f = group(g, dx, 0.003, dz, ry)
    for (const s of [-1, 1]) {
      put(f, bentTube(e, `fShank${len}|${s}`, [[0, 0, 0], [len * 0.55, 0, s * 0.004], [len, 0, s * 0.012]], 0.0018, 0.02), t.chrome)
      put(f, geo(e, 'fRing', () => new TorusGeometry(0.008, 0.0016, 6, 16)), t.chrome, len + 0.008, 0, s * 0.012).rotation.x = PI / 2
    }
  }
  // Scissors: two blades and two bows.
  const scissors = (dx: number, dz: number, ry: number) => {
    const s0 = group(g, dx, 0.003, dz, ry)
    put(s0, extrude(e, 'blade', [[0, -0.003], [0.075, -0.0005], [0.075, 0.0015], [0, 0.003]], 0.002, 0.0003), t.chrome, -0.075, 0, 0).rotation.x = PI / 2
    for (const s of [-1, 1]) {
      put(s0, bentTube(e, `scShank${s}`, [[0, 0, 0], [0.04, 0, s * 0.01]], 0.0018, 0.01), t.chrome)
      put(s0, geo(e, 'scBow', () => new TorusGeometry(0.009, 0.0016, 6, 16)), t.chrome, 0.05, 0, s * 0.012).rotation.x = PI / 2
    }
  }
  // Dissecting forceps: a pair of sprung blades joined at the back.
  const tweezers = (dx: number, dz: number, ry: number) => {
    const tw = group(g, dx, 0.002, dz, ry)
    for (const s of [-1, 1]) put(tw, bentTube(e, `tw${s}`, [[0, 0, 0], [0.07, 0, s * 0.005], [0.14, 0, s * 0.002]], 0.0016, 0.02), t.chrome)
  }
  forceps(-0.06, -0.04, 0.12, 0.05)
  forceps(-0.06, -0.005, 0.1, -0.04)
  scissors(0.04, 0.03, PI + 0.08)
  tweezers(-0.07, 0.04, 0.02)
  return g
}

/** A stainless kidney tray (250 mm), its kidney outline and rolled rim. */
export function kidneyTray(e: Ctx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const t = itemMats(e)
  const g = group(p, x, y, z, ry)
  const outline = (s: number): [number, number][] => {
    const pts: [number, number][] = []
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * PI * 2
      const rr = 1 - 0.32 * Math.max(0, Math.cos(a)) ** 2
      pts.push([Math.cos(a) * 0.125 * s * (Math.sin(a) > 0 ? rr : 1), Math.sin(a) * 0.06 * s * rr])
    }
    return pts
  }
  put(g, extrude(e, 'kidneyBase', outline(0.88), 0.002, 0), t.satin, 0, 0.002, 0).rotation.x = -PI / 2
  put(g, extrude(e, 'kidneyWall', outline(1), 0.035, 0.002), t.satin, 0, 0.02, 0).rotation.x = -PI / 2
  put(g, extrude(e, 'kidneyHollow', outline(0.92), 0.032, 0.001), t.graphite, 0, 0.022, 0).rotation.x = -PI / 2
  return g
}

/** A stainless gallipot (60 mm), optionally with antiseptic in it. */
export function gallipot(e: Ctx, p: Object3D, x: number, y: number, z: number, liquid = false) {
  const t = itemMats(e)
  put(p, lathe(e, 'gallipot2', [[0, 0], [0.024, 0], [0.03, 0.035], [0.032, 0.036], [0.031, 0.038], [0.028, 0.004], [0, 0.004]], 20), t.satin, x, y, z)
  if (liquid) e.k.cyl(p, 0.027, 0.027, 0.002, t.iodine, x, y + 0.02, z, 16)
}

/** A stainless instrument tray (300 × 200 mm), rolled rim, with instruments on a green drape. */
export function instrumentTray(e: Ctx, p: Object3D, x: number, y: number, z: number, ry = 0, seed = 1) {
  const { k } = e
  const t = itemMats(e)
  const g = group(p, x, y, z, ry)
  k.box(g, 0.3, 0.002, 0.2, t.satin, 0, 0.001, 0)
  for (const s of [-1, 1]) {
    k.box(g, 0.3, 0.02, 0.0015, t.satin, 0, 0.011, s * 0.1)
    k.box(g, 0.0015, 0.02, 0.2, t.satin, s * 0.15, 0.011, 0)
    rod(e, g, 0.0022, 0.3, t.satin, 0, 0.021, s * 0.1, 'x', 8)
  }
  k.box(g, 0.27, 0.0012, 0.17, e.m.green, 0, 0.003, 0, false)
  instruments(e, g, 0, 0.003, 0, seed)
  return g
}

/** A roll of cotton wool in its blue paper wrap, part unrolled; standing on its side, r ≈ 60 mm. */
export function cottonRoll(e: Ctx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const t = itemMats(e)
  const g = group(p, x, y + 0.055, z, ry)
  const roll = put(g, lathe(e, 'cottonRoll', [[0.01, -0.06], [0.055, -0.06], [0.058, -0.055], [0.058, 0.055], [0.055, 0.06], [0.01, 0.06]], 24), t.bluePaper)
  roll.rotation.z = PI / 2
  const c = put(g, lathe(e, 'cottonFace', [[0.012, 0], [0.052, 0], [0.052, 0.003], [0.012, 0.003]], 24), t.cotton, 0.061, 0, 0)
  c.rotation.z = -PI / 2
  put(g, pillow(e, 0.06, 0.012, 0.09), t.cotton, 0.07, -0.05, 0.02)
  return g
}

/** A crêpe bandage roll (75 mm) in its cellophane, or a gauze roll. */
export function bandageRoll(e: Ctx, p: Object3D, x: number, y: number, z: number, ry = 0, gauze = false) {
  const t = itemMats(e)
  const g = group(p, x, y + 0.03, z, ry)
  const b = put(g, lathe(e, 'bandage', [[0.006, -0.038], [0.028, -0.038], [0.03, -0.035], [0.03, 0.035], [0.028, 0.038], [0.006, 0.038]], 20), gauze ? t.cotton : t.crepe)
  b.rotation.z = PI / 2
  return g
}

/** Sealed sterile gauze swab packets, a small stack. */
export function gauzePacks(e: Ctx, p: Object3D, x: number, y: number, z: number, n = 4, ry = 0) {
  const { m } = e
  const t = itemMats(e)
  const g = group(p, x, y, z, ry)
  const pack = t.printed('gauzePack', 128, 128, (c, w, h) => {
    c.fillStyle = '#f6f6f2'
    c.fillRect(0, 0, w, h)
    c.strokeStyle = '#3d6cb0'
    c.lineWidth = 4
    c.strokeRect(6, 6, w - 12, h - 12)
    c.fillStyle = '#3d6cb0'
    c.font = SANS(h * 0.13, 700)
    c.fillText('STERILE', w * 0.12, h * 0.4)
    c.font = SANS(h * 0.09, 500)
    c.fillText('Gauze Swabs 10×10', w * 0.12, h * 0.58)
    c.fillText('8 ply · 5 pcs', w * 0.12, h * 0.72)
  })
  for (let i = 0; i < n; i++) {
    const s = put(g, pillow(e, 0.105, 0.008, 0.105), m.paper, (i % 2) * 0.004, 0.004 + i * 0.008, (i % 3) * 0.003)
    s.rotation.y = (i - 1) * 0.06
  }
  face(e, g, 0.1, 0.1, pack, 0, 0.004 + n * 0.008 + 0.0005, 0).rotation.x = -PI / 2
  return g
}

/** A bottle of antiseptic solution (povidone-iodine or chlorhexidine): its shoulder, flip cap and wrap label. */
export function antisepticBottle(e: Ctx, p: Object3D, x: number, y: number, z: number, kind: 'iodine' | 'chlorhexidine' | 'spirit' = 'iodine', h = 0.16) {
  const { k } = e
  const t = itemMats(e)
  const g = group(p, x, y, z)
  const r = h * 0.22
  const body = kind === 'iodine' ? t.amberGlass : t.clear
  put(g, lathe(e, `antiBody${h}`, [[0, 0], [r * 0.95, 0], [r, r * 0.15], [r, h * 0.72], [r * 0.6, h * 0.84], [r * 0.4, h * 0.86], [r * 0.4, h * 0.88], [0, h * 0.88]], 20), body)
  if (kind !== 'iodine') put(g, lathe(e, `antiLiq${h}`, [[0, 0.003], [r * 0.93, 0.003], [r * 0.93, h * 0.6], [0, h * 0.6]], 18), kind === 'chlorhexidine' ? t.caps.red : t.saline)
  put(g, lathe(e, 'flipCap', [[0, 0], [r * 0.45, 0], [r * 0.45, h * 0.1], [r * 0.3, h * 0.14], [0, h * 0.14]], 16), kind === 'iodine' ? t.graphite : t.caps.blue, 0, h * 0.86, 0)
  const label = t.printed(`antiLabel_${kind}`, 256, 128, (c, w, hh) => {
    c.fillStyle = kind === 'iodine' ? '#fff7e6' : '#ffffff'
    c.fillRect(0, 0, w, hh)
    c.fillStyle = kind === 'iodine' ? '#7a3d0c' : kind === 'chlorhexidine' ? '#b0132a' : '#1f4f9a'
    c.fillRect(0, 0, w, hh * 0.22)
    c.font = SANS(hh * 0.17, 800)
    c.fillText(kind === 'iodine' ? 'POVIDONE-IODINE 5%' : kind === 'chlorhexidine' ? 'CHLORHEXIDINE 2%' : 'SURGICAL SPIRIT', w * 0.05, hh * 0.5)
    c.font = SANS(hh * 0.1, 500)
    c.fillStyle = '#333'
    c.fillText('Antiseptic solution · 500 mL', w * 0.05, hh * 0.7)
    c.fillText('For external use only', w * 0.05, hh * 0.85)
  })
  const lb = k.cyl(g, r + 0.0006, r + 0.0006, h * 0.45, label, 0, h * 0.38, 0, 20)
  lb.castShadow = false
  return g
}

/** A roll of surgical paper tape (micropore) on its plastic core. */
export function tapeRoll(e: Ctx, p: Object3D, x: number, y: number, z: number) {
  const t = itemMats(e)
  put(p, lathe(e, 'tapeRoll', [[0.013, 0], [0.024, 0], [0.024, 0.025], [0.013, 0.025]], 20), t.cotton, x, y, z)
  put(p, lathe(e, 'tapeCore', [[0.011, 0], [0.013, 0], [0.013, 0.025], [0.011, 0.025]], 16), t.caps.blue, x, y, z)
}

/* ---------- oxygen ---------- */

/**
 * An oxygen regulator-flowmeter on a cylinder's pin-index valve, at the valve's top (local origin):
 * the yoke and its T-screw, the brass body with its contents gauge, the Thorpe-tube flowmeter with
 * its float and knob, and the humidifier bottle under the outlet. Faces +z.
 */
export function regulator(e: Ctx, p: Object3D, x: number, y: number, z: number, ry = 0, humidifier = true) {
  const { k, m } = e
  const t = itemMats(e)
  const g = group(p, x, y, z, ry)
  // The yoke clamped over the valve, its T-handle screw at the back.
  put(g, panel(e, 0.05, 0.06, 0.03, 0.006), t.chrome, 0, 0, -0.005)
  rod(e, g, 0.004, 0.05, t.chrome, 0, 0, -0.04, 'z', 10)
  rod(e, g, 0.004, 0.05, t.chrome, 0, 0, -0.065, 'x', 10)
  // The body and its contents gauge, face up and out.
  put(g, lathe(e, 'regBody', [[0, 0], [0.022, 0], [0.024, 0.01], [0.024, 0.05], [0.02, 0.055], [0, 0.055]], 24), t.brass, 0, 0.02, 0.015).rotation.x = PI / 2
  const gauge = group(g, 0, 0.065, 0.035)
  gauge.rotation.x = -0.25
  put(gauge, lathe(e, 'gaugeCase', [[0, 0], [0.03, 0], [0.032, 0.006], [0.032, 0.018], [0.03, 0.022], [0, 0.022]], 28), t.chrome).rotation.x = PI / 2
  face(e, gauge, 0.054, 0.054, t.printed('o2gauge', 256, 256, o2Gauge, 0.3), 0, 0, 0.0225)
  k.cyl(gauge, 0.029, 0.029, 0.002, t.clear, 0, 0, 0.024, 24).rotation.x = PI / 2
  rod(e, g, 0.006, 0.03, t.chrome, 0, 0.045, 0.02, 'z', 10)
  // The flowmeter: a clear tube in its frame on the outlet, the float, the knob below.
  const fm = group(g, 0.045, 0.05, 0.04)
  k.box(fm, 0.03, 0.12, 0.01, t.chrome, 0, 0, -0.01)
  put(fm, lathe(e, 'thorpe', [[0, 0], [0.008, 0], [0.01, 0.11], [0, 0.11]], 14), t.clear, 0, -0.055, 0.002)
  face(e, fm, 0.012, 0.1, e.m.flowScale, 0.012, 0, 0.004)
  k.sphere(fm, 0.004, t.chrome, 0, -0.01, 0.002)
  put(fm, lathe(e, 'fmKnob', [[0, 0], [0.012, 0], [0.013, 0.008], [0.012, 0.016], [0, 0.016]], 16), m.green, 0, -0.08, 0.002)
  if (!humidifier) return g
  // The humidifier bottle, threaded on below the outlet, two-thirds full of sterile water.
  const h = group(g, 0.045, -0.1, 0.045)
  put(h, lathe(e, 'humCap', [[0, 0], [0.028, 0], [0.028, 0.02], [0, 0.02]], 20), t.shell, 0, 0.0, 0)
  put(h, lathe(e, 'humBottle', [[0, -0.11], [0.026, -0.11], [0.028, -0.1], [0.028, 0.0], [0, 0.0]], 20), t.clear)
  put(h, lathe(e, 'humWater', [[0, -0.107], [0.025, -0.107], [0.025, -0.04], [0, -0.04]], 16), t.saline)
  rod(e, h, 0.004, 0.025, t.shell, 0.03, 0.01, 0, 'x', 8)
  return g
}

/* ---------- a castor for small carts ---------- */

/** A small twin-wheel castor (50 mm) for a trolley, with or without its brake. */
export function cartCastor(e: Ctx, p: Object3D, x: number, z: number, brake = false) {
  castor(e, p, x, z, 0.038, 0, brake)
}
