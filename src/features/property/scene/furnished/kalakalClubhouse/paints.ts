import type { Paint } from '../textures'

// Canvas-painted surfaces for the clubhouse: boards, displays, signage and game tops.

const font = (px: number, weight = 600, family = 'Helvetica, Arial, sans-serif') => `${weight} ${px}px ${family}`

/** Competition table-tennis top: blue with a 20 mm white edge line and a 3 mm centre line. */
export const ttTop: Paint = (g, w, h) => {
  g.fillStyle = '#1d3f73'
  g.fillRect(0, 0, w, h)
  g.strokeStyle = '#f4f4f0'
  g.lineWidth = w * 0.026
  g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, w - g.lineWidth, h - g.lineWidth)
  g.fillStyle = '#f4f4f0'
  g.fillRect(w / 2 - 1.5, 0, 3, h)
}

/** Digital timing board: meet title, running clock and six lanes of splits, in amber LED. */
export const scoreboard: Paint = (g, w, h) => {
  g.fillStyle = '#06080b'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#0e1319'
  for (let x = 0; x < w; x += 6) for (let y = 0; y < h; y += 6) g.fillRect(x, y, 3, 3)
  g.textBaseline = 'middle'
  g.fillStyle = '#ffffff'
  g.font = font(44, 700)
  g.fillText('KALAKAL AQUATICS', 36, 50)
  g.fillStyle = '#7fe6ff'
  g.font = font(30, 500)
  g.fillText('100 M FREESTYLE · TRAINING SET 4', 36, 96)
  g.fillStyle = '#ffb347'
  g.font = font(64, 700, 'Menlo, Consolas, monospace')
  g.textAlign = 'right'
  g.fillText('00:58.24', w - 36, 64)
  g.textAlign = 'left'
  const rows = [
    ['1', 'A. RAO', '59.12'], ['2', 'K. MEHTA', '58.24'], ['3', 'S. IYER', '58.97'],
    ['4', 'R. VARMA', '1:00.31'], ['5', 'P. NAIR', '59.66'], ['6', 'D. SHAH', '1:01.08'],
  ]
  rows.forEach(([lane, name, time], i) => {
    const y = 160 + i * 56
    g.fillStyle = i === 1 ? '#ffb347' : '#e9e6df'
    g.font = font(38, 700, 'Menlo, Consolas, monospace')
    g.fillText(lane, 44, y)
    g.fillText(name, 120, y)
    g.textAlign = 'right'
    g.fillText(time, w - 44, y)
    g.textAlign = 'left'
  })
}

/** Four-hand pace clock: white 60-second dial with a red sweep hand. */
export const paceClock: Paint = (g, w, h) => {
  const r = w / 2
  g.fillStyle = '#0c0d0f'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#f6f4ef'
  g.beginPath()
  g.arc(r, r, r * 0.94, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = '#111'
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2
    const inner = i % 5 === 0 ? 0.74 : 0.84
    g.lineWidth = i % 5 === 0 ? 7 : 3
    g.beginPath()
    g.moveTo(r + Math.sin(a) * r * inner, r - Math.cos(a) * r * inner)
    g.lineTo(r + Math.sin(a) * r * 0.9, r - Math.cos(a) * r * 0.9)
    g.stroke()
  }
  g.fillStyle = '#111'
  g.font = font(34, 700)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    g.fillText(String(i === 0 ? 60 : i * 5), r + Math.sin(a) * r * 0.6, r - Math.cos(a) * r * 0.6)
  }
  const hand = (a: number, len: number, color: string, width: number) => {
    g.strokeStyle = color
    g.lineWidth = width
    g.beginPath()
    g.moveTo(r, r)
    g.lineTo(r + Math.sin(a) * r * len, r - Math.cos(a) * r * len)
    g.stroke()
  }
  hand(0.9, 0.82, '#c8262b', 8)
  hand(3.6, 0.82, '#1b62c4', 8)
  hand(2.1, 0.82, '#1f8a44', 8)
  hand(5.1, 0.82, '#111', 8)
}

