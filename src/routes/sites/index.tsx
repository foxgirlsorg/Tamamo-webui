import './i18n'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Plus } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { GLOBAL_SCOPE } from '@/lib/config'
import { useDraft } from '@/lib/draft-context'
import type { Counters } from '@/lib/types'

import { NginxDialog } from './nginx-dialog'
import { SiteCard } from './site-card'
import { SiteStatsGrid } from './stats'

/** Random temporary ID for a new site. The real ID is derived from the name on save. */
function newId(): string {
  const b = new Uint8Array(6)
  crypto.getRandomValues(b)
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}

/** Sites screen: the default site, then one collapsible card per site. */
export function SitesPage() {
  const { t } = useTranslation()
  const { draft, setDraft } = useDraft()
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(() => new Set())
  const [freshId, setFreshId] = useState<string | null>(null)

  // Counters are optional: the screen works without them. Polls while the tab is visible.
  const stats = useQuery({
    queryKey: ['stats', 'sites'],
    queryFn: () => api.getStats(),
    refetchInterval: 10_000,
  })

  const counterFor = (id: string): Counters | null | undefined => {
    if (!stats.data) return undefined
    return (stats.data.sites ?? []).find((x) => x.site === id)?.last24h ?? null
  }

  const sites = draft.sites

  // Inline checks as the legacy screen did. The server still validates on save.
  const nameCount = new Map<string, number>()
  for (const s of sites) {
    const key = s.name.trim().toLowerCase()
    if (key) nameCount.set(key, (nameCount.get(key) ?? 0) + 1)
  }
  const hostOwner = new Map<string, number>()
  sites.forEach((s, i) => {
    for (const h of s.hosts) {
      const key = h.trim().toLowerCase()
      if (!hostOwner.has(key)) hostOwner.set(key, i)
    }
  })
  const errorsFor = (i: number): { name?: string; hosts?: string } => {
    const s = sites[i]
    const e: { name?: string; hosts?: string } = {}
    const key = s.name.trim().toLowerCase()
    if (key && (nameCount.get(key) ?? 0) > 1) e.name = t('sites.errDuplicateName')
    if (s.hosts.length === 0) {
      e.hosts = t('sites.errNoHosts')
    } else {
      const taken = s.hosts.find((h) => hostOwner.get(h.trim().toLowerCase()) !== i)
      if (taken) e.hosts = t('sites.errHostTaken', { host: taken })
    }
    return e
  }

  const setOpen = (id: string, open: boolean) =>
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (open) next.add(id)
      else next.delete(id)
      return next
    })

  const addSite = () => {
    const id = newId()
    setDraft((d) => {
      d.sites.push({
        id,
        name: t('sites.newName', { n: d.sites.length + 1 }),
        hosts: [],
        target: '',
        own_protection: false,
        protection: structuredClone(d.protection),
        own_rules: false,
        rules: structuredClone(d.rules),
        own_page: false,
        page: structuredClone(d.page),
      })
    })
    setOpen(id, true)
    setFreshId(id)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.sites')}
        description={t('sites.desc')}
        actions={
          <Button onClick={addSite}>
            <Plus aria-hidden />
            {t('sites.add')}
          </Button>
        }
      />

      <DefaultSiteCard counters={counterFor('default')} />

      {sites.length ? (
        <div className="space-y-4">
          {sites.map((site, i) => {
            const errors = errorsFor(i)
            return (
              <SiteCard
                key={`${i}-${site.id}`}
                index={i}
                site={site}
                open={openIds.has(site.id)}
                onOpenChange={(open) => setOpen(site.id, open)}
                autoFocusName={site.id === freshId}
                nameError={errors.name}
                hostsError={errors.hosts}
                counters={counterFor(site.id)}
              />
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="font-medium">{t('sites.none')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('sites.noneDesc')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/** The default site: serves every host name no other site claims. Always on. */
function DefaultSiteCard({ counters }: { counters: Counters | null | undefined }) {
  const { t } = useTranslation()
  const { effective, setScope } = useDraft()
  const [nginxOpen, setNginxOpen] = useState(false)

  const linkClass = 'font-medium text-primary underline-offset-4 hover:underline'

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <CardTitle className="flex flex-wrap items-center gap-2">
            {t('common.defaultSite')}
            <Badge variant="outline">{t('sites.alwaysOn')}</Badge>
          </CardTitle>
          <CardDescription>{t('sites.defaultDesc')}</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="shrink-0" onClick={() => setNginxOpen(true)}>
          {t('sites.nginx')}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="text-muted-foreground">{t('sites.upstream')}</span>
          <code className="font-mono text-xs">{effective.server.target || t('common.notSet')}</code>
          <Link to="/server" className={linkClass}>
            {t('common.change')}
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="text-muted-foreground">{t('sites.settings')}</span>
          {(['protection', 'rules', 'page'] as const).map((section, i) => (
            <span key={section} className="flex items-center gap-2">
              {i > 0 ? <span className="text-muted-foreground">·</span> : null}
              <Link to={`/${section}`} onClick={() => setScope(GLOBAL_SCOPE)} className={linkClass}>
                {t(`nav.${section}`)}
              </Link>
            </span>
          ))}
        </div>

        <SiteStatsGrid counters={counters} />
      </CardContent>

      <NginxDialog site={null} open={nginxOpen} onOpenChange={setNginxOpen} />
    </Card>
  )
}
