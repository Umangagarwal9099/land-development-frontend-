import { BoxGeometry, Group, Mesh, MeshBasicMaterial, PointLight } from 'three'
import { GOLD } from '../../../../../lib/palette'
import { Kit } from '../kit'
import type { FurnishedModel } from '../palmGroveE02'
import { Lighting } from '../shared'
import { buildHouse } from './house'
import { ARCADE, BAMBOO_BAR, BOULDER_DECK, COURT, GF, PRACTICE, havenMaterials, LAWN, LIFT, PLOT, POOL_T, SERVICE, TERRACE, THATCH_HALL, UPPER, type Ctx } from './layout'
import { buildOutdoors } from './outdoors'
import { Photos } from './photos'
import { buildTerrain } from './terrain'

/*
 * Nysha's Haven, Osman Sagar Lake: the site in 3D, laid out from the aerial photograph. The
 * residence and the arcade building side by side to the west, the infinity pool before the house,
 * the lawn with its round bamboo bar running east to the lake, the boulder deck and the court
 * along the south side, and the walk under flame trees along the north.
 */

/** Site extent (plan metres): the plot, its margins and a reach of the lake. */
export const SITE = { minX: -28, maxX: 82, minZ: -35, maxZ: 41 }

type Zone = [x0: number, x1: number, z0: number, z1: number]

const { x: bx, z: bz, r: br } = BAMBOO_BAR
const BAR: Zone = [bx - br, bx + br, bz - br, bz + br]

/**
 * Tappable areas. `height` is how much of the space the area view keeps; `view: 'overview'`
 * opens solid buildings from a raised vantage instead of standing inside them.
 */
const HOTSPOTS: Record<string, { y: number; height: number; zones: Zone[]; view?: 'overview' | 'eye' }> = {
  amenity_arrival: { y: UPPER, height: 6, zones: [[PLOT.x0, 3, -21.5, -16], [-20.6, -18.6, -16, 12.6]], view: 'overview' },
  amenity_residence: { y: GF, height: 13.5, zones: [[-18.6, 3.2, -12.6, 12.6], [-12, -5, -15.6, -12.6]], view: 'overview' },
  amenity_terrace: { y: TERRACE, height: 4.6, zones: [[-15.5, -3.5, -8.8, 8.8]], view: 'overview' },
  amenity_pool: { y: POOL_T, height: 4, zones: [[3.2, 17.2, -12, 10.4], THATCH_HALL] },
  amenity_lawn: { y: LAWN, height: 9, zones: [[17.2, 46, -14, BAR[2]], [17.2, BAR[0], BAR[2], BAR[3]], [BAR[1], 46, BAR[2], BAR[3]], [17.2, 46, BAR[3], 9.0]] },
  amenity_bamboobar: { y: LAWN, height: 5.4, zones: [BAR], view: 'eye' },
  amenity_deck: { y: POOL_T, height: 6, zones: [BOULDER_DECK] },
  amenity_court: { y: LAWN, height: 7, zones: [COURT, PRACTICE] },
  amenity_arcade: { y: UPPER, height: 13, zones: [ARCADE], view: 'overview' },
  amenity_staff: { y: LAWN, height: 4, zones: [SERVICE], view: 'overview' },
}

// Evening lights: underwater pool glow, the front door, the terrace bar, bamboo bar, deck and arcade.
const LIGHTS: [x: number, y: number, z: number, intensity: number, distance: number, color: string][] = [
  [11.5, POOL_T - 1.0, -2.5, 4, 12, '#6fd3c8'],
  [15, POOL_T - 1.0, 5.5, 3, 10, '#6fd3c8'],
  [-20.5, GF + 2.6, 0, 6, 12, '#ffc98a'],
  [3.2, GF + 2.6, 0, 8, 16, '#ffc98a'],
  [-9.4, TERRACE + 2.2, 2.2, 6, 11, '#ffc98a'],
  [bx, LAWN + 2.4, bz, 5, 10, '#ffc98a'],
  [30, POOL_T + 2.5, 13.3, 6, 16, '#ffc98a'],
  [1.5, UPPER + 4, 21, 6, 14, '#ffc98a'],
  [9.5, POOL_T + 2.4, 10, 4, 9, '#ffc98a'],
]

export function buildNyshasHaven(): FurnishedModel {
  const root = new Group()
  root.name = 'nyshas_haven'
  root.position.y = LIFT
  const site = new Group()
  site.name = 'outdoor'
  root.add(site)

  const lighting = new Lighting()
  const k = new Kit(site)
  const photos = new Photos()
  const ctx: Ctx = { k, h: havenMaterials(k, lighting, photos), lighting }
  buildTerrain(ctx)
  buildHouse(ctx)
  buildOutdoors(ctx)

  for (const [x, y, z, intensity, distance, color] of LIGHTS) {
    const l = new PointLight(color, intensity, distance, 2)
    l.position.set(x, y, z)
    site.add(l)
    lighting.light(l, 0)
  }

  const highlights = new Map<string, MeshBasicMaterial>()
  for (const [name, { y, height, zones, view }] of Object.entries(HOTSPOTS)) {
    const g = new Group()
    g.name = name
    g.userData.height = height
    if (view) g.userData.view = view
    const mat = new MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0, depthWrite: false })
    for (const [x0, x1, z0, z1] of zones) {
      const s = new Mesh(new BoxGeometry(x1 - x0, 0.01, z1 - z0), mat)
      s.position.set((x0 + x1) / 2, y + 0.08, (z0 + z1) / 2)
      s.renderOrder = 2
      g.add(s)
    }
    site.add(g)
    highlights.set(name, mat)
  }

  return { root, highlights, setDaylight: (day) => lighting.set(day), ready: photos.ready() }
}
