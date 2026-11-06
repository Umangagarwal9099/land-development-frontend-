import { Group, MeshStandardMaterial, PointLight, Vector3, type Camera, type Object3D, type MeshBasicMaterial, type MeshStandardMaterialParameters, type Texture } from 'three'
import type { Basement, Lift } from './basement'
import { Kit } from './kit'
import type { Paint } from './textures'

/** Where walking mode may go in a design, and how it maps a position to a lighting zone. */
export interface WalkArea {
  start: [number, number, number]
  yaw: number
  bounds: { x0: number; x1: number; z0: number; z1: number }
  zoneAt: (x: number, y: number, z: number) => string
}

/** A furnished design model, as built in code: its scene graph, hotspot highlights and lighting. */
export interface FurnishedModel {
  root: Group
  /** Hotspot overlay material per room mesh name, used to highlight the selection. */
  highlights: Map<string, MeshBasicMaterial>
  /** Switches the model's own lights between the evening scheme and daylight. */
  setDaylight?: (daylight: boolean) => void
  /** Resolves when textures loaded after the build (e.g. photographs) have arrived. */
  ready?: Promise<void>
  /** With a light pool: lights the zone in view ('exterior', or a room's hotspot name)... */
  setZone?: (zone: string) => void
  /** ...and keeps the pool in step with switches and day/night, each frame. */
  syncLights?: () => void
  /** Present on designs that can be walked through. */
  walk?: WalkArea
  /** Basement parking levels under the building, built the first time one is visited. */
  basement?: Basement
  /** Lifts a walker can ride, when the design has any besides the basement's (which they include). */
  lifts?: LiftHost
  /**
   * Told what is being looked at: the floor chosen on the level rail (null for the whole
   * building), whether someone is walking, and the room open in the room viewer.
   */
  setView?: (view: ModelView) => void
  /** Each frame, with the camera: returns whether anything it shows or hides changed. */
  frame?: (camera: Camera) => boolean
}

export interface ModelView {
  level: number | null
  walking: boolean
  room: string | null
}

/** The lifts of a design, run each frame: the walker rides them and uses their panels. */
export interface LiftHost {
  /** Advances every lift by dt; `walker` (their feet), when walking, rides them. Returns whether any is moving. */
  tick: (dt: number, walker: Vector3 | null) => boolean
  /** The lift the walker is in or stepping into, whose panel they can use. */
  liftNear: (p: Vector3) => Lift | null
}

/**
 * Everything that glows or lights up, with its evening strength and how much of it is left in
 * daylight (interiors stay softly lit by day; facade, landscape and pool lights switch off).
 */
export class Lighting {
  private items: { mat: MeshStandardMaterial; night: number; day: number }[] = []
  private lamps: { light: PointLight; night: number; day: number }[] = []

  glow(mat: MeshStandardMaterial, dayFactor: number) {
    this.items.push({ mat, night: mat.emissiveIntensity, day: mat.emissiveIntensity * dayFactor })
    return mat
  }

  light(light: PointLight, dayFactor: number) {
    this.lamps.push({ light, night: light.intensity, day: light.intensity * dayFactor })
    return light
  }

  set(daylight: boolean) {
    for (const i of this.items) i.mat.emissiveIntensity = daylight ? i.day : i.night
    for (const l of this.lamps) {
      const value = daylight ? l.day : l.night
      // A lamp on a dimmed circuit keeps its dimming; its full brightness follows day and night.
      if (l.light.userData.full !== undefined) l.light.userData.full = value
      l.light.intensity = value * ((l.light.userData.level as number | undefined) ?? 1)
    }
  }
}

const painted = new WeakMap<Kit, Map<string, MeshStandardMaterial>>()

/** One material per painted surface per model, shared by every piece that uses it. */
export function paintedMat({ k }: { k: Kit }, key: string, w: number, h: number, paint: Paint, extra: Partial<MeshStandardMaterial> = {}) {
  let cache = painted.get(k)
  if (!cache) painted.set(k, (cache = new Map()))
  let mat = cache.get(key)
  if (!mat) {
    mat = new MeshStandardMaterial({ map: k.tex.painted(w, h, paint), roughness: 0.6 })
    Object.assign(mat, extra)
    cache.set(key, mat)
  }
  return mat
}

