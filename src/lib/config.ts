// Pure helpers for the config draft: normalizing what the server sends, and
// the global-vs-site scope rules (ported from legacy/app.js: S.scope, OWN, sectionPath).
// No React here, so these can be used from any module.

import type { Config, Labels, Page, PageTranslation, Protection, Rule, Site } from '@/lib/types'

/** Sections a site can either share with the global settings or own. */
export type ScopedSection = 'protection' | 'rules' | 'page'

/** The flag on a site that says it owns a section. */
export const OWN_FLAG = {
  protection: 'own_protection',
  rules: 'own_rules',
  page: 'own_page',
} as const satisfies Record<ScopedSection, 'own_protection' | 'own_rules' | 'own_page'>

/** Scope value for the global settings. Any other value is a site ID. */
export const GLOBAL_SCOPE = 'global'

const EMPTY_LABELS: Labels = {
  difficulty: '',
  speed: '',
  time: '',
  progress: '',
  seconds: '',
  minutes: '',
  hash_rate: '',
  hash_rate_k: '',
  hash_rate_m: '',
  mascot_alt: '',
  cookies_disabled: '',
  browser_too_old: '',
  data_missing: '',
  solver_failed: '',
  too_many_attempts: '',
  network_error: '',
  server_rejected: '',
  bad_request: '',
  challenge_invalid: '',
  challenge_wrong_site: '',
  challenge_expired: '',
  challenge_wrong_client: '',
  proof_wrong: '',
  challenge_used: '',
  upstream_missing: '',
  upstream_down: '',
}

function normalizeLabels(labels: Partial<Labels> | undefined): Labels {
  return { ...EMPTY_LABELS, ...(labels ?? {}) }
}

function normalizeRules(rules: Rule[] | undefined): Rule[] {
  return (rules ?? []).map((r) => ({
    ...r,
    note: r.note ?? '',
    match: {
      paths: r.match?.paths ?? [],
      user_agents: r.match?.user_agents ?? [],
      ips: r.match?.ips ?? [],
      methods: r.match?.methods ?? [],
      hosts: r.match?.hosts ?? [],
      headers: r.match?.headers ?? [],
    },
  }))
}

function normalizePage(page: Page): Page {
  const translations: Record<string, PageTranslation> = {}
  for (const [code, tr] of Object.entries(page.translations ?? {})) {
    translations[code] = { ...tr, labels: normalizeLabels(tr.labels) }
  }
  return {
    ...page,
    translations,
    labels: normalizeLabels(page.labels),
    auto_language: !!page.auto_language,
    language: page.language || (page.auto_language ? 'auto' : page.lang || 'en'),
  }
}

function normalizeSite(site: Site): Site {
  return {
    ...site,
    hosts: site.hosts ?? [],
    target: site.target ?? '',
    rules: normalizeRules(site.rules),
    page: normalizePage(site.page),
  }
}

/**
 * Fills the gaps in a config from the server so screens can rely on arrays and
 * nested objects being present. Returns a new object.
 */
export function normalizeConfig(cfg: Config): Config {
  return {
    ...cfg,
    server: { ...cfg.server, trusted_proxies: cfg.server?.trusted_proxies ?? [] },
    admin: { ...cfg.admin, domains: cfg.admin?.domains ?? [] },
    rules: normalizeRules(cfg.rules),
    page: normalizePage(cfg.page),
    sites: (cfg.sites ?? []).map(normalizeSite),
    modules: (cfg.modules ?? []).map((m) => ({
      ...m,
      name: m.name ?? '',
      type: m.type || 'webhook',
      url: m.url ?? '',
      timeout_ms: m.timeout_ms || 0,
      on_error: m.on_error || 'continue',
      sites: m.sites ?? [],
      settings: m.settings ?? {},
    })),
  }
}

/** Index of a site in the draft, or -1 for the global scope or an unknown ID. */
export function siteIndex(cfg: Config, scope: string): number {
  if (scope === GLOBAL_SCOPE) return -1
  return cfg.sites.findIndex((s) => s.id === scope)
}

/**
 * Draft path of a section for a scope, e.g. "protection" or "sites.2.protection".
 * A site that does not own the section maps to the global path, because its
 * settings are the global ones.
 */
export function sectionPath(cfg: Config, scope: string, section: ScopedSection): string {
  const i = siteIndex(cfg, scope)
  if (i < 0) return section
  return cfg.sites[i][OWN_FLAG[section]] ? `sites.${i}.${section}` : section
}

/** Reads a dotted path from an object ("sites.0.protection"). */
export function getAtPath<T = unknown>(root: unknown, path: string): T {
  return path.split('.').reduce<unknown>((o, k) => (o == null ? undefined : (o as Record<string, unknown>)[k]), root) as T
}

/** Writes a dotted path into a (mutable) object. */
export function setAtPath(root: unknown, path: string, value: unknown): void {
  const keys = path.split('.')
  let o = root as Record<string, unknown>
  for (const k of keys.slice(0, -1)) o = o[k] as Record<string, unknown>
  o[keys[keys.length - 1]] = value
}

/**
 * Makes a site own a section, copying the current global one first (the server
 * does the same on save). Mutates the site.
 */
export function customiseSection(cfg: Config, site: Site, section: ScopedSection): void {
  site[OWN_FLAG[section]] = true
  if (section === 'protection') site.protection = structuredClone(cfg.protection) as Protection
  if (section === 'rules') site.rules = structuredClone(cfg.rules)
  if (section === 'page') site.page = normalizePage(structuredClone(cfg.page))
}

/** Gives a section back to the global settings. Mutates the site. */
export function resetSectionToGlobal(site: Site, section: ScopedSection): void {
  site[OWN_FLAG[section]] = false
}

/** Name shown for a site, falling back to a placeholder for unnamed sites. */
export function siteDisplayName(site: Pick<Site, 'name'> | null | undefined, fallback: string): string {
  return site?.name?.trim() ? site.name : fallback
}
