import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { clearAppData } from '@/pwa/clearAppData'
import { ConfirmDialog } from '@/components/ui'

/** Confirm-and-clear flow for offline cache and all locally stored app data. */
export function ClearAppDataDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const [busy, setBusy] = React.useState(false)

  const clear = async () => {
    setBusy(true)
    await clearAppData()
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('header.clearDataTitle')}
      description={t('header.clearDataBody')}
      confirmLabel={t('header.clearData')}
      tone="warning"
      loading={busy}
      onConfirm={() => void clear()}
    />
  )
}
