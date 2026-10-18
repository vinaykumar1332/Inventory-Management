import { format as fnsFormat, formatDistanceToNowStrict, parseISO } from 'date-fns'
import { enIN, hi, te } from 'date-fns/locale'
import { appConfig } from '@/config'
import i18n from '@/i18n'
import type { Product, Unit } from '@/types'

const { numberLocale, currency, currencySymbol, dateFormat, dateTimeFormat, monthFormat, languages } = appConfig.locale
const DATE_LOCALES = { enIN, hi, te } as const

function dateLocale() {
  const lang = languages.find((l) => l.code === (i18n.language ?? '').slice(0, 2))
  return DATE_LOCALES[lang?.dateLocale ?? 'enIN']
}

const money = new Intl.NumberFormat(numberLocale, { style: 'currency', currency, maximumFractionDigits: 0 })
const moneyPrecise = new Intl.NumberFormat(numberLocale, { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 })
const num = new Intl.NumberFormat(numberLocale, { maximumFractionDigits: 2 })

export const CURRENCY_SYMBOL = currencySymbol

/** ₹1,23,456 */
export function formatINR(value: number, precise = false) {
  return (precise ? moneyPrecise : money).format(value)
}

/** ₹12.4 L / ₹1.25 Cr — Indian lakh/crore shorthand */
export function formatINRCompact(value: number) {
  const abs = Math.abs(value)
  if (abs >= 1e7) return `${currencySymbol}${(value / 1e7).toFixed(2)} Cr`
  if (abs >= 1e5) return `${currencySymbol}${(value / 1e5).toFixed(1)} L`
  if (abs >= 1e3) return `${currencySymbol}${(value / 1e3).toFixed(1)}K`
  return money.format(value)
}

export function formatNumber(value: number) {
  return num.format(value)
}

export function unitLabel(unit: Unit) {
  return i18n.t(`units.${unit}`)
}

export function formatQty(value: number, unit: Unit) {
  return `${num.format(value)} ${unitLabel(unit)}`
}

/** Translated "1 kg per m² per coat" for area-based products */
export function coverageLabel(p: Pick<Product, 'coveragePerM2' | 'baseUnit'>) {
  if (!p.coveragePerM2) return ''
  return i18n.t('product.coverageValue', { value: p.coveragePerM2, unit: unitLabel(p.baseUnit) })
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return fnsFormat(parseISO(iso), dateFormat, { locale: dateLocale() })
}

export function formatDateTime(iso: string) {
  return fnsFormat(parseISO(iso), dateTimeFormat, { locale: dateLocale() })
}

export function formatMonth(yyyyMm: string) {
  return fnsFormat(parseISO(`${yyyyMm}-01`), monthFormat, { locale: dateLocale() })
}

export function formatRelative(iso: string) {
  return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true, locale: dateLocale() })
}

export function formatFileSize(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`
}
