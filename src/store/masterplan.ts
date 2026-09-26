import { create } from 'zustand'
import type { AvailabilityStatus } from '../api/types'

export type PlanSelection = { kind: 'plot' | 'amenity' | 'road'; id: string }

export interface Box2 {
  minX: number
  minZ: number
  maxX: number
  maxZ: number
}

export const ALL_STATUSES: AvailabilityStatus[] = ['available', 'reserved', 'sold']

interface MasterPlanState {
  /** Which plan the selection belongs to; switching plans clears it. */
  slug: string | null
  selection: PlanSelection | null
  hoveredPlotId: string | null
  visibleStatuses: Set<AvailabilityStatus>
  buildPreview: boolean
  /** Camera request to frame an area (a block, the whole site…). `key` re-triggers identical requests. */
  focus: { key: number; box: Box2 } | null
  /** Project overview panel. */
  aboutOpen: boolean

  enter: (slug: string) => void
  select: (selection: PlanSelection | null) => void
  hoverPlot: (id: string | null) => void
  toggleStatus: (status: AvailabilityStatus) => void
  setBuildPreview: (on: boolean) => void
  focusBox: (box: Box2) => void
  setAboutOpen: (open: boolean) => void
}

export const useMasterPlanStore = create<MasterPlanState>((set, get) => ({
  slug: null,
  selection: null,
  hoveredPlotId: null,
  visibleStatuses: new Set(ALL_STATUSES),
  buildPreview: false,
  focus: null,
  aboutOpen: false,

  // Returning from a villa keeps the plot selected; opening a different plan starts clean.
  enter: (slug) => {
    if (get().slug === slug) return
    set({ slug, selection: null, hoveredPlotId: null, visibleStatuses: new Set(ALL_STATUSES), buildPreview: false, focus: null, aboutOpen: false })
  },
  select: (selection) => set({ selection, buildPreview: false, ...(selection ? { aboutOpen: false } : null) }),
  hoverPlot: (hoveredPlotId) => set({ hoveredPlotId }),
  toggleStatus: (status) =>
    set(({ visibleStatuses }) => {
      const next = new Set(visibleStatuses)
      if (next.has(status) && next.size > 1) next.delete(status)
      else next.add(status)
      return { visibleStatuses: next }
    }),
  setBuildPreview: (buildPreview) => set({ buildPreview }),
  focusBox: (box) => set({ focus: { key: Date.now(), box } }),
  setAboutOpen: (aboutOpen) => set(aboutOpen ? { aboutOpen, selection: null } : { aboutOpen }),
}))
