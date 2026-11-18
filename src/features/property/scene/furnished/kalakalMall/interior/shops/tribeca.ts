import { CircleGeometry, CylinderGeometry, ExtrudeGeometry, Group, MeshStandardMaterial, PlaneGeometry, Shape, SphereGeometry, TorusGeometry, Vector3, type Material, type Object3D } from 'three'
import { useInfoStore } from '../../../../../../../store/info'
import { circuit, setCircuit, switchPlate } from '../../../kalakalD65/fixtures'
import { clipped, type FloorCtx } from '../shell'
import type { Unit } from '../units'
import { button, info, live, play } from './cafe'
import { trackSpots } from './goods'
import { heelMaterials, HOUSE, type HeelMaterials } from './heelArt'
import { checkoutCard, LINE, shoeCard, specOf, type ModelKey } from './heelLine'
import { grid, heelPair, heelShoe, ribbon, type HeelSpec, type P3 } from './heels'
import { at, box, brandSign, clickThrough, flat, lamp, letters, mesh, onCircuit, openShop, pane, PI, rect, swingLeaf, type Shop } from './kit'

/*
 * TR/BECA, unit G-03: women's high heels, the third shop on the left of the west spine, 10.4 m
 * deep and 4.95 m wide. Built from the reference:
 *
 *   floor     big polished hexagons: cream marble, with grey stone veined in parallel streaks
 *   ceiling   left open and painted mid-grey: a spiral duct, a rectangular duct, sprinkler mains
 *             and a cable tray, black lighting tracks of spots, and a great white halo ring with
 *             a line of light round its foot
 *   domes     the house's display: a hemispherical shell of warm cream panels on champagne ribs,
 *             open at the front; inside, curved cream shelves one above the other, each lit
 *             along its edge, the heels laid along them in profile, the name in the dome's crown.
 *             The great dome fills the back of the shop; a smaller one stands on the right wall
 *   sculpture two great stilettos of rust-lacquered ply, slotted together egg-crate fashion: one
 *             down the middle of the shop, a smaller one in the window
 *   counter   the curved glass counter on the right by the door: a lit vitrine of heels behind its
 *             curved front, featured pairs on its glass top, the till and the cabinet of drawers
 *             behind, on the staff side
 *   seating   two square taupe ottomans to try on at, and a full-length mirror on the wall beside them
 *
 * Every shoe explains itself (style, heel, leather, colourways, sizes, price), turns in the card to
 * be looked at closely and goes into the bag in a size; the featured pairs on the counter lift and
 * turn; the counter takes the bag through; the drawers and the stock cupboard open; the entrance
 * doors open; two switches by the door work the lights and the display lighting.
 */

/** The room: the shopfront, the back wall's face, the party walls' faces. */
const FX = -6.6
const BACK = -16.2
const ZL = -6.075
const ZR = -11.025
const ZC = (ZL + ZR) / 2

/** The great dome at the back (opens to the front) and the small dome on the right wall (opens to the room). */
const BD = { R: 2.1, yc: 1.2, x: BACK + 2.18, z: ZC, yaw: PI / 2, A: 1.75 }
const SD = { R: 1.55, yc: 0.95, x: -11.0, z: ZR + 1.63, yaw: 0, A: 1.72 }
/** The counter: an arc about (cx, cz), outer and inner radii, from a0 to a1 (x = cx + r sin a, z = cz + r cos a). */
const CT = { cx: -7.85, cz: -12.4, ro: 2.7, ri: 2.15, a0: -0.36, a1: 0.38 }

/** An annular sector, r0…r1 by a0…a1 (x = r sin a, z = r cos a), from y0 to y1. */
function sector(r0: number, r1: number, a0: number, a1: number, y0: number, y1: number, seg = 48) {
  const s = new Shape()
  const pt = (r: number, a: number): [number, number] => [r * Math.sin(a), r * Math.cos(a)]
  s.moveTo(...pt(r1, a0))
  for (let i = 1; i <= seg; i++) s.lineTo(...pt(r1, a0 + ((a1 - a0) * i) / seg))
  if (r0 > 0.001) for (let i = seg; i >= 0; i--) s.lineTo(...pt(r0, a0 + ((a1 - a0) * i) / seg))
  else s.lineTo(0, 0)
  s.closePath()
  const g = new ExtrudeGeometry(s, { depth: y1 - y0, bevelEnabled: false, curveSegments: 4 })
  g.rotateX(PI / 2)
  g.translate(0, y1, 0)
  return g
}

