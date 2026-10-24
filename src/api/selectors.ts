// Pure derivations from the demo DB into the view models the UI consumes.
// When a real backend exists these become server-side queries.

import { format, parseISO, startOfMonth, subMonths } from 'date-fns'
import { dashboardConfig } from '@/config'
import type { DemoDb } from '@/data'
import type {
  Alert,
  DashboardData,
  ExpiryEntry,
  MaterialCategory,
  ProductBatch,
  SiteSummary,
  StockRow,
  ToolRow,
  Unit,
  User,
} from '@/types'
import { expiryBucket, round2, stockStatus } from '@/utils/calc'
import { daysUntil, isoDaysFromNow, todayIso } from '@/utils/date'

export function accessibleSiteIds(db: DemoDb, user: User): string[] {
  if (user.role === 'super_admin' || user.role === 'admin' || user.siteIds.length === 0) {
    return db.sites.map((s) => s.id)
  }
  return user.siteIds
}

export function buildStockRows(db: DemoDb, siteIds: string[]): StockRow[] {
  const groups = new Map<string, ProductBatch[]>()
  for (const b of db.batches) {
    if (!siteIds.includes(b.siteId)) continue
    const key = `${b.productId}:${b.siteId}`
    groups.set(key, [...(groups.get(key) ?? []), b])
  }
  const rows: StockRow[] = []
  for (const [key, batches] of groups) {
    const { productId, siteId } = batches[0]
    const product = db.products.find((p) => p.id === productId)
    const site = db.sites.find((s) => s.id === siteId)
    if (!product || !site) continue
    const live = batches.filter((b) => b.qtyAvailable > 0)
    const availableQty = round2(live.reduce((s, b) => s + b.qtyAvailable, 0))
    const stockValue = round2(live.reduce((s, b) => s + b.qtyAvailable * b.unitCost, 0))
    const expiries = live.map((b) => b.expiryDate).filter((d): d is string => !!d).sort()
    const nearestExpiry = expiries[0] ?? null
    const bucket = expiryBucket(nearestExpiry)
    rows.push({
      key,
      productId,
      productName: product.name,
      sku: product.sku,
      brand: product.brand,
      category: product.category,
      icon: product.icon,
      siteId,
      siteName: site.name,
      availableQty,
      unit: product.baseUnit,
      stockValue,
      nearestExpiry,
      expiryBucket: bucket,
      reorderLevel: product.reorderLevel,
      isLow: availableQty < product.reorderLevel,
      status: stockStatus(availableQty, product.reorderLevel, bucket),
      batchNos: batches.map((b) => b.batchNo),
    })
  }
  return rows.sort((a, b) => a.productName.localeCompare(b.productName) || a.siteName.localeCompare(b.siteName))
}

function expiryEntries(db: DemoDb, siteIds: string[]): ExpiryEntry[] {
  return db.batches
    .filter((b) => siteIds.includes(b.siteId) && b.qtyAvailable > 0 && b.expiryDate)
    .map((b) => {
      const product = db.products.find((p) => p.id === b.productId)
      return {
        batchId: b.id,
        productId: b.productId,
        productName: product?.name ?? '',
        batchNo: b.batchNo,
        siteName: db.sites.find((s) => s.id === b.siteId)?.name ?? '',
        expiryDate: b.expiryDate as string,
        days: daysUntil(b.expiryDate as string),
        qty: b.qtyAvailable,
        unit: product?.baseUnit ?? 'kg',
      }
    })
    .sort((a, b) => a.days - b.days)
}

