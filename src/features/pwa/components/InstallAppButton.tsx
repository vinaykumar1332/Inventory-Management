import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import { appConfig } from '@/config'
import { isStandalone } from '@/lib/platform'
import { useInstallPrompt, useNetworkState } from '@/features/pwa'
import { Button, Tooltip } from '@/components/ui'
import { InstallGuideDialog } from '@/features/pwa/components/InstallGuide'

/** Shared install state for the More sheet and the profile menu. */
export function useInstallAction() {
  const { canInstall, install } = useInstallPrompt()
  const offline = useNetworkState() === 'offline'
  const [guideOpen, setGuideOpen] = React.useState(false)
  const visible = appConfig.features.pwaInstallPrompt && !isStandalone()
  const run = () => (canInstall ? void install() : setGuideOpen(true))
  return { visible, offline, run, guideOpen, closeGuide: () => setGuideOpen(false) }
}

export function InstallAppButton() {
  const { t } = useTranslation()
  const { visible, offline, run, guideOpen, closeGuide } = useInstallAction()
  if (!visible) return null
  return (
    <>
      <Tooltip content={offline ? t('pwa.installNeedsNetwork') : t('pwa.installHint')}>
        <Button variant="secondary" onClick={run} disabled={offline}>
          <Download /> {t('pwa.install')}
        </Button>
      </Tooltip>
      <InstallGuideDialog open={guideOpen} onClose={closeGuide} />
    </>
  )
}
