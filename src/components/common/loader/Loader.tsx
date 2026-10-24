import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { BRAND_MARK_SRC } from '../brand/Brand'
import './Loader.css'
export type LoaderVariant = 'page' | 'section' | 'compact'

const VARIANT: Record<LoaderVariant, string> = {
  page: 'ss-loader--page',
  section: 'ss-loader--section',
  compact: 'ss-loader--compact',
}

export function Loader({
  label,
  variant = 'section',
  fullPage = false,
  compact = false,
  className,
}: {
  label?: string
  variant?: LoaderVariant
  /** Shorthand for variant="page". */
  fullPage?: boolean
  /** Shorthand for variant="compact". */
  compact?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  const resolved: LoaderVariant = fullPage ? 'page' : compact ? 'compact' : variant
  return (
    <div role="status" aria-live="polite" className={cn('ss-loader', VARIANT[resolved], className)}>
      <div className="ss-loader__content">
        <div className="ss-loader__stage">
          <span className="ss-loader__track" aria-hidden />
          <span className="ss-loader__arc" aria-hidden />
          <img src={BRAND_MARK_SRC} alt="" width={40} height={40} className="ss-loader__logo" aria-hidden />
        </div>
        <p className="ss-loader__label">
          <span>{label ?? t('common.loading')}</span>
        </p>
      </div>
    </div>
  )
}

/** Small spinner for buttons and inline actions. Styles are in Loader.css. */
export function Spinner({ size = 'md', className }: { size?: 'md' | 'lg'; className?: string }) {
  return <span aria-hidden className={cn('ss-spinner', size === 'lg' && 'ss-spinner--lg', className)} />
}
