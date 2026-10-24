import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Menu as MenuIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sheet } from '@/components/ui'
import { DemoBadge } from '@/components/common'
import { MOBILE_HIGHLIGHT, useMobileNav, useNavBadge, useVisibleNav, type NavItem } from './navigation'
import { InstallAppButton } from '@/features/pwa/components/InstallAppButton'
import { ThemeToggle } from '@/components/shell/HeaderControls'

function BottomNavLink({ item }: { item: NavItem }) {
  const { t } = useTranslation()
  const badge = useNavBadge(item)
  const highlight = item.to === MOBILE_HIGHLIGHT
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn('flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium', isActive ? 'text-primary' : 'text-muted-foreground')
      }
    >
      {/* Same-height icon slot for every item so all labels share one baseline */}
      <span className="relative flex h-6 w-full items-center justify-center">
        {highlight ? (
          <span className="absolute bottom-0 left-1/2 flex size-12 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-surface">
            <item.Icon className="size-5" aria-hidden />
          </span>
        ) : (
          <item.Icon className="size-5" aria-hidden />
        )}
        {badge !== null && (
          <span className="tabular absolute -top-1.5 left-1/2 ml-1 min-w-4 rounded-full bg-danger px-1 text-center text-[10px] font-semibold leading-4 text-white">
            {badge}
          </span>
        )}
      </span>
      <span className="max-w-full truncate px-1 leading-4">{t(item.shortLabelKey ?? item.labelKey)}</span>
    </NavLink>
  )
}

/** Fixed bottom navigation on phones (items from navigation.json → mobileBottomNav) */
export function BottomNav({ onMore }: { onMore: () => void }) {
  const { t } = useTranslation()
  const items = useMobileNav()
  return (
    <nav aria-label={t('nav.main')} className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t bg-surface shadow-[0_-4px_16px_rgb(0_0_0/0.06)] md:hidden">
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length + 1}, minmax(0, 1fr))` }}>
        {items.map((item) => (
          <li key={item.to}>
            <BottomNavLink item={item} />
          </li>
        ))}
        <li>
          <button type="button" onClick={onMore} className="flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground">
            <span className="flex h-6 items-center justify-center">
              <MenuIcon className="size-5" aria-hidden />
            </span>
            <span className="leading-4">{t('nav.more')}</span>
          </button>
        </li>
      </ul>
    </nav>
  )
}

/** "More" sheet on phones: every permitted page plus theme and install controls */
export function MoreSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const items = useVisibleNav()
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={t('nav.more')} headerExtra={<DemoBadge compact className="mt-2" />}>
      <ul className="-mx-1 space-y-1">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              onClick={() => onOpenChange(false)}
              className={({ isActive }) => cn('flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium', isActive ? 'bg-primary-soft text-primary' : 'hover:bg-muted')}
            >
              <item.Icon className="size-5" aria-hidden />
              <span className="flex-1">{t(item.labelKey)}</span>
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
        <ThemeToggle withLabel />
        <InstallAppButton />
      </div>
    </Sheet>
  )
}
