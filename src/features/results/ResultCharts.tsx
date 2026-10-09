import { useMemo, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode, type RefObject } from 'react'
import { DOMAIN_BY_ID } from '../../domain/domains'
import { SCALE } from '../../domain/items'
import { BAND_LABEL, FREQUENT_CUTOFF, MIN_ANSWERED_PER_DOMAIN } from '../../domain/scoring'
import type { DomainScore, ScoreResult } from '../../domain/types'
import { fmtDecimal, fmtInt, plural } from '../../lib/format'
import { gsap, useGSAP, useReducedMotion } from '../../lib/motion'
import { Disclosure } from '../../ui/Disclosure'
import { SectionTitle } from '../../ui/PageHeader'
import { Table, td, th } from '../../ui/Table'
import { cx } from '../../ui/cx'

/**
 * Gráficos do resultado. Desenham os mesmos números da lista de domínios
 * (nada é calculado aqui além de contagens) e só animam quando entram na
 * tela. Com movimento reduzido, aparecem prontos. Cada barra recebe foco e
 * mostra os detalhes; a tabela no fim repete tudo em texto.
 */

type Row = {
  score: DomainScore
  label: string
  code: string
  counted: boolean // respostas suficientes para ler a média
  frequent: boolean // média ≥ 2,5
  counts: number[] // quantas respostas valeram 0, 1, 2, 3, 4
}

type Group = { title?: string; rows: Row[] }

const toRow = (score: DomainScore): Row => {
  const d = DOMAIN_BY_ID[score.domain]
  const counted = score.mean !== null && score.answered >= MIN_ANSWERED_PER_DOMAIN
  const counts = [0, 0, 0, 0, 0]
  for (const v of score.values) counts[v] = (counts[v] ?? 0) + 1
  return { score, label: d.label, code: d.code, counted, frequent: counted && score.mean! >= FREQUENT_CUTOFF, counts }
}

const CUTOFF_AT = FREQUENT_CUTOFF / 4
const COLS = 'sm:grid-cols-[minmax(8rem,12rem)_minmax(0,1fr)]'
const list = new Intl.ListFormat('pt-BR', { type: 'conjunction' })
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function ResultCharts({ result }: { result: ScoreResult }) {
  const isCentral = result.moduleId === 'central'
  const groups = useMemo<Group[]>(() => {
    const rows = result.domains.map(toRow)
    if (!isCentral) return [{ rows }]
    const byGroup = (g: 'central' | 'context') => rows.filter((r) => DOMAIN_BY_ID[r.score.domain].group === g)
    return [{ rows: byGroup('central') }, { title: 'Contexto · não entra na contagem do sinal', rows: byGroup('context') }].filter((g) => g.rows.length)
  }, [result, isCentral])

  const root = useRef<HTMLElement>(null)
  useChartMotion(root, useReducedMotion())

  return (
    <section ref={root} aria-labelledby="graficos-title" className="grid gap-6">
      <SectionTitle
        id="graficos-title"
        title="Seus resultados em gráficos"
        lead="Os mesmos números das seções abaixo, desenhados para comparar os domínios de relance. Passe o mouse, toque ou use Tab sobre as barras para ver os detalhes."
      />
      <Highlights rows={groups[0]!.rows} result={result} isCentral={isCentral} />
      <MeanChart groups={groups} isCentral={isCentral} />
      <MixChart groups={groups} />
      <Disclosure summary="Ver os números em tabela">
        <DataTable rows={groups.flatMap((g) => g.rows)} />
      </Disclosure>
    </section>
  )
}

/* ───────── Destaques ───────── */

