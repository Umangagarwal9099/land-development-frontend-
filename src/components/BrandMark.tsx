import { AnimatePresence, motion } from 'framer-motion'
import { Delete, Lock } from 'lucide-react'
import { useRef, useState } from 'react'
import { config } from '../config'
import { useStaffStore } from '../store/staff'

const LONG_PRESS_MS = 1200

/**
 * Monogram + brand name. Long-pressing it opens the staff PIN pad that reveals prices —
 * invisible to visitors, one gesture for the sales team. The idle reset hides prices again.
 */
export function BrandMark() {
  const [padOpen, setPadOpen] = useState(false)
  const showPrices = useStaffStore((s) => s.showPrices)
  const lock = useStaffStore((s) => s.lock)
  const timer = useRef(0)
  const initial = config.brandName.trim().charAt(0).toUpperCase()

  const startPress = () => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setPadOpen(true), LONG_PRESS_MS)
  }
  const endPress = () => window.clearTimeout(timer.current)

  return (
    <>
      <div className="pointer-events-auto flex items-center gap-4">
        <button
          onPointerDown={startPress}
          onPointerUp={endPress}
          onPointerLeave={endPress}
          onPointerCancel={endPress}
          aria-label={config.brandName}
          className="flex items-center gap-4"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/50 font-display text-2xl text-gold">{initial}</span>
          <span className="text-left">
            <span className="block text-[0.72rem] font-semibold uppercase tracking-[0.42em] text-ivory/85">{config.brandName}</span>
            <span className="mt-1 block text-[0.62rem] uppercase tracking-[0.42em] text-gold/70">Private Showroom</span>
          </span>
        </button>
        {showPrices && (
          <button onClick={lock} className="flex h-10 items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            <Lock size={14} /> Pricing on
          </button>
        )}
      </div>
      <AnimatePresence>{padOpen && <PinPad onClose={() => setPadOpen(false)} />}</AnimatePresence>
    </>
  )
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫']

function PinPad({ onClose }: { onClose: () => void }) {
  const unlock = useStaffStore((s) => s.unlock)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const press = (key: string) => {
    setError(false)
    if (key === 'C') return setPin('')
    if (key === '⌫') return setPin((p) => p.slice(0, -1))
    const next = (pin + key).slice(0, 8)
    setPin(next)
    if (next.length >= 4 && unlock(next)) onClose()
    else if (next.length === 8) setError(true)
  }

  return (
    <motion.div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="glass w-[22rem] rounded-[2rem] p-8"
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="eyebrow text-center">Sales team</p>
        <p className="mt-2 text-center font-display text-3xl">Enter PIN</p>
        <motion.div className="my-7 flex justify-center gap-3" animate={error ? { x: [0, -10, 10, -6, 6, 0] } : {}}>
          {Array.from({ length: Math.max(4, pin.length) }, (_, i) => (
            <span key={i} className={`h-3 w-3 rounded-full transition ${i < pin.length ? (error ? 'bg-red-400' : 'bg-gold') : 'bg-white/15'}`} />
          ))}
        </motion.div>
        <div className="grid grid-cols-3 gap-3">
          {KEYS.map((k) => (
            <button
              key={k}
              onClick={() => press(k)}
              className="flex h-16 items-center justify-center rounded-2xl bg-white/[0.04] font-display text-3xl text-ivory transition active:scale-95 active:bg-gold/20"
            >
              {k === '⌫' ? <Delete size={22} strokeWidth={1.5} /> : k}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
