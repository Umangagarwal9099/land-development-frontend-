import { Group, MeshStandardMaterial, type Material, type Object3D } from 'three'
import { PI } from '../../../kit'
import { paintedMat } from '../../../shared'
import { rng, type Paint } from '../../../textures'
import { carcass, cupboardDoor, face, group, lathe, panel, put, rod } from '../../erKit'
import { cushion, furnMats, pedestal } from '../../erFurniture'
import type { OpdCtx, Room } from '../../opd/ctx'
import { belt, stanchion } from '../../opd/equipment/ground'
import { medicineBoxes } from '../../opd/furniture'
import { board, NAVY, SANS } from '../../opd/paints'

/*
 * The main block's ground floor equipment: what its front-of-house is built from and the shared
 * libraries don't have. The main reception counter (an oak-fluted front under a solid-surface
 * transaction ledge, a lowered wheelchair section, drawer pedestals that open), the hospital's name
 * in lit channel letters on an oak-slatted feature wall, double-sided displays hung from the
 * ceiling, counter-top signs, lounge chairs, a mobile charging station, the cash room's floor safe
 * and ceiling dome camera, the pharmacy's double-locked narcotics cabinet, a wheelchair parking
 * marking, the floor directory and an acoustic privacy screen. Each is built in its own frame,
 * front towards +z, standing on y = 0 (wall pieces with their back at z = 0), at true size.
 */

const std = (color: string, roughness = 0.5, metalness = 0) => new MeshStandardMaterial({ color, roughness, metalness })

const cache = new WeakMap<object, ReturnType<typeof make>>()
function make(e: OpdCtx) {
  const glow = (mat: MeshStandardMaterial, day = 0.85) => e.lighting.glow(mat, day)
  return {
    /** The feature wall's backing behind its slats, a near-black stained MDF. */
    slatBack: std('#24211e', 0.8),
    /** Kick plinths in black, satin. */
    plinth: std('#1b1c1e', 0.55),
    /** Safe and cabinet enamel: a dark textured grey. */
    safe: std('#3c4247', 0.55, 0.35),
    safeDoor: std('#454b51', 0.45, 0.4),
    brass: std('#b8954a', 0.32, 0.85),
    /** The camera's smoked dome. */
    smoked: new MeshStandardMaterial({ color: '#1d2126', roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.78 }),
    /** Lounge upholstery: a warm teal and a sand fabric; turned oak legs. */
    teal: std('#2f5d62', 0.92),
    sand: std('#b9a588', 0.95),
    acoustic: std('#5d6a73', 0.97),
    /** Bank notes in their bundles, a cash bag. */
    notes: std('#a7b48e', 0.85),
    notesPink: std('#c99aa3', 0.85),
    bag: std('#6d5a3d', 0.9),
    /** A lit charging header, the lockers' indicator LEDs. */
    ledGreen: glow(new MeshStandardMaterial({ color: '#39d06b', emissive: '#39d06b', emissiveIntensity: 1.4, roughness: 0.4 }), 0.9),
  }
}
function gm(e: OpdCtx) {
  let c = cache.get(e.o)
  if (!c) cache.set(e.o, (c = make(e)))
  return c
}

/* ---------- the main reception counter ---------- */

export interface DeskOpts {
  /** A length of the counter (local x0 … x1) lowered to 0.78 m with knee room under it, for wheelchair users. */
  low?: [number, number]
  /** Drawer pedestals under the work top, at these x (operated). */
  pedestals?: number[]
  /** Its front: vertical oak flutes (default) or plain white solid surface. */
  front?: 'oak' | 'white'
}

/**
 * A reception counter `len` long along local x, the public side towards +z and the staff at −z:
 * a fluted front in oak battens over a dark ground on a recessed black plinth, the transaction
 * ledge at 1.08 m in white solid surface with a lit reveal under its nosing, the staff's work top
 * at 0.75 m behind it (0.63 m deep), solid-surface end panels, cable grommets, and drawer
 * pedestals under it whose drawers open. Its depth runs from z = −0.42 (the staff's edge) to
 * z = 0.54 (the ledge's nosing). With `low`, that length drops to a 0.78 m top that reaches 0.2 m
 * past the front over a recessed knee space.
 */
