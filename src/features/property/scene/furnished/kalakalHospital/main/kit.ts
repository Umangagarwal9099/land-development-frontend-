import { CanvasTexture, Group, Mesh, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace, Vector3, type Material, type Object3D } from 'three'
import { PI } from '../../kit'
import { ceilingFan } from '../../kalakalD65/fixtures'
import { chime, click } from '../../basement/sound'
import { bake, bentTube, carcass, castor, cupboardDoor, drape, drawer, face, geo, group, lathe, panel, pillow, put, rod, tube } from '../erKit'
import { furnMats, infusionBag } from '../erFurniture'
import { outlet } from '../erEquipment'
import type { OpdCtx, Room } from '../opd/ctx'

/*
 * The main block's shared pieces: what every inpatient room, suite and ward station is furnished
 * from, built after the products such rooms are fitted with. An electrically adjusted inpatient
 * bed (after the 5-function ward beds in common use: split side rails, central locking, a
 * nurse's control panel in the footboard, a patient's handset), its ICU and premium versions; the
 * bed-head unit with medical gases, the reading light and a nurse call that really calls (its
 * light over the door outside comes on, a chime sounds at the nurses' station); a wardrobe whose
 * doors and drawers open; a wall TV and a split air-conditioner that switch on; the ceiling fan of
 * the non-AC rooms. Everything is built in its own frame, front towards +z, on y = 0, at true size.
 */

const cache = new WeakMap<object, ReturnType<typeof make>>()

function make(e: OpdCtx) {
  const std = (color: string, roughness: number, metalness = 0) => new MeshStandardMaterial({ color, roughness, metalness })
  const glow = (color: string, emissive: string, intensity = 1.2) => e.lighting.glow(new MeshStandardMaterial({ color, emissive, emissiveIntensity: intensity, roughness: 0.4 }), 0.9)
  return {
    /** The bed's frame: epoxy powder-coated steel, a warm light grey. */
    frame: std('#c7c9c8', 0.42, 0.35),
    /** Moulded ABS: bed ends, rails, covers. */
    abs: std('#e9e9e6', 0.38),
    absGrey: std('#9ea3a6', 0.45),
    absDark: std('#3d4246', 0.5),
    /** The mattress cover: a blue-grey PU fabric, vapour permeable. */
    mattress: std('#5f7d92', 0.62),
    mattressIcu: std('#3f5d73', 0.6),
    /** Laminate bed ends for the premium beds, a warm oak. */
    oakEnd: new MeshStandardMaterial({ map: e.k.tex.finish('oak', 1, 1), color: '#c9a77d', roughness: 0.45 }),
    walnut: new MeshStandardMaterial({ map: e.k.tex.finish('walnut', 1, 1), color: '#8a6446', roughness: 0.45 }),
    /** Wardrobe carcass and fronts: a pale oak laminate (wards), walnut (suites). */
    oakFront: new MeshStandardMaterial({ map: e.k.tex.finish('oak', 1, 2), color: '#d8bf98', roughness: 0.5 }),
    /** The TV's bezel, back and its screen, off and on. */
    tvBlack: std('#121314', 0.35, 0.2),
    tvOff: std('#08090a', 0.15, 0.4),
    /** The air-conditioner's white plastic and its display. */
    acWhite: std('#f4f5f3', 0.32),
    acVent: std('#d9dbd9', 0.5),
    acLed: glow('#3fa9ff', '#3fa9ff', 1.4),
    acLedOff: std('#26313a', 0.4),
    /** The fan's white enamel, its blades. */
    fanBody: std('#f2f2ef', 0.35),
    fanBlade: std('#ecebe6', 0.42),
    fanIron: std('#b8bbbd', 0.3, 0.6),
    /** The nurse call's lamps: off, and lit (call: red; at the station: amber). */
    callOff: std('#e8dede', 0.35),
    callRed: glow('#ff3030', '#ff2020', 2.0),
    callAmber: glow('#ffb020', '#ff9a00', 1.8),
    /** Cord, the handset's buttons. */
    cord: std('#e5e5e2', 0.6),
    red: std('#c8161d', 0.45),
    green: std('#1d9a4a', 0.45),
    yellow: std('#e9b81c', 0.45),
    blue: std('#2f6fc4', 0.45),
    /** Hangers, the wardrobe's rail. */
    chrome: std('#c9ced1', 0.18, 0.95),
    /** Folded and hung linen, the patient's gown. */
    gown: std('#8fb9cf', 0.85),
    towel: std('#f3f1ea', 0.95),
  }
}

/** The main block's shared finishes, made once per model. */
export function kitMats(e: OpdCtx) {
  let c = cache.get(e.o)
  if (!c) cache.set(e.o, (c = make(e)))
  return c
}

/* ---------- the inpatient bed ---------- */

export interface WardBedFit {
  /** The backrest's angle, radians up from flat. */
  back?: number
  /** The knee break: the thigh section raised, radians. */
  knee?: number
  /** Linen: made up and waiting, in use (the blanket thrown back), or stripped to the sheet. */
  linen?: 'made' | 'used' | 'sheet'
  /** Ward (grey ABS ends), ICU (alternating-pressure mattress, CPR release, X-ray tunnel), premium (oak ends). */
  style?: 'ward' | 'icu' | 'premium'
  /** Mattress top above the floor (the platform rises from 0.40 to 0.80). */
  height?: number
  /** The side rails start lowered (on the side given: −1, 1, or both with 0). */
  railsDown?: -1 | 0 | 1
  /** An IV pole raised at the head with a bag. */
  iv?: boolean
}

