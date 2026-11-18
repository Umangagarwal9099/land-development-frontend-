/*
 * Terranova Mall, G+4: the floor-wise space allocation, as plain data (no three.js), shared by the
 * 3D model (./index.ts and friends) and the property's room list (api/mock/properties.ts).
 *
 * Site frame as in ../plan.ts: +x north, +z east (the road the mall faces), metres, origin at the
 * plot centre. Every floor shares one structure, stacked:
 *
 *   atrium     a void 11.4 × 7.3 m behind the entrance, open from the first floor to a skylight;
 *              its length is exactly one storey's escalator run, so each escalator spans it from
 *              edge to edge, in two lanes that rise in turn front and back (see ESCALATORS).
 *   galleries  a ring of public walkways round it: the west spine (lift lobby, washrooms), the
 *              front gallery and the lounge behind the entrance glass, the east spine, the rear
 *              gallery; a service corridor along the back joins them to the fire stairs.
 *   cores      two passenger lifts (B2 to the fourth floor) off the west spine; three fire stairs,
 *              each continuous from the ground (where it opens outside) to the fourth floor.
 *   shops      round the outside of the ring, from the galleries to the façade.
 *
 * At ground level the basement ramps rise through the back half of the floor in walled tunnels
 * (they are the car park's and are left exactly as built), so the ground floor's back is service
 * space, with the escalators' foot between the two tunnels.
 */

export type Rect = [x0: number, x1: number, z0: number, z1: number]

/** A shopfront: the line x = at (axis 'x') or z = at (axis 'z'), from `from` to `to` along it. */
export interface Front {
  axis: 'x' | 'z'
  at: number
  from: number
  to: number
  /** Width of the entrance opening, centred; 0 for an all-glass display front, the whole length for an open counter. */
  door?: number
}

export type UnitKind = 'shop' | 'anchor' | 'cafe' | 'food' | 'kiosk' | 'service' | 'washroom' | 'lounge'

export interface Unit {
  id: string
  name: string
  /** What the space is let for (the shop interiors come later). */
  use: string
  kind: UnitKind
  rects: Rect[]
  fronts: Front[]
  /** A shop whose interior is built (see ../interior/shops): the shell leaves it to its fit-out. */
  fitout?: 'dior' | 'prada' | 'starbucks' | 'cosmetics' | 'apple' | 'perfume' | 'heels' | 'dessert' | 'decor' | 'women' | 'bags'
}

/** A marked zone inside one of the big open spaces (the gaming hall, the cinema). */
export interface Zone {
  id: string
  name: string
  rect: Rect
  /** Floor finish that marks it out. */
  finish: 'lanes' | 'approach' | 'arcade' | 'vr' | 'racing' | 'esports' | 'hockey' | 'kids' | 'counter' | 'audi' | 'foyer' | 'concession' | 'boxoffice' | 'cinemaWc'
}

export interface FloorPlan {
  level: number
  /** Short name for labels: G, 1 … 4. */
  label: string
  title: string
  units: Unit[]
  /** Public walkways and lounges, in polished stone. */
  commons: Rect[]
  /** One big open space (the third floor's gaming hall, the fourth's cinema), and its marked zones. */
  hall?: { id: string; name: string; rects: Rect[]; zones: Zone[]; doors: Front[] }
}

/* ---------- levels ---------- */

export const GL = 0.45
export const LEVELS = [GL, 5.85, 10.65, 15.45, 20.25]
export const ROOF = 26.25

/* ---------- plan lines ---------- */

/** Inner face of the outer wall above the ground (the skin's backing), and of the ground floor's glass. */
export const ENV = { x0: -18.0, x1: 18.0, z0: -25.6, z1: 13.1, link: 10.45 }
export const ENV_G = { x0: -17.06, x1: 17.06, z0: -24.7, z1: 12.2, link: 9.5 }

/** The west spine (lift lobby) and the east spine, either side of the atrium. */
export const XW = -6.6
export const XV0 = -3.6
export const XV1 = 7.8
export const XE = 11.3
/** The link between the two blocks, behind the entrance. */
export const LINK_X0 = -6.6
export const LINK_X1 = 4.6

