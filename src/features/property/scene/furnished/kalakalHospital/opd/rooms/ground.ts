import type { Material } from 'three'
import { PI } from '../../../kit'
import { beamSeating, linenTrolley, workstation } from '../../emergency'
import { gasPanel } from '../../erEquipment'
import { bed, counter, credenza, cylinder, examCouch, pedestal, taskChair, wheelchair } from '../../erFurniture'
import { group, signPanel } from '../../erKit'
import type { OpdCtx, Room } from '../ctx'
import {
  ahu, backlitSign, belt, carrier, cashDrawer, chemicals, chest, extinguisher, kiosk, keyCabinet, ltPanel, medicineShelves, mopSink, mopTrolley,
  noteCounter, pallet, payTerminal, photocopier, pigeonholes, radioChargers, receiptPrinter, roundTable, scanner, sign, stanchion, stripCabinet,
  tokens, wallShelves, waterCooler, bulkRack, cctvWall,
} from '../equipment/ground'
import {
  basin, bins, bottle, clock, computer, cupboard, desk, deskPhone, dispensers, dressingSupplies, dressingTrolley, fileCabinet, gloveBox, injectionTrolley,
  lockers, medFridge, oxygenTrolley, papers, patientChair, poster, printer, rack, sharps, stool, wallCupboard, wallScreen, workbench, baseRun, curtain,
} from '../furniture'
import type { Fitter } from './types'

/*
 * The ground floor: the outpatient hall behind the entrance with the main reception, the
 * security desk and the appointment and lift assistance counter; the waiting lounge facing the
 * billing and report counters and, across the front corridor, the pharmacy's dispensing hatch;
 * the pharmacy and its store; the dressing and injection room; the administration office; the
 * security, insurance and vaccination rooms on the south side; the plant and housekeeping at the
 * back. Plan coordinates as in ../plan.ts (+x north, +z east).
 */

/** A screen hung from the ceiling on two rods, double-sided, w wide, its centre `y` above the floor. */
function hungScreen(e: OpdCtx, room: Room, x: number, z: number, ry: number, w: number, mat: Material, y = 2.4) {
  const { k, m } = e
  const g = room.at(x, z, ry)
  const h = w * 0.5625
  for (const s of [-1, 1]) k.cyl(g, 0.008, 0.008, room.ceiling - y - h / 2, m.stainless, s * w * 0.3, (room.ceiling + y + h / 2) / 2, 0, 6)
  k.box(g, w, h, 0.06, m.black, 0, y, 0)
  for (const s of [-1, 1]) {
    const f = group(g, 0, 0, s * 0.031, s > 0 ? 0 : PI)
    e.k.box(f, w - 0.03, h - 0.03, 0.002, mat, 0, y, 0, false)
  }
  return g
}

/** A sign hung from the ceiling, double-sided, facing ±(its turn). */
function hungSign(e: OpdCtx, room: Room, x: number, z: number, ry: number, key: string, text: string, sub: string | null, w: number, h: number, y = 2.55) {
  const g = room.at(x, z, ry)
  for (const s of [-1, 1]) e.k.cyl(g, 0.005, 0.005, room.ceiling - y - h / 2, e.m.stainless, s * w * 0.35, (room.ceiling + y + h / 2) / 2, 0, 6)
  sign(e, g, key, text, sub, w, h, 0, y, 0.011)
  sign(e, g, key, text, sub, w, h, 0, y, -0.011, PI)
  return g
}

/* ---------- the hall ---------- */

