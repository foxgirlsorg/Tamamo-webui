// The designer's context object and hook (kept apart from the provider so the
// provider file exports only components).

import { createContext, useContext } from 'react'

import type { Page, PageState, PageTranslation, UploadMap, UploadSlot } from '@/lib/types'

export interface DesignerValue {
  /** The page being edited: the global one, or the selected site's own copy. */
  page: Page
  /** Tamamo's built-in page (normalized). */
  defaults: Page
  /** Changes fields of the edited page. */
  edit: (mutate: (page: Page) => void) => void
  /** Changes the texts and labels of "main" or of one translation code. */
  editText: (target: string, mutate: (block: PageTranslation) => void) => void
  /** Puts the edited page back to Tamamo's defaults (images are kept). */
  resetPage: () => void
  /** The state the preview shows. */
  previewState: PageState
  setPreviewState: (state: PageState) => void
  /** Translation code shown in the preview and edited in Languages; '' is the main language. */
  editLang: string
  setEditLang: (code: string) => void
  /** Site ID for the preview: '' is the default site (global settings). */
  previewSite: string
  /** Uploaded images (UploadMap), current after uploads. */
  uploads: UploadMap
  /** Cache-busting value for image URLs. */
  imageVersion: number
  /** Changes whenever an image changes, so the preview re-renders. */
  previewRevision: number
  uploadSlot: (slot: UploadSlot, file: File) => Promise<void>
  removeSlot: (slot: UploadSlot) => Promise<void>
}

export const DesignerContext = createContext<DesignerValue | null>(null)

export function useDesigner(): DesignerValue {
  const ctx = useContext(DesignerContext)
  if (!ctx) throw new Error('useDesigner must be used inside DesignerProvider')
  return ctx
}
