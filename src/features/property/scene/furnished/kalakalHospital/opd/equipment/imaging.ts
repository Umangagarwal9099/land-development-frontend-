import {
  CylinderGeometry, DoubleSide, ExtrudeGeometry, MeshPhysicalMaterial, MeshStandardMaterial, Path, Shape, TorusGeometry, type Material, type Object3D,
} from 'three'
import { PI } from '../../../kit'
import { bentTube, castor, geo, group, lathe, put, rod, roundRect, starBase, tube } from '../../erKit'
import { taskChair } from '../../erFurniture'
import type { OpdCtx } from '../ctx'
import { cpuTower, keyboard as sharedKeyboard, monitor24, mouse as sharedMouse } from './items'

/*
 * The imaging department's machines, each in its own frame at true size, front towards +z: a
 * 1.5 T superconducting MRI magnet and its docking patient table, the coil cart, a 64-slice CT
 * gantry and its motorised table, a dual-head contrast injector on its pedestal, the operators'
 * consoles and the radiologists' reading desks, and the computer pieces they share (monitors on
 * their stands, keyboards, mice, towers, dictation microphones, task lamps).
 *
 * Built as the products are: moulded covers (rounded sections with the bore cut through, extruded
 * with soft bevels) parted by dark reveal lines rather than painted stripes; the bore's mouth a
 * turned quarter-round flare; lit bore liners, recessed control pods with real keys, displays with
 * live readouts; satin warm-white plastics, never gloss.
 */

const cache = new WeakMap<object, ReturnType<typeof makeMats>>()

function makeMats(e: OpdCtx) {
  const glow = (colour: string, intensity: number) => e.lighting.glow(new MeshStandardMaterial({ color: colour, emissive: colour, emissiveIntensity: intensity, roughness: 0.4 }), 0.8)
  const std = (color: string, roughness: number, metalness = 0, extra: Partial<MeshStandardMaterial> = {}) => Object.assign(new MeshStandardMaterial({ color, roughness, metalness }), extra)
  return {
    /** Covers: a warm satin white moulding; the fronts a shade cooler; both seen inside the flares too. */
    shell: std('#ecebe6', 0.42),
    front: std('#f3f3f0', 0.38, 0, { side: DoubleSide }),
    /** Secondary mouldings (side skirts, cradle frames), and the dark reveal lines between covers. */
    grey: std('#c2c7cc', 0.46),
    mid: std('#8b939b', 0.48),
    dark: std('#30363d', 0.52),
    reveal: std('#1d2126', 0.7),
    /** The bore's liner, matt pale grey, seen from inside. */
    bore: std('#dfe1e1', 0.72, 0, { side: DoubleSide }),
    /** One quiet accent per machine: a muted petrol blue. */
    accent: std('#356f8c', 0.42, 0.05),
    /** Carbon-fibre cradle, foam, vinyl pads. */
    carbon: std('#1f2327', 0.32, 0.15),
    foam: std('#2d3137', 0.85),
    pad: new MeshPhysicalMaterial({ color: '#4d5f74', roughness: 0.55, sheen: 0.2 }),
    keys: std('#d8dbde', 0.5),
    rubber: std('#17191b', 0.85),
    aluminium: std('#b9bec2', 0.38, 0.75),
    copper: std('#b06f43', 0.36, 0.85),
    boreLight: glow('#eef6ff', 1.25),
    laser: glow('#ff2a1f', 2.2),
    green: glow('#3cff8a', 1.5),
    amber: glow('#ffb020', 1.3),
    blueLed: glow('#5ab4ff', 1.3),
    stop: std('#c8161d', 0.35),
    stopBase: std('#f2c200', 0.45),
    /** Syringe barrels and pressure jackets; the contrast inside them; the saline. */
    syringe: new MeshPhysicalMaterial({ color: '#eef6f8', roughness: 0.06, transparent: true, opacity: 0.38, depthWrite: false }),
    contrast: new MeshPhysicalMaterial({ color: '#e7c98a', roughness: 0.1, transparent: true, opacity: 0.75, depthWrite: false }),
    saline: new MeshPhysicalMaterial({ color: '#dff0f6', roughness: 0.1, transparent: true, opacity: 0.5, depthWrite: false }),
    /** The RF window's copper mesh (a fine grid, see-through). */
    mesh: new MeshStandardMaterial({ color: '#9a6a43', metalness: 0.7, roughness: 0.5, transparent: true, opacity: 0.22, depthWrite: false }),
    screenOff: std('#0b0d10', 0.18, 0.3),
  }
}

export function imagingMats(e: OpdCtx) {
  let m = cache.get(e.o)
  if (!m) cache.set(e.o, (m = makeMats(e)))
  return m
}

/* ---------- shapes ---------- */

/** A rounded section w × h (corner r) with a round bore of radius br at height by above its centre, extruded `depth` along z, centred. */
function bored(e: OpdCtx, key: string, w: number, h: number, r: number, br: number, by: number, depth: number, bevel = 0.03) {
  return geo(e, `bored${key}`, () => {
    const s = roundRect(w - 2 * bevel, h - 2 * bevel, r) as Shape
    const hole = new Path()
    hole.absarc(0, by, br + bevel, 0, PI * 2, true)
    s.holes.push(hole)
    const g = new ExtrudeGeometry(s, { depth: Math.max(0.002, depth - 2 * bevel), bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 40 })
    g.translate(0, 0, -(depth - 2 * bevel) / 2)
    return g
  })
}

/** A thin flat outline (a reveal line between covers) round a rounded rectangle, `t` wide, `d` deep. */
function outline(e: OpdCtx, key: string, w: number, h: number, r: number, t: number, d: number, by = 0) {
  return geo(e, `outline${key}`, () => {
    const s = roundRect(w, h, r) as Shape
    s.holes.push(roundRect(w - 2 * t, h - 2 * t, Math.max(0.01, r - t), 0, 0, new Path()) as Path)
    const g = new ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 32 })
    g.translate(0, -by, -d / 2)
    return g
  })
}

/** An open tube (a bore's liner) of radius r, `len` along z. */
function boreTube(e: OpdCtx, r: number, len: number) {
  return geo(e, `boreTube${r}|${len}`, () => {
    const g = new CylinderGeometry(r, r, len, 48, 1, true)
    g.rotateX(PI / 2)
    return g
  })
}

