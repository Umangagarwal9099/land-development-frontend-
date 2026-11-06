import type { Object3D } from 'three'
import { PI } from '../../../kit'
import { group, signPanel } from '../../erKit'
import { taskChair } from '../../erFurniture'
import { ecgCart } from '../../erEquipment'
import type { OpdCtx, Room } from '../ctx'
import {
  autoclave, balanceTable, bench, biosafetyCabinet, bloodCulture, centrifuge, chemAnalyser, cliaAnalyser, coagAnalyser, colonyCounter, deepFreezer,
  electrolyteAnalyser, elisaReader, elisaWasher, esrStand, floorCentrifuge, haemAnalyser, incubator, labelPrinter, microscope, passBox, phlebotomyChair,
  phlebotomyTray, pneumaticStation, roUnit, semiAuto, shaker, slideStainer, tubeRack, tubeRoller, tubeTray, urineAnalyser, urineRack, vortex, waterStill,
} from '../equipment/lab'
import { apronRack, bodyBox, calibrationSyringe, ceilingTube, chestStand, generatorConsole, spirometer, ultrasoundCart, visionChart, xrayTable } from '../equipment/radiology'
import {
  basin, bins, bottle, bpMonitor, clock, computer, cupboard, curtain, desk, dispensers, examCouch, gloveBox, medFridge, papers, patientChair, poster, printer,
  labStool, rack, roundStool, scale, sharps, stadiometer, stethoscope, wallScreen,
} from '../furniture'
import { barcodeScanner, phlebotomyKit } from '../equipment/items'
import { board, NAVY, radiation, tokenScreen } from '../paints'
import type { Fitter } from './types'

/*
 * The second floor: the diagnostic laboratory and the radiology and physiology rooms beside it.
 * Collection near the lounge; samples go by the pneumatic tube and the back corridor to the
 * receiving room, from there to haematology, biochemistry and serology down the north side and
 * to processing, clinical pathology and microbiology across the back; the X-ray room and its
 * control on the south side, over the CT suite's on the floor above.
 */

/** A piece's group on a bench top (worktop at 0.9 m), at x along the bench, set back to z. */
const top = (p: Object3D, x: number, z = -0.06, ry = 0) => group(p, x, 0.9, z, ry)

/** Hygiene by a door: the sharps box, gloves and the colour-coded bins, on a wall. */
function hygiene(e: OpdCtx, room: Room, side: Parameters<Room['onWall']>[0], along: number, colours: Parameters<typeof bins>[2] = ['yellow', 'red', 'black']) {
  const g = room.onWall(side, along, 0, 0.18)
  bins(e, g, colours)
  const w = room.onWall(side, along)
  sharps(e, w, 1.25)
  gloveBox(e, w, 0.42, 1.2, 0.07, 0)
}

/** A lab bench's operator: the shared lab stool (gas lift, foot ring) tucked in at its knee space. */
function benchStool(e: OpdCtx, p: Object3D, x: number, z: number) {
  labStool(e, group(p, x, 0, z, PI + 0.2))
}

/* ---------- general health check-up ---------- */

const healthCheck: Fitter = (e, room) => {
  const { o } = e
  const g = room.at(room.x0 + 0.95, room.z0 + 1.05, 0)
  desk(e, g, 1.3, 0.7, 1)
  taskChair(e, group(g, 0, 0, -0.62, 0.15))
  for (const x of [-0.32, 0.32]) patientChair(e, group(g, x, 0, 0.78, PI + (x > 0 ? -0.15 : 0.1)))
  computer(e, g, -0.28, 0.75, -0.12, PI + 0.15, o.his('hcDesk', 'HEALTH CHECK · PACKAGE', 'form'))
  bpMonitor(e, g, 0.38, 0.75, 0.08, PI)
  stethoscope(e, g, 0.32, 0.75, -0.15)
  papers(e, g, -0.1, 0.75, 0.12)
  // The couch along the passage wall, its foot towards the door; the ECG trolley beside the desk.
  const couch = room.at(room.x1 - 0.4, room.z0 + 2.05, -PI / 2)
  examCouch(e, couch)
  const ecg = room.at(room.x0 + 0.32, room.z0 + 2.35, PI / 2)
  ecgCart(e, ecg, e.m.monitors[0])
  room.info(ecg, {
    title: '12-lead ECG Machine', kind: 'Cardiac diagnostics · Electrocardiograph',
    body: 'A 12-channel resting electrocardiograph on its trolley, for the baseline ECG in every health check-up package; the interpreted trace is printed and sent to the hospital information system.',
    specs: ['12 simultaneous leads, interpretive software', 'Sampling 1,000 samples/s per channel', 'A4 thermal printer, 25/50 mm/s', 'Battery and mains, LAN export to EMR'],
  })
  const sc = room.at(room.x0 + 0.38, room.z1 - 0.5, PI / 2)
  scale(e, sc, 'column')
  room.info(sc, { title: 'Weighing Scale with Height Rod', kind: 'Anthropometry', body: 'A column scale with a sliding height rod for the weight, height and BMI recorded at the start of a health check.', specs: ['Capacity 200 kg, 100 g divisions', 'Height rod 60–210 cm', 'Calibrated quarterly'] })
  visionChart(e, room.onWall('-x', room.z1 - 1.25))
  basin(e, room.onWall('-z', room.x1 - 0.55), 0.5)
  hygiene(e, room, '-z', room.x0 + 1.95, ['yellow', 'black'])
  poster(e, room.onWall('+x', room.z0 + 0.6), 'Health Check Packages', '#1f6fd1')
  clock(e, room.onWall('+x', room.z0 + 1.75))
}

/* ---------- blood sample collection ---------- */

/**
 * A phlebotomy station on a wall at `along`: the chair with its back to the wall, a small worktop
 * at its right with tubes, tray, labels and scanner, the sharps box over it, the phlebotomist's
 * stool, the bins, and a privacy screen on each side.
 */
