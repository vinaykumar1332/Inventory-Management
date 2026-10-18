import { useTranslation } from 'react-i18next'
import { Clock } from 'lucide-react'
import { catalog } from '@/config'
import { getIcon } from '@/config/icons'
import { TINT_CLASSES } from '@/config/tones'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui'
import type { ExpiryBucket, InvoiceStatus, MovementType, SiteStatus, StockStatus, ToolCondition, ToolStatus, UploadType } from '@/types'
import { expiryBucket } from '@/utils/calc'
import { daysUntil } from '@/utils/date'
import { formatDate } from '@/utils/format'

// All badge tones/icons come from src/config/catalog.json.

export function StockStatusBadge({ status }: { status: StockStatus }) {
  const { t } = useTranslation()
  return <Badge tone={catalog.stockStatus.tones[status]}>{t(`stockStatus.${status}`)}</Badge>
}

/** Date with a coloured expiry hint, e.g. "12 Nov 2026 · 5 days left" */
export function ExpiryCell({ date }: { date: string | null }) {
  const { t } = useTranslation()
  if (!date) return <span className="text-muted-foreground">{t('expiry.none')}</span>
  const bucket = expiryBucket(date)
  const days = daysUntil(date)
  return (
    <div className="flex flex-col gap-0.5">
      <span className="tabular whitespace-nowrap">{formatDate(date)}</span>
      {bucket !== 'ok' && (
        <Badge tone={catalog.expiryTones[bucket]} className="w-fit">
          {days < 0 ? t('expiry.expiredAgo', { count: -days }) : days === 0 ? t('expiry.expiresToday') : t('common.daysLeft', { count: days })}
        </Badge>
      )}
    </div>
  )
}

export function ExpiryBadge({ bucket }: { bucket: ExpiryBucket }) {
  const { t } = useTranslation()
  return <Badge tone={catalog.expiryTones[bucket]}>{t(`expiry.${bucket}`)}</Badge>
}

export function BillStatusBadge({ status }: { status: InvoiceStatus }) {
  const { t } = useTranslation()
  const { tone, icon } = catalog.billStatus.meta[status]
  const Icon = getIcon(icon)
  return (
    <Badge tone={tone}>
      <Icon aria-hidden className={status === 'processing' ? 'animate-spin motion-reduce:animate-none' : undefined} />
      {t(`bills.status.${status}`)}
    </Badge>
  )
}

export function UploadTypeBadge({ type }: { type: UploadType }) {
  const { t } = useTranslation()
  const meta = catalog.uploadTypes[type]
  const Icon = getIcon(meta.icon)
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium', TINT_CLASSES[meta.tint])}>
      <Icon className="size-3.5" aria-hidden />
      {t(`bills.uploadType.${type}`)}
    </span>
  )
}

export function ToolStatusBadge({ status, overdue }: { status: ToolStatus; overdue?: boolean }) {
  const { t } = useTranslation()
  if (overdue)
    return (
      <Badge tone="danger">
        <Clock aria-hidden />
        {t('tools.overdue')}
      </Badge>
    )
  return <Badge tone={catalog.tools.statusTones[status]}>{t(`tools.statuses.${status}`)}</Badge>
}

export function ConditionBadge({ condition }: { condition: ToolCondition }) {
  const { t } = useTranslation()
  return <Badge tone={catalog.tools.conditionTones[condition]}>{t(`tools.conditions.${condition}`)}</Badge>
}

export function MovementBadge({ type }: { type: MovementType }) {
  const { t } = useTranslation()
  const { tone, icon } = catalog.movementTypes.meta[type]
  const Icon = getIcon(icon)
  return (
    <Badge tone={tone}>
      <Icon aria-hidden />
      {t(`movements.types.${type}`)}
    </Badge>
  )
}

export function SiteStatusBadge({ status }: { status: SiteStatus }) {
  const { t } = useTranslation()
  const meta = catalog.siteStatus[status]
  return <Badge tone={meta.tone}>{t(meta.labelKey)}</Badge>
}
