import { addDays, formatISO } from 'date-fns'
import type { AppNotification } from './types'
import { today } from '@/utils/date'

// Mock notifications for demo - these would come from API in production

export function getMockNotifications(): AppNotification[] {
  const now = today()
  return [
    {
      id: 'notif-001',
      title: 'Batch Expires Soon',
      message: 'Fosroc Brushbond RFX • Batch B-1023 expires in 7 days',
      severity: 'warning',
      category: 'expiry',
      siteId: 's1',
      batchId: 'batch-001',
      productId: 'prod-001',
      createdAt: formatISO(addDays(now, -1)),
      actionUrl: '/inventory?productId=prod-001',
    },
    {
      id: 'notif-002',
      title: 'Low Stock Alert',
      message: 'Dr. Fixit Pidifin stock is below reorder level at Green Valley Apartments',
      severity: 'critical',
      category: 'low_stock',
      siteId: 's1',
      productId: 'prod-002',
      createdAt: formatISO(addDays(now, -2)),
      actionUrl: '/inventory?productId=prod-002',
    },
    {
      id: 'notif-003',
      title: 'Bill Awaiting Review',
      message: 'Bill INV-2026-104 needs Admin review',
      severity: 'warning',
      category: 'bill',
      createdAt: formatISO(addDays(now, -3)),
      actionUrl: '/bills',
    },
    {
      id: 'notif-004',
      title: 'Tool Return Overdue',
      message: 'Drill Tool #TL-032 is overdue for return',
      severity: 'critical',
      category: 'tool',
      siteId: 's2',
      createdAt: formatISO(addDays(now, -5)),
      actionUrl: '/tools',
    },
    {
      id: 'notif-005',
      title: 'Batch Expiring',
      message: 'SikaTop Seal-107 • Batch B-2048 expires today',
      severity: 'critical',
      category: 'expiry',
      siteId: 's2',
      batchId: 'batch-005',
      productId: 'prod-005',
      createdAt: formatISO(now),
      actionUrl: '/inventory?productId=prod-005',
    },
  ]
}

export function getUnreadCount(notifications: AppNotification[]): number {
  return notifications.filter((n) => !n.readAt).length
}
