import { CylinderGeometry, DoubleSide, ExtrudeGeometry, MeshPhysicalMaterial, MeshStandardMaterial, Path, type Material, type Object3D, type Shape } from 'three'
import { PI } from '../../../kit'
import { castor, geo, group, lathe, put, rod, roundRect, starBase, tube, bentTube } from '../../erKit'
import { taskChair } from '../../erFurniture'
import type { OpdCtx } from '../ctx'

/*
 * The imaging department's machines, each in its own frame at true size, front towards +z: a
 * 1.5 T superconducting MRI magnet and its docking patient table, a 64-slice CT gantry and its
 * motorised table, the contrast injector, the coil cart, the operators' consoles and the
 * radiologists' reading desks. The magnet and gantry are moulded shells (extruded rounded
 * sections with their bores cut through, turned flares at the bore), in the warm white and pale
 * grey of the trade with one quiet accent line.
 */

const cache = new WeakMap<object, ReturnType<typeof makeMats>>()

function makeMats(e: OpdCtx) {
  const glow = (colour: string, intensity: number) => e.lighting.glow(new MeshStandardMaterial({ color: colour, emissive: colour, emissiveIntensity: intensity, roughness: 0.4 }), 0.8)
  return {
    /** Covers: a warm white moulded plastic with a light clearcoat; the fronts a shade cooler. */
    shell: new MeshPhysicalMaterial({ color: '#f1f0ec', roughness: 0.32, clearcoat: 0.5, clearcoatRoughness: 0.35 }),
    front: new MeshPhysicalMaterial({ color: '#f7f7f5', roughness: 0.28, clearcoat: 0.55, clearcoatRoughness: 0.3 }),
    grey: new MeshPhysicalMaterial({ color: '#c3c8cd', roughness: 0.4, clearcoat: 0.3, clearcoatRoughness: 0.4 }),
    dark: new MeshStandardMaterial({ color: '#3a4047', roughness: 0.45 }),
    /** The bore's lining, matt pale grey, seen from inside too. */
    bore: new MeshStandardMaterial({ color: '#dcdedf', roughness: 0.75, side: DoubleSide }),
    /** The accent line round the bore and the covers' joint: a muted petrol blue. */
    accent: new MeshStandardMaterial({ color: '#2f6f8f', roughness: 0.35, metalness: 0.1 }),
    foam: new MeshStandardMaterial({ color: '#2b2f35', roughness: 0.85 }),
    pad: new MeshPhysicalMaterial({ color: '#5b6f86', roughness: 0.55, clearcoat: 0.2 }),
    boreLight: glow('#eaf4ff', 1.3),
    laser: glow('#ff2a1f', 2.2),
    green: glow('#3cff8a', 1.6),
    amber: glow('#ffb020', 1.4),
    stop: new MeshStandardMaterial({ color: '#c8161d', roughness: 0.35 }),
    stopBase: new MeshStandardMaterial({ color: '#f2c200', roughness: 0.45 }),
    syringe: new MeshPhysicalMaterial({ color: '#e8f2f6', roughness: 0.1, transparent: true, opacity: 0.55, depthWrite: false }),
  }
}

export function imagingMats(e: OpdCtx) {
  let m = cache.get(e.o)
  if (!m) cache.set(e.o, (m = makeMats(e)))
  return m
}

/** A rounded section w × h (corner r) with a round bore of radius br at height by above its centre, extruded `depth` along z, centred. */
function bored(e: OpdCtx, key: string, w: number, h: number, r: number, br: number, by: number, depth: number, bevel = 0.03) {
  return geo(e, `bored${key}`, () => {
    const s = roundRect(w - 2 * bevel, h - 2 * bevel, r) as Shape
    const hole = new Path()
    hole.absarc(0, by, br + bevel, 0, PI * 2, true)
    s.holes.push(hole)
    const g = new ExtrudeGeometry(s, { depth: Math.max(0.002, depth - 2 * bevel), bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 32 })
    g.translate(0, 0, -(depth - 2 * bevel) / 2)
    return g
  })
}

