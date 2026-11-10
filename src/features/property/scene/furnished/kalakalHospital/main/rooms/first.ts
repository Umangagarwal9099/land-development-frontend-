import type { Group } from 'three'
import { PI } from '../../../kit'
import { workstation, beamSeating, linenTrolley } from '../../emergency'
import { examLight, vitalsStand } from '../../erEquipment'
import { armChair, counter, crashCart, examCouch, locker, overbedTable, sofa, taskChair, visitorChair, wheelchair } from '../../erFurniture'
import { group, signPanel } from '../../erKit'
import type { OpdCtx, PlacedDoor, Room } from '../../opd/ctx'
import { bench, fridge, kitchenette, noticeBoard, sideTable, sofa as loungeSofa, waterStation, planter } from '../../opd/equipment/common'
import { chemicals, mopSink, mopTrolley } from '../../opd/equipment/ground'
import { dropDownRail, exhaustGrille, floorDrain, grabRail, handWashPoint, mirror, pullCord, soapDispenser, towelDispenser, wallBasin, wcPan } from '../../opd/equipment/sanitary'
import { baseRun, bins, clock, computer, curtain, desk, deskPhone, dressingTrolley, fileCabinet, lockers, medFridge, papers, poster, printer, rack, sharps, wallCupboard, wallScreen } from '../../opd/furniture'
import { board, NAVY, tokenScreen } from '../../opd/paints'
import type { Dir } from '../../opd/plan'
import { coffeeTable as loungeTable } from '../../opd/equipment/clinical'
import type { Fitter } from '../../opd/rooms/types'
import { bedHead, callLamp, callLink, drawerCart, fan, fanRegulator, linenShelves, rubBottle, splitAC, wallClock, wallTV, wardBed, wardrobe, type CallLink } from '../kit'

/*
 * The main block's first floor: the inpatient rooms round the nurses' station. Every bed has its
 * bed-head unit (oxygen, vacuum, sockets, reading light, nurse call), a locker and an overbed
 * table, a chair beside it, monitoring at hand; each room its wardrobe, its washroom (fitted by
 * ../washroom.ts) and a nurse-call lamp over its door that lights with the room's call buttons,
 * repeated on the annunciator at the nurses' station. AC rooms are cooled by a split unit and
 * have a TV and an attendant's sofa-cum-bed; non-AC rooms have ceiling fans on regulators and
 * plainer seating. Plan coordinates as in ../../opd/plan.ts.
 */

/** The ward's call circuits, one per patient room, made fresh for each build of the floor. */
const LINKS = new WeakMap<object, Map<string, CallLink>>()
export function wardLink(e: OpdCtx, id: string) {
  let m = LINKS.get(e.byId)
  if (!m) LINKS.set(e.byId, (m = new Map()))
  let l = m.get(id)
  if (!l) m.set(id, (l = callLink()))
  return l
}

/** Where along its side a placed door is. */
const alongOf = (d: PlacedDoor) => (d.spec.side === '-x' || d.spec.side === '+x' ? d.z : d.x)

/**
 * At a room's entrance door: the call lamp over it outside, hand-rub beside it inside, and for a
 * non-AC room the fan's regulator by the light switch.
 */
export function entrance(e: OpdCtx, owner: Room, d: PlacedDoor, link: CallLink, regulator = false) {
  const [nx, nz] = d.n
  const out = owner.at(d.x - nx * 0.075, d.z - nz * 0.075, Math.atan2(-nx, -nz), 2.3)
  callLamp(e, out, link, 0, 0, 0, 'red')
  const [a0, a1] = owner.side(d.spec.side)
  const at = alongOf(d)
  const s = at + d.w / 2 + 0.45 < a1 - 0.2 ? 1 : -1
  rubBottle(e, owner.onWall(d.spec.side, at + s * (d.w / 2 + 0.45), 0, 0.001), 1.2)
  if (regulator) {
    const r = owner.onWall(d.spec.side, at - s * (d.w / 2 + 0.3), 0, 0.001)
    fanRegulator(e, r, 0, 1.35, 0)
  }
  void a0
}

