// Pure helpers for the checking-page designer: the page model (ported from
// legacy/app.js normalizePage / normalizeTranslation / labels), presets and
// small lookups. No React here.

import { currentLanguage } from '@/lib/i18n'
import type { Labels, Page, PageState, PageTexts, PageTranslation, Palette } from '@/lib/types'

export const PAGE_STATES: PageState[] = ['checking', 'success', 'denied', 'error']

/** The checking page's small strings, grouped as in the legacy "Other wording" section. */
export const LABEL_GROUPS: { group: 'progress' | 'browser' | 'server'; keys: (keyof Labels)[] }[] = [
  {
    group: 'progress',
    keys: ['difficulty', 'speed', 'time', 'progress', 'seconds', 'minutes', 'hash_rate', 'hash_rate_k', 'hash_rate_m', 'mascot_alt'],
  },
  {
    group: 'browser',
    keys: ['cookies_disabled', 'browser_too_old', 'data_missing', 'solver_failed', 'too_many_attempts', 'network_error', 'server_rejected'],
  },
  {
    group: 'server',
    keys: ['bad_request', 'challenge_invalid', 'challenge_wrong_site', 'challenge_expired', 'challenge_wrong_client', 'proof_wrong', 'challenge_used', 'upstream_missing', 'upstream_down'],
  },
]

/** Labels whose help text has a `{placeholder}` explanation. */
export const LABEL_HELP: Partial<Record<keyof Labels, true>> = { solver_failed: true, server_rejected: true }

export const PALETTE_ROLES: (keyof Palette)[] = [
  'background',
  'surface',
  'text',
  'muted',
  'accent',
  'accent_text',
  'border',
  'success',
  'danger',
]

/** Language codes accepted by the add-language dialog (same rule as the legacy UI). */
export const LANG_CODE = /^[a-z]{2,3}(-[a-z0-9]{2,8})?$/

export const HEX6 = /^#[0-9a-fA-F]{6}$/
export const HEXANY = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

