import { useTranslation } from 'react-i18next'
import { TriangleAlert } from 'lucide-react'

import { Field, NumberField } from '@/components/fields'
import { ListTextarea } from '@/components/list-textarea'
import { PageHeader } from '@/components/page-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useDraft } from '@/lib/draft-context'
import type { ServerConfig } from '@/lib/types'

const IP_SOURCES: ServerConfig['ip_source'][] = ['remote', 'x-forwarded-for', 'x-real-ip', 'cf-connecting-ip']

/** Host name check for the admin domains list, with `*.example.com` wildcards (legacy hostAllowed). */
function hostAllowed(host: string, domains: string[]): boolean {
  const hn = host.toLowerCase().replace(/\.$/, '')
  return domains.some((d) => {
    const x = String(d).toLowerCase().trim().replace(/:\d+$/, '').replace(/\.$/, '')
    if (x.startsWith('*.')) return hn.endsWith(x.slice(1))
    return x === hn
  })
}

function SwitchRow({
  id,
  label,
  desc,
  checked,
  onCheckedChange,
  disabled,
}: {
  id: string
  label: string
  desc: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0 space-y-1">
        <Label htmlFor={id}>{label}</Label>
        <p id={`${id}-desc`} className="text-xs text-muted-foreground">
          {desc}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-describedby={`${id}-desc`}
      />
    </div>
  )
}

