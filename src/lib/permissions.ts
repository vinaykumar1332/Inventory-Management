import { rolesConfig } from '@/config'
import type { Role } from '@/types'

// UI-only demo authorization. The role → permission matrix lives in
// src/config/roles.json. A production system must enforce every one of
// these checks on the server; hiding a button is not security.

export type Permission =
  | 'view_all_sites'
  | 'manage_sites'
  | 'manage_users'
  | 'manage_settings'
  | 'view_bills'
  | 'upload_bills'
  | 'approve_bills'
  | 'receive_stock'
  | 'issue_material'
  | 'return_material'
  | 'transfer_stock'
  | 'report_damage'
  | 'stock_adjustment'
  | 'expiry_override'
  | 'manage_tools'
  | 'view_reports'
  | 'manage_products'

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = rolesConfig.permissions

export function can(role: Role | undefined, permission: Permission): boolean {
  return !!role && ROLE_PERMISSIONS[role].includes(permission)
}
