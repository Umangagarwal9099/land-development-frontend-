import type { Material, Object3D } from 'three'
import { PI } from '../../../kit'
import { bentTube, group, put, rod, signPanel } from '../../erKit'
import { bed, crashCart, cylinder, examCouch, taskChair, visitorChair, wheelchair } from '../../erFurniture'
import { gasPanel, ivStand, patientMonitor } from '../../erEquipment'
import type { OpdCtx, Room } from '../ctx'
import { echoCouch, echoImage, echoMachine, ecgMachine, ecgTrace, stressSystem, treadmill } from '../equipment/cardiac'
import { coilCart, consoleDesk, ctGantry, ctTable, emergencyStop, imagingMats, injector, keyboard, monitor, mouse, mriMagnet, mriTable, pacsDesk, rfMesh, wallStop } from '../equipment/imaging'
import {
  basin, bins, bpMonitor, clock, cupboard, curtain, desk, dressingSupplies, gloveBox, injectionTrolley, lockers, oxygenTrolley, papers, poster, printer, rack, sharps,
  stethoscope, stool, wallScreen,
} from '../furniture'
import { board, NAVY, radiation } from '../paints'
import { bloodTube, syringe } from '../equipment/items'
import type { Fitter } from './types'

/*
 * The third floor: advanced imaging and cardiac diagnostics. The MRI suite across the back (the
 * screening and changing room in zone II off the back corridor, the technical room, the magnet room
 * in zone IV with its control room looking along the table), the CT suite on the south side over
 * the X-ray suite below (the control room looking down the table into the gantry), the cardiac
 * rooms down the north side, the CT preparation room and the radiologists' reporting room at the
 * front.
 */

/* ---------- small pieces of this floor ---------- */

/** A sign plate on a wall group, w × h, navy or white, at height y. */
function plate(e: OpdCtx, p: Object3D, key: string, w: number, h: number, y: number, lines: [string, number, string, number?][], bg = NAVY) {
  signPanel(e, p, w, h, e.o.sign(`t3_${key}`, 512, Math.round((512 * h) / w), board(bg, lines)), 0, y, 0.008, 0, 0.012)
}

/** The ionising radiation warning, on a wall group, centred at y. */
function radiationSign(e: OpdCtx, p: Object3D, y = 1.6) {
  signPanel(e, p, 0.32, 0.4, e.o.sign('radiation', 320, 400, radiation(['CAUTION', 'X-RAY RADIATION', 'Pregnant women: inform staff'])), 0, y, 0.008, 0, 0.006)
}

/** Blinds an outside window run with a lining: lead-lined (CT) or RF-shielded (MRI), from the floor to the ceiling. */
function lineFacade(e: OpdCtx, r: Room, side: '-x' | '-z') {
  const { k, m } = e
  const h = r.ceiling
  if (side === '-z') k.box(r.group, r.w, h, 0.05, m.paint, r.cx, r.y + h / 2, r.z0 + 0.025, false)
  else k.box(r.group, 0.05, h, r.d, m.paint, r.x0 + 0.025, r.y + h / 2, r.cz, false)
}

/** Lead aprons and thyroid collars hung on a wall rail. */
function apronRack(e: OpdCtx, p: Object3D, n = 3) {
  const { k, m } = e
  k.box(p, 0.25 + n * 0.3, 0.04, 0.05, m.stainless, 0, 1.75, 0.03)
  const cols: Material[] = [m.blue, m.purple, e.o.navy]
  for (let i = 0; i < n; i++) {
    const x = -((n - 1) * 0.3) / 2 + i * 0.3
    k.cyl(p, 0.008, 0.008, 0.12, m.stainless, x, 1.75, 0.08, 8).rotation.x = PI / 2
    k.soft(p, 0.5, 0.9, 0.05, 0.03, cols[i % 3], x, 1.28, 0.12)
    k.soft(p, 0.16, 0.12, 0.04, 0.02, cols[(i + 1) % 3], x, 1.72, 0.16)
  }
}

/** Floor marking: a closed line of `w` wide tape round the rectangle x0..x1, z0..z1. */
function floorLine(e: OpdCtx, r: Room, x0: number, x1: number, z0: number, z1: number, mat: Material, w = 0.05) {
  const { k } = e
  const y = r.y + 0.0135
  k.box(r.group, x1 - x0, 0.002, w, mat, (x0 + x1) / 2, y, z0, false)
  k.box(r.group, x1 - x0, 0.002, w, mat, (x0 + x1) / 2, y, z1, false)
  k.box(r.group, w, 0.002, z1 - z0, mat, x0, y, (z0 + z1) / 2, false)
  k.box(r.group, w, 0.002, z1 - z0, mat, x1, y, (z0 + z1) / 2, false)
}

/**
 * An equipment cabinet of the MRI's technical room, 0.6 wide × 2.0 high × 0.8 deep: the steel
 * carcass on its plinth, the perforated front door with its swing handle and the status panel's
 * LEDs, the vented roof, its label.
 */
