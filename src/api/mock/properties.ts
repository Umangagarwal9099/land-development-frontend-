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
 * The ground and the two basement parking levels of a commercial building with basements (see
 * features/property/scene/furnished/basement). The model shows them itself; the group names only
 * keep the floor contract.
 */
function basementFloors() {
  const G: Floor = { id: id('floor'), name: 'Ground Floor', level: 0, groupName: 'floor_G' }
  const B1: Floor = { id: id('floor'), name: 'Basement 1 · Parking', level: -1, groupName: 'floor_B1' }
  const B2: Floor = { id: id('floor'), name: 'Basement 2 · Parking', level: -2, groupName: 'floor_B2' }
  return { G, B1, B2, floors: [G, B1, B2] }
}

/** A basement level as a tappable area: its parking floor, described as built. */
function basementArea(floor: Floor, level: -1 | -2, [lengthFt, widthFt]: [number, number], bays: number, description: string, specs: string[]): Room {
  return {
    id: id('room'), name: level === -1 ? 'Basement B1 Parking' : 'Basement B2 Parking', kind: 'outdoor', meshName: `amenity_b${-level}`, floorId: floor.id,
    dimensions: { length: lengthFt, width: widthFt, unit: 'ft' }, areaSqft: Math.round(lengthFt * widthFt), description,
    specs: [`${bays} bays, 2.5 × 5.0 m on 6 m aisles`, '3.0 m to the soffit, about 2.4 m under the beams', ...specs],
    amenities: ['Lifts and fire stairs', 'Sprinklers and hose reels', 'Jet-fan ventilation', 'CCTV', level === -1 ? 'EV charging bays' : 'Fire pump room'], media: [],
  }
}

/**
 * Terranova Mall on commercial Plot A-02, Kallakal: the G+2 mall of the client's reference design,
 * modelled in 3D (features/property/scene/furnished/kalakalMall) as an exterior with its grounds.
 * Areas map to the model's amenity_* hotspots.
 */
function kalakalMall(): Property {
  const mallLevels = basementFloors()
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
      'The raised forecourt before the mall steps down to a stone apron and the drop-off lane, which runs one way across the full frontage from the entry at the south end to the exit at the north. A zebra crossing joins the walk from the road footpath to the entrance steps.',
      ['Drop-off lane 6.7 m wide', 'Bollards and kerbed apron at the crossing', 'Pole lighting along the apron'], ['Drop-off', 'Pedestrian crossing']),
    area('Visitor Parking', 'amenity_parking', [108, 16],
      'Eleven visitor bays in interlocking pavers along the road edge, behind a clipped hedge and a row of shade trees; the main car park is in the basement, reached by the entry road down the south side and an IN portal in the rear wall, and left by the OUT portal and the exit road up the north side.',
      ['11 bays, 2.5 × 5 m', 'Wheel stops and painted bay lines', 'Basement car park below'], ['Visitor parking', 'Basement parking']),
    area('Service Yard & Basement Ramp', 'amenity_service', [150, 26],
      'Behind the mall, closed off from the cross road by an unbroken compound wall: a one-way service road from the entry road on the south side to the exit road on the north, past two loading bays with roller shutters and dock bumpers, the basement car park\'s IN and OUT portals in the rear wall, and the fenced substation and generator enclosure against the back wall. Traffic runs one way round the building: in at the south gate, out at the north.',
      ['Two loading bays with roller shutters', 'Basement IN and OUT portals, 3.6 m wide, 2.6 m clear', 'Transformer and DG set in a fenced enclosure', 'One-way entry road (south) and exit road (north), 3.9 m clear', 'Rear service road, 7.2 m; no access from the cross road'], ['Loading bays', 'Basement parking', 'Substation']),
    basementArea(mallLevels.B1, -1, [144, 170], 33,
      'The upper basement under the whole mall and its service road. The one-way IN and OUT ramps come down from the portals in the rear wall at 1:6, landing at the front of the level; between them the two-way ramp to B2 starts from the back cross aisle. Bays line the west aisle and the side walls, parallel bays the one-way lanes, all on a power-trowelled concrete floor with painted bays, numbers and arrows, rubber wheel stops, the level\'s blue band on walls and columns, LED battens on drop rods, jet fans and a red sprinkler grid under the beams. A lift and a stair rise from beside the west lane to the entrance lobby, with fire stairs at two corners.',
      ['One-way IN and OUT ramps from the rear portals, 3.6 m, 1:6', 'Two-way ramp to B2, 5.4 m', 'Lift and stair to the entrance lobby; two fire stairs', 'Three EV charging bays; two accessible bays by the lifts']),
    basementArea(mallLevels.B2, -2, [144, 170], 32,
      'The lower basement, reached by the two-way ramp from B1, laid out like the level above with its own green band and level markings. Lanes run where the ramps from the ground stand on B1; the fire pump room and the sump are here.',
      ['Two-way ramp up to B1', 'Fire pump room', 'Lift lobby and two fire stairs']),
  ]
  return {
    id: 'p_kalakal_mall', slug: 'kalakal-mall', name: 'Terranova Mall', type: 'commercial', location: 'Kallakal, NH-44',
    tagline: 'A G+2 shopping mall in a faceted skin, on the HMDA road frontage',
    thumbnailUrl: placeholderImage('Terranova Mall', 210, 800, 500),
    stats: [{ label: 'Plot', value: '3,704 sq yd' }, { label: 'Floors', value: 'B2 + G + 2' }, { label: 'Facing', value: 'East' }],
    description:
      'A shopping mall on commercial Plot A-02 in Kallakal, facing east onto the 250 ft HMDA master plan road. Two blocks wrapped in a skin of faceted aluminium and dark glass meet at a lower, double-height glazed entrance under a white canopy; the taller south block carries the name and the north block a curved media screen. A raised forecourt, drop-off and visitor parking lie in front, with a basement car park, loading bays and fire-access drives behind and to either side.',
    highlights: {
      Plot: 'A-02 · 222′3″ × 150′ (3,704 sq yd)', Facing: 'East, onto the 250 ft HMDA road', Structure: '2 basements + ground + 2 upper floors',
      Height: 'Roof at 15.45 m; skin crown to 18.4 m', Envelope: '36.7 m frontage × 39.5 m deep', 'Façade': 'Faceted perforated aluminium and solar-control glass',
      Setbacks: 'Front 20.4 m · sides 4.5 m · rear 7.9 m', Parking: '65 bays on B1 and B2 + 11 visitor bays',
    },
    model: { kind: 'furnished', design: 'kalakal-mall' }, floors: mallLevels.floors, rooms,
    // Camera positions in scene metres: +z east (the HMDA road), +x north.
    presets: [
      { id: 'street', name: 'From the road', position: [-17, 2.2, 57], target: [-1, 9.5, 12], fov: 50 },
      { id: 'front', name: 'East elevation', position: [0, 9, 64], target: [0, 8.5, 10], fov: 42 },
      { id: 'elevation', name: 'Straight-on elevation', position: [0, 9.5, 150], target: [0, 9.5, 12], fov: 15 },
      { id: 'southeast', name: 'South-east corner', position: [-40, 14, 50], target: [0, 7, 4], fov: 40 },
      { id: 'northeast', name: 'North-east corner', position: [42, 14, 48], target: [2, 7, 4], fov: 40 },
      { id: 'south', name: 'South side (avenue)', position: [-62, 9, 2], target: [0, 8, -2] },
      { id: 'north', name: 'North side', position: [58, 9, 0], target: [0, 8, -2] },
      { id: 'rear', name: 'Rear, service road and basement portals', position: [-10, 14, -70], target: [0, 5, -12] },
      { id: 'aerial', name: 'Aerial', position: [50, 64, 74], target: [0, 2, 0] },
      { id: 'entrance', name: 'Entrance, eye level', position: [-3, 1.7, 31], target: [-1, 6, 10], fov: 55 },
      { id: 'parking', name: 'Visitor parking, eye level', position: [11, 1.6, 39], target: [5, 2.2, 27], fov: 50 },
      { id: 'top', name: 'Plan view', position: [0, 150, -0.01], target: [0, 0, 0] },
      { id: 'b1', name: 'B1 · overview', position: [36, 24, 30], target: [0, -3.3, -7], level: -1 },
      { id: 'b1-ramp', name: 'B1 · down the IN ramp', position: [2, 1.9, -23.6], target: [2, -2.6, -4], fov: 60, level: -1 },
      { id: 'b1-aisle', name: 'B1 · west aisle, eye level', position: [-13.9, -1.75, -24], target: [-13.9, -2.2, 10], fov: 60, level: -1 },
      { id: 'b1-lifts', name: 'B1 · lift lobby', position: [-15.6, -1.75, -7], target: [-10.9, -2.1, 2], fov: 58, level: -1 },
      { id: 'b2', name: 'B2 · overview', position: [36, 21, 30], target: [0, -6.6, -7], level: -2 },
      { id: 'b2-aisle', name: 'B2 · west aisle, eye level', position: [-13.9, -5.05, 10], target: [-13.9, -5.5, -24], fov: 60, level: -2 },
      { id: 'b2-ramp', name: 'B2 · up the ramp to B1', position: [7.75, -4.9, 7], target: [7.75, -5.2, -20], fov: 60, level: -2 },
    ],
    media: [],
  }
}

/**
 * Terranova Hotel on commercial Plot A-04, Kallakal: the client's reference design, a G+2 ring of
 * curved glass pavilions round a lamp-lit plaza, modelled in 3D
 * (features/property/scene/furnished/kalakalHotel) as an exterior with its grounds. Areas map to
 * the model's amenity_* hotspots.
 */
