import {
  BufferGeometry, CanvasTexture, CircleGeometry, CylinderGeometry, ExtrudeGeometry, Group, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, RepeatWrapping, Shape, ShapeGeometry, SphereGeometry, SRGBColorSpace,
  TorusGeometry, type Material, type Object3D,
} from 'three'
import { rng, type Paint } from '../../../textures'
import type { FloorCtx } from '../shell'
import { button, lathe, play, tube } from './cafe'
import { at, mesh, PI, type Shop } from './kit'

/*
 * The Apple store's devices and finishes, each to the maker's published dimensions: iPhone 16 and
 * 16 Pro (the pill and the square camera plateaus, the Dynamic Island), iPad Pro 11-inch, MacBook
 * Air 13-inch with its keyboard, notch and a lid that opens and closes, iMac 24-inch, Apple Watch
 * Series 10 on its band, AirPods Pro 2 with a lid that opens, AirPods Max, HomePod mini, and the
 * accessories in their boxes. Devices are built lying in their own x–y plane, screen towards +z
 * (bottom edge at −y), so a stand can tilt them; furniture pieces face +z.
 */

const SANS = '"SF Pro Display", "Inter", "Helvetica Neue", Arial, sans-serif'

/* ---------- the logo ---------- */

/** The Apple logo as a path (the bitten apple and its leaf), in a 384 × 512 box. */
export const APPLE_PATH =
  'M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z'

/** Draws the logo filling a box (x, y, w, h), its proportions kept. */
export function drawLogo(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, colour: string) {
  const s = Math.min(w / 384, h / 512)
  g.save()
  g.translate(x + (w - 384 * s) / 2, y + (h - 512 * s) / 2)
  g.scale(s, s)
  g.fillStyle = colour
  g.fill(new Path2D(APPLE_PATH))
  g.restore()
}

/* ---------- screens ---------- */

const rr = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath()
  g.roundRect(x, y, w, h, r)
}

/** An iPhone's or iPad's screen: the lock screen, the home screen, or Apple Intelligence's writing tools. */
const iosScreen = (kind: 'lock' | 'home' | 'ai', tint: [string, string], island: boolean): Paint => (g, w, h) => {
  const bg = g.createLinearGradient(0, 0, w * 0.4, h)
  bg.addColorStop(0, tint[0])
  bg.addColorStop(1, tint[1])
  g.fillStyle = bg
  g.fillRect(0, 0, w, h)
  // Soft shapes in the wallpaper.
  const r = rng(w + h)
  for (let i = 0; i < 6; i++) {
    const gr = g.createRadialGradient(r() * w, r() * h, 0, r() * w, r() * h, w * (0.3 + r() * 0.5))
    gr.addColorStop(0, 'rgba(255,255,255,.22)')
    gr.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = gr
    g.fillRect(0, 0, w, h)
  }
  g.fillStyle = '#ffffff'
  g.textAlign = 'center'
  const u = w / 100
  if (kind === 'lock') {
    g.font = `600 ${u * 6}px ${SANS}`
    g.fillText('Monday 16 November', w / 2, h * 0.14)
    g.font = `700 ${u * 26}px ${SANS}`
    g.fillText('9:41', w / 2, h * 0.27)
    // Notifications and the torch and camera buttons.
    g.fillStyle = 'rgba(255,255,255,.28)'
    rr(g, w * 0.06, h * 0.7, w * 0.88, h * 0.075, u * 4)
    g.fill()
    g.fillStyle = 'rgba(0,0,0,.25)'
    for (const cx of [0.18, 0.82]) {
      g.beginPath()
      g.arc(w * cx, h * 0.92, u * 7, 0, PI * 2)
      g.fill()
    }
  } else if (kind === 'home') {
    g.font = `600 ${u * 5}px ${SANS}`
    g.textAlign = 'left'
    g.fillText('9:41', w * 0.1, h * 0.04)
    const cols = h / w > 1.6 ? 4 : 6
    const cell = w / cols
    const icon = cell * 0.66
    const tones = ['#34c759', '#0a84ff', '#ff9f0a', '#ff375f', '#5e5ce6', '#ffd60a', '#30b0c7', '#ffffff', '#ff453a', '#64d2ff', '#bf5af2', '#8e8e93']
    const rows = Math.floor((h * 0.68) / (cell * 1.1))
    for (let row = 0; row < rows; row++)
      for (let c = 0; c < cols; c++) {
        const x = c * cell + (cell - icon) / 2
        const y = h * 0.08 + row * cell * 1.1
        g.fillStyle = tones[(row * cols + c) % tones.length]
        rr(g, x, y, icon, icon, icon * 0.23)
        g.fill()
        g.fillStyle = 'rgba(255,255,255,.85)'
        g.fillRect(x + icon * 0.15, y + icon * 1.05, icon * 0.7, icon * 0.08)
      }
    // The dock.
    g.fillStyle = 'rgba(255,255,255,.3)'
    rr(g, w * 0.04, h * 0.86, w * 0.92, h * 0.11, u * 7)
    g.fill()
    for (let c = 0; c < 4; c++) {
      g.fillStyle = ['#34c759', '#0a84ff', '#ffffff', '#ff9f0a'][c]
      rr(g, w * (0.09 + c * 0.22), h * 0.875, icon, icon, icon * 0.23)
      g.fill()
    }
  } else {
    // Writing Tools: a note being proofread, the glowing Apple Intelligence edge.
    g.fillStyle = '#f7f7f5'
    g.fillRect(0, 0, w, h)
    const edge = g.createLinearGradient(0, 0, w, h)
    for (const [t, c] of [[0, '#ff9f0a'], [0.3, '#ff375f'], [0.6, '#bf5af2'], [1, '#0a84ff']] as const) edge.addColorStop(t, c)
    g.strokeStyle = edge
    g.lineWidth = u * 2.6
    g.strokeRect(u, u, w - 2 * u, h - 2 * u)
    g.fillStyle = '#1c1c1e'
    g.textAlign = 'left'
    g.font = `700 ${u * 7}px ${SANS}`
    g.fillText('Notes', w * 0.08, h * 0.12)
    g.font = `400 ${u * 4.4}px ${SANS}`
    for (let i = 0; i < 9; i++) {
      g.fillStyle = i === 3 ? '#0a84ff' : '#3a3a3c'
      g.fillRect(w * 0.08, h * (0.18 + i * 0.045), w * (0.84 - (i % 3) * 0.12), u * 1.8)
    }
    g.fillStyle = 'rgba(255,255,255,.95)'
    rr(g, w * 0.06, h * 0.62, w * 0.88, h * 0.3, u * 5)
    g.fill()
    g.fillStyle = '#1c1c1e'
    g.font = `600 ${u * 5}px ${SANS}`
    g.fillText('Writing Tools', w * 0.12, h * 0.67)
    g.font = `400 ${u * 4.2}px ${SANS}`
    ;['Proofread', 'Rewrite', 'Friendly', 'Professional', 'Summary'].forEach((t, i) => g.fillText(t, w * 0.12, h * (0.72 + i * 0.04)))
  }
  if (island) {
    g.fillStyle = '#000000'
    rr(g, w * 0.34, h * 0.018, w * 0.32, h * 0.04, h * 0.02)
    g.fill()
  }
}

