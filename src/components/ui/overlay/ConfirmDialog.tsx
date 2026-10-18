import * as React from 'react'
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import { useTranslation } from 'react-i18next'
import { Button, buttonVariants } from '../button/Button'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  tone?: 'default' | 'destructive' | 'warning'
  loading?: boolean
  children?: React.ReactNode
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, onConfirm, tone = 'default', loading, children }: ConfirmDialogProps) {
  const { t } = useTranslation()
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=open]:animate-fade-in" />
        <AlertDialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface p-5 shadow-2xl data-[state=open]:animate-dialog-in">
          <AlertDialogPrimitive.Title className="text-lg font-semibold">{title}</AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description className="mt-2 text-sm text-muted-foreground">{description}</AlertDialogPrimitive.Description>
          {children}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogPrimitive.Cancel className={buttonVariants({ variant: 'secondary' })}>{t('common.cancel')}</AlertDialogPrimitive.Cancel>
            <Button variant={tone === 'default' ? 'default' : tone} disabled={loading} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}
