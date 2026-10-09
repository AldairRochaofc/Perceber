import { gaussian, mulberry32, pick } from '../lib/prng'
import { DOMAINS } from './domains'
import { ITEMS } from './items'
import type { DomainId, SignalLevel } from './types'

/**
 * Conjunto SINTÉTICO para demonstrar a área de pesquisa.
 * Gerado de forma determinística (semente fixa). Não representa pessoas
 * reais, não tem valor científico e não deve ser usado para conclusões.
 */
export const SYNTHETIC_SEED = 2026
export const SMALL_CELL = 5

export const DIMENSIONS = {
  ageBand: { label: 'Faixa etária', values: ['18–24', '25–34', '35–44', '45–59', '60+'] },
  gender: { label: 'Gênero', values: ['Mulher', 'Homem', 'Não binário', 'Prefere não informar'] },
  race: { label: 'Raça/cor (IBGE)', values: ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Não informada'] },
  education: { label: 'Escolaridade', values: ['Fundamental', 'Médio', 'Superior', 'Pós-graduação'] },
  region: { label: 'Região', values: ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'] },
} as const

export type Dimension = keyof typeof DIMENSIONS

export type SyntheticRecord = {
  pid: string
  ageBand: string
  gender: string
  race: string
  education: string
  region: string
  signal: SignalLevel
  means: Partial<Record<DomainId, number | null>>
  missing: string[]
  straightLining: boolean
}

function weighted<T>(rand: () => number, entries: [T, number][]): T {
  const total = entries.reduce((a, [, w]) => a + w, 0)
  let r = rand() * total
  for (const [v, w] of entries) {
    r -= w
    if (r <= 0) return v
  }
  return entries.at(-1)![0]
}

const ITEM_MISSING_RATE: Record<string, number> = { c3: 0.09, f2: 0.12, h2: 0.07, m3: 0.06, r2: 0.05 }

export function generateSynthetic(n = 312, seed = SYNTHETIC_SEED): SyntheticRecord[] {
  const rand = mulberry32(seed)
  const out: SyntheticRecord[] = []
  for (let k = 0; k < n; k++) {
    const latent = gaussian(rand, 0, 1)
    const means: Partial<Record<DomainId, number | null>> = {}
    for (const d of DOMAINS) {
      const base = d.group === 'central' ? 1.7 + 0.75 * latent : d.group === 'context' ? 1.8 + 0.6 * latent : 1.9 + 0.35 * latent
      const v = Math.min(4, Math.max(0, gaussian(rand, base, 0.6)))
      means[d.id] = d.group === 'cooccurring' && rand() < 0.35 ? null : Math.round(v * 100) / 100
    }
    const missing = ITEMS.filter((i) => rand() < (ITEM_MISSING_RATE[i.id] ?? 0.015)).map((i) => i.id)
    const central = DOMAINS.filter((d) => d.group === 'central')
    const frequent = central.filter((d) => (means[d.id] ?? 0) >= 2.5).length
    const impact = means.impact ?? 0
    const insufficient = missing.length > 7
    const signal: SignalLevel = insufficient ? 'insufficient' : frequent >= 4 ? (impact >= 2.5 ? 'wide' : 'high') : frequent >= 2 ? 'moderate' : 'low'
    out.push({
      pid: `S-${(k + 1).toString().padStart(4, '0')}`,
      ageBand: weighted(rand, [['18–24', 22], ['25–34', 38], ['35–44', 24], ['45–59', 13], ['60+', 3]]),
      gender: weighted(rand, [['Mulher', 55], ['Homem', 38], ['Não binário', 5], ['Prefere não informar', 2]]),
      race: weighted(rand, [['Branca', 46], ['Preta', 11], ['Parda', 39], ['Amarela', 1.2], ['Indígena', 0.6], ['Não informada', 2.2]]),
      education: weighted(rand, [['Fundamental', 6], ['Médio', 30], ['Superior', 44], ['Pós-graduação', 20]]),
      region: pick(rand, ['Sudeste', 'Sudeste', 'Sudeste', 'Nordeste', 'Nordeste', 'Sul', 'Sul', 'Centro-Oeste', 'Norte']),
      signal,
      means,
      missing,
      straightLining: rand() < 0.04,
    })
  }
  return out
}

/** Contagem com supressão de células pequenas: n < 5 nunca é exibido. */
export function suppress(n: number): number | null {
  return n > 0 && n < SMALL_CELL ? null : n
}

export function countBy(records: SyntheticRecord[], dim: Dimension) {
  return DIMENSIONS[dim].values.map((value) => {
    const n = records.filter((r) => r[dim] === value).length
    return { value, n: suppress(n), suppressed: n > 0 && n < SMALL_CELL }
  })
}

export function domainMeanBy(records: SyntheticRecord[], dim: Dimension, domain: DomainId) {
  return DIMENSIONS[dim].values.map((value) => {
    const vals = records.filter((r) => r[dim] === value).map((r) => r.means[domain]).filter((v): v is number => v != null)
    const n = vals.length
    if (n < SMALL_CELL) return { value, n: suppress(n), mean: null, suppressed: n > 0 }
    const mean = vals.reduce((a, b) => a + b, 0) / n
    const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, n - 1))
    return { value, n, mean: Math.round(mean * 100) / 100, sd: Math.round(sd * 100) / 100, suppressed: false }
  })
}

export function missingByItem(records: SyntheticRecord[]) {
  return ITEMS.map((i) => ({ item: i, rate: records.filter((r) => r.missing.includes(i.id)).length / records.length }))
    .sort((a, b) => b.rate - a.rate)
}

export function signalDistribution(records: SyntheticRecord[]) {
  const levels: SignalLevel[] = ['low', 'moderate', 'high', 'wide', 'insufficient']
  return levels.map((l) => ({ level: l, n: suppress(records.filter((r) => r.signal === l).length) }))
}

export function toAggregateCSV(records: SyntheticRecord[], dim: Dimension, domain: DomainId) {
  const rows = domainMeanBy(records, dim, domain)
  const header = `${DIMENSIONS[dim].label};n;media;dp`
  const lines = rows.map((r) => `${r.value};${r.n ?? '<5'};${r.mean ?? 'suprimido'};${'sd' in r && r.sd != null ? r.sd : ''}`)
  return [header, ...lines].join('\n')
}
