import { Fragment, type ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Action } from '@/lib/types'

import { ACTIONS, RICH_TOKEN } from './helpers'

const ACTION_CLASS: Record<Action, string> = {
  allow: 'border-emerald-500/60 text-emerald-400',
  challenge: 'border-primary/60 text-primary',
  block: 'border-destructive/60 text-destructive',
}

/** Colored badge for an action (allow, challenge, block). */
export function ActionBadge({ action, label }: { action: string; label: string }) {
  const known = (ACTIONS as readonly string[]).includes(action)
  return (
    <Badge variant="outline" className={cn('font-medium', known && ACTION_CLASS[action as Action])}>
      {label}
    </Badge>
  )
}

/**
 * Renders a translated string: `backticks` become <code>, and slot markers
 * (from `slot()` in helpers.ts) become the matching node in `slots`.
 */
export function rich(text: string, slots: Record<string, ReactNode> = {}): ReactNode {
  const re = new RegExp(RICH_TOKEN.source, 'g')
  const out: ReactNode[] = []
  let last = 0
  let i = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[1] !== undefined) {
      out.push(<Fragment key={i++}>{slots[m[1]] ?? ''}</Fragment>)
    } else {
      out.push(
        <code key={i++} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
          {m[2]}
        </code>,
      )
    }
    last = re.lastIndex
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}