/** A flat outline strip (an accent line) following a rounded rectangle, `t` wide, `d` deep. */
function outline(e: OpdCtx, key: string, w: number, h: number, r: number, t: number, d: number) {
  return geo(e, `outline${key}`, () => {
    const s = roundRect(w, h, r) as Shape
    s.holes.push(roundRect(w - 2 * t, h - 2 * t, Math.max(0.01, r - t), 0, 0, new Path()) as Path)
    const g = new ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 24 })
    g.translate(0, 0, -d / 2)
    return g
  })
}

/** An open tube (a bore's lining) of radius r, `len` along z. */
function boreTube(e: OpdCtx, r: number, len: number) {
  return geo(e, `boreTube${r}|${len}`, () => {
    const g = new CylinderGeometry(r, r, len, 32, 1, true)
    g.rotateX(PI / 2)
    return g
  })
}

/** A turned flare round a bore's mouth: from the bore's radius out and back to the cover, facing +z. */
function flare(e: OpdCtx, key: string, r: number, out: number, depth: number) {
  return geo(e, `flare${key}`, () => {
    const g = lathe(e, `flareL${key}`, [[r, 0], [r + out * 0.25, depth * 0.55], [r + out * 0.7, depth * 0.9], [r + out, depth]], 32).clone()
    g.rotateX(PI / 2)
    return g
  })
}

/** A small control panel on a cover: a dark rounded plate with a column of lit keys. */
function controlPanel(e: OpdCtx, p: Object3D, x: number, y: number, z: number, w: number, h: number) {
  const { k } = e
  const m = imagingMats(e)
  k.soft(p, w, h, 0.03, 0.012, m.dark, x, y, z)
  for (let i = 0; i < 4; i++) {
    k.box(p, w * 0.55, h * 0.12, 0.008, i === 0 ? m.green : i === 3 ? m.amber : m.grey, x, y + h * 0.3 - i * h * 0.2, z + 0.017, false)
  }
}

/* ---------- MRI ---------- */

/** The bore's centre above the floor, the bore's clear radius (a 70 cm bore). */
export const MRI_BORE = { y: 1.1, r: 0.35 }

/**
 * A 1.5 T superconducting MRI magnet, its bore along z, the patient end (front) towards +z: the
 * main shell, 2.15 × 2.25 m, with a flared front cover carrying the control panels either side of
 * the bore and the patient-communication display over it, the rear cover, the accent line at the
 * covers' joint, the lit bore lining, the plinth; the quench vent rising from its top to the ceiling.
 */
export function mriMagnet(e: OpdCtx, p: Object3D, ceiling: number) {
  const { k } = e
  const m = imagingMats(e)
  const W = 2.15
  const H = 2.25
  const cy = H / 2
  const by = MRI_BORE.y - cy
  const br = MRI_BORE.r
  // The main shell and its covers.
  put(p, bored(e, 'mriBody', W, H, 0.62, br + 0.04, by, 1.5, 0.04), m.shell, 0, cy, 0)
  put(p, bored(e, 'mriFront', W + 0.04, H + 0.02, 0.66, br + 0.02, by, 0.2, 0.05), m.front, 0, cy, 0.84)
  put(p, bored(e, 'mriRear', W - 0.02, H - 0.04, 0.6, br + 0.02, by, 0.16, 0.04), m.front, 0, cy, -0.82)
  put(p, outline(e, 'mriAccent', W + 0.03, H + 0.01, 0.65, 0.025, 0.03), m.accent, 0, cy, 0.74)
  put(p, outline(e, 'mriAccentRear', W - 0.01, H - 0.03, 0.6, 0.02, 0.03), m.grey, 0, cy, -0.74)
  // The bore: its lining right through, the flare at the front, a soft light along its top.
  put(p, boreTube(e, br, 1.9), m.bore, 0, MRI_BORE.y, 0, false)
  put(p, flare(e, 'mri', br + 0.01, 0.16, 0.12), m.front, 0, MRI_BORE.y, 0.94, false)
  put(p, geo(e, 'mriTrim', () => outlineRing(br + 0.17, 0.018)), m.accent, 0, MRI_BORE.y, 1.065, false)
  k.box(p, 0.08, 0.006, 1.7, m.boreLight, 0, MRI_BORE.y + br - 0.01, 0, false)
  // Control panels either side of the bore; the communication display over it.
  for (const s of [-1, 1]) controlPanel(e, p, s * 0.62, MRI_BORE.y + 0.05, 0.955, 0.16, 0.3)
  k.soft(p, 0.34, 0.13, 0.03, 0.015, m.dark, 0, MRI_BORE.y + br + 0.3, 0.95)
  k.box(p, 0.3, 0.09, 0.004, e.o.screen('mriComm', 256, 80, (g, w, h) => {
    g.fillStyle = '#04121f'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#6fd0ff'
    g.font = `700 ${h * 0.42}px Helvetica`
    g.fillText('BRAIN · T2 AX', w * 0.06, h * 0.45)
    g.fillStyle = '#ffffff'
    g.font = `500 ${h * 0.32}px Helvetica`
    g.fillText('03:12  remaining', w * 0.06, h * 0.85)
  }, 1.0), 0, MRI_BORE.y + br + 0.3, 0.967, false)
  // The plinth under it, and the quench vent from its top.
  k.box(p, 1.7, 0.06, 1.6, m.dark, 0, 0.03, 0)
  k.cyl(p, 0.09, 0.09, Math.max(0.1, ceiling - H + 0.05), e.m.stainless, 0, H + (ceiling - H) / 2 - 0.02, -0.45, 24)
  k.cyl(p, 0.14, 0.14, 0.06, m.grey, 0, H + 0.01, -0.45, 24)
  k.cyl(p, 0.16, 0.16, 0.03, e.m.stainless, 0, ceiling - 0.03, -0.45, 24)
}

