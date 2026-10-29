import type { Floor, MediaItem, Property, Room } from '../types'
import { placeholderImage } from './placeholders'

// Served from public/videos/. Absolute so assetUrl() doesn't resolve it against the R2 domain.
const NYSHAS_HAVEN_FILM = `${window.location.origin}/videos/nyshas-haven-film.mp4`

let seq = 0
const id = (prefix: string) => `${prefix}_${++seq}`

function image(title: string, hue: number): MediaItem {
  const url = placeholderImage(title, hue)
  return { id: id('m'), kind: 'image', title, url, thumbUrl: placeholderImage(title, hue, 480, 300) }
}

/** A floor plan drawing served from public/plans/ (absolute, so assetUrl() leaves it alone). */
function floorPlan(title: string, file: string): MediaItem {
  const url = `${window.location.origin}/plans/${file}`
  return { id: id('m'), kind: 'floorplan', title, url, thumbUrl: url }
}

const M_TO_FT = 3.28084

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
      'Arrival through the arched gate at the north-west corner, onto the wide paved walk that runs beneath palms and planted borders past the house and down to the lawn.',
      ['Arched gate in Burma teak', 'Paved walk with semicircular steps', 'Hand-carved Balinese door with rustic brass handles']),
    area('The Residence', 'amenity_residence', [68, 63], 30,
      'A G+1 Balinese-inspired home in red brick cladding and cream textured walls, with Burma teak columns on carved stone bases, a full-width balcony over the pool, and a flat entertainment terrace on the roof behind a shingled slope across the pool front.',
      ['Red brick cladding and cream textured walls', 'Burma teak and hand-carved stone', 'Raw basalt floors', 'Elevator to the terrace'],
      ['4 bedrooms, 4 attached baths', '4 powder rooms', 'Formal and informal living', 'Pooja room', 'Bar, poker and party room']),
    area('Living Room', 'amenity_living', [39, 34], 28,
      'Entered from the pool through the carved teak double door: a full-height wall of teak-gridded glazing behind pleated linen sheers, washed by a warm LED cove from a ceiling pocket, with a chocolate drape drawn across the door, raw basalt floors, woven rattan pendants and a low cream sofa on a mustard jute rug.',
      ['Raw basalt floor', 'Ceiling-pocket sheers with warm LED cove', 'Teak-gridded glazing to the pool', 'Woven rattan pendants']),
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
      { id: 'entrance', name: 'Entrance', position: [60, 19, -13], target: [30, 1, -15], fov: 50 },
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
 * The residence on Kallakal Plot D-65, modelled from the client's reference elevation as an
 * exterior design model (features/property/scene/furnished/kalakalD65). Scene metres: +z east to
 * the 33 ft cross road, +x north to the 60 ft avenue; the house front stands 3 m inside the plot.
 */
