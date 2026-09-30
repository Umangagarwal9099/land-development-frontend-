import type { AvailabilityStatus, Dimensions, ListingType } from '../api/types'

/** ₹3.25 Cr / ₹95 L style used by Indian real-estate sales teams. */
export function formatPrice(rupees: number): string {
  if (rupees >= 1e7) return `₹${trim(rupees / 1e7)} Cr`
  if (rupees >= 1e5) return `₹${trim(rupees / 1e5)} L`
  return `₹${rupees.toLocaleString('en-IN')}`
}

const trim = (n: number) => n.toFixed(2).replace(/\.?0+$/, '')

export const formatArea = (sqft: number) => `${sqft.toLocaleString('en-IN')} sq ft`

export const formatDimensions = (d: Dimensions) => `${d.length} × ${d.width} ${d.unit}`

export const listingTypeLabel: Record<ListingType, string> = {
  villa: 'Villa',
  apartment: 'Apartment',
  farmhouse: 'Farmhouse',
  commercial: 'Commercial',
  plots: 'Plots',
  clubhouse: 'Clubhouse',
}

export const statusLabel: Record<AvailabilityStatus, string> = {
  available: 'Available',
  reserved: 'Reserved',
  sold: 'Sold',
}
