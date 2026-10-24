import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ShieldAlert, SearchX } from 'lucide-react'
import { EmptyState } from './Feedback'
import { ROUTES } from '@/app/routes'

/** One message for a page that does not exist or that the user may not see. Never crashes. */
export function AccessMessage({ kind, backTo = ROUTES.afterLogin }: { kind: 'notFound' | 'forbidden'; backTo?: string }) {
  const { t } = useTranslation()
  const forbidden = kind === 'forbidden'
  return (
    <EmptyState
      icon={forbidden ? ShieldAlert : SearchX}
      title={t(forbidden ? 'auth.accessDenied' : 'errors.pageNotFound')}
      description={t(forbidden ? 'auth.accessDeniedHint' : 'errors.pageNotFoundHint')}
      action={
        <Link to={backTo} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          {t('common.backToDashboard')}
        </Link>
      }
    />
  )
}
