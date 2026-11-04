import { BoxGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial } from 'three'
import { GOLD } from '../../../../../lib/palette'
import { Kit } from '../kit'
import { LightPool, Lighting, type FurnishedModel, type WalkArea } from '../shared'
import { Contact } from '../kalakalMall/contact'
import { Planting } from '../kalakalMall/foliage'
import { buildBuilding } from './building'
import { hospitalMaterials } from './materials'
import { CANOPY, DRIVE, ER, GARDEN, GL, LANE, MAIN, PARK, PLAN_CENTRE_Z, PLOT, RAMP, TOWER, WALK, YARD } from './plan'
import { buildContext, buildSite, SITE } from './site'

export { SITE }

/*
 * Kallakal Hospital on commercial Plot A-03: an exterior model of the client's reference design, a
 * B2 + G + 3 hospital in white cladding and blue-grey glass. From the road: a white tower of
 * punched windows over the outpatient entrance, a lower glazed link, the main block's curtain
 * wall in a deep white frame with the blue cross and the name across its top and the
 * porte-cochère over the drop-off, and the end of the north wing in white bands and ribbon
 * glazing with the emergency entrance and ambulance bay at its foot. It stands on the 125′ ×
 * 294′6″ east-facing corner plot with the garden in front, the drive down the south side and the
 * basement ramp, parking and utility yard behind. See plan.ts for how the reference was fitted.
 */

type Zone = [x0: number, x1: number, z0: number, z1: number]

/** Tappable areas, in site coordinates. */
const HOTSPOTS: Record<string, { y: number; height: number; zones: Zone[] }> = {
  amenity_entrance: { y: GL, height: 4.5, zones: [[CANOPY.x0, CANOPY.x1, MAIN.lobby, LANE.z1]] },
  amenity_emergency: { y: 0.03, height: 3.6, zones: [[ER.x0, ER.x1, ER.z0, ER.z1]] },
  amenity_outpatient: { y: GL, height: 4, zones: [[TOWER.x0, TOWER.x1, TOWER.z1, LANE.z0]] },
  amenity_garden: { y: GL, height: 2.5, zones: [[GARDEN.x0, GARDEN.x1, LANE.z1 + 1.7, PLOT.z1 - 0.5]] },
  amenity_parking: { y: 0.03, height: 3, zones: [[DRIVE.x1, YARD.x0, PARK.z0, RAMP.z1]] },
  amenity_service: { y: GL, height: 3, zones: [[YARD.x0, YARD.x1, YARD.z0, YARD.z1]] },
}

/**
 * Builds the design. `context` adds the roads and neighbouring ground round the plot; the master
 * plan, which draws its own roads, builds it without them and with the garden trimmed to the
 * layout's road edge.
 */
export function buildKalakalHospital(context = true): FurnishedModel {
  const root = new Group()
  root.name = 'kalakal_hospital'
  const building = new Group()
  building.name = 'building'
  const site = new Group()
  site.name = 'outdoor'
  root.add(building, site)

  const lighting = new Lighting()
  const k = new Kit(root)
  const c = hospitalMaterials(k, lighting)
  const ctx = { k, c, lighting, onPlan: !context, plant: new Planting(c.plants), shade: new Contact() }

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
  // On foot from the road: up the entrance walk towards the main doors.
  const walk: WalkArea = {
    start: [(WALK.x0 + WALK.x1) / 2, GL, PLOT.z1 - 2.5],
    yaw: 0,
    bounds: { x0: PLOT.x0, x1: PLOT.x1, z0: PLOT.z0, z1: PLOT.z1 },
    zoneAt: () => 'exterior',
  }
  // Glass, metal and stone reflect the design's own sky (see kalakalMall/surfaces.ts).
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
    // By day the curtain walls read as blue-grey glass; at dusk the lit floors show through.
    c.curtainGlass.opacity = day ? 0.84 : 0.62
    c.windowGlass.opacity = day ? 0.6 : 0.32
  }
  setSky(false)
  return {
    root,
    highlights,
    walk,
    setDaylight: (day) => (lighting.set(day), setSky(day)),
    setZone: (z) => pool.setZone(z),
    syncLights: () => pool.sync(),
  }
}
