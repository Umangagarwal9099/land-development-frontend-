import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import { lazy, Suspense, useEffect } from 'react'
import { useLocation, useNavigate, useOutlet } from 'react-router'
import { config } from '../config'
import { MediaViewer } from '../features/media/MediaViewer'
import { useMediaStore } from '../store/media'
import { useStaffStore } from '../store/staff'
import { useStageStore } from '../store/stage'
import { resetGestureHint } from './GestureHint'
import { Curtain } from './ui/Feedback'

// three.js and every scene live in this chunk; the DOM shell paints before it arrives.
const Stage = lazy(() => import('../stage/Stage'))

/** Seconds without a touch before the chrome fades and the model turns on its own. */
const AMBIENT_AFTER_SECONDS = 45

/**
 * Root layout. The 3D stage is mounted once, underneath every screen; screens are transparent
 * overlays that crossfade on top of it and tell the stage what to show.
 */
export function AppShell() {
  const location = useLocation()
  const outlet = useOutlet()
  const ambient = useStageStore((s) => s.ambient)
  useIdleBehaviour()

  return (
    <MotionConfig reducedMotion="user">
      <Suspense fallback={null}>
        <Stage />
      </Suspense>

      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          className="pointer-events-none fixed inset-0 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
        >
          {/* Ambient mode: the interface steps back and lets the model carry the screen. */}
          <motion.div className="pointer-events-none" animate={{ opacity: ambient ? 0 : 1 }} transition={{ duration: 1.2 }}>
            {outlet}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <MediaViewer />
      <Curtain />
    </MotionConfig>
  )
}

function useIdleBehaviour() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    let ambientTimer = 0
    let resetTimer = 0
    const stage = useStageStore.getState

    const restart = () => {
      window.clearTimeout(ambientTimer)
      window.clearTimeout(resetTimer)
      if (stage().ambient) {
        stage().setAmbient(false)
        if (stage().mode === 'explore') stage().setAutoRotate(false)
      }
      if (pathname !== '/') {
        ambientTimer = window.setTimeout(() => {
          if (useMediaStore.getState().index !== null) return
          stage().setAmbient(true)
          stage().setAutoRotate(true)
        }, AMBIENT_AFTER_SECONDS * 1000)
      }
      if (config.idleResetSeconds > 0) {
        // Kiosk hygiene: back to the start, prices hidden, for the next visitor.
        resetTimer = window.setTimeout(() => {
          useStaffStore.getState().lock()
          useMediaStore.getState().close()
          resetGestureHint()
          if (pathname !== '/') navigate('/')
        }, config.idleResetSeconds * 1000)
      }
    }

    const events = ['pointerdown', 'wheel', 'keydown'] as const
    events.forEach((e) => window.addEventListener(e, restart, { passive: true }))
    // Mouse movement counts too, but only as "still here" — it shouldn't be needed on touch screens.
    window.addEventListener('pointermove', restart, { passive: true })
    restart()
    return () => {
      window.clearTimeout(ambientTimer)
      window.clearTimeout(resetTimer)
      events.forEach((e) => window.removeEventListener(e, restart))
      window.removeEventListener('pointermove', restart)
    }
  }, [navigate, pathname])
}
