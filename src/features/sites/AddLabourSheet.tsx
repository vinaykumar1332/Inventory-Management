import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useAddLabourMember } from '@/hooks/queries'
import type { StaffRole } from '@/types'
import { Button, Field, Input, Select } from '@/components/ui'
import { SidePanel } from '@/components/common'

const ROLES: StaffRole[] = ['foreman', 'supervisor', 'worker', 'quality_checker']

/** Adds one person to a site roster. Only the name is required. */
export function AddLabourSheet({ open, onOpenChange, siteId }: { open: boolean; onOpenChange: (o: boolean) => void; siteId: string }) {
  const { t } = useTranslation()
  const add = useAddLabourMember()
  const [name, setName] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [role, setRole] = React.useState<StaffRole>('worker')
  const [nameError, setNameError] = React.useState(false)

  const reset = () => {
    setName('')
    setPhone('')
    setRole('worker')
    setNameError(false)
  }

  const submit = async () => {
    if (!name.trim()) {
      setNameError(true)
      return
    }
    try {
      await add.mutateAsync({ siteId, name, phone, role })
      reset()
      onOpenChange(false)
    } catch {
      /* toast handled by mutation */
    }
  }

  return (
    <SidePanel
      open={open}
      width="sm"
      onClose={() => {
        reset()
        onOpenChange(false)
      }}
      title={t('labour.addMember')}
      description={t('labour.addHint')}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={() => void submit()} disabled={add.isPending}>
            {t('labour.save')}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label={t('labour.cols.name')} htmlFor="lab-name" required error={nameError ? t('validation.required') : undefined}>
          <Input id="lab-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <Field label={t('labour.cols.role')} htmlFor="lab-role">
          <Select
            id="lab-role"
            value={role}
            onChange={(e) => setRole(e.target.value as StaffRole)}
            options={ROLES.map((r) => ({ value: r, label: t(`labour.roles.${r}`) }))}
          />
        </Field>
        <Field label={t('labour.cols.phone')} htmlFor="lab-phone" hint={t('labour.phoneOptional')}>
          <Input id="lab-phone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
      </div>
    </SidePanel>
  )
}
