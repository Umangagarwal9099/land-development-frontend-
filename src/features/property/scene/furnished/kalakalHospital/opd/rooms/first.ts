import { Group, type Object3D } from 'three'
import { PI } from '../../../kit'
import { counter } from '../../erFurniture'
import { ecgCart, examLight, ultrasound } from '../../erEquipment'
import { workstation } from '../../emergency'
import { group, signPanel } from '../../erKit'
import type { OpdCtx, Room } from '../ctx'
import {
  aedCabinet, cauteryTrolley, coatStand, coffeeTable, compactor, cryoCanister, dermatoscope, electrodes, entChair, entUnit, fileTrolley, foetalDoppler,
  glucometer, goniometer, gyneTable, headlight, infantometer, infantScale, kettle, magnifierLamp, nebuliser, neuroTray, paedCouch, plasterTrolley,
  kidsTable, scanner, sofa, speculumTray, splintRack, sutureTray, tokenCaller, toyCrate,
} from '../equipment/clinical'
import {
  baseRun, basin, bins, bpMonitor, clock, coatOnHook, computer, cupboard, curtain, deskPhone, desk, diagnosticWall, doctorChair, dressingTrolley,
  examCouch, fileCabinet, gloveBox, injectionTrolley, lockers, oximeter, papers, patientChair, poster, printer, rack, scale, sharps, stadiometer,
  stethoscope, stool, thermometer, viewer, wallCupboard, wallScreen, medFridge, workbench, type BinColour,
} from '../furniture'
import { board, NAVY, tokenScreen } from '../paints'
import type { Fitter } from './types'

/*
 * The first floor: the outpatient consultation rooms, each laid out as the specialty works (the
 * doctor's desk facing the door, the patient and an attendant beside it, the couch behind its
 * curtain, the basin and the waste by the door), and the floor's clinical support rooms.
 */

type Info = { title: string; kind: string; body: string; specs?: string[] }
const note = (room: Room, o: Object3D | null | undefined, info: Info) => o && room.info(o, info)

/* ---------- the parts every consultation room has ---------- */

interface DeskOpts {
  w?: number
  /** A second chair for the attendant who comes with the patient. */
  attendant?: boolean
  /** Things for the desktop, in the desk's frame (front +z towards the patient, the doctor at −z). */
  top?: (D: Group) => void
  /** The digital BP monitor on the desk (else the aneroid on the wall). */
  bp?: boolean
}

/**
 * The doctor's desk at (x, z), its front turned `ry` (to the patient): the doctor's chair behind,
 * the patient's chair (and an attendant's) in front, the EMR workstation, phone, papers,
 * stethoscope, thermometer and oximeter.
 */
function doctorDesk(e: OpdCtx, room: Room, x: number, z: number, ry: number, o: DeskOpts = {}) {
  const w = o.w ?? 1.3
  const D = room.at(x, z, ry)
  desk(e, D, w, 0.72, 1)
  doctorChair(e, D, 0.1, -0.68, (room.spec.id.length % 3) * 0.12 - 0.12)
  patientChair(e, group(D, o.attendant === false ? 0 : -0.3, 0, 0.8, PI + 0.12))
  if (o.attendant !== false) patientChair(e, group(D, 0.36, 0, 0.84, PI - 0.1))
  const pc = computer(e, D, -w / 2 + 0.36, 0.75, 0.0, PI + 0.35, e.o.his(`emr_${room.spec.id}`, `Kallakal HIS · OPD ${room.spec.no ?? ''} · ${room.name}`, 'form'))
  deskPhone(e, D, w / 2 - 0.16, 0.75, -0.18, PI + 0.2)
  papers(e, D, 0.0, 0.752, -0.05, PI)
  stethoscope(e, D, 0.36, 0.752, 0.16, 0.4)
  thermometer(e, D, w / 2 - 0.12, 0.752, 0.12, 0.3)
  oximeter(e, D, w / 2 - 0.22, 0.752, 0.2)
  if (o.bp) bpMonitor(e, D, -w / 2 + 0.2, 0.752, 0.2, PI + 0.4)
  o.top?.(D)
  note(room, pc, {
    title: 'Consultation Workstation', kind: 'IT · Electronic medical record',
    body: `The doctor's computer on the hospital information system: the patient's registration, previous visits, lab and imaging results, and the e-prescription printed at the pharmacy. The token for the next patient is called from here to the display in the waiting lounge.`,
    specs: ['24″ display, keyboard and mouse', 'HIS / EMR with e-prescription', 'IP desk phone on the hospital exchange'],
  })
  return D
}

/**
 * An examination couch at (x, z) along its local x (head at −x), its +z side towards the room,
 * and its privacy curtain on a ceiling track `off` metres out on that side, from `from` to `to`
 * along it, `drawn` closed.
 */
function couchBay(e: OpdCtx, room: Room, x: number, z: number, ry: number, opts: { off?: number; from?: number; to?: number; drawn?: number; couch?: (C: Group) => void } = {}) {
  const C = room.at(x, z, ry)
  if (opts.couch) opts.couch(C)
  else examCouch(e, C)
  const from = opts.from ?? -1.3
  const to = opts.to ?? 1.2
  curtain(e, group(C, from, 0, opts.off ?? 0.95), to - from, room.ceiling, opts.drawn ?? 0.35)
  return C
}

