import { useTranslation } from 'react-i18next'
import { FileSpreadsheet } from 'lucide-react'
import { useMovements, useSites } from '@/hooks/queries'
import { getCachedFile } from '@/features/bills/fileCache'
import { Badge, Dialog, DialogContent, Skeleton, Table, TableWrap, TBody, TD, TH, THead, TR } from '@/components/ui'
import { BillStatusBadge, EmptyState, MovementBadge } from '@/components/common'
import { TINT_CLASSES } from '@/config/tones'
import { cn } from '@/lib/utils'
import type { Invoice } from '@/types'
import { formatDate, formatFileSize, formatINR, formatQty } from '@/utils/format'

/** Shows the uploaded file if it is still in this browser session, else a reconstructed bill. */
export function BillDocumentDialog({ invoice, onClose }: { invoice: Invoice | null; onClose: () => void }) {
  const { t } = useTranslation()
  const { data: sites } = useSites()
  const cached = invoice ? getCachedFile(invoice.id) : undefined
  const site = sites?.find((s) => s.id === invoice?.siteId)
  const subtotal = invoice?.lineItems.reduce((s, l) => s + l.totalCost, 0) ?? 0

  return (
    <Dialog open={!!invoice} onOpenChange={(o) => !o && onClose()}>
      {invoice && (
        <DialogContent
          className="max-w-3xl"
          title={`${t('bills.documentPreview')} · ${invoice.invoiceNo || invoice.fileName}`}
          description={cached ? invoice.fileName : t('bills.mockDocument')}
        >
          {cached && invoice.uploadType === 'image' ? (
            <img src={cached.url} alt={invoice.fileName} className="mx-auto max-h-[65vh] rounded-md border object-contain" />
          ) : cached && invoice.uploadType === 'pdf' ? (
            <iframe src={cached.url} title={invoice.fileName} className="h-[65vh] w-full rounded-md border" />
          ) : (
            <div className="rounded-lg border bg-surface p-4 shadow-inner md:p-6">
              {cached && (
                <div className={cn('mb-4 flex items-center gap-2 rounded-md px-3 py-2 text-sm', TINT_CLASSES.emerald)}>
                  <FileSpreadsheet className="size-4" aria-hidden /> {cached.file.name} · {formatFileSize(cached.file.size / 1024)}
                </div>
              )}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
                <div>
                  <p className="text-lg font-semibold">{invoice.vendorName || '—'}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('admin.gstin')} {invoice.gstNumber || '—'}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-mono font-semibold">{invoice.invoiceNo || '—'}</p>
                  <p className="text-muted-foreground">{formatDate(invoice.invoiceDate)}</p>
                  <div className="mt-1">
                    <BillStatusBadge status={invoice.status} />
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm">
                <span className="text-muted-foreground">{t('upload.siteStore')}: </span>
                {site ? `${site.name} · ${site.storeName}` : '—'}
              </p>
              {invoice.lineItems.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t('bills.noLines')}</p>
              ) : (
                <TableWrap className="mt-3 rounded-md border">
                  <Table>
                    <THead>
                      <tr>
                        <TH>{t('upload.cols.product')}</TH>
                        <TH>{t('upload.cols.batchNo')}</TH>
                        <TH className="text-right">{t('upload.cols.totalQty')}</TH>
                        <TH className="text-right">{t('upload.cols.unitCost')}</TH>
                        <TH className="text-right">{t('upload.cols.totalCost')}</TH>
                      </tr>
                    </THead>
                    <TBody>
                      {invoice.lineItems.map((l) => (
                        <TR key={l.id}>
                          <TD>
                            <p className="font-medium">{l.productName}</p>
                            <p className="text-xs text-muted-foreground">{l.brand}</p>
                          </TD>
                          <TD className="font-mono text-xs">{l.batchNo}</TD>
                          <TD className="tabular whitespace-nowrap text-right">{formatQty(l.totalQty, l.unit)}</TD>
                          <TD className="tabular whitespace-nowrap text-right">{formatINR(l.unitCost, true)}</TD>
                          <TD className="tabular whitespace-nowrap text-right">{formatINR(l.totalCost, true)}</TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </TableWrap>
              )}
              <dl className="ml-auto mt-4 w-full max-w-xs space-y-1 text-sm">
                {[
                  [t('bills.subtotal'), subtotal],
                  [t('bills.gst'), invoice.taxAmount],
                  [t('upload.freight'), invoice.freight],
                  [t('upload.discount'), -invoice.discount],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex justify-between">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="tabular">{formatINR(Number(value), true)}</dd>
                  </div>
                ))}
                <div className="flex justify-between border-t pt-1 font-semibold">
                  <dt>{t('upload.billAmount')}</dt>
                  <dd className="tabular">{formatINR(invoice.billAmount, true)}</dd>
                </div>
              </dl>
            </div>
          )}
        </DialogContent>
      )}
    </Dialog>
  )
}

export function StockEntriesDialog({ invoice, onClose }: { invoice: Invoice | null; onClose: () => void }) {
  const { t } = useTranslation()
  const { data, isLoading } = useMovements({ invoiceId: invoice?.id }, !!invoice)
  return (
    <Dialog open={!!invoice} onOpenChange={(o) => !o && onClose()}>
      {invoice && (
        <DialogContent className="max-w-2xl" title={t('bills.stockEntries', { invoiceNo: invoice.invoiceNo })}>
          {isLoading ? (
            <Skeleton className="h-40" />
          ) : !data?.length ? (
            <EmptyState title={t('bills.noStockEntries')} />
          ) : (
            <ul className="divide-y rounded-lg border">
              {data.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{m.productName}</p>
                    <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <MovementBadge type={m.type} />
                      <span className="font-mono">{m.batchNo}</span>
                      <Badge>{m.siteName}</Badge>
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tabular font-semibold">+{formatQty(m.qty, m.unit)}</p>
                    <p className="tabular text-xs text-muted-foreground">{formatINR(m.value)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      )}
    </Dialog>
  )
}
