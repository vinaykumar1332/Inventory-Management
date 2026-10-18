import * as React from 'react'
import { m } from 'motion/react'
import { NotificationBell, NotificationPanel } from '@/features/notifications'

export function NotificationDropdown() {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <NotificationBell onOpen={() => setOpen(!open)} />
      {open && (
        <m.div
          className="absolute right-0 top-full z-50 mt-2"
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <NotificationPanel onClose={() => setOpen(false)} />
        </m.div>
      )}
    </div>
  )
}