const couchInfo: Info = {
  title: 'Examination Couch', kind: 'Clinical furniture',
  body: 'A two-section examination couch with an adjustable backrest, vinyl upholstery wiped down between patients and fresh couch roll for each, a step for climbing on, and a privacy curtain on its ceiling track.',
  specs: ['1.9 × 0.62 m, 0.68 m high', 'Backrest 0–40°, couch roll holder', 'Curtain on a ceiling-fixed aluminium track'],
}

/** The hygiene corner: a hand-wash basin on wall `side` at `along`, BMW bins and sharps beside. */
function hygiene(e: OpdCtx, room: Room, side: Parameters<Room['onWall']>[0], along: number, binsAt: [Parameters<Room['onWall']>[0], number], colours: BinColour[] = ['yellow', 'red', 'black'], sharpsAt?: [Parameters<Room['onWall']>[0], number]) {
  basin(e, room.onWall(side, along))
  bins(e, room.onWall(binsAt[0], binsAt[1], 0, 0.2), colours)
  if (sharpsAt) sharps(e, room.onWall(sharpsAt[0], sharpsAt[1]), 1.25)
}

/** A medicine cupboard with drawers, on wall `side` at `along`. */
function medCupboard(e: OpdCtx, room: Room, side: Parameters<Room['onWall']>[0], along: number, w = 0.6, h = 1.9) {
  const g = room.onWall(side, along, 0, 0.45)
  cupboard(e, g, w, h, 0.45, { glass: true, fill: 'medicines', drawers: 2, label: 'Medicine Cupboard' })
  note(room, g, { title: 'Medicine & Supplies Cupboard', kind: 'Clinical storage', body: 'Glass-fronted shelves of clinic medicines, sample packs and consumables over two drawers of dressings and syringes; locked at the end of the clinic.', specs: ['Glazed doors and drawers that open', 'White laminate carcass, adjustable shelves'] })
  return g
}

/* ---------- the south-façade rooms, 101–103 ---------- */

/**
 * A consultation room on the south façade: 3.2 × 4.2 m, the window on −x, the door on +x near the
 * room's +z end. The desk stands out from the window, the doctor facing the door; the couch runs
 * along the −z wall behind its curtain; the basin, waste, cupboard and coat hook along the +x wall
 * and the +z wall.
 */
function southRoom(e: OpdCtx, room: Room, extra: (r: Room) => void, top?: (D: Group) => void, wallArt?: (g: Group) => void) {
  const { x0, x1, z0, z1 } = room
  doctorDesk(e, room, x0 + 1.02, z1 - 0.86, PI / 2, { top, bp: room.spec.fit === 'consult_medicine' })
  const C = couchBay(e, room, x0 + 1.22, z0 + 0.42, 0, { off: 0.95, from: -1.1, to: 1.4, drawn: 0.4 })
  note(room, C, couchInfo)
  diagnosticWall(e, room.onWall('-z', x0 + 1.75))
  hygiene(e, room, '+x', z0 + 0.55, ['-z', x1 - 0.75], ['yellow', 'red', 'black'], ['+x', z0 + 1.18])
  medCupboard(e, room, '+x', z0 + 1.66)
  clock(e, room.onWall('+x', z0 + 1.66), 2.35)
  viewer(e, room.onWall('+z', x0 + 1.3), 2, 1.6)
  coatOnHook(e, room.onWall('+z', x1 - 1.35))
  if (wallArt) wallArt(room.onWall('+z', x0 + 2.45))
  extra(room)
}

const consultMedicine: Fitter = (e, room) =>
  southRoom(e, room, (r) => {
    const s = r.at(r.x0 + 2.75, r.z0 + 1.0, -0.2)
    scale(e, s, 'floor')
    note(r, s, { title: 'Digital Weighing Scale', kind: 'Anthropometry', body: 'A flat platform scale for weight at every visit, from which the BMI is worked out in the record.', specs: ['Capacity 180 kg, 100 g steps'] })
  }, (D) => {
    note(room, glucometer(e, D, 0.5, 0.752, 0.05, 0.2), { title: 'Glucometer', kind: 'Point-of-care test', body: 'A capillary blood glucose meter: a finger-prick on a test strip gives the sugar level in five seconds, for diabetic patients reviewed at the clinic.', specs: ['Range 10–600 mg/dL', 'Single-use lancets and strips'] })
  }, (g) => poster(e, g, 'Diabetes · Know your numbers', '#1f9d55'))

const consultCardiology: Fitter = (e, room) =>
  southRoom(e, room, (r) => {
    const ecg = r.at(r.x0 + 2.55, r.z0 + 0.85, -PI / 2 + 0.3)
    ecgCart(e, ecg, e.o.screen('ecg12', 256, 192, ecgPaint))
    note(r, ecg, { title: '12-Lead ECG Machine', kind: 'Cardiology · Diagnostic', body: 'A 12-channel resting electrocardiograph on its trolley, beside the couch: ten electrodes on the chest and limbs record the heart\'s electrical activity, interpreted on the spot and printed for the file.', specs: ['12 channels, automatic interpretation', 'Thermal print, 80 mm / A4', 'Battery and mains, HIS connected'] })
    note(r, electrodes(e, r.group, r.x0 + 1.75, r.y + 0.73, r.z0 + 0.42), { title: 'ECG Electrodes', kind: 'Consumable', body: 'Disposable pre-gelled electrodes and the lead clips, laid ready on the couch for the next tracing.' })
    aedCabinet(e, r.onWall('+z', r.x0 + 2.5))
  }, undefined, (g) => poster(e, g, 'Lipid profile · BP targets', '#c8161d', 0.36, 0.5, 1.5 + 0.0))

