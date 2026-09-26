import { AnimatePresence, motion } from 'framer-motion'
import { Hand } from 'lucide-react'
import { useEffect, useState } from 'react'

let shownThisSession = false

/** Called by the idle reset so the next visitor sees the hint again. */
export function resetGestureHint() {
  shownThisSession = false
}

/**
 * A one-time, self-dismissing cue that the model can be touched: a hand sweeping side to side.
 * Disappears on the first touch or after a few seconds; never shown twice to the same visitor.
 */
export function GestureHint() {
  const [visible, setVisible] = useState(() => !shownThisSession)

  useEffect(() => {
    if (!visible) return
    shownThisSession = true
    const hide = () => setVisible(false)
    const t = window.setTimeout(hide, 6500)
    window.addEventListener('pointerdown', hide, { once: true })
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('pointerdown', hide)
    }
  }, [visible])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none fixed inset-x-0 bottom-32 z-10 flex justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          transition={{ delay: 1.6, duration: 0.8 }}
        >
          <div className="glass flex items-center gap-4 rounded-full py-3 pl-4 pr-7">
            <motion.span
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/15 text-gold"
              animate={{ x: [-6, 6, -6], rotate: [-8, 8, -8] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Hand size={20} strokeWidth={1.5} />
            </motion.span>
            <span className="text-sm tracking-wide text-ivory/80">
              Drag to turn 360° <span className="mx-2 text-gold/60">·</span> Pinch to zoom <span className="mx-2 text-gold/60">·</span> Tap to explore
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