interface BedSpot {
  /** The wall the bed's head is against, and where along it. */
  side: Dir
  at: number
  /** The locker's side along the wall (±1). */
  locker: 1 | -1
}

/** A bed and everything at it: bed-head unit, bed, locker, overbed table, chair, IV stand. */
function bedSpace(e: OpdCtx, room: Room, s: BedSpot, link: CallLink, o: { style: 'ward' | 'premium'; linen: 'made' | 'used'; monitor?: boolean; chair?: boolean; name: string }) {
  bedHead(e, room.onWall(s.side, s.at), link, { gases: 'ward', width: 1.9 })
  const g = room.onWall(s.side, s.at, 0, 1.13)
  wardBed(e, g, { style: o.style, linen: o.linen, back: o.linen === 'used' ? 0.55 : 0.2, iv: o.linen === 'used' })
  room.info(g, {
    title: 'Electric Ward Bed',
    kind: 'Inpatient bed · 5-function',
    body: 'An electrically adjusted hospital bed: height 40–80 cm, backrest, knee break, Trendelenburg and reverse, from the nurse\'s panel in the footboard or the patient\'s handset. Split side rails lower one-handed; central locking brakes all four castors from either end.',
    specs: ['Safe working load 250 kg', '4-section platform, 90 × 200 cm mattress', 'CPR quick release and battery back-up', 'Tap the backrest and rails to operate them'],
  })
  // The locker by the head, the overbed table parked across the bed's other side.
  const lk = room.onWall(s.side, s.at + s.locker * 0.82, 0, 0.27)
  locker(e, lk)
  overbedTable(e, room.onWall(s.side, s.at - s.locker * 0.72, 0, 1.55))
  if (o.chair !== false) visitorChair(e, room.onWall(s.side, s.at + s.locker * 0.85, 0, 1.25))
  if (o.monitor) {
    const vs = room.onWall(s.side, s.at - s.locker * 0.95, 0, 0.45)
    vitalsStand(e, vs, e.m.monitors[0])
    room.info(vs, { title: 'Vital Signs Monitor', kind: 'Patient monitoring', body: 'A mobile monitor for spot checks and continuous observation: non-invasive blood pressure, SpO₂ with pulse, temperature and respiration, its readings sent to the patient\'s record.', specs: ['NIBP, SpO₂, temperature', 'Early-warning score', 'Wi-Fi to the HIS'] })
  }
  void o.name
}

/** The patient's whiteboard by the bed: name, consultant, diet, allergies, the nurse today. */
function whiteboard(e: OpdCtx, p: Group) {
  const mat = e.o.sign('patientBoard', 512, 340, board('#ffffff', [['PATIENT INFORMATION', 0.11, NAVY], ['Consultant  ·  Nurse today', 0.08, '#333', 500], ['Diet  ·  Allergies  ·  Fall risk', 0.08, '#333', 500], ['Expected discharge', 0.08, '#333', 500]], { border: NAVY, rule: '#1f6fd1' }))
  signPanel(e, p, 0.6, 0.4, mat, 0, 1.55, 0.006, 0, 0.012)
}

/** A room's doors, its own and its entry nook's. */
function doorsOf(e: OpdCtx, room: Room): [Room, PlacedDoor][] {
  const nook = e.byId.get(`${room.spec.id}Entry`)
  return [...room.doors.filter((d) => !d.spec.internal).map((d): [Room, PlacedDoor] => [room, d]), ...(nook?.doors ?? []).filter((d) => !d.spec.internal).map((d): [Room, PlacedDoor] => [nook!, d])]
}

/* ---------- the rooms ---------- */

