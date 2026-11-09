import { Fragment } from 'react'

/** Renders text where `backticked` parts become inline code (the legacy help-text convention). */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/`([^`]+)`/).map((part, i) =>
        i % 2 === 1 ? (
          <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
            {part}
          </code>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}
