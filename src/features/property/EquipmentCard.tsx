import { AnimatePresence, motion } from 'framer-motion'
import { Stethoscope, X } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { useInfoStore, type EquipmentInfo } from '../../store/info'

const ModelInspector = lazy(() => import('./ModelInspector'))

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
          {item.inspect && (
            <Suspense fallback={<div className="mt-3 h-56 rounded-2xl bg-ivory/5" />}>
              <ModelInspector make={item.inspect} />
            </Suspense>
          )}
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
          {(item.choices || item.action) && <Actions item={item} />}
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

/** A card's options (a shoe's sizes) and what can be done with it; says what happened. */
function Actions({ item }: { item: EquipmentInfo }) {
  const [pick, setPick] = useState<string | null>(null)
  const [said, setSaid] = useState<string | null>(null)
  const off = new Set(item.choices?.unavailable ?? [])
  return (
    <div className="mt-3 border-t border-ivory/10 pt-3">
      {item.choices && (
        <>
          <p className="text-xs uppercase tracking-[0.12em] text-ivory/50">{item.choices.label}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.choices.options.map((o) => (
              <button
                key={o}
                disabled={off.has(o)}
                onClick={() => {
                  setPick(o)
                  setSaid(null)
                }}
                className={`min-w-9 rounded-full border px-2.5 py-1 text-sm transition ${pick === o ? 'border-gold bg-gold/20 text-ivory' : 'border-ivory/20 text-ivory/75 hover:border-ivory/50'} disabled:cursor-not-allowed disabled:border-ivory/10 disabled:text-ivory/25 disabled:line-through`}
              >
                {o}
              </button>
            ))}
          </div>
        </>
      )}
      {item.action && (
        <button onClick={() => setSaid(item.action!.run(pick))} className="mt-3 w-full rounded-full bg-gold/90 px-4 py-2 text-sm font-medium text-black transition hover:bg-gold">
          {item.action.label}
        </button>
      )}
      {said && <p className="mt-2 text-sm text-ivory/80" aria-live="polite">{said}</p>}
    </div>
  )
}
