import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Building2, ChevronRight, HardHat, LayoutGrid, List, MapPin, Plus, TriangleAlert, User } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { useSites } from '@/hooks/queries'
import { storageKeys } from '@/lib/storage'
import { paths } from '@/app/routes'
import { usePersistentState } from '@/hooks/useMediaQuery'
import { Badge, Button, Card, Progress } from '@/components/ui'
import { EmptyState, ErrorState, PageLayout, ResponsiveTable, Segmented, SitePhaseBadge, SiteStatusBadge, Loader, type Column } from '@/components/common'
import { CreateSiteSheet } from '@/features/sites/CreateSiteSheet'
import type { SiteSummary } from '@/types'
import { formatDate, formatINR, formatINRCompact } from '@/utils/format'

function SiteCard({ site }: { site: SiteSummary }) {
  const { t } = useTranslation()
  return (
    <Link
      to={paths.site(site.id)}
      className="group flex flex-col rounded-lg border bg-surface p-4 shadow-card transition-all hover:border-primary/40 hover:shadow-md md:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-navy text-white">
            <Building2 className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-semibold group-hover:text-primary">{site.name}</h2>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" aria-hidden /> {site.city} · <span className="font-mono text-xs">{site.code}</span>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <SiteStatusBadge status={site.status} />
          {site.phase && <SitePhaseBadge phase={site.phase} />}
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-muted/70 p-3 text-center">
        <div>
          <dt className="text-[11px] text-muted-foreground">{t('sites.stockValue')}</dt>
          <dd className="tabular mt-0.5 font-semibold">{formatINRCompact(site.stockValue)}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-muted-foreground">{t('sites.activeMaterials')}</dt>
          <dd className="tabular mt-0.5 font-semibold">{site.activeMaterials}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-muted-foreground">{t('sites.expiryAlerts')}</dt>
          <dd className={`tabular mt-0.5 font-semibold ${site.expiryAlerts ? 'text-warning' : ''}`}>{site.expiryAlerts}</dd>
        </div>
      </dl>
      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-xs">
          <span className="text-muted-foreground">{t('sites.progress')}</span>
          <span className="tabular font-medium">{site.progress}%</span>
        </div>
        <Progress value={site.progress} label={t('sites.progress')} />
      </div>
      <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <User className="size-3.5" aria-hidden />
          {site.managerName}
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <HardHat className="size-3.5" aria-hidden />
          {site.labourCount === null ? t('sites.labourNotEntered') : t('sites.labourWorking', { count: site.labourCount })}
        </span>
        <span className="flex items-center gap-0.5 font-medium text-primary">
          {t('sites.openSite')} <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  )
}

export default function SitesPage() {
  const { t } = useTranslation()
  const { can } = useAuth()
  const [params, setParams] = useSearchParams()
  const { data, isLoading, isError, refetch } = useSites()
  const [view, setView] = usePersistentState<'grid' | 'table'>(storageKeys.sitesView, 'grid')
  const createOpen = params.get('create') === '1' && can('manage_sites')
  const setCreateOpen = (o: boolean) => setParams(o ? { create: '1' } : {}, { replace: true })

  const siteColumns: Column<SiteSummary>[] = [
    {
      key: 'site',
      header: t('common.site'),
      sortValue: (s) => s.name,
      cell: (s) => (
        <>
          <Link to={paths.site(s.id)} className="font-medium hover:text-primary hover:underline">
            {s.name}
          </Link>
          <p className="font-mono text-xs text-muted-foreground">{s.code}</p>
        </>
      ),
    },
    { key: 'city', header: t('sites.city'), cell: (s) => s.city },
    { key: 'manager', header: t('sites.manager'), cell: (s) => s.managerName, className: 'whitespace-nowrap' },
    {
      key: 'backup',
      header: t('sites.backupManager'),
      cell: (s) => s.backupManagerNames.join(', ') || '—',
      className: 'whitespace-nowrap',
    },
    {
      key: 'stockValue',
      header: t('sites.stockValue'),
      align: 'right',
      sortValue: (s) => s.stockValue,
      cell: (s) => formatINR(s.stockValue),
      className: 'tabular whitespace-nowrap',
    },
    { key: 'activeMaterials', header: t('sites.activeMaterials'), align: 'right', cell: (s) => s.activeMaterials, className: 'tabular' },
    {
      key: 'expiryAlerts',
      header: t('sites.expiryAlerts'),
      align: 'right',
      cell: (s) =>
        s.expiryAlerts ? (
          <Badge tone="warning">
            <TriangleAlert aria-hidden />
            {s.expiryAlerts}
          </Badge>
        ) : (
          '0'
        ),
    },
    {
      key: 'progress',
      header: t('sites.progress'),
      className: 'min-w-32',
      cell: (s) => (
        <>
          <div className="flex items-center gap-2">
            <Progress value={s.progress} label={t('sites.progress')} />
            <span className="tabular text-xs">{s.progress}%</span>
          </div>
          <p className="mt-1 whitespace-nowrap text-[11px] text-muted-foreground">
            {t('sites.duration', { start: formatDate(s.startDate), end: formatDate(s.endDate) })}
          </p>
        </>
      ),
    },
    { key: 'labour', header: t('sites.labour'), align: 'right', cell: (s) => s.labourCount ?? '–', className: 'tabular' },
    {
      key: 'status',
      header: t('common.status'),
      cell: (s) => (
        <div className="flex flex-col gap-1">
          <SiteStatusBadge status={s.status} />
          {s.phase && <SitePhaseBadge phase={s.phase} />}
        </div>
      ),
    },
  ]

  return (
    <PageLayout
      title={t('sites.title')}
      subtitle={t('sites.subtitle')}
      actions={
        <>
          <Segmented
            label={t('common.gridView')}
            value={view}
            onChange={setView}
            options={[
              { value: 'grid', label: t('common.gridView'), icon: LayoutGrid },
              { value: 'table', label: t('common.tableView'), icon: List },
            ]}
          />
          {can('manage_sites') && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> {t('sites.create')}
            </Button>
          )}
        </>
      }
    >
      {isError ? (
        <Card>
          <ErrorState onRetry={() => void refetch()} />
        </Card>
      ) : isLoading || !data ? (
        <Loader />
      ) : data.length === 0 ? (
        <Card>
          <EmptyState icon={Building2} title={t('sites.empty')} description={t('sites.emptyHint')} />
        </Card>
      ) : view === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((s) => (
            <SiteCard key={s.id} site={s} />
          ))}
        </div>
      ) : (
        <Card>
          <ResponsiveTable columns={siteColumns} rows={data} rowKey={(s) => s.id} initialSort={{ key: 'site', dir: 'asc' }} caption={t('sites.title')} />
        </Card>
      )}

      <CreateSiteSheet open={createOpen} onOpenChange={setCreateOpen} />
    </PageLayout>
  )
}