/**
 * The bed along local z, head at −z, 2.18 m over its bumpers and 1.02 m over its rails: four
 * 125 mm twin castors with the central brake and steer pedals at the foot; the low chassis under
 * its moulded cover; two lift columns in telescopic shrouds; the four-section platform on its
 * steel frame (backrest operated: Raise / Lower; the knee break follows it); the mattress and its
 * linen; split side rails, the head pair on the backrest with the patient's controls, the foot
 * pair on the frame (each operated: Lower / Raise); the head and foot ends, the footboard with the
 * nurse's control panel; corner bumpers, IV pole sockets, the patient's handset on its cord.
 */
export function wardBed(e: OpdCtx, p: Object3D, o: WardBedFit = {}) {
  const { k, m } = e
  const c = kitMats(e)
  const style = o.style ?? 'ward'
  const top = o.height ?? 0.64
  const MT = style === 'icu' ? 0.16 : 0.14
  const deck = top - MT
  const L = 2.0
  const W = 0.9
  // Castors, their swivel housings and the central brake bar with its pedals at both ends.
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * 0.37, sz * 0.86, 0.0625, sx * sz * 0.2 + (e.r() - 0.5) * 0.3, sz > 0)
  for (const sz of [-1, 1]) {
    rod(e, p, 0.011, 0.82, m.stainless, 0, 0.13, sz * 0.86, 'x', 10)
    for (const sx of [-1, 1]) {
      k.soft(p, 0.11, 0.025, 0.07, 0.01, sx > 0 ? c.green : c.red, sx * 0.47, 0.13, sz * 0.86)
      k.box(p, 0.04, 0.02, 0.02, c.absDark, sx * 0.43, 0.13, sz * 0.86)
    }
  }
  // The chassis: two rails and cross members, the moulded base cover over them.
  for (const sx of [-1, 1]) k.box(p, 0.06, 0.07, 1.78, c.frame, sx * 0.34, 0.17, 0)
  for (const sz of [-0.86, 0.86]) k.box(p, 0.74, 0.06, 0.07, c.frame, 0, 0.17, sz)
  k.soft(p, 0.8, 0.09, 1.5, 0.035, style === 'icu' ? c.absGrey : c.abs, 0, 0.24, 0)
  k.soft(p, 0.62, 0.012, 1.2, 0.005, c.absDark, 0, 0.29, 0)
  // Lift columns in their stepped telescopic shrouds.
  const rise = deck - 0.33
  for (const z of [-0.55, 0.55]) {
    k.soft(p, 0.2, rise * 0.5, 0.16, 0.02, c.absGrey, 0, 0.29 + rise * 0.25, z)
    k.soft(p, 0.17, rise * 0.55, 0.13, 0.018, c.abs, 0, 0.29 + rise * 0.72, z)
    k.box(p, 0.24, 0.04, 0.2, c.frame, 0, deck - 0.06, z)
  }
  // The platform frame: side members and ends in rectangular tube.
  for (const sx of [-1, 1]) k.box(p, 0.04, 0.06, L - 0.06, c.frame, sx * (W / 2 - 0.02), deck - 0.05, 0)
  for (const sz of [-1, 1]) k.box(p, W, 0.06, 0.04, c.frame, 0, deck - 0.05, sz * (L / 2 - 0.02))
  // Sections (back 0.78, seat 0.24, thigh 0.36, leg 0.62 m): perforated steel decks.
  const seat0 = -0.22
  const seat1 = 0.02
  k.box(p, W - 0.08, 0.012, seat1 - seat0, c.frame, 0, deck - 0.012, (seat0 + seat1) / 2)
  // Knee break: the thigh section tilts up from the seat, the leg section rests flat beyond it.
  const knee = o.knee ?? Math.min(0.18, (o.back ?? 0) * 0.3)
  const thigh = group(p, 0, deck, seat1)
  thigh.rotation.x = -knee
  const tl = 0.36
  k.box(thigh, W - 0.08, 0.012, tl, c.frame, 0, -0.012, tl / 2)
  k.soft(thigh, W - 0.02, MT, tl, 0.03, style === 'icu' ? c.mattressIcu : c.mattress, 0, MT / 2, tl / 2)
  const kneeTop = Math.sin(knee) * tl
  const legZ = seat1 + Math.cos(knee) * tl
  const leg = group(p, 0, deck + kneeTop, legZ)
  leg.rotation.x = Math.atan2(kneeTop, L / 2 - legZ)
  const ll = Math.hypot(L / 2 - 0.02 - legZ, kneeTop)
  k.box(leg, W - 0.08, 0.012, ll, c.frame, 0, -0.012, ll / 2)
  k.soft(leg, W - 0.02, MT, ll, 0.03, style === 'icu' ? c.mattressIcu : c.mattress, 0, MT / 2, ll / 2)
  k.soft(p, W - 0.02, MT, seat1 - seat0, 0.03, style === 'icu' ? c.mattressIcu : c.mattress, 0, deck + MT / 2, (seat0 + seat1) / 2)
  if (style === 'icu') {
    // The alternating-pressure cells across the mattress, and its pump hung on the footboard.
    for (let z = seat0 + 0.08; z < L / 2 - 0.1; z += 0.12) k.box(p, W - 0.05, 0.006, 0.012, c.absDark, 0, deck + MT + 0.002, z, false)
  }
  // The sheet over the lower sections (draped), the blanket.
  const seed = (e.r() * 100) | 0
  put(p, drape(e, `wbSeat${seed}`, W, 0.7 + ll * 0.5, 0.09, 0, seed), m.sheet, 0, deck + MT + 0.004, 0.18)
  if (o.linen === 'made' || o.linen === undefined) {
    // Folded at the foot, a coverlet in the hospital's blue over it.
    for (let i = 0; i < 3; i++) k.soft(p, 0.72 - i * 0.01, 0.028, 0.36, 0.012, i === 2 ? m.sheet : m.blanket, 0.01 * i, deck + kneeTop + MT + 0.03 + i * 0.027, L / 2 - 0.3)
  } else if (o.linen === 'used') {
    put(p, drape(e, `wbBlanket${seed}`, W + 0.04, 1.0, 0.17, 0, seed + 7), m.blanket, 0, deck + MT + 0.04 + kneeTop * 0.5, 0.35)
    k.soft(p, W + 0.06, 0.05, 0.16, 0.024, m.blanket, 0, deck + MT + 0.05, -0.12)
  }
  // The backrest, hinged at the seat: deck, mattress, linen and pillow, the head rails; operated.
  const back = new Group()
  back.name = `door_er_${e.ids++}`
  back.position.set(0, deck, seat0)
  back.rotation.x = o.back ?? 0.25
  const raised = (o.back ?? 0.25) < 0.45
  back.userData = { axis: 'x', openAngle: (raised ? 1.05 : 0.12) - (o.back ?? 0.25), label: 'Bed Backrest', verbs: raised ? ['Raise', 'Lower'] : ['Lower', 'Raise'] }
  p.add(back)
  const BL = L / 2 + seat0 - 0.02
  k.box(back, W - 0.08, 0.012, BL, c.frame, 0, -0.012, -BL / 2)
  for (const sx of [-1, 1]) k.box(back, 0.04, 0.05, BL, c.frame, sx * (W / 2 - 0.02), -0.045, -BL / 2)
  const mat = k.soft(back, W - 0.02, MT, BL, 0.03, style === 'icu' ? c.mattressIcu : c.mattress, 0, MT / 2, -BL / 2)
  put(back, drape(e, `wbBack${seed}`, W, BL, 0.09, 0, seed + 3), m.sheet, 0, MT + 0.004, -BL / 2)
  if (o.linen !== 'sheet') {
    const pl = put(back, pillow(e, 0.62, 0.14, 0.42), m.sheet, (e.r() - 0.5) * 0.05, MT + 0.075, -BL + 0.3)
    pl.rotation.set(-0.06, (e.r() - 0.5) * 0.1, 0)
  }
  mat.userData.front = true
  bake(back, mat)
  // Side rails: the head pair on the backrest, the foot pair on the frame, each lowering on its arms.
  const rail = (parent: Group, s: number, len: number, z: number, controls: boolean) => {
    const down = o.railsDown !== undefined && (o.railsDown === 0 || o.railsDown === s)
    const r = new Group()
    r.name = `drawer_er_${e.ids++}`
    r.position.set(s * (W / 2 + 0.035), 0.24 - (down ? 0.28 : 0), z)
    r.userData = { slide: down ? [0, 0.28, 0] : [0, -0.28, 0], label: 'Side Rail', verbs: down ? ['Raise', 'Lower'] : ['Lower', 'Raise'] }
    parent.add(r)
    const pan = put(r, panel(e, len, 0.3, 0.035, 0.07, [[len - 0.24, 0.13, 0, 0.02]]), style === 'premium' ? c.abs : c.abs)
    pan.rotation.y = PI / 2
    // The top rail's grip edge, the arms down to the frame.
    k.soft(r, 0.045, 0.04, len - 0.02, 0.018, c.absGrey, 0, 0.15, 0)
    for (const dz of [-len / 2 + 0.12, len / 2 - 0.12]) k.box(r, 0.025, 0.22, 0.035, c.frame, -s * 0.012, -0.2, dz)
    if (controls) {
      // The patient's control pad moulded into the rail: up/down arrows, the call button.
      k.soft(r, 0.012, 0.09, 0.2, 0.01, c.absDark, s * 0.02, 0.0, 0.05)
      for (let i = 0; i < 3; i++) k.box(r, 0.006, 0.022, 0.03, i === 2 ? c.red : c.absGrey, s * 0.027, 0.0 + (i === 2 ? 0 : (i - 0.5) * 0.04), i === 2 ? 0.11 : 0.02, false)
    }
    pan.userData.front = true
    bake(r, pan)
  }
  for (const s of [-1, 1]) {
    rail(back, s, 0.62, -0.42, true)
    rail(p as Group, s, 0.86, 0.48, false)
  }
  // The head end: a moulded or laminate panel with a hand hold, on posts into the frame.
  const endMat = style === 'premium' ? c.oakEnd : style === 'icu' ? c.absGrey : c.abs
  const hb = put(p, panel(e, 0.98, 0.44, 0.04, 0.08, [[0.5, 0.07, 0, 0.12]]), endMat, 0, deck + 0.17, -L / 2 - 0.05)
  hb.castShadow = true
  if (style !== 'premium') k.soft(p, 1.0, 0.05, 0.06, 0.02, c.absGrey, 0, deck + 0.4, -L / 2 - 0.05)
  else k.soft(p, 1.0, 0.04, 0.05, 0.015, c.walnut, 0, deck + 0.4, -L / 2 - 0.05)
  // The foot end with the nurse's control panel and the chart.
  put(p, panel(e, 0.98, 0.38, 0.045, 0.08, [[0.5, 0.07, 0, 0.1]]), endMat, 0, deck + 0.13, L / 2 + 0.05)
  const pnl = group(p, 0.22, deck + 0.12, L / 2 + 0.075)
  k.soft(pnl, 0.3, 0.13, 0.02, 0.012, c.absDark, 0, 0, 0)
  for (let i = 0; i < 8; i++) k.box(pnl, 0.028, 0.022, 0.004, i === 7 ? c.yellow : c.absGrey, -0.11 + (i % 4) * 0.045, i < 4 ? 0.028 : -0.012, 0.012, false)
  k.box(pnl, 0.06, 0.03, 0.004, c.green, 0.1, 0.035, 0.012, false)
  k.box(p, 0.17, 0.23, 0.012, c.absDark, -0.24, deck + 0.14, L / 2 + 0.08)
  k.box(p, 0.15, 0.2, 0.003, m.paper, -0.24, deck + 0.135, L / 2 + 0.088, false)
  if (style === 'icu') {
    // The mattress pump hung on the footboard, the red CPR release at the head, the X-ray tunnel.
    k.soft(p, 0.3, 0.16, 0.09, 0.02, c.abs, -0.18, deck + 0.42, L / 2 + 0.11)
    k.box(p, 0.08, 0.04, 0.004, c.acLed, -0.18, deck + 0.46, L / 2 + 0.157, false)
    for (const s of [-1, 1]) k.soft(p, 0.05, 0.06, 0.12, 0.02, c.red, s * (W / 2 + 0.01), deck - 0.07, -0.3)
    k.box(p, W - 0.1, 0.01, 0.6, c.absGrey, 0, deck - 0.03, -0.55, false)
  }
  // Corner bumpers; IV sockets at the head corners.
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(p, lathe(e, 'wbBumper', [[0, -0.032], [0.042, -0.032], [0.048, -0.02], [0.048, 0.02], [0.042, 0.032], [0, 0.032]], 20), c.absDark, sx * 0.47, deck - 0.05, sz * (L / 2 + 0.03))
  for (const sx of [-1, 1]) k.cyl(p, 0.018, 0.018, 0.08, c.frame, sx * 0.43, deck - 0.02, -L / 2 + 0.02, 12)
  if (o.iv) {
    k.cyl(p, 0.012, 0.012, 1.35, m.stainless, 0.43, deck + 0.68, -L / 2 + 0.02, 10)
    for (const a of [0, PI / 2, PI, -PI / 2]) put(p, bentTube(e, 'wbIvHook', [[0, 0, 0], [0.07, 0.01, 0], [0.08, 0.05, 0]], 0.004, 0.02), m.stainless, 0.43, deck + 1.33, -L / 2 + 0.02).rotation.y = a
    infusionBag(e, p, 0.5, deck + 1.2, -L / 2 + 0.02)
  }
  // The patient's handset, clipped to the head rail on its coiled cord.
  const hs = group(p, -(W / 2 + 0.09), deck + 0.36, -0.3)
  k.soft(hs, 0.045, 0.15, 0.025, 0.012, c.abs, 0, 0, 0)
  for (let i = 0; i < 4; i++) k.box(hs, 0.026, 0.016, 0.004, i === 0 ? c.red : c.absGrey, 0, 0.045 - i * 0.026, 0.0135, false)
  put(p, tube(e, 'wbHandsetCord', [[-(W / 2 + 0.09), deck + 0.28, -0.3], [-(W / 2 + 0.05), deck + 0.05, -0.4], [-(W / 2 - 0.02), deck - 0.05, -0.55]], 0.004), c.cord)
}

