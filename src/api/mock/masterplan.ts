import type { Amenity, AvailabilityStatus, MasterPlan, MediaItem, Plot, PlotUnit, Point2, Road } from '../types'
import { placeholderImage } from './placeholders'

// Public sample stream so the film player path can be exercised; replace with R2-hosted HLS.
const SAMPLE_HLS = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
// Served from public/videos/. Absolute so assetUrl() doesn't resolve it against the R2 domain.
const KALAKAL_FILM = `${window.location.origin}/videos/kalakal-film.mp4`

// Deterministic PRNG so the mock layout (and its statuses) is stable between reloads.
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const FT = 0.3048
const rect = (x: number, z: number, w: number, d: number): Point2[] => [
  [x, z], [x + w, z], [x + w, z + d], [x, z + d],
]

let mediaSeq = 0
const image = (title: string, hue: number): MediaItem => ({
  id: `mpm_${++mediaSeq}`,
  kind: 'image',
  title,
  url: placeholderImage(title, hue),
  thumbUrl: placeholderImage(title, hue, 480, 300),
})
const film = (title: string, hue: number, url = SAMPLE_HLS): MediaItem => ({
  id: `mpm_${++mediaSeq}`,
  kind: 'video',
  title,
  url,
  thumbUrl: placeholderImage(title, hue, 480, 300),
})

/** Avenue trees along both kerbs of a straight road rectangle, skipping crossings. */
function kerbTrees(road: Point2[], spacing: number, inset: number, skip: (p: Point2) => boolean): Point2[] {
  const [[x0, z0], , [x1, z1]] = road
  const horizontal = x1 - x0 > z1 - z0
  const trees: Point2[] = []
  const len = horizontal ? x1 - x0 : z1 - z0
  for (let t = spacing / 2; t < len; t += spacing) {
    for (const side of [0, 1]) {
      const p: Point2 = horizontal
        ? [x0 + t, side ? z1 - inset : z0 + inset]
        : [side ? x1 - inset : x0 + inset, z0 + t]
      if (!skip(p)) trees.push(p)
    }
  }
  return trees
}

function scatter(rand: () => number, area: Point2[], count: number, margin = 3): Point2[] {
  const [[x0, z0], , [x1, z1]] = area
  return Array.from({ length: count }, () => [
    x0 + margin + rand() * (x1 - x0 - margin * 2),
    z0 + margin + rand() * (z1 - z0 - margin * 2),
  ])
}

const inside = (p: Point2, poly: Point2[]) => {
  const [[x0, z0], , [x1, z1]] = poly
  return p[0] > x0 && p[0] < x1 && p[1] > z0 && p[1] < z1
}

/*
 * Kalakal, traced from the architect's layout (AGGNESTRO LAYOUT PLAN, 23-02-26). Positions are in
 * the drawing's own units, read straight off the PDF: its 40 ft plot frontage measures 29.5 units.
 * North is up the sheet (−z); the site runs west → east to the proposed HMDA road on NH-44.
 */
const PER_FT = 0.7375
const U = FT / PER_FT
const ORIGIN: Point2 = [1130, 848.55]
const at = (x: number, y: number): Point2 => [(x - ORIGIN[0]) * U, (y - ORIGIN[1]) * U]
const area = (x0: number, y0: number, x1: number, y1: number) => rect(...at(x0, y0), (x1 - x0) * U, (y1 - y0) * U)
const ftIn = (s: string) => {
  const [f, i] = s.split('-').map(Number)
  return f + i / 12
}
const ftLabel = (ft: number) => {
  const inches = Math.round(ft * 12)
  return inches % 12 ? `${Math.floor(inches / 12)}′${inches % 12}″` : `${inches / 12}′`
}

/** Edges of the 60 ft main avenue. */
const AVENUE_N = 826.35
const AVENUE_S = 870.75

/**
 * Plot columns from the entrance westwards, as [centre x, plots south of the avenue, plots north].
 * Numbering snakes through them: up the first column from its south end, down the next, and so on.
 * Even columns face east onto a cross road, odd ones west; each pair stands back to back as a block.
 */
const COLUMNS: [number, number, number][] = [
  [1782.1, 6, 8], [1737.8, 6, 8], [1669.2, 6, 7], [1624.8, 6, 7], [1554.3, 7, 7], [1510.1, 7, 7],
  [1441.4, 7, 7], [1396.4, 7, 7], [1327.8, 6, 7], [1283.5, 6, 7], [1214.9, 6, 6], [1170.6, 6, 6],
  [1101.9, 6, 6], [1057.7, 6, 0], [989.0, 6, 0], [944.7, 6, 0], [876.1, 6, 0], [831.8, 5, 0],
  [763.1, 5, 0], [718.9, 5, 0], [650.1, 5, 4], [605.9, 4, 4], [537.2, 4, 4], [492.9, 4, 5],
  [424.3, 4, 4], [380.0, 4, 4], [311.4, 4, 4], [267.1, 4, 4], [198.5, 3, 4],
]
const FIRST_RESIDENTIAL = 5