function Highlights({ rows, result, isCentral }: { rows: Row[]; result: ScoreResult; isCentral: boolean }) {
  const frequent = rows.filter((r) => r.frequent).length
  const counted = rows.filter((r) => r.counted)
  const topMean = counted.length ? Math.max(...counted.map((r) => r.score.mean!)) : null
  const tops = counted.filter((r) => r.score.mean === topMean)
  const q = result.quality

  return (
    <dl data-anim="kpi" className="grid gap-4 md:grid-cols-3">
      <Tile
        label={isCentral ? 'Domínios do eixo central com média de 2,5 ou mais' : 'Áreas com média de 2,5 ou mais'}
        foot={isCentral ? 'É essa contagem que define o sinal de triagem.' : 'Cada área é lida por si; não há sinal único.'}
      >
        <div className="flex items-center gap-5">
          <Ring rows={rows} />
          <p className="flex items-baseline gap-2">
            <BigNumber value={frequent} />
            <span className="text-lead text-text-muted">de {rows.length}</span>
          </p>
        </div>
      </Tile>

      <Tile label="Maior média" foot={topMean === null ? 'Nenhum domínio teve respostas suficientes.' : capitalize(BAND_LABEL[tops[0]!.score.band])}>
        {topMean === null ? (
          <p className="font-display text-display-lg leading-none text-text-subtle">—</p>
        ) : (
          <div className="grid gap-3">
            <p className="flex items-baseline gap-2">
              <BigNumber value={topMean} decimals />
              <span className="text-lead text-text-muted">de 4</span>
            </p>
            <p className="font-semibold text-ink">{list.format(tops.map((r) => r.label))}</p>
            <Meter value={topMean / 4} />
          </div>
        )}
      </Tile>

      <Tile
        label="Perguntas respondidas"
        foot={q.skipped === 0 ? 'Todas as perguntas apresentadas foram respondidas.' : `${plural(q.skipped, 'pergunta ficou', 'perguntas ficaram')} sem resposta.`}
      >
        <div className="grid gap-3">
          <p className="flex items-baseline gap-2">
            <BigNumber value={q.answered} />
            <span className="text-lead text-text-muted">de {fmtInt(q.presented)}</span>
          </p>
          <Meter value={q.presented ? q.answered / q.presented : 0} />
        </div>
      </Tile>
    </dl>
  )
}

function Tile({ label, foot, children }: { label: string; foot: string; children: ReactNode }) {
  return (
    <div className="grid content-start gap-4 rounded-lg bg-surface p-5 shadow-soft ring-1 ring-line sm:p-6">
      <dt className="text-sm font-semibold text-text-muted">{label}</dt>
      <dd className="grid gap-3">
        {children}
        <span className="text-caption text-text-subtle">{foot}</span>
      </dd>
    </div>
  )
}

function BigNumber({ value, decimals }: { value: number; decimals?: boolean }) {
  return (
    <span data-count data-value={value} data-decimals={decimals ? '1' : undefined} className="font-display text-display-lg font-medium leading-none text-ink">
      {decimals ? fmtDecimal(value) : fmtInt(value)}
    </span>
  )
}

function Meter({ value }: { value: number }) {
  return (
    <span aria-hidden="true" className="block h-1.5 rounded-full" style={{ background: 'color-mix(in oklab, var(--color-scale-0) 30%, transparent)' }}>
      <span data-meter data-value={value} className="block h-full rounded-full" style={{ background: 'var(--color-scale-3)', '--v': value, width: 'calc(var(--p, var(--v)) * 100%)' } as CSSProperties} />
    </span>
  )
}

/** Anel com um trecho por domínio; os de média ≥ 2,5 ficam preenchidos. */
function Ring({ rows }: { rows: Row[] }) {
  const size = 76
  const r = 30
  const c = size / 2
  const n = rows.length
  const gap = n > 1 ? 9 : 0
  const pt = (deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180
    return `${(c + r * Math.cos(a)).toFixed(2)} ${(c + r * Math.sin(a)).toFixed(2)}`
  }
  const arc = (i: number) => {
    const a0 = (i / n) * 360 + gap / 2
    const a1 = ((i + 1) / n) * 360 - gap / 2
    return `M ${pt(a0)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${pt(a1)}`
  }
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" fill="none" strokeWidth={10}>
      {rows.map((row, i) => (
        <g key={row.score.domain}>
          <path d={arc(i)} style={{ stroke: 'var(--color-line)' }} />
          {row.frequent && <path data-ring-seg d={arc(i)} pathLength={1} strokeDasharray="1" style={{ stroke: 'var(--color-scale-3)' }} />}
        </g>
      ))}
    </svg>
  )
}

/* ───────── Média por domínio ───────── */

