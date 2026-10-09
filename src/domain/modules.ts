import { ITEM_BANK_VERSION } from './items'
import type { AssessmentModule, EvidenceField, EvidenceStatus, LifecycleStage, ModuleId, UsageStatus } from './types'

export const PLATFORM_VERSION = '2.0.0'

/** Repositório de evidências: campos mínimos exigidos para cada módulo. */
const evidence = (overrides: Partial<Record<string, [EvidenceStatus, string]>>): EvidenceField[] => {
  const base: [string, string, EvidenceStatus, string][] = [
    ['construct', 'Definição operacional do construto', 'in-progress', 'Descrições por domínio redigidas; aguardam revisão por especialistas e pela comunidade autista.'],
    ['theory', 'Teoria de base', 'in-progress', 'Domínios organizados a partir do DSM-5-TR e da literatura sobre adultos; falta documento de fundamentação.'],
    ['blueprint', 'Matriz de especificação', 'in-progress', 'Mapeamento item × domínio × nível (núcleo/aprofundamento) disponível no banco de itens.'],
    ['content', 'Evidências de validade de conteúdo', 'not-started', 'Painel de especialistas e entrevistas cognitivas ainda não realizados.'],
    ['structure', 'Evidências de estrutura interna', 'not-started', 'Requer amostra de pesquisa aprovada pelo CEP.'],
    ['reliability', 'Confiabilidade por método apropriado', 'not-started', 'Nenhuma estimativa. Não exibir índices de confiabilidade.'],
    ['stability', 'Estabilidade temporal', 'not-started', 'Teste-reteste não planejado em detalhe.'],
    ['sem', 'Erro de medida', 'not-started', 'Sem estimativa; a interface mostra apenas dispersão das respostas.'],
    ['convergent', 'Validade convergente e discriminante', 'not-started', 'Depende de instrumentos de comparação autorizados.'],
    ['criterion', 'Relação com critérios externos', 'not-started', 'Sem amostra com avaliação diagnóstica independente.'],
    ['accuracy', 'Sensibilidade, especificidade e valores preditivos', 'not-started', 'Não aplicável antes de estudo com critério externo.'],
    ['invariance', 'Invariância entre grupos', 'not-started', 'Gênero, idade, escolaridade, raça/cor e região a testar.'],
    ['dif', 'Funcionamento diferencial dos itens', 'not-started', 'Depende de amostra calibrada.'],
    ['norms', 'Dados normativos e população de referência', 'not-started', 'Sem norma. Faixas exibidas são descritivas da escala de resposta.'],
    ['generalization', 'Limites de generalização', 'in-progress', 'Somente adultos, autorrelato, português do Brasil.'],
    ['versioning', 'Versão, data, responsáveis e decisões de alteração', 'documented', 'Versões de módulo, banco de itens e algoritmo registradas em cada resultado.'],
  ]
  return base.map(([key, label, status, note]) => {
    const o = overrides[key]
    return { key, label, status: o?.[0] ?? status, note: o?.[1] ?? note }
  })
}