export function receptionDesk(e: OpdCtx, p: Object3D, len: number, opts: DeskOpts = {}) {
  const { k, m, o } = e
  const c = gm(e)
  const F = 0.48
  const back = -0.42
  const end = 0.05
  const x0 = -len / 2 + end
  const x1 = len / 2 - end
  const runs: [number, number][] = opts.low ? [[x0, opts.low[0]], [opts.low[1], x1]].filter(([a, b]) => b - a > 0.05) as [number, number][] : [[x0, x1]]
  for (const [a, b] of runs) {
    const w = b - a
    const cx = (a + b) / 2
    // The recessed plinth and the front's dark ground, then the battens over it.
    k.box(p, w, 0.1, 0.05, c.plinth, cx, 0.05, F - 0.06)
    k.box(p, w, 0.94, 0.018, opts.front === 'white' ? m.solidSurface : c.slatBack, cx, 0.57, F - 0.009)
    if (opts.front !== 'white') {
      const n = Math.floor(w / 0.06)
      const pitch = w / n
      for (let i = 0; i < n; i++) k.box(p, 0.034, 0.92, 0.022, o.oak, a + pitch * (i + 0.5), 0.57, F + 0.011)
    }
    // The ledge: a 40 mm solid-surface top on a staff-side upstand, its nosing 60 mm proud, the lit reveal under it.
    k.soft(p, w, 0.04, 0.34, 0.012, m.solidSurface, cx, 1.06, F - 0.11)
    k.box(p, w - 0.02, 0.006, 0.012, m.ledLine, cx, 1.036, F + 0.035, false)
    k.box(p, w, 0.29, 0.018, m.hpl, cx, 0.895, F - 0.27)
    // The staff's work top behind it, its grommet and the cable tray under it.
    k.soft(p, w, 0.03, F - 0.27 - back, 0.008, m.solidSurface, cx, 0.735, (back + F - 0.27) / 2)
    k.box(p, w - 0.1, 0.06, 0.12, m.galvanised, cx, 0.66, F - 0.36, false)
  }
  if (opts.low) {
    const [a, b] = opts.low
    const w = b - a
    const cx = (a + b) / 2
    // The lowered top, its knee space recessed under it, solid-surface pilasters at its ends.
    k.soft(p, w, 0.035, F + 0.2 - back, 0.012, m.solidSurface, cx, 0.7625, (back + F + 0.2) / 2)
    k.box(p, w, 0.64, 0.018, m.hpl, cx, 0.42, F - 0.32)
    k.box(p, w, 0.1, 0.05, c.plinth, cx, 0.05, F - 0.36)
    for (const x of [a, b]) k.soft(p, 0.04, 1.08, 0.36, 0.01, m.solidSurface, x, 0.54, F - 0.12)
    // The access symbol on the knee recess.
    face(e, p, 0.16, 0.16, e.o.sign('m_isa', 160, 160, isa('#1f5fb8')), cx, 0.48, F - 0.31)
  }
  // Solid-surface end panels to the floor, their front edges rounded.
  for (const s of [-1, 1]) k.soft(p, end, 1.08, F + 0.06 - back, 0.018, m.solidSurface, s * (len / 2 - end / 2), 0.54, (back + F + 0.06) / 2)
  // Pedestals of drawers under the work top, opening towards the staff.
  for (const x of opts.pedestals ?? []) pedestal(e, group(p, x, 0, back + 0.02, PI), 'Reception Drawer')
}

/** A counter-top sign: an acrylic block on a brushed foot, its face printed, at (x, y, z) facing +z. */
export function deskSign(e: OpdCtx, p: Object3D, key: string, text: string, sub: string | null, x: number, y: number, z: number, ry = 0, w = 0.34) {
  const { k, m } = e
  const g = group(p, x, y, z, ry)
  const h = w * 0.3
  k.box(g, w + 0.02, 0.012, 0.06, m.stainless, 0, 0.006, 0)
  k.box(g, w, h, 0.016, m.clearPlastic, 0, 0.012 + h / 2, 0, false)
  const lines: [string, number, string, number?][] = [[text, sub ? 0.34 : 0.44, '#ffffff']]
  if (sub) lines.push([sub, 0.2, '#c7d3e6', 500])
  face(e, g, w - 0.01, h - 0.01, e.o.sign(`m_desk_${key}`, 384, Math.round(384 * 0.3), board(NAVY, lines)), 0, 0.012 + h / 2, 0.0085)
  return g
}

/* ---------- the feature wall and its lettering ---------- */

/** The hospital's mark: a square cross in the hospital's blue, white bars in it. */
function mark(g: CanvasRenderingContext2D, x: number, y: number, s: number, fill: string, bar: string) {
  const r = s * 0.16
  g.fillStyle = fill
  g.beginPath()
  g.moveTo(x + r, y)
  g.arcTo(x + s, y, x + s, y + s, r)
  g.arcTo(x + s, y + s, x, y + s, r)
  g.arcTo(x, y + s, x, y, r)
  g.arcTo(x, y, x + s, y, r)
  g.fill()
  if (bar) {
    g.fillStyle = bar
    g.fillRect(x + s * 0.39, y + s * 0.16, s * 0.22, s * 0.68)
    g.fillRect(x + s * 0.16, y + s * 0.39, s * 0.68, s * 0.22)
  }
}