function MeanChart({ groups, isCentral }: { groups: Group[]; isCentral: boolean }) {
  const [active, setActive] = useState<string | null>(null)
  return (
    <ChartPanel
      anim="means"
      title="Média por domínio"
      lead={
        isCentral
          ? 'De 0 (Nunca) a 4 (Quase sempre). A linha vertical marca 2,5: a partir dela, o domínio conta para o sinal de triagem.'
          : 'De 0 (Nunca) a 4 (Quase sempre). A linha vertical marca 2,5, perto de “Frequentemente”. Aqui não há sinal: cada área é lida por si.'
      }
      legend={[
        { color: 'var(--color-scale-3)', label: 'Média de 2,5 ou mais' },
        { color: 'var(--color-scale-1)', label: 'Abaixo de 2,5' },
      ]}
    >
      <MeanAxis />
      {groups.map((g, gi) => (
        <GroupBlock key={gi} title={g.title}>
          {g.rows.map((row) => (
            <MeanRow key={row.score.domain} row={row} active={active} onActive={setActive} countsForSignal={isCentral && gi === 0} />
          ))}
        </GroupBlock>
      ))}
    </ChartPanel>
  )
}

function MeanAxis() {
  return (
    <div aria-hidden="true" className={cx('grid gap-x-6', COLS)}>
      <span className="hidden sm:block" />
      <span className="relative block h-12 md:h-14">
        <span className="absolute inset-y-0 left-0 right-12">
          <span data-threshold-label className="absolute top-0 -translate-x-1/2 text-caption font-semibold text-ink" style={{ left: `${CUTOFF_AT * 100}%` }}>
            2,5
          </span>
          {SCALE.map((s) => (
            <span
              key={s.value}
              className={cx(
                'absolute bottom-1.5 grid text-caption leading-tight text-text-subtle',
                s.value === 0 ? 'justify-items-start' : s.value === 4 ? '-translate-x-full justify-items-end' : '-translate-x-1/2 justify-items-center',
              )}
              style={{ left: `${s.value * 25}%` }}
            >
              <span className="tabular font-semibold text-text-muted">{s.value}</span>
              <span className="hidden whitespace-nowrap md:block">{s.label}</span>
            </span>
          ))}
        </span>
      </span>
    </div>
  )
}

function MeanRow({ row, active, onActive, countsForSignal }: { row: Row; active: string | null; onActive: (k: string | null) => void; countsForSignal: boolean }) {
  const { score } = row
  const key = score.domain
  const p = row.counted ? score.mean! / 4 : 0
  const isActive = active === key
  const label = row.counted
    ? `${row.label}: média ${fmtDecimal(score.mean!)} de 4, ${BAND_LABEL[score.band]}.${row.frequent && countsForSignal ? ' Conta para o sinal.' : ''}`
    : `${row.label}: respostas insuficientes.`

  return (
    <li>
      <RowButton
        id={key}
        label={label}
        active={active}
        onActive={onActive}
        data-bar-row={row.counted ? '' : undefined}
        data-value={p}
        style={{ '--v': p } as CSSProperties}
      >
        <RowLabel>{row.label}</RowLabel>
        <span className="relative block h-9 sm:h-11">
          <span className="absolute inset-y-0 left-0 right-12">
            {[0, 1, 2, 3, 4].map((v) => (
              <span key={v} className="absolute inset-y-0 w-px bg-line" style={{ left: `${v * 25}%` }} />
            ))}
            {row.counted ? (
              <>
                <span
                  className="absolute top-1/2 left-0 block h-5 -translate-y-1/2 overflow-hidden rounded-r-[4px]"
                  style={{ width: 'calc(var(--p, var(--v)) * 100%)', background: row.frequent ? 'var(--color-scale-3)' : 'var(--color-scale-1)' }}
                >
                  {row.frequent && (
                    <span
                      data-shine
                      className="absolute inset-y-0 left-0 block w-2/5 opacity-0"
                      style={{ background: 'linear-gradient(90deg, transparent, rgb(255 255 255 / 0.5), transparent)' }}
                    />
                  )}
                </span>
                <span className="absolute top-1/2 ml-2.5 -translate-y-1/2 text-sm font-semibold whitespace-nowrap text-ink" style={{ left: 'calc(var(--p, var(--v)) * 100%)' }}>
                  <span data-count data-value={score.mean!} data-decimals="1">
                    {fmtDecimal(score.mean!)}
                  </span>
                </span>
              </>
            ) : (
              <span className="absolute top-1/2 left-2 -translate-y-1/2 text-sm text-text-subtle">Respostas insuficientes</span>
            )}
            <span
              data-threshold
              className="absolute inset-y-0 block w-0.5 -translate-x-1/2 bg-ink/70"
              style={{ left: `${CUTOFF_AT * 100}%`, boxShadow: '0 0 0 1px var(--color-surface)' }}
            />
            {isActive && row.counted && (
              <Tip at={p}>
                <span className="flex items-baseline gap-1.5">
                  <span className="font-display text-title font-medium text-ink">{fmtDecimal(score.mean!)}</span>
                  <span className="text-caption text-text-subtle">de 4</span>
                </span>
                <span className="block text-sm font-semibold text-ink">
                  {row.label} <span className="label-data font-normal text-text-subtle">{row.code}</span>
                </span>
                <span className="block text-caption text-text-muted">
                  {capitalize(BAND_LABEL[score.band])} · escore {score.raw} de {score.maxRaw}
                </span>
                <span className="block text-caption text-text-muted">
                  {plural(score.answered, 'resposta', 'respostas')} · menor {score.min}, maior {score.max}
                </span>
                {row.frequent && countsForSignal && <span className="mt-1 block text-caption font-semibold text-accent-strong">Conta para o sinal de triagem</span>}
              </Tip>
            )}
          </span>
        </span>
      </RowButton>
    </li>
  )
}

