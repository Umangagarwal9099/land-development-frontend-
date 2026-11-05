import { EquirectangularReflectionMapping, MeshPhysicalMaterial, MeshStandardMaterial, Vector2, type Material, type Texture } from 'three'
import type { Kit } from '../kit'
import { paintedMat, tiledMat, type Lighting } from '../shared'
import type { Paint } from '../textures'
import { basementEnv, fireDoor, hazard, hoseCabinet, liftDoors, linePaint, louvre, rampGrooves, soffit, vdfFloor, wallPaint } from './paints'

/** Each level's colour, carried by its wall band, column bands and level boards. */
export const LEVEL_COLOUR: Record<number, string> = { [-1]: '#1f5fae', [-2]: '#2c8a52' }

const std = (p: ConstructorParameters<typeof MeshStandardMaterial>[0]) => new MeshStandardMaterial({ roughness: 0.8, ...p })

/**
 * The basement's materials: physically based, tuned to read as built concrete and steel under
 * cool LED light. Shared by both levels except where a level's colour comes in (walls).
 */
export function basementMaterials(k: Kit, lighting: Lighting) {
  const env = k.tex.painted(1024, 512, basementEnv)
  env.mapping = EquirectangularReflectionMapping
  const withEnv = <M extends MeshStandardMaterial>(m: M, intensity = 0.6) => {
    m.envMap = env
    m.envMapIntensity = intensity
    return m
  }
  const ctx = { k }

  // Floors: true scale (UVs in metres), with relief from their own painting.
  const ground = (key: string, paint: Paint, tile: number, roughness: number, relief: number, size = 1024) => {
    const repeat: [number, number] = [1 / tile, 1 / tile]
    const m = tiledMat(k, `bsmt_${key}`, paint, repeat, { roughness }, size)
    m.normalMap = k.tex.normalPainted(`bsmt_${key}`, size, size, paint, ...repeat)
    m.normalScale = new Vector2(relief, relief)
    return withEnv(m, 0.35)
  }
  const glowing = (key: string, w: number, h: number, paint: Paint, intensity: number) => {
    const m = paintedMat(ctx, `bsmt_${key}`, w, h, paint, { roughness: 0.4 })
    if (!m.emissiveMap) {
      m.emissiveMap = m.map
      m.emissive.set('#ffffff')
      m.emissiveIntensity = intensity
      lighting.glow(m, 1)
    }
    return m
  }
  const walls = new Map<string, MeshStandardMaterial>()

  return {
    env,
    withEnv,
    glowing,
    /** A painted sign or label, cached by key. */
    painted: (key: string, w: number, h: number, paint: Paint, extra: Partial<MeshStandardMaterial> = {}) => paintedMat(ctx, `bsmt_${key}`, w, h, paint, extra),
    floor: ground('floor', vdfFloor, 8, 0.62, 0.35),
    ramp: ground('ramp', rampGrooves, 2, 0.85, 0.9, 512),
    /** A retaining or ramp wall's inner face, `length` m long, in the level's colour. */
    wall: (level: number, length: number) => {
      const key = `${level}|${length.toFixed(2)}`
      let m = walls.get(key)
      if (!m) walls.set(key, (m = tiledMat(k, `bsmt_wall${level}`, wallPaint(LEVEL_COLOUR[level]), [length / 4.8, 1], { roughness: 0.88 }, 1024)))
      return m
    },
    soffit: (() => {
      return tiledMat(k, 'bsmt_soffit', soffit, [1 / 4.8, 1 / 4.8], { roughness: 0.95 }, 512)
    })(),
    /** Raw concrete: cut sections, beams, slab edges, plinths. */
    concrete: std({ color: '#8a8782', roughness: 0.92, map: k.tex.finish('plaster', 2, 2) }),
    cut: std({ color: '#5d5b57', roughness: 0.95 }),
    earth: std({ color: '#1d2320', roughness: 0.92 }),
    blockwork: std({ color: '#e4e3de', roughness: 0.9 }),
    lobbyTile: std({ color: '#c9c5bd', roughness: 0.35, map: k.tex.finish('travertine', 3, 3) }),
    whiteLine: paintedMat(ctx, 'bsmt_whiteline', 128, 128, linePaint('#ecebe4'), { roughness: 0.7 }),
    yellowLine: paintedMat(ctx, 'bsmt_yellowline', 128, 128, linePaint('#e2b21c'), { roughness: 0.7 }),
    accessible: std({ color: '#2a5fae', roughness: 0.7 }),
    evGreen: std({ color: '#2c9a5a', roughness: 0.7 }),
    hazard: paintedMat(ctx, 'bsmt_hazard', 128, 128, hazard, { roughness: 0.75 }),
    rubber: std({ color: '#1b1b1b', roughness: 0.9 }),
    galvanised: withEnv(std({ color: '#a7abad', metalness: 0.8, roughness: 0.42 }), 0.8),
    steel: withEnv(std({ color: '#55595c', metalness: 0.7, roughness: 0.45 }), 0.7),
    stainless: withEnv(paintedMat(ctx, 'bsmt_liftdoors', 256, 512, liftDoors, { metalness: 0.85, roughness: 0.3 }), 1),
    aluminium: withEnv(std({ color: '#b8bcbf', metalness: 0.85, roughness: 0.35 }), 0.8),
    fireRed: withEnv(std({ color: '#b3161b', roughness: 0.45 }), 0.5),
    sprinklerRed: std({ color: '#a8191c', roughness: 0.55 }),
    pvc: std({ color: '#8b8f92', roughness: 0.6 }),
    cable: std({ color: '#202122', roughness: 0.7 }),
    white: std({ color: '#efefec', roughness: 0.5 }),
    black: std({ color: '#141516', roughness: 0.5 }),
    yellow: std({ color: '#e0ad17', roughness: 0.6 }),
    brass: withEnv(std({ color: '#b08a4a', metalness: 0.9, roughness: 0.35 }), 0.8),
    fanGrey: withEnv(std({ color: '#6c7073', metalness: 0.5, roughness: 0.5 }), 0.6),
    glass: new MeshPhysicalMaterial({ color: '#b9cdd2', roughness: 0.05, transparent: true, opacity: 0.25, depthWrite: false, envMap: env, envMapIntensity: 1 }),
    mirror: std({ color: '#d5d8da', metalness: 1, roughness: 0.05, envMap: env, envMapIntensity: 1.2 }),
    fireDoor: paintedMat(ctx, 'bsmt_firedoor', 256, 512, fireDoor, { roughness: 0.6 }),
    hoseCabinet: paintedMat(ctx, 'bsmt_hose', 256, 384, hoseCabinet, { roughness: 0.5 }),
    louvre: paintedMat(ctx, 'bsmt_louvre', 256, 256, louvre, { roughness: 0.6, metalness: 0.5 }),
    /** LED batten diffusers: cool white, as specified for car parks (5000–6000 K). */
    led: lighting.glow(std({ color: '#f6f9ff', emissive: '#e9f0ff', emissiveIntensity: 2.4, roughness: 0.4 }), 1),
    /** Status LEDs: the CCTV ring, the call point, the EV charger. */
    ledRed: lighting.glow(std({ color: '#ff3b30', emissive: '#ff2a1f', emissiveIntensity: 2, roughness: 0.4 }), 1),
    ledGreen: lighting.glow(std({ color: '#3cff8a', emissive: '#22e070', emissiveIntensity: 1.6, roughness: 0.4 }), 1),
  }
}

export type BasementMaterials = ReturnType<typeof basementMaterials>

/** Clones a material once for the basement, reflecting its environment instead of the sky outside. */
export function underground(cache: Map<Material, Material>, m: Material, env: Texture) {
  let c = cache.get(m)
  if (!c) {
    c = m.clone()
    if (c instanceof MeshStandardMaterial) {
      c.envMap = env
      c.envMapIntensity = 0.75
    }
    cache.set(m, c)
  }
  return c
}
