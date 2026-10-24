import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { m } from 'motion/react'
import { CircleCheck, FileUp, PackageCheck, TriangleAlert } from 'lucide-react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { ExpiryCell } from '@/components/common'
import type { ApproveBillResult, BillDraftInput, Unit } from '@/types'
import { paths } from '@/app/routes'
import { round2 } from '@/utils/calc'
import { formatDate, formatINR, formatQty } from '@/utils/format'

export function ConfirmStep({ draft, siteName }: { draft: BillDraftInput; siteName: string }) {
  const { t } = useTranslation()
  const matched = draft.lineItems.filter((l) => l.productId)
  const held = draft.lineItems.length - matched.length
  const value = round2(matched.reduce((s, l) => s + l.totalCost, 0))

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{t('upload.confirmTitle')}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{t('upload.confirmHint', { site: siteName })}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 rounded-lg bg-muted/60 p-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">{t('upload.vendor')}</dt>
            <dd className="font-medium">{draft.header.vendorName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('upload.invoiceNo')}</dt>
            <dd className="font-mono font-medium">{draft.header.invoiceNo}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('upload.invoiceDate')}</dt>
            <dd className="font-medium">{formatDate(draft.header.invoiceDate)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('upload.valueAdded' as const)}</dt>
            <dd className="tabular text-lg font-semibold text-primary">{formatINR(value)}</dd>
          </div>
        </dl>

        {held > 0 && (
          <p role="status" className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning-soft px-3 py-2 text-sm text-warning">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {t('upload.heldItems', { count: held })}
          </p>
        )}

        <ul className="divide-y rounded-lg border">
          {draft.lineItems.map((l) => (
            <li key={l.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium">
                  {l.productName}
                  {!l.productId && (
                    <Badge tone="warning" className="ml-2">
                      {t('bills.pendingTag')}
                    </Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {l.brand} · <span className="font-mono">{l.batchNo}</span> · {l.packs} × {l.packSize}
                </p>
              </div>
              <div className="flex items-center gap-4 sm:text-right">
                <ExpiryCell date={l.expiryDate} />
                <div>
                  <p className="tabular font-semibold">{formatQty(l.totalQty, l.unit)}</p>
                  <p className="tabular text-xs text-muted-foreground">{formatINR(l.totalCost)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export function SuccessState({
  result,
  siteName,
  onAnother,
}: {
  result: ApproveBillResult
  siteName: string
  onAnother: () => void
}) {
  const { t } = useTranslation()
  const qty = Object.entries(result.totalQtyByUnit) as [Unit, number][]
  return (
    <Card>
      <CardContent className="flex flex-col items-center px-6 py-10 text-center md:py-14">
        <m.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="flex size-20 items-center justify-center rounded-full bg-success-soft"
        >
          <CircleCheck className="size-11 text-success" aria-hidden />
        </m.div>
        <h2 className="mt-5 text-xl font-semibold" role="status">
          {t('upload.successTitle')}
        </h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {t('upload.successBody', { count: result.batchesCreated, invoiceNo: result.invoice.invoiceNo, site: siteName })}
        </p>
        <div className="mt-6 grid w-full max-w-lg gap-3 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">{t('upload.valueAdded')}</p>
            <p className="tabular mt-1 text-xl font-semibold">{formatINR(result.stockValueAdded)}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">{t('upload.qtyAdded')}</p>
            <p className="tabular mt-1 text-base font-semibold">{qty.map(([u, v]) => `+${formatQty(v, u)}`).join(' · ')}</p>
          </div>
        </div>
        {result.itemsHeld > 0 && (
          <p className="mt-4 text-sm text-warning">{t('upload.heldItems', { count: result.itemsHeld })}</p>
        )}
        <div className="mt-8 flex w-full max-w-lg flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link to={`/inventory?site=${result.invoice.siteId}`}>
              <PackageCheck /> {t('upload.viewInventory')}
            </Link>
          </Button>
          <Button variant="secondary" onClick={onAnother}>
            <FileUp /> {t('upload.uploadAnother')}
          </Button>
          <Button variant="ghost" asChild>
            <Link to={paths.bills}>{t('upload.viewBill')}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
