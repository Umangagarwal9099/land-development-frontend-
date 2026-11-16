import { BoxGeometry, BufferGeometry, CircleGeometry, CylinderGeometry, DoubleSide, ExtrudeGeometry, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, Shape, SphereGeometry, TorusGeometry, Vector3, type Material, type Object3D } from 'three'
import { circuit, setCircuit, switchPlate } from '../../../kalakalD65/fixtures'
import { rng } from '../../../textures'
import { monstera, planter } from '../plants'
import { clipped, inside, type FloorCtx } from '../shell'
import type { Unit } from '../units'
import { beautyMaterials, HOUSE, type LabelSpec } from './beautyArt'
import {
  brushCup, cleanser, compact, concealer, creamJar, eyeliner, foundation, giftBox, lipGloss, lipstick, mascara, mistOn, nailPolish, palette, perfume, perfumeBox, pumpBottle, serum, toner, type FlaconStyle,
} from './beauty'
import { button, info, lathe, play, tube } from './cafe'
import { trackSpots } from './goods'
import { at, box, flat, lamp, mesh, onCircuit, openShop, pane, PI, swingLeaf } from './kit'

/*
 * Rosé Atelier, unit G-07: a beauty boutique off the rear gallery, facing the foot of the up
 * escalators. Built from the reference, looking in from the door:
 *
 *   left      a round column in blush limewash, its curved shelves wrapping it (blush and cream,
 *             each lit along its edge, a sage ring at the top) over a sage base cabinet with a pale
 *             stone top: fragrance and its boxes, terracotta jugs, bowls, gold vessels, books
 *   ahead     the cream table on an arch and a drum, the makeup bar: lipsticks in a tiered stand,
 *             glosses, palettes and compacts open, mascaras, liners, brushes, foundations
 *   back      cream plaster with floating shelves of skincare, fragrance and gift sets (the top
 *             one blush and wavy), over blush drawer cabinets that wrap round the corner; a
 *             brass bar pendant of globes over them
 *   left back the round mirror over a blush cabinet with pampas, globe pendants before it
 *   right     the round blush counter with a marble top, for consultations and testing; a
 *             monstera and a fern in white planters; the nail bar on the cabinet behind
 *   above     a cream ceiling with an organic recess, its cove lit, track spots, a linear slot,
 *             opal globe pendants on brass; below, cream terrazzo with a warmer circle round the
 *             column inlaid in brass, a round jute rug
 *
 * Every product explains itself when tapped (its name, shade, size, price); the testers work (the
 * fragrance atomisers spray, the lipstick testers twist up, the shade finder matches a shade, the
 * vanity mirror lights); compacts, palettes and every drawer open; the doors open; two switches by
 * the door work the boutique's lights and its display lighting.
 */

const L = 7.825
const R = 11.425
const BACK = -16.525
const FZ = -9.0
const H = 3.55
const COL = { x: 8.2, z: -11.15, r: 0.36 }
const TABLE = { x: 9.65, z: -13.7 }
const COUNTER = { x: 10.65, z: -10.9 }

type Card = { title: string; kind: string; body: string; specs: string[] }
/** The hit volume of a small control (a tester's atomiser): unseen, but tappable. */
const HIT = new MeshBasicMaterial({ visible: false })