/** Escalator geometry: 30°, two flat steps at each end, a 1 m transition radius each side. */
export const ESC = { slope: Math.tan(Math.PI / 6), flat: 0.8, ease: 1.0, width: 1.64 }
/** The atrium void: one storey's straight run long (4.8 m rise at 30°, less the transitions). */
export const VOID: Rect = [XV0, XV1, -3.4, -3.4 + 4.8 / ESC.slope - ESC.ease]
export const VZ0 = VOID[2]
export const VZ1 = VOID[3]
/**
 * Front and rear galleries. At the ground only the back is a landing (lane A's foot) and the
 * front shops stand at ZFG; on the upper floors, where escalators arrive at the front (1, 3) and
 * the back (2, 4), the shops facing them stand further back: 4.1 m clear beyond the comb plate.
 */
export const ZFG = 8.3
export const ZRG = -7.8
export const ZFG_U = 9.8
export const ZRG_U = -9.3
/** The service corridor along the back. */
export const ZSC0 = -18.0
export const ZSC1 = -16.0

/**
 * The escalators. Lane A (east side of the void) rises towards the front: ground to first, second
 * to third; lane B (west side) rises towards the back: first to second, third to fourth. So a
 * visitor going up steps off one, turns round and steps onto the next along the same gallery.
 * Each lane is a pair, one running up and one down.
 */
export const LANES = { A: [5.05, 6.75], B: [-2.75, -1.05] }
export interface EscalatorSpec {
  id: string
  /** Lane centre line. */
  x: number
  from: number
  to: number
  /** +1 rises towards +z (the front), −1 towards the back. */
  rises: 1 | -1
  up: boolean
}
export const ESCALATORS: EscalatorSpec[] = [
  { id: 'G1', from: 0, to: 1, rises: 1, x: LANES.A[1], up: true },
  { id: 'G1d', from: 0, to: 1, rises: 1, x: LANES.A[0], up: false },
  { id: '12', from: 1, to: 2, rises: -1, x: LANES.B[0], up: true },
  { id: '12d', from: 1, to: 2, rises: -1, x: LANES.B[1], up: false },
  { id: '23', from: 2, to: 3, rises: 1, x: LANES.A[1], up: true },
  { id: '23d', from: 2, to: 3, rises: 1, x: LANES.A[0], up: false },
  { id: '34', from: 3, to: 4, rises: -1, x: LANES.B[0], up: true },
  { id: '34d', from: 3, to: 4, rises: -1, x: LANES.B[1], up: false },
]

/**
 * The two passenger lifts, side by side in the west spine's wall, doors facing east. Below ground
 * they stand in the west row of bays, set between the row's columns so that the move from the
 * reference's single lift beside the lobby costs the car park one bay a level.
 */
export const LIFTS = { x0: -8.85, x1: XW, z0: -15.7, z1: -11.1, cars: [{ x: -7.65, z: -12.3 }, { x: -7.65, z: -14.5 }] }
/** The front of the lift and washroom block, where the south wing's units begin. */
export const ZWC = LIFTS.z1

/** Fire stairs: the flights' zone inside the walls, which end is the landing, and where the door is. */
export interface StairPlan {
  id: string
  name: string
  zone: Rect
  entry: '+z' | '-z' | '+x' | '-x'
  door: '+z' | '-z' | '+x' | '-x'
  /** The door's centre along its face. */
  at: number
  /** At the ground: the exit door out of the building, on this face at this point. */
  exit: { face: '+z' | '-z' | '+x' | '-x'; at: number }
}
export const STAIRS: StairPlan[] = [
  { id: 'FS1', name: 'FIRE STAIR 1', zone: [-16.8, -13.6, -24.45, -18.2], entry: '+z', door: '+z', at: -15.2, exit: { face: '-x', at: -19.0 } },
  { id: 'FS2', name: 'FIRE STAIR 2', zone: [13.3, 16.6, -3.2, 3.3], entry: '+z', door: '-x', at: 2.6, exit: { face: '+x', at: 2.6 } },
  { id: 'FS3', name: 'FIRE STAIR 3', zone: [6.2, 9.4, -24.45, -18.2], entry: '+z', door: '+z', at: 7.8, exit: { face: '+z', at: 7.8 } },
]

/** Structural columns round the atrium, clad in stone, floor to soffit on every level. */
export const COLUMNS: [number, number][] = [[-4.3, -3.95], [-4.3, 4.45], [8.4, -3.95], [8.4, 4.45]]

