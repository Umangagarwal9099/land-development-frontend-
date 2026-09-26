const env = import.meta.env

export const config = {
  useMock: env.VITE_USE_MOCK !== 'false',
  apiBaseUrl: (env.VITE_API_BASE_URL ?? '').replace(/\/$/, ''),
  assetBaseUrl: (env.VITE_ASSET_BASE_URL ?? '').replace(/\/$/, ''),
  router: env.VITE_ROUTER === 'hash' ? 'hash' : 'browser',
  brandName: env.VITE_BRAND_NAME || 'Property Showroom',
  staffPin: env.VITE_STAFF_PIN || '',
  idleResetSeconds: Number(env.VITE_IDLE_RESET_SECONDS ?? 180),
  /** How often the kiosk checks for newly published content / plot status changes. */
  pollIntervalMs: 30_000,
} as const

/** Resolves an asset key from the API against the public R2 domain. */
export function assetUrl(pathOrUrl: string): string {
  if (/^(https?:|data:|blob:)/.test(pathOrUrl)) return pathOrUrl
  return `${config.assetBaseUrl}/${pathOrUrl.replace(/^\//, '')}`
}
