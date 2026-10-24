import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, X } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { canApprove } from '@/features/access'
import { ApprovalStatusBadge, RejectDialog, actionKey, useApprovalActions, useApprovalDetail } from '@/features/approvals'
import { Button, Card, CardContent } from '@/components/ui'
import { ErrorState, Loader, PageHeader } from '@/components/common'
import { formatDateTime } from '@/utils/format'

/** Values to show from the submitted payload, skipping nested objects. */
function payloadRows(payload: Record<string, unknown>) {
  return Object.entries(payload).filter(([, value]) => value === null || typeof value !== 'object')
}

export default function ApprovalDetailPage() {
  const { t } = useTranslation()
  const { approvalId = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data, isLoading, isError, refetch } = useApprovalDetail(approvalId)
  const { approve, reject, cancel, busy } = useApprovalActions()
  const [rejecting, setRejecting] = React.useState(false)

  if (isError) return <ErrorState onRetry={() => void refetch()} />
  if (isLoading || !data) return <Loader />

  const pending = data.status === 'pending'
  const mayReview = pending && data.submittedBy !== user?.id && canApprove(user?.role, data.requiredApproverRole)
  const isMine = pending && data.submittedBy === user?.id
  const backToList = () => navigate('/approvals')

  return (
    <>
      <Link to="/approvals" className="mb-3 inline-flex min-h-10 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> {t('approvals.title')}
      </Link>
      <PageHeader title={t(`approvals.actionKeys.${actionKey(data.action)}`)} subtitle={data.summary} />

      <Card>
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <ApprovalStatusBadge status={data.status} />
            {data.siteName && <span className="text-sm text-muted-foreground">{data.siteName}</span>}
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">{t('approvals.submittedBy')}</dt>
              <dd className="font-medium">
                {data.submitterName} · {t(`roles.${data.submitterRole}`)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t('approvals.submittedAt')}</dt>
              <dd className="font-medium">{formatDateTime(data.submittedAt)}</dd>
            </div>
            {data.reviewerName && (
              <div>
                <dt className="text-xs text-muted-foreground">{t('approvals.reviewedBy')}</dt>
                <dd className="font-medium">{data.reviewerName}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-muted-foreground">{t('approvals.requiredApprover')}</dt>
              <dd className="font-medium">{t(`roles.${data.requiredApproverRole}`)}</dd>
            </div>
          </dl>

          {data.reason && <p className="rounded-md bg-muted px-3 py-2 text-sm">{data.reason}</p>}
          {data.status === 'conflict' && <p className="text-sm text-danger">{t('approvals.conflict')}</p>}

          <section aria-labelledby="approval-details" className="space-y-2">
            <h2 id="approval-details" className="text-sm font-semibold">
              {t('approvals.details')}
            </h2>
            <dl className="divide-y rounded-lg border text-sm">
              {payloadRows(data.payload).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-4 px-3 py-2">
                  <dt className="text-muted-foreground">{t(`approvals.fields.${key}`, { defaultValue: key })}</dt>
                  <dd className="text-right font-medium">{value === null || value === '' ? '—' : String(value)}</dd>
                </div>
              ))}
            </dl>
          </section>

          {(mayReview || isMine) && (
            <div className="flex flex-wrap gap-2 border-t pt-4">
              {mayReview && (
                <>
                  <Button
                    onClick={() => approve.mutate(data.id, { onSuccess: backToList })}
                    disabled={busy}
                  >
                    <Check /> {t('approvals.buttons.approve')}
                  </Button>
                  <Button variant="ghost" className="text-danger" onClick={() => setRejecting(true)} disabled={busy}>
                    <X /> {t('approvals.buttons.reject')}
                  </Button>
                </>
              )}
              {isMine && (
                <Button variant="ghost" onClick={() => cancel.mutate(data.id, { onSuccess: backToList })} disabled={busy}>
                  {t('approvals.buttons.cancel')}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <RejectDialog
        open={rejecting}
        busy={reject.isPending}
        onClose={() => setRejecting(false)}
        onConfirm={(reason) => reject.mutate({ id: data.id, reason }, { onSuccess: () => { setRejecting(false); backToList() } })}
      />
    </>
  )
}
