import { BufferGeometry, CanvasTexture, Float32BufferAttribute, Mesh, MeshStandardMaterial, SRGBColorSpace, type Material, type Object3D } from 'three'
import type { Lighting } from '../../shared'

/*
 * Every word painted in the mall's interior (shop fascias, the unit numbers and areas marked on
 * the bare floors, zone names, wayfinding) drawn into a few shared canvases. Each sign is a quad
 * whose UVs pick its cell, so all of them share one material and merge into one draw call.
 */

type Painter = (g: CanvasRenderingContext2D, w: number, h: number) => void

export class Atlas {
  readonly canvas: HTMLCanvasElement
  readonly texture: CanvasTexture
  readonly w: number
  readonly h: number
  private g: CanvasRenderingContext2D
  private x = 0
  private y = 0
  private row = 0

  constructor(w: number, h: number) {
    this.w = w
    this.h = h
    this.canvas = document.createElement('canvas')
    this.canvas.width = w
    this.canvas.height = h
    this.g = this.canvas.getContext('2d')!
    this.texture = new CanvasTexture(this.canvas)
    this.texture.colorSpace = SRGBColorSpace
    this.texture.anisotropy = 8
  }

  /** Paints a cell of cw × ch pixels; returns its UV rectangle [u0, v0, u1, v1]. */
  cell(cw: number, ch: number, paint: Painter): [number, number, number, number] {
    if (this.x + cw > this.w) {
      this.x = 0
      this.y += this.row
      this.row = 0
    }
    // Full: reuse the last row rather than fail (a wrong sign is better than none), and say so.
    if (this.y + ch > this.h) {
      console.warn(`Sign atlas ${this.w}×${this.h} is full`)
      this.y = this.h - ch
    }
    const g = this.g
    g.save()
    g.translate(this.x, this.y)
    g.beginPath()
    g.rect(0, 0, cw, ch)
    g.clip()
    paint(g, cw, ch)
    g.restore()
    const uv: [number, number, number, number] = [this.x / this.w, 1 - (this.y + ch) / this.h, (this.x + cw) / this.w, 1 - this.y / this.h]
    this.x += cw
    this.row = Math.max(this.row, ch)
    this.texture.needsUpdate = true
    return uv
  }
}

/** A w × h quad facing +z (rotate it into place), its UVs on an atlas cell. */
export function quad(w: number, h: number, [u0, v0, u1, v1]: [number, number, number, number]) {
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute([-w / 2, -h / 2, 0, w / 2, -h / 2, 0, w / 2, h / 2, 0, -w / 2, h / 2, 0], 3))
  g.setAttribute('normal', new Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], 3))
  g.setAttribute('uv', new Float32BufferAttribute([u0, v0, u1, v0, u1, v1, u0, v1], 2))
  g.setIndex([0, 1, 2, 0, 2, 3])
  return g
}

/** Places a quad: centred at (x, y, z), turned by `yaw` about y; `flat` lays it on the floor. */
export function place(parent: Object3D, w: number, h: number, uv: [number, number, number, number], mat: Material, x: number, y: number, z: number, yaw: number, flat = false) {
  const m = new Mesh(quad(w, h, uv), mat)
  m.position.set(x, y, z)
  // Turned about y last: a flat one is laid face up first, then turned.
  m.rotation.set(flat ? -Math.PI / 2 : 0, yaw, 0, 'YXZ')
  m.receiveShadow = true
  parent.add(m)
  return m
}

/* ---------- the mall's sign styles ---------- */

const SERIF = '"Cormorant Garamond", "Playfair Display", Georgia, "Times New Roman", serif'
const SANS = '"Inter", "Helvetica Neue", Arial, sans-serif'

/** Fits text to a width by shrinking the font from `size`. */
function fit(g: CanvasRenderingContext2D, text: string, size: number, family: string, weight: number | string, max: number, spacing = 0) {
  let s = size
  for (;;) {
    g.font = `${weight} ${s}px ${family}`
    const w = g.measureText(text).width + spacing * text.length
    if (w <= max || s < 10) return s
    s *= 0.92
  }
}

function spaced(g: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  if (!spacing) {
    g.fillText(text, x, y)
    return
  }
  const total = g.measureText(text).width + spacing * (text.length - 1)
  let at = x - (g.textAlign === 'center' ? total / 2 : 0)
  const align = g.textAlign
  g.textAlign = 'left'
  for (const ch of text) {
    g.fillText(ch, at, y)
    at += g.measureText(ch).width + spacing
  }
  g.textAlign = align
}

/** Brand colours for the two named cafés; every other fascia is the mall's own bronze and ivory. */
const BRANDS: Record<string, { bg: string; ink: string; sub: string; family: string; weight: number }> = {
  Starbucks: { bg: '#00704a', ink: '#ffffff', sub: '#d5eadf', family: SANS, weight: 700 },
  'Tim Hortons': { bg: '#c8102e', ink: '#ffffff', sub: '#f6d3d8', family: SERIF, weight: 700 },
}

