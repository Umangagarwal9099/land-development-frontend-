import { Vector3, type Object3D } from 'three'
import { PI } from '../../../kit'
import { beamSeating, linenTrolley } from '../../emergency'
import { gasAlarm, headwall, ivStand, zoneValves } from '../../erEquipment'
import { bed, crashCart, cylinder, roundStool, taskChair } from '../../erFurniture'
import { group, signPanel } from '../../erKit'
import type { OpdCtx, Room } from '../../opd/ctx'
import { handRub } from '../../opd/equipment/common'
import { autoclave, bench as labBench } from '../../opd/equipment/lab'
import { floorDrain, mirror, soapDispenser, wallBasin, wcPan, handWashPoint } from '../../opd/equipment/sanitary'
import { baseRun, bins, clock, computer, cupboard, curtain, desk, deskPhone, lockers, medFridge, rack, sharps, wallScreen } from '../../opd/furniture'
import { board, NAVY, tokenScreen } from '../../opd/paints'
import type { Dir } from '../../opd/plan'
import type { Fitter } from '../../opd/rooms/types'
import { cArm, instrumentTable, kickBucket, laminarPlenum, lapTower, mayoStand, scrubTrough, steelTrolley, suctionUnit, surgeonPanel, wallPanels } from '../equipment/thirdOt'
import {
  anaesthesiaWorkstation, apronRack, backTable, bowlStand, cove, operatingTable, otGasPanel, pacsDisplay, passBox, returnGrille, storageWall, surgicalLights, swabRack, theatrePendant,
  type LightHead,
} from '../equipment/otKit'
import { icuMonitorPaint, ventScreenPaint } from '../equipment/secondPaints'
import { icuVentilator, infusionTower, wallMonitor } from '../equipment/secondIcu'
import { drawerCart, rubBottle, wallClock, wardBed } from '../kit'
import { MAIN_CORE } from './core'

/*
 * The main block's third floor: the operation theatre complex. Patients come up in the bed lifts
 * to the transfer bay (the red line), wait in pre-operative holding and pass by the clean corridor,
 * with its scrub troughs, through the hermetic sliding doors into one of three modular theatres;
 * they wake in the recovery unit (PACU) down the north side. Staff change at the back and enter
 * by the semi-restricted corridors; used instruments go to the CSSD, waste and soiled linen to
 * the dirty utility. Plan coordinates as in ../../opd/plan.ts.
 *
 * Each theatre is fitted as a modular theatre is: seamless antibacterial wall panels on a coved
 * conductive floor, a sealed ceiling with the HEPA laminar-flow plenum over the table and LED
 * panels round it, low-level return-air grilles in the corners; the operating table under the LED
 * surgical lights (with a surgical display on their axis); the anaesthesia pendant at the head with
 * its gases, monitor and drawers, the anaesthesia workstation piped to it; the surgical pendant
 * with the electrosurgical generator; back table, Mayo stand, bowl stand and kick buckets; recessed
 * stainless storage, a wall gas panel, the surgeon's control panel and a PACS display.
 */

/** A notice on a wall: navy or red on white, two lines. */
function notice(e: OpdCtx, room: Room, side: Dir, along: number, key: string, title: string, sub: string, red = false, y = 1.75) {
  const mat = e.o.sign(`ot_${key}`, 640, 220, board(red ? '#ffffff' : NAVY, [[title, 0.3, red ? '#c8161d' : '#ffffff'], [sub, 0.15, red ? '#333333' : '#c7d3e6', 500]], { border: red ? '#c8161d' : undefined }))
  signPanel(e, room.onWall(side, along), 0.8, 0.28, mat, 0, y, 0.008, 0, 0.01)
}

/** `o`'s position in `g`'s frame. */
function toFrame(room: Room, o: Object3D, g: Object3D): [number, number, number] {
  room.group.updateMatrixWorld(true)
  const v = g.worldToLocal(o.getWorldPosition(new Vector3()))
  return [v.x, v.y, v.z]
}

/** A pendant's ceiling mount, given in plan, in the frame of its column at (x, z) turned ry. */
function mountIn(col: [number, number, number], mount: [number, number]): [number, number] {
  const [cx, cz, ry] = col
  const dx = mount[0] - cx
  const dz = mount[1] - cz
  return [dx * Math.cos(ry) - dz * Math.sin(ry), dx * Math.sin(ry) + dz * Math.cos(ry)]
}

type At = [Dir, number]