/** The name in channel letters on a transparent ground: faces (white and blue), returns (grey) or the halo (a soft glow). */
const logoPaint = (mode: 'face' | 'return' | 'halo'): Paint => (g, w, h) => {
  g.clearRect(0, 0, w, h)
  const col = mode === 'face' ? '#fbfbfa' : mode === 'return' ? '#8d9399' : '#fff1d8'
  if (mode === 'halo') {
    g.shadowColor = '#fff1d8'
    g.shadowBlur = h * 0.06
  }
  const s = h * 0.74
  mark(g, h * 0.06, (h - s) / 2, s, mode === 'face' ? '#1f6fd1' : col, mode === 'face' ? '#ffffff' : '')
  const x = h * 0.06 + s + h * 0.16
  g.fillStyle = col
  g.textBaseline = 'alphabetic'
  g.font = SANS(h * 0.5, 700)
  const name = 'TERRANOVA'
  const room = w - x - h * 0.04
  const nat = g.measureText(name).width
  const gap = (room - nat) / (name.length - 1)
  let cx = x
  for (const ch of name) {
    g.fillText(ch, cx, h * 0.6)
    cx += g.measureText(ch).width + gap
  }
  g.font = SANS(h * 0.17, 500)
  const sub = 'HOSPITAL  ·  MULTISPECIALITY CARE'
  const nat2 = g.measureText(sub).width
  const gap2 = (room - nat2) / (sub.length - 1)
  cx = x
  for (const ch of sub) {
    g.fillText(ch, cx, h * 0.9)
    cx += g.measureText(ch).width + gap2
  }
}

/**
 * The feature wall behind the main reception, `w` wide and `h` high against a wall (back at
 * z = 0): vertical oak battens on a dark ground between a black plinth and a lit cove at the
 * top, and the hospital's name across it in channel letters (white acrylic faces lit from inside,
 * 25 mm returns, a warm halo on the battens behind), its centre `ly` above the floor.
 */
export function brandWall(e: OpdCtx, p: Object3D, w: number, h: number, ly: number, lw = 3.1) {
  const { k, m, o } = e
  const c = gm(e)
  k.box(p, w, h, 0.018, c.slatBack, 0, h / 2, 0.009)
  const n = Math.floor(w / 0.075)
  const pitch = w / n
  for (let i = 0; i < n; i++) k.box(p, 0.045, h - 0.12, 0.028, o.oak, -w / 2 + pitch * (i + 0.5), 0.12 + (h - 0.12) / 2, 0.032)
  k.box(p, w, 0.12, 0.05, c.plinth, 0, 0.06, 0.025)
  // The top's shadow-gap trim and the cove light washing down the battens.
  k.box(p, w + 0.02, 0.05, 0.08, m.aluminium, 0, h - 0.025, 0.04)
  k.box(p, w - 0.04, 0.008, 0.012, m.ledLine, 0, h - 0.055, 0.07, false)
  // The lettering: the halo on the battens, three layers of returns, the lit faces.
  const lh = lw * 0.25
  const halo = paintedMat({ k }, 'm_logo_halo', 2048, 512, logoPaint('halo'), { transparent: true, depthWrite: false, roughness: 1 })
  if (!halo.emissiveMap) {
    halo.emissiveMap = halo.map
    halo.emissive.set('#ffffff')
    halo.emissiveIntensity = 0.9
    e.lighting.glow(halo, 0.5)
  }
  const ret = paintedMat({ k }, 'm_logo_return', 2048, 512, logoPaint('return'), { alphaTest: 0.5, roughness: 0.4, metalness: 0.5 })
  const faceMat = paintedMat({ k }, 'm_logo_face', 2048, 512, logoPaint('face'), { alphaTest: 0.5, roughness: 0.3 })
  if (!faceMat.emissiveMap) {
    faceMat.emissiveMap = faceMat.map
    faceMat.emissive.set('#ffffff')
    faceMat.emissiveIntensity = 0.75
    e.lighting.glow(faceMat, 0.55)
  }
  face(e, p, lw * 1.04, lh * 1.16, halo, 0, ly, 0.0475)
  for (let i = 0; i < 3; i++) face(e, p, lw, lh, ret, 0, ly, 0.06 + i * 0.008)
  face(e, p, lw, lh, faceMat, 0, ly, 0.085)
}

