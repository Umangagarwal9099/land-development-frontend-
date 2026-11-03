import { BoxGeometry, Group, Mesh, MeshBasicMaterial, type Object3D } from 'three'
import { GOLD } from '../../../../../lib/palette'
import { Kit } from '../kit'
import { LightPool, Lighting, type FurnishedModel, type WalkArea } from '../shared'
import { BATH3, BATHROOM, BEDROOM, BEDROOM2, BEDROOM3, BEDROOM4, buildBalcony, buildFacade, buildShell, CARPORT, CAR_BACK, FACE, FFL, GFL, HALL, KITCHEN, LANDING, STAIR_HALL, STEPS, type Ctx } from './house'
import { buildBathroom } from './bathroom'
import { buildBathroom3 } from './bathroom3'
import { buildBedroom } from './bedroom'
import { buildBedroom2 } from './bedroom2'
import { buildBedroom3 } from './bedroom3'
import { buildBedroom4 } from './bedroom4'
import { buildCirculation } from './stairs'
import { buildKitchen } from './kitchen'
import { buildLiving, HALL_SPLIT } from './living'
import { d65Materials } from './materials'
import { buildContext, buildPlot, HOUSE_Z, PLOT, SITE } from './site'

export { SITE }

/*
 * Residence on Plot D-65, Kallakal: a G+1 contemporary home behind a charcoal frame, with a
 * ledgestone pier and double-height window, teak battens, a white first-floor box with a glass
 * balcony and teak lattice, and a carport beneath. An exterior model: the rooms behind the glass
 * are lit shells only. See house.ts for how the reference elevation was measured.
 */

type Zone = [x0: number, x1: number, z0: number, z1: number]

/** The façade's wall, whose inner face the walker starts from. */
const T_WALL = 0.23

/** Tappable areas (the kitchen and the outdoor spaces), in site coordinates. */
/** A hall point (x across from the left wall, h above the floor, z from the back wall) in site coordinates. */
const hallAt = (x: number, h: number, z: number) => [HALL.x0 + x, GFL + h, HOUSE_Z + HALL.z0 + z]
/** The whole open hall, which both its rooms keep in view and the camera may roam. */
const HALL_SPACE: Zone = [HALL.x0, HALL.x0 + HALL.w, HOUSE_Z + HALL.z0, HOUSE_Z + HALL.z0 + HALL.d]
/** What the hall's openings look into: the bedroom door and stair hall on one side, the kitchen's lobby behind. */
const PASSAGE: Zone = [HALL.x0, STAIR_HALL.x1, HOUSE_Z + KITCHEN.z0, HOUSE_Z + CAR_BACK - 0.1]

/**
 * Room hotspots: the floor zones that highlight and are picked. An open-plan room also names the
 * whole `space` it shares (kept by the room view's section box and camera, never highlighted), a
 * composed entry view (`eye`), and space beyond it to keep uncut (`reveal`).
 */