interface TheatreSpec {
  /** The table's centre and turn (its head at local −z). */
  table: [number, number, number]
  ortho?: boolean
  heads: LightHead[]
  /** The surgical display's arm off the lights' axis. */
  display?: { turn: number; reach: number }
  /** The pendants: their columns (x, z, turn) and ceiling mounts in plan. */
  anaes: { col: [number, number, number]; mount: [number, number] }
  surg: { col: [number, number, number]; mount: [number, number] }
  /** The anaesthesia workstation (x, z, turn). */
  machine: [number, number, number]
  panel: At
  gas: At
  pacs: [Dir, number, number]
  storage: [Dir, number, number]
  grilles: At[]
  bins: At
  swab: At
  rub: At
  /** Stands round the table: back table, Mayo, bowl stand, kick buckets, IV stand, suction, stools. */
  backTable: [number, number, number, number]
  mayo: [number, number, number]
  bowls: [number, number, number]
  kicks: [number, number][]
  iv: [number, number]
  suction: [number, number, number]
  stools: [number, number][]
  extra: (e: OpdCtx, room: Room) => void
  info: { title: string; body: string }
}

function theatre(s: TheatreSpec): Fitter {
  return (e, room) => {
    const C = room.ceiling
    const [tx, tz, tr] = s.table
    // Walls in seamless panelling with the floor coved up to them, the laminar-flow plenum.
    for (const side of ['-x', '+x', '-z', '+z'] as const) {
      if (room.exterior.includes(side)) continue
      const [a0, a1] = room.side(side)
      const w = room.onWall(side, (a0 + a1) / 2)
      if (!room.doors.some((d) => d.spec.side === side)) wallPanels(e, w, a1 - a0, C)
      cove(e, w, a1 - a0, e.o.floor.conductive)
    }
    laminarPlenum(e, room.at(tx, tz, tr), C, 2.6, 3.0)
    room.info(room.at(tx, tz, tr, C - 0.1), {
      title: 'Laminar Airflow Ceiling', kind: 'Theatre ventilation · HEPA',
      body: 'A plenum of HEPA H14 filters over the operating field delivers a unidirectional downflow of filtered air across the table and the instrument tables, the clear perspex skirt keeping it as a column; the air leaves through the stainless grilles low in the corners. The theatre is held at positive pressure to the corridors.',
      specs: ['HEPA H14, 99.995 % at MPPS', '25 air changes an hour, 20 % fresh air', '+15 Pa to the clean corridor', '21 ± 2 °C, 50–60 % RH'],
    }, [tx, C - 0.2, tz])

    // The table, its stools.
    const t = room.at(tx, tz, tr)
    operatingTable(e, t, { ortho: s.ortho, made: !s.ortho })
    room.info(t, {
      title: s.ortho ? 'Orthopaedic Operating Table' : 'Mobile-column Operating Table',
      kind: 'Surgical table · Electro-hydraulic',
      body: s.ortho
        ? 'A column operating table with its leg plates exchanged for the orthopaedic traction extension: two boots on adjustable spars and the padded perineal post for hip and femur fractures, the carbon-fibre top letting the C-arm see through it.'
        : 'An electro-hydraulic column table with a radiolucent carbon-fibre top: head, two back sections with the kidney-bridge break, seat and split leg plates under 80 mm pressure-care pads; arm boards on rail clamps, the anaesthesia screen, the gel head ring and a knee strap. Height, Trendelenburg, tilt and sections are set from the wired hand control; the base locks to the floor.',
      specs: ['Top height 0.65–1.1 m, load 450 kg', 'Trendelenburg ±30°, lateral tilt ±25°', 'Carbon-fibre top for C-arm imaging', 'Battery and mains, floor locking, split leg plates'],
    })
    for (const [x, z] of s.stools) roundStool(e, room.at(x, z, 0), { saddle: false, ring: true })

    // The lights and their display.
    const display = s.display ? { ...s.display, y: 1.8, screen: e.o.screen(`otDisp_${room.spec.id}`, 1024, 576, endoPaint(room.spec.id === 'ot1'), 1.0) } : undefined
    const lights = surgicalLights(e, room.at(tx, tz, tr), C, s.heads, display)
    room.info(room.at(tx, tz, tr, C - 0.9), {
      title: 'LED Surgical Lights', kind: 'Ceiling-mounted surgical lighting',
      body: 'Dome lightheads on spring arms and cardanic yokes from one ceiling axis, each a field of 18 LED cells in their reflectors round a sterile handle, overlapping their beams so a surgeon\'s head or hands cast no shadow in the wound. A camera in the main head records the field; a 27″ surgical display rides on the same axis.',
      specs: ['160,000 lux each, 3,800–5,000 K, Ra 96', 'Light field 18–30 cm, depth of illumination 1.2 m', 'Sterilisable handles, laminar-flow friendly shape', 'Switch on the surgeon\'s panel'],
    }, [tx, 1.9, tz])

    // The pendants: anaesthesia (with the monitor) at the head, surgical (with the generator) at the side.
    const ac = s.anaes.col
    const ap = room.at(ac[0], ac[1], ac[2])
    const monitor = e.o.screen(`otMon_${room.spec.id}`, 640, 408, icuMonitorPaint(room.spec.no ?? 'OT', 7400 + (room.spec.id.charCodeAt(2) || 0), true))
    const outs = theatrePendant(e, ap, { ceiling: C, mount: mountIn(ac, s.anaes.mount), kind: 'anaes', monitor })
    room.info(ap, {
      title: 'Anaesthesia Pendant', kind: 'Ceiling supply unit · Two-link arm',
      body: 'The anaesthetist\'s ceiling pendant at the head of the table: medical gas terminal units for oxygen, nitrous oxide, medical air, vacuum and the anaesthetic gas scavenging (AGSS), UPS-backed and mains power, data, shelves with the multiparameter patient monitor, an infusion pole and drawers, all off the floor.',
      specs: ['O₂, N₂O, air, vacuum, AGSS (ISO 9170 terminal units)', '6 sockets (2 on UPS), 2 data, equipotential stud', 'Monitor: ECG, IBP, SpO₂, EtCO₂, NIBP, temperature, BIS', 'Arm reach 1.6 m, braked joints, shelves rated 80 kg'],
    })
    const sc = s.surg.col
    const sp = room.at(sc[0], sc[1], sc[2])
    theatrePendant(e, sp, { ceiling: C, mount: mountIn(sc, s.surg.mount), kind: 'surg', esu: e.m.monitors[2] ?? e.m.monitors[0] })
    room.info(sp, {
      title: 'Surgical Pendant · Electrosurgery', kind: 'Ceiling supply unit',
      body: 'The surgeon\'s side pendant carries the electrosurgical generator (monopolar and bipolar cutting and coagulation, vessel sealing) and the smoke evacuator under it, with oxygen, air, CO₂ for insufflation and vacuum, and power; the foot switch hangs below.',
      specs: ['ESU: 300 W monopolar, bipolar, vessel sealing', 'Smoke evacuation with ULPA filter', 'O₂, air, CO₂, vacuum; 6 sockets'],
    })

    // The anaesthesia workstation, its hoses up to the pendant's outlets.
    const [mx, mz, mr] = s.machine
    const an = room.at(mx, mz, mr)
    const hoses: Partial<Record<'o2' | 'n2o' | 'air' | 'agss', [number, number, number]>> = {}
    for (const g of ['o2', 'n2o', 'air', 'agss'] as const) {
      const mark = outs[g]
      if (mark) hoses[g] = toFrame(room, mark, an)
    }
    anaesthesiaWorkstation(e, an, {
      screen: e.o.screen(`anaesScr_${room.spec.id}`, 640, 470, ventScreenPaint(room.spec.no ?? 'OT', 7500 + (room.spec.id.charCodeAt(2) || 0)), 1.0),
      gas: e.m.monitors[3] ?? e.m.monitors[0],
      hoses,
    })
    room.info(an, {
      title: 'Anaesthesia Workstation', kind: 'Anaesthesia delivery system with integrated ventilator',
      body: 'The anaesthetist\'s machine at the patient\'s head: electronic mixing of oxygen, air and nitrous oxide, sevoflurane and isoflurane vaporisers on their rail, a compact heated breathing system with its CO₂ absorber, APL valve and bag, and an electronically driven ventilator; the main screen shows pressures, volumes and loops, the gas module inspired and end-tidal gases and agent. Pipeline hoses run up to the pendant; reserve cylinders ride on the back.',
      specs: ['Ventilation: VC, PC, PC-VG, SIMV, PSV, CPAP', 'Fresh gas 0.2–15 L/min, low-flow anaesthesia', 'Gas module: O₂, CO₂, N₂O, agent, MAC', 'Reserve O₂ and N₂O cylinders, 60 min battery'],
    })
    roundStool(e, group(t, 0.45, 0, -1.6), { saddle: false, ring: false })

    // Round the table: back table, Mayo, bowls, kick buckets, the IV stand and suction.
    const [bx, bz, br, bw] = s.backTable
    const bt = room.at(bx, bz, br)
    backTable(e, bt, bw, 0.7, room.spec.id.length + 3)
    room.info(bt, { title: 'Instrument Back Table', kind: 'Scrub nurse\'s table', body: 'The scrub nurse lays out the case\'s instrument sets, sutures and swabs on this stainless table under its sterile drape; instruments pass to the Mayo stand over the patient and are counted back before closing.', specs: ['Stainless steel 1.5 × 0.7 m on castors', 'Sterile drape to the floor', 'Count: swabs, needles, instruments'] })
    mayoStand(e, room.at(s.mayo[0], s.mayo[1], s.mayo[2]), room.spec.id.length + 5)
    bowlStand(e, room.at(s.bowls[0], s.bowls[1], s.bowls[2]))
    for (const [x, z] of s.kicks) kickBucket(e, room.at(x, z))
    ivStand(e, room.at(s.iv[0], s.iv[1], 0), true)
    suctionUnit(e, room.at(s.suction[0], s.suction[1], s.suction[2]))

    // On the walls: the surgeon's panel (lights switch), the gas panel, the display, storage, grilles.
    const pw = room.onWall(s.panel[0], s.panel[1])
    surgeonPanel(e, pw, lights)
    room.info(pw, { title: 'Surgeon\'s Control Panel', kind: 'Theatre control', body: 'A sealed glass touch panel: the time, the operation and anaesthesia timers, theatre temperature, humidity and pressure, the medical gas alarms, and switches for the surgical and room lights (try it), the music and the phone.', specs: ['Elapsed-time and anaesthesia timers', 'Temperature, humidity and room pressure', 'Gas alarm repeater, light and music control'] }, [pw.position.x, 1.6, pw.position.z])
    const gp = room.onWall(s.gas[0], s.gas[1])
    otGasPanel(e, gp)
    room.info(gp, { title: 'Wall Gas Outlet Panel', kind: 'Medical gases · Back-up', body: 'A recessed stainless panel of terminal units on the wall, a back-up to the pendants: oxygen, nitrous oxide, medical air, vacuum and AGSS, with UPS and mains sockets and the equipotential bonding stud.', specs: ['O₂, N₂O, air, vacuum, AGSS', 'Gas-specific, colour-coded probes', 'Isolating valves in the corridor zone valve box'] }, [gp.position.x, 1.45, gp.position.z])
    pacsDisplay(e, room.onWall(s.pacs[0], s.pacs[1]), room.spec.id, s.pacs[2], 1.7)
    const st = room.onWall(s.storage[0], s.storage[1])
    storageWall(e, st, s.storage[2], C)
    room.info(st, { title: 'Recessed Theatre Storage', kind: 'Sterile storage', body: 'Stainless cabinets set flush into the modular wall: sterile instrument sets, sutures, peel packs and gloves behind glazed doors, drapes, gowns and consumables in the drawers below, with no ledges to gather dust.', specs: ['304 stainless, coved and sealed', 'Glazed doors open (tap them)', 'Stock first-expiry-first-out'] }, [st.position.x, 1.5, st.position.z])
    for (const [side, along] of s.grilles) returnGrille(e, room.onWall(side, along))
    bins(e, room.onWall(s.bins[0], s.bins[1], 0, 0.22), ['yellow', 'red', 'blue'])
    swabRack(e, room.onWall(s.swab[0], s.swab[1]))
    handRub(e, room.onWall(s.rub[0], s.rub[1]), 1.25)
    s.extra(e, room)
    room.info(room.at(tx, tz, tr), { title: s.info.title, kind: 'Modular operation theatre', body: s.info.body, specs: ['Positive pressure, HEPA laminar flow, 25 air changes an hour', 'Coved conductive vinyl floor; seamless antibacterial wall panels', 'Pendants: O₂, N₂O, air, vacuum, AGSS, CO₂; wall gas panel', 'IT-isolated power with UPS, hermetic sliding door'] }, [tx, 0.4, tz])
  }
}

