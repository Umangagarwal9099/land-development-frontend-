import { CanvasTexture, CatmullRomCurve3, CylinderGeometry, ExtrudeGeometry, Group, LatheGeometry, Mesh, MeshStandardMaterial, PlaneGeometry, Quaternion, Raycaster, Shape, SphereGeometry, SRGBColorSpace, TorusGeometry, TubeGeometry, Vector2, Vector3, type Material, type Object3D } from 'three'
import { useInfoStore, type EquipmentInfo } from '../../../../../../../store/info'
import { setCircuit } from '../../../kalakalD65/fixtures'
import { plantedFicus } from '../plants'
import type { FloorCtx } from '../shell'
import type { Unit } from '../units'
import { button, info, live, play } from './cafe'
import { cake, cakeStand, canister, cloche, coffeeCup, cookie, croissant, cupcake, dessertMaterials, eclair, macaron, plate, slice, tart, type DessertMaterials } from './dessertGoods'
import { grid, ribbon, type P3 } from './heels'
import { at, clickThrough, lamp, mesh, onCircuit, openShop, PI, type Shop } from './kit'

/*
 * The pâtisserie, unit G-05: a free-standing dessert kiosk where G-05 stood, between the west spine
 * and the basement ramp's marble wall, and a small seating area beside it. Built from the
 * reference (a coffee kiosk, made a pâtisserie):
 *
 *   shell     one flowing form in mirror-polished stainless: a thick rolled lip running up the
 *             left, over the top (reaching forward as a canopy) and down the right, a tall tail
 *             sweeping up and away to the right; the back bulging behind
 *   niche     inside the lip, a glowing satin-champagne hollow: oval rings of light in the canopy,
 *             white floating shelves lit along their edges (canisters of biscuits and meringues,
 *             boxed cakes, macaron towers), the name in lit letters
 *   counter   a long rounded counter in the same polished steel, a line of light under its white
 *             top, a curved glass pâtisserie case along its front; a cake under a cloche, a
 *             macaron tower, the till; all on a low honed-stone plinth lit along the counter's foot
 *   seating   a channel-tufted velvet banquette against the marble wall, three marble tables on
 *             polished steel pedestals, cream bouclé tub chairs, opal globe pendants, a ficus
 *
 * Every dessert explains itself and goes into the order in a quantity; the cloches lift off their
 * cakes; the till takes the order through.
 */

/** The kiosk's origin (its back, centred) and the way it faces: local +z opens to −x, the spine. */
const O = { x: -0.62, z: -13.5, yaw: -PI / 2 }

/* ---------- the menu ---------- */

interface Sweet {
  name: string
  kind: string
  body: string
  price: number
  unit: string
  options: string[]
  specs?: string[]
}
const S: Record<string, Sweet> = {
  macarons: { name: 'Macarons Parisiens', kind: 'Macarons · eight flavours', body: 'Almond meringue shells, crisp outside and chewy within, on their ruffled feet, filled with ganache or buttercream: framboise, pistache de Bronte, vanille de Madagascar, chocolat noir, citron, rose-litchi, café and myrtille.', price: 180, unit: 'each', options: ['1', '6', '12', '24'], specs: ['Gluten-free; contains almonds, egg, dairy', 'Best within 5 days, chilled'] },
  eclairs: { name: 'Éclairs', kind: 'Choux pastry', body: 'Choux pastry piped long, baked crisp and filled with crème pâtissière: chocolat Guanaja under a dark glaze, café, caramel beurre salé and vanille with raspberries.', price: 320, unit: 'each', options: ['1', '2', '4', '6'], specs: ['Contains gluten, egg, dairy', 'Best the day it is made'] },
  tartlets: { name: 'Tartelettes', kind: 'Individual tarts', body: 'Sablé pastry cases blind-baked to gold: strawberries on vanilla crème, raspberries on almond cream, lemon curd under torched Italian meringue.', price: 390, unit: 'each', options: ['1', '2', '4', '6'], specs: ['Contains gluten, egg, dairy, nuts'] },
  slices: { name: 'Gâteaux by the slice', kind: 'Layer cakes', body: 'Opéra (almond joconde, coffee buttercream, ganache), red velvet with cream-cheese frosting, New York cheesecake, and a strawberry fraisier.', price: 450, unit: 'slice', options: ['1', '2', '3', '4'], specs: ['Whole cakes to order, 24 hours ahead'] },
  cupcakes: { name: 'Cupcakes', kind: 'Little cakes', body: 'Buttery vanilla and cocoa sponges crowned with a swirl of Swiss meringue buttercream: rose, pistachio and salted caramel.', price: 260, unit: 'each', options: ['1', '4', '6', '12'] },
  croissants: { name: 'Croissants au Beurre', kind: 'Viennoiserie', body: 'Laminated with French butter over three days and baked through the morning: flaky, honeycombed inside.', price: 220, unit: 'each', options: ['1', '2', '4', '6'] },
  fraisier: { name: 'Le Fraisier', kind: 'Whole cake · serves 8', body: 'Genoise soaked in kirsch syrup, mousseline cream and a wall of halved strawberries, finished with cream rosettes and fresh berries.', price: 2950, unit: 'cake', options: ['1', '2'], specs: ['22 cm, serves 8', 'Message on a chocolate plaque, free'] },
  foret: { name: 'Forêt Noire', kind: 'Whole cake · serves 8', body: 'Chocolate sponge, kirsch cherries and Chantilly under a dark glaze, crowned with cream rosettes and griottines.', price: 2750, unit: 'cake', options: ['1', '2'], specs: ['22 cm, serves 8'] },
  rose: { name: 'Rose-Litchi Entremets', kind: 'Entremets · serves 6', body: 'A dome of rose mousse over a lychee and raspberry insert on almond dacquoise, under a mirror glaze.', price: 3200, unit: 'cake', options: ['1', '2'], specs: ['18 cm dome, serves 6', 'Keep chilled'] },
  tarts: { name: 'Grandes Tartes', kind: 'Whole tarts · serve 8', body: 'Tarte aux fraises, tarte au citron meringuée and tarte aux framboises, 22 cm, on sablé breton.', price: 2400, unit: 'tart', options: ['1', '2'] },
  cookies: { name: 'Cookies', kind: 'Biscuits', body: 'Brown-butter cookies with 70% dark chocolate chips and a pinch of fleur de sel; crisp edges, soft middles.', price: 140, unit: 'each', options: ['1', '6', '12'] },
  meringues: { name: 'Meringue Kisses', kind: 'Confiserie', body: 'Swiss meringue piped in kisses and dried slowly till they shatter: vanilla, raspberry and pistachio.', price: 450, unit: 'jar of 20', options: ['1', '2', '3'] },
  amaretti: { name: 'Amaretti & Biscotti', kind: 'Biscuits', body: 'Soft amaretti di Saronno and twice-baked almond biscotti, for coffee.', price: 520, unit: 'jar', options: ['1', '2', '3'] },
  boxes: { name: 'Gift Boxes', kind: 'Coffrets', body: 'The house\'s boxes, wrapped with a gold ribbon: twelve macarons, six tartelettes, or a selection of biscuits.', price: 1650, unit: 'box', options: ['1', '2', '3'] },
  tower: { name: 'Macaron Tower', kind: 'Pièce montée · to order', body: 'A cone of sixty macarons in your colours, for weddings and birthdays: shown here in pastel, made to order in two days.', price: 12500, unit: 'tower', options: ['1'] },
}

