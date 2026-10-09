import { useSyncExternalStore } from 'react'
import { DOMAIN_BY_ID } from '../domain/domains'
import { FORM_COUNT, ITEMS } from '../domain/items'
import type { Gender } from '../domain/people'
import { itemTiming, mean, responseReliability, type Complexity } from '../domain/timing'
import type { AgeBand, AnswerValue, ModuleId, SignalLevel } from '../domain/types'
import { gaussian, mulberry32, pick } from '../lib/prng'
import { readJSON, writeJSON } from '../lib/storage'

/**
 * "Banco de dados" provisório: uma variável global (`DB`, também exposta em
 * `window.PERCEBER_DB`) com pessoas simuladas e o tempo de cada resposta
 * (RespondTime). O que vem do uso real do app é somado ao mock e guardado
 * no localStorage (chave `perceber:db`). Quando houver banco, troque as
 * funções deste arquivo por chamadas à API; as telas não mudam.
 */

export type Source = 'simulado' | 'app'

export type PersonRecord = {
  id: string
  name: string
  gender: Gender
  ageBand: AgeBand
  createdAt: string
  completed: number
  lastSignal: SignalLevel | null
  reliability: number | null
  source: Source
}

export type RespondTime = {
  id: string
  personId: string
  sessionId: string
  moduleId: ModuleId
  itemId: string
  form: number
  complexity: Complexity
  latencyMs: number
  idealMs: number
  timeConfidence: number
  answerConfidence: number
  reliability: number
  at: string
  source: Source
}

export type Database = { people: PersonRecord[]; respondTimes: RespondTime[] }

const KEY = 'perceber:db'
const MOCK_PEOPLE = 64
const MOCK_SEED = 1709

const FEMALE = ['Ana', 'Beatriz', 'Camila', 'Daniela', 'Eduarda', 'Fernanda', 'Gabriela', 'Helena', 'Isabela', 'Juliana', 'Larissa', 'Mariana', 'Natália', 'Patrícia', 'Rafaela', 'Sofia', 'Tatiane', 'Vitória', 'Luana', 'Carolina']
const MALE = ['André', 'Bruno', 'Carlos', 'Diego', 'Eduardo', 'Felipe', 'Gustavo', 'Henrique', 'Igor', 'João', 'Lucas', 'Marcelo', 'Nícolas', 'Otávio', 'Pedro', 'Rafael', 'Thiago', 'Vinícius', 'Mateus', 'Leonardo']
const NEUTRAL = ['Alex', 'Ariel', 'Dani', 'Jordan', 'Kim', 'Sam', 'Noá', 'Cris']
const SURNAMES = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento', 'Carvalho', 'Araújo', 'Ribeiro', 'Gomes', 'Martins', 'Rocha', 'Barbosa', 'Freitas', 'Moreira', 'Cardoso']

function weighted<T>(rand: () => number, entries: [T, number][]): T {
  const total = entries.reduce((a, [, w]) => a + w, 0)
  let r = rand() * total
  for (const [v, w] of entries) {
    r -= w
    if (r <= 0) return v
  }
  return entries.at(-1)![0]
}

const DAY = 86_400_000

function mockRespondTimes(rand: () => number, personId: string, moduleId: ModuleId, start: number, rushed: boolean): RespondTime[] {
  const sessionId = `${personId}-${moduleId}`
  const form = Math.floor(rand() * FORM_COUNT)
  const items = ITEMS.filter((i) => {
    const group = DOMAIN_BY_ID[i.domain].group
    const inModule = moduleId === 'cooccurring' ? group === 'cooccurring' : group !== 'cooccurring'
    return inModule && (i.tier === 'core' || rand() < 0.5)
  })
  let at = start
  return items.map((item, k) => {
    const timing = itemTiming(item.id, form)
    const factor = Math.exp(gaussian(rand, rushed ? -1.3 : 0, 0.45))
    const latencyMs = Math.max(400, Math.round(timing.idealMs * factor))
    const value: AnswerValue | null = rand() < 0.03 ? null : (Math.min(4, Math.max(0, Math.round(gaussian(rand, 2, 1.1)))) as AnswerValue)
    const r = responseReliability(latencyMs, value, timing)
    at += latencyMs
    return {
      id: `${sessionId}-${k}`,
      personId,
      sessionId,
      moduleId,
      itemId: item.id,
      form,
      complexity: timing.complexity,
      latencyMs,
      idealMs: timing.idealMs,
      timeConfidence: r.time,
      answerConfidence: r.answer,
      reliability: r.reliability,
      at: new Date(at).toISOString(),
      source: 'simulado',
    }
  })
}

