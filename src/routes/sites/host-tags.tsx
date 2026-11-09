import { useRef, useState } from 'react'
import { X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface HostTagsProps {
  id: string
  value: string[]
  onChange: (next: string[]) => void
  placeholder: string
  /** Accessible name of a tag's remove button, e.g. "Remove blog.example.com". */
  removeLabel: (host: string) => string
  invalid?: boolean
  describedBy?: string
}

/**
 * Tag-style list input for host names. Enter, comma or leaving the field adds
 * what was typed; Backspace on an empty field removes the last tag. Pasting a
 * list separated by commas or new lines adds every entry. Duplicates are skipped.
 */
export function HostTags({ id, value, onChange, placeholder, removeLabel, invalid, describedBy }: HostTagsProps) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Adds the entries in raw (split on commas and new lines). Returns nothing; the
  // caller clears the typed text.
  const commit = (raw: string) => {
    const next = [...value]
    for (const part of raw.split(/[,\n]/)) {
      const host = part.trim()
      if (host && !next.includes(host)) next.push(host)
    }
    if (next.length !== value.length) onChange(next)
  }

  const flush = () => {
    commit(text)
    setText('')
  }

  return (
    <div
      className={cn(
        'flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
        invalid && 'border-destructive ring-destructive/20',
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((host, i) => (
        <Badge key={`${i}-${host}`} variant="secondary" className="gap-1 pr-1 font-mono text-xs">
          {host}
          <button
            type="button"
            aria-label={removeLabel(host)}
            className="rounded-sm p-0.5 hover:bg-foreground/10"
            onClick={(e) => {
              e.stopPropagation()
              onChange(value.filter((_, j) => j !== i))
            }}
          >
            <X className="size-3" aria-hidden />
          </button>
        </Badge>
      ))}
      <input
        ref={inputRef}
        id={id}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            flush()
          } else if (e.key === 'Backspace' && text === '' && value.length > 0) {
            onChange(value.slice(0, -1))
          }
        }}
        onBlur={flush}
        onPaste={(e) => {
          const pasted = e.clipboardData.getData('text')
          if (/[,\n]/.test(pasted)) {
            e.preventDefault()
            commit(text + pasted)
            setText('')
          }
        }}
        placeholder={value.length ? '' : placeholder}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        autoComplete="off"
        spellCheck={false}
        className="min-w-32 flex-1 bg-transparent py-0.5 font-mono text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}
