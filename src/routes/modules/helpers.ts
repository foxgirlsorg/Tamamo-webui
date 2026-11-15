import type { TFunction } from 'i18next'

import { siteDisplayName } from '@/lib/config'
import type { Config, ModuleConfig, ModuleField, OnError } from '@/lib/types'

export const ON_ERROR_VALUES: OnError[] = ['continue', 'challenge', 'block']

/** Site ID the backend uses for the default site. */
export const DEFAULT_SITE_ID = 'default'

/** Names of module entries, as the backend checks them (module.ValidID). */
export const MODULE_NAME = /^[a-z0-9][a-z0-9-]{0,63}$/

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

/** Options for the on_error Select. */
export function onErrorOptions(t: TFunction): { value: OnError; label: string }[] {
  return ON_ERROR_VALUES.map((v) => ({ value: v, label: t(`modules.onError.${v}`) }))
}

/** `base`, or `base-2`, `base-3`... when entries with that name exist. */
export function uniqueModuleName(base: string, existing: ModuleConfig[]): string {
  const taken = new Set(existing.map((m) => m.name))
  if (!taken.has(base)) return base
  for (let n = 2; ; n++) {
    const candidate = `${base.slice(0, 60)}-${n}`
    if (!taken.has(candidate)) return candidate
  }
}

/** Why a setting's value would be refused by the backend, or "" when it is fine. */
export function settingError(t: TFunction, field: ModuleField, value: string | undefined): string {
  const v = (value ?? '').trim()
  if (v === '') return field.required ? t('modules.errRequired', { name: field.label || field.name }) : ''
  if (field.type === 'number') {
    const bounded = field.min !== 0 || field.max !== 0
    const n = Number(v)
    if (!/^-?\d+$/.test(v) || (bounded && (n < field.min || n > field.max))) {
      return t('modules.errNumber', {
        min: bounded ? field.min : '−∞',
        max: bounded ? field.max : '∞',
      })
    }
  }
  return ''
}
