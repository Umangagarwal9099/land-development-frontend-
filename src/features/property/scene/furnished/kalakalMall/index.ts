import { BoxGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial } from 'three'
import { GOLD } from '../../../../../lib/palette'
import { Kit } from '../kit'
import { LightPool, Lighting, type FurnishedModel, type WalkArea } from '../shared'
import { buildBuilding } from './building'
import { Contact } from './contact'
import { Planting } from './foliage'
import { mallMaterials } from './materials'
import { BAYS, DRIVE, ENTRY_X, GL, LINK, PLAN_CENTRE_Z, PLAZA_Z, PLOT, REAR_Z, SHOPFRONT } from './plan'
import { buildContext, buildSite, SITE } from './site'
import { buildSkin } from './skin'

export { SITE }

/*
 * Prime Mall on commercial Plot A-02, Kallakal: an exterior model of the G+2 mall in the client's
 * reference design, its faceted aluminium and glass skin, entrance link, media screen and name
 * fitted to the 222′3″ × 150′ east-facing plot with its forecourt, parking, fire drives and
 * service yard. See plan.ts for how the reference was fitted to the plot.
 */

type Zone = [x0: number, x1: number, z0: number, z1: number]

/** Tappable outdoor areas, in site coordinates. */
const HOTSPOTS: Record<string, { y: number; height: number; zones: Zone[] }> = {
  amenity_entrance: { y: GL, height: 6, zones: [[ENTRY_X - 6, ENTRY_X + 6, LINK.z + SHOPFRONT, PLAZA_Z]] },
  amenity_forecourt: { y: 0.15, height: 3, zones: [[PLOT.x0, PLOT.x1, PLAZA_Z, DRIVE.z1]] },
  amenity_parking: { y: 0.03, height: 2.6, zones: [[PLOT.x0 + 6.46, PLOT.x1 - 6.46, BAYS.z0, BAYS.z1]] },
  amenity_service: { y: 0.02, height: 4.5, zones: [[PLOT.x0, PLOT.x1, PLOT.z0, REAR_Z]] },
}

/**
 * Builds the mall. `context` adds the roads and neighbouring ground round the plot; the master
 * plan, which draws its own roads, builds it without them and with the forecourt trimmed to the
 * layout's road edge.
 */
export function buildKalakalMall(context = true): FurnishedModel {
  const root = new Group()
  root.name = 'kalakal_mall'
  const building = new Group()
  building.name = 'building'
  const site = new Group()
  site.name = 'outdoor'
  root.add(building, site)

  const lighting = new Lighting()
  const k = new Kit(root)
  const c = mallMaterials(k, lighting)
  const ctx = { k, c, lighting, onPlan: !context, plant: new Planting(c.plants), shade: new Contact() }

  buildSkin(building, c)
  buildBuilding(ctx, building)
  buildSite(ctx, site)
  if (context) buildContext(ctx, site)
  else root.position.z = -PLAN_CENTRE_Z
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
  // On foot from the road: up the walk, across the drop-off and onto the forecourt.
  const walk: WalkArea = {
    start: [ENTRY_X, 0.15, PLOT.z1 - 2.5],
    yaw: 0,
    bounds: { ...PLOT },
    zoneAt: () => 'exterior',
  }
  // Every surface reflects the mall's own sky (see surfaces.ts): glass and metal pick up a sky and
  // skyline rather than the studio, and the dusk sky after sunset.
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
    c.shopGlass.opacity = day ? 0.58 : 0.3
  }
  setSky(false)
  return { root, highlights, walk, setDaylight: (day) => (lighting.set(day), setSky(day)), setZone: (z) => pool.setZone(z), syncLights: () => pool.sync() }
}