export function buildTribeca(e: FloorCtx, u: Unit) {
  const s = openShop(e, u)
  const { k, lux } = e
  const { g, y: Y } = s
  const hm = heelMaterials(e)
  const soffit = e.soffit

  // Two circuits: the boutique's lights, and its display lighting (the domes, the halo, the vitrine).
  const display = circuit()
  const glowOf = (mat: MeshStandardMaterial) => {
    const n = mat.clone()
    n.userData.interior = true
    display.glows.push(n)
    return n
  }
  const led = glowOf(lux.led as MeshStandardMaterial)
  const domeIn = glowOf(hm.domeIn as MeshStandardMaterial)
  const under = glowOf(s.m.backlit('#fff0da', 0.5))
  const spot = onCircuit(s, lux.led as MeshStandardMaterial)

  /* ---------- the shoes ---------- */
  const inspectOf = (spec: HeelSpec) => () => {
    const p = new Group()
    heelPair(hm.kit, p, spec, 'hi', 0.12)
    return p
  }
  /** One shoe of a model in a colourway, centred on its length at (x, y, z), toe along yaw. */
  const single = (par: Object3D, key: ModelKey, way: number, x: number, y: number, z: number, yaw: number, right = false) => {
    const model = LINE[key]
    const w = model.ways[way % model.ways.length]
    const spec = specOf(hm, model, w)
    const holder = at(par, x, y, z, yaw)
    const shoe = heelShoe(hm.kit, holder, spec, 'lo', right)
    shoe.position.z = -(shoe.userData.len as number) / 2
    info(s, holder, shoeCard(model, w, inspectOf(spec)), 0.004)
    return holder
  }
  /** A pair, shown as a pair. */
  const pair = (par: Object3D, key: ModelKey, way: number, x: number, y: number, z: number, yaw: number, featured = false) => {
    const model = LINE[key]
    const w = model.ways[way % model.ways.length]
    const spec = specOf(hm, model, w)
    const holder = featured ? live(par, `feature_${key}_${way}`, 'tribeca') : new Group()
    if (!featured) par.add(holder)
    holder.position.set(x, y, z)
    holder.rotation.y = yaw
    heelPair(hm.kit, holder, spec, 'lo', 0.12)
    const hit = info(s, holder, shoeCard(model, w, inspectOf(spec), featured), 0.004)
    if (hit && featured) {
      const base = holder.position.y
      const yaw0 = holder.rotation.y
      hit.userData.onTap = () =>
        play({
          dur: 3.4,
          step: (t) => {
            holder.position.y = base + Math.sin(Math.min(1, t * 1.2) * PI) * 0.07
            holder.rotation.y = yaw0 + 2 * PI * (t < 0.1 ? 0 : t > 0.9 ? 1 : (t - 0.1) / 0.8) ** 1.2
          },
          done: () => {
            holder.position.y = base
            holder.rotation.y = yaw0
          },
        }, holder)
    }
    return holder
  }

  /* ---------- floor, walls, the open ceiling ---------- */
  flat(g, clipped(e, u.rects[0]), Y + 0.006, hm.floor, false, [], 'tribeca_floor')
  box(s, BACK - 0.1, BACK, Y, soffit, ZR - 0.075, ZL + 0.075, hm.wall)
  box(s, BACK, FX - 0.3, Y, soffit, ZL - 0.02, ZL, hm.wall)
  box(s, BACK, FX - 0.3, Y, soffit, ZR, ZR + 0.02, hm.wall)
  for (const [x0, z0, x1, z1] of [[BACK, ZL, FX - 0.3, ZL], [FX - 0.3, ZR, BACK, ZR], [BACK, ZR, BACK, ZL]] as const) e.shade.foot(x0, z0, x1, z1, Y + 0.01, 0.22, 0.3)
  flat(g, rect(BACK, FX, ZR - 0.075, ZL + 0.075), soffit - 0.004, hm.ceiling, true, [], 'tribeca_ceiling')
  {
    const top = soffit - Y
    // The spiral duct down the left, its joints every 1.5 m, round diffusers dropping from it.
    const dz = ZL - 0.62
    const duct = mesh(g, new CylinderGeometry(0.225, 0.225, FX - 0.4 - (BACK + 0.2), 28, 1, true), hm.duct, (FX - 0.4 + BACK + 0.2) / 2, Y + top - 0.42, dz)
    duct.rotation.z = PI / 2
    for (let x = BACK + 0.6; x < FX - 0.5; x += 1.5) {
      const j = mesh(g, new TorusGeometry(0.228, 0.012, 6, 28), hm.duct, x, Y + top - 0.42, dz)
      j.rotation.y = PI / 2
    }
    for (const x of [-8.6, -12.2, -15.2]) {
      k.cyl(g, 0.11, 0.11, 0.22, hm.duct, x, Y + top - 0.72, dz, 20)
      k.cyl(g, 0.17, 0.17, 0.03, hm.ductDark, x, Y + top - 0.84, dz, 24)
    }
    // A rectangular duct down the right with its grilles; the sprinkler mains and the cable tray.
    k.box(g, FX - 0.5 - BACK, 0.34, 0.7, hm.duct, (FX - 0.5 + BACK) / 2, Y + top - 0.27, ZR + 0.55)
    for (const x of [-8.2, -10.6, -13.0, -15.2]) k.box(g, 0.5, 0.012, 0.3, hm.ductDark, x, Y + top - 0.446, ZR + 0.55, false)
    for (const z of [ZC - 0.35, ZC + 0.6]) {
      const pipe = mesh(g, new CylinderGeometry(0.03, 0.03, FX - 0.5 - BACK, 10), hm.ductDark, (FX - 0.5 + BACK) / 2, Y + top - 0.14, z, false)
      pipe.rotation.z = PI / 2
      for (let x = BACK + 1.2; x < FX - 0.6; x += 3) {
        k.cyl(g, 0.012, 0.012, 0.22, hm.ductDark, x, Y + top - 0.26, z, 8)
        k.cyl(g, 0.03, 0.02, 0.025, lux.steel, x, Y + top - 0.38, z, 10)
      }
    }
    k.box(g, FX - 0.5 - BACK, 0.06, 0.3, hm.cableTray, (FX - 0.5 + BACK) / 2, Y + top - 0.24, ZC - 0.95, false)
    // Black tracks of spots hung on rods, aimed at the domes, the sculpture and the counter.
    for (const [z, aim] of [[ZC + 1.25, PI], [ZC - 1.0, 0]] as const) {
      trackSpots(s, g, FX - 0.7, z, BACK + 2.6, z, Y + 3.95, 7, spot, aim, 0.75)
      for (const x of [FX - 1.2, -11.4, BACK + 3.2]) k.cyl(g, 0.006, 0.006, top - 3.95, hm.blackTrack, x, Y + 3.95 + (top - 3.95) / 2, z, 6)
    }
    // The halo: a white ring 4.4 m across with a line of light round its foot, hung on rods.
    const hx = -11.2
    const hy = Y + 3.9
    mesh(g, new CylinderGeometry(2.2, 2.2, 0.22, 96, 1, true), hm.ring, hx, hy, ZC, false)
    mesh(g, new CylinderGeometry(1.94, 1.94, 0.22, 96, 1, true), hm.ring, hx, hy, ZC, false)
    flat(g, ringPoly(hx, ZC, 2.19, 1.95), hy - 0.112, hm.ring, true, [], 'tribeca_halo_foot')
    flat(g, ringPoly(hx, ZC, 2.16, 2.12), hy - 0.115, led, true, [], 'tribeca_halo_led')
    flat(g, ringPoly(hx, ZC, 2.19, 1.95), hy + 0.11, hm.ring, false, [], 'tribeca_halo_top')
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * PI * 2 + 0.3
      k.cyl(g, 0.005, 0.005, top - 4.01, hm.blackTrack, hx + Math.cos(a) * 2.07, Y + 4.01 + (top - 4.01) / 2, ZC + Math.sin(a) * 2.07, 6)
    }
  }

  /* ---------- the shopfront on x = −6.6, z −11.1 … −6.0, the doors at z −9.65 … −7.45 ---------- */
  {
    box(s, FX - 0.075, FX + 0.075, Y + 4.2, soffit, -11.1, -6.0, e.m.wallPaint)
    const F0 = FX - 0.3
    const F1 = FX + 0.05
    // A travertine fascia and pilasters, the name in thin champagne letters, lit.
    k.box(g, F1 - F0, 0.9, 5.1, hm.travertine, (F0 + F1) / 2, Y + 3.3 + 0.45, ZC)
    for (const [a, b] of [[-11.1, -10.76], [-6.36, -6.02]]) k.box(g, F1 - F0, 3.3, b - a, hm.travertine, (F0 + F1) / 2, Y + 1.65, (a + b) / 2)
    box(s, F0, F1, Y + 4.19, Y + 4.2, -11.1, -6.0, hm.champagne, false)
    brandSign(s, g, letters(s, HOUSE, 'light', '#e9d9b8', 512, 128), 2.0, 0.5, F1 + 0.004, Y + 3.75, ZC, PI / 2)
    const frame = hm.champagne
    box(s, FX - 0.04, FX + 0.04, Y + 3.24, Y + 3.3, -10.76, -6.36, frame)
    box(s, FX - 0.03, FX + 0.03, Y, Y + 0.02, -10.76, -6.36, frame, false)
    for (const z of [-10.73, -9.68, -7.42, -6.39]) box(s, FX - 0.04, FX + 0.04, Y, Y + 3.24, z - 0.025, z + 0.025, frame)
    box(s, FX - 0.04, FX + 0.04, Y + 2.62, Y + 2.68, -9.68, -7.42, frame)
    box(s, FX - 0.15, FX + 0.15, Y, Y + 0.008, -9.65, -7.45, hm.champagne, false)
    pane(s, g, FX, -10.7, FX, -9.71, Y + 0.02, Y + 3.24)
    pane(s, g, FX, -7.39, FX, -6.42, Y + 0.02, Y + 3.24)
    pane(s, g, FX, -9.65, FX, -7.45, Y + 2.68, Y + 3.24)
    swingLeaf(s, at(g, FX, Y, -9.65, -PI / 2), 'tribeca_r', 1.09, 2.6, frame, -PI / 2, true)
    swingLeaf(s, at(g, FX, Y, -7.45, PI / 2), 'tribeca_l', 1.09, 2.6, frame, PI / 2, true)
    e.shade.foot(FX + 0.06, -11.1, FX + 0.06, -6.0, Y + 0.01, 0.2, 0.25)
  }

  /* ---------- the domes ---------- */
  buildDome(s, hm, g, 'great', BD, domeIn, led, under, [0.45, 0.81, 1.17, 1.53, 1.89, 2.25], 0.28, (tier) => GREAT[tier], single)
  buildDome(s, hm, g, 'side', SD, domeIn, led, under, [0.42, 0.76, 1.1, 1.44, 1.78], 0.26, (tier) => SIDE[tier], single)
  {
    // The name in the great dome's crown, over the top shelf, tilted to the curve: painted on in thin
    // bronze capitals (not lit; it reads by the dome's own light).
    const yr = 2.74 - BD.yc
    const rr = Math.sqrt(BD.R * BD.R - yr * yr) - 0.03
    const d = at(g, BD.x, Y, BD.z, BD.yaw)
    const tilt = new Group()
    // Stood 10 cm off the shell, so its ends clear the curve behind them.
    tilt.position.set(0, 2.74, -rr + 0.1)
    tilt.rotation.x = Math.atan2(yr, rr)
    d.add(tilt)
    const signTex = hm.canvas(1024, 256, (c, w, h) => {
      c.clearRect(0, 0, w, h)
      c.fillStyle = '#4c3d2c'
      c.textAlign = 'center'
      c.textBaseline = 'middle'
      const cs = c as CanvasRenderingContext2D & { letterSpacing: string }
      let size = h * 0.62
      for (;;) {
        c.font = `300 ${size}px "Inter", "Helvetica Neue", Arial, sans-serif`
        cs.letterSpacing = `${Math.round(size * 0.22)}px`
        if (c.measureText(HOUSE).width <= w * 0.92 || size < 20) break
        size *= 0.94
      }
      c.fillText(HOUSE, w / 2 + size * 0.11, h / 2)
    })
    mesh(tilt, new PlaneGeometry(1.0, 0.25), hm.std({ map: signTex, transparent: true, roughness: 0.6 }, 0.1), 0, 0, 0.004, false)
    info(s, tilt, { title: 'The Great Dome', kind: `${HOUSE} · Display`, body: 'The house\'s signature display: a hemispherical shell of cream panels on champagne steel ribs, 4.2 m across, open to the shop. Six curved shelves inside, each lit along its edge, hold the collection in profile, from day pumps at the foot to the evening and bridal lines above.', specs: ['Lacquered panels on brushed champagne ribs', 'LED lines under every shelf, 2700 K', 'Tap any shoe for its story, sizes and price'] }, 0)
  }

  /* ---------- the sculptures ---------- */
  {
    const big = at(g, -12.42, Y, -7.2, PI / 2)
    sculpture(s, hm, big, 1)
    e.shade.rect(-11.2, Y + 0.012, -7.2, 2.5, 0.85, 0, 0.32)
    info(s, big.children[0], { title: 'The Stiletto', kind: 'Installation', body: 'A stiletto 2.4 m long and nearly 2 m high at the heel, cut from birch ply and slotted together like an egg crate, lacquered in the house\'s rust red: the shop\'s landmark, and a favourite for photographs.', specs: ['Birch ply, CNC-cut, hand-lacquered', '2.4 × 0.75 × 1.95 m'] }, 0)
    const small = at(g, -8.95, Y, -6.76, PI / 2 + 0.12)
    sculpture(s, hm, small, 0.62)
    e.shade.rect(-8.2, Y + 0.012, -6.76, 1.6, 0.55, 0.12, 0.3)
    // A pair on the floor before its toe, as in a window.
    pair(small, 'aurelia', 2, 0, 0, 1.7, 0.45)
  }

  /* ---------- the counter ---------- */
  buildCounter(s, hm, g, led, pair, single)

  /* ---------- try-on: ottomans, the mirror ---------- */
  for (const [x, z] of [[-8.95, -8.6], [-8.95, -7.93]] as const) {
    const o = at(g, x, Y, z, 0)
    k.soft(o, 0.62, 0.34, 0.62, 0.04, hm.taupeDark, 0, 0.19, 0)
    k.soft(o, 0.6, 0.1, 0.6, 0.045, hm.taupe, 0, 0.405, 0)
    k.box(o, 0.56, 0.02, 0.56, hm.blackMatte, 0, 0.01, 0, false)
    e.shade.rect(x, Y + 0.012, z, 0.66, 0.66, 0, 0.4)
    info(s, o.children[1], {
      title: 'Try-on Ottoman', kind: 'Seating', body: 'Sit down to try a pair: an associate brings your size from the stockroom with a shoehorn and a pair of try-on socks, and the mirror is beside you.', specs: ['Taupe wool upholstery, piped', '62 × 62 × 46 cm'],
      action: { label: 'Ask for an associate', run: () => 'An associate is on the way with a shoehorn and try-on socks.' },
    }, 0)
  }
  {
    // The full-length mirror on the left wall, framed in champagne, its foot near the floor to see the shoes.
    const mx = -9.6
    const mirror = at(g, mx, Y, ZL - 0.002, PI)
    k.box(mirror, 0.6, 1.9, 0.03, hm.champagne, 0, 0.1 + 0.95, 0.015)
    const glassM = k.box(mirror, 0.54, 1.84, 0.006, hm.mirror, 0, 0.1 + 0.95, 0.033, false)
    info(s, glassM, { title: 'Mirror', kind: 'Full-length mirror', body: 'A full-length mirror beside the ottomans, hung low so the shoes are seen with the whole leg.', specs: ['Silvered glass in a brushed champagne frame', '54 × 184 cm'] }, 0.01)
  }

  /* ---------- the stock cupboard on the right wall ---------- */
  {
    const x0 = -13.55
    const x1 = -12.68
    const d = 0.42
    const cz = ZR + d / 2
    k.box(g, x1 - x0, 2.42, d, hm.counterCream, (x0 + x1) / 2, Y + 1.21, cz)
    const cap = k.box(g, x1 - x0 + 0.04, 0.04, d + 0.02, hm.champagne, (x0 + x1) / 2, Y + 2.44, ZR + (d + 0.02) / 2)
    // Inside (hidden till the doors open): shelves of boxes, the house's in cream and black.
    const shelvesY = [0.12, 0.6, 1.08, 1.56, 2.0]
    for (const sy of shelvesY) k.box(g, x1 - x0 - 0.04, 0.018, d - 0.04, hm.shelf, (x0 + x1) / 2, Y + sy, ZR + d / 2 - 0.01, false)
    shelvesY.slice(0, 4).forEach((sy, j) => {
      for (let q = 0; q < 2; q++)
        for (let h = 0; h < 3; h++) {
          const dark = (q + j + h) % 3 === 0
          const bx = (x0 + x1) / 2 - 0.2 + q * 0.4
          k.box(g, 0.34, 0.12, 0.3, dark ? hm.boxSideDark : hm.boxSide, bx, Y + sy + 0.07 + h * 0.125, ZR + 0.2, false)
          k.box(g, 0.345, 0.004, 0.305, dark ? hm.boxBlack : hm.boxLid, bx, Y + sy + 0.131 + h * 0.125, ZR + 0.2, false)
        }
    })
    for (const side of [-1, 1] as const) {
      const hinge = at(g, side < 0 ? x0 + 0.01 : x1 - 0.01, Y + 0.04, ZR + d + 0.005, 0)
      const leaf = new Group()
      leaf.name = `door_tribeca_stock_${side < 0 ? 'l' : 'r'}`
      leaf.userData.label = 'Stock cupboard'
      leaf.userData.openAngle = side < 0 ? -1.75 : 1.75
      hinge.add(leaf)
      const lw = (x1 - x0) / 2 - 0.012
      const front = k.soft(leaf, lw, 2.34, 0.022, 0.004, hm.counterCream, side < 0 ? lw / 2 : -lw / 2, 1.17, 0.011)
      front.userData.front = true
      k.box(leaf, 0.012, 0.5, 0.02, hm.champagne, side < 0 ? lw - 0.05 : -(lw - 0.05), 1.1, 0.03)
    }
    // The doors' front, so the cupboard reads shut: a closing panel just behind them.
    k.box(g, x1 - x0 - 0.02, 2.36, 0.006, hm.boxSide, (x0 + x1) / 2, Y + 1.21, ZR + 0.03, false)
    e.shade.rect((x0 + x1) / 2, Y + 0.012, cz, x1 - x0 + 0.06, d + 0.06, 0, 0.35)
    info(s, cap, { title: 'Stock Cupboard', kind: 'Storage', body: 'The day\'s stock close at hand: the sizes most asked for, boxed, so a pair can be brought out without a trip to the stockroom. Tap a door to open it.', specs: ['Lacquered doors on soft-close hinges', 'Boxes with dust bags and tissue'] }, 0)
  }

  /* ---------- lighting and its switches ---------- */
  lamp(s, -8.4, Y + 3.6, ZC, 9, 8)
  lamp(s, -11.2, Y + 3.5, ZC + 0.6, 9, 8)
  lamp(s, BD.x + 1.0, Y + 2.9, BD.z, 8, 6, '#ffe6c4')
  lamp(s, SD.x, Y + 1.9, SD.z + 0.4, 5, 4, '#ffe6c4')
  {
    const sw = new Group()
    sw.position.set(-7.05, Y + 1.2, ZL - 0.001)
    sw.rotation.y = PI
    g.add(sw)
    const plate = switchPlate(k, sw, 'tribeca', ['switch', 'switch'], { plate: hm.champagne, rocker: hm.champagne, dark: hm.blackMatte, locator: lux.ledCool as MeshStandardMaterial }, [s.circuit, display])
    plate.traverse((o) => {
      if (o.name === 'switch_tribeca_0') o.userData.label = 'Boutique lights'
      if (o.name === 'switch_tribeca_1') o.userData.label = 'Domes, halo & vitrine lighting'
    })
    setCircuit(s.circuit, true)
    setCircuit(display, true)
  }
  return s
}