/* ---------- the washroom block, stacked on every floor behind the lifts ---------- */

/**
 * The washrooms, stacked on every floor, each with one door off the service corridor: the Ladies
 * takes the whole strip across the corridor (on the upper floors the old plant room, whose air
 * handler now shares the stores; at the ground the strip in front of a shallower loading dock),
 * the Gents the block behind the lifts. Each has an accessible cubicle inside it. `back` is how
 * far back the Ladies reaches.
 */
export const WC_DOORS = { ladies: [-8.2, -7.0], gents: [-10.3, -9.1] }
const washrooms = (x0: number, back: number): Unit[] => [
  { id: 'WC-L', name: 'Ladies', use: 'Ladies washroom, with an accessible cubicle', kind: 'washroom', rects: [[-13.4, XV0, back, ZSC0]], fronts: [{ axis: 'z', at: ZSC0, from: WC_DOORS.ladies[0], to: WC_DOORS.ladies[1], door: 1.2 }] },
  { id: 'WC-G', name: 'Gents', use: 'Gents washroom, with an accessible cubicle', kind: 'washroom', rects: [[x0, LIFTS.x0, ZSC1, ZWC]], fronts: [{ axis: 'z', at: ZSC1, from: WC_DOORS.gents[0], to: WC_DOORS.gents[1], door: 1.2 }] },
]

/** Back-of-house rooms along the rear of an upper floor, off the service corridor. */
const backOfHouse = (level: number): Unit[] => [
  { id: 'STORE', name: level === 4 ? 'AHU & Food Court Stores' : 'AHU, Stores & Housekeeping', use: 'Air handling unit, mall stores and housekeeping', kind: 'service', rects: [[-3.6, 6.0, ENV.z0, ZSC0]], fronts: [{ axis: 'z', at: ZSC0, from: 0.4, to: 1.6, door: 1.2 }] },
  { id: 'ELEC', name: 'Electrical & ELV', use: 'Floor electrical panel, ELV and fire alarm', kind: 'service', rects: [[9.6, ENV.x1, ENV.z0, ZSC0], [XE, ENV.x1, ZSC0, ZSC1]], fronts: [{ axis: 'z', at: ZSC0, from: 10.0, to: 11.0, door: 1.0 }] },
]

/* ---------- ground floor ---------- */

