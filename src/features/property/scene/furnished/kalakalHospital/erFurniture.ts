import { Group, TorusGeometry, type Material, type Object3D } from 'three'
import { PI } from '../kit'
import {
  bake, bentTube, carcass, castor, cupboardDoor, drape, drawer, face, geo, group, lathe, panel, pillow, put, rod, starBase, tube, type Ctx,
} from './erKit'

/*
 * The emergency department's furniture, modelled on the products such a department buys: an ED
 * stretcher-bed (after the 2.1 m hydraulic emergency stretchers in common use), hospital lockers,
 * overbed tables, solid-surface counters on drawer pedestals, cupboards, the red crash cart,
 * seating and wheelchairs. Everything a visitor would try to open opens (see erKit drawer and
 * cupboardDoor); everything is built in its own frame, front towards +z, on y = 0.
 */

/* ---------- the ED stretcher-bed ---------- */

export interface BedFit {
  /** The backrest's angle, radians up from flat. */
  back: number
  /** Linen: made up and waiting, in use (the blanket thrown back), or stripped to the sheet. */
  linen: 'made' | 'used' | 'sheet'
  /** Mattress top above the floor (the litter rises from 0.56 to 0.9). */
  height?: number
  /** The side rails start lowered. */
  railsDown?: boolean
  /** A portable oxygen cylinder in the base tray; the IV pole raised with a bag. */
  o2?: boolean
  iv?: boolean
}

/**
 * The bed along local z, head at −z: twin-wheel castors with the brake and steer pedals at the
 * ends, the moulded base hood with its storage tray, the lift columns in their bellows, the
 * aluminium litter with corner bumpers and push handles, a four-section mattress in blue vinyl
 * with the backrest raised on its own (operated: Raise / Lower), linen and pillow, side rails
 * that lower (operated), moulded head and foot boards, the IV pole.
 */