/** Bed positions, AC, TV and wardrobe for each room, by id. */
const LAYOUT: Record<string, { beds: BedSpot[]; ac?: [Dir, number]; tv?: [Dir, number]; robe: [Dir, number, 'main' | 'nook']; seat: [number, number, number]; fans?: [number, number][]; curtain?: [number, number, number, 'x' | 'z'] }> = {
  r101: { beds: [{ side: '-x', at: -24.65, locker: 1 }, { side: '-x', at: -22.05, locker: 1 }], ac: ['+x', -24.4], tv: ['+x', -23.4], robe: ['+z', 6.8, 'main'], seat: [5.6, -25.1, PI], curtain: [1.86, -23.35, 2.55, 'x'] },
  r102: { beds: [{ side: '-x', at: -24.65, locker: 1 }, { side: '-x', at: -22.05, locker: 1 }], robe: ['+z', 12.7, 'main'], seat: [11.6, -25.1, PI], fans: [[9.6, -24.5], [9.6, -21.9]], curtain: [7.76, -23.35, 2.55, 'x'] },
  r103: { beds: [{ side: '-x', at: -13.15, locker: -1 }], robe: ['-z', 12.75, 'nook'], seat: [13.0, -12.9, -PI / 2], fans: [[11.9, -13.6]] },
  r104: { beds: [{ side: '-x', at: -10.85, locker: 1 }], ac: ['-z', 11.4], tv: ['-z', 12.9], robe: ['+z', 12.75, 'nook'], seat: [13.05, -10.0, -PI / 2] },
  r105: { beds: [{ side: '-x', at: 0.3, locker: -1 }, { side: '-x', at: 2.9, locker: 1 }], ac: ['+z', 11.9], tv: ['+z', 13.0], robe: ['+z', 10.65, 'main'], seat: [13.05, 1.6, -PI / 2], curtain: [10.12, 1.6, 2.5, 'x'] },
  r106: { beds: [{ side: '-x', at: 11.65, locker: 1 }], ac: ['+x', 12.25], tv: ['+x', 12.25], robe: ['+x', 10.75, 'main'], seat: [4.9, 12.6, PI] },
  r107: { beds: [{ side: '+x', at: 11.65, locker: -1 }], ac: ['-x', 12.25], tv: ['-x', 12.25], robe: ['-x', 10.75, 'main'], seat: [7.3, 12.6, PI] },
}

function patientRoom(ac: boolean): Fitter {
  return (e, room) => {
    const L = LAYOUT[room.spec.id]
    if (!L) return
    const link = wardLink(e, room.spec.id)
    const premium = room.spec.id === 'r106' || room.spec.id === 'r107'
    L.beds.forEach((b, i) => bedSpace(e, room, b, link, { style: premium ? 'premium' : 'ward', linen: i === 0 ? 'used' : 'made', monitor: i === 0, name: room.spec.name }))
    for (const [owner, d] of doorsOf(e, room)) entrance(e, owner, d, link, !ac)
    // Privacy curtain on its ceiling track between two beds.
    if (L.curtain) {
      const [x, z, len, along] = L.curtain
      const c = room.at(x, z, along === 'x' ? 0 : -PI / 2)
      curtain(e, c, len, room.ceiling, 0.85)
    }
    // Wardrobe; seating by the window; AC or fans; TV.
    const [rs, ra, where] = L.robe
    const robeRoom = where === 'nook' ? (e.byId.get(`${room.spec.id}Entry`) ?? room) : room
    const wr = robeRoom.onWall(rs, ra)
    wardrobe(e, wr, 0.9, 2.1, 0.58, premium ? 'walnut' : 'oak')
    robeRoom.info(wr, { title: 'Patient Wardrobe', kind: 'Storage', body: 'A full-height laminate wardrobe: a hanging side for the patient\'s and attendant\'s clothes, shelves for linen and a lockable drawer and small safe for valuables.', specs: ['Doors and drawer open (tap them)', 'Electronic safe for valuables'] })
    const [sx, sz, sry] = L.seat
    if (ac) {
      sofa(e, room.at(sx, sz, sry), 2)
      room.info(room.at(sx, sz, sry), { title: 'Attendant Sofa-cum-bed', kind: 'Attendant seating', body: 'A two-seat sofa in wipe-clean upholstery that unfolds into a bed for the attendant staying overnight.' })
    } else armChair(e, room.at(sx, sz, sry))
    if (L.ac) {
      const a = room.onWall(L.ac[0], L.ac[1])
      splitAC(e, a, 0.95, 2.78, 0.75)
      room.info(a, { title: 'Split Air-conditioner', kind: 'Room cooling · 1.5 TR', body: 'An inverter split air-conditioner keeping the room at 22–24 °C, its remote on the wall beside it (tap to switch it on and off).', specs: ['Inverter compressor, R32', 'Washable antibacterial filter', 'Condensate piped to the floor drain'] })
    }
    if (L.tv) wallTV(e, room.onWall(L.tv[0], L.tv[1]), 32, 1.65)
    for (const [x, z] of L.fans ?? []) {
      fan(e, room, x, z)
    }
    if (L.fans) room.info(room.at(L.fans[0][0], L.fans[0][1], 0, room.ceiling - 0.4), { title: 'Ceiling Fan', kind: 'Ventilation · Non-AC room', body: 'A 1200 mm ceiling fan on its step regulator by the door; with the windows open it keeps air moving through the room. Tap it to start or stop it.' })
    // The patient's board, a clock, the bin by the door.
    const b0 = L.beds[0]
    whiteboard(e, room.onWall(b0.side, b0.at - b0.locker * 1.55))
    const [c0, c1] = room.side(L.robe[0])
    void c0
    void c1
    wallClock(e, room.onWall(b0.side, b0.at, 0, 0.001), 2.55, 0.26)
    bins(e, room.at(room.x1 - 0.25, room.z0 + 0.25), ['black', 'yellow'])
  }
}

