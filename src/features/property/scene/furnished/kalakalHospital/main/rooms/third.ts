import { PI } from '../../../kit'
import { beamSeating, linenTrolley } from '../../emergency'
import { headwall, ivStand, vitalsStand } from '../../erEquipment'
import { bed, crashCart, cylinder, roundStool, taskChair } from '../../erFurniture'
import { group, signPanel } from '../../erKit'
import type { Room } from '../../opd/ctx'
import { handRub } from '../../opd/equipment/common'
import { autoclave, bench as labBench } from '../../opd/equipment/lab'
import { floorDrain, mirror, soapDispenser, wallBasin, wcPan, handWashPoint } from '../../opd/equipment/sanitary'
import { baseRun, bins, clock, computer, cupboard, curtain, desk, deskPhone, lockers, medFridge, rack, sharps, viewer, wallScreen } from '../../opd/furniture'
import { board, NAVY, tokenScreen } from '../../opd/paints'
import type { Fitter } from '../../opd/rooms/types'
import {
  anaesthesiaMachine, cArm, esu, instrumentTable, kickBucket, laminarPlenum, lapTower, mayoStand, operatingTable, otPendant, scrubTrough, steelTrolley, suctionUnit, surgeonPanel, surgicalLights, wallPanels,
} from '../equipment/thirdOt'
import { callLink, drawerCart, wallClock, wardBed } from '../kit'
import { MAIN_CORE } from './core'

/*
 * The main block's third floor: the operation theatre complex. Patients come up in the bed lifts
 * to the transfer bay (the red line), wait in pre-operative holding and pass by the clean corridor,
 * with its scrub troughs, into one of three theatres; they wake in the recovery unit (PACU) down
 * the north side. Staff change at the back and enter by the semi-restricted corridors; used
 * instruments go to the CSSD, waste and soiled linen to the dirty utility. Plan coordinates as in
 * ../../opd/plan.ts.
 */

/** A notice on a wall: navy or red on white, two lines. */
function notice(e: Parameters<Fitter>[0], room: Room, side: Parameters<Room['onWall']>[0], along: number, key: string, title: string, sub: string, red = false, y = 1.75) {
  const mat = e.o.sign(`ot_${key}`, 640, 220, board(red ? '#ffffff' : NAVY, [[title, 0.3, red ? '#c8161d' : '#ffffff'], [sub, 0.15, red ? '#333333' : '#c7d3e6', 500]], { border: red ? '#c8161d' : undefined }))
  signPanel(e, room.onWall(side, along), 0.8, 0.28, mat, 0, y, 0.008, 0, 0.01)
}

interface TheatreSpec {
  /** The table's centre and turn (its head at local −z). */
  table: [number, number, number]
  ortho?: boolean
  /** Light heads: [turn, reach, drop]. */
  heads: [number, number, number][]
  /** The anaesthesia pendant and the surgical pendant: ceiling point, reach, turn. */
  pendants: [number, number, number, number][]
  panel: [Parameters<Room['onWall']>[0], number]
  extra: (e: Parameters<Fitter>[0], room: Room) => void
  info: { title: string; body: string }
}