/** A thin flat ring of radius r and width t, facing z. */
function outlineRing(r: number, t: number) {
  const shape = roundRect(2 * r, 2 * r, r) as Shape
  const hole = new Path()
  hole.absarc(0, 0, r - t, 0, PI * 2, true)
  shape.holes.push(hole)
  return new ExtrudeGeometry(shape, { depth: 0.008, bevelEnabled: false, curveSegments: 32 })
}

/**
 * The MRI's patient table, docked at the magnet's front: the pedestal that lifts and drives the
 * cradle (its height and travel switches), the cradle 2.3 m long with its foam mattress and knee
 * wedge, a 16-channel head coil at the bore end, side rails, the tabletop's handle at its foot.
 * Built from the magnet's front (z = 0) outwards along +z.
 */
export function mriTable(e: OpdCtx, p: Object3D) {
  const { k } = e
  const m = imagingMats(e)
  const top = 0.8
  // The pedestal, wide at the floor, tapering under the cradle.
  k.soft(p, 0.64, 0.08, 1.7, 0.03, m.dark, 0, 0.04, 1.95)
  k.soft(p, 0.56, top - 0.16, 1.55, 0.06, m.shell, 0, 0.08 + (top - 0.16) / 2, 1.95)
  k.box(p, 0.5, 0.012, 1.4, m.accent, 0, top - 0.09, 1.95, false)
  for (const s of [-1, 1]) {
    k.soft(p, 0.02, 0.1, 0.18, 0.008, m.dark, s * 0.285, 0.55, 2.55)
    k.box(p, 0.005, 0.03, 0.03, m.green, s * 0.296, 0.58, 2.55, false)
  }
  // The cradle, out of the bore's mouth to its foot.
  k.soft(p, 0.56, 0.06, 2.3, 0.025, m.front, 0, top - 0.03, 2.05)
  k.soft(p, 0.5, 0.06, 1.9, 0.025, m.foam, 0, top + 0.03, 2.25)
  const wedge = k.soft(p, 0.46, 0.14, 0.38, 0.05, m.pad, 0, top + 0.1, 2.6)
  wedge.rotation.x = 0.1
  // The head coil at the bore end: its base and its open cage.
  k.soft(p, 0.36, 0.08, 0.42, 0.03, m.grey, 0, top + 0.06, 1.25)
  put(p, geo(e, 'headCoil', () => {
    const s = roundRect(0.36, 0.3, 0.14) as Shape
    s.holes.push(roundRect(0.27, 0.24, 0.1, 0, -0.02, new Path()) as Path)
    const g = new ExtrudeGeometry(s, { depth: 0.36, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2, curveSegments: 16 })
    g.translate(0, 0, -0.18)
    return g
  }), m.front, 0, top + 0.24, 1.25)
  for (const s of [-1, 1]) k.box(p, 0.03, 0.12, 0.3, m.grey, s * 0.07, top + 0.32, 1.25, false)
  // Side rails along the cradle, the handle at its foot.
  for (const s of [-1, 1]) rod(e, p, 0.012, 1.2, m.grey, s * 0.29, top + 0.02, 2.6, 'z', 12)
  put(p, bentTube(e, 'mriTableHandle', [[-0.2, top, 3.18], [-0.2, top + 0.12, 3.25], [0.2, top + 0.12, 3.25], [0.2, top, 3.18]], 0.014, 0.04), m.grey)
}

