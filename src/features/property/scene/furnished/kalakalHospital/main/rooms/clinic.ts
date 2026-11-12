import { type Object3D } from 'three'
import { PI } from '../../../kit'
import { examLight } from '../../erEquipment'
import { examCouch, taskChair, visitorChair } from '../../erFurniture'
import { face, group, lathe, put, tube } from '../../erKit'
import type { OpdCtx, Room } from '../../opd/ctx'
import { platformScale } from '../../opd/equipment/common'
import { exhaustGrille, floorDrain, healthFaucet, mirror, pedalBin, robeHook, soapDispenser, towelDispenser, wallBasin, wcPan, handWashPoint } from '../../opd/equipment/sanitary'
import { bins, computer, curtain, desk, deskPhone, papers, poster, printer, sharps, viewer } from '../../opd/furniture'
import type { Fitter } from '../../opd/rooms/types'
import { rubBottle, wallClock } from '../kit'

/*
 * The main block's consultation rooms and its visitors' toilets.
 *
 *   consultation   a doctor's room as hospitals fit them: the desk with the HIS workstation facing
 *                  the patient's and attendant's chairs, the examination couch behind its curtain
 *                  under a mobile examination light, the wall diagnostic set (aneroid BP gauge,
 *                  otoscope and ophthalmoscope in their charger), the X-ray viewer, scales, a
 *                  clinical hand-wash basin, sharps and colour-coded waste.
 *                  G17 off the services hall: the admitting doctor's room (pre-admission
 *                  assessment, consent, admission orders). 121 on the ward, off the relatives'
 *                  lounge: ward rounds' discussions, discharge briefings, review of inpatients.
 *   toilet         a single WC with its health faucet, a basin under its mirror, the dispensers,
 *                  the floor drain and exhaust; outward-opening door.
 */

/**
 * A wall diagnostic set (its back at z = 0, centred at y): the aneroid sphygmomanometer's dial and
 * cuff basket with the coiled hose, and beside it the charger with the otoscope and ophthalmoscope
 * heads on their handles, and the speculum dispenser.
 */
export function diagnosticSet(e: OpdCtx, p: Object3D, y = 1.4) {
  const { k, m } = e
  // The BP gauge: its wall bracket, the dial, the cuff in its basket below, the hose.
  k.box(p, 0.16, 0.22, 0.02, m.whitePlastic, -0.2, y, 0.01)
  put(p, lathe(e, 'bpDial', [[0, 0], [0.075, 0], [0.078, 0.01], [0.075, 0.035], [0, 0.035]], 32), m.whitePlastic, -0.2, y + 0.04, 0.02, false).rotation.x = PI / 2
  face(e, p, 0.13, 0.13, e.o.sign('bpFace', 256, 256, (g, w, h) => {
    g.fillStyle = '#ffffff'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = '#111'
    g.lineWidth = 3
    for (let i = 0; i <= 30; i++) {
      const a = PI * 0.75 + (i / 30) * PI * 1.5
      const r0 = i % 5 ? w * 0.38 : w * 0.33
      g.beginPath()
      g.moveTo(w / 2 + Math.cos(a) * r0, h / 2 + Math.sin(a) * r0)
      g.lineTo(w / 2 + Math.cos(a) * w * 0.43, h / 2 + Math.sin(a) * w * 0.43)
      g.stroke()
    }
    g.strokeStyle = '#c8161d'
    g.lineWidth = 5
    g.beginPath()
    g.moveTo(w / 2, h / 2)
    g.lineTo(w / 2 + Math.cos(PI * 0.9) * w * 0.35, h / 2 + Math.sin(PI * 0.9) * w * 0.35)
    g.stroke()
    g.fillStyle = '#111'
    g.font = `700 ${h * 0.08}px Helvetica`
    g.textAlign = 'center'
    g.fillText('mmHg', w / 2, h * 0.72)
  }), -0.2, y + 0.04, 0.056)
  k.box(p, 0.16, 0.1, 0.08, m.greyPlastic, -0.2, y - 0.16, 0.04)
  k.soft(p, 0.13, 0.08, 0.05, 0.02, m.blue, -0.2, y - 0.13, 0.05)
  put(p, tube(e, 'bpHose', [[-0.2, y - 0.04, 0.05], [-0.26, y - 0.2, 0.07], [-0.18, y - 0.3, 0.07], [-0.16, y - 0.15, 0.06]], 0.004), m.black)
  // The charger and its two instruments, the speculum dispenser.
  k.soft(p, 0.26, 0.12, 0.06, 0.012, m.whitePlastic, 0.12, y + 0.02, 0.03)
  for (const [x, otoscope] of [[0.06, true], [0.18, false]] as const) {
    k.cyl(p, 0.016, 0.016, 0.16, m.charcoal, x, y + 0.08, 0.07, 16)
    if (otoscope) put(p, lathe(e, 'otoHead', [[0, 0], [0.022, 0], [0.012, 0.06], [0.004, 0.065], [0, 0.065]], 16), m.charcoal, x, y + 0.19, 0.07, false).rotation.x = -PI / 2
    else k.soft(p, 0.04, 0.06, 0.03, 0.01, m.charcoal, x, y + 0.19, 0.07)
  }
  k.box(p, 0.08, 0.14, 0.06, m.clearPlastic, 0.12, y - 0.13, 0.03, false)
}

