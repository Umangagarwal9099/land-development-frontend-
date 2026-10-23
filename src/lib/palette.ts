import type { AvailabilityStatus } from '../api/types'

// Shared by the 3D scene and the DOM UI; keep in sync with the tokens in index.css.
export const statusColor: Record<AvailabilityStatus, string> = {
  available: '#70ad7b',
  reserved: '#dfa04b',
  sold: '#cf625d',
}

export const GOLD = '#d4b26a'
export const GOLD_BRIGHT = '#f0d68f'
export const IVORY = '#ece6da'
