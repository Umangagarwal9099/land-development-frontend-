import { Vector3, type Object3D } from 'three'
import { PI } from '../../../kit'
import { castor, face, group, signPanel } from '../../erKit'
import { crashCart, taskChair } from '../../erFurniture'
import { computerOnWheels, gasAlarm, patientMonitor, zoneValves } from '../../erEquipment'
import { beamSeating, linenTrolley, workstation } from '../../emergency'
import type { OpdCtx, Room } from '../../opd/ctx'
import { handRub, kitchenette, leafletRack, planter, waterStation } from '../../opd/equipment/common'
import { coffeeTable } from '../../opd/equipment/clinical'
import { pedalBin, handWashPoint } from '../../opd/equipment/sanitary'
import { curtain, desk, rack, wallCupboard } from '../../opd/furniture'
import { board, NAVY } from '../../opd/paints'
import { bins, computer, deskPhone, medFridge, papers, poster, printer, sharps, wallScreen } from '../../opd/smalls'
import type { Fitter } from '../../opd/rooms/types'
import { bedHead, callButton, callLamp, callLink, drawerCart, kitMats, rubBottle, splitAC, wallClock, wallTV, wardBed, wardrobe, type CallLink } from '../kit'
import { centralPaint, icuMonitorPaint, ventScreenPaint } from '../equipment/secondPaints'
import { icuPendant, icuVentilator, infusionPump, infusionTower, ppeStation, pressureMonitor, suctionUnit, syringePump, wallMonitor, type PumpKind } from '../equipment/secondIcu'
import {
  artwork, bedsideCabinet, clubChair, conciergeDesk, credenza, diningChair, FLAGS, flagStand, floorLamp, intlMats, pedestalTable, recliner,
  refreshmentCounter, sofaBed, tableLamp, tissueBox, tvArm, worldClock,
} from '../equipment/secondIntl'

/*
 * The main block's second floor: the intensive care unit round the back and north side of the
 * light court, and the international patient wing behind the curtain wall.
 *
 *   ICU      two ventilator rooms across the back and a cubicle and the isolation room (with its
 *            anteroom) down the north side, each bed under twin ceiling supply pendants with a
 *            critical-care ventilator (the ventilator rooms and isolation), its monitor, infusion
 *            stand and suction; the central nursing station in the back corner sees down both
 *            corridors, with the central monitor, the doctors' workstation, the crash cart and
 *            the emergency drug refrigerator; the equipment store; hand hygiene at every door.
 *   outside  the relatives' waiting by the lifts and the family counselling room beside it.
 *   wing     the concierge lounge, two international suites on the glass and the presidential
 *            suite with its family room: premium beds with full medical gases at walnut bed
 *            heads, wall monitors, recliners and attendants' sofa-beds, minibars, TVs, air-
 *            conditioning, nurse call to lamps over the doors and an annunciator at the desk.
 */

/* ---------- helpers ---------- */

/** A point in a room's plan (x, height above the floor, z) in `g`'s own frame. */
function inFrame(room: Room, g: Object3D, x: number, y: number, z: number) {
  room.group.updateMatrixWorld(true)
  return g.worldToLocal(room.group.localToWorld(new Vector3(x, room.y + y, z)))
}

/** `o`'s position in `g`'s frame. */
function toFrame(room: Room, o: Object3D, g: Object3D) {
  room.group.updateMatrixWorld(true)
  return g.worldToLocal(o.getWorldPosition(new Vector3()))
}

/** The floor's call circuits, by room: each lights its lamps over the door and at the desk. */
const LINKS = new WeakMap<OpdCtx, Map<string, CallLink>>()
function link(e: OpdCtx, id: string) {
  let m = LINKS.get(e)
  if (!m) LINKS.set(e, (m = new Map()))
  let l = m.get(id)
  if (!l) m.set(id, (l = callLink()))
  return l
}

/** The ICU's beds, by room: their labels, screens' seeds, ventilated or not. */
const ICU: Record<string, { label: string; seed: number; vent: boolean }> = {
  vent1: { label: 'ICU-1', seed: 7101, vent: true },
  vent2: { label: 'ICU-2', seed: 7102, vent: true },
  isolation: { label: 'ICU-3', seed: 7103, vent: true },
  icu4: { label: 'ICU-4', seed: 7104, vent: false },
}

/** A sign panel with type on a ground, `w` × `h` at (x, y) on a wall group. */
function plainSign(e: OpdCtx, p: Object3D, key: string, w: number, h: number, y: number, bg: string, lines: [string, number, string, number?][], border?: string) {
  const mat = e.o.sign(key, Math.round(w * 640), Math.round(h * 640), board(bg, lines, border ? { border } : {}))
  return signPanel(e, p, w, h, mat, 0, y, 0.008, 0, 0.012)
}

/** A call lamp over a door, on the corridor face of the wall: at plan (x, z), facing `ry`. */
function lampOverDoor(e: OpdCtx, room: Room, l: CallLink, x: number, z: number, ry: number, y = 2.38) {
  callLamp(e, room.at(x, z, ry), l, 0, y, 0)
}

/* ---------- the ICU bed space ---------- */

const ICU_PUMPS: PumpKind[][] = [
  [
    { kind: 'vol', drug: 'NaCl 0.9%', rate: '80.0 ml/h', sub: 'VTBI 420 ml' },
    { kind: 'vol', drug: 'Ringer Lactate', rate: '60.0 ml/h', sub: 'VTBI 380 ml' },
    { kind: 'syr', drug: 'Noradrenaline', rate: '6.0 ml/h', sub: '0.08 µg/kg/min' },
    { kind: 'syr', drug: 'Propofol 1%', rate: '12.0 ml/h', sub: '1.8 mg/kg/h', milky: true },
    { kind: 'syr', drug: 'Fentanyl', rate: '3.5 ml/h', sub: '35 µg/h' },
  ],
  [
    { kind: 'vol', drug: 'Dextrose 5%', rate: '40.0 ml/h', sub: 'VTBI 610 ml' },
    { kind: 'syr', drug: 'Insulin', rate: '2.0 ml/h', sub: '2.0 U/h' },
    { kind: 'syr', drug: 'Heparin', rate: '1.0 ml/h', sub: '1000 U/h' },
  ],
]

/**
 * An ICU bed space, the bed's head towards −z at `headZ`, centred on `x`: the ICU bed (backrest
 * up 30°, alternating-pressure mattress) and twin supply pendants at its head corners, the
 * monitor on the left one turned to the foot, suction and the O₂ flowmeter on the right one;
 * the ventilator beside the bed head on the right, its hoses up to the right pendant's outlets;
 * the infusion stand on `towerSide`; nurse-call and staff-emergency buttons on the pendants.
 */
