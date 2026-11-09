import { createElement, Fragment, type ReactNode } from 'react'
import type { TFunction } from 'i18next'
import { Cpu, Paintbrush, Webhook, type LucideIcon } from 'lucide-react'

import { siteDisplayName } from '@/lib/config'
import type { Config } from '@/lib/types'

export const MODULE_TYPES = ['go', 'webhook', 'page'] as const
export const ON_ERROR_VALUES = ['continue', 'challenge', 'block'] as const
export const PAGE_FILES = ['head.html', 'body.html', 'style.css', 'script.js'] as const

/** Site ID the backend uses for the default site. */
export const DEFAULT_SITE_ID = 'default'

/** Limits the Go backend enforces (internal/config/modules.go, internal/modules). */
export const WEBHOOK_TIMEOUT_MIN = 1
export const WEBHOOK_TIMEOUT_MAX = 10000
export const CACHE_MAX = 3600

/** Same rule as legacy: letters, digits, dots, dashes and underscores. */
export const MODULE_NAME = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/

/** Settings the webhook form shows as its own controls. */
export const WEBHOOK_FORM_SETTINGS = ['cache_seconds', 'send_cookies'] as const

export const MODULE_ICON: Record<string, LucideIcon> = {
  go: Cpu,
  webhook: Webhook,
  page: Paintbrush,
}

export function moduleTypeLabel(t: TFunction, type: string): string {
  return (MODULE_TYPES as readonly string[]).includes(type) ? t(`modules.type.${type}`) : type
}

/** Placeholder character for `withNode`: a private-use code point no translation contains. */
const SLOT = ''

/**
 * Puts a React node where a translated string has its `{name}` placeholder.
 * Call with `t(key, { name: SLOT })`-style text: see `slotText`.
 */
export function withNode(text: string, node: ReactNode): ReactNode {
  const parts = text.split(SLOT)
  return parts.map((part, i) => createElement(Fragment, { key: i }, part, i < parts.length - 1 ? node : null))
}

/** Value to pass to `t()` for the placeholder that `withNode` fills. */
export const slotText = SLOT

/** Names of the sites a module is limited to, or "All sites" when the list is empty. */
export function sitesSummary(t: TFunction, draft: Config, ids: string[]): string {
  if (!ids.length) return t('modules.allSites')
  return ids.map((id) => siteNameFor(t, draft, id)).join(', ')
}

/** Display name for a site ID (the default site, a named site, or the raw ID when unknown). */
export function siteNameFor(t: TFunction, draft: Config, id: string): string {
  if (id === DEFAULT_SITE_ID) return t('common.defaultSite')
  const site = draft.sites.find((s) => s.id === id)
  return site ? siteDisplayName(site, t('sites.unnamed')) : id
}

/** Site options for a module: the default site first, then every site in the draft. */
export function siteOptions(t: TFunction, draft: Config): { id: string; name: string }[] {
  return [
    { id: DEFAULT_SITE_ID, name: t('common.defaultSite') },
    ...draft.sites.map((s) => ({ id: s.id, name: siteDisplayName(s, t('sites.unnamed')) })),
  ]
}

/** Keys of `settings` that the form above the key/value editor already shows. */
export function extraSettingKeys(settings: Record<string, string>, known: readonly string[]): string[] {
  return Object.keys(settings).filter((k) => !known.includes(k))
}

/** Returns the same settings with `oldKey` renamed to `newKey`, keeping their order. */
export function renameSetting(settings: Record<string, string>, oldKey: string, newKey: string): Record<string, string> {
  return Object.fromEntries(Object.entries(settings).map(([k, v]) => [k === oldKey ? newKey : k, v]))
}

/** Options for the on_error Select, labeled as in legacy. */
export function onErrorOptions(t: TFunction): { value: string; label: string }[] {
  return ON_ERROR_VALUES.map((v) => ({ value: v, label: t(`modules.onError.${v}`) }))
}

/** Clamps a cache value (seconds) to the backend range. */
export function clampCache(n: number): number {
  return Math.min(Math.max(n, 0), CACHE_MAX)
}