/** A ring as a plan polygon with its hole (outer then inner, reversed), for a flat annulus. */
function ringPoly(cx: number, cz: number, ro: number, ri: number): [number, number][] {
  const n = 96
  const out: [number, number][] = []
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * PI * 2
    out.push([cx + Math.cos(a) * ro, cz + Math.sin(a) * ro])
  }
  for (let i = n; i >= 0; i--) {
    const a = (i / n) * PI * 2
    out.push([cx + Math.cos(a) * ri, cz + Math.sin(a) * ri])
  }
  return out
}

/* ---------- what each dome's shelves hold, foot to crown: [model, colourway] ---------- */

type Slot = [ModelKey, number]
const GREAT: Slot[][] = [
  [['ines', 0], ['aurelia', 0], ['isadora', 0], ['opaline', 0], ['celeste', 0], ['ines', 2], ['tamsin', 1], ['isadora', 1]],
  [['aurelia', 1], ['calla', 1], ['juno', 0], ['elodie', 1], ['lucienne', 0], ['ottilie', 1], ['ines', 1], ['opaline', 1]],
  [['delphine', 0], ['lys', 0], ['valencia', 0], ['rosalind', 1], ['calla', 0], ['juno', 1], ['celeste', 1], ['elodie', 0]],
  [['mira', 0], ['vesper', 0], ['bianca', 1], ['lys', 1], ['valencia', 1], ['delphine', 1], ['mira', 1]],
  [['noor', 0], ['seraphine', 0], ['rosalind', 0], ['noor', 1], ['vesper', 1], ['bianca', 0], ['celeste', 2]],
  [['aurelia', 0], ['ottilie', 0], ['lucienne', 1], ['juno', 1], ['tamsin', 0]],
]
const SIDE: Slot[][] = [
  [['marguerite', 0], ['sienna', 0], ['marguerite', 2], ['sienna', 1], ['isadora', 2]],
  [['marguerite', 1], ['tamsin', 0], ['ottilie', 1], ['celeste', 1], ['lucienne', 0]],
  [['opaline', 0], ['elodie', 0], ['aurelia', 2], ['ines', 1], ['calla', 1]],
  [['rosalind', 0], ['lys', 1], ['delphine', 1], ['juno', 0]],
  [['noor', 1], ['seraphine', 0], ['bianca', 1]],
]

