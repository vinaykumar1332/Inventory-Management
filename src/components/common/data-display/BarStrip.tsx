import { cn } from '@/lib/utils'

export interface BarItem {
  key: string
  label: string
  value: number
  hint?: string
}

/** Compact vertical bars for a short series, e.g. the last seven days. Heights scale to the largest value. */
export function BarStrip({ items, className, emptyLabel }: { items: BarItem[]; className?: string; emptyLabel?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value))
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
  return (
    <div className={cn('flex h-48 items-stretch gap-2 sm:gap-3', className)} role="img" aria-label={items.map((i) => `${i.label}: ${i.value}`).join(', ')}>
      {items.map((item) => (
        <div key={item.key} className="flex min-w-0 flex-1 flex-col">
          <span className="tabular h-5 text-center text-xs font-semibold">{item.value}</span>
          <div className="relative min-h-0 flex-1 border-b border-border">
            <div
              className="absolute inset-x-1 bottom-0 rounded-t-md bg-primary/80 transition-[height] duration-300 motion-reduce:transition-none"
              style={{ height: item.value === 0 ? 0 : `${Math.max(6, (item.value / max) * 100)}%` }}
              title={item.hint}
            />
          </div>
          <span className="mt-1 h-5 truncate text-center text-[11px] text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
