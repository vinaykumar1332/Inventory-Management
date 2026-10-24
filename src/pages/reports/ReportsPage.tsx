import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { businessConfig } from '@/config'
import { useProducts } from '@/hooks/queries'
import { Card, CardContent, Field, Input, Select } from '@/components/ui'
import { CategorySelect, PageLayout, SiteSelect } from '@/components/common'
import { REPORTS, ReportCard } from '@/features/reports/ReportCard'
import type { ReportFilters } from '@/types'
import { isoDaysFromNow } from '@/utils/date'


export default function ReportsPage() {
  const { t } = useTranslation()
  const { data: products } = useProducts()
  const [filters, setFilters] = React.useState<ReportFilters>({
    from: isoDaysFromNow(-businessConfig.reports.defaultRangeDays),
    to: isoDaysFromNow(0),
    siteId: 'all',
    category: 'all',
    productId: 'all',
  })
  const set = <K extends keyof ReportFilters>(k: K, v: ReportFilters[K]) => setFilters((f) => ({ ...f, [k]: v }))

  const productOptions = (products ?? []).filter((p) => filters.category === 'all' || p.category === filters.category)

  return (
    <PageLayout title={t('reports.title')} subtitle={t('reports.subtitle')}>
      <Card className="mb-5">
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label={t('reports.from')} htmlFor="rf-from">
            <Input id="rf-from" type="date" value={filters.from} max={filters.to} onChange={(e) => e.target.value && set('from', e.target.value)} />
          </Field>
          <Field label={t('reports.to')} htmlFor="rf-to">
            <Input id="rf-to" type="date" value={filters.to} min={filters.from} onChange={(e) => e.target.value && set('to', e.target.value)} />
          </Field>
          <Field label={t('common.site')} htmlFor="rf-site">
            <SiteSelect id="rf-site" value={filters.siteId} onChange={(v) => set('siteId', v)} />
          </Field>
          <Field label={t('inventory.filterCategory')} htmlFor="rf-cat">
            <CategorySelect id="rf-cat" value={filters.category} onChange={(v) => setFilters((f) => ({ ...f, category: v, productId: 'all' }))} />
          </Field>
          <Field label={t('common.product')} htmlFor="rf-product">
            <Select
              id="rf-product"
              value={filters.productId}
              onChange={(e) => set('productId', e.target.value)}
              options={[{ value: 'all', label: t('common.all') }, ...productOptions.map((p) => ({ value: p.id, label: p.name }))]}
            />
          </Field>
        </CardContent>
      </Card>
      <div className="grid gap-5 lg:grid-cols-2">
        {REPORTS.map(({ id }) => (
          <ReportCard key={id} id={id} filters={filters} />
        ))}
      </div>
    </PageLayout>
  )
}
