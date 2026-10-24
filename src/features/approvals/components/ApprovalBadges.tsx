import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui'
import type { ApprovalStatus } from '../types'

const STATUS_TONE = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
  conflict: 'danger',
} as const satisfies Record<ApprovalStatus, 'warning' | 'success' | 'danger' | 'neutral'>

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  const { t } = useTranslation()
  return <Badge tone={STATUS_TONE[status]}>{t(`approvals.status.${status}`)}</Badge>
}

/** Marks an item that has a change waiting for approval, e.g. "Pending approval by Priya Sharma". */
export function PendingApprovalChip({ approverName }: { approverName: string }) {
  const { t } = useTranslation()
  return <Badge tone="warning">{t('approvals.pendingChip', { name: approverName })}</Badge>
}
