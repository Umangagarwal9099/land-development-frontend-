import { useProgress } from '@react-three/drei'
import { AnimatePresence, motion } from 'framer-motion'
import { LoaderMark } from '../components/ui/LoaderMark'
import { useStageStore } from '../store/stage'

/** Shown over the canvas while a scene's model/geometry is being prepared. */
export function StageLoader() {
  const sceneReady = useStageStore((s) => s.sceneReady)
  const hasScene = useStageStore((s) => s.scene !== null)
  // The landing screen crossfades between projects instead of showing a loader.
  const explore = useStageStore((s) => s.mode === 'explore')
  const { active, progress } = useProgress()
  const visible = hasScene && explore && (!sceneReady || active)
  const pct = active ? progress : sceneReady ? 100 : 12

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center bg-ink/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
        >
          <LoaderMark progress={pct} label="Preparing your private viewing" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