/* ---------- the nurses' station and the ward's rooms ---------- */

const nurses: Fitter = (e, room) => {
  const { k, m } = e
  // The station counter facing the lift lobby and the corridor, staff behind it.
  const len = 3.6
  const g = room.at(room.x0 + 0.5 + len / 2, room.z0 + 0.95, PI)
  counter(e, g, len, [-len / 2 + 0.3, len / 2 - 0.3], [-len / 2 + 0.2, -len / 2 + 1.0])
  const screens = ['Ward Census · Bed Board', 'Medication Administration', 'Nursing Notes · Vitals']
  ;[-1.0, 0.1, 1.2].forEach((x, i) => {
    workstation(e, g, x, 0.765, 0.05, PI + (i - 1) * 0.1, e.o.his(`ward_ns${i}`, screens[i], i === 0 ? 'table' : i === 1 ? 'form' : 'graph'))
    taskChair(e, group(g, x + 0.05, 0, -0.65, (i - 1) * 0.3))
  })
  deskPhone(e, g, -0.45, 0.765, 0.15, PI)
  printer(e, g, 1.65, 0.765, -0.05, PI)
  papers(e, g, 0.6, 0.765, 0.1, 0.3)
  room.info(g, {
    title: 'Nurses\' Station',
    kind: 'Ward nursing station',
    body: 'The ward\'s nursing hub, facing the lifts so every arrival and every door is seen: admissions and transfers are received here, medicines charted and administered, and the nurse-call annunciator on the wall behind shows which room is calling.',
    specs: ['Three HIS workstations', 'Nurse-call annunciator for rooms 101–107', 'Raised transaction ledge, wheelchair-height section', 'Medication trolley and crash cart at hand'],
  })
  // The nurse-call annunciator on the back wall: a lamp for each room under its number.
  const ann = room.onWall('+z', room.x0 + 2.2)
  k.box(ann, 1.5, 0.42, 0.04, m.charcoal, 0, 2.05, 0.02)
  const ids = ['r101', 'r102', 'r103', 'r104', 'r105', 'r106', 'r107']
  ids.forEach((id, i) => {
    const x = -0.6 + i * 0.2
    callLamp(e, ann, wardLink(e, id), x, 2.1, 0.04, 'amber')
    const lab = e.o.sign(`annun_${id}`, 96, 48, board('#1b1c1e', [[id.slice(1), 0.6, '#ffffff']]))
    signPanel(e, ann, 0.12, 0.06, lab, x, 1.94, 0.042, 0, 0.002)
  })
  room.info(ann, { title: 'Nurse-call Annunciator', kind: 'Nurse call system', body: 'Each room\'s lamp lights amber, with a chime, when a call button at a bed or the pull cord in a washroom is pressed; the lamp over that room\'s door lights red at the same time. The call is cancelled at the bed.', specs: ['Calls from beds and washrooms', 'Corridor dome lights over every door'] })
  // Medication trolley, the crash cart, chart rack and supplies.
  const mt = room.at(room.x1 - 0.5, room.z1 - 0.45, PI)
  drawerCart(e, mt, 0.62, 1.0, 0.5, 6)
  room.info(mt, { title: 'Medication Trolley', kind: 'Lockable medicine cart', body: 'The drug round\'s trolley: a drawer for each patient\'s medicines, locked between rounds.' })
  crashCart(e, room.at(room.x1 - 1.25, room.z1 - 0.4, PI), e.m.monitors[1])
  wallCupboard(e, room.onWall('+z', room.x0 + 0.7), 1.0, 0.7, 0.35, 1.6, { glass: true, fill: 'files', label: 'Patient Files' })
  clock(e, room.onWall('+z', room.x1 - 2.4), 2.45)
}

