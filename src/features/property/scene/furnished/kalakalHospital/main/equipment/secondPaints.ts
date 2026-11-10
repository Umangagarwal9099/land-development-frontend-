import { rng, type Paint } from '../../../textures'
import { SANS } from '../../opd/paints'

/*
 * What the second floor's ICU screens show, painted once at their panels' resolution: the bedside
 * monitor's waveforms and numerics (in the layout of the large modular monitors), the ventilator's
 * three loops of pressure, flow and volume with its measured values and set parameters, the
 * central station's four-bed overview, the pumps' and the humidifier's small LCDs, and the
 * isolation room's pressure monitor.
 */

const TAU = Math.PI * 2
/** A bump: amplitude a at mu, width s. */
const bump = (p: number, mu: number, s: number, a: number) => a * Math.exp(-(((p - mu) / s) ** 2))

/** One heartbeat of lead II (P, QRS, T) over a cycle 0…1. */
export const ecgWave = (p: number) => bump(p, 0.14, 0.03, 0.12) + bump(p, 0.27, 0.008, -0.12) + bump(p, 0.3, 0.011, 1) + bump(p, 0.335, 0.011, -0.26) + bump(p, 0.56, 0.05, 0.26)
/** A plethysmograph pulse with its dicrotic notch. */
const plethWave = (p: number) => bump(p, 0.3, 0.08, 0.9) + bump(p, 0.52, 0.07, 0.38) - 0.35
/** Arterial pressure: the sharp upstroke, the notch, the run-off. */
const abpWave = (p: number) => (p < 0.18 ? -0.45 + p * 0.3 : p < 0.27 ? -0.4 + ((p - 0.18) / 0.09) * 1.35 : 0.95 - (p - 0.27) * 1.9 + bump(p, 0.47, 0.035, 0.18))
/** The capnogram: the plateau of expired CO₂, back to zero on inspiration. */
const co2Wave = (p: number) => (p < 0.38 ? -0.5 : p < 0.45 ? -0.5 + ((p - 0.38) / 0.07) * 1.1 : p < 0.9 ? 0.6 + (p - 0.45) * 0.25 : p < 0.95 ? 0.71 - ((p - 0.9) / 0.05) * 1.21 : -0.5)
/** Ventilator loops over a breath (inspiration the first third): airway pressure, flow, volume. */
const pawWave = (p: number) => (p < 0.04 ? -0.7 + (p / 0.04) * 0.9 : p < 0.3 ? 0.2 + ((p - 0.04) / 0.26) * 0.7 : p < 0.36 ? 0.62 : p < 0.4 ? 0.62 - ((p - 0.36) / 0.04) * 1.32 : -0.7)
const flowWave = (p: number) => (p < 0.02 ? (p / 0.02) * 0.75 : p < 0.3 ? 0.75 : p < 0.36 ? 0 : p < 0.38 ? -((p - 0.36) / 0.02) * 0.9 : -0.9 * Math.exp(-(p - 0.38) * 9))
const volWave = (p: number) => (p < 0.3 ? -0.75 + (p / 0.3) * 1.45 : p < 0.36 ? 0.7 : -0.75 + 1.45 * Math.exp(-(p - 0.36) * 8))

/** Draws f (−1…1 over a cycle) across a strip x0…x1 centred at yc, half height a, `n` cycles. */
function trace(g: CanvasRenderingContext2D, x0: number, x1: number, yc: number, a: number, f: (p: number) => number, n: number, colour: string, lw: number, phase = 0, gap = 0.04) {
  g.strokeStyle = colour
  g.lineWidth = lw
  g.lineJoin = 'round'
  // A sweep: the erase bar a little way ahead of the newest point.
  const sweep = x0 + (x1 - x0) * 0.72
  for (const [a0, a1] of [[x0, sweep], [sweep + (x1 - x0) * gap, x1]]) {
    g.beginPath()
    for (let x = a0; x <= a1; x += 1) {
      const p = (((x - x0) / (x1 - x0)) * n + phase) % 1
      const y = yc - f(p) * a
      if (x === a0) g.moveTo(x, y)
      else g.lineTo(x, y)
    }
    g.stroke()
  }
}