function bedSpace(e: OpdCtx, room: Room, x: number, headZ: number, towerSide: 1 | -1) {
  const bed = ICU[room.spec.id]
  const l = link(e, room.spec.id)
  const bz = headZ + 1.07
  const b = room.at(x, bz, 0)
  wardBed(e, b, { style: 'icu', back: 0.52, linen: 'made', height: 0.66 })
  room.info(b, {
    title: 'ICU Bed', kind: 'Critical care bed · Alternating-pressure mattress',
    body: 'A four-section electric critical-care bed: its backrest held at 30° (the ventilated patient\'s head-up position against aspiration), an alternating-pressure air mattress against pressure injury, an integrated X-ray cassette tunnel under the backrest, CPR quick-release at both sides, split side rails with the patient\'s and the nurse\'s controls, central braking.',
    specs: ['Platform height 0.40–0.80 m, Trendelenburg ±12°', 'Safe working load 250 kg', 'Alternating-pressure mattress, 20 cells, pump on the footboard', 'CPR release, X-ray tunnel, 125 mm twin castors'],
  })
  const ceiling = room.ceiling
  const mon = e.o.screen(`icuMon_${bed.label}`, 640, 408, icuMonitorPaint(bed.label, bed.seed, bed.vent))
  // Twin pendants at the head corners, their fronts towards the foot.
  const pl = room.at(x - 1.0, headZ + 0.1, 0)
  icuPendant(e, pl, { ceiling, mount: [-0.25, -0.5], monitor: mon, monitorSide: 1, monitorYaw: 0.15, suction: false })
  callButton(e, pl, l, 0.08, 1.15, 0.124, 'Staff Emergency Call')
  room.info(pl, {
    title: 'Ceiling Supply Pendant · Monitoring', kind: 'Medical supply unit · Two-link arm',
    body: 'A ceiling pendant on a two-link arm carries the bed head\'s services so the floor round the bed stays clear for staff and equipment: medical gas terminal units, UPS-backed and raw power, data, and shelves; on its arm the multiparameter monitor, turned to the foot of the bed.',
    specs: ['Gases: O₂ ×2, medical air, vacuum ×2 (ISO 9170 terminal units)', '8 sockets (4 on UPS), 2 data, equipotential stud', 'Shelves rated 60 kg each, drawer under', 'Arm reach 1.2 m, 340° rotation per joint, brakes'],
  })
  const pr = room.at(x + 1.0, headZ + 0.1, 0)
  const outs = icuPendant(e, pr, { ceiling, mount: [0.25, -0.5], monitorSide: 1, suction: true })
  callButton(e, pr, l, 0.08, 1.15, 0.124, 'Nurse Call')
  // The monitor's information.
  room.info(pl.children[pl.children.length - 1], {
    title: 'Multiparameter Patient Monitor', kind: 'Critical care monitoring',
    body: `The bedside monitor of ${bed.label}: ECG (5-lead, ST and arrhythmia analysis), invasive arterial pressure, SpO₂ with its plethysmograph, capnography, temperature and non-invasive blood pressure, networked to the central station so every alarm is seen at the desk.`,
    specs: ['19″ touch display, 8 waveforms', 'ECG, IBP ×2, SpO₂, etCO₂, NIBP, 2× temperature', 'Arrhythmia and ST analysis, 72 h trends', 'Networked to the central station, HL7 to the EMR'],
  })
  // The ventilator beside the head on the right, the patient to its left.
  if (bed.vent) {
    const v = room.at(x + 1.12, headZ + 1.05, 0)
    // Each hose leaves its outlet straight out past the pendant's shelves before it drops.
    const ends = (o: Object3D): [Vector3, Vector3] => {
      room.group.updateMatrixWorld(true)
      const ahead = pr.localToWorld(o.position.clone().add(new Vector3(0, 0, 0.42)))
      return [toFrame(room, o, v), v.worldToLocal(ahead)]
    }
    icuVentilator(e, v, { screen: e.o.screen(`vent_${bed.label}`, 640, 410, ventScreenPaint(bed.label, bed.seed + 9)), side: -1, o2: ends(outs.o2), air: ends(outs.air) })
    room.info(v, {
      title: 'Critical Care Ventilator', kind: 'Invasive and non-invasive ventilation',
      body: 'An ICU ventilator for adult and paediatric patients, here in volume-controlled assist-control: a turbine-independent breathing unit driven from the pipeline O₂ and medical air, a swivelling 15.6″ touch display with the rotary knob, a heated humidifier on the dual-limb circuit, a proximal flow sensor at the Y-piece. Between patients it is kept in standby on a test lung, checked and ready.',
      specs: ['Modes: VC/PC-AC, SIMV, PSV/CPAP, APRV, NIV, high-flow O₂', 'VT 20–2000 mL, PEEP 0–50 cmH₂O, FiO₂ 21–100 %', 'Waveforms, loops, lung mechanics, 72 h trends', 'Heated humidifier 37 °C, battery 2 h'],
    })
  } else {
    // A cubicle without a ventilator keeps a non-rebreather mask set on the right pendant.
    suctionUnit(e, room.at(x + 1.15, headZ + 1.35, -PI / 2))
  }
  // The infusion stand beside the bed's upper body, its pumps turned to the bed.
  const tx = x + towerSide * 1.28
  const tz = headZ + (bed.vent || towerSide < 0 ? 1.15 : 1.9)
  const tw = room.at(tx, tz, -towerSide * PI / 2)
  const target = inFrame(room, tw, x + towerSide * 0.42, 0.78, headZ + 1.35)
  infusionTower(e, tw, {
    pumps: ICU_PUMPS[bed.vent ? 0 : 1], key: bed.label, toward: [target.x, target.y, target.z],
    bags: bed.vent ? [['0.9% Sodium Chloride', 'Injection IP · 1000 mL'], ['Ringer Lactate', 'Injection IP · 500 mL'], ['Amino Acids 10%', 'Infusion · 500 mL']] : [['5% Dextrose', 'Injection IP · 500 mL']],
  })
  room.info(tw, {
    title: 'Infusion Pumps · Docking Station', kind: 'Volumetric and syringe pumps',
    body: 'Volumetric pumps for the maintenance fluids and syringe pumps for the drugs given by continuous infusion (vasopressors, sedation, analgesia), docked in one station on the IV stand that powers them and links them to the monitor; each runs from the hospital\'s drug library with its dose limits.',
    specs: ['Volumetric: 0.1–1200 mL/h, ±5 %; syringe: 0.01–200 mL/h, 50 mL', 'Drug library with hard and soft limits', 'Occlusion and air-in-line detection', 'Docking station: shared power, one alarm lamp, data to EMR'],
  })
  return { b, l, bz }
}

