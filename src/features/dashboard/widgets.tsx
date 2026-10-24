import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CalendarClock } from 'lucide-react'
import { catalog, dashboardConfig } from '@/config'
import { getIcon } from '@/config/icons'
import { DOT_CLASSES, TINT_PANEL_CLASSES, TONE_CHIP_CLASSES } from '@/config/tones'
import { paths } from '@/app/routes'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/AuthProvider'
import { useStockActions } from '@/features/stock/StockActions'
import { useProducts, useUsers } from '@/hooks/queries'
import { EmptyState } from '@/components/common'
import type { DashboardData, StockMovement } from '@/types'
import { formatINR, formatINRCompact, formatQty, formatRelative } from '@/utils/format'

const LANE_TEXT = {
  danger: 'text-danger',
  warning: 'text-warning',
  amber: 'text-warning',
} as const

/** Expired / 7 / 15 / 30-day lanes (lanes and colours from catalog.json) */
export function ExpiryTimeline({ groups }: { groups: DashboardData['expiryGroups'] }) {
  const { t } = useTranslation()
  const perLane = dashboardConfig.limits.expiryItemsPerLane
  const lanes = catalog.expiryLanes
  const total = lanes.reduce((s, l) => s + groups[l.key].length, 0)
  if (total === 0) return <EmptyState icon={CalendarClock} title={t('dashboard.noExpiry')} className="py-8" />
  return (
    <div className="scrollbar-thin -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 md:-mx-5 md:px-5">
      {lanes.map((lane) => {
        const text = LANE_TEXT[lane.dot]
        return (
          <section
            key={lane.key}
            aria-label={t(`expiry.${lane.key}`)}
            className={cn('w-64 shrink-0 snap-start rounded-lg border p-3 xl:w-auto xl:flex-1', TINT_PANEL_CLASSES[lane.tint])}
          >
            <header className="mb-2 flex items-center justify-between">
              <h3 className={cn('flex items-center gap-1.5 text-sm font-semibold', text)}>
                <span className={cn('size-2 rounded-full', DOT_CLASSES[lane.dot])} aria-hidden />
                {t(`expiry.${lane.key}`)}
              </h3>
              <span className="tabular rounded-full bg-surface px-2 text-xs font-semibold">{groups[lane.key].length}</span>
            </header>
            <ul className="space-y-1.5">
              {groups[lane.key].slice(0, perLane).map((e) => (
                <li key={e.batchId}>
                  <Link to={paths.inventory({ productId: e.productId })} className="block rounded-md bg-surface px-2.5 py-2 text-xs shadow-xs hover:ring-1 hover:ring-primary/40">
                    <span className="block truncate font-medium text-foreground">{e.productName}</span>
                    <span className="mt-0.5 flex justify-between gap-2 text-muted-foreground">
                      <span className="truncate font-mono">{e.batchNo}</span>
                      <span className="tabular shrink-0">{formatQty(e.qty, e.unit)}</span>
                    </span>
                    <span className={cn('mt-0.5 block', text)}>
                      {e.days < 0 ? t('expiry.expiredAgo', { count: -e.days }) : t('expiry.expiresIn', { count: e.days })} · {e.siteName}
                    </span>
                  </Link>
                </li>
              ))}
              {groups[lane.key].length > perLane && (
                <li>
                  <Link to={paths.alerts} className="block px-1 text-xs font-medium text-primary hover:underline">
                    +{groups[lane.key].length - perLane} · {t('common.viewAll')}
                  </Link>
                </li>
              )}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

export function TopMaterials({ items }: { items: DashboardData['topMaterials'] }) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <ol className="space-y-3">
      {items.map((m, i) => (
        <li key={m.productId}>
          <Link to={paths.inventory({ productId: m.productId })} className="group block">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">
                <span className="tabular mr-2 text-muted-foreground">{i + 1}.</span>
                <span className="font-medium group-hover:text-primary">{m.productName}</span>
                <span className="ml-1.5 text-xs text-muted-foreground">{m.brand}</span>
              </span>
              <span className="tabular shrink-0 font-semibold">{formatINRCompact(m.value)}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(m.value / max) * 100}%` }} />
              </div>
              <span className="tabular w-24 text-right text-xs text-muted-foreground">{formatQty(m.qty, m.unit)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ol>
  )
}

export function ActivityTimeline({ items }: { items: StockMovement[] }) {
  const { t } = useTranslation()
  const { data: products } = useProducts()
  const { data: users } = useUsers()
  return (
    <ol className="relative space-y-4 before:absolute before:inset-y-1 before:left-4 before:w-px before:bg-border">
      {items.map((mv) => {
        const meta = catalog.movementTypes.meta[mv.type]
        const Icon = getIcon(meta.icon)
        const product = products?.find((p) => p.id === mv.productId)
        const user = users?.find((u) => u.id === mv.userId)
        return (
          <li key={mv.id} className="relative flex gap-3">
            <span className={cn('relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-surface', TONE_CHIP_CLASSES[meta.tone])} aria-hidden>
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm">
                <span className="font-medium">{user?.name ?? '—'}</span>{' '}
                <span className="text-muted-foreground">{t(`movements.types.${mv.type}`).toLowerCase()}</span>{' '}
                <span className="tabular font-medium">{product ? formatQty(mv.qty, product.baseUnit) : mv.qty}</span>{' '}
                <span className="text-muted-foreground">·</span> <span>{product?.name}</span>
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {mv.source} → {mv.destination} · {formatRelative(mv.date)} · {formatINR(mv.value)}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** Quick actions from dashboard.json, filtered by role permissions */
export function QuickActions() {
  const { t } = useTranslation()
  const { can } = useAuth()
  const navigate = useNavigate()
  const stock = useStockActions()
  const actions = dashboardConfig.quickActions.filter((a) => !a.permission || can(a.permission))

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {actions.map((a) => {
        const Icon = getIcon(a.icon)
        const run = () => {
          if (a.action === 'navigate' && a.to) navigate(a.to)
          else if (a.action === 'stock' && a.mode) stock.open(a.mode)
        }
        return (
          <button
            key={a.id}
            type="button"
            onClick={run}
            className={cn(
              'flex min-h-20 flex-col items-start justify-between gap-2 rounded-lg border p-3 text-left text-sm font-medium transition-colors',
              a.primary ? 'border-primary bg-primary text-primary-foreground hover:bg-primary-hover' : 'bg-surface hover:border-primary/40 hover:bg-primary-soft/40',
            )}
          >
            <Icon className={cn('size-5', !a.primary && 'text-primary')} aria-hidden />
            {t(a.labelKey)}
          </button>
        )
      })}
    </div>
  )
}
