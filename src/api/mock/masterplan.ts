import type { Amenity, AvailabilityStatus, MasterPlan, MediaItem, Plot, PlotUnit, Point2, Road } from '../types'
import { placeholderImage } from './placeholders'

// Public sample stream so the film player path can be exercised; replace with R2-hosted HLS.
const SAMPLE_HLS = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'

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
const film = (title: string, hue: number): MediaItem => ({
  id: `mpm_${++mediaSeq}`,
  kind: 'video',
  title,
  url: SAMPLE_HLS,
  thumbUrl: placeholderImage(title, hue, 480, 300),
})

const ordinal = (n: number) => ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh'][n] ?? `${n + 1}th`

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

/** 10 blocks × 2 back-to-back rows × 25 plots = 500 plots of 40×60 ft, with roads, parks and a clubhouse. */
function buildTownship(): Pick<MasterPlan, 'plots' | 'roads' | 'amenities' | 'landscape'> {
  const rand = mulberry32(42)
  const plotW = 40 * FT
  const plotD = 60 * FT
  const perRow = 25
  const road = 9
  const blockW = perRow * plotW
  const blockD = plotD * 2
  const cols = 2
  const rows = 5
  const totalW = cols * blockW + (cols + 1) * road
  const totalD = rows * blockD + (rows + 1) * road
  const x0 = -totalW / 2
  const z0 = -totalD / 2

  const villa: PlotUnit = { kind: 'villa', name: 'Aranya Villa', propertySlug: 'aranya-villa' }
  const plots: Plot[] = []
  const roads: Road[] = []
  let blockIndex = 0

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bx = x0 + road + c * (blockW + road)
      const bz = z0 + road + r * (blockD + road)
      const letter = String.fromCharCode(65 + blockIndex++)
      for (let side = 0; side < 2; side++) {
        for (let i = 0; i < perRow; i++) {
          const n = side * perRow + i + 1
          const roll = rand()
          const status: AvailabilityStatus = roll < 0.6 ? 'available' : roll < 0.75 ? 'reserved' : 'sold'
          const isCorner = i === 0 || i === perRow - 1
          const areaSqft = 40 * 60
          // Phase 1 (blocks A–D) already has villas standing on most sold plots.
          const built = r < 2 && status !== 'available' && rand() < 0.75
          plots.push({
            id: `plot_${letter}${n}`,
            number: `${letter}-${String(n).padStart(2, '0')}`,
            polygon: rect(bx + i * plotW, bz + side * plotD, plotW, plotD),
            areaSqft,
            dimensionsLabel: '40 × 60 ft',
            facing: side === 0 ? 'North' : 'South',
            roadWidthFt: 30,
            isCorner,
            status,
            price: areaSqft * (isCorner ? 5200 : 4800),
            unit: built ? villa : undefined,
          })
        }
      }
    }
  }

  // Horizontal and vertical road strips around every block.
  for (let r = 0; r <= rows; r++)
    roads.push({ id: `road_h${r}`, name: `${ordinal(r)} Avenue`, widthFt: 30, polygon: rect(x0, z0 + r * (blockD + road), totalW, road) })
  const promenades = ['West Promenade', 'Central Promenade', 'East Promenade']
  for (let c = 0; c <= cols; c++)
    roads.push({ id: `road_v${c}`, name: promenades[c], widthFt: 30, polygon: rect(x0 + c * (blockW + road), z0, road, totalD) })

  const southEdge = z0 + totalD
  const amenities: Amenity[] = [
    { id: 'am_club', name: 'The Clubhouse', kind: 'clubhouse', polygon: rect(-55, southEdge + 12, 45, 30), height: 8,
      description: 'A 24,000 sq ft clubhouse with a double-height lobby, gymnasium, banquet hall, indoor games lounge and a café opening onto the pool deck.',
      highlights: { 'Built-up area': '24,000 sq ft', Levels: '2', Gymnasium: '3,500 sq ft', 'Banquet hall': '220 guests' },
      media: [image('Clubhouse — arrival court', 30), image('Clubhouse — lounge', 20), image('Clubhouse — gymnasium', 200)] },
    { id: 'am_pool', name: 'Lap Pool & Deck', kind: 'pool', polygon: rect(15, southEdge + 15, 25, 14), height: 0,
      description: '25 m temperature-controlled lap pool with a shallow children’s pool, cabanas and a timber sun deck.',
      highlights: { Length: '25 m', Heated: 'Yes', Cabanas: '6' },
      media: [image('Pool deck at dusk', 195), image('Cabanas', 180)] },
    { id: 'am_park', name: 'Central Park', kind: 'park', polygon: rect(50, southEdge + 8, 120, 45), height: 0,
      description: 'Two acres of landscaped parkland with a 600 m jogging loop, open-air gym, children’s play garden and a reflection pond.',
      highlights: { Area: '2 acres', 'Jogging loop': '600 m', 'Trees planted': '180+' },
      media: [image('Central Park — morning', 110), image('Jogging loop', 95)] },
    { id: 'am_sports', name: 'Sports Arena', kind: 'sports', polygon: rect(-175, southEdge + 8, 110, 45), height: 0,
      description: 'Floodlit tennis, basketball and box-cricket courts with a pavilion and seating.',
      highlights: { Courts: '4', Floodlit: 'Yes' },
      media: [image('Sports Arena — tennis', 10)] },
    { id: 'am_gate', name: 'Grand Entrance', kind: 'entrance', polygon: rect(-8, southEdge + 60, 16, 6), height: 6,
      description: 'A stone-clad ceremonial gateway with a 24×7 security pavilion, boom barriers and visitor lounge.',
      highlights: { Security: '24 × 7', 'Access control': 'RFID + visitor app' },
      media: [image('Grand Entrance at night', 40)] },
  ]
  roads.push({ id: 'road_entry', name: 'Grand Entrance Drive', widthFt: 40, polygon: rect(-6, southEdge, 12, 60) })

  const crossings = roads.filter((r) => r.id.startsWith('road_v') || r.id.startsWith('road_h'))
  const trees: Point2[] = []
  for (const road of roads) {
    const others = crossings.filter((o) => o !== road)
    trees.push(...kerbTrees(road.polygon, 13, 1.1, (p) => others.some((o) => inside(p, o.polygon))))
  }
  const park = amenities.find((a) => a.id === 'am_park')!
  trees.push(...scatter(rand, park.polygon, 70, 4))
  // A shelter belt along the southern amenity zone.
  for (let x = x0; x < x0 + totalW; x += 9) {
    const p: Point2 = [x, southEdge + 72]
    if (Math.abs(x) > 14) trees.push(p)
  }

  return { plots, roads, amenities, landscape: { trees } }
}

