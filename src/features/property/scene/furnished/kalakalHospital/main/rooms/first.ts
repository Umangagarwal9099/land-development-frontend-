import type { Group } from 'three'
import { PI } from '../../../kit'
import { workstation, beamSeating, linenTrolley } from '../../emergency'
import { examLight, headwall, ivStand, vitalsStand } from '../../erEquipment'
import { armChair, counter, crashCart, examCouch, locker, overbedTable, sofa, taskChair, visitorChair, wheelchair } from '../../erFurniture'
import { group, signPanel } from '../../erKit'
import type { OpdCtx, PlacedDoor, Room } from '../../opd/ctx'
import { bench, sideTable, sofa as loungeSofa, waterStation, planter } from '../../opd/equipment/common'
import { chemicals, mopTrolley } from '../../opd/equipment/ground'
import { dropDownRail, exhaustGrille, floorDrain, grabRail, handWashPoint, mirror, pullCord, soapDispenser, towelDispenser, wallBasin, wcPan } from '../../opd/equipment/sanitary'
import { baseRun, bins, clock, computer, curtain, desk, deskPhone, dressingTrolley, lockers, papers, poster, printer, sharps, wallCupboard, wallScreen } from '../../opd/furniture'
import { board, NAVY, tokenScreen } from '../../opd/paints'
import type { Dir } from '../../opd/plan'
import { coffeeTable as loungeTable } from '../../opd/equipment/clinical'
import type { Fitter } from '../../opd/rooms/types'
import { bedHead, callButton, callLamp, callLink, drawerCart, fan, fanRegulator, rubBottle, splitAC, wallClock, wallTV, wardBed, wardrobe, type CallLink } from '../kit'
import { icuMonitorPaint, ventScreenPaint } from '../equipment/secondPaints'
import { icuVentilator, infusionTower } from '../equipment/secondIcu'

