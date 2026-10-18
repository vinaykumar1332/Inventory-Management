import * as React from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, m } from 'motion/react'
import {
  Building2,
  Camera,
  Check,
  CircleCheck,
  CloudUpload,
  FileSpreadsheet,
  Loader2,
  MapPin,
  RefreshCw,
  TriangleAlert,
  Trash2,
} from 'lucide-react'
import { appConfig, businessConfig, catalog } from '@/config'
import { getIcon } from '@/config/icons'
import { TINT_CLASSES } from '@/config/tones'
import { cn } from '@/lib/utils'
import { Badge, Button, Progress } from '@/components/ui'
import type { SiteSummary, UploadType } from '@/types'
import { formatFileSize, formatINRCompact } from '@/utils/format'

// Accepted types, size limit and badges come from src/config/business.json
export const MAX_FILE_MB = businessConfig.upload.maxFileMb
export const ACCEPT = businessConfig.upload.acceptedTypes

export function uploadTypeOf(file: File): UploadType | null {
  const name = file.name.toLowerCase()
  if (/\.(xlsx|xls)$/.test(name)) return 'excel'
  if (name.endsWith('.pdf')) return 'pdf'
  if (/\.(jpe?g|png)$/.test(name) || file.type.startsWith('image/')) return 'image'
  return null
}

/* ---------------- Stepper ---------------- */

export const STEP_KEYS = ['site', 'upload', 'processing', 'review', 'confirm'] as const

