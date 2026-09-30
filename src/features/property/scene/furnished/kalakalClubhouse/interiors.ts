import { MeshStandardMaterial } from 'three'
import { FACE, FLOOR_Y, PI } from '../kit'
import type { Ctx } from './architecture'
import { INT_H } from './architecture'
import { airHockeyTop, nameplate, screenImage } from './paints'
import {
  adjustableBench, airHockey, basinCounter, bench, bike, cableTrainer, chessTable, crossTrainer, cueRack, display, dumbbellRack,
  carrom, consoleStation, dartboard, drumPendant, foosball, gamesTable, gameShelves, kettlebellRack, lockerBank, paintedMat, poolTable, powerRack, pressMachine, rower,
  gamingChair, pottedPlant, print, racingSim, showerCubicle, tableTennis, barrier, treadmill, yogaMat,
} from './pieces'

const { north, south, east, west } = FACE

export function buildLobby(ctx: Ctx) {
  const { k, c } = ctx
  const { m } = k
  const r = k.root

  // Reception: a honed stone wall with the club's name in bronze letters, and a simple stone desk.
  k.box(r, 8.2, INT_H - 0.25, 0.08, k.finish('travertine', 7, 2.6, 0.6), 0, FLOOR_Y + (INT_H - 0.25) / 2, 5.12)
  const name = paintedMat(ctx, 'nameplate', 1024, 256, nameplate, { transparent: true, roughness: 0.35, metalness: 0.6 })
  k.box(r, 3.2, 0.8, 0.005, name, 0, FLOOR_Y + 2.3, 5.17, false)

  const desk = k.at(0, 7.3, south)
  k.box(desk, 4.6, 0.06, 0.8, m.basalt, 0, 0.03, 0)
  k.box(desk, 4.6, 1.02, 0.14, c.statuario, 0, 0.57, 0.33)
  k.box(desk, 4.6, 0.04, 0.34, m.oak, 0, 1.1, 0.33)
  k.box(desk, 4.5, 0.04, 0.66, m.oak, 0, 0.75, -0.06)
  for (const s of [-1, 1]) {
    k.box(desk, 0.1, 1.08, 0.8, c.statuario, s * 2.25, 0.57, 0)
    const mon = k.at(s * 0.9, 7.1, 0)
    k.box(mon, 0.56, 0.34, 0.03, c.frame, 0, 1.2, 0)
    k.box(mon, 0.52, 0.3, 0.005, c.display, 0, 1.2, -0.017, false)
    k.deskChair(s * 0.9, 6.35, south)
  }

  // Two conversation groups either side of the axis.
  for (const s of [-1, 1]) {
    const x = s * 4.9
    k.rug(x, 11.5, 3.3, 3.8, '#d6ccbb', '#8e7453', 71 + s)
    k.sofa(s * 6.35, 11.5, s < 0 ? east : west, 2.6, 0.95, m.boucle)
    k.loungeChair(s * 3.4, 10.4, s < 0 ? west : east, m.walnut, m.leather)
    k.loungeChair(s * 3.4, 12.6, s < 0 ? west : east, m.walnut, m.leather)
    k.drumTable(x, 11.5, 0.5, 0.36, m.travertine)
    k.drumTable(s * 6.3, 13.4, 0.24, 0.5, m.bronze)
    k.floorLamp(s * 6.4, 9.6)
    drumPendant(ctx, x, 11.5, 2.5, 0.45)
    pottedPlant(ctx, s * 4.6, 17.3)
    pottedPlant(ctx, s * 3.7, 5.7, false)
  }
  // Fluted oak on the gaming-lounge wall, with a tall bronze-framed mirror over the east sofa.
  k.box(r, 0.05, INT_H - 0.25, 9.3, k.fluted('flutedOak', 9.3), 6.9, FLOOR_Y + (INT_H - 0.25) / 2, 10.1)
  const mirror = k.at(6.86, 11.5, west, FLOOR_Y + 1.85)
  k.box(mirror, 2.5, 1.5, 0.04, m.bronze, 0, 0, 0)
  k.box(mirror, 2.4, 1.4, 0.01, m.mirror, 0, 0, 0.022, false)

  for (const s of [-1, 1]) pottedPlant(ctx, s * 6.2, -0.45)
}