/** The Mac's desktop: a wallpaper, the menu bar, a Finder window, the Dock. */
const macScreen = (tint: [string, string], app: 'desktop' | 'photos'): Paint => (g, w, h) => {
  const bg = g.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, tint[0])
  bg.addColorStop(1, tint[1])
  g.fillStyle = bg
  g.fillRect(0, 0, w, h)
  const r = rng(w)
  for (let i = 0; i < 5; i++) {
    const x = r() * w
    const y = r() * h
    const gr = g.createRadialGradient(x, y, 0, x, y, w * 0.5)
    gr.addColorStop(0, 'rgba(255,255,255,.2)')
    gr.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = gr
    g.fillRect(0, 0, w, h)
  }
  g.fillStyle = 'rgba(255,255,255,.55)'
  g.fillRect(0, 0, w, h * 0.035)
  drawLogo(g, w * 0.012, h * 0.006, h * 0.022, h * 0.022, '#111')
  g.fillStyle = '#111'
  g.font = `600 ${h * 0.022}px ${SANS}`
  g.fillText(app === 'photos' ? 'Photos' : 'Finder', w * 0.035, h * 0.026)
  g.textAlign = 'right'
  g.fillText('Mon 16 Nov  9:41', w * 0.985, h * 0.026)
  g.textAlign = 'left'
  // A window.
  const wx = w * 0.18
  const wy = h * 0.14
  const ww = w * 0.64
  const wh = h * 0.6
  g.fillStyle = 'rgba(0,0,0,.25)'
  rr(g, wx + 6, wy + 10, ww, wh, 14)
  g.fill()
  g.fillStyle = '#f5f5f7'
  rr(g, wx, wy, ww, wh, 12)
  g.fill()
  for (const [i, c] of ['#ff5f57', '#febc2e', '#28c840'].entries()) {
    g.fillStyle = c
    g.beginPath()
    g.arc(wx + 18 + i * 18, wy + 18, 6, 0, PI * 2)
    g.fill()
  }
  if (app === 'photos') {
    const tones = ['#e8a87c', '#85dcb0', '#41b3a3', '#c38d9e', '#e27d60', '#5d5c61', '#7395ae', '#b1a296']
    for (let i = 0; i < 12; i++) {
      g.fillStyle = tones[i % tones.length]
      g.fillRect(wx + 20 + (i % 4) * (ww - 40) / 4, wy + 44 + Math.floor(i / 4) * (wh - 60) / 3, (ww - 40) / 4 - 6, (wh - 60) / 3 - 6)
    }
  } else {
    g.fillStyle = '#e8e8ed'
    g.fillRect(wx, wy + 36, ww * 0.22, wh - 36)
    for (let i = 0; i < 8; i++) {
      g.fillStyle = '#4a90e2'
      rr(g, wx + ww * 0.28 + (i % 4) * ww * 0.17, wy + 60 + Math.floor(i / 4) * 90, 56, 44, 6)
      g.fill()
    }
  }
  // The Dock.
  g.fillStyle = 'rgba(255,255,255,.35)'
  rr(g, w * 0.22, h * 0.9, w * 0.56, h * 0.08, 16)
  g.fill()
  const tones = ['#1e90ff', '#34c759', '#ff9f0a', '#ff375f', '#5e5ce6', '#ffffff', '#30b0c7', '#ffd60a', '#8e8e93']
  for (let i = 0; i < 9; i++) {
    g.fillStyle = tones[i]
    rr(g, w * (0.235 + i * 0.06), h * 0.91, h * 0.06, h * 0.06, h * 0.014)
    g.fill()
  }
}

/** A Watch face: the time, the date, rings and complications on black. */
const watchFace = (accent: string): Paint => (g, w, h) => {
  g.fillStyle = '#000'
  g.fillRect(0, 0, w, h)
  g.fillStyle = accent
  g.textAlign = 'center'
  g.font = `600 ${w * 0.32}px ${SANS}`
  g.fillText('10:09', w / 2, h * 0.5)
  g.fillStyle = '#ffffff'
  g.font = `500 ${w * 0.1}px ${SANS}`
  g.fillText('MON 16', w / 2, h * 0.22)
  for (const [i, c] of ['#fa114f', '#92e82a', '#1eeaef'].entries()) {
    g.strokeStyle = c
    g.lineWidth = w * 0.04
    g.beginPath()
    g.arc(w * 0.28, h * 0.76, w * (0.16 - i * 0.05), -PI / 2, PI * (0.4 + i * 0.4))
    g.stroke()
  }
  g.fillStyle = '#ffd60a'
  g.font = `600 ${w * 0.11}px ${SANS}`
  g.fillText('24°', w * 0.72, h * 0.8)
}

