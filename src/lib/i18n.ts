import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '@/locales/en.json'
import ru from '@/locales/ru.json'
import uk from '@/locales/uk.json'

/**
 * UI translations. English is the default and the fallback. There is no browser
 * language detection: the language changes only when the user picks one in
 * Settings → Interface, and that choice is stored in localStorage.
 *
 * Keys are nested (`nav.overview`). Placeholders use single braces (`{name}`).
 * Plurals use i18next suffixes: `t('pw.more', { count: n, n })` picks
 * `pw.more_one`, `pw.more_few`, `pw.more_many` or `pw.more_other`.
 */

export const LANG_STORAGE_KEY = 'tamamo.lang'
export const DEFAULT_LANG = 'en'

export interface LanguageOption {
  /** BCP 47-style code, also the file name in src/locales. */
  code: string
  /** The language's own name, e.g. "Русский". */
  name: string
}

const resources = {
  en: { translation: en },
  ru: { translation: ru },
  uk: { translation: uk },
} as const

/** Every bundled language, in the order shown in the picker. */
export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: en._meta.name },
  { code: 'ru', name: ru._meta.name },
  { code: 'uk', name: uk._meta.name },
]

const CODES = LANGUAGES.map((l) => l.code)

function readStoredLanguage(): string | null {
  try {
    const v = window.localStorage.getItem(LANG_STORAGE_KEY)
    return v && CODES.includes(v) ? v : null
  } catch {
    return null // storage blocked
  }
}

function applyDocumentLanguage(code: string) {
  document.documentElement.lang = code
}

i18n.use(initReactI18next).init({
  resources,
  // Only the explicit choice counts; otherwise English.
  lng: readStoredLanguage() ?? DEFAULT_LANG,
  fallbackLng: DEFAULT_LANG,
  supportedLngs: CODES,
  nonExplicitSupportedLngs: false,
  initAsync: false,
  interpolation: {
    prefix: '{',
    suffix: '}',
    // React escapes output already.
    escapeValue: false,
  },
  returnNull: false,
})

applyDocumentLanguage(i18n.language)

/** Switches the UI language and remembers the choice. */
export async function setLanguage(code: string): Promise<void> {
  if (!CODES.includes(code)) return
  await i18n.changeLanguage(code)
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, code)
  } catch {
    // storage blocked: the choice lasts for this page only
  }
  applyDocumentLanguage(code)
}

/** The active language code. */
export function currentLanguage(): string {
  return i18n.language
}

// Number, date and time formatting follow the active UI language.

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(i18n.language, options).format(value)
}

export function formatDateTime(value: Date | string | number): string {
  return new Date(value).toLocaleString(i18n.language)
}

export function formatRelativeTime(value: Date | string | number): string {
  const diffSeconds = Math.round((new Date(value).getTime() - Date.now()) / 1000)
  const abs = Math.abs(diffSeconds)
  const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' })
  if (abs < 60) return rtf.format(diffSeconds, 'second')
  if (abs < 3600) return rtf.format(Math.round(diffSeconds / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diffSeconds / 3600), 'hour')
  return rtf.format(Math.round(diffSeconds / 86400), 'day')
}

export default i18n