function label(g: CanvasRenderingContext2D, text: string, x: number, y: number, px: number, colour: string, weight = 600, align: CanvasTextAlign = 'left') {
  g.fillStyle = colour
  g.font = SANS(px, weight)
  g.textAlign = align
  g.textBaseline = 'alphabetic'
  g.fillText(text, x, y)
}

/* ---------- the bedside monitor ---------- */

/** A large modular bedside monitor's main screen: five waves and the numerics column, for `bed`. */
export const icuMonitorPaint = (bed: string, seed: number, vented = true): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = '#000000'
  g.fillRect(0, 0, w, h)
  // The status line: bed, patient category, paced status, the clock; the alarm field.
  g.fillStyle = '#1b2633'
  g.fillRect(0, 0, w, h * 0.07)
  label(g, `${bed}   Adult   Non-paced`, w * 0.015, h * 0.05, h * 0.04, '#b8c7d9')
  label(g, `14:${String(20 + Math.floor(r() * 30))}`, w * 0.985, h * 0.05, h * 0.04, '#b8c7d9', 600, 'right')
  g.fillStyle = '#2f3d4d'
  g.fillRect(w * 0.36, h * 0.012, w * 0.3, h * 0.046)
  label(g, 'All alarms on', w * 0.51, h * 0.05, h * 0.034, '#d9e3ee', 500, 'center')
  const hr = 74 + Math.floor(r() * 22)
  const rows: [string, string, number, (p: number) => number, number][] = [
    ['II', '#33e06f', 0.15, ecgWave, 4.2],
    ['V5', '#33e06f', 0.3, (p) => ecgWave(p) * 0.7 - bump(p, 0.56, 0.05, 0.4), 4.2],
    ['ABP', '#ff4b4b', 0.47, abpWave, 4.2],
    ['Pleth', '#3fd2f0', 0.64, plethWave, 4.2],
    [vented ? 'CO₂' : 'Resp', '#f4d23c', 0.82, vented ? co2Wave : (p) => Math.sin(p * TAU) * 0.6, 1.3],
  ]
  const x1 = w * 0.64
  for (const [name, colour, y, f, n] of rows) {
    label(g, name, w * 0.012, h * (y - 0.055), h * 0.032, colour, 600)
    trace(g, w * 0.01, x1, h * y, h * 0.06, f, n, colour, Math.max(1.6, h * 0.0055), r() * 0.3)
  }
  // ABP and CO₂ scales, faint.
  g.fillStyle = 'rgba(255,75,75,.5)'
  g.fillRect(w * 0.012, h * 0.47, x1 * 0.98, 1)
  // The numerics column.
  g.fillStyle = 'rgba(255,255,255,.12)'
  g.fillRect(w * 0.655, h * 0.08, 1, h * 0.84)
  const nx = w * 0.67
  const big = (name: string, unit: string, value: string, y: number, colour: string, size = 0.13) => {
    label(g, name, nx, h * (y - size * 0.62), h * 0.03, colour, 600)
    label(g, unit, nx, h * (y - size * 0.62) + h * 0.032, h * 0.024, colour, 400)
    label(g, value, w * 0.985, h * y, h * size, colour, 700, 'right')
  }
  big('HR', 'bpm', String(hr), 0.2, '#33e06f', 0.15)
  const sys = 112 + Math.floor(r() * 20)
  const dia = 62 + Math.floor(r() * 10)
  big('ABP', 'mmHg', `${sys}/${dia}`, 0.36, '#ff4b4b', 0.085)
  label(g, `(${Math.round((sys + 2 * dia) / 3)})`, w * 0.985, h * 0.42, h * 0.045, '#ff4b4b', 600, 'right')
  big('SpO₂', '%', String(95 + Math.floor(r() * 4)), 0.56, '#3fd2f0', 0.13)
  big(vented ? 'etCO₂' : 'RR', vented ? 'mmHg' : 'rpm', vented ? String(33 + Math.floor(r() * 6)) : String(14 + Math.floor(r() * 6)), 0.72, '#f4d23c', 0.1)
  label(g, vented ? `awRR ${14 + Math.floor(r() * 4)}` : '', w * 0.73, h * 0.77, h * 0.03, '#f4d23c', 500)
  label(g, 'T1  °C', nx, h * 0.83, h * 0.03, '#e8e8e8', 600)
  label(g, (36.6 + r() * 1.0).toFixed(1), w * 0.985, h * 0.86, h * 0.07, '#e8e8e8', 700, 'right')
  label(g, `NIBP ${108 + Math.floor(r() * 20)}/${64 + Math.floor(r() * 10)}  14:00`, nx, h * 0.92, h * 0.032, '#d9d9d9', 500)
  // SmartKeys along the foot.
  g.fillStyle = '#16202b'
  g.fillRect(0, h * 0.935, w, h * 0.065)
  const keys = ['Main Setup', 'Alarms', 'Trends', 'NIBP Start', 'Zero', 'Standby']
  keys.forEach((k, i) => {
    g.fillStyle = '#2b3a4b'
    g.fillRect(w * (0.01 + i * 0.165), h * 0.943, w * 0.155, h * 0.05)
    label(g, k, w * (0.0875 + i * 0.165), h * 0.977, h * 0.028, '#cfe0f2', 500, 'center')
  })
}

