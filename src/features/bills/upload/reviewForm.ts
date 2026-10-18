import { z } from 'zod'
import type { BillDraftInput, Invoice, InvoiceLineItem, Unit } from '@/types'
import { round2 } from '@/utils/calc'
import { uid } from '@/lib/utils'

const n = (v: string) => (v.trim() === '' ? NaN : Number(v))
const positive = z.string().refine((v) => n(v) > 0, 'validation.positive')
const nonNegative = z.string().refine((v) => v.trim() === '' || n(v) >= 0, 'validation.nonNegative')

export const lineSchema = z
  .object({
    id: z.string(),
    productId: z.string(),
    productName: z.string().trim().min(1, 'validation.required'),
    brand: z.string(),
    batchNo: z.string().trim().min(1, 'validation.required'),
    mfgDate: z.string(),
    expiryDate: z.string(),
    packs: positive,
    packSize: positive,
    unit: z.string(),
    unitCost: nonNegative,
    coverage: z.string(),
    requested: z.boolean(),
  })
  .refine((l) => !l.mfgDate || !l.expiryDate || l.expiryDate > l.mfgDate, {
    path: ['expiryDate'],
    message: 'validation.expiryAfterMfg',
  })

export const reviewSchema = z.object({
  vendorName: z.string().trim().min(1, 'validation.required'),
  invoiceNo: z.string().trim().min(1, 'validation.required'),
  invoiceDate: z.string().min(1, 'validation.required'),
  gstNumber: z.string().trim().refine((v) => v === '' || v.length === 15, 'validation.gst'),
  siteId: z.string().min(1, 'validation.required'),
  billAmount: nonNegative,
  taxAmount: nonNegative,
  freight: nonNegative,
  discount: nonNegative,
  lines: z.array(lineSchema).min(1, 'upload.noLinesError'),
})

export type ReviewValues = z.infer<typeof reviewSchema>
export type LineValues = z.infer<typeof lineSchema>

const s = (v: number | null | undefined) => (v === null || v === undefined || Number.isNaN(v) ? '' : String(v))

export function lineToValues(l: InvoiceLineItem): LineValues {
  return {
    id: l.id,
    productId: l.productId ?? '',
    productName: l.productName,
    brand: l.brand,
    batchNo: l.batchNo,
    mfgDate: l.mfgDate ?? '',
    expiryDate: l.expiryDate ?? '',
    packs: s(l.packs),
    packSize: s(l.packSize),
    unit: l.unit,
    unitCost: s(l.unitCost),
    coverage: l.coverage,
    requested: false,
  }
}

export function invoiceToValues(inv: Invoice): ReviewValues {
  return {
    vendorName: inv.vendorName,
    invoiceNo: inv.invoiceNo,
    invoiceDate: inv.invoiceDate,
    gstNumber: inv.gstNumber,
    siteId: inv.siteId,
    billAmount: s(inv.billAmount),
    taxAmount: s(inv.taxAmount),
    freight: s(inv.freight),
    discount: s(inv.discount),
    lines: inv.lineItems.map(lineToValues),
  }
}

export function emptyLine(): LineValues {
  return {
    id: uid('li'),
    productId: '',
    productName: '',
    brand: '',
    batchNo: '',
    mfgDate: '',
    expiryDate: '',
    packs: '1',
    packSize: '1',
    unit: 'kg',
    unitCost: '0',
    coverage: '',
    requested: false,
  }
}

/** Pack → base-unit conversion and cost totals */
export function lineTotals(l: Pick<LineValues, 'packs' | 'packSize' | 'unitCost'>) {
  const totalQty = round2((n(l.packs) || 0) * (n(l.packSize) || 0))
  const totalCost = round2(totalQty * (n(l.unitCost) || 0))
  return { totalQty, totalCost }
}

export function valuesToDraft(v: ReviewValues): BillDraftInput {
  return {
    header: {
      vendorName: v.vendorName.trim(),
      invoiceNo: v.invoiceNo.trim(),
      invoiceDate: v.invoiceDate,
      gstNumber: v.gstNumber.trim().toUpperCase(),
      siteId: v.siteId,
      billAmount: n(v.billAmount) || 0,
      taxAmount: n(v.taxAmount) || 0,
      freight: n(v.freight) || 0,
      discount: n(v.discount) || 0,
    },
    lineItems: v.lines.map((l) => {
      const { totalQty, totalCost } = lineTotals(l)
      return {
        id: l.id,
        productId: l.productId || null,
        productName: l.productName.trim(),
        brand: l.brand.trim(),
        batchNo: l.batchNo.trim(),
        mfgDate: l.mfgDate || null,
        expiryDate: l.expiryDate || null,
        packs: n(l.packs) || 0,
        packSize: n(l.packSize) || 0,
        totalQty,
        unit: l.unit as Unit,
        unitCost: n(l.unitCost) || 0,
        totalCost,
        coverage: l.coverage,
      }
    }),
  }
}

export const toNumber = n
