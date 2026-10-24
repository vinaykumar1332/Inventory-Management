import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, LogIn } from 'lucide-react'
import { ROUTES } from '@/app/routes'
import { useAuth } from '@/features/auth/AuthProvider'
import { Button } from '@/components/ui'
import { Logo } from '@/components/common'
import { LanguageSelect, ThemeToggle } from '@/components/shell/HeaderControls'

/** Top bar for public pages (home, 404): brand, language, theme and the sign-in / dashboard action. */
export function PublicHeader() {
  const { t } = useTranslation()
  const { user } = useAuth()
  return (
    <header className="sticky top-0 z-20 border-b bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 md:h-16 md:px-6">
        <Link to={ROUTES.home} className="min-w-0 rounded-md" aria-label={t('nav.home')}>
          <Logo className="[&_.logo-text]:text-[15px]" />
        </Link>
        <div className="ml-auto flex shrink-0 items-center gap-0.5 md:gap-1">
          <LanguageSelect />
          <ThemeToggle />
          {user ? (
            <Button asChild size="sm" className="ml-1">
              <Link to={ROUTES.afterLogin}>
                <LayoutDashboard /> <span className="sr-only sm:not-sr-only">{t('auth.openDashboard')}</span>
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" className="ml-1">
              <Link to={ROUTES.login}>
                <LogIn /> <span className="sr-only sm:not-sr-only">{t('auth.signIn')}</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
