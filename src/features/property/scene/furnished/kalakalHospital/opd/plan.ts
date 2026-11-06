import { GL, L1, UPPER } from '../plan'

/*
 * The outpatient department: the hospital's south tower and the body behind it on all four
 * floors, and on the floors above the ground the whole of the body, the main block behind its
 * curtain wall and the end of the north wing (the emergency department and the main lobby keep
 * the ground floor's north side). Every floor is planned on the same lines, so the structure,
 * the cores, the risers and the wet rooms stand one over another:
 *
 *   core        the OPD stair (dog-leg, 4.1 m wide) and two 1.5 × 2.3 m stretcher lifts back to back
 *               with it across the south corridor, behind the outpatient entrance; the accessible
 *               WC behind the lifts; the riser and janitor's closet behind the stair; the fire stair
 *               at the back of the south side, discharging by the staff door.
 *   corridors   S along the south side, from the entrance hall to the back; C1 across the front
 *               of the light court, C2 across its back and, above the ground, N down its north
 *               side: a ring round the court, glazed onto it where the court is open (2nd and 3rd).
 *   bands       rooms 4.2 m deep on the south façade in 3.17 m bays (the punched windows' bays);
 *               5.1 m deep across the back and 3.5 m deep down the north side, partitions on the
 *               ribbon glazing's mullions.
 *   public      on every floor the entrance hall in the tower's front, the lifts' landing beside it
 *               and its reception counter; above the ground the waiting lounge behind the main
 *               block's curtain wall, reached through the glazed link or the passage beside it.
 *
 * Plan frame as in ../plan.ts (+x north, +z east towards the road). Rooms are rectangles on their
 * walls' centre lines; at the façade they stop at its inner face, where no wall is built. Walls,
 * floors, ceilings, skirtings, lights and the room hotspots are made from these (see shell.ts);
 * what stands in each room is the business of its fitter (see rooms/).
 */

export type Dir = '+x' | '-x' | '+z' | '-z'

/** A door in a room's side: its centre along the side, clear width, and how it is built. */
export interface DoorSpec {
  side: Dir
  at: number
  w?: number
  /** single (default), double leaves, a lead-lined X-ray / CT door, an RF-shielded MRI door, a fully glazed door, a fire door. */
  kind?: 'single' | 'double' | 'lead' | 'mri' | 'glass' | 'fire'
  /** Which jamb the hinges are on, seen from inside the room looking out: −1 the left, 1 the right. */
  hinge?: -1 | 1
  /** A door that leads from this room into the next one (connecting): no plate, no switch by it. */
  internal?: boolean
  /** Swings out of the room (stairs, small stores) rather than in. */
  out?: boolean
}

/** A window in an internal wall (observation, a counter's screen): along the side from … to, sill … head above the floor. */
export interface Glazing {
  side: Dir
  from: number
  to: number
  sill: number
  head: number
  /** Open (a counter's hatch, no glass), lead glass (X-ray / CT control), or RF mesh glass (MRI). */
  kind?: 'clear' | 'hatch' | 'lead' | 'rf' | 'frosted'
}

export type FloorFinish = 'vinyl' | 'corridor' | 'vitrified' | 'tile' | 'lab' | 'conductive' | 'service'
export type CeilingFinish = 'tiles' | 'board' | 'wet' | 'open'

/** What a room is, for its walls and lighting: circulation joins open to circulation. */
export type RoomKind = 'room' | 'circulation' | 'public' | 'core' | 'wet' | 'service' | 'restricted'

export interface RoomSpec {
  id: string
  name: string
  /** Room number on its door plate. */
  no?: string
  /** x0, x1, z0, z1 on the walls' centre lines. */
  rect: [number, number, number, number]
  /** Its fitter (rooms/index.ts), and anything the fitter needs to know. */
  fit: string
  kind?: RoomKind
  doors?: DoorSpec[]
  /** Sides with no wall at all (an alcove open to the corridor, a counter's open front). */
  open?: Dir[]
  /** Partial openings along a side, from … to. */
  gaps?: { side: Dir; from: number; to: number }[]
  glazing?: Glazing[]
  floor?: FloorFinish
  ceiling?: CeilingFinish
  /** Sides built as the core's 200 mm reinforced concrete rather than 120 mm blockwork. */
  thick?: Dir[]
  /** Wall tiles to 2.1 m on its side of its walls (toilets, sluices, dirty work). */
  tiled?: boolean
  /** No hotspot (corridors, risers, the core): lit as the floor's circulation. */
  quiet?: boolean
  /** Lighting: clinical panels (default), dimmable reading-room light, or the lounge's downlights. */
  light?: 'clinical' | 'dim' | 'lounge' | 'service'
}

export interface FloorPlan {
  level: number
  /** Finished floor level. */
  y: number
  label: string
  title: string
  rooms: RoomSpec[]
  /** Inner faces of the building and the neighbours' walls: lines where no wall of ours is built. */
  facade: { axis: 'x' | 'z'; c: number; from: number; to: number }[]
  /** Outline of the floor slab (for the upper floors). */
  plate: [number, number][]
}

