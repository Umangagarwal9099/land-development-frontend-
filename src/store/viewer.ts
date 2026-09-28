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
  /** Room open in the immersive room viewer (the stage cuts everything else away). */
  roomViewId: string | null
  /** The room viewer's transition has finished: the room is isolated and framed. */
  roomReady: boolean
  enter: (slug: string) => void
  selectRoom: (roomId: string | null, level?: number | null) => void
  setActiveLevel: (level: number | null) => void
  setAboutOpen: (open: boolean) => void
  goToPreset: (id: string) => void
  /** Selects a room and opens it in the immersive viewer (or switches rooms inside it). */
  openRoomView: (roomId: string, level?: number | null) => void
  closeRoomView: () => void
  setRoomReady: (ready: boolean) => void
}

export const useViewerStore = create<ViewerState>((set, get) => ({
  slug: null,
  selectedRoomId: null,
  activeLevel: null,
  aboutOpen: false,
  preset: null,
  roomViewId: null,
  roomReady: false,
  enter: (slug) => {
    if (get().slug !== slug)
      set({ slug, selectedRoomId: null, activeLevel: null, aboutOpen: false, preset: null, roomViewId: null, roomReady: false })
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
  openRoomView: (roomId, level) => {
    if (get().roomViewId === roomId) return
    set({
      selectedRoomId: roomId,
      roomViewId: roomId,
      roomReady: false,
      aboutOpen: false,
      ...(level === undefined ? null : { activeLevel: level }),
    })
  },
  closeRoomView: () => set({ roomViewId: null, selectedRoomId: null, roomReady: false, activeLevel: null }),
  setRoomReady: (roomReady) => set({ roomReady }),
}))
