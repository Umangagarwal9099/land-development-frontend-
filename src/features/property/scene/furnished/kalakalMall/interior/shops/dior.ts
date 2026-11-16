import { CylinderGeometry, Group, type Material, type MeshStandardMaterial } from 'three'
import { clipHalf } from '../../plan'
import { clipped, type FloorCtx } from '../shell'
import type { Unit } from '../units'
import { fabrics } from './fabrics'
import { bag, belt, cap, clothesRail, figure, foldedStack, hangingBay, hangRun, scent, shoe, shoePair, trackSpots, wallet, type ShoeOpts, type ShoeStyle } from './goods'
import {
  at, box, branches, brandSign, cashDesk, circle, downlights, flat, lamp, letters, lightCove, lightSwitch, mbox, mesh, onCircuit, openShop, pane, PI, plinth, shelfWall, skirting,
  swingLeaf, vitrine,
} from './kit'
import { diorClubChair, diorSofa, drumTable } from './seating'

/*
 * Dior, unit G-01: the anchor at the mall's south-east corner, the first shop on the left after
 * the entrance, with its windows on the forecourt and the south avenue. Built from the reference:
 *
 *   front     a deep fascia of Fior di Bosco marble, the house's name in backlit white serif
 *             letters, bronze-framed glazing and a pair of bronze-framed glass doors with long
 *             pulls; a display window either side of the doors, the left with a champagne shelf
 *             unit of bags, a cap and sneakers against a cream cannage back, the right a figure
 *   inside    the Dior Oblique carpet in warm grey inset in a Botticino stone border, cream walls,
 *             a flat cream ceiling with a round lit cove over the salon, and the collection of a
 *             full boutique: leather goods on lit cream shelving, ready-to-wear (shirts, tees,
 *             knits, jackets, coats, dresses, trousers and jeans) on rails and folded on shelves
 *             and tables, men's and women's footwear on dedicated walls, wallets, belts, caps
 *             and scent among the accessories; a bouclé sofa and leather club chairs in the salon
 *   windows   the façade glass is lined with cannage-backed display windows on the avenue and the
 *             forecourt (dressed figures, bags and shoes on plinths), reached by a flush door
 *
 * Doors, the till drawer, the vitrine and the window access door all work; a switch by the
 * entrance works the display lighting.
 */

const WX = -16.2
const WZ = 11.3
const H = 3.8
const HW = 3.3

