import { CircleGeometry, CylinderGeometry, Group, LatheGeometry, MeshStandardMaterial, PlaneGeometry, PointLight, SphereGeometry, TorusGeometry, Vector2, type Material, type Mesh, type Object3D } from 'three'
import { useInfoStore, type EquipmentInfo } from '../../../../../../../store/info'
import { circuit, setCircuit, switchPlate } from '../../../kalakalD65/fixtures'
import { diningChair, rug, sofa } from '../furniture'
import { clipped, type FloorCtx } from '../shell'
import type { Unit } from '../units'
import { button, info, play } from './cafe'
import { blooms, bowl, candlestick, clock, cushion, decorMaterials, frame, lantern, lidBox, orb, pampas, pottedPlant, ribbonSculpture, ringsSculpture, tableLamp, vase } from './decorGoods'
import { trackSpots } from './goods'
import { at, box, brandSign, downlights, flat, lamp, letters, mesh, onCircuit, openShop, pane, PI, swingLeaf } from './kit'

/*
 * Aurum Home, unit 1-08: the home décor house on the first floor, off the east spine, 6.6 m deep
 * and 6 m wide. Built from the reference, looking in from the door:
 *
 *   left      walnut slat panels either side of a deep green feature wall lettered in brass
 *             ("Design your space, reflect your style"), a walnut credenza before it lit along
 *             its foot, dressed with a lamp, pampas in a brass vase, brass bottles and frames; in
 *             the foreground a cream sofa with velvet cushions and a round black-marble table on
 *             a brass frame, on a grey rug
 *   middle    the two-tier white lacquer display table on brass, on a rug: a great urn of white
 *             blooms, lamps, black and gold vases, lanterns; cushions and lanterns below
 *   back      a walnut dining table on brass with cream chairs under amber glass bell pendants, a
 *             round brass mirror, a black étagère of glass shelves, a wall clock
 *   right     black steel shelving with lit white shelves the length of the wall, each piece
 *             given its space; brass lanterns on the floor; the cash desk by the door
 *   ceiling   charcoal, black tracks of spots, downlights, a warm wash down the green wall
 *   floor     wide light-oak boards
 *
 * Every product explains itself (category, material, size, colour, price), turns in its card to be
 * looked at, and goes into the bag; the credenza's doors and the desk's drawer open; the table
 * lamps switch on and off; the clock tells the time; the till takes the bag through; two switches
 * by the door work the lights and the display lighting.
 */

const FX = 11.3
const BK = 17.86
const ZL = -15.925
const ZR = -9.875
const ZC = (ZL + ZR) / 2
const H = 3.45

/* ---------- the catalogue ---------- */

interface Item {
  name: string
  cat: string
  material: string
  size: string
  colour: string
  price: number
  note: string
}

const rupees = (n: number) => `₹ ${n.toLocaleString('en-IN')}`
interface Line {
  name: string
  qty: number
  total: number
}
const bag: Line[] = []

function card(d: Item, inspect: () => Object3D): Omit<EquipmentInfo, 'place'> {
  return {
    title: d.name,
    kind: `${d.cat} · Aurum Home`,
    body: `${d.note} Drag it to turn it; scroll or pinch to look closer.`,
    specs: [`Material: ${d.material}`, `Size: ${d.size}`, `Colour: ${d.colour}`, `${rupees(d.price)}`],
    inspect,
    choices: { label: 'Quantity', options: ['1', '2', '3', '4'] },
    action: {
      label: 'Add to bag',
      run: (q) => {
        if (!q) return 'Choose a quantity first.'
        bag.push({ name: d.name, qty: Number(q), total: Number(q) * d.price })
        const n = bag.reduce((a, l) => a + l.qty, 0)
        return `Added ${q} × ${d.name}. ${n} ${n === 1 ? 'piece' : 'pieces'} in your bag: pay at the desk by the door.`
      },
    },
  }
}

function checkout(): Omit<EquipmentInfo, 'place'> {
  const total = bag.reduce((a, l) => a + l.total, 0)
  return {
    title: 'The Cash Desk',
    kind: 'Aurum Home · Checkout',
    body: bag.length ? 'Each piece is checked with you, wrapped in tissue and boxed; larger pieces are delivered across Hyderabad within two days.' : 'Your bag is empty. Tap any piece in the shop, choose a quantity and add it to the bag; then pay here.',
    specs: bag.length ? [...bag.map((l) => `${l.qty} × ${l.name} · ${rupees(l.total)}`), `Total ${rupees(total)} (incl. GST)`] : ['Cards, UPI and wallets', 'Gift wrapping, free', 'Delivery across the city'],
    action: bag.length
      ? {
          label: `Pay ${rupees(total)}`,
          run: () => {
            bag.length = 0
            return 'Paid, thank you. Your pieces are being wrapped; your receipt is on its way by SMS.'
          },
        }
      : undefined,
  }
}

