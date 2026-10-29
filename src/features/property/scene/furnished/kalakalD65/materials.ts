import { DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial, Vector2, type MeshStandardMaterialParameters } from 'three'
import type { Kit } from '../kit'
import { tiledMat, type Lighting } from '../shared'
import { asphalt, creamMarble, exteriorPaint, foliage, ledgestone, lightOak, oakFloor, pavers, porcelain, teak, trellisRug, walnut, whiteMarble } from './paints'

const std = (p: MeshStandardMaterialParameters) => new MeshStandardMaterial({ roughness: 0.8, ...p })
const hexRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))

/** Real-world size, in metres, of one tile of each painted surface. */
const TILE = { stone: 0.6, teak: 0.6, pavers: 2.4, asphalt: 4, white: 2, greige: 2, porcelain: 2.4, splash: 1.2, oak: 0.6, walnut: 0.6, oakFloor: 2.4, marbleWhite: 1.2, rug: 0.8 } as const
type Surface = keyof typeof TILE

const PAINTS = {
  stone: ledgestone,
  teak,
  pavers,
  asphalt,
  white: exteriorPaint([247, 245, 241], 5),
  greige: exteriorPaint([214, 207, 196], 6),
  porcelain,
  splash: creamMarble,
  oak: lightOak,
  walnut,
  oakFloor,
  marbleWhite: whiteMarble,
  rug: trellisRug,
}

const PARAMS: Record<Surface, MeshStandardMaterialParameters> = {
  stone: { roughness: 0.92 },
  teak: { roughness: 0.62 },
  pavers: { roughness: 0.82 },
  asphalt: { roughness: 0.95 },
  white: { roughness: 0.88 },
  greige: { roughness: 0.86 },
  porcelain: { roughness: 0.22 },
  splash: { roughness: 0.3 },
  oak: { roughness: 0.6 },
  walnut: { roughness: 0.55 },
  oakFloor: { roughness: 0.38 },
  marbleWhite: { roughness: 0.18 },
  rug: { roughness: 1 },
}

/** The residence's finishes, matched to the reference elevation. */
export function d65Materials(k: Kit, lighting: Lighting) {
  const emissive = (color: string, glow: string, intensity: number, dayFactor: number) =>
    lighting.glow(std({ color, emissive: glow, emissiveIntensity: intensity, roughness: 0.5 }), dayFactor)

  /**
   * A painted finish laid at true scale on a face `w` × `h` metres. Stone carries a relief map
   * derived from its painting, so the split face reads under a low sun.
   */
  const surface = (name: Surface, w: number, h: number) => {
    const repeat: [number, number] = [w / TILE[name], h / TILE[name]]
    const mat = tiledMat(k, `d65_${name}`, PAINTS[name], repeat, PARAMS[name])
    if (name === 'stone') {
      mat.normalMap = k.tex.normalPainted('d65_stone', 512, 512, ledgestone, ...repeat)
      mat.normalScale = new Vector2(0.8, 0.8)
    }
    return mat
  }

  return {
    surface,
    /** Exterior emulsion for the white volumes, legs and bands. */
    white: surface('white', 4, 4),
    /** Warm light-grey wall at the back of the carport and balcony. */
    greige: surface('greige', 4, 4),
    /** Charcoal frame: smooth textured paint over plaster. */
    charcoal: std({ color: '#3d3f42', roughness: 0.72 }),
    /** Black powder-coated aluminium for window frames, rails and fittings. */
    aluminium: std({ color: '#18191b', roughness: 0.38, metalness: 0.55 }),
    groove: std({ color: '#9d978d', roughness: 0.9 }),
    interior: std({ color: '#efe5d6', roughness: 0.92 }),
    // The kitchen's large-format porcelain runs through the ground and first floors.
    interiorFloor: surface('porcelain', 7.2, 11),
    roofing: std({ color: '#b9b3a9', roughness: 0.95 }),
    stepStone: std({ color: '#ebe8e2', roughness: 0.5 }),
    coping: std({ color: '#d9d5ce', roughness: 0.7 }),
    curb: std({ color: '#9e9a92', roughness: 0.9 }),
    lane: std({ color: '#e9e6dc', roughness: 0.8 }),
    soil: std({ color: '#6b5a47', roughness: 1 }),
    darkWood: std({ color: '#3a2618', roughness: 0.6 }),
    // Foliage: leafy painted maps on smooth-shaded clumps, in a few greens.
    foliage: ['#4f6b38', '#5d7a3f', '#43603a'].map((hex, i) =>
      std({ map: k.tex.painted(256, 256, foliage(hexRgb(hex), 40 + i)), roughness: 0.85 }),
    ),
    frond: std({ color: '#5b7a3c', roughness: 0.75, side: DoubleSide }),
    frondDark: std({ color: '#47652f', roughness: 0.75, side: DoubleSide }),
    trunk: std({ color: '#7a6a58', roughness: 1 }),
    pot: std({ color: '#e9e6e1', roughness: 0.55 }),
    potDark: std({ color: '#2a2b2d', roughness: 0.5 }),
    glass: new MeshPhysicalMaterial({
      color: '#d2dee0',
      roughness: 0.03,
      metalness: 0.1,
      transparent: true,
      opacity: 0.22,
      envMapIntensity: 1.4,
      depthWrite: false,
    }),
    railGlass: new MeshPhysicalMaterial({ color: '#dfeeea', roughness: 0.02, transparent: true, opacity: 0.16, depthWrite: false }),
    // Sheer curtains, faintly lit from the room behind.
    sheer: lighting.glow(
      std({ color: '#f4ede2', roughness: 1, transparent: true, opacity: 0.82, side: DoubleSide, emissive: '#ffd9a6', emissiveIntensity: 0.28 }),
      0.3,
    ),
    // Light sources: interior downlights, facade lamps and LED strips, and garden lights.
    downlight: emissive('#fff6e8', '#ffd8a0', 2.2, 0.15),
    room: emissive('#f4e8d4', '#ffcf94', 0.5, 0.2),
    lamp: emissive('#fff1dc', '#ffc27a', 3, 0),
    led: emissive('#fff1dc', '#ffc27a', 2.4, 0),
    garden: emissive('#fff4e2', '#ffd49a', 2.2, 0),
    tail: emissive('#5a0d0d', '#ff2a1a', 0.6, 0),
    head: emissive('#f4f8ff', '#e6f0ff', 1.2, 0),
  }
}

export type D65Materials = ReturnType<typeof d65Materials>