/** The wall screen's films: the reference's "iPhone 16 · Built for Apple Intelligence", and two more. */
const wallAd = (kind: 0 | 1 | 2): Paint => (g, w, h) => {
  if (kind === 0) {
    const bg = g.createLinearGradient(0, 0, w, h)
    bg.addColorStop(0, '#dbe9fb')
    bg.addColorStop(1, '#a9c9f5')
    g.fillStyle = bg
    g.fillRect(0, 0, w, h)
    // Three iPhone 16s from the back: white, ultramarine, teal.
    const phone = (cx: number, cy: number, s: number, body: string, tilt: number) => {
      g.save()
      g.translate(cx, cy)
      g.rotate(tilt)
      g.fillStyle = 'rgba(0,0,0,.12)'
      rr(g, -s * 0.48 + 8, -s + 12, s * 0.96, s * 2, s * 0.15)
      g.fill()
      g.fillStyle = body
      rr(g, -s * 0.48, -s, s * 0.96, s * 2, s * 0.15)
      g.fill()
      // The camera plateau: a pill with two lenses.
      g.fillStyle = 'rgba(255,255,255,.35)'
      rr(g, -s * 0.36, -s * 0.9, s * 0.24, s * 0.5, s * 0.12)
      g.fill()
      for (const dy of [-0.78, -0.53]) {
        g.fillStyle = '#1b1d24'
        g.beginPath()
        g.arc(-s * 0.24, s * dy, s * 0.085, 0, PI * 2)
        g.fill()
        g.fillStyle = '#3a4a6a'
        g.beginPath()
        g.arc(-s * 0.24, s * dy, s * 0.04, 0, PI * 2)
        g.fill()
      }
      drawLogo(g, -s * 0.12, -s * 0.15, s * 0.24, s * 0.3, 'rgba(255,255,255,.55)')
      g.restore()
    }
    phone(w * 0.24, h * 0.62, h * 0.42, '#f3f3f1', -0.08)
    phone(w * 0.38, h * 0.6, h * 0.44, '#4c63d8', 0)
    phone(w * 0.52, h * 0.62, h * 0.42, '#88c1c2', 0.08)
    g.fillStyle = '#1d1d1f'
    g.textAlign = 'center'
    drawLogo(g, w * 0.665, h * 0.17, h * 0.07, h * 0.08, '#1d1d1f')
    g.font = `600 ${h * 0.075}px ${SANS}`
    g.fillText('iPhone 16', w * 0.76, h * 0.235)
    g.font = `600 ${h * 0.1}px ${SANS}`
    g.fillText('Built for', w * 0.78, h * 0.4)
    const ai = g.createLinearGradient(w * 0.64, 0, w * 0.92, 0)
    for (const [t, c] of [[0, '#ff9f0a'], [0.35, '#ff375f'], [0.7, '#bf5af2'], [1, '#0a84ff']] as const) ai.addColorStop(t, c)
    g.fillStyle = ai
    g.fillText('Apple Intelligence', w * 0.78, h * 0.52)
  } else if (kind === 1) {
    g.fillStyle = '#000'
    g.fillRect(0, 0, w, h)
    const ring = g.createRadialGradient(w * 0.3, h * 0.5, h * 0.1, w * 0.3, h * 0.5, h * 0.45)
    ring.addColorStop(0, '#2a2a2e')
    ring.addColorStop(1, '#000')
    g.fillStyle = ring
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#c9b29a'
    rr(g, w * 0.2, h * 0.12, h * 0.6, h * 0.76, h * 0.12)
    g.fill()
    g.fillStyle = '#2b2a28'
    rr(g, w * 0.2 + h * 0.08, h * 0.2, h * 0.3, h * 0.3, h * 0.07)
    g.fill()
    for (const [dx, dy] of [[0.08, 0.08], [0.2, 0.08], [0.14, 0.2]]) {
      g.fillStyle = '#0f0f12'
      g.beginPath()
      g.arc(w * 0.2 + h * (0.08 + dx), h * (0.2 + dy), h * 0.055, 0, PI * 2)
      g.fill()
    }
    g.fillStyle = '#ffffff'
    g.textAlign = 'left'
    g.font = `600 ${h * 0.12}px ${SANS}`
    g.fillText('iPhone 16 Pro', w * 0.55, h * 0.45)
    g.fillStyle = '#c9b29a'
    g.font = `500 ${h * 0.065}px ${SANS}`
    g.fillText('Hello, Apple Intelligence.', w * 0.55, h * 0.58)
  } else {
    const bg = g.createLinearGradient(0, 0, w, 0)
    bg.addColorStop(0, '#f5f5f7')
    bg.addColorStop(1, '#e8e8ed')
    g.fillStyle = bg
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#1d1d1f'
    g.textAlign = 'center'
    g.font = `600 ${h * 0.11}px ${SANS}`
    g.fillText('MacBook Air', w * 0.3, h * 0.36)
    g.font = `400 ${h * 0.06}px ${SANS}`
    g.fillText('Lean. Mean. M3 machine.', w * 0.3, h * 0.48)
    // A MacBook Air, open, in sky blue.
    g.fillStyle = '#9fb5c9'
    g.beginPath()
    g.moveTo(w * 0.52, h * 0.82)
    g.lineTo(w * 0.94, h * 0.82)
    g.lineTo(w * 0.9, h * 0.86)
    g.lineTo(w * 0.56, h * 0.86)
    g.fill()
    g.fillStyle = '#1d1d1f'
    rr(g, w * 0.56, h * 0.2, w * 0.34, h * 0.62, 10)
    g.fill()
    const sc = g.createLinearGradient(w * 0.57, 0, w * 0.89, h)
    sc.addColorStop(0, '#6aa5e8')
    sc.addColorStop(1, '#2a3f8f')
    g.fillStyle = sc
    g.fillRect(w * 0.57, h * 0.23, w * 0.32, h * 0.56)
  }
}

/** A box's print: the product drawn white on white, its name. */
const boxArt = (name: string, kind: 'case' | 'cable' | 'adapter' | 'magsafe' | 'airtag' | 'pencil', tint: string): Paint => (g, w, h) => {
  g.fillStyle = '#fbfbfb'
  g.fillRect(0, 0, w, h)
  g.fillStyle = tint
  const cx = w / 2
  const cy = h * 0.45
  if (kind === 'case') {
    rr(g, cx - w * 0.2, cy - h * 0.3, w * 0.4, h * 0.6, w * 0.08)
    g.fill()
    g.fillStyle = 'rgba(0,0,0,.18)'
    rr(g, cx - w * 0.16, cy - h * 0.26, w * 0.15, h * 0.16, w * 0.04)
    g.fill()
  } else if (kind === 'cable') {
    g.strokeStyle = tint
    g.lineWidth = w * 0.025
    for (let i = 0; i < 4; i++) {
      g.beginPath()
      g.ellipse(cx, cy, w * (0.12 + i * 0.05), h * (0.08 + i * 0.035), 0, 0, PI * 2)
      g.stroke()
    }
  } else if (kind === 'adapter') {
    rr(g, cx - w * 0.16, cy - w * 0.16, w * 0.32, w * 0.32, w * 0.05)
    g.fill()
  } else if (kind === 'magsafe') {
    g.beginPath()
    g.arc(cx, cy, w * 0.2, 0, PI * 2)
    g.fill()
  } else if (kind === 'airtag') {
    g.beginPath()
    g.arc(cx, cy, w * 0.18, 0, PI * 2)
    g.fill()
    drawLogo(g, cx - w * 0.05, cy - w * 0.06, w * 0.1, w * 0.12, '#bbb')
  } else {
    g.save()
    g.translate(cx, cy)
    g.rotate(-0.6)
    rr(g, -w * 0.03, -h * 0.35, w * 0.06, h * 0.7, w * 0.03)
    g.fill()
    g.restore()
  }
  g.fillStyle = '#1d1d1f'
  g.textAlign = 'center'
  g.font = `600 ${Math.round(w * 0.075)}px ${SANS}`
  g.fillText(name, w / 2, h * 0.88)
  drawLogo(g, w * 0.44, h * 0.03, w * 0.12, h * 0.08, '#c8c8cc')
}