export function buildDashboard(db: DemoDb, siteIds: string[]): DashboardData {
  const rows = buildStockRows(db, siteIds)
  const batches = db.batches.filter((b) => siteIds.includes(b.siteId) && b.qtyAvailable > 0)
  const qtyByUnit: Partial<Record<Unit, number>> = {}
  for (const r of rows) qtyByUnit[r.unit] = round2((qtyByUnit[r.unit] ?? 0) + r.availableQty)

  const entries = expiryEntries(db, siteIds)
  const expiryGroups: DashboardData['expiryGroups'] = { expired: [], d7: [], d15: [], d30: [] }
  for (const e of entries) {
    if (e.days < 0) expiryGroups.expired.push(e)
    else if (e.days <= 7) expiryGroups.d7.push(e)
    else if (e.days <= 15) expiryGroups.d15.push(e)
    else if (e.days <= 30) expiryGroups.d30.push(e)
  }

  // Consumption trend — last 6 months of issues (net of returns)
  const { trendMonths, topMaterials: topCount, recentActivity: recentCount } = dashboardConfig.limits
  const months = Array.from({ length: trendMonths }, (_, i) => startOfMonth(subMonths(new Date(), trendMonths - 1 - i)))
  const consumptionTrend = months.map((m) => ({ month: format(m, 'yyyy-MM'), value: 0, qty: 0 }))
  const usageByProduct = new Map<string, { value: number; qty: number }>()
  for (const mv of db.movements) {
    if (!siteIds.includes(mv.siteId) || (mv.type !== 'issue' && mv.type !== 'return')) continue
    const sign = mv.type === 'issue' ? 1 : -1
    const key = format(parseISO(mv.date), 'yyyy-MM')
    const bucket = consumptionTrend.find((c) => c.month === key)
    if (bucket) {
      bucket.value = round2(bucket.value + sign * mv.value)
      bucket.qty = round2(bucket.qty + sign * mv.qty)
    }
    const u = usageByProduct.get(mv.productId) ?? { value: 0, qty: 0 }
    usageByProduct.set(mv.productId, { value: u.value + sign * mv.value, qty: u.qty + sign * mv.qty })
  }

  const categoryMap = new Map<MaterialCategory, number>()
  for (const r of rows) categoryMap.set(r.category, (categoryMap.get(r.category) ?? 0) + r.stockValue)

  const toolsInScope = db.tools.filter((t) => siteIds.includes(t.siteId))

  return {
    kpis: {
      totalStockValue: round2(rows.reduce((s, r) => s + r.stockValue, 0)),
      qtyByUnit,
      activeBatches: batches.length,
      expiringIn30: expiryGroups.d7.length + expiryGroups.d15.length + expiryGroups.d30.length,
      expiredBatches: expiryGroups.expired.length,
      lowStockItems: rows.filter((r) => r.isLow).length,
      toolsIssued: toolsInScope.filter((t) => t.status === 'issued').length,
      toolsTotal: toolsInScope.length,
    },
    stockBySite: db.sites
      .filter((s) => siteIds.includes(s.id))
      .map((s) => ({
        siteId: s.id,
        siteName: s.name,
        value: round2(rows.filter((r) => r.siteId === s.id).reduce((sum, r) => sum + r.stockValue, 0)),
      })),
    consumptionTrend,
    categoryDistribution: [...categoryMap.entries()]
      .map(([category, value]) => ({ category, value: round2(value) }))
      .sort((a, b) => b.value - a.value),
    expiryGroups,
    topMaterials: [...usageByProduct.entries()]
      .map(([productId, u]) => {
        const p = db.products.find((x) => x.id === productId)
        return {
          productId,
          productName: p?.name ?? '',
          brand: p?.brand ?? '',
          value: round2(u.value),
          qty: round2(u.qty),
          unit: p?.baseUnit ?? ('kg' as Unit),
        }
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, topCount),
    recentActivity: db.movements.filter((m) => siteIds.includes(m.siteId)).slice(0, recentCount),
  }
}

export function buildSiteSummaries(db: DemoDb, siteIds: string[]): SiteSummary[] {
  const rows = buildStockRows(db, siteIds)
  const entries = expiryEntries(db, siteIds)
  const name = (id: string) => db.users.find((u) => u.id === id)?.name ?? '—'
  return db.sites
    .filter((s) => siteIds.includes(s.id))
    .map((s) => {
      const siteRows = rows.filter((r) => r.siteId === s.id)
      return {
        ...s,
        managerName: s.managerId ? name(s.managerId) : '—',
        backupManagerNames: s.backupManagerIds.map(name),
        assignedAdminName: s.assignedAdminId ? name(s.assignedAdminId) : '',
        labourCount: labourAttendedToday(db, s.id),
        stockValue: round2(siteRows.reduce((sum, r) => sum + r.stockValue, 0)),
        activeMaterials: siteRows.filter((r) => r.availableQty > 0).length,
        expiryAlerts: entries.filter((e) => e.siteName === s.name && e.days <= 30).length,
      }
    })
}

export function buildToolRows(db: DemoDb, siteIds: string[]): ToolRow[] {
  const today = todayIso()
  return db.tools
    .filter((t) => siteIds.includes(t.siteId))
    .map((t) => ({
      ...t,
      siteName: db.sites.find((s) => s.id === t.siteId)?.name ?? '',
      overdue: t.status === 'issued' && !!t.expectedReturnDate && t.expectedReturnDate < today,
    }))
}

/** Alerts are derived from live data; read/resolved flags persist separately. */
export function buildAlerts(db: DemoDb, siteIds: string[]): Alert[] {
  const alerts: Alert[] = []
  const siteName = (id: string) => db.sites.find((s) => s.id === id)?.name ?? ''
  const now = new Date().toISOString()

  for (const e of expiryEntries(db, siteIds)) {
    if (e.days > 30) continue
    const batch = db.batches.find((b) => b.id === e.batchId)
    if (batch?.expiryOverride) continue
    const product = db.products.find((p) => p.id === e.productId)
    const type: Alert['type'] =
      e.days < 0 ? 'expired' : e.days <= 7 ? 'expiring_7' : e.days <= 15 ? 'expiring_15' : 'expiring_30'
    alerts.push({
      id: `exp-${e.batchId}`,
      type,
      severity: e.days < 0 ? 'critical' : e.days <= 7 ? 'critical' : 'warning',
      siteId: batch?.siteId ?? '',
      siteName: e.siteName,
      createdAt: now,
      read: false,
      resolved: false,
      productId: e.productId,
      productName: e.productName,
      batchId: e.batchId,
      batchNo: e.batchNo,
      qty: e.qty,
      unit: e.unit,
      days: e.days,
      unitCost: product?.costPerBaseUnit,
    })
  }

  for (const r of buildStockRows(db, siteIds)) {
    if (!r.isLow) continue
    alerts.push({
      id: `low-${r.key}`,
      type: 'low_stock',
      severity: r.availableQty <= 0 ? 'critical' : 'warning',
      siteId: r.siteId,
      siteName: r.siteName,
      createdAt: now,
      read: false,
      resolved: false,
      productId: r.productId,
      productName: r.productName,
      qty: r.availableQty,
      unit: r.unit,
      reorderLevel: r.reorderLevel,
      unitCost: db.products.find((p) => p.id === r.productId)?.costPerBaseUnit,
    })
  }

  for (const s of db.sites) {
    if (!siteIds.includes(s.id) || s.managerId) continue
    alerts.push({
      id: `no-manager-${s.id}`,
      type: 'no_manager',
      severity: 'warning',
      siteId: s.id,
      siteName: s.name,
      createdAt: now,
      read: false,
      resolved: false,
    })
  }

  for (const t of buildToolRows(db, siteIds)) {
    if (!t.overdue || !t.expectedReturnDate) continue
    alerts.push({
      id: `tool-${t.id}-${t.issuedDate}`,
      type: 'tool_overdue',
      severity: 'warning',
      siteId: t.siteId,
      siteName: t.siteName,
      createdAt: now,
      read: false,
      resolved: false,
      toolId: t.id,
      toolName: `${t.code} · ${t.name}`,
      days: -daysUntil(t.expectedReturnDate),
    })
  }

  for (const inv of db.invoices) {
    if (!siteIds.includes(inv.siteId) || inv.archived || inv.status !== 'needs_review') continue
    alerts.push({
      id: `bill-${inv.id}`,
      type: 'pending_approval',
      severity: 'info',
      siteId: inv.siteId,
      siteName: siteName(inv.siteId),
      createdAt: inv.uploadedAt,
      read: false,
      resolved: false,
      invoiceId: inv.id,
      invoiceNo: inv.invoiceNo,
    })
  }

  return alerts.map((a) => ({ ...a, ...db.alertState[a.id] }))
}

/** Minutes since midnight for an HH:mm time. */
function minutesOf(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** People who checked in today at a site, or null when nothing is recorded for today. */
export function labourAttendedToday(db: DemoDb, siteId: string): number | null {
  const today = db.labourAttendance.filter((r) => r.siteId === siteId && r.date === todayIso())
  if (today.length === 0) return null
  return today.filter((r) => r.inAt).length
}

/** Labour on one site: today's attendance per person, the last seven days, and the roster by role. */
export function buildSiteLabour(db: DemoDb, siteId: string) {
  const today = todayIso()
  const records = db.labourAttendance.filter((r) => r.siteId === siteId)
  const roster = db.staff
    .filter((m) => m.siteIds.includes(siteId))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((m) => ({ ...m, working: m.status === 'active', today: records.find((r) => r.staffId === m.id && r.date === today) ?? null }))
  const byRole: Record<string, number> = {}
  for (const m of roster) if (m.today?.inAt) byRole[m.role] = (byRole[m.role] ?? 0) + 1
  const history = Array.from({ length: 7 }, (_, i) => {
    const date = isoDaysFromNow(-i)
    const present = records.filter((r) => r.date === date && r.inAt)
    const hours = present.filter((r) => r.outAt).map((r) => (minutesOf(r.outAt as string) - minutesOf(r.inAt as string)) / 60)
    return {
      date,
      attended: present.length,
      avgHours: hours.length ? Math.round((hours.reduce((x, y) => x + y, 0) / hours.length) * 10) / 10 : null,
      recorded: records.some((r) => r.date === date),
    }
  })
  const todayPresent = roster.filter((m) => m.today?.inAt)
  return {
    roster,
    records: records.filter((r) => r.date >= isoDaysFromNow(-6)),
    byRole,
    attendedToday: todayPresent.length,
    onSiteNow: todayPresent.filter((m) => !m.today?.outAt).length,
    history,
  }
}
