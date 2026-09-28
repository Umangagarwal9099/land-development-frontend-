import type { FurnishedDesign } from '../../../../api/types'
import { buildPalmGroveE02, SITE as PALM_GROVE_E02_SITE, type FurnishedModel } from './palmGroveE02'

export type { FurnishedModel }

/** Every furnished design: how to build it, and the extent of its landscaped grounds. */
export const FURNISHED_DESIGNS: Record<FurnishedDesign, { build: () => FurnishedModel; site: { minX: number; maxX: number; minZ: number; maxZ: number } }> = {
  'palm-grove-e02': { build: buildPalmGroveE02, site: PALM_GROVE_E02_SITE },
}