/** Maple and walnut chequerboard. */
export const chessBoard: Paint = (g, w, h) => {
  g.fillStyle = '#3a2618'
  g.fillRect(0, 0, w, h)
  const m = w * 0.06
  const s = (w - 2 * m) / 8
  for (let i = 0; i < 8; i++)
    for (let j = 0; j < 8; j++) {
      g.fillStyle = (i + j) % 2 ? '#5b3a24' : '#e0c9a2'
      g.fillRect(m + i * s, m + j * s, s, s)
    }
}

/** Lane number plate for starting blocks and turn ends. */
export const laneNumber = (n: number): Paint => (g, w, h) => {
  g.fillStyle = '#f7f7f5'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#12306a'
  g.font = font(h * 0.78, 800)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(String(n), w / 2, h / 2 + h * 0.04)
}

/** Bronze lettering on honed stone, for the arrival monolith. */
export const signage: Paint = (g, w, h) => {
  g.fillStyle = '#d6cbb8'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#8a6a44'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = font(h * 0.34, 400, 'Georgia, "Times New Roman", serif')
  g.fillText('KALAKAL', w / 2, h * 0.42)
  g.font = font(h * 0.13, 600)
  g.fillText('T H E   C L U B H O U S E', w / 2, h * 0.76)
}

/** Air-hockey surface: white with a centre line, face-off circles and goal creases. */
export const airHockeyTop: Paint = (g, w, h) => {
  g.fillStyle = '#eef1f3'
  g.fillRect(0, 0, w, h)
  g.fillStyle = 'rgba(40,60,80,.25)'
  for (let x = 8; x < w; x += 16) for (let y = 8; y < h; y += 16) g.fillRect(x, y, 2, 2)
  g.strokeStyle = '#c8262b'
  g.lineWidth = 6
  g.beginPath()
  g.moveTo(w / 2, 0)
  g.lineTo(w / 2, h)
  g.stroke()
  g.beginPath()
  g.arc(w / 2, h / 2, h * 0.18, 0, Math.PI * 2)
  g.stroke()
  g.strokeStyle = '#1b62c4'
  for (const x of [0, w]) {
    g.beginPath()
    g.arc(x, h / 2, h * 0.22, 0, Math.PI * 2)
    g.stroke()
  }
}

/** A soft-focus still for the recreation lounge's screen. */
export const screenImage: Paint = (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, h)
  gr.addColorStop(0, '#0f2a44')
  gr.addColorStop(0.55, '#1f5f7a')
  gr.addColorStop(1, '#d8a45a')
  g.fillStyle = gr
  g.fillRect(0, 0, w, h)
  g.fillStyle = 'rgba(255,255,255,.85)'
  g.font = font(h * 0.09, 700)
  g.fillText('MATCH DAY', w * 0.06, h * 0.82)
}

/** A quiet landscape print: layered hills under a pale sky, in the building's stone and sage tones. */
export const landscapePrint = (seed: number): Paint => (g, w, h) => {
  let t = seed
  const rand = () => ((t = (t * 16807) % 2147483647) / 2147483647)
  const sky = g.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#e9e4da')
  sky.addColorStop(1, '#d9d1c2')
  g.fillStyle = sky
  g.fillRect(0, 0, w, h)
  const tones = ['#b9b09c', '#9a9a84', '#7c806c', '#5f6656']
  tones.forEach((tone, i) => {
    g.fillStyle = tone
    g.beginPath()
    const base = h * (0.5 + i * 0.12)
    g.moveTo(0, h)
    g.lineTo(0, base)
    for (let x = 0; x <= w; x += w / 8) g.lineTo(x, base - rand() * h * 0.08)
    g.lineTo(w, h)
    g.fill()
  })
  // Passe-partout mount.
  g.strokeStyle = '#f5f2ec'
  g.lineWidth = w * 0.07
  g.strokeRect(0, 0, w, h)
}

