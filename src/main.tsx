import { QueryClientProvider } from '@tanstack/react-query'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { queryClient } from './api/queries'
import './index.css'
import { router } from './routes'

// Long-press on a touch TV would otherwise open the browser context menu.
window.addEventListener('contextmenu', (e) => e.preventDefault())

// No <StrictMode>: its dev-only double mount disposes GPU resources of models that stay on screen.
createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>,
)