function kalakalHotel(): Property {
  const area = (name: string, meshName: string, [lengthFt, widthFt]: [number, number], description: string, specs: string[], amenities: string[] = []): Room => ({
    id: id('room'), name, kind: 'outdoor', meshName, floorId: null,
    dimensions: { length: lengthFt, width: widthFt, unit: 'ft' }, areaSqft: Math.round(lengthFt * widthFt), description, specs, amenities, media: [],
  })
  const rooms: Room[] = [
    area('Main Entrance & Lobby', 'amenity_entrance', [26, 10],
      'The hotel\'s entrance on the centre wing\'s axis, across the plaza from the road: automatic sliding doors in the curved glass under a white blade canopy, opening into the double-height lobby with its reception and a spiral stair to the first floor. The centre\'s roof runs out over the plaza above, carrying the name.',
      ['Automatic sliding doors, 3.8 m frame', 'White canopy with recessed downlights', 'Cantilevered roof canopy, 1.8 m', 'Reception, lobby lounge and all-day restaurant on the ground floor'],
      ['Planters along the glass', 'Benches on the plaza']),
    area('Lamp Plaza', 'amenity_plaza', [42, 42],
      'A circular plaza 23 m across, open to the road: concentric rings of polished black granite and honed travertine, with decorative lamps set in the dark bands. At the centre a bronze candelabrum of seven opal globes stands on a granite drum; round it a ring of glowing opal orbs, then slim bronze post-top lanterns, and low lantern bollards on the outer band, with the axis from the road to the entrance left clear. By day the lamps read as dark bronze and opal glass; at dusk they glow warm and pool light on the stone.',
      ['Bronze candelabrum, seven opal globes, 3.9 m', '8 opal orb lamps, 8 post-top lanterns, lantern bollards', 'Dark statuary bronze and opal glass', 'Polished black granite and honed travertine'],
      ['Lamp-lit plaza', 'Benches and bollard lights']),
    area('Guest Car Park', 'amenity_parking', [118, 138],
      'Behind the hotel\'s rear wing: 44 nose-in bays in concrete pavers in four rows, on two aisles and the entry road, with neem trees in planted islands and twin-headed pole lights. Traffic runs one way: in by the 4.6 m entry road down the south boundary from the HMDA road, past the forecourt for drop-off and the rear wing, into the car park, and out by the 4.4 m exit road up the north boundary back to the HMDA road. The back of the plot is walled off from the cross road.',
      ['44 bays, 2.5 × 5 m, wheel stops and painted lines', '6 m aisles, cross aisles front and back', 'Neem trees in kerbed islands', 'One way: 4.6 m entry road (south), 4.4 m exit road (north)'], ['Guest parking', 'Drop-off on the entry road']),
    area('Utility Yard', 'amenity_service', [118, 23],
      'At the back of the plot: the fenced substation and generator yard and a planted strip with rain trees against the back wall, which runs unbroken across the plot with no way through to the cross road; service vehicles come and go by the entry and exit roads.',
      ['Transformer and DG set in a fenced yard', 'Unbroken back wall, no rear access', 'Rain trees on a planted strip'], ['Substation', 'Service access']),
  ]
  return {
    id: 'p_kalakal_hotel', slug: 'kalakal-hotel', name: 'Terranova Hotel', type: 'commercial', location: 'Kallakal, NH-44',
    tagline: 'A boutique hotel of curved glass pavilions round a lamp-lit plaza, on the HMDA road frontage',
    thumbnailUrl: placeholderImage('Terranova Hotel', 160, 800, 500),
    stats: [{ label: 'Plot', value: '4,676 sq yd' }, { label: 'Floors', value: 'G + 3' }, { label: 'Facing', value: 'East' }],
    description:
      'A hotel on Plot A-04 in Kallakal, facing east onto the 250 ft HMDA master plan road. Three curved, fully glazed G+2 wings with white slab edges wrap a circular lamp-lit plaza that opens to the road: the lobby, reception and all-day restaurant on the ground floor, guest rooms behind sheer curtains on the two floors above. Behind the centre a G+3 rear wing, glazed and banded to match and a storey taller, holds more guest rooms either side of a corridor over a banquet and dining floor. The south wing ends in a glass corner and a white curved fin, the centre wing holds the entrance under a cantilevered roof, and the north wing stands behind a white wall that sweeps up out of the plaza, pierced by two arches. Three black mesh capsules grown over with creepers rise above the roofs. The plot runs 104 m deep, holding the guests\' car park behind the rear wing and the utility yard, walled off from the cross road behind; cars come in by an entry road down the south side and leave by an exit road up the north side.',
    highlights: {
      Plot: 'A-04 · 124′3″ × 340′7″ (4,676 sq yd)', Facing: 'East, onto the 250 ft HMDA road', Structure: 'Ring G + 2, rear wing G + 3',
      Height: 'Ring roof 12.35 m, rear wing 15.95 m; north capsule to 23 m', Plan: 'Wings 5.3 m deep on an 8.2 m / 13.5 m ring; rear wing 18 m wide', 'Façade': 'Clear curtain glass, white slab bands, white GRC',
      Setbacks: 'South 5.2 m (entry road) · north 5.0 m (exit road) · front 10 m', Parking: '44 bays in the car park behind',
    },
    model: { kind: 'furnished', design: 'kalakal-hotel' }, floors: [], rooms,
    // Camera positions in scene metres: +z east (the HMDA road), +x north. The plaza is centred at (2, 30).
    presets: [
      { id: 'reference', name: 'From the forecourt', position: [-3.5, 1.7, 47], target: [3, 6, 24], fov: 60 },
      { id: 'street', name: 'From the road', position: [-8, 2, 66], target: [2, 6, 30], fov: 50 },
      { id: 'front', name: 'East elevation', position: [2, 10, 84], target: [2, 7, 28], fov: 42 },
      { id: 'elevation', name: 'Straight-on elevation', position: [2, 9, 170], target: [2, 9, 28], fov: 16 },
      { id: 'northeast', name: 'North-east corner', position: [36, 15, 62], target: [3, 7, 28], fov: 40 },
      { id: 'southeast', name: 'South-east corner', position: [-34, 14, 64], target: [0, 7, 28], fov: 40 },
      { id: 'south', name: 'South side (entry road)', position: [-40, 10, 18], target: [0, 7, 16] },
      { id: 'carpark', name: 'Car park', position: [-16, 8, -2], target: [2, 0, -28], fov: 55 },
      { id: 'rear', name: 'Rear and back wall', position: [-8, 22, -82], target: [0, 4, -10] },
      { id: 'aerial', name: 'Aerial', position: [55, 75, 80], target: [0, 2, 0] },
      { id: 'fountain', name: 'Plaza, eye level', position: [6, 1.6, 37], target: [-1.5, 3.2, 25], fov: 55 },
      { id: 'jets', name: 'Lamps, close-up', position: [5.2, 1.5, 33.6], target: [2, 1.0, 30], fov: 45 },
      { id: 'top', name: 'Plan view', position: [0, 260, -0.01], target: [0, 0, 0] },
    ],
    media: [],
  }
}

/**
 * Terranova Square on commercial Plot A-01, Kallakal: the client's reference design, a multi-storey
 * car park over ground-floor shops with a glazed ramp drum, modelled in 3D
 * (features/property/scene/furnished/kalakalA01) as an exterior with its grounds. Areas map to
 * the model's amenity_* hotspots.
 */
