import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useApiMutation, useCompany, useUsers } from '@/hooks/queries'
import { createSite } from '@/api/mockApi'
import { Button, Field, Input, Select, Textarea } from '@/components/ui'
import { SidePanel } from '@/components/common'
import { paths } from '@/app/routes'
import { isoDaysFromNow } from '@/utils/date'

const schema = z
  .object({
    companyName: z.string().trim().min(1, 'validation.required'),
    name: z.string().trim().min(1, 'validation.required'),
    address: z.string().trim().min(1, 'validation.required'),
    city: z.string().trim().min(1, 'validation.required'),
    code: z.string().trim().regex(/^[A-Za-z0-9-]{3,15}$/, 'validation.siteCode'),
    managerId: z.string(),
    backupManagerId: z.string(),
    startDate: z.string().min(1, 'validation.required'),
    endDate: z.string().min(1, 'validation.required'),
    storeName: z.string().trim().min(1, 'validation.required'),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate > v.startDate, { path: ['endDate'], message: 'validation.endAfterStart' })
  .refine((v) => !v.managerId || v.managerId !== v.backupManagerId, { path: ['backupManagerId'], message: 'errors.invalidManager' })

type Values = z.infer<typeof schema>

export function CreateSiteSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: users } = useUsers()
  const { data: company } = useCompany()
  const { register, handleSubmit, formState, reset, getValues, setValue } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: '',
      name: '',
      address: '',
      city: '',
      code: '',
      managerId: '',
      backupManagerId: '',
      startDate: isoDaysFromNow(0),
      endDate: isoDaysFromNow(240),
      storeName: '',
    },
  })
  const mutation = useApiMutation(createSite)

  // Prefill the company name from the company profile (mock: company.json)
  React.useEffect(() => {
    if (company && !getValues('companyName')) setValue('companyName', company.name)
  }, [company, getValues, setValue])

  const onSubmit = handleSubmit(async (v) => {
    try {
      const result = await mutation.mutateAsync({
        ...v,
        managerId: v.managerId || null,
        backupManagerId: v.backupManagerId || null,
      })
      reset()
      onOpenChange(false)
      if ('id' in result) {
        toast.success(t('sites.created', { name: result.name }))
        navigate(paths.site(result.id))
      }
    } catch {
      /* toast handled by mutation */
    }
  })

  const err = (k: keyof Values) => (formState.errors[k]?.message ? t(formState.errors[k]?.message ?? '') : undefined)
  const managerOptions = (users ?? [])
    .filter((u) => u.role === 'site_manager' && u.status === 'active')
    .map((u) => ({ value: u.id, label: u.name }))

  return (
    <SidePanel
      open={open}
      onClose={() => onOpenChange(false)}
      width="md"
      title={t('sites.createTitle')}
      description={t('sites.createHint')}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="create-site" disabled={mutation.isPending}>
            {mutation.isPending ? t('common.loading') : t('sites.create')}
          </Button>
        </>
      }
    >
      <form id="create-site" onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label={t('sites.companyName')} htmlFor="cs-company" error={err('companyName')} required className="sm:col-span-2">
          <Input id="cs-company" {...register('companyName')} />
        </Field>
        <Field label={t('sites.name')} htmlFor="cs-name" error={err('name')} required className="sm:col-span-2">
          <Input id="cs-name" placeholder={t('placeholders.siteName')} {...register('name')} />
        </Field>
        <Field label={t('sites.address')} htmlFor="cs-address" error={err('address')} required className="sm:col-span-2">
          <Textarea id="cs-address" rows={2} {...register('address')} />
        </Field>
        <Field label={t('sites.city')} htmlFor="cs-city" error={err('city')} required>
          <Input id="cs-city" placeholder={t('placeholders.city')} {...register('city')} />
        </Field>
        <Field label={t('sites.code')} htmlFor="cs-code" error={err('code')} required>
          <Input id="cs-code" placeholder={t('placeholders.siteCode')} className="uppercase" {...register('code')} />
        </Field>
        <Field label={t('sites.manager')} htmlFor="cs-manager" error={err('managerId')} hint={t('sites.managerHint')}>
          <Select id="cs-manager" placeholder={t('common.selectPlaceholder')} options={managerOptions} {...register('managerId')} />
        </Field>
        <Field label={t('sites.backupManager')} htmlFor="cs-backup" error={err('backupManagerId')}>
          <Select id="cs-backup" placeholder={t('common.selectPlaceholder')} options={managerOptions} {...register('backupManagerId')} />
        </Field>
        <Field label={t('sites.startDate')} htmlFor="cs-start" error={err('startDate')} required>
          <Input id="cs-start" type="date" {...register('startDate')} />
        </Field>
        <Field label={t('sites.endDate')} htmlFor="cs-end" error={err('endDate')} required>
          <Input id="cs-end" type="date" {...register('endDate')} />
        </Field>
        <Field label={t('sites.storeName')} htmlFor="cs-storename" error={err('storeName')} required className="sm:col-span-2">
          <Input id="cs-storename" placeholder={t('placeholders.storeName')} {...register('storeName')} />
        </Field>
      </form>
    </SidePanel>
  )
}
