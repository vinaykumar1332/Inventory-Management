import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { useAddMockNotification } from '../hooks/useNotifications'
import { updateAppBadge } from '@/pwa/badge'
import type { NotificationPermissionState } from '../types'

export function NotificationSettings() {
  const { t } = useTranslation()
  const [permission, setPermission] = React.useState<NotificationPermissionState>('unsupported')
  const { mutate: addMockNotification } = useAddMockNotification()

  React.useEffect(() => {
    if (!('Notification' in window)) {
      setPermission('unsupported')
      return
    }

    const status = Notification.permission as 'default' | 'granted' | 'denied' | 'unsupported'
    setPermission(status as NotificationPermissionState)
  }, [])

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) {
      setPermission('unsupported')
      return
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result as NotificationPermissionState)
    } catch (error) {
      console.error('Permission request failed:', error)
    }
  }

  const handleTestNotification = async () => {
    if (permission !== 'granted') {
      await handleRequestPermission()
      return
    }

    // Create a test notification
    const testNotif = {
      title: 'Test Notification',
      message: 'This is a test notification from SiteSeal Inventory',
      severity: 'info' as const,
      category: 'system' as const,
      createdAt: new Date().toISOString(),
      actionUrl: '/alerts',
    }

    addMockNotification(testNotif)

    // Show native notification if permission granted
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification('SiteSeal Inventory', {
          body: testNotif.message,
          icon: '/favicon.svg',
          badge: '/icons/badge-72.png',
          tag: 'test-notification',
        })
      })
    }

    // Update badge
    void updateAppBadge(1)
  }

  const handleDemoAlert = () => {
    addMockNotification({
      title: 'Critical Expiry Alert',
      message: 'Fosroc Brushbond RFX • Batch B-1023 expires today',
      severity: 'critical',
      category: 'expiry',
      siteId: 's1',
      createdAt: new Date().toISOString(),
      actionUrl: '/inventory',
    })
  }

  const permissionStatus: Record<NotificationPermissionState, { color: string; icon: React.ReactNode }> = {
    granted: { color: 'text-success', icon: <CheckCircle className="size-4" /> },
    denied: { color: 'text-danger', icon: <X className="size-4" /> },
    default: { color: 'text-warning', icon: <Bell className="size-4" /> },
    unsupported: { color: 'text-muted-foreground', icon: <X className="size-4" /> },
  }

  const status = permissionStatus[permission]

  return (
    <div className="space-y-6 rounded-lg border bg-surface p-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="size-5" />
          {t('notifications.settings')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t('notifications.settingsHint')}</p>
      </div>

      {/* Permission Status */}
      <div className="rounded-lg bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t('notifications.permissionStatus')}</p>
            <div className={cn('flex items-center gap-2 mt-2 text-sm', status.color)}>
              {status.icon}
              <span>{t(`notifications.permission.${permission}`)}</span>
            </div>
          </div>
        </div>

        {permission === 'unsupported' && (
          <p className="text-xs text-muted-foreground mt-3">{t('notifications.unsupported')}</p>
        )}

        {permission === 'denied' && (
          <p className="text-xs text-warning mt-3">{t('notifications.permissionDenied')}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {permission !== 'granted' && permission !== 'unsupported' && (
          <Button onClick={handleRequestPermission} className="w-full" size="sm">
            {t('notifications.enableNotifications')}
          </Button>
        )}

        <Button onClick={handleTestNotification} variant="secondary" className="w-full" size="sm">
          {t('notifications.sendTestNotification')}
        </Button>

        <Button onClick={handleDemoAlert} variant="secondary" className="w-full" size="sm">
          {t('notifications.simulateCriticalAlert')}
        </Button>
      </div>

      {/* Info */}
      <div className="rounded-lg bg-info-soft p-3">
        <p className="text-xs text-info leading-relaxed">{t('notifications.demoMode')}</p>
      </div>

      {/* iPhone Guidance */}
      {/iPhone|iPad|Mac/.test(navigator.userAgent) && (
        <div className="rounded-lg border border-warning/30 bg-warning-soft p-3">
          <p className="text-xs font-medium text-warning mb-1">{t('notifications.iPhoneInstallation')}</p>
          <p className="text-xs text-warning/80">{t('notifications.iPhoneInstructions')}</p>
        </div>
      )}
    </div>
  )
}

import { cn } from '@/lib/utils'
