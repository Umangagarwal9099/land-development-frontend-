import { COMMON } from './common'
import { FIRST } from './first'
import { GROUND } from './ground'
import { SECOND } from './second'
import { THIRD } from './third'
import type { Fitter } from './types'
import { MAIN_FITTERS } from '../../main/rooms'

export type { Fitter } from './types'

/** Every room's fitter, by the `fit` key its plan gives it. */
export const FITTERS: Record<string, Fitter> = { ...COMMON, ...GROUND, ...FIRST, ...SECOND, ...THIRD, ...MAIN_FITTERS }
