import type { Material, Object3D } from 'three'
import { PI } from '../../../kit'
import { beamSeating, linenTrolley, workstation } from '../../emergency'
import { bed, counter, crashCart, supplyUnit, taskChair } from '../../erFurniture'
import { ivStand, ultrasound } from '../../erEquipment'
import { group, signPanel } from '../../erKit'
import type { OpdCtx } from '../ctx'
import {
  armchair, bench, cableLadder, detectorPillar, diningSet, distributionBoard, extinguishers, footstool, fridge, handRub, hoseReel, keyLockers, kitchenette, leafletRack, mats, mrSafeBay, networkRack, noticeBoard, pigeonholes, planter, platformScale, sanitiserStand, sideTable, tokenKiosk, totem, waterStation, wheelieBin,
} from '../equipment/common'
import {
  babyChanger, cisternDuct, cubicleRun, dropDownRail, exhaustGrille, floorDrain, grabRail, handDryerUnit, jumboRoll, mirror, pedalBin, pullCord, soapDispenser,
  handWashPoint, towelDispenser, urinalUnit, vanityTop, wallBasin, washroomSign, wcPan,
} from '../equipment/sanitary'
import {
  armChair, bariatricChair, bins, clock, computer, cupboard, curtain, desk, deskPhone, lockers, papers, poster, printer, rack, sofa, wallScreen, wheelchair, workbench,
} from '../furniture'
import { board, NAVY, tokenScreen } from '../paints'
import type { Fitter } from './types'

/*
 * The rooms the OPD repeats floor over floor, or that serve every department: the toilets and the
 * accessible WC stacked over one another on the south side, the riser, the glazed link, each upper
 * floor's reception hall and waiting lounge, the corridors' fire and hygiene points, and the staff,
 * utility, store and changing rooms. Facing: a group turned 0 faces +z, PI faces −z, PI/2 faces
 * +x, −PI/2 faces −x.
 */

const FACE = { '+z': 0, '-z': PI, '+x': PI / 2, '-x': -PI / 2 } as const

/** Each floor's waiting seating, one family per floor: upholstered, perforated steel, polypropylene. */
const SEATS: Record<number, 'upholstered' | 'perforated' | 'polypropylene'> = { 0: 'upholstered', 1: 'upholstered', 2: 'perforated', 3: 'polypropylene' }

/** A sign board on a wall, its art painted once per model. */
function wallSign(e: OpdCtx, p: Object3D, key: string, w: number, h: number, art: Parameters<OpdCtx['o']['sign']>[3], y: number) {
  signPanel(e, p, w, h, e.o.sign(key, Math.round(w * 400), Math.round(h * 400), art), 0, y, 0.012, 0, 0.012)
}

/* ---------- toilets ---------- */

/**
 * Public toilets on the south façade, the same on every floor: a row of compact-laminate WC
 * cubicles against the back wall in front of the tiled duct that hides their concealed cisterns
 * (the first enclosing the frosted lower half of the window), a solid-surface vanity of two
 * undermount basins under a bevelled mirror on the front wall, clear of the door's swing; the
 * hand dryer, towel dispenser, bins and the floor gully; the gents' a bank of three wall-hung
 * urinals with modesty screens.
 */
const toilets = (ladies: boolean): Fitter => (e, room) => {
  const name = `opd_${room.level}_${room.spec.id}`
  const n = ladies ? 3 : 2
  const cw = 0.95
  cubicleRun(e, room.at(room.x0, room.z0, 0), n, cw, 1.55, name, { ladies, endRight: true })
  const vlen = ladies ? 2.4 : 2.2
  const vx = room.x0 + 0.15 + vlen / 2
  const v = room.at(vx, room.z1, PI)
  vanityTop(e, v, vlen, [-vlen / 4, vlen / 4])
  room.info(v, { title: 'Washroom Vanity', kind: 'Sanitaryware', body: 'A cantilevered solid-surface vanity with undermount vitreous china bowls, infra-red sensor taps and deck-mounted soap pumps: no handles to touch, and the floor under it left clear for cleaning.', specs: ['Top at 820 mm, 550 mm deep', 'Sensor taps on a 6 l/min flow restrictor', 'Chrome bottle traps and angle valves', '6 mm bevelled mirror on clips'] })
  if (ladies) {
    towelDispenser(e, room.onWall('+z', room.x0 + 0.15 + vlen + 0.3), 0, 1.35)
    pedalBin(e, room.at(room.x0 + 0.15 + vlen + 0.3, room.z1 - 0.2), 0.15, 0.45)
    handDryerUnit(e, room.onWall('-z', room.x1 - 0.65), 0, 1.15)
  } else {
    const x0 = room.x0 + n * cw + 0.4
    for (let i = 0; i < 3; i++) {
      const u = room.at(x0 + i * 0.65, room.z0, 0)
      const body = urinalUnit(e, u, i < 2 ? 1 : 0)
      if (i === 0) room.info(body, { title: 'Wall-hung Urinal', kind: 'Sanitaryware', body: 'Vitreous china urinals with infra-red sensor flush valves, so nothing is touched, between compact-laminate modesty screens.', specs: ['Rim at 610 mm (one at 510 mm for children)', 'Sensor flush, 0.8 l per use', 'Concealed waste to the stack in the duct'] })
    }
    handDryerUnit(e, room.onWall('+z', room.x0 + 0.15 + vlen + 0.35), 0, 1.15)
    pedalBin(e, room.at(room.x0 + 0.15 + vlen + 0.35, room.z1 - 0.2), 0.15, 0.45)
  }
  floorDrain(e, room.at(room.x0 + 1.6, (room.z0 + 1.55 + room.z1 - 0.55) / 2))
  exhaustGrille(e, room.at(room.x0 + 1.4, room.z0 + 1.0), room.ceiling)
  exhaustGrille(e, room.at(room.x1 - 0.8, room.z1 - 1.2), room.ceiling)
  washroomSign(e, room.onWall('+z', room.x1 - 1.35), ladies ? 'ladies' : 'gents', 1.65)
}

