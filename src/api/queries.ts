import { QueryClient, queryOptions } from '@tanstack/react-query'
import { config } from '../config'
import { api } from './client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      // Keep content for a long time so the kiosk survives a flaky connection.
      gcTime: 24 * 60 * 60_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

export const catalogQuery = () =>
  queryOptions({
    queryKey: ['catalog'],
    queryFn: api.getCatalog,
    refetchInterval: config.pollIntervalMs,
  })

export const propertyQuery = (slug: string) =>
  queryOptions({
    queryKey: ['property', slug],
    queryFn: () => api.getProperty(slug),
  })

export const masterPlanQuery = (slug: string) =>
  queryOptions({
    queryKey: ['masterplan', slug],
    queryFn: () => api.getMasterPlan(slug),
    // Plot availability changes during the day; keep the screen current.
    refetchInterval: config.pollIntervalMs,
  })