export function buildCosmetics(e: FloorCtx, u: Unit) {
  const s = openShop(e, u)
  const { k, lux, m: mm } = e
  const { g, y: Y } = s
  const b = beautyMaterials(e)
  const soffit = e.soffit

  // Two circuits: the boutique's lights, and its display lighting (shelf edges, the cove).
  const display = circuit()
  const led = onCircuit(s, lux.led as MeshStandardMaterial)
  const opal = onCircuit(s, lux.opal as MeshStandardMaterial)
  const glow = (mat: MeshStandardMaterial) => {
    const n = mat.clone()
    n.userData.interior = true
    display.glows.push(n)
    return n
  }
  const shelfLed = glow(lux.led as MeshStandardMaterial)
  const coveGlow = glow(s.m.backlit('#fff1e4', 0.22))

  /** A product: built, then given its card (a tight volume, so neighbours keep theirs). */
  const product = <T extends Object3D>(o: T, card: Card) => {
    info(s, o, card, 0.004)
    return o
  }

  /* ---------- floor: terrazzo, the warm circle round the column, the rug ---------- */
  const outline = clipped(e, u.rects[0])
  flat(g, outline, Y + 0.006, b.terrazzo, false, [], 'beauty_floor')
  const circle = (cx: number, cz: number, r: number, n = 72): [number, number][] =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * PI * 2
      return [Math.max(L, cx + Math.cos(a) * r), Math.min(FZ - 0.02, cz + Math.sin(a) * r)] as [number, number]
    })
  flat(g, circle(COL.x, COL.z, 1.45), Y + 0.0072, b.terrazzoWarm, false, [], 'beauty_inlay')
  {
    // The brass line round it.
    const ringPts = circle(COL.x, COL.z, 1.45, 96).filter(([x, z]) => x > L + 0.01 && z < FZ - 0.03)
    for (let i = 0; i + 1 < ringPts.length; i++) {
      const [x0, z0] = ringPts[i]
      const [x1, z1] = ringPts[i + 1]
      if (Math.hypot(x1 - x0, z1 - z0) > 0.3) continue
      const seg = at(g, (x0 + x1) / 2, Y + 0.0078, (z0 + z1) / 2, Math.atan2(x1 - x0, z1 - z0))
      k.box(seg, 0.008, 0.002, Math.hypot(x1 - x0, z1 - z0) + 0.002, b.brass, 0, 0, 0, false)
    }
  }
  const rug = mesh(g, new CircleGeometry(0.72, 64), b.jute, 9.75, Y + 0.012, -10.75, false)
  rug.rotation.x = -PI / 2
  k.cyl(g, 0.72, 0.72, 0.008, b.jute, 9.75, Y + 0.006, -10.75, 64)

  /* ---------- walls ---------- */
  k.box(g, 0.02, H, FZ - BACK, b.pinkPlaster, L + 0.01, Y + H / 2, (BACK + FZ) / 2, false)
  k.box(g, 0.02, H, FZ - BACK, b.creamPlaster, R - 0.01, Y + H / 2, (BACK + FZ) / 2, false)
  k.box(g, R - L, H, 0.02, b.creamPlaster, (L + R) / 2, Y + H / 2, BACK + 0.01, false)
  for (const [x0, z0, x1, z1] of [[L + 0.02, FZ, L + 0.02, BACK], [R - 0.02, FZ, R - 0.02, BACK], [L, BACK + 0.02, R, BACK + 0.02]] as const) e.shade.foot(x0, z0, x1, z1, Y + 0.01, 0.2, 0.22)

  /* ---------- the front on z = −9.0: blush fascia, brass-framed glass, doors standing open ---------- */
  box(s, L - 0.075, R + 0.075, Y + 4.2, soffit, FZ - 0.075, FZ + 0.075, mm.wallPaint)
  {
    const f0 = FZ + 0.02
    const f1 = FZ + 0.26
    k.box(g, R - L + 0.15, 0.9, f1 - f0, b.pinkPlaster, (L + R) / 2, Y + 3.75, (f0 + f1) / 2)
    for (const yy of [3.3, 4.19]) k.box(g, R - L + 0.16, 0.012, 0.012, b.brass, (L + R) / 2, Y + yy, f1 + 0.003, false)
    const t = b.canvas(1024, 192, (cx, w, h) => {
      cx.clearRect(0, 0, w, h)
      cx.fillStyle = '#ffffff'
      cx.textAlign = 'center'
      cx.textBaseline = 'middle'
      cx.font = `500 ${Math.round(h * 0.5)}px "Cormorant Garamond", "Playfair Display", Georgia, serif`
      const word = HOUSE
      const sp = h * 0.1
      let x = w / 2 - (cx.measureText(word).width + sp * (word.length - 1)) / 2
      cx.textAlign = 'left'
      for (const ch of word) {
        cx.fillText(ch, x, h * 0.4)
        x += cx.measureText(ch).width + sp
      }
      cx.textAlign = 'center'
      cx.font = `600 ${Math.round(h * 0.13)}px "Inter", Arial, sans-serif`
      cx.fillText('B E A U T Y   ·   S K I N C A R E   ·   F R A G R A N C E', w / 2, h * 0.84)
    })
    const name = new MeshStandardMaterial({ map: t, color: '#c9a35c', emissiveMap: t, emissive: '#b8924c', emissiveIntensity: 0.35, metalness: 0.7, roughness: 0.3, alphaTest: 0.5 })
    name.userData.interior = true
    const q = new Mesh(new BufferGeometry(), name)
    q.geometry.setAttribute('position', new Float32BufferAttribute([-1.5, -0.28, 0, 1.5, -0.28, 0, 1.5, 0.28, 0, -1.5, 0.28, 0], 3))
    q.geometry.setAttribute('normal', new Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], 3))
    q.geometry.setAttribute('uv', new Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2))
    q.geometry.setIndex([0, 1, 2, 0, 2, 3])
    q.position.set((L + R) / 2, Y + 3.76, f1 + 0.004)
    g.add(q)
  }
  // Blush pilasters, brass mullions, the glass, the doors.
  for (const [a, c2] of [[L - 0.075, 7.98], [11.27, R + 0.075]] as const) k.box(g, c2 - a, 3.3, 0.2, b.pinkPlaster, (a + c2) / 2, Y + 1.65, FZ + 0.02)
  for (const xx of [8.0, 8.6, 10.65, 11.25]) box(s, xx - 0.022, xx + 0.022, Y, Y + 3.3, FZ - 0.03, FZ + 0.03, b.brass)
  box(s, 7.98, 11.27, Y + 3.26, Y + 3.32, FZ - 0.035, FZ + 0.035, b.brass)
  box(s, 8.6, 10.65, Y + 2.7, Y + 2.75, FZ - 0.035, FZ + 0.035, b.brass)
  box(s, 7.98, 8.6, Y, Y + 0.05, FZ - 0.03, FZ + 0.03, b.brass)
  box(s, 10.65, 11.27, Y, Y + 0.05, FZ - 0.03, FZ + 0.03, b.brass)
  pane(s, g, 8.025, FZ, 8.575, FZ, Y + 0.05, Y + 3.26)
  pane(s, g, 10.675, FZ, 11.225, FZ, Y + 0.05, Y + 3.26)
  pane(s, g, 8.625, FZ, 10.625, FZ, Y + 2.75, Y + 3.26)
  swingLeaf(s, at(g, 8.625, Y, FZ, 0), 'beauty_l', 0.995, 2.68, b.brass, PI / 2, true)
  swingLeaf(s, at(g, 10.625, Y, FZ, PI), 'beauty_r', 0.995, 2.68, b.brass, -PI / 2, true)
  box(s, 8.6, 10.65, Y, Y + 0.006, FZ - 0.1, FZ + 0.1, b.brass, false)

  /* ---------- the ceiling: cream plaster, the organic recess and its cove ---------- */
  const cloud: [number, number][] = Array.from({ length: 96 }, (_, i) => {
    const t = (i / 96) * PI * 2
    const rx = 1.05 * (1 + 0.1 * Math.sin(3 * t + 0.6))
    const rz = 2.7 * (1 + 0.12 * Math.sin(2 * t + 1.1) + 0.05 * Math.sin(5 * t))
    return [9.85 + Math.cos(t) * rx, -13.0 + Math.sin(t) * rz] as [number, number]
  })
  flat(g, outline, Y + H, b.ceilingPlaster, true, [cloud], 'beauty_ceiling')
  {
    const up = 0.3
    flat(g, cloud, Y + H + up, coveGlow, true, [], 'beauty_recess')
    // The upstand round it, and the hidden line of light along its foot.
    const ribbon = (poly: [number, number][], y0: number, y1: number, mat: Material) => {
      const pos: number[] = []
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i]
        const c2 = poly[(i + 1) % poly.length]
        pos.push(a[0], y0, a[1], c2[0], y0, c2[1], c2[0], y1, c2[1], a[0], y0, a[1], c2[0], y1, c2[1], a[0], y1, a[1])
      }
      const geo = new BufferGeometry()
      geo.setAttribute('position', new Float32BufferAttribute(pos, 3))
      geo.computeVertexNormals()
      const o = new Mesh(geo, mat)
      ;(o.material as Material).side = DoubleSide
      g.add(o)
      return o
    }
    ribbon(cloud, Y + H, Y + H + up, b.creamPlaster)
    const inner = cloud.map(([x, z]) => [9.85 + (x - 9.85) * 1.03, -13.0 + (z + 13.0) * 1.01] as [number, number])
    ribbon(inner, Y + H + 0.02, Y + H + 0.05, shelfLed)
  }
  // The linear slot over the front, the track of spots down the right.
  k.box(g, 2.3, 0.004, 0.05, b.blackMatte, 9.95, Y + H - 0.002, -9.55, false)
  for (const dz of [-0.032, 0.032]) k.box(g, 2.32, 0.006, 0.012, b.whiteMatte, 9.95, Y + H - 0.003, -9.55 + dz, false)
  trackSpots(s, g, 11.05, -15.9, 11.05, -9.9, Y + H, 6, led, -PI / 2, 0.5)
  trackSpots(s, g, 8.6, -16.0, 8.6, -12.6, Y + H, 3, led, PI / 2, 0.55)

  /* ---------- pendants ---------- */
  /** The ceiling over a point: the recess inside the cloud, the flat ceiling elsewhere. */
  const ceilAt = (x: number, z: number) => (inside(cloud, x, z) ? Y + H + 0.3 : Y + H)
  const globe = (x: number, z: number, drop: number, r: number) => {
    const yy = Y + H - drop
    const top = ceilAt(x, z)
    k.cyl(g, 0.035, 0.035, 0.012, b.brass, x, top - 0.006, z, 20)
    k.cyl(g, 0.002, 0.002, top - yy - r, b.blackMatte, x, (top + yy + r) / 2, z, 6)
    k.cyl(g, r * 0.32, r * 0.36, 0.04, b.brass, x, yy + r + 0.01, z, 20)
    mesh(g, new SphereGeometry(r, 32, 20), opal, x, yy, z, false)
  }
  globe(COUNTER.x - 0.1, COUNTER.z - 0.2, 1.05, 0.15)
  globe(COUNTER.x + 0.2, COUNTER.z + 0.25, 1.35, 0.11)
  globe(TABLE.x, TABLE.z + 0.55, 1.2, 0.13)
  globe(TABLE.x, TABLE.z - 0.55, 1.45, 0.11)
  globe(8.5, -13.75, 1.3, 0.08)
  globe(8.65, -15.1, 1.05, 0.08)
  {
    // The brass cone pendant by the mirror.
    const x = 8.95
    const z = -12.75
    const yy = Y + H - 1.15
    k.cyl(g, 0.002, 0.002, ceilAt(x, z) - yy - 0.16, b.blackMatte, x, (ceilAt(x, z) + yy + 0.16) / 2, z, 6)
    lathe(g, [[0.008, 0.16], [0.12, 0.0], [0.118, -0.004], [0.006, 0.156]], b.brass, x, yy, z, 32)
    mesh(g, new SphereGeometry(0.04, 16, 10), opal, x, yy + 0.01, z, false)
  }
  {
    // A brass bar over the back shelves on two rods, three small globes hung from it.
    const z = BACK + 0.55
    const yy = Y + 2.62
    const bar = mesh(g, new CylinderGeometry(0.008, 0.008, 1.5, 12), b.brass, 9.9, yy, z)
    bar.rotation.z = PI / 2
    for (const dx of [-0.7, 0.7]) k.cyl(g, 0.002, 0.002, ceilAt(9.9 + dx, z) - yy, b.blackMatte, 9.9 + dx, (ceilAt(9.9 + dx, z) + yy) / 2, z, 6)
    for (const dx of [-0.55, 0, 0.55]) {
      k.cyl(g, 0.012, 0.012, 0.05, b.brass, 9.9 + dx, yy - 0.03, z, 12)
      mesh(g, new SphereGeometry(0.05, 20, 14), opal, 9.9 + dx, yy - 0.09, z, false)
    }
  }

  /* ---------- the column and its curved shelves ---------- */
  /** A ring of shelf round the column, from the wall round to the wall again: `ri` to `ro`, `t` thick, top at y. */
  const ringShelf = (ri: number, ro: number, y: number, t: number, mat: Material, edgeLed = true) => {
    const reach = Math.acos(Math.max(-1, Math.min(1, (L + 0.005 - COL.x) / ro)))
    const reachIn = Math.acos(Math.max(-1, Math.min(1, (L + 0.005 - COL.x) / ri)))
    const shape = new Shape()
    const n = 48
    for (let i = 0; i <= n; i++) {
      const a = -reach + (2 * reach * i) / n
      const px = Math.cos(a) * ro
      const pz = Math.sin(a) * ro
      if (i === 0) shape.moveTo(px, -pz)
      else shape.lineTo(px, -pz)
    }
    for (let i = n; i >= 0; i--) {
      const a = -reachIn + (2 * reachIn * i) / n
      shape.lineTo(Math.cos(a) * ri, -Math.sin(a) * ri)
    }
    const geo = new ExtrudeGeometry(shape, { depth: t, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 4 })
    geo.rotateX(-PI / 2)
    const o = mesh(g, geo, mat, COL.x, y - t, COL.z)
    if (edgeLed) {
      const strip = mesh(g, new CylinderGeometry(ro - 0.02, ro - 0.02, 0.006, 64, 1, true, PI / 2 - reach, 2 * reach), shelfLed, COL.x, y - t - 0.009, COL.z, false)
      ;(strip.material as Material).side = DoubleSide
    }
    return o
  }
  k.cyl(g, COL.r, COL.r, H, b.pinkPlaster, COL.x, Y + H / 2, COL.z, 48)
  // Its head lit where it meets the ceiling.
  mesh(g, new TorusGeometry(COL.r + 0.01, 0.008, 6, 48), shelfLed, COL.x, Y + H - 0.02, COL.z, false).rotation.x = PI / 2
  // The sage base cabinet, its stone top, the joints of its curved doors.
  const base = new Group()
  g.add(base)
  {
    const reach = Math.acos((L + 0.005 - COL.x) / 0.95)
    const drum = mesh(base, new CylinderGeometry(0.95, 0.95, 0.8, 64, 1, true, PI / 2 - reach, 2 * reach), b.sage, COL.x, Y + 0.1 + 0.4, COL.z)
    ;(drum.material as Material).side = DoubleSide
    mesh(base, new CylinderGeometry(0.91, 0.91, 0.1, 64, 1, true, PI / 2 - reach, 2 * reach), b.blackMatte, COL.x, Y + 0.05, COL.z)
    for (let i = 1; i < 5; i++) {
      const a = -reach + (2 * reach * i) / 5
      const j = at(base, COL.x + Math.cos(a) * 0.951, Y + 0.5, COL.z + Math.sin(a) * 0.951, Math.atan2(Math.cos(a), Math.sin(a)))
      k.box(j, 0.004, 0.78, 0.002, b.blackMatte, 0, 0, 0, false)
    }
  }
  ringShelf(COL.r, 0.97, Y + 0.93, 0.03, b.marble, false)
  info(s, base, {
    title: 'Column Display', kind: 'Feature fixture',
    body: 'The boutique\'s centrepiece: a round column in blush limewash wrapped by curved shelves, each lit along its edge, a sage ring at the top, over a curved sage cabinet with a pale marble top. Fragrance and its boxes on the lower shelf, the house\'s ceramics above.',
    specs: ['Shelves in lacquered MDF on concealed steel', 'Warm-white LED under every edge', 'Statuario top on the base'],
  }, 0)
  const tiers = [
    { y: 1.3, ro: 0.78, mat: b.blush },
    { y: 1.72, ro: 0.82, mat: b.cream },
    { y: 2.14, ro: 0.86, mat: b.blush },
    { y: 2.62, ro: 0.92, mat: b.sage },
  ]
  for (const t of tiers) ringShelf(COL.r, t.ro, Y + t.y, 0.045, t.mat)
  /** A spot on a column shelf: at angle a (0 faces +x), radius r. */
  const onCol = (a: number, r: number): [number, number] => [COL.x + Math.cos(a) * r, COL.z + Math.sin(a) * r]
  const faceOut = (a: number) => Math.atan2(Math.cos(a), Math.sin(a))

  /* ---------- decor ---------- */
  const vase = (p: Object3D, x: number, y: number, z: number, mat: Material, h: number, wide: number) =>
    lathe(p, [[0.001, 0], [wide * 0.6, 0], [wide, h * 0.35], [wide * 0.85, h * 0.7], [wide * 0.35, h * 0.88], [wide * 0.38, h], [wide * 0.32, h], [0.001, h * 0.2]], mat, x, y, z, 32)
  const jug = (p: Object3D, x: number, y: number, z: number, yaw: number, h: number) => {
    const j = at(p, x, y, z, yaw)
    vase(j, 0, 0, 0, b.terracotta, h, h * 0.36)
    const hd = mesh(j, new TorusGeometry(h * 0.18, h * 0.025, 8, 18, PI * 1.2), b.terracotta, h * 0.3, h * 0.62, 0)
    hd.rotation.z = -PI / 2 - 0.3
    return j
  }
  const bowl = (p: Object3D, x: number, y: number, z: number, r: number, mat: Material) =>
    lathe(p, [[0.001, 0], [r * 0.45, 0], [r * 0.5, 0.01], [r, r * 0.42], [r * 0.95, r * 0.44], [r * 0.46, r * 0.04], [0.001, r * 0.04]], mat, x, y, z, 40)
  const goldPot = (p: Object3D, x: number, y: number, z: number, r: number, h: number) => lathe(p, [[0.001, 0], [r, 0], [r, h], [r - 0.004, h], [r - 0.004, 0.006], [0.001, 0.006]], b.gold, x, y, z, 32)
  const books = (p: Object3D, x: number, y: number, z: number, yaw: number, n: number, seed: number) => {
    const r = rng(seed)
    const cols = ['#e7d6c6', '#c98a6b', '#8fa08a', '#f1ebe2', '#2f3a3a']
    const st = at(p, x, y, z, yaw)
    let hh = 0
    for (let i = 0; i < n; i++) {
      const th = 0.02 + r() * 0.015
      const bk = k.box(st, 0.2 - i * 0.01, th, 0.15 - i * 0.008, b.shade(cols[Math.floor(r() * cols.length)], 0.8), 0, hh + th / 2, 0)
      bk.rotation.y = (r() - 0.5) * 0.15
      k.box(st, 0.19 - i * 0.01, th - 0.004, 0.0015, b.paper, 0, hh + th / 2, (0.15 - i * 0.008) / 2 + 0.0008, false)
      hh += th
    }
    return st
  }
  const frame = (p: Object3D, x: number, y: number, z: number, yaw: number, w: number, h: number, art: number, lean = 0.08) => {
    const f = at(p, x, y, z, yaw)
    f.rotation.x = -lean
    k.box(f, w, h, 0.018, b.ivory, 0, h / 2, 0)
    const pic = mesh(f, new CircleGeometry(1, 4), b.prints[art % b.prints.length], 0, h / 2, 0.0095, false)
    pic.rotation.z = PI / 4
    pic.scale.set((w - 0.04) / Math.SQRT2, (h - 0.04) / Math.SQRT2, 1)
    return f
  }
  const pampas = (p: Object3D, x: number, y: number, z: number, h: number, seed: number) => {
    const r = rng(seed)
    const v = at(p, x, y, z, 0)
    vase(v, 0, 0, 0, b.clayPink, 0.3, 0.09)
    for (let i = 0; i < 11; i++) {
      const a = r() * PI * 2
      const lean = 0.15 + r() * 0.35
      const len = h * (0.65 + r() * 0.35)
      const dir = new Vector3(Math.cos(a) * lean, 1, Math.sin(a) * lean).normalize()
      const tip: [number, number, number] = [dir.x * len, 0.28 + dir.y * len, dir.z * len]
      tube(v, [0, 0.26, 0], tip, 0.003, b.driedDark, 5)
      const plume = k.sphere(v, 0.045, i % 3 ? b.dried : b.driedDark, tip[0], tip[1], tip[2])
      plume.scale.set(0.55, 2.4, 0.55)
      plume.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dir)
    }
    return v
  }
  /**
   * A Boston fern: thirty-odd fronds arching out of the pot and falling over its rim, each a
   * rachis carrying pairs of lance-shaped leaflets that shorten towards its tip.
   */
  const fern = (x: number, z: number, scale: number, seed: number, onFloor = true, y0 = Y) => {
    const r = rng(seed)
    const soil = onFloor ? planter(e, g, x, z, 0.24 * scale, 0.42 * scale, 'white') : y0
    const pos: number[] = []
    const fronds = 34
    for (let f = 0; f < fronds; f++) {
      const a = (f / fronds) * PI * 2 + r() * 0.25
      const rise = 0.25 + r() * 0.5
      const len = (0.4 + r() * 0.25) * scale
      const n = 22
      let prev: [number, number, number] | null = null
      for (let i = 0; i <= n; i++) {
        const t = i / n
        const along = t * len
        const px = x + Math.cos(a) * along
        const pz = z + Math.sin(a) * along
        const py = soil + 0.02 + (Math.sin(t * PI * 0.9) * rise - t * t * 0.55) * len
        if (prev && i > 1) {
          const leaf = 0.055 * scale * (1 - t * 0.75)
          const wide = 0.011 * scale * (1 - t * 0.5)
          for (const side of [-1, 1]) {
            const lx = -Math.sin(a) * side
            const lz = Math.cos(a) * side
            // A leaflet: from the rachis out and a little forward, drooping at its tip, as two triangles.
            const tipx = px + lx * leaf + Math.cos(a) * leaf * 0.35
            const tipz = pz + lz * leaf + Math.sin(a) * leaf * 0.35
            const tipy = py - leaf * 0.3
            const fx = Math.cos(a) * wide
            const fz = Math.sin(a) * wide
            pos.push(px - fx, py, pz - fz, tipx, tipy, tipz, px + fx, py, pz + fz)
            pos.push(px + fx, py, pz + fz, tipx, tipy, tipz, px + lx * leaf * 0.5 + fx, py - leaf * 0.12, pz + lz * leaf * 0.5 + fz)
          }
          // The rachis itself, a thin ribbon.
          pos.push(prev[0], prev[1], prev[2], px, py, pz, px, py + 0.003, pz)
        }
        prev = [px, py, pz]
      }
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute(pos, 3))
    geo.computeVertexNormals()
    const o = new Mesh(geo, b.fern)
    o.castShadow = true
    o.receiveShadow = true
    g.add(o)
  }

  /* ---------- the catalogue ---------- */
  const lab = (name: string, line: string, ground = '#f4ece4', ink = '#6b4a3e'): LabelSpec => ({ name, line, ground, ink })
  const LIP: [string, string][] = [['Rosewood', '#8e4a4f'], ['Bare Petal', '#c98b80'], ['Terracotta', '#a8513b'], ['Rouge Atelier', '#a3202e'], ['Mauve Silk', '#9b6574'], ['Nude Linen', '#c49a86'], ['Fig', '#6b2f3a'], ['Coral Bloom', '#d8644f'], ['Cinnamon', '#93533b'], ['Pink Clay', '#d48d8a']]
  const lipMat = LIP.map(([, c]) => b.shade(c, 0.35))
  const SKIN: [string, string][] = [['01 Porcelain', '#f1d6c3'], ['03 Ivory', '#e8c7ab'], ['05 Sand', '#d9b08c'], ['07 Honey', '#c69467'], ['09 Caramel', '#a9744c'], ['11 Cocoa', '#7b5137']]
  const skinMat = SKIN.map(([, c]) => b.liquid(c, 0.95))
  const NAIL: [string, string][] = [['Ballet', '#f1d3cf'], ['Blush', '#e6aaa4'], ['Rose Clay', '#c27d70'], ['Rouge', '#a3202e'], ['Plum', '#5d2338'], ['Sage', '#a9b9a1'], ['Sand', '#d8c1a3'], ['Terracotta', '#b3583c'], ['Noir', '#1d1a1c'], ['Coral', '#e0705a'], ['Lilac', '#c6b1cf'], ['Pearl', '#f2ece4']]

  /* ---------- the column's shelves, dressed ---------- */
  {
    // Base top: bowls, books, a white bud vase, a compact pair.
    const yb = Y + 0.93
    const [bx1, bz1] = onCol(0.3, 0.68)
    books(g, bx1, yb, bz1, faceOut(0.3), 2, 3)
    bowl(g, bx1, yb + 0.045, bz1, 0.08, b.clayPink)
    const [bx2, bz2] = onCol(-0.55, 0.7)
    bowl(g, bx2, yb, bz2, 0.11, b.ceramicWhite)
    const [bx3, bz3] = onCol(1.15, 0.66)
    bowl(g, bx3, yb, bz3, 0.1, b.clayPink)
    const [bx4, bz4] = onCol(-1.25, 0.62)
    vase(g, bx4, yb, bz4, b.ceramicWhite, 0.2, 0.05)
    const [bx5, bz5] = onCol(0.85, 0.7)
    vase(g, bx5, yb, bz5, b.ceramicWhite, 0.14, 0.045)
    // Shelf 1: fragrance and its boxes, as the reference shows them.
    const y1 = Y + tiers[0].y
    const fr: [FlaconStyle, string, string, string, number][] = [
      ['block', 'Rose Absolue', '#e9b3a4', 'Eau de parfum · 50 ml', 7950],
      ['round', 'Ambre Nu', '#d7a25c', 'Eau de parfum · 75 ml', 8950],
      ['tall', 'Fig & Cedar', '#b89c74', 'Eau de parfum · 50 ml', 7450],
      ['block', 'Néroli Blanc', '#efe3c2', 'Eau de toilette · 50 ml', 6450],
    ]
    const angs = [-1.3, -0.65, 0.05, 0.75]
    fr.forEach(([style, nm, col, line, price], i) => {
      const a = angs[i]
      const [px, pz] = onCol(a, 0.58)
      product(perfume(s, b, g, style, px, y1, pz, faceOut(a), b.liquid(col, 0.75), lab(nm, line)), {
        title: `${nm}`, kind: 'Fragrance · ' + line.split(' · ')[0],
        body: `${nm} by ${HOUSE}: ${['a velvet rose over pink pepper and suede', 'warm amber, vanilla bean and sandalwood skin', 'green fig leaf over cedar and cardamom', 'bright neroli, orange blossom and white musk'][i]}. ${line.split(' · ')[1]}, ₹ ${price.toLocaleString('en-IN')}.`,
        specs: ['Hand-finished glass flacon, gold cap', 'Long-lasting: 6–8 hours', 'Testers at the consultation counter'],
      })
      const [qx, qz] = onCol(a + 0.32, 0.6)
      const board = [b.blush, b.ivory, b.sage, b.cream][i]
      product(perfumeBox(s, b, g, qx, y1, qz, faceOut(a + 0.32), 0.07, 0.12, 0.05, board, lab(nm, 'Eau de parfum', '#f4ece4')), {
        title: `${nm} · Gift Box`, kind: 'Fragrance · Boxed', body: `${nm} in its box, sealed, ready to give: the flacon nested in a moulded board insert.`, specs: ['Recyclable board, foil-blocked', 'Gift wrapping on request'],
      })
    })
    // Shelf 2: the terracotta jug, bowls, a candle.
    const y2 = Y + tiers[1].y
    const [jx, jz] = onCol(-0.2, 0.6)
    jug(g, jx, y2, jz, faceOut(-0.2) + 0.5, 0.26)
    const [cx2, cz2] = onCol(0.55, 0.62)
    bowl(g, cx2, y2, cz2, 0.1, b.terracotta)
    const [cx3, cz3] = onCol(-0.95, 0.6)
    goldPot(g, cx3, y2, cz3, 0.035, 0.14)
    const [cx4, cz4] = onCol(1.2, 0.58)
    const candle = at(g, cx4, y2, cz4, 0)
    lathe(candle, [[0.001, 0], [0.045, 0], [0.045, 0.09], [0.041, 0.09], [0.041, 0.006], [0.001, 0.006]], b.amberGlass, 0, 0, 0, 28, false)
    k.cyl(candle, 0.04, 0.04, 0.06, b.ivory, 0, 0.035, 0, 24)
    product(candle, { title: 'Bois de Rose Candle', kind: 'Home fragrance', body: 'A scented candle of rosewood, cedar and soft amber in amber glass: 50 hours of burn. ₹ 3,450.', specs: ['200 g soy and coconut wax', 'Cotton wick'] })
    // Shelf 3: a gold cylinder, a white vase, gold cups.
    const y3 = Y + tiers[2].y
    const [gx, gz] = onCol(-0.9, 0.62)
    goldPot(g, gx, y3, gz, 0.05, 0.24)
    const [wx, wz] = onCol(0.0, 0.62)
    vase(g, wx, y3, wz, b.ceramicWhite, 0.24, 0.085)
    for (const a of [0.65, 0.85]) {
      const [ux, uz] = onCol(a, 0.66)
      goldPot(g, ux, y3, uz, 0.03, 0.09)
    }
    const [jx2, jz2] = onCol(-1.4, 0.55)
    jug(g, jx2, y3, jz2, faceOut(-1.4), 0.18)
  }

  /* ---------- the back wall: shelves over blush drawer cabinets ---------- */
  const cabTop = 0.85
  /** A blush drawer cabinet along a wall, `len` long, its back on local z = 0 (drawers face +z), with a stone top. */
  const drawerCabinet = (x: number, z: number, yaw: number, len: number, name: string) => {
    const c = at(g, x, Y, z, yaw)
    const d = 0.45
    k.box(c, len, 0.08, d - 0.06, b.blackMatte, 0, 0.04, (d - 0.06) / 2)
    k.box(c, len, cabTop - 0.11, 0.02, b.blush, 0, 0.08 + (cabTop - 0.11) / 2, 0.01)
    k.box(c, len, 0.02, d, b.blush, 0, 0.09, d / 2)
    for (const sx of [-1, 1]) k.box(c, 0.02, cabTop - 0.11, d, b.blush, sx * (len / 2 - 0.01), 0.08 + (cabTop - 0.11) / 2, d / 2)
    k.soft(c, len + 0.01, 0.03, d + 0.02, 0.006, b.cream, 0, cabTop - 0.015, d / 2 + 0.005)
    const bays = Math.round(len / 0.9)
    const bw = len / bays
    for (let i = 0; i < bays; i++) {
      for (let j = 0; j < 2; j++) {
        const dr = new Group()
        dr.name = `drawer_beauty_${name}_${i}_${j}`
        dr.userData.label = 'Drawer'
        dr.userData.slide = [0, 0, 0.34]
        dr.position.set(-len / 2 + bw * (i + 0.5), 0.1 + j * 0.31 + 0.15, d)
        c.add(dr)
        const front = k.soft(dr, bw - 0.012, 0.295, 0.025, 0.008, b.blush, 0, 0, -0.012)
        front.userData.front = true
        // A slim brass pull, recessed along its top.
        k.box(dr, bw * 0.4, 0.012, 0.012, b.brass, 0, 0.12, 0.002)
        const box2 = new Group()
        box2.name = 'contents'
        dr.add(box2)
        k.box(box2, bw - 0.05, 0.012, 0.38, b.ivory, 0, -0.13, -0.2)
        for (const sx of [-1, 1]) k.box(box2, 0.012, 0.14, 0.38, b.ivory, sx * (bw / 2 - 0.03), -0.07, -0.2)
        k.box(box2, bw - 0.05, 0.14, 0.012, b.ivory, 0, -0.07, -0.39)
        // The stock: boxed products in the house colours, in rows.
        const cols = [b.blush, b.ivory, b.sage, b.cream]
        for (let q = 0; q < 6; q++) k.box(box2, 0.07, 0.1, 0.05, cols[(q + i + j) % 4], -bw / 2 + 0.08 + (q % 3) * 0.1 + (j ? 0.04 : 0), -0.075, -0.1 - Math.floor(q / 3) * 0.12, false)
      }
    }
    e.shade.rect(x, Y + 0.012, z, len, d, yaw, 0.3)
    return c
  }
  const backCab = drawerCabinet((L + R) / 2, BACK + 0.02, 0, R - L - 0.04, 'back')
  info(s, backCab, { title: 'Blush Drawer Cabinets', kind: 'Storage', body: 'Low cabinets in blush lacquer with a cream stone top, wrapping the back corner: deep soft-close drawers of boxed stock under the display. Tap a drawer to open it.', specs: ['Lacquered MDF, soft-close runners', 'Brass pulls', 'Cream quartz top'] }, 0)
  const sideCab = drawerCabinet(R - 0.02, (BACK + 0.47 + -13.3) / 2, -PI / 2, -13.3 - (BACK + 0.47), 'side')
  void sideCab
  // The floating shelves: three cream with rounded ends, the top one blush and wavy; each lit under its edge.
  const shelfRun = (y: number, wavy: boolean, mat: Material) => {
    const x0 = L + 0.25
    const x1 = R - 0.12
    const d = 0.25
    const shape = new Shape()
    shape.moveTo(x0, -BACK)
    const n = 40
    for (let i = 0; i <= n; i++) {
      const t = i / n
      const x = x0 + (x1 - x0) * t
      const end = Math.min(1, Math.min(t, 1 - t) * 14)
      const dz = (wavy ? d + 0.035 * Math.sin(t * PI * 3) : d) * Math.sqrt(end)
      shape.lineTo(x, -(BACK + 0.02 + dz))
    }
    shape.lineTo(x1, -BACK)
    const geo = new ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 6 })
    geo.rotateX(-PI / 2)
    mesh(g, geo, mat, 0, Y + y - 0.035, 0)
    k.box(g, x1 - x0 - 0.2, 0.004, 0.008, shelfLed, (x0 + x1) / 2, Y + y - 0.042, BACK + 0.02 + d - 0.025, false)
  }
  const SH = [1.12, 1.47, 1.82, 2.22]
  shelfRun(SH[0], false, b.cream)
  shelfRun(SH[1], false, b.cream)
  shelfRun(SH[2], false, b.cream)
  shelfRun(SH[3], true, b.blush)
  const zs = BACK + 0.13
  {
    // Shelf 1: the skincare ritual, cleanse to cream, then fragrance.
    const y = Y + SH[0]
    let x = L + 0.38
    const step = (w: number) => {
      const at0 = x + w / 2
      x += w + 0.035
      return at0
    }
    product(cleanser(s, b, g, step(0.04), y, zs, 0, b.blushPlastic, lab('Cloud Cleanser', 'Gel cleanser · 150 ml')), { title: 'Cloud Cleanser', kind: 'Skincare · Cleanser', body: 'A soft gel cleanser with oat and rose water that lifts make-up and SPF without stripping. 150 ml, ₹ 1,650.', specs: ['pH 5.5', 'Fragrance-free', 'All skin types'] })
    product(toner(s, b, g, step(0.048), y, zs, 0, lab('Rose Toner', 'Hydrating · 200 ml')), { title: 'Rose Petal Toner', kind: 'Skincare · Toner', body: 'A hydrating toner of Damask rose water, glycerin and panthenol to prepare the skin for serum. 200 ml, ₹ 1,850.', specs: ['Alcohol-free', 'Frosted glass, recyclable'] })
    for (const [nm, gl, line, price] of [['Glow Serum', b.amberGlass, '15% vitamin C · 30 ml', 3450], ['Hydra Serum', b.pinkGlass, 'Hyaluronic acid · 30 ml', 2950], ['Night Serum', b.amberGlass, 'Retinal 0.1% · 30 ml', 3950]] as const) {
      product(serum(s, b, g, step(0.034), y, zs, 0, gl, lab(nm, line)), { title: nm, kind: 'Skincare · Serum', body: `${nm}: ${line}. A few drops morning or night, before your cream. ₹ ${price.toLocaleString('en-IN')}.`, specs: ['Glass dropper bottle', 'Dermatologically tested'] })
    }
    for (const [nm, gl, line, price] of [['Velvet Cream', b.frostedPink, 'Moisturiser · 50 ml', 3250], ['Eye Balm', b.frostedWhite, 'Eye cream · 15 ml', 2450]] as const) {
      product(creamJar(s, b, g, step(0.066), y, zs, 0, gl, lab(nm, line), nm === 'Eye Balm' ? 0.024 : 0.032), { title: nm, kind: 'Skincare · Cream', body: `${nm}: ${line}. A rich, quickly absorbed cream with ceramides, squalane and peptides. ₹ ${price.toLocaleString('en-IN')}.`, specs: ['Weighted glass jar, gold lid', 'Non-comedogenic'] })
    }
    product(pumpBottle(s, b, g, step(0.058), y, zs, 0, b.frostedWhite, lab('Body Lotion', 'Rose & oat · 250 ml')), { title: 'Rose & Oat Body Lotion', kind: 'Body · Lotion', body: 'A silky body lotion with colloidal oat and rose that sinks in at once. 250 ml, ₹ 1,950.', specs: ['Pump bottle', 'Vegan'] })
    // Then fragrance, the four styles.
    x += 0.06
    const juices = ['#e9b3a4', '#d7a25c', '#efe3c2', '#b89c74', '#e5c7d6']
    const names = ['Rose Absolue', 'Ambre Nu', 'Néroli Blanc', 'Fig & Cedar', 'Iris Poudré']
    const styles: FlaconStyle[] = ['block', 'round', 'block', 'tall', 'round']
    for (let i = 0; i < 5; i++) {
      const w = styles[i] === 'block' ? 0.075 : styles[i] === 'round' ? 0.084 : 0.046
      if (x + w > R - 0.2) break
      const nm = names[i]
      product(perfume(s, b, g, styles[i], step(w), y, zs, 0, b.liquid(juices[i], 0.75), lab(nm, '50 ml')), {
        title: nm, kind: 'Fragrance · Eau de parfum', body: `${nm} by ${HOUSE}, eau de parfum, 50 ml. ₹ ${[7950, 8950, 6450, 7450, 8250][i].toLocaleString('en-IN')}.`, specs: ['Testers at the consultation counter', 'Refillable flacon'],
      })
    }
  }
  {
    // Shelf 2: gift sets, then foundations in their shades, concealers.
    const y = Y + SH[1]
    product(giftBox(s, b, g, L + 0.48, y, zs, 0, 0.2, 0.09, 0.15, b.blush, b.gold, lab('The Ritual', 'Skincare set')), { title: 'The Ritual · Gift Set', kind: 'Gift set · Skincare', body: 'Cleanser, toner, Glow Serum and Velvet Cream in travel sizes, boxed in blush board with a gold satin ribbon. ₹ 4,950.', specs: ['Four products', 'Gift message card inside'] })
    product(giftBox(s, b, g, L + 0.72, y, zs, 0.1, 0.16, 0.07, 0.12, b.ivory, b.blushDeep, lab('Lip Edit', 'Three lipsticks')), { title: 'The Lip Edit · Gift Set', kind: 'Gift set · Lips', body: 'Three Velvet Matte lipsticks (Rosewood, Bare Petal, Rouge Atelier) in an ivory box. ₹ 4,500.', specs: ['Three full-size lipsticks'] })
    SKIN.forEach(([nm], i) => {
      product(foundation(s, b, g, L + 0.98 + i * 0.07, y, zs, 0, skinMat[i], lab('Skin Silk', nm)), {
        title: `Skin Silk Foundation · ${nm}`, kind: 'Face · Foundation', body: `A weightless, buildable foundation with a satin finish and SPF 20, in shade ${nm}. 30 ml, ₹ 3,250.`, specs: ['Medium coverage, buildable', '24-hour wear', 'Pump bottle; 24 shades in store'],
      })
    })
    for (let i = 0; i < 4; i++) {
      product(concealer(s, b, g, L + 1.46 + i * 0.03, y, zs, 0, skinMat[i + 1]), { title: `Soft Focus Concealer · ${SKIN[i + 1][0]}`, kind: 'Face · Concealer', body: `A creamy, crease-proof concealer for under the eyes and spots, shade ${SKIN[i + 1][0]}. 6 ml, ₹ 1,950.`, specs: ['Doe-foot applicator', 'Full coverage'] })
    }
    product(giftBox(s, b, g, R - 0.48, y, zs, -0.08, 0.22, 0.1, 0.16, b.sage, b.gold, lab('Scent Library', 'Five minis')), { title: 'The Scent Library', kind: 'Gift set · Fragrance', body: 'Five 10 ml eaux de parfum to discover the collection, in a sage box. ₹ 5,950.', specs: ['Five 10 ml sprays'] })
    product(giftBox(s, b, g, R - 0.75, y, zs, 0.05, 0.16, 0.12, 0.12, b.blush, b.ivory, lab('Glow Kit', 'Face edit')), { title: 'The Glow Kit', kind: 'Gift set · Face', body: 'Skin Silk foundation, a compact and a blush brush, boxed. ₹ 5,450.', specs: ['Shade chosen at the counter'] })
  }
  {
    // Shelf 3: prints, books, a vase of dried bunny tails, creams.
    const y = Y + SH[2]
    frame(g, L + 0.5, y, BACK + 0.09, 0, 0.22, 0.28, 0)
    frame(g, L + 0.72, y, BACK + 0.1, 0, 0.16, 0.2, 1)
    books(g, L + 1.1, y, zs, 0.1, 3, 8)
    const v = vase(g, L + 1.45, y, zs, b.clayPink, 0.16, 0.05)
    void v
    const r = rng(12)
    for (let i = 0; i < 9; i++) {
      const a = r() * PI * 2
      const len = 0.18 + r() * 0.1
      const dir = new Vector3(Math.cos(a) * 0.3, 1, Math.sin(a) * 0.3).normalize()
      const tip: [number, number, number] = [L + 1.45 + dir.x * len, y + 0.14 + dir.y * len, zs + dir.z * len]
      tube(g, [L + 1.45, y + 0.14, zs], tip, 0.002, b.driedDark, 4)
      k.sphere(g, 0.014, b.dried, ...tip).scale.y = 1.6
    }
    for (const [i, nm] of ['Velvet Cream', 'Body Butter', 'Lip Balm'].entries()) {
      product(creamJar(s, b, g, L + 1.75 + i * 0.12, y, zs, 0, i === 1 ? b.frostedWhite : b.frostedPink, lab(nm, i === 2 ? '15 g' : '50 ml'), i === 2 ? 0.02 : 0.034), { title: nm, kind: 'Skincare · Balm and cream', body: `${nm} in a weighted glass jar with a gold lid. ₹ ${[3250, 2650, 950][i].toLocaleString('en-IN')}.`, specs: ['Shea, squalane and rosehip'] })
    }
    frame(g, R - 0.42, y, BACK + 0.09, 0, 0.26, 0.32, 2)
    jug(g, R - 0.72, y, zs, 0.6, 0.2)
  }
  {
    // The top shelf: dried flowers, a gold vessel, a white vase.
    const y = Y + SH[3]
    pampas(g, L + 0.55, y, zs + 0.02, 0.38, 4)
    goldPot(g, L + 1.15, y, zs, 0.04, 0.16)
    vase(g, L + 1.6, y, zs, b.ceramicWhite, 0.2, 0.065)
    frame(g, L + 2.2, y, BACK + 0.09, 0, 0.2, 0.24, 3)
    bowl(g, R - 0.5, y, zs, 0.09, b.terracotta)
  }
  {
    // On the back cabinets' top: a large print leaning, books and a bowl, the nail bar on the side cabinets.
    const y = Y + cabTop
    frame(g, L + 0.5, y, BACK + 0.08, 0, 0.18, 0.22, 1, 0.08)
    books(g, L + 1.2, y, BACK + 0.25, 0.2, 2, 21)
    bowl(g, L + 1.2, y + 0.05, BACK + 0.25, 0.07, b.terracotta)
    product(giftBox(s, b, g, L + 1.7, y, BACK + 0.25, -0.1, 0.24, 0.12, 0.18, b.blush, b.gold, lab('Atelier Edit', 'Bestsellers')), { title: 'The Atelier Edit', kind: 'Gift set · Bestsellers', body: 'The house\'s five bestsellers in one box: Glow Serum, Velvet Cream, a Velvet Matte lipstick, the Rose Nude palette and Rose Absolue 10 ml. ₹ 9,950.', specs: ['Limited edition'] })
    // The nail bar: a stepped blush stand of twelve colours.
    const nx = R - 0.24
    const nb = at(g, nx, y, -14.6, -PI / 2)
    for (let st2 = 0; st2 < 3; st2++) k.soft(nb, 0.56, 0.03 + st2 * 0.04, 0.08, 0.005, b.ivory, 0, (0.03 + st2 * 0.04) / 2, 0.08 - st2 * 0.08)
    NAIL.forEach(([nm, col], i) => {
      const row = Math.floor(i / 4)
      product(nailPolish(s, b, nb, -0.2 + (i % 4) * 0.13, 0.03 + row * 0.04, 0.08 - row * 0.08, 0, b.liquid(col, 0.97), i % 2 ? b.gold : b.blackGloss), { title: `Nail Lacquer · ${nm}`, kind: 'Nails · Lacquer', body: `A long-wear, chip-resistant nail lacquer in ${nm}: two coats for full colour. 10 ml, ₹ 950.`, specs: ['10-free formula', 'Wide flat brush', 'Up to 7 days wear'] })
    })
    product(brushCup(s, b, g, R - 0.24, y, -13.7, b.clayPink), { title: 'Makeup Brushes', kind: 'Tools · Brushes', body: 'Soft synthetic brushes with gold ferrules: powder, blush, foundation, contour and eye. From ₹ 1,250; the set of seven ₹ 6,950.', specs: ['Vegan, cruelty-free bristles', 'Hand-finished handles'] })
    lathe(g, [[0.001, 0], [0.08, 0], [0.11, 0.15], [0.112, 0.16], [0.1, 0.16], [0.001, 0.14]], b.ceramicWhite, R - 0.26, y, -15.75, 32)
    fern(R - 0.26, -15.75, 0.5, 33, false, y + 0.13)
  }

  /* ---------- the left wall: blush cabinet, round mirror, pampas ---------- */
  {
    const z0 = BACK + 0.47
    const z1 = -13.0
    const lc = drawerCabinet(L + 0.02, (z0 + z1) / 2, PI / 2, z1 - z0, 'left')
    void lc
    pampas(g, L + 0.25, Y + cabTop, z0 + 0.25, 0.7, 6)
    vase(g, L + 0.22, Y + cabTop, z1 - 0.3, b.clayPink, 0.12, 0.05)
    // The mirror: a round glass in a fine brass rim, its halo light behind it on a touch button.
    const mz = (z0 + z1) / 2
    const my = Y + 1.75
    const halo = new MeshStandardMaterial({ color: '#fff3e6', emissive: '#ffe6cc', emissiveIntensity: 0, roughness: 0.8 })
    halo.userData.interior = true
    const hd = mesh(g, new CircleGeometry(0.58, 64), halo, L + 0.022, my, mz, false)
    hd.rotation.y = PI / 2
    const mirror = mesh(g, new CircleGeometry(0.52, 64), b.mirror, L + 0.05, my, mz, false)
    mirror.rotation.y = PI / 2
    const rim = mesh(g, new TorusGeometry(0.525, 0.008, 8, 72), b.brass, L + 0.05, my, mz)
    rim.rotation.y = PI / 2
    let on = false
    const touch = button(g, 'halo', 'Mirror light', 'Switch', L + 0.055, my - 0.48, mz, () => {
      on = !on
      play({ dur: 0.4, step: (t) => (halo.emissiveIntensity = on ? t * 0.9 : (1 - t) * 0.9) }, touch)
    }, 'beauty')
    const dot = k.cyl(touch, 0.012, 0.012, 0.004, b.brass, 0, 0, 0, 20)
    dot.rotation.z = PI / 2
    dot.userData.front = true
  }

  /* ---------- the makeup bar: the cream table on an arch and a drum ---------- */
  {
    const t = at(g, TABLE.x, Y, TABLE.z, 0)
    const len = 1.7
    const w = 0.62
    const th = 0.05
    const top = 0.9
    const stad = new Shape()
    const rr = w / 2
    stad.moveTo(-rr, -(len / 2 - rr))
    stad.absarc(0, -(len / 2 - rr), rr, PI, 0, false)
    stad.lineTo(rr, len / 2 - rr)
    stad.absarc(0, len / 2 - rr, rr, 0, PI, false)
    stad.lineTo(-rr, -(len / 2 - rr))
    const tg = new ExtrudeGeometry(stad, { depth: th - 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 3, curveSegments: 24 })
    tg.rotateX(-PI / 2)
    mesh(t, tg, b.ivory, 0, top - th + 0.006, 0)
    // The arch: a slab with a round-headed opening, at the back end.
    const arch = new Shape()
    const aw = 0.56
    const ah = top - th
    arch.moveTo(-aw / 2, 0)
    arch.lineTo(aw / 2, 0)
    arch.lineTo(aw / 2, ah)
    arch.lineTo(-aw / 2, ah)
    arch.lineTo(-aw / 2, 0)
    const hole = new Shape()
    const hw = 0.3
    hole.moveTo(-hw / 2, 0)
    hole.lineTo(hw / 2, 0)
    hole.lineTo(hw / 2, ah - 0.32)
    hole.absarc(0, ah - 0.32, hw / 2, 0, PI, false)
    hole.lineTo(-hw / 2, 0)
    arch.holes.push(hole as unknown as Shape)
    const ag = new ExtrudeGeometry(arch, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2, curveSegments: 24 })
    ag.translate(0, 0, -0.07)
    const am = mesh(t, ag, b.ivory, 0, 0, -len / 2 + 0.33)
    am.rotation.y = PI / 2
    k.cyl(t, 0.22, 0.22, top - th, b.ivory, 0, (top - th) / 2, len / 2 - 0.36, 48)
    e.shade.rect(TABLE.x, Y + 0.012, TABLE.z, w, len, 0, 0.16)
    info(s, t, { title: 'The Makeup Bar', kind: 'Display table', body: 'A table in cream solid surface on a round-headed arch and a drum, for trying colour: lipsticks in their stand, glosses, compacts and palettes open to swatch, mascaras and liners, concealers. Everything on it is a tester; ask for a fresh one from the drawers.', specs: ['1700 × 620 mm, 900 mm high', 'Solid surface, hand-finished', 'Cleansing wipes and disposable applicators at the counter'] }, 0)

    // On it: the tiered lipstick stand at the middle, the colour around it.
    const ty = Y + top
    const stand = at(g, TABLE.x, ty, TABLE.z, PI / 2)
    for (let st2 = 0; st2 < 3; st2++) k.soft(stand, 0.36 - st2 * 0.04, 0.025 + st2 * 0.035, 0.07, 0.006, b.blush, 0, (0.025 + st2 * 0.035) / 2, 0.07 - st2 * 0.07)
    let n = 0
    for (let st2 = 0; st2 < 3; st2++) {
      const cnt = st2 === 2 ? 4 : 5
      for (let i = 0; i < cnt; i++) {
        const li = n++ % LIP.length
        const open = st2 > 0
        const lpx = -0.14 + i * (st2 === 2 ? 0.09 : 0.07) + (st2 === 2 ? 0.005 : 0)
        const { g: lg } = lipstick(s, b, stand, lpx, 0.025 + st2 * 0.035 - 0.012, 0.07 - st2 * 0.07, 0, lipMat[li], open, st2 === 1 ? b.roseGold : b.gold)
        product(lg, { title: `Velvet Matte Lipstick · ${LIP[li][0]}`, kind: 'Lips · Lipstick', body: `A creamy matte lipstick that stays comfortable all day, in ${LIP[li][0]}. Shea and rosehip keep lips soft. 3.5 g, ₹ 1,850.`, specs: ['Refillable gold case', 'Up to 8 hours wear', 'Testers at the consultation counter'] })
      }
    }
    // Glosses in a row.
    const GL: [string, string][] = [['Clear Glass', '#f3e2d8'], ['Petal', '#e3a6a0'], ['Honey', '#d69a6a'], ['Berry', '#9b3a4a'], ['Nude', '#c98f7c'], ['Coral', '#e07a64']]
    GL.forEach(([nm, col], i) => product(lipGloss(s, b, g, TABLE.x - 0.17 + i * 0.03, ty, TABLE.z - 0.45, 0, b.liquid(col, 0.8)), { title: `Lip Glass · ${nm}`, kind: 'Lips · Gloss', body: `A non-sticky high-shine gloss in ${nm}, with a cushion applicator. 6 ml, ₹ 1,450.`, specs: ['Hyaluronic acid', 'Vanilla scent'] }))
    // Palettes open, compacts (one open).
    product(palette(s, b, g, 'a', TABLE.x - 0.12, ty, TABLE.z + 0.42, 0.25, ['#f1dccb', '#e7b8a0', '#c98a6b', '#a6563f', '#6b3a2c', '#f3d6b8', '#d39a7d', '#8e4a4f', '#3b2622', '#e8c4b4', '#b07a64', '#5a3a33'], b.blush, true), { title: 'Rose Nude Eyeshadow Palette', kind: 'Eyes · Palette', body: 'Twelve shades from champagne to espresso, mattes and shimmers, with a full mirror in the lid. 12 × 1.2 g, ₹ 4,250. Tap the lid to close or open it.', specs: ['Highly pigmented, blendable', 'Mirror in the lid'] })
    product(palette(s, b, g, 'b', TABLE.x + 0.13, ty, TABLE.z + 0.55, -0.3, ['#efe2d0', '#cfd3c2', '#a9b9a1', '#6e7d63', '#3e4a3a', '#e9d3b8', '#b89c74', '#7a6248', '#2f2a26', '#f2e6d8', '#c2a98c', '#5c5048'], b.sage, true), { title: 'Sage Garden Eyeshadow Palette', kind: 'Eyes · Palette', body: 'Twelve earthy greens and taupes with a shimmer of gold. 12 × 1.2 g, ₹ 4,250.', specs: ['Mattes and shimmers', 'Mirror in the lid'] })
    const PW: [string, string][] = [['Translucent', '#efe2d4'], ['Medium', '#d4a985'], ['Rose Blush', '#e1928a']]
    PW.forEach(([nm, col], i) => product(compact(s, b, g, `c${i}`, TABLE.x - 0.18 + i * 0.13, ty, TABLE.z + 0.75, 0, b.shade(col, 0.85), i === 0), { title: `${i === 2 ? 'Silk Blush' : 'Silk Pressed Powder'} · ${nm}`, kind: `Face · ${i === 2 ? 'Blush' : 'Powder'}`, body: `A finely milled pressed ${i === 2 ? 'blush' : 'powder'} in a refillable rose-gold compact with a mirror. 9 g, ₹ ${i === 2 ? '2,250' : '2,650'}. Tap the lid to open it.`, specs: ['Refillable compact', 'Talc-free'] }))
    // Mascaras and liners on a little marble tray.
    const tray = at(g, TABLE.x + 0.15, ty, TABLE.z - 0.2, 0)
    k.soft(tray, 0.16, 0.012, 0.1, 0.004, b.marble, 0, 0.006, 0)
    for (let i = 0; i < 3; i++) product(mascara(s, b, tray, -0.05 + i * 0.022, 0.012, -0.02, 0), { title: 'Lash Atelier Mascara', kind: 'Eyes · Mascara', body: 'A lengthening, volumising mascara in deepest black with a curved fibre brush. 9 ml, ₹ 1,950.', specs: ['Smudge-proof', 'Removes with warm water'] })
    for (let i = 0; i < 3; i++) product(eyeliner(s, b, tray, 0.025 + i * 0.018, 0.012, 0.025, 0), { title: 'Fine Line Eyeliner', kind: 'Eyes · Liner', body: 'A felt-tip liquid liner for a fine, precise line, 24-hour wear. ₹ 1,450.', specs: ['Waterproof', 'Carbon black'] })
    for (let i = 0; i < 3; i++) product(concealer(s, b, g, TABLE.x - 0.2 + i * 0.025, ty, TABLE.z - 0.2, 0, skinMat[i + 2]), { title: `Soft Focus Concealer · ${SKIN[i + 2][0]}`, kind: 'Face · Concealer', body: `A creamy, crease-proof concealer, shade ${SKIN[i + 2][0]}. 6 ml, ₹ 1,950.`, specs: ['Tester'] })
  }

  /* ---------- the consultation and testing counter ---------- */
  {
    const c = at(g, COUNTER.x, Y, COUNTER.z, 0)
    const ch = 0.95
    k.cyl(c, 0.47, 0.47, 0.08, b.blackMatte, 0, 0.04, 0, 48)
    const drum = k.cyl(c, 0.5, 0.5, ch - 0.12, b.blush, 0, 0.08 + (ch - 0.12) / 2, 0, 64)
    void drum
    k.cyl(c, 0.51, 0.51, 0.006, b.brass, 0, ch - 0.042, 0, 64)
    k.cyl(c, 0.56, 0.56, 0.04, b.marbleTop, 0, ch - 0.02, 0, 64)
    e.shade.pool(COUNTER.x, Y + 0.012, COUNTER.z, 0.62, 0.62, 0.4)
    info(s, c, { title: 'Consultation & Testing Counter', kind: 'Counter', body: 'The beauty advisers\' counter, round so you can sit or stand at any side: fragrance testers on a brass tray, lipstick testers, the shade finder and a lit vanity mirror. Book a complimentary skin consultation or a 20-minute make-up here; purchases are rung up on the tablet.', specs: ['Blush lacquer drum, brass band', 'Statuario marble top, 1.12 m across', 'Skin consultation: 20 minutes, free'] }, 0)
    const ty = Y + ch
    // The brass tray of fragrance testers: each sprays when its atomiser is pressed.
    const tr = at(g, COUNTER.x - 0.18, ty, COUNTER.z - 0.05, 0.4)
    lathe(tr, [[0.001, 0], [0.16, 0], [0.165, 0.018], [0.158, 0.018], [0.152, 0.004], [0.001, 0.004]], b.brass, 0, 0, 0, 48)
    const testers: [FlaconStyle, string, string][] = [['block', 'Rose Absolue', '#e9b3a4'], ['round', 'Ambre Nu', '#d7a25c'], ['tall', 'Fig & Cedar', '#b89c74']]
    testers.forEach(([style, nm, col], i) => {
      const a = (i / 3) * PI * 2 + 0.3
      const px = Math.cos(a) * 0.085
      const pz = Math.sin(a) * 0.085
      const pf = perfume(s, b, tr, style, px, 0.004, pz, a + PI / 2, b.liquid(col, 0.75), lab(nm, 'Tester'), 0.95)
      const capTop = style === 'block' ? 0.085 + 0.045 : style === 'round' ? 0.078 + 0.06 : 0.124 + 0.05
      const world = new Vector3()
      tr.updateMatrixWorld(true)
      pf.updateMatrixWorld(true)
      pf.localToWorld(world.set(0, capTop * 0.88, 0.02))
      const local = g.worldToLocal(world.clone())
      const out = new Vector3(Math.cos(a + 0.4), 0.15, Math.sin(a + 0.4)).normalize()
      const spray = mistOn(s, g, local.x, local.y, local.z, out)
      const btn = button(pf, `tester${i}`, `${nm} tester`, 'Spray', 0, capTop * 0.88 / 0.85 * 0.85, 0, spray, 'beauty')
      btn.add(new Mesh(new BoxGeometry(0.06, 0.06, 0.06), HIT))
    })
    // Lipstick testers in a small blush block: tap one and it twists up or down.
    const lt = at(g, COUNTER.x + 0.2, ty, COUNTER.z + 0.18, -0.6)
    k.soft(lt, 0.15, 0.03, 0.06, 0.006, b.blush, 0, 0.015, 0)
    for (let i = 0; i < 4; i++) {
      const li = [0, 3, 1, 5][i]
      const { g: lg, turn } = lipstick(s, b, lt, -0.054 + i * 0.036, 0.018, 0, 0, lipMat[li], true)
      let up = true
      const btn = button(lg, `lip${i}`, `${LIP[li][0]} tester`, 'Twist', 0, 0.03, 0, () => {
        up = !up
        play({ dur: 0.6, step: (t) => (turn.position.y = (up ? 1 - t : t) * -0.016) }, btn)
      }, 'beauty')
      btn.add(new Mesh(new BoxGeometry(0.03, 0.05, 0.03), HIT))
    }
    // The shade finder: a tablet on a brass stand, matching a foundation shade at each tap.
    const tb = at(g, COUNTER.x + 0.28, ty, COUNTER.z - 0.25, -1.9)
    k.box(tb, 0.08, 0.008, 0.06, b.brass, 0, 0.004, 0)
    k.box(tb, 0.012, 0.12, 0.012, b.brass, 0, 0.065, -0.01)
    const head = at(tb, 0, 0.13, 0.0, 0)
    head.rotation.x = -0.35
    k.soft(head, 0.25, 0.17, 0.012, 0.006, b.blackGloss, 0, 0, 0)
    const shadeScreens = SKIN.map(([nm, col]) => {
      const tx = b.canvas(384, 256, (cx, w2, h2) => {
        cx.fillStyle = '#f7f1ea'
        cx.fillRect(0, 0, w2, h2)
        cx.fillStyle = '#6b4a3e'
        cx.font = '600 22px "Inter", Arial, sans-serif'
        cx.fillText('SHADE FINDER', 24, 40)
        cx.fillStyle = col
        cx.beginPath()
        cx.arc(90, 150, 62, 0, PI * 2)
        cx.fill()
        cx.fillStyle = '#3a2a24'
        cx.font = '500 34px "Cormorant Garamond", Georgia, serif'
        cx.fillText('Skin Silk', 180, 130)
        cx.font = '600 26px "Inter", Arial, sans-serif'
        cx.fillText(nm, 180, 172)
        cx.font = '400 18px "Inter", Arial, sans-serif'
        cx.fillText('Tap to match the next tone', 180, 214)
      })
      const mt = new MeshStandardMaterial({ map: tx, emissiveMap: tx, emissive: '#ffffff', emissiveIntensity: 0.6, roughness: 0.3 })
      mt.userData.interior = true
      return mt
    })
    let shade = 2
    const finder = button(head, 'finder', 'Shade finder', 'Match a shade', 0, 0, 0.0065, () => {
      shade = (shade + 1) % shadeScreens.length
      scr.material = shadeScreens[shade]
    }, 'beauty')
    const scr = mesh(finder, new CircleGeometry(1, 4), shadeScreens[shade], 0, 0, 0, false)
    scr.rotation.z = PI / 4
    scr.scale.set(0.235 / Math.SQRT2, 0.155 / Math.SQRT2, 1)
    scr.userData.front = true
    // A lit vanity mirror on its foot.
    const vm = at(g, COUNTER.x + 0.02, ty, COUNTER.z - 0.36, -PI + 0.3)
    k.cyl(vm, 0.06, 0.065, 0.012, b.brass, 0, 0.006, 0, 32)
    k.cyl(vm, 0.006, 0.006, 0.2, b.brass, 0, 0.11, 0, 10)
    const ringMat = new MeshStandardMaterial({ color: '#fff4e8', emissive: '#ffe9d2', emissiveIntensity: 0, roughness: 0.4 })
    ringMat.userData.interior = true
    mesh(vm, new TorusGeometry(0.1, 0.008, 8, 48), ringMat, 0, 0.32, 0)
    mesh(vm, new CircleGeometry(0.095, 48), b.mirror, 0, 0.32, 0.002, false)
    mesh(vm, new TorusGeometry(0.106, 0.004, 8, 48), b.brass, 0, 0.32, -0.002)
    let lit = false
    const vb = button(vm, 'vanity', 'Vanity mirror light', 'Switch', 0.0, 0.012, 0.055, () => {
      lit = !lit
      play({ dur: 0.35, step: (t) => (ringMat.emissiveIntensity = lit ? t * 1.2 : (1 - t) * 1.2) }, vb)
    }, 'beauty')
    k.cyl(vb, 0.006, 0.006, 0.006, b.whiteGloss, 0, 0, 0, 12).userData.front = true
    // A gold cup of brushes, a ceramic cup of cotton pads, a small tray.
    product(brushCup(s, b, g, COUNTER.x - 0.32, ty, COUNTER.z + 0.26, b.gold), { title: 'Makeup Brushes', kind: 'Tools · Brushes', body: 'The advisers\' brushes for testing, cleaned after every use. The same brushes are on sale at the nail bar.', specs: ['Synthetic bristles'] })
    const pads = at(g, COUNTER.x - 0.05, ty, COUNTER.z + 0.36, 0)
    lathe(pads, [[0.001, 0], [0.04, 0], [0.042, 0.07], [0.039, 0.07], [0.037, 0.005], [0.001, 0.005]], b.ceramicWhite, 0, 0, 0, 28)
    for (let i = 0; i < 6; i++) k.cyl(pads, 0.028, 0.028, 0.004, b.whiteMatte, 0, 0.05 + i * 0.005, 0, 18)
  }

  /* ---------- planting ---------- */
  {
    // The monstera, in a white planter tucked by the counter, kept to the wall side of the aisle.
    const pg = at(g, 11.12, Y, -12.5, 0)
    pg.scale.setScalar(0.72)
    lathe(pg, [[0.001, 0], [0.26, 0], [0.33, 0.5], [0.335, 0.52], [0.3, 0.52], [0.29, 0.48], [0.001, 0.48]], b.whiteMatte, 0, 0, 0, 40)
    monstera(e, pg, 0, 0, 0.48, 14)
    e.shade.pool(11.12, Y + 0.012, -12.5, 0.3, 0.3, 0.4)
  }
  fern(11.1, -9.45, 0.9, 22)
  fern(8.35, -12.35, 0.6, 23)

  /* ---------- lighting and its switches ---------- */
  lamp(s, 9.7, Y + H - 0.4, -10.7, 9, 8)
  lamp(s, 9.7, Y + H - 0.4, -13.6, 9, 8)
  lamp(s, 9.8, Y + H - 0.5, -15.7, 8, 7)
  {
    const sw = new Group()
    sw.position.set(L + 0.021, Y + 1.2, -9.4)
    sw.rotation.y = PI / 2
    g.add(sw)
    const plate = switchPlate(k, sw, 'beauty', ['switch', 'switch'], { plate: lux.brass, rocker: lux.brass, dark: b.blackMatte, locator: lux.ledCool as MeshStandardMaterial }, [s.circuit, display])
    plate.traverse((o) => {
      if (o.name === 'switch_beauty_0') o.userData.label = 'Boutique lights'
      if (o.name === 'switch_beauty_1') o.userData.label = 'Display & cove lighting'
    })
    setCircuit(s.circuit, true)
    setCircuit(display, true)
  }
  return s
}
