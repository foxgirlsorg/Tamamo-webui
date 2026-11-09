// Controls shared by Overview and Activity: the reset-statistics dialog and the
// "statistics are off" notice that turns them on through the config draft.

import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Power, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { LockedBadge } from '@/components/fields'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { useDraft } from '@/lib/draft-context'
import { STATS_QUERY_KEY } from './stats'

/** Clears every counter, chart and recent event, after a confirmation. */
export function ResetStatsButton() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const reset = useMutation({
    mutationFn: () => api.resetStats(),
    onSuccess: () => {
      toast.success(t('activity.resetDone'))
      setOpen(false)
      void queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY })
    },
    onError: (e: unknown) => {
      // 401 is handled globally (sign-in screen).
      if ((e as { status?: number }).status === 401) return
      toast.error(t('activity.resetError'), { description: e instanceof Error ? e.message : undefined })
    },
  })

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">
          <RotateCcw aria-hidden />
          {t('activity.reset')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('activity.resetTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('activity.resetDesc')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={reset.isPending}
            onClick={(e) => {
              // Keep the dialog open until the request finishes.
              e.preventDefault()
              reset.mutate()
            }}
          >
            {t('activity.reset')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/**
 * Shown in place of statistics while they are off (the default). The button
 * sets stats.enabled in the draft and saves the config, unless other edits are
 * still unsaved: then it only changes the draft and the save bar takes over,
 * so it never saves edits the user hasn't confirmed.
 */
export function StatsOffState({ description }: { description: string }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { draft, setDraft, save, saving, locked, dirty } = useDraft()
  const [pending, setPending] = useState(false)
  const lockedBy = locked['stats.enabled']

  // The draft update lands in the next render; save only once it has, so the
  // save sends the edited config rather than the one from before the click.
  useEffect(() => {
    if (!pending || !draft.stats.enabled) return
    setPending(false)
    void save().then((ok) => {
      if (!ok) return
      toast.success(t('statsOff.enabledToast'), { description: t('statsOff.enabledDesc') })
      void queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY })
    })
  }, [pending, draft, save, queryClient, t])

  return (
    <Card>
      <CardHeader className="justify-items-center text-center">
        <img src="/assets/mascot/checking.png" alt="" width={72} height={72} className="mx-auto" />
        <CardTitle className="pt-2">{t('overview.statsOffTitle')}</CardTitle>
        <CardDescription className="max-w-prose">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3 pb-6">
        {lockedBy ? (
          <>
            <LockedBadge env={lockedBy} />
            <p className="text-center text-sm text-muted-foreground">{t('statsOff.locked')}</p>
          </>
        ) : null}
        <Button
          onClick={() => {
            const otherEdits = dirty
            setDraft((d) => {
              d.stats.enabled = true
            })
            if (otherEdits) toast.info(t('statsOff.addedToDraft'))
            else setPending(true)
          }}
          disabled={!!lockedBy || saving || pending}
        >
          <Power aria-hidden />
          {t('statsOff.enable')}
        </Button>
      </CardContent>
    </Card>
  )
}
