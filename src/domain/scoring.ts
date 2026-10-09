import { canonicalJSON, sha256 } from '../lib/sha256'
import { DOMAIN_BY_ID } from './domains'
import { deriveSequence, scored, toMap } from './engine'
import { ITEM_BY_ID } from './items'
import { MODULE_BY_ID } from './modules'
import type {
  DataQuality, DomainBand, DomainId, DomainScore, ModuleId, QualityFlag, Response, ScoreResult, SignalLevel,
} from './types'

/**
 * Algoritmo de pontuação ALG-1.0.0
 *
 * Transparente e reprodutível: a mesma lista de respostas, com as mesmas
 * versões, gera sempre o mesmo resultado (ver scoring.test.ts).
 *
 *  1. Cada resposta vale 0–4; itens invertidos valem 4 − resposta.
 *  2. Por domínio: escore bruto (soma), máximo possível, média, mínimo e máximo.
 *     Sem pesos, sem padronização, sem percentuais.
 *  3. Faixa descritiva = rótulo da escala mais próximo da média. Descreve o
 *     que a pessoa respondeu; não compara com população (não há norma).
 *  4. Sinal de triagem (só eixo central): conta domínios com média ≥ 2,5
 *     ("Frequentemente" ou mais).
 *        0–1 → baixa indicação · 2–3 → moderada · ≥4 → elevada
 *        ≥4 e impacto no dia a dia com média ≥ 2,5 → avaliação profissional sugerida
 *     Pontos de corte provisórios, por consenso interno, sem estudo de validade.
 *  5. Dados insuficientes quando algum domínio central tem menos de 2 respostas
 *     ou menos de 70% das perguntas apresentadas foram respondidas.
 *  6. Qualidade dos dados é exibida ao lado e nunca altera escores.
 */
export const ALGORITHM_VERSION = 'ALG-1.0.0'

export const FREQUENT_CUTOFF = 2.5
export const MIN_ANSWERED_PER_DOMAIN = 2
export const MIN_COMPLETENESS = 0.7

const BANDS: { max: number; band: DomainBand }[] = [
  { max: 0.5, band: 'never' },
  { max: 1.5, band: 'rarely' },
  { max: 2.5, band: 'sometimes' },
  { max: 3.5, band: 'often' },
  { max: Infinity, band: 'almost-always' },
]

export const bandFor = (mean: number | null, answered: number): DomainBand => {
  if (mean === null || answered < MIN_ANSWERED_PER_DOMAIN) return 'insufficient'
  return BANDS.find((b) => mean < b.max)!.band
}

export const BAND_LABEL: Record<DomainBand, string> = {
  never: 'perto de “Nunca”',
  rarely: 'perto de “Raramente”',
  sometimes: 'perto de “Às vezes”',
  often: 'perto de “Frequentemente”',
  'almost-always': 'perto de “Quase sempre”',
  insufficient: 'respostas insuficientes',
}

const round2 = (n: number) => Math.round(n * 100) / 100

function median(values: number[]): number | null {
  if (!values.length) return null
  const s = [...values].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2
}

export function scoreDomain(domain: DomainId, responses: Response[]): DomainScore {
  const own = responses.filter((r) => ITEM_BY_ID[r.itemId]?.domain === domain)
  const values = own
    .filter((r) => r.value !== null)
    .map((r) => scored(ITEM_BY_ID[r.itemId]!, r.value!))
  const answered = values.length
  const raw = values.reduce((a, b) => a + b, 0)
  const mean = answered ? round2(raw / answered) : null
  return {
    domain,
    presented: own.length,
    answered,
    skipped: own.length - answered,
    raw,
    maxRaw: answered * 4,
    mean,
    min: answered ? Math.min(...values) : null,
    max: answered ? Math.max(...values) : null,
    values,
    band: bandFor(mean, answered),
    sensitivity: answered ? round2(4 / answered) : null,
  }
}