/**
 * The bore's mouth: a quarter-round fillet of radius R turned about z, from the bore (radius r,
 * at z = 0) out to the cover's face (radius r + R, at z = R), the way a moulded cover rolls into
 * the bore.
 */
function horn(e: OpdCtx, key: string, r: number, R: number) {
  return geo(e, `horn${key}`, () => {
    const pts: [number, number][] = []
    for (let i = 0; i <= 10; i++) {
      const a = (i / 10) * (PI / 2)
      pts.push([r + R * (1 - Math.cos(a)), R * Math.sin(a)])
    }
    const g = lathe(e, `hornL${key}`, pts, 48).clone()
    g.rotateX(PI / 2)
    return g
  })
}

/** A thin ring (a trim or a scan-plane window), radius r, tube t, facing z. */
export function ring(e: OpdCtx, r: number, t: number) {
  return geo(e, `ring${r}|${t}`, () => new TorusGeometry(r, t, 8, 64))
}

/** A half shell of a cylinder (a coil's anterior part), radius r, wall t, length l along z, open below. */
function halfShell(e: OpdCtx, key: string, r: number, l: number, t = 0.012) {
  return geo(e, `half${key}`, () => {
    const s = new Shape()
    s.absarc(0, 0, r, 0, PI, false)
    s.absarc(0, 0, r - t, PI, 0, true)
    s.closePath()
    const g = new ExtrudeGeometry(s, { depth: l, bevelEnabled: false, curveSegments: 24 })
    g.translate(0, 0, -l / 2)
    return g
  })
}

/** A row of key caps on a pod: n keys, w × h each, in the pod's local frame at y, z (facing +z). */
function keys(e: OpdCtx, p: Object3D, n: number, cols: number, w: number, h: number, x0: number, y0: number, z: number, pitch: number, mats: Material[]) {
  const { k } = e
  for (let i = 0; i < n; i++) {
    const c = i % cols
    const r = Math.floor(i / cols)
    k.soft(p, w, h, 0.01, 0.004, mats[i % mats.length], x0 + c * pitch, y0 - r * pitch, z)
  }
}

/**
 * A control pod as on a scanner's front cover: a dark recessed panel in a satin surround, a small
 * status display at its top, keys for table up / down / in / out and the laser light, the green
 * start and amber stop keys; facing +z.
 */
function controlPod(e: OpdCtx, p: Object3D, x: number, y: number, z: number, label: string) {
  const { k } = e
  const m = imagingMats(e)
  const g = group(p, x, y, z)
  k.soft(g, 0.21, 0.36, 0.03, 0.014, m.grey, 0, 0, 0)
  k.soft(g, 0.18, 0.33, 0.012, 0.01, m.dark, 0, 0, 0.012)
  k.box(g, 0.13, 0.05, 0.003, e.o.screen(`pod_${label}`, 128, 48, (c, w, h) => {
    c.fillStyle = '#06121f'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#7fd0ff'
    c.font = `700 ${h * 0.42}px Helvetica`
    c.fillText(label, w * 0.06, h * 0.48)
    c.fillStyle = '#ffffff'
    c.font = `500 ${h * 0.34}px Helvetica`
    c.fillText('TBL 812 mm', w * 0.06, h * 0.88)
  }, 0.95), 0, 0.12, 0.02, false)
  keys(e, g, 6, 2, 0.05, 0.035, -0.03, 0.05, 0.022, 0.06, [m.keys, m.keys, m.keys])
  k.soft(g, 0.05, 0.035, 0.01, 0.004, m.green, -0.03, -0.13, 0.022)
  k.soft(g, 0.05, 0.035, 0.01, 0.004, m.amber, 0.03, -0.13, 0.022)
}

/* ---------- MRI ---------- */

/** The bore's centre above the floor, the bore's clear radius (a 70 cm bore). */
export const MRI_BORE = { y: 1.1, r: 0.35 }
/** The magnet's front face (the cover) along its axis, from its centre. */
export const MRI_FRONT = 0.92

/**
 * A 1.5 T superconducting MRI magnet, its bore along z, the patient end (front) towards +z, as
 * the short-bore whole-body systems are built: the cryostat inside a moulded body cover with
 * generous rounded corners on a recessed skirt; the front cover, 0.32 m deep, rolling into the bore
 * in a quarter-round flare and parted from the body by a dark reveal; control pods in the cover
 * either side of the bore and the patient display over it; the 70 cm bore lined in matt grey, its
 * flat floor for the cradle, the lit strip and the ventilation grille along its crown; the rear
 * cover and its own flare; on top at the back, the cold-head turret with the helium lines and the
 * quench pipe rising to the ceiling.
 */