/** The surgical display's picture: a laparoscopic view, or the patient's imaging. */
function endoPaint(lap: boolean) {
  return (g: CanvasRenderingContext2D, w: number, h: number) => {
    g.fillStyle = '#000'
    g.fillRect(0, 0, w, h)
    if (lap) {
      // The scope's round field: warm tissue, a glistening organ edge and two instrument jaws.
      const grd = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, h * 0.48)
      grd.addColorStop(0, '#e8a28c')
      grd.addColorStop(0.55, '#b9584a')
      grd.addColorStop(1, '#3a0d08')
      g.fillStyle = grd
      g.beginPath()
      g.arc(w / 2, h / 2, h * 0.47, 0, PI * 2)
      g.fill()
      g.fillStyle = '#8f2f2a'
      g.beginPath()
      g.ellipse(w * 0.45, h * 0.62, w * 0.18, h * 0.12, 0.3, 0, PI * 2)
      g.fill()
      g.strokeStyle = '#ffe9df'
      g.lineWidth = 3
      g.beginPath()
      g.ellipse(w * 0.45, h * 0.6, w * 0.15, h * 0.08, 0.3, PI * 1.1, PI * 1.6)
      g.stroke()
      g.fillStyle = '#a7aeb3'
      g.save()
      g.translate(w * 0.72, h * 0.25)
      g.rotate(0.8)
      g.fillRect(0, 0, 18, 170)
      g.restore()
      g.save()
      g.translate(w * 0.28, h * 0.22)
      g.rotate(-0.7)
      g.fillRect(0, 0, 16, 160)
      g.restore()
      g.fillStyle = '#ffffff'
      g.font = '600 18px Helvetica'
      g.fillText('4K · 30° SCOPE · CO₂ 12 mmHg', 18, h - 18)
    } else {
      g.fillStyle = '#2b2b2b'
      g.beginPath()
      g.ellipse(w / 2, h / 2, w * 0.3, h * 0.38, 0, 0, PI * 2)
      g.fill()
      g.fillStyle = '#9a9a9a'
      g.beginPath()
      g.ellipse(w / 2, h / 2, w * 0.27, h * 0.34, 0, 0, PI * 2)
      g.fill()
      g.fillStyle = '#eee'
      g.beginPath()
      g.arc(w / 2, h * 0.68, 22, 0, PI * 2)
      g.fill()
      g.fillStyle = '#ffffff'
      g.font = '600 18px Helvetica'
      g.fillText('NAVIGATION · CT AXIAL 1.25 mm', 18, h - 18)
    }
  }
}