/* ---------- the bed-head unit and the nurse call ---------- */

export interface CallLink {
  /** The lamp over the room's door outside, and the station's lamp for this room, lit on a call. */
  lamps: Mesh[]
}

/** A room's call circuit: whatever lamps light when one of its call points is pressed, and its state. */
export function callLink(): CallLink {
  return { lamps: [] }
}

const calls = new WeakMap<CallLink, { on: boolean }>()

function setCall(e: OpdCtx, link: CallLink, on: boolean) {
  const c = kitMats(e)
  let s = calls.get(link)
  if (!s) calls.set(link, (s = { on: false }))
  s.on = on
  for (const l of link.lamps) l.material = on ? (l.userData.lit as Material) : c.callOff
}

/**
 * A nurse call point (a button_ the walker presses): pressed, it calls (the lamps of `link` light,
 * a chime sounds); pressed again (the reset), it cancels. Its own face, a red button in a white
 * plate, at (x, y, z) in `p` facing +z.
 */
export function callButton(e: OpdCtx, p: Object3D, link: CallLink, x: number, y: number, z: number, label = 'Nurse Call', reset = false) {
  const { k } = e
  const c = kitMats(e)
  const node = new Group()
  node.name = `button_call_${e.ids++}`
  node.position.set(x, y, z)
  p.add(node)
  k.soft(node, 0.086, 0.086, 0.012, 0.006, c.abs, 0, 0, 0.006)
  const disc = k.cyl(node, 0.022, 0.022, 0.012, reset ? c.green : c.red, 0, 0, 0.016, 24)
  disc.rotation.x = PI / 2
  node.userData.label = reset ? 'Nurse Call Reset' : label
  node.userData.verb = 'Press'
  node.userData.press = () => {
    const at = node.getWorldPosition(new Vector3())
    click(at)
    const on = !reset && !calls.get(link)?.on
    setCall(e, link, on)
    if (on) chime(at, false)
  }
  return node
}

