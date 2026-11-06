import { CatmullRomCurve3, ExtrudeGeometry, MeshPhysicalMaterial, MeshStandardMaterial, Shape, TubeGeometry, Vector3, type Object3D } from 'three'
import { PI } from '../../../kit'
import { bentTube, castor, cupboardDoor, face, geo, group, lathe, put, rod, tube } from '../../erKit'
import type { OpdCtx } from '../ctx'
import { feet, grille, keypad, labMats, lcd, led, seam, touchScreen } from './lab'

/*
 * The second floor's diagnostic radiology and physiology equipment, modelled on the systems a
 * hospital of this size installs: a ceiling-suspended digital radiography system (the tube and its
 * collimator on a telescopic column, the carriage on its bridge, the bridge on ceiling rails), a
 * floating-top table with its detector bucky, the upright wall stand, the generator console, lead
 * aprons on a proper rack; a premium cart ultrasound; the lung function laboratory's spirometer,
 * calibration syringe and body plethysmograph. True size, own frames, front towards +z, on y = 0.
 */

const cache = new WeakMap<object, ReturnType<typeof make>>()

function make() {
  const vinyl = (color: string) => new MeshPhysicalMaterial({ color, roughness: 0.62, clearcoat: 0.15, clearcoatRoughness: 0.6 })
  return {
    /** Lead apron vinyl covers, in the usual navy, maroon, teal and grey. */
    aprons: [vinyl('#22325a'), vinyl('#6b1f2b'), vinyl('#1f5c63'), vinyl('#4a4f57')],
    /** The carbon-fibre table top: a near-black satin with its weave barely visible. */
    carbon: new MeshStandardMaterial({ color: '#1b1d20', roughness: 0.35, metalness: 0.1 }),
    /** Foam table mattress in its grey-blue PU cover. */
    pad: new MeshPhysicalMaterial({ color: '#5d6b78', roughness: 0.55, clearcoat: 0.2 }),
    /** HV cable sheath. */
    cable: new MeshStandardMaterial({ color: '#232527', roughness: 0.55 }),
  }
}

const rmats = (e: OpdCtx) => {
  let c = cache.get(e.o)
  if (!c) cache.set(e.o, (c = make()))
  return c
}

/** A coiled cable (a hand switch's), as a helix from a to b, radius r, `turns` turns. */
function coil(e: OpdCtx, key: string, a: [number, number, number], b: [number, number, number], r: number, turns: number, wire = 0.003) {
  return geo(e, `coil${key}`, () => {
    const pts: Vector3[] = []
    const n = turns * 12
    for (let i = 0; i <= n; i++) {
      const t = i / n
      const ang = t * turns * PI * 2
      pts.push(new Vector3(a[0] + (b[0] - a[0]) * t + Math.cos(ang) * r, a[1] + (b[1] - a[1]) * t + Math.sin(ang) * r, a[2] + (b[2] - a[2]) * t))
    }
    return new TubeGeometry(new CatmullRomCurve3(pts), n, wire, 5, false)
  })
}

/* ---------- the DR system ---------- */

/**
 * The ceiling tube support, under a group at the floor whose origin is the rails' centre in plan:
 * two aluminium C-section rails along local z (`len` long, `span` apart) fixed under the ceiling at
 * `ceiling` with their fixing plates and end stops, the bridge across them at `at` along them on its
 * trolleys with the cable festoon, the carriage at `cross` across it, the four-stage telescopic
 * column down to the tube head at `head` (the focal spot's height), and the head: its yoke, the
 * oil-filled tube housing with its domed ends and the two HV cables looping up to the column, the
 * multi-leaf collimator with its knobs, field light and measuring tape, the control handles and
 * the touch display on its front. Returns the head's group.
 */