/** Floor levels of the four OPD floors. */
export const LEVELS = [GL, L1, UPPER[1], UPPER[2]]
/** Clear height to the ceiling on every floor (the emergency department's too). */
export const CEILING = 3.0
/** Where a floor is cut for the view into it from above: under its ceilings and its pelmets. */
export const CUT = 2.75
export const WALL = 0.12
export const CORE_WALL = 0.2

/* ---------- the lines everything is planned on ---------- */

const XS = -11.5
const XA = -7.26
const XB = -4.74
const XBB = -4.24
const XL = -2.0
const XP0 = 0.84
const XP1 = 3.24
const XN0 = 7.86
const XN1 = 10.06
const XN = 13.6
/** The emergency department's inner wall: the OPD's north side on the ground floor. */
const XG = 5.48

const ZB = -25.7
const Z2A = -20.56
const Z2B = -18.24
const Z1A = -5.76
const Z1B = -3.44
const ZF = 4.0
/** The tower's front and the glazed link's, inside. */
const ZT = 11.7
const ZK = 8.95
/** The south façade's window bays, back to front: room partitions stand on their piers. */
const BAY = [-25.7, -22.83, -19.67, -16.5, -13.33, -10.17, -7.0, -3.83]

export const LINES = { XS, XA, XB, XBB, XL, XP0, XP1, XN0, XN1, XN, XG, ZB, Z2A, Z2B, Z1A, Z1B, ZF, ZT, ZK, BAY }

/** The OPD stair (its enclosure), the lift bank, the fire stair. */
export const STAIR = { x0: XS, x1: XA, z0: -2.3, z1: ZF }
export const FIRE_STAIR = { x0: XS, x1: XA, z0: ZB, z1: BAY[2] }
export const LIFTS = {
  x0: XB, x1: XL, z0: -0.06, z1: ZF,
  cars: [
    { x: -3.45, z: 2.9, w: 1.5, d: 2.3 },
    { x: -3.45, z: 0.95, w: 1.5, d: 2.3 },
  ],
}

/* ---------- rooms every floor has, one over another ---------- */

function common(level: number): RoomSpec[] {
  const n = (i: number) => `${level === 0 ? 'G' : level}${String(i).padStart(2, '0')}`
  const rooms: RoomSpec[] = [
    { id: 'stair', name: 'OPD Stair', rect: [STAIR.x0, STAIR.x1, STAIR.z0, STAIR.z1], fit: 'stair', kind: 'core', thick: ['+x', '-z', '+z'], quiet: true, floor: 'service', ceiling: 'open', doors: [{ side: '+x', at: 3.2, w: 1.1, kind: 'fire', hinge: -1 }] },
    { id: 'lifts', name: 'Lifts', rect: [LIFTS.x0, LIFTS.x1, LIFTS.z0, LIFTS.z1], fit: 'lifts', kind: 'core', thick: ['+x', '-z', '+z', '-x'], quiet: true, ceiling: 'open' },
    { id: 'riser', name: 'Electrical Riser & Janitor', no: n(90), rect: [XS, XA, BAY[7], STAIR.z0], fit: 'riser', kind: 'service', quiet: true, floor: 'service', ceiling: 'open', light: 'service', doors: [{ side: '+x', at: -3.07, w: 0.9, out: true }] },
    { id: 'firestair', name: 'Fire Stair', rect: [FIRE_STAIR.x0, FIRE_STAIR.x1, FIRE_STAIR.z0, FIRE_STAIR.z1], fit: 'firestair', kind: 'core', thick: ['+x', '+z'], quiet: true, floor: 'service', ceiling: 'open', doors: [{ side: '+x', at: -20.4, w: 1.1, kind: 'fire', hinge: 1 }] },
    {
      id: 'ladies', name: 'Toilets · Ladies', no: n(91), rect: [XS, XA, BAY[3], BAY[4]], fit: 'toilet_f', kind: 'wet', tiled: true, floor: 'tile', ceiling: 'wet',
      doors: [{ side: '+x', at: -14.0, w: 1.0 }],
    },
    {
      id: 'gents', name: 'Toilets · Gents', no: n(92), rect: [XS, XA, BAY[2], BAY[3]], fit: 'toilet_m', kind: 'wet', tiled: true, floor: 'tile', ceiling: 'wet',
      doors: [{ side: '+x', at: -17.15, w: 1.0 }],
    },
    {
      id: 'wc', name: 'Accessible WC', no: n(93), rect: [XB, XL, Z1B, LIFTS.z0], fit: 'wc_accessible', kind: 'wet', tiled: true, floor: 'tile', ceiling: 'wet',
      doors: [{ side: '-z', at: -3.1, w: 1.0, out: true }],
    },
    // The south corridor: from the entrance hall past the lifts to the back; past the back band's
    // line it widens to the band's first mullion.
    { id: 'corridorS', name: 'South Corridor', rect: [XA, XB, Z2A, ZF], fit: 'corridor', kind: 'circulation', floor: 'corridor', quiet: true },
    { id: 'corridorS2', name: 'South Corridor', rect: [XA, XBB, ZB, Z2A], fit: 'corridor', kind: 'circulation', floor: 'corridor', quiet: true },
  ]
  return rooms
}

