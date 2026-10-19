import * as React from 'react'
import { updateAppBadge } from '../badge'

/** Keeps the installed app's icon badge in step with the given unread count. */
export function useAppBadge(unreadCount: number) {
  React.useEffect(() => {
    void updateAppBadge(unreadCount)
  }, [unreadCount])
}