const supervisor: Fitter = (e, room) => {
  const d = room.at(room.cx + 0.4, room.z1 - 0.75, PI)
  desk(e, d, 1.4, 0.7, 1)
  computer(e, d, 0.2, 0.75, 0.1, PI, e.o.his('ward_sup', 'Nursing Roster · Duty Plan', 'table'))
  deskPhone(e, d, -0.45, 0.75, 0.1, PI)
  taskChair(e, room.at(room.cx + 0.4, room.z1 - 1.3, 0))
  for (const x of [-0.5, 0.3]) visitorChair(e, room.at(room.cx + x, room.z0 + 0.6, PI))
  fileCabinet(e, room.onWall('-x', room.cz, 0, 0.25), 4)
  noticeBoard(e, room.onWall('+x', room.cz), 1.2, 1.5)
  room.info(d, { title: 'Nursing Supervisor', kind: 'Ward office', body: 'The ward sister\'s office: duty rosters, staffing, incident reports and the day\'s bed plan.' })
}

const lounge: Fitter = (e, room) => {
  // Sofas and armchairs in two groups facing the information screen; water and a planter.
  for (const [x, ry] of [[2.8, 0], [8.6, 0]] as const) {
    loungeSofa(e, room.at(x, room.z0 + 0.5, ry), 1.8)
    loungeTable(e, room.at(x, room.z0 + 1.35), 0.9, 0.5)
  }
  for (const x of [1.6, 4.1, 7.3, 9.9]) armChair(e, room.at(x, room.z0 + 2.05, PI))
  beamSeating(e, room.at(5.7, room.z0 + 0.45, 0), 3)
  const ws = room.at(room.x1 - 0.4, room.z0 + 0.4, -PI / 2)
  waterStation(e, ws)
  room.info(ws, { title: 'Drinking Water Station', kind: 'Visitor amenity', body: 'RO-purified drinking water, chilled and ambient, with paper cups.' })
  wallScreen(e, room.onWall('-z', 5.7), 1.0, 1.9, e.o.screen('wardLoungeInfo', 1024, 576, tokenScreen('Visiting Hours · 4 – 7 pm', [['ICU', '11 – 12 · 5 – 6'], ['Wards', '4 – 7 pm'], ['Attendant passes', 'Main reception'], ['Pharmacy', 'Ground floor']], 712)))
  planter(e, room.at(room.x0 + 0.35, room.z0 + 0.35))
  sideTable(e, room.at(10.6, room.z0 + 2.05))
}

