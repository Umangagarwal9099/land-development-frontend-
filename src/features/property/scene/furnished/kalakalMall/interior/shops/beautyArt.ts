import { CanvasTexture, DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, type Material } from 'three'
import { rng, type Paint } from '../../../textures'
import type { FloorCtx } from '../shell'
import { Atlas } from '../signs'
import { stoneMaterial } from '../stone'
import { PI } from './kit'

/*
 * The beauty boutique's finishes and print, from the reference: a fine cream terrazzo floor (a
 * warmer field inlaid round the column), blush and cream limewashed plaster, a round braided jute
 * rug, the eyeshadow pans and the shade swatches, small abstract prints for the shelves, and the
 * house's labels, every one painted into one atlas so the bottles' labels share a material.
 */

export const HOUSE = 'ROSÉ ATELIER'
const SERIF = '"Cormorant Garamond", "Playfair Display", Georgia, serif'
const SANS = '"Inter", "Helvetica Neue", Arial, sans-serif'

/** Terrazzo: a pale cement ground with fine chips of marble in grey, white, sand and terracotta. */
const terrazzo = (ground: string, seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = ground
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 400; i++) {
    const x = r() * w
    const y = r() * h
    const s = w * (0.02 + r() * 0.06)
    const gr = g.createRadialGradient(x, y, 0, x, y, s)
    gr.addColorStop(0, r() < 0.5 ? 'rgba(255,255,255,.08)' : 'rgba(120,100,80,.05)')
    gr.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = gr
    g.fillRect(x - s, y - s, s * 2, s * 2)
  }
  const chips = ['#8f8a85', '#b9b2aa', '#f7f4ef', '#d9c7b0', '#c78f72', '#6d6965', '#e6d8c8']
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = chips[Math.floor(r() * chips.length)]
    const x = r() * w
    const y = r() * h
    const s = 0.8 + r() * r() * 5
    g.beginPath()
    g.moveTo(x, y)
    for (let k = 1; k < 5; k++) {
      const a = (k / 5) * PI * 2 + r()
      g.lineTo(x + Math.cos(a) * s * (0.6 + r() * 0.6), y + Math.sin(a) * s * (0.6 + r() * 0.6))
    }
    g.closePath()
    g.fill()
  }
}

/** Limewash: a soft cloudy plaster in one tone, brushed. */
const limewash = (base: [number, number, number], seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  const [cr, cg, cb] = base
  g.fillStyle = `rgb(${cr},${cg},${cb})`
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 520; i++) {
    const x = r() * w
    const y = r() * h
    const s = w * (0.04 + r() * 0.12)
    const gr = g.createRadialGradient(x, y, 0, x, y, s)
    const d = r() < 0.5 ? 14 : -12
    gr.addColorStop(0, `rgba(${cr + d},${cg + d},${cb + d},0.22)`)
    gr.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
    g.fillStyle = gr
    g.fillRect(x - s, y - s, s * 2, s * 2)
  }
  for (let i = 0; i < 3000; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)'
    g.fillRect(r() * w, r() * h, 2, 2)
  }
}

/** A round braided jute rug: concentric plaits of natural fibre, the whole rug in one texture. */
const jute: Paint = (g, w, h) => {
  const r = rng(808)
  const c = w / 2
  g.fillStyle = '#cbb48e'
  g.fillRect(0, 0, w, h)
  const rings = 34
  for (let i = rings; i > 0; i--) {
    const rad = (i / rings) * c
    g.beginPath()
    g.arc(c, c, rad, 0, PI * 2)
    g.fillStyle = i % 2 ? '#d3be98' : '#c2a983'
    g.fill()
    // The plait: short slanted strokes round the ring.
    const n = Math.round(rad * 0.9)
    g.strokeStyle = 'rgba(90,70,40,.22)'
    g.lineWidth = 1.2
    for (let k = 0; k < n; k++) {
      const a = (k / n) * PI * 2
      const r0 = rad - (c / rings) * 0.85
      g.beginPath()
      g.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0)
      g.lineTo(c + Math.cos(a + 0.04) * rad, c + Math.sin(a + 0.04) * rad)
      g.stroke()
    }
  }
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(255,240,210,.12)' : 'rgba(80,60,30,.1)'
    g.fillRect(r() * w, r() * h, 1.5, 1.5)
  }
}