/** Floor tiles: dark grey porcelain, 600 × 1200 mm, a faint cloud, fine joints. */
const tiles: Paint = (g, w, h) => {
  const r = rng(808)
  g.fillStyle = '#5b5c5e'
  g.fillRect(0, 0, w, h)
  for (let row = 0; row < 2; row++)
    for (let c = 0; c < 2; c++) {
      const t = 88 + Math.floor(r() * 10)
      g.fillStyle = `rgb(${t},${t + 1},${t + 3})`
      g.fillRect(c * (w / 2) + 1, row * (h / 2) + 1, w / 2 - 2, h / 2 - 2)
    }
  for (let i = 0; i < 160; i++) {
    const x = r() * w
    const y = r() * h
    const s = w * (0.05 + r() * 0.15)
    const gr = g.createRadialGradient(x, y, 0, x, y, s)
    gr.addColorStop(0, r() < 0.5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.05)')
    gr.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = gr
    g.fillRect(x - s, y - s, s * 2, s * 2)
  }
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.05)'
    g.fillRect(r() * w, r() * h, 1.2, 1.2)
  }
  g.fillStyle = 'rgba(30,30,32,.9)'
  g.fillRect(0, 0, w, 2)
  g.fillRect(0, h / 2, w, 2)
  g.fillRect(0, 0, 2, h)
  g.fillRect(w / 2, 0, 2, h)
}

/** The MacBook's keyboard: black keys with their legends in the well, the function row. */
const keyboard: Paint = (g, w, h) => {
  g.fillStyle = '#2a2b2e'
  g.fillRect(0, 0, w, h)
  const rows = [14, 14, 14, 13, 12, 10]
  const kh = h / 6.3
  rows.forEach((n, row) => {
    const kw = w / 14.6
    const y = row * (h / 6) + (row === 0 ? 0 : 2)
    const height = row === 0 ? kh * 0.6 : kh
    let x = (w - n * kw) / 2
    for (let i = 0; i < n; i++) {
      const wide = row === 5 && i === Math.floor(n / 2) ? kw * 5 : kw
      if (row === 5 && i > Math.floor(n / 2) && i < Math.floor(n / 2) + 4) continue
      g.fillStyle = '#0d0d0f'
      rr(g, x + 2, y + 2, wide - 4, height - 4, 4)
      g.fill()
      g.fillStyle = 'rgba(255,255,255,.55)'
      g.fillRect(x + wide * 0.35, y + height * 0.42, Math.min(wide, kw) * 0.25, 2)
      x += wide
    }
  })
}

/* ---------- materials ---------- */

export function appleMaterials(e: FloorCtx) {
  const { k, m, lux } = e
  const env = m.env
  const mark = <T extends Material>(x: T) => ((x.userData.interior = true), x)
  const std = (p: ConstructorParameters<typeof MeshStandardMaterial>[0], reflect = 0.6) => mark(new MeshStandardMaterial({ envMap: env, envMapIntensity: reflect, ...p }))
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
  const glow = (t: CanvasTexture, strength = 0.9, gloss = true) =>
    mark(new MeshPhysicalMaterial({ map: t, emissiveMap: t, emissive: '#ffffff', emissiveIntensity: strength, roughness: gloss ? 0.06 : 0.45, clearcoat: gloss ? 1 : 0, clearcoatRoughness: 0.03, envMap: env, envMapIntensity: gloss ? 0.35 : 0.05 }))
  const cache = new Map<string, Material>()
  const once = <T extends Material>(key: string, make: () => T) => {
    let v = cache.get(key) as T | undefined
    if (!v) {
      v = make()
      cache.set(key, v)
    }
    return v
  }
  const tileTex = k.tex.painted(1024, 1024, tiles)
  tileTex.wrapS = tileTex.wrapT = RepeatWrapping
  tileTex.repeat.set(1 / 1.2, 1 / 2.4)
  return {
    floor: std({ map: tileTex, roughness: 0.42 }, 0.35),
    wall: std({ color: '#f4f4f2', roughness: 0.9 }, 0.04),
    corian: std({ color: '#f6f6f4', roughness: 0.32 }, 0.35),
    ceiling: std({ color: '#f7f7f5', roughness: 0.95 }, 0.02),
    shadowGap: std({ color: '#1a1a1b', roughness: 0.8 }, 0.05),
    greyBack: std({ color: '#cfd0d2', roughness: 0.8 }, 0.08),
    aluminium: std({ color: '#d6d7d9', metalness: 1, roughness: 0.28 }, 1.0),
    darkAlu: std({ color: '#34353a', metalness: 0.9, roughness: 0.3 }, 0.9),
    steel: lux.steel,
    glassBlack: std({ color: '#050506', roughness: 0.05, metalness: 0.2 }, 1.1),
    lensGlass: std({ color: '#0d1018', roughness: 0.02, metalness: 0.4 }, 1.4),
    lensRing: std({ color: '#cfd2d6', metalness: 1, roughness: 0.12 }, 1.2),
    whitePlastic: std({ color: '#f8f8f6', roughness: 0.18 }, 0.6),
    whiteMatte: std({ color: '#f1f1ef', roughness: 0.6 }, 0.2),
    mesh: std({ color: '#d9d9d6', roughness: 0.85 }, 0.05),
    meshDark: std({ color: '#3a3a3c', roughness: 0.85 }, 0.05),
    rubber: std({ color: '#1c1c1e', roughness: 0.7 }, 0.1),
    cable: std({ color: '#f2f2f0', roughness: 0.5 }, 0.2),
    led: lux.led,
    /** A device's coloured glass or aluminium, made once per colour. */
    body: (c: string, rough = 0.3, metal = 0.6) => once(`b${c}|${rough}|${metal}`, () => std({ color: c, roughness: rough, metalness: metal }, 0.9)),
    matteGlass: (c: string) => once(`g${c}`, () => std({ color: c, roughness: 0.42, metalness: 0.05 }, 0.7)),
    fabric: (c: string) => once(`f${c}`, () => std({ color: c, roughness: 0.95 }, 0.03)),
    sport: (c: string) => once(`s${c}`, () => std({ color: c, roughness: 0.55 }, 0.15)),
    /** Screens: painted once per kind and lit, behind glass. */
    ios: (kind: 'lock' | 'home' | 'ai', tint: [string, string], island: boolean, tall: boolean) =>
      once(`ios${kind}${tint}${island}${tall}`, () => glow(canvas(tall ? 300 : 420, tall ? 652 : 588, iosScreen(kind, tint, island)))),
    mac: (tint: [string, string], app: 'desktop' | 'photos') => once(`mac${tint}${app}`, () => glow(canvas(768, 496, macScreen(tint, app)))),
    watch: (accent: string) => once(`w${accent}`, () => glow(canvas(160, 196, watchFace(accent)))),
    film: (kind: 0 | 1 | 2) => once(`wall${kind}`, () => glow(canvas(2048, 768, wallAd(kind)), 0.75, false)),
    keys: once('keys', () => std({ map: canvas(1024, 440, keyboard), roughness: 0.6 }, 0.1)),
    box: (name: string, kind: Parameters<typeof boxArt>[1], tint: string) => once(`box${name}`, () => std({ map: canvas(256, 320, boxArt(name, kind, tint)), roughness: 0.55 }, 0.12)),
    logo: (colour: string, lit: number) =>
      once(`logo${colour}${lit}`, () => {
        const t = canvas(384, 512, (g, w, h) => {
          g.clearRect(0, 0, w, h)
          drawLogo(g, 0, 0, w, h, '#ffffff')
        })
        return mark(new MeshStandardMaterial({ map: t, color: colour, emissiveMap: t, emissive: colour, emissiveIntensity: lit, alphaTest: 0.5, roughness: 0.3, metalness: lit ? 0 : 0.8, envMap: env, envMapIntensity: 0.8 }))
      }),
    canvas,
  }
}