const OT1 = theatre({
  table: [8.34, -0.3, 0],
  heads: [{ turn: 0.5, reach: 0.75, drop: 0.55 }, { turn: 2.7, reach: 0.7, drop: 0.45 }],
  display: { turn: -1.75, reach: 0.95 },
  anaes: { col: [6.95, -2.3, 0.9], mount: [6.2, -2.9] },
  surg: { col: [10.35, 0.75, -PI / 2], mount: [10.8, 1.5] },
  machine: [8.0, -2.48, 0.12],
  panel: ['-x', 0.4],
  gas: ['-z', 6.6],
  pacs: ['-x', -1.45, 1.0],
  storage: ['-z', 10.0, 2],
  grilles: [['-x', -2.95], ['-x', 2.0], ['+x', -2.95], ['+x', 2.05]],
  bins: ['+x', 1.15],
  swab: ['+x', -0.2],
  rub: ['+z', 10.1],
  backTable: [6.35, 1.4, PI / 2, 1.5],
  mayo: [7.45, 1.1, PI],
  bowls: [6.4, -0.3, PI / 2],
  kicks: [[7.45, -0.15], [9.25, 0.35]],
  iv: [8.95, -1.55],
  suction: [9.35, -2.55, -PI / 2],
  stools: [[7.6, 0.05], [9.1, -0.25]],
  info: { title: 'Operation Theatre 1 · General & Laparoscopic', body: 'General and laparoscopic surgery: the laparoscopy tower across the table from the surgeon and the laparoscopic image on the display arm of the lights, the electrosurgical generator on its pendant, instruments laid out under sterile drapes on the back table.' },
  extra: (e, room) => {
    const lt = room.at(10.5, -1.0, -PI / 2)
    lapTower(e, lt, e.m.monitors[3] ?? e.m.monitors[0])
    room.info(lt, { title: 'Laparoscopy Tower', kind: 'Minimally invasive surgery', body: 'The video stack for keyhole surgery: a 4K camera control unit, LED light source, high-flow CO₂ insufflator and recorder, under a 32″ surgical monitor; the CO₂ cylinder rides on its back.', specs: ['4K / 3D camera system', 'Insufflator up to 45 L/min', 'Recording to PACS'] })
  },
})