function kalakalA01(): Property {
  const a01Levels = basementFloors()
  const area = (name: string, meshName: string, [lengthFt, widthFt]: [number, number], description: string, specs: string[], amenities: string[] = []): Room => ({
    id: id('room'), name, kind: 'outdoor', meshName, floorId: null,
    dimensions: { length: lengthFt, width: widthFt, unit: 'ft' }, areaSqft: Math.round(lengthFt * widthFt), description, specs, amenities, media: [],
  })
  const rooms: Room[] = [
    area('Main Entrance & Ramp Drum', 'amenity_entrance', [20, 12],
      'The pedestrian entrance at the foot of the glazed drum, on the walk from the road: automatic sliding doors in a black frame open into a round lobby with a terrazzo floor, two lifts and the level directory. Above it the helical ramp turns up through the three decks to the roof behind clear glass, its LED strips lighting the turns at night; the drum\'s deep black crown carries the name.',
      ['Drum 14.8 m across, glazed full height', 'Automatic sliding doors, 3.6 m frame', 'Two passenger lifts', 'Helical ramp, three turns, one deck to a turn'],
      ['Lobby benches', 'Cycle stands outside']),
    area('Shopfronts', 'amenity_shops', [45, 13],
      'Four shops under the decks along the front, and a fifth south of the drum: full-height clear glass in black frames between charcoal piers, a glazed door in each, and planters along the paving in front. The café south of the drum has its lit name box on the charcoal fascia; the four others are unbranded.',
      ['Shopfronts 3.15 m high, 5 m deep shops', 'Charcoal aluminium composite fascia and piers', 'Backlit café sign'], ['Retail', 'Café']),
    area('Forecourt & Lawns', 'amenity_forecourt', [136, 39],
      'The landscaped forecourt between the building and the road: flamed granite paving with an entrance walk straight to the drum\'s doors, between two lawns edged in granite and planted with neem and a rain tree, low hedges along the walk, benches and bollard lights.',
      ['Flamed granite paving', 'Granite-edged lawns with neem and rain trees', 'Bollard lighting along the walk', 'Stainless bollards on the road edge'], ['Seating', 'Shade trees']),
    area('Vehicle Entry & Exit', 'amenity_parking', [20, 32],
      'One way round the block: in off the HMDA road down a 5.7 m entry drive along the south boundary to the entry and exit portals in the block\'s south end, each under a striped height bar either side of a kerbed island with the parking sign; then across the connector behind the block and out up the 4.2 m exit road along the north boundary to a give-way line at the road.',
      ['Two portals, 3.6 m wide, 2.75 m clear', 'Height bars at 2.4 m', 'One-way 5.7 m entry drive and 4.2 m exit road', 'Speed tables at the way in and the way out', 'No access from the cross road'], ['Multi-level parking', 'Drop-off on the entry drive']),
    area('Service Court & Utility Yard', 'amenity_service', [143, 37],
      'Behind the block: a 6.5 m connector from the entry drive to the exit road, past the roller-shuttered service rooms in the rear wall; beyond it a lawn with rain trees and the fenced substation and generator yard in the north-west corner, all closed off from the cross road by an unbroken boundary wall.',
      ['Service connector, one way, drive to exit road', 'Transformer and DG set in a fenced yard', 'Roller-shuttered stores at the rear', 'Unbroken rear boundary wall'], ['Substation', 'Service access']),
    basementArea(a01Levels.B1, -1, [159, 119], 28,
      'The upper basement under the block, the connector and the forecourt. 3.5 m inside the portals in the block\'s south end, behind the height bars, the one-way IN and OUT ramps fall north at 1:6 and land in a turning area by the east cross aisle; the two-way ramp to B2 runs along the back wall from the west cross aisle. Bays face the east wall and the north aisle, parallel bays line the rest, all on trowelled concrete with painted bays, numbers and arrows, the blue level band on walls and columns, LED battens, jet fans and sprinklers overhead. Two lifts and a stair rise from the north aisle to the drum lobby.',
      ['One-way IN and OUT ramps from the south portals, 3.2 m, 1:6', 'Two-way ramp to B2 along the back wall, 5.5 m', 'Two lifts and a stair up to the drum lobby; fire stairs north and south-west', 'EV charging and accessible bays']),
    basementArea(a01Levels.B2, -2, [159, 119], 31,
      'The lower basement, reached by the ramp along the back wall and laid out like B1, with its green level band; where the ramps from the ground stand on B1, B2 has a lane and a row of parallel bays. The fire pump room is in the north-west corner.',
      ['Two-way ramp up to B1', 'Fire pump room', 'Two lifts and a stair to the drum lobby']),
  ]
  return {
    id: 'p_kalakal_a01', slug: 'kalakal-a01', name: 'Terranova Square', type: 'commercial', location: 'Kallakal, NH-44',
    tagline: 'Shops and a multi-storey car park behind a timber screen, with a glazed ramp drum, on the HMDA road frontage',
    thumbnailUrl: placeholderImage('Terranova Square', 160, 800, 500),
    stats: [{ label: 'Plot', value: '3,022 sq yd' }, { label: 'Floors', value: 'B2 + G + 3' }, { label: 'Facing', value: 'East' }],
    description:
      'A commercial building on Plot A-01 in Kallakal, facing east onto the 250 ft HMDA master plan road: shops on the ground floor and three parking decks above. The long block runs parallel to the road, its decks screened in vertical thermowood slats hung in staggered panels, some flush, some forward, with mid-grey infill panels and open bays among them between exposed concrete slab edges. A fully glazed drum holding the helical ramp stands proud of the front under a deep black crown with black returns either side, the main entrance at its foot. A cream stair tower with a tall glazed slit and a dark grey lift core close the north end. Traffic runs one way round the block: cars come in off the HMDA road down a drive along the south boundary to the portals in the block\'s south end, cross behind the block on a connector and leave by an exit road along the north boundary. The back of the plot is walled the full width, with no gate onto the cross road.',
    highlights: {
      Plot: 'A-01 · 166′1″ × 165′5″ (3,022 sq yd)', Facing: 'East, onto the 250 ft HMDA road', Structure: '2 basements + ground (shops) + 3 parking decks',
      Height: 'Parapet 15.15 m; drum crown 16.75 m', Plan: 'Block 38.8 × 17.2 m; ramp drum 14.8 m across', 'Façade': 'Thermowood slat screen, charcoal and grey composite, clear glass',
      Setbacks: 'South 6.7 m (entry drive) · north 5.1 m (exit road) · rear 12.8 m · front 20.4 m', Parking: 'About 80 cars on three decks, 59 on B1 and B2',
    },
    model: { kind: 'furnished', design: 'kalakal-a01' }, floors: a01Levels.floors, rooms,
    // Camera positions in scene metres: +z east (the HMDA road), +x north. The drum is centred at (-5.6, 6.6).
    presets: [
      { id: 'reference', name: 'As in the reference', position: [-13, 1.7, 40], target: [2, 7, 3], fov: 52 },
      { id: 'street', name: 'From the road', position: [-6, 2, 44], target: [0, 7, 2], fov: 50 },
      { id: 'front', name: 'East elevation', position: [1.5, 9, 70], target: [1.5, 8, 0], fov: 42 },
      { id: 'elevation', name: 'Straight-on elevation', position: [1.5, 8.5, 160], target: [1.5, 8.5, 0], fov: 16 },
      { id: 'northeast', name: 'North-east corner', position: [42, 14, 40], target: [2, 7, 0], fov: 40 },
      { id: 'southeast', name: 'South-east corner', position: [-40, 14, 42], target: [0, 7, 0], fov: 40 },
      { id: 'south', name: 'South side (drive and portals)', position: [-58, 9, 4], target: [-12, 5, -4], fov: 45 },
      { id: 'north', name: 'North side (exit road)', position: [48, 9, -2], target: [0, 8, -3] },
      { id: 'rear', name: 'Rear and service court', position: [-6, 16, -60], target: [1, 6, -6] },
      { id: 'aerial', name: 'Aerial', position: [45, 55, 60], target: [1, 3, 0] },
      { id: 'entrance', name: 'Entrance, eye level', position: [-3, 1.6, 24], target: [-5.6, 4, 10], fov: 55 },
      { id: 'drum', name: 'Ramp drum, close-up', position: [3, 2, 22], target: [-5.6, 8.5, 6], fov: 45 },
      { id: 'screen', name: 'Timber screen, close-up', position: [14, 3, 14], target: [10, 8.5, 5], fov: 45 },
      { id: 'top', name: 'Plan view', position: [0, 130, -0.01], target: [0, 0, 0] },
      { id: 'b1', name: 'B1 · overview', position: [38, 22, 26], target: [0, -3.3, -6], level: -1 },
      { id: 'b1-ramp', name: 'B1 · down the IN ramp', position: [-14.4, 1.7, -7.7], target: [5, -3.0, -7.7], fov: 60, level: -1 },
      { id: 'b1-aisle', name: 'B1 · north aisle, eye level', position: [-14, -1.75, 6.3], target: [12, -2.2, 6.3], fov: 60, level: -1 },
      { id: 'b1-lifts', name: 'B1 · lift lobby', position: [14.2, -1.75, -5.5], target: [19.3, -2.1, 2], fov: 58, level: -1 },
      { id: 'b2', name: 'B2 · overview', position: [38, 19, 26], target: [0, -6.6, -6], level: -2 },
      { id: 'b2-aisle', name: 'B2 · south aisle, eye level', position: [-14, -5.05, -15.3], target: [12, -5.5, -15.3], fov: 60, level: -2 },
      { id: 'b2-ramp', name: 'B2 · up the ramp to B1', position: [12.6, -4.9, -21.25], target: [-8, -5.2, -21.25], fov: 60, level: -2 },
    ],
    media: [],
  }
}

/**
 * Terranova Hospital on commercial Plot A-03, Kallakal: the client's reference design, a B2 + G + 3
 * hospital in white cladding and blue-grey glass, modelled in 3D
 * (features/property/scene/furnished/kalakalHospital) as an exterior with its grounds. Areas map
 * to the model's amenity_* hotspots.
 */
