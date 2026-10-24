import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ArrowRightLeft, FileSpreadsheet, PackageMinus, PackagePlus, PackageSearch } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { useStockActions } from '@/features/stock/StockActions'
import { useStock } from '@/hooks/queries'
import { Button, Card, Select } from '@/components/ui'
import { CategorySelect, FilterBar, PageLayout, QueryState, SearchInput, SiteSelect } from '@/components/common'
import { ProductDrawer } from '@/features/inventory/ProductDrawer'
import { StockTable } from '@/features/inventory/StockTable'
import type { MaterialCategory, StockRow } from '@/types'
import { formatDate, unitLabel } from '@/utils/format'


export default function InventoryPage() {
  const { t } = useTranslation()
  const { can } = useAuth()
  const stock = useStockActions()
  const [params, setParams] = useSearchParams()
  const { data, isLoading, isError, refetch } = useStock('all')

  const [search, setSearch] = React.useState('')
  const site = params.get('site') ?? 'all'
  const category = params.get('category') ?? 'all'
  const stockFilter = params.get('stock') ?? 'all'
  const expiry = params.get('expiry') ?? 'all'
  const openProduct = params.get('product')
  const openSite = params.get('productSite') ?? 'all'

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value === null || value === 'all') next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data ?? []).filter((r) => {
      if (site !== 'all' && r.siteId !== site) return false
      if (category !== 'all' && r.category !== category) return false
      if (stockFilter === 'low' && !r.isLow) return false
      if (stockFilter === 'out' && r.availableQty > 0) return false
      if (stockFilter === 'in' && r.availableQty <= 0) return false
      if (expiry === 'expired' && r.expiryBucket !== 'expired') return false
      if (expiry === 'd30' && !['d7', 'd15', 'd30'].includes(r.expiryBucket)) return false
      if (expiry === 'ok' && !['ok', 'none'].includes(r.expiryBucket)) return false
      if (!q) return true
      return [r.productName, r.brand, r.sku, t(`categories.${r.category}`), ...r.batchNos].some((s) => s.toLowerCase().includes(q))
    })
  }, [data, search, site, category, stockFilter, expiry, t])

  const hasFilters = search || site !== 'all' || category !== 'all' || stockFilter !== 'all' || expiry !== 'all'

  const exportExcel = async () => {
    const { downloadWorkbook } = await import('@/utils/excel')
    const c = (k: string) => t(`inventory.cols.${k}`)
    downloadWorkbook(`SiteSeal_Inventory_${new Date().toISOString().slice(0, 10)}.xlsx`, [
      {
        name: t('inventory.title'),
        header: [c('product'), 'SKU', c('brand'), c('category'), c('availableQty'), c('unit'), c('stockValue'), c('nearestExpiry'), c('lowStock'), c('site'), c('status')],
        rows: filtered.map((r: StockRow) => [
          r.productName,
          r.sku,
          r.brand,
          t(`categories.${r.category}`),
          r.availableQty,
          unitLabel(r.unit),
          r.stockValue,
          r.nearestExpiry ? formatDate(r.nearestExpiry) : '',
          r.isLow ? t('common.yes') : t('common.no'),
          r.siteName,
          t(`stockStatus.${r.status}`),
        ]),
      },
    ])
    toast.success(t('inventory.exported'))
  }

  return (
    <PageLayout
      title={t('inventory.title')}
      subtitle={t('inventory.subtitle')}
      actions={
        <>
          {can('upload_bills') && (
            <Button variant="secondary" onClick={() => stock.open('receive')}>
              <PackagePlus /> {t('inventory.receiveStock')}
            </Button>
          )}
          {can('transfer_stock') && (
            <Button variant="secondary" onClick={() => stock.open('transfer', { siteId: site !== 'all' ? site : undefined })}>
              <ArrowRightLeft /> {t('inventory.transfer')}
            </Button>
          )}
          <Button variant="secondary" onClick={() => void exportExcel()} disabled={!filtered.length}>
            <FileSpreadsheet /> {t('common.exportExcel')}
          </Button>
          {can('issue_material') && (
            <Button onClick={() => stock.open('issue', { siteId: site !== 'all' ? site : undefined })}>
              <PackageMinus /> {t('quick.issueMaterial')}
            </Button>
          )}
        </>
      }
    >

      <Card>
        <FilterBar className="lg:grid-cols-[minmax(240px,2fr)_repeat(4,minmax(0,1fr))]">
          <SearchInput value={search} onChange={setSearch} placeholder={t('inventory.searchPlaceholder')} className="sm:col-span-2 lg:col-span-1" />
          <SiteSelect value={site} onChange={(v) => setParam('site', v)} />
          <CategorySelect
            value={category as MaterialCategory | 'all'}
            onChange={(v) => setParam('category', v)}
            allLabel={`${t('inventory.filterCategory')}: ${t('common.all')}`}
          />
          <Select
            aria-label={t('inventory.filterStock')}
            value={stockFilter}
            onChange={(e) => setParam('stock', e.target.value)}
            options={[
              { value: 'all', label: t('inventory.stockAny') },
              { value: 'in', label: t('inventory.stockIn') },
              { value: 'low', label: t('inventory.stockLow') },
              { value: 'out', label: t('inventory.stockOut') },
            ]}
          />
          <Select
            aria-label={t('inventory.filterExpiry')}
            value={expiry}
            onChange={(e) => setParam('expiry', e.target.value)}
            options={[
              { value: 'all', label: t('inventory.expiryAny') },
              { value: 'expired', label: t('inventory.expiryExpired') },
              { value: 'd30', label: t('inventory.expiry30') },
              { value: 'ok', label: t('inventory.expiryOk') },
            ]}
          />
        </FilterBar>

        <QueryState
          query={{ isLoading, isError, refetch }}
         
          isEmpty={filtered.length === 0}
          empty={{
            icon: PackageSearch,
            title: t('inventory.empty'),
            description: t('inventory.emptyHint'),
            action: hasFilters && (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('')
                  setParams(new URLSearchParams(), { replace: true })
                }}
              >
                {t('common.clearFilters')}
              </Button>
            ),
          }}
        >
          <StockTable
            rows={filtered}
            hideSite={site !== 'all'}
            onOpen={(r) => {
              const next = new URLSearchParams(params)
              next.set('product', r.productId)
              next.set('productSite', r.siteId)
              setParams(next, { replace: true })
            }}
          />
        </QueryState>
      </Card>

      <ProductDrawer
        productId={openProduct}
        siteId={openSite}
        onClose={() => {
          const next = new URLSearchParams(params)
          next.delete('product')
          next.delete('productSite')
          setParams(next, { replace: true })
        }}
      />
    </PageLayout>
  )
}
