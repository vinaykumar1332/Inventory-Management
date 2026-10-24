import { useTranslation } from 'react-i18next'
import { MovementBadge, ResponsiveTable, type Column } from '@/components/common'
import { appConfig } from '@/config'
import type { MovementRow } from '@/types'
import { formatDateTime, formatINR, formatQty } from '@/utils/format'

export function MovementsTable({ rows, pageSize = appConfig.ui.movementsPageSize }: { rows: MovementRow[]; pageSize?: number }) {
  const { t } = useTranslation()
  const c = (k: string) => t(`movements.cols.${k}`)
  const signed = (r: MovementRow) => `${r.direction > 0 ? '+' : '−'}${formatQty(r.qty, r.unit)}`

  const columns: Column<MovementRow>[] = [
    { key: 'date', header: c('date'), sortValue: (r) => r.date, cell: (r) => formatDateTime(r.date), className: 'tabular whitespace-nowrap text-xs' },
    { key: 'type', header: c('action'), sortValue: (r) => r.type, cell: (r) => <MovementBadge type={r.type} /> },
    {
      key: 'product',
      header: c('product'),
      sortValue: (r) => r.productName,
      cell: (r) => (
        <>
          <p className="max-w-56 truncate font-medium">{r.productName}</p>
          <p className="font-mono text-xs text-muted-foreground">{r.batchNo}</p>
        </>
      ),
    },
    {
      key: 'qty',
      header: c('qty'),
      align: 'right',
      sortValue: (r) => r.qty,
      cell: (r) => <span className={r.direction > 0 ? 'text-success' : undefined}>{signed(r)}</span>,
      className: 'tabular whitespace-nowrap font-semibold',
    },
    { key: 'source', header: c('source'), cell: (r) => <span className="max-w-44 truncate text-xs">{r.source}</span> },
    { key: 'destination', header: c('destination'), cell: (r) => <span className="max-w-44 truncate text-xs">{r.destination}</span> },
    { key: 'user', header: c('user'), cell: (r) => r.userName, className: 'whitespace-nowrap text-xs' },
    {
      key: 'reason',
      header: c('reason'),
      cell: (r) => <span title={r.reason}>{r.reason}</span>,
      className: 'hidden max-w-56 truncate text-xs text-muted-foreground xl:table-cell',
      hideOnMobile: true,
    },
    {
      key: 'value',
      header: c('value'),
      align: 'right',
      sortValue: (r) => r.value,
      cell: (r) => formatINR(r.value),
      className: 'tabular whitespace-nowrap',
    },
  ]

  return (
    <ResponsiveTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      initialSort={{ key: 'date', dir: 'desc' }}
      pageSize={pageSize}
      caption={t('movements.title')}
    />
  )
}
