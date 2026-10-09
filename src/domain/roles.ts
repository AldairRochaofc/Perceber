import type { Role } from './types'

/**
 * Perfis de acesso e matriz de permissões (princípio do menor privilégio).
 * Nesta demonstração a troca de perfil é livre; em produção cada perfil
 * exige conta própria, e profissionais, pesquisadores e administradores
 * exigem autenticação multifator.
 */
export const ROLES: { id: Role; label: string; description: string; mfa: boolean }[] = [
  { id: 'participant', label: 'Participante', description: 'Responde aos módulos, vê os próprios resultados e controla compartilhamentos.', mfa: false },
  { id: 'professional', label: 'Profissional', description: 'Vê apenas o que a pessoa liberou, pelo prazo definido, com cada acesso registrado.', mfa: true },
  { id: 'researcher', label: 'Pesquisador(a)', description: 'Vê dados agregados e pseudonimizados, conforme protocolo aprovado.', mfa: true },
  { id: 'admin', label: 'Administração', description: 'Gerencia módulos, versões, permissões e auditoria. Não vê respostas individuais.', mfa: true },
  { id: 'committee', label: 'Comitê científico', description: 'Acompanha evidências, qualidade e liberação de módulos. Sem acesso à identidade.', mfa: true },
]

export const ROLE_LABEL = Object.fromEntries(ROLES.map((r) => [r.id, r.label])) as Record<Role, string>

export type Access = 'full' | 'partial' | 'none'

export const PERMISSIONS: { resource: string; note: string; access: Record<Role, Access> }[] = [
  { resource: 'Identidade (nome civil, contato)', note: 'Só a própria pessoa.', access: { participant: 'full', professional: 'none', researcher: 'none', admin: 'none', committee: 'none' } },
  { resource: 'Nome de preferência', note: 'Profissional vê se a pessoa compartilhar.', access: { participant: 'full', professional: 'partial', researcher: 'none', admin: 'none', committee: 'none' } },
  { resource: 'Respostas individuais', note: 'Profissional vê com escopo “completo”.', access: { participant: 'full', professional: 'partial', researcher: 'none', admin: 'none', committee: 'none' } },
  { resource: 'Indicadores e relatório individual', note: 'Profissional conforme escopo e prazo.', access: { participant: 'full', professional: 'partial', researcher: 'none', admin: 'none', committee: 'none' } },
  { resource: 'Dados pseudonimizados de pesquisa', note: 'Só com consentimento e protocolo aprovado.', access: { participant: 'none', professional: 'none', researcher: 'partial', admin: 'none', committee: 'none' } },
  { resource: 'Relatórios agregados', note: 'Células com menos de 5 pessoas são suprimidas.', access: { participant: 'none', professional: 'none', researcher: 'full', admin: 'none', committee: 'full' } },
  { resource: 'Registro de evidências dos módulos', note: 'Comitê aprova; administração publica versões.', access: { participant: 'partial', professional: 'partial', researcher: 'partial', admin: 'partial', committee: 'full' } },
  { resource: 'Liberação de módulos para uso profissional', note: 'Bloqueada até evidências e aprovações completas.', access: { participant: 'none', professional: 'none', researcher: 'none', admin: 'partial', committee: 'full' } },
  { resource: 'Log de auditoria', note: 'Somente leitura; encadeado por hash.', access: { participant: 'partial', professional: 'none', researcher: 'none', admin: 'full', committee: 'partial' } },
  { resource: 'Usuários, perfis e configurações', note: 'Com MFA e registro de cada alteração.', access: { participant: 'none', professional: 'none', researcher: 'none', admin: 'full', committee: 'none' } },
]

/** Áreas do produto e quem pode entrar. */
export const AREA_ACCESS: Record<string, Role[]> = {
  participant: ['participant'],
  professional: ['professional'],
  research: ['researcher'],
  governance: ['admin', 'committee'],
}

export const HOME_FOR_ROLE: Record<Role, string> = {
  participant: '/',
  professional: '/portal',
  researcher: '/pesquisa',
  admin: '/governanca',
  committee: '/governanca',
}