function station(e: OpdCtx, room: Room, side: Parameters<Room['onWall']>[0], along: number, n: number, screens: [boolean, boolean]) {
  const { k, m } = e
  const g = room.onWall(side, along)
  const chair = group(g, 0.0, 0, 0.47)
  phlebotomyChair(e, chair)
  // The worktop: a narrow mobile cabinet with a solid-surface top.
  const t = group(g, 0.68, 0, 0.32)
  k.box(t, 0.4, 0.82, 0.42, m.hpl, 0, 0.43, 0)
  k.box(t, 0.44, 0.03, 0.46, m.solidSurface, 0, 0.855, 0)
  k.box(t, 0.36, 0.004, 0.003, m.reveal, 0, 0.6, 0.212, false)
  tubeRack(e, t, -0.11, 0.87, 0.12, 6, 2, 0.1, 30 + n)
  phlebotomyTray(e, t, 0.02, 0.87, -0.1, 0.2)
  phlebotomyKit(e, t, 0.13, 0.87, 0.1, -0.3)
  labelPrinter(e, t, 0.14, 0.87, -0.12, -0.4)
  barcodeScanner(e, t, -0.15, 0.87, -0.12, 0.3)
  sharps(e, group(g, 0.68, 0, 0), 1.3)
  roundStool(e, group(g, 0.42, 0, 1.08))
  bins(e, group(g, -0.68, 0, 0.2), ['yellow', 'red'])
  // Privacy screens: laminate panels on feet, 1.6 m high, out from the wall.
  for (const [s, on] of [[-1, screens[0]], [1, screens[1]]] as const) {
    if (!on) continue
    k.box(g, 0.04, 1.55, 1.25, m.hpl, s * 1.0, 0.95, 0.65)
    k.box(g, 0.06, 0.04, 1.3, m.aluminium, s * 1.0, 1.74, 0.65)
    for (const z of [0.1, 1.2]) k.box(g, 0.3, 0.03, 0.05, m.aluminium, s * 1.0, 0.015, z)
  }
  // The station number over the chair.
  signPanel(e, g, 0.24, 0.24, e.o.sign(`phleb_${n}`, 128, 128, board(NAVY, [[String(n), 0.6, '#ffffff']])), 0, 1.95, 0.008, 0, 0.012)
  return chair
}

const bloodCollection: Fitter = (e, room) => {
  const { o } = e
  const chairs = [-1.35, 0.65, 2.65].map((z, i) => station(e, room, '+x', z, i + 1, [true, i === 2]))
  station(e, room, '-x', -1.45, 4, [true, true])
  room.info(chairs[0], {
    title: 'Phlebotomy Station', kind: 'Sample collection',
    body: 'A blood collection station: a padded phlebotomy chair whose arm boards swing and lock at the right height for venepuncture, the phlebotomist\'s stool, and a worktop laid with evacuated tubes, needles and holders, tourniquet, alcohol swabs and cotton; labels are printed with the sample\'s barcode at the chair and scanned before the draw.',
    specs: ['Arm boards adjustable 0.62–0.78 m, swing 180°', 'Evacuated tubes: EDTA, plain, SST, citrate, fluoride, heparin', 'Barcode label printer and 2D scanner at each station', 'Sharps container and yellow/red bins within reach'],
  })
  // Along the room's south wall: hand-wash, the supply cupboard; at the back the sample fridge,
  // the pneumatic tube station and the dispatch bench.
  basin(e, room.onWall('-x', 0.55), 0.55)
  cupboard(e, room.onWall('-x', 1.85, 0, 0.45), 0.9, 1.95, 0.45, { glass: true, fill: 'supplies', label: 'Supply Cupboard' })
  const fridge = room.onWall('-z', room.x0 + 0.42, 0, 0.62)
  medFridge(e, fridge, 'Sample Refrigerator')
  room.info(fridge, { title: 'Sample Storage Refrigerator', kind: 'Cold chain', body: 'Holds collected samples awaiting dispatch and those for repeat testing, at 2–8 °C with a continuous temperature display and alarm.', specs: ['2–8 °C, ±1 °C uniformity', 'Glass door, audible and visual alarm', 'Data-logged every 5 minutes'] })
  const pts = room.onWall('-z', room.x0 + 1.45)
  pneumaticStation(e, pts)
  room.info(pts, { title: 'Pneumatic Tube Station', kind: 'Sample transport', body: 'Sends sealed sample carriers straight to the laboratory\'s receiving room in under a minute, so blood never waits on a corridor.', specs: ['Carrier 110 mm, soft-landing receiver', 'Point-to-point dispatch to station 212', 'Leak-proof bags inside every carrier'] })
  const disp = room.onWall('-z', room.x0 + 2.3, 0, 0.6)
  bench(e, disp, 0.9, { d: 0.6 })
  for (let i = 0; i < 3; i++) tubeRack(e, disp, -0.25 + i * 0.25, 0.9, -0.3, 8, 3, 0, 50 + i)
  tubeTray(e, disp, 0.0, 0.9, -0.52)
  clock(e, room.onWall('+z', room.x0 + 0.3))
  wallScreen(e, room.onWall('-x', room.z1 - 0.5), 0.7, 2.0, o.screen('phlebTokens', 512, 288, tokenScreen('Sample Collection', [['L-114', 'Station 2'], ['L-113', 'Station 1'], ['L-112', 'Station 4'], ['L-111', 'Station 3']], 7041)))
  poster(e, room.onWall('+z', room.x0 + 3.2), 'Fasting Samples: 8–12 h', '#c8161d')
}

/* ---------- ultrasound ---------- */

