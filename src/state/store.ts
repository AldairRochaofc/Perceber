import { useSyncExternalStore } from 'react'
import { appendAudit } from '../domain/audit'
import { CONSENT_VERSION, consentTextHash } from '../domain/consents'
import { PROFESSIONAL_BY_ID } from '../domain/content'
import { pruneResponses } from '../domain/engine'
import { FORM_COUNT } from '../domain/items'
import { MODULE_BY_ID, PLATFORM_VERSION } from '../domain/modules'
import { computeResult } from '../domain/scoring'
import { itemTiming, mean, responseReliability } from '../domain/timing'
import { registerPerson, saveRespondTime, updatePerson } from '../data/db'
import type {
  AnswerValue, AssessmentSession, AuditEntry, ChecklistKey, ChecklistState, ConsentChoice, ConsentId, ConsentRecord,
  ContextFactors, Eligibility, ExportRecord, ModuleId, Prefs, Profile, Role, ShareGrant, ShareScope,
} from '../domain/types'
import { addDays } from '../lib/format'
import { accessCode, normalizeCode, uid } from '../lib/ids'
import { readJSON, writeJSON } from '../lib/storage'

/**
 * Estado da aplicação. Nesta versão de demonstração tudo vive no navegador
 * (localStorage). As ações abaixo são o contrato que uma API real deve
 * implementar — ver docs/ARQUITETURA.md.
 */

export type ResearchExport = { id: string; at: string; dimension: string; domain: string; rows: number }

export type State = {
  schema: 2
  prefs: Prefs
  role: Role
  profile: Profile | null
  eligibility: Eligibility | null
  consents: ConsentRecord[]
  sessions: AssessmentSession[]
  shares: ShareGrant[]
  exports: ExportRecord[]
  audit: AuditEntry[]
  checklist: ChecklistState
  researchExports: ResearchExport[]
}

const KEY = 'perceber:v2'

export const DEFAULT_PREFS: Prefs = {
  fontScale: 1,
  contrast: 'normal',
  motion: 'system',
  theme: 'light',
  autoAdvance: true,
}

const emptyChecklist = (): ChecklistState => ({
  technical: { approved: false },
  psychometric: { approved: false },
  ethics: { approved: false },
  legal: { approved: false },
  security: { approved: false },
})

const initial = (): State => ({
  schema: 2,
  prefs: DEFAULT_PREFS,
  role: 'participant',
  profile: null,
  eligibility: null,
  consents: [],
  sessions: [],
  shares: [],
  exports: [],
  audit: [],
  checklist: emptyChecklist(),
  researchExports: [],
})

function load(): State {
  const saved = readJSON<State>(KEY)
  if (!saved || saved.schema !== 2) return initial()
  const role: Role = ['participant', 'professional', 'admin'].includes(saved.role) ? saved.role : 'participant'
  return { ...initial(), ...saved, role, prefs: { ...DEFAULT_PREFS, ...saved.prefs } }
}

let state: State = load()
if (state.profile) syncPerson(state.profile)

function syncPerson(p: Profile) {
  registerPerson({ id: p.id, name: p.civilName || p.preferredName, gender: p.gender ?? 'prefer-not', ageBand: p.ageBand, createdAt: p.createdAt })
}
const listeners = new Set<() => void>()

function set(next: State) {
  state = next
  writeJSON(KEY, state)
  listeners.forEach((l) => l())
}

function update(fn: (s: State) => State) {
  set(fn(state))
}

const now = () => new Date().toISOString()

function audit(s: State, action: string, target = '', detail = ''): State {
  return { ...s, audit: appendAudit(s.audit, { role: s.role, action, target, detail }) }
}

export function getState() {
  return state
}

export function useStore(): State {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
    () => state,
  )
}

/* ───────── Preferências e perfil de acesso ───────── */

export function setPrefs(patch: Partial<Prefs>) {
  update((s) => ({ ...s, prefs: { ...s.prefs, ...patch } }))
}

export function switchRole(role: Role) {
  if (role === state.role) return
  update((s) => audit({ ...s, role }, 'role.switched', role))
}

/* ───────── Consentimento ───────── */

export function recordConsent(consentId: ConsentId, choice: ConsentChoice, context?: string): ConsentRecord {
  const record: ConsentRecord = {
    id: uid('cs'),
    consentId,
    version: CONSENT_VERSION,
    textHash: consentTextHash(consentId),
    choice,
    at: now(),
    context,
  }
  update((s) => audit({ ...s, consents: [...s.consents, record] }, `consent.${choice}`, consentId, context ?? ''))
  return record
}

/* ───────── Perfil ───────── */

export function createProfile(data: Omit<Profile, 'id' | 'createdAt' | 'updatedAt' | 'language'>) {
  const at = now()
  const profile: Profile = { ...data, id: uid('pf'), language: 'pt-BR', createdAt: at, updatedAt: at }
  update((s) => audit({ ...s, role: 'participant', profile }, 'profile.created'))
  syncPerson(profile)
}

