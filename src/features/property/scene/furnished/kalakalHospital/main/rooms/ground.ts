import { PI } from '../../../kit'
import { beamSeating, workstation } from '../../emergency'
import { taskChair, visitorChair, wheelchair } from '../../erFurniture'
import { group } from '../../erKit'
import type { OpdCtx, Room } from '../../opd/ctx'
import {
  bulkRack, cashDrawer, dispTray, keyCabinet, noteCounter, payTerminal, photocopier, receiptPrinter, roundTable, sign,
  stripCabinet, tokens, medicineShelves, extinguisher, waterCooler,
} from '../../opd/equipment/ground'
import { coffeeTable, compactor, scanner as docScanner, sofa as loungeSofa } from '../../opd/equipment/clinical'
import { leafletRack, planter, sanitiserStand, handRub, noticeBoard } from '../../opd/equipment/common'
import { barcodeScanner } from '../../opd/equipment/items'
import { baseRun, bins, bottle, computer, cupboard, desk, deskPhone, fileCabinet, medFridge, papers, poster, printer, stool, wallScreen, workbench } from '../../opd/furniture'
import { direction } from '../../opd/paints'
import type { Fitter } from '../../opd/rooms/types'
import {
  brandWall, cctvDome, chargingStation, deskSign, directoryBoard, floorSafe, hungDisplay, hungSign, loungeChair, narcoticsCabinet,
  privacyScreen, queueRun, receptionDesk, wallCharger, welcomePaint, wheelchairBay, workRun,
} from '../equipment/ground'
import { wallClock } from '../kit'

/*
 * The main block's ground floor, front of house. Behind the main entrance, the main lobby: the
 * main reception counter before the hospital's name on an oak-slatted wall (the basement core's
 * face), the security and help desk by the doors, a few lounge chairs; admissions beside it. Behind
 * the lifts, the patient help desk. South of the front corridor, the patient services hall: the
 * insurance and billing counters on its west side, the cash counter on its east, the pharmacy's
 * dispensing windows across its end; the pharmacy, its store and medical records behind them; the
 * hospital administration at the back. Plan coordinates as in ../../opd/plan.ts (+x north, +z
 * east, towards the road).
 */

/* ---------- the main lobby ---------- */

