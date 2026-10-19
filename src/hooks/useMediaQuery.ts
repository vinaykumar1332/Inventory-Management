import * as React from 'react'
import { readStorage, writeStorage } from '@/lib/storage'

export function useMediaQuery(query: string) {
  const subscribe = React.useCallback(
    (cb: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', cb)
      return () => mql.removeEventListener('change', cb)
    },
    [query],
  )
  return React.useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false)
}

/** useState persisted to a cookie (demo preferences only). */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = React.useState<T>(() => readStorage(key, initial))
  React.useEffect(() => writeStorage(key, value), [key, value])
  return [value, setValue] as const
}