const tiles = new WeakMap<Kit, Map<string, Texture>>()

/**
 * A painted, tiling surface (brick, stone, thatch) sized to the face it covers: the canvas is
 * painted once per model, and each surface gets a repeat-adjusted clone of it.
 */
export function tiledMat(k: Kit, key: string, paint: Paint, repeat: [number, number], params: MeshStandardMaterialParameters = {}, size = 512) {
  let cache = tiles.get(k)
  if (!cache) tiles.set(k, (cache = new Map()))
  let base = cache.get(key)
  if (!base) cache.set(key, (base = k.tex.painted(size, size, paint)))
  const t = base.clone()
  t.repeat.set(repeat[0], repeat[1])
  return new MeshStandardMaterial({ map: t, roughness: 0.85, ...params })
}

/** A kit that builds at a raised ground level, for sites that step down a slope. */
export function levelKit(k: Kit, y: number) {
  const g = new Group()
  g.position.y = y
  k.root.add(g)
  return new Kit(g, k)
}

/**
 * A fixed set of real point lights standing in for a model's many logical ones. Every point light
 * in a scene is evaluated for every pixel of every material, so a house with 26 lamps pays for 26
 * even inside one room. The pool keeps a constant count (no shader recompiles as views change)
 * and is filled with the lights of the current zone: the exterior, or the room being viewed.
 * Logical lights keep their roles: circuits and day/night still set their intensity.
 */
export class LightPool {
  private pool: PointLight[] = []
  private active: { light: PointLight; at: Vector3 }[] = []
  private zones = new Map<string, { light: PointLight; at: Vector3 }[]>()
  private root: Group

  constructor(root: Group, zoneOf: (light: PointLight) => string, size = 8) {
    this.root = root
    root.updateMatrixWorld(true)
    const toRoot = root.matrixWorld.clone().invert()
    const lights: PointLight[] = []
    root.traverse((o) => {
      if ((o as PointLight).isPointLight) lights.push(o as PointLight)
    })
    for (const light of lights) {
      const at = light.getWorldPosition(new Vector3()).applyMatrix4(toRoot)
      const zone = zoneOf(light)
      if (!this.zones.has(zone)) this.zones.set(zone, [])
      this.zones.get(zone)!.push({ light, at })
      // Off the scene graph: the renderer no longer counts it, the pool lights in its place.
      light.removeFromParent()
    }
    for (let i = 0; i < size; i++) {
      const l = new PointLight('#ffffff', 0, 1, 2)
      l.name = 'pool_light'
      root.add(l)
      this.pool.push(l)
    }
    this.setZone('exterior')
  }

  /** Takes the point lights under `part` (added to the model after the pool was made) as a zone of their own. */
  adopt(zone: string, part: Object3D) {
    this.root.updateMatrixWorld(true)
    const toRoot = this.root.matrixWorld.clone().invert()
    const lights: PointLight[] = []
    part.traverse((o) => {
      if ((o as PointLight).isPointLight) lights.push(o as PointLight)
    })
    const list = this.zones.get(zone) ?? []
    for (const light of lights) {
      list.push({ light, at: light.getWorldPosition(new Vector3()).applyMatrix4(toRoot) })
      light.removeFromParent()
    }
    this.zones.set(zone, list)
  }

  /** Lights the zone (a room's hotspot name, or 'exterior'), strongest lamps first. */
  setZone(zone: string) {
    const lights = this.zones.get(zone) ?? this.zones.get('exterior') ?? []
    this.active = [...lights].sort((a, b) => b.light.intensity * b.light.distance - a.light.intensity * a.light.distance).slice(0, this.pool.length)
    this.sync()
  }

  /** Copies the zone's logical lights onto the pool; cheap enough to run every rendered frame. */
  sync() {
    this.pool.forEach((p, i) => {
      const a = this.active[i]
      if (!a) {
        p.intensity = 0
        return
      }
      p.position.copy(a.at)
      p.color.copy(a.light.color)
      p.intensity = a.light.intensity
      p.distance = a.light.distance
      p.decay = a.light.decay
    })
  }
}
