import type { BasementSpec } from '../basement'
import { GL, RAMP } from './plan'

/*
 * Terranova Hotel's two basement car-park levels, B1 and B2, under the podium and the forecourt:
 * 36.9 × 49.6 m inside the retaining walls, 0.5 m inside the plot's side boundaries, from under the
 * podium's middle to under the paved front. They take all the parking the surface car park behind the hotel
 * used to hold, and more.
 *
 *   ramps:  the two-way ramp from the south lane falls west at 1:6 beside the south block, its mouth
 *           open and the rest covered (site.ts), landing on B1 in the back cross aisle; from there
 *           a two-way ramp along the north wall falls east to B2, landing in a lane to the front
 *           cross aisle.
 *   access: two lifts and a stair from B2 up to the lobby, opening in its back wall; below, onto
 *           the middle cross aisle. The LT electrical and HVAC plant rooms on B1, the fire pump
 *           room and the DG set and transformer room on B2, in the north-east corner, clear of
 *           the ramps (there is no utility yard above ground).
 *   layout: two-way aisles 6 m wide running east–west either side of a double row of 90° bays,
 *           cross aisles at the back, the middle (before the lifts) and the front; parallel bays
 *           along the north ramp's wall; on B2, where the ramp from the ground stands on B1, a row
 *           of bays along the south wall.
 */

const X0 = -18.45
const X1 = 18.45
const Z0 = 1.0
const Z1 = 50.6
/** The aisles running east–west, and the bays' rows between them. */
const A1: [number, number] = [-12.25, -6.25]
const A2: [number, number] = [3.75, 9.75]
const MIDROW = -1.25
/** The cross aisles: at the back (where the ramp lands), before the lifts, at the front. */
const BACK: [number, number] = [Z0, 8.0]
const MID: [number, number] = [25.15, 31.15]
const FRONT: [number, number] = [44.5, Z1]
/** The ramp to B2 along the north wall. */
const NORTH: [number, number] = [12.45, 18.25]
const B2_TOP = BACK[1]
const B2_FOOT = B2_TOP + 22.92

export const HOTEL_BASEMENT: BasementSpec = {
  name: 'Terranova Hotel',
  box: { x0: X0, x1: X1, z0: Z0, z1: Z1 },
  colX: [A1[0], A1[1], MIDROW, A2[0], A2[1], NORTH[0] - 0.2],
  colZ: [BACK[1], 16.1, 24.2, MID[1], 39.25],
  ramps: [
    {
      id: 'drive', from: 0, to: -1, down: '-z', s0: RAMP.top, across: [RAMP.x0, RAMP.x1], top: 0.02, slope: 1 / 6,
      // Cars keep left: going down (west), the south lane; coming up, the north one.
      traffic: 'two-way', downSide: 0, open: 22.92, headroom: 2.4,
    },
    { id: 'b2', from: -1, to: -2, down: '+z', s0: B2_TOP, across: NORTH, top: -3.3, slope: 1 / 6, traffic: 'two-way', downSide: 1, headroom: 2.4 },
  ],
  cores: [],
  rooms: [
    { rect: { x0: NORTH[0] - 0.2, x1: X1, z0: B2_FOOT + 0.1, z1: 37.5 }, label: 'LT ELECTRICAL ROOM', levels: [-1], door: '-x' },
    { rect: { x0: NORTH[0] - 0.2, x1: X1, z0: 37.5, z1: FRONT[0] }, label: 'HVAC PLANT ROOM', levels: [-1], door: '+z' },
    { rect: { x0: NORTH[0] - 0.2, x1: X1, z0: Z0, z1: 4.4 }, label: 'FIRE PUMP ROOM', levels: [-2], door: '-x' },
    { rect: { x0: NORTH[0] - 0.2, x1: X1, z0: 4.4, z1: BACK[1] }, label: 'DG SET & TRANSFORMER ROOM', levels: [-2], door: '-x' },
  ],
  aisles: [
    { rect: { x0: X0, x1: X1, z0: BACK[0], z1: BACK[1] }, levels: [-1] },
    { rect: { x0: A1[0], x1: NORTH[0] - 0.2, z0: BACK[0], z1: BACK[1] }, levels: [-2] },
    { rect: { x0: A1[0], x1: A1[1], z0: BACK[1], z1: FRONT[0] } },
    { rect: { x0: A2[0], x1: A2[1], z0: BACK[1], z1: FRONT[0] } },
    { rect: { x0: A1[1], x1: NORTH[0] - 0.2, z0: MID[0], z1: MID[1] } },
    { rect: { x0: X0, x1: X1, z0: FRONT[0], z1: FRONT[1] } },
    { rect: { x0: NORTH[0] - 0.2, x1: X1, z0: B2_FOOT, z1: FRONT[0] }, levels: [-2] },
  ],
  rows: [
    { rect: { x0: A1[1], x1: MIDROW, z0: BACK[1], z1: MID[0] }, face: '+x' },
    { rect: { x0: MIDROW, x1: A2[0], z0: BACK[1], z1: MID[0] }, face: '-x' },
    { rect: { x0: A1[1], x1: MIDROW, z0: MID[1], z1: FRONT[0] }, face: '+x' },
    { rect: { x0: MIDROW, x1: A2[0], z0: MID[1], z1: FRONT[0] }, face: '-x' },
    { rect: { x0: A2[1], x1: NORTH[0] - 0.2, z0: BACK[1], z1: MID[0] }, face: '+z', parallel: true },
    { rect: { x0: A2[1], x1: NORTH[0] - 0.2, z0: MID[1], z1: FRONT[0] }, face: '+z', parallel: true, levels: [-2] },
    // On B1 the ramp from the ground stands along the south wall; on B2 a row of bays does.
    { rect: { x0: A1[0] - 5.0, x1: A1[0], z0: MID[1] + 0.2, z1: FRONT[0] }, face: '-x', levels: [-1] },
    { rect: { x0: A1[0] - 5.0, x1: A1[0], z0: BACK[0], z1: FRONT[0] }, face: '-x', levels: [-2] },
  ],
  access: {
    rect: { x0: -3.9, x1: 3.9, z0: 19.6, z1: 25.15 },
    face: '+z',
    ground: { y: GL + 0.012, top: 4.2, label: 'Hotel lobby', frontWall: false },
    lifts: [
      { x: -2.6, z: 24.25, w: 1.6, d: 1.4, door: '+z' },
      { x: 2.6, z: 24.25, w: 1.6, d: 1.4, door: '+z', call: -1 },
    ],
    stair: { zone: { x0: -1.4, x1: 1.4, z0: 19.8, z1: 24.95 }, entry: '+z', door: '+z', at: 0.0 },
  },
  occupancy: 0.72,
  seed: 4404,
}