/** A trolley of MRI coils: knee and shoulder coils, a flexible body array, a spare head coil, positioning pads; all MR-conditional. */
export function coilCart(e: OpdCtx, p: Object3D) {
  const { k } = e
  const m = imagingMats(e)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * 0.42, sz * 0.24, 0.045)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(p, 0.03, 1.0, 0.03, m.grey, sx * 0.44, 0.58, sz * 0.26)
  for (const y of [0.22, 0.62, 1.05]) k.box(p, 0.92, 0.02, 0.56, m.front, 0, y, 0)
  // Top: the body array draped over its saddle, a knee coil.
  const body = k.soft(p, 0.5, 0.04, 0.4, 0.02, m.dark, -0.18, 1.1, 0)
  body.rotation.z = 0.08
  put(p, geo(e, 'kneeCoil', () => outlineRing(0.12, 0.05).translate(0, 0, -0.004)), m.grey, 0.25, 1.2, 0).scale.set(1, 1, 30)
  // Middle: a shoulder coil, a spare head coil; bottom: pads and wedges.
  k.soft(p, 0.28, 0.2, 0.25, 0.08, m.grey, -0.22, 0.73, 0)
  k.soft(p, 0.3, 0.24, 0.32, 0.1, m.front, 0.2, 0.75, 0)
  for (let i = 0; i < 4; i++) k.soft(p, 0.2, 0.08, 0.3, 0.035, m.pad, -0.33 + i * 0.22, 0.27, 0)
}

/* ---------- CT ---------- */

/** The CT gantry's bore: its centre above the floor and its radius (an 80 cm aperture). */
export const CT_BORE = { y: 1.02, r: 0.4 }

/**
 * A 64-slice CT gantry facing +z: its rounded housing, 1.95 m square and 0.85 m deep on a narrower
 * foot, the front cover with the flared aperture and accent ring, the laser positioning lights at
 * the top and sides of the bore, the control panels and the breath-hold display; the rear cover.
 */
export function ctGantry(e: OpdCtx, p: Object3D) {
  const { k } = e
  const m = imagingMats(e)
  const W = 1.95
  const H = 1.9
  const base = 0.14
  const cy = base + H / 2
  const by = CT_BORE.y - cy
  const br = CT_BORE.r
  k.soft(p, 1.3, base, 0.9, 0.03, m.dark, 0, base / 2, 0)
  put(p, bored(e, 'ctBody', W, H, 0.55, br + 0.03, by, 0.62, 0.04), m.shell, 0, cy, 0)
  put(p, bored(e, 'ctFront', W + 0.03, H + 0.02, 0.57, br + 0.01, by, 0.14, 0.04), m.front, 0, cy, 0.36)
  put(p, bored(e, 'ctRear', W - 0.02, H - 0.02, 0.53, br + 0.01, by, 0.12, 0.035), m.front, 0, cy, -0.35)
  put(p, outline(e, 'ctAccent', W + 0.02, H + 0.01, 0.56, 0.02, 0.03), m.accent, 0, cy, 0.29)
  put(p, boreTube(e, br, 0.86), m.bore, 0, CT_BORE.y, 0, false)
  put(p, flare(e, 'ct', br + 0.005, 0.12, 0.08), m.front, 0, CT_BORE.y, 0.43, false)
  put(p, geo(e, 'ctTrim', () => outlineRing(br + 0.13, 0.016)), m.accent, 0, CT_BORE.y, 0.512, false)
  // Lasers: a slit over the bore and one either side, their red marks on the cover.
  k.box(p, 0.16, 0.012, 0.01, m.laser, 0, CT_BORE.y + br + 0.06, 0.435, false)
  for (const s of [-1, 1]) k.box(p, 0.012, 0.12, 0.01, m.laser, s * (br + 0.06), CT_BORE.y, 0.435, false)
  for (const s of [-1, 1]) controlPanel(e, p, s * 0.66, CT_BORE.y - 0.12, 0.44, 0.15, 0.26)
  // The breath-hold display with its countdown.
  k.soft(p, 0.26, 0.11, 0.025, 0.012, m.dark, 0, CT_BORE.y + br + 0.24, 0.44)
  k.box(p, 0.22, 0.07, 0.004, e.o.screen('ctBreath', 192, 64, (g, w, h) => {
    g.fillStyle = '#071a10'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#4bff72'
    g.font = `700 ${h * 0.6}px Helvetica`
    g.fillText('HOLD  08', w * 0.08, h * 0.72)
  }, 1.0), 0, CT_BORE.y + br + 0.24, 0.454, false)
}