const ultrasoundRoom: Fitter = (e, room) => {
  const { o } = e
  const couch = room.at(room.x1 - 0.55, room.cz - 0.05, -PI / 2)
  examCouch(e, couch)
  const us = room.at(room.x1 - 1.4, room.z0 + 0.62, -0.35)
  ultrasoundCart(e, us)
  room.info(us, {
    title: 'Ultrasound System', kind: 'Diagnostic imaging · Sonography',
    body: 'A premium cart-based ultrasound scanner for abdominal, obstetric, small-parts, vascular and musculoskeletal examinations: a 21.5" OLED monitor on an articulated arm, a touch panel over the control deck, and convex, linear and phased-array transducers in their holders.',
    specs: ['Transducers: convex 1–5 MHz, linear 4–15 MHz, phased array 1–5 MHz', 'B-mode, colour and power Doppler, PW/CW Doppler, elastography', '21.5" monitor, 12" touch panel', 'DICOM worklist and PACS export; thermal printer'],
  })
  roundStool(e, room.at(room.x1 - 1.3, room.cz - 0.45))
  // The patient's own screen on the wall at the couch's foot, and the curtain at its head.
  wallScreen(e, room.onWall('+z', room.x1 - 0.6), 0.55, 1.95, o.his('usPatient', 'IMAGE', 'image'))
  curtain(e, group(room.group, room.x1 - 2.25, room.y, room.z1 - 0.75), 2.2, room.ceiling, 0.6)
  // The report desk against the inner wall, turned to face it.
  const d = room.onWall('-x', room.cz - 0.4, 0, 0.35)
  d.rotation.y += PI
  desk(e, d, 1.1, 0.6, 0)
  computer(e, d, 0, 0.75, -0.05, PI, o.his('usReport', 'USG · REPORT', 'form'))
  printer(e, d, 0.4, 0.75, 0.05, PI)
  taskChair(e, group(d, 0, 0, -0.6, PI))
  basin(e, room.onWall('-z', room.x0 + 0.5), 0.5)
  hygiene(e, room, '-z', room.x0 + 1.25, ['yellow', 'black'])
}

/* ---------- pulmonary function ---------- */

const pft: Fitter = (e, room) => {
  const { o } = e
  const box = room.at(room.x1 - 0.9, room.cz - 0.2, -PI / 2)
  bodyBox(e, box)
  room.info(box, {
    title: 'Body Plethysmograph', kind: 'Pulmonary function · Body box',
    body: 'A sealed, transparent cabin in which the patient sits and breathes through a mouthpiece and shutter; from the pressure changes it measures thoracic gas volume and airway resistance, and so the lung volumes a spirometer cannot (residual volume, total lung capacity).',
    specs: ['Cabin volume ≈ 900 l, constant volume', 'Measures TGV, Raw, sGaw, RV, TLC; DLCO by single breath', 'Pneumotachograph flow sensor, 0–18 l/s', 'Door with interlock and intercom'],
  })
  const d = room.onWall('+z', room.x0 + 1.05, 0, 1.0)
  desk(e, d, 1.3, 0.7, -1)
  computer(e, d, 0.2, 0.75, -0.15, PI, o.his('pftPC', 'SPIROMETRY · FVC LOOP', 'graph'))
  const sp = spirometer(e, d, -0.35, 0.75, 0.15, PI)
  room.info(sp, {
    title: 'PC Spirometer', kind: 'Pulmonary function · Spirometry',
    body: 'Measures how much and how fast the patient can breathe out: the flow-volume loop, FEV₁, FVC and their ratio, before and after a bronchodilator; disposable bacterial filters and nose clips for every patient.',
    specs: ['Turbine/pneumotach flow sensor, ±3% accuracy', 'FVC, FEV₁, FEV₁/FVC, PEF, MVV; GLI reference values', 'Daily calibration with a 3-litre syringe', 'ATS/ERS 2019 quality grading'],
  })
  taskChair(e, group(d, 0.0, 0, -0.62, 0))
  patientChair(e, group(d, -0.2, 0, 0.82, PI))
  calibrationSyringe(e, d, -0.25, 0.75, -0.2)
  for (let i = 0; i < 2; i++) e.k.box(d, 0.14, 0.06, 0.1, i ? e.m.whitePlastic : e.m.blue, 0.55, 0.78 + i * 0.06, 0.1)
  const sc = room.at(room.x0 + 0.32, room.z0 + 1.55, PI / 2)
  scale(e, sc, 'floor')
  stadiometer(e, room.onWall('-x', room.z0 + 1.55))
  hygiene(e, room, '+x', room.z0 + 0.5, ['yellow', 'black'])
  poster(e, room.onWall('-x', room.z1 - 0.6), 'Spirometry: How to Prepare', '#2e9b4f')
}

/* ---------- X-ray control ---------- */

const xrayControl: Fitter = (e, room) => {
  const { k, o } = e
  // The console bench under the lead-glass window into the X-ray room.
  const b = room.onWall('-z', room.x0 + 1.45, 0, 0.7)
  bench(e, b, 2.8, { d: 0.7, knee: [-1.4, 1.4] })
  const gen = top(b, 0.55, -0.12)
  generatorConsole(e, gen)
  room.info(gen, {
    title: 'X-ray Generator Console', kind: 'Diagnostic imaging · Radiography',
    body: 'Sets the exposure for each view and fires it: the radiographer chooses the examination, the console proposes kV and mAs (with automatic exposure control), and the two-stage hand switch prepares the tube and then exposes. The intercom speaks to the patient through the lead wall.',
    specs: ['High-frequency generator, 50 kW', '40–150 kV, 1–630 mAs, exposure 1 ms–6.3 s', 'Automatic exposure control, 3 fields', 'Two-stage hand switch; door interlock and warning lamp'],
  })
  const acq = computer(e, b, -0.9, 0.9, -0.32, 0, o.his('xrAcq', 'ACQUISITION · CHEST PA', 'image'))
  computer(e, b, -0.3, 0.9, -0.32, 0.05, o.his('xrWorklist', 'MODALITY WORKLIST', 'table'))
  room.info(acq, {
    title: 'Acquisition Workstation', kind: 'Digital radiography',
    body: 'Receives each image from the flat-panel detector within seconds, processes it, lets the radiographer check positioning and annotate it, and sends it to the PACS for reporting.',
    specs: ['Image preview < 3 s', 'DICOM worklist from RIS, PACS export', 'Dose (DAP) recorded per exposure'],
  })
  taskChair(e, group(b, -0.3, 0, 0.55, PI))
  // The image review workstation along the riser wall.
  const r = room.onWall('+z', room.x0 + 1.5, 0, 0.7)
  bench(e, r, 2.2, { d: 0.7, knee: [-1.1, 1.1] })
  computer(e, r, -0.35, 0.9, -0.32, 0, o.his('xrReview1', 'REVIEW · PACS', 'image'))
  computer(e, r, 0.25, 0.9, -0.32, 0, o.his('xrReview2', 'REVIEW · PRIOR', 'image'))
  printer(e, r, 0.85, 0.9, -0.35)
  taskChair(e, group(r, 0, 0, 0.55, PI))
  apronRack(e, room.onWall('+x', room.z0 + 0.8))
  // The dosimeter badge board: a grid of personal badges on hooks.
  const db = room.onWall('+z', room.x1 - 0.55, 1.55)
  k.box(db, 0.42, 0.32, 0.015, e.m.whitePlastic, 0, 0, 0.008)
  for (let i = 0; i < 8; i++) k.box(db, 0.05, 0.07, 0.01, i % 3 ? e.m.blue : e.m.charcoal, -0.15 + (i % 4) * 0.1, (i < 4 ? 0.07 : -0.07), 0.02)
  signPanel(e, db, 0.4, 0.06, o.sign('tld', 400, 60, board(NAVY, [['TLD BADGES', 0.6, '#ffffff']])), 0, 0.2, 0.0, 0, 0.008)
  clock(e, room.onWall('+x', room.z0 + 2.2))
}