export function updateProfile(patch: Partial<Profile>) {
  update((s) => (s.profile ? audit({ ...s, profile: { ...s.profile, ...patch, updatedAt: now() } }, 'profile.updated', Object.keys(patch).join(', ')) : s))
  const p = state.profile
  if (p) updatePerson(p.id, { name: p.civilName || p.preferredName, gender: p.gender ?? 'prefer-not', ageBand: p.ageBand })
}

/**
 * Novo participante, do zero: a pessoa atual continua registrada (DB e
 * auditoria), e o app volta ao início com consentimentos e perfil novos.
 */
export function startOver() {
  update((s) => audit({ ...s, role: 'participant', profile: null, eligibility: null, consents: [] }, 'participant.new', s.profile?.id ?? ''))
}

export function recordEligibility(e: Omit<Eligibility, 'at'>) {
  update((s) => audit({ ...s, eligibility: { ...e, at: now() } }, e.distress ? 'eligibility.stopped' : 'eligibility.recorded'))
}

/* ───────── Avaliações ───────── */

export function startSession(moduleId: ModuleId): string {
  const open = mySessions(state).find((x) => x.moduleId === moduleId && x.status === 'in-progress')
  if (open) return open.id
  const module = MODULE_BY_ID[moduleId]
  const at = now()
  const session: AssessmentSession = {
    id: uid('av'),
    personId: state.profile?.id,
    // Cada nova avaliação do módulo usa a forma seguinte (A → B → C → A…).
    form: state.sessions.filter((x) => x.moduleId === moduleId).length % FORM_COUNT,
    moduleId,
    moduleVersion: module.version,
    itemBankVersion: module.itemBankVersion,
    startedAt: at,
    updatedAt: at,
    status: 'in-progress',
    responses: [],
  }
  update((s) => audit({ ...s, sessions: [...s.sessions, session] }, 'assessment.started', module.code))
  return session.id
}

export function answer(sessionId: string, itemId: string, value: AnswerValue | null, latencyMs: number) {
  update((s) => ({
    ...s,
    sessions: s.sessions.map((x) => {
      if (x.id !== sessionId) return x
      const existing = x.responses.findIndex((r) => r.itemId === itemId)
      const response = { itemId, value, answeredAt: now(), latencyMs: Math.round(latencyMs) }
      const responses = existing >= 0 ? x.responses.map((r, i) => (i === existing ? response : r)) : [...x.responses, response]
      return { ...x, responses: pruneResponses(x.moduleId, responses), updatedAt: now() }
    }),
  }))
  const session = state.sessions.find((x) => x.id === sessionId)
  const personId = session?.personId ?? state.profile?.id
  if (!session || !personId) return
  const timing = itemTiming(itemId, session.form)
  const r = responseReliability(latencyMs, value, timing)
  saveRespondTime({
    personId,
    sessionId,
    moduleId: session.moduleId,
    itemId,
    form: session.form ?? 0,
    complexity: timing.complexity,
    latencyMs: Math.round(latencyMs),
    idealMs: timing.idealMs,
    timeConfidence: r.time,
    answerConfidence: r.answer,
    reliability: r.reliability,
    at: now(),
  })
}

export function setContext(sessionId: string, context: ContextFactors) {
  update((s) => ({ ...s, sessions: s.sessions.map((x) => (x.id === sessionId ? { ...x, context } : x)) }))
}

export function completeSession(sessionId: string) {
  update((s) => {
    const session = s.sessions.find((x) => x.id === sessionId)
    if (!session) return s
    const at = now()
    const result = computeResult(session.moduleId, session.responses, at)
    return audit(
      { ...s, sessions: s.sessions.map((x) => (x.id === sessionId ? { ...x, status: 'completed', completedAt: at, updatedAt: at, result } : x)) },
      'assessment.completed',
      MODULE_BY_ID[session.moduleId].code,
      result.inputHash.slice(0, 12),
    )
  })
  const done = state.sessions.find((x) => x.id === sessionId)
  const personId = done?.personId ?? state.profile?.id
  if (!done?.result || !personId) return
  const mine = state.sessions.filter((x) => x.status === 'completed' && (x.personId ?? state.profile?.id) === personId)
  updatePerson(personId, {
    completed: mine.length,
    lastSignal: done.result.signal ?? null,
    reliability: mean(mine.flatMap((x) => x.responses.map((r) => responseReliability(r.latencyMs, r.value, itemTiming(r.itemId, x.form)).reliability))),
  })
}

/* ───────── Compartilhamento ───────── */

export function createShare(input: { sessionId: string; professionalId: string | null; professionalLabel: string; scope: ShareScope; days: number }): ShareGrant {
  const id = uid('sh')
  const consent = recordConsent('share', 'granted', id)
  const at = now()
  const grant: ShareGrant = {
    id,
    code: accessCode(),
    sessionId: input.sessionId,
    professionalId: input.professionalId,
    professionalLabel: input.professionalLabel,
    scope: input.scope,
    createdAt: at,
    expiresAt: addDays(at, input.days),
    consentRecordId: consent.id,
    accessLog: [],
    observations: [],
  }
  update((s) => audit({ ...s, shares: [...s.shares, grant] }, 'share.created', grant.code, `${input.scope}, ${input.days} dias`))
  return grant
}

