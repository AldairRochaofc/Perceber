import { DOMAIN_BY_ID } from '../domain/domains'
import { SCALE } from '../domain/items'
import { BAND_LABEL } from '../domain/scoring'
import type { DomainScore } from '../domain/types'
import { fmtDecimal, plural } from '../lib/format'
import { cx } from './cx'

/**
 * Linha por domínio: cada ponto é uma resposta (0–4), o traço vertical é a
 * média e a linha fina vai da menor à maior resposta. O texto ao lado diz o
 * mesmo em palavras — o desenho nunca é a única fonte da informação.
 */
export function DomainList({ scores, showSensitivity = true, headingLevel = 3 }: { scores: DomainScore[]; showSensitivity?: boolean; headingLevel?: 3 | 4 }) {
  const H = headingLevel === 3 ? 'h3' : 'h4'
  return (
    <div className="grid">
      <div aria-hidden="true" className="hidden grid-cols-[minmax(12rem,1fr)_minmax(14rem,1.4fr)_minmax(11rem,0.9fr)] gap-6 border-b border-line pb-2 md:grid">
        <span />
        <span className="relative h-5">
          {SCALE.map((s) => (
            <span key={s.value} className="absolute -translate-x-1/2 text-caption whitespace-nowrap text-text-subtle" style={{ left: `${(s.value / 4) * 100}%` }}>
              {s.value}
            </span>
          ))}
        </span>
        <span />
      </div>
      <ul className="grid">
        {scores.map((s) => {
          const d = DOMAIN_BY_ID[s.domain]
          const insufficient = s.band === 'insufficient'
          return (
            <li key={s.domain} className="avoid-break grid gap-3 border-b border-line py-5 md:grid-cols-[minmax(12rem,1fr)_minmax(14rem,1.4fr)_minmax(11rem,0.9fr)] md:items-center md:gap-6">
              <div className="grid gap-0.5">
                <span className="label-data text-text-subtle">{d.code}</span>
                <H className="font-display text-title">{d.label}</H>
              </div>
              <Strip score={s} />
              <div className="grid gap-0.5 text-sm">
                {insufficient ? (
                  <p className="font-semibold text-text-muted">Respostas insuficientes</p>
                ) : (
                  <p className="font-semibold text-ink">
                    Média <span className="tabular">{fmtDecimal(s.mean!)}</span>, {BAND_LABEL[s.band]}
                  </p>
                )}
                <p className="text-text-subtle tabular">
                  Escore bruto {s.raw} de {s.maxRaw} · {plural(s.answered, 'resposta', 'respostas')}
                  {s.skipped > 0 && `, ${plural(s.skipped, 'pulada', 'puladas')}`}
                </p>
                {showSensitivity && s.sensitivity !== null && !insufficient && (
                  <p className="text-text-subtle">Uma resposta muda a média em até {fmtDecimal(s.sensitivity)} ponto{s.sensitivity >= 2 ? 's' : ''}.</p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function Strip({ score, compact }: { score: DomainScore; compact?: boolean }) {
  const pct = (v: number) => `${(v / 4) * 100}%`
  // empilha pontos repetidos
  const stacks = new Map<number, number>()
  return (
    <div aria-hidden="true" className={cx('relative mx-2', compact ? 'h-6' : 'h-9')}>
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line-strong" />
      {[0, 1, 2, 3, 4].map((v) => (
        <span key={v} className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-line-strong" style={{ left: pct(v) }} />
      ))}
      {score.min !== null && score.max !== null && score.max > score.min && (
        <span className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-accent/35" style={{ left: pct(score.min), width: `${((score.max - score.min) / 4) * 100}%` }} />
      )}
      {score.values.map((v, i) => {
        const n = stacks.get(v) ?? 0
        stacks.set(v, n + 1)
        const offset = (n % 2 === 0 ? -1 : 1) * Math.ceil(n / 2) * 7
        return (
          <span
            key={i}
            className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 border-surface bg-accent"
            style={{ left: pct(v), transform: `translate(-50%, calc(-50% + ${offset}px))` }}
          />
        )
      })}
      {score.mean !== null && score.band !== 'insufficient' && (
        <span className="absolute top-1/2 h-6 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink ring-2 ring-surface" style={{ left: pct(score.mean) }} />
      )}
    </div>
  )
}
