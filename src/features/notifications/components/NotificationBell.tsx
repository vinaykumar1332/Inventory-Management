import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUnreadCount } from '../hooks/useNotifications'

interface NotificationBellProps {
  onOpen?: () => void
  className?: string
}

export function NotificationBell({ onOpen, className }: NotificationBellProps) {
  const { data: unreadCount = 0 } = useUnreadCount()

  const displayCount = unreadCount > 9 ? '9+' : unreadCount.toString()

  return (
    <button
      onClick={onOpen}
      className={cn(
        'relative flex size-9 items-center justify-center rounded-md hover:bg-muted transition-colors',
        className,
      )}
      aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
    >
      <Bell className="size-5" />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-danger text-white text-[10px] font-bold ring-2 ring-surface">
          {displayCount}
        </span>
      )}
    </button>
  )
}
