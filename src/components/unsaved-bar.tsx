import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useDraft } from '@/lib/draft-context'

/**
 * Sticky bar at the bottom of the screen while the draft has unsaved changes.
 * Save writes the whole config; Discard asks first, then restores the saved one.
 */
export function UnsavedBar() {
  const { t } = useTranslation()
  const { dirty, saving, save, discard } = useDraft()
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  if (!dirty) return null

  return (
    <>
      <div
        role="region"
        aria-label={t('savebar.region')}
        className="sticky bottom-0 z-20 flex flex-wrap items-center gap-3 border-t bg-card/95 px-4 py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80"
      >
        <span aria-hidden className="size-2 rounded-full bg-primary" />
        <span className="text-sm font-medium">{t('savebar.unsaved')}</span>
        <span className="hidden text-sm text-muted-foreground sm:inline">{t('savebar.hint')}</span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" onClick={() => setConfirmDiscard(true)} disabled={saving}>
            {t('savebar.discard')}
          </Button>
          <Button onClick={() => void save()} disabled={saving}>
            {t('savebar.save')}
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('savebar.discardTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('savebar.discardDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                discard()
                setConfirmDiscard(false)
              }}
            >
              {t('savebar.discard')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
