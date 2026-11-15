import { useState, type ReactNode } from 'react'

import { Field } from '@/components/fields'
import { Textarea } from '@/components/ui/textarea'

/** One entry per line, trimmed, without blanks. */
function parseLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

/**
 * A textarea with one list entry per line. The text stays as typed; the draft
 * receives the parsed list. When the list changes from outside (discard, save),
 * the text is rebuilt from it.
 */
export function ListTextarea({
  id,
  label,
  help,
  placeholder,
  rows = 4,
  list,
  onChange,
  envName,
}: {
  id: string
  label: ReactNode
  help: string
  placeholder?: string
  rows?: number
  list: string[]
  onChange?: (list: string[]) => void
  /** Environment variable that fixes this list. When set, the field is read-only. */
  envName?: string
}) {
  const joined = list.join('\n')
  const [text, setText] = useState(joined)
  const [seen, setSeen] = useState(joined)

  // Adjust during render when the list changed from outside (discard, save, lock).
  if (joined !== seen) {
    setSeen(joined)
    if (parseLines(text).join('\n') !== joined) setText(joined)
  }

  const readOnly = !!envName
  return (
    <Field id={id} label={label} help={help} lockedBy={envName}>
      <Textarea
        id={id}
        className="font-mono text-[0.8125rem]"
        rows={rows}
        placeholder={placeholder}
        spellCheck={false}
        value={text}
        readOnly={readOnly}
        aria-describedby={`${id}-help`}
        onChange={(e) => {
          const next = e.target.value
          setText(next)
          onChange?.(parseLines(next))
        }}
      />
    </Field>
  )
}