/** An eyeshadow palette's pans: `cols` × `rows` round pans of the shades, mattes and shimmers, in a black well. */
export const pans = (shades: string[], cols: number, rows: number): Paint => (g, w, h) => {
  g.fillStyle = '#1c1a1a'
  g.fillRect(0, 0, w, h)
  const cw = w / cols
  const ch = h / rows
  shades.slice(0, cols * rows).forEach((col, i) => {
    const x = (i % cols) * cw + cw / 2
    const y = Math.floor(i / cols) * ch + ch / 2
    const rad = Math.min(cw, ch) * 0.42
    g.fillStyle = '#5a5552'
    g.beginPath()
    g.arc(x, y, rad + 2, 0, PI * 2)
    g.fill()
    const gr = g.createRadialGradient(x - rad * 0.3, y - rad * 0.3, 0, x, y, rad)
    gr.addColorStop(0, i % 3 === 2 ? '#fff6e8' : col)
    gr.addColorStop(0.35, col)
    gr.addColorStop(1, col)
    g.fillStyle = gr
    g.beginPath()
    g.arc(x, y, rad, 0, PI * 2)
    g.fill()
  })
}

/** A small abstract print of the kind on the reference's shelves: arches and a sun in clay tones on paper. */
const print = (seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = '#f3ece2'
  g.fillRect(0, 0, w, h)
  const tones = ['#c98a6b', '#e2b8a4', '#a65e43', '#d9c2a5', '#8f9c86']
  for (let i = 0; i < 3; i++) {
    g.fillStyle = tones[Math.floor(r() * tones.length)]
    const x = w * (0.2 + r() * 0.5)
    const y = h * (0.35 + r() * 0.4)
    const s = w * (0.18 + r() * 0.2)
    g.beginPath()
    if (i === 0) g.arc(x, y, s * 0.6, 0, PI * 2)
    else {
      g.moveTo(x - s / 2, h * 0.92)
      g.lineTo(x - s / 2, y)
      g.arc(x, y, s / 2, PI, 0)
      g.lineTo(x + s / 2, h * 0.92)
    }
    g.fill()
  }
}

/* ---------- labels ---------- */

export interface LabelSpec {
  /** The product's name, in the house serif. */
  name: string
  /** A line under it: what it is, its size. */
  line?: string
  ground: string
  ink: string
  /** Pixel size of the cell (its aspect is the label's). */
  w?: number
  h?: number
}

/** A label: the house's name small and spaced, the product name in serif, a fine rule, the line. */
const labelPaint = (l: LabelSpec) => (g: CanvasRenderingContext2D, w: number, h: number) => {
  g.fillStyle = l.ground
  g.fillRect(0, 0, w, h)
  g.fillStyle = l.ink
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  const unit = Math.min(w, h * 1.4)
  g.font = `600 ${Math.round(unit * 0.075)}px ${SANS}`
  const house = HOUSE.split('').join(String.fromCharCode(8202))
  g.fillText(house, w / 2, h * 0.2)
  let size = unit * 0.15
  for (;;) {
    g.font = `500 ${Math.round(size)}px ${SERIF}`
    if (g.measureText(l.name).width < w * 0.88 || size < 8) break
    size *= 0.92
  }
  g.fillText(l.name, w / 2, h * 0.47)
  g.fillRect(w * 0.35, h * 0.62, w * 0.3, Math.max(1, h * 0.008))
  if (l.line) {
    g.font = `500 ${Math.round(unit * 0.065)}px ${SANS}`
    g.fillText(l.line.toUpperCase(), w / 2, h * 0.76)
  }
}

/* ---------- materials ---------- */