export function ceilingTube(e: OpdCtx, p: Object3D, len: number, span: number, ceiling: number, at: number, cross: number, head: number) {
  const { k, m } = e
  const L = labMats(e)
  const R = rmats(e)
  // The rails: an extruded C-section, its fixing plates and end stops.
  const rail = geo(e, `drRail${len.toFixed(2)}`, () => {
    const s = new Shape()
    s.moveTo(-0.055, 0)
    s.lineTo(0.055, 0)
    s.lineTo(0.055, -0.075)
    s.lineTo(0.035, -0.075)
    s.lineTo(0.035, -0.065)
    s.lineTo(0.045, -0.065)
    s.lineTo(0.045, -0.012)
    s.lineTo(-0.045, -0.012)
    s.lineTo(-0.045, -0.065)
    s.lineTo(-0.035, -0.065)
    s.lineTo(-0.035, -0.075)
    s.lineTo(-0.055, -0.075)
    s.closePath()
    const ex = new ExtrudeGeometry(s, { depth: len, bevelEnabled: false })
    ex.translate(0, 0, -len / 2)
    return ex
  })
  for (const s of [-1, 1]) {
    put(p, rail, m.aluminium, s * span / 2, ceiling, 0)
    for (let i = 0; i < 4; i++) k.box(p, 0.16, 0.01, 0.1, m.aluminium, s * span / 2, ceiling - 0.005, -len / 2 + 0.25 + (i * (len - 0.5)) / 3, false)
    for (const z of [-len / 2 + 0.03, len / 2 - 0.03]) k.box(p, 0.1, 0.05, 0.03, L.darkTrim, s * span / 2, ceiling - 0.05, z, false)
  }
  // The bridge: a long rounded beam on its two trolleys, the cable festoon along it.
  const by = ceiling - 0.14
  k.soft(p, span + 0.34, 0.12, 0.26, 0.03, L.shell, 0, by, at)
  for (const s of [-1, 1]) k.soft(p, 0.16, 0.08, 0.3, 0.02, L.shellGrey, s * span / 2, ceiling - 0.075, at)
  for (let i = 0; i < 10; i++) k.box(p, 0.06, 0.03, 0.05, L.darkTrim, -span / 2 + 0.1 + i * ((span - 0.2) / 9), by + 0.075, at - 0.1, false)
  seam(e, p, span + 0.2, 0, by - 0.02, at + 0.131)
  // The carriage on the bridge, its nameplate and brake release.
  const cy = by - 0.16
  k.soft(p, 0.42, 0.2, 0.42, 0.04, L.shell, cross, cy, at)
  k.box(p, 0.14, 0.03, 0.004, L.accent, cross, cy + 0.03, at + 0.211, false)
  // The telescopic column: four nested rounded sections, each with its collar.
  const top = cy - 0.1
  const bottom = head + 0.3
  const n = 4
  const segLen = (top - bottom) / n + 0.08
  for (let i = 0; i < n; i++) {
    const w = 0.22 - i * 0.03
    const yc = top - segLen / 2 - (i * (top - bottom)) / n
    k.soft(p, w, segLen, w, 0.02, i % 2 ? L.shellGrey : L.shell, cross, yc, at)
    k.box(p, w + 0.012, 0.02, w + 0.012, L.trim, cross, yc - segLen / 2 + 0.01, at, false)
  }
  // The head: the rotation yoke, the tube housing across it, the collimator below.
  const yoke = group(p, cross, head, at)
  k.soft(yoke, 0.18, 0.2, 0.26, 0.04, L.shell, 0, 0.32, -0.02)
  k.cyl(yoke, 0.1, 0.1, 0.05, L.trim, 0, 0.24, 0.0, 28).rotation.x = PI / 2
  const housing = group(yoke, 0, 0.14, 0.02)
  housing.rotation.z = PI / 2
  put(housing, lathe(e, 'drTubeHousing', [[0, -0.3], [0.08, -0.29], [0.12, -0.25], [0.125, -0.22], [0.125, 0.22], [0.12, 0.25], [0.08, 0.29], [0, 0.3]], 28), L.shell, 0, 0, 0)
  for (const s of [-1, 1]) k.cyl(housing, 0.127, 0.127, 0.012, L.trim, 0, s * 0.18, 0, 28)
  k.box(yoke, 0.24, 0.02, 0.004, L.accent, 0, 0.14, 0.147, false)
  // The two HV cables from the housing's ends, looping up to the column.
  for (const s of [-1, 1]) put(yoke, tube(e, `drHV${s}`, [[s * 0.28, 0.2, 0.0], [s * 0.36, 0.32, -0.04], [s * 0.3, 0.58, -0.06], [s * 0.1, 0.68, -0.05], [0, 0.74, -0.03]], 0.014), R.cable, 0, 0, 0)
  // The collimator: its body, field-size knobs, the light window, the tape housing.
  k.soft(yoke, 0.26, 0.2, 0.25, 0.03, L.shell, 0, -0.08, 0.04)
  seam(e, yoke, 0.22, 0, -0.03, 0.166)
  for (const s of [-1, 1]) {
    k.cyl(yoke, 0.022, 0.022, 0.02, L.darkTrim, s * 0.07, -0.08, 0.172, 20).rotation.x = PI / 2
    k.box(yoke, 0.004, 0.018, 0.004, e.m.whitePlastic, s * 0.07, -0.072, 0.183, false)
  }
  k.box(yoke, 0.2, 0.004, 0.2, L.smoked, 0, -0.182, 0.04, false)
  k.box(yoke, 0.002, 0.003, 0.2, m.black, 0, -0.185, 0.04, false)
  k.box(yoke, 0.2, 0.003, 0.002, m.black, 0, -0.185, 0.04, false)
  k.box(yoke, 0.035, 0.03, 0.05, L.darkTrim, 0.1, -0.165, 0.14, false)
  // The control handles either side, the touch display on the front.
  for (const s of [-1, 1]) {
    put(yoke, bentTube(e, `drHandle${s}`, [[0, 0.05, 0], [0.05, 0.05, 0], [0.06, -0.08, 0.0], [0.0, -0.1, 0.0]], 0.014, 0.035), L.darkTrim, s * 0.13, -0.06, 0.06)
    k.box(yoke, 0.012, 0.03, 0.02, L.accent, s * 0.19, -0.02, 0.06, false)
  }
  touchScreen(e, yoke, 0.13, 0.08, e.o.his('tubeDisplay', 'SID 180 · 0° · CHEST', 'form'), 0, 0.06, 0.17, 0.2)
  return yoke
}