export class Signs {
  readonly fascia: Atlas
  readonly marks: Atlas
  readonly boards: Atlas
  /** Signs that read the same are painted once. */
  private memo = new Map<string, [number, number, number, number]>()
  /** Lit signs (fascias, wayfinding). */
  readonly lit: MeshStandardMaterial
  /** The floor directories (on their own atlas: `boards`). */
  readonly board: MeshStandardMaterial
  /** Floor paint (unit numbers, areas, zone names). */
  readonly paint: MeshStandardMaterial

  constructor(lighting: Lighting) {
    // Sized to what the mall paints (about 3k rows of fascias, signs and the boutiques' lettering, 1k of floor marks, five boards).
    this.fascia = new Atlas(2048, 3072)
    this.marks = new Atlas(2048, 1088)
    this.boards = new Atlas(2048, 576)
    this.lit = lighting.glow(new MeshStandardMaterial({ map: this.fascia.texture, emissiveMap: this.fascia.texture, emissive: '#ffffff', emissiveIntensity: 0.55, roughness: 0.4, alphaTest: 0.5 }), 0.6)
    this.board = lighting.glow(new MeshStandardMaterial({ map: this.boards.texture, emissiveMap: this.boards.texture, emissive: '#ffffff', emissiveIntensity: 0.55, roughness: 0.4 }), 0.6)
    this.paint = new MeshStandardMaterial({ map: this.marks.texture, roughness: 0.85, alphaTest: 0.4, polygonOffset: true, polygonOffsetFactor: -2 })
    this.lit.userData.interior = this.paint.userData.interior = this.board.userData.interior = true
  }

  private once(key: string, make: () => [number, number, number, number]) {
    let uv = this.memo.get(key)
    if (!uv) this.memo.set(key, (uv = make()))
    return uv
  }

  /** A shop's fascia: its trade (or brand) over its unit number and area. */
  shopFascia(name: string, unit: string, area: number) {
    const brand = BRANDS[name]
    return this.fascia.cell(512, 80, (g, w, h) => {
      g.fillStyle = brand?.bg ?? '#2a2522'
      g.fillRect(0, 0, w, h)
      if (!brand) {
        g.fillStyle = '#b9a07a'
        g.fillRect(0, h - 3, w, 3)
      }
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillStyle = brand?.ink ?? '#f3ead9'
      const text = brand ? name.toUpperCase() : name.toUpperCase()
      fit(g, text, 34, brand?.family ?? SERIF, brand?.weight ?? 600, w - 40, 3)
      spaced(g, text, w / 2, h * 0.4, 3)
      g.fillStyle = brand?.sub ?? '#b9a07a'
      g.font = `500 15px ${SANS}`
      spaced(g, `${unit}  ·  ${Math.round(area)} m²  ·  ${Math.round(area * 10.764).toLocaleString('en-IN')} sq ft`, w / 2, h * 0.78, 1.5)
    })
  }

  /** A serving counter's fascia in the food court: the cuisine in large type. */
  foodFascia(name: string, unit: string) {
    return this.fascia.cell(512, 96, (g, w, h) => {
      g.fillStyle = '#1f1b19'
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#d9a441'
      g.fillRect(0, 0, w, 4)
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillStyle = '#fff7e8'
      const text = name.toUpperCase()
      fit(g, text, 38, SANS, 800, w - 30, 2)
      spaced(g, text, w / 2, h * 0.44, 2)
      g.fillStyle = '#d9a441'
      g.font = `600 16px ${SANS}`
      g.fillText(unit, w / 2, h * 0.82)
    })
  }

  /** A sign with a pictogram or arrow and a word: LIFTS, WASHROOMS, EXIT and so on. */
  wayfinding(lines: string[], bg = '#2a2522', ink = '#f3ead9', accent = '#b9a07a') {
    return this.once(`way|${lines.join('|')}|${bg}|${ink}|${accent}`, () => this.fascia.cell(512, 128, (g, w, h) => {
      g.fillStyle = bg
      g.fillRect(0, 0, w, h)
      g.fillStyle = accent
      g.fillRect(0, h - 4, w, 4)
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillStyle = ink
      fit(g, lines[0], 46, SANS, 700, w - 40, 4)
      spaced(g, lines[0], w / 2, lines.length > 1 ? h * 0.38 : h / 2, 4)
      if (lines[1]) {
        g.fillStyle = accent
        fit(g, lines[1], 22, SANS, 500, w - 40, 1)
        g.fillText(lines[1], w / 2, h * 0.76)
      }
    }))
  }

