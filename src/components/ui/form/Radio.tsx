import { cn } from '@/lib/utils'

export interface RadioOption<T extends string> {
  value: T
  label: string
  description?: string
  disabled?: boolean
}

/** Single choice from a short list. Native radio inputs inside a radiogroup. */
export function RadioGroup<T extends string>({
  name,
  value,
  onChange,
  options,
  label,
  className,
}: {
  name: string
  value: T
  onChange: (v: T) => void
  options: RadioOption<T>[]
  label: string
  className?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('grid gap-2', className)}>
      {options.map((o) => (
        <label
          key={o.value}
          className={cn(
            'flex min-h-10 cursor-pointer items-start gap-3 rounded-md border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-soft/40',
            o.disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            disabled={o.disabled}
            onChange={() => onChange(o.value)}
            className="mt-0.5 size-4 accent-primary"
          />
          <span>
            <span className="block font-medium">{o.label}</span>
            {o.description && <span className="block text-xs text-muted-foreground">{o.description}</span>}
          </span>
        </label>
      ))}
    </div>
  )
}
