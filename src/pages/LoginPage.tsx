import * as React from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { m } from 'motion/react'
import { toast } from 'sonner'
import { ArrowRight, CalendarClock, ClipboardCheck, FileUp, Loader2, ShieldCheck, Store, UserCog, Users } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { errorMessage } from '@/hooks/queries'
import { useDemoAccounts } from '@/hooks/queries'
import { Button, Field, Input } from '@/components/ui'
import { DemoBadge, Logo } from '@/components/common'
import { LanguageSelect, ThemeToggle } from '@/components/layout/header/HeaderControls'
import type { Role } from '@/types'

const schema = z.object({
  email: z.string().trim().min(1, 'validation.required').pipe(z.email('validation.email')),
  password: z.string().min(1, 'validation.required'),
})
type LoginValues = z.infer<typeof schema>

const ROLE_ICON: Record<Role, typeof Users> = {
  super_admin: ShieldCheck,
  admin: UserCog,
  storekeeper: Store,
  site_manager: ClipboardCheck,
}


export default function LoginPage() {
  const { t } = useTranslation()
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [pendingEmail, setPendingEmail] = React.useState<string | null>(null)
  const { data: demoUsers = [] } = useDemoAccounts()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const { register, handleSubmit, formState } = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  if (user) return <Navigate to={from} replace />

  const doLogin = async (email: string) => {
    setPendingEmail(email)
    try {
      const u = await login(email)
      toast.success(t('auth.signedInAs', { name: u.name }))
      navigate(from, { replace: true })
    } catch (e) {
      toast.error(errorMessage(e))
      setPendingEmail(null)
    }
  }

  const onSubmit = handleSubmit((v) => doLogin(v.email))
  const fieldError = (k: keyof LoginValues) => {
    const msg = formState.errors[k]?.message
    return msg ? t(msg) : undefined
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-sidebar text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]" />
        <Logo light className="relative text-white" />
        <m.div
          className="relative max-w-lg"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
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
      <main className="flex flex-col px-4 py-5 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between gap-2">
          <Logo className="lg:invisible" />
          <div className="flex items-center gap-1">
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
          <DemoBadge className="mb-5 w-fit" />
          <h2 className="text-2xl font-semibold tracking-tight">{t('auth.welcome')}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{t('auth.signInHint')}</p>

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
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {demoUsers.map((u) => {
                const Icon = ROLE_ICON[u.role]
                const loading = pendingEmail === u.email
                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      disabled={!!pendingEmail}
                      onClick={() => void doLogin(u.email)}
                      className="group flex w-full items-start gap-3 rounded-lg border bg-surface p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary-soft/40 disabled:opacity-60"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                        {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Icon className="size-4" aria-hidden />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-1 text-sm font-semibold">
                          {t(`roles.${u.role}`)}
                          <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">{u.email}</span>
                        <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">{t(`roleDescriptions.${u.role}`)}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </m.div>
      </main>
    </div>
  )
}