/** The corridors round the court, to `east` (the ward wall on the ground floor, the façade above). */
function ring(level: number, east: number): RoomSpec[] {
  const out: RoomSpec[] = [
    { id: 'corridorC1', name: 'Front Corridor', rect: [XB, east, Z1A, Z1B], fit: 'corridor', kind: 'circulation', floor: 'corridor', quiet: true },
    { id: 'corridorC2', name: 'Back Corridor', rect: [XB, east, Z2A, Z2B], fit: 'corridor', kind: 'circulation', floor: 'corridor', quiet: true },
  ]
  if (level > 0) out.push({ id: 'corridorN', name: 'North Corridor', rect: [XN0, XN1, Z2B, Z1A], fit: 'corridor', kind: 'circulation', floor: 'corridor', quiet: true })
  return out
}

/** The entrance hall in the tower's front, and above the ground the glazed link beside it. */
function hall(level: number, fit: string, name: string): RoomSpec[] {
  const out: RoomSpec[] = [{ id: 'hall', name, rect: [XS, -2.7, ZF, ZT], fit, kind: 'public', floor: 'vitrified', ceiling: 'board', light: 'lounge' }]
  if (level < 3) out.push({ id: 'link', name: 'Glazed Link', rect: [-2.7, 0.9, ZF, ZK], fit: 'link', kind: 'public', floor: 'vitrified', ceiling: 'board', light: 'lounge', quiet: true })
  return out
}

/** Above the ground: the waiting lounge behind the curtain wall, from the link to the north wing. */
function lounge(level: number, name: string): RoomSpec[] {
  return [
    { id: 'lounge', name, rect: [0.9, 11.3, ZF, 13.0], fit: 'lounge', kind: 'public', floor: 'vitrified', ceiling: 'board', light: 'lounge' },
    // The strip along the curtain wall between the piers (on the first floor the slab's upstand).
    ...(level > 1 ? [{ id: 'loungeFront', name, rect: [2.0, 10.2, 13.0, 14.2] as [number, number, number, number], fit: 'loungeFront', kind: 'public' as const, floor: 'vitrified' as const, ceiling: 'board' as const, light: 'lounge' as const, quiet: true }] : []),
  ]
}

/* ---------- the ground floor: entry, reception, pharmacy, billing ---------- */

