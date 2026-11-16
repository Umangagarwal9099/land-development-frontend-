import { BoxGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial } from 'three'
import { GOLD } from '../../../../../lib/palette'
import { Basement, openingsOf } from '../basement'
import { Kit } from '../kit'
import { LightPool, Lighting, type FurnishedModel, type LiftHost, type WalkArea } from '../shared'
import { MALL_BASEMENT } from './basement'
import { buildBuilding } from './building'
import { Contact } from './contact'
import { Planting } from './foliage'
import { buildMallInterior } from './interior'
import { mallMaterials } from './materials'
import { BAYS, DRIVE, ENTRY_X, GL, LINK, PLAN_CENTRE_Z, PLAZA_Z, PLOT, REAR_Z, SHOPFRONT } from './plan'
import { buildContext, buildSite, SITE } from './site'
import { buildSkin } from './skin'

export { SITE }

/*
 * Terranova Mall on commercial Plot A-02, Kallakal: the client's reference design, its faceted
 * aluminium and glass skin, entrance link, media screen and name, raised to G+4 and fitted to the
 * 222′3″ × 150′ east-facing plot with its forecourt, parking, fire drives and service yard (see
 * plan.ts). In the property view its five floors are built inside, planned for letting (see
 * interior/): galleries round a five-storey atrium, escalators, two lifts down to the car park,
 * three fire stairs and every unit marked out.
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
  const ctx = { k, c, lighting, onPlan: !context, plant: new Planting(c.plants), shade: new Contact(), openings: context ? openingsOf(MALL_BASEMENT) : undefined }

  buildSkin(building, c)
  buildBuilding(ctx, building)
  // The interior, in the property view only (the master plan shows the shell lit from within).
  const interior = context ? buildMallInterior(k, lighting, building) : undefined
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

  for (const [name, mat] of interior?.highlights ?? []) highlights.set(name, mat)

  // Each floor's lamps light it while it is looked at or walked; the rest light the exterior.
  const pool = new LightPool(root, (l) => (l.userData.zone as string | undefined) ?? 'exterior', 6)
  // Two basement parking levels, built the first time a visitor goes below ground (not on the master plan).
  const basement = context ? new Basement(root, k, lighting, pool, MALL_BASEMENT, SITE, highlights) : undefined
  // The lifts come down into the car park: their shafts and landings join its levels when built.
  if (basement && interior) basement.onBuild.push((at) => {
    for (const [level, g] of interior.basement) at(level).add(g)
  })
  // On foot from the road: up the walk, across the drop-off and onto the forecourt.
  const walk: WalkArea = {
    start: [ENTRY_X, 0.15, PLOT.z1 - 2.5],
    yaw: 0,
    bounds: { ...PLOT },
    zoneAt: (x, y, z) => {
      const below = basement?.zoneAt(y) ?? 'exterior'
      if (below !== 'exterior') return below
      return interior?.zoneAt(x, y, z) ?? 'exterior'
    },
  }
  // Every surface reflects the mall's own sky (see surfaces.ts): glass and metal pick up a sky and
  // skyline rather than the studio, and the dusk sky after sunset.
  const reflective: MeshStandardMaterial[] = []
  root.traverse((o) => {
    const mats = (o as Mesh).material
    if (!mats) return
    for (const m of Array.isArray(mats) ? mats : [mats])
      // The interior reflects itself (see interior/materials.ts), not the sky.
      if (m instanceof MeshStandardMaterial && !m.userData.interior && !reflective.includes(m)) reflective.push(m)
  })
  const setSky = (day: boolean) => {
    for (const m of reflective) {
      m.envMap = day ? c.env.day : c.env.dusk
      m.envMapIntensity = day ? 0.9 : 0.45
    }
    c.shopGlass.opacity = day ? 0.58 : 0.3
  }
  setSky(false)
  // The lifts a walker can ride, and the escalators that carry them.
  const lifts: LiftHost | undefined = interior && {
    tick: (dt, walker) => {
      const a = basement?.tick(dt, walker) ?? false
      const b = interior.tick(dt, walker)
      return a || b
    },
    liftNear: (p) => basement?.liftNear(p) ?? interior.liftNear(p),
  }
  const zone = (z: string) => {
    const z2 = interior ? interior.zone(z) : z
    return basement?.zone(z2) ?? z2
  }
  // With the camera inside the building (a view from a gallery, not a walk), the floor it is on is lit.
  let asked = 'exterior'
  let walking = false
  let indoors: string | null = null
  const light = () => pool.setZone(zone(asked === 'exterior' && indoors ? indoors : asked))
  return {
    root,
    highlights,
    walk,
    setDaylight: (day) => (lighting.set(day), setSky(day)),
    setZone: (z) => {
      asked = z
      light()
    },
    syncLights: () => pool.sync(),
    basement,
    lifts,
    setView: (v) => {
      walking = v.walking
      interior?.setView(v)
    },
    frame: interior && ((camera) => {
      const running = interior.frame(camera)
      const p = camera.position
      const here = walking ? null : interior.zoneAt(p.x, p.y, p.z)
      if (here === indoors) return running
      indoors = here
      light()
      return true
    }),
  }
}