const hall: Fitter = (e, room) => {
  const { k, m, o } = e
  // The main reception and enquiry counter along the south wall, staff with their backs to the
  // windows; the public faces it from the hall.
  const rc = room.at(-9.75, 7.0, PI / 2)
  counter(e, rc, 4.0, [-1.65, 0.05, 1.45], [1.15, 1.95])
  const screens = ['Patient Registration', 'OPD Appointments', 'Enquiry · Doctor Schedule']
  ;[-1.3, 0.05, 1.35].forEach((x, i) => {
    workstation(e, rc, x, 0.765, 0.05, PI + (i - 1) * 0.08, o.his(`g_rec${i}`, screens[i], i === 2 ? 'table' : 'form'))
    deskPhone(e, rc, x + 0.38, 0.765, 0.12, PI + 0.2)
    if (i !== 2) taskChair(e, group(rc, x + 0.05, 0, -0.62 - i * 0.05, (i - 0.5) * 0.3))
  })
  receiptPrinter(e, rc, -0.55, 0.765, 0.18, PI)
  receiptPrinter(e, rc, 1.0, 1.12, 0.6, 0)
  papers(e, rc, -1.85, 0.765, 0.0, 0.2)
  k.box(rc, 0.3, 0.05, 0.22, m.whitePlastic, 0.7, 1.145, 0.6)
  // Behind the staff, under the windows: low cupboards of registers and forms (doors open).
  credenza(e, room.at(-11.0, 7.0, PI / 2), 3.6)
  room.info(rc, {
    title: 'Main Reception & Enquiry',
    kind: 'Front office · Patient registration',
    body: 'Where every outpatient visit begins: new patients are registered and issued a UHID card, returning patients are checked in against their appointment, and enquiries about doctors, timings and departments are answered. Tokens print here for the consultation queues upstairs.',
    specs: ['Three HIS workstations with registration and appointment modules', 'Token and UHID card printers', 'Wheelchair-height section at the north end', 'Open 7 am – 9 pm, enquiry by phone on extension 100'],
  })
  hungSign(e, room, -9.45, 7.0, PI / 2, 'reception', 'MAIN RECEPTION · ENQUIRY', 'Registration · Appointments · Information', 2.4, 0.42)

  // The hospital's name, backlit on the stair's wall facing the entrance; the token display beside it.
  backlitSign(e, room.onWall('-z', -9.85), 2.7, 0.62, 2.3)
  wallScreen(e, room.onWall('-z', -7.95), 0.85, 2.25, tokens(e, 'hall', 'OPD Tokens · Ground Floor', [['A-047', 'Reception Counter 2'], ['P-112', 'Pharmacy Window 1'], ['B-031', 'Billing Counter 1'], ['R-019', 'Report Collection']], 9101))

  // The security and information desk inside the entrance doors.
  const sd = room.at(-10.55, 10.55, PI / 2)
  desk(e, sd, 1.2, 0.62, 0)
  taskChair(e, group(sd, 0.1, 0, -0.62, 0.2))
  k.box(sd, 0.3, 0.03, 0.22, m.blue, -0.2, 0.765, 0.05)
  deskPhone(e, sd, 0.35, 0.75, 0.0, PI)
  k.box(sd, 0.055, 0.15, 0.035, m.black, 0.1, 0.825, -0.1)
  signPanel(e, sd, 0.6, 0.18, o.sign('g_secdesk', 384, 116, (c, w, h) => {
    c.fillStyle = '#1c3966'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#fff'
    c.font = `700 ${h * 0.4}px Helvetica`
    c.textAlign = 'center'
    c.fillText('SECURITY · HELP DESK', w / 2, h * 0.62)
  }), 0, 0.92, 0.33, 0, 0.01)
  room.info(sd, { title: 'Security & Information Desk', kind: 'Security · Visitor help', body: 'The guard on duty greets arrivals, directs them to registration or the lifts, issues visitor passes, and keeps the wheelchairs moving to the door for those who need one.', specs: ['Visitor register and passes', 'Wireless handset to the CCTV control room', 'Fire panel repeater beside the door'] })
  // Hand sanitiser on its stand by the doors, and the self-registration kiosk.
  const hs = room.at(-8.75, 11.05, PI)
  k.box(hs, 0.3, 0.02, 0.3, m.powder, 0, 0.01, 0)
  k.cyl(hs, 0.02, 0.02, 1.2, m.powder, 0, 0.6, 0, 10)
  k.soft(hs, 0.12, 0.24, 0.11, 0.02, m.whitePlastic, 0, 1.3, 0.05)
  const ki = room.at(-5.2, 11.0, PI)
  kiosk(e, ki)
  room.info(ki, { title: 'Self-Registration Kiosk', kind: 'Patient self-service', body: 'Returning patients key in their UHID or mobile number, choose a department and print their OPD token without queueing at the counter; payment can be made by card or UPI.', specs: ['21.5" touch screen', 'Thermal token printer', 'Card reader and UPI QR', 'English, Telugu and Hindi'] })

  // The appointment and lift assistance counter at the mouth of the corridor to the lifts.
  const ac = room.at(-3.75, 4.95, 0)
  counter(e, ac, 1.7, [-0.45])
  workstation(e, ac, 0.25, 0.765, 0.05, PI, o.his('g_appt', 'Appointment Scheduling', 'table'))
  deskPhone(e, ac, -0.35, 0.765, 0.15, PI)
  taskChair(e, group(ac, 0.2, 0, -0.55, 0))
  const aw = room.onWall('-z', -3.75)
  wallScreen(e, aw, 0.7, 2.0, tokens(e, 'appt', 'Appointments Today', [['Dr. on duty', 'Gen. Medicine · 101'], ['Dr. on duty', 'Cardiology · 102'], ['Dr. on duty', 'Orthopaedics · 104']], 9105))
  sign(e, aw, 'appt', 'APPOINTMENTS · LIFT ASSISTANCE', 'Lifts to floors 1–3 →', 1.9, 0.34, 0, 2.62, 0.02)
  room.info(ac, { title: 'Appointment & Lift Assistance Counter', kind: 'Front office · Patient guidance', body: 'Books and reschedules consultations, prints appointment slips, and sends an attendant with patients who need help to the lifts and up to the consultation, laboratory or imaging floors.', specs: ['Appointment module on the hospital information system', 'Live doctor schedule display', 'Attendants with wheelchairs on call', 'Next to the OPD lifts'] })

  // Waiting seats facing the reception, clear of the way from the doors to the corridor.
  for (const x of [-4.4, -3.2]) beamSeating(e, room.at(x, 8.45, -PI / 2), 5)
}

/* ---------- the waiting lounge ---------- */

const waiting: Fitter = (e, room) => {
  // Two rows of linked seats facing the billing and report counters.
  for (const x of [-1.3, -0.1]) beamSeating(e, room.at(x, 0.4, PI / 2), 6)
  // The RO water cooler and bins at the corridor end.
  const wc = room.at(-1.45, -2.95, PI / 2)
  waterCooler(e, wc)
  room.info(wc, { title: 'Drinking Water Station', kind: 'Patient amenity', body: 'Reverse-osmosis purified drinking water, chilled and at room temperature, with paper cups beside it.', specs: ['RO + UV purification', '40 L/h chilled capacity', 'Filters changed quarterly'] })
  bins(e, room.at(-1.65, -2.2, PI / 2), ['black', 'green'])
  // The token display hung over the lounge, facing the seats; the clock and a notice behind them.
  hungScreen(e, room, 2.3, 0.3, -PI / 2, 1.0, tokens(e, 'lounge', 'Now Serving', [['B-031', 'Billing Counter 1'], ['B-032', 'Billing Counter 2'], ['R-019', 'Report Collection'], ['P-112', 'Pharmacy Window 1']], 9102))
  clock(e, room.onWall('-x', 1.0))
  poster(e, room.onWall('-x', -1.0), 'Patient Rights', '#1c3966', 0.42, 0.6, 1.6)
}

