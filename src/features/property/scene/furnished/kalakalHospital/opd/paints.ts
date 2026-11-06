import { rng, type Paint } from '../../textures'

/*
 * The OPD's painted surfaces: its floor and wall finishes at true scale (each canvas a known
 * number of metres, see materials.ts), and its signage family. The signs follow one system, as a
 * hospital's wayfinding consultant would draw it: navy (#1c3966) for departments and directions,
 * white for room plates and doors, green for exits, yellow and black for hazards, red for fire
 * and prohibition, all in one sans face, the hospital's blue cross on the larger boards.
 */

export const NAVY = '#1c3966'
export const SANS = (px: number, weight = 700) => `${weight} ${Math.round(px)}px "Helvetica Neue", Helvetica, Arial, sans-serif`

/* ---------- finishes ---------- */

/**
 * Large-format vitrified tiles (800 × 800 mm), the public halls' floor: a pale warm stone, each
 * tile a shade apart, faint veining, and a 2 mm grout joint. The canvas is 1.6 m square.
 */
export const vitrified: Paint = (g, w, h) => {
  const r = rng(5101)
  const n = 2
  const s = w / n
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const v = 226 + Math.round((r() - 0.5) * 8)
      g.fillStyle = `rgb(${v},${v - 4},${v - 11})`
      g.fillRect(i * s, j * s, s, s)
      for (let k = 0; k < 9; k++) {
        g.strokeStyle = `rgba(150,140,125,${0.05 + r() * 0.06})`
        g.lineWidth = 0.6 + r() * 1.4
        g.beginPath()
        let x = i * s + r() * s
        let y = j * s + r() * s
        g.moveTo(x, y)
        for (let q = 0; q < 6; q++) {
          x += (r() - 0.3) * s * 0.18
          y += (r() - 0.5) * s * 0.12
          g.lineTo(Math.min(Math.max(x, i * s), i * s + s), Math.min(Math.max(y, j * s), j * s + s))
        }
        g.stroke()
      }
    }
  g.fillStyle = 'rgba(140,132,120,.55)'
  for (let i = 0; i <= n; i++) {
    g.fillRect(i * s - 1, 0, 2, h)
    g.fillRect(0, i * s - 1, w, 2)
  }
}

/** Anti-skid ceramic floor tiles, 300 × 300 mm, mid grey with a dark grout (the toilets). Canvas 1.2 m. */
export const ceramic = (base: [number, number, number], grout: string, seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  const n = 4
  const s = w / n
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const d = Math.round((r() - 0.5) * 10)
      g.fillStyle = `rgb(${base[0] + d},${base[1] + d},${base[2] + d})`
      g.fillRect(i * s, j * s, s, s)
      for (let k = 0; k < 260; k++) {
        g.fillStyle = `rgba(0,0,0,${r() * 0.07})`
        g.fillRect(i * s + r() * s, j * s + r() * s, 1.4, 1.4)
      }
    }
  g.fillStyle = grout
  for (let i = 0; i <= n; i++) {
    g.fillRect(i * s - 1.5, 0, 3, h)
    g.fillRect(0, i * s - 1.5, w, 3)
  }
}

/** Glazed white wall tiles, 300 × 600 mm laid landscape, a pale grout (toilets, sluices). Canvas 1.2 × 1.2 m. */
export const wallTile: Paint = (g, w, h) => {
  const r = rng(5131)
  const cols = 2
  const rows = 4
  const tw = w / cols
  const th = h / rows
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const v = 242 + Math.round((r() - 0.5) * 6)
      const grad = g.createLinearGradient(i * tw, j * th, i * tw + tw, j * th + th)
      grad.addColorStop(0, `rgb(${v},${v},${v - 2})`)
      grad.addColorStop(1, `rgb(${v - 5},${v - 5},${v - 6})`)
      g.fillStyle = grad
      g.fillRect(i * tw, j * th, tw, th)
    }
  g.fillStyle = '#c9c7c1'
  for (let i = 0; i <= cols; i++) g.fillRect(i * tw - 1, 0, 2, h)
  for (let j = 0; j <= rows; j++) g.fillRect(0, j * th - 1, w, 2)
}

