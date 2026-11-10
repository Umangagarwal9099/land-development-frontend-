import type { Fitter } from '../../opd/rooms/types'
import { MAIN_CORE } from './core'
import { MAIN_FIRST } from './first'
import { MAIN_GROUND } from './ground'
import { MAIN_SECOND } from './second'
import { MAIN_THIRD } from './third'

/** The main block's fitters, by the `fit` key its plan gives each room (see ../../opd/plan.ts). */
export const MAIN_FITTERS: Record<string, Fitter> = { ...MAIN_CORE, ...MAIN_GROUND, ...MAIN_FIRST, ...MAIN_SECOND, ...MAIN_THIRD }
