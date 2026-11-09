import { useTranslation } from 'react-i18next'

import { formatNumber } from '@/lib/i18n'
import type { Counters } from '@/lib/types'

/**
 * The last-24-hours counters of one site. `undefined` means not loaded (or the
 * stats request failed), so nothing is shown; `null` means no traffic.
 */
export function SiteStatsGrid({ counters }: { counters: Counters | null | undefined }) {
  const { t } = useTranslation()
  if (counters === undefined) return null
  if (counters === null) return <p className="text-sm text-muted-foreground">{t('sites.noTraffic')}</p>

  const cells: Array<[string, number]> = [
    [t('stat.requests'), counters.requests],
    [t('stat.challenged'), counters.challenged],
    [t('stat.solved'), counters.solved],
    [t('stat.blocked'), counters.blocked],
  ]

  return (
    <dl role="group" aria-label={t('overview.day.title')} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cells.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="text-lg font-semibold tabular-nums">{formatNumber(value)}</dd>
        </div>
      ))}
    </dl>
  )
}
