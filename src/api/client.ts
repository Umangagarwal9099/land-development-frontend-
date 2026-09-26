import { config } from '../config'
import type { Catalog, MasterPlan, Property } from './types'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

let authToken: string | null = null

/** Showroom device token or staff JWT; sent as a Bearer token on every request. */
export function setAuthToken(token: string | null) {
  authToken = token
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${config.apiBaseUrl}${path}`, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
  })
  if (!res.ok) {
    // The Go API returns errors as {"error": "..."}.
    const body = await res.json().catch(() => null)
    throw new ApiError(body?.error ?? res.statusText, res.status)
  }
  return res.json() as Promise<T>
}

// The mock module is imported lazily so it never ships in a production build that uses the API.
const mock = () => import('./mock')

export const api = {
  async getCatalog(): Promise<Catalog> {
    if (config.useMock) return (await mock()).getCatalog()
    return request('/showroom/catalog')
  },
  async getProperty(slug: string): Promise<Property> {
    if (config.useMock) return (await mock()).getProperty(slug)
    return request(`/showroom/properties/${encodeURIComponent(slug)}`)
  },
  async getMasterPlan(slug: string): Promise<MasterPlan> {
    if (config.useMock) return (await mock()).getMasterPlan(slug)
    return request(`/showroom/layouts/${encodeURIComponent(slug)}`)
  },
}
