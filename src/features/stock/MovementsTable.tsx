import { useTranslation } from 'react-i18next'
import { Table, TableWrap, TBody, TD, TH, THead, TR } from '@/components/ui'
import { MovementBadge, Pagination, SortHeader, useTableState } from '@/components/common'
import { appConfig } from '@/config'
import type { MovementRow } from '@/types'
import { formatDateTime, formatINR, formatQty } from '@/utils/format'

type SortKey = 'date' | 'type' | 'product' | 'qty' | 'value'

export function MovementsTable({ rows, pageSize = appConfig.ui.movementsPageSize }: { rows: MovementRow[]; pageSize?: number }) {
  const { t } = useTranslation()
  const table = useTableState<MovementRow, SortKey>(
    rows,
    { date: (r) => r.date, type: (r) => r.type, product: (r) => r.productName, qty: (r) => r.qty, value: (r) => r.value },
    { key: 'date', dir: 'desc' },
    pageSize,
  )
  const sh = { sort: table.sort, onSort: table.toggleSort }
  const c = (k: string) => t(`movements.cols.${k}`)
  const signed = (r: MovementRow) => `${r.direction > 0 ? '+' : '−'}${formatQty(r.qty, r.unit)}`

  return (
    <>
      <TableWrap className="hidden md:block">
        <Table>
          <THead>
            <tr>
              <SortHeader label={c('date')} sortKey="date" {...sh} />
              <SortHeader label={c('action')} sortKey="type" {...sh} />
              <SortHeader label={c('product')} sortKey="product" {...sh} />
              <SortHeader label={c('qty')} sortKey="qty" {...sh} className="text-right" align="right" />
              <TH>{c('source')}</TH>
              <TH>{c('destination')}</TH>
              <TH>{c('user')}</TH>
              <TH className="hidden xl:table-cell">{c('reason')}</TH>
              <SortHeader label={c('value')} sortKey="value" {...sh} className="text-right" align="right" />
            </tr>
          </THead>
          <TBody>
            {table.pageRows.map((r) => (
              <TR key={r.id}>
                <TD className="tabular whitespace-nowrap text-xs">{formatDateTime(r.date)}</TD>
                <TD>
                  <MovementBadge type={r.type} />
                </TD>
                <TD>
                  <p className="max-w-56 truncate font-medium">{r.productName}</p>
                  <p className="font-mono text-xs text-muted-foreground">{r.batchNo}</p>
                </TD>
                <TD className={`tabular whitespace-nowrap text-right font-semibold ${r.direction > 0 ? 'text-success' : ''}`}>{signed(r)}</TD>
                <TD className="max-w-44 truncate text-xs">{r.source}</TD>
                <TD className="max-w-44 truncate text-xs">{r.destination}</TD>
                <TD className="whitespace-nowrap text-xs">{r.userName}</TD>
                <TD className="hidden max-w-56 truncate text-xs text-muted-foreground xl:table-cell" title={r.reason}>
                  {r.reason}
                </TD>
                <TD className="tabular whitespace-nowrap text-right">{formatINR(r.value)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </TableWrap>
      <ul className="divide-y md:hidden">
        {table.pageRows.map((r) => (
          <li key={r.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <MovementBadge type={r.type} />
                <p className="mt-1 truncate font-medium">{r.productName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.source} → {r.destination}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className={`tabular font-semibold ${r.direction > 0 ? 'text-success' : ''}`}>{signed(r)}</p>
                <p className="tabular text-xs text-muted-foreground">{formatINR(r.value)}</p>
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {r.userName} · {formatDateTime(r.date)}
            </p>
          </li>
        ))}
      </ul>
      <Pagination page={table.page} pages={table.pages} total={table.total} pageSize={table.pageSize} onPage={table.setPage} />
    </>
  )
}
