import { GL, L1, UPPER } from '../plan'

/*
 * The hospital's interior, floor by floor: two departments under one roof, planned on the same
 * lines so that structure, cores, risers and wet rooms stand one over another.
 *
 *   OPD block   the south tower and the band behind it on all four floors: the OPD stair and its
 *               two stretcher lifts behind the outpatient entrance, the south corridor, the rooms
 *               on the south façade's punched windows, the toilets and the fire stair at the back.
 *   Main block  everything north of the south corridor, round the light court: on the ground the
 *               main reception in the main lobby, admissions, the patient services hall with its
 *               insurance, billing and cash counters, the pharmacy and medical records (the
 *               emergency department keeps the ground floor's north strip); on the first floor
 *               the inpatient rooms; on the second the international patient wing and the ICU;
 *               on the third the operation theatre complex. Its own core: three lifts from B2 to
 *               the third floor (two bed lifts and a staff lift) in the middle of the building,
 *               and the main stair at the back.
 *
 *   corridors   S along the south side (OPD); C1 across the front of the light court, C2 across
 *               its back and, above the ground, N down its north side (Main block): a ring round
 *               the court, glazed onto it where the court is open (2nd and 3rd).
 *   bands       rooms 4.2 m deep on the south façade in 3.17 m bays; 5.1 m deep across the back
 *               and 3.5 m deep down the north side; behind the main block's curtain wall the
 *               old lounge zone, 9 m deep.
 *
 * Plan frame as in ../plan.ts (+x north, +z east towards the road). Rooms are rectangles on their
 * walls' centre lines; at the façade they stop at its inner face, where no wall is built. Walls,
 * floors, ceilings, skirtings, lights and the room hotspots are made from these (see shell.ts);
 * what stands in each room is the business of its fitter (see rooms/ and ../main/).
 */

export type Dir = '+x' | '-x' | '+z' | '-z'

/** A door in a room's side: its centre along the side, clear width, and how it is built. */
export interface DoorSpec {
  side: Dir
  at: number
  w?: number
  /**
   * single (default), double leaves, a lead-lined X-ray / CT door, an RF-shielded MRI door, a fully
   * glazed door, a fire door, or an operation theatre's hermetically sealed automatic sliding door.
   */
  kind?: 'single' | 'double' | 'lead' | 'mri' | 'glass' | 'fire' | 'hermetic'
  /**
   * Which jamb the hinges are on, seen from inside the room looking out: −1 the left, 1 the right.
   * For a hermetic sliding door, which way its leaf runs open along the wall (the door's own x).
   */
  hinge?: -1 | 1
  /** A door that leads from this room into the next one (connecting): no plate, no switch by it. */
  internal?: boolean
  /** Swings out of the room (stairs, small stores, washrooms) rather than in. */
  out?: boolean
  /** A sliding door whose leaf runs on the room's side of the wall rather than outside it. */
  inside?: boolean
}

/** A window in an internal wall (observation, a counter's screen): along the side from … to, sill … head above the floor. */
export interface Glazing {
  side: Dir
  from: number
  to: number
  sill: number
  head: number
  /**
   * Open (a counter's hatch, no glass), lead glass (X-ray / CT control), RF mesh glass (MRI),
   * frosted, or a teller's screen (a cash counter's full-height security glass with a speech
   * grille and a deal tray under it).
   */
  kind?: 'clear' | 'hatch' | 'lead' | 'rf' | 'frosted' | 'teller'
}

export type FloorFinish = 'vinyl' | 'corridor' | 'vitrified' | 'tile' | 'lab' | 'conductive' | 'service' | 'wood' | 'none'
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
  /** The department: the outpatient block (default) or the main block. Names its hotspot. */
  dept?: 'opd' | 'main'
  /**
   * Part of another room (its id): an en-suite washroom, the entry nook beside it. It has no
   * hotspot of its own and is lit, and walked, as that room.
   */
  part?: string
  doors?: DoorSpec[]
  /** Sides with no wall at all (an alcove open to the corridor, a counter's open front). */
  open?: Dir[]
  /** Partial openings along a side, from … to. */
  gaps?: { side: Dir; from: number; to: number }[]
  /** Sides walled even where they meet circulation or a public space (a department's boundary). */
  closed?: Dir[]
  glazing?: Glazing[]
  floor?: FloorFinish
  ceiling?: CeilingFinish
  /** Clear height to the ceiling when it isn't the floor's usual 3.0 m (the main lobby's 4.1 m). */
  height?: number
  /** Sides built as the core's 200 mm reinforced concrete rather than 120 mm blockwork. */
  thick?: Dir[]
  /** Wall tiles to 2.1 m on its side of its walls (toilets, sluices, dirty work). */
  tiled?: boolean
  /** No hotspot (corridors, risers, the core): lit as the floor's circulation. */
  quiet?: boolean
  /** Lighting: clinical panels (default), dimmable reading-room light, or the lounge's downlights. */
  light?: 'clinical' | 'dim' | 'lounge' | 'service'
  /** A shaft or stair well: no floor of its own (above the ground for stairs). */
  well?: 'lift' | 'stair'
  /**
   * An operating theatre: its sealed ceiling keeps the middle clear for the laminar-flow plenum
   * over the table (the light panels stand round it) and takes no ceiling diffuser of its own.
   */
  theatre?: boolean
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

/** Floor levels of the four floors. */
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
/** The emergency department's inner wall: the main block's north side on the ground floor. */
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

/** The main block's lift bank (its lobby face, its back) and the passage up its north side. */
const ZL = -1.05
const ZLB = 2.1
const XM = 3.7

export const LINES = { XS, XA, XB, XBB, XL, XP0, XP1, XN0, XN1, XN, XG, ZB, Z2A, Z2B, Z1A, Z1B, ZF, ZT, ZK, BAY, ZL, ZLB, XM }

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

