import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { FileSpreadsheet } from 'lucide-react'
import { catalog, type ReportConfig } from '@/config'
import { useReport } from '@/hooks/queries'
import { Button, Skeleton } from '@/components/ui'
import { SectionCard } from '@/components/common'
import { GroupedBarChart } from '@/features/dashboard/charts'
import type { ReportFilters, ReportId, ReportResult } from '@/types'
import { formatDate, formatINRCompact } from '@/utils/format'

// Report list, money formatting, series labels and which cells hold
// translatable keys are all configured in src/config/catalog.json → reports.

export const REPORTS = catalog.reports.items
const reportConfig = (id: ReportId): ReportConfig => REPORTS.find((r) => r.id === id) ?? { id }

type Translate = ReturnType<typeof useTranslation>['t']

function translators(cfg: ReportConfig, t: Translate) {
  return {
    label: (label: string) => (cfg.labelNamespace ? t(`${cfg.labelNamespace}.${label}`) : label),
    row: (row: (string | number)[]) => (cfg.translateFirstColumn ? [t(`${cfg.translateFirstColumn}.${row[0]}`), ...row.slice(1)] : row),
  }
}

export async function downloadReport(id: ReportId, data: ReportResult, filters: ReportFilters, t: Translate) {
  const { downloadWorkbook } = await import('@/utils/excel')
  const name = t(`reports.items.${id}`)
  const tr = translators(reportConfig(id), t)
  downloadWorkbook(`SiteSeal_${id}_${filters.from}_${filters.to}.xlsx`, [
    {
      name,
      title: [[name], [`${t('reports.from')}: ${formatDate(filters.from)}`, `${t('reports.to')}: ${formatDate(filters.to)}`], [t('app.demoBadge')]],
      header: data.columns.map((c) => t(`reports.cols.${c}`)),
      rows: data.rows.map(tr.row),
    },
  ])
  toast.success(t('reports.downloaded', { name }))
}

export function ReportCard({ id, filters }: { id: ReportId; filters: ReportFilters }) {
  const { t } = useTranslation()
  const { data, isLoading } = useReport(id, filters)
  const cfg = reportConfig(id)
  const tr = translators(cfg, t)
  const chart = (data?.chart ?? []).map((c) => ({ ...c, label: tr.label(c.label) }))

  return (
    <SectionCard
      className="flex flex-col"
      contentClassName="flex flex-1 flex-col"
      title={t(`reports.items.${id}`)}
      description={t(`reports.descriptions.${id}`)}
      actions={
        <span className="tabular shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {data ? t('reports.rows', { count: data.rows.length }) : '…'}
        </span>
      }
    >
      <div className="flex-1">
        {isLoading || !data ? (
          <Skeleton className="h-52" />
        ) : chart.length === 0 ? (
          <p className="flex h-52 items-center justify-center rounded-lg bg-muted/50 text-sm text-muted-foreground">{t('reports.noData')}</p>
        ) : (
          <div role="img" aria-label={`${t('reports.preview')}: ${t(`reports.items.${id}`)}`}>
            <GroupedBarChart
              data={chart.slice(0, catalog.reports.previewBars)}
              height={208}
              label1={cfg.series ? t(cfg.series[0]) : t('common.value')}
              label2={cfg.series ? t(cfg.series[1]) : undefined}
              valueFormatter={cfg.money ? formatINRCompact : undefined}
            />
          </div>
        )}
      </div>
      <Button
        variant="secondary"
        className="mt-4 w-full sm:w-auto sm:self-start"
        disabled={!data || data.rows.length === 0}
        onClick={() => data && void downloadReport(id, data, filters, t)}
      >
        <FileSpreadsheet /> {t('common.downloadExcel')}
      </Button>
    </SectionCard>
  )
}
