import { DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial, type MeshStandardMaterialParameters } from 'three'
import type { Kit } from '../kit'
import type { Lighting } from '../shared'
import { rng, type Paint } from '../textures'

const std = (p: MeshStandardMaterialParameters) => new MeshStandardMaterial({ roughness: 0.8, ...p })
const PI = Math.PI
const SANS = (px: number, weight = 700) => `${weight} ${Math.round(px)}px Helvetica, Arial, sans-serif`

/* ---------- floors and ceilings ---------- */

/**
 * Homogeneous sheet vinyl, 2 m wide rolls: a base colour with fine chips of two or three tones
 * through it, a faint cloud, and the heat-welded seam along the roll's edge.
 */
const vinyl = (base: string, chips: string[], seam: string, seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = base
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 70; i++) {
    const x = r() * w
    const y = r() * h
    const rad = 30 + r() * 120
    const cloud = g.createRadialGradient(x, y, 0, x, y, rad)
    const light = r() < 0.5
    cloud.addColorStop(0, light ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.035)')
    cloud.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = cloud
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }
  for (let i = 0; i < (w * h) / 14; i++) {
    g.globalAlpha = 0.18 + r() * 0.45
    g.fillStyle = chips[(r() * chips.length) | 0]
    const s = 0.7 + r() * 1.6
    g.fillRect(r() * w, r() * h, s, s * (0.6 + r() * 0.8))
  }
  g.globalAlpha = 1
  g.fillStyle = seam
  g.fillRect(0, 0, 1.5, h)
}

/**
 * Two by two 600 mm mineral-fibre tiles, 1.2 m of ceiling: a fissured white face, the tegular
 * edge's shadow, and the 24 mm white T-bar between.
 */
const ceilingTiles: Paint = (g, w, h) => {
  const r = rng(3301)
  g.fillStyle = '#f3f3f0'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 5200; i++) {
    g.fillStyle = `rgba(120,118,110,${0.08 + r() * 0.16})`
    const x = r() * w
    const y = r() * h
    if (r() < 0.6) g.fillRect(x, y, 1, 1)
    else {
      g.beginPath()
      g.moveTo(x, y)
      g.lineTo(x + (r() - 0.5) * 7, y + (r() - 0.5) * 7)
      g.lineWidth = 0.8
      g.strokeStyle = g.fillStyle
      g.stroke()
    }
  }
  const bar = (w / 1.2) * 0.024
  for (const at of [0, w / 2]) {
    // The tile edges each side of the bar, a shade darker where they step down to it.
    g.fillStyle = 'rgba(90,90,86,.18)'
    g.fillRect(at - bar / 2 - 3, 0, bar + 6, h)
    g.fillRect(0, at - bar / 2 - 3, w, bar + 6)
  }
  for (const at of [0, w / 2]) {
    g.fillStyle = '#f7f7f5'
    g.fillRect(at - bar / 2, 0, bar, h)
    g.fillRect(0, at - bar / 2, w, bar)
    g.fillStyle = 'rgba(0,0,0,.10)'
    g.fillRect(at - bar / 2, 0, 1, h)
    g.fillRect(0, at - bar / 2, w, 1)
  }
}

/** A 600 mm four-way square supply diffuser: concentric louvres with dark slots between. */
const diffuser: Paint = (g, w, h) => {
  g.fillStyle = '#f1f1ee'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 6; i++) {
    const inset = w * (0.08 + i * 0.065)
    g.strokeStyle = 'rgba(40,40,40,.55)'
    g.lineWidth = w * 0.018
    g.strokeRect(inset, inset, w - 2 * inset, h - 2 * inset)
  }
  g.fillStyle = '#e6e6e2'
  g.fillRect(w * 0.45, h * 0.45, w * 0.1, h * 0.1)
}

/** An egg-crate return grille. */
const grille: Paint = (g, w, h) => {
  g.fillStyle = '#3a3c3e'
  g.fillRect(0, 0, w, h)
  g.strokeStyle = '#efefec'
  g.lineWidth = 3
  for (let i = 0; i <= 24; i++) {
    const t = (i / 24) * w
    g.beginPath()
    g.moveTo(t, 0)
    g.lineTo(t, h)
    g.moveTo(0, t)
    g.lineTo(w, t)
    g.stroke()
  }
  g.lineWidth = w * 0.04
  g.strokeRect(0, 0, w, h)
}

/* ---------- textiles ---------- */

