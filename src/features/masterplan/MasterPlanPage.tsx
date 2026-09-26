import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Clapperboard, Grid2x2, Images, Info, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useMemo } from 'react'
import { useParams } from 'react-router'
import { masterPlanQuery } from '../../api/queries'
import type { AvailabilityStatus, MasterPlan, Plot } from '../../api/types'
import { GestureHint } from '../../components/GestureHint'
import { SceneHeader } from '../../components/SceneHeader'
import { ViewControls } from '../../components/ViewControls'
import { Chip, Dock } from '../../components/ui/Dock'
import { ErrorState, ScreenLoader } from '../../components/ui/Feedback'
import { DetailPanel } from '../../components/ui/Panel'
import { useShowroomNavigate } from '../../hooks/useShowroomNavigate'
import { statusLabel } from '../../lib/format'
import { blockOf, bounds, padBox } from '../../lib/geometry'
import { amenityIcon } from '../../lib/icons'
import { statusColor } from '../../lib/palette'
import { ALL_STATUSES, useMasterPlanStore } from '../../store/masterplan'
import { useMediaStore } from '../../store/media'
import { useStageStore } from '../../store/stage'
import { AmenityDetails, PlotDetails, ProjectOverview, RoadDetails } from './PlanPanels'

/** Interactive master plan: every plot, home, road and amenity of a project, on one model. */
export default function MasterPlanPage() {
  const { slug = '' } = useParams()
  const { data: plan, isPending, error, refetch } = useQuery(masterPlanQuery(slug))
  const show = useStageStore((s) => s.show)
  const enter = useMasterPlanStore((s) => s.enter)
  const go = useShowroomNavigate()

  useEffect(() => {
    enter(slug)
    show({ kind: 'masterplan', slug }, 'explore')
  }, [slug, enter, show])

  if (error) return <ErrorState title="This master plan is unavailable" detail={error.message} onRetry={() => void refetch()} />
  if (isPending) return <ScreenLoader label="Preparing the master plan" />

  return <MasterPlanScreen plan={plan} onBack={() => void go('/', { curtain: false })} />
}