/**
 * A call lamp (corridor dome light over a door, or a room's indicator at the nurses' station): a
 * white dome on a square base at (x, y, z) facing +z, lit `colour` while `link` calls. Kept whole
 * (live_*) so its lamp can light.
 */
export function callLamp(e: OpdCtx, p: Object3D, link: CallLink, x: number, y: number, z: number, colour: 'red' | 'amber' = 'red') {
  const { k } = e
  const c = kitMats(e)
  const g = new Group()
  g.name = `live_calllamp_${e.ids++}`
  g.position.set(x, y, z)
  p.add(g)
  k.box(g, 0.12, 0.12, 0.02, c.abs, 0, 0, 0.01)
  const dome = put(g, geo(e, 'callDome', () => {
    const d = lathe(e, 'callDomeL', [[0, 0], [0.045, 0], [0.042, 0.02], [0.03, 0.038], [0, 0.044]], 20)
    return d
  }), c.callOff, 0, 0, 0.02, false)
  dome.rotation.x = PI / 2
  dome.userData.lit = colour === 'red' ? c.callRed : c.callAmber
  link.lamps.push(dome)
  return g
}

export interface BedHeadOpts {
  /** Medical gases: O₂ and vacuum (wards), O₂, air and vacuum (ICU, premium). */
  gases?: 'ward' | 'full'
  /** The suites' unit: a walnut-faced panel behind the bed instead of white trunking. */
  premium?: boolean
  width?: number
}

