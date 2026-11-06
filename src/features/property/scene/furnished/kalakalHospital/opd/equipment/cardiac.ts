import { type Material, type Object3D } from 'three'
import { PI } from '../../../kit'
import { rng } from '../../../textures'
import { bentTube, castor, group, lathe, put, rod, tube } from '../../erKit'
import type { OpdCtx } from '../ctx'
import { imagingMats } from './imaging'

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

/**
 * A cart-based echocardiography system, operator at +z: the four-castor base, the body with its
 * vents, the control panel (touch screen, keys, trackball) on its height-adjustable column, the
 * 22" monitor on its articulating arm, three cardiac probes in their holders with cables, the ECG
 * lead module and its leads at the side, a gel warmer.
 */
export function echoMachine(e: OpdCtx, p: Object3D, image: Material) {
  const { k, m } = e
  const im = imagingMats(e)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * 0.24, sz * 0.32, 0.055, sx * 0.2, sz > 0)
  k.soft(p, 0.56, 0.3, 0.76, 0.06, im.shell, 0, 0.27, 0)
  k.soft(p, 0.5, 0.42, 0.42, 0.05, im.grey, 0, 0.62, -0.12)
  for (let i = 0; i < 5; i++) k.box(p, 0.3, 0.01, 0.004, im.dark, 0, 0.52 + i * 0.04, 0.095, false)
  // The control panel, tilted to the operator.
  const panel = group(p, 0, 0.9, 0.06)
  panel.rotation.x = 0.12
  k.soft(panel, 0.62, 0.07, 0.5, 0.03, im.shell, 0, 0, 0)
  k.box(panel, 0.26, 0.004, 0.16, e.o.screen('echoTouch', 160, 100, (g, w, h) => {
    g.fillStyle = '#16202c'
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 12; i++) {
      g.fillStyle = i === 3 ? '#1f6fd1' : '#3a4a5c'
      g.fillRect(6 + (i % 4) * 38, 8 + Math.floor(i / 4) * 30, 32, 24)
    }
  }, 0.9), 0, 0.037, -0.12, false)
  for (let i = 0; i < 14; i++) k.box(panel, 0.03, 0.01, 0.022, i % 5 === 0 ? im.accent : im.grey, -0.24 + (i % 7) * 0.035, 0.038, 0.06 + Math.floor(i / 7) * 0.03, false)
  k.sphere(panel, 0.026, m.black, 0.16, 0.04, 0.1)
  for (let i = 0; i < 6; i++) put(panel, lathe(e, 'tgcKnob', [[0, 0], [0.008, 0], [0.008, 0.012], [0, 0.012]], 10), im.dark, 0.1 + (i % 3) * 0.04, 0.035, -0.05 - Math.floor(i / 3) * 0.035, false)
  // The monitor on its arm.
  put(p, bentTube(e, 'echoArm', [[0, 0.95, -0.2], [0, 1.15, -0.22], [0, 1.2, -0.15]], 0.025, 0.06), im.grey)
  const s = group(p, 0, 1.42, -0.12)
  s.rotation.x = -0.1
  k.soft(s, 0.54, 0.36, 0.05, 0.02, im.dark, 0, 0, 0)
  k.box(s, 0.5, 0.31, 0.004, image, 0, 0, 0.026, false)
  // Probes in their holders; cables looping down.
  for (const [i, x] of [-0.3, -0.33, 0.3].entries()) {
    const zz = i === 1 ? 0.0 : 0.18
    k.soft(p, 0.06, 0.08, 0.07, 0.012, im.grey, x, 0.88, zz)
    put(p, lathe(e, 'echoProbe', [[0, 0], [0.012, 0], [0.02, 0.04], [0.018, 0.1], [0.008, 0.12], [0, 0.12]], 14), im.front, x, 0.87, zz)
    put(p, tube(e, `echoCable${i}`, [[x, 0.87, zz], [x * 1.15, 0.55, zz + 0.12], [x * 0.7, 0.35, zz + 0.18], [x * 0.4, 0.45, 0.3]], 0.0045), m.charcoal)
  }
  // The ECG module at the side with its three leads; the gel warmer.
  k.soft(p, 0.06, 0.1, 0.12, 0.01, im.dark, 0.3, 0.7, -0.15)
  for (let i = 0; i < 3; i++) put(p, tube(e, `echoLead${i}`, [[0.33, 0.68, -0.15], [0.42, 0.5 - i * 0.05, -0.05], [0.38, 0.3, 0.05 + i * 0.05]], 0.0025), [m.whitePlastic, m.black, m.red][i])
  k.cyl(p, 0.035, 0.035, 0.14, im.grey, -0.27, 0.95, -0.26, 16)
  k.cyl(p, 0.025, 0.025, 0.06, m.blue, -0.27, 1.05, -0.26, 14)
}

