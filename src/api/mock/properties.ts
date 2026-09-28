import type { CameraPreset, Floor, MediaItem, PlaceholderBlock, Property, Room } from '../types'
import { placeholderImage, placeholderPano } from './placeholders'

// Public sample stream so the HLS player path can be exercised; replace with R2-hosted HLS.
const SAMPLE_HLS = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'

let seq = 0
const id = (prefix: string) => `${prefix}_${++seq}`

function image(title: string, hue: number): MediaItem {
  const url = placeholderImage(title, hue)
  return { id: id('m'), kind: 'image', title, url, thumbUrl: placeholderImage(title, hue, 480, 300) }
}

function pano(title: string, hue: number): MediaItem {
  return { id: id('m'), kind: 'pano', title: `${title} 360°`, url: placeholderPano(title, hue), thumbUrl: placeholderImage(`${title} 360°`, hue, 480, 300) }
}

interface RoomSpec {
  name: string
  meshName: string
  floor: Floor | null
  block: Omit<PlaceholderBlock, 'meshName' | 'group' | 'level' | 'color'>
  hue: number
  description: string
  specs?: string[]
  amenities?: string[]
  pano?: boolean
}

const M_TO_FT = 3.28084

function buildRooms(specs: RoomSpec[]): { rooms: Room[]; blocks: PlaceholderBlock[] } {
  const rooms: Room[] = []
  const blocks: PlaceholderBlock[] = []
  for (const s of specs) {
    const length = Math.round(s.block.w * M_TO_FT)
    const width = Math.round(s.block.d * M_TO_FT)
    const media = [image(`${s.name} — view 1`, s.hue), image(`${s.name} — view 2`, s.hue + 20)]
    if (s.pano) media.push(pano(s.name, s.hue))
    rooms.push({
      id: id('room'),
      name: s.name,
      kind: s.floor ? 'room' : 'outdoor',
      meshName: s.meshName,
      floorId: s.floor?.id ?? null,
      dimensions: { length, width, unit: 'ft' },
      areaSqft: length * width,
      description: s.description,
      specs: s.specs ?? [],
      amenities: s.amenities ?? [],
      media,
    })
    blocks.push({
      ...s.block,
      meshName: s.meshName,
      group: s.floor?.groupName ?? 'outdoor',
      level: s.floor?.level ?? 0,
      // three.js only parses the comma form of hsl().
      color: `hsl(${s.hue % 360}, 45%, 55%)`,
    })
  }
  return { rooms, blocks }
}

const standardPresets = (scale = 1): CameraPreset[] => [
  { id: 'aerial', name: 'Aerial', position: [30 * scale, 28 * scale, 30 * scale], target: [0, 2, 0] },
  { id: 'front', name: 'Front', position: [0, 6 * scale, 34 * scale], target: [0, 3, 0] },
  { id: 'side', name: 'Side', position: [-34 * scale, 8 * scale, 4], target: [0, 3, 0] },
  { id: 'top', name: 'Top view', position: [0, 55 * scale, 0.01], target: [0, 0, 0] },
]