/* ---------- the wheelchair bay ---------- */

const wheelchairs: Fitter = (e, room) => {
  const st = room.at(1.45, 5.6, 0)
  bed(e, st, { back: 0.3, linen: 'made', height: 0.8 })
  room.info(st, { title: 'Patient Trolley (Stretcher)', kind: 'Patient transport', body: 'A hydraulic patient-transfer trolley kept ready at the entrance for patients who cannot walk in: height adjustable, with a raised backrest, side rails and brakes.', specs: ['2.12 × 0.92 m, 0.56–0.9 m litter height', 'Radiolucent litter', 'Central brake, steering castor', 'IV pole and oxygen holder'] })
  const chairs = [9.6, 10.75, 11.9].map((z) => {
    const g = room.at(1.45, z, PI + (z - 10.75) * 0.03)
    wheelchair(e, g)
    return g
  })
  room.info(chairs[1], { title: 'Wheelchairs', kind: 'Patient transport', body: 'Foldable attendant-propelled wheelchairs for patients and the elderly, free of charge; ask the security desk or an attendant.', specs: ['Powder-coated steel frame, 18" seat', 'Swing-away footrests', 'Parking brakes on both wheels'] })
  sign(e, room.onWall('+x', 8.0), 'wheelchairs', 'WHEELCHAIRS & STRETCHERS', 'Please ask at the security desk', 1.25, 0.36, 0, 1.85, 0.02)
}

/* ---------- billing and reports ---------- */

/** A staff desk run along the hatch wall (x = room.x0), z0 … z1, 0.7 deep, a solid-surface top. */
function hatchDesk(e: OpdCtx, room: Room, z0: number, z1: number) {
  const { k, m } = e
  const g = room.at(room.x0 + 0.35, (z0 + z1) / 2, 0)
  k.box(g, 0.7, 0.03, z1 - z0, m.solidSurface, 0, 0.75, 0)
  for (const s of [-1, 1]) k.box(g, 0.68, 0.735, 0.02, m.hpl, 0, 0.3675, s * ((z1 - z0) / 2 - 0.01))
  k.box(g, 0.02, 0.5, z1 - z0 - 0.04, m.hpl, -0.33, 0.45, 0)
  return g
}

const billing: Fitter = (e, room) => {
  const { o } = e
  const dg = hatchDesk(e, room, -3.2, 0.05)
  for (const z of [-2.35, -0.75]) pedestal(e, room.at(room.x0 + 0.58, z, PI / 2), 'Billing Drawer')
  cashDrawer(e, room.at(room.x0 + 0.4, -1.55, PI / 2), 0, 0.6, 0)
  ;[-2.6, -1.55, -0.5].forEach((z, i) => {
    computer(e, room.at(room.x0 + 0.3, z, PI / 2), 0, 0.765, 0, 0, o.his(`g_bill${i}`, 'OPD Billing · Invoice', i === 1 ? 'table' : 'form'))
    receiptPrinter(e, room.at(room.x0 + 0.32, z - 0.42, PI / 2), 0, 0.765, 0)
    payTerminal(e, room.at(room.x0 - 0.2, z, -PI / 2, 1.04), 0, 0, 0)
  })
  noteCounter(e, room.at(room.x0 + 0.45, 0.0 - 0.15, PI / 2), 0, 0.765, 0)
  deskPhone(e, room.at(room.x0 + 0.5, -3.0, PI / 2), 0, 0.765, 0)
  for (const z of [-1.9, -0.95]) taskChair(e, room.at(4.25, z, -PI / 2))
  cupboard(e, room.at(room.x1 - 0.45, -1.55, -PI / 2), 1.4, 0.9, 0.45, { fill: 'files', label: 'Billing Records' })
  poster(e, room.onWall('+x', -1.55), 'Tariff & Package Rates', '#1c3966', 0.5, 0.7, 1.75)
  room.info(dg, {
    title: 'OPD Billing Counter',
    kind: 'Front office · Accounts',
    body: 'Consultation, investigation and procedure charges are billed here against the patient\'s UHID; cash, cards, UPI and insurance pre-authorisations are accepted, and a printed invoice with a GST break-up is issued.',
    specs: ['Three billing workstations on the hospital information system', 'Card / UPI payment terminals at each window', 'Thermal invoice printers, note counter and cash drawer', 'Insurance and TPA cases referred to room G02'],
  })
  // The public side: the window's sign above the hatch, and the queue lane before it.
  sign(e, room.at(room.x0 - 0.13, -1.55, -PI / 2), 'billing', 'BILLING', 'Cash · Card · UPI · Insurance', 2.2, 0.42, 0, 2.6, 0)
  const q = room.at(0, 0, 0)
  const posts: [number, number][] = [[2.6, -3.0], [2.6, -1.55], [2.6, -0.1]]
  for (const [x, z] of posts) stanchion(e, q, x, z)
  for (let i = 0; i + 1 < posts.length; i++) belt(e, q, posts[i][0], posts[i][1], posts[i + 1][0], posts[i + 1][1])
}

