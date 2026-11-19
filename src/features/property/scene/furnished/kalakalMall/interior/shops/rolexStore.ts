import { CatmullRomCurve3, CylinderGeometry, DoubleSide, ExtrudeGeometry, Group, LatheGeometry, Mesh, MeshStandardMaterial, PlaneGeometry, Shape, SphereGeometry, TorusGeometry, TubeGeometry, Vector2, Vector3, type Material, type Object3D } from 'three'
import { useInfoStore, type EquipmentInfo } from '../../../../../../../store/info'
import { circuit, setCircuit, switchPlate } from '../../../kalakalD65/fixtures'
import { mergeStatic } from '../../../optimize'
import { clipped, type FloorCtx } from '../shell'
import type { Unit } from '../units'
import { button, info, live } from './cafe'
import { at, box, brandSign, clickThrough, flat, lamp, letters, mesh, onCircuit, openShop, pane, PI, rect, swingLeaf, type Shop } from './kit'
import { watch, watchMaterials, type WatchMaterials, type WatchSpec } from './watches'

/*
 * Rolex, unit 1-05: a watch boutique on the first floor at the corner of the west spine and the
 * rear gallery, 3.5 m wide and 6.6 m deep. Built from the two references:
 *
 *   outside   a dark fascia on both fronts, the green serif ROLEX lit under the yellow crown;
 *             tall glass in bronze mullions; a dark walnut portal beside the door carrying the
 *             crown and name backlit in white; a bronze geometric lattice on the door's other
 *             side; malachite-green wave panels lit with points of light behind the glass at the
 *             corner window, watches on bronze ledges before them
 *   back      the great lit green wave wall in a bronze frame, the gold crown and name on it; before
 *             it the long consultation table (bronze frame, shagreen top, a glazed display box),
 *             two teal velvet bucket bar stools, two amber glass bell pendants on brass canopies,
 *             a beige carpet bordered in bronze
 *   right     travertine with a framed watch study; three lit walnut niche showcases over
 *             cabinets of drawers and doors; the curved cream reception counter in the far corner
 *             under a raised white ceiling with a cove of light
 *   above     a dark olive ceiling with downlights; cream large-format tiles underfoot
 *
 * Every watch is modelled whole and to size (watches.ts): tap one for its card (reference,
 * case, movement, bracelet, price), turn it and look closer in 3D, see it in its other dials and
 * metals (on the shelf too) and reserve it for a viewing; the reservations are confirmed at the
 * counter's screen. The display box's lid lifts, the showcase drawers and doors and the counter
 * drawers open; two switches by the door work the boutique and the display lighting.
 */

const X0 = -3.6
const X1 = -0.075
const Z0 = -15.925
const Z1 = -9.3
const H = 3.3

/* ---------- the collection ---------- */

interface Way {
  name: string
  swatch: string
  ref: string
  price: number
  spec: Partial<WatchSpec>
}
interface Model {
  name: string
  family: string
  note: string
  specs: string[]
  base: WatchSpec
  ways: Way[]
}

