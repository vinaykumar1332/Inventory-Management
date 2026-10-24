import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarClock, HardHat, LogIn, LogOut, UserPlus, Users } from 'lucide-react'
import { useLabourLog, useMarkArrived, useMarkLeft, useSetAttendance, useSiteLabour } from '@/hooks/queries'
import { Badge, Button, Input, Table, TableWrap, TBody, TD, TH, THead, TR } from '@/components/ui'
import { BarStrip, EmptyState, ErrorState, KpiCard, KpiGrid, Loader, Segmented, SortHeader, Pagination, useTableState } from '@/components/common'
import { formatDate, formatDateTime } from '@/utils/format'
import { isoDaysFromNow, todayIso } from '@/utils/date'
import type { LabourAttendance } from '@/types'
import { AddLabourSheet } from './AddLabourSheet'

type Row = {
  id: string
  name: string
  role: string
  rec: LabourAttendance | undefined
}
type SortKey = 'name' | 'role' | 'inAt' | 'outAt'

/**
 * Labour on one site: who checked in and when they left, per day, for the last seven days,
 * with analytics and a log of every change. Anyone with access to the site may edit;
 * every edit is recorded in the log with its before and after values.
 */
export function LabourTab({ siteId }: { siteId: string }) {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useSiteLabour(siteId)
  const log = useLabourLog(siteId)
  const setAttendance = useSetAttendance()
  const arrive = useMarkArrived()
  const leave = useMarkLeft()
  const [day, setDay] = React.useState(todayIso())
  const [adding, setAdding] = React.useState(false)

  const rows = React.useMemo<Row[]>(
    () =>
      (data?.roster ?? []).map((m) => ({
        id: m.id,
        name: m.name,
        role: t(`labour.roles.${m.role}`),
        rec: data?.records.find((r) => r.staffId === m.id && r.date === day),
      })),
    [data, day, t],
  )

  const table = useTableState<Row, SortKey>(
    rows,
    {
      name: (r) => r.name,
      role: (r) => r.role,
      inAt: (r) => r.rec?.inAt ?? null,
      outAt: (r) => r.rec?.outAt ?? null,
    },
    { key: 'name', dir: 'asc' },
  )

  if (isError) return <ErrorState onRetry={() => void refetch()} />
  if (isLoading || !data) return <Loader compact />

  const isToday = day === todayIso()
  const commit = (staffId: string, field: 'inAt' | 'outAt', value: string) => {
    const next = value === '' ? null : value
    const current = data.records.find((r) => r.staffId === staffId && r.date === day)?.[field] ?? null
    if (next === current) return
    setAttendance.mutate({ siteId, staffId, date: day, [field]: next })
  }
  const history = data.history
  const dayRecords = rows.filter((r) => r.rec?.inAt)
  const dayHours = history.find((h) => h.date === day)?.avgHours ?? null

  return (
    <div className="space-y-5 p-4 md:p-5">
      <KpiGrid className="xl:grid-cols-4">
        <KpiCard label={t('labour.attendedToday')} value={data.attendedToday} icon={Users} tone="primary" />
        <KpiCard label={t('labour.onSiteNow')} value={data.onSiteNow} icon={HardHat} tone="success" />
        <KpiCard label={t('labour.rosterCount')} value={data.roster.length} icon={CalendarClock} tone="info" />
        <KpiCard label={t('labour.avgHours')} value={dayHours === null ? '–' : `${dayHours} h`} icon={LogOut} tone="neutral" sub={formatDate(day)} />
      </KpiGrid>

      <section aria-labelledby="labour-days" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="labour-days" className="text-sm font-semibold">
            {t('labour.attendance')}
          </h3>
          <Segmented
            label={t('labour.attendance')}
            value={day}
            onChange={setDay}
            options={Array.from({ length: 7 }, (_, i) => {
              const date = isoDaysFromNow(-i)
              return { value: date, label: i === 0 ? t('labour.todayShort') : formatDate(date) }
            })}
          />
        </div>

        {data.roster.length === 0 ? (
          <EmptyState icon={HardHat} title={t('labour.empty')} description={t('labour.emptyHint')} />
        ) : (
          <>
            <TableWrap>
              <Table>
                <THead>
                  <tr>
                    <SortHeader label={t('labour.cols.name')} sortKey="name" sort={table.sort} onSort={table.toggleSort} />
                    <SortHeader label={t('labour.cols.role')} sortKey="role" sort={table.sort} onSort={table.toggleSort} />
                    <SortHeader label={t('labour.cols.checkIn')} sortKey="inAt" sort={table.sort} onSort={table.toggleSort} />
                    <SortHeader label={t('labour.cols.leftAt')} sortKey="outAt" sort={table.sort} onSort={table.toggleSort} />
                    <TH>{t('labour.cols.status')}</TH>
                    <TH aria-label={t('common.actions')} />
                  </tr>
                </THead>
                <TBody>
                  {table.pageRows.map((r) => {
                    const status = !r.rec?.inAt ? 'absent' : r.rec.outAt ? 'left' : 'onSite'
                    return (
                      <TR key={r.id}>
                        <TD className="whitespace-nowrap font-medium">{r.name}</TD>
                        <TD className="whitespace-nowrap">{r.role}</TD>
                        <TD>
                          <Input
                            type="time"
                            aria-label={t('labour.cols.checkIn')}
                            className="tabular w-32"
                            defaultValue={r.rec?.inAt ?? ''}
                            key={'in-' + r.id + day + (r.rec?.inAt ?? '')}
                            onBlur={(e) => commit(r.id, 'inAt', e.target.value)}
                          />
                        </TD>
                        <TD>
                          <Input
                            type="time"
                            aria-label={t('labour.cols.leftAt')}
                            className="tabular w-32"
                            defaultValue={r.rec?.outAt ?? ''}
                            key={'out-' + r.id + day + (r.rec?.outAt ?? '')}
                            onBlur={(e) => commit(r.id, 'outAt', e.target.value)}
                          />
                        </TD>
                        <TD>
                          <Badge tone={status === 'onSite' ? 'success' : status === 'left' ? 'neutral' : 'warning'}>
                            {t(`labour.status.${status}`)}
                          </Badge>
                        </TD>
                        <TD className="whitespace-nowrap text-right">
                          {isToday && !r.rec?.inAt && (
                            <Button size="sm" variant="secondary" onClick={() => arrive.mutate({ siteId, staffId: r.id })} disabled={arrive.isPending}>
                              <LogIn /> {t('labour.checkInNow')}
                            </Button>
                          )}
                          {isToday && r.rec?.inAt && !r.rec.outAt && (
                            <Button size="sm" variant="secondary" onClick={() => leave.mutate({ siteId, staffId: r.id })} disabled={leave.isPending}>
                              <LogOut /> {t('labour.markLeftNow')}
                            </Button>
                          )}
                        </TD>
                      </TR>
                    )
                  })}
                </TBody>
              </Table>
            </TableWrap>
            <Pagination page={table.page} pages={table.pages} total={table.total} pageSize={table.pageSize} onPage={table.setPage} />
          </>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>{t('labour.presentOn', { count: dayRecords.length, date: formatDate(day) })}</span>
          <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
            <UserPlus /> {t('labour.addMember')}
          </Button>
        </div>
      </section>

      <section aria-labelledby="labour-analytics" className="space-y-3 rounded-lg border p-4">
        <h3 id="labour-analytics" className="text-sm font-semibold">
          {t('labour.analytics')}
        </h3>
        <BarStrip
          items={history
            .slice()
            .reverse()
            .map((h) => ({
              key: h.date,
              label: formatDate(h.date),
              value: h.attended,
              hint: h.avgHours === null ? undefined : `${h.avgHours} h`,
            }))}
          emptyLabel={t('labour.noData')}
        />
        <p className="text-xs text-muted-foreground">{t('labour.analyticsHint')}</p>
      </section>

      <section aria-labelledby="labour-log" className="space-y-3">
        <h3 id="labour-log" className="text-sm font-semibold">
          {t('labour.log')}
        </h3>
        {log.data && log.data.length > 0 ? (
          <ol className="divide-y rounded-lg border text-sm">
            {log.data.map((e) => (
              <li key={e.id} className="flex flex-col gap-1 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <span>{e.details}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {e.userName} · {formatDateTime(e.at)}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">{t('labour.logEmpty')}</p>
        )}
      </section>

      <AddLabourSheet open={adding} onOpenChange={setAdding} siteId={siteId} />
    </div>
  )
}