export function bed(e: Ctx, p: Object3D, o: BedFit) {
  const { k, m } = e
  const H = o.height ?? 0.66
  const MT = 0.1
  const deck = H - MT
  const W = 0.74
  // Castors, the brake (red) and steer (green) pedals on their bars at either end.
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * 0.3, sz * 0.8, 0.075, sx * sz * 0.25 + (e.r() - 0.5) * 0.4)
  for (const sz of [-1, 1]) {
    rod(e, p, 0.012, 0.72, m.stainless, 0, 0.16, sz * 0.9, 'x', 8)
    k.soft(p, 0.12, 0.03, 0.09, 0.012, m.red, -0.3, 0.165, sz * 0.93)
    k.soft(p, 0.12, 0.03, 0.09, 0.012, m.green, 0.3, 0.165, sz * 0.93)
  }
  // The base: chassis, its moulded hood, the tray on top for a cylinder or belongings.
  k.soft(p, 0.62, 0.06, 1.66, 0.02, m.bedFrame, 0, 0.19, 0)
  k.soft(p, 0.76, 0.13, 1.74, 0.05, m.bedBase, 0, 0.27, 0)
  k.soft(p, 0.66, 0.015, 1.2, 0.006, m.darkPlastic, 0, 0.336, 0.08)
  if (o.o2) {
    const c = group(p, 0.12, 0.42, -0.25)
    c.rotation.x = PI / 2
    cylinder(e, c, 0.11, 0.62, 'portable')
    for (const z of [-0.12, 0.18]) k.box(p, 0.24, 0.02, 0.04, m.darkPlastic, 0.12, 0.35, z - 0.25)
  }
  // Lift columns at head and foot, in their bellows.
  const bellow = lathe(e, `bellows${deck.toFixed(2)}`, Array.from({ length: 17 }, (_, i): [number, number] => [i % 2 ? 0.075 : 0.065, 0.34 + ((deck - 0.42) * i) / 16]), 28)
  for (const z of [-0.48, 0.48]) {
    put(p, bellow, m.darkPlastic, 0, 0, z)
    k.soft(p, 0.2, 0.06, 0.18, 0.02, m.greyPlastic, 0, deck - 0.05, z)
  }
  // The litter: a tube frame round the deck, bumpers on the corners, push handles at the head.
  const L = 2.0
  const frame = bentTube(e, `litter${deck.toFixed(2)}`, [[0, deck - 0.03, -L / 2], [0.4, deck - 0.03, -L / 2], [0.4, deck - 0.03, L / 2], [-0.4, deck - 0.03, L / 2], [-0.4, deck - 0.03, -L / 2], [0.001, deck - 0.03, -L / 2]], 0.018, 0.08)
  put(p, frame, m.bedFrame)
  k.soft(p, 0.76, 0.025, 1.3, 0.008, m.greyPlastic, 0, deck - 0.012, 0.33)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(p, lathe(e, 'bumper', [[0, -0.03], [0.045, -0.03], [0.05, -0.02], [0.05, 0.02], [0.045, 0.03], [0, 0.03]], 20), m.darkPlastic, sx * 0.38, deck - 0.04, sz * 0.97)
  for (const sx of [-1, 1]) put(p, bentTube(e, `push${sx}`, [[sx * 0.36, deck - 0.03, -0.95], [sx * 0.36, deck + 0.02, -1.06], [sx * 0.33, deck + 0.3, -1.08]], 0.014, 0.05), m.bedFrame)
  // The seat and leg sections, with the linen over them.
  k.soft(p, W, MT, 1.3, 0.035, m.mattress, 0, deck + MT / 2, 0.33)
  const seed = (e.r() * 100) | 0
  put(p, drape(e, `seat${seed}`, W + 0.01, 1.3, 0.085, 0, seed), m.sheet, 0, deck + MT + 0.004, 0.33)
  // The backrest, hinged at the seat: its deck, mattress, linen and pillow; operated.
  const back = new Group()
  back.name = `door_er_${e.ids++}`
  back.position.set(0, deck, -0.32)
  back.rotation.x = o.back
  const up = o.back < 0.45
  back.userData = { axis: 'x', openAngle: (up ? 1.05 : 0.08) - o.back, label: 'Backrest', verbs: up ? ['Raise', 'Lower'] : ['Lower', 'Raise'] }
  p.add(back)
  k.soft(back, 0.74, 0.02, 0.66, 0.008, m.greyPlastic, 0, -0.012, -0.33)
  const mat = k.soft(back, W, MT, 0.66, 0.035, m.mattress, 0, MT / 2, -0.33)
  put(back, drape(e, `back${seed}`, W + 0.01, 0.66, 0.085, 0, seed + 3), m.sheet, 0, MT + 0.004, -0.33)
  if (o.linen !== 'sheet') {
    const pl = put(back, pillow(e, 0.6, 0.13, 0.4), m.sheet, (e.r() - 0.5) * 0.06, MT + 0.07, -0.42)
    pl.rotation.set(-0.08, (e.r() - 0.5) * 0.12, 0)
  }
  mat.userData.front = true
  bake(back, mat)
  // Blanket: folded at the foot, or thrown back over the legs.
  if (o.linen === 'made') {
    for (let i = 0; i < 3; i++) k.soft(p, 0.56 - i * 0.01, 0.028, 0.34, 0.012, i === 2 ? m.sheet : m.blanket, 0.01 * i, deck + MT + 0.02 + i * 0.027, 0.72 + i * 0.004)
  } else if (o.linen === 'used') {
    put(p, drape(e, `blanket${seed}`, W + 0.03, 0.9, 0.16, 0, seed + 7), m.blanket, 0, deck + MT + 0.02, 0.5)
    k.soft(p, W + 0.06, 0.05, 0.16, 0.024, m.blanket, 0, deck + MT + 0.04, 0.06)
  }
  // Side rails, each a moulded panel on two arms, raised or lowered (operated).
  for (const s of [-1, 1]) {
    const rail = new Group()
    rail.name = `drawer_er_${e.ids++}`
    rail.position.set(s * 0.41, deck + 0.21 - (o.railsDown ? 0.27 : 0), -0.1)
    rail.userData = { slide: o.railsDown ? [0, 0.27, 0] : [0, -0.27, 0], label: 'Side Rail', verbs: o.railsDown ? ['Raise', 'Lower'] : ['Lower', 'Raise'] }
    p.add(rail)
    const pan = put(rail, panel(e, 1.1, 0.3, 0.032, 0.06, [[0.42, 0.16, -0.25, -0.02], [0.42, 0.16, 0.25, -0.02]]), m.bedRail)
    pan.rotation.y = PI / 2
    for (const z of [-0.36, 0.36]) k.box(rail, 0.022, 0.22, 0.04, m.bedFrame, -s * 0.01, -0.2, z)
    k.box(rail, 0.006, 0.05, 0.12, m.darkPlastic, s * 0.017, 0.08, 0.38, false)
    pan.userData.front = true
    bake(rail, pan)
  }
  // Head board, with its hand hold; foot board with the controls and a chart in its holder.
  const hb = put(p, panel(e, 0.78, 0.34, 0.035, 0.06, [[0.46, 0.06, 0, 0.09]]), m.greyPlastic, 0, deck + 0.13, -1.02)
  hb.castShadow = true
  put(p, panel(e, 0.78, 0.3, 0.04, 0.06, [[0.46, 0.06, 0, 0.08]]), m.greyPlastic, 0, deck + 0.1, 1.02)
  k.box(p, 0.26, 0.08, 0.006, m.darkPlastic, 0, deck + 0.0, 1.043, false)
  k.box(p, 0.17, 0.23, 0.01, m.darkPlastic, -0.24, deck + 0.13, 1.048)
  k.box(p, 0.15, 0.2, 0.003, m.paper, -0.24, deck + 0.122, 1.055, false)
  // The IV pole at the head corner: folded down, or up with a bag.
  if (o.iv) {
    k.cyl(p, 0.012, 0.012, 1.3, m.stainless, 0.36, deck + 0.6, -0.98, 10)
    for (const a of [0, PI]) put(p, bentTube(e, 'ivhook', [[0, 0, 0], [0.07, 0.01, 0], [0.08, 0.05, 0]], 0.004, 0.02), m.stainless, 0.36, deck + 1.25, -0.98).rotation.y = a
    infusionBag(e, p, 0.43, deck + 1.13, -0.98)
  } else k.cyl(p, 0.012, 0.012, 0.5, m.stainless, 0.36, deck - 0.2, -0.98, 10)
}

/** A 1 L bag of saline on its hook: the bag, its label, the giving set's drip chamber and line. */
export function infusionBag(e: Ctx, p: Object3D, x: number, y: number, z: number, line = 0.9) {
  const { k, m } = e
  put(p, pillow(e, 0.12, 0.035, 0.2), m.clearPlastic, x, y, z).rotation.x = PI / 2
  k.box(p, 0.07, 0.09, 0.002, m.paper, x, y, z + 0.02, false)
  k.cyl(p, 0.009, 0.009, 0.05, m.clearPlastic, x, y - 0.13, z, 10)
  k.cyl(p, 0.002, 0.002, line, m.tubing, x, y - 0.16 - line / 2, z, 6)
}

/* ---------- lockers, tables, chairs ---------- */

