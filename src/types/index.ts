// Domain models for SiteSeal Inventory.
// These mirror the shape a future REST API is expected to return.

export type ID = string
/** ISO 8601 date (yyyy-MM-dd) or datetime string */
export type ISODate = string

export type Role = 'super_admin' | 'admin' | 'storekeeper' | 'site_manager'

export type Unit = 'kg' | 'litre' | 'bag' | 'bucket' | 'roll' | 'piece' | 'm2'

export type MaterialCategory =
  | 'cementitious'
  | 'liquid_membrane'
  | 'sheet_membrane'
  | 'primer'
  | 'sealant'
  | 'admixture'
  | 'accessories'
  | 'safety'

export type ProductIconKey = 'bucket' | 'bag' | 'can' | 'roll' | 'mesh' | 'brush' | 'roller' | 'safety' | 'tube'

export interface Company {
  id: ID
  name: string
  gstin: string
  address: string
}

export interface User {
  id: ID
  name: string
  email: string
  role: Role
  phone: string
  /** Sites the user is assigned to. Empty means all sites. */
  siteIds: ID[]
}

export type SiteStatus = 'active' | 'on_hold' | 'completed'

export interface Site {
  id: ID
  companyId: ID
  companyName: string
  name: string
  code: string
  city: string
  address: string
  managerId: ID
  storekeeperId: ID
  startDate: ISODate
  endDate: ISODate
  storeName: string
  status: SiteStatus
  /** Waterproofing progress 0-100 */
  progress: number
}

export interface Vendor {
  id: ID
  name: string
  gstin: string
  city: string
  phone: string
}

export interface ProductDocument {
  id: ID
  name: string
  kind: 'tds' | 'msds' | 'warranty' | 'method_statement'
  sizeKb: number
}

export interface Product {
  id: ID
  sku: string
  name: string
  brand: string
  manufacturer: string
  category: MaterialCategory
  /** Quantity of base unit per pack, e.g. 20 (kg per bucket) */
  packSize: number
  packUnit: Unit
  baseUnit: Unit
  shelfLifeMonths: number | null
  /** Base units consumed per m² per coat. Null when not area-based. */
  coveragePerM2: number | null
  recommendedCoats: number | null
  /** Default purchase cost per base unit (₹) */
  costPerBaseUnit: number
  /** Reorder threshold per site, in base units */
  reorderLevel: number
  icon: ProductIconKey
  description: string
  documents: ProductDocument[]
}

export interface ProductBatch {
  id: ID
  productId: ID
  siteId: ID
  batchNo: string
  mfgDate: ISODate | null
  expiryDate: ISODate | null
  qtyReceived: number
  qtyAvailable: number
  /** ₹ per base unit */
  unitCost: number
  invoiceId: ID | null
  receivedAt: ISODate
  /** Super Admin may allow an expired batch to be issued */
  expiryOverride?: boolean
}

export type InvoiceStatus = 'draft' | 'processing' | 'needs_review' | 'approved' | 'rejected'
export type UploadType = 'excel' | 'pdf' | 'image'

export interface InvoiceLineItem {
  id: ID
  /** Null when the extracted product does not match the Product Master */
  productId: ID | null
  productName: string
  brand: string
  batchNo: string
  mfgDate: ISODate | null
  expiryDate: ISODate | null
  packs: number
  packSize: number
  totalQty: number
  unit: Unit
  /** ₹ per base unit */
  unitCost: number
  totalCost: number
  coverage: string
}

export interface InvoiceHeader {
  vendorName: string
  invoiceNo: string
  invoiceDate: ISODate
  gstNumber: string
  siteId: ID
  billAmount: number
  taxAmount: number
  freight: number
  discount: number
}

export interface Invoice extends InvoiceHeader {
  id: ID
  vendorId: ID | null
  uploadType: UploadType
  fileName: string
  fileSizeKb: number
  uploadedAt: ISODate
  uploadedBy: ID
  status: InvoiceStatus
  lineItems: InvoiceLineItem[]
  archived: boolean
  approvedAt?: ISODate
  approvedBy?: ID
}