const HOTSPOTS: Record<string, { y: number; height: number; zones: Zone[]; space?: Zone; eye?: { from: number[]; to: number[] }; reveal?: Zone }> = {
  amenity_entrance: { y: GFL, height: 3.2, zones: [[STEPS[0], STEPS[1], HOUSE_Z + FACE, HOUSE_Z + 0.3]] },
  amenity_carport: { y: 0.05, height: 3.6, zones: [[CARPORT[0], CARPORT[1], HOUSE_Z + CAR_BACK, HOUSE_Z]] },
  amenity_balcony: { y: FFL, height: 2.9, zones: [[-1.12, CARPORT[1], HOUSE_Z + FACE, HOUSE_Z]] },
  room_kitchen: { y: GFL, height: KITCHEN.h, zones: [[KITCHEN.x0, KITCHEN.x0 + KITCHEN.w, HOUSE_Z + KITCHEN.z0, HOUSE_Z + KITCHEN.z0 + KITCHEN.d]] },
  room_bedroom_g: { y: GFL, height: 2.65, zones: [[BEDROOM.x0, BEDROOM.x0 + BEDROOM.w, HOUSE_Z + BEDROOM.z0 - BEDROOM.l, HOUSE_Z + BEDROOM.z0]] },
  room_dining_g: {
    y: GFL, height: 2.95, zones: [[HALL.x0, HALL.x0 + HALL.w, HOUSE_Z + HALL.z0, HOUSE_Z + HALL.z0 + HALL_SPLIT]], space: HALL_SPACE, reveal: PASSAGE,
    // From the living room's side, over the laid table to the built-in cabinetry.
    eye: { from: hallAt(1.55, 1.65, HALL.d - 1.5), to: hallAt(1.3, 1.05, 0.7) },
  },
  room_living_g: {
    y: GFL, height: 2.95, zones: [[HALL.x0, HALL.x0 + HALL.w, HOUSE_Z + HALL.z0 + HALL_SPLIT, HOUSE_Z + HALL.z0 + HALL.d]], space: HALL_SPACE, reveal: PASSAGE,
    // From the window end, between the sofa on the right and the TV wall on the left.
    eye: { from: hallAt(1.85, 1.65, HALL.d - 0.25), to: hallAt(1.7, 0.85, 3.6) },
  },
  // Tall enough to keep the first-floor landing and its guard in the cut.
  room_stairs_g: {
    y: GFL, height: 4.6, zones: [[STAIR_HALL.x0, STAIR_HALL.x1, HOUSE_Z + STAIR_HALL.z0, HOUSE_Z + STAIR_HALL.z1]],
    // From the hall's opening, up the lower flight to the winders.
    eye: { from: [STAIR_HALL.x0 + 0.25, GFL + 1.5, HOUSE_Z + STAIR_HALL.z0 + 0.2], to: [LANDING.x0 + 0.1, GFL + 1.35, HOUSE_Z + LANDING.z0 + 0.3] },
  },
  room_bedroom_2: { y: FFL, height: 2.6, zones: [[BEDROOM2.x1 - BEDROOM2.w, BEDROOM2.x1, HOUSE_Z + BEDROOM2.z0, HOUSE_Z + BEDROOM2.z0 + BEDROOM2.d]] },
  room_bedroom_3: { y: FFL, height: 2.6, zones: [[BEDROOM3.x0, BEDROOM3.x0 + BEDROOM3.w, HOUSE_Z + BEDROOM3.z1 - BEDROOM3.l, HOUSE_Z + BEDROOM3.z1]] },
  room_bath_3: { y: FFL, height: 2.5, zones: [[BATH3.x1 - BATH3.w, BATH3.x1, HOUSE_Z + BATH3.z0, HOUSE_Z + BATH3.z0 + BATH3.d]] },
  room_bedroom_4: { y: FFL, height: 2.6, zones: [[BEDROOM4.x1 - BEDROOM4.w, BEDROOM4.x1, HOUSE_Z + BEDROOM4.z0, HOUSE_Z + BEDROOM4.z0 + BEDROOM4.d]] },
  room_bath_g: { y: GFL, height: 2.2, zones: [[BATHROOM.x0, BATHROOM.x0 + BATHROOM.w, HOUSE_Z + BATHROOM.z0, HOUSE_Z + BATHROOM.z0 + BATHROOM.d]] },
  amenity_garden: { y: 0.04, height: 2.6, zones: [[PLOT.x0 + 0.23, STEPS[0] - 0.05, HOUSE_Z + FACE, PLOT.z1]] },
}

/**
 * Builds the residence. `context` adds the roads and neighbouring ground around the plot; the
 * master plan, which draws its own roads, builds it without them.
 */