const ground: RoomSpec[] = [
  ...common(0),
  ...ring(0, XG),
  ...hall(0, 'hall_g', 'Outpatient Hall & Main Reception'),
  // The waiting lounge: the link, and behind it the front of the body to the billing counters,
  // open to the front corridor across the pharmacy's counter; the wheelchair bay off it.
  { id: 'waiting', name: 'Waiting Lounge', rect: [XL, 3.2, Z1B, ZF], fit: 'waiting_g', kind: 'public', floor: 'vitrified', ceiling: 'board', light: 'lounge', open: ['-z'] },
  { id: 'wheelchairs', name: 'Wheelchair & Stretcher Bay', rect: [0.9, 2.0, ZF, 12.85], fit: 'wheelchairs', kind: 'public', floor: 'vitrified', ceiling: 'board', quiet: true, open: ['-z'] },
  {
    id: 'billing', name: 'Billing Counter', no: 'G05', rect: [3.2, XG, Z1B, 0.3], fit: 'billing', kind: 'room', floor: 'vinyl',
    doors: [{ side: '-z', at: 4.6, w: 0.9 }, { side: '+z', at: 4.6, w: 0.9, internal: true }],
    glazing: [{ side: '-x', from: -3.2, to: 0.1, sill: 1.0, head: 2.2, kind: 'hatch' }],
  },
  {
    id: 'reports', name: 'Report Collection Counter', no: 'G06', rect: [3.2, XG, 0.3, ZF], fit: 'reports', kind: 'room', floor: 'vinyl',
    glazing: [{ side: '-x', from: 0.5, to: 3.0, sill: 1.0, head: 2.2, kind: 'hatch' }],
  },
  {
    id: 'pharmacy', name: 'Pharmacy', no: 'G07', rect: [-1.2, XG, -12.6, Z1A], fit: 'pharmacy', kind: 'room', floor: 'vinyl',
    doors: [{ side: '-z', at: 4.3, w: 1.0, internal: true }],
    glazing: [{ side: '+z', from: -0.7, to: 4.9, sill: 1.0, head: 2.3, kind: 'hatch' }],
  },
  { id: 'pharmacyStore', name: 'Pharmacy Store', no: 'G08', rect: [-1.2, XG, Z2B, -12.6], fit: 'pharmacy_store', kind: 'room', floor: 'vinyl', doors: [{ side: '-z', at: 4.3, w: 1.2, kind: 'double' }] },
  { id: 'dressing', name: 'Dressing & Injection Room', no: 'G04', rect: [XB, -1.2, -12.0, Z1A], fit: 'dressing_injection', kind: 'room', floor: 'vinyl', doors: [{ side: '-x', at: -7.0, w: 1.2 }] },
  { id: 'admin', name: 'Administration & Patient Registration', no: 'G09', rect: [XB, -1.2, Z2B, -12.0], fit: 'admin', kind: 'room', floor: 'vinyl', doors: [{ side: '-x', at: -13.0, w: 0.9 }] },
  { id: 'security', name: 'Security & CCTV Control', no: 'G01', rect: [XS, XA, BAY[6], BAY[7]], fit: 'security', kind: 'room', floor: 'vinyl', doors: [{ side: '+x', at: -4.5, w: 0.9 }] },
  { id: 'insurance', name: 'Insurance & TPA Desk', no: 'G02', rect: [XS, XA, BAY[5], BAY[6]], fit: 'insurance', kind: 'room', floor: 'vinyl', doors: [{ side: '+x', at: -7.7, w: 0.9 }] },
  { id: 'vaccination', name: 'Vaccination Room', no: 'G03', rect: [XS, XA, BAY[4], BAY[5]], fit: 'vaccination', kind: 'room', floor: 'vinyl', doors: [{ side: '+x', at: -10.85, w: 1.0 }] },
  // The back of the ground floor: the air-handling plant behind the louvres, housekeeping.
  { id: 'ahu', name: 'AHU & Electrical Room', rect: [XBB, 3.6, ZB, Z2A], fit: 'ahu', kind: 'service', floor: 'service', ceiling: 'open', light: 'service', quiet: true, doors: [{ side: '+z', at: -0.6, w: 1.5, kind: 'double', out: true }] },
  { id: 'housekeeping', name: 'Housekeeping & Linen', no: 'G10', rect: [3.6, XG, ZB, Z2A], fit: 'housekeeping', kind: 'service', floor: 'service', light: 'service', doors: [{ side: '+z', at: 4.6, w: 0.9 }] },
]

/* ---------- the first floor: consultations ---------- */

/** The north side's rooms, the ward wing's front and its end, on the upper floors. */
const NB = [Z2B, -14.16, -9.72, Z1A]
/** The back band's partitions, on the ribbon glazing's mullions. */
const BB = [XBB, -2.729, -1.218, 0.294, 1.806, 3.318, 4.829, 6.341, 7.853, 9.365, 10.876, 12.388, XN]

const consult = (id: string, name: string, no: string, rect: RoomSpec['rect'], fit: string, door: DoorSpec): RoomSpec => ({
  id, name, no, rect, fit, kind: 'room', floor: 'vinyl', doors: [door],
})

