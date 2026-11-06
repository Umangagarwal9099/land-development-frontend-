import { Mesh, PlaneGeometry, type Material, type Object3D } from 'three'
import { PI } from '../../kit'
import { rng } from '../../textures'
import { bake, bentTube, cupboardDoor, carcass, castor, drawer, face, geo, group, lathe, panel, put, rod } from '../erKit'
import { armChair, binders, furnMats, packs, pedestal, roundStool, supplies, taskChair } from '../erFurniture'
import type { OpdCtx } from './ctx'

/*
 * The OPD's furniture and small fittings, shared by every floor: desks, cupboards and racks whose
 * doors and drawers open, sinks and dispensers, the colour-coded biomedical waste bins of the 2016
 * rules, curtains on their tracks, trolleys laid with dressings, the instruments on a doctor's desk.
 * Every piece is built in its own frame at true size, front towards +z, standing on y = 0, as in
 * the emergency department's workshop (../erKit.ts), whose pieces these sit beside.
 */

import { medicineBoxes, reagentBottles } from './smalls'
/* ---------- desks and seating ---------- */

/**
 * A doctor's desk, `w` × `d`: a 25 mm oak-laminate top with matched PVC edge banding, on either
 * white laminate panel ends (`panel`) or a powder-coated steel frame of rectangular tube with
 * levelling feet (`frame`); a modesty panel set back from the patient's side (+z), a wire cable
 * tray and grommet under the doctor's edge, and a drawer pedestal on the doctor's side (−z) at
 * `ped` (−1 left, 1 right, 0 none) whose drawers open (operated). Unless given, the style
 * follows the floor, so a department's desks match.
 */
export function desk(e: OpdCtx, p: Object3D, w = 1.4, d = 0.75, ped: -1 | 0 | 1 = 1, top: Material = e.o.oak, style?: 'panel' | 'frame') {
  const { k, m } = e
  const f = furnMats(e)
  const kind = style ?? (p.position.y > 3 && p.position.y < 8 ? 'frame' : p.position.y > 12 ? 'frame' : 'panel')
  const T = 0.025
  const ty = 0.75 - T / 2
  // Top and its edge banding, 1.5 mm proud of the board's faces.
  k.box(p, w - 0.003, T, d - 0.003, top, 0, ty, 0)
  for (const s of [-1, 1]) {
    k.box(p, w, T, 0.0015, f.edgeOak, 0, ty, s * (d / 2 - 0.00075), false)
    k.box(p, 0.0015, T, d, f.edgeOak, s * (w / 2 - 0.00075), ty, 0, false)
  }
  if (kind === 'panel') {
    for (const s of [-1, 1]) {
      const x = s * (w / 2 - 0.035)
      k.box(p, 0.025, 0.72, d - 0.06, m.hpl, x, 0.37, 0)
      k.box(p, 0.026, 0.72, 0.0015, f.edgeWhite, x, 0.37, (d - 0.06) / 2, false)
      k.box(p, 0.026, 0.0015, d - 0.06, f.edgeWhite, x, 0.73, 0, false)
      for (const z of [-(d / 2 - 0.08), d / 2 - 0.08]) k.box(p, 0.03, 0.012, 0.04, f.nylon, x, 0.006, z, false)
    }
    k.box(p, w - 0.12, 0.38, 0.018, m.hpl, 0, 0.54, d / 2 - 0.12)
  } else {
    // Steel frame: four legs, a rail round under the top, feet; a perforated modesty panel.
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      k.soft(p, 0.06, 0.72, 0.03, 0.004, f.powderSilver, sx * (w / 2 - 0.06), 0.37, sz * (d / 2 - 0.06))
      k.box(p, 0.05, 0.012, 0.025, f.nylon, sx * (w / 2 - 0.06), 0.006, sz * (d / 2 - 0.06), false)
    }
    for (const sz of [-1, 1]) k.soft(p, w - 0.12, 0.04, 0.02, 0.004, f.powderSilver, 0, 0.705, sz * (d / 2 - 0.06))
    for (const sx of [-1, 1]) k.soft(p, 0.02, 0.04, d - 0.12, 0.004, f.powderSilver, sx * (w / 2 - 0.06), 0.705, 0)
    k.box(p, w - 0.2, 0.3, 0.003, f.perforated, 0, 0.53, d / 2 - 0.07)
  }
  // The cable tray: a wire basket hung under the back edge, the grommet over it.
  const tray = group(p, 0, 0.67, -d / 2 + 0.12)
  const wl = w * 0.55
  for (let i = 0; i <= 10; i++) k.box(tray, 0.003, 0.06, 0.1, f.satinChrome, -wl / 2 + (i * wl) / 10, 0, 0, false)
  for (const [yy, zz] of [[-0.03, 0], [0.03, -0.05], [0.03, 0.05]] as const) k.box(tray, wl, 0.003, 0.003, f.satinChrome, 0, yy, zz, false)
  put(p, lathe(e, 'deskGrommet', [[0.025, 0], [0.032, 0], [0.032, 0.004], [0.025, 0.004]], 16), m.darkPlastic, w / 2 - 0.2, 0.751, -d / 2 + 0.12, false)
  if (ped) pedestal(e, group(p, ped * (w / 2 - 0.27), 0, -d / 2 + 0.33, PI), 'Desk Drawer')
}

