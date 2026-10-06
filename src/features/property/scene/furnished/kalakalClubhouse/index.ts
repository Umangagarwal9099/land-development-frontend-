import { BoxGeometry, Group, Mesh, MeshBasicMaterial, PointLight } from 'three'
import { GOLD } from '../../../../../lib/palette'
import { FLOOR_Y, Kit } from '../kit'
import { buildFacade, buildPodium, buildShell, DECK_Y, INT_H, LIFT, type Ctx } from './architecture'
import { buildGrounds } from './grounds'
import { buildCarromDarts, buildChanging, buildGames, buildGamingLounge, buildGym, buildLobby } from './interiors'
import { Lighting, type FurnishedModel } from '../shared'
import { clubMaterials } from './materials'
import { buildPool } from './pool'

/*
 * The Kalakal Clubhouse: a contemporary stone, glass and timber clubhouse with a grand lobby,
 * indoor games, fitness centre, changing rooms and a 25 m six-lane training pool,
 * on the layout's social-infrastructure site. Built in code like the other furnished design models,
 * with the same naming contract (floor_G, room_*, amenity_*) so every area opens in the room viewer.
 */

/** Site extent (plan metres) for the plinth and camera bounds. */
export const SITE = { minX: -26, maxX: 26, minZ: -35, maxZ: 35 }

type Zone = [x0: number, x1: number, z0: number, z1: number]

/**
 * Tappable areas. `height` is how much of the space the room viewer keeps above its floor, so a
 * room shows its full walls and an outdoor area keeps its canopy, stands and floodlights.
 */
const HOTSPOTS: Record<string, { y: number; height: number; zones: Zone[] }> = {
  amenity_entrance: { y: DECK_Y, height: 6.2, zones: [[-17, 17, 18.3, 26], [-26, -17, 18.3, 35], [17, 26, 18.3, 35], [-17, 17, 26, 35]] },
  room_lobby: { y: FLOOR_Y, height: INT_H + 0.2, zones: [[-7, 7, 5, 18]] },
  room_carrom: { y: FLOOR_Y, height: INT_H + 0.2, zones: [[-7, 7, -1, 5]] },
  room_gaming: { y: FLOOR_Y, height: INT_H + 0.2, zones: [[7, 22, 5, 18]] },
  room_billiards: { y: FLOOR_Y, height: INT_H + 0.2, zones: [[-22, -14.5, 5, 18]] },
  room_tt: { y: FLOOR_Y, height: INT_H + 0.2, zones: [[-14.5, -7, 5, 18]] },
  room_boardgames: { y: FLOOR_Y, height: INT_H + 0.2, zones: [[7, 22, -3, 5]] },
  room_recreation: { y: FLOOR_Y, height: INT_H + 0.2, zones: [[7, 22, -10, -3]] },
  room_gym: { y: FLOOR_Y, height: INT_H + 0.2, zones: [[-22, -7, -10, 5]] },
  room_changing: { y: FLOOR_Y, height: INT_H + 0.2, zones: [[-7, 0, -10, -1], [0, 7, -10, -1]] },
  amenity_pool: { y: DECK_Y, height: 6.8, zones: [[-13.5, 13.5, -30, -12], [-26, -13.5, -35, -10.3], [13.5, 14.5, -35, -10.3], [-13.5, 13.5, -35, -30], [-13.5, 13.5, -12, -10.3]] },
  amenity_garden: { y: 0.02, height: 4.5, zones: [[14.5, 26, -35, -10.3]] },
}

// Warm interior light per space (cool daylight-white over the sports floors), the canopy, and the pool's underwater glow.
const LIGHTS: [x: number, y: number, z: number, intensity: number, distance: number, color: string, dayFactor: number][] = [
  [0, 2.5, 12, 10, 15, '#ffe2c0', 0.8],
  [0, 2.4, 2, 4, 8, '#ffe2c0', 0.8],
  [14.5, 2.5, 12, 10, 15, '#ffe2c0', 0.8],
  [-18.25, 2.3, 11.8, 7, 11, '#ffe2c0', 0.8],
  [-10.75, 2.5, 11.3, 9, 12, '#fff6ea', 0.8],
  [-19, 2.4, -3, 10, 14, '#fff6ea', 0.8],
  [-14.5, 2.4, -3, 10, 14, '#fff6ea', 0.8],
  [-10, 2.4, -3, 10, 14, '#fff6ea', 0.8],
  [0, 2.4, -5.5, 6, 10, '#ffe2c0', 0.8],
  [14.5, 2.4, 1, 6, 10, '#ffe2c0', 0.8],
  [14.5, 2.4, -6.5, 6, 10, '#ffe2c0', 0.8],
  [0, 4.6, 22, 6, 12, '#ffc98a', 0],
  [-6, -1.2, -21, 7, 15, '#7fe6ff', 0.05],
  [6, -1.2, -21, 7, 15, '#7fe6ff', 0.05],
]

export function buildKalakalClubhouse(): FurnishedModel {
  const root = new Group()
  root.name = 'kalakal_clubhouse'
  root.position.y = LIFT
  const house = new Group()
  house.name = 'floor_G'
  const site = new Group()
  site.name = 'outdoor'
  root.add(site, house)

  const lighting = new Lighting()
  const k = new Kit(house, undefined, INT_H)
  const out = new Kit(site, k)
  const ctx: Ctx = { k, out, c: clubMaterials(k, lighting), lighting }

  buildPodium(ctx)
  buildShell(ctx)
  buildFacade(ctx)
  buildLobby(ctx)
  buildCarromDarts(ctx)
  buildGamingLounge(ctx)
  buildGames(ctx)
  buildGym(ctx)
  buildChanging(ctx)
  buildPool(ctx)
  buildGrounds(ctx)

  for (const [x, y, z, intensity, distance, color, dayFactor] of LIGHTS) {
    const l = new PointLight(color, intensity, distance, 2)
    l.position.set(x, FLOOR_Y + y, z)
    ;(y < 0 || y > 4 ? site : house).add(l)
    lighting.light(l, dayFactor)
  }

  const highlights = new Map<string, MeshBasicMaterial>()
  for (const [name, { y, height, zones }] of Object.entries(HOTSPOTS)) {
    const g = new Group()
    g.name = name
    g.userData.height = height
    const mat = new MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0, depthWrite: false })
    for (const [x0, x1, z0, z1] of zones) {
      const s = new Mesh(new BoxGeometry(x1 - x0, 0.01, z1 - z0), mat)
      s.position.set((x0 + x1) / 2, y + 0.02, (z0 + z1) / 2)
      s.renderOrder = 2
      g.add(s)
    }
    ;(name.startsWith('room_') ? house : site).add(g)
    highlights.set(name, mat)
  }

  return { root, highlights, setDaylight: (day) => lighting.set(day) }
}
