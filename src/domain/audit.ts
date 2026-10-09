import { canonicalJSON, sha256 } from '../lib/sha256'
import type { AuditEntry, Role } from './types'

/**
 * Log de auditoria somente-acréscimo, encadeado por hash: cada registro
 * carrega o hash do anterior. Alterar ou apagar um registro antigo quebra
 * a cadeia e a verificação aponta onde.
 */
export const GENESIS = '0'.repeat(64)

export const ACTION_LABEL: Record<string, string> = {
  'profile.created': 'Perfil criado',
  'profile.updated': 'Perfil atualizado',
  'consent.granted': 'Consentimento concedido',
  'consent.declined': 'Consentimento recusado',
  'consent.revoked': 'Consentimento revogado',
  'eligibility.recorded': 'Verificação inicial registrada',
  'eligibility.stopped': 'Avaliação interrompida por segurança',
  'assessment.started': 'Avaliação iniciada',
  'assessment.completed': 'Avaliação concluída',
  'assessment.deleted': 'Avaliação excluída',
  'report.exported': 'Relatório exportado',
  'share.created': 'Acesso criado',
  'share.revoked': 'Acesso revogado',
  'share.accessed': 'Relatório aberto por profissional',
  'share.denied': 'Tentativa de acesso negada',
  'observation.added': 'Observação profissional registrada',
  'data.exported': 'Dados pessoais exportados',
  'data.erased': 'Todos os dados excluídos',
  'role.switched': 'Perfil de acesso alterado',
  'participant.new': 'Novo participante iniciado',
  'research.exported': 'Exportação agregada de pesquisa',
  'checklist.updated': 'Aprovação de liberação atualizada',
  'audit.verified': 'Integridade do log verificada',
}

export const hashEntry = (e: Omit<AuditEntry, 'hash'>) => sha256(canonicalJSON(e))

export function appendAudit(
  log: AuditEntry[],
  input: { role: Role; action: string; target?: string; detail?: string; at?: string },
): AuditEntry[] {
  const prev = log.at(-1)
  const base = {
    seq: (prev?.seq ?? 0) + 1,
    at: input.at ?? new Date().toISOString(),
    role: input.role,
    action: input.action,
    target: input.target ?? '',
    detail: input.detail ?? '',
    prevHash: prev?.hash ?? GENESIS,
  }
  return [...log, { ...base, hash: hashEntry(base) }]
}

export function verifyChain(log: AuditEntry[]): { ok: true; count: number } | { ok: false; brokenAt: number } {
  let prevHash = GENESIS
  for (const entry of log) {
    const { hash, ...rest } = entry
    if (rest.prevHash !== prevHash || hashEntry(rest) !== hash) return { ok: false, brokenAt: entry.seq }
    prevHash = hash
  }
  return { ok: true, count: log.length }
}