const W: Record<string, Model> = {
  sub: {
    name: 'Submariner Date', family: 'Professional', note: 'The reference among divers\' watches since 1953: a unidirectional 60-minute bezel in Cerachrom ceramic, a Chromalight display that glows blue in the dark, waterproof to 300 metres.',
    specs: ['Oyster, 41 mm, Oystersteel', 'Unidirectional rotatable 60-minute Cerachrom bezel', 'Calibre 3235, 70 hours\' reserve', 'Oyster bracelet, Glidelock extension', 'Waterproof to 300 m'],
    base: { line: 'Submariner Date', size: 41, metal: 'steel', dial: '#0b0b0c', indices: 'dot', bezel: 'diver', insert: ['#0f5a2c', '#0f5a2c', '#e9e3d0'], bracelet: 'oyster', date: true, guards: true },
    ways: [
      { name: 'Green bezel, black dial', swatch: '#1a6b3a', ref: '126610LV', price: 1235000, spec: {} },
      { name: 'Black', swatch: '#111111', ref: '126610LN', price: 1150000, spec: { insert: ['#111111', '#111111', '#e9e3d0'] } },
      { name: 'Yellow Rolesor, royal blue', swatch: '#1d3d8f', ref: '126613LB', price: 1720000, spec: { metal: 'rolesor', dial: '#1b3270', insert: ['#1d3d8f', '#1d3d8f', '#e8c072'] } },
    ],
  },
  gmt: {
    name: 'GMT-Master II', family: 'Professional', note: 'Two time zones at a glance: the red-tipped 24-hour hand reads against the two-colour Cerachrom bezel, which turns both ways to set a third.',
    specs: ['Oyster, 40 mm, Oystersteel', 'Bidirectional 24-hour Cerachrom bezel', 'Calibre 3285, 70 hours\' reserve', 'Jubilee bracelet, Easylink extension'],
    base: { line: 'GMT-Master II', size: 40, metal: 'steel', dial: '#0b0b0c', indices: 'dot', bezel: 'gmt', insert: ['#b3202c', '#1d3a8a', '#f2efe8'], bracelet: 'jubilee', date: true, gmt: true },
    ways: [
      { name: 'Red & blue', swatch: '#b3202c', ref: '126710BLRO', price: 1290000, spec: {} },
      { name: 'Black & blue', swatch: '#1d3a8a', ref: '126710BLNR', price: 1260000, spec: { insert: ['#141414', '#1d3a8a', '#f2efe8'] } },
      { name: 'Grey & black, Rolesor', swatch: '#5a5c60', ref: '126713GRNR', price: 1650000, spec: { metal: 'rolesor', insert: ['#5a5c60', '#141414', '#e8c072'], bracelet: 'oyster' } },
    ],
  },
  daytona: {
    name: 'Cosmograph Daytona', family: 'Professional', note: 'Built for racing drivers: a chronograph to the eighth of a second, three counters on the dial and an engraved tachymetric bezel to read average speed.',
    specs: ['Oyster, 40 mm', 'Tachymetric scale bezel', 'Calibre 4131 chronograph, 72 hours\' reserve', 'Oyster bracelet, Easylink extension'],
    base: { line: 'Cosmograph Daytona', size: 40, metal: 'steel', dial: '#f2efe8', finish: 'matte', indices: 'baton', bezel: 'tachy', bracelet: 'oyster', chrono: true },
    ways: [
      { name: 'White, Oystersteel', swatch: '#f2efe8', ref: '126500LN', price: 1540000, spec: {} },
      { name: 'Black, Oystersteel', swatch: '#111111', ref: '126500LN', price: 1540000, spec: { dial: '#0b0b0c' } },
      { name: 'Green, yellow gold', swatch: '#1f5b3a', ref: '126508', price: 4200000, spec: { metal: 'yellow', dial: '#1f5b3a', finish: 'sunburst' } },
    ],
  },
  datejust: {
    name: 'Datejust 41', family: 'Classic', note: 'The archetype of the classic watch, first with a date in a window at three: here with a fluted white-gold bezel and the five-piece Jubilee bracelet.',
    specs: ['Oyster, 41 mm', 'Fluted bezel', 'Calibre 3235, 70 hours\' reserve', 'Jubilee bracelet, Crownclasp', 'Waterproof to 100 m'],
    base: { line: 'Datejust 41', size: 41, metal: 'steel', dial: '#1f3f7a', indices: 'baton', bezel: 'fluted', bracelet: 'jubilee', date: true },
    ways: [
      { name: 'Bright blue', swatch: '#1f3f7a', ref: '126334', price: 1130000, spec: {} },
      { name: 'Mint green', swatch: '#8fc1a8', ref: '126334', price: 1130000, spec: { dial: '#8fc1a8' } },
      { name: 'Champagne, Rolesor', swatch: '#d8c08a', ref: '126333', price: 1450000, spec: { metal: 'rolesor', dial: '#d8c08a' } },
    ],
  },
  daydate: {
    name: 'Day-Date 40', family: 'Classic', note: 'The first watch to show the day spelt out in full, made only in precious metal and worn on the President bracelet created for it.',
    specs: ['Oyster, 40 mm, 18 ct gold or platinum', 'Fluted bezel', 'Calibre 3255, 70 hours\' reserve', 'President bracelet, concealed Crownclasp'],
    base: { line: 'Day-Date 40', size: 40, metal: 'yellow', dial: '#4c5a2a', indices: 'roman', bezel: 'fluted', bracelet: 'president', date: true, day: true },
    ways: [
      { name: 'Olive green, yellow gold', swatch: '#4c5a2a', ref: '228238', price: 4350000, spec: {} },
      { name: 'Champagne, yellow gold', swatch: '#d6b878', ref: '228238', price: 4350000, spec: { dial: '#d6b878' } },
      { name: 'Sundust, Everose gold', swatch: '#e3b9a3', ref: '228235', price: 4600000, spec: { metal: 'everose', dial: '#e3b9a3' } },
      { name: 'Ice blue, platinum', swatch: '#bfe0ea', ref: '228206', price: 6800000, spec: { metal: 'whiteGold', dial: '#bfe0ea', bezel: 'smooth' } },
    ],
  },
  lady: {
    name: 'Lady-Datejust 28', family: 'Classic', note: 'The Datejust made for the wrist of a woman: a mother-of-pearl dial set with diamonds, inside a bezel of diamonds.',
    specs: ['Oyster, 28 mm', 'Bezel set with 44 diamonds', 'Calibre 2236, 55 hours\' reserve', 'Jubilee bracelet, concealed Crownclasp'],
    base: { line: 'Lady-Datejust', size: 28, metal: 'rolesor', dial: '#f3eef0', finish: 'mop', indices: 'diamond', bezel: 'diamond', bracelet: 'jubilee', date: true },
    ways: [
      { name: 'Mother-of-pearl, Rolesor', swatch: '#f3eef0', ref: '279383RBR', price: 2350000, spec: {} },
      { name: 'Pink, Everose gold', swatch: '#e9c3c0', ref: '279175', price: 2900000, spec: { metal: 'everose', dial: '#e9c3c0', finish: 'sunburst', bezel: 'fluted' } },
      { name: 'Blue, white gold', swatch: '#2c4a8a', ref: '279139RBR', price: 3600000, spec: { metal: 'whiteGold', dial: '#2c4a8a', finish: 'sunburst' } },
    ],
  },
  p1908: {
    name: 'Perpetual 1908', family: 'Classic', note: 'Named for the year the name Rolex was registered: a thin, domed case, a fluted bezel half polished, half fluted, and a strap of alligator leather.',
    specs: ['39 mm, 18 ct gold', 'Domed and fluted bezel', 'Calibre 7140, 66 hours\' reserve, seen through a sapphire back', 'Alligator leather strap, folding Dualclasp'],
    base: { line: '1908', size: 39, metal: 'yellow', dial: '#f4f1ea', finish: 'matte', indices: '369', bezel: 'fluted', bracelet: 'leather', strap: '#4a2a17' },
    ways: [
      { name: 'White, yellow gold', swatch: '#f4f1ea', ref: '52508', price: 2450000, spec: {} },
      { name: 'Black, white gold', swatch: '#121212', ref: '52509', price: 2450000, spec: { metal: 'whiteGold', dial: '#121212', strap: '#111111' } },
      { name: 'Ice blue, platinum', swatch: '#c5dfe6', ref: '52506', price: 4800000, spec: { metal: 'whiteGold', dial: '#c5dfe6', strap: '#5a3a24' } },
    ],
  },
  explorer: {
    name: 'Explorer 40', family: 'Professional', note: 'Born of the first ascent of Everest: a black dial with the 3, 6 and 9 in Chromalight for reading at a glance in any light.',
    specs: ['Oyster, 40 mm, Oystersteel', 'Smooth bezel', 'Calibre 3230, 70 hours\' reserve', 'Oyster bracelet, Easylink extension'],
    base: { line: 'Explorer', size: 40, metal: 'steel', dial: '#0b0b0c', finish: 'matte', indices: '369', bezel: 'smooth', bracelet: 'oyster' },
    ways: [
      { name: '40 mm, Oystersteel', swatch: '#0b0b0c', ref: '224270', price: 820000, spec: {} },
      { name: '36 mm, Rolesor', swatch: '#e8c072', ref: '124273', price: 1050000, spec: { size: 36, metal: 'rolesor' } },
    ],
  },
  sky: {
    name: 'Sky-Dweller', family: 'Professional', note: 'For the global traveller: a second time zone on an off-centre disc and an annual calendar, set through the Ring Command bezel.',
    specs: ['Oyster, 42 mm', 'Ring Command bezel', 'Calibre 9002, annual calendar, 72 hours\' reserve', 'Oysterflex or Jubilee bracelet'],
    base: { line: 'Sky-Dweller', size: 42, metal: 'whiteGold', dial: '#1f3f7a', indices: 'baton', bezel: 'ring', bracelet: 'rubber', date: true },
    ways: [
      { name: 'Blue, white gold, Oysterflex', swatch: '#1f3f7a', ref: '336239', price: 4300000, spec: {} },
      { name: 'Bright blue, Rolesor, Jubilee', swatch: '#2a5bd0', ref: '336933', price: 1950000, spec: { metal: 'rolesor', dial: '#2a5bd0', bracelet: 'jubilee' } },
      { name: 'Chocolate, Everose gold', swatch: '#4b2d1e', ref: '336235', price: 4600000, spec: { metal: 'everose', dial: '#4b2d1e' } },
    ],
  },
  yacht: {
    name: 'Yacht-Master 40', family: 'Professional', note: 'At home on deck: a bidirectional bezel with raised, polished numerals and the supple Oysterflex bracelet.',
    specs: ['Oyster, 40 mm', 'Bidirectional bezel, raised numerals', 'Calibre 3235, 70 hours\' reserve', 'Oysterflex bracelet', 'Waterproof to 100 m'],
    base: { line: 'Yacht-Master 40', size: 40, metal: 'everose', dial: '#121212', finish: 'matte', indices: 'dot', bezel: 'diver', insert: ['#141414', '#141414', '#e6ae94'], bracelet: 'rubber', date: true },
    ways: [
      { name: 'Black, Everose gold', swatch: '#e6ae94', ref: '126655', price: 2650000, spec: {} },
      { name: 'Slate, Rolesium', swatch: '#5a636c', ref: '126622', price: 1350000, spec: { metal: 'steel', dial: '#5a636c', insert: ['#d8dbe0', '#d8dbe0', '#202022'], bracelet: 'oyster' } },
    ],
  },
  op: {
    name: 'Oyster Perpetual 41', family: 'Classic', note: 'The purest expression of the Oyster: time only, in Oystersteel, with a dial in a bright lacquer colour.',
    specs: ['Oyster, 41 mm, Oystersteel', 'Smooth bezel', 'Calibre 3230, 70 hours\' reserve', 'Oyster bracelet, Oysterclasp'],
    base: { line: 'Oyster Perpetual', size: 41, metal: 'steel', dial: '#38c0c2', indices: 'baton', bezel: 'smooth', bracelet: 'oyster' },
    ways: [
      { name: 'Turquoise blue', swatch: '#38c0c2', ref: '124300', price: 650000, spec: {} },
      { name: 'Green', swatch: '#3d7d4a', ref: '124300', price: 650000, spec: { dial: '#3d7d4a' } },
      { name: 'Coral red', swatch: '#d8504a', ref: '124300', price: 650000, spec: { dial: '#d8504a' } },
      { name: 'Bright blue', swatch: '#2a5bd0', ref: '124300', price: 650000, spec: { dial: '#2a5bd0' } },
      { name: 'Silver', swatch: '#c9ccd0', ref: '124300', price: 650000, spec: { dial: '#c9ccd0' } },
    ],
  },
}
type Key = keyof typeof W

const rupees = (n: number) => `₹ ${n.toLocaleString('en-IN')}`
const specOf = (M: Model, i: number): WatchSpec => ({ ...M.base, ...M.ways[i].spec })
const WRISTS = ['15 cm', '16 cm', '17 cm', '18 cm', '19 cm', '20 cm']
const reserved: { name: string; ref: string; way: string; wrist: string; price: number }[] = []

