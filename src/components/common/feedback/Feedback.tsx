import * as React from 'react'
import { AlertCircle, Inbox, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" aria-hidden />
      </div>
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  const { t } = useTranslation()
  return (
    <div role="alert" className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-danger-soft">
        <AlertCircle className="size-6 text-danger" aria-hidden />
      </div>
      <p className="font-medium">{t('errors.loadFailed')}</p>
      <p className="mt-1 text-sm text-muted-foreground">{message ?? t('errors.generic')}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          <RotateCcw /> {t('common.retry')}
        </Button>
      )}
    </div>
  )
}

interface QueryLike {
  isLoading: boolean
  isError: boolean
  refetch: () => unknown
}

/**
 * Standard loading → error → empty → content switch for React Query results,
 * so pages don't repeat the same branching.
 */
export function QueryState({
  query,
  isEmpty,
  loading,
  empty,
  children,
}: {
  query: QueryLike
  isEmpty?: boolean
  loading: React.ReactNode
  empty?: React.ComponentProps<typeof EmptyState>
  children: React.ReactNode
}) {
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />
  if (query.isLoading) return <>{loading}</>
  if (isEmpty && empty) return <EmptyState {...empty} />
  return <>{children}</>
}
