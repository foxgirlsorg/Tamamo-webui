import { useId, type ComponentProps, type ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormItem } from '@/components/ui/form'
import { cn } from '@/lib/utils'

/** Shows that a setting is fixed by an environment variable. */
export function LockedBadge({ env, className }: { env: string; className?: string }) {
  const { t } = useTranslation()
  return (
    <Badge variant="outline" className={cn('gap-1 font-mono text-xs', className)} title={t('lock.title', { env })}>
      <Lock className="size-3" aria-hidden />
      {t('lock.badge', { env })}
    </Badge>
  )
}

interface FieldProps {
  /** Id of the control inside (also used by the label and help text). */
  id: string
  label?: ReactNode
  /** Help text under the control. */
  help?: ReactNode
  /** Environment variable name when the setting is locked. */
  lockedBy?: string
  /** Validation message, shown in the destructive color. */
  error?: string
  className?: string
  children: ReactNode
}

/**
 * Label, control, help text and lock badge in one block. Use it with a shadcn
 * `Input`/`Select` etc. For react-hook-form, render the control inside
 * `FormControl` as usual and pass the same id here.
 */
export function Field({ id, label, help, lockedBy, error, className, children }: FieldProps) {
  const helpId = `${id}-help`
  const errorId = `${id}-error`
  return (
    <FormItem className={cn('gap-2', className)}>
      {label || lockedBy ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {label ? <Label htmlFor={id}>{label}</Label> : <span />}
          {lockedBy ? <LockedBadge env={lockedBy} /> : null}
        </div>
      ) : null}
      {children}
      {help ? (
        <p id={helpId} className="text-xs text-muted-foreground">
          {help}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </FormItem>
  )
}

interface NumberFieldProps extends Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  /** Unit shown after the number, e.g. "hours". */
  suffix?: string
}

/**
 * Number input that clamps to [min, max] when it loses focus. Typing an
 * incomplete number does not change the saved value.
 */
export function NumberField({ value, onChange, min, max, step = 1, suffix, className, ...props }: NumberFieldProps) {
  const id = useId()
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Input
        {...props}
        id={props.id ?? id}
        type="number"
        inputMode="numeric"
        value={Number.isFinite(value) ? value : ''}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const parsed = e.currentTarget.valueAsNumber
          if (Number.isFinite(parsed)) onChange(parsed)
        }}
        onBlur={(e) => {
          let v = e.currentTarget.valueAsNumber
          if (!Number.isFinite(v)) v = min ?? 0
          if (min !== undefined && v < min) v = min
          if (max !== undefined && v > max) v = max
          if (v !== value) onChange(v)
          props.onBlur?.(e)
        }}
      />
      {suffix ? <span className="shrink-0 text-sm text-muted-foreground">{suffix}</span> : null}
    </div>
  )
}