function reception(): Omit<EquipmentInfo, 'place'> {
  const total = reserved.reduce((a, l) => a + l.price, 0)
  return {
    title: 'The Reception Desk',
    kind: 'Rolex · Viewing appointments',
    body: reserved.length
      ? 'Your selection will be prepared in the consultation salon and sized to your wrist by our watchmaker. Confirm to book your viewing.'
      : 'You have not chosen a watch yet. Tap any watch, choose your wrist size and reserve it for a viewing; then confirm here.',
    specs: reserved.length
      ? [...reserved.map((l) => `${l.name} ${l.ref} · ${l.way} · wrist ${l.wrist} · ${rupees(l.price)}`), `Indicative total ${rupees(total)} (incl. GST)`]
      : ['Private viewings in the consultation salon', 'Bracelet sizing by our watchmaker', 'Servicing and the five-year international guarantee'],
    action: reserved.length
      ? {
          label: 'Confirm viewing',
          run: () => {
            const n = reserved.length
            reserved.length = 0
            return `Booked: your ${n === 1 ? 'watch is' : `${n} watches are`} being prepared in the salon. A confirmation is on its way by SMS.`
          },
        }
      : undefined,
  }
}

/** The Rolex crown: five prongs fanning from a band, a pearl on each, painted into a lettering cell. */
function crownCell(s: Shop, ink: string, w = 256, h = 192) {
  return s.e.s.fascia.cell(w, h, (g, cw, ch) => {
    g.clearRect(0, 0, cw, ch)
    g.fillStyle = ink
    const cx = cw / 2
    const base = ch * 0.8
    // The band: a shallow arc, flat below.
    g.beginPath()
    g.moveTo(cx - cw * 0.3, base - ch * 0.12)
    g.quadraticCurveTo(cx, base - ch * 0.2, cx + cw * 0.3, base - ch * 0.12)
    g.lineTo(cx + cw * 0.28, base)
    g.quadraticCurveTo(cx, base - ch * 0.06, cx - cw * 0.28, base)
    g.closePath()
    g.fill()
    // The prongs and pearls: the middle tallest.
    const tips: [number, number][] = [[-0.36, 0.42], [-0.18, 0.3], [0, 0.2], [0.18, 0.3], [0.36, 0.42]]
    tips.forEach(([tx, ty], i) => {
      const fx = cx + (i - 2) * cw * 0.1
      const fy = base - ch * 0.17
      const px = cx + tx * cw
      const py = ty * ch
      const ang = Math.atan2(py - fy, px - fx)
      const nx = -Math.sin(ang)
      const ny = Math.cos(ang)
      const w0 = cw * 0.018
      const w1 = cw * 0.05
      g.beginPath()
      g.moveTo(fx + nx * w0, fy + ny * w0)
      g.lineTo(px + nx * w1, py + ny * w1 + ch * 0.04)
      g.lineTo(px - nx * w1, py - ny * w1 + ch * 0.04)
      g.lineTo(fx - nx * w0, fy - ny * w0)
      g.closePath()
      g.fill()
      g.beginPath()
      g.arc(px, py, cw * 0.042, 0, 7)
      g.fill()
    })
  })
}

