import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Archive, Download, Eye, MoreHorizontal, PackageCheck, PencilLine } from 'lucide-react'
import { useApiMutation, useSites, useUsers } from '@/hooks/queries'
import { archiveBill } from '@/services/mockApi'
import { getCachedFile } from '@/services/fileCache'
import { Button, ConfirmDialog, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, Table, TableWrap, TBody, TD, TH, THead, TR } from '@/components/ui'
import { BillStatusBadge, Pagination, SortHeader, UploadTypeBadge, useTableState } from '@/components/common'
import type { Invoice } from '@/types'
import { formatDate, formatINR, unitLabel } from '@/utils/format'
import { BillDocumentDialog, StockEntriesDialog } from './BillDialogs'

type SortKey = 'invoiceNo' | 'vendor' | 'site' | 'date' | 'amount' | 'status'

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

  const table = useTableState<Invoice, SortKey>(
    bills,
    {
      invoiceNo: (b) => b.invoiceNo,
      vendor: (b) => b.vendorName,
      site: (b) => siteName(b.siteId),
      date: (b) => b.uploadedAt,
      amount: (b) => b.billAmount,
      status: (b) => b.status,
    },
    { key: 'date', dir: 'desc' },
  )
  const sh = { sort: table.sort, onSort: table.toggleSort }

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
          <DropdownMenuItem onSelect={() => navigate(`/upload?invoice=${b.id}`)}>
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
      <TableWrap className="hidden md:block">
        <Table>
          <THead>
            <tr>
              <SortHeader label={t('bills.cols.invoiceNo')} sortKey="invoiceNo" {...sh} />
              <SortHeader label={t('bills.cols.vendor')} sortKey="vendor" {...sh} />
              {!hideSite && <SortHeader label={t('bills.cols.site')} sortKey="site" {...sh} />}
              <TH>{t('bills.cols.uploadType')}</TH>
              <SortHeader label={t('bills.cols.date')} sortKey="date" {...sh} />
              <SortHeader label={t('bills.cols.amount')} sortKey="amount" {...sh} className="text-right" align="right" />
              <TH className="text-right">{t('bills.cols.items')}</TH>
              <SortHeader label={t('bills.cols.status')} sortKey="status" {...sh} />
              <TH className="hidden 2xl:table-cell">{t('bills.cols.uploadedBy')}</TH>
              <TH className="text-right">
                <span className="sr-only">{t('bills.cols.actions')}</span>
              </TH>
            </tr>
          </THead>
          <TBody>
            {table.pageRows.map((b) => (
              <TR key={b.id}>
                <TD>
                  <button type="button" className="text-left font-mono text-xs font-semibold hover:text-primary hover:underline" onClick={() => setDocFor(b)}>
                    {b.invoiceNo || '—'}
                  </button>
                  <p className="max-w-44 truncate text-xs text-muted-foreground">{b.fileName}</p>
                </TD>
                <TD className="max-w-52 truncate">{b.vendorName || '—'}</TD>
                {!hideSite && <TD className="whitespace-nowrap">{siteName(b.siteId)}</TD>}
                <TD>
                  <UploadTypeBadge type={b.uploadType} />
                </TD>
                <TD className="tabular whitespace-nowrap">{formatDate(b.uploadedAt)}</TD>
                <TD className="tabular whitespace-nowrap text-right">{b.billAmount ? formatINR(b.billAmount) : '—'}</TD>
                <TD className="tabular text-right">{b.lineItems.length}</TD>
                <TD>
                  <BillStatusBadge status={b.status} />
                </TD>
                <TD className="hidden whitespace-nowrap 2xl:table-cell">{userName(b.uploadedBy)}</TD>
                <TD className="text-right">{actions(b)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </TableWrap>

      <ul className="divide-y md:hidden">
        {table.pageRows.map((b) => (
          <li key={b.id} className="flex gap-3 px-4 py-3">
            <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setDocFor(b)}>
              <div className="flex items-center gap-2">
                <span className="truncate font-mono text-sm font-semibold">{b.invoiceNo || b.fileName}</span>
              </div>
              <p className="truncate text-sm">{b.vendorName || '—'}</p>
              <p className="text-xs text-muted-foreground">
                {!hideSite && `${siteName(b.siteId)} · `}
                {formatDate(b.uploadedAt)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <BillStatusBadge status={b.status} />
                <UploadTypeBadge type={b.uploadType} />
                <span className="tabular text-sm font-semibold">{b.billAmount ? formatINR(b.billAmount) : ''}</span>
              </div>
            </button>
            {actions(b)}
          </li>
        ))}
      </ul>

      <Pagination page={table.page} pages={table.pages} total={table.total} pageSize={table.pageSize} onPage={table.setPage} />

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