export type AppleMaterials = ReturnType<typeof appleMaterials>

/* ---------- geometry ---------- */

const slabs = new Map<string, BufferGeometry>()
/** A slab with rounded corners in plan (w × h in x–y, r the corner), `t` thick in z, its edges eased by `e`; centred. */
export function slab(w: number, h: number, t: number, r: number, e: number) {
  const key = `${w}|${h}|${t}|${r}|${e}`
  let g = slabs.get(key)
  if (!g) {
    const s = new Shape()
    const x = -w / 2 + e
    const y = -h / 2 + e
    const W = w - 2 * e
    const H = h - 2 * e
    const rad = Math.max(0.0005, r - e)
    s.moveTo(x + rad, y)
    s.lineTo(x + W - rad, y)
    s.quadraticCurveTo(x + W, y, x + W, y + rad)
    s.lineTo(x + W, y + H - rad)
    s.quadraticCurveTo(x + W, y + H, x + W - rad, y + H)
    s.lineTo(x + rad, y + H)
    s.quadraticCurveTo(x, y + H, x, y + H - rad)
    s.lineTo(x, y + rad)
    s.quadraticCurveTo(x, y, x + rad, y)
    g = new ExtrudeGeometry(s, { depth: Math.max(0.0002, t - 2 * e), bevelEnabled: e > 0, bevelThickness: e, bevelSize: e, bevelSegments: 3, curveSegments: 10 })
    g.translate(0, 0, -(t - 2 * e) / 2)
    slabs.set(key, g)
  }
  return g
}

const faces = new Map<string, BufferGeometry>()
/** A flat rounded rectangle (a screen), UVs across it 0 … 1. */
export function face(w: number, h: number, r: number) {
  const key = `${w}|${h}|${r}`
  let g = faces.get(key)
  if (!g) {
    const s = new Shape()
    s.moveTo(-w / 2 + r, -h / 2)
    s.lineTo(w / 2 - r, -h / 2)
    s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r)
    s.lineTo(w / 2, h / 2 - r)
    s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2)
    s.lineTo(-w / 2 + r, h / 2)
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r)
    s.lineTo(-w / 2, -h / 2 + r)
    s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2)
    g = new ShapeGeometry(s, 8)
    const pos = g.attributes.position
    const uv = g.attributes.uv
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5)
    faces.set(key, g)
  }
  return g
}

/** A lens: the black glass in a metal ring, standing proud of a plateau (facing local −z, the back). */
function lens(p: Object3D, a: AppleMaterials, x: number, y: number, z: number, r: number) {
  const ring = mesh(p, new CylinderGeometry(r, r, 0.0016, 28), a.lensRing, x, y, z - 0.0008, false)
  ring.rotation.x = PI / 2
  const gl = mesh(p, new CylinderGeometry(r * 0.78, r * 0.78, 0.0018, 28), a.lensGlass, x, y, z - 0.0011, false)
  gl.rotation.x = PI / 2
}

/* ---------- iPhone ---------- */

export interface Phone {
  g: Group
  screen: Mesh
}

/**
 * An iPhone 16 (`pro` false) or 16 Pro: the aluminium or titanium band, the coloured glass back
 * with its camera plateau (a vertical pill of two lenses; a square of three, the flash and LiDAR),
 * the buttons (volume, side, Action, Camera Control), the USB-C port, the front glass with its
 * screen and the Dynamic Island. Screen towards +z, centred at the origin.
 */
export function iphone(a: AppleMaterials, p: Object3D, pro: boolean, colour: string, screen: Material) {
  const g = new Group()
  p.add(g)
  const W = pro ? 0.0715 : 0.0716
  const H = pro ? 0.1496 : 0.1476
  const T = pro ? 0.0083 : 0.0078
  const R = 0.0105
  const band = pro ? a.body(colour, 0.38, 0.85) : a.body(colour, 0.25, 0.75)
  mesh(g, slab(W, H, T, R, 0.0012), band, 0, 0, 0)
  // The back, in matte or colour-infused glass.
  const back = mesh(g, face(W - 0.0016, H - 0.0016, R - 0.0008), pro ? a.matteGlass(colour) : a.matteGlass(colour), 0, 0, -T / 2 - 0.0001, false)
  back.rotation.y = PI
  const cam = new Group()
  cam.position.set(-W / 2 + (pro ? 0.021 : 0.0145), H / 2 - (pro ? 0.021 : 0.024), -T / 2 - 0.0002)
  g.add(cam)
  if (pro) {
    mesh(cam, slab(0.036, 0.0365, 0.0016, 0.0085, 0.0005), a.matteGlass(colour), 0, 0, -0.0008)
    for (const [x, y] of [[-0.0085, 0.0085], [-0.0085, -0.0085], [0.0085, 0]] as const) lens(cam, a, x, y, -0.0016, 0.0068)
    const flash = mesh(cam, new CircleGeometry(0.0022, 16), a.whiteMatte, 0.0095, 0.0115, -0.0017, false)
    flash.rotation.y = PI
    const lidar = mesh(cam, new CircleGeometry(0.0018, 16), a.glassBlack, 0.0095, -0.0115, -0.0017, false)
    lidar.rotation.y = PI
  } else {
    mesh(cam, slab(0.0175, 0.033, 0.0012, 0.0087, 0.0004), a.matteGlass(colour), 0, 0, -0.0006)
    for (const y of [0.0075, -0.0075]) lens(cam, a, 0, y, -0.0012, 0.0062)
    const flash = mesh(cam, new CircleGeometry(0.0019, 16), a.whiteMatte, 0.0125, 0.0075, -0.0004, false)
    flash.rotation.y = PI
  }
  const logo = mesh(g, face(0.009, 0.011, 0.0001), a.logo('#e8e8ea', 0), 0, -0.002, -T / 2 - 0.00025, false)
  logo.rotation.y = PI
  // Front glass: black to the edge, the screen inside its thin border.
  mesh(g, face(W - 0.0012, H - 0.0012, R - 0.0006), a.glassBlack, 0, 0, T / 2 + 0.0001, false)
  const scr = mesh(g, face(W - 0.0042, H - 0.0042, R - 0.002), screen, 0, 0, T / 2 + 0.0002, false)
  scr.userData.front = true
  // Buttons: volume up and down, Action on the left; side and Camera Control on the right.
  const btn = (x: number, y: number, len: number) => mesh(g, slab(0.0012, len, 0.0026, 0.0005, 0.0002), band, x, y, 0)
  btn(-W / 2 - 0.0005, H / 2 - 0.036, 0.007)
  btn(-W / 2 - 0.0005, H / 2 - 0.05, 0.011)
  btn(-W / 2 - 0.0005, H / 2 - 0.064, 0.011)
  btn(W / 2 + 0.0005, H / 2 - 0.05, 0.016)
  mesh(g, slab(0.0008, 0.019, 0.0024, 0.0004, 0.0002), a.glassBlack, W / 2 + 0.0004, -H / 2 + 0.05, 0)
  // USB-C and the speaker grilles in the bottom edge.
  mesh(g, slab(0.0086, 0.0012, 0.0028, 0.0006, 0.0002), a.glassBlack, 0, -H / 2 - 0.0002, 0)
  for (let i = 0; i < 6; i++) for (const sx of [-1, 1]) mesh(g, new CylinderGeometry(0.0005, 0.0005, 0.0012, 6), a.glassBlack, sx * (0.0085 + i * 0.0018), -H / 2 - 0.0001, 0, false)
  return { g, screen: scr }
}