/** The doctor's chair: an ergonomic task chair, turned `ry`. */
export function doctorChair(e: OpdCtx, p: Object3D, x: number, z: number, ry: number) {
  taskChair(e, group(p, x, 0, z, ry))
}

/**
 * A consulting-room chair for the patient and their attendant: a four-leg steel-tube frame whose
 * sides loop up into the armrests, PU arm caps, a welted vinyl seat and a shaped back.
 */
export function patientChair(e: OpdCtx, p: Object3D) {
  armChair(e, p)
}

/** A round doctor's stool on five chrome legs and castors, a gas lift, a ring footrest and a welted seat. */
export function stool(e: OpdCtx, p: Object3D) {
  roundStool(e, p)
}

export { armChair, bariatricChair, labStool, roundStool, sofa, visitorChair } from '../erFurniture'

/* ---------- storage ---------- */

export type Fill = 'files' | 'supplies' | 'medicines' | 'linen' | 'reagents' | 'none'

/** What a shelf holds, w wide and d deep, standing on y (its front at z = 0). */
export function fillShelf(e: OpdCtx, p: Object3D, fill: Fill, w: number, y: number, d: number, h = 0.3) {
  const { k, m } = e
  if (fill === 'files') binders(e, p, w, y, -0.01, Math.min(0.28, d - 0.02))
  else if (fill === 'supplies') supplies(e, p, w, y, -0.01, d - 0.02, h)
  else if (fill === 'medicines') medicineBoxes(e, p, w, y, -0.01, d - 0.02, h)
  else if (fill === 'reagents') reagentBottles(e, p, w, y, -0.02, d - 0.04)
  else if (fill === 'linen') for (let i = 0; i < Math.floor(w / 0.42); i++) for (let j = 0; j < 4; j++) k.soft(p, 0.38, 0.05, d - 0.06, 0.012, j % 2 ? m.blanket : m.sheet, -w / 2 + 0.21 + i * 0.42, y + 0.026 + j * 0.052, -d / 2)
}

/**
 * A floor cupboard, w × h × d, white laminate: a pair (or one) of hinged doors that open
 * (operated; glazed if asked), shelves inside holding `fill`; drawers at the bottom if asked.
 */
