import { BoxGeometry, Group, Mesh, MeshBasicMaterial, type Object3D } from 'three'
import { GOLD } from '../../../../../lib/palette'
import { Kit } from '../kit'
import { LightPool, Lighting, type FurnishedModel } from '../shared'
import { BATHROOM, BEDROOM, buildBalcony, buildFacade, buildShell, CARPORT, CAR_BACK, FACE, FFL, GFL, HALL, KITCHEN, STEPS, type Ctx } from './house'
import { buildBathroom } from './bathroom'
import { buildBedroom } from './bedroom'
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

/** Tappable areas (the kitchen and the outdoor spaces), in site coordinates. */
/** A hall point (x across from the left wall, h above the floor, z from the back wall) in site coordinates. */
const hallAt = (x: number, h: number, z: number) => [HALL.x0 + x, GFL + h, HOUSE_Z + HALL.z0 + z]
/** The whole open hall, which both its rooms keep in view and the camera may roam. */
const HALL_SPACE: Zone = [HALL.x0, HALL.x0 + HALL.w, HOUSE_Z + HALL.z0, HOUSE_Z + HALL.z0 + HALL.d]
/** The passage from the hall to the bathroom door, seen through the hall's side opening. */
const PASSAGE: Zone = [HALL.x0 + HALL.w - 0.2, KITCHEN.x0 + KITCHEN.w, HOUSE_Z + BATHROOM.z0 + BATHROOM.d - 0.15, HOUSE_Z + CAR_BACK - 0.1]

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
    eye: { from: hallAt(1.85, 1.65, HALL.d - 0.25), to: hallAt(1.7, 0.85, 2.6) },
  },
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
      // The open hall is lit as one space from either of its rooms.
      if (o.name === 'hall_g') return 'hall'
    }
    return 'exterior'
  }
  const pool = new LightPool(root, zoneOf)
  return { root, highlights, setDaylight: (day) => lighting.set(day), setZone: (z) => pool.setZone(z === 'room_dining_g' || z === 'room_living_g' ? 'hall' : z), syncLights: () => pool.sync() }
}
