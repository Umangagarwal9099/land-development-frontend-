import type { FurnishedDesign } from '../../../../api/types'
import { buildKalakalD65, SITE as KALAKAL_D65_SITE } from './kalakalD65'
import { buildNyshasHaven, SITE as NYSHAS_HAVEN_SITE } from './nyshasHaven'
import { mergeStatic, prepareRaycast } from './optimize'
import type { FurnishedModel } from './shared'

export type { FurnishedModel }

interface FurnishedDesignEntry {
  build: () => FurnishedModel
  /** Extent of the landscaped grounds, for the plinth and camera bounds. */
  site: { minX: number; maxX: number; minZ: number; maxZ: number }
  /** The design plants its own boundary, so the scene adds no hedge of trees around the plot. */
  landscaped?: boolean
  /** Builds the home for its plot on the master plan, without the surroundings the plan already draws. */
  buildOnPlot?: () => FurnishedModel
  /**
   * Built once, its static parts merged into one mesh per material and its raycast trees prepared,
   * then kept: re-entering the property is instant. For designs with thousands of small parts.
   */
  optimized?: boolean
}

/** Every furnished design: how to build it, and the extent of its landscaped grounds. */
export const FURNISHED_DESIGNS: Record<FurnishedDesign, FurnishedDesignEntry> = {
  'nyshas-haven': { build: buildNyshasHaven, site: NYSHAS_HAVEN_SITE, landscaped: true },
  'kalakal-d65': { build: () => buildKalakalD65(), buildOnPlot: () => buildKalakalD65(false), site: KALAKAL_D65_SITE, landscaped: true, optimized: true },
}

const built = new Map<string, FurnishedModel>()

/** Whether a design's model is kept between visits (see `optimized`). */
export const isCached = (design: FurnishedDesign) => !!FURNISHED_DESIGNS[design].optimized

/**
 * The model for a design: on its own site, or (`onPlot`) for its plot on the master plan.
 * Optimised designs are built once and reused; others are built fresh for each visit.
 */
export function furnishedModel(design: FurnishedDesign, onPlot = false): FurnishedModel {
  const entry = FURNISHED_DESIGNS[design]
  const build = onPlot ? entry.buildOnPlot! : entry.build
  if (!entry.optimized) return build()
  const key = `${design}${onPlot ? ':plot' : ''}`
  let model = built.get(key)
  if (!model) {
    model = build()
    mergeStatic(model.root)
    prepareRaycast(model.root)
    built.set(key, model)
  }
  return model
}

/** Builds an optimised design's model in idle time, so entering the property doesn't stall. */
export function prewarmFurnished(design: FurnishedDesign, onPlot = false) {
  if (!FURNISHED_DESIGNS[design].optimized || built.has(`${design}${onPlot ? ':plot' : ''}`)) return
  const run = () => furnishedModel(design, onPlot)
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 4000 })
  else setTimeout(run, 1200)
}
