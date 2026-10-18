// Notification types for PWA notification feature

export type NotificationSeverity = 'info' | 'warning' | 'critical' | 'success'
export type NotificationCategory = 'expiry' | 'low_stock' | 'bill' | 'tool' | 'system'

export interface AppNotification {
  id: string
  title: string
  message: string
  severity: NotificationSeverity
  category: NotificationCategory
  siteId?: string
  batchId?: string
  productId?: string
  createdAt: string
  readAt?: string
  actionUrl?: string
}

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

export interface PushPayload {
  alertId: string
  title: string
  body: string
  icon?: string
  badge?: string
  url: string
  unreadCount?: number
}

export interface NotificationPreferences {
  expiry: boolean
  lowStock: boolean
  billApprovals: boolean
  toolReminders: boolean
  dailySummary: boolean
}