function techCabinet(e: OpdCtx, p: Object3D, label: string, leds: number) {
  const { k, m } = e
  const im = imagingMats(e)
  k.box(p, 0.58, 0.08, 0.76, im.dark, 0, 0.04, -0.4)
  k.soft(p, 0.6, 1.92, 0.8, 0.008, im.grey, 0, 1.04, -0.4)
  const perf = e.o.sign('cabinetPerf', 128, 256, (c, w, h) => {
    c.fillStyle = '#9aa1a8'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#2a2e33'
    for (let y = 6; y < h; y += 7) for (let x = 5 + ((y / 7) % 2) * 3; x < w; x += 7) c.fillRect(x, y, 3, 3)
  }, 0.55)
  k.box(p, 0.54, 1.6, 0.004, perf, 0, 0.98, 0.003, false)
  k.box(p, 0.56, 0.22, 0.006, im.dark, 0, 1.9, 0.003, false)
  for (let i = 0; i < leds; i++) k.box(p, 0.01, 0.01, 0.004, i % 5 === 4 ? im.amber : im.green, -0.22 + (i % 10) * 0.045, 1.95 - Math.floor(i / 10) * 0.035, 0.008, false)
  k.box(p, 0.02, 0.18, 0.03, m.stainless, 0.24, 1.1, 0.018)
  for (let i = 0; i < 6; i++) k.box(p, 0.5, 0.004, 0.02, im.reveal, 0, 2.0, -0.7 + i * 0.12, false)
  k.box(p, 0.4, 0.06, 0.003, e.o.sign(`techlabel_${label}`, 256, 40, board('#ffffff', [[label, 0.56, '#1c2733']])), 0, 1.76, 0.008, false)
}

/** A phlebotomy-style cannulation chair: padded seat and back, two height-adjustable arm boards. */
function cannulationChair(e: OpdCtx, p: Object3D) {
  const { k, m } = e
  k.soft(p, 0.6, 0.4, 0.55, 0.04, e.m.powder, 0, 0.2, 0)
  k.soft(p, 0.56, 0.1, 0.55, 0.04, m.vinylSeat, 0, 0.47, 0.02)
  const back = k.soft(p, 0.56, 0.75, 0.1, 0.04, m.vinylSeat, 0, 0.88, -0.26)
  back.rotation.x = -0.18
  for (const s of [-1, 1]) {
    k.box(p, 0.04, 0.25, 0.04, m.powder, s * 0.34, 0.6, 0.1)
    k.soft(p, 0.14, 0.06, 0.55, 0.025, m.vinylSeat, s * 0.36, 0.74, 0.2)
  }
}

/* ---------- the MRI suite ---------- */

const mri: Fitter = (e, r) => {
  const { m } = e
  // The outside window behind the RF cage's lining.
  lineFacade(e, r, '-z')
  // The magnet, its bore along x, the patient table out towards the control room's window.
  const cz = -23.35
  const mag = r.at(3.75, cz, PI / 2)
  mriMagnet(e, mag, r.ceiling)
  r.info(mag, {
    title: '1.5 T MRI Scanner',
    kind: 'Diagnostic imaging · Magnetic resonance',
    body: 'A whole-body superconducting magnetic resonance scanner: the magnet is always on, cooled by liquid helium in a sealed cryostat, so the room is entered only after screening. The patient lies on the docked table and is driven into the 70 cm bore; images of the brain, spine, joints, abdomen and heart are built from radio signals, with no ionising radiation.',
    specs: ['Field strength 1.5 T, superconducting, zero helium boil-off', '70 cm open bore, 1.6 m short magnet', 'Gradients 45 mT/m, slew rate 200 T/m/s', 'Up to 64 receive channels', 'Quench vent to the roof; 5-gauss line marked on the floor', 'Patient communication: intercom, display and squeeze-ball alarm'],
  }, [5.0, 1.1, cz])
  const tab = r.at(3.75, cz, PI / 2)
  mriTable(e, tab)
  r.info(tab, {
    title: 'MRI Patient Table',
    kind: 'MRI · Patient handling',
    body: 'The docking patient table: the cradle lowers to 52 cm for a patient to sit on, rises to the bore and drives in at the touch of a key. Coils plug into sockets in the tabletop; the head coil stands on it now, with a foam knee wedge for comfort.',
    specs: ['Maximum patient weight 250 kg', 'Cradle travel 2.3 m, lowest height 52 cm', 'Detachable for evacuation on a trolley', '16-channel head and neck coil fitted'],
  })
  // The 5-gauss line round the magnet: red tape; the zone sign inside the door.
  floorLine(e, r, 2.1, 6.0, -25.2, -21.5, m.red, 0.06)
  const coil = r.at(6.6, r.z0 + 0.32, 0)
  coilCart(e, coil)
  r.info(coil, {
    title: 'MRI Coil Cart',
    kind: 'MRI · Accessories (MR-conditional)',
    body: 'The receive coils that sit close to the part being scanned, kept on a non-magnetic trolley: a flexible body array, knee and shoulder coils, a spare head coil and the foam positioning pads and wedges.',
    specs: ['Body, spine, head-neck, knee and shoulder coils', 'Aluminium trolley, MR-conditional', 'Positioning pads in washable vinyl'],
  })
  // The RF cage shows at the door and the window: copper fingers round the door's frame, the
  // copper mesh in the control room's window, the waveguide panel on the technical room's wall.
  const door = r.onWall('+z', 8.3)
  for (const s of [-1, 1]) e.k.box(door, 0.05, 2.3, 0.02, imagingMats(e).copper, s * 0.68, 1.15, 0.01)
  e.k.box(door, 1.41, 0.05, 0.02, imagingMats(e).copper, 0, 2.3, 0.01)
  rfMesh(e, r.onWall('+x', -23.45), 2.88, 1.08, 1.45, 0.012)
  const wg = r.onWall('-x', -21.55)
  e.k.box(wg, 0.7, 0.9, 0.012, imagingMats(e).copper, 0, 1.75, 0.006)
  for (let i = 0; i < 3; i++) e.k.cyl(wg, 0.035, 0.035, 0.18, e.m.stainless, -0.2 + i * 0.2, 1.95, 0.09, 20).rotation.x = PI / 2
  for (let i = 0; i < 4; i++) e.k.soft(wg, 0.1, 0.06, 0.05, 0.01, imagingMats(e).grey, -0.24 + i * 0.16, 1.5, 0.03)
  r.info(wg, {
    title: 'RF Waveguide Panel',
    kind: 'MRI · RF shielding',
    body: 'Where services cross the copper cage into the magnet room: waveguide tubes for the chilled water and gases and the patient-monitoring fibre, sized so no radio frequency can pass, with the filtered connector blocks for the coils and the room\'s lights.',
    specs: ['Copper RF cage, ≥ 100 dB at 64 MHz', 'Waveguides for water, gases and fibre', 'Filtered DC lighting in the room'],
  })
  // An MR-conditional IV pole and wheelchair, kept inside the room.
  ivStand(e, r.at(6.4, -22.0, 0.4), false)
  wheelchair(e, r.at(5.2, r.z1 - 0.45, PI))
  // The in-room monitor, and the zone IV signs.
  const wall = r.onWall('+z', 4.6)
  wallScreen(e, wall, 0.75, 2.0, e.o.his('mriRoomScreen', 'MR · Sequence', 'image'))
  const sign = r.onWall('+z', 6.9)
  plate(e, sign, 'zone4', 0.6, 0.3, 1.65, [['MRI ZONE IV', 0.3, '#ffffff'], ['Magnet is always on', 0.16, '#ffd45a', 500]], '#c8161d')
  // A cupboard of linen and pads by the window.
  cupboard(e, r.onWall('-z', 8.6, 0, 0.05 + 0.5), 0.9, 1.8, 0.5, { fill: 'linen', label: 'Linen Cupboard' })
  bins(e, r.onWall('-x', -21.3, 0, 0.25), ['yellow', 'black'])
}