export function buildRolexStore(e: FloorCtx, u: Unit) {
  const s = openShop(e, u)
  const { k, lux } = e
  const { g, y: Y } = s
  const m = watchMaterials(e)
  const soffit = e.soffit

  const display = circuit()
  const glowOf = <T extends Material>(mat: T) => {
    const n = mat.clone() as T
    n.userData.interior = true
    display.glows.push(n as unknown as MeshStandardMaterial)
    return n
  }
  const wave = glowOf(m.wave)
  const ledWarm = glowOf(m.std({ color: '#fff1d6', emissive: '#ffd9a0', emissiveIntensity: 1.2, roughness: 0.3 }, 0))
  const nicheBack = glowOf(m.std({ map: m.walnut.map, emissive: '#ffb979', emissiveMap: m.walnut.map, emissiveIntensity: 0.55, roughness: 0.45 }, 0.2))
  const amber = glowOf(m.amber)
  const bulb = glowOf(m.std({ color: '#fff4dd', emissive: '#ffcf8a', emissiveIntensity: 1.4, roughness: 0.3 }, 0))
  const spot = onCircuit(s, lux.led as MeshStandardMaterial)
  const fascia = m.std({ color: '#1b1914', roughness: 0.35 }, 0.5)
  const whiteDS = m.std({ color: '#f4f2ee', roughness: 0.85, side: DoubleSide }, 0.06)
  const boxGreen = m.std({ color: '#0f4a33', roughness: 0.45 }, 0.3)
  const gold = m.yellow

  /* ---------- the watches ---------- */
  let wid = 0
  const show = (par: Object3D, key: Key, way: number, x: number, y: number, z: number, yaw: number, tilt = -0.22, cushion: Material = m.suede) => {
    const M = W[key]
    let cur = way % M.ways.length
    const holder = live(par, `watch${wid++}`, 'rolex')
    holder.position.set(x, y, z)
    holder.rotation.y = yaw
    const fill = () => {
      const inner = new Group()
      holder.add(inner)
      const t = new Group()
      t.rotation.x = tilt
      inner.add(t)
      const w = watch(m, t, specOf(M, cur), cushion)
      inner.position.y = -(w.userData.base as number)
      mergeStatic(inner)
    }
    fill()
    info(s, holder, {
      title: `${M.name}`,
      kind: `Rolex ${M.family} · Oyster Perpetual`,
      body: `${M.note} Drag it to turn it; scroll or pinch to look closer. Pick a dial or metal to see it here in the case.`,
      specs: [`Reference ${M.ways[cur].ref}`, ...M.specs, rupees(M.ways[cur].price)],
      inspect: () => {
        const p = new Group()
        watch(m, p, specOf(M, cur), null)
        return p
      },
      variants: {
        label: 'Dial & metal',
        options: M.ways.map((w) => ({ name: `${w.name} · ${w.ref} · ${rupees(w.price)}`, swatch: w.swatch })),
        current: () => cur,
        pick: (j) => {
          cur = j
          for (const c of [...holder.children]) {
            holder.remove(c)
            c.traverse((o) => (o as Mesh).geometry?.dispose())
          }
          fill()
        },
      },
      choices: { label: 'Wrist size', options: WRISTS },
      action: {
        label: 'Reserve for a viewing',
        run: (wrist) => {
          if (!wrist) return 'Choose your wrist size first, so the bracelet can be sized for you.'
          const w = M.ways[cur]
          reserved.push({ name: M.name, ref: w.ref, way: w.name, wrist, price: w.price })
          return `Reserved the ${M.name} ${w.ref} (${w.name.toLowerCase()}). ${reserved.length} ${reserved.length === 1 ? 'watch' : 'watches'} reserved: confirm your viewing at the reception desk.`
        },
      },
    }, 0.012)
    return holder
  }
  /** A little walnut riser under a watch, so each stands on its own. */
  const riser = (par: Object3D, x: number, y: number, z: number, yaw = 0) => {
    const r = at(par, x, y, z, yaw)
    k.box(r, 0.1, 0.012, 0.09, m.walnut, 0, 0.006, -0.03)
    k.box(r, 0.092, 0.003, 0.082, m.suedeGreen, 0, 0.0135, -0.03, false)
    return 0.015
  }

  /* ---------- floor, walls, ceiling ---------- */
  flat(g, clipped(e, u.rects[0]), Y + 0.006, m.tiles, false, [], 'rolex_floor')
  // Linings on the room side of the party walls: walnut behind the salon, travertine down the right.
  box(s, X0, X1, Y, Y + H, Z0, Z0 + 0.02, m.walnut)
  box(s, X1 - 0.02, X1, Y, Y + H, Z0, Z1, m.travertine)
  // Skirting of bronze.
  box(s, X0, X1, Y, Y + 0.08, Z0 + 0.02, Z0 + 0.03, m.bronze, false)
  box(s, X1 - 0.03, X1 - 0.02, Y, Y + 0.08, Z0, -14.4, m.bronze, false)
  e.shade.foot(X0, Z0 + 0.03, X1, Z0 + 0.03, Y + 0.01, 0.2, 0.22)
  e.shade.foot(X1 - 0.03, Z0, X1 - 0.03, Z1, Y + 0.01, 0.2, 0.22)
  // The olive ceiling, cut away over the counter where a raised white disc lifts, ringed with light.
  const RC = 2.25
  const arc = (r: number, n = 24) => Array.from({ length: n + 1 }, (_, i) => {
    const a = (i / n) * (PI / 2)
    return [X1 - 0.03 - r * Math.cos(a), Z1 - 0.03 - r * Math.sin(a)] as [number, number]
  })
  const coveHole: [number, number][] = [[X1 - 0.03, Z1 - 0.03], ...arc(RC)]
  flat(g, rect(X0, X1, Z0, Z1), Y + H, m.olive, true, [coveHole], 'rolex_ceiling')
  flat(g, coveHole, Y + H + 0.2, m.white, true, [], 'rolex_cove')
  {
    const band = mesh(g, new CylinderGeometry(RC, RC, 0.2, 48, 1, true, -PI, PI / 2), whiteDS, X1 - 0.03, Y + H + 0.1, Z1 - 0.03, false)
    void band
    const pts = arc(RC - 0.06, 30).map(([x, z]) => new Vector3(x, Y + H + 0.015, z))
    mesh(g, new TubeGeometry(new CatmullRomCurve3(pts), 60, 0.012, 6, false), ledWarm, 0, 0, 0, false)
    // Strips along the walls where the disc meets them.
    k.box(g, RC, 0.2, 0.03, m.white, X1 - 0.03 - RC / 2, Y + H + 0.1, Z1 - 0.015, false)
    k.box(g, 0.03, 0.2, RC, m.white, X1 - 0.015, Y + H + 0.1, Z1 - 0.03 - RC / 2, false)
  }
  // Downlights in the olive, two in the white.
  for (const [x, z] of [[-2.9, -14.3], [-0.8, -14.3], [-2.9, -12.8], [-1.6, -12.8], [-0.9, -13.4], [-0.9, -12.0], [-2.9, -11.3], [-2.2, -10.3], [-0.6, -10.0], [-1.2, -10.7]] as const) {
    const inCove = Math.hypot(x - X1, z - Z1) < RC - 0.1
    const yy = inCove ? Y + H + 0.2 : Y + H
    k.cyl(g, 0.05, 0.05, 0.01, inCove ? m.white : m.bronze, x, yy - 0.005, z, 20)
    k.cyl(g, 0.034, 0.034, 0.004, spot, x, yy - 0.011, z, 20)
  }

  /* ---------- the fronts: glass to the west spine (x −3.6) with the door, glass to the rear gallery (z −9.3) ---------- */
  {
    box(s, X0 - 0.075, X0 + 0.075, Y + e.ceiling, soffit, -16.0, Z1 + 0.075, e.m.wallPaint)
    box(s, X0, 0.0, Y + e.ceiling, soffit, Z1 - 0.075, Z1 + 0.075, e.m.wallPaint)
    // The fascias: dark, the green serif name lit under the yellow crown.
    k.box(g, 0.12, 0.6, 6.82, fascia, X0 - 0.02, Y + 3.3, -12.65)
    k.box(g, 3.72, 0.6, 0.12, fascia, -1.8, Y + 3.3, Z1 + 0.02)
    const green = letters(s, 'ROLEX', 'dior', '#22a35a', 512, 128)
    const crown = crownCell(s, '#f5c431')
    brandSign(s, g, crown, 0.22, 0.165, X0 - 0.084, Y + 3.47, -12.65, -PI / 2)
    brandSign(s, g, green, 1.08, 0.27, X0 - 0.084, Y + 3.2, -12.65, -PI / 2)
    brandSign(s, g, crown, 0.22, 0.165, -1.8, Y + 3.47, Z1 + 0.084, 0)
    brandSign(s, g, green, 1.08, 0.27, -1.8, Y + 3.2, Z1 + 0.084, 0)
    const fr = m.bronze
    // West: glass, the walnut portal with its backlit sign, the door, the bronze lattice, glass.
    box(s, X0 - 0.03, X0 + 0.03, Y + 2.95, Y + 3.0, -15.98, Z1, fr)
    for (const z of [-15.96, -14.92, -10.98, -10.14, -9.32]) box(s, X0 - 0.03, X0 + 0.03, Y, Y + 2.95, z - 0.02, z + 0.02, fr)
    pane(s, g, X0, -15.94, X0, -14.94, Y + 0.02, Y + 2.95)
    pane(s, g, X0, -10.96, X0, -10.16, Y + 0.02, Y + 2.95)
    pane(s, g, X0, -10.12, X0, -9.34, Y + 0.02, Y + 2.95)
    box(s, X0 - 0.06, X0 + 0.06, Y, Y + 3.0, -14.9, -13.55, m.walnut)
    box(s, X0 - 0.06, X0 + 0.06, Y + 2.62, Y + 3.0, -13.55, -11.75, m.walnut)
    {
      // The backlit plaque: a white crown and name, lit from behind, set into the walnut.
      const pz = (-14.9 + -13.55) / 2
      k.box(g, 0.01, 0.6, 0.86, fascia, X0 - 0.065, Y + 1.75, pz, false)
      brandSign(s, g, crownCell(s, '#ffffff'), 0.2, 0.15, X0 - 0.072, Y + 1.88, pz, -PI / 2)
      brandSign(s, g, letters(s, 'ROLEX', 'dior', '#ffffff', 512, 128), 0.68, 0.17, X0 - 0.072, Y + 1.66, pz, -PI / 2)
    }
    swingLeaf(s, at(g, X0, Y, -13.55, -PI / 2), 'rolex_r', 0.9, 2.6, fr, -PI / 2, true)
    swingLeaf(s, at(g, X0, Y, -11.75, PI / 2), 'rolex_l', 0.9, 2.6, fr, PI / 2, true)
    box(s, X0 - 0.15, X0 + 0.15, Y, Y + 0.008, -13.55, -11.75, fr, false)
    // The lattice: a bronze frame of diagonals crossing in diamonds, glass behind.
    {
      const L0 = -11.75
      const L1 = -11.0
      const LW = L1 - L0
      const LH = 2.95
      const lat = at(g, X0 - 0.01, Y, (L0 + L1) / 2, -PI / 2)
      for (const [bw, bh, bx, by] of [[LW, 0.04, 0, 0.02], [LW, 0.04, 0, LH - 0.02], [0.04, LH, -LW / 2 + 0.02, LH / 2], [0.04, LH, LW / 2 - 0.02, LH / 2]] as const) k.box(lat, bw, bh, 0.05, fr, bx, by, 0)
      const step = 0.19
      const iw = LW - 0.08
      const ih = LH - 0.08
      for (const dir of [1, -1])
        for (let c = -ih; c <= iw + ih; c += step) {
          // Lines v = u − c (dir 1) or v = c − u (dir −1), clipped to the frame.
          const u0 = dir > 0 ? Math.max(0, c) : Math.max(0, c - ih)
          const u1 = dir > 0 ? Math.min(iw, ih + c) : Math.min(iw, c)
          if (u1 - u0 < 0.02) continue
          const um = (u0 + u1) / 2
          const vm = dir > 0 ? um - c : c - um
          const bar = k.box(lat, (u1 - u0) * Math.SQRT2, 0.014, 0.022, fr, -iw / 2 + um, 0.04 + vm, 0, false)
          bar.rotation.z = (dir * PI) / 4
        }
      pane(s, g, X0 + 0.03, L0 + 0.02, X0 + 0.03, L1 - 0.02, Y + 0.02, Y + 2.95)
    }
    // North: glass in bronze mullions.
    box(s, X0, X1, Y + 2.95, Y + 3.0, Z1 - 0.03, Z1 + 0.03, fr)
    for (const x of [-3.58, -2.42, -1.24, -0.09]) box(s, x - 0.02, x + 0.02, Y, Y + 2.95, Z1 - 0.03, Z1 + 0.03, fr)
    pane(s, g, -3.56, Z1, -2.44, Z1, Y + 0.02, Y + 2.95)
    pane(s, g, -2.4, Z1, -1.26, Z1, Y + 0.02, Y + 2.95)
    pane(s, g, -1.22, Z1, -0.11, Z1, Y + 0.02, Y + 2.95)
    e.shade.foot(X0 - 0.06, -16.0, X0 - 0.06, Z1, Y + 0.01, 0.2, 0.25)
    e.shade.foot(X0, Z1 + 0.06, 0.0, Z1 + 0.06, Y + 0.01, 0.2, 0.25)
  }

  /* ---------- the corner window: wave panels lit behind the glass, watches on bronze ledges ---------- */
  const wavePanel = (par: Object3D, w: number, h: number, y0: number) => {
    const p = new Group()
    par.add(p)
    k.box(p, w + 0.06, h + 0.06, 0.05, m.bronze, 0, y0 + h / 2, 0)
    k.box(p, w, h, 0.056, wave, 0, y0 + h / 2, 0, false)
    // Its foot: a bronze plinth.
    k.box(p, w * 0.5, y0, 0.12, m.bronze, 0, y0 / 2, 0)
    return p
  }
  {
    const north = at(g, -2.6, Y, -9.66, 0)
    wavePanel(north, 1.3, 2.0, 0.5)
    k.box(north, 1.3, 0.025, 0.24, m.bronze, 0, 1.0, 0.14)
    show(north, 'sub', 0, -0.36, 1.0125 + riser(north, -0.36, 1.0125, 0.2), 0.2, 0)
    show(north, 'daydate', 0, 0.0, 1.0125 + riser(north, 0.0, 1.0125, 0.2), 0.2, 0)
    show(north, 'gmt', 0, 0.36, 1.0125 + riser(north, 0.36, 1.0125, 0.2), 0.2, 0)
    const west = at(g, -3.3, Y, -10.4, -PI / 2)
    wavePanel(west, 0.95, 2.0, 0.5)
    k.box(west, 0.95, 0.025, 0.24, m.bronze, 0, 1.0, 0.14)
    show(west, 'op', 0, -0.22, 1.0125 + riser(west, -0.22, 1.0125, 0.2), 0.2, 0)
    show(west, 'lady', 0, 0.22, 1.0125 + riser(west, 0.22, 1.0125, 0.2), 0.2, 0)
    lamp(s, -2.9, Y + 2.7, -9.95, 1.2, 2.4, '#fff1dc')
  }

  /* ---------- the wave wall and the consultation table ---------- */
  {
    const xc = -1.85
    const ww = at(g, xc, Y, Z0 + 0.02, 0)
    k.box(ww, 2.96, 2.0, 0.04, m.bronze, 0, 1.85, 0.02)
    k.box(ww, 2.86, 1.9, 0.012, wave, 0, 1.85, 0.046, false)
    brandSign(s, ww, crownCell(s, '#e2bf68'), 0.3, 0.225, 0, 2.5, 0.055, 0)
    brandSign(s, ww, letters(s, 'ROLEX', 'dior', '#e2bf68', 512, 128), 0.96, 0.24, 0, 2.24, 0.055, 0)
    info(s, ww.children[1], { title: 'The Wave Wall', kind: 'Rolex', body: 'A malachite-green wall of flowing waves lit from within, framed in bronze, the crown and name in gold: the boutique\'s signature.', specs: ['Backlit printed glass, bronze frame'] }, 0.01)
    // The carpet under the salon, bordered in bronze.
    k.box(g, 3.1, 0.01, 2.2, m.bronze, xc, Y + 0.011, -14.65, false)
    k.box(g, 3.02, 0.012, 2.12, m.carpet, xc, Y + 0.012, -14.65, false)
    e.shade.rect(xc, Y + 0.02, -14.65, 3.1, 2.2, 0, 0.1)

    // The table: a bronze frame, a shagreen top in a bronze edge, a walnut apron; the display box on it.
    const t = at(g, xc, Y, -14.85, 0)
    const L = 2.3
    const D = 0.72
    const T = 0.95
    k.box(t, L - 0.05, 0.03, D - 0.05, m.shagreen, 0, T - 0.015, 0)
    for (const [bw, bd, bx, bz] of [[L, 0.025, 0, D / 2 - 0.0125], [L, 0.025, 0, -D / 2 + 0.0125], [0.025, D, L / 2 - 0.0125, 0], [0.025, D, -L / 2 + 0.0125, 0]] as const) k.box(t, bw, 0.04, bd, m.bronze, bx, T - 0.02, bz)
    k.box(t, L - 0.3, 0.12, 0.02, m.walnut, 0, T - 0.1, D / 2 - 0.08)
    for (const sx of [-1, 1]) {
      const lx = sx * (L / 2 - 0.16)
      for (const sz of [-1, 1]) k.box(t, 0.04, T - 0.04, 0.04, m.bronze, lx, (T - 0.04) / 2, sz * (D / 2 - 0.08))
      k.box(t, 0.04, 0.04, D - 0.12, m.bronze, lx, T - 0.06, 0)
      k.box(t, 0.04, 0.03, D - 0.12, m.bronze, lx, 0.015, 0)
    }
    const foot = mesh(t, new CylinderGeometry(0.014, 0.014, L - 0.36, 12), m.bronze, 0, 0.24, D / 2 - 0.08)
    foot.rotation.z = PI / 2
    e.shade.rect(xc, Y + 0.02, -14.85, L, D, 0, 0.35)
    info(s, t.children[0], { title: 'Consultation Table', kind: 'Rolex · The salon', body: 'A long table in bronze with a shagreen top, where watches are brought out, tried on and sized. Tap the glass box to lift its lid.', specs: ['Bronze, shagreen, walnut', '230 × 72 cm'] }, 0)
    // The leather tray and a loupe for the client, on the table.
    k.box(t, 0.32, 0.008, 0.22, boxGreen, 0.55, T + 0.004, 0.1)
    const lp = at(t, 0.85, T, 0.12, 0.4)
    mesh(lp, new CylinderGeometry(0.016, 0.02, 0.025, 20), m.ceramicBlack, 0, 0.0125, 0)
    // The glazed display box: a bronze base, glass walls, a lid that lifts.
    const bx = at(t, -0.5, T, 0.04, 0)
    const BW = 0.62
    const BD = 0.34
    const BH = 0.17
    k.box(bx, BW, 0.03, BD, m.bronze, 0, 0.015, 0)
    k.box(bx, BW - 0.04, 0.012, BD - 0.04, m.suedeGreen, 0, 0.036, 0, false)
    const gl = clickThrough(bx, 'rolex_box')
    for (const [w2, d2, x2, z2] of [[BW, 0.006, 0, BD / 2], [BW, 0.006, 0, -BD / 2], [0.006, BD, BW / 2, 0], [0.006, BD, -BW / 2, 0]] as const) k.box(gl.g, w2, BH, d2, m.glass, x2, 0.03 + BH / 2, z2, false)
    for (const [x2, z2] of [[BW / 2, BD / 2], [-BW / 2, BD / 2], [BW / 2, -BD / 2], [-BW / 2, -BD / 2]] as const) k.box(gl.g, 0.012, BH, 0.012, m.bronze, x2, 0.03 + BH / 2, z2, false)
    gl.seal()
    const hinge = at(bx, 0, 0.03 + BH, -BD / 2, 0)
    const lid = new Group()
    lid.name = 'door_rolex_box_lid'
    lid.userData.label = 'Display box lid'
    lid.userData.axis = 'x'
    lid.userData.openAngle = -1.15
    hinge.add(lid)
    k.box(lid, BW, 0.008, BD, m.glass, 0, 0.004, BD / 2, false).userData.front = true
    for (const [w2, d2, x2, z2] of [[BW, 0.014, 0, BD - 0.007], [BW, 0.014, 0, 0.007], [0.014, BD, BW / 2 - 0.007, BD / 2], [0.014, BD, -BW / 2 + 0.007, BD / 2]] as const) k.box(lid, w2, 0.014, d2, m.bronze, x2, 0.007, z2, false)
    show(bx, 'daytona', 0, -0.15, 0.042, 0.0, 0, -0.38)
    show(bx, 'daydate', 2, 0.15, 0.042, 0.0, 0, -0.38)

    // Two teal velvet bucket bar stools on bronze pedestals, facing the table.
    const backProfile = [[0.17, 0.69], [0.205, 0.72], [0.225, 0.8], [0.232, 0.94], [0.218, 0.97], [0.2, 0.94], [0.196, 0.8], [0.17, 0.72], [0.17, 0.69]].map(([r, h]) => new Vector2(r, h))
    for (const x of [-2.5, -1.2]) {
      const st = at(g, x, Y, -14.12, PI)
      mesh(st, new CylinderGeometry(0.2, 0.18, 0.07, 40), m.teal, 0, 0.665, 0)
      const top = mesh(st, new SphereGeometry(1, 40, 10, 0, PI * 2, 0, PI / 2), m.teal, 0, 0.7, 0)
      top.scale.set(0.2, 0.025, 0.2)
      mesh(st, new LatheGeometry(backProfile, 40, PI * 0.32, PI * 1.36), m.teal, 0, 0, 0)
      k.cyl(st, 0.16, 0.16, 0.02, m.bronze, 0, 0.62, 0, 32)
      k.cyl(st, 0.024, 0.024, 0.6, m.bronze, 0, 0.32, 0, 16)
      k.cyl(st, 0.2, 0.21, 0.018, m.bronze, 0, 0.009, 0, 40)
      const ring = mesh(st, new TorusGeometry(0.17, 0.009, 8, 40), m.bronze, 0, 0.3, 0)
      ring.rotation.x = PI / 2
      for (const a of [0, PI / 2, PI, PI * 1.5]) {
        const sp = k.box(st, 0.17, 0.012, 0.012, m.bronze, (Math.cos(a) * 0.17) / 2, 0.3, (Math.sin(a) * 0.17) / 2)
        sp.rotation.y = -a
      }
      e.shade.pool(x, Y + 0.02, -14.12, 0.24, 0.24, 0.4)
      info(s, st, { title: 'Bar Stool', kind: 'Rolex · The salon', body: 'A bucket stool upholstered in teal velvet on a bronze pedestal with a foot ring.', specs: ['Cotton velvet, cast bronze', 'Seat height 70 cm'] }, 0)
    }
    // The staff's stool behind the table.
    {
      const st = at(g, xc, Y, -15.55, 0)
      k.cyl(st, 0.17, 0.17, 0.06, m.walnut, 0, 0.66, 0, 32)
      k.cyl(st, 0.022, 0.022, 0.62, m.bronze, 0, 0.32, 0, 12)
      k.cyl(st, 0.18, 0.19, 0.016, m.bronze, 0, 0.008, 0, 32)
    }
    // Amber glass bell pendants on brass disc canopies.
    const bell = [[0.028, 0], [0.04, -0.015], [0.075, -0.05], [0.105, -0.11], [0.125, -0.18], [0.14, -0.24], [0.15, -0.275], [0.152, -0.285]].map(([r, h]) => new Vector2(r, h))
    for (const x of [-2.62, -1.08]) {
      const p = at(g, x, Y + H, -14.85, 0)
      k.cyl(p, 0.1, 0.1, 0.014, gold, 0, -0.007, 0, 32)
      k.cyl(p, 0.003, 0.003, 1.08, gold, 0, -0.55, 0, 6)
      k.cyl(p, 0.03, 0.026, 0.06, gold, 0, -1.1, 0, 20)
      mesh(p, new LatheGeometry(bell, 40), amber, 0, -1.12, 0, false)
      mesh(p, new SphereGeometry(0.035, 16, 12), bulb, 0, -1.2, 0, false)
      mesh(p, new TorusGeometry(0.152, 0.004, 8, 48), gold, 0, -1.405, 0, false).rotation.x = PI / 2
    }
    lamp(s, xc, Y + 1.9, -14.85, 1.6, 3.2, '#ffb565')
  }

  /* ---------- the right wall: travertine and a framed study; the walnut niche showcases ---------- */
  {
    const art = at(g, X1 - 0.02, Y + 1.6, -15.15, -PI / 2)
    k.box(art, 0.78, 0.98, 0.035, m.bronze, 0, 0, 0.0175)
    const study = m.canvas(384, 480, (c, w, h) => {
      c.fillStyle = '#0d3b30'
      c.fillRect(0, 0, w, h)
      const gr = c.createRadialGradient(w / 2, h * 0.42, 10, w / 2, h * 0.42, w * 0.7)
      gr.addColorStop(0, 'rgba(60,140,110,.55)')
      gr.addColorStop(1, 'rgba(0,0,0,0)')
      c.fillStyle = gr
      c.fillRect(0, 0, w, h)
      // An Oyster drawn as a study: the case, its bezel, the dial, the bracelet running off the page.
      const cx = w / 2
      const cy = h * 0.42
      const r = w * 0.27
      c.fillStyle = '#c9a65a'
      c.fillRect(cx - r * 0.62, 0, r * 1.24, h)
      c.fillStyle = 'rgba(0,0,0,.25)'
      for (let y = 0; y < h; y += 18) c.fillRect(cx - r * 0.62, y, r * 1.24, 2)
      c.fillStyle = '#d9b86a'
      c.beginPath()
      c.arc(cx, cy, r * 1.12, 0, 7)
      c.fill()
      c.strokeStyle = '#8a6a2a'
      c.lineWidth = 2
      for (let i = 0; i < 90; i++) {
        const a = (i / 90) * PI * 2
        c.beginPath()
        c.moveTo(cx + Math.cos(a) * r * 0.98, cy + Math.sin(a) * r * 0.98)
        c.lineTo(cx + Math.cos(a) * r * 1.1, cy + Math.sin(a) * r * 1.1)
        c.stroke()
      }
      c.fillStyle = '#123f33'
      c.beginPath()
      c.arc(cx, cy, r * 0.95, 0, 7)
      c.fill()
      c.fillStyle = '#e8cf8e'
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * PI * 2
        c.save()
        c.translate(cx + Math.sin(a) * r * 0.78, cy - Math.cos(a) * r * 0.78)
        c.rotate(a)
        c.fillRect(-3, -10, 6, 20)
        c.restore()
      }
      c.strokeStyle = '#e8cf8e'
      c.lineCap = 'round'
      c.lineWidth = 7
      c.beginPath()
      c.moveTo(cx, cy)
      c.lineTo(cx - r * 0.42, cy - r * 0.22)
      c.stroke()
      c.lineWidth = 5
      c.beginPath()
      c.moveTo(cx, cy)
      c.lineTo(cx + r * 0.36, cy - r * 0.62)
      c.stroke()
      c.fillStyle = '#e8cf8e'
      c.textAlign = 'center'
      c.font = '600 22px "Cormorant Garamond", Georgia, serif'
      c.fillText('OYSTER PERPETUAL', cx, h * 0.86)
      c.font = '400 13px "Inter", Arial, sans-serif'
      c.fillText('A CROWN FOR EVERY ACHIEVEMENT', cx, h * 0.91)
    })
    mesh(art, new PlaneGeometry(0.68, 0.88), m.std({ map: study, roughness: 0.7 }, 0.05), 0, 0, 0.037, false)
    info(s, art, { title: 'The Oyster, a Study', kind: 'Artwork · Rolex', body: 'A painted study of the Oyster Perpetual on deep green, framed in bronze against the travertine.', specs: ['Oil on linen, bronze frame', '78 × 98 cm'] }, 0.01)
  }
  {
    const BZ0 = -14.35
    const BZ1 = -11.25
    const zm = (BZ0 + BZ1) / 2
    const L = BZ1 - BZ0
    const D = 0.42
    const bays = 3
    const pitch = L / bays
    const OW = 0.8
    const O0 = 0.95
    const O1 = 2.3
    const CW = 0.86
    // The build-out stands against the travertine, facing −x; local +x runs towards +z.
    const w = at(g, X1 - 0.02, Y, zm, -PI / 2)
    const plate = new Shape()
    plate.moveTo(-L / 2, 0)
    plate.lineTo(L / 2, 0)
    plate.lineTo(L / 2, H)
    plate.lineTo(-L / 2, H)
    plate.closePath()
    const centres = Array.from({ length: bays }, (_, i) => -L / 2 + pitch * (i + 0.5))
    const hole = (x0: number, x1: number, y0: number, y1: number) => {
      const p = new Shape()
      p.moveTo(x0, y0)
      p.lineTo(x0, y1)
      p.lineTo(x1, y1)
      p.lineTo(x1, y0)
      p.closePath()
      return p
    }
    for (const uc of centres) {
      plate.holes.push(hole(uc - OW / 2, uc + OW / 2, O0, O1))
      plate.holes.push(hole(uc - CW / 2, uc + CW / 2, 0.1, 0.88))
    }
    mesh(w, new ExtrudeGeometry(plate, { depth: 0.03, bevelEnabled: false }), m.walnut, 0, 0, D - 0.03)
    for (const su of [-L / 2, L / 2]) k.box(w, 0.02, H, D, m.walnut, su + (su < 0 ? 0.01 : -0.01), H / 2, D / 2, false)
    k.box(w, L, 0.08, 0.012, m.bronze, 0, 0.04, D + 0.006, false)
    let did = 0
    let cid = 0
    const SHOW: [Key, number][][] = [
      [['sub', 1], ['gmt', 1], ['datejust', 0], ['lady', 0], ['explorer', 0], ['op', 4]],
      [['daydate', 1], ['sky', 0], ['daydate', 3], ['datejust', 1], ['op', 1], ['lady', 2]],
      [['yacht', 0], ['p1908', 0], ['daytona', 1], ['datejust', 2], ['op', 3], ['p1908', 1]],
    ]
    centres.forEach((uc, bi) => {
      const n = at(w, uc, 0, 0, 0)
      // The niche: walnut sides and top, its back lit warm, a line of light under its head, bronze round its edge.
      const nd = D - 0.03
      k.box(n, OW, O1 - O0, 0.012, nicheBack, 0, (O0 + O1) / 2, 0.006, false)
      for (const sx of [-1, 1]) k.box(n, 0.012, O1 - O0, nd, m.walnut, sx * (OW / 2 - 0.006), (O0 + O1) / 2, nd / 2, false)
      k.box(n, OW, 0.012, nd, m.walnut, 0, O1 - 0.006, nd / 2, false)
      k.box(n, OW - 0.04, 0.006, 0.012, ledWarm, 0, O1 - 0.016, nd - 0.04, false)
      k.box(n, OW, 0.03, nd, m.walnut, 0, O0 + 0.015, nd / 2, false)
      k.box(n, OW - 0.02, 0.004, nd - 0.02, m.suedeGreen, 0, O0 + 0.032, nd / 2, false)
      for (const [bw, bh, bx2, by2] of [[OW + 0.04, 0.02, 0, O0 - 0.01], [OW + 0.04, 0.02, 0, O1 + 0.01], [0.02, O1 - O0 + 0.04, -OW / 2 - 0.01, (O0 + O1) / 2], [0.02, O1 - O0 + 0.04, OW / 2 + 0.01, (O0 + O1) / 2]] as const) k.box(n, bw, bh, 0.012, m.bronze, bx2, by2, D + 0.006, false)
      // A glass shelf on bronze pins.
      const SY = 1.62
      k.box(n, OW - 0.03, 0.012, nd - 0.06, m.glass, 0, SY, nd / 2 - 0.02, false)
      k.box(n, OW - 0.03, 0.016, 0.01, m.bronze, 0, SY, nd - 0.05, false)
      const items = SHOW[bi]
      ;[[-0.25, O0 + 0.034], [0, O0 + 0.034], [0.25, O0 + 0.034], [-0.25, SY + 0.006], [0, SY + 0.006], [0.25, SY + 0.006]].forEach(([x, y], j) => {
        const [key, way] = items[j]
        show(n, key, way, x, y + riser(n, x, y, nd - 0.13), nd - 0.13, 0, -0.2)
      })
      // The cabinet below: two drawers over a pair of doors.
      k.box(n, CW, 0.78, 0.012, m.walnut, 0, 0.49, 0.03, false)
      for (const sx of [-1, 1] as const) {
        const dr = new Group()
        dr.name = `drawer_rolex_${did++}`
        dr.userData.label = 'Drawer'
        dr.userData.slide = [0, 0, 0.3]
        dr.position.set((sx * CW) / 4, 0.79, D - 0.02)
        n.add(dr)
        const front = k.soft(dr, CW / 2 - 0.02, 0.16, 0.02, 0.003, m.walnut, 0, 0, 0.01)
        front.userData.front = true
        k.box(dr, 0.12, 0.012, 0.016, m.bronze, 0, 0, 0.026)
        const inside = new Group()
        inside.name = 'contents'
        dr.add(inside)
        k.box(inside, CW / 2 - 0.05, 0.1, 0.34, m.walnut, 0, -0.02, -0.17, false)
        k.box(inside, CW / 2 - 0.07, 0.005, 0.32, m.suedeGreen, 0, 0.033, -0.17, false)
        // Rolex boxes in green leather, the crown on each lid.
        for (let q = 0; q < 3; q++) {
          k.box(inside, 0.1, 0.06, 0.09, boxGreen, -0.12 + q * 0.12, 0.066, -0.1, false)
          k.box(inside, 0.03, 0.002, 0.02, gold, -0.12 + q * 0.12, 0.097, -0.1, false)
        }
        k.box(inside, 0.3, 0.004, 0.12, m.cream, 0, 0.038, -0.26, false)
      }
      for (const sx of [-1, 1] as const) {
        const h = at(n, sx * (CW / 2 - 0.005), 0.12, D - 0.02, 0)
        const leaf = new Group()
        leaf.name = `door_rolex_cab_${cid++}`
        leaf.userData.label = 'Cabinet door'
        leaf.userData.openAngle = sx < 0 ? -1.6 : 1.6
        h.add(leaf)
        const dw = CW / 2 - 0.01
        const front = k.soft(leaf, dw, 0.56, 0.02, 0.003, m.walnut, (-sx * dw) / 2, 0.28, 0.01)
        front.userData.front = true
        k.box(leaf, 0.012, 0.16, 0.016, m.bronze, -sx * (dw - 0.05), 0.42, 0.026)
      }
      // Inside the cupboard: a shelf of boxes and the guarantee wallets.
      k.box(n, CW - 0.04, 0.012, D - 0.1, m.walnut, 0, 0.4, D / 2 - 0.02, false)
      for (let q = 0; q < 4; q++) k.box(n, 0.16, 0.12, 0.14, boxGreen, -0.3 + q * 0.2, 0.18, D / 2 - 0.04, false)
      for (let q = 0; q < 3; q++) k.box(n, 0.18, 0.1, 0.16, boxGreen, -0.22 + q * 0.22, 0.47, D / 2 - 0.04, false)
      info(s, n.children[0], { title: 'Niche Showcase', kind: 'Rolex', body: 'A lit walnut niche of watches over a cabinet: the drawers hold the boxes and the papers, the doors the stock. Tap a drawer or door to open it.', specs: ['Walnut, bronze, glass', 'Suede beds'] }, 0)
    })
    e.shade.rect(X1 - D / 2, Y + 0.012, zm, D + 0.12, L, 0, 0.35)
    lamp(s, -0.95, Y + 2.2, zm, 1.6, 3.0, '#ffd8a8')
  }

  /* ---------- the reception counter: a curved cream quarter-ring in the far corner ---------- */
  {
    const c = at(g, X1, Y, Z1, 0)
    const RI = 1.3
    const RO = 1.85
    const A0 = PI * 0.64
    const A1 = PI - 0.035
    // Shape (u, v) becomes plan (u, −v) once stood up: v positive reaches into the shop.
    const sector = (ri: number, ro: number, a0 = A0, a1 = A1) => {
      const sh = new Shape()
      sh.moveTo(ro * Math.cos(a0), ro * Math.sin(a0))
      sh.absarc(0, 0, ro, a0, a1, false)
      sh.lineTo(ri * Math.cos(a1), ri * Math.sin(a1))
      sh.absarc(0, 0, ri, a1, a0, true)
      sh.closePath()
      return sh
    }
    const stand = (sh: Shape, y0: number, h: number, mat: Material, cast = true) => {
      const geo = new ExtrudeGeometry(sh, { depth: h, bevelEnabled: false, curveSegments: 48 })
      geo.rotateX(-PI / 2)
      return mesh(c, geo, mat, 0, y0, 0, cast)
    }
    const body = stand(sector(RI, RO), 0.09, 0.9, m.cream)
    stand(sector(RI + 0.04, RO - 0.06), 0, 0.09, m.bronze, false)
    stand(sector(RO - 0.075, RO - 0.06), 0.07, 0.012, ledWarm, false)
    stand(sector(RI - 0.02, RO + 0.035, A0 - 0.02, A1), 0.99, 0.04, m.travertine)
    stand(sector(RO + 0.001, RO + 0.006), 0.84, 0.012, m.bronze, false)
    e.shade.pool(X1 - 1.1, Y + 0.02, Z1 - 1.1, 1.1, 1.1, 0.25)
    info(s, body, { title: 'Reception Counter', kind: 'Rolex', body: 'A curved counter in cream lacquer under a travertine top, lit along its foot: the screen confirms your viewing; the drawers on the staff side open.', specs: ['Lacquer, travertine, bronze'] }, 0)
    const yawOut = (a: number) => Math.atan2(Math.cos(a), -Math.sin(a))
    const P = (r: number, a: number) => [r * Math.cos(a), -r * Math.sin(a)] as const
    // A small vitrine of two watches on the counter top.
    {
      const a = PI * 0.83
      const [vx, vz] = P((RI + RO) / 2, a)
      const v = at(c, vx, 1.03, vz, yawOut(a))
      k.box(v, 0.5, 0.025, 0.28, m.bronze, 0, 0.0125, 0)
      k.box(v, 0.47, 0.006, 0.25, m.suedeGreen, 0, 0.028, 0, false)
      const gl = clickThrough(v, 'rolex_vitrine')
      for (const [w2, d2, x2, z2] of [[0.5, 0.006, 0, 0.14], [0.5, 0.006, 0, -0.14], [0.006, 0.28, 0.25, 0], [0.006, 0.28, -0.25, 0]] as const) k.box(gl.g, w2, 0.16, d2, m.glass, x2, 0.105, z2, false)
      k.box(gl.g, 0.5, 0.006, 0.28, m.glass, 0, 0.188, 0, false)
      gl.seal()
      show(v, 'op', 2, -0.11, 0.031, 0.0, 0, -0.32)
      show(v, 'sky', 1, 0.11, 0.031, 0.0, 0, -0.32)
    }
    // The screen on its stand, a card machine, a pen tray: on the staff side.
    {
      const a = PI * 0.7
      const [tx, tz] = P(RI + 0.18, a)
      const till = at(c, tx, 1.03, tz, yawOut(a) + PI)
      k.cyl(till, 0.06, 0.07, 0.012, m.bronze, 0, 0.006, 0, 32)
      k.cyl(till, 0.011, 0.011, 0.16, m.bronze, 0, 0.09, 0, 12)
      const head = at(till, 0, 0.22, 0, 0)
      head.rotation.x = -0.35
      k.box(head, 0.27, 0.18, 0.012, m.bronze, 0, 0, 0)
      const scr = m.canvas(384, 256, (cx, w, h) => {
        cx.fillStyle = '#f6f2ea'
        cx.fillRect(0, 0, w, h)
        cx.fillStyle = '#0d4a37'
        cx.fillRect(0, 0, w, 44)
        cx.fillStyle = '#e2bf68'
        cx.textAlign = 'center'
        cx.font = '600 24px "Cormorant Garamond", Georgia, serif'
        cx.fillText('ROLEX', w / 2, 30)
        cx.fillStyle = '#2a2a26'
        cx.font = '500 24px "Inter", Arial, sans-serif'
        cx.fillText('Your viewing', w / 2, h * 0.55)
        cx.font = '400 15px "Inter", Arial, sans-serif'
        cx.fillText('Tap to see your reserved watches', w / 2, h * 0.75)
      })
      const sm = m.std({ map: scr, emissiveMap: scr, emissive: '#ffffff', emissiveIntensity: 0.5, roughness: 0.3 }, 0.1)
      const btn = button(head, 'reception', 'Reception', 'Confirm viewing', 0, 0, 0.007, () => useInfoStore.getState().show({ ...reception(), place: `First Floor · ${s.u.name} (${s.u.id})` }), 'rolex')
      mesh(btn, new PlaneGeometry(0.25, 0.165), sm, 0, 0, 0, false)
      const [px, pz] = P(RI + 0.16, PI * 0.76)
      const pos = at(c, px, 1.03, pz, yawOut(PI * 0.76) + PI)
      k.box(pos, 0.08, 0.02, 0.16, m.ceramicBlack, 0, 0.01, 0)
      k.box(pos, 0.06, 0.002, 0.06, m.std({ color: '#203040', emissive: '#4a7aa0', emissiveIntensity: 0.4 }), 0, 0.021, -0.035, false)
      const [nx, nz] = P(RI + 0.2, PI * 0.93)
      const tray = at(c, nx, 1.03, nz, yawOut(PI * 0.93) + PI)
      k.box(tray, 0.24, 0.012, 0.12, boxGreen, 0, 0.006, 0)
      const pen = mesh(tray, new CylinderGeometry(0.005, 0.005, 0.14, 10), gold, 0, 0.018, 0, false)
      pen.rotation.z = PI / 2
    }
    // Drawers on the staff side, facing the corner.
    let qd = 0
    for (const a of [PI * 0.74, PI * 0.88]) {
      const [dx, dz] = P(RI, a)
      const hold = at(c, dx, 0.82, dz, yawOut(a) + PI)
      const dr = new Group()
      dr.name = `drawer_rolex_desk_${qd++}`
      dr.userData.label = 'Drawer'
      dr.userData.slide = [0, 0, 0.28]
      hold.add(dr)
      const front = k.box(dr, 0.4, 0.15, 0.02, m.cream, 0, 0, 0.012)
      front.userData.front = true
      k.box(dr, 0.1, 0.01, 0.014, m.bronze, 0, 0, 0.028)
      const inside = new Group()
      inside.name = 'contents'
      dr.add(inside)
      k.box(inside, 0.36, 0.09, 0.3, m.walnut, 0, -0.02, -0.15, false)
      k.box(inside, 0.2, 0.004, 0.14, m.cream, -0.05, 0.027, -0.12, false)
      k.box(inside, 0.08, 0.04, 0.06, boxGreen, 0.1, 0.045, -0.18, false)
    }
    lamp(s, X1 - 1.0, Y + 3.1, Z1 - 1.0, 2.2, 4.0, '#fff1dc')
  }

  /* ---------- lighting and switches ---------- */
  // Warm and low, as the reference: the salon's light pooled on the table and the displays.
  lamp(s, -2.0, Y + 3.0, -12.6, 3.2, 6.0, '#ffe8cc')
  lamp(s, -1.85, Y + 3.0, -14.6, 2.4, 4.5, '#ffe8cc')
  {
    const sw = new Group()
    sw.position.set(X0 + 0.062, Y + 1.2, -14.1)
    sw.rotation.y = PI / 2
    g.add(sw)
    const plate = switchPlate(k, sw, 'rolex', ['switch', 'switch'], { plate: m.bronze, rocker: m.bronze, dark: fascia, locator: lux.ledCool as MeshStandardMaterial }, [s.circuit, display])
    plate.traverse((o) => {
      if (o.name === 'switch_rolex_0') o.userData.label = 'Boutique lights'
      if (o.name === 'switch_rolex_1') o.userData.label = 'Wave walls, showcases & pendants'
    })
    setCircuit(s.circuit, true)
    setCircuit(display, true)
  }
  return s
}

export type { WatchMaterials }