const lobby: Fitter = (e, room) => {
  const { o } = e
  const z0 = room.z0
  // The feature wall on the core's face between the bed lift and the stair door, the hospital's
  // name lit across it; the token display and the welcome screen on it either side, over the staff.
  const bw = room.onWall('-z', 6.15)
  brandWall(e, bw, 4.0, 3.45, 2.85, 3.0)
  const tok = tokens(e, 'mainrec', 'Main Reception', [['R-104', 'Counter 2 · Registration'], ['E-061', 'Counter 1 · Enquiry'], ['R-103', 'Counter 3 · Registration'], ['A-018', 'Admissions · Desk 1']], 9301)
  wallScreen(e, group(bw, 1.35, 0, 0.06), 1.05, 1.95, tok)
  const welcome = o.screen('m_welcome', 768, 432, welcomePaint('Welcome to Terranova Hospital', [
    ['Visiting hours', '11 am – 1 pm  ·  4 pm – 7 pm'],
    ['OPD timings', 'Mon – Sat  ·  8 am – 8 pm'],
    ['Pharmacy', 'Open 24 hours  ·  Services hall'],
    ['Health check-ups', 'Ask at Counter 1 for packages'],
  ]), 0.85)
  wallScreen(e, group(bw, -1.35, 0, 0.06), 1.05, 1.95, welcome)
  room.info(bw, {
    title: 'Main Reception Feature Wall',
    kind: 'Wayfinding · Hospital identity',
    body: 'The hospital\'s name in internally lit channel letters on an oak-batten wall, faced towards the entrance so that it is the first thing a visitor sees; the token display and the welcome screen either side keep the queue and the day\'s timings in view.',
    specs: ['Acrylic-faced channel letters, LED lit, 25 mm returns', 'Solid oak battens on a black ground, fire-retardant treated', '55" token display linked to the counters\' calling system', 'Welcome screen with visiting hours and OPD timings'],
  })

  // The main reception counter in front of it: 4 m, the lowered section at the west end towards
  // the lifts and the wheelchair bay, four positions; staff behind it with their backs to the wall.
  const rc = room.at(6.15, z0 + 1.48, 0)
  receptionDesk(e, rc, 4.0, { low: [-1.95, -1.08], pedestals: [-0.98, 0.0, 1.0] })
  const stations: [number, string, 'form' | 'table'][] = [[-1.5, 'Patient Registration · Assisted', 'form'], [-0.48, 'Enquiry · Doctor Schedule', 'table'], [0.5, 'Patient Registration · UHID', 'form'], [1.5, 'Registration · Appointments', 'form']]
  stations.forEach(([x, title, kind], i) => {
    const y = i === 0 ? 0.78 : 0.75
    computer(e, rc, x, y, i === 0 ? -0.02 : 0.02, PI + (i === 0 ? 0.25 : (i - 2) * 0.06), o.his(`m_rec${i}`, title, kind))
    taskChair(e, group(rc, x + (i % 2 ? 0.05 : -0.04), 0, -0.88 + (i % 2) * 0.06, (i - 1.5) * 0.12))
  })
  deskPhone(e, rc, -0.98, 0.75, 0.08, PI + 0.2)
  deskPhone(e, rc, 0.02, 0.75, 0.08, PI - 0.15)
  printer(e, rc, 1.0, 0.75, 0.04, PI)
  receiptPrinter(e, rc, 1.86, 0.75, 0.1, PI)
  papers(e, rc, -1.75, 0.78, -0.25, PI + 0.3)
  papers(e, rc, 0.95, 0.75, -0.3, PI - 0.1)
  // On the public ledge: the sections' signs, card / UPI terminals, a pen stand.
  deskSign(e, rc, 'enquiry', 'ENQUIRY', 'Information · Doctors · Health checks', -0.48, 1.08, 0.36)
  deskSign(e, rc, 'regn', 'REGISTRATION', 'New patients · UHID cards', 1.0, 1.08, 0.36)
  deskSign(e, rc, 'assist', 'ASSISTED COUNTER', 'Wheelchair users · Senior citizens', -1.5, 0.78, 0.52, 0, 0.3)
  payTerminal(e, rc, 0.5, 1.08, 0.3, 0.2)
  payTerminal(e, rc, 1.62, 1.08, 0.3, -0.1)
  e.k.cyl(rc, 0.03, 0.03, 0.09, e.m.stainless, 0.1, 1.125, 0.32, 14)
  room.info(rc, {
    title: 'Main Reception & Registration',
    kind: 'Front office · Patient registration',
    body: 'Every visit to the main hospital begins here: new patients are registered and issued a UHID card, enquiries about doctors, departments and health check-ups are answered, appointments are booked, and patients for admission are sent on to the admission desk beside the lobby. The west end of the counter is lowered for wheelchair users and seated patients.',
    specs: ['Four HIS workstations: enquiry, registration, appointments', 'Lowered 780 mm assisted counter with knee space', 'Token calling linked to the display behind', 'Card and UPI payment at the counter', 'Staffed 24 hours; enquiry by phone on extension 100'],
  })

  // The security and patient-relations desk inside the doors, facing them across the entrance.
  const sx = room.x0 + 1.35
  const sd = room.at(sx, room.z1 - 0.95, PI / 2)
  receptionDesk(e, sd, 1.4, { pedestals: [0.38] })
  workstation(e, sd, -0.25, 0.75, 0.0, PI + 0.1, o.his('m_cctvdesk', 'CCTV · Entrance & Lobby', 'image'))
  deskPhone(e, sd, 0.28, 0.75, 0.05, PI - 0.2)
  papers(e, sd, 0.2, 1.08, 0.36, 0.1)
  deskSign(e, sd, 'security', 'SECURITY · HELP DESK', 'Visitor passes · Wheelchairs · Patient relations', -0.15, 1.08, 0.38, 0, 0.42)
  taskChair(e, group(sd, -0.1, 0, -0.85, 0.2))
  room.info(sd, {
    title: 'Security & Patient Relations Desk',
    kind: 'Security · Visitor help',
    body: 'The guard and the patient relations executive on duty greet arrivals, direct them to registration, the lifts or the emergency, issue visitor and attendant passes, call for a wheelchair or a stretcher, and take feedback and complaints.',
    specs: ['Visitor and attendant pass register', 'Live view of the entrance and lobby cameras', 'Wheelchairs and stretchers on call from the bay beside the lobby', 'Fire alarm repeater and PA microphone'],
  })

  // Hand sanitiser at the door; the self-service token kiosk by the counter's west end.
  sanitiserStand(e, room.at(4.45, room.z1 - 0.45, PI))
  // The floor directory on the admission office's wall, the admissions sign over its glass door.
  const dw = room.onWall('+x', 11.25)
  directoryBoard(e, dw, 1.0, 1.25, 1.55, [
    ['3', 'Operation Theatres | OT 1 – 3 · Pre-op holding · Recovery'],
    ['2', 'ICU · International Wing | Intensive care · Suites 211 – 213'],
    ['1', 'Inpatient Rooms | Rooms 101 – 107 · Nurses\' station'],
    ['G', 'Reception · Admissions · Emergency | Insurance · Billing · Cash · Pharmacy'],
    ['B1–2', 'Parking | Bed lift and stair behind reception'],
  ])
  sign(e, room.onWall('+x', 9.9), 'admit_lobby', 'ADMISSIONS & DISCHARGE', 'Room G12 · Insurance help', 1.5, 0.34, 0, 2.55, 0.02)

  // A sitting corner by the glass east of the entrance: two lounge chairs and a side table.
  const zc = room.z1 - 0.55
  loungeChair(e, room.at(8.0, zc, PI - 0.2))
  coffeeTable(e, room.at(8.68, zc + 0.02, PI), 0.5, 0.5)
  loungeChair(e, room.at(9.36, zc, PI + 0.2))
  planter(e, room.at(room.x0 + 0.3, z0 + 0.3))

  // The direction sign hung over the lobby, facing the doors.
  hungSign(e, room, 6.1, room.z1 - 1.4, 0, 2.2, 0.5, o.sign('m_lobbydir', 1024, 232, direction([['OPD · Lifts · Pharmacy · Billing', 'left'], ['Emergency · Admissions', 'right']])), 3.1)
}

/* ---------- the patient help desk ---------- */