function villa(): Property {
  const G: Floor = { id: id('floor'), name: 'Ground Floor', level: 0, groupName: 'floor_G' }
  const F1: Floor = { id: id('floor'), name: 'First Floor', level: 1, groupName: 'floor_1' }
  const { rooms, blocks } = buildRooms([
    { name: 'Living Room', meshName: 'room_living', floor: G, block: { x: -4, z: 2, w: 8, d: 8 }, hue: 30, pano: true,
      description: 'Double-height living room opening onto the pool deck through full-width sliding glass.',
      specs: ['Italian marble flooring', '14 ft ceiling', 'Floor-to-ceiling glazing', 'Concealed AC'],
      amenities: ['Home theatre ready', 'Smart lighting'] },
    { name: 'Guest Bedroom', meshName: 'room_bed_guest', floor: G, block: { x: -4, z: -4, w: 8, d: 4 }, hue: 260,
      description: 'Ground-floor guest suite with attached bath, ideal for elderly parents.',
      specs: ['Wooden flooring', 'Walk-in wardrobe', 'Attached bath'] },
    { name: 'Kitchen', meshName: 'room_kitchen', floor: G, block: { x: 4, z: -3, w: 8, d: 6 }, hue: 150, pano: true,
      description: 'Modular kitchen with island counter and a separate utility area.',
      specs: ['Quartz countertop', 'Hob & chimney', 'Built-in oven provision', 'Utility balcony'] },
    { name: 'Dining', meshName: 'room_dining', floor: G, block: { x: 4, z: 3, w: 8, d: 6 }, hue: 60,
      description: 'Eight-seater dining space connected to the kitchen and living room.',
      specs: ['Pendant lighting', 'Crockery unit'] },
    { name: 'Master Bedroom', meshName: 'room_bed_master', floor: F1, block: { x: -4, z: -2, w: 8, d: 8 }, hue: 280, pano: true,
      description: 'Master suite with walk-in closet, luxury bath and private terrace access.',
      specs: ['Engineered wood flooring', 'Walk-in closet', 'Rain shower + bathtub'], amenities: ['Private terrace'] },
    { name: 'Bedroom 2', meshName: 'room_bed_2', floor: F1, block: { x: 4, z: -3, w: 8, d: 6 }, hue: 200,
      description: 'Spacious second bedroom with study nook.', specs: ['Wooden flooring', 'Study nook', 'Attached bath'] },
    { name: 'Family Lounge', meshName: 'room_lounge', floor: F1, block: { x: 4, z: 3, w: 8, d: 6 }, hue: 20,
      description: 'Upper-floor family lounge overlooking the living room.' },
    { name: 'Terrace', meshName: 'room_terrace', floor: F1, block: { x: -4, z: 4, w: 8, d: 4 }, hue: 100,
      description: 'Open terrace with pergola and planter boxes.', amenities: ['Pergola', 'Outdoor seating'] },
    { name: 'Swimming Pool', meshName: 'amenity_pool', floor: null, block: { x: -2, z: 12, w: 12, d: 6 }, hue: 195, pano: true,
      description: 'Private 12 m pool with sun deck and outdoor shower.', specs: ['Infinity edge', 'Heated', 'Deck lighting'] },
    { name: 'Garden', meshName: 'amenity_garden', floor: null, block: { x: -14, z: 4.5, w: 8, d: 21 }, hue: 120,
      description: 'Landscaped side garden with lawn, fruit trees and a sit-out.', amenities: ['Lawn', 'Drip irrigation'] },
    { name: 'Parking', meshName: 'amenity_parking', floor: null, block: { x: 14, z: -1, w: 8, d: 10 }, hue: 0,
      description: 'Covered parking for two cars with EV charging point.', amenities: ['2 cars', 'EV charger'] },
  ])

  return {
    id: 'p_aranya', slug: 'aranya-villa', name: 'Aranya Villa', type: 'villa', location: 'Sector 21, Green Valley',
    tagline: 'A four-bedroom residence with a private pool and double-height living', thumbnailUrl: placeholderImage('Aranya Villa', 30, 800, 500),
    startingPrice: 32_500_000,
    stats: [{ label: 'Built-up', value: '4,200 sq ft' }, { label: 'Bedrooms', value: '4' }, { label: 'Levels', value: 'G + 1' }],
    description: 'A contemporary 4 BHK villa on a 5,000 sq ft plot with a private pool, landscaped garden and double-height living.',
    highlights: { 'Built-up area': '4,200 sq ft', 'Plot area': '5,000 sq ft', Bedrooms: '4', Floors: 'G + 1', Possession: 'Dec 2027' },
    model: { kind: 'placeholder', blocks },
    floors: [G, F1], rooms, presets: standardPresets(),
    media: [
      image('Aranya — front elevation', 30), image('Aranya — pool deck at dusk', 200), image('Aranya — aerial', 120),
      { id: id('m'), kind: 'video', title: 'Walkthrough film (sample stream)', url: SAMPLE_HLS, thumbUrl: placeholderImage('Walkthrough film', 10, 480, 300) },
      { id: id('m'), kind: 'floorplan', title: 'Ground floor plan', url: placeholderImage('Ground floor plan', 220), thumbUrl: placeholderImage('Ground floor plan', 220, 480, 300) },
    ],
  }
}

