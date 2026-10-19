import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from '@/i18n'
import { can, type Permission } from '@/lib/permissions'
import { getCurrentUserSync, login as apiLogin, logout as apiLogout } from '@/api/mockApi'
import type { User } from '@/types'

/** Fired when an API call reports the session is gone (see app/App.tsx). */
export const SESSION_EXPIRED_EVENT = 'siteseal:session-expired'

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

  React.useEffect(() => {
    // Session vanished (cookie cleared, reset) → protected routes send the user to /login
    const onExpired = () => {
      if (!getCurrentUserSync()) {
        qc.clear()
        setUser(null)
        toast.error(i18n.t('auth.sessionEnded'))
      }
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [qc])

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
