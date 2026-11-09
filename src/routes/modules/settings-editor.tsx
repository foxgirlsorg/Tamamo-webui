import { useId } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Field } from '@/components/fields'
import { Input } from '@/components/ui/input'
import type { ModuleSettingInfo } from '@/lib/types'

import { extraSettingKeys, renameSetting } from './helpers'

type Settings = Record<string, string>

/**
 * The settings a built-in Go module declares (name, description, default,
 * required). Empty values are removed from the settings, like legacy did.
 */
export function DeclaredSettings({
  defs,
  settings,
  onChange,
}: {
  defs: ModuleSettingInfo[]
  settings: Settings
  onChange: (next: Settings) => void
}) {
  const { t } = useTranslation()
  const baseId = useId()
  if (!defs.length) return <p className="text-sm text-muted-foreground">{t('modules.noSettings')}</p>

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {defs.map((d) => {
        const id = `${baseId}-${d.name}`
        const helpId = `${id}-help`
        return (
          <Field
            key={d.name}
            id={id}
            label={
              <span className="flex flex-wrap items-center gap-2">
                <code className="font-mono text-xs">{d.name}</code>
                {d.required ? <span className="text-xs text-muted-foreground">{t('modules.required')}</span> : null}
              </span>
            }
            help={d.description || undefined}
          >
            <Input
              id={id}
              className="font-mono"
              value={settings[d.name] ?? ''}
              placeholder={d.default || undefined}
              required={d.required}
              aria-required={d.required || undefined}
              aria-describedby={d.description ? helpId : undefined}
              spellCheck={false}
              autoComplete="off"
              onChange={(e) => {
                const next = { ...settings }
                if (e.target.value === '') delete next[d.name]
                else next[d.name] = e.target.value
                onChange(next)
              }}
            />
          </Field>
        )
      })}
    </div>
  )
}

/**
 * Free-form key/value settings the module reads. `known` keys are shown by the
 * form above and are left out here. Rows are derived from the settings, so the
 * draft stays the only source of truth.
 */
export function KeyValueSettings({
  settings,
  known,
  onChange,
}: {
  settings: Settings
  known: readonly string[]
  onChange: (next: Settings) => void
}) {
  const { t } = useTranslation()
  const keys = extraSettingKeys(settings, known)
  const hasEmptyKey = keys.includes('')

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h4 className="text-sm font-medium">{t('modules.kvTitle')}</h4>
        <p className="text-xs text-muted-foreground">{t('modules.kvHelp')}</p>
      </div>

      {keys.length === 0 ? <p className="text-sm text-muted-foreground">{t('modules.kvNone')}</p> : null}

      {keys.map((key, idx) => (
        <div key={idx} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-start">
          <div className="space-y-1">
            <Input
              aria-label={t('modules.kvKey')}
              className="font-mono"
              value={key}
              spellCheck={false}
              autoComplete="off"
              aria-invalid={key === '' || undefined}
              onChange={(e) => {
                const nextKey = e.target.value
                // Keys stay unique and cannot take over a field the form above owns;
                // a clashing edit is ignored.
                if (nextKey !== key && (nextKey in settings || known.includes(nextKey))) return
                onChange(renameSetting(settings, key, nextKey))
              }}
            />
            {key === '' ? <p className="text-xs text-destructive">{t('modules.kvEmptyKey')}</p> : null}
          </div>
          <Input
            aria-label={t('modules.kvValue')}
            className="font-mono"
            value={settings[key] ?? ''}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => onChange({ ...settings, [key]: e.target.value })}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('modules.kvRemove', { key: key || '' })}
            onClick={() => {
              const next = { ...settings }
              delete next[key]
              onChange(next)
            }}
          >
            <Trash2 aria-hidden />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={hasEmptyKey}
        onClick={() => onChange({ ...settings, '': '' })}
      >
        <Plus aria-hidden />
        {t('modules.kvAdd')}
      </Button>
    </div>
  )
}