/**
 * The accessible WC behind the lifts, as the Harmonised Guidelines draw it: a wall-hung WC with its
 * seat at 480 mm on a cistern duct, its centre 480 mm off the side wall; an L-shaped grab rail on
 * that wall and a hinged drop-down rail on the transfer side; the basin within reach of the WC,
 * at 800 mm with knee space and a lever mixer, under a tilted mirror; the roll holder in reach, the
 * emergency pull cord to the floor; a fold-down baby changer; the 1.5 m turning circle kept clear.
 */
const accessible: Fitter = (e, room) => {
  const wx = room.x1 - 0.48
  const duct = room.at(wx - 0.1, room.z1, PI)
  cisternDuct(e, duct, 1.1, 1.1, 0.2)
  const w = room.at(wx, room.z1 - 0.2, PI)
  const pan = wcPan(e, w, 0.48, 0.95)
  // The L-shaped rail on the side wall beside the WC (local x runs towards the back wall).
  const side = room.onWall('+x', room.z1 - 0.95)
  grabRail(e, side, 'accL', [[-0.05, 0.7, 0], [-0.05, 0.7, 0.07], [0.6, 0.7, 0.07], [0.6, 1.4, 0.07], [0.6, 1.4, 0]])
  jumboRoll(e, room.onWall('+x', room.z1 - 1.25), 0, 0.72)
  // The drop-down rail on the transfer side, folded down along the WC.
  dropDownRail(e, room.at(wx - 0.35, room.z1 - 0.2, PI), 0.75, 0.78)
  // The basin, in reach of the WC, on the back wall; its tilted mirror; dispensers beside it.
  const bx = room.x0 + 0.65
  wallBasin(e, room.onWall('+z', bx), 0.55, 0.8)
  mirror(e, room.onWall('+z', bx), 0.5, 0.75, 1.32, 0.1)
  soapDispenser(e, room.onWall('+z', bx + 0.42), 0, 1.05)
  towelDispenser(e, room.onWall('-x', room.z1 - 0.75), 0, 1.2)
  pedalBin(e, room.at(room.x0 + 0.25, room.z1 - 0.95), 0.13, 0.4)
  babyChanger(e, room.onWall('-x', room.z0 + 1.0), 0.95)
  pullCord(e, room.onWall('+x', room.z1 - 1.75), room.ceiling)
  floorDrain(e, room.at((room.x0 + room.x1) / 2, (room.z0 + room.z1) / 2 - 0.2))
  exhaustGrille(e, room.at(room.x0 + 0.6, room.z0 + 0.7), room.ceiling)
  washroomSign(e, room.onWall('-z', room.x0 + 0.5), 'accessible', 1.6)
  wallSign(e, room.onWall('-z', room.x1 - 0.5), 'accessibleAlarm', 0.3, 0.2, board('#ffffff', [['IN EMERGENCY', 0.22, '#c8161d'], ['PULL CORD', 0.3, '#c8161d']], { border: '#c8161d' }), 1.5)
  room.info(pan, { title: 'Accessible WC', kind: 'Universal toilet', body: 'A wheelchair-accessible toilet as the Harmonised Guidelines for accessibility require: the WC seat at 480 mm, 480 mm off the side wall with an L-shaped rail there and a drop-down rail on the transfer side, the basin within reach, an emergency pull cord that rings at the floor\'s nurses\' station, and a clear 1.5 m turning circle.', specs: ['Outward-opening 1.0 m door', 'Basin rim at 800 mm, knee space, lever mixer', 'Mirror tilted for a seated user', 'Fold-down baby-changing station'] })
}

/** The electrical and IT riser behind the stair. */
const riser: Fitter = (e, room) => {
  distributionBoard(e, room.at(room.x0 + 0.65, room.z1, PI), 0.8, 0.9, `DB-OPD-${room.level === 0 ? 'G' : room.level}`, 0.95)
  distributionBoard(e, room.at(room.x0 + 1.6, room.z1, PI), 0.6, 0.7, 'LIGHTING DB', 1.1)
  cableLadder(e, room.at(room.x0 + 2.45, room.z1, PI), 0.4, room.ceiling)
  networkRack(e, room.at(room.x0 + 0.4, room.z0 + 0.6, 0))
  room.info(room.group.children[0], { title: 'Electrical & IT Riser', kind: 'Building services', body: 'The floor\'s electrical riser: its main distribution board fed from the LT panel in the basement, the lighting board, the vertical cable ladder carrying power and data up the building, and the floor\'s network rack for the hospital information system.' })
}

/* ---------- the link ---------- */

/** The floor's departments, for the directory totem in the link. */
const DIRECTORY: Record<number, string[]> = {
  0: ['OPD Reception & Enquiry', 'Vaccination · OPD Insurance', 'Main Reception & Admissions →', 'Patient Services · Billing · Pharmacy →', 'Main lifts to wards, ICU, theatres'],
  1: ['OPD Consultations 101–103', 'Inpatient Rooms 101–107 →', 'Nurses\' Station →', 'Relatives\' Lounge →'],
  2: ['Digital X-ray 208–209', 'International Patient Wing →', 'ICU & Ventilator Rooms →', 'ICU Relatives\' Waiting →'],
  3: ['CT Scan 307–308', 'Operation Theatres 1–3 →', 'Pre-op · Recovery (PACU) →', 'OT Relatives\' Waiting →'],
}

