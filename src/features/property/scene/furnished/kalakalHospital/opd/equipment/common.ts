import { CylinderGeometry, MeshStandardMaterial, type Material, type Object3D } from 'three'
import { PI } from '../../../kit'
import { bentTube, geo, castor, cupboardDoor, carcass, face, group, lathe, put, rod } from '../../erKit'
import type { OpdCtx } from '../ctx'
import { board, NAVY } from '../paints'

/*
 * Fittings of the OPD's common rooms: sanitaryware and toilet cubicles, janitor's and riser
 * equipment, waiting-area pieces (water stations, token kiosks, benches), staff-room furniture,
 * waste and MRI-zone fittings. Each built in its own frame, front towards +z, standing on y = 0,
 * its back (where it has one) against a wall at z = 0.
 */

const std = (color: string, roughness = 0.5, metalness = 0) => new MeshStandardMaterial({ color, roughness, metalness })

const cache = new WeakMap<object, ReturnType<typeof make>>()
function make() {
  return {
    /** Compact-laminate cubicle partitions, warm grey; their aluminium head rail and feet. */
    partition: std('#c4beb2', 0.38),
    // No reflection map indoors: a pale, glossy, non-metallic face reads as a mirror where a metal one goes black.
    mirror: std('#c9d3d8', 0.06, 0.15),
    vitreous: std('#fbfbf9', 0.18),
    cork: std('#b98d5c', 0.9),
    steelGrey: std('#8e959a', 0.45, 0.5),
    rackBlack: std('#1d1f22', 0.5, 0.3),
    fabricTeal: std('#3f6f74', 0.92),
    fabricGrey: std('#6b6f73', 0.95),
    timber: std('#9a6b43', 0.55),
    mopYellow: std('#f1c40f', 0.5),
    hoseRed: std('#b3161b', 0.45),
    planter: std('#45494d', 0.6),
    leaf: std('#3d5f35', 0.7),
    envelope: std('#d9c18f', 0.8),
    fridge: std('#d9dcdd', 0.35, 0.3),
    dbDoor: std('#9aa1a6', 0.4, 0.4),
    lockerFront: std('#eef0ee', 0.4),
    shell: std('#5a6b74', 0.55),
  }
}
export function mats(e: OpdCtx) {
  let c = cache.get(e.o)
  if (!c) cache.set(e.o, (c = make()))
  return c
}

/* ---------- risers, janitor ---------- */

/** An electrical distribution board in its grey steel enclosure, its label. */
export function distributionBoard(e: OpdCtx, p: Object3D, w: number, h: number, label: string, y = 1.0) {
  const { k, m } = e
  const c = mats(e)
  k.box(p, w, h, 0.2, c.steelGrey, 0, y + h / 2, 0.1)
  k.box(p, w - 0.04, h - 0.04, 0.004, c.dbDoor, 0, y + h / 2, 0.202, false)
  k.box(p, 0.02, 0.1, 0.02, m.black, w / 2 - 0.05, y + h / 2, 0.21, false)
  face(e, p, Math.min(0.3, w - 0.1), 0.08, e.o.sign(`db_${label}`, 256, 64, board('#ffffff', [[label, 0.5, '#c8161d']], { border: '#c8161d' })), 0, y + h - 0.08, 0.205)
}

/** A cable ladder rising up the riser wall, cables in it. */
export function cableLadder(e: OpdCtx, p: Object3D, w: number, h: number) {
  const { k, m } = e
  for (const s of [-1, 1]) k.box(p, 0.03, h, 0.08, m.galvanised, s * w / 2, h / 2, 0.06)
  for (let y = 0.15; y < h; y += 0.3) k.box(p, w, 0.02, 0.03, m.galvanised, 0, y, 0.06, false)
  for (let i = 0; i < 5; i++) rod(e, p, 0.012, h, i % 2 ? m.black : m.darkPlastic, -w / 2 + 0.06 + i * ((w - 0.12) / 4), h / 2, 0.09, 'z').rotation.set(0, 0, 0)
}