/**
 * The radiographic table along local z (2.2 × 0.8 m top at 0.74 m): a pedestal base on its floor
 * plate, the lifting column in its bellows, the table body with its detector bucky tray (front
 * handle, centring scale) under a floating carbon-fibre top with rounded ends, the PU mattress, the
 * accessory side rails, hand grips at the head, the foot pedals for the brakes and height.
 */
export function xrayTable(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  const R = rmats(e)
  k.soft(p, 0.62, 0.05, 1.1, 0.02, L.darkTrim, 0, 0.025, 0.1)
  k.soft(p, 0.48, 0.42, 0.62, 0.04, L.shell, 0, 0.26, 0.1)
  for (let i = 0; i < 6; i++) k.box(p, 0.44, 0.006, 0.58, L.shellGrey, 0, 0.12 + i * 0.05, 0.1, false)
  k.soft(p, 0.68, 0.14, 1.9, 0.03, L.shell, 0, 0.6, 0)
  seam(e, p, 1.8, 0, 0.56, 0.341)
  // The bucky tray: its front with handle and centring scale, on the +x side.
  k.box(p, 0.004, 0.08, 0.5, L.shellGrey, 0.341, 0.6, 0.12, false)
  put(p, bentTube(e, 'buckyHandle', [[0, 0, -0.1], [0.03, 0, -0.1], [0.03, 0, 0.1], [0, 0, 0.1]], 0.008, 0.015), L.darkTrim, 0.343, 0.6, 0.12, false)
  k.box(p, 0.003, 0.01, 0.4, e.m.whitePlastic, 0.343, 0.64, 0.12, false)
  // The floating top: carbon fibre with radiused ends; its aluminium edge rails.
  const topGeo = geo(e, 'drTableTop', () => {
    const s = new Shape()
    const w = 0.4
    const l = 1.1
    s.moveTo(-w, -l + 0.08)
    s.quadraticCurveTo(-w, -l, -w + 0.08, -l)
    s.lineTo(w - 0.08, -l)
    s.quadraticCurveTo(w, -l, w, -l + 0.08)
    s.lineTo(w, l - 0.08)
    s.quadraticCurveTo(w, l, w - 0.08, l)
    s.lineTo(-w + 0.08, l)
    s.quadraticCurveTo(-w, l, -w, l - 0.08)
    s.closePath()
    const ex = new ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 2, curveSegments: 6 })
    ex.rotateX(PI / 2)
    return ex
  })
  put(p, topGeo, R.carbon, 0, 0.76, 0)
  for (const s of [-1, 1]) {
    k.box(p, 0.02, 0.03, 1.6, m.aluminium, s * 0.415, 0.72, 0)
    for (const z of [-0.7, 0.7]) k.box(p, 0.03, 0.04, 0.03, L.darkTrim, s * 0.4, 0.73, z, false)
  }
  k.soft(p, 0.66, 0.045, 1.95, 0.02, R.pad, 0, 0.785, 0.05)
  k.box(p, 0.58, 0.003, 1.8, e.m.paper, 0, 0.809, 0.06, false)
  // Hand grips at the head end, on their posts.
  for (const s of [-1, 1]) put(p, bentTube(e, 'drGrip', [[0, 0, 0], [0, 0.12, 0], [0, 0.12, 0.14], [0, 0, 0.14]], 0.012, 0.03), L.darkTrim, s * 0.43, 0.76, -1.05)
  // Foot pedals: a bar each side of the base for float release and height.
  for (const s of [-1, 1]) {
    k.soft(p, 0.36, 0.035, 0.08, 0.01, L.darkTrim, 0, 0.035, 0.1 + s * 0.6)
    k.box(p, 0.3, 0.004, 0.06, m.rubber, 0, 0.054, 0.1 + s * 0.6, false)
  }
}

/**
 * The upright chest stand (wall bucky): the column on its floor plate and wall bracket with the
 * counterweight cover and height scale, the detector carriage at chest height (its face marked
 * with the three AEC fields and the centring cross), hand grips each side, the cable conduit.
 */
