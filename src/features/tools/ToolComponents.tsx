import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { LogIn, LogOut, TriangleAlert, Wrench } from 'lucide-react'
import { businessConfig, catalog } from '@/config'
import { getIcon } from '@/config/icons'
import { TINT_CLASSES } from '@/config/tones'
import { useAuth } from '@/features/auth/AuthProvider'
import { useApiMutation } from '@/hooks/queries'
import * as api from '@/api/mockApi'
import { cn } from '@/lib/utils'
import { Button, Dialog, DialogContent, Field, Input, Select, Sheet, Table, TableWrap, TBody, TD, Textarea, TH, THead, TR } from '@/components/ui'
import { ConditionBadge, Pagination, SortHeader, ToolStatusBadge, useTableState } from '@/components/common'
import type { ToolCategory, ToolRow } from '@/types'
import { isoDaysFromNow } from '@/utils/date'
import { formatDate, formatINR } from '@/utils/format'



export function ToolIcon({ category, className }: { category: ToolCategory; className?: string }) {
  const Icon = getIcon(catalog.tools.categories[category].icon)
  return (
    <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', TINT_CLASSES.slate, className)} aria-hidden>
      <Icon className="size-[18px]" />
    </span>
  )
}

type SortKey = 'code' | 'name' | 'site' | 'status' | 'maintenance' | 'return'