const link: Fitter = (e, room) => {
  bench(e, room.at(room.cx - 0.25, room.z1 - 0.5, 0), 2.4)
  planter(e, room.at(room.x1 - 0.35, room.z1 - 0.4))
  const t = room.at(room.x0 + 0.35, room.z0 + 0.5, PI / 2)
  totem(e, t, `link${room.level}`, ['Ground Floor', 'First Floor', 'Second Floor', 'Third Floor'][room.level], DIRECTORY[room.level])
  room.info(t, { title: 'Floor Directory', kind: 'Wayfinding', body: 'The floor\'s directory: its departments and their room numbers, the lifts and the stairs. Each department is also signed from the corridors\' hanging signs.' })
  sanitiserStand(e, room.at(room.x1 - 0.35, room.z0 + 0.45, -PI / 2))
}

/* ---------- the waiting lounges ---------- */

const LOUNGE: Record<number, { title: string; rows: [string, string][]; second: { title: string; rows: [string, string][] } }> = {
  1: {
    title: 'Consultations · Now serving',
    rows: [['GM-014', 'Room 101 · General Medicine'], ['CA-006', 'Room 102 · Cardiology'], ['OR-011', 'Room 104 · Orthopaedics'], ['PD-009', 'Room 107 · Paediatrics'], ['EN-004', 'Room 108 · ENT']],
    second: { title: 'Consultations · Next', rows: [['GM-015', 'General Medicine'], ['NE-003', 'Neurology'], ['DE-007', 'Dermatology'], ['OG-005', 'Gynaecology'], ['SU-002', 'General Surgery']] },
  },
  2: {
    title: 'Sample Collection',
    rows: [['L-023', 'Collection Bay 1'], ['L-024', 'Collection Bay 2'], ['L-025', 'Collection Bay 3'], ['X-008', 'Room 209 · X-ray'], ['U-005', 'Room 205 · Ultrasound']],
    second: { title: 'Reports ready', rows: [['L-0911', 'Collect · Reception'], ['L-0912', 'Collect · Reception'], ['X-0412', 'Collect · Reception'], ['U-0207', 'Emailed'], ['L-0915', 'Emailed']] },
  },
  3: {
    title: 'Imaging & Cardiac',
    rows: [['CT-05', 'Room 308 · CT Scan'], ['MR-03', 'Room 312 · MRI screening'], ['EC-11', 'Room 305 · ECG'], ['EH-04', 'Room 304 · 2D Echo'], ['TM-02', 'Room 310 · TMT']],
    second: { title: 'Please wait', rows: [['CT-06', 'CT preparation'], ['MR-04', 'MRI screening'], ['EC-12', 'ECG'], ['EH-05', '2D Echo'], ['CC-03', 'Cardiac consultation']] },
  },
}

/** A wheelchair space: a blue rectangle on the floor with the access symbol. */
function wheelchairSpace(e: OpdCtx, p: Object3D, w: number, d: number) {
  const { k } = e
  k.box(p, w, 0.003, d, e.m.blue, 0, 0.014, 0, false)
  const s = k.box(p, w * 0.5, 0.002, w * 0.5, e.o.sign('wheelSym', 128, 128, (g, ww, hh) => {
    g.fillStyle = '#2462b0'
    g.fillRect(0, 0, ww, hh)
    g.strokeStyle = '#ffffff'
    g.lineWidth = ww * 0.07
    g.beginPath()
    g.arc(ww * 0.45, hh * 0.62, ww * 0.22, 0.3, PI * 1.75)
    g.stroke()
    g.fillStyle = '#ffffff'
    g.beginPath()
    g.arc(ww * 0.45, hh * 0.18, ww * 0.08, 0, PI * 2)
    g.fill()
    g.fillRect(ww * 0.42, hh * 0.26, ww * 0.08, hh * 0.32)
    g.fillRect(ww * 0.42, hh * 0.5, ww * 0.3, hh * 0.08)
  }), 0, 0.016, 0, false)
  s.rotation.y = 0
}

/**
 * The waiting lounge behind the curtain wall: rows of linked seating (navy vinyl) facing the
 * token displays, wheelchair spaces at the end of a row, a bariatric seat, a drinking water
 * station, leaflet racks and hand sanitiser; on the second floor a report printing kiosk; on the
 * third, rows turned to face the displays on the back wall and recliners for patients prepared
 * for a scan.
 */
