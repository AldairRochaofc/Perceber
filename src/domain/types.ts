import type { Gender } from './people'
/* Modelo de dados do PERCEBER. Ver docs/ARQUITETURA.md */

export type DomainGroup = 'central' | 'context' | 'cooccurring'

export type DomainId =
  | 'social' | 'communication' | 'sensory' | 'repetitive' | 'routine' | 'interests'
  | 'masking' | 'impact'
  | 'executive' | 'attention' | 'anxiety' | 'mood' | 'sleep'

export type Domain = {
  id: DomainId
  code: string // EC-1…EC-6, CX-1…CX-2, AC-1…AC-5
  label: string
  short: string
  group: DomainGroup
  observes: string // o que o domínio pretende observar (construto em linguagem simples)
  limits: string // limites de interpretação
  alternatives: string[] // outras explicações possíveis para relatos frequentes
  basis: string[] // ids de referências conceituais
}

export type ItemTier = 'core' | 'followup'

export type Item = {
  id: string
  domain: DomainId
  tier: ItemTier
  text: string
  example?: string
  reverse?: boolean
}

export type AnswerValue = 0 | 1 | 2 | 3 | 4

export type Response = {
  itemId: string
  value: AnswerValue | null // null = "prefiro não responder"
  answeredAt: string
  latencyMs: number
}

export type UsageStatus = 'research' | 'authorized-screening' | 'professional'

export type EvidenceStatus = 'not-started' | 'in-progress' | 'documented' | 'not-applicable'

export type EvidenceField = {
  key: string
  label: string
  status: EvidenceStatus
  note: string
}

export type LifecycleStage =
  | 'draft' | 'expert-review' | 'cognitive-interviews' | 'pilot' | 'calibration' | 'research' | 'authorized-screening' | 'professional'

export type ModuleId = 'central' | 'cooccurring'

export type AssessmentModule = {
  id: ModuleId
  code: string
  name: string
  version: string
  itemBankVersion: string
  purpose: string
  population: string
  minutes: [number, number]
  questions: [number, number]
  constructs: DomainId[]
  instructions: string
  sources: string[]
  usageStatus: UsageStatus
  lifecycle: LifecycleStage
  rights: string
  limitations: string[]
  accessibility: { adaptation: string; validated: boolean }[]
  administration: string
  resumable: boolean
  evidence: EvidenceField[]
}

export type SessionStatus = 'in-progress' | 'completed' | 'abandoned'

export type ContextFactors = {
  factors: string[]
  comment: string
  includeComment: boolean
}

export type AssessmentSession = {
  id: string
  /** Pessoa (perfil) que respondeu. Ausente em sessões antigas. */
  personId?: string
  /** Forma do banco de itens: 0 = A, 1 = B, 2 = C. */
  form?: number
  moduleId: ModuleId
  moduleVersion: string
  itemBankVersion: string
  startedAt: string
  updatedAt: string
  completedAt?: string
  status: SessionStatus
  responses: Response[]
  context?: ContextFactors
  result?: ScoreResult
}

/** Faixa descritiva: o rótulo da escala mais próximo da média. Não é norma populacional. */
export type DomainBand = 'never' | 'rarely' | 'sometimes' | 'often' | 'almost-always' | 'insufficient'

export type DomainScore = {
  domain: DomainId
  presented: number
  answered: number
  skipped: number
  raw: number
  maxRaw: number
  mean: number | null
  min: number | null
  max: number | null
  values: number[]
  band: DomainBand
  /** quanto uma única resposta pode mover a média (4 / respondidas) */
  sensitivity: number | null
}

export type SignalLevel = 'low' | 'moderate' | 'high' | 'wide' | 'insufficient'

export type QualityFlag = 'many-skipped' | 'straight-lining' | 'reverse-inconsistent' | 'very-fast'

export type DataQuality = {
  presented: number
  answered: number
  skipped: number
  completeness: number
  flags: QualityFlag[]
  level: 'adequate' | 'attention' | 'limited'
  medianLatencyMs: number | null
}

export type ScoreResult = {
  algorithmVersion: string
  moduleId: ModuleId
  moduleVersion: string
  itemBankVersion: string
  computedAt: string
  domains: DomainScore[]
  signal: SignalLevel | null // null para módulos que não geram sinal
  frequentCentral: number
  quality: DataQuality
  inputHash: string
}

export type ConsentId = 'account' | 'modules' | 'share' | 'research' | 'contact' | 'secondary'

export type ConsentChoice = 'granted' | 'declined' | 'revoked'

export type ConsentRecord = {
  id: string
  consentId: ConsentId
  version: string
  textHash: string
  choice: ConsentChoice
  at: string
  context?: string // ex.: id do compartilhamento
}

export type AgeBand = '18-24' | '25-34' | '35-44' | '45-59' | '60+' | 'prefer-not'

export type Profile = {
  id: string
  preferredName: string
  civilName?: string
  pronouns?: string
  ageBand: AgeBand
  gender?: Gender
  language: 'pt-BR'
  reason?: string
  contactChannel?: string
  researchInvites: boolean
  supportContact?: { name: string; phone: string; consentAt: string }
  createdAt: string
  updatedAt: string
}

export type Eligibility = {
  adult: boolean
  understands: boolean
  language: 'fluent' | 'some-difficulty' | 'no'
  adaptations: string[]
  distress: boolean
  at: string
}

export type ShareScope = 'summary' | 'scores' | 'full'

export type ShareGrant = {
  id: string
  code: string
  sessionId: string
  professionalId: string | null
  professionalLabel: string
  scope: ShareScope
  createdAt: string
  expiresAt: string
  revokedAt?: string
  consentRecordId: string
  accessLog: { at: string; actor: string }[]
  observations: { id: string; at: string; author: string; text: string }[]
}

export type ExportRecord = {
  id: string
  sessionId: string
  at: string
  hash: string
  format: 'html' | 'json' | 'print'
  platformVersion: string
}

export type Role = 'participant' | 'professional' | 'admin'

export type AuditEntry = {
  seq: number
  at: string
  role: Role
  action: string
  target: string
  detail: string
  prevHash: string
  hash: string
}

export type Prefs = {
  fontScale: number
  contrast: 'normal' | 'high'
  motion: 'system' | 'reduce'
  theme: 'light' | 'dusk' | 'system'
  autoAdvance: boolean
}

export type ChecklistKey = 'technical' | 'psychometric' | 'ethics' | 'legal' | 'security'

export type ChecklistState = Record<ChecklistKey, { approved: boolean; by?: string; at?: string }>

export type Professional = {
  id: string
  name: string
  profession: string
  registry: string
  areas: string[]
  modality: ('presencial' | 'remoto')[]
  accessibility: string[]
  location: string
  availability: string
  fictitious: true
}

export type Reference = {
  id: string
  citation: string
  title: string
  year: number
  url: string
  doi?: string
  types: ReferenceType[]
  population: string
  limitations: string
  relation: string
}

export type ReferenceType =
  | 'norma' | 'diretriz' | 'revisao' | 'validade' | 'confiabilidade' | 'acessibilidade' | 'equidade' | 'protecao-dados' | 'etica-pesquisa' | 'conceitual'