/** A 42U network rack: black frame, a glazed front door that opens, patch panels and switches lit. */
export function networkRack(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const c = mats(e)
  carcass(e, p, 0.6, 2.0, 0.6, c.rackBlack, [], 0.06)
  for (let i = 0; i < 8; i++) {
    k.box(p, 0.48, 0.044, 0.3, i % 3 === 1 ? m.darkPlastic : m.black, 0, 1.2 + i * 0.06, -0.2, false)
    if (i % 3 === 1) for (let j = 0; j < 8; j++) k.box(p, 0.008, 0.006, 0.004, m.alarmBar, -0.2 + j * 0.05, 1.2 + i * 0.06 + 0.01, -0.048, false)
  }
  k.box(p, 0.48, 0.3, 0.45, m.darkPlastic, 0, 0.4, -0.28, false)
  cupboardDoor(e, p, -0.298, 1.03, 0, { w: 0.592, h: 1.92, hinge: 'left', face: c.rackBlack, glass: true, label: 'Network Rack', angle: 1.6 })
}

/** A low janitor's mop sink with its taps, and the mop bucket trolley with its wringer and mops. */
export function janitor(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const c = mats(e)
  k.box(p, 0.6, 0.3, 0.45, m.stainless, 0, 0.15, 0.225)
  k.box(p, 0.52, 0.01, 0.37, m.black, 0, 0.3, 0.23, false)
  for (const s of [-1, 1]) {
    k.cyl(p, 0.02, 0.02, 0.08, m.chrome, s * 0.12, 0.85, 0.04, 10).rotation.x = PI / 2
    k.cyl(p, 0.03, 0.03, 0.03, s < 0 ? m.red : m.blue, s * 0.12, 0.88, 0.07, 12)
  }
  rod(e, p, 0.012, 0.25, m.chrome, 0, 0.75, 0.13, 'z', 8)
  // The bucket trolley beside it, and mops in the corner.
  const t = group(p, 0.75, 0, 0.35)
  k.box(t, 0.55, 0.05, 0.38, c.mopYellow, 0, 0.1, 0)
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) castor(e, t, sx * 0.22, sz * 0.15, 0.035)
  k.box(t, 0.26, 0.3, 0.3, m.blue, -0.13, 0.28, 0)
  k.box(t, 0.26, 0.3, 0.3, m.red, 0.13, 0.28, 0)
  k.box(t, 0.14, 0.22, 0.2, c.mopYellow, 0.13, 0.52, 0)
  for (let i = 0; i < 2; i++) {
    const mop = group(p, 0.45 + i * 0.12, 0, 0.08)
    mop.rotation.z = 0.1 - i * 0.05
    rod(e, mop, 0.012, 1.35, m.aluminium, 0, 0.75, 0, 'z').rotation.set(0, 0, 0)
    k.box(mop, 0.12, 0.05, 0.4, m.paper, 0, 0.04, 0)
  }
}

/* ---------- fire ---------- */

/** A recessed fire hose reel cabinet, red, its glazed door showing the reel; the sign over it. */
export function hoseReel(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const c = mats(e)
  k.box(p, 0.8, 0.85, 0.06, c.hoseRed, 0, 1.15, 0.03)
  k.box(p, 0.7, 0.75, 0.004, e.o.screenGlass, 0, 1.15, 0.062, false)
  const reel = k.cyl(p, 0.27, 0.27, 0.05, c.hoseRed, 0, 1.18, 0.02, 24)
  reel.rotation.x = PI / 2
  k.cyl(p, 0.2, 0.2, 0.055, m.black, 0, 1.18, 0.02, 24).rotation.x = PI / 2
  face(e, p, 0.6, 0.15, e.o.sign('hoseSign', 400, 100, board('#c8161d', [['FIRE HOSE REEL', 0.5, '#ffffff']])), 0, 1.75, 0.005)
}

/** A pair of fire extinguishers (ABC powder and CO₂) on their wall brackets, with their sign. */
export function extinguishers(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const c = mats(e)
  for (const [x, r, h, co2] of [[-0.14, 0.075, 0.5, false], [0.14, 0.07, 0.6, true]] as const) {
    k.box(p, 0.12, 0.06, 0.04, m.stainless, x, 0.98, 0.02)
    k.cyl(p, r, r, h, c.hoseRed, x, 0.95 - h / 2 + 0.25, r + 0.04, 18)
    k.cyl(p, 0.025, 0.025, 0.08, m.black, x, 0.95 + 0.29, r + 0.04, 10)
    if (co2) k.cyl(p, 0.035, 0.02, 0.15, m.black, x + 0.06, 0.95, r + 0.08, 10)
  }
  face(e, p, 0.4, 0.15, e.o.sign('extSign', 400, 150, board('#c8161d', [['FIRE EXTINGUISHER', 0.34, '#ffffff'], ['ABC · CO₂', 0.26, '#ffffff', 500]])), 0, 1.55, 0.005)
}

