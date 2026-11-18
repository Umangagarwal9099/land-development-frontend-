import { CircleGeometry, CylinderGeometry, ExtrudeGeometry, Group, Mesh, MeshStandardMaterial, Path, PlaneGeometry, Shape, SphereGeometry, TorusGeometry, type Material, type Object3D } from 'three'
import { useInfoStore, type EquipmentInfo } from '../../../../../../../store/info'
import { circuit, setCircuit, switchPlate } from '../../../kalakalD65/fixtures'
import { clipped, type FloorCtx } from '../shell'
import type { Unit } from '../units'
import { button, info, live } from './cafe'
import { foldedStack } from './goods'
import { at, box, brandSign, flat, lamp, letters, mesh, onCircuit, openShop, pane, PI, rect, swingLeaf } from './kit'
import { armchair, blouse, dress, hanger, kurta, mannequin, nestingTables, ottoman, pouf, shellChair, skirt, trousers, womenswearMaterials, type Cloth, type DressSpec, type WomenswearMaterials } from './womenswear'

/*
 * Maison Verde, unit 1-03: women's clothing on the first floor, the third shop on the west spine,
 * 11.2 m deep and 4.85 m wide. Built from the reference, looking in from the door:
 *
 *   walls     sage green throughout; at the back, a great cream niche with rounded shoulders, lit
 *             from above, a brass rail of dresses across it under the "Exclusive offers" poster
 *             between two small shelves; beside it a narrow round-headed arch, "Verde Trends",
 *             with its shelves
 *   right     a long lit cream wall of tall arches on a low step, brass-and-glass shelving of
 *             folded knitwear, denim and tops in the first three, rails of tops in the rest
 *   left      two cream arched niches of rails (blouses and tops; tailoring, denim, skirts and a
 *             kurta set) with an arched brass mirror between them
 *   middle    white-and-gold nesting tables with folded pieces, terracotta poufs, mustard shell
 *             chairs; nearer the door, rounded green velvet armchairs, a round tufted green
 *             ottoman, a bouclé pouf
 *   ceiling   open, painted white: beams across, round ducts along, black tracks of spots
 *   floor     oak parquet at the back, polished cream resin towards the door
 *   front     two dressed mannequins in the windows, the cash desk inside on the right
 *
 * Every garment can be picked from its rail: its card has its sizes, fabric and price, turns it in
 * 3D, and shows it in its other colours (recolouring it on the rail); add it to the bag and pay at
 * the desk. The mannequins' outfits and the folded stacks explain themselves too; the desk's drawer
 * opens; two switches by the door work the lights and the display lighting.
 */

const FX = -6.6
const BK = -17.8
const ZL = -1.075
const ZR = -5.925
const ZC = (ZL + ZR) / 2

/* ---------- the collection ---------- */

