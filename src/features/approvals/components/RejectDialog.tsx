import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Dialog, DialogContent, Field, Textarea } from '@/components/ui'

/** Asks for a written reason, then calls onConfirm. The reason is required. */
export function RejectDialog({
  open,
  onClose,
  onConfirm,
  busy,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  busy: boolean
}) {
  const { t } = useTranslation()
  const [reason, setReason] = React.useState('')

  const close = () => {
    setReason('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent
        title={t('approvals.rejectTitle')}
        description={t('approvals.rejectBody')}
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={() => onConfirm(reason.trim())} disabled={!reason.trim() || busy}>
              {t('approvals.rejectConfirm')}
            </Button>
          </>
        }
      >
        <Field label={t('approvals.reasonLabel')} htmlFor="reject-reason" required>
          <Textarea id="reject-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        {!reason.trim() && <p className="mt-2 text-xs text-muted-foreground">{t('approvals.reasonRequired')}</p>}
      </DialogContent>
    </Dialog>
  )
}
