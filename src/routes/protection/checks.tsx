import './i18n'

import { useState } from 'react'
import { ChevronRight, Eye, EyeOff, Info, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Field, NumberField } from '@/components/fields'
import { ListTextarea } from '@/components/list-textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { BypassHeader, OnError, Protection, RateLimit, VerifiedBots, Webhook } from '@/lib/types'
import { cn } from '@/lib/utils'

/** Limits the Go backend enforces (internal/config/config.go, validateChecks). */
const MIN_BYPASS_VALUE = 16
const HEADER_NAME = /^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/
const ON_ERROR: OnError[] = ['continue', 'challenge', 'block']

interface ChecksProps {
  /** Protection section being edited (global or a site's own). */
  protection: Protection
  /** Applies an edit to that section in the draft. */
  edit: (fn: (p: Protection) => void) => void
}

/** 32 random URL-safe characters for a bypass header value. */
function randomSecret(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_')
}

function formatWindow(lang: string, seconds: number): string {
  const [value, unit] =
    seconds % 3600 === 0 ? [seconds / 3600, 'hour'] : seconds % 60 === 0 ? [seconds / 60, 'minute'] : [seconds, 'second']
  try {
    return new Intl.NumberFormat(lang, { style: 'unit', unit, unitDisplay: 'long' }).format(value)
  } catch {
    return `${value} ${unit}`
  }
}

/** The checks that run before the rules: honeypot, unprotected pages, bypass headers, verified bots, rate limit and webhooks. */
export function ProtectionChecks({ protection: p, edit }: ChecksProps) {
  const { t } = useTranslation()
  return (
    <section className="space-y-4" aria-labelledby="checks-title">
      <div className="space-y-1">
        <h2 id="checks-title" className="text-lg font-semibold tracking-tight">
          {t('checks.title')}
        </h2>
        <p className="max-w-prose text-sm text-muted-foreground">{t('checks.desc')}</p>
      </div>
      <HoneypotCard protection={p} edit={edit} />
      <UnprotectedCard protection={p} edit={edit} />
      <BypassHeadersCard headers={p.bypass_headers} edit={edit} />
      <VerifiedBotsCard bots={p.verified_bots} edit={edit} />
      <RateLimitCard rate={p.rate_limit} edit={edit} />
      <WebhooksCard hooks={p.webhooks} edit={edit} />
    </section>
  )
}

/** Crawlers the backend can confirm by reverse DNS (internal/checks/verifiedbots.go). */
const VERIFIED_BOTS = 'Googlebot, Bingbot, Yandex, Baiduspider, Applebot, PetalBot, MojeekBot'

// ---- honeypot ---------------------------------------------------------------

function HoneypotCard({ protection: p, edit }: ChecksProps) {
  const { t, i18n } = useTranslation()
  const hp = p.honeypot
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('checks.honeypot.title')}</CardTitle>
        <CardDescription>{t('checks.honeypot.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="honeypot-enabled">{t('checks.honeypot.enabled')}</Label>
          <Switch
            id="honeypot-enabled"
            checked={hp.enabled}
            onCheckedChange={(v) => edit((x) => void (x.honeypot.enabled = v))}
          />
        </div>
        {hp.enabled ? (
          <>
            <div className="grid items-start gap-5 md:grid-cols-2">
              <ListTextarea
                id="honeypot-paths"
                label={t('checks.honeypot.paths')}
                help={t('checks.honeypot.pathsHelp')}
                placeholder={['/wp-login.php', '/.env', '/phpmyadmin/*'].join('\n')}
                rows={4}
                list={hp.paths}
                onChange={(list) => edit((x) => void (x.honeypot.paths = list))}
              />
              <Field
                id="honeypot-hours"
                label={t('checks.honeypot.hours')}
                help={t('checks.honeypot.hoursHelp', { current: formatWindow(i18n.language, p.pass_hours * 3600) })}
              >
                <NumberField
                  id="honeypot-hours"
                  value={hp.ban_hours}
                  onChange={(v) => edit((x) => void (x.honeypot.ban_hours = v))}
                  min={0}
                  max={8760}
                  suffix={t('unit.hours')}
                  aria-describedby="honeypot-hours-help"
                />
              </Field>
            </div>
            <Alert>
              <Info aria-hidden />
              <AlertDescription>{t('checks.honeypot.ipNote')}</AlertDescription>
            </Alert>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}

// ---- unprotected paths and passes from other sites ----------------------------

function UnprotectedCard({ protection: p, edit }: ChecksProps) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('checks.open.title')}</CardTitle>
        <CardDescription>{t('checks.open.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="grid items-start gap-5 md:grid-cols-2">
        <ListTextarea
          id="unprotected-paths"
          label={t('checks.open.paths')}
          help={t('checks.open.pathsHelp')}
          placeholder={'/robots.txt\n/.well-known/*\n/favicon.ico'}
          rows={4}
          list={p.unprotected_paths}
          onChange={(list) => edit((x) => void (x.unprotected_paths = list))}
        />
        <ListTextarea
          id="accept-passes-from"
          label={t('checks.open.sites')}
          help={t('checks.open.sitesHelp')}
          placeholder="default"
          rows={4}
          list={p.accept_passes_from}
          onChange={(list) => edit((x) => void (x.accept_passes_from = list))}
        />
      </CardContent>
    </Card>
  )
}

// ---- verified bots ----------------------------------------------------------

function VerifiedBotsCard({ bots, edit }: { bots: VerifiedBots; edit: ChecksProps['edit'] }) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('checks.bots.title')}</CardTitle>
        <CardDescription>{t('checks.bots.desc', { bots: VERIFIED_BOTS })}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="bots-enabled">{t('checks.bots.enabled')}</Label>
          <Switch
            id="bots-enabled"
            checked={bots.enabled}
            onCheckedChange={(v) => edit((p) => void (p.verified_bots.enabled = v))}
          />
        </div>
        {bots.enabled ? (
          <Field id="bots-action" label={t('checks.bots.action')} help={t('checks.bots.actionHelp')}>
            <Select value={bots.action} onValueChange={(v) => edit((p) => void (p.verified_bots.action = v as VerifiedBots['action']))}>
              <SelectTrigger id="bots-action" className="w-full sm:w-80" aria-describedby="bots-action-help">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="block">{t('checks.rate.actionBlock')}</SelectItem>
                <SelectItem value="challenge">{t('checks.rate.actionChallenge')}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        ) : null}
      </CardContent>
    </Card>
  )
}