/* ---------- waiting areas ---------- */

/** A wall-mounted alcohol hand-rub dispenser with its drip tray and the "Clean your hands" label. */
export function handRub(e: OpdCtx, p: Object3D, y = 1.2) {
  const { k, m } = e
  k.soft(p, 0.11, 0.24, 0.1, 0.02, m.whitePlastic, 0, y, 0.05)
  k.box(p, 0.06, 0.03, 0.03, m.blue, 0, y - 0.11, 0.09, false)
  k.box(p, 0.12, 0.012, 0.08, m.greyPlastic, 0, y - 0.3, 0.04, false)
  face(e, p, 0.18, 0.12, e.o.sign('handrub', 180, 120, board('#ffffff', [['CLEAN YOUR', 0.22, NAVY], ['HANDS', 0.3, '#1f9d55']])), 0, y + 0.25, 0.002)
}

/** A free-standing hand-sanitiser stand with its foot pedal. */
export function sanitiserStand(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  k.box(p, 0.3, 0.02, 0.3, m.stainless, 0, 0.01, 0)
  k.box(p, 0.06, 1.2, 0.04, m.stainless, 0, 0.62, -0.05)
  k.box(p, 0.12, 0.03, 0.18, m.black, 0, 0.04, 0.06)
  k.soft(p, 0.12, 0.25, 0.11, 0.02, m.whitePlastic, 0, 1.12, 0.0)
  face(e, p, 0.14, 0.2, e.o.sign('sanStand', 140, 200, board('#1f9d55', [['HAND', 0.18, '#ffffff'], ['SANITISER', 0.14, '#ffffff'], ['Press pedal', 0.1, '#e5f5ea', 500]])), 0, 0.85, 0.0)
}

/**
 * An RO drinking water station: a stainless cooler cabinet, two push taps over a drip tray, a
 * paper-cup dispenser beside, the sign over it.
 */
export function waterStation(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  k.box(p, 0.6, 1.15, 0.45, m.stainless, 0, 0.575, 0.225)
  k.box(p, 0.5, 0.25, 0.12, m.black, 0, 1.05, 0.36, false)
  for (const s of [-1, 1]) {
    k.box(p, 0.04, 0.06, 0.06, m.chrome, s * 0.12, 1.12, 0.43, false)
    k.cyl(p, 0.025, 0.025, 0.02, s < 0 ? m.blue : m.red, s * 0.12, 1.16, 0.43, 12)
  }
  k.box(p, 0.46, 0.02, 0.1, m.chrome, 0, 0.84, 0.42, false)
  k.cyl(p, 0.04, 0.04, 0.4, m.clearPlastic, 0.42, 1.25, 0.06, 14)
  face(e, p, 0.5, 0.18, e.o.sign('water', 400, 144, board('#1f6fd1', [['DRINKING WATER', 0.32, '#ffffff'], ['RO purified · chilled', 0.18, '#dbe9fb', 500]])), 0, 1.55, 0.004)
}

/** A token-issuing kiosk: a pedestal with its touch screen and the ticket slot. */
export function tokenKiosk(e: OpdCtx, p: Object3D, screen: Material) {
  const { k, m } = e
  k.soft(p, 0.42, 0.06, 0.36, 0.02, m.greyPlastic, 0, 0.03, 0)
  k.soft(p, 0.4, 1.1, 0.16, 0.03, m.whitePlastic, 0, 0.6, -0.06)
  const s = group(p, 0, 1.32, 0.02)
  s.rotation.x = -0.35
  k.soft(s, 0.42, 0.56, 0.08, 0.03, m.whitePlastic, 0, 0, 0)
  face(e, s, 0.34, 0.46, screen, 0, 0.02, 0.041)
  k.box(p, 0.14, 0.02, 0.06, m.darkPlastic, 0, 1.0, 0.04)
}

/** A timber-slatted backless bench on steel legs, `len` long. */
export function bench(e: OpdCtx, p: Object3D, len: number) {
  const { k, m } = e
  const c = mats(e)
  for (let i = 0; i < 5; i++) k.box(p, len, 0.035, 0.07, c.timber, 0, 0.44, -0.18 + i * 0.09)
  for (const s of [-1, 1]) {
    k.box(p, 0.05, 0.42, 0.42, m.powder, s * (len / 2 - 0.15), 0.21, 0)
  }
}