export function buildDior(e: FloorCtx, u: Unit) {
  const s = openShop(e, u)
  const { k, lux, m: mm } = e
  const { g, m, y: Y } = s
  const f = fabrics(e)
  const soffit = e.soffit
  const led = onCircuit(s, lux.led as MeshStandardMaterial)
  const backlit = onCircuit(s, m.backlit('#fff4e3', 0.5))
  const coveGlow = onCircuit(s, m.backlit('#fff6ea', 0.9))

  /* ---------- the collection's materials ---------- */
  const L = {
    black: f.calf('#1e1c1b', 1), cream: f.calf('#e4dac9', 2), tan: f.calf('#b07a4a', 3), navy: f.calf('#273252', 4), grey: f.grained('#8a8580', 5), bordeaux: f.calf('#5a1f26', 6),
    quiltBlack: f.quilted('#1b1a19'), quiltCream: f.quilted('#e6ddcc'), quiltNavy: f.quilted('#273252'), oblique: m.obliqueCanvas, suedeTaupe: f.suede('#9a8a78'),
    patentBlack: f.patent('#141313'), patentNude: f.patent('#d3b3a0'), patentRed: f.patent('#8e1b2b'), whiteCalf: f.calf('#f1efe9', 7),
  }
  const C = {
    white: f.cotton('#f3f1ec', 1), sky: f.cotton('#cfdbe6', 2), blackCotton: f.cotton('#232325', 3), stripe: f.cotton('#dfe6ee', 4),
    charcoal: f.wool('#2a2b2f', 1), navy: f.wool('#1f2740', 2, '#4a5470'), camel: f.wool('#b89468', 3, '#d8bb92'), greyWool: f.wool('#6f6e6c', 4), ivoryWool: f.wool('#e7e0d2', 5, '#f6f1e8'),
    knitCream: f.knit('#e9e2d4', 1), knitGrey: f.knit('#8c8984', 2), knitNavy: f.knit('#2c3550', 3), knitBlack: f.knit('#232222', 4),
    teeWhite: f.jersey('#f4f2ee', 1), teeBlack: f.jersey('#1f1f21', 2), teeNavy: f.jersey('#2a3350', 3), teeGrey: f.jersey('#a9a6a1', 4),
    indigo: f.denim('#2b3a5c', 0.35, 1), blackDenim: f.denim('#242428', 0.1, 2), lightDenim: f.denim('#5d7599', 0.55, 3), ecru: f.denim('#d9cfbd', 0.2, 4),
  }
  const hide = f.hide('#efe6d8')
  const boucle = f.boucle('#ece6da')
  const suitShoe: ShoeOpts = { sole: lux.leatherBlack }
  const sneakerWhite: ShoeOpts = { cap: L.oblique, lace: lux.plaster, sole: m.sole }
  const sneakerBlack: ShoeOpts = { cap: L.oblique, lace: lux.blackSteel, sole: m.sole }

  /* ---------- floor ---------- */
  for (const r of u.rects) flat(g, clipped(e, r), Y + 0.006, m.botticino, false, [], 'dior_stone')
  const carpet: [number, number][] = [[-15.85, -0.6], [-7.2, -0.6], [-7.2, 3.0], [-11.3, 3.0], [-11.3, 10.9], [-14.35, 10.9], [-15.85, 9.4]]
  flat(g, carpet, Y + 0.0075, m.obliqueCarpet, false, [], 'dior_carpet')
  for (let i = 0; i < carpet.length; i++) {
    const a = carpet[i]
    const b = carpet[(i + 1) % carpet.length]
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    const gg = at(g, (a[0] + b[0]) / 2, Y + 0.0078, (a[1] + b[1]) / 2, Math.atan2(b[0] - a[0], b[1] - a[1]))
    k.box(gg, 0.012, 0.002, len, mm.champagne, 0, 0, 0, false)
  }

  /* ---------- the shopfront, on x = −6.6 from z = −1 to 3.4, the doors at z = 0 … 2.4 ---------- */
  const FX = -6.6
  box(s, FX - 0.075, FX + 0.075, Y + 4.2, soffit, -1.0, 3.4, mm.wallPaint)
  const F0 = FX - 0.32
  const F1 = FX + 0.06
  mbox(g, F1 - F0, 0.95, 4.44, m.fiorDiBosco, (F0 + F1) / 2, Y + 3.25 + 0.475, 1.2)
  for (const [a, b] of [[-1.02, -0.68], [3.08, 3.42]]) mbox(g, F1 - F0, 3.25, b - a, m.fiorDiBosco, (F0 + F1) / 2, Y + 1.625, (a + b) / 2)
  box(s, F0, F1, Y + 4.2, Y + 4.21, -1.02, 3.42, mm.champagne, false)
  brandSign(s, g, letters(s, 'DIOR', 'dior', '#fffaf0', 512, 128), 2.1, 0.525, F1 + 0.004, Y + 3.73, 1.2, PI / 2)
  const frame = lux.bronze
  box(s, FX - 0.05, FX + 0.05, Y + 3.19, Y + 3.25, -0.68, 3.08, frame)
  box(s, FX - 0.04, FX + 0.04, Y, Y + 0.02, -0.68, 3.08, frame, false)
  for (const z of [-0.65, -0.03, 2.43, 3.05]) box(s, FX - 0.05, FX + 0.05, Y, Y + 3.19, z - 0.03, z + 0.03, frame)
  box(s, FX - 0.05, FX + 0.05, Y + 2.62, Y + 2.68, -0.03, 2.43, frame)
  box(s, FX - 0.15, FX + 0.15, Y, Y + 0.008, 0, 2.4, frame, false)
  pane(s, g, FX, -0.62, FX, -0.06, Y + 0.02, Y + 3.19)
  pane(s, g, FX, 2.46, FX, 3.02, Y + 0.02, Y + 3.19)
  pane(s, g, FX, 0.0, FX, 2.4, Y + 2.68, Y + 3.19)
  const right = at(g, FX, Y, 0.0, -PI / 2)
  swingLeaf(s, right, 'dior_r', 1.19, 2.6, frame, -PI / 2, true)
  const left = at(g, FX, Y, 2.4, PI / 2)
  swingLeaf(s, left, 'dior_l', 1.19, 2.6, frame, PI / 2, true)
  e.shade.foot(FX + 0.07, -1.0, FX + 0.07, 3.4, Y + 0.01, 0.2, 0.25)

  /* ---------- the display windows either side of the doors ---------- */
  const windowBox = (z0: number, z1: number, s0: number, s1: number) => {
    box(s, -7.5, FX - 0.06, Y, Y + HW, s0, s1, m.cream)
    mbox(g, 0.08, HW, z1 - z0, m.cannage, -7.54, Y + HW / 2, (z0 + z1) / 2)
    box(s, -7.58, FX, Y + HW, Y + HW + 0.08, z0, z1, m.cream)
    for (const z of [z0 + 0.3, z1 - 0.3]) k.cyl(g, 0.04, 0.04, 0.006, lux.blackSteel, -7.1, Y + HW - 0.003, z, 16)
    for (const z of [z0 + 0.3, z1 - 0.3]) k.cyl(g, 0.022, 0.022, 0.004, led, -7.1, Y + HW - 0.0045, z, 12)
    box(s, -7.58, FX, Y, Y + 0.05, z0, z1, m.creamLacquer)
  }
  windowBox(-1.0, -0.12, -0.12, -0.04)
  windowBox(2.52, 3.4, 2.44, 2.52)
  figure(s, g, { jacket: C.charcoal, shirt: C.white, trousers: C.charcoal, shoes: L.black }, -7.05, Y + 0.05, -0.56, PI / 2 + 0.1)
  {
    const sg = at(g, -7.5, Y + 0.05, 2.95, PI / 2)
    const w = 0.8
    for (const sy of [0.5, 1.05, 1.6, 2.15]) {
      k.box(sg, w, 0.025, 0.32, mm.champagne, 0, sy, 0.17)
      k.box(sg, w - 0.1, 0.006, 0.01, led, 0, sy - 0.016, 0.3, false)
    }
    for (const sx of [-w / 2, w / 2]) k.box(sg, 0.025, 2.2, 0.025, mm.champagne, sx, 1.1, 0.33)
    cap(s, sg, L.oblique, -0.2, 2.1625, 0.17, 0.4)
    wallet(s, sg, L.black, 0.18, 2.1625, 0.17, 0, true, lux.steel)
    bag(s, sg, 'ladyDior', L.quiltBlack, 0.0, 1.6125, 0.17, 0.1, { metal: lux.steel })
    shoePair(s, sg, 'sneaker', L.whiteCalf, 0.0, 1.0625, 0.17, 0.25, sneakerWhite)
    bag(s, sg, 'tote', L.oblique, 0.0, 0.0, 0.2, 0.0, { trim: L.black, lining: L.navy })
    bag(s, sg, 'saddle', L.tan, 0.0, 0.5125, 0.19, -0.2)
  }

  /* ---------- walls: the window backs along the façade, the window off the salon, linings ---------- */
  mbox(g, 0.1, HW, 10.6, m.cannage, WX - 0.05, Y + HW / 2, 4.3)
  box(s, WX - 0.1, WX, Y + HW, soffit, -1.0, 9.6, mm.wallPaint)
  const ch = at(g, (WX + -14.5) / 2, Y, (9.6 + WZ) / 2, PI / 4)
  const chLen = Math.hypot(1.7, 1.7)
  mbox(ch, 0.1, HW, chLen, m.cannage, -0.05, HW / 2, 0)
  k.box(ch, 0.1, soffit - Y - HW, chLen, mm.wallPaint, -0.05, HW + (soffit - Y - HW) / 2, 0)
  mbox(g, 3.5, HW, 0.1, m.cannage, -12.75, Y + HW / 2, WZ - 0.05)
  box(s, -14.5, -11.0, Y + HW, soffit, WZ - 0.1, WZ, mm.wallPaint)
  mbox(g, 0.1, 2.15, 0.3, m.cannage, -10.95, Y + 1.075, 9.15)
  mbox(g, 0.1, 2.15, 1.1, m.cannage, -10.95, Y + 1.075, 10.75)
  mbox(g, 0.1, HW - 2.15, 2.3, m.cannage, -10.95, Y + 2.15 + (HW - 2.15) / 2, 10.15)
  box(s, -11.0, -10.9, Y + HW, soffit, 9.0, WZ, mm.wallPaint)
  {
    const hinge = at(g, -10.95, Y, 9.3, -PI / 2)
    const leaf = new Group()
    leaf.name = 'door_dior_window'
    leaf.userData.label = 'Window access door'
    leaf.userData.openAngle = PI / 2
    hinge.add(leaf)
    const panel = k.box(leaf, 0.88, 2.1, 0.04, m.cream, 0.44, 1.05, 0)
    panel.userData.front = true
    k.box(leaf, 0.02, 0.1, 0.05, mm.champagne, 0.8, 1.0, 0)
  }
  skirting(s, g, -7.5, -0.925, WX, -0.925, lux.wallNero)
  skirting(s, g, -10.975, 3.4, -10.975, 9.0, lux.wallNero)
  skirting(s, g, -10.9, 3.325, -7.5, 3.325, lux.wallNero)
  skirting(s, g, WX, -0.6, WX, 9.6, lux.wallNero)

  /* ---------- ceilings: cream, flat, a round cove over the salon; the windows' lower ceilings; track spots ---------- */
  const shopCeiling: [number, number][] = [[WX, -1.0], [FX, -1.0], [FX, 3.4], [-10.9, 3.4], [-10.9, WZ], [-14.5, WZ], [WX, 9.6]]
  const coveC: [number, number] = [-13.55, 7.35]
  flat(g, shopCeiling, Y + H, mm.gypsum, true, [circle(coveC[0], coveC[1], 1.8, 56)], 'dior_ceiling')
  lightCove(s, g, circle(coveC[0], coveC[1], 1.8, 56), Y + H, 0.22, coveGlow, coveGlow, mm.champagne)
  const ring = mesh(g, new CylinderGeometry(1.78, 1.78, 0.012, 56, 1, true), led, coveC[0], Y + H + 0.02, coveC[1], false)
  ;(ring.material as Material).side = 2
  downlights(s, g, -15.6, 0.3, -7.6, 0.3, 5, Y + H)
  downlights(s, g, -15.6, 2.3, -8.0, 2.3, 5, Y + H)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * PI * 2 + PI / 8
    downlights(s, g, coveC[0] + Math.cos(a) * 2.45, coveC[1] + Math.sin(a) * 2.45, coveC[0] + Math.cos(a) * 2.45, coveC[1] + Math.sin(a) * 2.45, 1, Y + H)
  }
  trackSpots(s, g, -15.6, -0.2, -8.2, -0.2, Y + H, 6, led, PI, 0.75)
  trackSpots(s, g, WX + 0.75, 3.6, WX + 0.75, 9.2, Y + H, 5, led, -PI / 2, 0.75)
  trackSpots(s, g, -14.3, WZ - 0.85, -11.2, WZ - 0.85, Y + H, 3, led, 0, 0.75)
  trackSpots(s, g, -10.975 - 0.75, 3.7, -10.975 - 0.75, 8.8, Y + H, 4, led, PI / 2, 0.75)
  const southWin = clipped(e, [-17.06, WX, -1.0, 9.6])
  const cornerWin = clipHalf(clipped(e, [-17.06, -14.5, 9.6, 12.2]), -1, 1, -25.8)
  const frontWin = clipped(e, [-14.5, -10.9, WZ, 12.2])
  const r3 = clipped(e, [-10.9, -6.6, 9.0, 12.2])
  for (const poly of [southWin, cornerWin, frontWin, r3]) if (poly.length > 2) flat(g, poly, Y + HW, m.cream, true, [], 'dior_window_ceiling')
  for (const [x, z] of [[-16.6, 0.6], [-16.6, 2.5], [-16.6, 4.5], [-16.6, 6.5], [-16.6, 8.4], [-15.4, 11.0], [-13.6, 11.75], [-11.8, 11.75], [-9.8, 11.0], [-8.6, 9.8]]) {
    k.cyl(g, 0.04, 0.04, 0.006, lux.blackSteel, x, Y + HW - 0.003, z, 16)
    k.cyl(g, 0.022, 0.022, 0.004, led, x, Y + HW - 0.0045, z, 12)
  }

  /* ---------- the entrance gallery: leather goods, a rail of shirts and tees, folded knits and jeans, accessories ---------- */
  const tiers = [0.62, 1.1, 1.55, 2.0]
  const shelf = (x: number, z: number, yaw: number, len: number, heights = tiers, top = 2.5, depth = 0.42) => shelfWall(s, g, x, z, yaw, len, depth, heights, top, mm.champagne, m.creamLacquer, backlit, led, m.creamLacquer)
  const rail = (x: number, z: number, yaw: number, len: number) => hangingBay(s, g, x, z, yaw, len, 0.48, 1.78, 2.5, m.creamLacquer, m.creamLacquer, backlit, led, lux.brass)
  {
    const w = shelf(-14.8, -0.925, 0, 2.4)
    bag(s, w.g, 'ladyDior', L.quiltBlack, -0.75, w.shelfY(3), 0.2, 0.1)
    bag(s, w.g, 'tote', L.oblique, 0.45, w.shelfY(3), 0.2, -0.1, { trim: L.black, lining: L.navy })
    bag(s, w.g, 'saddle', L.tan, -0.7, w.shelfY(2), 0.2, 0.15)
    bag(s, w.g, 'flap', L.navy, 0.2, w.shelfY(2), 0.2, -0.1)
    bag(s, w.g, 'clutch', L.bordeaux, 0.9, w.shelfY(2), 0.2, 0.2)
    bag(s, w.g, 'ladyDior', L.quiltCream, -0.75, w.shelfY(1), 0.2, -0.1)
    bag(s, w.g, 'bucket', L.cream, 0.5, w.shelfY(1), 0.2, 0.2, { trim: L.tan })
    bag(s, w.g, 'tote', L.cream, -0.6, w.shelfY(0), 0.2, 0.05, { trim: L.tan, lining: L.tan })
    bag(s, w.g, 'saddle', L.quiltNavy, 0.6, w.shelfY(0), 0.2, -0.15)
  }
  {
    const r = rail(-12.35, -0.925, 0, 2.5)
    hangRun(s, r.g, [['shirt', C.white], ['shirt', C.sky], ['tee', C.teeWhite], ['shirt', C.stripe], ['knit', C.knitCream], ['tee', C.teeBlack], ['shirt', C.blackCotton, { buttons: lux.blackSteel }]], -1.05, r.railY, r.depth * 0.55, 0.35, 3)
  }
  {
    const w = shelf(-10.2, -0.925, 0, 1.8, [0.62, 1.05, 1.5, 1.95], 2.5)
    foldedStack(s, w.g, [C.indigo, C.blackDenim, C.lightDenim, C.indigo], 0.34, 0.3, -0.42, w.shelfY(3), 0.21, 0.02, 1)
    foldedStack(s, w.g, [C.ecru, C.indigo, C.blackDenim], 0.34, 0.3, 0.42, w.shelfY(3), 0.21, -0.03, 2)
    foldedStack(s, w.g, [C.knitCream, C.knitGrey, C.knitNavy, C.knitBlack], 0.32, 0.28, -0.42, w.shelfY(2), 0.21, 0.01, 3)
    foldedStack(s, w.g, [C.teeWhite, C.teeGrey, C.teeNavy, C.teeBlack, C.teeWhite], 0.3, 0.26, 0.42, w.shelfY(2), 0.21, -0.02, 4)
    shoePair(s, w.g, 'sneaker', L.whiteCalf, -0.45, w.shelfY(1), 0.2, 0.2, sneakerWhite)
    shoePair(s, w.g, 'runner', L.grey, 0.45, w.shelfY(1), 0.2, -0.2, { cap: lux.plaster, sole: m.sole })
    foldedStack(s, w.g, [C.lightDenim, C.indigo, C.ecru], 0.34, 0.3, -0.42, w.shelfY(0), 0.21, 0.0, 5)
    foldedStack(s, w.g, [C.charcoal, C.camel, C.greyWool], 0.34, 0.3, 0.42, w.shelfY(0), 0.21, 0.0, 6)
  }
  {
    const w = shelf(-8.6, -0.925, 0, 1.4)
    for (let i = 0; i < 3; i++) cap(s, w.g, [L.oblique, L.black, C.knitCream][i], -0.42 + i * 0.42, w.shelfY(3), 0.2, (i - 1) * 0.3)
    for (let i = 0; i < 4; i++) wallet(s, w.g, [L.black, L.oblique, L.navy, L.tan][i], -0.45 + i * 0.3, w.shelfY(2), 0.2, 0, true, lux.brass, i % 2 === 0)
    for (let i = 0; i < 3; i++) belt(s, w.g, [L.black, L.tan, L.navy][i], -0.42 + i * 0.42, w.shelfY(1), 0.2)
    for (let i = 0; i < 5; i++) scent(s, w.g, -0.5 + i * 0.25, w.shelfY(0), 0.22, 0.13, i % 2 ? (lux.amberGlass as Material) : undefined)
  }
  // Women's footwear on the gallery's west wall.
  {
    const w = shelf(WX, 1.2, PI / 2, 3.4, [0.45, 0.9, 1.35, 1.8, 2.25], 2.6, 0.38)
    const rows: [Material[], ShoeStyle][] = [
      [[L.patentBlack, L.patentNude, L.patentRed, L.whiteCalf], 'pump'],
      [[L.suedeTaupe, L.black, L.tan, L.bordeaux], 'boot'],
      [[L.patentNude, L.patentBlack, L.cream, L.patentRed], 'pump'],
      [[L.black, L.tan, L.suedeTaupe, L.navy], 'loafer'],
      [[L.whiteCalf, L.cream, L.tan, L.black], 'sandal'],
    ]
    rows.forEach(([mats, style], tier) => {
      for (let i = 0; i < 4; i++) {
        const ux = -1.25 + i * 0.8
        if (style === 'pump') {
          shoe(s, w.g, 'pump', mats[i], ux - 0.07, w.shelfY(4 - tier), 0.06, 0.3, suitShoe)
          shoe(s, w.g, 'pump', mats[i], ux + 0.06, w.shelfY(4 - tier), 0.04, 0.12, { ...suitShoe, right: true })
        } else shoePair(s, w.g, style, mats[i], ux, w.shelfY(4 - tier), 0.17, 0.25, suitShoe)
      }
    })
  }
  cashDesk(s, g, 'dior_till', -9.2, 2.5, PI, 2.2, m.creamLacquer, m.fiorDiBosco, mm.champagne, led)
  brandSign(s, g, letters(s, 'DIOR', 'dior', '#c9a86a', 512, 128), 1.1, 0.275, -9.2, Y + 2.05, 3.325 - 0.002, PI)
  {
    const t = at(g, -12.6, Y, 1.0, 0)
    k.box(t, 2.2, 0.66, 0.7, m.creamLacquer, 0, 0.33, 0)
    k.box(t, 2.4, 0.06, 0.9, m.oakLight, 0, 0.69, 0)
    e.shade.rect(-12.6, Y + 0.012, 1.0, 2.4, 0.9, 0, 0.38)
    foldedStack(s, t, [C.indigo, C.lightDenim, C.blackDenim, C.indigo, C.ecru], 0.36, 0.32, -0.9, 0.72, 0.12, 0.05, 7)
    foldedStack(s, t, [C.blackDenim, C.indigo, C.lightDenim], 0.36, 0.32, -0.9, 0.72, -0.2, -0.03, 8)
    foldedStack(s, t, [C.teeWhite, C.teeBlack, C.teeGrey, C.teeNavy], 0.3, 0.26, -0.3, 0.72, 0.08, 0.1, 9)
    foldedStack(s, t, [C.knitGrey, C.knitCream, C.knitNavy], 0.32, 0.28, -0.3, 0.72, -0.22, -0.08, 10)
    shoePair(s, t, 'sneaker', L.black, 0.35, 0.72, 0.0, -0.6, sneakerBlack)
    bag(s, t, 'ladyDior', L.quiltBlack, 0.95, 0.72, 0.05, 0.4)
    cap(s, t, L.black, 0.95, 0.72, -0.28, 1.4)
  }

  /* ---------- the salon: ready-to-wear and leather goods under the cove ---------- */
  {
    const r = rail(WX, 4.9, PI / 2, 2.8)
    hangRun(s, r.g, [['dress', C.ivoryWool, { inner: L.black }], ['jacket', C.camel, { inner: C.white }], ['dress', C.navy, { inner: L.tan }], ['knit', C.knitCream], ['trousers', C.charcoal], ['coat', C.greyWool, { inner: C.white }], ['shirt', C.white]], -1.2, r.railY, r.depth * 0.55, 0.38, 11)
    const w = shelf(WX, 7.8, PI / 2, 3.0)
    bag(s, w.g, 'ladyDior', L.quiltNavy, -0.95, w.shelfY(3), 0.2, 0.1)
    bag(s, w.g, 'saddle', L.cream, 0.0, w.shelfY(3), 0.2, -0.1, { trim: L.tan })
    bag(s, w.g, 'flap', L.grey, 0.95, w.shelfY(3), 0.2, 0.15)
    bag(s, w.g, 'tote', L.oblique, -0.85, w.shelfY(2), 0.2, 0.0, { trim: L.navy, lining: L.navy })
    bag(s, w.g, 'bucket', L.tan, 0.3, w.shelfY(2), 0.2, 0.2, { trim: L.black })
    bag(s, w.g, 'clutch', L.quiltBlack, 1.0, w.shelfY(2), 0.2, -0.2)
    bag(s, w.g, 'ladyDior', L.quiltCream, -0.9, w.shelfY(1), 0.2, -0.05)
    bag(s, w.g, 'saddle', L.bordeaux, 0.1, w.shelfY(1), 0.2, 0.1)
    for (let i = 0; i < 3; i++) wallet(s, w.g, [L.cream, L.navy, L.tan][i], 0.75 + i * 0.26, w.shelfY(1), 0.22, 0, true)
    bag(s, w.g, 'tote', L.black, -0.8, w.shelfY(0), 0.2, 0.1, { trim: L.black, lining: L.tan })
    bag(s, w.g, 'flap', L.quiltBlack, 0.4, w.shelfY(0), 0.2, -0.1)
    belt(s, w.g, L.black, 1.1, w.shelfY(0), 0.2)
  }
  {
    const w = shelf(-12.75, WZ - 0.1, PI, 3.4, [0.5, 0.95, 1.4, 1.85, 2.3], 2.75, 0.36)
    const rows: [ShoeStyle, Material[], ShoeOpts][] = [
      ['sneaker', [L.whiteCalf, L.black, L.whiteCalf, L.grey], sneakerWhite],
      ['runner', [L.grey, L.navy, L.whiteCalf, L.black], { cap: lux.plaster, sole: m.sole }],
      ['derby', [L.black, L.tan, L.bordeaux, L.black], suitShoe],
      ['loafer', [L.black, L.suedeTaupe, L.tan, L.navy], suitShoe],
      ['boot', [L.black, L.tan, L.suedeTaupe, L.black], suitShoe],
    ]
    rows.forEach(([style, mats, o], tier) => {
      for (let i = 0; i < 4; i++) shoePair(s, w.g, style, mats[i], -1.25 + i * 0.82, w.shelfY(4 - tier), 0.16, 0.1 + (i % 2) * 0.2, o)
    })
  }
  {
    const r = rail(-10.975, 5.0, -PI / 2, 2.8)
    hangRun(s, r.g, [['jacket', C.navy, { inner: C.white }], ['jacket', C.charcoal, { inner: C.sky }], ['trousers', C.navy], ['coat', C.camel, { inner: C.white }], ['jacket', C.greyWool, { inner: C.white }], ['trousers', C.indigo], ['shirt', C.sky], ['knit', C.knitNavy]], -1.25, r.railY, r.depth * 0.55, 0.35, 12)
  }
  box(s, -10.975, -10.955, Y + 0.1, Y + 2.5, 6.8, 7.8, lux.mirror, false)
  box(s, -10.975, -10.945, Y + 0.08, Y + 0.1, 6.78, 7.82, mm.champagne, false)
  box(s, -10.975, -10.945, Y + 2.5, Y + 2.52, 6.78, 7.82, mm.champagne, false)
  for (const z of [6.78, 7.8]) box(s, -10.975, -10.945, Y + 0.1, Y + 2.5, z, z + 0.02, mm.champagne, false)
  {
    // A freestanding brass rail in the entrance gallery, between the shoe wall and the oak table.
    const rl = clothesRail(s, g, -14.85, 1.35, PI / 2, 1.5, 1.62, lux.brass)
    hangRun(s, rl, [['jacket', C.camel, { inner: C.white }], ['shirt', C.white], ['tee', C.teeNavy], ['shirt', C.stripe], ['knit', C.knitGrey]], -0.56, 1.62, 0, 0.28, 13, true)
  }
  {
    const niche = at(g, -15.35 + 0.05, Y, 10.45 - 0.05, PI / 4)
    k.box(niche, 0.03, 2.2, 1.6, backlit, 0.015, 1.5, 0, false)
    for (const sz of [-0.82, 0.82]) k.box(niche, 0.08, 2.3, 0.04, mm.champagne, 0.04, 1.5, sz)
    k.box(niche, 0.08, 0.04, 1.68, mm.champagne, 0.04, 2.63, 0)
    k.box(niche, 0.5, 0.8, 0.5, m.creamLacquer, 0.3, 0.4, 0)
    bag(s, niche, 'ladyDior', L.quiltBlack, 0.3, 0.8, 0.0, PI / 2)
  }
  {
    const tg = drumTable(s, g, coveC[0], coveC[1], 0.65, 0.74, m.creamLacquer, m.oakLight)
    bag(s, tg, 'ladyDior', L.quiltCream, -0.3, 0.74, 0.15, 0.5)
    bag(s, tg, 'saddle', L.navy, 0.32, 0.74, 0.18, -0.6)
    bag(s, tg, 'flap', L.tan, 0.1, 0.74, -0.32, 2.6)
    shoe(s, tg, 'pump', L.patentBlack, -0.22, 0.74, -0.18, 2.4, suitShoe)
    branches(s, tg, 0, 0.74, 0, 0.6, 5)
  }
  diorSofa(s, g, coveC[0], coveC[1] + 2.15, PI, 1.9, boucle, f.velvet('#b9a07a'))
  // Two club chairs angled in at the sofa's ends, a travertine side table beside one.
  diorClubChair(s, g, -15.0, 8.55, Math.atan2(coveC[0] + 15.0, coveC[1] - 8.55), hide)
  diorClubChair(s, g, -12.1, 8.55, Math.atan2(coveC[0] + 12.1, coveC[1] - 8.55), hide)
  {
    const t = at(g, -15.05, Y, 9.65, 0)
    mesh(t, new CylinderGeometry(0.2, 0.2, 0.5, 32), lux.travertine, 0, 0.25, 0)
    e.shade.pool(-15.05, Y + 0.012, 9.65, 0.28, 0.28, 0.35)
  }
  const v = vitrine(s, g, 'dior_vitrine', -10.975 - 0.3, 8.45, -PI / 2, 1.0, 0.5, 1.1, [0.45, 0.8], mm.champagne, m.creamLacquer, led, 0.75)
  for (let i = 0; i < 3; i++) scent(s, v.g, -0.3 + i * 0.3, v.shelfY(0), 0.0, 0.11, i === 1 ? (lux.amberGlass as Material) : undefined)
  for (let i = 0; i < 3; i++) wallet(s, v.g, [L.tan, L.navy, L.cream][i], -0.3 + i * 0.3, v.shelfY(1), 0.0, 0, true, lux.brass, i !== 1)
  belt(s, v.g, L.black, -0.25, v.shelfY(2), 0.0)
  belt(s, v.g, L.tan, 0.2, v.shelfY(2), 0.0)

  /* ---------- the façade windows ---------- */
  figure(s, g, { jacket: C.camel, shirt: C.knitCream, trousers: C.charcoal, shoes: L.black }, -16.6, Y + 0.006, 0.8, -PI / 2)
  figure(s, g, { jacket: C.navy, shirt: C.white, trousers: C.navy, shoes: L.black }, -16.6, Y + 0.006, 5.6, -PI / 2 + 0.3)
  plinth(s, g, -16.62, 2.4, 0, 0.5, 0.5, 0.5, m.creamLacquer)
  bag(s, g, 'ladyDior', L.quiltBlack, -16.62, Y + 0.5, 2.4, -PI / 2)
  plinth(s, g, -16.62, 3.4, 0, 0.5, 0.5, 0.9, m.creamLacquer)
  bag(s, g, 'tote', L.oblique, -16.62, Y + 0.9, 3.4, -PI / 2, { trim: L.black, lining: L.navy })
  plinth(s, g, -16.62, 7.4, 0, 0.5, 0.5, 0.7, m.creamLacquer)
  bag(s, g, 'saddle', L.cream, -16.62, Y + 0.7, 7.4, -PI / 2, { trim: L.tan })
  plinth(s, g, -16.62, 8.6, 0, 0.5, 0.5, 0.45, m.creamLacquer)
  bag(s, g, 'ladyDior', L.quiltNavy, -16.62, Y + 0.45, 8.6, -PI / 2)
  figure(s, g, { jacket: C.ivoryWool, shirt: C.white, trousers: C.ivoryWool, shoes: L.patentNude, dress: C.ivoryWool }, -15.6, Y + 0.006, 10.9, -PI / 4)
  plinth(s, g, -13.0, 11.75, 0, 0.6, 0.5, 0.8, m.creamLacquer)
  bag(s, g, 'ladyDior', L.quiltBlack, -13.0, Y + 0.8, 11.75, 0)
  plinth(s, g, -11.9, 11.75, 0, 0.5, 0.5, 0.55, m.creamLacquer)
  shoe(s, g, 'pump', L.patentRed, -11.97, Y + 0.55, 11.58, 0.3, suitShoe)
  shoe(s, g, 'pump', L.patentRed, -11.84, Y + 0.55, 11.6, -0.15, { ...suitShoe, right: true })
  figure(s, g, { jacket: C.charcoal, shirt: C.white, trousers: C.charcoal, shoes: L.black }, -9.9, Y + 0.006, 10.9, PI / 8)
  figure(s, g, { jacket: C.knitGrey, shirt: C.teeWhite, trousers: C.indigo, shoes: L.whiteCalf }, -8.4, Y + 0.006, 10.2, PI / 4)
  plinth(s, g, -10.3, 9.7, 0, 0.6, 0.5, 0.7, m.creamLacquer)
  bag(s, g, 'tote', L.oblique, -10.3, Y + 0.7, 9.7, PI / 2, { trim: L.tan, lining: L.tan })
  brandSign(s, g, letters(s, 'DIOR', 'dior', '#2a2522', 512, 128), 1.6, 0.4, -10.88, Y + 2.3, 10.15, PI / 2)
  for (const [x, z, yaw] of [[-10.0, 11.6, 0], [-8.2, 11.1, PI / 4]] as const) plinth(s, g, x, z, yaw, 0.5, 0.5, 0.4, m.creamLacquer)
  shoePair(s, g, 'sneaker', L.whiteCalf, -10.0, Y + 0.4, 11.6, 0.2, sneakerWhite)
  bag(s, g, 'saddle', L.tan, -8.2, Y + 0.4, 11.1, PI / 4)

  /* ---------- lighting ---------- */
  lamp(s, -11.8, Y + 3.4, 1.2, 9, 9)
  lamp(s, coveC[0], Y + 3.45, coveC[1], 10, 9.5)
  lamp(s, -16.6, Y + 3.0, 4.5, 4, 5.5)
  lamp(s, -9.5, Y + 3.0, 10.8, 4, 5.5)
  lightSwitch(s, -7.1, 2.4 - 0.042, PI, 'dior')
  return s
}
