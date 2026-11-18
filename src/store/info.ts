import type { Object3D } from 'three'
import { create } from 'zustand'

/** What a piece of equipment (or a fitting) says about itself when it is tapped. */
export interface EquipmentInfo {
  title: string
  /** What kind of thing it is, as a catalogue would class it ("Diagnostic imaging · MRI"). */
  kind?: string
  /** Where it stands ("Third Floor · MRI Suite"). */
  place?: string
  body: string
  specs?: string[]
  /** A detailed model to turn and zoom in the card, built when the card opens. */
  inspect?: () => Object3D
  /** Options to pick from (a shoe's sizes), some perhaps unavailable. */
  choices?: { label: string; options: string[]; unavailable?: string[] }
  /** Colourways to show it in: picking one recolours the piece in the shop (and in the card). */
  variants?: { label: string; options: { name: string; swatch: string }[]; current: () => number; pick: (i: number) => void }
  /** What can be done with it (add to bag, pay): runs with the picked option, returns what to say. */
  action?: { label: string; run: (choice: string | null) => string }
}

interface InfoState {
  item: EquipmentInfo | null
  show: (item: EquipmentInfo | null) => void
}

/** The information card for the equipment last tapped, shown over the stage until dismissed. */
export const useInfoStore = create<InfoState>((set) => ({
  item: null,
  show: (item) => set({ item }),
}))