export function cupboard(e: OpdCtx, p: Object3D, w: number, h: number, d: number, opts: { glass?: boolean; fill?: Fill; shelves?: number; drawers?: number; label?: string; top?: Material } = {}) {
  const { m } = e
  const nDr = opts.drawers ?? 0
  const drH = 0.18
  const base = nDr ? 0.1 + nDr * drH : 0
  const ns = opts.shelves ?? Math.max(1, Math.round((h - base) / 0.38) - 1)
  const plinth = 0.1
  const inner = h - Math.max(base, plinth) - 0.02
  const shelfYs = Array.from({ length: ns }, (_, i) => Math.max(base, plinth) + ((i + 1) * inner) / (ns + 1))
  carcass(e, p, w, h, d, m.hpl, shelfYs, plinth, opts.top)
  // PVC edging on the carcass's front edges, and the pins each adjustable shelf rests on.
  const fe = furnMats(e)
  for (const s of [-1, 1]) e.k.box(p, 0.0185, h - plinth, 0.0015, fe.edgeWhite, s * (w / 2 - 0.009), plinth + (h - plinth) / 2, 0.0008, false)
  for (const y of shelfYs) for (const sx of [-1, 1]) for (const z of [-0.05, -d + 0.05]) e.k.cyl(p, 0.003, 0.003, 0.01, m.chrome, sx * (w / 2 - 0.022), y - 0.012, z, 6).rotation.z = PI / 2
  const levels = [Math.max(base, plinth) + 0.02, ...shelfYs.map((s) => s + 0.01)]
  for (let i = 0; i < levels.length; i++) {
    const room = (i + 1 < levels.length ? levels[i + 1] : h - 0.02) - levels[i]
    if (opts.fill && opts.fill !== 'none') fillShelf(e, p, opts.fill, w - 0.06, levels[i], d - 0.04, room * 0.85)
  }
  for (let i = 0; i < nDr; i++) drawer(e, p, 0, plinth + drH / 2 + i * drH, 0, { w: w - 0.006, h: drH - 0.004, d: d - 0.04, front: m.hpl, handle: 'bar', label: opts.label ? `${opts.label} Drawer` : 'Drawer', fill: packs(e, [m.whitePlastic, m.blue, m.paper], [0.09, 0.05, 0.12]) })
  const dh = h - base - (opts.top ? 0 : 0.004) - 0.01
  const dy = base + dh / 2 + 0.005
  const pair = w > 0.6
  const lbl = opts.label ?? 'Cupboard'
  if (pair) {
    cupboardDoor(e, p, -w / 2 + 0.002, dy, 0, { w: w / 2 - 0.004, h: dh, hinge: 'left', face: opts.glass ? m.aluminium : m.hpl, glass: opts.glass, label: lbl, angle: 1.6 })
    cupboardDoor(e, p, w / 2 - 0.002, dy, 0, { w: w / 2 - 0.004, h: dh, hinge: 'right', face: opts.glass ? m.aluminium : m.hpl, glass: opts.glass, label: lbl, angle: 1.6 })
  } else cupboardDoor(e, p, -w / 2 + 0.002, dy, 0, { w: w - 0.006, h: dh, hinge: 'left', face: opts.glass ? m.aluminium : m.hpl, glass: opts.glass, label: lbl, angle: 1.6 })
}

/** A wall cupboard hung at `y` (its bottom), w × h × d: shelves of `fill` behind doors that open. */
export function wallCupboard(e: OpdCtx, p: Object3D, w: number, h: number, d: number, y: number, opts: { glass?: boolean; fill?: Fill; label?: string } = {}) {
  const up = group(p, 0, y, 0)
  cupboard(e, up, w, h, d, { ...opts, shelves: Math.max(1, Math.round(h / 0.35) - 1) })
  // A wall cupboard has no plinth: the carcass's own bottom closes it (the plinth box is under it, hidden by its depth).
  return up
}

/** A run of base units with a worktop: drawers and doors that open, `len` long, a solid-surface top at 0.9. */
export function baseRun(e: OpdCtx, p: Object3D, len: number, opts: { sink?: number; fill?: Fill; top?: Material } = {}) {
  const { k, m } = e
  const n = Math.max(1, Math.round(len / 0.6))
  const uw = len / n
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + uw * (i + 0.5)
    const u = group(p, x, 0, 0)
    if (i % 3 === 0) {
      carcass(e, u, uw, 0.88, 0.6, m.hpl, [], 0.1)
      for (let j = 0; j < 4; j++) drawer(e, u, 0, 0.78 - j * 0.19, 0, { w: uw - 0.006, h: 0.185, d: 0.56, front: m.hpl, handle: 'bar', label: 'Drawer', fill: packs(e, [m.whitePlastic, m.blue, m.paper, m.binBlue], [0.09, 0.05, 0.12]) })
    } else cupboard(e, u, uw, 0.88, 0.6, { fill: opts.fill ?? 'supplies', shelves: 1 })
  }
  k.box(p, len + 0.02, 0.03, 0.64, opts.top ?? m.solidSurface, 0, 0.895, -0.3)
  k.box(p, len + 0.02, 0.1, 0.012, opts.top ?? m.solidSurface, 0, 0.96, -0.606)
  if (opts.sink !== undefined) {
    // An inset stainless sink with a swan-neck mixer.
    k.box(p, 0.5, 0.012, 0.4, m.stainless, opts.sink, 0.913, -0.3, false)
    k.box(p, 0.42, 0.004, 0.32, m.black, opts.sink, 0.915, -0.3, false)
    put(p, bentTube(e, 'swan', [[0, 0, 0], [0, 0.3, 0], [0, 0.32, 0.18], [0, 0.22, 0.2]], 0.012, 0.06), m.chrome, opts.sink, 0.91, -0.56, false)
  }
}