/** The rest of a ventilator room or cubicle: bedside storage, hand hygiene, waste, the clock. */
function bedRoomSmalls(e: OpdCtx, room: Room, cart: [number, number, number], rub: [Parameters<Room['onWall']>[0], number], binAt: [Parameters<Room['onWall']>[0], number], clockAt: [Parameters<Room['onWall']>[0], number]) {
  const c = room.at(cart[0], cart[1], cart[2])
  drawerCart(e, c, 0.6, 0.95, 0.5, 5)
  room.info(c, { title: 'Bedside Supply Cart', kind: 'ICU consumables', body: 'The bed space\'s own stock in five drawers: cannulas and syringes, dressings, suction catheters and airway adjuncts, ECG electrodes and leads, blood sampling sets; restocked each shift.', specs: ['Five drawers, 600 × 500 mm', 'Colour-coded labels', 'Locking castors'] })
  rubBottle(e, room.onWall(rub[0], rub[1]), 1.25)
  const bw = room.onWall(binAt[0], binAt[1], 0, 0.2)
  bins(e, bw, ['yellow', 'red', 'black'])
  sharps(e, room.onWall(binAt[0], binAt[1]), 1.3)
  wallClock(e, room.onWall(clockAt[0], clockAt[1]), 2.35, 0.3)
}

const icuVent: Fitter = (e, room) => {
  const bed = ICU[room.spec.id]
  const x = room.cx
  const headZ = room.z0 + 1.2
  const { l } = bedSpace(e, room, x, headZ, -1)
  const door = room.doors[0]
  // The door's call lamp outside; the curtain inside the observation window; the charting computer.
  lampOverDoor(e, room, l, door.x, room.z1 + 0.122, 0)
  const gz = room.spec.glazing?.[0]
  if (gz) curtain(e, room.at(gz.from - 0.1, room.z1 - 0.1, 0), gz.to - gz.from + 0.2, room.ceiling, 0.35)
  const cow = room.at((gz ? (gz.from + gz.to) / 2 : x - 1), room.z1 - 0.62, PI - 0.25)
  computerOnWheels(e, cow, e.o.his(`icuChart_${bed.label}`, `${bed.label} · ICU FLOWSHEET`, 'table'))
  bedRoomSmalls(e, room, [room.x0 + 0.27, headZ + 2.35, PI / 2], ['-x', headZ + 2.35], ['+x', room.z1 - 2.2], ['-x', headZ + 1.0])
  // Clinical hand-wash by the door.
  handWashPoint(e, room.onWall('-x', room.z1 - 0.55), 0.5)
}

/* ---------- ICU-4, the isolation room and its anteroom ---------- */

const icuBed: Fitter = (e, room) => {
  const x = room.x1 - 1.6
  const headZ = room.z0 + 0.6
  const { l } = bedSpace(e, room, x, headZ, 1)
  const door = room.doors[0]
  lampOverDoor(e, room, l, room.x0 - 0.122, door.z, -PI / 2)
  const gz = room.spec.glazing?.[0]
  if (gz) curtain(e, room.at(room.x0 + 0.1, gz.from - 0.1, -PI / 2), gz.to - gz.from + 0.2, room.ceiling, 0.35)
  // Storage on the back wall; bins and the clock.
  const c = room.onWall('+z', room.x1 - 0.55, 0, 0.27)
  drawerCart(e, c, 0.6, 0.95, 0.5, 5)
  rubBottle(e, room.onWall('-x', room.z1 - 0.45), 1.25)
  bins(e, room.onWall('+z', room.x0 + 1.0, 0, 0.2), ['yellow', 'red', 'black'])
  sharps(e, room.onWall('+z', room.x0 + 1.0), 1.3)
  wallClock(e, room.onWall('+z', room.x0 + 2.0), 2.35, 0.3)
}

const icuIsolation: Fitter = (e, room) => {
  const x = room.x0 + 1.63
  const headZ = room.z0 + 0.65
  bedSpace(e, room, x, headZ, -1)
  const c = room.onWall('-x', headZ + 2.4, 0, 0.27)
  drawerCart(e, c, 0.6, 0.95, 0.5, 5)
  handWashPoint(e, room.onWall('+z', room.x0 + 0.55), 0.5)
  rubBottle(e, room.onWall('-x', headZ + 1.75), 1.25)
  bins(e, room.onWall('+x', room.z1 - 0.3, 0, 0.6), ['yellow', 'red'], 'large')
  wallClock(e, room.onWall('-x', headZ + 1.0), 2.35, 0.3)
  // The exhaust grille low on the head wall that draws the room's air out through HEPA filters.
  const ex = room.onWall('-z', x - 0.6)
  e.k.box(ex, 0.6, 0.3, 0.02, e.m.whitePlastic, 0, 0.35, 0.01)
  face(e, ex, 0.56, 0.26, e.m.grille, 0, 0.35, 0.021)
  room.info(ex, { title: 'Low-level Exhaust (HEPA)', kind: 'Airborne infection isolation', body: 'The room is kept at negative pressure to the anteroom and the corridor: supply air from the ceiling over the door, exhaust low behind the bed head through HEPA filters, so air moves from the staff towards the patient and out.', specs: ['≥ 12 air changes per hour', '−2.5 Pa or lower to the anteroom', 'HEPA H14 on the exhaust, 100 % fresh air'] })
}

const icuAnte: Fitter = (e, room) => {
  // PPE station on the back wall, the hand-wash by the façade, bins at the doffing side.
  const ppe = room.onWall('+z', room.x0 + 1.75)
  ppeStation(e, ppe)
  room.info(ppe, {
    title: 'PPE Donning Station', kind: 'Airborne and contact precautions',
    body: 'Everything put on before entering the isolation room, in the order it is donned: hand hygiene, gown, N95 respirator (fit-checked), eye protection or face shield, gloves over the gown\'s cuffs. Doffing happens at the exit side, into the yellow bin, with hand hygiene between steps.',
    specs: ['Isolation gowns, N95 respirators, surgical masks, caps, shoe covers', 'Nitrile gloves S / M / L', 'Reusable face shields: cleaned after each use', 'Donning and doffing sequence posted'],
  })
  handWashPoint(e, room.onWall('+z', room.x1 - 0.5), 0.5)
  bins(e, room.onWall('-z', room.x1 - 0.55, 0, 0.25), ['yellow', 'black'], 'large')
  // The pressure monitor by the inner door; the sequence posters; the isolation sign outside.
  const pm = room.onWall('-z', room.x1 - 0.95)
  pressureMonitor(e, pm, 1.55)
  room.info(pm, { title: 'Room Pressure Monitor', kind: 'Negative-pressure isolation', body: 'Shows the isolation room\'s pressure against the anteroom continuously, green while it is negative; an alarm sounds at the door and at the nursing station if the pressure is lost or the door is held open.', specs: ['Range ±50 Pa, resolution 0.1 Pa', 'Alarm below −2.5 Pa, delay 30 s for door opening', 'Relay to the BMS and the nursing station'] })
  poster(e, room.onWall('-z', room.x0 + 0.5), 'PPE Donning Sequence', '#1f9d55', 0.36, 0.5, 1.55)
  poster(e, room.onWall('+z', room.x0 + 0.5), 'PPE Doffing Sequence', '#c8161d', 0.36, 0.5, 1.55)
  rubBottle(e, room.onWall('-z', room.x0 + 0.95), 1.25)
  // The isolation sign outside on the corridor, beside the anteroom's door.
  const out = room.at(room.x0 - 0.122, -13.66, -PI / 2)
  plainSign(e, out, 'isoSign', 0.36, 0.5, 1.6, '#ffffff', [['AIRBORNE', 0.11, '#c8161d'], ['ISOLATION', 0.11, '#c8161d'], ['Negative-pressure room', 0.055, '#1c3966', 600], ['N95 respirator required', 0.055, '#1c3966', 600], ['Keep doors closed', 0.055, '#1c3966', 600]], '#c8161d')
}

