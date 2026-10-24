import * as React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { m } from 'motion/react'
import { SignalLow, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { storageKeys } from '@/lib/storage'
import { useMediaQuery, usePersistentState } from '@/hooks/useMediaQuery'
import { useAppBadge, useNetworkState } from '@/features/pwa'
import { useUnreadAlertCount } from '@/hooks/queries'
import { DemoBadge, ErrorBoundary, Logo } from '@/components/common'
import { ProfileConfirmDialog } from '@/features/auth/ProfileConfirmDialog'
import { ApprovalNotifier } from '@/features/approvals'
import { StockActionsHost } from '@/features/stock/StockActions'
import { LanguageSelect, ThemeToggle } from '@/components/shell/HeaderControls'
import { UserMenu } from '@/components/shell/UserMenu'
import { BottomNav, MoreSheet } from './MobileNav'
import { Sidebar } from './Sidebar'

function TopBar() {
  const { t } = useTranslation()
  const network = useNetworkState()
  return (
    <header className="sticky top-0 z-20 border-b bg-surface/95 backdrop-blur">
      <div className="flex h-14 items-center gap-2 px-3 md:h-16 md:px-6">
        <div className="min-w-0 md:hidden">
          <Logo className="[&_.logo-text]:text-[15px]" />
        </div>
        <div className="hidden min-w-0 flex-1 md:block">
          <DemoBadge className="hidden xl:inline-flex" />
          <DemoBadge compact className="xl:hidden" />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-0.5 md:gap-1">
          <LanguageSelect />
          <span className="hidden sm:inline-flex">
            <ThemeToggle />
          </span>
          <UserMenu />
        </div>
      </div>
      {network !== 'online' && (
        <p role="status" className="flex items-center justify-center gap-2 bg-warning-soft px-3 py-1.5 text-xs font-medium text-warning">
          {network === 'offline' ? <WifiOff className="size-3.5" aria-hidden /> : <SignalLow className="size-3.5" aria-hidden />}
          {network === 'offline' ? t('pwa.offline') : t('pwa.slowNetwork')}
        </p>
      )}
    </header>
  )
}

export function AppLayout() {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = usePersistentState(storageKeys.sidebarCollapsed, false)
  const [moreOpen, setMoreOpen] = React.useState(false)
  const isLg = useMediaQuery('(min-width: 1024px)')
  const [tabletOpen, setTabletOpen] = React.useState(false)
  // Desktop: persisted collapse pushes content. Tablet: rail that opens as an overlay.
  const compact = isLg ? collapsed : !tabletOpen
  const contentCompact = isLg ? collapsed : true
  const location = useLocation()
  useAppBadge(useUnreadAlertCount())

  React.useEffect(() => {
    window.scrollTo({ top: 0 })
    setTabletOpen(false)
  }, [location.pathname])

  React.useEffect(() => {
    if (isLg) setTabletOpen(false)
  }, [isLg])

  React.useEffect(() => {
    if (!tabletOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setTabletOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tabletOpen])

  return (
    <StockActionsHost>
      <a href="#main" className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        {t('common.skipToContent')}
      </a>
      <Sidebar
        compact={compact}
        overlay={!isLg && tabletOpen}
        onToggle={() => (isLg ? setCollapsed((c) => !c) : setTabletOpen((o) => !o))}
        onNavigate={() => setTabletOpen(false)}
      />
      <div className={cn('flex min-h-dvh min-w-0 flex-col transition-[padding] duration-200', contentCompact ? 'md:pl-[72px]' : 'md:pl-64')}>
        <TopBar />
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 px-4 pb-28 pt-5 outline-none md:px-6 md:pb-10 md:pt-6 xl:px-8">
          <div className="mx-auto w-full min-w-0 max-w-[1440px]">
            <m.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}>
              <ErrorBoundary resetKey={location.pathname}>
                <Outlet />
              </ErrorBoundary>
            </m.div>
          </div>
        </main>
      </div>
      <ProfileConfirmDialog />
      <ApprovalNotifier />
      <BottomNav onMore={() => setMoreOpen(true)} />
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
    </StockActionsHost>
  )
}