/**
 * Epoxy floor coating in the plant and store rooms: a flat grey with flecks and the wear of
 * trolleys. Canvas 2 m.
 */
export const epoxy: Paint = (g, w, h) => {
  const r = rng(5141)
  g.fillStyle = '#9ea2a3'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.1)'
    g.fillRect(r() * w, r() * h, 1.2, 1.2)
  }
  for (let i = 0; i < 18; i++) {
    g.strokeStyle = 'rgba(60,60,60,.05)'
    g.lineWidth = 6 + r() * 14
    g.beginPath()
    g.moveTo(r() * w, 0)
    g.lineTo(r() * w, h)
    g.stroke()
  }
}

/** A wood-grain laminate (door leaves, counter fronts): pale ash, straight grain, along the canvas's height. */
export const ashLaminate: Paint = (g, w, h) => {
  const r = rng(5151)
  g.fillStyle = '#d9c7a8'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 260; i++) {
    const x = r() * w
    g.strokeStyle = `rgba(${120 + r() * 40},${90 + r() * 30},${55 + r() * 20},${0.05 + r() * 0.12})`
    g.lineWidth = 0.6 + r() * 2.2
    g.beginPath()
    g.moveTo(x, 0)
    let xx = x
    for (let y = 0; y <= h; y += h / 12) {
      xx += (r() - 0.5) * 3
      g.lineTo(xx, y)
    }
    g.stroke()
  }
}

/* ---------- signage ---------- */

type Line = [text: string, size: number, colour: string, weight?: number]

/** Lines of type centred on a ground, sizes as shares of the height; long lines are narrowed to fit. */
function setLines(g: CanvasRenderingContext2D, w: number, h: number, lines: Line[], x0 = 0, x1 = w, align: CanvasTextAlign = 'center') {
  const total = lines.reduce((t, [, size]) => t + size * 1.22, 0)
  let y = (h - total * h) / 2
  g.textBaseline = 'middle'
  g.textAlign = align
  const room = (x1 - x0) * 0.92
  for (const [text, size, colour, weight = 700] of lines) {
    y += (size * 1.22 * h) / 2
    g.fillStyle = colour
    let px = size * h
    g.font = SANS(px, weight)
    const m = g.measureText(text).width
    if (m > room) {
      px *= room / m
      g.font = SANS(px, weight)
    }
    g.fillText(text, align === 'center' ? (x0 + x1) / 2 : align === 'left' ? x0 + (x1 - x0) * 0.04 : x1 - (x1 - x0) * 0.04, y)
    y += (size * 1.22 * h) / 2
  }
}

/** The hospital's blue cross, in a square of side s at (x, y). */
function cross(g: CanvasRenderingContext2D, x: number, y: number, s: number, colour = '#1f6fd1') {
  g.fillStyle = colour
  g.fillRect(x + s * 0.34, y, s * 0.32, s)
  g.fillRect(x, y + s * 0.34, s, s * 0.32)
}

/** A sign: a ground and lines of type, optionally a cross at the left and a coloured rule at the foot. */
export const board = (bg: string, lines: Line[], opts: { cross?: boolean; rule?: string; border?: string } = {}): Paint => (g, w, h) => {
  g.fillStyle = bg
  g.fillRect(0, 0, w, h)
  if (opts.border) {
    g.strokeStyle = opts.border
    g.lineWidth = h * 0.03
    g.strokeRect(h * 0.05, h * 0.05, w - h * 0.1, h - h * 0.1)
  }
  if (opts.rule) {
    g.fillStyle = opts.rule
    g.fillRect(0, h * 0.9, w, h * 0.1)
  }
  let x0 = 0
  if (opts.cross) {
    const s = h * 0.5
    cross(g, h * 0.22, (h - s) / 2, s)
    x0 = h * 0.22 + s + h * 0.1
    setLines(g, w, h, lines, x0, w, 'left')
    return
  }
  setLines(g, w, h, lines, x0, w)
}

