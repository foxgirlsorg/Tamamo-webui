import { useId, useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { ConfirmTypeNameDialog } from '@/components/confirm-type-name-dialog'
import { Field } from '@/components/fields'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  customiseSection,
  GLOBAL_SCOPE,
  OWN_FLAG,
  resetSectionToGlobal,
  siteDisplayName,
  type ScopedSection,
} from '@/lib/config'
import { useDraft } from '@/lib/draft-context'
import type { Counters, Site } from '@/lib/types'

import { HostTags } from './host-tags'
import { NginxDialog } from './nginx-dialog'
import { Rich } from './rich'
import { SiteStatsGrid } from './stats'

const SECTIONS: ScopedSection[] = ['protection', 'rules', 'page']

interface SiteCardProps {
  /** Position in draft.sites. Edits address the site by position. */
  index: number
  site: Site
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Focus and select the name field (set for a site that was just added). */
  autoFocusName: boolean
  nameError?: string
  hostsError?: string
  /** Last 24 hours of this site: undefined while loading, null for no traffic. */
  counters: Counters | null | undefined
}

/** One site: a collapsible card with its name, host names, upstream, section switches and delete. */
export function SiteCard({
  index,
  site,
  open,
  onOpenChange,
  autoFocusName,
  nameError,
  hostsError,
  counters,
}: SiteCardProps) {
  const { t } = useTranslation()
  const { draft, scope, setDraft, setScope } = useDraft()
  const baseId = useId()
  const [nginxOpen, setNginxOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  // The section whose "use global" confirmation is open.
  const [offSection, setOffSection] = useState<ScopedSection | null>(null)

  const name = siteDisplayName(site, t('sites.unnamed'))
  const hostsText = site.hosts.length ? site.hosts.join(', ') : t('sites.noHosts')
  const fieldId = (key: string) => `${baseId}-${key}`

  const update = (edit: (s: Site) => void) =>
    setDraft((d) => {
      const s = d.sites[index]
      if (s) edit(s)
    })

  const setOwn = (section: ScopedSection, own: boolean) => {
    if (own) {
      // Starts from a copy of the current global settings.
      setDraft((d) => {
        const s = d.sites[index]
        if (s) customiseSection(d, s, section)
      })
    } else {
      setOffSection(section)
    }
  }

  const confirmOff = () => {
    const section = offSection
    if (section) update((s) => resetSectionToGlobal(s, section))
    setOffSection(null)
  }

  const remove = () => {
    setDraft((d) => {
      d.sites.splice(index, 1)
    })
    if (scope === site.id) setScope(GLOBAL_SCOPE)
    toast.info(t('sites.deleted', { name }), { description: t('common.saveToApply') })
  }

  // Opens a section's page with this site selected in its scope picker.
  const editLink = (section: ScopedSection) => (
    <Link
      to={`/${section}`}
      onClick={() => setScope(site.id)}
      className="font-medium text-primary underline-offset-4 hover:underline"
    >
      {t('sites.editIt')}
    </Link>
  )

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <Card data-site-id={site.id}>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <CollapsibleTrigger className="group flex min-w-0 flex-1 items-start gap-2 rounded-md text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <ChevronRight
              aria-hidden
              className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90"
            />
            <span className="min-w-0 space-y-1">
              <span className="block truncate font-semibold">{name}</span>
              <span className="block truncate font-mono text-xs text-muted-foreground">{hostsText}</span>
            </span>
          </CollapsibleTrigger>
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setNginxOpen(true)}>
              {t('sites.nginx')}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('sites.deleteLabel', { name })}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 aria-hidden />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="text-muted-foreground">{t('sites.upstream')}</span>
            <code className="font-mono text-xs">
              {site.target || t('sites.globalUpstream', { target: draft.server.target || t('common.notSet') })}
            </code>
          </div>
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map((section) => {
              const own = !!site[OWN_FLAG[section]]
              return (
                <Badge key={section} variant={own ? 'default' : 'secondary'}>
                  {t(own ? `sites.badge.own.${section}` : `sites.badge.global.${section}`)}
                </Badge>
              )
            })}
          </div>
          <SiteStatsGrid counters={counters} />
        </CardContent>

        <CollapsibleContent>
          <CardContent className="space-y-6 border-t pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={fieldId('name')} label={t('sites.name')} error={nameError}>
                <Input
                  id={fieldId('name')}
                  value={site.name}
                  autoFocus={autoFocusName}
                  onFocus={(e) => {
                    if (autoFocusName) e.currentTarget.select()
                  }}
                  onChange={(e) => {
                    const v = e.target.value
                    update((s) => {
                      s.name = v
                    })
                  }}
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={!!nameError || undefined}
                  aria-describedby={nameError ? `${fieldId('name')}-error` : undefined}
                />
              </Field>

              <Field
                id={fieldId('target')}
                label={t('sites.upstreamUrl')}
                help={<Rich text={t('sites.upstreamHelp')} />}
              >
                <Input
                  id={fieldId('target')}
                  className="font-mono"
                  value={site.target}
                  placeholder={draft.server.target || 'http://localhost:3000'}
                  onChange={(e) => {
                    const v = e.target.value
                    update((s) => {
                      s.target = v
                    })
                  }}
                  autoComplete="off"
                  spellCheck={false}
                  aria-describedby={`${fieldId('target')}-help`}
                />
              </Field>
            </div>

            <Field
              id={fieldId('hosts')}
              label={t('sites.hosts')}
              help={<Rich text={t('sites.hostsTagHelp')} />}
              error={hostsError}
            >
              <HostTags
                id={fieldId('hosts')}
                value={site.hosts}
                onChange={(hosts) =>
                  update((s) => {
                    s.hosts = hosts
                  })
                }
                placeholder={t('sites.hostPlaceholder')}
                removeLabel={(host) => t('sites.removeHost', { host })}
                invalid={!!hostsError}
                describedBy={hostsError ? `${fieldId('hosts')}-error` : `${fieldId('hosts')}-help`}
              />
            </Field>

            <div className="grid gap-3">
              {SECTIONS.map((section) => {
                const own = !!site[OWN_FLAG[section]]
                const switchId = fieldId(`own-${section}`)
                return (
                  <div key={section} className="flex items-start justify-between gap-4 rounded-md border p-4">
                    <div className="min-w-0 space-y-1">
                      <Label htmlFor={switchId}>{t(`sites.own.${section}`)}</Label>
                      <p className="text-xs text-muted-foreground">
                        {own ? (
                          <>
                            {t('sites.ownOn')} {editLink(section)}
                          </>
                        ) : (
                          t('sites.ownOff')
                        )}
                      </p>
                    </div>
                    <Switch
                      id={switchId}
                      checked={own}
                      onCheckedChange={(next) => setOwn(section, next)}
                    />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>

      <NginxDialog site={site} open={nginxOpen} onOpenChange={setNginxOpen} />

      <ConfirmTypeNameDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('sites.deleteTitle', { name })}
        description={t('sites.deleteDesc')}
        name={name}
        confirmLabel={t('sites.deleteConfirm')}
        onConfirm={remove}
      />

      <AlertDialog open={offSection !== null} onOpenChange={(v) => !v && setOffSection(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{offSection ? t(`sites.useGlobalTitle.${offSection}`) : ''}</AlertDialogTitle>
            <AlertDialogDescription>{offSection ? t(`sites.useGlobalDesc.${offSection}`) : ''}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmOff}>
              {t('scope.useGlobal')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Collapsible>
  )
}
