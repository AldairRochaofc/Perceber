import { sha256 } from '../lib/sha256'
import type { ConsentId, ConsentRecord } from './types'

/**
 * Consentimentos separados, versionados e revogáveis.
 * O hash do texto exibido é registrado junto com a escolha, data e hora,
 * para provar exatamente o que a pessoa leu.
 */
export const CONSENT_VERSION = 'TCLE-2026.10-v1'

export type ConsentDefinition = {
  id: ConsentId
  title: string
  text: string
  required: boolean
  requiredFor?: string
  askedAt: 'onboarding' | 'share'
  note?: string
}

export const CONSENTS: ConsentDefinition[] = [
  {
    id: 'account',
    title: 'Criar meu perfil e usar a plataforma',
    text: 'Autorizo o registro do nome pelo qual quero ser chamado(a), da faixa etária e das preferências de acessibilidade, para usar o PERCEBER.',
    required: true,
    requiredFor: 'Necessário para criar o perfil.',
    askedAt: 'onboarding',
  },
  {
    id: 'modules',
    title: 'Responder aos módulos de triagem',
    text: 'Autorizo o registro das minhas respostas e o cálculo de indicadores por domínio, para que eu possa ver meus resultados e meu relatório.',
    required: true,
    requiredFor: 'Necessário para responder às avaliações.',
    askedAt: 'onboarding',
  },
  {
    id: 'share',
    title: 'Compartilhar com um profissional que eu escolher',
    text: 'Autorizo que o profissional indicado veja somente o conteúdo e pelo prazo que eu definir, com registro de cada acesso. Posso revogar a qualquer momento.',
    required: false,
    askedAt: 'share',
    note: 'Perguntado separadamente a cada compartilhamento.',
  },
  {
    id: 'research',
    title: 'Usar meus dados em pesquisa',
    text: 'Autorizo o uso das minhas respostas, separadas da minha identidade, em pesquisa sobre o desenvolvimento e a validação dos módulos, conforme protocolo aprovado por comitê de ética.',
    required: false,
    askedAt: 'onboarding',
    note: 'O protocolo ainda aguarda aprovação do CEP. Nenhum dado é usado em pesquisa até lá, mesmo com este consentimento.',
  },
  {
    id: 'contact',
    title: 'Receber convites para estudos futuros',
    text: 'Autorizo ser contatado(a) pelo canal que eu informar para convites de participação em estudos. Cada convite terá seu próprio consentimento.',
    required: false,
    askedAt: 'onboarding',
  },
  {
    id: 'secondary',
    title: 'Uso de dados anonimizados em estudos secundários',
    text: 'Autorizo o uso de dados anonimizados derivados das minhas respostas em estudos secundários aprovados. Entendo que a anonimização reduz riscos, mas não é absoluta.',
    required: false,
    askedAt: 'onboarding',
  },
]

export const CONSENT_BY_ID = Object.fromEntries(CONSENTS.map((c) => [c.id, c])) as Record<ConsentId, ConsentDefinition>

export const consentTextHash = (id: ConsentId) => {
  const c = CONSENT_BY_ID[id]
  return sha256(`${CONSENT_VERSION}\n${c.title}\n${c.text}`)
}

/** Situação atual de um consentimento: o último registro vale. */
export function consentState(records: ConsentRecord[], id: ConsentId) {
  const own = records.filter((r) => r.consentId === id && !r.context)
  return own.at(-1) ?? null
}

export const isGranted = (records: ConsentRecord[], id: ConsentId) => consentState(records, id)?.choice === 'granted'

/** O que a pessoa precisa saber antes de confirmar (LGPD, art. 9º). */
export const DISCLOSURE: { title: string; body: string }[] = [
  {
    title: 'Quais dados',
    body: 'Nome de preferência, faixa etária, preferências de acessibilidade, respostas às perguntas, fatores de contexto e comentários que você decidir incluir. Nome civil, pronomes e contato são opcionais.',
  },
  {
    title: 'Para quê',
    body: 'Mostrar seus resultados, gerar seu relatório e, só se você autorizar, compartilhar com um profissional ou apoiar pesquisa aprovada.',
  },
  {
    title: 'Onde ficam e por quanto tempo',
    body: 'Nesta versão de demonstração, tudo fica apenas neste navegador, até você excluir. Nenhum servidor recebe suas respostas. Em produção, os prazos de guarda serão definidos na política de retenção.',
  },
  {
    title: 'Quem é responsável',
    body: 'Controlador e encarregado de dados (DPO): a definir pela instituição responsável antes de qualquer uso real. Este protótipo não tem controlador designado.',
  },
  {
    title: 'Com quem é compartilhado',
    body: 'Com ninguém, por padrão. Profissionais só veem o que você liberar, pelo prazo que você escolher. Pesquisadores só veem dados separados da sua identidade, se você autorizar e o protocolo for aprovado.',
  },
  {
    title: 'Participação voluntária',
    body: 'Pesquisa e contato futuro são opcionais. Recusar não impede você de responder às avaliações nem de ver seus resultados.',
  },
  {
    title: 'Seus direitos',
    body: 'Você pode acessar, corrigir, exportar (portabilidade) e excluir seus dados, e revogar qualquer consentimento, a qualquer momento, em Meu perfil.',
  },
  {
    title: 'Riscos, benefícios e limites',
    body: 'Responder pode trazer lembranças ou desconforto; você pode pausar ou parar quando quiser. O benefício é organizar informações para uma conversa profissional. O resultado não é diagnóstico. Anonimização e pseudonimização reduzem riscos, mas não são garantias absolutas.',
  },
]