const G: FloorPlan = {
  level: 0,
  label: 'G',
  title: 'Ground Floor · Luxury Brands, Cafés & Essentials',
  units: [
    {
      id: 'G-01', name: 'Dior', use: 'Dior boutique: leather goods, shoes and ready-to-wear, with display windows to the forecourt and the south avenue', kind: 'anchor',
      rects: [[ENV_G.x0, XW, -1.0, 3.4], [ENV_G.x0, -10.9, 3.4, ENV_G.z1], [-10.9, XW, 9.0, ENV_G.z1]],
      fronts: [{ axis: 'x', at: XW, from: -1.0, to: 3.4, door: 2.4 }], fitout: 'dior',
    },
    { id: 'G-02', name: 'Prada', use: 'Prada boutique: leather goods, accessories and fragrance', kind: 'shop', rects: [[ENV_G.x0, XW, -6.0, -1.0]], fronts: [{ axis: 'x', at: XW, from: -6.0, to: -1.0, door: 2.2 }], fitout: 'prada' },
    { id: 'G-03', name: 'TR/BECA', use: 'TR/BECA: women\'s high heels, from day pumps and kitten heels to evening sandals and bridal', kind: 'shop', rects: [[ENV_G.x0, XW, ZWC, -6.0]], fronts: [{ axis: 'x', at: XW, from: ZWC, to: -6.0, door: 2.2 }], fitout: 'heels' },
    { id: 'G-05', name: 'Desserts & Pastries', use: 'Pâtisserie kiosk: macarons, éclairs, tarts, cakes and viennoiserie, with seating beside it', kind: 'kiosk', rects: [[-3.1, 0.0, -16.0, -10.4]], fronts: [], fitout: 'dessert' },
    { id: 'G-06', name: 'Perfume & Fragrance', use: 'Maison Sakura parfumerie: perfume, fragrance oils, body mists and gift sets', kind: 'shop', rects: [[4.0, 7.75, -16.6, -9.0]], fronts: [{ axis: 'z', at: -9.0, from: 4.0, to: 7.75, door: 2.0 }], fitout: 'perfume' },
    { id: 'G-07', name: 'Rosé Atelier', use: 'Cosmetics, skincare and fragrance boutique', kind: 'shop', rects: [[7.75, 11.5, -16.6, -9.0]], fronts: [{ axis: 'z', at: -9.0, from: 7.75, to: 11.5, door: 2.0 }], fitout: 'cosmetics' },
    { id: 'G-08', name: 'Apple Store', use: 'Apple store: iPhone, Mac, iPad, Watch, AirPods and accessories', kind: 'shop', rects: [[LINK_X1, XE, ZFG, ENV_G.z1]], fronts: [{ axis: 'z', at: ZFG, from: LINK_X1, to: XE, door: 2.2 }], fitout: 'apple' },
    { id: 'G-09', name: 'Starbucks', use: 'Starbucks café, glazed to the forecourt on two sides', kind: 'cafe', rects: [[XE, ENV_G.x1, 3.5, ENV_G.z1]], fronts: [{ axis: 'x', at: XE, from: 3.5, to: ZFG, door: 2.4 }], fitout: 'starbucks' },
    { id: 'G-K1', name: 'Coffee To Go', use: 'Quick coffee and takeaway counter', kind: 'kiosk', rects: [[1.0, 3.2, 5.8, 7.2]], fronts: [] },
    { id: 'G-K2', name: 'Macarons & Chocolates', use: 'Dessert kiosk', kind: 'kiosk', rects: [[8.6, 10.6, -1.2, 0.4]], fronts: [] },
    ...washrooms(ENV_G.x0, -22.3),
    { id: 'DOCK', name: 'Loading Dock & Receiving', use: 'Goods receiving from the two loading bays', kind: 'service', rects: [[-13.4, XV0, ENV_G.z0, -22.3]], fronts: [{ axis: 'x', at: XV0, from: -24.4, to: -22.5, door: 1.9 }] },
    { id: 'BOH', name: 'Mall Stores', use: 'Mall management stores', kind: 'service', rects: [[XV0, 0.0, ENV_G.z0, ZSC0]], fronts: [{ axis: 'z', at: ZSC0, from: -2.6, to: -1.0, door: 1.4 }] },
    { id: 'RAMP-IN', name: 'Basement Ramp · IN', use: 'Enclosure of the basement entry ramp', kind: 'service', rects: [[0.0, 4.0, ENV_G.z0, -4.2]], fronts: [] },
    { id: 'RAMP-OUT', name: 'Basement Ramp · OUT', use: 'Enclosure of the basement exit ramp', kind: 'service', rects: [[11.5, 15.5, ENV_G.z0, -3.4]], fronts: [] },
    { id: 'RISER', name: 'Electrical Riser', use: 'HT/LT cable riser', kind: 'service', rects: [[15.5, ENV_G.x1, ENV_G.z0, -3.4]], fronts: [] },
    { id: 'STORE-E', name: 'Store', use: 'Shops\' stores', kind: 'service', rects: [[4.0, 6.0, ENV_G.z0, -18.0]], fronts: [] },
  ],
  commons: [
    [XW, XV0, ZSC0, VZ1],
    [XV0, XV1, VZ0, VZ1],
    // The lobby, and the glazed bays either side of the doors.
    [LINK_X0, LINK_X1, VZ1, ENV_G.link],
    [LINK_X0, LINK_X1, ENV_G.link, ENV_G.z1],
    [LINK_X1, XE, VZ1, ZFG],
    [XV1, XE, -4.2, VZ1],
    [0.0, XV1, -4.2, VZ0],
    [4.0, 11.5, -9.0, -4.2],
    [XE, 13.1, -3.4, 3.5],
    [ENV_G.x0, XW, ZSC0, ZSC1],
    [XV0, 0.0, ZSC0, ZSC1],
    // Where G-04 and G-05 stood: open gallery between the west spine and the rear gallery.
    [XV0, 0.0, ZSC1, VZ0],
    [4.0, 11.5, -18.0, -16.6],
    [9.6, 11.5, ENV_G.z0, -18.0],
  ],
}

/* ---------- the retail floors: one plan, let for different trades ---------- */