const consultNeurology: Fitter = (e, room) =>
  southRoom(e, room, (r) => {
    const g = r.onWall('-z', r.x0 + 0.5)
    poster(e, g, 'The brain · Functional areas', '#6d4e9e', 0.4, 0.55, 1.65)
  }, (D) => {
    note(room, neuroTray(e, D, 0.42, 0.752, 0.02, 0.1), { title: 'Neurological Examination Tray', kind: 'Neurology · Instruments', body: 'The neurologist\'s kit for the bedside examination: a Taylor reflex hammer for the tendon reflexes, 128 Hz and 512 Hz tuning forks for vibration sense and hearing, a pin wheel and cotton wisps for sensation, and a pen torch for the pupils.', specs: ['Taylor hammer, tuning forks 128 / 512 Hz', 'Neuro pin wheel, cotton wool, pen torch'] })
  }, (g) => {
    g.add(snellenFace(e))
    note(room, g, { title: 'Snellen Visual Acuity Chart', kind: 'Neurology · Vision', body: 'The standard letter chart for visual acuity, read at a measured distance, part of the cranial nerve examination; the ophthalmoscope for the fundus is on the wall set by the couch.', specs: ['6/60 to 6/5 lines', 'Read at 3 m with the mirror, or 6 m'] })
  })

/* ---------- the back band, 104–107 ---------- */

/** The doctor's desk near the window of a back-band room, facing the door across the room. */
function backDesk(e: OpdCtx, room: Room, x: number, o: DeskOpts = {}) {
  return doctorDesk(e, room, x, room.z0 + 1.1, 0, o)
}

const consultOrthopaedics: Fitter = (e, room) => {
  const { x0, z0, z1, cz } = room
  backDesk(e, room, -1.3, { w: 1.4, top: (D) => note(room, goniometer(e, D, 0.45, 0.752, 0.05, 0.4), { title: 'Goniometer', kind: 'Orthopaedics · Instrument', body: 'A two-arm clear goniometer for measuring a joint\'s range of movement, in degrees, at each visit after an injury or a replacement.', specs: ['0–360° scale, 30 cm arms'] }) })
  const C = couchBay(e, room, x0 + 0.42, cz + 0.4, PI / 2, { from: -1.4, to: 1.25, drawn: 0.45 })
  note(room, C, couchInfo)
  diagnosticWall(e, room.onWall('-x', cz + 0.4))
  const v = room.onWall('+x', z0 + 3.0)
  viewer(e, v, 3, 1.55)
  note(room, v, { title: 'X-ray Film Viewer · 3 Panel', kind: 'Orthopaedics · Imaging', body: 'A three-panel LED viewing box for radiographs brought in by patients; the hospital\'s own films are read on the PACS screen at the desk.', specs: ['Uniform LED backlight', 'Film clips on each panel'] })
  const pt = room.at(x0 + 1.9, z1 - 0.95, 0.1)
  plasterTrolley(e, pt)
  note(room, pt, { title: 'Plaster (POP) Trolley', kind: 'Orthopaedics · Casting', body: 'Plaster of Paris bandages and cotton padding rolls on the top tier, the plaster bucket of water below, plaster shears and the knife: for back-slabs and casts applied in the clinic.', specs: ['Stainless two-tier, on castors', 'POP 10 / 15 cm, Velband padding'] })
  const sr = room.onWall('+z', x0 + 0.9)
  splintRack(e, sr, 1.15)
  note(room, sr, { title: 'Splint Rack', kind: 'Orthopaedics · Immobilisation', body: 'Ready splints for fractures and sprains: aluminium finger splints, Cramer wire and padded splints, a Thomas splint for the thigh, and soft and hard cervical collars.' })
  hygiene(e, room, '+z', -1.62, ['+x', z0 + 0.38], ['yellow', 'red', 'black'], ['+x', z0 + 2.05])
  medCupboard(e, room, '+x', z0 + 1.35, 0.9)
  coatOnHook(e, room.onWall('+z', x0 + 2.05))
  clock(e, room.onWall('+z', x0 + 2.05), 2.45)
}

const consultDermatology: Fitter = (e, room) => {
  const { x0, x1, z0, cz } = room
  backDesk(e, room, 2.05, {
    w: 1.2, attendant: false,
    top: (D) => note(room, dermatoscope(e, D, 0.42, 0.752, 0.08), { title: 'Dermatoscope', kind: 'Dermatology · Diagnostic', body: 'A handheld polarised dermatoscope: ten-fold magnification with its own light, to look into a mole or a rash below the skin\'s surface without a cut.', specs: ['10× lens, polarised / non-polarised LED', 'Rechargeable, on its charging stand'] }),
  })
  const C = couchBay(e, room, x0 + 0.42, cz + 0.55, PI / 2, { from: -1.15, to: 1.0, drawn: 0.45 })
  note(room, C, { ...couchInfo, title: 'Dermatology Procedure Couch', body: 'The couch for skin examination and minor procedures (biopsies, cautery, cryotherapy), with a paper roll and the magnifying lamp beside it.' })
  diagnosticWall(e, room.onWall('-x', cz + 0.55))
  const ml = room.at(x0 + 1.15, z0 + 3.55, -PI / 2 - 0.2)
  magnifierLamp(e, ml)
  note(room, ml, { title: 'Magnifying Examination Lamp', kind: 'Dermatology · Lighting', body: 'A 5-dioptre lens in a ring of cool LEDs on a balanced arm, for close examination of skin lesions and fine procedures.', specs: ['5 D lens, 120 mm', 'Shadow-free LED ring, 5000 K'] })
  const ct = room.at(x1 - 0.32, cz + 0.2, -PI / 2)
  cauteryTrolley(e, ct)
  note(room, ct, { title: 'Radiofrequency Cautery Unit', kind: 'Dermatology · Procedure', body: 'A radiofrequency electrosurgical generator on its trolley, for removing warts, skin tags and small lesions with little bleeding; its pencil and footswitch with it.', specs: ['Cut and coagulation modes', 'Monopolar / bipolar, footswitch'] })
  const cr = room.at(x1 - 0.32, z0 + 0.38)
  cryoCanister(e, cr)
  note(room, cr, { title: 'Liquid Nitrogen Cryo Unit', kind: 'Dermatology · Cryotherapy', body: 'A liquid nitrogen dewar with its spray gun, for freezing warts and keratoses: a few seconds of spray at −196 °C.', specs: ['Dewar on a castor base', 'Spray gun with interchangeable tips'] })
  hygiene(e, room, '+z', 0.95, ['+z', 1.6], ['yellow', 'red'], ['+z', 1.55])
  medCupboard(e, room, '+x', z0 + 1.45)
  coatOnHook(e, room.onWall('-x', z0 + 4.5))
}