const OT2 = theatre({
  table: [3.5, 8.6, PI],
  ortho: true,
  heads: [{ turn: 2.5, reach: 0.75, drop: 0.5 }, { turn: -0.6, reach: 0.7, drop: 0.45 }],
  anaes: { col: [1.9, 10.6, PI * 0.6], mount: [1.35, 11.6] },
  surg: { col: [5.25, 8.95, -PI / 2], mount: [5.75, 9.8] },
  machine: [3.2, 10.55, PI],
  panel: ['+x', 6.6],
  gas: ['+z', 4.7],
  pacs: ['+x', 11.4, 1.0],
  storage: ['+z', 2.95, 2],
  grilles: [['+x', 5.1], ['+x', 12.5], ['-z', 1.4], ['+z', 5.6]],
  bins: ['+x', 12.4],
  swab: ['+x', 9.95],
  rub: ['-z', 1.0],
  backTable: [5.3, 7.3, PI / 2, 1.5],
  mayo: [4.35, 6.7, 0],
  bowls: [2.6, 6.0, 0],
  kicks: [[2.75, 8.4], [4.35, 8.0]],
  iv: [2.85, 9.95],
  suction: [4.3, 10.6, PI],
  stools: [[4.25, 7.6], [2.75, 7.3]],
  info: { title: 'Operation Theatre 2 · Orthopaedics', body: 'The orthopaedic theatre: the table fitted with its traction extension for hips and femurs, a mobile C-arm image intensifier with its monitor cart, the power-tool and implant trolley, lead aprons for the team on their rack.' },
  extra: (e, room) => {
    const c = room.at(1.6, 8.0, PI / 2)
    cArm(e, c, e.m.monitors[1])
    room.info(c, { title: 'Mobile C-arm', kind: 'Intra-operative X-ray imaging', body: 'A mobile C-arm image intensifier: the X-ray tube and flat-panel detector at the ends of its C swing round the patient on the radiolucent table to show bones and implants live on the twin monitors of its cart.', specs: ['Flat-panel detector 30 × 30 cm', 'Pulsed fluoroscopy, low dose', 'Twin 19″ monitors'] })
    const pt = room.at(1.7, 5.4, 0)
    steelTrolley(e, pt)
    room.info(pt, { title: 'Power Tools & Implants Trolley', kind: 'Orthopaedic', body: 'Battery drills, saws and reamers in their sterile cases, and the implant sets for the day\'s cases.' })
    const ar = room.onWall('-z', 1.65)
    apronRack(e, ar, 4)
    room.info(ar, { title: 'Lead Apron Rack', kind: 'Radiation protection', body: 'Lead-equivalent aprons and thyroid shields for everyone in the theatre while the C-arm is screening, hung so they don\'t crack.', specs: ['0.5 mm Pb equivalent', 'Checked under X-ray yearly'] })
  },
})

