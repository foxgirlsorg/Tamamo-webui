import { ArrowDown, ArrowUp, ChevronRight, Copy, Plus, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Field, NumberField } from '@/components/fields'
import { useDraft, useScope } from '@/lib/draft-context'
import { getAtPath, setAtPath } from '@/lib/config'
import { formatNumber } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { Action, Protection, Rule } from '@/lib/types'

import { METHODS, ruleSummary } from './helpers'
import { ActionBadge } from './rich'
import { TagField } from './tag-input'

interface RuleCardProps {
  rule: Rule
  index: number
  total: number
  /** Draft path of the rule list ("rules" or "sites.2.rules"). */
  listPath: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onMove: (to: number) => void
  onDuplicate: () => void
  onDelete: () => void
}

/** One rule in the ordered list: header with switch and actions, editor when open. */
export function RuleCard({
  rule,
  index,
  total,
  listPath,
  open,
  onOpenChange,
  onMove,
  onDuplicate,
  onDelete,
}: RuleCardProps) {
  const { t } = useTranslation()
  const { draft, setDraft } = useDraft()
  const { sectionPath } = useScope()
  const base = `${listPath}.${index}`
  const untitled = t('rules.untitled')
  const label = rule.name || untitled
  const effectiveDifficulty = getAtPath<Protection>(draft, sectionPath('protection'))?.difficulty ?? 0
  const fieldId = `rule-${rule.id}`

  /** Writes one value into this rule (path relative to the rule). */
  const update = (path: string, value: unknown) => {
    setDraft((d) => {
      setAtPath(d, `${base}.${path}`, value)
    })
  }

  const setMethod = (method: string, checked: boolean) => {
    const set = new Set(rule.match.methods)
    if (checked) set.add(method)
    else set.delete(method)
    update(
      'match.methods',
      METHODS.filter((m) => set.has(m)),
    )
  }

  const setHeader = (i: number, key: 'name' | 'pattern', value: string) => {
    setDraft((d) => {
      setAtPath(d, `${base}.match.headers.${i}.${key}`, value)
    })
  }

  const actionOptions: [Action, string][] = [
    ['allow', t('rules.actionOpt.allow')],
    ['challenge', t('rules.actionOpt.challenge')],
    ['block', t('rules.actionOpt.block')],
  ]

  return (
    <Collapsible
      role="listitem"
      open={open}
      onOpenChange={onOpenChange}
      data-rule-id={rule.id}
      className={cn(!rule.enabled && 'opacity-70')}
    >
      <Card className="gap-0 py-0">
        <div className="flex flex-wrap items-center gap-3 p-3">
          <span aria-hidden className="w-6 shrink-0 text-center font-mono text-sm tabular-nums text-muted-foreground">
            {formatNumber(index + 1)}
          </span>
          <CollapsibleTrigger className="group flex min-w-0 flex-1 items-start gap-2 rounded-md text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <ChevronRight
              aria-hidden
              className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90"
            />
            <span className="flex min-w-0 flex-col gap-1">
              <span className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="truncate font-medium">{label}</span>
                <ActionBadge action={rule.action} label={t(`action.${rule.action}`, { defaultValue: rule.action })} />
                {!rule.enabled ? (
                  <span className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">{t('common.off')}</span>
                ) : null}
              </span>
              <span className="truncate text-sm text-muted-foreground">{ruleSummary(rule, t)}</span>
            </span>
          </CollapsibleTrigger>

          <div className="flex items-center gap-1">
            <Switch
              checked={rule.enabled}
              onCheckedChange={(v) => update('enabled', v)}
              aria-label={t('rules.enabledLabel', { name: label })}
            />
            <Separator orientation="vertical" className="mx-1.5 h-6" />
            <Button
              variant="ghost"
              size="icon-sm"
              data-move="-1"
              aria-label={t('common.moveUp')}
              title={t('common.moveUp')}
              disabled={index === 0}
              onClick={() => onMove(index - 1)}
            >
              <ArrowUp aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              data-move="1"
              aria-label={t('common.moveDown')}
              title={t('common.moveDown')}
              disabled={index === total - 1}
              onClick={() => onMove(index + 1)}
            >
              <ArrowDown aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t('common.duplicate')}
              title={t('common.duplicate')}
              onClick={onDuplicate}
            >
              <Copy aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t('common.delete')}
              title={t('common.delete')}
              onClick={onDelete}
            >
              <Trash2 aria-hidden />
            </Button>
          </div>
        </div>

        <CollapsibleContent>
          <CardContent className="space-y-5 border-t px-4 py-5">
            <div className="grid gap-4 md:grid-cols-3">
              <Field id={`${fieldId}-name`} label={t('rules.name')}>
                <Input
                  id={`${fieldId}-name`}
                  value={rule.name}
                  onChange={(e) => update('name', e.currentTarget.value)}
                  autoComplete="off"
                />
              </Field>

              <Field id={`${fieldId}-action`} label={t('rules.action')}>
                <Select value={rule.action} onValueChange={(v) => update('action', v)}>
                  <SelectTrigger id={`${fieldId}-action`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {actionOptions.map(([value, text]) => (
                      <SelectItem key={value} value={value}>
                        {text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {rule.action === 'challenge' ? (
                <Field
                  id={`${fieldId}-difficulty`}
                  label={t('rules.difficultyOverride')}
                  help={t('rules.difficultyHelp', { n: formatNumber(effectiveDifficulty) })}
                >
                  <NumberField
                    id={`${fieldId}-difficulty`}
                    value={rule.difficulty}
                    min={0}
                    max={8}
                    onChange={(n) => update('difficulty', n)}
                    aria-describedby={`${fieldId}-difficulty-help`}
                  />
                </Field>
              ) : (
                <Field id={`${fieldId}-difficulty`} label={t('protection.difficulty')}>
                  <p className="pt-2 text-sm text-muted-foreground">{t('rules.difficultyOnlyCheck')}</p>
                </Field>
              )}
            </div>

            <Field id={`${fieldId}-note`} label={t('rules.note')}>
              <Input
                id={`${fieldId}-note`}
                value={rule.note}
                placeholder={t('rules.notePlaceholder')}
                onChange={(e) => update('note', e.currentTarget.value)}
                autoComplete="off"
              />
            </Field>

            <Separator />

            <div className="space-y-1">
              <h3 className="text-sm font-semibold">{t('rules.conditions')}</h3>
              <p className="text-sm text-muted-foreground">{t('rules.conditionsHelp')}</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <TagField
                id={`${fieldId}-paths`}
                label={t('rules.paths')}
                help={t('rules.pathsHelp')}
                placeholder="/admin/*"
                value={rule.match.paths}
                onChange={(v) => update('match.paths', v)}
              />
              <TagField
                id={`${fieldId}-agents`}
                label={t('rules.agents')}
                help={t('rules.agentsHelp')}
                placeholder="*GPTBot*"
                value={rule.match.user_agents}
                onChange={(v) => update('match.user_agents', v)}
              />
              <TagField
                id={`${fieldId}-ips`}
                label={t('rules.ips')}
                help={t('rules.ipsHelp')}
                placeholder="203.0.113.7"
                value={rule.match.ips}
                onChange={(v) => update('match.ips', v)}
              />
              <TagField
                id={`${fieldId}-hosts`}
                label={t('rules.hosts')}
                help={t('rules.hostsHelp')}
                placeholder="example.com"
                value={rule.match.hosts}
                onChange={(v) => update('match.hosts', v)}
              />

              <div className="grid content-start gap-2">
                <Label id={`${fieldId}-methods-label`}>{t('rules.methods')}</Label>
                <div
                  role="group"
                  aria-labelledby={`${fieldId}-methods-label`}
                  aria-describedby={`${fieldId}-methods-help`}
                  className="flex flex-wrap gap-x-5 gap-y-2"
                >
                  {METHODS.map((method) => {
                    const checkId = `${fieldId}-m-${method}`
                    return (
                      <div key={method} className="flex items-center gap-2">
                        <Checkbox
                          id={checkId}
                          checked={rule.match.methods.includes(method)}
                          onCheckedChange={(v) => setMethod(method, v === true)}
                        />
                        <Label htmlFor={checkId} className="font-mono font-normal">
                          {method}
                        </Label>
                      </div>
                    )
                  })}
                </div>
                <p id={`${fieldId}-methods-help`} className="text-xs text-muted-foreground">
                  {t('rules.methodsHelp')}
                </p>
              </div>

              <div className="grid content-start gap-2">
                <Label>{t('rules.headers')}</Label>
                <div className="grid gap-2">
                  {rule.match.headers.map((hd, hi) => (
                    <div key={hi} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <Input
                        className="font-mono"
                        value={hd.name}
                        placeholder={t('rules.headerName')}
                        aria-label={t('rules.headerName')}
                        onChange={(e) => setHeader(hi, 'name', e.currentTarget.value)}
                      />
                      <Input
                        className="font-mono"
                        value={hd.pattern}
                        placeholder={t('rules.headerPatternPlaceholder')}
                        aria-label={t('rules.headerPattern')}
                        onChange={(e) => setHeader(hi, 'pattern', e.currentTarget.value)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t('rules.removeHeader')}
                        title={t('rules.removeHeader')}
                        onClick={() =>
                          setDraft((d) => {
                            const list = getAtPath<Rule['match']['headers']>(d, `${base}.match.headers`)
                            list.splice(hi, 1)
                          })
                        }
                      >
                        <X aria-hidden />
                      </Button>
                    </div>
                  ))}
                </div>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDraft((d) => {
                        getAtPath<Rule['match']['headers']>(d, `${base}.match.headers`).push({ name: '', pattern: '' })
                      })
                    }
                  >
                    <Plus aria-hidden />
                    {t('rules.addHeader')}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{t('rules.headersHelp')}</p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
