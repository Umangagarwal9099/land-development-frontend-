import { motion } from 'framer-motion'
import { ArrowRight, Box, Play } from 'lucide-react'
import type { Amenity, MasterPlan, Plot, Road } from '../../api/types'
import { Button } from '../../components/ui/Button'
import { Facts, MediaStrip, PanelSection, PanelTitle, Paragraph, PriceTag, rise, StatusBadge } from '../../components/ui/Panel'
import { formatArea, formatPrice } from '../../lib/format'
import { blockOf } from '../../lib/geometry'
import { amenityKindLabel } from '../../lib/icons'
import { useMasterPlanStore } from '../../store/masterplan'
import { useStaffStore } from '../../store/staff'

export function PlotDetails({ plot, onEnter }: { plot: Plot; onEnter: () => void }) {
  const showPrices = useStaffStore((s) => s.showPrices)
  const buildPreview = useMasterPlanStore((s) => s.buildPreview)
  const setBuildPreview = useMasterPlanStore((s) => s.setBuildPreview)

  const facts: [string, string][] = [
    ['Plot area', formatArea(plot.areaSqft)],
    ['Dimensions', plot.dimensionsLabel],
    ['Facing', plot.facing],
    ['Road', `${plot.roadWidthFt} ft`],
  ]
  if (plot.isCorner) facts.push(['Position', 'Corner'])

  return (
    <>
      <PanelTitle eyebrow={`Block ${blockOf(plot.number)} · ${plot.unit ? plot.unit.kind : 'Plot'}`} title={plot.number}>
        <StatusBadge status={plot.status} />
      </PanelTitle>

      {plot.unit && (
        <motion.div variants={rise} className="mt-8 overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-br from-gold/10 via-transparent to-transparent p-6">
          <p className="eyebrow">Residence on this plot</p>
          <p className="mt-2 font-display text-3xl">{plot.unit.name}</p>
          <p className="mt-2 text-ivory/60">Step inside to walk every room, floor by floor.</p>
          <Button icon={ArrowRight} onClick={onEnter} className="mt-6 w-full">
            Enter residence
          </Button>
        </motion.div>
      )}

      <PanelSection title="The plot">
        <Facts items={facts} />
      </PanelSection>

      {showPrices && plot.price !== undefined && (
        <PriceTag label="Price" amount={plot.price} note={`≈ ${formatPrice(Math.round(plot.price / plot.areaSqft))} per sq ft`} />
      )}

      {!plot.unit && (
        <PanelSection>
          <Button variant={buildPreview ? 'primary' : 'ghost'} icon={Box} iconPosition="start" onClick={() => setBuildPreview(!buildPreview)} className="w-full">
            {buildPreview ? 'Hide the home preview' : 'Visualise a home here'}
          </Button>
        </PanelSection>
      )}
    </>
  )
}

export function AmenityDetails({ amenity, onEnter }: { amenity: Amenity; onEnter?: () => void }) {
  return (
    <>
      <PanelTitle eyebrow={amenityKindLabel[amenity.kind]} title={amenity.name} />
      <Paragraph>{amenity.description}</Paragraph>
      {onEnter && (
        <PanelSection>
          <Button icon={ArrowRight} onClick={onEnter} className="w-full">
            Step inside the {amenity.kind === 'clubhouse' ? 'clubhouse' : amenity.name.toLowerCase()}
          </Button>
        </PanelSection>
      )}
      {amenity.media && amenity.media.length > 0 && (
        <PanelSection title="Gallery">
          <MediaStrip items={amenity.media} />
        </PanelSection>
      )}
      {amenity.highlights && (
        <PanelSection title="At a glance">
          <Facts items={Object.entries(amenity.highlights)} />
        </PanelSection>
      )}
    </>
  )
}

export function RoadDetails({ road }: { road: Road }) {
  return (
    <>
      <PanelTitle eyebrow="Road" title={road.name ?? 'Internal road'} />
      <Paragraph>Tree-lined, with underground utilities, LED street lighting and pedestrian walkways on both sides.</Paragraph>
      <PanelSection title="At a glance">
        <Facts items={[['Width', road.widthFt ? `${road.widthFt} ft` : '—'], ['Surface', 'Bituminous'], ['Lighting', 'LED'], ['Walkways', 'Both sides']]} />
      </PanelSection>
    </>
  )
}

export function ProjectOverview({ plan, onPlayFilm }: { plan: MasterPlan; onPlayFilm?: () => void }) {
  const showPrices = useStaffStore((s) => s.showPrices)
  return (
    <>
      <PanelTitle eyebrow="About the project" title={plan.name} />
      <motion.p variants={rise} className="mt-5 font-display text-2xl italic leading-snug text-ivory/75">
        {plan.tagline}
      </motion.p>
      <Paragraph>{plan.description}</Paragraph>
      {onPlayFilm && (
        <PanelSection>
          <Button variant="ghost" icon={Play} iconPosition="start" onClick={onPlayFilm} className="w-full">
            Watch the project film
          </Button>
        </PanelSection>
      )}
      {showPrices && plan.startingPrice !== undefined && <PriceTag label="Plots from" amount={plan.startingPrice} />}
      {plan.highlights && (
        <PanelSection title="Highlights">
          <Facts items={Object.entries(plan.highlights)} />
        </PanelSection>
      )}
      {plan.nearby.length > 0 && (
        <PanelSection title="In the neighbourhood">
          <ul>
            {plan.nearby.map((n) => (
              <li key={n.name} className="flex items-baseline justify-between gap-4 border-b border-line py-4 last:border-0">
                <span className="text-[1.05rem] text-ivory/85">{n.name}</span>
                <span className="font-display text-xl text-gold">{n.distance}</span>
              </li>
            ))}
          </ul>
        </PanelSection>
      )}
    </>
  )
}