/**
 * The CT's motorised patient table, built from the gantry's front (z = 0.45) out along +z: the
 * pedestal on its floor plate with the foot pedals, the carbon-fibre cradle 2.4 m long running into
 * the bore, the mattress, the head holder at the bore end, an arm board and a knee support.
 */
export function ctTable(e: OpdCtx, p: Object3D) {
  const { k } = e
  const m = imagingMats(e)
  const top = 0.88
  k.box(p, 0.7, 0.02, 1.8, m.dark, 0, 0.01, 1.75)
  k.soft(p, 0.5, top - 0.12, 1.3, 0.07, m.shell, 0, 0.02 + (top - 0.12) / 2, 1.85)
  k.box(p, 0.46, 0.012, 1.2, m.accent, 0, top - 0.1, 1.85, false)
  for (const s of [-1, 1]) k.soft(p, 0.1, 0.03, 0.16, 0.012, m.dark, s * 0.16, 0.035, 2.6)
  // The cradle: dark carbon, its mattress, the head holder in the bore end.
  k.soft(p, 0.48, 0.05, 2.4, 0.02, m.foam, 0, top - 0.04, 1.45)
  k.soft(p, 0.44, 0.05, 2.0, 0.02, m.pad, 0, top + 0.01, 1.65)
  put(p, geo(e, 'ctHead', () => {
    const s = roundRect(0.3, 0.16, 0.07) as Shape
    s.holes.push(roundRect(0.22, 0.16, 0.06, 0, 0.05, new Path()) as Path)
    const g = new ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: false, curveSegments: 12 })
    g.translate(0, 0, -0.15)
    return g
  }), m.front, 0, top + 0.05, 0.42)
  k.soft(p, 0.36, 0.12, 0.3, 0.05, m.pad, 0, top + 0.08, 2.3)
  // An arm board clipped to the side.
  k.soft(p, 0.14, 0.03, 0.6, 0.012, m.foam, 0.32, top - 0.02, 1.2)
}

/**
 * A dual-head contrast power injector on its pedestal: the castored base, the column with the
 * hand-held control display, the swinging head with its two syringes (contrast and saline) pointing
 * down, a warmer jacket on the contrast barrel.
 */
