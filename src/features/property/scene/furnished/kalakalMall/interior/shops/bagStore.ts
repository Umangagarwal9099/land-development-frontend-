import { CatmullRomCurve3, CylinderGeometry, ExtrudeGeometry, Group, Mesh, MeshStandardMaterial, Path, PlaneGeometry, Shape, SphereGeometry, TubeGeometry, Vector3, type Object3D } from 'three'
import { useInfoStore, type EquipmentInfo } from '../../../../../../../store/info'
import { circuit, setCircuit, switchPlate } from '../../../kalakalD65/fixtures'
import { mergeStatic } from '../../../optimize'
import { ficus } from '../plants'
import { clipped, type FloorCtx } from '../shell'
import type { Unit } from '../units'
import { button, info, live } from './cafe'
import { bag, bagMaterials, type BagMaterials, type BagStyle, type Leather } from './handbags'
import { at, box, brandSign, flat, lamp, letters, mesh, onCircuit, openShop, pane, PI, rect, swingLeaf } from './kit'

/*
 * Gucci, unit 1-07: handbags on the first floor, off the rear gallery with a glass side to the east
 * spine; 4.2 m wide and 6.6 m deep. Built from the reference, looking in from the door:
 *
 *   walls     emerald green built out from the walls, cut by tall round-headed niches down both
 *             sides, each lined in bronze and lit within: a cabinet of rose-print doors in brass
 *             at its foot, wooden shelves above, a bag or two to each; over them a second tier of
 *             blind arches traced in brass
 *   back      a tall green archway to the back, the campaign on a screen within it and the name
 *             above in brass; a glazed vitrine of evening bags in the arch to its left, an olive
 *             tree in the arch to its right
 *   ceiling   white, its middle a mirrored coffer ringed with light, spots round it
 *   floor     big warm stone tiles; a green rug
 *   seating   a semicircular channel-tufted sofa, half green velvet and half mustard, round a
 *             smoked-glass table on a rose-print drum; a mustard pouf; a coral curved bench; an
 *             olive tree in a fluted green planter by the door
 *
 * Every bag can be picked: its card gives the line, leather, colour, size and price, turns it in 3D,
 * shows it in its other colours (on the shelf too), and its flap lifts when tapped. The cabinets
 * and the vitrine open; the till in the first niche takes the bag through; two switches by the door
 * work the lights and the niche lighting.
 */

const XL = 3.675
const XR = 7.8
const ZB = -15.925
const ZF = -9.3
const DEPTH = 0.45
const IN0 = XL + DEPTH
const IN1 = XR - DEPTH
const XC = (IN0 + IN1) / 2
const H = 4.3

/* ---------- the collection ---------- */

interface Way {
  name: string
  hex: string
}
interface Model {
  name: string
  line: string
  style: BagStyle
  leather: Leather
  material: string
  size: string
  price: number
  note: string
  ways: Way[]
  trim?: [Leather, string]
  metal?: 'gold' | 'palladium'
}

