import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { adminApi } from '../api'
import { ConfirmDialog } from '@/components/ui'

export function ResetDemoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [busy, setBusy] = React.useState(false)

  const reset = async () => {
    setBusy(true)
    await adminApi.resetDemoData()
    await qc.invalidateQueries()
    setBusy(false)
    onOpenChange(false)
    toast.success(t('header.resetDone'))
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('header.resetDemoTitle')}
      description={t('header.resetDemoBody')}
      confirmLabel={t('header.resetDemo')}
      tone="warning"
      loading={busy}
      onConfirm={() => void reset()}
    />
  )
}