const retail = (level: 1 | 2, names: string[][]): FloorPlan => {
  const n = (i: number) => ({ id: `${level}-${String(i + 1).padStart(2, '0')}`, name: names[i][0], use: names[i][1] })
  return {
    level,
    label: String(level),
    title: level === 1 ? 'First Floor · Premium Fashion & Lifestyle' : 'Second Floor · Luxury Retail, Electronics & Lifestyle',
    units: [
      { ...n(0), kind: 'anchor', rects: [[ENV.x0, XW, 4.5, ENV.z1]], fronts: [{ axis: 'x', at: XW, from: 4.5, to: ENV.link, door: 2.4 }] },
      { ...n(1), kind: 'shop', rects: [[ENV.x0, XW, -1.0, 4.5]], fronts: [{ axis: 'x', at: XW, from: -1.0, to: 4.5, door: 2.2 }] },
      { ...n(2), kind: 'shop', rects: [[ENV.x0, XW, -6.0, -1.0]], fronts: [{ axis: 'x', at: XW, from: -6.0, to: -1.0, door: 2.2 }] },
      { ...n(3), kind: 'shop', rects: [[ENV.x0, XW, ZWC, -6.0]], fronts: [{ axis: 'x', at: XW, from: ZWC, to: -6.0, door: 2.2 }] },
      { ...n(4), kind: 'shop', rects: [[XV0, 0.0, ZSC1, ZRG_U]], fronts: [{ axis: 'x', at: XV0, from: ZSC1, to: ZRG_U, door: 1.8 }, { axis: 'z', at: ZRG_U, from: XV0, to: 0.0, door: 0 }] },
      { ...n(5), kind: 'shop', rects: [[0.0, 3.6, ZSC1, ZRG_U]], fronts: [{ axis: 'z', at: ZRG_U, from: 0.0, to: 3.6, door: 1.8 }] },
      { ...n(6), kind: 'shop', rects: [[3.6, XV1, ZSC1, ZRG_U]], fronts: [{ axis: 'z', at: ZRG_U, from: 3.6, to: XV1, door: 1.8 }, { axis: 'x', at: XV1, from: ZSC1, to: ZRG_U, door: 0 }] },
      { ...n(7), kind: 'shop', rects: [[XE, ENV.x1, ZSC1, -9.8]], fronts: [{ axis: 'x', at: XE, from: ZSC1, to: -9.8, door: 2.2 }] },
      { ...n(8), kind: 'shop', rects: [[XE, ENV.x1, -9.8, -3.4]], fronts: [{ axis: 'x', at: XE, from: -9.8, to: -3.4, door: 2.2 }] },
      { ...n(9), kind: 'cafe', rects: [[XE, ENV.x1, 3.5, ENV.z1]], fronts: [{ axis: 'x', at: XE, from: 3.5, to: ZFG_U, door: 2.4 }] },
      { ...n(10), kind: 'shop', rects: [[LINK_X1, XE, ZFG_U, ENV.z1]], fronts: [{ axis: 'z', at: ZFG_U, from: LINK_X1, to: XE, door: 2.2 }] },
      { ...n(11), kind: 'kiosk', rects: [[-6.3, -4.3, 8.75, 10.05]], fronts: [] },
      { ...n(12), kind: 'kiosk', rects: [[1.8, 3.8, 8.75, 10.05]], fronts: [] },
      ...washrooms(ENV.x0, ENV.z0),
      ...backOfHouse(level),
    ],
    commons: upperCommons(XE),
  }
}

/** The galleries of an upper floor; `east` is how far the front gallery reaches north. */
function upperCommons(east: number): Rect[] {
  return [
    [XW, XV0, ZSC0, VZ1],
    [XW, east, VZ1, ZFG_U],
    [LINK_X0, LINK_X1, ZFG_U, ENV.link],
    [XV0, XV1, ZRG_U, VZ0],
    [ENV.x0, XW, ZSC0, ZSC1],
    [XV0, XV1, ZSC0, ZSC1],
  ]
}

