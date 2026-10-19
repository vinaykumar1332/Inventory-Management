// Single entry point for all configuration. Everything a client may want to
// change (labels, branding, rules, navigation, roles, colours) lives in the
// JSON files next to this module; this file only adds TypeScript types.

import app from './app.json'
import business from './business.json'
import catalogJson from './catalog.json'
import dashboard from './dashboard.json'
import navigation from './navigation.json'
import roles from './roles.json'
import theme from './theme.json'
import type {
  AlertSeverity,
  AlertType,
  ExpiryBucket,
  InvoiceStatus,
  MaterialCategory,
  MovementType,
  ProductIconKey,
  ReportId,
  Role,
  SitePhase,
  SiteStatus,
  StockStatus,
  ToolCategory,
  ToolCondition,
  ToolStatus,
  Unit,
  UploadType,
} from '@/types'
import type { Permission } from '@/lib/permissions'
import type { IconName } from './icons'

export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'navy'
export type Tint = 'orange' | 'stone' | 'sky' | 'slate' | 'teal' | 'amber' | 'violet' | 'yellow' | 'rose' | 'emerald' | 'red' | 'indigo'
export type ThemeMode = 'light' | 'dark' | 'system'
export type LanguageCode = 'en' | 'hi' | 'te'

export interface LanguageOption {
  code: LanguageCode
  label: string
  short: string
  dateLocale: 'enIN' | 'hi' | 'te'
}

export interface AppConfig {
  app: { name: string; shortName: string; description: string; themeColor: string; backgroundColor: string }
  locale: {
    numberLocale: string
    currency: string
    currencySymbol: string
    dateFormat: string
    dateTimeFormat: string
    monthFormat: string
    defaultLanguage: LanguageCode
    languages: LanguageOption[]
  }
  theme: { default: ThemeMode; modes: ThemeMode[] }
  features: Record<
    'demoBadge' | 'themeToggle' | 'languageSwitch' | 'cameraUpload' | 'sampleBillDownload' | 'pwaInstallPrompt' | 'resetDemoData',
    boolean
  >
  demo: { quickLoginEmails: string[]; apiDelayMs: { min: number; max: number }; storagePrefix: string }
  ui: { tablePageSize: number; movementsPageSize: number; toastDurationMs: number; queryStaleTimeMs: number }
}

export interface BusinessConfig {
  inventory: { wastageAllowance: number; expiryWindowsDays: { critical: number; warning: number; notice: number }; fefo: boolean }
  bills: { defaultTaxRate: number; defaultFreight: number; amountTolerance: number; duplicateDemoKeyword: string; productMatchThreshold: number }
  upload: {
    maxFileMb: number
    acceptedTypes: Record<string, string[]>
    badges: string[]
    extractionStepMs: number
    excelHeaderAliases: Record<'name' | 'brand' | 'batchNo' | 'mfgDate' | 'expiryDate' | 'packs' | 'packSize' | 'unitCost', string[]>
    excelTableHeaderHints: string[]
  }
  tools: { defaultIssueDays: number; serviceIntervalDays: number }
  reports: { defaultRangeDays: number }
}

export interface NavItemConfig {
  to: string
  labelKey: string
  shortLabelKey?: string
  icon: IconName
  permission?: Permission
  section: 'main' | 'operations' | 'insights'
  badge?: 'unreadAlerts'
}

export interface NavigationConfig {
  sections: { id: NavItemConfig['section']; labelKey?: string }[]
  items: NavItemConfig[]
  mobileBottomNav: { items: string[]; highlight: string; fallbacks: Record<string, string> }
  routes: {
    home: string
    login: string
    logout: string
    afterLogin: string
    /** Misspellings / old links → real route (keeps query string) */
    aliases: Record<string, string>
    /** Shown on the 404 page */
    popular: string[]
  }
}

export type KpiId = 'totalStockValue' | 'availableQty' | 'expiringIn30' | 'expiredBatches' | 'lowStockItems' | 'toolsIssued'

export interface DashboardConfig {
  kpis: { id: KpiId; labelKey: string; icon: IconName; tone: Tone; to?: string }[]
  quantityUnitsOrder: Unit[]
  quickActions: {
    id: string
    labelKey: string
    icon: IconName
    permission?: Permission
    action: 'navigate' | 'stock'
    to?: string
    mode?: 'receive' | 'issue'
    primary?: boolean
  }[]
  widgets: Record<'expiryTimeline' | 'consumptionTrend' | 'categoryMix' | 'stockBySite' | 'topMaterials' | 'recentActivity', boolean>
  limits: { trendMonths: number; topMaterials: number; recentActivity: number; expiryItemsPerLane: number; categorySlices: number }
}

export interface RolesConfig {
  roles: Role[]
  permissions: Record<Role, Permission[]>
  permissionMatrixRows: Permission[]
}

export interface ReportConfig {
  id: ReportId
  money?: boolean
  labelNamespace?: string
  translateFirstColumn?: string
  series?: [string, string]
}

export interface CatalogConfig {
  categories: MaterialCategory[]
  units: Unit[]
  productIcons: Record<ProductIconKey, { icon: IconName; tint: Tint }>
  stockStatus: { order: StockStatus[]; tones: Record<StockStatus, Tone> }
  expiryTones: Record<ExpiryBucket, Tone>
  expiryLanes: { key: 'expired' | 'd7' | 'd15' | 'd30'; tint: Tint; dot: 'danger' | 'warning' | 'amber' }[]
  billStatus: { order: InvoiceStatus[]; meta: Record<InvoiceStatus, { tone: Tone; icon: IconName }> }
  uploadTypes: Record<UploadType, { icon: IconName; tint: Tint }>
  movementTypes: { order: MovementType[]; meta: Record<MovementType, { tone: Tone; icon: IconName }> }
  damageKinds: ('damage' | 'wastage' | 'expired_disposal')[]
  tools: {
    categories: Record<ToolCategory, { icon: IconName }>
    conditions: ToolCondition[]
    conditionTones: Record<ToolCondition, Tone>
    statusFilters: ToolStatus[]
    statusTones: Record<ToolStatus, Tone>
  }
  siteStatus: Record<SiteStatus, { labelKey: string; tone: Tone }>
  sitePhases: Record<SitePhase, { labelKey: string; tone: Tone }>
  alerts: {
    filters: (AlertType | 'all')[]
    types: Record<AlertType, { icon: IconName; tint: Tint }>
    severityTones: Record<AlertSeverity, Tone>
    remindable: AlertType[]
  }
  reports: { items: ReportConfig[]; siteReports: ReportId[]; previewBars: number }
}

export type ThemeTokens = Record<string, string>
export interface ChartPalette {
  primary: string
  primaryFill: string
  grid: string
  axis: string
  surface: string
  categorical: string[]
  other: string
}
export interface ThemeConfig {
  colors: { light: ThemeTokens; dark: ThemeTokens }
  chart: { light: ChartPalette; dark: ChartPalette }
}

export const appConfig = app as AppConfig
export const businessConfig = business as BusinessConfig
export const catalog = catalogJson as CatalogConfig
export const dashboardConfig = dashboard as DashboardConfig
export const navigationConfig = navigation as NavigationConfig
export const rolesConfig = roles as RolesConfig
export const themeConfig = theme as ThemeConfig