/**
 * An echocardiography couch along local z (head at −z): the electric base, the backrest raised a
 * little, and on its left (+x) side the drop-away cut-out at the chest, lowered, so the probe reaches
 * the apex with the patient on their left side; a pillow, paper roll, a side rail.
 */
export function echoCouch(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const im = imagingMats(e)
  const top = 0.66
  k.soft(p, 0.6, 0.08, 1.5, 0.03, im.dark, 0, 0.04, 0.05)
  k.soft(p, 0.36, top - 0.18, 0.7, 0.05, im.shell, 0, 0.08 + (top - 0.18) / 2, 0.1)
  // The mattress: the foot section, and the back section beside the cut-out on the left.
  k.soft(p, 0.7, 0.09, 1.0, 0.03, m.vinylSeat, 0, top, 0.45)
  const back = group(p, 0, top, -0.05)
  back.rotation.x = 0.22
  k.soft(back, 0.4, 0.09, 0.85, 0.03, m.vinylSeat, -0.15, 0, -0.42)
  k.soft(back, 0.3, 0.09, 0.3, 0.03, m.vinylSeat, 0.2, 0, -0.72)
  // The cut-out's flap, swung down at the chest.
  const flap = group(p, 0.35, top - 0.05, -0.38)
  flap.rotation.z = -1.2
  k.soft(flap, 0.3, 0.06, 0.4, 0.02, m.vinylSeat, -0.15, 0, 0)
  k.soft(back, 0.45, 0.12, 0.3, 0.06, m.sheet, -0.12, 0.08, -0.72)
  k.box(p, 0.6, 0.004, 0.9, m.paper, 0, top + 0.047, 0.45, false)
  rod(e, p, 0.045, 0.52, m.paper, 0, top - 0.04, 0.98, 'x', 18)
  rod(e, p, 0.014, 0.8, im.grey, -0.37, top + 0.1, 0.4, 'z', 10)
}

/**
 * A stress-test treadmill, the walker facing +z: the 2 m deck on its frame with the black belt,
 * the motor hood at the front, side handrails and the front handrail bar, the console with its
 * display and the red emergency stop on the front uprights, the safety lanyard.
 */
export function treadmill(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const im = imagingMats(e)
  // Deck and belt.
  k.soft(p, 0.86, 0.2, 2.05, 0.04, im.grey, 0, 0.1, 0)
  k.box(p, 0.56, 0.012, 1.6, m.black, 0, 0.206, -0.12, false)
  for (const s of [-1, 1]) k.box(p, 0.13, 0.03, 1.6, im.dark, s * 0.36, 0.215, -0.12)
  rod(e, p, 0.045, 0.6, im.dark, 0, 0.12, -0.98, 'x', 16)
  // The motor hood at the front.
  k.soft(p, 0.86, 0.3, 0.38, 0.08, im.shell, 0, 0.2, 0.86)
  // Uprights and the console.
  for (const s of [-1, 1]) {
    const up = k.box(p, 0.06, 1.15, 0.08, im.shell, s * 0.4, 0.75, 0.82)
    up.rotation.x = -0.12
    // Side handrails, from the front uprights back along the deck.
    put(p, bentTube(e, 'tmtRail', [[0, 0, 0], [0, 0, -0.75], [0, -0.1, -0.8]], 0.018, 0.05), im.grey, s * 0.4, 1.05, 0.72)
  }
  put(p, bentTube(e, 'tmtFront', [[-0.4, 1.05, 0.72], [-0.3, 1.05, 0.62], [0.3, 1.05, 0.62], [0.4, 1.05, 0.72]], 0.018, 0.05), im.grey)
  const con = group(p, 0, 1.38, 0.88)
  con.rotation.x = -0.35
  k.soft(con, 0.78, 0.26, 0.1, 0.04, im.shell, 0, 0, 0)
  k.box(con, 0.26, 0.12, 0.004, e.o.screen('tmtDisplay', 192, 96, (g, w, h) => {
    g.fillStyle = '#071226'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#ffffff'
    g.font = `700 ${h * 0.24}px Helvetica`
    g.fillText('STAGE 2', w * 0.05, h * 0.3)
    g.fillStyle = '#7fd0ff'
    g.font = `500 ${h * 0.2}px Helvetica`
    g.fillText('3.4 km/h  12 %', w * 0.05, h * 0.62)
    g.fillText('05:42', w * 0.05, h * 0.9)
  }, 1.0), -0.12, 0.02, 0.052, false)
  for (let i = 0; i < 4; i++) k.box(con, 0.05, 0.03, 0.01, im.grey, 0.12 + (i % 2) * 0.07, 0.04 - Math.floor(i / 2) * 0.05, 0.05, false)
  k.box(con, 0.09, 0.07, 0.04, im.stopBase, 0.31, 0, 0.06)
  k.cyl(con, 0.03, 0.03, 0.03, im.stop, 0.31, 0, 0.09, 20).rotation.x = PI / 2
  put(p, tube(e, 'tmtLanyard', [[0.31, 1.32, 0.98], [0.28, 1.18, 0.95], [0.2, 1.1, 0.8]], 0.004), m.red)
}

