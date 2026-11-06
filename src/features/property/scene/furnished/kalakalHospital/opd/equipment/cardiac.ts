import { MeshStandardMaterial, type Material, type Object3D } from 'three'
import { PI } from '../../../kit'
import { rng } from '../../../textures'
import { bentTube, castor, group, lathe, put, rod, starBase, tube } from '../../erKit'
import type { OpdCtx } from '../ctx'
import { imagingMats, keyboard, monitor, mouse, ring } from './imaging'

/*
 * The cardiac diagnostics' machines, each in its own frame at true size, front towards +z: the
 * echocardiography system and its couch, the stress-test treadmill and its exercise ECG system,
 * and the screens they show (a 12-lead trace, an apical four-chamber view).
 */

/** A 12-lead ECG trace on its grid paper, as a recorder's screen or a review workstation shows it. */
export function ecgTrace(e: OpdCtx, key: string, live = true) {
  return e.o.screen(`ecgTrace_${key}`, 512, 320, (g, w, h) => {
    const r = rng(key.length * 97 + 13)
    g.fillStyle = live ? '#050b07' : '#fff7f5'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = live ? 'rgba(60,140,80,.25)' : 'rgba(230,120,120,.35)'
    g.lineWidth = 1
    for (let x = 0; x < w; x += 10) {
      g.beginPath()
      g.moveTo(x, 0)
      g.lineTo(x, h)
      g.stroke()
    }
    for (let y = 0; y < h; y += 10) {
      g.beginPath()
      g.moveTo(0, y)
      g.lineTo(w, y)
      g.stroke()
    }
    const leads = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6']
    g.strokeStyle = live ? '#4bff72' : '#111'
    g.fillStyle = live ? '#4bff72' : '#111'
    g.font = `700 ${h * 0.04}px Helvetica`
    g.lineWidth = 1.6
    leads.forEach((name, i) => {
      const col = Math.floor(i / 6)
      const row = i % 6
      const x0 = col * (w / 2) + 6
      const y0 = h * (0.1 + row * 0.15)
      g.fillText(name, x0, y0 - h * 0.04)
      g.beginPath()
      const amp = (name === 'aVR' ? -1 : 1) * (0.5 + r() * 0.6)
      for (let x = 0; x < w / 2 - 12; x++) {
        const t = (x % 68) / 68
        let v = 0
        if (t > 0.12 && t < 0.18) v = Math.sin(((t - 0.12) / 0.06) * PI) * 0.12
        else if (t > 0.26 && t < 0.28) v = -0.1
        else if (t >= 0.28 && t < 0.31) v = 1
        else if (t >= 0.31 && t < 0.33) v = -0.25
        else if (t > 0.45 && t < 0.6) v = Math.sin(((t - 0.45) / 0.15) * PI) * 0.25
        const y = y0 - v * amp * h * 0.06
        if (x) g.lineTo(x0 + x, y)
        else g.moveTo(x0, y)
      }
      g.stroke()
    })
    g.font = `700 ${h * 0.05}px Helvetica`
    g.fillText(live ? 'HR 78 bpm   25 mm/s   10 mm/mV' : 'Sinus rhythm · HR 72 · PR 160 · QRS 92 · QTc 412', 8, h * 0.97)
  }, live ? 1.0 : 0.85)
}

