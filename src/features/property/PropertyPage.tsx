import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, Clapperboard, DoorOpen, Images, Info } from 'lucide-react'
import { useCallback, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { propertyQuery } from '../../api/queries'
import type { Property, Room } from '../../api/types'
import { GestureHint } from '../../components/GestureHint'
import { SceneHeader } from '../../components/SceneHeader'
import { ViewControls } from '../../components/ViewControls'
import { Chip, Dock } from '../../components/ui/Dock'
import { ErrorState, ScreenLoader } from '../../components/ui/Feedback'
import { DetailPanel } from '../../components/ui/Panel'
import { useShowroomNavigate } from '../../hooks/useShowroomNavigate'
import { listingTypeLabel } from '../../lib/format'
import { useMediaStore } from '../../store/media'
import { useStageStore } from '../../store/stage'
import { useViewerStore } from '../../store/viewer'
import { PropertyOverview, RoomDetails } from './PropertyPanels'
import { RoomViewer } from './RoomViewer'

/**
 * A single residence in 3D. Opened from a plot on a master plan (?from=<plan>&plot=<number>)
 * or directly for standalone buildings. Tap rooms to fly to them; peel floors away on the left.
 */
export default function PropertyPage() {
  const { slug = '' } = useParams()
  const [params] = useSearchParams()
  const fromPlan = params.get('from')
  const plotNumber = params.get('plot')
  const { data: property, isPending, error, refetch } = useQuery(propertyQuery(slug))
  const show = useStageStore((s) => s.show)
  const enter = useViewerStore((s) => s.enter)
  const go = useShowroomNavigate()

  useEffect(() => {
    enter(slug)
    show({ kind: 'property', slug }, 'explore')
  }, [slug, enter, show])

  // Back to the plot on the master plan (through the curtain), or out to the landing screen.
  const back = useCallback(() => void (fromPlan ? go(`/layout/${fromPlan}`) : go('/', { curtain: false })), [fromPlan, go])

  if (error) return <ErrorState title="This residence is unavailable" detail={error.message} onRetry={() => void refetch()} />
  if (isPending) return <ScreenLoader label="Preparing the residence" />

  return <PropertyScreen property={property} plotNumber={plotNumber} onBack={back} backLabel={fromPlan ? 'Back to master plan' : 'All projects'} />
}

function PropertyScreen({ property, plotNumber, onBack, backLabel }: { property: Property; plotNumber: string | null; onBack: () => void; backLabel: string }) {
  const { selectedRoomId, aboutOpen, roomViewId, selectRoom, setAboutOpen, goToPreset, openRoomView, closeRoomView } = useViewerStore()
  const openMedia = useMediaStore((s) => s.open)

  const selectedRoom = property.rooms.find((r) => r.id === selectedRoomId)
  const levelByFloorId = new Map(property.floors.map((f) => [f.id, f.level]))
  const film = property.media.find((m) => m.kind === 'video')
  const stills = property.media.filter((m) => m.kind !== 'video')
  const roomInView = property.rooms.find((r) => r.id === roomViewId) ?? null
  const panelOpen = !roomInView && Boolean(selectedRoom || aboutOpen)
  const facts = (property.stats ?? Object.entries(property.highlights).map(([label, value]) => ({ label, value })))
    .slice(0, 3)
    .map((s) => `${s.value} ${s.label.toLowerCase()}`)
    .join('  ·  ')

  const closePanel = useCallback(() => {
    selectRoom(null)
    setAboutOpen(false)
  }, [selectRoom, setAboutOpen])

  const openRoom = useCallback(
    (r: Room) => openRoomView(r.id, r.floorId ? levelByFloorId.get(r.floorId) ?? null : undefined),
    // levelByFloorId is rebuilt each render from the same floors.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [openRoomView, property.floors],
  )

  return (
    <>
      <AnimatePresence>
        {roomInView && <RoomViewer key="room-viewer" property={property} room={roomInView} onSelectRoom={openRoom} onClose={closeRoomView} />}
      </AnimatePresence>

      {/* The house view's chrome steps aside while a room is open. */}
      <motion.div
        className="pointer-events-none"
        animate={roomInView ? { opacity: 0, transitionEnd: { visibility: 'hidden' } } : { opacity: 1, visibility: 'visible' }}
        transition={{ duration: 0.45 }}
      >
        <SceneHeader
          eyebrow={plotNumber ? `Plot ${plotNumber} · ${listingTypeLabel[property.type]}` : `${listingTypeLabel[property.type]} · ${property.location}`}
          title={property.name}
          subtitle={facts}
          onBack={onBack}
          backLabel={backLabel}
        />

        <FloorRail property={property} />
        {!roomInView && <ViewControls />}
        <GestureHint />

        <Dock
          panelOpen={panelOpen}
          items={[
            {
              id: 'views',
              icon: Camera,
              label: 'Views',
              tray: property.presets.map((p) => (
                <Chip key={p.id} onClick={() => goToPreset(p.id)}>
                  {p.name}
                </Chip>
              )),
            },
            {
              id: 'rooms',
              icon: DoorOpen,
              label: 'Rooms',
              active: Boolean(selectedRoom),
              tray: property.rooms.map((r) => (
                <Chip
                  key={r.id}
                  active={r.id === selectedRoomId}
                  onClick={() => openRoom(r)}
                >
                  {r.name}
                </Chip>
              )),
            },
            { id: 'about', icon: Info, label: 'About', active: aboutOpen, onSelect: () => setAboutOpen(!aboutOpen) },
            { id: 'gallery', icon: Images, label: 'Gallery', hidden: stills.length === 0, onSelect: () => openMedia(stills) },
            { id: 'film', icon: Clapperboard, label: 'Film', hidden: !film, onSelect: () => film && openMedia([film]) },
          ]}
        />

        <DetailPanel open={panelOpen} contentKey={selectedRoom?.id ?? 'about'} onClose={closePanel}>
          {selectedRoom ? (
            <RoomDetails property={property} room={selectedRoom} />
          ) : (
            <PropertyOverview property={property} onPlayFilm={film ? () => openMedia([film]) : undefined} />
          )}
        </DetailPanel>
      </motion.div>
    </>
  )
}

/**
 * Cut-away floor selector, styled like an elevator panel. Choosing a level hides everything
 * above it so the buyer looks straight into those rooms.
 */
function FloorRail({ property }: { property: Property }) {
  const activeLevel = useViewerStore((s) => s.activeLevel)
  const setActiveLevel = useViewerStore((s) => s.setActiveLevel)
  if (property.floors.length < 2) return null
  const floors = [...property.floors].sort((a, b) => b.level - a.level)
  const short = (name: string, level: number) => (level === 0 ? 'G' : /\d+/.exec(name)?.[0] ?? String(level))

  const options = [{ key: 'all', label: 'All', title: 'Whole home', level: null as number | null }].concat(
    floors.map((f) => ({ key: f.id, label: short(f.name, f.level), title: f.name, level: f.level })),
  )

  return (
    <motion.div
      className="pointer-events-none fixed left-6 top-1/2 z-10 -translate-y-1/2"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="eyebrow mb-3 pl-1 text-ivory/40">Levels</p>
      <div className="glass pointer-events-auto flex flex-col gap-1 rounded-[1.75rem] p-1.5">
        {options.map((o) => {
          const on = activeLevel === o.level
          return (
            <button
              key={o.key}
              onClick={() => setActiveLevel(o.level)}
              title={o.title}
              aria-pressed={on}
              className={clsx(
                'relative flex h-14 w-14 items-center justify-center rounded-full font-display text-xl transition-colors duration-300',
                on ? 'text-ink' : 'text-ivory/70 hover:text-ivory',
              )}
            >
              {on && <motion.span layoutId="floor-active" className="absolute inset-0 rounded-full bg-gold" transition={{ type: 'spring', stiffness: 320, damping: 30 }} />}
              <span className={clsx('relative', o.key === 'all' && 'font-sans text-[0.65rem] font-bold uppercase tracking-[0.15em]')}>{o.label}</span>
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}
