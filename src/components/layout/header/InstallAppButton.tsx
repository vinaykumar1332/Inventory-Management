import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import { appConfig } from '@/config'
import { useInstallPrompt } from '@/pwa/pwa'
import { Button, Tooltip } from '@/components/ui'

/** Shown only when the browser offers PWA installation. */
export function InstallAppButton({ compact }: { compact?: boolean }) {
  const { t } = useTranslation()
  const { canInstall, install } = useInstallPrompt()
  if (!appConfig.features.pwaInstallPrompt || !canInstall) return null
  return compact ? (
    <Tooltip content={t('pwa.installHint')}>
      <Button variant="ghost" size="icon" onClick={() => void install()} aria-label={t('pwa.install')}>
        <Download className="!size-[18px]" />
      </Button>
    </Tooltip>
  ) : (
    <Button variant="secondary" onClick={() => void install()} title={t('pwa.installHint')}>
      <Download /> {t('pwa.install')}
    </Button>
  )
}
