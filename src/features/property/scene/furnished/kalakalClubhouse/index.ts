import { BoxGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial } from 'three'
import { GOLD } from '../../../../../lib/palette'
import { Kit } from '../kit'
import { LightPool, Lighting, type FurnishedModel, type WalkArea } from '../shared'
import { Contact } from '../kalakalMall/contact'
import { Planting } from '../kalakalMall/foliage'
import { buildBuilding, type ClubCtx } from './building'
import { clubMaterials } from './materials'
import { A, FFL, ISLAND, P, PLOT_X, YARD, YARD_Y, Z_SOUTH, northZ } from './plan'
import { buildContext, buildSite, SITE } from './site'

export { SITE }
export { PLOT } from './plan'

/*
 * The Kallakal clubhouse: an exterior model of the client's reference, a cluster of laterite and
 * glass pavilions under steep terracotta gables round a landscaped courtyard, entered from the south
 * through a laterite portal. See plan.ts for the plot and how the references were measured.
 */

type Zone = [x0: number, x1: number, z0: number, z1: number]

/** Tappable areas, in site coordinates. */
const HOTSPOTS: Record<string, { y: number; height: number; zones: Zone[] }> = {
  amenity_entrance: { y: 0.15, height: 5, zones: [[-P.hw, P.hw, A.z1, P.ffront]] },
  amenity_forecourt: { y: 0.15, height: 2.2, zones: [[-ISLAND.x - 1, ISLAND.x + 1, P.ffront + 0.3, Z_SOUTH - 0.5]] },
  amenity_lounge: { y: FFL, height: 4.2, zones: [[A.x0, -P.hw, A.z0, A.z1], [P.hw, A.x1, A.z0, A.z1]] },
  amenity_courtyard: { y: YARD_Y, height: 2.5, zones: [[YARD.x0, YARD.x1, YARD.z0, YARD.z1]] },
}

export function buildKalakalClubhouse(context = true): FurnishedModel {
  const root = new Group()
  root.name = 'kalakal_clubhouse'
  const building = new Group()
  building.name = 'building'
  const site = new Group()
  site.name = 'outdoor'
  root.add(building, site)

  const lighting = new Lighting()
  const k = new Kit(root)
  const c = clubMaterials(k, lighting)
  const ctx: ClubCtx = { k, c, lighting, plant: new Planting(c.plants), shade: new Contact() }

  const lamps = buildBuilding(ctx, building)
  buildSite(ctx, site)
  if (context) buildContext(ctx, site)
  ctx.plant.build(site)
  ctx.shade.build(k, site)

  const highlights = new Map<string, MeshBasicMaterial>()
  for (const [name, { y, height, zones }] of Object.entries(HOTSPOTS)) {
    const g = new Group()
    g.name = name
    g.userData.height = height
    const mat = new MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0, depthWrite: false })
    for (const [x0, x1, z0, z1] of zones) {
      const s = new Mesh(new BoxGeometry(x1 - x0, 0.01, z1 - z0), mat)
      s.position.set((x0 + x1) / 2, y + 0.03, (z0 + z1) / 2)
      s.renderOrder = 2
      g.add(s)
    }
    site.add(g)
    highlights.set(name, mat)
  }

  const pool = new LightPool(root, () => 'exterior', 6)
  // On foot from the road, where the south elevation was drawn from: the island and the portal ahead.
  const walk: WalkArea = {
    start: [0, 0.15, Z_SOUTH + 1],
    yaw: 0,
    bounds: { x0: PLOT_X.x0, x1: PLOT_X.x1, z0: northZ(PLOT_X.x1), z1: Z_SOUTH + 8 },
    zoneAt: () => 'exterior',
  }
  // Glass, metal and the stone reflect the design's own sky (see kalakalMall/surfaces.ts).
  const reflective: MeshStandardMaterial[] = []
  root.traverse((o) => {
    const mats = (o as Mesh).material
    if (!mats) return
    for (const m of Array.isArray(mats) ? mats : [mats]) if (m instanceof MeshStandardMaterial && !reflective.includes(m)) reflective.push(m)
  })
  const setSky = (day: boolean) => {
    for (const m of reflective) {
      m.envMap = day ? c.env.day : c.env.dusk
      m.envMapIntensity = day ? 0.9 : 0.45
    }
  }
  setSky(true)
  lighting.set(true)
  lamps.setDaylight(true)
  return {
    root,
    highlights,
    walk,
    setDaylight: (day) => (lighting.set(day), setSky(day), lamps.setDaylight(day)),
    setZone: (z) => pool.setZone(z),
    syncLights: () => pool.sync(),
  }
}
