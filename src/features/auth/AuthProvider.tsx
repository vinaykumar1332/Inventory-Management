import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { can, type Permission } from '@/lib/permissions'
import { getCurrentUserSync, login as apiLogin, logout as apiLogout } from '@/services/mockApi'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  login: (email: string) => Promise<User>
  logout: () => void
  can: (permission: Permission) => boolean
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient()
  const [user, setUser] = React.useState<User | null>(() => getCurrentUserSync())

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      login: async (email) => {
        const u = await apiLogin(email)
        qc.clear()
        setUser(u)
        return u
      },
      logout: () => {
        void apiLogout()
        qc.clear()
        setUser(null)
      },
      can: (permission) => can(user?.role, permission),
    }),
    [user, qc],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

/** Current user; only call inside authenticated routes. */
export function useUser(): User {
  const { user } = useAuth()
  if (!user) throw new Error('No authenticated user')
  return user
}
