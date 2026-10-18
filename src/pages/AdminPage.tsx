import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Building2, Check, Minus, RotateCcw, ShieldAlert } from 'lucide-react'
import { appConfig, rolesConfig } from '@/config'
import { ResetDemoDialog } from '@/features/admin/ResetDemo'
import { useCompany, useSiteDirectory, useUsers } from '@/hooks/queries'
import { ROLE_PERMISSIONS } from '@/lib/permissions'
import { Badge, Button, Skeleton, Table, TableWrap, TBody, TD, TH, THead, TR } from '@/components/ui'
import { PageHeader, SectionCard } from '@/components/common'

export default function AdminPage() {
  const { t } = useTranslation()
  const { data: users } = useUsers()
  const { data: sites } = useSiteDirectory()
  const { data: company } = useCompany()
  const [confirm, setConfirm] = React.useState(false)

  return (
    <>
      <PageHeader title={t('admin.title')} subtitle={t('admin.subtitle')} />
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
            <Skeleton className="h-24" />
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

      <SectionCard title={t('admin.users')} className="mt-5" flush>
        <TableWrap>
          <Table>
            <THead>
              <tr>
                <TH>{t('admin.cols.name')}</TH>
                <TH>{t('admin.cols.email')}</TH>
                <TH>{t('admin.cols.role')}</TH>
                <TH>{t('admin.cols.sites')}</TH>
                <TH>{t('admin.cols.phone')}</TH>
              </tr>
            </THead>
            <TBody>
              {users?.map((u) => (
                <TR key={u.id}>
                  <TD className="whitespace-nowrap font-medium">{u.name}</TD>
                  <TD className="whitespace-nowrap">{u.email}</TD>
                  <TD>
                    <Badge tone={u.role === 'super_admin' ? 'navy' : u.role === 'admin' ? 'primary' : 'neutral'}>{t(`roles.${u.role}`)}</Badge>
                  </TD>
                  <TD className="text-xs">
                    {u.siteIds.length === 0 ? t('admin.allSites') : u.siteIds.map((id) => sites?.find((s) => s.id === id)?.name ?? id).join(', ')}
                  </TD>
                  <TD className="tabular whitespace-nowrap">{u.phone}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      </SectionCard>

      {/* Matrix rows and role permissions come from src/config/roles.json */}
      <SectionCard title={t('admin.permissions')} className="mt-5" flush>
        <TableWrap>
          <Table>
            <THead>
              <tr>
                <TH />
                {rolesConfig.roles.map((r) => (
                  <TH key={r} className="text-center">
                    {t(`roles.${r}`)}
                  </TH>
                ))}
              </tr>
            </THead>
            <TBody>
              {rolesConfig.permissionMatrixRows.map((p) => (
                <TR key={p}>
                  <TD className="whitespace-nowrap text-sm">{t(`admin.perm.${p}`)}</TD>
                  {rolesConfig.roles.map((r) => (
                    <TD key={r} className="text-center">
                      {ROLE_PERMISSIONS[r].includes(p) ? (
                        <Check className="mx-auto size-4 text-success" aria-label={t('common.yes')} />
                      ) : (
                        <Minus className="mx-auto size-4 text-muted-foreground/50" aria-label={t('common.no')} />
                      )}
                    </TD>
                  ))}
                </TR>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      </SectionCard>

      <ResetDemoDialog open={confirm} onOpenChange={setConfirm} />
    </>
  )
}
