// Live preview: the HTML from POST /api/preview, shown in a sandboxed iframe
// srcdoc. Re-rendered 300 ms after the page changes; state switches post a message
// to the page when it is already loaded (legacy behavior).

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Monitor, Smartphone } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { api } from '@/lib/api'
import type { Page, PageState } from '@/lib/types'

import { PAGE_STATES, langLabel } from './page-model'

const DESKTOP = { w: 1280, h: 860 }
const MOBILE = { w: 390, h: 780 }
const MAIN = 'main'

type Device = 'desktop' | 'mobile'

interface PreviewPaneProps {
  page: Page
  state: PageState
  onStateChange: (state: PageState) => void
  /** Translation code to show, '' for the main texts. */
  lang: string
  onLangChange: (code: string) => void
  /** Site ID for the preview ('' = default site). */
  site: string
  /** Changes when an image changes, so the preview is fetched again. */
  revision: number
}

export function PreviewPane({ page, state, onStateChange, lang, onLangChange, site, revision }: PreviewPaneProps) {
  const { t } = useTranslation()
  const [device, setDevice] = useState<Device>('desktop')
  const [html, setHtml] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [width, setWidth] = useState(640)

  const viewportRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const loadedRef = useRef(false)
  const lastKeyRef = useRef<string | null>(null)
  const seqRef = useRef(0)
  const latestRef = useRef({ page, state, lang, site, revision })
  const prevStateRef = useRef(state)

  // Everything the rendered HTML depends on, except the state (which the page takes by message).
  const key = JSON.stringify([page, lang, site, revision])

  useEffect(() => {
    latestRef.current = { page, state, lang, site, revision }
  })

  const refresh = useCallback(async () => {
    const seq = ++seqRef.current
    const cur = latestRef.current
    const requestKey = JSON.stringify([cur.page, cur.lang, cur.site, cur.revision])
    setBusy(true)
    try {
      const out = await api.previewPage({ page: cur.page, state: cur.state, lang: cur.lang, site: cur.site })
      if (seq !== seqRef.current) return
      loadedRef.current = false
      lastKeyRef.current = requestKey
      setError(null)
      setHtml(out)
    } catch (e) {
      if (seq !== seqRef.current) return
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      if (seq === seqRef.current) setBusy(false)
    }
  }, [])

  // Debounced re-render when the page, language, site or images change.
  useEffect(() => {
    if (lastKeyRef.current === key) return
    const id = window.setTimeout(() => {
      void refresh()
    }, 300)
    return () => window.clearTimeout(id)
  }, [key, refresh])

  // A state change is a message when the same page is already on screen.
  useEffect(() => {
    if (prevStateRef.current === state) return
    prevStateRef.current = state
    const frame = iframeRef.current
    if (loadedRef.current && lastKeyRef.current === key && frame?.contentWindow) {
      frame.contentWindow.postMessage({ type: 'tamamo-preview-state', state }, window.location.origin)
    } else {
      void refresh()
    }
  }, [state, key, refresh])

  // Fit the frame to the available width.
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const available = Math.max(width, 240)
  const mobile = device === 'mobile'
  const frame = mobile ? MOBILE : DESKTOP
  const scale = Math.max(0.05, mobile ? Math.min(1, (available - 32) / MOBILE.w, 640 / MOBILE.h) : available / DESKTOP.w)
  const boxW = mobile ? MOBILE.w * scale : available
  const boxH = frame.h * scale

  const codes = Object.keys(page.translations ?? {}).sort()
  const mainLabel = t('page.lang.mainOption', { lang: langLabel(page.lang || 'en') })
  const hostName = window.location.hostname || 'example.com'

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ToggleGroup type="single" variant="outline" size="sm" value={state} aria-label={t('page.previewState')} onValueChange={(v) => { if (v) onStateChange(v as PageState) }}>
          {PAGE_STATES.map((s) => (
            <ToggleGroupItem key={s} value={s} aria-label={t(`page.state.${s}`)}>
              {t(`page.state.${s}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="flex flex-wrap items-center gap-2">
          {codes.length > 0 ? (
            <Select value={lang || MAIN} onValueChange={(v) => onLangChange(v === MAIN ? '' : v)}>
              <SelectTrigger size="sm" aria-label={t('page.previewLang')} className="w-auto min-w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MAIN}>{mainLabel}</SelectItem>
                {codes.map((c) => (
                  <SelectItem key={c} value={c}>
                    {langLabel(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <ToggleGroup type="single" variant="outline" size="sm" value={device} aria-label={t('page.previewWidth')} onValueChange={(v) => { if (v) setDevice(v as Device) }}>
            <ToggleGroupItem value="desktop" aria-label={t('page.desktop')}>
              <Monitor aria-hidden />
              {t('page.desktop')}
            </ToggleGroupItem>
            <ToggleGroupItem value="mobile" aria-label={t('page.mobile')}>
              <Smartphone aria-hidden />
              {t('page.mobile')}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-muted/30">
        <div className="flex items-center gap-2 border-b bg-muted/60 px-3 py-2">
          <span aria-hidden className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-muted-foreground/40" />
            <span className="size-2.5 rounded-full bg-muted-foreground/40" />
            <span className="size-2.5 rounded-full bg-muted-foreground/40" />
          </span>
          <span className="min-w-0 truncate rounded bg-background px-2 py-0.5 font-mono text-xs text-muted-foreground">{`https://${hostName}/`}</span>
          {busy ? (
            <Badge variant="secondary" className="ml-auto">
              {t('page.updating')}
            </Badge>
          ) : null}
        </div>

        {error ? (
          <div className="p-3">
            <Alert variant="destructive">
              <AlertTitle>{t('page.previewError')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : null}

        <div ref={viewportRef} className={mobile ? 'flex justify-center p-4' : undefined}>
          <div className="relative overflow-hidden bg-background" style={{ width: boxW, height: boxH }}>
            <iframe
              ref={iframeRef}
              title={t('page.previewTitle')}
              sandbox="allow-scripts allow-same-origin"
              referrerPolicy="same-origin"
              srcDoc={html}
              onLoad={() => {
                loadedRef.current = true
              }}
              className="absolute top-0 left-0 border-0 bg-white"
              style={{ width: frame.w, height: frame.h, transform: `scale(${scale})`, transformOrigin: '0 0' }}
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{t('page.previewHelp')}</p>
    </div>
  )
}
