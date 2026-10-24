import { navigationConfig } from '@/config'

// Route helpers: known paths, alias lookup and "did you mean" suggestions.

export const ROUTES = navigationConfig.routes

/** Every real top-level page path (used for 404 suggestions) */
export const KNOWN_PATHS = [ROUTES.home, ROUTES.login, ...navigationConfig.items.map((i) => i.to)]

function distance(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return dp[a.length][b.length]
}

/** Closest real page for a mistyped path, e.g. "/dashbrd" → "/dashboard" */
export function suggestPath(pathname: string): string | null {
  const first = '/' + (pathname.toLowerCase().split('/').filter(Boolean)[0] ?? '')
  if (first === '/') return null
  const alias = ROUTES.aliases[first]
  if (alias) return alias
  let best: { path: string; d: number } | null = null
  for (const path of KNOWN_PATHS) {
    if (path === '/') continue
    const d = distance(first, path)
    if (!best || d < best.d) best = { path, d }
  }
  return best && best.d <= Math.max(2, Math.floor(best.path.length / 3)) ? best.path : null
}

/** Full location string (path + query + hash) to return to after login */
export function locationToString(loc: { pathname: string; search?: string; hash?: string }) {
  return `${loc.pathname}${loc.search ?? ''}${loc.hash ?? ''}`
}

/**
 * Typed builders for in-app links. Use these instead of writing path strings in components,
 * so a renamed route or query key changes in one place.
 */
export const paths = {
  dashboard: '/dashboard',
  sites: '/sites',
  site: (siteId: string) => `/sites/${encodeURIComponent(siteId)}`,
  inventory: (opts?: { productId: string; siteId?: string }) => {
    if (!opts) return '/inventory'
    const query = new URLSearchParams({ product: opts.productId })
    if (opts.siteId) query.set('productSite', opts.siteId)
    return `/inventory?${query.toString()}`
  },
  bills: '/bills',
  upload: (invoiceId?: string) => (invoiceId ? `/upload?invoice=${encodeURIComponent(invoiceId)}` : '/upload'),
  movements: '/movements',
  alerts: '/alerts',
  approvals: '/approvals',
  approval: (approvalId: string) => `/approvals/${encodeURIComponent(approvalId)}`,
  tools: (toolId?: string) => (toolId ? `/tools?tool=${encodeURIComponent(toolId)}` : '/tools'),
  reports: '/reports',
  admin: '/admin',
} as const

/** Only allow in-app redirects (never an external URL) */
export function safeRedirect(target: unknown, fallback = ROUTES.afterLogin): string {
  if (typeof target !== 'string' || !target.startsWith('/') || target.startsWith('//')) return fallback
  if (target === ROUTES.login || target === ROUTES.logout) return fallback
  return target
}
