import { CylinderGeometry, type Material, type MeshStandardMaterial } from 'three'
import { diningChair } from '../furniture'
import { clipped, type FloorCtx } from '../shell'
import type { Unit } from '../units'
import { fabrics } from './fabrics'
import { bag, figure, scent, shoePair, trackSpots, wallet, type BagOpts, type BagStyle } from './goods'
import {
  at, box, branches, brandSign, cashDesk, curtain, downlights, ellipse, flat, lamp, letters, lightSwitch, mbox, mesh, onCircuit, openShop, pane, PI, pleated, rect, roundRug, skirting,
  swingLeaf, vitrine,
} from './kit'
import { pleatedPouf, pradaArmchair } from './seating'

/*
 * Prada, unit G-02: the second shop on the left after the entrance, 10.5 m deep off the west
 * spine. Built from the reference:
 *
 *   front     Nero Marquina fascia and pilasters, the name in pale steel letters, black-steel
 *             framed glazing and glass doors with long steel pulls
 *   ceiling   a great oval of mint-green knife pleats hung below the ceiling, its inside lit pale
 *             green, the name across its far end; a line of light at its foot
 *   walls     lit shelving down both long walls over a Statuario counter with cream chairs tucked
 *             under it, cream fluted panels in grey frames above to the ceiling; at the back a lit
 *             alcove with a white plinth of blossom branches between two glazed vitrines, deep
 *             green pleated curtains in the corners
 *   goods     Galleria bags in Saffiano, Re-Nylon hobos, chain-strap flap bags and clutches with
 *             the enamel triangle, wallets and card cases, scent, Monolith loafers
 *   floor     Nero Marquina in big slabs; a round pastel floral rug under the oval, a knife-pleated
 *             mint pouf at its centre, pleated side tables each with a bag, two bouclé armchairs
 *
 * Doors, the till drawer and the vitrine doors work; a switch by the entrance works the display lighting.
 */

const WX = -16.2
const H = 3.95
const HW = 3.3
const Z0 = -5.925
const Z1 = -1.075