export function injector(e: OpdCtx, p: Object3D) {
  const { k } = e
  const m = imagingMats(e)
  starBase(e, p, 0.3, 0.09, m.grey, 0.03)
  put(p, lathe(e, 'injColumn', [[0, 0.1], [0.04, 0.1], [0.035, 1.1], [0, 1.1]], 20), m.shell)
  const disp = group(p, 0, 0.98, 0.08)
  disp.rotation.x = -0.4
  k.soft(disp, 0.24, 0.17, 0.04, 0.015, m.shell, 0, 0, 0)
  k.box(disp, 0.2, 0.12, 0.004, e.o.screen('injDisplay', 160, 96, (g, w, h) => {
    g.fillStyle = '#0d2747'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#ffffff'
    g.font = `700 ${h * 0.18}px Helvetica`
    g.fillText('A  80 ml  4.0 ml/s', w * 0.05, h * 0.3)
    g.fillStyle = '#7fd0ff'
    g.fillText('B  40 ml  4.0 ml/s', w * 0.05, h * 0.55)
    g.fillStyle = '#4bff72'
    g.fillRect(w * 0.05, h * 0.7, w * 0.4, h * 0.18)
  }, 0.95), 0, 0, 0.022, false)
  // The arm and head.
  rod(e, p, 0.025, 0.4, m.grey, 0.18, 1.18, 0, 'x', 16)
  const head = group(p, 0.42, 1.18, 0)
  head.rotation.z = -0.5
  k.soft(head, 0.2, 0.3, 0.16, 0.04, m.shell, 0, 0, 0)
  for (const s of [-1, 1]) {
    k.cyl(head, 0.03, 0.03, 0.26, m.syringe, s * 0.045, -0.26, 0.02, 20)
    k.cyl(head, 0.012, 0.004, 0.04, m.syringe, s * 0.045, -0.41, 0.02, 12)
  }
  k.cyl(head, 0.034, 0.034, 0.12, m.amber, -0.045, -0.2, 0.02, 20)
  put(p, tube(e, 'injLine', [[0.52, 0.8, 0.02], [0.6, 0.6, 0.2], [0.8, 0.85, 0.5]], 0.003), e.m.tubing)
}

/* ---------- consoles and reading desks ---------- */

/** An emergency stop: the red mushroom on its yellow box. */
export function emergencyStop(e: OpdCtx, p: Object3D, x: number, y: number, z: number) {
  const { k } = e
  const m = imagingMats(e)
  k.box(p, 0.09, 0.07, 0.09, m.stopBase, x, y + 0.035, z)
  k.cyl(p, 0.032, 0.032, 0.03, m.stop, x, y + 0.085, z, 20)
  k.cyl(p, 0.014, 0.014, 0.02, m.dark, x, y + 0.06, z, 12)
}

/** An intercom with its gooseneck microphone and talk key. */
export function intercom(e: OpdCtx, p: Object3D, x: number, y: number, z: number) {
  const { k } = e
  const m = imagingMats(e)
  k.soft(p, 0.16, 0.05, 0.14, 0.02, m.dark, x, y + 0.025, z)
  k.box(p, 0.05, 0.01, 0.04, m.green, x + 0.04, y + 0.052, z + 0.03, false)
  put(p, tube(e, 'gooseMic', [[0, 0, 0], [0, 0.12, -0.02], [0.03, 0.22, 0.04], [0.04, 0.24, 0.1]], 0.006), m.dark, x - 0.04, y + 0.05, z - 0.03)
  k.cyl(p, 0.014, 0.012, 0.05, m.dark, x, y + 0.29, z + 0.08, 12).rotation.x = 1.2
}

/**
 * An operator's console desk w long, 0.8 deep, user at +z: a laminate worktop on panel ends, the
 * acquisition and reconstruction screens `screens` (each a 24" monitor, facing the operator), a
 * keyboard and mouse at each, the intercom, the emergency stop; the PCs under it.
 */
export function consoleDesk(e: OpdCtx, p: Object3D, w: number, screens: Material[], opts: { stop?: boolean; intercom?: boolean } = {}) {
  const { k, m } = e
  const d = 0.8
  k.soft(p, w, 0.03, d, 0.008, e.o.oak, 0, 0.735, 0)
  for (const s of [-1, 1]) k.box(p, 0.025, 0.72, d - 0.05, m.hpl, s * (w / 2 - 0.0125), 0.36, 0)
  k.box(p, w - 0.05, 0.5, 0.018, m.hpl, 0, 0.45, -d / 2 + 0.05)
  // The screens side by side on their stands, angled in towards the operator; one keyboard and mouse.
  const n = screens.length
  screens.forEach((mat, i) => {
    const x = (i - (n - 1) / 2) * 0.6
    const g = group(p, x, 0.75, -0.18, -(i - (n - 1) / 2) * 0.18)
    k.box(g, 0.22, 0.012, 0.17, m.darkPlastic, 0, 0.006, 0)
    k.box(g, 0.045, 0.24, 0.025, m.darkPlastic, 0, 0.13, -0.04)
    k.box(g, 0.56, 0.34, 0.02, m.black, 0, 0.36, -0.02)
    k.box(g, 0.54, 0.31, 0.004, mat, 0, 0.365, -0.008, false)
  })
  k.box(p, 0.44, 0.015, 0.14, m.darkPlastic, 0, 0.758, 0.15)
  k.soft(p, 0.06, 0.028, 0.1, 0.012, m.darkPlastic, 0.32, 0.764, 0.15)
  // The workstations' towers under the desk.
  for (let i = 0; i < Math.min(2, screens.length); i++) k.soft(p, 0.2, 0.45, 0.45, 0.01, m.darkPlastic, -w / 2 + 0.2 + i * 0.25, 0.23, -0.1)
  if (opts.intercom !== false) intercom(e, p, w / 2 - 0.2, 0.75, 0.15)
  if (opts.stop) emergencyStop(e, p, w / 2 - 0.42, 0.75, 0.2)
}

