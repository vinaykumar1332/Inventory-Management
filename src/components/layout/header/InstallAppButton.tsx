import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Smartphone } from 'lucide-react'
import { appConfig } from '@/config'
import { useInstallPrompt } from '@/pwa/pwa'
import { Button, Tooltip } from '@/components/ui'
import { InstallGuideDialog } from './InstallGuide'

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
}

/** Shown in header. Handles Chrome/Edge native prompt AND iOS/other browsers via guide dialog. */
export function InstallAppButton({ compact }: { compact?: boolean }) {
  const { t } = useTranslation()
  const { canInstall, install } = useInstallPrompt()
  const [guideOpen, setGuideOpen] = React.useState(false)

  if (!appConfig.features.pwaInstallPrompt || isStandalone()) return null

  const handleClick = () => {
    if (canInstall) void install()
    else setGuideOpen(true)
  }

  return (
    <>
      {compact ? (
        <Tooltip content={t('pwa.installHint')}>
          <Button variant="ghost" size="icon" onClick={handleClick} aria-label={t('pwa.install')}>
            <Download className="!size-[18px]" />
          </Button>
        </Tooltip>
      ) : (
        <Button variant="secondary" onClick={handleClick} title={t('pwa.installHint')}>
          <Download /> {t('pwa.install')}
        </Button>
      )}
      <InstallGuideDialog open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  )
}

/** Dismissible banner — shown once on dashboard until dismissed or app is installed. */
export function InstallBanner() {
  const { t } = useTranslation()
  const { canInstall, install } = useInstallPrompt()
  const [guideOpen, setGuideOpen] = React.useState(false)
  const [dismissed, setDismissed] = React.useState(() => {
    try { return localStorage.getItem('siteseal:install-dismissed') === '1' } catch { return false }
  })

  if (!appConfig.features.pwaInstallPrompt || isStandalone() || dismissed) return null

  const dismiss = () => {
    try { localStorage.setItem('siteseal:install-dismissed', '1') } catch {}
    setDismissed(true)
  }

  const handleInstall = () => {
    if (canInstall) { void install(); dismiss() }
    else setGuideOpen(true)
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary-soft/30 px-4 py-3 text-sm">
        <Smartphone className="size-5 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{t('pwa.installBannerTitle')}</p>
          <p className="text-xs text-muted-foreground">{t('pwa.installBannerDesc')}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" onClick={handleInstall}>
            <Download /> {t('pwa.install')}
          </Button>
          <Button size="sm" variant="ghost" onClick={dismiss}>
            {t('pwa.installBannerDismiss')}
          </Button>
        </div>
      </div>
      <InstallGuideDialog open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  )
}