function theatre(s: TheatreSpec): Fitter {
  return (e, room) => {
    const [tx, tz, tr] = s.table
    // Walls in seamless panelling, the laminar-flow plenum over the table.
    for (const side of ['-x', '+x', '-z', '+z'] as const) {
      if (room.exterior.includes(side) || room.doors.some((d) => d.spec.side === side)) continue
      const [a0, a1] = room.side(side)
      wallPanels(e, room.onWall(side, (a0 + a1) / 2), a1 - a0, room.ceiling)
    }
    laminarPlenum(e, room.at(tx, tz, tr), room.ceiling, 2.4, 2.8)
    // The table and the team's stools.
    const t = room.at(tx, tz, tr)
    operatingTable(e, t, { ortho: s.ortho, draped: !s.ortho })
    room.info(t, {
      title: s.ortho ? 'Orthopaedic Operating Table' : 'Electro-hydraulic Operating Table',
      kind: 'Surgical table',
      body: s.ortho
        ? 'A column operating table with its leg plates exchanged for the orthopaedic traction extension: two boots on adjustable spars and a perineal post for hip and femur surgery under the C-arm, the radiolucent top letting X-rays through.'
        : 'A mobile-column operating table with a radiolucent four-section top on stainless side rails: height, Trendelenburg, lateral tilt and back and leg sections are set from its remote; the base locks to the floor.',
      specs: ['Top height 63–110 cm, load 360 kg', 'Trendelenburg ±30°, lateral tilt ±25°', 'Radiolucent top for C-arm imaging', 'Battery and mains, floor locking'],
    })
    for (const [dx, dz] of [[-0.75, 0.5], [0.75, 0.2]]) roundStool(e, group(t, dx, 0, dz), { saddle: false, ring: true })
    // The lights and pendants.
    const lights = surgicalLights(e, room.at(tx, tz, tr), room.ceiling, s.heads)
    room.info(room.at(tx, tz, tr, room.ceiling - 1.0), { title: 'LED Surgical Lights', kind: 'Ceiling-mounted surgical lighting', body: 'Dome lightheads on spring arms from one ceiling axis, each a field of LED modules giving 160,000 lux of shadow-free, colour-true light at the wound, focused by the sterile handle. The switch is on the surgeon\'s panel.', specs: ['160,000 lux, 4,500 K, Ra 96', 'Adjustable field 20–30 cm', 'Sterilisable handles'] }, [tx, 1.6, tz])
    s.pendants.forEach(([px, pz, reach, turn], i) => {
      const col = otPendant(e, room.at(px, pz), room.ceiling, reach, turn, i === 0 ? e.m.monitors[0] : undefined)
      void col
    })
    // The anaesthesia workstation at the table's head.
    const an = group(t, 0, 0, -1.95)
    anaesthesiaMachine(e, an, e.m.monitors[4] ?? e.m.monitors[0])
    room.info(an, { title: 'Anaesthesia Workstation', kind: 'Anaesthesia delivery system', body: 'The anaesthetist\'s machine at the patient\'s head: oxygen, air and nitrous oxide flowmeters, sevoflurane and isoflurane vaporisers, an electronic ventilator driving the bellows, the CO₂ absorber, and the breathing circuit to the patient, with gas and agent monitoring on its screen.', specs: ['Volume, pressure and SIMV ventilation', 'Low-flow anaesthesia with agent monitoring', 'O₂ and N₂O reserve cylinders on the back'] })
    ivStand(e, group(t, 0.55, 0, -1.2), true)
    suctionUnit(e, group(t, -0.95, 0, -1.4))
    kickBucket(e, group(t, 0.7, 0, 0.9))
    // The surgeon's panel, the X-ray viewer, a recessed instrument cabinet, clock, bins.
    surgeonPanel(e, room.onWall(s.panel[0], s.panel[1]), lights)
    wallClock(e, room.onWall(s.panel[0], s.panel[1] + 1.0), 2.4, 0.3)
    s.extra(e, room)
    room.info(room.at(tx, tz, tr), { title: s.info.title, kind: 'Operation theatre', body: s.info.body, specs: ['Positive pressure, HEPA laminar flow, 20+ air changes an hour', 'Conductive vinyl floor, coved; seamless antibacterial wall panels', 'Medical gases on ceiling pendants: O₂, N₂O, air, vacuum, AGSS', 'IT-isolated power with UPS'] }, [tx, 0.4, tz])
  }
}

const OT1 = theatre({
  table: [8.3, -0.55, 0],
  heads: [[0.4, 0.75, 0.55], [2.6, 0.7, 0.45]],
  pendants: [[6.6, -2.3, 0.55, 0.6], [10.2, 0.6, 0.6, -2.4]],
  panel: ['-x', -0.4],
  info: { title: 'Operation Theatre 1', body: 'General and laparoscopic surgery: the laparoscopy tower and its second monitor stand across the table from the surgeon, the electrosurgical unit and suction at hand, instruments laid out under sterile drapes.' },
  extra: (e, room) => {
    const lt = room.at(10.4, -1.0, -PI / 2)
    lapTower(e, lt, e.m.monitors[3] ?? e.m.monitors[0])
    room.info(lt, { title: 'Laparoscopy Tower', kind: 'Minimally invasive surgery', body: 'The video stack for keyhole surgery: a 4K camera control unit, LED light source, high-flow CO₂ insufflator and recorder, under a 32″ surgical monitor; the CO₂ cylinder rides on its back.', specs: ['4K / 3D camera system', 'Insufflator up to 45 L/min', 'Recording to PACS'] })
    esu(e, room.at(10.5, 1.7, -PI / 2), e.m.monitors[2] ?? e.m.monitors[0])
    instrumentTable(e, room.at(6.3, 0.9, PI / 2), 1.2, 0.6, 2, 3)
    mayoStand(e, room.at(7.45, 1.1, PI), 4)
    cupboard(e, room.onWall('-z', 10.2, 0, 0), 1.1, 2.0, 0.45, { glass: true, fill: 'supplies', label: 'Instrument Cabinet' })
    viewer(e, room.onWall('-x', 1.4), 2, 1.55)
    bins(e, room.onWall('-x', 1.9, 0, 0.25), ['yellow', 'red', 'blue'])
  },
})