/**
 * The bed-head unit, against the wall at z = 0 behind a bed's head (centred at x = 0): a run of
 * trunking at 1.45 m with the reading light's lens and an uplight along its top, the gas terminal
 * units, raw and UPS-backed (red) sockets, data, the nurse-call socket and its call button (wired
 * to `link`), the bed's handset parked on its hook; the crash rail at 0.8 m below it. In a suite
 * the trunking stands on a full-height walnut panel. Returns the group.
 */
export function bedHead(e: OpdCtx, p: Object3D, link: CallLink, o: BedHeadOpts = {}) {
  const { k, m } = e
  const c = kitMats(e)
  const W = o.width ?? 2.0
  if (o.premium) {
    // A walnut feature panel behind the bed, lit from a recessed strip over it.
    k.box(p, W + 0.6, 2.4, 0.03, c.walnut, 0, 1.2, 0.015)
    for (let i = 1; i < 6; i++) k.box(p, 0.006, 2.38, 0.002, c.absDark, -W / 2 - 0.3 + (i * (W + 0.6)) / 6, 1.2, 0.031, false)
    k.box(p, W + 0.6, 0.012, 0.03, m.ledLine, 0, 2.39, 0.04, false)
  } else k.soft(p, W + 0.4, 0.15, 0.03, 0.012, m.greyPlastic, 0, 0.8, 0.015)
  const z0 = o.premium ? 0.03 : 0
  // The trunking, its lit lens and uplight.
  k.soft(p, W, 0.24, 0.085, 0.02, o.premium ? c.absDark : m.whitePlastic, 0, 1.45, z0 + 0.0425)
  k.box(p, W - 0.08, 0.008, 0.04, m.ledLine, 0, 1.573, z0 + 0.04, false)
  k.box(p, 0.42, 0.006, 0.03, m.ledLine, -W * 0.18, 1.33, z0 + 0.06, false)
  const fz = z0 + 0.086
  const gases: ('o2' | 'air' | 'vac')[] = o.gases === 'full' ? ['o2', 'air', 'vac'] : ['o2', 'vac']
  gases.forEach((g, i) => outlet(e, p, g, -W / 2 + 0.12 + i * 0.11, 1.46, fz))
  // Sockets: two raw (white), two UPS (red); data; the nurse-call socket and button.
  for (let i = 0; i < 4; i++) {
    const x = 0.1 + i * 0.11
    k.soft(p, 0.085, 0.085, 0.012, 0.006, i >= 2 ? m.red : m.whitePlastic, x, 1.46, fz + 0.004)
    for (const dx of [-0.016, 0.016]) k.box(p, 0.007, 0.014, 0.004, m.black, x + dx, 1.47, fz + 0.011, false)
    k.box(p, 0.018, 0.012, 0.004, m.greyPlastic, x, 1.494, fz + 0.011, false)
  }
  k.soft(p, 0.085, 0.085, 0.012, 0.006, m.greyPlastic, 0.56, 1.46, fz + 0.004)
  k.box(p, 0.03, 0.022, 0.004, m.black, 0.56, 1.46, fz + 0.011, false)
  callButton(e, p, link, W / 2 - 0.14, 1.46, fz, 'Nurse Call')
  // The parked handset's hook and the handset itself, its cord looping down.
  k.box(p, 0.03, 0.02, 0.04, m.greyPlastic, W / 2 - 0.3, 1.3, fz + 0.01)
  k.soft(p, 0.05, 0.16, 0.03, 0.014, c.abs, W / 2 - 0.3, 1.2, fz + 0.03)
  k.box(p, 0.024, 0.024, 0.004, c.red, W / 2 - 0.3, 1.24, fz + 0.047, false)
  put(p, tube(e, `bhCord${W}`, [[W / 2 - 0.3, 1.12, fz + 0.03], [W / 2 - 0.25, 0.95, fz + 0.06], [W / 2 - 0.35, 0.9, fz + 0.04], [W / 2 - 0.2, 1.38, fz]], 0.0035), c.cord)
  return p
}