export function buildKalakalD65(context = true): FurnishedModel {
  const root = new Group()
  root.name = 'kalakal_d65'
  const site = new Group()
  site.name = 'outdoor'
  const house = new Group()
  house.name = 'house'
  house.position.z = HOUSE_Z
  root.add(site, house)

  const lighting = new Lighting()
  const k = new Kit(house)
  const out = new Kit(site, k)
  const ctx: Ctx = { k, out, c: d65Materials(k, lighting), lighting }
  // Downlights and LED lines at 3000 K, rather than the house kit's amber.
  k.glow.emissive.set('#fff0dc')
  lighting.glow(k.glow, 0.35)

  buildShell(ctx)
  buildFacade(ctx)
  buildBalcony(ctx)
  buildKitchen(ctx)
  buildBedroom(ctx)
  buildBathroom(ctx)
  buildLiving(ctx)
  buildCirculation(ctx)
  buildBedroom2(ctx)
  buildBedroom3(ctx)
  buildBathroom3(ctx)
  buildBedroom4(ctx)
  buildPlot(ctx)
  if (context) buildContext(ctx)

  const highlights = new Map<string, MeshBasicMaterial>()
  for (const [name, { y, height, zones, space, eye, reveal }] of Object.entries(HOTSPOTS)) {
    const g = new Group()
    g.name = name
    g.userData.height = height
    if (eye) g.userData.eye = eye
    if (reveal) g.userData.reveal = { min: [reveal[0], y, reveal[2]], max: [reveal[1], y + height, reveal[3]] }
    const mat = new MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0, depthWrite: false })
    for (const [x0, x1, z0, z1] of zones) {
      const s = new Mesh(new BoxGeometry(x1 - x0, 0.01, z1 - z0), mat)
      s.position.set((x0 + x1) / 2, y + 0.02, (z0 + z1) / 2)
      s.renderOrder = 2
      g.add(s)
    }
    if (space) {
      const [x0, x1, z0, z1] = space
      const v = new Mesh(new BoxGeometry(x1 - x0, 0.01, z1 - z0), mat)
      v.position.set((x0 + x1) / 2, y + 0.02, (z0 + z1) / 2)
      v.visible = false
      g.add(v)
    }
    site.add(g)
    highlights.set(name, mat)
  }

  // Each lamp belongs to the room it stands in; everything else (façade, windows, garden) is exterior.
  const zoneOf = (light: Object3D) => {
    for (let o: Object3D | null = light; o; o = o.parent) {
      if (o.name === 'kitchen') return 'room_kitchen'
      if (o.name === 'bedroom_g') return 'room_bedroom_g'
      if (o.name === 'bathroom_g') return 'room_bath_g'
      if (o.name === 'bedroom_2') return 'room_bedroom_2'
      if (o.name === 'bedroom_3') return 'room_bedroom_3'
      if (o.name === 'bathroom_3') return 'room_bath_3'
      if (o.name === 'bedroom_4') return 'room_bedroom_4'
      if (o.name === 'stairs_g') return 'room_stairs_g'
      // The open hall is lit as one space from either of its rooms.
      if (o.name === 'hall_g') return 'hall'
    }
    return 'exterior'
  }
  const pool = new LightPool(root, zoneOf)
  // Inside the house the walker takes the room's lamps; upstairs and outdoors, the façade's and first floor's.
  const inside = (x: number, z: number, zone: Zone) => x >= zone[0] && x <= zone[1] && z >= zone[2] && z <= zone[3]
  const walk: WalkArea = {
    start: [-0.7, GFL, HOUSE_Z + FACE - T_WALL - 0.75],
    yaw: 0,
    bounds: { x0: PLOT.x0, x1: PLOT.x1, z0: PLOT.z0, z1: PLOT.z1 },
    zoneAt: (x, y, z) => {
      const stair = HOTSPOTS.room_stairs_g.zones[0]
      if (inside(x, z, stair)) return 'room_stairs_g'
      if (y > FFL - 0.3) {
        if (inside(x, z, HOTSPOTS.room_bedroom_3.zones[0])) return 'room_bedroom_3'
        if (inside(x, z, HOTSPOTS.room_bath_3.zones[0])) return 'room_bath_3'
        if (inside(x, z, HOTSPOTS.room_bedroom_4.zones[0])) return 'room_bedroom_4'
        return inside(x, z, HOTSPOTS.room_bedroom_2.zones[0]) ? 'room_bedroom_2' : 'exterior'
      }
      for (const name of ['room_kitchen', 'room_bedroom_g', 'room_bath_g', 'room_dining_g', 'room_living_g'])
        if (inside(x, z, HOTSPOTS[name].zones[0])) return name
      // The kitchen's lobby and the way to the bedroom door borrow their neighbours' light.
      if (inside(x, z, [HALL.x0, BEDROOM.x0, HOUSE_Z + KITCHEN.z0 + KITCHEN.d, HOUSE_Z + HALL.z0])) return 'room_kitchen'
      if (inside(x, z, [HALL.x0, STAIR_HALL.x1, HOUSE_Z + HALL.z0, HOUSE_Z + FACE])) return 'room_dining_g'
      return 'exterior'
    },
  }
  return { root, highlights, walk, setDaylight: (day) => lighting.set(day), setZone: (z) => pool.setZone(z === 'room_dining_g' || z === 'room_living_g' ? 'hall' : z), syncLights: () => pool.sync() }
}
