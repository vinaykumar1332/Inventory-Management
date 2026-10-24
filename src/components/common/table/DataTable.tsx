import * as React from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { appConfig } from '@/config'
import { cn } from '@/lib/utils'
import { Button, TH } from '@/components/ui'

export type SortDir = 'asc' | 'desc'
export interface SortState<K extends string> {
  key: K
  dir: SortDir
}

/** Client-side sort + pagination for mock data tables. */
export function useTableState<T, K extends string>(
  rows: T[],
  accessors: Record<K, (row: T) => string | number | null>,
  initial: SortState<K>,
  pageSize = appConfig.ui.tablePageSize,
) {
  const [sort, setSort] = React.useState<SortState<K>>(initial)
  const [page, setPage] = React.useState(1)

  const sorted = React.useMemo(() => {
    const get = accessors[sort.key]
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const va = get(a)
      const vb = get(b)
      if (va === vb) return 0
      if (va === null) return 1
      if (vb === null) return -1
      return (typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb))) * dir
    })
    // accessors are static per table
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sort])

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const current = Math.min(page, pages)
  const pageRows = sorted.slice((current - 1) * pageSize, current * pageSize)

  React.useEffect(() => setPage(1), [rows.length])

  const toggleSort = (key: K) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))

  return { sort, toggleSort, page: current, pages, setPage, pageRows, total: sorted.length, pageSize, sorted }
}

export function SortHeader<K extends string>({
  label,
  sortKey,
  sort,
  onSort,
  className,
  align = 'left',
}: {
  label: string
  sortKey: K
  sort: SortState<K>
  onSort: (key: K) => void
  className?: string
  align?: 'left' | 'right'
}) {
  const { t } = useTranslation()
  const active = sort.key === sortKey
  const Icon = active ? (sort.dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
  return (
    <TH className={className} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          '-mx-1 inline-flex items-center gap-1 rounded px-1 py-1 uppercase hover:text-foreground',
          align === 'right' && 'flex-row-reverse',
          active && 'text-foreground',
        )}
        aria-label={t('common.sortBy', { column: label })}
      >
        {label}
        <Icon className={cn('size-3.5', !active && 'opacity-40')} aria-hidden />
      </button>
    </TH>
  )
}

export function Pagination({
  page,
  pages,
  total,
  pageSize,
  onPage,
}: {
  page: number
  pages: number
  total: number
  pageSize: number
  onPage: (p: number) => void
}) {
  const { t } = useTranslation()
  if (total === 0) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  return (
    <nav className="flex items-center justify-between gap-3 border-t px-4 py-3 text-sm" aria-label={t('common.page', { page, pages })}>
      <p className="tabular text-muted-foreground">{t('common.showing', { from, to, total })}</p>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label={t('common.previous')}>
          <ChevronLeft />
        </Button>
        <span className="tabular px-2 text-muted-foreground">
          {page} / {pages}
        </span>
        <Button variant="ghost" size="icon" onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label={t('common.next')}>
          <ChevronRight />
        </Button>
      </div>
    </nav>
  )
}