const help: Fitter = (e, room) => {
  const { o } = e
  // The help desk at the dead end of the strip, facing the glazed link and the OPD hall beyond.
  const hx = room.x0 + 0.85
  const hd = room.at(hx, room.z0 + 0.98, 0)
  receptionDesk(e, hd, 1.5, { pedestals: [0.4] })
  computer(e, hd, -0.2, 0.75, 0.02, PI + 0.05, o.his('m_help', 'Patient Help · Enquiry & Escort', 'table'))
  deskPhone(e, hd, 0.42, 0.75, 0.06, PI - 0.2)
  deskSign(e, hd, 'help', 'PATIENT HELP DESK', 'Enquiry · Escort · Wheelchairs · Feedback', -0.05, 1.08, 0.36, 0, 0.4)
  taskChair(e, group(hd, -0.15, 0, -0.62, -0.1))
  room.info(hd, {
    title: 'Patient Help Desk',
    kind: 'Patient relations · Guidance',
    body: 'Helps patients and families find their way between the OPD, the lifts to the wards and the services hall; books an escort with a wheelchair, answers questions about admission, visiting and bills, and records feedback and grievances.',
    specs: ['Staffed 8 am – 10 pm', 'Escort and wheelchair requests to the porters', 'Feedback forms and grievance register', 'Languages: English, Telugu, Hindi'],
  })
  // Waiting seats against the lift bank's back wall, the charging point between them and the desk.
  beamSeating(e, room.at(1.15, room.z0 + 0.36, 0), 3, 'upholstered')
  wallCharger(e, room.onWall('-z', -0.04), 1.0)
  // The drinking water and the wheelchair parking at the east end, out of the way to the passage.
  const wc = room.onWall('+x', 3.45)
  waterCoolerAt(e, wc)
  room.info(wc, { title: 'Drinking Water Station', kind: 'Patient amenity', body: 'Purified drinking water, chilled and at room temperature, with paper cups; the cups go in the bin beside it.', specs: ['RO + UV purification', 'Hot-water tap child-locked', 'Filters changed every quarter'] })
  const bay = room.at(4.05, room.z1 - 0.55, 0)
  wheelchairBay(e, bay, 1.4, 0.9)
  wheelchair(e, room.at(3.75, room.z1 - 0.6, PI / 2 + 0.05))
  const wb = room.onWall('+z', 4.05)
  sign(e, wb, 'wcpark_help', 'WHEELCHAIR PARKING', 'Free for patients · Ask the help desk', 0.95, 0.24, 0, 1.6, 0.02)
  bins(e, room.at(room.x1 - 0.28, 2.85, -PI / 2), ['black', 'green'])
  poster(e, room.onWall('-x', room.cz), 'Patients\' Rights & Responsibilities', '#1c3966', 0.42, 0.6, 1.6)
}

/* ---------- admissions ---------- */

const admission: Fitter = (e, room) => {
  const { o } = e
  const zDesk = room.z0 + 2.0
  const desks: [number, string][] = [[room.x0 + 0.78, 'Admission · Bed Allotment'], [room.x0 + 2.55, 'Admission · Deposit & Consent']]
  const dgs = desks.map(([x, title], i) => {
    // The staff side (the desk's −z) towards the back wall, the patients towards the door.
    const d = room.at(x, zDesk, 0)
    desk(e, d, 1.4, 0.75, i ? -1 : 1)
    computer(e, d, i ? 0.12 : -0.12, 0.75, 0.1, PI + (i ? -0.08 : 0.08), o.his(`m_adm${i}`, title, i ? 'table' : 'form'))
    deskPhone(e, d, i ? -0.5 : 0.5, 0.75, 0.0, PI + (i ? 0.3 : -0.3))
    papers(e, d, i ? 0.42 : -0.42, 0.75, 0.15, 0.1)
    taskChair(e, group(d, i ? 0.1 : -0.1, 0, -0.68, (i - 0.5) * 0.3))
    for (const s of [-1, 1]) visitorChair(e, room.at(x + s * 0.36, zDesk + 0.82, PI + s * 0.08))
    if (i === 0) {
      room.info(d, {
        title: 'Admission Desk',
        kind: 'Inpatient admissions · Front office',
        body: 'Patients advised admission by their consultant or the emergency are registered as inpatients here: the bed category is chosen and allotted from the live bed board, the admission and consent forms are signed, the advance deposit or the insurer\'s pre-authorisation is recorded, and an attendant pass and wristband are issued before the patient is escorted to the ward.',
        specs: ['Two admission workstations on the HIS bed-management module', 'Wristband and attendant-pass printers', 'Cashless admissions referred to the insurance desk (G14)', 'Open 24 hours; emergency admissions direct'],
      })
    }
    return d
  })
  printer(e, dgs[0], -0.5, 0.75, -0.02, PI)
  docScanner(e, dgs[1], 0.48, 0.75, 0.02, PI)
  privacyScreen(e, room.at(room.x0 + 1.665, zDesk + 0.35, PI / 2), 1.5, 1.4)
  // Filing and the forms behind the staff along the back wall.
  for (let i = 0; i < 3; i++) fileCabinet(e, room.at(room.x0 + 0.3 + i * 0.49, room.z0 + 0.63, 0), 4)
  const fc = room.at(room.x1 - 0.85, room.z0 + 0.46, 0)
  cupboard(e, fc, 1.2, 1.9, 0.45, { glass: true, fill: 'files', label: 'Admission Forms & Records' })
  room.info(fc, { title: 'Forms & Records Cupboard', kind: 'Admission documents', body: 'Blank admission, consent and high-risk consent forms in English and Telugu, inpatient case-file covers, and the admission registers awaiting transfer to medical records.', specs: ['Glazed doors, lockable', 'Consent forms for anaesthesia, surgery and blood transfusion', 'Case files sent to MRD within 24 h of discharge'] })
  poster(e, room.onWall('-z', room.x0 + 0.8), 'Documents for Admission', '#1c3966', 0.42, 0.56, 1.75)
  // The copier by the door, relatives' seats in the corner by the glass, the clock.
  const pc = room.at(room.x0 + 0.62, room.z1 - 1.85, PI / 2)
  photocopier(e, pc)
  room.info(pc, { title: 'Multifunction Copier', kind: 'Office equipment', body: 'Copies and scans patients\' ID proofs, referral letters and insurance cards straight into the admission record.', specs: ['A3 / A4, 35 ppm', 'Duplex scan to the HIS'] })
  beamSeating(e, room.at(room.x1 - 0.42, room.z1 - 1.25, -PI / 2), 3, 'upholstered')
  wallClock(e, room.onWall('-x', room.z0 + 1.0), 2.3, 0.3)
}

