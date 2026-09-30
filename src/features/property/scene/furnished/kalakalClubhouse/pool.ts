import { ConeGeometry, MeshPhysicalMaterial, MeshStandardMaterial } from 'three'
import { FACE, PI } from '../kit'
import { DECK_Y, LANES, POOL, WATER_Y, type Ctx } from './architecture'
import { scoreboard as scoreboardPaint } from './paints'
import { bench, bleachers, ladder, laneLines, laneNumberMat, laneReel, lightPole, paceClock, paintedMat, rinseShower, startingBlock, trainingRack } from './pieces'

const { north, east, west } = FACE

/**
 * The 25 m, six-lane training pool: a deck-level basin 2 m deep, lanes of 2.5 m with anti-wave
 * lines, starting blocks and touch pads at the west end, turns at the east, athlete stands along
 * the back, and the timing board, coaches' platform and training-kit store on the starting deck.
 */
export function buildPool(ctx: Ctx) {
  const { out: k, c, lighting } = ctx
  const p = { k, c }
  const r = k.root
  const { x0, x1, z0, z1 } = POOL
  const s = 0.3

  // Anti-slip porcelain deck all round, finished at the water's edge by the overflow grating.
  const deck = (a0: number, a1: number, b0: number, b1: number) =>
    k.box(r, a1 - a0, DECK_Y, b1 - b0, k.finish('deck', (a1 - a0) / 0.6, (b1 - b0) / 1.2, 0.85), (a0 + a1) / 2, DECK_Y / 2, (b0 + b1) / 2, false)
  deck(-24, x0 - s, -33, -10.3)
  deck(x1 + s, 14.5, -33, -10.3)
  deck(x0 - s, x1 + s, -33, z0 - s)
  deck(x0 - s, x1 + s, z1 + s, -10.3)
  const grate = (w: number, d: number, x: number, z: number) => k.box(r, w, DECK_Y, d, c.grating, x, DECK_Y / 2, z, false)
  grate(x1 - x0 + 2 * s, s, 0, z0 - s / 2)
  grate(x1 - x0 + 2 * s, s, 0, z1 + s / 2)
  grate(s, z1 - z0, x0 - s / 2, (z0 + z1) / 2)
  grate(s, z1 - z0, x1 + s / 2, (z0 + z1) / 2)

  // Water: a clear surface over a faint blue body, so the lane lines read through it.
  lighting.glow(c.water, 0.35)
  k.box(r, x1 - x0, 0.02, z1 - z0, c.water, 0, WATER_Y - 0.01, (z0 + z1) / 2, false)
  const body = new MeshPhysicalMaterial({ color: '#1f86b0', transparent: true, opacity: 0.18, roughness: 0.1, depthWrite: false })
  k.box(r, x1 - x0 - 0.02, 0.02, z1 - z0 - 0.02, body, 0, -1.0, (z0 + z1) / 2, false)

  // Underwater lights along both long walls, and touch pads on the starting wall.
  for (let x = -10; x <= 10; x += 2.5)
    for (const [z, dir] of [[z1 - 0.004, -1], [z0 + 0.004, 1]] as const) {
      const d = k.cyl(r, 0.14, 0.14, 0.02, c.poolLight, x, -0.7, z + dir * 0.01, 20)
      d.rotation.x = PI / 2
    }
  for (const lz of LANES) k.box(r, 0.012, 0.9, 2.3, c.grip, x0 + 0.008, -0.35, lz, false)

  // Lane lines: red within 5 m of each wall, blue and white between, yellow along the walls.
  const lines = [z1 - 0.25, ...LANES.slice(1).map((lz) => lz + 1.25), z0 + 0.25]
  laneLines(p, x0, x1, lines, WATER_Y + 0.01)

  // Starting blocks at the west end, lane numbers on the turn end, ladders on the long walls.
  LANES.forEach((lz, i) => {
    startingBlock(p, x0 - 0.45, lz, east, i + 1, DECK_Y)
    const plate = k.at(x1 + 0.62, lz, west, DECK_Y)
    k.box(plate, 0.34, 0.34, 0.03, laneNumberMat(p, i + 1), 0, 0.2, 0).rotation.x = -0.9
  })
  for (const x of [-10.8, 10.8]) {
    ladder(p, x, z1, 0, DECK_Y)
    ladder(p, x, z0, PI, DECK_Y)
  }

  // Backstroke flags 5 m from each wall.
  const flagCols = ['#c8262b', '#f2f2f0', '#1b4fb8'].map((color) => new MeshStandardMaterial({ color, roughness: 0.8 }))
  for (const fx of [x0 + 5, x1 - 5]) {
    for (const fz of [z1 + 1.1, z0 - 0.9]) k.cyl(r, 0.03, 0.03, 1.9, c.steel, fx, DECK_Y + 0.95, fz, 10)
    const len = z1 - z0 + 2.0
    k.cyl(r, 0.006, 0.006, len, c.steel, fx, DECK_Y + 1.85, (z0 + z1) / 2 + 0.1, 4).rotation.x = PI / 2
    for (let t = 0.3; t < len - 0.2; t += 0.42) {
      const f = k.mesh(new ConeGeometry(0.1, 0.24, 3), flagCols[Math.floor(t / 0.42) % 3], r, fx, DECK_Y + 1.72, z0 - 0.9 + t, false)
      f.rotation.x = PI
    }
  }

  // Athlete stands along the back deck.
  bleachers(p, 0, -30.35, 0, 20, DECK_Y)

  // Timing board facing down the pool, and pace clocks at both ends.
  const board = paintedMat(p, 'scoreboard', 1024, 512, scoreboardPaint, { roughness: 0.3 })
  board.emissiveMap = board.map
  board.emissive.set('#ffffff')
  board.emissiveIntensity = 0.9
  lighting.glow(board, 0.8)
  const sb = k.at(-23.35, -21, east, DECK_Y)
  for (const dx of [-2.6, 2.6]) k.box(sb, 0.2, 5.2, 0.2, c.frame, dx, 2.6, -0.1)
  k.box(sb, 6.6, 3.3, 0.22, c.frame, 0, 3.5, 0)
  k.box(sb, 6.3, 3.1, 0.01, board, 0, 3.5, 0.116, false)
  paceClock(p, x1 + 1.35, z0 - 1.0, west, DECK_Y)
  paceClock(p, x0 - 1.7, z0 - 1.0, east, DECK_Y)

  // Coaches' platform: raised teak deck in the starting corner, desk, chairs and a glass rail.
  const cp = k.at(-21.1, -31.3, 0, DECK_Y)
  k.box(cp, 5.0, 0.45, 3.0, k.m.teak, 0, 0.225, 0)
  for (let i = 0; i < 3; i++) k.box(cp, 0.3, 0.15 * (i + 1), 1.2, k.m.teak, 2.65 + 0.3 * (2 - i), 0.075 * (i + 1), 0.6)
  k.box(cp, 0.02, 1.0, 1.6, k.m.glass, 2.45, 0.95, -0.6, false)
  k.box(cp, 0.04, 0.04, 1.6, c.steel, 2.45, 1.45, -0.6)
  const deskY = DECK_Y + 0.45
  const desk = k.at(-20.0, -31.3, east, deskY)
  k.box(desk, 2.2, 0.04, 0.7, k.m.walnut, 0, 0.74, 0)
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.cyl(desk, 0.02, 0.02, 0.72, c.steel, a * 1.02, 0.36, b * 0.3, 8)
  k.box(desk, 0.5, 0.32, 0.03, c.frame, -0.5, 0.95, -0.2)
  k.box(desk, 0.46, 0.28, 0.005, c.display, -0.5, 0.95, -0.217, false)
  k.box(desk, 0.25, 0.012, 0.18, c.frame, 0.5, 0.77, 0)
  for (const dz of [-31.9, -30.7]) {
    const ch = k.at(-20.9, dz, east, deskY)
    k.cyl(ch, 0.03, 0.03, 0.42, c.steel, 0, 0.21, 0, 8)
    k.soft(ch, 0.48, 0.08, 0.46, 0.03, c.pad, 0, 0.46, 0)
    k.soft(ch, 0.46, 0.4, 0.07, 0.03, c.pad, 0, 0.72, -0.2)
  }

  // Timing console and starter's podium beside the blocks.
  const tc = k.at(-17.4, -11.2, north, DECK_Y)
  k.box(tc, 1.8, 0.05, 0.7, c.white, 0, 0.74, 0)
  for (const e of [-1, 1]) k.box(tc, 0.05, 0.72, 0.66, c.steel, e * 0.85, 0.36, 0)
  k.box(tc, 0.42, 0.28, 0.02, c.frame, -0.4, 0.92, -0.1).rotation.x = -0.3
  k.box(tc, 0.4, 0.26, 0.005, c.display, -0.4, 0.92, -0.09, false).rotation.x = -0.3
  k.box(tc, 0.5, 0.1, 0.35, c.frame, 0.45, 0.82, 0)
  const sp = k.at(-14.3, -12.1, east, DECK_Y)
  k.box(sp, 0.6, 0.9, 0.5, c.white, 0, 0.45, 0)
  k.box(sp, 0.64, 0.04, 0.54, c.steel, 0, 0.92, 0)
  k.cyl(sp, 0.02, 0.02, 1.4, c.steel, 0.2, 1.62, 0, 8)
  k.mesh(new ConeGeometry(0.16, 0.28, 16, 1, true), c.frame, sp, 0.2, 2.35, 0.1).rotation.x = PI / 2
  k.sphere(sp, 0.05, new MeshStandardMaterial({ color: '#ff6a3d', emissive: '#ff3a1a', emissiveIntensity: 1.5 }), -0.2, 1.0, 0)

  // Training kit store and lane-line reel on the starting deck.
  trainingRack(p, -23.35, -14.4, east)
  trainingRack(p, -23.35, -16.6, east)
  laneReel(p, -19.4, -26.6, 0)
  laneReel(p, -19.4, -23.9, 0)

  // Poolside benches along the clubhouse, rinse showers by the changing-room doors.
  for (const x of [-11.5, 0, 11]) bench(p, x, -10.85, north, 3.0, DECK_Y, c.velvet)
  for (const x of [-4.2, 4.2]) rinseShower(p, x, -11.5, DECK_Y)

  // Deck lighting: floodlight poles behind the stands and along the starting deck.
  for (const x of [-12, -4, 4, 12]) lightPole(p, x, -33.6, 0, 0)
  for (const z of [-28, -16]) lightPole(p, -25.2, z, east, 0)

  // Tempered-glass balustrade between the pool deck and the garden, with a gate.
  for (let z = -33; z < -10.3; z += 1.5) {
    if (z > -12.6 && z < -11.1) continue
    const len = Math.min(1.5, -10.3 - z)
    k.box(r, 0.02, 1.15, len - 0.06, k.m.glass, 14.5, DECK_Y + 0.62, z + len / 2, false)
    k.box(r, 0.05, 1.2, 0.05, c.steel, 14.5, DECK_Y + 0.6, z)
  }
  k.box(r, 0.05, 0.04, 22.7, c.steel, 14.5, DECK_Y + 1.22, -21.65)
}