export function mriMagnet(e: OpdCtx, p: Object3D, ceiling: number) {
  const { k } = e
  const m = imagingMats(e)
  const W = 2.12
  const H = 2.1
  const base = 0.1
  const cy = base + H / 2
  const by = MRI_BORE.y - cy
  const br = MRI_BORE.r
  const R = 0.2
  // The skirt, recessed under the body, and the body cover.
  k.soft(p, 1.55, base + 0.02, 1.1, 0.03, m.dark, 0, (base + 0.02) / 2, 0)
  put(p, bored(e, 'mriBody', W, H, 0.8, br + 0.05, by, 1.18, 0.05), m.shell, 0, cy, -0.02)
  // A reveal line round the body half way back, and where it meets the front and rear covers.
  for (const zz of [0.585, -0.6]) put(p, outline(e, `mriRev${zz}`, W - 0.01, H - 0.01, 0.79, 0.012, 0.02), m.reveal, 0, cy, zz, false)
  put(p, outline(e, 'mriBand', W + 0.004, H + 0.004, 0.8, 0.05, 0.6), m.grey, 0, cy, 0, false)
  // The front cover and its flare into the bore.
  const fz = MRI_FRONT - 0.16
  put(p, bored(e, 'mriFront', W + 0.06, H + 0.05, 0.82, br + R, by, 0.32, 0.08), m.front, 0, cy, fz)
  put(p, horn(e, 'mriFront', br, R), m.front, 0, MRI_BORE.y, MRI_FRONT - R, false)
  put(p, ring(e, br + R + 0.035, 0.006), m.accent, 0, MRI_BORE.y, MRI_FRONT - 0.002, false)
  // The rear cover and its smaller flare.
  put(p, bored(e, 'mriRear', W - 0.02, H - 0.03, 0.78, br + 0.08, by, 0.2, 0.06), m.front, 0, cy, -0.7)
  const rear = put(p, horn(e, 'mriRear', br, 0.08), m.front, 0, MRI_BORE.y, -0.8 + 0.08, false)
  rear.rotation.y = PI
  // The bore: the liner through, the flat floor the cradle runs on, the lit strip and grille in its crown.
  put(p, boreTube(e, br, 1.58), m.bore, 0, MRI_BORE.y, -0.02, false)
  const chord = 0.25
  const fw = 2 * Math.sqrt(br * br - chord * chord)
  k.box(p, fw, 0.012, 1.58, m.grey, 0, MRI_BORE.y - chord, -0.02, false)
  for (const s of [-1, 1]) k.box(p, 0.012, 0.03, 1.5, m.aluminium, s * (fw / 2 - 0.05), MRI_BORE.y - chord + 0.02, -0.02, false)
  k.box(p, 0.09, 0.006, 1.2, m.boreLight, 0, MRI_BORE.y + br - 0.012, 0.05, false)
  for (let i = 0; i < 6; i++) k.box(p, 0.16, 0.004, 0.012, m.dark, 0, MRI_BORE.y + br - 0.014, -0.55 + i * 0.03, false)
  // The front: control pods either side of the bore, the patient display over it, the table's dock under it.
  for (const s of [-1, 1]) controlPod(e, p, s * 0.74, MRI_BORE.y + 0.02, MRI_FRONT + 0.002, s < 0 ? 'MR · LEFT' : 'MR · RIGHT')
  k.soft(p, 0.36, 0.12, 0.025, 0.012, m.dark, 0, MRI_BORE.y + br + R + 0.17, MRI_FRONT + 0.004)
  k.box(p, 0.32, 0.085, 0.003, e.o.screen('mriComm', 256, 72, (g, w, h) => {
    g.fillStyle = '#04121f'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#6fd0ff'
    g.font = `700 ${h * 0.4}px Helvetica`
    g.fillText('BRAIN · T2 TSE AX', w * 0.05, h * 0.44)
    g.fillStyle = '#ffffff'
    g.font = `500 ${h * 0.32}px Helvetica`
    g.fillText('03:12 remaining', w * 0.05, h * 0.86)
  }, 1.0), 0, MRI_BORE.y + br + R + 0.17, MRI_FRONT + 0.018, false)
  k.soft(p, 0.6, 0.12, 0.08, 0.03, m.dark, 0, MRI_BORE.y - br - R - 0.12, MRI_FRONT - 0.02)
  // On top at the back: the cold-head turret, its helium lines, and the quench pipe to the ceiling.
  const top = base + H
  k.soft(p, 0.62, 0.32, 0.56, 0.06, m.shell, 0, top + 0.12, -0.42)
  k.box(p, 0.5, 0.012, 0.012, m.reveal, 0, top + 0.06, -0.14, false)
  for (const x of [-0.12, 0.0]) put(p, tube(e, `heLine${x}`, [[x, top + 0.28, -0.5], [x, top + 0.5, -0.55], [x + 0.05, ceiling - 0.25, -0.62], [x + 0.05, ceiling, -0.62]], 0.018), m.rubber)
  k.cyl(p, 0.15, 0.15, 0.06, m.grey, 0.18, top + 0.3, -0.42, 32)
  k.cyl(p, 0.1, 0.1, ceiling - top - 0.33, e.m.stainless, 0.18, (top + 0.33 + ceiling) / 2, -0.42, 32)
  k.cyl(p, 0.125, 0.125, 0.5, m.grey, 0.18, top + 0.65, -0.42, 32)
  for (const yy of [top + 0.4, top + 0.9]) k.cyl(p, 0.135, 0.135, 0.025, e.m.stainless, 0.18, yy, -0.42, 32)
  k.cyl(p, 0.17, 0.17, 0.03, e.m.stainless, 0.18, ceiling - 0.015, -0.42, 32)
}

/**
 * A head and neck coil: the posterior base with its socket and the head's cushioned cradle, the
 * anterior half shell with its open windows over the face, and the mirror on top that lets the
 * patient see out of the bore; along z, the head end at −z. Stands on y = 0.
 */
export function headCoil(e: OpdCtx, p: Object3D) {
  const { k } = e
  const m = imagingMats(e)
  k.soft(p, 0.34, 0.1, 0.42, 0.035, m.shell, 0, 0.05, 0)
  k.soft(p, 0.26, 0.04, 0.34, 0.02, m.foam, 0, 0.11, 0.0)
  // The anterior shell, its face windows dark.
  const hs = put(p, halfShell(e, 'headCoil', 0.16, 0.38), m.front, 0, 0.11, 0)
  hs.castShadow = true
  // The open slots over the face, following the shell's curve, and the ridge between them.
  for (const s of [-1, 1]) {
    const slot = k.box(p, 0.045, 0.004, 0.2, m.reveal, s * 0.07, 0.255, 0.04, false)
    slot.rotation.z = -s * 0.45
  }
  k.box(p, 0.03, 0.006, 0.36, m.grey, 0, 0.272, 0.0, false)
  // The mirror on its bracket, angled to look down the bore.
  const mir = group(p, 0, 0.29, 0.1)
  mir.rotation.x = -0.75
  k.soft(mir, 0.16, 0.012, 0.1, 0.005, m.grey, 0, 0, 0)
  k.box(mir, 0.14, 0.003, 0.08, e.m.chrome, 0, 0.007, 0, false)
  // Its cable and plug to the cradle's socket.
  put(p, tube(e, 'headCoilCable', [[0.15, 0.04, -0.18], [0.22, 0.02, -0.22], [0.27, 0.02, -0.12]], 0.007), m.dark)
}

/**
 * A knee coil: two half cylinders in white that close round the knee, on their base; open (the
 * upper half swung to the side) as left after a scan. Along z.
 */
export function kneeCoil(e: OpdCtx, p: Object3D, open = false) {
  const { k } = e
  const m = imagingMats(e)
  k.soft(p, 0.32, 0.06, 0.3, 0.025, m.shell, 0, 0.03, 0)
  const lower = put(p, halfShell(e, 'kneeCoil', 0.12, 0.26, 0.022), m.front, 0, 0.17, 0)
  lower.rotation.z = PI
  const up = put(p, halfShell(e, 'kneeCoil', 0.12, 0.26, 0.022), m.front, open ? -0.14 : 0, open ? 0.14 : 0.17, 0)
  if (open) up.rotation.z = PI / 2
  k.box(p, 0.03, 0.04, 0.12, m.dark, 0.13, 0.12, 0, false)
}