function MasterPlanScreen({ plan, onBack }: { plan: MasterPlan; onBack: () => void }) {
  const { selection, aboutOpen, select, setAboutOpen, focusBox } = useMasterPlanStore()
  const openMedia = useMediaStore((s) => s.open)
  const go = useShowroomNavigate()
  const dive = useStageStore((s) => s.dive)

  const blocks = useMemo(() => groupBlocks(plan.plots), [plan.plots])
  const media = plan.media ?? []
  const film = media.find((m) => m.kind === 'video')
  const stills = media.filter((m) => m.kind !== 'video')
  const homes = plan.plots.filter((p) => p.unit).length

  const selectedPlot = selection?.kind === 'plot' ? plan.plots.find((p) => p.id === selection.id) : undefined
  const selectedAmenity = selection?.kind === 'amenity' ? plan.amenities.find((a) => a.id === selection.id) : undefined
  const selectedRoad = selection?.kind === 'road' ? plan.roads.find((r) => r.id === selection.id) : undefined
  const panelOpen = Boolean(selectedPlot || selectedAmenity || selectedRoad || aboutOpen)

  const closePanel = useCallback(() => {
    select(null)
    setAboutOpen(false)
  }, [select, setAboutOpen])

  const enterHome = (plot: Plot) => {
    if (!plot.unit) return
    const params = new URLSearchParams({ from: plan.slug, plot: plot.number })
    void go(`/property/${plot.unit.propertySlug}?${params}`, { before: () => dive?.(plot.id) })
  }

  return (
    <>
      <SceneHeader
        eyebrow={`Master plan · ${plan.location}`}
        title={plan.name}
        subtitle={`${plan.plots.length} plots${homes ? ` · ${homes} homes built` : ''} · ${plan.amenities.length} amenities`}
        onBack={onBack}
        backLabel="All projects"
      >
        <StatusFilter plan={plan} />
      </SceneHeader>

      <ViewControls />
      <GestureHint />

      <Dock
        panelOpen={panelOpen}
        items={[
          {
            id: 'blocks',
            icon: Grid2x2,
            label: 'Blocks',
            tray: (
              <>
                <Chip onClick={() => focusBox(padBox(bounds(plan.plots.map((p) => p.polygon)), 20))}>Whole site</Chip>
                {blocks.map((b) => (
                  <Chip key={b.name} onClick={() => focusBox(b.box)}>
                    Block {b.name}
                  </Chip>
                ))}
              </>
            ),
          },
          {
            id: 'amenities',
            icon: Sparkles,
            label: 'Amenities',
            active: Boolean(selectedAmenity),
            tray: plan.amenities.map((a) => {
              const Icon = amenityIcon[a.kind]
              return (
                <Chip key={a.id} active={a.id === selectedAmenity?.id} onClick={() => select({ kind: 'amenity', id: a.id })}>
                  <Icon size={17} strokeWidth={1.6} className={a.id === selectedAmenity?.id ? '' : 'text-gold'} /> {a.name}
                </Chip>
              )
            }),
          },
          { id: 'about', icon: Info, label: 'About', active: aboutOpen, onSelect: () => setAboutOpen(!aboutOpen) },
          { id: 'gallery', icon: Images, label: 'Gallery', hidden: stills.length === 0, onSelect: () => openMedia(stills) },
          { id: 'film', icon: Clapperboard, label: 'Film', hidden: !film, onSelect: () => film && openMedia([film]) },
        ]}
      />

      <DetailPanel open={panelOpen} contentKey={selection ? `${selection.kind}:${selection.id}` : 'about'} onClose={closePanel}>
        {selectedPlot ? (
          <PlotDetails plot={selectedPlot} onEnter={() => enterHome(selectedPlot)} />
        ) : selectedAmenity ? (
          <AmenityDetails amenity={selectedAmenity} />
        ) : selectedRoad ? (
          <RoadDetails road={selectedRoad} />
        ) : (
          <ProjectOverview plan={plan} onPlayFilm={film ? () => openMedia([film]) : undefined} />
        )}
      </DetailPanel>
    </>
  )
}

function groupBlocks(plots: Plot[]) {
  const byBlock = new Map<string, Plot[]>()
  for (const p of plots) {
    const name = blockOf(p.number)
    byBlock.set(name, [...(byBlock.get(name) ?? []), p])
  }
  return [...byBlock.entries()].map(([name, ps]) => ({ name, box: padBox(bounds(ps.map((p) => p.polygon)), 10) }))
}

/** Live availability that doubles as a filter: tap a status to show or hide those plots. */
function StatusFilter({ plan }: { plan: MasterPlan }) {
  const visible = useMasterPlanStore((s) => s.visibleStatuses)
  const toggle = useMasterPlanStore((s) => s.toggleStatus)
  const counts = useMemo(() => {
    const c: Record<AvailabilityStatus, number> = { available: 0, reserved: 0, sold: 0 }
    for (const p of plan.plots) c[p.status]++
    return c
  }, [plan.plots])

  return (
    <motion.div
      className="glass pointer-events-auto mt-6 inline-flex rounded-full p-1.5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.7 }}
    >
      {ALL_STATUSES.map((s) => {
        const on = visible.has(s)
        return (
          <button
            key={s}
            onClick={() => toggle(s)}
            aria-pressed={on}
            className={clsx('flex h-12 items-center gap-3 rounded-full px-5 transition-all duration-300', on ? 'bg-white/[0.06]' : 'opacity-40')}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: statusColor[s] }} />
            <span className="text-sm font-medium">{statusLabel[s]}</span>
            <span className="font-display text-lg tabular-nums text-ivory/60">{counts[s]}</span>
          </button>
        )
      })}
    </motion.div>
  )
}
