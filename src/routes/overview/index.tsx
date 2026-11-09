import './i18n'

import { useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { AlertCircle, Ban, CircleCheck, Globe, Percent, ShieldCheck, ShieldOff, Timer, type LucideIcon } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDraft } from '@/lib/draft-context'
import { formatNumber } from '@/lib/i18n'
import type { Config, Named, SiteCounters, StatsSnapshot } from '@/lib/types'

import { TrafficCharts } from './charts'
import { ALL_SITES, DEFAULT_SITE, formatMs, formatPercent, ruleLabel, siteLabel, siteName, useStats } from './stats'
import { ResetStatsButton, StatsOffState } from './stats-controls'

/** Overview: 24-hour and 7-day traffic, top lists, per-site counters. */
export function OverviewPage() {
  const { t } = useTranslation()
  const { server } = useDraft()
  const config = server.config
  const sites = config.sites
  const [picked, setPicked] = useState(ALL_SITES)

  // A site that was deleted or renamed in another session falls back to all sites.
  const known = picked === ALL_SITES || picked === DEFAULT_SITE || sites.some((s) => s.id === picked)
  const scope = known ? picked : ALL_SITES
  const stats = useStats(scope === ALL_SITES ? '' : scope)
  const st = stats.data

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.overview')}
        description={t('overview.desc')}
        actions={
          <>
            {sites.length > 0 ? (
              <div className="flex items-center gap-2">
                <Label htmlFor="overview-site" className="shrink-0">
                  {t('overview.show')}
                </Label>
                <Select value={scope} onValueChange={setPicked}>
                  <SelectTrigger id="overview-site" className="min-w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_SITES}>{t('overview.allSites')}</SelectItem>
                    <SelectItem value={DEFAULT_SITE}>{t('common.defaultSite')}</SelectItem>
                    {sites.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {siteName(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <ResetStatsButton />
          </>
        }
      />

      <ProtectionStatus config={server.effective} />

      {stats.isError ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden />
          <AlertTitle>{t('overview.statsError')}</AlertTitle>
          <AlertDescription>{stats.error instanceof Error ? stats.error.message : null}</AlertDescription>
        </Alert>
      ) : null}

      {!st && !stats.isError ? <LoadingBody /> : null}

      {st && !st.enabled ? <StatsOffState description={t('statsOff.hint')} /> : null}

      {st && st.enabled ? (
        <Body st={st} config={config} listen={server.effective.server.listen} scoped={scope !== ALL_SITES} />
      ) : null}
    </div>
  )
}

function ProtectionStatus({ config }: { config: Config }) {
  const { t } = useTranslation()
  const target = config.server.target || t('common.notSet')
  const { protection } = config

  if (!protection.enabled) {
    return (
      <Alert className="border-amber-500/40">
        <ShieldOff aria-hidden />
        <AlertTitle>{t('overview.offTitle')}</AlertTitle>
        <AlertDescription>
          {t('overview.offDesc', { target })}{' '}
          <Link to="/protection" className="font-medium text-primary underline underline-offset-4">
            {t('overview.turnOn')}
          </Link>
        </AlertDescription>
      </Alert>
    )
  }

  const activeRules = config.rules.filter((r) => r.enabled).length
  const rules = t('overview.activeRules', { count: activeRules, n: formatNumber(activeRules) })
  const siteCount = config.sites.length
  const lead = siteCount
    ? t('overview.onDescSites', { count: siteCount, n: formatNumber(siteCount), target, rules })
    : t('overview.onDesc', { target, rules })

  return (
    <Alert className="border-chart-2/40">
      <ShieldCheck aria-hidden />
      <AlertTitle>{t('overview.onTitle')}</AlertTitle>
      <AlertDescription>{`${lead} ${t(`overview.fallback.${protection.default_action}`)}`}</AlertDescription>
    </Alert>
  )
}

function LoadingBody() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  )
}

function Body({
  st,
  config,
  listen,
  scoped,
}: {
  st: StatsSnapshot
  config: Config
  listen: string
  scoped: boolean
}) {
  const { t } = useTranslation()
  const last = st.last24h
  const rate = last.challenged ? Math.round((last.solved / last.challenged) * 100) : null
  const ruleName = (id: string) => ruleLabel(id, config)

  const siteRows: SiteCounters[] = [...(st.sites ?? [])].sort((a, b) => (b.last24h.requests || 0) - (a.last24h.requests || 0))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi
          title={t('overview.kpi.requests')}
          icon={Globe}
          value={formatNumber(last.requests || 0)}
          sub={t('overview.kpi.requestsSub')}
        />
        <Kpi
          title={t('overview.kpi.verified')}
          icon={CircleCheck}
          value={formatNumber(last.solved || 0)}
          sub={t('overview.kpi.verifiedSub')}
        />
        <Kpi
          title={t('overview.kpi.blocked')}
          icon={Ban}
          value={formatNumber(last.blocked || 0)}
          sub={t('overview.kpi.blockedSub')}
        />
        <Kpi
          title={t('overview.kpi.rate')}
          icon={Percent}
          value={rate == null ? '—' : formatPercent(rate)}
          sub={
            last.challenged
              ? t('overview.kpi.rateSub', { solved: formatNumber(last.solved || 0), total: formatNumber(last.challenged) })
              : t('overview.kpi.rateNone')
          }
        />
        <Kpi title={t('overview.kpi.time')} icon={Timer} value={formatMs(st.avg_solve_ms)} sub={t('overview.kpi.timeSub')} />
      </div>

      <TrafficCharts
        hours={st.hours ?? []}
        days={st.days ?? []}
        noTraffic={!last.requests}
        listen={listen}
      />

      {!scoped && siteRows.length > 0 && config.sites.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('nav.sites')}</CardTitle>
            <CardDescription>{t('overview.sitesDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('overview.col.site')}</TableHead>
                  <TableHead className="text-right">{t('stat.requests')}</TableHead>
                  <TableHead className="text-right">{t('stat.challenged')}</TableHead>
                  <TableHead className="text-right">{t('stat.solved')}</TableHead>
                  <TableHead className="text-right">{t('stat.blocked')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {siteRows.map((row) => (
                  <TableRow key={row.site}>
                    <TableCell>{siteLabel(row.site, config)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(row.last24h.requests || 0)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(row.last24h.challenged || 0)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(row.last24h.solved || 0)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(row.last24h.blocked || 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <TopTable
          title={t('overview.topRules')}
          description={t('overview.topRulesDesc')}
          rows={(st.top_rules ?? []).map((r) => ({ ...r, name: ruleName(r.name) }))}
          emptyText={t('overview.topRulesEmpty')}
          nameLabel={t('overview.col.rule')}
        />
        <TopTable
          title={t('overview.topAgents')}
          description={t('overview.topAgentsDesc')}
          rows={st.top_user_agents ?? []}
          emptyText={t('overview.topAgentsEmpty')}
          nameLabel={t('overview.col.agent')}
        />
        <TopTable
          title={t('overview.topPaths')}
          description={t('overview.topPathsDesc')}
          rows={st.top_paths ?? []}
          emptyText={t('overview.topPathsEmpty')}
          nameLabel={t('overview.col.path')}
        />
      </div>
    </div>
  )
}

function Kpi({ title, icon: Icon, value, sub }: { title: string; icon: LucideIcon; value: string; sub: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  )
}

function TopTable({
  title,
  description,
  rows,
  emptyText,
  nameLabel,
}: {
  title: string
  description: string
  rows: Named[]
  emptyText: string
  nameLabel: string
}) {
  const { t } = useTranslation()
  const shown = rows.slice(0, 8)
  const max = Math.max(1, ...shown.map((r) => r.count))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {shown.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{nameLabel}</TableHead>
                <TableHead className="text-right">{t('overview.count')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((r, i) => (
                <TableRow key={`${r.name}-${i}`}>
                  <TableCell className="relative max-w-0 truncate" title={r.name}>
                    <div
                      aria-hidden
                      className="absolute inset-y-1 left-0 rounded-sm bg-primary/15"
                      style={{ width: `${(r.count / max) * 100}%` }}
                    />
                    <span className="relative">{r.name || t('overview.emptyName')}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(r.count)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
