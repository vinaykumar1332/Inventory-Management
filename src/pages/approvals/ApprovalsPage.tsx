import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarClock } from 'lucide-react'
import type { ApprovalScope, ApprovalRow } from '@/features/approvals'
import { ApprovalCard, RejectDialog, useApprovalActions, useApprovals } from '@/features/approvals'
import { Card, CardContent } from '@/components/ui'
import { EmptyState, ErrorState, Loader, PageHeader, PageTabs, TabsContent } from '@/components/common'

const SCOPES: ApprovalScope[] = ['waiting_for_me', 'my_submissions', 'history']
const TAB_KEY: Record<ApprovalScope, string> = { waiting_for_me: 'waiting', my_submissions: 'mine', history: 'history' }

export default function ApprovalsPage() {
  const { t } = useTranslation()
  const [scope, setScope] = React.useState<ApprovalScope>('waiting_for_me')
  const { data, isLoading, isError, refetch } = useApprovals(scope)
  const { approve, reject, cancel, busy } = useApprovalActions()
  const [rejecting, setRejecting] = React.useState<ApprovalRow | null>(null)

  return (
    <>
      <PageHeader title={t('approvals.title')} subtitle={t('approvals.subtitle')} />
      <Card>
        <CardContent className="p-0">
          <PageTabs
            value={scope}
            onChange={setScope}
            tabs={SCOPES.map((s) => ({ value: s, label: t(`approvals.tabs.${TAB_KEY[s]}`) }))}
            listClassName="mb-0 px-3 pt-2"
          >
            {SCOPES.map((s) => (
              <TabsContent key={s} value={s}>
                {isError ? (
                  <ErrorState onRetry={() => void refetch()} />
                ) : isLoading || !data ? (
                  <Loader />
                ) : data.length === 0 ? (
                  <EmptyState icon={CalendarClock} title={t('approvals.empty')} description={t('approvals.emptyHint')} />
                ) : (
                  <ul className="divide-y">
                    {data.map((row) => (
                      <ApprovalCard
                        key={row.id}
                        row={row}
                        scope={scope}
                        busy={busy}
                        onApprove={() => approve.mutate(row.id)}
                        onReject={() => setRejecting(row)}
                        onCancel={() => cancel.mutate(row.id)}
                      />
                    ))}
                  </ul>
                )}
              </TabsContent>
            ))}
          </PageTabs>
        </CardContent>
      </Card>

      <RejectDialog
        open={rejecting !== null}
        busy={reject.isPending}
        onClose={() => setRejecting(null)}
        onConfirm={(reason) => {
          if (!rejecting) return
          reject.mutate({ id: rejecting.id, reason }, { onSuccess: () => setRejecting(null) })
        }}
      />
    </>
  )
}