interface Line {
  name: string
  qty: number
  total: number
}
const order: Line[] = []
const rupees = (n: number) => `₹ ${n.toLocaleString('en-IN')}`

function sweetCard(k: keyof typeof S, extra = ''): Omit<EquipmentInfo, 'place'> {
  const d = S[k]
  return {
    title: d.name,
    kind: d.kind,
    body: `${d.body}${extra}`,
    specs: [`${rupees(d.price)} ${d.unit === 'each' ? 'each' : `a ${d.unit}`}`, ...(d.specs ?? []), 'Made in the kitchen upstairs each morning'],
    choices: { label: 'How many', options: d.options },
    action: {
      label: 'Add to order',
      run: (q) => {
        if (!q) return 'Choose how many first.'
        const qty = Number(q)
        order.push({ name: d.name, qty, total: qty * d.price })
        const n = order.reduce((a, l) => a + l.qty, 0)
        return `Added ${qty} × ${d.name}. ${n} ${n === 1 ? 'item' : 'items'} in your order: pay at the till.`
      },
    },
  }
}

function checkout(): Omit<EquipmentInfo, 'place'> {
  const total = order.reduce((a, l) => a + l.total, 0)
  return {
    title: 'Your Order',
    kind: 'Pâtisserie · Till',
    body: order.length ? 'Boxed in the house\'s ribbon to take away, or plated for you at the tables beside the kiosk.' : 'Nothing in your order yet. Tap any dessert in the case, on the counter or on the shelves, choose how many and add it; then pay here.',
    specs: order.length ? [...order.map((l) => `${l.qty} × ${l.name} · ${rupees(l.total)}`), `Total ${rupees(total)} (incl. GST)`] : ['Cards, UPI and wallets', 'Boxes and gift ribbon, free'],
    action: order.length
      ? {
          label: `Pay ${rupees(total)}`,
          run: () => {
            order.length = 0
            return 'Paid, thank you. Your desserts are being boxed; take a seat if you are staying.'
          },
        }
      : undefined,
  }
}

/* ---------- geometry helpers ---------- */

/** A tube of varying radius along a smooth path through [x, y, z, r] points, its ends rounded. */
function varTube(p: Object3D, pts: [number, number, number, number][], mat: Material, n = 180, ring = 64) {
  const curve = new CatmullRomCurve3(pts.map((q) => new Vector3(q[0], q[1], q[2])), false, 'centripetal')
  const rAt = (u: number) => {
    const f = u * (pts.length - 1)
    const i = Math.min(pts.length - 2, Math.floor(f))
    const k = f - i
    return pts[i][3] + (pts[i + 1][3] - pts[i][3]) * (k * k * (3 - 2 * k))
  }
  let N = new Vector3(0, 0, 1)
  const rows: P3[][] = []
  for (let i = 0; i <= n; i++) {
    const u = i / n
    const c = curve.getPoint(u)
    const T = curve.getTangent(u).normalize()
    N = N.sub(T.clone().multiplyScalar(N.dot(T)))
    if (N.lengthSq() < 1e-6) N = new Vector3(1, 0, 0).sub(T.clone().multiplyScalar(T.x))
    N.normalize()
    const B = new Vector3().crossVectors(T, N)
    const r = rAt(u)
    const row: P3[] = []
    for (let j = 0; j <= ring; j++) {
      const a = (j / ring) * PI * 2
      const v = c.clone().addScaledVector(N, Math.cos(a) * r).addScaledVector(B, Math.sin(a) * r)
      row.push([v.x, v.y, v.z])
    }
    rows.push(row)
  }
  mesh(p, grid(rows), mat)
  for (const [u, r] of [[0, pts[0][3]], [1, pts[pts.length - 1][3]]] as const) mesh(p, new SphereGeometry(r, ring, ring / 2), mat, ...curve.getPoint(u).toArray())
  return curve
}

/** A surface spanned from a centre to a closed boundary, ring by ring, its depth by `zAt`. */
function fan(c: Vector3, boundary: Vector3[], rings: number, zAt: (s: number, zb: number) => number) {
  const loop = [...boundary, boundary[0]]
  const rows: P3[][] = []
  for (let k = 0; k <= rings; k++) {
    const s = k / rings
    rows.push(loop.map((b): P3 => [c.x + (b.x - c.x) * s, c.y + (b.y - c.y) * s, zAt(s, b.z)]))
  }
  return grid(rows, 1, 1)
}