/** 20 one-acre farm plots with hedgerows, a clubhouse, pool and an orchard garden. */
function buildFarmEstate(): Pick<MasterPlan, 'plots' | 'roads' | 'amenities' | 'landscape'> {
  const rand = mulberry32(7)
  const plot = 64
  const road = 10
  const cols = 4
  const rows = 5
  const totalW = cols * plot + (cols + 1) * road
  const totalD = rows * plot + (rows + 1) * road
  const x0 = -totalW / 2
  const z0 = -totalD / 2
  const farmhouse: PlotUnit = { kind: 'farmhouse', name: 'Palm Grove Farmhouse', propertySlug: 'palm-grove-farmhouse' }
  // Plot E-02 opens the fully furnished interior design model.
  const furnished: Record<string, PlotUnit> = {
    'E-02': { kind: 'farmhouse', name: 'Palm Grove Farmhouse', propertySlug: 'palm-grove-farmhouse-e02' },
  }

  const plots: Plot[] = []
  const trees: Point2[] = []
  for (let r = 0; r < rows; r++) {
    const letter = String.fromCharCode(65 + r)
    for (let c = 0; c < cols; c++) {
      const px = x0 + road + c * (plot + road)
      const pz = z0 + road + r * (plot + road)
      const roll = rand()
      const status: AvailabilityStatus = roll < 0.55 ? 'available' : roll < 0.75 ? 'reserved' : 'sold'
      const areaSqft = 43_560
      const number = `${letter}-${String(c + 1).padStart(2, '0')}`
      // Always draw, so the seeded statuses of later plots don't shift.
      const built = status !== 'available' && rand() < 0.7
      plots.push({
        id: `farm_${letter}${c + 1}`,
        number,
        polygon: rect(px, pz, plot, plot),
        areaSqft,
        dimensionsLabel: '210 × 210 ft',
        facing: c % 2 === 0 ? 'East' : 'West',
        roadWidthFt: 33,
        isCorner: c === 0 || c === cols - 1,
        status,
        price: areaSqft * 1100,
        unit: furnished[number] ?? (built ? farmhouse : undefined),
      })
      // Hedgerow of fruit trees around each farm.
      for (let t = 4; t < plot - 2; t += 7) {
        trees.push([px + t, pz + 2.5], [px + t, pz + plot - 2.5], [px + 2.5, pz + t], [px + plot - 2.5, pz + t])
      }
    }
  }

  const roads: Road[] = []
  for (let r = 0; r <= rows; r++)
    roads.push({ id: `road_h${r}`, name: `${['Mango', 'Guava', 'Neem', 'Peepal', 'Jamun', 'Banyan'][r]} Lane`, widthFt: 33, polygon: rect(x0, z0 + r * (plot + road), totalW, road) })
  for (let c = 0; c <= cols; c++)
    roads.push({ id: `road_v${c}`, name: `Estate Road ${c + 1}`, widthFt: 33, polygon: rect(x0 + c * (plot + road), z0, road, totalD) })

  const south = z0 + totalD
  const amenities: Amenity[] = [
    { id: 'am_club', name: 'Estate Clubhouse', kind: 'clubhouse', polygon: rect(-70, south + 14, 40, 26), height: 7,
      description: 'A pavilion clubhouse with a farm-to-table restaurant, library lounge and event lawn.',
      highlights: { Restaurant: '80 covers', 'Event lawn': '1 acre' },
      media: [image('Estate Clubhouse', 35), image('Farm-to-table dining', 25)] },
    { id: 'am_pool', name: 'Infinity Pool', kind: 'pool', polygon: rect(-20, south + 18, 26, 14), height: 0,
      description: 'An infinity-edge pool overlooking the orchard garden.',
      highlights: { Length: '26 m', Edge: 'Infinity' },
      media: [image('Infinity pool', 190)] },
    { id: 'am_garden', name: 'Orchard Garden', kind: 'garden', polygon: rect(20, south + 10, 80, 44), height: 0,
      description: 'A shared orchard of mango, guava and citrus with walking trails and a picnic meadow.',
      highlights: { 'Fruit trees': '240', Trails: '1.2 km' },
      media: [image('Orchard trails', 100)] },
    { id: 'am_gate', name: 'Estate Gate', kind: 'entrance', polygon: rect(-8, south + 62, 16, 6), height: 6,
      description: 'Gated entry with a security lodge and guest parking.',
      highlights: { Security: '24 × 7' } },
  ]
  roads.push({ id: 'road_entry', name: 'Palm Avenue', widthFt: 40, polygon: rect(-6, south, 12, 62) })
  const [[ox0, oz0], , [ox1, oz1]] = amenities.find((a) => a.kind === 'garden')!.polygon
  for (let x = ox0 + 4; x < ox1 - 2; x += 6)
    for (let z = oz0 + 4; z < oz1 - 2; z += 6) if (rand() < 0.8) trees.push([x + rand(), z + rand()])
  trees.push(...kerbTrees(roads[roads.length - 1].polygon, 8, 1.2, () => false))

  return { plots, roads, amenities, landscape: { trees } }
}