const mriControl: Fitter = (e, r) => {
  const { m } = e
  const win = -23.45
  const desk = r.onWall('-x', win, 0, 0.42)
  consoleDesk(e, desk, 2.4, [e.o.his('mriAcq', 'MR Acquisition · Brain', 'image'), e.o.his('mriView', 'MR Viewer · Sag T1', 'image'), e.o.his('mriPlan', 'Exam Card', 'table')], { stop: true })
  r.info(desk, {
    title: 'MRI Operator Console',
    kind: 'MRI · Control',
    body: 'Where the radiographer plans and runs the scan, looking through the RF-shielded window along the table: the acquisition screen with the sequences queued, the image viewer, the exam card; the intercom to speak to the patient in the bore, and the red emergency stop that cuts the gradients and the table.',
    specs: ['Acquisition and reconstruction workstations', 'Two-way patient intercom with music', 'Emergency stop; separate magnet quench button by the door', 'RF-shielded viewing window with copper mesh'],
  }, [r.x0 + 1.0, 1.0, win])
  taskChair(e, r.at(r.x0 + 1.15, win - 0.4, -PI / 2))
  taskChair(e, r.at(r.x0 + 1.25, win + 0.6, -PI / 2 + 0.3))
  // The patient-monitoring display (MR-conditional monitor's remote screen) on the wall beside the window.
  const pm = r.onWall('-x', -21.35, 1.55)
  patientMonitor(e, pm, m.monitors[2], 0.3)
  r.info(pm, {
    title: 'MR Patient Monitoring Display',
    kind: 'MRI · Physiological monitoring',
    body: 'The remote display of the MR-conditional patient monitor in the magnet room: ECG, oxygen saturation, blood pressure and respiration of the patient in the bore, with alarms, for sedated and cardiac patients.',
    specs: ['Wireless ECG and SpO₂ from the bore', 'NIBP and respiration', 'Alarms at the console'],
  })
  // The second (reporting) workstation under the outside window.
  const rep = r.onWall('+x', -23.6, 0, 0.42)
  consoleDesk(e, rep, 1.5, [e.o.his('mriReport', 'PACS · MR Spine', 'image'), e.o.his('mriRis', 'RIS · Worklist', 'table')], { intercom: false })
  taskChair(e, r.at(r.x1 - 1.1, -23.6, PI / 2))
  // A rack of MR-safe items (pads, earplugs, headphones) by the door; the guarded magnet stop.
  rack(e, r.onWall('+z', 10.2, 0, 0.45), 1.0, 1.8, 0.45, 4, 'supplies')
  plate(e, r.onWall('+z', 10.2), 'mrsafe', 0.5, 0.2, 2.0, [['MR SAFE ITEMS ONLY', 0.34, '#ffffff']], '#1f9d55')
  const quench = r.onWall('+z', 13.05)
  wallStop(e, quench, 1.55, 'MAGNET STOP', true)
  r.info(quench, {
    title: 'Magnet Stop (Quench) Button',
    kind: 'MRI · Safety',
    body: 'Under its clear guard, the button that ramps the magnet down in seconds by venting the helium through the quench pipe to the roof: only to free someone pinned by a metal object. The scanner\'s ordinary emergency stop is on the console.',
    specs: ['Guarded, separate from the emergency stop', 'Helium vented through the quench pipe'],
  })
  rfMesh(e, r.onWall('-x', -23.45), 2.88, 1.08, 1.45, 0.012)
}