/* ---------- the patient services hall ---------- */

const services: Fitter = (e, room) => {
  const { x0, x1, z0 } = room
  // Queue lanes in front of each counter: dividers out from the wall between the windows.
  const q = room.at(0, 0, 0)
  const lane = (zs: number[], x: number, dir: 1 | -1) => {
    const pts: [number, number][] = []
    for (const z of zs) pts.push([x + dir * 0.35, z], [x + dir * 1.55, z])
    queueRun(e, q, pts, zs.map((_, i) => i * 2 + 1))
  }
  lane([-13.95, -12.2, -10.45], x0, 1)
  lane([-9.55, -7.9, -6.3], x0, 1)
  lane([-8.6, -7.5], x1, -1)
  const zl = (xs: number[]) => {
    const pts: [number, number][] = []
    for (const x of xs) pts.push([x, z0 + 0.35], [x, z0 + 1.5])
    queueRun(e, q, pts, xs.map((_, i) => i * 2 + 1))
  }
  zl([-1.75, -0.37, 1.07, 2.45])

  // The counters' signs over their windows, and their token displays hung over the seating.
  sign(e, room.onWall('-x', -12.2), 'billing_main', 'IPD BILLING', 'Interim & final bills · Deposits · Refunds', 2.0, 0.36, 0, 2.55, 0.02)
  sign(e, room.onWall('-x', -7.9), 'ins_main', 'INSURANCE · CASHLESS', 'TPA desk · Pre-authorisation · Claims', 2.0, 0.36, 0, 2.55, 0.02)
  sign(e, room.onWall('+x', -8.05), 'cash_main', 'CASH COUNTER', 'Cash · Card · UPI · Deposits', 1.7, 0.34, 0, 2.5, 0.02)
  sign(e, room.onWall('-z', -0.55), 'pharm_main', 'PHARMACY', 'Open 24 hours · Inpatient & outpatient prescriptions', 2.4, 0.34, 0, 2.62, 0.02)
  wallScreen(e, room.onWall('-z', 1.75), 0.8, 2.62, tokens(e, 'pharm_main', 'Pharmacy · Ready to Collect', [['P-218', 'Window 2'], ['P-217', 'Window 1'], ['P-219', 'Window 3']], 9311))
  const west = tokens(e, 'svc_west', 'Now Serving', [['B-042', 'Billing · Window 1'], ['I-017', 'Insurance · Window 2'], ['B-043', 'Billing · Window 2'], ['I-016', 'Insurance · Window 1']], 9312)
  const east = tokens(e, 'svc_east', 'Now Serving', [['C-088', 'Cash Counter'], ['C-089', 'Cash Counter · Next'], ['P-218', 'Pharmacy · Window 2']], 9313)
  const hd = hungDisplay(e, room, 0.42, -10.55, PI / 2, 1.05, east, west, 2.4)
  room.info(hd, { title: 'Token Displays', kind: 'Queue management', body: 'Each counter calls the next token from its workstation; the number shows here with the window to go to and is announced over the speakers, so patients can wait seated rather than in line.', specs: ['Two 48" displays back to back', 'Linked to billing, insurance, cash and pharmacy', 'Audio announcement in three languages'] })

  // The waiting seats: two rows back to back down the middle, a sofa against the east wall.
  const rowW = room.at(0.08, -10.55, -PI / 2)
  beamSeating(e, rowW, 5, 'upholstered')
  beamSeating(e, room.at(0.76, -10.55, PI / 2), 5, 'upholstered')
  const sf = room.at(x1 - 0.42, -11.0, -PI / 2)
  loungeSofa(e, sf, 1.8)
  room.info(rowW, {
    title: 'Patient Services Waiting',
    kind: 'Waiting area',
    body: 'Seating for patients and families settling bills, insurance and deposits, and waiting for medicines: linked seats facing the counters, a sofa, drinking water and phone charging. Belted lanes keep each window\'s queue in order.',
    specs: ['26 seats including a three-seater sofa', 'Queue lanes with retractable belts at every window', 'Wheelchair parking beside the pharmacy', 'Free mobile charging station'],
  })
  // Water, charging, wheelchair parking and the bins.
  const wc = room.onWall('+x', -9.83)
  waterCoolerAt(e, wc)
  room.info(wc, { title: 'Drinking Water', kind: 'Patient amenity', body: 'RO-purified drinking water, chilled and at room temperature, with paper cups beside it.', specs: ['RO + UV purification', '40 L/h chilled', 'Filters changed quarterly'] })
  const cs = room.at(0.42, -8.15, 0)
  chargingStation(e, cs)
  room.info(cs, { title: 'Mobile Charging Station', kind: 'Patient amenity', body: 'Eight lockable charging bays with universal tips: leave the phone charging behind the clear door and wait in sight of it.', specs: ['USB-C, Lightning and micro-USB tips', 'Fast charge, 18 W per bay', 'Free for patients and visitors'] })
  wheelchairBay(e, room.at(x1 - 0.55, -12.4, 0), 0.9, 1.0)
  wheelchair(e, room.at(x1 - 0.55, -12.4, -PI / 2))
  sign(e, room.onWall('+x', -12.4), 'wcpark_svc', 'WHEELCHAIR PARKING', null, 0.8, 0.18, 0, 1.55, 0.02)
  bins(e, room.at(x1 - 0.25, -6.25, -PI / 2), ['black', 'green', 'blue'])
  planter(e, room.at(0.42, -12.45))
  sanitiserStand(e, room.at(x0 + 0.3, -6.0, PI / 2))
  // The cashless board on the pier between insurance and billing; the clock over the sofa.
  const tb = room.onWall('-x', -10.0)
  poster(e, tb, 'Cashless Treatment · Insurers & TPAs', '#1f6fd1', 0.5, 0.7, 1.55)
  leafletRack(e, room.onWall('-x', -10.0), 0.6)
  wallClock(e, room.onWall('+x', -10.95), 2.35, 0.32)
  // The card terminal on the cash window's public ledge, by the deal tray.
  payTerminal(e, room.at(x1 - 0.18, -8.6, -PI / 2, 0.94), 0, 0, 0)
}

