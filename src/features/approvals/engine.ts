import type { DemoDb } from '@/data'
import type { ID, User } from '@/types'
import { ApiError } from '@/api/errors'
import { audit } from '@/api/audit'
import { uid } from '@/lib/utils'
import { nowIso } from '@/utils/date'
import { canApprove, getSubmissionMode, requiredApproverFor } from '@/features/access/permissions'
import type { Approval, ApprovalRow, GovernedAction, Submitted } from './types'

// The approval engine. Pure rules over the mock DB: no React, no network.
// Every governed change goes through submitChange(); the review functions
// re-apply the stored input through the same appliers.

/** Applies one governed change. Used for direct changes and again when an approval is accepted. */
export type Applier = (db: DemoDb, submitter: User, payload: never) => unknown
export type Appliers = Record<GovernedAction, Applier>

export type ApprovalScope = 'waiting_for_me' | 'my_submissions' | 'history'

const clone = <T,>(value: T): T => structuredClone(value)

export function isSubmitted<T>(value: T | Submitted): value is Submitted {
  return typeof value === 'object' && value !== null && 'status' in value && (value as Submitted).status === 'pending'
}

/**
 * Fingerprint of the record a pending change would modify. If it differs when
 * the change is approved, the approval is marked as a conflict instead of
 * overwriting newer data.
 */
export function snapshotFor(db: DemoDb, action: GovernedAction, payload: Record<string, unknown>): string | null {
  if (typeof payload.batchId === 'string') {
    const batch = db.batches.find((b) => b.id === payload.batchId)
    return batch ? JSON.stringify({ qtyAvailable: batch.qtyAvailable, expiryOverride: !!batch.expiryOverride }) : null
  }
  if (action === 'bill.upload' || action === 'bill.approve') {
    const invoice = db.invoices.find((i) => i.id === payload.invoiceId)
    return invoice ? JSON.stringify({ status: invoice.status }) : null
  }
  if (action === 'manager.assign') {
    const site = db.sites.find((s) => s.id === payload.siteId)
    return site ? JSON.stringify({ managerId: site.managerId, backupManagerIds: site.backupManagerIds }) : null
  }
  if (action === 'site.update') {
    const site = db.sites.find((s) => s.id === payload.siteId)
    return site ? JSON.stringify({ status: site.status, code: site.code }) : null
  }
  if (action === 'user.update') {
    const user = db.users.find((u) => u.id === payload.id)
    return user ? JSON.stringify({ role: user.role, siteIds: user.siteIds, status: user.status }) : null
  }
  return null
}

export function toApprovalRow(db: DemoDb, approval: Approval): ApprovalRow {
  const submitter = db.users.find((u) => u.id === approval.submittedBy)
  const reviewer = approval.reviewedBy ? db.users.find((u) => u.id === approval.reviewedBy) : undefined
  return {
    ...approval,
    submitterName: submitter?.name ?? '',
    submitterRole: submitter?.role ?? 'site_manager',
    reviewerName: reviewer?.name ?? null,
    siteName: approval.siteId ? (db.sites.find((s) => s.id === approval.siteId)?.name ?? null) : null,
  }
}

/** The approvals a user should see in one tab. */
export function visibleApprovals(db: DemoDb, me: User, scope: ApprovalScope): ApprovalRow[] {
  const rows = db.approvals.filter((a) => {
    const mine = a.submittedBy === me.id
    const mayReview = canApprove(me.role, a.requiredApproverRole) && !mine
    if (scope === 'waiting_for_me') return a.status === 'pending' && mayReview
    if (scope === 'my_submissions') return mine
    return a.status !== 'pending' && (mayReview || mine)
  })
  return rows.map((a) => toApprovalRow(db, a)).sort((x, y) => y.submittedAt.localeCompare(x.submittedAt))
}

