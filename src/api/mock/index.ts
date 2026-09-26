import { ApiError } from '../client'
import type { Catalog, CatalogItem, MasterPlan, Property } from '../types'
import { masterPlans } from './masterplan'
import { properties } from './properties'

// Simulated latency so loading states are visible during development.
const delay = <T>(value: T, ms = 250) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms))

const toCatalogItem = ({ id, slug, name, type, location, tagline, thumbnailUrl, startingPrice, stats }: CatalogItem): CatalogItem => ({
  id, slug, name, type, location, tagline, thumbnailUrl, startingPrice, stats,
})

// Villas and farmhouses are reached through the plots they stand on; only standalone
// buildings are listed as projects of their own.
const STANDALONE: CatalogItem['type'][] = ['commercial', 'apartment']

export function getCatalog(): Promise<Catalog> {
  const items = [...masterPlans, ...properties.filter((p) => STANDALONE.includes(p.type))]
  return delay({ version: 1, items: items.map(toCatalogItem) })
}

export function getProperty(slug: string): Promise<Property> {
  const p = properties.find((x) => x.slug === slug)
  return p ? delay(p) : Promise.reject(new ApiError('property not found', 404))
}

export function getMasterPlan(slug: string): Promise<MasterPlan> {
  const m = masterPlans.find((x) => x.slug === slug)
  return m ? delay(m) : Promise.reject(new ApiError('layout not found', 404))
}
