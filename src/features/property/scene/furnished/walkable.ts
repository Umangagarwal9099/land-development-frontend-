import type { FurnishedDesign } from '../../../../api/types'

/**
 * The designs that can be explored on foot. Kept apart from the design registry (./index), which
 * imports every design's builder: the property screen needs only this flag, and importing the
 * registry from it put all the model code in the page's first download.
 */
export const WALKABLE: ReadonlySet<FurnishedDesign> = new Set(['kalakal-d65', 'kalakal-mall', 'kalakal-hotel', 'kalakal-a01', 'kalakal-hospital'])
