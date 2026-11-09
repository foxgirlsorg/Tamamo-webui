import { ArrowDown, ArrowUp, ChevronRight, Folder, Trash2, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Field, NumberField } from '@/components/fields'
import { useDraft } from '@/lib/draft-context'
import { cn } from '@/lib/utils'
import type { ModuleConfig, ModulesResponse } from '@/lib/types'

import {
  CACHE_MAX,
  MODULE_ICON,
  WEBHOOK_FORM_SETTINGS,
  WEBHOOK_TIMEOUT_MAX,
  WEBHOOK_TIMEOUT_MIN,
  clampCache,
  moduleTypeLabel,
  onErrorOptions,
  sitesSummary,
  slotText,
  withNode,
} from './helpers'
import { SitesCombobox } from './sites-combobox'
import { DeclaredSettings, KeyValueSettings } from './settings-editor'

interface ModuleCardProps {
  index: number
  total: number
  module: ModuleConfig
  info: ModulesResponse | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  onMove: (delta: -1 | 1) => void
  onDelete: () => void
}

/** One configured module: header with enable switch and order/delete actions, and an editable body. */
export function ModuleCard({ index, total, module: m, info, open, onOpenChange, onMove, onDelete }: ModuleCardProps) {
  const { t } = useTranslation()
  const { draft, setDraft } = useDraft()
  const name = m.name || t('modules.unnamed')
  const baseId = `module-${index}`

  const avail = m.type === 'go' ? info?.available.find((x) => x.name === m.name) : undefined
  const pageMod = m.type === 'page' ? info?.page_modules.find((x) => x.name === m.name) : undefined
  const dir = info?.modules_dir || info?.data_dir || 'data/modules'
  const moduleDir = `${dir.replace(/[\\/]+$/, '')}/${m.name}/`

  const firstLine =
    (m.type === 'go' && avail?.description) ||
    (m.type === 'webhook' && m.url) ||
    (m.type === 'page' && pageMod ? pageMod.files.join(', ') : '') ||
    ''
  const summary = [firstLine, sitesSummary(t, draft, m.sites)].filter(Boolean).join(' · ')

  /** Edits this module in the draft. */
  const patch = (edit: (mm: ModuleConfig) => void) => {
    setDraft((d) => {
      edit(d.modules[index])
    })
  }

  const cache = m.settings.cache_seconds ?? ''
  const sendCookies = m.settings.send_cookies === 'true'
  const knownKeys =
    m.type === 'webhook' ? WEBHOOK_FORM_SETTINGS : m.type === 'go' && avail ? avail.settings.map((s) => s.name) : []

  const TypeIcon = MODULE_ICON[m.type] ?? MODULE_ICON.webhook

  return (
    <li className="list-none">
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <div
          className={cn(
            'rounded-xl border bg-card text-card-foreground shadow-sm transition-opacity',
            !m.enabled && 'opacity-70',
          )}
        >
          <div className="flex items-center gap-2 p-3 sm:p-4">
            <span aria-hidden className="w-6 shrink-0 text-center text-sm tabular-nums text-muted-foreground">
              {index + 1}
            </span>

            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex min-w-0 grow items-start gap-2 rounded-md text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <ChevronRight
                  aria-hidden
                  className={cn('mt-1 size-4 shrink-0 transition-transform', open && 'rotate-90')}
                />
                <span className="flex min-w-0 grow flex-col gap-1">
                  <span className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{name}</span>
                    <Badge variant="secondary" className="gap-1">
                      <TypeIcon aria-hidden className="size-3" />
                      {moduleTypeLabel(t, m.type)}
                    </Badge>
                    {!m.enabled ? <Badge variant="outline">{t('common.off')}</Badge> : null}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">{summary}</span>
                </span>
              </button>
            </CollapsibleTrigger>

            <div className="flex shrink-0 items-center gap-1">
              <Switch
                aria-label={t('modules.enabledLabel', { name })}
                checked={m.enabled}
                onCheckedChange={(v) => patch((mm) => void (mm.enabled = v))}
              />
              <Separator orientation="vertical" className="mx-1 h-6" />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t('common.moveUp')}
                disabled={index === 0}
                onClick={() => onMove(-1)}
              >
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
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t('modules.deleteLabel', { name })}
                onClick={onDelete}
              >
                <Trash2 aria-hidden />
              </Button>
            </div>
          </div>

          <CollapsibleContent>
            <div className="space-y-6 border-t p-4 sm:p-5">
              {m.type === 'webhook' ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field id={`${baseId}-name`} label={t('modules.name')} help={t('modules.nameHelp')}>
                      <Input
                        id={`${baseId}-name`}
                        className="font-mono"
                        value={m.name}
                        spellCheck={false}
                        autoComplete="off"
                        onChange={(e) => patch((mm) => void (mm.name = e.target.value))}
                      />
                    </Field>
                    <Field id={`${baseId}-url`} label={t('modules.url')} help={t('modules.urlHelp')}>
                      <Input
                        id={`${baseId}-url`}
                        className="font-mono"
                        placeholder="https://checks.example.com/tamamo"
                        value={m.url}
                        spellCheck={false}
                        autoComplete="off"
                        onChange={(e) => patch((mm) => void (mm.url = e.target.value))}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field id={`${baseId}-timeout`} label={t('modules.timeout')}>
                      <NumberField
                        id={`${baseId}-timeout`}
                        value={m.timeout_ms}
                        min={WEBHOOK_TIMEOUT_MIN}
                        max={WEBHOOK_TIMEOUT_MAX}
                        step={50}
                        suffix={t('unit.ms')}
                        onChange={(v) => patch((mm) => void (mm.timeout_ms = v))}
                      />
                    </Field>
                    <OnErrorField id={`${baseId}-on-error`} value={m.on_error} onChange={(v) => patch((mm) => void (mm.on_error = v))} />
                    <Field id={`${baseId}-cache`} label={t('modules.cache')} help={t('modules.cacheHelp')}>
                      <div className="flex items-center gap-2">
                        <Input
                          id={`${baseId}-cache`}
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={CACHE_MAX}
                          placeholder="0"
                          value={cache}
                          onChange={(e) =>
                            patch((mm) => {
                              const n = parseInt(e.target.value, 10)
                              if (Number.isNaN(n) || n <= 0) delete mm.settings.cache_seconds
                              else mm.settings.cache_seconds = String(clampCache(n))
                            })
                          }
                        />
                        <span className="shrink-0 text-sm text-muted-foreground">{t('unit.seconds')}</span>
                      </div>
                    </Field>
                  </div>

                  <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
                    <div className="space-y-1">
                      <Label htmlFor={`${baseId}-cookies`}>{t('modules.sendCookies')}</Label>
                      <p className="text-xs text-muted-foreground">{t('modules.sendCookiesHelp')}</p>
                    </div>
                    <Switch
                      id={`${baseId}-cookies`}
                      checked={sendCookies}
                      onCheckedChange={(v) =>
                        patch((mm) => {
                          if (v) mm.settings.send_cookies = 'true'
                          else delete mm.settings.send_cookies
                        })
                      }
                    />
                  </div>
                </>
              ) : null}

              {m.type === 'go' ? (
                <>
                  {avail ? (
                    <>
                      <p className="text-sm text-muted-foreground">{avail.description}</p>
                      <DeclaredSettings
                        defs={avail.settings}
                        settings={m.settings}
                        onChange={(s) => patch((mm) => void (mm.settings = s))}
                      />
                    </>
                  ) : (
                    <Alert>
                      <TriangleAlert aria-hidden />
                      <AlertTitle>{t('modules.goMissing', { name })}</AlertTitle>
                      <AlertDescription>{t('modules.goMissingDesc')}</AlertDescription>
                    </Alert>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <OnErrorField id={`${baseId}-on-error`} value={m.on_error} onChange={(v) => patch((mm) => void (mm.on_error = v))} />
                  </div>
                </>
              ) : null}

              {m.type === 'page' ? (
                pageMod ? (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Folder aria-hidden className="size-4 text-muted-foreground" />
                    <code className="font-mono text-xs">{moduleDir}</code>
                    {pageMod.files.map((f) => (
                      <Badge key={f} variant="outline">
                        {f}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <TriangleAlert aria-hidden />
                    <AlertTitle>{t('modules.pageMissing', { name })}</AlertTitle>
                    <AlertDescription>
                      {withNode(t('modules.pageMissingDesc', { dir: slotText }), <code className="font-mono text-xs">{moduleDir}</code>)}
                    </AlertDescription>
                  </Alert>
                )
              ) : null}

              <KeyValueSettings
                settings={m.settings}
                known={knownKeys}
                onChange={(s) => patch((mm) => void (mm.settings = s))}
              />

              <Field id={`${baseId}-sites`} label={t('modules.sites')} help={t('modules.sitesHelp')}>
                <SitesCombobox
                  id={`${baseId}-sites`}
                  value={m.sites}
                  onChange={(ids) => patch((mm) => void (mm.sites = ids))}
                />
              </Field>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </li>
  )
}

/** The on_error Select shared by all module types. */
export function OnErrorField({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation()
  return (
    <Field id={id} label={t('modules.onErrorLabel')} help={t('modules.onErrorHelp')}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
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
  )
}
