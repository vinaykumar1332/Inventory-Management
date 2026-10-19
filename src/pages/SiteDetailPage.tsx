import * as React from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Building2, Calendar, MapPin, PackageMinus, Store, User, Warehouse } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { useStockActions } from '@/features/stock/StockActions'
import { useBatches, useBills, useDashboard, useMovements, useSite, useStock, useTools } from '@/hooks/queries'
import { Button, Card, CardContent, CardHeader, CardTitle, Progress, Skeleton, Table, TableWrap, TBody, TD, TH, THead, TR } from '@/components/ui'
import { EmptyState, ErrorState, ExpiryCell, KpiCard, KpiGrid, PageTabs, SitePhaseBadge, SiteStatusBadge, TableSkeleton, TabsContent } from '@/components/common'
import { StockTable } from '@/features/inventory/StockTable'
import { ProductDrawer } from '@/features/inventory/ProductDrawer'
import { BillsTable } from '@/features/bills/BillsTable'
import { MovementsTable } from '@/features/stock/MovementsTable'
import { ToolDrawer, ToolsTable } from '@/features/tools/ToolComponents'
import { ReportCard } from '@/features/reports/ReportCard'
import { ConsumptionChart } from '@/features/dashboard/charts'
import { ExpiryTimeline } from '@/features/dashboard/widgets'
import { businessConfig, catalog } from '@/config'
import type { ReportFilters } from '@/types'

import { isoDaysFromNow } from '@/utils/date'
import { formatDate, formatINR, formatINRCompact, formatQty } from '@/utils/format'

const TABS = ['overview', 'stock', 'batches', 'bills', 'usage', 'tools', 'reports'] as const
type Tab = (typeof TABS)[number]
const SITE_REPORTS = catalog.reports.siteReports

function Loading() {
  return <TableSkeleton rows={6} />
}