/* ───────── Distribuição das respostas ───────── */

function MixChart({ groups }: { groups: Group[] }) {
  const [active, setActive] = useState<string | null>(null)
  return (
    <ChartPanel
      anim="mix"
      title="Como suas respostas se distribuem"
      lead="Cada trecho da barra é proporcional ao número de respostas naquele ponto da escala, e o número dentro dele conta essas respostas. Frases escritas no sentido contrário já aparecem convertidas, como no cálculo da média."
      legend={SCALE.map((s) => ({ color: `var(--color-scale-${s.value})`, label: `${s.value} · ${s.label}` }))}
    >
      {groups.map((g, gi) => (
        <GroupBlock key={gi} title={g.title}>
          {g.rows.map((row) => (
            <MixRow key={row.score.domain} row={row} active={active} onActive={setActive} />
          ))}
        </GroupBlock>
      ))}
    </ChartPanel>
  )
}

function MixRow({ row, active, onActive }: { row: Row; active: string | null; onActive: (k: string | null) => void }) {
  const { score } = row
  const key = score.domain
  const parts = SCALE.map((s) => ({ ...s, n: row.counts[s.value] ?? 0 })).filter((s) => s.n > 0)
  const skipped = score.skipped > 0 ? `, ${plural(score.skipped, 'pulada', 'puladas')}` : ''
  const label = parts.length
    ? `${row.label}: ${parts.map((s) => `${plural(s.n, 'resposta', 'respostas')} em “${s.label}”`).join(', ')}${skipped}.`
    : `${row.label}: nenhuma resposta${skipped}.`

  return (
    <li>
      <RowButton id={key} label={label} active={active} onActive={onActive}>
        <RowLabel>
          {row.label}
          <span className="block text-caption font-normal text-text-subtle">
            {plural(score.answered, 'resposta', 'respostas')}
            {score.skipped > 0 && ` · ${plural(score.skipped, 'pulada', 'puladas')}`}
          </span>
        </RowLabel>
        <span className="relative block py-2 sm:py-3">
          {parts.length ? (
            <span data-stack className="flex h-7 gap-0.5 overflow-hidden rounded-[4px]">
              {parts.map((s) => (
                <span key={s.value} className="@container relative block h-full" style={{ flex: `${s.n} 1 0%`, background: `var(--color-scale-${s.value})` }}>
                  <span
                    data-seg-count
                    className="invisible absolute inset-0 grid place-items-center text-caption font-semibold @min-[1.75rem]:visible"
                    style={{ color: `var(--color-on-scale-${s.value})` }}
                  >
                    {s.n}
                  </span>
                </span>
              ))}
            </span>
          ) : (
            <span className="block py-1 text-sm text-text-subtle">Nenhuma resposta</span>
          )}
          {active === key && parts.length > 0 && (
            <Tip at={0.5}>
              <span className="mb-1 block text-sm font-semibold text-ink">{row.label}</span>
              {SCALE.map((s) => (
                <span key={s.value} className="flex items-center gap-2 text-caption">
                  <span className="h-0.75 w-3 shrink-0 rounded-full" style={{ background: `var(--color-scale-${s.value})` }} />
                  <span className="tabular w-4 text-right font-semibold text-ink">{row.counts[s.value]}</span>
                  <span className="text-text-muted">{s.label}</span>
                </span>
              ))}
              {score.skipped > 0 && <span className="mt-1 block text-caption text-text-subtle">{plural(score.skipped, 'pergunta pulada', 'perguntas puladas')}</span>}
            </Tip>
          )}
        </span>
      </RowButton>
    </li>
  )
}