const visitorWc: Fitter = (e, room) => {
  const w = room.onWall('-x', room.cz)
  wcPan(e, w, 0.48, 1.0)
  grabRail(e, w, 'vwc', [[0.35, 0.75, 0], [0.35, 0.75, 0.06], [0.35, 0.75, 0.06], [0.35, 0.75, 0.6], [0.35, 0.75, 0]].slice(0, 4) as [number, number, number][])
  dropDownRail(e, group(w, -0.4, 0, 0), 0.75, 0.75)
  const b = room.onWall('+x', room.cz - 0.2)
  wallBasin(e, b, 0.5, 0.78)
  mirror(e, b, 0.45, 0.7, 1.4, 0.08)
  soapDispenser(e, b, 0.35, 1.1)
  towelDispenser(e, b, -0.45, 1.2)
  pullCord(e, room.onWall('-z', room.cx), room.ceiling)
  floorDrain(e, room.at(room.cx, room.cz))
  exhaustGrille(e, room.at(room.cx, room.cz), room.ceiling, 0.25)
}

const janitorRoom: Fitter = (e, room) => {
  mopSink(e, room.onWall('-z', room.x0 + 0.5))
  mopTrolley(e, room.at(room.x1 - 0.5, room.cz, -PI / 2))
  chemicals(e, room.onWall('-z', room.x1 - 0.8), 0.9, 1.4)
}

const linen: Fitter = (e, room) => {
  linenShelves(e, room.onWall('-x', room.cz + 0.6), Math.min(2.4, room.d - 1.4), 1.95, Math.min(0.45, room.w - 0.55), 5)
}

const housekeeping: Fitter = (e, room) => {
  linenTrolley(e, room.at(room.cx, room.z1 - 0.7, PI))
  mopTrolley(e, room.at(room.cx, room.cz, 0))
  chemicals(e, room.onWall('+x', room.z1 - 1.8), 0.9, 1.4)
}

const exam: Fitter = (e, room) => {
  const c = room.onWall('-x', room.cz + 0.3, 0, 0.45)
  examCouch(e, c)
  examLight(e, room.at(room.x0 + 1.4, room.cz + 1.4, -PI / 2), 0.6)
  curtain(e, room.at(room.x0 + 1.5, room.cz - 1.2, -PI / 2), 2.6, room.ceiling, 0.4)
  dressingTrolley(e, room.at(room.x0 + 1.6, room.cz - 0.7, -PI / 2))
  vitalsStand(e, room.at(room.x0 + 0.4, room.cz + 1.6, PI / 2), e.m.monitors[2])
  const d = room.onWall('+x', room.cz - 0.6, 0, 0.4)
  desk(e, d, 1.2, 0.7, -1)
  computer(e, d, 0.2, 0.75, -0.1, 0, e.o.his('ward_exam', 'Clinical Notes · Orders', 'form'))
  taskChair(e, room.onWall('+x', room.cz - 0.6, 0, 1.1))
  handWashPoint(e, room.onWall('+z', room.x1 - 0.6), 0.5)
  sharps(e, room.onWall('-z', room.x1 - 0.6), 1.2)
  bins(e, room.onWall('-z', room.x1 - 1.2, 0, 0.2), ['yellow', 'red', 'black'])
  room.info(c, { title: 'Examination Couch', kind: 'Clinical examination', body: 'A two-section examination couch with an adjustable backrest under a ceiling-mounted LED examination light, for examinations and minor procedures out of the patient\'s room.' })
}

const supply: Fitter = (e, room) => {
  rack(e, room.onWall('-x', room.cz, 0, 0.25), 2.2, 2.0, 0.45, 5, 'supplies')
  rack(e, room.onWall('+x', room.cz - 0.7, 0, 0.25), 1.6, 2.0, 0.45, 5, 'medicines')
  baseRun(e, room.onWall('-z', room.cx), 2.4, { sink: 0.6, fill: 'supplies' })
  wallCupboard(e, room.onWall('-z', room.cx), 2.4, 0.7, 0.35, 1.5, { fill: 'supplies' })
  const f = room.onWall('+x', room.z1 - 0.6, 0, 0.32)
  medFridge(e, f, 'Medication Refrigerator · 2–8 °C')
  room.info(f, { title: 'Medication Refrigerator', kind: 'Cold chain · 2–8 °C', body: 'Insulins, vaccines and other cold-chain medicines for the ward, its temperature logged twice a day.' })
}

