import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { toast } from 'sonner'

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
