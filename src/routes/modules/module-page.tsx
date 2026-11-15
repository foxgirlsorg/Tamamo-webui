import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'

import { PageHeader } from '@/components/page-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AUTH_STATE_KEY } from '@/lib/auth'
import { modulePageSrc, runningPages, useModulesInfo } from '@/lib/modules'
import { queryClient } from '@/lib/query-client'

/** Shortest frame, so a page that reports no height is still usable. */
const MIN_HEIGHT = 320

/** A message a module page sends with the UI kit (tamamo.js). */
interface KitMessage {
  source: 'tamamo-module'
  module: string
  type: 'toast' | 'navigate' | 'height' | 'unauthorized'
  message?: string
  kind?: string
  path?: string
  height?: number
}

function isKitMessage(data: unknown): data is KitMessage {
  return typeof data === 'object' && data !== null && (data as { source?: unknown }).source === 'tamamo-module'
}

/**
 * A page a module adds to the web UI. The module ships the page (HTML, CSS,
 * JS) in its binary; the backend serves it to signed-in admins and it is
 * shown here in a frame. The page talks to this screen with postMessage.
 */
export function ModulePageScreen() {
  const { t, i18n } = useTranslation()
  const { name = '', page: pageId = '' } = useParams()
  const navigate = useNavigate()
  const info = useModulesInfo()
  const frame = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(MIN_HEIGHT)
  const [loaded, setLoaded] = useState(false)

  const pages = runningPages(info.data).filter((p) => p.name === name)
  const page = pages.find((p) => p.page.id === pageId)
  const src = info.data && page ? modulePageSrc(info.data, page, i18n.language) : ''

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      // Only our own frame, on our own origin, may ask for anything.
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow || !isKitMessage(e.data)) return
      const msg = e.data
      switch (msg.type) {
        case 'toast': {
          const text = String(msg.message ?? '').slice(0, 500)
          if (!text) return
          if (msg.kind === 'error') toast.error(text)
          else if (msg.kind === 'success') toast.success(text)
          else toast.info(text)
          break
        }
        case 'navigate':
          // Screens of the web UI only: a path, never another site.
          if (typeof msg.path === 'string' && /^\/[a-z0-9/_-]*$/i.test(msg.path)) void navigate(msg.path)
          break
        case 'height':
          if (typeof msg.height === 'number' && Number.isFinite(msg.height)) {
            setHeight(Math.min(Math.max(Math.ceil(msg.height), MIN_HEIGHT), 20000))
          }
          break
        case 'unauthorized':
          void queryClient.invalidateQueries({ queryKey: AUTH_STATE_KEY })
          break
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [navigate])

  // A different page starts from a clean frame.
  const [shownSrc, setShownSrc] = useState(src)
  if (shownSrc !== src) {
    setShownSrc(src)
    setLoaded(false)
    setHeight(MIN_HEIGHT)
  }

  const back = (
    <Button asChild variant="outline" size="sm">
      <Link to="/modules">
        <ArrowLeft aria-hidden />
        {t('modules.page.back')}
      </Link>
    </Button>
  )

  if (info.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  if (!page) {
    const running = info.data?.running.some((r) => r.name === name)
    return (
      <div className="space-y-6">
        <PageHeader title={name} actions={back} />
        <Alert>
          <TriangleAlert aria-hidden />
          <AlertTitle>{running ? t('modules.page.notFoundTitle') : t('modules.page.notRunningTitle', { name })}</AlertTitle>
          <AlertDescription>
            {info.isError && info.error instanceof Error
              ? info.error.message
              : running
                ? t('modules.page.notFoundDesc', { name, page: pageId })
                : t('modules.page.notRunningDesc')}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title={page.page.title}
        description={page.info.name === name ? page.info.name : `${page.info.name} · ${name}`}
        actions={
          <>
            {pages.length > 1
              ? pages
                  .filter((p) => p.page.id !== pageId)
                  .map((p) => (
                    <Button key={p.page.id} asChild variant="ghost" size="sm">
                      <Link to={p.to}>{p.page.title}</Link>
                    </Button>
                  ))
              : null}
            {back}
          </>
        }
      />
      <div className="relative">
        {!loaded ? (
          <div className="absolute inset-0 space-y-3" role="status" aria-label={t('modules.page.loading')}>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : null}
        <iframe
          ref={frame}
          key={src}
          src={src}
          title={t('modules.page.frameTitle', { title: page.page.title, module: page.info.name })}
          className="block w-full border-0 bg-transparent"
          style={{ height, colorScheme: 'dark', opacity: loaded ? 1 : 0 }}
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  )
}