/* ---------- the central nursing station ---------- */

const icuStation: Fitter = (e, room) => {
  const { k, m } = e
  // The front counter facing the corridor, the central monitor screens on it, chairs.
  const len = 2.3
  const cg = room.at(room.x1 - len / 2 - 0.06, room.z1 - 0.8, 0)
  counterLike(e, cg, len)
  const central = e.o.screen('icuCentral', 1024, 576, centralPaint(7200))
  for (const [x, ry] of [[-0.55, PI - 0.08], [0.5, PI + 0.08]] as const) workstation(e, cg, x, 0.765, 0.05, ry, central)
  deskPhone(e, cg, -0.05, 0.765, 0.18, PI)
  printer(e, cg, len / 2 - 0.3, 0.765, 0.12, PI)
  for (const [x, ry] of [[-0.55, 0.15], [0.5, -0.2]] as const) taskChair(e, group(cg, x, 0, -0.62, ry))
  room.info(cg, {
    title: 'ICU Central Monitoring Station', kind: 'Central station · Surveillance',
    body: 'Every bed\'s monitor, its waveforms, numerics and alarms on the central station\'s screens, with full disclosure of 96 hours for review; the nurses at the counter see down both ICU corridors and into each room through its glass.',
    specs: ['4 beds live, expandable to 16', 'Full disclosure 96 h, arrhythmia review', 'Alarm escalation to staff phones', 'Integrated with the ventilators and pumps'],
  })
  // The large overview screen and the call annunciator on the side wall; gas valves and alarm.
  wallScreen(e, room.onWall('-x', room.z1 - 2.4), 1.0, 1.85, central)
  const ann = room.onWall('-x', room.z1 - 1.35)
  annunciator(e, ann, ['vent1', 'vent2', 'isolation', 'icu4'], ['ICU-1', 'ICU-2', 'ICU-3', 'ICU-4'], 'icuAnn', 2.05)
  const zv = room.onWall('-x', room.z1 - 0.75)
  zoneValves(e, zv, 0, 1.45, room.ceiling)
  gasAlarm(e, room.onWall('-x', room.z1 - 1.35), 0, 1.55)
  room.info(zv, { title: 'Medical Gas Zone Valves · Area Alarm', kind: 'Medical gas pipeline system', body: 'The ICU\'s isolating valves for oxygen, medical air and vacuum behind the break-glass lid, with their line pressure gauges, and the area alarm panel beside them that sounds on high or low line pressure.', specs: ['O₂ and air 4.0 bar, vacuum −60 kPa', 'Area alarm: high / low pressure per gas', 'Valves lockable, labelled per zone'] })
  wallClock(e, room.onWall('-x', room.z1 - 0.75), 2.55, 0.3)
  // The doctor's workstation along the side wall, the chart rack over it.
  const dg = room.onWall('-x', room.z0 + 1.25, 0, 0.35)
  desk(e, dg, 1.4, 0.7, 1)
  computer(e, dg, -0.32, 0.75, 0.0, PI, e.o.his('icuDoc1', 'ICU · PATIENT SUMMARY', 'form'))
  computer(e, dg, 0.3, 0.75, 0.0, PI, e.o.his('icuDoc2', 'PACS · CHEST X-RAY', 'image'))
  papers(e, dg, 0.0, 0.75, -0.2)
  taskChair(e, group(dg, 0, 0, -0.62, 0.1))
  wallCupboard(e, room.onWall('-x', room.z0 + 1.25), 1.4, 0.65, 0.35, 1.55, { glass: true, fill: 'files', label: 'Chart Cupboard' })
  room.info(dg, { title: 'ICU Doctors\' Workstation', kind: 'Hospital information system · PACS', body: 'The intensivist\'s desk: the electronic record with the ICU flowsheet, orders and results, and the PACS viewer for the morning\'s chest X-rays; patient charts and consent files in the cupboard over it.', specs: ['HIS / EMR with CPOE', 'PACS diagnostic viewer', 'Network printer at the counter'] })
  // Along the back: the emergency drug refrigerator, the medication cart, the crash cart.
  const fr = room.at(room.x0 + 1.25, room.z0 + 0.66, 0)
  medFridge(e, fr, 'Emergency Drug Refrigerator')
  room.info(fr, { title: 'Emergency Drug Refrigerator', kind: 'Cold chain · 2–8 °C', body: 'Refrigerated emergency and ICU drugs (insulin, suxamethonium, rocuronium, vasopressin, antibiotics reconstituted) at 2–8 °C, with its display and alarm; temperatures logged twice a shift.', specs: ['2–8 °C, ±1 °C', 'Glass door, lockable', 'High / low alarm, data logging'] })
  const mc = room.at(room.x0 + 2.0, room.z0 + 0.4, 0)
  drawerCart(e, mc, 0.6, 0.95, 0.5, 5, m.whitePlastic)
  const cc = room.at(room.x1 - 0.45, room.z0 + 0.62, -PI / 2)
  crashCart(e, cc, e.m.monitors[2])
  room.info(cc, {
    title: 'Crash Cart · Defibrillator', kind: 'Resuscitation',
    body: 'The ICU\'s resuscitation cart: a biphasic monitor-defibrillator with pacing on top, the CPR board behind, oxygen at its side, and drawers sealed with a numbered breakaway tag: emergency drugs, airway (laryngoscopes, tubes, bougie, supraglottic airways), circulation, and procedure packs. Checked every shift.',
    specs: ['Biphasic 1–360 J, AED and manual, transcutaneous pacing', 'Drawer 1: adrenaline, amiodarone, atropine, calcium', 'Drawer 2: airway; 3: IV access; 4–5: packs', 'Seal number logged at each check'],
  })
  // A suspended sign over the counter.
  const sg = room.at(room.x1 - len / 2 - 0.06, room.z1 - 0.05, PI)
  for (const s of [-1, 1]) k.cyl(sg, 0.0015, 0.0015, 0.38, m.stainless, s * 0.5, room.ceiling - 0.19, 0, 4)
  plainSign(e, sg, 'icuStationSign', 1.3, 0.24, room.ceiling - 0.5, NAVY, [['ICU NURSING STATION', 0.42, '#ffffff']])
  face(e, sg, 1.28, 0.22, e.o.sign('icuStationSign2', 832, 154, board(NAVY, [['ICU NURSING STATION', 0.42, '#ffffff']])), 0, room.ceiling - 0.5, -0.0005, PI)
}

