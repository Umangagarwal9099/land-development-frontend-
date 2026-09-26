import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { ArrowRight, Maximize, Minimize, Play } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { catalogQuery, masterPlanQuery, propertyQuery, queryClient } from '../../api/queries'
import type { CatalogItem, MediaItem } from '../../api/types'
import { BrandMark } from '../../components/BrandMark'
import { Button, IconButton } from '../../components/ui/Button'
import { ErrorState, ScreenLoader } from '../../components/ui/Feedback'
import { useFullscreen } from '../../hooks/useFullscreen'
import { useShowroomNavigate } from '../../hooks/useShowroomNavigate'
import { wait } from '../../lib/async'
import { formatPrice, listingTypeLabel } from '../../lib/format'
import { useMediaStore } from '../../store/media'
import { useStaffStore } from '../../store/staff'
import { useStageStore, type StageScene } from '../../store/stage'

/** Seconds each project holds the stage before the showcase moves on. */
const ADVANCE_SECONDS = 14
/** After a visitor touches the screen, the showcase holds still this long. */
const HOLD_AFTER_TOUCH_SECONDS = 40
const SWIPE_PX = 90
const EASE = [0.22, 1, 0.36, 1] as const

const sceneFor = (item: CatalogItem): StageScene =>
  item.type === 'plots' ? { kind: 'masterplan', slug: item.slug } : { kind: 'property', slug: item.slug }

const projectPath = (item: CatalogItem) => (item.type === 'plots' ? `/layout/${item.slug}` : `/property/${item.slug}`)

const typeLabel = (item: CatalogItem) => (item.type === 'plots' ? 'Master-planned community' : listingTypeLabel[item.type])

function prefetch(item: CatalogItem) {
  if (item.type === 'plots') void queryClient.prefetchQuery(masterPlanQuery(item.slug))
  else void queryClient.prefetchQuery(propertyQuery(item.slug))
}

/**
 * The showroom's front door: each project turns slowly in 3D behind a cinematic title card.
 * Projects advance on their own; swipe or tap the index to choose, then step into the model.
 */
export default function LandingPage() {
  const { data, isPending, error, refetch } = useQuery(catalogQuery())
  const items = data?.items ?? []
  const [active, setActive] = useState(() => initialIndex())
  // Each cycle is one project's turn; a visitor's touch starts a longer one.
  const [cycle, setCycle] = useState({ key: 0, seconds: ADVANCE_SECONDS })
  const item = items.length ? items[active % items.length] : null
  const show = useStageStore((s) => s.show)
  const go = useShowroomNavigate()

  // Show the active project on the stage. The first time, cut straight to it; afterwards, dissolve.
  const [shownSlug, setShownSlug] = useState<string | null>(null)
  useEffect(() => {
    if (!item) return
    let cancelled = false
    const stage = useStageStore.getState()
    const next = sceneFor(item)
    const alreadyOnStage = stage.scene?.kind === next.kind && stage.scene.slug === next.slug
    void (async () => {
      if (!alreadyOnStage && stage.scene) {
        stage.setDimmed(true)
        await wait(650)
      }
      if (cancelled) return
      show(next, 'attract')
      stage.setDimmed(false)
      setShownSlug(item.slug)
    })()
    prefetch(item)
    const upcoming = items[(active + 1) % items.length]
    if (upcoming) prefetch(upcoming)
    return () => {
      cancelled = true
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- items identity changes on every poll
  }, [item?.slug, show])

  const select = useCallback(
    (index: number) => {
      if (!items.length) return
      setActive((index + items.length) % items.length)
      setCycle((c) => ({ key: c.key + 1, seconds: HOLD_AFTER_TOUCH_SECONDS }))
    },
    [items.length],
  )

  // Auto-advance, paused while a visitor is interacting or watching a film.
  const mediaOpen = useMediaStore((s) => s.index !== null)
  useEffect(() => {
    if (items.length < 2 || mediaOpen) return
    const t = window.setTimeout(() => {
      setActive((a) => (a + 1) % items.length)
      setCycle((c) => ({ key: c.key + 1, seconds: ADVANCE_SECONDS }))
    }, cycle.seconds * 1000)
    return () => window.clearTimeout(t)
  }, [cycle, items.length, mediaOpen])

  const onPanEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) < SWIPE_PX || Math.abs(info.offset.x) < Math.abs(info.offset.y)) return
    select(active + (info.offset.x < 0 ? 1 : -1))
  }

  if (error) return <ErrorState title="The showroom couldn't load its projects" detail={error.message} onRetry={() => void refetch()} showHome={false} />
  if (isPending || !item) return <ScreenLoader label="Opening the showroom" />

  return (
    <div className="pointer-events-none fixed inset-0">
      {/* Swipe surface: the whole screen, beneath the content. */}
      <motion.div className="pointer-events-auto absolute inset-0" onPanEnd={onPanEnd} />

      {/* Legibility scrims — dark at the left and bottom where text sits, open where the model turns. */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgb(7_8_10/0.92)_0%,rgb(7_8_10/0.55)_35%,transparent_62%)] max-md:bg-[linear-gradient(0deg,rgb(7_8_10/0.95)_0%,rgb(7_8_10/0.6)_50%,transparent_75%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-ink via-ink/60 to-transparent" />

      <TopBar />

      <main className="absolute inset-x-0 bottom-44 left-0 px-10 md:bottom-48 md:left-16 md:max-w-[46rem] md:px-0">
        <AnimatePresence mode="wait">
          <ProjectCard key={item.id} item={item} index={active} total={items.length} ready={shownSlug === item.slug} onExplore={() => void go(projectPath(item), { curtain: false })} />
        </AnimatePresence>
      </main>

      <ProjectIndex items={items} active={active} cycle={cycle} paused={mediaOpen} onSelect={select} />
    </div>
  )
}

