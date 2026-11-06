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
