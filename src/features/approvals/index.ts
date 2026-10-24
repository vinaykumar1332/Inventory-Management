// Approvals: changes that need a second person before they take effect.
// Screens import from here. The API layer imports './engine' directly to avoid cycles.
export * from './types'
export { isSubmitted, snapshotFor, visibleApprovals, type ApprovalScope } from './engine'
export { useApprovals, useWaitingApprovalCount, useApprovalActions, useApprovalDetail } from './hooks'
export { ApprovalStatusBadge, PendingApprovalChip } from './components/ApprovalBadges'
export { ApprovalCard, actionKey } from './components/ApprovalCard'
export { RejectDialog } from './components/RejectDialog'
export { ApprovalNotifier } from './components/ApprovalNotifier'