/** When returning from a project, keep showing the project the visitor just left. */
function initialIndex() {
  const scene = useStageStore.getState().scene
  const items = queryClient.getQueryData(catalogQuery().queryKey)?.items ?? []
  return Math.max(0, items.findIndex((i) => i.slug === scene?.slug))
}

function TopBar() {
  const fullscreen = useFullscreen()
  return (
    <motion.div
      className="absolute inset-x-0 top-0 flex items-center justify-between px-10 pt-8 md:px-16"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: EASE }}
    >
      <BrandMark />
      {fullscreen.supported && (
        <IconButton icon={fullscreen.active ? Minimize : Maximize} label={fullscreen.active ? 'Exit presentation mode' : 'Presentation mode'} onClick={fullscreen.toggle} />
      )}
    </motion.div>
  )
}

function ProjectCard({ item, index, total, ready, onExplore }: { item: CatalogItem; index: number; total: number; ready: boolean; onExplore: () => void }) {
  const showPrices = useStaffStore((s) => s.showPrices)
  const film = useProjectFilm(item)
  const openMedia = useMediaStore((s) => s.open)
  const words = item.name.split(' ')

  return (
    <motion.div className="pointer-events-auto" exit={{ opacity: 0, y: -12, transition: { duration: 0.4 } }}>
      <motion.p className="eyebrow flex items-center gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.1 }}>
        <span className="font-display text-base tracking-[0.2em] text-gold">
          {String(index + 1).padStart(2, '0')} <span className="text-ivory/30">/ {String(total).padStart(2, '0')}</span>
        </span>
        <span className="h-px w-10 bg-gold/50" />
        {typeLabel(item)}
      </motion.p>

      {/* Title rises word by word from behind a mask. */}
      <h1 className="mt-6 font-display text-[clamp(3.6rem,7.2vw,8.5rem)] font-medium leading-[0.9] tracking-tight">
        {words.map((w, i) => (
          <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
            <motion.span
              className="inline-block"
              initial={{ y: '105%' }}
              animate={{ y: 0 }}
              transition={{ duration: 1.1, delay: 0.15 + i * 0.09, ease: EASE }}
            >
              {w}
              {i < words.length - 1 && ' '}
            </motion.span>
          </span>
        ))}
      </h1>

      <motion.p
        className="mt-6 max-w-[34rem] font-display text-[1.7rem] italic leading-snug text-ivory/70"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.45, ease: EASE }}
      >
        {item.tagline}
      </motion.p>
      <motion.p className="mt-3 text-sm uppercase tracking-[0.3em] text-ivory/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        {item.location}
      </motion.p>

      {item.stats && item.stats.length > 0 && (
        <motion.dl
          className="mt-9 flex gap-10"
          initial="hidden"
          animate="shown"
          variants={{ shown: { transition: { staggerChildren: 0.08, delayChildren: 0.6 } } }}
        >
          {item.stats.map((s, i) => (
            <motion.div
              key={s.label}
              className={clsx(i > 0 && 'border-l border-gold/25 pl-10')}
              variants={{ hidden: { opacity: 0, y: 12 }, shown: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }}
            >
              <dd className="font-display text-[2.6rem] leading-none text-ivory">{s.value}</dd>
              <dt className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-ivory/45">{s.label}</dt>
            </motion.div>
          ))}
        </motion.dl>
      )}

      <motion.div
        className="mt-10 flex flex-wrap items-center gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8, ease: EASE }}
      >
        <Button icon={ArrowRight} onClick={onExplore} disabled={!ready}>
          Explore in 3D
        </Button>
        {film && (
          <Button variant="ghost" icon={Play} iconPosition="start" onClick={() => openMedia([film])}>
            Watch the film
          </Button>
        )}
        {showPrices && item.startingPrice !== undefined && (
          <span className="ml-2 text-sm uppercase tracking-[0.2em] text-ivory/50">
            From <span className="ml-1 font-display text-2xl normal-case tracking-normal text-gold">{formatPrice(item.startingPrice)}</span>
          </span>
        )}
      </motion.div>
    </motion.div>
  )
}

