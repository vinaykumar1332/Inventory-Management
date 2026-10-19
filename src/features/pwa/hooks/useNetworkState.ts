import * as React from 'react'

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