/** Frontages (ft-in) of the plots the boundary cuts short or stretches; every other plot is 40 ft. */
const FRONTAGE: Record<number, string> = {
  17: '32-0', 18: '35-2', 19: '31-3', 20: '32-0', 45: '57-9', 46: '54-3', 58: '60-3', 59: '31-11', 60: '30-0',
  72: '48-5', 73: '44-7', 85: '30-0', 86: '33-5', 87: '31-0', 88: '33-0', 100: '38-10', 101: '35-3', 113: '33-0',
  114: '31-4', 115: '62-1', 126: '33-0', 127: '36-7', 128: '32-9', 129: '33-0', 140: '58-6', 141: '48-9',
  152: '60-1', 153: '56-5', 164: '44-8', 165: '39-2', 176: '50-9', 182: '36-0', 183: '38-2', 184: '33-0',
  193: '33-0', 194: '34-7', 195: '32-6', 196: '30-0', 205: '59-2', 206: '53-4', 215: '48-9', 241: '33-1',
  250: '52-8', 265: '45-7', 266: '42-3', 273: '49-3', 274: '43-2', 281: '39-3', 282: '39-11', 288: '33-4',
}
/** Depths along the slanted west boundary; every other plot is 60 ft deep. */
const DEPTH: Record<number, string> = {
  282: '45-0', 283: '47-8', 284: '50-5', 285: '54-8', 286: '56-2', 287: '57-11', 288: '59-6',
}

/** Four commercial plots on the highway frontage, as [frontage, depth, sq yd, north edge, south edge]. */
const COMMERCIAL: [string, string, number, number, number][] = [
  ['166-1', '165-5', 3022, 593.25, 715.75],
  ['150-0', '222-3', 3704, 715.75, AVENUE_N],
  ['125-0', '294-6', 4090, AVENUE_S, 962.9],
  ['124-3', '340-7', 4676, 962.9, 1054.5],
]
const COMMERCIAL_WEST = 1828.5
/** The west edge of the HMDA road's right of way, which the commercial plots run up to. */
const highwayEdge = (y: number) => 1897.6 + 0.3636 * (y - 512.6)

