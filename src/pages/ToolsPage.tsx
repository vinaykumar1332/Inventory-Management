import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock, LogOut, PackageCheck, Wrench } from 'lucide-react'
import { catalog } from '@/config'
import { useTools } from '@/hooks/queries'
import { Card, Select } from '@/components/ui'
import { FilterBar, KpiCard, KpiGrid, KpiSkeleton, PageHeader, QueryState, SearchInput, SiteSelect, TableSkeleton } from '@/components/common'
import { ToolDrawer, ToolsTable } from '@/features/tools/ToolComponents'
import type { ToolStatus } from '@/types'

export default function ToolsPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const { data, isLoading, isError, refetch } = useTools()
  const [search, setSearch] = React.useState('')
  const [site, setSite] = React.useState('all')
  const [status, setStatus] = React.useState<ToolStatus | 'overdue' | 'all'>('all')
  const openId = params.get('tool')
  const openTool = data?.find((x) => x.id === openId) ?? null

  const rows = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data ?? []).filter(
      (r) =>
        (site === 'all' || r.siteId === site) &&
        (status === 'all' || (status === 'overdue' ? r.overdue : r.status === status)) &&
        (!q || [r.code, r.name, r.brand, r.assignedTo ?? ''].some((s) => s.toLowerCase().includes(q))),
    )
  }, [data, search, site, status])

  const count = (fn: (r: NonNullable<typeof data>[number]) => boolean) => data?.filter(fn).length ?? 0

  return (
    <>
      <PageHeader title={t('tools.title')} subtitle={t('tools.subtitle')} />
      <KpiGrid className="mb-5 grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }, (_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <KpiCard label={t('tools.summaryIssued')} value={count((r) => r.status === 'issued')} icon={LogOut} tone="info" />
            <KpiCard label={t('tools.summaryAvailable')} value={count((r) => r.status === 'available')} icon={PackageCheck} tone="success" />
            <KpiCard label={t('tools.summaryMaintenance')} value={count((r) => r.status === 'maintenance')} icon={Wrench} tone="warning" />
            <KpiCard label={t('tools.summaryOverdue')} value={count((r) => r.overdue)} icon={Clock} tone="danger" />
          </>
        )}
      </KpiGrid>
      <Card>
        <FilterBar className="lg:grid-cols-[2fr_1fr_1fr]">
          <SearchInput value={search} onChange={setSearch} placeholder={t('tools.searchPlaceholder')} className="sm:col-span-2 lg:col-span-1" />
          <SiteSelect value={site} onChange={setSite} />
          <Select
            aria-label={t('common.status')}
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            options={[
              { value: 'all', label: `${t('common.status')}: ${t('common.all')}` },
              ...catalog.tools.statusFilters.map((s) => ({ value: s, label: t(`tools.statuses.${s}`) })),
              { value: 'overdue', label: t('tools.overdue') },
            ]}
          />
        </FilterBar>
        <QueryState query={{ isLoading, isError, refetch }} loading={<TableSkeleton rows={8} />} isEmpty={rows.length === 0} empty={{ icon: Wrench, title: t('tools.empty') }}>
          <ToolsTable rows={rows} hideSite={site !== 'all'} onOpen={(r) => setParams({ tool: r.id }, { replace: true })} />
        </QueryState>
      </Card>
      <ToolDrawer tool={openTool} onClose={() => setParams({}, { replace: true })} />
    </>
  )
}
