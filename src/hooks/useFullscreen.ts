import { useCallback, useSyncExternalStore } from 'react'

const subscribe = (cb: () => void) => {
  document.addEventListener('fullscreenchange', cb)
  return () => document.removeEventListener('fullscreenchange', cb)
}

/** Presentation mode: the whole app full-screen, browser chrome hidden. */
export function useFullscreen() {
  const active = useSyncExternalStore(subscribe, () => document.fullscreenElement !== null)
  const toggle = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen?.().catch(() => undefined)
  }, [])
  return { active, toggle, supported: typeof document.documentElement.requestFullscreen === 'function' }
}