/*
 * The main block's first floor: the inpatient rooms round the nurses' station, the three-bed high
 * dependency unit across the corridor from it, the doctor's consultation room (./clinic.ts) off
 * the relatives' lounge. Every bed has its
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
    ivStand(e, room.onWall(s.side, s.at + s.locker * 0.62, 0, 0.75), false)
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
const LAYOUT: Record<string, { beds: BedSpot[]; ac?: [Dir, number]; tv?: [Dir, number]; robe: [Dir, number, 'main' | 'nook']; seat: [number, number, number]; fans?: [number, number][]; curtain?: [number, number, number, 'x' | 'z']; bin?: [number, number] }> = {
  r101: { beds: [{ side: '-x', at: -24.65, locker: 1 }, { side: '-x', at: -22.05, locker: 1 }], ac: ['+x', -24.4], tv: ['+x', -23.4], robe: ['+z', 6.8, 'main'], seat: [5.6, -25.1, PI], curtain: [1.86, -23.35, 2.55, 'x'] },
  r102: { beds: [{ side: '-x', at: -24.65, locker: 1 }, { side: '-x', at: -22.05, locker: 1 }], robe: ['+z', 12.7, 'main'], seat: [11.6, -25.1, PI], fans: [[9.6, -24.5], [9.6, -21.9]], curtain: [7.76, -23.35, 2.55, 'x'] },
  r103: { beds: [{ side: '-x', at: -13.15, locker: -1 }], robe: ['-z', 12.75, 'nook'], seat: [13.0, -12.9, -PI / 2], fans: [[11.9, -13.6]] },
  r104: { beds: [{ side: '-x', at: -10.85, locker: 1 }], ac: ['-z', 11.4], tv: ['-z', 12.9], robe: ['+z', 12.75, 'nook'], seat: [13.05, -10.0, -PI / 2] },
  r105: { beds: [{ side: '-x', at: 0.3, locker: -1 }, { side: '-x', at: 2.9, locker: 1 }], ac: ['+z', 11.9], tv: ['+z', 13.0], robe: ['+z', 10.65, 'main'], seat: [13.05, 1.6, -PI / 2], curtain: [10.12, 1.6, 2.5, 'x'] },
  // 106 runs from the west façade (its windows) to the wall it shares with 107, the bed's head on it.
  r106: { beds: [{ side: '+x', at: 11.6, locker: 1 }], ac: ['-z', 1.45], tv: ['-z', 2.45], robe: ['+x', 9.2, 'nook'], seat: [1.45, 11.6, PI / 2], bin: [1.3, 10.55] },
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
    // A sharps box and glove dispenser by the bed head, for the nurses' rounds.
    sharps(e, room.onWall(b0.side, b0.at + b0.locker * 1.32), 1.3)
    const [c0, c1] = room.side(L.robe[0])
    void c0
    void c1
    wallClock(e, room.onWall(b0.side, b0.at, 0, 0.001), 2.55, 0.26)
    bins(e, room.at(L.bin?.[0] ?? room.x1 - 0.25, L.bin?.[1] ?? room.z0 + 0.25), ['black', 'yellow'])
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
    specs: ['Three HIS workstations', 'Nurse-call annunciator for rooms 101–107 and the HDU', 'Raised transaction ledge, wheelchair-height section', 'Medication trolley and crash cart at hand'],
  })
  // The nurse-call annunciator on the back wall: a lamp for each room under its number.
  const ann = room.onWall('+z', room.x0 + 2.2)
  k.box(ann, 1.5, 0.42, 0.04, m.charcoal, 0, 2.05, 0.02)
  const ids = ['r101', 'r102', 'r103', 'r104', 'r105', 'r106', 'r107', 'hdu']
  ids.forEach((id, i) => {
    const x = -0.7 + i * 0.2
    callLamp(e, ann, wardLink(e, id), x, 2.1, 0.04, 'amber')
    const lab = e.o.sign(`annun_${id}`, 96, 48, board('#1b1c1e', [[id === 'hdu' ? 'HDU' : id.slice(1), 0.6, '#ffffff']]))
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

const lounge: Fitter = (e, room) => {
  // Two seating groups against the rooms' wall, clear of the doors on to the lounge (the toilet's,
  // the passage from the lifts, the consultation room's, 106's and 107's, housekeeping's).
  for (const x of [2.2, 9.0]) {
    const sf = room.at(x, room.z1 - 0.48, PI)
    loungeSofa(e, sf, 1.8)
    loungeTable(e, room.at(x, room.z1 - 1.35), 0.9, 0.5)
    for (const dx of [-0.8, 0.8]) armChair(e, room.at(x + dx, room.z1 - 2.15, dx < 0 ? 0.25 : -0.25))
  }
  room.info(room.at(2.2, room.z1 - 0.48, PI), { title: 'Relatives\' Waiting Lounge', kind: 'Visitor amenity', body: 'Relatives wait here for visiting hours and for the doctor: soft seating in two groups, drinking water, the visiting-hours screen, and the consultation room where the doctors meet families.', specs: ['Visiting hours 4 – 7 pm', 'One attendant pass per patient', 'Accessible toilet and visitors\' toilet beside'] })
  beamSeating(e, room.at(7.0, room.z0 + 0.45, 0), 3)
  const ws = room.at(10.85, room.z0 + 0.42, 0)
  waterStation(e, ws)
  room.info(ws, { title: 'Drinking Water Station', kind: 'Visitor amenity', body: 'RO-purified drinking water, chilled and ambient, with paper cups.' })
  wallScreen(e, room.onWall('-z', 7.0), 1.0, 1.9, e.o.screen('wardLoungeInfo', 1024, 576, tokenScreen('Visiting Hours · 4 – 7 pm', [['ICU', '11 – 12 · 5 – 6'], ['Wards', '4 – 7 pm'], ['Attendant passes', 'Main reception'], ['Pharmacy', 'Ground floor']], 712)))
  planter(e, room.at(room.x0 + 0.35, room.z0 + 0.35))
  sideTable(e, room.at(10.65, room.z1 - 2.15))
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

/* ---------- the high dependency unit ---------- */

/**
 * The HDU: three beds for patients who need closer watching than a ward gives but not intensive
 * care (after major surgery, on non-invasive ventilation, on vasoactive or insulin infusions),
 * a nurse to every two beds. Each bed space 2.6 m wide with its headwall (O₂, air, vacuum, the
 * flowmeter and humidifier, suction, the monitor on its arm), an ICU bed, infusion pumps, a locker
 * and curtains between; the middle bed on non-invasive ventilation. The nurses' observation desk
 * faces the beds with the central monitor; the crash cart, a hand-wash basin, waste by the door.
 */