/* ---------- insurance, billing, cash ---------- */

/**
 * A counter run along the hatch side `side` from z = a … b, its staff side into the room; `lx`
 * turns a plan z into the run's local x (on the +x wall its local x runs along +z, on the −x wall
 * along −z). Pedestals are given in plan z.
 */
function hatchRun(e: OpdCtx, room: Room, side: '-x' | '+x', a: number, b: number, pedestals: number[]) {
  const zc = (a + b) / 2
  const g = room.onWall(side, zc)
  const lx = (z: number) => (side === '+x' ? z - zc : zc - z)
  workRun(e, g, Math.abs(b - a), 0.7, pedestals.map(lx))
  return { run: g, lx }
}

const insurance: Fitter = (e, room) => {
  const { o } = e
  const { run, lx } = hatchRun(e, room, '+x', -9.75, -6.75, [-9.5, -7.8])
  const st: [number, string, 'form' | 'table'][] = [[-8.8, 'Insurance Verification · Policy & KYC', 'form'], [-7.3, 'Pre-authorisation · TPA Portal', 'table']]
  st.forEach(([z, title, kind], i) => {
    computer(e, run, lx(z), 0.75, 0.42, 0, o.his(`m_ins${i}`, title, kind))
    taskChair(e, room.at(room.x1 - 1.05, z, -PI / 2 + PI + (i - 0.5) * 0.3))
  })
  docScanner(e, run, lx(-9.4), 0.75, 0.42, 0)
  docScanner(e, run, lx(-8.05), 0.75, 0.42, 0)
  deskPhone(e, run, lx(-6.95), 0.75, 0.45, -0.2)
  papers(e, run, lx(-7.95), 0.75, 0.25, 0.2)
  room.info(run, {
    title: 'Insurance & Cashless Desk',
    kind: 'Front office · TPA and insurance',
    body: 'Checks the patient\'s health insurance or government scheme cover, scans the policy, ID and the doctor\'s advice, and raises the pre-authorisation for cashless treatment with the insurer or TPA; enhancements and the final claim are filed from here at discharge.',
    specs: ['Two TPA workstations with document scanners', 'All major insurers and TPAs; PM-JAY, CGHS, ECHS and corporate panels', 'Pre-authorisation usually within 2–4 hours', 'Claim files kept for 7 years'],
  })
  // The verification desk on the south wall, its scanner; filing and claim files on the west wall.
  const vd = room.at(room.x0 + 0.55, room.z0 + 0.32, PI)
  desk(e, vd, 1.0, 0.6, 0, e.o.oak)
  computer(e, vd, 0.1, 0.75, 0.1, PI, o.his('m_insverify', 'Claim Documents · Indexing', 'image'))
  docScanner(e, vd, -0.32, 0.75, 0.08, PI)
  taskChair(e, room.at(room.x0 + 0.55, room.z0 + 0.95, PI))
  for (const z of [-8.15, -7.66]) fileCabinet(e, room.at(room.x0 + 0.62, z, PI / 2), 4)
  cupboard(e, room.at(room.x0 + 0.46, -6.85, PI / 2), 0.9, 1.9, 0.45, { fill: 'files', label: 'Claim Files' })
  poster(e, room.onWall('-z', room.x0 + 0.55), 'Empanelled Insurers & TPAs', '#1f6fd1', 0.5, 0.7, 1.65)
  wallClock(e, room.onWall('-x', -8.9), 2.3, 0.28)
}

