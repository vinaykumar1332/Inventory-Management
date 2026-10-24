import { useQuery } from '@tanstack/react-query'
import * as api from '@/api/mockApi'
import { useApiMutation } from '@/hooks/queries'
import type { ApprovalScope } from './engine'

export const useApprovals = (scope: ApprovalScope) =>
  useQuery({ queryKey: ['approvals', scope], queryFn: () => api.listApprovals(scope) })

/** Approvals waiting for the signed-in user. Drives the navigation badge. */
export function useWaitingApprovalCount() {
  const { data } = useApprovals('waiting_for_me')
  return data?.length ?? 0
}

/** Approve, reject and cancel mutations with their toasts. */
export function useApprovalActions() {
  const approve = useApiMutation((id: string) => api.approveRequest(id), { successKey: 'approvals.approved' })
  const reject = useApiMutation((v: { id: string; reason: string }) => api.rejectRequest(v.id, v.reason), { successKey: 'approvals.rejected' })
  const cancel = useApiMutation((id: string) => api.cancelRequest(id), { successKey: 'approvals.cancelled' })
  return { approve, reject, cancel, busy: approve.isPending || reject.isPending || cancel.isPending }
}

export const useApprovalDetail = (approvalId: string) =>
  useQuery({ queryKey: ['approval', approvalId], queryFn: () => api.getApproval(approvalId), enabled: !!approvalId })