/** Listen addresses, upstream, client IP source, admin API domains and statistics (legacy viewServer). */
export function ServerPage() {
  const { t } = useTranslation()
  const { draft, setDraft, locked, effective } = useDraft()
  const srv = draft.server
  const ipSource = srv.ip_source
  const trusted = srv.trusted_proxies

  // Settings fixed by environment variables show the running value, read-only.
  const lockedTarget = locked['server.target']
  const lockedListen = locked['server.listen']
  const lockedAdminListen = locked['admin.listen']
  const lockedIpSource = locked['server.ip_source']
  const lockedDomains = locked['admin.domains']
  const lockedAdminProxies = locked['admin.trusted_proxies']
  const domains = lockedDomains ? effective.admin.domains : draft.admin.domains

  const host = typeof window === 'undefined' ? '' : window.location.hostname
  const showLockout = !lockedDomains && domains.length > 0 && !!host && !hostAllowed(host, domains)

  return (
    <div className="space-y-6">
      <PageHeader title={t('nav.server')} description={t('server.desc')} />

      <Card>
        <CardHeader>
          <CardTitle>{t('server.upstream')}</CardTitle>
          <CardDescription>{t('server.upstreamDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field
            id="server-target"
            label={t('sites.upstreamUrl')}
            help={t('server.targetHelp')}
            lockedBy={lockedTarget}
          >
            <Input
              id="server-target"
              className="font-mono"
              placeholder="http://localhost:3000"
              value={lockedTarget ? effective.server.target : srv.target}
              readOnly={!!lockedTarget}
              autoComplete="off"
              spellCheck={false}
              aria-describedby="server-target-help"
              onChange={(e) => setDraft((d) => {
                d.server.target = e.target.value
              })}
            />
          </Field>
          <Field id="server-auth-endpoints" label={t('server.authEndpoints')} help={t('server.authEndpointsHelp')}>
            <Select
              value={srv.auth_endpoints || 'auto'}
              onValueChange={(v) => setDraft((d) => {
                d.server.auth_endpoints = v as ServerConfig['auth_endpoints']
              })}
            >
              <SelectTrigger id="server-auth-endpoints" className="w-full sm:w-80" aria-describedby="server-auth-endpoints-help">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">{t('server.authEndpointsAuto')}</SelectItem>
                <SelectItem value="on">{t('server.authEndpointsOn')}</SelectItem>
                <SelectItem value="off">{t('server.authEndpointsOff')}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="divide-y">
            <SwitchRow
              id="server-preserve-host"
              label={t('server.preserveHost')}
              desc={t('server.preserveHostDesc')}
              checked={srv.preserve_host}
              onCheckedChange={(v) => setDraft((d) => {
                d.server.preserve_host = v
              })}
            />
            <SwitchRow
              id="server-skip-verify"
              label={t('server.skipVerify')}
              desc={t('server.skipVerifyDesc')}
              checked={srv.insecure_skip_verify}
              onCheckedChange={(v) => setDraft((d) => {
                d.server.insecure_skip_verify = v
              })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('server.ip')}</CardTitle>
          <CardDescription>{t('server.ipDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field
            id="server-ip-source"
            label={t('server.ipSourceLabel')}
            help={t(`server.ipSourceHelp.${ipSource}`)}
            lockedBy={lockedIpSource}
          >
            <Select
              value={lockedIpSource ? effective.server.ip_source : ipSource}
              disabled={!!lockedIpSource}
              onValueChange={(v) => setDraft((d) => {
                d.server.ip_source = v as ServerConfig['ip_source']
              })}
            >
              <SelectTrigger id="server-ip-source" className="w-full max-w-md" aria-describedby="server-ip-source-help">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IP_SOURCES.map((v) => (
                  <SelectItem key={v} value={v}>
                    {t(`server.ipSource.${v}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {ipSource !== 'remote' ? (
            <Alert>
              <TriangleAlert aria-hidden />
              <AlertTitle>{trusted.length ? t('server.proxiesTrusted') : t('server.proxiesNeeded')}</AlertTitle>
              <AlertDescription>{t('server.proxiesWarn')}</AlertDescription>
            </Alert>
          ) : null}

          <ListTextarea
            id="server-trusted-proxies"
            label={t('server.proxies')}
            help={t('server.proxiesHelp')}
            placeholder={'10.0.0.0/8\n172.16.0.0/12\n127.0.0.1'}
            list={trusted}
            onChange={(list) => setDraft((d) => {
              d.server.trusted_proxies = list
            })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('server.listen')}</CardTitle>
          <CardDescription>{t('server.listenDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <Field
            id="server-listen"
            label={t('server.listenProxy')}
            help={t('server.listenProxyHelp')}
            lockedBy={lockedListen}
          >
            <Input
              id="server-listen"
              className="font-mono"
              placeholder=":8923"
              value={lockedListen ? effective.server.listen : srv.listen}
              readOnly={!!lockedListen}
              autoComplete="off"
              spellCheck={false}
              aria-describedby="server-listen-help"
              onChange={(e) => setDraft((d) => {
                d.server.listen = e.target.value
              })}
            />
          </Field>
          <Field
            id="admin-listen"
            label={t('server.listenAdmin')}
            help={t('server.listenAdminHelp')}
            lockedBy={lockedAdminListen}
          >
            <Input
              id="admin-listen"
              className="font-mono"
              placeholder=":8081"
              value={lockedAdminListen ? effective.admin.listen : draft.admin.listen}
              readOnly={!!lockedAdminListen}
              autoComplete="off"
              spellCheck={false}
              aria-describedby="admin-listen-help"
              onChange={(e) => setDraft((d) => {
                d.admin.listen = e.target.value
              })}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('server.domains.title')}</CardTitle>
          <CardDescription>{t('server.domains.desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <ListTextarea
            id="admin-domains"
            label={t('server.domains.label')}
            help={t('server.domains.help')}
            placeholder="admin.example.com"
            rows={3}
            list={domains}
            envName={lockedDomains}
            onChange={(list) => setDraft((d) => {
              d.admin.domains = list
            })}
          />
          <ListTextarea
            id="admin-trusted-proxies"
            label={t('server.adminProxies')}
            help={t('server.adminProxiesHelp')}
            placeholder="private"
            rows={2}
            list={lockedAdminProxies ? effective.admin.trusted_proxies ?? [] : draft.admin.trusted_proxies ?? []}
            envName={lockedAdminProxies}
            onChange={(list) => setDraft((d) => {
              d.admin.trusted_proxies = list
            })}
          />
          {showLockout ? (
            <Alert variant="destructive" role="alert">
              <TriangleAlert aria-hidden />
              <AlertTitle>{t('server.domains.lockoutTitle')}</AlertTitle>
              <AlertDescription>{t('server.domains.lockoutDesc', { host })}</AlertDescription>
            </Alert>
          ) : null}
          <Alert>
            <TriangleAlert aria-hidden />
            <AlertTitle>{t('server.domains.warnTitle')}</AlertTitle>
            <AlertDescription>
              {t('server.domains.warnDesc', { file: 'data/tamamo.yaml', env: 'TAMAMO_ADMIN_DOMAIN' })}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('server.stats')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="divide-y">
            <SwitchRow
              id="stats-enabled"
              label={t('server.statsEnabled')}
              desc={t('server.statsEnabledDesc')}
              checked={draft.stats.enabled}
              onCheckedChange={(v) => setDraft((d) => {
                d.stats.enabled = v
              })}
            />
            <SwitchRow
              id="stats-store-ips"
              label={t('server.storeIps')}
              desc={t('server.storeIpsDesc')}
              checked={draft.stats.store_ips}
              onCheckedChange={(v) => setDraft((d) => {
                d.stats.store_ips = v
              })}
            />
          </div>
          <Field id="stats-recent-events" label={t('server.recentEvents')}>
            <NumberField
              id="stats-recent-events"
              value={draft.stats.recent_events}
              onChange={(v) => setDraft((d) => {
                d.stats.recent_events = v
              })}
              min={10}
              max={2000}
              suffix={t('unit.events')}
            />
          </Field>
        </CardContent>
      </Card>
    </div>
  )
}