/** Contents for a drawer: rows of packs and boxes, seeded, in the given colours. */
export function packs(e: Ctx, mats: Material[], size: [number, number, number]) {
  return (p: Group, iw: number, id: number, ih: number) => {
    const [pw, ph, pd] = size
    const h = Math.min(ph, ih - 0.01)
    for (let x = -iw / 2 + pw / 2 + 0.005; x < iw / 2 - pw / 2; x += pw + 0.008)
      for (let z = -pd / 2 - 0.01; z > -id + pd / 2; z -= pd + 0.008) {
        if (e.r() < 0.12) continue
        e.k.box(p, pw, h * (0.75 + e.r() * 0.25), pd, mats[(e.r() * mats.length) | 0], x, (h * 0.85) / 2, z, false)
      }
  }
}

/**
 * A hospital bedside locker, 0.48 × 0.88 × 0.45 on castors: a moulded top with a raised lip, two
 * drawers (operated) and a cupboard under them (operated), the towel rail on its side.
 */
export function locker(e: Ctx, p: Object3D) {
  const { k, m } = e
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * 0.19, sz * 0.17, 0.035)
  const c = group(p, 0, 0.08, 0.225)
  carcass(e, c, 0.48, 0.8, 0.45, m.hpl, [0.36], 0)
  k.soft(c, 0.5, 0.03, 0.47, 0.012, m.whitePlastic, 0, 0.815, -0.225)
  for (const s of [-1, 1]) k.box(c, 0.012, 0.025, 0.45, m.whitePlastic, s * 0.24, 0.84, -0.225)
  k.box(c, 0.46, 0.012, 0.42, m.melamine, 0, 0.53, -0.22)
  const fill = packs(e, [m.blue, m.whitePlastic, m.paper], [0.1, 0.05, 0.12])
  drawer(e, c, 0, 0.71, 0, { w: 0.46, h: 0.15, d: 0.42, front: m.hpl, handle: 'grip', label: 'Locker Drawer', fill })
  drawer(e, c, 0, 0.56, 0, { w: 0.46, h: 0.15, d: 0.42, front: m.hpl, handle: 'grip', label: 'Locker Drawer', fill: packs(e, [m.sheet, m.blanket], [0.2, 0.06, 0.3]) })
  k.soft(c, 0.3, 0.12, 0.25, 0.04, m.blue, 0.02, 0.43, -0.2)
  cupboardDoor(e, c, -0.23, 0.24, 0, { w: 0.46, h: 0.46, hinge: 'left', face: m.hpl, label: 'Locker' })
  put(c, bentTube(e, 'towel', [[0, 0.7, -0.05], [0.05, 0.7, -0.05], [0.05, 0.7, -0.4], [0, 0.7, -0.4]], 0.006, 0.02), m.stainless, 0.24, 0, 0)
}

/** An overbed table: an H base on castors, the gas-lift column at one side, a laminate top with a lip, reaching `reach` over the bed. */
export function overbedTable(e: Ctx, p: Object3D, height = 0.92) {
  const { k, m } = e
  for (const z of [-0.2, 0.2]) {
    put(p, bentTube(e, 'obtBase', [[-0.32, 0.06, 0], [0.32, 0.06, 0]], 0.018), m.powder, 0, 0, z)
    for (const x of [-0.3, 0.3]) castor(e, p, x, z, 0.03, e.r())
  }
  put(p, bentTube(e, 'obtSpine', [[0, 0.06, -0.2], [0, 0.06, 0.2]], 0.02), m.powder, 0.3, 0, 0)
  k.soft(p, 0.07, height - 0.2, 0.05, 0.015, m.whitePlastic, 0.3, 0.06 + (height - 0.2) / 2, 0)
  k.soft(p, 0.055, 0.22, 0.04, 0.012, m.aluminium, 0.3, height - 0.13, 0)
  k.box(p, 0.08, 0.04, 0.32, m.whitePlastic, 0.3, height - 0.05, 0)
  put(p, panel(e, 0.84, 0.4, 0.024, 0.03), m.laminate, -0.12, height - 0.012, 0).rotation.x = -PI / 2
  put(p, panel(e, 0.86, 0.42, 0.012, 0.035, [[0.82, 0.38, 0, 0]]), m.whitePlastic, -0.12, height + 0.006, 0).rotation.x = -PI / 2
}

/** A visitor's armchair on a sled frame: navy vinyl seat and back, padded arms. */
export function visitorChair(e: Ctx, p: Object3D) {
  const { k, m } = e
  for (const s of [-1, 1]) {
    put(p, bentTube(e, 'sled', [[0, 0.02, 0.26], [0, 0.02, -0.22], [0, 0.44, -0.28], [0, 0.66, -0.26], [0, 0.66, 0.16], [0, 0.42, 0.24], [0, 0.02, 0.26]], 0.012, 0.06), m.powder, s * 0.27, 0, 0)
    k.soft(p, 0.06, 0.03, 0.36, 0.012, m.darkPlastic, s * 0.27, 0.675, -0.04)
  }
  k.soft(p, 0.5, 0.09, 0.48, 0.035, m.vinylSeat, 0, 0.47, 0.0)
  const b = k.soft(p, 0.48, 0.46, 0.08, 0.035, m.vinylSeat, 0, 0.8, -0.25)
  b.rotation.x = -0.12
  for (const z of [-0.2, 0.2]) rod(e, p, 0.01, 0.54, m.powder, 0, 0.42, z, 'x', 8)
}