const mriTech: Fitter = (e, r) => {
  const { k, m } = e
  const im = imagingMats(e)
  // System cabinets along the inner wall: gradient and RF amplifiers, the system and reconstruction.
  const labels: [string, number][] = [['GRADIENT AMPLIFIER', 16], ['RF AMPLIFIER', 12], ['SYSTEM CABINET', 24], ['RECONSTRUCTOR', 20]]
  labels.forEach(([label, leds], i) => {
    const c = r.onWall('-x', r.z0 + 0.45 + i * 0.66, 0, 0.8)
    techCabinet(e, c, label, leds)
    if (i === 0) r.info(c, {
      title: 'MRI System Cabinets',
      kind: 'MRI · Technical room',
      body: 'The electronics that drive the magnet from outside the shielded room: the gradient amplifiers that switch the field for each image line, the RF amplifier that transmits the pulses, the system control and the image reconstruction computer. They run on the hospital\'s backed-up supply and are cooled by chilled water.',
      specs: ['Gradient power amplifier, water-cooled', 'RF power amplifier, 35 kW peak', 'Image reconstructor, GPU-accelerated', 'Signals pass to the magnet through the RF filter panel'],
    })
  })
  // The helium compressor and the chiller, its cold-head lines going up into the ceiling.
  const comp = r.at(0.9, r.z0 + 0.45, 0)
  k.soft(comp, 0.7, 1.2, 0.55, 0.03, im.shell, 0, 0.6, 0)
  for (let i = 0; i < 6; i++) k.box(comp, 0.5, 0.01, 0.004, im.dark, 0, 0.3 + i * 0.1, 0.276, false)
  k.box(comp, 0.14, 0.06, 0.004, e.o.screen('heliumGauge', 96, 48, (g, w, h) => {
    g.fillStyle = '#04120a'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#4bff72'
    g.font = `700 ${h * 0.4}px Helvetica`
    g.fillText('He 98 %', 4, h * 0.65)
  }, 1.0), 0.18, 1.05, 0.277, false)
  for (const x of [-0.15, 0.0]) put(comp, bentTube(e, `heLine${x}`, [[0, 1.2, 0], [0, 2.6, 0], [0, 2.75, 0.4]], 0.02, 0.15), e.m.stainless, x, 0, 0.0)
  r.info(comp, {
    title: 'Helium Compressor & Chiller',
    kind: 'MRI · Cryogenics',
    body: 'Keeps the magnet\'s cold head running so the liquid helium in the cryostat never boils off: the compressor sends high-pressure helium gas to the cold head through the flexible lines overhead; the chiller cools the compressor and the gradient coils.',
    specs: ['Water-cooled helium compressor, 9 kW', 'Cold-head lines to the magnet', 'Chiller with standby circuit'],
  })
  // The RF filter (penetration) panel on the wall shared with the magnet room.
  const pen = r.onWall('+x', -23.4, 0)
  k.box(pen, 0.9, 1.1, 0.04, e.o.copper, 0, 1.6, 0.02)
  for (let i = 0; i < 12; i++) k.soft(pen, 0.1, 0.07, 0.06, 0.01, im.grey, -0.33 + (i % 6) * 0.13, 1.35 + Math.floor(i / 6) * 0.45, 0.07)
  for (let i = 0; i < 3; i++) k.cyl(pen, 0.04, 0.04, 0.15, e.m.stainless, -0.25 + i * 0.25, 1.9, 0.09, 16).rotation.x = PI / 2
  r.info(pen, {
    title: 'RF Penetration Panel',
    kind: 'MRI · RF shielding',
    body: 'The only way through the copper cage round the magnet room: every cable passes through a filter here and the cooling lines through waveguides, so no outside radio noise reaches the scanner\'s receivers.',
    specs: ['Copper RF cage, ≥ 100 dB attenuation', 'Feed-through filters and waveguides'],
  })
  // UPS rack by the door; cable trays overhead.
  const ups = r.onWall('+x', r.z1 - 0.7, 0, 0.75)
  techCabinet(e, ups, 'UPS 60 kVA', 8)
  k.box(r.group, 0.3, 0.06, r.d - 0.3, m.galvanised, r.cx - 0.3, r.y + 2.75, r.cz, false)
  for (let i = 0; i < 5; i++) rod(e, r.group, 0.012, r.d - 0.4, m.black, r.cx - 0.42 + i * 0.06, r.y + 2.79, r.cz, 'z', 6)
  plate(e, r.onWall('+z', r.x0 + 0.5), 'techOnly', 0.5, 0.2, 1.7, [['AUTHORISED PERSONNEL ONLY', 0.28, '#c8161d']], '#ffffff')
}