const reports: Fitter = (e, room) => {
  const { o } = e
  const dg = hatchDesk(e, room, 0.5, 3.05)
  ;[1.1, 2.3].forEach((z, i) => {
    computer(e, room.at(room.x0 + 0.3, z, PI / 2), 0, 0.765, 0, 0, o.his(`g_rep${i}`, 'Report Dispatch · LIS / RIS', 'table'))
    taskChair(e, room.at(4.25, z, -PI / 2 + (i - 0.5) * 0.2))
  })
  printer(e, room.at(room.x0 + 0.35, 2.8, PI / 2), 0, 0.765, 0)
  papers(e, room.at(room.x0 + 0.35, 1.7, PI / 2), 0, 0.765, 0)
  pedestal(e, room.at(room.x0 + 0.58, 0.85, PI / 2), 'Report Drawer')
  const ph = room.at(room.x1 - 0.35, 1.6, -PI / 2)
  pigeonholes(e, ph, 2.0, 2.0, 0.35, 6, 7)
  room.info(ph, { title: 'Report Pigeonholes', kind: 'Diagnostic reports · Dispatch', body: 'Printed laboratory and imaging reports are filed in sealed envelopes by UHID, ready to hand over at the window against the patient\'s receipt; reports are also sent by SMS link.', specs: ['42 cubbies, filed by UHID', 'Films and CDs in the imaging section', 'Unclaimed reports kept 30 days'] })
  for (const x of [3.55, 4.05]) fileCabinet(e, room.at(x, room.z1 - 0.62, PI), 4)
  room.info(dg, { title: 'Report Collection Counter', kind: 'Front office · Diagnostics', body: 'Patients collect their laboratory, X-ray, ultrasound, CT and MRI reports here on showing their bill receipt; copies are reprinted from the laboratory and radiology information systems.', specs: ['Two dispatch workstations', 'Report reprint and CD burning', 'Collection by receipt or SMS OTP'] })
  sign(e, room.at(room.x0 - 0.13, 1.75, -PI / 2), 'reports', 'REPORT COLLECTION', 'Laboratory · X-ray · Scans', 2.1, 0.42, 0, 2.6, 0)
}

/* ---------- the pharmacy ---------- */

const pharmacy: Fitter = (e, room) => {
  const { k, m, o } = e
  // The dispensing counter under the hatch to the front corridor: drawers and cupboards on the
  // pharmacists' side, the billing workstations and barcode scanners on it.
  const ct = room.at(2.0, room.z1 - 0.62, PI)
  baseRun(e, ct, 5.4, { fill: 'medicines' })
  ;[0.2, 1.9, 3.6].forEach((x, i) => {
    computer(e, room.at(x, room.z1 - 0.38, PI), 0, 0.915, 0, 0, o.his(`g_pharm${i}`, 'Pharmacy · Dispensing & Billing', i === 1 ? 'table' : 'form'))
    scanner(e, room.at(x + 0.45, room.z1 - 0.3, PI), 0, 0.915, 0)
  })
  receiptPrinter(e, room.at(2.75, room.z1 - 0.32, PI), 0, 0.915, 0)
  for (let i = 0; i < 6; i++) k.box(room.group, 0.18, 0.004, 0.26, m.paper, -0.3 + i * 0.012, room.y + 0.915 + i * 0.004, room.z1 - 0.32, false)
  for (const x of [0.9, 2.8]) stool(e, room.at(x, room.z1 - 1.1, 0))
  room.info(ct, {
    title: 'Pharmacy Dispensing Counter',
    kind: 'Pharmacy · Dispensing',
    body: 'Prescriptions are checked by a registered pharmacist against the doctor\'s e-prescription, billed with each strip\'s batch and expiry scanned, and handed over with counselling on dose and timing.',
    specs: ['Three dispensing and billing workstations', 'Barcode batch and expiry scanning', 'Schedule H and H1 drugs on prescription only', 'Drawers of strips and cupboards of fast movers'],
  })
  // Open shelving of medicines on both side walls; the fridge on the east wall.
  for (const z of [-11.3, -10.1, -8.9, -7.7]) medicineShelves(e, room.at(room.x0 + 0.4, z, PI / 2), 1.2, 2.1, 0.4, 6)
  for (const z of [-9.7, -8.5, -7.3]) medicineShelves(e, room.at(room.x1 - 0.4, z, -PI / 2), 1.2, 2.1, 0.4, 6)
  const fr = room.at(room.x1 - 0.62, -10.75, -PI / 2)
  medFridge(e, fr, 'Pharmacy Refrigerator')
  room.info(fr, { title: 'Pharmaceutical Refrigerator', kind: 'Cold chain · +2 to +8 °C', body: 'Holds insulins, vaccines, eye drops and other heat-sensitive medicines between 2 and 8 °C, its temperature logged every five minutes and alarmed if it drifts.', specs: ['400 L, glass door, forced-air cooling', 'Digital display and data logger', 'Audible and SMS temperature alarm', 'On the standby generator circuit'] })
  // The back wall: the cabinet of strip drawers, and the staff working area beside it.
  const sc = room.at(0.0, room.z0 + 0.45, 0)
  stripCabinet(e, sc, 5, 4)
  room.info(sc, { title: 'Strip Drawer Cabinet', kind: 'Pharmacy · Storage', body: 'Tablets and capsules in their strips, filed alphabetically by generic name in labelled drawers, so the pharmacist can pick a prescription without leaving the counter.', specs: ['20 drawers, labelled by generic name', 'FEFO: first expiry, first out', 'Prescriptions awaiting dispensing on top'] })
  const sd = room.at(2.1, room.z0 + 0.375, PI)
  desk(e, sd, 1.4, 0.75, 1)
  computer(e, sd, -0.15, 0.75, 0.1, PI, o.his('g_pharmstock', 'Pharmacy · Stock & Indents', 'table'))
  deskPhone(e, sd, 0.45, 0.75, 0.05, PI)
  papers(e, sd, -0.5, 0.75, -0.1, 0.3)
  taskChair(e, group(sd, 0.0, 0, -0.62, 0.15))
  // The checking bench in the middle: prescriptions in trays, a label printer, a counting tray.
  const wb = room.at(2.0, -8.8, 0)
  workbench(e, wb, 1.8, 0.8, 0.9)
  for (let i = 0; i < 3; i++) k.box(wb, 0.28, 0.06, 0.36, m.binBlue, -0.55 + i * 0.32, 0.93, -0.3)
  k.box(wb, 0.2, 0.012, 0.12, m.whitePlastic, 0.5, 0.906, -0.25)
  receiptPrinter(e, wb, 0.6, 0.9, -0.6, 0)
  papers(e, wb, 0.15, 0.9, -0.5, 0.1)
  for (let i = 0; i < 5; i++) bottle(e, wb, -0.7 + i * 0.07, 0.9, -0.65, 0.12, 0.025, i % 2 ? m.amber : m.whitePlastic, m.whitePlastic)
  room.info(wb, { title: 'Prescription Checking Bench', kind: 'Pharmacy · Quality check', body: 'Every filled prescription is laid out in its tray and checked by a second pharmacist against the prescription before it goes to the counter.', specs: ['Double-check of drug, strength and quantity', 'Dosage labels in English and Telugu'] })
  // Out on the corridor: the pharmacy's sign over its hatch and its token display.
  sign(e, room.at(1.0, -5.69, 0), 'pharmacy', 'PHARMACY', 'Open 24 hours · Prescriptions & OTC', 2.6, 0.42, 0, 2.65, 0)
  wallScreen(e, room.at(3.95, -5.7, 0), 0.9, 2.62, tokens(e, 'pharm', 'Pharmacy · Ready to Collect', [['P-112', 'Window 1'], ['P-113', 'Window 2'], ['P-109', 'Window 3']], 9103))
  extinguisher(e, room.onWall('-z', 3.3))
}

