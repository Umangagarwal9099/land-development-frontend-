import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { settle, wait } from '../lib/async'
import { useStageStore } from '../store/stage'

interface Options {
  /** Fade through black (for scene changes). Off for moves within the same scene. */
  curtain?: boolean
  /** Camera move to finish first, e.g. diving toward a villa before entering it. */
  before?: () => Promise<void> | undefined
}

/**
 * Navigation with choreography: optional camera move → curtain closes → route changes →
 * curtain lifts when the next scene reports ready (see <Curtain />).
 */
export function useShowroomNavigate() {
  const navigate = useNavigate()
  return useCallback(
    async (to: string, { curtain = true, before }: Options = {}) => {
      const move = before?.()
      if (move) await settle(move, 1400)
      if (curtain) {
        const stage = useStageStore.getState()
        stage.setCurtain('closing', true)
        await wait(450)
        stage.setCurtain('closed')
      }
      navigate(to)
    },
    [navigate],
  )
}
