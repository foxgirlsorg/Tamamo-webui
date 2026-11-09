import { useId, useState } from 'react'
import { Copy, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { siteDisplayName } from '@/lib/config'
import { useDraft } from '@/lib/draft-context'
import type { Site } from '@/lib/types'

import { DEFAULT_SITE_PORT, nginxAuthConfig, nginxProxyConfig, tamamoAddress } from './nginx-config'
import { Rich } from './rich'

type Mode = 'auth' | 'proxy'

const DEFAULT_APP_URL = 'http://127.0.0.1:3000'

/** Copies text; falls back to a hidden textarea where the Clipboard API is blocked. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fall through to the textarea method.
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  ta.style.top = '0'
  ta.style.left = '0'
  document.body.append(ta)
  ta.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  ta.remove()
  return ok
}

interface NginxDialogProps {
  /** The site the snippet is for, or null for the default site. */
  site: Site | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** "Use with nginx": a config snippet for the site, in auth_request or reverse proxy mode. */
export function NginxDialog({ site, open, onOpenChange }: NginxDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {site
              ? t('nginx.title', { name: siteDisplayName(site, t('sites.unnamed')) })
              : t('nginx.titleDefault')}
          </DialogTitle>
          <DialogDescription>{t('nginx.desc')}</DialogDescription>
        </DialogHeader>
        <NginxBody site={site} />
      </DialogContent>
    </Dialog>
  )
}

// Rendered only while the dialog is open, so its state starts fresh each time.
function NginxBody({ site }: { site: Site | null }) {
  const { t } = useTranslation()
  const { draft, effective, setDraft } = useDraft()
  const addressId = useId()
  const appId = useId()

  const [mode, setMode] = useState<Mode>('auth')
  const [address, setAddress] = useState(() => tamamoAddress(effective.server.listen))
  const [app, setApp] = useState(DEFAULT_APP_URL)

  const hosts = site ? site.hosts : []
  const serverName = hosts.length
    ? hosts.map((x) => (x.startsWith('re:') ? `~${x.slice(3)}` : x)).join(' ')
    : '_'
  const tamamo = address.trim().replace(/\/+$/, '') || `http://127.0.0.1:${DEFAULT_SITE_PORT}`
  const appUrl = app.trim().replace(/\/+$/, '') || DEFAULT_APP_URL
  const conf = mode === 'auth' ? nginxAuthConfig(serverName, tamamo, appUrl) : nginxProxyConfig(serverName, tamamo)

  const upstream = (site && site.target) || draft.server.target
  const explain =
    mode === 'auth'
      ? t('nginx.explainAuth')
      : t('nginx.explainProxy', { upstream: `\`${upstream || t('nginx.noUpstream')}\`` })

  const ipOk = draft.server.ip_source === 'x-real-ip' && draft.server.trusted_proxies.length > 0

  const fixIp = () => {
    setDraft((d) => {
      d.server.ip_source = 'x-real-ip'
      if (!d.server.trusted_proxies.includes('127.0.0.1')) d.server.trusted_proxies.push('127.0.0.1')
    })
    toast.info(t('nginx.ipChanged'), { description: t('nginx.ipChangedDesc') })
  }

  const copy = async () => {
    if (await copyText(conf)) toast.info(t('nginx.copied'))
    else toast.error(t('nginx.copyError'), { description: t('nginx.copyErrorDesc') })
  }

  return (
    <div className="space-y-4">
      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
        <TabsList aria-label={t('nginx.mode')}>
          <TabsTrigger value="auth">{t('nginx.modeAuth')}</TabsTrigger>
          <TabsTrigger value="proxy">{t('nginx.modeProxy')}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={addressId}>{t('nginx.address')}</Label>
          <Input
            id={addressId}
            className="font-mono"
            value={address}
            placeholder={`http://127.0.0.1:${DEFAULT_SITE_PORT}`}
            onChange={(e) => setAddress(e.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        {mode === 'auth' ? (
          <div className="space-y-2">
            <Label htmlFor={appId}>{t('nginx.app')}</Label>
            <Input
              id={appId}
              className="font-mono"
              value={app}
              onChange={(e) => setApp(e.target.value)}
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        ) : null}
      </div>

      <p className="text-sm text-muted-foreground">
        <Rich text={explain} />
      </p>

      <div className="relative">
        <pre
          tabIndex={0}
          aria-label={t('nginx.configLabel')}
          className="max-h-96 overflow-auto rounded-md border bg-muted/40 p-4 pr-28 font-mono text-xs leading-relaxed"
        >
          {conf}
        </pre>
        <Button variant="secondary" size="sm" className="absolute top-3 right-3" onClick={() => void copy()}>
          <Copy aria-hidden />
          {t('common.copy')}
        </Button>
      </div>

      <Alert>
        <Info aria-hidden />
        <AlertTitle>{t('nginx.ipTitle')}</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            <Rich text={t('nginx.ipDesc')} />
          </p>
          {ipOk ? null : (
            <Button variant="outline" size="sm" onClick={fixIp}>
              {t('nginx.fixIp')}
            </Button>
          )}
        </AlertDescription>
      </Alert>

      {hosts.length ? null : (
        <p className="text-sm text-muted-foreground">
          <Rich text={t('nginx.catchAll')} />
        </p>
      )}
    </div>
  )
}