/** Cubicle curtain fabric: a pale stone ground with a fine woven texture and a faint vertical stripe. */
const curtainFabric: Paint = (g, w, h) => {
  const r = rng(3317)
  g.fillStyle = '#d8d4ca'
  g.fillRect(0, 0, w, h)
  for (let x = 0; x < w; x += 2) {
    g.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '120,112,100'},${0.04 + r() * 0.06})`
    g.fillRect(x, 0, 1, h)
  }
  for (let y = 0; y < h; y += 2) {
    g.fillStyle = `rgba(110,104,94,${0.03 + r() * 0.04})`
    g.fillRect(0, y, w, 1)
  }
  for (const x of [0.2, 0.62]) {
    g.fillStyle = 'rgba(160,170,172,.22)'
    g.fillRect(w * x, 0, w * 0.05, h)
  }
}

/** The curtain's open mesh head, as an alpha map: white threads, holes between. */
const net: Paint = (g, w, h) => {
  g.fillStyle = '#000'
  g.fillRect(0, 0, w, h)
  g.strokeStyle = '#fff'
  g.lineWidth = 2
  const step = w / 16
  for (let i = 0; i <= 16; i++) {
    g.beginPath()
    g.moveTo(i * step, 0)
    g.lineTo(i * step, h)
    g.moveTo(0, i * step)
    g.lineTo(w, i * step)
    g.stroke()
  }
}

/* ---------- screens ---------- */

/** A bedside patient monitor: ECG, pleth and respiration traces, and their numbers. */
const patientMonitor = (seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = '#05070a'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#1b2430'
  g.fillRect(0, 0, w, h * 0.08)
  g.fillStyle = '#9fb2c8'
  g.font = SANS(h * 0.045, 600)
  g.textBaseline = 'middle'
  g.textAlign = 'left'
  g.fillText(`BED ${1 + ((seed * 7) % 5)}   ADULT   14:${String(10 + ((seed * 13) % 49)).padStart(2, '0')}`, w * 0.02, h * 0.04)
  const hr = 68 + Math.round(r() * 30)
  const traces: [string, number, (t: number) => number][] = [
    ['#39e27a', 0.24, (t) => {
      const p = t % 1
      if (p > 0.18 && p < 0.21) return -1
      if (p >= 0.21 && p < 0.24) return 0.35
      if (p > 0.4 && p < 0.52) return -0.22 * Math.sin(((p - 0.4) / 0.12) * Math.PI)
      return 0.02 * Math.sin(t * 40)
    }],
    ['#38d6ee', 0.5, (t) => -0.6 * Math.max(0, Math.sin((t % 1) * Math.PI * 2 - 0.4)) ** 1.6 + 0.15],
    ['#f2d03b', 0.74, (t) => -0.35 * Math.sin(t * 0.9)],
  ]
  for (const [colour, y0, f] of traces) {
    g.strokeStyle = colour
    g.lineWidth = Math.max(1.5, h * 0.006)
    g.beginPath()
    const beats = 4 + r() * 1.5
    for (let x = 0; x <= w * 0.66; x += 1) {
      const y = h * y0 + f((x / (w * 0.66)) * beats) * h * 0.08
      if (x === 0) g.moveTo(x + w * 0.02, y)
      else g.lineTo(x + w * 0.02, y)
    }
    g.stroke()
  }
  const nums: [string, string, string, number][] = [
    ['HR', String(hr), '#39e27a', 0.2],
    ['SpO₂', String(95 + Math.round(r() * 4)), '#38d6ee', 0.44],
    ['RR', String(14 + Math.round(r() * 6)), '#f2d03b', 0.66],
    ['NIBP', `${112 + Math.round(r() * 24)}/${70 + Math.round(r() * 14)}`, '#f3f3f3', 0.88],
  ]
  for (const [label, value, colour, y] of nums) {
    g.fillStyle = colour
    g.textAlign = 'left'
    g.font = SANS(h * 0.045, 600)
    g.fillText(label, w * 0.72, h * (y - 0.07))
    g.textAlign = 'right'
    g.font = SANS(label === 'NIBP' ? h * 0.085 : h * 0.13, 700)
    g.fillText(value, w * 0.97, h * y)
  }
  g.fillStyle = 'rgba(255,255,255,.08)'
  g.fillRect(w * 0.7, h * 0.1, 1, h * 0.88)
}

/** The department's patient board on the clinicians' screens: light theme, triage colours down the side. */
const patientBoard: Paint = (g, w, h) => {
  const r = rng(3331)
  g.fillStyle = '#f4f6f8'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#1f4f86'
  g.fillRect(0, 0, w, h * 0.09)
  g.fillStyle = '#ffffff'
  g.font = SANS(h * 0.05, 600)
  g.textBaseline = 'middle'
  g.fillText('ED Tracking Board · Terranova Hospital', w * 0.02, h * 0.045)
  g.fillStyle = '#dfe5ec'
  g.fillRect(0, h * 0.09, w, h * 0.06)
  const tags = ['#d7262e', '#f08a24', '#f2c71b', '#3aa655', '#3aa655', '#f2c71b', '#f08a24', '#3aa655']
  for (let i = 0; i < 8; i++) {
    const y = h * (0.17 + i * 0.1)
    g.fillStyle = i % 2 ? '#ffffff' : '#eef1f4'
    g.fillRect(0, y, w, h * 0.1)
    g.fillStyle = tags[i]
    g.fillRect(w * 0.01, y + h * 0.015, w * 0.02, h * 0.07)
    g.fillStyle = '#56606b'
    for (const [x, len] of [[0.05, 0.08], [0.16, 0.22], [0.42, 0.14], [0.6, 0.18], [0.82, 0.1]] as const) g.fillRect(w * x, y + h * 0.04, w * len * (0.6 + r() * 0.4), h * 0.022)
  }
}

/** The waiting area's display: who is being seen, and the expected wait. */
const queueBoard: Paint = (g, w, h) => {
  g.fillStyle = '#0e2340'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#c8161d'
  g.fillRect(0, 0, w, h * 0.14)
  g.fillStyle = '#ffffff'
  g.textAlign = 'left'
  g.textBaseline = 'middle'
  g.font = SANS(h * 0.07, 700)
  g.fillText('EMERGENCY DEPARTMENT', w * 0.04, h * 0.07)
  g.textAlign = 'right'
  g.font = SANS(h * 0.06, 500)
  g.fillText('14:26', w * 0.96, h * 0.07)
  g.textAlign = 'left'
  g.fillStyle = '#9fb7d6'
  g.font = SANS(h * 0.05, 600)
  g.fillText('NOW SERVING', w * 0.04, h * 0.23)
  g.fillText('COUNTER / ROOM', w * 0.55, h * 0.23)
  const rows: [string, string][] = [['E-041', 'TRIAGE'], ['E-039', 'BAY 3'], ['E-038', 'REGISTRATION 2'], ['E-036', 'BAY 5']]
  rows.forEach(([token, where], i) => {
    const y = h * (0.35 + i * 0.13)
    g.fillStyle = i === 0 ? '#f2c71b' : '#ffffff'
    g.font = SANS(h * 0.075, 700)
    g.fillText(token, w * 0.04, y)
    g.font = SANS(h * 0.06, 600)
    g.fillText(where, w * 0.55, y)
    g.fillStyle = 'rgba(255,255,255,.12)'
    g.fillRect(w * 0.04, y + h * 0.055, w * 0.92, 2)
  })
  g.fillStyle = '#9fb7d6'
  g.font = SANS(h * 0.045, 500)
  g.fillText('Patients are seen by clinical priority, not arrival time.', w * 0.04, h * 0.92)
}

/** The token kiosk's touch screen. */
const kiosk: Paint = (g, w, h) => {
  g.fillStyle = '#f3f6f9'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#1f4f86'
  g.fillRect(0, 0, w, h * 0.16)
  g.fillStyle = '#fff'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = SANS(h * 0.065, 700)
  g.fillText('TAKE A TOKEN', w / 2, h * 0.08)
  for (const [y, label, colour] of [[0.36, 'EMERGENCY', '#c8161d'], [0.58, 'REGISTRATION', '#1f4f86'], [0.8, 'ENQUIRY', '#4a5866']] as const) {
    g.fillStyle = colour
    g.fillRect(w * 0.12, h * (y - 0.08), w * 0.76, h * 0.16)
    g.fillStyle = '#fff'
    g.font = SANS(h * 0.06, 700)
    g.fillText(label, w / 2, h * y)
  }
}

/* ---------- signs ---------- */

type Line = [text: string, size: number, colour: string, weight?: number]

/** A flat sign: a ground colour and lines of type, centred or set left after a red cross. */
const sign = (bg: string, lines: Line[], cross = false, rule?: string): Paint => (g, w, h) => {
  g.fillStyle = bg
  g.fillRect(0, 0, w, h)
  if (rule) {
    g.fillStyle = rule
    g.fillRect(0, h * 0.9, w, h * 0.1)
  }
  let x = w / 2
  g.textAlign = 'center'
  if (cross) {
    const s = h * 0.56
    const cx = h * 0.22
    const cy = (h - s) / 2
    g.fillStyle = '#d71920'
    g.fillRect(cx + s * 0.34, cy, s * 0.32, s)
    g.fillRect(cx, cy + s * 0.34, s, s * 0.32)
    g.textAlign = 'left'
    x = cx + s + h * 0.18
  }
  g.textBaseline = 'middle'
  const total = lines.reduce((t, [, size]) => t + size * 1.25, 0)
  let y = (h - total * h) / 2
  for (const [text, size, colour, weight = 700] of lines) {
    y += (size * 1.25 * h) / 2
    g.fillStyle = colour
    g.font = SANS(size * h, weight)
    g.fillText(text, x, y)
    y += (size * 1.25 * h) / 2
  }
}

/** A bay's number: white on charcoal, a thin white keyline, as hung over each bay in the reference. */
const bayNumber = (n: string): Paint => (g, w, h) => {
  g.fillStyle = '#26282b'
  g.fillRect(0, 0, w, h)
  g.strokeStyle = 'rgba(255,255,255,.75)'
  g.lineWidth = w * 0.025
  g.strokeRect(w * 0.07, h * 0.07, w * 0.86, h * 0.86)
  g.fillStyle = '#ffffff'
  g.font = SANS(h * (n.length > 1 ? 0.38 : 0.58), 700)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(n, w / 2, h * 0.54)
}

/** The green running-man exit sign, its arrow pointing `dir`. */
const exitSign = (dir: 1 | -1): Paint => (g, w, h) => {
  g.fillStyle = '#0f8a3c'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#ffffff'
  g.textBaseline = 'middle'
  g.textAlign = 'center'
  g.font = SANS(h * 0.5, 700)
  // A door, the figure running for it, and the arrow.
  const doorX = dir > 0 ? w * 0.58 : w * 0.12
  g.fillRect(doorX, h * 0.18, w * 0.12, h * 0.64)
  g.fillStyle = '#0f8a3c'
  g.fillRect(doorX + w * 0.02, h * 0.24, w * 0.08, h * 0.58)
  g.fillStyle = '#ffffff'
  const fx = dir > 0 ? w * 0.42 : w * 0.36
  g.beginPath()
  g.arc(fx + w * 0.03, h * 0.26, h * 0.07, 0, 7)
  g.fill()
  g.lineWidth = h * 0.08
  g.strokeStyle = '#ffffff'
  g.lineCap = 'round'
  g.beginPath()
  g.moveTo(fx, h * 0.38)
  g.lineTo(fx - dir * w * 0.02, h * 0.58)
  g.lineTo(fx - dir * w * 0.07, h * 0.78)
  g.moveTo(fx - dir * w * 0.02, h * 0.58)
  g.lineTo(fx + dir * w * 0.04, h * 0.66)
  g.lineTo(fx + dir * w * 0.03, h * 0.8)
  g.moveTo(fx, h * 0.42)
  g.lineTo(fx + dir * w * 0.05, h * 0.5)
  g.moveTo(fx, h * 0.42)
  g.lineTo(fx - dir * w * 0.05, h * 0.46)
  g.stroke()
  g.fillText(dir > 0 ? '→' : '←', dir > 0 ? w * 0.86 : w * 0.82, h * 0.5)
}

/** The WHO hand-hygiene poster over the clinical hand-wash sinks. */
const hygienePoster: Paint = (g, w, h) => {
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#1f6fb5'
  g.fillRect(0, 0, w, h * 0.12)
  g.fillStyle = '#fff'
  g.font = SANS(h * 0.05, 700)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('HOW TO HANDWASH', w / 2, h * 0.06)
  for (let i = 0; i < 9; i++) {
    const cx = w * (0.2 + (i % 3) * 0.3)
    const cy = h * (0.26 + Math.floor(i / 3) * 0.24)
    g.fillStyle = '#e8f1f9'
    g.beginPath()
    g.arc(cx, cy, w * 0.11, 0, 7)
    g.fill()
    g.fillStyle = '#e2b89a'
    g.beginPath()
    g.ellipse(cx - w * 0.03, cy, w * 0.05, w * 0.03, 0.5 + i * 0.3, 0, 7)
    g.ellipse(cx + w * 0.03, cy, w * 0.05, w * 0.03, -0.5 - i * 0.2, 0, 7)
    g.fill()
    g.fillStyle = '#1f6fb5'
    g.font = SANS(h * 0.03, 700)
    g.fillText(String(i + 1), cx - w * 0.09, cy - w * 0.08)
  }
  g.fillStyle = '#56606b'
  g.font = SANS(h * 0.028, 500)
  g.fillText('Duration of the entire procedure: 40–60 seconds', w / 2, h * 0.95)
}

/** A white-faced wall clock. */
const clockFace: Paint = (g, w, h) => {
  const c = w / 2
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, w, h)
  g.strokeStyle = '#1a1a1a'
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2
    const long = i % 5 === 0
    g.lineWidth = long ? w * 0.025 : w * 0.008
    g.beginPath()
    g.moveTo(c + Math.sin(a) * c * (long ? 0.76 : 0.84), c - Math.cos(a) * c * (long ? 0.76 : 0.84))
    g.lineTo(c + Math.sin(a) * c * 0.92, c - Math.cos(a) * c * 0.92)
    g.stroke()
  }
  const hand = (a: number, len: number, wd: number, colour = '#1a1a1a') => {
    g.strokeStyle = colour
    g.lineWidth = wd
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(c - Math.sin(a) * c * 0.12, c + Math.cos(a) * c * 0.12)
    g.lineTo(c + Math.sin(a) * c * len, c - Math.cos(a) * c * len)
    g.stroke()
  }
  hand(((2 + 26 / 60) / 12) * Math.PI * 2, 0.5, w * 0.045)
  hand((26 / 60) * Math.PI * 2, 0.78, w * 0.03)
  hand((41 / 60) * Math.PI * 2, 0.82, w * 0.012, '#c8161d')
}


/* ---------- surfaces with grain ---------- */

/** Brushed stainless: fine streaks along one direction, a little light and dark. */
const brushed: Paint = (g, w, h) => {
  const r = rng(3401)
  g.fillStyle = '#b9bdc0'
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = r() < 0.5 ? `rgba(255,255,255,${0.04 + r() * 0.08})` : `rgba(60,64,68,${0.04 + r() * 0.08})`
    g.fillRect(r() * w, r() * h, 20 + r() * 160, 1)
  }
}

/** Percale: a close plain weave, warm white. */
const percale: Paint = (g, w, h) => {
  const r = rng(3403)
  g.fillStyle = '#f4f3ef'
  g.fillRect(0, 0, w, h)
  for (let y = 0; y < h; y += 2) {
    g.fillStyle = `rgba(150,145,135,${0.05 + r() * 0.05})`
    g.fillRect(0, y, w, 1)
  }
  for (let x = 0; x < w; x += 2) {
    g.fillStyle = `rgba(255,255,255,${0.05 + r() * 0.06})`
    g.fillRect(x, 0, 1, h)
  }
}

/** Upholstery vinyl: a fine pebble grain over the base colour. */
const grain = (base: string, seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = base
  g.fillRect(0, 0, w, h)
  for (let i = 0; i < (w * h) / 6; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.07)'
    g.beginPath()
    g.arc(r() * w, r() * h, 0.8 + r() * 1.4, 0, 7)
    g.fill()
  }
}

/* ---------- gauges, outlets and gas signage ---------- */

/**
 * A pressure gauge's dial: white face, black scale over `sweep`, the green band of normal
 * working pressure, the needle at `at` (0 … 1 of the scale) and the units.
 */
const dial = (labels: string[], units: string, at: number, band: [number, number], red = false): Paint => (g, w, h) => {
  const c = w / 2
  g.fillStyle = '#fbfbf8'
  g.fillRect(0, 0, w, h)
  const a0 = PI * 0.75
  const sweep = PI * 1.5
  g.strokeStyle = red ? '#d23a2a' : '#2e9b4f'
  g.lineWidth = w * 0.06
  g.beginPath()
  g.arc(c, c, c * 0.7, a0 + sweep * band[0], a0 + sweep * band[1])
  g.stroke()
  g.strokeStyle = '#111'
  for (let i = 0; i <= 40; i++) {
    const a = a0 + (sweep * i) / 40
    const long = i % 10 === 0
    g.lineWidth = long ? w * 0.016 : w * 0.007
    g.beginPath()
    g.moveTo(c + Math.cos(a) * c * (long ? 0.62 : 0.7), c + Math.sin(a) * c * (long ? 0.62 : 0.7))
    g.lineTo(c + Math.cos(a) * c * 0.8, c + Math.sin(a) * c * 0.8)
    g.stroke()
  }
  g.fillStyle = '#111'
  g.font = SANS(w * 0.085, 600)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  labels.forEach((t, i) => {
    const a = a0 + (sweep * i) / (labels.length - 1)
    g.fillText(t, c + Math.cos(a) * c * 0.47, c + Math.sin(a) * c * 0.47)
  })
  g.font = SANS(w * 0.07, 500)
  g.fillText(units, c, c * 1.45)
  const a = a0 + sweep * at
  g.strokeStyle = '#c8161d'
  g.lineWidth = w * 0.02
  g.lineCap = 'round'
  g.beginPath()
  g.moveTo(c - Math.cos(a) * c * 0.12, c - Math.sin(a) * c * 0.12)
  g.lineTo(c + Math.cos(a) * c * 0.76, c + Math.sin(a) * c * 0.76)
  g.stroke()
  g.fillStyle = '#222'
  g.beginPath()
  g.arc(c, c, w * 0.045, 0, 7)
  g.fill()
}

/** An oxygen flowmeter's scale: litres per minute up a clear tube, the float at 4. */
const flowScale: Paint = (g, w, h) => {
  g.fillStyle = '#eaf3f1'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#111'
  g.font = SANS(w * 0.32, 600)
  g.textAlign = 'right'
  g.textBaseline = 'middle'
  for (let i = 0; i <= 15; i++) {
    const y = h * (0.92 - (i / 15) * 0.84)
    g.fillRect(w * 0.62, y, w * (i % 5 === 0 ? 0.38 : 0.22), 1.5)
    if (i % 5 === 0) g.fillText(String(i), w * 0.55, y)
  }
}

/**
 * A gas outlet's identification plate: the gas's symbol and name, and its colour (ISO 32: oxygen
 * white, medical air black and white, vacuum yellow) as a band.
 */
const gasPlate = (symbol: string, name: string, band: string, ink = '#ffffff'): Paint => (g, w, h) => {
  g.fillStyle = '#f5f5f2'
  g.fillRect(0, 0, w, h)
  g.fillStyle = band
  g.fillRect(0, 0, w, h * 0.3)
  if (band === '#ffffff') {
    g.strokeStyle = '#2b2b2b'
    g.lineWidth = 2
    g.strokeRect(1, 1, w - 2, h * 0.3 - 1)
  }
  g.fillStyle = ink === '#ffffff' && band === '#ffffff' ? '#111' : ink
  g.font = SANS(h * 0.2, 800)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(symbol, w / 2, h * 0.15)
  g.fillStyle = '#2b2b2b'
  g.font = SANS(h * 0.12, 700)
  g.fillText(name, w / 2, h * 0.9)
}

/** A pipeline identification label, wrapped round a pipe: the gas's name repeated, arrows of flow, its colour. */
const pipeLabel = (name: string, band: string, ink: string): Paint => (g, w, h) => {
  g.fillStyle = band
  g.fillRect(0, 0, w, h)
  if (band === 'split') {
    g.fillStyle = '#ffffff'
    g.fillRect(0, 0, w / 2, h)
    g.fillStyle = '#111'
    g.fillRect(w / 2, 0, w / 2, h)
  }
  g.fillStyle = ink
  g.font = SANS(h * 0.5, 800)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  for (const x of [0.25, 0.75]) g.fillText(`${name} ↑`, w * x, h / 2)
}

/** The zone valve box's lid: what the valves serve and the warning. */
const zvsuSign: Paint = (g, w, h) => {
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#c8161d'
  g.fillRect(0, 0, w, h * 0.22)
  g.fillStyle = '#fff'
  g.font = SANS(h * 0.13, 800)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('MEDICAL GAS ZONE VALVES', w / 2, h * 0.11)
  g.fillStyle = '#111'
  g.font = SANS(h * 0.1, 700)
  g.fillText('EMERGENCY DEPT · BAYS 1–5, TRIAGE', w / 2, h * 0.36)
  g.font = SANS(h * 0.085, 500)
  g.fillText('Close only in an emergency or for maintenance.', w / 2, h * 0.52)
  g.fillText('In case of fire, shut off and inform the duty manager.', w / 2, h * 0.64)
  for (const [x, t, c] of [[0.2, 'O₂', '#ffffff'], [0.5, 'AIR', '#000000'], [0.8, 'VAC', '#f2c200']] as const) {
    g.fillStyle = c
    g.fillRect(w * x - w * 0.09, h * 0.75, w * 0.18, h * 0.17)
    g.strokeStyle = '#111'
    g.lineWidth = 2
    g.strokeRect(w * x - w * 0.09, h * 0.75, w * 0.18, h * 0.17)
    g.fillStyle = c === '#000000' ? '#fff' : '#111'
    g.font = SANS(h * 0.11, 800)
    g.fillText(t, w * x, h * 0.835)
  }
}

/** The medical gas area alarm: a grey panel, a pair of lamps per gas, the mute button. */
const alarmPanel: Paint = (g, w, h) => {
  g.fillStyle = '#e4e6e8'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#1f2d3d'
  g.fillRect(0, 0, w, h * 0.18)
  g.fillStyle = '#fff'
  g.font = SANS(h * 0.1, 700)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('MEDICAL GAS ALARM', w / 2, h * 0.09)
  ;['O₂', 'AIR', 'VAC'].forEach((t, i) => {
    const x = w * (0.22 + i * 0.28)
    g.fillStyle = '#26c04a'
    g.beginPath()
    g.arc(x, h * 0.38, h * 0.07, 0, 7)
    g.fill()
    g.fillStyle = '#5a2020'
    g.beginPath()
    g.arc(x, h * 0.58, h * 0.07, 0, 7)
    g.fill()
    g.fillStyle = '#111'
    g.font = SANS(h * 0.09, 700)
    g.fillText(t, x, h * 0.75)
  })
  g.fillStyle = '#7b8189'
  g.fillRect(w * 0.38, h * 0.84, w * 0.24, h * 0.1)
}

/** Over the cylinder rack: what is kept there, and the rules. */
const oxygenSign: Paint = (g, w, h) => {
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#0f7a3d'
  g.fillRect(0, 0, w, h * 0.32)
  g.fillStyle = '#fff'
  g.font = SANS(h * 0.2, 800)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('MEDICAL OXYGEN', w / 2, h * 0.16)
  g.fillStyle = '#c8161d'
  g.font = SANS(h * 0.13, 800)
  g.fillText('NO SMOKING · NO NAKED FLAMES', w / 2, h * 0.47)
  g.fillStyle = '#111'
  g.font = SANS(h * 0.1, 600)
  g.fillText('Cylinders upright and chained · Full / In use / Empty', w / 2, h * 0.65)
  g.fillText('Keep valves and regulators free of oil and grease', w / 2, h * 0.8)
}

/** A cylinder's tag: FULL in green, the gas, the fill date. */
const cylinderTag = (full: boolean): Paint => (g, w, h) => {
  g.fillStyle = full ? '#2e9b4f' : '#e0a21a'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#fff'
  g.font = SANS(h * 0.22, 800)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(full ? 'FULL' : 'IN USE', w / 2, h * 0.3)
  g.font = SANS(h * 0.13, 600)
  g.fillText('MEDICAL O₂ IP', w / 2, h * 0.6)
  g.fillText('10/2026', w / 2, h * 0.8)
}

/* ---------- materials ---------- */

/**
 * The emergency department's finishes, as specified for a working ED: washable white paint, sheet
 * vinyl in two tones, mineral-fibre tiles, white solid surface and HPL joinery, brushed stainless,
 * powder-coated steel, and the screens and signs.
 */
export function emergencyMaterials(k: Kit, lighting: Lighting) {
  const tex = (w: number, h: number, paint: Paint) => k.tex.painted(w, h, paint)
  const screen = (w: number, h: number, paint: Paint, intensity = 1.05) => {
    const map = tex(w, h, paint)
    return lighting.glow(std({ map, emissive: '#ffffff', emissiveMap: map, emissiveIntensity: intensity, roughness: 0.25 }), 0.85)
  }
  const flat = (w: number, h: number, paint: Paint, roughness = 0.55) => std({ map: tex(w, h, paint), roughness })
  const metric = (w: number, h: number, paint: Paint, size: number, p: MeshStandardMaterialParameters) => {
    const map = tex(w, h, paint)
    map.repeat.set(1 / size, 1 / size)
    return std({ map, ...p })
  }

  return {
    /** Walls: washable eggshell emulsion, white with the faintest warmth. */
    paint: std({ color: '#efeeea', roughness: 0.88 }),
    /** Sheet vinyl: the pale grey of the bays and the waiting area; the dark taupe of the clinical corridor. */
    vinylLight: metric(1024, 1024, vinyl('#d6d4ce', ['#f4f3ef', '#b9b6ae', '#a19d95'], 'rgba(0,0,0,.08)', 3341), 2, { roughness: 0.34, metalness: 0.02 }),
    vinylDark: metric(1024, 1024, vinyl('#5b4e45', ['#7b6d62', '#43382f', '#8a7e74'], 'rgba(0,0,0,.18)', 3343), 2, { roughness: 0.3, metalness: 0.02 }),
    /** Coved vinyl skirting, a little darker than the floor. */
    skirting: std({ color: '#8d8a84', roughness: 0.5 }),
    /** The ceiling: 600 mm tiles in their white grid, and the plasterboard bulkheads. */
    // Both carry a little of their own light, the bounce off the floor and walls that the scene's
    // lights alone don't give a ceiling.
    tiles: (() => {
      const t = metric(512, 512, ceilingTiles, 1.2, { roughness: 0.96 })
      t.emissive.set('#fffaf2')
      t.emissiveMap = t.map
      t.emissiveIntensity = 0.42
      return lighting.glow(t, 0.3)
    })(),
    plasterboard: lighting.glow(std({ color: '#f4f4f1', roughness: 0.9, emissive: '#fffaf2', emissiveIntensity: 0.36 }), 0.3),
    /** Flat LED panels and linear slots: 4000 K, on day and night. */
    ledPanel: lighting.glow(std({ color: '#ffffff', emissive: '#fff6ea', emissiveIntensity: 1.5, roughness: 0.6 }), 1),
    ledLine: lighting.glow(std({ color: '#ffffff', emissive: '#fff4e6', emissiveIntensity: 2.2, roughness: 0.6 }), 1),
    ledFrame: std({ color: '#ecedeb', metalness: 0.35, roughness: 0.4 }),
    diffuser: flat(256, 256, diffuser, 0.7),
    grille: flat(256, 256, grille, 0.7),
    /** Brushed stainless (sinks, kick plates, rails), chrome (fittings), anodised aluminium (frames). */
    stainless: std({ map: tex(512, 512, brushed), color: '#ffffff', metalness: 0.9, roughness: 0.3 }),
    chrome: std({ color: '#dfe2e4', metalness: 1, roughness: 0.14 }),
    aluminium: std({ color: '#c7cbce', metalness: 0.75, roughness: 0.36 }),
    /** Joinery: white solid-surface tops and counter fronts, white HPL carcasses, a grey reveal. */
    solidSurface: std({ color: '#f6f6f3', roughness: 0.26 }),
    hpl: std({ color: '#f1f1ee', roughness: 0.42 }),
    reveal: std({ color: '#b7b9bb', roughness: 0.5 }),
    /** Equipment plastics: white, light grey, warm grey, charcoal and black. */
    whitePlastic: new MeshPhysicalMaterial({ color: '#f2f2ef', roughness: 0.36, clearcoat: 0.35, clearcoatRoughness: 0.4 }),
    greyPlastic: new MeshPhysicalMaterial({ color: '#c9cdd1', roughness: 0.42, clearcoat: 0.25, clearcoatRoughness: 0.5 }),
    darkPlastic: std({ color: '#33373c', roughness: 0.5 }),
    black: std({ color: '#141518', roughness: 0.35 }),
    rubber: std({ color: '#1c1c1e', roughness: 0.85 }),
    /** The beds: blue-grey base covers, pale grey frames, white linen, a pale blue blanket. */
    bedBase: new MeshPhysicalMaterial({ color: '#5f6e80', roughness: 0.4, clearcoat: 0.4, clearcoatRoughness: 0.35 }),
    bedFrame: std({ color: '#d8dbde', metalness: 0.45, roughness: 0.35 }),
    bedRail: std({ color: '#6f7a86', metalness: 0.3, roughness: 0.4 }),
    sheet: (() => {
      const map = tex(256, 256, percale)
      map.repeat.set(6, 6)
      return new MeshPhysicalMaterial({ map, roughness: 0.95, sheen: 0.5, sheenRoughness: 0.7, sheenColor: '#ffffff', side: DoubleSide })
    })(),
    mattress: new MeshPhysicalMaterial({ map: tex(256, 256, grain('#33506e', 3405)), roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.5 }),
    blanket: new MeshPhysicalMaterial({ color: '#c3d3e2', roughness: 1, sheen: 0.8, sheenRoughness: 0.8, sheenColor: '#e8f0f8', side: DoubleSide }),
    /** Seating: navy vinyl for the waiting beams and bay chairs; charcoal task-chair fabric. */
    vinylSeat: new MeshPhysicalMaterial({ map: tex(256, 256, grain('#33475e', 3407)), roughness: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.45 }),
    fabric: std({ color: '#2e3135', roughness: 0.95 }),
    powder: std({ color: '#585d63', metalness: 0.5, roughness: 0.42 }),
    /** Overbed and desk tops: oak-grain laminate. */
    laminate: new MeshStandardMaterial({ map: k.tex.finish('oak', 1, 1), color: '#c9a888', roughness: 0.45 }),
    /** Cubicle curtains and their mesh heads; walkers pass through them (see walk/collider.ts). */
    curtain: std({ map: tex(256, 256, curtainFabric), roughness: 1, side: DoubleSide, transparent: true, opacity: 0.97 }),
    curtainNet: std({ color: '#ebe9e2', alphaMap: tex(128, 128, net), roughness: 1, side: DoubleSide, transparent: true, opacity: 0.92, alphaTest: 0.35 }),
    /** Glass: clear partitions and door leaves, a frosted manifestation band, clear plastics. */
    glass: new MeshPhysicalMaterial({ color: '#dbe7e8', roughness: 0.03, ior: 1.52, transparent: true, opacity: 0.16, depthWrite: false }),
    frosted: std({ color: '#f3f5f5', roughness: 0.7, transparent: true, opacity: 0.82 }),
    clearPlastic: new MeshPhysicalMaterial({ color: '#e8f0f2', roughness: 0.15, transparent: true, opacity: 0.4, depthWrite: false }),
    /** Colour coding: oxygen white-on-green, medical air black-on-white, vacuum yellow; sharps yellow; the crash cart red. */
    oxygen: std({ color: '#2f8f4e', roughness: 0.4 }),
    vacuum: std({ color: '#e6c229', roughness: 0.4 }),
    sharps: std({ color: '#f1c40f', roughness: 0.45 }),
    red: std({ color: '#c41f26', roughness: 0.38 }),
    blue: std({ color: '#2462b0', roughness: 0.45 }),
    purple: std({ color: '#6d4e9e', roughness: 0.6 }),
    cylinder: std({ color: '#1d1e20', roughness: 0.45, metalness: 0.3 }),
    matting: std({ color: '#3c3e41', roughness: 1 }),

    /** Paper (charts, labels, couch roll), blue storage bins, amber glass ampoules, charcoal equipment cases, galvanised steel. */
    paper: std({ color: '#f5f3ee', roughness: 0.92 }),
    binBlue: std({ color: '#3d78c2', roughness: 0.45 }),
    amber: std({ color: '#8a4b12', roughness: 0.15, metalness: 0.1 }),
    charcoal: new MeshPhysicalMaterial({ color: '#3a3e44', roughness: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.5 }),
    galvanised: std({ color: '#9da3a7', metalness: 0.7, roughness: 0.5 }),
    alarmBar: lighting.glow(std({ color: '#36d07a', emissive: '#36d07a', emissiveIntensity: 1.2, roughness: 0.3 }), 0.8),
    /** Drawer boxes and carcass insides: white melamine. */
    melamine: std({ color: '#ecebe6', roughness: 0.5 }),
    /** Copper pipe for the medical gas drops, brass for the valves. */
    copper: std({ color: '#b5734a', metalness: 0.9, roughness: 0.34 }),
    brass: std({ color: '#c8a24e', metalness: 0.9, roughness: 0.3 }),
    green: std({ color: '#2e9b4f', roughness: 0.4 }),
    /** Oxygen tubing and masks: soft green-tinted PVC. */
    tubing: new MeshPhysicalMaterial({ color: '#cfe6d6', roughness: 0.25, transmission: 0, clearcoat: 0.5 }),
    mask: new MeshPhysicalMaterial({ color: '#bfe3cc', roughness: 0.15, transparent: true, opacity: 0.55, depthWrite: false, side: DoubleSide }),
    water: new MeshPhysicalMaterial({ color: '#d9eef2', roughness: 0.05, transparent: true, opacity: 0.45, depthWrite: false }),
    /** Gauges and scales. */
    cylinderGauge: flat(256, 256, dial(['0', '50', '100', '150', '200', '250'], 'bar', 0.74, [0.6, 0.9]), 0.2),
    lineGauge: flat(256, 256, dial(['0', '2', '4', '6', '8', '10'], 'bar', 0.42, [0.36, 0.48]), 0.2),
    vacuumGauge: flat(256, 256, dial(['-100', '-80', '-60', '-40', '-20', '0'], 'kPa', 0.36, [0.1, 0.45], true), 0.2),
    flowScale: flat(64, 256, flowScale, 0.2),
    /** Outlet plates and pipeline labels, by gas. */
    plateO2: flat(128, 128, gasPlate('O₂', 'OXYGEN', '#ffffff'), 0.4),
    plateAir: flat(128, 128, gasPlate('AIR', 'MED AIR', '#111111'), 0.4),
    plateVac: flat(128, 128, gasPlate('VAC', 'VACUUM', '#f2c200', '#111111'), 0.4),
    labelO2: flat(256, 32, pipeLabel('OXYGEN', '#ffffff', '#111111'), 0.5),
    labelAir: flat(256, 32, pipeLabel('MEDICAL AIR', 'split', '#c8161d'), 0.5),
    labelVac: flat(256, 32, pipeLabel('VACUUM', '#f2c200', '#111111'), 0.5),
    zvsu: flat(512, 256, zvsuSign, 0.4),
    alarm: lighting.glow(std({ map: tex(256, 192, alarmPanel), emissive: '#ffffff', emissiveMap: tex(256, 192, alarmPanel), emissiveIntensity: 0.35, roughness: 0.4 }), 0.6),
    oxygenSign: flat(512, 160, oxygenSign, 0.4),
    tagFull: flat(64, 96, cylinderTag(true), 0.6),
    tagInUse: flat(64, 96, cylinderTag(false), 0.6),
    /** Screens, lit by day too. */
    monitors: [1, 2, 3, 4, 5, 6].map((s) => screen(512, 384, patientMonitor(3350 + s))),
    board: screen(512, 320, patientBoard, 0.9),
    queue: screen(1024, 576, queueBoard, 0.9),
    kiosk: screen(256, 384, kiosk, 0.85),
    off: std({ color: '#0b0d10', roughness: 0.12, metalness: 0.3 }),
    /** Signs. */
    bays: ['1', '2', '3', '4', '5'].map((n) => flat(128, 128, bayNumber(n), 0.4)),
    resus: flat(512, 128, sign('#c8161d', [['RESUSCITATION', 0.4, '#ffffff']]), 0.4),
    registration: flat(1024, 192, sign('#ffffff', [['EMERGENCY REGISTRATION', 0.3, '#1c3966'], ['Cash · Insurance · Medico-legal cases', 0.15, '#5d6875', 500]], true, '#c8161d'), 0.45),
    triage: flat(512, 128, sign('#1c3966', [['TRIAGE', 0.42, '#ffffff']]), 0.4),
    treatment: flat(1024, 160, sign('#1c3966', [['TREATMENT AREA  ·  BAYS 1–5  ·  RESUS', 0.32, '#ffffff'], ['Patients and staff only', 0.18, '#b9c6d8', 500]]), 0.4),
    hospital: flat(768, 128, sign('#1c3966', [['MAIN HOSPITAL  ·  RADIOLOGY  ·  LAB  →', 0.34, '#ffffff']]), 0.4),
    staff: flat(256, 96, sign('#ffffff', [['STAFF ONLY', 0.36, '#1c3966']]), 0.4),
    station: flat(512, 96, sign('#ffffff', [['NURSES STATION', 0.4, '#1c3966']]), 0.4),
    supply: flat(512, 96, sign('#ffffff', [['CLEAN SUPPLY', 0.4, '#1c3966']]), 0.4),
    exitL: lighting.glow(std({ map: tex(256, 96, exitSign(-1)), emissive: '#ffffff', emissiveMap: tex(256, 96, exitSign(-1)), emissiveIntensity: 1.1, roughness: 0.4 }), 0.8),
    exitR: lighting.glow(std({ map: tex(256, 96, exitSign(1)), emissive: '#ffffff', emissiveMap: tex(256, 96, exitSign(1)), emissiveIntensity: 1.1, roughness: 0.4 }), 0.8),
    poster: flat(256, 360, hygienePoster, 0.6),
    clock: flat(256, 256, clockFace, 0.3),
  }
}

export type EmergencyMaterials = ReturnType<typeof emergencyMaterials>