interface ConsultLayout {
  /** The doctor's desk (centre, turn: the doctor sits on its +z side) and the doctor's chair. */
  desk: [number, number, number]
  doctor: [number, number, number]
  /** The patient's and the attendant's chairs. */
  chairs: [number, number, number][]
  /** The couch against a wall, the light beside it, the curtain (x, z, turn, length). */
  couch: [Parameters<Room['onWall']>[0], number]
  light: [number, number, number]
  curtain: [number, number, number, number]
  basin: [Parameters<Room['onWall']>[0], number]
  diag: [Parameters<Room['onWall']>[0], number]
  viewer: [Parameters<Room['onWall']>[0], number]
  waste: [Parameters<Room['onWall']>[0], number]
  scale: [number, number, number]
  clock: [Parameters<Room['onWall']>[0], number]
  poster: [Parameters<Room['onWall']>[0], number, string]
  info: { title: string; kind: string; body: string; specs: string[] }
}

function consultRoom(L: ConsultLayout): Fitter {
  return (e, room) => {
    const d = room.at(L.desk[0], L.desk[1], L.desk[2])
    desk(e, d, 1.4, 0.7, 1)
    computer(e, d, 0.25, 0.75, -0.12, 0, e.o.his(`consult_${room.spec.id}`, 'OPD / IPD · Clinical Notes & e-Prescription', 'form'))
    deskPhone(e, d, -0.5, 0.75, -0.1, 0)
    papers(e, d, -0.15, 0.75, 0.1, 0.2)
    printer(e, d, -0.45, 0.75, -0.15, 0.4)
    taskChair(e, room.at(L.doctor[0], L.doctor[1], L.doctor[2]))
    for (const [x, z, ry] of L.chairs) visitorChair(e, room.at(x, z, ry))
    room.info(d, L.info)
    // The examination couch behind its curtain, the light at its side.
    const c = room.onWall(L.couch[0], L.couch[1], 0, 0.36)
    examCouch(e, c)
    room.info(c, { title: 'Examination Couch', kind: 'Clinical examination', body: 'A two-section couch with an adjustable backrest, a paper roll over its vinyl, a step to climb on; the mobile LED examination light is swung over it, and the curtain on its ceiling track gives the patient privacy.', specs: ['Load 200 kg, height 0.7 m', 'Wipe-clean vinyl, paper roll', 'LED examination light, 50,000 lux at 0.5 m'] })
    examLight(e, room.at(L.light[0], L.light[1], L.light[2]), 0.55)
    curtain(e, room.at(L.curtain[0], L.curtain[1], L.curtain[2]), L.curtain[3], room.ceiling, 0.35)
    // Wall: diagnostic set, X-ray viewer, the hand-wash basin, sharps and waste.
    const ds = room.onWall(L.diag[0], L.diag[1])
    diagnosticSet(e, ds, 1.4)
    room.info(ds, { title: 'Wall Diagnostic Set', kind: 'Examination instruments', body: 'An aneroid sphygmomanometer with adult and large cuffs, and the otoscope and ophthalmoscope on their rechargeable handles in the wall charger, with disposable specula beside.', specs: ['Aneroid gauge ±3 mmHg, calibrated yearly', 'LED otoscope and ophthalmoscope', 'Wall charger, always ready'] }, [ds.position.x, 1.4, ds.position.z])
    viewer(e, room.onWall(L.viewer[0], L.viewer[1]), 2, 1.55)
    handWashPoint(e, room.onWall(L.basin[0], L.basin[1]), 0.5)
    bins(e, room.onWall(L.waste[0], L.waste[1], 0, 0.2), ['yellow', 'red', 'black'])
    sharps(e, room.onWall(L.waste[0], L.waste[1]), 1.3)
    platformScale(e, room.at(L.scale[0], L.scale[1], L.scale[2]))
    wallClock(e, room.onWall(L.clock[0], L.clock[1]), 2.3, 0.28)
    poster(e, room.onWall(L.poster[0], L.poster[1]), L.poster[2], '#1c3966', 0.42, 0.6, 1.6)
  }
}