/**
 * A boltless steel storage rack, w × h × d: slotted angle uprights (the punched slots every
 * 50 mm), foot plates, shelves of folded sheet with a front and back lip on their beams, each
 * holding `fill`.
 */
export function rack(e: OpdCtx, p: Object3D, w: number, h: number, d: number, levels: number, fill: Fill) {
  const { k, m } = e
  const f = furnMats(e)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * (w / 2 - 0.02)
    const z = -d / 2 + sz * (d / 2 - 0.02)
    // The angle: two flanges, the slots down its face, a foot plate.
    k.box(p, 0.04, h, 0.003, m.galvanised, x, h / 2, z + sz * 0.0185)
    k.box(p, 0.003, h, 0.04, m.galvanised, x + sx * 0.0185, h / 2, z)
    for (let y = 0.06; y < h - 0.03; y += 0.05) k.box(p, 0.012, 0.025, 0.004, f.slot, x, y, z + sz * 0.0205, false)
    k.box(p, 0.06, 0.004, 0.06, m.galvanised, x, 0.002, z, false)
  }
  for (let i = 0; i < levels; i++) {
    const y = 0.12 + (i * (h - 0.2)) / Math.max(1, levels - 1)
    k.box(p, w - 0.04, 0.0015, d - 0.04, m.galvanised, 0, y, -d / 2)
    for (const sz of [-1, 1]) k.box(p, w - 0.03, 0.03, 0.004, m.galvanised, 0, y - 0.015, -d / 2 + sz * (d / 2 - 0.02))
    for (const sx of [-1, 1]) k.box(p, 0.004, 0.03, d - 0.04, m.galvanised, sx * (w / 2 - 0.02), y - 0.015, -d / 2)
    if (i < levels - 1) fillShelf(e, p, fill, w - 0.06, y + 0.002, d, ((h - 0.2) / Math.max(1, levels - 1)) * 0.8)
  }
}

/** A four-drawer steel filing cabinet whose drawers open. */
export function fileCabinet(e: OpdCtx, p: Object3D, n = 4) {
  const { k, m } = e
  const h = 0.33 * n + 0.05
  const steel = e.o.frame
  for (const s of [-1, 1]) k.box(p, 0.012, h, 0.62, steel, s * 0.234, h / 2, -0.31)
  k.box(p, 0.47, 0.012, 0.62, steel, 0, h - 0.006, -0.31)
  k.box(p, 0.47, h, 0.012, steel, 0, h / 2, -0.616)
  for (let i = 0; i < n; i++) {
    const dr = drawer(e, p, 0, 0.05 + 0.165 + i * 0.33, 0, { w: 0.462, h: 0.32, d: 0.58, front: steel, handle: 'bar', label: 'Filing Drawer', fill: (g, iw, id, ih) => {
      for (let z = -0.04; z > -id + 0.04; z -= 0.03) k.box(g, iw - 0.04, ih * 0.75, 0.004, [m.paper, m.vacuum, m.blue][Math.floor(Math.abs(z * 77)) % 3], 0, (ih * 0.75) / 2, z, false)
    } })
    // The card holder over the pull, its card.
    k.box(dr, 0.09, 0.035, 0.004, m.chrome, 0, 0.1, 0.003, false)
    k.box(dr, 0.08, 0.026, 0.002, m.paper, 0, 0.1, 0.0055, false)
  }
  // The plinth, and the cam lock in the top front corner.
  k.box(p, 0.46, 0.05, 0.6, furnMats(e).powderBlack, 0, 0.025, -0.31)
  k.cyl(p, 0.009, 0.009, 0.012, m.chrome, 0.19, h - 0.035, 0.002, 14).rotation.x = PI / 2
}

