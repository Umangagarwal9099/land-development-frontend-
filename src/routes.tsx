import { createBrowserRouter, createHashRouter, type RouteObject } from 'react-router'
import { AppShell } from './components/AppShell'
import { ErrorState } from './components/ui/Feedback'
import { config } from './config'
import LandingPage from './features/landing/LandingPage'
import MasterPlanPage from './features/masterplan/MasterPlanPage'
import PropertyPage from './features/property/PropertyPage'

// Screens are light DOM overlays; three.js and the scenes load once, in the lazy <Stage> chunk.
const routes: RouteObject[] = [
  {
    Component: AppShell,
    children: [
      { index: true, Component: LandingPage },
      { path: 'layout/:slug', Component: MasterPlanPage },
      { path: 'property/:slug', Component: PropertyPage },
      { path: '*', element: <ErrorState title="This page doesn't exist" detail="The link may be out of date." /> },
    ],
  },
]

export const router = config.router === 'hash' ? createHashRouter(routes) : createBrowserRouter(routes)
