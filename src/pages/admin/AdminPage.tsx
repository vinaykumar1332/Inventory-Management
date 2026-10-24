import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, Pencil, Plus, RotateCcw, ShieldAlert } from 'lucide-react'
import { appConfig } from '@/config'
import { useAuth } from '@/features/auth/AuthProvider'
import { ResetDemoDialog } from '@/features/admin/ResetDemo'
import { UserSheet } from '@/features/admin/UserSheet'
import * as api from '@/api/mockApi'
import { useApiMutation, useCompany, useSiteDirectory, useUsers } from '@/hooks/queries'
import { AccessMatrix } from '@/features/access'
import type { User } from '@/types'
import { Badge, Button } from '@/components/ui'
import { Loader, PageLayout, ResponsiveTable, SectionCard, type Column } from '@/components/common'

export default function AdminPage() {
  const { t } = useTranslation()
  const { user: me } = useAuth()
  const { data: users } = useUsers()
  const { data: sites } = useSiteDirectory()
  const { data: company } = useCompany()
  const [confirm, setConfirm] = React.useState(false)
  const [sheet, setSheet] = React.useState<{ open: boolean; user: User | null }>({ open: false, user: null })
  const setStatus = useApiMutation((v: { id: string; status: 'active' | 'disabled' }) => api.updateUser(v.id, { status: v.status }), {
    successKey: 'users.updated',
  })

  const userColumns: Column<User>[] = [
    {
      key: 'name',
      header: t('users.cols.name'),
      cell: (u) => (
        <>
          <p className="font-medium">{u.name}</p>
          <p className="text-xs text-muted-foreground">{u.email}</p>
        </>
      ),
      className: 'whitespace-nowrap',
    },
    { key: 'employeeId', header: t('users.cols.employeeId'), cell: (u) => u.employeeId, className: 'font-mono text-xs' },
    { key: 'designation', header: t('users.cols.designation'), cell: (u) => u.designation, className: 'text-xs' },
    {
      key: 'role',
      header: t('users.cols.role'),
      cell: (u) => <Badge tone={u.role === 'super_admin' ? 'navy' : u.role === 'admin' ? 'primary' : 'neutral'}>{t(`roles.${u.role}`)}</Badge>,
    },
    {
      key: 'sites',
      header: t('users.cols.sites'),
      cell: (u) => (u.role === 'site_manager' ? u.siteIds.map((id) => sites?.find((s) => s.id === id)?.name ?? id).join(', ') : t('users.allSites')),
      className: 'text-xs',
    },
    {
      key: 'status',
      header: t('users.cols.status'),
      cell: (u) => (
        <Badge tone={u.status === 'active' ? 'success' : 'neutral'}>{u.status === 'active' ? t('users.statusActive') : t('users.statusDisabled')}</Badge>
      ),
    },
  ]

  return (
    <PageLayout title={t('users.title')} subtitle={t('users.subtitle')}>
      <p role="note" className="mb-5 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {t('admin.securityNote')}
      </p>

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard title={t('admin.company')} contentClassName="space-y-3 text-sm">
          {company ? (
            <>
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-navy text-white">
                  <Building2 className="size-5" aria-hidden />
                </span>
                <p className="font-semibold">{company.name}</p>
              </div>
              <p className="text-muted-foreground">{company.address}</p>
              <p>
                <span className="text-muted-foreground">{t('admin.gstin')}: </span>
                <span className="font-mono">{company.gstin}</span>
              </p>
            </>
          ) : (
            <Loader compact />
          )}
        </SectionCard>
        {appConfig.features.resetDemoData && (
          <SectionCard title={t('admin.demoControls')} description={t('admin.demoControlsHint')} className="lg:col-span-2">
            <Button variant="warning" onClick={() => setConfirm(true)}>
              <RotateCcw /> {t('header.resetDemo')}
            </Button>
          </SectionCard>
        )}
      </div>

      <SectionCard
        title={t('admin.users')}
        className="mt-5"
        flush
        actions={
          <Button size="sm" onClick={() => setSheet({ open: true, user: null })}>
            <Plus /> {t('users.add')}
          </Button>
        }
      >
        <ResponsiveTable
          caption={t('admin.users')}
          loading={!users}
          rows={users ?? []}
          rowKey={(u) => u.id}
          columns={userColumns}
          actionsLabel={t('common.actions')}
          rowActions={(u) =>
            me?.role === 'super_admin' || (me?.role === 'admin' && u.role !== 'admin') ? (
              <>
                <Button size="sm" variant="ghost" onClick={() => setSheet({ open: true, user: u })} aria-label={t('users.edit')}>
                  <Pencil /> <span className="hidden lg:inline">{t('users.edit')}</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={setStatus.isPending}
                  onClick={() => setStatus.mutate({ id: u.id, status: u.status === 'active' ? 'disabled' : 'active' })}
                >
                  {u.status === 'active' ? t('users.disable') : t('users.enable')}
                </Button>
              </>
            ) : null
          }
        />
      </SectionCard>

      <AccessMatrix />

      <UserSheet open={sheet.open} user={sheet.user} onOpenChange={(open) => setSheet((s) => ({ ...s, open }))} />
      <ResetDemoDialog open={confirm} onOpenChange={setConfirm} />
    </PageLayout>
  )
}