const OT2 = theatre({
  table: [3.5, 9.0, PI],
  ortho: true,
  heads: [[2.5, 0.75, 0.5], [-0.6, 0.7, 0.45]],
  pendants: [[2.0, 11.6, 0.5, 2.2], [5.2, 10.8, 0.5, -0.5]],
  panel: ['+x', 12.0],
  info: { title: 'Operation Theatre 2 · Orthopaedics', body: 'The orthopaedic theatre: the table fitted with its traction extension for hips and femurs, a mobile C-arm image intensifier with its monitor cart, the power-tool trolley and implant trays, lead aprons for the team.' },
  extra: (e, room) => {
    const c = room.at(1.4, 8.4, PI / 2)
    cArm(e, c, e.m.monitors[1])
    room.info(c, { title: 'Mobile C-arm', kind: 'Intra-operative X-ray imaging', body: 'A mobile C-arm image intensifier: the X-ray tube and flat-panel detector at the ends of its C swing round the patient on the radiolucent table to show bones and implants live on the twin monitors of its cart.', specs: ['Flat-panel detector 30 × 30 cm', 'Pulsed fluoroscopy, low dose', 'Twin 19″ monitors'] })
    instrumentTable(e, room.at(5.3, 7.6, -PI / 2), 1.2, 0.6, 3, 6)
    mayoStand(e, room.at(4.4, 6.9, 0), 7)
    const pt = room.at(5.3, 10.5, -PI / 2)
    steelTrolley(e, pt)
    room.info(pt, { title: 'Power Tools & Implants Trolley', kind: 'Orthopaedic', body: 'Battery drills, saws and reamers in their sterile cases, and the implant sets for the day\'s cases.' })
    rack(e, room.onWall('-z', 2.2, 0, 0.25), 1.0, 1.9, 0.4, 4, 'supplies')
  },
})

const OT3 = theatre({
  table: [8.7, 9.0, PI],
  heads: [[2.6, 0.75, 0.55], [-0.5, 0.7, 0.45], [1.0, 0.85, 0.65]],
  pendants: [[7.2, 11.6, 0.5, 2.4], [10.5, 10.6, 0.45, -0.3]],
  panel: ['-x', 11.9],
  info: { title: 'Operation Theatre 3 · Major & Specialty', body: 'The largest theatre, for major and specialty surgery: three lightheads, two instrument tables, a patient-warming unit and a large wall display showing the patient\'s imaging during the operation.' },
  extra: (e, room) => {
    instrumentTable(e, room.at(10.75, 8.0, -PI / 2), 1.2, 0.6, 3, 9)
    instrumentTable(e, room.at(10.75, 6.2, -PI / 2), 1.0, 0.55, 2, 12)
    mayoStand(e, room.at(7.2, 7.4, 0), 10)
    esu(e, room.at(6.7, 9.6, PI / 2), e.m.monitors[2] ?? e.m.monitors[0])
    const w = room.onWall('-x', 8.6)
    wallScreen(e, w, 1.4, 1.75, e.o.screen('otPacs', 1024, 576, tokenScreen('PACS · CT Abdomen', [['Series 3', 'Axial 1.25 mm'], ['Series 5', 'Coronal'], ['Lab', 'Hb 11.2 · INR 1.1'], ['Blood', '2 units cross-matched']], 913)))
    room.info(w, { title: 'Surgical Display', kind: 'PACS / integration', body: 'A 55″ medical-grade display on the theatre wall showing the patient\'s imaging, results and the endoscopic or microscope video during the operation.' })
    const warm = room.at(6.75, 11.8, PI / 2)
    drawerCart(e, warm, 0.6, 1.1, 0.55, 3)
    room.info(warm, { title: 'Warming Cabinet', kind: 'Patient warming', body: 'Blankets and IV fluids kept at 37–40 °C to keep the patient warm through a long operation.' })
  },
})

