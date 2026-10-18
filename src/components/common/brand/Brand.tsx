import { useTranslation } from 'react-i18next'
import { appConfig } from '@/config'
import { cn } from '@/lib/utils'

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  const { t } = useTranslation()
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <img src="/favicon.svg" alt="" width={32} height={32} className={cn('size-8 shrink-0 rounded-lg', light && 'ring-1 ring-white/15')} />
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
        'inline-flex items-center gap-1.5 rounded-full border border-amber-300/70 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200',
        className,
      )}
      title={t('app.demoBadge')}
    >
      <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />
      {compact ? t('app.demoShort') : t('app.demoBadge')}
    </span>
  )
}