/* ---------- the X-ray room ---------- */

const xray: Fitter = (e, room) => {
  const { o } = e
  const tx = room.cx + 0.4
  const table = room.at(tx, room.cz + 0.25)
  xrayTable(e, table)
  const stand = room.onWall('-z', tx)
  chestStand(e, stand)
  const rails = room.at(tx, room.cz + 0.6)
  const yoke = ceilingTube(e, rails, room.d - 0.8, 1.6, room.ceiling, -0.25, 0, 1.6)
  room.info(yoke, {
    title: 'Ceiling-suspended X-ray Tube', kind: 'Digital radiography · DR system',
    body: 'The X-ray tube and collimator hang from a telescopic column on a carriage that runs on ceiling rails, so the radiographer can bring the beam over the table, turn it to the chest stand or angle it for any view; the light-beam collimator shows the exact field on the patient.',
    specs: ['Rotating anode tube, 0.6/1.2 mm focal spots, 300 kHU', 'Longitudinal travel 3.5 m, column stroke 1.5 m, ±180° rotation', 'Multi-leaf collimator with LED field light and DAP meter', 'Auto-tracking to table and wall stand detectors'],
  })
  room.info(table, {
    title: 'Radiographic Table', kind: 'Digital radiography · Patient table',
    body: 'A floating-top, height-adjustable table: the carbon-fibre top moves freely in four directions under foot-pedal brakes, and the wireless flat-panel detector rides in the bucky tray beneath it.',
    specs: ['Top 2.2 × 0.8 m, 0.5 mm Al equivalent', 'Height 0.55–0.86 m, patient load 300 kg', 'Flat-panel detector 43 × 43 cm, 139 µm pixels', 'Grid 12:1, 180 cm focus'],
  })
  room.info(stand, { title: 'Upright Chest Stand', kind: 'Digital radiography · Wall bucky', body: 'Holds the second flat-panel detector upright for chest, spine and erect abdominal views; the carriage travels to the patient\'s height and the hand grips steady them.', specs: ['Detector travel 0.3–1.8 m', 'Removable grid, 180 cm SID', 'Patient hand grips'] })
  apronRack(e, room.onWall('+x', room.z0 + 1.0))
  // The façade's windows are closed inside by a lead-lined dry lining (2 mm Pb bonded to the
  // plasterboard) on its studs, full height to the ceiling, its skirting and the warning on it.
  const lt = 0.09
  e.k.box(room.group, lt, room.ceiling, room.d, e.m.paint, room.x0 + lt / 2, room.y + room.ceiling / 2, room.cz)
  e.k.box(room.group, 0.012, 0.1, room.d, e.m.skirting, room.x0 + lt + 0.006, room.y + 0.05, room.cz, false)
  signPanel(e, room.onWall('-x', room.cz + 0.6, 0, lt), 0.42, 0.14, o.sign('leadlinedWall', 420, 140, board('#f7d117', [['LEAD-LINED WALL · 2 mm Pb', 0.36, '#111111']])), 0, 1.7, 0, 0, 0.006)
  // The changing corner: a curtain on an L of track off the lined wall, a chair inside.
  const cx0 = room.x0 + lt
  curtain(e, group(room.group, cx0 + 1.05, room.y, room.z0, -PI / 2), 1.05, room.ceiling, 1)
  curtain(e, group(room.group, cx0, room.y, room.z0 + 1.05), 1.0, room.ceiling, 0.9)
  patientChair(e, room.at(cx0 + 0.42, room.z0 + 0.42, PI / 4))
  const sg = room.onWall('+x', room.z0 + 2.95)
  signPanel(e, sg, 0.32, 0.4, o.sign('radiation', 320, 400, radiation(['CAUTION', 'X-RAY RADIATION', 'Pregnant women: inform staff'])), 0, 1.6, 0, 0, 0.006)
  signPanel(e, sg, 0.42, 0.14, o.sign('leadlined', 420, 140, board('#f7d117', [['LEAD-LINED ROOM · 2 mm Pb', 0.36, '#111111']])), 0, 1.25, 0, 0, 0.006)
  dispensers(e, room.onWall('+x', room.z0 + 2.25), 1.2)
}

/* ---------- biochemistry ---------- */