/**
 * The MRI's patient table, docked at the magnet's front, built from the cover's face (z =
 * MRI_FRONT) outwards along +z: the dark floor plate; the pedestal that lifts and drives the cradle
 * (its moulded cover with reveals, the height keys on both sides); the cradle, 2.4 m in white with
 * aluminium side rails and the coil sockets, its foot handle; three mattress pads, the head and
 * neck coil at the bore end, a knee wedge, the patient's squeeze-ball alarm laid ready.
 */
export function mriTable(e: OpdCtx, p: Object3D) {
  const { k } = e
  const m = imagingMats(e)
  const top = MRI_BORE.y - 0.25 + 0.012
  const z0 = MRI_FRONT + 0.06
  const len = 2.05
  const zc = z0 + len / 2
  k.box(p, 0.72, 0.015, len + 0.1, m.dark, 0, 0.0075, zc)
  // The pedestal: the lower skirt, the moulded body, a reveal near the top.
  k.soft(p, 0.62, 0.1, len - 0.1, 0.03, m.grey, 0, 0.065, zc + 0.02)
  k.soft(p, 0.56, top - 0.24, len - 0.2, 0.07, m.shell, 0, 0.11 + (top - 0.24) / 2, zc + 0.02)
  k.box(p, 0.57, 0.01, len - 0.24, m.reveal, 0, top - 0.17, zc + 0.02, false)
  k.soft(p, 0.6, 0.07, len, 0.025, m.shell, 0, top - 0.1, zc)
  // The dock: where the pedestal meets the magnet.
  k.soft(p, 0.5, 0.18, 0.12, 0.03, m.dark, 0, top - 0.2, z0 - 0.02)
  // Height and drive keys on both sides, near the foot.
  for (const s of [-1, 1]) {
    const pod = group(p, s * 0.3, top - 0.12, z0 + len - 0.45, s * PI / 2)
    k.soft(pod, 0.2, 0.06, 0.02, 0.01, m.dark, 0, 0, 0)
    keys(e, pod, 4, 4, 0.034, 0.03, -0.06, 0.0, 0.012, 0.04, [m.keys, m.keys, m.green, m.amber])
  }
  // The cradle in white, its aluminium rails and coil sockets; it reaches 0.3 m into the bore.
  const cz0 = MRI_FRONT - 0.3
  const clen = len + 0.38
  k.soft(p, 0.5, 0.045, clen, 0.018, m.front, 0, top - 0.04, cz0 + clen / 2)
  for (const s of [-1, 1]) {
    k.box(p, 0.018, 0.022, clen - 0.3, m.aluminium, s * 0.26, top - 0.035, cz0 + clen / 2 + 0.1)
    for (const zz of [0.0, 0.9]) k.box(p, 0.004, 0.018, 0.06, m.reveal, s * 0.27, top - 0.035, cz0 + 0.35 + zz, false)
  }
  for (const zz of [0.08, 0.2]) k.soft(p, 0.07, 0.012, 0.05, 0.005, m.dark, 0.17, top - 0.012, cz0 + zz)
  // Three mattress pads with gaps, the knee wedge; the head and neck coil at the bore end.
  for (let i = 0; i < 3; i++) k.soft(p, 0.46, 0.055, 0.6, 0.025, m.pad, 0, top + 0.01, cz0 + 0.62 + i * 0.62)
  const wedge = k.soft(p, 0.44, 0.13, 0.36, 0.05, m.pad, 0, top + 0.09, cz0 + 1.62)
  wedge.rotation.x = 0.12
  headCoil(e, group(p, 0, top - 0.015, cz0 + 0.26))
  // The squeeze-ball alarm and its hose, laid on the mattress.
  const ball = k.sphere(p, 0.028, m.pad, 0.17, top + 0.07, cz0 + 1.1)
  ball.scale.set(1, 0.85, 1.25)
  put(p, tube(e, 'squeezeHose', [[0.16, top + 0.06, cz0 + 1.07], [0.2, top + 0.05, cz0 + 0.8], [0.23, top + 0.02, cz0 + 0.5]], 0.004), m.grey)
  // The foot handle.
  put(p, bentTube(e, 'mriTableHandle', [[-0.2, top - 0.04, cz0 + clen - 0.02], [-0.2, top + 0.08, cz0 + clen + 0.05], [0.2, top + 0.08, cz0 + clen + 0.05], [0.2, top - 0.04, cz0 + clen - 0.02]], 0.014, 0.04), m.grey)
}

/**
 * A trolley of MRI coils, all non-magnetic: an aluminium frame on four castors, three white
 * shelves with raised edges; on top a flexible body array with its cable and plug and an open knee
 * coil; in the middle a spare head coil and a shoulder coil; below, positioning pads and wedges.
 */
export function coilCart(e: OpdCtx, p: Object3D) {
  const { k } = e
  const m = imagingMats(e)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * 0.42, sz * 0.24, 0.05)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(p, 0.03, 1.0, 0.03, m.aluminium, sx * 0.44, 0.6, sz * 0.26)
  for (const y of [0.24, 0.62, 1.04]) {
    k.box(p, 0.92, 0.02, 0.56, m.shell, 0, y, 0)
    for (const s of [-1, 1]) k.box(p, 0.92, 0.04, 0.012, m.grey, 0, y + 0.02, s * 0.28)
  }
  put(p, bentTube(e, 'coilCartHandle', [[-0.44, 1.04, 0.26], [-0.5, 1.12, 0.26], [-0.5, 1.12, -0.26], [-0.44, 1.04, -0.26]], 0.014, 0.04), m.aluminium)
  // Top: the body array, flexible, draped a little; its cable and plug; the knee coil, open.
  const arr = k.soft(p, 0.46, 0.035, 0.38, 0.016, m.dark, -0.2, 1.07, 0)
  arr.rotation.z = 0.05
  for (let i = 0; i < 3; i++) k.box(p, 0.4, 0.004, 0.01, m.mid, -0.2, 1.09, -0.12 + i * 0.12, false)
  put(p, tube(e, 'arrayCable', [[0.02, 1.07, 0.1], [0.08, 1.07, 0.18], [0.06, 1.06, 0.25]], 0.008), m.dark)
  kneeCoil(e, group(p, 0.24, 1.05, 0, PI / 2), true)
  // Middle: a spare head coil and a shoulder coil.
  headCoil(e, group(p, 0.22, 0.63, 0, PI / 2))
  const sh = k.soft(p, 0.26, 0.18, 0.24, 0.08, m.front, -0.22, 0.72, 0)
  sh.rotation.z = 0.2
  // Below: foam pads and wedges.
  for (let i = 0; i < 3; i++) k.soft(p, 0.24, 0.07, 0.34, 0.03, m.pad, -0.3 + i * 0.27, 0.29, 0)
  const wd = k.soft(p, 0.24, 0.12, 0.2, 0.04, m.pad, 0.3, 0.34, 0)
  wd.rotation.x = 0.3
}