const consultGynaecology: Fitter = (e, room) => {
  const { x1, z0, z1, cz } = room
  backDesk(e, room, 4.55, { w: 1.3, top: (D) => note(room, foetalDoppler(e, D, 0.42, 0.752, 0.02, 0.3), { title: 'Foetal Doppler', kind: 'Obstetrics · Monitoring', body: 'A handheld ultrasound Doppler to hear the baby\'s heartbeat from about twelve weeks, the rate shown on its display.', specs: ['2 MHz probe', 'FHR 50–240 bpm display'] }) })
  // The examination area at the far side behind its curtain: the table's head to the wall.
  const G = room.at(x1 - 1.05, cz + 0.45, PI)
  gyneTable(e, G)
  note(room, G, { title: 'Gynaecological Examination Table', kind: 'Obstetrics & Gynaecology', body: 'An examination table with the seat cut-out and its drainage pan, the backrest raised, and padded leg supports on their posts, for per-speculum and per-vaginal examinations in privacy behind the curtain.', specs: ['Backrest 0–70°, leg supports adjustable', 'Stainless drainage pan, paper roll'] })
  curtain(e, room.at(x1 - 2.55, z1 - 0.25, PI / 2), 3.4, room.ceiling, 0.85)
  const lt = room.at(x1 - 2.25, cz + 1.05, PI / 2 + 0.5)
  examLight(e, lt, 0.55)
  note(room, lt, { title: 'Examination Light', kind: 'Clinical lighting', body: 'A mobile LED examination light on a gooseneck, directed at the examination field.', specs: ['LED, 40,000 lux at 0.5 m', 'Five-castor base'] })
  stool(e, room.at(x1 - 2.1, cz + 0.4))
  const us = room.at(x1 - 0.55, cz + 1.45, -PI / 2 - 0.3)
  ultrasound(e, us)
  note(room, us, { title: 'Portable Ultrasound', kind: 'Obstetrics · Imaging', body: 'A trolley ultrasound with abdominal and transvaginal probes, for early pregnancy scans and pelvic assessment at the clinic.', specs: ['Convex and endocavity probes', 'Colour Doppler'] })
  const tr = room.at(x1 - 1.95, cz - 0.75, PI / 2)
  injectionTrolley(e, tr)
  note(room, speculumTray(e, tr, 0, 0.94, -0.22), { title: 'Speculum Tray', kind: 'Gynaecology · Instruments', body: 'Sterile Cusco\'s specula in three sizes, sponge-holding forceps, swabs and a gallipot, for the speculum examination and the Pap smear.' })
  hygiene(e, room, '+z', 5.75, ['+z', 6.6], ['yellow', 'red', 'black'], ['-x', cz + 0.9])
  medCupboard(e, room, '-x', cz - 0.1, 0.8)
  coatOnHook(e, room.onWall('-x', z0 + 3.6))
  poster(e, room.onWall('-x', cz + 1.65), 'Antenatal care schedule', '#c2185b', 0.36, 0.5, 1.6)
}