const biochemistry: Fitter = (e, room) => {
  const { o } = e
  const b = room.onWall('+x', room.cz - 0.05, 0, 0.75)
  bench(e, b, room.d - 0.2, { sink: 1.35, knee: [-1.95, -1.25], drawers: 0.45 })
  const ro = group(b, -1.6, 0, -0.1)
  roUnit(e, ro)
  room.info(ro, { title: 'Water Purification Unit', kind: 'Laboratory utility · RO water', body: 'Reverse osmosis and deionisation under the bench, feeding the chemistry analyser the Type II reagent-grade water its washes and dilutions need.', specs: ['Output 20 l/h, ≤ 1 µS/cm', 'Pre-filter, RO membrane, DI cartridge, UV', 'Conductivity monitored continuously'] })
  const ise = top(b, -1.5)
  electrolyteAnalyser(e, ise)
  room.info(ise, { title: 'Electrolyte Analyser', kind: 'Biochemistry · Ion-selective electrodes', body: 'Measures sodium, potassium and chloride in serum, plasma, whole blood and urine with ion-selective electrodes, in under a minute a sample.', specs: ['Na⁺, K⁺, Cl⁻ (optional Ca²⁺, Li⁺)', '60 samples/hour, 100 µl sample', 'Reagent pack with built-in calibration'] })
  const sa = top(b, -0.75)
  semiAuto(e, sa)
  room.info(sa, { title: 'Semi-automatic Chemistry Analyser', kind: 'Biochemistry · Photometer', body: 'A flow-cell photometer for low-volume and special tests, and the back-up when the main analyser is down for maintenance.', specs: ['340–700 nm, 8 filters', 'End-point, kinetic and fixed-time methods', '32 µl flow cell, Peltier 37 °C'] })
  computer(e, b, 0.3, 0.9, -0.35, 0, o.his('bioLis', 'LIS · BIOCHEMISTRY', 'table'))
  benchStool(e, b, -1.6, 0.4)
  const chem = room.at(room.x0 + 1.15, room.z0 + 0.85)
  chemAnalyser(e, chem)
  room.info(chem, {
    title: 'Clinical Chemistry Analyser', kind: 'Biochemistry · Fully automated',
    body: 'The laboratory\'s workhorse: a floor-standing photometric analyser that runs liver and kidney function, lipids, glucose, enzymes and proteins on serum and plasma from the barcoded tubes, with on-board refrigerated reagents and an integrated ion-selective module.',
    specs: ['800 photometric tests/hour (1,200 with ISE)', 'Reagent carousel 60 positions at 4–12 °C', 'Sample tray 80 tubes, STAT position', 'Water 20 l/h from the RO plant; LIS bidirectional'],
  })
  const fr = room.onWall('-x', room.z0 + 1.45, 0, 0.62)
  medFridge(e, fr, 'Reagent Refrigerator', 1.75, 0.6)
  room.info(fr, { title: 'Reagent Refrigerator', kind: 'Cold chain', body: 'Stores reagent cassettes, calibrators and controls at 2–8 °C.', specs: ['2–8 °C, alarmed and data-logged'] })
  hygiene(e, room, '-x', room.z0 + 2.25, ['yellow', 'red'])
}

/* ---------- haematology ---------- */

const haematology: Fitter = (e, room) => {
  const { o } = e
  const b = room.onWall('+x', room.cz, 0, 0.75)
  bench(e, b, room.d - 0.1, { sink: 1.65, drawers: -0.3 })
  const big = top(b, -1.45, -0.02)
  haemAnalyser(e, big, true)
  room.info(big, {
    title: '5-part Haematology Analyser', kind: 'Haematology · Automated cell counter',
    body: 'Counts and classifies the blood cells in an EDTA sample: the complete blood count with a five-part white-cell differential by flow cytometry and impedance, haemoglobin, platelets and reticulocytes, fed by the rack autoloader beside it.',
    specs: ['Up to 100 samples/hour, 20 µl aspiration', '29 parameters + 5-part differential, reticulocytes', 'Closed-tube sampling, autoloader 50 tubes', 'Flags abnormal cells for slide review'],
  })
  const small = top(b, -0.3)
  haemAnalyser(e, small)
  room.info(small, { title: '3-part Haematology Analyser', kind: 'Haematology · Back-up counter', body: 'A compact impedance counter for urgent samples and as the back-up to the main analyser.', specs: ['60 samples/hour', '21 parameters, 3-part differential', 'Open-tube sampling, 9 µl'] })
  const coag = top(b, 0.35)
  coagAnalyser(e, coag)
  room.info(coag, { title: 'Coagulation Analyser', kind: 'Haematology · Haemostasis', body: 'Measures clotting times on citrated plasma by optical and mechanical clot detection: PT/INR for patients on warfarin, APTT, fibrinogen and D-dimer.', specs: ['PT/INR, APTT, fibrinogen, TT, D-dimer', '120 tests/hour, 4 measuring channels', 'Reagent wells at 15 °C'] })
  tubeRoller(e, top(b, 0.95, -0.22))
  const s = room.onWall('-z', room.x0 + 1.3, 0, 0.75)
  bench(e, s, 2.55, { knee: [-1.27, -0.55] })
  const mic = microscope(e, s, -0.9, 0.9, -0.3)
  room.info(mic, { title: 'Binocular Microscope', kind: 'Haematology · Peripheral smear', body: 'For reviewing stained blood smears that the analyser flags: cell morphology, parasites, a manual differential.', specs: ['Objectives 10×, 40×, 100× oil', 'LED Köhler illumination', 'Mechanical stage'] })
  benchStool(e, s, -0.9, 0.35)
  const st = top(s, -0.15)
  slideStainer(e, st)
  room.info(st, { title: 'Automated Slide Stainer', kind: 'Haematology · Staining', body: 'Stains blood smears with Leishman/May-Grünwald-Giemsa reproducibly, batch after batch.', specs: ['Up to 60 slides/batch', 'Programmable dip times', 'Sealed reagent baths'] })
  esrStand(e, top(s, 0.4, -0.2))
  computer(e, s, 0.95, 0.9, -0.35, 0, o.his('haemLis', 'LIS · HAEMATOLOGY', 'table'))
  medFridge(e, room.onWall('+z', room.x1 - 1.4, 0, 0.62), 'Haematology Refrigerator', 1.75, 0.6)
  hygiene(e, room, '-x', room.z0 + 1.7, ['yellow', 'red'])
}