const mriScreening: Fitter = (e, r) => {
  const { k, m } = e
  // The screening desk by the door: the questionnaire, the computer, the handheld detector.
  const dk = r.onWall('-x', -22.5, 0, 0.42)
  consoleDesk(e, dk, 1.2, [e.o.his('mriScreen', 'MRI Safety Screening', 'form')], { intercom: false })
  papers(e, dk, -0.35, 0.75, 0.15, 0.2)
  const wand = group(dk, 0.35, 0.755, 0.2, 0.4)
  k.soft(wand, 0.06, 0.03, 0.36, 0.012, m.darkPlastic, 0, 0.015, 0)
  k.soft(wand, 0.1, 0.03, 0.1, 0.02, m.vacuum, 0, 0.02, -0.2)
  r.info(wand, {
    title: 'Ferromagnetic Detector (Handheld)',
    kind: 'MRI safety · Screening',
    body: 'Run over every patient and companion before they pass into zone III: it sounds for ferromagnetic metal (hairpins, keys, implants) that the magnet would pull, alongside the written screening questionnaire for implants, pacemakers and pregnancy.',
    specs: ['Detects ferromagnetic objects only', 'Used with the MRI safety questionnaire'],
  })
  taskChair(e, r.at(r.x0 + 1.15, -22.5, -PI / 2))
  visitorChair(e, r.at(r.x0 + 1.4, -21.6, -PI / 2 - 0.4))
  // Lockers for everything metal, along the wall shared with the technical room.
  lockers(e, r.onWall('+x', -24.0, 0, 0.5), 4)
  poster(e, r.onWall('+x', -22.2), 'MRI safety zones I–IV', '#c8161d', 0.45, 0.62, 1.55)
  // The changing cubicle in the window corner, its curtain half drawn; a bench, gowns.
  const cx0 = r.x0
  const cubicle = r.at(cx0, -24.45, 0)
  curtain(e, cubicle, 1.3, r.ceiling, 0.55)
  k.box(r.group, 0.35, 0.05, 1.0, e.o.oak, r.x0 + 0.2, r.y + 0.45, -25.1)
  for (const s of [-1, 1]) k.box(r.group, 0.3, 0.43, 0.04, m.powder, r.x0 + 0.2, r.y + 0.215, -25.1 + s * 0.42)
  cupboard(e, r.onWall('+x', -21.4, 0, 0.45), 0.8, 1.8, 0.45, { glass: true, fill: 'linen', label: 'Gown Cupboard' })
  bins(e, r.onWall('+z', -1.8, 0, 0.2), ['black'])
}

/* ---------- the CT suite ---------- */

const ct: Fitter = (e, r) => {
  // The outside windows behind the room's lead lining.
  lineFacade(e, r, '-x')
  // The gantry facing the control room's window, the table running from it towards the window.
  const gx = r.cx - 0.05
  const gz = -11.65
  const gan = r.at(gx, gz, 0)
  ctGantry(e, gan)
  r.info(gan, {
    title: '64-slice CT Scanner',
    kind: 'Diagnostic imaging · Computed tomography',
    body: 'A multislice CT scanner: an X-ray tube and a curved detector spin round the patient inside the gantry while the table moves through it, building cross-sectional images of the whole body in seconds. Red lasers mark the scan plane; the display counts down the breath-hold.',
    specs: ['64 detector rows, 0.625 mm slices', '80 cm gantry aperture', 'Rotation time 0.35 s', '100 kW generator, 80–140 kV', 'Iterative dose-reduction reconstruction', 'Lead-lined walls and door; lead-glass window'],
  }, [gx, 1.1, gz + 0.7])
  const tab = r.at(gx, gz, 0)
  ctTable(e, tab)
  r.info(tab, {
    title: 'CT Patient Table',
    kind: 'CT · Patient handling',
    body: 'The motorised table that carries the patient through the gantry: it lowers for transfer from a trolley and moves in fine steps during the scan. The carbon-fibre cradle lets X-rays through; the head holder and knee support keep the patient still.',
    specs: ['Maximum load 227 kg', 'Scannable range 2.0 m', 'Lowest height 48 cm for transfer', 'Carbon-fibre cradle'],
  })
  // The contrast injector beside the table, near the gantry.
  const inj = r.at(r.x0 + 0.55, -10.35, PI / 2)
  injector(e, inj)
  r.info(inj, {
    title: 'Contrast Power Injector',
    kind: 'CT · Contrast delivery',
    body: 'Injects iodinated contrast followed by a saline flush through the patient\'s cannula at a programmed rate, timed with the scan, so the arteries and organs show bright in the images. Its warmer keeps the contrast at body temperature.',
    specs: ['Dual syringe: contrast 200 ml, saline 200 ml', 'Flow 0.1–10 ml/s, pressure limited', 'Syringe heater at 37 °C', 'Synchronised with the scanner'],
  })
  // Oxygen and suction at the table's head, lead aprons by the door, the radiation signs.
  gasPanel(e, r.onWall('-x', -12.4))
  apronRack(e, r.onWall('+x', -12.5))
  radiationSign(e, r.onWall('+x', -10.6), 1.6)
  radiationSign(e, r.onWall('-z', r.cx), 1.8)
  // Positioning pads and supplies behind the gantry.
  cupboard(e, r.onWall('-z', r.x1 - 0.6, 0, 0.5), 0.9, 1.8, 0.5, { fill: 'supplies', label: 'Supplies Cupboard' })
  bins(e, r.onWall('+x', -9.6, 0, 0.2), ['yellow', 'red'])
  sharps(e, r.onWall('-x', -9.0), 1.2)
}

const ctControl: Fitter = (e, r) => {
  const { k } = e
  const desk = r.onWall('-z', -9.95, 0, 0.42)
  consoleDesk(e, desk, 2.6, [e.o.his('ctAcq', 'CT Acquisition · Chest', 'image'), e.o.his('ctRecon', 'CT Recon · Axial', 'image'), e.o.his('ctRis', 'RIS · Worklist', 'table')], { stop: true })
  r.info(desk, {
    title: 'CT Operator Console',
    kind: 'CT · Control',
    body: 'From here the radiographer selects the protocol, positions the scan on the scout image, starts the exposure and watches the patient through the lead-glass window; the reconstructed slices appear within seconds and go to PACS.',
    specs: ['Acquisition and reconstruction workstations', 'Dose report for every exam', 'Intercom and automatic breathing instructions', 'Emergency stop'],
  }, [-9.95, 1.0, r.z0 + 1.0])
  // The injector's control unit on the desk's end.
  const iu = group(desk, -1.05, 0.75, -0.15, 0.3)
  k.soft(iu, 0.28, 0.2, 0.06, 0.02, imagingMats(e).shell, 0, 0.12, 0)
  k.box(iu, 0.24, 0.15, 0.004, e.o.screen('injCtl', 160, 96, (g, w, h) => {
    g.fillStyle = '#0d2747'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#ffffff'
    g.font = `700 ${h * 0.18}px Helvetica`
    g.fillText('ARMED', w * 0.06, h * 0.28)
    g.fillStyle = '#7fd0ff'
    g.fillText('A 80 ml · B 40 ml', w * 0.06, h * 0.58)
  }, 0.95), 0, 0.12, 0.032, false)
  taskChair(e, r.at(-10.6, r.z0 + 1.15, PI + 0.15))
  taskChair(e, r.at(-9.2, r.z0 + 1.25, PI - 0.2))
  // Printer and records on a low cupboard by the outside wall.
  const side = r.onWall('-x', -4.6, 0, 0.5)
  cupboard(e, side, 0.9, 0.85, 0.5, { fill: 'files', label: 'Cupboard', top: e.m.solidSurface })
  printer(e, side, 0, 0.87, -0.25)
  apronRack(e, r.onWall('+z', -10.4), 2)
  emergencyStop(e, r.onWall('+x', -5.6, 1.35), 0, 0, 0.05)
}