export function chestStand(e: OpdCtx, p: Object3D, centre = 1.35) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.4, 0.02, 0.5, 0.01, L.darkTrim, 0, 0.01, 0.24)
  k.soft(p, 0.26, 2.15, 0.18, 0.03, L.shell, 0, 1.095, 0.09)
  k.box(p, 0.1, 2.0, 0.004, L.darkTrim, 0, 1.1, 0.182, false)
  k.box(p, 0.012, 1.4, 0.003, e.m.whitePlastic, 0.09, 1.1, 0.181, false)
  k.box(p, 0.3, 0.06, 0.06, L.shellGrey, 0, 2.08, 0.04)
  // The carriage and the detector holder, its face with the AEC fields.
  const car = group(p, 0, centre, 0.3)
  k.soft(car, 0.62, 0.62, 0.14, 0.04, L.shell, 0, 0, -0.04)
  k.soft(car, 0.2, 0.2, 0.12, 0.02, L.shellGrey, 0, 0, -0.13)
  face(e, car, 0.5, 0.5, e.o.sign('aecFace', 256, 256, (g, w, h) => {
    g.fillStyle = '#3d4247'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = '#d6dbe0'
    g.lineWidth = 3
    for (const [cx, cy] of [[0.3, 0.38], [0.7, 0.38], [0.5, 0.68]]) g.strokeRect(w * cx - 18, h * cy - 18, 36, 36)
    g.strokeStyle = '#ff5a4a'
    g.beginPath()
    g.moveTo(w / 2, 10)
    g.lineTo(w / 2, h - 10)
    g.moveTo(10, h / 2)
    g.lineTo(w - 10, h / 2)
    g.stroke()
  }, 0.5), 0, 0, 0.031)
  for (const s of [-1, 1]) put(car, bentTube(e, 'chestGrip', [[0, 0.2, -0.05], [0.08, 0.2, -0.02], [0.08, -0.2, -0.02], [0, -0.2, -0.05]], 0.013, 0.04), L.darkTrim, s * 0.31, 0, 0)
  put(p, tube(e, 'chestConduit', [[0.1, 2.05, 0.0], [0.13, 2.4, -0.02], [0.13, 2.9, -0.04]], 0.02), L.darkTrim, 0, 0, 0, false)
  void m
}

/** A lead apron's silhouette, extruded: the wrap-round front with its shoulder straps, 0.6 × 1.0 m. */
function apronGeo(e: OpdCtx) {
  return geo(e, 'leadApron', () => {
    const s = new Shape()
    s.moveTo(-0.29, 0)
    s.lineTo(0.29, 0)
    s.quadraticCurveTo(0.3, 0.45, 0.27, 0.72)
    s.quadraticCurveTo(0.22, 0.82, 0.18, 0.92)
    s.lineTo(0.12, 1.0)
    s.lineTo(0.06, 1.0)
    s.quadraticCurveTo(0.03, 0.86, 0, 0.84)
    s.quadraticCurveTo(-0.03, 0.86, -0.06, 1.0)
    s.lineTo(-0.12, 1.0)
    s.lineTo(-0.18, 0.92)
    s.quadraticCurveTo(-0.22, 0.82, -0.27, 0.72)
    s.quadraticCurveTo(-0.3, 0.45, -0.29, 0)
    const ex = new ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.006, bevelSegments: 2, curveSegments: 6 })
    ex.translate(0, -1.0, 0)
    return ex
  })
}

/**
 * A wall-mounted lead apron rack: the stainless back bar with its swing-out arms, `n` aprons hung
 * flat on their arms (each on its hanger, the shoulder straps over), and thyroid collars on pegs
 * along the bottom rail.
 */
export function apronRack(e: OpdCtx, p: Object3D, n = 4) {
  const { k, m } = e
  const R = rmats(e)
  const w = n * 0.18 + 0.12
  k.box(p, w, 0.08, 0.025, m.stainless, 0, 1.8, 0.0125)
  for (const s of [-1, 1]) k.cyl(p, 0.012, 0.012, 0.02, m.chrome, s * (w / 2 - 0.04), 1.8, 0.03, 10).rotation.x = PI / 2
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 0.12 + i * 0.18
    // The swing arm out from the bar, the hanger on its end, the apron hung on it, edge-on to the wall.
    rod(e, p, 0.009, 0.42, m.chrome, x, 1.79, 0.23, 'z', 10)
    const hang = group(p, x, 1.77, 0.3, PI / 2)
    put(hang, bentTube(e, 'apronHanger', [[-0.18, -0.03, 0], [0, 0.02, 0], [0.18, -0.03, 0]], 0.008, 0.06), e.m.darkPlastic, 0, 0, 0)
    put(hang, apronGeo(e), R.aprons[i % R.aprons.length], 0, -0.02, -0.008)
  }
  k.box(p, w, 0.03, 0.025, m.stainless, 0, 0.95, 0.0125)
  for (let i = 0; i < 3; i++) {
    const x = -w / 2 + 0.15 + i * 0.16
    rod(e, p, 0.006, 0.08, m.chrome, x, 0.95, 0.065, 'z', 8)
    k.soft(p, 0.14, 0.11, 0.025, 0.012, R.aprons[(i + 1) % R.aprons.length], x, 0.88, 0.09)
  }
}

/**
 * The X-ray generator console: a sloped desk unit with its touch panel in a bezel, a row of
 * membrane keys, the key switch and the red emergency stop, the two-stage exposure hand switch in
 * its holder on a coiled lead, and the intercom with its gooseneck microphone.
 */