/* ---------- the ventilator ---------- */

/** An ICU ventilator's main screen: mode and patient, three waveforms, measured values, set parameters. */
export const ventScreenPaint = (bed: string, seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  const bg = g.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#0d1c2b')
  bg.addColorStop(1, '#07111b')
  g.fillStyle = bg
  g.fillRect(0, 0, w, h)
  // Header: the mode tile, patient, the alarm field, the clock.
  g.fillStyle = '#245f96'
  g.fillRect(0, 0, w * 0.2, h * 0.09)
  label(g, 'VC-AC', w * 0.1, h * 0.066, h * 0.055, '#ffffff', 700, 'center')
  label(g, `Adult · 68 kg IBW · ${bed}`, w * 0.215, h * 0.06, h * 0.036, '#c6d6e6', 500)
  label(g, '14:32', w * 0.985, h * 0.06, h * 0.036, '#c6d6e6', 500, 'right')
  g.fillStyle = '#132a40'
  g.fillRect(0, h * 0.09, w, 2)
  // Waveforms with their scales and zero lines.
  const waves: [string, string, number, (p: number) => number][] = [
    ['Paw  cmH₂O', '#f2d544', 0.22, pawWave],
    ['Flow  L/min', '#42d7ee', 0.44, flowWave],
    ['Volume  mL', '#b892ff', 0.66, volWave],
  ]
  const x1 = w * 0.68
  for (const [name, colour, y, f] of waves) {
    g.fillStyle = 'rgba(255,255,255,.08)'
    g.fillRect(w * 0.03, h * (y + 0.07), x1 - w * 0.03, 1)
    label(g, name, w * 0.035, h * (y - 0.06), h * 0.03, colour, 600)
    g.fillStyle = colour
    g.globalAlpha = 0.22
    g.beginPath()
    g.moveTo(w * 0.03, h * (y + 0.07))
    for (let x = w * 0.03; x <= x1 * 0.72 + w * 0.03; x += 2) {
      const p = (((x - w * 0.03) / (x1 - w * 0.03)) * 2.6 + 0.1) % 1
      g.lineTo(x, h * y - f(p) * h * 0.075)
    }
    g.lineTo(x1 * 0.72 + w * 0.03, h * (y + 0.07))
    g.fill()
    g.globalAlpha = 1
    trace(g, w * 0.03, x1, h * y, h * 0.075, f, 2.6, colour, Math.max(1.8, h * 0.006), 0.1, 0.03)
  }
  // Measured values.
  g.fillStyle = 'rgba(255,255,255,.06)'
  g.fillRect(w * 0.7, h * 0.11, w * 0.29, h * 0.66)
  const vals: [string, string, string][] = [
    ['Ppeak', 'cmH₂O', String(21 + Math.floor(r() * 5))],
    ['Pmean', 'cmH₂O', String(10 + Math.floor(r() * 3))],
    ['PEEP', 'cmH₂O', '5.0'],
    ['VTe', 'mL', String(440 + Math.floor(r() * 25))],
    ['MVe', 'L/min', (6.9 + r() * 0.8).toFixed(1)],
    ['ftot', '/min', '16'],
    ['FiO₂', '%', '40'],
  ]
  vals.forEach(([n, u, v], i) => {
    const y = h * (0.19 + i * 0.087)
    label(g, n, w * 0.715, y - h * 0.018, h * 0.03, '#9fb6cc', 600)
    label(g, u, w * 0.715, y + h * 0.017, h * 0.022, '#6f879e', 400)
    label(g, v, w * 0.98, y + h * 0.02, h * 0.06, '#ffffff', 700, 'right')
  })
  // Set parameters: tiles along the foot, the one under the knob outlined.
  const tiles: [string, string, string][] = [['VT', '450', 'mL'], ['RR', '16', '/min'], ['PEEP', '5', 'cmH₂O'], ['FiO₂', '40', '%'], ['Ti', '1.10', 's'], ['Trigger', '2.0', 'L/min']]
  tiles.forEach(([n, v, u], i) => {
    const x = w * (0.008 + i * 0.165)
    g.fillStyle = '#1b3b5b'
    g.fillRect(x, h * 0.8, w * 0.157, h * 0.19)
    if (i === 2) {
      g.strokeStyle = '#ff9d2b'
      g.lineWidth = 3
      g.strokeRect(x + 1.5, h * 0.8 + 1.5, w * 0.157 - 3, h * 0.19 - 3)
    }
    label(g, n, x + w * 0.078, h * 0.845, h * 0.032, '#9fc4e6', 600, 'center')
    label(g, v, x + w * 0.078, h * 0.925, h * 0.07, '#ffffff', 700, 'center')
    label(g, u, x + w * 0.078, h * 0.975, h * 0.026, '#9fc4e6', 400, 'center')
  })
}