/* ---------- the rest of the complex ---------- */

const corridor: Fitter = (e, room) => {
  for (const [x, n] of [[6.4, 2], [10.4, 2]] as const) {
    const s = room.onWall('-z', x)
    scrubTrough(e, s, n)
    room.info(s, { title: 'Surgical Scrub Station', kind: 'Pre-operative hand antisepsis', body: 'A stainless scrub trough outside the theatres: sensor taps run warm water hands-free while surgeons scrub to the elbows with chlorhexidine for the prescribed minutes, then back through the theatre doors.', specs: ['Infra-red sensor taps, thermostatic', 'Chlorhexidine and povidone dispensers', 'Scrub brushes and nail picks'] })
  }
  clock(e, room.onWall('-z', 8.3), 2.55)
  notice(e, room, '+z', 10.0, 'sterile', 'STERILE ZONE', 'Theatre attire, caps and masks only', true, 2.3)
}

const transfer: Fitter = (e, room) => {
  const { k, m } = e
  // The red line across the doorway, the transfer trolley waiting beyond it.
  k.box(room.group, room.w, 0.003, 0.1, m.red, room.cx, room.y + 0.014, room.z0 + 0.25, false)
  const t = room.at(room.cx, room.z0 + 2.0, 0)
  bed(e, t, { back: 0.1, linen: 'sheet', height: 0.7 })
  room.info(t, { title: 'Transfer Trolley', kind: 'Patient transfer', body: 'Patients arriving from the wards are slid across from their bed onto the theatre\'s own trolley here with a transfer board, so that nothing from outside goes beyond the red line.' })
  notice(e, room, '-x', room.cz + 0.5, 'redline', 'RESTRICTED AREA', 'Beyond the red line: theatre attire only', true)
  handRub(e, room.onWall('+x', room.z0 + 0.6))
}

const preop: Fitter = (e, room) => {
  const t = room.at(12.5, -1.2, -PI / 2)
  bed(e, t, { back: 0.45, linen: 'used', height: 0.7, iv: true })
  room.info(t, { title: 'Pre-operative Trolley', kind: 'Pre-op holding', body: 'Patients are checked in against the surgical safety checklist, consent and site marking verified, cannulated and pre-medicated on these trolleys before going through to theatre.' })
  curtain(e, room.at(room.x0 + 0.05, 0.05, 0), room.w - 0.1, room.ceiling, 0.6)
  vitalsStand(e, room.at(room.x1 - 0.35, -2.8, -PI / 2), e.m.monitors[2])
  const cy = room.at(room.x0 + 0.3, -2.9, 0)
  cylinder(e, cy, 0.09, 1.1, 'in use')
  const d = room.onWall('-x', 0.85, 0, 0.32)
  desk(e, d, 1.0, 0.6, 0)
  computer(e, d, 0, 0.75, -0.08, 0, e.o.his('ot_reception', 'OT List · Surgical Safety Checklist', 'table'))
  deskPhone(e, d, 0.35, 0.75, 0.05)
  room.info(d, { title: 'OT Reception & Nurse Desk', kind: 'Theatre reception', body: 'The day\'s operating list, patient identity and site checks, and the WHO surgical safety checklist begin here.' })
}

const pacu: Fitter = (e, room) => {
  const zs = [-13.9, -11.5, -9.1]
  zs.forEach((z, i) => {
    headwall(e, room.onWall('-x', z), e.m.monitors[i % e.m.monitors.length], false)
    const b = room.onWall('-x', z, 0, 1.15)
    wardBed(e, b, { style: 'icu', back: 0.5, linen: i === 1 ? 'made' : 'used', iv: i !== 1 })
    if (i < 2) curtain(e, room.at(room.x0 + 0.05, z + 1.2, 0), 2.4, room.ceiling, 0.9)
  })
  room.info(room.onWall('-x', zs[0], 0, 1.15), { title: 'Recovery Bay', kind: 'Post-anaesthesia care', body: 'Each recovery bay has a bed-head unit with oxygen, air and suction, a patient monitor on its arm and a nurse within sight until the patient is awake, stable and pain-free enough to return to the ward.', specs: ['ECG, SpO₂, NIBP and capnography', 'Oxygen and suction at every bed', 'Aldrete score before discharge'] })
  const d = room.onWall('+z', 12.4, 0, 0.35)
  desk(e, d, 1.2, 0.6, 0)
  computer(e, d, 0, 0.75, -0.08, 0, e.o.his('pacu', 'PACU Board · Aldrete Scores', 'table'))
  taskChair(e, room.onWall('+z', 12.4, 0, 0.95))
  crashCart(e, room.at(room.x1 - 0.4, -7.0, -PI / 2), e.m.monitors[1])
  room.info(d, { title: 'PACU Nurse Station', kind: 'Recovery nursing', body: 'The recovery nurse watches every bay from here, with the crash cart and defibrillator beside the desk.' })
  void callLink
}

