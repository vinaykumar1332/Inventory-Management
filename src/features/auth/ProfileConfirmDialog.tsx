import { useTranslation } from 'react-i18next'
import * as api from '@/api/mockApi'
import { useApiMutation } from '@/hooks/queries'
import { useAuth } from '@/features/auth/AuthProvider'
import { ConfirmDialog } from '@/components/ui'

/** Shown once to a user created by an admin, before they use the app. */
export function ProfileConfirmDialog() {
  const { t } = useTranslation()
  const { user, refreshUser } = useAuth()
  const confirm = useApiMutation((_: void) => api.confirmProfile())
  if (!user || user.firstLoginCompleted) return null
  return (
    <ConfirmDialog
      open
      onOpenChange={() => undefined}
      title={t('profile.title')}
      description={`${user.name} · ${user.designation} · ${user.phone}. ${t('profile.body')}`}
      confirmLabel={t('profile.confirm')}
      tone="warning"
      loading={confirm.isPending}
      onConfirm={() => confirm.mutate(undefined, { onSuccess: refreshUser })}
    />
  )
}
