import { useTranslation } from 'react-i18next'
import { Download, Share, Smartphone } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui'

function isIOS() {
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

/** Step-by-step install guide dialog for iOS and unsupported browsers. */
export function InstallGuideDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const ios = isIOS()

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={ios ? t('pwa.iosGuideTitle') : t('pwa.desktopGuideTitle')}>
        {ios ? (
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">{t('pwa.iosGuideDesc')}</p>
            <ol className="space-y-3">
              {[
                { Icon: Share, text: t('pwa.iosStep1') },
                { Icon: Smartphone, text: t('pwa.iosStep2') },
                { Icon: Download, text: t('pwa.iosStep3') },
              ].map(({ Icon, text }, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <div className="flex items-center gap-2 pt-0.5">
                    <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span>{text}</span>
                  </div>
                </li>
              ))}
            </ol>
            <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">{t('pwa.iosGuideNote')}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('pwa.desktopGuideDesc')}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