const consultPaediatrics: Fitter = (e, room) => {
  const { x0, x1, z0, cz } = room
  backDesk(e, room, 11.0, { w: 1.4 })
  const C = couchBay(e, room, x1 - 0.42, cz + 0.3, -PI / 2, { couch: (g) => paedCouch(e, g), from: -1.0, to: 1.2, drawn: 0.4 })
  note(room, C, { title: 'Paediatric Examination Couch', kind: 'Paediatrics', body: 'A shorter couch with a soft pastel mattress and side guard rails, so a small child can be examined lying down with a parent beside.', specs: ['1.5 × 0.6 m', 'Raised head section, guard rails'] })
  const br = room.onWall('-x', cz - 0.35, 0, 0.62)
  baseRun(e, br, 1.8, { fill: 'supplies' })
  note(room, infantScale(e, br, -0.4, 0.91, -0.3), { title: 'Infant Weighing Scale', kind: 'Paediatrics · Anthropometry', body: 'A digital baby scale with a curved tray, weighing to five grams, for growth monitoring of infants.', specs: ['Capacity 20 kg, 5 g steps', 'Tare and hold functions'] })
  note(room, infantometer(e, br, 0.45, 0.91, -0.28, 0.0), { title: 'Infantometer', kind: 'Paediatrics · Anthropometry', body: 'A measuring board with a fixed headpiece and a sliding footpiece, for the length of a baby lying down.', specs: ['0–100 cm, 1 mm scale'] })
  note(room, nebuliser(e, br, 0.0, 0.91, -0.15, 0.4), { title: 'Compressor Nebuliser', kind: 'Paediatrics · Respiratory', body: 'A compressor nebuliser with a child\'s mask, to give an inhaled bronchodilator to a wheezing child in the clinic.' })
  growthChart(e, room.onWall('-x', z0 + 3.45))
  stadiometer(e, room.onWall('-x', z0 + 3.45, 0, 0))
  const toys = room.at(x0 + 0.4, z0 + 0.35, 0.2)
  toyCrate(e, toys)
  kidsTable(e, room.at(x0 + 1.25, z0 + 2.4, 0))
  hygiene(e, room, '+z', 10.3, ['+z', 11.2], ['yellow', 'red', 'black'], ['+z', 11.9])
  medCupboard(e, room, '+z', 12.6, 0.9)
  coatOnHook(e, room.onWall('+x', z0 + 0.6))
  clock(e, room.onWall('+z', 10.3), 2.4)
}

/* ---------- 108 ENT, 109 General Surgery ---------- */

const consultEnt: Fitter = (e, room) => {
  const { z1 } = room
  doctorDesk(e, room, 11.62, -1.35, PI / 2, { w: 1.3, bp: true })
  const u = room.onWall('-x', 2.4, 0, 0.55)
  entUnit(e, u)
  note(room, u, { title: 'ENT Treatment Unit', kind: 'ENT · Workstation', body: 'The ENT workstation: instrument trays of aural and nasal specula, tongue depressors and forceps, the suction for the ear and nose, the cold light source for the endoscopes, local anaesthetic sprays, and the monitor that shows the endoscopy to the doctor and the patient.', specs: ['Suction with collection jar', 'LED cold light source, 0° / 30° scopes', 'Endoscopy monitor on an arm'] })
  headlight(e, u, 0.15, 0.9, -0.2)
  const ch = room.at(12.25, 2.15, -PI / 2)
  entChair(e, ch)
  note(room, ch, { title: 'ENT Examination Chair', kind: 'ENT · Patient chair', body: 'A motorised examination chair: it rises, turns and reclines so the ear, nose and throat can be brought to the doctor\'s light at the right height.', specs: ['Electric height 50–80 cm, 360° swivel', 'Headrest, armrests and footrest'] })
  stool(e, room.at(11.3, 2.0))
  const C = couchBay(e, room, 12.55, z1 - 0.38, PI, { off: 0.7, from: -1.2, to: 1.2, drawn: 0.2 })
  note(room, C, couchInfo)
  hygiene(e, room, '-z', 12.6, ['+x', 0.5], ['yellow', 'red', 'black'], ['-x', 1.05])
  medCupboard(e, room, '-x', 0.15, 0.8)
  coatOnHook(e, room.onWall('-z', 13.2))
  poster(e, room.onWall('-x', -2.6), 'Ear care · Hearing loss', '#0e5aa7', 0.36, 0.5, 1.6)
}

const consultSurgery: Fitter = (e, room) => {
  const { x0, z0 } = room
  doctorDesk(e, room, 12.62, -15.0, -PI / 2, { w: 1.2, attendant: false, bp: true })
  const C = couchBay(e, room, 11.7, z0 + 0.36, 0, { from: -1.3, to: 1.2, drawn: 0.45 })
  note(room, C, { ...couchInfo, title: 'Minor Procedure Couch', body: 'The couch for examining and dressing surgical patients and for minor procedures under local anaesthesia (suturing, incision and drainage, removing stitches).' })
  const lt = room.at(12.95, -16.85, PI + 0.6)
  examLight(e, lt, 0.6)
  note(room, lt, { title: 'Procedure Light', kind: 'Clinical lighting', body: 'A mobile LED light swung over the couch for wound examination and minor procedures.' })
  const dt = room.at(13.12, -16.0, PI / 2)
  dressingTrolley(e, dt, 0.7, 0.45)
  note(room, dt, { title: 'Dressing Trolley', kind: 'Surgery · Dressings', body: 'A stainless dressing trolley: sterile instruments on the top tray, gauze, cotton, bandages and antiseptics, and the waste bag on its ring.' })
  const it = room.at(x0 + 0.5, -16.35, PI / 2)
  injectionTrolley(e, it)
  note(room, sutureTray(e, it, 0, 0.94, -0.22), { title: 'Suture Tray', kind: 'Surgery · Instruments', body: 'A sterile suture set on its green drape: needle holder, toothed forceps, scissors and the sutures, laid out for a minor procedure.' })
  hygiene(e, room, '-x', -17.45, ['+x', -17.75], ['yellow', 'red'], ['-x', -16.7])
  medCupboard(e, room, '+z', 11.75, 0.6)
  coatOnHook(e, room.onWall('+z', 12.65))
}

/* ---------- 110 Dressing & Examination ---------- */