/** A task chair on a five-star base: gas lift, synchro mechanism, upholstered seat, mesh back, arms. */
export function taskChair(e: Ctx, p: Object3D) {
  const { k, m } = e
  starBase(e, p, 0.32, 0.085, m.black, 0.03)
  put(p, lathe(e, 'gaslift', [[0, 0.11], [0.03, 0.11], [0.03, 0.27], [0.024, 0.27], [0.024, 0.4], [0, 0.4]], 18), m.chrome)
  k.soft(p, 0.26, 0.05, 0.28, 0.015, m.black, 0, 0.42, 0)
  k.soft(p, 0.5, 0.08, 0.48, 0.035, m.fabric, 0, 0.48, 0.02)
  put(p, bentTube(e, 'chairSpine', [[0, 0.44, -0.12], [0, 0.46, -0.27], [0, 0.7, -0.29]], 0.018, 0.06), m.black)
  const back = put(p, panel(e, 0.46, 0.52, 0.03, 0.12, [[0.38, 0.44, 0, 0]]), m.black, 0, 0.94, -0.3)
  back.rotation.x = -0.1
  const mesh = k.box(p, 0.4, 0.46, 0.006, m.fabric, 0, 0.94, -0.3)
  mesh.rotation.x = -0.1
  for (const s of [-1, 1]) {
    put(p, bentTube(e, 'chairArm', [[0, 0.45, 0.0], [0, 0.66, -0.02], [0, 0.66, 0.06]], 0.012, 0.03), m.black, s * 0.25, 0, 0)
    k.soft(p, 0.07, 0.03, 0.24, 0.012, m.black, s * 0.25, 0.675, 0.03)
  }
}

/** A manual wheelchair, facing local +z: tube frame, spoked 24″ wheels with push rims, castors, sling seat and back, footplates. */
export function wheelchair(e: Ctx, p: Object3D) {
  const { k, m } = e
  const tyre = lathe(e, 'wcTyre', [[0.27, -0.016], [0.29, -0.018], [0.3, -0.01], [0.3, 0.01], [0.29, 0.018], [0.27, 0.016]], 48)
  const rim = lathe(e, 'wcRim', [[0.255, -0.012], [0.272, -0.012], [0.272, 0.012], [0.255, 0.012]], 48)
  const push = geo(e, 'wcPush', () => new TorusGeometry(0.26, 0.009, 8, 48))
  for (const s of [-1, 1]) {
    const w = group(p, s * 0.31, 0.3, -0.12)
    w.rotation.z = PI / 2
    put(w, tyre, m.rubber)
    put(w, rim, m.chrome, 0, 0, 0, false)
    const pr = put(w, push, m.chrome, 0, s * 0.03, 0, false)
    pr.rotation.x = PI / 2
    for (let i = 0; i < 12; i++) rod(e, group(w, 0, 0, 0, (i / 12) * PI), 0.0015, 0.5, m.chrome, 0, 0, 0, 'z', 4).castShadow = false
    put(w, lathe(e, 'wcHub', [[0, -0.03], [0.03, -0.03], [0.03, 0.03], [0, 0.03]], 16), m.aluminium)
    castor(e, p, s * 0.22, 0.3, 0.06, 0.2 * s)
    // Side frame: down tube to the castor, seat rail, back post with its push handle.
    put(p, bentTube(e, 'wcSide', [[0, 0.16, 0.3], [0, 0.5, 0.26], [0, 0.5, -0.18], [0, 0.95, -0.24]], 0.012, 0.05), m.chrome, s * 0.23, 0, 0)
    k.cyl(p, 0.017, 0.017, 0.11, m.black, s * 0.23, 0.92, -0.32, 10).rotation.x = PI / 2 - 0.4
    put(p, bentTube(e, 'wcArm', [[0, 0.5, -0.12], [0, 0.72, -0.12], [0, 0.72, 0.16], [0, 0.5, 0.18]], 0.01, 0.04), m.chrome, s * 0.26, 0, 0)
    k.soft(p, 0.05, 0.03, 0.26, 0.012, m.black, s * 0.26, 0.735, 0.02)
    // Footrest hanger and plate.
    put(p, bentTube(e, 'wcFoot', [[0, 0.5, 0.24], [0, 0.14, 0.4]], 0.01), m.chrome, s * 0.15, 0, 0)
    k.soft(p, 0.15, 0.012, 0.13, 0.005, m.black, s * 0.12, 0.13, 0.42)
  }
  k.box(p, 0.44, 0.012, 0.42, m.black, 0, 0.5, 0.03)
  k.box(p, 0.44, 0.38, 0.01, m.black, 0, 0.75, -0.22).rotation.x = -0.12
  rod(e, p, 0.009, 0.46, m.chrome, 0, 0.22, -0.1, 'x', 8)
}

/* ---------- counters, pedestals, cupboards ---------- */

/** Contents of a nurse's or clerk's desk drawers, by depth: stationery, forms and gloves, files. */
function deskFill(e: Ctx, depth: number) {
  const { m } = e
  if (depth < 0.15) return (p: Group, iw: number, id: number) => {
    e.k.box(p, iw * 0.45, 0.02, id * 0.6, m.greyPlastic, -iw * 0.22, 0.01, -id * 0.35, false)
    for (let i = 0; i < 6; i++) rod(e, p, 0.004, 0.14, [m.blue, m.black, m.red][i % 3], -iw * 0.38 + i * 0.02, 0.026, -id * 0.35, 'z', 6)
    e.k.box(p, 0.08, 0.012, 0.08, m.vacuum, iw * 0.2, 0.006, -id * 0.3, false)
    e.k.box(p, 0.04, 0.035, 0.12, m.darkPlastic, iw * 0.3, 0.018, -id * 0.6, false)
  }
  if (depth < 0.25) return packs(e, [m.paper, m.blue, m.purple, m.whitePlastic], [0.12, 0.08, 0.24])
  return (p: Group, iw: number, id: number, ih: number) => {
    for (let z = -0.03; z > -id + 0.03; z -= 0.035 + e.r() * 0.02) e.k.box(p, iw - 0.03, ih * (0.7 + e.r() * 0.2), 0.012, [m.paper, m.blue, m.vacuum, m.green][(e.r() * 4) | 0], 0, (ih * 0.75) / 2, z, false)
  }
}

