import { AnimatePresence, motion } from 'framer-motion'
import { Home, RotateCcw, TriangleAlert } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useStageStore } from '../../store/stage'
import { Button } from './Button'
import { LoaderMark } from './LoaderMark'

/** Full-screen state for failures: calm, branded, with a clear way forward. */
export function ErrorState({ title, detail, onRetry, showHome = true }: { title: string; detail?: string; onRetry?: () => void; showHome?: boolean }) {
  const navigate = useNavigate()
  return (
    <motion.div
      className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-ink/80 px-6 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-xl text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-gold/30 text-gold">
          <TriangleAlert size={30} strokeWidth={1.3} />
        </div>
        <p className="eyebrow">Something went wrong</p>
        <h1 className="mt-4 font-display text-5xl font-medium">{title}</h1>
        {detail && <p className="mt-4 text-lg text-ivory/55">{detail}</p>}
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          {onRetry && (
            <Button icon={RotateCcw} iconPosition="start" onClick={onRetry}>
              Try again
            </Button>
          )}
          {showHome && (
            <Button variant="ghost" icon={Home} iconPosition="start" onClick={() => navigate('/')}>
              All projects
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/** Data is on its way; the stage behind keeps whatever it was showing. */
export function ScreenLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <motion.div
      className="fixed inset-0 z-30 flex items-center justify-center bg-ink/60 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: 0.15 }}
    >
      <LoaderMark label={label} />
    </motion.div>
  )
}

const CURTAIN_FAILSAFE_MS = 4000

/**
 * Black curtain for scene changes (master plan ↔ villa). It closes before navigation and lifts
 * once the next scene reports ready, so the viewer never sees a half-built model or a camera jump.
 */
export function Curtain() {
  const curtain = useStageStore((s) => s.curtain)
  const awaitingScene = useStageStore((s) => s.awaitingScene)
  const sceneReady = useStageStore((s) => s.sceneReady)
  const setCurtain = useStageStore((s) => s.setCurtain)

  useEffect(() => {
    if (curtain === 'closed' && !awaitingScene && sceneReady) {
      // A beat for the first frame of the new scene to render before revealing it.
      const t = window.setTimeout(() => setCurtain('open'), 250)
      return () => window.clearTimeout(t)
    }
  }, [curtain, awaitingScene, sceneReady, setCurtain])

  // Never leave the screen black if a scene fails to report in.
  useEffect(() => {
    if (curtain === 'open') return
    const t = window.setTimeout(() => setCurtain('open', false), CURTAIN_FAILSAFE_MS)
    return () => window.clearTimeout(t)
  }, [curtain, setCurtain])

  return (
    <AnimatePresence>
      {curtain !== 'open' && (
        <motion.div
          className="fixed inset-0 z-40 bg-ink"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        />
      )}
    </AnimatePresence>
  )
}