const ctPrep: Fitter = (e, r) => {
  const { m } = e
  // The recovery trolley along the inner wall, oxygen and suction at its head.
  const tr = r.at(r.x1 - 0.5, 0.95, 0)
  bed(e, tr, { back: 0.35, linen: 'made', height: 0.72, railsDown: true })
  r.info(tr, {
    title: 'Recovery Trolley',
    kind: 'CT preparation · Patient care',
    body: 'Where patients rest before and after a contrast scan and are watched for any reaction to the contrast: a height-adjustable trolley with side rails, oxygen and suction at its head.',
    specs: ['Hydraulic height 56–90 cm', 'Backrest and Trendelenburg tilt', 'Oxygen and vacuum outlets at the wall'],
  })
  gasPanel(e, r.onWall('+x', -0.35))
  ivStand(e, r.at(r.x1 - 0.95, -0.25, 0.5))
  // The cannulation chair, the contrast warmer, the crash cart along the outer wall.
  const ch = r.at(r.x0 + 0.42, 0.75, PI / 2)
  cannulationChair(e, ch)
  r.info(ch, {
    title: 'Cannulation Chair',
    kind: 'CT preparation',
    body: 'A padded chair with arm boards at both sides, where a cannula is placed in the arm for the contrast injection and blood creatinine is checked beforehand.',
    specs: ['Height-adjustable arm boards', 'Wipe-clean vinyl'],
  })
  const trolley = r.at(r.x0 + 0.95, -0.05, 0.4)
  injectionTrolley(e, trolley)
  // Laid ready on its tray: the cannulation syringes, a saline flush, a blood tube for creatinine.
  syringe(e, trolley, -0.1, 0.94, -0.16, 0.2, 10)
  syringe(e, trolley, -0.02, 0.94, -0.17, 0.25, 5)
  bloodTube(e, trolley, 0.08, 0.94, -0.18, 'gold')
  const wc = r.onWall('-x', 1.95, 0, 0.5)
  cupboard(e, wc, 0.6, 0.85, 0.5, { fill: 'supplies', label: 'Cupboard', top: m.solidSurface })
  const warmer = group(wc, 0, 0.86, -0.25)
  e.k.soft(warmer, 0.5, 0.45, 0.42, 0.02, m.whitePlastic, 0, 0.225, 0)
  e.k.box(warmer, 0.4, 0.3, 0.005, e.o.screenGlass, 0, 0.22, 0.212, false)
  for (let i = 0; i < 5; i++) e.k.cyl(warmer, 0.03, 0.03, 0.18, m.clearPlastic, -0.14 + i * 0.07, 0.15, 0.05, 14)
  e.k.box(warmer, 0.08, 0.03, 0.004, e.o.screen('warmerTemp', 64, 24, (g, w, h) => {
    g.fillStyle = '#120804'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#ffb020'
    g.font = `700 ${h * 0.8}px Helvetica`
    g.fillText('37.0°', 4, h * 0.85)
  }, 1.0), 0.15, 0.4, 0.213, false)
  r.info(warmer, {
    title: 'Contrast Media Warmer',
    kind: 'CT preparation',
    body: 'Keeps bottles of iodinated contrast at body temperature, which lowers its viscosity so it flows smoothly through the cannula and is more comfortable for the patient.',
    specs: ['Held at 37 °C ± 2', 'Glass door, digital display'],
  })
  const cart = r.at(r.x0 + 0.38, -1.75, PI / 2)
  crashCart(e, cart, m.monitors[3])
  r.info(cart, {
    title: 'Crash Cart',
    kind: 'Emergency · Resuscitation',
    body: 'Kept ready for the rare severe reaction to contrast: emergency drugs including adrenaline, airway equipment and a monitor-defibrillator, sealed and checked daily.',
    specs: ['Monitor-defibrillator', 'Anaphylaxis drugs and airway kit', 'Portable oxygen'],
  })
  // The changing cubicle at the window end, its curtain half drawn; the hand-wash by the door.
  const cub = r.at(r.x0, 2.55, 0)
  curtain(e, cub, r.w, r.ceiling, 0.45)
  e.k.box(r.group, r.w - 0.4, 0.05, 0.38, e.o.oak, r.cx, r.y + 0.45, r.z1 - 0.25)
  basin(e, r.onWall('-z', r.x1 - 0.35), 0.5)
  bins(e, r.onWall('+x', -2.75, 0, 0.2), ['yellow', 'red', 'black'])
  sharps(e, r.onWall('+x', 2.1), 1.2)
}

