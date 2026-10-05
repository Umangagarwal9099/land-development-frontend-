import { DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial, type MeshStandardMaterialParameters } from 'three'
import type { Kit } from '../kit'
import { tiledMat, type Lighting } from '../shared'
import type { Photos } from './photos'
import { boulders, breezeBlock, crazyPaving, pebbleBed, cream, gabion, riverStone, shingles, stackedStone, stoneTile, sukabumi, teakBoards } from './paints'

/*
 * Nysha's Haven site plan, in metres, laid out from the aerial photograph of the finished
 * farmhouse (no surveyed plan yet): a ~1 acre plot (70 × 62 m) running east from the house toward
 * Osman Sagar Lake. North is −z.
 *
 *   west (x < 3, raised)   the residence, and the two-storey arcade beside it to the south;
 *                          the arched gate at the north-west corner
 *   x 3 … 17.2             the pool terrace in front of the house, the long thatched building
 *                          beside it; the multi-sport court runs east from here along the south
 *   x 17.2 … 46 (lower)    the lawn, the round bamboo bar, the 125 ft boulder deck between lawn
 *                          and court behind a wavy stone wall, the service corner at the far end
 *   along the north        the wide curving paved walk under flame trees and palms
 *   along the south        the court, with cricket practice nets behind its mural wall
 *   x > 46                 the white east wall with its bronze lattice grille, the road outside,
 *                          then the shore and the lake
 */

/** The model stands on a podium so the lake and the pool basins sit above the showroom plinth. */
export const LIFT = 1.2
export const BASE = -LIFT

// Terrace levels, stepping down to the lake.
export const UPPER = 3.0
/** The pool deck sits just below the house; its far edge drops in a dark stone wall toward the lake. */
export const POOL_T = 2.85
export const LAWN = 0.9
export const DECK_G = 0.5
export const SHORE = 0.3
export const LAKE_BED = -1.0
export const LAKE_WATER = -0.2

// Residence levels.
// Residence levels and proportions, read from the photographs of the pool facade.
export const GF = UPPER + 0.45
/** Ground-floor walls run up to the deep cream floor band; the first floor sits on top of it. */
export const BAND = GF + 3.6
export const FF = BAND + 0.8
/** The first-floor roof is a low shingle hip whose flat top is the entertainment terrace. */
export const EAVE = FF + 3.6
export const TERRACE = EAVE + 1.6
/** The pool front is 24 m across: four teak columns in three 7 m bays. */
export const HOUSE = { x0: -18, x1: 0, z0: -12, z1: 12 }
export const BAYS = [-10.5, -3.5, 3.5, 10.5]

export const PLOT = { x0: -24, x1: 46, z0: -31, z1: 37 }

/** South of this line the court, deck and arcade side of the site begins. */
export const SOUTH_SIDE = 14.6
export const ARCADE: Rect = [-16, 0, 13.2, 27]
export const COURT: Rect = [3, 39, 15.2, 26.6]
/** Behind the court's mural wall: a paved strip with cricket practice nets, inside the same tall fence. */
export const PRACTICE: Rect = [3, 39, 27.0, 36.6]
/** The dining strip between lawn and court, raised to the pool terrace level behind an ivy-clad wall. */
export const BOULDER_DECK: Rect = [17.2, 39.4, 11.6, 15.0]
/** The pebble garden below the pool wall sits half a metre above the lawn. */
export const PEBBLE_T = LAWN + 0.5
export const THATCH_HALL: Rect = [3.4, 15.6, 10.9, 14.3]
export const SERVICE: Rect = [39.6, 46, 15.2, 36.6]
/** Outside the east wall: the paved road along the plot's frontage. */
export const ROAD: Rect = [46, 54, -40, 44]
export const BAMBOO_BAR = { x: 22.0, z: -5.4, r: 2.9 }

export type Rect = [x0: number, x1: number, z0: number, z1: number]

/** Where the pool terrace ends in its infinity wall and the lawn begins. */
export const WALL_X = 17.2

/**
 * Pool-terrace features cut into the ground, placed as in the photographs: the 34′ × 24′ pool
 * runs along the house front, the children's pool steps forward on its south side with the
 * brick-edged sunken square behind it, and the pool spills over the infinity wall into a
 * channel at the foot of the wall.
 */