/**
 * Staff lockers in a bank of `n`: steel carcasses on a plinth, each full-height door (operated)
 * with its pressed ventilation louvres top and bottom, the number plate, the cam lock and a
 * recessed pull; a hat shelf and hanging rail inside.
 */
export function lockers(e: OpdCtx, p: Object3D, n = 4) {
  const { k, m } = e
  const f = furnMats(e)
  const w = 0.4
  const steel = e.o.frame
  k.box(p, n * w, 0.08, 0.46, f.powderBlack, 0, 0.04, -0.25)
  for (let i = 0; i < n; i++) {
    const g = group(p, (i - (n - 1) / 2) * w, 0, 0)
    carcass(e, g, w, 1.8, 0.5, steel, [1.55], 0.08)
    k.cyl(g, 0.01, 0.01, 0.36, m.chrome, 0, 1.45, -0.25, 8).rotation.z = PI / 2
    lockerDoor(e, g, w - 0.006, 1.7, 0.94, i + 1)
  }
}

/** A locker's door, hinged at its left edge, its front at z = 0: louvres, number, lock, pull. */
function lockerDoor(e: OpdCtx, p: Object3D, w: number, h: number, y: number, no: number) {
  const { k, m } = e
  const f = furnMats(e)
  const part = group(p, -w / 2 - 0.001, y, 0, 0, `door_er_${e.ids++}`)
  part.userData.openAngle = -1.6
  part.userData.label = 'Locker'
  const front = put(part, panel(e, w - 0.004, h, 0.018, 0.004), e.o.frame, w / 2, 0, -0.009)
  front.userData.front = true
  for (const yy of [h / 2 - 0.12, -h / 2 + 0.12]) for (let j = 0; j < 5; j++) k.box(part, w * 0.5, 0.008, 0.004, f.slot, w / 2, yy + (j - 2) * 0.02, 0.001, false)
  const plate = e.o.sign(`locker${no}`, 64, 40, (g, cw, ch) => {
    g.fillStyle = '#e9ebe9'
    g.fillRect(0, 0, cw, ch)
    g.fillStyle = '#222'
    g.font = `700 ${ch * 0.7}px Helvetica`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(String(no), cw / 2, ch / 2 + 1)
  })
  face(e, part, 0.06, 0.035, plate, w / 2, h / 2 - 0.3, 0.003)
  k.cyl(part, 0.012, 0.012, 0.012, m.chrome, w - 0.06, 0.12, 0.003, 14).rotation.x = PI / 2
  k.box(part, 0.03, 0.12, 0.006, f.powderBlack, w - 0.06, 0.0, 0.002, false)
  bake(part, front)
}

/* ---------- privacy ---------- */

/**
 * A privacy curtain on its ceiling track, `len` along local x from 0, hung from the ceiling
 * (at `ceiling` above the floor) to 0.3 m off the floor; `drawn` is how much of the track it covers.
 */
export function curtain(e: OpdCtx, p: Object3D, len: number, ceiling: number, drawn = 1) {
  const { k, m } = e
  // The cubicle track: an aluminium C-section fixed to the ceiling every metre, end stops, and
  // the gliders running in it from which the curtain's mesh hangs.
  k.box(p, len, 0.022, 0.03, m.aluminium, len / 2, ceiling - 0.011, 0, false)
  k.box(p, len, 0.004, 0.012, furnMats(e).slot, len / 2, ceiling - 0.0225, 0, false)
  for (let x = 0.08; x < len; x += 1.0) k.box(p, 0.05, 0.008, 0.05, m.aluminium, x, ceiling - 0.002, 0, false)
  for (const x of [0.01, len - 0.01]) k.box(p, 0.02, 0.03, 0.034, m.whitePlastic, x, ceiling - 0.018, 0, false)
  const w = Math.max(0.25, len * drawn)
  const head = 0.45
  const top = ceiling - 0.05
  const cloth = top - head - 0.3
  const pleat = (h: number) => geo(e, `opdPleat${w.toFixed(2)}|${h.toFixed(2)}`, () => {
    const g = new PlaneGeometry(w, h, Math.max(4, Math.round(w / 0.03)), 1)
    const pos = g.getAttribute('position')
    const rr = rng(Math.round(w * 1000))
    const ph = rr() * 6
    for (let i = 0; i < pos.count; i++) {
      const s = pos.getX(i) + w / 2
      const t = (s / 0.16) * PI * 2
      pos.setZ(i, 0.03 * (Math.sin(t + 0.6 * Math.sin(t * 0.37 + ph)) * (0.7 + 0.3 * Math.sin(t * 0.2))))
    }
    g.computeVertexNormals()
    return g
  })
  for (let x = 0.03; x < w; x += 0.15) {
    k.box(p, 0.014, 0.03, 0.01, m.whitePlastic, x, ceiling - 0.036, 0, false)
    k.box(p, 0.004, 0.03, 0.004, m.chrome, x, ceiling - 0.062, 0, false)
  }
  const net = new Mesh(pleat(head), m.curtainNet)
  net.position.set(w / 2, top - head / 2, 0)
  p.add(net)
  const c = new Mesh(pleat(cloth), m.curtain)
  c.position.set(w / 2, 0.3 + cloth / 2, 0)
  c.castShadow = true
  p.add(c)
}

