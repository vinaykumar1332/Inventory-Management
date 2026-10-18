import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { m } from 'motion/react'
import { dashboardConfig, type KpiId } from '@/config'
import { getIcon } from '@/config/icons'
import { useUser } from '@/features/auth/AuthProvider'
import { useDashboard, useSites } from '@/hooks/queries'
import { Card, Skeleton } from '@/components/ui'
import { ErrorState, KpiCard, KpiGrid, KpiSkeleton, PageHeader, SectionCard, SiteSelect } from '@/components/common'
import { CategoryDonut, ConsumptionChart, StockBySiteChart } from '@/features/dashboard/charts'
import { ActivityTimeline, ExpiryTimeline, QuickActions, TopMaterials } from '@/features/dashboard/widgets'
import type { DashboardKpis } from '@/types'
import { formatINRCompact, formatNumber, unitLabel } from '@/utils/format'

type Translate = ReturnType<typeof useTranslation>['t']

/** Value + sub-text for each KPI id configured in dashboard.json */
function kpiContent(id: KpiId, k: DashboardKpis, t: Translate): { value: React.ReactNode; sub: React.ReactNode } {
  switch (id) {
    case 'totalStockValue':
      return { value: formatINRCompact(k.totalStockValue), sub: t('kpi.batchesActive', { count: k.activeBatches }) }
    case 'availableQty': {
      const [first, ...rest] = dashboardConfig.quantityUnitsOrder.filter((u) => k.qtyByUnit[u])
      const fmt = (u: typeof first) => `${formatNumber(Math.round(k.qtyByUnit[u] ?? 0))} ${unitLabel(u)}`
      return { value: first ? fmt(first) : '—', sub: rest.map(fmt).join(' · ') }
    }
    case 'expiringIn30':
      return { value: k.expiringIn30, sub: t('kpi.needsAction') }
    case 'expiredBatches':
      return { value: k.expiredBatches, sub: t('kpi.needsAction') }
    case 'lowStockItems':
      return { value: k.lowStockItems, sub: t('kpi.belowReorder') }
    case 'toolsIssued':
      return { value: k.toolsIssued, sub: t('kpi.ofTotal', { total: k.toolsTotal }) }
  }
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const user = useUser()
  const { data: sites } = useSites()
  const [siteId, setSiteId] = React.useState('all')
  const { data, isLoading, isError, refetch } = useDashboard(siteId)
  const seesAll = user.role === 'super_admin' || user.role === 'admin'
  const { kpis, widgets, limits } = dashboardConfig

  return (
    <>
      <PageHeader
        title={t('dashboard.greeting', { name: user.name.split(' ')[0] })}
        subtitle={seesAll ? t('dashboard.subtitleAll') : t('dashboard.subtitleAssigned')}
        actions={(sites?.length ?? 0) > 1 && <SiteSelect className="w-full sm:w-60" value={siteId} onChange={setSiteId} />}
      />

      {isError ? (
        <Card>
          <ErrorState onRetry={() => void refetch()} />
        </Card>
      ) : (
        <div className="space-y-5">
          <KpiGrid className="xl:grid-cols-3 2xl:grid-cols-6">
            {isLoading || !data
              ? kpis.map((k) => <KpiSkeleton key={k.id} />)
              : kpis.map((k) => {
                  const content = kpiContent(k.id, data.kpis, t)
                  return <KpiCard key={k.id} label={t(k.labelKey)} icon={getIcon(k.icon)} tone={k.tone} to={k.to} {...content} />
                })}
          </KpiGrid>

          <SectionCard title={t('dashboard.quickActions')}>
            <QuickActions />
          </SectionCard>

          {isLoading || !data ? (
            <div className="grid gap-5 lg:grid-cols-3">
              <Skeleton className="h-80 lg:col-span-2" />
              <Skeleton className="h-80" />
              <Skeleton className="h-64 lg:col-span-3" />
            </div>
          ) : (
            <m.div className="space-y-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
              {widgets.expiryTimeline && (
                <SectionCard title={t('dashboard.expiryTimeline')}>
                  <ExpiryTimeline groups={data.expiryGroups} />
                </SectionCard>
              )}

              <div className="grid gap-5 lg:grid-cols-3">
                {widgets.consumptionTrend && (
                  <SectionCard title={t('dashboard.consumption')} description={t('dashboard.consumptionHint')} className="lg:col-span-2">
                    <ConsumptionChart data={data.consumptionTrend} />
                  </SectionCard>
                )}
                {widgets.categoryMix && (
                  <SectionCard title={t('dashboard.categoryMix')}>
                    <CategoryDonut data={data.categoryDistribution} />
                  </SectionCard>
                )}
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                {widgets.stockBySite && (
                  <SectionCard title={t('dashboard.stockBySite')}>
                    <StockBySiteChart data={data.stockBySite} />
                  </SectionCard>
                )}
                {widgets.topMaterials && (
                  <SectionCard title={t('dashboard.topMaterials')}>
                    <TopMaterials items={data.topMaterials} />
                  </SectionCard>
                )}
                {widgets.recentActivity && (
                  <SectionCard title={t('dashboard.recentActivity')}>
                    <ActivityTimeline items={data.recentActivity.slice(0, limits.recentActivity)} />
                  </SectionCard>
                )}
              </div>
            </m.div>
          )}
        </div>
      )}
    </>
  )
}
