import { create } from 'zustand'

export type WalkView = 'third' | 'first'

/** The nearest thing the walker can operate, as the prompt words it. */
export interface WalkPrompt {
  verb: string
  label: string
}

/** Walking mode's state, for the on-screen controls. */
interface WalkState {
  active: boolean
  view: WalkView
  prompt: WalkPrompt | null
  /** Name of the room the walker stands in. */
  room: string | null
  start: () => void
  stop: () => void
  toggleView: () => void
  setPrompt: (prompt: WalkPrompt | null) => void
  setRoom: (room: string | null) => void
}

export const useWalkStore = create<WalkState>((set) => ({
  active: false,
  view: 'third',
  prompt: null,
  room: null,
  start: () => set({ active: true, prompt: null, room: null }),
  stop: () => set({ active: false, prompt: null, room: null }),
  toggleView: () => set((s) => ({ view: s.view === 'third' ? 'first' : 'third' })),
  setPrompt: (prompt) => set({ prompt }),
  setRoom: (room) => set({ room }),
}))

/**
 * What the on-screen controls ask for, read once a frame: kept out of React so a joystick's drag
 * doesn't re-render anything. `moveX` is to the right and `moveY` forwards, each −1 … 1.
 */
export const walkInput = { moveX: 0, moveY: 0, interact: false, jump: false }