export function revokeShare(shareId: string) {
  const grant = state.shares.find((g) => g.id === shareId)
  if (!grant || grant.revokedAt) return
  recordConsent('share', 'revoked', shareId)
  update((s) => audit({ ...s, shares: s.shares.map((g) => (g.id === shareId ? { ...g, revokedAt: now() } : g)) }, 'share.revoked', grant.code))
}

export type ShareStatus = 'active' | 'expired' | 'revoked'

export const shareStatus = (g: ShareGrant, at = Date.now()): ShareStatus =>
  g.revokedAt ? 'revoked' : new Date(g.expiresAt).getTime() < at ? 'expired' : 'active'

export function openShare(rawCode: string, actor: string): { ok: true; grant: ShareGrant } | { ok: false; reason: 'not-found' | 'expired' | 'revoked' } {
  const code = normalizeCode(rawCode)
  const grant = state.shares.find((g) => g.code === code)
  if (!grant) {
    update((s) => audit(s, 'share.denied', code, 'código inexistente'))
    return { ok: false, reason: 'not-found' }
  }
  const status = shareStatus(grant)
  if (status !== 'active') {
    update((s) => audit(s, 'share.denied', code, status))
    return { ok: false, reason: status }
  }
  const entry = { at: now(), actor }
  update((s) => audit({ ...s, shares: s.shares.map((g) => (g.id === grant.id ? { ...g, accessLog: [...g.accessLog, entry] } : g)) }, 'share.accessed', code, actor))
  return { ok: true, grant: state.shares.find((g) => g.id === grant.id)! }
}

export function addObservation(shareId: string, text: string, author: string) {
  update((s) =>
    audit(
      { ...s, shares: s.shares.map((g) => (g.id === shareId ? { ...g, observations: [...g.observations, { id: uid('ob'), at: now(), author, text }] } : g)) },
      'observation.added',
      s.shares.find((g) => g.id === shareId)?.code ?? '',
    ),
  )
}

export const professionalName = (g: ShareGrant) => (g.professionalId ? PROFESSIONAL_BY_ID[g.professionalId]?.name : null) ?? g.professionalLabel

/* ───────── Exportações e direitos do titular ───────── */

export function recordExport(sessionId: string, hash: string, format: ExportRecord['format']): ExportRecord {
  const record: ExportRecord = { id: uid('rx'), sessionId, at: now(), hash, format, platformVersion: PLATFORM_VERSION }
  update((s) => audit({ ...s, exports: [...s.exports, record] }, 'report.exported', record.id, `${format} ${hash.slice(0, 12)}`))
  return record
}

export function exportAllData(): string {
  update((s) => audit(s, 'data.exported'))
  const { prefs, profile, eligibility, consents, sessions, shares, exports, audit: log } = state
  return JSON.stringify(
    { formato: 'PERCEBER portabilidade v1', geradoEm: now(), plataforma: PLATFORM_VERSION, prefs, profile, eligibility, consents, sessions, shares, exports, audit: log },
    null,
    2,
  )
}

/* ───────── Governança e pesquisa ───────── */

export function setChecklist(key: ChecklistKey, approved: boolean) {
  update((s) =>
    audit(
      { ...s, checklist: { ...s.checklist, [key]: approved ? { approved, by: 'Administração', at: now() } : { approved: false } } },
      'checklist.updated',
      key,
      approved ? 'aprovado' : 'retirado',
    ),
  )
}

export function logAuditVerification(ok: boolean) {
  update((s) => audit(s, 'audit.verified', '', ok ? 'íntegro' : 'quebra detectada'))
}

export function logResearchExport(dimension: string, domain: string, rows: number) {
  const record: ResearchExport = { id: uid('re'), at: now(), dimension, domain, rows }
  update((s) => audit({ ...s, researchExports: [...s.researchExports, record] }, 'research.exported', `${dimension} × ${domain}`, `${rows} linhas`))
}

/* ───────── Seletores ───────── */

/** Sessões da pessoa que está usando o app agora. */
export const mySessions = (s: State) => s.sessions.filter((x) => !x.personId || x.personId === s.profile?.id)

/** Compartilhamentos das avaliações da pessoa atual. */
export const myShares = (s: State) => {
  const ids = new Set(mySessions(s).map((x) => x.id))
  return s.shares.filter((g) => ids.has(g.sessionId))
}

export const completedSessions = (s: State) =>
  mySessions(s).filter((x) => x.status === 'completed' && x.result).sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))

export const latestCompleted = (s: State, moduleId: ModuleId) => completedSessions(s).find((x) => x.moduleId === moduleId) ?? null

export const sessionById = (s: State, id: string) => s.sessions.find((x) => x.id === id) ?? null
