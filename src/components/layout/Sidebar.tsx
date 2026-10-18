import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Tooltip } from '@/components/ui'
import { Logo } from '@/components/common'
import { NAV_SECTIONS, useNavBadge, useVisibleNav, type NavItem } from './navigation'

function SidebarLink({ item, compact }: { item: NavItem; compact: boolean }) {
  const { t } = useTranslation()
  const badge = useNavBadge(item)
  const label = t(item.labelKey)
  const link = (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          'relative flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
          compact && 'justify-center px-0',
          isActive ? 'bg-white/12 text-white' : 'text-sidebar-foreground/85 hover:bg-white/6 hover:text-white',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-sidebar-accent" aria-hidden />}
          <item.Icon className="size-[18px] shrink-0" aria-hidden />
          <span className={cn(compact && 'sr-only', 'truncate')}>{label}</span>
          {badge !== null && (
            <span
              className={cn(
                'tabular rounded-full bg-danger px-1.5 text-[10px] font-semibold leading-[18px] text-white',
                compact ? 'absolute right-1.5 top-1' : 'ml-auto',
              )}
            >
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
  // Wrapper span: Tooltip's Slot must not merge into NavLink's function className
  return compact ? (
    <Tooltip content={label} side="right">
      <span className="block">{link}</span>
    </Tooltip>
  ) : (
    link
  )
}

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { t } = useTranslation()
  const items = useVisibleNav()
  const isLg = useMediaQuery('(min-width: 1024px)')
  const compact = collapsed || !isLg

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 hidden flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex',
        compact ? 'w-[72px]' : 'w-64',
      )}
    >
      <div className={cn('flex h-16 items-center border-b border-white/10', compact ? 'justify-center px-2' : 'px-5')}>
        <Logo light className={cn('text-white', compact && '[&_.logo-text]:sr-only')} />
      </div>
      <nav aria-label={t('nav.main')} className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section) => {
          const list = items.filter((i) => i.section === section.id)
          if (!list.length) return null
          return (
            <div key={section.id} className="mb-4">
              {section.labelKey && !compact && (
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/45">{t(section.labelKey)}</p>
              )}
              {section.labelKey && compact && <div className="mx-3 mb-2 h-px bg-white/10" aria-hidden />}
              <ul className="space-y-0.5">
                {list.map((item) => (
                  <li key={item.to}>
                    <SidebarLink item={item} compact={compact} />
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </nav>
      <div className="hidden border-t border-white/10 p-3 lg:block">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-sidebar-foreground/80 hover:bg-white/6 hover:text-white',
            compact && 'justify-center px-0',
          )}
          aria-label={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
          aria-expanded={!collapsed}
        >
          {collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
          {!compact && <span>{t('nav.collapseSidebar')}</span>}
        </button>
      </div>
    </aside>
  )
}