export function beautyMaterials(e: FloorCtx) {
  const { k, m, lux } = e
  const env = m.env
  const mark = <T extends Material>(x: T) => ((x.userData.interior = true), x)
  const std = (p: ConstructorParameters<typeof MeshStandardMaterial>[0], reflect = 0.5) => mark(new MeshStandardMaterial({ envMap: env, envMapIntensity: reflect, ...p }))
  const glass = (color: string, opacity: number, rough = 0.04) => mark(new MeshPhysicalMaterial({ color, roughness: rough, transparent: true, opacity, depthWrite: false, envMap: env, envMapIntensity: 1.3 }))
  const tex = (w: number, h: number, paint: Paint, mx: number, my = mx) => {
    const t = k.tex.painted(w, h, paint)
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(1 / mx, 1 / my)
    t.anisotropy = 8
    return t
  }
  const canvas = (w: number, h: number, paint: Paint) => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    paint(c.getContext('2d')!, w, h)
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    t.anisotropy = 8
    return t
  }
  const labels = new Atlas(2048, 2048)
  const labelMat = std({ map: labels.texture, roughness: 0.55 }, 0.15)
  const cache = new Map<string, [number, number, number, number]>()
  const lacquer = (color: string, rough = 0.32) => std({ color, roughness: rough }, 0.45)
  const metal = (color: string, rough = 0.25) => std({ color, metalness: 1, roughness: rough }, 1.0)
  return {
    terrazzo: std({ map: tex(1024, 1024, terrazzo('#e8e1d7', 61), 1.2), roughness: 0.3 }, 0.35),
    terrazzoWarm: std({ map: tex(1024, 1024, terrazzo('#e3d3c4', 62), 1.2), roughness: 0.3 }, 0.35),
    pinkPlaster: std({ map: tex(1024, 1024, limewash([233, 203, 190], 71), 2.0), roughness: 0.92 }, 0.05),
    creamPlaster: std({ map: tex(1024, 1024, limewash([241, 231, 218], 72), 2.0), roughness: 0.92 }, 0.05),
    ceilingPlaster: std({ map: tex(512, 512, limewash([244, 237, 227], 73), 2.0), roughness: 0.95 }, 0.03),
    jute: std({ map: canvas(1024, 1024, jute), roughness: 0.97 }, 0.02),
    blush: lacquer('#e6b8a6'),
    blushDeep: lacquer('#d9a08c'),
    sage: lacquer('#b8c9b1'),
    cream: lacquer('#efe6d8', 0.4),
    ivory: lacquer('#f4efe7', 0.35),
    marble: lux.statuario,
    marbleTop: stoneMaterial(k, 'statuario', env, { roughness: 0.12, reflect: 0.7, repeat: 1.2 }),
    brass: lux.brass,
    gold: metal('#d4b170', 0.18),
    roseGold: metal('#d4a28e', 0.2),
    chrome: lux.chrome,
    blackGloss: std({ color: '#141414', roughness: 0.15 }, 0.8),
    blackMatte: std({ color: '#1b1a1a', roughness: 0.6 }, 0.2),
    whiteGloss: std({ color: '#f7f5f1', roughness: 0.2 }, 0.6),
    whiteMatte: std({ color: '#f3f0ea', roughness: 0.6 }, 0.2),
    blushPlastic: std({ color: '#efcfc4', roughness: 0.35 }, 0.4),
    rubberBulb: std({ color: '#eae4dc', roughness: 0.5 }, 0.2),
    clearGlass: glass('#f4f7f6', 0.22, 0.02),
    frostedPink: mark(new MeshPhysicalMaterial({ color: '#f1cfc4', roughness: 0.45, transparent: true, opacity: 0.88, envMap: env, envMapIntensity: 0.6 })),
    frostedWhite: mark(new MeshPhysicalMaterial({ color: '#f4f1ec', roughness: 0.5, transparent: true, opacity: 0.92, envMap: env, envMapIntensity: 0.5 })),
    amberGlass: glass('#a3612a', 0.75, 0.05),
    pinkGlass: glass('#e8a99b', 0.6, 0.05),
    liquid: (color: string, opacity = 0.85) => mark(new MeshPhysicalMaterial({ color, roughness: 0.1, transparent: true, opacity, envMap: env, envMapIntensity: 0.8 })),
    shade: (color: string, rough = 0.45) => std({ color, roughness: rough }, 0.25),
    terracotta: std({ color: '#c46e4a', roughness: 0.85 }, 0.05),
    clayPink: std({ color: '#e1ae9c', roughness: 0.6 }, 0.15),
    ceramicWhite: std({ color: '#f6f3ee', roughness: 0.35 }, 0.4),
    paper: std({ color: '#f2ece2', roughness: 0.8 }, 0.05),
    dried: std({ color: '#d8c3a2', roughness: 0.9 }, 0.02),
    driedDark: std({ color: '#b39470', roughness: 0.9 }, 0.02),
    fern: mark(new MeshStandardMaterial({ color: '#3f6b2e', roughness: 0.55, side: DoubleSide, envMap: env, envMapIntensity: 0.15 })),
    opal: lux.opal,
    mirror: lux.mirror,
    prints: [1, 2, 3, 4].map((i) => std({ map: canvas(256, 320, print(900 + i)), roughness: 0.8 }, 0.05)),
    /** Fills the label atlas once per label; its UVs. */
    label: (l: LabelSpec) => {
      const key = `${l.name}|${l.line}|${l.ground}|${l.ink}|${l.w}|${l.h}`
      let uv = cache.get(key)
      if (!uv) {
        uv = labels.cell(l.w ?? 192, l.h ?? 128, labelPaint(l))
        cache.set(key, uv)
      }
      return uv
    },
    labelMat,
    canvas,
    std,
  }
}

export type BeautyMaterials = ReturnType<typeof beautyMaterials>
