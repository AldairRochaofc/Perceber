import { MODULE_BY_ID } from './modules'
import { ITEM_BY_ID, itemsFor } from './items'
import type { AnswerValue, DomainId, Item, ModuleId, Response } from './types'

/**
 * Motor de apresentação.
 *
 * Regra (documentada no módulo): cada domínio tem um núcleo fixo. Depois que
 * todo o núcleo foi apresentado, se ao menos 2 itens do núcleo foram
 * respondidos e a média pontuada for ≥ 2 ("Às vezes"), os itens de
 * aprofundamento do domínio entram na sequência.
 *
 * A sequência é sempre derivada das respostas atuais. Se a pessoa volta e
 * muda uma resposta do núcleo, aprofundamentos que deixaram de se aplicar
 * saem da sequência e suas respostas são descartadas (ver pruneResponses).
 */

export const FOLLOWUP_THRESHOLD = 2
export const FOLLOWUP_MIN_ANSWERED = 2

export const scored = (item: Item, value: AnswerValue) => (item.reverse ? 4 - value : value)

type AnswerMap = Map<string, AnswerValue | null>

export const toMap = (responses: Response[]): AnswerMap => new Map(responses.map((r) => [r.itemId, r.value]))

export function followupsOpen(domain: DomainId, answers: AnswerMap): boolean | null {
  const core = itemsFor(domain, 'core')
  if (!core.every((i) => answers.has(i.id))) return null // núcleo ainda não terminou
  const values = core
    .map((i) => {
      const v = answers.get(i.id)
      return v == null ? null : scored(i, v)
    })
    .filter((v): v is number => v !== null)
  if (values.length < FOLLOWUP_MIN_ANSWERED) return false
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  return mean >= FOLLOWUP_THRESHOLD
}

/** Sequência de itens que serão apresentados com as respostas atuais. */
export function deriveSequence(moduleId: ModuleId, answers: AnswerMap): Item[] {
  const module = MODULE_BY_ID[moduleId]
  const seq: Item[] = []
  for (const domain of module.constructs) {
    seq.push(...itemsFor(domain, 'core'))
    if (followupsOpen(domain, answers)) seq.push(...itemsFor(domain, 'followup'))
  }
  return seq
}

export function nextItem(moduleId: ModuleId, responses: Response[]): Item | null {
  const answers = toMap(responses)
  return deriveSequence(moduleId, answers).find((i) => !answers.has(i.id)) ?? null
}

export function isComplete(moduleId: ModuleId, responses: Response[]) {
  return nextItem(moduleId, responses) === null
}

/** Remove respostas a aprofundamentos que deixaram de se aplicar, mantendo a ordem. */
export function pruneResponses(moduleId: ModuleId, responses: Response[]): Response[] {
  const valid = new Set(deriveSequence(moduleId, toMap(responses)).map((i) => i.id))
  return responses.filter((r) => valid.has(r.itemId))
}

export type SectionState = {
  domain: DomainId
  state: 'done' | 'current' | 'upcoming'
  presented: number
  answered: number
  coreTotal: number
  followupTotal: number
  followupsOpen: boolean | null
}

/** Estado por seção, usado no mapa de exploração (progresso sem contagem regressiva). */
export function sections(moduleId: ModuleId, responses: Response[]): SectionState[] {
  const module = MODULE_BY_ID[moduleId]
  const answers = toMap(responses)
  const next = nextItem(moduleId, responses)
  return module.constructs.map((domain) => {
    const core = itemsFor(domain, 'core')
    const follow = itemsFor(domain, 'followup')
    const open = followupsOpen(domain, answers)
    const domainItems = [...core, ...(open ? follow : [])]
    const presented = domainItems.filter((i) => answers.has(i.id)).length
    const answered = domainItems.filter((i) => answers.get(i.id) != null).length
    const state: SectionState['state'] =
      next?.domain === domain ? 'current' : presented === domainItems.length && open !== null ? 'done' : 'upcoming'
    return { domain, state, presented, answered, coreTotal: core.length, followupTotal: follow.length, followupsOpen: open }
  })
}

/** Quantas perguntas ainda podem aparecer: [mínimo, máximo]. */
export function remainingRange(moduleId: ModuleId, responses: Response[]): [number, number] {
  const answers = toMap(responses)
  let min = 0
  let max = 0
  for (const domain of MODULE_BY_ID[moduleId].constructs) {
    const core = itemsFor(domain, 'core')
    const follow = itemsFor(domain, 'followup')
    const coreLeft = core.filter((i) => !answers.has(i.id)).length
    const open = followupsOpen(domain, answers)
    const followLeft = follow.filter((i) => !answers.has(i.id)).length
    min += coreLeft + (open ? followLeft : 0)
    max += coreLeft + (open === false ? 0 : followLeft)
  }
  return [min, max]
}

export const itemOf = (id: string) => {
  const item = ITEM_BY_ID[id]
  if (!item) throw new Error(`Item desconhecido: ${id}`)
  return item
}
