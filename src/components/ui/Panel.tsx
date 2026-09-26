import clsx from 'clsx'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { Play, Rotate3d, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import type { AvailabilityStatus, MediaItem } from '../../api/types'
import { assetUrl } from '../../config'
import { formatPrice, statusLabel } from '../../lib/format'
import { isSidePanelLayout, PANEL_MARGIN_REM, PANEL_WIDTH_REM, SHEET_HEIGHT_VH } from '../../lib/layout'
import { statusColor } from '../../lib/palette'
import { useMediaStore } from '../../store/media'

function useSideLayout() {
  const [side, setSide] = useState(isSidePanelLayout)
  useEffect(() => {
    const onResize = () => setSide(isSidePanelLayout())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return side
}

const EASE = [0.22, 1, 0.36, 1] as const

const stagger: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } },
}
export const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
}

/**
 * Floating detail panel: a frosted card on the right on landscape screens, a bottom sheet on
 * portrait ones. `contentKey` swaps the content with a crossfade (plot → plot) while the card stays.
 */
export function DetailPanel({ open, contentKey, onClose, children }: { open: boolean; contentKey: string; onClose: () => void; children: ReactNode }) {
  const side = useSideLayout()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="panel"
          className="glass pointer-events-auto fixed z-20 flex flex-col overflow-hidden"
          style={
            side
              ? { top: `${PANEL_MARGIN_REM}rem`, bottom: `${PANEL_MARGIN_REM}rem`, right: `${PANEL_MARGIN_REM}rem`, width: `min(${PANEL_WIDTH_REM}rem, 42vw)`, borderRadius: '2rem' }
              : { left: 0, right: 0, bottom: 0, height: `${SHEET_HEIGHT_VH}vh`, borderRadius: '2rem 2rem 0 0' }
          }
          initial={side ? { x: '110%', opacity: 0.4 } : { y: '100%' }}
          animate={side ? { x: 0, opacity: 1 } : { y: 0 }}
          exit={side ? { x: '110%', opacity: 0 } : { y: '100%' }}
          transition={{ type: 'spring', stiffness: 170, damping: 26, mass: 0.9 }}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-ivory/70 transition hover:bg-white/10 hover:text-ivory active:scale-92"
          >
            <X size={22} strokeWidth={1.5} />
          </button>
          <AnimatePresence mode="wait">
            <motion.div
              key={contentKey}
              className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-8 pb-10 pt-9"
              variants={stagger}
              initial="hidden"
              animate="shown"
              exit={{ opacity: 0, transition: { duration: 0.18 } }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

/** Panel heading: small gold eyebrow, large serif title. */
export function PanelTitle({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <motion.header variants={rise} className="pr-14">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 font-display text-[3.2rem] font-medium leading-[0.95] text-ivory">{title}</h2>
      {children && <div className="mt-4">{children}</div>}
    </motion.header>
  )
}

export function PanelSection({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <motion.section variants={rise} className={clsx('mt-8', className)}>
      {title && (
        <div className="mb-4 flex items-center gap-4">
          <h3 className="eyebrow text-ivory/45">{title}</h3>
          <span className="h-px flex-1 bg-line" />
        </div>
      )}
      {children}
    </motion.section>
  )
}

/** Key figures as a hairline-divided grid — no boxes, lots of air. */
export function Facts({ items }: { items: [label: string, value: string][] }) {
  return (
    <dl className="grid grid-cols-2 border-t border-line">
      {items.map(([label, value], i) => (
        <div key={label} className={clsx('border-b border-line py-4', i % 2 === 0 ? 'pr-4' : 'border-l pl-5')}>
          <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-ivory/45">{label}</dt>
          <dd className="mt-1.5 font-display text-2xl text-ivory">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function StatusBadge({ status }: { status: AvailabilityStatus }) {
  return (
    <span className="inline-flex items-center gap-2.5 rounded-full border border-line bg-white/[0.03] px-4 py-2 text-sm font-semibold tracking-wide">
      <span className="relative flex h-2.5 w-2.5">
        {status === 'available' && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: statusColor[status] }} />
        )}
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: statusColor[status] }} />
      </span>
      {statusLabel[status]}
    </span>
  )
}

export function PriceTag({ label, amount, note }: { label: string; amount: number; note?: string }) {
  return (
    <motion.div variants={rise} className="mt-8 rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/12 to-transparent px-6 py-5">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-display text-5xl font-medium text-gold-gradient">{formatPrice(amount)}</p>
      {note && <p className="mt-1 text-sm text-ivory/50">{note}</p>}
    </motion.div>
  )
}

export function Paragraph({ children }: { children: ReactNode }) {
  return (
    <motion.p variants={rise} className="mt-6 text-[1.05rem] leading-relaxed text-ivory/70">
      {children}
    </motion.p>
  )
}

const mediaBadge: Partial<Record<MediaItem['kind'], { icon: typeof Play; label: string }>> = {
  video: { icon: Play, label: 'Film' },
  pano: { icon: Rotate3d, label: '360°' },
}

/** Horizontal strip of large thumbnails; opens the full-screen viewer. */
export function MediaStrip({ items }: { items: MediaItem[] }) {
  const open = useMediaStore((s) => s.open)
  if (items.length === 0) return null
  return (
    <div className="scrollbar-none -mx-8 flex snap-x gap-3 overflow-x-auto px-8">
      {items.map((m, i) => {
        const badge = mediaBadge[m.kind]
        return (
          <button
            key={m.id}
            onClick={() => open(items, i)}
            className="group relative aspect-[4/3] w-52 shrink-0 snap-start overflow-hidden rounded-2xl border border-line bg-ink-2"
          >
            <img
              src={assetUrl(m.thumbUrl ?? m.url)}
              alt={m.title ?? ''}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-lux)] group-hover:scale-105 group-active:scale-95"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
            {badge && (
              <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-ink/70 px-3 py-1 text-xs font-semibold backdrop-blur">
                <badge.icon size={12} /> {badge.label}
              </span>
            )}
            {m.title && <span className="absolute inset-x-3 bottom-2.5 truncate text-left text-sm text-ivory/85">{m.title}</span>}
          </button>
        )
      })}
    </div>
  )
}
