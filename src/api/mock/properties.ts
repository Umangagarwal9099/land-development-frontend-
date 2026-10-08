import type { CameraPreset, Floor, MediaItem, PlaceholderBlock, Property, Room } from '../types'
import { placeholderImage, placeholderPano } from './placeholders'

// Public sample stream so the HLS player path can be exercised; replace with R2-hosted HLS.
const SAMPLE_HLS = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
// Served from public/videos/. Absolute so assetUrl() doesn't resolve it against the R2 domain.
const NYSHAS_HAVEN_FILM = `${window.location.origin}/videos/nyshas-haven-film.mp4`

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

/**
 * Nysha’s Haven, Osman Sagar Lake: Terranova’s Balinese-inspired farmhouse, shown as its site in 3D
 * (features/property/scene/furnished/nyshasHaven). Areas map to its amenity_* hotspots; the
 * residence opens from outside until the interiors are modelled room by room.
 */
function nyshasHaven(): Property {
  const area = (
    name: string, meshName: string, [lengthFt, widthFt]: [number, number], hue: number, description: string, specs: string[], amenities: string[] = [],
  ): Room => ({
    id: id('room'), name, kind: 'outdoor', meshName, floorId: null,
    dimensions: { length: lengthFt, width: widthFt, unit: 'ft' }, areaSqft: lengthFt * widthFt, description, specs, amenities,
    media: [image(`${name} — view 1`, hue), image(`${name} — view 2`, hue + 20)],
  })
  const rooms: Room[] = [
    area('Arrival & North Walk', 'amenity_arrival', [88, 18], 35,
      'Arrival through the arched gate at the north-west corner, onto the wide paved walk that runs under flame trees past the house and down to the lawn.',
      ['Arched gate in Burma teak', 'Paved walk with semicircular steps', 'Hand-carved Balinese door with rustic brass handles']),
    area('The Residence', 'amenity_residence', [68, 63], 30,
      'A G+1 Balinese-inspired home in red brick cladding and cream textured walls, with Burma teak columns on carved stone bases, a full-width balcony over the pool, and a low shingled hip roof whose flat top is the entertainment terrace.',
      ['Red brick cladding and cream textured walls', 'Burma teak and hand-carved stone', 'Raw basalt floors', 'Elevator to the terrace'],
      ['4 bedrooms, 4 attached baths', '4 powder rooms', 'Formal and informal living', 'Pooja room', 'Bar, poker and party room']),
    area('Rooftop Terrace', 'amenity_terrace', [39, 47], 40,
      'Climbed by the seven-tonne sculptural steel staircase or the elevator: a round alang-alang thatched bar clad in river stone over the lake, sunken seating for bonfire nights, and a 560 sq ft gaming and home-theatre room behind sliding glass.',
      ['Alang-alang thatch', 'River-stone bar counter', 'Glass balustrade'], ['Terrace bar', 'Bonfire seating', 'Gaming & home theatre']),
    area('Infinity Pool', 'amenity_pool', [34, 24], 190,
      'A 34′ × 24′ infinity pool in natural green Bali Sukabumi stone, aligned with the view from the east entrance, with a children’s pool, sunken seating at water level, a rounded bay at its north end, heat-pump heating and the thatched changing and dining hall along its south side.',
      ['Green Bali Sukabumi stone', 'Heat-pump heating', 'Basalt pool deck', 'Underwater lighting'], ['Children’s pool', 'Sunken seating', 'Thatched changing hall']),
    area('Lawn & Gardens', 'amenity_lawn', [95, 80], 110,
      'A wide lawn of Korean carpet grass running from the pool terrace east to the lake, reached by curved lit steps and edged with palms, with automated sprinkler and drip irrigation.',
      ['Korean carpet grass', 'Automated sprinklers and drip irrigation', 'Curved lit steps']),
    area('Bamboo Bar', 'amenity_bamboobar', [19, 19], 45,
      'A round thatched bamboo kiosk at the north side of the lawn, with a beach-shack feel.', ['Bamboo structure', 'Alang-alang thatch']),
    area('Boulder Deck', 'amenity_deck', [88, 11], 60,
      'A 125 ft open deck paved with boulders from the site itself, behind a low wavy stone wall between the lawn and the court: ready for barbecues, yoga, Diwali gatherings, live music or an intimate wedding.',
      ['Site boulders', 'Wavy river-stone wall'], ['Barbecue counter', 'Lake views']),
    area('Sports Court', 'amenity_court', [118, 50], 210,
      'A full tennis court along the south side that converts for basketball, cricket and badminton, behind a tall mesh fence, with murals of sporting legends on its south wall.',
      ['Full-size tennis court', 'Basketball hoops', 'Floodlights'], ['Tennis', 'Basketball', 'Cricket', 'Badminton']),
    area('Arcade Building', 'amenity_arcade', [52, 52], 250,
      'A two-storey arcade beside the house with balconies front and side and an open pavilion on top under a grey roof: table tennis, chess, PlayStation, refreshments and changing rooms.', ['Two storeys and roof pavilion', 'Balconies'], ['Table tennis', 'Chess', 'PlayStation', 'Refreshments']),
  ]
  return {
    id: 'p_nyshas_haven', slug: 'nyshas-haven', name: 'Nysha’s Haven', type: 'farmhouse', location: 'Gandipet, Hyderabad',
    tagline: 'Terranova’s first project: the spirit of Bali, crafted in Hyderabad', thumbnailUrl: placeholderImage('Nysha’s Haven', 110, 800, 500),
    stats: [{ label: 'Land', value: '~1 acre' }, { label: 'Bedrooms', value: '4' }, { label: 'Structure', value: 'G + 1' }],
    description:
      'A Balinese-inspired farmhouse of nearly one acre on the edge of Osman Sagar Lake. The residence sits highest on the natural slope, with the pool and landscaped terraces stepping down toward the water, in a warm palette of red brick, cream textured walls, Burma teak, hand-carved stone, raw basalt and alang-alang thatch.',
    highlights: {
      Location: 'Osman Sagar Lake, Hyderabad', Land: 'Nearly 1 acre', Structure: 'G + 1 with entertainment terrace, elevator',
      Bedrooms: '4, with attached baths; 4 powder rooms', 'Living spaces': 'Formal ~1,100 · Informal ~750 · Family lounge ~800 sq ft',
      Entertainment: 'Bar · Poker & party room · Gaming & theatre · Terrace bar', Outdoors: 'Infinity pool · Sports court · Arcade · Bamboo bar · 125 ft deck',
      Materials: 'Burma teak, basalt, river stone, Sukabumi stone, alang-alang thatch',
    },
    model: { kind: 'furnished', design: 'nyshas-haven' }, floors: [], rooms,
    // Camera positions are in scene metres; the site stands on a 1.2 m podium.
    presets: [
      // The view in the photographs: level with the balcony, square to the pool front.
      { id: 'drone', name: 'Drone view', position: [70, 58, 26], target: [11, 0, 4], fov: 42 },
      { id: 'photo', name: 'As photographed', position: [36, 12.6, 0.6], target: [-6, 6.4, 0.6], fov: 52 },
      { id: 'aerial', name: 'Aerial', position: [34, 58, 70], target: [-2, 3, 0] },
      { id: 'lake', name: 'From the lake', position: [64, 9, 2], target: [-4, 6, 0] },
      { id: 'steps', name: 'Pool & steps', position: [38, 17, 14], target: [15, 2.4, 5], fov: 46 },
      { id: 'hut', name: 'Lawn & hut', position: [46, 18, 0], target: [20, 1, -1], fov: 50 },
      { id: 'pool', name: 'Pool & residence', position: [26, 7.5, 2], target: [-6, 7, 0] },
      { id: 'arrival', name: 'North walk', position: [40, 7, -17], target: [-10, 5, -18] },
      { id: 'terrace', name: 'Rooftop', position: [4, 22, 18], target: [-9, 13, 0] },
      { id: 'court', name: 'Court & deck', position: [22, 24, 58], target: [22, 2, 20] },
      { id: 'top', name: 'Site plan', position: [22, 120, 3.01], target: [22, 0, 3] },
    ],
    media: [
      { id: id('m'), kind: 'video', title: 'Nysha’s Haven', url: NYSHAS_HAVEN_FILM, thumbUrl: placeholderImage('Nysha’s Haven — project film', 110, 480, 300) },
      image('Nysha’s Haven — pool and residence', 110), image('Nysha’s Haven — terrace bar', 40), image('Nysha’s Haven — dining', 30),
    ],
  }
}

