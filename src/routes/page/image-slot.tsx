// One image of the checking page (checking, success, denied, background, favicon):
// preview, upload, and reset or remove. Uploads take effect right away.

import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RotateCcw, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { imageUrl } from '@/lib/api'
import type { UploadSlot } from '@/lib/types'

import { useDesigner } from './designer-store'

const MAX_BYTES = 4 * 1024 * 1024
const ACCEPT = 'image/png,image/jpeg,image/gif,image/webp'

export function ImageSlot({ slot, title }: { slot: UploadSlot; title: string }) {
  const { t } = useTranslation()
  const { uploads, imageVersion, uploadSlot, removeSlot } = useDesigner()
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const custom = !!uploads[slot]
  const isBackground = slot === 'background'

  const onFile = async (file: File) => {
    if (file.size > MAX_BYTES) {
      toast.error(t('page.slot.tooLarge'), { description: t('page.slot.tooLargeDesc') })
      return
    }
    setBusy(true)
    try {
      await uploadSlot(slot, file)
      toast.success(t('page.slot.updated', { name: title }), { description: t('page.slot.liveDesc') })
    } catch (e) {
      toast.error(t('page.slot.uploadError'), { description: e instanceof Error ? e.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  const onReset = async () => {
    setBusy(true)
    try {
      await removeSlot(slot)
      toast.success(isBackground ? t('page.slot.removed') : t('page.slot.wasReset', { name: title }))
    } catch (e) {
      toast.error(t('page.slot.resetError'), { description: e instanceof Error ? e.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-3 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{title}</span>
        {custom ? <Badge variant="outline">{t('page.slot.custom')}</Badge> : <Badge variant="secondary">{t('page.slot.default')}</Badge>}
      </div>

      <div className="flex h-28 items-center justify-center overflow-hidden rounded-md border bg-muted/40 p-2">
        {failed ? (
          <span className="text-sm text-muted-foreground">{t('page.slot.none')}</span>
        ) : (
          <img
            src={imageUrl(slot, imageVersion)}
            alt={t('page.slot.alt', { name: title })}
            loading="lazy"
            className="max-h-full max-w-full object-contain"
            onLoad={() => setFailed(false)}
            onError={() => setFailed(true)}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          aria-label={t('page.slot.uploadLabel', { name: title })}
          onClick={() => inputRef.current?.click()}
        >
          <Upload aria-hidden />
          {busy ? t('page.slot.uploading') : t('page.slot.upload')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={!custom || busy}
          title={custom ? (isBackground ? t('page.slot.removeTitle') : t('page.slot.resetTitle')) : t('page.slot.isDefault')}
          aria-label={isBackground ? t('page.slot.removeLabel', { name: title }) : t('page.slot.resetLabel', { name: title })}
          onClick={() => void onReset()}
        >
          {isBackground ? <Trash2 aria-hidden /> : <RotateCcw aria-hidden />}
          {isBackground ? t('common.remove') : t('common.reset')}
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) void onFile(file)
        }}
      />
    </div>
  )
}