/* ---------- a dome ---------- */

type Single = (par: Object3D, key: ModelKey, way: number, x: number, y: number, z: number, yaw: number, right?: boolean) => Object3D

/**
 * A display dome: a sphere of radius R, its centre yc above the floor, the shell spanning ±A
 * either side of its back (local −z) and open to local +z; cream panels outside, lit cream
 * inside, champagne ribs, curved shelves at `shelves` heights, the heels laid along them.
 */
function buildDome(s: Shop, hm: HeelMaterials, p: Object3D, name: string, d: { R: number; yc: number; x: number; z: number; yaw: number; A: number }, inner: Material, led: Material, under: Material, shelves: number[], depth: number, stock: (tier: number) => Slot[], single: Single) {
  const { k } = s.e
  const { R, yc, A } = d
  const g = at(p, d.x, s.y, d.z, d.yaw)
  g.name = `tribeca_dome_${name}`
  const floorR = Math.sqrt(R * R - yc * yc)
  const thetaEnd = Math.acos(-yc / R)
  // The shell: outside panels, inside lit (its uv.y laid by height so the light falls shelf by shelf).
  const outer = mesh(g, new SphereGeometry(R + 0.022, 72, 26, 1.5 * PI - A, 2 * A, 0, Math.acos(-yc / (R + 0.022))), hm.domeOut, 0, yc, 0)
  outer.receiveShadow = true
  const inGeo = new SphereGeometry(R, 72, 44, 1.5 * PI - A, 2 * A, 0, thetaEnd)
  {
    const pos = inGeo.getAttribute('position')
    const uv = inGeo.getAttribute('uv')
    const step = shelves[1] - shelves[0]
    for (let i = 0; i < pos.count; i++) uv.setY(i, (pos.getY(i) + yc - shelves[0]) / step)
    uv.needsUpdate = true
  }
  mesh(g, inGeo, inner, 0, yc, 0, false)
  // The ribs: champagne bars on the meridians, the two at the open edges broader; a cap at the crown.
  const n = Math.round(A * 3.4)
  for (let i = 0; i <= n; i++) {
    const a = -A + (2 * A * i) / n
    const edge = i === 0 || i === n
    const path: Vector3[] = []
    const outs: Vector3[] = []
    const b0 = Math.asin(-yc / R)
    for (let j = 0; j <= 30; j++) {
      const b = b0 + ((PI / 2 - 0.05 - b0) * j) / 30
      const o = new Vector3(Math.cos(b) * Math.sin(a), Math.sin(b), -Math.cos(b) * Math.cos(a))
      outs.push(o)
      path.push(o.clone().multiplyScalar(R + 0.012).add(new Vector3(0, yc, 0)))
    }
    mesh(g, ribbon(path, outs, edge ? 0.09 : 0.05, 0.07), hm.champagne, 0, 0, 0, false)
  }
  k.cyl(g, 0.16, 0.2, 0.06, hm.champagne, 0, yc + R + 0.02, 0, 32)
  // A champagne kick round its foot, and the plinth inside.
  {
    const path: Vector3[] = []
    const outs: Vector3[] = []
    for (let j = 0; j <= 48; j++) {
      const a = PI - A + (2 * A * j) / 48
      outs.push(new Vector3(Math.sin(a), 0, Math.cos(a)))
      path.push(new Vector3(Math.sin(a) * (floorR + 0.03), 0.045, Math.cos(a) * (floorR + 0.03)))
    }
    mesh(g, ribbon(path, outs, 0.09, 0.03), hm.champagneDark, 0, 0, 0, false)
  }
  mesh(g, sector(0, floorR - 0.01, PI - A, PI + A, 0, 0.06), hm.shelf, 0, 0, 0, false)
  s.e.shade.pool(d.x, s.y + 0.012, d.z, floorR + 0.15, floorR + 0.15, 0.25)
  // The shelves, each with a champagne nosing and a line of light under it, and their heels.
  const a0 = PI - A + 0.03
  const a1 = PI + A - 0.03
  shelves.forEach((h, tier) => {
    const yr = h - yc
    const rr = Math.sqrt(R * R - yr * yr) - 0.008
    const r0 = rr - depth
    mesh(g, sector(r0, rr, a0, a1, h - 0.024, h, 64), hm.shelf, 0, 0, 0, true)
    mesh(g, sector(r0 - 0.005, r0, a0, a1, h - 0.03, h + 0.003, 64), hm.champagne, 0, 0, 0, false)
    mesh(g, sector(r0 + 0.012, r0 + 0.026, a0, a1, h - 0.031, h - 0.025, 64), led, 0, 0, 0, false)
    // The shelf's underside, lit by its strip: a soft diffuser the depth of the shelf.
    mesh(g, sector(r0 + 0.03, rr - 0.004, a0, a1, h - 0.0262, h - 0.0252, 64), under, 0, 0, 0, false)
    const row = stock(tier) ?? []
    const rs = r0 + depth * 0.52
    const span = A - 0.2
    row.forEach(([key, way], i) => {
      const a = PI - span + (2 * span * (i + 0.5)) / row.length
      const x = rs * Math.sin(a)
      const z = rs * Math.cos(a)
      // Laid along the shelf in profile, the outside to the room; alternate tiers point the other way.
      const yaw = Math.atan2(Math.cos(a), -Math.sin(a))
      const flip = tier % 2 === 1
      single(g, key, way, x, h, z, flip ? yaw + PI : yaw, flip)
    })
  })
}