/* ---------- wardrobe ---------- */

/**
 * A patient's wardrobe, `w` × `h` × `d`: a laminate carcass on a plinth, a hanging side behind one
 * door (rail, hangers, the patient's clothes and a gown), shelves and a lockable drawer behind
 * the other; the doors and drawer open (operated). Suites take walnut.
 */
export function wardrobe(e: OpdCtx, p: Object3D, w = 1.0, h = 2.1, d = 0.58, finish: 'oak' | 'walnut' = 'oak') {
  const { k, m } = e
  const c = kitMats(e)
  const face = finish === 'walnut' ? c.walnut : c.oakFront
  const g = group(p, 0, 0, d / 2)
  carcass(e, g, w, h, d, face, [], 0.08)
  const half = w / 2
  // The hanging side: rail, hangers with clothes; the shelf over it.
  k.box(g, half - 0.04, 0.018, d - 0.04, m.melamine, -half / 2, h - 0.3, -d / 2)
  rod(e, g, 0.012, half - 0.06, c.chrome, -half / 2, h - 0.38, -d / 2, 'x', 12)
  const cloth = [c.gown, m.blanket, c.towel, m.blue]
  for (let i = 0; i < 4; i++) {
    const x = -half + 0.09 + i * ((half - 0.16) / 3)
    put(g, bentTube(e, 'hanger', [[-0.2, -0.08, 0], [0, 0, 0], [0.2, -0.08, 0], [-0.2, -0.08, 0]], 0.003, 0.02), c.chrome, x, h - 0.43, -d / 2).rotation.y = PI / 2
    k.soft(g, 0.06, 0.75 - (i % 2) * 0.2, 0.42, 0.02, cloth[i], x, h - 0.85 + (i % 2) * 0.1, -d / 2)
  }
  // The divider, the shelf side.
  k.box(g, 0.018, h - 0.1, d - 0.02, m.melamine, 0, h / 2 + 0.04, -d / 2)
  for (const y of [h - 0.45, h - 0.85]) k.box(g, half - 0.04, 0.018, d - 0.04, m.melamine, half / 2, y, -d / 2)
  k.soft(g, half - 0.14, 0.12, 0.34, 0.03, c.towel, half / 2, h - 0.38, -d / 2 + 0.04)
  k.soft(g, half - 0.2, 0.08, 0.3, 0.02, m.blanket, half / 2, h - 0.79, -d / 2 + 0.03)
  drawer(e, g, half / 2, 0.36, 0, { w: half - 0.01, h: 0.2, d: d - 0.06, front: face, handle: 'bar', label: 'Wardrobe Drawer' })
  cupboardDoor(e, g, -half + 0.002, 0.09 + (h - 0.12) / 2, 0, { w: half - 0.004, h: h - 0.12, hinge: 'left', face, label: 'Wardrobe' })
  cupboardDoor(e, g, half - 0.002, 0.5 + (h - 0.53) / 2, 0, { w: half - 0.004, h: h - 0.53, hinge: 'right', face, label: 'Wardrobe' })
  // A small safe for valuables at the foot of the hanging side.
  k.soft(g, 0.36, 0.22, 0.3, 0.01, m.charcoal, -half / 2, 0.21, -d / 2 + 0.02)
  k.box(g, 0.1, 0.05, 0.004, m.black, -half / 2 + 0.08, 0.24, -d / 2 + 0.172, false)
  return g
}

/* ---------- TV, air-conditioner, fan ---------- */

/** A screen's picture, painted once: a channel's news or a nature film, as hospitals show. */
function tvPicture(e: OpdCtx, key: string) {
  return e.o.screen(`tv_${key}`, 640, 360, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, '#6aa6d8')
    sky.addColorStop(0.55, '#cfe4f2')
    sky.addColorStop(0.56, '#4f7a3a')
    sky.addColorStop(1, '#2d4a22')
    g.fillStyle = sky
    g.fillRect(0, 0, w, h)
    // Hills, a lake, trees: a calm landscape film.
    g.fillStyle = '#5d7f9a'
    g.beginPath()
    g.moveTo(0, h * 0.56)
    g.quadraticCurveTo(w * 0.25, h * 0.36, w * 0.5, h * 0.52)
    g.quadraticCurveTo(w * 0.75, h * 0.4, w, h * 0.55)
    g.lineTo(w, h * 0.6)
    g.lineTo(0, h * 0.6)
    g.fill()
    g.fillStyle = '#7fb0cf'
    g.fillRect(0, h * 0.62, w, h * 0.12)
    for (let i = 0; i < 26; i++) {
      g.fillStyle = i % 2 ? '#24401c' : '#2f5224'
      const x = (i * 97) % w
      g.beginPath()
      g.moveTo(x, h * 0.62)
      g.lineTo(x + 10, h * 0.45 + ((i * 13) % 20))
      g.lineTo(x + 20, h * 0.62)
      g.fill()
    }
    g.fillStyle = 'rgba(0,0,0,.45)'
    g.fillRect(0, h * 0.86, w, h * 0.14)
    g.fillStyle = '#ffffff'
    g.font = `600 ${h * 0.06}px Helvetica`
    g.fillText('Terranova Care Channel · Relaxation', w * 0.03, h * 0.94)
  }, 0.9)
}

