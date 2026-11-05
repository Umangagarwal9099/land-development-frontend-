import type { BasementSpec } from '../basement'
import { BLOCK, GL, L1, PORTAL_H, PORTALS, SLAB } from './plan'

/*
 * Kallakal Square's two basement car-park levels, B1 and B2, under the block, the connector behind
 * it and the forecourt in front: 48.6 × 36.2 m inside the retaining walls, 1 m inside the plot.
 * Aisles run south–north (along x), parallel to the block, with cross aisles at both ends.
 *
 *   ramps:  the vehicle portals in the block's south end (the entry first from the road, the exit
 *           beyond it) now lead down as well as up: 3.5 m in,
 *           behind the height bars, the one-way IN and OUT ramps fall north at 1:6 to B1, landing
 *           in a turning area that opens onto the east cross aisle. A two-way ramp along the back
 *           wall falls north from the west cross aisle to B2.
 *   access: two lifts and a stair from B2 up to the drum lobby, opening in its back wall; below,
 *           onto the north aisle. Fire stairs under the north tower and in the south-west corner;
 *           the pump room (B2) and the LT electrical room (B1) in the north-east corner.
 */

const X0 = -24.3
const X1 = 24.3
const Z0 = -24.2
const Z1 = 12.0
/** The west and east cross aisles, the bands' ends. */
const W: [number, number] = [-21.1, -15.1]
const E: [number, number] = [13.3, 19.3]
const START = BLOCK.x0 + 3.5
const RAMP_FOOT = 7.8
const B2_TOP = -14.0
const B2_FOOT = 8.8
const IN = PORTALS.find((p) => p.label === 'in')!
const OUT = PORTALS.find((p) => p.label === 'out')!
/** The band the two ramps take across the block's south end, the exit's side and the entry's. */
const BAND = { z0: PORTALS[0].z0, z1: PORTALS[1].z1 }
/** The drum lobby's back wall, its face on the lobby (see building.ts). */
const LOBBY_WALL = BLOCK.z1 + 0.15

export const A01_BASEMENT: BasementSpec = {
  name: 'Kallakal Square',
  box: { x0: X0, x1: X1, z0: Z0, z1: Z1 },
  colX: [W[1], -7.0, 1.1, 9.2, E[0], E[1]],
  colZ: [-18.6, -12.6, 0.0, 10.8],
  ramps: [
    { id: 'in', from: 0, to: -1, down: '+x', s0: START, across: [IN.z0 + 0.2, IN.z1 - 0.2], top: 0.022, slope: 1 / 6, traffic: 'in', open: 19.2, headroom: 2.4, roof: PORTAL_H },
    { id: 'out', from: 0, to: -1, down: '+x', s0: START, across: [OUT.z0 + 0.2, OUT.z1 - 0.2], top: 0.022, slope: 1 / 6, traffic: 'out', open: 19.2, headroom: 2.4, roof: PORTAL_H },
    { id: 'b2', from: -1, to: -2, down: '+x', s0: B2_TOP, across: [Z0 + 0.2, Z0 + 5.7], top: -3.3, slope: 1 / 6, traffic: 'two-way', headroom: 2.4 },
  ],
  cores: [
    { rect: { x0: E[1], x1: X1, z0: 6.5, z1: Z1 }, kind: 'stair', door: '-x', label: 'STAIR 1' },
    { rect: { x0: X0, x1: W[0], z0: Z0, z1: Z0 + 6 }, kind: 'stair', door: '+x', label: 'STAIR 2' },
  ],
  rooms: [
    { rect: { x0: E[1], x1: X1, z0: Z0, z1: Z0 + 5 }, label: 'LT ELECTRICAL ROOM', levels: [-1], door: '-x' },
    { rect: { x0: E[1], x1: X1, z0: Z0, z1: Z0 + 6 }, label: 'FIRE PUMP ROOM', levels: [-2], door: '-x' },
  ],
  aisles: [
    { rect: { x0: W[0], x1: W[1], z0: Z0, z1: Z1 } },
    { rect: { x0: E[0], x1: E[1], z0: Z0, z1: Z1 } },
    { rect: { x0: B2_FOOT, x1: E[0], z0: Z0, z1: Z0 + 5.9 }, flow: '+x' },
    { rect: { x0: W[1], x1: E[0], z0: -18.3, z1: -12.3 } },
    { rect: { x0: RAMP_FOOT, x1: E[0], z0: BAND.z0, z1: BAND.z1 } },
    { rect: { x0: W[1], x1: E[0], z0: 4.95, z1: 10.8 } },
    { rect: { x0: W[1], x1: RAMP_FOOT, z0: -7.0, z1: BAND.z1 }, flow: '+x', levels: [-2] },
  ],
  rows: [
    { rect: { x0: X0 + 0.3, x1: W[0], z0: Z0 + 6, z1: Z1 }, face: '+z', parallel: true },
    { rect: { x0: E[1], x1: X1, z0: Z0, z1: Z1 }, face: '+x' },
    { rect: { x0: W[1], x1: E[0], z0: -12.3, z1: -9.8 }, face: '+x', parallel: true },
    { rect: { x0: W[1], x1: RAMP_FOOT, z0: BAND.z0, z1: -7.0 }, face: '+x', parallel: true, levels: [-2] },
    { rect: { x0: W[1], x1: E[0], z0: -0.05, z1: 4.95 }, face: '-z' },
  ],
  access: {
    rect: { x0: -10.6, x1: -0.6, z0: -0.8, z1: LOBBY_WALL },
    face: '+z',
    ground: { y: GL + 0.012, top: L1 - SLAB, label: 'Drum lobby', frontWall: false },
    lifts: [
      // Its call buttons on the far side, clear of the helix's column.
      { x: -9.4, z: 4.0, w: 1.6, d: 1.4, door: '+z', call: -1 },
      { x: -1.8, z: 4.0, w: 1.6, d: 1.4, door: '+z' },
    ],
    stair: { zone: { x0: -7.0, x1: -4.2, z0: -0.6, z1: 4.65 }, entry: '+z', door: '+z', at: -5.6 },
  },
  occupancy: 0.76,
  seed: 4403,
}