/**
 * The exercise ECG system on its trolley, physician at +z: a 24" monitor showing the 12 leads,
 * keyboard and trackball, the acquisition module with its patient cable, the automatic BP unit,
 * the thermal printer with its fan-folded paper.
 */
export function stressSystem(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const im = imagingMats(e)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * 0.3, sz * 0.24, 0.05)
  for (const sx of [-1, 1]) k.box(p, 0.05, 0.9, 0.05, im.grey, sx * 0.3, 0.55, -0.2)
  k.soft(p, 0.7, 0.03, 0.55, 0.012, im.shell, 0, 0.12, 0)
  k.soft(p, 0.7, 0.03, 0.55, 0.012, im.shell, 0, 0.85, 0)
  // The printer on the lower shelf with its paper; the PC.
  k.soft(p, 0.38, 0.14, 0.34, 0.02, im.shell, -0.12, 0.21, 0)
  k.box(p, 0.32, 0.08, 0.2, m.paper, 0.18, 0.18, 0)
  k.soft(p, 0.18, 0.4, 0.4, 0.01, m.darkPlastic, 0.2, 0.42, -0.05)
  // On top: the monitor, keyboard, the acquisition module and its cable, the BP unit.
  const s = group(p, 0, 0.87, -0.15)
  k.box(s, 0.22, 0.012, 0.17, m.darkPlastic, 0, 0.006, 0)
  k.box(s, 0.045, 0.26, 0.025, m.darkPlastic, 0, 0.14, -0.04)
  k.box(s, 0.58, 0.36, 0.025, m.black, 0, 0.42, -0.02)
  k.box(s, 0.56, 0.33, 0.004, ecgTrace(e, 'stress'), 0, 0.425, -0.005, false)
  k.box(p, 0.44, 0.015, 0.14, m.darkPlastic, -0.04, 0.873, 0.14)
  k.sphere(p, 0.022, m.black, 0.26, 0.885, 0.14)
  k.soft(p, 0.14, 0.05, 0.1, 0.015, im.shell, -0.36, 0.98, 0.1)
  put(p, tube(e, 'stressCable', [[-0.36, 0.98, 0.15], [-0.45, 0.8, 0.3], [-0.5, 1.0, 0.6]], 0.006), m.charcoal)
  k.soft(p, 0.2, 0.14, 0.16, 0.02, im.grey, 0.38, 0.95, 0.0)
  k.box(p, 0.08, 0.05, 0.004, e.o.screen('bpUnit', 64, 40, (g, w, h) => {
    g.fillStyle = '#04120a'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#4bff72'
    g.font = `700 ${h * 0.5}px Helvetica`
    g.fillText('142/86', 2, h * 0.7)
  }, 1.0), 0.38, 0.97, 0.082, false)
}
