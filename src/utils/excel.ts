// SheetJS helpers. This module is only loaded via dynamic import() so the
// xlsx library stays out of the main bundle.

import * as XLSX from 'xlsx'
import { businessConfig } from '@/config'
import { sampleBillDocument } from '@/data'
import i18n from '@/i18n'
import type { ParsedSheetRow } from '@/types'

export interface ParsedBill {
  meta: Record<string, string>
  rows: ParsedSheetRow[]
}

const TABLE_HEADER_HINTS = businessConfig.upload.excelTableHeaderHints

/**
 * Reads the first sheet of a bill. Key/value rows above the item table
 * (e.g. "Vendor | Sri Sai Traders") become metadata; the first row containing
 * a product-like header starts the line-item table.
 */
export async function parseBillWorkbook(file: File): Promise<ParsedBill> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array', cellDates: false })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const grid = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, { header: 1, blankrows: false, defval: '' })

  const meta: Record<string, string> = {}
  let headerIndex = -1
  for (let i = 0; i < grid.length; i++) {
    const cells = grid[i].map((c) => String(c).trim())
    const lower = cells.map((c) => c.toLowerCase())
    if (lower.some((c) => TABLE_HEADER_HINTS.includes(c))) {
      headerIndex = i
      break
    }
    if (cells[0] && cells[1]) meta[lower[0].replace(/[:.]$/, '')] = cells[1]
  }
  if (headerIndex < 0) return { meta, rows: [] }

  const headers = grid[headerIndex].map((h) => String(h).trim().toLowerCase())
  const rows: ParsedSheetRow[] = []
  for (const r of grid.slice(headerIndex + 1)) {
    const row: ParsedSheetRow = {}
    headers.forEach((h, idx) => {
      if (h) row[h] = r[idx] ?? ''
    })
    if (Object.values(row).some((v) => v !== '')) rows.push(row)
  }
  return { meta, rows }
}

export interface SheetSpec {
  name: string
  header: string[]
  rows: (string | number)[][]
  /** Optional title rows written above the header */
  title?: (string | number)[][]
}

export function buildWorkbook(sheets: SheetSpec[]) {
  const wb = XLSX.utils.book_new()
  for (const s of sheets) {
    const aoa = [...(s.title ?? []), ...(s.title?.length ? [[]] : []), s.header, ...s.rows]
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    ws['!cols'] = s.header.map((h, i) => ({
      wch: Math.min(40, Math.max(h.length, ...s.rows.map((r) => String(r[i] ?? '').length)) + 2),
    }))
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31))
  }
  return wb
}

export function downloadWorkbook(fileName: string, sheets: SheetSpec[]) {
  XLSX.writeFile(buildWorkbook(sheets), fileName, { compression: true })
}

/** A sample vendor bill (src/data/mock/sampleBill.json) the client can upload to see real Excel parsing. */
export function sampleBillWorkbook() {
  return buildWorkbook([
    {
      name: i18n.t('system.sampleSheet'),
      title: sampleBillDocument.meta,
      header: sampleBillDocument.header,
      rows: sampleBillDocument.rows,
    },
  ])
}

export function downloadSampleBill() {
  XLSX.writeFile(sampleBillWorkbook(), sampleBillDocument.fileName, { compression: true })
}