const F1 = retail(1, [
  ['Premium Fashion Flagship', 'International and premium fashion brand'],
  ["Men's Clothing", "Men's clothing"],
  ["Women's Clothing", "Women's clothing"],
  ["Kids' Clothing", "Kids' clothing and speciality"],
  ['Jewellery & Watches', 'Jewellery and watches'],
  ['Beauty Salon', 'Beauty salon'],
  ['Handbags & Accessories', 'Handbags and accessories'],
  ['Home Décor & Lifestyle', 'Home décor and lifestyle'],
  ['Electronics & Accessories', 'Electronics and accessories'],
  ['Tim Hortons', 'Tim Hortons café'],
  ['Cosmetics & Skincare', 'Cosmetics and skincare'],
  ['Dessert Bar', 'Dessert kiosk'],
  ['Coffee & Beverages', 'Coffee and beverage kiosk'],
])
// 1-08, fitted out as Aurum Home (see ./shops/decorStore.ts).
Object.assign(F1.units.find((u) => u.id === '1-08')!, { name: 'Aurum Home', use: 'Aurum Home: home décor and lifestyle (vases, lighting, sculpture, mirrors, cushions, furniture)', fitout: 'decor' })
// 1-03, fitted out as Maison Verde (see ./shops/womenStore.ts).
Object.assign(F1.units.find((u) => u.id === '1-03')!, { name: 'Maison Verde', use: 'Maison Verde: women\'s clothing (dresses, evening and party wear, tops, tailoring, denim, skirts, knitwear and ethnic wear)', fitout: 'women' })
// 1-07, fitted out as Gucci's handbag boutique (see ./shops/bagStore.ts).
Object.assign(F1.units.find((u) => u.id === '1-07')!, { name: 'Gucci', use: 'Gucci handbags: top-handles, shoulder and crossbody bags, totes, hobos, buckets, clutches and evening bags', fitout: 'bags' })
// The east spine and the north corridor to fire stair 2: public on the retail floors.
F1.commons.push([XV1, XE, ZSC0, VZ1], [XE, 13.1, -3.4, 3.5])

const F2 = retail(2, [
  ['Furniture & Lifestyle', 'Furniture and lifestyle store'],
  ['Home Furnishing & Décor', 'Home furnishing and décor'],
  ['Premium Clothing', 'Premium clothing brand'],
  ['Sports & Fitness', 'Sports and fitness brand'],
  ['Books & Stationery', 'Bookstore and stationery'],
  ['Salon & Grooming', 'Salon and grooming'],
  ["Kids' Speciality", "Kids' speciality store"],
  ['Toy Store', 'Toy store'],
  ['Mobile & Gadgets', 'Mobile phone and gadget store'],
  ['Bakery & Desserts', 'Bakery and dessert café'],
  ['Optical & Eyewear', 'Optical and eyewear store'],
  ['Waffles & Gelato', 'Dessert kiosk'],
  ['Travel & Forex Desk', 'Travel and foreign exchange desk'],
])
F2.commons.push([XV1, XE, ZSC0, VZ1], [XE, 13.1, -3.4, 3.5])

/* ---------- third floor: one gaming hall ---------- */