/* ---------- CT ---------- */

/** The CT gantry's bore: its centre above the floor and its radius (an 80 cm aperture). */
export const CT_BORE = { y: 1.0, r: 0.4 }
/** The gantry's front face, from its centre. */
export const CT_FRONT = 0.42

/**
 * A 64-slice CT gantry facing +z, as the 80 cm-aperture whole-body scanners are built: the
 * gantry on its recessed tilt base, the moulded body cover with rounded corners, the front cover
 * rolling into the aperture in a quarter-round flare and the dark scan-plane window ring inside it;
 * the laser windows over and beside the aperture, their red lines lit; a control pod either side
 * at the patient's height; the breath-hold display with its countdown and lung symbol; the rear
 * cover with its cooling grille.
 */
export function ctGantry(e: OpdCtx, p: Object3D) {
  const { k } = e
  const m = imagingMats(e)
  const W = 2.0
  const H = 1.86
  const base = 0.1
  const cy = base + H / 2
  const by = CT_BORE.y - cy
  const br = CT_BORE.r
  const R = 0.12
  // The tilt base and its bearing caps either side.
  k.soft(p, 1.3, base + 0.03, 0.7, 0.03, m.dark, 0, (base + 0.03) / 2, 0)
  for (const s of [-1, 1]) {
    const cap = k.cyl(p, 0.2, 0.2, 0.06, m.grey, s * (W / 2 - 0.02), 0.62, 0, 40)
    cap.rotation.z = PI / 2
  }
  // The body and its covers, parted by reveals.
  put(p, bored(e, 'ctBody', W, H, 0.58, br + 0.04, by, 0.56, 0.05), m.shell, 0, cy, 0)
  put(p, bored(e, 'ctFront', W + 0.04, H + 0.03, 0.6, br + R, by, 0.18, 0.06), m.front, 0, cy, CT_FRONT - 0.09)
  put(p, bored(e, 'ctRear', W - 0.02, H - 0.02, 0.56, br + 0.04, by, 0.14, 0.04), m.front, 0, cy, -0.33)
  for (const zz of [0.29, -0.27]) put(p, outline(e, `ctRev${zz}`, W - 0.01, H - 0.01, 0.57, 0.012, 0.02), m.reveal, 0, cy, zz, false)
  // The aperture: the flare, the liner, the dark scan window ring, the trim.
  put(p, horn(e, 'ctFront', br, R), m.front, 0, CT_BORE.y, CT_FRONT - R, false)
  put(p, boreTube(e, br, 0.72), m.bore, 0, CT_BORE.y, 0.02, false)
  put(p, boreTube(e, br - 0.002, 0.08), m.dark, 0, CT_BORE.y, 0.0, false)
  put(p, ring(e, br + R + 0.03, 0.005), m.accent, 0, CT_BORE.y, CT_FRONT - 0.002, false)
  // Laser windows: a slot over the aperture and one each side, the red lines lit inside them.
  k.soft(p, 0.2, 0.03, 0.012, 0.008, m.reveal, 0, CT_BORE.y + br + R + 0.05, CT_FRONT + 0.004)
  k.box(p, 0.16, 0.004, 0.004, m.laser, 0, CT_BORE.y + br + R + 0.05, CT_FRONT + 0.011, false)
  for (const s of [-1, 1]) {
    k.soft(p, 0.03, 0.16, 0.012, 0.008, m.reveal, s * (br + R + 0.05), CT_BORE.y, CT_FRONT + 0.004)
    k.box(p, 0.004, 0.12, 0.004, m.laser, s * (br + R + 0.05), CT_BORE.y, CT_FRONT + 0.011, false)
  }
  k.box(p, 0.004, 0.12, 0.004, m.laser, 0, CT_BORE.y + br - 0.01, 0.12, false)
  // Control pods either side, the breath-hold display over the aperture.
  for (const s of [-1, 1]) controlPod(e, p, s * 0.74, CT_BORE.y - 0.05, CT_FRONT + 0.002, s < 0 ? 'CT · LEFT' : 'CT · RIGHT')
  k.soft(p, 0.3, 0.12, 0.022, 0.012, m.dark, 0, CT_BORE.y + br + R + 0.2, CT_FRONT + 0.002)
  k.box(p, 0.27, 0.09, 0.003, e.o.screen('ctBreath', 192, 64, (g, w, h) => {
    g.fillStyle = '#05140c'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = '#4bff72'
    g.lineWidth = 3
    for (const s of [-1, 1]) {
      g.beginPath()
      g.ellipse(w * 0.16 + s * 12, h * 0.52, 9, 18, s * 0.2, 0, PI * 2)
      g.stroke()
    }
    g.fillStyle = '#4bff72'
    g.font = `700 ${h * 0.42}px Helvetica`
    g.fillText('HOLD 08', w * 0.32, h * 0.66)
  }, 1.0), 0, CT_BORE.y + br + R + 0.2, CT_FRONT + 0.015, false)
  // The rear cooling grille.
  for (let i = 0; i < 9; i++) k.box(p, 0.7, 0.012, 0.004, m.reveal, 0, 1.45 + i * 0.03, -0.402, false)
}

/**
 * The CT's motorised patient table, built from the gantry's face (z = CT_FRONT) out along +z: the
 * floor plate and foot pedals; the lifting pedestal under its moulded cover; the support beam and,
 * sliding on it, the carbon-fibre cradle reaching into the aperture; the mattress, the concave head
 * holder at the gantry end, the knee support, an arm board, the IV-pole socket at the foot.
 */
