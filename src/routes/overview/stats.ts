// Stats data and formatting for the Overview and Activity screens. No JSX here.

import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import i18n, { currentLanguage } from '@/lib/i18n'
import type { Config, Site, StatsSnapshot } from '@/lib/types'

export const STATS_QUERY_KEY = ['stats'] as const
/** Select value for "every site". */
export const ALL_SITES = '__all__'
/** Site ID of the global (default) site in stats. */
export const DEFAULT_SITE = 'default'
const REFRESH_MS = 10_000

/** Stats for one site ID, or all sites when `site` is ''. Refreshes every 10 s while the tab is visible. */
export function useStats(site: string) {
  return useQuery<StatsSnapshot>({
    queryKey: [...STATS_QUERY_KEY, site],
    queryFn: () => api.getStats(site || undefined),
    refetchInterval: REFRESH_MS,
  })
}

/** Name of a site in stats. The default site has no entry in the config. */
export function siteLabel(siteId: string, config: Config): string {
  if (!siteId || siteId === DEFAULT_SITE) return i18n.t('common.defaultSite')
  const site = config.sites.find((s) => s.id === siteId)
  return site ? site.name || siteId : siteId
}

/** Display name of a configured site. */
export function siteName(site: Site): string {
  return site.name || i18n.t('sites.unnamed')
}

/** Rule name for a rule ID, looked up in the global and per-site rules. */
export function ruleLabel(id: string, config: Config): string {
  if (!id) return ''
  const all = [...config.rules, ...config.sites.flatMap((s) => s.rules ?? [])]
  const rule = all.find((r) => r.id === id)
  return rule ? rule.name || id : id
}

export function formatCompact(value: number): string {
  try {
    return new Intl.NumberFormat(currentLanguage(), { notation: 'compact', maximumFractionDigits: 1 }).format(value)
  } catch {
    return String(value)
  }
}

export function formatPercent(value: number): string {
  try {
    return new Intl.NumberFormat(currentLanguage(), { style: 'percent', maximumFractionDigits: 0 }).format(value / 100)
  } catch {
    return `${value}%`
  }
}

function formatUnit(value: number, unit: 'millisecond' | 'second', digits = 0): string {
  try {
    return new Intl.NumberFormat(currentLanguage(), {
      style: 'unit',
      unit,
      unitDisplay: 'short',
      maximumFractionDigits: digits,
    }).format(value)
  } catch {
    return `${value.toFixed(digits)} ${unit}`
  }
}

/** Milliseconds as a short duration, or an em dash when there is none. */
export function formatMs(ms: number): string {
  if (!ms) return '—'
  if (ms < 1000) return formatUnit(Math.round(ms), 'millisecond')
  return formatUnit(ms / 1000, 'second', ms < 10000 ? 2 : 1)
}

/** Relative time ("3 minutes ago"), or "just now" within 45 seconds. */
export function relativeTime(value: string): string {
  const diffSeconds = (new Date(value).getTime() - Date.now()) / 1000
  if (Math.abs(diffSeconds) < 45) return i18n.t('time.justNow')
  const rtf = new Intl.RelativeTimeFormat(currentLanguage(), { numeric: 'auto' })
  const abs = Math.abs(diffSeconds)
  if (abs < 3600) return rtf.format(Math.round(diffSeconds / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diffSeconds / 3600), 'hour')
  return rtf.format(Math.round(diffSeconds / 86400), 'day')
}

/** Unix seconds (or milliseconds) as a Date. */
export function bucketDate(value: number): Date {
  return new Date(value > 1e12 ? value : value * 1000)
}

export function formatDateTime(value: string | number | Date): string {
  return new Date(value).toLocaleString(currentLanguage())
}

/** Event kinds with their badge style. */
export const KIND_BADGE: Record<string, { variant: 'default' | 'secondary' | 'destructive'; className?: string }> = {
  challenge: { variant: 'default' },
  solve: { variant: 'secondary', className: 'bg-chart-2 text-background' },
  fail: { variant: 'secondary', className: 'bg-chart-3 text-background' },
  block: { variant: 'destructive' },
}
