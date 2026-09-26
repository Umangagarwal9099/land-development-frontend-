import type { AvailabilityStatus } from '../api/types'

// Shared by the 3D scene and the DOM UI; keep in sync with the tokens in index.css.
export const statusColor: Record<AvailabilityStatus, string> = {
  available: '#8fb89a',
  reserved: '#c98a5a',
  sold: '#5b616b',
}

export const GOLD = '#d4b26a'
export const GOLD_BRIGHT = '#f0d68f'
export const IVORY = '#ece6da'