/** A square fibreglass planter with a low shrub (areca palm cut back), as a hospital keeps a few. */
export function planter(e: OpdCtx, p: Object3D) {
  const { k } = e
  const c = mats(e)
  // A fibreglass planter with a rolled lip, its soil top, and a snake plant (Sansevieria, the
  // usual hospital choice: no flowers, no pollen, little water): stiff sword leaves rising from the
  // soil, each a tapered, slightly twisted blade.
  k.soft(p, 0.42, 0.55, 0.42, 0.03, c.planter, 0, 0.275, 0)
  k.box(p, 0.46, 0.03, 0.46, c.planter, 0, 0.545, 0)
  k.box(p, 0.38, 0.01, 0.38, e.m.matting, 0, 0.535, 0, false)
  const blade = geo(e, 'sansLeaf', () => {
    const g = new CylinderGeometry(0.001, 0.028, 1, 6, 6)
    g.scale(1, 1, 0.25)
    const pos = g.getAttribute('position')
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) + 0.5
      const tw = y * 0.6
      const x = pos.getX(i)
      const z = pos.getZ(i)
      pos.setXYZ(i, x * Math.cos(tw) - z * Math.sin(tw), y, x * Math.sin(tw) + z * Math.cos(tw))
    }
    g.computeVertexNormals()
    return g
  })
  for (let i = 0; i < 11; i++) {
    const a = i * 2.39
    const r = 0.03 + (i % 4) * 0.025
    const h = 0.55 + ((i * 37) % 10) * 0.045
    const leaf = put(p, blade, c.leaf, Math.cos(a) * r, 0.54, Math.sin(a) * r)
    leaf.scale.set(1, h, 1)
    leaf.rotation.set(Math.sin(a) * 0.12, a, Math.cos(a) * 0.12)
  }
}

/** A free-standing floor directory totem: navy, the floor's departments and an arrow to each. */
export function totem(e: OpdCtx, p: Object3D, key: string, title: string, lines: string[]) {
  const { k, m } = e
  k.box(p, 0.55, 1.9, 0.12, e.o.navy, 0, 0.95, 0)
  k.box(p, 0.6, 0.04, 0.2, m.stainless, 0, 0.02, 0)
  const art = e.o.sign(`totem_${key}`, 300, 900, (g, w, h) => {
    g.fillStyle = NAVY
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#1f6fd1'
    g.fillRect(w * 0.1, h * 0.05, w * 0.12, h * 0.04)
    g.fillRect(w * 0.06, h * 0.063, w * 0.2, h * 0.014)
    g.fillStyle = '#ffffff'
    g.font = `700 ${w * 0.09}px Helvetica, Arial`
    g.textBaseline = 'middle'
    g.fillText(title.toUpperCase(), w * 0.32, h * 0.07)
    g.fillStyle = 'rgba(255,255,255,.3)'
    g.fillRect(w * 0.08, h * 0.12, w * 0.84, 2)
    lines.forEach((l, i) => {
      g.fillStyle = '#ffffff'
      g.font = `500 ${w * 0.07}px Helvetica, Arial`
      g.fillText(l, w * 0.08, h * (0.17 + i * 0.065))
    })
  })
  face(e, p, 0.5, 1.5, art, 0, 1.05, 0.061)
  face(e, p, 0.5, 1.5, art, 0, 1.05, -0.061).rotation.y = PI
}

/** A wall-mounted leaflet rack: clear acrylic pockets of patient information leaflets. */
export function leafletRack(e: OpdCtx, p: Object3D, y = 1.2) {
  const { k, m } = e
  k.box(p, 0.5, 0.7, 0.02, m.whitePlastic, 0, y, 0.01)
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 2; c++) {
      const x = -0.12 + c * 0.24
      const yy = y - 0.22 + r * 0.22
      k.box(p, 0.2, 0.18, 0.004, [m.blue, m.green, m.paper, m.purple, m.red, m.vacuum][r * 2 + c], x, yy + 0.02, 0.03, false)
      k.box(p, 0.22, 0.1, 0.04, m.clearPlastic, x, yy - 0.04, 0.035, false)
    }
}

