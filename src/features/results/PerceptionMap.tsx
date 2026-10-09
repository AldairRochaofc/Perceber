import { useMemo } from 'react'
import { DOMAIN_BY_ID } from '../../domain/domains'
import type { DomainScore } from '../../domain/types'
import { fmtDecimal } from '../../lib/format'
import { ContourMap } from '../../ui/ContourMap'
import type { Peak } from '../../ui/contours'

const W = 720
const H = 520

/**
 * O mapa da pessoa. Cada domínio ocupa um ponto fixo; a altura do relevo
 * é a média das respostas (0–4). Mais curvas ao redor = relatos mais
 * frequentes. É uma visão de conjunto: os números estão na lista abaixo.
 */
export function PerceptionMap({ scores, animate = true }: { scores: DomainScore[]; animate?: boolean }) {
  const nodes = useMemo(
    () =>
      scores.map((s, i) => {
        const angle = -Math.PI / 2 + (i / scores.length) * Math.PI * 2 + 0.32
        const cx = W / 2 + Math.cos(angle) * 165
        const cy = H / 2 + Math.sin(angle) * 168
        return { s, x: cx, y: cy, left: Math.cos(angle) < -0.2 }
      }),
    [scores],
  )
  const peaks: Peak[] = useMemo(
    () => [
      { x: W / 2, y: H / 2, h: 0.18, sigma: 150 },
      ...nodes.map((n) => ({ x: n.x, y: n.y, h: n.s.mean === null ? 0 : (n.s.mean / 4) * 1.1, sigma: 62 })),
    ],
    [nodes],
  )
  const levels = useMemo(() => Array.from({ length: 10 }, (_, i) => 0.1 + i * 0.1), [])
  const description = scores
    .map((s) => `${DOMAIN_BY_ID[s.domain].label}: ${s.mean === null ? 'sem respostas suficientes' : `média ${fmtDecimal(s.mean)} de 4`}`)
    .join('; ')

  return (
    <ContourMap
      width={W}
      height={H}
      peaks={peaks}
      levels={levels}
      animate={animate}
      title="Mapa de relevo das suas respostas: domínios com relatos mais frequentes aparecem mais altos."
      description={description}
    >
      <g aria-hidden="true">
        {nodes.map((n) => {
          const d = DOMAIN_BY_ID[n.s.domain]
          const value = n.s.mean === null ? '—' : fmtDecimal(n.s.mean)
          const labelW = d.short.length * 8.4 + 66
          const lx = Math.min(W - labelW - 6, Math.max(6, n.left ? n.x - labelW - 16 : n.x + 16))
          const strong = (n.s.mean ?? 0) >= 2.5
          return (
            <g key={d.id} data-node>
              <circle cx={n.x} cy={n.y} r={strong ? 8 : 5.5} style={{ fill: strong ? 'var(--color-deep-3)' : 'var(--color-accent)' }} />
              <g transform={`translate(${lx} ${n.y - 17})`}>
                <rect width={labelW} height={34} rx={17} style={{ fill: 'var(--color-surface)', stroke: strong ? 'var(--color-accent-line)' : 'var(--color-line)' }} />
                <text x={16} y={22} style={{ fill: 'var(--color-ink)', fontSize: 13.5, fontWeight: 600, fontFamily: 'var(--font-sans)' }}>
                  {d.short}
                </text>
                <text x={labelW - 16} y={22} textAnchor="end" style={{ fill: 'var(--color-accent-strong)', fontSize: 13.5, fontWeight: 700, fontFamily: 'var(--font-sans)', fontVariantNumeric: 'tabular-nums' }}>
                  {value}
                </text>
              </g>
            </g>
          )
        })}
      </g>
    </ContourMap>
  )
}