const F3: FloorPlan = {
  level: 3,
  label: '3',
  title: 'Third Floor · Gaming, Bowling & Play',
  units: [
    { id: '3-01', name: 'Family Lounge', use: 'Open waiting and seating lounge for the gaming floor', kind: 'lounge', rects: [[ENV.x0, XW, 4.5, ENV.z1]], fronts: [] },
    { id: '3-02', name: 'Ice Cream Parlour', use: 'Ice cream', kind: 'food', rects: [[ENV.x0, XW, -1.0, 4.5]], fronts: [{ axis: 'x', at: XW, from: -1.0, to: 4.5, door: 2.4 }] },
    { id: '3-03', name: 'Juice & Beverage Bar', use: 'Juices and beverages', kind: 'food', rects: [[ENV.x0, XW, -6.0, -1.0]], fronts: [{ axis: 'x', at: XW, from: -6.0, to: -1.0, door: 2.4 }] },
    { id: '3-04', name: 'Snacks & Quick Bites', use: 'Snack outlet', kind: 'food', rects: [[ENV.x0, XW, ZWC, -6.0]], fronts: [{ axis: 'x', at: XW, from: ZWC, to: -6.0, door: 2.4 }] },
    ...washrooms(ENV.x0, ENV.z0),
    ...backOfHouse(3),
  ],
  commons: [
    [XW, XV0, ZSC0, VZ1],
    [XW, XV1, VZ1, ZFG_U],
    [LINK_X0, LINK_X1, ZFG_U, ENV.link],
    [LINK_X1, XV1, ZFG_U, ENV.z1],
    [ENV.x0, XW, ZSC0, ZSC1],
    [XV0, XE, ZSC0, ZSC1],
    // The family lounge, open to the spine.
    [ENV.x0, XW, 4.5, ENV.z1],
  ],
  hall: {
    id: 'GAME',
    name: 'Gaming & Entertainment Hall',
    rects: [[XV0, ENV.x1, ZSC1, VZ0], [XV1, ENV.x1, VZ0, ENV.z1]],
    doors: [{ axis: 'x', at: XV1, from: 4.4, to: 7.8, door: 3.4 }, { axis: 'x', at: XV0, from: -7.6, to: -4.2, door: 3.4 }],
    zones: [
      { id: 'BOWL', name: 'Bowling · 5 Lanes', rect: [1.0, 17.8, -15.8, -8.05], finish: 'lanes' },
      { id: 'BOWL-A', name: 'Bowlers\' Seating & Scoring', rect: [XV0 + 0.2, 1.0, -15.8, -8.05], finish: 'approach' },
      { id: 'HOCKEY', name: 'Air Hockey & Multiplayer Games', rect: [XV0 + 0.2, 7.6, -7.6, -3.9], finish: 'hockey' },
      { id: 'ARCADE', name: 'Arcade', rect: [8.0, 12.9, -7.6, 3.7], finish: 'arcade' },
      { id: 'ESPORTS', name: 'Esports & Console Gaming', rect: [13.1, 17.8, -7.6, -3.6], finish: 'esports' },
      { id: 'COUNTER', name: 'Game Card & Recharge', rect: [8.0, 12.9, 3.9, 8.2], finish: 'counter' },
      { id: 'RACING', name: 'Racing Simulators', rect: [13.1, 17.8, 3.7, 8.2], finish: 'racing' },
      { id: 'VR', name: 'VR Gaming', rect: [8.0, 11.1, 8.4, 12.9], finish: 'vr' },
      { id: 'KIDS', name: "Kids' Play Zone", rect: [11.3, 17.8, 8.4, 12.9], finish: 'kids' },
    ],
  },
}

/* ---------- fourth floor: food court and cinema ---------- */

const outletsAlong = (ids: number, names: [string, string][], rect: (i: number) => Rect, front: (r: Rect) => Front): Unit[] =>
  names.map(([name, use], i) => {
    const r = rect(i)
    return { id: `4-F${String(ids + i).padStart(2, '0')}`, name, use, kind: 'food' as const, rects: [r], fronts: [front(r)] }
  })

const southWall: [string, string][] = [
  ['North Indian', 'North Indian cuisine'],
  ['South Indian', 'South Indian cuisine'],
  ['Andhra & Telangana', 'Andhra and Telangana cuisine'],
  ['Hyderabadi Biryani', 'Biryani'],
  ['Pure Vegetarian', 'Vegetarian thalis and meals'],
  ['Non-Veg Grill & Kebabs', 'Non-vegetarian grills and curries'],
  ['Street Food & Chaat', 'Indian street food'],
]
const SW0 = ZWC
const SW1 = 9.0
const sw = (SW1 - SW0) / southWall.length

