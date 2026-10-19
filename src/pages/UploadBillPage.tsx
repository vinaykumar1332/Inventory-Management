import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Ban, Loader2, Save } from 'lucide-react'
import { useAuth, useUser } from '@/features/auth/AuthProvider'
import { errorMessage, useApiMutation, useBill, useSites } from '@/hooks/queries'
import * as api from '@/api/mockApi'
import { cacheFile } from '@/features/bills/fileCache'
import { Button, Card, CardContent, ConfirmDialog, Field, Input, Skeleton } from '@/components/ui'
import { PageHeader } from '@/components/common'
import { FileStep, ProcessingStep, SiteStep, Stepper, uploadTypeOf } from '@/features/bills/upload/Steps'
import { InvoiceFields, LineItemsCard } from '@/features/bills/upload/ReviewStep'
import { ConfirmStep, SuccessState } from '@/features/bills/upload/ConfirmStep'
import { useGuardedAction } from '@/hooks/useGuardedAction'
import { invoiceToValues, reviewSchema, valuesToDraft, type ReviewValues } from '@/features/bills/upload/reviewForm'
import { businessConfig } from '@/config'
import type { ApproveBillResult, BillDraftInput, Invoice } from '@/types'

const PHASE_MS = businessConfig.upload.extractionStepMs