/* ---------- sample receiving ---------- */

const sampleReceiving: Fitter = (e, room) => {
  const { o } = e
  // The receiving counter facing the door, staff behind it at the windows.
  const c = room.at(room.x0 + 1.15, room.z0 + 1.0, -PI / 2)
  bench(e, c, 1.8, { d: 0.65, knee: [-0.9, 0.9] })
  const lis = computer(e, c, -0.4, 0.9, -0.3, PI, o.his('rcvLis', 'ACCESSIONING · BARCODE', 'form'))
  computer(e, c, 0.35, 0.9, -0.3, PI, o.his('rcvTat', 'TAT MONITOR', 'table'))
  labelPrinter(e, c, 0.05, 0.9, -0.12, PI)
  barcodeScanner(e, c, 0.22, 0.9, -0.14, PI + 0.3)
  for (let i = 0; i < 2; i++) tubeRack(e, c, -0.55 + i * 1.0, 0.9, -0.15, 8, 2, 0, 60 + i)
  room.info(lis, {
    title: 'Sample Accessioning Workstation', kind: 'Laboratory information system',
    body: 'Every sample arriving by the tube or by hand is scanned here: its barcode links it to the patient and the tests ordered, it is checked for the right tube, volume and labelling, and the LIS routes it to its section and starts the turnaround clock.',
    specs: ['2D barcode scanning, rejection reasons logged', 'Bidirectional LIS ↔ HIS interface', 'Turnaround time monitored per sample'],
  })
  taskChair(e, group(c, -0.4, 0, -0.65, PI))
  taskChair(e, group(c, 0.4, 0, -0.65, PI))
  // Sorting racks along the window.
  const s = room.onWall('+x', room.cz - 0.2, 0, 0.75)
  bench(e, s, 3.3, { drawers: 1.2 })
  for (let i = 0; i < 5; i++) tubeRack(e, s, -1.4 + i * 0.36, 0.9, -0.35, 10, 3, 0, 70 + i)
  for (let i = 0; i < 3; i++) signPanel(e, s, 0.3, 0.06, o.sign(`sortlbl${i}`, 300, 60, board(['#8e6bbf', '#e2b21c', '#7fc4e8'][i], [[['HAEMATOLOGY', 'BIOCHEMISTRY', 'COAGULATION'][i], 0.6, '#111111']])), -1.2 + i * 0.7, 1.0, 0.002, 0, 0.004)
  const fr = room.onWall('-z', room.x0 + 0.5, 0, 0.62)
  medFridge(e, fr, 'Sample Refrigerator', 0.85, 0.6)
  const pts = room.onWall('+z', room.x1 - 1.0)
  pneumaticStation(e, pts)
  room.info(pts, { title: 'Pneumatic Tube Receiving Station', kind: 'Sample transport', body: 'Receives carriers from the collection room, the emergency department and the wards; each carrier is opened here and its samples accessioned.', specs: ['Soft-landing receiver', 'Carrier tracking by station number'] })
  hygiene(e, room, '-z', room.x0 + 1.4, ['yellow', 'red'])
}

/* ---------- reagent store ---------- */

const reagentStore: Fitter = (e, room) => {
  const { o, k, m } = e
  rack(e, room.onWall('-x', room.z0 + 0.65, 0, 0.5), 1.2, 2.0, 0.5, 5, 'reagents')
  rack(e, room.onWall('-x', room.z0 + 1.95, 0, 0.5), 1.2, 2.0, 0.5, 5, 'reagents')
  const fr = room.onWall('+x', room.z1 - 1.0, 0, 0.62)
  medFridge(e, fr, 'Pharmaceutical Refrigerator', 1.85, 0.6)
  room.info(fr, { title: 'Pharmaceutical Refrigerator', kind: 'Cold chain', body: 'Keeps kits, antisera and calibrators at 2–8 °C behind a glass door, with a temperature display and alarm, logged every five minutes.', specs: ['2–8 °C, forced air', 'Glass door, lockable', 'Alarm on door open and excursion'] })
  const fz = room.onWall('+x', room.z1 - 2.6, 0, 0.65)
  deepFreezer(e, fz)
  room.info(fz, { title: 'Deep Freezer (−20 °C)', kind: 'Cold chain', body: 'A chest freezer for frozen controls, aliquoted serum for repeat and referral testing, and reagents that are stored frozen.', specs: ['−10 to −25 °C', '300 l, lockable lid', 'Temperature alarm, data logger'] })
  const bal = room.onWall('-z', room.x0 + 1.45, 0, 0.6)
  balanceTable(e, bal)
  room.info(bal, { title: 'Analytical Balance', kind: 'Reagent preparation', body: 'Weighs powders for buffers and stains to a tenth of a milligram, on a granite anti-vibration table with the draught shield closed.', specs: ['Capacity 220 g, readability 0.1 mg', 'Internal calibration', 'Granite slab on isolated frame'] })
  const sinkBench = room.onWall('+x', room.z0 + 0.55, 0, 0.7)
  bench(e, sinkBench, 1.1, { d: 0.7, sink: 0.05 })
  const still = room.onWall('+x', room.z0 + 0.45)
  waterStill(e, still, 1.35)
  room.info(still, { title: 'Water Distillation Unit', kind: 'Reagent preparation', body: 'Supplies distilled water for diluting reagents and making stains, into the reservoir beneath it.', specs: ['4 l/h, single distillation', 'Stainless boiler, auto cut-off'] })
  // The MSDS file and its holder by the door.
  const ms = room.onWall('+z', room.x0 + 0.45)
  k.box(ms, 0.3, 0.38, 0.08, m.sharps, 0, 1.45, 0.04)
  k.box(ms, 0.26, 0.32, 0.04, m.paper, 0, 1.47, 0.07)
  signPanel(e, ms, 0.3, 0.08, o.sign('msds', 300, 80, board('#111111', [['MSDS', 0.6, '#f7d117']])), 0, 1.72, 0.0, 0, 0.006)
  poster(e, room.onWall('-z', room.x0 + 0.4), 'Chemical Spill Procedure', '#e2b21c', 0.36, 0.5, 1.65)
  for (let i = 0; i < 3; i++) bottle(e, bal, -0.25 + i * 0.07, 0.78, -0.45, 0.2, 0.04, m.clearPlastic, m.blue)
}