/* ───────── Peças comuns ───────── */

function ChartPanel({ anim, title, lead, legend, children }: { anim: string; title: string; lead: string; legend: { color: string; label: string }[]; children: ReactNode }) {
  return (
    <figure data-anim={anim} className="grid gap-6 rounded-lg bg-surface p-5 shadow-soft ring-1 ring-line sm:p-8">
      <figcaption className="grid gap-4">
        <div className="grid max-w-2xl gap-1.5">
          <h3 className="text-title">{title}</h3>
          <p className="text-sm text-text-muted">{lead}</p>
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Legenda">
          {legend.map((l) => (
            <li key={l.label} data-legend-item className="flex items-center gap-2 text-caption text-text-muted">
              <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-[3px]" style={{ background: l.color }} />
              {l.label}
            </li>
          ))}
        </ul>
      </figcaption>
      <div className="grid">{children}</div>
    </figure>
  )
}

function GroupBlock({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className={cx(title && 'mt-3 border-t border-line pt-4')}>
      {title && <p className="mb-1 text-caption font-semibold text-text-subtle">{title}</p>}
      <ul className="grid">{children}</ul>
    </div>
  )
}

function RowLabel({ children }: { children: ReactNode }) {
  return <span className="block px-1 pt-2 text-sm font-semibold text-ink sm:py-2">{children}</span>
}

/**
 * A linha inteira é o alvo: passar o mouse, tocar ou focar com Tab mostra os
 * detalhes; as demais linhas recuam para a barra em foco se destacar.
 */