const first: RoomSpec[] = [
  ...common(1),
  ...ring(1, XN),
  ...hall(1, 'reception_1', 'First Floor Reception & Waiting'),
  ...lounge(1, 'Consultation Waiting Lounge'),
  consult('medicine', 'General Medicine', '101', [XS, XA, BAY[6], BAY[7]], 'consult_medicine', { side: '+x', at: -4.5 }),
  consult('cardiology', 'Cardiology', '102', [XS, XA, BAY[5], BAY[6]], 'consult_cardiology', { side: '+x', at: -7.7 }),
  consult('neurology', 'Neurology', '103', [XS, XA, BAY[4], BAY[5]], 'consult_neurology', { side: '+x', at: -10.85 }),
  consult('orthopaedics', 'Orthopaedics', '104', [BB[0], BB[3], ZB, Z2A], 'consult_orthopaedics', { side: '+z', at: -0.4, w: 1.2 }),
  consult('dermatology', 'Dermatology', '105', [BB[3], BB[5], ZB, Z2A], 'consult_dermatology', { side: '+z', at: 2.6 }),
  consult('gynaecology', 'Obstetrics & Gynaecology', '106', [BB[5], BB[8], ZB, Z2A], 'consult_gynaecology', { side: '+z', at: 4.2 }),
  consult('paediatrics', 'Paediatrics', '107', [BB[8], XN, ZB, Z2A], 'consult_paediatrics', { side: '+z', at: 8.8 }),
  consult('ent', 'ENT', '108', [XN1, XN, Z1B, ZF], 'consult_ent', { side: '-z', at: 11.0 }),
  consult('surgery', 'General Surgery', '109', [XN1, XN, NB[0], NB[1]], 'consult_surgery', { side: '-x', at: -15.0 }),
  { id: 'dressingExam', name: 'Dressing & Examination Room', no: '110', rect: [XN1, XN, NB[1], NB[3]], fit: 'dressing_exam', kind: 'room', floor: 'vinyl', doors: [{ side: '-x', at: -11.6, w: 1.2 }] },
  { id: 'vitals', name: 'Vitals & Pre-consultation', no: '111', rect: [XB, 1.5, -12.0, Z1A], fit: 'vitals', kind: 'room', floor: 'vinyl', doors: [{ side: '+z', at: -2.6, w: 1.2 }] },
  { id: 'records', name: 'Medical Records', no: '112', rect: [1.5, XN0, -12.0, Z1A], fit: 'records', kind: 'room', floor: 'vinyl', doors: [{ side: '+z', at: 6.8, w: 1.0 }] },
  { id: 'cleanUtility', name: 'Clean Utility & Medical Supply', no: '113', rect: [XB, 1.5, Z2B, -12.0], fit: 'clean_utility', kind: 'room', floor: 'vinyl', doors: [{ side: '-z', at: -2.6, w: 1.0 }] },
  { id: 'doctors', name: 'Doctors\' Staff Room', no: '114', rect: [1.5, XN0, Z2B, -12.0], fit: 'doctors_room', kind: 'room', floor: 'vinyl', doors: [{ side: '-z', at: 6.8, w: 1.0 }] },
  { id: 'pantry', name: 'Staff Pantry', no: '115', rect: [XL, XP0, Z1B, ZF], fit: 'pantry', kind: 'room', floor: 'vinyl', doors: [{ side: '-z', at: -0.4, w: 0.9 }] },
  { id: 'passage', name: 'Passage', rect: [XP0, XP1, Z1B, ZF], fit: 'corridor', kind: 'circulation', floor: 'corridor', quiet: true },
  // The nurses' station faces the lounge from the front of the body, open to it.
  { id: 'nurses', name: 'Nurses\' Station', no: '116', rect: [XP1, XN0, Z1B, ZF], fit: 'nurses_station', kind: 'room', floor: 'vinyl', open: ['+z'], doors: [{ side: '-z', at: 6.9, w: 0.9 }] },
  { id: 'passageN', name: 'Passage', rect: [XN0, XN1, Z1B, ZF], fit: 'corridor', kind: 'circulation', floor: 'corridor', quiet: true },
  { id: 'feeding', name: 'Breastfeeding & Baby Care', no: '117', rect: [11.3, XN, ZF, 10.7], fit: 'feeding', kind: 'room', floor: 'vinyl', light: 'dim', doors: [{ side: '-x', at: 5.0, w: 0.9 }] },
]

/* ---------- the second floor: laboratory and diagnostics ---------- */