/** A drawer pedestal, 0.42 × 0.7 × 0.58: a pencil drawer, a box drawer and a file drawer (all operated). */
export function pedestal(e: Ctx, p: Object3D, label = 'Desk Drawer') {
  const { m } = e
  carcass(e, p, 0.42, 0.7, 0.58, m.hpl, [], 0.06)
  for (const [y, h] of [[0.625, 0.13], [0.47, 0.17], [0.235, 0.29]] as const) drawer(e, p, 0, y, 0, { w: 0.4, h, d: 0.55, front: m.hpl, handle: 'bar', label, fill: deskFill(e, h) })
}

/**
 * A counter as in the reference: a high white solid-surface front with a transaction ledge, the
 * 0.75 m work surface behind it, drawer pedestals under it at `pedestals` (operated), closed ends;
 * `len` along local x, the public side towards +z, staff at −z. With `low`, a length of the ledge
 * drops to 0.8 m for wheelchair users.
 */
export function counter(e: Ctx, p: Object3D, len: number, pedestals: number[], low?: [number, number]) {
  const { k, m } = e
  const ledge = (x0: number, x1: number, y: number) => {
    k.soft(p, x1 - x0, 0.04, 0.34, 0.015, m.solidSurface, (x0 + x1) / 2, y, 0.6)
    k.box(p, x1 - x0, y - 0.13, 0.05, m.solidSurface, (x0 + x1) / 2, 0.13 + (y - 0.13) / 2 - 0.02, 0.745)
  }
  if (low) {
    ledge(-len / 2, low[0], 1.1)
    k.box(p, low[1] - low[0], 0.63, 0.05, m.solidSurface, (low[0] + low[1]) / 2, 0.445, 0.745)
    k.soft(p, low[1] - low[0], 0.04, 0.4, 0.015, m.solidSurface, (low[0] + low[1]) / 2, 0.8, 0.6)
    ledge(low[1], len / 2, 1.1)
  } else ledge(-len / 2, len / 2, 1.1)
  k.box(p, len, 0.1, 0.03, m.skirting, 0, 0.05, 0.71)
  k.box(p, len, 0.006, 0.004, m.reveal, 0, 0.42, 0.771, false)
  // Under the ledge, a lit reveal along the front's top, as in the reference.
  k.box(p, len - 0.1, 0.008, 0.01, m.ledLine, 0, 1.065, 0.77, false)
  k.box(p, len - 0.04, 0.33, 0.03, m.hpl, 0, 0.93, 0.43)
  k.soft(p, len - 0.04, 0.03, 0.68, 0.01, m.solidSurface, 0, 0.75, 0.08)
  for (const s of [-1, 1]) k.soft(p, 0.06, 1.1, 0.92, 0.02, m.solidSurface, s * (len / 2 - 0.03), 0.55, 0.32)
  // Cable grommets in the work surface, a modesty panel between the pedestals.
  for (const x of pedestals) put(p, lathe(e, 'grommet', [[0.025, 0], [0.035, 0], [0.035, 0.006], [0.025, 0.006]], 16), m.darkPlastic, x + 0.4, 0.765, 0.3, false)
  k.box(p, len - 0.2, 0.5, 0.018, m.hpl, 0, 0.45, 0.38)
  for (const x of pedestals) pedestal(e, group(p, x, 0, -0.24, PI))
}

/** Ring binders and box files standing on a shelf, `w` along it, their spines facing +z. */
export function binders(e: Ctx, p: Object3D, w: number, y: number, z: number, d = 0.28) {
  const { k, m } = e
  const cols = [m.blue, m.red, m.greyPlastic, m.green, m.vacuum, m.whitePlastic]
  for (let x = -w / 2 + 0.03; x < w / 2 - 0.04; ) {
    const t = 0.05 + e.r() * 0.03
    const h = 0.29 + e.r() * 0.03
    k.box(p, t, h, d, cols[(e.r() * cols.length) | 0], x + t / 2, y + h / 2, z - d / 2)
    k.box(p, t * 0.5, 0.06, 0.003, m.paper, x + t / 2, y + h * 0.6, z + 0.0015, false)
    x += t + 0.004
  }
}

/** A run of base cupboards, `len` long and 0.72 high: pairs of doors (operated), a shelf inside with binders, a solid-surface top. */
export function credenza(e: Ctx, p: Object3D, len: number) {
  const { m } = e
  const n = Math.round(len / 1.2)
  const uw = len / n
  for (let i = 0; i < n; i++) {
    const u = group(p, -len / 2 + uw * (i + 0.5), 0, 0)
    carcass(e, u, uw, 0.78, 0.5, m.hpl, [0.42], 0.08, m.solidSurface)
    binders(e, u, uw - 0.06, 0.098, -0.04, 0.3)
    binders(e, u, uw - 0.06, 0.43, -0.04, 0.3)
    cupboardDoor(e, u, -uw / 2 + 0.002, 0.43, 0, { w: uw / 2 - 0.004, h: 0.68, hinge: 'left', face: m.hpl, label: 'Cupboard', angle: 1.6 })
    cupboardDoor(e, u, uw / 2 - 0.002, 0.43, 0, { w: uw / 2 - 0.004, h: 0.68, hinge: 'right', face: m.hpl, label: 'Cupboard', angle: 1.6 })
  }
}

/** Clinical supplies in clear-lidded bins and boxes, filling a shelf `w` wide and `d` deep at y. */
export function supplies(e: Ctx, p: Object3D, w: number, y: number, z: number, d: number, h = 0.2) {
  const { k, m } = e
  const kinds: [Material, number, number][] = [[m.blue, 0.12, 0.6], [m.whitePlastic, 0.18, 0.5], [m.binBlue, 0.22, 0.9], [m.paper, 0.1, 0.7], [m.purple, 0.12, 0.45], [m.binBlue, 0.3, 0.8]]
  for (let x = -w / 2 + 0.01; x < w / 2 - 0.1; ) {
    const [mat, bw, bh] = kinds[(e.r() * kinds.length) | 0]
    const ww = Math.min(bw, w / 2 - x - 0.01)
    if (ww < 0.06) break
    k.box(p, ww, h * bh, d * (0.7 + e.r() * 0.25), mat, x + ww / 2, y + (h * bh) / 2, z - d / 2)
    if (mat === m.binBlue) k.box(p, ww * 0.6, 0.04, 0.003, m.paper, x + ww / 2, y + h * bh * 0.55, z - 0.002 - d * 0.02, false)
    x += ww + 0.01
  }
}