function farmhouse(): Property {
  const G: Floor = { id: id('floor'), name: 'Ground Floor', level: 0, groupName: 'floor_G' }
  const { rooms, blocks } = buildRooms([
    { name: 'Great Room', meshName: 'room_living', floor: G, block: { x: -5, z: 0, w: 10, d: 10 }, hue: 35, pano: true,
      description: 'Vaulted great room with exposed timber trusses and a fireplace.', specs: ['Kota stone flooring', 'Fireplace', 'Timber trusses'] },
    { name: 'Kitchen', meshName: 'room_kitchen', floor: G, block: { x: 5, z: -2.5, w: 10, d: 5 }, hue: 150,
      description: 'Farmhouse kitchen with pantry.', specs: ['Granite counter', 'Walk-in pantry'] },
    { name: 'Bedroom 1', meshName: 'room_bed_1', floor: G, block: { x: 5, z: 2.5, w: 10, d: 5 }, hue: 270,
      description: 'Bedroom opening onto the verandah.', specs: ['Attached bath', 'Verandah access'] },
    { name: 'Swimming Pool', meshName: 'amenity_pool', floor: null, block: { x: 0, z: 12, w: 14, d: 6 }, hue: 195,
      description: 'Pool with cabana and deck.' },
    { name: 'Orchard', meshName: 'amenity_garden', floor: null, block: { x: -18, z: 4, w: 12, d: 24 }, hue: 110,
      description: 'Mango and guava orchard with drip irrigation.', amenities: ['40 fruit trees', 'Drip irrigation'] },
    { name: 'Parking', meshName: 'amenity_parking', floor: null, block: { x: 17, z: 0, w: 8, d: 12 }, hue: 0,
      description: 'Open parking for four cars.' },
  ])
  return {
    id: 'p_palmgrove', slug: 'palm-grove-farmhouse', name: 'Palm Grove Farmhouse', type: 'farmhouse', location: 'Kharkhoda Road',
    tagline: 'A single-storey farmhouse with wide verandahs, an orchard and a pool', thumbnailUrl: placeholderImage('Palm Grove Farmhouse', 110, 800, 500),
    startingPrice: 48_000_000,
    stats: [{ label: 'Land', value: '1 acre' }, { label: 'Built-up', value: '3,000 sq ft' }, { label: 'Bedrooms', value: '3' }],
    description: 'A single-storey farmhouse on one acre with an orchard, pool and wide verandahs.',
    highlights: { 'Land area': '1 acre', 'Built-up area': '3,000 sq ft', Bedrooms: '3', Floors: 'G' },
    model: { kind: 'placeholder', blocks }, floors: [G], rooms, presets: standardPresets(1.2),
    media: [
      image('Palm Grove — approach', 110), image('Palm Grove — verandah', 40),
      { id: id('m'), kind: 'video', title: 'Farmhouse film (sample stream)', url: SAMPLE_HLS, thumbUrl: placeholderImage('Farmhouse film', 60, 480, 300) },
    ],
  }
}

/**
 * Palm Grove Farmhouse on Plot E-02, shown as a furnished luxury interior design model. Rooms map
 * to the room_* / amenity_* hotspots in the model (features/property/scene/furnished/palmGroveE02).
 */