const OT3 = theatre({
  table: [8.7, 8.6, PI],
  heads: [{ turn: 2.6, reach: 0.75, drop: 0.55 }, { turn: -0.5, reach: 0.7, drop: 0.45 }, { turn: 1.0, reach: 0.85, drop: 0.62 }],
  display: { turn: 1.95, reach: 1.0 },
  anaes: { col: [7.1, 10.6, PI * 0.6], mount: [6.6, 11.55] },
  surg: { col: [10.45, 8.95, -PI / 2], mount: [10.95, 9.8] },
  machine: [8.4, 10.55, PI],
  panel: ['-x', 8.0],
  gas: ['+z', 6.9],
  pacs: ['-x', 9.9, 1.2],
  storage: ['+z', 8.7, 2],
  grilles: [['-x', 5.0], ['-x', 12.55], ['+x', 5.0], ['+z', 9.8]],
  bins: ['-z', 10.7],
  swab: ['+x', 5.6],
  rub: ['-z', 6.45],
  backTable: [10.6, 7.0, PI / 2, 1.5],
  mayo: [7.55, 7.2, 0],
  bowls: [9.5, 5.4, 0],
  kicks: [[7.85, 9.0], [9.6, 8.3]],
  iv: [8.0, 9.95],
  suction: [9.4, 10.6, PI],
  stools: [[7.75, 7.9], [9.65, 7.6]],
  info: { title: 'Operation Theatre 3 · Major & Specialty', body: 'The largest theatre, for major and specialty surgery: three lightheads with the navigation display on their axis, two instrument tables, a patient-warming cabinet, a critical-care ventilator ready for patients going to the ICU ventilated, and a pass box to the sterile store.' },
  extra: (e, room) => {
    instrumentTable(e, room.at(6.85, 6.4, PI / 2), 1.2, 0.6, 2, 12)
    const v = room.at(10.6, 12.2, -PI / 2)
    icuVentilator(e, v, { screen: e.o.screen('vent_OT3', 640, 410, ventScreenPaint('OT-3', 7611)), side: 1 })
    room.info(v, { title: 'Critical Care Ventilator', kind: 'Post-operative ventilation', body: 'A critical-care ventilator kept checked and in standby on its test lung, for patients who leave a long operation still ventilated: they go to the ICU on it, with the transport monitor, without a gap in ventilation.', specs: ['VC/PC-AC, SIMV, PSV, NIV', 'Heated humidifier, dual-limb circuit', 'Battery 2 h for transfers'] })
    const warm = room.at(6.5, 11.9, PI / 2)
    drawerCart(e, warm, 0.6, 1.1, 0.55, 3)
    room.info(warm, { title: 'Warming Cabinet', kind: 'Patient warming', body: 'Blankets and IV and irrigation fluids kept at 37–40 °C to keep the patient warm through a long operation.' })
    const pb = room.onWall('+x', 9.6)
    passBox(e, pb)
    room.info(pb, { title: 'Pass Box', kind: 'Sterile transfer', body: 'Sterile sets pass into the theatre from the sterile store through this stainless box without either door opening the theatre to the store: the two doors are interlocked, and a UV lamp works on the box between passes.', specs: ['Interlocked doors', 'UV-C lamp, 15 min cycle', '304 stainless, coved inside'] }, [pb.position.x, 1.1, pb.position.z])
  },
})

/* ---------- the rest of the complex ---------- */

