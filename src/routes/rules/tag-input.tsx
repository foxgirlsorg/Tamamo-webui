import { useState, type KeyboardEvent, type ClipboardEvent } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Field } from '@/components/fields'
import { cn } from '@/lib/utils'

interface TagInputProps {
  id: string
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  describedBy?: string
}

/**
 * A list of short strings shown as removable chips. Enter adds what is typed,
 * Backspace on an empty box removes the last chip, and pasted lines are split
 * into several chips.
 */
export function TagInput({ id, value, onChange, placeholder, describedBy }: TagInputProps) {
  const { t } = useTranslation()
  const [text, setText] = useState('')

  const add = (raw: string) => {
    const items = raw
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (!items.length) return
    const next = [...value]
    for (const item of items) if (!next.includes(item)) next.push(item)
    onChange(next)
  }

  const commit = () => {
    add(text)
    setText('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault()
      commit()
    } else if (e.key === 'Backspace' && text === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text')
    if (!/\r?\n/.test(pasted)) return
    e.preventDefault()
    add(pasted)
    setText('')
  }

  return (
    <div
      className={cn(
        'flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 shadow-xs',
        'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
      )}
    >
      {value.map((item) => (
        <Badge key={item} variant="secondary" className="max-w-full gap-1 font-mono text-xs font-normal">
          <span className="truncate">{item}</span>
          <button
            type="button"
            className="-mr-1 rounded-sm p-0.5 opacity-70 hover:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            aria-label={t('rules.tags.remove', { value: item })}
            onClick={() => onChange(value.filter((v) => v !== item))}
          >
            <X className="size-3" aria-hidden />
          </button>
        </Badge>
      ))}
      <input
        id={id}
        value={text}
        placeholder={value.length ? undefined : placeholder}
        aria-describedby={describedBy}
        onChange={(e) => setText(e.currentTarget.value)}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onBlur={commit}
        autoComplete="off"
        spellCheck={false}
        className="min-w-32 flex-1 bg-transparent py-0.5 font-mono text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}

interface TagFieldProps {
  id: string
  label: string
  help: string
  placeholder?: string
  value: string[]
  onChange: (next: string[]) => void
}

/** Label, tag input and help text together. */
export function TagField({ id, label, help, placeholder, value, onChange }: TagFieldProps) {
  const { t } = useTranslation()
  const helpId = `${id}-help`
  return (
    <Field
      id={id}
      label={label}
      help={
        <>
          {help} {t('rules.tags.hint')}
        </>
      }
    >
      <TagInput id={id} value={value} onChange={onChange} placeholder={placeholder} describedBy={helpId} />
    </Field>
  )
}
