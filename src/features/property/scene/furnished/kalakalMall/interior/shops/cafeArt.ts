import { CanvasTexture, DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, type Material } from 'three'
import { rng, type Paint } from '../../../textures'
import type { FloorCtx } from '../shell'
import { PI } from './kit'

/*
 * The Starbucks café's own finishes and artwork, painted at true scale: the siren emblem, the menu
 * boards over the counter, the autumn mural, white-painted brick, the pale polished concrete
 * floor and its entrance pavers, dark walnut boarding, the maple-leaf atlas for the hanging
 * autumn canopy, and the coffee bags' labels.
 */

export const SB_GREEN = '#00704a'
const SB_DARK = '#1e3932'
const SANS = '"Inter", "Helvetica Neue", Arial, sans-serif'
const SERIF = '"Lora", "Georgia", "Times New Roman", serif'

/* ---------- the siren ---------- */

/**
 * The siren emblem as the stores show it: a green disc inside a fine white ring, the crowned
 * twin-tailed siren in white, her hair in waves and her tails raised either side, the star on her
 * crown. Drawn in a unit frame (−1 … 1 inside the ring).
 */
export const siren: Paint = (g, w) => {
  const R = w / 2
  g.save()
  g.translate(R, R)
  g.fillStyle = SB_GREEN
  g.beginPath()
  g.arc(0, 0, R * 0.995, 0, PI * 2)
  g.fill()
  g.strokeStyle = '#ffffff'
  g.lineWidth = R * 0.03
  g.beginPath()
  g.arc(0, 0, R * 0.925, 0, PI * 2)
  g.stroke()
  // Inside the ring, a unit frame.
  const r = R * 0.86
  g.scale(r, r)
  g.beginPath()
  g.arc(0, 0, 1, 0, PI * 2)
  g.clip()
  const white = '#ffffff'
  const green = SB_GREEN
  const fill = (c: string, path: () => void) => {
    g.fillStyle = c
    g.beginPath()
    path()
    g.fill()
  }
  const line = (c: string, wd: number, path: () => void) => {
    g.strokeStyle = c
    g.lineWidth = wd
    g.lineCap = 'round'
    g.lineJoin = 'round'
    g.beginPath()
    path()
    g.stroke()
  }
  for (const s of [-1, 1]) {
    // A tail: up from the lower side to a split fin at the top corner.
    fill(white, () => {
      g.moveTo(s * 0.42, 1.0)
      g.bezierCurveTo(s * 0.62, 0.62, s * 0.78, 0.25, s * 0.74, -0.18)
      g.bezierCurveTo(s * 0.72, -0.42, s * 0.62, -0.56, s * 0.56, -0.66)
      g.bezierCurveTo(s * 0.66, -0.74, s * 0.84, -0.74, s * 0.98, -0.62)
      g.bezierCurveTo(s * 0.9, -0.5, s * 0.92, -0.4, s * 1.02, -0.3)
      g.bezierCurveTo(s * 0.98, -0.12, s * 0.99, 0.3, s * 0.8, 0.7)
      g.lineTo(s * 0.7, 1.0)
      g.closePath()
    })
    // The fin's split and the scales.
    line(green, 0.028, () => {
      g.moveTo(s * 0.6, -0.62)
      g.quadraticCurveTo(s * 0.78, -0.58, s * 0.93, -0.38)
    })
    for (let i = 0; i < 5; i++) {
      const t = -0.12 + i * 0.16
      line(green, 0.022, () => {
        g.moveTo(s * (0.64 - i * 0.01), t)
        g.quadraticCurveTo(s * 0.74, t + 0.06, s * (0.86 - i * 0.02), t - 0.02)
      })
    }
    // Her hair: a long mass in waves from the crown to the shoulders.
    fill(white, () => {
      g.moveTo(s * 0.12, -0.42)
      g.bezierCurveTo(s * 0.42, -0.46, s * 0.55, -0.22, s * 0.5, 0.0)
      g.bezierCurveTo(s * 0.46, 0.18, s * 0.6, 0.34, s * 0.54, 0.52)
      g.bezierCurveTo(s * 0.5, 0.66, s * 0.46, 0.76, s * 0.36, 0.86)
      g.lineTo(s * 0.18, 0.7)
      g.bezierCurveTo(s * 0.28, 0.5, s * 0.3, 0.3, s * 0.26, 0.1)
      g.closePath()
    })
    for (let i = 0; i < 4; i++) {
      const o = 0.3 + i * 0.065
      line(green, 0.024, () => {
        g.moveTo(s * (o - 0.06), -0.3 + i * 0.02)
        g.bezierCurveTo(s * (o + 0.12), -0.12, s * (o - 0.02), 0.12, s * (o + 0.1), 0.3)
        g.bezierCurveTo(s * (o + 0.16), 0.42, s * (o + 0.02), 0.58, s * (o - 0.02), 0.74)
      })
    }
  }
  // Shoulders and the body below the face.
  fill(white, () => {
    g.moveTo(-0.34, 1.0)
    g.bezierCurveTo(-0.3, 0.74, -0.18, 0.58, 0, 0.56)
    g.bezierCurveTo(0.18, 0.58, 0.3, 0.74, 0.34, 1.0)
    g.closePath()
  })
  line(green, 0.026, () => {
    g.moveTo(-0.13, 0.62)
    g.quadraticCurveTo(0, 0.74, 0.13, 0.62)
  })
  // The face, framed in green.
  fill(white, () => g.ellipse(0, 0.06, 0.25, 0.33, 0, 0, PI * 2))
  line(green, 0.03, () => g.ellipse(0, 0.06, 0.26, 0.34, 0, 0, PI * 2))
  // Eyes (lowered lids), brows, the nose, the lips.
  for (const s of [-1, 1]) {
    line(green, 0.024, () => {
      g.moveTo(s * 0.04, 0.0)
      g.quadraticCurveTo(s * 0.1, 0.035, s * 0.16, 0.0)
    })
    line(green, 0.018, () => {
      g.moveTo(s * 0.05, -0.07)
      g.quadraticCurveTo(s * 0.11, -0.1, s * 0.17, -0.07)
    })
  }
  line(green, 0.02, () => {
    g.moveTo(0.01, 0.02)
    g.quadraticCurveTo(0.04, 0.14, -0.02, 0.17)
  })
  fill(green, () => {
    g.moveTo(-0.06, 0.24)
    g.quadraticCurveTo(0, 0.21, 0.06, 0.24)
    g.quadraticCurveTo(0, 0.29, -0.06, 0.24)
  })
  // The crown: a band over the brow, its points, the star in the middle.
  fill(white, () => {
    g.moveTo(-0.3, -0.26)
    g.quadraticCurveTo(0, -0.36, 0.3, -0.26)
    g.lineTo(0.26, -0.44)
    g.lineTo(0.17, -0.5)
    g.lineTo(0.12, -0.43)
    g.lineTo(0, -0.62)
    g.lineTo(-0.12, -0.43)
    g.lineTo(-0.17, -0.5)
    g.lineTo(-0.26, -0.44)
    g.closePath()
  })
  line(green, 0.022, () => {
    g.moveTo(-0.28, -0.3)
    g.quadraticCurveTo(0, -0.39, 0.28, -0.3)
  })
  fill(green, () => {
    for (let i = 0; i < 10; i++) {
      const a = -PI / 2 + (i * PI) / 5
      const rr = i % 2 ? 0.035 : 0.085
      const px = Math.cos(a) * rr
      const py = -0.45 + Math.sin(a) * rr
      if (i === 0) g.moveTo(px, py)
      else g.lineTo(px, py)
    }
    g.closePath()
  })
  for (const s of [-1, 1]) fill(green, () => g.arc(s * 0.2, -0.37, 0.02, 0, PI * 2))
  g.restore()
}