const corridor: Fitter = (e, room) => {
  for (const [x, n] of [[4.55, 2], [10.6, 2]] as const) {
    const s = room.onWall('-z', x)
    scrubTrough(e, s, n)
    room.info(s, { title: 'Surgical Scrub Station', kind: 'Pre-operative hand antisepsis', body: 'A stainless scrub trough outside the theatres: sensor taps run warm water hands-free while surgeons scrub to the elbows with chlorhexidine for the prescribed minutes, then back through the theatre doors.', specs: ['Infra-red sensor taps, thermostatic', 'Chlorhexidine and povidone dispensers', 'Scrub brushes and nail picks'] })
  }
  clock(e, room.onWall('-z', 4.55), 2.55)
  // The zone valve box for the theatres between the theatre doors; the gas alarm and the notice at the end.
  const zv = room.onWall('+z', 6.25)
  zoneValves(e, zv, 0, 1.4, room.ceiling)
  room.info(zv, { title: 'Theatre Zone Valve Box', kind: 'Medical gases · Isolation', body: 'One isolating valve and gauge for each gas feeding the theatres, behind a break-glass lid: in a fire or a pipeline failure the gases to the theatres are shut off here and portable cylinders take over.', specs: ['O₂, air, vacuum (N₂O and AGSS in the plant space)', 'Line pressure gauges', 'Labelled to the theatres it serves'] })
  const end = room.onWall('+x', 3.0)
  gasAlarm(e, end, 0, 1.6)
  notice(e, room, '+x', 3.95, 'sterile', 'STERILE ZONE', 'Theatre attire, caps and masks only', true, 2.0)
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
  // The holding bay on the solid west wall (the east is the façade's glass), its trolley along the
  // wall under the headwall, the curtain round it on its ceiling track; the way between the two
  // doors stays clear along the windows.
  const hw = room.onWall('-x', -1.25)
  headwall(e, hw, e.m.monitors[2], false)
  bed(e, room.at(room.x0 + 0.5, -1.25, 0), { back: 0.45, linen: 'used', height: 0.7, iv: true })
  room.info(hw, { title: 'Pre-operative Holding Bay', kind: 'Pre-op holding', body: 'Patients are received here against the WHO surgical safety checklist: identity, consent and site marking verified, fasting and allergies confirmed, cannulated and pre-medicated, on oxygen and monitoring from the headwall before they go through to theatre.', specs: ['O₂, air and vacuum at the headwall', 'Monitor on its arm, suction and O₂ flowmeter', 'Privacy curtain on a ceiling track'] }, [room.x0 + 0.3, 1.4, -1.25])
  curtain(e, room.at(room.x0 + 1.15, -1.25, -PI / 2), 2.5, room.ceiling, 0.6)
  // The reception and nurse desk further along the same wall.
  const d = room.onWall('-x', 1.0, 0, 0.32)
  desk(e, d, 1.0, 0.6, 0)
  computer(e, d, 0, 0.75, -0.08, 0, e.o.his('ot_reception', 'OT List · Surgical Safety Checklist', 'table'))
  deskPhone(e, d, 0.35, 0.75, 0.05)
  taskChair(e, room.onWall('-x', 1.0, 0, 0.95))
  room.info(d, { title: 'OT Reception & Nurse Desk', kind: 'Theatre reception', body: 'The day\'s operating list, patient identity and site checks, and the WHO surgical safety checklist begin here.' })
  cupboard(e, room.onWall('-x', -2.95, 0, 0.42), 0.8, 1.9, 0.4, { glass: true, fill: 'linen', label: 'Patient Gowns & Caps' })
  rubBottle(e, room.onWall('-x', 2.05), 1.25)
  wallClock(e, room.onWall('-z', 12.9), 2.45, 0.28)
  sharps(e, room.onWall('-x', 0.25), 1.25)
}

