import { useTranslation } from 'react-i18next'
import { Ban, Check, Shield, type LucideIcon } from 'lucide-react'

import { Field, NumberField } from '@/components/fields'
import { PageHeader } from '@/components/page-header'
import { SiteScopePicker } from '@/components/site-scope-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { getAtPath, setAtPath } from '@/lib/config'
import { useDraft, useScope } from '@/lib/draft-context'
import type { Action, Protection } from '@/lib/types'

import { ProtectionChecks } from './checks'

/** Typical hash rates used for the time estimate (legacy values). */
const LAPTOP_HPS = 1_500_000
const PHONE_HPS = 400_000
const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8]
const PASS_PRESETS = [24, 168, 720]

const ACTION_CARDS: { value: Action; icon: LucideIcon; title: string; desc: string }[] = [
  { value: 'allow', icon: Check, title: 'action.allow', desc: 'protection.fallback.allow' },
  { value: 'challenge', icon: Shield, title: 'action.challenge', desc: 'protection.fallback.challenge' },
  { value: 'block', icon: Ban, title: 'action.block', desc: 'protection.fallback.block' },
]

function formatNumber(lang: string, value: number): string {
  return new Intl.NumberFormat(lang).format(value)
}

function formatCompact(lang: string, value: number): string {
  try {
    return new Intl.NumberFormat(lang, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
  } catch {
    return formatNumber(lang, value)
  }
}

function formatUnit(lang: string, value: number, unit: string, digits = 0, display: 'short' | 'long' = 'short'): string {
  try {
    return new Intl.NumberFormat(lang, { style: 'unit', unit, unitDisplay: display, maximumFractionDigits: digits }).format(value)
  } catch {
    return `${value.toFixed(digits)} ${unit}`
  }
}

/** Human duration for a number of seconds (legacy fmtDuration). */
function formatDuration(lang: string, seconds: number): string {
  if (seconds < 1) return formatUnit(lang, Math.max(1, Math.round(seconds * 1000)), 'millisecond')
  if (seconds < 60) return formatUnit(lang, seconds, 'second', seconds < 10 ? 1 : 0)
  if (seconds < 3600) return formatUnit(lang, Math.round(seconds / 60), 'minute')
  if (seconds < 86400) return formatUnit(lang, seconds / 3600, 'hour', 1)
  return formatUnit(lang, seconds / 86400, 'day', 1, 'long')
}

/** Pass length as a readable unit: 1 day, 1 week, 30 days, or hours. */
function formatHours(lang: string, hours: number): string {
  if (hours % (24 * 7) === 0) return formatUnit(lang, hours / 168, 'week', 0, 'long')
  if (hours % 24 === 0) return formatUnit(lang, hours / 24, 'day', 0, 'long')
  return formatUnit(lang, hours, 'hour', 0, 'long')
}

function Estimate({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  )
}

/** Explains one difficulty level and estimates the work for a laptop and a phone. */
function DifficultyEstimate({ level }: { level: number }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const hashes = 16 ** level
  return (
    <div className="space-y-3" aria-live="polite">
      <p className="text-sm">
        <span className="font-semibold">{t('difficulty.level', { n: level, name: t(`difficulty.${level}.name`) })}</span>{' '}
        {t(`difficulty.${level}.desc`)}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Estimate label={t('protection.work')} value={`≈ ${formatNumber(lang, hashes)}`} sub={t('protection.workSub')} />
        <Estimate
          label={t('protection.laptop')}
          value={formatDuration(lang, hashes / LAPTOP_HPS)}
          sub={t('protection.atRate', { rate: formatCompact(lang, LAPTOP_HPS) })}
        />
        <Estimate
          label={t('protection.phone')}
          value={formatDuration(lang, hashes / PHONE_HPS)}
          sub={t('protection.atRate', { rate: formatCompact(lang, PHONE_HPS) })}
        />
      </div>
      <p className="text-xs text-muted-foreground">{t('protection.vary')}</p>
    </div>
  )
}

function SwitchRow({
  id,
  label,
  desc,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  desc: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0 space-y-1">
        <Label htmlFor={id}>{label}</Label>
        <p id={`${id}-desc`} className="text-xs text-muted-foreground">
          {desc}
        </p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} aria-describedby={`${id}-desc`} />
    </div>
  )
}

/**
 * Protection settings: the global ones, or a site's own copy when the site owns
 * the section. Mirrors legacy viewProtection.
 */