const hdu: Fitter = (e, room) => {
  const l = wardLink(e, 'hdu')
  const xs = [0.95, 3.55, 6.15]
  xs.forEach((x, i) => {
    const hw = room.onWall('-z', x)
    headwall(e, hw, e.o.screen(`hduMon${i}`, 640, 408, icuMonitorPaint(`HDU-${i + 1}`, 7200 + i, i === 1)), false)
    callButton(e, hw, l, 0.85, 1.44, 0.086, 'Nurse Call')
    const b = room.onWall('-z', x, 0, 1.13)
    wardBed(e, b, { style: 'icu', back: i === 1 ? 0.62 : 0.45, linen: i === 2 ? 'made' : 'used', height: 0.66 })
    locker(e, room.onWall('-z', x + 0.95, 0, 0.3))
    overbedTable(e, room.onWall('-z', x + 0.85, 0, 1.9))
    if (i < 2) curtain(e, room.at(x + 1.3, room.z0 + 1.55, -PI / 2), 3.0, room.ceiling, 0.85)
    if (i !== 2) {
      // The infusion stand at the bed's upper body on the side away from the locker.
      const tw = room.onWall('-z', x - 0.95, 0, 1.0)
      infusionTower(e, tw, {
        pumps: i === 0 ? [{ kind: 'vol', drug: 'NaCl 0.9%', rate: '75.0 ml/h', sub: 'VTBI 600 ml' }, { kind: 'syr', drug: 'Insulin', rate: '3.0 ml/h', sub: '3.0 U/h' }] : [{ kind: 'syr', drug: 'Dobutamine', rate: '4.5 ml/h', sub: '5 µg/kg/min' }],
        key: `hdu${i}`, toward: [0.9, 0.8, 0.2], bags: [['0.9% Sodium Chloride', 'Injection IP · 1000 mL']],
      })
    }
  })
  room.info(room.onWall('-z', xs[0], 0, 1.13), {
    title: 'High Dependency Unit', kind: 'Step-down critical care · 3 beds',
    body: 'Three beds between the ward and the ICU, a nurse to every two patients: after major surgery, on non-invasive ventilation, on infusions that need titrating, or stepping down from the ICU. Each bed has a headwall with oxygen, air and vacuum, the flowmeter and suction, its monitor networked to the central screen at the nurses\' desk, infusion pumps, and a curtain to the next bed.',
    specs: ['Nurse : patient 1 : 2', 'O₂, air, vacuum, UPS power at every bed', 'Continuous ECG, SpO₂, NIBP; central monitoring', 'Non-invasive ventilation, infusion and syringe pumps'],
  })
  // The middle bed on non-invasive ventilation (BiPAP by mask).
  const v = room.onWall('-z', xs[1] + 1.05, 0, 0.6)
  icuVentilator(e, v, { screen: e.o.screen('vent_HDU2', 640, 410, ventScreenPaint('HDU-2 · NIV', 7210)), side: -1 })
  room.info(v, { title: 'Non-invasive Ventilator', kind: 'NIV · BiPAP', body: 'Ventilation by a tight-fitting face mask instead of a tube: pressure support with PEEP for a patient tiring with COPD, pulmonary oedema or after extubation, kept off the ICU by it.', specs: ['NIV, CPAP, high-flow O₂', 'Leak compensation, heated humidifier'] })
  // The observation desk facing the beds, the central monitor on it.
  const d = room.at(2.4, -7.05, 0)
  desk(e, d, 1.6, 0.7, 1)
  computer(e, d, -0.35, 0.75, -0.15, 0, e.o.screen('hduCentral', 640, 408, icuMonitorPaint('HDU · Central', 7220, false)))
  computer(e, d, 0.4, 0.75, -0.15, 0, e.o.his('hdu_chart', 'HDU · Vitals & Fluid Balance', 'graph'))
  deskPhone(e, d, 0.05, 0.75, 0.1, 0)
  taskChair(e, room.at(2.4, -6.35, PI))
  room.info(d, { title: 'HDU Observation Desk', kind: 'Nursing station', body: 'The HDU nurse sits facing the three beds: every monitor\'s waveforms and alarms repeat on the central monitor here, and observations and fluid balance are charted on the HIS every hour.' })
  crashCart(e, room.at(room.x0 + 0.4, -6.55, PI / 2), e.m.monitors[1])
  const mt = room.at(4.15, -6.4, PI)
  drawerCart(e, mt, 0.62, 1.0, 0.5, 6)
  room.info(mt, { title: 'Medication Trolley', kind: 'HDU medicines', body: 'Each patient\'s medicines in a locked drawer, with the infusion drugs, flushes and syringes for the round.' })
  handWashPoint(e, room.onWall('+z', 5.1), 0.5)
  bins(e, room.onWall('+x', -7.2, 0, 0.22), ['yellow', 'red', 'black'])
  sharps(e, room.onWall('+x', -7.2), 1.3)
  wallClock(e, room.onWall('+z', 1.0), 2.35, 0.3)
  poster(e, room.onWall('+z', 0.0), 'NIV Mask Fitting', '#1c3966', 0.42, 0.6, 1.6)
  for (const door of room.doors) entrance(e, room, door, l)
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
  ward_lounge: lounge,
  ward_visitor_wc: visitorWc,
  ward_housekeeping: housekeeping,
  ward_exam: exam,
  ward_hdu: hdu,
  ward_staff_wc: staffWc,
  ward_dirty: dirty,
  ward_doctors: doctors,
}

export { wheelchair }