export function assessQuality(responses: Response[]): DataQuality {
  const presented = responses.length
  const answeredList = responses.filter((r) => r.value !== null)
  const answered = answeredList.length
  const skipped = presented - answered
  const completeness = presented ? round2(answered / presented) : 0
  const flags: QualityFlag[] = []

  if (presented && skipped / presented > 0.2) flags.push('many-skipped')

  if (answered >= 12) {
    const counts = new Map<number, number>()
    for (const r of answeredList) counts.set(r.value!, (counts.get(r.value!) ?? 0) + 1)
    const top = Math.max(...counts.values())
    if (top / answered >= 0.85) flags.push('straight-lining')
  }

  // Item invertido concordando com o oposto do restante do domínio
  for (const r of answeredList) {
    const item = ITEM_BY_ID[r.itemId]
    if (!item?.reverse || r.value! < 3) continue
    const others = answeredList.filter((o) => o.itemId !== r.itemId && ITEM_BY_ID[o.itemId]?.domain === item.domain)
    if (others.length < 2) continue
    const mean = others.reduce((a, o) => a + scored(ITEM_BY_ID[o.itemId]!, o.value!), 0) / others.length
    if (mean >= 3) {
      flags.push('reverse-inconsistent')
      break
    }
  }

  const medianLatencyMs = median(answeredList.map((r) => r.latencyMs))
  if (answered >= 10 && medianLatencyMs !== null && medianLatencyMs < 1500) flags.push('very-fast')

  const level: DataQuality['level'] =
    completeness < MIN_COMPLETENESS || flags.length >= 2 ? 'limited' : flags.length === 1 ? 'attention' : 'adequate'

  return { presented, answered, skipped, completeness, flags, level, medianLatencyMs }
}

export function signalFor(domains: DomainScore[], quality: DataQuality): { signal: SignalLevel; frequent: number } {
  const central = domains.filter((d) => DOMAIN_BY_ID[d.domain].group === 'central')
  const frequent = central.filter((d) => d.mean !== null && d.answered >= MIN_ANSWERED_PER_DOMAIN && d.mean >= FREQUENT_CUTOFF).length
  if (central.some((d) => d.answered < MIN_ANSWERED_PER_DOMAIN) || quality.completeness < MIN_COMPLETENESS) {
    return { signal: 'insufficient', frequent }
  }
  const impact = domains.find((d) => d.domain === 'impact')
  const impactFrequent = !!impact && impact.mean !== null && impact.answered >= MIN_ANSWERED_PER_DOMAIN && impact.mean >= FREQUENT_CUTOFF
  if (frequent >= 4) return { signal: impactFrequent ? 'wide' : 'high', frequent }
  if (frequent >= 2) return { signal: 'moderate', frequent }
  return { signal: 'low', frequent }
}

export function inputHash(moduleId: ModuleId, responses: Response[]) {
  const module = MODULE_BY_ID[moduleId]
  return sha256(
    canonicalJSON({
      algorithm: ALGORITHM_VERSION,
      module: module.code,
      moduleVersion: module.version,
      itemBank: module.itemBankVersion,
      responses: responses.map((r) => ({ i: r.itemId, v: r.value, t: r.latencyMs })),
    }),
  )
}

export function computeResult(moduleId: ModuleId, allResponses: Response[], computedAt = new Date().toISOString()): ScoreResult {
  const module = MODULE_BY_ID[moduleId]
  // só respostas a itens que pertencem à sequência válida
  const valid = new Set(deriveSequence(moduleId, toMap(allResponses)).map((i) => i.id))
  const responses = allResponses.filter((r) => valid.has(r.itemId))
  const domains = module.constructs.map((d) => scoreDomain(d, responses))
  const quality = assessQuality(responses)
  const isCentral = moduleId === 'central'
  const { signal, frequent } = isCentral ? signalFor(domains, quality) : { signal: null, frequent: 0 }
  return {
    algorithmVersion: ALGORITHM_VERSION,
    moduleId,
    moduleVersion: module.version,
    itemBankVersion: module.itemBankVersion,
    computedAt,
    domains,
    signal,
    frequentCentral: frequent,
    quality,
    inputHash: inputHash(moduleId, responses),
  }
}

export const QUALITY_FLAG_TEXT: Record<QualityFlag, { title: string; body: string }> = {
  'many-skipped': {
    title: 'Muitas perguntas sem resposta',
    body: 'Mais de 20% das perguntas apresentadas ficaram sem resposta. As médias usam só o que foi respondido.',
  },
  'straight-lining': {
    title: 'Respostas muito parecidas entre si',
    body: 'Quase todas as respostas usaram a mesma opção. Isso pode acontecer por cansaço ou pressa, e reduz o quanto o resultado diferencia os domínios.',
  },
  'reverse-inconsistent': {
    title: 'Respostas em direções opostas',
    body: 'Uma frase escrita no sentido contrário teve resposta na mesma direção das demais. Pode ter sido uma leitura rápida, ou a frase pode estar pouco clara.',
  },
  'very-fast': {
    title: 'Respostas muito rápidas',
    body: 'O tempo mediano por pergunta ficou abaixo de 1,5 segundo. Respostas rápidas podem não refletir bem a sua experiência.',
  },
}

export const QUALITY_LEVEL_LABEL: Record<DataQuality['level'], string> = {
  adequate: 'Adequada',
  attention: 'Pede atenção',
  limited: 'Limitada',
}
