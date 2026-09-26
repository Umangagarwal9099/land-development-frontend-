import type { Inset } from '../store/stage'

// The detail panel's footprint, shared by the panel (for its size) and the camera (for framing
// the subject in the space the panel leaves open). Keep the two in sync through these helpers.

const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16

/** Side panel on landscape screens wide enough for it; bottom sheet otherwise. */
export const isSidePanelLayout = () => window.innerWidth >= 900 && window.innerWidth > window.innerHeight

export const PANEL_WIDTH_REM = 31
export const PANEL_MARGIN_REM = 1.5
export const SHEET_HEIGHT_VH = 58

export const NO_INSET: Inset = { left: 0, right: 0, bottom: 0 }

export function panelInset(): Inset {
  if (isSidePanelLayout()) {
    const width = Math.min(PANEL_WIDTH_REM * rem(), window.innerWidth * 0.42) + PANEL_MARGIN_REM * rem()
    return { left: 0, right: width / window.innerWidth, bottom: 0 }
  }
  return { left: 0, right: 0, bottom: SHEET_HEIGHT_VH / 100 }
}

/** Landing screen: the title block covers the left third (or the lower half on portrait screens). */
export function heroInset(): Inset {
  return isSidePanelLayout() ? { left: 0.3, right: 0, bottom: 0.08 } : { left: 0, right: 0, bottom: 0.45 }
}
