import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

export function Label({ className, ...props }: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>) {
  return <LabelPrimitive.Root className={cn('text-sm font-medium text-foreground', className)} {...props} />
}

interface FieldProps {
  label: string
  htmlFor: string
  error?: string
  hint?: React.ReactNode
  required?: boolean
  className?: string
  children: React.ReactNode
}

/** Label + control + hint/error with correct aria wiring. */
export function Field({ label, htmlFor, error, hint, required, className, children }: FieldProps) {
  const { t } = useTranslation()
  const describedBy = error ? `${htmlFor}-error` : hint ? `${htmlFor}-hint` : undefined
  const control = React.isValidElement<{ 'aria-describedby'?: string; 'aria-invalid'?: boolean }>(children)
    ? React.cloneElement(children, { 'aria-describedby': describedBy, 'aria-invalid': !!error || undefined })
    : children
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden>
            *
          </span>
        )}
        {required && <span className="sr-only"> ({t('common.required')})</span>}
      </Label>
      {control}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/** Name used by the design brief. Same component as Field. */
export const FormField = Field