/** A flat plan outline (x, z) laid as a slab from y0 to y1. */
function slab(pts: [number, number][], y0: number, y1: number, bevel = 0) {
  const s = new Shape()
  s.moveTo(pts[0][0], pts[0][1])
  for (const [x, z] of pts.slice(1)) s.lineTo(x, z)
  s.closePath()
  const g = new ExtrudeGeometry(s, { depth: y1 - y0 - 2 * bevel, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 8, curveSegments: 4 })
  g.rotateX(PI / 2)
  g.translate(0, y1 - bevel, 0)
  return g
}

/* ---------- the kiosk ---------- */

/** The counter's front line, and its plan outline grown by `off`. */
const zf = (x: number) => 1.74 - 0.12 * (x / 2.2) ** 2
const ZB = 0.95
function counterOutline(off: number): [number, number][] {
  const pts: [number, number][] = []
  const xr = 1.95
  const xl = -1.9
  for (let i = 0; i <= 24; i++) {
    const x = xl + ((xr - xl) * i) / 24
    pts.push([x, zf(x) + off])
  }
  const end = (cx: number, from: number, to: number) => {
    const mid = (ZB + zf(cx)) / 2
    const r = (zf(cx) - ZB) / 2 + off
    for (let i = 1; i < 16; i++) {
      const a = from + ((to - from) * i) / 16
      pts.push([cx + Math.sin(a) * r, mid + Math.cos(a) * r])
    }
  }
  end(xr, 0, PI)
  for (let i = 0; i <= 24; i++) {
    const x = xr - ((xr - xl) * i) / 24
    pts.push([x, ZB - off])
  }
  end(xl, PI, 2 * PI)
  return pts
}

/** The rolled lip: up the left, over the top, down the right; [x, y, z, radius]. */
const RIM: [number, number, number, number][] = [
  [-1.95, 0.05, 1.25, 0.34],
  [-2.25, 0.55, 1.15, 0.34],
  [-2.4, 1.2, 1.05, 0.3],
  [-2.35, 1.85, 1.05, 0.27],
  [-2.05, 2.4, 1.15, 0.24],
  [-1.4, 2.75, 1.3, 0.22],
  [-0.4, 2.88, 1.35, 0.2],
  [0.6, 2.82, 1.3, 0.2],
  [1.45, 2.62, 1.18, 0.2],
  [1.95, 2.15, 1.08, 0.2],
  [2.12, 1.5, 1.05, 0.2],
  [2.14, 1.0, 0.98, 0.23],
  [2.16, 0.5, 0.82, 0.27],
  [2.12, 0.06, 0.72, 0.3],
]
const NICHE_C = new Vector3(-0.1, 1.5, 0.0)

