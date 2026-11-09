// Form controls for the designer. Built from shadcn components; the shared
// Field and NumberField come from src/components/fields.tsx.

import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Field, NumberField } from '@/components/fields'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

import { HEXANY, toHex6 } from './page-model'

/** Renders `code` spans written in backticks, as the legacy help text did. */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/).map((part, i) =>
        part.length > 1 && part.startsWith('`') && part.endsWith('`') ? (
          <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

interface TextFieldProps {
  id: string
  label: ReactNode
  value: string
  onChange: (value: string) => void
  help?: ReactNode
  placeholder?: string
  mono?: boolean
  lang?: string
  onFocus?: () => void
}

export function TextField({ id, label, value, onChange, help, placeholder, mono, lang, onFocus }: TextFieldProps) {
  return (
    <Field id={id} label={label} help={help}>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        lang={lang}
        spellCheck={false}
        autoComplete="off"
        className={cn(mono && 'font-mono')}
        aria-describedby={help ? `${id}-help` : undefined}
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  )
}

interface TextAreaProps extends Omit<TextFieldProps, 'mono'> {
  rows?: number
  mono?: boolean
  error?: string
}

export function TextArea({ id, label, value, onChange, help, placeholder, rows = 3, mono, lang, onFocus, error }: TextAreaProps) {
  return (
    <Field id={id} label={label} help={help} error={error}>
      <Textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        lang={lang}
        className={cn(mono && 'font-mono text-[0.8125rem]')}
        spellCheck={!mono}
        aria-invalid={error ? true : undefined}
        aria-describedby={help ? `${id}-help` : undefined}
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  )
}

interface NumberInputProps {
  id: string
  label: ReactNode
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
  help?: ReactNode
}

export function NumberInput({ id, label, value, onChange, min, max, step, suffix, help }: NumberInputProps) {
  return (
    <Field id={id} label={label} help={help}>
      <NumberField id={id} value={value} onChange={onChange} min={min} max={max} step={step} suffix={suffix} aria-describedby={help ? `${id}-help` : undefined} />
    </Field>
  )
}

interface SliderFieldProps {
  id: string
  label: ReactNode
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  format?: (value: number) => string
  help?: ReactNode
}

export function SliderField({ id, label, value, onChange, min, max, step = 1, format = String, help }: SliderFieldProps) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        <output htmlFor={id} className="text-sm tabular-nums text-muted-foreground">
          {format(value)}
        </output>
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => {
          const next = v[0]
          if (next !== undefined) onChange(next)
        }}
      />
      {help ? (
        <p id={`${id}-help`} className="text-xs text-muted-foreground">
          {help}
        </p>
      ) : null}
    </div>
  )
}

interface SwitchRowProps {
  id: string
  label: ReactNode
  desc?: ReactNode
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function SwitchRow({ id, label, desc, checked, onCheckedChange }: SwitchRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="grid gap-1">
        <Label htmlFor={id} className="font-medium">
          {label}
        </Label>
        {desc ? (
          <p id={`${id}-desc`} className="text-xs text-muted-foreground">
            {desc}
          </p>
        ) : null}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} aria-describedby={desc ? `${id}-desc` : undefined} className="mt-0.5 shrink-0" />
    </div>
  )
}

export interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps {
  id: string
  label: ReactNode
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  help?: ReactNode
}

/** shadcn Select for a short fixed list (never a native select). */
export function SelectField({ id, label, value, options, onChange, help }: SelectFieldProps) {
  return (
    <Field id={id} label={label} help={help}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full" aria-describedby={help ? `${id}-help` : undefined}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

export interface RadioOption<T extends string> {
  value: T
  title: ReactNode
  icon?: ReactNode
  desc?: ReactNode
  thumb?: ReactNode
}

interface RadioCardsProps<T extends string> {
  id: string
  label: ReactNode
  value: T
  options: RadioOption<T>[]
  onChange: (value: T) => void
  columns?: 2 | 3
}

/** A group of choices shown as selectable cards, with optional thumbnails. */
export function RadioCards<T extends string>({ id, label, value, options, onChange, columns = 3 }: RadioCardsProps<T>) {
  const labelId = `${id}-label`
  return (
    <div className="grid gap-2">
      <span id={labelId} className="text-sm font-medium">
        {label}
      </span>
      <RadioGroup value={value} onValueChange={(v) => onChange(v as T)} aria-labelledby={labelId} className={columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}>
        {options.map((o) => {
          const itemId = `${id}-${o.value}`
          return (
            <Label
              key={o.value}
              htmlFor={itemId}
              className="flex cursor-pointer flex-col gap-2 rounded-lg border p-3 font-normal transition-colors hover:bg-accent/40 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <RadioGroupItem id={itemId} value={o.value} />
                {o.icon}
                {o.title}
              </span>
              {o.thumb ? <span aria-hidden className="block h-14 overflow-hidden rounded-md border bg-muted/40">{o.thumb}</span> : null}
              {o.desc ? <span className="text-xs text-muted-foreground">{o.desc}</span> : null}
            </Label>
          )
        })}
      </RadioGroup>
    </div>
  )
}

interface ColorFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}

/** Color swatch (native picker) plus a hex text box. Invalid hex is flagged and not saved. */
export function ColorField({ id, label, value, onChange }: ColorFieldProps) {
  const { t } = useTranslation()
  const [text, setText] = useState(value)
  const [shownValue, setShownValue] = useState(value)
  // Follow changes made elsewhere (presets, the picker): adjust during render, not in an effect.
  if (value !== shownValue) {
    setShownValue(value)
    setText(value)
  }
  const valid = HEXANY.test(text.trim())

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="color"
          value={toHex6(value)}
          aria-label={t('page.colourPicker', { name: label })}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 shrink-0 cursor-pointer p-1"
        />
        <Input
          id={id}
          value={text}
          maxLength={9}
          spellCheck={false}
          autoComplete="off"
          className="font-mono"
          aria-invalid={!valid}
          aria-describedby={valid ? undefined : `${id}-error`}
          onChange={(e) => {
            const next = e.target.value
            setText(next)
            const trimmed = next.trim()
            if (HEXANY.test(trimmed)) onChange(trimmed)
          }}
        />
      </div>
      {valid ? null : (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">
          {t('page.colourError')}
        </p>
      )}
    </div>
  )
}