/** A 6-digit hex color for the native color input (anything unusable becomes black). */
export function toHex6(value: string): string {
  if (!value) return '#000000'
  if (HEX6.test(value)) return value.toLowerCase()
  if (/^#[0-9a-fA-F]{3,4}$/.test(value)) {
    return '#' + value.slice(1, 4).split('').map((c) => c + c).join('').toLowerCase()
  }
  if (/^#[0-9a-fA-F]{8}$/.test(value)) return value.slice(0, 7).toLowerCase()
  return '#000000'
}

export function blankTexts(): PageTexts {
  return {
    checking: { heading: '', message: '' },
    success: { heading: '', message: '' },
    denied: { heading: '', message: '' },
    error: { heading: '', message: '' },
  }
}

export function normalizeLabels(labels?: Partial<Labels> | null): Labels {
  const out = {} as Labels
  for (const group of LABEL_GROUPS) for (const k of group.keys) out[k] = labels?.[k] ?? ''
  return out
}

export function normalizeTranslation(tr?: Partial<PageTranslation> | null): PageTranslation {
  const texts = blankTexts()
  for (const st of PAGE_STATES) {
    texts[st] = { heading: tr?.texts?.[st]?.heading ?? '', message: tr?.texts?.[st]?.message ?? '' }
  }
  return {
    title: tr?.title ?? '',
    texts,
    retry_label: tr?.retry_label ?? '',
    continue_label: tr?.continue_label ?? '',
    noscript: tr?.noscript ?? '',
    footer_text: tr?.footer_text ?? '',
    labels: normalizeLabels(tr?.labels),
  }
}

/** Fills the gaps of a page (used for the built-in defaults). Returns a new object. */
export function normalizePage(pg: Page): Page {
  const translations: Record<string, PageTranslation> = {}
  for (const [code, tr] of Object.entries(pg.translations ?? {})) translations[code] = normalizeTranslation(tr)
  const auto = !!pg.auto_language
  return {
    ...pg,
    translations,
    labels: normalizeLabels(pg.labels),
    auto_language: auto,
    language: pg.language || (auto ? 'auto' : pg.lang || 'en'),
  }
}

/** A new translation, pre-filled from Tamamo's built-in one when there is one. */
export function newTranslation(builtin?: PageTranslation): PageTranslation {
  return normalizeTranslation(builtin ? structuredClone(builtin) : null)
}

// ---- color presets (legacy THEMES) ----------------------------------------

export interface ThemeDef {
  id: string
  /** Colors of the built-in default page (the "Tamamo" preset). */
  light?: Palette
  dark?: Palette
  /** Extra page fields the preset sets (the terminal preset uses a mono font). */
  extra?: Partial<Pick<Page, 'font'>>
}

export const THEMES: ThemeDef[] = [
  { id: 'tamamo' },
  {
    id: 'midnight',
    light: { background: '#eef2f7', surface: '#ffffff', text: '#0f172a', muted: '#64748b', accent: '#4f46e5', accent_text: '#ffffff', border: '#e2e8f0', success: '#16a34a', danger: '#dc2626' },
    dark: { background: '#020617', surface: '#0f172a', text: '#e2e8f0', muted: '#94a3b8', accent: '#818cf8', accent_text: '#0f172a', border: '#1e293b', success: '#4ade80', danger: '#f87171' },
  },
  {
    id: 'paper',
    light: { background: '#f5f1e8', surface: '#fffdf7', text: '#292524', muted: '#78716c', accent: '#9a3412', accent_text: '#fffdf7', border: '#e7e0d0', success: '#3f6212', danger: '#b91c1c' },
    dark: { background: '#1c1917', surface: '#292524', text: '#f5f5f4', muted: '#a8a29e', accent: '#fb923c', accent_text: '#1c1917', border: '#44403c', success: '#a3e635', danger: '#f87171' },
  },
  {
    id: 'sakura',
    light: { background: '#fdf2f8', surface: '#ffffff', text: '#500724', muted: '#9d6b85', accent: '#db2777', accent_text: '#ffffff', border: '#fbcfe8', success: '#16a34a', danger: '#e11d48' },
    dark: { background: '#1f0a17', surface: '#2d1324', text: '#fce7f3', muted: '#d8a7c3', accent: '#f472b6', accent_text: '#1f0a17', border: '#4a1d3a', success: '#4ade80', danger: '#fb7185' },
  },
  {
    id: 'forest',
    light: { background: '#f0f5ef', surface: '#ffffff', text: '#14261a', muted: '#5b7262', accent: '#2f7d4f', accent_text: '#ffffff', border: '#d5e3d6', success: '#15803d', danger: '#b91c1c' },
    dark: { background: '#0b140e', surface: '#13201a', text: '#e3efe6', muted: '#8fa898', accent: '#5bbf85', accent_text: '#0b140e', border: '#21352a', success: '#4ade80', danger: '#f87171' },
  },
  {
    id: 'terminal',
    light: { background: '#f4f4f0', surface: '#ffffff', text: '#111111', muted: '#555555', accent: '#0a7d32', accent_text: '#ffffff', border: '#cccccc', success: '#0a7d32', danger: '#c00000' },
    dark: { background: '#000000', surface: '#0a0a0a', text: '#33ff66', muted: '#22b84a', accent: '#33ff66', accent_text: '#000000', border: '#1a3d22', success: '#33ff66', danger: '#ff5555' },
    extra: { font: 'mono' },
  },
  {
    id: 'contrast',
    light: { background: '#ffffff', surface: '#ffffff', text: '#000000', muted: '#262626', accent: '#a3001b', accent_text: '#ffffff', border: '#000000', success: '#005a00', danger: '#a3001b' },
    dark: { background: '#000000', surface: '#000000', text: '#ffffff', muted: '#e5e5e5', accent: '#ffd400', accent_text: '#000000', border: '#ffffff', success: '#7cfc00', danger: '#ff6b6b' },
  },
]

/** The palettes a preset sets: its own, or the built-in default ones for "Tamamo". */
export function resolveTheme(theme: ThemeDef, defaults: Page): { light: Palette; dark: Palette } {
  return { light: theme.light ?? defaults.light, dark: theme.dark ?? defaults.dark }
}

// ---- custom CSS targets (legacy CSS_TARGETS) -------------------------------

/** Selectors shown in the Advanced tab, with the key of their description (cssTarget.<key>). */
export const CSS_TARGETS: [selector: string, key: string][] = [
  ['.tm-bg', 'bg'],
  ['.tm-shell, .tm-main', 'shell'],
  ['.tm-panel', 'panel'],
  ['.tm-figure, .tm-mascot', 'figure'],
  ['.tm-content', 'content'],
  ['.tm-heading', 'heading'],
  ['.tm-message', 'message'],
  ['.tm-work', 'work'],
  ['.tm-bar, .tm-bar-fill', 'bar'],
  ['.tm-ring, .tm-ring-fill', 'ring'],
  ['.tm-dots, .tm-spinner', 'dots'],
  ['.tm-stats, .tm-stat', 'stats'],
  ['.tm-actions, .tm-btn', 'actions'],
  ['.tm-footer-text', 'footer'],
  ['--tm-bg, --tm-surface, --tm-text, --tm-muted', 'palette'],
  ['--tm-accent, --tm-accent-text, --tm-border', 'palette'],
  ['--tm-success, --tm-danger', 'palette'],
  ['--tm-font, --tm-scale, --tm-heading-weight', 'type'],
  ['--tm-card-width, --tm-radius', 'size'],
  ['--tm-mascot-size, --tm-bg-blur, --tm-bg-dim', 'mascot'],
]

/** A language's name in the UI language, with its code, e.g. "Русский (ru)". */
export function langLabel(code: string): string {
  if (!code) return ''
  try {
    const name = new Intl.DisplayNames([currentLanguage()], { type: 'language' }).of(code)
    if (name && name.toLowerCase() !== code.toLowerCase()) return `${name} (${code})`
  } catch {
    // unknown code: show it as typed
  }
  return code
}