export function ToolsTable({ rows, onOpen, hideSite }: { rows: ToolRow[]; onOpen: (t: ToolRow) => void; hideSite?: boolean }) {
  const { t } = useTranslation()
  const table = useTableState<ToolRow, SortKey>(
    rows,
    {
      code: (r) => r.code,
      name: (r) => r.name,
      site: (r) => r.siteName,
      status: (r) => (r.overdue ? 'a' : r.status),
      maintenance: (r) => r.maintenanceDue,
      return: (r) => r.expectedReturnDate,
    },
    { key: 'code', dir: 'asc' },
    12,
  )
  const sh = { sort: table.sort, onSort: table.toggleSort }
  const c = (k: string) => t(`tools.cols.${k}`)
  return (
    <>
      <TableWrap className="hidden md:block">
        <Table>
          <THead>
            <tr>
              <SortHeader label={c('toolId')} sortKey="code" {...sh} />
              <SortHeader label={c('name')} sortKey="name" {...sh} />
              <TH className="hidden 2xl:table-cell">{c('category')}</TH>
              <TH>{c('condition')}</TH>
              {!hideSite && <SortHeader label={c('site')} sortKey="site" {...sh} />}
              <TH>{c('assignedTo')}</TH>
              <TH className="hidden 2xl:table-cell">{c('issuedDate')}</TH>
              <SortHeader label={c('returnDate')} sortKey="return" {...sh} />
              <SortHeader label={c('maintenanceDue')} sortKey="maintenance" {...sh} className="hidden lg:table-cell" />
              <SortHeader label={c('status')} sortKey="status" {...sh} />
            </tr>
          </THead>
          <TBody>
            {table.pageRows.map((r) => (
              <TR key={r.id} className="cursor-pointer" onClick={() => onOpen(r)}>
                <TD>
                  <button type="button" className="font-mono text-xs font-semibold hover:text-primary hover:underline" onClick={() => onOpen(r)}>
                    {r.code}
                  </button>
                </TD>
                <TD>
                  <div className="flex items-center gap-2.5">
                    <ToolIcon category={r.category} />
                    <div className="min-w-0">
                      <p className="max-w-56 truncate font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.brand}</p>
                    </div>
                  </div>
                </TD>
                <TD className="hidden whitespace-nowrap text-muted-foreground 2xl:table-cell">{t(`tools.categories.${r.category}`)}</TD>
                <TD>
                  <ConditionBadge condition={r.condition} />
                </TD>
                {!hideSite && <TD className="whitespace-nowrap">{r.siteName}</TD>}
                <TD className="max-w-44 truncate">{r.assignedTo ?? '—'}</TD>
                <TD className="tabular hidden whitespace-nowrap 2xl:table-cell">{formatDate(r.issuedDate)}</TD>
                <TD className={cn('tabular whitespace-nowrap', r.overdue && 'font-semibold text-danger')}>{formatDate(r.expectedReturnDate)}</TD>
                <TD className="tabular hidden whitespace-nowrap lg:table-cell">{formatDate(r.maintenanceDue)}</TD>
                <TD>
                  <ToolStatusBadge status={r.status} overdue={r.overdue} />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </TableWrap>
      <ul className="divide-y md:hidden">
        {table.pageRows.map((r) => (
          <li key={r.id}>
            <button type="button" onClick={() => onOpen(r)} className="flex w-full gap-3 px-4 py-3 text-left">
              <ToolIcon category={r.category} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{r.name}</span>
                <span className="block text-xs text-muted-foreground">
                  <span className="font-mono">{r.code}</span>
                  {!hideSite && ` · ${r.siteName}`}
                </span>
                {r.assignedTo && <span className="block truncate text-xs">{r.assignedTo}</span>}
                <span className="mt-1.5 flex flex-wrap gap-1.5">
                  <ToolStatusBadge status={r.status} overdue={r.overdue} />
                  <ConditionBadge condition={r.condition} />
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Pagination page={table.page} pages={table.pages} total={table.total} pageSize={table.pageSize} onPage={table.setPage} />
    </>
  )
}

/* ---------------- Action dialogs ---------------- */

type ToolAction = 'issue' | 'return' | 'damage' | 'service'

const issueSchema = z.object({
  issuedTo: z.string().trim().min(1, 'validation.required'),
  expectedReturnDate: z.string().min(1, 'validation.required'),
  notes: z.string(),
})
const returnSchema = z.object({ condition: z.enum(['new', 'good', 'fair', 'needs_repair', 'damaged']), notes: z.string() })
const damageSchema = z.object({ notes: z.string().trim().min(1, 'validation.required') })
const serviceSchema = z.object({
  note: z.string().trim().min(1, 'validation.required'),
  cost: z.string().refine((v) => v === '' || Number(v) >= 0, 'validation.nonNegative'),
})

function IssueForm({ tool, onDone }: { tool: ToolRow; onDone: () => void }) {
  const { t } = useTranslation()
  const { register, handleSubmit, formState } = useForm<z.infer<typeof issueSchema>>({
    resolver: zodResolver(issueSchema),
    defaultValues: { issuedTo: '', expectedReturnDate: isoDaysFromNow(businessConfig.tools.defaultIssueDays), notes: '' },
  })
  const m = useApiMutation((v: z.infer<typeof issueSchema>) => api.issueTool(tool.id, v), { successKey: 'tools.successIssue' })
  const e = (k: keyof z.infer<typeof issueSchema>) => (formState.errors[k]?.message ? t(formState.errors[k]?.message ?? '') : undefined)
  return (
    <form id="tool-action" onSubmit={handleSubmit((v) => m.mutate(v, { onSuccess: onDone }))} noValidate className="space-y-4">
      <Field label={t('tools.issuedTo')} htmlFor="ta-to" error={e('issuedTo')} required>
        <Input id="ta-to" placeholder={t('placeholders.issuedTo')} {...register('issuedTo')} />
      </Field>
      <Field label={t('tools.expectedReturn')} htmlFor="ta-ret" error={e('expectedReturnDate')} required>
        <Input id="ta-ret" type="date" min={isoDaysFromNow(0)} {...register('expectedReturnDate')} />
      </Field>
      <Field label={t('common.notes')} htmlFor="ta-notes">
        <Textarea id="ta-notes" rows={2} {...register('notes')} />
      </Field>
    </form>
  )
}

function ReturnForm({ tool, onDone }: { tool: ToolRow; onDone: () => void }) {
  const { t } = useTranslation()
  const { register, handleSubmit } = useForm<z.infer<typeof returnSchema>>({
    resolver: zodResolver(returnSchema),
    defaultValues: { condition: tool.condition, notes: '' },
  })
  const m = useApiMutation((v: z.infer<typeof returnSchema>) => api.returnTool(tool.id, v), { successKey: 'tools.successReturn' })
  return (
    <form id="tool-action" onSubmit={handleSubmit((v) => m.mutate(v, { onSuccess: onDone }))} noValidate className="space-y-4">
      <Field label={t('tools.conditionOnReturn')} htmlFor="ta-cond">
        <Select
          id="ta-cond"
          options={catalog.tools.conditions.map((c) => ({ value: c, label: t(`tools.conditions.${c}`) }))}
          {...register('condition')}
        />
      </Field>
      <Field label={t('common.notes')} htmlFor="ta-notes">
        <Textarea id="ta-notes" rows={2} {...register('notes')} />
      </Field>
    </form>
  )
}

function DamageForm({ tool, onDone }: { tool: ToolRow; onDone: () => void }) {
  const { t } = useTranslation()
  const { register, handleSubmit, formState } = useForm<z.infer<typeof damageSchema>>({ resolver: zodResolver(damageSchema), defaultValues: { notes: '' } })
  const m = useApiMutation((v: z.infer<typeof damageSchema>) => api.reportToolDamage(tool.id, v), { successKey: 'tools.successDamage' })
  return (
    <form id="tool-action" onSubmit={handleSubmit((v) => m.mutate(v, { onSuccess: onDone }))} noValidate>
      <Field label={t('tools.damageNotes')} htmlFor="ta-dmg" error={formState.errors.notes?.message ? t(formState.errors.notes.message) : undefined} required>
        <Textarea id="ta-dmg" rows={3} {...register('notes')} />
      </Field>
    </form>
  )
}

function ServiceForm({ tool, onDone }: { tool: ToolRow; onDone: () => void }) {
  const { t } = useTranslation()
  const { register, handleSubmit, formState } = useForm<z.infer<typeof serviceSchema>>({ resolver: zodResolver(serviceSchema), defaultValues: { note: '', cost: '' } })
  const m = useApiMutation((v: z.infer<typeof serviceSchema>) => api.completeMaintenance(tool.id, { note: v.note, cost: Number(v.cost) || 0 }), {
    successKey: 'tools.successService',
  })
  return (
    <form id="tool-action" onSubmit={handleSubmit((v) => m.mutate(v, { onSuccess: onDone }))} noValidate className="space-y-4">
      <Field label={t('tools.serviceNote')} htmlFor="ta-sn" error={formState.errors.note?.message ? t(formState.errors.note.message) : undefined} required>
        <Input id="ta-sn" {...register('note')} />
      </Field>
      <Field label={t('tools.serviceCost')} htmlFor="ta-sc">
        <Input id="ta-sc" type="number" inputMode="decimal" min={0} {...register('cost')} />
      </Field>
    </form>
  )
}

const ACTION_TITLE: Record<ToolAction, string> = {
  issue: 'tools.issue',
  return: 'tools.return',
  damage: 'tools.reportDamage',
  service: 'tools.completeService',
}

export function ToolDrawer({ tool, onClose }: { tool: ToolRow | null; onClose: () => void }) {
  const { t } = useTranslation()
  const { can } = useAuth()
  const [action, setAction] = React.useState<ToolAction | null>(null)
  const manage = can('manage_tools')

  return (
    <>
      <Sheet
        open={!!tool}
        onOpenChange={(o) => !o && onClose()}
        size="lg"
        title={tool ? tool.name : ''}
        description={tool ? `${tool.code} · ${tool.brand}` : undefined}
        footer={
          tool && (
            <>
              {can('report_damage') && (
                <Button variant="secondary" className="text-danger" onClick={() => setAction('damage')}>
                  <TriangleAlert /> {t('tools.reportDamage')}
                </Button>
              )}
              {manage && tool.status === 'maintenance' && (
                <Button variant="secondary" onClick={() => setAction('service')}>
                  <Wrench /> {t('tools.completeService')}
                </Button>
              )}
              {manage && tool.status === 'available' && (
                <Button onClick={() => setAction('issue')}>
                  <LogOut /> {t('tools.issue')}
                </Button>
              )}
              {manage && tool.status === 'issued' && (
                <Button onClick={() => setAction('return')}>
                  <LogIn /> {t('tools.return')}
                </Button>
              )}
            </>
          )
        }
      >
        {tool && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <ToolIcon category={tool.category} className="size-14 rounded-xl [&_svg]:size-7" />
              <div className="flex flex-wrap gap-1.5">
                <ToolStatusBadge status={tool.status} overdue={tool.overdue} />
                <ConditionBadge condition={tool.condition} />
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                [t('tools.cols.category'), t(`tools.categories.${tool.category}`)],
                [t('tools.brand'), tool.brand],
                [t('tools.cols.site'), tool.siteName],
                [t('tools.purchaseCost'), formatINR(tool.purchaseCost)],
                [t('tools.cols.maintenanceDue'), formatDate(tool.maintenanceDue)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-muted/70 p-3">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="mt-0.5 font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            {tool.status === 'issued' && (
              <section className={cn('rounded-lg border p-4', tool.overdue ? 'border-danger/30 bg-danger-soft/50' : 'bg-info-soft/40')}>
                <h3 className="text-sm font-semibold">{t('tools.currentIssue')}</h3>
                <p className="mt-1 text-sm">{tool.assignedTo}</p>
                <p className="tabular text-xs text-muted-foreground">
                  {formatDate(tool.issuedDate)} → {formatDate(tool.expectedReturnDate)}
                </p>
                {tool.overdue && <p className="mt-1 text-xs font-semibold text-danger">{t('tools.overdue')}</p>}
              </section>
            )}
            <section>
              <h3 className="mb-2 text-sm font-semibold">{t('tools.maintenanceHistory')}</h3>
              <ol className="space-y-3 border-l-2 pl-4">
                {tool.maintenanceHistory.map((mh) => (
                  <li key={mh.id} className="relative text-sm">
                    <span className="absolute -left-[23px] top-1 size-3 rounded-full border-2 border-surface bg-primary" aria-hidden />
                    <p className="font-medium">{mh.note}</p>
                    <p className="tabular text-xs text-muted-foreground">
                      {formatDate(mh.date)} {mh.cost > 0 && `· ${formatINR(mh.cost)}`}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        )}
      </Sheet>
      <Dialog open={!!action && !!tool} onOpenChange={(o) => !o && setAction(null)}>
        {action && tool && (
          <DialogContent
            title={`${t(ACTION_TITLE[action])} · ${tool.code}`}
            description={tool.name}
            footer={
              <>
                <Button variant="secondary" onClick={() => setAction(null)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" form="tool-action" variant={action === 'damage' ? 'destructive' : 'default'}>
                  {t('common.confirm')}
                </Button>
              </>
            }
          >
            {action === 'issue' && <IssueForm tool={tool} onDone={() => setAction(null)} />}
            {action === 'return' && <ReturnForm tool={tool} onDone={() => setAction(null)} />}
            {action === 'damage' && <DamageForm tool={tool} onDone={() => setAction(null)} />}
            {action === 'service' && <ServiceForm tool={tool} onDone={() => setAction(null)} />}
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}