/* ---------- cardiac diagnostics ---------- */

const ecg: Fitter = (e, r) => {
  // The examination couch under the window, the curtain across it, the ECG machine beside.
  const couch = r.at(r.x1 - 0.5, -1.45, -PI / 2)
  examCouch(e, couch)
  const cur = r.at(r.x1 - 1.25, r.z0 + 0.05, -PI / 2)
  curtain(e, cur, r.d - 0.1, r.ceiling, 0.35)
  const cart = r.at(r.x1 - 1.55, -0.45, PI / 2 + 0.3)
  ecgMachine(e, cart, ecgTrace(e, 'ecgRoom'), 'ecgRoom')
  r.info(cart, {
    title: '12-lead ECG Machine',
    kind: 'Cardiac diagnostics · Electrocardiography',
    body: 'Records the heart\'s electrical activity through ten electrodes on the chest and limbs, printing the twelve leads with an automatic interpretation for the cardiologist: rhythm, rate, conduction and signs of ischaemia.',
    specs: ['12 leads, simultaneous acquisition', '10-inch touch display, A4 thermal recorder', 'Automatic measurements and interpretation', 'Results sent to the hospital system'],
  })
  // Skin preparation and electrodes on a trolley by the couch.
  const tr = r.at(r.x1 - 1.0, r.z0 + 0.45, 0)
  injectionTrolley(e, tr)
  dressingSupplies(e, tr, 0.4, 0.3, 0.95)
  // The technician's workstation on the inner wall.
  const dk = r.onWall('-x', -2.1, 0, 0.42)
  consoleDesk(e, dk, 1.2, [ecgTrace(e, 'ecgReview', false)], { intercom: false })
  taskChair(e, r.at(r.x0 + 1.1, -2.1, -PI / 2))
  printer(e, dk, 0.42, 0.75, -0.2)
  basin(e, r.onWall('+z', r.x0 + 0.5), 0.5)
  bins(e, r.onWall('-x', -0.55, 0, 0.2), ['yellow', 'black'])
}

const echo: Fitter = (e, r) => {
  // The couch along the window wall, cut-out side towards the sonographer.
  const couch = r.at(r.x1 - 0.5, 1.95, PI)
  echoCouch(e, couch)
  r.info(couch, {
    title: 'Echocardiography Couch',
    kind: 'Cardiac diagnostics · Echo',
    body: 'An electric couch made for heart ultrasound: the patient lies on their left side and the drop-away section under the chest opens, so the probe can reach the apex of the heart from below.',
    specs: ['Left-lateral drop-away cut-out', 'Electric height and backrest', 'Maximum load 200 kg'],
  })
  stool(e, r.at(r.x1 - 1.25, 1.6, 0))
  const mc = r.at(r.x1 - 2.0, 2.25, PI / 2)
  echoMachine(e, mc, echoImage(e))
  r.info(mc, {
    title: '2D Echocardiography System',
    kind: 'Cardiac diagnostics · Ultrasound',
    body: 'Images the beating heart with ultrasound: chamber sizes and wall motion in 2D, valve flow and leaks in colour and spectral Doppler, the ejection fraction measured automatically; an ECG trace keeps every image in step with the heartbeat.',
    specs: ['Phased-array cardiac probe 1–5 MHz', 'Transoesophageal probe port', '2D, M-mode, colour, PW/CW and tissue Doppler', 'Integrated 3-lead ECG', '22-inch monitor on an articulating arm'],
  }, [r.x1 - 1.45, 1.0, 2.25])
  // The patient-facing screen, storage, the privacy curtain.
  wallScreen(e, r.onWall('-z', r.x1 - 0.6), 0.65, 1.85, echoImage(e))
  cupboard(e, r.onWall('-x', 1.0, 0, 0.5), 0.9, 0.9, 0.5, { drawers: 2, fill: 'supplies', label: 'Echo Supplies', top: e.m.solidSurface })
  gloveBox(e, r.at(r.x0 + 0.3, 0.8, 0), 0, 0.92, 0)
  curtain(e, r.at(r.x1 - 2.45, r.z0 + 0.05, -PI / 2), 2.4, r.ceiling, 0.3)
  bins(e, r.onWall('-x', 2.2, 0, 0.2), ['black'])
}