export function Stepper({ step }: { step: number }) {
  const { t } = useTranslation()
  return (
    <nav aria-label={t('upload.title')} className="mb-5">
      <p className="mb-2 text-sm font-medium text-muted-foreground md:hidden">
        {t('upload.stepOf', { step, total: 5 })} · <span className="text-foreground">{t(`upload.steps.${STEP_KEYS[step - 1]}`)}</span>
      </p>
      <Progress value={(step / 5) * 100} className="md:hidden" label={t('upload.stepOf', { step, total: 5 })} />
      <ol className="hidden items-center md:flex">
        {STEP_KEYS.map((key, i) => {
          const n = i + 1
          const done = n < step
          const current = n === step
          return (
            <li key={key} className="flex flex-1 items-center last:flex-none" aria-current={current ? 'step' : undefined}>
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                    done && 'border-primary bg-primary text-primary-foreground',
                    current && 'border-primary bg-primary-soft text-primary',
                    !done && !current && 'border-border bg-surface text-muted-foreground',
                  )}
                >
                  {done ? <Check className="size-4" aria-hidden /> : n}
                </span>
                <span className={cn('whitespace-nowrap text-sm font-medium', current ? 'text-foreground' : 'text-muted-foreground')}>
                  {t(`upload.steps.${key}`)}
                </span>
              </span>
              {n < 5 && <span className={cn('mx-3 h-0.5 flex-1 rounded', done ? 'bg-primary' : 'bg-border')} aria-hidden />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/* ---------------- Step 1: site ---------------- */

export function SiteStep({ sites, value, onChange }: { sites: SiteSummary[]; value: string; onChange: (id: string) => void }) {
  const { t } = useTranslation()
  return (
    <fieldset>
      <legend className="text-lg font-semibold">{t('upload.chooseSite')}</legend>
      <p className="mt-1 text-sm text-muted-foreground">{t('upload.chooseSiteHint')}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {sites.map((s) => {
          const selected = value === s.id
          return (
            <label
              key={s.id}
              className={cn(
                'relative flex cursor-pointer gap-3 rounded-lg border-2 bg-surface p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring',
                selected ? 'border-primary bg-primary-soft/40' : 'border-border hover:border-primary/40',
              )}
            >
              <input type="radio" name="site" value={s.id} checked={selected} onChange={() => onChange(s.id)} className="sr-only" />
              <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                <Building2 className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{s.name}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" aria-hidden /> {s.city}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">{s.storeName}</span>
                <span className="tabular mt-1 block text-xs">{formatINRCompact(s.stockValue)}</span>
              </span>
              {selected && <CircleCheck className="absolute right-3 top-3 size-5 text-primary" aria-hidden />}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/* ---------------- Step 2: file ---------------- */

const fileIcon = (type: UploadType) => ({ icon: getIcon(catalog.uploadTypes[type].icon), cls: TINT_CLASSES[catalog.uploadTypes[type].tint] })

export function FileStep({
  file,
  onFile,
  onRemove,
  duplicateOf,
  progress,
  onDownloadSample,
}: {
  file: File | null
  onFile: (f: File) => void
  onRemove: () => void
  duplicateOf: string | null
  progress: number | null
  onDownloadSample: () => void
}) {
  const { t } = useTranslation()
  const [error, setError] = React.useState<string | null>(null)
  const cameraRef = React.useRef<HTMLInputElement>(null)
  const [preview, setPreview] = React.useState<string | null>(null)

  // Object URL for image thumbnails — revoked on change/unmount
  React.useEffect(() => {
    if (!file || uploadTypeOf(file) !== 'image') {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const onDrop = React.useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      setError(null)
      if (rejected.length) {
        const code = rejected[0].errors[0]?.code
        setError(code === 'file-too-large' ? t('upload.tooLarge', { size: MAX_FILE_MB }) : t('upload.invalidType'))
        return
      }
      if (accepted[0]) onFile(accepted[0])
    },
    [onFile, t],
  )

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxSize: MAX_FILE_MB * 1024 * 1024,
    multiple: false,
    noClick: !!file,
    noKeyboard: !!file,
  })

  const onCamera = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (f.size > MAX_FILE_MB * 1024 * 1024) setError(t('upload.tooLarge', { size: MAX_FILE_MB }))
    else {
      setError(null)
      onFile(f)
    }
  }

  const type = file ? uploadTypeOf(file) : null
  const uploading = progress !== null

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          {...getRootProps()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors focus-visible:outline-2 focus-visible:outline-ring md:py-14',
            isDragActive ? 'border-primary bg-primary-soft' : 'border-input bg-surface hover:border-primary/50 hover:bg-primary-soft/30',
          )}
        >
          <input {...getInputProps()} aria-label={t('upload.browse')} />
          <span className="flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary">
            <CloudUpload className="size-7" aria-hidden />
          </span>
          <p className="mt-4 text-base font-semibold">{isDragActive ? t('upload.dropActive') : t('upload.dropTitle')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('upload.dropOr')}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                open()
              }}
            >
              {t('upload.browse')}
            </Button>
            {appConfig.features.cameraUpload && (
            <Button
              type="button"
              variant="secondary"
              className="md:hidden"
              onClick={(e) => {
                e.stopPropagation()
                cameraRef.current?.click()
              }}
            >
              <Camera /> {t('upload.takePhoto')}
            </Button>
            )}
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-1.5">
            {businessConfig.upload.badges.map((ext) => (
              <Badge key={ext}>{ext}</Badge>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t('upload.maxSize', { size: MAX_FILE_MB })}</p>
        </div>
      ) : (
        <div {...getRootProps()} className={cn('rounded-xl border bg-surface p-4', isDragActive && 'border-primary bg-primary-soft')}>
          <input {...getInputProps()} aria-label={t('upload.replace')} />
          <div className="flex items-start gap-4">
            {preview ? (
              <img src={preview} alt="" className="size-20 shrink-0 rounded-lg border object-cover md:size-24" />
            ) : type ? (
              <span className={cn('flex size-20 shrink-0 items-center justify-center rounded-lg md:size-24', fileIcon(type).cls)}>
                {React.createElement(fileIcon(type).icon, { className: 'size-9', 'aria-hidden': true })}
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{file.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {type && <Badge tone="primary">{t(`bills.uploadType.${type}`)}</Badge>}
                <span className="tabular">{formatFileSize(file.size / 1024)}</span>
              </div>
              {uploading ? (
                <div className="mt-3" aria-live="polite">
                  <Progress value={progress} label={t('upload.uploading', { progress })} />
                  <p className="tabular mt-1 text-xs text-muted-foreground">{t('upload.uploading', { progress })}</p>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={open}>
                    <RefreshCw /> {t('upload.replace')}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="text-danger" onClick={onRemove}>
                    <Trash2 /> {t('upload.removeFile')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onCamera} tabIndex={-1} aria-hidden />

      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-md bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          <TriangleAlert className="size-4 shrink-0" aria-hidden /> {error}
        </p>
      )}
      {duplicateOf && (
        <p role="status" className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning-soft px-3 py-2 text-sm text-warning">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {t('upload.duplicateFile', { invoiceNo: duplicateOf })}
        </p>
      )}

      {!file && appConfig.features.sampleBillDownload && (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">{t('upload.sampleTitle')}</p>
            <p className="text-sm text-muted-foreground">{t('upload.sampleHint')}</p>
          </div>
          <Button type="button" variant="secondary" onClick={onDownloadSample}>
            <FileSpreadsheet /> {t('upload.sampleDownload')}
          </Button>
        </div>
      )}
    </div>
  )
}

/* ---------------- Step 3: processing ---------------- */

const PHASES = ['reading', 'vendor', 'lines', 'matching', 'ready'] as const

export function ProcessingStep({ phase }: { phase: number }) {
  const { t } = useTranslation()
  const steps = PHASES.slice(0, 4)
  const pct = Math.round((Math.min(phase, 4) / 4) * 100)
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center px-4 py-8 text-center md:py-12" aria-live="polite" aria-busy={phase < 4}>
      <div className="relative flex size-20 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-primary-soft" />
        {phase < 4 ? (
          <Loader2 className="relative size-9 animate-spin text-primary motion-reduce:animate-none" aria-hidden />
        ) : (
          <m.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative">
            <CircleCheck className="size-10 text-primary" aria-hidden />
          </m.span>
        )}
      </div>
      <div className="mt-5 flex min-h-7 w-full items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          <m.p
            key={phase}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="text-lg font-semibold"
          >
            {t(`upload.processing.${PHASES[Math.min(phase, 4)]}`)}
          </m.p>
        </AnimatePresence>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{t('upload.processingHint')}</p>
      <Progress value={pct} className="mt-5 h-1.5" label={t('upload.steps.processing')} />

      {/* Checklist: full-width panel centred under the heading */}
      <ol className="mt-5 w-full divide-y rounded-lg border bg-muted/40 text-left">
        {steps.map((p, i) => {
          const done = i < phase
          const current = i === phase
          return (
            <li key={p} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors',
                  done ? 'border-primary bg-primary text-primary-foreground' : current ? 'border-primary text-primary' : 'border-border text-muted-foreground',
                )}
              >
                {done ? (
                  <Check className="size-3.5" aria-hidden />
                ) : current ? (
                  <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
                ) : (
                  <span className="size-1.5 rounded-full bg-current" />
                )}
              </span>
              <span className={cn('min-w-0 flex-1', done || current ? 'font-medium text-foreground' : 'text-muted-foreground')}>{t(`upload.processing.${p}`)}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
