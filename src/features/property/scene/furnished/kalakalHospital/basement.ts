import type { BasementSpec } from '../basement'
import { RAMP } from './plan'

/*
 * The hospital's two basement car-park levels, B1 and B2, under the ward block, the rear yard and
 * the drop-off lane: 37.1 × 65.4 m inside the retaining walls, set 0.5 m inside the plot. Aisles
 * run north–south across the plot's depth in bands, with cross aisles at the west and east ends.
 *
 *   ramps:  the covered ramp from the drive (plan RAMP) falls east at 1:6, two-way, under its cover
 *           for its first 18 m, landing on B1 in the east cross aisle; from there a second ramp,
 *           under the drop-off lane, falls west to B2.
 *   access: a bed lift and a stair from B2 up to the back of the main entrance lobby, where they
 *           open beside each other facing the doors; a fire stair at the back by the yard; the fire
 *           pump room on B2, the LT electrical room on B1.
 *   grid:   8.1 m along the bands (three bays between columns), 16 m clear spans across them on
 *           deep beams; columns stand between bays at the back and front of each row.
 */

const W0 = -18.55
const W1 = 18.55
/** The ends of the parking bands: the west cross aisle, the east cross aisle and its parallel bays. */
const XW = RAMP.x0
const XE = 9.7
const XP = 15.7

export const HOSPITAL_BASEMENT: BasementSpec = {
  name: 'Kallakal Hospital',
  box: { x0: W0, x1: W1, z0: -44.55, z1: 20.85 },
  colX: [XW, -5.1, 3.0, XE, XP - 0.3],
  colZ: [-39.55, -33.95, -28.05, -23.05, -12.05, -1.05, 3.95, 8.95, 14.95],
  ramps: [
    {
      id: 'drive', from: 0, to: -1, down: '+x', s0: RAMP.x0, across: [RAMP.z0 + 0.25, RAMP.z1 - 0.25], top: 0.02, slope: 1 / 6,
      traffic: 'two-way', open: RAMP.x1 - RAMP.x0, headroom: 2.2,
    },
    { id: 'b2', from: -1, to: -2, down: '-x', s0: XE, across: [15.15, 20.65], top: -3.3, slope: 1 / 6, traffic: 'two-way', headroom: 2.4 },
  ],
  cores: [
    { rect: { x0: XE, x1: XE + 4.5, z0: -44.55, z1: -39.55 }, kind: 'stair', door: '+z', label: 'STAIR 2' },
  ],
  rooms: [
    { rect: { x0: XW, x1: XW + 5, z0: -44.55, z1: -39.55 }, label: 'LT ELECTRICAL ROOM', levels: [-1], door: '+z' },
    { rect: { x0: XW, x1: XW + 8, z0: -44.55, z1: -39.55 }, label: 'FIRE PUMP ROOM', levels: [-2], door: '+z' },
  ],
  aisles: [
    { rect: { x0: W0, x1: XW, z0: -44.55, z1: 20.85 }, flow: '+z' },
    { rect: { x0: XE, x1: XP, z0: -39.55, z1: 20.85 } },
    { rect: { x0: XW, x1: XE, z0: -39.55, z1: -33.95 }, flow: '-x' },
    { rect: { x0: XW, x1: XE, z0: -23.05, z1: -17.05 } },
    { rect: { x0: XW, x1: XE, z0: -7.05, z1: -1.05 } },
    { rect: { x0: XW, x1: XE, z0: 8.95, z1: 14.95 } },
  ],
  rows: [
    { rect: { x0: XW, x1: W1, z0: -44.55, z1: -39.55 }, face: '-z' },
    { rect: { x0: XW, x1: XE, z0: -33.95, z1: -28.95 }, face: '+z', levels: [-2] },
    { rect: { x0: XW, x1: XE, z0: -28.05, z1: -23.05 }, face: '-z' },
    { rect: { x0: XW, x1: XE, z0: -17.05, z1: -12.05 }, face: '+z' },
    { rect: { x0: XW, x1: XE, z0: -12.05, z1: -7.05 }, face: '-z' },
    { rect: { x0: XW, x1: XE, z0: -1.05, z1: 3.95 }, face: '+z' },
    { rect: { x0: XW, x1: XE, z0: 3.95, z1: 8.95 }, face: '-z' },
    { rect: { x0: XP + 0.25, x1: W1 - 0.1, z0: -39.55, z1: 20.85 }, face: '+z', parallel: true },
  ],
  access: {
    rect: { x0: 2.0, x1: XE, z0: 5.0, z1: 8.95 },
    face: '+z',
    ground: { y: 0.162, top: 4.3, label: 'Main lobby', frontWall: true },
    lifts: [{ x: 3.3, z: 7.55, w: 1.6, d: 2.3, door: '+z' }],
    stair: { zone: { x0: 4.6, x1: 9.5, z0: 5.2, z1: 8.75 }, entry: '+x', door: '+z', at: 8.9 },
  },
  occupancy: 0.74,
  seed: 4401,
}