/** A low side table, laminate on a steel frame, a few leaflets on it. */
export function sideTable(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  k.box(p, 0.55, 0.025, 0.55, e.o.oak, 0, 0.5, 0)
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.box(p, 0.03, 0.49, 0.03, m.powder, sx * 0.24, 0.245, sz * 0.24)
  for (let i = 0; i < 3; i++) k.box(p, 0.15, 0.003, 0.21, [m.paper, m.blue, m.green][i], -0.1 + i * 0.09, 0.515 + i * 0.003, 0.02, false).rotation.y = i * 0.2
}

/** An upholstered armchair (a nursing chair, a wide bariatric seat), w wide, wipe-clean vinyl or fabric. */
export function armchair(e: OpdCtx, p: Object3D, w = 0.7, cover?: Material) {
  const { k, m } = e
  const mat = cover ?? m.vinylSeat
  k.soft(p, w, 0.18, 0.62, 0.04, mat, 0, 0.36, 0.02)
  k.soft(p, w, 0.55, 0.16, 0.05, mat, 0, 0.72, -0.25)
  for (const s of [-1, 1]) k.soft(p, 0.12, 0.3, 0.62, 0.04, mat, s * (w / 2 + 0.04), 0.5, 0.0)
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.box(p, 0.04, 0.27, 0.04, m.powder, sx * (w / 2), 0.135, sz * 0.26)
}

/** A footstool, upholstered. */
export function footstool(e: OpdCtx, p: Object3D, cover?: Material) {
  e.k.soft(p, 0.42, 0.36, 0.34, 0.05, cover ?? e.m.vinylSeat, 0, 0.18, 0)
}

/* ---------- staff rooms ---------- */

/** A three-seater sofa in a wipe-clean fabric. */
export function sofa(e: OpdCtx, p: Object3D, len = 1.8) {
  const { k, m } = e
  const c = mats(e)
  k.soft(p, len, 0.2, 0.8, 0.04, c.fabricGrey, 0, 0.3, 0)
  k.soft(p, len, 0.45, 0.18, 0.06, c.fabricGrey, 0, 0.6, -0.31)
  for (const s of [-1, 1]) k.soft(p, 0.16, 0.36, 0.8, 0.05, c.fabricGrey, s * (len / 2 - 0.08), 0.4, 0)
  for (let i = 0; i < 3; i++) k.soft(p, len / 3 - 0.1, 0.12, 0.58, 0.05, c.fabricGrey, -len / 3 + (i * len) / 3, 0.44, 0.06)
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.box(p, 0.04, 0.2, 0.04, m.black, sx * (len / 2 - 0.08), 0.1, sz * 0.32)
}

/** A dining table (w × d) for staff, with `n` stacking chairs round it. */
export function diningSet(e: OpdCtx, p: Object3D, w: number, d: number, n = 4) {
  const { k, m } = e
  // A canteen table: a 25 mm laminate top with its rounded PVC edge on a powder-coated four-leg
  // frame with an apron rail.
  k.soft(p, w, 0.025, d, 0.008, m.solidSurface, 0, 0.737, 0)
  k.box(p, w - 0.12, 0.05, 0.02, m.powder, 0, 0.7, d / 2 - 0.07)
  k.box(p, w - 0.12, 0.05, 0.02, m.powder, 0, 0.7, -d / 2 + 0.07)
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    k.box(p, 0.04, 0.72, 0.04, m.powder, sx * (w / 2 - 0.06), 0.36, sz * (d / 2 - 0.06))
    k.cyl(p, 0.022, 0.022, 0.01, m.black, sx * (w / 2 - 0.06), 0.005, sz * (d / 2 - 0.06), 12)
  }
  const places: [number, number, number][] = n <= 4
    ? [[-w / 4, -d / 2 - 0.22, 0], [w / 4, -d / 2 - 0.22, 0], [-w / 4, d / 2 + 0.22, PI], [w / 4, d / 2 + 0.22, PI]]
    : [[-w / 3, -d / 2 - 0.22, 0], [0, -d / 2 - 0.22, 0], [w / 3, -d / 2 - 0.22, 0], [-w / 3, d / 2 + 0.22, PI], [0, d / 2 + 0.22, PI], [w / 3, d / 2 + 0.22, PI]]
  for (const [x, z, ry] of places.slice(0, n)) cafeChair(e, group(p, x, 0, z, ry + (x > 0 ? 0.08 : -0.06)))
}

/**
 * A canteen chair: a moulded polypropylene shell (seat and back in one, the back curving round)
 * on a four-leg tubular steel frame with plastic glides, as in staff rooms everywhere.
 */
