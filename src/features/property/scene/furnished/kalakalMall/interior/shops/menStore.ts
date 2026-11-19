import { CatmullRomCurve3, CircleGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, PlaneGeometry, SphereGeometry, TorusGeometry, TubeGeometry, Vector3, type Material, type Object3D } from 'three'
import { useInfoStore, type EquipmentInfo } from '../../../../../../../store/info'
import { circuit, setCircuit, switchPlate } from '../../../kalakalD65/fixtures'
import { rng } from '../../../textures'
import { mergeStatic } from '../../../optimize'
import { clipped, type FloorCtx } from '../shell'
import type { Unit } from '../units'
import { button, info, live } from './cafe'
import { fabrics } from './fabrics'
import { foldedStack } from './goods'
import { maleMannequin, menGarment, type MenStyle } from './menswear'
import { at, box, branches, brandSign, flat, lamp, letters, mesh, onCircuit, openShop, pane, PI, rect, swingLeaf } from './kit'
import { hanger, womenswearMaterials } from './womenswear'

/*
 * Atelier Noir, unit 1-02: menswear on the first floor, the second shop on the west spine, 11.2 m
 * deep and 5.35 m wide. Built from the reference, looking in from the door:
 *
 *   room      black throughout: matte black walls, a black open ceiling with a fine black grid, a
 *             pale polished concrete floor
 *   light     hundreds of warm filament bulbs hung on fine cords at different heights, and strings of
 *             bulbs swagged along both walls; great round mirrors in thin brass rims hung tilted
 *             from rods, catching the rails below; bare white branches strung with lights in the
 *             back corners
 *   rails     long black rails down both walls (jackets, shirts, knitwear, trousers), a rail of coats
 *             across the back, four freestanding black rails of tailoring and outerwear in the middle
 *   tables    a long black table of folded knitwear by the door, an oak table of shirts and chinos at
 *             the back
 *   front     a dressed mannequin in each window, the cash desk inside on the right, a full-length
 *             mirror on the left wall
 *
 * Every garment can be picked from its rail and explains itself (fabric, fit, sizes, price), turned
 * in its card; those on the freestanding rails and the mannequins show their other colours too.
 * The folded stacks have their sizes; the desk takes the bag through and its drawer opens; two
 * switches by the door work the lights and the bulbs.
 */

const FX = -6.6
const BK = -17.8
const ZR = -0.925
const ZL = 4.425
const ZC = (ZR + ZL) / 2

/* ---------- the collection ---------- */

type Kind = 'wool' | 'cotton' | 'linen' | 'denim' | 'knit' | 'jersey' | 'velvet' | 'silk'
interface Way {
  name: string
  hex: string
}
interface Piece {
  name: string
  cat: string
  style: MenStyle
  kind: Kind
  fabric: string
  fit: string
  price: number
  sizes: string[]
  ways: Way[]
  note: string
  /** A shirt under a jacket, in its colour. */
  inner?: string
}

const TAILORING_SIZES = ['46', '48', '50', '52', '54', '56']
const TOP_SIZES = ['S', 'M', 'L', 'XL', 'XXL']
const WAIST = ['30', '32', '34', '36', '38']

