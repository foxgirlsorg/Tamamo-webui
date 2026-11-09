import { useEffect, useId, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { yaml } from '@codemirror/lang-yaml'
import CodeMirror, {
  Decoration,
  EditorView,
  keymap,
  StateEffect,
  StateField,
  type DecorationSet,
  type ReactCodeMirrorRef,
} from '@uiw/react-codemirror'
import { AlertTriangle, Check, ChevronRight, Info, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useBlocker } from 'react-router'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError, api } from '@/lib/api'
import { CONFIG_QUERY_KEY } from '@/lib/auth'
import { formatNumber } from '@/lib/i18n'
import { slot } from './helpers'
import { rich } from './rich'

const RULES_FILE_KEY = ['rules-file'] as const

/** Example shown under "File format" (YAML, not translated, as in the legacy UI). */
const RULES_EXAMPLE = `rules:
  - name: Block AI crawlers
    action: block
    user_agents: ["*GPTBot*", "*ClaudeBot*"]
  - name: Let the API through
    action: allow
    paths: ["/api/*"]
    methods: [GET, POST]
sites:
  - name: Blog
    rules:
      - name: Check the login page harder
        action: challenge
        difficulty: 5
        paths: ["/login"]
        headers:
          Accept: "*text/html*"
`

// Highlights the line the server reported in an error (set with setErrorLine).
const setErrorLine = StateEffect.define<number>()
const errorLineDeco = Decoration.line({ class: 'cm-rules-error-line' })
const errorLineField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(value, tr) {
    let next = value.map(tr.changes)
    for (const effect of tr.effects) {
      if (effect.is(setErrorLine)) {
        const n = effect.value
        next = n >= 1 && n <= tr.state.doc.lines ? Decoration.set([errorLineDeco.range(tr.state.doc.line(n).from)]) : Decoration.none
      }
    }
    return next
  },
  provide: (f) => EditorView.decorations.from(f),
})

const errorLineTheme = EditorView.theme({
  '.cm-rules-error-line': { backgroundColor: 'color-mix(in srgb, var(--destructive) 25%, transparent)' },
})

interface FileError {
  message: string
  /** 1-based line from the server message ("line N"), or 0. */
  line: number
}

interface RulesFileEditorProps {
  /** Tells the page whether the file has unsaved edits (for the mode switch). */
  onDirtyChange: (dirty: boolean) => void
}

/**
 * tamamo.yaml as text (GET/PUT /api/rules/file). Ctrl/Cmd+S saves, server errors
 * with "line N" are shown and the cursor moves to that line.
 */