const pharmacyStore: Fitter = (e, room) => {
  const { o } = e
  const xs = [-0.3, 1.25, 2.8]
  for (const x of xs) bulkRack(e, room.at(x, room.z1 - 0.55, PI))
  for (const x of xs) {
    bulkRack(e, room.at(x, -14.7, 0))
    bulkRack(e, room.at(x, -15.8, PI))
  }
  for (const x of xs.slice(0, 2)) bulkRack(e, room.at(x, room.z0 + 0.55, 0))
  const pl = room.at(3.0, -17.3, 0.05)
  pallet(e, pl, 1.2, 1.0, 4)
  room.info(pl, { title: 'Incoming Stock', kind: 'Pharmacy store · Receiving', body: 'A delivery from the distributor waiting to be checked against its invoice, entered into stock batch by batch and shelved first-expiry-first-out.', specs: ['Goods received note against the purchase order', 'Batch, expiry and MRP entered on receipt'] })
  const r0 = room.at(1.25, room.z1 - 0.55, PI)
  room.info(r0, { title: 'Bulk Medicine Racks', kind: 'Pharmacy store', body: 'Heavy-duty steel racking holding the pharmacy\'s reserve stock of tablets, syrups, IV fluids and consumables in their cartons, arranged by therapeutic group.', specs: ['Six bays, four levels each', 'Stock rotated first-expiry-first-out', 'Temperature kept below 25 °C'] })
  for (const z of [-14.0, -13.05]) medFridge(e, room.at(room.x1 - 0.62, z, -PI / 2), 'Cold Chain Refrigerator', 1.85, 0.9)
  const dg = room.at(room.x1 - 0.38, -16.3, PI / 2)
  desk(e, dg, 1.2, 0.7, -1)
  computer(e, dg, 0.1, 0.75, 0.1, PI, o.his('g_store', 'Store · Goods Received', 'form'))
  papers(e, dg, -0.4, 0.75, -0.05, 0)
  taskChair(e, group(dg, 0, 0, -0.62, 0))
}

/* ---------- dressing and injection ---------- */