const cssd: Fitter = (e, room) => {
  baseRun(e, room.onWall('-x', -24.3), 2.2, { sink: -0.5, fill: 'none' })
  const wd = room.onWall('-x', -21.6, 0, 0.36)
  drawerCart(e, wd, 0.7, 1.7, 0.7, 2)
  room.info(wd, { title: 'Washer-disinfector', kind: 'CSSD · Cleaning', body: 'Used instruments come in at the dirty door, are rinsed and soaked at the sinks and cleaned in the ultrasonic bath, then washed and thermally disinfected at 93 °C in racks.' })
  const pk = room.at(10.8, -24.6, 0)
  labBench(e, pk, 2.0)
  room.info(pk, { title: 'Inspection & Packing', kind: 'CSSD · Assembly', body: 'Clean instruments are checked under the magnifier, assembled into sets against their lists, wrapped and labelled with the load\'s indicator and expiry.' })
  const ac = room.onWall('+z', 10.9, 0, 0.45)
  autoclave(e, ac)
  room.info(ac, { title: 'Steam Sterilizer', kind: 'CSSD · Sterilisation', body: 'Wrapped sets are sterilised at 134 °C for 4 minutes with pre-vacuum, each load logged with its Bowie-Dick test and indicators.', specs: ['134 °C / 121 °C cycles', 'Load tracking and printout'] })
  rack(e, room.at(13.05, -23.4, -PI / 2), 1.6, 1.9, 0.45, 5, 'supplies')
  notice(e, room, '+z', 9.2, 'dirtyIn', 'DIRTY · IN', 'Used instruments received here', true, 2.35)
}

const sterile: Fitter = (e, room) => {
  rack(e, room.onWall('-x', 6.1, 0, 0.25), 1.8, 2.0, 0.45, 5, 'supplies')
  rack(e, room.onWall('-x', 8.3, 0, 0.25), 1.8, 2.0, 0.45, 5, 'linen')
  steelTrolley(e, room.at(12.9, 9.6, -PI / 2))
  room.info(room.onWall('-x', 6.1, 0, 0.25), { title: 'Sterile Store', kind: 'Sterile supplies', body: 'Sterile instrument sets, drapes and gowns on wire racking, kept at positive pressure and first-in, first-out by expiry.' })
}

const anaesthesia: Fitter = (e, room) => {
  cupboard(e, room.onWall('-z', 1.6), 1.0, 2.0, 0.45, { glass: true, fill: 'medicines', label: 'Anaesthetic Drugs' })
  medFridge(e, room.onWall('-z', 2.9, 0, 0.32), 'Drug Refrigerator · 2–8 °C', 1.4, 0.6)
  baseRun(e, room.onWall('+z', 2.0), 1.6, { fill: 'supplies' })
  const at = room.at(1.4, 3.6, PI / 2)
  drawerCart(e, at, 0.6, 1.0, 0.5, 5)
  room.info(at, { title: 'Difficult Airway Trolley', kind: 'Anaesthesia', body: 'Laryngoscopes, video laryngoscope, bougies, supraglottic airways and the front-of-neck access kit, ready to wheel into any theatre.' })
}

const equipment: Fitter = (e, room) => {
  rack(e, room.onWall('-z', room.cx - 0.5, 0, 0.25), 1.6, 2.0, 0.45, 4, 'supplies')
  for (const [x, kind] of [[room.x1 - 0.3, 'full'], [room.x1 - 0.6, 'full']] as const) cylinder(e, room.at(x, room.z1 - 0.3), 0.09, 1.2, kind)
}

