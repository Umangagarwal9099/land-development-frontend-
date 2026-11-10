import { Group, Mesh, type Camera, type MeshBasicMaterial, type Object3D, type PointLight, type Vector3 } from 'three'
import type { Kit } from '../kit'
import { Contact } from '../kalakalMall/contact'
import { mergeStatic, prepareRaycast } from '../optimize'
import type { LightPool, Lighting } from '../shared'
import { rng } from '../textures'
import type { Point2 } from '../../../../../api/types'
import { buildAccess, shaftRect, type Lift } from './access'
import { buildRamp, buildStorey, Decals, type Ctx, type Site } from './build'
import { basementMaterials } from './materials'
import { axisOf, B1, rampRect, signOf, SLAB, type BasementSpec, type Level, type Rect } from './spec'

export type { BasementSpec } from './spec'
export type { Lift } from './access'
export { B1, B2, LEVEL_Y } from './spec'

/**
 * Kept whole when a level's static parts merge: the instanced cars and their collision proxy, the
 * hotspot, what hangs overhead, the earth, and everything that moves (lift cars, doors, buttons).
 */
const LIVE = /^(inst_|proxy_|amenity_|overhead$|earth$|liftcar_|liftdoor_|door_|button_)/

/**
 * What the building above leaves open for the way down, in the property view: the stair well and
 * lift shafts through its ground floor, the ramp tunnels through its podium, and the doors in the
 * lobby wall the core opens through (centres on the core's face, and widths).
 */
export interface Openings {
  wells: Rect[]
  ramps: Rect[]
  doors: { x: number; z: number; w: number }[]
}

export function openingsOf(spec: BasementSpec): Openings {
  const a = spec.access
  const r = a.rect
  const face = axisOf(a.face) === 'x' ? (signOf(a.face) > 0 ? r.x1 : r.x0) : signOf(a.face) > 0 ? r.z1 : r.z0
  const onFace = (at: number, w: number) => (axisOf(a.face) === 'x' ? { x: face, z: at, w } : { x: at, z: face, w })
  return {
    wells: [a.stair.zone, ...a.lifts.map(shaftRect)],
    ramps: spec.ramps.filter((rp) => rp.from === 0).map((rp) => rampRect(rp)),
    doors: [...a.lifts.map((l) => onFace(axisOf(a.face) === 'x' ? l.z : l.x, 1.3)), onFace(a.stair.at, 1.1)],
  }
}

/** A plan rectangle as a polygon, for holes in slabs. */
export const rectPoly = (r: Rect): Point2[] => [
  [r.x0, r.z0],
  [r.x1, r.z0],
  [r.x1, r.z1],
  [r.x0, r.z1],
]

/** How the basements are being shown: from above at a level, the building above, or walking. */
export type BasementView = number | null | 'walk'

/*
 * A design's two basement levels and the lifts and stair down to them. Nothing is built until a
 * visitor first goes below ground (or sets off walking): the building above opens as quickly as
 * before. Once built they are kept with the design's model.
 *
 * From above, a basement level reads as a section model cut at its soffit, everything above it
 * hidden. Walking, nothing is hidden or switched: the building and both levels stand together,
 * joined by the real ramps, stair and lifts; only the sun's shadow from the building above is
 * set aside while the walker is underground, where the car park's own lighting takes over.
 */
export class Basement {
  readonly root = new Group()
  private storeys = new Map<Level, Group>()
  private ground = new Group()
  private cars = new Group()
  /** Ramps and stair storeys, each with the levels (0 for the ground) it belongs to. */
  private links: { group: Group; levels: number[] }[] = []
  private overheads = new Map<Level, { group: Group; soffit: number }>()
  private earths: Group[] = []
  lifts: Lift[] = []
  /**
   * Called once as the levels are built, before their static parts merge: the building above
   * adds what it brings down into the car park (its own lift shafts and landings) to each level.
   */
  readonly onBuild: ((at: (level: Level) => Group) => void)[] = []
  private view: BasementView = null
  private below = false
  private shadowCasters: Mesh[] = []
  private voids: Object3D[] = []
  private model: Group
  private k: Kit
  private lighting: Lighting
  private pool: LightPool
  readonly spec: BasementSpec
  private site: Site
  private highlights: Map<string, MeshBasicMaterial>

  constructor(model: Group, k: Kit, lighting: Lighting, pool: LightPool, spec: BasementSpec, site: Site, highlights: Map<string, MeshBasicMaterial>) {
    this.model = model
    this.k = k
    this.lighting = lighting
    this.pool = pool
    this.spec = spec
    this.site = site
    this.highlights = highlights
    this.root.name = 'basement'
    this.root.visible = false
    this.ground.name = 'access_ground'
    this.cars.name = 'lifts'
    // Stand-ins the design built for the openings down (dark mouths, closed floors), shown until
    // the real ramps and stair are there to be seen through them.
    model.traverse((o) => {
      if (o.name.startsWith('void_')) this.voids.push(o)
    })
  }

  get ready() {
    return this.storeys.size > 0
  }