const pacu: Fitter = (e, room) => {
  const zs = [-13.9, -11.5, -9.1]
  zs.forEach((z, i) => {
    headwall(e, room.onWall('-x', z), e.m.monitors[i % e.m.monitors.length], i === 0)
    const b = room.onWall('-x', z, 0, 1.15)
    wardBed(e, b, { style: 'icu', back: 0.5, linen: i === 1 ? 'made' : 'used', iv: false })
    if (i < 2) curtain(e, room.at(room.x0 + 0.05, z + 1.2, 0), 2.4, room.ceiling, 0.9)
    // Each bay's infusion stand with its pumps, at the bed's upper body.
    if (i !== 1) {
      const tw = room.at(room.x0 + 0.7, z + 0.95, PI)
      infusionTower(e, tw, { pumps: [{ kind: 'vol', drug: 'Ringer Lactate', rate: '100 ml/h', sub: 'VTBI 900 ml' }, { kind: 'syr', drug: 'Morphine PCA', rate: '1 mg bolus', sub: 'Lockout 5 min' }], key: `pacu${i}`, toward: [0, 0.8, 0.6], bags: [['Ringer Lactate', 'Injection IP · 1000 mL']] })
    }
  })
  room.info(room.onWall('-x', zs[0], 0, 1.15), { title: 'Recovery Bay', kind: 'Post-anaesthesia care', body: 'Each recovery bay has a headwall with oxygen, air and suction, a patient monitor on its arm, an infusion stand with the patient\'s pumps and a nurse within sight until the patient is awake, stable and pain-free enough to return to the ward; the first bay is fitted for resuscitation, with a ventilator beside it.', specs: ['ECG, SpO₂, NIBP and capnography', 'Oxygen and suction at every bed', 'Aldrete score before discharge'] })
  // The ventilator at the resuscitation bay.
  const v = room.at(room.x1 - 0.45, zs[0] - 0.4, -PI / 2)
  icuVentilator(e, v, { screen: e.o.screen('vent_PACU', 640, 410, ventScreenPaint('PACU-1', 7701)), side: 1 })
  room.info(v, { title: 'Ventilator · Recovery', kind: 'Post-operative ventilation', body: 'For a patient slow to breathe after anaesthesia: ventilated here in the resuscitation bay until the drugs wear off, or taken on it to the ICU.' })
  wallMonitor(e, room.onWall('+z', 11.6), e.o.screen('pacuCentral', 640, 408, icuMonitorPaint('PACU', 7702, false)), 1.75, 0.2, 0.42)
  const d = room.onWall('+z', 12.4, 0, 0.35)
  desk(e, d, 1.2, 0.6, 0)
  computer(e, d, 0, 0.75, -0.08, 0, e.o.his('pacu', 'PACU Board · Aldrete Scores', 'table'))
  taskChair(e, room.onWall('+z', 12.4, 0, 0.95))
  crashCart(e, room.at(room.x1 - 0.4, -7.0, -PI / 2), e.m.monitors[1])
  room.info(d, { title: 'PACU Nurse Station', kind: 'Recovery nursing', body: 'The recovery nurse watches every bay from here, with the central monitor on the wall and the crash cart and defibrillator beside the desk.' })
  handWashPoint(e, room.onWall('+z', 10.75), 0.5)
  const wc = room.at(room.x1 - 0.32, -8.0, -PI / 2)
  drawerCart(e, wc, 0.6, 1.1, 0.55, 3)
  room.info(wc, { title: 'Blanket & Fluid Warmer', kind: 'Patient warming', body: 'Warmed blankets and fluids for patients who arrive cold from theatre: hypothermia slows waking and raises bleeding and infection risk.' })
  bins(e, room.onWall('-z', 10.9, 0, 0.22), ['yellow', 'red', 'black'])
  sharps(e, room.onWall('-z', 10.9), 1.3)
  wallClock(e, room.onWall('+x', -11.6), 2.35, 0.3)
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
  rack(e, room.onWall('-x', 6.1, 0, 0.47), 1.8, 2.0, 0.45, 5, 'supplies')
  rack(e, room.onWall('-x', 8.3, 0, 0.47), 1.8, 2.0, 0.45, 5, 'linen')
  steelTrolley(e, room.at(12.9, 9.6, -PI / 2))
  room.info(room.onWall('-x', 6.1, 0, 0.47), { title: 'Sterile Instrument Store', kind: 'Sterile supplies', body: 'Sterile instrument sets from the CSSD, drapes and gowns on wire racking, kept at positive pressure and issued first-in, first-out by expiry; sets for OT 3 go through its pass box.' })
  // The pass box's store-side door.
  const pb = room.onWall('-x', 9.6)
  passBox(e, pb)
}

const anaesthesia: Fitter = (e, room) => {
  cupboard(e, room.onWall('-z', 1.6, 0, 0.47), 1.0, 2.0, 0.45, { glass: true, fill: 'medicines', label: 'Anaesthetic Drugs' })
  medFridge(e, room.onWall('-z', 2.9, 0, 0.32), 'Drug Refrigerator · 2–8 °C', 1.4, 0.6)
  baseRun(e, room.onWall('+z', 1.6), 1.2, { fill: 'supplies' })
  const at = room.at(1.25, 2.85, PI / 2)
  drawerCart(e, at, 0.6, 1.0, 0.5, 5)
  room.info(at, { title: 'Difficult Airway Trolley', kind: 'Anaesthesia', body: 'Laryngoscopes, video laryngoscope, bougies, supraglottic airways and the front-of-neck access kit, ready to wheel into any theatre.' })
}

const equipment: Fitter = (e, room) => {
  rack(e, room.onWall('-z', room.cx - 0.5, 0, 0.47), 1.6, 2.0, 0.45, 4, 'supplies')
  for (const [x, kind] of [[room.x1 - 0.3, 'full'], [room.x1 - 0.6, 'full']] as const) cylinder(e, room.at(x, room.z1 - 0.3), 0.09, 1.2, kind)
}

const changing = (female: boolean): Fitter => (e, room) => {
  lockers(e, room.onWall('-x', -23.2, 0, 0.25), 6)
  room.info(room.onWall('-x', -23.2, 0, 0.25), { title: 'Staff Lockers', kind: 'Theatre changing', body: `Surgeons, anaesthetists and theatre staff (${female ? 'women' : 'men'}) leave outdoor clothes here and change into clean scrubs, caps and theatre clogs before entering the semi-restricted zone.` })
  const b = room.at(room.x0 + 1.3, -23.2, PI / 2)
  e.k.box(b, 1.6, 0.04, 0.35, e.o.oak, 0, 0.44, 0)
  for (const s of [-1, 1]) e.k.box(b, 0.04, 0.42, 0.3, e.m.stainless, s * 0.7, 0.22, 0)
  rack(e, room.onWall('+x', -21.6, 0, 0.42), 1.0, 1.9, 0.4, 5, 'linen')
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
