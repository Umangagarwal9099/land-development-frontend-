import { Building2, Castle, Dumbbell, Factory, Trees, Waves, Sprout, type LucideIcon } from 'lucide-react'
import type { Amenity } from '../api/types'

export const amenityIcon: Record<Amenity['kind'], LucideIcon> = {
  clubhouse: Building2,
  pool: Waves,
  park: Trees,
  sports: Dumbbell,
  entrance: Castle,
  garden: Sprout,
  utility: Factory,
}

export const amenityKindLabel: Record<Amenity['kind'], string> = {
  clubhouse: 'Clubhouse',
  pool: 'Aquatics',
  park: 'Parkland',
  sports: 'Sport',
  entrance: 'Arrival',
  garden: 'Gardens',
  utility: 'Utilities',
}