export function ProtectionPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { draft, setDraft } = useDraft()
  const { sectionPath, isOwn, site } = useScope()
  const path = sectionPath('protection')
  // A site that follows the global settings shows only the notice from the picker.
  const showFields = !site || isOwn('protection')
  const p = getAtPath<Protection>(draft, path)

  const set = <K extends keyof Protection>(key: K, value: Protection[K]) => {
    setDraft((d) => {
      setAtPath(d, `${path}.${key}`, value)
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('nav.protection')} description={t('protection.desc')} />
      <SiteScopePicker section="protection" />

      {showFields ? (
        <>
          <Card>
            <CardContent>
              <SwitchRow
                id="protection-enabled"
                label={t('protection.enabled')}
                desc={t('protection.enabledDesc')}
                checked={p.enabled}
                onCheckedChange={(v) => set('enabled', v)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('protection.difficulty')}</CardTitle>
              <CardDescription>{t('protection.difficultyDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label id="protection-difficulty-label">{t('protection.difficultyLabel')}</Label>
                  <output aria-live="off" className="text-sm font-medium tabular-nums">
                    {`${formatNumber(lang, p.difficulty)} · ${t(`difficulty.${p.difficulty}.name`)}`}
                  </output>
                </div>
                <Slider
                  aria-labelledby="protection-difficulty-label"
                  min={DIFFICULTY_LEVELS[0]}
                  max={DIFFICULTY_LEVELS[DIFFICULTY_LEVELS.length - 1]}
                  step={1}
                  value={[p.difficulty]}
                  onValueChange={([v]) => set('difficulty', v)}
                />
                <div className="flex justify-between px-1 text-xs text-muted-foreground tabular-nums" aria-hidden>
                  {DIFFICULTY_LEVELS.map((n) => (
                    <span key={n}>{formatNumber(lang, n)}</span>
                  ))}
                </div>
              </div>
              <DifficultyEstimate level={p.difficulty} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('protection.fallbackTitle')}</CardTitle>
              <CardDescription>{t('protection.fallbackDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p id="protection-default-action-label" className="text-sm font-medium">
                {t('protection.defaultAction')}
              </p>
              <RadioGroup
                aria-labelledby="protection-default-action-label"
                value={p.default_action}
                onValueChange={(v) => set('default_action', v as Action)}
                className="grid gap-3 sm:grid-cols-3"
              >
                {ACTION_CARDS.map((card) => {
                  const id = `protection-action-${card.value}`
                  const Icon = card.icon
                  return (
                    <Label
                      key={card.value}
                      htmlFor={id}
                      className="flex cursor-pointer flex-col items-start gap-2 rounded-lg border p-4 font-normal has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <RadioGroupItem value={card.value} id={id} />
                        <Icon className="size-4" aria-hidden />
                        {t(card.title)}
                      </span>
                      <span className="text-xs text-muted-foreground">{t(card.desc)}</span>
                    </Label>
                  )
                })}
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('protection.passes')}</CardTitle>
              <CardDescription>{t('protection.passesDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-3">
                  <Field
                    id="protection-pass-hours"
                    label={t('protection.passHours')}
                    help={t('protection.passHoursHelp', { current: formatHours(lang, p.pass_hours) })}
                  >
                    <NumberField
                      id="protection-pass-hours"
                      value={p.pass_hours}
                      onChange={(v) => set('pass_hours', v)}
                      min={1}
                      max={8760}
                      suffix={t('unit.hours')}
                      aria-describedby="protection-pass-hours-help"
                    />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    {PASS_PRESETS.map((hours) => (
                      <Button
                        key={hours}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => set('pass_hours', hours)}
                      >
                        {formatHours(lang, hours)}
                      </Button>
                    ))}
                  </div>
                </div>
                <Field
                  id="protection-challenge-minutes"
                  label={t('protection.challengeMinutes')}
                  help={t('protection.challengeMinutesHelp')}
                >
                  <NumberField
                    id="protection-challenge-minutes"
                    value={p.challenge_minutes}
                    onChange={(v) => set('challenge_minutes', v)}
                    min={1}
                    max={120}
                    suffix={t('unit.minutes')}
                    aria-describedby="protection-challenge-minutes-help"
                  />
                </Field>
              </div>
              <div className="divide-y">
                <SwitchRow
                  id="protection-bind-ip"
                  label={t('protection.bindIp')}
                  desc={t('protection.bindIpDesc')}
                  checked={p.bind_ip}
                  onCheckedChange={(v) => set('bind_ip', v)}
                />
                <SwitchRow
                  id="protection-bind-ua"
                  label={t('protection.bindUa')}
                  desc={t('protection.bindUaDesc')}
                  checked={p.bind_user_agent}
                  onCheckedChange={(v) => set('bind_user_agent', v)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('protection.cookie')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <Field id="protection-cookie-name" label={t('protection.cookieName')} help={t('protection.cookieNameHelp')}>
                  <Input
                    id="protection-cookie-name"
                    className="font-mono"
                    value={p.cookie_name}
                    onChange={(e) => set('cookie_name', e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    aria-describedby="protection-cookie-name-help"
                  />
                </Field>
                <Field id="protection-cookie-domain" label={t('protection.cookieDomain')} help={t('protection.cookieDomainHelp')}>
                  <Input
                    id="protection-cookie-domain"
                    className="font-mono"
                    placeholder="example.com"
                    value={p.cookie_domain}
                    onChange={(e) => set('cookie_domain', e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    aria-describedby="protection-cookie-domain-help"
                  />
                </Field>
              </div>
              <Field
                id="protection-max-failures"
                label={t('protection.maxFailures')}
                help={t('protection.maxFailuresHelp')}
              >
                <NumberField
                  id="protection-max-failures"
                  value={p.max_failures_per_minute}
                  onChange={(v) => set('max_failures_per_minute', v)}
                  min={0}
                  max={10000}
                  suffix={t('unit.perIp')}
                  aria-describedby="protection-max-failures-help"
                />
              </Field>
            </CardContent>
          </Card>

          <ProtectionChecks
            protection={p}
            edit={(fn) => {
              setDraft((d) => {
                fn(getAtPath<Protection>(d, path))
              })
            }}
          />
        </>
      ) : null}
    </div>
  )
}
