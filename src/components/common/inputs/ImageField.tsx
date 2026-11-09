import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ImagePlus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { ImageError, imageFileToDataUrl } from '@/utils/image'

/** Photo preview with add, replace and remove for users who may change it. Read-only otherwise. */
export function ImageField({
  src,
  alt,
  canEdit,
  onChange,
  compact,
  className,
}: {
  src?: string | null
  alt: string
  canEdit: boolean
  onChange: (imageUrl: string | null) => void
  compact?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  const inputRef = React.useRef<HTMLInputElement>(null)

  const pick = async (file: File | undefined) => {
    if (!file) return
    try {
      onChange(await imageFileToDataUrl(file))
    } catch (e) {
      const key = e instanceof ImageError ? e.key : 'images.notImage'
      toast.error(t(key))
    }
  }

  const box = compact ? 'size-12 rounded-md' : 'h-40 w-full rounded-lg sm:h-48'

  return (
    <div className={cn('flex items-center gap-3', compact ? '' : 'flex-col items-stretch', className)}>
      <div className={cn('flex shrink-0 items-center justify-center overflow-hidden border bg-muted', box)}>
        {src ? (
          <img src={src} alt={alt} className="size-full object-cover" />
        ) : (
          <span className="px-2 text-center text-xs text-muted-foreground">{compact ? '—' : t('images.none')}</span>
        )}
      </div>
      {canEdit && (
        <div className={cn('flex flex-wrap gap-2', compact ? '' : 'justify-end')}>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void pick(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()} aria-label={src ? t('images.replace') : t('images.upload')}>
            <ImagePlus /> {!compact && (src ? t('images.replace') : t('images.upload'))}
          </Button>
          {src && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)} aria-label={t('images.remove')}>
              <Trash2 /> {!compact && t('images.remove')}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