export type MovementType = 'receipt' | 'issue' | 'return' | 'transfer' | 'damage' | 'adjustment'

export interface StockMovement {
  id: ID
  type: MovementType
  productId: ID
  batchId: ID
  batchNo: string
  /** Quantity in base units. Always positive; direction comes from type. */
  qty: number
  /** For adjustments: +1 adds stock, -1 removes stock */
  direction: 1 | -1
  date: ISODate
  userId: ID
  siteId: ID
  /** Human-readable source, e.g. vendor name, site store, work area */
  source: string
  destination: string
  reason: string
  toSiteId?: ID
  invoiceId?: ID
  workArea?: string
  areaM2?: number
  coats?: number
  expectedQty?: number
  /** ₹ value of the movement */
  value: number
}

export type ToolCategory = 'power_tool' | 'hand_tool' | 'equipment' | 'safety_equipment'
export type ToolCondition = 'new' | 'good' | 'fair' | 'needs_repair' | 'damaged'
export type ToolStatus = 'available' | 'issued' | 'maintenance' | 'lost'

export interface MaintenanceRecord {
  id: ID
  date: ISODate
  note: string
  cost: number
}

export interface Tool {
  id: ID
  code: string
  name: string
  brand: string
  category: ToolCategory
  condition: ToolCondition
  siteId: ID
  status: ToolStatus
  assignedTo: string | null
  issuedDate: ISODate | null
  expectedReturnDate: ISODate | null
  maintenanceDue: ISODate
  purchaseCost: number
  maintenanceHistory: MaintenanceRecord[]
}

export interface ToolIssue {
  id: ID
  toolId: ID
  siteId: ID
  issuedTo: string
  issuedBy: ID
  issuedDate: ISODate
  expectedReturnDate: ISODate
  returnedDate: ISODate | null
  conditionOnReturn: ToolCondition | null
  notes: string
}

export type AlertType =
  | 'expired'
  | 'expiring_7'
  | 'expiring_15'
  | 'expiring_30'
  | 'low_stock'
  | 'tool_overdue'
  | 'pending_approval'

export type AlertSeverity = 'critical' | 'warning' | 'info'

export interface Alert {
  id: ID
  type: AlertType
  severity: AlertSeverity
  siteId: ID
  siteName: string
  createdAt: ISODate
  read: boolean
  resolved: boolean
  productId?: ID
  productName?: string
  batchId?: ID
  batchNo?: string
  qty?: number
  unit?: Unit
  days?: number
  toolId?: ID
  toolName?: string
  invoiceId?: ID
  invoiceNo?: string
}

export interface AuditLog {
  id: ID
  at: ISODate
  userId: ID
  action: string
  entity: string
  entityId: ID
  details: string
}

export interface ProductRequest {
  id: ID
  name: string
  brand: string
  requestedBy: ID
  at: ISODate
  invoiceId: ID | null
}

/* ---------- View models returned by the API layer ---------- */

export type StockStatus = 'healthy' | 'low' | 'out' | 'expiring' | 'expired'
export type ExpiryBucket = 'expired' | 'd7' | 'd15' | 'd30' | 'ok' | 'none'

export interface StockRow {
  key: string
  productId: ID
  productName: string
  sku: string
  brand: string
  category: MaterialCategory
  icon: ProductIconKey
  siteId: ID
  siteName: string
  availableQty: number
  unit: Unit
  stockValue: number
  nearestExpiry: ISODate | null
  expiryBucket: ExpiryBucket
  reorderLevel: number
  isLow: boolean
  status: StockStatus
  batchNos: string[]
}

export interface ProductDetail {
  product: Product
  batches: (ProductBatch & { siteName: string })[]
  movements: StockMovement[]
  totalAvailable: number
  totalValue: number
}