const lounge: Fitter = (e, room) => {
  const L = LOUNGE[room.level]
  if (!L) return
  const screen = e.o.screen(`lounge${room.level}`, 1024, 576, tokenScreen(L.title, L.rows, 811 + room.level))
  const second = e.o.screen(`lounge${room.level}b`, 1024, 576, tokenScreen(L.second.title, L.second.rows, 823 + room.level))
  const seats: Object3D[] = []
  if (room.level < 3) {
    // Rows along the depth, facing the displays on the wing's wall (+x), a cross aisle at z ≈ 9.3.
    const xs = [2.4, 4.0, 5.6, 7.2, 8.8]
    for (const [i, x] of xs.entries()) {
      const a = room.at(x, 7.4, FACE['+x'])
      beamSeating(e, a, 4, SEATS[room.level])
      seats.push(a)
      if (i < xs.length - 1) beamSeating(e, room.at(x, 11.2, FACE['+x']), 4, SEATS[room.level])
      else {
        beamSeating(e, room.at(x, 11.82, FACE['+x']), 2, SEATS[room.level])
        wheelchairSpace(e, room.at(x + 0.1, 10.5, FACE['+x']), 0.9, 1.3)
      }
    }
    const d1 = room.onWall('+x', 7.6)
    wallScreen(e, d1, 1.4, 2.05, screen)
    room.info(d1, { title: 'Token Display', kind: 'Patient queue management', body: 'The lounge\'s token display, fed by the queue management system: each patient\'s token, issued at registration, is called to the room and counter that will see them, with a chime and an announcement in English, Telugu and Hindi.' })
    const d2 = room.onWall('+x', 9.8)
    wallScreen(e, d2, 1.0, 2.0, second)
    leafletRack(e, room.onWall('+x', 9.8), 1.1)
    sanitiserStand(e, room.at(room.x1 - 0.3, 6.4, -PI / 2))
    // The sliver by the link: a bariatric seat, a low table, a chair.
    bariatricChair(e, room.at(1.45, 12.3, FACE['+x']))
    sideTable(e, room.at(1.45, 11.3))
    armChair(e, room.at(1.45, 10.3, FACE['+x']))
    sanitiserStand(e, room.at(1.35, 9.3, FACE['+x']))
    if (room.level === 1) {
      const w = room.at(room.x1, 12.2, -PI / 2)
      waterStation(e, w)
      room.info(w, { title: 'Drinking Water Station', kind: 'Patient amenity', body: 'Reverse-osmosis purified water, chilled and at room temperature, with paper cups; refilled and sanitised by housekeeping on every shift.' })
    } else {
      const w = room.at(9.0, room.z0, 0)
      waterStation(e, w)
      const kiosk = room.at(room.x1 - 0.35, 12.2, -PI / 2)
      tokenKiosk(e, kiosk, e.m.kiosk)
      room.info(kiosk, { title: 'Report Printing Kiosk', kind: 'Self-service', body: 'Patients print their laboratory and imaging reports here by scanning the barcode on their bill or entering their UHID and registered mobile number; reports are also sent by SMS and e-mail.' })
    }
  } else {
    // The third floor: rows across, facing the displays on the back wall.
    for (const [i, z] of [6.4, 8.0, 9.6, 11.2].entries()) {
      beamSeating(e, room.at(3.84, z, PI), 4, SEATS[room.level])
      if (i < 3) beamSeating(e, room.at(7.54, z, PI), 4, SEATS[room.level])
      else wheelchairSpace(e, room.at(7.2, z, PI), 1.3, 0.9)
    }
    const d1 = room.onWall('-z', 5.5)
    wallScreen(e, d1, 1.4, 2.05, screen)
    room.info(d1, { title: 'Token Display', kind: 'Patient queue management', body: 'Imaging and cardiac tokens called to their rooms. MRI and CT patients are first called to preparation and screening; their scan follows when the radiographer is ready.' })
    wallScreen(e, room.onWall('-z', 8.95), 1.0, 2.0, second)
    leafletRack(e, room.onWall('+x', 7.6), 1.15)
    sanitiserStand(e, room.at(room.x1 - 0.3, 6.4, -PI / 2))
    for (const z of [9.9, 11.0]) armChair(e, room.at(1.45, z, FACE['+x']), mats(e).fabricTeal)
    sideTable(e, room.at(1.45, 12.1))
    waterStation(e, room.at(room.x1, 12.2, -PI / 2))
  }
  room.info(seats[0] ?? room.group, { title: room.name, kind: 'Waiting area', body: 'Linked beam seating in wipe-clean navy vinyl on powder-coated beams, arranged in rows with 1.8 m aisles so wheelchairs and stretchers pass, with spaces kept for wheelchair users beside their companions.' })
}

/** The strip along the curtain wall: seats facing the view, out over the garden and the road. */
const loungeFront: Fitter = (e, room) => {
  for (const x of [3.8, 8.4]) beamSeating(e, room.at(x, room.z0 + 0.3, 0), 5, SEATS[room.level])
}

/* ---------- the floors' reception halls ---------- */

const RECEPTION: Record<number, { title: string; sub: string; screen: [string, [string, string][]]; his: [string, string]; len: number }> = {
  1: { title: 'OPD CONSULTATION RECEPTION', sub: 'Consultation desk · Tokens · Appointments', screen: ['Consultations', [['GM-014', 'Room 101'], ['CA-006', 'Room 102'], ['NE-002', 'Room 103'], ['GM-015', 'Room 101'], ['CA-007', 'Room 102']]], his: ['OPD Registration · Consultation tokens', 'Appointments · Today'], len: 2.6 },
  2: { title: 'X-RAY REGISTRATION & HELP DESK', sub: 'X-ray booking · Billing · Report collection', screen: ['Digital X-ray', [['X-008', 'X-ray · 209'], ['X-009', 'X-ray · 209'], ['X-010', 'X-ray · 209'], ['R-004', 'Report desk'], ['X-011', 'X-ray · 209']]], his: ['RIS · X-ray booking & billing', 'Reports · Dispatch status'], len: 2.8 },
  3: { title: 'CT SCAN RECEPTION', sub: 'CT booking · Contrast consent · Appointments', screen: ['CT Scan', [['CT-05', 'CT · 308'], ['CT-06', 'CT · 308'], ['CT-07', 'CT · 308'], ['CT-08', 'CT · 308'], ['R-002', 'Report desk']]], his: ['RIS · Scan scheduling', 'Contrast safety screening'], len: 2.6 },
}

/**
 * An upper floor's reception hall in the tower's front: the counter against the stair's wall
 * (to the left as one comes out of the lift lobby), its sign over it, a token kiosk by the
 * corridor's mouth, the token display on the lifts' wall, rows of seating facing them, a
 * wheelchair ready by the windows.
 */