/** An echocardiogram: the apical four-chamber sector in grey, the colour Doppler box, the ECG strip and measurements. */
export function echoImage(e: OpdCtx) {
  return e.o.screen('echoImage', 512, 384, (g, w, h) => {
    const r = rng(4417)
    g.fillStyle = '#000'
    g.fillRect(0, 0, w, h)
    const cx = w * 0.5
    const cy = h * 0.08
    const R = h * 0.82
    g.save()
    g.beginPath()
    g.moveTo(cx, cy)
    g.arc(cx, cy, R, PI / 2 - 0.62, PI / 2 + 0.62)
    g.closePath()
    g.clip()
    for (let i = 0; i < 9000; i++) {
      const a = PI / 2 - 0.62 + r() * 1.24
      const d = r() * R
      const v = Math.floor(60 + r() * 120)
      g.fillStyle = `rgba(${v},${v},${v},${0.25 + r() * 0.4})`
      g.fillRect(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1.6, 1.6)
    }
    // The four chambers: dark blood pools in the speckle.
    g.fillStyle = 'rgba(0,0,0,.85)'
    for (const [x, y, rx, ry] of [[0.42, 0.45, 0.08, 0.14], [0.58, 0.45, 0.08, 0.14], [0.43, 0.75, 0.07, 0.09], [0.57, 0.75, 0.07, 0.09]] as const) {
      g.beginPath()
      g.ellipse(w * x, h * y, w * rx, h * ry, 0, 0, PI * 2)
      g.fill()
    }
    // Colour Doppler over the mitral valve.
    g.fillStyle = 'rgba(220,40,40,.6)'
    g.beginPath()
    g.ellipse(w * 0.43, h * 0.62, w * 0.04, h * 0.06, 0.2, 0, PI * 2)
    g.fill()
    g.fillStyle = 'rgba(40,90,230,.6)'
    g.beginPath()
    g.ellipse(w * 0.45, h * 0.68, w * 0.03, h * 0.04, 0, 0, PI * 2)
    g.fill()
    g.restore()
    g.strokeStyle = '#4bff72'
    g.beginPath()
    for (let x = 0; x < w; x++) {
      const t = (x % 90) / 90
      const v = t > 0.3 && t < 0.34 ? 1 : t > 0.5 && t < 0.62 ? 0.25 : 0
      if (x) g.lineTo(x, h * 0.95 - v * 18)
      else g.moveTo(0, h * 0.95)
    }
    g.stroke()
    g.fillStyle = '#d0e4ff'
    g.font = `500 ${h * 0.035}px Helvetica`
    g.fillText('S5-1  A4C  HR 72', 8, 16)
    g.fillText('LVEF 62 %   E/A 1.2', 8, 32)
  }, 0.9)
}

const leadCache = new WeakMap<object, Material[]>()
/** The ten lead wires' clip colours (IEC): RA red, LA yellow, LL green, RL black, C1–C6 white banded red, yellow, green, brown, black, violet. */
function leadColours(e: OpdCtx) {
  let l = leadCache.get(e.o)
  if (!l) leadCache.set(e.o, (l = ['#c8161d', '#f2c200', '#2e9b4f', '#1b1c1e', '#d84a4a', '#e7cf3a', '#55b06e', '#7a5232', '#3a3c40', '#7a4fa0'].map((c) => new MeshStandardMaterial({ color: c, roughness: 0.45 }))))
  return l
}

/**
 * An ECG patient cable: the trunk from the recorder's socket to the yoke, and ten lead wires
 * fanning from the yoke, each ending in its colour-coded clip; hung over a hook at `hook`, the
 * leads falling in loops. Points in p's frame.
 */
function patientCable(e: OpdCtx, p: Object3D, from: [number, number, number], hook: [number, number, number], key: string) {
  const { k, m } = e
  const im = imagingMats(e)
  const [hx, hy, hz] = hook
  put(p, tube(e, `ecgTrunk${key}`, [from, [from[0] + 0.05, from[1] - 0.15, from[2] + 0.05], [hx, hy - 0.2, hz], [hx, hy, hz]], 0.0055), m.charcoal)
  k.soft(p, 0.05, 0.08, 0.03, 0.01, im.dark, hx, hy - 0.04, hz + 0.02)
  const cols = leadColours(e)
  for (let i = 0; i < 10; i++) {
    const a = (i - 4.5) * 0.022
    const drop = 0.32 + (i % 3) * 0.07
    const end: [number, number, number] = [hx + a * 2.2, hy - drop, hz + 0.05 + (i % 2) * 0.03]
    put(p, tube(e, `ecgLead${key}${i}`, [[hx + a, hy - 0.08, hz + 0.03], [hx + a * 1.6, hy - drop * 0.6, hz + 0.06], end], 0.0022), m.whitePlastic)
    k.soft(p, 0.012, 0.03, 0.012, 0.004, cols[i], end[0], end[1] - 0.012, end[2])
  }
}

/**
 * A 12-lead ECG machine on its mobile stand, operator at +z: the five-castor base and column, the
 * top tray with its rail and basket; on it the recorder: the moulded body with the alphanumeric
 * membrane keypad and the coloured function keys, the 10" screen hinged up at the back with the
 * live trace, the A4 thermal printer's drawer with a report coming out at the side; the patient
 * cable over its hook arm with the ten leads and clips; a pack of tab electrodes.
 */
