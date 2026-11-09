import * as React from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import * as api from '@/api/mockApi'
import { catalog } from '@/config'
import { queryKeys, useApiMutation, useSites } from '@/hooks/queries'
import type { CreateToolsInput, ToolCategory } from '@/types'
import { Button, Field, Input, Select } from '@/components/ui'
import { SidePanel } from '@/components/common'

const CATEGORIES = Object.keys(catalog.tools.categories) as ToolCategory[]

const row = z.object({
  name: z.string().trim().min(1, 'validation.required'),
  code: z.string().trim().min(1, 'validation.required'),
  brand: z.string().trim().min(1, 'validation.required'),
  category: z.enum(CATEGORIES as [ToolCategory, ...ToolCategory[]]),
  purchaseCost: z.string().refine((v) => v.trim() !== '' && Number(v) >= 0, 'validation.nonNegative'),
})

const schema = z.object({
  siteId: z.string().min(1, 'validation.required'),
  tools: z.array(row).min(1),
})

type Values = z.infer<typeof schema>

const EMPTY_ROW = { name: '', code: '', brand: '', category: CATEGORIES[0], purchaseCost: '' } as Values['tools'][number]

/** Adds one or more tools to a single site. Submitted together, so a site manager's batch needs one approval. */
export function AddToolsSheet({ open, onOpenChange, siteId }: { open: boolean; onOpenChange: (o: boolean) => void; siteId?: string }) {
  const { t } = useTranslation()
  const { data: sites } = useSites()
  const { register, control, handleSubmit, reset, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { siteId: siteId ?? '', tools: [EMPTY_ROW] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'tools' })

  React.useEffect(() => {
    if (!open) return
    reset({ siteId: siteId ?? sites?.[0]?.id ?? '', tools: [EMPTY_ROW] })
  }, [open, siteId, sites, reset])

  const create = useApiMutation((v: CreateToolsInput) => api.createTools(v), {
    successKey: 'tools.added',
    invalidate: [queryKeys.tools],
  })

  const onSubmit = handleSubmit(async (v) => {
    const payload: CreateToolsInput = {
      siteId: v.siteId,
      tools: v.tools.map((r) => ({ ...r, purchaseCost: Number(r.purchaseCost) })),
    }
    try {
      await create.mutateAsync(payload)
      onOpenChange(false)
    } catch {
      /* toast handled by mutation */
    }
  })

  const err = (msg?: string) => (msg ? t(msg) : undefined)

  return (
    <SidePanel
      open={open}
      onClose={() => onOpenChange(false)}
      width="lg"
      title={t('tools.add', { defaultValue: 'Add tools' })}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="add-tools-form" disabled={create.isPending}>
            {create.isPending ? t('common.loading') : t('tools.submitAdd', { defaultValue: 'Submit' })}
          </Button>
        </>
      }
    >
      <form id="add-tools-form" onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label={t('tools.fieldSite', { defaultValue: 'Site' })} htmlFor="at-site" error={err(formState.errors.siteId?.message)} required>
          <Select
            id="at-site"
            placeholder={t('common.selectPlaceholder')}
            options={(sites ?? []).map((s) => ({ value: s.id, label: s.name }))}
            {...register('siteId')}
          />
        </Field>

        {fields.map((f, i) => (
          <fieldset key={f.id} className="space-y-3 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <legend className="text-sm font-medium">{`#${i + 1}`}</legend>
              {fields.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)} aria-label={t('tools.removeRow', { defaultValue: 'Remove' })}>
                  <Trash2 /> {t('tools.removeRow', { defaultValue: 'Remove' })}
                </Button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('tools.fieldName', { defaultValue: 'Tool name' })} htmlFor={`at-name-${i}`} error={err(formState.errors.tools?.[i]?.name?.message)} required>
                <Input id={`at-name-${i}`} {...register(`tools.${i}.name`)} />
              </Field>
              <Field label={t('tools.fieldCode', { defaultValue: 'Tool code' })} htmlFor={`at-code-${i}`} error={err(formState.errors.tools?.[i]?.code?.message)} required>
                <Input id={`at-code-${i}`} {...register(`tools.${i}.code`)} />
              </Field>
              <Field label={t('tools.fieldBrand', { defaultValue: 'Brand' })} htmlFor={`at-brand-${i}`} error={err(formState.errors.tools?.[i]?.brand?.message)} required>
                <Input id={`at-brand-${i}`} {...register(`tools.${i}.brand`)} />
              </Field>
              <Field label={t('tools.cols.category', { defaultValue: 'Category' })} htmlFor={`at-cat-${i}`} required>
                <Select
                  id={`at-cat-${i}`}
                  options={CATEGORIES.map((c) => ({ value: c, label: t(`tools.categories.${c}`, { defaultValue: c }) }))}
                  {...register(`tools.${i}.category`)}
                />
              </Field>
              <Field
                label={t('tools.fieldCost', { defaultValue: 'Purchase cost (₹)' })}
                htmlFor={`at-cost-${i}`}
                error={err(formState.errors.tools?.[i]?.purchaseCost?.message)}
                required
                className="sm:col-span-2"
              >
                <Input id={`at-cost-${i}`} type="number" min={0} {...register(`tools.${i}.purchaseCost`)} />
              </Field>
            </div>
          </fieldset>
        ))}

        <Button type="button" variant="secondary" onClick={() => append(EMPTY_ROW)}>
          <Plus /> {t('tools.addRow', { defaultValue: 'Add another tool' })}
        </Button>
      </form>
    </SidePanel>
  )
}
