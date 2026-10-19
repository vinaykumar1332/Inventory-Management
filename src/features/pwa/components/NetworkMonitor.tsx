import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useNetworkState, type NetworkState } from '@/features/pwa'

const TOAST_ID = 'network-status'

/** Tells the user when the connection becomes slow, drops, or recovers. Renders nothing. */
export function NetworkMonitor() {
  const { t } = useTranslation()
  const network = useNetworkState()
  const previous = React.useRef<NetworkState>('online')

  React.useEffect(() => {
    const before = previous.current
    if (before === network) return
    previous.current = network
    if (network === 'slow') toast.warning(t('network.slowToast'), { id: TOAST_ID })
    else if (network === 'offline') toast.error(t('network.offlineToast'), { id: TOAST_ID })
    else toast.success(t('network.restoredToast'), { id: TOAST_ID })
  }, [network, t])

  return null
}