/** A high counter facing +z (the corridor): solid-surface front and ledge, work top, drawer pedestals. */
function counterLike(e: OpdCtx, p: Object3D, len: number) {
  const { k, m } = e
  k.soft(p, len, 0.04, 0.34, 0.015, m.solidSurface, 0, 1.1, 0.6)
  k.box(p, len, 0.97, 0.05, m.solidSurface, 0, 0.6, 0.745)
  k.box(p, len, 0.1, 0.03, m.skirting, 0, 0.05, 0.71)
  k.box(p, len - 0.1, 0.008, 0.01, m.ledLine, 0, 1.065, 0.77, false)
  k.box(p, len - 0.04, 0.33, 0.03, m.hpl, 0, 0.93, 0.43)
  k.soft(p, len - 0.04, 0.03, 0.68, 0.01, m.solidSurface, 0, 0.75, 0.08)
  for (const s of [-1, 1]) k.soft(p, 0.06, 1.1, 0.92, 0.02, m.solidSurface, s * (len / 2 - 0.03), 0.55, 0.32)
  k.box(p, len - 0.2, 0.5, 0.018, m.hpl, 0, 0.45, 0.38)
}

/**
 * A nurse-call annunciator panel on a wall (face at z = 0): a strip of labelled lamps, one per
 * room's call circuit, lit amber when that room calls; its reset button.
 */
function annunciator(e: OpdCtx, p: Object3D, ids: string[], labels: string[], key: string, y: number) {
  const { k, m } = e
  const w = ids.length * 0.14 + 0.06
  k.soft(p, w, 0.2, 0.03, 0.01, m.whitePlastic, 0, y, 0.015)
  face(e, p, w - 0.02, 0.05, e.o.sign(`${key}_labels`, Math.round(w * 600), 30, (g, ww, hh) => {
    g.fillStyle = '#ffffff'
    g.fillRect(0, 0, ww, hh)
    g.fillStyle = '#1c3966'
    g.font = `700 ${hh * 0.62}px Helvetica`
    g.textAlign = 'center'
    labels.forEach((t, i) => g.fillText(t, (ww * (0.03 + 0.14 * (i + 0.5))) / (w), hh * 0.74))
  }), 0, y - 0.065, 0.031)
  ids.forEach((id, i) => callLamp(e, p, link(e, id), -w / 2 + 0.03 + 0.14 * (i + 0.5), y + 0.03, 0.03, 'amber'))
}

/* ---------- store and corridors ---------- */

const icuStore: Fitter = (e, room) => {
  const { k, m } = e
  const r = room.onWall('-z', room.x1 - 1.25, 0, 0.0)
  rack(e, r, 1.6, 2.0, 0.42, 5, 'supplies')
  // Spare pumps and monitors stood on the rack's upper shelves.
  for (let i = 0; i < 2; i++) {
    infusionPump(e, group(r, -0.45 + i * 0.3, 1.58, 0.3), e.m.off)
    syringePump(e, group(r, 0.3, 1.58 + i * 0.075, 0.3), e.m.off)
  }
  patientMonitor(e, group(r, 0.45, 1.2, 0.3), e.m.off, 0.38)
  room.info(r, { title: 'Equipment Store', kind: 'ICU spares', body: 'Spare infusion and syringe pumps, monitors and transport monitor, circuits, filters and humidifier chambers, kept charged and checked so a failed device is swapped in minutes.', specs: ['Pumps on charge, labelled with service dates', 'Ventilator circuits and HMEs in sealed packs', 'Biomedical engineering check monthly'] })
  const sv = room.at(room.x1 - 0.42, room.z1 - 0.38, -PI / 2 - 0.2)
  icuVentilator(e, sv, { screen: e.m.off, side: 1 })
  room.info(sv, { title: 'Standby Ventilator', kind: 'Critical care ventilator', body: 'A second ventilator kept complete and tested with its circuit and humidifier, ready for a new admission or as a replacement.', specs: ['Pre-use check passed, tagged', 'Battery charged', 'Circuit, filter and test lung fitted'] })
  const su = room.at(room.x1 - 1.4, room.z1 - 0.32, PI)
  suctionUnit(e, su)
  // An oxygen cylinder trolley with a portable cylinder, for transfers.
  const ct = room.at(room.x1 - 2.05, room.z1 - 0.3, PI)
  for (const [x, z] of [[-0.13, -0.13], [0.13, -0.13], [-0.13, 0.13], [0.13, 0.13]]) castor(e, ct, x, z, 0.035)
  k.box(ct, 0.3, 0.02, 0.3, m.powder, 0, 0.09, 0)
  cylinderFrame(e, ct)
  e.k.cyl(ct, 0.11, 0.11, 0.9, m.cylinder, 0, 0.55, 0, 24)
  e.k.cyl(ct, 0.11, 0.11, 0.12, m.whitePlastic, 0, 1.06, 0, 24)
  e.k.cyl(ct, 0.025, 0.025, 0.1, m.brass, 0, 1.17, 0, 12)
}

/** The cylinder trolley's frame: an upright with its handle, the restraining band. */
function cylinderFrame(e: OpdCtx, p: Object3D) {
  const { m } = e
  e.k.box(p, 0.02, 0.9, 0.02, m.powder, 0, 0.55, -0.14)
  e.k.box(p, 0.26, 0.03, 0.02, m.powder, 0, 0.75, -0.13)
  e.k.box(p, 0.26, 0.02, 0.02, m.powder, 0, 0.98, 0.11)
}

