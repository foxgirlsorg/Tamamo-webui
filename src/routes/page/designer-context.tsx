// State shared by the checking-page designer: the edited page (global or a
// site's own copy), the preview state and language, and image uploads.
// Uploads take effect right away (like legacy), outside the draft.

import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { CONFIG_QUERY_KEY } from '@/lib/auth'
import { GLOBAL_SCOPE, getAtPath, setAtPath } from '@/lib/config'
import { useDraft, useScope, type ConfigSnapshot } from '@/lib/draft-context'
import type { Page, PageState, PageTranslation, UploadMap, UploadSlot } from '@/lib/types'

import { DesignerContext, type DesignerValue } from './designer-store'
import { normalizePage } from './page-model'

export function DesignerProvider({ children }: { children: ReactNode }) {
  const { draft, setDraft, defaults: serverDefaults, server, dirty, scope } = useDraft()
  const { sectionPath } = useScope()
  const queryClient = useQueryClient()
  const path = sectionPath('page')

  const defaults = useMemo(() => normalizePage(structuredClone(serverDefaults.page)), [serverDefaults])
  const page = getAtPath<Page>(draft, path)

  const [previewState, setPreviewState] = useState<PageState>('checking')
  const [requestedLang, setEditLang] = useState('')
  // A translation that no longer exists (removed, or another site's page) falls back to main.
  const editLang = requestedLang && page.translations?.[requestedLang] ? requestedLang : ''

  // Uploads answer with the new upload map. While the draft has unsaved edits,
  // keep the map here: replacing the server snapshot would drop those edits.
  const [uploadOverride, setUploadOverride] = useState<{ base: ConfigSnapshot; uploads: UploadMap } | null>(null)
  const uploads = uploadOverride && uploadOverride.base === server ? uploadOverride.uploads : server.uploads
  const [imageVersion, setImageVersion] = useState(() => Date.now())
  const [previewRevision, setPreviewRevision] = useState(0)

  const edit = useCallback(
    (mutate: (page: Page) => void) => {
      setDraft((d) => {
        mutate(getAtPath<Page>(d, path))
      })
    },
    [setDraft, path],
  )

  const editText = useCallback(
    (target: string, mutate: (block: PageTranslation) => void) => {
      setDraft((d) => {
        const p = getAtPath<Page>(d, path)
        const block: PageTranslation | undefined = target === 'main' ? p : p.translations?.[target]
        if (block) mutate(block)
      })
    },
    [setDraft, path],
  )

  const resetPage = useCallback(() => {
    setDraft((d) => {
      setAtPath(d, path, structuredClone(defaults))
    })
  }, [setDraft, path, defaults])

  const applyUploads = useCallback(
    (next: UploadMap) => {
      setUploadOverride({ base: server, uploads: next })
      if (!dirty) {
        // Nothing unsaved: keep the cached snapshot in step, so a revisit shows the new state.
        queryClient.setQueryData<ConfigSnapshot>(CONFIG_QUERY_KEY, (old) => (old ? { ...old, uploads: next } : old))
      }
      setImageVersion(Date.now())
      setPreviewRevision((r) => r + 1)
    },
    [server, dirty, queryClient],
  )

  const uploadSlot = useCallback(
    async (slot: UploadSlot, file: File) => {
      const res = await api.uploadImage(slot, file)
      applyUploads(res.uploads)
    },
    [applyUploads],
  )

  const removeSlot = useCallback(
    async (slot: UploadSlot) => {
      const res = await api.deleteUpload(slot)
      applyUploads(res.uploads)
    },
    [applyUploads],
  )

  const previewSite = scope === GLOBAL_SCOPE ? '' : scope

  const value = useMemo<DesignerValue>(
    () => ({
      page,
      defaults,
      edit,
      editText,
      resetPage,
      previewState,
      setPreviewState,
      editLang,
      setEditLang,
      previewSite,
      uploads,
      imageVersion,
      previewRevision,
      uploadSlot,
      removeSlot,
    }),
    [page, defaults, edit, editText, resetPage, previewState, editLang, previewSite, uploads, imageVersion, previewRevision, uploadSlot, removeSlot],
  )

  return <DesignerContext.Provider value={value}>{children}</DesignerContext.Provider>
}
