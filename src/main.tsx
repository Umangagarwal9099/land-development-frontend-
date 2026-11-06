import { QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { queryClient } from './api/queries'
import { preloadTitleFonts } from './hooks/useFontsReady'
import './index.css'
import { router } from './routes'

void preloadTitleFonts()

// In development, the stores are reachable from the console (and from scripted checks).
if (import.meta.env.DEV)
  void Promise.all([import('./store/viewer'), import('./store/stage'), import('./store/walk'), import('./store/info')]).then(([v, s, w, i]) => {
    Object.assign(window, { __stores: { viewer: v.useViewerStore, stage: s.useStageStore, walk: w.useWalkStore, walkInput: w.walkInput, info: i.useInfoStore } })
  })

// Long-press on a touch TV would otherwise open the browser context menu.
window.addEventListener('contextmenu', (e) => e.preventDefault())

// No <StrictMode>: its dev-only double mount disposes GPU resources of models that stay on screen.
createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>,
)