const P: Record<string, Piece> = {
  suit: { name: 'Two-Piece Suit', cat: 'Suits', style: 'jacket', kind: 'wool', fabric: 'Super 120s wool', fit: 'Tailored', price: 54900, sizes: TAILORING_SIZES, inner: '#f3f1ec', note: 'A two-piece suit in Super 120s wool: a soft-shouldered single-breasted jacket, half-canvassed, and flat-front trousers.', ways: [{ name: 'Charcoal', hex: '#2f3033' }, { name: 'Navy', hex: '#1d2538' }, { name: 'Mid grey', hex: '#6b6c70' }] },
  blazer: { name: 'Unstructured Blazer', cat: 'Blazers', style: 'jacket', kind: 'wool', fabric: 'Wool-linen hopsack', fit: 'Regular', price: 32900, sizes: TAILORING_SIZES, inner: '#e8e4dc', note: 'An unlined, unstructured blazer in wool-linen hopsack, patch pockets, horn buttons.', ways: [{ name: 'Camel', hex: '#a9824f' }, { name: 'Navy', hex: '#1d2538' }, { name: 'Olive', hex: '#5d5a3c' }] },
  dinner: { name: 'Velvet Dinner Jacket', cat: 'Party wear', style: 'jacket', kind: 'velvet', fabric: 'Cotton velvet, satin lapels', fit: 'Slim', price: 44900, sizes: TAILORING_SIZES, inner: '#f3f1ec', note: 'A shawl-collar dinner jacket in cotton velvet with satin facings, for evenings.', ways: [{ name: 'Midnight', hex: '#151a2b' }, { name: 'Bottle green', hex: '#173528' }, { name: 'Burgundy', hex: '#4a1420' }] },
  overcoat: { name: 'Wool Overcoat', cat: 'Outerwear', style: 'coat', kind: 'wool', fabric: 'Double-faced wool-cashmere', fit: 'Regular', price: 69900, sizes: TOP_SIZES, note: 'A knee-length overcoat in double-faced wool and cashmere, notch lapels, set-in sleeves.', ways: [{ name: 'Camel', hex: '#a9824f' }, { name: 'Charcoal', hex: '#34353a' }, { name: 'Black', hex: '#161616' }] },
  trench: { name: 'Cotton Trench', cat: 'Outerwear', style: 'coat', kind: 'cotton', fabric: 'Cotton gabardine', fit: 'Regular', price: 38900, sizes: TOP_SIZES, note: 'A double-breasted trench in water-repellent cotton gabardine.', ways: [{ name: 'Stone', hex: '#c2ad88' }, { name: 'Navy', hex: '#222b40' }] },
  rust: { name: 'Suede Jacket', cat: 'Jackets', style: 'jacket', kind: 'velvet', fabric: 'Goat suede', fit: 'Regular', price: 49900, sizes: TOP_SIZES, inner: '#efe9dc', note: 'A soft goat-suede jacket in a rich rust, unlined.', ways: [{ name: 'Rust', hex: '#8f4a26' }, { name: 'Tobacco', hex: '#6b4a2e' }] },
  oxford: { name: 'Oxford Shirt', cat: 'Formal shirts', style: 'shirt', kind: 'cotton', fabric: 'Two-fold cotton oxford', fit: 'Slim', price: 5490, sizes: ['38', '39', '40', '41', '42', '44'], note: 'A button-down collar shirt in two-fold oxford cotton.', ways: [{ name: 'White', hex: '#f3f1ec' }, { name: 'Blue', hex: '#a9bfd8' }, { name: 'Pink', hex: '#e7c5c3' }] },
  linen: { name: 'Linen Shirt', cat: 'Casual shirts', style: 'shirt', kind: 'linen', fabric: 'Irish linen', fit: 'Relaxed', price: 4990, sizes: TOP_SIZES, note: 'A relaxed shirt in washed Irish linen.', ways: [{ name: 'Ecru', hex: '#e7dfcd' }, { name: 'Sky', hex: '#b9cbe0' }, { name: 'Olive', hex: '#7a7656' }] },
  polo: { name: 'Knitted Polo', cat: 'Polo T-shirts', style: 'polo', kind: 'knit', fabric: 'Merino', fit: 'Regular', price: 6490, sizes: TOP_SIZES, note: 'A fine-knit polo in extra-fine merino.', ways: [{ name: 'Navy', hex: '#1f2a44' }, { name: 'Ecru', hex: '#e7dfcd' }, { name: 'Rust', hex: '#a35a32' }] },
  tee: { name: 'Heavy Cotton Tee', cat: 'T-shirts', style: 'tee', kind: 'jersey', fabric: 'Organic cotton jersey', fit: 'Boxy', price: 2490, sizes: TOP_SIZES, note: 'A heavyweight tee in organic cotton.', ways: [{ name: 'Black', hex: '#161616' }, { name: 'White', hex: '#f3f1ec' }, { name: 'Grey', hex: '#8a8a8c' }] },
  crew: { name: 'Merino Crew Neck', cat: 'Knitwear', style: 'knit', kind: 'knit', fabric: 'Extra-fine merino', fit: 'Regular', price: 7990, sizes: TOP_SIZES, note: 'A fine crew neck in extra-fine merino.', ways: [{ name: 'Charcoal', hex: '#36373b' }, { name: 'Camel', hex: '#a9824f' }, { name: 'Navy', hex: '#1f2a44' }] },
  chinos: { name: 'Pleated Chinos', cat: 'Chinos', style: 'trousers', kind: 'cotton', fabric: 'Cotton twill', fit: 'Tapered', price: 6990, sizes: WAIST, note: 'Single-pleated chinos in a soft cotton twill.', ways: [{ name: 'Stone', hex: '#c2ad88' }, { name: 'Navy', hex: '#222b40' }, { name: 'Olive', hex: '#5d5a3c' }] },
  trousers: { name: 'Wool Trousers', cat: 'Formal trousers', style: 'trousers', kind: 'wool', fabric: 'Wool flannel', fit: 'Straight', price: 9990, sizes: WAIST, note: 'Flannel trousers with side adjusters and a pressed crease.', ways: [{ name: 'Grey', hex: '#6b6c70' }, { name: 'Charcoal', hex: '#2f3033' }] },
  jeans: { name: 'Selvedge Jeans', cat: 'Denim', style: 'jeans', kind: 'denim', fabric: '13.5 oz Japanese selvedge', fit: 'Slim straight', price: 11990, sizes: WAIST, note: 'Raw selvedge denim from Okayama, slim straight.', ways: [{ name: 'Raw indigo', hex: '#24304d' }, { name: 'Rinse', hex: '#33456a' }] },
  kurta: { name: 'Silk Kurta', cat: 'Ethnic wear', style: 'kurta', kind: 'silk', fabric: 'Raw silk', fit: 'Regular', price: 14990, sizes: TOP_SIZES, note: 'A straight kurta in raw silk with a band collar, for festive days.', ways: [{ name: 'Ivory', hex: '#efe6cf' }, { name: 'Midnight', hex: '#1d2538' }, { name: 'Wine', hex: '#5a1626' }] },
}

const rupees = (n: number) => `₹ ${n.toLocaleString('en-IN')}`
const bag: { name: string; size: string; price: number }[] = []