export function cafeChair(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  const c = mats(e)
  // The frame: two inverted U legs, front and back pairs joined under the seat.
  for (const x of [0, 0.38]) put(p, bentTube(e, 'cafeLegs', [[-0.19, 0, 0.19], [-0.17, 0.43, 0.17], [-0.17, 0.43, -0.17], [-0.19, 0, -0.2]], 0.011, 0.04), m.chrome, x, 0, 0)
  for (const [x, z] of [[-0.19, 0.19], [0.19, 0.19], [-0.19, -0.2], [0.19, -0.2]]) k.cyl(p, 0.013, 0.013, 0.012, m.black, x, 0.006, z, 10)
  // The shell: the seat dished a little, the back rising from it with a lumbar curve.
  k.soft(p, 0.44, 0.03, 0.42, 0.014, c.shell, 0, 0.455, 0.0)
  const back = group(p, 0, 0.47, -0.2)
  back.rotation.x = -0.14
  put(back, bentTube(e, 'cafeBackEdge', [[-0.2, 0, 0.0], [-0.2, 0.36, -0.02], [0.2, 0.36, -0.02], [0.2, 0, 0.0]], 0.012, 0.06), c.shell, 0, 0, 0)
  k.soft(back, 0.42, 0.34, 0.022, 0.012, c.shell, 0, 0.19, -0.01)
  k.box(back, 0.12, 0.03, 0.004, m.black, 0, 0.28, -0.022, false)
}

/**
 * A kitchenette, `len` long: base cupboards (their doors open) under a worktop with a sink and
 * mixer, a microwave, an electric kettle, a water purifier on the wall; a domestic fridge at the
 * right-hand end if there is room.
 */
export function kitchenette(e: OpdCtx, p: Object3D, len: number) {
  const { k, m } = e
  const n = Math.max(1, Math.round(len / 0.6))
  const uw = len / n
  for (let i = 0; i < n; i++) {
    const u = group(p, -len / 2 + uw * (i + 0.5), 0, 0.6)
    carcass(e, u, uw, 0.86, 0.58, m.hpl, [0.45], 0.1)
    cupboardDoor(e, u, -uw / 2 + 0.002, 0.47, 0, { w: uw - 0.006, h: 0.74, hinge: i % 2 ? 'right' : 'left', face: m.hpl, label: 'Kitchen Cupboard', angle: 1.6 })
  }
  k.box(p, len + 0.02, 0.03, 0.62, m.solidSurface, 0, 0.885, 0.31)
  k.box(p, len, 0.5, 0.01, mats(e).vitreous, 0, 1.15, 0.005, false)
  // Sink and mixer at the left, microwave, kettle, mugs.
  k.box(p, 0.45, 0.01, 0.36, m.stainless, -len / 2 + 0.4, 0.903, 0.32, false)
  put(p, bentTube(e, 'kSwan', [[0, 0, 0], [0, 0.28, 0], [0, 0.3, 0.16], [0, 0.22, 0.18]], 0.011, 0.05), m.chrome, -len / 2 + 0.4, 0.9, 0.06, false)
  k.soft(p, 0.48, 0.28, 0.36, 0.02, m.black, len / 2 - 0.4, 1.04, 0.25)
  k.box(p, 0.3, 0.2, 0.004, m.darkPlastic, len / 2 - 0.45, 1.04, 0.432, false)
  k.cyl(p, 0.07, 0.08, 0.22, m.stainless, 0.05, 1.01, 0.3, 18)
  for (let i = 0; i < 3; i++) k.cyl(p, 0.04, 0.035, 0.09, [m.whitePlastic, m.blue, m.red][i], 0.25 + i * 0.1, 0.945, 0.35, 14)
  // The RO purifier on the wall over the sink.
  k.soft(p, 0.3, 0.45, 0.16, 0.03, m.whitePlastic, -len / 2 + 0.4, 1.65, 0.08)
  k.box(p, 0.12, 0.04, 0.004, m.blue, -len / 2 + 0.4, 1.7, 0.162, false)
}

/** A domestic double-door refrigerator (the staff's), its door seams and handles. */
export function fridge(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  k.soft(p, 0.6, 1.65, 0.65, 0.02, mats(e).fridge, 0, 0.825, 0.325)
  k.box(p, 0.6, 0.006, 0.006, m.darkPlastic, 0, 1.2, 0.652, false)
  for (const y of [1.45, 0.75]) k.box(p, 0.02, 0.3, 0.03, m.darkPlastic, -0.24, y, 0.67, false)
}