/**
 * The Kalakal Clubhouse on the layout's social-infrastructure site, shown as a furnished design
 * model. Rooms map to the room_* / amenity_* hotspots in features/property/scene/furnished/kalakalClubhouse.
 */
function kalakalClubhouse(): Property {
  const G: Floor = { id: id('floor'), name: 'Clubhouse', level: 0, groupName: 'floor_G' }
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
    room('Arrival Court', 'amenity_entrance', null, [47.7, 16.7], 35,
      'A granite-sett drop-off loop around a lit fountain and a stone monolith bearing the club name, under a 7 m cantilevered porte-cochère with a fluted walnut soffit. Parking and date palms either side.',
      ['Granite setts and travertine paving', 'Cantilevered canopy, fluted walnut soffit', 'Bronze-clad canopy columns', 'Facade grazing lights and lit portal reveals'],
      ['Valet drop-off', '8 visitor parking bays', 'Fountain with bronze sculpture']),
    room('Grand Lobby & Reception', 'room_lobby', G, [14.0, 13.0], 40,
      'Through glass pivot doors into a Statuario marble lobby: the reception desk in front of a honed stone wall bearing the club name, and a seating area either side of the arrival.',
      ['Statuario marble, 1200 × 1200', 'Honed stone reception wall with bronze lettering', 'Fluted oak panelling', 'Perimeter cove and recessed downlights'],
      ['Reception and concierge', 'Waiting lounge']),
    room('Carrom & Darts', 'room_carrom', G, [14.0, 6.0], 60,
      'The games room behind reception: two tournament carrom boards under low pendants and a pair of regulation dartboards with an oche and scoreboard, with clear walkways either side to the gym, changing rooms and board games.',
      ['Tournament carrom boards on walnut stands', 'Regulation dartboards in oak cabinets, 2.37 m oche', 'Statuario marble floor'],
      ['Carrom', 'Darts']),
    room('Video Gaming Lounge', 'room_gaming', G, [15.0, 13.0], 230,
      'A gaming lounge facing the avenue and the park: two console stations with racing-style gaming chairs, a sofa station on a large screen, two racing simulators with triple monitors, and a marked VR play area.',
      ['Large-format screens with bias lighting', 'Racing-style gaming chairs', 'Direct-drive racing simulators, triple 27″ monitors', 'VR play area, 2.6 × 2.6 m, with tracking sensors'],
      ['Console gaming', 'Racing simulators', 'Virtual reality', 'Game library']),
    room('Billiards Room', 'room_billiards', G, [7.5, 13.0], 150,
      'A 9 ft tournament table in walnut and bronze under a three-shade pendant, with 1.5 m cue clearance all round, a fluted walnut feature wall and cue rack, and leather club chairs for spectators.',
      ['9 ft slate-bed table, steel-blue cloth', 'Wall-mounted walnut cue rack', 'Solid walnut flooring', 'Dimmable pendant 1 m above the cloth'],
      ['Spectator club chairs', 'Bar-height table']),
    room('Table Tennis', 'room_tt', G, [7.5, 13.0], 210,
      'An ITTF-size table on cushioned sports vinyl with over 3 m of run-back at each end, court barriers, a bat and ball store, benches, and glare-free linear LED lighting.',
      ['Cushioned sports vinyl flooring', 'ITTF-size table, 2.74 × 1.525 m', 'Court barrier panels', '500 lux linear LED lighting'],
      ['Equipment store', 'Player benches']),
    room('Chess & Board Games', 'room_boardgames', G, [15.0, 8.0], 60,
      'A quiet library lounge: two walnut chess tables under alabaster globes, a round games table, oak shelves stocked with board games, and reading chairs by the park glass.',
      ['Walnut chess tables with inlaid boards', 'Oak game library with lit shelves', 'Wool rug on smoked oak'],
      ['Chess', 'Board and card games']),
    room('Recreation Lounge', 'room_recreation', G, [15.0, 7.0], 240,
      'Match nights and family games: a large screen over a floating walnut console, a deep velvet sofa and lounge chairs, foosball and air hockey, with glass onto the pool deck.',
      ['Large-format display with concealed sound', 'Velvet sofa and bouclé lounge chairs', 'Foosball and air-hockey tables'],
      ['Screenings', 'Gaming tables']),
    room('Fitness Centre', 'room_gym', G, [15.0, 15.0], 200,
      'A hotel-grade gym looking over the pool: treadmills, cross trainers, bikes and a rower facing the glass; a squat rack on a lifting platform, cable trainer and selectorised machines; free weights at a full-height mirror wall; and an oak-floored stretching and yoga zone.',
      ['Rubber sports flooring, 20 mm', 'Full-height mirror wall with fluted oak above', 'Linear LED battens', 'Glass partition to the gallery'],
      ['Cardio row', 'Strength machines', 'Free weights', 'Yoga and stretching', 'Equipment store']),
    room('Changing & Showers', 'room_changing', G, [14.0, 9.0], 190,
      "Men's and women's changing rooms between the lobby and the pool: oak lockers with lit kick plates, walk-in rain showers in travertine, private changing cubicles, Statuario vanities with backlit mirrors and full-length mirrors.",
      ['Travertine walls and floors, basalt shower trays', 'Oak locker banks with bronze pulls', 'Rain showers with glass screens', 'Direct doors to the pool deck'],
      ['Lockers', 'Showers', 'Vanities', 'Private cubicles']),
    room('Training Pool', 'amenity_pool', null, [25.0, 15.5], 195,
      'A 25 m, six-lane training pool, 2 m deep, with deck-level overflow edges: competition starting blocks and touch pads, anti-wave lane lines, backstroke flags, a digital timing board and pace clocks, athlete stands, a raised coaches’ platform and a training-kit store.',
      ['25 m × 15.5 m, six 2.5 m lanes', 'Competition starting blocks, lane-numbered', 'Anti-wave lane lines, red within 5 m of the walls', 'White mosaic shell with blue lane targets', 'Anti-slip porcelain deck, stainless fittings', 'Underwater and floodlit deck lighting'],
      ['Timing board and pace clocks', 'Coaches’ platform', 'Athlete stands', 'Kickboards, pull buoys, fins and paddles']),
    room('Garden Terrace', 'amenity_garden', null, [11.5, 24.7], 110,
      'A quiet garden beside the pool behind a glass balustrade: a teak pergola lounge, sun loungers on the lawn, planted beds and trees lit from below at night.',
      ['Teak pergola and deck', 'Travertine stepping-stone path', 'Landscape uplighting and bollards'],
      ['Outdoor lounge', 'Loungers']),
  ]
  // Camera positions are in scene metres; the model stands on a 2.2 m podium.
  const y = 2.2
  return {
    id: 'p_kalakal_clubhouse', slug: 'kalakal-clubhouse', name: 'Kalakal Clubhouse', type: 'clubhouse', location: 'Kalakal, NH-44',
    tagline: 'A clubhouse with indoor games, a fitness centre and a 25 m training pool',
    thumbnailUrl: placeholderImage('Kalakal Clubhouse', 40, 800, 500),
    stats: [{ label: 'Built-up', value: '13,260 sq ft' }, { label: 'Pool', value: '25 m · 6 lanes' }, { label: 'Site', value: '3,666 sq yd' }],
    description:
      'The Kalakal clubhouse: a contemporary stone, glass and timber building on the layout’s social-infrastructure site, with a Statuario lobby and reception, a video gaming lounge, carrom and darts, billiards, table tennis, board games and recreation rooms, a hotel-grade fitness centre, changing rooms, and a 25 m six-lane training pool with stands and timing.',
    highlights: {
      Site: '3,666 sq yd (150′ × 214′9″)', 'Built-up area': '13,260 sq ft', 'Training pool': '25 m, 6 lanes, 2 m deep',
      'Indoor games': 'Billiards, table tennis, carrom, darts, video gaming, chess', Fitness: 'Cardio, strength, free weights, yoga', Parking: '8 bays + drop-off',
    },
    model: { kind: 'furnished', design: 'kalakal-clubhouse' }, floors: [G], rooms,
    presets: [
      { id: 'aerial', name: 'Aerial', position: [46, 48 + y, 54], target: [0, y, -2] },
      { id: 'arrival', name: 'Arrival & facade', position: [15, 4.5 + y, 45], target: [0, 3 + y, 17] },
      { id: 'pool', name: 'Training pool', position: [24, 12 + y, -46], target: [-2, y, -21] },
      { id: 'blocks', name: 'Starting end', position: [-19.5, 3.2 + y, -21], target: [4, y, -21] },
      { id: 'games', name: 'Games wing', position: [-2, 20 + y, 26], target: [-14, y, 10] },
      { id: 'gym', name: 'Fitness centre', position: [-4, 18 + y, -18], target: [-14.5, y, -3] },
      { id: 'top', name: 'Plan view', position: [0, 105, -0.01], target: [0, 0, 0] },
    ],
    media: [
      image('Kalakal Clubhouse — arrival at dusk', 35), image('Kalakal Clubhouse — grand lobby', 40), image('Kalakal Clubhouse — training pool', 195),
      image('Kalakal Clubhouse — fitness centre', 200),
    ],
  }
}

export const properties: Property[] = [villa(), nyshasHaven(), kalakalClubhouse()]