export function generatorConsole(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  k.soft(p, 0.46, 0.08, 0.32, 0.02, L.shell, 0, 0.04, -0.16)
  const top = group(p, 0, 0.08, -0.1)
  top.rotation.x = -0.45
  k.soft(top, 0.44, 0.24, 0.025, 0.01, L.darkTrim, 0, 0.12, 0)
  face(e, top, 0.3, 0.16, e.o.screen('genPanel', 256, 160, (g, w, h) => {
    g.fillStyle = '#0b1622'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#1c3966'
    g.fillRect(0, 0, w, h * 0.16)
    g.fillStyle = '#ffffff'
    g.font = `700 ${h * 0.1}px Helvetica`
    g.fillText('CHEST PA · ADULT', 8, h * 0.11)
    g.fillStyle = '#7fd4ff'
    g.font = `700 ${h * 0.2}px Helvetica`
    g.fillText('125 kV', 10, h * 0.45)
    g.fillText('4.0 mAs', 10, h * 0.72)
    g.fillStyle = '#9fb2c6'
    g.font = `500 ${h * 0.08}px Helvetica`
    g.fillText('AEC ●○●   FOCUS 0.6   SID 180 cm', 10, h * 0.9)
    g.fillStyle = '#2ecc71'
    g.fillRect(w * 0.68, h * 0.3, w * 0.26, h * 0.42)
    g.fillStyle = '#05140a'
    g.font = `700 ${h * 0.1}px Helvetica`
    g.fillText('READY', w * 0.72, h * 0.54)
  }, 1), -0.04, 0.13, 0.013)
  for (let i = 0; i < 5; i++) k.box(top, 0.03, 0.022, 0.006, e.m.greyPlastic, -0.15 + i * 0.05, 0.02, 0.014, false)
  k.cyl(top, 0.022, 0.026, 0.02, m.red, 0.17, 0.17, 0.02, 20).rotation.x = PI / 2
  k.cyl(top, 0.03, 0.03, 0.004, m.sharps, 0.17, 0.17, 0.013, 20).rotation.x = PI / 2
  k.cyl(top, 0.01, 0.01, 0.012, m.chrome, 0.17, 0.08, 0.018, 12).rotation.x = PI / 2
  // The hand switch in its holder, its coiled lead back into the console.
  const hs = group(p, 0.31, 0, -0.06)
  k.box(hs, 0.06, 0.05, 0.06, L.darkTrim, 0, 0.025, 0)
  k.cyl(hs, 0.02, 0.022, 0.13, m.darkPlastic, 0, 0.11, 0, 16)
  k.cyl(hs, 0.012, 0.012, 0.02, m.vacuum, 0, 0.18, 0, 12)
  put(p, coil(e, 'genHand', [0.31, 0.04, -0.09], [0.2, 0.04, -0.25], 0.012, 12), m.black, 0, 0, 0, false)
  // The intercom: its base and gooseneck microphone.
  const ic = group(p, -0.33, 0, -0.1)
  k.soft(ic, 0.11, 0.045, 0.13, 0.012, m.darkPlastic, 0, 0.022, 0)
  grille(e, ic, 0.07, 0.03, 0, 0.046, 0.02, 0, true).rotation.x = -PI / 2
  put(ic, bentTube(e, 'intercomNeck', [[0, 0.04, -0.03], [0, 0.2, -0.03], [0, 0.26, 0.04]], 0.005, 0.06), m.black, 0, 0, 0)
  k.cyl(ic, 0.01, 0.01, 0.04, m.black, 0, 0.27, 0.06, 10).rotation.x = PI / 2.5
}

/* ---------- ultrasound ---------- */

/**
 * A premium cart ultrasound: the base on four castors with the central foot brake, the console
 * body with its front and rear handles, the control panel (alphanumeric keyboard drawer, trackball
 * ringed with its keys, eight TGC sliders, rotary gain knobs, the touch panel on its stand), three
 * transducers in their holders with cables over the cable hooks, the 21.5" monitor on its two-
 * link articulated arm, a gel warmer and a thermal video printer.
 */
