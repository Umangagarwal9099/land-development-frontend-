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
      dimensions: { length: 11, width: 12, unit: 'ft' }, areaSqft: 135,
      description:
        'A U-shaped kitchen with a breakfast bar: sage handle-less cabinetry, a black French-door fridge and built-in ovens in a tall wall of units, a fluted oak panel with black open shelves and a lit glass cabinet over a stone splashback, and a 1.80 m bar with a fluted oak front and two upholstered stools under black pendants.',
      specs: ['3.40 × 3.70 m, 2.50 m false ceiling', 'Sage matt lacquer, handle-less fronts', 'White stone worktops, marble splashback', 'Black undermount sink and gooseneck tap', 'Gas hob in black glass', 'Warm LED under-cabinet and shelf lighting'],
      amenities: ['Breakfast bar, 1.80 m long, 0.95 m high', 'French-door fridge', 'Built-in oven and compact oven', 'Open shelving'],
      media: [],
    },
    {
      id: id('room'), name: 'Bedroom 1', kind: 'room', meshName: 'room_bedroom_g', floorId: G.id,
      dimensions: { length: 17, width: 12, unit: 'ft' }, areaSqft: 204,
      description:
        'The ground-floor bedroom: a 5.2 m feature wall of fluted walnut and textured white marble washed by a cove light, a built-out walnut unit with a lit decor niche, a 1.8 m upholstered wingback bed between light-grey bedside tables under amber glass pendants, and a wardrobe of walnut sliders and lit glass shutters with grey lofts above.',
      specs: ['5.20 × 3.65 m, 2.80 m ceiling', 'Walnut fluted panelling and walnut laminate', 'Textured white marble feature panel with cove light', 'Engineered oak flooring, trellis rug', 'Wardrobe with glass sliding shutters and loft storage'],
      amenities: ['1.8 m wingback bed', 'Two bedside tables', 'Lit decor niche', 'Wardrobe with sliding doors and lofts', 'Desk with drawers and office chair', 'Ceiling fan', 'Two-way bedside switches'],
      media: [],
    },
    {
      id: id('room'), name: 'Bathroom', kind: 'room', meshName: 'room_bath_g', floorId: G.id,
      dimensions: { length: 8, width: 6, unit: 'ft' }, areaSqft: 48,
      description:
        'The ground-floor bathroom: a floating oak vanity with a fluted drawer, stone top and vessel basin under a fluted oak panel and backlit pill mirror; a wall-hung toilet below a lit niche and a two-door cabinet; and a walk-in shower behind a black-framed glass panel, with a rain head, handheld and a lit niche in a herringbone-tiled wall.',
      specs: ['2.50 × 1.90 m, 2.30 m ceiling', 'Large-format greige porcelain, herringbone shower wall', 'Fluted oak vanity and panelling, stone top', 'Matt black fittings throughout', 'Three lighting circuits: ceiling, mirror and LEDs, pendant'],
      amenities: ['Walk-in shower with rain head and handheld', 'Backlit mirror', 'Wall-hung toilet', 'Storage cabinet and lit niches'],
      media: [],
    },
    {
      id: id('room'), name: 'Dining Room', kind: 'room', meshName: 'room_dining_g', floorId: G.id,
      dimensions: { length: 12.5, width: 9.9, unit: 'ft' }, areaSqft: 124,
      description:
        'The dining end of the open hall, by the side window: a natural-stone table for six with upholstered chairs on oak legs, built-in oak cabinetry with LED-lit shelves over drawers and cupboards, an abstract canvas between two bronze wall sconces, and bronze dome pendants over the table.',
      specs: ['3.80 × 3.02 m, open to the living room, 2.95 m false ceiling', 'Travertine racetrack top on oak slab legs, 1.50 × 0.90 m', 'Built-in light-oak cabinetry with LED shelf lighting', 'Large-format porcelain floor, warm white walls', 'Three lighting circuits: pendants, sconces and cabinetry, ceiling spots'],
      amenities: ['Dining table for six', 'Built-in storage with drawers and cupboards', 'Two dome pendants', 'Wall sconces and artwork'],
      media: [],
    },
    {
      id: id('room'), name: 'Living Room', kind: 'room', meshName: 'room_living_g', floorId: G.id,
      dimensions: { length: 12.5, width: 13.3, unit: 'ft' }, areaSqft: 166,
      description:
        'The living end of the open hall, by the double-height window: an oak-slatted TV wall with lit display niches either side over a floating console, a three-seat oatmeal sofa against the wall, a taupe lounge chair, a round travertine coffee table on a wool rug, sheer curtains and indoor plants, under a lit coffer.',
      specs: ['3.80 × 4.05 m, open to the dining room, 2.95 m false ceiling with a 3.07 m coffer', 'Oak slatted TV wall with LED-lit niches', 'Large-format porcelain floor, hand-tufted wool rug', 'Three lighting circuits: spots and wall washers, cove, TV wall'],
      amenities: ['Three-seat sofa', 'Lounge chair', 'Floating TV console with drawers', 'Display niches with storage', 'Sheer curtains'],
      media: [],
    },
    {
      id: id('room'), name: 'Bedroom 2', kind: 'room', meshName: 'room_bedroom_2', floorId: null,
      dimensions: { length: 11.8, width: 11.5, unit: 'ft' }, areaSqft: 136,
      description:
        'The first-floor bedroom at the head of the stair: an oak storage bed with drawers on three sides and a padded headboard between two oak bedside tables, a sliding wardrobe in cream and smoked glass with hinged lofts above, a curtained window, and an L-shaped corner study desk with a drawer pedestal, an open shelf and a cream swivel chair.',
      specs: ['3.50 × 3.60 m, 2.62 m ceiling', 'Pale oak furniture and flooring, warm cream walls', 'Storage bed with six drawers', 'Sliding wardrobe on three tracks, with hinged lofts', 'Three lighting circuits: ceiling and cove, bedside, desk'],
      amenities: ['1.5 × 1.9 m storage bed', 'Corner study desk', 'Sliding wardrobe', 'Two bedside tables with lamps', 'Two-way bedside switches'],
      media: [],
    },
    {
      id: id('room'), name: 'Bedroom 3', kind: 'room', meshName: 'room_bedroom_3', floorId: null,
      dimensions: { length: 15.4, width: 15, unit: 'ft' }, areaSqft: 215,
      description:
        'The front first-floor bedroom, with its own bathroom: a bed wall of walnut panels either side of honed grey stone with a lit shelf niche, a beige padded headboard, floating bedside tables under glass globe pendants, a wardrobe of walnut lofts over fluted glass sliders, a dark stone floor and grey rug, and a lit round ceiling recess with a fan.',
      specs: ['4.68 × 4.57 m, 2.60 m ceiling', 'Walnut laminate, honed grey stone, beige fabric', 'Fluted glass sliders in light grey satin frames, brass pulls', 'Dark stone floor, grey wool rug', 'Three lighting circuits: ceiling and cove, globe pendants, wardrobe'],
      amenities: ['1.8 m bed with padded headboard', 'Lit shelf niche', 'Sliding wardrobe with hinged lofts', 'Ceiling fan', 'Wide double door to the balcony', 'Attached bathroom (interior to follow)', 'Two-way bedside switches'],
      media: [],
    },
    {
      id: id('room'), name: 'Bedroom 3 Bathroom', kind: 'room', meshName: 'room_bath_3', floorId: null,
      dimensions: { length: 8.1, width: 7.7, unit: 'ft' }, areaSqft: 62,
      description:
        'The bathroom attached to Bedroom 3: a walk-in shower behind a bronze-framed glass divider, with stacked taupe tile, a lit three-bay niche and brushed brass fittings; a wall-hung toilet under a tall fluted oak cabinet; and a floating oak vanity with a stone top and vessel basin under a backlit pill mirror.',
      specs: ['2.36 × 2.47 m, 2.60 m ceiling', 'Stacked taupe tile, warm limewash walls', 'Fluted oak cabinet, stone vanity top', 'Brushed brass fittings throughout', 'Three lighting circuits: ceiling and strip, mirror and vanity wash, niche'],
      amenities: ['Walk-in shower with rain head and handheld', 'Backlit pill mirror', 'Wall-hung toilet with bidet spray', 'Two-drawer vanity', 'Two-door cabinet'],
      media: [],
    },
    {
      id: id('room'), name: 'Bedroom 4', kind: 'room', meshName: 'room_bedroom_4', floorId: null,
      dimensions: { length: 11.8, width: 11.6, unit: 'ft' }, areaSqft: 137,
      description:
        'The first-floor rear bedroom beside Bedroom 2: an arched wallpaper panel of sweeping gold and bronze blades between two arched mouldings, a walnut bed with a padded headboard, floating walnut bedside drawers with copper inlays, a white fluted wardrobe with long brass pulls, full grey curtains, a lit cove ceiling with a fan, white marble floor and a grid-patterned rug.',
      specs: ['3.55 × 3.60 m, 2.62 m ceiling with a lit cove', 'Feature wallpaper in an arched moulded frame', 'Walnut bed and floating bedside drawers, copper patti inlay', 'White fluted wardrobe, four hinged doors and lofts, brass pulls', 'Two lighting circuits and a ceiling fan'],
      amenities: ['1.65 m bed with padded headboard', 'Hinged wardrobe with hanging and shelves', 'Floating bedside drawers', 'Ceiling fan', 'Split air conditioner'],
      media: [],
    },
    {
      id: id('room'), name: 'Shared Bathroom', kind: 'room', meshName: 'room_bath_4', floorId: null,
      dimensions: { length: 6.9, width: 5.8, unit: 'ft' }, areaSqft: 40,
      description:
        'The first floor\'s shared bathroom off the hall: large-format warm beige tile on walls and floor, a walk-in shower behind a single black-edged glass panel with a black rain head, handheld and tiled niche, a floating light-oak vanity with a drawer over an open shelf, a white vessel basin, black wall taps and a backlit mirror, and a tiled ledge with a black flush plate behind the toilet, under the window.',
      specs: ['2.11 × 1.78 m, 2.60 m ceiling', 'Large-format 600 × 1200 mm beige porcelain', 'Light-oak floating vanity, white top', 'Matt black fittings', 'Two lighting circuits: ceiling, mirror'],
      amenities: ['Walk-in shower with rain head and handheld', 'Backlit mirror', 'Wall-hung toilet', 'Vanity drawer and open shelf'],
      media: [],
    },
    {
      id: id('room'), name: 'Staircase', kind: 'room', meshName: 'room_stairs_g', floorId: G.id,
      dimensions: { length: 8.5, width: 10.6, unit: 'ft' }, areaSqft: 90,
      description:
        'The stair hall behind the carport, off the hall and in front of the bathroom: a stair turning twice on winders, up the outer wall and back over the bathroom into the first-floor hall, with solid oak treads on white risers, a closed oak string, slim black balusters under an oak handrail, and a matching guard round the well on the first floor.',
      specs: ['18 risers of 181 mm on 250 mm goings', 'Three 1.0 m wide flights, two winders at each turn', '2.1 m clear headroom under the first-floor slab', 'Oak treads and handrail, black steel balusters at 83 mm'],
      amenities: ['Winders at both turns', 'Wall handrail on both flights', 'Low-level step lights'],
      media: [],
    },
    room('Entrance', 'amenity_entrance', [2.4, 1.65],
      'Three white stone risers up to a covered landing under the first-floor box, and a flush teak main door with a full-height black pull, lit by an up-down wall lamp.',
      ['Teak main door, horizontal grooves', 'White stone steps and landing', 'Recessed downlight in the porch ceiling']),
    room('Carport', 'amenity_carport', [4.6, 3.06],
      'A covered carport beneath the balcony with a teak-boarded ceiling and recessed downlights, opening straight onto the drive.',
      ['Teak soffit with four downlights', 'Granite-look paving', 'Grooved back wall with a three-pane window']),
    room('Balcony', 'amenity_balcony', [4.63, 2.1],
      'The first-floor balcony inside the white box: frameless glass balustrade, a teak lattice screen at one end and a teak ceiling, opening from a wide glazed double door in the front bedroom.',
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

/**
 * Prime Mall on commercial Plot A-02, Kallakal: the G+2 mall of the client's reference design,
 * modelled in 3D (features/property/scene/furnished/kalakalMall) as an exterior with its grounds.
 * Areas map to the model's amenity_* hotspots.
 */
function kalakalMall(): Property {
  const area = (name: string, meshName: string, [lengthFt, widthFt]: [number, number], description: string, specs: string[], amenities: string[] = []): Room => ({
    id: id('room'), name, kind: 'outdoor', meshName, floorId: null,
    dimensions: { length: lengthFt, width: widthFt, unit: 'ft' }, areaSqft: Math.round(lengthFt * widthFt), description, specs, amenities, media: [],
  })
  const rooms: Room[] = [
    area('Main Entrance', 'amenity_entrance', [39, 31],
      'The entrance in the link between the two blocks, where the faceted skin dips: a double-height glazed front behind automatic sliding doors, under a white cantilevered canopy whose line runs on as the band beneath the north block. Inside, a lobby rises through two floors to a gallery and a ring of lit pendants.',
      ['Double-height structural glazing', 'Automatic sliding doors, 4.4 m frame', 'White ACP canopy on stainless tie rods, recessed downlights', 'Honed stone forecourt at +0.45 m'],
      ['Steps and a 1:20 accessible ramp from the drop-off', 'Benches and planters on the forecourt']),
    area('Forecourt & Drop-off', 'amenity_forecourt', [150, 26],
      'The raised forecourt before the mall steps down to a stone apron and the drop-off lane, which runs across the full frontage from the entry at the south end to the exit at the north. A zebra crossing joins the walk from the road footpath to the entrance steps.',
      ['Drop-off lane 6.7 m wide', 'Bollards and kerbed apron at the crossing', 'Pole lighting along the apron'], ['Drop-off', 'Pedestrian crossing']),
    area('Visitor Parking', 'amenity_parking', [108, 16],
      'Eleven visitor bays in interlocking pavers along the road edge, behind a clipped hedge and a row of shade trees; the main car park is in the basement, reached by the covered ramp behind the building.',
      ['11 bays, 2.5 × 5 m', 'Wheel stops and painted bay lines', 'Basement car park below'], ['Visitor parking', 'Basement parking']),
    area('Service Yard & Basement Ramp', 'amenity_service', [150, 26],
      'Behind the mall: two loading bays with roller shutters and dock bumpers, the covered two-way ramp down to the basement car park, and the fenced substation and generator yard in the north-west corner. The 4.5 m drives down both sides give fire tenders access all round.',
      ['Two loading bays with roller shutters', 'Covered ramp, 6 m wide, 3.3 m headroom', 'Transformer and DG set in a fenced yard', '4.5 m fire-access drives on both sides'], ['Loading bays', 'Basement ramp', 'Substation']),
  ]
  return {
    id: 'p_kalakal_mall', slug: 'kalakal-mall', name: 'Prime Mall', type: 'commercial', location: 'Kallakal, NH-44',
    tagline: 'A G+2 shopping mall in a faceted skin, on the HMDA road frontage',
    thumbnailUrl: placeholderImage('Prime Mall', 210, 800, 500),
    stats: [{ label: 'Plot', value: '3,704 sq yd' }, { label: 'Floors', value: 'B + G + 2' }, { label: 'Facing', value: 'East' }],
    description:
      'A shopping mall on commercial Plot A-02 in Kallakal, facing east onto the 250 ft HMDA master plan road. Two blocks wrapped in a skin of faceted aluminium and dark glass meet at a lower, double-height glazed entrance under a white canopy; the taller south block carries the name and the north block a curved media screen. A raised forecourt, drop-off and visitor parking lie in front, with a basement car park, loading bays and fire-access drives behind and to either side.',
    highlights: {
      Plot: 'A-02 · 222′3″ × 150′ (3,704 sq yd)', Facing: 'East, onto the 250 ft HMDA road', Structure: 'Basement + ground + 2 upper floors',
      Height: 'Roof at 15.45 m; skin crown to 18.4 m', Envelope: '36.7 m frontage × 39.5 m deep', 'Façade': 'Faceted perforated aluminium and solar-control glass',
      Setbacks: 'Front 20.4 m · sides 4.5 m · rear 7.9 m', Parking: 'Basement car park + 11 visitor bays',
    },
    model: { kind: 'furnished', design: 'kalakal-mall' }, floors: [], rooms,
    // Camera positions in scene metres: +z east (the HMDA road), +x north.
    presets: [
      { id: 'street', name: 'From the road', position: [-17, 2.2, 57], target: [-1, 9.5, 12], fov: 50 },
      { id: 'front', name: 'East elevation', position: [0, 9, 64], target: [0, 8.5, 10], fov: 42 },
      { id: 'elevation', name: 'Straight-on elevation', position: [0, 9.5, 150], target: [0, 9.5, 12], fov: 15 },
      { id: 'southeast', name: 'South-east corner', position: [-40, 14, 50], target: [0, 7, 4], fov: 40 },
      { id: 'northeast', name: 'North-east corner', position: [42, 14, 48], target: [2, 7, 4], fov: 40 },
      { id: 'south', name: 'South side (avenue)', position: [-62, 9, 2], target: [0, 8, -2] },
      { id: 'north', name: 'North side', position: [58, 9, 0], target: [0, 8, -2] },
      { id: 'rear', name: 'Rear and service yard', position: [-10, 14, -70], target: [0, 5, -12] },
      { id: 'aerial', name: 'Aerial', position: [50, 64, 74], target: [0, 2, 0] },
      { id: 'entrance', name: 'Entrance, eye level', position: [-3, 1.7, 31], target: [-1, 6, 10], fov: 55 },
      { id: 'parking', name: 'Visitor parking, eye level', position: [11, 1.6, 39], target: [5, 2.2, 27], fov: 50 },
      { id: 'top', name: 'Plan view', position: [0, 150, -0.01], target: [0, 0, 0] },
    ],
    media: [],
  }
}

/**
 * Kallakal Square on commercial Plot A-01, Kallakal: the client's reference design, a G+2 ring of
 * curved glass pavilions round a fountain plaza, modelled in 3D
 * (features/property/scene/furnished/kalakalA01) as an exterior with its grounds. Areas map to
 * the model's amenity_* hotspots.
 */
function kalakalA01(): Property {
  const area = (name: string, meshName: string, [lengthFt, widthFt]: [number, number], description: string, specs: string[], amenities: string[] = []): Room => ({
    id: id('room'), name, kind: 'outdoor', meshName, floorId: null,
    dimensions: { length: lengthFt, width: widthFt, unit: 'ft' }, areaSqft: Math.round(lengthFt * widthFt), description, specs, amenities, media: [],
  })
  const rooms: Room[] = [
    area('Main Entrance', 'amenity_entrance', [26, 10],
      'The entrance on the centre wing\'s axis, across the plaza from the road: automatic sliding doors in the curved glass under a white blade canopy, with a spiral stair rising beside them in the lobby. The centre\'s roof runs out 2.4 m over the plaza above, carrying the name.',
      ['Automatic sliding doors, 4.8 m frame', 'White canopy with recessed downlights', 'Cantilevered roof canopy, 2.4 m', 'Spiral stair to the first floor in the lobby'],
      ['Planters along the glass', 'Benches on the plaza']),
    area('Fountain Plaza', 'amenity_plaza', [56, 56],
      'A circular plaza 31 m across, open to the road: concentric rings of polished black granite and honed travertine with a dry-deck fountain set flush in them. Sixty-one nozzles in three rings and a crown of six at the centre throw jets of varying height that rise, break into spray and fall back onto the stone, the height of each ring rising and falling in a slow wave; the run-off spreads over the wet stone to a concealed slot drain round the jets. No basin: the plaza is walkable, wet or dry.',
      ['Dry-deck fountain: 61 flush stainless nozzles', 'Jets 1.1–1.9 m, each varying on its own', 'Polished black granite and honed travertine', 'Concealed 12 mm slot drain round the jets'],
      ['Interactive splash plaza', 'Benches and bollard lights']),
    area('Drive & Visitor Parking', 'amenity_parking', [82, 18],
      'A 5.5 m two-way drive along the south boundary, from the HMDA road through to the cross road behind, with four parallel visitor bays in concrete pavers along its edge and a speed table at the gate.',
      ['5.5 m drive, both roads', 'Four parallel bays, 2.5 × 6.3 m', 'Pole lighting along the drive'], ['Visitor parking', 'Drop-off']),
    area('Basement Ramp & Service Yard', 'amenity_service', [128, 18],
      'Behind the building: the covered ramp down to the basement car park, its mouth off the end of the drive, and the fenced substation and generator yard in the north-west corner, with service doors in the white rear wall.',
      ['Covered ramp, 5.5 m wide, 3.3 m headroom', 'Transformer and DG set in a fenced yard', 'Service doors and plant-room louvres at the rear'], ['Basement parking', 'Substation']),
  ]
  return {
    id: 'p_kalakal_a01', slug: 'kalakal-a01', name: 'Kallakal Square', type: 'commercial', location: 'Kallakal, NH-44',
    tagline: 'Curved glass pavilions round a fountain plaza, on the HMDA road frontage',
    thumbnailUrl: placeholderImage('Kallakal Square', 160, 800, 500),
    stats: [{ label: 'Plot', value: '3,022 sq yd' }, { label: 'Floors', value: 'B + G + 2' }, { label: 'Facing', value: 'East' }],
    description:
      'A commercial building on Plot A-01 in Kallakal, facing east onto the 250 ft HMDA master plan road. Three curved, fully glazed G+2 wings with white slab edges wrap a circular fountain plaza that opens to the road: the south wing ends in a rounded white wall, the centre wing holds the main entrance under a cantilevered roof, and the north wing stands behind a white wall that sweeps up out of the plaza, pierced by two arches. Three black mesh capsules grown over with creepers rise above the roofs, the tallest to 23 m.',
    highlights: {
      Plot: 'A-01 · 166′1″ × 165′5″ (3,022 sq yd)', Facing: 'East, onto the 250 ft HMDA road', Structure: 'Basement + ground + 2 upper floors',
      Height: 'Roof at 13.55 m; north capsule to 23.2 m', Plan: 'Wings 8 m deep on a 10.5 m / 18.5 m ring', 'Façade': 'Clear curtain glass, white slab bands, white GRC',
      Setbacks: 'South 9.3 m · north 4.3 m · rear 7.2 m', Parking: 'Basement car park + 4 visitor bays',
    },
    model: { kind: 'furnished', design: 'kalakal-a01' }, floors: [], rooms,
    // Camera positions in scene metres: +z east (the HMDA road), +x north.
    presets: [
      { id: 'reference', name: 'From the forecourt', position: [-3.5, 1.7, 19.5], target: [3, 6.5, -6], fov: 60 },
      { id: 'street', name: 'From the road', position: [-8, 2, 44], target: [2.5, 7, 0], fov: 50 },
      { id: 'front', name: 'East elevation', position: [2.5, 10, 62], target: [2.5, 8, 0], fov: 42 },
      { id: 'elevation', name: 'Straight-on elevation', position: [2.5, 10, 150], target: [2.5, 10, 0], fov: 16 },
      { id: 'northeast', name: 'North-east corner', position: [40, 15, 42], target: [4, 8, 0], fov: 40 },
      { id: 'southeast', name: 'South-east corner', position: [-38, 14, 44], target: [0, 7, 0], fov: 40 },
      { id: 'south', name: 'South side (drive)', position: [-52, 9, 2], target: [0, 8, -2] },
      { id: 'north', name: 'North side', position: [50, 9, 0], target: [0, 8, -2] },
      { id: 'rear', name: 'Rear and service yard', position: [-8, 14, -58], target: [2, 5, -12] },
      { id: 'aerial', name: 'Aerial', position: [42, 55, 62], target: [2, 2, 0] },
      { id: 'fountain', name: 'Fountain, eye level', position: [7.5, 1.6, 9.5], target: [-2, 3.5, -6], fov: 55 },
      { id: 'jets', name: 'Jets, close-up', position: [6.6, 1.5, 5.2], target: [2.5, 1.1, 0.5], fov: 45 },
      { id: 'top', name: 'Plan view', position: [0, 130, -0.01], target: [0, 0, 0] },
    ],
    media: [],
  }
}

export const properties: Property[] = [nyshasHaven(), kalakalD65(), kalakalMall(), kalakalA01()]
