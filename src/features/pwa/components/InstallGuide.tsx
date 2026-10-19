import { useTranslation } from 'react-i18next'
import { Download, Share, Smartphone } from 'lucide-react'
import { isIOS } from '@/lib/platform'
import { Dialog, DialogContent } from '@/components/ui'

const IOS_STEPS = [
  { Icon: Share, key: 'pwa.iosStep1' },
  { Icon: Smartphone, key: 'pwa.iosStep2' },
  { Icon: Download, key: 'pwa.iosStep3' },
] as const

/** Step-by-step install guide for iOS and for browsers that don't offer a native prompt. */
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
              {IOS_STEPS.map(({ Icon, key }, i) => (
                <li key={key} className="flex items-start gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <div className="flex items-center gap-2 pt-0.5">
                    <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span>{t(key)}</span>
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