const second: RoomSpec[] = [
  ...common(2),
  ...ring(2, XN),
  ...hall(2, 'reception_2', 'Diagnostics Registration & Help Desk'),
  ...lounge(2, 'Diagnostics Waiting Lounge'),
  { id: 'healthCheck', name: 'General Health Check-up', no: '201', rect: [XL, XP0, 0.3, ZF], fit: 'health_check', kind: 'room', floor: 'vinyl', doors: [{ side: '+z', at: -0.5, w: 1.0 }] },
  { id: 'cleanUtility', name: 'Clean Utility', no: '202', rect: [XL, XP0, Z1B, 0.3], fit: 'clean_utility_small', kind: 'room', floor: 'vinyl', doors: [{ side: '-z', at: -0.5, w: 0.9 }] },
  { id: 'passage', name: 'Passage', rect: [XP0, XP1, Z1B, ZF], fit: 'corridor', kind: 'circulation', floor: 'corridor', quiet: true },
  {
    id: 'bloodCollection', name: 'Blood Sample Collection', no: '203', rect: [XP1, XN0, Z1B, ZF], fit: 'blood_collection', kind: 'room', floor: 'lab',
    doors: [{ side: '+z', at: 4.2, w: 1.2 }, { side: '-z', at: 7.2, w: 0.9 }],
    glazing: [{ side: '+z', from: 5.0, to: 7.6, sill: 0.9, head: 2.2, kind: 'frosted' }],
  },
  { id: 'labStaff', name: 'Laboratory Staff Room', no: '204', rect: [XN0, XN1, Z1B, ZF], fit: 'lab_staff', kind: 'room', floor: 'vinyl', doors: [{ side: '-z', at: 8.9, w: 0.9 }] },
  { id: 'ultrasound', name: 'Ultrasound & Sonography', no: '205', rect: [XN1, XN, 0.3, ZF], fit: 'ultrasound', kind: 'room', floor: 'vinyl', light: 'dim', doors: [{ side: '+z', at: 10.7, w: 1.0 }] },
  { id: 'pft', name: 'Pulmonary Function Testing', no: '206', rect: [XN1, XN, Z1B, 0.3], fit: 'pft', kind: 'room', floor: 'vinyl', doors: [{ side: '-z', at: 11.0, w: 1.0 }] },
  { id: 'reportPrep', name: 'Diagnostic Report Preparation', no: '207', rect: [11.3, XN, ZF, 10.7], fit: 'report_prep', kind: 'room', floor: 'vinyl', doors: [{ side: '-x', at: 5.0, w: 0.9 }] },
  {
    id: 'xrayControl', name: 'X-ray Control & Image Review', no: '208', rect: [XS, XA, BAY[6], BAY[7]], fit: 'xray_control', kind: 'room', floor: 'vinyl',
    doors: [{ side: '+x', at: -4.4, w: 0.9 }, { side: '-z', at: -8.0, w: 0.9, kind: 'lead', internal: true }],
    glazing: [{ side: '-z', from: -10.6, to: -9.2, sill: 0.9, head: 2.0, kind: 'lead' }],
  },
  { id: 'xray', name: 'Digital X-ray Room', no: '209', rect: [XS, XA, BAY[4], BAY[6]], fit: 'xray', kind: 'room', floor: 'conductive', doors: [{ side: '+x', at: -8.1, w: 1.5, kind: 'lead' }] },
  { id: 'biochemistry', name: 'Biochemistry Laboratory', no: '210', rect: [XN1, XN, NB[0], NB[1]], fit: 'biochemistry', kind: 'room', floor: 'lab', doors: [{ side: '-x', at: -15.2, w: 1.0 }] },
  { id: 'haematology', name: 'Haematology Laboratory', no: '211', rect: [XN1, XN, NB[1], NB[2]], fit: 'haematology', kind: 'room', floor: 'lab', doors: [{ side: '-x', at: -10.6, w: 1.0 }] },
  { id: 'receiving', name: 'Sample Receiving & Accessioning', no: '212', rect: [XN1, XN, NB[2], NB[3]], fit: 'sample_receiving', kind: 'room', floor: 'lab', doors: [{ side: '-x', at: -6.6, w: 1.0 }] },
  { id: 'bmw', name: 'Biomedical Waste Store', no: '213', rect: [BB[0], BB[1], ZB, Z2A], fit: 'bmw_store', kind: 'service', floor: 'service', tiled: true, light: 'service', doors: [{ side: '+z', at: -3.48, w: 0.9, out: true }] },
  { id: 'equipment', name: 'Equipment Store', no: '214', rect: [BB[1], BB[2], ZB, Z2A], fit: 'equipment_store', kind: 'service', floor: 'service', light: 'service', doors: [{ side: '+z', at: -1.97, w: 0.9, out: true }] },
  { id: 'reagents', name: 'Reagent Store & Preparation', no: '215', rect: [BB[2], BB[4], ZB, Z2A], fit: 'reagent_store', kind: 'room', floor: 'lab', doors: [{ side: '+z', at: 0.3, w: 1.0 }] },
  { id: 'centrifuge', name: 'Sample Processing & Centrifuge', no: '216', rect: [BB[4], BB[6], ZB, Z2A], fit: 'centrifuge', kind: 'room', floor: 'lab', doors: [{ side: '+z', at: 3.3, w: 1.0 }] },
  { id: 'clinicalPath', name: 'Clinical Pathology · Urine & Stool', no: '217', rect: [BB[6], BB[8], ZB, Z2A], fit: 'clinical_path', kind: 'room', floor: 'lab', tiled: true, doors: [{ side: '+z', at: 6.3, w: 1.0 }] },
  { id: 'microbiology', name: 'Microbiology Laboratory', no: '218', rect: [BB[8], BB[10], ZB, Z2A], fit: 'microbiology', kind: 'room', floor: 'lab', doors: [{ side: '+z', at: 9.4, w: 1.0 }] },
  { id: 'serology', name: 'Serology & Immunology', no: '219', rect: [BB[10], XN, ZB, Z2A], fit: 'serology', kind: 'room', floor: 'lab', doors: [{ side: '+z', at: 12.2, w: 1.0 }] },
]

/* ---------- the third floor: advanced imaging and cardiac diagnostics ---------- */