/* ---------- processing and centrifuges ---------- */

const centrifugeRoom: Fitter = (e, room) => {
  const b = room.onWall('-x', room.cz, 0, 0.75)
  bench(e, b, room.d - 0.2, { drawers: 2.0, knee: [0.35, 1.25] })
  const c1 = top(b, -1.9)
  centrifuge(e, c1)
  room.info(c1, { title: 'Benchtop Centrifuge', kind: 'Sample processing', body: 'Spins clotted and anticoagulated tubes to separate serum or plasma before they go to the analysers.', specs: ['Swing-out rotor, 4 × 24 tubes', 'Up to 4,000 rpm (2,800 g)', 'Lid lock and imbalance detection'] })
  centrifuge(e, top(b, -1.3), 0.85)
  vortex(e, b, -0.75, 0.9, -0.25)
  vortex(e, b, -0.55, 0.9, -0.25)
  for (let i = 0; i < 3; i++) tubeRack(e, b, 0.4 + i * 0.3, 0.9, -0.35, 6, 3, 0, 80 + i)
  benchStool(e, b, 0.8, 0.35)
  for (let i = 0; i < 4; i++) bottle(e, b, 1.6 + (i % 2) * 0.08, 0.9, -0.5 - Math.floor(i / 2) * 0.08, 0.16, 0.025, e.m.clearPlastic, e.m.whitePlastic)
  const a = room.onWall('-z', room.x1 - 1.0, 0, 0.7)
  bench(e, a, 1.9, { d: 0.7, knee: [-0.95, 0.4] })
  for (let i = 0; i < 2; i++) tubeRack(e, a, -0.6 + i * 0.35, 0.9, -0.3, 8, 2, 0, 90 + i)
  vortex(e, a, 0.6, 0.9, -0.3)
  benchStool(e, a, -0.3, 0.35)
  const fc = room.onWall('+x', room.z1 - 1.85, 0, 0.8)
  floorCentrifuge(e, fc)
  room.info(fc, { title: 'Refrigerated Floor Centrifuge', kind: 'Sample processing', body: 'For large batches and temperature-sensitive samples (ammonia, coagulation, hormones), spun cold so the analytes keep.', specs: ['Up to 4,700 rpm, 4,100 g', '−10 to +40 °C, pre-cooling', 'Swing-out rotor 4 × 48 tubes', 'Imbalance and lid interlocks'] })
  hygiene(e, room, '+x', room.z0 + 1.2, ['yellow', 'red', 'white'])
}

/* ---------- clinical pathology ---------- */

const clinicalPath: Fitter = (e, room) => {
  const { o } = e
  const b = room.onWall('+x', room.cz, 0, 0.75)
  bench(e, b, room.d - 0.2, { drawers: 1.9 })
  const ua = top(b, -1.6)
  urineAnalyser(e, ua)
  room.info(ua, { title: 'Urine Chemistry Analyser', kind: 'Clinical pathology · Urinalysis', body: 'Reads multi-parameter urine strips by reflectance photometry, consistently and without the colour judgement of the eye; results go straight to the LIS.', specs: ['11 parameters: glucose, protein, blood, ketones, pH, SG, leucocytes, nitrite…', '500 strips/hour', 'Built-in printer, LIS interface'] })
  for (let i = 0; i < 2; i++) urineRack(e, b, -0.75 + i * 0.6, 0.9, -0.3, 8)
  computer(e, b, 0.8, 0.9, -0.35, 0, o.his('cpLis', 'LIS · URINE / STOOL', 'table'))
  // The sink bench with its drainboard under the window.
  const s = room.onWall('-z', room.x0 + 1.05, 0, 0.7)
  bench(e, s, 2.0, { d: 0.7, sink: -0.45 })
  e.k.box(s, 0.6, 0.012, 0.5, e.m.stainless, 0.4, 0.906, -0.35, false)
  for (let i = 0; i < 8; i++) e.k.box(s, 0.56, 0.006, 0.008, e.m.stainless, 0.4, 0.914, -0.55 + i * 0.055, false)
  // The microscopy bench on the inner wall.
  const m2 = room.onWall('-x', room.z0 + 1.85, 0, 0.75)
  bench(e, m2, 1.8, { knee: [-0.9, 0.2] })
  const mic = microscope(e, m2, -0.35, 0.9, -0.3)
  room.info(mic, { title: 'Microscope · Urine & Stool Microscopy', kind: 'Clinical pathology', body: 'For the urine sediment (cells, casts, crystals) and stool for ova, cysts and occult blood.', specs: ['Objectives 10×, 40×', 'Phase-contrast condenser'] })
  benchStool(e, m2, -0.35, 0.35)
  // The stool sample hatch: a stainless pass box in the corridor wall.
  passBox(e, room.onWall('+z', room.x0 + 0.42), 1.0)
  hygiene(e, room, '-x', room.z1 - 0.6, ['yellow', 'red'])
}

/* ---------- microbiology ---------- */