/* ---------- the sculpture ---------- */

/**
 * The great stiletto, heel at local z = 0 and toe at +z, scaled by `k`: a sole plate swept from
 * the heel seat to the floor, a heel board under the seat, and the upper as an egg-crate of
 * cross ribs and long fins cut to the shoe's outline, with shelves in the heel.
 */
function sculpture(s: Shop, hm: HeelMaterials, p: Object3D, scale: number) {
  const g = new Group()
  g.scale.setScalar(scale)
  p.add(g)
  const L = 2.4
  const T = 0.025
  const smooth = (v: number) => {
    const c = Math.max(0, Math.min(1, v))
    return c * c * (3 - 2 * c)
  }
  /** Underside of the sole plate. */
  const ys = (z: number) => 0.004 + 0.95 * (1 - smooth((z - 0.5) / 1.2)) + (z > 2.15 ? 0.1 * ((z - 2.15) / 0.25) ** 2 : 0)
  /** The upper's top. */
  const yt = (z: number) => {
    if (z < 0.28) return 1.95
    if (z < 0.95) return 1.95 - 0.75 * smooth((z - 0.28) / 0.67)
    if (z < 1.6) return 1.2 - 0.58 * smooth((z - 0.95) / 0.65)
    return 0.62 - 0.36 * smooth((z - 1.6) / 0.8)
  }
  /** Half-width in plan. */
  const hw = (z: number) => {
    if (z < 0.12) return 0.26 + 0.04 * (z / 0.12)
    if (z < 1.7) return 0.3 + 0.075 * smooth((z - 0.4) / 1.3)
    return Math.max(0.03, 0.375 * (1 - ((z - 1.7) / 0.72) ** 1.6))
  }
  const SOLE = 0.08
  // The sole plate.
  {
    const n = 48
    const zs = Array.from({ length: n + 1 }, (_, i) => (L * i) / n)
    const at3 = (z: number, side: number, y: number): P3 => [side * hw(z), y, z]
    for (const rows of [
      zs.map((z) => [at3(z, -1, ys(z) + SOLE), at3(z, 1, ys(z) + SOLE)]),
      zs.map((z) => [at3(z, 1, ys(z)), at3(z, -1, ys(z))]),
      zs.map((z) => [at3(z, 1, ys(z)), at3(z, 1, ys(z) + SOLE)]),
      zs.map((z) => [at3(z, -1, ys(z) + SOLE), at3(z, -1, ys(z))]),
      [[at3(0, -1, ys(0)), at3(0, 1, ys(0))], [at3(0, -1, ys(0) + SOLE), at3(0, 1, ys(0) + SOLE)]],
    ])
      mesh(g, grid(rows), hm.rust)
  }
  // The heel board: tapering from the seat to a narrow foot.
  {
    const sh = new Shape()
    sh.moveTo(0.02, 0)
    sh.lineTo(0.17, 0)
    sh.quadraticCurveTo(0.2, 0.5, 0.42, ys(0.42))
    sh.lineTo(0.02, ys(0.02))
    sh.closePath()
    const geo = new ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: false })
    geo.rotateY(-PI / 2)
    geo.translate(0.06, 0, 0)
    mesh(g, geo, hm.rust)
  }
  // Cross ribs every 15–22 cm, each cut to the upper's section there (rounded at its shoulders).
  const ribZ: number[] = []
  for (let z = 0.03; z < L - 0.12; z += z < 0.7 ? 0.22 : 0.15) ribZ.push(z)
  for (const z of ribZ) {
    const w = hw(z) - 0.005
    const y0 = ys(z) + SOLE
    const y1 = yt(z)
    if (y1 - y0 < 0.05) continue
    const r = Math.min(0.12, w * 0.45, (y1 - y0) * 0.45)
    const sh = new Shape()
    sh.moveTo(-w, y0)
    sh.lineTo(w, y0)
    sh.lineTo(w, y1 - r)
    sh.quadraticCurveTo(w, y1, w - r, y1)
    sh.lineTo(-w + r, y1)
    sh.quadraticCurveTo(-w, y1, -w, y1 - r)
    sh.closePath()
    const geo = new ExtrudeGeometry(sh, { depth: T, bevelEnabled: false, curveSegments: 4 })
    geo.translate(0, 0, z - T / 2)
    mesh(g, geo, hm.rust)
  }
  // Long fins through the ribs: down the middle, and either side as far as the toe allows.
  for (const fx of [-0.17, 0, 0.17]) {
    const zEnd = fx === 0 ? L - 0.1 : 1.95
    const n = 40
    const sh = new Shape()
    const zs = Array.from({ length: n + 1 }, (_, i) => 0.02 + ((zEnd - 0.02) * i) / n)
    sh.moveTo(zs[0], ys(zs[0]) + SOLE)
    for (const z of zs) sh.lineTo(z, ys(z) + SOLE)
    for (const z of [...zs].reverse()) sh.lineTo(z, Math.max(ys(z) + SOLE + 0.02, yt(z) - 0.02))
    sh.closePath()
    const geo = new ExtrudeGeometry(sh, { depth: T, bevelEnabled: false })
    geo.rotateY(-PI / 2)
    geo.translate(fx + T / 2, 0, 0)
    mesh(g, geo, hm.rust)
  }
  // Shelves across the heel, making its cubbies.
  for (const y of [1.3, 1.62]) {
    const z1 = y < 1.5 ? 0.62 : 0.5
    s.e.k.box(g, 2 * hw(0.3) - 0.01, T, z1, hm.rust, 0, y, z1 / 2 + 0.01)
  }
  return g
}

