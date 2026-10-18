import * as React from 'react'
import { Link } from 'react-router-dom'
import { catalog, type Tone } from '@/config'
import { getIcon } from '@/config/icons'
import { TINT_CLASSES, TONE_CHIP_CLASSES } from '@/config/tones'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import type { ProductIconKey } from '@/types'

/* ---------------- Product icon (icon + tint from catalog.json) ---------------- */

export function ProductIcon({ icon, size = 'md' }: { icon: ProductIconKey; size?: 'sm' | 'md' | 'lg' }) {
  const meta = catalog.productIcons[icon]
  const Icon = getIcon(meta.icon)
  const box = size === 'lg' ? 'size-14 rounded-xl' : size === 'sm' ? 'size-8 rounded-md' : 'size-10 rounded-lg'
  const glyph = size === 'lg' ? 'size-7' : size === 'sm' ? 'size-4' : 'size-5'
  return (
    <span className={cn('flex shrink-0 items-center justify-center', box, TINT_CLASSES[meta.tint])} aria-hidden>
      <Icon className={glyph} />
    </span>
  )
}

/* ---------------- KPI card ---------------- */

export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = 'primary',
  to,
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  icon: React.ComponentType<{ className?: string }>
  tone?: Tone
  to?: string
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium leading-snug text-muted-foreground sm:text-sm">{label}</p>
        <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-9', TONE_CHIP_CLASSES[tone])} aria-hidden>
          <Icon className="size-[18px]" />
        </span>
      </div>
      <p className="tabular mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{value}</p>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </>
  )
  const cls = 'block rounded-lg border bg-surface p-3 shadow-card transition-shadow sm:p-4'
  return to ? (
    <Link to={to} className={cn(cls, 'hover:border-primary/40 hover:shadow-md')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}

export function KpiSkeleton() {
  return (
    <div className="rounded-lg border bg-surface p-3 shadow-card sm:p-4">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="size-9" />
      </div>
      <Skeleton className="mt-3 h-7 w-24" />
      <Skeleton className="mt-2 h-3 w-32" />
    </div>
  )
}

/** Responsive KPI grid shared by dashboard, tools and site pages */
export function KpiGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn('grid grid-cols-2 gap-2.5 sm:gap-3', className)}>{children}</section>
}

/* ---------------- Section card (titled card used across pages) ---------------- */

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
  flush,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
  /** Render children edge-to-edge (tables) */
  flush?: boolean
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {actions}
      </CardHeader>
      {flush ? <div className={cn('mt-3', contentClassName)}>{children}</div> : <CardContent className={contentClassName}>{children}</CardContent>}
    </Card>
  )
}
