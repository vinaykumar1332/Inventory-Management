import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import { appConfig } from '@/config'
import { useInstallPrompt, useNetworkState } from '@/pwa/pwa'
import { Button, Tooltip } from '@/components/ui'
import { InstallGuideDialog } from './InstallGuide'

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
}

/** Shown in header. Handles Chrome/Edge native prompt AND iOS/other browsers via guide dialog. */
export function InstallAppButton({ compact }: { compact?: boolean }) {
  const { t } = useTranslation()
  const { canInstall, install } = useInstallPrompt()
  const network = useNetworkState()
  const [guideOpen, setGuideOpen] = React.useState(false)

  if (!appConfig.features.pwaInstallPrompt || isStandalone()) return null

  const offline = network === 'offline'
  const handleClick = () => {
    if (canInstall) void install()
    else setGuideOpen(true)
  }
  const hint = offline ? t('pwa.installNeedsNetwork') : t('pwa.installHint')

  return (
    <>
      {compact ? (
        <Tooltip content={hint}>
          <Button variant="ghost" size="icon" onClick={handleClick} disabled={offline} aria-label={t('pwa.install')}>
            <Download className="!size-[18px]" />
          </Button>
        </Tooltip>
      ) : (
        <Button variant="secondary" onClick={handleClick} disabled={offline} title={hint}>
          <Download /> {t('pwa.install')}
        </Button>
      )}
      <InstallGuideDialog open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  )
}
