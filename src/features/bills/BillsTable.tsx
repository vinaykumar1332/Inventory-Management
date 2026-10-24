import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Archive, Download, Eye, MoreHorizontal, PackageCheck, PencilLine } from 'lucide-react'
import { useApiMutation, useSites, useUsers } from '@/hooks/queries'
import { archiveBill } from '@/api/mockApi'
import { getCachedFile } from '@/features/bills/fileCache'
import { Button, ConfirmDialog, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui'
import { BillStatusBadge, ResponsiveTable, UploadTypeBadge, type Column } from '@/components/common'
import type { Invoice } from '@/types'
import { paths } from '@/app/routes'
import { formatDate, formatINR, unitLabel } from '@/utils/format'
import { BillDocumentDialog, StockEntriesDialog } from './BillDialogs'

async function downloadOriginal(inv: Invoice, t: (k: string) => string) {
  const cached = getCachedFile(inv.id)
  if (cached) {
    const a = document.createElement('a')
    a.href = cached.url
    a.download = cached.file.name
    a.click()
    return
  }
  const { downloadWorkbook } = await import('@/utils/excel')
  downloadWorkbook(`${inv.invoiceNo.replace(/[^A-Za-z0-9]+/g, '_') || 'bill'}.xlsx`, [
    {
      name: 'Bill',
      title: [
        [t('upload.vendor'), inv.vendorName],
        [t('upload.invoiceNo'), inv.invoiceNo],
        [t('upload.invoiceDate'), formatDate(inv.invoiceDate)],
        [t('upload.gstNumber'), inv.gstNumber],
        [t('upload.billAmount'), inv.billAmount],
      ],
      header: [t('upload.cols.product'), t('upload.cols.brand'), t('upload.cols.batchNo'), t('upload.cols.mfgDate'), t('upload.cols.expiryDate'), t('upload.cols.packs'), t('upload.cols.packSize'), t('upload.cols.totalQty'), t('upload.cols.unit'), t('upload.cols.unitCost'), t('upload.cols.totalCost')],
      rows: inv.lineItems.map((l) => [l.productName, l.brand, l.batchNo, l.mfgDate ?? '', l.expiryDate ?? '', l.packs, l.packSize, l.totalQty, unitLabel(l.unit), l.unitCost, l.totalCost]),
    },
  ])
  toast.info(t('bills.originalNotStored'))
}

export function BillsTable({ bills, hideSite }: { bills: Invoice[]; hideSite?: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: sites } = useSites()
  const { data: users } = useUsers()
  const [docFor, setDocFor] = React.useState<Invoice | null>(null)
  const [entriesFor, setEntriesFor] = React.useState<Invoice | null>(null)
  const [archiveFor, setArchiveFor] = React.useState<Invoice | null>(null)
  const archive = useApiMutation(archiveBill, { successKey: 'bills.archived' })

  const siteName = (id: string) => sites?.find((s) => s.id === id)?.name ?? '—'
  const userName = (id: string) => users?.find((u) => u.id === id)?.name ?? '—'

  const siteColumn: Column<Invoice> = {
    key: 'site',
    header: t('bills.cols.site'),
    sortValue: (b) => siteName(b.siteId),
    cell: (b) => siteName(b.siteId),
    className: 'whitespace-nowrap',
  }

  const columns: Column<Invoice>[] = [
    {
      key: 'invoiceNo',
      header: t('bills.cols.invoiceNo'),
      sortValue: (b) => b.invoiceNo,
      cell: (b) => (
        <>
          <button
            type="button"
            className="text-left font-mono text-xs font-semibold hover:text-primary hover:underline"
            onClick={(e) => {
              e.stopPropagation()
              setDocFor(b)
            }}
          >
            {b.invoiceNo || '—'}
          </button>
          <p className="max-w-44 truncate text-xs text-muted-foreground">{b.fileName}</p>
        </>
      ),
    },
    { key: 'vendor', header: t('bills.cols.vendor'), sortValue: (b) => b.vendorName, cell: (b) => b.vendorName || '—', className: 'max-w-52 truncate' },
    ...(hideSite ? [] : [siteColumn]),
    { key: 'uploadType', header: t('bills.cols.uploadType'), cell: (b) => <UploadTypeBadge type={b.uploadType} /> },
    { key: 'date', header: t('bills.cols.date'), sortValue: (b) => b.uploadedAt, cell: (b) => formatDate(b.uploadedAt), className: 'tabular whitespace-nowrap' },
    {
      key: 'amount',
      header: t('bills.cols.amount'),
      align: 'right',
      sortValue: (b) => b.billAmount,
      cell: (b) => (b.billAmount ? formatINR(b.billAmount) : '—'),
      className: 'tabular whitespace-nowrap',
    },
    { key: 'items', header: t('bills.cols.items'), align: 'right', cell: (b) => b.lineItems.length, className: 'tabular' },
    { key: 'status', header: t('bills.cols.status'), sortValue: (b) => b.status, cell: (b) => <BillStatusBadge status={b.status} /> },
    {
      key: 'uploadedBy',
      header: t('bills.cols.uploadedBy'),
      cell: (b) => userName(b.uploadedBy),
      className: 'hidden whitespace-nowrap 2xl:table-cell',
      hideOnMobile: true,
    },
  ]

  const actions = (b: Invoice) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`${t('common.moreActions')}: ${b.invoiceNo || b.fileName}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => setDocFor(b)}>
          <Eye /> {t('bills.viewDocument')}
        </DropdownMenuItem>
        {b.status !== 'approved' && b.status !== 'rejected' && (
          <DropdownMenuItem onSelect={() => navigate(paths.upload(b.id))}>
            <PencilLine /> {t('bills.continueReview')}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => void downloadOriginal(b, t)}>
          <Download /> {t('bills.downloadOriginal')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setEntriesFor(b)}>
          <PackageCheck /> {t('bills.viewStockEntries')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem danger onSelect={() => setArchiveFor(b)}>
          <Archive /> {t('bills.archive')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <>
      <ResponsiveTable
        columns={columns}
        rows={bills}
        rowKey={(b) => b.id}
        initialSort={{ key: 'date', dir: 'desc' }}
        caption={t('bills.title')}
        onRowClick={(b) => setDocFor(b)}
        rowActions={actions}
        actionsLabel={t('bills.cols.actions')}
      />

      <BillDocumentDialog invoice={docFor} onClose={() => setDocFor(null)} />
      <StockEntriesDialog invoice={entriesFor} onClose={() => setEntriesFor(null)} />
      <ConfirmDialog
        open={!!archiveFor}
        onOpenChange={(o) => !o && setArchiveFor(null)}
        title={t('bills.archiveTitle')}
        description={t('bills.archiveBody', { invoiceNo: archiveFor?.invoiceNo || archiveFor?.fileName })}
        confirmLabel={t('bills.archive')}
        tone="destructive"
        loading={archive.isPending}
        onConfirm={() => {
          if (archiveFor) archive.mutate(archiveFor.id, { onSuccess: () => setArchiveFor(null) })
        }}
      />
    </>
  )
}
