import * as React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileUp, Receipt } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { paths } from '@/app/routes'
import { catalog } from '@/config'
import { useBills } from '@/hooks/queries'
import { Button, Card } from '@/components/ui'
import { PageLayout, QueryState, SearchInput, Segmented, SiteSelect } from '@/components/common'
import { BillsTable } from '@/features/bills/BillsTable'
import type { InvoiceStatus } from '@/types'

const STATUSES = catalog.billStatus.order

export default function BillsPage() {
  const { t } = useTranslation()
  const { can } = useAuth()
  const { data, isLoading, isError, refetch } = useBills()
  const [status, setStatus] = React.useState<InvoiceStatus | 'all'>('all')
  const [site, setSite] = React.useState('all')
  const [search, setSearch] = React.useState('')

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data ?? []).filter(
      (b) =>
        (status === 'all' || b.status === status) &&
        (site === 'all' || b.siteId === site) &&
        (!q || [b.invoiceNo, b.vendorName, b.fileName].some((s) => s.toLowerCase().includes(q))),
    )
  }, [data, status, site, search])

  const count = (s: InvoiceStatus) => data?.filter((b) => b.status === s).length ?? 0

  return (
    <PageLayout
      title={t('bills.title')}
      subtitle={t('bills.subtitle')}
      actions={
        can('upload_bills') && (
          <Button asChild>
            <Link to={paths.upload()}>
              <FileUp /> {t('bills.upload')}
            </Link>
          </Button>
        )
      }
    >
      <Card>
        <div className="space-y-3 border-b p-3 md:p-4">
          <Segmented
            label={t('bills.cols.status')}
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: t('common.all'), count: data?.length ?? 0 },
              ...STATUSES.map((s) => ({ value: s, label: t(`bills.status.${s}`), count: count(s) })),
            ]}
          />
          <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
            <SearchInput value={search} onChange={setSearch} placeholder={t('bills.searchPlaceholder')} />
            <SiteSelect value={site} onChange={setSite} />
          </div>
        </div>
        <QueryState
          query={{ isLoading, isError, refetch }}
         
          isEmpty={filtered.length === 0}
          empty={{ icon: Receipt, title: t('bills.empty'), description: t('bills.emptyHint') }}
        >
          <BillsTable bills={filtered} hideSite={site !== 'all'} />
        </QueryState>
      </Card>
    </PageLayout>
  )
}