/* ---------- iPad Pro ---------- */

/** An iPad Pro 11-inch (M4): an aluminium slab 5.3 mm thin, the camera module, the screen with its even bezel. */
export function ipad(a: AppleMaterials, p: Object3D, colour: string, screen: Material) {
  const g = new Group()
  p.add(g)
  const W = 0.1775
  const H = 0.2497
  const T = 0.0053
  const alu = a.body(colour, 0.32, 0.9)
  mesh(g, slab(W, H, T, 0.0125, 0.0012), alu, 0, 0, 0)
  mesh(g, face(W - 0.001, H - 0.001, 0.012), a.glassBlack, 0, 0, T / 2 + 0.0001, false)
  const scr = mesh(g, face(W - 0.0135, H - 0.0135, 0.008), screen, 0, 0, T / 2 + 0.0002, false)
  scr.userData.front = true
  const cam = new Group()
  cam.position.set(-W / 2 + 0.017, H / 2 - 0.017, -T / 2)
  g.add(cam)
  mesh(cam, slab(0.022, 0.022, 0.0014, 0.0055, 0.0004), a.body(colour, 0.25, 0.9), 0, 0, -0.0007)
  lens(cam, a, -0.004, 0.004, -0.0014, 0.0038)
  const lidar = mesh(cam, new CircleGeometry(0.0022, 16), a.glassBlack, 0.0045, -0.0045, -0.0015, false)
  lidar.rotation.y = PI
  const logo = mesh(g, face(0.02, 0.025, 0.0001), a.logo('#bcbdc0', 0), 0, 0, -T / 2 - 0.0002, false)
  logo.rotation.y = PI
  // Top button, volume keys, the magnetic connector on the long edge.
  mesh(g, slab(0.016, 0.0012, 0.0022, 0.0005, 0.0002), alu, W / 2 - 0.03, H / 2 + 0.0004, 0)
  for (const y of [0.06, 0.082]) mesh(g, slab(0.0012, 0.015, 0.0022, 0.0005, 0.0002), alu, W / 2 + 0.0004, H / 2 - y, 0)
  mesh(g, slab(0.0078, 0.0012, 0.0024, 0.0005, 0.0002), a.glassBlack, 0, -H / 2 - 0.0002, 0)
  return { g, screen: scr }
}

/* ---------- MacBook Air ---------- */

/**
 * A MacBook Air 13-inch (M3) in a finish: the base with its keyboard in the well, the Force Touch
 * trackpad and the speaker slots; the lid on its hinge (a door_ about x, opening to 110°) with
 * the 13.6-inch Liquid Retina display and its notch, the logo on its back. Facing +z; its base on
 * local y = 0. Built open; a tap closes it.
 */
export function macbook(s: Shop, a: AppleMaterials, p: Object3D, name: string, x: number, y: number, z: number, yaw: number, colour: string, screen: Material) {
  const g = at(p, x, y, z, yaw)
  const W = 0.3041
  const D = 0.215
  const T = 0.0063
  const alu = a.body(colour, 0.33, 0.9)
  const base = mesh(g, slab(W, D, T, 0.012, 0.0015), alu, 0, T / 2, 0)
  base.rotation.x = -PI / 2
  // The keyboard well, the trackpad, the feet.
  const kb = mesh(g, face(0.27, 0.1, 0.004), a.keys, 0, T + 0.0002, -0.035, false)
  kb.rotation.x = -PI / 2
  const tp = mesh(g, face(0.122, 0.075, 0.005), a.body(colour, 0.22, 0.85), 0, T + 0.0003, 0.058, false)
  tp.rotation.x = -PI / 2
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) mesh(g, new CylinderGeometry(0.004, 0.004, 0.0008, 12), a.rubber, sx * (W / 2 - 0.02), -0.0004, sz * (D / 2 - 0.02), false)
  // The lid: hinged along the back of the base.
  const lid = new Group()
  lid.name = `door_apple_mac_${name}`
  lid.userData.label = 'MacBook lid'
  lid.userData.axis = 'x'
  lid.userData.openAngle = -1.92
  lid.userData.closedY = 0
  lid.userData.open = true
  lid.position.set(0, T, -D / 2 + 0.004)
  g.add(lid)
  const panel = mesh(lid, slab(W, D - 0.004, 0.0049, 0.012, 0.0012), alu, 0, 0.0025, (D - 0.004) / 2)
  panel.rotation.x = -PI / 2
  panel.userData.front = true
  // The display, face down when shut: its black border, the screen, the notch.
  const glass = mesh(lid, face(W - 0.004, D - 0.008, 0.01), a.glassBlack, 0, -0.0001, (D - 0.004) / 2, false)
  glass.rotation.x = PI / 2
  const scr = mesh(lid, face(0.287, 0.186, 0.004), screen, 0, -0.0002, (D - 0.004) / 2 + 0.002, false)
  scr.rotation.x = PI / 2
  const notch = mesh(lid, face(0.032, 0.0062, 0.0015), a.glassBlack, 0, -0.0003, (D - 0.004) - 0.0095, false)
  notch.rotation.x = PI / 2
  const logo = mesh(lid, face(0.022, 0.027, 0.0001), a.logo('#e6e6e8', 0), 0, 0.0051, (D - 0.004) / 2 + 0.005, false)
  logo.rotation.x = -PI / 2
  logo.rotation.z = PI
  lid.rotation.x = lid.userData.openAngle as number
  s.e.shade.rect(x, y + 0.001, z, W * 0.8, D * 0.8, yaw, 0.08)
  return g
}

/* ---------- iMac ---------- */

