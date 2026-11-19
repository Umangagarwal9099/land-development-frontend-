import { CatmullRomCurve3, CylinderGeometry, ExtrudeGeometry, Group, LatheGeometry, Mesh, MeshStandardMaterial, Path, PlaneGeometry, Shape, SphereGeometry, TorusGeometry, TubeGeometry, Vector2, Vector3, type Material, type Object3D } from 'three'
import { useInfoStore, type EquipmentInfo } from '../../../../../../../store/info'
import { circuit, setCircuit, switchPlate } from '../../../kalakalD65/fixtures'
import { mergeStatic } from '../../../optimize'
import { rng } from '../../../textures'
import { clipped, type FloorCtx } from '../shell'
import type { Unit } from '../units'
import { button, info, live } from './cafe'
import { foldedStack } from './goods'
import { at, box, brandSign, flat, lamp, letters, mesh, openShop, pane, PI, rect, swingLeaf } from './kit'
import { maleMannequin, menGarment, type MenStyle } from './menswear'
import { blouse, dress, hanger, mannequin, skirt, trousers, womenswearMaterials, type Cloth, type DressSpec, type WomenswearMaterials } from './womenswear'

/*
 * Little Bloom, unit 1-04: children's clothing on the first floor, the fourth shop on the west
 * spine, 11.2 m deep and 4.95 m wide. Built from the reference, looking in from the door:
 *
 *   room      soft pink plaster walls under a white ceiling with a deep crown moulding, white
 *             skirtings, a beaded white chandelier of candle lights, pale grey-washed oak boards
 *   back      an arched window of white mullions and a fan light (the mall's wall is solid, so it
 *             is a lit window box), a pink chest of drawers under it with a lamp and flowers;
 *             low white rails of little clothes either side, white shelving in the corners
 *   left      a long low white rail unit of pastel tops and dresses at a child's height, white open
 *             shelves of folded clothes above it, framed prints
 *   right     the same rail unit under two tall arched windows
 *   middle    a round button-tufted pink pouf on a cream rug, flowers, folded babywear and a bunny
 *   front     a child mannequin in each window, the cash desk inside on the right, a mirror at a
 *             child's height and a bench on the left
 *
 * Every garment can be picked from its rail: its card gives the age, fabric, sizes and price,
 * turns it in 3D, and those on the rail units show their other colours. The folded stacks and the
 * mannequins explain themselves; the chest's drawers open; the desk takes the bag through; two
 * switches by the door work the lights and the chandelier.
 */

const FX = -6.6
const BK = -17.8
const ZL = -6.075
const ZR = -11.025
const ZC = (ZL + ZR) / 2
const H = 3.4

/* ---------- the collection ---------- */

interface Way {
  name: string
  hex: string
}
type Make = (s: import('./kit').Shop, m: WomenswearMaterials, p: Object3D, mat: Material) => Object3D
interface Piece {
  name: string
  cat: string
  age: string
  cloth: Cloth
  fabric: string
  price: number
  sizes: string[]
  ways: Way[]
  note: string
  /** Scale of the adult cut: a child's size. */
  k: number
  clip?: boolean
  make: Make
}

const BABY = ['0–3 m', '3–6 m', '6–12 m', '12–18 m']
const TODDLER = ['1–2 y', '2–3 y', '3–4 y']
const KID = ['4–5 y', '5–6 y', '6–7 y', '7–8 y', '8–10 y']

const M = (style: MenStyle): Make => (s, m, p, mat) => menGarment(s, m, p, style, mat)
const Dr = (spec: DressSpec): Make => (_s, m, p, mat) => dress(m, p, spec, mat)

