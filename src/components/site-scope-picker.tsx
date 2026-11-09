import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Paintbrush, RotateCcw } from 'lucide-react'

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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GLOBAL_SCOPE, OWN_FLAG, type ScopedSection, siteDisplayName } from '@/lib/config'
import { useDraft, useScope } from '@/lib/draft-context'

/**
 * Chooses whether Protection, Rules or the checking page edits the global
 * settings or one site. A site can own its own copy of the section; otherwise
 * it follows the global one. Render it at the top of the screen, above the
 * section's fields, and bind the fields to `sectionPath(section)`.
 */
export function SiteScopePicker({ section }: { section: ScopedSection }) {
  const { t } = useTranslation()
  const { draft } = useDraft()
  const { scope, setScope, site, isOwn, customize, resetToGlobal } = useScope()
  const [confirmBack, setConfirmBack] = useState(false)
  const selectId = `scope-${section}`

  if (draft.sites.length === 0) return null

  const own = isOwn(section)
  const name = siteDisplayName(site, t('sites.unnamed'))
  const info = !site
    ? t('scope.globalInfo')
    : own
      ? t('scope.ownInfo', { hosts: site.hosts.join(', ') || t('scope.thisSite') })
      : ''

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Label htmlFor={selectId} className="text-sm">
          {t('scope.editing')}
        </Label>
        <Select value={scope} onValueChange={setScope}>
          <SelectTrigger id={selectId} className="w-auto min-w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={GLOBAL_SCOPE}>{t('scope.global')}</SelectItem>
            {draft.sites.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s[OWN_FLAG[section]]
                  ? t(`scope.optionOwn.${section}`, { name: siteDisplayName(s, t('sites.unnamed')) })
                  : t('scope.optionGlobal', { name: siteDisplayName(s, t('sites.unnamed')) })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="grow text-sm text-muted-foreground">{info}</span>
        {site && own ? (
          <Button variant="outline" size="sm" onClick={() => setConfirmBack(true)}>
            <RotateCcw aria-hidden />
            {t('scope.back')}
          </Button>
        ) : null}
      </div>

      {site && !own ? (
        <Alert>
          <AlertTitle>{t('scope.noticeTitle')}</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{t(`scope.noticeDesc.${section}`, { name })}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => {
                  customize(section)
                  toast.info(t(`scope.customized.${section}`, { name }), { description: t('common.saveToApply') })
                }}
              >
                <Paintbrush aria-hidden />
                {t('scope.customize')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setScope(GLOBAL_SCOPE)}>
                {t('scope.editGlobal')}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      <AlertDialog open={confirmBack} onOpenChange={setConfirmBack}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(`scope.backTitle.${section}`, { name })}</AlertDialogTitle>
            <AlertDialogDescription>{t(`scope.backDesc.${section}`)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                resetToGlobal(section)
                setConfirmBack(false)
              }}
            >
              {t('scope.useGlobal')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
