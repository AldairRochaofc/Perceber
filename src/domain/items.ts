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

/**
 * Formas paralelas (B e C) de cada item. Mesmo construto, mesma direção
 * (itens `reverse` continuam invertidos), redação diferente. Cada nova
 * avaliação usa a forma seguinte, para que quem refaz o teste não leia
 * exatamente as mesmas frases.
 */
const ALT_FORMS: Record<string, [string, string]> = {
  s1: ['Quando várias pessoas conversam juntas, não consigo achar a hora de falar.', 'Em rodas de conversa, quando percebo a minha vez de falar, o assunto já mudou.'],
  s2: ['Custo a notar que a outra pessoa já quer terminar o papo.', 'Só percebo que alguém queria encerrar a conversa quando a pessoa diz isso com todas as letras.'],
  s3: ['Depois de passar tempo com outras pessoas, preciso ficar sozinho(a) para recarregar.', 'Encontros com pessoas me deixam sem energia e preciso de um tempo isolado(a) depois.'],
  s4: ['Começar e cultivar amizades me custa mais esforço do que parece custar aos outros.', 'Manter amigos é, para mim, um trabalho que as outras pessoas parecem fazer sem esforço.'],
  s5: ['Em momentos sociais sem regras definidas, como festas ou pausas, fico sem saber como agir.', 'Quando não há um roteiro, como em festas ou no intervalo, fico perdido(a) sobre o que fazer.'],
  c1: ['Ironias e indiretas costumam me escapar, e eu entendo a frase literalmente.', 'Levo ao pé da letra coisas que as pessoas disseram por ironia ou de forma indireta.'],
  c2: ['O tom de voz e a expressão do rosto das pessoas me dizem pouco sobre o que elas sentem.', 'Tenho dificuldade em ler as emoções de alguém pela voz ou pelo rosto.'],
  c3: ['Percebo com facilidade o que as pessoas querem dizer sem falar diretamente.', 'Capto sem esforço os recados implícitos numa conversa.'],
  c4: ['Já me disseram que minhas mensagens soam mais duras ou diretas do que eu quis.', 'Minhas mensagens parecem frias ou diretas demais para os outros, mesmo sem essa intenção.'],
  c5: ['Assuntos importantes, prefiro escrever do que falar, porque me expresso melhor assim.', 'Escrevendo, consigo dizer o que penso com mais clareza do que falando.'],
  e1: ['Quando há muito barulho em volta, fica difícil entender o que alguém está falando comigo.', 'Em lugares com várias conversas ao mesmo tempo, não consigo acompanhar quem fala comigo.'],
  e2: ['Deixo de usar roupas por causa de etiquetas, costuras ou tecidos que me incomodam.', 'Algumas texturas de roupa me incomodam tanto que prefiro não vestir a peça.'],
  e3: ['Luz muito intensa ou que pisca me incomoda ou me cansa.', 'Fico desconfortável ou cansado(a) em lugares com luz forte ou piscante.'],
  e4: ['Lugares com muito barulho, luz e movimento me deixam à beira da sobrecarga.', 'Quando há estímulos demais ao redor, sinto que não vou dar conta.'],
  e5: ['Noto sons, cheiros ou mudanças de luz que passam despercebidos para quem está perto.', 'Pequenos detalhes do ambiente, como um zumbido ou um cheiro, chamam minha atenção antes da dos outros.'],
  r1: ['Balançar o corpo, mexer as mãos ou bater os pés repetidamente me acalma ou me ajuda a focar.', 'Faço movimentos repetidos com o corpo, as mãos ou os pés para me acalmar ou me concentrar.'],
  r2: ['Fico repetindo palavras, frases ou sons, em voz alta ou na cabeça.', 'Me pego repetindo sons ou frases para mim, falando ou em pensamento.'],
  r3: ['Gosto de deixar minhas coisas numa ordem certa e fico incomodado(a) se alguém mexe.', 'Quando alguém muda a forma como arrumei meus objetos, isso me incomoda.'],
  r4: ['Em momentos de estresse, faço mais esses movimentos ou repetições.', 'Quanto mais estressado(a) fico, mais esses movimentos ou repetições aparecem.'],
  r5: ['Rever, reouvir ou reler a mesma coisa várias vezes me conforta.', 'Volto muitas vezes ao mesmo filme, música ou livro porque isso me tranquiliza.'],
  o1: ['Quando um plano muda em cima da hora, fico desorganizado(a) por muito tempo.', 'Mudanças repentinas de planos me tiram do eixo por um bom tempo.'],
  o2: ['Gosto de seguir sempre a mesma sequência ou o mesmo modo de fazer as coisas.', 'Fazer as coisas do mesmo jeito e na mesma ordem é o que prefiro.'],
  o3: ['Imprevistos não me abalam muito.', 'Quando algo foge do planejado, me adapto com calma.'],
  o4: ['Para encarar algo novo, preciso conhecer de antemão cada detalhe do que vai acontecer.', 'Situações novas só me deixam tranquilo(a) quando sei exatamente como vão ser.'],
  o5: ['Trocar de uma tarefa para outra é difícil para mim.', 'Interromper o que estou fazendo para mudar de atividade exige esforço de mim.'],
  i1: ['Me dedico a certos interesses com uma intensidade que os outros estranham.', 'As pessoas acham fora do comum o quanto me envolvo com alguns assuntos.'],
  i2: ['Mergulhado(a) em algo que me interessa, esqueço da hora, de comer ou de descansar.', 'Absorvido(a) por um interesse, deixo de perceber o tempo passar e pulo refeições ou descanso.'],
  i3: ['Sobre os temas de que gosto, coleciono informações detalhadas e bem organizadas.', 'Juntar e organizar dados minuciosos sobre meus assuntos favoritos me dá prazer.'],
  i4: ['Quando falo de algo que gosto, é difícil passar para outro assunto.', 'Custo a sair de um tema que me interessa durante uma conversa.'],
  i5: ['Os assuntos que mais me interessam continuam os mesmos ao longo dos anos.', 'Mantenho os mesmos interesses principais durante muito tempo.'],
  m1: ['Copio o jeito como os outros se comportam em grupo para não chamar atenção por ser diferente.', 'Para me encaixar socialmente, observo as pessoas e reproduzo o que elas fazem.'],
  m2: ['Ensaio mentalmente o que vou dizer antes de uma conversa.', 'Antes de conversar com alguém, preparo ou treino o que vou falar.'],
  m3: ['Passar o dia tentando parecer à vontade com os outros me deixa exausto(a), mais do que o normal.', 'O esforço de parecer confortável com as pessoas me causa um cansaço fora do comum no fim do dia.'],
  m4: ['Quem me conhece se espanta ao saber quanto algumas situações sociais me custam.', 'Quando digo que certas interações sociais são difíceis para mim, as pessoas ficam surpresas.'],
  f1: ['O que foi descrito nas perguntas anteriores prejudica meu trabalho ou meus estudos.', 'Meu desempenho no trabalho ou nos estudos é afetado pelas situações das perguntas anteriores.'],
  f2: ['Minhas relações com família, amigos ou parceiros(as) são afetadas por essas experiências.', 'Essas situações trazem dificuldades para meus vínculos com família, amizades ou parceiros(as).'],
  f3: ['Dar conta da rotina me consome mais energia do que parece consumir dos outros.', 'O dia a dia me cansa mais do que cansa as pessoas ao meu redor.'],
  f4: ['Fico tão esgotado(a) que preciso parar algumas atividades por um período.', 'O cansaço acumulado me força a me afastar de compromissos por um tempo.'],
  x1: ['Custo a dar início a tarefas, até as que acho importantes.', 'Mesmo quando uma tarefa importa para mim, tenho dificuldade de começá-la.'],
  x2: ['Esqueço prazos e compromissos ou não sei onde coloquei minhas coisas.', 'Me perco com datas, compromissos e com o lugar onde deixei objetos.'],
  x3: ['Fico travado(a) quando preciso dividir uma tarefa longa em etapas.', 'Organizar os passos de um projeto longo me paralisa.'],
  a1: ['Mesmo querendo focar, me distraio no meio de leituras ou conversas.', 'Durante uma leitura ou conversa, minha atenção escapa mesmo quando me esforço.'],
  a2: ['Inicio muitas atividades e não termino boa parte delas.', 'Costumo deixar inacabado muito do que começo.'],
  a3: ['Quando preciso me concentrar, meus pensamentos ou o ambiente tiram meu foco.', 'Na hora de me concentrar, qualquer pensamento ou movimento ao redor me distrai.'],
  n1: ['Me preocupo com muitas coisas e não consigo desligar esses pensamentos.', 'Muitas preocupações ficam rodando na minha cabeça e é difícil pará-las.'],
  n2: ['Fico tenso(a) ou inquieto(a) sem saber bem por quê.', 'Meu corpo fica tenso ou agitado mesmo sem uma razão aparente.'],
  n3: ['Deixo de fazer coisas por achar que vão dar errado.', 'Fujo de certas situações porque espero que terminem mal.'],
  h1: ['Passo vários dias seguidos me sentindo para baixo ou sem ânimo.', 'A tristeza ou o desânimo me acompanham por dias a fio.'],
  h2: ['Coisas que antes me davam prazer deixaram de me interessar.', 'Não sinto mais o mesmo gosto por atividades que eu curtia.'],
  h3: ['Mesmo descansando, continuo me sentindo esgotado(a).', 'Meu cansaço profundo não passa nem quando descanso.'],
  z1: ['Levo mais de 30 minutos para conseguir dormir.', 'Depois de deitar, passo mais de meia hora até adormecer.'],
  z2: ['Desperto de madrugada e custo a pegar no sono de novo.', 'Quando acordo no meio da noite, é difícil voltar a dormir.'],
  z3: ['Mesmo dormindo as horas de que preciso, levanto cansado(a).', 'Durmo o suficiente e ainda assim acordo sem energia.'],
}

export const FORM_COUNT = 3
export const FORM_LABEL = ['A', 'B', 'C'] as const

/** Texto do item na forma indicada (0 = A, original; 1 = B; 2 = C). */
export function itemText(item: Item, form = 0): string {
  const f = ((form % FORM_COUNT) + FORM_COUNT) % FORM_COUNT
  return f === 0 ? item.text : (ALT_FORMS[item.id]?.[f - 1] ?? item.text)
}

export const hasAllForms = (id: string) => !!ALT_FORMS[id]