/* ---------- displays and signs ---------- */

/**
 * A double-sided display hung from the ceiling (room.ceiling above the floor) on two drop rods,
 * w wide (16:9), its centre `y` above the floor: a slim black enclosure, a screen each side.
 */
export function hungDisplay(e: OpdCtx, room: Room, x: number, z: number, ry: number, w: number, front: Material, back: Material, y = 2.45) {
  const { k, m } = e
  const g = room.at(x, z, ry)
  const h = w * 0.5625
  for (const s of [-1, 1]) {
    k.cyl(g, 0.012, 0.012, room.ceiling - y - h / 2, m.stainless, s * w * 0.3, (room.ceiling + y + h / 2) / 2, 0, 10)
    k.cyl(g, 0.04, 0.04, 0.012, m.stainless, s * w * 0.3, room.ceiling - 0.006, 0, 16)
  }
  put(g, panel(e, w + 0.03, h + 0.03, 0.07, 0.01), m.black, 0, y, 0)
  face(e, g, w - 0.01, h - 0.01, front, 0, y, 0.0352)
  face(e, g, w - 0.01, h - 0.01, back, 0, y, -0.0352, PI)
  return g
}

/** A sign hung from the ceiling on two rods, its two faces `mat` (painted w × h), its centre `y` above the floor. */
export function hungSign(e: OpdCtx, room: Room, x: number, z: number, ry: number, w: number, h: number, mat: Material, y = 2.7) {
  const { k, m } = e
  const g = room.at(x, z, ry)
  for (const s of [-1, 1]) k.cyl(g, 0.006, 0.006, room.ceiling - y - h / 2, m.stainless, s * w * 0.38, (room.ceiling + y + h / 2) / 2, 0, 8)
  put(g, panel(e, w, h, 0.03, 0.008), e.o.navy, 0, y, 0)
  face(e, g, w - 0.02, h - 0.02, mat, 0, y, 0.0155)
  face(e, g, w - 0.02, h - 0.02, mat, 0, y, -0.0155, PI)
  return g
}

/** A welcome / information screen's content: the hospital's mark, a greeting, visiting hours and the day's doctors. */
export const welcomePaint = (title: string, lines: [string, string][]): Paint => (g, w, h) => {
  const bg = g.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, '#12335e')
  bg.addColorStop(1, '#081a33')
  g.fillStyle = bg
  g.fillRect(0, 0, w, h)
  mark(g, w * 0.05, h * 0.07, h * 0.14, '#1f6fd1', '#ffffff')
  g.fillStyle = '#ffffff'
  g.font = SANS(h * 0.075, 700)
  g.textBaseline = 'middle'
  g.fillText(title, w * 0.05 + h * 0.19, h * 0.14)
  g.fillStyle = 'rgba(255,255,255,.25)'
  g.fillRect(w * 0.05, h * 0.27, w * 0.9, 2)
  lines.forEach(([a, b], i) => {
    const y = h * (0.36 + i * 0.12)
    g.fillStyle = '#ffd45a'
    g.font = SANS(h * 0.05, 700)
    g.fillText(a, w * 0.05, y)
    g.fillStyle = '#e8eef7'
    g.font = SANS(h * 0.05, 500)
    g.fillText(b, w * 0.42, y)
  })
  g.fillStyle = '#1f6fd1'
  g.fillRect(0, h * 0.93, w, h * 0.07)
  g.fillStyle = '#ffffff'
  g.font = SANS(h * 0.035, 500)
  g.fillText('Emergency 24 × 7  ·  Ambulance 108  ·  Helpdesk ext. 100', w * 0.05, h * 0.965)
}

/** The international symbol of access, white on `bg`. */
export const isa = (bg: string): Paint => (g, w, h) => {
  g.fillStyle = bg
  g.fillRect(0, 0, w, h)
  g.strokeStyle = '#ffffff'
  g.fillStyle = '#ffffff'
  const s = Math.min(w, h)
  const cx = w / 2
  const cy = h / 2
  g.beginPath()
  g.arc(cx - s * 0.06, cy - s * 0.3, s * 0.07, 0, PI * 2)
  g.fill()
  g.lineWidth = s * 0.07
  g.lineCap = 'round'
  g.lineJoin = 'round'
  g.beginPath()
  g.moveTo(cx - s * 0.08, cy - s * 0.18)
  g.lineTo(cx - s * 0.04, cy + s * 0.06)
  g.lineTo(cx + s * 0.16, cy + s * 0.06)
  g.lineTo(cx + s * 0.24, cy + s * 0.28)
  g.stroke()
  g.beginPath()
  g.moveTo(cx - s * 0.06, cy - s * 0.06)
  g.lineTo(cx + s * 0.1, cy - s * 0.06)
  g.stroke()
  g.lineWidth = s * 0.05
  g.beginPath()
  g.arc(cx - s * 0.06, cy + s * 0.12, s * 0.2, PI * 1.25, PI * 2.6)
  g.stroke()
}

