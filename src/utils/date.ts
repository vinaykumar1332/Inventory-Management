import { addDays, differenceInCalendarDays, format, parseISO, startOfDay } from 'date-fns'
import type { ISODate } from '@/types'

export const today = () => startOfDay(new Date())

/** yyyy-MM-dd for a day offset from today (negative = past) */
export function isoDaysFromNow(days: number): ISODate {
  return format(addDays(today(), days), 'yyyy-MM-dd')
}

/** Full ISO timestamp for a day offset from today with a given hour */
export function isoTimestampDaysAgo(daysAgo: number, hour = 10, minute = 0): ISODate {
  const d = addDays(today(), -daysAgo)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

export function nowIso(): ISODate {
  return new Date().toISOString()
}

export function todayIso(): ISODate {
  return format(today(), 'yyyy-MM-dd')
}

export function daysUntil(date: ISODate): number {
  return differenceInCalendarDays(parseISO(date), today())
}

export function addMonthsIso(date: ISODate, months: number): ISODate {
  const d = parseISO(date)
  d.setMonth(d.getMonth() + months)
  return format(d, 'yyyy-MM-dd')
}