/** The project's film, if its detail (already prefetched for the stage) has one. */
function useProjectFilm(item: CatalogItem): MediaItem | null {
  const isPlan = item.type === 'plots'
  const plan = useQuery({ ...masterPlanQuery(item.slug), enabled: isPlan })
  const property = useQuery({ ...propertyQuery(item.slug), enabled: !isPlan })
  const media = isPlan ? plan.data?.media : property.data?.media
  return media?.find((m) => m.kind === 'video') ?? null
}

function ProjectIndex({
  items,
  active,
  cycle,
  paused,
  onSelect,
}: {
  items: CatalogItem[]
  active: number
  cycle: { key: number; seconds: number }
  paused: boolean
  onSelect: (i: number) => void
}) {
  return (
    <nav className="pointer-events-auto absolute inset-x-0 bottom-0 flex gap-2 overflow-x-auto px-10 pb-9 scrollbar-none md:px-16">
      {items.map((it, i) => {
        const on = i === active % items.length
        return (
          <button key={it.id} onClick={() => onSelect(i)} className="group min-w-[14rem] flex-1 pt-5 text-left md:max-w-[22rem]">
            <span className="relative block h-px w-full overflow-hidden bg-ivory/15">
              {on && (
                // The gold line fills over the project's turn on stage.
                <motion.span
                  key={cycle.key}
                  className="absolute inset-y-0 left-0 bg-gold"
                  initial={{ width: '0%' }}
                  animate={{ width: paused ? '0%' : '100%' }}
                  transition={{ duration: paused ? 0.3 : cycle.seconds, ease: 'linear' }}
                />
              )}
            </span>
            <span className="mt-4 flex items-baseline gap-3">
              <span className={clsx('font-display text-lg transition-colors', on ? 'text-gold' : 'text-ivory/30')}>{String(i + 1).padStart(2, '0')}</span>
              <span className={clsx('truncate text-[0.95rem] font-medium transition-colors duration-500', on ? 'text-ivory' : 'text-ivory/45 group-hover:text-ivory/75')}>
                {it.name}
              </span>
            </span>
            <span className="mt-1 block pl-9 text-xs uppercase tracking-[0.22em] text-ivory/30">{typeLabel(it)}</span>
          </button>
        )
      })}
    </nav>
  )
}