export function buildPatisserie(e: FloorCtx, u: Unit) {
  const s = openShop(e, u)
  // Free-standing in the gallery: its lamps belong to the gallery's light zone.
  s.zone = `mall_${e.plan.label.toLowerCase()}`
  const { k } = e
  const { g, y: Y } = s
  const m = dessertMaterials(e)
  const led = onCircuit(s, e.lux.led as MeshStandardMaterial)
  const niche = onCircuit(s, m.niche as MeshStandardMaterial)
  const signGlow = onCircuit(s, m.std({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 1.4, roughness: 0.4, transparent: true }, 0) as MeshStandardMaterial)

  const K = at(g, O.x, Y, O.z, O.yaw)
  K.name = 'patisserie_kiosk'
  const product = (o: Object3D, key: keyof typeof S, extra = '') => info(s, o, sweetCard(key, extra), 0.004)

  /* ---------- the shell ---------- */
  const rim = varTube(K, RIM, m.chrome)
  const samples = Array.from({ length: 90 }, (_, i) => i / 89)
  const rAt = (u: number) => {
    const f = u * (RIM.length - 1)
    const i = Math.min(RIM.length - 2, Math.floor(f))
    const t = f - i
    return RIM[i][3] + (RIM[i + 1][3] - RIM[i][3]) * (t * t * (3 - 2 * t))
  }
  const inPlane = (c: Vector3, toward: Vector3) => new Vector3(toward.x - c.x, toward.y - c.y, 0).normalize()
  // The niche: from the lip's inner edge back into the hollow, down behind the counter to the floor.
  const inner: Vector3[] = samples.map((u) => {
    const c = rim.getPoint(u)
    const r = rAt(u)
    return c.clone().addScaledVector(inPlane(c, NICHE_C), r * 0.72).add(new Vector3(0, 0, -r * 0.45))
  })
  for (let i = 1; i < 12; i++) inner.push(new Vector3(2.0 - (3.85 * i) / 12, 0.02, 0.35))
  inner.push(new Vector3(-1.85, 0.02, 0.4))
  const nicheGeo = fan(NICHE_C, inner, 28, (t, zb) => NICHE_C.z + (zb - NICHE_C.z) * t ** 2.6)
  const nicheMesh = new Mesh(nicheGeo, niche)
  nicheMesh.receiveShadow = true
  nicheMesh.updateMatrixWorld()
  // Where the niche's surface lies, found by looking at it from the front.
  const ray = new Raycaster()
  const onNiche = (x: number, y: number) => {
    ray.set(new Vector3(x, y, 4), new Vector3(0, 0, -1))
    const hit = ray.intersectObject(nicheMesh)[0]
    if (!hit) return { p: new Vector3(x, y, 0), n: new Vector3(0, 0, 1) }
    const n = hit.face!.normal.clone()
    if (n.z < 0) n.negate()
    return { p: hit.point, n }
  }
  K.add(nicheMesh)
  // The back, bulging behind the lip, down to the floor.
  const outer: Vector3[] = samples.map((u) => {
    const c = rim.getPoint(u)
    const r = rAt(u)
    return c.clone().addScaledVector(inPlane(c, NICHE_C), -r * 0.45).add(new Vector3(0, 0, -r * 0.25))
  })
  outer.push(new Vector3(1.6, 0.02, -0.25), new Vector3(0, 0.02, -0.42), new Vector3(-1.7, 0.02, -0.25), new Vector3(-2.25, 0.02, 0.6))
  const CB = new Vector3(-0.05, 1.45, -0.5)
  mesh(K, fan(CB, outer, 24, (t, zb) => CB.z + (zb - CB.z) * t ** 1.5), m.chrome)
  // The tail: the back of the shell swelling up out of its top right and sweeping up and away.
  varTube(K, [[0.55, 2.4, -0.14, 0.35], [1.35, 2.85, -0.16, 0.33], [2.05, 3.25, -0.18, 0.28], [2.6, 3.65, -0.18, 0.21], [2.95, 3.95, -0.17, 0.14], [3.1, 4.05, -0.16, 0.09]], m.chrome, 120, 56)
  // Rings of light in the canopy: a great oval and three small circles.
  for (const [x, y, r, sx] of [[-0.35, 2.47, 0.3, 1.55], [-1.2, 2.42, 0.075, 1], [-1.0, 2.2, 0.05, 1], [0.05, 2.5, 0.045, 1]] as const) {
    const { p, n } = onNiche(x, y)
    const ringM = mesh(K, new TorusGeometry(r, 0.011, 6, 64), led, p.x + n.x * 0.012, p.y + n.y * 0.012, p.z + n.z * 0.012, false)
    ringM.quaternion.copy(new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), n))
    ringM.scale.x = sx
  }
  // The floating shelves, their backs following the hollow, each lit along its edge.
  const shelf = (y: number, x0: number, x1: number) => {
    const xs = Array.from({ length: 18 }, (_, i) => x0 + ((x1 - x0) * i) / 17)
    const back = xs.map((x) => onNiche(x, y + 0.03).p.z)
    const outline: [number, number][] = [...xs.map((x, i): [number, number] => [x, back[i] + 0.27]), ...[...xs].reverse().map((x, i): [number, number] => [x, back[xs.length - 1 - i] - 0.02])]
    mesh(K, slab(outline, y - 0.045, y), m.solid)
    const lit: [number, number][] = [...xs.map((x, i): [number, number] => [x, back[i] + 0.255]), ...[...xs].reverse().map((x, i): [number, number] => [x, back[xs.length - 1 - i] + 0.235])]
    mesh(K, slab(lit, y - 0.05, y - 0.045), led, 0, 0, 0, false)
    return (x: number) => back[Math.round(((x - x0) / (x1 - x0)) * 17)] + 0.13
  }
  const top = shelf(1.97, -1.85, 0.2)
  const midS = shelf(1.6, -1.95, 1.75)
  const low = shelf(1.24, -1.95, -0.35)
  // The name, in lit letters on the hollow to the right of the top shelf.
  {
    const { p, n } = onNiche(1.02, 2.0)
    const c = document.createElement('canvas')
    c.width = 1024
    c.height = 256
    const cx = c.getContext('2d')!
    cx.fillStyle = '#ffffff'
    cx.textAlign = 'center'
    cx.textBaseline = 'middle'
    cx.font = '600 150px "Inter", "Helvetica Neue", Arial, sans-serif'
    cx.fillText('Pâtisserie', 512, 136)
    const sMat = signGlow.clone()
    sMat.userData.interior = true
    s.circuit.glows.push(sMat)
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    sMat.map = t
    sMat.emissiveMap = t
    const sign = mesh(K, new PlaneGeometry(1.0, 0.25), sMat, p.x + n.x * 0.09, p.y + n.y * 0.09, p.z + n.z * 0.09, false)
    sign.quaternion.copy(new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), n))
    info(s, sign, { title: 'The Pâtisserie', kind: 'Desserts & pastries · Kiosk G-05', body: 'A kiosk in mirror-polished steel, one flowing form from its rolled lip to the tail that sweeps up beside it, the hollow inside glowing like a lantern. The pâtisserie bakes upstairs each morning: macarons, éclairs, tartelettes, gâteaux by the slice, whole cakes and entremets to order, viennoiserie and biscuits. Take them away boxed, or sit at the tables beside the kiosk.', specs: ['Open 10 am – 10 pm', 'Cards, UPI and wallets', 'Custom cakes with 24 hours\' notice'] }, 0)
  }

  /* ---------- the shelves' goods ---------- */
  const jar = (x: number, y: number, z: number, h: number, kind: 'cookies' | 'meringues' | 'amaretti') => {
    const j = canister(m, K, x, y, z, 0.075, h, (cg, r, hh) => {
      if (kind === 'cookies') for (let i = 0; i < Math.floor(hh / 0.014); i++) cookie(m, cg, (i % 2 ? 0.006 : -0.006), 0.004 + i * 0.013, 0, (i % 3) * 0.05)
      else {
        const col = kind === 'meringues' ? ['#f6eadf', '#f2c9cf', '#d6e6c4'] : ['#d9a86a', '#e8c48f']
        for (let i = 0; i < 26; i++) {
          const a = i * 2.4
          const d = (i % 3) * r * 0.3
          const yy = 0.015 + Math.floor(i / 5) * (hh / 6.5)
          if (yy > hh - 0.02) break
          const o = mesh(cg, new SphereGeometry(kind === 'meringues' ? 0.017 : 0.016, 10, 8), m.food(kind === 'meringues' ? 'shell' : 'baked', col[i % col.length]), Math.cos(a) * d, yy, Math.sin(a) * d, false)
          o.scale.y = kind === 'meringues' ? 1.15 : 0.7
        }
      }
    }, i3(x) ? m.wood : m.gold)
    product(j, kind)
  }
  const i3 = (x: number) => Math.round(x * 10) % 2 === 0
  const boxStack = (x: number, y: number, z: number, n: number) => {
    const b = new Group()
    b.position.set(x, y, z)
    K.add(b)
    for (let i = 0; i < n; i++) {
      const w = 0.24 - i * 0.03
      k.box(b, w, 0.08, w * 0.8, i % 2 ? m.boxMint : m.boxPink, 0, 0.04 + i * 0.08, 0)
      k.box(b, 0.012, 0.081, w * 0.8 + 0.002, m.ribbon, 0, 0.04 + i * 0.08, 0, false)
      k.box(b, w + 0.002, 0.081, 0.012, m.ribbon, 0, 0.04 + i * 0.08, 0, false)
    }
    mesh(b, new TorusGeometry(0.018, 0.005, 6, 14), m.ribbon, 0.012, n * 0.08 + 0.006, 0, false).rotation.x = PI / 2
    mesh(b, new TorusGeometry(0.018, 0.005, 6, 14), m.ribbon, -0.012, n * 0.08 + 0.006, 0, false).rotation.x = PI / 2
    product(b, 'boxes')
  }
  const tower = (x: number, y: number, z: number, h: number, colours: string[]) => {
    const t = new Group()
    t.position.set(x, y, z)
    K.add(t)
    mesh(t, new CylinderGeometry(0.012, h * 0.32, h, 24), m.porcelain, 0, h / 2, 0, false)
    const rows = Math.round(h / 0.028)
    for (let r2 = 0; r2 < rows; r2++) {
      const yy = 0.02 + r2 * 0.028
      const rad = h * 0.32 * (1 - yy / h) + 0.02
      const n = Math.max(3, Math.round((rad * PI * 2) / 0.045))
      for (let i = 0; i < n; i++) {
        const a = (i / n) * PI * 2 + r2 * 0.4
        const mg = macaron(m, t, Math.cos(a) * rad, yy, Math.sin(a) * rad, colours[(i + r2) % colours.length], '#f6efe6', false)
        mg.rotation.set(0, -a + PI / 2, 0)
        mg.children.forEach((c) => (c.rotation.x += PI / 2))
      }
    }
    product(t, 'tower')
    return t
  }
  // Top shelf: canisters; middle: boxes and a macaron tower among loaf cakes; low: canisters of cookies.
  for (const [x, h, kind] of [[-1.6, 0.26, 'meringues'], [-1.32, 0.2, 'amaretti'], [-1.05, 0.26, 'cookies'], [-0.7, 0.2, 'meringues'], [-0.42, 0.26, 'amaretti'], [-0.1, 0.22, 'cookies']] as const) jar(x, 1.97, top(x), h, kind)
  boxStack(-1.65, 1.6, midS(-1.65), 3)
  boxStack(-0.9, 1.6, midS(-0.9), 2)
  tower(-0.35, 1.6, midS(-0.35), 0.3, ['#f2c9cf', '#d6e6c4', '#f3e3a6', '#cdbfe6'])
  boxStack(0.3, 1.6, midS(0.3), 3)
  for (const x of [0.85, 1.4]) {
    const loaf = new Group()
    loaf.position.set(x, 1.6, midS(x))
    K.add(loaf)
    for (let i = 0; i < 2; i++) {
      k.soft(loaf, 0.2, 0.07, 0.085, 0.015, m.food('sponge', i ? '#d9a35b' : '#6b3b22'), (i - 0.5) * 0.24, 0.035, 0)
      k.soft(loaf, 0.2, 0.012, 0.087, 0.005, m.food('glaze', i ? '#f4ead8' : '#2d170c'), (i - 0.5) * 0.24, 0.074, 0)
    }
    product(loaf, 'slices', ' Here: chocolate and lemon loaf cakes, sold whole or by the slice.')
  }
  for (const [x, kind] of [[-1.7, 'cookies'], [-1.4, 'amaretti'], [-1.1, 'cookies'], [-0.75, 'meringues']] as const) jar(x, 1.24, low(x), 0.24, kind)

  /* ---------- the counter ---------- */
  mesh(K, slab(counterOutline(-0.17), 0.02, 0.82, 0.17), m.chrome)
  {
    // The line of light under the white top, round the whole counter.
    const ol = counterOutline(0.005)
    const path = [...ol, ol[0]].map(([x, z]) => new Vector3(x, 0.835, z))
    const outs = path.map((v) => new Vector3(v.x - 0.0, 0, v.z - (ZB + 1.7) / 2).setY(0).normalize())
    mesh(K, ribbon(path, outs, 0.026, 0.004), led, 0, 0, 0, false)
  }
  mesh(K, slab(counterOutline(0.035), 0.85, 0.895), m.solid)
  // The plinth of honed stone under the right of the kiosk, lit along the counter's foot.
  k.box(K, 3.6, 0.12, 2.75, m.stone, 1.4, 0.06, 0.78)
  {
    const front = counterOutline(0.02).filter(([x, z]) => x > -0.35 && z > (ZB + 1.7) / 2 - 0.2)
    front.sort((a, b) => a[0] - b[0])
    const path = front.map(([x, z]) => new Vector3(x, 0.128, z))
    mesh(K, ribbon(path, path.map(() => new Vector3(0, 1, 0)), 0.03, 0.004), led, 0, 0, 0, false)
  }
  s.e.shade.rect(O.x - 1.3, Y + 0.13, O.z, 4.4, 0.8, PI / 2, 0.25)

  // The pâtisserie case: curved glass along the front, a glass top, lit inside.
  const CASE = { x0: -1.5, x1: 1.45, back: 1.25, y0: 0.895, y1: 1.2 }
  const zc = (x: number) => zf(x) - 0.07
  {
    const xs = Array.from({ length: 25 }, (_, i) => CASE.x0 + ((CASE.x1 - CASE.x0) * i) / 24)
    mesh(K, slab([...xs.map((x): [number, number] => [x, zc(x)]), [CASE.x1, CASE.back], [CASE.x0, CASE.back]], CASE.y0, CASE.y0 + 0.004), m.solid, 0, 0, 0, false)
    const panes = clickThrough(K, 'patisserie_case')
    mesh(panes.g, grid(xs.map((x): P3[] => [[x, CASE.y0, zc(x)], [x, CASE.y1, zc(x)]])), m.glass, 0, 0, 0, false).renderOrder = 2
    mesh(panes.g, slab([...xs.map((x): [number, number] => [x, zc(x)]), [CASE.x1, CASE.back], [CASE.x0, CASE.back]], CASE.y1, CASE.y1 + 0.008), m.glass, 0, 0, 0, false).renderOrder = 2
    for (const x of [CASE.x0, CASE.x1]) k.box(panes.g, 0.008, CASE.y1 - CASE.y0, zc(x) - CASE.back, m.glass, x, (CASE.y0 + CASE.y1) / 2, (zc(x) + CASE.back) / 2, false)
    panes.seal()
    const edge = (y: number) => xs.map((x) => new Vector3(x, y, zc(x)))
    for (const y of [CASE.y1 + 0.004]) mesh(K, ribbon(edge(y), edge(y).map(() => new Vector3(0, 0, 1)), 0.012, 0.012), m.chrome, 0, 0, 0, false)
    mesh(K, ribbon(edge(CASE.y1 - 0.012).map((v) => v.setZ(v.z - 0.05)), xs.map(() => new Vector3(0, 1, 0)), 0.02, 0.003), led, 0, 0, 0, false)
  }
  // Inside the case: trays along the front, cakes and tarts behind.
  const tray = (x: number, z: number, w: number, d: number) => {
    const t = new Group()
    t.position.set(x, CASE.y0 + 0.004, z)
    K.add(t)
    k.box(t, w, 0.008, d, m.porcelain, 0, 0.004, 0)
    return t
  }
  {
    const z = (x: number) => zc(x) - 0.12
    let t = tray(-1.22, z(-1.22), 0.46, 0.2)
    const mc: [string, string][] = [['#e8a0ae', '#f6d6dc'], ['#b9d39a', '#e9f0d5'], ['#f2e8cf', '#fbf5e8'], ['#5b3626', '#3b2015'], ['#f1e08a', '#fbf2c0'], ['#d9b3d6', '#f3e2f0'], ['#b08566', '#e8d4bf'], ['#8798c9', '#d8def0']]
    for (let i = 0; i < 16; i++) macaron(m, t, -0.19 + (i % 8) * 0.054, 0.008, -0.05 + Math.floor(i / 8) * 0.1, mc[i % 8][0], mc[i % 8][1])
    product(t, 'macarons')
    t = tray(-0.72, z(-0.72), 0.44, 0.2)
    for (const [i, c, d] of [[0, '#3a1f14', undefined], [1, '#6f4a2e', undefined], [2, '#b9772f', undefined], [3, '#f3e6cf', '#c4162e']] as const) eclair(m, t, -0.165 + i * 0.11, 0.008, 0, 0, c, d)
    product(t, 'eclairs')
    t = tray(-0.22, z(-0.22), 0.44, 0.2)
    for (const [i, f, tp, fr] of [[0, '#f6e7c4', 'fruit', '#c21d2c'], [1, '#f3e7a4', 'meringue', ''], [2, '#f2e2c8', 'berries', '#a3132c'], [3, '#f6e7c4', 'fruit', '#c21d2c']] as const) tart(m, t, -0.16 + i * 0.105, 0.008, 0, 0.042, f, tp, fr || undefined)
    product(t, 'tartlets')
    t = tray(0.29, z(0.29), 0.46, 0.2)
    const layers: [string, 'sponge' | 'cream' | 'glaze' | 'fruit', number][][] = [
      [['#5a3a22', 'sponge', 0.014], ['#9a6a42', 'cream', 0.01], ['#4d2f1c', 'sponge', 0.014], ['#9a6a42', 'cream', 0.01], ['#22140c', 'glaze', 0.006]],
      [['#9d1d2a', 'sponge', 0.02], ['#f3eee6', 'cream', 0.012], ['#9d1d2a', 'sponge', 0.02], ['#f3eee6', 'cream', 0.012]],
      [['#c9a46b', 'sponge', 0.012], ['#f4ecd9', 'cream', 0.045], ['#b71c2c', 'glaze', 0.005]],
      [['#e8d9b0', 'sponge', 0.016], ['#f1e2cf', 'cream', 0.02], ['#d23849', 'fruit', 0.01], ['#e8d9b0', 'sponge', 0.016], ['#f7f1ea', 'cream', 0.006]],
    ]
    layers.forEach((l, i) => slice(m, t, -0.17 + i * 0.112, 0.008, 0.0, PI / 2 + 0.25, 0.11, l, i === 3 ? '#c8202f' : undefined))
    product(t, 'slices')
    t = tray(0.8, z(0.8), 0.44, 0.2)
    for (let i = 0; i < 4; i++) cupcake(m, t, -0.15 + i * 0.1, 0.008, 0, ['#f1c6cd', '#cfe2b8', '#d8a76e', '#f6efe3'][i], m.gold)
    product(t, 'cupcakes')
    t = tray(1.24, z(1.24), 0.36, 0.2)
    for (let i = 0; i < 4; i++) croissant(m, t, -0.11 + (i % 2) * 0.13, 0.008, -0.04 + Math.floor(i / 2) * 0.09, i * 0.5)
    product(t, 'croissants')
    // Behind: two whole tarts, the fraisier, the forêt noire and the rose entremets.
    const bz = 1.36
    let b = tray(-1.2, bz, 0.26, 0.2)
    tart(m, b, 0, 0.008, 0, 0.1, '#f6e7c4', 'fruit', '#c21d2c')
    product(b, 'tarts')
    b = tray(-0.65, bz, 0.26, 0.2)
    cake(m, b, 0, 0.008, 0, 0.1, 0.08, '#f6efe4', 'cream', '#fbf6ee', '#c8202f')
    product(b, 'fraisier')
    b = tray(-0.1, bz, 0.26, 0.2)
    cake(m, b, 0, 0.008, 0, 0.1, 0.08, '#2a160d', 'glaze', '#f7f1e8', '#5c0b14')
    product(b, 'foret')
    b = tray(0.45, bz, 0.26, 0.2)
    cake(m, b, 0, 0.008, 0, 0.09, 0.075, '#e9a7b4', 'glaze', '#fbeff0', '#c21d2c', true)
    product(b, 'rose')
    b = tray(1.0, bz, 0.26, 0.2)
    tart(m, b, 0, 0.008, 0, 0.1, '#f3e7a4', 'meringue')
    product(b, 'tarts')
  }
  // On the counter: a cake under a cloche at the left, the till and card machine at the right.
  const cloched = (x: number, z: number, key: keyof typeof S, make: (p: Object3D, top: number) => void) => {
    const { g: st, top: h } = cakeStand(m, K, x, 0.895, z, 0.15, 0.13)
    make(st, h)
    const lid = live(st, `cloche_${key}`, 'patisserie')
    lid.position.y = h
    cloche(m, lid, 0.155, 0.2)
    lid.traverse((o) => {
      if ((o as Mesh).isMesh) o.castShadow = false
    })
    const hit = product(st, key, ' Tap again to lift the cloche.')
    if (hit)
      hit.userData.onTap = () => {
        const up = lid.position.y > h + 0.01
        const from = lid.position.y
        const to = up ? h : h + 0.16
        play({ dur: 0.8, step: (t) => (lid.position.y = from + (to - from) * (t * t * (3 - 2 * t))) }, lid)
      }
  }
  cloched(-1.78, 1.38, 'fraisier', (p, h) => cake(m, p, 0, h, 0, 0.1, 0.075, '#f6efe4', 'cream', '#fbf6ee', '#c8202f'))
  {
    // The till faces the customer at the right end: a screen on a steel stand, the card machine.
    const till = at(K, 1.82, 0.895, 1.42, 0.25)
    k.cyl(till, 0.06, 0.07, 0.012, m.steel, 0, 0.006, 0, 32)
    k.cyl(till, 0.011, 0.011, 0.18, m.steel, 0, 0.1, 0, 12)
    const head = at(till, 0, 0.24, 0, 0)
    head.rotation.x = -0.35
    k.soft(head, 0.26, 0.17, 0.012, 0.005, m.blackGloss, 0, 0, 0)
    const c = document.createElement('canvas')
    c.width = 384
    c.height = 256
    const cx = c.getContext('2d')!
    cx.fillStyle = '#faf6ef'
    cx.fillRect(0, 0, 384, 256)
    cx.fillStyle = '#c8a15f'
    cx.fillRect(0, 0, 384, 40)
    cx.fillStyle = '#ffffff'
    cx.font = '600 20px "Inter", Arial, sans-serif'
    cx.fillText('PÂTISSERIE · G-05', 16, 27)
    cx.fillStyle = '#3a2a1c'
    cx.textAlign = 'center'
    cx.font = '500 28px "Inter", Arial, sans-serif'
    cx.fillText('Tap to pay', 192, 140)
    cx.font = '400 16px "Inter", Arial, sans-serif'
    cx.fillText('Cards · UPI · Wallets', 192, 190)
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    const sm = new MeshStandardMaterial({ map: t, emissiveMap: t, emissive: '#ffffff', emissiveIntensity: 0.6, roughness: 0.3 })
    sm.userData.interior = true
    const btn = button(head, 'till', 'Till', 'Pay for your order', 0, 0, 0.007, () => useInfoStore.getState().show({ ...checkout(), place: `Ground Floor · ${s.u.name} (${s.u.id})` }), 'patisserie')
    mesh(btn, new PlaneGeometry(0.235, 0.15), sm, 0, 0, 0, false)
    const pin = at(K, 2.0, 0.895, 1.62, 0.4)
    k.soft(pin, 0.07, 0.017, 0.14, 0.008, m.blackMatte, 0, 0.009, 0)
    k.box(pin, 0.05, 0.001, 0.045, m.blackGloss, 0, 0.018, -0.03, false)
    info(s, pin, { title: 'Card Machine', kind: 'Payments', body: 'Tap a card or phone, insert a card, or scan the UPI code on the till.', specs: ['Contactless, chip and PIN', 'UPI, wallets'] }, 0)
  }
  // A macaron tower and a second cloche on the back of the counter, behind the case.
  tower(-0.3, 0.895, 1.1, 0.36, ['#f2c9cf', '#fbf3e4', '#d6e6c4', '#f3e3a6'])
  cloched(0.75, 1.1, 'rose', (p, h) => cake(m, p, 0, h, 0, 0.085, 0.07, '#e9a7b4', 'glaze', '#fbeff0', '#c21d2c', true))
  boxStack(1.35, 0.895, 1.08, 2)

  /* ---------- lamps ---------- */
  for (const [x, yy, z, i] of [[-0.9, 2.25, 0.7, 5], [1.0, 2.15, 0.7, 4.5], [0.0, 1.7, 2.6, 4]] as const) {
    const v = K.localToWorld(new Vector3(x, yy, z))
    s.g.worldToLocal(v)
    lamp(s, v.x, v.y, v.z, i, 5.5, '#ffe2bd')
  }

  /* ---------- the seating ---------- */
  seating(s, m, g, Y)

  setCircuit(s.circuit, true)
  return s
}

