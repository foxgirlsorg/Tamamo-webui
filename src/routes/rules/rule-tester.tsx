import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AlertTriangle, ChevronRight, FlaskConical, Globe, Plus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Field } from '@/components/fields'
import { api } from '@/lib/api'
import { useDraft } from '@/lib/draft-context'
import { formatNumber } from '@/lib/i18n'
import type { TestResult } from '@/lib/types'

import { ACTIONS, METHODS } from './helpers'
import { ActionBadge, rich } from './rich'

/** Example user agents for the tester (brand names, not translated). */
const UA_SAMPLES: [string, string][] = [
  ['Chrome', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'],
  ['curl', 'curl/8.10.1'],
  ['GPTBot', 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)'],
  ['Googlebot', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'],
]

interface TesterForm {
  method: string
  host: string
  path: string
  user_agent: string
  ip: string
}

interface HeaderRow {
  name: string
  value: string
}

/**
 * Describe a request and see which saved rule catches it (POST /api/test).
 * Uses the saved rules, so it warns when the draft has unsaved changes.
 */
export function RuleTester() {
  const { t } = useTranslation()
  const { dirty } = useDraft()
  const [form, setForm] = useState<TesterForm>({ method: 'GET', host: '', path: '/', user_agent: '', ip: '' })
  const [headers, setHeaders] = useState<HeaderRow[]>([])

  const mutation = useMutation({
    mutationFn: (body: TesterForm & { headers: Record<string, string> }) => api.testRule(body),
  })

  const set = <K extends keyof TesterForm>(key: K, value: TesterForm[K]) => setForm((f) => ({ ...f, [key]: value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const hdrs: Record<string, string> = {}
    for (const h of headers) if (h.name.trim()) hdrs[h.name.trim()] = h.value
    mutation.mutate({ ...form, headers: hdrs })
  }

  const result: TestResult | undefined = mutation.data

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('tester.title')}</CardTitle>
        <CardDescription>{t('tester.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={submit} className="space-y-4">
          {dirty ? (
            <Alert>
              <AlertTriangle aria-hidden />
              <AlertTitle>{t('tester.savedOnly')}</AlertTitle>
              <AlertDescription>{t('tester.savedOnlyDesc')}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
            <Field id="tester-method" label={t('tester.method')}>
              <Select value={form.method} onValueChange={(v) => set('method', v)}>
                <SelectTrigger id="tester-method" className="w-full font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m} value={m} className="font-mono">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="tester-path" label={t('tester.path')} help={rich(t('tester.pathNote'))}>
              <Input
                id="tester-path"
                className="font-mono"
                value={form.path}
                placeholder="/"
                aria-describedby="tester-path-help"
                spellCheck={false}
                autoComplete="off"
                onChange={(e) => set('path', e.currentTarget.value)}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="tester-host" label={t('tester.host')}>
              <Input
                id="tester-host"
                className="font-mono"
                value={form.host}
                placeholder="example.com"
                spellCheck={false}
                autoComplete="off"
                onChange={(e) => set('host', e.currentTarget.value)}
              />
            </Field>
            <Field id="tester-ip" label={t('tester.ip')}>
              <Input
                id="tester-ip"
                className="font-mono"
                value={form.ip}
                placeholder="203.0.113.7"
                spellCheck={false}
                autoComplete="off"
                onChange={(e) => set('ip', e.currentTarget.value)}
              />
            </Field>
          </div>

          <div className="grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="tester-agent">{t('tester.agent')}</Label>
              <div className="flex flex-wrap gap-1.5">
                {UA_SAMPLES.map(([name, value]) => (
                  <Button key={name} type="button" variant="secondary" size="sm" onClick={() => set('user_agent', value)}>
                    {name}
                  </Button>
                ))}
              </div>
            </div>
            <Input
              id="tester-agent"
              className="font-mono"
              value={form.user_agent}
              placeholder="Mozilla/5.0 …"
              spellCheck={false}
              autoComplete="off"
              onChange={(e) => set('user_agent', e.currentTarget.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>{t('tester.headers')}</Label>
            <p className="text-xs text-muted-foreground">{t('tester.headersHelp')}</p>
            {headers.map((h, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <Input
                  className="font-mono"
                  value={h.name}
                  placeholder={t('rules.headerName')}
                  aria-label={t('rules.headerName')}
                  onChange={(e) => {
                    const v = e.currentTarget.value
                    setHeaders((rows) => rows.map((r, j) => (j === i ? { ...r, name: v } : r)))
                  }}
                />
                <Input
                  className="font-mono"
                  value={h.value}
                  placeholder={t('tester.headerValue')}
                  aria-label={t('tester.headerValue')}
                  onChange={(e) => {
                    const v = e.currentTarget.value
                    setHeaders((rows) => rows.map((r, j) => (j === i ? { ...r, value: v } : r)))
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t('tester.removeHeader')}
                  title={t('tester.removeHeader')}
                  onClick={() => setHeaders((rows) => rows.filter((_, j) => j !== i))}
                >
                  <X aria-hidden />
                </Button>
              </div>
            ))}
            <div>
              <Button type="button" variant="outline" size="sm" onClick={() => setHeaders((rows) => [...rows, { name: '', value: '' }])}>
                <Plus aria-hidden />
                {t('rules.addHeader')}
              </Button>
            </div>
          </div>

          <div>
            <Button type="submit" disabled={mutation.isPending}>
              <FlaskConical aria-hidden />
              {t('tester.run')}
            </Button>
          </div>
        </form>

        <div aria-live="polite" className="space-y-3">
          {mutation.isError ? (
            <Alert variant="destructive">
              <AlertTriangle aria-hidden />
              <AlertTitle>{t('tester.error')}</AlertTitle>
              <AlertDescription>
                {mutation.error instanceof Error ? mutation.error.message : null}
              </AlertDescription>
            </Alert>
          ) : null}
          {result && !mutation.isError ? <TestResultView result={result} /> : null}
        </div>
      </CardContent>
    </Card>
  )
}

function TestResultView({ result: r }: { result: TestResult }) {
  const { t } = useTranslation()
  const known = (ACTIONS as readonly string[]).includes(r.action)
  const verdict = known
    ? t(`tester.verdict.${r.action}`, { n: formatNumber(r.difficulty || 0) })
    : t('tester.verdictOther', { action: r.action })

  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {r.site ? (
          <Badge variant="outline" className="gap-1">
            <Globe aria-hidden className="size-3" />
            {r.site.name}
          </Badge>
        ) : null}
        {r.rule ? (
          <>
            <span className="text-muted-foreground">{t('tester.matched')}</span>
            <span className="font-medium">{t('common.quoted', { text: r.rule.name || r.rule.id })}</span>
          </>
        ) : (
          <span className="text-muted-foreground">{t('tester.noMatch')}</span>
        )}
        <ChevronRight aria-hidden className="size-4 text-muted-foreground" />
        <ActionBadge action={r.action} label={t(`action.${r.action}`, { defaultValue: r.action })} />
      </div>
      <p className="text-sm">
        {verdict} <span className="text-muted-foreground">{r.reason}</span>
      </p>
    </div>
  )
}