function generateMock(now = Date.now()): Database {
  const rand = mulberry32(MOCK_SEED)
  const people: PersonRecord[] = []
  const respondTimes: RespondTime[] = []
  for (let k = 0; k < MOCK_PEOPLE; k++) {
    const id = `P-${(k + 1).toString().padStart(4, '0')}`
    const gender = weighted<Gender>(rand, [['mulher', 52], ['homem', 40], ['nao-binario', 5], ['prefer-not', 3]])
    const first = gender === 'mulher' ? pick(rand, FEMALE) : gender === 'homem' ? pick(rand, MALE) : pick(rand, NEUTRAL)
    const created = now - Math.floor(rand() * 120) * DAY - Math.floor(rand() * DAY)
    const rushed = rand() < 0.1
    const times = mockRespondTimes(rand, id, 'central', created, rushed)
    if (rand() < 0.35) times.push(...mockRespondTimes(rand, id, 'cooccurring', created + 20 * 60_000, rushed))
    respondTimes.push(...times)
    people.push({
      id,
      name: `${first} ${pick(rand, SURNAMES)}`,
      gender,
      ageBand: weighted<AgeBand>(rand, [['18-24', 22], ['25-34', 38], ['35-44', 24], ['45-59', 12], ['60+', 3], ['prefer-not', 1]]),
      createdAt: new Date(created).toISOString(),
      completed: new Set(times.map((t) => t.sessionId)).size,
      lastSignal: weighted<SignalLevel>(rand, [['low', 30], ['moderate', 35], ['high', 20], ['wide', 10], ['insufficient', 5]]),
      reliability: mean(times.map((t) => t.reliability)),
      source: 'simulado',
    })
  }
  return { people, respondTimes }
}

const mock = generateMock()
const saved = readJSON<Database>(KEY)

/** Variável global do banco provisório. */
export const DB: Database = {
  people: [...mock.people, ...(saved?.people ?? [])],
  respondTimes: [...mock.respondTimes, ...(saved?.respondTimes ?? [])],
}
Object.assign(globalThis, { PERCEBER_DB: DB })

let snapshot: Database = { people: DB.people, respondTimes: DB.respondTimes }
const listeners = new Set<() => void>()

function commit(next: Partial<Database>) {
  Object.assign(DB, next)
  snapshot = { people: DB.people, respondTimes: DB.respondTimes }
  writeJSON(KEY, { people: DB.people.filter((p) => p.source === 'app'), respondTimes: DB.respondTimes.filter((r) => r.source === 'app') })
  listeners.forEach((l) => l())
}

export function useDB(): Database {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => snapshot,
    () => snapshot,
  )
}

export function registerPerson(p: Pick<PersonRecord, 'id' | 'name' | 'gender' | 'ageBand' | 'createdAt'>) {
  if (DB.people.some((x) => x.id === p.id)) return
  commit({ people: [...DB.people, { ...p, completed: 0, lastSignal: null, reliability: null, source: 'app' }] })
}

export function updatePerson(id: string, patch: Partial<Omit<PersonRecord, 'id' | 'source'>>) {
  if (!DB.people.some((x) => x.id === id)) return
  commit({ people: DB.people.map((x) => (x.id === id ? { ...x, ...patch } : x)) })
}

/** Grava (ou regrava, se a pessoa voltou e mudou a resposta) o tempo de uma pergunta. */
export function saveRespondTime(rec: Omit<RespondTime, 'id' | 'source'>) {
  const id = `${rec.sessionId}-${rec.itemId}`
  const row: RespondTime = { ...rec, id, source: 'app' }
  const exists = DB.respondTimes.some((r) => r.id === id)
  commit({ respondTimes: exists ? DB.respondTimes.map((r) => (r.id === id ? row : r)) : [...DB.respondTimes, row] })
}

export const personReliability = (personId: string) => mean(DB.respondTimes.filter((r) => r.personId === personId).map((r) => r.reliability))