/**
 * Carrom & Darts, in the room behind reception. The walkways along both sides stay clear (lobby to
 * gym, changing rooms and board games); the games take the middle.
 */
export function buildCarromDarts(ctx: Ctx) {
  const { k, c } = ctx
  for (const x of [-1.4, 1.4]) dartboard(ctx, x, -0.93, south)
  const score = k.at(0, -0.94, south, FLOOR_Y + 1.6)
  k.box(score, 0.6, 0.8, 0.03, k.m.oak, 0, 0, 0)
  k.box(score, 0.52, 0.72, 0.005, c.frame, 0, 0, 0.018, false)
  for (const x of [-1.6, 1.6]) {
    carrom(ctx, x, 3.6)
    drumPendant(ctx, x, 3.6, 1.75, 0.3)
  }
}

/**
 * Video Gaming Lounge, facing the avenue and the park: two console stations with gaming chairs, a
 * sofa station on the big screen, two racing simulators and a marked VR play area.
 */
export function buildGamingLounge(ctx: Ctx) {
  const { k, c } = ctx
  const { m } = k
  const r = k.root

  // Console stations on the back wall, two gaming chairs each.
  for (const [x, kind, accents] of [[15.6, 'race', ['#c8262b', '#1b4fb8']], [19.8, 'football', ['#1f8a44', '#c8a24a']]] as const) {
    consoleStation(ctx, x, 5.08, south, 1.9, kind)
    gamingChair(ctx, x - 0.5, 7.6, north, accents[0])
    gamingChair(ctx, x + 0.5, 7.6, north, accents[1])
  }
  // Sofa station: the big screen on the lobby wall, a deep sofa and an ottoman.
  consoleStation(ctx, 7.08, 10.2, east, 2.4, 'football')
  k.rug(9.6, 10.2, 3.4, 3.8, '#9c9486', '#33415a', 91)
  k.sofa(10.9, 10.2, west, 2.8, 1.0, c.velvet)
  k.soft(k.at(9.2, 10.2), 0.9, 0.38, 0.6, 0.08, m.boucle, 0, 0.19, 0)
  // Racing simulators facing the park glass.
  for (const z of [13.6, 16.2]) racingSim(ctx, 13.6, z, east)
  // VR play area: a padded mat with a lit boundary, two tracking sensors and a headset stand.
  const [vx, vz, vs] = [20.3, 11.3, 2.6]
  k.box(r, vs, 0.012, vs, c.grip, vx, FLOOR_Y + 0.006, vz, false)
  for (const s of [-1, 1]) {
    k.box(r, vs, 0.014, 0.04, c.ledBlue, vx, FLOOR_Y + 0.008, vz + (s * vs) / 2, false)
    k.box(r, 0.04, 0.014, vs, c.ledBlue, vx + (s * vs) / 2, FLOOR_Y + 0.008, vz, false)
    const pole = k.at(vx + (s * (vs / 2 + 0.2)), vz - s * (vs / 2 + 0.2))
    k.cyl(pole, 0.12, 0.14, 0.03, c.frame, 0, 0.015, 0, 16)
    k.cyl(pole, 0.015, 0.015, 2.1, c.frame, 0, 1.05, 0, 8)
    k.box(pole, 0.1, 0.1, 0.1, c.frame, 0, 2.15, 0).rotation.y = s > 0 ? PI / 4 : -PI * 0.75
  }
  const stand = k.at(vx - vs / 2 - 0.45, vz + 0.6)
  k.cyl(stand, 0.05, 0.07, 1.05, c.white, 0, 0.525, 0, 16)
  k.soft(stand, 0.2, 0.11, 0.12, 0.04, c.frame, 0, 1.13, 0)
  for (const s of [-1, 1]) k.cyl(stand, 0.025, 0.025, 0.14, c.frame, s * 0.14, 1.08, 0.04, 10)

  // Game library and controller storage by the entrance.
  const lib = k.cabinet(7.32, 6.6, east, 1.8, 0.4, 0.9, m.oak, c.statuario)
  for (let i = 0; i < 12; i++) k.box(lib, 0.014, 0.17, 0.13, [c.navy, c.frame, m.leather][i % 3], -0.6 + i * 0.022, 0.99, 0)
  pottedPlant(ctx, 21.4, 17.3)
  pottedPlant(ctx, 21.4, 5.8, false)
  pottedPlant(ctx, 7.6, 14.4, false)
}

