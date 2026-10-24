import * as React from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Table, TableWrap, TBody, TD, TH, THead, TR } from '@/components/ui'
import { cn } from '@/lib/utils'
import { Loader } from '../loader/Loader'
import { Pagination, useTableState, type SortState } from './DataTable'
import styles from './ResponsiveTable.module.css'

export interface Column<T> {
  key: string
  header: React.ReactNode
  cell: (row: T) => React.ReactNode
  /** Enables sorting on this column when provided. */
  sortValue?: (row: T) => string | number | null
  align?: 'left' | 'right'
  /** Extra classes for the header and cells on desktop, e.g. 'hidden 2xl:table-cell'. */
  className?: string
  /** Hidden in the mobile card view (e.g. secondary columns). */
  hideOnMobile?: boolean
}

export interface ResponsiveTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  /** Shown when there are no rows. */
  empty?: React.ReactNode
  loading?: boolean
  initialSort?: SortState<string>
  pageSize?: number
  caption?: string
  /** Buttons or a menu for each row. Shown as the last column on desktop and at the foot of each card. */
  rowActions?: (row: T) => React.ReactNode
  /** Screen-reader label for the actions column. */
  actionsLabel?: string
  /** Opens a row on click. Keep a real button in the first cell so keyboard users can do the same. */
  onRowClick?: (row: T) => void
}

/**
 * One table for every list. Desktop shows a sortable table; phones show each row as a card
 * with its label/value pairs. Sorting and pagination come from the shared table hooks.
 */
export function ResponsiveTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  loading,
  initialSort,
  pageSize,
  caption,
  rowActions,
  actionsLabel,
  onRowClick,
}: ResponsiveTableProps<T>) {
  const sortable = React.useMemo(
    () => Object.fromEntries(columns.filter((c) => c.sortValue).map((c) => [c.key, c.sortValue as (row: T) => string | number | null])),
    [columns],
  )
  const table = useTableState<T, string>(rows, sortable, initialSort ?? { key: columns[0]?.key ?? '', dir: 'asc' }, pageSize)

  if (loading) return <Loader compact />
  if (rows.length === 0) return <>{empty ?? null}</>

  const [title, ...rest] = columns
  const alignClass = (c: Column<T>) => cn(c.align === 'right' && 'text-right', c.className)

  return (
    <>
      <TableWrap className={styles.desktop}>
        <Table>
          {caption && <caption className="sr-only">{caption}</caption>}
          <THead>
            <tr>
              {columns.map((c) => {
                const sortableColumn = !!c.sortValue
                const active = table.sort.key === c.key
                const Icon = !sortableColumn ? null : active ? (table.sort.dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
                return (
                  <TH
                    key={c.key}
                    className={alignClass(c)}
                    aria-sort={!sortableColumn ? undefined : active ? (table.sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    {sortableColumn ? (
                      <button type="button" className={styles.sortButton} onClick={() => table.toggleSort(c.key)}>
                        {c.header}
                        {Icon && <Icon aria-hidden />}
                      </button>
                    ) : (
                      c.header
                    )}
                  </TH>
                )
              })}
              {rowActions && (
                <TH className="text-right">
                  <span className="sr-only">{actionsLabel}</span>
                </TH>
              )}
            </tr>
          </THead>
          <TBody>
            {table.pageRows.map((row) => (
              <TR
                key={rowKey(row)}
                className={cn(onRowClick && 'cursor-pointer')}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((c) => (
                  <TD key={c.key} className={alignClass(c)}>
                    {c.cell(row)}
                  </TD>
                ))}
                {rowActions && (
                  // Stop clicks on menus and buttons from also opening the row.
                  <TD className="text-right" onClick={(e) => e.stopPropagation()}>
                    {rowActions(row)}
                  </TD>
                )}
              </TR>
            ))}
          </TBody>
        </Table>
      </TableWrap>

      <ul className={styles.cards} aria-label={caption}>
        {table.pageRows.map((row) => (
          <li
            key={rowKey(row)}
            className={cn(styles.card, onRowClick && styles.clickable)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            <div className={styles.cardTitle}>{title?.cell(row)}</div>
            <dl className={styles.cardFields}>
              {rest
                .filter((c) => !c.hideOnMobile)
                .map((c) => (
                  <div key={c.key} className={styles.cardField}>
                    <dt className={styles.cardLabel}>{c.header}</dt>
                    <dd className={styles.cardValue}>{c.cell(row)}</dd>
                  </div>
                ))}
            </dl>
            {rowActions && (
              <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
                {rowActions(row)}
              </div>
            )}
          </li>
        ))}
      </ul>

      <Pagination page={table.page} pages={table.pages} total={table.total} pageSize={table.pageSize} onPage={table.setPage} />
    </>
  )
}