/** Brushed-bronze lettering on a transparent ground, for the reception wall. */
export const nameplate: Paint = (g, w, h) => {
  g.clearRect(0, 0, w, h)
  g.fillStyle = '#9a7a52'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = font(h * 0.52, 400, 'Georgia, "Times New Roman", serif')
  g.fillText('K A L A K A L', w / 2, h * 0.4)
  g.font = font(h * 0.18, 600)
  g.fillText('C L U B H O U S E', w / 2, h * 0.85)
}

/** Carrom board: maple playing surface with baselines, corner pockets, arrows and centre circles. */
export const carromTop: Paint = (g, w, h) => {
  g.fillStyle = '#e8d3a8'
  g.fillRect(0, 0, w, h)
  g.fillStyle = 'rgba(160,120,70,.12)'
  for (let i = 0; i < 60; i++) g.fillRect(0, (i * h) / 60, w, 1)
  g.strokeStyle = '#2a1a10'
  g.lineWidth = 3
  const m = w * 0.13
  for (const [x0, y0, x1, y1] of [[m, m, w - m, m], [m, h - m, w - m, h - m], [m, m, m, h - m], [w - m, m, w - m, h - m]]) {
    g.beginPath()
    g.moveTo(x0, y0)
    g.lineTo(x1, y1)
    g.stroke()
  }
  g.fillStyle = '#b3261e'
  for (const [x, y] of [[m, m], [w - m, m], [m, h - m], [w - m, h - m]]) {
    g.beginPath()
    g.arc(x, y, w * 0.018, 0, Math.PI * 2)
    g.fill()
  }
  g.fillStyle = '#1a1a1a'
  for (const [x, y] of [[0, 0], [w, 0], [0, h], [w, h]]) {
    g.beginPath()
    g.arc(x, y, w * 0.06, 0, Math.PI * 2)
    g.fill()
  }
  for (const r of [0.2, 0.06]) {
    g.beginPath()
    g.arc(w / 2, h / 2, w * r, 0, Math.PI * 2)
    g.stroke()
  }
  g.fillStyle = '#b3261e'
  g.beginPath()
  g.arc(w / 2, h / 2, w * 0.018, 0, Math.PI * 2)
  g.fill()
}

