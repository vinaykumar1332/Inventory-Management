import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { inputClass } from './Input'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface NativeSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[]
  placeholder?: string
}

/** Native select: best keyboard, screen reader and mobile picker support. */
export const Select = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, options, placeholder, ...props }, ref) => (
    <div className={cn('relative', className)}>
      <select ref={ref} className={cn(inputClass, 'appearance-none truncate pr-9')} {...props}>
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  ),
)
Select.displayName = 'Select'
