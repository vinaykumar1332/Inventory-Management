import { rolesConfig } from '@/config'
import type { Role } from '@/types'
import type { GovernedAction, SubmissionMode } from '@/features/approvals/types'

// Who may do what. The table lives in src/config/roles.json. Every check in the
// UI and the mock API goes through describeAccess(), so both always agree.
// UI-only demo authorization: a real backend must enforce the same rules.

export type Permission =
  | 'upload_bills'
  | 'approve_bills'
  | 'issue_material'
  | 'return_material'
  | 'transfer_stock'
  | 'report_damage'
  | 'stock_adjustment'
  | 'expiry_override'
  | 'manage_sites'
  | 'edit_sites'
  | 'assign_managers'
  | 'manage_users'
  | 'view_bills'
  | 'view_reports'
  | 'manage_tools'
  | 'view_audit_log'
  | 'create_admin'

export function getSubmissionMode(role: Role | undefined, action: GovernedAction): SubmissionMode {
  if (!role) return 'forbidden'
  return rolesConfig.actions[action][role]
}

/** The access level for a permission name or a governed action name. */
export function describeAccess(role: Role | undefined, key: Permission | GovernedAction): SubmissionMode {
  if (!role) return 'forbidden'
  if (key in rolesConfig.actions) return getSubmissionMode(role, key as GovernedAction)
  const action = rolesConfig.permissionAliases[key]
  if (action) return getSubmissionMode(role, action)
  return rolesConfig.staticPermissions[key]?.[role] ? 'direct' : 'forbidden'
}

export function can(role: Role | undefined, permission: Permission): boolean {
  return describeAccess(role, permission) !== 'forbidden'
}

/** A Site Manager's submissions go to an Admin; everyone else's go to a Super Admin. */
export function requiredApproverFor(submitterRole: Role): Role {
  return submitterRole === 'site_manager' ? 'admin' : 'super_admin'
}

export function canApprove(approverRole: Role | undefined, required: Role): boolean {
  if (!approverRole) return false
  return approverRole === 'super_admin' || (required === 'admin' && approverRole === 'admin')
}
