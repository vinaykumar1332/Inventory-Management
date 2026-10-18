import * as React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, m } from 'motion/react'
import {
  Check,
  CheckCheck,
  CircleCheckBig,
  ExternalLink,
  Send,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { useAlerts, useApiMutation } from '@/hooks/queries'
import * as api from '@/services/mockApi'
import { catalog } from '@/config'
import { getIcon } from '@/config/icons'
import { TINT_CLASSES } from '@/config/tones'
import { cn } from '@/lib/utils'
import { Badge, Button, Card, Checkbox, ConfirmDialog, Skeleton, Tooltip } from '@/components/ui'
import { EmptyState, ErrorState, PageHeader, Segmented } from '@/components/common'
import type { Alert, AlertType } from '@/types'
import { formatQty } from '@/utils/format'

// Filters, icons, tints, severity tones and remindable types: catalog.json → alerts
const FILTERS = catalog.alerts.filters

function useAlertMessage() {
  const { t } = useTranslation()
  return (a: Alert) => {
    const qty = a.qty !== undefined && a.unit ? formatQty(a.qty, a.unit) : ''
    switch (a.type) {
      case 'expired':
        return t('alerts.msg.expired', { product: a.productName, batchNo: a.batchNo, days: -(a.days ?? 0), qty })
      case 'expiring_7':
      case 'expiring_15':
      case 'expiring_30':
        return t('alerts.msg.expiring', { product: a.productName, batchNo: a.batchNo, days: a.days, qty })
      case 'low_stock':
        return t('alerts.msg.low_stock', { product: a.productName, qty })
      case 'tool_overdue':
        return t('alerts.msg.tool_overdue', { tool: a.toolName, days: a.days })
      case 'pending_approval':
        return t('alerts.msg.pending_approval', { invoiceNo: a.invoiceNo })
    }
  }
}

function AlertItem({ alert, onException }: { alert: Alert; onException: (a: Alert) => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { can } = useAuth()
  const message = useAlertMessage()
  const update = useApiMutation((v: { ids: string[]; patch: { read?: boolean; resolved?: boolean } }) => api.updateAlerts(v.ids, v.patch))
  const remind = useApiMutation(api.sendReminder, { successKey: 'alerts.reminderSent' })
  const meta = catalog.alerts.types[alert.type]
  const TypeIcon = getIcon(meta.icon)

  const open = () => {
    if (!alert.read) update.mutate({ ids: [alert.id], patch: { read: true } })
    if (alert.invoiceId) navigate(`/upload?invoice=${alert.invoiceId}`)
    else if (alert.toolId) navigate(`/tools?tool=${alert.toolId}`)
    else if (alert.productId) navigate(`/inventory?product=${alert.productId}&productSite=${alert.siteId}`)
  }

  return (
    <m.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18 }}
      className={cn('flex gap-3 px-4 py-4 md:px-5', !alert.read && !alert.resolved && 'bg-primary-soft/25', alert.resolved && 'opacity-60')}
    >
      <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', TINT_CLASSES[meta.tint])} aria-hidden>
        <TypeIcon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={catalog.alerts.severityTones[alert.severity]}>{t(`alerts.severity.${alert.severity}`)}</Badge>
          <Badge>{t(`alerts.filters.${alert.type}`)}</Badge>
          {!alert.read && !alert.resolved && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden />
              {t('alerts.unread')}
            </span>
          )}
          {alert.resolved && <Badge tone="success">{t('alerts.resolved')}</Badge>}
        </div>
        <p className={cn('mt-1.5 text-sm', !alert.read && 'font-medium')}>{message(alert)}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{alert.siteName}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Button size="sm" variant="secondary" onClick={open}>
            <ExternalLink />
            {alert.invoiceId ? t('alerts.openBill') : alert.toolId ? t('alerts.openTool') : t('alerts.openBatch')}
          </Button>
          {!alert.read && !alert.resolved && (
            <Button size="sm" variant="ghost" onClick={() => update.mutate({ ids: [alert.id], patch: { read: true } })}>
              <Check /> {t('alerts.markRead')}
            </Button>
          )}
          {!alert.resolved && (
            <Button size="sm" variant="ghost" onClick={() => update.mutate({ ids: [alert.id], patch: { resolved: true, read: true } })}>
              <CircleCheckBig /> {t('alerts.resolve')}
            </Button>
          )}
          {!alert.resolved && catalog.alerts.remindable.includes(alert.type) && (
            <Button size="sm" variant="ghost" onClick={() => remind.mutate(alert.id)} disabled={remind.isPending}>
              <Send /> {t('alerts.sendReminder')}
            </Button>
          )}
          {alert.type === 'expired' && !alert.resolved && (
            can('expiry_override') ? (
              <Button size="sm" variant="ghost" className="text-warning" onClick={() => onException(alert)}>
                <ShieldCheck /> {t('alerts.approveException')}
              </Button>
            ) : (
              <Tooltip content={t('alerts.exceptionNoPermission')}>
                <span tabIndex={0} className="inline-flex">
                  <Button size="sm" variant="ghost" disabled>
                    <ShieldCheck /> {t('alerts.approveException')}
                  </Button>
                </span>
              </Tooltip>
            )
          )}
        </div>
      </div>
    </m.li>
  )
}