/**
 * The main block's lifts, B2 to the third floor, side by side behind the lift lobby with their
 * doors facing −z: two bed lifts, 1.6 × 2.7 m cars (a hospital bed or a stretcher with its
 * attendants), and the staff lift, 1.3 × 2.0 m. The cars' centres put the landing doors on the
 * lobby face of the bank's 200 mm front wall (on the line z = ZL).
 */
export const MAIN_LIFTS = {
  x0: XL, x1: XM, z0: ZL, z1: ZLB,
  cars: [
    { x: -1.0, z: ZL - 0.1 + 1.35 + 0.24, w: 1.6, d: 2.7, name: 'PATIENT LIFT 1', plate: ['20 PERSONS', '1360 KG · BED'] as [string, string] },
    { x: 1.0, z: ZL - 0.1 + 1.35 + 0.24, w: 1.6, d: 2.7, name: 'PATIENT LIFT 2', plate: ['20 PERSONS', '1360 KG · BED'] as [string, string] },
    { x: 2.85, z: ZL - 0.1 + 1.0 + 0.24, w: 1.3, d: 2.0, name: 'STAFF LIFT', plate: ['10 PERSONS', '680 KG · STAFF'] as [string, string], staff: true },
  ],
}

/** The main stair at the back of the main block, the ground to the third floor; flights along x. */
export const MAIN_STAIR = { x0: XBB, x1: 1.8, z0: ZB, z1: Z2A, door: 1.1 }

/* ---------- rooms every floor has, one over another ---------- */