const dressingExam: Fitter = (e, room) => {
  const { x0, x1 } = room
  for (const [zc, n] of [[-12.85, 1], [-8.45, 2]] as const) {
    const C = couchBay(e, room, x1 - 0.42, zc, -PI / 2, { from: -1.15, to: 1.1, drawn: 0.5 })
    note(room, C, { ...couchInfo, title: `Dressing Couch ${n}`, body: 'A dressing and examination couch in its own curtained bay, for wound dressings, suture removal, injections and examinations that need a patient lying down.' })
    const t = room.at(x1 - 1.1, zc + 1.25, PI / 2)
    dressingTrolley(e, t, 0.7, 0.45)
    note(room, t, { title: 'Dressing Trolley', kind: 'Dressings', body: 'Sterile dressing packs and instruments on the top tray, crêpe bandages, cotton rolls, gauze swabs, povidone-iodine and chlorhexidine, micropore tape and gloves; the waste bag on its ring.', specs: ['Stainless two-tier, on castors'] })
  }
  curtain(e, room.at(x1 - 1.38, -10.65, 0), 1.38, room.ceiling, 1)
  const lt = room.at(x1 - 1.6, -10.65, PI / 2)
  examLight(e, lt, 0.55)
  note(room, lt, { title: 'Examination Light', kind: 'Clinical lighting', body: 'A mobile LED examination light shared between the two bays.' })
  hygiene(e, room, '-x', -9.3, ['-x', -8.3], ['yellow', 'red', 'blue', 'black'], ['-x', -9.95])
  for (const zc of [-13.55, -12.7]) cupboard(e, room.onWall('-x', zc, 0, 0.45), 0.8, 2.0, 0.45, { glass: true, fill: 'supplies', drawers: 1, label: 'Supply Cupboard' })
  const br = room.onWall('+z', x0 + 0.95, 0, 0.62)
  baseRun(e, br, 1.6, { fill: 'supplies' })
  wallCupboard(e, room.onWall('+z', x0 + 0.95, 0, 0.35), 1.6, 0.75, 0.35, 1.5, { glass: true, fill: 'supplies', label: 'Dressing Cupboard' })
  note(room, br, { title: 'Dressing Preparation Counter', kind: 'Clinical storage', body: 'Drawers of sterile dressing packs, syringes and needles under a solid-surface worktop where dressings are opened and prepared; glazed cupboards of supplies over it.' })
  poster(e, room.onWall('-x', -7.0), 'Wound care · Aseptic technique', '#1f9d55', 0.42, 0.6, 1.55)
  clock(e, room.onWall('-x', -7.0), 2.45)
}

/* ---------- 111 Vitals, 112 Records, 114 Doctors, 116 Nurses ---------- */

const vitals: Fitter = (e, room) => {
  const { x0, x1, z0, z1, cz } = room
  const bays = [-3.6, -1.6, 0.4].filter((b) => b < x1 - 0.9)
  bays.forEach((bx, i) => {
    const t = room.onWall('-z', bx + 0.3, 0, 0.45)
    workbench(e, t, 0.7, 0.45, 0.85)
    bpMonitor(e, t, -0.15, 0.85, -0.22, 0.1)
    thermometer(e, t, 0.12, 0.85, -0.28, 0.4)
    oximeter(e, t, 0.22, 0.85, -0.15)
    gloveBox(e, t, 0.15, 0.85, -0.08, 0.1)
    patientChair(e, room.at(bx - 0.45, z0 + 0.75, PI / 2))
    stool(e, room.at(bx + 0.6, z0 + 0.95))
    note(room, t, { title: `Vitals Bay ${i + 1}`, kind: 'Pre-consultation check', body: 'Before seeing the doctor every patient has the vital signs taken here and entered in the record: blood pressure on the digital monitor, temperature by the infrared thermometer, pulse and SpO₂ by the fingertip oximeter.', specs: ['Automatic BP monitor, adult and large cuffs', 'Infrared forehead thermometer', 'Fingertip pulse oximeter'] })
    if (i < bays.length - 1) curtain(e, room.at(bx + 1.0, z0 + 0.05, -PI / 2), 1.9, room.ceiling, 1)
  })
  doctorDesk(e, room, 0.32, cz + 0.85, -PI / 2, { w: 1.2, attendant: false })
  const sc = room.onWall('-x', cz + 0.6, 0, 0.25)
  scale(e, sc, 'column')
  note(room, sc, { title: 'Column Scale with Height Rod', kind: 'Anthropometry', body: 'A column weighing scale with its sliding height rod, for weight, height and BMI recorded at every first visit.', specs: ['Capacity 200 kg, 100 g steps', 'Height rod 60–210 cm'] })
  stadiometer(e, room.onWall('-x', cz + 1.6))
  for (const zc of [z1 - 1.05, z1 - 1.65]) patientChair(e, room.at(x0 + 0.35, zc, PI / 2))
  hygiene(e, room, '+z', -0.9, ['+z', -4.0], ['yellow', 'red', 'black'], ['+z', -1.7])
  poster(e, room.onWall('-x', cz - 0.5), 'Vital signs · Normal ranges', '#0e5aa7', 0.42, 0.6, 1.55)
  clock(e, room.onWall('+x', cz - 1.2), 2.35)
}

