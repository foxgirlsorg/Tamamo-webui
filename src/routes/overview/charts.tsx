// Traffic charts for Overview: last 24 hours (per hour) and last 7 days (per day).
// Stacked bars: let through, challenged, blocked (legacy SERIES).

import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber } from '@/lib/i18n'
import type { HourBucket } from '@/lib/types'
import { bucketDate, formatCompact } from './stats'

interface Point {
  /** Short axis label. */
  label: string
  /** Full title shown in the tooltip. */
  title: string
  pass: number
  challenge: number
  block: number
}

function toPoints(
  buckets: HourBucket[],
  labelOf: (d: Date) => string,
  titleOf: (d: Date) => string,
): Point[] {
  return buckets.map((b) => {
    const d = bucketDate(b.t)
    return {
      label: labelOf(d),
      title: titleOf(d),
      pass: (b.passed || 0) + (b.allowed || 0),
      challenge: b.challenged || 0,
      block: b.blocked || 0,
    }
  })
}

function TrafficBars({
  data,
  height,
  interval,
  showAxis,
}: {
  data: Point[]
  height: number
  interval?: number
  showAxis: boolean
}) {
  const { t } = useTranslation()
  const config: ChartConfig = {
    pass: { label: t('chart.pass'), color: 'var(--chart-2)' },
    challenge: { label: t('chart.challenge'), color: 'var(--chart-1)' },
    block: { label: t('chart.block'), color: 'var(--chart-5)' },
  }

  return (
    <ChartContainer config={config} className="w-full" style={{ height }}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval={interval} minTickGap={8} />
        <YAxis
          hide={!showAxis}
          width={44}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          tickFormatter={(v: number) => formatCompact(v)}
        />
        <ChartTooltip
          cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
          content={
            <ChartTooltipContent
              labelFormatter={(_label, payload) => (payload?.[0]?.payload as Point | undefined)?.title ?? ''}
            />
          }
        />
        <Bar dataKey="pass" stackId="traffic" fill="var(--color-pass)" />
        <Bar dataKey="challenge" stackId="traffic" fill="var(--color-challenge)" />
        <Bar dataKey="block" stackId="traffic" fill="var(--color-block)" radius={[3, 3, 0, 0]} />
        <ChartLegend content={<ChartLegendContent />} />
      </BarChart>
    </ChartContainer>
  )
}

function EmptyTraffic({ listen }: { listen: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <img src="/assets/mascot/checking.png" alt="" width={72} height={72} />
      <p className="font-medium">{t('overview.noTraffic')}</p>
      <p className="max-w-prose text-sm text-muted-foreground">{t('overview.noTrafficDesc', { listen })}</p>
    </div>
  )
}

/** The 24-hour and 7-day charts. `noTraffic` shows the empty state in the 24-hour card. */
export function TrafficCharts({
  hours,
  days,
  noTraffic,
  listen,
}: {
  hours: HourBucket[]
  days: HourBucket[]
  noTraffic: boolean
  listen: string
}) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const weekTotal = days.reduce((sum, d) => sum + (d.requests || 0), 0)

  const dayPoints = toPoints(
    hours,
    (d) => d.toLocaleTimeString(lang, { hour: '2-digit' }),
    (d) => `${d.toLocaleDateString(lang, { weekday: 'short' })} ${d.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}`,
  )
  const weekPoints = toPoints(
    days,
    (d) => d.toLocaleDateString(lang, { weekday: 'short' }),
    (d) => d.toLocaleDateString(lang, { weekday: 'long', month: 'short', day: 'numeric' }),
  )

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>{t('overview.day.title')}</CardTitle>
          <CardDescription>{t('overview.day.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {noTraffic ? (
            <EmptyTraffic listen={listen} />
          ) : (
            <div role="img" aria-label={t('overview.day.chart')}>
              <TrafficBars data={dayPoints} height={240} interval={2} showAxis />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('overview.week.title')}</CardTitle>
          <CardDescription>
            {weekTotal
              ? t('overview.week.total', { count: weekTotal, n: formatNumber(weekTotal) })
              : t('overview.week.none')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div role="img" aria-label={t('overview.week.chart')}>
            <TrafficBars data={weekPoints} height={200} showAxis={false} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