export function ultrasoundCart(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * 0.24, sz * 0.32, 0.06, 0.2 * sx, sz > 0)
  k.soft(p, 0.62, 0.14, 0.8, 0.05, L.shell, 0, 0.18, 0)
  k.soft(p, 0.16, 0.03, 0.08, 0.01, L.darkTrim, 0, 0.11, 0.42)
  k.soft(p, 0.5, 0.62, 0.52, 0.06, L.shell, 0, 0.55, -0.08)
  seam(e, p, 0.48, 0, 0.42, 0.181)
  grille(e, p, 0.3, 0.2, 0, 0.6, 0.182)
  grille(e, p, 0.3, 0.3, 0.251, 0.55, -0.08, PI / 2)
  put(p, bentTube(e, 'usRearHandle', [[-0.2, 0, 0], [-0.2, 0.04, -0.06], [0.2, 0.04, -0.06], [0.2, 0, 0]], 0.014, 0.03), L.darkTrim, 0, 0.82, -0.34)
  // The control deck with its front handle.
  const deck = group(p, 0, 0.9, 0.1)
  deck.rotation.x = -0.12
  k.soft(deck, 0.64, 0.07, 0.46, 0.035, L.shell, 0, 0, 0)
  put(deck, bentTube(e, 'usFrontHandle', [[-0.26, 0, 0], [-0.26, 0, 0.06], [0.26, 0, 0.06], [0.26, 0, 0]], 0.014, 0.03), L.darkTrim, 0, 0.0, 0.23)
  k.box(deck, 0.54, 0.006, 0.3, L.darkTrim, 0, 0.037, 0.04, false)
  // Trackball in its ring, its four keys.
  k.sphere(deck, 0.026, m.black, 0.06, 0.04, 0.1)
  put(deck, lathe(e, 'usBallRing', [[0.028, 0], [0.045, 0], [0.045, 0.006], [0.03, 0.008]], 24), L.trim, 0.06, 0.036, 0.1, false)
  for (const [dx, dz] of [[-0.075, 0], [0.075, 0], [0, -0.07], [0, 0.07]] as const) k.box(deck, 0.04, 0.008, 0.022, e.m.greyPlastic, 0.06 + dx, 0.043, 0.1 + dz, false)
  // TGC sliders and gain knobs.
  for (let i = 0; i < 8; i++) {
    k.box(deck, 0.004, 0.003, 0.06, m.black, -0.24 + i * 0.016, 0.042, 0.0, false)
    k.box(deck, 0.01, 0.012, 0.01, e.m.whitePlastic, -0.24 + i * 0.016, 0.047, -0.02 + ((i * 7) % 5) * 0.008, false)
  }
  for (let i = 0; i < 5; i++) k.cyl(deck, 0.014, 0.016, 0.018, i === 2 ? L.accent : m.darkPlastic, -0.18 + i * 0.07, 0.05, 0.13, 16)
  for (let i = 0; i < 12; i++) k.box(deck, 0.026, 0.008, 0.018, i % 4 === 1 ? L.accent : e.m.greyPlastic, 0.14 + (i % 4) * 0.032, 0.043, -0.04 + Math.floor(i / 4) * 0.028, false)
  // The keyboard drawer, half out under the deck's front.
  k.box(deck, 0.42, 0.015, 0.14, L.shellGrey, 0, -0.04, 0.2)
  k.box(deck, 0.38, 0.004, 0.11, m.darkPlastic, 0, -0.031, 0.2, false)
  // The touch panel on its stand at the back of the deck.
  const touch = group(deck, 0, 0.12, -0.16)
  touch.rotation.x = -0.55
  k.soft(touch, 0.32, 0.22, 0.025, 0.01, L.darkTrim, 0, 0, 0)
  face(e, touch, 0.29, 0.19, e.o.his('usTouch', 'ABDOMEN · PRESETS', 'form'), 0, 0, 0.013)
  // Probes in their holders on the left and right, cables over the hooks.
  const probe = [lathe(e, 'usConvex', [[0, -0.07], [0.012, -0.07], [0.02, -0.04], [0.026, 0.0], [0.03, 0.02], [0, 0.025]], 14), lathe(e, 'usLinear', [[0, -0.08], [0.012, -0.08], [0.016, -0.03], [0.02, 0.0], [0.022, 0.02], [0, 0.022]], 14), lathe(e, 'usPhased', [[0, -0.07], [0.011, -0.07], [0.015, -0.02], [0.016, 0.01], [0.012, 0.018], [0, 0.018]], 14)]
  for (let i = 0; i < 3; i++) {
    const s = i < 2 ? -1 : 1
    const zz = i < 2 ? -0.05 + i * 0.12 : 0.02
    const h = group(p, s * 0.37, 0.88, zz)
    k.soft(h, 0.06, 0.07, 0.07, 0.01, L.darkTrim, 0, 0, 0)
    put(h, probe[i], e.m.whitePlastic, 0, 0.09, 0)
    put(p, tube(e, `usProbeCable${i}`, [[s * 0.37, 0.98, zz], [s * 0.4, 1.12, zz + 0.02], [s * 0.36, 1.12, -0.25], [s * 0.3, 0.75, -0.3], [s * 0.26, 0.45, -0.32]], 0.006), m.black, 0, 0, 0, false)
  }
  for (const s of [-1, 1]) put(p, bentTube(e, 'usCableHook', [[0, 0, 0], [0, 0.12, 0], [0, 0.14, 0.04]], 0.006, 0.02), L.darkTrim, s * 0.36, 1.0, -0.28)
  // The monitor on its articulated arm: a post, two links with their joints, the tilt head.
  k.cyl(p, 0.035, 0.035, 0.2, L.shell, 0, 1.0, -0.28, 16)
  k.soft(p, 0.07, 0.06, 0.3, 0.02, L.shellGrey, 0, 1.12, -0.18)
  k.cyl(p, 0.04, 0.04, 0.06, L.trim, 0, 1.12, -0.04, 18)
  k.soft(p, 0.06, 0.18, 0.06, 0.02, L.shellGrey, 0, 1.22, -0.04)
  const mon = group(p, 0, 1.55, -0.02)
  mon.rotation.x = -0.08
  k.soft(mon, 0.56, 0.37, 0.05, 0.015, m.black, 0, 0, 0)
  k.box(mon, 0.2, 0.15, 0.04, m.black, 0, -0.04, -0.04)
  face(e, mon, 0.52, 0.32, e.o.screen('usImage', 256, 160, (g, w, h) => {
    g.fillStyle = '#000'
    g.fillRect(0, 0, w, h)
    const gr = g.createRadialGradient(w / 2, 0, 10, w / 2, 0, h)
    gr.addColorStop(0, 'rgba(170,170,170,.75)')
    gr.addColorStop(0.7, 'rgba(70,70,70,.5)')
    gr.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = gr
    g.beginPath()
    g.moveTo(w / 2, 8)
    g.lineTo(w * 0.15, h * 0.95)
    g.lineTo(w * 0.85, h * 0.95)
    g.closePath()
    g.fill()
    g.fillStyle = 'rgba(10,10,10,.85)'
    g.beginPath()
    g.ellipse(w * 0.55, h * 0.55, w * 0.1, h * 0.08, 0.3, 0, PI * 2)
    g.fill()
    g.fillStyle = '#d9d9d9'
    g.font = `500 ${h * 0.06}px Helvetica`
    g.fillText('C5-1  ABD  12 cm  GN 52', 6, h * 0.08)
    g.fillText('FR 32 Hz', w - 50, h * 0.08)
  }, 0.9), 0, 0, 0.026)
  // Gel warmer with its bottles, the video printer, a basket.
  const gw = group(p, -0.17, 0.95, -0.25)
  k.soft(gw, 0.13, 0.1, 0.1, 0.015, e.m.whitePlastic, 0, 0.05, 0)
  for (const s of [-1, 1]) {
    k.cyl(gw, 0.022, 0.022, 0.13, m.blue, s * 0.032, 0.12, 0, 14)
    k.cyl(gw, 0.008, 0.012, 0.03, e.m.whitePlastic, s * 0.032, 0.2, 0, 10)
  }
  const pr = group(p, 0.18, 0.62, 0.181)
  k.box(pr, 0.16, 0.08, 0.04, m.darkPlastic, 0, 0, -0.02)
  k.box(pr, 0.11, 0.004, 0.002, m.black, 0, 0.0, 0.001, false)
  led(e, pr, 0.06, 0.025, 0.001, 'green')
}