/**
 * Clean-supply storage, `w` wide: drawers of dressings, syringes and cannulas under a worktop
 * (operated), and over it a glazed wall cupboard on shelves of supplies, its pair of glass doors
 * (operated).
 */
export function supplyUnit(e: Ctx, p: Object3D, w: number) {
  const { k, m } = e
  carcass(e, p, w, 0.9, 0.55, m.hpl, [], 0.1, m.solidSurface)
  const fill = packs(e, [m.whitePlastic, m.blue, m.paper, m.binBlue, m.purple], [0.09, 0.06, 0.14])
  for (let i = 0; i < 4; i++) drawer(e, p, 0, 0.8 - i * 0.2 - (i === 3 ? 0.0 : 0), 0, { w: w - 0.006, h: 0.195, d: 0.52, front: m.hpl, handle: 'bar', label: 'Supply Drawer', fill })
  // The wall cupboard over it: 0.38 deep, from 1.45 to 2.35.
  const up = group(p, 0, 1.45, -0.55 + 0.38)
  carcass(e, up, w, 0.9, 0.38, m.hpl, [0.3, 0.6], 0)
  for (const [y, h] of [[0.018, 0.27], [0.31, 0.27], [0.61, 0.26]] as const) supplies(e, up, w - 0.05, y, -0.015, 0.33, h)
  cupboardDoor(e, up, -w / 2 + 0.002, 0.45, 0, { w: w / 2 - 0.004, h: 0.88, hinge: 'left', face: m.aluminium, glass: true, label: 'Supply Cupboard', angle: 1.55 })
  cupboardDoor(e, up, w / 2 - 0.002, 0.45, 0, { w: w / 2 - 0.004, h: 0.88, hinge: 'right', face: m.aluminium, glass: true, label: 'Supply Cupboard', angle: 1.55 })
  k.box(p, w - 0.1, 0.015, 0.02, m.ledLine, 0, 1.44, -0.2, false)
}

/* ---------- the crash cart ---------- */

/** Ampoules standing in a tray, rows of them. */
function ampoules(e: Ctx) {
  const { m } = e
  return (p: Group, iw: number, id: number) => {
    e.k.box(p, iw - 0.01, 0.02, id - 0.02, m.whitePlastic, 0, 0.01, -id / 2, false)
    for (let x = -iw / 2 + 0.03; x < iw / 2 - 0.02; x += 0.03)
      for (let z = -0.04; z > -id + 0.04; z -= 0.06) e.k.cyl(p, 0.007, 0.007, 0.055, (x * 100) % 3 > 1.5 ? m.clearPlastic : m.amber, x, 0.047, z, 8)
  }
}

/** The airway drawer: a laryngoscope handle and blades, tubes in their packs, bag-valve-mask. */
function airway(e: Ctx) {
  const { k, m } = e
  return (p: Group, iw: number, id: number) => {
    k.cyl(p, 0.016, 0.016, 0.14, m.stainless, -iw / 2 + 0.06, 0.016, -0.12, 14).rotation.x = PI / 2
    for (let i = 0; i < 3; i++) k.box(p, 0.02, 0.008, 0.1 + i * 0.01, m.stainless, -iw / 2 + 0.11 + i * 0.03, 0.006, -0.12, false)
    for (let i = 0; i < 6; i++) k.box(p, 0.05, 0.012, 0.32, m.clearPlastic, -0.05 + i * 0.055, 0.008, -id / 2, false)
    put(p, pillow(e, 0.12, 0.1, 0.24), m.mask, iw / 2 - 0.09, 0.05, -id / 2)
  }
}

/**
 * A resuscitation (crash) cart, 0.76 × 1.0 × 0.52: red powder-coated body, a rimmed top, five
 * drawers with colour-coded labels and a breakaway seal (operated), the defibrillator on top, the
 * CPR board on its back, an oxygen cylinder at its side, the sharps bin, the push handle.
 */