/**
 * A room's door plate: white, the room number large in navy over its name, a navy rule at the
 * left edge. Drawn 2:1.
 */
export const roomPlate = (no: string, name: string, sub?: string): Paint => (g, w, h) => {
  g.fillStyle = '#fbfbf9'
  g.fillRect(0, 0, w, h)
  g.fillStyle = NAVY
  g.fillRect(0, 0, w * 0.035, h)
  const lines: Line[] = [[no, 0.3, NAVY], [name.toUpperCase(), name.length > 22 ? 0.12 : 0.15, '#26303b']]
  if (sub) lines.push([sub, 0.1, '#6b7684', 500])
  setLines(g, w, h, lines, w * 0.06, w, 'left')
}

/** An arrow for a direction sign, pointing left, right, up (ahead) or down, in a square s at (x, y). */
function arrow(g: CanvasRenderingContext2D, x: number, y: number, s: number, dir: 'left' | 'right' | 'ahead' | 'back', colour: string) {
  g.save()
  g.translate(x + s / 2, y + s / 2)
  g.rotate(dir === 'right' ? 0 : dir === 'left' ? Math.PI : dir === 'ahead' ? -Math.PI / 2 : Math.PI / 2)
  g.fillStyle = colour
  g.beginPath()
  const a = s * 0.42
  g.moveTo(a, 0)
  g.lineTo(0, -a * 0.8)
  g.lineTo(0, -a * 0.32)
  g.lineTo(-a, -a * 0.32)
  g.lineTo(-a, a * 0.32)
  g.lineTo(0, a * 0.32)
  g.lineTo(0, a * 0.8)
  g.closePath()
  g.fill()
  g.restore()
}

export type Way = 'left' | 'right' | 'ahead' | 'back'

/** A hanging direction sign: navy, a department per row with its arrow. Drawn at w × h for `rows` rows. */
export const direction = (rows: [text: string, way: Way][]): Paint => (g, w, h) => {
  g.fillStyle = NAVY
  g.fillRect(0, 0, w, h)
  const rh = h / rows.length
  rows.forEach(([text, way], i) => {
    const y = i * rh
    if (i > 0) {
      g.fillStyle = 'rgba(255,255,255,.25)'
      g.fillRect(w * 0.03, y - 1, w * 0.94, 2)
    }
    const s = rh * 0.62
    const left = way === 'left' || way === 'back'
    arrow(g, left ? rh * 0.18 : w - rh * 0.18 - s, y + (rh - s) / 2, s, way, '#ffffff')
    const sub: CanvasRenderingContext2D = g
    sub.save()
    setLinesIn(sub, w, rh, y, [[text.toUpperCase(), 0.36, '#ffffff']], left ? rh * 0.95 : w * 0.04, left ? w : w - rh * 0.95, left ? 'left' : 'right')
    sub.restore()
  })
}

function setLinesIn(g: CanvasRenderingContext2D, w: number, rh: number, top: number, lines: Line[], x0: number, x1: number, align: CanvasTextAlign) {
  g.translate(0, top)
  setLines(g, w, rh, lines, x0, x1, align)
  g.translate(0, -top)
}

/** The floor's identification on the lift lobby wall: its number very large, its name and its departments. */
export const floorBoard = (label: string, title: string, lines: string[]): Paint => (g, w, h) => {
  g.fillStyle = NAVY
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#ffffff'
  g.font = SANS(h * 0.62, 700)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(label, h * 0.42, h * 0.5)
  g.fillStyle = 'rgba(255,255,255,.35)'
  g.fillRect(h * 0.82, h * 0.15, 3, h * 0.7)
  const all: Line[] = [[title.toUpperCase(), 0.15, '#ffffff'], ...lines.map((l): Line => [l, 0.085, '#c7d3e6', 500])]
  setLines(g, w, h, all, h * 0.9, w, 'left')
}

