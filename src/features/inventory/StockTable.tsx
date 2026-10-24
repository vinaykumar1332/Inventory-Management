import { useTranslation } from 'react-i18next'
import { ArrowRightLeft, Eye, MoreHorizontal, PackageMinus, SlidersHorizontal, TriangleAlert, Undo2 } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { useStockActions } from '@/features/stock/StockActions'
import { Badge, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui'
import { ExpiryCell, ProductIcon, ResponsiveTable, StockStatusBadge, type Column } from '@/components/common'
import { catalog } from '@/config'
import type { StockRow } from '@/types'
import { formatINR, formatNumber, formatQty, unitLabel } from '@/utils/format'

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

  const siteColumn: Column<StockRow> = {
    key: 'site',
    header: t('inventory.cols.site'),
    sortValue: (r) => r.siteName,
    cell: (r) => r.siteName,
    className: 'whitespace-nowrap',
  }

  const columns: Column<StockRow>[] = [
    {
      key: 'product',
      header: t('inventory.cols.product'),
      sortValue: (r) => r.productName,
      cell: (r) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpen(r)
          }}
          className="flex items-center gap-3 text-left"
        >
          <ProductIcon icon={r.icon} size="sm" />
          <span className="min-w-0">
            <span className="block max-w-64 truncate font-medium text-foreground hover:text-primary hover:underline">{r.productName}</span>
            <span className="block font-mono text-xs text-muted-foreground">{r.sku}</span>
          </span>
        </button>
      ),
    },
    { key: 'brand', header: t('inventory.cols.brand'), sortValue: (r) => r.brand, cell: (r) => r.brand, className: 'whitespace-nowrap' },
    {
      key: 'category',
      header: t('inventory.cols.category'),
      sortValue: (r) => t(`categories.${r.category}`),
      cell: (r) => t(`categories.${r.category}`),
      className: 'hidden whitespace-nowrap text-muted-foreground 2xl:table-cell',
      hideOnMobile: true,
    },
    {
      key: 'qty',
      header: t('inventory.cols.availableQty'),
      align: 'right',
      sortValue: (r) => r.availableQty,
      cell: (r) => formatNumber(r.availableQty),
      className: 'tabular font-semibold',
    },
    { key: 'unit', header: t('inventory.cols.unit'), cell: (r) => unitLabel(r.unit), className: 'text-muted-foreground', hideOnMobile: true },
    {
      key: 'value',
      header: t('inventory.cols.stockValue'),
      align: 'right',
      sortValue: (r) => r.stockValue,
      cell: (r) => formatINR(r.stockValue),
      className: 'tabular whitespace-nowrap',
    },
    { key: 'expiry', header: t('inventory.cols.nearestExpiry'), sortValue: (r) => r.nearestExpiry, cell: (r) => <ExpiryCell date={r.nearestExpiry} /> },
    {
      key: 'lowStock',
      header: t('inventory.cols.lowStock'),
      cell: (r) =>
        r.isLow ? (
          <Badge tone="warning">{t('inventory.reorderAt', { qty: formatQty(r.reorderLevel, r.unit) })}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
      className: 'hidden 2xl:table-cell',
      hideOnMobile: true,
    },
    ...(hideSite ? [] : [siteColumn]),
    { key: 'status', header: t('inventory.cols.status'), sortValue: (r) => STATUS_ORDER[r.status], cell: (r) => <StockStatusBadge status={r.status} /> },
  ]

  return (
    <ResponsiveTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.key}
      initialSort={{ key: 'status', dir: 'asc' }}
      pageSize={pageSize}
      caption={t('inventory.title')}
      onRowClick={onOpen}
      rowActions={(r) => <RowActions row={r} onOpen={() => onOpen(r)} />}
      actionsLabel={t('inventory.cols.actions')}
    />
  )
}
