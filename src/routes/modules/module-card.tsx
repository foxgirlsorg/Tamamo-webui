import { ArrowDown, ArrowUp, ChevronRight, PanelsTopLeft, Trash2, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Field } from '@/components/fields'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useDraft } from '@/lib/draft-context'
import { findRunning, moduleIdOf, modulePagePath } from '@/lib/modules'
import type { ModuleConfig, ModulesResponse, OnError } from '@/lib/types'
import { cn } from '@/lib/utils'

import { MODULE_NAME, onErrorOptions, sitesSummary } from './helpers'
import { DeclaredSettings, KeyValueSettings } from './settings-editor'
import { SitesCombobox } from './sites-combobox'

interface ModuleCardProps {
  index: number
  total: number
  module: ModuleConfig
  /** The same entry as last saved, or undefined when it is new or was renamed. */
  saved: ModuleConfig | undefined
  info: ModulesResponse | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  onMove: (delta: -1 | 1) => void
  onDelete: () => void
}

type Status = 'running' | 'off' | 'unsaved' | 'failed' | 'missing'

const STATUS_VARIANT: Record<Status, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  running: 'secondary',
  off: 'outline',
  unsaved: 'outline',
  failed: 'destructive',
  missing: 'destructive',
}

/** One module entry: header with status, enable switch and order/delete actions, and an editable body. */
export function ModuleCard({ index, total, module: m, saved, info, open, onOpenChange, onMove, onDelete }: ModuleCardProps) {
  const { t } = useTranslation()
  const { draft, setDraft } = useDraft()
  const name = m.name || t('modules.unnamed')
  const baseId = `module-${index}`
  const id = moduleIdOf(m)

  const mod = info?.available.find((x) => x.id === id)
  const running = findRunning(info, m.name)
  // The backend runs what was saved: an edited entry shows its saved state until the next save.
  const unchanged = saved !== undefined && JSON.stringify(saved) === JSON.stringify(m)

  let status: Status
  if (info && !mod) status = 'missing'
  else if (!m.enabled) status = 'off'
  else if (running && unchanged) status = running.error ? 'failed' : 'running'
  else status = 'unsaved'

  const badName = !MODULE_NAME.test(m.name)
  const duplicate = draft.modules.some((o, i) => i !== index && o.name === m.name)
  const summary = [mod?.description, sitesSummary(t, draft, m.sites)].filter(Boolean).join(' · ')
  const hooks = running && unchanged ? running.hooks : []
  const pages = mod?.has_ui ? mod.pages : []

  /** Edits this module in the draft. */
  const patch = (edit: (mm: ModuleConfig) => void) => {
    setDraft((d) => {
      edit(d.modules[index])
    })
  }

  return (
    <li className="list-none">
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <div className={cn('rounded-xl border bg-card text-card-foreground shadow-sm transition-opacity', !m.enabled && 'opacity-70')}>
          <div className="flex items-center gap-2 p-3 sm:p-4">
            <span aria-hidden className="w-6 shrink-0 text-center text-sm tabular-nums text-muted-foreground">
              {index + 1}
            </span>

            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex min-w-0 grow items-start gap-2 rounded-md text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <ChevronRight aria-hidden className={cn('mt-1 size-4 shrink-0 transition-transform', open && 'rotate-90')} />
                <span className="flex min-w-0 grow flex-col gap-1">
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{mod && mod.name !== mod.id ? mod.name : name}</span>
                    <code className="font-mono text-xs text-muted-foreground">{m.name}</code>
                    <Badge variant={STATUS_VARIANT[status]}>{t(`modules.status.${status}`)}</Badge>
                  </span>
                  <span className="truncate text-xs text-muted-foreground">{summary}</span>
                </span>
              </button>
            </CollapsibleTrigger>

            <div className="flex shrink-0 items-center gap-1">
              <Switch
                aria-label={t('modules.enabledLabel', { name })}
                checked={m.enabled}
                disabled={status === 'missing' && !m.enabled}
                onCheckedChange={(v) => patch((mm) => void (mm.enabled = v))}
              />
              <Separator orientation="vertical" className="mx-1 h-6" />
              <Button type="button" variant="ghost" size="icon-sm" aria-label={t('common.moveUp')} disabled={index === 0} onClick={() => onMove(-1)}>
                <ArrowUp aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t('common.moveDown')}
                disabled={index === total - 1}
                onClick={() => onMove(1)}
              >
                <ArrowDown aria-hidden />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={t('modules.deleteLabel', { name })} onClick={onDelete}>
                <Trash2 aria-hidden />
              </Button>
            </div>
          </div>

          <CollapsibleContent>
            <div className="space-y-6 border-t p-4 sm:p-5">
              {status === 'missing' ? (
                <Alert variant="destructive">
                  <TriangleAlert aria-hidden />
                  <AlertTitle>{t('modules.missingTitle', { id })}</AlertTitle>
                  <AlertDescription>{t('modules.missingDesc')}</AlertDescription>
                </Alert>
              ) : null}

              {status === 'failed' && running ? (
                <Alert variant="destructive">
                  <TriangleAlert aria-hidden />
                  <AlertTitle>{t('modules.startError')}</AlertTitle>
                  <AlertDescription className="font-mono text-xs">{running.error}</AlertDescription>
                </Alert>
              ) : null}

              {mod ? (
                <div className="space-y-3">
                  {mod.description ? <p className="max-w-prose text-sm text-muted-foreground">{mod.description}</p> : null}
                  {hooks.length ? (
                    <div className="flex flex-wrap items-center gap-1.5" aria-label={t('modules.hooks.title')}>
                      {hooks.map((h) => (
                        <Badge key={h} variant="outline" className="font-normal">
                          {t(`modules.hooks.${h}`, { defaultValue: h })}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  {hooks.includes('http') || hooks.includes('admin') ? (
                    <dl className="grid gap-x-3 gap-y-1 text-xs sm:grid-cols-[auto_minmax(0,1fr)]">
                      {hooks.includes('http') ? (
                        <>
                          <dt className="text-muted-foreground">{t('modules.publicUrl')}</dt>
                          <dd>
                            <code className="font-mono break-all">{`/.tamamo/x/${m.name}/…`}</code>
                          </dd>
                        </>
                      ) : null}
                      {hooks.includes('admin') ? (
                        <>
                          <dt className="text-muted-foreground">{t('modules.adminUrl')}</dt>
                          <dd>
                            <code className="font-mono break-all">{`/api/x/${m.name}/…`}</code>
                          </dd>
                        </>
                      ) : null}
                    </dl>
                  ) : null}
                </div>
              ) : null}

              {pages.length ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">{t('modules.pages')}</h4>
                  {status === 'running' || status === 'failed' ? (
                    <div className="flex flex-wrap gap-2">
                      {pages.map((p) => (
                        <Button key={p.id} asChild variant="outline" size="sm">
                          <Link to={modulePagePath(m.name, p.id)}>
                            <PanelsTopLeft aria-hidden />
                            {t('modules.openPage', { title: p.title })}
                          </Link>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">{t('modules.pagesWhenRunning')}</p>
                  )}
                </div>
              ) : null}

              {mod ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">{t('modules.settingsTitle')}</h4>
                  <DeclaredSettings fields={mod.settings} settings={m.settings} onChange={(s) => patch((mm) => void (mm.settings = s))} />
                </div>
              ) : null}

              <KeyValueSettings
                settings={m.settings}
                known={mod ? mod.settings.map((s) => s.name) : []}
                onChange={(s) => patch((mm) => void (mm.settings = s))}
              />

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id={`${baseId}-name`}
                  label={t('modules.name')}
                  help={badName || duplicate ? undefined : t('modules.nameHelp')}
                  error={badName ? t('modules.errName') : duplicate ? t('modules.errDuplicate', { name: m.name }) : undefined}
                >
                  <Input
                    id={`${baseId}-name`}
                    className="font-mono"
                    value={m.name}
                    spellCheck={false}
                    autoComplete="off"
                    aria-invalid={badName || duplicate || undefined}
                    onChange={(e) =>
                      patch((mm) => {
                        // The entry keeps running the same module when it is renamed.
                        const moduleId = moduleIdOf(mm)
                        mm.name = e.target.value
                        if (moduleId === mm.name) delete mm.module
                        else mm.module = moduleId
                      })
                    }
                  />
                </Field>
                <Field id={`${baseId}-on-error`} label={t('modules.onErrorLabel')} help={t('modules.onErrorHelp')}>
                  <Select value={m.on_error} onValueChange={(v) => patch((mm) => void (mm.on_error = v as OnError))}>
                    <SelectTrigger id={`${baseId}-on-error`} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {onErrorOptions(t).map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field id={`${baseId}-sites`} label={t('modules.sites')} help={t('modules.sitesHelp')}>
                <SitesCombobox id={`${baseId}-sites`} value={m.sites} onChange={(ids) => patch((mm) => void (mm.sites = ids))} />
              </Field>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </li>
  )
}