interface Way {
  name: string
  hex: string
}
interface Piece {
  name: string
  cat: string
  cloth: Cloth
  fabric: string
  price: number
  ways: Way[]
  note: string
  hanger?: 'wood' | 'velvet' | 'clip'
  make: (m: WomenswearMaterials, p: Object3D, mat: Material) => Object3D
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL']
const rupees = (n: number) => `₹ ${n.toLocaleString('en-IN')}`
const bag: { name: string; size: string; price: number }[] = []

const D = (spec: DressSpec) => (m: WomenswearMaterials, p: Object3D, mat: Material) => dress(m, p, spec, mat, m.brass)

/** The dresses on the back niche's rail, left to right. */
const NICHE: Piece[] = [
  { name: 'Terracotta Wrap Midi', cat: 'Dresses', cloth: 'crepe', fabric: 'Viscose crepe', price: 8990, note: 'A wrap dress in fluid crepe: a deep V, a tie at the waist, a midi skirt that moves.', ways: [{ name: 'Terracotta', hex: '#b9603f' }, { name: 'Ivory', hex: '#efe6d6' }, { name: 'Black', hex: '#1b1a1a' }], make: D({ len: 1.18, neck: 'v', sleeves: 'elbow', skirt: 'flow', waist: 'tie' }) },
  { name: 'Forest Maxi', cat: 'Dresses', cloth: 'chiffon', fabric: 'Silk chiffon over a satin lining', price: 14990, note: 'A floor-sweeping maxi in silk chiffon with flutter sleeves and a gathered waist.', ways: [{ name: 'Forest', hex: '#2f5a43' }, { name: 'Champagne', hex: '#e2cfae' }, { name: 'Navy', hex: '#1e2944' }], make: D({ len: 1.36, neck: 'v', sleeves: 'flutter', skirt: 'flow', waist: 'seam' }) },
  { name: 'Sage Pleated Midi', cat: 'Dresses', cloth: 'satin', fabric: 'Plissé satin', price: 11990, note: 'Sunray-pleated satin from the waist, a square neck and slim straps.', ways: [{ name: 'Sage', hex: '#7f9c6f' }, { name: 'Blush', hex: '#e2b9b0' }, { name: 'Pewter', hex: '#8a8c8f' }], make: D({ len: 1.12, neck: 'square', sleeves: 'none', skirt: 'pleated', waist: 'seam' }) },
  { name: 'Rust Belted Shirt Dress', cat: 'Dresses', cloth: 'linen', fabric: 'Washed linen', price: 7990, note: 'A shirt dress in washed linen, belted in leather, with cap sleeves and an A-line skirt.', ways: [{ name: 'Rust', hex: '#c26b3f' }, { name: 'Olive', hex: '#6d6d45' }, { name: 'White', hex: '#f1ede4' }], make: D({ len: 1.14, neck: 'v', sleeves: 'cap', skirt: 'aline', waist: 'belt' }) },
  { name: 'Emerald Satin Slip', cat: 'Evening', cloth: 'satin', fabric: 'Silk satin, cut on the bias', price: 16990, note: 'A bias-cut slip dress in heavy silk satin, a cowl of light at the neck, falling to the ankle.', ways: [{ name: 'Emerald', hex: '#1f5a40' }, { name: 'Black', hex: '#141414' }, { name: 'Champagne', hex: '#d9c39c' }], make: D({ len: 1.32, neck: 'scoop', sleeves: 'none', skirt: 'slip', waist: 'none' }) },
  { name: 'Clay Halter Midi', cat: 'Party wear', cloth: 'crepe', fabric: 'Stretch crepe', price: 9490, note: 'A halter neck, an open back and a fluid A-line skirt in clay crepe.', ways: [{ name: 'Clay', hex: '#c98463' }, { name: 'Black', hex: '#161616' }], make: D({ len: 1.16, neck: 'halter', sleeves: 'none', skirt: 'aline', waist: 'seam' }) },
]

/** The left wall's first niche: blouses, shirts and tops. */
const TOPS: Piece[] = [
  { name: 'Silk Pussy-Bow Blouse', cat: 'Blouses', cloth: 'satin', fabric: 'Silk crêpe de chine', price: 7490, note: 'Silk with a soft bow at the neck, full sleeves gathered at the cuff.', ways: [{ name: 'Ivory', hex: '#efe6d4' }, { name: 'Sage', hex: '#9db08f' }, { name: 'Black', hex: '#161616' }], make: (m, p, c) => blouse(m, p, c, { neck: 'crew', sleeves: 'long', bow: true }) },
  { name: 'Linen Shirt', cat: 'Shirts', cloth: 'linen', fabric: 'Pure linen', price: 4990, note: 'A relaxed shirt in pure washed linen with a point collar.', ways: [{ name: 'White', hex: '#f3f0e8' }, { name: 'Sky', hex: '#b9cbe0' }, { name: 'Sand', hex: '#d9c6a6' }], make: (m, p, c) => blouse(m, p, c, { neck: 'v', sleeves: 'long', collar: true, len: 0.7 }) },
  { name: 'Ribbed Knit Top', cat: 'Tops', cloth: 'knit', fabric: 'Merino rib', price: 3990, note: 'A fitted rib-knit top with a boat neck and elbow sleeves.', ways: [{ name: 'Oat', hex: '#d8ccb6' }, { name: 'Terracotta', hex: '#b9603f' }, { name: 'Forest', hex: '#2f5a43' }], make: (m, p, c) => blouse(m, p, c, { neck: 'boat', sleeves: 'elbow', len: 0.55, tuck: true }) },
  { name: 'Satin Cami', cat: 'Tops', cloth: 'satin', fabric: 'Satin', price: 2990, note: 'A satin camisole on fine straps, cut on the bias.', ways: [{ name: 'Champagne', hex: '#dcc59e' }, { name: 'Emerald', hex: '#1f5a40' }, { name: 'Black', hex: '#151515' }], make: (m, p, c) => blouse(m, p, c, { neck: 'scoop', sleeves: 'none', len: 0.5 }) },
  { name: 'Cotton Tee', cat: 'T-shirts', cloth: 'cotton', fabric: 'Organic cotton jersey', price: 1990, note: 'The essential tee, in heavy organic cotton.', ways: [{ name: 'White', hex: '#f4f2ec' }, { name: 'Black', hex: '#1a1a1a' }, { name: 'Clay', hex: '#c98463' }], make: (m, p, c) => blouse(m, p, c, { neck: 'crew', sleeves: 'cap', len: 0.62 }) },
]

/** The left wall's second niche: tailoring, denim, skirts and the kurta set. */
const TAILORING: Piece[] = [
  { name: 'Wool Blazer', cat: 'Blazers & jackets', cloth: 'wool', fabric: 'Wool twill, satin lined', price: 12990, note: 'A single-breasted blazer in wool twill, softly shouldered and lined in satin.', ways: [{ name: 'Camel', hex: '#b48a5a' }, { name: 'Black', hex: '#1a1a1a' }, { name: 'Ivory', hex: '#ece4d4' }], make: (m, p, c) => blouse(m, p, c, { neck: 'v', sleeves: 'long', len: 0.72, collar: true }) },
  { name: 'Wide-Leg Trousers', cat: 'Trousers', cloth: 'crepe', fabric: 'Wool-blend crepe', price: 5990, note: 'High-waisted wide-leg trousers with pressed creases.', hanger: 'clip', ways: [{ name: 'Cream', hex: '#ece3d1' }, { name: 'Black', hex: '#171717' }, { name: 'Forest', hex: '#2f5a43' }], make: (m, p, c) => trousers(m, p, c, 'wide') },
  { name: 'Straight Jeans', cat: 'Denim', cloth: 'denim', fabric: 'Rigid organic denim', price: 4490, note: 'High-rise straight jeans in rigid organic denim.', hanger: 'clip', ways: [{ name: 'Mid wash', hex: '#4f6a8f' }, { name: 'Indigo', hex: '#2a3654' }, { name: 'Ecru', hex: '#e7dfcd' }], make: (m, p, c) => trousers(m, p, c, 'jeans') },
  { name: 'Pleated Midi Skirt', cat: 'Skirts', cloth: 'satin', fabric: 'Plissé satin', price: 5490, note: 'A sunray-pleated midi skirt on an elastic waist.', hanger: 'clip', ways: [{ name: 'Blush', hex: '#e2b9b0' }, { name: 'Sage', hex: '#7f9c6f' }, { name: 'Gold', hex: '#c9a35f' }], make: (m, p, c) => skirt(m, p, c, 'pleated', 0.78) },
  { name: 'Printed Co-ord Skirt', cat: 'Co-ord sets', cloth: 'print', fabric: 'Printed cotton voile', price: 4990, note: 'The skirt of a co-ord set in a sprigged cotton voile; the shirt is sold alongside.', hanger: 'clip', ways: [{ name: 'Ivory sprig', hex: '#f1ebdc' }, { name: 'Sage sprig', hex: '#c9d6bd' }], make: (m, p, c) => skirt(m, p, c, 'aline', 0.72) },
  { name: 'Chanderi Kurta Set', cat: 'Ethnic wear', cloth: 'print', fabric: 'Chanderi silk-cotton, with dupatta', price: 9990, note: 'A straight kurta in hand-blocked chanderi with a sheer dupatta: for festive days.', ways: [{ name: 'Ivory gold', hex: '#f0e6cf' }, { name: 'Rose', hex: '#e6c0b8' }], make: (m, p, c) => kurta(m, p, c, m.cloth('chiffon', '#e8d9b8')) },
]

/** The right wall's rails, in the arches nearer the door. */
const RIGHT: Piece[] = [
  { name: 'Linen Midi Dress', cat: 'Dresses', cloth: 'linen', fabric: 'Washed linen', price: 6990, note: 'A square-necked linen midi with cap sleeves.', ways: [{ name: 'Olive', hex: '#6d6d45' }, { name: 'White', hex: '#f1ede4' }], make: D({ len: 1.1, neck: 'square', sleeves: 'cap', skirt: 'aline', waist: 'seam' }) },
  { name: 'Velvet Party Dress', cat: 'Party wear', cloth: 'velvet', fabric: 'Silk velvet', price: 13490, note: 'Short-sleeved silk velvet with a V neck and a slim skirt, for evenings.', ways: [{ name: 'Bottle green', hex: '#1d4a36' }, { name: 'Burgundy', hex: '#5a1626' }], make: D({ len: 1.0, neck: 'v', sleeves: 'cap', skirt: 'pencil', waist: 'seam' }) },
  { name: 'Satin Shirt', cat: 'Shirts', cloth: 'satin', fabric: 'Washed satin', price: 4490, note: 'A fluid shirt in washed satin.', ways: [{ name: 'Champagne', hex: '#dcc59e' }, { name: 'Sage', hex: '#9db08f' }], make: (m, p, c) => blouse(m, p, c, { neck: 'v', sleeves: 'long', collar: true }) },
  { name: 'Cardigan', cat: 'Knitwear', cloth: 'knit', fabric: 'Cashmere blend', price: 6490, note: 'A soft cashmere-blend cardigan, V-necked.', ways: [{ name: 'Oat', hex: '#d8ccb6' }, { name: 'Camel', hex: '#b48a5a' }], make: (m, p, c) => blouse(m, p, c, { neck: 'v', sleeves: 'long', len: 0.62 }) },
  { name: 'Pencil Skirt', cat: 'Skirts', cloth: 'wool', fabric: 'Wool crepe', price: 3990, note: 'A knee-length pencil skirt in wool crepe.', hanger: 'clip', ways: [{ name: 'Black', hex: '#171717' }, { name: 'Camel', hex: '#b48a5a' }], make: (m, p, c) => skirt(m, p, c, 'pencil', 0.62) },
  { name: 'Tiered Maxi', cat: 'Dresses', cloth: 'cotton', fabric: 'Cotton poplin', price: 7490, note: 'A tiered cotton maxi with elbow sleeves.', ways: [{ name: 'Terracotta', hex: '#b9603f' }, { name: 'White', hex: '#f3f0e8' }], make: D({ len: 1.3, neck: 'v', sleeves: 'elbow', skirt: 'flow', waist: 'tie' }) },
]

function pieceCard(P: Piece, inspect: () => Object3D, variants: EquipmentInfo['variants']): Omit<EquipmentInfo, 'place'> {
  return {
    title: P.name,
    kind: `${P.cat} · Maison Verde`,
    body: `${P.note} Drag it to turn it; scroll or pinch to look closer; pick a colour to see it on the rail.`,
    specs: [`Fabric: ${P.fabric}`, `Colours: ${P.ways.map((w) => w.name).join(', ')}`, 'Sizes XS–XL', rupees(P.price)],
    inspect,
    variants,
    choices: { label: 'Size', options: SIZES },
    action: {
      label: 'Add to bag',
      run: (size) => {
        if (!size) return 'Choose your size first.'
        bag.push({ name: P.name, size, price: P.price })
        return `Added ${P.name}, size ${size}. ${bag.length} ${bag.length === 1 ? 'piece' : 'pieces'} in your bag: pay at the desk by the door.`
      },
    },
  }
}

function checkout(): Omit<EquipmentInfo, 'place'> {
  const total = bag.reduce((a, l) => a + l.price, 0)
  return {
    title: 'The Cash Desk',
    kind: 'Maison Verde · Checkout',
    body: bag.length ? 'Each piece is checked, folded in tissue and boxed with a green ribbon.' : 'Your bag is empty. Tap any garment on the rails, choose a size and add it; then pay here.',
    specs: bag.length ? [...bag.map((l) => `${l.name} · ${l.size} · ${rupees(l.price)}`), `Total ${rupees(total)} (incl. GST)`] : ['Cards, UPI and wallets', 'Alterations in 48 hours', 'Exchanges within 30 days'],
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

/** A shape with rounded top corners (radius r), w wide and h high, from its bottom centre. */
function arch(w: number, h: number, r: number, round = false) {
  const s = new Shape()
  const rr = round ? w / 2 : r
  s.moveTo(-w / 2, 0)
  s.lineTo(w / 2, 0)
  s.lineTo(w / 2, h - rr)
  if (round) {
    s.absarc(0, h - rr, rr, 0, PI, false)
  } else {
    s.quadraticCurveTo(w / 2, h, w / 2 - rr, h)
    s.lineTo(-w / 2 + rr, h)
    s.quadraticCurveTo(-w / 2, h, -w / 2, h - rr)
  }
  s.lineTo(-w / 2, 0)
  return s
}
/** The same outline as a hole. */
function archPath(w: number, h: number, r: number, round = false, dx = 0) {
  const s = new Path()
  const rr = round ? w / 2 : r
  s.moveTo(dx - w / 2, 0.001)
  s.lineTo(dx - w / 2, h - rr)
  if (round) s.absarc(dx, h - rr, rr, PI, 0, true)
  else {
    s.quadraticCurveTo(dx - w / 2, h, dx - w / 2 + rr, h)
    s.lineTo(dx + w / 2 - rr, h)
    s.quadraticCurveTo(dx + w / 2, h, dx + w / 2, h - rr)
  }
  s.lineTo(dx + w / 2, 0.001)
  s.lineTo(dx - w / 2, 0.001)
  return s
}

export function buildWomenStore(e: FloorCtx, u: Unit) {
  const s = openShop(e, u)
  const { k, lux } = e
  const { g, y: Y } = s
  const m = womenswearMaterials(e)
  const soffit = e.soffit

  const display = circuit()
  const glowOf = (mat: MeshStandardMaterial) => {
    const n = mat.clone()
    n.userData.interior = true
    display.glows.push(n)
    return n
  }
  const led = glowOf(lux.led as MeshStandardMaterial)
  const lit = glowOf(m.creamLit as MeshStandardMaterial)
  const spot = onCircuit(s, lux.led as MeshStandardMaterial)

  /** A garment on a rail: recolourable, explaining itself, turned in its card. */
  let pid = 0
  const piece = (par: Object3D, P: Piece, x: number, y: number, z: number, yaw: number) => {
    let cur = 0
    const holder = live(par, `garment${pid++}`, 'verde')
    holder.position.set(x, y, z)
    holder.rotation.y = yaw
    const build = (p: Object3D, i: number) => {
      hanger(m, p, P.hanger ?? (P.cat === 'Dresses' || P.cat === 'Evening' ? 'velvet' : 'wood'), P.hanger === 'clip' ? 0.16 : 0.2)
      const body = new Group()
      body.position.y = P.hanger === 'clip' ? -0.07 : -0.07
      p.add(body)
      P.make(m, body, m.cloth(P.cloth, P.ways[i].hex))
    }
    build(holder, 0)
    info(s, holder, pieceCard(P, () => {
      const p = new Group()
      build(p, cur)
      return p
    }, {
      label: 'Colour',
      options: P.ways.map((w) => ({ name: w.name, swatch: w.hex })),
      current: () => cur,
      pick: (i) => {
        cur = i
        for (const c of [...holder.children]) {
          holder.remove(c)
          c.traverse((o) => (o as Mesh).geometry?.dispose())
        }
        build(holder, i)
      },
    }), 0.006)
    return holder
  }
  /** A brass rail between two brackets from a wall face, its garments spaced along it. */
  const rail = (x0: number, x1: number, y: number, z: number, wallZ: number, pieces: Piece[], yaw: number) => {
    const r = mesh(g, new CylinderGeometry(0.012, 0.012, Math.abs(x1 - x0), 16), m.brass, (x0 + x1) / 2, Y + y, z)
    r.rotation.z = PI / 2
    for (const x of [x0, x1]) {
      k.box(g, 0.02, 0.02, Math.abs(z - wallZ), m.brass, x, Y + y, (z + wallZ) / 2)
      k.cyl(g, 0.02, 0.02, 0.01, m.brass, x, Y + y, wallZ + Math.sign(z - wallZ) * 0.005, 16).rotation.x = PI / 2
    }
    const step = (x1 - x0) / pieces.length
    pieces.forEach((P, i) => piece(g, P, x0 + step * (i + 0.5), Y + y + 0.01, z, yaw))
  }

  /* ---------- floor, walls, the open ceiling ---------- */
  const SPLIT = -12.2
  flat(g, clipped(e, [BK - 0.2, SPLIT, ZR - 0.075, ZL + 0.075]), Y + 0.006, m.herringbone, false, [], 'verde_parquet')
  flat(g, clipped(e, [SPLIT, FX, ZR - 0.075, ZL + 0.075]), Y + 0.006, m.resin, false, [], 'verde_resin')
  k.box(g, 0.02, 0.004, ZL - ZR, m.brass, SPLIT, Y + 0.008, ZC, false)
  box(s, BK - 0.1, BK, Y, soffit, ZR - 0.075, ZL + 0.075, m.green)
  box(s, BK, FX - 0.3, Y, soffit, ZL - 0.02, ZL, m.green)
  box(s, BK, FX - 0.3, Y, soffit, ZR, ZR + 0.02, m.green)
  for (const [x0, z0, x1, z1] of [[BK, ZL, FX - 0.3, ZL], [FX - 0.3, ZR, BK, ZR], [BK, ZR, BK, ZL]] as const) e.shade.foot(x0, z0, x1, z1, Y + 0.01, 0.22, 0.3)
  {
    const top = soffit - 0.004
    flat(g, rect(BK, FX, ZR - 0.075, ZL + 0.075), top, m.ceilingWhite, true, [], 'verde_ceiling')
    for (let x = BK + 1.0; x < FX - 0.4; x += 2.0) k.box(g, 0.22, 0.34, ZL - ZR, m.ceilingWhite, x, top - 0.17, ZC)
    for (const z of [ZL - 0.85, ZR + 0.85]) {
      const d = mesh(g, new CylinderGeometry(0.16, 0.16, FX - 0.6 - (BK + 0.3), 28, 1, true), m.duct, (FX - 0.6 + BK + 0.3) / 2, top - 0.55, z)
      d.rotation.z = PI / 2
      for (let x = BK + 1.2; x < FX - 0.6; x += 1.6) mesh(g, new TorusGeometry(0.163, 0.01, 6, 28), m.duct, x, top - 0.55, z, false).rotation.y = PI / 2
      for (const x of [-15.6, -11.4, -8.4]) {
        k.cyl(g, 0.09, 0.09, 0.2, m.duct, x, top - 0.8, z, 20)
        k.cyl(g, 0.13, 0.13, 0.03, m.duct, x, top - 0.91, z, 24)
      }
    }
    // Black tracks hung on rods, with big black cans aimed at the walls.
    for (const [z, aim] of [[ZC + 0.8, 1], [ZC - 0.8, -1]] as const) {
      const ty = Y + 3.7
      k.box(g, FX - 0.5 - (BK + 0.4), 0.035, 0.035, m.black, (FX - 0.5 + BK + 0.4) / 2, ty, z)
      for (const x of [BK + 1.2, -12.2, FX - 1.2]) k.cyl(g, 0.005, 0.005, top - ty, m.black, x, (top + ty) / 2, z, 6)
      for (let x = BK + 0.9; x < FX - 0.5; x += 1.3) {
        const head = at(g, x, ty - 0.03, z, 0)
        k.cyl(head, 0.012, 0.012, 0.05, m.black, 0, -0.01, 0, 8)
        const can = at(head, 0, -0.08, 0, 0)
        can.rotation.x = aim * 0.6
        can.rotation.z = (x % 2) * 0.1
        k.cyl(can, 0.055, 0.05, 0.17, m.black, 0, -0.02, 0, 20)
        k.cyl(can, 0.045, 0.045, 0.004, spot, 0, -0.107, 0, 20)
      }
    }
  }

  /* ---------- the shopfront on x = −6.6, z −6 … −1, doors at z −4.6 … −2.4 ---------- */
  {
    box(s, FX - 0.075, FX + 0.075, Y + e.ceiling, soffit, -6.0, -1.0, e.m.wallPaint)
    const F0 = FX - 0.3
    const F1 = FX + 0.05
    k.box(g, F1 - F0, 0.55, 5.04, m.green, (F0 + F1) / 2, Y + 3.0 + 0.275, -3.5)
    for (const [a, b] of [[-6.02, -5.68], [-1.32, -0.98]]) k.box(g, F1 - F0, 3.0, b - a, m.cream, (F0 + F1) / 2, Y + 1.5, (a + b) / 2)
    brandSign(s, g, letters(s, 'MAISON VERDE', 'dior', '#d8b878', 512, 128), 2.1, 0.525, F1 + 0.004, Y + 3.28, -3.5, PI / 2)
    const fr = m.brass
    box(s, FX - 0.035, FX + 0.035, Y + 2.95, Y + 3.0, -5.68, -1.32, fr)
    for (const z of [-5.65, -4.63, -2.37, -1.35]) box(s, FX - 0.035, FX + 0.035, Y, Y + 2.95, z - 0.02, z + 0.02, fr)
    box(s, FX - 0.035, FX + 0.035, Y + 2.62, Y + 2.67, -4.63, -2.37, fr)
    pane(s, g, FX, -5.62, FX, -4.66, Y + 0.02, Y + 2.95)
    pane(s, g, FX, -2.34, FX, -1.38, Y + 0.02, Y + 2.95)
    pane(s, g, FX, -4.6, FX, -2.4, Y + 2.67, Y + 2.95)
    swingLeaf(s, at(g, FX, Y, -4.6, -PI / 2), 'verde_r', 1.09, 2.6, fr, -PI / 2, true)
    swingLeaf(s, at(g, FX, Y, -2.4, PI / 2), 'verde_l', 1.09, 2.6, fr, PI / 2, true)
    box(s, FX - 0.15, FX + 0.15, Y, Y + 0.008, -4.6, -2.4, m.brass, false)
    e.shade.foot(FX + 0.06, -6.0, FX + 0.06, -1.0, Y + 0.01, 0.2, 0.25)
  }

  /* ---------- the back wall: the great niche, the narrow arch ---------- */
  {
    const nz = -2.85
    const W = 3.0
    const Hh = 3.25
    const n = at(g, BK, Y, nz, PI / 2)
    // The cream surround with rounded shoulders, standing proud of the green.
    const frame = arch(W, Hh, 0.38)
    frame.holes.push(archPath(W - 0.2, Hh - 0.1, 0.3))
    mesh(n, new ExtrudeGeometry(frame, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 }), m.cream, 0, 0, 0)
    mesh(n, new ExtrudeGeometry(arch(W - 0.2, Hh - 0.1, 0.3), { depth: 0.01, bevelEnabled: false }), lit, 0, 0, 0.005, false)
    k.box(n, W - 0.2, 0.1, 0.14, m.cream, 0, 0.05, 0.07)
    for (const x of [-0.85, 0, 0.85]) {
      const d = mesh(n, new CircleGeometry(0.035, 20), spot, x, Hh - 0.12, 0.07, false)
      d.rotation.x = PI / 2
    }
    // The poster: "Exclusive offers" in a gold frame, a small green box drawn under the words.
    const poster = m.canvas(400, 600, (c, w, h) => {
      c.fillStyle = '#f4ede0'
      c.fillRect(0, 0, w, h)
      c.fillStyle = '#1d1d1b'
      c.textAlign = 'center'
      c.font = '600 46px "Inter", "Helvetica Neue", Arial, sans-serif'
      c.fillText('EXCLUSIVE', w / 2, h * 0.48)
      c.fillText('OFFERS', w / 2, h * 0.57)
      c.font = '400 20px "Inter", Arial, sans-serif'
      c.fillText('The summer edit · up to 30% off', w / 2, h * 0.66)
      c.fillStyle = '#2f5a43'
      c.fillRect(w * 0.38, h * 0.8, w * 0.24, h * 0.08)
    })
    const pst = at(n, 0, 2.45, 0.02, 0)
    mesh(pst, new PlaneGeometry(0.6, 0.9), m.std({ map: poster, roughness: 0.8 }, 0.05), 0, 0, 0.01, false)
    for (const [bw, bh, x, y] of [[0.66, 0.03, 0, 0.465], [0.66, 0.03, 0, -0.465], [0.03, 0.96, -0.315, 0], [0.03, 0.96, 0.315, 0]] as const) k.box(pst, bw, bh, 0.02, m.brass, x, y, 0.01)
    info(s, pst, { title: 'Exclusive Offers', kind: 'Maison Verde', body: 'The summer edit: up to 30% off selected dresses on this rail and the knitwear on the shelves. Members get a further 10%.', specs: ['Until 31 August', 'Ask at the desk to join'] }, 0)
    // Two small shelves either side, with folded silk scarves.
    for (const x of [-1.05, 1.05]) {
      k.box(n, 0.42, 0.025, 0.2, m.white, x, 2.12, 0.1)
      const st = new Group()
      st.position.set(x, 2.133, 0.1)
      n.add(st)
      foldedStack(s, st, [m.cloth('satin', x < 0 ? '#c9a35f' : '#2f5a43'), m.cloth('satin', '#efe6d4'), m.cloth('satin', x < 0 ? '#b9603f' : '#9db08f')], 0.24, 0.16, 0, 0, 0, 0, x < 0 ? 3 : 7)
      info(s, st, { title: 'Silk Scarves', kind: 'Accessories · Maison Verde', body: 'Hand-rolled silk twill scarves, 90 cm square, in the season\'s colours.', specs: ['Silk twill', rupees(3490)], choices: { label: 'Quantity', options: ['1', '2', '3'] }, action: { label: 'Add to bag', run: (q) => (q ? (bag.push({ name: `Silk scarf × ${q}`, size: 'One size', price: 3490 * Number(q) }), `Added ${q} silk scarf${q === '1' ? '' : 's'}.`) : 'Choose a quantity first.') } }, 0.004)
    }
    // The brass rail of dresses across it, from bracket to bracket.
    const rx0 = BK + 0.3
    const r = mesh(g, new CylinderGeometry(0.012, 0.012, 2.6, 16), m.brass, rx0, Y + 1.78, nz)
    r.rotation.x = PI / 2
    for (const z of [nz - 1.3, nz + 1.3]) k.box(g, 0.3, 0.02, 0.02, m.brass, BK + 0.15, Y + 1.78, z)
    NICHE.forEach((P, i) => piece(g, P, rx0, Y + 1.79, nz - 1.1 + i * 0.44, PI / 2))
    lamp(s, BK + 0.8, Y + 3.0, nz, 6, 4.5, '#fff0d8')
  }
  {
    // The narrow round-headed arch: "Verde Trends", shelves of folded knits, books and a frame.
    const az = -5.1
    const a = at(g, BK, Y, az, PI / 2)
    const fr = arch(1.0, 2.75, 0, true)
    fr.holes.push(archPath(0.86, 2.68, 0, true))
    mesh(a, new ExtrudeGeometry(fr, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 }), m.cream, 0, 0, 0)
    mesh(a, new ExtrudeGeometry(arch(0.86, 2.68, 0, true), { depth: 0.01, bevelEnabled: false }), lit, 0, 0, 0.005, false)
    const sign = m.canvas(512, 256, (c, w, h) => {
      c.clearRect(0, 0, w, h)
      c.fillStyle = '#1d1d1b'
      c.textAlign = 'center'
      c.font = '600 64px "Inter", "Helvetica Neue", Arial, sans-serif'
      c.fillText('VERDE', w / 2, h * 0.42)
      c.fillText('TRENDS', w / 2, h * 0.75)
    })
    mesh(a, new PlaneGeometry(0.6, 0.3), m.std({ map: sign, transparent: true, roughness: 0.8 }, 0.02), 0, 2.15, 0.02, false)
    k.cyl(a, 0.03, 0.03, 0.01, spot, 0, 2.6, 0.06, 16).rotation.x = PI / 2
    for (const [y, mats, seed] of [[1.35, ['#d8ccb6', '#efe6d4', '#b48a5a'], 11], [0.95, ['#2f5a43', '#9db08f', '#efe6d4'], 12]] as const) {
      k.box(a, 0.82, 0.025, 0.22, m.white, 0, y, 0.11)
      const st = new Group()
      st.position.set(-0.15, y + 0.013, 0.11)
      a.add(st)
      foldedStack(s, st, mats.map((c) => m.cloth('knit', c)), 0.3, 0.2, 0, 0, 0, 0, seed)
      info(s, st, { title: 'Fine Knit Sweaters', kind: 'Knitwear · Maison Verde', body: 'Fine-gauge merino crew necks, folded in the season\'s colours.', specs: ['Extra-fine merino', 'Sizes XS–XL', rupees(5490)], choices: { label: 'Size', options: SIZES }, action: { label: 'Add to bag', run: (q) => (q ? (bag.push({ name: 'Fine knit sweater', size: q, price: 5490 }), `Added a fine knit sweater, size ${q}.`) : 'Choose your size first.') } }, 0.004)
      // Beside it, books on one shelf and a small brass frame on the other.
      if (y > 1.2)
        for (let i = 0; i < 3; i++) k.box(a, 0.2, 0.025, 0.15, [m.white, m.cream, m.green][i], 0.22, y + 0.025 + i * 0.026, 0.11)
      else {
        const f = at(a, 0.22, y + 0.013, 0.1, 0)
        for (const [bw, bh, x, yy] of [[0.18, 0.015, 0, 0.215], [0.18, 0.015, 0, 0.0075], [0.015, 0.22, -0.0825, 0.11], [0.015, 0.22, 0.0825, 0.11]] as const) k.box(f, bw, bh, 0.012, m.brass, x, yy, 0)
      }
    }
    lamp(s, BK + 0.6, Y + 2.4, az, 3, 3, '#fff0d8')
  }

  /* ---------- the right wall: a lit arcade on a step, shelving and rails ---------- */
  {
    const x0 = -16.8
    const x1 = -9.2
    const bays = 6
    const bw = (x1 - x0) / bays
    const Hh = 3.3
    const w = at(g, (x0 + x1) / 2, Y, ZR, 0)
    const plate = new Shape()
    plate.moveTo(-(x1 - x0) / 2, 0)
    plate.lineTo((x1 - x0) / 2, 0)
    plate.lineTo((x1 - x0) / 2, Hh)
    plate.lineTo(-(x1 - x0) / 2, Hh)
    plate.closePath()
    for (let i = 0; i < bays; i++) plate.holes.push(archPath(bw - 0.22, Hh - 0.32, 0, true, -(x1 - x0) / 2 + (i + 0.5) * bw))
    mesh(w, new ExtrudeGeometry(plate, { depth: 0.16, bevelEnabled: false }), m.cream, 0, 0, 0)
    k.box(w, x1 - x0, Hh, 0.01, lit, 0, Hh / 2, 0.005, false)
    // The step it stands on, lit along its nose.
    k.box(g, x1 - x0, 0.12, 0.55, m.cream, (x0 + x1) / 2, Y + 0.06, ZR + 0.275)
    k.box(g, x1 - x0, 0.004, 0.01, led, (x0 + x1) / 2, Y + 0.004, ZR + 0.56, false)
    for (let i = 0; i < bays; i++) {
      const cx = x0 + (i + 0.5) * bw
      k.cyl(g, 0.03, 0.03, 0.006, spot, cx, Y + Hh - 0.02, ZR + 0.12, 16)
    }
    e.shade.foot(x0, ZR + 0.56, x1, ZR + 0.56, Y + 0.01, 0.2, 0.3)
    // Brass-and-glass shelving in the first three arches: folded knitwear, denim and tops.
    const folded: [string, string, Cloth, string[], number][] = [
      ['Merino Crew Sweaters', 'Knitwear', 'knit', ['#d8ccb6', '#2f5a43', '#b9603f'], 5490],
      ['Organic Cotton Tees', 'T-shirts', 'cotton', ['#f4f2ec', '#1a1a1a', '#c98463'], 1990],
      ['Straight Jeans, folded', 'Denim', 'denim', ['#4f6a8f', '#2a3654', '#e7dfcd'], 4490],
      ['Linen Shirts, folded', 'Shirts', 'linen', ['#f3f0e8', '#b9cbe0', '#d9c6a6'], 4990],
      ['Cashmere Cardigans', 'Knitwear', 'knit', ['#d8ccb6', '#b48a5a', '#9db08f'], 6490],
      ['Wide-Leg Trousers, folded', 'Trousers', 'crepe', ['#ece3d1', '#171717', '#2f5a43'], 5990],
    ]
    for (let i = 0; i < 3; i++) {
      const cx = x0 + (i + 0.5) * bw
      const u0 = at(g, cx, Y + 0.12, ZR + 0.3, 0)
      const W = bw - 0.32
      const Dd = 0.38
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) k.box(u0, 0.02, 2.2, 0.02, m.brass, (sx * W) / 2, 1.1, (sz * Dd) / 2)
      for (const yy of [0.3, 0.75, 1.2, 1.65, 2.1]) {
        k.box(u0, W, 0.01, Dd, m.glass, 0, yy, 0, false)
        k.box(u0, W, 0.015, 0.015, m.brass, 0, yy - 0.01, Dd / 2)
      }
      ;[0.3, 0.75, 1.2, 1.65].forEach((yy, t) => {
        const [name, cat, cl, cols, price] = folded[(i * 2 + t) % folded.length]
        const st = new Group()
        st.position.set(0, yy + 0.006, 0)
        u0.add(st)
        foldedStack(s, st, cols.map((c) => m.cloth(cl, c)), 0.3, 0.24, -0.16, 0, 0, 0, i * 10 + t)
        foldedStack(s, st, [...cols].reverse().map((c) => m.cloth(cl, c)), 0.3, 0.24, 0.18, 0, 0, 0, i * 10 + t + 5)
        info(s, st, { title: name, kind: `${cat} · Maison Verde`, body: `Folded in its colours: ${cols.length} shades on the shelf. Ask for your size and it is brought to you.`, specs: ['Sizes XS–XL', rupees(price)], choices: { label: 'Size', options: SIZES }, action: { label: 'Add to bag', run: (q) => (q ? (bag.push({ name, size: q, price }), `Added ${name}, size ${q}.`) : 'Choose your size first.') } }, 0.004)
      })
    }
    // Rails in the three arches nearer the door.
    for (let i = 3; i < 6; i++) {
      const cx = x0 + (i + 0.5) * bw
      const z = ZR + 0.32
      const r = mesh(g, new CylinderGeometry(0.012, 0.012, bw - 0.4, 16), m.brass, cx, Y + 1.85, z)
      r.rotation.z = PI / 2
      for (const sx of [-1, 1]) k.box(g, 0.02, 0.02, 0.32, m.brass, cx + (sx * (bw - 0.4)) / 2, Y + 1.85, ZR + 0.16)
      for (let j = 0; j < 2; j++) piece(g, RIGHT[(i - 3) * 2 + j], cx - 0.24 + j * 0.48, Y + 1.86, z, 0)
    }
  }