function common(level: number): RoomSpec[] {
  const n = (i: number) => `${level === 0 ? 'G' : level}${String(i).padStart(2, '0')}`
  const rooms: RoomSpec[] = [
    { id: 'stair', name: 'OPD Stair', rect: [STAIR.x0, STAIR.x1, STAIR.z0, STAIR.z1], fit: 'stair', kind: 'core', thick: ['+x', '-z', '+z'], quiet: true, floor: 'service', ceiling: 'open', well: 'stair', doors: [{ side: '+x', at: 3.2, w: 1.1, kind: 'fire', hinge: -1 }] },
    { id: 'lifts', name: 'Lifts', rect: [LIFTS.x0, LIFTS.x1, LIFTS.z0, LIFTS.z1], fit: 'lifts', kind: 'core', thick: ['+x', '-z', '+z', '-x'], quiet: true, ceiling: 'open', well: 'lift' },
    { id: 'riser', name: 'Electrical & IT Riser', no: n(90), rect: [XS, XA, BAY[7], STAIR.z0], fit: 'riser', kind: 'service', quiet: true, floor: 'service', ceiling: 'open', light: 'service', doors: [{ side: '+x', at: -3.07, w: 0.9, out: true }] },
    { id: 'firestair', name: 'Fire Stair', rect: [FIRE_STAIR.x0, FIRE_STAIR.x1, FIRE_STAIR.z0, FIRE_STAIR.z1], fit: 'firestair', kind: 'core', thick: ['+x', '+z'], quiet: true, floor: 'service', ceiling: 'open', well: 'stair', doors: [{ side: '+x', at: -20.4, w: 1.1, kind: 'fire', hinge: 1 }] },
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

/** The entrance hall in the tower's front, and below the third floor the glazed link beside it. */
function hall(level: number, fit: string, name: string): RoomSpec[] {
  const out: RoomSpec[] = [{ id: 'hall', name, rect: [XS, -2.7, ZF, ZT], fit, kind: 'public', floor: 'vitrified', ceiling: 'board', light: 'lounge' }]
  if (level < 3) out.push({ id: 'link', name: 'Glazed Link', rect: [-2.7, 0.9, ZF, ZK], fit: 'link', kind: 'public', floor: 'vitrified', ceiling: 'board', light: 'lounge', quiet: true })
  return out
}

/* ---------- the main block's core, on every floor ---------- */

const M = (r: RoomSpec): RoomSpec => ({ ...r, dept: 'main' })

/** The lift bank, the lift lobby in front of it and the passage up its north side; the main stair. */
function mainCore(passageTo = ZF): RoomSpec[] {
  return [
    M({ id: 'mainLifts', name: 'Main Lifts', rect: [XL, XM, ZL, ZLB], fit: 'main_lifts', kind: 'core', thick: ['-x', '+x', '-z', '+z'], quiet: true, ceiling: 'open', well: 'lift' }),
    M({ id: 'liftLobby', name: 'Main Lift Lobby', rect: [XL, XG, Z1B, ZL], fit: 'main_lift_lobby', kind: 'circulation', floor: 'corridor', quiet: true }),
    M({ id: 'passage', name: 'Passage', rect: [XM, XG, ZL, passageTo], fit: 'corridor', kind: 'circulation', floor: 'corridor', quiet: true }),
    M({
      id: 'mainStair', name: 'Main Stair', rect: [MAIN_STAIR.x0, MAIN_STAIR.x1, MAIN_STAIR.z0, MAIN_STAIR.z1], fit: 'main_stair', kind: 'core', thick: ['-x', '+x', '+z'], quiet: true,
      floor: 'service', ceiling: 'open', well: 'stair', doors: [{ side: '+z', at: MAIN_STAIR.door, w: 1.1, kind: 'fire', hinge: 1 }],
    }),
  ]
}

/**
 * A room with its washroom en suite: the washroom (`e`: its width along x, its depth along z, the
 * corner it stands in) and the room round it, built as two or three rectangles: the room's main
 * part across its whole width, and the nook beside the washroom (where its door usually is), open
 * to each other. The room's door goes in `door`, which lies on the nook's side; the washroom's
 * door opens out of it onto the nook or the room (`eDoor`).
 */
function enSuite(o: {
  room: RoomSpec
  e: { w: number; d: number; corner: 'x0z0' | 'x0z1' | 'x1z0' | 'x1z1' }
  /** The washroom's door: the side of the washroom it is in, and where along it. */
  eDoor: { side: Dir; at: number; w?: number }
  /** The room's own doors, on the nook (default) or on the room's main part. */
  doors: DoorSpec[]
  doorsOnMain?: boolean
  premium?: boolean
}): RoomSpec[] {
  const r = o.room
  const [x0, x1, z0, z1] = r.rect
  const lowX = o.e.corner.startsWith('x0')
  const lowZ = o.e.corner.endsWith('z0')
  const ex: [number, number] = lowX ? [x0, x0 + o.e.w] : [x1 - o.e.w, x1]
  const ez: [number, number] = lowZ ? [z0, z0 + o.e.d] : [z1 - o.e.d, z1]
  // The cut runs across the room at the washroom's inner edge in z.
  const cut = lowZ ? ez[1] : ez[0]
  const main: RoomSpec = { ...r, rect: lowZ ? [x0, x1, cut, z1] : [x0, x1, z0, cut], doors: o.doorsOnMain ? o.doors : [] }
  const nook: RoomSpec = {
    ...r, id: `${r.id}Entry`, name: r.name, no: undefined, part: r.id, fit: '', quiet: false,
    rect: lowX ? [ex[1], x1, ez[0], ez[1]] : [x0, ex[0], ez[0], ez[1]],
    doors: o.doorsOnMain ? [] : o.doors,
    open: [lowZ ? '+z' : '-z'],
  }
  const span: [number, number] = lowX ? [ex[1], x1] : [x0, ex[0]]
  main.gaps = [...(r.gaps ?? []), { side: lowZ ? '-z' : '+z', from: span[0], to: span[1] }]
  const wash: RoomSpec = {
    id: `${r.id}Wash`, name: `${r.name} · Washroom`, rect: [ex[0], ex[1], ez[0], ez[1]], fit: o.premium ? 'ensuite_premium' : 'ensuite', kind: 'wet', dept: r.dept, part: r.id,
    tiled: true, floor: 'tile', ceiling: 'wet', light: 'clinical',
    doors: [{ side: o.eDoor.side, at: o.eDoor.at, w: o.eDoor.w ?? 0.8, internal: true, out: true }],
  }
  return [main, nook, wash]
}

/* ---------- the ground floor ---------- */

const ground: RoomSpec[] = [
  // The OPD: the outpatient hall and its core, the south corridor and the south band.
  ...common(0),
  ...hall(0, 'hall_g', 'Outpatient Hall & OPD Reception'),
  { id: 'security', name: 'Security & CCTV Control', no: 'G01', rect: [XS, XA, BAY[6], BAY[7]], fit: 'security', kind: 'room', floor: 'vinyl', doors: [{ side: '+x', at: -4.5, w: 0.9 }] },
  { id: 'insurance', name: 'OPD Insurance & TPA Desk', no: 'G02', rect: [XS, XA, BAY[5], BAY[6]], fit: 'insurance', kind: 'room', floor: 'vinyl', doors: [{ side: '+x', at: -7.7, w: 0.9 }] },
  { id: 'vaccination', name: 'Vaccination Room', no: 'G03', rect: [XS, XA, BAY[4], BAY[5]], fit: 'vaccination', kind: 'room', floor: 'vinyl', doors: [{ side: '+x', at: -10.85, w: 1.0 }] },

  // The main block: its core, the corridors round the court.
  ...mainCore(ZLB),
  M({ id: 'corridorC1', name: 'Front Corridor', rect: [XB, XG, Z1A, Z1B], fit: 'corridor', kind: 'circulation', floor: 'corridor', quiet: true }),
  M({ id: 'corridorC2', name: 'Back Corridor', rect: [XB, XG, Z2A, Z2B], fit: 'corridor', kind: 'circulation', floor: 'corridor', quiet: true }),
  // The main lobby behind the main entrance (its floor, glass and core are the building's), the
  // wheelchair bay beside it, the help desk behind the lifts, and admissions in the north wing.
  M({
    id: 'mainLobby', name: 'Main Lobby & Reception', no: 'G10', rect: [2.0, 10.2, ZK, 12.85], fit: 'main_lobby', kind: 'public', floor: 'none', ceiling: 'board', light: 'lounge', height: 4.13,
  }),
  M({ id: 'wheelchairs', name: 'Wheelchair & Stretcher Bay', rect: [0.9, 2.0, ZF, 12.85], fit: 'wheelchairs', kind: 'public', floor: 'vitrified', ceiling: 'board', quiet: true, open: ['-z'] }),
  M({ id: 'helpDesk', name: 'Patient Help Desk & Waiting', no: 'G11', rect: [XL, XG, ZLB, ZF], fit: 'main_help', kind: 'public', floor: 'vitrified', ceiling: 'board', light: 'lounge' }),
  M({
    id: 'admission', name: 'Admission Desk', no: 'G12', rect: [10.2, XN, 4.97, 10.7], fit: 'main_admission', kind: 'room', floor: 'vinyl',
    doors: [{ side: '-x', at: 9.9, w: 1.2, kind: 'glass' }],
  }),
  // The patient services hall south of the front corridor: insurance and billing down one side,
  // the cash counter down the other, the pharmacy's dispensing window across its end (the
  // hospital's one pharmacy: its reserve stock is racked inside it).
  M({ id: 'services', name: 'Patient Services Hall', no: 'G13', rect: [-2.2, 2.9, -14.4, Z1A], fit: 'main_services', kind: 'public', floor: 'vitrified', ceiling: 'board', light: 'lounge' }),
  M({
    id: 'ipdInsurance', name: 'Insurance & Cashless Desk', no: 'G14', rect: [XB, -2.2, -10.0, Z1A], fit: 'main_insurance', kind: 'room', floor: 'vinyl',
    doors: [{ side: '+z', at: -3.5, w: 0.9 }],
    glazing: [{ side: '+x', from: -9.6, to: -6.2, sill: 0.95, head: 2.2, kind: 'hatch' }],
  }),
  M({
    id: 'ipdBilling', name: 'Billing Desk', no: 'G15', rect: [XB, -2.2, -14.4, -10.0], fit: 'main_billing', kind: 'room', floor: 'vinyl',
    doors: [{ side: '+z', at: -3.6, w: 0.9, internal: true }],
    glazing: [{ side: '+x', from: -14.0, to: -10.4, sill: 0.95, head: 2.2, kind: 'hatch' }],
  }),
  M({
    id: 'cash', name: 'Cash Counter', no: 'G16', rect: [2.9, XG, -10.0, Z1A], fit: 'main_cash', kind: 'room', floor: 'vinyl',
    doors: [{ side: '+z', at: 4.6, w: 0.9 }],
    glazing: [{ side: '-x', from: -9.5, to: -6.6, sill: 0.9, head: 2.15, kind: 'teller' }],
  }),
  // Beside the cash counter, off the services hall: the admitting doctor's consultation room.
  M({ id: 'consultG', name: 'Admission Consultation Room', no: 'G17', rect: [2.9, XG, -14.4, -10.0], fit: 'main_consult', kind: 'room', floor: 'vinyl', doors: [{ side: '-x', at: -13.6, w: 1.0, hinge: -1 }] }),
  M({
    id: 'pharmacy', name: 'Pharmacy', no: 'G18', rect: [-2.2, XG, Z2B, -14.4], fit: 'main_pharmacy', kind: 'room', floor: 'vinyl',
    doors: [{ side: '-z', at: 3.9, w: 1.0 }],
    glazing: [{ side: '+z', from: -1.8, to: 2.5, sill: 1.0, head: 2.3, kind: 'hatch' }],
  }),
  M({ id: 'records', name: 'Medical Records', no: 'G19', rect: [XB, -2.2, Z2B, -14.4], fit: 'main_records', kind: 'room', floor: 'vinyl', doors: [{ side: '-z', at: -3.5, w: 0.9 }] }),
  M({ id: 'adminOffice', name: 'Hospital Administration', no: 'G20', rect: [1.8, XG, ZB, Z2A], fit: 'main_admin', kind: 'room', floor: 'vinyl', doors: [{ side: '+z', at: 4.4, w: 0.9 }] }),
]

/* ---------- the first floor: inpatient rooms ---------- */

/** The corridors round the court, to the north façade. */
function ring(over: Partial<Record<'C1' | 'C2' | 'N', Partial<RoomSpec>>> = {}): RoomSpec[] {
  return [
    M({ id: 'corridorC1', name: 'Front Corridor', rect: [XB, XN, Z1A, Z1B], fit: 'corridor', kind: 'circulation', floor: 'corridor', quiet: true, ...over.C1 }),
    M({ id: 'corridorC2', name: 'Back Corridor', rect: [XB, XN, Z2A, Z2B], fit: 'corridor', kind: 'circulation', floor: 'corridor', quiet: true, ...over.C2 }),
    M({ id: 'corridorN', name: 'North Corridor', rect: [XN0, XN1, Z2B, Z1A], fit: 'corridor', kind: 'circulation', floor: 'corridor', quiet: true, ...over.N }),
  ]
}

const ward = (id: string, name: string, no: string, rect: RoomSpec['rect'], fit: string): RoomSpec => M({ id, name, no, rect, fit, kind: 'room', floor: 'vinyl' })

const first: RoomSpec[] = [
  ...common(1),
  ...hall(1, 'reception_1', 'OPD Consultation Reception & Waiting'),
  { id: 'medicine', name: 'General Medicine', no: '101', rect: [XS, XA, BAY[6], BAY[7]], fit: 'consult_medicine', kind: 'room', floor: 'vinyl', doors: [{ side: '+x', at: -4.5 }] },
  { id: 'cardiology', name: 'Cardiology', no: '102', rect: [XS, XA, BAY[5], BAY[6]], fit: 'consult_cardiology', kind: 'room', floor: 'vinyl', doors: [{ side: '+x', at: -7.7 }] },
  { id: 'neurology', name: 'Neurology', no: '103', rect: [XS, XA, BAY[4], BAY[5]], fit: 'consult_neurology', kind: 'room', floor: 'vinyl', doors: [{ side: '+x', at: -10.85 }] },

  ...mainCore(),
  ...ring(),
  // The nurses' station faces the lift lobby and the front corridor; the ward's consultation room
  // behind it opens off the relatives' lounge.
  M({
    id: 'nurses', name: 'Nurses\' Station', no: '120', rect: [XG, XN1, Z1B, 1.0], fit: 'ward_nurses', kind: 'room', floor: 'vinyl', open: ['-z'],
    gaps: [{ side: '-x', from: Z1B, to: ZL }],
  }),
  M({ id: 'consult1', name: 'Doctor\'s Consultation Room', no: '121', rect: [XG, XN1, 1.0, ZF], fit: 'ward_consult', kind: 'room', floor: 'vinyl', doors: [{ side: '+z', at: 9.35, w: 1.0, hinge: 1 }] }),
  // Behind the lifts: the visitors' toilets, off the relatives' lounge (wet rooms stacked over
  // the floors' below and under the second floor's).
  M({ id: 'visitorWc', name: 'Visitors\' Accessible Toilet', no: '122', rect: [XL, 0.85, ZLB, ZF], fit: 'ward_visitor_wc', kind: 'wet', tiled: true, floor: 'tile', ceiling: 'wet', doors: [{ side: '+z', at: -0.6, w: 0.9, out: true }] }),
  M({ id: 'visitorToilet', name: 'Visitors\' Toilet', no: '123', rect: [0.85, XM, ZLB, ZF], fit: 'ward_visitor_toilet', kind: 'wet', tiled: true, floor: 'tile', ceiling: 'wet', doors: [{ side: '+z', at: 2.9, w: 0.9, out: true }] }),
  // Behind the curtain wall: the relatives' lounge and two single rooms on the glass; the deluxe
  // room 106 takes the bay behind the west pier too, with its window on the west façade.
  M({ id: 'lounge', name: 'Relatives\' Waiting Lounge', no: '124', rect: [0.9, 11.3, ZF, 8.2], fit: 'ward_lounge', kind: 'public', floor: 'vitrified', ceiling: 'board', light: 'lounge' }),
  M({ id: 'housekeeping', name: 'Housekeeping', no: '126', rect: [10.2, 11.3, 8.2, 13.0], fit: 'ward_housekeeping', kind: 'service', floor: 'service', light: 'service', doors: [{ side: '-z', at: 10.75, w: 0.8, out: true }] }),
  ...enSuite({ room: ward('r106', 'Single Room (AC) · Deluxe', '106', [0.9, 6.1, 8.2, 13.0], 'ward_single_ac'), e: { w: 2.2, d: 2.0, corner: 'x0z0' }, eDoor: { side: '+x', at: 9.2 }, doors: [{ side: '-z', at: 4.35, w: 1.2, hinge: -1 }] }),
  ...enSuite({ room: ward('r107', 'Single Room (AC) · Deluxe', '107', [6.1, 10.2, 8.2, 13.0], 'ward_single_ac'), e: { w: 1.8, d: 2.0, corner: 'x1z0' }, eDoor: { side: '+z', at: 9.3 }, doors: [{ side: '-z', at: 7.0, w: 1.2, hinge: -1 }] }),
  // The double room at the front of the north side.
  ...enSuite({ room: ward('r105', 'Double Room (AC)', '105', [XN1, XN, Z1B, ZF], 'ward_double_ac'), e: { w: 1.8, d: 2.2, corner: 'x0z0' }, eDoor: { side: '+z', at: 10.96 }, doors: [{ side: '-z', at: 12.75, w: 1.2, hinge: -1 }] }),
  // Single rooms down the north side, off the north corridor.
  ...enSuite({ room: ward('r103', 'Single Room (Non-AC)', '103', [XN1, XN, Z2B, -12.0], 'ward_single_nonac'), e: { w: 1.8, d: 2.2, corner: 'x0z0' }, eDoor: { side: '+x', at: -17.1 }, doors: [{ side: '-x', at: -15.25, w: 1.2, hinge: 1 }], doorsOnMain: true }),
  ...enSuite({ room: ward('r104', 'Single Room (AC)', '104', [XN1, XN, -12.0, Z1A], 'ward_single_ac'), e: { w: 1.8, d: 2.2, corner: 'x0z1' }, eDoor: { side: '+x', at: -6.9 }, doors: [{ side: '-x', at: -8.75, w: 1.2, hinge: -1 }], doorsOnMain: true }),
  // Double rooms across the back, off the back corridor, the two beds side by side.
  ...enSuite({ room: ward('r101', 'Double Room (AC)', '101', [1.8, 7.7, ZB, Z2A], 'ward_double_ac'), e: { w: 1.8, d: 2.2, corner: 'x1z1' }, eDoor: { side: '-z', at: 6.8 }, doors: [{ side: '+z', at: 4.6, w: 1.2, hinge: 1 }] }),
  ...enSuite({ room: ward('r102', 'Double Room (Non-AC)', '102', [7.7, XN, ZB, Z2A], 'ward_double_nonac'), e: { w: 1.8, d: 2.2, corner: 'x1z1' }, eDoor: { side: '-z', at: 12.7 }, doors: [{ side: '+z', at: 10.5, w: 1.2, hinge: 1 }] }),
  // The rooms under the podium garden, round the court: no windows. The high dependency unit
  // faces the nurses' station across the front corridor; the ward's support behind it.
  M({ id: 'exam', name: 'Examination & Procedure Room', no: '127', rect: [XB, -0.6, -12.0, Z1A], fit: 'ward_exam', kind: 'room', floor: 'vinyl', doors: [{ side: '+z', at: -2.7, w: 1.2 }] }),
  M({ id: 'hdu', name: 'High Dependency Unit (HDU) · 3 Beds', no: '128', rect: [-0.6, XN0, -12.0, Z1A], fit: 'ward_hdu', kind: 'room', floor: 'vinyl', doors: [{ side: '+z', at: 6.6, w: 1.5, kind: 'double' }] }),
  M({ id: 'staffWc', name: 'Staff Washroom & Change', no: '130', rect: [XB, -0.6, Z2B, -12.0], fit: 'ward_staff_wc', kind: 'wet', tiled: true, floor: 'tile', ceiling: 'wet', doors: [{ side: '-z', at: -2.7, w: 0.9 }] }),
  M({ id: 'dirty', name: 'Dirty Utility & Sluice', no: '131', rect: [-0.6, 3.6, Z2B, -12.0], fit: 'ward_dirty', kind: 'service', floor: 'service', tiled: true, light: 'service', doors: [{ side: '-z', at: 1.5, w: 1.0 }] }),
  M({ id: 'doctors', name: 'Duty Doctors\' Room', no: '132', rect: [3.6, XN0, Z2B, -12.0], fit: 'ward_doctors', kind: 'room', floor: 'vinyl', doors: [{ side: '-z', at: 5.7, w: 0.9 }] }),
]

/* ---------- the second floor: international patient wing and ICU ---------- */

const second: RoomSpec[] = [
  ...common(2),
  ...hall(2, 'reception_2', 'X-ray Registration & Waiting'),
  {
    id: 'xrayControl', name: 'X-ray Control & Image Review', no: '208', rect: [XS, XA, BAY[6], BAY[7]], fit: 'xray_control', kind: 'room', floor: 'vinyl',
    doors: [{ side: '+x', at: -4.4, w: 0.9 }, { side: '-z', at: -8.0, w: 0.9, kind: 'lead', internal: true }],
    glazing: [{ side: '-z', from: -10.6, to: -9.2, sill: 0.9, head: 2.0, kind: 'lead' }],
  },
  { id: 'xray', name: 'Digital X-ray Room', no: '209', rect: [XS, XA, BAY[4], BAY[6]], fit: 'xray', kind: 'room', floor: 'conductive', doors: [{ side: '+x', at: -8.1, w: 1.5, kind: 'lead' }] },

  ...mainCore(),
  // The ICU's corridors (past the restricted doors) and the front corridor outside it.
  ...ring({
    C2: { kind: 'restricted', rect: [1.8, XN, Z2A, Z2B], id: 'icuCorridorB', name: 'ICU Corridor', fit: 'icu_corridor', quiet: true, doors: [{ side: '-x', at: (Z2A + Z2B) / 2, w: 1.5, kind: 'double' }] },
    N: { kind: 'restricted', id: 'icuCorridorN', name: 'ICU Corridor', fit: 'icu_corridor', quiet: true, doors: [{ side: '+z', at: (XN0 + XN1) / 2, w: 1.6, kind: 'double' }] },
  }),
  M({ id: 'corridorC2', name: 'Back Corridor', rect: [XB, 1.8, Z2A, Z2B], fit: 'corridor', kind: 'circulation', floor: 'corridor', quiet: true }),
  // The ICU: two ventilator rooms across the back, the central nursing station in the corner,
  // the isolation room (with its anteroom), a cubicle and the equipment store down the north side.
  M({
    id: 'vent1', name: 'ICU Bed 1 · Ventilator Room', no: 'ICU-1', rect: [1.8, 5.93, ZB, Z2A], fit: 'icu_vent', kind: 'room', floor: 'vinyl',
    doors: [{ side: '+z', at: 4.6, w: 1.4, kind: 'glass' }], glazing: [{ side: '+z', from: 2.2, to: 3.75, sill: 0.9, head: 2.3 }],
  }),
  M({
    id: 'vent2', name: 'ICU Bed 2 · Ventilator Room', no: 'ICU-2', rect: [5.93, XN1, ZB, Z2A], fit: 'icu_vent', kind: 'room', floor: 'vinyl',
    doors: [{ side: '+z', at: 8.7, w: 1.4, kind: 'glass' }], glazing: [{ side: '+z', from: 6.3, to: 7.85, sill: 0.9, head: 2.3 }],
  }),
  M({ id: 'icuStation', name: 'ICU Central Nursing Station', no: 'ICU-S', rect: [XN1, XN, ZB, Z2A], fit: 'icu_station', kind: 'room', floor: 'vinyl', open: ['+z'] }),
  M({
    id: 'isolation', name: 'ICU Isolation Room', no: 'ICU-3', rect: [XN1, XN, Z2B, -13.8], fit: 'icu_isolation', kind: 'room', floor: 'vinyl',
    doors: [{ side: '+z', at: 11.9, w: 1.2, kind: 'glass', internal: true }],
  }),
  M({ id: 'ante', name: 'Isolation Anteroom', no: 'ICU-3A', rect: [XN1, XN, -13.8, -12.0], fit: 'icu_ante', kind: 'room', floor: 'vinyl', doors: [{ side: '-x', at: -12.9, w: 1.1 }] }),
  M({
    id: 'icu4', name: 'ICU Bed 4', no: 'ICU-4', rect: [XN1, XN, -12.0, -7.6], fit: 'icu_bed', kind: 'room', floor: 'vinyl',
    doors: [{ side: '-x', at: -9.6, w: 1.4, kind: 'glass' }], glazing: [{ side: '-x', from: -11.6, to: -10.45, sill: 0.9, head: 2.3 }],
  }),
  M({ id: 'icuStore', name: 'ICU Equipment Store', no: 'ICU-5', rect: [XN1, XN, -7.6, Z1A], fit: 'icu_store', kind: 'service', floor: 'vinyl', light: 'service', doors: [{ side: '-x', at: -6.7, w: 1.0, out: true }] }),
  // Outside the ICU's doors: the relatives' waiting and the counselling room.
  M({ id: 'icuWaiting', name: 'ICU Relatives\' Waiting', no: '221', rect: [XG, XN1, Z1B, 0.5], fit: 'icu_waiting', kind: 'public', floor: 'vitrified', ceiling: 'board', light: 'lounge' }),
  M({ id: 'counselling', name: 'Family Counselling Room', no: '222', rect: [XG, XN1, 0.5, ZF], fit: 'icu_counselling', kind: 'room', floor: 'wood', light: 'dim', doors: [{ side: '-z', at: 8.6, w: 0.9 }] }),
  // The international patient wing behind the curtain wall: its lounge and concierge, two
  // suites on the glass (each taking the bay behind its pier, their bed heads back to back on
  // the wall between them), the presidential suite in the north wing with its family room.
  // Behind the lifts, over the first floor's: the accessible toilet off the glazed link and a
  // toilet off the lounge, for patients' families and visitors.
  M({ id: 'intlWc', name: 'Accessible Toilet', no: '224', rect: [XL, 0.85, ZLB, ZF], fit: 'ward_visitor_wc', kind: 'wet', tiled: true, floor: 'tile', ceiling: 'wet', doors: [{ side: '+z', at: -0.6, w: 0.9, out: true }] }),
  M({ id: 'intlToilet', name: 'Lounge Toilet', no: '225', rect: [0.85, XM, ZLB, ZF], fit: 'ward_visitor_toilet', kind: 'wet', tiled: true, floor: 'tile', ceiling: 'wet', doors: [{ side: '+z', at: 2.9, w: 0.9, out: true }] }),
  M({
    id: 'intlLounge', name: 'International Patient Lounge & Concierge', no: '210', rect: [0.9, 11.3, ZF, 8.6], fit: 'intl_lounge', kind: 'public', floor: 'wood', ceiling: 'board', light: 'lounge',
    closed: ['-x'], doors: [{ side: '-x', at: 6.5, w: 1.2, kind: 'glass' }],
  }),
  ...enSuite({ room: M({ id: 'suite211', name: 'International Suite 211', no: '211', rect: [0.9, 6.1, 8.6, 14.2], fit: 'intl_suite', kind: 'room', floor: 'wood', ceiling: 'board', light: 'lounge' }), e: { w: 2.2, d: 2.3, corner: 'x0z0' }, eDoor: { side: '+x', at: 9.75 }, doors: [{ side: '-z', at: 5.3, w: 1.2, hinge: 1 }], premium: true }),
  ...enSuite({ room: M({ id: 'suite212', name: 'International Suite 212', no: '212', rect: [6.1, 11.3, 8.6, 14.2], fit: 'intl_suite', kind: 'room', floor: 'wood', ceiling: 'board', light: 'lounge' }), e: { w: 2.2, d: 2.3, corner: 'x1z0' }, eDoor: { side: '-x', at: 9.75 }, doors: [{ side: '-z', at: 8.1, w: 1.2, hinge: 1 }], premium: true }),
  M({
    id: 'familyRoom', name: 'Presidential Suite 213 · Family Room', rect: [11.3, XN, ZF, 10.7], fit: 'intl_family', kind: 'room', part: 'suite213', floor: 'wood', ceiling: 'board', light: 'lounge',
    doors: [{ side: '-x', at: 6.4, w: 1.2, hinge: 1 }, { side: '-z', at: 12.6, w: 1.0, internal: true }],
  }),
  ...enSuite({ room: M({ id: 'suite213', name: 'Presidential Suite 213', no: '213', rect: [XN1, XN, Z1B, ZF], fit: 'intl_suite', kind: 'room', floor: 'wood', ceiling: 'board', light: 'lounge' }), e: { w: 1.9, d: 2.3, corner: 'x0z0' }, eDoor: { side: '+x', at: -2.3 }, doors: [], doorsOnMain: true, premium: true }),
]

/* ---------- the third floor: the operation theatre complex ---------- */

const third: RoomSpec[] = [
  ...common(3),
  ...hall(3, 'reception_3', 'CT Scan Reception & Waiting'),
  {
    id: 'ctControl', name: 'CT Control Room', no: '307', rect: [XS, XA, BAY[6], BAY[7]], fit: 'ct_control', kind: 'room', floor: 'vinyl',
    doors: [{ side: '+x', at: -4.4, w: 0.9 }, { side: '-z', at: -8.0, w: 0.9, kind: 'lead', internal: true }],
    glazing: [{ side: '-z', from: -10.9, to: -9.0, sill: 0.9, head: 2.0, kind: 'lead' }],
  },
  { id: 'ct', name: 'CT Scan Room', no: '308', rect: [XS, XA, BAY[4], BAY[6]], fit: 'ct', kind: 'room', floor: 'conductive', doors: [{ side: '+x', at: -8.1, w: 1.5, kind: 'lead' }] },

  // The core; the lift lobby is where relatives wait, outside the theatres.
  M({ id: 'mainLifts', name: 'Main Lifts', rect: [XL, XM, ZL, ZLB], fit: 'main_lifts', kind: 'core', thick: ['-x', '+x', '-z', '+z'], quiet: true, ceiling: 'open', well: 'lift' }),
  M({ id: 'liftLobby', name: 'OT Relatives\' Waiting', rect: [XL, XG, Z1B, ZL], fit: 'ot_waiting', kind: 'circulation', floor: 'corridor', quiet: true }),
  M({
    id: 'mainStair', name: 'Main Stair', rect: [MAIN_STAIR.x0, MAIN_STAIR.x1, MAIN_STAIR.z0, MAIN_STAIR.z1], fit: 'main_stair', kind: 'core', thick: ['-x', '+x', '+z'], quiet: true,
    floor: 'service', ceiling: 'open', well: 'stair', doors: [{ side: '+z', at: MAIN_STAIR.door, w: 1.1, kind: 'fire', hinge: 1 }],
  }),
  // Past the red line: the transfer bay, where patients pass from the ward's trolley to the
  // theatre's, and the clean corridor along the theatres' doors with their scrub stations.
  M({
    id: 'transfer', name: 'Patient Transfer Bay', no: 'OT-T', rect: [XM, XG, ZL, 2.5], fit: 'ot_transfer', kind: 'restricted', floor: 'conductive',
    doors: [{ side: '-z', at: (XM + XG) / 2, w: 1.5, kind: 'double' }],
  }),
  M({ id: 'otCorridor', name: 'OT Clean Corridor', rect: [XM, XN, 2.5, 4.5], fit: 'ot_corridor', kind: 'restricted', floor: 'conductive', quiet: true }),
  M({ id: 'anaesthesia', name: 'Anaesthesia Work Room', no: '314', rect: [0.9, XM, ZLB, 4.5], fit: 'ot_anaesthesia', kind: 'room', floor: 'conductive', doors: [{ side: '+x', at: 3.5, w: 0.9 }] }),
  M({ id: 'otEquipment', name: 'OT Equipment Store', no: '315', rect: [XL, 0.9, ZLB, 3.7], fit: 'ot_equipment', kind: 'service', floor: 'conductive', light: 'service', doors: [{ side: '+x', at: 2.9, w: 0.9, internal: true, out: true }] }),
  // The three theatres: OT 1 across the front of the court, OTs 2 and 3 behind the curtain wall.
  M({ id: 'ot1', name: 'Operation Theatre 1 · General & Laparoscopic Surgery', no: 'OT-1', rect: [XG, 11.2, Z1B, 2.5], fit: 'ot_1', kind: 'room', floor: 'conductive', ceiling: 'board', light: 'clinical', theatre: true, doors: [{ side: '+z', at: 8.3, w: 1.6, kind: 'hermetic', hinge: 1 }] }),
  M({
    id: 'preop', name: 'Pre-operative Holding & OT Reception', no: '311', rect: [11.2, XN, Z1B, 2.5], fit: 'ot_preop', kind: 'room', floor: 'conductive',
    doors: [{ side: '-z', at: 12.4, w: 1.4, kind: 'double' }, { side: '+z', at: 12.4, w: 1.4, kind: 'double', internal: true }],
  }),
  M({ id: 'ot2', name: 'Operation Theatre 2 · Orthopaedic Surgery', no: 'OT-2', rect: [0.9, 6.1, 4.5, 13.0], fit: 'ot_2', kind: 'room', floor: 'conductive', ceiling: 'board', light: 'clinical', theatre: true, doors: [{ side: '-z', at: 4.9, w: 1.6, kind: 'hermetic', hinge: -1, inside: true }] }),
  M({ id: 'ot3', name: 'Operation Theatre 3 · Major & Specialty Surgery', no: 'OT-3', rect: [6.1, 11.3, 4.5, 13.0], fit: 'ot_3', kind: 'room', floor: 'conductive', ceiling: 'board', light: 'clinical', theatre: true, doors: [{ side: '-z', at: 7.6, w: 1.6, kind: 'hermetic', hinge: 1 }] }),
  M({ id: 'sterile', name: 'OT Sterile Instrument Store', no: '312', rect: [11.3, XN, 4.5, 10.7], fit: 'ot_sterile', kind: 'room', floor: 'conductive', doors: [{ side: '-z', at: 12.45, w: 1.0 }] }),
  M({ id: 'otPlant', name: 'OT Air-handling & Gas Manifold Space', rect: [2.0, 10.2, 13.0, 14.2], fit: '', kind: 'service', floor: 'service', ceiling: 'open', light: 'service', quiet: true }),
  // Round the court, past the restricted doors: changing, CSSD, PACU, dirty utility.
  ...ring({
    C1: { kind: 'restricted', rect: [XG, XN, Z1A, Z1B], fit: 'ot_semi', doors: [{ side: '-x', at: (Z1A + Z1B) / 2, w: 1.5, kind: 'double' }] },
    C2: { kind: 'restricted', fit: 'ot_semi', doors: [{ side: '-x', at: (Z2A + Z2B) / 2, w: 1.5, kind: 'double' }] },
    N: { kind: 'restricted', fit: 'ot_semi' },
  }),
  M({ id: 'corridorC1w', name: 'Front Corridor', rect: [XB, XG, Z1A, Z1B], fit: 'corridor', kind: 'circulation', floor: 'corridor', quiet: true }),
  M({ id: 'changeM', name: 'Surgeons\' & Staff Changing · Male', no: '316', rect: [1.8, 4.95, ZB, Z2A], fit: 'ot_change_m', kind: 'room', floor: 'vinyl', doors: [{ side: '+z', at: 3.4, w: 0.9 }] }),
  M({ id: 'changeF', name: 'Surgeons\' & Staff Changing · Female', no: '317', rect: [4.95, 8.1, ZB, Z2A], fit: 'ot_change_f', kind: 'room', floor: 'vinyl', doors: [{ side: '+z', at: 6.5, w: 0.9 }] }),
  M({ id: 'cssd', name: 'CSSD · Sterile Instrument Processing', no: '318', rect: [8.1, XN, ZB, Z2A], fit: 'ot_cssd', kind: 'room', floor: 'lab', tiled: true, doors: [{ side: '+z', at: 9.2, w: 1.0 }, { side: '+z', at: 12.6, w: 1.0 }] }),
  M({ id: 'dirtyOt', name: 'OT Dirty Utility & Disposal', no: '319', rect: [XN1, XN, Z2B, -15.2], fit: 'ot_dirty', kind: 'service', floor: 'service', tiled: true, light: 'service', doors: [{ side: '-x', at: -16.7, w: 1.0 }] }),
  M({ id: 'pacu', name: 'Post-anaesthesia Care Unit (Recovery)', no: '313', rect: [XN1, XN, -15.2, Z1A], fit: 'ot_pacu', kind: 'room', floor: 'conductive', doors: [{ side: '-x', at: -7.0, w: 1.5, kind: 'double' }] }),
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
    // The emergency department's wall; the main lobby's glass and the basement core's face behind
    // it; admissions' walls: the north façade, the wing's front and the emergency department's.
    f.push({ axis: 'x', c: XG, from: ZB, to: ZF })
    f.push({ axis: 'z', c: ZK, from: -2.7, to: 0.9 }, { axis: 'x', c: 0.9, from: ZK, to: 12.85 }, { axis: 'z', c: 12.85, from: 0.9, to: 10.2 })
    f.push({ axis: 'z', c: ZK, from: 2.0, to: 9.7 })
    f.push({ axis: 'x', c: XN, from: 4.97, to: 10.7 }, { axis: 'z', c: 10.7, from: 10.2, to: XN }, { axis: 'z', c: 4.97, from: 10.2, to: XN })
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
  { level: 0, y: LEVELS[0], label: 'G', title: 'Ground Floor · Main Reception, Patient Services & OPD', rooms: ground, facade: facades(0), plate: [] },
  { level: 1, y: LEVELS[1], label: '1', title: 'First Floor · Inpatient Rooms & OPD Consultations', rooms: first, facade: facades(1), plate: plate(1) },
  { level: 2, y: LEVELS[2], label: '2', title: 'Second Floor · International Wing, ICU & X-ray', rooms: second, facade: facades(2), plate: plate(2) },
  { level: 3, y: LEVELS[3], label: '3', title: 'Third Floor · Operation Theatres & CT Scan', rooms: third, facade: facades(3), plate: plate(3) },
]

const floorKey = (level: number) => (level === 0 ? 'g' : String(level))
/** A room's hotspot (and light zone) name: room_opd_* in the outpatient block, room_main_* in the main block. */
export const roomMesh = (level: number, id: string, dept: RoomSpec['dept'] = 'opd') => `room_${dept === 'main' ? 'main' : 'opd'}_${floorKey(level)}_${id}`
/** The light zone of a floor's corridors, halls and core. */
export const circulationZone = (level: number) => `opd_${floorKey(level)}_circulation`

/** Whether a plan point is inside the fitted interior on a floor (for the façade: what stands behind its glass). */
export function insideOpd(level: number, x: number, z: number) {
  const fl = FLOORS[level]
  if (!fl) return false
  return fl.rooms.some((r) => x > r.rect[0] - 0.35 && x < r.rect[1] + 0.35 && z > r.rect[2] - 0.35 && z < r.rect[3] + 0.35)
}

/** The floor whose storey a height lies in, or −1. */
export function levelAt(y: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) if (y >= LEVELS[i] - 0.4) return i
  return -1
}