const reception: Fitter = (e, room) => {
  const { k, m } = e
  const R = RECEPTION[room.level]
  if (!R) return
  const cx = -11.0 + R.len / 2
  const g = room.at(cx, room.z0 + 1.12, 0)
  const half = R.len / 2
  counter(e, g, R.len, [-half + 0.3, 0.05], [half - 0.9, half - 0.1])
  const scr = [e.o.his(`rec${room.level}a`, R.his[0], 'form'), e.o.his(`rec${room.level}b`, R.his[1], 'table')]
  for (const [i, x] of [-half + 0.7, 0.45].entries()) {
    workstation(e, g, x, 0.765, 0.05, PI + (i ? 0.08 : -0.08), scr[i])
    taskChair(e, group(g, x + 0.1, 0, -0.66, i ? -0.25 : 0.2))
    k.box(g, 0.08, 0.04, 0.15, m.darkPlastic, x + 0.3, 1.14, 0.62)
  }
  deskPhone(e, g, -0.1, 0.765, 0.15, PI)
  printer(e, g, half - 0.35, 0.765, -0.05, PI)
  if (room.level === 3) {
    // The contrast safety questionnaire on its clipboard, the preparation leaflets in their holder.
    k.box(g, 0.24, 0.006, 0.33, m.paper, -half + 0.4, 1.125, 0.6, false)
    k.box(g, 0.25, 0.008, 0.35, e.o.oak, -half + 0.4, 1.12, 0.6, false)
    for (let i = 0; i < 3; i++) k.box(g, 0.1, 0.22, 0.02, [m.blue, m.green, m.purple][i], -0.6 + i * 0.12, 1.24, 0.62)
  }
  if (room.level === 2) for (let i = 0; i < 3; i++) k.box(g, 0.24, 0.32, 0.02, m.vacuum, half - 1.2 + i * 0.05, 0.9, -0.2 + i * 0.03, false)
  room.info(g, {
    title: room.level === 1 ? 'OPD Consultation Reception' : room.level === 2 ? 'X-ray Registration & Help Desk' : 'CT Scan Reception',
    kind: 'Reception counter',
    body: room.level === 1
      ? 'Where patients for the floor\'s consultations check in: the clerks confirm the appointment, take the consultation fee if it was not paid downstairs, issue the token for the doctor\'s room and send the patient for vitals before the consultation.'
      : room.level === 2
        ? 'X-ray booking and billing for walk-in and referred patients, X-ray tokens, help with preparation, and the collection of printed reports and films.'
        : 'Scheduling and arrival for CT scans: the contrast safety questionnaire and consent are completed here with the patient, renal function and allergies checked, and preparation instructions explained.',
    specs: ['Solid-surface counter with a transaction ledge at 1.1 m and a 0.8 m wheelchair section', 'Two hospital information system workstations, token and label printers', 'Card and UPI payment terminals'],
  })
  // The sign over it, on the stair's wall.
  wallSign(e, room.onWall('-z', cx), `recsign${room.level}`, Math.min(3.2, R.len + 0.4), 0.46, board(NAVY, [[R.title, 0.3, '#ffffff'], [R.sub, 0.17, '#c7d3e6', 500]], { cross: true }), 2.4)
  // The token display on the lifts' wall, the kiosk at the corridor's mouth.
  const disp = room.onWall('-z', -3.75)
  wallScreen(e, disp, 1.2, 2.15, e.o.screen(`recscreen${room.level}`, 1024, 576, tokenScreen(R.screen[0], R.screen[1], 701 + room.level)))
  room.info(disp, { title: 'Token Display', kind: 'Patient queue management', body: 'Called tokens and the rooms they go to, repeated in the waiting lounge; the clerk can recall a token or move a patient up the queue for the elderly, the disabled and pregnant women.' })
  const kiosk = room.at(-7.85, room.z0 + 0.45, 0)
  tokenKiosk(e, kiosk, e.m.kiosk)
  room.info(kiosk, { title: 'Token Kiosk', kind: 'Self-service', body: 'Patients with a booked appointment scan their appointment SMS or enter their UHID to print their token for the floor; others take a token here for the reception counter.' })
  // Rows of seats facing the counter and the display.
  const n = room.level === 3 ? 5 : 6
  for (const z of room.level === 3 ? [7.6, 9.2] : [7.4, 8.9, 10.4]) beamSeating(e, room.at(-8.9, z, PI), n, SEATS[room.level])
  if (room.level === 3) {
    bariatricChair(e, room.at(-10.7, 10.7, PI))
    wheelchairSpace(e, room.at(-9.4, 10.75, PI), 0.9, 1.3)
  }
  wheelchair(e, room.at(room.x1 - 0.5, room.z1 - 0.7, -PI / 2))
  clock(e, room.onWall('+z', -4.2), 2.45)
}

/* ---------- corridors ---------- */

/** Fire points by the stair, hand rub at the junctions; nothing else stands in a corridor. */
const corridor: Fitter = (e, room) => {
  const id = room.spec.id
  if (id === 'corridorS') {
    const h = room.onWall('-x', 0.3)
    hoseReel(e, h)
    room.info(h, { title: 'Fire Hose Reel', kind: 'Fire protection', body: 'A first-aid hose reel on the floor\'s wet riser, 30 m of 19 mm hose, beside the stair as the National Building Code places it; with a pair of extinguishers (ABC powder and CO₂ for electrical fires) next to it.' })
    extinguishers(e, room.onWall('-x', 1.45))
    handRub(e, room.onWall('-x', -1.9))
  } else if (id === 'corridorC1') handRub(e, room.onWall('+z', -4.3))
  else if (id === 'corridorN') handRub(e, room.onWall('+x', -8.3))
}

/* ---------- staff rooms ---------- */