export function buildGames(ctx: Ctx) {
  const { k, c } = ctx
  const { m } = k
  const r = k.root

  // Billiards: fluted walnut feature wall with the cue rack, table under its pendant, club chairs.
  k.box(r, 0.06, INT_H - 0.25, 12.4, k.fluted('flutedWalnut', 12.4), -21.82, FLOOR_Y + (INT_H - 0.25) / 2, 11.5)
  cueRack(ctx, -21.76, 11.8, east)
  poolTable(ctx, -18.25, 11.8, 0)
  k.loungeChair(-20.0, 6.3, south, m.walnut, m.leather)
  k.loungeChair(-17.4, 6.3, south, m.walnut, m.leather)
  k.drumTable(-18.7, 6.2, 0.26, 0.5, m.bronze)
  k.drumTable(-16.2, 16.9, 0.36, 1.05, m.walnut, c.statuario)
  k.stool(-16.9, 16.9)
  k.stool(-15.5, 16.9)
  pottedPlant(ctx, -21.3, 17.3)
  print(ctx, -18.25, 1.7, 5.12, south, 1.6, 1.0, 84)

  // Table tennis: ITTF table on sports vinyl, court barriers, bat store and benches, LED over the table.
  tableTennis(ctx, -10.75, 11.3, 0)
  for (const x of [-12.2, -9.3]) {
    barrier(ctx, x, 6.7, south)
    barrier(ctx, x, 15.9, north)
  }
  const store = k.cabinet(-12.9, 5.4, south, 1.8, 0.45, 1.9, m.walnut)
  for (let i = 0; i < 4; i++) {
    k.cyl(store, 0.075, 0.075, 0.012, new MeshStandardMaterial({ color: i % 2 ? '#c8262b' : '#141414', roughness: 0.9 }), -0.6 + i * 0.4, 1.3, 0.24, 20).rotation.x = PI / 2
  }
  k.cyl(k.at(-11.6, 5.55), 0.2, 0.18, 0.6, c.white, 0, 0.3, 0, 20)
  k.cyl(k.at(-11.6, 5.55), 0.19, 0.19, 0.02, new MeshStandardMaterial({ color: '#f6a41c', roughness: 0.6 }), 0, 0.61, 0, 20)
  for (const [bx, bz, ry, len] of [[-9.0, 5.55, south, 2.4], [-10.75, 17.45, north, 3.2]] as const) {
    const g = k.at(bx, bz, ry)
    k.box(g, len, 0.06, 0.42, m.oak, 0, 0.45, 0)
    k.soft(g, len - 0.1, 0.05, 0.4, 0.02, c.velvet, 0, 0.5, 0)
    for (const s of [-1, 1]) k.box(g, 0.06, 0.42, 0.4, m.bronze, s * (len / 2 - 0.15), 0.21, 0)
  }
  for (const x of [-11.3, -10.2]) k.box(r, 0.12, 0.05, 2.8, c.frame, x, FLOOR_Y + 3.0, 11.3)
  for (const x of [-11.3, -10.2]) k.box(r, 0.09, 0.012, 2.7, c.ledCool, x, FLOOR_Y + 2.97, 11.3, false)
  for (const [x, z] of [[-11.3, 10.1], [-11.3, 12.5], [-10.2, 10.1], [-10.2, 12.5]]) k.cyl(r, 0.004, 0.004, 0.35, m.bronze, x, FLOOR_Y + 3.2, z, 4)

  // Board-games lounge: two chess tables, a round games table, stocked shelves and reading chairs.
  k.rug(12.9, 1.6, 5.4, 3.0, '#c9bda9', '#5b3a24', 75)
  for (const x of [11.2, 14.6]) {
    chessTable(ctx, x, 1.6)
    k.diningChair(x - 0.75, 1.6, east, m.leather, m.walnut)
    k.diningChair(x + 0.75, 1.6, west, m.leather, m.walnut)
    k.globe(x, 2.2, 1.6, 0.2)
  }
  gamesTable(ctx, 19.0, 0.9)
  for (const [dx, dz, ry] of [[0, -0.85, south], [0, 0.85, north], [-0.85, 0, east], [0.85, 0, west]] as const) k.diningChair(19 + dx, 0.9 + dz, ry, m.olive, m.oak)
  k.linearPendant(19, 0.9, 2.3, 1.4)
  gameShelves(ctx, 7.3, -1.2, east, 3.0)
  k.loungeChair(20.8, 3.9, west, m.walnut, m.boucle)
  k.drumTable(21.2, 3.0, 0.24, 0.5, m.bronze)
  k.floorLamp(21.4, 4.5)
  print(ctx, 17.5, 1.7, 4.88, north, 1.8, 1.0, 85)
  pottedPlant(ctx, 8.0, 4.3)

  // Recreation lounge: a large display over a floating media console, velvet sofa, foosball and air hockey.
  const screen = paintedMat(ctx, 'screen', 640, 360, screenImage, { roughness: 0.15 })
  screen.emissiveMap = screen.map
  screen.emissive.set('#ffffff')
  screen.emissiveIntensity = 0.55
  display(ctx, 7.12, 1.6, -6.5, east, 2.4, screen)
  const media = k.cabinet(7.35, -6.5, east, 3.0, 0.42, 0.42, k.fluted('flutedWalnut', 3.0), c.statuario)
  media.position.y += 0.22
  k.rug(10.4, -6.5, 4.4, 4.2, '#b9ae9b', '#33415a', 76)
  k.sofa(11.6, -6.5, west, 3.2, 1.05, c.velvet)
  k.loungeChair(10.2, -4.2, west, m.walnut, m.boucle)
  k.loungeChair(10.2, -8.8, west, m.walnut, m.boucle)
  const low = k.at(9.5, -6.5)
  k.box(low, 0.8, 0.32, 1.4, m.travertine, 0, 0.17, 0)
  k.drumTable(12.6, -8.6, 0.24, 0.5, m.bronze)
  foosball(ctx, 15.6, -6.6, 0)
  airHockey(ctx, 19.4, -6.6, 0, paintedMat(ctx, 'airHockey', 256, 512, airHockeyTop, { roughness: 0.3 }))
  k.linearPendant(17.5, -6.6, 2.4, 4.5)
  pottedPlant(ctx, 21.4, -9.4)
  pottedPlant(ctx, 21.4, -3.6, false)
  k.floorLamp(13.3, -3.6)
}