/* ---------- the central station ---------- */

/** The ICU's central station: a tile per bed with its waves and numerics; one in a yellow alarm. */
export const centralPaint = (seed: number): Paint => (g, w, h) => {
  const r = rng(seed)
  g.fillStyle = '#05080b'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#1b2633'
  g.fillRect(0, 0, w, h * 0.06)
  label(g, 'ICU · CENTRAL STATION', w * 0.012, h * 0.043, h * 0.034, '#d6e2ef', 700)
  label(g, '4 beds monitored · 14:32', w * 0.988, h * 0.043, h * 0.03, '#9fb2c8', 500, 'right')
  const beds: [string, boolean, boolean][] = [['ICU-1 · Vent', true, false], ['ICU-2 · Vent', true, false], ['ICU-3 · Isolation', false, true], ['ICU-4', false, false]]
  beds.forEach(([name, vented, alarm], i) => {
    const x0 = (i % 2) * w * 0.5 + w * 0.006
    const y0 = h * 0.07 + Math.floor(i / 2) * h * 0.465
    const tw = w * 0.488
    const th = h * 0.455
    g.fillStyle = '#0c1218'
    g.fillRect(x0, y0, tw, th)
    g.fillStyle = alarm ? '#d7a81e' : '#22344a'
    g.fillRect(x0, y0, tw, th * 0.11)
    label(g, name, x0 + tw * 0.02, y0 + th * 0.083, th * 0.07, alarm ? '#1a1300' : '#e3edf7', 700)
    if (alarm) label(g, '** SpO₂ LOW 90', x0 + tw * 0.98, y0 + th * 0.083, th * 0.065, '#1a1300', 700, 'right')
    const wx1 = x0 + tw * 0.62
    trace(g, x0 + tw * 0.02, wx1, y0 + th * 0.27, th * 0.09, ecgWave, 3.5, '#33e06f', 2, r())
    trace(g, x0 + tw * 0.02, wx1, y0 + th * 0.5, th * 0.08, vented ? abpWave : plethWave, 3.5, vented ? '#ff4b4b' : '#3fd2f0', 2, r())
    trace(g, x0 + tw * 0.02, wx1, y0 + th * 0.74, th * 0.08, vented ? co2Wave : plethWave, vented ? 1.1 : 3.5, vented ? '#f4d23c' : '#3fd2f0', 2, r())
    const nx = x0 + tw * 0.97
    label(g, String(72 + Math.floor(r() * 25)), nx, y0 + th * 0.36, th * 0.2, '#33e06f', 700, 'right')
    label(g, alarm ? '90' : String(95 + Math.floor(r() * 4)), nx, y0 + th * 0.6, th * 0.16, alarm ? '#ffd02b' : '#3fd2f0', 700, 'right')
    label(g, vented ? `${114 + Math.floor(r() * 16)}/${62 + Math.floor(r() * 8)}` : `RR ${15 + Math.floor(r() * 5)}`, nx, y0 + th * 0.8, th * 0.1, vented ? '#ff4b4b' : '#f4d23c', 700, 'right')
    label(g, 'HR', x0 + tw * 0.66, y0 + th * 0.22, th * 0.05, '#33e06f', 600)
    label(g, 'SpO₂', x0 + tw * 0.66, y0 + th * 0.47, th * 0.05, '#3fd2f0', 600)
    label(g, vented ? 'ABP' : 'RR', x0 + tw * 0.66, y0 + th * 0.69, th * 0.05, vented ? '#ff4b4b' : '#f4d23c', 600)
    if (vented) label(g, 'VC-AC  VT 450  PEEP 5  FiO₂ 40%', x0 + tw * 0.02, y0 + th * 0.96, th * 0.055, '#9fc4e6', 500)
  })
}

