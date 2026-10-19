import * as React from 'react'
import { m, AnimatePresence } from 'motion/react'
import { NotificationBell } from './NotificationBell'
import { NotificationPanel } from './NotificationPanel'

export function NotificationDropdown() {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <NotificationBell onOpen={() => setOpen((o) => !o)} />
      <AnimatePresence>
        {open && (
          <m.div
            className="absolute right-0 top-full mt-2 z-50"
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <NotificationPanel onClose={() => setOpen(false)} />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
