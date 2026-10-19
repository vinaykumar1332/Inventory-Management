import * as React from 'react'
import { m, AnimatePresence } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'

interface TruncatedListProps {
  items: React.ReactNode[]
  maxItems?: number
  emptyMessage?: string
  className?: string
  itemClassName?: string
}

/**
 * Truncated list that shows N items and expands to show all.
 * Perfect for expiry alerts, low stock items, etc.
 */
export function TruncatedList({
  items,
  maxItems = 3,
  emptyMessage = 'No items',
  className,
  itemClassName,
}: TruncatedListProps) {
  const [expanded, setExpanded] = React.useState(false)
  const visibleItems = expanded ? items : items.slice(0, maxItems)
  const hasMore = items.length > maxItems

  if (items.length === 0) {
    return <p className="py-2 text-center text-xs text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <div className={className}>
      <ul className={cn('space-y-1.5', itemClassName)}>
        <AnimatePresence>
          {visibleItems.map((item, idx) => (
            <m.li
              key={idx}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {item}
            </m.li>
          ))}
        </AnimatePresence>
      </ul>

      {hasMore && (
        <m.div className="mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <Button
            size="sm"
            variant="ghost"
            className="w-full text-xs"
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronDown className={cn('size-3.5 transition-transform', expanded && 'rotate-180')} />
            {expanded ? `Show less (${maxItems})` : `+${items.length - maxItems} more`}
          </Button>
        </m.div>
      )}
    </div>
  )
}