/** A cork notice board with pinned rosters and circulars. */
export function noticeBoard(e: OpdCtx, p: Object3D, w = 1.0, y = 1.5) {
  const { k, m } = e
  const c = mats(e)
  k.box(p, w + 0.04, 0.74, 0.02, m.aluminium, 0, y, 0.01)
  k.box(p, w, 0.7, 0.01, c.cork, 0, y, 0.022)
  for (let i = 0; i < 6; i++) {
    const x = -w / 2 + 0.12 + (i % 3) * (w / 3)
    const yy = y + (i < 3 ? 0.16 : -0.16)
    k.box(p, 0.21, 0.28, 0.002, i === 2 ? m.vacuum : m.paper, x, yy, 0.028, false).rotation.z = (i - 2.5) * 0.03
    k.cyl(p, 0.008, 0.008, 0.01, m.red, x, yy + 0.12, 0.032, 8).rotation.x = PI / 2
  }
}

/** Pigeonholes for report envelopes: a timber grid of `cols` × `rows`, envelopes in most. */
export function pigeonholes(e: OpdCtx, p: Object3D, cols: number, rows: number, y: number) {
  const { k, m } = e
  const cw = 0.26
  const rh = 0.14
  const w = cols * cw
  const h = rows * rh
  k.box(p, w, h, 0.01, e.o.oak, 0, y + h / 2, 0.005)
  for (let i = 0; i <= cols; i++) k.box(p, 0.015, h, 0.32, e.o.oak, -w / 2 + i * cw, y + h / 2, 0.16)
  for (let j = 0; j <= rows; j++) k.box(p, w, 0.015, 0.32, e.o.oak, 0, y + j * rh, 0.16)
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      if ((i * 7 + j * 3) % 5 === 0) continue
      const n = 1 + ((i + j) % 3)
      for (let q = 0; q < n; q++) k.box(p, cw - 0.05, 0.004, 0.24, q % 2 ? m.paper : mats(e).envelope, -w / 2 + (i + 0.5) * cw, y + j * rh + 0.012 + q * 0.006, 0.17, false)
    }
}

/* ---------- waste ---------- */

/** A 240-litre wheeled waste bin with its hinged lid, in the colour of its category, the label. */
export function wheelieBin(e: OpdCtx, p: Object3D, colour: Material, label: string) {
  const { k, m } = e
  // The body: an HDPE tub tapering to its foot (a four-sided turned shell, its sides flat),
  // 580 × 730 at the rim, 1.07 m high on its wheels.
  const body = put(p, geo(e, 'wbinBody', () => {
    const g = new CylinderGeometry(0.5, 0.42, 0.92, 4, 1, false)
    g.rotateY(PI / 4)
    g.scale(0.58 / 0.707, 1, 0.72 / 0.707)
    return g
  }), colour, 0, 0.52, 0)
  body.castShadow = true
  // The rim's thick lip, the handle bar across the back, reinforcing ribs down the front.
  for (const [w, d, x, z] of [[0.62, 0.04, 0, 0.36], [0.62, 0.04, 0, -0.36], [0.04, 0.72, 0.3, 0], [0.04, 0.72, -0.3, 0]] as const) k.box(p, w, 0.05, d, colour, x, 0.96, z)
  rod(e, p, 0.018, 0.56, m.darkPlastic, 0, 0.94, -0.42, 'x', 12)
  for (const s of [-1, 1]) k.box(p, 0.04, 0.06, 0.08, colour, s * 0.27, 0.94, -0.39)
  for (const x of [-0.16, 0.16]) k.box(p, 0.03, 0.62, 0.02, colour, x, 0.56, 0.33)
  // The lid on its hinge at the back, overhanging, its lifting lip at the front.
  k.soft(p, 0.63, 0.04, 0.8, 0.015, colour, 0, 1.005, -0.015)
  k.box(p, 0.3, 0.025, 0.03, colour, 0, 0.99, 0.39)
  // The axle and two 200 mm wheels at the back, the foot at the front.
  rod(e, p, 0.012, 0.62, m.galvanised, 0, 0.1, -0.3, 'x', 10)
  for (const s of [-1, 1]) {
    const w = put(p, lathe(e, 'wbinWheel', [[0.03, -0.025], [0.09, -0.025], [0.1, -0.015], [0.1, 0.015], [0.09, 0.025], [0.03, 0.025]], 20), m.rubber, s * 0.3, 0.1, -0.3)
    w.rotation.z = PI / 2
    k.cyl(p, 0.035, 0.035, 0.055, m.greyPlastic, s * 0.3, 0.1, -0.3, 14).rotation.z = PI / 2
  }
  k.box(p, 0.3, 0.06, 0.06, colour, 0, 0.03, 0.26)
  face(e, p, 0.32, 0.23, e.o.sign(`wbin_${label}`, 288, 208, (g, w, h) => {
    g.fillStyle = '#ffffff'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#111'
    g.font = `700 ${h * 0.16}px Helvetica`
    g.textAlign = 'center'
    g.fillText('BIOHAZARD', w / 2, h * 0.22)
    g.beginPath()
    g.arc(w / 2, h * 0.5, h * 0.13, 0, PI * 2)
    g.lineWidth = h * 0.04
    g.stroke()
    g.font = `700 ${h * 0.13}px Helvetica`
    g.fillText(label, w / 2, h * 0.86)
  }), 0, 0.72, 0.35).rotation.x = -0.045
}

