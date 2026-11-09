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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ConfirmTypeNameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  /** The exact text the user must type, e.g. a site's name. */
  name: string
  /** Label of the destructive button. */
  confirmLabel: string
  onConfirm: () => void | Promise<void>
  pending?: boolean
}

/**
 * Destructive confirmation: the user types the exact name before the button
 * works. Used for deleting sites and similar.
 */
export function ConfirmTypeNameDialog({
  open,
  onOpenChange,
  title,
  description,
  name,
  confirmLabel,
  onConfirm,
  pending = false,
}: ConfirmTypeNameDialogProps) {
  const { t } = useTranslation()
  const [typed, setTyped] = useState('')
  const inputId = 'confirm-type-name'

  const matches = typed === name

  const handleOpenChange = (next: boolean) => {
    if (!next) setTyped('')
    onOpenChange(next)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor={inputId} className="text-sm">
            {t('common.typeToConfirm', { word: `“${name}”` })}
          </Label>
          <Input
            id={inputId}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={!matches || pending}
            onClick={(e) => {
              // Keep the dialog open until the action has finished.
              e.preventDefault()
              void Promise.resolve(onConfirm()).then(() => handleOpenChange(false))
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