// ---- bypass headers ---------------------------------------------------------

function BypassHeadersCard({ headers, edit }: { headers: BypassHeader[]; edit: ChecksProps['edit'] }) {
  const { t } = useTranslation()
  // Indexes of rows whose secret is shown. A new or regenerated value is shown so it can be copied.
  const [shown, setShown] = useState<Set<number>>(() => new Set())

  const show = (i: number, on: boolean) => {
    setShown((prev) => {
      const next = new Set(prev)
      if (on) next.add(i)
      else next.delete(i)
      return next
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('checks.bypass.title')}</CardTitle>
        <CardDescription>{t('checks.bypass.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {headers.length === 0 ? <p className="text-sm text-muted-foreground">{t('checks.bypass.none')}</p> : null}

        {headers.map((h, i) => {
          const id = `bypass-${i}`
          const label = h.name || h.header || String(i + 1)
          const badHeader = h.header.trim() !== '' && !HEADER_NAME.test(h.header.trim())
          const badValue = h.value.length > 0 && h.value.length < MIN_BYPASS_VALUE
          const visible = shown.has(i)
          return (
            <div key={i} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_auto] sm:items-start">
              <Field id={`${id}-name`} label={t('checks.bypass.name')}>
                <Input
                  id={`${id}-name`}
                  value={h.name}
                  placeholder={t('checks.bypass.namePlaceholder')}
                  autoComplete="off"
                  onChange={(e) => edit((p) => void (p.bypass_headers[i].name = e.target.value))}
                />
              </Field>
              <Field id={`${id}-header`} label={t('checks.bypass.header')} error={badHeader ? t('checks.bypass.errHeader') : undefined}>
                <Input
                  id={`${id}-header`}
                  className="font-mono"
                  value={h.header}
                  placeholder="X-Monitor-Token"
                  spellCheck={false}
                  autoComplete="off"
                  aria-invalid={badHeader || undefined}
                  onChange={(e) => edit((p) => void (p.bypass_headers[i].header = e.target.value))}
                />
              </Field>
              <Field
                id={`${id}-value`}
                label={t('checks.bypass.value')}
                help={badValue ? undefined : t('checks.bypass.valueHelp')}
                error={badValue ? t('checks.bypass.errValue') : undefined}
              >
                <div className="flex items-center gap-1">
                  <Input
                    id={`${id}-value`}
                    className="font-mono"
                    type={visible ? 'text' : 'password'}
                    value={h.value}
                    spellCheck={false}
                    autoComplete="off"
                    aria-invalid={badValue || undefined}
                    onChange={(e) => edit((p) => void (p.bypass_headers[i].value = e.target.value))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={visible ? t('checks.bypass.hide') : t('checks.bypass.show')}
                    aria-pressed={visible}
                    onClick={() => show(i, !visible)}
                  >
                    {visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t('checks.bypass.generate')}
                    title={t('checks.bypass.generate')}
                    onClick={() => {
                      edit((p) => void (p.bypass_headers[i].value = randomSecret()))
                      show(i, true)
                    }}
                  >
                    <RefreshCw aria-hidden />
                  </Button>
                </div>
              </Field>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="sm:mt-7"
                aria-label={t('checks.bypass.remove', { name: label })}
                onClick={() => {
                  edit((p) => void p.bypass_headers.splice(i, 1))
                  setShown(new Set())
                }}
              >
                <Trash2 aria-hidden />
              </Button>
            </div>
          )
        })}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            edit((p) => void p.bypass_headers.push({ name: '', header: 'X-Monitor-Token', value: randomSecret() }))
            show(headers.length, true)
          }}
        >
          <Plus aria-hidden />
          {t('checks.bypass.add')}
        </Button>
      </CardContent>
    </Card>
  )
}

// ---- rate limit -------------------------------------------------------------

function RateLimitCard({ rate, edit }: { rate: RateLimit; edit: ChecksProps['edit'] }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const set = <K extends keyof RateLimit>(key: K, value: RateLimit[K]) => edit((p) => void (p.rate_limit[key] = value))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('checks.rate.title')}</CardTitle>
        <CardDescription>{t('checks.rate.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="rate-enabled">{t('checks.rate.enabled')}</Label>
          <Switch id="rate-enabled" checked={rate.enabled} onCheckedChange={(v) => set('enabled', v)} />
        </div>

        {rate.enabled ? (
          <>
            <div className="grid items-start gap-5 md:grid-cols-3">
              <Field id="rate-requests" label={t('checks.rate.requests')}>
                <NumberField id="rate-requests" value={rate.requests} min={1} max={1_000_000} onChange={(v) => set('requests', v)} />
              </Field>
              <Field id="rate-window" label={t('checks.rate.window')}>
                <NumberField
                  id="rate-window"
                  value={rate.window_seconds}
                  min={1}
                  max={86400}
                  suffix={t('unit.seconds')}
                  onChange={(v) => set('window_seconds', v)}
                />
              </Field>
              <Field id="rate-action" label={t('checks.rate.action')}>
                <Select value={rate.action} onValueChange={(v) => set('action', v as RateLimit['action'])}>
                  <SelectTrigger id="rate-action" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="block">{t('checks.rate.actionBlock')}</SelectItem>
                    <SelectItem value="challenge">{t('checks.rate.actionChallenge')}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {t('checks.rate.summary', {
                requests: new Intl.NumberFormat(lang).format(rate.requests),
                window: formatWindow(lang, rate.window_seconds),
              })}
            </p>

            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="group -ml-2">
                  <ChevronRight aria-hidden className="transition-transform group-data-[state=open]:rotate-90" />
                  {t('checks.rate.advanced')}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid gap-5 pt-3 md:grid-cols-2">
                  <Field id="rate-ipv6" label={t('checks.rate.ipv6')} help={t('checks.rate.ipv6Help')}>
                    <NumberField id="rate-ipv6" value={rate.ipv6_prefix} min={48} max={128} onChange={(v) => set('ipv6_prefix', v)} />
                  </Field>
                  <Field id="rate-max-ips" label={t('checks.rate.maxIps')} help={t('checks.rate.maxIpsHelp')}>
                    <NumberField id="rate-max-ips" value={rate.max_ips} min={100} max={10_000_000} step={1000} onChange={(v) => set('max_ips', v)} />
                  </Field>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}

// ---- webhooks ---------------------------------------------------------------

function WebhooksCard({ hooks, edit }: { hooks: Webhook[]; edit: ChecksProps['edit'] }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState<number | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('checks.hooks.title')}</CardTitle>
        <CardDescription>{t('checks.hooks.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {hooks.length === 0 ? <p className="text-sm text-muted-foreground">{t('checks.hooks.none')}</p> : null}

        {hooks.map((h, i) => (
          <WebhookRow
            key={i}
            index={i}
            hook={h}
            duplicate={hooks.some((o, j) => j !== i && o.name.trim() !== '' && o.name.trim().toLowerCase() === h.name.trim().toLowerCase())}
            open={open === i}
            onOpenChange={(v) => setOpen(v ? i : null)}
            edit={edit}
            onRemove={() => {
              edit((p) => void p.webhooks.splice(i, 1))
              setOpen(null)
            }}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            edit((p) => {
              p.webhooks.push({
                name: '',
                enabled: true,
                url: '',
                timeout_ms: 500,
                on_error: 'continue',
                cache_seconds: 0,
                send_cookies: false,
              })
            })
            setOpen(hooks.length)
          }}
        >
          <Plus aria-hidden />
          {t('checks.hooks.add')}
        </Button>
      </CardContent>
    </Card>
  )
}

function WebhookRow({
  index,
  hook: h,
  duplicate,
  open,
  onOpenChange,
  edit,
  onRemove,
}: {
  index: number
  hook: Webhook
  duplicate: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  edit: ChecksProps['edit']
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const id = `webhook-${index}`
  const name = h.name || t('checks.hooks.unnamed')
  const badUrl = h.url.trim() !== '' && !/^https?:\/\/[^\s/]+/i.test(h.url.trim())
  const set = <K extends keyof Webhook>(key: K, value: Webhook[K]) => edit((p) => void (p.webhooks[index][key] = value))

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <div className={cn('rounded-lg border transition-opacity', !h.enabled && 'opacity-70')}>
        <div className="flex items-center gap-2 p-3">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 grow items-start gap-2 rounded-md text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <ChevronRight aria-hidden className={cn('mt-1 size-4 shrink-0 transition-transform', open && 'rotate-90')} />
              <span className="flex min-w-0 grow flex-col gap-0.5">
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="truncate font-medium">{name}</span>
                  {!h.enabled ? <Badge variant="outline">{t('common.off')}</Badge> : null}
                </span>
                <span className="truncate font-mono text-xs text-muted-foreground">{h.url || '—'}</span>
              </span>
            </button>
          </CollapsibleTrigger>
          <Switch aria-label={t('checks.hooks.enabledLabel', { name })} checked={h.enabled} onCheckedChange={(v) => set('enabled', v)} />
          <Button type="button" variant="ghost" size="icon-sm" aria-label={t('checks.hooks.remove', { name })} onClick={onRemove}>
            <Trash2 aria-hidden />
          </Button>
        </div>

        <CollapsibleContent>
          <div className="space-y-5 border-t p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id={`${id}-name`}
                label={t('checks.hooks.name')}
                help={duplicate ? undefined : t('checks.hooks.nameHelp')}
                error={duplicate ? t('checks.hooks.errName') : undefined}
              >
                <Input
                  id={`${id}-name`}
                  value={h.name}
                  autoComplete="off"
                  aria-invalid={duplicate || undefined}
                  onChange={(e) => set('name', e.target.value)}
                />
              </Field>
              <Field
                id={`${id}-url`}
                label={t('checks.hooks.url')}
                help={badUrl ? undefined : t('checks.hooks.urlHelp')}
                error={badUrl ? t('checks.hooks.errUrl') : undefined}
              >
                <Input
                  id={`${id}-url`}
                  className="font-mono"
                  placeholder="http://checker:9000/check"
                  value={h.url}
                  spellCheck={false}
                  autoComplete="off"
                  aria-invalid={badUrl || undefined}
                  onChange={(e) => set('url', e.target.value)}
                />
              </Field>
            </div>

            <div className="grid items-start gap-4 sm:grid-cols-3">
              <Field id={`${id}-timeout`} label={t('checks.hooks.timeout')}>
                <NumberField
                  id={`${id}-timeout`}
                  value={h.timeout_ms}
                  min={1}
                  max={10000}
                  step={50}
                  suffix={t('unit.ms')}
                  onChange={(v) => set('timeout_ms', v)}
                />
              </Field>
              <Field id={`${id}-on-error`} label={t('checks.onError.label')} help={t('checks.onError.help')}>
                <Select value={h.on_error} onValueChange={(v) => set('on_error', v as OnError)}>
                  <SelectTrigger id={`${id}-on-error`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ON_ERROR.map((v) => (
                      <SelectItem key={v} value={v}>
                        {t(`checks.onError.${v}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field id={`${id}-cache`} label={t('checks.hooks.cache')} help={t('checks.hooks.cacheHelp')}>
                <NumberField
                  id={`${id}-cache`}
                  value={h.cache_seconds}
                  min={0}
                  max={3600}
                  suffix={t('unit.seconds')}
                  onChange={(v) => set('cache_seconds', v)}
                />
              </Field>
            </div>

            <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
              <div className="space-y-1">
                <Label htmlFor={`${id}-cookies`}>{t('checks.hooks.sendCookies')}</Label>
                <p className="text-xs text-muted-foreground">{t('checks.hooks.sendCookiesHelp')}</p>
              </div>
              <Switch id={`${id}-cookies`} checked={h.send_cookies} onCheckedChange={(v) => set('send_cookies', v)} />
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