export function ecgMachine(e: OpdCtx, p: Object3D, screen: Material, key = 'ecg') {
  const { k } = e
  const im = imagingMats(e)
  starBase(e, p, 0.27, 0.09, im.grey, 0.035)
  put(p, lathe(e, 'ecgColumn', [[0, 0.1], [0.032, 0.1], [0.03, 0.78], [0, 0.78]], 20), im.grey)
  k.soft(p, 0.46, 0.035, 0.38, 0.012, im.shell, 0, 0.8, 0)
  for (const s of [-1, 1]) k.box(p, 0.46, 0.03, 0.01, im.grey, 0, 0.83, s * 0.19)
  k.soft(p, 0.34, 0.12, 0.26, 0.012, im.mid, 0, 0.5, 0)
  k.box(p, 0.3, 0.1, 0.22, e.m.paper, 0, 0.51, 0, false)
  // The recorder body and its keypad.
  const body = group(p, 0, 0.817, 0.02)
  k.soft(body, 0.4, 0.075, 0.3, 0.02, im.shell, 0, 0.0375, 0)
  const pad = group(body, 0, 0.076, 0.07)
  pad.rotation.x = -0.12
  k.box(pad, 0.34, 0.003, 0.13, e.o.sign('ecgKeypad', 256, 100, (c, w, h) => {
    c.fillStyle = '#e9ecef'
    c.fillRect(0, 0, w, h)
    for (let r = 0; r < 4; r++)
      for (let i = 0; i < 11; i++) {
        c.fillStyle = '#c7ccd2'
        c.fillRect(6 + i * 18, 8 + r * 18, 15, 14)
      }
    const fk: [string, string][] = [['#2e9b4f', 'START'], ['#c8161d', 'STOP'], ['#1f6fd1', 'COPY'], ['#f08a00', 'FILTER']]
    fk.forEach(([col, t], i) => {
      c.fillStyle = col
      c.fillRect(206 + (i % 2) * 24, 8 + Math.floor(i / 2) * 36, 22, 30)
      c.fillStyle = '#fff'
      c.font = '700 7px Helvetica'
      c.fillText(t.slice(0, 4), 207 + (i % 2) * 24, 26 + Math.floor(i / 2) * 36)
    })
  }), 0, 0, 0, false)
  // The screen, hinged up at the back.
  const scr = group(body, 0, 0.075, -0.12)
  scr.rotation.x = -0.35
  k.soft(scr, 0.28, 0.2, 0.025, 0.01, im.shell, 0, 0.1, 0)
  k.box(scr, 0.25, 0.16, 0.003, screen, 0, 0.105, 0.0135, false)
  // The printer drawer at the right and the report coming out of it.
  k.soft(body, 0.06, 0.06, 0.24, 0.008, im.grey, 0.205, 0.035, 0)
  const sheet = group(body, 0.24, 0.04, 0.0)
  sheet.rotation.z = -0.5
  k.box(sheet, 0.12, 0.002, 0.21, ecgTrace(e, `${key}Print`, false), 0.06, 0, 0, false)
  // The hook arm on the column, the patient cable over it.
  put(p, bentTube(e, 'ecgHookArm', [[-0.03, 0.72, 0], [-0.25, 0.72, 0], [-0.3, 0.76, 0], [-0.3, 0.8, 0]], 0.01, 0.03), im.aluminium)
  patientCable(e, p, [-0.18, 0.85, -0.1], [-0.3, 0.8, 0], key)
  // A pack of tab electrodes on the tray.
  k.box(p, 0.1, 0.012, 0.08, e.m.paper, 0.12, 0.823, 0.15, false)
}

/**
 * A cart-based cardiac ultrasound system, operator at +z, as the premium echo systems are built:
 * the base on four locking castors with the foot rest; the body with its vents, the probe ports
 * and the printer bay; the control panel on its height-adjustable column: the 12" touch panel,
 * the keys, the trackball in its ring, the eight TGC sliders and the gain knobs; the 22" monitor
 * on its articulating two-link arm; three cardiac probes in their cups, cables looping to their
 * ports; the ECG module with its three leads; the gel warmer.
 */
