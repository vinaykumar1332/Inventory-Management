import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

function Overlay() {
  return (
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay backdrop-blur-[2px] data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
  )
}

function CloseButton() {
  const { t } = useTranslation()
  return (
    <DialogPrimitive.Close
      className="absolute right-3 top-3 inline-flex size-10 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      aria-label={t('common.close')}
    >
      <X className="size-5" />
    </DialogPrimitive.Close>
  )
}

interface ContentProps {
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function DialogContent({ title, description, children, footer, className }: ContentProps) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl bg-surface shadow-2xl data-[state=closed]:animate-dialog-out data-[state=open]:animate-dialog-in',
          className,
        )}
      >
        <div className="border-b px-5 py-4 pr-14">
          <DialogPrimitive.Title className="text-lg font-semibold">{title}</DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">{description}</DialogPrimitive.Description>
          ) : (
            <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t px-5 py-3">{footer}</div>}
        <CloseButton />
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

interface SheetProps extends ContentProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Width on desktop */
  size?: 'md' | 'lg' | 'xl'
  headerExtra?: React.ReactNode
}

const SHEET_SIZES = { md: 'sm:max-w-md', lg: 'sm:max-w-xl', xl: 'sm:max-w-3xl' }

/** Right-side drawer. Full-width on phones with a sticky footer for primary actions. */
export function Sheet({ open, onOpenChange, title, description, children, footer, className, size = 'md', headerExtra }: SheetProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <Overlay />
        <DialogPrimitive.Content
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            ;(e.currentTarget as HTMLElement).focus()
          }}
          className={cn(
            'fixed inset-y-0 right-0 outline-none z-50 flex h-dvh w-full flex-col bg-surface shadow-2xl data-[state=closed]:animate-sheet-out data-[state=open]:animate-sheet-in',
            SHEET_SIZES[size],
            className,
          )}
        >
          <div className="border-b px-4 py-4 pr-14 md:px-5">
            <DialogPrimitive.Title className="text-lg font-semibold leading-snug">{title}</DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">{description}</DialogPrimitive.Description>
            ) : (
              <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
            )}
            {headerExtra}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5">{children}</div>
          {footer && (
            <div className="pb-safe sticky bottom-0 flex gap-2 border-t bg-surface px-4 py-3 md:px-5 [&>*]:flex-1 sm:[&>*]:flex-none sm:justify-end">
              {footer}
            </div>
          )}
          <CloseButton />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