/** A row of the floor directory: a department and its room numbers, white on navy, the floor's number at the right. */
export const directoryRow = (text: string, where: string): Paint => (g, w, h) => {
  g.fillStyle = '#24467a'
  g.fillRect(0, 0, w, h)
  g.fillStyle = 'rgba(255,255,255,.18)'
  g.fillRect(0, h - 2, w, 2)
  g.save()
  setLines(g, w, h, [[text.toUpperCase(), 0.42, '#ffffff']], 0, w * 0.74, 'left')
  setLines(g, w, h, [[where, 0.38, '#ffd45a']], w * 0.7, w, 'right')
  g.restore()
}

/** The ionising radiation warning: yellow, the black trefoil, the words below. */
export const radiation = (lines: string[]): Paint => (g, w, h) => {
  g.fillStyle = '#f7d117'
  g.fillRect(0, 0, w, h)
  g.strokeStyle = '#111'
  g.lineWidth = h * 0.03
  g.strokeRect(h * 0.04, h * 0.04, w - h * 0.08, h - h * 0.08)
  const cx = w / 2
  const cy = h * 0.34
  const R = h * 0.2
  g.fillStyle = '#111'
  for (let i = 0; i < 3; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 3
    g.beginPath()
    g.moveTo(cx + Math.cos(a - 0.52) * R * 0.3, cy + Math.sin(a - 0.52) * R * 0.3)
    g.arc(cx, cy, R, a - 0.52, a + 0.52)
    g.arc(cx, cy, R * 0.3, a + 0.52, a - 0.52, true)
    g.fill()
  }
  g.beginPath()
  g.arc(cx, cy, R * 0.2, 0, Math.PI * 2)
  g.fill()
  setLinesIn(g, w, h * 0.42, h * 0.56, lines.map((l, i): Line => [l, i === 0 ? 0.32 : 0.2, '#111']), 0, w, 'center')
}

/** The MRI warning: a red and white magnet sign, STRONG MAGNETIC FIELD, the prohibitions. */
export const magnet: Paint = (g, w, h) => {
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#c8161d'
  g.fillRect(0, 0, w, h * 0.22)
  setLinesIn(g, w, h * 0.22, 0, [['DANGER', 0.62, '#ffffff']], 0, w, 'center')
  // A horseshoe magnet in a yellow triangle.
  const cx = w * 0.25
  const cy = h * 0.55
  const s = h * 0.3
  g.fillStyle = '#f7d117'
  g.strokeStyle = '#111'
  g.lineWidth = s * 0.07
  g.beginPath()
  g.moveTo(cx, cy - s)
  g.lineTo(cx + s * 1.1, cy + s * 0.85)
  g.lineTo(cx - s * 1.1, cy + s * 0.85)
  g.closePath()
  g.fill()
  g.stroke()
  g.lineWidth = s * 0.16
  g.beginPath()
  g.arc(cx, cy + s * 0.05, s * 0.32, Math.PI, 0, true)
  g.stroke()
  g.fillRect(cx - s * 0.4, cy + s * 0.05, s * 0.16, s * 0.4)
  g.fillRect(cx + s * 0.24, cy + s * 0.05, s * 0.16, s * 0.4)
  setLinesIn(g, w, h * 0.78, h * 0.22, [
    ['STRONG MAGNETIC FIELD', 0.11, '#111'],
    ['MAGNET IS ALWAYS ON', 0.085, '#c8161d'],
    ['No pacemakers, implants or metal', 0.065, '#333', 500],
    ['beyond this point', 0.065, '#333', 500],
  ], w * 0.45, w, 'left')
}