const microbiology: Fitter = (e, room) => {
  const bsc = room.onWall('-x', room.z0 + 1.45, 0, 0.8)
  biosafetyCabinet(e, bsc)
  room.info(bsc, {
    title: 'Class II Biosafety Cabinet', kind: 'Microbiology · Containment',
    body: 'Cultures and specimens are opened and handled only here: a curtain of HEPA-filtered air flows in at the front and down over the work, protecting the worker, the sample and the room. The electric loop sterilizer replaces the Bunsen flame inside.',
    specs: ['Class II type A2, 1.2 m work zone', 'Inflow ≥ 0.5 m/s, downflow 0.3 m/s', 'HEPA filters 99.995% at 0.3 µm', 'Airflow alarm; UV off while in use'],
  })
  labStool(e, room.at(room.x0 + 1.2, room.z0 + 1.45, -PI / 2))
  medFridge(e, room.onWall('-x', room.z1 - 1.85, 0, 0.62), 'Media Refrigerator', 1.75, 0.6)
  const inc = room.onWall('+x', room.z0 + 0.45, 0, 0.65)
  incubator(e, inc, 0.95, 'Incubator Door')
  room.info(inc, { title: 'Bacteriological Incubator', kind: 'Microbiology · Culture', body: 'Holds culture plates at body temperature for 18–48 hours so organisms grow and can be identified.', specs: ['37 °C ± 0.5 °C, natural convection', '150 l, glass inner door', 'Over-temperature protection'] })
  const co2 = room.onWall('+x', room.z0 + 1.15, 0, 0.65)
  incubator(e, co2, 0.95, 'CO₂ Incubator Door')
  room.info(co2, { title: 'CO₂ Incubator', kind: 'Microbiology · Culture', body: 'For organisms that need 5–10% carbon dioxide to grow (streptococci, Neisseria, Haemophilus).', specs: ['CO₂ 0–20%, IR sensor', '37 °C, humidified', 'Inner glass door'] })
  const ac = room.onWall('+x', room.z0 + 2.1, 0, 0.7)
  autoclave(e, ac)
  room.info(ac, { title: 'Autoclave', kind: 'Microbiology · Sterilisation', body: 'Sterilises media and decontaminates used cultures before they leave the laboratory as biomedical waste.', specs: ['121 °C at 15 psi, 15–30 min', 'Vertical, 100 l chamber', 'Bowie-Dick and biological indicator tested'] })
  const bc = room.onWall('+x', room.z1 - 0.85, 0, 0.6)
  bloodCulture(e, bc)
  room.info(bc, { title: 'Automated Blood Culture System', kind: 'Microbiology · Sepsis', body: 'Incubates blood culture bottles and watches each one continuously, raising the alarm the moment bacteria grow so the doctor hears of a positive culture within hours.', specs: ['240 bottle positions', 'Colorimetric CO₂ detection every 10 minutes', 'Aerobic, anaerobic, paediatric bottles'] })
  const b = room.onWall('-z', room.cx + 0.05, 0, 0.7)
  bench(e, b, 1.4, { d: 0.7, knee: [-0.7, 0.1] })
  microscope(e, b, -0.3, 0.9, -0.3)
  const cc = top(b, 0.42, -0.1)
  colonyCounter(e, cc)
  room.info(cc, { title: 'Colony Counter', kind: 'Microbiology', body: 'Counts the colonies on a culture plate under a magnifier over a lit stage.', specs: ['LED back-lit stage', '1.7× magnifier, digital tally'] })
  hygiene(e, room, '+z', room.x0 + 0.35, ['yellow', 'red', 'blue'])
}

/* ---------- serology ---------- */

const serology: Fitter = (e, room) => {
  const { o } = e
  const b = room.onWall('-x', room.z0 + 1.55, 0, 0.75)
  bench(e, b, 3.0, { drawers: -1.2 })
  const clia = top(b, 0.65, -0.03)
  cliaAnalyser(e, clia)
  room.info(clia, {
    title: 'Chemiluminescence Immunoassay Analyser', kind: 'Serology & immunology',
    body: 'Measures hormones, tumour markers, cardiac markers and infectious-disease antigens and antibodies by chemiluminescence: thyroid profile, troponin, HBsAg, HIV and HCV screening, vitamin D, ferritin.',
    specs: ['Up to 180 tests/hour', '25 reagent positions, refrigerated', 'Results in 18–30 minutes', 'Barcoded sample racks, LIS interface'],
  })
  computer(e, b, -0.55, 0.9, -0.35, 0, o.his('seroLis', 'LIS · SEROLOGY', 'table'))
  taskChair(e, group(b, -0.55, 0, 0.55, PI))
  const w = room.onWall('+x', room.z0 + 1.35, 0, 0.75)
  bench(e, w, 2.6, { knee: [-0.45, 0.45] })
  const rd = top(w, -0.85)
  elisaReader(e, rd)
  room.info(rd, { title: 'ELISA Microplate Reader', kind: 'Serology · Enzyme immunoassay', body: 'Reads the colour developed in each well of a 96-well plate, for ELISA tests such as dengue NS1 and IgM, typhoid and hepatitis serology.', specs: ['96-well plates, 8-channel optics', 'Filters 405, 450, 492, 630 nm', 'Reads a plate in 6 s'] })
  const wa = top(w, 0.85)
  elisaWasher(e, wa)
  room.info(wa, { title: 'Microplate Washer', kind: 'Serology · Enzyme immunoassay', body: 'Washes the plates between the steps of an ELISA with an even, gentle stream, so results are reproducible.', specs: ['8- and 12-way manifold', 'Residual volume < 2 µl/well', 'Wash and waste bottles with level sensing'] })
  shaker(e, top(w, 0.1))
  benchStool(e, w, 0.0, 0.35)
  medFridge(e, room.onWall('+x', room.z1 - 0.95, 0, 0.62), 'Kit Refrigerator', 0.85, 0.6)
  hygiene(e, room, '+z', room.x0 + 0.35, ['yellow', 'red'])
}

export const SECOND: Record<string, Fitter> = {
  health_check: healthCheck,
  blood_collection: bloodCollection,
  ultrasound: ultrasoundRoom,
  pft,
  xray_control: xrayControl,
  xray,
  biochemistry,
  haematology,
  sample_receiving: sampleReceiving,
  reagent_store: reagentStore,
  centrifuge: centrifugeRoom,
  clinical_path: clinicalPath,
  microbiology,
  serology,
}
