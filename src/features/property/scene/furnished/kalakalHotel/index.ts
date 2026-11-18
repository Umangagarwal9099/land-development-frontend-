import { BoxGeometry, Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial } from 'three'
import { GOLD } from '../../../../../lib/palette'
import { Basement, openingsOf } from '../basement'
import { Kit } from '../kit'
import { LightPool, Lighting, type FurnishedModel, type LiftHost, type WalkArea } from '../shared'
import { Contact } from '../kalakalMall/contact'
import { Planting } from '../kalakalMall/foliage'
import { HOTEL_BASEMENT } from './basement'
import type { HotelCtx } from './ctx'
import { terranovaMaterials } from './finishes'
import { CUP, DECK, DRIVE, FORECOURT, GL, LOBBY, MAIN, PLAN_CENTRE_Z, PLOT, RAMP, SERVICE, canopyFrontZ } from './plan'
import { buildPodium } from './podium'
import { buildContext, buildSite, SITE } from './site'
import { buildStarbucks } from './starbucks'
import { buildBackBlock } from './annex'

export { SITE }

/*
 * Terranova Hotel on commercial Plot A-04: an exterior model of the client's two references. The
 * podium of curved glass under a rising silver band, with the drum and its blade over the south
 * block and the deep LED-edged canopy over the drop-off; four floors behind the drum, glazed and
 * banded like it (the towers of reference 1 were taken off); and Starbucks' giant coffee
 * cup set into the main block at the north end of the front. Parking is in two basements reached
 * by a covered ramp down the south side; behind the hotel, only the pool deck. See plan.ts for how
 * the references were fitted to the 124′3″ × 340′7″ east-facing plot.
 */

type Zone = [x0: number, x1: number, z0: number, z1: number]

/** Tappable outdoor areas, in site coordinates. */
const HOTSPOTS: Record<string, { y: number; height: number; zones: Zone[] }> = {
  amenity_entrance: { y: GL, height: 6, zones: [[LOBBY.x0 - 4, LOBBY.x1, MAIN.front, canopyFrontZ(-2.5) - 0.5]] },
  amenity_starbucks: { y: GL, height: 5, zones: [[CUP.x - 4.4, CUP.x + 4.4, CUP.z - 1.5, CUP.z + 4.4]] },
  amenity_pool: { y: GL, height: 3, zones: [[DECK.x0, DECK.x1, DECK.z0, DECK.z1]] },
  amenity_parking: { y: 0.03, height: 3.2, zones: [[DRIVE.x0, DRIVE.x1, RAMP.top - 22.9, FORECOURT.z0]] },
  amenity_service: { y: 0.03, height: 3, zones: [[SERVICE.x0, SERVICE.x1, DECK.z1, FORECOURT.z0]] },
}

/**
 * Builds the design. `context` adds the roads and neighbouring ground round the plot, and the
 * basements under it; the master plan, which draws its own roads, builds it without them and with
 * the forecourt trimmed to the layout's road edge.
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
  const c = terranovaMaterials(k, lighting)
  const ctx: HotelCtx = { k, c, lighting, onPlan: !context, plant: new Planting(c.plants), shade: new Contact(), openings: context ? openingsOf(HOTEL_BASEMENT) : undefined }

  buildPodium(ctx, building)
  buildBackBlock(ctx, building)
  buildStarbucks(ctx, building)
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
  const basement = context ? new Basement(root, k, lighting, pool, HOTEL_BASEMENT, SITE, highlights) : undefined
  // On foot from the road: up the footpath and across the drive towards the canopy and the lobby.
  const walk: WalkArea = {
    start: [-1.0, GL, PLOT.z1 - 2.0],
    yaw: 0,
    bounds: { ...PLOT },
    zoneAt: (_x, y) => basement?.zoneAt(y) ?? 'exterior',
  }
  // Glass, metal and stone reflect the design's own sky (see kalakalMall/surfaces.ts).
  const reflective: MeshStandardMaterial[] = []
  root.traverse((o) => {
    const mats = (o as Mesh).material
    if (!mats) return
    for (const m of Array.isArray(mats) ? mats : [mats]) if (m instanceof MeshStandardMaterial && !reflective.includes(m)) reflective.push(m)
  })
  const clearGlass: MeshPhysicalMaterial[] = [c.glass]
  const setSky = (day: boolean) => {
    for (const m of reflective) {
      m.envMap = day ? c.env.day : c.env.dusk
      m.envMapIntensity = day ? 0.9 : 0.45
    }
    // By day the glass reads mostly as reflection; at dusk the lit floors show through it.
    for (const m of clearGlass) m.opacity = day ? 0.55 : 0.3
    c.shopGlass.opacity = day ? 0.58 : 0.3
  }
  setSky(false)
  const lifts: LiftHost | undefined = basement && {
    tick: (dt, walker) => basement.tick(dt, walker),
    liftNear: (p) => basement.liftNear(p),
  }
  return {
    root,
    highlights,
    walk,
    setDaylight: (day) => (lighting.set(day), setSky(day)),
    setZone: (z) => pool.setZone(basement?.zone(z) ?? z),
    syncLights: () => pool.sync(),
    basement,
    lifts,
  }
}