  /** Builds both levels, their ramps, and the lifts and stair (once), merged and ready for picking. */
  build() {
    if (this.ready) return this.root
    const m = basementMaterials(this.k, this.lighting)
    const r = rng(this.spec.seed)
    const ctxFor = (): Ctx => ({ k: this.k, m, spec: this.spec, lighting: this.lighting, shade: new Contact(), decals: new Decals(), r })
    for (const level of [-1, -2] as Level[]) {
      const ctx = ctxFor()
      const { group, highlight, hotspot } = buildStorey(ctx, level, this.site)
      ctx.shade.build(this.k, group)
      this.storeys.set(level, group)
      this.highlights.set(hotspot.name, highlight)
      this.overheads.set(level, { group: group.getObjectByName('overhead') as Group, soffit: (level === -1 ? 0 : B1) - SLAB })
      this.earths.push(group.getObjectByName('earth') as Group)
      this.root.add(group)
    }
    for (const ramp of this.spec.ramps) {
      const group = buildRamp(ctxFor(), ramp)
      this.root.add(group)
      this.links.push({ group, levels: [ramp.from, ramp.to] })
    }
    // The lifts and stair: each level's part into that level (the ground's into its own group).
    const access = buildAccess(ctxFor(), this.spec.access, (level) => (level === 0 ? this.ground : this.storeys.get(level as Level)!), this.cars)
    this.lifts = access.lifts
    for (const s of access.stairs) {
      this.root.add(s.group)
      this.links.push(s)
    }
    this.root.add(this.ground, this.cars)
    for (const add of this.onBuild) add((level) => this.storeys.get(level)!)
    // Merge the static parts of each part separately, so each shows and hides on its own.
    for (const g of [...this.overheads.values()].map((o) => o.group)) mergeStatic(g, LIVE)
    for (const g of this.earths) mergeStatic(g, LIVE)
    for (const g of [...this.storeys.values(), ...this.links.map((l) => l.group), this.ground]) mergeStatic(g, LIVE)
    for (const [level, group] of this.storeys) this.pool.adopt(`B${-level}`, group)
    this.model.add(this.root)
    prepareRaycast(this.root)
    // The building above's shadow casters, set aside while the walker is underground.
    for (const child of this.model.children)
      if (child !== this.root)
        child.traverse((o) => {
          if (o instanceof Mesh && o.castShadow) this.shadowCasters.push(o)
        })
    this.show(this.view)
    return this.root
  }

  /** Shows a level from above (−1, −2), the building (null or 0), or everything for walking. */
  show(view: BasementView) {
    this.view = view
    if (!this.ready) return
    const walk = view === 'walk'
    const level = walk || view === 0 ? null : view
    const under = level !== null && level < 0
    for (const child of this.model.children) {
      if (child === this.root || (child as PointLight).isPointLight) continue
      child.visible = !under
    }
    for (const v of this.voids) v.visible = false
    this.root.visible = true
    for (const [l, g] of this.storeys) g.visible = walk || l === level
    for (const e of this.earths) e.visible = !walk
    // Ramps and stair storeys show with either of their levels; from the ground, with the building.
    const at = level ?? 0
    for (const { group, levels } of this.links) group.visible = walk || levels.includes(at)
    this.ground.visible = walk || !under
    if (!walk) {
      for (const lift of this.lifts) lift.park(at)
      this.setBelow(false)
    }
    this.pool.setZone(this.zone('exterior'))
  }

  /**
   * Each frame: the services under the soffit show only with the camera inside the level (an eye
   * level view), not from above, where they would hide the plan. Returns whether that changed.
   */
  frame(camera: Camera) {
    let changed = false
    for (const { group, soffit } of this.overheads.values()) {
      const show = camera.position.y < soffit
      if (group.visible !== show) [group.visible, changed] = [show, true]
    }
    return changed
  }

  /**
   * Advances the lifts by dt; `walker` (its feet), when walking, rides them and holds their doors.
   * Returns whether anything is moving.
   */
  tick(dt: number, walker: Vector3 | null) {
    let busy = false
    const rider = walker ? { position: walker } : null
    for (const lift of this.lifts) {
      lift.tick(dt, rider)
      busy ||= lift.busy
    }
    // Cars and doors moved: the walker's collisions this frame must see them where they now are.
    if (busy) this.root.updateMatrixWorld()
    return busy
  }

  /** The lift the walker is in or stepping into (in its doorway), whose panel they can use. */
  liftNear(p: Vector3) {
    return this.lifts.find((l) => l.reachable(p)) ?? null
  }

  /** The lift the walker is standing in, if any. */
  liftAboard(p: Vector3) {
    return this.lifts.find((l) => l.aboard(p)) ?? null
  }

  /**
   * The walker has gone below ground (or come back up): the building above stops casting the sun's
   * shadow over the car park, which its own lights take over. Returns whether that changed.
   */
  setBelow(below: boolean) {
    if (below === this.below) return false
    this.below = below
    for (const m of this.shadowCasters) m.castShadow = !below
    return true
  }

  /** The light zone for a view: a basement level's own while one is shown or walked. */
  zone(z: string) {
    const hot = /^amenity_b(\d)$/.exec(z)
    if (hot) return `B${hot[1]}`
    return typeof this.view === 'number' && this.view < 0 && this.ready ? `B${-this.view}` : z
  }

  /** Which level a walker at height y is on, as its hotspot (for the light pool and the overlay). */
  zoneAt(y: number) {
    if (y < B1 - 1.6) return 'amenity_b2'
    if (y < -1.4) return 'amenity_b1'
    return 'exterior'
  }
}
