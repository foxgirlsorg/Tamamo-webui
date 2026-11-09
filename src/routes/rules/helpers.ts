import type { TFunction } from 'i18next'

import { formatNumber } from '@/lib/i18n'
import type { Action, Match, Rule } from '@/lib/types'

export const METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] as const
export const ACTIONS: readonly Action[] = ['allow', 'challenge', 'block']

/** Random 12-hex-digit ID for a new rule (same shape as the legacy UI). */
export function newId(): string {
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function emptyMatch(): Match {
  return { paths: [], user_agents: [], ips: [], methods: [], hosts: [], headers: [] }
}

/** A rule with every list present, so the editor can rely on the arrays. */
export function normalizeRule(r: Rule): Rule {
  return {
    ...r,
    difficulty: r.difficulty ?? 0,
    note: r.note ?? '',
    match: {
      paths: r.match?.paths ?? [],
      user_agents: r.match?.user_agents ?? [],
      ips: r.match?.ips ?? [],
      methods: r.match?.methods ?? [],
      hosts: r.match?.hosts ?? [],
      headers: r.match?.headers ?? [],
    },
  }
}

export function mkRule(name: string, action: Action): Rule {
  return { id: newId(), name, enabled: true, action, difficulty: 0, match: emptyMatch(), note: '' }
}

/** Counts a list with the plural keys rules.count.<key>_one/_other. */
function count(t: TFunction, key: string, n: number): string {
  return t(`rules.count.${key}`, { count: n, n: formatNumber(n) })
}

/** One line describing what a rule matches, e.g. "Matches 2 paths · GET/POST". */
export function ruleSummary(r: Rule, t: TFunction): string {
  const m = r.match
  const parts: string[] = []
  if (m.paths.length) parts.push(count(t, 'paths', m.paths.length))
  if (m.user_agents.length) parts.push(count(t, 'agents', m.user_agents.length))
  if (m.ips.length) parts.push(count(t, 'ips', m.ips.length))
  if (m.hosts.length) parts.push(count(t, 'hosts', m.hosts.length))
  if (m.methods.length) parts.push(m.methods.join('/'))
  const headers = m.headers.filter((h) => h.name).length
  if (headers) parts.push(count(t, 'headers', headers))
  return parts.length ? t('rules.matches', { what: parts.join(' · ') }) : t('rules.matchesAll')
}

const MARK_OPEN = ''
const MARK_CLOSE = ''

/** Matches a slot marker or a `code` span (used by rich.tsx). */
export const RICH_TOKEN = new RegExp(`${MARK_OPEN}(\\w+)${MARK_CLOSE}|\`([^\`]+)\``, 'g')

/**
 * Placeholder for an element slot in a translated string. Pass the result as
 * an interpolation value, then render the string with `rich(text, slots)`.
 */
export function slot(name: string): string {
  return `${MARK_OPEN}${name}${MARK_CLOSE}`
}