const BAGS: Record<string, Model> = {
  bamboo: { name: 'Bamboo Top-Handle', line: 'Bamboo', style: 'bamboo', leather: 'calf', material: 'Calfskin; cane handle; gold-toned hardware', size: '26 × 19 × 11 cm', price: 285000, note: 'A structured top-handle bag: its flap closes with a turn-lock, and its handle is real cane, heated and bent by hand.', ways: [{ name: 'Black', hex: '#141414' }, { name: 'Cognac', hex: '#8a4a22' }, { name: 'Ivory', hex: '#ece3d1' }] },
  horsebit: { name: 'Horsebit Shoulder Bag', line: 'Horsebit', style: 'horsebit', leather: 'calf', material: 'Calfskin; gold-toned horsebit', size: '27 × 17 × 7 cm', price: 255000, note: 'An oblong shoulder bag with the equestrian horsebit across its flap, on an adjustable leather strap.', ways: [{ name: 'Rosso', hex: '#9e1b24' }, { name: 'Black', hex: '#141414' }, { name: 'Emerald', hex: '#1f5a3e' }] },
  tote: { name: 'Web Stripe Tote', line: 'Ophelia', style: 'tote', leather: 'canvas', material: 'Diamond canvas, leather trim, web stripe', size: '38 × 31 × 15 cm', price: 165000, note: 'A roomy tote in the house\'s diamond canvas, the green-red web stripe down its front, leather handles.', trim: ['calf', '#5a3a24'], ways: [{ name: 'Beige ebony', hex: '#c9b48e' }, { name: 'Oatmeal', hex: '#d9cdb5' }] },
  camera: { name: 'Camera Crossbody', line: 'Horsebit', style: 'camera', leather: 'pebbled', material: 'Grained calfskin, web strap', size: '22 × 15 × 7 cm', price: 145000, note: 'A small camera bag zipped round the top, a tassel on the pull, worn across the body on a web strap.', ways: [{ name: 'Cuir', hex: '#a46a3a' }, { name: 'Black', hex: '#161616' }, { name: 'Rose', hex: '#d9a0a0' }] },
  hobo: { name: 'Crescent Hobo', line: 'Jackie', style: 'hobo', leather: 'calf', material: 'Calfskin; piston clasp', size: '32 × 20 × 6 cm', price: 235000, note: 'A soft crescent hobo with a piston clasp, carried on the shoulder by its rolled handle.', ways: [{ name: 'Black', hex: '#141414' }, { name: 'White', hex: '#efe9df' }, { name: 'Cognac', hex: '#8a4a22' }] },
  clutch: { name: 'Envelope Clutch', line: 'Evening', style: 'clutch', leather: 'satin', material: 'Silk satin; gold-toned bar', size: '28 × 15 × 3 cm', price: 125000, note: 'An envelope clutch in silk satin, its pointed flap held by a slim bar.', ways: [{ name: 'Emerald', hex: '#1f5a3e' }, { name: 'Black', hex: '#141414' }, { name: 'Blush', hex: '#e6bfb8' }] },
  mini: { name: 'Mini Top-Handle', line: 'Dionysus', style: 'mini', leather: 'suede', material: 'Suede; gold-toned double ring; chain', size: '19 × 14 × 7 cm', price: 198000, note: 'A mini top-handle in suede with a double-ring clasp, and a sliding chain for the shoulder.', ways: [{ name: 'Taupe', hex: '#8f7b6a' }, { name: 'Pink', hex: '#d7a3a6' }, { name: 'Forest', hex: '#2f5a43' }] },
  bowling: { name: 'Bowling Bag', line: 'Bauletto', style: 'bowling', leather: 'canvas', material: 'Diamond canvas, leather ends and handles', size: '32 × 22 × 15 cm', price: 189000, note: 'A bowling bag zipped over its rounded top, with rolled leather handles and leather ends.', trim: ['calf', '#5a3a24'], ways: [{ name: 'Beige ebony', hex: '#c9b48e' }, { name: 'Black ebony', hex: '#3a3330' }] },
  bucket: { name: 'Drawstring Bucket', line: 'Soho', style: 'bucket', leather: 'pebbled', material: 'Grained calfskin, leather cord', size: '20 × 25 × 20 cm', price: 158000, note: 'A bucket bag drawn closed by a leather cord through ten eyelets.', ways: [{ name: 'Cognac', hex: '#8a4a22' }, { name: 'Black', hex: '#161616' }, { name: 'Emerald', hex: '#1f5a3e' }] },
  quilted: { name: 'Quilted Chain Bag', line: 'Marmont', style: 'quilted', leather: 'quilted', material: 'Matelassé calfskin; chain', size: '25 × 15 × 7 cm', price: 245000, note: 'Chevron-quilted calfskin, a flap with a round medallion, a sliding chain.', ways: [{ name: 'Black', hex: '#141414' }, { name: 'Dusty pink', hex: '#d6a9a4' }, { name: 'White', hex: '#efe9df' }] },
  minaudiere: { name: 'Crystal Minaudière', line: 'Evening', style: 'minaudiere', leather: 'crystal', material: 'Crystal-set metal case; chain', size: '17 × 10 × 5 cm', price: 395000, note: 'A small hard evening case set with crystals, a jewelled clasp and a fine chain.', ways: [{ name: 'Silver', hex: '#d9dce2' }, { name: 'Gold', hex: '#d9b878' }] },
  raffia: { name: 'Raffia Tote', line: 'Summer', style: 'raffia', leather: 'raffia', material: 'Woven raffia, leather trim; horsebit', size: '34 × 27 × 13 cm', price: 132000, note: 'A summer tote of woven raffia trimmed in leather, the horsebit on its front.', trim: ['calf', '#6a4428'], ways: [{ name: 'Natural', hex: '#ffffff' }, { name: 'Ecru', hex: '#efe4cf' }] },
}

const rupees = (n: number) => `₹ ${n.toLocaleString('en-IN')}`
const bagged: { name: string; colour: string; price: number }[] = []

function checkout(): Omit<EquipmentInfo, 'place'> {
  const total = bagged.reduce((a, l) => a + l.price, 0)
  return {
    title: 'Your Selection',
    kind: 'Gucci · Checkout',
    body: bagged.length ? 'Each bag is brought from the stockroom, checked with you, filled with tissue and boxed in its dust bag.' : 'Nothing chosen yet. Tap any bag, pick its colour and add it to your selection; then pay here.',
    specs: bagged.length ? [...bagged.map((l) => `${l.name} · ${l.colour} · ${rupees(l.price)}`), `Total ${rupees(total)} (incl. GST)`] : ['Cards, UPI and wallets', 'Monogramming in-store', 'Complimentary gift wrapping'],
    action: bagged.length
      ? {
          label: `Pay ${rupees(total)}`,
          run: () => {
            bagged.length = 0
            return 'Paid, thank you. Your bags are being boxed; your receipt is on its way by SMS.'
          },
        }
      : undefined,
  }
}

/** A round-headed arch outline, w wide, its spring at `spring`, from its foot; as a shape or a hole. */
function archShape(w: number, spring: number, dx = 0) {
  const s = new Shape()
  s.moveTo(dx - w / 2, 0)
  s.lineTo(dx + w / 2, 0)
  s.lineTo(dx + w / 2, spring)
  s.absarc(dx, spring, w / 2, 0, PI, false)
  s.lineTo(dx - w / 2, 0)
  return s
}
function archHole(w: number, spring: number, dx = 0, y0 = 0) {
  const p = new Path()
  p.moveTo(dx - w / 2, y0)
  p.lineTo(dx - w / 2, spring)
  p.absarc(dx, spring, w / 2, PI, 0, true)
  p.lineTo(dx + w / 2, y0)
  p.lineTo(dx - w / 2, y0)
  return p
}
/** The arch's edge as a line (for brass trim). */
function archLine(w: number, spring: number, dx: number, y0: number, z: number) {
  const pts: Vector3[] = [new Vector3(dx - w / 2, y0, z), new Vector3(dx - w / 2, spring, z)]
  for (let i = 1; i < 24; i++) {
    const a = PI - (i / 24) * PI
    pts.push(new Vector3(dx + Math.cos(a) * (w / 2), spring + Math.sin(a) * (w / 2), z))
  }
  pts.push(new Vector3(dx + w / 2, spring, z), new Vector3(dx + w / 2, y0, z))
  return pts
}