/** A lit warning lamp's face over a radiation door: X-RAY / IN USE, or MRI / SCANNING. */
export const lampFace = (lines: string[], colour = '#ff3b30'): Paint => (g, w, h) => {
  g.fillStyle = '#2a0a08'
  g.fillRect(0, 0, w, h)
  setLines(g, w, h, lines.map((l): Line => [l, 0.34, colour]))
}

/** A queue or token display: called tokens and the rooms they go to, in a hospital's screen style. */
export const tokenScreen = (title: string, rows: [token: string, room: string][], seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  const bg = g.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#0d2747')
  bg.addColorStop(1, '#061527')
  g.fillStyle = bg
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#1f6fd1'
  g.fillRect(0, 0, w, h * 0.16)
  g.fillStyle = '#ffffff'
  g.font = SANS(h * 0.08, 700)
  g.textBaseline = 'middle'
  g.textAlign = 'left'
  g.fillText(title.toUpperCase(), w * 0.04, h * 0.08)
  g.textAlign = 'right'
  g.font = SANS(h * 0.06, 500)
  g.fillText(`${9 + Math.floor(r() * 3)}:${String(Math.floor(r() * 60)).padStart(2, '0')} AM`, w * 0.96, h * 0.08)
  g.textAlign = 'left'
  g.fillStyle = '#7fa8d8'
  g.font = SANS(h * 0.05, 700)
  g.fillText('TOKEN', w * 0.06, h * 0.23)
  g.fillText('PLEASE PROCEED TO', w * 0.4, h * 0.23)
  const rh = (h * 0.72) / rows.length
  rows.forEach(([token, room], i) => {
    const y = h * 0.27 + i * rh
    if (i === 0) {
      g.fillStyle = 'rgba(255,212,90,.16)'
      g.fillRect(0, y, w, rh)
    }
    g.fillStyle = i === 0 ? '#ffd45a' : '#ffffff'
    g.font = SANS(rh * 0.5, 700)
    g.fillText(token, w * 0.06, y + rh / 2)
    g.font = SANS(rh * 0.36, 500)
    g.fillText(room, w * 0.4, y + rh / 2)
    g.fillStyle = 'rgba(255,255,255,.08)'
    g.fillRect(w * 0.04, y + rh - 1, w * 0.92, 1)
  })
}

