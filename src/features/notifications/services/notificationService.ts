import type { AppNotification } from '../types'
import { getMockNotifications, getUnreadCount as calculateUnreadCount } from '../mockNotifications'

const READ_STATE_KEY = 'siteseal:notification-read-state'

// In-memory cache for notifications
let cachedNotifications: AppNotification[] | null = null
let readState: Set<string> = new Set()

function loadReadState(): void {
  try {
    const stored = localStorage.getItem(READ_STATE_KEY)
    readState = stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    readState = new Set()
  }
}

function saveReadState(): void {
  try {
    localStorage.setItem(READ_STATE_KEY, JSON.stringify(Array.from(readState)))
  } catch {
    // Ignore storage errors in demo
  }
}

function applyReadState(notifications: AppNotification[]): AppNotification[] {
  return notifications.map((n) =>
    readState.has(n.id) && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n,
  )
}

export async function getNotifications(): Promise<AppNotification[]> {
  if (!cachedNotifications) {
    loadReadState()
    const mock = getMockNotifications()
    cachedNotifications = applyReadState(mock)
  }
  return cachedNotifications
}

export async function markAsRead(notificationId: string): Promise<void> {
  loadReadState()
  readState.add(notificationId)
  saveReadState()

  if (cachedNotifications) {
    cachedNotifications = cachedNotifications.map((n) =>
      n.id === notificationId && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n,
    )
  }
}

export async function markAllAsRead(): Promise<void> {
  const notifications = await getNotifications()
  notifications.forEach((n) => readState.add(n.id))
  saveReadState()

  if (cachedNotifications) {
    cachedNotifications = cachedNotifications.map((n) => ({
      ...n,
      readAt: n.readAt || new Date().toISOString(),
    }))
  }
}

export async function getUnreadCount(): Promise<number> {
  const notifications = await getNotifications()
  return calculateUnreadCount(notifications)
}

export async function addMockNotification(notification: Omit<AppNotification, 'id'>): Promise<AppNotification> {
  const newNotification: AppNotification = {
    ...notification,
    id: `notif-${Date.now()}`,
  }

  if (!cachedNotifications) {
    await getNotifications()
  }

  if (cachedNotifications) {
    cachedNotifications = [newNotification, ...cachedNotifications]
  }

  return newNotification
}