/**
 * A wall-mounted LED TV, `inch` diagonal, on a tilting wall bracket, its centre `y` above the
 * floor: slim bezel, the stand-off arm, the power button (operated: it switches on and off).
 */
export function wallTV(e: OpdCtx, p: Object3D, inch = 43, y = 1.75) {
  const { k, m } = e
  const c = kitMats(e)
  const W = inch * 0.0254 * 0.87
  const H = inch * 0.0254 * 0.49
  const g = group(p, 0, y, 0)
  k.box(g, 0.3, 0.2, 0.02, c.tvBlack, 0, 0, 0.01)
  k.box(g, 0.04, 0.04, 0.06, c.tvBlack, 0, 0, 0.05)
  const t = group(g, 0, 0, 0.09)
  t.rotation.x = 0.08
  k.soft(t, W, H, 0.03, 0.006, c.tvBlack, 0, 0, 0)
  const on = tvPicture(e, 'relax')
  const scr = new Mesh(new PlaneGeometry(W - 0.02, H - 0.02), on)
  scr.position.z = 0.0152
  // The screen is kept whole (live_) so the power button can switch it.
  const holder = new Group()
  holder.name = `live_tv_${e.ids++}`
  holder.add(scr)
  t.add(holder)
  k.box(t, 0.06, 0.006, 0.006, m.greyPlastic, 0, -H / 2 - 0.003, 0.012, false)
  const btn = new Group()
  btn.name = `button_tv_${e.ids++}`
  btn.position.set(W / 2 - 0.06, -H / 2 - 0.004, 0.0)
  t.add(btn)
  k.box(btn, 0.018, 0.008, 0.012, c.absDark, 0, 0, 0)
  btn.userData.label = 'Television'
  btn.userData.verb = 'Switch'
  let lit = true
  btn.userData.press = () => {
    lit = !lit
    scr.material = lit ? on : c.tvOff
    click(btn.getWorldPosition(new Vector3()))
  }
  return g
}

/**
 * A split air-conditioner's indoor unit, `w` wide (0.95 m for a 1.5-ton unit), its top at `y`:
 * the curved white body, the intake grille over it, the swing louvre, the display; the refrigerant
 * piping's trunking down the wall to one side. Its remote on a wall holder at 1.3 m beside it is
 * a button_ that switches it: the display lights and the louvre swings open.
 */
export function splitAC(e: OpdCtx, p: Object3D, w = 0.95, y = 2.72, remoteX = 0.7) {
  const { k } = e
  const c = kitMats(e)
  const g = group(p, 0, y - 0.15, 0)
  k.soft(g, w, 0.3, 0.22, 0.05, c.acWhite, 0, 0, 0.11)
  for (let i = 0; i < 14; i++) k.box(g, w - 0.1, 0.004, 0.012, c.acVent, 0, 0.152, 0.03 + i * 0.012, false)
  k.box(g, w - 0.08, 0.04, 0.008, c.acVent, 0, -0.12, 0.2, false)
  // The louvre, kept whole so it can swing.
  const louvre = new Group()
  louvre.name = `live_aclouvre_${e.ids++}`
  louvre.position.set(0, -0.13, 0.2)
  g.add(louvre)
  k.box(louvre, w - 0.12, 0.006, 0.07, c.acWhite, 0, 0, 0.035)
  const led = new Group()
  led.name = `live_acled_${e.ids++}`
  led.position.set(w / 2 - 0.12, -0.06, 0.222)
  g.add(led)
  const dot = k.box(led, 0.05, 0.014, 0.002, c.acLed, 0, 0, 0, false)
  // Piping trunking from the unit's side down the wall to the floor slab's sleeve.
  k.box(p, 0.08, y - 0.4, 0.06, c.acWhite, -w / 2 + 0.1, (y - 0.4) / 2 + 0.25, 0.03)
  // The remote on its holder.
  const rem = new Group()
  rem.name = `button_ac_${e.ids++}`
  rem.position.set(remoteX, 1.3, 0)
  p.add(rem)
  k.box(rem, 0.07, 0.1, 0.03, c.acWhite, 0, 0, 0.015)
  k.soft(rem, 0.05, 0.16, 0.02, 0.01, c.acWhite, 0, 0.02, 0.035)
  k.box(rem, 0.03, 0.018, 0.002, c.absDark, 0, 0.07, 0.046, false)
  let running = true
  louvre.rotation.x = 0.5
  rem.userData.label = 'Air-conditioner'
  rem.userData.verb = 'Switch'
  rem.userData.press = () => {
    running = !running
    dot.material = running ? c.acLed : c.acLedOff
    louvre.rotation.x = running ? 0.5 : 0
    click(rem.getWorldPosition(new Vector3()))
  }
  return g
}

/**
 * The ceiling fan of a non-AC room, over (x, z): a 1200 mm three-blade fan on its downrod in white
 * enamel (spin_: it starts and stops when tapped), and its step regulator by the door (see Room).
 */
export function fan(e: OpdCtx, room: Room, x: number, z: number) {
  const c = kitMats(e)
  return ceilingFan(e.k, room.group, x, room.y + room.ceiling, z, { body: c.fanBody, blade: c.fanBlade, iron: c.fanIron })
}

/**
 * A fan's step regulator: a white modular plate with its five-step knob, at (x, y, z) facing +z.
 */
