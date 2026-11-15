import { useId, useState } from 'react'
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Field } from '@/components/fields'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { ModuleField } from '@/lib/types'
import { cn } from '@/lib/utils'

import { extraSettingKeys, renameSetting, settingError } from './helpers'

type Settings = Record<string, string>

const TRUE_VALUES = ['true', '1', 'yes', 'on']

/**
 * The form for the settings a module declares. Each field type gets its own
 * control. Values are stored as strings, as in tamamo.yaml; an empty value is
 * removed so the module's default applies.
 */
export function DeclaredSettings({
  fields,
  settings,
  onChange,
}: {
  fields: ModuleField[]
  settings: Settings
  onChange: (next: Settings) => void
}) {
  const { t } = useTranslation()
  const baseId = useId()
  if (!fields.length) return <p className="text-sm text-muted-foreground">{t('modules.noSettings')}</p>

  const set = (name: string, value: string) => {
    const next = { ...settings }
    if (value === '') delete next[name]
    else next[name] = value
    onChange(next)
  }

  return (
    <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
      {fields.map((f) => (
        <SettingField key={f.name} id={`${baseId}-${f.name}`} field={f} value={settings[f.name]} onChange={(v) => set(f.name, v)} />
      ))}
    </div>
  )
}

function SettingField({
  id,
  field: f,
  value,
  onChange,
}: {
  id: string
  field: ModuleField
  value: string | undefined
  onChange: (value: string) => void
}) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const error = settingError(t, f, value)
  const helpId = `${id}-help`
  const wide = f.type === 'textarea' || f.type === 'list' || f.type === 'bool'
  const current = value ?? ''
  const placeholder = f.placeholder || f.default || undefined

  const help = [f.description, f.type === 'list' ? t('modules.listHelp') : ''].filter(Boolean).join(' ')
  const label = (
    <span className="flex flex-wrap items-center gap-2">
      {f.label || f.name}
      {f.required ? <span className="text-xs font-normal text-muted-foreground">{t('modules.required')}</span> : null}
    </span>
  )

  if (f.type === 'bool') {
    const on = TRUE_VALUES.includes((current || f.default).trim().toLowerCase())
    return (
      <div className="flex items-start justify-between gap-4 rounded-lg border p-3 sm:col-span-2">
        <div className="min-w-0 space-y-1">
          <Label htmlFor={id}>{f.label || f.name}</Label>
          {f.description ? (
            <p id={helpId} className="text-xs text-muted-foreground">
              {f.description}
            </p>
          ) : null}
        </div>
        <Switch
          id={id}
          checked={on}
          aria-describedby={f.description ? helpId : undefined}
          onCheckedChange={(v) => onChange(v ? 'true' : 'false')}
        />
      </div>
    )
  }

  const common = {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-required': f.required || undefined,
    'aria-describedby': help ? helpId : undefined,
  }

  let control
  switch (f.type) {
    case 'select':
      control = (
        <Select value={current || f.default || undefined} onValueChange={onChange}>
          <SelectTrigger {...common} className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {f.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label || o.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
      break
    case 'textarea':
    case 'list':
      control = (
        <Textarea
          {...common}
          className={cn('min-h-24', f.type === 'list' && 'font-mono')}
          value={current}
          placeholder={placeholder}
          spellCheck={f.type === 'textarea'}
          onChange={(e) => onChange(e.target.value)}
        />
      )
      break
    case 'number':
      control = (
        <Input
          {...common}
          type="number"
          inputMode="numeric"
          value={current}
          placeholder={placeholder}
          min={f.min !== 0 || f.max !== 0 ? f.min : undefined}
          max={f.min !== 0 || f.max !== 0 ? f.max : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      )
      break
    case 'secret':
      control = (
        <div className="flex items-center gap-1">
          <Input
            {...common}
            className="font-mono"
            type={visible ? 'text' : 'password'}
            value={current}
            placeholder={f.placeholder || undefined}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => onChange(e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={visible ? t('modules.secretHide') : t('modules.secretShow')}
            aria-pressed={visible}
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
          </Button>
        </div>
      )
      break
    default:
      control = (
        <Input
          {...common}
          value={current}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
        />
      )
  }

  return (
    <Field id={id} label={label} help={help || undefined} error={error || undefined} className={wide ? 'sm:col-span-2' : undefined}>
      {control}
    </Field>
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

      <Button type="button" variant="outline" size="sm" disabled={hasEmptyKey} onClick={() => onChange({ ...settings, '': '' })}>
        <Plus aria-hidden />
        {t('modules.kvAdd')}
      </Button>
    </div>
  )
}