export function RulesFileEditor({ onDirtyChange }: RulesFileEditorProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const helpId = useId()
  const cmRef = useRef<ReactCodeMirrorRef>(null)

  const fileQuery = useQuery({
    queryKey: RULES_FILE_KEY,
    queryFn: () => api.getRulesFile(),
    // Always read the file from disk when the screen opens.
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  })

  // `edited` is null until the user types; then it holds the editor text.
  const [edited, setEdited] = useState<string | null>(null)
  const [error, setError] = useState<FileError | null>(null)
  const [pendingConfirm, setPendingConfirm] = useState<'revert' | 'reload' | null>(null)
  const [formatOpen, setFormatOpen] = useState(false)

  const original = fileQuery.data?.yaml ?? ''
  const text = edited ?? original
  const dirty = edited !== null && edited !== original
  const path = fileQuery.data?.path || 'tamamo.yaml'
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

  useEffect(() => {
    onDirtyChange(dirty)
  }, [dirty, onDirtyChange])

  useEffect(() => () => onDirtyChange(false), [onDirtyChange])

  // Warn before a full page unload with unsaved edits.
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  // Leaving the screen with unsaved edits asks first.
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname)

  /** Puts the cursor on a line and highlights it. */
  const goToLine = (n: number) => {
    const view = cmRef.current?.view
    if (!view) return
    const target = Math.min(Math.max(n, 1), view.state.doc.lines)
    const line = view.state.doc.line(target)
    view.dispatch({
      selection: { anchor: line.from },
      effects: [setErrorLine.of(target), EditorView.scrollIntoView(line.from, { y: 'center' })],
    })
    view.focus()
  }

  const saveMutation = useMutation({
    mutationFn: (yaml: string) => api.putRulesFile(yaml),
    onSuccess: async () => {
      setError(null)
      toast.success(t('rulesFile.saved'), { description: t('rulesFile.savedDesc') })
      // The rules changed on disk: reload the file and the config draft.
      await queryClient.invalidateQueries({ queryKey: RULES_FILE_KEY })
      setEdited(null)
      void queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEY })
    },
    onError: (e) => {
      if (e instanceof ApiError && e.status === 401) return // the sign-in screen takes over
      if (e instanceof ApiError && (e.status === 400 || e.status === 422)) {
        const m = /line\s+(\d+)/i.exec(e.message)
        const line = m ? Number(m[1]) : 0
        setError({ message: e.message, line })
        if (line) goToLine(line)
        else cmRef.current?.view?.focus()
        return
      }
      toast.error(t('rulesFile.saveError'), { description: e instanceof Error ? e.message : undefined })
    },
  })

  const save = () => {
    if (!saveMutation.isPending) saveMutation.mutate(text)
  }

  // Clear the highlighted error line when the error goes away.
  useEffect(() => {
    if (!error) cmRef.current?.view?.dispatch({ effects: setErrorLine.of(0) })
  }, [error])

  // Rebuilt each render so the Ctrl/Cmd+S keymap always saves the latest text.
  const extensions = [
    yaml(),
    keymap.of([
      {
        key: 'Mod-s',
        preventDefault: true,
        run: () => {
          save()
          return true
        },
      },
    ]),
    errorLineField,
    errorLineTheme,
    EditorView.contentAttributes.of({
      'aria-label': t('rulesFile.editorLabel', { path }),
      'aria-describedby': `${helpId}-keys`,
    }),
  ]

  const revert = () => {
    setEdited(null)
    setError(null)
  }

  const reload = () => {
    setEdited(null)
    setError(null)
    void fileQuery.refetch()
  }

  const askOrRun = (kind: 'revert' | 'reload') => {
    if (kind === 'revert' || dirty) setPendingConfirm(kind)
    else reload()
  }

  if (fileQuery.isPending) {
    return (
      <Card>
        <CardContent className="space-y-3 py-6">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (fileQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle aria-hidden />
        <AlertTitle>{t('rulesFile.loadError')}</AlertTitle>
        <AlertDescription className="space-y-3">
          <span className="block">{fileQuery.error instanceof Error ? fileQuery.error.message : null}</span>
          <Button variant="outline" size="sm" onClick={() => void fileQuery.refetch()}>
            <RotateCcw aria-hidden />
            {t('common.tryAgain')}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <CardTitle>{t('rulesFile.title')}</CardTitle>
              <CardDescription>
                {rich(t('rulesFile.fileIs', { path: slot('path') }), { path: <code className="font-mono">{path}</code> })}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => askOrRun('reload')}>
              <RotateCcw aria-hidden />
              {t('rulesFile.reload')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertTriangle aria-hidden />
              <AlertTitle>
                {error.line ? t('rulesFile.errorAtLine', { line: formatNumber(error.line) }) : t('rulesFile.error')}
              </AlertTitle>
              <AlertDescription className="space-y-2">
                <span className="block whitespace-pre-wrap">{error.message}</span>
                {error.line ? (
                  <Button variant="outline" size="sm" onClick={() => goToLine(error.line)}>
                    {t('rulesFile.goToLine', { line: formatNumber(error.line) })}
                  </Button>
                ) : null}
              </AlertDescription>
            </Alert>
          ) : null}

          <div
            className={`overflow-hidden rounded-md border ${error ? 'border-destructive' : 'border-input'}`}
            onKeyDown={(e) => {
              // Ctrl/Cmd+S belongs to the file editor, not to the config draft's global save.
              if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') e.stopPropagation()
            }}
          >
            <CodeMirror
              ref={cmRef}
              value={text}
              height="28rem"
              theme="dark"
              extensions={extensions}
              onChange={(v) => setEdited(v)}
              basicSetup={{ foldGutter: false }}
            />
          </div>

          <p id={`${helpId}-keys`} className="text-xs text-muted-foreground">
            {rich(t('rulesFile.keysCm', { save: slot('save') }), {
              save: (
                <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[0.7rem] text-foreground">
                  {isMac ? '⌘S' : 'Ctrl+S'}
                </kbd>
              ),
            })}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={save} disabled={saveMutation.isPending}>
              <Check aria-hidden />
              {t('rulesFile.save')}
            </Button>
            <Button variant="ghost" onClick={() => askOrRun('revert')} disabled={!dirty}>
              <RotateCcw aria-hidden />
              {t('rulesFile.revert')}
            </Button>
            <span className="grow" />
            <span aria-live="polite" className="text-sm text-muted-foreground">
              {dirty ? t('rulesFile.unsaved') : t('rulesFile.upToDate')}
            </span>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Info aria-hidden />
        <AlertTitle>{t('rulesFile.autoTitle')}</AlertTitle>
        <AlertDescription>
          {rich(t('rulesFile.autoDesc', { path: slot('path') }), { path: <code className="font-mono">{path}</code> })}
        </AlertDescription>
      </Alert>

      <Collapsible open={formatOpen} onOpenChange={setFormatOpen}>
        <Card className="gap-0 py-0">
          <CollapsibleTrigger className="group flex w-full items-center gap-2 rounded-xl p-4 text-left font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <ChevronRight aria-hidden className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
            {t('rulesFile.formatTitle')}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-3 px-4 pb-4 text-sm text-muted-foreground">
              <p>{rich(t('rulesFile.formatDesc'))}</p>
              <p>{rich(t('rulesFile.formatKeys'))}</p>
              <p>{rich(t('rulesFile.formatAlternative'))}</p>
              <pre
                tabIndex={0}
                aria-label={t('rulesFile.example')}
                className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs text-foreground"
              >
                {RULES_EXAMPLE}
              </pre>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <AlertDialog open={pendingConfirm !== null} onOpenChange={(open) => !open && setPendingConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('rulesFile.revertTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('rulesFile.revertDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingConfirm === 'reload') reload()
                else revert()
                setPendingConfirm(null)
              }}
            >
              {pendingConfirm === 'reload' ? t('rulesFile.reload') : t('rulesFile.revert')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={blocker.state === 'blocked'} onOpenChange={(open) => !open && blocker.state === 'blocked' && blocker.reset()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('rulesFile.leaveTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('rulesFile.leaveDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (blocker.state === 'blocked') blocker.proceed()
              }}
            >
              {t('rulesFile.leave')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
