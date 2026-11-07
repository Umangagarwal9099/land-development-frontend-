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
  hospitalLevels.G.name = 'Ground Floor · Entry & Pharmacy'
  hospitalLevels.G.cutY = 0.15 + 2.75
  hospitalLevels.G.focus = [-11.8, -26, 5.5, 12]
  const opdFloors: Floor[] = [
    { id: id('floor'), name: 'First Floor · Consultations', level: 1, groupName: 'floor_1', cutY: 4.95 + 2.75, focus: body },
    { id: id('floor'), name: 'Second Floor · Laboratory & Diagnostics', level: 2, groupName: 'floor_2', cutY: 9.15 + 2.75, focus: body },
    { id: id('floor'), name: 'Third Floor · Imaging & Cardiac', level: 3, groupName: 'floor_3', cutY: 13.35 + 2.75, focus: body },
  ]

  // The outpatient department, room by room (see features/property/scene/furnished/kalakalHospital/opd/plan.ts):
  // each room's hotspot is `room_opd_<floor>_<id>`, its size taken from its plan rectangle in metres.
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
  const XS = -11.5, XA = -7.26, XB = -4.74, XBB = -4.24, XL = -2.0, XP0 = 0.84, XP1 = 3.24, XN0 = 7.86, XN1 = 10.06, XN = 13.6, XG = 5.48
  const ZB = -25.7, Z2A = -20.56, Z2B = -18.24, Z1A = -5.76, Z1B = -3.44, ZF = 4.0, ZT = 11.7
  const BAY = [-25.7, -22.83, -19.67, -16.5, -13.33, -10.17, -7.0, -3.83]
  const NB = [Z2B, -14.16, -9.72, Z1A]
  const BB = [XBB, -2.729, -1.218, 0.294, 1.806, 3.318, 4.829, 6.341, 7.853, 9.365, 10.876, 12.388, XN]
  const HALL: Rect = [XS, -2.7, ZF, ZT]
  const LOUNGE: Rect = [0.9, 11.3, ZF, 13.0]
  const WING: Rect = [11.3, XN, ZF, 10.7]
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

  const ground: Room[] = [
    opd(hospitalLevels.G, 'room_opd_g_hall', 'Outpatient Hall & Main Reception', HALL,
      'The outpatient entrance hall in the foot of the south tower, entered through automatic sliding doors under the OUTPATIENT canopy. The security and information desk stands inside the doors; the main reception and enquiry counter runs along the south wall with its registration workstations; the appointment and lift-assistance counter stands at the mouth of the corridor to the lifts. Patients wait on beam seating facing the token display.',
      ['Large-format vitrified tiles, plasterboard ceiling with downlights', 'Glazed front with automatic doors, 2.4 m clear', '8.8 × 7.7 m, open to the glazed link and waiting lounge', 'CCTV and public address'],
      ['Main reception and enquiry counter', 'Appointment & lift assistance counter', 'Security & information desk', 'Token display and seating', 'Drinking water station']),
    opd(hospitalLevels.G, 'room_opd_g_waiting', 'Waiting Lounge', [XL, 3.2, Z1B, ZF],
      'The ground floor\'s main waiting lounge, through the glazed link from the hall, open across the front corridor to the pharmacy\'s dispensing counter. Rows of linked seating face the billing and report counters on the east side, with the queue displays above them; the wheelchair and stretcher bay is off its north side.',
      ['Vitrified tile floor, plasterboard ceiling with downlights', 'Natural light through the glazed link', 'Queue displays over the counters'],
      ['Linked beam seating', 'Queue and token displays', 'Wheelchair & stretcher bay', 'Drinking water']),
    opd(hospitalLevels.G, 'room_opd_g_billing', 'Billing Counter', [3.2, XG, Z1B, 0.3],
      'The OPD billing office: patients pay at a transaction counter with a glass screen opening onto the waiting lounge, with its own queue. Behind it three billing workstations with receipt printers, card and UPI payment terminals and a cash drawer; the staff door is from the front corridor.',
      ['Open transaction hatch with glass screen, ledge at 1.0 m', 'Sheet vinyl floor, tile ceiling', 'Staff door from the corridor; connecting door to reports'],
      ['Three billing workstations', 'Receipt printers', 'Card and UPI terminals', 'Cash drawer and safe']),
    opd(hospitalLevels.G, 'room_opd_g_reports', 'Report Collection Counter', [3.2, XG, 0.3, ZF],
      'Diagnostic reports are handed over here: a counter onto the waiting lounge where patients show their bill or token, and behind it document shelves and filing cabinets of printed laboratory and imaging reports, two workstations with printers to reprint and verify them.',
      ['Transaction hatch onto the lounge', 'Sheet vinyl floor, tile ceiling', 'Reached from billing through a connecting door'],
      ['Two workstations with printers', 'Report filing shelves', 'Filing cabinets', 'Barcode scanner']),
    opd(hospitalLevels.G, 'room_opd_g_pharmacy', 'Pharmacy', [-1.2, XG, -12.6, Z1A],
      'The outpatient pharmacy, its dispensing counter facing the waiting lounge across the front corridor. Behind the counter, pharmacists dispense from floor-to-ceiling medicine racks and drawer cabinets arranged by category, with billing computers and barcode scanners on the counter and a medical refrigerator for cold-chain drugs; the store is through a door at the back.',
      ['Dispensing hatch 5.6 m long with glass screen', 'Sheet vinyl floor, tile ceiling, 22–25 °C controlled', 'Pharmacy refrigerator at 2–8 °C', 'Narcotics cupboard under lock'],
      ['Medicine display racks', 'Drawer cabinets', 'Billing computers and barcode scanners', 'Prescription storage', 'Medical refrigerator']),
    opd(hospitalLevels.G, 'room_opd_g_pharmacyStore', 'Pharmacy Store', [-1.2, XG, Z2B, -12.6],
      'The pharmacy\'s bulk store behind the dispensary, with a double door to the back corridor for deliveries: steel racks of cartons by supplier and expiry, a staff work table for receiving and checking stock, and the inventory workstation.',
      ['Double delivery door, 1.2 m', 'Steel storage racks', 'Temperature and humidity logged'],
      ['Bulk medicine racks', 'Goods-receiving table', 'Inventory workstation']),
    opd(hospitalLevels.G, 'room_opd_g_dressing', 'Dressing & Injection Room', [XB, -1.2, -12.0, Z1A],
      'Wound dressings, injections and minor procedures for outpatients: two examination beds behind privacy curtains, an injection preparation counter with a sink, dressing trolleys laid with instruments, bandages, cotton, gauze and antiseptics, sharps containers and colour-coded waste bins, and an oxygen cylinder on its trolley.',
      ['Sheet vinyl floor, washable walls, tile ceiling', 'Clinical hand-wash basin', 'Ceiling curtain tracks', 'Oxygen cylinder and suction'],
      ['Two dressing/examination beds', 'Injection preparation counter', 'Dressing trolleys', 'Sharps containers and BMW bins', 'Supply cupboards']),
    opd(hospitalLevels.G, 'room_opd_g_admin', 'Administration & Patient Registration', [XB, -1.2, Z2B, -12.0],
      'The OPD\'s administrative office: registration staff create patient records and UHID cards, and the OPD manager handles rosters and records. Desks with workstations and printers, filing cabinets and a small meeting table.',
      ['Sheet vinyl floor, tile ceiling', 'Network and phone points at every desk'],
      ['Registration workstations', 'Card printer', 'Filing cabinets', 'Meeting table']),
    opd(hospitalLevels.G, 'room_opd_g_security', 'Security & CCTV Control', [XS, XA, BAY[6], BAY[7]],
      'The security control room: CCTV monitors for the hospital\'s cameras, the fire alarm repeater panel and the public address console, with a desk for the duty officer and a key cabinet.',
      ['CCTV video wall', 'Fire alarm repeater panel', 'PA system console'],
      ['Monitoring desk', 'Key cabinet', 'Lockers']),
    opd(hospitalLevels.G, 'room_opd_g_insurance', 'Insurance & TPA Desk', [XS, XA, BAY[5], BAY[6]],
      'Cashless insurance and TPA (third-party administrator) approvals and government health-scheme verification: two desks with workstations and scanners, document trays and visitor chairs.',
      ['Sheet vinyl floor, tile ceiling', 'South window'],
      ['Two desks with workstations', 'Document scanner', 'Visitor seating']),
    opd(hospitalLevels.G, 'room_opd_g_vaccination', 'Vaccination Room', [XS, XA, BAY[4], BAY[5]],
      'Immunisation for children and adults: an ice-lined refrigerator keeping vaccines at 2–8 °C, a preparation counter with a sink, an examination couch, the vaccinator\'s desk and an observation chair for the half hour after a dose.',
      ['Ice-lined refrigerator with temperature log', 'Clinical hand-wash basin', 'Sheet vinyl floor'],
      ['Vaccine refrigerator', 'Preparation counter', 'Examination couch', 'Sharps and BMW bins']),
    opd(hospitalLevels.G, 'room_opd_g_housekeeping', 'Housekeeping & Linen', [3.6, XG, ZB, Z2A],
      'The housekeeping store at the back: linen shelves, cleaning trolleys and chemicals, a janitor\'s sink.',
      ['Epoxy floor', 'Janitor\'s sink'],
      ['Linen racks', 'Cleaning trolleys']),
    ...toilets(hospitalLevels.G, 'g', 'Ground Floor'),
  ]

  const consult = (floor: Floor, id: string, name: string, rect: Rect, description: string, amenities: string[]) =>
    opd(floor, `room_opd_1_${id}`, name, rect, description,
      ['Sheet vinyl floor, washable walls, tile ceiling', 'Clinical hand-wash basin', 'Ceiling curtain track round the couch', 'Room number and specialty plate at the door'],
      amenities)
  const first: Room[] = [
    opd(F1, 'room_opd_1_hall', 'First Floor Reception & Waiting', HALL,
      'The first floor\'s reception at the lift lobby: the consultation desk where patients are checked in for their doctor and given a token, the token display, and seating with windows on three sides.',
      ['Vitrified tiles, plasterboard ceiling', 'Lifts and stair across the corridor'],
      ['Reception and appointment workstations', 'Token display', 'Waiting seating']),
    opd(F1, 'room_opd_1_lounge', 'Consultation Waiting Lounge', LOUNGE,
      'The main waiting lounge behind the curtain wall, through the glazed link from the reception: rows of seating facing the token displays that call patients to the consultation rooms, with the nurses\' station open onto it.',
      ['Full-height curtain wall to the east', 'Vitrified tiles, plasterboard ceiling'],
      ['Waiting seating', 'Token displays', 'Drinking water']),
    consult(F1, 'medicine', 'General Medicine · 101', [XS, XA, BAY[6], BAY[7]],
      'The general physician\'s consultation room: the doctor\'s desk with computer and phone facing the patient\'s chairs, an examination couch behind a curtain, the wall diagnostic set with BP gauge, otoscope and ophthalmoscope, and on the desk a stethoscope, digital thermometer and pulse oximeter.',
      ['Doctor\'s desk and workstation', 'Examination couch', 'Wall BP and diagnostic set', 'Stethoscope, thermometer, oximeter', 'Glucometer']),
    consult(F1, 'cardiology', 'Cardiology · 102', [XS, XA, BAY[5], BAY[6]],
      'The cardiologist\'s room: desk and workstation for reviewing ECGs and echo reports, an examination couch, a 12-lead ECG machine on its trolley beside it, and the BP and diagnostic set on the wall.',
      ['12-lead ECG machine', 'Examination couch', 'Desk with ECG review workstation', 'BP monitor and stethoscope']),
    consult(F1, 'neurology', 'Neurology · 103', [XS, XA, BAY[4], BAY[5]],
      'The neurologist\'s room: desk and workstation with an MRI/CT image viewer, an examination couch, and the neurological examination kit — reflex hammer, tuning forks, pin and monofilament — with an ophthalmoscope on the wall set.',
      ['Reflex hammer and tuning forks', 'Ophthalmoscope', 'Imaging review screen', 'Examination couch']),
    consult(F1, 'orthopaedics', 'Orthopaedics · 104', [BB[0], BB[3], ZB, Z2A],
      'The orthopaedic surgeon\'s room, wider for patients on crutches and in wheelchairs: desk and workstation, an X-ray film viewer and PACS screen, an examination couch, a plaster trolley with casting materials, and splints and braces in the cupboards.',
      ['X-ray viewer and PACS screen', 'Plaster and splint trolley', 'Examination couch', 'Goniometer']),
    consult(F1, 'dermatology', 'Dermatology · 105', [BB[3], BB[5], ZB, Z2A],
      'The dermatologist\'s room: desk and workstation, an examination couch under a magnifying examination lamp, a dermatoscope, and a procedure trolley for biopsies and cryotherapy.',
      ['Magnifying examination lamp', 'Dermatoscope', 'Cryotherapy unit', 'Procedure trolley']),
    consult(F1, 'gynaecology', 'Obstetrics & Gynaecology · 106', [BB[5], BB[8], ZB, Z2A],
      'The gynaecologist\'s room: desk and workstation in front, and behind a curtain a gynaecological examination table with leg supports, an examination lamp, an instrument trolley and a foetal Doppler; a chaperone chair.',
      ['Gynaecological examination table', 'Examination lamp', 'Foetal Doppler', 'Instrument trolley']),
    consult(F1, 'paediatrics', 'Paediatrics · 107', [BB[8], XN, ZB, Z2A],
      'The paediatrician\'s room: desk and workstation, an examination couch with a child-size step, an infant weighing scale and length board, a stadiometer, a nebuliser, and a small play corner for waiting siblings.',
      ['Infant weighing scale', 'Stadiometer', 'Paediatric examination couch', 'Nebuliser']),
    consult(F1, 'ent', 'ENT · 108', [XN1, XN, Z1B, ZF],
      'The ENT surgeon\'s room: an ENT treatment unit with its light source, suction and instrument tray beside a reclining ENT examination chair, a headlight, otoscope, and the doctor\'s desk and workstation.',
      ['ENT treatment unit', 'ENT examination chair', 'Headlight and otoscope', 'Suction']),
    opd(F1, 'room_opd_1_surgery', 'General Surgery · 109', [XN1, XN, NB[0], NB[1]],
      'The general surgeon\'s consultation room: desk and workstation, an examination couch behind a curtain with an examination lamp, a dressing trolley for post-operative wound checks, and the wall diagnostic set.',
      ['Sheet vinyl floor, tile ceiling', 'Clinical hand-wash basin', 'North window'],
      ['Examination couch and lamp', 'Dressing trolley', 'Desk and workstation']),
    opd(F1, 'room_opd_1_dressingExam', 'Dressing & Examination Room · 110', [XN1, XN, NB[1], NB[3]],
      'Dressings and examinations for the consultation floor: two examination beds between privacy curtains, dressing trolleys with bandages, cotton, gauze and antiseptics, instrument trays, a hand-wash basin, supply cupboards and colour-coded waste bins.',
      ['Sheet vinyl floor, tile ceiling', 'Ceiling curtain tracks', 'Clinical hand-wash basin'],
      ['Two examination beds', 'Dressing trolleys', 'Supply cupboards', 'BMW bins and sharps']),
    opd(F1, 'room_opd_1_vitals', 'Vitals & Pre-consultation · 111', [XB, 1.5, -12.0, Z1A],
      'Before seeing the doctor, patients have weight, height, blood pressure, temperature and oxygen saturation recorded here by nurses at three vitals stations, entered straight into the patient record.',
      ['Sheet vinyl floor, tile ceiling'],
      ['Column scale and stadiometer', 'Vitals monitors', 'Workstations']),
    opd(F1, 'room_opd_1_records', 'Medical Records · 112', [1.5, XN0, -12.0, Z1A],
      'The OPD\'s medical records room: steel shelving and filing cabinets of patient files by number, a scanning workstation where paper records are digitised, and a counter where files are issued to the clinics.',
      ['Restricted access', 'Sheet vinyl floor; fire detection'],
      ['Records shelving', 'Filing cabinets', 'Scanning workstation']),
    opd(F1, 'room_opd_1_cleanUtility', 'Clean Utility & Medical Supply · 113', [XB, 1.5, Z2B, -12.0],
      'The floor\'s clean store: drawer units and glazed wall cupboards of dressings, syringes, gloves and consumables, linen shelves, and a worktop with a sink for preparing trays.',
      ['Sheet vinyl floor', 'Worktop with sink'],
      ['Supply drawers and cupboards', 'Linen shelves', 'Preparation worktop']),
    opd(F1, 'room_opd_1_doctors', 'Doctors\' Staff Room · 114', [1.5, XN0, Z2B, -12.0],
      'A room for consultants between clinics: lounge seating, a table, lockers for coats and bags, and a workstation.',
      ['Sheet vinyl floor, tile ceiling'],
      ['Lounge seating', 'Staff lockers', 'Workstation']),
    opd(F1, 'room_opd_1_pantry', 'Staff Pantry · 115', [XL, XP0, Z1B, ZF],
      'The staff pantry: a counter with a sink, refrigerator, microwave and water dispenser.',
      ['Sheet vinyl floor', 'Counter with sink'],
      ['Refrigerator', 'Microwave', 'Water dispenser']),
    opd(F1, 'room_opd_1_nurses', 'Nurses\' Station · 116', [XP1, XN0, Z1B, ZF],
      'The nurses\' station, open to the waiting lounge: a counter with workstations from which nurses manage the consultation queue and call tokens, with medication and supply cupboards behind and a crash cart ready.',
      ['Open counter onto the lounge', 'Sheet vinyl floor'],
      ['Nursing workstations', 'Token calling system', 'Supply cupboards', 'Crash cart']),
    opd(F1, 'room_opd_1_feeding', 'Breastfeeding & Baby Care · 117', WING,
      'A private room off the lounge for nursing mothers: armchairs, a baby-changing counter with a sink and a waste bin.',
      ['Sheet vinyl floor', 'Windows to the north and east'],
      ['Nursing armchairs', 'Baby-changing counter']),
    ...toilets(F1, '1', 'First Floor'),
  ]

  const lab = ['Chemical-resistant lab vinyl, coved', 'Epoxy-resin benches with reagent shelves', 'Laboratory sink and eye-wash', 'Exhaust ventilation, 6–10 air changes an hour']
  const second: Room[] = [
    opd(F2, 'room_opd_2_hall', 'Diagnostics Registration & Help Desk', HALL,
      'The diagnostics floor\'s registration counter at the lift lobby: tests are booked and billed here, samples labelled with barcodes, and patients helped with report collection. Seating and a token display.',
      ['Vitrified tiles, plasterboard ceiling'],
      ['Registration and billing workstations', 'Barcode label printers', 'Token display', 'Waiting seating']),
    opd(F2, 'room_opd_2_lounge', 'Diagnostics Waiting Lounge', LOUNGE,
      'The waiting lounge behind the curtain wall for blood collection, imaging and the other tests on the floor, with token displays and the doors to blood collection and ultrasound off it.',
      ['Full-height curtain wall', 'Vitrified tiles, plasterboard ceiling'],
      ['Waiting seating', 'Token displays', 'Drinking water']),
    opd(F2, 'room_opd_2_healthCheck', 'General Health Check-up · 201', [XL, XP0, 0.3, ZF],
      'The executive health check-up room: a physician\'s desk, an examination couch, scales and a stadiometer, and the vitals equipment for health packages.',
      ['Sheet vinyl floor, tile ceiling'],
      ['Examination couch', 'Scale and stadiometer', 'Vitals monitor']),
    opd(F2, 'room_opd_2_cleanUtility', 'Clean Utility · 202', [XL, XP0, Z1B, 0.3],
      'The diagnostics floor\'s clean store of consumables: tubes, needles, gloves, swabs and linen.',
      ['Sheet vinyl floor'], ['Supply cupboards', 'Linen shelves']),
    opd(F2, 'room_opd_2_bloodCollection', 'Blood Sample Collection · 203', [XP1, XN0, Z1B, ZF],
      'Phlebotomy for outpatients: four blood collection chairs with armrests, each with its phlebotomist\'s workstation, tube racks, vacutainers, needles, tourniquets, swabs and gloves; barcode label printers and scanners; a sample refrigerator; sharps containers and colour-coded waste bins. Samples pass to sample receiving.',
      ['Lab vinyl floor, tile ceiling', 'Frosted screen to the lounge', 'Hand-wash basin'],
      ['Four phlebotomy chairs', 'Barcode printers and scanners', 'Sample refrigerator', 'Sharps and BMW bins']),
    opd(F2, 'room_opd_2_labStaff', 'Laboratory Staff Room · 204', [XN0, XN1, Z1B, ZF],
      'Rest room for laboratory staff: table and chairs, lockers and a small pantry counter.',
      ['Sheet vinyl floor'], ['Lockers', 'Table and chairs', 'Pantry counter']),
    opd(F2, 'room_opd_2_ultrasound', 'Ultrasound & Sonography · 205', [XN1, XN, 0.3, ZF],
      'Ultrasound scanning under dimmed light: a colour Doppler ultrasound machine beside a motorised examination couch, a reporting workstation, gel warmer and linen, with a curtain for privacy.',
      ['Dimmable lighting', 'Sheet vinyl floor'],
      ['Colour Doppler ultrasound', 'Motorised couch', 'Reporting workstation']),
    opd(F2, 'room_opd_2_pft', 'Pulmonary Function Testing · 206', [XN1, XN, Z1B, 0.3],
      'Lung function testing: a body plethysmograph booth and a PC-based spirometer on its trolley, a calibration syringe, a weighing scale and stadiometer, and the technician\'s desk.',
      ['Sheet vinyl floor', 'Supply of disposable filters and mouthpieces'],
      ['Body plethysmograph', 'Spirometer', 'Calibration syringe']),
    opd(F2, 'room_opd_2_reportPrep', 'Diagnostic Report Preparation · 207', WING,
      'Reports are typed, verified and printed here before release to the report counters: desks with workstations and printers along the windows.',
      ['Sheet vinyl floor'], ['Reporting workstations', 'Printers']),
    opd(F2, 'room_opd_2_xrayControl', 'X-ray Control & Image Review · 208', [XS, XA, BAY[6], BAY[7]],
      'The radiographer\'s control room beside the X-ray room: the generator console behind a lead-glass observation window, the image acquisition and review workstation, lead aprons, thyroid shields and gloves on their rack, and a lead door through to the room.',
      ['Lead-glass observation window', '2 mm Pb lining in the shared wall', 'Lead door to the X-ray room'],
      ['Generator console', 'Image review workstation', 'Lead apron rack']),
    opd(F2, 'room_opd_2_xray', 'Digital X-ray Room · 209', [XS, XA, BAY[4], BAY[6]],
      'General radiography: a ceiling-suspended digital X-ray tube over a floating-top patient table with a detector tray, and an upright bucky stand for chest films. The walls, door and window are lead-lined, with radiation warning signs and an X-RAY IN USE lamp at the door.',
      ['2 mm Pb lead lining to walls and door', 'Static-dissipative vinyl floor', 'Warning lamp interlocked with the generator'],
      ['Ceiling-mounted X-ray tube', 'Patient table with detector', 'Upright chest stand', 'Lead protection']),
    opd(F2, 'room_opd_2_biochemistry', 'Biochemistry Laboratory · 210', [XN1, XN, NB[0], NB[1]],
      'Clinical chemistry: a fully automated chemistry analyser and an electrolyte analyser on the bench, a sample refrigerator, the LIS workstation, and reagent shelves above the benches.',
      lab, ['Clinical chemistry analyser', 'Electrolyte analyser', 'Reagent refrigerator', 'LIS workstation']),
    opd(F2, 'room_opd_2_haematology', 'Haematology Laboratory · 211', [XN1, XN, NB[1], NB[2]],
      'Blood counts and coagulation: an automated haematology analyser, a coagulation analyser, a microscope for peripheral smears, a sample mixer and ESR analyser, and the LIS workstation.',
      lab, ['Haematology analyser', 'Coagulation analyser', 'Microscope', 'ESR analyser']),
    opd(F2, 'room_opd_2_receiving', 'Sample Receiving & Accessioning · 212', [XN1, XN, NB[2], NB[3]],
      'Samples arrive from collection and the wards and are checked, barcoded and logged into the laboratory information system before being sorted to the sections.',
      lab, ['Barcode scanners', 'LIS workstations', 'Sample racks', 'Sample refrigerator']),
    opd(F2, 'room_opd_2_bmw', 'Biomedical Waste Store · 213', [BB[0], BB[1], ZB, Z2A],
      'The floor\'s biomedical waste holding room: colour-coded wheeled bins for yellow, red, white and blue category waste, collected daily by the authorised operator.',
      ['Tiled walls, epoxy floor, floor trap', 'Lockable, ventilated'], ['Colour-coded wheeled bins']),
    opd(F2, 'room_opd_2_equipment', 'Equipment Store · 214', [BB[1], BB[2], ZB, Z2A],
      'Storage for spare and mobile diagnostic equipment and consumables on steel racks.',
      ['Epoxy floor'], ['Steel racks']),
    opd(F2, 'room_opd_2_reagents', 'Reagent Store & Preparation · 215', [BB[2], BB[4], ZB, Z2A],
      'Reagents and kits are stored on racks and in refrigerators, and working solutions prepared at the bench with a distilled water plant and balance.',
      lab, ['Reagent racks', 'Reagent refrigerators', 'Water purification unit', 'Analytical balance']),
    opd(F2, 'room_opd_2_centrifuge', 'Sample Processing & Centrifuge · 216', [BB[4], BB[6], ZB, Z2A],
      'Samples are centrifuged, separated and aliquoted for the sections: benchtop centrifuges, a refrigerated centrifuge, vortex mixers, tube racks and a sample refrigerator.',
      lab, ['Benchtop centrifuges', 'Refrigerated centrifuge', 'Vortex mixers', 'Sample refrigerator']),
    opd(F2, 'room_opd_2_clinicalPath', 'Clinical Pathology · Urine & Stool · 217', [BB[6], BB[8], ZB, Z2A],
      'Urine and stool examination: a urine analyser, microscopes for sediment and stool microscopy, a sink, and a tiled bench for handling samples.',
      ['Tiled walls, lab vinyl floor', 'Deep sink and exhaust'], ['Urine analyser', 'Microscopes', 'Sample racks']),
    opd(F2, 'room_opd_2_microbiology', 'Microbiology Laboratory · 218', [BB[8], BB[10], ZB, Z2A],
      'Cultures and sensitivity: a Class II biosafety cabinet, incubators, an autoclave, microscopes, a blood culture system and an antibiotic susceptibility workstation.',
      [...lab, 'Biosafety level 2 practice'], ['Biosafety cabinet', 'Incubators', 'Autoclave', 'Microscopes']),
    opd(F2, 'room_opd_2_serology', 'Serology & Immunology · 219', [BB[10], XN, ZB, Z2A],
      'Immunoassays and serology: a chemiluminescence immunoassay analyser, an ELISA reader and washer, a refrigerator for kits, and the LIS workstation.',
      lab, ['Immunoassay analyser', 'ELISA reader and washer', 'Kit refrigerator']),
    ...toilets(F2, '2', 'Second Floor'),
  ]

  const third: Room[] = [
    opd(F3, 'room_opd_3_hall', 'Imaging & Cardiac Reception', HALL,
      'Reception for the imaging and cardiac diagnostics floor: patients book MRI, CT, ECG, echo and TMT here, complete safety and consent forms, and wait under the token display.',
      ['Vitrified tiles, plasterboard ceiling'], ['Registration workstations', 'Token display', 'Waiting seating']),
    opd(F3, 'room_opd_3_lounge', 'Imaging & Cardiac Waiting Lounge', LOUNGE,
      'The floor\'s waiting lounge behind the curtain wall, reached from the front corridor, with the echo room and the cardiac changing room off it.',
      ['Full-height curtain wall', 'Vitrified tiles, plasterboard ceiling'], ['Waiting seating', 'Token displays']),
    opd(F3, 'room_opd_3_ctPrep', 'CT Patient Preparation & Changing · 301', [XL, XP0, Z1B, 3.7],
      'Patients for CT change here and have an IV cannula placed for contrast: changing cubicles with lockers, a recovery trolley, an injection counter, oxygen and a crash cart for contrast reactions.',
      ['Sheet vinyl floor', 'Oxygen and suction'], ['Changing cubicles and lockers', 'Patient trolley', 'Crash cart']),
    opd(F3, 'room_opd_3_reporting', 'Imaging Reporting & Radiologists · 302', [XP1, XN0, Z1B, ZF],
      'The radiologists\' reading room under low, indirect light: PACS reporting workstations with dual diagnostic monitors and dictation microphones, where MRI, CT and X-ray studies are reported.',
      ['Dimmable indirect lighting', 'Sheet vinyl floor'], ['PACS reporting workstations', 'Diagnostic monitors', 'Dictation']),
    opd(F3, 'room_opd_3_staff', 'Imaging Staff Room · 303', [XN0, XN1, Z1B, ZF],
      'A rest room for radiographers and technicians: table and chairs, lockers and a pantry counter.',
      ['Sheet vinyl floor'], ['Lockers', 'Table and chairs']),
    opd(F3, 'room_opd_3_echo', '2D Echo Room · 304', [XN1, XN, 0.3, ZF],
      'Echocardiography in a dimmed room: a cardiac ultrasound system with its transducer probes beside an echo examination couch that tilts the patient to the left, ECG leads to the machine, and the cardiologist\'s reporting desk.',
      ['Dimmable lighting', 'Sheet vinyl floor'], ['Echocardiography system', 'Echo couch', 'Transducer probes', 'Reporting workstation']),
    opd(F3, 'room_opd_3_ecg', 'ECG Room · 305', [XN1, XN, Z1B, 0.3],
      'Resting 12-lead ECGs: an examination bed, the ECG machine on its trolley with electrodes, lead wires and skin preparation supplies, and the technician\'s desk.',
      ['Sheet vinyl floor', 'Curtain round the bed'], ['12-lead ECG machine', 'Examination bed', 'Electrodes and lead wires']),
    opd(F3, 'room_opd_3_cardiacChanging', 'Cardiac Patient Changing · 306', WING,
      'Changing cubicles and lockers for patients having ECG, echo and stress tests.',
      ['Sheet vinyl floor'], ['Changing cubicles', 'Lockers']),
    opd(F3, 'room_opd_3_ctControl', 'CT Control Room · 307', [XS, XA, BAY[6], BAY[7]],
      'The CT operator\'s room: the scanner console with its operator workstation and image reconstruction monitors, the contrast injector control, behind a lead-glass window onto the scanner.',
      ['Lead-glass observation window', '2 mm Pb lining', 'Lead door to the scan room'], ['Operator workstation', 'Diagnostic monitors', 'Injector control']),
    opd(F3, 'room_opd_3_ct', 'CT Scan Room · 308', [XS, XA, BAY[4], BAY[6]],
      'A multislice CT scanner: the gantry with its circular bore and the motorised patient table, a pressure contrast injector on its stand, positioning aids, and lead protection. Lead-lined walls and door with warning signs and lamp.',
      ['2 mm Pb lead lining', 'Static-dissipative floor', 'Dedicated air-conditioning for the gantry'], ['CT scanner and table', 'Contrast injector', 'Positioning aids', 'Oxygen and suction']),
    opd(F3, 'room_opd_3_equipment', 'Equipment Store · 309', [XN1, XN, NB[0], NB[1]],
      'Storage for imaging accessories, MRI-safe wheelchairs and trolleys, and spare consumables.',
      ['Epoxy floor'], ['Steel racks', 'Equipment parking']),
    opd(F3, 'room_opd_3_tmt', 'Stress Test (TMT) Room · 310', [XN1, XN, NB[1], NB[2]],
      'Exercise stress testing: a treadmill linked to a stress ECG system with its monitor and BP measurement, an examination bed for recovery, a crash cart with defibrillator and oxygen at hand.',
      ['Sheet vinyl floor', 'Oxygen and suction'], ['Treadmill', 'Stress ECG system', 'Crash cart and defibrillator', 'Recovery bed']),
    opd(F3, 'room_opd_3_cardiacConsult', 'Cardiac Diagnostic Consultation · 311', [XN1, XN, NB[2], NB[3]],
      'The cardiologist reviews ECG, echo and stress results with the patient here: desk and workstation, an examination couch, and the BP and diagnostic set.',
      ['Sheet vinyl floor', 'North window'], ['Desk and workstation', 'Examination couch', 'BP monitor']),
    opd(F3, 'room_opd_3_mriScreening', 'MRI Safety Screening & Changing · 312', [BB[0], BB[2], ZB, Z2A],
      'MRI zone II: patients complete the safety questionnaire, change into gowns and leave metal in lockers; a ferromagnetic detector is at the access door to zone III, and MRI-safe wheelchairs wait here.',
      ['MRI zone II', 'Access-controlled door to zone III'], ['Screening desk', 'Changing cubicles', 'Lockers', 'Ferromagnetic detector']),
    opd(F3, 'room_opd_3_mriTech', 'MRI Technical Room · 313', [BB[2], BB[4], ZB, Z2A],
      'The scanner\'s equipment room: gradient and RF cabinets, the cold-head compressor, chiller and UPS, with the penetration panel through the RF shield.',
      ['Dedicated air-conditioning', 'Epoxy floor'], ['Gradient and RF cabinets', 'Helium compressor', 'Chiller', 'UPS']),
    opd(F3, 'room_opd_3_mri', 'MRI Scan Room · 314', [BB[4], BB[9], ZB, Z2A],
      'A 1.5 T MRI scanner inside a copper RF-shielded room: the magnet with its bore and patient table, coils on a shelf, MRI-conditional accessories, an RF-shielded door with warning signs and a MRI SCANNING lamp. Zone IV — nothing ferromagnetic enters.',
      ['Copper RF shielding with waveguides', '5-Gauss line within the room', 'Quench pipe to the roof', 'Static-dissipative floor'], ['1.5 T MRI scanner', 'Receive coils', 'MR-conditional accessories']),
    opd(F3, 'room_opd_3_mriControl', 'MRI Control Room · 315', [BB[9], XN, ZB, Z2A],
      'The MRI operator\'s console and image workstations behind an RF-shielded observation window onto the magnet, with the intercom and the emergency quench button.',
      ['RF mesh observation window', 'MRI zone III'], ['Operator console', 'Image workstations', 'Intercom']),
    opd(F3, 'room_opd_3_mriZone', 'MRI Zone III', [BB[2], XN, Z2A, Z2B],
      'The access-controlled corridor in front of the MRI suite, past the screening room: only screened patients and MRI staff go beyond its doors.',
      ['Access-controlled doors', 'Warning signage'], ['Restricted access']),
    ...toilets(F3, '3', 'Third Floor'),
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
      ['Two-way ramp from the drive, 5.5 m, 1:6, under cover for 18 m', 'Two-way ramp to B2, 5.5 m', 'Bed lift and stair to the main lobby; fire stair at the back', 'LT electrical room']),
    basementArea(hospitalLevels.B2, -2, [122, 215], 59,
      'The lower basement, reached by the ramp from the front of B1 and laid out like the level above with its own green band; where the entry ramp stands on B1 there is another row of bays. The fire pump room is at the back by the stair.',
      ['Two-way ramp up to B1', 'Fire pump room', 'Bed lift and stair to the main lobby']),
  ]
  return {
    id: 'p_kalakal_hospital', slug: 'kalakal-hospital', name: 'Terranova Hospital', type: 'commercial', location: 'Kallakal, NH-44',
    tagline: 'A four-storey multispecialty hospital on the HMDA road, its outpatient department fitted out on every floor',
    thumbnailUrl: placeholderImage('Terranova Hospital', 205, 800, 500),
    stats: [{ label: 'Plot', value: '4,090 sq yd' }, { label: 'Floors', value: 'B2 + G + 3' }, { label: 'Facing', value: 'East' }],
    description:
      'A hospital on Plot A-03 in Kallakal, the corner plot facing east onto the 250 ft HMDA master plan road with the 60 ft main avenue along its north side. From the road: a white tower with a grid of punched windows over the outpatient entrance; a lower glazed link; the main block, a blue-grey curtain wall held in a deep white frame whose top band carries the blue cross and the name, with a porte-cochère over the drop-off in front of the main entrance; and the end of the north wing in white bands and ribbon glazing. Behind the fronts the building is one deep block round a light court with a podium garden. The outpatient department occupies the south tower and the body on all four floors, around the court: on the ground floor the outpatient hall with the main reception, enquiry, appointment and lift-assistance counters, the waiting lounge with billing and report collection, the pharmacy and its store, the dressing and injection room, vaccination, insurance and administration; on the first floor nine specialty consultation rooms (general medicine, cardiology, neurology, orthopaedics, dermatology, obstetrics and gynaecology, paediatrics, ENT and general surgery) with vitals, a dressing room, the nurses\' station and medical records; on the second the laboratory (blood collection, sample receiving, haematology, biochemistry, microbiology, serology, clinical pathology) with digital X-ray, ultrasound, pulmonary function and health check-ups; and on the third MRI, CT, ECG, 2D echo and stress testing with radiologists\' reporting. Two stretcher lifts and the OPD stair stand behind the outpatient entrance, a fire stair at the back; corridors ring the court, glazed onto it on the upper floors. The emergency department and the main lobby keep the ground floor\'s north side. Traffic runs one way round: in by the entry drive along the south boundary, either along the drop-off lane in front or on to the covered basement ramp, parking and utility yard behind, and out by the exit road down the north side, past the emergency entrance\'s drive-through ambulance bay. The back is walled off from the cross road.',
    highlights: {
      Plot: 'A-03 · 125′ × 294′6″ (4,090 sq yd)', Facing: 'East, onto the 250 ft HMDA road; 60 ft avenue to the north', Structure: '2 basements + ground + 3 floors',
      Height: 'Parapet 18.75 m; name band 20.25 m', Plan: 'Body 25.7 × 41 m round a 12 × 12 m light court', 'Façade': 'White GRC cladding, blue-grey curtain wall, white composite bands',
      Setbacks: 'South 7.25 m (entry drive) · north 5.15 m (exit road) · rear 18.9 m · front 30 m', Access: 'One way: in on the south side, out on the north; no access at the back',
      Parking: '111 bays on B1 and B2 + 7 surface bays',
      Outpatients: 'G entry, reception, pharmacy, billing · 1 nine consultation rooms · 2 laboratory, X-ray, ultrasound, PFT · 3 MRI, CT, ECG, echo, TMT',
      Circulation: 'Two 13-person stretcher lifts (G–3), the OPD stair and a fire stair; ring corridors round the court',
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
      { id: 'b1-lifts', name: 'B1 · lift lobby', position: [5, -1.75, -5.2], target: [-1.5, -2.1, -1.05], fov: 58, level: -1 },
      { id: 'b2', name: 'B2 · overview', position: [36, 23, 24], target: [0, -6.6, -12], level: -2 },
      { id: 'b2-aisle', name: 'B2 · driving aisle, eye level', position: [8, -5.05, -4.05], target: [-12, -5.5, -4.05], fov: 60, level: -2 },
      { id: 'b2-ramp', name: 'B2 · up the ramp to B1', position: [-16.2, -4.9, 6.9], target: [2, -5.2, 6.9], fov: 60, level: -2 },
    ],
    media: [],
  }
}

export const properties: Property[] = [nyshasHaven(), kalakalD65(), kalakalMall(), kalakalHotel(), kalakalA01(), kalakalHospital()]