export interface ChangeRequest {
  siteId: ID | null
  entityId?: ID | null
  summary: string
  payload: Record<string, unknown>
  /** Force approval even when the role could act directly (e.g. changing an Admin's role). */
  forceApproval?: boolean
}

/** Applies a direct change, or stores a pending approval that keeps the original input. */
export function submitChange<T>(db: DemoDb, user: User, action: GovernedAction, request: ChangeRequest, appliers: Appliers): T | Submitted {
  const base = getSubmissionMode(user.role, action)
  const mode = request.forceApproval && base === 'direct' ? 'needs_approval' : base
  if (mode === 'forbidden') throw new ApiError('errors.forbidden')
  if (mode === 'direct') return appliers[action](db, user, request.payload as never) as T
  const approval: Approval = {
    id: uid('ap'),
    action,
    siteId: request.siteId,
    entityId: request.entityId ?? null,
    payload: clone(request.payload),
    summary: request.summary,
    submittedBy: user.id,
    submittedAt: nowIso(),
    requiredApproverRole: requiredApproverFor(user.role),
    status: 'pending',
    snapshot: snapshotFor(db, action, request.payload),
    reviewedBy: null,
    reviewedAt: null,
    reason: null,
  }
  db.approvals.unshift(approval)
  audit(db, user.id, `submitted:${action}`, 'approval', approval.id, request.summary, approval.id)
  return { status: 'pending', approvalId: approval.id }
}

/** A pending approval the reviewer may act on (not their own, and within their role). */
function reviewable(db: DemoDb, me: User, approvalId: string): Approval {
  const approval = db.approvals.find((a) => a.id === approvalId)
  if (!approval) throw new ApiError('errors.notFound')
  if (approval.status !== 'pending') throw new ApiError('approvals.alreadyReviewed')
  if (approval.submittedBy === me.id) throw new ApiError('approvals.selfApproval')
  if (!canApprove(me.role, approval.requiredApproverRole)) throw new ApiError('errors.forbidden')
  return approval
}

export function approveChange(db: DemoDb, me: User, approvalId: string, appliers: Appliers): void {
  const approval = reviewable(db, me, approvalId)
  if (snapshotFor(db, approval.action, approval.payload) !== approval.snapshot) {
    approval.status = 'conflict'
    audit(db, me.id, 'approval_conflict', 'approval', approval.id, approval.summary, approval.id)
    throw new ApiError('approvals.conflict')
  }
  const submitter = db.users.find((u) => u.id === approval.submittedBy)
  if (!submitter) throw new ApiError('errors.notFound')
  appliers[approval.action](db, submitter, approval.payload as never)
  approval.status = 'approved'
  approval.reviewedBy = me.id
  approval.reviewedAt = nowIso()
  audit(db, me.id, `approved:${approval.action}`, 'approval', approval.id, approval.summary, approval.id)
}

export function rejectChange(db: DemoDb, me: User, approvalId: string, reason: string): void {
  if (!reason.trim()) throw new ApiError('approvals.reasonRequired')
  const approval = reviewable(db, me, approvalId)
  approval.status = 'rejected'
  approval.reviewedBy = me.id
  approval.reviewedAt = nowIso()
  approval.reason = reason.trim()
  audit(db, me.id, 'rejected', 'approval', approval.id, reason.trim(), approval.id)
}

/** Only the submitter may cancel, and only while the request is still pending. */
export function cancelChange(db: DemoDb, me: User, approvalId: string): void {
  const approval = db.approvals.find((a) => a.id === approvalId)
  if (!approval) throw new ApiError('errors.notFound')
  if (approval.submittedBy !== me.id) throw new ApiError('errors.forbidden')
  if (approval.status !== 'pending') throw new ApiError('approvals.alreadyReviewed')
  approval.status = 'cancelled'
  approval.reviewedBy = me.id
  approval.reviewedAt = nowIso()
  audit(db, me.id, 'cancelled', 'approval', approval.id, approval.summary, approval.id)
}