const billing: Fitter = (e, room) => {
  const { o } = e
  const { run, lx } = hatchRun(e, room, '+x', -14.1, -10.4, [-13.75, -10.75])
  ;[-12.95, -11.55].forEach((z, i) => {
    computer(e, run, lx(z), 0.75, 0.42, 0, o.his(`m_bill${i}`, i ? 'IPD Billing · Final Bill' : 'IPD Billing · Interim & Deposits', i ? 'table' : 'form'))
    receiptPrinter(e, run, lx(z) + (i ? 0.45 : -0.45), 0.75, 0.4, 0)
    // The till drawer under the top, to the side of the cashier's knees.
    cashDrawer(e, run, lx(z) + (i ? -0.42 : 0.42), 0.6, 0.42, 0)
    taskChair(e, room.at(room.x1 - 1.05, z, PI / 2 + (i - 0.5) * 0.25))
    // The card / UPI terminal on the hatch's ledge, the patient's side of the glass.
    payTerminal(e, room.at(room.x1 + 0.2, z + 0.3, PI / 2, 0.99), 0, 0, 0)
  })
  noteCounter(e, run, lx(-12.25), 0.75, 0.42, 0)
  printer(e, run, lx(-13.85), 0.75, 0.42, 0)
  deskPhone(e, run, lx(-10.7), 0.75, 0.45, -0.2)
  papers(e, run, lx(-12.25), 0.75, 0.15, 0.1)
  room.info(run, {
    title: 'IPD Billing Counter',
    kind: 'Front office · Accounts',
    body: 'Inpatient bills are drawn up here: advance deposits at admission, interim bills during the stay, and the final bill at discharge with every room, procedure, pharmacy and investigation charge itemised and the GST shown; payments by cash, card or UPI, refunds of unused deposit.',
    specs: ['Two billing workstations with thermal invoice printers', 'Card / UPI terminals at both windows', 'Note counter and cash drawers', 'Insurance cases settled with the TPA desk next door'],
  })
  // The copier in the corner, records and the tariff along the west wall.
  photocopier(e, room.at(room.x0 + 0.45, room.z0 + 0.66, 0))
  cupboard(e, room.at(room.x0 + 0.46, -12.4, PI / 2), 1.4, 0.9, 0.45, { fill: 'files', label: 'Billing Records' })
  poster(e, room.onWall('-x', -12.4), 'Room Tariff & Package Rates', '#1c3966', 0.5, 0.7, 1.65)
  fileCabinet(e, room.at(room.x0 + 0.62, -11.32, PI / 2), 4)
  wallClock(e, room.onWall('-z', room.x0 + 1.4), 2.3, 0.28)
}

const cash: Fitter = (e, room) => {
  const { o } = e
  const { run, lx } = hatchRun(e, room, '-x', -9.6, -6.75, [-7.2])
  computer(e, run, lx(-8.3), 0.75, 0.42, 0, o.his('m_cash', 'Cash Collection · Receipts', 'form'))
  cashDrawer(e, run, lx(-8.85), 0.6, 0.42, 0)
  noteCounter(e, run, lx(-7.45), 0.75, 0.42, 0)
  receiptPrinter(e, run, lx(-8.85), 0.75, 0.42, 0)
  deskPhone(e, run, lx(-9.35), 0.75, 0.45, 0.2)
  payTerminal(e, run, lx(-7.1), 0.75, 0.45, 0)
  taskChair(e, room.at(room.x0 + 1.05, -8.15, -PI / 2))
  room.info(run, {
    title: 'Cash Counter',
    kind: 'Accounts · Cash collection',
    body: 'Receives deposits and bill payments in cash, card or UPI behind laminated security glass: notes go through the counting machine with its counterfeit detection, a printed receipt is passed back through the deal tray, and the day\'s collection is balanced and sealed in the safe.',
    specs: ['Bullet-resistant laminated glass, speech grille and deal tray', 'Note counter with UV / MG fake-note detection', 'Card / UPI terminal and thermal receipt printer', 'Dual-custody safe; CCTV over the counter'],
  })
  // The safe in the corner, the supervisor's desk along the east wall, keys, the camera over all.
  const sf = room.at(room.x0 + 1.15, room.z0 + 0.53, 0)
  floorSafe(e, sf)
  room.info(sf, { title: 'Cash Safe', kind: 'Security · Cash custody', body: 'The day\'s collection is counted, recorded and sealed in bags before going into the safe until the bank\'s cash pick-up; the safe opens only with the cashier\'s key and the accounts officer\'s combination together.', specs: ['Fire-resistant, burglary-rated body', 'Combination dial and key lock: dual custody', 'Bolted to the floor slab'] })
  const sd = room.at(room.x1 - 0.32, -8.9, PI / 2)
  desk(e, sd, 1.1, 0.6, 0)
  computer(e, sd, 0.05, 0.75, 0.1, PI, o.his('m_cashsup', 'Day Book · Collection Summary', 'graph'))
  taskChair(e, room.at(room.x1 - 1.0, -8.9, PI / 2 + 0.2))
  keyCabinet(e, group(room.onWall('+x', -7.5), 0, 0, 0.1), 1.45)
  const cam = room.at(room.x1 - 0.5, room.z1 - 0.5, 0, room.ceiling)
  cctvDome(e, cam)
  wallClock(e, room.onWall('+x', -6.6), 2.3, 0.28)
}

/* ---------- the pharmacy and its store ---------- */

