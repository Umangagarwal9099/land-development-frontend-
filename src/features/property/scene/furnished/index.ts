import type { FurnishedDesign } from '../../../../api/types'
import { buildKalakalD65, SITE as KALAKAL_D65_SITE } from './kalakalD65'
import { buildNyshasHaven, SITE as NYSHAS_HAVEN_SITE } from './nyshasHaven'
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
}

/** Every furnished design: how to build it, and the extent of its landscaped grounds. */
export const FURNISHED_DESIGNS: Record<FurnishedDesign, FurnishedDesignEntry> = {
  'nyshas-haven': { build: buildNyshasHaven, site: NYSHAS_HAVEN_SITE, landscaped: true },
  'kalakal-d65': { build: () => buildKalakalD65(), buildOnPlot: () => buildKalakalD65(false), site: KALAKAL_D65_SITE, landscaped: true },
}
