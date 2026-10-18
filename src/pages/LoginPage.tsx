import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { m } from 'motion/react'
import { ArrowLeft, CalendarClock, FileUp, Info, Loader2, ShieldCheck } from 'lucide-react'
import { ROUTES, safeRedirect } from '@/app/routes'
import { useAuth } from '@/features/auth/AuthProvider'
import { DemoRoleList, useSignIn } from '@/features/auth/DemoRoles'
import { Button, Field, Input } from '@/components/ui'
import { DemoBadge, Logo } from '@/components/common'
import { LanguageSelect, ThemeToggle } from '@/components/layout/header/HeaderControls'

const schema = z.object({
  email: z.string().trim().min(1, 'validation.required').pipe(z.email('validation.email')),
  password: z.string().min(1, 'validation.required'),
})
type LoginValues = z.infer<typeof schema>

export default function LoginPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const location = useLocation()
  const [params] = useSearchParams()
  // Where to go after sign-in: protected-route redirect state, or ?redirect=/path
  const requested = (location.state as { from?: string } | null)?.from ?? params.get('redirect') ?? undefined
  const target = safeRedirect(requested)
  const { signIn, pendingEmail } = useSignIn(target)

  const { register, handleSubmit, formState } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  if (user && !pendingEmail) return <Navigate to={target} replace />

  const onSubmit = handleSubmit((v) => signIn(v.email))
  const fieldError = (k: keyof LoginValues) => {
    const msg = formState.errors[k]?.message
    return msg ? t(msg) : undefined
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-sidebar text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]" />
        <Link to={ROUTES.home} className="relative w-fit rounded-md" aria-label={t('nav.home')}>
          <Logo light className="text-white" />
        </Link>
        <m.div className="relative max-w-lg" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">{t('auth.heroTitle')}</h1>
          <p className="mt-4 text-lg text-white/70">{t('app.tagline')}</p>
          <ul className="mt-10 space-y-4">
            {[
              { icon: FileUp, text: t('auth.heroPoint1') },
              { icon: CalendarClock, text: t('auth.heroPoint2') },
              { icon: ShieldCheck, text: t('auth.heroPoint3') },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-teal-300">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="text-white/90">{text}</span>
              </li>
            ))}
          </ul>
        </m.div>
        <p className="relative text-sm text-white/50">{t('app.copyright')}</p>
      </aside>

      {/* Form panel */}
      <main className="flex min-w-0 flex-col px-4 py-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between gap-2">
          <Link to={ROUTES.home} className="min-w-0 rounded-md lg:invisible" aria-label={t('nav.home')}>
            <Logo />
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <LanguageSelect />
            <ThemeToggle />
          </div>
        </div>

        <m.div
          className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 }}
        >
          <Link to={ROUTES.home} className="mb-4 inline-flex min-h-10 w-fit items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden /> {t('auth.backHome')}
          </Link>
          <DemoBadge className="mb-5 w-fit" />
          <h2 className="text-2xl font-semibold tracking-tight">{t('auth.welcome')}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{t('auth.signInHint')}</p>

          {requested && requested !== ROUTES.afterLogin && (
            <p role="status" className="mt-4 flex items-start gap-2 rounded-md border border-info/25 bg-info-soft px-3 py-2 text-sm text-info">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span className="min-w-0 break-words">{t('auth.signInToContinue', { path: target })}</span>
            </p>
          )}

          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            <Field label={t('auth.email')} htmlFor="email" error={fieldError('email')} required>
              <Input id="email" type="email" autoComplete="username" inputMode="email" placeholder={t('placeholders.email')} {...register('email')} />
            </Field>
            <Field label={t('auth.password')} htmlFor="password" error={fieldError('password')} hint={t('auth.passwordHint')} required>
              <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
            </Field>
            <Button type="submit" size="lg" className="w-full" disabled={!!pendingEmail}>
              {pendingEmail ? <Loader2 className="animate-spin" aria-hidden /> : null}
              {pendingEmail ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
          </form>

          <div className="mt-8">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('auth.quickAccess')}</p>
              <span className="h-px flex-1 bg-border" />
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">{t('auth.quickAccessHint')}</p>
            <DemoRoleList className="mt-4" onSelect={(email) => void signIn(email)} pendingEmail={pendingEmail} />
          </div>
        </m.div>
      </main>
    </div>
  )
}