export default function UploadBillPage() {
  const { t } = useTranslation()
  const user = useUser()
  const { can } = useAuth()
  const [params, setParams] = useSearchParams()
  const resumeId = params.get('invoice')
  const { data: sites, isLoading: sitesLoading } = useSites()
  const { data: resumeBill } = useBill(resumeId)

  const [step, setStep] = React.useState(1)
  const [siteId, setSiteId] = React.useState('')
  const [file, setFile] = React.useState<File | null>(null)
  const [progress, setProgress] = React.useState<number | null>(null)
  const [phase, setPhase] = React.useState(0)
  const [invoice, setInvoice] = React.useState<Invoice | null>(null)
  const [draft, setDraft] = React.useState<BillDraftInput | null>(null)
  const [result, setResult] = React.useState<ApproveBillResult | null>(null)
  const [rejectOpen, setRejectOpen] = React.useState(false)
  const [rejectReason, setRejectReason] = React.useState('')
  const topRef = React.useRef<HTMLDivElement>(null)

  const form = useForm<ReviewValues>({ resolver: zodResolver(reviewSchema), mode: 'onTouched' })

  // Default site: the only accessible site, or the user's first assigned site
  React.useEffect(() => {
    if (!siteId && sites?.length) setSiteId(user.siteIds[0] ?? sites[0].id)
  }, [sites, siteId, user.siteIds])

  React.useEffect(() => {
    topRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [step])

  const goReview = React.useCallback(
    (inv: Invoice) => {
      setInvoice(inv)
      setSiteId(inv.siteId)
      form.reset(invoiceToValues(inv))
      setStep(4)
    },
    [form],
  )

  /** Simulated extraction: staged messages (~1.9s) running alongside the API call. */
  const runExtraction = React.useCallback(
    async (inv: Invoice, f?: File) => {
      setStep(3)
      setPhase(0)
      const timer = window.setInterval(() => setPhase((p) => Math.min(p + 1, 3)), PHASE_MS)
      try {
        const [extracted] = await Promise.all([
          api.extractBill(inv.id, f),
          new Promise((r) => setTimeout(r, PHASE_MS * 4 + 200)),
        ])
        window.clearInterval(timer)
        setPhase(4)
        await new Promise((r) => setTimeout(r, 550))
        goReview(extracted)
      } catch (e) {
        window.clearInterval(timer)
        toast.error(errorMessage(e))
        setStep(2)
      }
    },
    [goReview],
  )

  // Resume an existing bill from the Bills page ("Continue review")
  const resumed = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!resumeBill || resumed.current === resumeBill.id) return
    resumed.current = resumeBill.id
    if (resumeBill.status === 'processing' || resumeBill.lineItems.length === 0) void runExtraction(resumeBill)
    else goReview(resumeBill)
  }, [resumeBill, goReview, runExtraction])

  const duplicateOf = file ? api.findDuplicateInvoice(file.name) : null

  const startUpload = async () => {
    if (!file) return
    const type = uploadTypeOf(file)
    if (!type) return
    setProgress(0)
    const tick = window.setInterval(() => setProgress((p) => (p === null ? p : Math.min(95, p + 9 + Math.round(Math.random() * 8)))), 90)
    try {
      const inv = await api.uploadBill({ siteId, fileName: file.name, fileSizeKb: Math.round(file.size / 1024), uploadType: type })
      window.clearInterval(tick)
      setProgress(100)
      cacheFile(inv.id, file)
      await new Promise((r) => setTimeout(r, 250))
      setProgress(null)
      void runExtraction(inv, file)
    } catch (e) {
      window.clearInterval(tick)
      setProgress(null)
      toast.error(errorMessage(e))
    }
  }

  const upload = useGuardedAction(startUpload)
  const saveDraft = useApiMutation((v: BillDraftInput) => api.saveBillDraft(invoice?.id ?? '', v), { successKey: 'upload.draftSaved' })
  const approve = useApiMutation((v: BillDraftInput) => api.approveBill(invoice?.id ?? '', v))
  const reject = useApiMutation((reason: string) => api.rejectBill(invoice?.id ?? '', reason), { successKey: 'upload.rejected' })

  const onSaveDraft = () => saveDraft.mutate(valuesToDraft(form.getValues()))

  const onContinue = form.handleSubmit(
    (v) => {
      setDraft(valuesToDraft(v))
      setStep(5)
    },
    () => toast.error(t('upload.fixErrors')),
  )

  const onApprove = async () => {
    if (!draft) return
    try {
      const res = await approve.mutateAsync(draft)
      setResult(res)
    } catch {
      /* toast shown by mutation */
    }
  }

  const restart = () => {
    setParams({}, { replace: true })
    resumed.current = null
    setStep(1)
    setFile(null)
    setInvoice(null)
    setDraft(null)
    setResult(null)
  }

  const siteName = sites?.find((s) => s.id === (draft?.header.siteId ?? siteId))?.name ?? ''

  if (result) {
    return (
      <>
        <PageHeader title={t('upload.title')} subtitle={t('upload.subtitle')} />
        <SuccessState result={result} siteName={siteName} onAnother={restart} />
      </>
    )
  }

  return (
    <div ref={topRef} className="scroll-mt-20">
      <PageHeader title={resumeId ? t('upload.resumeTitle') : t('upload.title')} subtitle={t('upload.subtitle')} />
      <Stepper step={step} />

      {step === 1 && (
        <Card>
          <CardContent className="p-4 md:p-6">
            {sitesLoading || !sites ? (
              <div className="grid gap-3 md:grid-cols-3">
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} className="h-28" />
                ))}
              </div>
            ) : (
              <SiteStep sites={sites} value={siteId} onChange={setSiteId} />
            )}
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <FileStep
          file={file}
          onFile={setFile}
          onRemove={() => setFile(null)}
          duplicateOf={duplicateOf}
          progress={progress}
          onDownloadSample={() => void import('@/utils/excel').then((x) => x.downloadSampleBill())}
        />
      )}

      {step === 3 && (
        <Card>
          <ProcessingStep phase={phase} />
        </Card>
      )}

      {step === 4 && (
        <form onSubmit={onContinue} noValidate className="space-y-5">
          <InvoiceFields form={form} invoiceId={invoice?.id ?? null} />
          <LineItemsCard form={form} invoiceId={invoice?.id ?? null} />
        </form>
      )}

      {step === 5 && draft && <ConfirmStep draft={draft} siteName={siteName} />}

      {upload.dialog}

      {/* Sticky action bar (thumb-reachable on phones) */}
      {step !== 3 && (
        <div className="pb-safe sticky bottom-16 z-20 -mx-4 mt-5 flex items-center gap-2 border-t bg-surface/95 px-4 py-3 backdrop-blur md:bottom-0 md:mx-0 md:rounded-lg md:border md:shadow-card">
          {step > 1 && step !== 4 && (
            <Button variant="ghost" onClick={() => setStep(step === 5 ? 4 : step - 1)} disabled={progress !== null || approve.isPending}>
              <ArrowLeft /> {t('common.back')}
            </Button>
          )}
          {step === 4 && can('approve_bills') && (
            <Button variant="ghost" className="shrink-0 px-3 text-danger" onClick={() => setRejectOpen(true)} aria-label={t('upload.reject')}>
              <Ban /> <span className="hidden sm:inline">{t('upload.reject')}</span>
            </Button>
          )}
          <div className="ml-auto flex min-w-0 flex-1 justify-end gap-2 sm:flex-none">
            {step === 1 && (
              <Button className="flex-1 sm:flex-none" disabled={!siteId} onClick={() => setStep(2)}>
                {t('common.continue')} <ArrowRight />
              </Button>
            )}
            {step === 2 && (
              <Button className="flex-1 sm:flex-none" disabled={!file || progress !== null || upload.pending} onClick={() => upload.run()}>
                {progress !== null && <Loader2 className="animate-spin" />}
                {t('upload.uploadAndExtract')} <ArrowRight />
              </Button>
            )}
            {step === 4 && (
              <>
                <Button variant="secondary" className="shrink-0" onClick={onSaveDraft} disabled={saveDraft.isPending} aria-label={t('upload.saveDraft')}>
                  <Save /> <span className="hidden sm:inline">{t('upload.saveDraft')}</span>
                </Button>
                <Button className="flex-1 sm:flex-none" onClick={() => void onContinue()}>
                  {t('upload.reviewAndContinue')} <ArrowRight />
                </Button>
              </>
            )}
            {step === 5 && (
              <Button className="flex-1 sm:flex-none" size="lg" onClick={() => void onApprove()} disabled={approve.isPending || !can('approve_bills')}>
                {approve.isPending && <Loader2 className="animate-spin" />}
                {approve.isPending ? t('upload.approving') : t('upload.approve')}
              </Button>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title={t('upload.reject')}
        description={invoice?.invoiceNo ?? ''}
        confirmLabel={t('upload.reject')}
        tone="destructive"
        loading={reject.isPending}
        onConfirm={() =>
          reject.mutate(rejectReason || '—', {
            onSuccess: () => {
              setRejectOpen(false)
              restart()
            },
          })
        }
      >
        <Field label={t('upload.rejectReason')} htmlFor="reject-reason" className="mt-4">
          <Input id="reject-reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
        </Field>
      </ConfirmDialog>
    </div>
  )
}
