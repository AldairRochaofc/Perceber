import type { DomainId, Item } from './types'

/**
 * Banco de itens PERCEBER — versão BI-2026.10
 *
 * Itens de autoria própria, escritos a partir dos domínios descritos na
 * literatura. Nenhum item foi copiado, traduzido ou adaptado de instrumento
 * protegido (AQ, RAADS-R, CAT-Q etc.).
 *
 * Status: rascunho para revisão por especialistas e entrevistas cognitivas.
 * Não há calibração, norma populacional nem estudo de confiabilidade.
 *
 * Escala de resposta (frequência): 0 Nunca · 1 Raramente · 2 Às vezes ·
 * 3 Frequentemente · 4 Quase sempre. Itens `reverse` são pontuados 4 − valor
 * e servem também para verificar consistência.
 */
export const ITEM_BANK_VERSION = 'BI-2026.10'

export const ITEMS: Item[] = [
  // EC-1 · Interação social
  { id: 's1', domain: 'social', tier: 'core', text: 'Em conversas em grupo, perco o momento certo de entrar na fala.' },
  { id: 's2', domain: 'social', tier: 'core', text: 'Tenho dificuldade em perceber quando alguém quer encerrar uma conversa.' },
  { id: 's3', domain: 'social', tier: 'core', text: 'Depois de encontros sociais, preciso de um tempo sozinho(a) para me recuperar.' },
  { id: 's4', domain: 'social', tier: 'followup', text: 'Fazer ou manter amizades exige de mim um esforço que outras pessoas parecem não precisar.' },
  { id: 's5', domain: 'social', tier: 'followup', text: 'Em situações sem roteiro claro, como festas ou intervalos, não sei bem o que fazer.' },

  // EC-2 · Comunicação
  { id: 'c1', domain: 'communication', tier: 'core', text: 'Quando alguém fala de forma indireta ou com ironia, entendo ao pé da letra.' },
  { id: 'c2', domain: 'communication', tier: 'core', text: 'Tenho dificuldade em perceber, pelo tom de voz ou pela expressão do rosto, o que a pessoa está sentindo.' },
  { id: 'c3', domain: 'communication', tier: 'core', reverse: true, text: 'Entender o que as pessoas querem dizer nas entrelinhas é fácil para mim.' },
  { id: 'c4', domain: 'communication', tier: 'followup', text: 'As pessoas acham minhas mensagens mais secas ou diretas do que eu pretendia.' },
  { id: 'c5', domain: 'communication', tier: 'followup', text: 'Me expresso melhor por escrito do que falando, principalmente sobre assuntos importantes.' },

  // EC-3 · Processamento sensorial
  { id: 'e1', domain: 'sensory', tier: 'core', text: 'Barulhos de fundo, como várias conversas ao mesmo tempo, dificultam muito que eu entenda o que dizem para mim.', example: 'Restaurantes cheios, escritórios abertos, festas.' },
  { id: 'e2', domain: 'sensory', tier: 'core', text: 'Certas texturas, etiquetas ou costuras de roupa me incomodam a ponto de eu evitar usar a peça.' },
  { id: 'e3', domain: 'sensory', tier: 'core', text: 'Luzes fortes ou piscando me cansam ou me deixam desconfortável.' },
  { id: 'e4', domain: 'sensory', tier: 'followup', text: 'Em ambientes com muitos estímulos, sinto que vou ficar sobrecarregado(a).', example: 'Shopping, transporte lotado, eventos.' },
  { id: 'e5', domain: 'sensory', tier: 'followup', text: 'Percebo detalhes, como um cheiro, um zumbido ou uma mudança de luz, que as pessoas ao meu redor não notam.' },

  // EC-4 · Comportamentos repetitivos
  { id: 'r1', domain: 'repetitive', tier: 'core', text: 'Repito movimentos, como balançar o corpo, mexer as mãos ou bater os pés, e isso me ajuda a me acalmar ou me concentrar.' },
  { id: 'r2', domain: 'repetitive', tier: 'core', text: 'Repito palavras, frases ou sons para mim mesmo(a), em voz alta ou mentalmente.' },
  { id: 'r3', domain: 'repetitive', tier: 'core', text: 'Organizo objetos de um jeito específico e me incomoda quando alguém desfaz essa organização.' },
  { id: 'r4', domain: 'repetitive', tier: 'followup', text: 'Quando estou sob estresse, esses movimentos ou repetições aumentam.' },
  { id: 'r5', domain: 'repetitive', tier: 'followup', text: 'Assisto, escuto ou leio a mesma coisa muitas vezes, e isso me traz conforto.' },

  // EC-5 · Rotina e previsibilidade
  { id: 'o1', domain: 'routine', tier: 'core', text: 'Mudanças de plano de última hora me desorganizam por bastante tempo.' },
  { id: 'o2', domain: 'routine', tier: 'core', text: 'Prefiro fazer as coisas sempre na mesma ordem ou do mesmo jeito.' },
  { id: 'o3', domain: 'routine', tier: 'core', reverse: true, text: 'Lido com imprevistos com tranquilidade.' },
  { id: 'o4', domain: 'routine', tier: 'followup', text: 'Antes de uma situação nova, preciso saber em detalhes o que vai acontecer.' },
  { id: 'o5', domain: 'routine', tier: 'followup', text: 'Parar uma atividade para começar outra me custa esforço.' },

  // EC-6 · Interesses intensos
  { id: 'i1', domain: 'interests', tier: 'core', text: 'Tenho interesses aos quais me dedico com uma intensidade que outras pessoas acham incomum.' },
  { id: 'i2', domain: 'interests', tier: 'core', text: 'Quando estou envolvido(a) em um interesse, perco a noção do tempo e esqueço de comer ou descansar.' },
  { id: 'i3', domain: 'interests', tier: 'core', text: 'Gosto de reunir informações detalhadas e organizadas sobre os assuntos que me interessam.' },
  { id: 'i4', domain: 'interests', tier: 'followup', text: 'Tenho dificuldade em mudar de assunto quando estou falando de algo que me interessa.' },
  { id: 'i5', domain: 'interests', tier: 'followup', text: 'Meus interesses principais permanecem os mesmos por muitos anos.' },

  // CX-1 · Camuflagem social
  { id: 'm1', domain: 'masking', tier: 'core', text: 'Em situações sociais, observo e imito como as outras pessoas agem para não parecer diferente.' },
  { id: 'm2', domain: 'masking', tier: 'core', text: 'Planejo ou ensaio conversas antes de elas acontecerem.' },
  { id: 'm3', domain: 'masking', tier: 'core', text: 'Depois de um dia me esforçando para parecer à vontade com as pessoas, sinto um cansaço que vai além do comum.' },
  { id: 'm4', domain: 'masking', tier: 'followup', text: 'As pessoas se surpreendem quando conto o quanto certas situações sociais são difíceis para mim.' },

  // CX-2 · Impacto no dia a dia
  { id: 'f1', domain: 'impact', tier: 'core', text: 'As experiências descritas nas perguntas anteriores atrapalham meu trabalho ou meus estudos.' },
  { id: 'f2', domain: 'impact', tier: 'core', text: 'Essas experiências afetam minhas relações com família, amizades ou parceiros(as).' },
  { id: 'f3', domain: 'impact', tier: 'core', text: 'Sinto que gasto mais energia do que as outras pessoas para dar conta do dia a dia.' },
  { id: 'f4', domain: 'impact', tier: 'followup', text: 'Chego a um esgotamento que me obriga a me afastar de atividades por um tempo.' },

  // AC-1 · Funções executivas
  { id: 'x1', domain: 'executive', tier: 'core', text: 'Tenho dificuldade em começar tarefas, mesmo as que considero importantes.' },
  { id: 'x2', domain: 'executive', tier: 'core', text: 'Perco o controle de prazos, compromissos ou de onde deixei objetos.' },
  { id: 'x3', domain: 'executive', tier: 'core', text: 'Planejar as etapas de uma atividade longa me deixa travado(a).' },

  // AC-2 · Atenção
  { id: 'a1', domain: 'attention', tier: 'core', text: 'Minha atenção se desvia durante leituras ou conversas, mesmo quando quero prestar atenção.' },
  { id: 'a2', domain: 'attention', tier: 'core', text: 'Começo várias coisas e deixo muitas pela metade.' },
  { id: 'a3', domain: 'attention', tier: 'core', text: 'Me distraio com pensamentos ou com o que acontece ao redor quando preciso me concentrar.' },

  // AC-3 · Ansiedade
  { id: 'n1', domain: 'anxiety', tier: 'core', text: 'Fico preocupado(a) com muitas coisas e tenho dificuldade em parar de pensar nelas.' },
  { id: 'n2', domain: 'anxiety', tier: 'core', text: 'Sinto tensão no corpo ou inquietação sem um motivo claro.' },
  { id: 'n3', domain: 'anxiety', tier: 'core', text: 'Evito situações porque imagino que elas vão dar errado.' },

  // AC-4 · Humor
  { id: 'h1', domain: 'mood', tier: 'core', text: 'Me sinto triste ou desanimado(a) por vários dias seguidos.' },
  { id: 'h2', domain: 'mood', tier: 'core', text: 'Perco o interesse ou o prazer em coisas de que costumava gostar.' },
  { id: 'h3', domain: 'mood', tier: 'core', text: 'Sinto um esgotamento que não melhora com descanso.' },

  // AC-5 · Sono
  { id: 'z1', domain: 'sleep', tier: 'core', text: 'Demoro mais de meia hora para pegar no sono.' },
  { id: 'z2', domain: 'sleep', tier: 'core', text: 'Acordo durante a noite e tenho dificuldade em voltar a dormir.' },
  { id: 'z3', domain: 'sleep', tier: 'core', text: 'Acordo cansado(a), mesmo depois de dormir o tempo que costumo precisar.' },
]

export const ITEM_BY_ID: Record<string, Item> = Object.fromEntries(ITEMS.map((i) => [i.id, i]))

export const itemsFor = (domain: DomainId, tier?: Item['tier']) =>
  ITEMS.filter((i) => i.domain === domain && (!tier || i.tier === tier))

export const SCALE = [
  { value: 0, label: 'Nunca' },
  { value: 1, label: 'Raramente' },
  { value: 2, label: 'Às vezes' },
  { value: 3, label: 'Frequentemente' },
  { value: 4, label: 'Quase sempre' },
] as const

export const SCALE_LABEL = (value: number) => SCALE[Math.round(value)]?.label ?? '—'
