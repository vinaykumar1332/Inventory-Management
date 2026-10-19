import { clearAppCookies } from '@/lib/storage'

/** Removes service workers, caches and this app's cookies on this device, then reloads. */
export async function clearAppData(): Promise<void> {
  try {
    const registrations = await navigator.serviceWorker?.getRegistrations()
    await Promise.all((registrations ?? []).map((r) => r.unregister()))
  } catch {
    /* service workers unsupported */
  }
  try {
    const keys = await caches.keys()
    await Promise.all(keys.map((k) => caches.delete(k)))
  } catch {
    /* Cache API unavailable */
  }
  clearAppCookies()
  window.location.reload()
}