export function ctTable(e: OpdCtx, p: Object3D) {
  const { k } = e
  const m = imagingMats(e)
  const top = 0.86
  const z0 = CT_FRONT + 0.25
  const plen = 1.25
  k.box(p, 0.7, 0.018, 1.75, m.dark, 0, 0.009, z0 + 0.95)
  k.soft(p, 0.56, 0.1, plen + 0.1, 0.03, m.grey, 0, 0.06, z0 + 1.05)
  k.soft(p, 0.48, top - 0.25, plen, 0.08, m.shell, 0, 0.1 + (top - 0.25) / 2, z0 + 1.05)
  k.box(p, 0.49, 0.01, plen - 0.1, m.reveal, 0, top - 0.2, z0 + 1.05, false)
  // The support beam the cradle slides on.
  k.soft(p, 0.52, 0.08, 1.9, 0.025, m.shell, 0, top - 0.1, z0 + 0.85)
  for (const s of [-1, 1]) k.box(p, 0.012, 0.02, 1.7, m.reveal, s * 0.26, top - 0.1, z0 + 0.85, false)
  // The cradle: carbon fibre, white edges, reaching into the gantry; the mattress.
  const czs = CT_FRONT - 0.55
  const clen = 2.45
  k.soft(p, 0.44, 0.03, clen, 0.012, m.carbon, 0, top - 0.045, czs + clen / 2)
  for (const s of [-1, 1]) k.box(p, 0.012, 0.03, clen - 0.1, m.front, s * 0.225, top - 0.045, czs + clen / 2)
  k.soft(p, 0.4, 0.05, 1.85, 0.02, m.pad, 0, top - 0.005, czs + 0.9 + 0.92)
  // The head holder: a concave scoop with its strap.
  put(p, geo(e, 'ctHead', () => {
    // A U-section scoop: a flat base, the head's hollow turned out of its top.
    const s = new Shape()
    s.moveTo(-0.14, -0.05)
    s.lineTo(0.14, -0.05)
    s.lineTo(0.14, 0.07)
    s.lineTo(0.1, 0.07)
    s.absarc(0, 0.07, 0.1, 0, PI, true)
    s.lineTo(-0.14, 0.07)
    s.closePath()
    const g = new ExtrudeGeometry(s, { depth: 0.28, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2, curveSegments: 20 })
    g.translate(0, 0, -0.14)
    return g
  }), m.front, 0, top + 0.03, czs + 0.3)
  k.box(p, 0.3, 0.004, 0.04, m.dark, 0, top + 0.1, czs + 0.3, false)
  // The knee support, an arm board clipped to the side rail.
  const kn = k.soft(p, 0.36, 0.13, 0.3, 0.05, m.pad, 0, top + 0.08, czs + 1.95)
  kn.rotation.x = 0.1
  k.soft(p, 0.13, 0.025, 0.55, 0.01, m.carbon, 0.3, top - 0.03, czs + 1.0)
  k.box(p, 0.08, 0.02, 0.04, m.aluminium, 0.24, top - 0.035, czs + 1.0, false)
  // Foot pedals for the table's height, either side at the floor; the IV-pole socket at the foot.
  for (const s of [-1, 1]) k.soft(p, 0.12, 0.035, 0.18, 0.012, m.dark, s * 0.2, 0.035, z0 + 1.82)
  k.cyl(p, 0.016, 0.016, 0.14, m.aluminium, 0.2, top - 0.13, czs + clen - 0.05, 12)
}

/**
 * A dual-head contrast power injector on its mobile pedestal: the five-castor base, the power
 * unit low on the column, the column with its hand-held control display, the counterbalanced
 * arm, and the head pointing down with its two syringes in their clear pressure jackets: contrast
 * (A, amber, in its heater sleeve) and saline (B); the low-pressure tubing from both joined at
 * the T-connector and looped on the arm hook.
 */
export function injector(e: OpdCtx, p: Object3D) {
  const { k } = e
  const m = imagingMats(e)
  starBase(e, p, 0.3, 0.09, m.grey, 0.03)
  k.soft(p, 0.22, 0.18, 0.16, 0.03, m.shell, 0, 0.26, 0)
  put(p, lathe(e, 'injColumn', [[0, 0.1], [0.04, 0.1], [0.036, 1.12], [0, 1.12]], 24), m.shell)
  const disp = group(p, 0, 0.98, 0.07)
  disp.rotation.x = -0.4
  k.soft(disp, 0.24, 0.17, 0.035, 0.015, m.shell, 0, 0, 0)
  k.box(disp, 0.2, 0.12, 0.003, e.o.screen('injDisplay', 160, 96, (g, w, h) => {
    g.fillStyle = '#0d2747'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#ffffff'
    g.font = `700 ${h * 0.17}px Helvetica`
    g.fillText('A  80 ml  4.0 ml/s', w * 0.05, h * 0.28)
    g.fillStyle = '#7fd0ff'
    g.fillText('B  40 ml  4.0 ml/s', w * 0.05, h * 0.52)
    g.fillStyle = '#4bff72'
    g.fillRect(w * 0.05, h * 0.68, w * 0.36, h * 0.2)
    g.fillStyle = '#062010'
    g.fillText('ARMED', w * 0.08, h * 0.83)
  }, 0.95), 0, 0, 0.019, false)
  // The arm, its joint, and the head.
  k.cyl(p, 0.045, 0.045, 0.08, m.grey, 0, 1.14, 0, 24)
  rod(e, p, 0.022, 0.38, m.aluminium, 0.19, 1.16, 0, 'x', 16)
  k.cyl(p, 0.035, 0.035, 0.07, m.grey, 0.38, 1.16, 0, 20)
  const head = group(p, 0.4, 1.1, 0)
  head.rotation.z = -0.45
  k.soft(head, 0.2, 0.26, 0.17, 0.05, m.shell, 0, 0.02, 0)
  k.box(head, 0.1, 0.05, 0.003, m.blueLed, 0, 0.09, 0.086, false)
  for (const [s, fill] of [[-1, m.contrast], [1, m.saline]] as const) {
    const x = s * 0.046
    k.cyl(head, 0.036, 0.036, 0.3, m.syringe, x, -0.26, 0.02, 24)
    k.cyl(head, 0.029, 0.029, 0.2, fill, x, -0.3, 0.02, 20)
    k.cyl(head, 0.03, 0.03, 0.012, m.dark, x, -0.18, 0.02, 20)
    k.cyl(head, 0.012, 0.004, 0.045, m.syringe, x, -0.43, 0.02, 12)
  }
  k.cyl(head, 0.04, 0.04, 0.12, m.amber, -0.046, -0.2, 0.02, 24)
  put(p, tube(e, 'injLineA', [[0.48, 0.72, 0.02], [0.52, 0.58, 0.08], [0.56, 0.5, 0.12]], 0.003), m.syringe)
  put(p, tube(e, 'injLineB', [[0.57, 0.77, 0.02], [0.58, 0.6, 0.08], [0.56, 0.5, 0.12]], 0.003), m.syringe)
  put(p, tube(e, 'injLine', [[0.56, 0.5, 0.12], [0.62, 0.42, 0.25], [0.75, 0.55, 0.4], [0.8, 0.7, 0.52]], 0.003), m.syringe)
  put(p, bentTube(e, 'injHook', [[0, 1.12, 0], [0, 1.4, 0], [0.06, 1.42, 0]], 0.008, 0.02), m.aluminium)
}