/* ---------- the seating ---------- */

function seating(s: Shop, m: DessertMaterials, g: Group, Y: number) {
  const { k } = s.e
  const face = -0.13
  // The banquette against the marble wall: a steel kick, the seat, a back of vertical channels.
  const len = 3.4
  const zc = -8.15
  const b = at(g, face, Y, zc, -PI / 2)
  k.box(b, len - 0.1, 0.08, 0.5, m.steel, 0, 0.04, 0.29)
  k.soft(b, len, 0.28, 0.6, 0.04, m.velvet, 0, 0.22, 0.31)
  k.soft(b, len - 0.03, 0.1, 0.57, 0.045, m.velvet, 0, 0.405, 0.33)
  k.box(b, len, 0.66, 0.05, m.velvet, 0, 0.78, 0.025)
  const n = Math.round(len / 0.2)
  for (let i = 0; i < n; i++) {
    const ch = k.soft(b, len / n - 0.008, 0.62, 0.12, 0.055, m.velvet, -len / 2 + (i + 0.5) * (len / n), 0.79, 0.1)
    ch.rotation.x = -0.1
  }
  for (const sx of [-1, 1]) k.soft(b, 0.07, 0.62, 0.62, 0.03, m.velvet, sx * (len / 2 + 0.03), 0.31, 0.3)
  s.e.shade.rect(face - 0.32, Y + 0.012, zc, 0.7, len + 0.1, 0, 0.4)
  info(s, b.children[1], { title: 'Banquette', kind: 'Seating', body: 'A channel-tufted banquette in mushroom velvet along the marble wall, on a polished steel kick: sit with your coffee and a slice.', specs: ['Cotton velvet, high-resilience foam', '3.4 m, seats six'] }, 0)
  // Three marble tables on polished steel pedestals, a tub chair facing each across it.
  const tables = [-9.2, -8.15, -7.1]
  tables.forEach((z, i) => {
    const x = -1.13
    const t = at(g, x, Y, z, 0)
    const ped: [number, number][] = [[0, 0], [0.22, 0], [0.22, 0.012], [0.07, 0.045], [0.034, 0.2], [0.03, 0.68], [0.08, 0.7], [0.08, 0.71], [0, 0.71]]
    mesh(t, new LatheGeometry(ped.map(([r, h]) => new Vector2(r, h)), 40), m.steel)
    mesh(t, new CylinderGeometry(0.31, 0.3, 0.03, 64), m.marble, 0, 0.725, 0)
    s.e.shade.pool(x, Y + 0.012, z, 0.3, 0.3, 0.4)
    // On the tables: a slice with a coffee, macarons, an éclair.
    if (i === 0) {
      plate(m, t, -0.08, 0.74, 0.05, 0.1)
      slice(m, t, -0.08, 0.755, 0.08, 0.6, 0.11, [['#5a3a22', 'sponge', 0.014], ['#9a6a42', 'cream', 0.01], ['#4d2f1c', 'sponge', 0.014], ['#22140c', 'glaze', 0.006]])
      coffeeCup(m, t, 0.13, 0.74, -0.08)
    } else if (i === 1) {
      plate(m, t, 0.0, 0.74, 0.0, 0.11)
      for (const [j, c] of ['#e8a0ae', '#b9d39a', '#f2e8cf'].entries()) macaron(m, t, -0.04 + j * 0.045, 0.756, 0.0, c, '#fbf3ea')
      coffeeCup(m, t, -0.15, 0.74, 0.12)
    } else {
      plate(m, t, 0.05, 0.74, 0.03, 0.1)
      eclair(m, t, 0.05, 0.756, 0.03, 0.4, '#3a1f14')
    }
    tubChair(s, m, g, -1.9, z, PI / 2)
  })
  info(s, g.children[g.children.length - 1], { title: 'Tub Chair', kind: 'Seating', body: 'A low tub chair in cream bouclé, its rounded back wrapping the seat, on slim polished steel legs.', specs: ['Wool bouclé', 'Seat height 48 cm'] }, 0)
  // Opal globe pendants over the tables, and a ficus at the end of the banquette.
  const ceil = Y + s.e.ceiling
  for (const z of tables) {
    k.cyl(g, 0.05, 0.05, 0.02, m.steel, -0.95, ceil - 0.01, z, 20)
    k.cyl(g, 0.004, 0.004, ceil - 0.01 - (Y + 2.22), m.steel, -0.95, (ceil + Y + 2.22) / 2, z, 6)
    k.cyl(g, 0.03, 0.04, 0.05, m.steel, -0.95, Y + 2.2, z, 20)
    mesh(g, new SphereGeometry(0.13, 32, 20), m.opal, -0.95, Y + 2.06, z, false)
  }
  lamp(s, -1.0, Y + 1.9, -8.15, 5, 5, '#ffe6c8')
  plantedFicus(s.e, g, -0.5, -5.95, 23, 'nero', 0.9)
}

