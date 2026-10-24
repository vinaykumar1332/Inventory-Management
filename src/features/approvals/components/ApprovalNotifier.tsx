import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as api from '@/api/mockApi'
import { useAuth } from '@/features/auth/AuthProvider'

// Approvals already announced, per signed-in user. Kept on globalThis so hot reloads
// do not repeat the notice. A user who signs out and back in is announced again.
const SEEN_KEY = '__siteseal_seen_approvals__'
const globalSeen = globalThis as typeof globalThis & { [SEEN_KEY]?: Set<string> }
const seen: Set<string> = (globalSeen[SEEN_KEY] ??= new Set())

/** Shows an important toast for each approval waiting for the signed-in reviewer. */
export function ApprovalNotifier() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data } = useQuery({
    queryKey: ['approvals', 'waiting_for_me'],
    queryFn: () => api.listApprovals('waiting_for_me'),
    refetchInterval: 30_000,
    enabled: !!user,
  })

  React.useEffect(() => {
    if (!user || !data) return
    const fresh = data.filter((a) => !seen.has(user.id + ':' + a.id))
    if (fresh.length === 0) return
    fresh.forEach((a) => seen.add(user.id + ':' + a.id))
    const duration = 12_000
    if (fresh.length === 1) {
      const [a] = fresh
      toast.warning(t('approvals.incomingOne', { name: a.submitterName, summary: a.summary }), {
        duration,
        action: { label: t('approvals.view'), onClick: () => navigate('/approvals/' + a.id) },
      })
    } else {
      toast.warning(t('approvals.incomingMany', { count: fresh.length }), {
        duration,
        action: { label: t('approvals.view'), onClick: () => navigate('/approvals') },
      })
    }
  }, [data, user, navigate, t])

  return null
}
