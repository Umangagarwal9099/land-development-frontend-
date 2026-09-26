import clsx from 'clsx'
import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight, Hand, X } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import type { MediaItem } from '../../api/types'
import { IconButton } from '../../components/ui/Button'
import { LoaderMark } from '../../components/ui/LoaderMark'
import { assetUrl } from '../../config'
import { useMediaStore } from '../../store/media'
import { VideoPlayer } from './VideoPlayer'

// The panorama viewer brings its own canvas; loaded only when a 360° view is opened.
const PanoViewer = lazy(() => import('./PanoViewer'))

const kindLabel: Record<MediaItem['kind'], string> = {
  image: 'Gallery',
  video: 'Film',
  pano: '360° Interior',
  pdf: 'Brochure',
  floorplan: 'Floor plan',
}

const SWIPE_PX = 80

/**
 * Full-screen cinema for renders, films, floor plans and 360° interiors. Swipe or use the
 * arrows to move through a set; the filmstrip shows where you are. Esc / ✕ returns to the model.
 */
export function MediaViewer() {
  const { items, index, close, step, goTo } = useMediaStore()
  const [direction, setDirection] = useState(1)
  const item = index === null ? null : items[index]

  const move = (delta: number) => {
    setDirection(delta)
    step(delta)
  }

  useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      // Captured at the window so camera shortcuts on the screen underneath don't fire.
      e.stopPropagation()
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') move(1)
      if (e.key === 'ArrowLeft') move(-1)
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  })

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_PX) move(1)
    else if (info.offset.x > SWIPE_PX) move(-1)
  }

  return (
    <AnimatePresence>
      {item && index !== null && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-ink/95 backdrop-blur-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35 } }}
          transition={{ duration: 0.5 }}
          // Stop key/gesture handlers on the 3D screen underneath from seeing these events.
          onKeyDown={(e) => e.stopPropagation()}
        >
          <header className="flex items-center justify-between gap-6 px-8 pb-4 pt-7">
            <div className="min-w-0">
              <p className="eyebrow">{kindLabel[item.kind]}</p>
              <AnimatePresence mode="wait">
                <motion.h2
                  key={item.id}
                  className="mt-2 truncate font-display text-4xl font-medium"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {item.title ?? ' '}
                </motion.h2>
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-6">
              {items.length > 1 && (
                <p className="font-display text-2xl tabular-nums text-ivory/60">
                  <span className="text-gold">{String(index + 1).padStart(2, '0')}</span>
                  <span className="mx-2 text-ivory/25">/</span>
                  {String(items.length).padStart(2, '0')}
                </p>
              )}
              <IconButton icon={X} label="Close" size="lg" onClick={close} />
            </div>
          </header>

          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-6 md:px-28">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={item.id}
                custom={direction}
                className="flex h-full w-full items-center justify-center"
                variants={{
                  enter: (d: number) => ({ opacity: 0, x: d * 120, scale: 0.98 }),
                  center: { opacity: 1, x: 0, scale: 1 },
                  exit: (d: number) => ({ opacity: 0, x: d * -120, scale: 0.98 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                // Only still images swipe; video scrubbing and 360° look-around need the drag.
                drag={item.kind === 'image' || item.kind === 'floorplan' ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.3}
                onDragEnd={onDragEnd}
              >
                <MediaView item={item} />
              </motion.div>
            </AnimatePresence>
            {items.length > 1 && (
              <>
                <IconButton icon={ChevronLeft} label="Previous" size="lg" onClick={() => move(-1)} className="absolute left-6 top-1/2 -translate-y-1/2 max-md:hidden" />
                <IconButton icon={ChevronRight} label="Next" size="lg" onClick={() => move(1)} className="absolute right-6 top-1/2 -translate-y-1/2 max-md:hidden" />
              </>
            )}
          </div>

          {items.length > 1 && (
            <nav className="scrollbar-none flex justify-center gap-3 overflow-x-auto px-8 pb-7 pt-5">
              {items.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setDirection(i > index ? 1 : -1)
                    goTo(i)
                  }}
                  className={clsx(
                    'relative aspect-[16/10] h-20 shrink-0 overflow-hidden rounded-xl transition-all duration-500 ease-[var(--ease-lux)]',
                    i === index ? 'opacity-100 ring-2 ring-gold ring-offset-2 ring-offset-ink' : 'opacity-40 hover:opacity-80',
                  )}
                >
                  <img src={assetUrl(m.thumbUrl ?? m.url)} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </nav>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function MediaView({ item }: { item: MediaItem }) {
  switch (item.kind) {
    case 'video':
      return <VideoPlayer url={item.url} poster={item.thumbUrl} />
    case 'pano':
      return (
        <div className="relative h-full w-full overflow-hidden rounded-3xl border border-line">
          {/* Sits behind the transparent canvas until the panorama covers it. */}
          <div className="absolute inset-0 flex items-center justify-center">
            <LoaderMark label="Opening 360° view" />
          </div>
          <Suspense fallback={null}>
            <PanoViewer url={item.url} />
          </Suspense>
          <div className="glass pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full px-5 py-2.5 text-sm text-ivory/80">
            <Hand size={16} className="text-gold" /> Drag to look around · Pinch to zoom
          </div>
        </div>
      )
    case 'pdf':
      return <iframe src={assetUrl(item.url)} title={item.title} className="h-full w-full rounded-2xl bg-white" />
    default:
      return (
        <img
          src={assetUrl(item.url)}
          alt={item.title ?? ''}
          draggable={false}
          className="max-h-full max-w-full rounded-2xl object-contain shadow-[0_40px_120px_-40px_rgb(0_0_0/0.9)]"
        />
      )
  }
}