export function buildDecorStore(e: FloorCtx, u: Unit) {
  const s = openShop(e, u)
  const { k, lux } = e
  const { g, y: Y } = s
  const m = decorMaterials(e)
  const soffit = e.soffit

  // Two circuits: the shop's lights, and its display lighting (shelf strips, the wall wash, the pendants).
  const display = circuit()
  const glowOf = (mat: MeshStandardMaterial) => {
    const n = mat.clone()
    n.userData.interior = true
    display.glows.push(n)
    return n
  }
  const led = glowOf(lux.led as MeshStandardMaterial)
  const amber = glowOf(m.amberGlass as unknown as MeshStandardMaterial)
  const spot = onCircuit(s, lux.led as MeshStandardMaterial)

  /** A product: built in place, explaining itself, rebuilt in the card to be turned. */
  const item = (par: Object3D, make: (p: Object3D) => Object3D, d: Item, x: number, y: number, z: number, yaw = 0) => {
    const holder = at(par, x, y, z, yaw)
    make(holder)
    info(s, holder, card(d, () => {
      const p = new Group()
      make(p)
      return p
    }), 0.004)
    return holder
  }

  /* ---------- floor, walls, ceiling ---------- */
  flat(g, clipped(e, u.rects[0]), Y + 0.006, m.oak, false, [], 'aurum_floor')
  box(s, BK, BK + 0.1, Y, soffit, ZL - 0.075, ZR + 0.075, m.warmWall)
  box(s, FX + 0.3, BK, Y, soffit, ZL - 0.02, ZL, m.warmWall)
  box(s, FX + 0.3, BK, Y, soffit, ZR, ZR + 0.02, m.warmWall)
  for (const [x0, z0, x1, z1] of [[FX + 0.3, ZL, BK, ZL], [BK, ZR, FX + 0.3, ZR], [BK, ZL, BK, ZR]] as const) e.shade.foot(x0, z0, x1, z1, Y + 0.01, 0.22, 0.3)
  flat(g, [[FX, ZL - 0.075], [BK, ZL - 0.075], [BK, ZR + 0.075], [FX, ZR + 0.075]], Y + H, m.charcoal, true, [], 'aurum_ceiling')
  // Black tracks of spots down the shop, and downlights between.
  for (const [z, aim] of [[ZL + 1.25, PI], [ZC, 0], [ZR - 1.05, 0]] as const) trackSpots(s, g, FX + 0.6, z, BK - 0.5, z, Y + H, 7, spot, aim, 0.7)
  downlights(s, g, FX + 1.0, ZC - 0.6, BK - 1.0, ZC - 0.6, 4, Y + H)

  /* ---------- the shopfront on x = 11.3, z −16 … −9.8, the doors at z −14.0 … −11.8 ---------- */
  {
    box(s, FX - 0.075, FX + 0.075, Y + e.ceiling, soffit, -16.0, -9.8, e.m.wallPaint)
    const F0 = FX - 0.05
    const F1 = FX + 0.3
    k.box(g, F1 - F0, 0.55, 6.2, m.blackSteel, (F0 + F1) / 2, Y + 3.0 + 0.275, ZC)
    for (const [a, b] of [[-16.0, -15.66], [-10.14, -9.8]]) k.box(g, F1 - F0, 3.0, b - a, m.walnut, (F0 + F1) / 2, Y + 1.5, (a + b) / 2)
    brandSign(s, g, letters(s, 'AURUM HOME', 'dior', '#d8b878', 512, 128), 2.1, 0.525, F0 - 0.004, Y + 3.28, ZC, -PI / 2)
    const fr = m.brass
    box(s, FX - 0.035, FX + 0.035, Y + 2.95, Y + 3.0, -15.66, -10.14, fr)
    for (const z of [-15.63, -14.03, -11.77, -10.17]) box(s, FX - 0.035, FX + 0.035, Y, Y + 2.95, z - 0.02, z + 0.02, fr)
    box(s, FX - 0.035, FX + 0.035, Y + 2.62, Y + 2.67, -14.03, -11.77, fr)
    pane(s, g, FX, -15.6, FX, -14.06, Y + 0.02, Y + 2.95)
    pane(s, g, FX, -11.74, FX, -10.2, Y + 0.02, Y + 2.95)
    pane(s, g, FX, -14.0, FX, -11.8, Y + 2.67, Y + 2.95)
    swingLeaf(s, at(g, FX, Y, -14.0, -PI / 2), 'aurum_r', 1.09, 2.6, fr, PI / 2, true)
    swingLeaf(s, at(g, FX, Y, -11.8, PI / 2), 'aurum_l', 1.09, 2.6, fr, -PI / 2, true)
    box(s, FX - 0.15, FX + 0.15, Y, Y + 0.008, -14.0, -11.8, m.brass, false)
    e.shade.foot(FX - 0.06, -16.0, FX - 0.06, -9.8, Y + 0.01, 0.2, 0.25)
  }

  /* ---------- the left wall: walnut slats, the green feature wall, the credenza ---------- */
  const slats = (x0: number, x1: number) => {
    for (let x = x0 + 0.03; x < x1 - 0.02; x += 0.065) k.box(g, 0.045, H - 0.02, 0.035, m.walnut, x, Y + (H - 0.02) / 2, ZL + 0.0175)
    k.box(g, x1 - x0, H, 0.01, m.blackSteel, (x0 + x1) / 2, Y + H / 2, ZL + 0.005, false)
  }
  slats(11.6, 13.25)
  slats(15.95, 17.1)
  {
    k.box(g, 15.95 - 13.25, H, 0.02, m.green, 14.6, Y + H / 2, ZL + 0.01)
    // The lettering, brass, raised off the wall with its shadow behind.
    const lines = ['DESIGN', 'YOUR SPACE,', 'REFLECT', 'YOUR STYLE']
    const paint = (fill: string) => (c: CanvasRenderingContext2D, w: number, h: number) => {
      c.clearRect(0, 0, w, h)
      c.fillStyle = fill
      c.textBaseline = 'middle'
      c.font = `500 ${h * 0.15}px "Cormorant Garamond", "Playfair Display", Georgia, serif`
      lines.forEach((l, i) => c.fillText(l, w * 0.04, h * (0.16 + i * 0.22)))
    }
    const gold = m.std({ color: '#d4b06c', metalness: 1, roughness: 0.28, map: m.canvas(1280, 1024, paint('#ffffff')), transparent: true, alphaTest: 0.4 }, 1.2)
    const shadow = m.std({ color: '#000000', map: m.canvas(1280, 1024, paint('#000000')), transparent: true, opacity: 0.45, roughness: 1 }, 0)
    const letter = mesh(g, new PlaneGeometry(2.0, 1.6), gold, 14.55, Y + 2.25, ZL + 0.045, false)
    mesh(g, new PlaneGeometry(2.0, 1.6), shadow, 14.57, Y + 2.235, ZL + 0.022, false)
    // The wash of light down the green from a slot in the ceiling.
    k.box(g, 15.95 - 13.25, 0.006, 0.05, led, 14.6, Y + H - 0.004, ZL + 0.1, false)
    info(s, letter, { title: 'Design Your Space, Reflect Your Style', kind: 'Aurum Home', body: 'The house\'s motto in brass letters on a deep green wall of lime plaster between walnut slats: every piece in the shop is chosen to sit together in a real home.', specs: ['Lime plaster, hand-trowelled', 'Brass letters on stand-offs'] }, 0)
  }
  // The credenza: walnut, four panelled doors on brass pulls, lit along its foot.
  {
    const cx = 14.6
    const len = 2.4
    const d = 0.46
    const cz = ZL + 0.06 + d / 2
    const c = at(g, cx, Y, cz, 0)
    k.box(c, len - 0.12, 0.08, d - 0.08, m.blackSteel, 0, 0.04, 0)
    k.box(c, len - 0.2, 0.004, 0.02, led, 0, 0.002, d / 2 - 0.06, false)
    k.box(c, len, 0.66, d, m.walnut, 0, 0.08 + 0.33, -0.01)
    k.box(c, len + 0.02, 0.03, d + 0.02, m.walnut, 0, 0.755, 0)
    // Inside: a shelf of boxed stock.
    k.box(c, len - 0.06, 0.015, d - 0.06, m.shelfWhite, 0, 0.42, 0)
    for (let i = 0; i < 4; i++) {
      const bx = -len / 2 + 0.3 + i * 0.6
      k.box(c, 0.36, 0.18, 0.3, i % 2 ? m.cream : m.sand, bx, 0.52, -0.02, false)
      k.box(c, 0.3, 0.22, 0.3, m.stoneware, bx, 0.2, -0.02, false)
    }
    for (let i = 0; i < 4; i++) {
      const w = len / 4 - 0.008
      const left = i % 2 === 0
      const hx = -len / 2 + (i + (left ? 0 : 1)) * (len / 4) + (left ? 0.004 : -0.004)
      const hinge = at(c, hx, 0.09, d / 2 - 0.005, 0)
      const leaf = new Group()
      leaf.name = `door_aurum_credenza_${i}`
      leaf.userData.label = 'Credenza door'
      leaf.userData.openAngle = left ? -1.7 : 1.7
      hinge.add(leaf)
      const sx = left ? 1 : -1
      const front = k.box(leaf, w, 0.64, 0.02, m.walnut, (sx * w) / 2, 0.32, 0.01)
      front.userData.front = true
      // A raised field and a brass pull.
      k.box(leaf, w - 0.08, 0.56, 0.008, m.walnut, (sx * w) / 2, 0.32, 0.024)
      k.box(leaf, 0.012, 0.22, 0.012, m.brass, sx * (w - 0.05), 0.38, 0.034)
    }
    e.shade.rect(cx, Y + 0.012, cz, len + 0.1, d + 0.2, 0, 0.4)
    info(s, c.children[3], { title: 'Walnut Credenza', kind: 'Furniture · Aurum Home', body: 'A credenza in American black walnut: four panelled doors on brass pulls over a recessed steel plinth, a shelf inside. Tap a door to open it. Made to order in three lengths.', specs: ['Black walnut, oiled', '240 × 46 × 77 cm', rupees(185000)] }, 0)
    // Dressed: pampas in a hammered brass vase, a lamp, brass bottles, a white vase, frames.
    const top = 0.77
    item(c, (p) => {
      vase(m, p, 'amphora', m.hammeredBrass, 1.25)
      pampas(m, p, 0.5, 0.75, 9, 61)
      return p
    }, { name: 'Pampas in a Hammered Brass Amphora', cat: 'Vases & arrangements', material: 'Hammered brass; dried pampas grass', size: 'Vase 58 cm; arrangement 130 cm', colour: 'Antique brass, natural', price: 14500, note: 'A tall amphora hand-hammered in brass, filled with dried pampas plumes that keep for years.' }, -0.95, top, 0)
    item(c, (p) => tableLamp(m, p, 'column', m.brass, m.shade, 1.05), { name: 'Column Table Lamp', cat: 'Lighting', material: 'Brushed brass; linen shade', size: 'H 76 cm, shade Ø 40 cm', colour: 'Brass, ivory', price: 22500, note: 'A slender turned-brass column under a tapered drum of Belgian linen; warm dimmable LED.' }, -0.35, top, 0.02)
    item(c, (p) => vase(m, p, 'bottle', m.brass, 0.9), { name: 'Brass Bottle Vase, Tall', cat: 'Vases', material: 'Spun brass', size: 'H 39 cm', colour: 'Polished brass', price: 6800, note: 'A tall bottle spun from a single sheet of brass, its neck long and fine.' }, 0.2, top, 0.0)
    item(c, (p) => vase(m, p, 'bottle', m.brass, 0.65), { name: 'Brass Bottle Vase, Small', cat: 'Vases', material: 'Spun brass', size: 'H 28 cm', colour: 'Polished brass', price: 4900, note: 'The smaller of the pair; together they make a still life.' }, 0.36, top, 0.06)
    item(c, (p) => vase(m, p, 'ovoid', m.glossWhite, 0.75, 24), { name: 'Fluted Ovoid Vase', cat: 'Ceramics', material: 'Glazed porcelain', size: 'H 24 cm', colour: 'Gloss white', price: 5200, note: 'Porcelain thrown and fluted by hand, glazed a soft gloss white.' }, 0.6, top, -0.02)
    item(c, (p) => frame(m, p, 0.2, 0.25, m.prints[0]), { name: 'Brass Frame 13×18', cat: 'Photo frames', material: 'Solid brass; glass', size: '20 × 25 cm', colour: 'Brass', price: 3400, note: 'A solid brass frame with an easel back, for a 13 × 18 cm photograph.' }, 0.9, top, 0.0)
    item(c, (p) => frame(m, p, 0.16, 0.2, m.prints[1]), { name: 'Brass Frame 10×15', cat: 'Photo frames', material: 'Solid brass; glass', size: '16 × 20 cm', colour: 'Brass', price: 2600, note: 'The smaller frame, for a 10 × 15 cm photograph.' }, 1.06, top, 0.08, -0.3)
  }

  /* ---------- the sofa and the round table ---------- */
  rug(e, g, 12.55, -14.7, 0, 2.3, 2.1, '#a9a49b', '#6f6a62', 71)
  sofa(e, g, 12.5, ZL + 0.6, 0, 2.0, m.cream)
  for (const [x, mat, yaw, w] of [[11.85, m.velvetGreen, 0.25, 0.48], [12.3, m.goldSatin, 0.05, 0.45], [13.15, m.velvetGreen, -0.25, 0.48]] as const)
    item(g, (p) => cushion(m, p, w, mat), mat === m.goldSatin
      ? { name: 'Gold Satin Cushion', cat: 'Cushions', material: 'Silk satin; feather insert', size: '45 × 45 cm', colour: 'Antique gold', price: 4200, note: 'A cushion in heavy silk satin with a feather insert and a hidden zip.' }
      : { name: 'Emerald Damask Velvet Cushion', cat: 'Cushions', material: 'Cotton velvet with woven gold damask', size: '48 × 48 cm', colour: 'Emerald, gold', price: 4800, note: 'Emerald velvet woven with a gold damask, piped, with a feather insert.' }, x, Y + 0.48, ZL + 0.43, yaw).rotation.x = -0.28
  {
    // The round table: black marble on a brass hoop frame.
    const tx = 12.55
    const tz = -14.35
    const t = at(g, tx, Y, tz, 0)
    mesh(t, new CylinderGeometry(0.44, 0.44, 0.03, 64), m.nero, 0, 0.43, 0)
    mesh(t, new TorusGeometry(0.4, 0.008, 8, 64), m.brass, 0, 0.4, 0).rotation.x = PI / 2
    mesh(t, new TorusGeometry(0.4, 0.008, 8, 64), m.brass, 0, 0.012, 0).rotation.x = PI / 2
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * PI * 2 + PI / 4
      mesh(t, new CylinderGeometry(0.008, 0.008, 0.39, 8), m.brass, Math.cos(a) * 0.4, 0.205, Math.sin(a) * 0.4)
    }
    e.shade.pool(tx, Y + 0.012, tz, 0.45, 0.45, 0.4)
    info(s, t.children[0], { title: 'Nero Marquina Side Table', kind: 'Furniture · Aurum Home', body: 'A round table of Nero Marquina marble, its white veins running through, on a hoop frame of solid brass.', specs: ['Marble, brass', 'Ø 88 cm, H 45 cm', rupees(68000)] }, 0)
    const ty = 0.445
    item(t, (p) => candlestick(m, p, 0.28), { name: 'Brass Candlestick, Tall', cat: 'Candles & holders', material: 'Cast brass; dinner candle', size: 'H 28 cm', colour: 'Brass', price: 2900, note: 'A turned candlestick in cast brass, sold with an unscented dinner candle.' }, -0.18, ty, -0.1)
    item(t, (p) => candlestick(m, p, 0.2), { name: 'Brass Candlestick, Short', cat: 'Candles & holders', material: 'Cast brass; dinner candle', size: 'H 20 cm', colour: 'Brass', price: 2400, note: 'The shorter of the pair.' }, -0.06, ty, -0.18)
    item(t, (p) => {
      bowl(m, p, 0.13, m.hammeredBrass)
      for (let i = 0; i < 3; i++) mesh(p, new SphereGeometry(0.035, 24, 16), [m.blackGlaze, m.glossWhite, m.brass][i], -0.035 + i * 0.035, 0.07, (i - 1) * 0.02)
      return p
    }, { name: 'Footed Brass Bowl with Spheres', cat: 'Bowls & centrepieces', material: 'Hammered brass; ceramic and brass spheres', size: 'Ø 26 cm', colour: 'Brass, black, white', price: 7400, note: 'A footed bowl hammered in brass, with three decorative spheres.' }, 0.13, ty, 0.08)
    item(t, (p) => pottedPlant(m, p, m.hammeredBrass, 0.06, 0.1, 81), { name: 'Fern in a Brass Pot', cat: 'Plants', material: 'Preserved fern; brass pot', size: 'H 38 cm', colour: 'Green, brass', price: 3800, note: 'A preserved Boston fern, no watering needed, in a small hammered brass pot.' }, 0.18, ty, -0.15)
  }

  /* ---------- the display table in the middle ---------- */
  rug(e, g, 14.6, -12.6, 0, 3.0, 2.0, '#b4ada2', '#77706a', 72)
  {
    const tx = 14.6
    const tz = -12.6
    const L = 1.8
    const D = 0.85
    const t = at(g, tx, Y, tz, 0)
    k.box(t, L, 0.04, D, m.whiteLacquer, 0, 0.82, 0)
    k.box(t, L - 0.06, 0.035, D - 0.06, m.whiteLacquer, 0, 0.18, 0)
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) k.box(t, 0.025, 0.8, 0.025, m.brass, (sx * (L - 0.04)) / 2, 0.4, (sz * (D - 0.04)) / 2)
    for (const yy of [0.16, 0.8]) {
      k.box(t, L - 0.04, 0.02, 0.02, m.brass, 0, yy, (D - 0.04) / 2)
      k.box(t, L - 0.04, 0.02, 0.02, m.brass, 0, yy, -(D - 0.04) / 2)
    }
    e.shade.rect(tx, Y + 0.012, tz, L + 0.1, D + 0.1, 0, 0.4)
    info(s, t.children[1], { title: 'Two-Tier Display Table', kind: 'Furniture · Aurum Home', body: 'White lacquer on a frame of brushed brass: the shop\'s own display table, made to order as a console or a library table.', specs: ['Lacquered MDF, brass', '180 × 85 × 84 cm', rupees(96000)] }, 0)
    const ty = 0.84
    item(t, (p) => {
      vase(m, p, 'urn', m.mercury, 1.05)
      blooms(m, p, 0.36, 0.42, 0.32, 91)
      return p
    }, { name: 'White Blooms in a Mercury Urn', cat: 'Flowers & arrangements', material: 'Silk hydrangea and chrysanthemum; mercury glass', size: 'H 85 cm, Ø 65 cm', colour: 'Ivory, silver-gold', price: 18500, note: 'A grand arrangement of silk hydrangeas and chrysanthemums with eucalyptus, in an urn of mercury glass: everlasting, and indistinguishable from fresh.' }, 0, ty, 0)
    item(t, (p) => tableLamp(m, p, 'orb', m.glossWhite, m.shade, 0.95), { name: 'Orb Table Lamp', cat: 'Lighting', material: 'Glazed ceramic, brass; linen shade', size: 'H 62 cm', colour: 'White, brass', price: 16800, note: 'A ceramic globe on a brass foot under a linen drum.' }, -0.66, ty, -0.2)
    item(t, (p) => vase(m, p, 'bottle', m.blackGlaze, 0.85), { name: 'Black Glaze Bottle', cat: 'Ceramics', material: 'Stoneware, black glaze', size: 'H 36 cm', colour: 'Black', price: 5600, note: 'A tall bottle in a deep, glassy black glaze.' }, -0.42, ty, 0.2)
    item(t, (p) => vase(m, p, 'moon', m.blackGold, 0.75), { name: 'Black & Gold Moon Vase', cat: 'Vases', material: 'Enamelled metal, gilt', size: 'H 26 cm', colour: 'Black, gold', price: 6400, note: 'A round-shouldered vase in black enamel, its mouth gilded.' }, -0.22, ty, 0.25)
    item(t, (p) => lantern(m, p, 0.34, 0.16, m.brass), { name: 'Brass Lantern, Medium', cat: 'Candles & holders', material: 'Brass, glass; LED pillar', size: 'H 38 cm', colour: 'Brass', price: 7200, note: 'A square lantern of brass and glass with a flickering LED pillar candle inside.' }, 0.42, ty, -0.2)
    item(t, (p) => vase(m, p, 'gourd', m.mercury, 0.55), { name: 'Mercury Glass Gourd', cat: 'Glass', material: 'Mercury glass', size: 'H 20 cm', colour: 'Silver-gold', price: 3900, note: 'Hand-blown glass silvered within, an aged silver-gold.' }, 0.58, ty, 0.18)
    item(t, (p) => lidBox(m, p, 0.2, 0.14, 0.08, m.marbleWhite, m.brass), { name: 'Marble Box with Brass Lid', cat: 'Storage', material: 'Statuario marble, brass', size: '20 × 14 × 8 cm', colour: 'White, brass', price: 5800, note: 'A box cut from Statuario marble under a brass lid, for keys or jewellery.' }, 0.72, ty, -0.05, 0.3)
    // Below: cushions leaning, lanterns, a plant.
    const by = 0.2
    item(t, (p) => cushion(m, p, 0.42, m.goldSatin), { name: 'Gold Satin Cushion', cat: 'Cushions', material: 'Silk satin; feather insert', size: '45 × 45 cm', colour: 'Antique gold', price: 4200, note: 'A cushion in heavy silk satin with a feather insert and a hidden zip.' }, -0.55, by, 0.1).rotation.x = -0.35
    item(t, (p) => cushion(m, p, 0.42, m.velvetNavy), { name: 'Midnight Velvet Cushion', cat: 'Cushions', material: 'Cotton velvet; feather insert', size: '45 × 45 cm', colour: 'Midnight blue', price: 3900, note: 'Deep midnight velvet, plump and soft.' }, -0.15, by, 0.1).rotation.x = -0.35
    item(t, (p) => lantern(m, p, 0.26, 0.13, m.brass), { name: 'Brass Lantern, Small', cat: 'Candles & holders', material: 'Brass, glass; LED pillar', size: 'H 30 cm', colour: 'Brass', price: 5400, note: 'The small lantern.' }, 0.28, by, 0.05)
    item(t, (p) => pottedPlant(m, p, m.hammeredBrass, 0.09, 0.15, 82), { name: 'Fern in a Brass Planter', cat: 'Plants', material: 'Preserved fern; brass', size: 'H 45 cm', colour: 'Green, brass', price: 4600, note: 'A preserved fern in a hammered brass planter.' }, 0.62, by, 0.0)
  }

  /* ---------- the back: dining set, pendants, mirror, étagère, clock ---------- */
  {
    const tx = 16.75
    const tz = -12.4
    const t = at(g, tx, Y, tz, 0)
    k.box(t, 0.9, 0.04, 1.6, m.walnut, 0, 0.74, 0)
    for (const sz of [-1, 1]) {
      k.box(t, 0.04, 0.7, 0.04, m.brass, 0, 0.37, sz * 0.62)
      k.box(t, 0.6, 0.02, 0.04, m.brass, 0, 0.02, sz * 0.62)
    }
    k.box(t, 0.04, 0.03, 1.24, m.brass, 0, 0.7, 0)
    e.shade.rect(tx, Y + 0.012, tz, 1.0, 1.7, 0, 0.4)
    info(s, t.children[0], { title: 'Walnut Dining Table', kind: 'Furniture · Aurum Home', body: 'A dining table in solid black walnut on two brass trestles, seating six.', specs: ['Walnut, brass', '160 × 90 × 76 cm', rupees(145000)] }, 0)
    for (const [x, z, yaw] of [[-0.62, -0.42, PI / 2], [-0.62, 0.42, PI / 2], [0.62, -0.42, -PI / 2], [0.62, 0.42, -PI / 2]] as const) diningChair(e, g, tx + x, tz + z, yaw, m.cream)
    item(t, (p) => bowl(m, p, 0.16, m.stoneware), { name: 'Stoneware Fruit Bowl', cat: 'Bowls & centrepieces', material: 'Speckled stoneware', size: 'Ø 32 cm', colour: 'Oatmeal', price: 4400, note: 'A wide footed bowl in a speckled oatmeal glaze, thrown by hand.' }, 0, 0.76, 0)
    item(t, (p) => candlestick(m, p, 0.24), { name: 'Brass Candlestick, Medium', cat: 'Candles & holders', material: 'Cast brass; dinner candle', size: 'H 24 cm', colour: 'Brass', price: 2700, note: 'The middle height of the set of three.' }, 0.05, 0.76, -0.4)
    item(t, (p) => vase(m, p, 'bud', m.celadon, 0.9), { name: 'Celadon Bud Vase', cat: 'Ceramics', material: 'Porcelain, celadon glaze', size: 'H 20 cm', colour: 'Celadon', price: 2800, note: 'A bud vase in the pale green of celadon.' }, -0.05, 0.76, 0.42)
    // Amber bell pendants over the table.
    for (const z of [tz - 0.55, tz, tz + 0.55]) {
      const h = Y + H
      k.cyl(g, 0.04, 0.04, 0.02, m.brass, tx, h - 0.01, z, 20)
      k.cyl(g, 0.003, 0.003, 1.12, m.blackSteel, tx, h - 0.58, z, 6)
      const bell = at(g, tx, h - 1.14, z, 0)
      k.cyl(bell, 0.035, 0.035, 0.05, m.brass, 0, 0, 0, 20)
      mesh(bell, new LatheGeometry([[0.03, 0], [0.06, -0.03], [0.11, -0.13], [0.13, -0.22], [0.125, -0.23], [0.105, -0.13], [0.055, -0.035], [0.028, -0.005]].map(([r, y]) => new Vector2(r, y)), 40), amber, 0, -0.02, 0, false)
    }
    // The round brass mirror on the back wall, over the table.
    const mir = at(g, BK - 0.03, Y + 1.85, tz, -PI / 2)
    mesh(mir, new TorusGeometry(0.52, 0.045, 20, 96), m.brass, 0, 0, 0.03)
    mesh(mir, new CircleGeometry(0.5, 64), m.mirror, 0, 0, 0.02, false)
    info(s, mir, { title: 'Round Brass Mirror', kind: 'Mirrors · Aurum Home', body: 'A round mirror of bevelled silvered glass in a heavy rolled brass frame.', specs: ['Brass, silvered glass', 'Ø 110 cm', rupees(38500)] }, 0)
  }
  {
    // The étagère in the back-left corner: black steel, four glass shelves, each piece apart.
    const ex = BK - 0.25
    const ez = ZL + 0.9
    const et = at(g, ex, Y, ez, -PI / 2)
    const W = 1.0
    const Dd = 0.38
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) k.box(et, 0.022, 2.0, 0.022, m.blackSteel, (sx * (W - 0.022)) / 2, 1.0, (sz * (Dd - 0.022)) / 2)
    const levels = [0.08, 0.55, 1.0, 1.45, 1.92]
    for (const yy of levels) {
      k.box(et, W - 0.02, 0.01, Dd - 0.02, m.shelfGlass, 0, yy, 0, false)
      k.box(et, W, 0.018, 0.018, m.blackSteel, 0, yy - 0.012, Dd / 2 - 0.01)
      k.box(et, W, 0.018, 0.018, m.blackSteel, 0, yy - 0.012, -Dd / 2 + 0.01)
    }
    e.shade.rect(ex, Y + 0.012, ez, Dd + 0.1, W + 0.1, 0, 0.35)
    item(et, (p) => ribbonSculpture(m, p), { name: 'Endless Ribbon Sculpture', cat: 'Sculpture', material: 'Matte stoneware on lacquered base', size: 'H 25 cm', colour: 'Chalk white, black', price: 9800, note: 'A continuous ribbon of matte white stoneware that loops through itself, cast in an edition of 200.' }, -0.25, 1.0, 0)
    item(et, (p) => orb(m, p, 0.07), { name: 'Nero Marble Orb', cat: 'Sculpture', material: 'Nero Marquina marble, brass', size: 'H 18 cm', colour: 'Black, brass', price: 6200, note: 'A turned sphere of black marble on a brass stand.' }, 0.25, 1.0, 0)
    item(et, (p) => vase(m, p, 'ovoid', m.navyGlaze, 0.7), { name: 'Midnight Ovoid Vase', cat: 'Ceramics', material: 'Porcelain, blue glaze', size: 'H 22 cm', colour: 'Midnight blue', price: 4900, note: 'A small ovoid in a deep midnight-blue glaze.' }, -0.22, 1.45, 0)
    item(et, (p) => ringsSculpture(m, p), { name: 'Interlocked Rings', cat: 'Sculpture', material: 'Solid brass, Statuario marble', size: 'H 25 cm', colour: 'Brass, white', price: 8600, note: 'Two rings of solid brass, interlocked, on a white marble base.' }, 0.22, 1.45, 0)
    item(et, (p) => vase(m, p, 'amphora', m.stoneware, 0.7, 0, undefined), { name: 'Oatmeal Amphora', cat: 'Ceramics', material: 'Speckled stoneware', size: 'H 32 cm', colour: 'Oatmeal', price: 5400, note: 'A speckled stoneware amphora with a soft satin glaze.' }, 0.0, 0.55, 0)
    item(et, (p) => vase(m, p, 'urn', m.glossWhite, 0.55, 0, m.brass), { name: 'Ginger Jar with Brass Lid', cat: 'Ceramics', material: 'Porcelain, brass', size: 'H 26 cm', colour: 'White, brass', price: 6200, note: 'A white porcelain ginger jar under a turned brass lid.' }, 0.0, 1.92, 0)
    item(et, (p) => lidBox(m, p, 0.3, 0.22, 0.14, m.walnut, m.walnut), { name: 'Walnut Keepsake Box', cat: 'Storage', material: 'Black walnut, brass', size: '30 × 22 × 14 cm', colour: 'Walnut', price: 4800, note: 'A lidded box of black walnut with a brass knob.' }, 0.0, 0.08, 0)
    // The clock above it.
    const ck = at(g, BK - 0.03, Y + 2.62, ez, -PI / 2)
    clock(m, ck, 0.3)
    const hit = info(s, ck, { title: 'Roman Wall Clock', kind: 'Clocks · Aurum Home', body: 'A wall clock in a brass bezel with a Roman-numeral dial and silent quartz movement.', specs: ['Brass, glass; silent quartz', 'Ø 60 cm', rupees(12800)], inspect: () => clock(m, new Group(), 0.3) }, 0)
    if (hit)
      hit.userData.onTap = () => {
        const t = new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
        useInfoStore.getState().show({ ...(hit.userData.info as EquipmentInfo), body: `It is ${t}. A wall clock in a brass bezel with a Roman-numeral dial and silent quartz movement.` })
      }
  }

  /* ---------- the right wall: black steel shelving, lit white shelves ---------- */
  {
    const x0 = 13.0
    const bays = 3
    const bw = 1.5
    const Dd = 0.42
    const zf = ZR - Dd
    const sh = [0.35, 0.82, 1.29, 1.76, 2.23]
    k.box(g, bays * bw, 2.62, 0.02, m.warmWall, x0 + (bays * bw) / 2, Y + 1.31, ZR - 0.01)
    for (let i = 0; i <= bays; i++) k.box(g, 0.035, 2.62, Dd, m.blackSteel, x0 + i * bw, Y + 1.31, ZR - Dd / 2)
    k.box(g, bays * bw + 0.035, 0.035, Dd, m.blackSteel, x0 + (bays * bw) / 2, Y + 2.62, ZR - Dd / 2)
    k.box(g, bays * bw, 0.1, Dd - 0.02, m.blackSteel, x0 + (bays * bw) / 2, Y + 0.05, ZR - Dd / 2)
    for (let i = 0; i < bays; i++)
      for (const yy of sh) {
        const cx = x0 + (i + 0.5) * bw
        k.box(g, bw - 0.035, 0.03, Dd - 0.02, m.shelfWhite, cx, Y + yy, ZR - Dd / 2)
        k.box(g, bw - 0.12, 0.004, 0.012, led, cx, Y + yy - 0.017, zf + 0.04, false)
      }
    e.shade.foot(x0, zf, x0 + bays * bw, zf, Y + 0.01, 0.25, 0.35)
    const zc = ZR - Dd / 2 + 0.02
    const on = (bay: number, tier: number, off: number) => [x0 + (bay + 0.5) * bw + off, Y + sh[tier] + 0.015] as const
    const put = (bay: number, tier: number, off: number, make: (p: Object3D) => Object3D, d: Item, yaw = 0) => {
      const [x, yy] = on(bay, tier, off)
      return item(g, make, d, x, yy, zc, yaw)
    }
    // Bay 1: ceramics.
    put(0, 0, -0.4, (p) => lidBox(m, p, 0.34, 0.26, 0.2, m.sand, m.sand), { name: 'Woven Storage Box, Large', cat: 'Storage', material: 'Seagrass on a board frame', size: '34 × 26 × 20 cm', colour: 'Natural', price: 3600, note: 'A lidded box of tightly woven seagrass.' })
    put(0, 0, 0.3, (p) => lidBox(m, p, 0.28, 0.22, 0.16, m.sand, m.sand), { name: 'Woven Storage Box, Small', cat: 'Storage', material: 'Seagrass on a board frame', size: '28 × 22 × 16 cm', colour: 'Natural', price: 2900, note: 'The smaller woven box.' })
    put(0, 1, -0.45, (p) => vase(m, p, 'amphora', m.glossWhite, 0.8, 30), { name: 'Fluted Amphora', cat: 'Ceramics', material: 'Glazed porcelain', size: 'H 37 cm', colour: 'Gloss white', price: 7800, note: 'A tall amphora, fluted from shoulder to foot.' })
    put(0, 1, 0.0, (p) => vase(m, p, 'cylinder', m.stoneware, 0.75), { name: 'Stoneware Cylinder', cat: 'Ceramics', material: 'Speckled stoneware', size: 'H 31 cm', colour: 'Oatmeal', price: 3800, note: 'A tall cylinder for long stems.' })
    put(0, 1, 0.42, (p) => vase(m, p, 'moon', m.sand, 0.65), { name: 'Sand Moon Jar', cat: 'Ceramics', material: 'Stoneware', size: 'H 23 cm', colour: 'Sand', price: 4600, note: 'A moon jar in a warm sand glaze, its throwing lines left to show.' })
    put(0, 2, -0.35, (p) => vase(m, p, 'gourd', m.glossWhite, 0.6), { name: 'White Gourd Vase', cat: 'Ceramics', material: 'Glazed porcelain', size: 'H 22 cm', colour: 'Gloss white', price: 3600, note: 'A double-gourd vase in gloss white.' })
    put(0, 2, 0.3, (p) => vase(m, p, 'urn', m.celadon, 0.55, 0, m.brass), { name: 'Celadon Ginger Jar', cat: 'Ceramics', material: 'Porcelain, brass', size: 'H 26 cm', colour: 'Celadon, brass', price: 6400, note: 'A ginger jar in celadon under a brass lid.' })
    put(0, 3, -0.3, (p) => bowl(m, p, 0.14, m.glossWhite), { name: 'Porcelain Footed Bowl', cat: 'Bowls & centrepieces', material: 'Porcelain', size: 'Ø 28 cm', colour: 'White', price: 3900, note: 'A footed bowl in thin white porcelain.' })
    put(0, 3, 0.35, (p) => vase(m, p, 'bud', m.stoneware, 0.9), { name: 'Stoneware Bud Vase', cat: 'Ceramics', material: 'Speckled stoneware', size: 'H 20 cm', colour: 'Oatmeal', price: 1900, note: 'A bud vase for a single stem.' })
    put(0, 4, 0.0, (p) => vase(m, p, 'ovoid', m.terracotta, 0.8), { name: 'Terracotta Ovoid', cat: 'Ceramics', material: 'Burnished terracotta', size: 'H 26 cm', colour: 'Terracotta', price: 4200, note: 'Burnished terracotta, unglazed, warm to the touch.' })
    // Bay 2: brass, glass and light.
    put(1, 0, -0.35, (p) => lantern(m, p, 0.3, 0.14, m.brassDark), { name: 'Antique Brass Lantern', cat: 'Candles & holders', material: 'Antiqued brass, glass; LED pillar', size: 'H 34 cm', colour: 'Antique brass', price: 6200, note: 'A lantern in darkened brass with an LED pillar.' })
    put(1, 0, 0.35, (p) => vase(m, p, 'urn', m.hammeredBrass, 0.8), { name: 'Hammered Brass Urn', cat: 'Vases', material: 'Hammered brass', size: 'H 30 cm', colour: 'Brass', price: 9200, note: 'A footed urn hammered in brass.' })
    put(1, 1, -0.3, (p) => tableLamp(m, p, 'gourd', m.celadon, m.shade, 0.85), { name: 'Celadon Gourd Lamp', cat: 'Lighting', material: 'Glazed ceramic, brass; linen shade', size: 'H 66 cm', colour: 'Celadon, ivory', price: 18900, note: 'A double-gourd lamp base in celadon with a linen drum.' })
    put(1, 1, 0.4, (p) => vase(m, p, 'bottle', m.smoke as Material, 0.7), { name: 'Smoked Glass Bottle', cat: 'Glass', material: 'Hand-blown glass', size: 'H 30 cm', colour: 'Smoke grey', price: 3800, note: 'Hand-blown in a translucent smoke grey.' })
    put(1, 2, -0.4, (p) => vase(m, p, 'gourd', m.mercury, 0.7), { name: 'Mercury Glass Gourd, Large', cat: 'Glass', material: 'Mercury glass', size: 'H 26 cm', colour: 'Silver-gold', price: 4900, note: 'The larger mercury gourd.' })
    put(1, 2, 0.1, (p) => candlestick(m, p, 0.32), { name: 'Brass Candlestick, Grand', cat: 'Candles & holders', material: 'Cast brass; dinner candle', size: 'H 32 cm', colour: 'Brass', price: 3400, note: 'The tallest of the candlesticks.' })
    put(1, 2, 0.45, (p) => ringsSculpture(m, p), { name: 'Interlocked Rings', cat: 'Sculpture', material: 'Solid brass, Statuario marble', size: 'H 25 cm', colour: 'Brass, white', price: 8600, note: 'Two rings of solid brass, interlocked, on a white marble base.' })
    put(1, 3, -0.25, (p) => frame(m, p, 0.3, 0.38, m.prints[2]), { name: 'Coastal Print, Framed', cat: 'Wall art', material: 'Giclée print; brass frame', size: '30 × 38 cm', colour: 'Blue-grey', price: 6800, note: 'An abstract coastal print in a brass frame, signed.' })
    put(1, 3, 0.35, (p) => bowl(m, p, 0.12, m.brass, false), { name: 'Brass Catch-All Dish', cat: 'Bowls & centrepieces', material: 'Spun brass', size: 'Ø 24 cm', colour: 'Brass', price: 2600, note: 'A shallow dish spun in brass.' })
    put(1, 4, 0.0, (p) => vase(m, p, 'amphora', m.blackGlaze, 0.7), { name: 'Black Glaze Amphora', cat: 'Ceramics', material: 'Stoneware, black glaze', size: 'H 32 cm', colour: 'Black', price: 6600, note: 'A black amphora with a glassy glaze.' })
    // Bay 3: sculpture, frames, plants.
    put(2, 0, -0.3, (p) => pottedPlant(m, p, m.glossWhite, 0.11, 0.18, 83), { name: 'Fern in a White Planter', cat: 'Plants', material: 'Preserved fern; porcelain', size: 'H 48 cm', colour: 'Green, white', price: 4400, note: 'A preserved fern in a white porcelain planter.' })
    put(2, 0, 0.4, (p) => lidBox(m, p, 0.3, 0.22, 0.14, m.blackGold, m.brass), { name: 'Black Lacquer Box', cat: 'Storage', material: 'Lacquer, brass', size: '30 × 22 × 14 cm', colour: 'Black, brass', price: 5200, note: 'A black lacquered box with a brass knob.' })
    put(2, 1, -0.35, (p) => ribbonSculpture(m, p), { name: 'Endless Ribbon Sculpture', cat: 'Sculpture', material: 'Matte stoneware on lacquered base', size: 'H 25 cm', colour: 'Chalk white, black', price: 9800, note: 'A continuous ribbon of matte white stoneware that loops through itself.' })
    put(2, 1, 0.3, (p) => orb(m, p, 0.08), { name: 'Nero Marble Orb, Large', cat: 'Sculpture', material: 'Nero Marquina marble, brass', size: 'H 20 cm', colour: 'Black, brass', price: 7600, note: 'The larger black marble orb on brass.' })
    put(2, 2, -0.3, (p) => frame(m, p, 0.24, 0.3, m.prints[0]), { name: 'Sage Print, Framed', cat: 'Wall art', material: 'Giclée print; brass frame', size: '24 × 30 cm', colour: 'Sage', price: 5200, note: 'An abstract landscape in sage and stone.' })
    put(2, 2, 0.3, (p) => vase(m, p, 'ovoid', m.celadon, 0.6, 20), { name: 'Fluted Celadon Ovoid', cat: 'Ceramics', material: 'Porcelain, celadon glaze', size: 'H 19 cm', colour: 'Celadon', price: 4300, note: 'A fluted ovoid in pale celadon.' })
    put(2, 3, 0.0, (p) => lantern(m, p, 0.22, 0.11, m.brass), { name: 'Brass Lantern, Petite', cat: 'Candles & holders', material: 'Brass, glass; LED tealight', size: 'H 26 cm', colour: 'Brass', price: 3900, note: 'The petite lantern, for a tealight.' })
    put(2, 4, -0.2, (p) => vase(m, p, 'bud', m.blackGlaze, 1.0), { name: 'Black Bud Vase', cat: 'Ceramics', material: 'Stoneware, black glaze', size: 'H 23 cm', colour: 'Black', price: 2200, note: 'A black bud vase.' })
    put(2, 4, 0.3, (p) => vase(m, p, 'bud', m.glossWhite, 0.8), { name: 'White Bud Vase', cat: 'Ceramics', material: 'Porcelain', size: 'H 18 cm', colour: 'White', price: 1900, note: 'A white bud vase.' })
    info(s, g.children[g.children.length - 1], { title: 'Shelving', kind: 'Display', body: 'Black powder-coated steel with lit white shelves: every piece on it is for sale; tap one to see it.', specs: ['Steel, lacquered shelves', 'LED lines, 2700 K'] }, 0)
  }
  // Brass floor lanterns and a tall vase at the back right.
  item(g, (p) => lantern(m, p, 0.62, 0.26, m.brass), { name: 'Brass Floor Lantern, Large', cat: 'Candles & holders', material: 'Brass, glass; LED pillar', size: 'H 70 cm', colour: 'Brass', price: 16500, note: 'A grand floor lantern of brass and glass with a large LED pillar.' }, BK - 0.45, Y, ZR - 0.8)
  item(g, (p) => lantern(m, p, 0.46, 0.2, m.brass), { name: 'Brass Floor Lantern, Medium', cat: 'Candles & holders', material: 'Brass, glass; LED pillar', size: 'H 52 cm', colour: 'Brass', price: 12500, note: 'The medium floor lantern.' }, BK - 0.85, Y, ZR - 0.65)
  item(g, (p) => {
    vase(m, p, 'amphora', m.mercury, 1.6)
    pampas(m, p, 0.7, 0.8, 11, 64)
    return p
  }, { name: 'Pampas in a Mercury Floor Vase', cat: 'Vases & arrangements', material: 'Mercury glass; dried pampas', size: 'Vase 74 cm; arrangement 155 cm', colour: 'Silver-gold, natural', price: 24500, note: 'A floor vase of mercury glass with a tall spray of pampas.' }, BK - 0.42, Y, ZR - 1.45)

  /* ---------- the cash desk by the door ---------- */
  {
    const dx = 12.25
    const dz = -10.75
    const d = at(g, dx, Y, dz, -PI / 2)
    // Walnut body, a white marble top; the staff stand between it and the glass.
    k.box(d, 1.3, 0.92, 0.55, m.walnut, 0, 0.46, 0)
    for (let i = 0; i < 18; i++) k.box(d, 0.03, 0.82, 0.012, m.walnut, -0.6 + i * 0.07, 0.47, 0.28)
    k.box(d, 1.36, 0.035, 0.6, m.marbleWhite, 0, 0.94, 0)
    k.box(d, 1.3, 0.004, 0.01, led, 0, 0.05, 0.29, false)
    e.shade.rect(dx, Y + 0.012, dz, 0.65, 1.4, 0, 0.4)
    const dr = new Group()
    dr.name = 'drawer_aurum_desk'
    dr.userData.label = 'Drawer'
    dr.userData.slide = [0, 0, 0.3]
    dr.position.set(0.3, 0.78, -0.275)
    dr.rotation.y = PI
    d.add(dr)
    const front = k.box(dr, 0.5, 0.14, 0.02, m.walnut, 0, 0, 0.01)
    front.userData.front = true
    k.box(dr, 0.18, 0.012, 0.012, m.brass, 0, 0.0, 0.026)
    const inner = new Group()
    inner.name = 'contents'
    dr.add(inner)
    k.box(inner, 0.46, 0.01, 0.42, m.shelfWhite, 0, -0.05, -0.21, false)
    k.box(inner, 0.3, 0.02, 0.2, m.cream, -0.05, -0.035, -0.15, false)
    // The till, facing the customer, and the card machine.
    const till = at(d, -0.25, 0.957, 0.05, PI)
    k.cyl(till, 0.06, 0.07, 0.012, m.brass, 0, 0.006, 0, 32)
    k.cyl(till, 0.011, 0.011, 0.18, m.brass, 0, 0.1, 0, 12)
    const head = at(till, 0, 0.24, 0, PI)
    head.rotation.x = -0.3
    k.box(head, 0.27, 0.18, 0.012, m.blackGlaze, 0, 0, 0)
    const scr = m.canvas(384, 256, (c, w, h) => {
      c.fillStyle = '#f7f2ea'
      c.fillRect(0, 0, w, h)
      c.fillStyle = '#1f3d34'
      c.fillRect(0, 0, w, 42)
      c.fillStyle = '#d8b878'
      c.font = '500 22px "Cormorant Garamond", Georgia, serif'
      c.fillText('AURUM HOME', 16, 29)
      c.fillStyle = '#2e2a24'
      c.textAlign = 'center'
      c.font = '500 26px "Inter", Arial, sans-serif'
      c.fillText('Tap to check out', w / 2, h * 0.58)
      c.font = '400 15px "Inter", Arial, sans-serif'
      c.fillText('Cards · UPI · Wallets', w / 2, h * 0.8)
    })
    const sm = new MeshStandardMaterial({ map: scr, emissiveMap: scr, emissive: '#ffffff', emissiveIntensity: 0.6, roughness: 0.3 })
    sm.userData.interior = true
    const btn = button(head, 'till', 'Till', 'Check out', 0, 0, 0.007, () => useInfoStore.getState().show({ ...checkout(), place: `First Floor · ${s.u.name} (${s.u.id})` }), 'aurum')
    mesh(btn, new PlaneGeometry(0.25, 0.165), sm, 0, 0, 0, false)
    const pin = at(d, 0.2, 0.957, 0.12, PI)
    k.soft(pin, 0.07, 0.017, 0.14, 0.008, m.blackGlaze, 0, 0.009, 0)
    info(s, pin, { title: 'Card Machine', kind: 'Payments', body: 'Tap a card or phone, insert a card, or scan the UPI code on the till.', specs: ['Contactless, chip and PIN', 'UPI, wallets'] }, 0)
    item(d, (p) => vase(m, p, 'bud', m.glossWhite, 1.0), { name: 'White Bud Vase', cat: 'Ceramics', material: 'Porcelain', size: 'H 23 cm', colour: 'White', price: 2200, note: 'A white bud vase.' }, 0.5, 0.957, 0.05)
    info(s, d.children[2], { title: 'Cash Desk', kind: 'Aurum Home', body: 'Walnut, fluted, under a white marble top. Tap the till\'s screen to check out what is in your bag.', specs: ['Gift wrapping, free', 'Delivery across the city'] }, 0)
  }

  /* ---------- lamps that switch: every table lamp's shade is its switch ---------- */
  const shades: Mesh[] = []
  g.traverse((o) => {
    if (o.name === 'shade') shades.push(o as Mesh)
  })
  shades.forEach((shade, i) => {
    const mat = (shade.material as MeshStandardMaterial).clone()
    mat.userData.interior = true
    shade.material = mat
    const lt = e.lighting.light(new PointLight('#ffdcae', 1.4, 2.6, 1.8), 0.4)
    lt.userData.zone = s.zone
    let on = true
    const host = shade.parent!
    const sw = button(host, `lamp${i}`, 'Table lamp', 'Switch on or off', shade.position.x, shade.position.y, shade.position.z, () => {
      on = !on
      play({ dur: 0.25, step: (t) => {
        const k2 = on ? t : 1 - t
        mat.emissiveIntensity = 0.9 * k2
        lt.intensity = 1.4 * k2
      } }, sw)
    }, 'aurum')
    // The shade moves under the switch, so a tap on it works the lamp (a tap on the base opens its card).
    host.remove(shade)
    shade.position.set(0, 0, 0)
    sw.add(shade)
    sw.add(lt)
  })

  /* ---------- lighting and switches ---------- */
  lamp(s, 12.6, Y + 3.0, -14.4, 7, 7)
  lamp(s, 14.6, Y + 3.0, -12.6, 8, 7)
  lamp(s, 16.6, Y + 2.6, -12.4, 6, 6, '#ffd9a6')
  lamp(s, 15.2, Y + 2.9, -10.7, 6, 6)
  {
    const sw = new Group()
    sw.position.set(11.75, Y + 1.2, ZL + 0.001)
    g.add(sw)
    const plate = switchPlate(k, sw, 'aurum', ['switch', 'switch'], { plate: m.brass, rocker: m.brass, dark: m.blackGlaze, locator: lux.ledCool as MeshStandardMaterial }, [s.circuit, display])
    plate.traverse((o) => {
      if (o.name === 'switch_aurum_0') o.userData.label = 'Shop lights'
      if (o.name === 'switch_aurum_1') o.userData.label = 'Shelf, wall & pendant lighting'
    })
    setCircuit(s.circuit, true)
    setCircuit(display, true)
  }
  return s
}