export { wheelchair } from '../erFurniture'

/**
 * A white coat hanging from a wall hook by its collar loop: the body falling from narrow
 * shoulders to the hem, a little flattened against the wall, its sleeves hanging at the sides,
 * the collar turned down.
 */
export function coatOnHook(e: OpdCtx, p: Object3D, y = 1.75) {
  const { k, m } = e
  k.box(p, 0.03, 0.03, 0.012, m.chrome, 0, y + 0.01, 0.006)
  put(p, bentTube(e, 'coatHook', [[0, 0, 0.01], [0, 0, 0.05], [0, 0.03, 0.06]], 0.005, 0.01), m.chrome, 0, y, 0, false)
  const body = put(p, lathe(e, 'coatBody', [[0, -0.95], [0.25, -0.95], [0.26, -0.9], [0.25, -0.6], [0.23, -0.3], [0.22, -0.12], [0.16, -0.04], [0.06, 0.0], [0, 0.0]], 24), m.sheet, 0, y + 0.02, 0.09)
  body.scale.set(1, 1, 0.32)
  for (const s of [-1, 1]) put(p, bentTube(e, 'coatSleeve', [[0, 0, 0], [s * 0.02, -0.25, 0.01], [s * 0.01, -0.55, 0.02]], 0.045, 0.1), m.sheet, s * 0.2, y - 0.1, 0.1)
  k.soft(p, 0.16, 0.05, 0.06, 0.02, m.sheet, 0, y - 0.01, 0.1)
}

export { examCouch } from '../erFurniture'

/**
 * A workroom bench, w × d with its top at h: a powder-coated steel frame on levelling feet with a
 * rail round under the top, a solid-surface (or given) top with its eased edge, an undershelf.
 */
export function workbench(e: OpdCtx, p: Object3D, w: number, d: number, h = 0.9, top?: Material) {
  const { k, m } = e
  const f = furnMats(e)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * (w / 2 - 0.04)
    const z = -d / 2 + sz * (d / 2 - 0.04)
    k.soft(p, 0.04, h - 0.05, 0.04, 0.004, f.powderSilver, x, (h - 0.05) / 2 + 0.01, z)
    k.cyl(p, 0.018, 0.02, 0.012, f.nylon, x, 0.006, z, 12).castShadow = false
  }
  for (const sz of [-1, 1]) k.soft(p, w - 0.08, 0.04, 0.02, 0.004, f.powderSilver, 0, h - 0.06, -d / 2 + sz * (d / 2 - 0.04))
  k.soft(p, w, 0.03, d, 0.008, top ?? m.solidSurface, 0, h - 0.015, -d / 2)
  k.box(p, w - 0.1, 0.018, d - 0.1, m.hpl, 0, 0.2, -d / 2)
  for (const sz of [-1, 1]) k.box(p, w - 0.08, 0.025, 0.02, f.powderSilver, 0, 0.19, -d / 2 + sz * (d / 2 - 0.04))
}

/** A group in p, for builders that take (e, p): re-exported so fitters need only this module. */
export { group, rod, face, put, castor }

/** The small clinical items live in smalls.ts; re-exported so fitters need only this module. */
export * from './smalls'