/** The first floor's staff pantry: a kitchenette and fridge, a table for four, a sofa, lockers. */
const pantry: Fitter = (e, room) => {
  kitchenette(e, room.onWall('-x', 1.5), 2.4)
  fridge(e, room.onWall('-x', 3.3))
  diningSet(e, room.at(-0.55, -1.0), 1.2, 0.8, 4)
  sofa(e, room.at(room.x1 - 0.45, 1.8, -PI / 2), 2)
  lockers(e, room.at(room.x1 - 0.5, -1.7, -PI / 2), 3)
  noticeBoard(e, room.onWall('+z', -0.5))
  bins(e, room.at(room.x0 + 0.25, -2.1, PI / 2), ['green', 'black'])
}

/** A narrow staff room (the laboratory's, imaging's): lockers, a table for four, a kitchenette, a sofa at the end. */
const staffRoom = (lab: boolean): Fitter => (e, room) => {
  lockers(e, room.at(room.x0 + 0.5, -1.5, PI / 2), 4)
  diningSet(e, room.at(8.45, 1.0), 0.7, 0.7, 4)
  kitchenette(e, room.onWall('+x', 1.2), 2.4)
  fridge(e, room.onWall('+x', -0.4))
  sofa(e, room.at(room.cx, room.z1 - 0.45, PI), 2)
  noticeBoard(e, room.onWall('-x', 2.4), 0.9)
  poster(e, room.onWall('-x', -2.9), lab ? 'Lab safety rules' : 'Radiation safety', lab ? '#1f9d55' : '#f08a00', 0.36, 0.5, 1.55)
  bins(e, room.at(room.x1 - 0.25, -2.6, -PI / 2), ['green', 'black'])
}

/* ---------- clean utility and stores ---------- */

/** The first floor's clean utility and medical supply room. */
const cleanUtility: Fitter = (e, room) => {
  const units: Object3D[] = []
  for (const x of [-3.8, -2.85, -1.9]) {
    const u = room.at(x, room.z1 - 0.55, PI)
    supplyUnit(e, u, 0.94)
    units.push(u)
  }
  for (const z of [-16.8, -14.8]) rack(e, room.at(room.x0 + 0.5, z, PI / 2), 1.8, 2.0, 0.5, 5, 'supplies')
  const iv = room.at(room.x1 - 0.5, -16.0, -PI / 2)
  rack(e, iv, 1.8, 1.8, 0.5, 4, 'medicines')
  wallSign(e, room.onWall('+x', -16.0), 'ivfluids', 0.6, 0.15, board(NAVY, [['IV FLUIDS · DISPOSABLES', 0.4, '#ffffff']]), 2.05)
  linenTrolley(e, room.at(-0.6, room.z0 + 0.35))
  handWashPoint(e, room.onWall('-z', 0.6))
  room.info(units[1], { title: 'Clean Supply Units', kind: 'Sterile store', body: 'Sterile and clean consumables for the floor\'s consultation and dressing rooms: dressings, syringes, cannulas, catheters and gloves in labelled drawers, topped up daily by the central store on a par-level system, first-expiry first-out.', specs: ['Drawers that open', 'Glazed wall cupboards over the worktop', 'IV fluids and disposables racked separately'] })
}

const cleanUtilitySmall: Fitter = (e, room) => {
  const u = room.at(-1.3, room.z1 - 0.55, PI)
  supplyUnit(e, u, 0.94)
  rack(e, room.at(room.x0 + 0.45, -1.6, PI / 2), 1.4, 2.0, 0.45, 5, 'supplies')
  linenTrolley(e, room.at(room.x1 - 0.3, -0.9, PI / 2))
  handWashPoint(e, room.onWall('+x', -2.0))
  room.info(u, { title: 'Clean Utility', kind: 'Sterile store', body: 'The diagnostics floor\'s clean consumables: vacutainers, needles, swabs and dressings for the collection bays, ultrasound gel and probe covers, linen for the couches.' })
}

/** The equipment stores: wheelchairs, IV stands, a stretcher, a covered ultrasound, boxed equipment on racks. */
const equipmentStore: Fitter = (e, room) => {
  const { k, m } = e
  if (room.level === 2) {
    rack(e, room.at(room.x0 + 0.45, -23.3, PI / 2), 3.6, 2.0, 0.45, 5, 'supplies')
    for (const z of [-25.3, -24.9]) ivStand(e, room.at(room.x1 - 0.3, z), false)
    wheelchair(e, room.at(room.x1 - 0.42, -22.4, PI))
    return
  }
  const r = room.at(12.0, room.z0 + 0.5, 0)
  rack(e, r, 2.4, 2.0, 0.5, 5, 'supplies')
  bed(e, room.at(12.2, -14.8, PI / 2), { back: 0, linen: 'sheet', height: 0.62, railsDown: true })
  for (const z of [-16.8, -16.1]) wheelchair(e, room.at(13.15, z, -PI / 2))
  crashCart(e, room.at(11.1, -17.0, 0), e.m.monitors[5])
  const us = room.at(12.0, -16.2, PI / 2)
  ultrasound(e, us)
  k.soft(us, 0.62, 1.45, 0.72, 0.08, m.sheet, 0, 0.75, 0)
  for (const x of [10.45, 10.75]) ivStand(e, room.at(x, -17.7), false)
  room.info(r, { title: 'Equipment Store', kind: 'Store', body: 'Spare and standby equipment for the imaging and cardiac floor: wheelchairs and a stretcher, IV stands, a covered portable ultrasound, the floor\'s crash cart, and boxed accessories and consumables racked by department.' })
}