function palmGroveE02(): Property {
  const G: Floor = { id: id('floor'), name: 'Ground Floor', level: 0, groupName: 'floor_G' }
  const room = (
    name: string, meshName: string, floor: Floor | null, [lengthM, widthM]: [number, number], hue: number,
    description: string, specs: string[], amenities: string[] = [],
  ): Room => {
    const length = Math.round(lengthM * M_TO_FT)
    const width = Math.round(widthM * M_TO_FT)
    return {
      id: id('room'), name, kind: floor ? 'room' : 'outdoor', meshName, floorId: floor?.id ?? null,
      dimensions: { length, width, unit: 'ft' }, areaSqft: length * width, description, specs, amenities,
      media: [image(`${name} — view 1`, hue), image(`${name} — view 2`, hue + 20)],
    }
  }
  const rooms: Room[] = [
    room('Arrival Foyer', 'room_foyer', G, [2.4, 2.3], 35,
      'A hotel-lobby arrival: a solid smoked-oak pivot door opens onto a travertine drum table under a hand-blown smoked-glass chandelier, on axis with the statement artwork in the dining room.',
      ['Honed cross-cut travertine, 800 × 1600', 'Silver Travertine inset with bronze edge', 'Smoked-oak pivot door, 1200 mm bronze pull', 'Ø1200 smoked-glass and bronze chandelier'],
      ['Shoe bench on the verandah']),
    room('Living Room', 'room_living', G, [4.8, 5.6], 30,
      'Gathered around the fire under exposed timber trusses: a 3.2 m bouclé sofa, a pair of walnut and cognac-leather lounge chairs and nested travertine tables, with sliding glass to the verandah.',
      ['Book-matched travertine chimney breast', 'Exposed trusses in smoked oak', 'Hand-knotted wool-silk rug', 'Motorised sheer and blackout linen'],
      ['Wood-burning fireplace', 'Truss uplighting']),
    room('Family Lounge', 'room_family', G, [4.2, 5.0], 20,
      'The everyday room: a deep-seat performance-linen sofa facing a full-height fluted walnut media wall with a 75″ screen, speakers concealed behind the flutes.',
      ['Fluted American walnut media wall', 'Floating console with travertine top', 'Wool and jute flat-weave rug', 'Linen acoustic panels between trusses'],
      ['Cinema lighting scene', 'Concealed surround sound']),
    room('Dining Room', 'room_dining', G, [10.0, 4.0], 45,
      'A ten-seat book-matched walnut table on twin travertine pedestals under a 2.6 m alabaster and bronze linear pendant, with a fluted walnut sideboard and the statement artwork.',
      ['Solid walnut table, 3200 × 1150', 'Olive mohair-velvet dining chairs', 'Sideboard with Taj Mahal quartzite top', 'Pendant dims warm to 2200 K']),
    room('Kitchen & Pantry', 'room_kitchen', G, [10.0, 5.0], 150,
      'A show kitchen with a leathered Taj Mahal quartzite island and a matt olive-grey tall wall, and behind it a walk-in pantry and wet kitchen for everyday Indian cooking.',
      ['Leathered quartzite island with waterfall ends', 'Fluted smoked-oak island base', 'Integrated fridge columns, steam and speed ovens', 'Wet kitchen with wok burner and scullery'],
      ['Fluted-glass pocket doors to dining', 'Herb court window']),
    room('Master Suite', 'room_bed_master', G, [5.0, 4.4], 280,
      'Entered through a lit dressing room: a king bed with a 3 m channel-tufted mohair headboard set into a fluted walnut wall, a chaise by the window, a writing desk and a private garden.',
      ['Wide-plank smoked oak, 220 mm', 'Linen-wrapped wall panels', 'Bronze-tinted glass wardrobes', 'Bed-end bench with TV lift'],
      ['Walk-in dressing room', 'Private walled garden']),
    room('Master Bath', 'room_bath_master', G, [3.5, 2.6], 200,
      'Book-matched Fior di Bosco marble, a freestanding stone tub under the window, a walk-in rain shower and a floating walnut vanity with a backlit mirror.',
      ['Honed Fior di Bosco marble', 'Freestanding stone-resin tub', 'Brushed-bronze PVD fittings', 'Heated floor']),
    room('Bedroom 1 · Garden Suite', 'room_bed_1', G, [7.0, 5.0], 260,
      'A king bed against a 4.4 m fluted-oak wall, looking out through 3.8 m of sliding glass onto the verandah, with a dressing alcove and an attached bath.',
      ['Wide-plank smoked oak', 'Stone-linen upholstered headboard', 'Fluted oak wardrobe', 'Attached bath with walk-in shower'],
      ['Verandah access']),
    room('Study Bay', 'room_study', G, [3.0, 5.0], 40,
      'A library corner in the Garden Suite: a walnut writing desk with a leather inset facing the garden window, and a full-height lit smoked-oak library wall.',
      ['Walnut desk, 1600 × 700', 'Smoked-oak library wall with shelf lighting', 'Leather and bronze desk chair']),
    room('Bedroom 3', 'room_bed_3', G, [4.5, 3.6], 90,
      'A calm guest room in olive and oak with its own entry and bath; the desk under the window doubles as a dressing table.',
      ['Olive mohair bed wall', 'Wide-plank smoked oak', 'Fluted oak wardrobe', 'Attached bath']),
    room('Gallery & Powder Room', 'room_gallery', G, [1.5, 8.0], 50,
      'The single-storey home has no staircase; the passage to the bedrooms becomes a gallery along a glass wall to the kitchen court, ending in a sculpture and a basalt-plaster powder room.',
      ['Bronze-framed court glazing', 'Art wall-washers', 'Monolithic travertine basin', 'Night-path floor lighting']),
    room('Verandah Lounge', 'amenity_verandah', null, [20.0, 3.5], 40,
      'A 20 m verandah in leather-finish Kota stone with a teak lounge, outdoor dining for six and a daybed, screened from sun and mosquitoes between teak columns.',
      ['Leather-finish Kota stone', 'Teak batten ceiling with fans', 'Motorised woven outdoor blinds'],
      ['Outdoor lounge', 'Dining for 6']),
    room('Pool Deck & Cabana', 'amenity_pool', null, [14.0, 6.0], 195,
      'A 14 m pool on a travertine deck with four teak loungers, a linen-draped cabana daybed and date palms, lit warm after dark.',
      ['Anti-slip travertine deck', 'Sage-grey pebble pool finish', '2700 K underwater lighting'],
      ['Cabana', 'Outdoor shower']),
    room('Kitchen Court', 'amenity_court', null, [10.0, 8.0], 110,
      'A gravel courtyard between the kitchen and the gallery with a champa tree, weathering-steel herb beds and a stone breakfast table.',
      ['Gravel with Kota stepping stones', 'Champa (plumeria) tree', 'Curry leaf, tulsi, mint, lemongrass beds']),
    room('Orchard', 'amenity_garden', null, [12.0, 24.0], 110,
      'The mango and guava orchard on drip irrigation.',
      ['Mango and guava trees', 'Drip irrigation'], ['Fruit trees']),
  ]
  return {
    id: 'p_palmgrove_e02', slug: 'palm-grove-farmhouse-e02', name: 'Palm Grove Farmhouse', type: 'farmhouse', location: 'Kharkhoda Road',
    tagline: 'Plot E-02: a luxury modern farmhouse in travertine, smoked oak and fluted walnut',
    thumbnailUrl: placeholderImage('Palm Grove Farmhouse E-02', 35, 800, 500),
    startingPrice: 62_000_000,
    stats: [{ label: 'Land', value: '1 acre' }, { label: 'Built-up', value: '3,000 sq ft' }, { label: 'Bedrooms', value: '3' }],
    description:
      'A single-storey farmhouse on one acre, fully designed and furnished like a private villa hotel: honed travertine floors, fluted walnut and smoked oak joinery, brushed-bronze details and layered warm lighting, with a verandah, pool and orchard.',
    highlights: {
      'Land area': '1 acre (210 × 210 ft)', 'Built-up area': '3,000 sq ft', Bedrooms: '3 suites', Floors: 'G',
      Interiors: 'Fully furnished, custom furniture', Flooring: 'Travertine and smoked oak',
    },
    model: { kind: 'furnished', design: 'palm-grove-e02' }, floors: [G], rooms,
    presets: [
      { id: 'aerial', name: 'Aerial', position: [22, 22, 24], target: [-1, 0, -2] },
      { id: 'living', name: 'Great Room', position: [-2.2, 7, 8.5], target: [-5.5, 0.5, 0] },
      { id: 'wing', name: 'Bedroom wing', position: [2.5, 9, -3], target: [-5, 0.5, -10] },
      { id: 'front', name: 'Verandah & pool', position: [4, 5, 24], target: [-1, 1, 7] },
      { id: 'top', name: 'Plan view', position: [0, 42, -1.99], target: [0, 0, -2] },
    ],
    media: [
      image('Palm Grove E-02 — arrival axis', 35), image('Palm Grove E-02 — fireside living', 30), image('Palm Grove E-02 — master suite', 280),
      { id: id('m'), kind: 'video', title: 'Farmhouse film (sample stream)', url: SAMPLE_HLS, thumbUrl: placeholderImage('Farmhouse film', 60, 480, 300) },
    ],
  }
}