/** A platform weighing scale for waste bags, its indicator on a post. */
export function platformScale(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  k.box(p, 0.6, 0.08, 0.6, m.stainless, 0, 0.04, 0)
  k.box(p, 0.04, 0.95, 0.04, m.stainless, 0, 0.55, -0.27)
  k.box(p, 0.24, 0.16, 0.08, m.darkPlastic, 0, 1.05, -0.26)
  k.box(p, 0.16, 0.06, 0.004, e.o.screen('wasteScale', 96, 32, (g, w, h) => {
    g.fillStyle = '#081208'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#ff4a2a'
    g.font = `700 ${h * 0.75}px Helvetica`
    g.fillText('12.40 kg', 4, h * 0.8)
  }, 1.0), 0, 1.07, -0.218, false)
}

/* ---------- MRI zone ---------- */

/** A ferromagnetic detection pillar at the MRI zone's door: slim, grey, its LED alert bar. */
export function detectorPillar(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  k.box(p, 0.3, 0.03, 0.3, m.greyPlastic, 0, 0.015, 0)
  k.soft(p, 0.14, 1.7, 0.14, 0.04, m.whitePlastic, 0, 0.88, 0)
  k.box(p, 0.03, 1.2, 0.004, m.alarmBar, 0, 0.95, 0.072, false)
  k.box(p, 0.1, 0.12, 0.004, e.o.sign('ferroLogo', 64, 80, board('#1f9d55', [['MR', 0.4, '#ffffff'], ['SAFE', 0.3, '#ffffff']])), 0, 1.6, 0.072, false)
}

/** Safety lockers for metal objects: a bank of small keyed compartments. */
export function keyLockers(e: OpdCtx, p: Object3D, cols = 2, rows = 4) {
  const { k, m } = e
  const w = cols * 0.3
  const h = rows * 0.32
  k.box(p, w, h, 0.4, e.o.frame, 0, 0.5 + h / 2, 0.2)
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const x = -w / 2 + (i + 0.5) * 0.3
      const y = 0.5 + (j + 0.5) * 0.32
      k.box(p, 0.28, 0.3, 0.006, mats(e).lockerFront, x, y, 0.402, false)
      k.box(p, 0.03, 0.05, 0.02, m.darkPlastic, x + 0.09, y, 0.41, false)
      k.cyl(p, 0.008, 0.008, 0.04, m.blue, x + 0.09, y - 0.04, 0.42, 6)
    }
}

/** A green "MR SAFE" floor marking: a rectangle of tape and its label, at floor level. */
export function mrSafeBay(e: OpdCtx, p: Object3D, w: number, d: number) {
  const { k, m } = e
  for (const s of [-1, 1]) {
    k.box(p, w, 0.003, 0.05, m.green, 0, 0.014, s * (d / 2 - 0.025), false)
    k.box(p, 0.05, 0.003, d, m.green, s * (w / 2 - 0.025), 0.014, 0, false)
  }
  const lbl = face(e, p, w * 0.7, 0.18, e.o.sign('mrSafeFloor', 256, 64, board('#1f9d55', [['MR SAFE ONLY', 0.5, '#ffffff']])), 0, 0.016, d / 2 - 0.18)
  lbl.rotation.x = -PI / 2
}

/** Re-exported for fitters. */
export { lathe }
