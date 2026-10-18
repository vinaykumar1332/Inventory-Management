import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ArrowRightLeft, Download, FileText, PackageMinus, Undo2 } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { useStockActions } from '@/features/stock/StockActions'
import { useProduct } from '@/hooks/queries'
import { Badge, Button, Sheet, Skeleton, Table, TableWrap, Tabs, TabsContent, TabsList, TabsTrigger, TBody, TD, TH, THead, TR } from '@/components/ui'
import { EmptyState, ErrorState, ExpiryCell, MovementBadge, ProductIcon } from '@/components/common'
import { TINT_CLASSES } from '@/config/tones'
import { cn } from '@/lib/utils'
import type { ProductDetail } from '@/types'
import { fefoSort, round2 } from '@/utils/calc'
import { formatDate, formatDateTime, formatFileSize, formatINR, formatNumber, formatQty, unitLabel } from '@/utils/format'

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-2.5 text-sm last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}

export function ProductDrawer({
  productId,
  siteId = 'all',
  onClose,
}: {
  productId: string | null
  siteId?: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { can } = useAuth()
  const stock = useStockActions()
  const { data, isLoading, isError, refetch } = useProduct(productId, siteId)
  const p = data?.product
  const singleSite = siteId !== 'all' ? siteId : data?.batches.find((b) => b.qtyAvailable > 0)?.siteId

  return (
    <Sheet
      open={!!productId}
      onOpenChange={(o) => !o && onClose()}
      size="xl"
      title={p ? p.name : t('common.loading')}
      description={p ? `${p.brand} · ${t('product.sku')} ${p.sku}` : undefined}
      footer={
        p && (
          <>
            {can('return_material') && (
              <Button variant="secondary" onClick={() => stock.open('return', { productId: p.id, siteId: singleSite })}>
                <Undo2 /> {t('inventory.return')}
              </Button>
            )}
            {can('transfer_stock') && (
              <Button variant="secondary" onClick={() => stock.open('transfer', { productId: p.id, siteId: singleSite })}>
                <ArrowRightLeft /> {t('inventory.transfer')}
              </Button>
            )}
            {can('issue_material') && (
              <Button onClick={() => stock.open('issue', { productId: p.id, siteId: singleSite })}>
                <PackageMinus /> {t('inventory.issue')}
              </Button>
            )}
          </>
        )
      }
    >
      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : isLoading || !data || !p ? (
        <div className="space-y-4">
          <div className="flex gap-4">
            <Skeleton className="size-14" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
          <Skeleton className="h-10" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <ProductDetailBody data={data} />
      )}
    </Sheet>
  )
}