/** Regulation dartboard: 20 black and cream segments, red/green doubles and trebles, bull. */
export const dartboard: Paint = (g, w, h) => {
  const c = w / 2
  g.fillStyle = '#111'
  g.fillRect(0, 0, w, h)
  const ring = (r0: number, r1: number, colors: [string, string]) => {
    for (let i = 0; i < 20; i++) {
      const a0 = ((i - 0.5) / 20) * Math.PI * 2 - Math.PI / 2
      const a1 = ((i + 0.5) / 20) * Math.PI * 2 - Math.PI / 2
      g.fillStyle = colors[i % 2]
      g.beginPath()
      g.arc(c, c, r1 * c, a0, a1)
      g.arc(c, c, r0 * c, a1, a0, true)
      g.fill()
    }
  }
  ring(0.1, 0.78, ['#141414', '#efe3c4'])
  ring(0.72, 0.78, ['#b3261e', '#1f7a3c'])
  ring(0.44, 0.5, ['#b3261e', '#1f7a3c'])
  g.fillStyle = '#1f7a3c'
  g.beginPath()
  g.arc(c, c, 0.1 * c, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#b3261e'
  g.beginPath()
  g.arc(c, c, 0.04 * c, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#eee'
  g.font = font(c * 0.1, 700)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  const nums = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5]
  nums.forEach((n, i) => {
    const a = (i / 20) * Math.PI * 2 - Math.PI / 2
    g.fillText(String(n), c + Math.cos(a) * c * 0.88, c + Math.sin(a) * c * 0.88)
  })
}

/** In-game frames for the console screens: a racing game or a football match, with a HUD. */
export const gameplay = (kind: 'race' | 'football'): Paint => (g, w, h) => {
  if (kind === 'race') {
    const sky = g.createLinearGradient(0, 0, 0, h * 0.5)
    sky.addColorStop(0, '#3f7fc4')
    sky.addColorStop(1, '#bcd9ef')
    g.fillStyle = sky
    g.fillRect(0, 0, w, h * 0.5)
    g.fillStyle = '#5f8a4a'
    g.fillRect(0, h * 0.5, w, h * 0.5)
    g.fillStyle = '#3a3c40'
    g.beginPath()
    g.moveTo(w * 0.47, h * 0.5)
    g.lineTo(w * 0.53, h * 0.5)
    g.lineTo(w * 0.95, h)
    g.lineTo(w * 0.05, h)
    g.fill()
    g.fillStyle = '#f2f2f0'
    for (let i = 0; i < 6; i++) {
      const t = i / 6
      g.fillRect(w * 0.5 - 2 - t * 6, h * (0.52 + t * 0.48), 4 + t * 12, h * 0.04)
    }
    g.fillStyle = '#c8262b'
    g.fillRect(w * 0.42, h * 0.72, w * 0.16, h * 0.14)
  } else {
    g.fillStyle = '#2f7a3a'
    g.fillRect(0, 0, w, h)
    g.fillStyle = 'rgba(255,255,255,.06)'
    for (let x = 0; x < w; x += w / 10) g.fillRect(x, 0, w / 20, h)
    g.strokeStyle = '#f2f2f0'
    g.lineWidth = 3
    g.strokeRect(w * 0.05, h * 0.1, w * 0.9, h * 0.8)
    g.beginPath()
    g.moveTo(w / 2, h * 0.1)
    g.lineTo(w / 2, h * 0.9)
    g.stroke()
    g.beginPath()
    g.arc(w / 2, h / 2, h * 0.15, 0, Math.PI * 2)
    g.stroke()
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? '#c8262b' : '#1b4fb8'
      g.beginPath()
      g.arc(w * (0.2 + (i * 0.37) % 0.6), h * (0.25 + (i * 0.29) % 0.5), 6, 0, Math.PI * 2)
      g.fill()
    }
  }
  g.fillStyle = 'rgba(0,0,0,.55)'
  g.fillRect(w * 0.03, h * 0.04, w * 0.28, h * 0.1)
  g.fillStyle = '#fff'
  g.font = font(h * 0.06, 700)
  g.textBaseline = 'middle'
  g.fillText(kind === 'race' ? 'LAP 2/5   1:24.6' : 'KAL 2 - 1 FC   67\'', w * 0.05, h * 0.09)
}

/** TERRANOVA wordmark in brushed bronze on honed basalt, for the arrival fountain. */
export const terranovaMark: Paint = (g, w, h) => {
  g.fillStyle = '#23211f'
  g.fillRect(0, 0, w, h)
  const gr = g.createLinearGradient(0, h * 0.3, 0, h * 0.7)
  gr.addColorStop(0, '#c9a46a')
  gr.addColorStop(0.5, '#a4804f')
  gr.addColorStop(1, '#c9a46a')
  g.fillStyle = gr
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  const word = 'TERRANOVA'
  // Hand-set tracking, letter by letter, sized so the word sits within the slab's margins.
  let size = h * 0.34
  const measure = () => {
    g.font = font(size, 400, 'Georgia, "Times New Roman", serif')
    const widths = [...word].map((ch) => g.measureText(ch).width)
    return { widths, total: widths.reduce((a, b) => a + b, 0) + size * 0.2 * (word.length - 1) }
  }
  let { widths, total } = measure()
  if (total > w * 0.8) {
    size *= (w * 0.8) / total
    ;({ widths, total } = measure())
  }
  const tracking = size * 0.2
  let x = (w - total) / 2
  ;[...word].forEach((ch, i) => {
    g.fillText(ch, x + widths[i] / 2, h * 0.5)
    x += widths[i] + tracking
  })
  g.fillRect(w * 0.3, h * 0.76, w * 0.4, Math.max(2, h * 0.008))
}
