import { cn } from '@/lib/utils'

/** Initials in a circle. Decorative by default; pass a label to expose it to screen readers. */
export function Avatar({ name, label, className }: { name: string; label?: string; className?: string }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('inline-grid size-8 shrink-0 place-items-center rounded-full bg-navy text-xs font-semibold text-white', className)}
    >
      {initials}
    </span>
  )
}