/**
 * The floor directory on a wall (back at z = 0), w × h with its centre `y` up: a navy board in a
 * brushed frame, the hospital's mark, every floor's departments, "you are here" on the ground.
 */
export function directoryBoard(e: OpdCtx, p: Object3D, w: number, h: number, y: number, rows: [string, string][]) {
  const { k, m } = e
  put(p, panel(e, w + 0.04, h + 0.04, 0.03, 0.006), m.aluminium, 0, y, 0.015)
  const art = e.o.sign('m_directory', 768, Math.round((768 * h) / w), (g, cw, ch) => {
    g.fillStyle = NAVY
    g.fillRect(0, 0, cw, ch)
    mark(g, cw * 0.06, ch * 0.04, ch * 0.08, '#1f6fd1', '#ffffff')
    g.fillStyle = '#ffffff'
    g.textBaseline = 'middle'
    g.font = SANS(ch * 0.042, 700)
    g.fillText('FLOOR DIRECTORY', cw * 0.06 + ch * 0.11, ch * 0.065)
    g.fillStyle = '#c7d3e6'
    g.font = SANS(ch * 0.026, 500)
    g.fillText('Terranova Hospital · Main Block', cw * 0.06 + ch * 0.11, ch * 0.105)
    const top = ch * 0.17
    const rh = (ch * 0.78) / rows.length
    rows.forEach(([lvl, text], i) => {
      const yy = top + i * rh
      const here = lvl === 'G'
      g.fillStyle = here ? '#ffd45a' : '#24467a'
      g.fillRect(cw * 0.05, yy + rh * 0.12, rh * 0.76, rh * 0.76)
      g.fillStyle = here ? NAVY : '#ffffff'
      g.font = SANS(rh * (lvl.length > 2 ? 0.26 : 0.42), 700)
      g.textAlign = 'center'
      g.fillText(lvl, cw * 0.05 + rh * 0.38, yy + rh * 0.5)
      g.textAlign = 'left'
      const parts = text.split(' | ')
      g.fillStyle = '#ffffff'
      g.font = SANS(rh * 0.2, 700)
      g.fillText(parts[0], cw * 0.06 + rh * 0.9, yy + rh * (parts[1] ? 0.36 : 0.5))
      if (parts[1]) {
        g.fillStyle = '#c7d3e6'
        g.font = SANS(rh * 0.15, 500)
        g.fillText(parts[1], cw * 0.06 + rh * 0.9, yy + rh * 0.66)
      }
      if (here) {
        g.fillStyle = '#ffd45a'
        g.font = SANS(rh * 0.13, 700)
        g.textAlign = 'right'
        g.fillText('YOU ARE HERE', cw * 0.95, yy + rh * 0.36)
        g.textAlign = 'left'
      }
      g.fillStyle = 'rgba(255,255,255,.15)'
      g.fillRect(cw * 0.05, yy + rh - 1, cw * 0.9, 2)
    })
  })
  face(e, p, w, h, art, 0, y, 0.031)
  k.box(p, w, 0.004, 0.002, m.ledLine, 0, y + h / 2 + 0.03, 0.03, false)
}

/* ---------- seating ---------- */

/**
 * A lounge armchair: a tub of upholstered back and arms in one sweep, a loose welted seat
 * cushion, on four turned oak legs splayed a little; 0.76 wide, its seat at 0.45 m.
 */
export function loungeChair(e: OpdCtx, p: Object3D, cover?: Material) {
  const { k, o } = e
  const c = gm(e)
  const mat = cover ?? c.teal
  const w = 0.76
  const d = 0.74
  // The base frame, upholstered, and the legs.
  k.soft(p, w, 0.2, d, 0.05, mat, 0, 0.29, 0)
  const leg = lathe(e, 'loungeLeg', [[0, 0], [0.014, 0], [0.018, 0.1], [0.022, 0.19], [0, 0.19]], 14)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const l = put(p, leg, o.oak, sx * (w / 2 - 0.07), 0, sz * (d / 2 - 0.07))
    l.rotation.set(sz * 0.08, 0, -sx * 0.08)
  }
  // The back and arms: rounded slabs, the back leaning a little.
  const b = group(p, 0, 0.39, -d / 2 + 0.09)
  b.rotation.x = -0.16
  k.soft(b, w, 0.42, 0.16, 0.07, mat, 0, 0.21, 0)
  for (const s of [-1, 1]) k.soft(p, 0.13, 0.27, d - 0.04, 0.06, mat, s * (w / 2 - 0.065), 0.5, 0.01)
  cushion(e, p, w - 0.27, 0.1, d - 0.2, mat, 0, 0.44, 0.07)
}