const pharmacy: Fitter = (e, room) => {
  const { o, m, k } = e
  // The dispensing counter under the hatch: drawers and cupboards on the pharmacists' side.
  const cx = 0.6
  const ct = room.at(cx, room.z1 - 0.62, PI)
  baseRun(e, ct, 5.2, { fill: 'medicines' })
  ;[-1.08, 0.35, 1.78].forEach((x, i) => {
    computer(e, room.at(x, room.z1 - 0.34, PI), 0, 0.915, 0, 0, o.his(`m_pharm${i}`, 'Pharmacy · Dispensing & Billing', i === 1 ? 'table' : 'form'))
    barcodeScanner(e, room.at(x - 0.43, room.z1 - 0.4, PI), 0, 0.915, 0, 0.3)
    receiptPrinter(e, room.at(x + 0.45, room.z1 - 0.4, PI), 0, 0.915, 0)
    if (i < 2) dispTray(e, room.group, x + 0.72, room.y + 0.915, room.z1 - 0.42, 0.05, i + 4)
  })
  for (const x of [-0.4, 1.05]) stool(e, room.at(x, room.z1 - 1.05, 0))
  room.info(ct, {
    title: 'Pharmacy Dispensing Counter',
    kind: 'Pharmacy · Dispensing',
    body: 'Prescriptions from the wards, the OPD and the emergency are checked by a registered pharmacist against the e-prescription, billed with each strip\'s batch and expiry scanned, labelled with the dose in the patient\'s language and handed over at the windows with counselling.',
    specs: ['Three dispensing and billing workstations', 'Barcode batch and expiry scanning', 'Schedule H, H1 and X drugs on prescription only', 'Open 24 hours'],
  })
  // Medicine shelving along the back wall, the strip-drawer cabinet and the narcotics cabinet on the west.
  for (let i = 0; i < 4; i++) medicineShelves(e, room.at(room.x0 + 0.65 + i * 1.2, room.z0 + 0.4, 0), 1.2, 2.1, 0.4, 6)
  const sc = room.at(room.x0 + 0.45, -16.25, PI / 2)
  stripCabinet(e, sc, 5, 4)
  room.info(sc, { title: 'Strip Drawer Cabinet', kind: 'Pharmacy · Storage', body: 'Tablets and capsules in their strips, filed alphabetically by generic name in labelled drawers, picked first-expiry-first-out.', specs: ['20 labelled drawers', 'FEFO rotation', 'Fast movers nearest the counter'] })
  const nc = room.onWall('-x', -16.25)
  narcoticsCabinet(e, nc, 1.35)
  room.info(nc, { title: 'Narcotics Cabinet', kind: 'Controlled drugs · Schedule X', body: 'Morphine, fentanyl, pethidine and other narcotic and psychotropic drugs are kept under double lock, the keys held by the pharmacist in charge and the duty pharmacist, every dose entered in the narcotics register against the prescription.', specs: ['Steel cabinet with inner locked box', 'Two keys, two custodians', 'Daily balance in the NDPS register'] })
  // The cold chain on the east wall, the stock desk beside it.
  const fridges = [-15.0, -15.65].map((z, i) => {
    const g = room.at(room.x1 - 0.62, z, -PI / 2)
    medFridge(e, g, i ? 'Vaccine & Insulin Refrigerator' : 'Pharmaceutical Refrigerator', 1.85, 0.6)
    return g
  })
  room.info(fridges[0], { title: 'Pharmaceutical Refrigerators', kind: 'Cold chain · +2 to +8 °C', body: 'Insulins, vaccines, biologicals, eye drops and other heat-sensitive medicines between 2 and 8 °C, the temperature logged every five minutes and alarmed if it drifts.', specs: ['Glass-door, forced-air cooling', 'Digital data logger with SMS alarm', 'On the standby generator circuit'] })
  const dk = room.at(room.x1 - 0.32, -16.45, PI / 2)
  desk(e, dk, 1.0, 0.6, 0)
  computer(e, dk, 0.05, 0.75, 0.1, PI, o.his('m_pharmstock', 'Pharmacy · Stock & Indents', 'table'))
  taskChair(e, room.at(room.x1 - 0.95, -16.4, PI / 2 + 0.2))
  // The checking bench in the middle: trays of filled prescriptions, a label printer, bottles.
  const wb = room.at(0.6, -16.1, 0)
  workbench(e, wb, 1.5, 0.6, 0.9)
  for (let i = 0; i < 3; i++) dispTray(e, wb, -0.55 + i * 0.34, 0.9, -0.3, (i - 1) * 0.05, i + 1)
  receiptPrinter(e, wb, 0.55, 0.9, -0.42, 0)
  for (let i = 0; i < 5; i++) bottle(e, wb, 0.35 + i * 0.07, 0.9, -0.12, 0.12, 0.025, i % 2 ? m.amber : m.whitePlastic, m.whitePlastic)
  k.box(wb, 0.2, 0.012, 0.12, m.whitePlastic, 0.6, 0.906, -0.22)
  room.info(wb, { title: 'Prescription Checking Bench', kind: 'Pharmacy · Quality check', body: 'Every filled prescription is laid out in its tray and checked by a second pharmacist against the prescription before it goes to the window.', specs: ['Double check of drug, strength and quantity', 'Dosage labels in English and Telugu'] })
  // The pharmacy's reserve stock, racked in its own north-east corner (the hospital's one
  // pharmacy holds its stock itself): cartons by therapeutic group, issued first-expiry-first-out.
  const rr = room.at(4.05, room.z1 - 0.55, PI)
  bulkRack(e, rr, 1.3, 2.2, 0.55, 4)
  room.info(rr, { title: 'Reserve Stock Racking', kind: 'Pharmacy · Stock', body: 'The pharmacy\'s reserve of tablets, syrups, IV fluids and surgical consumables in their cartons on heavy-duty racking, refilling the dispensing shelves first-expiry-first-out; deliveries are checked in at the stock desk against their invoices.', specs: ['Boltless steel racking, 4 levels', 'Kept below 25 °C, humidity logged', 'Monthly physical stock verification'] })
  handRub(e, room.onWall('+z', 3.0), 1.3)
  extinguisher(e, room.onWall('-z', 4.9))
  wallClock(e, room.onWall('+x', -17.3), 2.3, 0.28)
}