const P: Record<string, Piece> = {
  bodysuit: { name: 'Organic Cotton Bodysuit', cat: 'Babywear', age: '0–18 months', cloth: 'cotton', fabric: 'GOTS organic cotton jersey, envelope neck, poppers', price: 1290, sizes: BABY, k: 0.4, note: 'A short-sleeved bodysuit in soft organic cotton with an envelope neck for easy dressing and poppers underneath.', ways: [{ name: 'Blush', hex: '#f2d0d0' }, { name: 'Mint', hex: '#cfe8da' }, { name: 'Ivory', hex: '#f4efe4' }], make: M('tee') },
  smock: { name: 'Smocked Cotton Frock', cat: 'Toddler', age: '1–4 years', cloth: 'cotton', fabric: 'Cotton lawn, hand-smocked yoke', price: 2890, sizes: TODDLER, k: 0.5, note: 'A frock with a hand-smocked yoke, flutter sleeves and a full twirling skirt.', ways: [{ name: 'Rose', hex: '#efb9c0' }, { name: 'Lilac', hex: '#d8c8ea' }, { name: 'Sky', hex: '#c5daf0' }], make: Dr({ len: 1.0, neck: 'square', sleeves: 'flutter', skirt: 'flow', waist: 'seam', waistAt: 0.3 }) },
  party: { name: 'Tulle Party Dress', cat: 'Girls · Party wear', age: '4–10 years', cloth: 'chiffon', fabric: 'Satin bodice, layered tulle skirt, sash', price: 4490, sizes: KID, k: 0.62, note: 'For birthdays and weddings: a satin bodice, cap sleeves and a skirt of soft tulle layers, tied with a sash.', ways: [{ name: 'Blush', hex: '#f1c6cc' }, { name: 'Ivory', hex: '#f4ede0' }, { name: 'Lavender', hex: '#d9cbec' }], make: Dr({ len: 1.12, neck: 'scoop', sleeves: 'cap', skirt: 'flow', waist: 'tie', waistAt: 0.33 }) },
  floral: { name: 'Floral Frock', cat: 'Girls · Everyday', age: '4–10 years', cloth: 'print', fabric: 'Printed cotton poplin', price: 2490, sizes: KID, k: 0.6, note: 'A cotton frock in a little sprig print with puffed short sleeves and a gathered skirt.', ways: [{ name: 'Pink sprig', hex: '#f6dfe0' }, { name: 'Mint sprig', hex: '#dcefe4' }], make: Dr({ len: 1.05, neck: 'crew', sleeves: 'cap', skirt: 'aline', waist: 'seam', waistAt: 0.34 }) },
  blouse: { name: 'Bow Blouse', cat: 'Girls · Tops', age: '4–10 years', cloth: 'cotton', fabric: 'Cotton voile', price: 1890, sizes: KID, k: 0.58, note: 'A soft voile blouse with a bow at the neck and elbow sleeves.', ways: [{ name: 'Ivory', hex: '#f4efe4' }, { name: 'Peach', hex: '#f6d2bd' }], make: (_s, m, p, mat) => blouse(m, p, mat, { neck: 'crew', sleeves: 'elbow', bow: true }) },
  skirt: { name: 'Pleated Skirt', cat: 'Girls · Bottoms', age: '4–10 years', cloth: 'satin', fabric: 'Plissé satin, elastic waist', price: 1990, sizes: KID, k: 0.6, clip: true, note: 'A sunray-pleated skirt on a soft elastic waist.', ways: [{ name: 'Blush', hex: '#efc3c6' }, { name: 'Sage', hex: '#b9cdb3' }], make: (_s, m, p, mat) => skirt(m, p, mat, 'pleated', 0.6) },
  shirt: { name: 'Oxford Shirt', cat: 'Boys · Shirts', age: '4–10 years', cloth: 'cotton', fabric: 'Cotton oxford', price: 1990, sizes: KID, k: 0.58, note: 'A button-down oxford shirt cut for a boy, a chest pocket and buttoned cuffs.', ways: [{ name: 'White', hex: '#f4f2ec' }, { name: 'Blue', hex: '#bccde3' }, { name: 'Pink', hex: '#f0d3d3' }], make: M('shirt') },
  polo: { name: 'Piqué Polo', cat: 'Boys · T-shirts', age: '2–10 years', cloth: 'cotton', fabric: 'Cotton piqué', price: 1490, sizes: [...TODDLER, ...KID], k: 0.56, note: 'A cotton piqué polo with a two-button placket.', ways: [{ name: 'Mint', hex: '#cfe8da' }, { name: 'Sky', hex: '#c5daf0' }, { name: 'White', hex: '#f4f2ec' }], make: M('polo') },
  tee: { name: 'Cotton Tee', cat: 'Everyday', age: '2–10 years', cloth: 'cotton', fabric: 'Organic cotton jersey', price: 990, sizes: [...TODDLER, ...KID], k: 0.56, note: 'A soft everyday tee.', ways: [{ name: 'Peach', hex: '#f6d2bd' }, { name: 'Lavender', hex: '#ddd0ee' }, { name: 'Lemon', hex: '#f4ebba' }], make: M('tee') },
  knit: { name: 'Cotton-Cashmere Sweater', cat: 'Knitwear', age: '2–10 years', cloth: 'knit', fabric: 'Cotton-cashmere', price: 2990, sizes: [...TODDLER, ...KID], k: 0.55, note: 'A soft crew-neck sweater in cotton and cashmere.', ways: [{ name: 'Oat', hex: '#e2d6c2' }, { name: 'Rose', hex: '#eec5c6' }, { name: 'Mint', hex: '#cfe3d4' }], make: M('knit') },
  jacket: { name: 'Quilted Jacket', cat: 'Outerwear', age: '2–10 years', cloth: 'cotton', fabric: 'Cotton shell, light wadding', price: 3990, sizes: [...TODDLER, ...KID], k: 0.56, note: 'A lightly quilted cotton jacket for cool mornings.', ways: [{ name: 'Navy', hex: '#2b3550' }, { name: 'Blush', hex: '#e9bfc1' }], make: M('coat') },
  blazer: { name: 'Velvet Party Blazer', cat: 'Boys · Party wear', age: '4–10 years', cloth: 'velvet', fabric: 'Cotton velvet', price: 4290, sizes: KID, k: 0.58, note: 'A little velvet blazer for weddings and parties.', ways: [{ name: 'Navy', hex: '#222b45' }, { name: 'Bottle green', hex: '#1f4a36' }], make: M('jacket') },
  jeans: { name: 'Soft Denim Jeans', cat: 'Bottoms', age: '2–10 years', cloth: 'denim', fabric: 'Stretch cotton denim, adjustable waist', price: 1990, sizes: [...TODDLER, ...KID], k: 0.58, clip: true, note: 'Soft stretch jeans with an adjustable waist.', ways: [{ name: 'Mid blue', hex: '#5a74a0' }, { name: 'Light', hex: '#9fb2cf' }], make: (_s, m, p, mat) => trousers(m, p, mat, 'jeans') },
  pyjama: { name: 'Pyjama Shirt', cat: 'Nightwear', age: '2–10 years', cloth: 'print', fabric: 'Brushed cotton, printed', price: 1690, sizes: [...TODDLER, ...KID], k: 0.56, note: 'The top of a brushed-cotton pyjama set, with piped edges; the trousers come with it.', ways: [{ name: 'Blue sprig', hex: '#e2ecf6' }, { name: 'Pink sprig', hex: '#f6dfe0' }], make: M('shirt') },
  kurta: { name: 'Festive Kurta', cat: 'Ethnic wear', age: '2–10 years', cloth: 'satin', fabric: 'Silk blend, with churidar', price: 3490, sizes: [...TODDLER, ...KID], k: 0.58, note: 'A little silk-blend kurta with a band collar, sold with its churidar.', ways: [{ name: 'Ivory', hex: '#f1e8d4' }, { name: 'Peach', hex: '#f3c9b2' }, { name: 'Mint', hex: '#cde5d4' }], make: M('kurta') },
}

const rupees = (n: number) => `₹ ${n.toLocaleString('en-IN')}`
/** A rail's worth of garments, packed as a shop packs them: the list repeated in turn, each in its next colour. */
const dense = (items: [keyof typeof P, number][], n: number): [keyof typeof P, number][] => Array.from({ length: n }, (_, i) => [items[i % items.length][0], items[i % items.length][1] + Math.floor(i / items.length)])
const bag: { name: string; size: string; price: number }[] = []

function checkout(): Omit<EquipmentInfo, 'place'> {
  const total = bag.reduce((a, l) => a + l.price, 0)
  return {
    title: 'The Cash Desk',
    kind: 'Little Bloom · Checkout',
    body: bag.length ? 'Each piece is folded in tissue and boxed with a pink ribbon; gift notes are free.' : 'Your bag is empty. Tap any garment, choose a size and add it; then pay here.',
    specs: bag.length ? [...bag.map((l) => `${l.name} · ${l.size} · ${rupees(l.price)}`), `Total ${rupees(total)} (incl. GST)`] : ['Cards, UPI and wallets', 'Gift boxing, free', 'Exchanges within 30 days (sizes grow!)'],
    action: bag.length
      ? {
          label: `Pay ${rupees(total)}`,
          run: () => {
            bag.length = 0
            return 'Paid, thank you. Your little ones\' pieces are being wrapped; your receipt is on its way by SMS.'
          },
        }
      : undefined,
  }
}
const addToBag = (name: string, price: number) => (size: string | null) => {
  if (!size) return 'Choose a size first.'
  bag.push({ name, size, price })
  return `Added ${name}, ${size}. ${bag.length} ${bag.length === 1 ? 'piece' : 'pieces'} in your bag: pay at the desk by the door.`
}

/** A round-headed arch as a shape (or as a hole), w wide, springing at `spring`. */
function archShape(w: number, spring: number, y0 = 0) {
  const s = new Shape()
  s.moveTo(-w / 2, y0)
  s.lineTo(w / 2, y0)
  s.lineTo(w / 2, spring)
  s.absarc(0, spring, w / 2, 0, PI, false)
  s.lineTo(-w / 2, y0)
  return s
}
function archHole(w: number, spring: number, y0 = 0) {
  const p = new Path()
  p.moveTo(-w / 2, y0)
  p.lineTo(-w / 2, spring)
  p.absarc(0, spring, w / 2, PI, 0, true)
  p.lineTo(w / 2, y0)
  p.lineTo(-w / 2, y0)
  return p
}

