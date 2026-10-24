import * as React from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { m } from 'motion/react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui'
import { Logo } from '@/components/common'
import { NAV_SECTIONS, useNavBadge, useVisibleNav, type NavItem } from './navigation'

const SidebarLink = React.memo(function SidebarLink({ item, compact, onNavigate, index }: { item: NavItem; compact: boolean; onNavigate?: () => void; index?: number }) {
  const { t } = useTranslation()
  const badge = useNavBadge(item)
  const label = t(item.labelKey)

  const link = (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      aria-label={compact ? (badge ? `${label} (${badge})` : label) : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex h-10 items-center gap-3 rounded-md text-sm font-medium transition-all duration-200',
          compact ? 'w-12 justify-center' : 'px-3',
          isActive
            ? 'bg-white/12 text-white shadow-md'
            : 'text-sidebar-foreground/85 hover:bg-white/8 hover:text-white hover:shadow-sm',
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Animated active indicator */}
          {isActive && (
            <m.span
              layoutId="sidebar-active-indicator"
              className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-sidebar-accent"
              aria-hidden
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              exit={{ scaleY: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}

          {/* Icon box: in the rail the badge sits on its top-right corner, never over the glyph */}
          <m.span
            className="relative flex size-5 shrink-0 items-center justify-center"
            animate={{ scale: isActive ? 1.05 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <item.Icon className="size-[18px] transition-transform duration-200 group-hover:scale-110" aria-hidden />
            {compact && badge !== null && (
              <m.span
                className="tabular absolute -right-2.5 -top-2 min-w-4 rounded-full bg-danger px-1 text-center text-[10px] font-semibold leading-4 text-white ring-2 ring-sidebar"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {badge > 99 ? '99+' : badge}
              </m.span>
            )}
          </m.span>

          {!compact && <span className="truncate transition-colors duration-200">{label}</span>}
          {!compact && badge !== null && (
            <m.span
              className="tabular ml-auto rounded-full bg-danger px-1.5 text-[10px] font-semibold leading-[18px] text-white"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {badge}
            </m.span>
          )}
        </>
      )}
    </NavLink>
  )

  // Wrapper with staggered entrance animation
  const content = compact ? (
    <Tooltip content={label} side="right">
      <span className="flex justify-center">{link}</span>
    </Tooltip>
  ) : (
    link
  )

  return (
    <m.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: (index ?? 0) * 0.03, duration: 0.3 }}
    >
      {content}
    </m.li>
  )
})

const SidebarSection = React.memo(function SidebarSection({
  section,
  items,
  compact,
  onNavigate,
  sectionIndex,
}: {
  section: typeof NAV_SECTIONS[number]
  items: NavItem[]
  compact: boolean
  onNavigate?: () => void
  sectionIndex: number
}) {
  const { t } = useTranslation()

  return (
    <m.div
      className="mb-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: sectionIndex * 0.1, duration: 0.3 }}
    >
      {section.labelKey && !compact && (
        <m.p
          className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/45 transition-opacity duration-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: sectionIndex * 0.1 + 0.05 }}
        >
          {t(section.labelKey)}
        </m.p>
      )}
      {section.labelKey && compact && (
        <m.div
          className="mx-auto mb-2 h-px w-8 bg-white/10"
          aria-hidden
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: sectionIndex * 0.1 }}
        />
      )}
      <ul className="space-y-1">
        {items.map((item, idx) => (
          <SidebarLink key={item.to} item={item} compact={compact} onNavigate={onNavigate} index={sectionIndex * 5 + idx} />
        ))}
      </ul>
    </m.div>
  )
})

const SidebarToggleButton = React.memo(function SidebarToggleButton({ compact, onToggle }: { compact: boolean; onToggle: () => void }) {
  const { t } = useTranslation()

  return (
    <Tooltip content={compact ? t('nav.expandSidebar') : t('nav.collapseSidebar')} side="right">
      <m.button
        type="button"
        onClick={onToggle}
        className={cn(
          'group relative flex h-10 items-center gap-3 rounded-md text-sm text-sidebar-foreground/80 transition-all duration-200 hover:bg-white/8 hover:text-white hover:shadow-sm',
          compact ? 'w-12 justify-center' : 'w-full px-3',
        )}
        aria-label={compact ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
        aria-expanded={!compact}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <m.span
          animate={{ rotate: compact ? 0 : 180 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {compact ? (
            <PanelLeftOpen className="size-[18px] shrink-0 transition-transform group-hover:scale-110" />
          ) : (
            <PanelLeftClose className="size-[18px] shrink-0 transition-transform group-hover:scale-110" />
          )}
        </m.span>
        {!compact && <span className="truncate transition-colors duration-200">{t('nav.collapseSidebar')}</span>}
      </m.button>
    </Tooltip>
  )
})

/**
 * Desktop: fixed sidebar, collapsible to an icon rail (pushes content).
 * Tablet: icon rail that opens as an overlay drawer (does not push content).
 *
 * Features:
 * - Smooth width transitions on collapse/expand
 * - Staggered entrance animations for nav items
 * - Memoized components for performance
 * - Spring animations for active indicators and badges
 * - Overlay backdrop with fade effect
 */
export function Sidebar({
  compact,
  overlay,
  onToggle,
  onNavigate,
}: {
  compact: boolean
  /** Expanded on tablet: drawn above the content with a backdrop */
  overlay: boolean
  onToggle: () => void
  onNavigate?: () => void
}) {
  const { t } = useTranslation()
  const items = useVisibleNav()

  return (
    <>
      {/* Animated backdrop for overlay on tablet */}
      {overlay && (
        <m.button
          type="button"
          aria-label={t('nav.collapseSidebar')}
          onClick={onToggle}
          className="fixed inset-0 z-30 hidden bg-overlay md:block lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Main sidebar with smooth width transition */}
      <m.aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col bg-sidebar text-sidebar-foreground md:flex',
          overlay && 'shadow-2xl',
        )}
        animate={{ width: compact ? 72 : 256 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 1 }}
      >
        {/* Header with logo */}
        <m.div
          className={cn('flex h-16 shrink-0 items-center border-b border-white/10 transition-all duration-200', compact ? 'justify-center' : 'px-5')}
          layout
        >
          <m.div
            animate={{ scale: compact ? 0.8 : 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <Logo light className={cn('text-white', compact && '[&_.logo-text]:sr-only')} />
          </m.div>
        </m.div>

        {/* Navigation sections with staggered animation */}
        <nav aria-label={t('nav.main')} className={cn('scrollbar-thin flex-1 overflow-y-auto py-4', compact ? 'px-0' : 'px-3')}>
          {NAV_SECTIONS.map((section, sectionIdx) => {
            const list = items.filter((i) => i.section === section.id)
            if (!list.length) return null
            return (
              <SidebarSection
                key={section.id}
                section={section}
                items={list}
                compact={compact}
                onNavigate={onNavigate}
                sectionIndex={sectionIdx}
              />
            )
          })}
        </nav>

        {/* Footer toggle button */}
        <m.div
          className={cn('shrink-0 border-t border-white/10 py-3 transition-all duration-200', compact ? 'flex justify-center' : 'px-3')}
          layout
        >
          <SidebarToggleButton compact={compact} onToggle={onToggle} />
        </m.div>
      </m.aside>
    </>
  )
}