/* ---------- small fittings ---------- */

/**
 * A free-standing mobile charging station (front +z): a navy cabinet on a broad foot, the lit
 * header, eight lockers in two columns behind clear doors (operated) with a phone charging in some
 * and a green lamp over each, the cable tips hanging in them; 0.5 × 0.34 × 1.62 m.
 */
export function chargingStation(e: OpdCtx, p: Object3D) {
  const { k, m, o } = e
  const c = gm(e)
  k.soft(p, 0.6, 0.04, 0.44, 0.012, m.stainless, 0, 0.02, 0)
  const g = group(p, 0, 0.04, 0.17)
  carcass(e, g, 0.5, 1.4, 0.34, o.navy, [0.41, 0.66, 0.91, 1.16], 0.16)
  k.box(g, 0.016, 0.98, 0.3, o.navy, 0, 0.66 + 0.25 - 0.09, -0.17)
  // The header: the lit sign, a rounded cap.
  k.soft(g, 0.52, 0.2, 0.36, 0.03, o.navy, 0, 1.5, -0.17)
  face(e, g, 0.46, 0.14, e.o.screen('m_charge', 368, 112, board('#1f6fd1', [['MOBILE CHARGING', 0.34, '#ffffff'], ['Free · USB-C · Lightning · Micro-USB', 0.18, '#dbe9fb', 500]])), 0, 1.5, 0.0105)
  const r = rng(4471)
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 2; col++) {
      const x = col ? 0.125 : -0.125
      const y = 0.285 + row * 0.25
      if (r() < 0.6) {
        const ph = group(g, x, y - 0.115, -0.12)
        ph.rotation.x = -0.25
        k.soft(ph, 0.072, 0.15, 0.008, 0.008, m.black, 0, 0.075, 0)
      }
      rod(e, g, 0.002, 0.08, m.black, x + 0.05, y + 0.06, -0.2, 'z', 6)
      k.box(g, 0.025, 0.008, 0.004, c.ledGreen, x + 0.08, y + 0.1, 0.002, false)
      cupboardDoor(e, g, x - 0.115, y, 0.0, { w: 0.226, h: 0.23, hinge: 'left', face: o.navy, glass: true, label: 'Charging Locker', angle: 1.5 })
    }
}

/** A wall charging point (back at z = 0) at height y: a white plate of six USB sockets with a shelf for the phones under it. */
export function wallCharger(e: OpdCtx, p: Object3D, y = 1.1) {
  const { k, m } = e
  put(p, panel(e, 0.42, 0.24, 0.02, 0.01), m.whitePlastic, 0, y + 0.12, 0.01)
  for (let i = 0; i < 6; i++) {
    const x = -0.15 + i * 0.06
    k.box(p, 0.03, 0.04, 0.004, m.greyPlastic, x, y + 0.1, 0.021, false)
    k.box(p, 0.012, 0.005, 0.002, m.black, x, y + 0.11, 0.0235, false)
    k.box(p, 0.009, 0.004, 0.002, m.black, x, y + 0.093, 0.0235, false)
  }
  face(e, p, 0.38, 0.06, e.o.sign('m_wallcharge', 380, 60, board('#1f6fd1', [['MOBILE CHARGING POINT', 0.5, '#ffffff']])), 0, y + 0.195, 0.021)
  k.soft(p, 0.44, 0.02, 0.14, 0.006, m.whitePlastic, 0, y - 0.01, 0.07)
  k.box(p, 0.44, 0.03, 0.008, m.clearPlastic, 0, y + 0.01, 0.138, false)
  const ph = group(p, 0.05, y, 0.06)
  ph.rotation.x = -0.25
  k.soft(ph, 0.072, 0.15, 0.008, 0.008, m.black, 0, 0.075, 0)
}

/**
 * A floor safe (front +z, back at z = −0.52), 0.56 × 0.68 m: a heavy enamelled body on a plinth,
 * the door (operated) on concealed hinges with its combination dial and graduated ring, a
 * three-spoke handle, a key lock and the rating plate; a shelf of bundled notes and a cash bag in it.
 */