const dressing: Fitter = (e, room) => {
  const { m, o } = e
  const ceiling = room.ceiling
  // Two couches along the east wall, a curtain round each.
  const c1 = room.at(-1.95, -10.75, PI / 2)
  examCouch(e, c1)
  const c2 = room.at(-1.95, -8.15, PI / 2)
  examCouch(e, c2)
  curtain(e, room.at(-2.75, room.z0 + 0.05, -PI / 2), room.z1 - room.z0 - 1.1, ceiling, 0.42)
  curtain(e, room.at(-2.75, -9.45, 0), room.x1 - (-2.75) - 0.05, ceiling, 1)
  gasPanel(e, room.onWall('+x', -11.35))
  gasPanel(e, room.onWall('+x', -8.75))
  room.info(c1, { title: 'Dressing & Examination Couch', kind: 'Procedure furniture', body: 'A two-section couch with an adjustable backrest, covered in a fresh paper sheet for each patient; wounds are dressed and injections given here behind the cubicle curtain.', specs: ['1.88 × 0.62 m, 0.68 m high', 'Adjustable head section', 'Oxygen and suction at the bed head', 'Privacy curtain on a ceiling track'] })
  // The injection preparation counter on the west wall: drawers, a sink, glazed supply cupboards over it.
  const ic = room.at(room.x0 + 0.62, -10.5, PI / 2)
  baseRun(e, ic, 2.4, { sink: 0.6, fill: 'supplies' })
  wallCupboard(e, room.at(room.x0 + 0.35, -10.65, PI / 2), 1.8, 0.75, 0.35, 1.5, { glass: true, fill: 'supplies', label: 'Supply Cupboard' })
  dressingSupplies(e, room.at(room.x0 + 0.3, -10.0, PI / 2), 0.7, 0.45, 0.92)
  gloveBox(e, room.group, room.x0 + 0.25, room.y + 0.92, -9.5, PI / 2)
  for (let i = 0; i < 4; i++) bottle(e, room.group, room.x0 + 0.22, room.y + 0.92, -11.5 + i * 0.07, 0.15, 0.03, i % 2 ? m.amber : m.whitePlastic, i % 2 ? m.black : m.red)
  sharps(e, room.onWall('-x', -9.45), 1.2)
  room.info(ic, { title: 'Injection Preparation Counter', kind: 'Clinical work surface', body: 'Injections are drawn up and labelled here on a clean, wipeable solid-surface top: syringes, needles, IV cannulas and dressings in the drawers below, ampoules in the glazed cupboards above, the sharps container within reach.', specs: ['Solid-surface top with an integral stainless sink', 'Elbow-operated mixer tap', 'Wall sharps container at the end', 'Separate clean and dirty zones'] })
  // Trolleys by the couches.
  const dt = room.at(-3.25, -8.3, PI / 2)
  dressingTrolley(e, dt)
  room.info(dt, { title: 'Dressing Trolley', kind: 'Instruments & dressings', body: 'A two-tier stainless trolley laid for a dressing: sterile instruments in their tray, gallipots for antiseptic, gauze swabs, cotton rolls and crêpe bandages, with a waste bag on its ring.', specs: ['AISI 304 stainless, 750 × 480 mm', 'Forceps, scissors and gallipots autoclaved per patient', 'Povidone-iodine and chlorhexidine solutions'] })
  const it = room.at(-3.25, -11.25, 0)
  injectionTrolley(e, it)
  room.info(it, { title: 'Injection Trolley', kind: 'Medication', body: 'Drawers of syringes, needles, cannulas, alcohol swabs and tourniquets; the day\'s injections laid out on the top tray with the sharps box clipped to its side.', specs: ['Lockable drawers', '2, 5 and 10 ml syringes; 22–26 G needles', 'Sharps container on the trolley'] })
  // Colour-coded waste bins by the door, the hand-wash basin on the corridor wall, oxygen ready.
  bins(e, room.at(room.x0 + 0.18, -8.55, PI / 2), ['yellow', 'red', 'blue'])
  basin(e, room.onWall('+z', -2.5))
  const ot = room.at(-1.65, -6.35, PI)
  oxygenTrolley(e, ot, cylinder)
  room.info(ot, { title: 'Oxygen Cylinder Trolley', kind: 'Medical gas · Emergency', body: 'A portable B-type oxygen cylinder with its regulator and flowmeter, kept charged by the door for a patient who becomes breathless or faints during a procedure.', specs: ['1.5 m³ oxygen, 150 bar', 'Pressure regulator and 0–15 L/min flowmeter', 'Checked full at every shift'] })
  clock(e, room.onWall('+z', -4.0))
  void o
}

/* ---------- administration ---------- */

const admin: Fitter = (e, room) => {
  const { o } = e
  const d1 = room.at(-2.3, -14.35, 0)
  desk(e, d1, 1.4, 0.75, 1)
  computer(e, d1, 0.2, 0.75, -0.12, PI, o.his('g_admin1', 'Patient Registration · MRD', 'form'))
  deskPhone(e, d1, -0.45, 0.75, -0.1, PI)
  papers(e, d1, -0.2, 0.75, 0.1, 0.2)
  taskChair(e, group(d1, 0.1, 0, -0.68, 0.1))
  for (const x of [-2.6, -2.0]) patientChair(e, room.at(x, -13.5, PI))
  room.info(d1, { title: 'Administration & Patient Registration', kind: 'Hospital administration', body: 'The OPD manager\'s office: UHID corrections and merges, medico-legal and referral paperwork, patient feedback and complaints, and daily OPD statistics for the management.', specs: ['Registration and MRD workstations', 'Feedback and grievance register', 'Open during OPD hours'] })
  const d2 = room.at(-2.3, -16.5, 0)
  desk(e, d2, 1.4, 0.75, -1)
  computer(e, d2, -0.1, 0.75, -0.12, PI, o.his('g_admin2', 'OPD Statistics', 'graph'))
  printer(e, d2, 0.45, 0.75, -0.05, PI)
  taskChair(e, group(d2, -0.1, 0, -0.66, -0.2))
  // The meeting table, the photocopier, filing.
  const mt = room.at(-3.95, -15.4, 0)
  roundTable(e, mt, 0.9)
  patientChair(e, room.at(-3.95, -14.6, PI))
  patientChair(e, room.at(-3.95, -16.2, 0))
  patientChair(e, room.at(-3.15, -15.4, -PI / 2))
  papers(e, mt, 0.05, 0.75, 0.05, 0.6)
  const pc = room.at(room.x1 - 0.62, -12.6, -PI / 2)
  photocopier(e, pc)
  room.info(pc, { title: 'Multifunction Photocopier', kind: 'Office equipment', body: 'Copies, prints and scans patients\' documents (ID proofs, referral letters, insurance papers) straight into their electronic record.', specs: ['A3 / A4, 35 pages per minute', 'Duplex scanning to the HIS', 'Network printing'] })
  for (const x of [-3.4, -2.9]) fileCabinet(e, room.at(x, room.z0 + 0.62, 0), 4)
  cupboard(e, room.at(room.x0 + 0.45, -17.2, PI / 2), 1.0, 2.0, 0.45, { fill: 'files', label: 'Records Cupboard' })
  poster(e, room.onWall('-x', -14.2), 'OPD Duty Roster', '#1c3966', 0.6, 0.45, 1.6)
  clock(e, room.onWall('+x', -15.5))
}

