import type { BasementSpec } from '../basement'
import { PORTALS } from './building'
import { GL, REAR_Z, SHOPFRONT } from './plan'

/*
 * The mall's two basement car-park levels, B1 and B2, under the whole building and the service
 * road and forecourt beyond it: 43.8 × 51.9 m inside the retaining walls, 1 m inside the plot.
 * Aisles run west–east (along z), with cross aisles along the back and the front.
 *
 *   ramps:  the one-way IN and OUT ramps start at the portals in the rear wall (building.ts) and
 *           fall east under the ground floor at 1:6 to B1; between them a two-way ramp from the
 *           back cross aisle falls east to B2.
 *   cores:  the shoppers' lifts under the centre of the mall, opening onto the west aisle; fire
 *           stairs in the south-west and north-east corners; the pump room (B2) and the LT
 *           electrical room (B1) at the north-west.
 *   grid:   8.1 m along the aisles, columns between the bays on the row edges.
 */

const X0 = -21.9
const X1 = 21.9
const Z0 = -32.9
const Z1 = 19.0
/** The back and front cross aisles. */
const SC = -26.9
const NC = 13.0
const PORTAL = REAR_Z - SHOPFRONT
const inA: [number, number] = [PORTALS.in - PORTALS.w / 2, PORTALS.in + PORTALS.w / 2]
const outA: [number, number] = [PORTALS.out - PORTALS.w / 2, PORTALS.out + PORTALS.w / 2]
/** Where the IN and OUT ramps land on B1, and where the ramp to B2 lands. */
const FOOT = 0.8
const B2FOOT = -4.1

export const MALL_BASEMENT: BasementSpec = {
  name: 'Kallakal Mall',
  box: { x0: X0, x1: X1, z0: Z0, z1: Z1 },
  colX: [-16.9, -10.9, -5.9, -2.5, 4.0, 11.5, 15.5, 19.4],
  colZ: [SC, -18.8, -10.7, -2.6, 5.5, NC],
  ramps: [
    { id: 'in', from: 0, to: -1, down: '+z', s0: PORTAL, across: [inA[0] + 0.0, inA[1]], top: GL, slope: 1 / 6, traffic: 'in', open: 20.5, headroom: 2.4 },
    { id: 'out', from: 0, to: -1, down: '+z', s0: PORTAL, across: [outA[0], outA[1]], top: GL, slope: 1 / 6, traffic: 'out', open: 20.5, headroom: 2.4 },
    { id: 'b2', from: -1, to: -2, down: '+z', s0: SC, across: [5.05, 10.45], top: -3.3, slope: 1 / 6, traffic: 'two-way', headroom: 2.4 },
  ],
  cores: [
    { rect: { x0: -10.9, x1: -5.9, z0: -1.0, z1: 5.0 }, kind: 'lifts', door: '-x', label: 'LIFTS 1–2' },
    { rect: { x0: X0, x1: -17.9, z0: Z0, z1: SC }, kind: 'stair', door: '+x', label: 'STAIR 1' },
    { rect: { x0: 17.9, x1: X1, z0: NC, z1: Z1 }, kind: 'stair', door: '-x', label: 'STAIR 2' },
  ],
  rooms: [
    { rect: { x0: X0, x1: -16.9, z0: 7.0, z1: NC }, label: 'LT ELECTRICAL ROOM', levels: [-1], door: '+x' },
    { rect: { x0: X0, x1: -16.9, z0: 5.0, z1: NC }, label: 'FIRE PUMP ROOM', levels: [-2], door: '+x' },
  ],
  aisles: [
    { rect: { x0: -17.9, x1: X1, z0: Z0, z1: SC } },
    { rect: { x0: X0, x1: 17.9, z0: NC, z1: Z1 } },
    { rect: { x0: -16.9, x1: -10.9, z0: SC, z1: NC } },
    { rect: { x0: -5.9, x1: -2.5, z0: SC, z1: NC }, flow: '+z' },
    { rect: { x0: 0.0, x1: 4.0, z0: FOOT, z1: NC }, flow: '+z' },
    { rect: { x0: 4.0, x1: 11.5, z0: B2FOOT, z1: NC } },
    { rect: { x0: 11.5, x1: 15.5, z0: FOOT, z1: NC }, flow: '-z' },
    { rect: { x0: 15.5, x1: 19.4, z0: SC, z1: NC }, flow: '+z' },
    { rect: { x0: 0.0, x1: 4.0, z0: SC, z1: FOOT }, flow: '+z', levels: [-2] },
    { rect: { x0: 11.5, x1: 15.5, z0: SC, z1: FOOT }, flow: '-z', levels: [-2] },
  ],
  rows: [
    { rect: { x0: X0, x1: -16.9, z0: SC, z1: NC }, face: '-x' },
    { rect: { x0: -10.9, x1: -5.9, z0: SC, z1: NC }, face: '+x' },
    { rect: { x0: -2.5, x1: 0.0, z0: SC, z1: NC }, face: '+z', parallel: true },
    { rect: { x0: 19.4, x1: X1, z0: SC, z1: NC }, face: '+z', parallel: true },
  ],
  occupancy: 0.78,
  seed: 4402,
}
