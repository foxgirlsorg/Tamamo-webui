// Small pictures for the layout and background choices (legacy layoutThumb / bgThumb).

import type { CSSProperties } from 'react'

export function LayoutThumb({ kind }: { kind: 'card' | 'split' | 'minimal' }) {
  const box: CSSProperties = { fill: 'var(--card)', stroke: 'var(--border)' }
  const dot: CSSProperties = { fill: 'var(--primary)' }
  return (
    <svg viewBox="0 0 120 64" className="size-full text-muted-foreground" fill="none" aria-hidden>
      {kind === 'card' ? (
        <>
          <rect x="34" y="8" width="52" height="48" rx="5" style={box} />
          <circle cx="60" cy="22" r="7" style={dot} opacity=".75" />
          <rect x="44" y="34" width="32" height="4" rx="2" fill="currentColor" />
          <rect x="48" y="42" width="24" height="3" rx="1.5" fill="currentColor" opacity=".5" />
        </>
      ) : kind === 'split' ? (
        <>
          <rect x="14" y="10" width="92" height="44" rx="5" style={box} />
          <circle cx="38" cy="32" r="12" style={dot} opacity=".75" />
          <rect x="60" y="24" width="34" height="4" rx="2" fill="currentColor" />
          <rect x="60" y="33" width="26" height="3" rx="1.5" fill="currentColor" opacity=".5" />
        </>
      ) : (
        <>
          <circle cx="60" cy="20" r="8" style={dot} opacity=".75" />
          <rect x="40" y="34" width="40" height="4" rx="2" fill="currentColor" />
          <rect x="46" y="43" width="28" height="3" rx="1.5" fill="currentColor" opacity=".5" />
        </>
      )}
    </svg>
  )
}

const BG_STYLES: Record<'solid' | 'dots' | 'grid' | 'stripes' | 'image', CSSProperties> = {
  solid: { background: 'var(--muted)' },
  dots: {
    backgroundImage: 'radial-gradient(circle at 1px 1px, var(--muted-foreground) 1px, transparent 0)',
    backgroundSize: '8px 8px',
    backgroundColor: 'var(--muted)',
  },
  grid: {
    backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
    backgroundSize: '10px 10px',
    backgroundColor: 'var(--muted)',
  },
  stripes: { backgroundImage: 'repeating-linear-gradient(45deg, var(--border) 0 4px, var(--muted) 4px 10px)' },
  image: { backgroundImage: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 45%, transparent), var(--muted) 60%)' },
}

export function BgThumb({ kind }: { kind: keyof typeof BG_STYLES }) {
  return <div aria-hidden className="size-full" style={BG_STYLES[kind]} />
}