/** G17: the admitting doctor's room off the services hall (x 2.96 … 5.42, z −14.34 … −10.06). */
const consultG = consultRoom({
  desk: [4.35, -11.2, PI / 2],
  doctor: [4.98, -11.2, -PI / 2],
  chairs: [[3.5, -11.55, PI / 2], [3.5, -10.85, PI / 2]],
  couch: ['+x', -13.25],
  light: [4.1, -12.5, PI / 2],
  curtain: [4.45, -13.25, -PI / 2, 2.1],
  basin: ['+z', 4.95],
  diag: ['+x', -12.0],
  viewer: ['+x', -11.0],
  waste: ['+z', 3.3],
  scale: [3.3, -12.75, 0],
  clock: ['-x', -11.0],
  poster: ['-x', -11.9, 'Patient Rights & Responsibilities'],
  info: {
    title: 'Admission Consultation Room', kind: 'Doctor\'s consultation · Admissions',
    body: 'Where the admitting doctor sees a patient before admission: history and examination on the couch, the admission diagnosis and orders, the estimate and the consent for treatment explained to the family, then the patient goes up to the ward with their file.',
    specs: ['Doctor\'s workstation on the HIS with e-prescription', 'Examination couch with privacy curtain', 'Clinical hand-wash basin', 'Wall BP set, otoscope, ophthalmoscope, scales'],
  },
})

/** 121: the ward's consultation room behind the nurses' station (x 5.54 … 10.0, z 1.06 … 3.94). */
const consultWard = consultRoom({
  desk: [6.6, 2.6, -PI / 2],
  doctor: [5.98, 2.6, PI / 2],
  chairs: [[7.45, 2.25, -PI / 2], [7.45, 2.95, -PI / 2]],
  couch: ['-z', 8.95],
  light: [7.85, 1.6, PI / 2],
  curtain: [8.95, 2.15, 0, 2.05],
  basin: ['+x', 2.75],
  diag: ['-z', 7.2],
  viewer: ['-x', 2.6],
  waste: ['-x', 1.6],
  scale: [7.55, 3.55, 0],
  clock: ['+z', 7.0],
  poster: ['-z', 6.2, 'Early Warning Score (NEWS2)'],
  info: {
    title: 'Doctor\'s Consultation Room', kind: 'Ward consultation & counselling',
    body: 'The ward\'s consultation room, off the relatives\' lounge: consultants review inpatients and their imaging here, examine a patient away from a shared room, and explain the diagnosis, the operation and its consent, and the discharge plan to the family in private.',
    specs: ['Doctor\'s workstation with PACS viewing', 'Examination couch with curtain and light', 'Clinical hand-wash basin', 'Wall BP set, otoscope, ophthalmoscope, scales'],
  },
})

/** A single WC for visitors: the pan and its health faucet, the basin under its mirror, dispensers. */
const visitorToilet: Fitter = (e, room) => {
  const w = room.onWall('-z', room.x0 + 0.55)
  wcPan(e, w, 0.42, 1.0)
  healthFaucet(e, w, 0.3)
  const roll = group(w, -0.38, 0.7, 0)
  e.k.box(roll, 0.14, 0.12, 0.08, e.m.whitePlastic, 0, 0, 0.04)
  pedalBin(e, room.at(room.x0 + 0.2, room.z1 - 0.3))
  const b = room.onWall('+x', room.cz)
  wallBasin(e, b, 0.5, 0.8)
  mirror(e, b, 0.5, 0.7, 1.45, 0.04)
  soapDispenser(e, b, 0.36, 1.12)
  towelDispenser(e, b, -0.45, 1.25)
  robeHook(e, room.onWall('-x', room.cz), 0, 1.6)
  floorDrain(e, room.at(room.cx + 0.2, room.cz))
  exhaustGrille(e, room.at(room.cx, room.cz), room.ceiling, 0.25)
  rubBottle(e, room.onWall('+z', room.x0 + 0.5), 1.2)
  room.info(w, { title: 'Visitors\' Toilet', kind: 'Public toilet', body: 'A single toilet for visitors and attendants: an Indian-style health faucet beside the WC, a wash basin with a sensor tap and soap under the mirror, paper towels, and an outward-opening door with an engaged indicator.', specs: ['Anti-skid floor tiles to a floor drain', 'Wall tiles to 2.1 m', 'Exhaust fan, 10 air changes an hour'] }, [room.cx, 1.0, room.cz])
}

export const MAIN_CLINIC: Record<string, Fitter> = {
  main_consult: consultG,
  ward_consult: consultWard,
  ward_visitor_toilet: visitorToilet,
}
