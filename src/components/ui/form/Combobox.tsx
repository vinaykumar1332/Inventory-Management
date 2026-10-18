import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { inputClass } from './Input'

export interface ComboOption {
  value: string
  label: string
  sublabel?: string
}

interface ComboboxProps {
  id: string
  options: ComboOption[]
  /** Free text shown in the input */
  inputValue: string
  onInputChange: (text: string) => void
  onSelect: (option: ComboOption) => void
  placeholder?: string
  className?: string
  invalid?: boolean
  'aria-label'?: string
}

/** Accessible autocomplete (ARIA 1.2 combobox with listbox popup). */
export function Combobox({ id, options, inputValue, onInputChange, onSelect, placeholder, className, invalid, ...rest }: ComboboxProps) {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const [active, setActive] = React.useState(0)
  const listId = `${id}-list`

  const filtered = React.useMemo(() => {
    const q = inputValue.trim().toLowerCase()
    if (!q) return options.slice(0, 30)
    return options
      .filter((o) => `${o.label} ${o.sublabel ?? ''}`.toLowerCase().includes(q))
      .slice(0, 30)
  }, [options, inputValue])

  const choose = (o: ComboOption) => {
    onSelect(o)
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((a) => Math.min(a + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && open && filtered[active]) {
      e.preventDefault()
      choose(filtered[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className={cn('relative', className)}>
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && filtered[active] ? `${id}-opt-${active}` : undefined}
        aria-invalid={invalid || undefined}
        aria-label={rest['aria-label']}
        autoComplete="off"
        className={cn(inputClass, invalid && 'border-warning')}
        value={inputValue}
        placeholder={placeholder}
        onChange={(e) => {
          onInputChange(e.target.value)
          setOpen(true)
          setActive(0)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 top-full z-40 mt-1 max-h-64 w-full min-w-72 overflow-y-auto rounded-md border bg-surface p-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">{t('common.noResults')}</li>
          ) : (
            filtered.map((o, i) => (
              <li
                key={o.value}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={i === active}
                className={cn('cursor-pointer rounded px-3 py-2 text-sm', i === active && 'bg-primary-soft')}
                onMouseDown={(e) => {
                  e.preventDefault()
                  choose(o)
                }}
                onMouseEnter={() => setActive(i)}
              >
                <div className="font-medium">{o.label}</div>
                {o.sublabel && <div className="text-xs text-muted-foreground">{o.sublabel}</div>}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
