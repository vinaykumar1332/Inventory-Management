import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import { catalog } from '@/config'
import { useSites } from '@/hooks/queries'
import { cn } from '@/lib/utils'
import { inputClass, Select } from '@/components/ui'
import type { MaterialCategory } from '@/types'

/* ---------------- Search ---------------- */

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
  label,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  className?: string
  label?: string
}) {
  const { t } = useTranslation()
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        className={cn(inputClass, 'pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden')}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={t('common.clearFilters')}
          className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

/* ---------------- Segmented control ---------------- */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; icon?: React.ComponentType<{ className?: string }>; count?: number }[]
  label: string
  className?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('scrollbar-thin flex max-w-full gap-1 overflow-x-auto rounded-lg bg-muted p-1', className)}>
      {options.map((o) => {
        const active = o.value === value
        const Icon = o.icon
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors md:min-h-8',
              active ? 'bg-surface text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {Icon && <Icon className="size-4" />}
            {o.label}
            {o.count !== undefined && (
              <span className={cn('tabular rounded-full px-1.5 text-xs', active ? 'bg-primary-soft text-primary' : 'bg-surface/70')}>{o.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/* ---------------- Reusable filter selects ---------------- */

type SelectBaseProps = Omit<React.ComponentProps<typeof Select>, 'options' | 'onChange' | 'value'>

/** Site picker limited to the sites the signed-in user can access */
export function SiteSelect({
  value,
  onChange,
  includeAll = true,
  showStore,
  ...rest
}: SelectBaseProps & { value: string; onChange: (siteId: string) => void; includeAll?: boolean; showStore?: boolean }) {
  const { t } = useTranslation()
  const { data: sites } = useSites()
  return (
    <Select
      aria-label={t('common.site')}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      options={[
        ...(includeAll ? [{ value: 'all', label: t('common.allSites') }] : []),
        ...(sites ?? []).map((s) => ({ value: s.id, label: showStore ? `${s.name} · ${s.storeName}` : s.name })),
      ]}
      {...rest}
    />
  )
}

/** Material category picker (categories from catalog.json) */
export function CategorySelect({
  value,
  onChange,
  allLabel,
  ...rest
}: SelectBaseProps & { value: MaterialCategory | 'all'; onChange: (c: MaterialCategory | 'all') => void; allLabel?: string }) {
  const { t } = useTranslation()
  return (
    <Select
      aria-label={t('inventory.filterCategory')}
      value={value}
      onChange={(e) => onChange(e.target.value as MaterialCategory | 'all')}
      options={[
        { value: 'all', label: allLabel ?? t('common.all') },
        ...catalog.categories.map((c) => ({ value: c, label: t(`categories.${c}`) })),
      ]}
      {...rest}
    />
  )
}

/** Filter row placed at the top of a list card */
export function FilterBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('grid gap-2 border-b p-3 sm:grid-cols-2 md:p-4', className)}>{children}</div>
}
