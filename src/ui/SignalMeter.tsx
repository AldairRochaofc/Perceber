import { useId } from 'react'
import { SIGNALS, SIGNAL_ORDER } from '../domain/signals'
import type { SignalLevel } from '../domain/types'
import { cx } from './cx'
import { PatternDef } from './patterns'

/** Medidor de quatro faixas. Texto + padrão + profundidade do azul. */
export function SignalMeter({ level, compact }: { level: SignalLevel; compact?: boolean }) {
  const id = useId()
  const current = SIGNALS[level]
  return (
    <figure className="grid gap-3">
      <figcaption className="sr-only">
        {current.step >= 0 ? `Faixa ${current.step + 1} de 4: ${current.label}.` : `${current.label}: sem faixa indicada.`}
      </figcaption>
      <div aria-hidden="true" className="grid grid-cols-4 gap-1.5">
        {SIGNAL_ORDER.map((l, i) => {
          const s = SIGNALS[l]
          const active = current.step >= 0 && i <= current.step
          const here = i === current.step
          return (
            <div key={l} className="grid gap-2">
              <svg viewBox="0 0 100 14" preserveAspectRatio="none" className={cx('w-full overflow-visible', compact ? 'h-2.5' : 'h-3.5')}>
                <defs>
                  <PatternDef id={`${id}-${l}`} pattern={s.pattern} color={s.colorVar} />
                </defs>
                <rect x="0" y="0" width="100" height="14" rx="7" style={{ fill: 'var(--color-surface-sunken)' }} />
                {active && <rect x="0" y="0" width="100" height="14" rx="7" fill={`url(#${id}-${l})`} />}
                {here && <rect x="0.75" y="0.75" width="98.5" height="12.5" rx="6.25" fill="none" style={{ stroke: s.colorVar }} strokeWidth="1.5" />}
              </svg>
              {!compact && (
                <span className={cx('text-caption leading-tight', here ? 'font-semibold text-ink' : 'text-text-subtle')}>{s.label}</span>
              )}
            </div>
          )
        })}
      </div>
    </figure>
  )
}