export function fanRegulator(e: OpdCtx, p: Object3D, x: number, y: number, z: number) {
  const { k } = e
  const c = kitMats(e)
  k.soft(p, 0.09, 0.09, 0.012, 0.006, c.abs, x, y, z + 0.006)
  const knob = k.cyl(p, 0.022, 0.024, 0.02, c.absGrey, x, y, z + 0.02, 24)
  knob.rotation.x = PI / 2
  k.box(p, 0.004, 0.018, 0.004, c.absDark, x, y + 0.006, z + 0.031, false)
}

/* ---------- small pieces ---------- */

/** A wall clock with a live face (hours drawn as now), `d` across, at height y facing +z. */
export function wallClock(e: OpdCtx, p: Object3D, y = 2.3, d = 0.3) {
  const { k, m } = e
  const g = group(p, 0, y, 0)
  k.cyl(g, d / 2, d / 2, 0.04, m.whitePlastic, 0, 0, 0.02, 40).rotation.x = PI / 2
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const x = canvas.getContext('2d')!
  x.fillStyle = '#fbfbf8'
  x.fillRect(0, 0, 256, 256)
  x.strokeStyle = '#222'
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2
    const r0 = i % 5 ? 112 : 100
    x.lineWidth = i % 5 ? 2 : 6
    x.beginPath()
    x.moveTo(128 + Math.sin(a) * r0, 128 - Math.cos(a) * r0)
    x.lineTo(128 + Math.sin(a) * 120, 128 - Math.cos(a) * 120)
    x.stroke()
  }
  const now = new Date()
  const hand = (a: number, len: number, w: number) => {
    x.lineWidth = w
    x.beginPath()
    x.moveTo(128, 128)
    x.lineTo(128 + Math.sin(a) * len, 128 - Math.cos(a) * len)
    x.stroke()
  }
  hand(((now.getHours() % 12) + now.getMinutes() / 60) * (Math.PI / 6), 60, 8)
  hand(now.getMinutes() * (Math.PI / 30), 90, 5)
  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  face(e, g, d * 0.88, d * 0.88, new MeshStandardMaterial({ map: tex, roughness: 0.4 }), 0, 0, 0.041)
  return g
}

/** A run of open steel shelving for linen or supplies, its contents in folded stacks. */
export function linenShelves(e: OpdCtx, p: Object3D, w: number, h = 1.9, d = 0.45, levels = 5) {
  const { k, m } = e
  const c = kitMats(e)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(p, 0.03, h, 0.03, m.powder, sx * (w / 2 - 0.015), h / 2, sz * (d / 2 - 0.015) + d / 2)
  for (let i = 0; i < levels; i++) {
    const y = 0.12 + (i * (h - 0.2)) / (levels - 1)
    k.box(p, w, 0.02, d, m.stainless, 0, y, d / 2)
    if (i === levels - 1) continue
    const n = Math.max(1, Math.floor(w / 0.38))
    for (let j = 0; j < n; j++) {
      const x = -w / 2 + (j + 0.5) * (w / n)
      const mat = [m.sheet, m.blanket, c.towel, c.gown][(i + j) % 4]
      const stack = 0.08 + ((i * 7 + j * 3) % 5) * 0.03
      k.soft(p, w / n - 0.06, stack, d - 0.08, 0.02, mat, x, y + 0.01 + stack / 2, d / 2)
    }
  }
}

/** A cabinet of drawers on castors (a nurses' trolley or a station's pedestal): its drawers open. */
export function drawerCart(e: OpdCtx, p: Object3D, w = 0.6, h = 0.95, d = 0.5, n = 5, front?: Material) {
  const { k, m } = e
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * (w / 2 - 0.06), sz * (d / 2 - 0.06), 0.04)
  const g = group(p, 0, 0.1, d / 2)
  carcass(e, g, w, h - 0.12, d, m.hpl, [], 0)
  k.soft(g, w + 0.02, 0.03, d + 0.02, 0.01, m.whitePlastic, 0, h - 0.1, -d / 2)
  const dh = (h - 0.16) / n
  for (let i = 0; i < n; i++) drawer(e, g, 0, h - 0.14 - dh / 2 - i * dh, 0, { w: w - 0.01, h: dh - 0.008, d: d - 0.04, front: front ?? [m.blue, m.whitePlastic, m.blue, m.whitePlastic, m.blue][i % 5], handle: 'grip', label: 'Drawer' })
  put(p, bentTube(e, `cartHandle${w}`, [[-w / 2 + 0.05, h - 0.05, -0.02], [-w / 2 + 0.05, h + 0.02, -0.06], [w / 2 - 0.05, h + 0.02, -0.06], [w / 2 - 0.05, h - 0.05, -0.02]], 0.011, 0.03), m.stainless)
  return g
}

/** Hand-rub on its bracket by a bed or a door: a 500 mL pump bottle in a wall holder, at height y. */
export function rubBottle(e: OpdCtx, p: Object3D, y = 1.25) {
  const { k, m } = e
  k.box(p, 0.09, 0.12, 0.05, m.stainless, 0, y - 0.04, 0.025)
  put(p, lathe(e, 'rubBottle', [[0, 0], [0.035, 0], [0.036, 0.15], [0.02, 0.17], [0.012, 0.19], [0, 0.19]], 18), m.clearPlastic, 0, y - 0.08, 0.04)
  k.cyl(p, 0.014, 0.014, 0.03, m.whitePlastic, 0, y + 0.12, 0.04, 12)
  k.box(p, 0.05, 0.008, 0.012, m.whitePlastic, 0.02, y + 0.135, 0.04)
}

export { furnMats }