const icuCorridor: Fitter = (e, room) => {
  if (room.spec.id === 'icuCorridorB') {
    // Hand-rub at the ventilator rooms' doors; the hand-wash, crash cart and linen in the alcove.
    for (const x of [5.6, 9.75]) handRub(e, room.onWall('-z', x), 1.2)
    const hw = room.onWall('+z', room.x1 - 0.7)
    handWashPoint(e, hw, 0.5)
    room.info(hw, { title: 'Clinical Hand-wash Point', kind: 'Hand hygiene', body: 'A clinical basin with an elbow-operated mixer, soap and alcohol-rub dispensers and paper towels: the WHO five moments are posted beside it.', specs: ['No-overflow basin, splash-free outlet', 'Elbow lever, thermostatic supply', 'Paper towels, pedal bin'] })
    pedalBin(e, room.at(room.x1 - 1.25, room.z1 - 0.2))
    const cc = room.at(room.x1 - 2.85, room.z1 - 0.32, PI)
    crashCart(e, cc, e.m.monitors[3])
    room.info(cc, { title: 'Crash Cart · Corridor', kind: 'Resuscitation', body: 'The second resuscitation cart, parked in the corridor alcove between the ventilator rooms and the isolation room, its defibrillator charged and its seal checked each shift.', specs: ['Biphasic defibrillator with pacing', 'Sealed drawers, numbered tag', 'Within 10 s of every ICU bed'] })
    linenTrolley(e, room.at(room.x1 - 1.9, room.z1 - 0.3, PI))
    // The restricted-entry sign over the doors, on the back corridor's side.
    const s = room.at(room.x0 - 0.122, -19.4, -PI / 2)
    plainSign(e, s, 'icuRestricted', 1.2, 0.3, 2.5, '#c8161d', [['ICU · RESTRICTED ENTRY', 0.34, '#ffffff'], ['Authorised staff only · Visitors please wait at the ICU waiting', 0.16, '#ffe4e4', 500]])
    poster(e, room.onWall('-z', 6.15), 'Hand Hygiene · 5 Moments', '#1f6fd1', 0.36, 0.5, 1.55)
  } else {
    // The north corridor: hand-rub at the anteroom's and ICU-4's doors; the sign over its doors outside.
    for (const z of [-14.05, -8.25]) handRub(e, room.onWall('+x', z), 1.2)
    const s = room.at((room.x0 + room.x1) / 2, room.z1 + 0.122, 0)
    plainSign(e, s, 'icuRestricted2', 1.2, 0.3, 2.5, '#c8161d', [['ICU · RESTRICTED ENTRY', 0.34, '#ffffff'], ['Authorised staff only · Visitors please wait at the ICU waiting', 0.16, '#ffe4e4', 500]])
  }
}

/* ---------- outside the ICU ---------- */

const icuWaiting: Fitter = (e, room) => {
  const a = room.at(room.x1 - 0.33, -1.55, -PI / 2)
  beamSeating(e, a, 4, 'upholstered')
  const b = room.at(6.85, room.z1 - 0.33, PI)
  beamSeating(e, b, 3, 'upholstered')
  room.info(a, { title: 'ICU Relatives\' Waiting', kind: 'Family area', body: 'Where the families of ICU patients wait, by the lifts and outside the ICU\'s doors: upholstered seating, drinking water, the visiting information on the screen, and the counselling room next door for conversations with the doctors.', specs: ['Visiting 11:00–12:00 and 17:00–18:00, one at a time', 'ICU reception on the intercom at the doors', 'Counselling room 222 beside'] })
  waterStation(e, room.onWall('+z', room.x1 - 0.4))
  wallScreen(e, room.onWall('+x', -1.55), 1.1, 1.95, e.o.screen('icuVisit', 640, 360, board(NAVY, [['INTENSIVE CARE UNIT', 0.11, '#ffffff'], ['Visiting hours  11:00 – 12:00  ·  17:00 – 18:00', 0.075, '#cfe0f5', 600], ['One visitor at a time · Hand hygiene at the doors', 0.06, '#9fc0e6', 500], ['Doctors\' briefing to families daily at 13:00', 0.06, '#9fc0e6', 500]])))
  planter(e, room.at(room.x1 - 0.3, room.z0 + 0.3))
  leafletRack(e, room.onWall('+z', 6.0), 1.25)
  poster(e, room.onWall('+z', 7.45), 'ICU Visiting Guidelines', '#1f6fd1', 0.36, 0.5, 1.55)
}

const icuCounselling: Fitter = (e, room) => {
  const c = intlMats(e)
  const sofa = room.at(6.8, room.z1 - 0.44, PI)
  sofaBed(e, sofa, 1.7, c.taupe, false)
  pedestalTable(e, room.at(6.8, 2.55), 0.6, 0.45)
  tissueBox(e, room.group, 6.85, room.y + 0.45, 2.5, 0.3)
  clubChair(e, room.at(5.95, 2.2, 1.13))
  clubChair(e, room.at(7.75, 2.3, -1.09))
  const dr = room.at(6.8, 1.45, 0)
  clubChair(e, dr, c.teal)
  room.info(dr, { title: 'Family Counselling Room', kind: 'Quiet room', body: 'A quiet, softly lit room where the ICU\'s doctors meet families: to explain a patient\'s condition and plan, to discuss consent and difficult decisions, away from the corridors. Tissues, water, and time.', specs: ['Seats five round a low table', 'Dimmable warm lighting', 'Acoustic door, no glazing to the corridor'] })
  const st = room.at(8.05, room.z1 - 0.32)
  pedestalTable(e, st, 0.45, 0.55)
  tableLamp(e, group(st, 0.04, 0.55, -0.05))
  tissueBox(e, st, -0.08, 0.55, 0.08, 0.4)
  floorLamp(e, room.at(room.x0 + 0.32, room.z1 - 0.3))
  room.lamp(room.x0 + 0.5, room.z1 - 0.5, 1.2, 4, '#ffd6a0')
  artwork(e, room.onWall('+z', 6.8), 1.2, 0.75, 3, 1.6)
  artwork(e, room.onWall('+x', 2.3), 0.6, 0.8, 1, 1.5)
  planter(e, room.at(room.x1 - 0.3, room.z1 - 0.3))
}

/* ---------- the international patient wing ---------- */

