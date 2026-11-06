import { AnimatePresence, motion } from 'framer-motion'
import { Stethoscope, X } from 'lucide-react'
import { useEffect } from 'react'
import { useInfoStore } from '../../store/info'

/**
 * The card a tapped piece of equipment opens: what it is, where it stands, what it does and its
 * main particulars. Esc or the close button dismisses it; leaving the property clears it.
 */
export function EquipmentCard() {
  const item = useInfoStore((s) => s.item)
  const show = useInfoStore((s) => s.show)

  useEffect(() => {
    if (!item) return
    const key = (e: KeyboardEvent) => e.key === 'Escape' && show(null)
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [item, show])
  useEffect(() => () => show(null), [show])

  return (
    <AnimatePresence>
      {item && (
        <motion.aside
          key={item.title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="glass pointer-events-auto fixed inset-x-4 bottom-28 z-30 max-h-[50vh] overflow-y-auto rounded-3xl p-5 text-ivory sm:inset-x-auto sm:bottom-auto sm:left-24 sm:top-48 sm:w-96"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
              <Stethoscope size={17} />
            </span>
            <div className="min-w-0 flex-1">
              {item.kind && <p className="eyebrow text-gold">{item.kind}</p>}
              <h3 className="font-display text-2xl leading-tight">{item.title}</h3>
              {item.place && <p className="mt-0.5 text-xs uppercase tracking-[0.12em] text-ivory/50">{item.place}</p>}
            </div>
            <button onClick={() => show(null)} aria-label="Close" className="-mr-1 -mt-1 rounded-full p-2 text-ivory/60 hover:bg-ivory/10 hover:text-ivory">
              <X size={16} />
            </button>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ivory/80">{item.body}</p>
          {item.specs && item.specs.length > 0 && (
            <ul className="mt-3 space-y-1.5 border-t border-ivory/10 pt-3 text-sm text-ivory/70">
              {item.specs.map((s) => (
                <li key={s} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold/70" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