/** An iMac 24-inch (M4): an 11.5 mm thin display in a colour, its white bezel, the coloured chin and the bent stand. Facing +z, standing on local y = 0. */
export function imac(a: AppleMaterials, p: Object3D, x: number, y: number, z: number, yaw: number, colour: string, front: string, screen: Material) {
  const g = at(p, x, y, z, yaw)
  const W = 0.547
  const H = 0.461
  const T = 0.0115
  const body = a.body(colour, 0.3, 0.85)
  const panel = mesh(g, slab(W, H, T, 0.012, 0.002), body, 0, 0.14 + H / 2, 0)
  void panel
  // The front: the pale chin in a lighter shade of the colour, the white bezel, the screen.
  mesh(g, face(W - 0.004, 0.09, 0.0001), a.body(front, 0.3, 0.7), 0, 0.14 + 0.045, T / 2 + 0.0002, false)
  mesh(g, face(W - 0.004, H - 0.092, 0.01), a.whitePlastic, 0, 0.14 + 0.09 + (H - 0.092) / 2, T / 2 + 0.0002, false)
  const scr = mesh(g, face(0.522, 0.297, 0.002), screen, 0, 0.14 + 0.09 + 0.012 + 0.297 / 2 + 0.014, T / 2 + 0.0004, false)
  scr.userData.front = true
  // The stand: a blade bent back on itself.
  mesh(g, slab(0.145, 0.15, 0.012, 0.008, 0.002), body, 0, 0.12, -0.045).rotation.x = 0.28
  const foot = mesh(g, slab(0.145, 0.15, 0.012, 0.012, 0.002), body, 0, 0.006, -0.08)
  foot.rotation.x = -PI / 2
  return { g, screen: scr }
}

/* ---------- Apple Watch ---------- */

/**
 * An Apple Watch Series 10 (46 mm) on its band, laid over a display pillow as the stores show
 * them: the case and its Retina display, the Digital Crown and side button, the band looping round
 * the pillow. Facing +z (the face up and towards the viewer); `band` swaps for another colour.
 */
export function watch(a: AppleMaterials, p: Object3D, x: number, y: number, z: number, yaw: number, caseColour: string, bandColour: string, face2: Material) {
  const g = at(p, x, y, z, yaw)
  // The pillow: a soft white cylinder lying across.
  const pillow = mesh(g, new CylinderGeometry(0.03, 0.03, 0.05, 32), a.whiteMatte, 0, 0.032, 0)
  pillow.rotation.z = PI / 2
  mesh(g, slab(0.07, 0.07, 0.006, 0.012, 0.002), a.whiteMatte, 0, 0.003, 0).rotation.x = -PI / 2
  // The band: round the pillow, out to the face.
  const bandG = new Group()
  g.add(bandG)
  const strap = mesh(bandG, new TorusGeometry(0.034, 0.0022, 6, 40), a.sport(bandColour), 0, 0.034, 0)
  strap.rotation.y = PI / 2
  strap.scale.set(1, 1, 5.2)
  // The case, on top of the loop, tipped towards the viewer.
  const c = new Group()
  c.position.set(0, 0.07, 0.006)
  c.rotation.x = -PI / 2 + 0.45
  g.add(c)
  const W = 0.0393
  const H = 0.046
  mesh(c, slab(W, H, 0.0097, 0.0105, 0.0022), a.body(caseColour, 0.22, 0.9), 0, 0, 0)
  mesh(c, face(W - 0.0016, H - 0.0016, 0.0098), a.glassBlack, 0, 0, 0.0049, false)
  const scr = mesh(c, face(W - 0.004, H - 0.004, 0.0085), face2, 0, 0, 0.005, false)
  scr.userData.front = true
  const crown = mesh(c, new CylinderGeometry(0.0034, 0.0034, 0.004, 20), a.body(caseColour, 0.2, 0.95), W / 2 + 0.0018, 0.006, -0.0005)
  crown.rotation.z = PI / 2
  mesh(c, slab(0.0012, 0.011, 0.0035, 0.0005, 0.0002), a.body(caseColour, 0.2, 0.95), W / 2 + 0.0004, -0.009, -0.0005)
  return { g, strap }
}

/* ---------- AirPods ---------- */

/** AirPods Pro 2 in their case: the white case, its lid (a door_ about x) and the two earbuds sitting inside. Facing +z, on local y = 0. */
export function airpodsPro(s: Shop, a: AppleMaterials, p: Object3D, name: string, x: number, y: number, z: number, yaw: number) {
  const g = at(p, x, y, z, yaw)
  const W = 0.0606
  const H = 0.0452
  const D = 0.0217
  const split = 0.03
  mesh(g, slab(W, split, D, 0.006, 0.003), a.whitePlastic, 0, split / 2, 0)
  // The status light, the speaker holes, the lanyard loop.
  mesh(g, new CircleGeometry(0.0009, 10), a.led, 0, split * 0.62, D / 2 + 0.0001, false)
  for (let i = 0; i < 4; i++) mesh(g, new CircleGeometry(0.0005, 6), a.glassBlack, -0.006 + i * 0.004, 0.004, D / 2 + 0.0001, false)
  mesh(g, new TorusGeometry(0.0022, 0.0008, 6, 12), a.steel, W / 2 + 0.001, 0.008, 0).rotation.y = PI / 2
  // The earbuds, heads up in their wells.
  for (const sx of [-1, 1]) {
    const bud = mesh(g, new SphereGeometry(0.0085, 16, 12), a.whitePlastic, sx * 0.013, split + 0.002, 0)
    bud.scale.set(1, 0.8, 1.05)
    mesh(g, new CircleGeometry(0.0045, 16), a.rubber, sx * 0.013, split + 0.0085, 0, false).rotation.x = -PI / 2
  }
  const lid = new Group()
  lid.name = `door_apple_airpods_${name}`
  lid.userData.label = 'AirPods case lid'
  lid.userData.axis = 'x'
  lid.userData.openAngle = -1.75
  lid.position.set(0, split, -D / 2 + 0.002)
  g.add(lid)
  const top = mesh(lid, slab(W, H - split, D, 0.006, 0.003), a.whitePlastic, 0, (H - split) / 2, D / 2 - 0.002)
  top.userData.front = true
  void s
  return g
}