export function buildPrada(e: FloorCtx, u: Unit) {
  const s = openShop(e, u)
  const { k, lux, m: mm } = e
  const { g, m, y: Y } = s
  const f = fabrics(e)
  const soffit = e.soffit
  const led = onCircuit(s, lux.led as MeshStandardMaterial)
  const backlit = onCircuit(s, m.backlit('#fff6ea', 0.55))
  const mintGlow = onCircuit(s, m.backlit('#cfe9dc', 0.5))
  const alcoveGlow = onCircuit(s, m.backlit('#fff1e2', 0.7))

  /* ---------- the collection's materials ---------- */
  const tri = { enamel: f.enamel('#141414'), metal: lux.steel }
  const S = {
    black: f.saffiano('#141416'), ivory: f.saffiano('#ece6da'), cognac: f.saffiano('#9d5f36'), powder: f.saffiano('#e7c8c3'), slate: f.saffiano('#55667f'), teal: f.saffiano('#2a7470'),
    orange: f.saffiano('#d46f2c'), sun: f.saffiano('#dcae35'), olive: f.saffiano('#6e7150'),
  }
  const calf = { black: f.calf('#1b1a1a', 21), white: f.calf('#f0ede6', 22), tan: f.calf('#b9834f', 23), mint: f.calf('#9fd0bd', 24) }
  const nylon = { black: f.nylon('#17181a'), navy: f.nylon('#1f2a44'), sage: f.nylon('#8aa59a') }
  const mintCloth = f.cotton('#a3d3c2', 31)
  const mintVelvet = f.velvet('#a7d6c6', 32)
  const boucle = f.boucle('#ece6da', 33)
  const chairCloth = f.boucle('#efeae0', 34)
  const stock: [BagStyle, Material, BagOpts][] = [
    ['galleria', S.black, { metal: lux.steel, triangle: tri }],
    ['hobo', nylon.black, { metal: lux.steel, triangle: tri }],
    ['flap', S.ivory, { metal: lux.steel, triangle: tri }],
    ['galleria', S.cognac, { metal: lux.steel, triangle: tri }],
    ['clutch', S.powder, { metal: lux.steel, triangle: tri }],
    ['galleria', S.teal, { metal: lux.steel, triangle: tri }],
    ['flap', calf.black, { metal: lux.steel, triangle: tri, trim: S.black }],
    ['hobo', nylon.navy, { metal: lux.steel, triangle: tri }],
    ['galleria', S.orange, { metal: lux.steel, triangle: tri }],
    ['clutch', S.slate, { metal: lux.steel, triangle: tri }],
    ['galleria', S.ivory, { metal: lux.steel, triangle: tri }],
    ['flap', S.sun, { metal: lux.steel, triangle: tri }],
    ['hobo', nylon.sage, { metal: lux.steel, triangle: tri }],
    ['galleria', S.powder, { metal: lux.steel, triangle: tri }],
    ['clutch', S.olive, { metal: lux.steel, triangle: tri }],
    ['galleria', S.slate, { metal: lux.steel, triangle: tri }],
  ]
  const walletMats = [S.black, S.ivory, S.powder, S.cognac, S.slate, S.teal]

  /* ---------- floor ---------- */
  flat(g, clipped(e, u.rects[0]), Y + 0.006, m.marquina, false, [], 'prada_floor')

  /* ---------- the shopfront on x = −6.6 from z = −6 to −1, the doors at z = −4.6 … −2.4 ---------- */
  const FX = -6.6
  box(s, FX - 0.075, FX + 0.075, Y + 4.2, soffit, -6.0, -1.0, mm.wallPaint)
  const F0 = FX - 0.3
  const F1 = FX + 0.05
  mbox(g, F1 - F0, 0.9, 5.04, lux.wallNero, (F0 + F1) / 2, Y + 3.3 + 0.45, -3.5)
  for (const [a, b] of [[-6.02, -5.68], [-1.32, -0.98]]) mbox(g, F1 - F0, 3.3, b - a, lux.wallNero, (F0 + F1) / 2, Y + 1.65, (a + b) / 2)
  box(s, F0, F1, Y + 4.2, Y + 4.21, -6.02, -0.98, lux.steel, false)
  brandSign(s, g, letters(s, 'PRADA', 'prada', '#dde1e4', 512, 128), 1.9, 0.475, F1 + 0.004, Y + 3.76, -3.5, PI / 2)
  const frame = lux.blackSteel
  box(s, FX - 0.04, FX + 0.04, Y + 3.24, Y + 3.3, -5.68, -1.32, frame)
  box(s, FX - 0.03, FX + 0.03, Y, Y + 0.02, -5.68, -1.32, frame, false)
  for (const z of [-5.65, -4.63, -2.37, -1.35]) box(s, FX - 0.04, FX + 0.04, Y, Y + 3.24, z - 0.025, z + 0.025, frame)
  box(s, FX - 0.04, FX + 0.04, Y + 2.62, Y + 2.68, -4.63, -2.37, frame)
  box(s, FX - 0.15, FX + 0.15, Y, Y + 0.008, -4.6, -2.4, lux.steel, false)
  pane(s, g, FX, -5.62, FX, -4.66, Y + 0.02, Y + 3.24)
  pane(s, g, FX, -2.34, FX, -1.38, Y + 0.02, Y + 3.24)
  pane(s, g, FX, -4.6, FX, -2.4, Y + 2.68, Y + 3.24)
  const right = at(g, FX, Y, -4.6, -PI / 2)
  swingLeaf(s, right, 'prada_r', 1.09, 2.6, frame, -PI / 2, true)
  const left = at(g, FX, Y, -2.4, PI / 2)
  swingLeaf(s, left, 'prada_l', 1.09, 2.6, frame, PI / 2, true)
  e.shade.foot(FX + 0.06, -6.0, FX + 0.06, -1.0, Y + 0.01, 0.2, 0.25)

  // The display windows inside the glass either side of the doors: fluted cream backs, lit, a plinth floor.
  const windowBox = (z0: number, z1: number, s0: number, s1: number) => {
    box(s, -7.5, FX - 0.06, Y, Y + HW, s0, s1, m.cream)
    mbox(g, 0.08, HW, z1 - z0, m.creamFlute, -7.54, Y + HW / 2, (z0 + z1) / 2)
    box(s, -7.58, FX, Y + HW, Y + HW + 0.08, z0, z1, m.cream)
    for (const z of [z0 + 0.3, z1 - 0.3]) {
      k.cyl(g, 0.04, 0.04, 0.006, lux.blackSteel, -7.1, Y + HW - 0.003, z, 16)
      k.cyl(g, 0.022, 0.022, 0.004, led, -7.1, Y + HW - 0.0045, z, 12)
    }
    box(s, -7.58, FX, Y, Y + 0.05, z0, z1, lux.wallNero)
  }
  windowBox(Z0, -4.72, -4.72, -4.64)
  windowBox(-2.44, Z1, -2.52, -2.44)
  figure(s, g, { jacket: nylon.black, shirt: f.cotton('#f3f1ec', 35), trousers: f.wool('#1c1c1e', 36, '#3a3a3e'), shoes: calf.black }, -7.05, Y + 0.05, -1.78, PI / 2 - 0.2)
  const plinth = (x: number, z: number, h: number) => {
    k.box(g, 0.5, h, 0.5, m.cream, x, Y + h / 2, z)
    s.e.shade.rect(x, Y + 0.012, z, 0.5, 0.5, 0, 0.35)
  }
  plinth(-7.1, -5.0, 0.75)
  bag(s, g, 'galleria', S.orange, -7.1, Y + 0.75, -5.0, PI / 2, { metal: lux.steel, triangle: tri })
  plinth(-7.1, -5.55, 0.45)
  bag(s, g, 'hobo', nylon.black, -7.1, Y + 0.45, -5.55, PI / 2 + 0.3, { metal: lux.steel, triangle: tri })

  /* ---------- walls: the back wall lining the avenue glass, skirtings ---------- */
  box(s, WX - 0.1, WX, Y, soffit, -6.0, -1.0, m.cream)
  skirting(s, g, WX, Z1, -7.5, Z1, lux.wallNero)
  skirting(s, g, -7.5, Z0, WX, Z0, lux.wallNero)
  skirting(s, g, WX, Z0, WX, Z1, lux.wallNero)

  /* ---------- the ceiling and its oval of pleats ---------- */
  const inner = rect(WX, FX, -6.0, -1.0)
  flat(g, inner, Y + H, mm.gypsum, true, [], 'prada_ceiling')
  const oc: [number, number] = [-11.9, -3.5]
  const A = 3.3
  const B = 1.85
  const band = pleated(
    (t) => [oc[0] + Math.cos(t * PI * 2) * A, oc[1] + Math.sin(t * PI * 2) * B],
    (t) => {
      const nx = Math.cos(t * PI * 2) / A
      const nz = Math.sin(t * PI * 2) / B
      const l = Math.hypot(nx, nz)
      return [nx / l, nz / l]
    },
    168, Y + 3.25, Y + H - 0.002, 0.05, true, m.mintCeiling,
  )
  g.add(band)
  flat(g, ellipse(oc[0], oc[1], A - 0.04, B - 0.04, 64), Y + H - 0.006, mintGlow, true, [], 'prada_oval')
  flat(g, ellipse(oc[0], oc[1], A + 0.09, B + 0.09, 64), Y + 3.246, led, true, [ellipse(oc[0], oc[1], A - 0.09, B - 0.09, 64)], 'prada_oval_light')
  'PRADA'.split('').forEach((ch, i) => {
    const t = PI - (2 - i) * 0.2
    const px = oc[0] + Math.cos(t) * (A - 0.07)
    const pz = oc[1] + Math.sin(t) * (B - 0.07)
    const nx = -Math.cos(t) / A
    const nz = -Math.sin(t) / B
    const l = Math.hypot(nx, nz)
    brandSign(s, g, letters(s, ch, 'prada', '#1c1c1e', 96, 128), 0.3, 0.4, px + (nx / l) * 0.02, Y + 3.62, pz + (nz / l) * 0.02, Math.atan2(nx, nz))
  })
  downlights(s, g, -15.5, -1.5, -8.0, -1.5, 5, Y + H)
  downlights(s, g, -15.5, -5.5, -8.0, -5.5, 5, Y + H)
  downlights(s, g, -7.6, -3.5, -7.6, -3.5, 1, Y + H)
  trackSpots(s, g, -15.4, Z1 - 0.95, -9.6, Z1 - 0.95, Y + H, 5, led, 0, 0.8)
  trackSpots(s, g, -15.4, Z0 + 0.95, -9.6, Z0 + 0.95, Y + H, 5, led, PI, 0.8)
  for (const poly of [[-7.58, FX, Z0, -4.72], [-7.58, FX, -2.44, Z1]] as const) flat(g, rect(poly[0], poly[1], poly[2], poly[3]), Y + HW, m.cream, true, [], 'prada_window_ceiling')

  /* ---------- the lit shelf walls, counters and chairs down both sides ---------- */
  const wall = (z: number, yaw: number, offset: number) => {
    const len = 6.2
    const cx = -12.6
    const w = at(g, cx, Y, z, yaw)
    k.box(w, len, 1.5, 0.02, backlit, 0, 1.5, 0.01, false)
    mbox(w, len, H - 2.3, 0.05, m.creamFlute, 0, 2.3 + (H - 2.3) / 2, 0.025)
    k.box(w, len + 0.06, 0.05, 0.07, m.frameGrey, 0, 2.275, 0.035)
    k.box(w, len + 0.06, 0.05, 0.07, m.frameGrey, 0, H - 0.03, 0.035)
    for (let i = 0; i <= 4; i++) k.box(w, 0.05, H - 2.3, 0.07, m.frameGrey, -len / 2 + (i * len) / 4, 2.3 + (H - 2.3) / 2, 0.035)
    k.box(w, len, 0.72, 0.42, m.cream, 0, 0.38, 0.21)
    k.box(w, len + 0.04, 0.04, 0.56, lux.statuario, 0, 0.76, 0.28)
    k.box(w, len - 0.2, 0.006, 0.01, led, 0, 0.738, 0.52, false)
    k.box(w, len - 0.2, 0.006, 0.01, led, 0, 0.1, 0.4, false)
    for (const h of [1.18, 1.56, 1.94]) {
      k.box(w, len - 0.04, 0.012, 0.3, m.shelfGlass, 0, h, 0.16, false)
      k.box(w, len - 0.04, 0.02, 0.015, m.frameGrey, 0, h, 0.305, false)
      k.box(w, len - 0.2, 0.006, 0.01, led, 0, h - 0.012, 0.28, false)
    }
    for (let i = 0; i <= 4; i++) k.box(w, 0.03, 1.5, 0.32, m.frameGrey, -len / 2 + (i * len) / 4, 1.5, 0.16)
    k.box(w, len, 0.05, 0.34, m.frameGrey, 0, 2.25, 0.17)
    k.box(w, len - 0.2, 0.006, 0.01, led, 0, 2.22, 0.3, false)
    // The bags, each given its space: six to a shelf, the kinds and colours mixed; card cases and wallets on the lowest.
    for (const [tier, h] of [[1, 1.566], [2, 1.946]] as const)
      for (let i = 0; i < 6; i++) {
        const ux = -2.6 + i * 1.04 + (tier % 2) * 0.25
        const [style, mat, o] = stock[(i * 3 + tier * 5 + offset) % stock.length]
        bag(s, w, style, mat, ux, h, 0.16, (i % 2 ? -1 : 1) * 0.12, { ...o, scale: style === 'hobo' ? 0.85 : 1 })
      }
    for (let i = 0; i < 6; i++) {
      const ux = -2.6 + i * 1.04
      if (i % 2) wallet(s, w, walletMats[(i + offset) % walletMats.length], ux - 0.12, 1.186, 0.16, 0, true, lux.steel, true)
      else {
        const [style, mat, o] = stock[(i * 2 + offset + 7) % stock.length]
        bag(s, w, style === 'hobo' ? 'clutch' : style, mat, ux, 1.186, 0.16, (i % 2 ? -1 : 1) * 0.12, o)
      }
      if (i % 2) wallet(s, w, walletMats[(i + 3 + offset) % walletMats.length], ux + 0.14, 1.186, 0.16, 0.1, true, lux.steel, false)
    }
    // On the counter: a bag at each end, blossom, scent, a pair of loafers.
    bag(s, w, 'galleria', offset ? S.sun : S.teal, -2.0, 0.78, 0.3, 0.4, { metal: lux.steel, triangle: tri })
    bag(s, w, 'flap', offset ? S.powder : S.black, 1.3, 0.78, 0.3, -0.4, { metal: lux.steel, triangle: tri })
    shoePair(s, w, 'loafer', offset ? calf.white : calf.black, 2.5, 0.78, 0.3, -0.3, { sole: s.m.sole, metal: lux.steel })
    branches(s, w, 0.0, 0.78, 0.28, 0.55, offset + 1)
    scent(s, w, -0.9, 0.78, 0.3, 0.12)
    s.e.shade.rect(cx, Y + 0.012, z, len, 0.9, yaw, 0.3)
    return w
  }
  wall(Z1, PI, 0)
  wall(Z0, 0, 4)
  for (const x of [-10.4, -12.6, -14.8]) {
    diningChair(e, g, x, Z1 - 0.83, 0, chairCloth)
    diningChair(e, g, x, Z0 + 0.83, PI, chairCloth)
  }

  /* ---------- the back wall: alcove, vitrines, curtains ---------- */
  {
    const a = at(g, WX, Y, -3.525, PI / 2)
    k.box(a, 1.6, 2.4, 0.02, alcoveGlow, 0, 1.5, 0.01, false)
    k.box(a, 1.7, 0.05, 0.1, m.frameGrey, 0, 2.725, 0.05)
    k.box(a, 1.7, 0.05, 0.1, m.frameGrey, 0, 0.275, 0.05)
    for (const sx of [-0.825, 0.825]) k.box(a, 0.05, 2.5, 0.1, m.frameGrey, sx, 1.5, 0.05)
    k.box(a, 0.9, 0.9, 0.45, m.ceramicWhite, 0, 0.45, 0.4)
    branches(s, a, -0.1, 0.9, 0.4, 1.25, 9)
    for (const [sy, r] of [[1.0, 0.1], [1.17, 0.08], [1.3, 0.06]] as const) k.sphere(a, r, m.ceramicWhite, 0.28, sy, 0.42)
    s.e.shade.rect(WX + 0.4, Y + 0.012, -3.525, 0.9, 0.5, 0, 0.35)
  }
  for (const [z, name, off] of [[-4.95, 'prada_vitrine_r', 0], [-2.1, 'prada_vitrine_l', 3]] as const) {
    const v = vitrine(s, g, name, WX + 0.26, z, PI / 2, 0.85, 0.45, 1.5, [0.45, 0.9, 1.25], m.frameGrey, m.cream, led, 0.75)
    for (let i = 0; i < 3; i++) scent(s, v.g, -0.26 + i * 0.26, v.shelfY(0), 0.0, 0.11, i === 1 ? (lux.amberGlass as Material) : undefined)
    for (let i = 0; i < 3; i++) wallet(s, v.g, walletMats[(i + off) % walletMats.length], -0.26 + i * 0.26, v.shelfY(1), 0.0, 0, true, lux.steel, i !== 1)
    bag(s, v.g, 'clutch', off ? S.ivory : S.black, -0.15, v.shelfY(2), 0.0, 0.1, { metal: lux.steel, triangle: tri })
    wallet(s, v.g, off ? S.teal : S.powder, 0.22, v.shelfY(2), 0.0, 0, true, lux.steel, false)
    for (let i = 0; i < 3; i++) scent(s, v.g, -0.26 + i * 0.26, v.shelfY(3), 0.0, 0.09)
  }
  curtain(s, g, WX + 0.06, -5.475, WX + 0.06, Z0 + 0.01, Y + 0.02, Y + H - 0.04, m.greenVelvet, 0.06)
  curtain(s, g, WX + 0.06, Z1 - 0.01, WX + 0.06, -1.525, Y + 0.02, Y + H - 0.04, m.greenVelvet, 0.06)

  /* ---------- the entrance: a tall vitrine on the left, the till on the right ---------- */
  const tall = vitrine(s, g, 'prada_vitrine_front', -8.3, Z1 - 0.26, PI, 0.9, 0.45, 1.5, [0.45, 0.9, 1.25], m.frameGrey, m.cream, led, 0.75)
  bag(s, tall.g, 'clutch', S.cognac, -0.18, tall.shelfY(0), 0.0, 0.1, { metal: lux.steel, triangle: tri })
  wallet(s, tall.g, S.black, 0.2, tall.shelfY(0), 0.0, 0, true, lux.steel, true)
  for (let i = 0; i < 3; i++) wallet(s, tall.g, walletMats[(i + 2) % walletMats.length], -0.27 + i * 0.27, tall.shelfY(1), 0.0, 0, true, lux.steel, false)
  for (let i = 0; i < 3; i++) scent(s, tall.g, -0.27 + i * 0.27, tall.shelfY(2), 0.0, 0.11, i === 1 ? (lux.amberGlass as Material) : undefined)
  bag(s, tall.g, 'clutch', S.slate, -0.15, tall.shelfY(3), 0.0, 0.0, { metal: lux.steel, triangle: tri })
  wallet(s, tall.g, S.ivory, 0.22, tall.shelfY(3), 0.0, 0, true, lux.steel, false)
  cashDesk(s, g, 'prada_till', -8.4, -5.0, 0, 1.8, m.cream, lux.statuario, m.frameGrey, led)
  brandSign(s, g, letters(s, 'PRADA', 'prada', '#2a2a2c', 512, 128), 0.9, 0.225, -8.4, Y + 2.0, Z0 + 0.002, 0)

  /* ---------- the salon on the rug ---------- */
  // Laid along the room's length, so a walk of 0.6 m stays clear between the group and the chairs at the counters.
  const rc: [number, number] = [-12.3, -3.5]
  roundRug(s, g, rc[0], rc[1], 1.6, m.floralRug)
  const centre = pleatedPouf(s, g, rc[0], rc[1], 0.5, 0.42, mintCloth)
  bag(s, centre, 'galleria', S.sun, -0.16, 0.45, 0.1, 0.6, { metal: lux.steel, triangle: tri })
  bag(s, centre, 'flap', S.black, 0.18, 0.45, -0.08, -0.4, { metal: lux.steel, triangle: tri })
  mesh(centre, new CylinderGeometry(0.14, 0.14, 0.012, 32), lux.statuario, 0.0, 0.455, -0.26)
  for (let i = 0; i < 3; i++) scent(s, centre, -0.07 + i * 0.07, 0.461, -0.26, 0.06)
  for (const [x, z, mat, style] of [[-11.25, -3.2, S.orange, 'galleria'], [-13.35, -3.8, S.teal, 'hobo']] as const) {
    const t = pleatedPouf(s, g, x, z, 0.3, 0.46, mintCloth, lux.statuario)
    bag(s, t, style, style === 'hobo' ? nylon.sage : mat, 0, 0.46, 0, 0.5, { metal: lux.steel, triangle: tri, scale: 0.85 })
  }
  for (const [x, z] of [[-10.35, -3.85], [-14.25, -3.15]] as const) {
    const yaw = Math.atan2(rc[0] - x, rc[1] - z)
    pradaArmchair(s, g, x, z, yaw, boucle, mintVelvet)
  }

  /* ---------- lighting ---------- */
  lamp(s, -9.3, Y + 3.5, -3.5, 8, 8)
  lamp(s, rc[0], Y + 3.05, rc[1], 9, 8, '#f2fff6')
  lamp(s, -15.2, Y + 3.5, -3.5, 8, 8)
  lightSwitch(s, -7.1, -2.44 - 0.002, PI, 'prada')
  return s
}
