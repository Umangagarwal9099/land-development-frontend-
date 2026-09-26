import { create } from 'zustand'

/** Interaction state of the property (villa/farmhouse/commercial) screen. */
interface ViewerState {
  slug: string | null
  selectedRoomId: string | null
  /** Highest visible floor level; null shows the whole building including the roof. */
  activeLevel: number | null
  aboutOpen: boolean
  /** Camera preset request; `key` re-triggers the same preset. */
  preset: { key: number; id: string } | null
  enter: (slug: string) => void
  selectRoom: (roomId: string | null, level?: number | null) => void
  setActiveLevel: (level: number | null) => void
  setAboutOpen: (open: boolean) => void
  goToPreset: (id: string) => void
}

export const useViewerStore = create<ViewerState>((set, get) => ({
  slug: null,
  selectedRoomId: null,
  activeLevel: null,
  aboutOpen: false,
  preset: null,
  enter: (slug) => {
    if (get().slug !== slug) set({ slug, selectedRoomId: null, activeLevel: null, aboutOpen: false, preset: null })
  },
  selectRoom: (selectedRoomId, level) =>
    // Selecting an upper-floor room cuts the building away down to that floor so it is visible.
    set({
      selectedRoomId,
      ...(level === undefined ? null : { activeLevel: level }),
      ...(selectedRoomId ? { aboutOpen: false } : null),
    }),
  setActiveLevel: (activeLevel) => set({ activeLevel }),
  setAboutOpen: (aboutOpen) => set(aboutOpen ? { aboutOpen, selectedRoomId: null } : { aboutOpen }),
  goToPreset: (id) => set({ preset: { key: Date.now(), id }, selectedRoomId: null }),
}))
