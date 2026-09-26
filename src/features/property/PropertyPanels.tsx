import { motion } from 'framer-motion'
import { FileText, Play, Rotate3d } from 'lucide-react'
import type { Property, Room } from '../../api/types'
import { Button } from '../../components/ui/Button'
import { Facts, MediaStrip, PanelSection, PanelTitle, Paragraph, PriceTag, rise } from '../../components/ui/Panel'
import { assetUrl } from '../../config'
import { formatArea, formatDimensions } from '../../lib/format'
import { useMediaStore } from '../../store/media'
import { useStaffStore } from '../../store/staff'

export function RoomDetails({ property, room }: { property: Property; room: Room }) {
  const showPrices = useStaffStore((s) => s.showPrices)
  const openMedia = useMediaStore((s) => s.open)
  const floor = property.floors.find((f) => f.id === room.floorId)
  const panoIndex = room.media.findIndex((m) => m.kind === 'pano')

  const facts: [string, string][] = []
  if (room.dimensions) facts.push(['Dimensions', formatDimensions(room.dimensions)])
  if (room.areaSqft !== undefined) facts.push(['Area', formatArea(room.areaSqft)])

  return (
    <>
      <PanelTitle eyebrow={floor?.name ?? 'Outdoors'} title={room.name} />
      <Paragraph>{room.description}</Paragraph>

      {panoIndex >= 0 && (
        <PanelSection>
          {/* The step from the model into the room itself. */}
          <Button icon={Rotate3d} iconPosition="start" onClick={() => openMedia(room.media, panoIndex)} className="w-full">
            Step inside · 360°
          </Button>
        </PanelSection>
      )}

      {facts.length > 0 && (
        <PanelSection title="Dimensions">
          <Facts items={facts} />
        </PanelSection>
      )}
      {showPrices && room.price !== undefined && <PriceTag label="Price" amount={room.price} />}

      {room.media.length > 0 && (
        <PanelSection title="Gallery">
          <MediaStrip items={room.media} />
        </PanelSection>
      )}

      {room.specs.length > 0 && (
        <PanelSection title="Finishes & specification">
          <ul className="space-y-3">
            {room.specs.map((s) => (
              <li key={s} className="flex items-baseline gap-4 text-[1.05rem] text-ivory/80">
                <span className="h-px w-4 shrink-0 translate-y-[-0.3em] bg-gold" />
                {s}
              </li>
            ))}
          </ul>
        </PanelSection>
      )}

      {room.amenities.length > 0 && (
        <PanelSection title="Features">
          <div className="flex flex-wrap gap-2">
            {room.amenities.map((a) => (
              <span key={a} className="rounded-full border border-line px-4 py-2 text-sm text-ivory/80">
                {a}
              </span>
            ))}
          </div>
        </PanelSection>
      )}
    </>
  )
}

export function PropertyOverview({ property, onPlayFilm }: { property: Property; onPlayFilm?: () => void }) {
  const showPrices = useStaffStore((s) => s.showPrices)
  return (
    <>
      <PanelTitle eyebrow="About the residence" title={property.name} />
      <motion.p variants={rise} className="mt-5 font-display text-2xl italic leading-snug text-ivory/75">
        {property.tagline}
      </motion.p>
      <Paragraph>{property.description}</Paragraph>
      {showPrices && property.startingPrice !== undefined && <PriceTag label="Starting at" amount={property.startingPrice} />}
      <PanelSection title="Highlights">
        <Facts items={Object.entries(property.highlights)} />
      </PanelSection>
      <PanelSection title="Gallery">
        <MediaStrip items={property.media} />
      </PanelSection>
      {(onPlayFilm || property.brochureUrl) && (
        <PanelSection className="flex flex-col gap-3">
          {onPlayFilm && (
            <Button variant="ghost" icon={Play} iconPosition="start" onClick={onPlayFilm} className="w-full">
              Watch the film
            </Button>
          )}
          {property.brochureUrl && (
            <Button
              variant="ghost"
              icon={FileText}
              iconPosition="start"
              className="w-full"
              onClick={() => useMediaStore.getState().open([{ id: 'brochure', kind: 'pdf', title: `${property.name} — brochure`, url: assetUrl(property.brochureUrl!) }])}
            >
              Open the brochure
            </Button>
          )}
        </PanelSection>
      )}
    </>
  )
}