export function buildKidsStore(e: FloorCtx, u: Unit) {
  const s = openShop(e, u)
  const { k, lux } = e
  const { g, y: Y } = s
  const wm = womenswearMaterials(e)
  const soffit = e.soffit
  const env = e.m.env
  const mark = <T extends Material>(x: T) => ((x.userData.interior = true), x)
  const std = (p: ConstructorParameters<typeof MeshStandardMaterial>[0], reflect = 0.5) => mark(new MeshStandardMaterial({ envMap: env, envMapIntensity: reflect, ...p }))
  const tex = (paint: (c: CanvasRenderingContext2D, w: number, h: number) => void, metres: number, w = 512, h = 512) => {
    const t = wm.canvas(w, h, paint)
    t.repeat.set(1 / metres, 1 / metres)
    return t
  }
  const C = {
    pink: std({ map: tex((c, w, h) => {
      const r = rng(9201)
      c.fillStyle = '#dfaeac'
      c.fillRect(0, 0, w, h)
      for (let i = 0; i < 220; i++) {
        const x = r() * w
        const y = r() * h
        const sz = w * (0.05 + r() * 0.1)
        const gr = c.createRadialGradient(x, y, 0, x, y, sz)
        gr.addColorStop(0, r() < 0.5 ? 'rgba(240,205,203,.3)' : 'rgba(195,140,140,.25)')
        gr.addColorStop(1, 'rgba(223,174,172,0)')
        c.fillStyle = gr
        c.fillRect(x - sz, y - sz, 2 * sz, 2 * sz)
      }
    }, 2.2), roughness: 0.9 }, 0.04),
    white: std({ color: '#f7f4ef', roughness: 0.4 }, 0.35),
    whiteMatte: std({ color: '#fbf9f6', roughness: 0.85 }, 0.08),
    pinkLacquer: std({ color: '#efc3c6', roughness: 0.3 }, 0.45),
    oak: std({ map: tex((c, w, h) => {
      const r = rng(9202)
      const rows = 6
      for (let j = 0; j < rows; j++) {
        let x = -r() * w * 0.4
        while (x < w) {
          const len = w * (0.4 + r() * 0.5)
          const t = 206 + Math.floor(r() * 18)
          c.fillStyle = `rgb(${t},${t - 6},${t - 14})`
          c.fillRect(x, (j * h) / rows, len, h / rows)
          for (let q = 0; q < 18; q++) {
            c.fillStyle = `rgba(${r() < 0.5 ? '130,115,100' : '255,250,240'},${0.08 + r() * 0.12})`
            c.fillRect(x, (j * h) / rows + r() * (h / rows), len, 0.8 + r())
          }
          c.fillStyle = 'rgba(110,100,90,.4)'
          c.fillRect(x, (j * h) / rows, 1.4, h / rows)
          x += len
        }
        c.fillStyle = 'rgba(110,100,90,.35)'
        c.fillRect(0, (j * h) / rows, w, 1.2)
      }
    }, 1.2), roughness: 0.5 }, 0.25),
    rug: std({ map: tex((c, w, h) => {
      const r = rng(9203)
      c.fillStyle = '#efe9de'
      c.fillRect(0, 0, w, h)
      // A raised lattice of tufted wool.
      c.strokeStyle = 'rgba(255,255,255,.7)'
      c.lineWidth = 6
      const n = 6
      for (let i = -n; i <= 2 * n; i++) {
        c.beginPath()
        c.moveTo((i * w) / n, 0)
        c.lineTo((i * w) / n + w, h)
        c.stroke()
        c.beginPath()
        c.moveTo((i * w) / n, h)
        c.lineTo((i * w) / n + w, 0)
        c.stroke()
      }
      for (let i = 0; i < 9000; i++) {
        c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.18)' : 'rgba(150,130,110,.12)'
        c.fillRect(r() * w, r() * h, 2, 2)
      }
    }, 0.9), roughness: 0.97 }, 0.02),
    velvet: wm.cloth('velvet', '#ecbcc2'),
    ceramic: std({ color: '#fbf8f3', roughness: 0.2 }, 0.6),
    crystal: std({ color: '#ffffff', metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.75 }, 1.6),
    mirror: std({ color: '#eef1f2', metalness: 1, roughness: 0.03 }, 1.6),
    glow: std({ color: '#fff4dd', emissive: '#ffe2b0', emissiveIntensity: 1.1, roughness: 0.3 }, 0),
  }
  const daylight = (() => {
    const t = wm.canvas(256, 512, (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 0, h)
      gr.addColorStop(0, '#ffffff')
      gr.addColorStop(0.55, '#eef4f6')
      gr.addColorStop(1, '#d9e8dc')
      c.fillStyle = gr
      c.fillRect(0, 0, w, h)
      // Soft garden shapes, out of focus beyond the frosted glass.
      c.filter = 'blur(10px)'
      const r = rng(9204)
      for (let i = 0; i < 14; i++) {
        c.fillStyle = r() < 0.6 ? 'rgba(140,175,130,.35)' : 'rgba(235,190,200,.35)'
        c.beginPath()
        c.ellipse(r() * w, h * (0.65 + r() * 0.35), 30 + r() * 50, 20 + r() * 40, 0, 0, 7)
        c.fill()
      }
    })
    return t
  })()

  const display = circuit()
  const glowOf = (mat: MeshStandardMaterial) => {
    const n = mat.clone()
    n.userData.interior = true
    display.glows.push(n)
    return n
  }
  const windowGlow = glowOf(std({ map: daylight, emissive: '#ffffff', emissiveMap: daylight, emissiveIntensity: 0.55, roughness: 0.6 }, 0.1))
  const bulb = glowOf(C.glow)

  /* ---------- garments ---------- */
  const build = (p: Object3D, Pc: Piece, i: number) => {
    const sc = new Group()
    sc.scale.setScalar(Pc.k)
    p.add(sc)
    hanger(wm, sc, Pc.clip ? 'clip' : 'wood', Pc.clip ? 0.16 : 0.2)
    const b = new Group()
    b.position.y = -0.072
    sc.add(b)
    Pc.make(s, wm, b, wm.cloth(Pc.cloth, Pc.ways[i].hex))
  }
  let gid = 0
  const garment = (par: Object3D, key: keyof typeof P, way: number, x: number, y: number, z: number, yaw: number, variants: boolean) => {
    const Pc = P[key]
    let cur = way % Pc.ways.length
    const holder = variants ? live(par, `garment${gid++}`, 'bloom') : new Group()
    if (!variants) par.add(holder)
    holder.position.set(x, y, z)
    holder.rotation.y = yaw
    const fill = () => {
      const inner = new Group()
      holder.add(inner)
      build(inner, Pc, cur)
      if (variants) mergeStatic(inner)
    }
    fill()
    info(s, holder, {
      title: Pc.name,
      kind: `${Pc.cat} · Little Bloom`,
      body: `${Pc.note} Drag it to turn it; scroll or pinch to look closer.${variants ? ' Pick a colour to see it on the rail.' : ''}`,
      specs: [`Age: ${Pc.age}`, `Fabric: ${Pc.fabric}`, `Colours: ${Pc.ways.map((w) => w.name).join(', ')}`, `Sizes ${Pc.sizes[0]} to ${Pc.sizes[Pc.sizes.length - 1]}`, rupees(Pc.price)],
      inspect: () => {
        const p = new Group()
        build(p, Pc, cur)
        return p
      },
      variants: variants
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
              fill()
            },
          }
        : undefined,
      choices: { label: 'Size', options: Pc.sizes },
      action: { label: 'Add to bag', run: addToBag(Pc.name, Pc.price) },
    }, 0.005)
    return holder
  }

  /* ---------- the room ---------- */
  flat(g, clipped(e, u.rects[0]), Y + 0.006, C.oak, false, [], 'bloom_floor')
  box(s, BK - 0.1, BK, Y, soffit, ZR - 0.075, ZL + 0.075, C.pink)
  box(s, BK, FX - 0.3, Y, soffit, ZL - 0.02, ZL, C.pink)
  box(s, BK, FX - 0.3, Y, soffit, ZR, ZR + 0.02, C.pink)
  flat(g, rect(BK, FX, ZR - 0.075, ZL + 0.075), Y + H, C.whiteMatte, true, [], 'bloom_ceiling')
  // White skirtings and a deep crown moulding round the room.
  const cornice: [number, number][] = [[0, 0], [0.02, 0], [0.02, -0.03], [0.05, -0.05], [0.09, -0.07], [0.12, -0.12], [0.13, -0.14], [0, -0.14]]
  const run = (x0: number, z0: number, x1: number, z1: number) => {
    const len = Math.hypot(x1 - x0, z1 - z0)
    const r2 = at(g, (x0 + x1) / 2, Y, (z0 + z1) / 2, Math.atan2(x1 - x0, z1 - z0) - PI / 2)
    const sh = new Shape()
    sh.moveTo(cornice[0][0], cornice[0][1])
    for (const q of cornice.slice(1)) sh.lineTo(q[0], q[1])
    sh.closePath()
    const geo = new ExtrudeGeometry(sh, { depth: len, bevelEnabled: false, curveSegments: 4 })
    geo.rotateY(-PI / 2)
    geo.translate(len / 2, H, 0)
    mesh(r2, geo, C.whiteMatte, 0, 0, 0, false)
    k.box(r2, len, 0.12, 0.018, C.white, 0, 0.06, 0.009, false)
    e.shade.foot(x0, z0, x1, z1, Y + 0.01, 0.2, 0.22)
  }
  run(BK, ZL, FX - 0.3, ZL)
  run(FX - 0.3, ZR, BK, ZR)
  run(BK, ZR, BK, ZL)

  /* ---------- the shopfront on x = −6.6, z −11.1 … −6, doors at z −9.65 … −7.45 ---------- */
  {
    box(s, FX - 0.075, FX + 0.075, Y + e.ceiling, soffit, -11.1, -6.0, e.m.wallPaint)
    box(s, FX - 0.3, FX + 0.05, Y + H, Y + e.ceiling, -11.1, -6.0, C.whiteMatte)
    const F0 = FX - 0.3
    const F1 = FX + 0.05
    k.box(g, F1 - F0, 0.55, 5.14, C.pinkLacquer, (F0 + F1) / 2, Y + 3.0 + 0.275, ZC)
    for (const [a, b] of [[-11.12, -10.78], [-6.32, -5.98]]) k.box(g, F1 - F0, 3.0, b - a, C.white, (F0 + F1) / 2, Y + 1.5, (a + b) / 2)
    brandSign(s, g, letters(s, 'LITTLE BLOOM', 'dior', '#ffffff', 512, 128), 2.1, 0.525, F1 + 0.004, Y + 3.28, ZC, PI / 2)
    const fr = C.white
    box(s, FX - 0.035, FX + 0.035, Y + 2.95, Y + 3.0, -10.78, -6.32, fr)
    for (const z of [-10.75, -9.68, -7.42, -6.35]) box(s, FX - 0.035, FX + 0.035, Y, Y + 2.95, z - 0.02, z + 0.02, fr)
    box(s, FX - 0.035, FX + 0.035, Y + 2.62, Y + 2.67, -9.68, -7.42, fr)
    pane(s, g, FX, -10.72, FX, -9.71, Y + 0.02, Y + 2.95)
    pane(s, g, FX, -7.39, FX, -6.38, Y + 0.02, Y + 2.95)
    pane(s, g, FX, -9.65, FX, -7.45, Y + 2.67, Y + 2.95)
    swingLeaf(s, at(g, FX, Y, -9.65, -PI / 2), 'bloom_r', 1.09, 2.6, fr, -PI / 2, true)
    swingLeaf(s, at(g, FX, Y, -7.45, PI / 2), 'bloom_l', 1.09, 2.6, fr, PI / 2, true)
    box(s, FX - 0.15, FX + 0.15, Y, Y + 0.008, -9.65, -7.45, C.white, false)
    e.shade.foot(FX + 0.06, -11.1, FX + 0.06, -6.0, Y + 0.01, 0.2, 0.25)
  }

  /* ---------- arched windows: white mullions over a lit, frosted light ---------- */
  const archWindow = (par: Object3D, w: number, sill: number, spring: number) => {
    const win = new Group()
    par.add(win)
    // The reveal and the light behind the glass.
    const ring = archShape(w + 0.14, spring, sill - 0.07)
    ring.holes.push(archHole(w, spring, sill + 0.002))
    mesh(win, new ExtrudeGeometry(ring, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2, curveSegments: 32 }), C.white, 0, 0, 0)
    mesh(win, new ExtrudeGeometry(archShape(w, spring, sill), { depth: 0.004, bevelEnabled: false, curveSegments: 32 }), windowGlow, 0, 0, -0.05, false)
    // Mullions and the transom, the fan's spokes and its hub.
    const t = 0.035
    for (const x of [-w / 6, w / 6]) k.box(win, t, spring - sill, 0.04, C.white, x, (sill + spring) / 2, -0.01)
    k.box(win, w, t, 0.04, C.white, 0, spring, -0.01)
    for (const yy of [sill + (spring - sill) / 3, sill + (2 * (spring - sill)) / 3]) k.box(win, w, 0.022, 0.03, C.white, 0, yy, -0.012)
    for (let i = 1; i < 6; i++) {
      const a = (i / 6) * PI
      const sp = mesh(win, new CylinderGeometry(0.013, 0.013, w / 2, 8), C.white, (Math.cos(a) * w) / 4, spring + (Math.sin(a) * w) / 4, -0.012, false)
      sp.rotation.z = a - PI / 2
    }
    const arcPts = Array.from({ length: 20 }, (_, i) => new Vector3(Math.cos((i / 19) * PI) * w * 0.28, spring + Math.sin((i / 19) * PI) * w * 0.28, -0.012))
    mesh(win, new TubeGeometry(new CatmullRomCurve3(arcPts), 30, 0.012, 6, false), C.white, 0, 0, 0, false)
    k.box(win, w + 0.2, 0.04, 0.1, C.white, 0, sill - 0.08, 0.03)
    return win
  }
  {
    // Set proud of the plaster so the glass and its mullions stand clear of the wall's lining.
    const bw = at(g, BK + 0.08, Y, ZC, PI / 2)
    archWindow(bw, 1.5, 0.98, 2.15)
    for (const x of [-14.8, -12.0]) archWindow(at(g, x, Y, ZR + 0.08, 0), 1.0, 1.45, 2.6)
  }

  /* ---------- framed prints ---------- */
  const prints = [
    ['#f7ecea', '#e6b9bf', '#a9c7a6'],
    ['#f4efe6', '#d8c8ea', '#e9b7ae'],
    ['#eef3f4', '#c5daf0', '#f0c5c8'],
  ]
  const framed = (par: Object3D, w: number, h: number, i: number) => {
    const f = new Group()
    par.add(f)
    for (const [bw, bh, x, y] of [[w, 0.02, 0, h / 2 - 0.01], [w, 0.02, 0, -h / 2 + 0.01], [0.02, h, -w / 2 + 0.01, 0], [0.02, h, w / 2 - 0.01, 0]] as const) k.box(f, bw, bh, 0.02, C.white, x, y, 0.01)
    const [bg, a, b] = prints[i % prints.length]
    const art = wm.canvas(256, 320, (c, cw, ch) => {
      c.fillStyle = bg
      c.fillRect(0, 0, cw, ch)
      // A little rabbit in watercolour washes: body, head, ears; a sprig beside it.
      c.filter = 'blur(1px)'
      c.fillStyle = a
      c.beginPath()
      c.ellipse(cw / 2, ch * 0.62, cw * 0.18, ch * 0.16, 0, 0, 7)
      c.fill()
      c.beginPath()
      c.ellipse(cw / 2 + cw * 0.06, ch * 0.4, cw * 0.11, ch * 0.09, 0, 0, 7)
      c.fill()
      for (const dx of [-0.02, 0.06]) {
        c.beginPath()
        c.ellipse(cw / 2 + cw * dx + cw * 0.06, ch * 0.24, cw * 0.03, ch * 0.09, dx, 0, 7)
        c.fill()
      }
      c.fillStyle = b
      for (let q = 0; q < 6; q++) {
        c.beginPath()
        c.ellipse(cw * 0.22, ch * (0.5 + q * 0.06), cw * 0.04, ch * 0.015, -0.5, 0, 7)
        c.fill()
      }
    })
    mesh(f, new PlaneGeometry(w - 0.08, h - 0.08), std({ map: art, roughness: 0.9 }, 0.02), 0, 0, 0.004, false)
    mesh(f, new PlaneGeometry(w - 0.04, h - 0.04), C.whiteMatte, 0, 0, 0.002, false)
    return f
  }

  /* ---------- rail units: white frames at a child's height, a shelf below ---------- */
  const railUnit = (par: Object3D, len: number, h: number, items: [keyof typeof P, number][], variants: boolean | ((i: number) => boolean), sideOn: boolean) => {
    const u0 = new Group()
    par.add(u0)
    for (const x of [-len / 2, len / 2]) k.box(u0, 0.03, h, 0.36, C.white, x, h / 2, 0.18)
    k.box(u0, len, 0.025, 0.36, C.white, 0, 0.17, 0.18)
    k.box(u0, len, 0.025, 0.06, C.white, 0, 0.04, 0.33)
    const bar = mesh(u0, new CylinderGeometry(0.011, 0.011, len, 12), C.white, 0, h - 0.06, 0.18)
    bar.rotation.z = PI / 2
    const pitch = len / items.length
    items.forEach(([key, way], i) => garment(u0, key, way, -len / 2 + pitch * (i + 0.5), h - 0.05, 0.18, sideOn ? -PI / 2 : 0, typeof variants === 'function' ? variants(i) : variants))
    return u0
  }
  // Left wall: the long low unit, open shelves above it, prints.
  {
    const w = at(g, -13.6, Y, ZL, PI)
    railUnit(w, 4.0, 1.32, dense([['tee', 0], ['tee', 1], ['polo', 0], ['bodysuit', 0], ['bodysuit', 1], ['smock', 0], ['smock', 1], ['blouse', 0], ['blouse', 1], ['knit', 1], ['floral', 0], ['tee', 2], ['polo', 2], ['knit', 2], ['bodysuit', 2], ['pyjama', 1]], 26), (i) => i % 4 === 0, true)
    e.shade.rect(-13.6, Y + 0.012, ZL - 0.2, 4.1, 0.45, 0, 0.3)
    for (const x of [-15.0, -12.2]) {
      const sh = at(g, x, Y + 1.6, ZL, PI)
      // A white open shelf unit: two cubbies over two, folded clothes in each.
      for (const [bw, bh, bx, by] of [[0.9, 0.025, 0, 0], [0.9, 0.025, 0, 0.42], [0.9, 0.025, 0, 0.84], [0.025, 0.86, -0.45, 0.42], [0.025, 0.86, 0.45, 0.42], [0.025, 0.86, 0, 0.42]] as const) k.box(sh, bw, bh, 0.3, C.white, bx, by, 0.15)
      ;[[-0.22, 0.013, ['#f2d0d0', '#f4efe4', '#efc3c6']], [0.22, 0.013, ['#cfe8da', '#c5daf0', '#f4efe4']], [-0.22, 0.433, ['#ddd0ee', '#f6d2bd', '#f4ebba']], [0.22, 0.433, ['#e2d6c2', '#eec5c6', '#cfe3d4']]].forEach(([fx, fy, cols], j) => {
        const st = new Group()
        st.position.set(fx as number, fy as number, 0.15)
        sh.add(st)
        foldedStack(s, st, (cols as string[]).map((c) => wm.cloth('cotton', c)), 0.22, 0.17, 0, 0, 0, 0, 300 + j + Math.round(x))
        info(s, st, { title: 'Folded Babywear', kind: 'Babywear · Little Bloom', body: 'Organic cotton bodysuits, leggings and sleepsuits, folded by colour; your size is brought to you.', specs: ['GOTS organic cotton', 'Sizes 0–3 m to 12–18 m', `${rupees(990)} to ${rupees(1690)}`], choices: { label: 'Size', options: BABY }, action: { label: 'Add to bag', run: addToBag('Babywear set', 1290) } }, 0.004)
      })
    }
    framed(at(g, -13.6, Y + 2.25, ZL - 0.02, PI), 0.42, 0.52, 0)
    framed(at(g, -16.3, Y + 1.9, ZL - 0.02, PI), 0.36, 0.46, 1)
  }
  // Right wall: the unit under the arched windows.
  {
    const w = at(g, -13.4, Y, ZR, 0)
    railUnit(w, 4.4, 1.32, dense([['party', 0], ['party', 1], ['party', 2], ['floral', 1], ['smock', 2], ['skirt', 0], ['skirt', 1], ['shirt', 0], ['shirt', 1], ['shirt', 2], ['blazer', 0], ['blazer', 1], ['kurta', 0], ['kurta', 1], ['kurta', 2], ['jacket', 1], ['knit', 0], ['polo', 1]], 28), (i) => i % 4 === 0, true)
    e.shade.rect(-13.4, Y + 0.012, ZR + 0.2, 4.5, 0.45, 0, 0.3)
    framed(at(g, -16.4, Y + 1.95, ZR + 0.02, 0), 0.36, 0.46, 2)
    framed(at(g, -10.4, Y + 1.95, ZR + 0.02, 0), 0.36, 0.46, 0)
  }

  /* ---------- the back wall: the chest of drawers, rails either side, corner shelving ---------- */
  {
    const c = at(g, BK + 0.26, Y, ZC, PI / 2)
    const W = 1.4
    const Dd = 0.48
    k.box(c, W, 0.06, Dd - 0.04, C.white, 0, 0.03, 0)
    k.box(c, W, 0.78, Dd, C.pinkLacquer, 0, 0.45, 0)
    k.box(c, W + 0.03, 0.03, Dd + 0.03, C.white, 0, 0.855, 0)
    let did = 0
    for (let col = 0; col < 2; col++)
      for (let row = 0; row < 4; row++) {
        const dr = new Group()
        dr.name = `drawer_bloom_chest_${did++}`
        dr.userData.label = 'Drawer'
        dr.userData.slide = [0, 0, 0.3]
        dr.position.set(-W / 4 + (col * W) / 2, 0.15 + row * 0.18 + 0.08, Dd / 2)
        c.add(dr)
        const fr = k.soft(dr, W / 2 - 0.03, 0.16, 0.02, 0.004, C.pinkLacquer, 0, 0, 0.01)
        fr.userData.front = true
        k.cyl(dr, 0.012, 0.012, 0.02, C.ceramic, -0.12, 0, 0.03, 12).rotation.x = PI / 2
        k.cyl(dr, 0.012, 0.012, 0.02, C.ceramic, 0.12, 0, 0.03, 12).rotation.x = PI / 2
        const inside = new Group()
        inside.name = 'contents'
        dr.add(inside)
        k.box(inside, W / 2 - 0.08, 0.008, 0.36, C.white, 0, -0.07, -0.19, false)
        foldedStack(s, inside, [wm.cloth('cotton', ['#f2d0d0', '#cfe8da', '#f4efe4', '#ddd0ee'][(col + row) % 4]), wm.cloth('cotton', '#f4efe4')], 0.2, 0.15, 0, -0.066, -0.18, 0, 400 + did)
      }
    e.shade.rect(BK + 0.26, Y + 0.012, ZC, Dd + 0.1, W + 0.1, 0, 0.4)
    info(s, c.children[1], { title: 'Chest of Drawers', kind: 'Little Bloom', body: 'A pink lacquered chest of eight drawers, each holding more of the babywear; tap a drawer to open it.', specs: ['Lacquered birch, ceramic knobs'] }, 0)
    // On it: a lamp with a pink pleated shade, flowers, two pink boxes.
    const lampG = at(c, -0.45, 0.87, 0, 0)
    mesh(lampG, new LatheGeometry([[0, 0], [0.07, 0], [0.075, 0.03], [0.05, 0.12], [0.065, 0.2], [0.02, 0.26], [0.012, 0.32], [0, 0.32]].map(([r, h]) => new Vector2(r, h)), 32), C.ceramic)
    mesh(lampG, new CylinderGeometry(0.1, 0.15, 0.2, 32, 1, true), glowOf(std({ color: '#f6d0d3', emissive: '#ffd9dc', emissiveIntensity: 0.5, roughness: 0.9, side: 2 })), 0, 0.42, 0, false)
    const vase = at(c, 0.05, 0.87, 0.02, 0)
    mesh(vase, new LatheGeometry([[0, 0], [0.045, 0], [0.06, 0.08], [0.03, 0.17], [0.035, 0.19]].map(([r, h]) => new Vector2(r, h)), 24), C.ceramic)
    const fr = rng(9210)
    for (let i = 0; i < 14; i++) {
      const a = fr() * PI * 2
      const d = fr() * 0.08
      mesh(vase, new CylinderGeometry(0.002, 0.002, 0.18, 4), wm.cloth('cotton', '#5e8a5a'), Math.cos(a) * d * 0.5, 0.25, Math.sin(a) * d * 0.5, false)
      mesh(vase, new SphereGeometry(0.022 + fr() * 0.01, 10, 8), wm.cloth('velvet', ['#c9a7de', '#efb9c0', '#f4efe4'][i % 3]), Math.cos(a) * d, 0.33 + fr() * 0.06, Math.sin(a) * d, false)
    }
    for (const [x, sz] of [[0.42, 0.16], [0.5, 0.12]] as const) k.soft(c, sz, sz * 0.8, sz, 0.01, C.pinkLacquer, x, 0.87 + (sz * 0.8) / 2 + (x > 0.45 ? 0.128 : 0), 0)
    // Rails either side of it, and white shelving in the corners.
    for (const [z, items] of [[ZC + 1.35, [['bodysuit', 2], ['smock', 1], ['tee', 1], ['pyjama', 0], ['pyjama', 1]]], [ZC - 1.35, [['knit', 0], ['jacket', 0], ['jeans', 0], ['jeans', 1], ['polo', 1]]]] as const) {
      const r = at(g, BK + 0.04, Y, z, PI / 2)
      railUnit(r, 1.0, 1.32, items as unknown as [keyof typeof P, number][], false, false)
      e.shade.rect(BK + 0.22, Y + 0.012, z, 0.4, 1.05, 0, 0.3)
    }
    for (const z of [ZC + 2.15, ZC - 2.15]) {
      const sh = at(g, BK + 0.2, Y, z, PI / 2)
      for (const [bw, bh, bx, by] of [[0.025, 1.7, -0.22, 0.85], [0.025, 1.7, 0.22, 0.85]] as const) k.box(sh, bw, bh, 0.34, C.white, bx, by, 0)
      ;[0.05, 0.45, 0.85, 1.25, 1.68].forEach((yy, j) => {
        k.box(sh, 0.44, 0.022, 0.34, C.white, 0, yy, 0)
        if (j < 4) {
          const st = new Group()
          st.position.set(0, yy + 0.011, 0.02)
          sh.add(st)
          foldedStack(s, st, [0, 1, 2].map((q) => wm.cloth(j % 2 ? 'knit' : 'cotton', ['#efc3c6', '#cfe8da', '#f4efe4', '#c5daf0', '#ddd0ee'][(j + q) % 5])), 0.26, 0.2, 0, 0, 0, 0, 500 + j)
          info(s, st, { title: j % 2 ? 'Folded Knitwear' : 'Folded Tees & Leggings', kind: 'Everyday · Little Bloom', body: 'Folded by colour; ask for your child\'s size and it is brought to you.', specs: ['Sizes 1–2 y to 8–10 y', `${rupees(890)} to ${rupees(2990)}`], choices: { label: 'Size', options: [...TODDLER, ...KID] }, action: { label: 'Add to bag', run: addToBag(j % 2 ? 'Knit sweater' : 'Tee & leggings', j % 2 ? 2990 : 1290) } }, 0.004)
        }
      })
    }
    framed(at(g, BK + 0.02, Y + 1.95, ZC - 1.35, PI / 2), 0.32, 0.4, 1)
  }

  /* ---------- the middle: the cream rug, the round tufted pouf ---------- */
  {
    const rx = -12.6
    const rugG = at(g, rx, Y, ZC, 0)
    k.box(rugG, 3.0, 0.014, 2.3, C.rug, 0, 0.007, 0, false)
    e.shade.rect(rx, Y + 0.02, ZC, 3.0, 2.3, 0, 0.1)
    const p = at(g, rx, Y, ZC, 0)
    mesh(p, new CylinderGeometry(0.62, 0.6, 0.36, 64), C.velvet, 0, 0.19, 0)
    const top = mesh(p, new SphereGeometry(1, 64, 16, 0, PI * 2, 0, PI / 2), C.velvet, 0, 0.36, 0)
    top.scale.set(0.62, 0.07, 0.62)
    mesh(p, new TorusGeometry(0.6, 0.03, 10, 64), C.velvet, 0, 0.36, 0).rotation.x = PI / 2
    mesh(p, new TorusGeometry(0.6, 0.025, 10, 64), C.velvet, 0, 0.025, 0).rotation.x = PI / 2
    for (let ring = 1; ring <= 2; ring++)
      for (let i = 0; i < ring * 6; i++) {
        const a = (i / (ring * 6)) * PI * 2
        mesh(p, new SphereGeometry(0.012, 8, 6), C.velvet, Math.cos(a) * ring * 0.2, 0.425 - ring * 0.006, Math.sin(a) * ring * 0.2, false)
      }
    e.shade.pool(rx, Y + 0.022, ZC, 0.7, 0.7, 0.45)
    info(s, p.children[0], { title: 'Tufted Pouf', kind: 'Seating', body: 'A round button-tufted pouf in blush velvet: a seat for a parent, or a stage for a little one trying on a dress.', specs: ['Cotton velvet', 'Ø 124 cm'] }, 0)
    // On it: flowers in a white jug, folded babywear, a soft bunny.
    const jug = at(p, -0.15, 0.43, -0.12, 0)
    mesh(jug, new LatheGeometry([[0, 0], [0.05, 0], [0.065, 0.06], [0.05, 0.13], [0.055, 0.15]].map(([r, h]) => new Vector2(r, h)), 24), C.ceramic)
    for (let i = 0; i < 9; i++) {
      const a = i * 2.3
      const d = (i % 3) * 0.035
      mesh(jug, new SphereGeometry(0.03, 10, 8), wm.cloth('velvet', i % 2 ? '#efb9c0' : '#f7e3e6'), Math.cos(a) * d, 0.2 + (i % 3) * 0.015, Math.sin(a) * d, false)
    }
    const st = new Group()
    st.position.set(0.18, 0.43, 0.05)
    st.rotation.y = 0.3
    p.add(st)
    foldedStack(s, st, [wm.cloth('cotton', '#f2d0d0'), wm.cloth('cotton', '#f4efe4')], 0.22, 0.16, 0, 0, 0, 0, 600)
    info(s, st, { title: 'Muslin Swaddle Set', kind: 'Babywear · Little Bloom', body: 'Two soft cotton muslin swaddles, blush and ivory, folded with a ribbon: a favourite gift.', specs: ['Cotton muslin', '120 × 120 cm', rupees(1890)], choices: { label: 'Quantity', options: ['1', '2'] }, action: { label: 'Add to bag', run: addToBag('Muslin swaddle set', 1890) } }, 0.004)
    const bun = at(p, 0.0, 0.43, 0.25, 0.4)
    const plush = wm.cloth('knit', '#f4efe6')
    mesh(bun, new SphereGeometry(0.07, 20, 14), plush, 0, 0.065, 0).scale.set(1, 0.95, 0.85)
    mesh(bun, new SphereGeometry(0.05, 20, 14), plush, 0, 0.16, 0.02)
    for (const sx of [-1, 1]) {
      const ear = mesh(bun, new SphereGeometry(1, 12, 10), plush, sx * 0.022, 0.235, 0.0)
      ear.scale.set(0.016, 0.06, 0.01)
      ear.rotation.z = sx * 0.2
    }
  }

  /* ---------- the chandelier ---------- */
  {
    const cx = -12.6
    const ch = at(g, cx, Y + H, ZC, 0)
    mesh(ch, new CylinderGeometry(0.08, 0.08, 0.02, 32), C.white, 0, -0.01, 0)
    mesh(ch, new CylinderGeometry(0.006, 0.006, 0.45, 8), C.white, 0, -0.245, 0)
    mesh(ch, new LatheGeometry([[0, 0], [0.05, -0.02], [0.03, -0.12], [0.06, -0.2], [0.02, -0.3], [0.04, -0.36], [0, -0.42]].map(([r, h]) => new Vector2(r, h)), 24), C.white, 0, -0.45, 0)
    const n = 6
    const R = 0.36
    for (let i = 0; i < n; i++) {
      const a = (i / n) * PI * 2
      // An S-curved arm out to its candle cup, the candle sleeve, the bulb.
      const pts = [new Vector3(0, -0.72, 0), new Vector3(Math.cos(a) * R * 0.4, -0.82, Math.sin(a) * R * 0.4), new Vector3(Math.cos(a) * R * 0.85, -0.78, Math.sin(a) * R * 0.85), new Vector3(Math.cos(a) * R, -0.68, Math.sin(a) * R)]
      mesh(ch, new TubeGeometry(new CatmullRomCurve3(pts), 20, 0.009, 6, false), C.white, 0, 0, 0, false)
      const x = Math.cos(a) * R
      const z = Math.sin(a) * R
      mesh(ch, new CylinderGeometry(0.035, 0.02, 0.025, 16), C.white, x, -0.665, z, false)
      mesh(ch, new CylinderGeometry(0.013, 0.013, 0.1, 12), C.whiteMatte, x, -0.6, z, false)
      const b = mesh(ch, new SphereGeometry(0.014, 10, 8), bulb, x, -0.535, z, false)
      b.scale.y = 1.6
      // Swags of crystal beads between the arms, and drops below.
      const a2 = ((i + 0.5) / n) * PI * 2
      for (let j = 0; j <= 10; j++) {
        const t = j / 10
        const aa = a + (a2 - a) * 2 * t
        const rr = R * 0.92
        mesh(ch, new SphereGeometry(0.009, 8, 6), C.crystal, Math.cos(aa) * rr, -0.7 - Math.sin(t * PI) * 0.09, Math.sin(aa) * rr, false)
      }
      for (let j = 0; j < 6; j++) mesh(ch, new SphereGeometry(0.008, 8, 6), C.crystal, x * 0.55, -0.82 - j * 0.022, z * 0.55, false)
    }
    for (let j = 0; j < 10; j++) mesh(ch, new SphereGeometry(0.01, 8, 6), C.crystal, 0, -0.9 - j * 0.024, 0, false)
    info(s, ch.children[2], { title: 'The Chandelier', kind: 'Little Bloom', body: 'A white candle chandelier of six arms hung with swags of crystal beads.', specs: ['Painted metal, crystal'] }, 0.05)
    lamp(s, cx, Y + H - 0.75, ZC, 3.5, 5.5, '#ffe9d2')
  }

  /* ---------- the windows: a dressed boy and girl ---------- */
  const looks: { name: string; age: string; price: number; note: string; ways: { name: string; a: string; b: string }[]; girl: boolean }[] = [
    { name: 'The Party Dress', age: '6–7 years', price: 4490, girl: true, note: 'The tulle party dress, tied with its sash.', ways: [{ name: 'Blush', a: '#f1c6cc', b: '#f1c6cc' }, { name: 'Lavender', a: '#d9cbec', b: '#d9cbec' }] },
    { name: 'The Little Gentleman', age: '6–7 years', price: 6280, girl: false, note: 'The velvet party blazer over an oxford shirt, with soft chinos.', ways: [{ name: 'Navy & stone', a: '#222b45', b: '#cdbb9a' }, { name: 'Green & cream', a: '#1f4a36', b: '#ece3d1' }] },
  ]
  looks.forEach((L, i) => {
    const z = i === 0 ? -6.7 : -10.4
    const holder = live(g, `child${i}`, 'bloom')
    holder.position.set(-7.3, Y, z)
    holder.rotation.y = PI / 2 + (i === 0 ? 0.25 : -0.25)
    let cur = 0
    const dressIt = (p: Object3D, j: number) => {
      const w = L.ways[j]
      const sc = new Group()
      // A child of about 1.2 m: the adult form scaled, the head a little larger as a child's is.
      sc.scale.setScalar(0.66)
      p.add(sc)
      if (L.girl) {
        const { g: body, shoulders } = mannequin(wm, sc)
        const d = new Group()
        d.position.y = shoulders
        body.add(d)
        dress(wm, d, { len: 1.05, neck: 'scoop', sleeves: 'cap', skirt: 'flow', waist: 'tie', waistAt: 0.33 }, wm.cloth('chiffon', w.a), undefined, true)
      } else maleMannequin(s, wm, sc, { top: 'jacket', topCloth: wm.cloth('velvet', w.a), shirt: wm.cloth('cotton', '#f4f2ec'), trousers: wm.cloth('cotton', w.b), shoes: wm.cloth('satin', '#2a2420') })
      let head: Object3D | null = null
      let hy = -1
      sc.traverse((o) => {
        const m2 = o as Mesh
        if (m2.isMesh && m2.geometry.type === 'SphereGeometry' && m2.position.y > hy) {
          hy = m2.position.y
          head = m2
        }
      })
      if (head) (head as Mesh).scale.multiplyScalar(1.25)
    }
    const inner = new Group()
    holder.add(inner)
    dressIt(inner, 0)
    mergeStatic(inner)
    e.shade.pool(-7.3, Y + 0.012, z, 0.2, 0.2, 0.4)
    info(s, holder, {
      title: L.name, kind: 'Window · Little Bloom', body: `${L.note} Shown in ${L.age}; pick a colour to dress the mannequin in it.`, specs: [`Sizes ${KID[0]} to ${KID[KID.length - 1]}`, rupees(L.price)],
      inspect: () => {
        const p = new Group()
        dressIt(p, cur)
        return p
      },
      variants: {
        label: 'Colour', options: L.ways.map((w) => ({ name: w.name, swatch: w.a })), current: () => cur,
        pick: (j) => {
          cur = j
          for (const c of [...holder.children]) {
            holder.remove(c)
            c.traverse((o) => (o as Mesh).geometry?.dispose())
          }
          const n2 = new Group()
          holder.add(n2)
          dressIt(n2, j)
          mergeStatic(n2)
        },
      },
      choices: { label: 'Size', options: KID },
      action: { label: 'Add to bag', run: addToBag(L.name, L.price) },
    }, 0.01)
  })

  /* ---------- the mirror and bench on the left, the cash desk on the right ---------- */
  {
    const mr = at(g, -9.2, Y, ZL - 0.02, PI)
    const fr = archShape(0.62, 1.15, 0.15)
    fr.holes.push(archHole(0.54, 1.15, 0.19))
    mesh(mr, new ExtrudeGeometry(fr, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 2, curveSegments: 32 }), C.white, 0, 0, 0)
    const gl = mesh(mr, new ExtrudeGeometry(archShape(0.54, 1.15, 0.19), { depth: 0.006, bevelEnabled: false, curveSegments: 32 }), C.mirror, 0, 0, 0.012, false)
    info(s, gl, { title: 'Mirror', kind: 'At a child\'s height', body: 'An arched mirror hung low, so little ones can see themselves in a new outfit, head to toe.', specs: ['Silvered glass, white frame'] }, 0.01)
    const bn = at(g, -10.2, Y, ZL - 0.3, PI)
    k.soft(bn, 0.9, 0.12, 0.38, 0.04, C.velvet, 0, 0.4, 0)
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.cyl(bn, 0.018, 0.014, 0.34, C.white, sx * 0.38, 0.17, sz * 0.14, 10)
    info(s, bn, { title: 'Bench', kind: 'Seating', body: 'A blush velvet bench on white legs: sit to help with buttons and buckles.', specs: ['Cotton velvet, painted beech'] }, 0)
  }
  {
    const dx = -8.55
    const dz = ZR + 0.875
    const d = at(g, dx, Y, dz, PI)
    k.box(d, 1.3, 0.9, 0.55, C.white, 0, 0.45, 0)
    k.box(d, 1.36, 0.035, 0.6, C.pinkLacquer, 0, 0.917, 0)
    e.shade.rect(dx, Y + 0.012, dz, 1.4, 0.65, 0, 0.4)
    const dr = new Group()
    dr.name = 'drawer_bloom_desk'
    dr.userData.label = 'Drawer'
    dr.userData.slide = [0, 0, 0.3]
    dr.position.set(0.3, 0.75, 0.275)
    d.add(dr)
    const front = k.box(dr, 0.5, 0.14, 0.02, C.white, 0, 0, 0.01)
    front.userData.front = true
    k.cyl(dr, 0.012, 0.012, 0.02, C.ceramic, 0, 0, 0.03, 12).rotation.x = PI / 2
    const inner = new Group()
    inner.name = 'contents'
    dr.add(inner)
    k.box(inner, 0.46, 0.01, 0.42, C.white, 0, -0.05, -0.21, false)
    const till = at(d, -0.25, 0.935, -0.05, PI)
    k.cyl(till, 0.06, 0.07, 0.012, C.white, 0, 0.006, 0, 32)
    k.cyl(till, 0.011, 0.011, 0.18, C.white, 0, 0.1, 0, 12)
    const head = at(till, 0, 0.24, 0, 0)
    head.rotation.x = -0.3
    k.box(head, 0.27, 0.18, 0.012, C.white, 0, 0, 0)
    const scr = wm.canvas(384, 256, (c, w, h) => {
      c.fillStyle = '#fff8f6'
      c.fillRect(0, 0, w, h)
      c.fillStyle = '#efc3c6'
      c.fillRect(0, 0, w, 42)
      c.fillStyle = '#ffffff'
      c.font = '500 22px "Cormorant Garamond", Georgia, serif'
      c.fillText('LITTLE BLOOM', 16, 29)
      c.fillStyle = '#4a3a3a'
      c.textAlign = 'center'
      c.font = '500 26px "Inter", Arial, sans-serif'
      c.fillText('Tap to check out', w / 2, h * 0.58)
      c.font = '400 15px "Inter", Arial, sans-serif'
      c.fillText('Cards · UPI · Wallets', w / 2, h * 0.8)
    })
    const sm = new MeshStandardMaterial({ map: scr, emissiveMap: scr, emissive: '#ffffff', emissiveIntensity: 0.55, roughness: 0.3 })
    sm.userData.interior = true
    const btn = button(head, 'till', 'Till', 'Check out', 0, 0, 0.007, () => useInfoStore.getState().show({ ...checkout(), place: `First Floor · ${s.u.name} (${s.u.id})` }), 'bloom')
    mesh(btn, new PlaneGeometry(0.25, 0.165), sm, 0, 0, 0, false)
    info(s, d.children[0], { title: 'Cash Desk', kind: 'Little Bloom', body: 'White with a blush top: tap the till\'s screen to check out what is in your bag.', specs: ['Gift boxing, free'] }, 0)
  }

  /* ---------- lighting and switches ---------- */
  // Bright and airy, as the reference: a lamp to each bay of the room, warm-white.
  lamp(s, -8.8, Y + 3.1, ZC, 6, 7, '#ffeedd')
  lamp(s, -10.9, Y + 3.1, ZC, 4.5, 6.5, '#ffeedd')
  lamp(s, -14.3, Y + 3.1, ZC, 4.5, 6.5, '#ffeedd')
  lamp(s, -16.4, Y + 3.0, ZC, 5, 6.5, '#ffeedd')
  lamp(s, BK + 0.6, Y + 1.8, ZC, 2.2, 3.2, '#f4f8ff')
  for (const [x, z] of [[-9.6, ZC - 1.4], [-9.6, ZC + 1.4], [-15.4, ZC - 1.4], [-15.4, ZC + 1.4]] as const) {
    k.cyl(g, 0.045, 0.045, 0.008, C.white, x, Y + H - 0.004, z, 20)
    k.cyl(g, 0.03, 0.03, 0.004, bulb, x, Y + H - 0.009, z, 20)
  }
  {
    const sw = new Group()
    sw.position.set(-7.05, Y + 1.2, ZL - 0.001)
    sw.rotation.y = PI
    g.add(sw)
    const plate = switchPlate(k, sw, 'bloom', ['switch', 'switch'], { plate: C.white, rocker: C.white, dark: C.pinkLacquer, locator: lux.ledCool as MeshStandardMaterial }, [s.circuit, display])
    plate.traverse((o) => {
      if (o.name === 'switch_bloom_0') o.userData.label = 'Shop lights'
      if (o.name === 'switch_bloom_1') o.userData.label = 'Chandelier, windows & lamp'
    })
    setCircuit(s.circuit, true)
    setCircuit(display, true)
  }
  return s
}