  /** The level directory board at the lift lobby. */
  directory(level: string, title: string, entries: string[]) {
    // Painted at 512 × 768 and stored at three quarters, five to a row.
    return this.boards.cell(384, 576, (g) => {
      g.scale(0.75, 0.75)
      const w = 512
      const h = 768
      g.fillStyle = '#1e1a18'
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#b9a07a'
      g.fillRect(24, 150, w - 48, 2)
      g.textAlign = 'left'
      g.textBaseline = 'alphabetic'
      g.font = `600 96px ${SERIF}`
      g.fillText(level, 28, 110)
      g.fillStyle = '#f3ead9'
      fit(g, title, 26, SANS, 600, w - 200)
      g.fillText(title, 150, 70, w - 170)
      g.fillStyle = '#b9a07a'
      g.font = `500 18px ${SANS}`
      g.fillText('TERRANOVA MALL', 150, 108)
      const rowH = Math.min(30, (h - 190) / Math.max(1, entries.length))
      g.font = `500 ${Math.round(rowH * 0.62)}px ${SANS}`
      entries.forEach((e, i) => {
        const [code, ...rest] = e.split('|')
        g.fillStyle = '#b9a07a'
        g.fillText(code, 28, 190 + i * rowH)
        g.fillStyle = '#efe7da'
        g.fillText(rest.join(''), 120, 190 + i * rowH, w - 150)
      })
    })
  }

  /** What is painted on a bare unit's floor: its number, area and size. */
  unitMark(code: string, name: string, area: number, size: string) {
    return this.marks.cell(256, 128, (g, w, h) => {
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillStyle = 'rgba(255,255,255,.92)'
      g.font = `800 46px ${SANS}`
      g.fillText(code, w / 2, h * 0.3)
      g.fillStyle = 'rgba(255,214,90,.95)'
      fit(g, name.toUpperCase(), 17, SANS, 700, w - 16, 1)
      g.fillText(name.toUpperCase(), w / 2, h * 0.62, w - 12)
      g.fillStyle = 'rgba(255,255,255,.85)'
      g.font = `600 16px ${SANS}`
      g.fillText(`${Math.round(area)} m² · ${size}`, w / 2, h * 0.85)
    })
  }

  /** A zone painted on the gaming hall's or cinema's floor. */
  zoneMark(name: string, colour = '#ffffff') {
    return this.once(`zone|${name}|${colour}`, () => this.marks.cell(256, 64, (g, w, h) => {
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillStyle = colour
      fit(g, name.toUpperCase(), 30, SANS, 800, w - 12, 2)
      spaced(g, name.toUpperCase(), w / 2, h / 2, 2)
    }))
  }

  /** A pictogram: m (gents), w (ladies), a (accessible), lift, water, exit. */
  pictogram(kind: 'm' | 'w' | 'a' | 'lift' | 'water' | 'exit', bg = '#2a2522') {
    return this.once(`pic|${kind}|${bg}`, () => this.fascia.cell(128, 128, (g, w, h) => {
      g.fillStyle = kind === 'exit' ? '#14843f' : bg
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#f3ead9'
      g.strokeStyle = '#f3ead9'
      g.lineWidth = 7
      g.lineCap = 'round'
      const cx = w / 2
      const head = (y: number) => {
        g.beginPath()
        g.arc(cx, y, 11, 0, 7)
        g.fill()
      }
      if (kind === 'm' || kind === 'w') {
        head(30)
        if (kind === 'w') {
          g.beginPath()
          g.moveTo(cx, 46)
          g.lineTo(cx + 22, 88)
          g.lineTo(cx - 22, 88)
          g.closePath()
          g.fill()
        } else g.fillRect(cx - 14, 46, 28, 42)
        g.fillRect(cx - 11, 88, 8, 26)
        g.fillRect(cx + 3, 88, 8, 26)
      } else if (kind === 'a') {
        head(26)
        g.beginPath()
        g.arc(cx - 4, 82, 24, 0.3, 5.4)
        g.stroke()
        g.beginPath()
        g.moveTo(cx - 2, 40)
        g.lineTo(cx - 2, 70)
        g.lineTo(cx + 22, 70)
        g.lineTo(cx + 30, 100)
        g.stroke()
      } else if (kind === 'lift') {
        g.strokeRect(24, 18, 80, 92)
        g.beginPath()
        g.moveTo(cx - 18, 52)
        g.lineTo(cx - 6, 36)
        g.lineTo(cx + 6, 52)
        g.closePath()
        g.fill()
        g.beginPath()
        g.moveTo(cx - 6, 76)
        g.lineTo(cx + 6, 92)
        g.lineTo(cx + 18, 76)
        g.closePath()
        g.fill()
      } else if (kind === 'water') {
        g.beginPath()
        g.moveTo(cx, 18)
        g.bezierCurveTo(cx + 30, 56, cx + 30, 100, cx, 104)
        g.bezierCurveTo(cx - 30, 100, cx - 30, 56, cx, 18)
        g.fill()
      } else {
        g.font = `800 34px ${SANS}`
        g.textAlign = 'center'
        g.textBaseline = 'middle'
        g.fillText('EXIT', cx, h / 2)
      }
    }))
  }
}
