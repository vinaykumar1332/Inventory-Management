import * as React from 'react'
import { Spinner } from '@/components/common'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ArrowRight, ClipboardCheck, ShieldCheck, UserCog, type LucideIcon } from 'lucide-react'
import { ROUTES, safeRedirect } from '@/app/routes'
import { errorMessage, useDemoAccounts } from '@/hooks/queries'
import { cn } from '@/lib/utils'
import type { Role } from '@/types'
import { useAuth } from './AuthProvider'

const ROLE_ICON: Record<Role, LucideIcon> = {
  super_admin: ShieldCheck,
  admin: UserCog,
  site_manager: ClipboardCheck,
}

/** Sign in, toast, then go to the requested page (validated to stay inside the app). */
export function useSignIn(redirectTo: string = ROUTES.afterLogin) {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [pendingEmail, setPendingEmail] = React.useState<string | null>(null)

  const signIn = React.useCallback(
    async (email: string) => {
      setPendingEmail(email)
      try {
        const u = await login(email)
        toast.success(t('auth.signedInAs', { name: u.name }))
        navigate(safeRedirect(redirectTo), { replace: true })
      } catch (e) {
        toast.error(errorMessage(e))
        setPendingEmail(null)
      }
    },
    [login, navigate, redirectTo, t],
  )
  return { signIn, pendingEmail }
}

/** One-click demo role cards (accounts from app.json → demo.quickLoginEmails). */
export function DemoRoleList({
  onSelect,
  pendingEmail,
  className,
}: {
  onSelect: (email: string) => void
  pendingEmail: string | null
  className?: string
}) {
  const { t } = useTranslation()
  const { data: accounts = [] } = useDemoAccounts()
  return (
    <ul className={cn('grid gap-2 sm:grid-cols-2', className)}>
      {accounts.map((u) => {
        const Icon = ROLE_ICON[u.role]
        const loading = pendingEmail === u.email
        return (
          <li key={u.id}>
            <button
              type="button"
              disabled={!!pendingEmail}
              onClick={() => onSelect(u.email)}
              className="group flex h-full w-full items-start gap-3 rounded-lg border bg-surface p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary-soft/40 disabled:opacity-60"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                {loading ? <Spinner /> : <Icon className="size-4" aria-hidden />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-1 text-sm font-semibold">
                  {t(`roles.${u.role}`)}
                  <ArrowRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
                <span className="block truncate text-xs text-muted-foreground">{u.email}</span>
                <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">{t(`roleDescriptions.${u.role}`)}</span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