function buildKalakal(): Pick<MasterPlan, 'plots' | 'roads' | 'amenities' | 'landscape'> {
  const rand = mulberry32(42)
  const villa: PlotUnit = { kind: 'villa', name: 'Aranya Villa', propertySlug: 'aranya-villa' }
  const plots: Plot[] = []
  const statusRoll = (): AvailabilityStatus => {
    const roll = rand()
    return roll < 0.6 ? 'available' : roll < 0.75 ? 'reserved' : 'sold'
  }

  COMMERCIAL.forEach(([frontage, depth, sqyd, y0, y1], i) => {
    const n = i + 1
    const areaSqft = sqyd * 9
    plots.push({
      id: `plot_${n}`,
      number: `A-${String(n).padStart(2, '0')}`,
      polygon: [at(COMMERCIAL_WEST, y0), at(highwayEdge(y0), y0), at(highwayEdge(y1), y1), at(COMMERCIAL_WEST, y1)],
      areaSqft,
      dimensionsLabel: `${ftLabel(ftIn(frontage))} × ${ftLabel(ftIn(depth))}`,
      facing: 'East',
      roadWidthFt: 250,
      isCorner: n === 2 || n === 3,
      status: statusRoll(),
      price: areaSqft * 5500,
    })
  })

  // Vertical reach of each column, so the cross roads between them run the full length of the blocks.
  const reach: { top: number; bottom: number }[] = []
  let n = FIRST_RESIDENTIAL
  COLUMNS.forEach(([cx, south, north], col) => {
    const block = String.fromCharCode(66 + Math.floor(col / 2))
    const facing = col % 2 === 0 ? 'East' : 'West'
    // Slot k counts outwards from the avenue on either side.
    const southSlots = Array.from({ length: south }, (_, k) => ({ side: 1, k }))
    const northSlots = Array.from({ length: north }, (_, k) => ({ side: -1, k }))
    const order = col % 2 === 0 ? [...southSlots.reverse(), ...northSlots] : [...northSlots.reverse(), ...southSlots]
    const numbered = order.map((slot) => ({ ...slot, n: n++ }))
    numbered.sort((a, b) => a.side - b.side || a.k - b.k)

    const edge: Record<number, number> = { [-1]: AVENUE_N, 1: AVENUE_S }
    for (const { side, k, n: num } of numbered) {
      const frontage = FRONTAGE[num] ? ftIn(FRONTAGE[num]) : 40
      const depth = DEPTH[num] ? ftIn(DEPTH[num]) : 60
      const near = edge[side]
      const far = near + side * frontage * PER_FT
      edge[side] = far
      // Plots line up on their road side; the far side follows the boundary.
      const roadX = cx + (facing === 'East' ? 30 : -30) * PER_FT
      const backX = roadX + (facing === 'East' ? -1 : 1) * depth * PER_FT
      const [x0, x1] = [Math.min(roadX, backX), Math.max(roadX, backX)]
      const [y0, y1] = [Math.min(near, far), Math.max(near, far)]

      const status = statusRoll()
      const areaSqft = Math.round(frontage * depth)
      const standard = frontage === 40 && depth === 60
      // Phase 1 (blocks B–D, by the entrance) already has villas standing on most sold plots.
      const built = col < 6 && standard && status !== 'available' && rand() < 0.75
      plots.push({
        id: `plot_${num}`,
        number: `${block}-${String(num).padStart(2, '0')}`,
        polygon: area(x0, y0, x1, y1),
        areaSqft,
        dimensionsLabel: `${ftLabel(frontage)} × ${ftLabel(depth)}`,
        facing,
        roadWidthFt: 33,
        isCorner: k === 0,
        status,
        price: areaSqft * (k === 0 ? 3600 : 3300),
        unit: built ? villa : undefined,
      })
    }
    reach.push({ top: edge[-1], bottom: edge[1] })
  })

  const roads: Road[] = [
    { id: 'road_avenue', name: 'Main Avenue', widthFt: 60, polygon: area(182, AVENUE_N, highwayEdge(848.55), AVENUE_S) },
    { id: 'road_x1', name: 'Cross Road 1', widthFt: 33, polygon: area(COLUMNS[0][0] + 30 * PER_FT, 593.25, COMMERCIAL_WEST, 1054.5) },
  ]
  // A 33 ft cross road between each pair of back-to-back columns.
  for (let col = 1; col + 1 < COLUMNS.length; col += 2) {
    const [a, b] = [reach[col], reach[col + 1]]
    roads.push({
      id: `road_x${roads.length}`,
      name: `Cross Road ${roads.length}`,
      widthFt: 33,
      polygon: area(COLUMNS[col + 1][0] + 30 * PER_FT, Math.min(a.top, b.top), COLUMNS[col][0] - 30 * PER_FT, Math.max(a.bottom, b.bottom)),
    })
  }
  const highway: Point2[] = [at(highwayEdge(470), 470), at(highwayEdge(470) + 196.8, 470), at(highwayEdge(1120) + 196.8, 1120), at(highwayEdge(1120), 1120)]
  roads.push({ id: 'road_hmda', name: 'HMDA Master Plan Road (NH-44)', widthFt: 250, polygon: highway })

  const amenities: Amenity[] = [
    { id: 'am_park', name: 'Central Park', kind: 'park', polygon: area(812, 659.85, 1079.8, AVENUE_N), height: 0,
      description: 'The layout’s main park, ringed by a 2 m cycle track, with a 1,00,000 litre rainwater sump beneath its north-east corner.',
      highlights: { Area: '9,725 sq yd', Size: '369′9″ × 225′9″', 'Cycle track': '2 m wide', 'Rainwater sump': '1,00,000 L', 'Plan ref.': 'Park Area-1' },
      media: [image('Central Park — morning', 110), image('Cycle track', 95)] },
    { id: 'am_social', name: 'Clubhouse', kind: 'clubhouse', polygon: area(696.6, 668, 812, AVENUE_N), height: 8,
      description: 'The community’s clubhouse, facing the main avenue beside Central Park: a grand lobby, indoor games, a video gaming lounge, a fitness centre and a 25 m six-lane training pool.',
      highlights: { Area: '3,678.19 sq yd', Size: '150′ × 214′9″', Pool: '25 m · 6 lanes' },
      media: [image('Clubhouse — arrival court', 30)], propertySlug: 'kalakal-clubhouse' },
    { id: 'am_park2', name: 'North Park', kind: 'garden', polygon: area(519, 681, 672.2, 708.25), height: 0,
      description: 'A strip of landscaped open space along the northern boundary, behind blocks L and M.',
      highlights: { Area: '1,252 sq yd', 'Plan ref.': 'Park Area-2' } },
    { id: 'am_gate', name: 'Main Gate & Security Cabin', kind: 'entrance', polygon: area(1962, AVENUE_N, 1972, AVENUE_S), height: 6,
      description: 'The single gated entry from the HMDA master plan road, with a security cabin at the head of the main avenue.',
      highlights: { Security: '24 × 7', Approach: '250 ft HMDA road' },
      media: [image('Main gate at night', 40)] },
    { id: 'am_stp_north', name: 'STP — North', kind: 'utility', polygon: area(346, 690, 451, 708.25), height: 3,
      description: 'Sewage treatment plant on the northern boundary.',
      highlights: { Area: '618.96 sq yd', 'Plan ref.': 'Utility-1' } },
    { id: 'am_oht', name: 'Overhead Water Tank', kind: 'utility', polygon: area(188, 959.3, 220.6, 986), height: 14,
      description: 'The overhead water tank at the south-west corner of the site.',
      highlights: { Area: '172.57 sq yd', 'Plan ref.': 'Utility-2' } },
    { id: 'am_yard', name: 'Utility Yard', kind: 'utility', polygon: area(470.8, 988.75, 627.9, 1010), height: 2.5,
      description: 'A service yard on the southern boundary holding the G.B and DB units marked on the layout.',
      highlights: { Area: '698.02 sq yd', Length: '246 ft', 'Plan ref.': 'Utility-3' } },
    { id: 'am_stp_east', name: 'STP & Transformer', kind: 'utility', polygon: area(1647, 1047.75, 1804, 1063), height: 3,
      description: 'Sewage treatment plant and electrical transformer behind blocks B and C.',
      highlights: { Area: '305.59 sq yd', 'Plan ref.': 'Utility-4' } },
  ]

  const avenue = roads[0]
  const crossings = roads.filter((r) => r.id.startsWith('road_x'))
  const trees: Point2[] = []
  for (const road of [avenue, ...crossings]) {
    const others = [avenue, ...crossings].filter((o) => o !== road)
    trees.push(...kerbTrees(road.polygon, 13, 1.1, (p) => others.some((o) => inside(p, o.polygon))))
  }
  // Planted median down the main avenue.
  const [[ax0], , [ax1]] = avenue.polygon
  for (let x = ax0 + 6; x < ax1 - 6; x += 9) {
    const p: Point2 = [x, 0]
    if (!crossings.some((o) => inside(p, o.polygon))) trees.push(p)
  }
  trees.push(...scatter(rand, amenities[0].polygon, 70, 4), ...scatter(rand, amenities[2].polygon, 12, 2))

  return { plots, roads, amenities, landscape: { trees } }
}