  /* ---------- the left wall: two cream niches of rails, an arched mirror between ---------- */
  for (const [x0, x1, pieces] of [[-15.6, -13.4, TOPS], [-12.3, -10.0, TAILORING]] as const) {
    const cx = (x0 + x1) / 2
    const W = x1 - x0
    const n = at(g, cx, Y, ZL, PI)
    const fr = arch(W, 3.0, 0.32)
    fr.holes.push(archPath(W - 0.18, 2.92, 0.26))
    mesh(n, new ExtrudeGeometry(fr, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 }), m.cream, 0, 0, 0)
    mesh(n, new ExtrudeGeometry(arch(W - 0.18, 2.92, 0.26), { depth: 0.01, bevelEnabled: false }), lit, 0, 0, 0.005, false)
    k.cyl(n, 0.03, 0.03, 0.006, spot, 0, 2.86, 0.08, 16).rotation.x = PI / 2
    k.box(n, W - 0.22, 0.025, 0.24, m.white, 0, 2.3, 0.12)
    for (let i = 0; i < 3; i++) {
      const st = new Group()
      st.position.set(-W / 2 + 0.4 + i * ((W - 0.8) / 2), 2.313, 0.12)
      n.add(st)
      foldedStack(s, st, [m.cloth('cotton', ['#f4f2ec', '#d8ccb6', '#9db08f'][i]), m.cloth('cotton', ['#c98463', '#2f5a43', '#efe6d4'][i])], 0.28, 0.2, 0, 0, 0, 0, 30 + i)
    }
    rail(x1 - 0.1, x0 + 0.1, 1.82, ZL - 0.3, ZL, pieces as Piece[], PI)
  }
  {
    // The arched floor mirror between the niches, brass-framed, leaning on the wall.
    const mx = -12.85
    const mr = at(g, mx, Y, ZL - 0.08, PI)
    mr.rotation.x = 0.05
    const fr = arch(0.72, 1.95, 0, true)
    fr.holes.push(archPath(0.64, 1.91, 0, true))
    mesh(mr, new ExtrudeGeometry(fr, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 2 }), m.brass, 0, 0, 0)
    const glassM = mesh(mr, new ExtrudeGeometry(arch(0.64, 1.91, 0, true), { depth: 0.006, bevelEnabled: false }), m.std({ color: '#eef1f2', metalness: 1, roughness: 0.03 }, 1.6), 0, 0, 0.012, false)
    info(s, glassM, { title: 'Arched Mirror', kind: 'Mirror', body: 'A full-length arched mirror in a brass frame: see the whole outfit, hem to neckline.', specs: ['Silvered glass, brass', '72 × 195 cm'] }, 0.01)
  }

  /* ---------- the middle: nesting tables, poufs, mustard chairs; the green lounge ---------- */
  {
    const nt = at(g, -15.25, Y, -3.3, PI / 2 + 0.08)
    nestingTables(m, nt)
    s.e.shade.rect(-15.25, Y + 0.012, -3.3, 1.3, 1.1, 0.08, 0.4)
    info(s, nt.children[0].children[0], { title: 'Nesting Tables', kind: 'Display', body: 'White lacquer tops on brass plinths, one tucked under the other: the season\'s folded pieces and accessories.', specs: ['Lacquer, brushed brass'] }, 0)
    const st = new Group()
    st.position.set(0, 0.42, 0)
    nt.add(st)
    foldedStack(s, st, [m.cloth('knit', '#2f5a43'), m.cloth('knit', '#d8ccb6')], 0.3, 0.22, -0.25, 0, 0, 0.1, 41)
    info(s, st, { title: 'Merino Wrap Cardigans', kind: 'Knitwear · Maison Verde', body: 'Merino wrap cardigans with a tie belt, folded.', specs: ['Merino', 'Sizes XS–XL', rupees(5990)], choices: { label: 'Size', options: SIZES }, action: { label: 'Add to bag', run: (q) => (q ? (bag.push({ name: 'Merino wrap cardigan', size: q, price: 5990 }), `Added a merino wrap cardigan, size ${q}.`) : 'Choose your size first.') } }, 0.004)
    // A small vase of white flowers.
    const v = at(nt, 0.3, 0.42, -0.05, 0)
    k.cyl(v, 0.05, 0.04, 0.12, m.white, 0, 0.06, 0, 24)
    for (let i = 0; i < 9; i++) mesh(v, new SphereGeometry(0.03, 10, 8), m.cushionIvory, Math.cos(i * 2.4) * 0.06 * (i % 3 ? 1 : 0.3), 0.17 + (i % 3) * 0.02, Math.sin(i * 2.4) * 0.06 * (i % 3 ? 1 : 0.3), false)
  }
  const seat = (o: Object3D, title: string, body: string, specs: string[]) => info(s, o, { title, kind: 'Seating', body, specs }, 0)
  for (const [x, z] of [[-16.6, -2.3], [-14.1, -4.45]] as const) {
    const p = at(g, x, Y, z, 0)
    pouf(m, p, 0.24, 0.4, m.terracotta)
    s.e.shade.pool(x, Y + 0.012, z, 0.3, 0.3, 0.4)
    seat(p, 'Terracotta Pouf', 'A round pouf in terracotta velvet: perch here while you try on shoes with a dress.', ['Velvet over foam'])
  }
  {
    const p = at(g, -16.25, Y, -4.5, PI / 4)
    shellChair(m, p, m.mustard)
    s.e.shade.pool(-16.25, Y + 0.012, -4.5, 0.4, 0.4, 0.4)
    seat(p, 'Mustard Shell Chair', 'A deep shell chair in mustard velvet on slim brass legs.', ['Velvet, brass'])
    const t = at(g, -17.25, Y, -4.25, PI / 2 + 0.3)
    shellChair(m, t, m.mustard, 0.65, true)
    s.e.shade.pool(-17.25, Y + 0.012, -4.25, 0.3, 0.3, 0.35)
  }
  {
    // The green lounge nearer the door.
    const a1 = at(g, -10.0, Y, -4.5, 0.35)
    armchair(m, a1, m.greenVelvet)
    const a2 = at(g, -12.1, Y, -4.55, -0.25)
    armchair(m, a2, m.greenVelvet)
    for (const [a, x, z] of [[a1, -10.0, -4.5], [a2, -12.1, -4.55]] as const) {
      s.e.shade.pool(x, Y + 0.012, z, 0.5, 0.48, 0.45)
      const cu = at(a, 0, 0.45, -0.12, 0)
      cu.rotation.x = -0.25
      const c = mesh(cu, new SphereGeometry(1, 24, 16), m.cushionGreen, 0, 0, 0)
      c.scale.set(0.2, 0.18, 0.07)
      seat(a, 'Green Velvet Armchair', 'A rounded armchair in deep green velvet, its back and arms one curve, on brass feet: sit and wait in comfort.', ['Cotton velvet, brass', '86 × 80 × 74 cm'])
    }
    const ot = at(g, -11.05, Y, -2.75, 0)
    ottoman(m, ot, 0.55, m.greenVelvet)
    s.e.shade.pool(-11.05, Y + 0.012, -2.75, 0.62, 0.62, 0.45)
    seat(ot, 'Round Tufted Ottoman', 'A deep round ottoman in green velvet, button-tufted.', ['Velvet', 'Ø 110 cm'])
    const tp = at(g, -9.55, Y, -2.55, 0)
    pouf(m, tp, 0.22, 0.4, m.terracotta)
    s.e.shade.pool(-9.55, Y + 0.012, -2.55, 0.28, 0.28, 0.4)
    const bp = at(g, -8.7, Y, -1.85, 0)
    pouf(m, bp, 0.34, 0.42, m.boucle, true)
    s.e.shade.pool(-8.7, Y + 0.012, -1.85, 0.38, 0.38, 0.4)
    seat(bp, 'Bouclé Pouf', 'A plump round pouf in oatmeal bouclé.', ['Wool bouclé'])
  }

  /* ---------- the windows: two dressed mannequins ---------- */
  const outfits: { name: string; ways: Way[]; make: (p: Object3D, i: number) => void; price: number; note: string; cat: string }[] = [
    {
      name: 'The Evening Look', cat: 'Window', price: 16990, note: 'The emerald bias-cut slip in silk satin, to the ankle.',
      ways: [{ name: 'Emerald', hex: '#1f5a40' }, { name: 'Black', hex: '#141414' }, { name: 'Champagne', hex: '#d9c39c' }],
      make: (p, i) => dress(m, p, { len: 1.3, neck: 'scoop', sleeves: 'none', skirt: 'slip', waist: 'none' }, m.cloth('satin', outfits[0].ways[i].hex), undefined, true),
    },
    {
      name: 'The Co-ord', cat: 'Window', price: 9980, note: 'The sprigged voile shirt and its A-line skirt, worn together.',
      ways: [{ name: 'Ivory sprig', hex: '#f1ebdc' }, { name: 'Sage sprig', hex: '#c9d6bd' }],
      make: (p, i) => {
        const c = m.cloth('print', outfits[1].ways[i].hex)
        blouse(m, p, c, { neck: 'v', sleeves: 'elbow', len: 0.5, collar: true }, true)
        // The skirt, its waist under the shirt's hem, rounded out to sit on her hips.
        const sk = new Group()
        sk.position.y = -0.38
        sk.scale.set(1.12, 1, 1.95)
        p.add(sk)
        skirt(m, sk, c, 'aline', 0.74)
      },
    },
  ]
  outfits.forEach((O, i) => {
    const z = i === 0 ? -5.2 : -1.8
    const mq = at(g, -7.35, Y, z, PI / 2 - (i === 0 ? 0.25 : -0.25))
    const { shoulders } = mannequin(m, mq)
    s.e.shade.pool(-7.35, Y + 0.012, z, 0.28, 0.28, 0.4)
    let cur = 0
    const dressed = live(mq, `outfit${i}`, 'verde')
    dressed.position.y = shoulders
    O.make(dressed, 0)
    info(s, mq, {
      title: O.name, kind: 'Window · Maison Verde', body: `${O.note} Pick a colour to see it on the mannequin.`, specs: ['Sizes XS–XL', rupees(O.price)],
      inspect: () => {
        const p = new Group()
        const { shoulders: sh } = mannequin(m, p)
        const d = new Group()
        d.position.y = sh
        p.add(d)
        O.make(d, cur)
        return p
      },
      variants: {
        label: 'Colour', options: O.ways.map((w) => ({ name: w.name, swatch: w.hex })), current: () => cur,
        pick: (j) => {
          cur = j
          for (const c of [...dressed.children]) dressed.remove(c)
          O.make(dressed, j)
        },
      },
      choices: { label: 'Size', options: SIZES },
      action: { label: 'Add to bag', run: (q) => (q ? (bag.push({ name: O.name, size: q, price: O.price }), `Added ${O.name}, size ${q}.`) : 'Choose your size first.') },
    }, 0.01)
  })

  /* ---------- the cash desk, inside on the right ---------- */
  {
    const dx = -8.55
    const dz = -5.05
    const d = at(g, dx, Y, dz, PI)
    k.box(d, 1.3, 0.9, 0.55, m.cream, 0, 0.45, 0)
    k.box(d, 1.36, 0.035, 0.6, lux.statuario, 0, 0.917, 0)
    k.box(d, 1.3, 0.03, 0.012, m.brass, 0, 0.12, -0.28)
    s.e.shade.rect(dx, Y + 0.012, dz, 1.4, 0.65, 0, 0.4)
    const dr = new Group()
    dr.name = 'drawer_verde_desk'
    dr.userData.label = 'Drawer'
    dr.userData.slide = [0, 0, 0.3]
    dr.position.set(0.3, 0.75, 0.275)
    d.add(dr)
    const front = k.box(dr, 0.5, 0.14, 0.02, m.cream, 0, 0, 0.01)
    front.userData.front = true
    k.box(dr, 0.18, 0.012, 0.012, m.brass, 0, 0, 0.026)
    const inner = new Group()
    inner.name = 'contents'
    dr.add(inner)
    k.box(inner, 0.46, 0.01, 0.42, m.white, 0, -0.05, -0.21, false)
    for (let i = 0; i < 3; i++) k.box(inner, 0.12, 0.02, 0.08, m.green, -0.15 + i * 0.15, -0.035, -0.15, false)
    const till = at(d, -0.25, 0.935, -0.05, PI)
    k.cyl(till, 0.06, 0.07, 0.012, m.brass, 0, 0.006, 0, 32)
    k.cyl(till, 0.011, 0.011, 0.18, m.brass, 0, 0.1, 0, 12)
    const head = at(till, 0, 0.24, 0, 0)
    head.rotation.x = -0.3
    k.box(head, 0.27, 0.18, 0.012, m.black, 0, 0, 0)
    const scr = m.canvas(384, 256, (c, w, h) => {
      c.fillStyle = '#f6f1e8'
      c.fillRect(0, 0, w, h)
      c.fillStyle = '#2f5a43'
      c.fillRect(0, 0, w, 42)
      c.fillStyle = '#e9d9b8'
      c.font = '500 22px "Cormorant Garamond", Georgia, serif'
      c.fillText('MAISON VERDE', 16, 29)
      c.fillStyle = '#2e2a24'
      c.textAlign = 'center'
      c.font = '500 26px "Inter", Arial, sans-serif'
      c.fillText('Tap to check out', w / 2, h * 0.58)
      c.font = '400 15px "Inter", Arial, sans-serif'
      c.fillText('Cards · UPI · Wallets', w / 2, h * 0.8)
    })
    const sm = new MeshStandardMaterial({ map: scr, emissiveMap: scr, emissive: '#ffffff', emissiveIntensity: 0.6, roughness: 0.3 })
    sm.userData.interior = true
    const btn = button(head, 'till', 'Till', 'Check out', 0, 0, 0.007, () => useInfoStore.getState().show({ ...checkout(), place: `First Floor · ${s.u.name} (${s.u.id})` }), 'verde')
    mesh(btn, new PlaneGeometry(0.25, 0.165), sm, 0, 0, 0, false)
    info(s, d.children[0], { title: 'Cash Desk', kind: 'Maison Verde', body: 'Cream lacquer under a Statuario top: tap the till\'s screen to check out what is in your bag.', specs: ['Alterations in 48 hours', 'Gift boxing, free'] }, 0)
  }

  /* ---------- lighting and its switches ---------- */
  lamp(s, -9.4, Y + 3.4, ZC, 8, 7)
  lamp(s, -12.6, Y + 3.4, ZC, 8, 7)
  lamp(s, -15.6, Y + 3.4, ZC, 7, 7)
  {
    const sw = new Group()
    sw.position.set(-7.05, Y + 1.2, ZL - 0.001)
    sw.rotation.y = PI
    g.add(sw)
    const plate = switchPlate(k, sw, 'verde', ['switch', 'switch'], { plate: m.brass, rocker: m.brass, dark: m.black, locator: lux.ledCool as MeshStandardMaterial }, [s.circuit, display])
    plate.traverse((o) => {
      if (o.name === 'switch_verde_0') o.userData.label = 'Shop lights'
      if (o.name === 'switch_verde_1') o.userData.label = 'Niche, arcade & shelf lighting'
    })
    setCircuit(s.circuit, true)
    setCircuit(display, true)
  }
  return s
}
