import * as React from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Calculator, ShieldCheck, Sparkles } from 'lucide-react'
import { useUser } from '@/features/auth/AuthProvider'
import { useApiMutation, useBatches, useProducts, useSiteDirectory, useSites, useStock } from '@/hooks/queries'
import * as api from '@/api/mockApi'
import { catalog } from '@/config'
import { cn } from '@/lib/utils'
import { Badge, Button, Field, Input, Select, Textarea } from '@/components/ui'
import { Segmented, SidePanel } from '@/components/common'
import { DEFAULT_WASTAGE, expectedQuantity, isExpired, round2 } from '@/utils/calc'
import { formatDate, formatNumber, formatQty, unitLabel } from '@/utils/format'
import type { StockActionDefaults } from './StockActions'

export type StockActionMode = 'issue' | 'return' | 'transfer' | 'damage' | 'adjust'

const META: Record<StockActionMode, { title: string; hint: string; submit: string; success: string }> = {
  issue: { title: 'stock.issueTitle', hint: 'stock.issueHint', submit: 'stock.submitIssue', success: 'stock.successIssue' },
  return: { title: 'stock.returnTitle', hint: 'stock.returnHint', submit: 'stock.submitReturn', success: 'stock.successReturn' },
  transfer: { title: 'stock.transferTitle', hint: 'stock.transferHint', submit: 'stock.submitTransfer', success: 'stock.successTransfer' },
  damage: { title: 'stock.damageTitle', hint: 'stock.damageHint', submit: 'stock.submitDamage', success: 'stock.successDamage' },
  adjust: { title: 'stock.adjustTitle', hint: 'stock.adjustHint', submit: 'stock.submitAdjust', success: 'stock.successAdjust' },
}

const num = (v: string) => (v.trim() === '' ? NaN : Number(v))

