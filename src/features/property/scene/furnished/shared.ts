import { Group, MeshStandardMaterial, type MeshStandardMaterialParameters, type PointLight, type Texture } from 'three'
import { Kit } from './kit'
import type { Paint } from './textures'

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
    for (const l of this.lamps) l.light.intensity = daylight ? l.day : l.night
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