export function floorSafe(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const c = gm(e)
  const w = 0.56
  const h = 0.68
  const d = 0.52
  carcass(e, p, w, h, d, c.safe, [0.36], 0.05)
  k.box(p, w - 0.1, h - 0.15, 0.03, c.safe, 0, 0.36, -d + 0.03)
  for (let i = 0; i < 4; i++) k.box(p, 0.15, 0.06, 0.08, i % 2 ? c.notes : c.notesPink, -0.15 + i * 0.1, 0.098, -0.2, false)
  for (let i = 0; i < 3; i++) k.box(p, 0.15, 0.05, 0.08, c.notes, -0.1 + i * 0.1, 0.395, -0.25, false)
  k.soft(p, 0.16, 0.14, 0.12, 0.03, c.bag, 0.15, 0.44, -0.3)
  const door = new Group()
  door.name = `door_main_safe_${e.ids++}`
  door.position.set(-w / 2 + 0.01, h / 2 + 0.025, 0)
  door.userData.openAngle = -1.5
  door.userData.label = 'Safe Door'
  p.add(door)
  const leaf = put(door, panel(e, w - 0.02, h - 0.07, 0.07, 0.01), c.safeDoor, w / 2 - 0.01, 0, -0.035)
  leaf.userData.front = true
  // The dial on its graduated ring, the handle's hub and spokes, the key lock and the plate.
  const ring = put(door, lathe(e, 'safeRing', [[0, 0], [0.055, 0], [0.055, 0.006], [0, 0.006]], 32), m.chrome, w / 2 - 0.01, 0.12, 0.002)
  ring.rotation.x = PI / 2
  const dial = put(door, lathe(e, 'safeDial', [[0, 0], [0.04, 0], [0.042, 0.012], [0.036, 0.026], [0, 0.028]], 24), m.black, w / 2 - 0.01, 0.12, 0.006)
  dial.rotation.x = PI / 2
  const hub = put(door, lathe(e, 'safeHub', [[0, 0], [0.025, 0], [0.025, 0.03], [0, 0.03]], 16), m.chrome, w / 2 - 0.01, -0.08, 0.002)
  hub.rotation.x = PI / 2
  for (let i = 0; i < 3; i++) {
    const sp = group(door, w / 2 - 0.01, -0.08, 0.025)
    sp.rotation.z = (i * 2 * PI) / 3 + 0.4
    rod(e, sp, 0.007, 0.11, m.chrome, 0.055, 0, 0, 'x', 8)
    k.cyl(sp, 0.013, 0.013, 0.02, m.black, 0.11, 0, 0, 10).rotation.z = PI / 2
  }
  k.cyl(door, 0.011, 0.011, 0.012, c.brass, w / 2 - 0.15, -0.08, 0.006, 14).rotation.x = PI / 2
  k.box(door, 0.12, 0.035, 0.003, c.brass, w / 2 - 0.01, 0.24, 0.002, false)
  k.box(p, w, 0.05, d, m.black, 0, 0.025, -d / 2)
}

/** A ceiling dome camera (p at the ceiling, its underside): the white mounting base and the smoked dome. */
export function cctvDome(e: OpdCtx, p: Object3D) {
  const { m } = e
  const c = gm(e)
  put(p, lathe(e, 'domeBase', [[0, 0], [0.075, 0], [0.072, -0.03], [0.062, -0.035], [0, -0.035]], 28), m.whitePlastic)
  put(p, lathe(e, 'domeGlass', Array.from({ length: 9 }, (_, i): [number, number] => {
    const a = (i / 8) * (PI / 2)
    return [Math.cos(a) * 0.055, -0.035 - Math.sin(a) * 0.05]
  }), 24), c.smoked)
}

/**
 * A wall-hung narcotics (Schedule X) cabinet, back at z = 0, its bottom `y` up: a steel cabinet
 * with an inner compartment, two locks (the double-lock rule), its door (operated), the red label.
 */
