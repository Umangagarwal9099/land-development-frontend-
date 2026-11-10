import { PI } from '../../../kit'
import { signPanel } from '../../erKit'
import { extinguishers, sanitiserStand, planter } from '../../opd/equipment/common'
import { floorBoard } from '../../opd/paints'
import type { Fitter } from '../../opd/rooms/types'
import { ensuite, ensuitePremium } from '../washroom'
import { wallClock } from '../kit'

/*
 * The main block's core on every floor: the lift lobby in front of the three main lifts, with
 * the floor's number and what is on it on the end wall facing the lifts' doors, hand-rub at the
 * doors, the fire extinguishers; and the washrooms en suite to every inpatient room and suite.
 */

/** What each floor's board in the main lift lobby lists under its name. */
const FLOOR_BOARD: Record<number, [string, string[]]> = {
  0: ['Main Reception · Patient Services', ['Main Reception & Admissions', 'Insurance · Billing · Cash · Pharmacy', 'Emergency (24 h) →  ·  OPD ←']],
  1: ['Inpatient Rooms', ['Single & Double Rooms 101 – 107', 'Nurses\' Station · Relatives\' Lounge', 'OPD Consultations ←']],
  2: ['International Wing · ICU', ['International Suites 211 – 213', 'Intensive Care Unit · Ventilator Rooms', 'ICU Relatives\' Waiting · Counselling']],
  3: ['Operation Theatres', ['Operation Theatres 1 – 3', 'Pre-op Holding · Recovery (PACU)', 'OT Relatives\' Waiting']],
}

const liftLobby: Fitter = (e, room) => {
  const [title, lines] = FLOOR_BOARD[room.level]
  // The floor's board on the lobby's end wall, facing along the lifts' doors.
  const wall = room.onWall('-x', (room.z0 + room.z1) / 2)
  const mat = e.o.sign(`mainfloor_${room.level}`, 1024, 352, floorBoard(room.level === 0 ? 'G' : String(room.level), title, lines))
  signPanel(e, wall, 1.5, 0.52, mat, 0, 1.75, 0.02, 0, 0.02, e.o.navy)
  wallClock(e, room.onWall('-x', room.z1 - 0.35), 2.45, 0.28)
  // Hand-rub on its stand where the lobby meets the corridor; the extinguishers by the lifts.
  sanitiserStand(e, room.at(room.x0 + 0.35, room.z0 + 0.35, PI / 2))
  extinguishers(e, room.onWall('-x', room.z1 - 0.45))
  if (room.level !== 1 && room.level !== 2) planter(e, room.at(room.x1 - 0.35, room.z1 - 0.35))
}

export const MAIN_CORE: Record<string, Fitter> = {
  main_lift_lobby: liftLobby,
  ensuite,
  ensuite_premium: ensuitePremium,
}
