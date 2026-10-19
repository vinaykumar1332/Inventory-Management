import { appConfig } from '@/config'

// Cookie-backed storage for the session and preferences. Nothing is written to
// localStorage or sessionStorage. The session cookie has no Max-Age, so it ends
// when the browser closes; preferences persist for a year.

const PREFIX = appConfig.demo.storagePrefix
const ONE_YEAR = 60 * 60 * 24 * 365
const MAX_COOKIE_CHARS = 3500 // browsers cap a cookie at ~4KB

export const storageKeys = {
  session: 'session',
  language: 'lang',
  theme: 'theme',
  sidebarCollapsed: 'sidebarCollapsed',
  sitesView: 'sitesView',
} as const

const SESSION_KEYS: ReadonlySet<string> = new Set([storageKeys.session])

function writeCookie(name: string, value: string, maxAge?: number) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'SameSite=Lax']
  if (maxAge !== undefined) parts.push(`Max-Age=${maxAge}`)
  if (window.location.protocol === 'https:') parts.push('Secure')
  document.cookie = parts.join('; ')
}

function readCookie(name: string): string | null {
  const entry = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`))
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null
}

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = readCookie(PREFIX + key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function writeStorage(key: string, value: unknown) {
  const encoded = encodeURIComponent(JSON.stringify(value))
  if (encoded.length > MAX_COOKIE_CHARS) return
  writeCookie(PREFIX + key, JSON.stringify(value), SESSION_KEYS.has(key) ? undefined : ONE_YEAR)
}

export function removeStorage(key: string) {
  writeCookie(PREFIX + key, '', 0)
}

/** Expires every cookie this app set. */
export function clearAppCookies() {
  for (const entry of document.cookie.split(';')) {
    const name = entry.split('=')[0]?.trim()
    if (name?.startsWith(PREFIX)) writeCookie(name, '', 0)
  }
}