function kalakalD65(): Property {
  const G: Floor = { id: id('floor'), name: 'Ground Floor', level: 0, groupName: 'floor_G' }
  const room = (name: string, meshName: string, [lengthM, widthM]: [number, number], description: string, specs: string[]): Room => {
    const length = Math.round(lengthM * M_TO_FT)
    const width = Math.round(widthM * M_TO_FT)
    return {
      id: id('room'), name, kind: 'outdoor', meshName, floorId: null,
      dimensions: { length, width, unit: 'ft' }, areaSqft: length * width, description, specs, amenities: [],
      // Only real drawings are shown for this home; no placeholder renders.
      media: [],
    }
  }
  const rooms: Room[] = [
    {
      id: id('room'), name: 'Kitchen', kind: 'room', meshName: 'room_kitchen', floorId: G.id,
      dimensions: { length: 14, width: 12, unit: 'ft' }, areaSqft: 167,
      description:
        'A U-shaped kitchen with a breakfast bar: sage handle-less cabinetry, a black French-door fridge and built-in ovens in a tall wall of units, a fluted oak panel with black open shelves and a lit glass cabinet over a stone splashback, and a 1.80 m bar with a fluted oak front and two upholstered stools under black pendants.',
      specs: ['4.20 × 3.70 m, 2.50 m false ceiling', 'Sage matt lacquer, handle-less fronts', 'White stone worktops, marble splashback', 'Black undermount sink and gooseneck tap', 'Gas hob in black glass', 'Warm LED under-cabinet and shelf lighting'],
      amenities: ['Breakfast bar, 1.80 m long, 0.95 m high', 'French-door fridge', 'Built-in oven and compact oven', 'Open shelving'],
      media: [],
    },
    room('Entrance', 'amenity_entrance', [2.4, 1.65],
      'Three white stone risers up to a covered landing under the first-floor box, and a flush teak main door with a full-height black pull, lit by an up-down wall lamp.',
      ['Teak main door, horizontal grooves', 'White stone steps and landing', 'Recessed downlight in the porch ceiling']),
    room('Carport', 'amenity_carport', [5.3, 3.06],
      'A covered carport beneath the balcony with a teak-boarded ceiling and recessed downlights, opening straight onto the drive.',
      ['Teak soffit with four downlights', 'Granite-look paving', 'Grooved back wall with a three-pane window']),
    room('Balcony', 'amenity_balcony', [4.63, 2.1],
      'The first-floor balcony inside the white box: frameless glass balustrade, a teak lattice screen at one end and a teak ceiling, opening from two glazed doors.',
      ['Frameless glass balustrade, black top rail', 'Teak lattice screen', 'Teak soffit with downlights']),
    room('Front Garden', 'amenity_garden', [4.9, 5.1],
      'A lawn before the stone pier, edged with a low hedge, with a planted bed at the foot of the stone and stepping slabs to the entrance.',
      ['Lawn with hedge border', 'Stepping-stone path', 'Spike and path lights']),
  ]
  return {
    id: 'p_kalakal_d65', slug: 'kalakal-d65', name: 'Residence D-65', type: 'villa', location: 'Kallakal, NH-44',
    tagline: 'A G+1 contemporary home on a north-east corner plot',
    thumbnailUrl: placeholderImage('Residence D-65', 30, 800, 500),
    stats: [{ label: 'Plot', value: '40′ × 60′' }, { label: 'Floors', value: 'G + 1' }, { label: 'Facing', value: 'North-east' }],
    description:
      'A contemporary G+1 residence on corner Plot D-65 in Kallakal: a charcoal frame holding a split-face ledgestone pier with a double-height window and vertical teak battens, beside a white first-floor box with a glass-railed balcony and teak lattice over a covered carport.',
    highlights: {
      Plot: 'D-65 · 40′ × 60′ (2,400 sq ft)', Facing: 'North-east corner, 33 ft and 60 ft roads', Floors: 'Ground + 1',
      'Façade': '25′ wide · 7.9 m to the top of the frame', Parking: 'Covered carport', Finishes: 'Ledgestone, teak, white render, black aluminium',
    },
    model: { kind: 'furnished', design: 'kalakal-d65' }, floors: [G], rooms,
    presets: [
      { id: 'front', name: 'Front elevation', position: [2.5, 5.0, 22.5], target: [0.2, 3.4, 5.5], fov: 38 },
      { id: 'corner', name: 'North-east corner', position: [15.5, 6.5, 19.5], target: [0.5, 3.4, 3], fov: 40 },
      { id: 'elevation', name: 'Straight-on elevation', position: [0, 7.2, 46], target: [0, 3.95, 6], fov: 13 },
      { id: 'south', name: 'South side', position: [-17, 5.5, 4], target: [0, 3.4, 0] },
      { id: 'north', name: 'North side (avenue)', position: [21, 5.5, 2], target: [0, 3.4, -0.5] },
      { id: 'aerial', name: 'Aerial', position: [16, 30, 26], target: [0, 0, 0] },
      { id: 'entrance', name: 'Entrance, eye level', position: [-2.2, 1.75, 13.5], target: [-0.5, 1.0, 5], fov: 50 },
      { id: 'top', name: 'Plan view', position: [0, 60, -0.01], target: [0, 0, 0] },
    ],
    media: [
      floorPlan('Ground floor plan', 'd65-ground-floor.png'), floorPlan('First floor plan', 'd65-first-floor.png'),
    ],
  }
}

export const properties: Property[] = [nyshasHaven(), kalakalD65()]