const intlLounge: Fitter = (e, room) => {
  const { k } = e
  const c = intlMats(e)
  // The concierge desk and its backdrop: walnut feature wall, the backlit name, world clocks.
  const dx = 6.55
  const desk = room.at(dx, room.z0 + 1.42, 0)
  conciergeDesk(e, desk, 2.2, [e.o.his('intlDesk1', 'INTERNATIONAL PATIENTS · ARRIVALS', 'table'), e.o.his('intlDesk2', 'VISA & FRRO · DOCUMENTS', 'form')])
  for (const [x, ry] of [[-0.55, 0.1], [0.55, -0.1]] as const) taskChair(e, group(desk, x, 0, -0.75, PI + ry))
  room.info(desk, {
    title: 'International Patient Desk', kind: 'Concierge · International patient services',
    body: 'The wing\'s concierge for patients from abroad and their families: medical visa invitation letters and FRRO registration, interpreters (Arabic, Bengali, Russian, French, Dari, Swahili), foreign exchange, airport pick-up and drop, accommodation for attendants, and a single estimate and bill in their currency.',
    specs: ['Interpreters on call 24 × 7', 'Visa & FRRO assistance, embassy liaison', 'Forex counter, international cards and wire transfer', 'Airport transfers, guest-house tie-ups'],
  })
  const bw = room.onWall('-z', dx)
  k.box(bw, 2.5, 2.6, 0.03, kitMats(e).walnut, 0, 1.3, 0.015)
  k.box(bw, 2.5, 0.012, 0.02, e.m.ledLine, 0, 2.598, 0.04, false)
  const name = e.o.screen('intlName', 1200, 220, (g, w, h) => {
    g.fillStyle = '#20140c'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#f6e6c8'
    g.font = `600 ${h * 0.3}px "Helvetica Neue", Helvetica, Arial`
    g.textAlign = 'center'
    g.fillText('INTERNATIONAL PATIENT SERVICES', w / 2, h * 0.45)
    g.fillStyle = '#d9b77f'
    g.font = `400 ${h * 0.15}px "Helvetica Neue", Helvetica, Arial`
    g.fillText('Interpreters  ·  Visa & FRRO  ·  Forex  ·  Airport Transfers  ·  Accommodation', w / 2, h * 0.78)
  }, 0.75)
  k.box(bw, 1.94, 0.37, 0.02, c.bronze, 0, 1.62, 0.04)
  face(e, bw, 1.9, 0.35, name, 0, 1.62, 0.0505)
  const cities: [string, number][] = [['New Delhi', 330], ['Dhaka', 360], ['Dubai', 240], ['Tashkent', 300], ['Lagos', 60], ['London', 0]]
  cities.forEach(([city, off], i) => worldClock(e, group(bw, -0.95 + i * 0.38, 0, 0.03), city, off, 2.3))
  annunciator(e, group(bw, -1.0, 0, 0.03), ['suite211', 'suite212', 'suite213'], ['211', '212', '213'], 'intlAnn', 1.15)
  // Flags of the host country and those most patients come from.
  FLAGS.slice(0, 5).forEach(([key, paint], i) => flagStand(e, room.at(8.25 + i * 0.32, room.z0 + 0.3, 0), key, paint))
  // Seating by the glass door: a sofa, two club chairs, the coffee table, a planter.
  const sofa = room.at(3.3, room.z1 - 0.44, PI)
  sofaBed(e, sofa, 1.7, c.boucle, false)
  room.info(sofa, { title: 'Lounge', kind: 'International patient lounge', body: 'A quiet lounge for international patients and their families waiting for admission, a consultation or a transfer: soft seating, refreshments, the wing\'s concierge at hand.', specs: ['Wi-Fi, charging points', 'Refreshments all day', 'Prayer mat and Qibla direction on request'] })
  coffeeTable(e, room.at(3.3, 7.05, 0), 1.0, 0.55)
  for (const x of [2.9, 3.75]) clubChair(e, room.at(x, 5.95, x < 3.3 ? 0.12 : -0.12))
  planter(e, room.at(room.x0 + 0.38, room.z0 + 0.4))
  artwork(e, room.onWall('+z', 3.3), 1.3, 0.85, 2, 1.6)
  // The refreshment counter between the suites' doors; two chairs and a lamp by the east wall.
  const rc = room.onWall('+z', 9.9)
  refreshmentCounter(e, rc, 1.9)
  room.info(rc, { title: 'Refreshment Counter', kind: 'Lounge pantry', body: 'Coffee and tea from a bean-to-cup machine, hot water, cookies and bottled water, for patients\' families through the day; dietary requests (halal, vegetarian, Jain) through the pantry.', specs: ['Bean-to-cup coffee, six recipes', 'Hot-water urn, herbal teas', 'Halal and vegetarian snacks'] })
  for (const x of [9.75, 10.85]) clubChair(e, room.at(x, room.z0 + 0.5, 0), c.taupe)
  const sd = room.at(10.3, room.z0 + 0.3)
  pedestalTable(e, sd, 0.45, 0.55)
  tableLamp(e, group(sd, 0, 0.55, 0))
  artwork(e, room.onWall('+x', 7.9), 0.5, 0.7, 0, 1.55)
}

/**
 * A suite's room: its bed with the head on `head` (the wall the two suites share, their bed heads
 * back to back on its services), the premium bed head with full gases, the wall monitor, bedside
 * cabinet and lamp, recliner and the attendant's sofa-bed in the window bay, a credenza with the
 * minibar under the TV and the split AC on the washroom's wall, the wardrobe in the entry,
 * curtain, art, call. The suite runs out to the façade beyond its washroom (the bay behind the pier).
 */
const intlSuite: Fitter = (e, room) => {
  const id = room.spec.id
  const l = link(e, id)
  const entry = e.byId.get(`${id}Entry`)
  if (id === 'suite213') return presidential(e, room, l, entry)
  const s = id === 'suite211' ? -1 : 1
  const head: '-x' | '+x' = s > 0 ? '-x' : '+x'
  const hx = s > 0 ? room.x0 : room.x1
  const u = (d: number) => hx + s * d
  const bz = room.z0 + 1.5
  const hb = room.onWall(head, bz)
  bedHead(e, hb, l, { premium: true, gases: 'full', width: 2.0 })
  const bed = room.at(u(1.17), bz, s * PI / 2)
  wardBed(e, bed, { style: 'premium', back: 0.3, linen: 'made', height: 0.6 })
  room.info(bed, {
    title: 'Premium Patient Bed', kind: 'Electric hospital bed · International suite',
    body: 'A five-function electric bed with oak-laminate head and foot boards: height, backrest, knee break, Trendelenburg and reverse, from the patient\'s handset or the nurse\'s footboard panel; a pressure-redistributing foam mattress; the bed head behind it carries oxygen, medical air and vacuum, power on UPS, the nurse call and the reading light.',
    specs: ['Height 0.40–0.80 m, backrest 0–70°', 'Pressure-redistributing mattress', 'Medical gases O₂, air, vacuum at the bed head', 'Nurse call to the door lamp and the concierge'],
  })
  wallMonitor(e, room.onWall(head, bz + 1.02), e.o.screen(`suiteMon_${id}`, 640, 408, icuMonitorPaint(`Suite ${room.spec.no}`, 7300 + (s > 0 ? 1 : 2), false)), 1.85)
  const bc = room.at(u(0.29), bz + 0.83, s * PI / 2)
  bedsideCabinet(e, bc)
  tableLamp(e, group(bc, 0.12, 0.67, -0.1))
  recliner(e, room.at(u(1.55), room.z1 - 0.56, PI))
  const sb = room.at(u(3.0), room.z1 - 0.46, PI)
  sofaBed(e, sb, 1.6)
  room.info(sb, { title: 'Attendant\'s Sofa-cum-bed', kind: 'Family accommodation', body: 'The attendant stays with the patient: the sofa\'s seat cushions pull out to a single bed, made up at night by housekeeping with fresh linen.', specs: ['Sleeps one, 0.75 × 1.9 m', 'Linen changed daily'] })
  // On the washroom's wall across from the bed: credenza and minibar, the TV over them, the AC.
  const cr = room.onWall('-z', u(3.5))
  credenza(e, cr, 1.1, true)
  wallTV(e, room.onWall('-z', u(3.5)), 43, 1.6)
  splitAC(e, room.onWall('-z', u(4.55)), 0.95, 2.72, s * 0.75)
  floorLamp(e, room.at(u(0.27), room.z1 - 0.25))
  artwork(e, room.onWall('-z', u(4.85)), 0.4, 0.55, 2 + (s > 0 ? 0 : 1), 1.5)
  // The entry: wardrobe, hand-rub by the door, the curtain at the room's edge, the lamp outside.
  if (entry) {
    const wd = entry.onWall(head, entry.z0 + 1.4, 0, 0)
    wardrobe(e, wd, 1.0, 2.1, 0.58, 'walnut')
    rubBottle(e, entry.onWall(head === '-x' ? '+x' : '-x', entry.z0 + 0.6), 1.25)
    const door = entry.doors[0]
    if (door) lampOverDoor(e, entry, l, door.x, entry.z0 - 0.062, PI)
    const cx0 = s > 0 ? entry.x0 + 0.03 : entry.x1 - 0.03
    curtain(e, room.at(cx0, room.z0 + 0.1, s > 0 ? 0 : PI), entry.w - 0.06, room.ceiling, 0.3)
  }
}

