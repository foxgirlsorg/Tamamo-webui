import '@/routes/activity/i18n'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, Search } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useDraft } from '@/lib/draft-context'
import { formatDateTime, formatNumber } from '@/lib/i18n'
import type { Config, StatsSnapshot } from '@/lib/types'
import { StatsOffState, ResetStatsButton } from '@/routes/overview/stats-controls'
import {
  ALL_SITES,
  KIND_BADGE,
  formatMs,
  relativeTime,
  ruleLabel,
  siteLabel,
  siteName,
  useStats,
} from '@/routes/overview/stats'

const KINDS = ['challenge', 'solve', 'fail', 'block'] as const

/** Activity: recent checks, solves, failures and blocks, with filters. */
export function ActivityPage() {
  const { t } = useTranslation()
  const { server } = useDraft()
  const config = server.config
  const [kind, setKind] = useState<string>('all')
  const [site, setSite] = useState<string>(ALL_SITES)
  const [query, setQuery] = useState('')
  const stats = useStats('')
  const st = stats.data

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.activity')}
        description={t('activity.desc')}
        actions={<ResetStatsButton />}
      />

      {stats.isError ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden />
          <AlertTitle>{t('activity.loadError')}</AlertTitle>
          <AlertDescription>{stats.error instanceof Error ? stats.error.message : null}</AlertDescription>
        </Alert>
      ) : null}

      {!st && !stats.isError ? <Skeleton className="h-72" /> : null}

      {st && !st.enabled ? <StatsOffState description={t('statsOff.activityHint')} /> : null}

      {st && st.enabled ? (
        <EventsCard st={st} config={config} kind={kind} setKind={setKind} site={site} setSite={setSite} query={query} setQuery={setQuery} />
      ) : null}
    </div>
  )
}

interface EventsCardProps {
  st: StatsSnapshot
  config: Config
  kind: string
  setKind: (kind: string) => void
  site: string
  setSite: (site: string) => void
  query: string
  setQuery: (query: string) => void
}

function EventsCard({ st, config, kind, setKind, site, setSite, query, setQuery }: EventsCardProps) {
  const { t } = useTranslation()
  const all = st.events ?? []
  const q = query.trim().toLowerCase()

  const events = all.filter(
    (e) =>
      (kind === 'all' || e.kind === kind) &&
      (site === ALL_SITES || e.site === site) &&
      (!q ||
        [e.ip, e.host, e.path, e.ua, e.rule, ruleLabel(e.rule, config), siteLabel(e.site, config)].some(
          (v) => v && String(v).toLowerCase().includes(q),
        )),
  )

  // Sites offered in the filter: configured sites, plus any site that has events.
  const siteIds = Array.from(new Set(all.map((e) => e.site).filter(Boolean)))

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex flex-wrap items-center gap-3 border-b p-4">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          aria-label={t('activity.filter')}
          value={kind}
          onValueChange={(v) => {
            if (v) setKind(v)
          }}
          className="flex-wrap"
        >
          <ToggleGroupItem value="all">{t('activity.all')}</ToggleGroupItem>
          {KINDS.map((k) => (
            <ToggleGroupItem key={k} value={k}>
              {t(`kind.${k}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Select value={site} onValueChange={setSite}>
          <SelectTrigger className="w-auto min-w-44" aria-label={t('activity.siteFilterLabel')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SITES}>{t('overview.allSites')}</SelectItem>
            {config.sites.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {siteName(s)}
              </SelectItem>
            ))}
            {siteIds
              .filter((id) => !config.sites.some((s) => s.id === id))
              .map((id) => (
                <SelectItem key={id} value={id}>
                  {siteLabel(id, config)}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <div className="relative min-w-48 grow sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            className="pl-8"
            placeholder={t('activity.search')}
            aria-label={t('activity.searchLabel')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <span className="ml-auto text-sm text-muted-foreground" aria-live="polite">
          {t('activity.count', { count: all.length, n: formatNumber(all.length), shown: formatNumber(events.length) })}
        </span>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <img src="/assets/mascot/checking.png" alt="" width={72} height={72} />
          <p className="font-medium">{all.length ? t('activity.noMatch') : t('activity.none')}</p>
          <p className="max-w-prose text-sm text-muted-foreground">
            {all.length ? t('activity.noMatchDesc') : t('activity.noneDesc')}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('activity.col.when')}</TableHead>
                <TableHead>{t('activity.col.kind')}</TableHead>
                <TableHead>{t('activity.col.site')}</TableHead>
                <TableHead>{t('activity.col.ip')}</TableHead>
                <TableHead>{t('activity.col.host')}</TableHead>
                <TableHead>{t('activity.col.path')}</TableHead>
                <TableHead>{t('activity.col.agent')}</TableHead>
                <TableHead>{t('activity.col.rule')}</TableHead>
                <TableHead className="text-right">{t('activity.col.solve')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e, i) => {
                const badge = KIND_BADGE[e.kind]
                return (
                  <TableRow key={`${e.time}-${i}`}>
                    <TableCell className="whitespace-nowrap">
                      <time dateTime={e.time} title={formatDateTime(e.time)}>
                        {relativeTime(e.time)}
                      </time>
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge?.variant ?? 'secondary'} className={badge?.className}>
                        {badge ? t(`kind.${e.kind}`) : e.kind}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-36 truncate" title={siteLabel(e.site, config)}>
                      {siteLabel(e.site, config)}
                    </TableCell>
                    <TableCell className="font-mono text-xs whitespace-nowrap">{e.ip || '—'}</TableCell>
                    <TableCell className="max-w-40 truncate" title={e.host}>
                      {e.host || '—'}
                    </TableCell>
                    <TableCell className="max-w-56 truncate font-mono text-xs" title={e.path}>
                      {e.path || '—'}
                    </TableCell>
                    <TableCell className="max-w-64 truncate text-xs" title={e.ua}>
                      {e.ua || '—'}
                    </TableCell>
                    <TableCell className="max-w-40 truncate" title={e.rule}>
                      {e.rule ? ruleLabel(e.rule, config) : <span className="text-muted-foreground">{t('activity.defaultRule')}</span>}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {e.solve_ms ? formatMs(e.solve_ms) : '—'}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  )
}
