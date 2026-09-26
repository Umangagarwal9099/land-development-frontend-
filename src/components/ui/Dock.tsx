import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { isSidePanelLayout, PANEL_MARGIN_REM, PANEL_WIDTH_REM } from '../../lib/layout'

export interface DockItem {
  id: string
  icon: LucideIcon
  label: string
  active?: boolean
  /** Content revealed above the dock when this item is tapped (a row of chips). */
  tray?: ReactNode
  onSelect?: () => void
  hidden?: boolean
}

/**
 * The one navigation surface on 3D screens: a slim bar of icon+label buttons at the bottom
 * centre. Items with a tray open a contextual row above it instead of a new screen.
 * When the detail panel is open the dock re-centres in the space left of it.
 */
export function Dock({ items, panelOpen }: { items: DockItem[]; panelOpen: boolean }) {
  const [openTray, setOpenTray] = useState<string | null>(null)
  const [side, setSide] = useState(isSidePanelLayout)
  useEffect(() => {
    const onResize = () => setSide(isSidePanelLayout())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  // A selection opening the detail panel means the tray has done its job.
  const [prevPanelOpen, setPrevPanelOpen] = useState(panelOpen)
  if (panelOpen !== prevPanelOpen) {
    setPrevPanelOpen(panelOpen)
    if (panelOpen) setOpenTray(null)
  }

  const visible = items.filter((i) => !i.hidden)
  const tray = visible.find((i) => i.id === openTray)?.tray
  // Clear the camera controls column on the left; mirror it on the right so the dock stays centred.
  const sideInset = side ? '6rem' : '0rem'
  const rightInset = panelOpen && side ? `calc(min(${PANEL_WIDTH_REM}rem, 42vw) + ${PANEL_MARGIN_REM * 2}rem)` : sideInset

  return (
    <motion.div
      className="pointer-events-none fixed bottom-0 z-10 flex flex-col items-center gap-3 px-4 pb-6"
      style={{ left: sideInset }}
      animate={{ right: rightInset, opacity: panelOpen && !side ? 0 : 1 }}
      initial={false}
      transition={{ type: 'spring', stiffness: 170, damping: 26 }}
    >
      <AnimatePresence mode="wait">
        {tray && (
          <motion.div
            key={openTray}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="glass scrollbar-none pointer-events-auto flex max-w-full gap-2 overflow-x-auto rounded-full p-2"
            onClick={() => setOpenTray(null)}
          >
            {tray}
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="glass pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-full p-1.5 scrollbar-none">
        {visible.map((item) => {
          const expanded = item.tray !== undefined && openTray === item.id
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.tray !== undefined) setOpenTray(expanded ? null : item.id)
                else setOpenTray(null)
                item.onSelect?.()
              }}
              aria-expanded={item.tray !== undefined ? expanded : undefined}
              className={clsx(
                'relative flex h-16 min-w-[5.5rem] shrink-0 flex-col items-center justify-center gap-1 rounded-full px-5 transition-colors duration-300',
                item.active || expanded ? 'text-gold' : 'text-ivory/70 hover:text-ivory',
              )}
            >
              {(item.active || expanded) && (
                <motion.span layoutId="dock-active" className="absolute inset-0 rounded-full bg-gold/10 ring-1 ring-gold/30" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
              )}
              <item.icon size={21} strokeWidth={1.5} className="relative" />
              <span className="relative text-[0.68rem] font-semibold uppercase tracking-[0.18em]">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </motion.div>
  )
}

/** A tray entry. */
export function Chip({ active, onClick, children, swatch }: { active?: boolean; onClick: () => void; children: ReactNode; swatch?: string }) {
  return (
    <button
      // Tapping a chip also closes its tray (the tray's own click handler), keeping the model clear.
      onClick={onClick}
      className={clsx(
        'flex h-14 shrink-0 items-center gap-2.5 rounded-full px-6 text-[0.95rem] font-medium transition-all duration-300 active:scale-95',
        active ? 'bg-gold text-ink' : 'text-ivory/80 hover:bg-white/8 hover:text-ivory',
      )}
    >
      {swatch && <span className="h-2.5 w-2.5 rounded-full" style={{ background: swatch }} />}
      {children}
    </button>
  )
}