export function buildBagStore(e: FloorCtx, u: Unit) {
  const s = openShop(e, u)
  const { k, lux } = e
  const { g, y: Y } = s
  const m = bagMaterials(e)
  const soffit = e.soffit

  const display = circuit()
  const glowOf = (mat: MeshStandardMaterial) => {
    const n = mat.clone()
    n.userData.interior = true
    display.glows.push(n)
    return n
  }
  const led = glowOf(lux.led as MeshStandardMaterial)
  const nicheLit = glowOf(m.nicheLit as MeshStandardMaterial)
  const spot = onCircuit(s, lux.led as MeshStandardMaterial)
  const trimTube = (p: Object3D, pts: Vector3[]) => mesh(p, new TubeGeometry(new CatmullRomCurve3(pts, false, 'catmullrom', 0.05), 80, 0.007, 6, false), m.brass, 0, 0, 0, false)

  /** A bag on display: recolourable, its flap lifting, explaining itself, turned in its card. */
  let bid = 0
  const show = (par: Object3D, key: keyof typeof BAGS, way: number, x: number, y: number, z: number, yaw: number, noStrap = true) => {
    const B = BAGS[key]
    let cur = way % B.ways.length
    const holder = live(par, `bag${bid++}`, 'gucci')
    holder.position.set(x, y, z)
    holder.rotation.y = yaw
    const make = (p: Object3D, i: number, merge: boolean) => {
      const L = m.leather(B.leather, B.ways[i].hex)
      const r = bag(m, p, { style: B.style, leather: L, trim: B.trim ? m.leather(B.trim[0], B.trim[1]) : undefined, metal: B.metal === 'palladium' ? m.palladium : m.gold, name: `${B.name}${bid}`, noStrap })
      if (merge) mergeStatic(r.parts, /^door_/)
      return r
    }
    make(holder, cur, true)
    info(s, holder, {
      title: B.name,
      kind: `${B.line} line · Gucci`,
      body: `${B.note} Drag it to turn it; scroll or pinch to look closer; pick a colour to see it on the shelf. Tap its flap to open it.`,
      specs: [`Material: ${B.material}`, `Size: ${B.size}`, `Colours: ${B.ways.map((w) => w.name).join(', ')}`, rupees(B.price)],
      inspect: () => {
        const p = new Group()
        bag(m, p, { style: B.style, leather: m.leather(B.leather, B.ways[cur].hex), trim: B.trim ? m.leather(B.trim[0], B.trim[1]) : undefined, metal: m.gold, name: 'inspect', noStrap: false })
        return p
      },
      variants: {
        label: 'Colour',
        options: B.ways.map((w) => ({ name: w.name, swatch: w.hex })),
        current: () => cur,
        pick: (i) => {
          cur = i
          for (const c of [...holder.children]) {
            holder.remove(c)
            c.traverse((o) => (o as Mesh).geometry?.dispose())
          }
          make(holder, i, true)
        },
      },
      action: {
        label: 'Add to selection',
        run: () => {
          bagged.push({ name: B.name, colour: B.ways[cur].name, price: B.price })
          return `Added the ${B.name} in ${B.ways[cur].name.toLowerCase()}. ${bagged.length} ${bagged.length === 1 ? 'bag' : 'bags'} chosen: pay at the counter in the first niche.`
        },
      },
    }, 0.006)
    return holder
  }

  /* ---------- floor, ceiling ---------- */
  flat(g, clipped(e, u.rects[0]), Y + 0.006, m.stone, false, [], 'gucci_floor')
  {
    // The green rug, its border a shade deeper.
    const rw = 2.5
    const rd = 4.6
    const rz = -12.55
    k.box(g, rw, 0.012, rd, m.rugEdge, XC, Y + 0.012, rz, false)
    k.box(g, rw - 0.16, 0.013, rd - 0.16, m.rug, XC, Y + 0.0125, rz, false)
    s.e.shade.rect(XC, Y + 0.02, rz, rw, rd, 0, 0.12)
  }
  {
    const ceil = Y + H
    const c0 = XC - 0.95
    const c1 = XC + 0.95
    const cz0 = -14.65
    const cz1 = -10.55
    flat(g, rect(XL, XR, ZB, ZF), ceil, m.plaster, true, [rect(c0, c1, cz0, cz1)], 'gucci_ceiling')
    // The coffer: plaster sides up to a mirrored top, a line of light round its foot.
    for (const [x0, x1, z0, z1] of [[c0, c1, cz0 - 0.01, cz0], [c0, c1, cz1, cz1 + 0.01], [c0 - 0.01, c0, cz0, cz1], [c1, c1 + 0.01, cz0, cz1]] as const) box(s, x0, x1, ceil, ceil + 0.16, z0, z1, m.plaster, false)
    flat(g, rect(c0, c1, cz0, cz1), ceil + 0.16, m.mirror, true, [], 'gucci_mirror')
    for (const [x0, x1, z0, z1] of [[c0 + 0.02, c1 - 0.02, cz0 + 0.01, cz0 + 0.03], [c0 + 0.02, c1 - 0.02, cz1 - 0.03, cz1 - 0.01], [c0 + 0.01, c0 + 0.03, cz0 + 0.02, cz1 - 0.02], [c1 - 0.03, c1 - 0.01, cz0 + 0.02, cz1 - 0.02]] as const) box(s, x0, x1, ceil + 0.005, ceil + 0.012, z0, z1, led, false)
    // Spots round it, aimed at the niches.
    for (const z of [-14.2, -12.6, -11.0])
      for (const x of [c0 - 0.3, c1 + 0.3]) {
        k.cyl(g, 0.045, 0.045, 0.012, m.plaster, x, ceil - 0.006, z, 20)
        k.cyl(g, 0.03, 0.03, 0.004, spot, x, ceil - 0.012, z, 20)
      }
  }

  /* ---------- the fronts: the door to the gallery (z −9.3), glass to the east spine (x 7.8) ---------- */
  {
    box(s, 3.6, 7.8, Y + e.ceiling, soffit, ZF - 0.075, ZF + 0.075, e.m.wallPaint)
    box(s, XR - 0.075, XR + 0.075, Y + e.ceiling, soffit, -16.0, ZF, e.m.wallPaint)
    // The fascias, green with the name in brass.
    k.box(g, 4.2, 0.55, 0.3, m.emerald, 5.7, Y + 3.275, ZF - 0.1)
    brandSign(s, g, letters(s, 'GUCCI', 'dior', '#d9b878', 512, 128), 1.3, 0.325, 5.7, Y + 3.28, ZF + 0.054, 0)
    k.box(g, 0.3, 0.55, 6.7, m.emerald, XR - 0.1, Y + 3.275, -12.65)
    brandSign(s, g, letters(s, 'GUCCI', 'dior', '#d9b878', 512, 128), 1.3, 0.325, XR + 0.054, Y + 3.28, -12.65, PI / 2)
    const fr = m.brass
    // The door front.
    box(s, 3.6, 7.8, Y + 2.95, Y + 3.0, ZF - 0.03, ZF + 0.03, fr)
    for (const x of [3.65, 4.8, 6.6, 7.75]) box(s, x - 0.02, x + 0.02, Y, Y + 2.95, ZF - 0.03, ZF + 0.03, fr)
    box(s, 4.8, 6.6, Y + 2.62, Y + 2.67, ZF - 0.03, ZF + 0.03, fr)
    pane(s, g, 3.67, ZF, 4.78, ZF, Y + 0.02, Y + 2.95)
    pane(s, g, 6.62, ZF, 7.73, ZF, Y + 0.02, Y + 2.95)
    pane(s, g, 4.8, ZF, 6.6, ZF, Y + 2.67, Y + 2.95)
    swingLeaf(s, at(g, 4.8, Y, ZF, 0), 'gucci_l', 0.89, 2.6, fr, PI / 2, true)
    swingLeaf(s, at(g, 6.6, Y, ZF, PI), 'gucci_r', 0.89, 2.6, fr, -PI / 2, true)
    box(s, 4.8, 6.6, Y, Y + 0.008, ZF - 0.15, ZF + 0.15, m.brass, false)
    // The east glass, mullioned in brass; the niche wall stands behind it.
    box(s, XR - 0.03, XR + 0.03, Y + 2.95, Y + 3.0, -16.0, ZF, fr)
    for (let z = -15.95; z < ZF; z += 1.34) box(s, XR - 0.03, XR + 0.03, Y, Y + 2.95, z - 0.02, z + 0.02, fr)
    pane(s, g, XR, -15.93, XR, ZF - 0.04, Y + 0.02, Y + 2.95)
    e.shade.foot(3.6, ZF - 0.06, 7.8, ZF - 0.06, Y + 0.01, 0.2, 0.25)
  }

  /* ---------- the niche walls down both sides ---------- */
  const BAYS = 4
  const z0 = -15.5
  const z1 = -9.6
  const pitch = (z1 - z0) / BAYS
  const BW = 1.05
  const SPRING = 2.0
  // What each niche holds: [cabinet top, first shelf (one or two), top shelf].
  type Slot = [keyof typeof BAGS, number]
  const LEFT: Slot[][] = [
    [['bucket', 0], ['bamboo', 0], ['tote', 0]],
    [['bowling', 0], ['hobo', 0], ['mini', 1]],
    [['raffia', 0], ['quilted', 0], ['camera', 2]],
    [['bamboo', 1], ['clutch', 0], ['hobo', 1]],
  ]
  const RIGHT: Slot[][] = [
    [['tote', 1], ['horsebit', 0], ['bamboo', 2]],
    [['bucket', 2], ['camera', 0], ['quilted', 1]],
    [['bowling', 1], ['mini', 0], ['horsebit', 1]],
    [['raffia', 1], ['horsebit', 2], ['camera', 1]],
  ]
  let cid = 0
  const nicheWall = (side: -1 | 1) => {
    // side −1: the left wall (x = 3.675, facing +x); +1: the right (x = 7.8, facing −x).
    const face = side < 0 ? IN0 : IN1
    const zm = (z0 + z1) / 2
    const w = at(g, face, Y, zm, side < 0 ? PI / 2 : -PI / 2)
    const L = z1 - z0
    // u along the wall: on the left it runs towards −z, on the right towards +z.
    const uOf = (z: number) => (side < 0 ? -(z - zm) : z - zm)
    // The build-out's back, flush with the wall (and seen through the east glass); its ends.
    k.box(w, L, H, 0.012, m.emerald, 0, H / 2, -DEPTH + 0.006, false)
    for (const su of [-L / 2, L / 2]) k.box(w, 0.012, H, DEPTH, m.emerald, su, H / 2, -DEPTH / 2, false)
    const plate = new Shape()
    plate.moveTo(-L / 2, 0)
    plate.lineTo(L / 2, 0)
    plate.lineTo(L / 2, H)
    plate.lineTo(-L / 2, H)
    plate.closePath()
    const centres = Array.from({ length: BAYS }, (_, i) => z0 + pitch * (i + 0.5))
    for (const zc of centres) plate.holes.push(archHole(BW, SPRING, uOf(zc), 0.002))
    mesh(w, new ExtrudeGeometry(plate, { depth: 0.03, bevelEnabled: false, curveSegments: 24 }), m.emerald, 0, 0, -0.03)
    // A second tier of blind arches traced in brass above, and between them.
    for (const zc of centres) trimTube(w, archLine(BW + 0.12, 3.05, uOf(zc), 2.72, 0.004))
    for (let i = 0; i <= BAYS; i++) {
      const u0 = uOf(z0 + pitch * i)
      if (Math.abs(u0) < L / 2 - 0.2) trimTube(w, archLine(0.3, 3.6, u0, 3.25, 0.004))
    }
    // Seen through the east glass, the build-out's back carries the same arcade in brass.
    if (side > 0)
      for (const zc of centres) {
        trimTube(w, archLine(BW, SPRING, uOf(zc), 0.05, -DEPTH - 0.004))
        trimTube(w, archLine(BW + 0.12, 3.05, uOf(zc), 2.72, -DEPTH - 0.004))
      }
    centres.forEach((zc, i) => {
      const uc = uOf(zc)
      const n = at(w, uc, 0, 0, 0)
      // The recess: lined in bronze, its back lit, brass round its edge.
      const ring = archShape(BW + 0.06, SPRING)
      ring.holes.push(archHole(BW, SPRING, 0, 0.002))
      mesh(n, new ExtrudeGeometry(ring, { depth: DEPTH - 0.06, bevelEnabled: false, curveSegments: 24 }), m.niche, 0, 0, -DEPTH + 0.03, false)
      mesh(n, new ExtrudeGeometry(archShape(BW, SPRING), { depth: 0.01, bevelEnabled: false, curveSegments: 24 }), nicheLit, 0, 0, -DEPTH + 0.03, false)
      trimTube(n, archLine(BW + 0.01, SPRING, 0, 0.0, 0.006))
      // The cabinet at its foot: two doors of rose print in brass frames.
      const cd = DEPTH - 0.08
      k.box(n, BW - 0.02, 0.85, cd, m.emeraldDeep, 0, 0.425, -DEPTH + 0.04 + cd / 2)
      k.box(n, BW, 0.03, cd + 0.03, m.shelf, 0, 0.865, -DEPTH + 0.04 + cd / 2 + 0.015)
      for (const sx of [-1, 1] as const) {
        const hinge = at(n, sx * (BW / 2 - 0.02), 0.04, 0.0, 0)
        const leaf = new Group()
        leaf.name = `door_gucci_cab_${cid++}`
        leaf.userData.label = 'Cabinet door'
        leaf.userData.openAngle = sx < 0 ? -1.6 : 1.6
        hinge.add(leaf)
        const dw = BW / 2 - 0.03
        const front = k.box(leaf, dw, 0.78, 0.02, m.emeraldDeep, (-sx * dw) / 2, 0.39, 0.01)
        front.userData.front = true
        k.box(leaf, dw - 0.06, 0.7, 0.006, m.flora, (-sx * dw) / 2, 0.39, 0.022)
        for (const [bw, bh, x, y] of [[dw - 0.04, 0.012, 0, 0.75], [dw - 0.04, 0.012, 0, 0.03], [0.012, 0.73, -(dw - 0.04) / 2, 0.39], [0.012, 0.73, (dw - 0.04) / 2, 0.39]] as const) k.box(leaf, bw, bh, 0.012, m.brass, (-sx * dw) / 2 + x, y, 0.024)
        k.cyl(leaf, 0.006, 0.006, 0.12, m.brass, -sx * (dw - 0.04), 0.5, 0.034, 10)
      }
      // Dust bags inside, boxed.
      for (let q = 0; q < 2; q++) k.box(n, 0.32, 0.2, 0.25, m.leather('calf', '#e9e0cc'), -0.22 + q * 0.44, 0.15, -DEPTH + 0.2, false)
      // Wooden shelves with a line of light under each.
      for (const yy of [1.32, 1.82]) {
        const half = Math.min(BW / 2, Math.sqrt(Math.max(0, (BW / 2) ** 2 - Math.max(0, yy - SPRING) ** 2)))
        k.box(n, half * 2, 0.03, DEPTH - 0.08, m.shelf, 0, yy, -DEPTH / 2 + 0.01)
        k.box(n, half * 2 - 0.08, 0.004, 0.01, led, 0, yy - 0.017, -0.06, false)
      }
      // The bags: one on the cabinet, one or two on the first shelf, one on the top.
      const slots = (side < 0 ? LEFT : RIGHT)[i]
      const yawFace = 0
      const zz = -DEPTH / 2 + 0.03
      show(n, slots[0][0], slots[0][1], 0.1, 0.88, zz, yawFace + 0.15, true)
      show(n, slots[1][0], slots[1][1], 0, 1.335, zz, yawFace - 0.12, true)
      show(n, slots[2][0], slots[2][1], 0, 1.835, zz, yawFace + 0.1, true)
    })
    e.shade.foot(side < 0 ? IN0 : IN1, z0, side < 0 ? IN0 : IN1, z1, Y + 0.01, 0.2, 0.3)
  }
  nicheWall(-1)
  nicheWall(1)
  {
    // The counter: the first left niche's cabinet top serves as the desk, its till and card machine.
    const n = at(g, IN0 - 0.2, Y + 0.88, z1 - pitch / 2 - 0.3, PI / 2)
    const till = at(n, 0, 0, 0, 0)
    k.cyl(till, 0.05, 0.06, 0.01, m.brass, 0, 0.005, 0, 32)
    k.cyl(till, 0.01, 0.01, 0.16, m.brass, 0, 0.09, 0, 12)
    const head = at(till, 0, 0.2, 0, 0)
    head.rotation.x = -0.3
    k.box(head, 0.24, 0.16, 0.012, m.leather('patent', '#121212'), 0, 0, 0)
    const scr = m.canvas(384, 256, (c, w, h) => {
      c.fillStyle = '#f5efe4'
      c.fillRect(0, 0, w, h)
      c.fillStyle = '#1e6b4b'
      c.fillRect(0, 0, w, 42)
      c.fillStyle = '#e8d3a0'
      c.font = '500 24px "Cormorant Garamond", Georgia, serif'
      c.fillText('GUCCI', 16, 30)
      c.fillStyle = '#2e2a24'
      c.textAlign = 'center'
      c.font = '500 25px "Inter", Arial, sans-serif'
      c.fillText('Tap to check out', w / 2, h * 0.58)
      c.font = '400 15px "Inter", Arial, sans-serif'
      c.fillText('Cards · UPI · Wallets', w / 2, h * 0.8)
    })
    const sm = new MeshStandardMaterial({ map: scr, emissiveMap: scr, emissive: '#ffffff', emissiveIntensity: 0.6, roughness: 0.3 })
    sm.userData.interior = true
    const btn = button(head, 'till', 'Till', 'Check out', 0, 0, 0.007, () => useInfoStore.getState().show({ ...checkout(), place: `First Floor · ${s.u.name} (${s.u.id})` }), 'gucci')
    mesh(btn, new PlaneGeometry(0.22, 0.145), sm, 0, 0, 0, false)
  }

  /* ---------- the back wall: the archway and its screen, the vitrine, the olive ---------- */
  {
    const w = at(g, XC, Y, ZB + DEPTH, 0)
    const L = IN1 - IN0
    k.box(w, L, H, 0.012, m.emerald, 0, H / 2, -DEPTH + 0.006, false)
    const plate = new Shape()
    plate.moveTo(-L / 2, 0)
    plate.lineTo(L / 2, 0)
    plate.lineTo(L / 2, H)
    plate.lineTo(-L / 2, H)
    plate.closePath()
    const PW = 1.2
    const SW = 0.64
    const su = 1.1
    plate.holes.push(archHole(PW, 2.3, 0, 0.002), archHole(SW, 1.9, -su, 0.002), archHole(SW, 1.9, su, 0.002))
    mesh(w, new ExtrudeGeometry(plate, { depth: 0.03, bevelEnabled: false, curveSegments: 24 }), m.emerald, 0, 0, -0.03)
    for (const [ww, sp, dx] of [[PW, 2.3, 0], [SW, 1.9, -su], [SW, 1.9, su]] as const) {
      trimTube(w, archLine(ww + 0.01, sp, dx, 0, 0.006))
      const ring = archShape(ww + 0.06, sp, dx)
      ring.holes.push(archHole(ww, sp, dx, 0.002))
      mesh(w, new ExtrudeGeometry(ring, { depth: DEPTH - 0.06, bevelEnabled: false, curveSegments: 24 }), dx === 0 ? m.emeraldDeep : m.niche, 0, 0, -DEPTH + 0.03, false)
      mesh(w, new ExtrudeGeometry(archShape(ww, sp, dx), { depth: 0.01, bevelEnabled: false, curveSegments: 24 }), dx === 0 ? m.emeraldDeep : nicheLit, 0, 0, -DEPTH + 0.03, false)
    }
    trimTube(w, archLine(PW + 0.5, 3.15, 0, 2.95, 0.004))
    for (const dx of [-su, su]) trimTube(w, archLine(SW + 0.2, 2.75, dx, 2.5, 0.004))
    brandSign(s, w, letters(s, 'GUCCI', 'dior', '#d9b878', 512, 128), 0.9, 0.225, 0, 3.32, 0.006, 0)
    // The campaign on a screen in the archway; a low plinth before it with two bags.
    const camp = m.canvas(360, 640, (c, wd, ht) => {
      const gr = c.createLinearGradient(0, 0, 0, ht)
      gr.addColorStop(0, '#9cb3c4')
      gr.addColorStop(1, '#d9cfc0')
      c.fillStyle = gr
      c.fillRect(0, 0, wd, ht)
      // A figure in a pale dress, a bag at her side: soft shapes, as a campaign photograph out of focus.
      c.filter = 'blur(2px)'
      c.fillStyle = '#e9ddc9'
      c.beginPath()
      c.ellipse(wd / 2, ht * 0.62, wd * 0.16, ht * 0.25, 0, 0, 7)
      c.fill()
      c.fillStyle = '#c9a07a'
      c.beginPath()
      c.ellipse(wd / 2, ht * 0.3, wd * 0.07, ht * 0.06, 0, 0, 7)
      c.fill()
      c.fillStyle = '#5a3a24'
      c.beginPath()
      c.ellipse(wd / 2, ht * 0.25, wd * 0.09, ht * 0.05, 0, PI, 2 * PI)
      c.fill()
      c.fillStyle = '#c9a07a'
      c.fillRect(wd * 0.44, ht * 0.84, wd * 0.04, ht * 0.14)
      c.fillRect(wd * 0.52, ht * 0.84, wd * 0.04, ht * 0.14)
      c.fillStyle = '#9e1b24'
      c.fillRect(wd * 0.64, ht * 0.56, wd * 0.12, ht * 0.08)
      c.filter = 'none'
      c.fillStyle = 'rgba(255,255,255,.85)'
      c.font = '500 30px "Cormorant Garamond", Georgia, serif'
      c.textAlign = 'center'
      c.fillText('GUCCI', wd / 2, ht * 0.08)
    })
    const scrMat = glowOf(new MeshStandardMaterial({ map: camp, emissiveMap: camp, emissive: '#ffffff', emissiveIntensity: 0.75, roughness: 0.3 }))
    k.box(w, 0.8, 1.4, 0.04, m.leather('patent', '#121212'), 0, 1.45, -DEPTH + 0.06)
    const sc = mesh(w, new PlaneGeometry(0.75, 1.33), scrMat, 0, 1.45, -DEPTH + 0.082, false)
    info(s, sc, { title: 'The Campaign', kind: 'Gucci', body: 'The season\'s campaign, playing on a screen in the archway to the back of the house.', specs: ['Ask for the lookbook'] }, 0)
    k.box(w, 1.0, 0.36, 0.34, m.emeraldDeep, 0, 0.18, -DEPTH / 2 + 0.02)
    k.box(w, 1.02, 0.02, 0.36, m.brass, 0, 0.37, -DEPTH / 2 + 0.02)
    show(w, 'quilted', 2, -0.24, 0.38, -DEPTH / 2 + 0.02, 0.2, false)
    show(w, 'clutch', 1, 0.24, 0.38, -DEPTH / 2 + 0.04, -0.2, true)
    // The vitrine in the left arch: a glazed door on brass, minaudières and clutches on glass shelves.
    {
      const v = at(w, -su, 0, -DEPTH / 2 + 0.01, 0)
      const vw = SW - 0.06
      k.box(v, vw, 0.5, DEPTH - 0.12, m.emeraldDeep, 0, 0.25, 0)
      for (const yy of [0.95, 1.35]) k.box(v, vw - 0.02, 0.008, DEPTH - 0.14, m.glass, 0, yy, 0, false)
      show(v, 'minaudiere', 0, 0, 0.51, 0, 0.1, false)
      show(v, 'minaudiere', 1, 0, 0.958, 0, -0.1, true)
      show(v, 'clutch', 2, 0, 1.358, 0, 0, true)
      const hinge = at(v, -vw / 2, 0.5, (DEPTH - 0.12) / 2 + 0.01, 0)
      const leaf = new Group()
      leaf.name = 'door_gucci_vitrine'
      leaf.userData.label = 'Vitrine door'
      leaf.userData.openAngle = -1.5
      hinge.add(leaf)
      const pn = k.box(leaf, vw, 1.35, 0.006, m.glass, vw / 2, 0.675, 0, false)
      pn.userData.front = true
      for (const [bw, bh, x, y] of [[vw, 0.015, vw / 2, 1.345], [0.015, 1.35, 0.0075, 0.675], [0.015, 1.35, vw - 0.0075, 0.675]] as const) k.box(leaf, bw, bh, 0.012, m.brass, x, y, 0)
      k.cyl(leaf, 0.005, 0.005, 0.12, m.brass, vw - 0.04, 0.7, 0.012, 10)
    }
    // The olive tree in the right arch.
    planter(m, w, su, 0.24, 0.5, -DEPTH / 2 + 0.02)
  }

  /* ---------- the seating on the rug ---------- */
  {
    const cx = XC
    const cz = -13.05
    // The sofa: a half ring, channel-tufted, green velvet on the left half and mustard on the right.
    const ringSector = (r0: number, r1: number, a0: number, a1: number, h0: number, h1: number, bevel: number) => {
      const sh = new Shape()
      const n = 40
      for (let i = 0; i <= n; i++) {
        const a = a0 + ((a1 - a0) * i) / n
        if (i === 0) sh.moveTo(Math.cos(a) * r1, Math.sin(a) * r1)
        else sh.lineTo(Math.cos(a) * r1, Math.sin(a) * r1)
      }
      for (let i = n; i >= 0; i--) {
        const a = a0 + ((a1 - a0) * i) / n
        sh.lineTo(Math.cos(a) * r0, Math.sin(a) * r0)
      }
      sh.closePath()
      const geo = new ExtrudeGeometry(sh, { depth: h1 - h0 - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5, curveSegments: 6 })
      geo.rotateX(PI / 2)
      geo.translate(0, h1 - bevel, 0)
      return geo
    }
    for (const [a0, a1, mat] of [[PI * 0.02, PI * 0.5, m.velvetGreen], [PI * 0.5, PI * 0.98, m.mustard]] as const) {
      // In plan, angle a points to (cos a, −sin a): 0 → +x, π/2 → −z (towards the back).
      const sofa = at(g, cx, Y, cz, 0)
      sofa.scale.z = -1
      mesh(sofa, ringSector(0.42, 0.98, a0, a1, 0.06, 0.42, 0.04), mat)
      mesh(sofa, ringSector(0.8, 0.98, a0, a1, 0.42, 0.74, 0.05), mat)
      info(s, sofa.children[0], { title: mat === m.mustard ? 'Mustard Velvet Sofa' : 'Green Velvet Sofa', kind: 'Seating', body: 'Half of the round sofa at the heart of the shop, channel-tufted in cotton velvet: sit while a bag is brought for you.', specs: ['Cotton velvet, channel-tufted'] }, 0)
    }
    s.e.shade.pool(cx, Y + 0.02, cz - 0.3, 1.05, 0.7, 0.4)
    // The table: smoked glass on a rose-print drum, a little olive in a pot.
    const t = at(g, cx, Y, cz + 0.3, 0)
    k.cyl(t, 0.27, 0.27, 0.38, m.flora, 0, 0.19, 0, 48)
    k.cyl(t, 0.275, 0.275, 0.012, m.brass, 0, 0.385, 0, 48)
    k.cyl(t, 0.38, 0.38, 0.018, m.smoke, 0, 0.4, 0, 64)
    k.cyl(t, 0.07, 0.055, 0.1, m.emeraldDeep, 0, 0.46, 0, 24)
    mesh(t, new SphereGeometry(0.11, 24, 16), m.leather('suede', '#3f6b3a'), 0, 0.6, 0).scale.y = 0.85
    s.e.shade.pool(cx, Y + 0.02, cz + 0.3, 0.4, 0.4, 0.4)
    info(s, t.children[0], { title: 'Rose-Print Table', kind: 'Furniture', body: 'A drum printed with the house\'s garden roses under a smoked-glass top.', specs: ['Printed lacquer, smoked glass, brass'] }, 0)
    // The mustard pouf and the coral bench.
    const pf = at(g, 4.85, Y, -10.65, 0)
    k.cyl(pf, 0.3, 0.3, 0.38, m.mustard, 0, 0.19, 0, 48)
    mesh(pf, new SphereGeometry(1, 40, 12, 0, PI * 2, 0, PI / 2), m.mustard, 0, 0.38, 0).scale.set(0.3, 0.04, 0.3)
    s.e.shade.pool(4.85, Y + 0.02, -10.65, 0.34, 0.34, 0.4)
    info(s, pf, { title: 'Mustard Pouf', kind: 'Seating', body: 'A round pouf in channel-tufted mustard velvet.', specs: ['Cotton velvet'] }, 0)
    const bench = at(g, cx, Y, cz + 0.3, 0)
    bench.scale.z = -1
    mesh(bench, ringSector(1.12, 1.55, -PI * 0.47, -PI * 0.18, 0.04, 0.44, 0.05), m.coral)
    info(s, bench.children[0], { title: 'Coral Curved Bench', kind: 'Seating', body: 'A curved bench in channel-tufted coral velvet, facing the round sofa across the table.', specs: ['Cotton velvet'] }, 0)
    // The olive tree by the door.
    planter(m, g, 7.0, 0.3, 0.6, -9.95, Y)
  }

  /** A fluted green planter with an olive tree. */
  function planter(mm: BagMaterials, par: Object3D, x: number, r: number, h: number, z: number, y = 0) {
    const p = at(par, x, y, z, 0)
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * PI * 2
      mesh(p, new CylinderGeometry(r * 0.13, r * 0.13, h, 8), mm.emerald, Math.cos(a) * r * 0.92, h / 2, Math.sin(a) * r * 0.92)
    }
    k.cyl(p, r * 0.92, r * 0.92, h, mm.emerald, 0, h / 2, 0, 32)
    k.cyl(p, r * 0.9, r * 0.9, 0.01, mm.leather('suede', '#3b2e24'), 0, h - 0.04, 0, 32)
    p.updateMatrixWorld(true)
    const wp = p.getWorldPosition(new Vector3())
    ficus(e, g, wp.x, wp.z, wp.y + h - 0.04, h > 0.55 ? 1.9 : 1.6, Math.round(x * 13))
    e.shade.pool(wp.x, Y + 0.012, wp.z, r * 1.2, r * 1.2, 0.4)
    info(s, p, { title: 'Olive Tree', kind: 'Planting', body: 'An olive tree in a fluted green planter, as in the house\'s gardens.', specs: ['Not for sale'] }, 0)
  }

  /* ---------- lighting and switches ---------- */
  lamp(s, XC, Y + 3.9, -11.0, 8, 7)
  lamp(s, XC, Y + 3.9, -14.0, 8, 7)
  lamp(s, XC, Y + 2.4, ZB + 0.9, 4, 3.5, '#fff0d8')
  {
    const sw = new Group()
    sw.position.set(IN0 + 0.001, Y + 1.2, -9.7)
    sw.rotation.y = PI / 2
    g.add(sw)
    const plate = switchPlate(k, sw, 'gucci', ['switch', 'switch'], { plate: m.brass, rocker: m.brass, dark: m.leather('patent', '#121212'), locator: lux.ledCool as MeshStandardMaterial }, [s.circuit, display])
    plate.traverse((o) => {
      if (o.name === 'switch_gucci_0') o.userData.label = 'Shop lights'
      if (o.name === 'switch_gucci_1') o.userData.label = 'Niche & coffer lighting'
    })
    setCircuit(s.circuit, true)
    setCircuit(display, true)
  }
  return s
}