const records: Fitter = (e, room) => {
  const { x0 } = room
  const cg = room.at(x0 + 0.35, -9.55, 0)
  compactor(e, cg, 5, 4.2, 2)
  note(room, cg, { title: 'Mobile Compactor Shelving', kind: 'Medical records · Storage', body: 'Five carriages of steel shelving on floor rails, moved apart by their hand wheels to open an aisle where it is needed: twice the files of fixed racks in the same floor. Outpatient files are kept here by year and by number, and retrieved for each visit.', specs: ['Double-sided carriages, 6 shelves', 'Three-spoke hand wheels, anti-tilt rails'] })
  const D = room.at(6.62, -10.0, PI / 2)
  desk(e, D, 1.3, 0.72, -1)
  doctorChair(e, D, 0.1, -0.68, 0)
  const pc = computer(e, D, -0.25, 0.75, 0.05, PI, e.o.his('records', 'Kallakal HIS · Medical Records · File Tracking', 'table'))
  note(room, scanner(e, D, 0.35, 0.752, 0.1, PI), { title: 'Document Scanner', kind: 'Medical records · Digitisation', body: 'A flatbed scanner for scanning paper records and outside reports into the patient\'s electronic record.' })
  printer(e, D, 0.42, 0.75, -0.2, PI)
  deskPhone(e, D, -0.55, 0.75, -0.15, PI)
  note(room, pc, { title: 'Records Workstation', kind: 'IT · File tracking', body: 'File requests from the consultation rooms arrive here; each file\'s movement is tracked by barcode until it comes back.' })
  const rk = room.onWall('+z', 3.1, 0, 0.45)
  rack(e, rk, 2.0, 2.1, 0.45, 6, 'files')
  fileCabinet(e, room.onWall('+z', 4.65, 0, 0.62), 4)
  const ft = room.at(5.15, -6.85, 0.3)
  fileTrolley(e, ft)
  note(room, ft, { title: 'File Trolley', kind: 'Medical records', body: 'Files for the morning\'s clinics, sorted by room, on their way out to the consultation rooms.' })
  clock(e, room.onWall('+x', -8.0), 2.35)
}

const doctorsRoom: Fitter = (e, room) => {
  const { x0, z0, z1 } = room
  const s = room.at(3.3, z1 - 0.48, PI)
  sofa(e, s, 2.0)
  coffeeTable(e, room.at(3.3, z1 - 1.55, 0))
  for (const x of [2.0, 4.6]) patientChair(e, room.at(x, z1 - 1.55, x < 3 ? PI / 2 : -PI / 2))
  const D = room.at(x0 + 0.42, -16.3, -PI / 2)
  desk(e, D, 1.3, 0.72, 1)
  doctorChair(e, D, 0, -0.66, 0.2)
  computer(e, D, 0, 0.75, 0.05, PI, e.o.his('doctors', 'Kallakal HIS · Clinic schedule', 'table'))
  deskPhone(e, D, 0.45, 0.75, -0.1, PI)
  const lk = room.onWall('+x', -14.3, 0, 0.5)
  lockers(e, lk, 4)
  note(room, lk, { title: 'Doctors\' Lockers', kind: 'Staff facilities', body: 'Personal lockers for the consultants\' bags and coats between clinics.' })
  const br = room.onWall('-z', 3.7, 0, 0.62)
  baseRun(e, br, 1.8, { sink: -0.45, fill: 'none' })
  kettle(e, br, 0.35, 0.91, -0.3)
  wallCupboard(e, room.onWall('-z', 3.7, 0, 0.35), 1.8, 0.7, 0.35, 1.5, { label: 'Pantry Cupboard' })
  coatStand(e, room.at(5.6, z0 + 0.6))
  clock(e, room.onWall('+z', 5.6), 2.35)
  poster(e, room.onWall('+z', 5.6), 'OPD duty roster', NAVY, 0.6, 0.45, 1.55)
}

const nursesStation: Fitter = (e, room) => {
  const { x0, x1, z1 } = room
  const C = room.at(5.55, z1 - 0.9, 0)
  counter(e, C, 4.0, [-1.6, 0.5])
  for (const [i, x] of [-1.2, 0.05, 1.25].entries()) {
    workstation(e, C, x, 0.765, 0.05, PI + (i - 1) * 0.1, e.o.his(`nurses${i}`, 'Kallakal HIS · OPD Queue · First Floor', i === 1 ? 'table' : 'form'))
    doctorChair(e, C, x + 0.1, -0.6, (i - 1) * 0.25)
  }
  deskPhone(e, C, -0.6, 0.765, 0.18, PI)
  note(room, tokenCaller(e, C, 0.65, 0.765, 0.2, PI), { title: 'Token Calling Unit', kind: 'Patient flow', body: 'The nurses call each patient\'s token to a consultation room from here; it shows on the displays in the lounge and is announced.' })
  printer(e, C, 1.75, 0.765, 0.15, PI)
  // The token display hung over the counter, facing the lounge.
  const T = room.at(5.55, z1 + 0.05, 0)
  const scr = e.o.screen('tokens1', 512, 288, tokenScreen('Consultation · First Floor', [['A-117', 'Room 101 · General Medicine'], ['C-042', 'Room 102 · Cardiology'], ['N-019', 'Room 103 · Neurology'], ['O-033', 'Room 104 · Orthopaedics'], ['P-027', 'Room 107 · Paediatrics']], 1101))
  wallScreen(e, T, 1.1, 2.45, scr)
  for (const s of [-1, 1]) e.k.box(T, 0.02, room.ceiling - 2.75, 0.02, e.m.aluminium, s * 0.4, 2.75 + (room.ceiling - 2.75) / 2, 0.035)
  note(room, T, { title: 'Token Display', kind: 'Patient flow', body: 'The queue display for the consultation rooms: each token called and the room to go to, so waiting patients know when it is their turn.' })
  signPanel(e, T, 1.6, 0.26, e.o.sign('nursesSign', 768, 128, board(NAVY, [['NURSES\' STATION', 0.42, '#ffffff']])), 0, 2.95, 0.06, 0, 0.02)
  // The storage wall behind: drawers and cupboards under a worktop, cupboards over it.
  const br = room.onWall('-z', x0 + 1.35, 0, 0.62)
  baseRun(e, br, 2.4, { fill: 'supplies' })
  wallCupboard(e, room.onWall('-z', x0 + 1.35, 0, 0.35), 2.4, 0.75, 0.35, 1.5, { glass: true, fill: 'files', label: 'Records Cupboard' })
  note(room, br, { title: 'Nurses\' Storage', kind: 'Clinical storage', body: 'Drawers of forms, consumables and dressing packs under the worktop; cupboards of patient files and stationery above.' })
  const mt = room.at(x1 - 0.45, 0.5, -PI / 2)
  injectionTrolley(e, mt)
  note(room, mt, { title: 'Medicine Trolley', kind: 'Nursing', body: 'The nurses\' trolley of injections and emergency medicines, sharps box clipped on, taken to whichever room needs it.' })
  const fr = room.onWall('+x', -1.5, 0, 0.62)
  medFridge(e, fr, 'Vaccine & Medicine Refrigerator', 1.6)
  note(room, fr, { title: 'Medicine Refrigerator', kind: 'Cold chain', body: 'A medical refrigerator holding insulin, vaccines and other cold-chain medicines at 2–8 °C, its temperature logged twice a day.', specs: ['+2 to +8 °C, digital display and alarm'] })
  fileTrolley(e, room.at(x0 + 0.5, 0.6, PI / 2))
  clock(e, room.onWall('-x', 1.5), 2.35)
}