const third: RoomSpec[] = [
  ...common(3),
  // The back corridor is cut by the MRI suite's access door: past it lies MRI zone III.
  { id: 'corridorC1', name: 'Front Corridor', rect: [XB, XN, Z1A, Z1B], fit: 'corridor', kind: 'circulation', floor: 'corridor', quiet: true },
  { id: 'corridorC2', name: 'Back Corridor', rect: [XB, BB[2], Z2A, Z2B], fit: 'corridor', kind: 'circulation', floor: 'corridor', quiet: true },
  {
    id: 'mriZone', name: 'MRI Zone III', rect: [BB[2], XN, Z2A, Z2B], fit: 'mri_zone', kind: 'restricted', floor: 'corridor',
    doors: [{ side: '-x', at: (Z2A + Z2B) / 2, w: 1.5, kind: 'double' }, { side: '+z', at: (XN0 + XN1) / 2, w: 1.5, kind: 'double', internal: true }],
  },
  { id: 'corridorN', name: 'North Corridor', rect: [XN0, XN1, Z2B, Z1A], fit: 'corridor', kind: 'circulation', floor: 'corridor', quiet: true },
  ...hall(3, 'reception_3', 'Imaging & Cardiac Reception'),
  ...lounge(3, 'Imaging & Cardiac Waiting Lounge'),
  { id: 'ctPrep', name: 'CT Patient Preparation & Changing', no: '301', rect: [XL, XP0, Z1B, 3.7], fit: 'ct_prep', kind: 'room', floor: 'vinyl', doors: [{ side: '-z', at: -0.4, w: 1.2 }] },
  { id: 'passage', name: 'Passage', rect: [XP0, XP1, Z1B, ZF], fit: 'corridor', kind: 'circulation', floor: 'corridor', quiet: true },
  { id: 'reporting', name: 'Imaging Reporting & Radiologists', no: '302', rect: [XP1, XN0, Z1B, ZF], fit: 'reporting', kind: 'room', floor: 'vinyl', light: 'dim', doors: [{ side: '-z', at: 6.9, w: 1.0 }] },
  { id: 'staff', name: 'Imaging Staff Room', no: '303', rect: [XN0, XN1, Z1B, ZF], fit: 'staff_room', kind: 'room', floor: 'vinyl', doors: [{ side: '-z', at: 8.9, w: 0.9 }] },
  { id: 'echo', name: '2D Echo Room', no: '304', rect: [XN1, XN, 0.3, ZF], fit: 'echo', kind: 'room', floor: 'vinyl', light: 'dim', doors: [{ side: '+z', at: 10.7, w: 1.0 }] },
  { id: 'ecg', name: 'ECG Room', no: '305', rect: [XN1, XN, Z1B, 0.3], fit: 'ecg', kind: 'room', floor: 'vinyl', doors: [{ side: '-z', at: 11.0, w: 1.0 }] },
  { id: 'cardiacChanging', name: 'Cardiac Patient Changing', no: '306', rect: [11.3, XN, ZF, 10.7], fit: 'cardiac_changing', kind: 'room', floor: 'vinyl', doors: [{ side: '-x', at: 5.0, w: 0.9 }] },
  {
    id: 'ctControl', name: 'CT Control Room', no: '307', rect: [XS, XA, BAY[6], BAY[7]], fit: 'ct_control', kind: 'room', floor: 'vinyl',
    doors: [{ side: '+x', at: -4.4, w: 0.9 }, { side: '-z', at: -8.0, w: 0.9, kind: 'lead', internal: true }],
    glazing: [{ side: '-z', from: -10.9, to: -9.0, sill: 0.9, head: 2.0, kind: 'lead' }],
  },
  { id: 'ct', name: 'CT Scan Room', no: '308', rect: [XS, XA, BAY[4], BAY[6]], fit: 'ct', kind: 'room', floor: 'conductive', doors: [{ side: '+x', at: -8.1, w: 1.5, kind: 'lead' }] },
  { id: 'equipment', name: 'Equipment Store', no: '309', rect: [XN1, XN, NB[0], NB[1]], fit: 'equipment_store', kind: 'service', floor: 'service', light: 'service', doors: [{ side: '-x', at: -15.2, w: 1.2, kind: 'double' }] },
  { id: 'tmt', name: 'Stress Test (TMT) Room', no: '310', rect: [XN1, XN, NB[1], NB[2]], fit: 'tmt', kind: 'room', floor: 'vinyl', doors: [{ side: '-x', at: -10.6, w: 1.2 }] },
  { id: 'cardiacConsult', name: 'Cardiac Diagnostic Consultation', no: '311', rect: [XN1, XN, NB[2], NB[3]], fit: 'cardiac_consult', kind: 'room', floor: 'vinyl', doors: [{ side: '-x', at: -6.6, w: 1.0 }] },
  {
    id: 'mriScreening', name: 'MRI Safety Screening & Changing', no: '312', rect: [BB[0], BB[2], ZB, Z2A], fit: 'mri_screening', kind: 'room', floor: 'vinyl',
    doors: [{ side: '+z', at: -3.4, w: 1.0 }],
  },
  { id: 'mriTech', name: 'MRI Technical Room', no: '313', rect: [BB[2], BB[4], ZB, Z2A], fit: 'mri_tech', kind: 'service', floor: 'service', light: 'service', doors: [{ side: '+z', at: 0.0, w: 1.0 }] },
  { id: 'mri', name: 'MRI Scan Room', no: '314', rect: [BB[4], BB[9], ZB, Z2A], fit: 'mri', kind: 'room', floor: 'conductive', doors: [{ side: '+z', at: 8.3, w: 1.2, kind: 'mri' }] },
  {
    id: 'mriControl', name: 'MRI Control Room', no: '315', rect: [BB[9], XN, ZB, Z2A], fit: 'mri_control', kind: 'room', floor: 'vinyl',
    doors: [{ side: '+z', at: 11.6, w: 0.9 }],
    glazing: [{ side: '-x', from: -24.9, to: -22.0, sill: 0.9, head: 2.0, kind: 'rf' }],
  },
]