function kalakalHospital(): Property {
  const hospitalLevels = basementFloors()
  // The outpatient department's floors over the ground: each cut away to look into it from the
  // level rail (2.75 m above its floor, under the ceilings), framed on the building's plan.
  const body: [number, number, number, number] = [-11.8, -26, 13.9, 15]
  hospitalLevels.G.name = 'Ground Floor · Main Reception, Patient Services & OPD'
  hospitalLevels.G.cutY = 0.15 + 2.75
  hospitalLevels.G.focus = body
  const opdFloors: Floor[] = [
    { id: id('floor'), name: 'First Floor · Inpatient Rooms & OPD Consultations', level: 1, groupName: 'floor_1', cutY: 4.95 + 2.75, focus: body },
    { id: id('floor'), name: 'Second Floor · International Wing, ICU & X-ray', level: 2, groupName: 'floor_2', cutY: 9.15 + 2.75, focus: body },
    { id: id('floor'), name: 'Third Floor · Operation Theatres & CT', level: 3, groupName: 'floor_3', cutY: 13.35 + 2.75, focus: body },
  ]

  // The hospital's interior, room by room (see features/property/scene/furnished/kalakalHospital/opd/plan.ts):
  // the OPD's hotspots are `room_opd_<floor>_<id>`, the main block's `room_main_<floor>_<id>`, each
  // room's size taken from its plan rectangle in metres.
  const [F1, F2, F3] = opdFloors
  type Rect = [number, number, number, number]
  const opd = (floor: Floor, mesh: string, name: string, [x0, x1, z0, z1]: Rect, description: string, specs: string[], amenities: string[]): Room => {
    const a = x1 - x0
    const b = z1 - z0
    const r1 = (v: number) => Math.round(v * 10) / 10
    return {
      id: id('room'), name, kind: 'room', meshName: mesh, floorId: floor.id,
      dimensions: { length: r1(Math.max(a, b)), width: r1(Math.min(a, b)), unit: 'm' }, areaSqft: Math.round(a * b * 10.764), description, specs, amenities, media: [],
    }
  }
  // Plan lines (metres, +x north, +z east) the rooms stand on.
  const XS = -11.5, XA = -7.26, XB = -4.74, XL = -2.0, XM = 3.7, XN0 = 7.86, XN1 = 10.06, XN = 13.6, XG = 5.48
  const ZB = -25.7, Z2A = -20.56, Z2B = -18.24, Z1A = -5.76, Z1B = -3.44, ZF = 4.0, ZT = 11.7
  const BAY = [-25.7, -22.83, -19.67, -16.5, -13.33, -10.17, -7.0, -3.83]
  const HALL: Rect = [XS, -2.7, ZF, ZT]
  /** The toilets every floor has, one over another: ladies, gents, and the accessible WC behind the lifts. */
  const toilets = (floor: Floor, p: string, label: string): Room[] => [
    opd(floor, `room_opd_${p}_ladies`, `${label} Toilets · Ladies`, [XS, XA, BAY[3], BAY[4]],
      'Public toilets for women off the south corridor: three WC cubicles in full-height compact-laminate partitions, a vanity of wall-hung basins with sensor taps and a mirror, a sanitary-bin and a baby-changing shelf. Floor and walls are tiled for wet cleaning, with a frosted window to the south façade.',
      ['Anti-skid ceramic floor tiles, glazed wall tiles to 2.1 m', 'Moisture-resistant ceiling with downlights', 'Mechanical exhaust, 10 air changes an hour', 'Floor trap and wash-down point'],
      ['Three WC cubicles', 'Basins with sensor taps', 'Soap and hand-dryer', 'Sanitary disposal']),
    opd(floor, `room_opd_${p}_gents`, `${label} Toilets · Gents`, [XS, XA, BAY[2], BAY[3]],
      'Public toilets for men beside the ladies\', on the same riser: two WC cubicles, a row of urinals with modesty screens, wall-hung basins with sensor taps and a mirror. Tiled floor and walls, frosted window.',
      ['Anti-skid ceramic floor tiles, glazed wall tiles to 2.1 m', 'Moisture-resistant ceiling with downlights', 'Mechanical exhaust, 10 air changes an hour'],
      ['Two WC cubicles', 'Urinals with screens', 'Basins with sensor taps', 'Hand-dryer']),
    opd(floor, `room_opd_${p}_wc`, `${label} Accessible WC`, [XB, XL, Z1B, -0.06],
      'A unisex accessible toilet behind the lifts, its door opening outwards onto the front corridor: a WC with grab rails, a fold-down rail and an emergency pull cord, a basin at wheelchair height and a 1.5 m turning circle.',
      ['1.5 m wheelchair turning space', 'Outward-opening 1.0 m door', 'Anti-skid tiles; tiled walls to 2.1 m'],
      ['Grab and fold-down rails', 'Emergency pull cord', 'Low basin and mirror']),
  ]

  // The main block's rooms: `room_main_<floor>_<id>`, measured over the whole room (an inpatient
  // room or suite with its entry and washroom).
  const main = (floor: Floor, id: string, name: string, rect: Rect, description: string, specs: string[], amenities: string[]): Room =>
    opd(floor, `room_main_${floor === hospitalLevels.G ? 'g' : floor.level}_${id}`, name, rect, description, specs, amenities)
  const ensuite = ['Attached accessible washroom: WC with grab rail, basin, glass-screened shower with fold-down seat, nurse-call pull cord']
  const wardSpecs = (ac: boolean) => [
    'Sheet vinyl floor, washable walls, 600 mm tile ceiling with LED panels',
    'Bed-head unit at 1.45 m: oxygen and vacuum outlets, raw and UPS sockets, reading light, nurse call',
    ac ? 'Split air-conditioner, 1.5 TR, with its own remote' : 'Ceiling fans on step regulators; opening windows for natural ventilation',
    'Nurse-call lamp over the door, repeated at the nurses\' station',
    ...ensuite,
  ]

  const ground: Room[] = [
    opd(hospitalLevels.G, 'room_opd_g_hall', 'Outpatient Hall & OPD Reception', HALL,
      'The outpatient entrance hall in the foot of the south tower, entered through automatic sliding doors under the OUTPATIENT canopy. The security and information desk stands inside the doors; the OPD reception and enquiry counter runs along the south wall with its registration workstations; the appointment and lift-assistance counter stands at the mouth of the corridor to the OPD lifts. Patients wait on beam seating facing the token display; the glazed link leads through to the main block.',
      ['Large-format vitrified tiles, plasterboard ceiling with downlights', 'Glazed front with automatic doors, 2.4 m clear', '8.8 × 7.7 m, open to the glazed link', 'CCTV and public address'],
      ['OPD reception and enquiry counter', 'Appointment & lift assistance counter', 'Security & information desk', 'Token display and seating', 'Self-registration kiosk']),
    opd(hospitalLevels.G, 'room_opd_g_security', 'Security & CCTV Control', [XS, XA, BAY[6], BAY[7]],
      'The hospital\'s security control room: CCTV monitors for every camera in both blocks and the car park, the fire alarm repeater panel and the public address console, with a desk for the duty officer and a key cabinet.',
      ['CCTV video wall', 'Fire alarm repeater panel', 'PA system console'],
      ['Monitoring desk', 'Key cabinet', 'Lockers']),
    opd(hospitalLevels.G, 'room_opd_g_insurance', 'OPD Insurance & TPA Desk', [XS, XA, BAY[5], BAY[6]],
      'Insurance and TPA (third-party administrator) verification for outpatients and government health-scheme cards: two desks with workstations and scanners, document trays and visitor chairs.',
      ['Sheet vinyl floor, tile ceiling', 'South window'],
      ['Two desks with workstations', 'Document scanner', 'Visitor seating']),
    opd(hospitalLevels.G, 'room_opd_g_vaccination', 'Vaccination Room', [XS, XA, BAY[4], BAY[5]],
      'Immunisation for children and adults: an ice-lined refrigerator keeping vaccines at 2–8 °C, a preparation counter with a sink, an examination couch, the vaccinator\'s desk and an observation chair for the half hour after a dose.',
      ['Ice-lined refrigerator with temperature log', 'Clinical hand-wash basin', 'Sheet vinyl floor'],
      ['Vaccine refrigerator', 'Preparation counter', 'Examination couch', 'Sharps and BMW bins']),
    ...toilets(hospitalLevels.G, 'g', 'Ground Floor'),
    main(hospitalLevels.G, 'mainLobby', 'Main Lobby & Reception · G10', [2.0, 10.2, 8.95, 12.85],
      'The main entrance lobby behind the curtain wall, under the porte-cochère: automatic sliding doors from the drop-off, the main reception and enquiry counter facing them against the core with the hospital\'s backlit name over it, the patient relations and security desk inside the doors, the digital token display and information boards. The bed lift and stair down to the basement car park open behind the reception; the wheelchair bay and the help desk are to the left, admissions through the glass door to the right.',
      ['4.1 m high plasterboard ceiling with downlights', 'Large-format vitrified tiles', 'Automatic sliding doors, 2.6 m clear', 'CCTV and public address'],
      ['Main reception with multiple workstations', 'Enquiry and patient relations desk', 'Digital token display', 'Branding wall and information boards', 'Wheelchairs at the door']),
    main(hospitalLevels.G, 'helpDesk', 'Patient Help Desk & Waiting · G11', [XL, XG, 2.1, ZF],
      'Behind the main lifts, between the main lobby\'s wheelchair bay and the glazed link to the OPD: a patient help desk for directions, visitor passes and complaints, a row of waiting seats, a drinking water station and a mobile charging point.',
      ['Vitrified tiles, plasterboard ceiling', 'Open to the glazed link and the lift passage'],
      ['Help desk', 'Waiting seating', 'Drinking water', 'Charging point', 'Wheelchair parking']),
    main(hospitalLevels.G, 'admission', 'Admission Desk · G12', [10.2, XN, 4.97, 10.7],
      'Inpatient admissions in the north wing, through a glass door off the main lobby: admission counters where the patient\'s file and UHID are created, the room category chosen and the deposit taken, with chairs for patients and relatives, filing cabinets for admission forms and consent documents, and a clear turning space for a wheelchair or stretcher.',
      ['Sheet vinyl floor, tile ceiling', 'Glass door from the main lobby', 'Windows to the north'],
      ['Admission counters and workstations', 'Registration computers and printers', 'Filing cabinets and form storage', 'Seating for relatives']),
    main(hospitalLevels.G, 'services', 'Patient Services Hall · G13', [-2.2, 2.9, -14.4, Z1A],
      'The main block\'s patient waiting hall, south of the front corridor, with every counter a patient or relative needs round it: insurance and cashless approvals and billing down its west side, the cash counter behind its security glass on the east, and the pharmacy\'s dispensing window across its far end. Varied seating faces the counters under the token displays; queues are kept by stanchions with retractable belts.',
      ['Vitrified tiles, plasterboard ceiling with downlights', '5.1 × 8.6 m, open to the front corridor', 'Token displays over each counter'],
      ['Linked seating and sofas', 'Token and information displays', 'Drinking water', 'Charging points', 'Wheelchair parking', 'Queue stanchions']),
    main(hospitalLevels.G, 'ipdInsurance', 'Insurance & Cashless Desk · G14', [XB, -2.2, -10.0, Z1A],
      'Health insurance and cashless treatment for admitted patients: staff at the counter window verify policies, raise pre-authorisations with insurers and TPAs and track approvals, with document scanners, workstations and filing cabinets behind them.',
      ['Transaction window onto the services hall', 'Sheet vinyl floor, tile ceiling', 'Connecting door to billing'],
      ['Insurance counters and workstations', 'Document scanners', 'Filing cabinets', 'Cashless assistance signage']),
    main(hospitalLevels.G, 'ipdBilling', 'Billing Desk · G15', [XB, -2.2, -14.4, -10.0],
      'Inpatient billing: interim and final bills are prepared and settled at two counters onto the services hall, with billing workstations, invoice printers and card and UPI payment terminals.',
      ['Transaction window onto the services hall', 'Sheet vinyl floor, tile ceiling'],
      ['Two billing counters', 'Billing workstations', 'Invoice printers', 'Card and UPI terminals']),
    main(hospitalLevels.G, 'cash', 'Cash Counter · G16', [2.9, XG, -10.0, Z1A],
      'The secure cash counter: deposits and payments are taken behind laminated security glass with a speech grille and a deal tray, at a workstation with its cash drawer, payment terminal, receipt printer and note-counting machine, a safe under the counter.',
      ['Full-height security glass with speech grille and deal tray', 'Lockable staff door', 'CCTV covered'],
      ['Cash workstation', 'Cash drawer and safe', 'Note counter', 'Payment terminal and receipt printer']),
    main(hospitalLevels.G, 'pharmacy', 'Pharmacy · G18', [-2.2, XG, Z2B, -14.4],
      'The hospital pharmacy, its dispensing window onto the services hall. Behind the counter, pharmacists dispense from floor-to-ceiling medicine racks and drawer cabinets arranged by category, billing at workstations with barcode scanners and label printers; cold-chain medicines are kept in pharmaceutical refrigerators and controlled drugs in a double-locked cabinet.',
      ['The hospital\'s only pharmacy, open 24 hours', 'Dispensing window with glass screen', 'Sheet vinyl floor, 22–25 °C controlled', 'Pharmacy refrigerators at 2–8 °C', 'Double-locked narcotics cabinet'],
      ['Medicine racks and drawer cabinets', 'Reserve stock racking', 'Dispensing counter', 'Billing workstations and barcode scanners', 'Pharmacy refrigerators']),
    main(hospitalLevels.G, 'consultG', 'Admission Consultation Room · G17', [2.9, XG, -14.4, -10.0],
      'The admitting doctor\'s room off the services hall, beside the cash counter: a desk with the HIS workstation facing chairs for the patient and an attendant, an examination couch behind its curtain under a mobile LED examination light, the wall BP set with otoscope and ophthalmoscope, an X-ray viewer, scales and a clinical hand-wash basin. Patients are assessed, consented and admitted here before going up to the ward.',
      ['Sheet vinyl floor, tile ceiling with LED panels', 'Door from the services hall', 'Clinical hand-wash basin'],
      ['Doctor\'s desk and workstation', 'Examination couch with curtain', 'Examination light', 'Wall diagnostic set', 'X-ray viewer', 'Weighing scale']),
    main(hospitalLevels.G, 'records', 'Medical Records · G19', [XB, -2.2, Z2B, -14.4],
      'The medical records department: mobile compactor shelving of patient files by UHID, and a scanning and indexing workstation where paper records are digitised into the hospital information system.',
      ['Restricted access', 'Fire detection'],
      ['Mobile compactor shelving', 'Scanning workstation']),
    main(hospitalLevels.G, 'adminOffice', 'Hospital Administration · G20', [1.8, XG, ZB, Z2A],
      'The hospital administrator\'s office at the back of the main block: the administrator\'s desk, staff desks, a meeting table and cabinets, windows onto the rear.',
      ['Sheet vinyl floor, tile ceiling', 'Windows to the rear'],
      ['Administrator\'s desk', 'Meeting table', 'Cabinets']),
  ]

  const consult = (floor: Floor, id: string, name: string, rect: Rect, description: string, amenities: string[]) =>
    opd(floor, `room_opd_1_${id}`, name, rect, description,
      ['Sheet vinyl floor, washable walls, tile ceiling', 'Clinical hand-wash basin', 'Ceiling curtain track round the couch', 'Room number and specialty plate at the door'],
      amenities)
  const first: Room[] = [
    opd(F1, 'room_opd_1_hall', 'OPD Consultation Reception & Waiting', HALL,
      'The OPD\'s first floor reception at its lift lobby: the consultation desk where patients are checked in for their doctor and given a token, the token display, and seating with windows on three sides.',
      ['Vitrified tiles, plasterboard ceiling', 'OPD lifts and stair across the corridor'],
      ['Reception and appointment workstations', 'Token display', 'Waiting seating']),
    consult(F1, 'medicine', 'General Medicine · 101', [XS, XA, BAY[6], BAY[7]],
      'The general physician\'s consultation room: the doctor\'s desk with computer and phone facing the patient\'s chairs, an examination couch behind a curtain, the wall diagnostic set with BP gauge, otoscope and ophthalmoscope, and on the desk a stethoscope, digital thermometer and pulse oximeter.',
      ['Doctor\'s desk and workstation', 'Examination couch', 'Wall BP and diagnostic set', 'Stethoscope, thermometer, oximeter', 'Glucometer']),
    consult(F1, 'cardiology', 'Cardiology · 102', [XS, XA, BAY[5], BAY[6]],
      'The cardiologist\'s room: desk and workstation for reviewing ECGs and echo reports, an examination couch, a 12-lead ECG machine on its trolley beside it, and the BP and diagnostic set on the wall.',
      ['12-lead ECG machine', 'Examination couch', 'Desk with ECG review workstation', 'BP monitor and stethoscope']),
    consult(F1, 'neurology', 'Neurology · 103', [XS, XA, BAY[4], BAY[5]],
      'The neurologist\'s room: desk and workstation with an MRI/CT image viewer, an examination couch, and the neurological examination kit — reflex hammer, tuning forks, pin and monofilament — with an ophthalmoscope on the wall set.',
      ['Reflex hammer and tuning forks', 'Ophthalmoscope', 'Imaging review screen', 'Examination couch']),
    ...toilets(F1, '1', 'First Floor'),
    main(F1, 'r101', 'Double Room (AC) · 101', [1.8, 7.7, ZB, Z2A],
      'A two-bed air-conditioned room across the back of the ward: two electric ward beds side by side, each with its own bed-head unit, locker, overbed table, reading light, nurse call and monitoring, a privacy curtain between them, chairs for both patients and their attendants, a wardrobe, a TV, and the washroom by the door.',
      wardSpecs(true), ['Two 5-function electric beds', 'Privacy curtain on a ceiling track', 'Individual bed-head units and nurse call', 'Split AC and TV', 'Attached washroom']),
    main(F1, 'r102', 'Double Room (Non-AC) · 102', [7.7, XN, ZB, Z2A],
      'A two-bed room ventilated by ceiling fans and opening windows: two ward beds side by side with individual lockers, bed-head units with oxygen and vacuum, nurse call, a privacy curtain between them, patient and attendant seating, and the attached washroom.',
      wardSpecs(false), ['Two electric ward beds', 'Ceiling fans with regulators', 'Privacy curtain', 'Individual nurse call and oxygen', 'Attached washroom']),
    main(F1, 'r103', 'Single Room (Non-AC) · 103', [XN1, XN, Z2B, -12.0],
      'A single room on the north side, cooled by a ceiling fan with windows that open: an electric ward bed against the bed-head unit, locker, overbed table, patient and attendant chairs, storage, monitoring at hand, and its own washroom.',
      wardSpecs(false), ['Electric ward bed', 'Ceiling fan', 'Bedside locker and overbed table', 'Attached washroom']),
    main(F1, 'r104', 'Single Room (AC) · 104', [XN1, XN, -12.0, Z1A],
      'An air-conditioned single room on the north side: an electric ward bed, its bed-head unit with gases and nurse call, locker and overbed table, an attendant\'s sofa-cum-bed, wardrobe, TV, monitoring, and its own washroom.',
      wardSpecs(true), ['Electric ward bed', 'Split AC', 'Attendant sofa-cum-bed', 'Wardrobe and TV', 'Attached washroom']),
    main(F1, 'r105', 'Double Room (AC) · 105', [XN1, XN, Z1B, ZF],
      'A two-bed air-conditioned room at the front of the north side: two beds against the bed-head wall with a privacy curtain between, individual lockers, call and monitoring, patient and attendant seating, wardrobe, TV, and the washroom by the door.',
      wardSpecs(true), ['Two electric ward beds', 'Privacy curtain', 'Split AC and TV', 'Attached washroom']),
    main(F1, 'r106', 'Single Room (AC) · Deluxe 106', [0.9, 6.1, 8.2, 13.0],
      'The larger deluxe single room behind the main block\'s curtain wall, running out to its windows on the west façade: an electric bed with laminate ends against its bed-head unit (oxygen with flowmeter and humidifier, suction, nurse call), a vital-signs monitor and IV stand, the attendant\'s sofa-cum-bed by the window, wardrobe, TV, air-conditioning, and a spacious accessible washroom with a walk-in shower.',
      wardSpecs(true), ['Deluxe electric bed', 'Full-height glazing', 'Attendant sofa-cum-bed', 'Split AC and TV', 'Attached washroom']),
    main(F1, 'r107', 'Single Room (AC) · Deluxe 107', [6.1, 10.2, 8.2, 13.0],
      'The second deluxe single room behind the curtain wall, a mirror of 106: an electric bed, bed-head unit, attendant\'s seating, wardrobe, TV, air-conditioning and its own washroom.',
      wardSpecs(true), ['Deluxe electric bed', 'Full-height glazing', 'Split AC and TV', 'Attached washroom']),
    main(F1, 'nurses', 'Nurses\' Station · 120', [XG, XN1, Z1B, 1.0],
      'The ward\'s nurses\' station, open to the lift lobby and the front corridor so every arrival is seen: a counter with a raised transaction ledge, workstations on the hospital information system, the nurse-call annunciator showing which room is calling, the medication trolley, chart rack, phones and printer.',
      ['Open counter onto the lobby and corridor', 'Sheet vinyl floor'],
      ['Nursing workstations', 'Nurse-call annunciator', 'Medication trolley', 'Chart rack']),
    main(F1, 'consult1', 'Doctor\'s Consultation Room · 121', [XG, XN1, 1.0, ZF],
      'The ward\'s consultation room behind the nurses\' station, its door off the relatives\' lounge: consultants review inpatients and their imaging, examine a patient in private on the couch behind its curtain, and explain diagnoses, operations and discharge plans to families. A doctor\'s desk with the HIS and PACS, chairs for patient and relatives, an examination light, the wall BP and diagnostic set, an X-ray viewer, scales and a clinical hand-wash basin.',
      ['Sheet vinyl floor, tile ceiling with LED panels', 'Clinical hand-wash basin'],
      ['Doctor\'s desk and workstation', 'Examination couch with curtain', 'Wall diagnostic set', 'X-ray viewer']),
    main(F1, 'visitorWc', 'Visitors\' Accessible Toilet · 122', [XL, 0.85, 2.1, ZF],
      'A unisex accessible toilet off the relatives\' lounge: WC with grab rails and a fold-down rail, a low basin, an emergency pull cord.',
      ['Outward-opening door', 'Anti-skid tiles, tiled walls'], ['Grab rails', 'Emergency pull cord']),
    main(F1, 'visitorToilet', 'Visitors\' Toilet · 123', [0.85, XM, 2.1, ZF],
      'A second toilet for visitors and attendants, beside the accessible one off the relatives\' lounge: a WC with a health faucet, a wash basin under its mirror with soap and towel dispensers.',
      ['Outward-opening door', 'Anti-skid tiles, tiled walls'], ['WC with health faucet', 'Wash basin and mirror']),
    main(F1, 'lounge', 'Relatives\' Waiting Lounge · 124', [0.9, 11.3, ZF, 8.2],
      'The ward\'s waiting lounge for relatives and visitors behind the curtain wall, reached from the main lifts by the passage beside them or through the glazed link from the OPD: sofas and chairs, a drinking water station, an information screen and a charging point.',
      ['Vitrified tiles, plasterboard ceiling with downlights', 'Natural light from the curtain wall'],
      ['Sofas and chairs', 'Drinking water', 'Information screen']),
    main(F1, 'housekeeping', 'Housekeeping · 126', [10.2, 11.3, 8.2, 13.0],
      'The housekeeping store: cleaning trolley, consumables on shelves.', ['Epoxy floor'], ['Housekeeping trolley']),
    main(F1, 'exam', 'Examination & Procedure Room · 127', [XB, -0.6, -12.0, Z1A],
      'Where inpatients are examined and minor procedures done away from the ward: an examination couch under an examination light, dressing trolley, vitals monitor, the doctor\'s desk and a clinical hand-wash basin.',
      ['Sheet vinyl floor, tile ceiling', 'Clinical hand-wash basin'], ['Examination couch and light', 'Dressing trolley', 'Vitals monitor']),
    main(F1, 'hdu', 'High Dependency Unit (HDU) · 3 Beds · 128', [-0.6, XN0, -12.0, Z1A],
      'Three step-down critical-care beds across the corridor from the nurses\' station, for patients after major surgery, on non-invasive ventilation or on infusions that need close titration, a nurse to every two beds. Each 2.6 m bed space has an ICU bed, a headwall with oxygen, air and vacuum, flowmeter and suction, a monitor on its arm networked to the central monitor at the observation desk, infusion and syringe pumps, a locker and a curtain to the next bed; the middle bed has a non-invasive ventilator. A crash cart, medication trolley and clinical hand-wash basin by the double doors.',
      ['Sheet vinyl floor, tile ceiling with LED panels', 'Medical gases: oxygen, air, vacuum at every bed', 'UPS power at every bed', 'Nurse call to the nurses\' station annunciator'],
      ['Three ICU beds', 'Headwalls with monitors', 'Central monitoring desk', 'Non-invasive ventilator', 'Infusion and syringe pumps', 'Crash cart']),
    main(F1, 'staffWc', 'Staff Washroom & Change · 130', [XB, -0.6, Z2B, -12.0],
      'Lockers and a bench for nursing staff, a WC cubicle and basins.', ['Anti-skid tiles, tiled walls'], ['Staff lockers', 'WC and basins']),
    main(F1, 'dirty', 'Dirty Utility & Sluice · 131', [-0.6, 3.6, Z2B, -12.0],
      'Soiled work for the ward: a flushing-rim clinical sluice, a bedpan washer-disinfector, colour-coded biomedical waste bins and the soiled-linen trolley.',
      ['Epoxy floor, tiled walls', 'Mechanical exhaust'], ['Clinical sluice', 'Bedpan washer', 'BMW bins']),
    main(F1, 'doctors', 'Duty Doctors\' Room · 132', [3.6, XN0, Z2B, -12.0],
      'The resident doctors\' room on the ward: a bed for night duty, a desk with workstation, lockers.', ['Sheet vinyl floor, tile ceiling'], ['Duty bed', 'Workstation', 'Lockers']),
  ]

  const icuSpecs = ['Sheet vinyl floor, tile ceiling', 'Medical gases: oxygen, air, vacuum at the bed', 'UPS and IT-isolated power at the bed', 'Restricted access past the ICU doors']
  const second: Room[] = [
    opd(F2, 'room_opd_2_hall', 'X-ray Registration & Waiting', HALL,
      'The OPD\'s second floor reception: X-ray examinations are booked and billed here, and patients wait under the token display for the X-ray room.',
      ['Vitrified tiles, plasterboard ceiling'], ['Registration workstations', 'Token display', 'Waiting seating']),
    opd(F2, 'room_opd_2_xrayControl', 'X-ray Control & Image Review · 208', [XS, XA, BAY[6], BAY[7]],
      'The radiographer\'s control room beside the X-ray room: the generator console behind a lead-glass observation window, the image acquisition and review workstation, lead aprons, thyroid shields and gloves on their rack, and a lead door through to the room.',
      ['Lead-glass observation window', '2 mm Pb lining in the shared wall', 'Lead door to the X-ray room'],
      ['Generator console', 'Image review workstation', 'Lead apron rack']),
    opd(F2, 'room_opd_2_xray', 'Digital X-ray Room · 209', [XS, XA, BAY[4], BAY[6]],
      'General radiography: a ceiling-suspended digital X-ray tube over a floating-top patient table with a detector tray, and an upright bucky stand for chest films. The walls, door and window are lead-lined, with radiation warning signs and an X-RAY IN USE lamp at the door.',
      ['2 mm Pb lead lining to walls and door', 'Static-dissipative vinyl floor', 'Warning lamp interlocked with the generator'],
      ['Ceiling-mounted X-ray tube', 'Patient table with detector', 'Upright chest stand', 'Lead protection']),
    ...toilets(F2, '2', 'Second Floor'),
    main(F2, 'vent1', 'ICU Bed 1 · Ventilator Room', [1.8, 5.93, ZB, Z2A],
      'A single-bed ICU room for ventilated patients, glazed onto the ICU corridor: an ICU bed with an alternating-pressure mattress, a ceiling service pendant with gases, power and the multiparameter monitor (ECG, SpO₂, invasive and non-invasive pressure), a mechanical ventilator with its humidifier and breathing circuit, infusion and syringe pumps, suction, and space all round for the team.',
      icuSpecs, ['ICU bed', 'Mechanical ventilator and humidifier', 'Multiparameter monitor', 'Infusion and syringe pumps', 'Suction']),
    main(F2, 'vent2', 'ICU Bed 2 · Ventilator Room', [5.93, XN1, ZB, Z2A],
      'The second ventilator room, a mirror of the first: ICU bed, ceiling pendant, multiparameter monitor, ventilator with humidifier and circuit, infusion and syringe pumps, suction.',
      icuSpecs, ['ICU bed', 'Mechanical ventilator', 'Multiparameter monitor', 'Infusion and syringe pumps']),
    main(F2, 'icuStation', 'ICU Central Nursing Station', [XN1, XN, ZB, Z2A],
      'The ICU\'s central station at the corner of its corridors, looking down both: the central monitoring screens showing every bed\'s waveforms and alarms, the ICU doctors\' workstations, phones, records and the crash cart with its defibrillator.',
      icuSpecs, ['Central monitoring station', 'Doctors\' workstations', 'Crash cart and defibrillator']),
    main(F2, 'isolation', 'ICU Isolation Room', [XN1, XN, Z2B, -13.8],
      'A single-bed isolation room for infectious patients, entered only through its anteroom: a fully equipped ICU bed space kept at negative pressure, with its own hand-wash and waste.',
      [...icuSpecs, 'Negative pressure with room-pressure monitor', 'Anteroom for gowning'], ['ICU bed and monitor', 'Ventilator', 'Infusion pumps']),
    main(F2, 'ante', 'Isolation Anteroom', [XN1, XN, -13.8, -12.0],
      'The isolation room\'s anteroom: a clinical hand-wash basin, PPE dispensers for gowns, gloves, masks and respirators, a doffing bin, and the room-pressure monitor.',
      ['Interlocked doors', 'Clinical hand-wash basin'], ['PPE dispensers', 'Pressure monitor']),
    main(F2, 'icu4', 'ICU Bed 4', [XN1, XN, -12.0, -7.6],
      'An ICU cubicle on the north side, glazed onto the ICU corridor: ICU bed, monitor, pumps and gases.', icuSpecs, ['ICU bed', 'Multiparameter monitor', 'Infusion pumps']),
    main(F2, 'icuStore', 'ICU Equipment Store', [XN1, XN, -7.6, Z1A],
      'Spare ventilators, monitors, pumps and suction units for the ICU, charged and ready.', ['Equipment charging points'], ['Spare ventilator and monitors']),
    main(F2, 'icuWaiting', 'ICU Relatives\' Waiting · 221', [XG, XN1, Z1B, 0.5],
      'Outside the ICU\'s doors, by the main lifts: seating for relatives, a drinking water station and an information screen.', ['Vitrified tiles, plasterboard ceiling'], ['Seating', 'Drinking water']),
    main(F2, 'counselling', 'Family Counselling Room · 222', [XG, XN1, 0.5, ZF],
      'A quiet, softly lit room where the ICU team meets families: a sofa and armchairs round a low table, a doctor\'s chair, tissues and artwork.', ['Wood-look floor, dimmable light'], ['Sofa and armchairs']),
    main(F2, 'intlWc', 'Accessible Toilet · 224', [XL, 0.85, 2.1, ZF],
      'A unisex accessible toilet off the glazed link, for patients\' families and visitors: WC with grab rails and a fold-down rail, a low basin, an emergency pull cord.',
      ['Outward-opening door', 'Anti-skid tiles, tiled walls'], ['Grab rails', 'Emergency pull cord']),
    main(F2, 'intlToilet', 'Lounge Toilet · 225', [0.85, XM, 2.1, ZF],
      'A toilet off the international patient lounge: a WC with a health faucet, a wash basin under its mirror with soap and towel dispensers.',
      ['Outward-opening door', 'Anti-skid tiles, tiled walls'], ['WC with health faucet', 'Wash basin and mirror']),
    main(F2, 'intlLounge', 'International Patient Lounge & Concierge · 210', [0.9, 11.3, ZF, 8.6],
      'The international patient wing\'s lounge behind the curtain wall: the international patient desk, where coordinators arrange interpreters, visas, foreign exchange, insurance and airport transfers, premium lounge seating for families and a refreshment counter.',
      ['Wood-look floor, plasterboard ceiling with downlights', 'Full-height curtain wall'], ['International patient desk', 'Lounge seating', 'Refreshments']),
    main(F2, 'suite211', 'International Suite 211', [0.9, 6.1, 8.6, 14.2],
      'A premium patient suite behind the curtain wall: an electric bed with oak ends and premium linen against a walnut bed-head wall with oxygen, air and vacuum and nurse call, a patient\'s recliner, a sofa for visitors, TV, minibar, walnut wardrobe, air-conditioning and a stone-and-glass washroom.',
      ['Wood-look floor, plasterboard ceiling with warm downlights', 'Full-height curtain wall', 'Split AC', ...ensuite], ['Premium electric bed', 'Sofa and recliner', 'TV and minibar', 'Walnut wardrobe', 'Premium washroom']),
    main(F2, 'suite212', 'International Suite 212', [6.1, 11.3, 8.6, 14.2],
      'The second premium suite on the curtain wall, a mirror of 211: their bed heads back to back on the wall between them, the recliner and sofa-bed in the window bay, a spacious washroom with a walk-in shower.', ['Wood-look floor', 'Full-height curtain wall', 'Split AC', ...ensuite], ['Premium electric bed', 'Sofa', 'TV and minibar', 'Premium washroom']),
    main(F2, 'suite213', 'Presidential Suite 213', [XN1, XN, Z1B, 10.7],
      'The presidential suite in the north wing: the patient\'s room with its premium bed, monitoring and gases at the walnut bed-head wall, and through an inner door the family room with a sofa-cum-bed, dining table, TV and kitchenette, entered from the international lounge.',
      ['Wood-look floor, warm lighting', 'Windows to the north and east', 'Split AC', ...ensuite], ['Premium electric bed', 'Separate family room', 'TV', 'Kitchenette', 'Premium washroom']),
  ]

  const otSpecs = ['Static-dissipative conductive vinyl, coved to the walls', 'Seamless antibacterial wall panelling, recessed stainless storage', 'Sealed ceiling with HEPA laminar-flow plenum over the table, positive pressure, 25 air changes an hour, low-level return grilles', 'Medical gases on anaesthesia and surgical ceiling pendants and a wall panel: O₂, N₂O, air, vacuum, AGSS, CO₂', 'Hermetic automatic sliding door', 'IT-isolated power with UPS']
  const third: Room[] = [
    opd(F3, 'room_opd_3_hall', 'CT Scan Reception & Waiting', HALL,
      'The OPD\'s third floor reception: CT scans are booked here, safety and contrast consent forms completed, and patients wait under the token display.',
      ['Vitrified tiles, plasterboard ceiling'], ['Registration workstations', 'Token display', 'Waiting seating']),
    opd(F3, 'room_opd_3_ctControl', 'CT Control Room · 307', [XS, XA, BAY[6], BAY[7]],
      'The CT operator\'s room: the scanner console with its operator workstation and image reconstruction monitors, the contrast injector control, behind a lead-glass window onto the scanner.',
      ['Lead-glass observation window', '2 mm Pb lining', 'Lead door to the scan room'], ['Operator workstation', 'Diagnostic monitors', 'Injector control']),
    opd(F3, 'room_opd_3_ct', 'CT Scan Room · 308', [XS, XA, BAY[4], BAY[6]],
      'A multislice CT scanner: the gantry with its circular bore and the motorised patient table, a pressure contrast injector on its stand, positioning aids, and lead protection. Lead-lined walls and door with warning signs and lamp.',
      ['2 mm Pb lead lining', 'Static-dissipative floor', 'Dedicated air-conditioning for the gantry'], ['CT scanner and table', 'Contrast injector', 'Positioning aids', 'Oxygen and suction']),
    ...toilets(F3, '3', 'Third Floor'),
    main(F3, 'ot1', 'Operation Theatre 1 · General & Laparoscopic', [XG, 11.2, Z1B, 2.5],
      'A modular theatre for general and laparoscopic surgery: a mobile-column operating table with a carbon-fibre top under twin LED surgical lights with a 27″ display on their axis; the anaesthesia pendant (gases, AGSS, patient monitor) and the anaesthesia workstation piped to it at the head; the surgical pendant with the electrosurgical generator and smoke evacuator; the laparoscopy tower, back table, Mayo stand, bowl stand, kick buckets and suction; recessed stainless storage, a wall gas panel, the swab rack, the surgeon\'s control panel and a PACS display.',
      otSpecs, ['Mobile-column operating table', 'Twin LED surgical lights with display arm', 'Anaesthesia and surgical pendants', 'Anaesthesia workstation with ventilator', 'Laparoscopy tower', 'Electrosurgical unit', 'Patient monitor']),
    main(F3, 'ot2', 'Operation Theatre 2 · Orthopaedic', [0.9, 6.1, 4.5, 13.0],
      'The orthopaedic theatre: an operating table with its traction extension (boots, spars and perineal post), a mobile C-arm image intensifier and its monitor cart, the lead-apron rack, the power-tool and implant trolley, twin LED surgical lights, the anaesthesia workstation and both ceiling pendants, recessed stainless storage and a PACS display.',
      otSpecs, ['Orthopaedic operating table with traction', 'Mobile C-arm', 'Lead aprons', 'Power-tool trolley', 'Anaesthesia workstation', 'Ceiling pendants']),
    main(F3, 'ot3', 'Operation Theatre 3 · Major & Specialty', [6.1, 11.3, 4.5, 13.0],
      'The major and specialty theatre, the largest: the operating table under three LED lightheads with the navigation display on their axis, the anaesthesia workstation and pendants, a back table and a second instrument table, a critical-care ventilator for patients going to the ICU ventilated, a warming cabinet, a pass box from the sterile store, recessed storage and a PACS display.',
      otSpecs, ['Operating table', 'Triple LED surgical lights with display arm', 'Anaesthesia workstation', 'Critical-care ventilator', 'Pass box', 'Warming cabinet']),
    main(F3, 'transfer', 'Patient Transfer Bay', [XM, XG, -1.05, 2.5],
      'The red line of the theatre complex: patients arriving by the bed lifts pass from the ward\'s trolley to the theatre\'s here, and nothing from outside goes further.', ['Restricted beyond this point'], ['Transfer trolley']),
    main(F3, 'anaesthesia', 'Anaesthesia Work Room · 314', [0.9, XM, 2.1, 4.5],
      'Anaesthetic drugs and airway equipment are prepared here: the drug cabinet and fridge, a worktop and the difficult-airway trolley.', ['Conductive vinyl'], ['Drug cabinet', 'Airway trolley']),
    main(F3, 'otEquipment', 'OT Equipment Store · 315', [XL, 0.9, 2.1, 3.7], 'Spare and mobile theatre equipment.', ['Conductive vinyl'], ['Equipment racks']),
    main(F3, 'preop', 'Pre-operative Holding & OT Reception · 311', [11.2, XN, Z1B, 2.5],
      'Where patients are received, checked and prepared before surgery: the holding bay with its trolley against a headwall (oxygen, air, vacuum, flowmeter, suction and the monitor on its arm) behind a privacy curtain, the OT reception and nurse desk where the surgical safety checklist begins, a cupboard of patient gowns and caps.', ['Conductive vinyl', 'Medical gases at the bay'], ['Pre-op trolley', 'Headwall with monitor', 'Nurse desk', 'Gown cupboard']),
    main(F3, 'sterile', 'OT Sterile Instrument Store · 312', [11.3, XN, 4.5, 10.7],
      'Sterile instrument sets from the CSSD, drapes and gowns for the theatres, off the clean corridor, with a pass box into OT 3.', ['Conductive vinyl', 'Positive pressure'], ['Sterile racking', 'Pass box']),
    main(F3, 'changeM', 'Surgeons\' & Staff Changing · Male · 316', [1.8, 4.95, ZB, Z2A],
      'Changing for male surgeons, anaesthetists and staff: lockers, a bench, the scrub-suit rack and theatre clogs, a WC and a shower.', ['Tiled wet area'], ['Lockers', 'Scrub suits', 'Shower and WC']),
    main(F3, 'changeF', 'Surgeons\' & Staff Changing · Female · 317', [4.95, 8.1, ZB, Z2A],
      'Changing for female surgeons, anaesthetists and staff: lockers, a bench, the scrub-suit rack and theatre clogs, a WC and a shower.', ['Tiled wet area'], ['Lockers', 'Scrub suits', 'Shower and WC']),
    main(F3, 'cssd', 'CSSD · Sterile Instrument Processing · 318', [8.1, XN, ZB, Z2A],
      'Instruments from the theatres are processed one way through here: received and cleaned at the sinks and ultrasonic cleaner, washed in the washer-disinfector, inspected and packed under the magnifier lamp, sterilised in the steam sterilizer and stored sterile.', ['Lab vinyl, tiled walls', 'One-way dirty-to-clean flow'], ['Washer-disinfector', 'Steam sterilizer', 'Packing table', 'Sterile storage']),
    main(F3, 'dirtyOt', 'OT Dirty Utility & Disposal · 319', [XN1, XN, Z2B, -15.2],
      'Soiled linen, used instruments and biomedical waste leave the theatres here: a sluice sink, colour-coded bins and the soiled-linen trolley.', ['Epoxy floor, tiled walls'], ['Sluice', 'BMW bins']),
    main(F3, 'pacu', 'Post-anaesthesia Care Unit (Recovery) · 313', [XN1, XN, -15.2, Z1A],
      'Patients wake from anaesthesia here under constant watch: three ICU-type recovery beds against headwalls with oxygen, air and suction and a monitor on its arm, infusion pumps, curtains between the bays; the first bay fitted for resuscitation with a ventilator beside it; the PACU nurse\'s desk with the central monitor, a crash cart, a blanket and fluid warmer and a clinical hand-wash basin.', ['Conductive vinyl', 'Oxygen, air and suction at every bed'], ['Recovery beds', 'Patient monitors', 'Ventilator', 'Infusion pumps', 'Nurse station', 'Crash cart']),
  ]

  const area = (name: string, meshName: string, [lengthFt, widthFt]: [number, number], description: string, specs: string[], amenities: string[] = []): Room => ({
    id: id('room'), name, kind: 'outdoor', meshName, floorId: null,
    dimensions: { length: lengthFt, width: widthFt, unit: 'ft' }, areaSqft: Math.round(lengthFt * widthFt), description, specs, amenities, media: [],
  })
  const rooms: Room[] = [
    area('Main Entrance & Drop-off', 'amenity_entrance', [46, 43],
      'The main entrance at the foot of the curtain wall, under a thin white porte-cochère that reaches out over the drop-off lane on slim round columns: automatic sliding doors into the reception hall, wheelchairs waiting by the doors, downlights in the canopy\'s soffit, and a zebra with tactile paving straight across the lane to the entrance walk.',
      ['Porte-cochère 12.6 × 13 m, 4.25 m clear', 'Automatic sliding doors, 2.6 m clear', 'Flush kerbs and tactile paving at the crossing', 'One-way drop-off lane, 6.5 m'],
      ['Reception and pharmacy', 'Wheelchairs at the door']),
    area('Emergency & Ambulance Bay', 'amenity_emergency', [16, 33],
      'The emergency entrance in the north wing\'s side, on the exit road: a drive-through ambulance bay under a canopy that spans the road from the building to the boundary, so ambulances pull in nose to the road and leave without reversing. The hospital\'s Type-B ambulance stands in the bay: its rear doors and side door open onto a fitted patient compartment with the cot, attendant\'s seat, cabinets, oxygen and monitor. EMERGENCY in red channel letters on both of the canopy\'s fascias and on the wing above it, a flush kerb with tactile paving at the automatic doors straight into triage, and a red-cross lightbox on the wing\'s end facing the road.',
      ['Drive-through bay, 4.1 × 10 m, 4.1 m clear', 'Separate from the main drop-off', 'Illuminated red signage'], ['24 × 7 emergency', 'Ambulance access']),
    {
      id: id('room'), name: 'Emergency Department', kind: 'room', meshName: 'room_emergency', floorId: hospitalLevels.G.id,
      dimensions: { length: 87, width: 26, unit: 'ft' }, areaSqft: 2262,
      description:
        'The emergency department on the ground floor, the length of the north wing behind the ambulance entrance, between the main lobby and the stores at the back. Inside the automatic doors, reception: the registration counter facing the doors with a low section for wheelchair users, waiting seats along the lobby wall under the queue display, wheelchairs and a stretcher ready by the entrance, and a glazed triage room. Through a second pair of automatic doors, the treatment area: five curtained bays along a solid headwall, bay 1 equipped for resuscitation, each with its numbered plate hung at the curtain line, bed-head trunking with oxygen, air and vacuum, a wall-arm patient monitor and an ED stretcher-bed; across a dark vinyl corridor, the white nurses\' station faces the bays from the window wall, with mobile equipment parked either side and clean supply and a hand-wash station at the back.',
      specs: ['26.7 × 8.0 m inside, 3.0 m to the ceiling, 2.7 m under the bulkheads', 'Five treatment bays, 3.0 × 3.0 m, cubicle curtains on ceiling tracks', 'ED stretcher-beds with adjustable backrests and lowering side rails (tap to operate)', 'Medical gas pipeline: zone valve box, labelled O₂, air and vacuum outlets at every bed, area alarm', 'Oxygen cylinder rack with restraints; flowmeters, humidifiers, masks and wall suction', 'Drawers and cupboards that open: counters, lockers, crash cart, clean supply', 'Sheet vinyl floors, washable white walls, 600 mm mineral-fibre tile ceiling', 'Flat LED panels and continuous linear lights, 4000 K'],
      amenities: ['Registration counter with a wheelchair-height section', 'Triage room with oxygen and suction', 'Resuscitation bay: ceiling service pendant, crash cart, defibrillator, ventilator', 'Nurses\' station with four workstations', 'Patient monitors, ECG, ultrasound, IV pumps, examination lights', 'Waiting area for ten with queue display', 'Clinical hand-wash stations'],
      media: [],
    },
    ...ground,
    ...first,
    ...second,
    ...third,
    area('Outpatient Entrance', 'amenity_outpatient', [31, 20],
      'The outpatient entrance at the foot of the south tower, under a flat white canopy on tension rods with OUTPATIENT on the fascia above: a glazed front with automatic doors into the outpatient hall, and a paved terrace before it with benches for those waiting to be collected.',
      ['Glazed front, automatic doors', 'Canopy on stainless tension rods', 'Terrace with benches and planters'], ['Outpatient registration', 'Waiting area']),
    area('Garden & Entrance Walk', 'amenity_garden', [84, 59],
      'The garden between the drop-off lane and the road: lawns edged in granite with neem, rain and mast Ashoka trees, a seating court round a raised bed, low hedges along the entrance walk from the road to the main doors, bollard lights, and the wayfinding monolith at the way in.',
      ['Granite-edged lawns and shade trees', 'Seating court with teak benches', 'Bollard lighting along the walk', 'Wayfinding monolith at the gate'], ['Healing garden', 'Seating']),
    area('Parking & Basement Ramp', 'amenity_parking', [64, 55],
      'Behind the building: the covered ramp down to the two basement parking levels, its mouth on the entry drive under a lit sign and a height bar, its roof planted; a row of bays along the back wall; and the aisle that carries the traffic round from the entry drive to the exit road. The back is walled off from the cross road, with no gate.',
      ['Covered ramp to two basement levels, 2.2 m headroom', 'Seven surface bays with wheel stops', 'One-way loop: entry drive, aisle, exit road', 'Continuous boundary wall at the back'], ['Basement parking', 'Staff parking']),
    area('Utility Yard', 'amenity_service', [41, 30],
      'The fenced utility yard at the back, between the parking bays and the exit road: the liquid oxygen tank on its legs with its banks of vaporisers for the medical gas supply, the transformer, and the standby generator in its acoustic enclosure, near the service court and the stores\' roller shutters in the back wall.',
      ['Liquid oxygen tank and vaporisers', 'Transformer and standby generator', 'Service court with loading shutters'], ['Medical oxygen', 'Standby power']),
    basementArea(hospitalLevels.B1, -1, [122, 215], 52,
      'The upper basement, under the ward block, the rear yard and the drop-off lane. The covered ramp from the drive falls east at 1:6, two-way, and lands in the east cross aisle; from there the ramp to B2 starts under the drop-off lane. Bays run in bands across the plot between the west and east cross aisles, with parallel bays along the east wall, all on power-trowelled concrete with painted bays, numbers and arrows, rubber wheel stops, and the level\'s blue band on walls and columns; LED battens hang on drop rods under deep beams, with jet fans, an exhaust duct, a cable tray and the red sprinkler grid. A bed lift and a stair rise from the front aisle to the back of the main entrance lobby, two accessible bays beside them; a fire stair at the back.',
      ['Two-way ramp from the drive, 5.5 m, 1:6, under cover for 18 m', 'Two-way ramp to B2, 5.5 m', 'Bed lift and stair to the main lobby; fire stair at the back', 'Main block lifts — two bed lifts and a staff lift — to the third floor, off the middle cross aisle', 'LT electrical room']),
    basementArea(hospitalLevels.B2, -2, [122, 215], 59,
      'The lower basement, reached by the ramp from the front of B1 and laid out like the level above with its own green band; where the entry ramp stands on B1 there is another row of bays. The fire pump room is at the back by the stair.',
      ['Two-way ramp up to B1', 'Fire pump room', 'Bed lift and stair to the main lobby', 'Main block lifts to the third floor']),
  ]
  return {
    id: 'p_kalakal_hospital', slug: 'kalakal-hospital', name: 'Terranova Hospital', type: 'commercial', location: 'Kallakal, NH-44',
    tagline: 'A four-storey multispecialty hospital on the HMDA road: an outpatient block and a main block of wards, ICU, international suites and operation theatres',
    thumbnailUrl: placeholderImage('Terranova Hospital', 205, 800, 500),
    stats: [{ label: 'Plot', value: '4,090 sq yd' }, { label: 'Floors', value: 'B2 + G + 3' }, { label: 'Facing', value: 'East' }],
    description:
      'A hospital on Plot A-03 in Kallakal, the corner plot facing east onto the 250 ft HMDA master plan road with the 60 ft main avenue along its north side. From the road: a white tower with a grid of punched windows over the outpatient entrance; a lower glazed link; the main block, a blue-grey curtain wall held in a deep white frame whose top band carries the blue cross and the name, with a porte-cochère over the drop-off in front of the main entrance; and the end of the north wing in white bands and ribbon glazing. Behind the fronts the building is one deep block round a light court with a podium garden, in two departments. The outpatient block takes the south tower and the band behind it on every floor: the outpatient hall with its reception, security, OPD insurance and vaccination on the ground floor, consultations on the first, digital X-ray on the second and CT on the third, served by its own two stretcher lifts and stair. The main block takes the rest. On the ground floor, beside the emergency department: the main lobby and reception behind the main entrance, admissions, a patient services hall with the insurance and cashless desk, billing and the cash counter round it and the pharmacy across its end, the pharmacy store, medical records and administration. On the first floor the inpatient rooms — single and double rooms, air-conditioned and non-AC, each with its own washroom — round the nurses\' station, with a relatives\' lounge behind the curtain wall. On the second the international patient wing (a concierge lounge, two suites on the curtain wall and a presidential suite with its family room) and the ICU (two ventilator rooms, an isolation room with its anteroom, a cubicle and the central nursing station round the court). On the third the operation theatre complex: three theatres off a clean corridor with scrub stations, the transfer bay, pre-operative holding, recovery (PACU), CSSD, sterile supply and the surgeons\' changing rooms. Three main lifts — two bed lifts and a staff lift — run from B2 to the theatres, beside the main stair at the back. Traffic runs one way round: in by the entry drive along the south boundary, either along the drop-off lane in front or on to the covered basement ramp, parking and utility yard behind, and out by the exit road down the north side, past the emergency entrance\'s drive-through ambulance bay. The back is walled off from the cross road.',
    highlights: {
      Plot: 'A-03 · 125′ × 294′6″ (4,090 sq yd)', Facing: 'East, onto the 250 ft HMDA road; 60 ft avenue to the north', Structure: '2 basements + ground + 3 floors',
      Height: 'Parapet 18.75 m; name band 20.25 m', Plan: 'Body 25.7 × 41 m round a 12 × 12 m light court', 'Façade': 'White GRC cladding, blue-grey curtain wall, white composite bands',
      Setbacks: 'South 7.25 m (entry drive) · north 5.15 m (exit road) · rear 18.9 m · front 30 m', Access: 'One way: in on the south side, out on the north; no access at the back',
      Parking: '111 bays on B1 and B2 + 7 surface bays',
      'Main block': 'G reception, admissions, patient services, pharmacy · 1 inpatient rooms · 2 international wing & ICU · 3 three operation theatres',
      Outpatients: 'G OPD hall · 1 consultations · 2 digital X-ray · 3 CT',
      Circulation: 'Main block: two bed lifts and a staff lift (B2–3), the main stair · OPD: two stretcher lifts (G–3), the OPD stair · a fire stair; ring corridors round the court',
    },
    model: { kind: 'furnished', design: 'kalakal-hospital' }, floors: [...opdFloors, ...hospitalLevels.floors], rooms,
    // Camera positions in scene metres: +z east (the HMDA road), +x north. The main doors are at (6.1, 13).
    // The controls keep the camera from looking upwards (polar angle ≤ 86°), so every view looks level or down.
    presets: [
      { id: 'reference', name: 'As in the reference', position: [-12, 10, 50], target: [4, 6.5, 6], fov: 50 },
      { id: 'street', name: 'From the road', position: [8, 5.5, 50], target: [5, 1.8, 10], fov: 62 },
      { id: 'front', name: 'East elevation', position: [2.5, 10, 80], target: [2.5, 9, 0], fov: 42 },
      { id: 'elevation', name: 'Straight-on elevation', position: [2.5, 10, 180], target: [2.5, 10, 0], fov: 18 },
      { id: 'northeast', name: 'North-east, from the avenue', position: [46, 16, 50], target: [3, 12, 0], fov: 42 },
      { id: 'southeast', name: 'South-east corner', position: [-44, 16, 52], target: [2, 12, 0], fov: 42 },
      { id: 'north', name: 'North side, along the avenue', position: [58, 14, -6], target: [6, 14, -6] },
      { id: 'south', name: 'South side (the drive)', position: [-56, 12, -4], target: [-8, 12, -4] },
      { id: 'rear', name: 'Rear, ramp and yard', position: [-4, 20, -82], target: [3, 8, -28] },
      { id: 'aerial', name: 'Aerial', position: [58, 78, 72], target: [2, 8, -6] },
      { id: 'entrance', name: 'Main entrance, eye level', position: [6.1, 1.7, 34], target: [6.1, 0.2, 14], fov: 58 },
      { id: 'emergency', name: 'Emergency entrance', position: [16.3, 1.7, 20], target: [16, 0.6, 1], fov: 55 },
      { id: 'outpatient', name: 'Outpatient entrance', position: [-5, 1.7, 24], target: [-7.1, 0.7, 12], fov: 58 },
      { id: 'court', name: 'Light court from above', position: [1.5, 36, 2], target: [1.5, 9, -12], fov: 50 },
      { id: 'top', name: 'Plan view', position: [0, 200, -0.01], target: [0, 0, 0] },
      { id: 'b1', name: 'B1 · overview', position: [36, 26, 24], target: [0, -3.3, -12], level: -1 },
      { id: 'b1-ramp', name: 'B1 · down the entry ramp', position: [-12.4, 1.7, -31], target: [6, -3.0, -31], fov: 60, level: -1 },
      { id: 'b1-aisle', name: 'B1 · driving aisle, eye level', position: [-11.5, -1.75, -20.05], target: [8, -2.2, -20.05], fov: 60, level: -1 },
      { id: 'b1-lifts', name: 'B1 · main block lifts', position: [5, -1.75, -5.2], target: [-1.5, -2.1, -1.05], fov: 58, level: -1 },
      { id: 'b2', name: 'B2 · overview', position: [36, 23, 24], target: [0, -6.6, -12], level: -2 },
      { id: 'b2-aisle', name: 'B2 · driving aisle, eye level', position: [8, -5.05, -4.05], target: [-12, -5.5, -4.05], fov: 60, level: -2 },
      { id: 'b2-ramp', name: 'B2 · up the ramp to B1', position: [-16.2, -4.9, 6.9], target: [2, -5.2, 6.9], fov: 60, level: -2 },
    ],
    media: [],
  }
}

export const properties: Property[] = [nyshasHaven(), kalakalD65(), kalakalMall(), kalakalHotel(), kalakalA01(), kalakalHospital()]