function ProductDetailBody({ data }: { data: ProductDetail }) {
  const { t } = useTranslation()
  const { product: p, batches, movements } = data
  const fefo = fefoSort(batches)[0]
  const issues = movements.filter((m) => m.type === 'issue')
  const totalIssued = round2(issues.reduce((s, m) => s + m.qty, 0))
  const area = round2(issues.reduce((s, m) => s + (m.areaM2 ?? 0), 0))
  const issuedWithArea = round2(issues.filter((m) => m.areaM2).reduce((s, m) => s + m.qty, 0))
  const unit = unitLabel(p.baseUnit)

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <ProductIcon icon={p.icon} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="primary">{t(`categories.${p.category}`)}</Badge>
            {data.totalAvailable < p.reorderLevel && <Badge tone="warning">{t('stockStatus.low')}</Badge>}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground">{t('product.available')}</p>
          <p className="tabular mt-1 text-lg font-semibold">{formatQty(data.totalAvailable, p.baseUnit)}</p>
        </div>
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground">{t('inventory.cols.stockValue')}</p>
          <p className="tabular mt-1 text-lg font-semibold">{formatINR(data.totalValue)}</p>
        </div>
        <div className="col-span-2 rounded-lg bg-muted p-3 sm:col-span-1">
          <p className="text-xs text-muted-foreground">{t('product.reorderLevel')}</p>
          <p className="tabular mt-1 text-lg font-semibold">{formatQty(p.reorderLevel, p.baseUnit)}</p>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t('product.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="batches">
            {t('product.tabs.batches')} <span className="tabular text-xs text-muted-foreground">{batches.length}</span>
          </TabsTrigger>
          <TabsTrigger value="movements">{t('product.tabs.movements')}</TabsTrigger>
          <TabsTrigger value="usage">{t('product.tabs.usage')}</TabsTrigger>
          <TabsTrigger value="documents">{t('product.tabs.documents')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <div className="grid gap-x-8 md:grid-cols-2">
            <dl>
              <InfoRow label={t('product.sku')} value={<span className="font-mono">{p.sku}</span>} />
              <InfoRow label={t('product.manufacturer')} value={p.manufacturer} />
              <InfoRow label={t('product.category')} value={t(`categories.${p.category}`)} />
              <InfoRow label={t('product.packSize')} value={`${formatNumber(p.packSize)} ${unit} / ${unitLabel(p.packUnit)}`} />
              <InfoRow label={t('product.baseUnit')} value={t(`unitNames.${p.baseUnit}`)} />
            </dl>
            <dl>
              <InfoRow
                label={t('product.shelfLife')}
                value={p.shelfLifeMonths ? t('product.shelfLifeMonths', { count: p.shelfLifeMonths }) : t('product.noShelfLife')}
              />
              <InfoRow
                label={t('product.coverage')}
                value={p.coveragePerM2 ? t('product.coverageValue', { value: p.coveragePerM2, unit }) : '—'}
              />
              <InfoRow label={t('product.coats')} value={p.recommendedCoats ?? '—'} />
              <InfoRow label={t('product.costPerUnit', { unit })} value={formatINR(p.costPerBaseUnit, true)} />
              <InfoRow label={t('product.reorderLevel')} value={formatQty(p.reorderLevel, p.baseUnit)} />
            </dl>
          </div>
          <h3 className="mb-2 mt-5 text-sm font-semibold">{t('product.latestActivity')}</h3>
          {movements.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('product.noMovements')}</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {movements.slice(0, 4).map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <MovementBadge type={m.type} />
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {m.source} → {m.destination}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tabular font-medium">{formatQty(m.qty, p.baseUnit)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(m.date)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="batches" className="pt-4">
          {batches.length === 0 ? (
            <EmptyState title={t('product.noBatches')} />
          ) : (
            <TableWrap className="rounded-lg border">
              <Table>
                <THead>
                  <tr>
                    <TH>{t('product.batchCols.batchNo')}</TH>
                    <TH>{t('product.batchCols.site')}</TH>
                    <TH>{t('product.batchCols.mfg')}</TH>
                    <TH>{t('product.batchCols.expiry')}</TH>
                    <TH className="text-right">{t('product.batchCols.received')}</TH>
                    <TH className="text-right">{t('product.batchCols.available')}</TH>
                    <TH className="text-right">{t('product.batchCols.unitCost')}</TH>
                  </tr>
                </THead>
                <TBody>
                  {batches.map((b) => (
                    <TR key={b.id} className={b.qtyAvailable <= 0 ? 'opacity-55' : undefined}>
                      <TD>
                        <span className="font-mono text-xs">{b.batchNo}</span>
                        {fefo?.id === b.id && (
                          <Badge tone="primary" className="ml-1.5">
                            {t('product.suggested')}
                          </Badge>
                        )}
                        {b.expiryOverride && (
                          <Badge tone="warning" className="ml-1.5">
                            {t('product.override')}
                          </Badge>
                        )}
                      </TD>
                      <TD className="whitespace-nowrap">{b.siteName}</TD>
                      <TD className="tabular whitespace-nowrap">{formatDate(b.mfgDate)}</TD>
                      <TD>
                        <ExpiryCell date={b.expiryDate} />
                      </TD>
                      <TD className="tabular whitespace-nowrap text-right">{formatQty(b.qtyReceived, p.baseUnit)}</TD>
                      <TD className="tabular whitespace-nowrap text-right font-semibold">{formatQty(b.qtyAvailable, p.baseUnit)}</TD>
                      <TD className="tabular whitespace-nowrap text-right">{formatINR(b.unitCost, true)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
          )}
        </TabsContent>

        <TabsContent value="movements" className="pt-4">
          {movements.length === 0 ? (
            <EmptyState title={t('product.noMovements')} />
          ) : (
            <ul className="divide-y rounded-lg border">
              {movements.map((m) => (
                <li key={m.id} className="grid gap-1 px-3 py-3 text-sm sm:grid-cols-[1fr_auto]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <MovementBadge type={m.type} />
                      <span className="font-mono text-xs text-muted-foreground">{m.batchNo}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {m.source} → {m.destination}
                    </p>
                    {m.reason && <p className="mt-0.5 text-xs">{m.reason}</p>}
                  </div>
                  <div className="sm:text-right">
                    <p className="tabular font-semibold">
                      {m.direction > 0 ? '+' : '−'}
                      {formatQty(m.qty, p.baseUnit)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(m.date)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="usage" className="space-y-4 pt-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{t('product.totalIssued')}</p>
              <p className="tabular mt-1 text-lg font-semibold">{formatQty(totalIssued, p.baseUnit)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{t('product.totalArea')}</p>
              <p className="tabular mt-1 text-lg font-semibold">{p.coveragePerM2 ? `${formatNumber(area)} m²` : '—'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{t('product.avgPerM2')}</p>
              <p className="tabular mt-1 text-lg font-semibold">
                {p.coveragePerM2 && area > 0 ? `${formatNumber(round2(issuedWithArea / area))} ${unit}/m²` : '—'}
              </p>
              {p.coveragePerM2 && p.recommendedCoats && (
                <p className="text-xs text-muted-foreground">
                  {t('product.vsStandard', { value: `${round2(p.coveragePerM2 * p.recommendedCoats)} ${unit}/m²` })}
                </p>
              )}
            </div>
          </div>
          {p.coveragePerM2 && p.recommendedCoats ? (
            <div className="rounded-lg border border-primary/25 bg-primary-soft/50 p-4">
              <p className="text-sm font-semibold text-primary">{t('product.coverageCalc')}</p>
              <p className="text-xs text-muted-foreground">{t('product.coverageCalcHint')}</p>
              <p className="mt-3 text-sm">{t('product.areaCoverable')}</p>
              <p className="tabular text-2xl font-semibold">
                {t('product.areaCoverableValue', {
                  area: formatNumber(Math.floor(data.totalAvailable / (p.coveragePerM2 * p.recommendedCoats * 1.1))),
                  coats: p.recommendedCoats,
                })}
              </p>
            </div>
          ) : (
            <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">{t('product.noCoverage')}</p>
          )}
        </TabsContent>

        <TabsContent value="documents" className="pt-4">
          {p.documents.length === 0 ? (
            <EmptyState icon={FileText} title={t('product.noDocuments')} />
          ) : (
            <ul className="divide-y rounded-lg border">
              {p.documents.map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-3 py-3">
                  <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-md', TINT_CLASSES.red)}>
                    <FileText className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t(`product.docKinds.${d.kind}`)} · {formatFileSize(d.sizeKb)}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" aria-label={`${t('common.download')} ${d.name}`} onClick={() => toast.info(t('product.docDemo'))}>
                    <Download />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