function OverviewTab({ siteId }: { siteId: string }) {
  const { t } = useTranslation()
  const { data: site } = useSite(siteId)
  const { data: dash, isLoading } = useDashboard(siteId)
  if (!site) return <Skeleton className="h-64" />
  const info: [typeof MapPin, string, string][] = [
    [MapPin, t('sites.address'), site.address],
    [Calendar, t('sites.durationLabel'), t('sites.duration', { start: formatDate(site.startDate), end: formatDate(site.endDate) })],
    [Warehouse, t('sites.storeName'), site.storeName],
    [Building2, t('sites.companyName'), site.companyName],
  ]
  return (
    <div className="space-y-5">
      <KpiGrid className="xl:grid-cols-4">
        <KpiCard label={t('sites.stockValue')} value={formatINRCompact(site.stockValue)} icon={Store} />
        <KpiCard label={t('sites.activeMaterials')} value={site.activeMaterials} icon={PackageMinus} tone="info" />
        <KpiCard label={t('sites.expiryAlerts')} value={site.expiryAlerts} icon={Calendar} tone="warning" />
        <div className="rounded-lg border bg-surface p-3 shadow-card sm:p-4">
          <p className="text-xs font-medium text-muted-foreground sm:text-sm">{t('sites.progress')}</p>
          <p className="tabular mt-2 text-2xl font-semibold">{site.progress}%</p>
          <Progress value={site.progress} className="mt-2" label={t('sites.progress')} />
        </div>
      </KpiGrid>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t('sites.siteInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              {info.map(([Icon, label, value]) => (
                <div key={label} className="flex gap-3">
                  <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd>{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
            <h3 className="mb-2 mt-5 text-sm font-semibold">{t('sites.team')}</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" aria-hidden />
                {site.managerName} <span className="text-xs text-muted-foreground">· {t('sites.manager')}</span>
              </li>
              <li className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" aria-hidden />
                {site.storekeeperName} <span className="text-xs text-muted-foreground">· {t('sites.storekeeper')}</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('dashboard.consumption')}</CardTitle>
          </CardHeader>
          <CardContent>{isLoading || !dash ? <Skeleton className="h-64" /> : <ConsumptionChart data={dash.consumptionTrend} />}</CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.expiryTimeline')}</CardTitle>
        </CardHeader>
        <CardContent>{isLoading || !dash ? <Skeleton className="h-40" /> : <ExpiryTimeline groups={dash.expiryGroups} />}</CardContent>
      </Card>
    </div>
  )
}

function StockTab({ siteId }: { siteId: string }) {
  const { data, isLoading } = useStock(siteId)
  const [open, setOpen] = React.useState<string | null>(null)
  if (isLoading || !data) return <Loading />
  return (
    <>
      <StockTable rows={data} hideSite onOpen={(r) => setOpen(r.productId)} />
      <ProductDrawer productId={open} siteId={siteId} onClose={() => setOpen(null)} />
    </>
  )
}

function BatchesTab({ siteId }: { siteId: string }) {
  const { t } = useTranslation()
  const { data, isLoading } = useBatches(siteId)
  if (isLoading || !data) return <Loading />
  const c = (k: string) => t(`product.batchCols.${k}`)
  return (
    <TableWrap>
      <Table>
        <THead>
          <tr>
            <TH>{t('common.product')}</TH>
            <TH>{c('batchNo')}</TH>
            <TH>{c('mfg')}</TH>
            <TH>{c('expiry')}</TH>
            <TH className="text-right">{c('received')}</TH>
            <TH className="text-right">{c('available')}</TH>
            <TH className="text-right">{t('common.value')}</TH>
          </tr>
        </THead>
        <TBody>
          {data.map((b) => (
            <TR key={b.id} className={b.qtyAvailable <= 0 ? 'opacity-55' : undefined}>
              <TD>
                <p className="max-w-60 truncate font-medium">{b.productName}</p>
                <p className="text-xs text-muted-foreground">{b.brand}</p>
              </TD>
              <TD className="font-mono text-xs">{b.batchNo}</TD>
              <TD className="tabular whitespace-nowrap">{formatDate(b.mfgDate)}</TD>
              <TD>
                <ExpiryCell date={b.expiryDate} />
              </TD>
              <TD className="tabular whitespace-nowrap text-right">{formatQty(b.qtyReceived, b.unit)}</TD>
              <TD className="tabular whitespace-nowrap text-right font-semibold">{formatQty(b.qtyAvailable, b.unit)}</TD>
              <TD className="tabular whitespace-nowrap text-right">{formatINR(b.qtyAvailable * b.unitCost)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </TableWrap>
  )
}

function BillsTab({ siteId }: { siteId: string }) {
  const { t } = useTranslation()
  const { data, isLoading } = useBills()
  if (isLoading || !data) return <Loading />
  const rows = data.filter((b) => b.siteId === siteId)
  return rows.length ? <BillsTable bills={rows} hideSite /> : <EmptyState title={t('bills.empty')} />
}

function UsageTab({ siteId }: { siteId: string }) {
  const { t } = useTranslation()
  const { data, isLoading } = useMovements({ siteId, type: 'issue' })
  if (isLoading || !data) return <Loading />
  return (
    <>
      <p className="px-4 pt-4 text-sm text-muted-foreground md:px-5">{t('sites.usageHint')}</p>
      <MovementsTable rows={data} />
    </>
  )
}

function ToolsTab({ siteId }: { siteId: string }) {
  const { data, isLoading } = useTools()
  const [open, setOpen] = React.useState<string | null>(null)
  if (isLoading || !data) return <Loading />
  const rows = data.filter((x) => x.siteId === siteId)
  return (
    <>
      <ToolsTable rows={rows} hideSite onOpen={(r) => setOpen(r.id)} />
      <ToolDrawer tool={rows.find((r) => r.id === open) ?? null} onClose={() => setOpen(null)} />
    </>
  )
}

function ReportsTab({ siteId }: { siteId: string }) {
  const filters = React.useMemo<ReportFilters>(
    () => ({ from: isoDaysFromNow(-businessConfig.reports.defaultRangeDays), to: isoDaysFromNow(0), siteId, category: 'all', productId: 'all' }),
    [siteId],
  )
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {SITE_REPORTS.map((id) => (
        <ReportCard key={id} id={id} filters={filters} />
      ))}
    </div>
  )
}

export default function SiteDetailPage() {
  const { t } = useTranslation()
  const { siteId = '' } = useParams()
  const { can } = useAuth()
  const stock = useStockActions()
  const [params, setParams] = useSearchParams()
  const { data: site, isLoading, isError, refetch } = useSite(siteId)
  const visibleTabs = TABS.filter((tab) => (tab === 'bills' ? can('view_bills') : tab === 'reports' ? can('view_reports') : true))
  const tab = (visibleTabs.find((x) => x === params.get('tab')) ?? 'overview') as Tab

  if (isError) return <ErrorState onRetry={() => void refetch()} />

  return (
    <>
      <Link to="/sites" className="mb-3 inline-flex min-h-10 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> {t('sites.title')}
      </Link>
      {isLoading || !site ? (
        <Skeleton className="mb-6 h-16 w-full max-w-lg" />
      ) : (
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-navy text-white">
              <Building2 className="size-6" aria-hidden />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{site.name}</h1>
                <SiteStatusBadge status={site.status} />
                {site.phase && <SitePhaseBadge phase={site.phase} />}
              </div>
              <p className="text-sm text-muted-foreground">
                {site.city} · <span className="font-mono">{site.code}</span> · {site.storeName}
              </p>
            </div>
          </div>
          {can('issue_material') && (
            <Button onClick={() => stock.open('issue', { siteId })}>
              <PackageMinus /> {t('quick.issueMaterial')}
            </Button>
          )}
        </div>
      )}

      <PageTabs
        value={tab}
        onChange={(v) => setParams(v === 'overview' ? {} : { tab: v }, { replace: true })}
        tabs={visibleTabs.map((x) => ({ value: x, label: t(`sites.tabs.${x}`) }))}
      >
        <TabsContent value="overview">
          <OverviewTab siteId={siteId} />
        </TabsContent>
        {(['stock', 'batches', 'bills', 'usage', 'tools'] as const).map((x) => (
          <TabsContent key={x} value={x}>
            <Card className="overflow-hidden">
              {x === 'stock' && <StockTab siteId={siteId} />}
              {x === 'batches' && <BatchesTab siteId={siteId} />}
              {x === 'bills' && <BillsTab siteId={siteId} />}
              {x === 'usage' && <UsageTab siteId={siteId} />}
              {x === 'tools' && <ToolsTab siteId={siteId} />}
            </Card>
          </TabsContent>
        ))}
        <TabsContent value="reports">
          <p className="mb-4 text-sm text-muted-foreground">{t('sites.reportsHint')}</p>
          <ReportsTab siteId={siteId} />
        </TabsContent>
      </PageTabs>
    </>
  )
}
