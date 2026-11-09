// The config draft's React context and hooks. The provider lives in
// draft.tsx; this file has no JSX so the hooks can be imported from anywhere.

import { createContext, useContext } from 'react'

import { GLOBAL_SCOPE, OWN_FLAG, customiseSection, resetSectionToGlobal, sectionPath, siteIndex, type ScopedSection } from '@/lib/config'
import type { Config, ConfigDefaults, LockedMap, Site, UploadMap } from '@/lib/types'

/** The server's view of the config: the saved config plus its metadata. */
export interface ConfigSnapshot {
  config: Config
  /** Config with environment overrides applied (what is running). */
  effective: Config
  locked: LockedMap
  uploads: UploadMap
  defaults: ConfigDefaults
}

export interface DraftContextValue {
  /** The saved config (what the server has) and its metadata. */
  server: ConfigSnapshot
  /** Edited copy shared by every config screen. */
  draft: Config
  /** Edits the draft. Pass a function that mutates the copy it receives, or returns a new config. */
  setDraft: (edit: (draft: Config) => void | Config) => void
  /** True when the draft differs from what the server has. */
  dirty: boolean
  saving: boolean
  /** Saves the whole draft. Resolves true on success. */
  save: () => Promise<boolean>
  /** Throws away unsaved edits. */
  discard: () => void
  /** Settings fixed by environment variables: key → variable name. */
  locked: LockedMap
  /** Settings the running server uses (env overrides applied). */
  effective: Config
  defaults: ConfigDefaults
  uploads: UploadMap

  /** Current scope: GLOBAL_SCOPE or a site ID. */
  scope: string
  setScope: (scope: string) => void
}

export const DraftContext = createContext<DraftContextValue | null>(null)

/** The shared config draft and its save state. Must be used under DraftProvider. */
export function useDraft(): DraftContextValue {
  const ctx = useContext(DraftContext)
  if (!ctx) throw new Error('useDraft must be used inside DraftProvider')
  return ctx
}

export interface ScopeState {
  /** GLOBAL_SCOPE or a site ID. */
  scope: string
  setScope: (scope: string) => void
  /** The selected site, or null for the global scope. */
  site: Site | null
  /** Position of the selected site in draft.sites, or -1. */
  siteIndex: number
  /** Whether the selected site owns this section. Always false for the global scope. */
  isOwn: (section: ScopedSection) => boolean
  /** Draft path of a section for the current scope (e.g. "sites.1.protection"). */
  sectionPath: (section: ScopedSection) => string
  /** Gives the selected site its own copy of a section. Call before editing that section. */
  customize: (section: ScopedSection) => void
  /** Makes the selected site use the global section again. */
  resetToGlobal: (section: ScopedSection) => void
}

/**
 * Global vs site scope for Protection, Rules and the checking page. Read the
 * section's draft path from `sectionPath`, and call `customize` before editing
 * a site that doesn't own the section yet.
 */
export function useScope(): ScopeState {
  const { draft, scope, setScope, setDraft } = useDraft()
  const idx = siteIndex(draft, scope)
  const site = idx >= 0 ? draft.sites[idx] : null
  return {
    scope: scope || GLOBAL_SCOPE,
    setScope,
    site,
    siteIndex: idx,
    isOwn: (section) => !!site && !!site[OWN_FLAG[section]],
    sectionPath: (section) => sectionPath(draft, scope, section),
    customize: (section) => {
      if (idx < 0) return
      setDraft((d) => {
        customiseSection(d, d.sites[idx], section)
      })
    },
    resetToGlobal: (section) => {
      if (idx < 0) return
      setDraft((d) => {
        resetSectionToGlobal(d.sites[idx], section)
      })
    },
  }
}
