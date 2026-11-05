import { BoxGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, type Object3D } from 'three'
import { GOLD } from '../../../../../lib/palette'
import { Basement, openingsOf } from '../basement'
import { Kit } from '../kit'
import { LightPool, Lighting, type FurnishedModel, type WalkArea } from '../shared'
import { Contact } from '../kalakalMall/contact'
import { Planting } from '../kalakalMall/foliage'
import { HOSPITAL_BASEMENT } from './basement'
import { buildBuilding } from './building'
import { ER_ROOM } from './emergency'
import { hospitalMaterials } from './materials'
import { CANOPY, DRIVE, EMERGENCY, ER, GARDEN, GL, L1, LANE, MAIN, PARK, PLAN_CENTRE_Z, PLOT, RAMP, TOWER, WALK, YARD } from './plan'
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

/** Tappable areas, in site coordinates; an indoor one can compose its first view (camera and target). */
const HOTSPOTS: Record<string, { y: number; height: number; zones: Zone[]; eye?: { from: number[]; to: number[] }; property?: boolean }> = {
  amenity_entrance: { y: GL, height: 4.5, zones: [[CANOPY.x0, CANOPY.x1, MAIN.lobby, LANE.z1]] },
  amenity_emergency: { y: 0.03, height: 3.6, zones: [[ER.x0, ER.x1, ER.z0, ER.z1]] },
  amenity_outpatient: { y: GL, height: 4, zones: [[TOWER.x0, TOWER.x1, TOWER.z1, LANE.z0]] },
  amenity_garden: { y: GL, height: 2.5, zones: [[GARDEN.x0, GARDEN.x1, LANE.z1 + 1.7, PLOT.z1 - 0.5]] },
  amenity_parking: { y: 0.03, height: 3, zones: [[DRIVE.x1, YARD.x0, PARK.z0, RAMP.z1]] },
  amenity_service: { y: GL, height: 3, zones: [[YARD.x0, YARD.x1, YARD.z0, YARD.z1]] },
  // The emergency department, from the back of the treatment area looking along the bays to the
  // doors, the nurses' station on the left, as in the interior reference. Fitted in the property
  // view only.
  [ER_ROOM]: {
    y: GL, height: 2.6, property: true,
    zones: [[EMERGENCY.x0, EMERGENCY.x1, EMERGENCY.z0, EMERGENCY.z1]],
    eye: { from: [10.3, GL + 1.6, EMERGENCY.z0 + 0.9], to: [7.6, GL + 1.05, -9.5] },
  },
}

/** Whether a point is inside the emergency department (for the light zone while walking). */
const inEmergency = (x: number, y: number, z: number) =>
  y > GL - 0.5 && y < L1 && x > EMERGENCY.x0 && x < EMERGENCY.x1 + 0.3 && z > EMERGENCY.z0 && z < EMERGENCY.z1

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
  const ctx = { k, c, lighting, onPlan: !context, plant: new Planting(c.plants), shade: new Contact(), openings: context ? openingsOf(HOSPITAL_BASEMENT) : undefined }

  buildBuilding(ctx, building)
  buildSite(ctx, site)
  if (context) buildContext(ctx, site)
  else root.position.z = -PLAN_CENTRE_Z
  ctx.plant.build(site)
  ctx.shade.build(k, site)

  const highlights = new Map<string, MeshBasicMaterial>()
  for (const [name, { y, height, zones, eye, property }] of Object.entries(HOTSPOTS)) {
    if (property && !context) continue
    const g = new Group()
    g.name = name
    g.userData.height = height
    if (eye) g.userData.eye = eye
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

  // The emergency department's lamps light it alone, while it is viewed or walked through.
  const er = root.getObjectByName('emergency_department')
  const within = (o: Object3D | null): boolean => !!o && (o === er || within(o.parent))
  const pool = new LightPool(root, (l) => (er && within(l) ? ER_ROOM : 'exterior'), 6)
  // Two basement parking levels, built the first time a visitor goes below ground (not on the master plan).
  const basement = context ? new Basement(root, k, lighting, pool, HOSPITAL_BASEMENT, SITE, highlights) : undefined
  // On foot from the road: up the entrance walk towards the main doors.
  const walk: WalkArea = {
    start: [(WALK.x0 + WALK.x1) / 2, GL, PLOT.z1 - 2.5],
    yaw: 0,
    bounds: { x0: PLOT.x0, x1: PLOT.x1, z0: PLOT.z0, z1: PLOT.z1 },
    zoneAt: (x, y, z) => {
      const below = basement?.zoneAt(y) ?? 'exterior'
      return below === 'exterior' && er && inEmergency(x, y, z) ? ER_ROOM : below
    },
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
    setZone: (z) => pool.setZone(basement?.zone(z) ?? z),
    syncLights: () => pool.sync(),
    basement,
  }
}
