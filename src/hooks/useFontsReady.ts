import { useEffect, useState } from 'react'

/** The faces the landing title card sets: the display serif (title, tagline) and the sans. */
const FACES = ['500 1em "Cormorant Garamond"', 'italic 400 1em "Cormorant Garamond"', '400 1em "Cormorant Garamond"', '600 1em "Manrope Variable"']
/** The fonts ship with the app, so this is a ceiling for a slow device, not an expected wait. */
const MAX_WAIT_MS = 1500

let loaded = false
let loading: Promise<unknown> | null = null

/**
 * Starts fetching the title fonts. Called at boot, so they download alongside the app's code and
 * data instead of after the title card first asks for them.
 */
export function preloadTitleFonts() {
  loading ??= Promise.all(FACES.map((f) => document.fonts.load(f, 'Kallakal'))).then(
    () => (loaded = true),
    () => (loaded = true),
  )
  return loading
}

/**
 * Whether the title fonts are ready. The faces are `font-display: swap`, so text set before they
 * load appears in the fallback serif and changes shape mid-animation when they arrive; the title,
 * rising word by word, then looks as if it came in pieces. Waiting for them (briefly) avoids that.
 */
export function useFontsReady() {
  const [ready, setReady] = useState(loaded)
  useEffect(() => {
    if (loaded) return
    let live = true
    const done = () => {
      loaded = true
      if (live) setReady(true)
    }
    const timer = window.setTimeout(done, MAX_WAIT_MS)
    void preloadTitleFonts().then(done)
    return () => {
      live = false
      window.clearTimeout(timer)
    }
  }, [])
  return ready
}
