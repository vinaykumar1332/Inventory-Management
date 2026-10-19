import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, Download, LogOut, MapPin, RotateCcw } from 'lucide-react'
import { appConfig } from '@/config'
import { ROUTES } from '@/app/routes'
import { useUser } from '@/features/auth/AuthProvider'
import { ResetDemoDialog } from '@/features/admin/ResetDemo'
import { useInstallPrompt } from '@/pwa/pwa'
import { useSites } from '@/hooks/queries'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui'
import { InstallGuideDialog } from './InstallGuide'

function isStandalone() {
  try { return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true }
  catch { return false }
}

export function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function UserMenu() {
  const { t } = useTranslation()
  const user = useUser()
  const navigate = useNavigate()
  const { data: sites } = useSites()
  const [confirmReset, setConfirmReset] = React.useState(false)
  const [guideOpen, setGuideOpen] = React.useState(false)
  const { canInstall, install } = useInstallPrompt()
  const showInstall = appConfig.features.pwaInstallPrompt && !isStandalone()

  const assigned = user.siteIds.length ? sites?.filter((s) => user.siteIds.includes(s.id)).map((s) => s.name) : [t('common.allSites')]

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="flex min-h-11 items-center gap-2 rounded-md px-1.5 hover:bg-muted md:min-h-9" aria-label={t('header.profile')}>
            <span className="flex size-8 items-center justify-center rounded-full bg-navy text-xs font-semibold text-white" aria-hidden>
              {initials(user.name)}
            </span>
            <span className="hidden text-left leading-tight lg:block">
              <span className="block text-sm font-medium">{user.name}</span>
              <span className="block text-xs text-muted-foreground">{t(`roles.${user.role}`)}</span>
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64">
          <div className="px-2.5 py-2">
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
              <Check className="size-3" aria-hidden />
              {t(`roles.${user.role}`)}
            </span>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>{t('header.assignedSites')}</DropdownMenuLabel>
          {assigned?.map((name) => (
            <div key={name} className="flex items-center gap-2 px-2.5 py-1 text-sm">
              <MapPin className="size-3.5 text-muted-foreground" aria-hidden />
              {name}
            </div>
          ))}
          <DropdownMenuSeparator />
          {showInstall && (
            <DropdownMenuItem onSelect={() => canInstall ? void install() : setGuideOpen(true)}>
              <Download />
              {t('pwa.install')}
            </DropdownMenuItem>
          )}
          {appConfig.features.resetDemoData && (
            <DropdownMenuItem onSelect={() => setConfirmReset(true)}>
              <RotateCcw />
              {t('header.resetDemo')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            danger
            onSelect={() => navigate(ROUTES.logout)}
          >
            <LogOut />
            {t('auth.signOut')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ResetDemoDialog open={confirmReset} onOpenChange={setConfirmReset} />
      <InstallGuideDialog open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  )
}
