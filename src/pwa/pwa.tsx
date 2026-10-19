import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { toast } from 'sonner'

// PWA helpers: install prompt, service-worker updates and online status.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

/** Call once at startup so the browser's install event is never missed. */
export function listenForInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notify()
  })
}

export function useInstallPrompt() {
  const canInstall = React.useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => deferredPrompt !== null,
    () => false,
  )
  const install = React.useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    deferredPrompt = null
    notify()
  }, [])
  return { canInstall, install }
}

export type NetworkState = 'online' | 'slow' | 'offline'

interface NetworkConnection extends EventTarget {
  effectiveType?: string
  rtt?: number
  saveData?: boolean
}

const SLOW_TYPES = ['slow-2g', '2g', '3g']

function getConnection() {
  return (navigator as Navigator & { connection?: NetworkConnection }).connection
}

function readNetworkState(): NetworkState {
  if (!navigator.onLine) return 'offline'
  const conn = getConnection()
  const slow = !!conn && (SLOW_TYPES.includes(conn.effectiveType ?? '') || (conn.rtt ?? 0) > 600 || !!conn.saveData)
  return slow ? 'slow' : 'online'
}

/** Online, slow (2G/3G or high latency) or offline. Updates as the connection changes. */
export function useNetworkState(): NetworkState {
  return React.useSyncExternalStore(
    (cb) => {
      const conn = getConnection()
      window.addEventListener('online', cb)
      window.addEventListener('offline', cb)
      conn?.addEventListener('change', cb)
      return () => {
        window.removeEventListener('online', cb)
        window.removeEventListener('offline', cb)
        conn?.removeEventListener('change', cb)
      }
    },
    readNetworkState,
    () => 'online',
  )
}

/** Registers the service worker and shows toasts for "offline ready" / "update available". */
export function PwaUpdatePrompt() {
  const { t } = useTranslation()
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW()

  React.useEffect(() => {
    if (offlineReady) {
      toast.success(t('pwa.offlineReady'))
      setOfflineReady(false)
    }
  }, [offlineReady, setOfflineReady, t])

  React.useEffect(() => {
    if (!needRefresh) return
    toast(t('pwa.updateAvailable'), {
      duration: Infinity,
      action: { label: t('pwa.reload'), onClick: () => void updateServiceWorker(true) },
    })
  }, [needRefresh, updateServiceWorker, t])

  return null
}