/** A workstation's screen: a hospital information system's window (registration, billing, lab, PACS). */
export const hisScreen = (title: string, kind: 'form' | 'table' | 'image' | 'graph', seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = kind === 'image' ? '#050607' : '#eef2f6'
  g.fillRect(0, 0, w, h)
  g.fillStyle = kind === 'image' ? '#1a1d22' : '#1c3966'
  g.fillRect(0, 0, w, h * 0.08)
  g.fillStyle = '#ffffff'
  g.font = SANS(h * 0.045, 700)
  g.textBaseline = 'middle'
  g.textAlign = 'left'
  g.fillText(title, w * 0.02, h * 0.04)
  if (kind === 'image') {
    // A grey radiograph in each of two viewports.
    for (let v = 0; v < 2; v++) {
      const x0 = w * (0.02 + v * 0.49)
      const vw = w * 0.47
      const grad = g.createRadialGradient(x0 + vw / 2, h * 0.52, 0, x0 + vw / 2, h * 0.52, vw * 0.55)
      grad.addColorStop(0, 'rgba(200,200,200,.8)')
      grad.addColorStop(0.6, 'rgba(110,110,110,.55)')
      grad.addColorStop(1, 'rgba(10,10,10,0)')
      g.fillStyle = grad
      g.fillRect(x0, h * 0.1, vw, h * 0.86)
      g.strokeStyle = 'rgba(230,230,230,.6)'
      for (let i = 0; i < 9; i++) {
        g.lineWidth = 1 + r() * 2
        g.beginPath()
        const yy = h * (0.25 + i * 0.065)
        g.ellipse(x0 + vw / 2, yy, vw * (0.18 + r() * 0.08), h * 0.02, 0, 0, Math.PI * 2)
        g.stroke()
      }
      g.fillStyle = '#d9d9d9'
      g.font = SANS(h * 0.03, 500)
      g.fillText(v ? 'Se: 2  Im: 14' : 'W:400 L:40', x0 + 6, h * 0.13)
    }
    return
  }
  g.fillStyle = '#d6dee8'
  g.fillRect(0, h * 0.08, w * 0.18, h * 0.92)
  for (let i = 0; i < 9; i++) {
    g.fillStyle = i === 2 ? '#1f6fd1' : '#93a3b8'
    g.fillRect(w * 0.015, h * (0.13 + i * 0.07), w * (0.1 + r() * 0.05), h * 0.025)
  }
  const x0 = w * 0.21
  if (kind === 'form') {
    for (let i = 0; i < 8; i++) {
      const y = h * (0.14 + i * 0.1)
      g.fillStyle = '#5d6b7c'
      g.fillRect(x0, y, w * 0.12, h * 0.022)
      g.fillStyle = '#ffffff'
      g.fillRect(x0 + w * 0.15, y - h * 0.02, w * 0.5, h * 0.06)
      g.strokeStyle = '#b8c4d2'
      g.strokeRect(x0 + w * 0.15, y - h * 0.02, w * 0.5, h * 0.06)
      g.fillStyle = '#2b3542'
      g.fillRect(x0 + w * 0.16, y, w * (0.1 + r() * 0.25), h * 0.02)
    }
    g.fillStyle = '#1f9d55'
    g.fillRect(x0 + w * 0.5, h * 0.9, w * 0.15, h * 0.06)
  } else if (kind === 'table') {
    for (let i = 0; i < 14; i++) {
      const y = h * (0.12 + i * 0.06)
      g.fillStyle = i === 0 ? '#c8d3e0' : i % 2 ? '#ffffff' : '#f3f6f9'
      g.fillRect(x0, y, w * 0.77, h * 0.06)
      for (let c = 0; c < 5; c++) {
        g.fillStyle = i === 0 ? '#2b3542' : c === 4 && r() < 0.2 ? '#c8161d' : '#4a5563'
        g.fillRect(x0 + w * (0.01 + c * 0.155), y + h * 0.022, w * (0.05 + r() * 0.08), h * 0.018)
      }
    }
  } else {
    g.strokeStyle = '#1f6fd1'
    g.lineWidth = 2
    for (let k = 0; k < 3; k++) {
      g.beginPath()
      for (let x = 0; x <= 60; x++) {
        const xx = x0 + (x / 60) * w * 0.76
        const yy = h * (0.3 + k * 0.22) + Math.sin(x * 0.5 + k) * h * 0.04 * r() + (x % 12 === 6 ? -h * 0.08 : 0)
        if (x) g.lineTo(xx, yy)
        else g.moveTo(xx, yy)
      }
      g.stroke()
    }
  }
}

/** A medical poster or notice: a coloured header band, a title, and ruled lines of text. */
export const notice = (title: string, band: string, seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = '#fbfaf6'
  g.fillRect(0, 0, w, h)
  g.fillStyle = band
  g.fillRect(0, 0, w, h * 0.16)
  setLinesIn(g, w, h * 0.16, 0, [[title.toUpperCase(), 0.34, '#ffffff']], 0, w, 'center')
  for (let i = 0; i < 12; i++) {
    const y = h * (0.22 + i * 0.06)
    g.fillStyle = i % 4 === 0 ? band : '#6b7280'
    g.fillRect(w * 0.08, y, w * (i % 4 === 0 ? 0.4 : 0.6 + r() * 0.25), h * (i % 4 === 0 ? 0.022 : 0.012))
  }
  g.strokeStyle = band
  g.lineWidth = 3
  g.strokeRect(w * 0.6, h * 0.62, w * 0.3, h * 0.28)
}
