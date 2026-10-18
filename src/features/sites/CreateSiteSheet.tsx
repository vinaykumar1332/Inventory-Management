import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useApiMutation, useCompany, useUsers } from '@/hooks/queries'
import { createSite } from '@/services/mockApi'
import { Button, Field, Input, Select, Sheet, Textarea } from '@/components/ui'
import { isoDaysFromNow } from '@/utils/date'

const schema = z
  .object({
    companyName: z.string().trim().min(1, 'validation.required'),
    name: z.string().trim().min(1, 'validation.required'),
    address: z.string().trim().min(1, 'validation.required'),
    city: z.string().trim().min(1, 'validation.required'),
    code: z.string().trim().regex(/^[A-Za-z0-9-]{3,15}$/, 'validation.siteCode'),
    managerId: z.string().min(1, 'validation.required'),
    storekeeperId: z.string().min(1, 'validation.required'),
    startDate: z.string().min(1, 'validation.required'),
    endDate: z.string().min(1, 'validation.required'),
    storeName: z.string().trim().min(1, 'validation.required'),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate > v.startDate, { path: ['endDate'], message: 'validation.endAfterStart' })

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
      storekeeperId: '',
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
      const site = await mutation.mutateAsync(v)
      toast.success(t('sites.created', { name: site.name }))
      reset()
      onOpenChange(false)
      navigate(`/sites/${site.id}`)
    } catch {
      /* toast handled by mutation */
    }
  })

  const err = (k: keyof Values) => (formState.errors[k]?.message ? t(formState.errors[k]?.message ?? '') : undefined)
  const userOptions = (role: 'site_manager' | 'storekeeper') =>
    (users ?? []).filter((u) => u.role === role).map((u) => ({ value: u.id, label: u.name }))

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
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
        <Field label={t('sites.manager')} htmlFor="cs-manager" error={err('managerId')} required>
          <Select id="cs-manager" placeholder={t('common.selectPlaceholder')} options={userOptions('site_manager')} {...register('managerId')} />
        </Field>
        <Field label={t('sites.storekeeper')} htmlFor="cs-store-user" error={err('storekeeperId')} required>
          <Select id="cs-store-user" placeholder={t('common.selectPlaceholder')} options={userOptions('storekeeper')} {...register('storekeeperId')} />
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
    </Sheet>
  )
}