/* ---------- finishes ---------- */

/** White-painted brick in running bond, 230 × 75 mm with 10 mm joints; `metres` a repeat. */
const brick: Paint = (g, w, h) => {
  const r = rng(91)
  g.fillStyle = '#d9d6cf'
  g.fillRect(0, 0, w, h)
  const rows = 12
  const bh = h / rows
  const bw = w / 4
  for (let row = 0; row < rows; row++) {
    const off = (row % 2) * bw * 0.5
    for (let c = -1; c < 5; c++) {
      const x = c * bw + off
      const tone = 238 + Math.floor(r() * 12)
      g.fillStyle = `rgb(${tone},${tone - 2},${tone - 6})`
      g.fillRect(x + bw * 0.022, row * bh + bh * 0.07, bw * 0.956, bh * 0.86)
      // A soft shade under each brick's top arris, light on its lower one.
      g.fillStyle = 'rgba(0,0,0,.05)'
      g.fillRect(x + bw * 0.022, row * bh + bh * 0.07, bw * 0.956, bh * 0.08)
      g.fillStyle = 'rgba(255,255,255,.35)'
      g.fillRect(x + bw * 0.022, row * bh + bh * 0.85, bw * 0.956, bh * 0.08)
    }
  }
  // Paint over the texture of the brick: pits and dabs.
  for (let i = 0; i < 6000; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.06)'
    g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2)
  }
}

