import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { m } from 'motion/react'
import { ArrowRight, CalendarClock, FileUp, LayoutDashboard, LogIn, MapPinned, Ruler } from 'lucide-react'
import { ROUTES } from '@/app/routes'
import { useAuth } from '@/features/auth/AuthProvider'
import { DemoRoleList, useSignIn } from '@/features/auth/DemoRoles'
import { usePublicSummary } from '@/hooks/queries'
import { Button, Skeleton } from '@/components/ui'
import { DemoBadge } from '@/components/common'
import { PublicHeader } from '@/components/layout/PublicHeader'

const FEATURES = [
  { key: 'bills', icon: FileUp },
  { key: 'fefo', icon: CalendarClock },
  { key: 'coverage', icon: Ruler },
  { key: 'sites', icon: MapPinned },
] as const

/** Public landing page at "/". Signed-in users get a shortcut to their dashboard. */
export default function HomePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { signIn, pendingEmail } = useSignIn(ROUTES.afterLogin)
  const { data: stats } = usePublicSummary()

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-sidebar text-white">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]" />
          <m.div
            className="relative mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-300">{t('home.eyebrow')}</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-5xl">{t('home.title')}</h1>
            <p className="mt-4 max-w-2xl text-base text-white/75 md:text-lg">{t('home.subtitle')}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {user ? (
                <Button asChild size="lg">
                  <Link to={ROUTES.afterLogin}>
                    <LayoutDashboard /> {t('home.ctaDashboard')}
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg">
                    <Link to={ROUTES.login}>
                      <LogIn /> {t('home.ctaSignIn')}
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/10">
                    <a href="#roles">
                      {t('home.ctaTryDemo')} <ArrowRight />
                    </a>
                  </Button>
                </>
              )}
            </div>
            {user && <p className="mt-4 text-sm text-white/70">{t('home.signedInAs', { name: user.name, role: t(`roles.${user.role}`) })}</p>}
            <DemoBadge compact className="mt-6" />
          </m.div>
        </section>

        {/* Stats */}
        <section aria-label={t('home.featuresTitle')} className="relative z-10 mx-auto -mt-8 max-w-6xl px-4 md:px-6">
          <dl className="grid grid-cols-2 gap-3 rounded-xl border bg-surface p-4 shadow-card md:grid-cols-4 md:p-5">
            {(['sites', 'products', 'batches', 'languages'] as const).map((k) => (
              <div key={k} className="text-center">
                <dt className="text-xs text-muted-foreground">{t(`home.stats.${k}`)}</dt>
                <dd className="tabular mt-1 text-2xl font-semibold">{stats ? stats[k] : <Skeleton className="mx-auto h-7 w-10" />}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{t('home.featuresTitle')}</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ key, icon: Icon }) => (
              <li key={key} className="rounded-lg border bg-surface p-5 shadow-card">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold">{t(`home.features.${key}.title`)}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{t(`home.features.${key}.body`)}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Roles */}
        {!user && (
          <section id="roles" className="scroll-mt-20 border-t bg-surface">
            <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
              <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{t('home.rolesTitle')}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{t('home.rolesHint')}</p>
              <DemoRoleList className="mt-6 lg:grid-cols-4" onSelect={(email) => void signIn(email)} pendingEmail={pendingEmail} />
            </div>
          </section>
        )}
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between md:px-6">
          <span>{t('app.copyright')}</span>
          <span>{t('home.footer')}</span>
        </div>
      </footer>
    </div>
  )
}
