import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { CONFIG_QUERY_KEY } from '@/lib/auth'
import { DraftContext, type ConfigSnapshot, type DraftContextValue } from '@/lib/draft-context'
import { GLOBAL_SCOPE, normalizeConfig, siteIndex } from '@/lib/config'
import i18n from '@/lib/i18n'
import { MODULES_INFO_KEY } from '@/lib/modules'
import type { Config } from '@/lib/types'

interface DraftState {
  /** The server snapshot this draft was started from. */
  base: ConfigSnapshot
  draft: Config
}

/** Loads the config and owns the unsaved draft that every config screen edits. */
export function DraftProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [scope, setScopeState] = useState<string>(GLOBAL_SCOPE)
  const [draftState, setDraftState] = useState<DraftState | null>(null)

  const query = useQuery({
    queryKey: CONFIG_QUERY_KEY,
    queryFn: async (): Promise<ConfigSnapshot> => {
      const res = await api.getConfig()
      return {
        ...res,
        config: normalizeConfig(res.config),
        effective: normalizeConfig(res.effective),
      }
    },
    staleTime: Infinity,
  })

  const server = query.data
  const baseDraft = useMemo(() => (server ? structuredClone(server.config) : null), [server])
  // A draft started from an older snapshot is ignored: after a save or refetch the server copy wins.
  const draft: Config | null = server && draftState && draftState.base === server ? draftState.draft : baseDraft
  const dirty = !!server && !!draft && JSON.stringify(draft) !== JSON.stringify(server.config)

  // If the selected site is gone (deleted or renamed by another session), fall back to global.
  const effectiveScope = draft && scope !== GLOBAL_SCOPE && siteIndex(draft, scope) < 0 ? GLOBAL_SCOPE : scope

  const setDraft = useCallback(
    (edit: (draft: Config) => void | Config) => {
      if (!server || !draft) return
      const next = structuredClone(draft)
      const returned = edit(next)
      setDraftState({ base: server, draft: returned ?? next })
    },
    [server, draft],
  )

  const discard = useCallback(() => setDraftState(null), [])

  const mutation = useMutation({
    mutationFn: (config: Config) => api.putConfig(config),
    onSuccess: (res) => {
      // The response replaces the draft: the draft is cleared and rebuilt from it.
      queryClient.setQueryData<ConfigSnapshot>(CONFIG_QUERY_KEY, {
        ...res,
        config: normalizeConfig(res.config),
        effective: normalizeConfig(res.effective),
      })
      setDraftState(null)
      // Saving starts and stops modules: ask the backend again which ones run.
      void queryClient.invalidateQueries({ queryKey: MODULES_INFO_KEY })
    },
  })

  const { mutateAsync } = mutation

  const save = useCallback(async (): Promise<boolean> => {
    if (!draft) return false
    // Site IDs are slugs of the names and can change on save: follow the
    // edited site by its position, not by its old ID.
    const idx = siteIndex(draft, effectiveScope)
    try {
      const res = await mutateAsync(draft)
      if (idx >= 0) {
        const saved = res.config.sites[idx]
        setScopeState(saved ? saved.id : GLOBAL_SCOPE)
      }
      toast.success(i18n.t('savebar.saved'), { description: i18n.t('savebar.savedDesc') })
      return true
    } catch (e) {
      // 401 is handled globally (sign-in screen). Everything else is shown here.
      const status = (e as { status?: number }).status
      if (status !== 401) {
        toast.error(i18n.t('savebar.saveError'), { description: e instanceof Error ? e.message : undefined })
      }
      return false
    }
  }, [draft, effectiveScope, mutateAsync])

  // Warn before leaving with unsaved edits, and save with Ctrl/Cmd+S.
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void save()
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      window.removeEventListener('keydown', onKey)
    }
  }, [dirty, save])

  const setScope = useCallback((next: string) => setScopeState(next), [])

  const value = useMemo<DraftContextValue | null>(() => {
    if (!server || !draft) return null
    return {
      server,
      draft,
      setDraft,
      dirty,
      saving: mutation.isPending,
      save,
      discard,
      locked: server.locked,
      effective: server.effective,
      defaults: server.defaults,
      uploads: server.uploads,
      scope: effectiveScope,
      setScope,
    }
  }, [server, draft, setDraft, dirty, mutation.isPending, save, discard, effectiveScope, setScope])

  if (query.isError) {
    return (
      <div className="flex flex-1 flex-col items-start gap-3 p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="size-5" aria-hidden />
          <p className="font-medium">{i18n.t('boot.settingsError')}</p>
        </div>
        <p className="text-sm text-muted-foreground">{query.error instanceof Error ? query.error.message : null}</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          {i18n.t('common.tryAgain')}
        </Button>
      </div>
    )
  }

  if (!value) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>
}