export function echoMachine(e: OpdCtx, p: Object3D, image: Material) {
  const { k, m } = e
  const im = imagingMats(e)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * 0.25, sz * 0.33, 0.055, sx * 0.2, sz > 0)
  k.soft(p, 0.6, 0.12, 0.8, 0.04, im.grey, 0, 0.16, 0)
  k.soft(p, 0.5, 0.48, 0.5, 0.05, im.shell, 0, 0.46, -0.1)
  for (let i = 0; i < 7; i++) k.box(p, 0.3, 0.008, 0.004, im.reveal, 0, 0.32 + i * 0.03, 0.152, false)
  // Probe ports low on the front and the printer bay.
  for (let i = 0; i < 4; i++) k.soft(p, 0.08, 0.05, 0.02, 0.008, im.dark, -0.18 + i * 0.12, 0.56, 0.155)
  k.soft(p, 0.2, 0.08, 0.02, 0.01, im.dark, 0, 0.66, 0.155)
  k.box(p, 0.14, 0.004, 0.06, e.m.paper, 0, 0.66, 0.17, false)
  // The column and the control panel.
  k.soft(p, 0.16, 0.2, 0.12, 0.02, im.grey, 0, 0.78, -0.12)
  const panel = group(p, 0, 0.92, 0.05)
  panel.rotation.x = 0.1
  k.soft(panel, 0.66, 0.06, 0.48, 0.03, im.shell, 0, 0, 0)
  k.soft(panel, 0.28, 0.02, 0.18, 0.01, im.dark, 0, 0.035, -0.12)
  k.box(panel, 0.26, 0.003, 0.16, e.o.screen('echoTouch', 160, 100, (g, w, h) => {
    g.fillStyle = '#16202c'
    g.fillRect(0, 0, w, h)
    const labels = ['2D', 'M', 'CF', 'PW', 'CW', 'TDI', '3D', 'Zoom', 'Depth', 'Freq', 'LVEF', 'Meas']
    labels.forEach((t, i) => {
      g.fillStyle = i === 2 ? '#1f6fd1' : '#3a4a5c'
      g.fillRect(6 + (i % 4) * 38, 8 + Math.floor(i / 4) * 30, 32, 24)
      g.fillStyle = '#e8eef5'
      g.font = '700 9px Helvetica'
      g.fillText(t, 9 + (i % 4) * 38, 24 + Math.floor(i / 4) * 30)
    })
  }, 0.9), 0, 0.046, -0.12, false)
  // Keys either side, the trackball in its ring with select keys, the TGC sliders, gain knobs.
  for (let i = 0; i < 16; i++) k.soft(panel, 0.032, 0.012, 0.026, 0.004, i % 6 === 0 ? im.accent : im.keys, -0.27 + (i % 4) * 0.038 + (i >= 8 ? 0.39 : 0), 0.032, -0.18 + Math.floor((i % 8) / 4) * 0.036)
  put(panel, ring(e, 0.042, 0.008), im.dark, 0.12, 0.034, 0.1).rotation.x = PI / 2
  k.sphere(panel, 0.032, im.dark, 0.12, 0.03, 0.1)
  for (const s of [-1, 1]) k.soft(panel, 0.04, 0.012, 0.025, 0.004, im.keys, 0.12 + s * 0.07, 0.032, 0.15)
  for (let i = 0; i < 8; i++) {
    k.box(panel, 0.004, 0.002, 0.07, im.reveal, -0.24 + i * 0.022, 0.031, 0.1, false)
    k.soft(panel, 0.014, 0.014, 0.01, 0.003, im.grey, -0.24 + i * 0.022, 0.038, 0.08 + (i % 3) * 0.015)
  }
  for (let i = 0; i < 5; i++) put(panel, lathe(e, 'echoKnob', [[0, 0], [0.013, 0], [0.012, 0.016], [0, 0.017]], 16), im.dark, -0.02 + i * 0.045, 0.03, 0.175, false)
  // The monitor on its articulating arm.
  k.cyl(p, 0.03, 0.03, 0.3, im.grey, 0, 1.07, -0.24, 16)
  const arm1 = group(p, 0, 1.22, -0.24)
  arm1.rotation.y = 0.35
  rod(e, arm1, 0.022, 0.22, im.grey, 0, 0, 0.11, 'z', 14)
  k.cyl(arm1, 0.026, 0.026, 0.06, im.dark, 0, 0, 0.22, 14)
  monitor(e, arm1, 0, 0.0, 0.25, -0.35, 0.54, 0.34, image, { foot: false, tilt: 0.1 })
  // Probes in their cups, their cables looping to the ports.
  const probes: [number, number][] = [[-0.36, 0.12], [-0.36, -0.02], [0.36, 0.12]]
  probes.forEach(([x, zz], i) => {
    k.soft(p, 0.07, 0.09, 0.08, 0.015, im.grey, x, 0.9, zz)
    put(p, lathe(e, 'cardiacProbe', [[0, 0], [0.011, 0], [0.016, 0.03], [0.016, 0.08], [0.009, 0.12], [0.005, 0.15], [0, 0.15]], 16), im.front, x, 0.9, zz).scale.set(1.15, 1, 0.8)
    put(p, tube(e, `echoCable${i}`, [[x, 1.05, zz], [x * 1.12, 0.62, zz + 0.12], [x * 0.75, 0.38, zz + 0.24], [-0.18 + i * 0.12, 0.56, 0.17]], 0.0045), m.charcoal)
  })
  // The ECG module and its three leads, the gel warmer.
  k.soft(p, 0.06, 0.1, 0.12, 0.01, im.dark, 0.3, 0.68, -0.18)
  const cols = leadColours(e)
  for (let i = 0; i < 3; i++) {
    put(p, tube(e, `echoLead${i}`, [[0.33, 0.66, -0.18], [0.42, 0.5 - i * 0.05, -0.08], [0.39, 0.32, 0.03 + i * 0.05]], 0.0022), m.whitePlastic)
    k.soft(p, 0.012, 0.03, 0.012, 0.004, cols[i], 0.39, 0.3, 0.03 + i * 0.05)
  }
  k.cyl(p, 0.038, 0.038, 0.14, im.grey, -0.27, 0.97, -0.28, 20)
  k.cyl(p, 0.026, 0.026, 0.07, m.blue, -0.27, 1.07, -0.28, 16)
  k.box(p, 0.03, 0.005, 0.004, im.amber, -0.27, 0.99, -0.241, false)
}

