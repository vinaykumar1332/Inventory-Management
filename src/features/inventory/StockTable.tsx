import { useTranslation } from 'react-i18next'
import { ArrowRightLeft, Eye, MoreHorizontal, PackageMinus, SlidersHorizontal, TriangleAlert, Undo2 } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { useStockActions } from '@/features/stock/StockActions'
import { Badge, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, Table, TableWrap, TBody, TD, TH, THead, TR } from '@/components/ui'
import { ExpiryCell, Pagination, ProductIcon, SortHeader, StockStatusBadge, useTableState } from '@/components/common'
import { catalog } from '@/config'
import type { StockRow } from '@/types'
import { formatINR, formatNumber, formatQty, unitLabel } from '@/utils/format'

type SortKey = 'product' | 'brand' | 'category' | 'qty' | 'value' | 'expiry' | 'site' | 'status'

const STATUS_ORDER = Object.fromEntries(catalog.stockStatus.order.map((s, i) => [s, i])) as Record<StockRow['status'], number>

function RowActions({ row, onOpen }: { row: StockRow; onOpen: () => void }) {
  const { t } = useTranslation()
  const { can } = useAuth()
  const stock = useStockActions()
  const d = { productId: row.productId, siteId: row.siteId }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`${t('common.moreActions')}: ${row.productName}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={onOpen}>
          <Eye /> {t('inventory.viewDetails')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {can('issue_material') && (
          <DropdownMenuItem onSelect={() => stock.open('issue', d)} disabled={row.availableQty <= 0}>
            <PackageMinus /> {t('inventory.issue')}
          </DropdownMenuItem>
        )}
        {can('return_material') && (
          <DropdownMenuItem onSelect={() => stock.open('return', d)}>
            <Undo2 /> {t('inventory.return')}
          </DropdownMenuItem>
        )}
        {can('transfer_stock') && (
          <DropdownMenuItem onSelect={() => stock.open('transfer', d)} disabled={row.availableQty <= 0}>
            <ArrowRightLeft /> {t('inventory.transfer')}
          </DropdownMenuItem>
        )}
        {can('report_damage') && (
          <DropdownMenuItem onSelect={() => stock.open('damage', d)} disabled={row.availableQty <= 0}>
            <TriangleAlert /> {t('inventory.damage')}
          </DropdownMenuItem>
        )}
        {can('stock_adjustment') && (
          <DropdownMenuItem onSelect={() => stock.open('adjust', d)}>
            <SlidersHorizontal /> {t('inventory.adjust')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function StockTable({
  rows,
  onOpen,
  hideSite,
  pageSize = 10,
}: {
  rows: StockRow[]
  onOpen: (row: StockRow) => void
  hideSite?: boolean
  pageSize?: number
}) {
  const { t } = useTranslation()
  const table = useTableState<StockRow, SortKey>(
    rows,
    {
      product: (r) => r.productName,
      brand: (r) => r.brand,
      category: (r) => t(`categories.${r.category}`),
      qty: (r) => r.availableQty,
      value: (r) => r.stockValue,
      expiry: (r) => r.nearestExpiry,
      site: (r) => r.siteName,
      status: (r) => STATUS_ORDER[r.status],
    },
    { key: 'status', dir: 'asc' },
    pageSize,
  )
  const sh = { sort: table.sort, onSort: table.toggleSort }

  return (
    <>
      {/* Desktop / tablet table */}
      <TableWrap className="hidden md:block">
        <Table>
          <THead>
            <tr>
              <SortHeader label={t('inventory.cols.product')} sortKey="product" {...sh} />
              <SortHeader label={t('inventory.cols.brand')} sortKey="brand" {...sh} />
              <SortHeader label={t('inventory.cols.category')} sortKey="category" {...sh} className="hidden 2xl:table-cell" />
              <SortHeader label={t('inventory.cols.availableQty')} sortKey="qty" {...sh} className="text-right" align="right" />
              <TH>{t('inventory.cols.unit')}</TH>
              <SortHeader label={t('inventory.cols.stockValue')} sortKey="value" {...sh} className="text-right" align="right" />
              <SortHeader label={t('inventory.cols.nearestExpiry')} sortKey="expiry" {...sh} />
              <TH className="hidden 2xl:table-cell">{t('inventory.cols.lowStock')}</TH>
              {!hideSite && <SortHeader label={t('inventory.cols.site')} sortKey="site" {...sh} />}
              <SortHeader label={t('inventory.cols.status')} sortKey="status" {...sh} />
              <TH className="text-right">
                <span className="sr-only">{t('inventory.cols.actions')}</span>
              </TH>
            </tr>
          </THead>
          <TBody>
            {table.pageRows.map((r) => (
              <TR key={r.key}>
                <TD>
                  <button type="button" onClick={() => onOpen(r)} className="flex items-center gap-3 text-left">
                    <ProductIcon icon={r.icon} size="sm" />
                    <span className="min-w-0">
                      <span className="block max-w-64 truncate font-medium text-foreground hover:text-primary hover:underline">{r.productName}</span>
                      <span className="block font-mono text-xs text-muted-foreground">{r.sku}</span>
                    </span>
                  </button>
                </TD>
                <TD className="whitespace-nowrap">{r.brand}</TD>
                <TD className="hidden whitespace-nowrap text-muted-foreground 2xl:table-cell">{t(`categories.${r.category}`)}</TD>
                <TD className="tabular text-right font-semibold">{formatNumber(r.availableQty)}</TD>
                <TD className="text-muted-foreground">{unitLabel(r.unit)}</TD>
                <TD className="tabular whitespace-nowrap text-right">{formatINR(r.stockValue)}</TD>
                <TD>
                  <ExpiryCell date={r.nearestExpiry} />
                </TD>
                <TD className="hidden 2xl:table-cell">
                  {r.isLow ? (
                    <Badge tone="warning">{t('inventory.reorderAt', { qty: formatQty(r.reorderLevel, r.unit) })}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TD>
                {!hideSite && <TD className="whitespace-nowrap">{r.siteName}</TD>}
                <TD>
                  <StockStatusBadge status={r.status} />
                </TD>
                <TD className="text-right">
                  <RowActions row={r} onOpen={() => onOpen(r)} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </TableWrap>

      {/* Phone cards */}
      <ul className="divide-y md:hidden">
        {table.pageRows.map((r) => (
          <li key={r.key} className="flex gap-3 px-4 py-3">
            <ProductIcon icon={r.icon} />
            <button type="button" onClick={() => onOpen(r)} className="min-w-0 flex-1 text-left">
              <span className="block truncate font-medium">{r.productName}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {r.brand}
                {!hideSite && ` · ${r.siteName}`}
              </span>
              <span className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="tabular text-sm font-semibold">{formatQty(r.availableQty, r.unit)}</span>
                <span className="tabular text-xs text-muted-foreground">· {formatINR(r.stockValue)}</span>
              </span>
              <span className="mt-1.5 flex flex-wrap gap-1.5">
                <StockStatusBadge status={r.status} />
              </span>
            </button>
            <RowActions row={r} onOpen={() => onOpen(r)} />
          </li>
        ))}
      </ul>

      <Pagination page={table.page} pages={table.pages} total={table.total} pageSize={table.pageSize} onPage={table.setPage} />
    </>
  )
}
