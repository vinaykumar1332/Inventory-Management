import * as React from 'react'
import { useFieldArray, useWatch, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { CircleHelp, Plus, Split, Trash2, TriangleAlert } from 'lucide-react'
import { useApiMutation, useProducts, useSites } from '@/hooks/queries'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { createProductRequest, findDuplicateInvoice } from '@/services/mockApi'
import { catalog } from '@/config'
import { cn } from '@/lib/utils'
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Combobox, type ComboOption, Field, Input, Select, Table, TableWrap, TBody, TD, TH, THead, TR } from '@/components/ui'
import type { Product, Unit } from '@/types'
import { round2 } from '@/utils/calc'
import { coverageLabel, CURRENCY_SYMBOL, formatINR, formatQty, unitLabel } from '@/utils/format'
import { emptyLine, lineTotals, toNumber, type LineValues, type ReviewValues } from './reviewForm'

const UNITS: Unit[] = catalog.units

type Form = UseFormReturn<ReviewValues>

function useLineHelpers(form: Form, products: Product[] | undefined) {
  const { setValue } = form
  const selectProduct = (index: number, option: ComboOption) => {
    const p = products?.find((x) => x.id === option.value)
    if (!p) return
    const path = `lines.${index}` as const
    setValue(`${path}.productId`, p.id)
    setValue(`${path}.productName`, p.name, { shouldValidate: true })
    setValue(`${path}.brand`, p.brand)
    setValue(`${path}.unit`, p.baseUnit)
    setValue(`${path}.packSize`, String(p.packSize))
    setValue(`${path}.coverage`, coverageLabel(p))
    if (!toNumber(form.getValues(`${path}.unitCost`))) setValue(`${path}.unitCost`, String(p.costPerBaseUnit))
  }
  return { selectProduct }
}