/**
 * The biomedical waste store: the floor's segregated waste in lidded wheeled bins by category, a
 * platform scale for weighing it out to the authorised operator, the register, the signage.
 */
const bmwStore: Fitter = (e, room) => {
  const { k, m } = e
  const kinds: [Material, string][] = [[m.sharps, 'YELLOW · Anatomical'], [m.red, 'RED · Plastics'], [m.whitePlastic, 'WHITE · Sharps'], [m.blue, 'BLUE · Glassware']]
  const bins0: Object3D[] = []
  kinds.forEach(([mat, label], i) => {
    const b = room.at(room.x0 + 0.38, room.z0 + 0.4 + i * 0.66, PI / 2)
    wheelieBin(e, b, mat, label)
    bins0.push(b)
  })
  const s = room.at(room.cx + 0.15, -22.3)
  platformScale(e, s)
  const shelf = room.onWall('+x', -23.8)
  k.box(shelf, 0.5, 0.025, 0.3, m.galvanised, 0, 1.0, 0.15)
  k.box(shelf, 0.3, 0.04, 0.22, m.blue, 0, 1.035, 0.15)
  wallSign(e, room.onWall('+x', -24.8), 'bmwSign', 0.45, 0.6, board('#f7d117', [['BIOHAZARD', 0.12, '#111'], ['BIO-MEDICAL', 0.08, '#111'], ['WASTE STORE', 0.08, '#111'], ['Authorised staff only', 0.055, '#c8161d', 500]], { border: '#111' }), 1.6)
  floorDrain(e, room.at(room.cx, -21.4))
  k.cyl(room.group, 0.02, 0.02, 0.12, m.chrome, room.x1 - 0.05, room.y + 0.6, -21.2, 10).rotation.z = PI / 2
  room.info(bins0[0], { title: 'Biomedical Waste Store', kind: 'Bio-Medical Waste Management Rules, 2016', body: 'Waste segregated at source on the floor is brought here in closed bins: yellow for soiled dressings and anatomical waste, red for contaminated plastics and tubing, white puncture-proof containers for sharps, blue for broken glass and vials. It is weighed, logged and handed over daily to the authorised common treatment facility; nothing is kept beyond 48 hours.', specs: ['Lidded 240 L wheeled bins, colour-coded and labelled', 'Platform scale and register', 'Washable tiled walls and floor drain'] })
  room.info(s, { title: 'Waste Weighing Scale', kind: 'Store', body: 'Each category of waste is weighed before handover and entered in the register and the online BMW tracking system with its barcode.' })
}

/* ---------- small rooms on the wing's end ---------- */

/** The breastfeeding and baby-care room: two nursing chairs behind a curtain, a changing station and a sink. */
const feeding: Fitter = (e, room) => {
  const { k, m } = e
  const ch = room.at(12.9, room.z0 + 0.55, 0)
  cupboard(e, ch, 0.8, 0.86, 0.55, { fill: 'linen', shelves: 1, label: 'Changing Station' })
  k.soft(ch, 0.76, 0.1, 0.52, 0.04, m.blanket, 0, 0.92, -0.27)
  for (const s of [-1, 1]) k.soft(ch, 0.04, 0.12, 0.52, 0.015, m.blanket, s * 0.38, 0.98, -0.27)
  room.info(ch, { title: 'Baby Changing Station', kind: 'Mother & baby', body: 'A padded changing top with raised edges over a cupboard of diapers, wipes and spare linen; a lidded nappy bin beside it.' })
  handWashPoint(e, room.onWall('-x', 6.4))
  for (const z of [7.5, 9.7]) {
    armchair(e, room.at(room.x1 - 0.5, z, -PI / 2), 0.62, mats(e).fabricTeal)
    footstool(e, room.at(room.x1 - 1.25, z, -PI / 2), mats(e).fabricTeal)
    sideTable(e, room.at(room.x1 - 0.32, z - 0.85))
  }
  curtain(e, room.at(room.x0, 8.6, 0), room.x1 - room.x0, room.ceiling, 0.85)
  bins(e, room.at(12.2, room.z0 + 0.3), ['black'])
  poster(e, room.onWall('-x', 8.6), 'Breastfeeding', '#c2185b', 0.4, 0.56, 1.5)
}

/** Patients' changing for ECG, echo and TMT: three curtained cubicles, gown cupboard, lockers, mirror. */
const cardiacChanging: Fitter = (e, room) => {
  const { k, m } = e
  const c = mats(e)
  const x0 = room.x1 - 1.2
  for (const z of [5.6, 6.8, 8.0, 9.2]) k.box(room.group, 1.2, 1.85, 0.013, c.partition, x0 + 0.6, room.y + 0.15 + 0.925, z)
  ;[0.35, 1, 0.3].forEach((drawn, i) => {
    const z = 5.6 + i * 1.2
    curtain(e, room.at(x0, z, -PI / 2), 1.2, room.ceiling, drawn)
    bench(e, room.at(room.x1 - 0.25, z + 0.6, -PI / 2), 0.9)
    k.box(room.group, 0.03, 0.03, 0.06, m.chrome, room.x1 - 0.3, room.y + 1.7, z + 0.04)
  })
  const g = room.at(12.9, room.z0 + 0.45, 0)
  cupboard(e, g, 0.9, 1.8, 0.45, { fill: 'linen', glass: true, label: 'Gown Cupboard' })
  room.info(g, { title: 'Patient Gowns', kind: 'Changing', body: 'Clean, ironed gowns by size; patients change into them for ECG, 2D echo and the treadmill test, which need the chest uncovered, and leave their clothes in a locker.' })
  lockers(e, room.at(12.4, room.z1 - 0.5, PI), 4)
  const mir = room.onWall('-x', 8.4)
  k.box(mir, 0.5, 1.2, 0.01, c.mirror, 0, 1.35, 0.006, false)
  bins(e, room.at(room.x0 + 0.3, 6.6, PI / 2), ['blue'])
  poster(e, room.onWall('-x', 7.0), 'Please change into a gown', NAVY, 0.36, 0.5, 1.55)
}

