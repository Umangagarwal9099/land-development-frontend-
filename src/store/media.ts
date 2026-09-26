import { create } from 'zustand'
import type { MediaItem } from '../api/types'

/** The full-screen media viewer is global so any panel, dock or hotspot can open it. */
interface MediaState {
  items: MediaItem[]
  index: number | null
  open: (items: MediaItem[], index?: number) => void
  step: (delta: number) => void
  goTo: (index: number) => void
  close: () => void
}

export const useMediaStore = create<MediaState>((set) => ({
  items: [],
  index: null,
  open: (items, index = 0) => items.length > 0 && set({ items, index }),
  step: (delta) =>
    set(({ items, index }) => (index === null ? {} : { index: (index + delta + items.length) % items.length })),
  goTo: (index) => set({ index }),
  close: () => set({ index: null }),
}))