/** Pale polished concrete: a mottled warm grey with fine aggregate and saw-cut joints every 1.2 m (two to the repeat). */
const concrete: Paint = (g, w, h) => {
  const r = rng(57)
  g.fillStyle = '#b4afa6'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 260; i++) {
    const x = r() * w
    const y = r() * h
    const s = w * (0.03 + r() * 0.12)
    const gr = g.createRadialGradient(x, y, 0, x, y, s)
    const dark = r() < 0.5
    gr.addColorStop(0, dark ? 'rgba(110,102,92,.07)' : 'rgba(255,250,240,.07)')
    gr.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = gr
    g.fillRect(x - s, y - s, s * 2, s * 2)
  }
  for (let i = 0; i < 14000; i++) {
    const v = r()
    g.fillStyle = v < 0.4 ? 'rgba(90,84,76,.16)' : v < 0.7 ? 'rgba(255,255,255,.18)' : 'rgba(150,140,125,.14)'
    const s = 0.6 + r() * 1.8
    g.fillRect(r() * w, r() * h, s, s)
  }
  g.fillStyle = 'rgba(70,66,60,.45)'
  for (const t of [0, 0.5]) {
    g.fillRect(t * w, 0, 2, h)
    g.fillRect(0, t * h, w, 2)
  }
}

/** Granite setts at the threshold: 200 × 100 mm, a grey mix, sand joints. */
const pavers: Paint = (g, w, h) => {
  const r = rng(77)
  g.fillStyle = '#8f8b84'
  g.fillRect(0, 0, w, h)
  const rows = 6
  const ph = h / rows
  const pw = w / 3
  for (let row = 0; row < rows; row++)
    for (let c = -1; c < 4; c++) {
      const x = c * pw + (row % 2) * pw * 0.5
      const t = 150 + Math.floor(r() * 50)
      g.fillStyle = `rgb(${t},${t - 3},${t - 8})`
      g.fillRect(x + 3, row * ph + 3, pw - 6, ph - 6)
      for (let i = 0; i < 60; i++) {
        g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.12)'
        g.fillRect(x + 3 + r() * (pw - 6), row * ph + 3 + r() * (ph - 6), 2, 2)
      }
    }
}

/** Dark walnut boarding, vertical, 100 mm boards with a V-groove; one repeat 0.4 m. */
const boards: Paint = (g, w, h) => {
  const r = rng(13)
  const n = 4
  const bw = w / n
  for (let i = 0; i < n; i++) {
    const t = 70 + Math.floor(r() * 18)
    g.fillStyle = `rgb(${t},${Math.floor(t * 0.7)},${Math.floor(t * 0.48)})`
    g.fillRect(i * bw, 0, bw, h)
    // Long grain, drifting.
    for (let k = 0; k < 26; k++) {
      const x = i * bw + r() * bw
      g.strokeStyle = r() < 0.5 ? 'rgba(20,10,4,.28)' : 'rgba(150,105,70,.18)'
      g.lineWidth = 0.6 + r() * 1.6
      g.beginPath()
      g.moveTo(x, 0)
      for (let y = 0; y <= h; y += h / 8) g.lineTo(x + Math.sin(y * 0.02 + k) * 3 * r(), y)
      g.stroke()
    }
    g.fillStyle = 'rgba(0,0,0,.55)'
    g.fillRect(i * bw, 0, 2, h)
    g.fillStyle = 'rgba(255,220,180,.08)'
    g.fillRect(i * bw + 2, 0, 2, h)
  }
}

/** The open ceiling's paint: near-black, with the faint texture of sprayed board. */
const blackPaint: Paint = (g, w, h) => {
  const r = rng(5)
  g.fillStyle = '#1b1b1c'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 4000; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.2)'
    g.fillRect(r() * w, r() * h, 2, 2)
  }
}

/* ---------- the leaves ---------- */

const LEAF_TONES = ['#b3301e', '#d6561b', '#e5862b', '#a63d1a', '#e2a238', '#8f1f18', '#c9471b', '#d2962c']

