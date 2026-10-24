import type { ID, ISODate, Role } from '@/types'

/** direct: applied at once. needs_approval: stored as a pending Approval. forbidden: rejected. */
export type SubmissionMode = 'direct' | 'needs_approval' | 'forbidden'

export type GovernedAction =
  | 'bill.upload'
  | 'bill.approve'
  | 'stock.issue'
  | 'stock.return'
  | 'stock.transfer'
  | 'damage.report'
  | 'stock.adjust'
  | 'expiry.override'
  | 'site.create'
  | 'site.update'
  | 'manager.assign'
  | 'user.create'
  | 'user.update'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'conflict'

export interface Approval {
  id: ID
  action: GovernedAction
  siteId: ID | null
  entityId: ID | null
  /** Exact input of the original call; re-applied when approved. */
  payload: Record<string, unknown>
  summary: string
  submittedBy: ID
  submittedAt: ISODate
  requiredApproverRole: Role
  status: ApprovalStatus
  /** Serialised target state at submission. If it changed before approval, the approval becomes a conflict. */
  snapshot: string | null
  reviewedBy: ID | null
  reviewedAt: ISODate | null
  reason: string | null
}

export interface ApprovalRow extends Approval {
  submitterName: string
  submitterRole: Role
  reviewerName: string | null
  siteName: string | null
}

/** Returned instead of the result when a change is waiting for approval. */
export interface Submitted {
  status: 'pending'
  approvalId: ID
}