export const masterPlans: MasterPlan[] = [
  {
    id: 'mp_greenmeadows', slug: 'green-meadows', name: 'Green Meadows', type: 'plots', location: 'NH-48, Sector 88',
    tagline: 'A gated township of 500 residences set around two acres of parkland',
    thumbnailUrl: placeholderImage('Green Meadows', 95, 800, 500),
    startingPrice: 11_520_000,
    stats: [{ label: 'Residences', value: '500' }, { label: 'Parkland', value: '2 ac' }, { label: 'Possession', value: '2027' }],
    description: 'A gated plotted township with 30 ft tree-lined avenues, underground utilities, a 24,000 sq ft clubhouse and two acres of landscaped parks. Phase 1 villas are complete and open for viewing.',
    highlights: { 'Total land': '48 acres', Plots: '500', 'Plot size': '40 × 60 ft', 'Internal roads': '30 ft', 'Open space': '38%', RERA: 'Registered' },
    ...buildTownship(),
    media: [film('Green Meadows — project film', 100), image('Aerial at golden hour', 95), image('Tree-lined avenue', 120), image('Phase 1 villas', 40)],
    nearby: [
      { name: 'Delhi Public School', distance: '1.2 km' },
      { name: 'City Hospital', distance: '3.5 km' },
      { name: 'Metro Station', distance: '4 km' },
      { name: 'IGI Airport', distance: '28 km' },
    ],
  },
  {
    id: 'mp_palmgrove', slug: 'palm-grove-estate', name: 'Palm Grove Estate', type: 'plots', location: 'Kharkhoda Road',
    tagline: 'Twenty one-acre farm estates with orchards, a clubhouse and an infinity pool',
    thumbnailUrl: placeholderImage('Palm Grove Estate', 110, 800, 500),
    startingPrice: 47_916_000,
    stats: [{ label: 'Farm estates', value: '20' }, { label: 'Each', value: '1 acre' }, { label: 'Fruit trees', value: '800+' }],
    description: 'A private farm-estate community of twenty one-acre parcels, each bordered by fruit-tree hedgerows, with a shared clubhouse, infinity pool and orchard garden.',
    highlights: { 'Total land': '32 acres', Estates: '20', 'Estate size': '1 acre', Roads: '33 ft' },
    ...buildFarmEstate(),
    media: [film('Palm Grove — estate film', 110), image('Orchard at dawn', 110), image('Farmhouse verandah', 40)],
    nearby: [
      { name: 'KMP Expressway', distance: '6 km' },
      { name: 'Sonipat City', distance: '14 km' },
      { name: 'IGI Airport', distance: '52 km' },
    ],
  },
]