/** The main pool, a plain rectangle; a raised round spa sits on its north-east corner, as photographed. */
export const POOL: Rect = [9.6, 16.9, -8.6, 3.4]
export const SPA = { x: 16.3, z: -8.0, r: 1.9 }
export const KIDS_POOL: Rect = [12.6, 16.9, 3.7, 8.9]
export const SUNKEN: Rect = [8.4, 12.0, 4.3, 7.9]
export const WEIR: Rect = [16.9, WALL_X, -7, 8.9]
export const WATER_LEVEL = POOL_T - 0.06

const std = (p: MeshStandardMaterialParameters) => new MeshStandardMaterial({ roughness: 0.85, ...p })

export function havenMaterials(k: Kit, lighting: Lighting, photos: Photos) {
  const glow = (color: string, emissive: string, intensity: number, dayFactor: number) =>
    lighting.glow(std({ color, emissive, emissiveIntensity: intensity, roughness: 0.5 }), dayFactor)
  // Surfaces from the photographs, sized to the patch each was cut from (metres across × up).
  const photo = (name: string, [pw, ph]: [number, number], w: number, h: number, p: MeshStandardMaterialParameters = {}) =>
    std({ map: photos.get(name, [w / pw, h / ph]), ...p })
  /** Curtained glazing from the photographs, glowing warm at dusk. */
  const glass = (name: string, patch: [number, number], w: number, h: number) => {
    const mat = photo(name, patch, w, h, { roughness: 0.25, metalness: 0.1 })
    mat.emissiveMap = mat.map
    mat.emissive.set('#ffd8a8')
    mat.emissiveIntensity = 0.55
    // By day the sheer curtains read bright white, as photographed; at dusk they glow warm.
    return lighting.glow(mat, 0.75)
  }
  return {
    cream: (w: number, h: number) => tiledMat(k, 'cream', cream, [w / 2.5, h / 2.5], { roughness: 0.95 }),
    brick: (w: number, h: number) => {
      // The patch was cut from the shaded verandah; lift it to the brick's sunlit terracotta by day.
      const mat = photo('brick', [1.44, 1.58], w, h, { roughness: 0.9 })
      mat.emissiveMap = mat.map
      mat.emissive.set('#ffffff')
      mat.emissiveIntensity = 0.05
      return lighting.glow(mat, 4)
    },
    thatch: (w: number, d: number) => photo('thatch', [1.5, 2.0], w, d, { roughness: 1, side: DoubleSide, color: '#bba27a' }),
    infinityWall: (w: number, h: number) => photo('infinity-wall', [8.5, 2.0], w, h, { roughness: 0.85 }),
    pebbles: (w: number, d: number) => photo('pebbles', [3.0, 1.4], w, d, { roughness: 0.95 }),
    column: photo('column', [1, 1], 1, 1, { roughness: 0.7 }),
    door: photo('door', [1, 1], 1, 1, { roughness: 0.7 }),
    glazingGF: (w: number, h: number) => glass('glazing-gf', [1.85, h], w, h),
    glazingFF: (w: number, h: number) => glass('glazing-ff', [1.6, h], w, h),
    /** Pale stone of the column bases, balustrade and floor band, sampled from the photographs. */
    sandstone: std({ color: '#dcbfa0', roughness: 0.85 }),
    paleStone: std({ color: '#c9cac5', roughness: 0.8 }),
    baseStone: std({ color: '#a9a69c', roughness: 0.9 }),
    river: (w: number, h: number) => tiledMat(k, 'river', riverStone, [w, h], { roughness: 0.9 }),
    sukabumi: (w: number, h: number) => tiledMat(k, 'sukabumi', sukabumi, [w, h], { roughness: 0.45 }),
    boulders: (w: number, d: number) => tiledMat(k, 'boulders', boulders, [w / 2, d / 2], { roughness: 0.95 }),
    teak: (w: number, h: number) => tiledMat(k, 'teak', teakBoards, [w / 1.2, h / 2.4], { roughness: 0.7 }),
    gabion: tiledMat(k, 'gabion', gabion, [1, 2], { roughness: 0.9 }),
    shingles: (w: number, d: number) => tiledMat(k, 'shingles', shingles, [w / 2, d / 2], { roughness: 0.95, color: '#a2a2a8' }),
    /** Light grey split-stone tiles on the pool's front wall, as photographed. */
    poolWall: (w: number, h: number) => tiledMat(k, 'stoneTile', stoneTile, [w / 2.4, h / 1.2], { roughness: 0.85 }),
    /** The beige crackle-finish paving of the dining strip. */
    crazy: (w: number, d: number) => tiledMat(k, 'crazyPaving', crazyPaving, [w / 4, d / 4], { roughness: 0.95 }),
    /** Grey granite treads of the curved steps, and their darker risers. */
    granite: std({ color: '#9d9c95', roughness: 0.7 }),
    graniteRiser: std({ color: '#74736c', roughness: 0.8 }),
    /** Grey-beige river pebbles in the garden below the pool. */
    riverPebbles: (w: number, d: number) => tiledMat(k, 'pebbleBed', pebbleBed, [w / 2, d / 2], { roughness: 0.9 }),
    stacked: (w: number, h: number) => tiledMat(k, 'stacked', stackedStone, [w / 1.2, h / 0.6], { roughness: 0.9 }),
    breeze: (w: number, h: number) => tiledMat(k, 'breeze', breezeBlock, [w / 1.2, h / 1.2], { roughness: 0.9 }),
    deckStone: (w: number, d: number) => std({ map: k.tex.finish('kota', w / 0.9, d / 0.9), color: '#c6c5c0', roughness: 0.8 }),
    /** Medium-grey flagstones of the north walk, with dark joints. */
    flagstone: (w: number, d: number) => std({ map: k.tex.finish('travertineTile', w / 1.2, d / 0.8), color: '#a9acad', roughness: 0.85 }),
    grass: (w: number, d: number) => std({ map: k.tex.finish('grass', w / 3, d / 3), color: '#92b86e', roughness: 1 }),
    paving: (w: number, d: number) => k.finish('travertineTile', w / 1.2, d / 0.6, 0.6),
    setts: (w: number, d: number) => k.finish('kota', w / 0.9, d / 0.9, 0.8),
    gravel: (w: number, d: number) => std({ map: k.tex.finish('gravel', w / 2, d / 2), color: '#f0dccb', roughness: 1 }),
    earth: std({ color: '#3d342a', roughness: 1 }),
    lakeBed: std({ color: '#2a2c26', roughness: 1 }),
    sand: std({ color: '#cdbb94', roughness: 1 }),
    concrete: std({ color: '#bdb6aa', roughness: 0.9 }),
    steel: std({ color: '#2b2b2d', metalness: 0.6, roughness: 0.4 }),
    bamboo: std({ color: '#b89d5e', roughness: 0.55 }),
    canvas: std({ color: '#f4f2ec', roughness: 0.8, side: DoubleSide }),
    mesh: std({ color: '#2d3033', transparent: true, opacity: 0.35, depthWrite: false, side: DoubleSide }),
    net: std({ color: '#f0f0ea', transparent: true, opacity: 0.6, depthWrite: false, side: DoubleSide }),
    brass: std({ color: '#b08d57', metalness: 0.9, roughness: 0.3 }),
    water: lighting.glow(
      new MeshPhysicalMaterial({ color: '#3a6657', transparent: true, opacity: 0.93, roughness: 0.04, clearcoat: 1, emissive: '#05201a', emissiveIntensity: 0.4, depthWrite: false }),
      0.3,
    ),
    lake: new MeshPhysicalMaterial({ color: '#3d6f73', transparent: true, opacity: 0.88, roughness: 0.12, clearcoat: 1, depthWrite: false }),
    // Lit glazing: warm interiors at dusk, dark reflective glass by day.
    window: glow('#2a2c2c', '#ffcf94', 0.9, 0.03),
    lamp: glow('#fff4e2', '#ffd49a', 2.2, 0),
    poolLight: glow('#e8fbff', '#7fe6ff', 2.6, 0.05),
    fire: glow('#ff9a4d', '#ff7a2e', 3, 0.4),
  }
}

export type HavenMaterials = ReturnType<typeof havenMaterials>

export interface Ctx {
  k: Kit
  h: HavenMaterials
  lighting: Lighting
}
