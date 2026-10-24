import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import * as api from '@/api/mockApi'
import { useApiMutation, useUsers } from '@/hooks/queries'
import type { SiteStatus, SiteSummary } from '@/types'
import { Button, Field, Input, Select, Textarea } from '@/components/ui'
import { SidePanel } from '@/components/common'

const STATUSES: SiteStatus[] = ['setup', 'active', 'on_hold', 'completed']
const STATUS_KEY: Record<SiteStatus, string> = {
  setup: 'sites.statusSetup',
  active: 'sites.statusActive',
  on_hold: 'sites.statusOnHold',
  completed: 'sites.statusCompleted',
}

const schema = z
  .object({
    name: z.string().trim().min(1, 'validation.required'),
    code: z.string().trim().regex(/^[A-Za-z0-9-]{3,15}$/, 'validation.siteCode'),
    city: z.string().trim().min(1, 'validation.required'),
    address: z.string().trim().min(1, 'validation.required'),
    storeName: z.string().trim().min(1, 'validation.required'),
    startDate: z.string().min(1, 'validation.required'),
    endDate: z.string().min(1, 'validation.required'),
    status: z.enum(['setup', 'active', 'on_hold', 'completed']),
    progress: z.number({ error: 'validation.range' }).min(0, 'validation.range').max(100, 'validation.range'),
    assignedAdminId: z.string(),
    managerId: z.string(),
    backupManagerId: z.string(),
  })
  .refine((v) => v.endDate > v.startDate, { path: ['endDate'], message: 'validation.endAfterStart' })
  .refine((v) => !v.managerId || v.managerId !== v.backupManagerId, { path: ['backupManagerId'], message: 'errors.invalidManager' })
  .refine((v) => v.status !== 'active' || !!v.managerId, { path: ['status'], message: 'errors.siteNeedsManager' })

type Values = z.infer<typeof schema>

/** Super Admin only: edit a site's details, status, managers and assigned admin. */
export function EditSiteSheet({ open, onOpenChange, site }: { open: boolean; onOpenChange: (o: boolean) => void; site: SiteSummary }) {
  const { t } = useTranslation()
  const { data: users } = useUsers()
  const { register, handleSubmit, formState, reset } = useForm<Values>({
    resolver: zodResolver(schema),
    values: {
      name: site.name,
      code: site.code,
      city: site.city,
      address: site.address,
      storeName: site.storeName,
      startDate: site.startDate,
      endDate: site.endDate,
      status: site.status,
      progress: site.progress,
      assignedAdminId: site.assignedAdminId ?? '',
      managerId: site.managerId ?? '',
      backupManagerId: site.backupManagerIds[0] ?? '',
    },
  })

  const save = useApiMutation(
    async (v: Values) => {
      const managerId = v.managerId || null
      const backupManagerId = v.backupManagerId || null
      if (managerId !== site.managerId || backupManagerId !== (site.backupManagerIds[0] ?? null)) {
        await api.assignManager(site.id, managerId, backupManagerId)
      }
      return api.updateSite(site.id, {
        name: v.name,
        code: v.code,
        city: v.city,
        address: v.address,
        storeName: v.storeName,
        startDate: v.startDate,
        endDate: v.endDate,
        status: v.status,
        progress: v.progress,
        assignedAdminId: v.assignedAdminId || null,
      })
    },
    { successKey: 'sites.saved' },
  )

  const onSubmit = handleSubmit(async (v) => {
    try {
      await save.mutateAsync(v)
      onOpenChange(false)
      reset()
    } catch {
      /* toast handled by mutation */
    }
  })

  const err = (k: keyof Values) => (formState.errors[k]?.message ? t(formState.errors[k]?.message ?? '') : undefined)
  const admins = (users ?? []).filter((u) => u.role === 'admin' && u.status === 'active').map((u) => ({ value: u.id, label: u.name }))
  const managers = (users ?? []).filter((u) => u.role === 'site_manager' && u.status === 'active').map((u) => ({ value: u.id, label: u.name }))
  const statusOptions = STATUSES.map((s) => ({ value: s, label: t(STATUS_KEY[s]) }))

  return (
    <SidePanel
      open={open}
      onClose={() => onOpenChange(false)}
      width="md"
      title={t('sites.edit')}
      description={t('sites.editHint')}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="edit-site" disabled={save.isPending}>
            {save.isPending ? t('common.loading') : t('common.save')}
          </Button>
        </>
      }
    >
      <form id="edit-site" onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label={t('sites.name')} htmlFor="es-name" error={err('name')} required className="sm:col-span-2">
          <Input id="es-name" {...register('name')} />
        </Field>
        <Field label={t('sites.code')} htmlFor="es-code" error={err('code')} required>
          <Input id="es-code" className="uppercase" {...register('code')} />
        </Field>
        <Field label={t('sites.city')} htmlFor="es-city" error={err('city')} required>
          <Input id="es-city" {...register('city')} />
        </Field>
        <Field label={t('sites.address')} htmlFor="es-address" error={err('address')} required className="sm:col-span-2">
          <Textarea id="es-address" rows={2} {...register('address')} />
        </Field>
        <Field label={t('sites.storeName')} htmlFor="es-store" error={err('storeName')} required className="sm:col-span-2">
          <Input id="es-store" {...register('storeName')} />
        </Field>
        <Field label={t('sites.startDate')} htmlFor="es-start" error={err('startDate')} required>
          <Input id="es-start" type="date" {...register('startDate')} />
        </Field>
        <Field label={t('sites.endDate')} htmlFor="es-end" error={err('endDate')} required>
          <Input id="es-end" type="date" {...register('endDate')} />
        </Field>
        <Field label={t('common.status')} htmlFor="es-status" error={err('status')} required>
          <Select id="es-status" options={statusOptions} {...register('status')} />
        </Field>
        <Field label={t('sites.progress')} htmlFor="es-progress" error={err('progress')}>
          <Input id="es-progress" type="number" min={0} max={100} {...register('progress', { valueAsNumber: true })} />
        </Field>
        <Field label={t('sites.assignedAdmin')} htmlFor="es-admin" error={err('assignedAdminId')}>
          <Select id="es-admin" placeholder={t('common.selectPlaceholder')} options={admins} {...register('assignedAdminId')} />
        </Field>
        <Field label={t('sites.manager')} htmlFor="es-manager" error={err('managerId')} hint={t('sites.managerHint')}>
          <Select id="es-manager" placeholder={t('common.selectPlaceholder')} options={managers} {...register('managerId')} />
        </Field>
        <Field label={t('sites.backupManager')} htmlFor="es-backup" error={err('backupManagerId')}>
          <Select id="es-backup" placeholder={t('common.selectPlaceholder')} options={managers} {...register('backupManagerId')} />
        </Field>
      </form>
    </SidePanel>
  )
}
