import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three'

// Finishes are painted on canvases at load time, so the design model needs no texture downloads
// (the kiosk runs offline). Each canvas is uploaded once; repeats are clones sharing its source.

type Paint = (g: CanvasRenderingContext2D, w: number, h: number) => void

function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function canvas(w: number, h: number, paint: Paint): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  paint(c.getContext('2d')!, w, h)
  return c
}

const clamp = (v: number) => Math.max(0, Math.min(255, v))

/** Honed cross-cut travertine; `joints` draws the tile edge for floors laid in 1600 × 800. */
const travertine = (seed: number, joints: boolean): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = '#d8cdbc'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 260; i++) {
    g.fillStyle = r() < 0.5 ? `rgba(160,138,110,${0.05 + r() * 0.12})` : `rgba(245,238,226,${0.05 + r() * 0.15})`
    g.fillRect(0, r() * h, w, 1 + r() * 7)
  }
  for (let i = 0; i < 500; i++) {
    g.fillStyle = `rgba(120,100,78,${0.08 + r() * 0.18})`
    g.beginPath()
    g.ellipse(r() * w, r() * h, 1 + r() * 6, 0.5 + r() * 1.4, 0, 0, 7)
    g.fill()
  }
  if (joints) {
    g.strokeStyle = 'rgba(120,104,84,.55)'
    g.lineWidth = 2
    g.strokeRect(1, 1, w - 2, h - 2)
  }
}

/** Four wide planks side by side with grain and one butt joint each. */
const planks = (base: [number, number, number], seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  const pw = w / 4
  for (let p = 0; p < 4; p++) {
    const tone = r() * 24 - 12
    g.fillStyle = `rgb(${base.map((v) => clamp(v + tone)).join(',')})`
    g.fillRect(p * pw, 0, pw, h)
    for (let i = 0; i < 70; i++) {
      const x = p * pw + r() * pw
      g.strokeStyle = `rgba(${r() < 0.6 ? '40,28,18' : '255,240,220'},${0.05 + r() * 0.1})`
      g.lineWidth = 0.5 + r() * 2
      g.beginPath()
      g.moveTo(x, 0)
      for (let y = 0; y <= h; y += 64) g.lineTo(x + Math.sin(y * 0.01 + i) * 3 * r(), y)
      g.stroke()
    }
    g.fillStyle = 'rgba(30,20,12,.55)'
    g.fillRect(p * pw, 0, 2, h)
    g.fillRect(p * pw, r() * h, pw, 2)
  }
}

/** 24 flutes across 600 mm, each shaded as a half-round. */
const flutes = (base: [number, number, number], seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  const n = 24
  const fw = w / n
  for (let i = 0; i < n; i++) {
    const t = r() * 14 - 7
    const c = (v: number) => `rgb(${base.map((x) => clamp(x + v + t)).join(',')})`
    const gr = g.createLinearGradient(i * fw, 0, (i + 1) * fw, 0)
    gr.addColorStop(0, c(-34))
    gr.addColorStop(0.25, c(6))
    gr.addColorStop(0.55, c(22))
    gr.addColorStop(1, c(-26))
    g.fillStyle = gr
    g.fillRect(i * fw, 0, fw, h)
  }
  for (let i = 0; i < 60; i++) {
    g.strokeStyle = `rgba(20,12,6,${0.05 + r() * 0.08})`
    const x = r() * w
    g.beginPath()
    g.moveTo(x, 0)
    g.lineTo(x + r() * 4 - 2, h)
    g.stroke()
  }
}

const quartzite: Paint = (g, w, h) => {
  const r = rng(8)
  g.fillStyle = '#e6ddd0'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 18; i++) {
    g.strokeStyle = `rgba(${r() < 0.5 ? '176,150,112' : '150,132,110'},${0.12 + r() * 0.22})`
    g.lineWidth = 1 + r() * 5
    g.beginPath()
    let x = r() * w
    let y = r() * h
    g.moveTo(x, y)
    for (let s = 0; s < 6; s++) {
      x += r() * 260 - 60
      y += r() * 160 - 80
      g.quadraticCurveTo(x - 60, y + 40, x, y)
    }
    g.stroke()
  }
}

