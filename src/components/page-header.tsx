import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  /** Buttons or badges shown on the right (wraps on small screens). */
  actions?: ReactNode
  className?: string
}

/** Title, description and optional actions at the top of a screen. */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="max-w-prose text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
