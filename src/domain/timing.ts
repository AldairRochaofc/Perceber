import { ITEM_BY_ID, itemText } from './items'
import type { AnswerValue, Response } from './types'

/**
 * Tempo ideal de resposta e confiabilidade pelo tempo.
 *
 * Cada pergunta é classificada em complexidade baixa, média ou alta a partir
 * do texto exibido (palavras, orações e itens invertidos, que exigem mais
 * raciocínio). O tempo ideal soma a leitura (~210 palavras/min) e a decisão
 * na escala (2 s, 3 s ou 4 s conforme a complexidade).
 *
 * Confiabilidade da resposta = confiança do tempo × confiança da resposta.
 * - Tempo dentro da janela [mínimo, máximo]: 1. Abaixo do mínimo (não deu
 *   para ler): cai até 0. Acima do máximo (distração ou pausa): cai até 0,5.
 * - Resposta dada: 1. "Prefiro não responder": 0.
 *
 * Heurística de demonstração, sem calibração empírica.
 */

export type Complexity = 'baixa' | 'media' | 'alta'
export type ReliabilityLevel = 'alta' | 'media' | 'baixa'

export const COMPLEXITIES: Complexity[] = ['baixa', 'media', 'alta']
export const COMPLEXITY_LABEL: Record<Complexity, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta' }
export const RELIABILITY_LABEL: Record<ReliabilityLevel, string> = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }

const READ_WORDS_PER_S = 3.5
const SKIM_WORDS_PER_S = 8
const DECISION_MS: Record<Complexity, number> = { baixa: 2000, media: 3000, alta: 4000 }

export type Timing = { complexity: Complexity; words: number; idealMs: number; minMs: number; maxMs: number }

export const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length

export function complexityOf(text: string, reverse = false, example = ''): Complexity {
  const clauses = (text.match(/[,;]/g) ?? []).length
  const points = wordCount(text) + clauses * 2 + (reverse ? 5 : 0) + (example ? 3 : 0)
  return points <= 12 ? 'baixa' : points <= 20 ? 'media' : 'alta'
}

export function timingFor(text: string, reverse = false, example = ''): Timing {
  const complexity = complexityOf(text, reverse, example)
  const words = wordCount(text) + (example ? wordCount(example) : 0)
  const idealMs = Math.round((words / READ_WORDS_PER_S) * 1000 + DECISION_MS[complexity])
  const minMs = Math.round((words / SKIM_WORDS_PER_S) * 1000 + 700)
  return { complexity, words, idealMs, minMs, maxMs: idealMs * 3 }
}

/** Tempo da pergunta na forma em que foi exibida. */
export function itemTiming(itemId: string, form = 0): Timing {
  const item = ITEM_BY_ID[itemId]
  if (!item) return { complexity: 'media', words: 0, idealMs: 8000, minMs: 2000, maxMs: 24000 }
  return timingFor(itemText(item, form), item.reverse, item.example)
}

export function timeConfidence(latencyMs: number, t: Timing): number {
  if (latencyMs < t.minMs) return Math.max(0, latencyMs / t.minMs) * 0.6
  if (latencyMs <= t.maxMs) return 1
  return Math.max(0.5, 1 - (0.5 * (latencyMs - t.maxMs)) / t.maxMs)
}

export const answerConfidence = (value: AnswerValue | null) => (value === null ? 0 : 1)

export const round2 = (n: number) => Math.round(n * 100) / 100

export function responseReliability(latencyMs: number, value: AnswerValue | null, t: Timing) {
  const time = round2(timeConfidence(latencyMs, t))
  const answer = answerConfidence(value)
  return { time, answer, reliability: round2(time * answer) }
}

export const reliabilityLevel = (r: number): ReliabilityLevel => (r >= 0.8 ? 'alta' : r >= 0.5 ? 'media' : 'baixa')

export type ResponseTiming = { itemId: string; latencyMs: number; timing: Timing; time: number; answer: number; reliability: number }

export type SessionReliability = {
  mean: number | null
  level: ReliabilityLevel | null
  tooFast: number
  tooSlow: number
  rows: ResponseTiming[]
  byComplexity: { complexity: Complexity; n: number; mean: number | null; medianMs: number | null; idealMs: number | null }[]
}

const median = (xs: number[]) => {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m]! : Math.round((s[m - 1]! + s[m]!) / 2)
}

export const mean = (xs: number[]) => (xs.length ? round2(xs.reduce((a, b) => a + b, 0) / xs.length) : null)

export function sessionReliability(responses: Response[], form = 0): SessionReliability {
  const rows = responses.map((r) => {
    const timing = itemTiming(r.itemId, form)
    return { itemId: r.itemId, latencyMs: r.latencyMs, timing, ...responseReliability(r.latencyMs, r.value, timing) }
  })
  const m = mean(rows.map((r) => r.reliability))
  return {
    mean: m,
    level: m === null ? null : reliabilityLevel(m),
    tooFast: rows.filter((r) => r.latencyMs < r.timing.minMs).length,
    tooSlow: rows.filter((r) => r.latencyMs > r.timing.maxMs).length,
    rows,
    byComplexity: COMPLEXITIES.map((c) => {
      const own = rows.filter((r) => r.timing.complexity === c)
      return {
        complexity: c,
        n: own.length,
        mean: mean(own.map((r) => r.reliability)),
        medianMs: median(own.map((r) => r.latencyMs)),
        idealMs: median(own.map((r) => r.timing.idealMs)),
      }
    }),
  }
}

export { median }

export const fmtSeconds = (ms: number) => `${(ms / 1000).toFixed(1).replace('.', ',')} s`