const kalakal = buildKalakal()

export const masterPlans: MasterPlan[] = [
  {
    id: 'mp_greenmeadows', slug: 'green-meadows', name: 'Kallakal', type: 'plots', location: 'NH-44, Kalakal',
    tagline: 'A gated layout of 288 plots on the HMDA master plan road, set around a 9,725 sq yd central park',
    thumbnailUrl: placeholderImage('Kalakal', 95, 800, 500),
    startingPrice: Math.min(...kalakal.plots.map((p) => p.price!)),
    stats: [{ label: 'Plots', value: '288' }, { label: 'Parkland', value: '31 ac' }],
    description: 'A gated plotted layout of 284 residential plots and four commercial plots fronting the proposed 250 ft HMDA master plan road on NH-44. A 60 ft tree-lined main avenue runs the length of the site, crossed by 33 ft roads, with a central park ringed by a cycle track and a reserved social-infrastructure site. Phase 1 villas are complete and open for viewing.',
    highlights: { 'Total land': '≈ 30 acres', Plots: '284 residential + 4 commercial', 'Plot size': '40 × 60 ft', 'Main avenue': '60 ft', 'Internal roads': '33 ft', Parks: '10,977 sq yd', RERA: 'Registered' },
    ...kalakal,
    media: [film('Kalakal — project film', 100, KALAKAL_FILM), image('Aerial at golden hour', 95), image('Tree-lined avenue', 120), image('Phase 1 villas', 40)],
    nearby: [
      { name: 'Delhi Public School', distance: '1.2 km' },
      { name: 'City Hospital', distance: '3.5 km' },
      { name: 'Metro Station', distance: '4 km' },
      { name: 'IGI Airport', distance: '28 km' },
    ],
  },
]
