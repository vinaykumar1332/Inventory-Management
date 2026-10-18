// Centralised, typed mock API. Every function returns a delayed Promise and a
// deep copy of the data, like a network call would. To integrate a real
// backend, re-implement these functions with fetch() — components and hooks
// stay unchanged.

import { loadExtractionSample, type DemoDb, type ExtractionLine } from '@/data'
import { appConfig, businessConfig } from '@/config'
import i18n from '@/i18n'
import type {
  AdjustmentInput,
  Alert,
  ApproveBillResult,
  BatchRow,
  BillDraftInput,
  CreateSiteInput,
  DamageInput,
  DashboardData,
  Invoice,
  InvoiceLineItem,
  IssueMaterialInput,
  MovementRow,
  MovementType,
  ParsedSheetRow,
  Product,
  ProductBatch,
  ProductDetail,
  ReportFilters,
  ReportId,
  ReportResult,
  ReturnMaterialInput,
  Site,
  SiteSummary,
  StockMovement,
  StockRow,
  ToolCondition,
  ToolRow,
  TransferStockInput,
  Unit,
  UploadBillInput,
  User,
  Vendor,
} from '@/types'
import { can, type Permission } from '@/lib/permissions'
import { uid } from '@/lib/utils'
import { expiryBucket, fefoSort, isExpired, round2 } from '@/utils/calc'
import { addMonthsIso, daysUntil, isoDaysFromNow, nowIso, todayIso } from '@/utils/date'
import { coverageLabel } from '@/utils/format'
import { commit, getDb, resetDb } from './db'
import { clearSession, getSession, setSession } from './session'
import { releaseAllFiles } from './fileCache'
import {
  accessibleSiteIds,
  buildAlerts,
  buildDashboard,
  buildSiteSummaries,
  buildStockRows,
  buildToolRows,
} from './selectors'

/** Error whose message is an i18n key, so the UI can translate it. */
export class ApiError extends Error {
  constructor(
    public readonly key: string,
    public readonly params: Record<string, string | number> = {},
  ) {
    super(key)
    this.name = 'ApiError'
  }
}

const delay = (min = appConfig.demo.apiDelayMs.min, max = appConfig.demo.apiDelayMs.max) =>
  new Promise<void>((resolve) => setTimeout(resolve, min + Math.random() * (max - min)))

const clone = <T,>(value: T): T => structuredClone(value)

function currentUser(db: DemoDb): User {
  const session = getSession()
  const user = session && db.users.find((u) => u.id === session.userId)
  if (!user) throw new ApiError('errors.sessionExpired')
  return user
}

function authorize(db: DemoDb, permission?: Permission) {
  const user = currentUser(db)
  if (permission && !can(user.role, permission)) throw new ApiError('errors.forbidden')
  return { user, siteIds: accessibleSiteIds(db, user) }
}

function assertSite(siteIds: string[], siteId: string) {
  if (!siteIds.includes(siteId)) throw new ApiError('errors.forbidden')
}

function audit(db: DemoDb, userId: string, action: string, entity: string, entityId: string, details: string) {
  db.auditLogs.unshift({ id: uid('a'), at: nowIso(), userId, action, entity, entityId, details })
}

function siteName(db: DemoDb, id: string) {
  return db.sites.find((s) => s.id === id)?.name ?? ''
}

function getBatchOrThrow(db: DemoDb, batchId: string, siteId: string, productId: string) {
  const batch = db.batches.find((b) => b.id === batchId)
  if (!batch || batch.siteId !== siteId || batch.productId !== productId) throw new ApiError('errors.batchNotFound')
  return batch
}

