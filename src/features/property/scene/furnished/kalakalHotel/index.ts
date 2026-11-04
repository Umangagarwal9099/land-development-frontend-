import { BoxGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial } from 'three'
import { GOLD } from '../../../../../lib/palette'
import { Kit } from '../kit'
import { LightPool, Lighting, type FurnishedModel, type WalkArea } from '../shared'
import { Contact } from '../kalakalMall/contact'
import { Planting } from '../kalakalMall/foliage'
import { buildBuilding } from './building'
import { hotelMaterials } from './materials'
import { DRIVE, ENTRY_T, GL, P, PARK, PLAN_CENTRE_Z, PLAZA_R, PLOT, polar, R_IN, YARD } from './plan'
import { buildContext, buildSite, SITE } from './site'

export { SITE }

/*
 * Kallakal Hotel on commercial Plot A-04: an exterior model of the client's reference design, a
 * G+2 ring of curved glass pavilions with white slab bands round a fountain plaza (the lobby and
 * restaurant below, guest rooms above), its white sweeping wall and black mesh capsules grown
 * over with creepers, fitted to the front of the 124′3″ × 340′7″ east-facing plot, with the
 * guests' car park, utility yard and service gate filling the depth behind. See plan.ts for how
 * the reference was fitted to the plot.
 */

type Zone = [x0: number, x1: number, z0: number, z1: number]

const [, entryZ] = polar(ENTRY_T, R_IN)

/** Tappable outdoor areas, in site coordinates. */
const HOTSPOTS: Record<string, { y: number; height: number; zones: Zone[] }> = {
  amenity_entrance: { y: GL, height: 5, zones: [[P.x - 4, P.x + 4, entryZ, entryZ + 3.2]] },
  amenity_plaza: { y: GL, height: 2.5, zones: [[P.x - PLAZA_R, P.x + PLAZA_R, P.z - PLAZA_R + 3.2, P.z + PLAZA_R]] },
  amenity_parking: { y: 0.03, height: 2.4, zones: [[DRIVE.x1, PLOT.x1 - 0.3, PARK.back[0], PARK.front[1]]] },
  amenity_service: { y: 0.03, height: 4, zones: [[DRIVE.x1, YARD.x1, PLOT.z0 + 0.3, PARK.back[0]]] },
}

/**
 * Builds the design. `context` adds the roads and neighbouring ground round the plot; the master
 * plan, which draws its own roads, builds it without them and with the forecourt trimmed to the
 * layout's road edge.
 */
export function buildKalakalHotel(context = true): FurnishedModel {
  const root = new Group()
  root.name = 'kalakal_hotel'
  const building = new Group()
  building.name = 'building'
  const site = new Group()
  site.name = 'outdoor'
  root.add(building, site)

  const lighting = new Lighting()
  const k = new Kit(root)
  const c = hotelMaterials(k, lighting)
  const ctx = { k, c, lighting, onPlan: !context, plant: new Planting(c.plants), shade: new Contact() }

  buildBuilding(ctx, building)
  const fountain = buildSite(ctx, site)
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
  // On foot from the road: across the forecourt towards the fountain and the entrance beyond it.
  const walk: WalkArea = {
    start: [P.x, GL, PLOT.z1 - 2.5],
    yaw: 0,
    bounds: { ...PLOT },
    zoneAt: () => 'exterior',
  }
  // Glass, metal and the wet stone reflect the design's own sky (see kalakalMall/surfaces.ts).
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
  fountain.setDaylight(false)
  return {
    root,
    highlights,
    walk,
    setDaylight: (day) => (lighting.set(day), setSky(day), fountain.setDaylight(day)),
    setZone: (z) => pool.setZone(z),
    syncLights: () => pool.sync(),
    animate: (elapsed, camera) => fountain.animate(elapsed, camera),
  }
}