const pantry: Fitter = (e, room) => {
  kitchenette(e, room.onWall('-z', room.cx), 2.6)
  fridge(e, room.onWall('-x', room.cz - 0.6, 0, 0.35))
  const t = room.at(room.x1 - 0.8, room.cz + 0.6, -PI / 2)
  drawerCart(e, t, 0.7, 1.05, 0.6, 4)
  room.info(t, { title: 'Food Trolley', kind: 'Patient diet service', body: 'Meals arrive from the central kitchen by the service lift and are served from here to the patients by diet: normal, diabetic, soft, liquid.' })
}

const staffWc: Fitter = (e, room) => {
  lockers(e, room.onWall('+x', room.cz + 0.8, 0, 0.25), 6)
  bench(e, room.at(room.x1 - 1.0, room.cz + 0.8, -PI / 2), 1.6)
  const w = room.onWall('-x', room.z0 + 0.9)
  wcPan(e, w, 0.42, 1.0)
  const b = room.onWall('-z', room.cx + 0.5)
  wallBasin(e, b, 0.5, 0.82)
  mirror(e, b, 0.5, 0.7, 1.45, 0.06)
  soapDispenser(e, b, 0.4, 1.1)
  floorDrain(e, room.at(room.cx, room.cz))
}

const dirty: Fitter = (e, room) => {
  const s = room.onWall('+x', room.cz)
  baseRun(e, s, 2.0, { sink: -0.5, fill: 'none' })
  handWashPoint(e, room.onWall('-z', room.x1 - 0.5), 0.45)
  bins(e, room.onWall('-x', room.cz, 0, 0.25), ['yellow', 'red', 'blue', 'white'], 'large')
  linenTrolley(e, room.at(room.cx - 0.4, room.z0 + 0.7, 0))
  room.info(s, { title: 'Clinical Sluice', kind: 'Dirty utility', body: 'Bedpans and urinals are emptied and washed here; soiled linen leaves in its trolley and biomedical waste in colour-coded bins under the 2016 rules.', specs: ['Flushing-rim sluice sink', 'Yellow, red, blue and white waste streams'] })
}

const doctors: Fitter = (e, room) => {
  const b = room.onWall('+x', room.cz, 0, 1.0)
  wardBed(e, b, { linen: 'made', back: 0.1, height: 0.5 })
  const d = room.onWall('-x', room.cz, 0, 0.4)
  desk(e, d, 1.2, 0.7, 1)
  computer(e, d, -0.2, 0.75, -0.1, 0, e.o.his('ward_doc', 'Patient List · Orders · Results', 'table'))
  taskChair(e, room.onWall('-x', room.cz, 0, 1.05))
  lockers(e, room.onWall('-z', room.x0 + 1.0, 0, 0.25), 3)
  poster(e, room.onWall('-x', room.cz + 1.4), 'Sepsis Bundle', '#1c3966')
}

export const MAIN_FIRST: Record<string, Fitter> = {
  ward_single_ac: patientRoom(true),
  ward_single_nonac: patientRoom(false),
  ward_double_ac: patientRoom(true),
  ward_double_nonac: patientRoom(false),
  ward_nurses: nurses,
  ward_supervisor: supervisor,
  ward_lounge: lounge,
  ward_visitor_wc: visitorWc,
  ward_janitor: janitorRoom,
  ward_linen: linen,
  ward_housekeeping: housekeeping,
  ward_exam: exam,
  ward_supply: supply,
  ward_pantry: pantry,
  ward_staff_wc: staffWc,
  ward_dirty: dirty,
  ward_doctors: doctors,
}

export { wheelchair }
