import { Group, type Camera, type MeshBasicMaterial, type PointLight } from 'three'
import type { Kit } from '../kit'
import { Contact } from '../kalakalMall/contact'
import { mergeStatic, prepareRaycast } from '../optimize'
import type { LightPool, Lighting } from '../shared'
import { rng } from '../textures'
import { buildRamp, buildStorey, Decals, type Ctx, type Site } from './build'
import { basementMaterials } from './materials'
import { B1, SLAB, type BasementSpec, type Level } from './spec'

export type { BasementSpec } from './spec'
export { B1, B2, LEVEL_Y } from './spec'

/** Kept whole when a level's static parts merge: the instanced cars, the hotspot, what hangs overhead. */
const LIVE = /^(inst_|amenity_|overhead$)/

/*
 * A design's two basement levels. Nothing is built until a visitor first goes below ground: the
 * building above opens as quickly as before, and the basements (each a few hundred thousand
 * triangles of structure, services and parked cars) cost nothing until wanted. Once built they
 * are kept with the design's model.
 *
 * Going below ground hides everything above it and the levels above the one in view, so the
 * level reads as a section model cut at its soffit: open from above, roofed from inside.
 */
export class Basement {
  readonly root = new Group()
  private storeys = new Map<Level, Group>()
  private overheads = new Map<Level, { group: Group; soffit: number }>()
  private ramps: { group: Group; levels: number[] }[] = []
  private level: number | null = null
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
  }

  get ready() {
    return this.storeys.size > 0
  }

  /** Builds both levels and their ramps (once), merged and ready for picking. */
  build() {
    if (this.ready) return this.root
    const m = basementMaterials(this.k, this.lighting)
    const r = rng(this.spec.seed)
    const ctxFor = (): Ctx => ({ k: this.k, m, spec: this.spec, lighting: this.lighting, shade: new Contact(), decals: new Decals(), r })
    for (const level of [-1, -2] as Level[]) {
      const ctx = ctxFor()
      const { group, highlight, hotspot } = buildStorey(ctx, level, this.site)
      ctx.shade.build(this.k, group)
      const overhead = group.getObjectByName('overhead') as Group
      mergeStatic(overhead, LIVE)
      mergeStatic(group, LIVE)
      this.overheads.set(level, { group: overhead, soffit: (level === -1 ? 0 : B1) - SLAB })
      this.root.add(group)
      this.storeys.set(level, group)
      this.highlights.set(hotspot.name, highlight)
      this.pool.adopt(`B${-level}`, group)
    }
    for (const ramp of this.spec.ramps) {
      const group = buildRamp(ctxFor(), ramp)
      mergeStatic(group, LIVE)
      this.root.add(group)
      this.ramps.push({ group, levels: [ramp.to, ramp.from].filter((l) => l < 0) })
    }
    this.model.add(this.root)
    prepareRaycast(this.root)
    if (this.level !== null) this.show(this.level)
    return this.root
  }

  /** Shows a level: null or 0 for the building above ground, −1 or −2 for a basement. */
  show(level: number | null) {
    this.level = level
    const under = level !== null && level < 0 && this.ready
    for (const child of this.model.children) {
      if (child === this.root || (child as PointLight).isPointLight) continue
      child.visible = !under
    }
    this.root.visible = under
    for (const [l, g] of this.storeys) g.visible = l === level
    for (const { group, levels } of this.ramps) group.visible = level !== null && levels.includes(level)
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

  /** The light zone for a view: a basement level's own while one is shown. */
  zone(z: string) {
    return this.level !== null && this.level < 0 && this.ready ? `B${-this.level}` : z
  }
}

