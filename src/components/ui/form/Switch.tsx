import * as React from 'react'
import { cn } from '@/lib/utils'

/** On/off control built on a native checkbox, so keyboard and screen reader behaviour comes for free. */
export const Switch = React.forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>>(
  ({ className, ...props }, ref) => (
    <label className={cn('relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center', className)}>
      <input ref={ref} type="checkbox" role="switch" className="peer sr-only" {...props} />
      <span className="absolute inset-0 rounded-full bg-input transition-colors peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-ring peer-disabled:opacity-50" aria-hidden />
      <span className="absolute left-0.5 size-5 rounded-full bg-surface shadow-sm transition-transform peer-checked:translate-x-5 motion-reduce:transition-none" aria-hidden />
    </label>
  ),
)
Switch.displayName = 'Switch'
