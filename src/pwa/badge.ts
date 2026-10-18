// Safe app badge helper for PWA

export async function updateAppBadge(unreadCount: number): Promise<void> {
  if (!('setAppBadge' in navigator)) {
    return
  }

  try {
    if (unreadCount > 0) {
      await (navigator as any).setAppBadge(unreadCount)
    } else {
      await clearAppBadge()
    }
  } catch (error) {
    // Badge API may fail in some browsers/contexts, silently continue
    console.debug('App badge update failed:', error)
  }
}

export async function clearAppBadge(): Promise<void> {
  if (!('clearAppBadge' in navigator)) {
    return
  }

  try {
    await (navigator as any).clearAppBadge()
  } catch (error) {
    console.debug('Clear app badge failed:', error)
  }
}

export function supportsAppBadge(): boolean {
  return 'setAppBadge' in navigator && 'clearAppBadge' in navigator
}
