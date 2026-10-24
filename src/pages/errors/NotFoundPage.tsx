import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { m } from 'motion/react'
import { ArrowLeft, ArrowRight, Compass, Home, LayoutDashboard, LogIn } from 'lucide-react'
import { navigationConfig } from '@/config'
import { getIcon } from '@/config/icons'
import { ROUTES, suggestPath } from '@/app/routes'
import { useAuth } from '@/features/auth/AuthProvider'
import { Button } from '@/components/ui'
import { DemoBadge } from '@/components/common'
import { PublicHeader } from '@/components/layout/PublicHeader'

/** Standalone 404 shown for any unknown address, signed in or not. */
export default function NotFoundPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, can } = useAuth()
  const suggestion = suggestPath(location.pathname)
  const suggestionItem = navigationConfig.items.find((i) => i.to === suggestion)

  const popular = navigationConfig.routes.popular
    .map((to) => navigationConfig.items.find((i) => i.to === to))
    .filter((i): i is NonNullable<typeof i> => !!i && (!i.permission || can(i.permission)))

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <PublicHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <m.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-lg text-center"
          aria-labelledby="nf-title"
        >
          <div className="relative mx-auto mb-6 flex size-24 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-primary-soft" aria-hidden />
            <Compass className="relative size-11 text-primary" aria-hidden />
          </div>
          <p className="tabular text-sm font-semibold tracking-[0.3em] text-primary">{t('notFound.code')}</p>
          <h1 id="nf-title" className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
            {t('notFound.title')}
          </h1>
          <p className="mt-2 text-muted-foreground">{t('notFound.body')}</p>

          <div className="mt-5 rounded-lg border bg-surface px-4 py-3 text-left">
            <p className="text-xs font-medium text-muted-foreground">{t('notFound.requested')}</p>
            <p className="mt-0.5 break-all font-mono text-sm">{location.pathname}</p>
          </div>

          {suggestion && (
            <Link
              to={`${suggestion}${location.search}`}
              className="group mt-3 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary-soft/60 px-4 py-3 text-left transition-colors hover:bg-primary-soft"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium text-muted-foreground">{t('notFound.didYouMean')}</span>
                <span className="block truncate font-semibold text-primary">
                  {suggestionItem ? t(suggestionItem.labelKey) : suggestion} <span className="font-mono text-sm font-normal">{suggestion}</span>
                </span>
              </span>
              <ArrowRight className="size-5 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          )}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button variant="secondary" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(ROUTES.home))}>
              <ArrowLeft /> {t('notFound.goBack')}
            </Button>
            <Button variant="secondary" asChild>
              <Link to={ROUTES.home}>
                <Home /> {t('notFound.goHome')}
              </Link>
            </Button>
            {user ? (
              <Button asChild>
                <Link to={ROUTES.afterLogin}>
                  <LayoutDashboard /> {t('notFound.goDashboard')}
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to={ROUTES.login}>
                  <LogIn /> {t('notFound.signIn')}
                </Link>
              </Button>
            )}
          </div>

          {user && popular.length > 0 && (
            <nav aria-label={t('notFound.popular')} className="mt-8">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('notFound.popular')}</p>
              <ul className="grid grid-cols-2 gap-2">
                {popular.map((item) => {
                  const Icon = getIcon(item.icon)
                  return (
                    <li key={item.to}>
                      <Link to={item.to} className="flex min-h-12 items-center gap-2.5 rounded-lg border bg-surface px-3 text-left text-sm font-medium hover:border-primary/40">
                        <Icon className="size-4 shrink-0 text-primary" aria-hidden />
                        <span className="truncate">{t(item.labelKey)}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          )}
          <DemoBadge compact className="mt-8" />
        </m.section>
      </main>
    </div>
  )
}