/**
 * An echocardiography couch along local z (head at −z): the electric base on its column with the
 * hand control, the backrest raised a little, and on its left (+x) side the drop-away cut-out at
 * the chest, lowered, so the probe reaches the apex with the patient on their left side; a pillow,
 * the paper roll on its holder, a side rail.
 */
export function echoCouch(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const im = imagingMats(e)
  const top = 0.66
  k.soft(p, 0.62, 0.08, 1.6, 0.03, im.dark, 0, 0.04, 0.05)
  for (const sz of [-1, 1]) for (const sx of [-1, 1]) k.cyl(p, 0.025, 0.03, 0.02, im.rubber, sx * 0.26, 0.01, 0.05 + sz * 0.72, 12)
  k.soft(p, 0.36, top - 0.2, 0.7, 0.05, im.shell, 0, 0.08 + (top - 0.2) / 2, 0.1)
  k.box(p, 0.37, 0.01, 0.6, im.reveal, 0, top - 0.25, 0.1, false)
  k.soft(p, 0.68, 0.05, 1.86, 0.015, im.grey, 0, top - 0.06, 0.05)
  k.soft(p, 0.7, 0.09, 1.0, 0.03, m.vinylSeat, 0, top, 0.45)
  const back = group(p, 0, top, -0.05)
  back.rotation.x = 0.22
  k.soft(back, 0.4, 0.09, 0.85, 0.03, m.vinylSeat, -0.15, 0, -0.42)
  k.soft(back, 0.3, 0.09, 0.3, 0.03, m.vinylSeat, 0.2, 0, -0.72)
  const flap = group(p, 0.35, top - 0.05, -0.38)
  flap.rotation.z = -1.2
  k.soft(flap, 0.3, 0.06, 0.4, 0.02, m.vinylSeat, -0.15, 0, 0)
  k.soft(back, 0.45, 0.12, 0.3, 0.06, m.sheet, -0.12, 0.08, -0.72)
  k.box(p, 0.6, 0.004, 0.9, m.paper, 0, top + 0.047, 0.45, false)
  rod(e, p, 0.045, 0.52, m.paper, 0, top - 0.04, 0.98, 'x', 18)
  for (const s of [-1, 1]) k.box(p, 0.02, 0.06, 0.03, im.grey, s * 0.27, top - 0.04, 0.98)
  rod(e, p, 0.014, 0.8, im.aluminium, -0.37, top + 0.1, 0.4, 'z', 10)
  for (const zz of [0.0, 0.8]) k.box(p, 0.02, 0.12, 0.02, im.aluminium, -0.37, top + 0.04, zz)
  // The hand control on its coiled lead, hung on the rail.
  k.soft(p, 0.05, 0.12, 0.025, 0.01, im.shell, -0.39, top + 0.02, 0.6)
}