function commercial(): Property {
  const floors: Floor[] = [0, 1, 2].map((level) => ({
    id: id('floor'), name: level === 0 ? 'Ground Floor' : `Floor ${level}`, level, groupName: level === 0 ? 'floor_G' : `floor_${level}`,
  }))
  const { rooms, blocks } = buildRooms([
    { name: 'Retail Showroom A', meshName: 'room_shop_a', floor: floors[0], block: { x: -5, z: 0, w: 10, d: 12 }, hue: 40,
      description: 'Double-frontage retail unit on the main road.', specs: ['Glass shopfront', '16 ft clear height'] },
    { name: 'Retail Showroom B', meshName: 'room_shop_b', floor: floors[0], block: { x: 5, z: 0, w: 10, d: 12 }, hue: 70,
      description: 'Retail unit next to the lobby.', specs: ['Glass shopfront'] },
    { name: 'Office Floor 1', meshName: 'room_office_1', floor: floors[1], block: { x: 0, z: 0, w: 20, d: 12 }, hue: 210,
      description: 'Open-plan office floor plate.', specs: ['Raised flooring', 'VRV AC'] },
    { name: 'Office Floor 2', meshName: 'room_office_2', floor: floors[2], block: { x: 0, z: 0, w: 20, d: 12 }, hue: 230,
      description: 'Open-plan office floor plate with terrace.', specs: ['Raised flooring', 'VRV AC'] },
    { name: 'Parking', meshName: 'amenity_parking', floor: null, block: { x: 0, z: 13, w: 20, d: 8 }, hue: 0,
      description: 'Surface parking for 18 cars.' },
  ])
  return {
    id: 'p_skyline', slug: 'skyline-business-centre', name: 'Skyline Business Centre', type: 'commercial', location: 'Ring Road',
    tagline: 'High-street retail and flexible office floors on the Ring Road', thumbnailUrl: placeholderImage('Skyline Business Centre', 210, 800, 500),
    startingPrice: 9_500_000,
    stats: [{ label: 'Total area', value: '7,800 sq ft' }, { label: 'Levels', value: 'G + 2' }, { label: 'Frontage', value: '120 ft' }],
    description: 'A three-storey commercial block with high-street retail and flexible office floors.',
    highlights: { 'Total area': '7,800 sq ft', Floors: 'G + 2', 'Frontage': '120 ft' },
    model: { kind: 'placeholder', blocks }, floors, rooms, presets: standardPresets(),
    media: [image('Skyline — street view', 210), image('Skyline — lobby', 250)],
  }
}

export const properties: Property[] = [villa(), farmhouse(), palmGroveE02(), commercial()]
