import { create } from 'zustand'
import { config } from '../config'

// UI-level switch only. Prices a customer must not see are withheld by the API unless the
// request carries a sales-role token — never rely on this flag alone.
interface StaffState {
  showPrices: boolean
  unlock: (pin: string) => boolean
  lock: () => void
}

export const useStaffStore = create<StaffState>((set) => ({
  showPrices: false,
  unlock: (pin) => {
    const ok = config.staffPin !== '' && pin === config.staffPin
    if (ok) set({ showPrices: true })
    return ok
  },
  lock: () => set({ showPrices: false }),
}))