export default function AlertsPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const filter = (params.get('filter') as AlertType | 'all' | null) ?? 'all'
  const { data, isLoading, isError, refetch } = useAlerts()
  const [unreadOnly, setUnreadOnly] = React.useState(false)
  const [showResolved, setShowResolved] = React.useState(false)
  const [exceptionFor, setExceptionFor] = React.useState<Alert | null>(null)
  const markAll = useApiMutation((ids: string[]) => api.updateAlerts(ids, { read: true }))
  const exception = useApiMutation(api.approveExpiryException, { successKey: 'alerts.exceptionDone' })

  const visible = React.useMemo(
    () =>
      (data ?? [])
        .filter((a) => (filter === 'all' || a.type === filter) && (showResolved || !a.resolved) && (!unreadOnly || !a.read))
        .sort((a, b) => Number(a.resolved) - Number(b.resolved) || Number(a.read) - Number(b.read)),
    [data, filter, unreadOnly, showResolved],
  )
  const count = (f: AlertType | 'all') => (data ?? []).filter((a) => !a.resolved && (f === 'all' || a.type === f)).length
  const unreadIds = visible.filter((a) => !a.read).map((a) => a.id)

  return (
    <>
      <PageHeader
        title={t('alerts.title')}
        subtitle={t('alerts.subtitle')}
        actions={
          <Button variant="secondary" disabled={!unreadIds.length || markAll.isPending} onClick={() => markAll.mutate(unreadIds)}>
            <CheckCheck /> {t('alerts.markAllRead')}
          </Button>
        }
      />
      <Card>
        <div className="space-y-3 border-b p-3 md:p-4">
          <Segmented
            label={t('alerts.title')}
            value={filter}
            onChange={(v) => setParams(v === 'all' ? {} : { filter: v }, { replace: true })}
            options={FILTERS.map((f) => ({ value: f, label: t(`alerts.filters.${f}`), count: count(f) }))}
          />
          <div className="flex flex-wrap gap-5 text-sm">
            <label className="flex min-h-10 items-center gap-2">
              <Checkbox checked={unreadOnly} onCheckedChange={(v) => setUnreadOnly(v === true)} />
              {t('alerts.unreadOnly')}
            </label>
            <label className="flex min-h-10 items-center gap-2">
              <Checkbox checked={showResolved} onCheckedChange={(v) => setShowResolved(v === true)} />
              {t('alerts.showResolved')}
            </label>
          </div>
        </div>
        {isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState icon={CircleCheckBig} title={t('alerts.empty')} description={t('alerts.emptyHint')} />
        ) : (
          <ul className="divide-y">
            <AnimatePresence initial={false}>
              {visible.map((a) => (
                <AlertItem key={a.id} alert={a} onException={setExceptionFor} />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Card>
      <ConfirmDialog
        open={!!exceptionFor}
        onOpenChange={(o) => !o && setExceptionFor(null)}
        title={t('alerts.exceptionTitle')}
        description={t('alerts.exceptionBody', { batchNo: exceptionFor?.batchNo })}
        confirmLabel={t('alerts.approveException')}
        tone="warning"
        loading={exception.isPending}
        onConfirm={() => {
          if (exceptionFor?.batchId) exception.mutate(exceptionFor.batchId, { onSuccess: () => setExceptionFor(null) })
        }}
      />
    </>
  )
}
