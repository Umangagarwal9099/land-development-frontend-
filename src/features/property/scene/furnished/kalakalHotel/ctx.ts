import { DoubleSide, Group, Mesh, MeshStandardMaterial, PlaneGeometry, type Material } from 'three'
import type { Openings } from '../basement'
import type { Kit } from '../kit'
import type { Lighting } from '../shared'
import type { Contact } from '../kalakalMall/contact'
import type { Planting } from '../kalakalMall/foliage'
import type { TerranovaMaterials } from './finishes'

export interface HotelCtx {
  k: Kit
  c: TerranovaMaterials
  lighting: Lighting
  /** Planting gathered across the site, built as a few meshes at the end. */
  plant: Planting
  /** Contact shadows and occlusion, likewise. */
  shade: Contact
  /** On the master plan: trim the forecourt to the layout's skewed road edge. */
  onPlan: boolean
  /** In the property view: the openings the basements' ramp, lifts and stair come up through. */
  openings?: Openings
}

export const NAME = 'TERRANOVA HOTEL'

/* ---------- channel letters ---------- */

const FONT = (px: number, weight = 700) => `${weight} ${px}px Helvetica, Arial, sans-serif`
/** Cap height of the face as a fraction of the font size. */
const CAP = 0.72
let measure: CanvasRenderingContext2D | null = null
const advanceOf = (ch: string, weight: number) => {
  measure ??= document.createElement('canvas').getContext('2d')!
  measure.font = FONT(100, weight)
  return measure.measureText(ch).width / 100
}

/** What signs need of a design's context (Terranova Square and the hospital use them too). */
export type SignCtx = { k: Kit; lighting: Lighting }

const glyphCache = new WeakMap<Kit, Map<string, { face: Material; side: Material }>>()

/** A letter's colours: its face, the glow it gives off when lit, its returns, and its weight. */
export interface LetterTone {
  face: string
  emissive: string
  intensity: number
  side: string
  weight?: number
}
export const OPAL: LetterTone = { face: '#ffffff', emissive: '#fff6e8', intensity: 1.3, side: '#c9ccd0' }

/**
 * One channel letter, cap height `cap`, `depth` deep: a face (lit from within, or not) over
 * returns, built as a stack of cut-outs. Baseline at y = 0, centred on x = 0, facing +z.
 */
export function channelLetter(ctx: SignCtx, ch: string, cap: number, depth: number, tone: LetterTone = OPAL) {
  const { k, lighting } = ctx
  const weight = tone.weight ?? 700
  let cache = glyphCache.get(k)
  if (!cache) glyphCache.set(k, (cache = new Map()))
  const key = `${ch}|${tone.face}|${tone.emissive}|${weight}`
  let mats = cache.get(key)
  if (!mats) {
    const map = k.tex.painted(256, 256, (g, w, h) => {
      g.fillStyle = '#000'
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#fff'
      g.font = FONT(h * 0.7, weight)
      g.textAlign = 'center'
      g.textBaseline = 'alphabetic'
      g.fillText(ch, w / 2, h / 2 + (h * 0.7 * CAP) / 2)
    })
    const face = new MeshStandardMaterial({ color: tone.face, emissive: tone.emissive, emissiveIntensity: tone.intensity, roughness: 0.3, alphaMap: map, alphaTest: 0.5 })
    mats = {
      face: lighting.glow(face, 0.1),
      side: new MeshStandardMaterial({ color: tone.side, metalness: 0.7, roughness: 0.35, alphaMap: map, alphaTest: 0.5, side: DoubleSide }),
    }
    cache.set(key, mats)
  }
  const size = cap / (0.7 * CAP)
  const g = new Group()
  const plane = new PlaneGeometry(size, size)
  const layers = Math.max(2, Math.round(depth / 0.012))
  for (let i = 0; i <= layers; i++) {
    const m = new Mesh(plane, i === 0 ? mats.face : mats.side)
    m.position.set(0, cap / 2, -(i * depth) / layers)
    m.castShadow = i === layers
    g.add(m)
  }
  return { group: g, advance: advanceOf(ch, weight) * size * 0.7 + cap * 0.1 }
}

/** A line of letters centred on x = 0, facing +z, baseline at y = 0; its length in `userData.width`. */
export function signLine(ctx: SignCtx, text: string, cap: number, depth: number, tone?: LetterTone) {
  const g = new Group()
  const letters = [...text].map((ch) => (ch === ' ' ? { group: null, advance: cap * 0.45 } : channelLetter(ctx, ch, cap, depth, tone)))
  const total = letters.reduce((s, l) => s + l.advance, 0)
  g.userData.width = total
  let x = -total / 2
  for (const l of letters) {
    if (l.group) {
      l.group.position.x = x + l.advance / 2
      g.add(l.group)
    }
    x += l.advance
  }
  return g
}

/** Letters laid out along a run of text: each letter and the distance of its centre from the start. */
export function lettersAlong(ctx: SignCtx, text: string, cap: number, depth: number, tone?: LetterTone) {
  const letters = [...text].map((ch) => (ch === ' ' ? { group: null as Group | null, advance: cap * 0.45 } : channelLetter(ctx, ch, cap, depth, tone)))
  const total = letters.reduce((s, l) => s + l.advance, 0)
  let s = 0
  const out: { group: Group; at: number }[] = []
  for (const l of letters) {
    if (l.group) out.push({ group: l.group, at: s + l.advance / 2 })
    s += l.advance
  }
  return { letters: out, total }
}