/* ---------- the south side: security, insurance, vaccination ---------- */

const security: Fitter = (e, room) => {
  const { o } = e
  const wall = room.onWall('-z', -9.6)
  cctvWall(e, wall, 3, 2, 0.6, 1.3)
  room.info(wall, { title: 'CCTV Video Wall', kind: 'Security · Surveillance', body: 'Live views from the hospital\'s cameras (entrances, corridors, lift lobbies, the pharmacy, the car park) on six screens, recorded for 30 days on the network video recorder.', specs: ['64 IP cameras, 4 views per screen', 'NVR with 30-day retention', 'Monitored round the clock'] })
  const dg = room.at(-9.6, room.z0 + 0.38, PI)
  desk(e, dg, 2.0, 0.7, 1)
  computer(e, dg, -0.5, 0.75, 0.12, PI, o.his('g_vms', 'Video Management · Live', 'image'))
  computer(e, dg, 0.35, 0.75, 0.12, PI, o.his('g_access', 'Access Control · Alarms', 'table'))
  deskPhone(e, dg, 0.8, 0.75, -0.05, PI)
  for (const x of [-0.45, 0.4]) taskChair(e, group(dg, x, 0, -0.66, (x > 0 ? 1 : -1) * 0.15))
  lockers(e, room.at(-10.6, room.z1 - 0.5, PI), 3)
  keyCabinet(e, room.onWall('+z', -9.3), 1.3)
  cupboard(e, room.at(room.x1 - 0.45, -6.4, -PI / 2), 0.8, 0.85, 0.45, { fill: 'files', label: 'Security Cupboard' })
  radioChargers(e, room.at(room.x1 - 0.25, -6.4, -PI / 2), 0.87)
  extinguisher(e, room.onWall('+x', -5.4), 'co2')
}

const insurance: Fitter = (e, room) => {
  const { o } = e
  ;[-7.95, -9.3].forEach((z, i) => {
    const dg = room.at(-10.0, z, PI / 2)
    desk(e, dg, 1.15, 0.7, i ? -1 : 1)
    computer(e, dg, 0.15, 0.75, -0.1, PI, o.his(`g_tpa${i}`, i ? 'Pre-authorisation · TPA Portal' : 'Insurance Verification', i ? 'table' : 'form'))
    papers(e, dg, -0.3, 0.75, 0.1, 0.1)
    taskChair(e, group(dg, 0, 0, -0.62, 0))
    patientChair(e, room.at(-9.2, z, -PI / 2))
    if (i === 0) {
      deskPhone(e, dg, 0.45, 0.75, -0.15, PI)
      room.info(dg, { title: 'Insurance & TPA Desk', kind: 'Front office · Insurance', body: 'Checks cover under health insurance policies and government schemes, raises pre-authorisation requests with the TPA for scans and day-care procedures, and settles cashless claims.', specs: ['All major insurers and TPAs', 'Ayushman Bharat PM-JAY and Aarogyasri desks', 'Cashless pre-authorisation in 2–4 hours'] })
    } else printer(e, dg, 0.4, 0.75, -0.1, PI)
  })
  cupboard(e, room.at(-8.0, room.z0 + 0.45, 0), 0.9, 2.0, 0.45, { fill: 'files', label: 'Claim Files' })
  poster(e, room.onWall('+z', -9.8), 'Cashless Treatment · Empanelled TPAs', '#1f6fd1', 0.5, 0.7, 1.6)
}