export interface DashboardKpis {
  totalStockValue: number
  qtyByUnit: Partial<Record<Unit, number>>
  activeBatches: number
  expiringIn30: number
  expiredBatches: number
  lowStockItems: number
  toolsIssued: number
  toolsTotal: number
}

export interface ExpiryEntry {
  batchId: ID
  productId: ID
  productName: string
  batchNo: string
  siteName: string
  expiryDate: ISODate
  days: number
  qty: number
  unit: Unit
}

export interface DashboardData {
  kpis: DashboardKpis
  stockBySite: { siteId: ID; siteName: string; value: number }[]
  consumptionTrend: { month: string; value: number; qty: number }[]
  categoryDistribution: { category: MaterialCategory; value: number }[]
  expiryGroups: Record<'expired' | 'd7' | 'd15' | 'd30', ExpiryEntry[]>
  topMaterials: { productId: ID; productName: string; brand: string; value: number; qty: number; unit: Unit }[]
  recentActivity: StockMovement[]
}

export interface SiteSummary extends Site {
  managerName: string
  storekeeperName: string
  stockValue: number
  activeMaterials: number
  expiryAlerts: number
}

export interface ToolRow extends Tool {
  siteName: string
  overdue: boolean
}

/* ---------- Mutation payloads ---------- */

export interface IssueMaterialInput {
  siteId: ID
  productId: ID
  batchId: ID
  qty: number
  workArea: string
  areaM2: number | null
  coats: number | null
  expectedQty: number | null
  notes: string
}

export interface ReturnMaterialInput {
  siteId: ID
  productId: ID
  batchId: ID
  qty: number
  workArea: string
  reason: string
}

export interface TransferStockInput {
  fromSiteId: ID
  toSiteId: ID
  productId: ID
  batchId: ID
  qty: number
  reason: string
}

export interface DamageInput {
  siteId: ID
  productId: ID
  batchId: ID
  qty: number
  kind: 'damage' | 'wastage' | 'expired_disposal'
  reason: string
}

export interface AdjustmentInput {
  siteId: ID
  productId: ID
  batchId: ID
  qty: number
  direction: 1 | -1
  reason: string
}

export interface CreateSiteInput {
  companyName: string
  name: string
  address: string
  city: string
  code: string
  managerId: ID
  storekeeperId: ID
  startDate: ISODate
  endDate: ISODate
  storeName: string
}

export interface UploadBillInput {
  siteId: ID
  fileName: string
  fileSizeKb: number
  uploadType: UploadType
}

/** Rows parsed from an uploaded Excel bill, keyed by lower-cased header */
export type ParsedSheetRow = Record<string, string | number>

export interface BillDraftInput {
  header: InvoiceHeader
  lineItems: InvoiceLineItem[]
}

export type ReportId =
  | 'stock_by_site'
  | 'batch_expiry'
  | 'usage_vs_expected'
  | 'wastage'
  | 'cost_per_m2'
  | 'vendor_price'
  | 'tool_issue'
  | 'stock_value'

export interface ReportFilters {
  from: ISODate
  to: ISODate
  siteId: ID | 'all'
  category: MaterialCategory | 'all'
  productId: ID | 'all'
}

export interface ReportResult {
  id: ReportId
  columns: string[]
  rows: (string | number)[][]
  chart: { label: string; value: number; value2?: number }[]
}

export interface MovementRow extends StockMovement {
  productName: string
  unit: Unit
  userName: string
  siteName: string
}

export interface BatchRow extends ProductBatch {
  productName: string
  brand: string
  unit: Unit
  siteName: string
  expiryBucket: ExpiryBucket
  /** True for the batch FEFO recommends issuing first */
  suggested: boolean
}

export interface ApproveBillResult {
  invoice: Invoice
  batchesCreated: number
  itemsHeld: number
  totalQtyByUnit: Partial<Record<Unit, number>>
  stockValueAdded: number
}