/* ---------- computers and controls ---------- */

/**
 * A flat-panel monitor on its stand: a slim black bezel round the picture, the moulded back
 * housing, the neck and the oval foot; w × h the panel, portrait if asked. Facing +z at (x, y, z)
 * (y its foot's underside), turned ry. Returns the group.
 */
export function monitor(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry: number, w: number, h: number, screen: Material, opts: { portrait?: boolean; tilt?: number; foot?: boolean } = {}) {
  const { k, m } = e
  const im = imagingMats(e)
  const [pw, ph] = opts.portrait ? [h, w] : [w, h]
  const g = group(p, x, y, z, ry)
  if (opts.foot !== false) {
    put(g, lathe(e, 'monFoot', [[0, 0], [0.11, 0], [0.12, 0.006], [0.1, 0.012], [0, 0.012]], 28), m.darkPlastic).scale.set(1.3, 1, 0.9)
    k.soft(g, 0.06, 0.18 + ph / 2, 0.03, 0.01, m.darkPlastic, 0, 0.012 + (0.18 + ph / 2) / 2, -0.07)
  }
  const s = group(g, 0, 0.2 + ph / 2, -0.04)
  s.rotation.x = -(opts.tilt ?? 0.05)
  k.soft(s, pw, ph, 0.018, 0.006, m.black, 0, 0, 0)
  k.soft(s, pw * 0.7, ph * 0.7, 0.03, 0.02, im.dark, 0, 0, -0.018)
  k.box(s, pw - 0.016, ph - 0.022, 0.002, screen, 0, 0.003, 0.0095, false)
  k.box(s, 0.006, 0.006, 0.002, im.blueLed, pw / 2 - 0.02, -ph / 2 + 0.006, 0.0095, false)
  return g
}

/** A keyboard (the shared model in items.ts), keys towards +z. */
export function keyboard(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  return sharedKeyboard(e, p, x, y, z, ry)
}

/** A mouse (the shared model in items.ts). */
export function mouse(e: OpdCtx, p: Object3D, x: number, y: number, z: number) {
  sharedMouse(e, p, x, y, z)
}

/** A desktop PC tower on the floor (the shared model in items.ts). */
export function pcTower(e: OpdCtx, p: Object3D, x: number, z: number, ry = 0) {
  return cpuTower(e, p, x, 0, z, ry)
}

/** An emergency stop: the red mushroom head on its yellow box, the label under it. */
export function emergencyStop(e: OpdCtx, p: Object3D, x: number, y: number, z: number) {
  const { k } = e
  const m = imagingMats(e)
  k.soft(p, 0.09, 0.09, 0.07, 0.01, m.stopBase, x, y + 0.045, z)
  k.cyl(p, 0.018, 0.018, 0.02, m.dark, x, y + 0.1, z, 16)
  k.cyl(p, 0.034, 0.03, 0.022, m.stop, x, y + 0.12, z, 24)
}

/** A wall emergency stop or magnet-stop button: its box, mushroom head and hinged guard, on a wall group facing +z, centred at y. */
export function wallStop(e: OpdCtx, p: Object3D, y: number, label: string, guard = false) {
  const { k } = e
  const m = imagingMats(e)
  k.soft(p, 0.13, 0.13, 0.06, 0.01, m.stopBase, 0, y, 0.03)
  const head = k.cyl(p, 0.035, 0.03, 0.03, m.stop, 0, y, 0.075, 24)
  head.rotation.x = PI / 2
  if (guard) k.soft(p, 0.12, 0.12, 0.05, 0.01, m.syringe, 0, y, 0.1)
  k.box(p, 0.2, 0.05, 0.004, e.o.sign(`stopLabel_${label}`, 256, 64, (c, w, h) => {
    c.fillStyle = '#ffffff'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#c8161d'
    c.font = `700 ${h * 0.42}px Helvetica`
    c.textAlign = 'center'
    c.fillText(label, w / 2, h * 0.66)
  }), 0, y - 0.12, 0.003, false)
}

/** An intercom: its base with the talk key and speaker grille, the gooseneck microphone. */
export function intercom(e: OpdCtx, p: Object3D, x: number, y: number, z: number) {
  const { k } = e
  const m = imagingMats(e)
  k.soft(p, 0.18, 0.05, 0.14, 0.02, m.dark, x, y + 0.025, z)
  for (let i = 0; i < 5; i++) k.box(p, 0.07, 0.003, 0.006, m.reveal, x - 0.04, y + 0.051, z - 0.03 + i * 0.012, false)
  k.soft(p, 0.05, 0.012, 0.04, 0.005, m.green, x + 0.05, y + 0.052, z + 0.03)
  put(p, tube(e, 'gooseMic', [[0, 0, 0], [0, 0.12, -0.02], [0.03, 0.22, 0.04], [0.04, 0.24, 0.1]], 0.005), m.dark, x - 0.04, y + 0.05, z - 0.03)
  k.cyl(p, 0.012, 0.01, 0.045, m.rubber, x, y + 0.29, z + 0.07, 12).rotation.x = 1.2
}

/**
 * An operator's console desk w long, 0.8 deep, user at +z: a laminate worktop on panel ends with a
 * modesty panel, the screens `screens` side by side on their stands angled in towards the
 * operator, a keyboard and mouse, the intercom, the emergency stop; the PCs on the floor under it.
 */