function buildSchema(mode: StockActionMode, maxQty: number | null) {
  return z
    .object({
      siteId: z.string().min(1, 'validation.required'),
      productId: z.string().min(1, 'validation.required'),
      batchId: z.string().min(1, 'validation.required'),
      qty: z.string().refine((v) => num(v) > 0, 'validation.positive'),
      workArea: z.string(),
      areaM2: z.string().refine((v) => v === '' || num(v) >= 0, 'validation.nonNegative'),
      coats: z.string().refine((v) => v === '' || num(v) >= 0, 'validation.nonNegative'),
      toSiteId: z.string(),
      kind: z.enum(['damage', 'wastage', 'expired_disposal']),
      direction: z.enum(['1', '-1']),
      notes: z.string(),
    })
    .superRefine((v, ctx) => {
      const limited = mode !== 'return' && !(mode === 'adjust' && v.direction === '1')
      if (limited && maxQty !== null && num(v.qty) > maxQty) {
        ctx.addIssue({ code: 'custom', path: ['qty'], message: 'validation.maxQty' })
      }
      if ((mode === 'issue' || mode === 'return') && !v.workArea.trim()) {
        ctx.addIssue({ code: 'custom', path: ['workArea'], message: 'validation.required' })
      }
      if (mode === 'transfer') {
        if (!v.toSiteId) ctx.addIssue({ code: 'custom', path: ['toSiteId'], message: 'validation.required' })
        else if (v.toSiteId === v.siteId) ctx.addIssue({ code: 'custom', path: ['toSiteId'], message: 'validation.differentSite' })
      }
      if ((mode === 'damage' || mode === 'adjust' || mode === 'return') && !v.notes.trim()) {
        ctx.addIssue({ code: 'custom', path: ['notes'], message: 'validation.required' })
      }
    })
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>

export function StockMovementSheet({
  mode,
  defaults,
  onClose,
}: {
  mode: StockActionMode
  defaults: StockActionDefaults
  onClose: () => void
}) {
  const { t } = useTranslation()
  const user = useUser()
  const [open, setOpen] = React.useState(true)
  const meta = META[mode]

  const { data: sites } = useSites()
  const { data: directory } = useSiteDirectory()
  const { data: products } = useProducts()

  const accessible = sites ?? []
  const firstSite = defaults.siteId ?? (accessible.length === 1 ? accessible[0].id : (user.siteIds[0] ?? accessible[0]?.id ?? ''))

  const [maxQty, setMaxQty] = React.useState<number | null>(null)
  const schema = React.useMemo(() => buildSchema(mode, maxQty), [mode, maxQty])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      siteId: firstSite,
      productId: defaults.productId ?? '',
      batchId: defaults.batchId ?? '',
      qty: '',
      workArea: '',
      areaM2: '',
      coats: '',
      toSiteId: '',
      kind: 'damage',
      direction: '-1',
      notes: '',
    },
  })
  const { register, setValue, handleSubmit, formState, control } = form
  const [siteId, productId, batchId, qty, areaM2, coats, direction] = useWatch({
    control,
    name: ['siteId', 'productId', 'batchId', 'qty', 'areaM2', 'coats', 'direction'],
  })

  // Sites may load after first render
  React.useEffect(() => {
    if (!siteId && firstSite) setValue('siteId', firstSite)
  }, [firstSite, siteId, setValue])

  const { data: stockRows } = useStock(siteId || 'all')
  const { data: batches, isFetching: batchesLoading } = useBatches(siteId, productId, !!siteId && !!productId)

  const product = products?.find((p) => p.id === productId)
  const batch = batches?.find((b) => b.id === batchId)
  const allowExpired = (b: { expiryDate: string | null; expiryOverride?: boolean }) => !isExpired(b) || !!b.expiryOverride

  // FEFO default batch whenever product/site changes
  React.useEffect(() => {
    if (!batches) return
    if (batches.some((b) => b.id === batchId)) return
    const suggested = batches.find((b) => b.suggested) ?? batches.find((b) => b.qtyAvailable > 0) ?? batches[0]
    setValue('batchId', suggested?.id ?? '')
  }, [batches, batchId, setValue])

  React.useEffect(() => {
    setMaxQty(batch ? batch.qtyAvailable : null)
  }, [batch])

  React.useEffect(() => {
    if (product?.recommendedCoats && mode === 'issue') setValue('coats', String(product.recommendedCoats))
  }, [product, mode, setValue])

  const productOptions = React.useMemo(() => {
    const rows = (stockRows ?? []).filter((r) => r.siteId === siteId && (mode === 'return' || mode === 'adjust' || r.availableQty > 0))
    return rows.map((r) => ({ value: r.productId, label: `${r.productName} — ${r.brand} (${formatQty(r.availableQty, r.unit)})` }))
  }, [stockRows, siteId, mode])

  const batchOptions = (batches ?? [])
    .filter((b) => mode === 'return' || mode === 'adjust' || b.qtyAvailable > 0)
    .map((b) => {
      const blocked = mode === 'issue' && !allowExpired(b)
      return {
        value: b.id,
        disabled: blocked,
        label: [
          b.batchNo,
          b.expiryDate ? `${t('product.batchCols.expiry')} ${formatDate(b.expiryDate)}` : t('expiry.none'),
          formatQty(b.qtyAvailable, b.unit),
          b.suggested ? `★ ${t('product.suggested')}` : '',
          isExpired(b) ? `(${t('stock.expiredBatch')})` : '',
        ]
          .filter(Boolean)
          .join(' · '),
      }
    })

  // Expected = Area × Coverage × Coats × Wastage
  const expected =
    mode === 'issue' && product?.coveragePerM2
      ? expectedQuantity(num(areaM2) || 0, product.coveragePerM2, num(coats) || 0, DEFAULT_WASTAGE)
      : 0
  const variancePct = expected > 0 && num(qty) > 0 ? Math.round(((num(qty) - expected) / expected) * 100) : null

  const mutation = useApiMutation(
    async (v: FormValues) => {
      const q = num(v.qty)
      switch (mode) {
        case 'issue':
          return api.issueMaterial({
            siteId: v.siteId,
            productId: v.productId,
            batchId: v.batchId,
            qty: q,
            workArea: v.workArea.trim(),
            areaM2: v.areaM2 ? num(v.areaM2) : null,
            coats: v.coats ? num(v.coats) : null,
            expectedQty: expected || null,
            notes: v.notes.trim(),
          })
        case 'return':
          return api.returnMaterial({ siteId: v.siteId, productId: v.productId, batchId: v.batchId, qty: q, workArea: v.workArea.trim(), reason: v.notes.trim() })
        case 'transfer':
          return api.transferStock({ fromSiteId: v.siteId, toSiteId: v.toSiteId, productId: v.productId, batchId: v.batchId, qty: q, reason: v.notes.trim() || t('system.siteRequirement') })
        case 'damage':
          return api.reportDamage({ siteId: v.siteId, productId: v.productId, batchId: v.batchId, qty: q, kind: v.kind, reason: v.notes.trim() })
        case 'adjust':
          return api.adjustStock({ siteId: v.siteId, productId: v.productId, batchId: v.batchId, qty: q, direction: v.direction === '1' ? 1 : -1, reason: v.notes.trim() })
      }
    },
    { successKey: meta.success },
  )

  const close = () => setOpen(false)
  const onSubmit = handleSubmit(async (v) => {
    await mutation.mutateAsync(v).then(close).catch(() => undefined)
  })

  const err = (name: keyof FormValues) => {
    const m = formState.errors[name]?.message
    return m ? t(m, { max: batch ? formatQty(batch.qtyAvailable, batch.unit) : '' }) : undefined
  }

  const unit = product ? unitLabel(product.baseUnit) : ''
  const formId = `stock-form-${mode}`

  return (
    <SidePanel
      open={open}
      onClose={() => {
        setOpen(false)
        window.setTimeout(onClose, 200)
      }}
      title={t(meta.title)}
      description={t(meta.hint)}
      width="md"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form={formId} disabled={mutation.isPending} variant={mode === 'damage' ? 'destructive' : 'default'}>
            {mutation.isPending ? t('common.loading') : t(meta.submit)}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label={t(mode === 'transfer' ? 'stock.fromSite' : 'stock.siteStore')} htmlFor="sm-site" error={err('siteId')} required className="sm:col-span-2">
          <Select
            id="sm-site"
            placeholder={t('common.selectPlaceholder')}
            options={accessible.map((s) => ({ value: s.id, label: `${s.name} · ${s.storeName}` }))}
            {...register('siteId', {
              onChange: () => {
                setValue('productId', '')
                setValue('batchId', '')
              },
            })}
          />
        </Field>

        <Field label={t('stock.product')} htmlFor="sm-product" error={err('productId')} required className="sm:col-span-2">
          <Select
            id="sm-product"
            placeholder={t('common.selectPlaceholder')}
            options={productOptions}
            {...register('productId', { onChange: () => setValue('batchId', '') })}
          />
        </Field>

        <Field
          label={mode === 'issue' ? t('stock.suggestedBatch') : t('stock.batch')}
          htmlFor="sm-batch"
          error={err('batchId')}
          required
          className="sm:col-span-2"
          hint={
            mode === 'issue' ? (
              <span className="inline-flex items-center gap-1">
                <Sparkles className="size-3 text-primary" aria-hidden /> {t('stock.fefoHint')}
              </span>
            ) : undefined
          }
        >
          <Select
            id="sm-batch"
            disabled={!productId || batchesLoading}
            placeholder={productId && batchOptions.length === 0 ? t('stock.noBatches') : t('common.selectPlaceholder')}
            options={batchOptions}
            {...register('batchId')}
          />
        </Field>

        {batch && (
          <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm sm:col-span-2">
            <span className="text-muted-foreground">{t('stock.availableInBatch', { qty: formatQty(batch.qtyAvailable, batch.unit) })}</span>
            {batch.suggested && <Badge tone="primary">{t('product.suggested')}</Badge>}
            {isExpired(batch) && <Badge tone="danger">{t('stock.expiredBatch')}</Badge>}
            {batch.expiryOverride && <Badge tone="warning">{t('product.override')}</Badge>}
          </div>
        )}

        {mode === 'transfer' && (
          <Field label={t('stock.toSite')} htmlFor="sm-to" error={err('toSiteId')} required className="sm:col-span-2">
            <Select
              id="sm-to"
              placeholder={t('common.selectPlaceholder')}
              options={(directory ?? []).filter((s) => s.id !== siteId).map((s) => ({ value: s.id, label: `${s.name} · ${s.city}` }))}
              {...register('toSiteId')}
            />
          </Field>
        )}

        {mode === 'adjust' && (
          <div className="sm:col-span-2">
            <p className="mb-1.5 text-sm font-medium">{t('stock.direction')}</p>
            <Segmented
              label={t('stock.direction')}
              value={direction}
              onChange={(v) => setValue('direction', v)}
              options={[
                { value: '-1', label: t('stock.decrease') },
                { value: '1', label: t('stock.increase') },
              ]}
            />
          </div>
        )}

        {mode === 'damage' && (
          <Field label={t('stock.damageKind')} htmlFor="sm-kind" className="sm:col-span-2">
            <Select
              id="sm-kind"
              options={catalog.damageKinds.map((k) => ({ value: k, label: t(`stock.kinds.${k}`) }))}
              {...register('kind')}
            />
          </Field>
        )}

        {(mode === 'issue' || mode === 'return') && (
          <Field label={t('stock.workArea')} htmlFor="sm-area-name" error={err('workArea')} required className="sm:col-span-2">
            <Input id="sm-area-name" placeholder={t('stock.workAreaPlaceholder')} {...register('workArea')} />
          </Field>
        )}

        {mode === 'issue' && product?.coveragePerM2 && (
          <>
            <Field label={t('stock.areaCovered')} htmlFor="sm-m2" error={err('areaM2')}>
              <Input id="sm-m2" type="number" inputMode="decimal" min={0} step="any" {...register('areaM2')} />
            </Field>
            <Field label={t('stock.coats')} htmlFor="sm-coats" error={err('coats')}>
              <Input id="sm-coats" type="number" inputMode="numeric" min={0} step={1} {...register('coats')} />
            </Field>
            <div className="rounded-lg border border-primary/25 bg-primary-soft/60 p-3 sm:col-span-2" aria-live="polite">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                <Calculator className="size-4" aria-hidden /> {t('stock.expectedUsage')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{t('stock.expectedFormula')}</p>
              <p className="tabular mt-2 text-sm">
                {t('stock.expectedCalc', {
                  area: formatNumber(num(areaM2) || 0),
                  coverage: `${product.coveragePerM2} ${unit}/m²`,
                  coats: num(coats) || 0,
                  wastage: DEFAULT_WASTAGE,
                  result: '',
                })}
                <strong className="text-base text-foreground">{formatQty(round2(expected), product.baseUnit)}</strong>
              </p>
              {expected > 0 && (
                <Button type="button" variant="link" size="sm" className="mt-1 h-auto" onClick={() => setValue('qty', String(round2(expected)), { shouldValidate: true })}>
                  {t('stock.useExpected', { qty: formatQty(round2(expected), product.baseUnit) })}
                </Button>
              )}
            </div>
          </>
        )}

        <Field
          label={mode === 'issue' ? t('stock.actualIssued') : t('stock.quantity')}
          htmlFor="sm-qty"
          error={err('qty')}
          required
          hint={
            variancePct !== null && variancePct !== 0 ? (
              <span className={cn(Math.abs(variancePct) > 10 ? 'font-medium text-warning' : '')}>
                {variancePct > 0 ? t('stock.overExpected', { pct: variancePct }) : t('stock.underExpected', { pct: -variancePct })}
              </span>
            ) : undefined
          }
        >
          <div className="relative">
            <Input id="sm-qty" type="number" inputMode="decimal" min={0} step="any" className="pr-14" {...register('qty')} />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{unit}</span>
          </div>
        </Field>

        <Field label={t('common.unit')} htmlFor="sm-unit">
          <Input id="sm-unit" value={product ? t(`unitNames.${product.baseUnit}`) : ''} readOnly disabled />
        </Field>

        <Field
          label={mode === 'issue' ? t('common.notes') : t('common.reason')}
          htmlFor="sm-notes"
          error={err('notes')}
          required={mode === 'damage' || mode === 'adjust' || mode === 'return'}
          className="sm:col-span-2"
        >
          <Textarea id="sm-notes" rows={2} {...register('notes')} />
        </Field>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground sm:col-span-2">
          <ShieldCheck className="size-3.5" aria-hidden /> {t('stock.auditNote')}
        </p>
      </form>
    </SidePanel>
  )
}
