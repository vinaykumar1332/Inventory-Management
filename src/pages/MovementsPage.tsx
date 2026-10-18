import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { FileSpreadsheet, History } from 'lucide-react'
import { catalog } from '@/config'
import { useMovements } from '@/hooks/queries'
import { Button, Card, Select } from '@/components/ui'
import { FilterBar, PageHeader, QueryState, SearchInput, SiteSelect, TableSkeleton } from '@/components/common'
import { MovementsTable } from '@/features/stock/MovementsTable'
import type { MovementType } from '@/types'
import { formatDateTime, unitLabel } from '@/utils/format'

const TYPES = catalog.movementTypes.order

export default function MovementsPage() {
  const { t } = useTranslation()
  const [site, setSite] = React.useState('all')
  const [type, setType] = React.useState<MovementType | 'all'>('all')
  const [search, setSearch] = React.useState('')
  const { data, isLoading, isError, refetch } = useMovements({
    siteId: site === 'all' ? undefined : site,
    type: type === 'all' ? undefined : type,
  })

  const rows = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return data ?? []
    return (data ?? []).filter((r) => [r.productName, r.batchNo, r.userName, r.source, r.destination, r.reason].some((s) => s.toLowerCase().includes(q)))
  }, [data, search])

  const exportExcel = async () => {
    const { downloadWorkbook } = await import('@/utils/excel')
    const c = (k: string) => t(`movements.cols.${k}`)
    downloadWorkbook('SiteSeal_Stock_Movements.xlsx', [
      {
        name: t('movements.title'),
        header: [c('date'), c('action'), c('product'), c('batch'), c('qty'), t('common.unit'), c('source'), c('destination'), c('user'), c('reason'), c('value')],
        rows: rows.map((r) => [formatDateTime(r.date), t(`movements.types.${r.type}`), r.productName, r.batchNo, r.direction * r.qty, unitLabel(r.unit), r.source, r.destination, r.userName, r.reason, r.value]),
      },
    ])
    toast.success(t('reports.downloaded', { name: t('movements.title') }))
  }

  return (
    <>
      <PageHeader
        title={t('movements.title')}
        subtitle={t('movements.subtitle')}
        actions={
          <Button variant="secondary" onClick={() => void exportExcel()} disabled={!rows.length}>
            <FileSpreadsheet /> {t('common.exportExcel')}
          </Button>
        }
      />
      <Card>
        <FilterBar className="lg:grid-cols-[2fr_1fr_1fr]">
          <SearchInput value={search} onChange={setSearch} placeholder={t('common.search')} className="sm:col-span-2 lg:col-span-1" />
          <SiteSelect value={site} onChange={setSite} />
          <Select
            aria-label={t('movements.filterType')}
            value={type}
            onChange={(e) => setType(e.target.value as MovementType | 'all')}
            options={[{ value: 'all', label: `${t('movements.filterType')}: ${t('common.all')}` }, ...TYPES.map((x) => ({ value: x, label: t(`movements.types.${x}`) }))]}
          />
        </FilterBar>
        <QueryState query={{ isLoading, isError, refetch }} loading={<TableSkeleton rows={10} />} isEmpty={rows.length === 0} empty={{ icon: History, title: t('movements.empty') }}>
          <MovementsTable rows={rows} />
        </QueryState>
      </Card>
    </>
  )
}