export const MODULES: AssessmentModule[] = [
  {
    id: 'central',
    code: 'PERC-EC',
    name: 'Características do eixo central',
    version: '1.0.0',
    itemBankVersion: ITEM_BANK_VERSION,
    purpose: 'Organizar o autorrelato sobre interação social, comunicação, processamento sensorial, repetição, rotina e interesses, com camuflagem e impacto como contexto.',
    population: 'Pessoas adultas (18 anos ou mais), em autorrelato, que leem português do Brasil.',
    minutes: [8, 12],
    questions: [24, 38],
    constructs: ['social', 'communication', 'sensory', 'repetitive', 'routine', 'interests', 'masking', 'impact'],
    instructions: 'Pense na sua vida em geral nos últimos seis meses, não só em hoje. Escolha com que frequência cada frase descreve você. Não existem respostas certas ou erradas, e você pode pular qualquer pergunta.',
    sources: ['apa-dsm5tr', 'lai-2015', 'hull-2019', 'nice-cg142'],
    usageStatus: 'research',
    lifecycle: 'expert-review',
    rights: 'Itens de autoria própria (PERCEBER). Uso restrito a este protótipo de pesquisa. Reprodução depende de autorização dos autores.',
    limitations: [
      'Sem calibração, norma populacional ou estudo de confiabilidade.',
      'Pontos de corte provisórios, definidos por consenso interno.',
      'Autorrelato: depende de autopercepção, memória e momento de vida.',
      'Domínios não são exclusivos do autismo.',
    ],
    accessibility: [
      { adaptation: 'Uma pergunta por tela, sem limite de tempo', validated: false },
      { adaptation: 'Controle de tamanho de texto e alto contraste', validated: false },
      { adaptation: 'Navegação completa por teclado e leitor de tela', validated: false },
      { adaptation: 'Instruções em áudio', validated: false },
    ],
    administration: 'Núcleo fixo de 3 perguntas por domínio. Quando a média das respostas do núcleo chega a "Às vezes" ou mais, até 2 perguntas de aprofundamento são apresentadas. A ramificação não é teste adaptativo calibrado (TRI).',
    resumable: true,
    evidence: evidence({}),
  },
  {
    id: 'cooccurring',
    code: 'PERC-AC',
    name: 'Áreas coocorrentes',
    version: '1.0.0',
    itemBankVersion: ITEM_BANK_VERSION,
    purpose: 'Registrar experiências em funções executivas, atenção, ansiedade, humor e sono, que frequentemente aparecem junto e mudam a leitura do eixo central.',
    population: 'Pessoas adultas (18 anos ou mais), em autorrelato, que leem português do Brasil.',
    minutes: [3, 5],
    questions: [15, 15],
    constructs: ['executive', 'attention', 'anxiety', 'mood', 'sleep'],
    instructions: 'Pense nas últimas semanas. Escolha com que frequência cada frase descreve você. Estes resultados nunca se somam ao eixo central.',
    sources: ['lai-2019', 'hollocks-2019'],
    usageStatus: 'research',
    lifecycle: 'draft',
    rights: 'Itens de autoria própria (PERCEBER). Não substitui instrumentos clínicos de rastreio de humor, ansiedade ou sono.',
    limitations: [
      'Forma curta de 3 itens por área: só indica onde vale olhar com mais cuidado.',
      'Não avalia risco nem gravidade.',
      'Sem calibração, norma ou estudo de confiabilidade.',
    ],
    accessibility: [
      { adaptation: 'Uma pergunta por tela, sem limite de tempo', validated: false },
      { adaptation: 'Navegação completa por teclado e leitor de tela', validated: false },
    ],
    administration: 'Forma fixa: todas as 15 perguntas, na mesma ordem para todas as pessoas.',
    resumable: true,
    evidence: evidence({ blueprint: ['in-progress', 'Três itens por área, todos no núcleo.'] }),
  },
]

export const MODULE_BY_ID = Object.fromEntries(MODULES.map((m) => [m.id, m])) as Record<ModuleId, AssessmentModule>

export const USAGE_LABEL: Record<UsageStatus, string> = {
  research: 'Pesquisa',
  'authorized-screening': 'Triagem autorizada',
  professional: 'Uso profissional',
}

export const LIFECYCLE: { id: LifecycleStage; label: string }[] = [
  { id: 'draft', label: 'Rascunho' },
  { id: 'expert-review', label: 'Revisão por especialistas' },
  { id: 'cognitive-interviews', label: 'Entrevistas cognitivas' },
  { id: 'pilot', label: 'Estudo piloto' },
  { id: 'calibration', label: 'Calibração' },
  { id: 'research', label: 'Pesquisa' },
  { id: 'authorized-screening', label: 'Triagem autorizada' },
  { id: 'professional', label: 'Uso profissional' },
]

export const EVIDENCE_LABEL: Record<EvidenceStatus, string> = {
  'not-started': 'Não iniciado',
  'in-progress': 'Em andamento',
  documented: 'Documentado',
  'not-applicable': 'Não se aplica',
}

/** Trava de liberação: nenhum módulo vira "uso profissional" sem evidências e aprovações. */
export function releaseBlockers(
  module: AssessmentModule,
  checklist: Record<string, { approved: boolean }>,
): string[] {
  const blockers: string[] = []
  for (const f of module.evidence) {
    if (f.status !== 'documented' && f.status !== 'not-applicable') blockers.push(`Evidência pendente: ${f.label}`)
  }
  for (const [key, label] of Object.entries(CHECKLIST_LABEL)) {
    if (!checklist[key]?.approved) blockers.push(`Aprovação pendente: ${label}`)
  }
  return blockers
}

export const CHECKLIST_LABEL = {
  technical: 'Técnica',
  psychometric: 'Psicométrica',
  ethics: 'Ética (CEP/CONEP)',
  legal: 'Jurídica e LGPD',
  security: 'Segurança da informação',
} as const
