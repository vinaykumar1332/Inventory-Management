import { useTranslation } from 'react-i18next'
import { appConfig } from '@/config'
import { cn } from '@/lib/utils'

/** The SiteSeal mark. Used by the header logo, the loader and the launch screen. */
export const BRAND_MARK_SRC = '/favicon.svg'

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  const { t } = useTranslation()
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <img src={BRAND_MARK_SRC} alt="" width={32} height={32} className={cn('size-8 shrink-0 rounded-lg', light && 'ring-1 ring-white/15')} />
      <span className="logo-text truncate text-base font-semibold tracking-tight">{t('app.name')}</span>
    </span>
  )
}

/** "Client Demo • Mock Data" pill. Hidden when features.demoBadge is false in app.json. */
export function DemoBadge({ className, compact }: { className?: string; compact?: boolean }) {
  const { t } = useTranslation()
  if (!appConfig.features.demoBadge) return null
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning-soft px-2.5 py-1 text-[11px] font-medium text-warning',
        className,
      )}
      title={t('app.demoBadge')}
    >
      <span className="size-1.5 rounded-full bg-warning" aria-hidden />
      {compact ? t('app.demoShort') : t('app.demoBadge')}
    </span>
  )
}