/* ---------- the counter ---------- */

type Pair = (par: Object3D, key: ModelKey, way: number, x: number, y: number, z: number, yaw: number, featured?: boolean) => Object3D

function buildCounter(s: Shop, hm: HeelMaterials, p: Object3D, led: Material, pair: Pair, single: Single) {
  const { k } = s.e
  const { cx, cz, ro, ri, a0, a1 } = CT
  const g = at(p, cx, s.y, cz, 0)
  g.name = 'tribeca_counter'
  const mid = ri + 0.26
  // Staff side: a cream cabinet of drawers with a travertine top; customer side: the lit vitrine.
  mesh(g, sector(ri + 0.04, ro - 0.04, a0 + 0.01, a1 - 0.01, 0, 0.1), hm.champagneDark, 0, 0, 0, false)
  mesh(g, sector(ri, ro, a0, a1, 0.1, 0.42), hm.counterCream)
  mesh(g, sector(ri, ro + 0.006, a0, a1, 0.42, 0.45), hm.champagne)
  mesh(g, sector(ri, mid, a0, a1, 0.45, 0.92), hm.counterCream)
  mesh(g, sector(ri - 0.02, mid + 0.01, a0 - 0.006, a1 + 0.006, 0.92, 0.95), hm.travertine)
  mesh(g, sector(mid, ro - 0.01, a0, a1, 0.45, 0.46), hm.shelf, 0, 0, 0, false)
  // The vitrine: curved glass front and top, a glass shelf, end panes, champagne rims, lit inside.
  // The panes let a tap through to the heels behind them.
  const panes = clickThrough(g, 'tribeca_counter')
  const front = mesh(panes.g, new CylinderGeometry(ro, ro, 0.49, 64, 1, true, a0, a1 - a0), hm.glass, 0, 0.455 + 0.245, 0, false)
  front.renderOrder = 2
  mesh(panes.g, sector(mid, ro, a0, a1, 0.94, 0.95), hm.glass, 0, 0, 0, false).renderOrder = 2
  mesh(g, sector(mid + 0.02, ro - 0.03, a0 + 0.01, a1 - 0.01, 0.695, 0.705), hm.shelfGlass, 0, 0, 0, false)
  for (const a of [a0, a1]) {
    k.box(at(panes.g, 0, 0, 0, a), 0.006, 0.49, ro - mid, hm.glass, 0, 0.7, (ro + mid) / 2, false)
    k.box(at(g, 0, 0, 0, a), 0.03, 0.53, 0.03, hm.champagne, 0, 0.69, ro - 0.012)
  }
  panes.seal()
  mesh(g, sector(ro - 0.018, ro + 0.006, a0, a1, 0.95, 0.966), hm.champagne, 0, 0, 0, false)
  mesh(g, sector(ro - 0.07, ro - 0.055, a0, a1, 0.928, 0.934), led, 0, 0, 0, false)
  mesh(g, sector(ro - 0.07, ro - 0.055, a0, a1, 0.684, 0.69), led, 0, 0, 0, false)
  s.e.shade.rect(cx, s.y + 0.012, cz + (ro + ri) / 2, 2.1, 0.7, 0, 0.3)
  // Its heels: four singles on the vitrine's floor and four on its shelf, along the curve, outsides to the room.
  const onArc = (r: number, a: number): [number, number] => [r * Math.sin(a), r * Math.cos(a)]
  const lower: Slot[] = [['mira', 0], ['noor', 0], ['juno', 1], ['vesper', 1]]
  const upper: Slot[] = [['seraphine', 0], ['bianca', 0], ['lys', 0], ['rosalind', 0]]
  for (const [row, h] of [[lower, 0.46], [upper, 0.705]] as const)
    row.forEach(([key, way], i) => {
      const a = a0 + 0.06 + ((a1 - a0 - 0.12) * (i + 0.5)) / row.length
      const [x, z] = onArc(ro - 0.15, a)
      // The tangent, toe towards a1; a right shoe so its outside faces out to the room.
      single(g, key, way, x, h, z, Math.atan2(Math.cos(a), -Math.sin(a)) + PI, true)
    })
  // On the glass top: three featured pairs that lift and turn when tapped.
  const feats: [ModelKey, number][] = [['aurelia', 0], ['noor', 1], ['mira', 0]]
  feats.forEach(([key, way], i) => {
    const a = a0 + 0.12 + ((a1 - a0 - 0.3) * (i + 0.5)) / feats.length
    const [x, z] = onArc((ro + mid) / 2, a)
    k.cyl(g, 0.13, 0.13, 0.02, hm.champagne, x, 0.96, z, 32)
    pair(g, key, way, x, 0.97, z, a + 0.9, true)
  })
  // The till on the staff side at the near end: a screen on a champagne stand; the card machine.
  {
    const [tx, tz] = onArc(ri + 0.13, a1 - 0.12)
    const till = at(g, tx, 0.95, tz, a1 + PI)
    k.cyl(till, 0.07, 0.08, 0.012, hm.champagne, 0, 0.006, 0, 32)
    k.cyl(till, 0.012, 0.012, 0.2, hm.champagne, 0, 0.11, 0, 12)
    const head = at(till, 0, 0.27, 0, 0)
    head.rotation.x = -0.25
    k.soft(head, 0.3, 0.2, 0.014, 0.006, hm.blackGloss, 0, 0, 0)
    const scr = hm.canvas(384, 256, (c, w, h) => {
      c.fillStyle = '#f7f3ec'
      c.fillRect(0, 0, w, h)
      c.fillStyle = '#1d1c1b'
      c.fillRect(0, 0, w, 44)
      c.fillStyle = '#e9d9b8'
      c.font = '300 22px "Inter", Arial, sans-serif'
      c.fillText(HOUSE, 18, 30)
      c.fillStyle = '#3a3229'
      c.textAlign = 'center'
      c.font = '400 26px "Inter", Arial, sans-serif'
      c.fillText('Tap to check out', w / 2, h * 0.55)
      c.font = '400 15px "Inter", Arial, sans-serif'
      c.fillText('Cards · UPI · Wallets', w / 2, h * 0.78)
    })
    const sm = new MeshStandardMaterial({ map: scr, emissiveMap: scr, emissive: '#ffffff', emissiveIntensity: 0.6, roughness: 0.3 })
    sm.userData.interior = true
    const btn = button(head, 'till', 'Till', 'Check out', 0, 0, 0.008, () => useInfoStore.getState().show({ ...checkoutCard(), place: `Ground Floor · ${s.u.name} (${s.u.id})` }), 'tribeca')
    const sc = mesh(btn, new CircleGeometry(1, 4), sm, 0, 0, 0, false)
    sc.rotation.z = PI / 4
    sc.scale.set(0.28 / Math.SQRT2, 0.18 / Math.SQRT2, 1)
    const [px, pz] = onArc(ri + 0.12, a1 - 0.3)
    const pin = at(g, px, 0.95, pz, a1 + PI)
    k.soft(pin, 0.075, 0.018, 0.15, 0.008, hm.blackMatte, 0, 0.009, 0)
    k.box(pin, 0.055, 0.001, 0.05, hm.blackGloss, 0, 0.0185, -0.035, false)
    info(s, pin, { title: 'Card Machine', kind: 'Payments', body: 'Tap a card or phone, insert a card, or scan the UPI code on the till.', specs: ['Contactless, chip and PIN', 'UPI, wallets'] }, 0)
  }
  // A box opened for a customer at the far end: lid leaning on it, tissue, a pair inside.
  {
    const [bx, bz] = onArc(ri + 0.13, a0 + 0.17)
    const bxg = at(g, bx, 0.95, bz, a0 + PI / 2)
    k.box(bxg, 0.34, 0.11, 0.2, hm.boxSideDark, 0, 0.055, 0)
    k.box(bxg, 0.32, 0.004, 0.18, hm.tissue, 0, 0.1, 0, false)
    const lid = at(bxg, 0, 0.0, -0.13, 0)
    lid.rotation.x = -1.2
    k.box(lid, 0.345, 0.004, 0.205, hm.boxBlack, 0, 0.1, 0, false)
    const inside = new Group()
    inside.position.set(0, 0.1, 0)
    inside.rotation.y = PI / 2
    inside.scale.setScalar(0.92)
    bxg.add(inside)
    pair(inside, 'calla', 0, 0, 0, 0, 0)
  }
  // The drawers on the staff side, in the cabinet's inner face.
  for (const [i, a] of [a0 + 0.12, (a0 + a1) / 2, a1 - 0.22].entries()) {
    const [x, z] = onArc(ri, a)
    const dr = new Group()
    dr.name = `drawer_tribeca_counter_${i}`
    dr.userData.label = 'Drawer'
    dr.userData.slide = [0, 0, 0.22]
    dr.position.set(x, 0.72, z)
    dr.rotation.y = a + PI
    g.add(dr)
    const fr = k.soft(dr, 0.5, 0.2, 0.02, 0.005, hm.counterCream, 0, 0, 0.01)
    fr.userData.front = true
    k.box(dr, 0.2, 0.012, 0.014, hm.champagne, 0, 0.05, 0.024)
    const insideD = new Group()
    insideD.name = 'contents'
    dr.add(insideD)
    k.box(insideD, 0.46, 0.01, 0.22, hm.counterCream, 0, -0.09, -0.11, false)
    // Shoehorns, try-on socks, a measuring stick, dust bags.
    k.box(insideD, 0.24, 0.006, 0.04, hm.champagne, -0.08, -0.08, -0.06, false)
    k.box(insideD, 0.1, 0.02, 0.07, hm.tissue, 0.12, -0.075, -0.07, false)
    k.box(insideD, 0.3, 0.012, 0.06, hm.sizer, 0.0, -0.078, -0.16, false)
  }
  info(s, g.children[1], { title: 'The Counter', kind: `${HOUSE} · Counter`, body: 'The curved glass counter: a lit vitrine of the evening and bridal heels behind its curved front, featured pairs on the glass, and on the staff side the till, the card machine and drawers of shoehorns, try-on socks and dust bags. Tap the till\'s screen to check out what is in your bag.', specs: ['Curved low-iron glass on champagne steel', 'Travertine work top', 'Lit with LED lines, 2700 K'] }, 0)
}