const tmt: Fitter = (e, r) => {
  const { m } = e
  const tm = r.at(r.x1 - 0.7, -12.35, 0)
  treadmill(e, tm)
  r.info(tm, {
    title: 'Stress Test Treadmill',
    kind: 'Cardiac diagnostics · Exercise testing',
    body: 'The treadmill test (TMT): the patient walks while speed and gradient rise in three-minute stages of the Bruce protocol and the heart is watched on the ECG, to bring out ischaemia that does not show at rest. The front rail and the red stop are within reach throughout.',
    specs: ['Speed 0.8–16 km/h, gradient 0–25 %', 'Bruce and modified Bruce protocols', 'Front and side handrails, emergency stop', 'Maximum user weight 180 kg'],
  }, [r.x1 - 0.7, 1.0, -11.0])
  const sys = r.at(r.x0 + 1.35, r.z0 + 0.45, 0)
  stressSystem(e, sys)
  r.info(sys, {
    title: 'Exercise ECG System',
    kind: 'Cardiac diagnostics · Stress testing',
    body: 'Records the 12-lead ECG continuously during exercise and recovery, measures ST changes and controls the treadmill; its automatic cuff takes the blood pressure at every stage, and the thermal printer gives the full report.',
    specs: ['12-lead acquisition module, wireless', 'Automatic exercise BP measurement', 'ST-segment analysis and trends', 'Thermal A4 printer'],
  })
  taskChair(e, r.at(r.x0 + 1.35, r.z0 + 1.25, PI))
  const couch = r.at(r.x1 - 1.0, r.z1 - 0.4, PI)
  examCouch(e, couch)
  const cart = r.at(r.x0 + 0.36, -12.55, PI / 2)
  crashCart(e, cart, m.monitors[4])
  r.info(cart, {
    title: 'Crash Cart & Defibrillator',
    kind: 'Emergency · Resuscitation',
    body: 'Every stress test is done beside a resuscitation trolley: the monitor-defibrillator on top, emergency drugs, airway equipment and oxygen, checked before each session.',
    specs: ['Biphasic monitor-defibrillator', 'Cardiac emergency drugs', 'Airway and oxygen'],
  })
  const o2 = r.at(r.x0 + 0.3, r.z0 + 0.3, PI / 2)
  oxygenTrolley(e, o2, cylinder)
  bpMonitor(e, sys, -0.2, 0.87, 0.15)
  basin(e, r.onWall('+z', r.x0 + 0.6), 0.5)
  clock(e, r.onWall('-x', -12.3), 2.2)
}

const cardiacConsult: Fitter = (e, r) => {
  // The desk with the window behind the cardiologist; the patients' chairs facing it.
  const dk = r.at(r.x1 - 1.15, -7.75, -PI / 2)
  desk(e, dk, 1.4, 0.75, 1)
  const scr = ecgTrace(e, 'consultReview', false)
  monitor(e, dk, -0.3, 0.75, 0.12, PI + 0.15, 0.55, 0.33, scr)
  keyboard(e, dk, -0.25, 0.75, -0.17, PI)
  mouse(e, dk, -0.58, 0.75, -0.18)
  stethoscope(e, dk, 0.35, 0.75, 0.05, 0.4)
  bpMonitor(e, dk, 0.5, 0.75, -0.2, PI)
  papers(e, dk, 0.12, 0.75, -0.08, PI)
  taskChair(e, r.at(r.x1 - 0.45, -7.75, -PI / 2))
  visitorChair(e, r.at(r.x0 + 1.3, -8.15, PI / 2))
  visitorChair(e, r.at(r.x0 + 1.3, -7.45, PI / 2))
  // The couch on the back wall behind its curtain; the ECG review screen and the hand-wash on the corridor wall.
  examCouch(e, r.at(r.cx + 0.25, r.z0 + 0.35, 0))
  curtain(e, r.at(r.x0 + 0.6, r.z0 + 1.05, 0), r.x1 - r.x0 - 0.6, r.ceiling, 0.35)
  const v = r.onWall('+z', r.cx - 0.3)
  wallScreen(e, v, 0.7, 1.6, ecgTrace(e, 'consultWall', false))
  r.info(v, {
    title: 'ECG & Echo Review Screen',
    kind: 'Cardiac consultation',
    body: 'Shows the patient\'s ECGs, stress test and echo reports from the cardiology system, so the cardiologist can go through them with the patient.',
    specs: ['Linked to the cardiology information system'],
  })
  basin(e, r.onWall('+z', r.x1 - 0.4), 0.5)
  bins(e, r.onWall('-x', -9.2, 0, 0.2), ['yellow', 'black'])
}

/* ---------- reporting ---------- */

const reporting: Fitter = (e, r) => {
  const desks: [('-x' | '+x'), number][] = [['-x', -1.4], ['-x', 0.9], ['-x', 3.0], ['+x', 1.9]]
  desks.forEach(([side, z], i) => {
    const g = r.onWall(side, z, 0, 0.42)
    pacsDesk(e, g, [
      e.o.his(`pacs${i}a`, ['PACS · CT Abdomen', 'PACS · MR Brain', 'PACS · CR Chest', 'PACS · CT Chest'][i], 'image'),
      e.o.his(`pacs${i}b`, ['PACS · CT Coronal', 'PACS · MR Spine', 'PACS · Prior', 'PACS · CT Lung'][i], 'image'),
      e.o.his(`pacs${i}c`, 'RIS · Reporting Worklist', 'table'),
    ])
    if (i === 0) r.info(g, {
      title: 'PACS Reading Workstation',
      kind: 'Radiology · Reporting',
      body: 'Where the radiologist reads and reports the studies from CT, MRI, X-ray and ultrasound: two 5-megapixel greyscale diagnostic monitors, calibrated for reading, and a colour screen with the worklist and the report, dictated through the microphone with speech recognition. The room is kept dim so faint detail shows.',
      specs: ['2 × 5 MP portrait diagnostic monitors, DICOM calibrated', 'Colour worklist and reporting monitor', 'Speech-recognition dictation', 'Low ambient light, dimmable task lamps'],
    })
  })
  // A shared printer and a reference shelf by the door.
  const sh = r.onWall('-z', r.x0 + 0.6, 0, 0.45)
  cupboard(e, sh, 0.9, 0.85, 0.45, { fill: 'files', top: e.m.solidSurface })
  printer(e, sh, 0, 0.87, -0.22)
  clock(e, r.onWall('+z', r.cx), 2.2)
}

export const THIRD: Record<string, Fitter> = {
  mri,
  mri_control: mriControl,
  mri_tech: mriTech,
  mri_screening: mriScreening,
  ct,
  ct_control: ctControl,
  ct_prep: ctPrep,
  ecg,
  echo,
  tmt,
  cardiac_consult: cardiacConsult,
  reporting,
}
