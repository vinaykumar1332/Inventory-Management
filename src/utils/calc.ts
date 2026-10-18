import { businessConfig } from '@/config'
import type { ExpiryBucket, ProductBatch, StockStatus } from '@/types'
import { daysUntil } from './date'

const { wastageAllowance, expiryWindowsDays } = businessConfig.inventory

/** Wastage allowance applied to expected consumption (from config) */
export const DEFAULT_WASTAGE = wastageAllowance

/** Expected quantity = Area × Standard coverage × Coats × Wastage allowance */
export function expectedQuantity(areaM2: number, coveragePerM2: number, coats: number, wastage = DEFAULT_WASTAGE) {
  if (!areaM2 || !coveragePerM2 || !coats) return 0
  return round2(areaM2 * coveragePerM2 * coats * wastage)
}

export function round2(n: number) {
  return Math.round(n * 100) / 100
}

export function expiryBucket(expiryDate: string | null): ExpiryBucket {
  if (!expiryDate) return 'none'
  const d = daysUntil(expiryDate)
  if (d < 0) return 'expired'
  if (d <= expiryWindowsDays.critical) return 'd7'
  if (d <= expiryWindowsDays.warning) return 'd15'
  if (d <= expiryWindowsDays.notice) return 'd30'
  return 'ok'
}

export function isExpired(batch: Pick<ProductBatch, 'expiryDate'>) {
  return !!batch.expiryDate && daysUntil(batch.expiryDate) < 0
}

/**
 * FEFO (First Expiry, First Out): pick the non-expired batch with stock
 * whose expiry date is nearest. Batches without expiry go last.
 */
export function fefoSort<T extends Pick<ProductBatch, 'expiryDate' | 'qtyAvailable' | 'expiryOverride'>>(batches: T[]): T[] {
  return batches
    .filter((b) => b.qtyAvailable > 0 && (!isExpired(b) || b.expiryOverride))
    .sort((a, b) => {
      if (!a.expiryDate) return 1
      if (!b.expiryDate) return -1
      return a.expiryDate.localeCompare(b.expiryDate)
    })
}

export function stockStatus(qty: number, reorderLevel: number, bucket: ExpiryBucket): StockStatus {
  if (qty <= 0) return 'out'
  if (bucket === 'expired') return 'expired'
  if (qty < reorderLevel) return 'low'
  if (bucket === 'd7' || bucket === 'd15' || bucket === 'd30') return 'expiring'
  return 'healthy'
}
