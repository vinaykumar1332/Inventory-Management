import { useTranslation } from 'react-i18next'
import { Check, Minus } from 'lucide-react'
import { rolesConfig } from '@/config'
import { Table, TableWrap, TBody, TD, TH, THead, TR } from '@/components/ui'
import { SectionCard } from '@/components/common'
import { describeAccess, type Permission } from '../permissions'

/** Role-by-permission table. Rows and roles come from src/config/roles.json. */
export function AccessMatrix() {
  const { t } = useTranslation()
  return (
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
                {rolesConfig.roles.map((r) => {
                  const access = describeAccess(r, p as Permission)
                  return (
                    <TD key={r} className="text-center text-xs">
                      {access === 'direct' && <Check className="mx-auto size-4 text-success" aria-label={t('access.direct')} />}
                      {access === 'needs_approval' && <span className="text-warning">{t('access.approval')}</span>}
                      {access === 'forbidden' && <Minus className="mx-auto size-4 text-muted-foreground/50" aria-label={t('access.none')} />}
                    </TD>
                  )
                })}
              </TR>
            ))}
          </TBody>
        </Table>
      </TableWrap>
    </SectionCard>
  )
}