/* ---------- pulmonary function ---------- */

/** A PC-based spirometer on a desk: its sensor handle with the turbine and a disposable filter-mouthpiece, its USB lead, a box of filters and nose clips. */
export function spirometer(e: OpdCtx, p: Object3D, x: number, y: number, z: number, ry = 0) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  k.soft(g, 0.1, 0.03, 0.16, 0.012, m.darkPlastic, 0, 0.015, 0)
  const h = group(g, 0, 0.055, 0)
  h.rotation.z = PI / 2
  put(h, lathe(e, 'spiroHandle', [[0, -0.07], [0.018, -0.07], [0.02, -0.02], [0.024, 0.02], [0.028, 0.03], [0.028, 0.08], [0, 0.08]], 16), e.m.whitePlastic, 0, 0, 0)
  put(h, lathe(e, 'spiroFilter', [[0.012, 0.08], [0.03, 0.085], [0.034, 0.11], [0.014, 0.135], [0.012, 0.15]], 16), e.m.clearPlastic, 0, 0, 0, false)
  put(g, bentTube(e, 'spiroCable', [[-0.06, 0.05, 0], [-0.1, 0.01, 0.04], [-0.2, 0.004, -0.05]], 0.003, 0.03), m.greyPlastic, 0, 0, 0, false)
  k.box(g, 0.1, 0.06, 0.07, e.m.whitePlastic, 0.16, 0.03, -0.04, false)
  k.box(g, 0.04, 0.012, 0.03, m.blue, 0.16, 0.006, 0.06, false)
  return g
}

/** A 3-litre calibration syringe lying in its cradle: the aluminium barrel, the plunger rod and its stops, the outlet. */
export function calibrationSyringe(e: OpdCtx, p: Object3D, x: number, y: number, z: number) {
  const { k, m } = e
  const L = labMats(e)
  const g = group(p, x, y, z)
  for (const s of [-1, 1]) k.box(g, 0.04, 0.03, 0.14, L.darkTrim, s * 0.18, 0.015, 0, false)
  const b = group(g, 0, 0.075, 0)
  b.rotation.z = PI / 2
  put(b, lathe(e, 'calBarrel', [[0, -0.3], [0.02, -0.3], [0.02, -0.28], [0.065, -0.27], [0.068, -0.25], [0.068, 0.25], [0.065, 0.27], [0, 0.27]], 22), m.aluminium, 0, 0, 0)
  rod(e, g, 0.012, 0.3, m.chrome, 0.42, 0.075, 0, 'x', 10)
  k.cyl(g, 0.045, 0.045, 0.02, m.black, 0.57, 0.075, 0, 18).rotation.z = PI / 2
  k.cyl(g, 0.02, 0.02, 0.02, m.red, 0.29, 0.075, 0, 14).rotation.z = PI / 2
}