/** A maple leaf: five pointed lobes, the stalk, the veins, centred in a cell `s` across. */
function mapleLeaf(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, colour: string, r: () => number) {
  g.save()
  g.translate(cx, cy)
  g.rotate((r() - 0.5) * 0.5)
  const lobes = [
    { a: -PI / 2, l: 0.46 },
    { a: -PI / 2 - 0.95, l: 0.4 },
    { a: -PI / 2 + 0.95, l: 0.4 },
    { a: -PI / 2 - 1.95, l: 0.26 },
    { a: -PI / 2 + 1.95, l: 0.26 },
  ]
  const pts: [number, number][] = []
  const order = [3, 1, 0, 2, 4]
  pts.push([Math.cos(PI / 2 + 0.35) * 0.08 * s, Math.sin(PI / 2 + 0.35) * 0.08 * s])
  for (let i = 0; i < order.length; i++) {
    const L = lobes[order[i]]
    const tip: [number, number] = [Math.cos(L.a) * L.l * s, Math.sin(L.a) * L.l * s]
    // Teeth either side of the tip, then the sinus towards the next lobe.
    const side = (d: number): [number, number] => [Math.cos(L.a + d) * L.l * 0.62 * s, Math.sin(L.a + d) * L.l * 0.62 * s]
    pts.push(side(-0.38), [Math.cos(L.a - 0.16) * L.l * 0.8 * s, Math.sin(L.a - 0.16) * L.l * 0.8 * s], tip, [Math.cos(L.a + 0.16) * L.l * 0.8 * s, Math.sin(L.a + 0.16) * L.l * 0.8 * s], side(0.38))
    if (i < order.length - 1) {
      const N = lobes[order[i + 1]]
      const mid = (L.a + N.a) / 2
      pts.push([Math.cos(mid) * 0.15 * s, Math.sin(mid) * 0.15 * s])
    }
  }
  pts.push([Math.cos(PI / 2 - 0.35) * 0.08 * s, Math.sin(PI / 2 - 0.35) * 0.08 * s])
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, s * 0.45)
  gr.addColorStop(0, colour)
  gr.addColorStop(1, shade(colour, r() < 0.5 ? -30 : 20))
  g.fillStyle = gr
  g.beginPath()
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)))
  g.closePath()
  g.fill()
  g.strokeStyle = shade(colour, -45)
  g.lineWidth = s * 0.012
  for (const L of lobes) {
    g.beginPath()
    g.moveTo(0, 0)
    g.lineTo(Math.cos(L.a) * L.l * 0.85 * s, Math.sin(L.a) * L.l * 0.85 * s)
    g.stroke()
  }
  g.lineWidth = s * 0.02
  g.beginPath()
  g.moveTo(0, 0)
  g.lineTo(0, s * 0.3)
  g.stroke()
  g.restore()
}