/**
 * A stress-test treadmill, the walker facing +z: the frame with its side covers and the
 * anti-slip side steps, the black belt between its end rollers, the motor hood at the front,
 * side handrails and the front handrail bar on the uprights, the console with its display and keys,
 * the red emergency stop and the magnetic safety key on its lanyard.
 */
export function treadmill(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const im = imagingMats(e)
  // Frame, side covers, steps, the belt and its rollers.
  k.soft(p, 0.82, 0.12, 2.0, 0.03, im.dark, 0, 0.08, -0.05)
  for (const s of [-1, 1]) {
    k.soft(p, 0.13, 0.07, 1.7, 0.02, im.shell, s * 0.35, 0.18, -0.1)
    k.box(p, 0.11, 0.004, 1.6, im.rubber, s * 0.35, 0.217, -0.1, false)
  }
  k.box(p, 0.54, 0.012, 1.62, m.black, 0, 0.2, -0.12, false)
  for (const zz of [-0.95, 0.72]) rod(e, p, 0.045, 0.56, im.aluminium, 0, 0.165, zz, 'x', 20)
  for (const s of [-1, 1]) k.soft(p, 0.06, 0.06, 0.1, 0.02, im.rubber, s * 0.33, 0.03, -1.0)
  // The motor hood and its vents.
  k.soft(p, 0.84, 0.28, 0.4, 0.08, im.shell, 0, 0.2, 0.86)
  for (let i = 0; i < 5; i++) k.box(p, 0.4, 0.006, 0.004, im.reveal, 0, 0.18 + i * 0.03, 1.062, false)
  // Uprights, side rails, front handrail.
  for (const s of [-1, 1]) {
    const up = k.soft(p, 0.06, 1.12, 0.09, 0.02, im.shell, s * 0.39, 0.82, 0.86)
    up.rotation.x = -0.1
    put(p, bentTube(e, 'tmtRail', [[0, 0, 0.1], [0, 0, -0.65], [0, -0.12, -0.72]], 0.017, 0.05), im.aluminium, s * 0.39, 1.0, 0.72)
    k.soft(p, 0.05, 0.05, 0.4, 0.02, im.rubber, s * 0.39, 1.0, 0.4)
  }
  put(p, bentTube(e, 'tmtFront', [[-0.39, 1.0, 0.8], [-0.3, 1.02, 0.62], [0.3, 1.02, 0.62], [0.39, 1.0, 0.8]], 0.017, 0.05), im.aluminium)
  // The console.
  const con = group(p, 0, 1.36, 0.9)
  con.rotation.x = -0.4
  k.soft(con, 0.8, 0.26, 0.1, 0.04, im.shell, 0, 0, 0)
  k.box(con, 0.26, 0.12, 0.003, e.o.screen('tmtDisplay', 192, 96, (g, w, h) => {
    g.fillStyle = '#071226'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#ffffff'
    g.font = `700 ${h * 0.24}px Helvetica`
    g.fillText('BRUCE · STAGE 2', w * 0.04, h * 0.3)
    g.fillStyle = '#7fd0ff'
    g.font = `500 ${h * 0.2}px Helvetica`
    g.fillText('3.4 km/h   12 %', w * 0.04, h * 0.62)
    g.fillText('05:42', w * 0.04, h * 0.9)
  }, 1.0), -0.12, 0.02, 0.051, false)
  keys(e, con, 6)
  k.soft(con, 0.1, 0.08, 0.04, 0.01, im.stopBase, 0.31, 0, 0.06)
  k.cyl(con, 0.032, 0.028, 0.03, im.stop, 0.31, 0, 0.09, 20).rotation.x = PI / 2
  // The safety key's magnet and its lanyard with the clip.
  k.cyl(con, 0.02, 0.02, 0.012, m.red, 0.2, -0.08, 0.06, 16).rotation.x = PI / 2
  put(p, tube(e, 'tmtLanyard', [[0.2, 1.3, 1.0], [0.18, 1.12, 0.95], [0.12, 1.02, 0.78]], 0.004), m.red)
  k.box(p, 0.03, 0.05, 0.012, im.dark, 0.12, 1.0, 0.76)
}