export function crashCart(e: Ctx, p: Object3D, defibScreen: Material) {
  const { k, m } = e
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) castor(e, p, sx * 0.3, sz * 0.19, 0.05, 0, sz > 0)
  const c = group(p, 0, 0.11, 0.25)
  carcass(e, c, 0.76, 0.88, 0.5, m.red, [], 0)
  const labels = [m.blue, m.red, m.vacuum, m.green, m.whitePlastic]
  const fills = [ampoules(e), airway(e), packs(e, [m.whitePlastic, m.blue, m.vacuum], [0.07, 0.03, 0.12]), packs(e, [m.clearPlastic, m.paper], [0.14, 0.05, 0.22]), packs(e, [m.whitePlastic, m.greyPlastic], [0.16, 0.08, 0.2])]
  const hs = [0.13, 0.13, 0.17, 0.2, 0.2]
  let y = 0.86
  hs.forEach((h, i) => {
    y -= h + 0.005
    const d = drawer(e, c, 0, y + h / 2, 0, { w: 0.72, h, d: 0.46, front: m.red, handle: 'grip', label: 'Crash Cart Drawer', fill: fills[i] })
    e.k.box(d, 0.18, 0.035, 0.003, labels[i], -0.22, h / 2 - 0.035, 0.002, false)
  })
  // The breakaway seal across the drawers' edge, the rimmed top, the push handle.
  k.box(c, 0.012, 0.75, 0.012, m.vacuum, 0.37, 0.48, 0.008, false)
  put(c, panel(e, 0.82, 0.54, 0.04, 0.05, [[0.74, 0.46, 0, 0]]), m.greyPlastic, 0, 0.9, -0.25).rotation.x = -PI / 2
  k.box(c, 0.76, 0.012, 0.48, m.greyPlastic, 0, 0.888, -0.25)
  put(c, bentTube(e, 'cartHandle', [[-0.3, 0.92, -0.5], [-0.3, 1.05, -0.56], [0.3, 1.05, -0.56], [0.3, 0.92, -0.5]], 0.014, 0.04), m.stainless)
  k.box(c, 0.5, 0.6, 0.015, m.vacuum, 0, 1.2, -0.53)
  defibrillator(e, c, 0, 0.91, -0.22, defibScreen)
  // Oxygen at its side in a holder, the sharps bin, the glove box.
  const side = group(c, 0.42, 0.25, -0.25)
  cylinder(e, side, 0.11, 0.6, 'portable')
  k.box(c, 0.03, 0.06, 0.24, m.stainless, 0.395, 0.4, -0.25)
  k.box(c, 0.03, 0.06, 0.24, m.stainless, 0.395, 0.75, -0.25)
  k.box(c, 0.14, 0.2, 0.14, m.sharps, -0.46, 0.75, -0.25)
  k.box(c, 0.15, 0.03, 0.15, m.red, -0.46, 0.86, -0.25)
}

/**
 * A monitor-defibrillator: grey moulded case with its carry handle, the screen, the energy dial
 * and keys, the printer, and the paddles parked in their wells at the sides with their coiled leads.
 */
export function defibrillator(e: Ctx, p: Object3D, x: number, y: number, z: number, screen: Material) {
  const { k, m } = e
  const g = group(p, x, y, z)
  k.soft(g, 0.36, 0.26, 0.3, 0.035, m.charcoal, 0, 0.13, 0)
  put(g, bentTube(e, 'defibHandle', [[-0.13, 0.25, 0.02], [-0.11, 0.33, 0.02], [0.11, 0.33, 0.02], [0.13, 0.25, 0.02]], 0.014, 0.03), m.charcoal)
  face(e, g, 0.17, 0.12, screen, -0.06, 0.16, 0.151)
  k.box(g, 0.18, 0.13, 0.004, m.black, -0.06, 0.16, 0.149, false)
  put(g, lathe(e, 'defibDial', [[0, 0], [0.032, 0], [0.034, 0.02], [0.028, 0.03], [0, 0.03]], 24), m.greyPlastic, 0.1, 0.18, 0.15).rotation.x = PI / 2
  for (let i = 0; i < 3; i++) k.box(g, 0.035, 0.02, 0.01, [m.vacuum, m.red, m.greyPlastic][i], 0.06 + i * 0.04, 0.07, 0.152, false)
  k.box(g, 0.12, 0.006, 0.02, m.black, -0.06, 0.035, 0.152, false)
  for (const s of [-1, 1]) {
    const pad = group(g, s * 0.2, 0.1, 0.02)
    k.soft(pad, 0.05, 0.12, 0.14, 0.02, m.charcoal, 0, 0, 0)
    k.box(pad, 0.04, 0.02, 0.1, m.stainless, 0, -0.07, 0, false)
    k.cyl(pad, 0.015, 0.015, 0.06, m.vacuum, 0, 0.08, 0.03, 10)
  }
}

/* ---------- oxygen cylinders ---------- */

/**
 * A medical oxygen cylinder, radius r, `h` tall overall, as filled in India: black body, white
 * shoulder, the pin-index valve with its handwheel; standing on y = 0 of `p`. A cylinder `in use`
 * carries its regulator (contents gauge, flow selector and outlet); a `full` spare its plastic cap
 * and tag; a `portable` one its integral valve and guard.
 */
export function cylinder(e: Ctx, p: Object3D, r: number, h: number, kind: 'in use' | 'full' | 'portable') {
  const { k, m } = e
  const body = h * 0.86
  const shoulder = body - r * 0.9
  put(p, lathe(e, `cylBody${r}|${h}`, [[0, 0], [r * 0.7, 0], [r * 0.94, r * 0.12], [r, r * 0.35], [r, shoulder], [r * 0.97, shoulder + r * 0.25]], 32), m.cylinder)
  put(p, lathe(e, `cylShoulder${r}|${h}`, [[r * 0.97, shoulder + r * 0.25], [r * 0.82, shoulder + r * 0.6], [r * 0.5, body - r * 0.05], [r * 0.2, body], [0, body]], 32), m.whitePlastic)
  // Stamped neck ring and the valve.
  put(p, lathe(e, `cylNeck${r}`, [[0, 0], [r * 0.24, 0], [r * 0.24, r * 0.25], [0, r * 0.25]], 18), m.stainless, 0, body - 0.005)
  const vy = body + r * 0.25
  if (kind === 'full') {
    put(p, lathe(e, `cylCap${r}`, [[0, 0], [r * 0.5, 0], [r * 0.52, r * 0.6], [r * 0.4, r * 1.25], [0, r * 1.3]], 24), m.whitePlastic, 0, vy - 0.01)
    face(e, p, 0.06, 0.09, m.tagFull, 0, vy + r * 0.5, r * 0.53)
    return
  }
  k.box(p, r * 0.5, r * 0.7, r * 0.45, m.brass, 0, vy + r * 0.35, 0)
  put(p, lathe(e, 'handwheel', [[0, 0], [0.03, 0], [0.032, 0.01], [0.03, 0.02], [0, 0.02]], 16), m.black, 0, vy + r * 0.75, 0)
  if (kind === 'portable') {
    put(p, bentTube(e, `guard${r}`, [[-r * 0.6, vy, 0], [-r * 0.6, vy + r * 1.1, 0], [r * 0.6, vy + r * 1.1, 0], [r * 0.6, vy, 0]], 0.008, 0.02), m.stainless)
    face(e, p, 0.05, 0.075, m.tagInUse, 0, body * 0.6, r + 0.002)
    return
  }
  // The regulator on the pin-index yoke: body, contents gauge facing out, flow outlet and its knob.
  const reg = group(p, 0, vy + r * 0.35, r * 0.3)
  k.cyl(reg, 0.03, 0.03, 0.08, m.chrome, 0, 0, 0.04, 18).rotation.x = PI / 2
  const gz = put(reg, lathe(e, 'gaugeBezel', [[0, 0], [0.032, 0], [0.034, 0.012], [0.032, 0.02], [0, 0.02]], 24), m.chrome, 0, 0.05, 0.06)
  gz.rotation.x = PI / 2
  face(e, reg, 0.054, 0.054, m.cylinderGauge, 0, 0.05, 0.081)
  k.cyl(reg, 0.022, 0.022, 0.03, m.green, 0.05, -0.01, 0.06, 14).rotation.z = PI / 2
  k.cyl(reg, 0.008, 0.008, 0.04, m.chrome, 0, -0.05, 0.07, 10)
  face(e, p, 0.05, 0.075, m.tagInUse, 0, body * 0.6, r + 0.002)
}

