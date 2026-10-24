import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { formatDateTime } from '@/utils/format'
import type { ApprovalScope } from '../engine'
import type { ApprovalRow } from '../types'
import { ApprovalStatusBadge } from './ApprovalBadges'

/** The action key used in translations, e.g. "stock.issue" -> "stock_issue". */
export const actionKey = (action: ApprovalRow['action']) => action.replace('.', '_')

/** One request: what changed, who asked, and the buttons that apply to the current tab. */
export function ApprovalCard({
  row,
  scope,
  busy,
  onApprove,
  onReject,
  onCancel,
}: {
  row: ApprovalRow
  scope: ApprovalScope
  busy: boolean
  onApprove: () => void
  onReject: () => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const pending = row.status === 'pending'
  return (
    <li className="space-y-3 px-4 py-4 md:px-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{t(`approvals.actionKeys.${actionKey(row.action)}`)}</span>
        <Link to={`/approvals/${row.id}`} className="text-xs font-medium text-primary hover:underline">{t('approvals.details')}</Link>
        <ApprovalStatusBadge status={row.status} />
        {row.siteName && <span className="text-xs text-muted-foreground">· {row.siteName}</span>}
      </div>
      <p className="text-sm">{row.summary}</p>
      <dl className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
        <div>
          <dt className="inline">{t('approvals.submittedBy')}: </dt>
          <dd className="inline text-foreground">
            {row.submitterName} · {t(`roles.${row.submitterRole}`)}
          </dd>
        </div>
        <div>
          <dt className="inline">{t('approvals.submittedAt')}: </dt>
          <dd className="inline text-foreground">{formatDateTime(row.submittedAt)}</dd>
        </div>
        {row.reviewerName && (
          <div>
            <dt className="inline">{t('approvals.reviewedBy')}: </dt>
            <dd className="inline text-foreground">{row.reviewerName}</dd>
          </div>
        )}
      </dl>
      {row.reason && <p className="rounded-md bg-muted px-3 py-2 text-xs">{row.reason}</p>}
      {row.status === 'conflict' && <p className="text-xs text-danger">{t('approvals.conflict')}</p>}
      {pending && scope === 'waiting_for_me' && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={onApprove} disabled={busy}>
            <Check /> {t('approvals.buttons.approve')}
          </Button>
          <Button size="sm" variant="ghost" className="text-danger" onClick={onReject} disabled={busy}>
            <X /> {t('approvals.buttons.reject')}
          </Button>
        </div>
      )}
      {pending && scope === 'my_submissions' && (
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={busy}>
          {t('approvals.buttons.cancel')}
        </Button>
      )}
    </li>
  )
}
