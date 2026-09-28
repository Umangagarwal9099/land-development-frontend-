import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { Info, Maximize, Minimize, Move3d, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Property, Room } from '../../api/types'
import { ViewControls } from '../../components/ViewControls'
import { IconButton } from '../../components/ui/Button'
import { DetailPanel } from '../../components/ui/Panel'
import { LoaderMark } from '../../components/ui/LoaderMark'
import { useFullscreen } from '../../hooks/useFullscreen'
import { applyInset } from '../../lib/camera'
import { formatArea, formatDimensions } from '../../lib/format'
import { NO_INSET, panelInset } from '../../lib/layout'
import { useStageStore } from '../../store/stage'
import { useViewerStore } from '../../store/viewer'
import { RoomDetails } from './PropertyPanels'

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * The immersive room viewer's chrome. The room itself is the live 3D stage underneath, isolated
 * by RoomSection; this layer only adds the title, controls and room-to-room navigation, and keeps
 * out of the way of the gestures (drag to orbit 360°, pinch or scroll to zoom, two fingers to pan).
 */
export function RoomViewer({ property, room, onSelectRoom, onClose }: { property: Property; room: Room; onSelectRoom: (room: Room) => void; onClose: () => void }) {
  const ready = useViewerStore((s) => s.roomReady)
  const controls = useStageStore((s) => s.controls)
  const fullscreen = useFullscreen()
  const [details, setDetails] = useState(false)
  const floor = property.floors.find((f) => f.id === room.floorId)

  // Frame the room beside the details panel while it is open.
  useEffect(() => {
    if (controls && ready) applyInset(controls, details ? panelInset() : NO_INSET)
  }, [controls, details, ready])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // The details panel closes itself on Escape first.
      if (e.key === 'Escape' && !details) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [details, onClose])

  const facts = [room.dimensions && formatDimensions(room.dimensions), room.areaSqft !== undefined && formatArea(room.areaSqft)].filter(Boolean).join('  ·  ')

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.6, ease: EASE } }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
    >
      {/* Deeper vignette than the house view: the room is the only lit thing on screen. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgb(7_8_10/0.6)_100%)]" />

      <header className="absolute inset-x-0 top-0 flex items-start justify-between gap-6 bg-gradient-to-b from-ink/70 to-transparent px-8 pb-16 pt-7">
        <div className="min-w-0">
          <p className="eyebrow truncate">
            {property.name} · {floor?.name ?? 'Outdoors'}
          </p>
          <AnimatePresence mode="wait">
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } }}
              exit={{ opacity: 0, y: -6, transition: { duration: 0.2 } }}
            >
              <h1 className="mt-2 font-display text-5xl leading-none text-ivory">{room.name}</h1>
              {facts && <p className="mt-3 text-sm tracking-wide text-ivory/60">{facts}</p>}
            </motion.div>
          </AnimatePresence>
          <button
            onClick={() => setDetails((d) => !d)}
            aria-pressed={details}
            className={clsx(
              'glass pointer-events-auto mt-5 inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm tracking-wide transition',
              details ? 'text-gold' : 'text-ivory/80 hover:text-ivory',
            )}
          >
            <Info size={16} strokeWidth={1.6} />
            Room details
          </button>
        </div>
        <div className="flex shrink-0 gap-2.5">
          {fullscreen.supported && (
            <IconButton icon={fullscreen.active ? Minimize : Maximize} label={fullscreen.active ? 'Exit fullscreen' : 'Fullscreen'} onClick={fullscreen.toggle} />
          )}
          <IconButton icon={X} label="Close room view" onClick={onClose} />
        </div>
      </header>

      <ViewControls variant="room" />

      <RoomNavigation property={property} current={room} onSelect={onSelectRoom} />

      <AnimatePresence>
        {!ready && (
          <motion.div
            key="loading"
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.3 } }}
            exit={{ opacity: 0, transition: { duration: 0.6, ease: EASE } }}
          >
            <div className="rounded-full bg-[radial-gradient(circle,rgb(7_8_10/0.55),transparent_70%)] p-16">
              <LoaderMark label={`Entering ${room.name}`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {ready && <GestureCue key={room.id} />}

      <DetailPanel open={details} contentKey={room.id} onClose={() => setDetails(false)}>
        <RoomDetails property={property} room={room} />
      </DetailPanel>
    </motion.div>
  )
}

/** Every room in the property, one tap away; the current room stays in view as the strip scrolls. */
function RoomNavigation({ property, current, onSelect }: { property: Property; current: Room; onSelect: (room: Room) => void }) {
  const active = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    // Braces matter: newer browsers return a Promise from scrollIntoView, which React would treat as a cleanup.
    void active.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [current.id])

  return (
    <nav aria-label="Rooms" className="absolute inset-x-0 bottom-6 flex justify-center px-6">
      <div className="glass pointer-events-auto flex max-w-[min(72rem,100%)] items-center gap-1 rounded-full p-1.5">
        <span className="eyebrow hidden shrink-0 pl-5 pr-3 text-ivory/40 md:block">Rooms</span>
        <div className="scrollbar-none flex gap-1 overflow-x-auto">
          {property.rooms.map((r) => {
            const on = r.id === current.id
            return (
              <button
                key={r.id}
                ref={on ? active : undefined}
                onClick={() => onSelect(r)}
                aria-current={on}
                className={clsx(
                  'relative flex h-12 shrink-0 items-center rounded-full px-5 text-[0.92rem] font-medium transition-colors duration-300',
                  on ? 'text-ink' : 'text-ivory/75 hover:bg-white/8 hover:text-ivory',
                )}
              >
                {on && <motion.span layoutId="room-nav-active" className="absolute inset-0 rounded-full bg-gold" transition={{ type: 'spring', stiffness: 320, damping: 32 }} />}
                <span className="relative whitespace-nowrap">{r.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

/** A brief reminder of the gestures each time a room opens; fades on its own or at the first touch. */
function GestureCue() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const hide = () => setVisible(false)
    const t = window.setTimeout(hide, 4200)
    window.addEventListener('pointerdown', hide, { once: true })
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('pointerdown', hide)
    }
  }, [])
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-x-0 bottom-28 flex justify-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.6 } }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
        >
          <div className="glass flex items-center gap-3 rounded-full px-5 py-2.5 text-sm tracking-wide text-ivory/80">
            <Move3d size={18} strokeWidth={1.5} className="text-gold" />
            Drag to look around 360° <span className="text-gold/60">·</span> Pinch or scroll to zoom <span className="text-gold/60">·</span> Two fingers to pan
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