export function buildGym(ctx: Ctx) {
  const { k, c } = ctx
  const { m } = k
  const r = k.root

  // Full-height mirror wall over the free weights, oak slats above it.
  k.box(r, 14.0, 2.4, 0.03, m.mirror, -14.6, FLOOR_Y + 1.5, 4.9, false)
  k.box(r, 14.1, 0.04, 0.05, m.bronze, -14.6, FLOOR_Y + 0.3, 4.89)
  k.box(r, 14.1, 0.64, 0.04, k.fluted('flutedOak', 14), -14.6, FLOOR_Y + 3.0, 4.9)

  // Cardio row facing the pool glass: treadmills, cross trainers, bikes and a rower.
  for (const x of [-20.9, -19.5, -18.1]) treadmill(ctx, x, -8.0, north)
  for (const x of [-16.5, -15.1]) crossTrainer(ctx, x, -8.0, north)
  for (const x of [-13.5, -12.3, -11.1]) bike(ctx, x, -8.3, north)
  rower(ctx, -8.6, -7.6, north)

  // Strength: squat rack on a lifting platform, dual-cable trainer, chest press and lat pulldown.
  powerRack(ctx, -19.6, -2.9, south)
  cableTrainer(ctx, -15.6, -3.2, south)
  pressMachine(ctx, -12.4, -2.9, south)
  pressMachine(ctx, -9.8, -2.9, south, true)

  // Free weights at the mirror.
  dumbbellRack(ctx, -19.9, 4.35, north)
  dumbbellRack(ctx, -17.4, 4.35, north)
  adjustableBench(ctx, -19.9, 2.2, south)
  adjustableBench(ctx, -17.4, 2.2, south)
  kettlebellRack(ctx, -15.0, 4.45, north)

  // Stretching and yoga on the oak inlay.
  const mats = ['#8c7a64', '#6f7358', '#9c8a78', '#5f6b72']
  mats.forEach((col, i) => yogaMat(ctx, -12.8 + i * 1.2, 2.6, 0, col))
  for (const [x, z, col] of [[-8.1, 1.2, '#b9ab95'], [-8.1, 2.0, '#6f7358']] as const) k.sphere(k.at(x, z), 0.32, new MeshStandardMaterial({ color: col, roughness: 0.6 }), 0, 0.32, 0)
  for (let i = 0; i < 3; i++) k.cyl(k.at(-8.3 + i * 0.2, 3.9), 0.075, 0.075, 0.9, c.pad, 0, 0.075, 0, 16).rotation.x = PI / 2
  pottedPlant(ctx, -7.6, 4.4, false)

  // Equipment store: open oak shelving with towels, medicine balls and bands; water station.
  const shelf = k.at(-7.32, -7.6, west)
  k.box(shelf, 4.0, 2.2, 0.42, m.oak, 0, 1.1, 0)
  for (const y of [0.45, 0.95, 1.45, 1.95]) k.box(shelf, 3.9, 0.025, 0.4, m.walnut, 0, y, 0.01)
  for (let i = 0; i < 6; i++) k.soft(shelf, 0.36, 0.22, 0.34, 0.05, c.white, -1.6 + i * 0.4, 1.58, 0.02)
  for (let i = 0; i < 6; i++) k.sphere(shelf, 0.13, [c.iron, m.leather, c.pad][i % 3], -1.6 + i * 0.6, 0.6, 0.02)
  for (let i = 0; i < 5; i++) k.cyl(shelf, 0.1, 0.1, 0.18, new MeshStandardMaterial({ color: ['#1b4fb8', '#c8262b', '#1f8a44', '#f2c200', '#2a2a2c'][i], roughness: 0.8 }), -1.4 + i * 0.7, 1.08, 0.02, 16)
  const water = k.at(-7.4, -4.8, west)
  k.box(water, 0.4, 1.1, 0.4, c.white, 0, 0.55, 0)
  k.cyl(water, 0.13, 0.13, 0.42, m.glass, 0, 1.31, 0, 20)
  k.box(water, 0.2, 0.08, 0.05, c.chrome, 0, 0.9, 0.2)

  // Linear LED battens across the ceiling.
  for (const z of [-8, -4.5, -1, 2.5]) {
    k.box(r, 13.6, 0.05, 0.12, c.frame, -14.5, FLOOR_Y + INT_H - 0.3, z)
    k.box(r, 13.5, 0.012, 0.08, c.ledCool, -14.5, FLOOR_Y + INT_H - 0.328, z, false)
  }
}