/**
 * The department's cylinder store: a floor rack of galvanised steel holding four cylinders upright,
 * each behind its restraining chain, with its sign. Two large cylinders (one in use on a
 * regulator, one full and capped) and two portable ones.
 */
export function cylinderRack(e: Ctx, p: Object3D) {
  const { k, m } = e
  const w = 0.9
  const slots: [number, number, number, 'in use' | 'full' | 'portable'][] = [[-0.33, 0.115, 1.45, 'in use'], [-0.11, 0.115, 1.45, 'full'], [0.12, 0.065, 0.75, 'portable'], [0.3, 0.065, 0.75, 'portable']]
  put(p, bentTube(e, 'rackFrame', [[-w / 2, 0.0, 0.0], [-w / 2, 1.1, 0.0], [w / 2, 1.1, 0.0], [w / 2, 0.0, 0.0]], 0.016, 0.06), m.galvanised, 0, 0, -0.14)
  k.box(p, w, 0.03, 0.32, m.galvanised, 0, 0.015, 0)
  for (const y of [0.45, 1.0]) k.box(p, w, 0.04, 0.015, m.galvanised, 0, y, -0.14)
  for (const [x, r, h, kind] of slots) {
    const g = group(p, x, 0.03, 0)
    cylinder(e, g, r, h, kind)
    // The restraining chain, slung across the front, hooked each side.
    const y = Math.min(h * 0.65, 1.0)
    put(p, tube(e, `chain${r}|${y}`, [[-r - 0.02, y, -0.14], [-r * 0.8, y - 0.02, r * 0.9], [r * 0.8, y - 0.02, r * 0.9], [r + 0.02, y, -0.14]], 0.006), m.galvanised, x, 0.03, 0)
  }
  signPanel(e, p, 0.62, 0.2, m.oxygenSign, 0, 1.24, -0.13)
}

function signPanel(e: Ctx, p: Object3D, w: number, h: number, art: Material, x: number, y: number, z: number) {
  const g = group(p, x, y, z)
  e.k.box(g, w, h, 0.008, e.m.whitePlastic, 0, 0, 0, false)
  face(e, g, w - 0.004, h - 0.004, art, 0, 0, 0.0045)
}

/* ---------- examination couch ---------- */

/** A two-section examination couch, 1.9 × 0.62, its head raised a little, on a powder-coated frame with the paper roll. */
export function examCouch(e: Ctx, p: Object3D) {
  const { k, m } = e
  for (const s of [-1, 1]) put(p, bentTube(e, 'couchLeg', [[-0.82, 0.0, 0], [-0.82, 0.62, 0], [0.82, 0.62, 0], [0.82, 0.0, 0]], 0.02, 0.05), m.powder, 0, 0, s * 0.25)
  for (const x of [-0.82, 0.82]) rod(e, p, 0.016, 0.5, m.powder, x, 0.2, 0, 'z', 8)
  k.soft(p, 1.3, 0.08, 0.62, 0.03, m.vinylSeat, 0.28, 0.68, 0)
  const head = group(p, -0.37, 0.68, 0)
  head.rotation.z = -0.22
  k.soft(head, 0.6, 0.08, 0.62, 0.03, m.vinylSeat, -0.3, 0, 0)
  put(p, drape(e, 'couchPaper', 0.5, 1.88, 0.01), m.paper, 0.0, 0.725, 0).rotation.y = PI / 2
  rod(e, p, 0.045, 0.52, m.paper, -0.98, 0.66, 0, 'z', 18)
  for (const s of [-1, 1]) k.box(p, 0.03, 0.06, 0.012, m.powder, -0.98, 0.64, s * 0.27)
  // A step stool beside it.
  const st = group(p, 0.4, 0, 0.5)
  put(st, bentTube(e, 'step', [[-0.2, 0, 0], [-0.18, 0.22, 0], [0.18, 0.22, 0], [0.2, 0, 0]], 0.012, 0.03), m.chrome, 0, 0, -0.12)
  put(st, bentTube(e, 'step', [[-0.2, 0, 0], [-0.18, 0.22, 0], [0.18, 0.22, 0], [0.2, 0, 0]], 0.012, 0.03), m.chrome, 0, 0, 0.12)
  k.soft(st, 0.42, 0.03, 0.3, 0.01, m.black, 0, 0.235, 0)
}