const changing = (female: boolean): Fitter => (e, room) => {
  lockers(e, room.onWall('-x', -23.2, 0, 0.25), 6)
  room.info(room.onWall('-x', -23.2, 0, 0.25), { title: 'Staff Lockers', kind: 'Theatre changing', body: `Surgeons, anaesthetists and theatre staff (${female ? 'women' : 'men'}) leave outdoor clothes here and change into clean scrubs, caps and theatre clogs before entering the semi-restricted zone.` })
  const b = room.at(room.x0 + 1.3, -23.2, PI / 2)
  e.k.box(b, 1.6, 0.04, 0.35, e.o.oak, 0, 0.44, 0)
  for (const s of [-1, 1]) e.k.box(b, 0.04, 0.42, 0.3, e.m.stainless, s * 0.7, 0.22, 0)
  rack(e, room.onWall('+x', -21.6, 0, 0.25), 1.0, 1.9, 0.4, 5, 'linen')
  // WC in its cubicle, the basin, the shower.
  const w = room.onWall('+x', -24.9)
  wcPan(e, w, 0.42, 1.0)
  e.k.box(room.group, 0.03, 2.1, 1.2, e.o.wallTile, room.x1 - 1.25, room.y + 1.05, -24.9 - 0.2)
  const bs = room.onWall('+x', -22.9)
  wallBasin(e, bs, 0.5, 0.82)
  mirror(e, bs, 0.5, 0.7, 1.45, 0.06)
  soapDispenser(e, bs, 0.38, 1.1)
  floorDrain(e, room.at(room.x1 - 0.6, -24.0))
  bins(e, room.at(room.x0 + 0.3, room.z1 - 0.3), ['black'])
}

const dirty: Fitter = (e, room) => {
  baseRun(e, room.onWall('-z', 12.0), 2.0, { sink: 0.5, fill: 'none' })
  handWashPoint(e, room.onWall('-x', -16.0), 0.45)
  bins(e, room.onWall('+z', 12.3, 0, 0.25), ['yellow', 'red', 'blue', 'white'], 'large')
  linenTrolley(e, room.at(12.8, -16.6, -PI / 2))
  room.info(room.onWall('-z', 12.0), { title: 'Dirty Utility', kind: 'Disposal', body: 'Soiled linen, used drapes and biomedical waste leave the theatres here in colour-coded streams, by the staff lift to the disposal yard; instruments go to the CSSD in closed containers.' })
}

const semi: Fitter = (e, room) => {
  const id = room.spec.id
  if (id === 'corridorC1') {
    handRub(e, room.onWall('+z', 6.3))
    notice(e, room, '+z', 9.5, 'semi', 'SEMI-RESTRICTED ZONE', 'Theatre attire only beyond these doors', true, 2.1)
  } else if (id === 'corridorC2') {
    handRub(e, room.onWall('+z', -3.5))
    notice(e, room, '-z', -1.5, 'semiB', 'OPERATION THEATRES', 'Staff changing · CSSD · Recovery', false, 2.1)
  } else {
    crashCart(e, room.at(room.x1 - 0.35, -12.4, -PI / 2), e.m.monitors[1])
    handRub(e, room.onWall('+x', -16.4))
  }
}

const waiting: Fitter = (e, room) => {
  MAIN_CORE.main_lift_lobby(e, room)
  beamSeating(e, room.at(room.x1 - 0.35, room.cz, -PI / 2), 3)
  const w = room.onWall('+x', room.cz)
  wallScreen(e, w, 0.9, 2.15, e.o.screen('otStatus', 1024, 576, tokenScreen('Patient Status', [['OT-1 · 4471', 'In surgery'], ['OT-2 · 4468', 'In recovery'], ['OT-3 · 4475', 'Preparing'], ['PACU · 4463', 'Ready for ward']], 931)))
  room.info(w, { title: 'Patient Status Board', kind: 'Relatives\' information', body: 'Relatives waiting outside the theatres follow their patient by number — preparing, in surgery, in recovery, ready for the ward — and the surgeon comes out to them here.' })
  sharps(e, room.onWall('-x', room.cz + 0.6), 1.2)
}

export const MAIN_THIRD: Record<string, Fitter> = {
  ot_1: OT1,
  ot_2: OT2,
  ot_3: OT3,
  ot_corridor: corridor,
  ot_transfer: transfer,
  ot_preop: preop,
  ot_pacu: pacu,
  ot_cssd: cssd,
  ot_sterile: sterile,
  ot_anaesthesia: anaesthesia,
  ot_equipment: equipment,
  ot_change_m: changing(false),
  ot_change_f: changing(true),
  ot_dirty: dirty,
  ot_semi: semi,
  ot_waiting: waiting,
}
