import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/AuthProvider'
import * as api from '@/api/mockApi'
import { useApiMutation, useSiteDirectory } from '@/hooks/queries'
import type { CreateUserInput, Role, User } from '@/types'
import { Button, Checkbox, Field, Input, Select, Sheet } from '@/components/ui'

const schema = z
  .object({
    name: z.string().trim().min(1, 'validation.required'),
    email: z.string().trim().pipe(z.email('validation.email')),
    phone: z.string().trim().min(6, 'validation.required'),
    employeeId: z.string().trim().min(1, 'validation.required'),
    designation: z.string().trim().min(1, 'validation.required'),
    role: z.enum(['admin', 'site_manager']),
    siteIds: z.array(z.string()),
  })
  .refine((v) => v.role !== 'site_manager' || v.siteIds.length > 0, { path: ['siteIds'], message: 'users.siteRequired' })

type Values = z.infer<typeof schema>

const EMPTY: Values = { name: '', email: '', phone: '', employeeId: '', designation: '', role: 'site_manager', siteIds: [] }

/** Create or edit a user. Super Admins can add Admins and Site Managers; Admins can add Site Managers only. */
export function UserSheet({ open, onOpenChange, user }: { open: boolean; onOpenChange: (o: boolean) => void; user: User | null }) {
  const { t } = useTranslation()
  const { user: me } = useAuth()
  const { data: sites } = useSiteDirectory()
  const roleOptions: { value: Role; label: string }[] = [
    ...(me?.role === 'super_admin' ? [{ value: 'admin' as const, label: t('roles.admin') }] : []),
    { value: 'site_manager' as const, label: t('roles.site_manager') },
  ]

  const { register, handleSubmit, formState, reset, watch, setValue } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  })
  const selected = watch('siteIds')
  const role = watch('role')

  React.useEffect(() => {
    if (!open) return
    reset(
      user
        ? {
            name: user.name,
            email: user.email,
            phone: user.phone,
            employeeId: user.employeeId,
            designation: user.designation,
            role: user.role === 'admin' ? 'admin' : 'site_manager',
            siteIds: user.siteIds,
          }
        : EMPTY,
    )
  }, [open, user, reset])

  const create = useApiMutation((v: CreateUserInput) => api.createUser(v), { successKey: 'users.created' })
  const update = useApiMutation((v: { id: string; patch: Partial<CreateUserInput> }) => api.updateUser(v.id, v.patch), {
    successKey: 'users.updated',
  })
  const pending = create.isPending || update.isPending

  const onSubmit = handleSubmit(async (v) => {
    const payload = { ...v, siteIds: v.role === 'site_manager' ? v.siteIds : [] }
    try {
      if (user) await update.mutateAsync({ id: user.id, patch: payload })
      else await create.mutateAsync(payload)
      onOpenChange(false)
    } catch {
      /* toast handled by mutation */
    }
  })

  const err = (k: keyof Values) => (formState.errors[k]?.message ? t(formState.errors[k]?.message ?? '') : undefined)
  const toggleSite = (id: string, on: boolean) =>
    setValue('siteIds', on ? [...selected, id] : selected.filter((s) => s !== id), { shouldValidate: true })

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={user ? t('users.edit') : t('users.add')}
      description={t('users.sheetHint')}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="user-sheet" disabled={pending}>
            {pending ? t('common.loading') : t('common.save')}
          </Button>
        </>
      }
    >
      <form id="user-sheet" onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label={t('users.fields.name')} htmlFor="us-name" error={err('name')} required className="sm:col-span-2">
          <Input id="us-name" {...register('name')} />
        </Field>
        <Field label={t('users.fields.email')} htmlFor="us-email" error={err('email')} required>
          <Input id="us-email" type="email" {...register('email')} />
        </Field>
        <Field label={t('users.fields.phone')} htmlFor="us-phone" error={err('phone')} required>
          <Input id="us-phone" {...register('phone')} />
        </Field>
        <Field label={t('users.fields.employeeId')} htmlFor="us-emp" error={err('employeeId')} required>
          <Input id="us-emp" {...register('employeeId')} />
        </Field>
        <Field label={t('users.fields.designation')} htmlFor="us-desig" error={err('designation')} required>
          <Input id="us-desig" {...register('designation')} />
        </Field>
        <Field label={t('users.fields.role')} htmlFor="us-role" error={err('role')} required>
          <Select id="us-role" options={roleOptions} disabled={!!user} {...register('role')} />
        </Field>
        {role === 'site_manager' && (
          <fieldset className="sm:col-span-2 space-y-2" aria-describedby={err('siteIds') ? 'us-sites-err' : undefined}>
            <legend className="mb-1 text-sm font-medium">{t('users.fields.sites')}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(sites ?? []).map((s) => (
                <label key={s.id} className="flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm">
                  <Checkbox checked={selected.includes(s.id)} onCheckedChange={(v) => toggleSite(s.id, v === true)} />
                  {s.name}
                </label>
              ))}
            </div>
            {err('siteIds') && (
              <p id="us-sites-err" className="text-xs text-danger">
                {err('siteIds')}
              </p>
            )}
          </fieldset>
        )}
      </form>
    </Sheet>
  )
}