/* ---------- medical records, administration ---------- */

const records: Fitter = (e, room) => {
  const { o } = e
  // Two mobile carriages and their floating aisle across the north of the room, the hand
  // wheels towards the door.
  const cp = room.at(room.x1 - 0.32, -15.45, PI)
  compactor(e, cp, 2, 1.9, 2)
  room.info(cp, { title: 'Mobile Compactor Shelving', kind: 'Medical records · Storage', body: 'Inpatient case files by medical-record number on shelving carriages that roll on floor rails: turning a hand wheel opens an aisle where it is needed, so twice the files fit in the room.', specs: ['Mechanical-assist drive, anti-tip rails', 'Files by MRD number and year of discharge', 'Inpatient records kept 10 years, medico-legal permanently'] })
  // The scanning and indexing workstation in the corner east of the door.
  const dk = room.at(room.x1 - 0.38, room.z0 + 0.3, PI)
  desk(e, dk, 0.75, 0.6, 0)
  computer(e, dk, -0.08, 0.75, 0.1, PI, o.his('m_mrd', 'MRD · Scanning & Indexing', 'image'))
  docScanner(e, dk, 0.24, 0.75, 0.1, PI + 0.2)
  taskChair(e, room.at(room.x1 - 0.38, room.z0 + 0.95, PI))
  room.info(dk, { title: 'Scanning & Indexing Workstation', kind: 'Medical records · Digitisation', body: 'Discharged case files are checked for completeness, coded (ICD-10), scanned page by page and indexed to the patient\'s UHID so that the record can be opened from any workstation.', specs: ['Duplex sheet-fed scanner, 40 ppm', 'ICD-10 coding of diagnoses', 'Retrieval for a readmission within 30 minutes'] })
}

const admin: Fitter = (e, room) => {
  const { o } = e
  // The administrator's desk before the back window, facing the door; two chairs for visitors.
  const ad = room.at(4.25, -24.55, 0)
  desk(e, ad, 1.6, 0.8, 1)
  computer(e, ad, -0.3, 0.75, 0.12, PI, o.his('m_admin', 'Hospital Dashboard · Census & Revenue', 'graph'))
  deskPhone(e, ad, 0.5, 0.75, 0.1, PI - 0.3)
  papers(e, ad, 0.25, 0.75, 0.15, 0.3)
  taskChair(e, room.at(4.2, -25.25, 0.1))
  for (const x of [3.85, 4.65]) visitorChair(e, room.at(x, -23.6, PI + (x - 4.25) * 0.2))
  room.info(ad, { title: 'Hospital Administrator\'s Office', kind: 'Hospital administration', body: 'The administrator runs the hospital day to day: bed occupancy and admissions, staffing rosters, purchase approvals, statutory licences and NABH quality indicators, patient grievances that reach management, and the daily census and revenue report.', specs: ['Daily MIS dashboard on the HIS', 'Grievance redressal within 7 days', 'NABH quality and safety indicators reviewed monthly'] })
  // A staff desk on the west wall.
  const sd = room.at(room.x0 + 0.35, -24.55, -PI / 2)
  desk(e, sd, 1.2, 0.7, -1)
  computer(e, sd, 0.1, 0.75, 0.1, PI, o.his('m_adminoff', 'Purchase & HR · Approvals', 'table'))
  printer(e, sd, -0.36, 0.75, 0.08, PI)
  taskChair(e, room.at(room.x0 + 1.05, -24.5, -PI / 2 + 0.2))
  // The meeting table, filing on the door wall, a records cupboard on the east wall.
  const mt = room.at(2.75, -22.45, 0)
  roundTable(e, mt, 0.9)
  papers(e, mt, -0.1, 0.75, 0.05, 0.4)
  visitorChair(e, room.at(2.75, -21.72, PI))
  visitorChair(e, room.at(2.75, -23.18, 0))
  visitorChair(e, room.at(3.48, -22.45, -PI / 2))
  for (const x of [2.3, 2.79]) fileCabinet(e, room.at(x, room.z1 - 0.62, PI), 4)
  cupboard(e, room.at(room.x1 - 0.46, -23.0, -PI / 2), 0.9, 1.9, 0.45, { fill: 'files', label: 'Administration Records' })
  noticeBoard(e, room.onWall('-x', -23.1), 1.0, 1.55)
  poster(e, room.onWall('+x', -24.6), 'Quality Policy · NABH', '#1c3966', 0.42, 0.6, 1.6)
  wallClock(e, room.onWall('-x', -21.5), 2.3, 0.3)
}

/** The RO water cooler with its back to a wall: the shared builder's body runs back from its front. */
function waterCoolerAt(e: OpdCtx, p: ReturnType<Room['at']>) {
  const g = group(p, 0, 0, 0.45)
  waterCooler(e, g)
}

export const MAIN_GROUND: Record<string, Fitter> = {
  main_lobby: lobby,
  main_help: help,
  main_admission: admission,
  main_services: services,
  main_insurance: insurance,
  main_billing: billing,
  main_cash: cash,
  main_pharmacy: pharmacy,
  main_records: records,
  main_admin: admin,
}
