import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { m, AnimatePresence } from 'motion/react'
import { AlertCircle, CheckCircle, Info, Zap } from 'lucide-react'
import { formatDistance } from 'date-fns'
import { today } from '@/utils/date'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../hooks/useNotifications'
import type { AppNotification, NotificationSeverity } from '../types'

const severityConfig: Record<NotificationSeverity, { icon: typeof AlertCircle; color: string }> = {
  critical: { icon: AlertCircle, color: 'text-danger' },
  warning: { icon: Zap, color: 'text-warning' },
  info: { icon: Info, color: 'text-primary' },
  success: { icon: CheckCircle, color: 'text-success' },
}

function groupNotificationsByDate(notifications: AppNotification[]) {
  const groups: { date: string; notifications: AppNotification[] }[] = []
  const now = today()

  for (const notif of notifications) {
    const notifDate = new Date(notif.createdAt)
    let label: string

    if (notifDate.toDateString() === now.toDateString()) {
      label = 'today'
    } else if (notifDate.toDateString() === new Date(now.getTime() - 86400000).toDateString()) {
      label = 'yesterday'
    } else {
      label = 'earlier'
    }

    const group = groups.find((g) => g.date === label)
    if (group) {
      group.notifications.push(notif)
    } else {
      groups.push({ date: label, notifications: [notif] })
    }
  }

  return groups
}

interface NotificationPanelProps {
  onClose?: () => void
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: notifications = [] } = useNotifications()
  const { mutate: markAsRead } = useMarkAsRead()
  const { mutate: markAllAsRead } = useMarkAllAsRead()

  const groups = groupNotificationsByDate(notifications)
  const unreadCount = notifications.filter((n) => !n.readAt).length

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.readAt) {
      markAsRead(notification.id)
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl)
      onClose?.()
    }
  }

  return (
    <div className="flex flex-col max-h-96 w-80 overflow-hidden rounded-lg border bg-surface shadow-lg">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{t('notifications.title')}</h2>
        {unreadCount > 0 && (
          <Button size="sm" variant="ghost" onClick={() => markAllAsRead()}>
            {t('notifications.markAllRead')}
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Info className="size-8 text-muted-foreground mb-2" aria-hidden />
            <p className="text-sm text-muted-foreground">{t('notifications.empty')}</p>
          </div>
        ) : (
          <div className="divide-y">
            <AnimatePresence mode="popLayout">
              {groups.map((group) => (
                <div key={group.date}>
                  <div className="px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground sticky top-0">
                    {t(`notifications.date.${group.date}`)}
                  </div>
                  {group.notifications.map((notif) => {
                    const Icon = severityConfig[notif.severity].icon
                    return (
                      <m.button
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={cn(
                          'w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors',
                          !notif.readAt && 'bg-primary-soft/20',
                        )}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      >
                        <div className="flex gap-3">
                          <Icon className={cn('size-5 shrink-0 mt-0.5', severityConfig[notif.severity].color)} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{notif.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                            <p className="text-[11px] text-muted-foreground mt-1">
                              {formatDistance(new Date(notif.createdAt), new Date(), { addSuffix: true })}
                            </p>
                          </div>
                          {!notif.readAt && <div className="size-2 rounded-full bg-primary shrink-0 mt-2" />}
                        </div>
                      </m.button>
                    )
                  })}
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              navigate('/alerts')
              onClose?.()
            }}
          >
            {t('notifications.viewAll')}
          </Button>
        </div>
      )}
    </div>
  )
}