export function narcoticsCabinet(e: OpdCtx, p: Object3D, y = 1.35) {
  const { k, o } = e
  const c = gm(e)
  const g = group(p, 0, y, 0.32)
  carcass(e, g, 0.6, 0.72, 0.32, o.frame, [0.36], 0)
  medicineBoxes(e, g, 0.52, 0.03, -0.03, 0.26, 0.16)
  // The inner locked box on the upper shelf, its own lock.
  k.box(g, 0.42, 0.24, 0.24, c.safe, 0, 0.49, -0.16)
  k.cyl(g, 0.008, 0.008, 0.01, c.brass, 0.16, 0.56, -0.035, 10).rotation.x = PI / 2
  const dr = cupboardDoor(e, g, -0.298, 0.36, 0, { w: 0.596, h: 0.716, hinge: 'left', face: o.frame, label: 'Narcotics Cabinet', angle: 1.5 })
  for (const yy of [0.14, -0.14]) k.cyl(dr, 0.011, 0.011, 0.014, c.brass, 0.53, yy, 0.007, 14).rotation.x = PI / 2
  face(e, dr, 0.4, 0.13, e.o.sign('m_narcotic', 400, 130, board('#c8161d', [['SCHEDULE X · NARCOTICS', 0.3, '#ffffff'], ['Double lock · Register entry mandatory', 0.17, '#ffe3e3', 500]])), 0.3, 0.2, 0.002)
}

/**
 * A wheelchair parking bay marked on the floor (p at floor level, the bay w × d centred): a blue
 * border and the access symbol, as a hospital's floor graphics are applied.
 */
export function wheelchairBay(e: OpdCtx, p: Object3D, w: number, d: number) {
  const art = e.o.sign(`m_wcbay${w}x${d}`, 256, Math.round((256 * d) / w), (g, cw, ch) => {
    g.clearRect(0, 0, cw, ch)
    g.strokeStyle = '#1f5fb8'
    g.lineWidth = cw * 0.04
    g.strokeRect(cw * 0.03, cw * 0.03, cw * 0.94, ch - cw * 0.06)
    const s = cw * 0.5
    g.save()
    g.translate((cw - s) / 2, (ch - s) / 2)
    isa('#1f5fb8')(g, s, s)
    g.restore()
  })
  art.transparent = true
  art.alphaTest = 0.3
  const f = face(e, p, w, d, art, 0, 0.003, 0)
  f.rotation.x = -PI / 2
  f.receiveShadow = true
}

/**
 * A free-standing acoustic screen between two desks, `len` long and `h` high: a fabric-covered
 * panel in an aluminium edge on two splayed feet.
 */
export function privacyScreen(e: OpdCtx, p: Object3D, len = 1.5, h = 1.45) {
  const { k, m } = e
  const c = gm(e)
  k.soft(p, len, h - 0.06, 0.04, 0.012, c.acoustic, 0, 0.06 + (h - 0.06) / 2, 0)
  k.box(p, len + 0.012, 0.014, 0.046, m.aluminium, 0, h, 0)
  for (const s of [-1, 1]) {
    k.box(p, 0.014, h - 0.06, 0.046, m.aluminium, s * (len / 2 + 0.006), 0.06 + (h - 0.06) / 2, 0)
    k.soft(p, 0.05, 0.03, 0.42, 0.01, m.aluminium, s * (len / 2 - 0.12), 0.015, 0)
    k.box(p, 0.03, 0.05, 0.03, m.aluminium, s * (len / 2 - 0.12), 0.05, 0)
  }
}

/**
 * Queue barriers: a run of chrome stanchions at `pts` (local x, z) with a navy retractable belt
 * drawn between consecutive posts; `breaks` lists the posts where a run ends (no belt to the next).
 */
export function queueRun(e: OpdCtx, p: Object3D, pts: [number, number][], breaks: number[] = []) {
  for (const [x, z] of pts) stanchion(e, p, x, z)
  for (let i = 0; i + 1 < pts.length; i++) if (!breaks.includes(i)) belt(e, p, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])
}

/** A staff work run against a wall (its back at z = 0, the staff at +z), `len` × `d`: a solid-surface top at 0.75 m on panel ends, a modesty panel, pedestals at `pedestals` (operated). */
export function workRun(e: OpdCtx, p: Object3D, len: number, d = 0.7, pedestals: number[] = []) {
  const { k, m } = e
  const f = furnMats(e)
  k.soft(p, len, 0.03, d, 0.008, m.solidSurface, 0, 0.735, d / 2)
  for (const s of [-1, 1]) {
    k.box(p, 0.025, 0.72, d - 0.03, m.hpl, s * (len / 2 - 0.0125), 0.36, d / 2 - 0.015)
    k.box(p, 0.026, 0.72, 0.0015, f.edgeWhite, s * (len / 2 - 0.0125), 0.36, d - 0.03, false)
  }
  k.box(p, len - 0.05, 0.45, 0.018, m.hpl, 0, 0.47, 0.06)
  k.box(p, len - 0.1, 0.06, 0.12, m.galvanised, 0, 0.66, 0.12, false)
  for (const x of pedestals) pedestal(e, group(p, x, 0, d - 0.02), 'Counter Drawer')
}