/* ---------- the floors ---------- */

/** Lines the building already closes, floor by floor: its façades' inner faces, the neighbours' walls. */
function facades(level: number): FloorPlan['facade'] {
  const f: FloorPlan['facade'] = [
    { axis: 'x', c: XS, from: ZB, to: ZT },
    { axis: 'z', c: ZB, from: XS, to: XN },
    { axis: 'z', c: ZT, from: XS, to: -2.7 },
    { axis: 'x', c: -2.7, from: ZK, to: ZT },
  ]
  if (level === 0) {
    // The emergency department's wall, and the main lobby's side wall.
    f.push({ axis: 'x', c: XG, from: ZB, to: ZF }, { axis: 'x', c: 2.0, from: 5.0, to: 12.85 })
    f.push({ axis: 'z', c: ZK, from: -2.7, to: 0.9 }, { axis: 'x', c: 0.9, from: ZK, to: 12.85 }, { axis: 'z', c: 12.85, from: 0.9, to: 2.0 })
    f.push({ axis: 'x', c: 2.0, from: 4.6, to: 5.0 })
  } else {
    f.push({ axis: 'x', c: XN, from: ZB, to: 10.7 }, { axis: 'z', c: 10.7, from: 11.3, to: XN }, { axis: 'x', c: 11.3, from: 10.7, to: 13.0 })
    f.push({ axis: 'z', c: 13.0, from: 0.9, to: 2.0 }, { axis: 'z', c: 13.0, from: 10.2, to: 11.3 })
    if (level === 1) f.push({ axis: 'z', c: 13.0, from: 2.0, to: 10.2 })
    else f.push({ axis: 'z', c: 14.2, from: 2.0, to: 10.2 }, { axis: 'x', c: 2.0, from: 13.0, to: 14.2 }, { axis: 'x', c: 10.2, from: 13.0, to: 14.2 })
    if (level < 3) f.push({ axis: 'z', c: ZK, from: -2.7, to: 0.9 }, { axis: 'x', c: 0.9, from: ZK, to: 13.0 })
    else f.push({ axis: 'z', c: 3.7, from: -2.7, to: 0.9 }, { axis: 'x', c: -2.7, from: 3.7, to: ZT }, { axis: 'x', c: 0.9, from: 3.7, to: 13.0 })
    // The light court, open from the second floor.
    if (level >= 2)
      f.push(
        { axis: 'x', c: XB, from: Z2B, to: Z1A },
        { axis: 'x', c: XN0, from: Z2B, to: Z1A },
        { axis: 'z', c: Z1A, from: XB, to: XN0 },
        { axis: 'z', c: Z2B, from: XB, to: XN0 },
      )
  }
  return f
}

/** The slab of an upper floor: the body, the tower's front, the main block, the link (below the third). */
function plate(level: number): [number, number][] {
  const link = level < 3
  return [
    [-11.8, -26], [13.9, -26], [13.9, 11], [11.6, 11], [11.6, 15], [0.6, 15],
    ...(link ? [[0.6, 9], [-2.4, 9]] as [number, number][] : [[0.6, 4], [-2.4, 4]] as [number, number][]),
    [-2.4, 12], [-11.8, 12],
  ]
}

export const FLOORS: FloorPlan[] = [
  { level: 0, y: LEVELS[0], label: 'G', title: 'Ground Floor · Entry, Reception & Pharmacy', rooms: ground, facade: facades(0), plate: [] },
  { level: 1, y: LEVELS[1], label: '1', title: 'First Floor · Consultations', rooms: first, facade: facades(1), plate: plate(1) },
  { level: 2, y: LEVELS[2], label: '2', title: 'Second Floor · Laboratory & Diagnostics', rooms: second, facade: facades(2), plate: plate(2) },
  { level: 3, y: LEVELS[3], label: '3', title: 'Third Floor · Imaging & Cardiac Diagnostics', rooms: third, facade: facades(3), plate: plate(3) },
]

/** A room's hotspot (and light zone) name. */
export const roomMesh = (level: number, id: string) => `room_opd_${level === 0 ? 'g' : level}_${id}`
/** The light zone of a floor's corridors, halls and core. */
export const circulationZone = (level: number) => `opd_${level === 0 ? 'g' : level}_circulation`

/** Whether a plan point is inside the OPD on a floor (for the façade: what stands behind its glass). */
export function insideOpd(level: number, x: number, z: number) {
  const fl = FLOORS[level]
  if (!fl) return false
  return fl.rooms.some((r) => x > r.rect[0] - 0.35 && x < r.rect[1] + 0.35 && z > r.rect[2] - 0.35 && z < r.rect[3] + 0.35)
}

/** The OPD floor whose storey a height lies in, or −1. */
export function levelAt(y: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) if (y >= LEVELS[i] - 0.4) return i
  return -1
}