/** The presidential suite: the bed head on the side wall, the patient looking out of the glass. */
function presidential(e: OpdCtx, room: Room, l: CallLink, entry: Room | undefined) {
  const c = intlMats(e)
  const bz = 1.3
  bedHead(e, room.onWall('-x', bz), l, { premium: true, gases: 'full', width: 2.0 })
  const bed = room.at(room.x0 + 1.17, bz, PI / 2)
  wardBed(e, bed, { style: 'premium', back: 0.35, linen: 'made', height: 0.6 })
  room.info(bed, {
    title: 'Presidential Suite 213', kind: 'International patient suite',
    body: 'The wing\'s largest suite on the north-east corner: the patient\'s bed facing the glass, a full medical bed head with O₂, air and vacuum, a lounge corner by the window, an attendant\'s sofa-bed, and through the door the family room with its own pantry, dining and sleeping space.',
    specs: ['Bed head: O₂, medical air, vacuum, UPS power, nurse call', 'Wall monitor, vital signs to the EMR', 'Family room with kitchenette and sofa-bed', 'Butler and interpreter on call'],
  })
  wallMonitor(e, room.onWall('-x', bz + 1.02), e.o.screen('suiteMon_213', 640, 408, icuMonitorPaint('Suite 213', 7303, false)), 1.85)
  const bc = room.at(room.x0 + 0.29, bz + 0.83, PI / 2)
  bedsideCabinet(e, bc)
  tableLamp(e, group(bc, 0.12, 0.67, -0.1))
  recliner(e, room.at(room.x0 + 1.4, 2.8, PI))
  credenza(e, room.onWall('-x', 3.3), 1.1, true)
  artwork(e, room.onWall('-x', 3.3), 0.8, 0.6, 1, 1.6)
  // The TV on a full-motion arm, swung towards the bed; the AC over it.
  const tv = tvArm(e, room.onWall('+z', 11.5), 1.6, 0.4, 0.3)
  wallTV(e, tv, 43, 1.6)
  splitAC(e, room.onWall('+z', 11.5), 0.95, 2.72, 0.7)
  sofaBed(e, room.at(11.05, room.z0 + 0.44, 0), 1.7)
  // The window corner: two club chairs and a table between, a floor lamp.
  clubChair(e, room.at(12.98, -0.62, 0.15))
  clubChair(e, room.at(12.98, 0.78, PI - 0.15), c.teal)
  const t = room.at(13.0, 0.08)
  pedestalTable(e, t, 0.5, 0.55)
  floorLamp(e, room.at(13.35, 1.42))
  curtain(e, room.at(12.5, 2.4, PI / 2), 3.3, room.ceiling, 0.25)
  rubBottle(e, room.onWall('+z', 13.45), 1.25)
  if (entry) {
    wardrobe(e, entry.onWall('-z', entry.x1 - 0.65, 0, 0), 1.0, 2.1, 0.58, 'walnut')
  }
  // The call lamp over the family room's door to the lounge, on the lounge side.
  lampOverDoor(e, room, l, 11.3 - 0.062, 6.4, -PI / 2)
}

const intlFamily: Fitter = (e, room) => {
  const c = intlMats(e)
  kitchenette(e, room.onWall('-x', 4.9), 1.5)
  credenza(e, room.onWall('-x', 8.6), 1.2, false)
  wallTV(e, room.onWall('-x', 8.6), 43, 1.55)
  const sb = room.at(room.x1 - 0.47, 8.6, -PI / 2)
  sofaBed(e, sb, 1.8, c.boucle)
  room.info(sb, { title: 'Family Room · Presidential Suite', kind: 'Family accommodation', body: 'The suite\'s family room: a sofa-cum-bed for a second attendant, a TV, a small dining table and a kitchenette with sink, microwave, kettle and purified water, so a family can stay through a long admission.', specs: ['Sofa-cum-bed, linen daily', 'Kitchenette with RO water', 'Dining for two'] })
  clubChair(e, room.at(room.x1 - 0.38, 6.1, -PI / 2), c.taupe)
  floorLamp(e, room.at(room.x1 - 0.25, 7.2))
  pedestalTable(e, room.at(11.98, 10.05), 0.7, 0.74)
  diningChair(e, room.at(11.98, 9.45, 0))
  diningChair(e, room.at(12.58, 10.1, -PI / 2))
  if (!room.exterior.includes('+z')) artwork(e, room.onWall('+z', 12.3), 0.7, 0.5, 0, 1.6)
}

export const MAIN_SECOND: Record<string, Fitter> = {
  icu_vent: icuVent,
  icu_bed: icuBed,
  icu_isolation: icuIsolation,
  icu_ante: icuAnte,
  icu_station: icuStation,
  icu_store: icuStore,
  icu_corridor: icuCorridor,
  icu_waiting: icuWaiting,
  icu_counselling: icuCounselling,
  intl_lounge: intlLounge,
  intl_suite: intlSuite,
  intl_family: intlFamily,
}