/** A tub chair: four slim steel legs, a round upholstered seat, a curved back wrapping it. */
function tubChair(s: Shop, m: DessertMaterials, p: Object3D, x: number, z: number, yaw: number) {
  const { k } = s.e
  const c = at(p, x, s.y, z, yaw)
  for (const [lx, lz] of [[0.2, 0.2], [-0.2, 0.2], [0.2, -0.2], [-0.2, -0.2]]) {
    const leg = k.cyl(c, 0.012, 0.008, 0.24, m.steel, lx, 0.12, lz, 10)
    leg.rotation.set(lz * 0.25, 0, -lx * 0.25)
  }
  mesh(c, new CylinderGeometry(0.31, 0.3, 0.2, 40), m.boucle, 0, 0.33, 0)
  const cushion = mesh(c, new SphereGeometry(1, 32, 12, 0, PI * 2, 0, PI / 2), m.boucle, 0, 0.43, 0.02)
  cushion.scale.set(0.285, 0.06, 0.285)
  const a0 = PI - 1.9
  for (const [r, mat] of [[0.335, m.boucle], [0.27, m.boucle]] as const) mesh(c, new CylinderGeometry(r, r, 0.4, 40, 1, true, a0, 3.8), mat, 0, 0.62, 0)
  const arc = Array.from({ length: 24 }, (_, i) => {
    const a = a0 + (3.8 * i) / 23
    return new Vector3(Math.sin(a) * 0.3025, 0.82, Math.cos(a) * 0.3025)
  })
  mesh(c, new TubeGeometry(new CatmullRomCurve3(arc), 40, 0.034, 10, false), m.boucle)
  for (const a of [a0, a0 + 3.8]) {
    const v = new Vector3(Math.sin(a) * 0.3025, 0, Math.cos(a) * 0.3025)
    k.cyl(c, 0.034, 0.034, 0.4, m.boucle, v.x, 0.62, v.z, 12)
    mesh(c, new SphereGeometry(0.034, 12, 8), m.boucle, v.x, 0.82, v.z, false)
  }
  s.e.shade.pool(x, s.y + 0.012, z, 0.33, 0.33, 0.35)
  return c
}