/* ---------- small displays ---------- */

/** A pump's LCD: the drug or fluid, its rate large, the volume to be infused. */
export const pumpLcd = (drug: string, rate: string, sub: string): Paint => (g, w, h) => {
  g.fillStyle = '#0c1a24'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#123a52'
  g.fillRect(0, 0, w, h * 0.26)
  label(g, drug, w * 0.05, h * 0.2, h * 0.17, '#e6f4ff', 600)
  label(g, rate, w * 0.95, h * 0.64, h * 0.34, '#ffffff', 700, 'right')
  label(g, sub, w * 0.05, h * 0.92, h * 0.15, '#7fd0ff', 500)
  g.fillStyle = '#35d06a'
  g.beginPath()
  g.moveTo(w * 0.06, h * 0.38)
  g.lineTo(w * 0.16, h * 0.48)
  g.lineTo(w * 0.06, h * 0.58)
  g.fill()
}

/** Seven-segment style digits on black: the humidifier's chamber temperature. */
export const ledDigits = (text: string, colour = '#ff5a3a'): Paint => (g, w, h) => {
  g.fillStyle = '#0a0606'
  g.fillRect(0, 0, w, h)
  label(g, text, w * 0.95, h * 0.78, h * 0.72, colour, 700, 'right')
}

/** The isolation room's pressure monitor: the room's differential pressure and its state. */
export const pressurePaint: Paint = (g, w, h) => {
  g.fillStyle = '#e9efe9'
  g.fillRect(0, 0, w, h)
  label(g, 'ISOLATION ROOM ICU-3', w * 0.5, h * 0.11, h * 0.065, '#24313b', 700, 'center')
  g.fillStyle = '#0b1a12'
  g.fillRect(w * 0.08, h * 0.17, w * 0.84, h * 0.43)
  label(g, 'ROOM PRESSURE', w * 0.5, h * 0.27, h * 0.06, '#7dff9f', 600, 'center')
  label(g, '−8.6 Pa', w * 0.5, h * 0.5, h * 0.17, '#7dff9f', 700, 'center')
  g.fillStyle = '#1e9a4c'
  g.fillRect(w * 0.08, h * 0.65, w * 0.84, h * 0.13)
  label(g, 'NEGATIVE · SAFE', w * 0.5, h * 0.745, h * 0.07, '#ffffff', 700, 'center')
  label(g, 'ACH 12 · Door closed', w * 0.5, h * 0.9, h * 0.055, '#46525c', 500, 'center')
}