/* ---------- printed faces ---------- */

function ecgPaint(g: CanvasRenderingContext2D, w: number, h: number) {
  g.fillStyle = '#071209'
  g.fillRect(0, 0, w, h)
  g.strokeStyle = '#3cff8a'
  g.lineWidth = 2
  for (let r = 0; r < 3; r++) {
    g.beginPath()
    for (let i = 0; i <= w; i += 2) {
      const t = (i % 64) / 64
      const y = h * (0.22 + r * 0.28) - (t > 0.45 && t < 0.5 ? h * 0.12 : t > 0.5 && t < 0.53 ? -h * 0.04 : t > 0.7 && t < 0.8 ? h * 0.025 : 0)
      if (i) g.lineTo(i, y)
      else g.moveTo(i, y)
    }
    g.stroke()
  }
}

/** The Snellen chart's face on a wall group, as a framed board. */
function snellenFace(e: OpdCtx) {
  const g = new Group()
  e.k.box(g, 0.44, 0.74, 0.012, e.m.aluminium, 0, 1.6, 0.006)
  e.k.box(g, 0.42, 0.72, 0.002, e.o.sign('snellen', 280, 480, (c, w, h) => snellen(c, w, h)), 0, 1.6, 0.013, false)
  return g
}

function snellen(g: CanvasRenderingContext2D, w: number, h: number) {
  g.fillStyle = '#fbfbf8'
  g.fillRect(0, 0, w, h)
  const rows = ['E', 'F P', 'T O Z', 'L P E D', 'P E C F D', 'E D F C Z P', 'F E L O P Z D', 'D E F P O T E C']
  g.fillStyle = '#111'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  let y = h * 0.09
  rows.forEach((r, i) => {
    const px = h * 0.12 * Math.pow(0.74, i)
    g.font = `700 ${Math.round(px)}px Helvetica, Arial, sans-serif`
    g.fillText(r, w / 2, y)
    y += px * 1.15 + h * 0.025
  })
}

/** The growth chart on a wall, beside the height rod. */
function growthChart(e: OpdCtx, p: Group) {
  e.k.box(p, 0.52, 0.72, 0.01, e.m.aluminium, 0.5, 1.55, 0.005)
  e.k.box(p, 0.5, 0.7, 0.002, e.o.sign('growthChart', 300, 420, (c, w, h) => {
    c.fillStyle = '#fbfaf6'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#1f6fd1'
    c.fillRect(0, 0, w, h * 0.1)
    c.fillStyle = '#fff'
    c.font = `700 ${Math.round(h * 0.04)}px Helvetica, Arial`
    c.textAlign = 'center'
    c.fillText('GROWTH CHART 0–5 YRS (WHO)', w / 2, h * 0.065)
    c.lineWidth = 2
    ;['#c8161d', '#f08a00', '#1f9d55', '#f08a00', '#c8161d'].forEach((col, k) => {
      c.strokeStyle = col
      c.beginPath()
      for (let i = 0; i <= 30; i++) {
        const t = i / 30
        const x = w * (0.08 + t * 0.86)
        const y = h * (0.88 - 0.1 - k * 0.09 - Math.sqrt(t) * 0.4)
        if (i) c.lineTo(x, y)
        else c.moveTo(x, y)
      }
      c.stroke()
    })
  }), 0.5, 1.55, 0.011, false)
}

export const FIRST: Record<string, Fitter> = {
  consult_medicine: consultMedicine,
  consult_cardiology: consultCardiology,
  consult_neurology: consultNeurology,
  consult_orthopaedics: consultOrthopaedics,
  consult_dermatology: consultDermatology,
  consult_gynaecology: consultGynaecology,
  consult_paediatrics: consultPaediatrics,
  consult_ent: consultEnt,
  consult_surgery: consultSurgery,
  dressing_exam: dressingExam,
  vitals,
  records,
  doctors_room: doctorsRoom,
  nurses_station: nursesStation,
}