function shade(hex: string, d: number) {
  const n = parseInt(hex.slice(1), 16)
  const c = (v: number) => Math.max(0, Math.min(255, v + d))
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`
}

/** Eight leaves, 4 × 2 cells, on a transparent ground. */
const leafAtlas: Paint = (g, w, h) => {
  g.clearRect(0, 0, w, h)
  const r = rng(404)
  const cw = w / 4
  const ch = h / 2
  for (let i = 0; i < 8; i++) mapleLeaf(g, (i % 4) * cw + cw / 2, Math.floor(i / 4) * ch + ch * 0.46, cw * 0.96, LEAF_TONES[i], r)
}

/* ---------- boards and art ---------- */

export interface MenuBoard {
  kind: 'image' | 'list'
  title: string
  /** For a list: the lines, each "name|price"; for an image: the caption lines. */
  lines: string[]
  image?: 'psl' | 'latte' | 'coldbrew' | 'croissant'
}

/** A drink or bake drawn as a menu board's photograph would show it, on a dark ground. */
function boardImage(g: CanvasRenderingContext2D, w: number, h: number, what: NonNullable<MenuBoard['image']>) {
  const cx = w / 2
  const cy = h * 0.5
  const glow = g.createRadialGradient(cx, cy, 0, cx, cy, w * 0.6)
  glow.addColorStop(0, '#4a3326')
  glow.addColorStop(1, '#1a1411')
  g.fillStyle = glow
  g.fillRect(0, 0, w, h)
  const cup = (top: number, bottom: number, y0: number, y1: number, body: string) => {
    g.fillStyle = body
    g.beginPath()
    g.moveTo(cx - top / 2, y0)
    g.lineTo(cx + top / 2, y0)
    g.lineTo(cx + bottom / 2, y1)
    g.quadraticCurveTo(cx, y1 + 10, cx - bottom / 2, y1)
    g.closePath()
    g.fill()
  }
  if (what === 'psl' || what === 'latte') {
    // A white ceramic cup on a saucer, seen from above and in front, latte art in the cream.
    g.fillStyle = '#efe9e0'
    g.beginPath()
    g.ellipse(cx, cy + h * 0.17, w * 0.36, h * 0.06, 0, 0, PI * 2)
    g.fill()
    cup(w * 0.46, w * 0.3, cy - h * 0.06, cy + h * 0.15, '#f4f0ea')
    g.strokeStyle = '#f4f0ea'
    g.lineWidth = w * 0.035
    g.beginPath()
    g.ellipse(cx + w * 0.25, cy + h * 0.03, w * 0.06, h * 0.05, 0, -PI / 2, PI / 2)
    g.stroke()
    g.fillStyle = what === 'psl' ? '#c88a4f' : '#b98455'
    g.beginPath()
    g.ellipse(cx, cy - h * 0.06, w * 0.21, h * 0.04, 0, 0, PI * 2)
    g.fill()
    g.fillStyle = '#f7ead8'
    if (what === 'latte') {
      // A rosetta poured in the crema.
      for (let i = 0; i < 6; i++) {
        g.beginPath()
        g.ellipse(cx, cy - h * 0.06 - i * 2, w * (0.12 - i * 0.016), h * 0.012, 0, 0, PI * 2)
        g.fill()
      }
    } else {
      g.beginPath()
      g.ellipse(cx, cy - h * 0.065, w * 0.14, h * 0.026, 0, 0, PI * 2)
      g.fill()
      // Cinnamon dusted over the cream.
      const r = rng(8)
      g.fillStyle = 'rgba(140,70,30,.7)'
      for (let i = 0; i < 160; i++) g.fillRect(cx + (r() - 0.5) * w * 0.26, cy - h * 0.07 + (r() - 0.5) * h * 0.04, 2, 2)
      // A small pumpkin beside the cup.
      g.fillStyle = '#d8661f'
      for (let i = 0; i < 4; i++) {
        g.beginPath()
        g.ellipse(cx - w * 0.33 + i * 7, cy + h * 0.13, w * 0.05, h * 0.045, 0, 0, PI * 2)
        g.fill()
      }
      g.fillStyle = '#4b5d2a'
      g.fillRect(cx - w * 0.3, cy + h * 0.065, 5, 14)
    }
  } else if (what === 'coldbrew') {
    // A tall glass of cold brew over ice, a cap of cream folding into it.
    g.fillStyle = 'rgba(255,255,255,.12)'
    cup(w * 0.34, w * 0.27, cy - h * 0.22, cy + h * 0.2, 'rgba(255,255,255,.14)')
    const body = g.createLinearGradient(0, cy - h * 0.1, 0, cy + h * 0.2)
    body.addColorStop(0, '#5b3218')
    body.addColorStop(1, '#2a160b')
    cup(w * 0.31, w * 0.25, cy - h * 0.1, cy + h * 0.19, '#3b1f0f')
    g.fillStyle = body
    g.fillRect(cx - w * 0.14, cy - h * 0.1, w * 0.28, h * 0.29)
    g.fillStyle = '#f0e2cc'
    g.fillRect(cx - w * 0.155, cy - h * 0.2, w * 0.31, h * 0.1)
    g.fillStyle = 'rgba(255,255,255,.35)'
    for (let i = 0; i < 5; i++) g.fillRect(cx - w * 0.1 + i * 12, cy - h * 0.04 + (i % 2) * 18, 14, 14)
  } else {
    // A croissant on a board.
    g.fillStyle = '#6b4a2e'
    g.fillRect(cx - w * 0.38, cy + h * 0.08, w * 0.76, h * 0.06)
    for (let i = -3; i <= 3; i++) {
      const t = i / 3
      g.fillStyle = i % 2 ? '#c27a2e' : '#d89a48'
      g.beginPath()
      g.ellipse(cx + t * w * 0.24, cy + Math.abs(t) * h * 0.04, w * (0.09 - Math.abs(t) * 0.03), h * (0.08 - Math.abs(t) * 0.025), t * 0.6, 0, PI * 2)
      g.fill()
    }
  }
}

/** A menu board: a photograph board (an image and a caption) or a list board (a title over items and prices). */
export const menuBoard = (b: MenuBoard): Paint => (g, w, h) => {
  if (b.kind === 'image') {
    boardImage(g, w, h, b.image ?? 'latte')
    g.fillStyle = 'rgba(0,0,0,.45)'
    g.fillRect(0, h * 0.78, w, h * 0.22)
    g.fillStyle = '#ffffff'
    g.textAlign = 'center'
    g.font = `600 ${Math.round(h * 0.055)}px ${SERIF}`
    g.fillText(b.title, w / 2, h * 0.86)
    g.font = `400 ${Math.round(h * 0.034)}px ${SANS}`
    b.lines.forEach((l, i) => g.fillText(l, w / 2, h * 0.92 + i * h * 0.04))
  } else {
    g.fillStyle = '#f4f1ea'
    g.fillRect(0, 0, w, h)
    g.fillStyle = SB_DARK
    g.fillRect(0, 0, w, h * 0.12)
    g.fillStyle = '#ffffff'
    g.textAlign = 'center'
    g.font = `700 ${Math.round(h * 0.045)}px ${SANS}`
    g.fillText(b.title.toUpperCase(), w / 2, h * 0.078)
    g.fillStyle = '#6d6a63'
    g.font = `600 ${Math.round(h * 0.024)}px ${SANS}`
    g.textAlign = 'right'
    g.fillText('TALL    GRANDE    VENTI', w * 0.94, h * 0.165)
    b.lines.forEach((l, i) => {
      const [name, price] = l.split('|')
      const y = h * 0.225 + i * h * 0.083
      g.textAlign = 'left'
      g.fillStyle = '#1f1f1f'
      g.font = `600 ${Math.round(h * 0.032)}px ${SANS}`
      g.fillText(name, w * 0.06, y)
      g.textAlign = 'right'
      g.fillStyle = '#3b3b3b'
      g.font = `500 ${Math.round(h * 0.028)}px ${SANS}`
      g.fillText(price ?? '', w * 0.94, y)
      g.fillStyle = 'rgba(0,0,0,.08)'
      g.fillRect(w * 0.06, y + h * 0.025, w * 0.88, 1)
    })
  }
  // The board's thin black frame.
  g.strokeStyle = '#111'
  g.lineWidth = 6
  g.strokeRect(3, 3, w - 6, h - 6)
}

/** The autumn mural on the side wall: a warm painted ground, a great cup with its steam rising into falling leaves. */
const mural: Paint = (g, w, h) => {
  const r = rng(616)
  const bg = g.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, '#3a1f14')
  bg.addColorStop(0.5, '#6e3519')
  bg.addColorStop(1, '#2b1710')
  g.fillStyle = bg
  g.fillRect(0, 0, w, h)
  // Brushwork.
  for (let i = 0; i < 900; i++) {
    g.strokeStyle = `rgba(${200 + r() * 55},${90 + r() * 70},${30 + r() * 30},${0.04 + r() * 0.06})`
    g.lineWidth = 2 + r() * 10
    const x = r() * w
    const y = r() * h
    g.beginPath()
    g.moveTo(x, y)
    g.quadraticCurveTo(x + (r() - 0.5) * 80, y + (r() - 0.5) * 40, x + (r() - 0.5) * 160, y + (r() - 0.5) * 60)
    g.stroke()
  }
  // The cup, low and to the left, in cream with a sleeve.
  const cx = w * 0.36
  const cy = h * 0.66
  g.fillStyle = '#efe2cc'
  g.beginPath()
  g.moveTo(cx - w * 0.12, cy - h * 0.2)
  g.lineTo(cx + w * 0.12, cy - h * 0.2)
  g.lineTo(cx + w * 0.095, cy + h * 0.24)
  g.lineTo(cx - w * 0.095, cy + h * 0.24)
  g.closePath()
  g.fill()
  g.fillStyle = '#9c5a2c'
  g.fillRect(cx - w * 0.112, cy - h * 0.02, w * 0.224, h * 0.12)
  g.fillStyle = '#d9cdb8'
  g.fillRect(cx - w * 0.13, cy - h * 0.25, w * 0.26, h * 0.06)
  // Steam, curling up and away to the right.
  g.strokeStyle = 'rgba(255,240,220,.45)'
  g.lineCap = 'round'
  for (let k = 0; k < 3; k++) {
    g.lineWidth = 10 - k * 2
    g.beginPath()
    g.moveTo(cx - w * 0.04 + k * w * 0.04, cy - h * 0.27)
    g.bezierCurveTo(cx + w * 0.02 + k * 10, cy - h * 0.45, cx - w * 0.08, cy - h * 0.55, cx + w * 0.14 + k * 20, cy - h * 0.8)
    g.stroke()
  }
  // Leaves drifting across.
  for (let i = 0; i < 26; i++) mapleLeaf(g, w * (0.45 + r() * 0.55), h * r(), w * (0.05 + r() * 0.07), LEAF_TONES[Math.floor(r() * LEAF_TONES.length)], r)
  g.fillStyle = 'rgba(255,235,210,.85)'
  g.font = `italic 500 ${Math.round(h * 0.07)}px ${SERIF}`
  g.textAlign = 'right'
  g.fillText('Hello, autumn', w * 0.95, h * 0.93)
}

/** Coffee bags' fronts, 4 across: the roast's colour, the siren, its name and roast. */
const BAGS: [string, string, string, string][] = [
  ['PIKE PLACE®', 'MEDIUM ROAST', '#8b5a2b', '#f3e7d3'],
  ['VERANDA BLEND®', 'BLONDE ROAST', '#e9c88a', '#3a2a1a'],
  ['ESPRESSO ROAST', 'DARK ROAST', '#3b2418', '#f0e2cc'],
  ['FALL BLEND', 'MEDIUM ROAST', '#b8501f', '#fff1e0'],
]
const bagLabels: Paint = (g, w, h) => {
  const cw = w / 4
  BAGS.forEach(([name, roast, bg, ink], i) => {
    const x = i * cw
    g.fillStyle = bg
    g.fillRect(x, 0, cw, h)
    g.fillStyle = 'rgba(255,255,255,.07)'
    for (let k = 0; k < 12; k++) g.fillRect(x, (k / 12) * h, cw, 2)
    g.save()
    g.translate(x + cw / 2 - cw * 0.17, h * 0.18)
    g.scale(cw * 0.34 / 512, cw * 0.34 / 512)
    siren(g, 512, 512)
    g.restore()
    g.fillStyle = ink
    g.textAlign = 'center'
    g.font = `700 ${Math.round(cw * 0.085)}px ${SANS}`
    g.fillText(name, x + cw / 2, h * 0.66)
    g.font = `500 ${Math.round(cw * 0.06)}px ${SANS}`
    g.fillText(roast, x + cw / 2, h * 0.74)
    g.font = `500 ${Math.round(cw * 0.05)}px ${SANS}`
    g.fillText('WHOLE BEAN · 250 g', x + cw / 2, h * 0.88)
  })
}

/** Screens: the espresso machine's touch panel (idle and brewing), the till and the customer display. */
export const screen = (lines: string[], accent = SB_GREEN, dark = true): Paint => (g, w, h) => {
  g.fillStyle = dark ? '#101213' : '#f4f4f2'
  g.fillRect(0, 0, w, h)
  g.fillStyle = accent
  g.fillRect(0, 0, w, h * 0.16)
  g.fillStyle = '#ffffff'
  g.textAlign = 'left'
  g.font = `700 ${Math.round(h * 0.1)}px ${SANS}`
  g.fillText(lines[0], w * 0.05, h * 0.115)
  g.fillStyle = dark ? '#e8e8e8' : '#222'
  g.font = `500 ${Math.round(h * 0.085)}px ${SANS}`
  lines.slice(1).forEach((l, i) => {
    if (l.startsWith('[')) {
      // A tile button.
      const col = i % 2
      const row = Math.floor(i / 2)
      const bx = w * (0.05 + col * 0.47)
      const by = h * (0.22 + row * 0.25)
      g.fillStyle = dark ? '#2a2f31' : '#e3e7e5'
      g.fillRect(bx, by, w * 0.43, h * 0.2)
      g.fillStyle = dark ? '#ffffff' : '#111'
      g.fillText(l.slice(1, -1), bx + w * 0.03, by + h * 0.13)
    } else g.fillText(l, w * 0.05, h * (0.32 + i * 0.13))
  })
}

/* ---------- materials ---------- */

export function cafeMaterials(e: FloorCtx) {
  const { k, m, lux } = e
  const env = m.env
  const mark = <T extends Material>(x: T) => ((x.userData.interior = true), x)
  const std = (p: ConstructorParameters<typeof MeshStandardMaterial>[0], reflect = 0.5) => mark(new MeshStandardMaterial({ envMap: env, envMapIntensity: reflect, ...p }))
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
  const sirenTex = canvas(512, 512, siren)
  const leaves = canvas(1024, 512, leafAtlas)
  return {
    concrete: std({ map: tex(1024, 1024, concrete, 2.4), roughness: 0.36 }, 0.4),
    pavers: std({ map: tex(512, 512, pavers, 0.6), roughness: 0.75 }, 0.15),
    brick: std({ map: tex(512, 512, brick, 0.92, 0.9), roughness: 0.85 }, 0.08),
    walnutBoards: std({ map: tex(512, 512, boards, 0.4, 1.2), roughness: 0.55 }, 0.25),
    ceiling: std({ map: tex(256, 256, blackPaint, 1.2), roughness: 0.95 }, 0.02),
    blackTimber: std({ color: '#201d1b', roughness: 0.7 }, 0.15),
    oak: lux.oak,
    walnut: lux.walnut,
    concretePanel: std({ map: tex(1024, 1024, concrete, 1.6), color: '#b9b5ad', roughness: 0.8 }, 0.1),
    mural: std({ map: canvas(1024, 768, mural), roughness: 0.85 }, 0.05),
    sirenTex,
    siren: std({ map: sirenTex, roughness: 0.4, transparent: true, alphaTest: 0.4 }, 0.3),
    leaves: std({ map: leaves, alphaTest: 0.5, side: DoubleSide, roughness: 0.75 }, 0.05),
    bags: canvas(1024, 384, bagLabels),
    canvas,
    std,
    /** Stainless steel, brushed, for the equipment's bodies; polished for the spouts and wands. */
    brushed: std({ color: '#c8cbcd', metalness: 0.9, roughness: 0.32 }, 1.0),
    polished: std({ color: '#e6e8ea', metalness: 1.0, roughness: 0.08 }, 1.3),
    blackGloss: std({ color: '#151617', metalness: 0.2, roughness: 0.22 }, 0.8),
    blackMatte: std({ color: '#1a1b1c', metalness: 0.1, roughness: 0.6 }, 0.3),
    rubber: std({ color: '#121212', roughness: 0.85 }, 0.05),
    greenBody: std({ color: SB_GREEN, roughness: 0.45 }, 0.4),
    darkGreen: std({ color: SB_DARK, roughness: 0.6 }, 0.2),
    cupPaper: std({ color: '#f7f5f0', roughness: 0.75 }, 0.08),
    lidWhite: std({ color: '#f2f1ed', roughness: 0.45 }, 0.2),
    lidBlack: std({ color: '#1c1c1c', roughness: 0.5 }, 0.2),
    sleeve: std({ color: '#a77b4f', roughness: 0.9 }, 0.02),
    ceramic: std({ color: '#f6f3ee', roughness: 0.18 }, 0.7),
    ceramicBlack: std({ color: '#1f1e1d', roughness: 0.2 }, 0.7),
    ceramicRust: std({ color: '#b5541f', roughness: 0.22 }, 0.6),
    ceramicSage: std({ color: '#8fa38a', roughness: 0.25 }, 0.6),
    clearPlastic: mark(new MeshPhysicalMaterial({ color: '#f2f6f6', roughness: 0.05, transparent: true, opacity: 0.28, depthWrite: false, side: DoubleSide, envMap: env, envMapIntensity: 1.1 })),
    smokePlastic: mark(new MeshPhysicalMaterial({ color: '#5a4a3e', roughness: 0.08, transparent: true, opacity: 0.55, depthWrite: false, envMap: env, envMapIntensity: 1.0 })),
    beans: std({ color: '#3a2214', roughness: 0.55 }, 0.3),
    espresso: std({ color: '#3a1d0c', roughness: 0.15 }, 0.6),
    crema: std({ color: '#b07a45', roughness: 0.4 }, 0.3),
    milk: std({ color: '#f7f4ec', roughness: 0.35 }, 0.3),
    ice: mark(new MeshPhysicalMaterial({ color: '#eef7fa', roughness: 0.05, transparent: true, opacity: 0.55, envMap: env, envMapIntensity: 1.2 })),
    steam: (opacity: number) => mark(new MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity, depthWrite: false, roughness: 1 })),
    /* the bakes */
    pastry: std({ color: '#c98a3e', roughness: 0.62 }, 0.15),
    pastryDark: std({ color: '#9e5c22', roughness: 0.6 }, 0.15),
    muffinCase: std({ color: '#e8dcc4', roughness: 0.8 }, 0.05),
    chocolate: std({ color: '#3e2316', roughness: 0.5 }, 0.2),
    cream: std({ color: '#f3e7d2', roughness: 0.55 }, 0.15),
    blueberry: std({ color: '#2f2b4a', roughness: 0.4 }, 0.2),
    redVelvet: std({ color: '#8c1f24', roughness: 0.6 }, 0.1),
    wrap: std({ color: '#efe7d6', roughness: 0.7 }, 0.1),
    bread: std({ color: '#d9b27a', roughness: 0.75 }, 0.1),
    /* the planting */
    pumpkin: std({ color: '#d8661f', roughness: 0.55 }, 0.2),
    pumpkinPale: std({ color: '#e9d7b0', roughness: 0.6 }, 0.2),
    stalk: std({ color: '#5a5a2c', roughness: 0.8 }, 0.05),
    wicker: std({ color: '#a67c4c', roughness: 0.9 }, 0.02),
    terracotta: std({ color: '#b5643b', roughness: 0.85 }, 0.05),
    mumOrange: std({ color: '#e07a1f', roughness: 0.85 }, 0.02),
    mumGold: std({ color: '#e5a72c', roughness: 0.85 }, 0.02),
    mumRust: std({ color: '#b2401c', roughness: 0.85 }, 0.02),
    foliage: std({ color: '#3f5a2c', roughness: 0.8 }, 0.02),
    wheat: std({ color: '#d7b878', roughness: 0.85 }, 0.02),
    syrups: ['#e8d6a6', '#b5651d', '#7a3b12', '#f1e6c8', '#d9a441', '#c8352f', '#efe1b8', '#6b2f12'].map((c) => mark(new MeshPhysicalMaterial({ color: c, roughness: 0.08, transparent: true, opacity: 0.8, envMap: env, envMapIntensity: 1.1 }))),
  }
}

export type CafeMaterials = ReturnType<typeof cafeMaterials>