/** Fior di Bosco: grey-brown ground with white veining. */
const marble: Paint = (g, w, h) => {
  const r = rng(4)
  g.fillStyle = '#8a827b'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 2200; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '60,54,50' : '170,162,154'},${r() * 0.12})`
    g.fillRect(r() * w, r() * h, 3, 3)
  }
  for (let i = 0; i < 34; i++) {
    g.strokeStyle = `rgba(236,230,222,${0.25 + r() * 0.5})`
    g.lineWidth = 0.6 + r() * 2.4
    g.beginPath()
    let x = r() * w
    let y = 0
    g.moveTo(x, y)
    while (y < h) {
      x += r() * 60 - 30
      y += 20 + r() * 50
      g.lineTo(x, y)
    }
    g.stroke()
  }
}

/** Soft clouded surface: lime plaster, Kota stone. `strength` scales how mottled it is. */
const clouded = (ground: string, light: string, dark: string, seed: number, joints: boolean, strength = 1): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = ground
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 140; i++) {
    const x = r() * w
    const y = r() * h
    const rad = 10 + r() * 80
    const gr = g.createRadialGradient(x, y, 0, x, y, rad)
    gr.addColorStop(0, `rgba(${r() < 0.5 ? dark : light},${(0.18 + r() * 0.22) * strength})`)
    gr.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = gr
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }
  if (joints) {
    g.strokeStyle = 'rgba(40,44,40,.55)'
    g.lineWidth = 2
    g.strokeRect(1, 1, w - 2, h - 2)
  }
}

const speckle = (ground: string, dark: string, light: string, seed: number, count: number, size: number, alpha: number): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = ground
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < count; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? dark : light},${r() * alpha})`
    g.beginPath()
    g.arc(r() * w, r() * h, 0.6 + r() * size, 0, 7)
    g.fill()
  }
}

const brushed: Paint = (g, w, h) => {
  const r = rng(14)
  const gr = g.createLinearGradient(0, 0, w, h)
  gr.addColorStop(0, '#9c8260')
  gr.addColorStop(0.5, '#7f6546')
  gr.addColorStop(1, '#937a58')
  g.fillStyle = gr
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 900; i++) {
    g.strokeStyle = `rgba(${r() < 0.5 ? '40,30,18' : '230,210,180'},${r() * 0.14})`
    const y = r() * h
    g.beginPath()
    g.moveTo(0, y)
    g.lineTo(w, y + r() * 6 - 3)
    g.stroke()
  }
}

/** Rug with a woven border inset from the edge. */
export const rugPaint = (base: string, border: string, seed: number): Paint => (g, w, h) => {
  speckle(base, '0,0,0', '255,255,255', seed, 9000, 1.2, 0.06)(g, w, h)
  g.strokeStyle = border
  g.lineWidth = 10
  g.strokeRect(22, 22, w - 44, h - 44)
}

/** Abstract canvas in the house palette: a few broad gestural strokes. */
export const artPaint = (seed: number, palette: string[]): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = palette[0]
  g.fillRect(0, 0, w, h)
  g.lineCap = 'round'
  for (let i = 0; i < 7; i++) {
    g.strokeStyle = palette[1 + (i % (palette.length - 1))]
    g.globalAlpha = 0.55 + r() * 0.4
    g.lineWidth = 18 + r() * 70
    g.beginPath()
    const x = r() * w
    const y = r() * h
    g.moveTo(x, y)
    g.bezierCurveTo(x + r() * 300 - 150, y + r() * 200 - 100, x + r() * 300 - 150, y + r() * 200 - 100, x + r() * 260 - 130, y + r() * 160 - 80)
    g.stroke()
  }
  g.globalAlpha = 1
}

const PAINTERS = {
  travertineTile: [1024, 512, travertine(3, true)],
  travertine: [512, 512, travertine(5, false)],
  oak: [1024, 1024, planks([122, 96, 74], 11)],
  walnut: [1024, 1024, planks([76, 54, 40], 17)],
  flutedWalnut: [512, 256, flutes([78, 55, 40], 21)],
  flutedOak: [512, 256, flutes([124, 98, 76], 23)],
  quartzite: [1024, 512, quartzite],
  marble: [1024, 1024, marble],
  plaster: [512, 512, clouded('#e7e1d6', '250,246,238', '214,206,193', 9, false, 0.25)],
  kota: [512, 512, clouded('#737b72', '140,146,132', '96,108,98', 12, true)],
  bronze: [512, 512, brushed],
  grass: [512, 512, speckle('#5a6843', '40,52,28', '150,160,100', 1, 9000, 1.4, 0.22)],
  gravel: [512, 512, speckle('#bdb3a3', '90,80,68', '240,234,222', 6, 7000, 2.2, 0.35)],
} satisfies Record<string, [number, number, Paint]>

export type Finish = keyof typeof PAINTERS

/** Paints each finish once and hands out repeat-adjusted clones that share the uploaded image. */
export class TextureLibrary {
  private base = new Map<string, Texture>()

  finish(name: Finish, repeatX = 1, repeatY = 1): Texture {
    let t = this.base.get(name)
    if (!t) {
      const [w, h, paint] = PAINTERS[name]
      t = this.make(canvas(w, h, paint))
      this.base.set(name, t)
    }
    const c = t.clone()
    c.repeat.set(repeatX, repeatY)
    return c
  }

  painted(w: number, h: number, paint: Paint): Texture {
    return this.make(canvas(w, h, paint))
  }

  private make(c: HTMLCanvasElement): Texture {
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    t.wrapS = t.wrapT = RepeatWrapping
    t.anisotropy = 8
    return t
  }
}
