import type { FurnishedDesign } from '../../../../api/types'
import { buildKalakalClubhouse, SITE as KALAKAL_CLUBHOUSE_SITE } from './kalakalClubhouse'
import { buildNyshasHaven, SITE as NYSHAS_HAVEN_SITE } from './nyshasHaven'
import { buildPalmGroveE02, SITE as PALM_GROVE_E02_SITE, type FurnishedModel } from './palmGroveE02'

export type { FurnishedModel }

interface FurnishedDesignEntry {
  build: () => FurnishedModel
  /** Extent of the landscaped grounds, for the plinth and camera bounds. */
  site: { minX: number; maxX: number; minZ: number; maxZ: number }
  /** The design plants its own boundary, so the scene adds no hedge of trees around the plot. */
  landscaped?: boolean
}

/** Every furnished design: how to build it, and the extent of its landscaped grounds. */
export const FURNISHED_DESIGNS: Record<FurnishedDesign, FurnishedDesignEntry> = {
  'palm-grove-e02': { build: buildPalmGroveE02, site: PALM_GROVE_E02_SITE },
  'kalakal-clubhouse': { build: buildKalakalClubhouse, site: KALAKAL_CLUBHOUSE_SITE, landscaped: true },
  'nyshas-haven': { build: buildNyshasHaven, site: NYSHAS_HAVEN_SITE, landscaped: true },
}