/** The only way stock changes: every quantity change writes a movement record. */
function recordMovement(db: DemoDb, movement: Omit<StockMovement, 'id' | 'date'>, batch: ProductBatch) {
  const signed = movement.direction * movement.qty
  if (batch.qtyAvailable + signed < -0.0001) throw new ApiError('errors.insufficientStock')
  batch.qtyAvailable = round2(batch.qtyAvailable + signed)
  const record: StockMovement = { ...movement, id: uid('m'), date: nowIso() }
  db.movements.unshift(record)
  return record
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export async function login(email: string): Promise<User> {
  await delay(500, 900)
  const db = getDb()
  const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
  if (!user) throw new ApiError('auth.unknownUser')
  setSession(user.id)
  audit(db, user.id, 'login', 'session', user.id, i18n.t('system.signedIn'))
  commit()
  return clone(user)
}

/** Demo accounts shown as quick-login buttons (emails configured in app.json). */
export async function getDemoAccounts(): Promise<User[]> {
  const db = getDb()
  return clone(
    appConfig.demo.quickLoginEmails
      .map((email) => db.users.find((u) => u.email === email))
      .filter((u): u is User => !!u),
  )
}

export async function getCompany() {
  await delay(150, 300)
  const db = getDb()
  authorize(db)
  return clone(db.company)
}

export async function logout() {
  clearSession()
}

export function getCurrentUserSync(): User | null {
  const session = getSession()
  return session ? (getDb().users.find((u) => u.id === session.userId) ?? null) : null
}

export async function getUsers(): Promise<User[]> {
  await delay(200, 400)
  const db = getDb()
  authorize(db)
  return clone(db.users)
}

export async function resetDemoData() {
  await delay(400, 600)
  releaseAllFiles()
  resetDb()
}

/* ------------------------------------------------------------------ */
/* Dashboard, sites                                                    */
/* ------------------------------------------------------------------ */

export async function getDashboard(siteId: string | 'all' = 'all'): Promise<DashboardData> {
  await delay(500, 900)
  const db = getDb()
  const { siteIds } = authorize(db)
  const scope = siteId === 'all' ? siteIds : siteIds.filter((id) => id === siteId)
  return clone(buildDashboard(db, scope))
}

export async function getSites(): Promise<SiteSummary[]> {
  await delay()
  const db = getDb()
  const { siteIds } = authorize(db)
  return clone(buildSiteSummaries(db, siteIds))
}

export async function getSite(id: string): Promise<SiteSummary> {
  await delay(250, 500)
  const db = getDb()
  const { siteIds } = authorize(db)
  assertSite(siteIds, id)
  const site = buildSiteSummaries(db, [id])[0]
  if (!site) throw new ApiError('errors.notFound')
  return clone(site)
}

export async function createSite(input: CreateSiteInput): Promise<Site> {
  await delay(500, 800)
  const db = getDb()
  const { user } = authorize(db, 'manage_sites')
  if (db.sites.some((s) => s.code.toLowerCase() === input.code.trim().toLowerCase())) {
    throw new ApiError('errors.duplicateSiteCode')
  }
  const site: Site = {
    id: uid('s'),
    companyId: db.company.id,
    companyName: input.companyName,
    name: input.name.trim(),
    code: input.code.trim().toUpperCase(),
    city: input.city.trim(),
    address: input.address.trim(),
    managerId: input.managerId,
    storekeeperId: input.storekeeperId,
    startDate: input.startDate,
    endDate: input.endDate,
    storeName: input.storeName.trim(),
    status: 'active',
    progress: 0,
  }
  db.sites.push(site)
  for (const u of db.users) {
    if ((u.id === input.managerId || u.id === input.storekeeperId) && u.siteIds.length > 0) u.siteIds.push(site.id)
  }
  audit(db, user.id, 'site_created', 'site', site.id, site.name)
  commit()
  return clone(site)
}

/* ------------------------------------------------------------------ */
/* Products & stock                                                    */
/* ------------------------------------------------------------------ */

export async function getProducts(): Promise<Product[]> {
  await delay(200, 400)
  const db = getDb()
  authorize(db)
  return clone(db.products)
}

export async function getVendors(): Promise<Vendor[]> {
  await delay(150, 300)
  const db = getDb()
  authorize(db)
  return clone(db.vendors)
}

export async function getStock(siteId: string | 'all' = 'all'): Promise<StockRow[]> {
  await delay()
  const db = getDb()
  const { siteIds } = authorize(db)
  const scope = siteId === 'all' ? siteIds : siteIds.filter((id) => id === siteId)
  return clone(buildStockRows(db, scope))
}

export async function getProductById(id: string, siteId: string | 'all' = 'all'): Promise<ProductDetail> {
  await delay(300, 600)
  const db = getDb()
  const { siteIds } = authorize(db)
  const scope = siteId === 'all' ? siteIds : siteIds.filter((s) => s === siteId)
  const product = db.products.find((p) => p.id === id)
  if (!product) throw new ApiError('errors.notFound')
  const batches = db.batches
    .filter((b) => b.productId === id && scope.includes(b.siteId))
    .map((b) => ({ ...b, siteName: siteName(db, b.siteId) }))
    .sort((a, b) => (a.expiryDate ?? '9999').localeCompare(b.expiryDate ?? '9999'))
  const live = batches.filter((b) => b.qtyAvailable > 0)
  return clone({
    product,
    batches,
    movements: db.movements.filter((m) => m.productId === id && scope.includes(m.siteId)).slice(0, 40),
    totalAvailable: round2(live.reduce((s, b) => s + b.qtyAvailable, 0)),
    totalValue: round2(live.reduce((s, b) => s + b.qtyAvailable * b.unitCost, 0)),
  })
}

export async function getBatches(filter: { siteId?: string; productId?: string } = {}): Promise<BatchRow[]> {
  await delay(200, 450)
  const db = getDb()
  const { siteIds } = authorize(db)
  const list = db.batches.filter(
    (b) =>
      siteIds.includes(b.siteId) &&
      (!filter.siteId || b.siteId === filter.siteId) &&
      (!filter.productId || b.productId === filter.productId),
  )
  const suggestedIds = new Set<string>()
  if (filter.siteId && filter.productId) {
    const first = fefoSort(list)[0]
    if (first) suggestedIds.add(first.id)
  }
  return clone(
    list
      .map((b) => {
        const p = db.products.find((x) => x.id === b.productId)
        return {
          ...b,
          productName: p?.name ?? '',
          brand: p?.brand ?? '',
          unit: p?.baseUnit ?? ('kg' as Unit),
          siteName: siteName(db, b.siteId),
          expiryBucket: expiryBucket(b.expiryDate),
          suggested: suggestedIds.has(b.id),
        }
      })
      .sort((a, b) => (a.expiryDate ?? '9999').localeCompare(b.expiryDate ?? '9999')),
  )
}

export async function getMovements(filter: { siteId?: string; productId?: string; type?: MovementType; invoiceId?: string; limit?: number } = {}): Promise<MovementRow[]> {
  await delay(250, 500)
  const db = getDb()
  const { siteIds } = authorize(db)
  const rows = db.movements
    .filter(
      (m) =>
        (siteIds.includes(m.siteId) || (m.toSiteId && siteIds.includes(m.toSiteId))) &&
        (!filter.siteId || m.siteId === filter.siteId || m.toSiteId === filter.siteId) &&
        (!filter.productId || m.productId === filter.productId) &&
        (!filter.type || m.type === filter.type) &&
        (!filter.invoiceId || m.invoiceId === filter.invoiceId),
    )
    .slice(0, filter.limit ?? 500)
    .map((m) => {
      const p = db.products.find((x) => x.id === m.productId)
      return {
        ...m,
        productName: p?.name ?? '',
        unit: p?.baseUnit ?? ('kg' as Unit),
        userName: db.users.find((u) => u.id === m.userId)?.name ?? '',
        siteName: siteName(db, m.siteId),
      }
    })
  return clone(rows)
}

export async function issueMaterial(input: IssueMaterialInput): Promise<StockMovement> {
  await delay(500, 800)
  const db = getDb()
  const { user, siteIds } = authorize(db, 'issue_material')
  assertSite(siteIds, input.siteId)
  const batch = getBatchOrThrow(db, input.batchId, input.siteId, input.productId)
  if (isExpired(batch) && !batch.expiryOverride) throw new ApiError('errors.batchExpired')
  if (input.qty <= 0) throw new ApiError('errors.invalidQty')
  const site = db.sites.find((s) => s.id === input.siteId) as Site
  const mv = recordMovement(
    db,
    {
      type: 'issue',
      productId: input.productId,
      batchId: batch.id,
      batchNo: batch.batchNo,
      qty: input.qty,
      direction: -1,
      userId: user.id,
      siteId: input.siteId,
      source: site.storeName,
      destination: input.workArea,
      reason: input.notes || i18n.t('system.issuedForApplication'),
      workArea: input.workArea,
      areaM2: input.areaM2 ?? undefined,
      coats: input.coats ?? undefined,
      expectedQty: input.expectedQty ?? undefined,
      value: round2(input.qty * batch.unitCost),
    },
    batch,
  )
  audit(db, user.id, 'material_issued', 'batch', batch.id, `${input.qty} → ${input.workArea}`)
  commit()
  return clone(mv)
}

export async function returnMaterial(input: ReturnMaterialInput): Promise<StockMovement> {
  await delay(500, 800)
  const db = getDb()
  const { user, siteIds } = authorize(db, 'return_material')
  assertSite(siteIds, input.siteId)
  const batch = getBatchOrThrow(db, input.batchId, input.siteId, input.productId)
  if (input.qty <= 0) throw new ApiError('errors.invalidQty')
  const site = db.sites.find((s) => s.id === input.siteId) as Site
  const mv = recordMovement(
    db,
    {
      type: 'return',
      productId: input.productId,
      batchId: batch.id,
      batchNo: batch.batchNo,
      qty: input.qty,
      direction: 1,
      userId: user.id,
      siteId: input.siteId,
      source: input.workArea,
      destination: site.storeName,
      reason: input.reason,
      value: round2(input.qty * batch.unitCost),
    },
    batch,
  )
  audit(db, user.id, 'material_returned', 'batch', batch.id, `${input.qty}`)
  commit()
  return clone(mv)
}

export async function transferStock(input: TransferStockInput): Promise<StockMovement> {
  await delay(600, 900)
  const db = getDb()
  const { user, siteIds } = authorize(db, 'transfer_stock')
  assertSite(siteIds, input.fromSiteId)
  if (input.fromSiteId === input.toSiteId) throw new ApiError('errors.sameSite')
  const from = getBatchOrThrow(db, input.batchId, input.fromSiteId, input.productId)
  if (input.qty <= 0) throw new ApiError('errors.invalidQty')
  if (input.qty > from.qtyAvailable) throw new ApiError('errors.insufficientStock')
  const fromSite = db.sites.find((s) => s.id === input.fromSiteId) as Site
  const toSite = db.sites.find((s) => s.id === input.toSiteId)
  if (!toSite) throw new ApiError('errors.notFound')
  let to = db.batches.find(
    (b) => b.siteId === input.toSiteId && b.productId === input.productId && b.batchNo === from.batchNo,
  )
  if (!to) {
    to = { ...from, id: uid('b'), siteId: input.toSiteId, qtyReceived: 0, qtyAvailable: 0, receivedAt: nowIso() }
    db.batches.push(to)
  }
  const mv = recordMovement(
    db,
    {
      type: 'transfer',
      productId: input.productId,
      batchId: from.id,
      batchNo: from.batchNo,
      qty: input.qty,
      direction: -1,
      userId: user.id,
      siteId: input.fromSiteId,
      toSiteId: input.toSiteId,
      source: `${fromSite.name} · ${fromSite.storeName}`,
      destination: `${toSite.name} · ${toSite.storeName}`,
      reason: input.reason,
      value: round2(input.qty * from.unitCost),
    },
    from,
  )
  to.qtyReceived = round2(to.qtyReceived + input.qty)
  to.qtyAvailable = round2(to.qtyAvailable + input.qty)
  audit(db, user.id, 'stock_transferred', 'batch', from.id, `${input.qty} → ${toSite.name}`)
  commit()
  return clone(mv)
}

export async function reportDamage(input: DamageInput): Promise<StockMovement> {
  await delay(500, 800)
  const db = getDb()
  const { user, siteIds } = authorize(db, 'report_damage')
  assertSite(siteIds, input.siteId)
  const batch = getBatchOrThrow(db, input.batchId, input.siteId, input.productId)
  if (input.qty <= 0) throw new ApiError('errors.invalidQty')
  const site = db.sites.find((s) => s.id === input.siteId) as Site
  const mv = recordMovement(
    db,
    {
      type: 'damage',
      productId: input.productId,
      batchId: batch.id,
      batchNo: batch.batchNo,
      qty: input.qty,
      direction: -1,
      userId: user.id,
      siteId: input.siteId,
      source: site.storeName,
      destination: i18n.t('system.scrap'),
      reason: `[${input.kind}] ${input.reason}`,
      value: round2(input.qty * batch.unitCost),
    },
    batch,
  )
  audit(db, user.id, 'damage_reported', 'batch', batch.id, input.reason)
  commit()
  return clone(mv)
}

export async function adjustStock(input: AdjustmentInput): Promise<StockMovement> {
  await delay(500, 800)
  const db = getDb()
  const { user, siteIds } = authorize(db, 'stock_adjustment')
  assertSite(siteIds, input.siteId)
  const batch = getBatchOrThrow(db, input.batchId, input.siteId, input.productId)
  if (input.qty <= 0) throw new ApiError('errors.invalidQty')
  const site = db.sites.find((s) => s.id === input.siteId) as Site
  const mv = recordMovement(
    db,
    {
      type: 'adjustment',
      productId: input.productId,
      batchId: batch.id,
      batchNo: batch.batchNo,
      qty: input.qty,
      direction: input.direction,
      userId: user.id,
      siteId: input.siteId,
      source: input.direction === 1 ? i18n.t('system.physicalCount') : site.storeName,
      destination: input.direction === 1 ? site.storeName : i18n.t('system.physicalCount'),
      reason: input.reason,
      value: round2(input.qty * batch.unitCost),
    },
    batch,
  )
  audit(db, user.id, 'stock_adjusted', 'batch', batch.id, input.reason)
  commit()
  return clone(mv)
}

/* ------------------------------------------------------------------ */
/* Bills                                                               */
/* ------------------------------------------------------------------ */

export async function getBills(): Promise<Invoice[]> {
  await delay()
  const db = getDb()
  const { siteIds } = authorize(db, 'view_bills')
  return clone(db.invoices.filter((i) => siteIds.includes(i.siteId) && !i.archived))
}

export async function getBill(id: string): Promise<Invoice> {
  await delay(250, 450)
  const db = getDb()
  const { siteIds } = authorize(db, 'view_bills')
  const inv = db.invoices.find((i) => i.id === id)
  if (!inv) throw new ApiError('errors.notFound')
  assertSite(siteIds, inv.siteId)
  return clone(inv)
}

/** Returns the existing invoice number if this file / invoice looks like a duplicate. */
export function findDuplicateInvoice(fileName: string, invoiceNo?: string, excludeId?: string): string | null {
  const db = getDb()
  const hit = db.invoices.find(
    (i) =>
      !i.archived &&
      i.id !== excludeId &&
      i.status !== 'rejected' &&
      ((!!fileName && i.fileName.toLowerCase() === fileName.toLowerCase()) ||
        (!!invoiceNo && i.invoiceNo.toLowerCase() === invoiceNo.toLowerCase())),
  )
  return hit?.invoiceNo ?? null
}

export async function uploadBill(input: UploadBillInput): Promise<Invoice> {
  await delay(700, 1100)
  const db = getDb()
  const { user, siteIds } = authorize(db, 'upload_bills')
  assertSite(siteIds, input.siteId)
  const invoice: Invoice = {
    id: uid('inv'),
    vendorId: null,
    vendorName: '',
    invoiceNo: '',
    invoiceDate: todayIso(),
    gstNumber: '',
    siteId: input.siteId,
    billAmount: 0,
    taxAmount: 0,
    freight: 0,
    discount: 0,
    uploadType: input.uploadType,
    fileName: input.fileName,
    fileSizeKb: input.fileSizeKb,
    uploadedAt: nowIso(),
    uploadedBy: user.id,
    status: 'processing',
    lineItems: [],
    archived: false,
  }
  db.invoices.unshift(invoice)
  audit(db, user.id, 'bill_uploaded', 'invoice', invoice.id, input.fileName)
  commit()
  return clone(invoice)
}

function normalise(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

/** Fuzzy match an extracted description to the Product Master. */
export function matchProduct(products: Product[], name: string, brand = ''): Product | null {
  const n = normalise(`${brand} ${name}`)
  if (!n) return null
  const exact = products.find((p) => normalise(p.sku) === normalise(name))
  if (exact) return exact
  let best: { p: Product; score: number } | null = null
  for (const p of products) {
    const tokens = normalise(p.name).split(' ').filter((t) => t.length > 1)
    const hits = tokens.filter((t) => n.includes(t)).length
    const score = hits / tokens.length + (brand && normalise(p.brand) === normalise(brand) ? 0.2 : 0)
    if (!best || score > best.score) best = { p, score }
  }
  return best && best.score >= businessConfig.bills.productMatchThreshold ? best.p : null
}

function toLine(products: Product[], raw: ExtractionLine): InvoiceLineItem {
  const p = matchProduct(products, raw.name, raw.brand)
  const packSize = raw.packSize || p?.packSize || 1
  const packs = raw.packs || 1
  const totalQty = round2(packs * packSize)
  const unitCost = raw.unitCost ?? p?.costPerBaseUnit ?? 0
  const mfgDate = raw.mfgDate ?? null
  const expiryDate =
    raw.expiryDate ?? (mfgDate && p?.shelfLifeMonths ? addMonthsIso(mfgDate, p.shelfLifeMonths) : null)
  return {
    id: uid('li'),
    productId: p?.id ?? null,
    productName: p?.name ?? raw.name,
    brand: p?.brand ?? raw.brand ?? '',
    batchNo: raw.batchNo ?? '',
    mfgDate,
    expiryDate,
    packs,
    packSize,
    totalQty,
    unit: p?.baseUnit ?? raw.unit ?? 'kg',
    unitCost,
    totalCost: round2(totalQty * unitCost),
    coverage: p ? coverageLabel(p) : '',
  }
}

const HEADER_ALIASES = businessConfig.upload.excelHeaderAliases

function pick(row: ParsedSheetRow, field: keyof typeof HEADER_ALIASES): string | number | undefined {
  for (const alias of HEADER_ALIASES[field]) {
    if (row[alias] !== undefined && row[alias] !== '') return row[alias]
  }
  return undefined
}

function toIsoDate(v: string | number | undefined): string | null {
  if (v === undefined || v === '') return null
  if (typeof v === 'number') {
    // Excel serial date
    const d = new Date(Math.round((v - 25569) * 86400 * 1000))
    return d.toISOString().slice(0, 10)
  }
  const m = String(v).match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  const d = new Date(String(v))
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

/**
 * Simulated extraction. Excel files are genuinely parsed with SheetJS;
 * PDFs and images return a realistic canned result (no OCR in the demo).
 */
export async function extractBill(invoiceId: string, file?: File): Promise<Invoice> {
  const db = getDb()
  const { user } = authorize(db, 'upload_bills')
  const inv = db.invoices.find((i) => i.id === invoiceId)
  if (!inv) throw new ApiError('errors.notFound')

  let meta: Record<string, string> = {}
  let rawLines: ExtractionLine[] = []
  let freight: number = businessConfig.bills.defaultFreight

  if (inv.uploadType === 'excel' && file) {
    const { parseBillWorkbook } = await import('@/utils/excel')
    const parsed = await parseBillWorkbook(file)
    meta = parsed.meta
    rawLines = parsed.rows
      .map((r) => ({
        name: String(pick(r, 'name') ?? ''),
        brand: String(pick(r, 'brand') ?? ''),
        batchNo: String(pick(r, 'batchNo') ?? ''),
        mfgDate: toIsoDate(pick(r, 'mfgDate')),
        expiryDate: toIsoDate(pick(r, 'expiryDate')),
        packs: Number(pick(r, 'packs') ?? 0) || undefined,
        packSize: Number(pick(r, 'packSize') ?? 0) || undefined,
        unitCost: Number(pick(r, 'unitCost') ?? 0) || undefined,
      }))
      .filter((r) => r.name.trim())
  }

  const site = db.sites.find((s) => s.id === inv.siteId)
  const vendor =
    db.vendors.find((v) => meta.vendor && normalise(v.name) === normalise(meta.vendor)) ??
    db.vendors.find((v) => v.city === site?.city) ??
    db.vendors[0]

  if (rawLines.length === 0) {
    // PDFs and photos: canned result from src/data/mock/extractionSample.json
    const sample = loadExtractionSample()
    rawLines = sample.lines
    freight = sample.freight
  }

  // Elegant processing is shown client-side; keep the network part short.
  await delay(300, 500)

  const lineItems = rawLines.map((r) => toLine(db.products, r))
  const subtotal = round2(lineItems.reduce((s, l) => s + l.totalCost, 0))
  const tax = round2(subtotal * businessConfig.bills.defaultTaxRate)
  if (meta.freight) freight = Number(meta.freight) || 0
  const isDuplicateDemo = inv.fileName.toLowerCase().includes(businessConfig.bills.duplicateDemoKeyword)
  const invoiceNo =
    meta['invoice no'] ??
    meta.invoice ??
    (isDuplicateDemo
      ? (db.invoices.find((i) => i.status === 'approved')?.invoiceNo ?? 'SSWT/26-27/0301')
      : `${vendor.name.split(' ').map((w) => w[0]).join('').toUpperCase()}/26-27/${String(Math.floor(500 + Math.random() * 400)).padStart(4, '0')}`)

  Object.assign(inv, {
    vendorId: vendor.id,
    vendorName: meta.vendor ?? vendor.name,
    invoiceNo,
    invoiceDate: toIsoDate(meta['invoice date'] ?? meta.date) ?? isoDaysFromNow(-1),
    gstNumber: meta.gstin ?? meta['gst number'] ?? vendor.gstin,
    billAmount: round2(subtotal + tax + freight),
    taxAmount: tax,
    freight,
    discount: 0,
    lineItems,
    status: 'needs_review',
  } satisfies Partial<Invoice>)
  audit(db, user.id, 'bill_extracted', 'invoice', inv.id, `${lineItems.length} lines`)
  commit()
  return clone(inv)
}

export async function saveBillDraft(invoiceId: string, draft: BillDraftInput): Promise<Invoice> {
  await delay(400, 700)
  const db = getDb()
  const { user, siteIds } = authorize(db, 'upload_bills')
  const inv = db.invoices.find((i) => i.id === invoiceId)
  if (!inv) throw new ApiError('errors.notFound')
  assertSite(siteIds, draft.header.siteId)
  Object.assign(inv, draft.header, { lineItems: draft.lineItems, status: 'needs_review' satisfies Invoice['status'] })
  audit(db, user.id, 'bill_draft_saved', 'invoice', inv.id, inv.invoiceNo)
  commit()
  return clone(inv)
}

export async function approveBill(invoiceId: string, draft: BillDraftInput): Promise<ApproveBillResult> {
  await delay(800, 1200)
  const db = getDb()
  const { user, siteIds } = authorize(db, 'approve_bills')
  const inv = db.invoices.find((i) => i.id === invoiceId)
  if (!inv) throw new ApiError('errors.notFound')
  if (inv.status === 'approved') throw new ApiError('errors.alreadyApproved')
  assertSite(siteIds, draft.header.siteId)
  const matched = draft.lineItems.filter((l) => l.productId)
  if (matched.length === 0) throw new ApiError('errors.noMatchedLines')

  const site = db.sites.find((s) => s.id === draft.header.siteId) as Site
  Object.assign(inv, draft.header, {
    lineItems: draft.lineItems,
    status: 'approved' satisfies Invoice['status'],
    approvedAt: nowIso(),
    approvedBy: user.id,
    vendorId: db.vendors.find((v) => normalise(v.name) === normalise(draft.header.vendorName))?.id ?? inv.vendorId,
  })

  const totalQtyByUnit: Partial<Record<Unit, number>> = {}
  let stockValueAdded = 0
  for (const line of matched) {
    let batch = db.batches.find(
      (b) => b.siteId === site.id && b.productId === line.productId && b.batchNo === line.batchNo,
    )
    if (!batch) {
      batch = {
        id: uid('b'),
        productId: line.productId as string,
        siteId: site.id,
        batchNo: line.batchNo || `AUTO-${Date.now().toString(36).toUpperCase()}`,
        mfgDate: line.mfgDate,
        expiryDate: line.expiryDate,
        qtyReceived: 0,
        qtyAvailable: 0,
        unitCost: line.unitCost,
        invoiceId: inv.id,
        receivedAt: nowIso(),
      }
      db.batches.push(batch)
    }
    batch.qtyReceived = round2(batch.qtyReceived + line.totalQty)
    recordMovement(
      db,
      {
        type: 'receipt',
        productId: batch.productId,
        batchId: batch.id,
        batchNo: batch.batchNo,
        qty: line.totalQty,
        direction: 1,
        userId: user.id,
        siteId: site.id,
        source: draft.header.vendorName,
        destination: site.storeName,
        reason: i18n.t('system.billRef', { invoiceNo: draft.header.invoiceNo }),
        invoiceId: inv.id,
        value: round2(line.totalQty * line.unitCost),
      },
      batch,
    )
    totalQtyByUnit[line.unit] = round2((totalQtyByUnit[line.unit] ?? 0) + line.totalQty)
    stockValueAdded += line.totalQty * line.unitCost
  }
  audit(db, user.id, 'bill_approved', 'invoice', inv.id, `${inv.invoiceNo} · ${matched.length} batches`)
  commit()
  return clone({
    invoice: inv,
    batchesCreated: matched.length,
    itemsHeld: draft.lineItems.length - matched.length,
    totalQtyByUnit,
    stockValueAdded: round2(stockValueAdded),
  })
}

export async function rejectBill(invoiceId: string, reason: string): Promise<void> {
  await delay(400, 700)
  const db = getDb()
  const { user } = authorize(db, 'approve_bills')
  const inv = db.invoices.find((i) => i.id === invoiceId)
  if (!inv) throw new ApiError('errors.notFound')
  inv.status = 'rejected'
  audit(db, user.id, 'bill_rejected', 'invoice', inv.id, reason)
  commit()
}

export async function archiveBill(invoiceId: string): Promise<void> {
  await delay(300, 600)
  const db = getDb()
  const { user } = authorize(db, 'view_bills')
  const inv = db.invoices.find((i) => i.id === invoiceId)
  if (!inv) throw new ApiError('errors.notFound')
  inv.archived = true
  audit(db, user.id, 'bill_archived', 'invoice', inv.id, inv.invoiceNo)
  commit()
}

export async function createProductRequest(name: string, brand: string, invoiceId: string | null): Promise<void> {
  await delay(300, 600)
  const db = getDb()
  const { user } = authorize(db)
  db.productRequests.push({ id: uid('pr'), name, brand, requestedBy: user.id, at: nowIso(), invoiceId })
  audit(db, user.id, 'product_requested', 'product_request', invoiceId ?? '', `${brand} ${name}`)
  commit()
}

/* ------------------------------------------------------------------ */
/* Alerts                                                              */
/* ------------------------------------------------------------------ */

export async function getAlerts(): Promise<Alert[]> {
  await delay(300, 600)
  const db = getDb()
  const { siteIds } = authorize(db)
  return clone(buildAlerts(db, siteIds))
}

export async function updateAlerts(ids: string[], patch: { read?: boolean; resolved?: boolean }): Promise<void> {
  await delay(200, 400)
  const db = getDb()
  authorize(db)
  for (const id of ids) db.alertState[id] = { ...db.alertState[id], ...patch }
  commit()
}

export async function sendReminder(alertId: string): Promise<void> {
  await delay(400, 700)
  const db = getDb()
  const { user } = authorize(db)
  audit(db, user.id, 'reminder_sent', 'alert', alertId, i18n.t('system.reminderSent'))
  db.alertState[alertId] = { ...db.alertState[alertId], read: true }
  commit()
}

/** Super Admin only: allow an expired batch to be issued (e.g. lab-tested OK). */
export async function approveExpiryException(batchId: string): Promise<void> {
  await delay(400, 700)
  const db = getDb()
  const { user } = authorize(db, 'expiry_override')
  const batch = db.batches.find((b) => b.id === batchId)
  if (!batch) throw new ApiError('errors.notFound')
  batch.expiryOverride = true
  audit(db, user.id, 'expiry_override', 'batch', batch.id, batch.batchNo)
  commit()
}

/* ------------------------------------------------------------------ */
/* Tools                                                               */
/* ------------------------------------------------------------------ */

export async function getTools(): Promise<ToolRow[]> {
  await delay()
  const db = getDb()
  const { siteIds } = authorize(db)
  return clone(buildToolRows(db, siteIds))
}

export async function issueTool(toolId: string, input: { issuedTo: string; expectedReturnDate: string; notes: string }) {
  await delay(400, 700)
  const db = getDb()
  const { user, siteIds } = authorize(db, 'manage_tools')
  const tool = db.tools.find((t) => t.id === toolId)
  if (!tool) throw new ApiError('errors.notFound')
  assertSite(siteIds, tool.siteId)
  if (tool.status !== 'available') throw new ApiError('errors.toolUnavailable')
  Object.assign(tool, { status: 'issued', assignedTo: input.issuedTo, issuedDate: todayIso(), expectedReturnDate: input.expectedReturnDate })
  db.toolIssues.unshift({
    id: uid('ti'),
    toolId,
    siteId: tool.siteId,
    issuedTo: input.issuedTo,
    issuedBy: user.id,
    issuedDate: todayIso(),
    expectedReturnDate: input.expectedReturnDate,
    returnedDate: null,
    conditionOnReturn: null,
    notes: input.notes,
  })
  audit(db, user.id, 'tool_issued', 'tool', tool.id, `${tool.code} → ${input.issuedTo}`)
  commit()
}

export async function returnTool(toolId: string, input: { condition: ToolCondition; notes: string }) {
  await delay(400, 700)
  const db = getDb()
  const { user, siteIds } = authorize(db, 'manage_tools')
  const tool = db.tools.find((t) => t.id === toolId)
  if (!tool) throw new ApiError('errors.notFound')
  assertSite(siteIds, tool.siteId)
  const issue = db.toolIssues.find((i) => i.toolId === toolId && !i.returnedDate)
  if (issue) Object.assign(issue, { returnedDate: todayIso(), conditionOnReturn: input.condition, notes: input.notes })
  const needsRepair = input.condition === 'needs_repair' || input.condition === 'damaged'
  Object.assign(tool, {
    status: needsRepair ? 'maintenance' : 'available',
    condition: input.condition,
    assignedTo: null,
    issuedDate: null,
    expectedReturnDate: null,
  })
  audit(db, user.id, 'tool_returned', 'tool', tool.id, `${tool.code} · ${input.condition}`)
  commit()
}

export async function reportToolDamage(toolId: string, input: { notes: string }) {
  await delay(400, 700)
  const db = getDb()
  const { user, siteIds } = authorize(db, 'report_damage')
  const tool = db.tools.find((t) => t.id === toolId)
  if (!tool) throw new ApiError('errors.notFound')
  assertSite(siteIds, tool.siteId)
  tool.condition = 'damaged'
  if (tool.status !== 'issued') tool.status = 'maintenance'
  tool.maintenanceHistory.unshift({ id: uid('mh'), date: todayIso(), note: i18n.t('system.damageReported', { notes: input.notes }), cost: 0 })
  audit(db, user.id, 'tool_damage', 'tool', tool.id, input.notes)
  commit()
}

export async function completeMaintenance(toolId: string, input: { note: string; cost: number }) {
  await delay(400, 700)
  const db = getDb()
  const { user } = authorize(db, 'manage_tools')
  const tool = db.tools.find((t) => t.id === toolId)
  if (!tool) throw new ApiError('errors.notFound')
  tool.maintenanceHistory.unshift({ id: uid('mh'), date: todayIso(), note: input.note, cost: input.cost })
  Object.assign(tool, { status: 'available', condition: 'good', maintenanceDue: isoDaysFromNow(businessConfig.tools.serviceIntervalDays) })
  audit(db, user.id, 'tool_serviced', 'tool', tool.id, input.note)
  commit()
}

/* ------------------------------------------------------------------ */
/* Reports                                                             */
/* ------------------------------------------------------------------ */

export async function exportReport(id: ReportId, filters: ReportFilters): Promise<ReportResult> {
  await delay(400, 800)
  const db = getDb()
  const { siteIds: allowed } = authorize(db, 'view_reports')
  const siteIds = filters.siteId === 'all' ? allowed : allowed.filter((s) => s === filters.siteId)
  const productOk = (pid: string) => {
    const p = db.products.find((x) => x.id === pid)
    return (
      !!p &&
      (filters.productId === 'all' || p.id === filters.productId) &&
      (filters.category === 'all' || p.category === filters.category)
    )
  }
  const inRange = (d: string) => d.slice(0, 10) >= filters.from && d.slice(0, 10) <= filters.to
  const pname = (pid: string) => db.products.find((p) => p.id === pid)?.name ?? ''
  const unitOf = (pid: string) => db.products.find((p) => p.id === pid)?.baseUnit ?? 'kg'
  const rows = buildStockRows(db, siteIds).filter((r) => productOk(r.productId))
  const mvs = db.movements.filter((m) => siteIds.includes(m.siteId) && productOk(m.productId) && inRange(m.date))

  switch (id) {
    case 'stock_by_site': {
      const data = db.sites
        .filter((s) => siteIds.includes(s.id))
        .map((s) => {
          const r = rows.filter((x) => x.siteId === s.id)
          return [s.name, s.city, r.length, r.filter((x) => x.isLow).length, round2(r.reduce((a, x) => a + x.stockValue, 0))]
        })
      return {
        id,
        columns: ['site', 'city', 'materials', 'lowStock', 'stockValue'],
        rows: data,
        chart: data.map((d) => ({ label: String(d[0]), value: Number(d[4]) })),
      }
    }
    case 'batch_expiry': {
      const list = db.batches
        .filter((b) => siteIds.includes(b.siteId) && productOk(b.productId) && b.qtyAvailable > 0 && b.expiryDate)
        .map((b) => ({ b, days: daysUntil(b.expiryDate as string) }))
        .sort((a, b) => a.days - b.days)
      const buckets = { expired: 0, d7: 0, d15: 0, d30: 0, ok: 0 }
      for (const { b } of list) {
        const k = expiryBucket(b.expiryDate)
        if (k !== 'none') buckets[k] += 1
      }
      return {
        id,
        columns: ['product', 'batch', 'site', 'expiry', 'daysLeft', 'qty', 'unit', 'value'],
        rows: list.map(({ b, days }) => [
          pname(b.productId), b.batchNo, siteName(db, b.siteId), b.expiryDate as string, days, b.qtyAvailable, unitOf(b.productId), round2(b.qtyAvailable * b.unitCost),
        ]),
        chart: Object.entries(buckets).map(([label, value]) => ({ label, value })),
      }
    }
    case 'usage_vs_expected': {
      const map = new Map<string, { area: number; expected: number; actual: number }>()
      for (const m of mvs) {
        if (m.type !== 'issue' || !m.expectedQty) continue
        const e = map.get(m.productId) ?? { area: 0, expected: 0, actual: 0 }
        map.set(m.productId, { area: e.area + (m.areaM2 ?? 0), expected: e.expected + m.expectedQty, actual: e.actual + m.qty })
      }
      const data = [...map.entries()].map(([pid, e]) => [
        pname(pid), round2(e.area), round2(e.expected), round2(e.actual), unitOf(pid), round2(((e.actual - e.expected) / e.expected) * 100),
      ])
      return {
        id,
        columns: ['product', 'areaM2', 'expectedQty', 'actualQty', 'unit', 'variancePct'],
        rows: data,
        chart: data.map((d) => ({ label: String(d[0]), value: Number(d[2]), value2: Number(d[3]) })),
      }
    }
    case 'wastage': {
      const list = mvs.filter((m) => m.type === 'damage')
      const byProduct = new Map<string, number>()
      for (const m of list) byProduct.set(m.productId, (byProduct.get(m.productId) ?? 0) + m.value)
      return {
        id,
        columns: ['date', 'product', 'batch', 'site', 'qty', 'unit', 'value', 'reason'],
        rows: list.map((m) => [m.date.slice(0, 10), pname(m.productId), m.batchNo, siteName(db, m.siteId), m.qty, unitOf(m.productId), m.value, m.reason]),
        chart: [...byProduct.entries()].map(([pid, v]) => ({ label: pname(pid), value: round2(v) })),
      }
    }
    case 'cost_per_m2': {
      const map = new Map<string, { area: number; cost: number }>()
      for (const m of mvs) {
        if (m.type !== 'issue' || !m.areaM2) continue
        const e = map.get(m.productId) ?? { area: 0, cost: 0 }
        map.set(m.productId, { area: e.area + m.areaM2, cost: e.cost + m.value })
      }
      const data = [...map.entries()].map(([pid, e]) => [pname(pid), round2(e.area), round2(e.cost), round2(e.cost / e.area)])
      return {
        id,
        columns: ['product', 'areaM2', 'cost', 'costPerM2'],
        rows: data,
        chart: data.map((d) => ({ label: String(d[0]), value: Number(d[3]) })),
      }
    }
    case 'vendor_price': {
      const map = new Map<string, { rates: number[]; value: number; vendor: string; pid: string }>()
      for (const inv of db.invoices) {
        if (inv.status !== 'approved' || !siteIds.includes(inv.siteId)) continue
        for (const l of inv.lineItems) {
          if (!l.productId || !productOk(l.productId)) continue
          const key = `${l.productId}|${inv.vendorName}`
          const e = map.get(key) ?? { rates: [], value: 0, vendor: inv.vendorName, pid: l.productId }
          e.rates.push(l.unitCost)
          e.value += l.totalCost
          map.set(key, e)
        }
      }
      const data = [...map.values()].map((e) => [
        pname(e.pid), e.vendor, round2(e.rates.reduce((a, b) => a + b, 0) / e.rates.length), Math.min(...e.rates), Math.max(...e.rates), e.rates.length, round2(e.value),
      ])
      const byVendor = new Map<string, number>()
      for (const e of map.values()) byVendor.set(e.vendor, (byVendor.get(e.vendor) ?? 0) + e.value)
      return {
        id,
        columns: ['product', 'vendor', 'avgRate', 'minRate', 'maxRate', 'bills', 'purchaseValue'],
        rows: data,
        chart: [...byVendor.entries()].map(([label, value]) => ({ label, value: round2(value) })),
      }
    }
    case 'tool_issue': {
      const list = db.toolIssues.filter((i) => siteIds.includes(i.siteId) && inRange(i.issuedDate))
      const perSite = new Map<string, { issued: number; returned: number }>()
      for (const i of list) {
        const e = perSite.get(i.siteId) ?? { issued: 0, returned: 0 }
        e.issued += 1
        if (i.returnedDate) e.returned += 1
        perSite.set(i.siteId, e)
      }
      return {
        id,
        columns: ['toolId', 'toolName', 'site', 'issuedTo', 'issuedDate', 'expectedReturn', 'returnedDate'],
        rows: list.map((i) => {
          const t = db.tools.find((x) => x.id === i.toolId)
          return [t?.code ?? '', t?.name ?? '', siteName(db, i.siteId), i.issuedTo, i.issuedDate, i.expectedReturnDate, i.returnedDate ?? '—']
        }),
        chart: [...perSite.entries()].map(([sid, e]) => ({ label: siteName(db, sid), value: e.issued, value2: e.returned })),
      }
    }
    case 'stock_value': {
      const total = rows.reduce((a, r) => a + r.stockValue, 0) || 1
      const byCat = new Map<string, number>()
      for (const r of rows) byCat.set(r.category, (byCat.get(r.category) ?? 0) + r.stockValue)
      const data = [...byCat.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([cat, v]) => [cat, round2(v), round2((v / total) * 100)])
      return {
        id,
        columns: ['category', 'stockValue', 'sharePct'],
        rows: data,
        chart: data.map((d) => ({ label: String(d[0]), value: Number(d[1]) })),
      }
    }
  }
}

/** Lightweight list of every site (for transfer destinations). */
export async function getSiteDirectory(): Promise<{ id: string; name: string; city: string }[]> {
  await delay(150, 300)
  const db = getDb()
  authorize(db)
  return db.sites.map((s) => ({ id: s.id, name: s.name, city: s.city }))
}
