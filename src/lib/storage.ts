import { appConfig } from '@/config'

// Safe localStorage wrapper. Storage may be unavailable (private mode, blocked
// site data) so every access is guarded and the app keeps working without it.

const PREFIX = appConfig.demo.storagePrefix

export const storageKeys = {
  db: 'db.v1',
  session: 'session',
  language: 'lang',
  theme: 'theme',
  sidebarCollapsed: 'sidebarCollapsed',
  sitesView: 'sitesView',
  installDismissed: 'installDismissed',
} as const

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function writeStorage(key: string, value: unknown) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* storage unavailable — demo continues in memory */
  }
}

export function removeStorage(key: string) {
  try {
    window.localStorage.removeItem(PREFIX + key)
  } catch {
    /* ignore */
  }
}
