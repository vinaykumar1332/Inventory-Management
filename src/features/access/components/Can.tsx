import { useAuth } from '@/features/auth/AuthProvider'
import type { Permission } from '../permissions'

/** Renders children only when the signed-in user may use the permission. */
export function Can({ permission, children, fallback = null }: { permission: Permission; children: React.ReactNode; fallback?: React.ReactNode }) {
  const { can } = useAuth()
  return <>{can(permission) ? children : fallback}</>
}