/** Six keys in two rows on a console: speed and grade up/down, start, cool-down. */
function keys(e: OpdCtx, p: Object3D, n: number) {
  const im = imagingMats(e)
  for (let i = 0; i < n; i++) e.k.soft(p, 0.05, 0.03, 0.012, 0.005, i === 4 ? im.green : im.keys, 0.08 + (i % 3) * 0.06, 0.05 - Math.floor(i / 3) * 0.05, 0.052)
}

/**
 * The exercise ECG system on its trolley, physician at +z: the trolley's frame, worktop and lower
 * shelf; a 24" monitor with the 12 leads live, keyboard and mouse; the wireless acquisition module
 * on its cable; the automatic BP unit with its cuff hose; the thermal printer on the lower shelf
 * with its fan-folded paper; the PC.
 */
export function stressSystem(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const im = imagingMats(e)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * 0.31, sz * 0.24, 0.05)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(p, 0.035, 0.76, 0.035, im.aluminium, sx * 0.33, 0.5, sz * 0.25)
  k.soft(p, 0.74, 0.03, 0.58, 0.01, im.shell, 0, 0.15, 0)
  k.soft(p, 0.74, 0.03, 0.58, 0.01, im.shell, 0, 0.87, 0)
  // Below: the printer and its paper, the PC.
  k.soft(p, 0.4, 0.14, 0.34, 0.02, im.shell, -0.14, 0.24, 0)
  k.box(p, 0.3, 0.004, 0.06, im.reveal, -0.14, 0.31, 0.17, false)
  k.box(p, 0.3, 0.08, 0.2, m.paper, -0.14, 0.36, -0.02, false)
  k.soft(p, 0.18, 0.42, 0.42, 0.008, m.darkPlastic, 0.22, 0.38, -0.04)
  // On top: monitor, keyboard, mouse; the acquisition module and its cable; the BP unit.
  monitor(e, p, 0, 0.885, -0.15, 0, 0.58, 0.34, ecgTrace(e, 'stress'))
  keyboard(e, p, -0.05, 0.885, 0.13)
  mouse(e, p, 0.25, 0.885, 0.15)
  k.soft(p, 0.14, 0.05, 0.1, 0.015, im.shell, -0.36, 0.91, 0.12)
  k.box(p, 0.04, 0.004, 0.02, im.green, -0.36, 0.936, 0.15, false)
  put(p, tube(e, 'stressCable', [[-0.36, 0.91, 0.17], [-0.42, 0.7, 0.24], [-0.4, 0.42, 0.22], [-0.36, 0.5, 0.2]], 0.006), m.charcoal)
  k.soft(p, 0.2, 0.15, 0.17, 0.02, im.grey, 0.38, 0.96, -0.02)
  k.box(p, 0.09, 0.05, 0.003, e.o.screen('bpUnit', 64, 40, (g, w, h) => {
    g.fillStyle = '#04120a'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#4bff72'
    g.font = `700 ${h * 0.5}px Helvetica`
    g.fillText('142/86', 2, h * 0.7)
  }, 1.0), 0.38, 0.99, 0.067, false)
  put(p, tube(e, 'stressBpHose', [[0.45, 0.96, 0.05], [0.5, 0.72, 0.12], [0.47, 0.5, 0.1], [0.42, 0.6, 0.08]], 0.005), im.grey)
}