function RowButton({
  id,
  label,
  active,
  onActive,
  children,
  ...rest
}: {
  id: string
  label: string
  active: string | null
  onActive: (k: string | null) => void
  children: ReactNode
  style?: CSSProperties
  'data-bar-row'?: string
  'data-value'?: number
}) {
  const leave = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'touch' || e.currentTarget.matches(':focus-visible')) return
    onActive(null)
  }
  return (
    <button
      type="button"
      aria-label={label}
      onPointerEnter={() => onActive(id)}
      onPointerLeave={leave}
      onFocus={() => onActive(id)}
      onBlur={() => onActive(null)}
      className={cx(
        'grid w-full cursor-default gap-x-6 rounded-md text-left transition-opacity duration-200',
        COLS,
        'sm:items-center',
        active !== null && active !== id && 'opacity-45',
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

function Tip({ at, children }: { at: number; children: ReactNode }) {
  const align = at < 0.3 ? 'start' : at > 0.7 ? 'end' : 'center'
  return (
    <span
      aria-hidden="true"
      className={cx(
        'chart-tip pointer-events-none absolute bottom-full z-20 mb-2 grid w-max max-w-68 gap-0.5 rounded-md bg-surface px-3.5 py-2.5 text-left shadow-lift ring-1 ring-line-strong',
        align === 'start' && '-translate-x-3',
        align === 'center' && '-translate-x-1/2',
        align === 'end' && '-translate-x-[calc(100%-0.75rem)]',
      )}
      style={{ left: `${at * 100}%` }}
    >
      {children}
    </span>
  )
}

function DataTable({ rows }: { rows: Row[] }) {
  return (
    <Table caption="Média e número de respostas em cada ponto da escala, por domínio">
      <thead>
        <tr>
          <th scope="col" className={th}>
            Domínio
          </th>
          <th scope="col" className={cx(th, 'text-right')}>
            Média
          </th>
          {SCALE.map((s) => (
            <th key={s.value} scope="col" className={cx(th, 'text-right')}>
              <span className="tabular block">{s.value}</span>
              {s.label}
            </th>
          ))}
          <th scope="col" className={cx(th, 'text-right')}>
            Puladas
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.score.domain}>
            <th scope="row" className={cx(td, 'font-semibold')}>
              {r.label}
            </th>
            <td className={cx(td, 'tabular text-right')}>{r.counted ? fmtDecimal(r.score.mean!) : '—'}</td>
            {r.counts.map((n, v) => (
              <td key={v} className={cx(td, 'tabular text-right')}>
                {n}
              </td>
            ))}
            <td className={cx(td, 'tabular text-right')}>{r.score.skipped}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

/* ───────── Movimento ───────── */

type Timeline = ReturnType<typeof gsap.timeline>

const formatFor = (node: HTMLElement) => (node.dataset.decimals ? (n: number) => fmtDecimal(n) : (n: number) => fmtInt(Math.round(n)))

/** Conta de 0 até o valor final, escrevendo direto no nó de texto do React. */
function countUp(tl: Timeline, node: HTMLElement, at: number, duration: number) {
  const text = node.firstChild
  if (!text) return
  const fmt = formatFor(node)
  const proxy = { v: 0 }
  text.nodeValue = fmt(0)
  tl.to(proxy, { v: Number(node.dataset.value) || 0, duration, ease: 'power3.out', onUpdate: () => void (text.nodeValue = fmt(proxy.v)) }, at)
}

/** Cresce a variável --p de 0 até data-value; sem ela, o CSS usa o valor final (--v). */
function grow(tl: Timeline, node: HTMLElement, at: number, duration: number) {
  tl.fromTo(node, { '--p': 0 }, { '--p': Number(node.dataset.value) || 0, duration, ease: 'power3.out', onComplete: () => void node.style.removeProperty('--p') }, at)
}

const BUILD: Record<string, (tl: Timeline, panel: HTMLElement) => void> = {
  kpi(tl, panel) {
    const all = (s: string) => Array.from(panel.querySelectorAll<HTMLElement>(s))
    all('[data-count]').forEach((n, i) => countUp(tl, n, 0.1 + i * 0.12, 1.4))
    all('[data-meter]').forEach((n, i) => grow(tl, n, 0.25 + i * 0.12, 1.4))
    const segs = all('[data-ring-seg]')
    if (segs.length) tl.fromTo(segs, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out', stagger: 0.16 }, 0.15)
  },
  means(tl, panel) {
    const all = (s: string) => Array.from(panel.querySelectorAll<HTMLElement>(s))
    tl.fromTo(all('[data-threshold]'), { scaleY: 0 }, { scaleY: 1, transformOrigin: '50% 0%', duration: 0.3, ease: 'none', stagger: 0.06 }, 0)
    tl.fromTo(all('[data-threshold-label]'), { opacity: 0, y: -4 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0)
    all('[data-bar-row]').forEach((row, i) => {
      const at = 0.2 + i * 0.09
      grow(tl, row, at, 1.15)
      const n = row.querySelector<HTMLElement>('[data-count]')
      if (n) countUp(tl, n, at, 1.15)
    })
    const shines = all('[data-shine]')
    if (shines.length) tl.fromTo(shines, { xPercent: -110, opacity: 1 }, { xPercent: 260, opacity: 1, duration: 0.9, ease: 'power2.inOut', stagger: 0.12 }, '>-0.2')
  },
  mix(tl, panel) {
    const all = (s: string) => Array.from(panel.querySelectorAll<HTMLElement>(s))
    tl.fromTo(all('[data-legend-item]'), { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', stagger: 0.06 }, 0)
    const stacks = all('[data-stack]')
    if (stacks.length) {
      tl.fromTo(stacks, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.95, ease: 'power2.inOut', stagger: 0.08, clearProps: 'clipPath' }, 0.15)
      tl.fromTo(all('[data-seg-count]'), { opacity: 0, y: 3 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', stagger: 0.025 }, 0.7)
    }
  },
}

/**
 * Cada painel anima uma vez, quando entra na tela. Antes de imprimir, tudo
 * pula para o estado final; ao desmontar, os números voltam ao valor exato.
 */
function useChartMotion(root: RefObject<HTMLElement | null>, reduced: boolean) {
  useGSAP(
    () => {
      const el = root.current
      if (!el || reduced) return
      const timelines = new Map<Element, Timeline>()
      for (const panel of el.querySelectorAll<HTMLElement>('[data-anim]')) {
        const tl = gsap.timeline({ paused: true })
        BUILD[panel.dataset.anim ?? '']?.(tl, panel)
        timelines.set(panel, tl)
      }
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue
            timelines.get(e.target)?.play()
            io.unobserve(e.target)
          }
        },
        { rootMargin: '0px 0px -12% 0px' },
      )
      timelines.forEach((_, panel) => io.observe(panel))
      const finish = () => timelines.forEach((tl) => tl.progress(1))
      window.addEventListener('beforeprint', finish)
      return () => {
        io.disconnect()
        window.removeEventListener('beforeprint', finish)
        for (const n of el.querySelectorAll<HTMLElement>('[data-count]')) {
          if (n.firstChild) n.firstChild.nodeValue = formatFor(n)(Number(n.dataset.value) || 0)
        }
      }
    },
    { scope: root, dependencies: [reduced], revertOnUpdate: true },
  )
}