function ProductCell({
  form,
  index,
  options,
  invoiceId,
  onSelect,
}: {
  form: Form
  index: number
  options: ComboOption[]
  invoiceId: string | null
  onSelect: (o: ComboOption) => void
}) {
  const { t } = useTranslation()
  const line = useWatch({ control: form.control, name: `lines.${index}` })
  const request = useApiMutation((v: { name: string; brand: string }) => createProductRequest(v.name, v.brand, invoiceId), {
    successKey: 'upload.requestSent',
    invalidate: [],
  })
  const error = form.formState.errors.lines?.[index]?.productName?.message
  return (
    <div className="min-w-56 space-y-1.5">
      <Combobox
        id={`line-${index}-product`}
        aria-label={`${t('upload.cols.product')} ${index + 1}`}
        options={options}
        inputValue={line.productName}
        placeholder={t('upload.selectProduct')}
        invalid={!line.productId}
        onInputChange={(text) => {
          form.setValue(`lines.${index}.productName`, text, { shouldValidate: !!error })
          form.setValue(`lines.${index}.productId`, '')
          form.setValue(`lines.${index}.coverage`, '')
        }}
        onSelect={onSelect}
      />
      {error && <p className="text-xs text-danger">{t(error)}</p>}
      {!line.productId && line.productName && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="warning" title={t('upload.unknownHint')}>
            <TriangleAlert aria-hidden /> {t('upload.unknownProduct')}
          </Badge>
          {line.requested ? (
            <Badge tone="info">{t('upload.requested')}</Badge>
          ) : (
            <button
              type="button"
              className="text-xs font-medium text-primary underline-offset-2 hover:underline"
              disabled={request.isPending}
              onClick={() =>
                request.mutate(
                  { name: line.productName, brand: line.brand },
                  { onSuccess: () => form.setValue(`lines.${index}.requested`, true) },
                )
              }
            >
              {t('upload.createRequest')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function useLineTotals(form: Form, index: number) {
  const [packs, packSize, unitCost, unit] = useWatch({
    control: form.control,
    name: [`lines.${index}.packs`, `lines.${index}.packSize`, `lines.${index}.unitCost`, `lines.${index}.unit`],
  })
  const { totalQty, totalCost } = lineTotals({ packs, packSize, unitCost })
  return { totalQty, totalCost, unit: unit as Unit }
}

function NumInput({ form, name, label, className }: { form: Form; name: `lines.${number}.${'packs' | 'packSize' | 'unitCost'}`; label: string; className?: string }) {
  const { t } = useTranslation()
  const [, idx, field] = name.split('.')
  const err = form.formState.errors.lines?.[Number(idx)]?.[field as 'packs']?.message
  return (
    <div className={className}>
      <Input type="number" inputMode="decimal" min={0} step="any" aria-label={label} aria-invalid={!!err || undefined} className="tabular min-w-20 text-right" {...form.register(name)} />
      {err && <p className="mt-1 text-xs text-danger">{t(err)}</p>}
    </div>
  )
}

function TextInput({ form, name, label, type = 'text', mono }: { form: Form; name: `lines.${number}.${'batchNo' | 'brand' | 'mfgDate' | 'expiryDate'}`; label: string; type?: string; mono?: boolean }) {
  const { t } = useTranslation()
  const [, idx, field] = name.split('.')
  const err = form.formState.errors.lines?.[Number(idx)]?.[field as 'batchNo']?.message
  return (
    <div>
      <Input type={type} aria-label={label} aria-invalid={!!err || undefined} className={cn(mono && 'font-mono', type === 'date' && 'min-w-36')} {...form.register(name)} />
      {err && <p className="mt-1 text-xs text-danger">{t(err)}</p>}
    </div>
  )
}

function Computed({ form, index, field }: { form: Form; index: number; field: 'qty' | 'cost' }) {
  const v = useLineTotals(form, index)
  return field === 'qty' ? (
    <span className="tabular whitespace-nowrap font-semibold">{formatQty(v.totalQty, v.unit)}</span>
  ) : (
    <span className="tabular whitespace-nowrap font-semibold">{formatINR(v.totalCost, true)}</span>
  )
}

function Coverage({ form, index }: { form: Form; index: number }) {
  const coverage = useWatch({ control: form.control, name: `lines.${index}.coverage` })
  return <>{coverage || '—'}</>
}

export function LineItemsEditor({ form, invoiceId }: { form: Form; invoiceId: string | null }) {
  const { t } = useTranslation()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { data: products } = useProducts()
  const { fields, append, remove, insert } = useFieldArray({ control: form.control, name: 'lines', keyName: 'key' })
  const { selectProduct } = useLineHelpers(form, products)
  const options = React.useMemo<ComboOption[]>(
    () => (products ?? []).map((p) => ({ value: p.id, label: p.name, sublabel: `${p.brand} · ${p.sku}` })),
    [products],
  )

  const split = (index: number) => {
    const line = form.getValues(`lines.${index}`)
    const packs = toNumber(line.packs) || 0
    const first = Math.ceil(packs / 2)
    form.setValue(`lines.${index}.packs`, String(first))
    insert(index + 1, { ...line, id: `${line.id}-b`, packs: String(Math.max(packs - first, 1)), batchNo: '' }, { shouldFocus: false })
    window.setTimeout(() => document.getElementById(`line-${index + 1}-batch`)?.focus(), 50)
  }

  const unitOptions = UNITS.map((u) => ({ value: u, label: unitLabel(u) }))
  const c = (k: string) => t(`upload.cols.${k}`)
  const rowLabel = (i: number) => t('upload.mobileItem', { n: i + 1 })

  const rowActions = (index: number) => (
    <div className="flex gap-0.5">
      <Button type="button" variant="ghost" size="icon" onClick={() => split(index)} aria-label={`${t('upload.splitBatch')} – ${rowLabel(index)}`} title={t('upload.splitBatch')}>
        <Split />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-danger hover:bg-danger-soft"
        onClick={() => remove(index)}
        disabled={fields.length <= 1}
        aria-label={`${t('upload.removeItem')} – ${rowLabel(index)}`}
        title={t('upload.removeItem')}
      >
        <Trash2 />
      </Button>
    </div>
  )

  return (
    <div>
      {isDesktop ? (
        <TableWrap className="rounded-lg border">
          <Table className="min-w-[1500px]">
            <THead>
              <tr>
                <TH className="w-8">{t('common.serial')}</TH>
                <TH>{c('product')}</TH>
                <TH>{c('brand')}</TH>
                <TH>{c('batchNo')}</TH>
                <TH>{c('mfgDate')}</TH>
                <TH>{c('expiryDate')}</TH>
                <TH className="text-right">{c('packs')}</TH>
                <TH className="text-right">{c('packSize')}</TH>
                <TH className="text-right">{c('totalQty')}</TH>
                <TH>{c('unit')}</TH>
                <TH className="text-right">{c('unitCost')}</TH>
                <TH className="text-right">{c('totalCost')}</TH>
                <TH>{c('coverage')}</TH>
                <TH className="text-right">{c('action')}</TH>
              </tr>
            </THead>
            <TBody>
              {fields.map((f, i) => (
                <TR key={f.key} className="align-top hover:bg-transparent [&>td]:align-top">
                  <TD className="tabular pt-5 text-muted-foreground">{i + 1}</TD>
                  <TD>
                    <ProductCell form={form} index={i} options={options} invoiceId={invoiceId} onSelect={(o) => selectProduct(i, o)} />
                  </TD>
                  <TD className="min-w-32">
                    <TextInput form={form} name={`lines.${i}.brand`} label={`${c('brand')} ${i + 1}`} />
                  </TD>
                  <TD className="min-w-40">
                    <div>
                      <Input id={`line-${i}-batch`} aria-label={`${c('batchNo')} ${i + 1}`} className="font-mono" aria-invalid={!!form.formState.errors.lines?.[i]?.batchNo || undefined} {...form.register(`lines.${i}.batchNo`)} />
                      {form.formState.errors.lines?.[i]?.batchNo && <p className="mt-1 text-xs text-danger">{t(form.formState.errors.lines?.[i]?.batchNo?.message ?? '')}</p>}
                    </div>
                  </TD>
                  <TD>
                    <TextInput form={form} name={`lines.${i}.mfgDate`} label={`${c('mfgDate')} ${i + 1}`} type="date" />
                  </TD>
                  <TD>
                    <TextInput form={form} name={`lines.${i}.expiryDate`} label={`${c('expiryDate')} ${i + 1}`} type="date" />
                  </TD>
                  <TD>
                    <NumInput form={form} name={`lines.${i}.packs`} label={`${c('packs')} ${i + 1}`} />
                  </TD>
                  <TD>
                    <NumInput form={form} name={`lines.${i}.packSize`} label={`${c('packSize')} ${i + 1}`} />
                  </TD>
                  <TD className="pt-5 text-right">
                    <Computed form={form} index={i} field="qty" />
                  </TD>
                  <TD className="w-28">
                    <Select aria-label={`${c('unit')} ${i + 1}`} options={unitOptions} {...form.register(`lines.${i}.unit`)} />
                  </TD>
                  <TD className="min-w-32">
                    <NumInput form={form} name={`lines.${i}.unitCost`} label={`${c('unitCost')} ${i + 1}`} />
                  </TD>
                  <TD className="pt-5 text-right">
                    <Computed form={form} index={i} field="cost" />
                  </TD>
                  <TD className="max-w-40 pt-5 text-xs text-muted-foreground">
                    <Coverage form={form} index={i} />
                  </TD>
                  <TD className="text-right">{rowActions(i)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      ) : (
        <ul className="space-y-3">
          {fields.map((f, i) => (
            <li key={f.key} className="rounded-lg border bg-surface p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">{rowLabel(i)}</p>
                {rowActions(i)}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">{c('product')}</p>
                  <ProductCell form={form} index={i} options={options} invoiceId={invoiceId} onSelect={(o) => selectProduct(i, o)} />
                </div>
                <Field label={c('brand')} htmlFor={`m-${i}-brand`}>
                  <Input id={`m-${i}-brand`} {...form.register(`lines.${i}.brand`)} />
                </Field>
                <Field label={c('batchNo')} htmlFor={`line-${i}-batch`} error={form.formState.errors.lines?.[i]?.batchNo?.message ? t(form.formState.errors.lines?.[i]?.batchNo?.message ?? '') : undefined}>
                  <Input id={`line-${i}-batch`} className="font-mono" {...form.register(`lines.${i}.batchNo`)} />
                </Field>
                <Field label={c('mfgDate')} htmlFor={`m-${i}-mfg`}>
                  <Input id={`m-${i}-mfg`} type="date" {...form.register(`lines.${i}.mfgDate`)} />
                </Field>
                <Field label={c('expiryDate')} htmlFor={`m-${i}-exp`} error={form.formState.errors.lines?.[i]?.expiryDate?.message ? t(form.formState.errors.lines?.[i]?.expiryDate?.message ?? '') : undefined}>
                  <Input id={`m-${i}-exp`} type="date" {...form.register(`lines.${i}.expiryDate`)} />
                </Field>
                <div>
                  <p className="mb-1.5 text-sm font-medium">{c('packs')}</p>
                  <NumInput form={form} name={`lines.${i}.packs`} label={c('packs')} />
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-medium">{c('packSize')}</p>
                  <NumInput form={form} name={`lines.${i}.packSize`} label={c('packSize')} />
                </div>
                <Field label={c('unit')} htmlFor={`m-${i}-unit`}>
                  <Select id={`m-${i}-unit`} options={unitOptions} {...form.register(`lines.${i}.unit`)} />
                </Field>
                <div>
                  <p className="mb-1.5 text-sm font-medium">{c('unitCost')}</p>
                  <NumInput form={form} name={`lines.${i}.unitCost`} label={c('unitCost')} />
                </div>
                <div className="col-span-2 flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
                  <span>
                    <span className="text-muted-foreground">{c('totalQty')}: </span>
                    <Computed form={form} index={i} field="qty" />
                  </span>
                  <span>
                    <span className="text-muted-foreground">{c('totalCost')}: </span>
                    <Computed form={form} index={i} field="cost" />
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Button type="button" variant="soft" className="mt-3" onClick={() => append(emptyLine())}>
        <Plus /> {t('upload.addItem')}
      </Button>
    </div>
  )
}

export function BillSummary({ form }: { form: Form }) {
  const { t } = useTranslation()
  const [lines, tax, freight, discount, bill] = useWatch({
    control: form.control,
    name: ['lines', 'taxAmount', 'freight', 'discount', 'billAmount'],
  })
  const totals = (lines as LineValues[]).map((l) => ({ ...lineTotals(l), unit: l.unit as Unit }))
  const linesTotal = round2(totals.reduce((s, l) => s + l.totalCost, 0))
  const computed = round2(linesTotal + (toNumber(tax) || 0) + (toNumber(freight) || 0) - (toNumber(discount) || 0))
  const billNum = toNumber(bill) || 0
  const mismatch = Math.abs(computed - billNum) > 1

  const byUnit = new Map<Unit, { qty: number; cost: number }>()
  for (const l of totals) {
    const e = byUnit.get(l.unit) ?? { qty: 0, cost: 0 }
    byUnit.set(l.unit, { qty: e.qty + l.totalQty, cost: e.cost + l.totalCost })
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-lg border bg-muted/40 p-4">
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('upload.linesTotal')}</dt>
            <dd className="tabular font-semibold">{formatINR(linesTotal, true)}</dd>
          </div>
          {[...byUnit.entries()].map(([unit, v]) => (
            <div key={unit} className="flex justify-between text-xs">
              <dt className="text-muted-foreground">
                {formatQty(round2(v.qty), unit)} · {t('upload.costPerUnit', { unit: unitLabel(unit) })}
              </dt>
              <dd className="tabular">{v.qty ? formatINR(round2(v.cost / v.qty), true) : '—'}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className={cn('rounded-lg border p-4 text-sm', mismatch ? 'border-warning/40 bg-warning-soft' : 'bg-success-soft/50')} role="status">
        <p className="tabular">
          {t('upload.billAmount')}: <strong>{formatINR(billNum, true)}</strong>
        </p>
        {mismatch ? (
          <p className="mt-1 flex items-start gap-1.5 text-warning">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t('upload.mismatch', { computed: formatINR(computed, true), bill: formatINR(billNum, true) })}
          </p>
        ) : (
          <p className="mt-1 text-success">✓ {t('upload.amountMatches')}</p>
        )}
      </div>
    </div>
  )
}

export function InvoiceFields({ form, invoiceId }: { form: Form; invoiceId: string | null }) {
  const { t } = useTranslation()
  const { data: sites } = useSites()
  const { register, formState } = form
  const invoiceNo = useWatch({ control: form.control, name: 'invoiceNo' })
  const duplicate = invoiceNo ? findDuplicateInvoice('', invoiceNo, invoiceId ?? undefined) : null
  const err = (k: keyof ReviewValues) => {
    const m = formState.errors[k]?.message
    return typeof m === 'string' ? t(m) : undefined
  }
  const money = (name: 'billAmount' | 'taxAmount' | 'freight' | 'discount') => (
    <Field label={t(`upload.${name}`)} htmlFor={`inv-${name}`} error={err(name)} required={name === 'billAmount'}>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{CURRENCY_SYMBOL}</span>
        <Input id={`inv-${name}`} type="number" inputMode="decimal" min={0} step="any" className="tabular pl-7" {...register(name)} />
      </div>
    </Field>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('upload.invoiceDetails')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {duplicate && (
          <p role="alert" className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning-soft px-3 py-2 text-sm text-warning">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {t('upload.duplicateInvoice', { invoiceNo: duplicate })}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t('upload.vendor')} htmlFor="inv-vendor" error={err('vendorName')} required>
            <Input id="inv-vendor" {...register('vendorName')} />
          </Field>
          <Field label={t('upload.invoiceNo')} htmlFor="inv-no" error={err('invoiceNo')} required>
            <Input id="inv-no" className="font-mono" {...register('invoiceNo')} />
          </Field>
          <Field label={t('upload.invoiceDate')} htmlFor="inv-date" error={err('invoiceDate')} required>
            <Input id="inv-date" type="date" {...register('invoiceDate')} />
          </Field>
          <Field label={t('upload.gstNumber')} htmlFor="inv-gst" error={err('gstNumber')}>
            <Input id="inv-gst" className="font-mono uppercase" maxLength={15} {...register('gstNumber')} />
          </Field>
          <Field label={t('upload.siteStore')} htmlFor="inv-site" error={err('siteId')} required className="lg:col-span-2">
            <Select id="inv-site" options={(sites ?? []).map((s) => ({ value: s.id, label: `${s.name} · ${s.storeName}` }))} {...register('siteId')} />
          </Field>
          {money('billAmount')}
          {money('taxAmount')}
          {money('freight')}
          {money('discount')}
        </div>
      </CardContent>
    </Card>
  )
}

export function LineItemsCard({ form, invoiceId }: { form: Form; invoiceId: string | null }) {
  const { t } = useTranslation()
  const linesError = form.formState.errors.lines?.root?.message ?? form.formState.errors.lines?.message
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{t('upload.lineItems')}</CardTitle>
          <CardDescription className="flex items-center gap-1">
            <CircleHelp className="size-3.5" aria-hidden /> {t('upload.lineItemsHint')}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {linesError && <p role="alert" className="text-sm font-medium text-danger">{t(linesError)}</p>}
        <LineItemsEditor form={form} invoiceId={invoiceId} />
        <BillSummary form={form} />
      </CardContent>
    </Card>
  )
}