/**
 * A whole-body plethysmograph (body box), 0.86 × 0.86 × 1.9 m: the aluminium-framed cabin of clear
 * acrylic panels on its base (which holds the electronics, with its vents and status lamp), the
 * door (operated) with its hinges, handle and seal, the swivel seat inside, the pneumotach and
 * shutter assembly with its filter and mouthpiece on an adjustable arm, the intercom handset.
 */
export function bodyBox(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const L = labMats(e)
  const w = 0.86
  const h = 1.9
  const base = 0.16
  k.soft(p, w + 0.06, base, w + 0.06, 0.03, L.shell, 0, base / 2, -w / 2)
  grille(e, p, 0.4, 0.06, 0.1, 0.08, 0.031)
  led(e, p, -0.3, 0.1, 0.031, 'green')
  k.soft(p, w + 0.06, 0.12, w + 0.06, 0.03, L.shell, 0, h + 0.06, -w / 2)
  // The frame: corner posts and rails in anodised aluminium.
  for (const sx of [-1, 1]) for (const sz of [0, -1]) k.box(p, 0.04, h - base, 0.04, m.aluminium, sx * w / 2, (h + base) / 2, sz * w)
  for (const y of [base + 0.02, h - 0.02]) for (const sz of [0, -1]) k.box(p, w, 0.04, 0.04, m.aluminium, 0, y, sz * w)
  for (const sx of [-1, 1]) k.box(p, 0.04, 0.04, w, m.aluminium, sx * w / 2, h - 0.02, -w / 2)
  // Clear panels on the sides and back.
  for (const sx of [-1, 1]) k.box(p, 0.008, h - base - 0.06, w - 0.05, e.o.screenGlass, sx * w / 2, (h + base) / 2, -w / 2, false)
  k.box(p, w - 0.05, h - base - 0.06, 0.008, e.o.screenGlass, 0, (h + base) / 2, -w, false)
  // Inside: the swivel seat on its column, the pneumotach on its arm, the handset.
  k.cyl(p, 0.035, 0.05, 0.36, L.trim, 0, base + 0.18, -w * 0.62, 16)
  k.soft(p, 0.44, 0.07, 0.4, 0.025, m.vinylSeat, 0, base + 0.39, -w * 0.62)
  k.soft(p, 0.42, 0.42, 0.06, 0.025, m.vinylSeat, 0, base + 0.64, -w * 0.88)
  k.box(p, 0.03, 0.5, 0.03, m.aluminium, 0.36, base + 0.85, -w * 0.12)
  rod(e, p, 0.012, 0.3, m.aluminium, 0.22, base + 1.1, -w * 0.12, 'x', 10)
  const pt = group(p, 0.07, base + 1.08, -w * 0.12)
  put(pt, lathe(e, 'pneumotach', [[0, -0.06], [0.03, -0.06], [0.03, 0.06], [0, 0.06]], 16), e.m.whitePlastic, 0, 0, 0).rotation.x = PI / 2
  put(pt, lathe(e, 'pneumoFilter', [[0.014, 0.06], [0.032, 0.066], [0.036, 0.1], [0.014, 0.12], [0.014, 0.14]], 16), e.m.clearPlastic, 0, 0, 0, false).rotation.x = PI / 2
  k.soft(p, 0.05, 0.12, 0.04, 0.015, m.darkPlastic, -0.38, base + 1.1, -w * 0.3)
  // The door on the front, hinged left: glass in its frame with the handle and seal.
  cupboardDoor(e, p, -w / 2 + 0.02, (h + base) / 2, 0.0, { w: w - 0.04, h: h - base - 0.05, hinge: 'left', face: m.aluminium, glass: true, label: 'Body Box Door', angle: 1.6 })
}

/** A Snellen vision chart in its lit wall cabinet, at eye height. */
export function visionChart(e: OpdCtx, p: Object3D, y = 1.55) {
  const { k, m } = e
  k.soft(p, 0.42, 0.66, 0.07, 0.012, e.m.whitePlastic, 0, y, 0.035)
  face(e, p, 0.36, 0.58, e.o.screen('snellen', 180, 290, (g, w, hh) => {
    g.fillStyle = '#ffffff'
    g.fillRect(0, 0, w, hh)
    g.fillStyle = '#111'
    g.textAlign = 'center'
    const rows = ['E', 'F P', 'T O Z', 'L P E D', 'P E C F D', 'E D F C Z P', 'F E L O P Z D']
    let yy = 10
    rows.forEach((r, i) => {
      const s = Math.max(8, 70 - i * 10)
      g.font = `700 ${s}px Helvetica`
      yy += s + 4
      g.fillText(r, w / 2, yy)
    })
    g.fillStyle = '#c8161d'
    g.fillRect(10, hh - 30, w - 20, 2)
  }, 0.7), 0, y, 0.0705)
  k.cyl(p, 0.01, 0.01, 0.006, m.darkPlastic, 0.17, y - 0.3, 0.071, 12).rotation.x = PI / 2
}

/** Re-exported so the rooms can build their own small fittings in the same style. */
export { feet, keypad, lcd }