/** AirPods Max on a stand: the knit mesh canopy, the stainless steel headband arms, the aluminium cups with their cushions, the Digital Crown. */
export function airpodsMax(a: AppleMaterials, p: Object3D, x: number, y: number, z: number, yaw: number, colour: string, cushion: string) {
  const g = at(p, x, y, z, yaw)
  // The stand: a white disc, a column, a curved saddle.
  mesh(g, new CylinderGeometry(0.06, 0.065, 0.012, 32), a.whitePlastic, 0, 0.006, 0)
  mesh(g, new CylinderGeometry(0.009, 0.009, 0.21, 16), a.whitePlastic, 0, 0.105, 0)
  // The saddle the headband rests on: an arc of the band's own curve, just under it.
  const saddle = mesh(g, new TorusGeometry(0.07, 0.008, 8, 24, PI * 0.5), a.whitePlastic, 0, 0.198, 0)
  saddle.rotation.set(0, 0, PI / 4)
  const top = 0.2
  // Headband: the steel frame arms and the mesh canopy.
  for (const off of [-0.012, 0.012]) {
    const arm = mesh(g, new TorusGeometry(0.083, 0.0018, 6, 40, PI), a.steel, 0, top - 0.083 + 0.08, off)
    void arm
  }
  const canopy = mesh(g, new TorusGeometry(0.078, 0.0045, 6, 40, PI), a.fabric(cushion), 0, top - 0.083 + 0.08, 0)
  canopy.scale.z = 4.5
  // The cups, hanging from the frame on their telescoping arms.
  for (const sx of [-1, 1]) {
    const cx = sx * 0.083
    tube(g, [cx, top - 0.003, 0], [cx, top - 0.06, 0], 0.0018, a.steel, 6)
    const cup = mesh(g, slab(0.075, 0.088, 0.034, 0.028, 0.006), a.body(colour, 0.3, 0.9), cx + sx * 0.006, top - 0.1, 0)
    cup.rotation.y = PI / 2
    const pad = mesh(g, slab(0.07, 0.083, 0.02, 0.026, 0.008), a.fabric(cushion), cx - sx * 0.016, top - 0.1, 0)
    pad.rotation.y = PI / 2
    if (sx > 0) {
      const crown = mesh(g, new CylinderGeometry(0.0055, 0.0055, 0.006, 20), a.body(colour, 0.2, 0.95), cx + 0.022, top - 0.072, -0.022)
      crown.rotation.x = PI / 2
    }
  }
  return g
}

/* ---------- HomePod mini, accessories ---------- */

/** A HomePod mini: a sphere of acoustic mesh with its top flattened to the touch surface, which glows while it plays. */
export function homepodMini(s: Shop, a: AppleMaterials, p: Object3D, name: string, x: number, y: number, z: number, colour: string) {
  const g = at(p, x, y, z, 0)
  const body = mesh(g, new SphereGeometry(0.049, 32, 24, 0, PI * 2, 0.35, PI - 0.6), a.fabric(colour), 0, 0.042, 0)
  void body
  mesh(g, new CircleGeometry(0.017, 32), a.glassBlack, 0, 0.042 + 0.049 * Math.cos(0.35) + 0.0003, 0, false).rotation.x = -PI / 2
  const glowMat = new MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0, transparent: true, opacity: 0.9 })
  glowMat.userData.interior = true
  mesh(g, new CircleGeometry(0.0115, 32), glowMat, 0, 0.042 + 0.049 * Math.cos(0.35) + 0.0006, 0, false).rotation.x = -PI / 2
  mesh(g, new CylinderGeometry(0.03, 0.03, 0.004, 24), a.rubber, 0, 0.002, 0)
  // The braided cable out of the back.
  tube(g, [0, 0.01, -0.03], [0, 0.0015, -0.12], 0.0018, a.fabric(colour), 6)
  let playing = false
  const b = button(g, name, 'HomePod mini', 'Play', 0, 0.093, 0, () => {
    playing = !playing
    play({
      dur: playing ? 3.0 : 0.3,
      step: (t) => {
        const hue = (t * 3) % 1
        glowMat.emissive.setHSL(0.75 + hue * 0.25, 0.8, 0.6)
        glowMat.emissiveIntensity = playing ? 0.6 + Math.sin(t * 25) * 0.3 : (1 - t) * 0.6
      },
      done: () => {
        if (playing) glowMat.emissiveIntensity = 0.7
      },
    }, b)
  }, 'apple')
  mesh(b, new CylinderGeometry(0.02, 0.02, 0.004, 16), new MeshStandardMaterial({ visible: false }), 0, 0, 0, false)
  void s
  return g
}

/** A product box: white board, its print on the front, the logo on top. */
export function productBox(a: AppleMaterials, p: Object3D, x: number, y: number, z: number, yaw: number, w: number, h: number, d: number, art: Material) {
  const g = at(p, x, y, z, yaw)
  mesh(g, slab(w, h, d, 0.002, 0.0008), a.whiteMatte, 0, h / 2, 0)
  mesh(g, face(w - 0.002, h - 0.002, 0.001), art, 0, h / 2, d / 2 + 0.0003, false)
  return g
}

/** A 20 W USB-C power adapter: a white cube, its two folding pins. */
export function adapter(a: AppleMaterials, p: Object3D, x: number, y: number, z: number) {
  const g = at(p, x, y, z, 0)
  mesh(g, slab(0.029, 0.029, 0.029, 0.004, 0.0015), a.whitePlastic, 0, 0.0145, 0)
  for (const sx of [-1, 1]) mesh(g, new CylinderGeometry(0.0022, 0.0022, 0.017, 10), a.steel, sx * 0.0064, 0.029 + 0.0085, 0)
  return g
}

/** A MagSafe charger: the aluminium puck with its white face, the cable coiled beside it. */
export function magsafe(a: AppleMaterials, p: Object3D, x: number, y: number, z: number) {
  const g = at(p, x, y, z, 0)
  mesh(g, new CylinderGeometry(0.03, 0.03, 0.0055, 40), a.aluminium, 0, 0.00275, 0)
  mesh(g, new CircleGeometry(0.028, 40), a.whitePlastic, 0, 0.0056, 0, false).rotation.x = -PI / 2
  const coil = mesh(g, new TorusGeometry(0.035, 0.0018, 6, 40), a.cable, 0.075, 0.002, 0)
  coil.rotation.x = PI / 2
  tube(g, [0.03, 0.002, 0], [0.04, 0.002, 0], 0.0018, a.cable, 6)
  return g
}

/** A silicone case for iPhone, standing on its edge: the colour, the camera cut-out, the MagSafe ring under the skin. */
export function phoneCase(a: AppleMaterials, p: Object3D, x: number, y: number, z: number, yaw: number, colour: string, pro: boolean) {
  const g = at(p, x, y, z, yaw)
  const body = mesh(g, slab(0.076, 0.152, 0.0115, 0.012, 0.003), a.sport(colour), 0, 0.076, 0)
  void body
  const hole = mesh(g, slab(pro ? 0.039 : 0.02, pro ? 0.04 : 0.036, 0.0005, 0.009, 0.0001), a.glassBlack, -0.038 + (pro ? 0.023 : 0.016), 0.152 - (pro ? 0.023 : 0.026), -0.006)
  void hole
  return g
}

/** An AirTag: the white face, the polished steel back. */
export function airtag(a: AppleMaterials, p: Object3D, x: number, y: number, z: number) {
  const g = at(p, x, y, z, 0)
  lathe(g, [[0.001, 0], [0.012, 0], [0.0158, 0.003], [0.0159, 0.004], [0.001, 0.004]], a.steel, 0, 0, 0, 32)
  lathe(g, [[0.0159, 0.004], [0.0158, 0.006], [0.012, 0.008], [0.001, 0.008]], a.whitePlastic, 0, 0, 0, 32)
  return g
}