export function consoleDesk(e: OpdCtx, p: Object3D, w: number, screens: Material[], opts: { stop?: boolean; intercom?: boolean } = {}) {
  const { k, m } = e
  const d = 0.8
  k.soft(p, w, 0.028, d, 0.006, e.o.oak, 0, 0.736, 0)
  for (const s of [-1, 1]) k.box(p, 0.025, 0.722, d - 0.05, m.hpl, s * (w / 2 - 0.0125), 0.361, 0)
  k.box(p, w - 0.05, 0.45, 0.018, m.hpl, 0, 0.47, -d / 2 + 0.06)
  k.box(p, w * 0.5, 0.06, 0.12, m.powder, 0, 0.66, -d / 2 + 0.16, false)
  const n = screens.length
  screens.forEach((mat, i) => {
    const xx = (i - (n - 1) / 2) * 0.6
    monitor24(e, p, mat, xx, 0.75, -0.2 + Math.abs(i - (n - 1) / 2) * 0.04, -(i - (n - 1) / 2) * 0.22)
  })
  keyboard(e, p, -0.05, 0.75, 0.15)
  mouse(e, p, 0.32, 0.75, 0.16)
  for (let i = 0; i < Math.min(2, n); i++) pcTower(e, p, -w / 2 + 0.2 + i * 0.25, -0.12)
  if (opts.intercom !== false) intercom(e, p, w / 2 - 0.22, 0.75, 0.12)
  if (opts.stop) emergencyStop(e, p, w / 2 - 0.45, 0.75, 0.22)
}

/** A dimmable LED task lamp: weighted foot, two arm links with their joint, the slim head. */
export function taskLamp(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const im = imagingMats(e)
  const g = group(p, x, y, z, ry)
  k.cyl(g, 0.07, 0.075, 0.025, im.dark, 0, 0.0125, 0, 24)
  rod(e, g, 0.008, 0.36, im.dark, 0, 0.2, 0.02, 'z', 10).rotation.set(0.25, 0, 0)
  k.sphere(g, 0.014, im.dark, 0, 0.37, 0.07)
  const arm = group(g, 0, 0.37, 0.07)
  arm.rotation.x = 1.1
  rod(e, arm, 0.007, 0.3, im.dark, 0, 0, 0.15, 'z', 10)
  const hd = group(arm, 0, 0, 0.3)
  hd.rotation.x = -1.2
  k.soft(hd, 0.2, 0.022, 0.06, 0.01, im.dark, 0, 0, 0)
  k.box(hd, 0.18, 0.002, 0.04, m.ledPanel, 0, -0.012, 0, false)
}

/** A dictation microphone in its desk cradle, its coiled cable. */
export function dictationMic(e: OpdCtx, p: Object3D, x: number, y: number, z: number) {
  const { k } = e
  const im = imagingMats(e)
  k.soft(p, 0.08, 0.025, 0.1, 0.01, im.dark, x, y + 0.0125, z)
  const mic = k.soft(p, 0.05, 0.035, 0.17, 0.016, im.dark, x, y + 0.04, z - 0.01)
  mic.rotation.x = 0.3
  k.box(p, 0.024, 0.003, 0.03, im.green, x, y + 0.062, z + 0.02, false)
  k.box(p, 0.026, 0.004, 0.02, im.mid, x, y + 0.07, z - 0.08, false)
  put(p, tube(e, 'micCable', [[x, y + 0.02, z - 0.05], [x - 0.05, y + 0.005, z - 0.15], [x - 0.02, y + 0.005, z - 0.25]], 0.003), im.dark)
}

/**
 * A radiologist's PACS reading desk, 1.6 × 0.8, user at +z: height-adjustable frame, the worktop;
 * two 5 MP portrait greyscale diagnostic monitors on a dual arm and a colour monitor for the
 * worklist and dictation; keyboard, mouse, dictation microphone, a dimmable task lamp; the
 * workstation under the desk; the chair pulled in.
 */
export function pacsDesk(e: OpdCtx, p: Object3D, images: [Material, Material, Material]) {
  const { k } = e
  const im = imagingMats(e)
  k.soft(p, 1.6, 0.028, 0.8, 0.006, e.o.oak, 0, 0.726, 0)
  for (const s of [-1, 1]) {
    k.box(p, 0.07, 0.7, 0.05, im.grey, s * 0.68, 0.36, -0.12)
    k.soft(p, 0.07, 0.03, 0.66, 0.008, im.grey, s * 0.68, 0.015, -0.05)
    k.box(p, 0.06, 0.04, 0.6, im.grey, s * 0.68, 0.7, -0.05)
  }
  k.box(p, 1.3, 0.05, 0.04, im.grey, 0, 0.68, -0.3)
  // The dual arm: its clamp and post, the bar, and the two portrait diagnostic monitors angled in.
  k.cyl(p, 0.022, 0.022, 0.42, im.dark, 0, 0.94, -0.36, 16)
  k.box(p, 0.08, 0.05, 0.1, im.dark, 0, 0.74, -0.36)
  rod(e, p, 0.016, 0.62, im.dark, 0, 1.12, -0.33, 'x', 12)
  for (const [i, x, ry] of [[0, -0.21, 0.14], [1, 0.21, -0.14]] as const) monitor(e, p, x, 0.81, -0.28, ry, 0.38, 0.5, images[i], { foot: false, tilt: 0.02 })
  monitor(e, p, 0.6, 0.74, -0.2, -0.45, 0.5, 0.3, images[2])
  keyboard(e, p, -0.05, 0.74, 0.14)
  mouse(e, p, 0.32, 0.74, 0.15)
  dictationMic(e, p, -0.48, 0.74, 0.1)
  taskLamp(e, p, -0.7, 0.74, -0.28, 0.4)
  pcTower(e, p, 0.55, -0.15)
  taskChair(e, group(p, 0, 0, 0.62, PI + 0.1))
}

/** The RF window's mesh, both faces of the glass, on a wall group facing +z: w × h centred at y. */
export function rfMesh(e: OpdCtx, p: Object3D, w: number, h: number, y: number, z: number) {
  const { k } = e
  const m = imagingMats(e)
  // The mesh is far finer than can be drawn: a faint bronze tint over the glass, edged in copper.
  k.box(p, w, h, 0.002, m.mesh, 0, y, z, false)
  for (const s of [-1, 1]) {
    k.box(p, 0.012, h, 0.004, m.copper, s * (w / 2 - 0.006), y, z, false)
    k.box(p, w, 0.012, 0.004, m.copper, 0, y + s * (h / 2 - 0.006), z, false)
  }
}