function checkout(): Omit<EquipmentInfo, 'place'> {
  const total = bag.reduce((a, l) => a + l.price, 0)
  return {
    title: 'The Cash Desk',
    kind: 'Atelier Noir · Checkout',
    body: bag.length ? 'Each piece is checked, folded in tissue and boxed; alterations are pinned at the desk.' : 'Your bag is empty. Tap any garment, choose a size and add it; then pay here.',
    specs: bag.length ? [...bag.map((l) => `${l.name} · ${l.size} · ${rupees(l.price)}`), `Total ${rupees(total)} (incl. GST)`] : ['Cards, UPI and wallets', 'Alterations in 48 hours', 'Exchanges within 30 days'],
    action: bag.length
      ? {
          label: `Pay ${rupees(total)}`,
          run: () => {
            bag.length = 0
            return 'Paid, thank you. Your pieces are being boxed; your receipt is on its way by SMS.'
          },
        }
      : undefined,
  }
}

const addToBag = (name: string, price: number) => (size: string | null) => {
  if (!size) return 'Choose your size first.'
  bag.push({ name, size, price })
  return `Added ${name}, size ${size}. ${bag.length} ${bag.length === 1 ? 'piece' : 'pieces'} in your bag: pay at the desk by the door.`
}

export function buildMenStore(e: FloorCtx, u: Unit) {
  const s = openShop(e, u)
  const { k, lux } = e
  const { g, y: Y } = s
  const f = fabrics(e)
  const wm = womenswearMaterials(e)
  const soffit = e.soffit
  const mark = <T extends Material>(x: T) => ((x.userData.interior = true), x)
  const env = e.m.env
  const std = (p: ConstructorParameters<typeof MeshStandardMaterial>[0], reflect = 0.5) => mark(new MeshStandardMaterial({ envMap: env, envMapIntensity: reflect, ...p }))
  const M = {
    black: std({ color: '#121212', roughness: 0.7 }, 0.1),
    blackSteel: std({ color: '#141414', metalness: 0.6, roughness: 0.4 }, 0.5),
    lacquer: std({ color: '#0e0e0e', roughness: 0.22 }, 0.7),
    concrete: std({ map: wm.canvas(512, 512, (c, w, h) => {
      const r = rng(9101)
      c.fillStyle = '#cfc9bf'
      c.fillRect(0, 0, w, h)
      c.filter = 'blur(20px)'
      for (let i = 0; i < 40; i++) {
        c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.12)' : 'rgba(110,100,90,.1)'
        c.beginPath()
        c.ellipse(r() * w, r() * h, 40 + r() * 120, 20 + r() * 60, r() * 3, 0, 7)
        c.fill()
      }
      c.filter = 'none'
      for (let i = 0; i < 9000; i++) {
        c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'
        c.fillRect(r() * w, r() * h, 1.5, 1.5)
      }
    }), roughness: 0.28 }, 0.5),
    oak: std({ color: '#9a7650', roughness: 0.45 }, 0.25),
    slate: std({ color: '#2b2b2c', roughness: 0.55 }, 0.2),
    brass: lux.brass,
    mirror: std({ color: '#e6e9ea', metalness: 1, roughness: 0.03, side: 2 }, 1.6),
    cord: std({ color: '#1a1a1a', roughness: 0.6 }, 0.1),
    leather: std({ color: '#7a4a2a', roughness: 0.5 }, 0.3),
  }
  M.concrete.map!.repeat.set(1 / 2.4, 1 / 2.4)

  const display = circuit()
  const glowOf = (mat: MeshStandardMaterial) => {
    const n = mat.clone()
    n.userData.interior = true
    display.glows.push(n)
    return n
  }
  const bulb = glowOf(std({ color: '#ffd9a0', emissive: '#ffb860', emissiveIntensity: 2.2, roughness: 0.3 }, 0))
  const spot = onCircuit(s, lux.led as MeshStandardMaterial)

  // The cloths: an even woven or knitted relief at the true scale of the weave, no streaky fleck.
  const cloth = (kind: Kind, hex: string): Material => {
    switch (kind) {
      case 'wool':
        return wm.cloth('wool', hex)
      case 'cotton':
      case 'jersey':
        return wm.cloth('cotton', hex)
      case 'linen':
        return wm.cloth('linen', hex)
      case 'denim':
        return wm.cloth('denim', hex)
      case 'knit':
        return wm.cloth('knit', hex)
      case 'velvet':
        return wm.cloth('velvet', hex)
      case 'silk':
        return wm.cloth('satin', hex)
    }
  }
  /** One garment of a piece in a colourway on its hanger, the hook at local (0, 0, 0), front to +z. */
  const make = (p: Object3D, Pc: Piece, i: number) => {
    const mat = cloth(Pc.kind, Pc.ways[i].hex)
    const legs = Pc.style === 'trousers' || Pc.style === 'jeans'
    const tailored = Pc.style === 'jacket' || Pc.style === 'coat'
    hanger(wm, p, legs ? 'clip' : 'wood', legs ? 0.16 : tailored ? 0.225 : 0.2)
    const b = new Group()
    b.position.y = -0.072
    p.add(b)
    menGarment(s, wm, b, Pc.style, mat, { inner: Pc.inner ? wm.cloth('cotton', Pc.inner) : undefined, buttons: Pc.style === 'shirt' || Pc.style === 'polo' ? f.enamel('#f2f0ea') : undefined, doubleBreasted: Pc.name.includes('Trench') })
  }
  const card = (Pc: Piece, i: () => number, inspect: () => Object3D, variants?: EquipmentInfo['variants']): Omit<EquipmentInfo, 'place'> => ({
    title: Pc.name,
    kind: `${Pc.cat} · Atelier Noir`,
    body: `${Pc.note} Drag it to turn it; scroll or pinch to look closer at the collar, buttons and cloth.${variants ? ' Pick a colour to see it on the rail.' : ''}`,
    specs: [`Fabric: ${Pc.fabric}`, `Fit: ${Pc.fit}`, `Colour: ${Pc.ways[i()].name}${Pc.ways.length > 1 ? ` (also ${Pc.ways.filter((_, j) => j !== i()).map((w) => w.name).join(', ')})` : ''}`, `Sizes ${Pc.sizes[0]}–${Pc.sizes[Pc.sizes.length - 1]}`, rupees(Pc.price)],
    inspect,
    variants,
    choices: { label: 'Size', options: Pc.sizes },
    action: { label: 'Add to bag', run: addToBag(Pc.name, Pc.price) },
  })
  /** A garment on a rail. With `variants` it is kept whole (and recolourable); otherwise it merges with the floor. */
  let gid = 0
  const garment = (par: Object3D, key: keyof typeof P, way: number, x: number, y: number, z: number, yaw: number, variants: boolean) => {
    const Pc = P[key]
    let cur = way % Pc.ways.length
    const holder = variants ? live(par, `garment${gid++}`, 'noir') : new Group()
    if (!variants) par.add(holder)
    holder.position.set(x, y, z)
    holder.rotation.y = yaw
    const build = () => {
      const inner = new Group()
      holder.add(inner)
      make(inner, Pc, cur)
      if (variants) mergeStatic(inner)
    }
    build()
    info(s, holder, card(Pc, () => cur, () => {
      const p = new Group()
      make(p, Pc, cur)
      return p
    }, variants
      ? {
          label: 'Colour',
          options: Pc.ways.map((w) => ({ name: w.name, swatch: w.hex })),
          current: () => cur,
          pick: (j) => {
            cur = j
            for (const c of [...holder.children]) {
              holder.remove(c)
              c.traverse((o) => (o as Mesh).geometry?.dispose())
            }
            build()
          },
        }
      : undefined), 0.005)
    return holder
  }

  /* ---------- floor, walls, the black ceiling ---------- */
  flat(g, clipped(e, u.rects[0]), Y + 0.006, M.concrete, false, [], 'noir_floor')
  box(s, BK - 0.1, BK, Y, soffit, ZR - 0.075, ZL + 0.075, M.black)
  box(s, BK, FX - 0.3, Y, soffit, ZR, ZR + 0.02, M.black)
  box(s, BK, FX - 0.3, Y, soffit, ZL - 0.02, ZL, M.black)
  for (const [x0, z0, x1, z1] of [[BK, ZL, FX - 0.3, ZL], [FX - 0.3, ZR, BK, ZR], [BK, ZR, BK, ZL]] as const) e.shade.foot(x0, z0, x1, z1, Y + 0.01, 0.22, 0.25)
  const top = soffit - 0.004
  flat(g, rect(BK, FX, ZR - 0.075, ZL + 0.075), top, M.black, true, [], 'noir_ceiling')
  {
    // A fine black grid under the slab.
    const gy = Y + 4.2
    for (let x = BK + 0.6; x < FX - 0.2; x += 1.2) k.box(g, 0.025, 0.04, ZL - ZR, M.blackSteel, x, gy, ZC, false)
    for (let z = ZR + 0.4; z < ZL; z += 1.2) k.box(g, FX - BK, 0.04, 0.025, M.blackSteel, (FX + BK) / 2, gy, z, false)
  }
  {
    // The filament bulbs: warm points on fine cords at every height, thick over the middle.
    const r = rng(9111)
    const glass = new SphereGeometry(0.022, 10, 8)
    for (let i = 0; i < 150; i++) {
      const x = BK + 0.5 + r() * (FX - 0.6 - BK - 0.5)
      const z = ZR + 0.35 + r() * (ZL - ZR - 0.7)
      const yy = Y + 2.9 + r() * 1.2
      mesh(g, new CylinderGeometry(0.0015, 0.0015, top - yy, 3), M.cord, x, (top + yy) / 2, z, false)
      const b = new Mesh(glass, bulb)
      b.position.set(x, yy - 0.02, z)
      b.scale.y = 1.4
      g.add(b)
    }
  }
  {
    // The round mirrors in thin brass rims, hung tilted from rods.
    const discs: [number, number, number, number, number][] = [
      [-8.9, 2.7, 0.72, 3.55, 0.45], [-10.7, 0.5, 0.58, 3.8, -0.4], [-11.5, 3.3, 0.88, 3.45, 0.5], [-13.3, 1.4, 0.68, 3.65, -0.35],
      [-14.9, 3.3, 0.55, 3.9, 0.4], [-15.6, 0.4, 0.62, 3.55, -0.5], [-16.9, 2.2, 0.5, 3.95, 0.3], [-12.5, 2.0, 0.42, 4.05, 0.2],
    ]
    for (const [x, z, r, h, tilt] of discs) {
      const d = at(g, x, Y + h, z, tilt * 2)
      const face = new Group()
      face.rotation.x = -PI / 2 + Math.abs(tilt) * 0.9
      d.add(face)
      mesh(face, new CircleGeometry(r, 64), M.mirror, 0, 0, 0, false)
      mesh(face, new TorusGeometry(r, 0.012, 8, 96), M.brass, 0, 0, 0, false)
      face.updateMatrixWorld(true)
      for (let j = 0; j < 3; j++) {
        const a = (j / 3) * PI * 2 + 0.4
        const p = new Vector3(Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92, 0)
        d.updateMatrixWorld(true)
        const wpt = face.localToWorld(p.clone())
        const lp = g.worldToLocal(wpt)
        k.cyl(g, 0.003, 0.003, top - lp.y, M.blackSteel, lp.x, (top + lp.y) / 2, lp.z, 6)
      }
      info(s, face, { title: 'Hanging Mirrors', kind: 'Atelier Noir', body: 'Round mirrors in thin brass rims hung tilted under the black ceiling, catching the rails and the lights below: look up to see yourself among them.', specs: ['Silvered glass, brass'] }, 0)
    }
  }

  /* ---------- the shopfront on x = −6.6, z −1 … 4.5, doors at z 0.65 … 2.85 ---------- */
  {
    box(s, FX - 0.075, FX + 0.075, Y + e.ceiling, soffit, -1.0, 4.5, e.m.wallPaint)
    const F0 = FX - 0.3
    const F1 = FX + 0.05
    k.box(g, F1 - F0, 0.55, 5.54, M.lacquer, (F0 + F1) / 2, Y + 3.275, ZC)
    for (const [a, b] of [[-1.02, -0.68], [4.18, 4.52]]) k.box(g, F1 - F0, 3.0, b - a, M.black, (F0 + F1) / 2, Y + 1.5, (a + b) / 2)
    brandSign(s, g, letters(s, 'ATELIER NOIR', 'prada', '#d8c9a8', 512, 128), 2.2, 0.55, F1 + 0.004, Y + 3.28, ZC, PI / 2)
    const fr = M.blackSteel
    box(s, FX - 0.03, FX + 0.03, Y + 2.95, Y + 3.0, -0.68, 4.18, fr)
    for (const z of [-0.65, 0.63, 2.87, 4.15]) box(s, FX - 0.03, FX + 0.03, Y, Y + 2.95, z - 0.02, z + 0.02, fr)
    box(s, FX - 0.03, FX + 0.03, Y + 2.62, Y + 2.67, 0.63, 2.87, fr)
    pane(s, g, FX, -0.62, FX, 0.6, Y + 0.02, Y + 2.95)
    pane(s, g, FX, 2.9, FX, 4.12, Y + 0.02, Y + 2.95)
    pane(s, g, FX, 0.65, FX, 2.85, Y + 2.67, Y + 2.95)
    swingLeaf(s, at(g, FX, Y, 0.65, -PI / 2), 'noir_r', 1.09, 2.6, fr, -PI / 2, true)
    swingLeaf(s, at(g, FX, Y, 2.85, PI / 2), 'noir_l', 1.09, 2.6, fr, PI / 2, true)
    box(s, FX - 0.15, FX + 0.15, Y, Y + 0.008, 0.65, 2.85, M.blackSteel, false)
    e.shade.foot(FX + 0.06, -1.0, FX + 0.06, 4.5, Y + 0.01, 0.2, 0.25)
  }

  /* ---------- the wall rails, with strings of bulbs swagged above ---------- */
  const wallRail = (wall: 'left' | 'right', x0: number, x1: number, items: [keyof typeof P, number][]) => {
    const face = wall === 'left' ? ZL : ZR
    const dir = wall === 'left' ? -1 : 1
    const z = face + dir * 0.3
    const ry = Y + 1.82
    const bar = mesh(g, new CylinderGeometry(0.013, 0.013, x1 - x0, 12), M.blackSteel, (x0 + x1) / 2, ry, z)
    bar.rotation.z = PI / 2
    for (let x = x0; x <= x1 + 0.001; x += (x1 - x0) / Math.max(1, Math.round((x1 - x0) / 1.3))) k.box(g, 0.02, 0.02, 0.3, M.blackSteel, x, ry, face + dir * 0.15)
    const pitch = (x1 - x0) / items.length
    // Hung side-on, their fronts all the same way along the rail.
    items.forEach(([key, way], i) => garment(g, key, way, x0 + pitch * (i + 0.5), ry + 0.01, z, -PI / 2, false))
    e.shade.foot(x0, face, x1, face, Y + 0.01, 0.35, 0.3)
  }
  const swag = (wall: 'left' | 'right', x0: number, x1: number) => {
    const face = wall === 'left' ? ZL : ZR
    const dir = wall === 'left' ? -1 : 1
    const z = face + dir * 0.06
    const hy = Y + 2.62
    const span = 1.1
    for (let x = x0; x < x1 - 0.01; x += span) {
      const pts: Vector3[] = []
      for (let i = 0; i <= 10; i++) {
        const t = i / 10
        pts.push(new Vector3(x + span * t, hy - 0.12 * Math.sin(t * PI), z))
      }
      mesh(g, new TubeGeometry(new CatmullRomCurve3(pts), 16, 0.002, 3, false), M.cord, 0, 0, 0, false)
      for (let i = 1; i < 5; i++) {
        const t = i / 5
        const b = mesh(g, new SphereGeometry(0.02, 10, 8), bulb, x + span * t, hy - 0.12 * Math.sin(t * PI) - 0.03, z, false)
        b.scale.y = 1.4
      }
      k.cyl(g, 0.008, 0.008, 0.02, M.brass, x, hy, z, 8)
    }
  }
  wallRail('left', -16.4, -13.2, [['overcoat', 1], ['trench', 0], ['suit', 0], ['suit', 1], ['blazer', 0], ['blazer', 2], ['rust', 0], ['dinner', 0], ['dinner', 1], ['kurta', 0]])
  wallRail('left', -12.2, -9.7, [['oxford', 0], ['oxford', 1], ['oxford', 2], ['linen', 0], ['linen', 1], ['linen', 2], ['kurta', 1], ['kurta', 2]])
  wallRail('right', -16.4, -13.2, [['crew', 0], ['crew', 1], ['crew', 2], ['polo', 0], ['polo', 1], ['polo', 2], ['tee', 0], ['tee', 1], ['tee', 2]])
  wallRail('right', -12.2, -9.7, [['chinos', 0], ['chinos', 1], ['chinos', 2], ['trousers', 0], ['trousers', 1], ['jeans', 0], ['jeans', 1]])
  swag('left', -16.8, -8.6)
  swag('right', -16.8, -8.6)

  /* ---------- the back: a rail of coats, the lit branches in the corners ---------- */
  {
    const x = BK + 0.32
    const ry = Y + 1.9
    const bar = mesh(g, new CylinderGeometry(0.013, 0.013, 2.6, 12), M.blackSteel, x, ry, ZC)
    bar.rotation.x = PI / 2
    for (const z of [ZC - 1.3, ZC + 1.3]) k.box(g, 0.32, 0.02, 0.02, M.blackSteel, BK + 0.16, ry, z)
    ;([['overcoat', 0], ['overcoat', 2], ['trench', 1], ['overcoat', 1], ['trench', 0], ['rust', 1], ['overcoat', 0]] as [keyof typeof P, number][]).forEach(([key, way], i) => garment(g, key, way, x, ry + 0.01, ZC - 1.1 + i * (2.2 / 6), 0, false))
    for (const z of [ZR + 0.45, ZL - 0.45]) {
      const t = branches(s, g, BK + 0.45, Y, z, 1.9, Math.round(z * 10) + 50)
      t.scale.setScalar(1.15)
      const r = rng(Math.round(z * 100) + 7)
      for (let i = 0; i < 70; i++) {
        const a = r() * PI * 2
        const hh = 0.6 + r() * 1.6
        const rad = (0.08 + r() * 0.5) * Math.min(1, hh / 1.0)
        mesh(g, new SphereGeometry(0.008, 6, 4), bulb, BK + 0.45 + Math.cos(a) * rad, Y + hh, z + Math.sin(a) * rad, false)
      }
      info(s, t.children[0], { title: 'Lit Branches', kind: 'Atelier Noir', body: 'Bare white branches strung with tiny warm lights in a white ceramic planter.', specs: ['Not for sale'] }, 0)
    }
  }

  /* ---------- the freestanding rails in the middle ---------- */
  const freeRail = (x0: number, x1: number, z: number, items: [keyof typeof P, number][]) => {
    const ry = Y + 1.78
    for (const x of [x0, x1]) {
      k.box(g, 0.03, 1.78, 0.03, M.blackSteel, x, Y + 0.89, z)
      k.box(g, 0.03, 0.02, 0.5, M.blackSteel, x, Y + 0.01, z)
    }
    const bar = mesh(g, new CylinderGeometry(0.013, 0.013, Math.abs(x1 - x0), 12), M.blackSteel, (x0 + x1) / 2, ry, z)
    bar.rotation.z = PI / 2
    const pitch = (x1 - x0) / items.length
    items.forEach(([key, way], i) => garment(g, key, way, x0 + pitch * (i + 0.5), ry + 0.01, z, -PI / 2, true))
    e.shade.rect((x0 + x1) / 2, Y + 0.012, z, Math.abs(x1 - x0), 0.6, 0, 0.3)
  }
  freeRail(-10.0, -11.7, 0.75, [['suit', 2], ['suit', 0], ['blazer', 1], ['blazer', 0], ['dinner', 2], ['suit', 1]])
  freeRail(-10.0, -11.7, 2.75, [['overcoat', 0], ['trench', 0], ['rust', 0], ['overcoat', 1], ['blazer', 2]])
  freeRail(-13.0, -14.7, 0.75, [['oxford', 1], ['linen', 2], ['polo', 2], ['crew', 1], ['oxford', 0], ['kurta', 0]])
  freeRail(-13.0, -14.7, 2.75, [['jeans', 0], ['chinos', 1], ['trousers', 1], ['chinos', 0], ['jeans', 1]])

  /* ---------- the tables ---------- */
  const stackCard = (Pc: Piece, w: number): Omit<EquipmentInfo, 'place'> => ({
    title: `${Pc.name}, folded`,
    kind: `${Pc.cat} · Atelier Noir`,
    body: `${Pc.note} Folded in ${Pc.ways[w].name.toLowerCase()}; your size is brought to you.`,
    specs: [`Fabric: ${Pc.fabric}`, `Fit: ${Pc.fit}`, `Sizes ${Pc.sizes[0]}–${Pc.sizes[Pc.sizes.length - 1]}`, rupees(Pc.price)],
    choices: { label: 'Size', options: Pc.sizes },
    action: { label: 'Add to bag', run: addToBag(`${Pc.name} (${Pc.ways[w].name})`, Pc.price) },
  })
  {
    // In the middle, lengthwise between the freestanding rails (the way in stays clear): a long
    // black table of folded knitwear, laid in rows.
    const tx = -12.35
    const t = at(g, tx, Y, ZC, PI / 2)
    k.box(t, 0.95, 0.06, 2.5, M.blackSteel, 0, 0.03, 0)
    k.box(t, 0.92, 0.66, 2.44, M.lacquer, 0, 0.39, 0)
    k.box(t, 1.0, 0.04, 2.56, M.lacquer, 0, 0.74, 0)
    k.box(t, 0.9, 0.012, 2.4, M.slate, 0, 0.766, 0)
    e.shade.rect(tx, Y + 0.012, ZC, 2.6, 1.05, 0, 0.45)
    const knits: [keyof typeof P, number][] = [['crew', 0], ['crew', 2], ['polo', 1], ['crew', 1], ['polo', 0], ['polo', 2], ['crew', 0], ['tee', 1], ['crew', 2], ['tee', 0], ['polo', 1], ['crew', 1]]
    knits.forEach(([key, w], i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      const st = new Group()
      st.position.set(-0.28 + col * 0.28, 0.772, -0.9 + row * 0.6)
      t.add(st)
      const Pc = P[key]
      const mats = Array.from({ length: 4 + (i % 3) }, () => cloth(Pc.kind, Pc.ways[w].hex))
      foldedStack(s, st, mats, 0.26, 0.3, 0, 0, 0, PI / 2, 100 + i)
      info(s, st, stackCard(Pc, w), 0.004)
    })
  }
  {
    // At the back: an oak table on black legs, folded shirts and chinos.
    const tx = -16.0
    const t = at(g, tx, Y, ZC, 0)
    k.box(t, 0.9, 0.05, 1.8, M.oak, 0, 0.74, 0)
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) k.box(t, 0.04, 0.715, 0.04, M.blackSteel, sx * 0.4, 0.3575, sz * 0.85)
    e.shade.rect(tx, Y + 0.012, ZC, 0.95, 1.85, 0, 0.35)
    const items: [keyof typeof P, number][] = [['oxford', 0], ['oxford', 1], ['linen', 0], ['chinos', 0], ['chinos', 2], ['jeans', 0]]
    items.forEach(([key, w], i) => {
      const st = new Group()
      st.position.set(-0.2 + (i % 2) * 0.4, 0.765, -0.6 + Math.floor(i / 2) * 0.6)
      t.add(st)
      const Pc = P[key]
      foldedStack(s, st, Array.from({ length: 4 }, () => cloth(Pc.kind, Pc.ways[w].hex)), 0.3, 0.26, 0, 0, 0, PI / 2, 200 + i)
      info(s, st, stackCard(Pc, w), 0.004)
    })
  }

  /* ---------- the windows: two dressed mannequins ---------- */
  const looks: { name: string; ways: { name: string; jacket: string; trousers: string; shirt: string }[]; price: number; note: string }[] = [
    { name: 'The Evening Suit', price: 54900, note: 'The two-piece suit in Super 120s wool over a white poplin shirt.', ways: [{ name: 'Navy', jacket: '#1d2538', trousers: '#1d2538', shirt: '#f3f1ec' }, { name: 'Charcoal', jacket: '#2f3033', trousers: '#2f3033', shirt: '#f3f1ec' }] },
    { name: 'The Weekend', price: 43900, note: 'The camel blazer over an oxford shirt, with charcoal flannel trousers.', ways: [{ name: 'Camel & charcoal', jacket: '#a9824f', trousers: '#2f3033', shirt: '#a9bfd8' }, { name: 'Navy & stone', jacket: '#1d2538', trousers: '#c2ad88', shirt: '#f3f1ec' }] },
  ]
  looks.forEach((L, i) => {
    const z = i === 0 ? -0.2 : 3.7
    const holder = live(g, `mannequin${i}`, 'noir')
    holder.position.set(-7.35, Y, z)
    holder.rotation.y = PI / 2 + (i === 0 ? -0.25 : 0.25)
    let cur = 0
    const dress = (p: Object3D, j: number) => {
      const w = L.ways[j]
      maleMannequin(s, wm, p, { top: 'jacket', topCloth: wm.cloth('wool', w.jacket), shirt: wm.cloth('cotton', w.shirt), trousers: wm.cloth('wool', w.trousers), shoes: f.calf('#1b1a1a', 21) })
    }
    const inner = new Group()
    holder.add(inner)
    dress(inner, 0)
    mergeStatic(inner)
    e.shade.pool(-7.35, Y + 0.012, z, 0.28, 0.28, 0.4)
    info(s, holder, {
      title: L.name, kind: 'Window · Atelier Noir', body: `${L.note} Pick a colour to dress the mannequin in it.`, specs: [`Sizes ${TAILORING_SIZES[0]}–${TAILORING_SIZES[TAILORING_SIZES.length - 1]}`, rupees(L.price)],
      inspect: () => {
        const p = new Group()
        dress(p, cur)
        return p
      },
      variants: {
        label: 'Colour', options: L.ways.map((w) => ({ name: w.name, swatch: w.jacket })), current: () => cur,
        pick: (j) => {
          cur = j
          for (const c of [...holder.children]) {
            holder.remove(c)
            c.traverse((o) => (o as Mesh).geometry?.dispose())
          }
          const n = new Group()
          holder.add(n)
          dress(n, j)
          mergeStatic(n)
        },
      },
      choices: { label: 'Size', options: TAILORING_SIZES },
      action: { label: 'Add to bag', run: addToBag(L.name, L.price) },
    }, 0.01)
  })

  /* ---------- the mirror and the cash desk ---------- */
  {
    const mr = at(g, -9.15, Y, ZL - 0.02, PI)
    k.box(mr, 0.66, 2.0, 0.03, M.blackSteel, 0, 1.05, 0.015)
    const gl = k.box(mr, 0.6, 1.94, 0.006, M.mirror, 0, 1.05, 0.032, false)
    info(s, gl, { title: 'Mirror', kind: 'Full-length mirror', body: 'A full-length mirror in a slim black steel frame: try the jacket on here.', specs: ['Silvered glass, steel', '60 × 194 cm'] }, 0.01)
    const bn = at(g, -9.15, Y, ZL - 0.62, PI)
    k.box(bn, 1.0, 0.08, 0.38, M.leather, 0, 0.42, 0)
    for (const sx of [-1, 1]) k.box(bn, 0.03, 0.4, 0.36, M.blackSteel, sx * 0.47, 0.2, 0)
    info(s, bn, { title: 'Leather Bench', kind: 'Seating', body: 'A cognac leather bench on black steel: sit to try a pair of trousers or wait for a friend.', specs: ['Saddle leather, steel'] }, 0)
  }
  {
    const dx = -8.55
    const dz = ZR + 0.875
    const d = at(g, dx, Y, dz, PI)
    k.box(d, 1.3, 0.9, 0.55, M.lacquer, 0, 0.45, 0)
    k.box(d, 1.36, 0.04, 0.6, M.oak, 0, 0.92, 0)
    e.shade.rect(dx, Y + 0.012, dz, 1.4, 0.65, 0, 0.4)
    const dr = new Group()
    dr.name = 'drawer_noir_desk'
    dr.userData.label = 'Drawer'
    dr.userData.slide = [0, 0, 0.3]
    dr.position.set(0.3, 0.75, 0.275)
    d.add(dr)
    const front = k.box(dr, 0.5, 0.14, 0.02, M.lacquer, 0, 0, 0.01)
    front.userData.front = true
    k.box(dr, 0.18, 0.012, 0.012, M.brass, 0, 0, 0.026)
    const inner = new Group()
    inner.name = 'contents'
    dr.add(inner)
    k.box(inner, 0.46, 0.01, 0.42, M.oak, 0, -0.05, -0.21, false)
    const till = at(d, -0.25, 0.94, -0.05, PI)
    k.cyl(till, 0.06, 0.07, 0.012, M.blackSteel, 0, 0.006, 0, 32)
    k.cyl(till, 0.011, 0.011, 0.18, M.blackSteel, 0, 0.1, 0, 12)
    const head = at(till, 0, 0.24, 0, 0)
    head.rotation.x = -0.3
    k.box(head, 0.27, 0.18, 0.012, M.lacquer, 0, 0, 0)
    const scr = wm.canvas(384, 256, (c, w, h) => {
      c.fillStyle = '#151515'
      c.fillRect(0, 0, w, h)
      c.fillStyle = '#d8c9a8'
      c.font = '700 22px "Inter", Arial, sans-serif'
      c.fillText('ATELIER NOIR', 16, 30)
      c.fillStyle = '#efe9dc'
      c.textAlign = 'center'
      c.font = '500 26px "Inter", Arial, sans-serif'
      c.fillText('Tap to check out', w / 2, h * 0.58)
      c.font = '400 15px "Inter", Arial, sans-serif'
      c.fillText('Cards · UPI · Wallets', w / 2, h * 0.8)
    })
    const sm = new MeshStandardMaterial({ map: scr, emissiveMap: scr, emissive: '#ffffff', emissiveIntensity: 0.6, roughness: 0.3 })
    sm.userData.interior = true
    const btn = button(head, 'till', 'Till', 'Check out', 0, 0, 0.007, () => useInfoStore.getState().show({ ...checkout(), place: `First Floor · ${s.u.name} (${s.u.id})` }), 'noir')
    mesh(btn, new PlaneGeometry(0.25, 0.165), sm, 0, 0, 0, false)
    info(s, d.children[0], { title: 'Cash Desk', kind: 'Atelier Noir', body: 'Black lacquer under an oak top: tap the till\'s screen to check out what is in your bag.', specs: ['Alterations pinned here', 'Gift boxing, free'] }, 0)
  }

  /* ---------- lighting and switches ---------- */
  lamp(s, -9.0, Y + 3.2, ZC, 7, 7, '#ffd9a8')
  lamp(s, -12.4, Y + 3.2, ZC, 7, 7, '#ffd9a8')
  lamp(s, -15.8, Y + 3.2, ZC, 6, 7, '#ffd9a8')
  // A few spots on the grid aimed at the tables.
  for (const x of [-9.0, -16.0]) {
    k.cyl(g, 0.04, 0.035, 0.12, M.blackSteel, x, Y + 4.12, ZC, 16)
    k.cyl(g, 0.03, 0.03, 0.004, spot, x, Y + 4.058, ZC, 16)
  }
  {
    const sw = new Group()
    sw.position.set(-7.05, Y + 1.2, ZR + 0.001)
    g.add(sw)
    const plate = switchPlate(k, sw, 'noir', ['switch', 'switch'], { plate: M.brass, rocker: M.brass, dark: M.black, locator: lux.ledCool as MeshStandardMaterial }, [s.circuit, display])
    plate.traverse((o) => {
      if (o.name === 'switch_noir_0') o.userData.label = 'Shop lights'
      if (o.name === 'switch_noir_1') o.userData.label = 'Filament bulbs & strings'
    })
    setCircuit(s.circuit, true)
    setCircuit(display, true)
  }
  return s
}
