import { useMemo } from 'react'
import { domainsIn } from '../../domain/domains'
import { ContourMap } from '../../ui/ContourMap'
import type { Peak } from '../../ui/contours'
import { INFINITY_PATH } from '../../ui/Logo'

const W = 700
const H = 540
const CX = W / 2
const CY = H / 2 + 6

/**
 * O mapa vazio da página inicial: os seis domínios centrais orbitam o ∞
 * sobre curvas de nível neutras. No resultado, o mesmo mapa ganha relevo
 * com as respostas da pessoa.
 */
export function HeroMap() {
  const nodes = useMemo(
    () =>
      domainsIn('central').map((d, i, all) => {
        const angle = -Math.PI / 2 + (i / all.length) * Math.PI * 2 + 0.32
        return { d, x: CX + Math.cos(angle) * 176, y: CY + Math.sin(angle) * 168, left: Math.cos(angle) < -0.2 }
      }),
    [],
  )
  const peaks: Peak[] = useMemo(
    () => [
      { x: CX, y: CY, h: 1, sigma: 118 },
      ...nodes.map((n, i) => ({ x: n.x, y: n.y, h: 0.36 + (i % 3) * 0.08, sigma: 46 + (i % 2) * 10 })),
    ],
    [nodes],
  )
  const levels = useMemo(() => Array.from({ length: 9 }, (_, i) => 0.12 + i * 0.105), [])

  return (
    <ContourMap width={W} height={H} peaks={peaks} levels={levels} ripple={0.035} className="max-w-[40rem]">
      <g aria-hidden="true">
        {nodes.map((n) => (
          <line key={`l-${n.d.id}`} x1={CX} y1={CY} x2={n.x} y2={n.y} style={{ stroke: 'var(--color-accent)' }} strokeOpacity="0.18" strokeDasharray="2 5" />
        ))}
        {nodes.map((n) => {
          const labelW = n.d.short.length * 8.4 + 52
          const lx = Math.min(W - labelW - 6, Math.max(6, n.left ? n.x - labelW - 14 : n.x + 14))
          return (
            <g key={n.d.id} data-node>
              <circle cx={n.x} cy={n.y} r={11} style={{ fill: 'var(--color-accent)' }} opacity="0.14" />
              <circle cx={n.x} cy={n.y} r={5} style={{ fill: 'var(--color-accent)' }} />
              <g transform={`translate(${lx} ${n.y - 17})`}>
                <rect width={labelW} height={34} rx={17} style={{ fill: 'var(--color-surface)', stroke: 'var(--color-line)' }} />
                <text x={16} y={21.5} className="font-mono" style={{ fill: 'var(--color-text-subtle)', fontSize: 10.5, letterSpacing: '0.04em' }}>
                  {n.d.code}
                </text>
                <text x={52} y={22} style={{ fill: 'var(--color-ink)', fontSize: 13.5, fontWeight: 600, fontFamily: 'var(--font-sans)' }}>
                  {n.d.short}
                </text>
              </g>
            </g>
          )
        })}
        <g data-node>
          <circle cx={CX} cy={CY} r={62} style={{ fill: 'var(--color-accent)' }} opacity="0.08" />
          <circle cx={CX} cy={CY} r={46} fill="url(#hero-core)" />
          <defs>
            <radialGradient id="hero-core" cx="35%" cy="30%" r="80%">
              <stop offset="0" stopColor="#5b8cff" />
              <stop offset="0.55" stopColor="#2563eb" />
              <stop offset="1" stopColor="#0a1a47" />
            </radialGradient>
          </defs>
          <g transform={`translate(${CX - 30} ${CY - 30}) scale(2.5)`}>
            <path d={INFINITY_PATH} fill="none" stroke="#fff" strokeWidth="0.95" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>
      </g>
    </ContourMap>
  )
}
