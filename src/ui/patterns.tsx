import { useId } from 'react'
import type { SignalPattern } from '../domain/signals'

/**
 * Padrões gráficos que acompanham cada faixa de sinal, para que a leitura
 * nunca dependa só da cor (WCAG 1.4.1).
 */
export function PatternDef({ id, pattern, color }: { id: string; pattern: SignalPattern; color: string }) {
  switch (pattern) {
    case 'grid':
      return (
        <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" style={{ fill: color }} opacity="0.22" />
          <path d="M6 0H0V6" fill="none" style={{ stroke: color }} strokeWidth="1.1" />
        </pattern>
      )
    case 'waves':
      return (
        <pattern id={id} width="10" height="6" patternUnits="userSpaceOnUse">
          <rect width="10" height="6" style={{ fill: color }} opacity="0.3" />
          <path d="M0 3c2.5-3 5 3 10 0" fill="none" style={{ stroke: color }} strokeWidth="1.4" />
        </pattern>
      )
    case 'nodes':
      return (
        <pattern id={id} width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" style={{ fill: color }} opacity="0.55" />
          <circle cx="4" cy="4" r="1.7" style={{ fill: color }} />
          <path d="M4 4L8 0M4 4L0 8" style={{ stroke: color }} strokeWidth="0.9" />
        </pattern>
      )
    case 'contour':
      return (
        <pattern id={id} width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" style={{ fill: color }} />
          <circle cx="6" cy="6" r="4.2" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="0.9" />
          <circle cx="6" cy="6" r="1.8" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="0.9" />
        </pattern>
      )
    default:
      return (
        <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M0 6L6 0" style={{ stroke: color }} strokeWidth="1" strokeDasharray="1.5 1.5" />
        </pattern>
      )
  }
}

export function PatternSwatch({ pattern, color, size = 44, className }: { pattern: SignalPattern; color: string; size?: number; className?: string }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden="true" className={className}>
      <defs>
        <PatternDef id={id} pattern={pattern} color={color} />
      </defs>
      <rect width="44" height="44" rx="12" fill={`url(#${id})`} />
      <rect x="0.5" y="0.5" width="43" height="43" rx="11.5" fill="none" style={{ stroke: color }} strokeOpacity="0.5" />
    </svg>
  )
}
