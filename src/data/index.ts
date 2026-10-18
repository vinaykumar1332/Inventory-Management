// Loads the mock dataset from src/data/mock/*.json.
// The JSON files hold real ISO dates and are the reference contract for the
// backend. At load time every date is shifted by (today − referenceDate) so
// expired / expiring / overdue demo cases always look current.

import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'
import type {
  AuditLog,
  Company,
  Invoice,
  Product,
  ProductBatch,
  ProductRequest,
  Site,
  StockMovement,
  Tool,
  ToolIssue,
  Unit,
  User,
  Vendor,
} from '@/types'
import { today, todayIso } from '@/utils/date'
import meta from './mock/meta.json'
import company from './mock/company.json'
import users from './mock/users.json'
import sites from './mock/sites.json'
import vendors from './mock/vendors.json'
import products from './mock/products.json'
import batches from './mock/batches.json'
import invoices from './mock/invoices.json'
import stockMovements from './mock/stockMovements.json'
import tools from './mock/tools.json'
import toolIssues from './mock/toolIssues.json'
import auditLogs from './mock/auditLogs.json'
import extractionSample from './mock/extractionSample.json'
import sampleBill from './mock/sampleBill.json'

export interface DemoDb {
  version: number
  seededOn: string
  company: Company
  users: User[]
  sites: Site[]
  vendors: Vendor[]
  products: Product[]
  batches: ProductBatch[]
  invoices: Invoice[]
  movements: StockMovement[]
  tools: Tool[]
  toolIssues: ToolIssue[]
  alertState: Record<string, { read?: boolean; resolved?: boolean }>
  auditLogs: AuditLog[]
  productRequests: ProductRequest[]
}

export const DB_VERSION = meta.version

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/

function shiftDates<T>(value: T, days: number): T {
  if (days === 0) return structuredClone(value)
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') {
      if (DATE_ONLY.test(v)) return format(addDays(parseISO(v), days), 'yyyy-MM-dd')
      if (DATE_TIME.test(v)) return new Date(Date.parse(v) + days * 86_400_000).toISOString()
      return v
    }
    if (Array.isArray(v)) return v.map(walk)
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]))
    return v
  }
  return walk(value) as T
}

const dayShift = () => differenceInCalendarDays(today(), parseISO(meta.referenceDate))

export function loadMockDb(): DemoDb {
  const data = shiftDates(
    {
      company,
      users,
      sites,
      vendors,
      products,
      batches,
      invoices,
      movements: stockMovements,
      tools,
      toolIssues,
      auditLogs,
    },
    dayShift(),
  )
  return {
    ...(data as unknown as Omit<DemoDb, 'version' | 'seededOn' | 'alertState' | 'productRequests'>),
    version: DB_VERSION,
    seededOn: todayIso(),
    alertState: {},
    productRequests: [],
  }
}

export interface ExtractionLine {
  name: string
  brand?: string
  batchNo?: string
  mfgDate?: string | null
  expiryDate?: string | null
  packs?: number
  packSize?: number
  unitCost?: number
  unit?: Unit
}

export function loadExtractionSample(): { freight: number; lines: ExtractionLine[] } {
  const shifted = shiftDates(extractionSample, dayShift())
  return { freight: shifted.freight, lines: shifted.lines as ExtractionLine[] }
}

export const sampleBillDocument = sampleBill as {
  fileName: string
  meta: (string | number)[][]
  header: string[]
  rows: (string | number)[][]
}
