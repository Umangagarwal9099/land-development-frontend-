import { BoxGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial } from 'three'
import { GOLD } from '../../../../../lib/palette'
import { Basement } from '../basement'
import { Kit } from '../kit'
import { LightPool, Lighting, type FurnishedModel, type WalkArea } from '../shared'
import { Contact } from '../kalakalMall/contact'
import { Planting } from '../kalakalMall/foliage'
import { A01_BASEMENT } from './basement'
import { buildBuilding } from './building'
import { a01Materials } from './materials'
import { BLOCK, COURT_REAR, DRIVE, DRUM, EXIT, GL, LAWNS, LIFT, MEET_X, PLAN_CENTRE_Z, PLOT, PORTALS, RETURN } from './plan'
import { buildContext, buildSite, SITE } from './site'

export { SITE }

/*
 * Kallakal Square on commercial Plot A-01: an exterior model of the client's reference design, a
 * multi-storey car park over ground-floor shops. A G+3 block along the road, its decks screened
 * in staggered timber slat panels, with a glazed drum holding the helical ramp standing proud of
 * the front under a deep black crown, the main entrance at its foot; a cream stair tower and a
 * dark lift core close the north end. It sits on the 166′1″ × 165′5″ east-facing plot with the
 * landscaped forecourt in front. Traffic runs one way round it: in by the drive and the vehicle
 * portals to the south, across the connector behind, out by the exit road to the north; the
 * back wall is unbroken. See plan.ts for how the reference was fitted to the plot.
 */

type Zone = [x0: number, x1: number, z0: number, z1: number]

/** Tappable outdoor areas, in site coordinates. */
const HOTSPOTS: Record<string, { y: number; height: number; zones: Zone[] }> = {
  amenity_entrance: { y: GL, height: 5, zones: [[DRUM.x - 3, DRUM.x + 3, DRUM.z + DRUM.r - 0.6, DRUM.z + DRUM.r + 3]] },
  amenity_shops: { y: GL, height: 4.5, zones: [[MEET_X.north + RETURN, LIFT.x0, BLOCK.z1, BLOCK.z1 + 4]] },
  amenity_forecourt: { y: GL, height: 2.5, zones: [[LAWNS[0].x0, LAWNS[1].x1, LAWNS[1].z0, PLOT.z1 - 0.5]] },
  amenity_parking: {
    y: 0.03,
    height: 3.2,
    zones: [
      [DRIVE.x0 + 0.3, BLOCK.x0, PORTALS[0].z0 - 1, PORTALS[1].z1 + 1],
      [EXIT.x0, EXIT.x1, BLOCK.z0, BLOCK.z1],
    ],
  },
  amenity_service: { y: 0.03, height: 3, zones: [[BLOCK.x0, PLOT.x1 - 0.3, PLOT.z0 + 0.3, COURT_REAR.z1]] },
}

/**
 * Builds the design. `context` adds the roads and neighbouring ground round the plot; the master
 * plan, which draws its own roads, builds it without them and with the forecourt trimmed to the
 * layout's road edge.
 */
export function buildKalakalA01(context = true): FurnishedModel {
  const root = new Group()
  root.name = 'kalakal_a01'
  const building = new Group()
  building.name = 'building'
  const site = new Group()
  site.name = 'outdoor'
  root.add(building, site)

  const lighting = new Lighting()
  const k = new Kit(root)
  const c = a01Materials(k, lighting)
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
  // Two basement parking levels, built the first time a visitor goes below ground (not on the master plan).
  const basement = context ? new Basement(root, k, lighting, pool, A01_BASEMENT, SITE, highlights) : undefined
  // On foot from the road: up the entrance walk towards the drum's doors.
  const walk: WalkArea = {
    start: [DRUM.x, GL, PLOT.z1 - 2.5],
    yaw: 0,
    bounds: { ...PLOT },
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
    c.shopGlass.opacity = day ? 0.58 : 0.3
  }
  setSky(false)
  return {
    root,
    highlights,
    walk,
    setDaylight: (day) => (lighting.set(day), setSky(day)),
    setZone: (z) => pool.setZone(basement?.zone(z) ?? z),
    syncLights: () => pool.sync(),
    basement,
  }
}