/**
 * A radiologist's PACS reading desk, 1.6 × 0.8, user at +z: two 5 MP portrait greyscale
 * diagnostic monitors and a colour monitor for the worklist and dictation, on a monitor arm bar;
 * the keyboard, mouse and dictation microphone, a dimmable task lamp; the chair pulled in.
 */
export function pacsDesk(e: OpdCtx, p: Object3D, images: [Material, Material, Material]) {
  const { k, m } = e
  const im = imagingMats(e)
  k.soft(p, 1.6, 0.03, 0.8, 0.008, e.o.oak, 0, 0.725, 0)
  for (const s of [-1, 1]) {
    k.box(p, 0.06, 0.7, 0.06, im.grey, s * 0.68, 0.36, -0.1)
    k.box(p, 0.06, 0.03, 0.65, im.grey, s * 0.68, 0.015, -0.05)
  }
  // The monitor bar along the back edge.
  k.box(p, 1.4, 0.04, 0.04, im.dark, 0, 0.98, -0.34)
  for (const x of [-0.6, 0.6]) k.box(p, 0.04, 0.24, 0.04, im.dark, x, 0.86, -0.34)
  // Two portrait diagnostic monitors, angled in a little; the colour monitor to the right, lower.
  for (const [i, x, ry] of [[0, -0.2, 0.12], [1, 0.2, -0.12]] as const) {
    const s = group(p, x, 1.08, -0.27, ry)
    k.box(s, 0.38, 0.5, 0.05, m.black, 0, 0, 0)
    k.box(s, 0.35, 0.47, 0.004, images[i], 0, 0, 0.026, false)
  }
  const c = group(p, 0.62, 0.98, -0.22, -0.4)
  k.box(c, 0.5, 0.3, 0.03, m.black, 0, 0, 0)
  k.box(c, 0.48, 0.28, 0.004, images[2], 0, 0, 0.016, false)
  k.box(c, 0.05, 0.22, 0.03, im.dark, 0, -0.18, -0.03)
  k.box(p, 0.44, 0.015, 0.14, m.darkPlastic, -0.05, 0.748, 0.12)
  k.soft(p, 0.06, 0.028, 0.1, 0.012, m.darkPlastic, 0.3, 0.754, 0.12)
  // The dictation microphone on its cradle.
  k.soft(p, 0.07, 0.03, 0.09, 0.01, im.dark, -0.5, 0.755, 0.08)
  const mic = k.soft(p, 0.045, 0.035, 0.16, 0.015, im.dark, -0.5, 0.78, 0.07)
  mic.rotation.x = 0.25
  // A low task lamp on an arm.
  put(p, bentTube(e, 'pacsLamp', [[0, 0, 0], [0, 0.35, 0.05], [0.1, 0.45, 0.25]], 0.01, 0.05), im.dark, -0.72, 0.74, -0.3)
  k.soft(p, 0.16, 0.04, 0.08, 0.015, im.dark, -0.62, 1.18, -0.05)
  k.box(p, 0.12, 0.004, 0.05, e.m.ledPanel, -0.62, 1.158, -0.05, false)
  taskChair(e, group(p, 0, 0, 0.62, PI + 0.1))
}