/** Report preparation and dispatch: desks along the window, pigeonholes of envelopes, printers, a sealing bench. */
const reportPrep: Fitter = (e, room) => {
  const { k, m } = e
  for (const [i, z] of [6.4, 8.0, 9.6].entries()) {
    const d = room.at(room.x1 - 0.33, z, PI / 2)
    desk(e, d, 1.5, 0.65, i === 1 ? -1 : 1)
    computer(e, d, 0.15, 0.75, -0.05, PI, e.o.his(`report${i}`, i === 0 ? 'LIS · Report verification' : i === 1 ? 'Report dispatch · SMS / e-mail' : 'RIS · Report print queue', i === 1 ? 'table' : 'form'))
    papers(e, d, -0.45, 0.75, 0.05, PI)
    taskChair(e, group(d, 0.1, 0, -0.62, 0.15 - i * 0.1))
  }
  const base = room.at(room.x0 + 0.4, 8.0, PI / 2)
  cupboard(e, base, 1.3, 0.88, 0.4, { fill: 'files', shelves: 1 })
  const ph = room.onWall('-x', 8.0)
  pigeonholes(e, ph, 5, 6, 0.9)
  room.info(ph, { title: 'Report Pigeonholes', kind: 'Dispatch', body: 'Verified and signed reports, printed and sealed in the hospital\'s envelopes, filed by patient token here until they are collected at the diagnostics desk; most are also sent by SMS and e-mail as soon as they are signed.' })
  const pr = room.at(room.x0 + 0.5, 9.85, PI / 2)
  cupboard(e, pr, 0.8, 0.75, 0.5, { fill: 'none', shelves: 1 })
  printer(e, pr, 0, 0.75, -0.25)
  const wb = room.at(room.x0 + 0.55, 6.3, PI / 2)
  workbench(e, wb, 1.0, 0.55, 0.9)
  k.box(wb, 0.32, 0.12, 0.25, m.greyPlastic, -0.25, 0.96, -0.3)
  for (let i = 0; i < 4; i++) k.box(wb, 0.26, 0.004, 0.33, i % 2 ? m.paper : mats(e).envelope, 0.2, 0.905 + i * 0.006, -0.28, false)
  bins(e, room.at(room.x0 + 0.25, 7.2, PI / 2), ['black'])
}

/* ---------- the MRI zone ---------- */

/**
 * MRI Zone III, past the access door on the back corridor: the ferromagnetic detector at the door,
 * lockers for metal objects, an MR-safe wheelchair parked in its green bay at the corridor's end,
 * the zone's signs and the red line before the magnet room's door.
 */
const mriZone: Fitter = (e, room) => {
  const { k, m } = e
  const pillar = room.at(-0.15, room.z1 - 0.15, PI)
  detectorPillar(e, pillar)
  room.info(pillar, { title: 'Ferromagnetic Detector', kind: 'MRI safety', body: 'A ferromagnetic detection pillar at the entrance to MRI Zone III: it sounds if anyone carries a magnetic object (a phone, keys, a hairpin, an oxygen cylinder) past it, the last check before the magnet room. It supplements, never replaces, the screening questionnaire.', specs: ['Passive, always on', 'Alerts with light and sound', 'Zone III: screened patients and MR personnel only'] })
  const lk = room.at(1.2, room.z0, 0)
  keyLockers(e, lk, 2, 4)
  room.info(lk, { title: 'Metal-object Lockers', kind: 'MRI safety', body: 'Patients and escorts leave phones, wallets, keys, cards, jewellery and hairpins here before going on, the key on its plastic band staying with them.' })
  const bay = room.at(12.9, -19.0, -PI / 2)
  mrSafeBay(e, bay, 1.1, 1.0)
  wheelchair(e, room.at(12.9, -19.0, -PI / 2))
  k.box(room.group, 0.12, 0.08, 0.004, e.o.sign('mrSafeTag', 96, 64, board('#1f9d55', [['MR SAFE', 0.5, '#ffffff']])), 12.6, room.y + 0.75, -19.0, false).rotation.y = -PI / 2
  ivStand(e, room.at(13.35, -20.2), false)
  for (const x of [4.0, 10.6]) wallSign(e, room.onWall('-z', x), `zone3_${x}`, 0.7, 0.3, board('#f7d117', [['MRI ZONE III', 0.34, '#111'], ['Screened persons only beyond this point', 0.14, '#111', 500]], { border: '#111' }), 1.75)
  // The red line on the floor at the magnet room's door: Zone IV beyond it.
  k.box(room.group, 1.5, 0.003, 0.08, m.red, 8.3, room.y + 0.014, room.z0 + 0.6, false)
}

export const COMMON: Record<string, Fitter> = {
  toilet_f: toilets(true),
  toilet_m: toilets(false),
  wc_accessible: accessible,
  riser,
  link,
  lounge,
  loungeFront,
  reception_1: reception,
  reception_2: reception,
  reception_3: reception,
  corridor,
  pantry,
  staff_room: staffRoom(false),
  lab_staff: staffRoom(true),
  clean_utility: cleanUtility,
  clean_utility_small: cleanUtilitySmall,
  equipment_store: equipmentStore,
  bmw_store: bmwStore,
  feeding,
  cardiac_changing: cardiacChanging,
  report_prep: reportPrep,
  mri_zone: mriZone,
}