const vaccination: Fitter = (e, room) => {
  const { m } = e
  const ilr = room.at(-10.9, room.z0 + 0.7, 0)
  chest(e, ilr, 'ilr', 1.1)
  room.info(ilr, { title: 'Ice-Lined Refrigerator (ILR)', kind: 'Cold chain · Vaccines', body: 'The vaccines are kept here between +2 and +8 °C: a top-opening chest whose lining of ice keeps it cold through power cuts, its temperature recorded twice a day as the immunisation programme requires.', specs: ['140 L, ice-lined, top opening', 'Holds +2 to +8 °C for 16 h without power', 'Vaccines in baskets, diluents beside them', 'Temperature logbook twice daily'] })
  const fz = room.at(-9.7, room.z0 + 0.7, 0)
  chest(e, fz, 'freezer', 0.95)
  room.info(fz, { title: 'Deep Freezer', kind: 'Cold chain · Ice packs', body: 'Freezes the ice packs for the vaccine carriers at −15 to −25 °C.', specs: ['−15 to −25 °C', 'Ice packs frozen flat for 24 h'] })
  const ct = room.at(-10.3, room.z1 - 0.62, PI)
  baseRun(e, ct, 1.8, { sink: 0.5, fill: 'supplies' })
  dispensers(e, room.onWall('+z', -10.8), 1.25)
  carrier(e, room.group, -9.75, room.y + 0.915, room.z1 - 0.3, 1)
  carrier(e, room.group, -8.75, room.y, -12.95, 1.3)
  for (let i = 0; i < 6; i++) bottle(e, room.group, -10.0 + i * 0.05, room.y + 0.915, room.z1 - 0.45, 0.06, 0.012, m.clearPlastic, i % 2 ? m.red : m.blue)
  gloveBox(e, room.group, -10.55, room.y + 0.915, room.z1 - 0.4, 0)
  sharps(e, room.onWall('+z', -9.1), 1.2)
  room.info(ct, { title: 'Vaccine Preparation Counter', kind: 'Immunisation', body: 'Vials are taken from the carrier on the counter, checked for their vaccine vial monitor and expiry, and drawn into auto-disable syringes; the sink and dispensers are within reach.', specs: ['Auto-disable syringes only', 'Open-vial policy followed', 'Hub cutter and sharps container'] })
  const cc = room.at(-8.0, -12.3, PI / 2)
  examCouch(e, cc)
  patientChair(e, room.at(-9.1, -11.65, PI / 2))
  bins(e, room.at(-11.2, -11.7, PI / 2), ['yellow', 'red'])
  poster(e, room.onWall('+z', -9.6 + 0.0), 'Immunisation Schedule', '#c2185b', 0.42, 0.6, 1.7)
  clock(e, room.onWall('-z', -8.4))
}

/* ---------- the plant and housekeeping ---------- */

const plant: Fitter = (e, room) => {
  const { k, m } = e
  const slab = 4.95 - 0.3 - room.y
  const lt = room.at(room.x0 + 0.5, -24.4, PI / 2)
  ltPanel(e, lt, 3)
  room.info(lt, { title: 'LT Distribution Panel', kind: 'Electrical · 415 V', body: 'Takes power from the transformer and the standby generator through the changeover and distributes it to the OPD floors, the lifts and the air-conditioning, each feeder on its own breaker.', specs: ['415 V, 3-phase, 800 A incomer', 'Auto changeover to the standby generator', 'Feeders to each floor, lifts and AHUs', 'Earth-leakage and surge protection'] })
  const a1 = room.at(-1.6, -24.4, 0)
  ahu(e, a1, 2.4, 1.3, 1.9, slab, 'AHU-G1 · OPD GROUND')
  const a2 = room.at(1.9, -24.4, 0)
  ahu(e, a2, 2.4, 1.3, 1.9, slab, 'AHU-G2 · PHARMACY & LAB')
  room.info(a1, { title: 'Air-Handling Unit', kind: 'HVAC · Chilled water', body: 'Draws fresh air through the louvres behind it, filters it and cools it over chilled-water coils, then supplies it to the OPD\'s rooms; the fan section\'s access door opens for inspection.', specs: ['6,000 CFM, double-skin casing', 'Pre-filters (G4) and fine filters (F7)', 'Chilled water 7 / 12 °C', '12 air changes an hour in clinical rooms'] })
  // A distribution board on the corridor wall, cable tray overhead, extinguishers by the door.
  const db = room.onWall('+z', -3.2)
  k.box(db, 0.6, 0.8, 0.2, m.greyPlastic, 0, 1.5, 0.1)
  k.box(db, 0.56, 0.76, 0.01, m.hpl, 0, 1.5, 0.205, false)
  k.box(room.group, room.x1 - room.x0 - 0.3, 0.06, 0.4, m.galvanised, (room.x0 + room.x1) / 2, room.y + 3.4, -21.1, false)
  for (const x of [0.8, 1.3]) extinguisher(e, room.onWall('+z', x), x < 1 ? 'co2' : 'abc')
  k.box(room.group, 4.0, 0.004, 1.2, m.vacuum, -0.5, room.y + 0.014, -22.9, false)
}

const housekeeping: Fitter = (e, room) => {
  mopSink(e, room.at(4.0, room.z0, 0))
  for (const z of [-24.4, -22.9]) rack(e, room.at(room.x1 - 0.5, z, -PI / 2), 1.4, 1.9, 0.5, 5, 'linen')
  const sh = room.onWall('-x', -23.5)
  wallShelves(e, sh, 1.2, 0.3, [1.2, 1.6])
  chemicals(e, group(sh, 0, 0, 0.27), 1.1, 1.21)
  chemicals(e, group(sh, 0, 0, 0.27), 1.1, 1.61)
  const mt = room.at(4.1, -22.8, PI / 2)
  mopTrolley(e, mt)
  room.info(mt, { title: 'Housekeeping Trolley', kind: 'Housekeeping', body: 'Mop, wringer bucket and cleaning chemicals for the OPD\'s routine and spill cleaning, colour-coded so that toilet and clinical areas never share a mop.', specs: ['Colour-coded mops and cloths', 'Hospital-grade disinfectant (1% hypochlorite)', '"Wet floor" signs carried on the trolley'] })
  linenTrolley(e, room.at(4.2, -24.3, PI / 2))
}

export const GROUND: Record<string, Fitter> = {
  hall_g: hall,
  waiting_g: waiting,
  wheelchairs,
  billing,
  reports,
  pharmacy,
  pharmacy_store: pharmacyStore,
  dressing_injection: dressing,
  admin,
  security,
  insurance,
  vaccination,
  ahu: plant,
  housekeeping,
}