/** Men's (west) and women's (east) changing rooms: mirror images either side of x = 0. */
export function buildChanging(ctx: Ctx) {
  const { k, c } = ctx
  const { m } = k
  for (const s of [-1, 1]) {
    const X = (x: number) => s * -x
    const inward = s < 0 ? east : west
    // Showers along the back wall, three cubicles.
    for (const x of [-3.675, -2.225, -0.775]) showerCubicle(ctx, X(x), -9.0, 0, 1.45, 1.8)
    lockerBank(ctx, X(-6.55), -4.7, inward, 6.2)
    basinCounter(ctx, X(-1.75), -1.35, north, 2.9, 2)
    // Two private changing cubicles on the party wall, doors ajar.
    for (const z of [-6.75, -4.95]) {
      const g = k.at(X(-0.8), z, 0)
      for (const e of [-1, 1]) k.box(g, 1.55, 2.2, 0.05, m.oak, 0, 1.2, e * 0.85)
      const door = k.box(g, 0.05, 2.0, 0.9, m.oak, s * 0.78, 1.1, -0.35)
      door.rotation.y = s * 0.6
      k.box(g, 0.5, 0.05, 0.3, m.teak, s * 0.4, 0.45, 0)
    }
    const fm = k.at(X(-0.13), -3.3, s < 0 ? west : east, FLOOR_Y + 1.2)
    k.box(fm, 0.9, 2.0, 0.03, m.bronze, 0, 0, 0)
    k.box(fm, 0.84, 1.94, 0.01, m.mirror, 0, 0, 0.018, false)
    bench(ctx, X(-4.1), -4.8, s < 0 ? east : west, 2.6)
    const towels = k.cabinet(X(-4.9), -8.3, 0, 0.9, 0.45, 1.6, m.oak)
    for (let i = 0; i < 3; i++) k.soft(towels, 0.7, 0.18, 0.38, 0.05, c.white, 0, 0.9 + i * 0.2, 0)
    pottedPlant(ctx, X(-6.0), -1.45, false)
  }
}
