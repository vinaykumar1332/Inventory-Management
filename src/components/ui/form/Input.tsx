import * as React from 'react'
import { cn } from '@/lib/utils'

export const inputClass =
  'flex h-11 w-full rounded-md border border-input bg-surface px-3 text-base text-foreground shadow-xs placeholder:text-muted-foreground/80 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70 aria-[invalid=true]:border-danger md:h-10 md:text-sm'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => (
    <input ref={ref} type={type} className={cn(inputClass, className)} {...props} />
  ),
)
Input.displayName = 'Input'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(inputClass, 'h-auto min-h-20 py-2', className)} {...props} />
  ),
)
Textarea.displayName = 'Textarea'
