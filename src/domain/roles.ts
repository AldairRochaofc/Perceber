import type { Role } from './types'

/**
 * Perfis de acesso e matriz de permissões (princípio do menor privilégio).
 * Nesta demonstração a troca de perfil é livre; em produção cada perfil
 * exige conta própria, e profissionais e administradores
 * exigem autenticação multifator.
 */
export const ROLES: { id: Role; label: string; description: string; mfa: boolean }[] = [
  { id: 'participant', label: 'Participante', description: 'Responde aos módulos, vê os próprios resultados e compartilha com profissionais cadastrados.', mfa: false },
  { id: 'professional', label: 'Profissional', description: 'Profissional cadastrado: abre avaliações pelo código que a pessoa liberou e vê o Relatório BI.', mfa: true },
  { id: 'admin', label: 'Administração', description: 'Registro de participantes, tempos de resposta, Relatório BI, módulos, permissões e auditoria.', mfa: true },
]

export const ROLE_LABEL = Object.fromEntries(ROLES.map((r) => [r.id, r.label])) as Record<Role, string>

export type Access = 'full' | 'partial' | 'none'

export const PERMISSIONS: { resource: string; note: string; access: Record<Role, Access> }[] = [
  { resource: 'Registro de participantes (ID, nome, gênero, faixa etária)', note: 'Participante vê só o próprio cadastro.', access: { participant: 'partial', professional: 'none', admin: 'full' } },
  { resource: 'Nome de preferência', note: 'Profissional vê se a pessoa compartilhar.', access: { participant: 'full', professional: 'partial', admin: 'full' } },
  { resource: 'Respostas individuais', note: 'Profissional vê com escopo “completo”.', access: { participant: 'full', professional: 'partial', admin: 'none' } },
  { resource: 'Indicadores e relatório individual', note: 'Profissional conforme escopo e prazo.', access: { participant: 'full', professional: 'partial', admin: 'none' } },
  { resource: 'Tempo de resposta e confiabilidade (RespondTime)', note: 'Participante vê os próprios; administração vê todos.', access: { participant: 'partial', professional: 'partial', admin: 'full' } },
  { resource: 'Relatório BI (agregado, sem dados pessoais)', note: 'Somente números agregados.', access: { participant: 'none', professional: 'full', admin: 'full' } },
  { resource: 'Relatório de participantes e público pesquisado', note: 'Gênero, razão de gênero e faixa etária predominante.', access: { participant: 'none', professional: 'none', admin: 'full' } },
  { resource: 'Registro de evidências dos módulos', note: 'Administração aprova e publica versões.', access: { participant: 'partial', professional: 'partial', admin: 'full' } },
  { resource: 'Liberação de módulos para uso profissional', note: 'Bloqueada até evidências e aprovações completas.', access: { participant: 'none', professional: 'none', admin: 'full' } },
  { resource: 'Log de auditoria', note: 'Somente leitura; encadeado por hash.', access: { participant: 'partial', professional: 'none', admin: 'full' } },
  { resource: 'Usuários, perfis e configurações', note: 'Com MFA e registro de cada alteração.', access: { participant: 'none', professional: 'none', admin: 'full' } },
]

/** Áreas do produto e quem pode entrar. */
export const AREA_ACCESS: Record<string, Role[]> = {
  participant: ['participant'],
  professional: ['professional'],
  governance: ['admin'],
  registry: ['admin'],
  bi: ['admin', 'professional'],
}

export const HOME_FOR_ROLE: Record<Role, string> = {
  participant: '/',
  professional: '/portal',
  admin: '/participantes',
}