const F4: FloorPlan = {
  level: 4,
  label: '4',
  title: 'Fourth Floor · Food Court & Cinema',
  units: [
    ...outletsAlong(1, southWall, (i) => [ENV.x0, -13.8, SW0 + i * sw, SW0 + (i + 1) * sw], (r) => ({ axis: 'x', at: r[1], from: r[2], to: r[3], door: r[3] - r[2] })),
    ...outletsAlong(8, [['Burgers & Fried Chicken', 'Burgers and fried chicken'], ['Momos & Noodles', 'Momos and noodles']], (i) => [i ? -10.2 : -13.8, i ? XW : -10.2, ZWC, -7.2], (r) => ({ axis: 'z', at: r[3], from: r[0], to: r[1], door: r[1] - r[0] })),
    ...outletsAlong(10, [['Italian · Pizza & Pasta', 'Pizza, pasta and Italian'], ['Mexican Grill', 'Mexican cuisine']], (i) => [i ? -10.2 : -13.8, i ? XW : -10.2, 9.0, ENV.z1], (r) => ({ axis: 'z', at: r[2], from: r[0], to: r[1], door: r[1] - r[0] })),
    ...outletsAlong(12, [['Chinese & Thai', 'Chinese and Thai'], ['Japanese & Korean', 'Japanese and Korean'], ['Continental & Mediterranean', 'Continental and Mediterranean']],
      (i) => [XV0, 0.6, ZSC1 + (i * (ZRG_U - ZSC1)) / 3, ZSC1 + ((i + 1) * (ZRG_U - ZSC1)) / 3], (r) => ({ axis: 'x', at: r[0], from: r[2], to: r[3], door: r[3] - r[2] })),
    ...outletsAlong(15, [['Sandwiches, Rolls & Wraps', 'Sandwiches, rolls and wraps']], () => [LINK_X1, XV1, ZFG_U, ENV.z1], (r) => ({ axis: 'z', at: r[2], from: r[0], to: r[1], door: r[1] - r[0] })),
    { id: '4-K1', name: 'Coffee & Beverages', use: 'Coffee and beverage counter', kind: 'kiosk', rects: [[-11.4, -9.0, -4.6, -3.2]], fronts: [] },
    { id: '4-K2', name: 'Juice & Smoothies', use: 'Juice and smoothie counter', kind: 'kiosk', rects: [[-11.4, -9.0, 5.0, 6.4]], fronts: [] },
    { id: '4-K3', name: 'Desserts & Ice Cream', use: 'Desserts and ice cream counter', kind: 'kiosk', rects: [[-6.3, -4.3, 8.75, 10.05]], fronts: [] },
    { id: '4-K4', name: 'Cakes & Bakery', use: 'Cakes and bakery counter', kind: 'kiosk', rects: [[1.8, 3.8, 8.75, 10.05]], fronts: [] },
    ...washrooms(ENV.x0, ENV.z0),
    ...backOfHouse(4),
  ],
  commons: [
    [XW, XV0, ZSC0, VZ1],
    [XW, XV1, VZ1, ZFG_U],
    [LINK_X0, LINK_X1, ZFG_U, ENV.link],
    [XV0, 0.6, ZRG_U, VZ0],
    [ENV.x0, XW, ZSC0, ZSC1],
    [XV0, XE, ZSC0, ZSC1],
    // The food court's dining hall.
    [-13.8, XW, -7.2, 9.0],
  ],
  hall: {
    id: 'CINEMA',
    name: 'Terranova Cinemas',
    rects: [[0.6, ENV.x1, ZSC1, VZ0], [XV1, ENV.x1, VZ0, ENV.z1]],
    doors: [{ axis: 'x', at: 0.6, from: ZRG_U, to: VZ0, door: 3.6 }, { axis: 'x', at: XV1, from: 4.4, to: 7.8, door: 2.4 }],
    zones: [
      { id: 'AUDI1', name: 'Audi 1', rect: [0.8, 9.2, ZSC1, -8.0], finish: 'audi' },
      { id: 'AUDI2', name: 'Audi 2', rect: [9.4, ENV.x1, ZSC1, -8.0], finish: 'audi' },
      { id: 'AUDI3', name: 'Audi 3 · Recliners', rect: [XE, ENV.x1, 3.7, ENV.z1], finish: 'audi' },
      { id: 'BOX', name: 'Box Office', rect: [1.0, 4.6, -7.8, -7.0], finish: 'boxoffice' },
      { id: 'CANDY', name: 'Popcorn & Concessions', rect: [11.5, 12.9, -2.8, 3.0], finish: 'concession' },
      { id: 'CWC', name: 'Cinema Washrooms', rect: [13.1, ENV.x1, ZRG_U, -3.4], finish: 'cinemaWc' },
      { id: 'LOBBY', name: 'Cinema Lobby', rect: [XV1, XE, 3.7, ENV.z1], finish: 'foyer' },
    ],
  },
}

export const FLOORS: FloorPlan[] = [G, F1, F2, F3, F4]

/* ---------- areas ---------- */

/** Plan area of a set of non-overlapping rectangles (m²), before the façade's rounded corners. */
export const areaOf = (rects: Rect[]) => rects.reduce((a, [x0, x1, z0, z1]) => a + (x1 - x0) * (z1 - z0), 0)

/** Whether a unit is let (a shop, café, outlet or kiosk), as against services. */
export const isLettable = (u: Unit) => u.kind !== 'service' && u.kind !== 'washroom' && u.kind !== 'lounge'
