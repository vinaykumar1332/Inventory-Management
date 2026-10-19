import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Building2, ChevronRight, LayoutGrid, List, MapPin, Plus, TriangleAlert, User } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { useSites } from '@/hooks/queries'
import { storageKeys } from '@/lib/storage'
import { usePersistentState } from '@/hooks/useMediaQuery'
import { Badge, Button, Card, Progress, Skeleton, Table, TableWrap, TBody, TD, TH, THead, TR } from '@/components/ui'
import { EmptyState, ErrorState, PageHeader, Segmented, SitePhaseBadge, SiteStatusBadge } from '@/components/common'
import { CreateSiteSheet } from '@/features/sites/CreateSiteSheet'
import type { SiteSummary } from '@/types'
import { formatDate, formatINR, formatINRCompact } from '@/utils/format'

function SiteCard({ site }: { site: SiteSummary }) {
  const { t } = useTranslation()
  return (
    <Link
      to={`/sites/${site.id}`}
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

  return (
    <>
      <PageHeader
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
      />

      {isError ? (
        <Card>
          <ErrorState onRetry={() => void refetch()} />
        </Card>
      ) : isLoading || !data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
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
          <TableWrap>
            <Table>
              <THead>
                <tr>
                  <TH>{t('common.site')}</TH>
                  <TH>{t('sites.city')}</TH>
                  <TH>{t('sites.manager')}</TH>
                  <TH>{t('sites.storekeeper')}</TH>
                  <TH className="text-right">{t('sites.stockValue')}</TH>
                  <TH className="text-right">{t('sites.activeMaterials')}</TH>
                  <TH className="text-right">{t('sites.expiryAlerts')}</TH>
                  <TH>{t('sites.progress')}</TH>
                  <TH>{t('common.status')}</TH>
                </tr>
              </THead>
              <TBody>
                {data.map((s) => (
                  <TR key={s.id}>
                    <TD>
                      <Link to={`/sites/${s.id}`} className="font-medium hover:text-primary hover:underline">
                        {s.name}
                      </Link>
                      <p className="font-mono text-xs text-muted-foreground">{s.code}</p>
                    </TD>
                    <TD>{s.city}</TD>
                    <TD className="whitespace-nowrap">{s.managerName}</TD>
                    <TD className="whitespace-nowrap">{s.storekeeperName}</TD>
                    <TD className="tabular whitespace-nowrap text-right">{formatINR(s.stockValue)}</TD>
                    <TD className="tabular text-right">{s.activeMaterials}</TD>
                    <TD className="text-right">
                      {s.expiryAlerts ? (
                        <Badge tone="warning">
                          <TriangleAlert aria-hidden />
                          {s.expiryAlerts}
                        </Badge>
                      ) : (
                        '0'
                      )}
                    </TD>
                    <TD className="min-w-32">
                      <div className="flex items-center gap-2">
                        <Progress value={s.progress} label={t('sites.progress')} />
                        <span className="tabular text-xs">{s.progress}%</span>
                      </div>
                      <p className="mt-1 whitespace-nowrap text-[11px] text-muted-foreground">
                        {t('sites.duration', { start: formatDate(s.startDate), end: formatDate(s.endDate) })}
                      </p>
                    </TD>
                    <TD>
                      <div className="flex flex-col gap-1">
                        <SiteStatusBadge status={s.status} />
                        {s.phase && <SitePhaseBadge phase={s.phase} />}
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableWrap>
        </Card>
      )}

      <CreateSiteSheet open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}
