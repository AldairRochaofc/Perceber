import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  Infinity as InfinityIcon,
  Waves,
  Network,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Shield,
  BookOpen,
  BarChart3,
  FileText,
  Share2,
  Lock,
  Check,
  X,
  ArrowRight,
  Type as TypeIcon,
  Eye,
  Activity,
  Moon,
  Users,
  MessageCircle,
  Repeat,
  CalendarClock,
  Target,
  ListChecks,
  AlertCircle,
  Copy,
  Trash2,
  Clock,
  UserCog,
  Home,
  Loader2,
  Ear,
  Compass,
  ScanLine,
  Settings2,
  ArrowUpRight,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

/* ============================================================================
   CAMADA DE DOMÍNIO — tipos, constantes e enums
   Nenhuma lógica de negócio vive dentro de componentes React.
   ========================================================================= */

const APP_VERSION = "1.0.0";
const INSTRUMENT_VERSION = "TRI-TEA-2026.1";

const MIN_QUESTIONS = 24;
const MAX_QUESTIONS = 40;
const TARGET_CONFIDENCE = 0.74;

/** Escala Likert de frequência (0–4). */
const LIKERT = [
  { id: "never", label: "Nunca", value: 0 },
  { id: "rarely", label: "Raramente", value: 1 },
  { id: "sometimes", label: "Às vezes", value: 2 },
  { id: "often", label: "Frequentemente", value: 3 },
  { id: "almost_always", label: "Quase sempre", value: 4 },
];

/** UserStatus */
const STATUS = {
  LOW: "low_indication",
  MODERATE: "moderate_indication",
  HIGH: "high_indication",
  PROFESSIONAL: "professional_evaluation_recommended",
};

const STATUS_META = {
  [STATUS.LOW]: {
    label: "Baixa indicação",
    icon: Compass,
    accent: "#0891b2",
    soft: "#ecfeff",
    line: "#a5f3fc",
    pattern: "grid",
    summary:
      "As respostas apresentaram poucos indicadores associados ao perfil investigado.",
    tone: "Isso não descarta nada e também não confirma nada. É apenas o retrato do que você respondeu hoje.",
  },
  [STATUS.MODERATE]: {
    label: "Indicação moderada",
    icon: Waves,
    accent: "#2563eb",
    soft: "#eff6ff",
    line: "#bfdbfe",
    pattern: "waves",
    summary:
      "Algumas características identificadas podem justificar uma investigação mais aprofundada.",
    tone: "Vale observar esses pontos com calma e, se fizer sentido para você, levá-los a uma conversa profissional.",
  },
  [STATUS.HIGH]: {
    label: "Indicação elevada",
    icon: Network,
    accent: "#1d4ed8",
    soft: "#eef2ff",
    line: "#c7d2fe",
    pattern: "nodes",
    summary:
      "Foram identificadas diversas características que podem justificar uma avaliação profissional.",
    tone: "Muitas pessoas convivem com essas características a vida toda sem nome para elas. Ter os dados organizados costuma facilitar o próximo passo.",
  },
  [STATUS.PROFESSIONAL]: {
    label: "Avaliação profissional recomendada",
    icon: InfinityIcon,
    accent: "#1e3a8a",
    soft: "#eef2ff",
    line: "#c7d2fe",
    pattern: "infinity",
    summary:
      "Os resultados indicam que uma avaliação profissional pode ser especialmente útil para compreender melhor suas características e necessidades.",
    tone: "Isso não é um diagnóstico nem uma sentença. É uma sugestão de próximo passo, e você decide o ritmo.",
  },
};

/** QuestionDomain */
const D = {
  SOCIAL: "social_interaction",
  COMM: "communication",
  SENSORY: "sensory",
  REPETITIVE: "repetitive_behavior",
  ROUTINE: "routine",
  INTERESTS: "special_interests",
  EXEC: "executive_function",
  ATTENTION: "attention",
  ANXIETY: "anxiety",
  MOOD: "mood",
  SLEEP: "sleep",
};

const DOMAIN_META = {
  [D.SOCIAL]: {
    label: "Interação social",
    short: "Social",
    icon: Users,
    group: "core",
    target: 5,
    about: "Como você lê, acompanha e sustenta trocas com outras pessoas.",
    sources: ["dsm5tr", "aq", "catq"],
    limits:
      "Traços sociais variam muito com cultura, timidez e experiências de vida. Um indicador alto aqui não é específico de TEA.",
  },
  [D.COMM]: {
    label: "Comunicação",
    short: "Comunicação",
    icon: MessageCircle,
    group: "core",
    target: 4,
    about: "Uso e interpretação de linguagem literal, figurada e não verbal.",
    sources: ["dsm5tr", "aq"],
    limits:
      "Estilo comunicativo é fortemente influenciado por escolaridade, idioma e contexto profissional.",
  },
  [D.SENSORY]: {
    label: "Processamento sensorial",
    short: "Sensorial",
    icon: Ear,
    group: "core",
    target: 5,
    about:
      "Hiper e hiporreatividade a sons, luzes, texturas, cheiros e movimento.",
    sources: ["dsm5tr", "sensory"],
    limits:
      "Sensibilidade sensorial ocorre também em enxaqueca, TDAH, ansiedade e quadros de exaustão.",
  },
  [D.REPETITIVE]: {
    label: "Comportamentos repetitivos",
    short: "Repetitivo",
    icon: Repeat,
    group: "core",
    target: 4,
    about:
      "Movimentos, falas ou rituais repetidos, muitas vezes com função reguladora.",
    sources: ["dsm5tr", "rrb"],
    limits:
      "Comportamentos repetitivos aparecem em TOC, tiques e quadros de ansiedade, com funções diferentes.",
  },
  [D.ROUTINE]: {
    label: "Rotina e previsibilidade",
    short: "Rotina",
    icon: CalendarClock,
    group: "core",
    target: 4,
    about: "Necessidade de constância e reação a mudanças inesperadas.",
    sources: ["dsm5tr", "rrb"],
    limits:
      "Preferência por rotina é comum na população geral e pode ser adaptativa.",
  },
  [D.INTERESTS]: {
    label: "Interesses intensos",
    short: "Interesses",
    icon: Target,
    group: "core",
    target: 4,
    about: "Profundidade, duração e função afetiva de interesses específicos.",
    sources: ["dsm5tr", "rrb"],
    limits:
      "Interesse profundo por um tema é comum em contextos acadêmicos e técnicos sem qualquer relação com TEA.",
  },
  [D.EXEC]: {
    label: "Funções executivas",
    short: "Executivas",
    icon: ListChecks,
    group: "cooccurring",
    target: 4,
    about: "Iniciar, organizar, sequenciar e concluir tarefas.",
    sources: ["exec"],
    limits:
      "Dificuldades executivas são transdiagnósticas: aparecem em TDAH, depressão, privação de sono e sobrecarga.",
  },
  [D.ATTENTION]: {
    label: "Atenção",
    short: "Atenção",
    icon: ScanLine,
    group: "cooccurring",
    target: 4,
    about: "Sustentação, alternância e dispersão da atenção.",
    sources: ["cooccur"],
    limits:
      "Não substitui triagem específica para TDAH nem avaliação neuropsicológica.",
  },
  [D.ANXIETY]: {
    label: "Ansiedade",
    short: "Ansiedade",
    icon: Activity,
    group: "cooccurring",
    target: 4,
    about: "Preocupação, antecipação, evitação e tensão corporal.",
    sources: ["cooccur", "anxdep"],
    limits:
      "Indicador de rastreio amplo; não distingue entre quadros ansiosos nem mede gravidade clínica.",
  },
  [D.MOOD]: {
    label: "Humor",
    short: "Humor",
    icon: Waves,
    group: "cooccurring",
    target: 4,
    about: "Energia, prazer nas atividades e variação do humor recente.",
    sources: ["anxdep"],
    limits:
      "Rastreio amplo e não clínico. Humor oscila com eventos de vida, sono e saúde física.",
  },
  [D.SLEEP]: {
    label: "Sono",
    short: "Sono",
    icon: Moon,
    group: "cooccurring",
    target: 4,
    about: "Latência, continuidade e qualidade percebida do sono.",
    sources: ["sleep"],
    limits:
      "Queixas de sono têm muitas causas médicas e ambientais que este questionário não avalia.",
  },
};

const DOMAIN_ORDER = [
  D.SOCIAL,
  D.COMM,
  D.SENSORY,
  D.REPETITIVE,
  D.ROUTINE,
  D.INTERESTS,
  D.EXEC,
  D.ATTENTION,
  D.ANXIETY,
  D.MOOD,
  D.SLEEP,
];
const CORE_DOMAINS = DOMAIN_ORDER.filter(
  (d) => DOMAIN_META[d].group === "core",
);
const COOCCURRING_DOMAINS = DOMAIN_ORDER.filter(
  (d) => DOMAIN_META[d].group === "cooccurring",
);

/* ============================================================================
   CAMADA DE EVIDÊNCIA PSICOMÉTRICA
   Bases conceituais. Os itens deste questionário são de autoria própria e não
   reproduzem instrumentos proprietários.
   ========================================================================= */

const SOURCES = {
  dsm5tr: {
    id: "dsm5tr",
    name: "Critérios diagnósticos do DSM-5-TR para TEA",
    authors: ["American Psychiatric Association"],
    year: 2022,
    population: "Todas as idades",
    purpose:
      "Define os dois eixos do diagnóstico: comunicação/interação social e padrões restritos e repetitivos, incluindo reatividade sensorial.",
    reference: "American Psychiatric Association. DSM-5-TR, 2022.",
    limitations:
      "É um manual de critérios clínicos, não um instrumento de autoaplicação. A estrutura de domínios foi usada apenas como organização conceitual.",
  },
  aq: {
    id: "aq",
    name: "Literatura sobre autoavaliação de traços do espectro em adultos",
    authors: ["Baron-Cohen, S. et al."],
    year: 2001,
    population: "Adultos com inteligência na média",
    purpose:
      "Estabeleceu a viabilidade de medir traços do espectro como dimensão contínua na população geral.",
    reference:
      "Baron-Cohen et al., Journal of Autism and Developmental Disorders, 2001.",
    limitations:
      "O instrumento original não é reproduzido aqui. Autorrelato tem sensibilidade e especificidade limitadas e não serve como corte diagnóstico.",
  },
  catq: {
    id: "catq",
    name: "Pesquisa sobre camuflagem social (masking)",
    authors: ["Hull, L. et al."],
    year: 2019,
    population: "Adultos autistas e não autistas",
    purpose:
      "Descreve estratégias de compensação e mascaramento que podem reduzir a visibilidade de traços em triagens tradicionais.",
    reference:
      "Hull et al., Journal of Autism and Developmental Disorders, 2019.",
    limitations:
      "Camuflagem é mais estudada em mulheres adultas; a generalização para outros grupos é limitada.",
  },
  sensory: {
    id: "sensory",
    name: "Revisões sobre percepção sensorial no autismo",
    authors: ["Robertson, C. E.", "Baron-Cohen, S."],
    year: 2017,
    population: "Crianças e adultos",
    purpose:
      "Sintetiza achados de hiper e hiporreatividade sensorial e seu impacto funcional cotidiano.",
    reference: "Robertson & Baron-Cohen, Nature Reviews Neuroscience, 2017.",
    limitations:
      "Alta heterogeneidade entre estudos. Perfis sensoriais variam muito dentro do próprio espectro.",
  },
  rrb: {
    id: "rrb",
    name: "Revisões sobre comportamentos restritos e repetitivos",
    authors: ["Leekam, S. R. et al."],
    year: 2011,
    population: "Crianças e adultos",
    purpose:
      "Descreve subtipos de comportamentos repetitivos e sua ocorrência fora do espectro autista.",
    reference: "Leekam et al., Psychological Bulletin, 2011.",
    limitations:
      "Comportamentos repetitivos não são exclusivos do TEA e exigem análise funcional individual.",
  },
  exec: {
    id: "exec",
    name: "Metanálises sobre funções executivas no autismo",
    authors: ["Demetriou, E. A. et al."],
    year: 2018,
    population: "Amostras clínicas ao longo da vida",
    purpose:
      "Documenta diferenças de desempenho executivo com tamanho de efeito moderado e alta variabilidade individual.",
    reference: "Demetriou et al., Molecular Psychiatry, 2018.",
    limitations:
      "Baseada em testes de desempenho, não em autorrelato. A correspondência entre queixa subjetiva e teste é apenas parcial.",
  },
  cooccur: {
    id: "cooccur",
    name: "Estudos sobre condições coocorrentes no autismo",
    authors: ["Lai, M.-C. et al."],
    year: 2019,
    population: "Populações clínicas e de base populacional",
    purpose:
      "Estima a alta frequência de condições psiquiátricas concomitantes, incluindo TDAH, ansiedade e depressão.",
    reference: "Lai et al., The Lancet Psychiatry, 2019.",
    limitations:
      "Prevalências variam conforme o método de recrutamento. Coocorrência não implica causalidade.",
  },
  anxdep: {
    id: "anxdep",
    name: "Metanálises sobre ansiedade e depressão em adultos autistas",
    authors: ["Hollocks, M. J. et al."],
    year: 2019,
    population: "Adultos",
    purpose:
      "Quantifica a elevada prevalência de sintomas ansiosos e depressivos nessa população.",
    reference: "Hollocks et al., Psychological Medicine, 2019.",
    limitations:
      "Instrumentos padronizados de ansiedade e depressão podem ter desempenho diferente em pessoas autistas.",
  },
  sleep: {
    id: "sleep",
    name: "Revisões sobre sono e neurodesenvolvimento",
    authors: ["Richdale, A. L.", "Schreck, K. A."],
    year: 2009,
    population: "Crianças e adultos",
    purpose:
      "Descreve padrões de insônia inicial e fragmentação do sono associados a condições do neurodesenvolvimento.",
    reference: "Richdale & Schreck, Sleep Medicine Reviews, 2009.",
    limitations:
      "Autorrelato de sono é pouco preciso comparado a actigrafia ou polissonografia.",
  },
};

/* ============================================================================
   BANCO DE PERGUNTAS
   d = domínio · w = peso · tier = core|followup · rev = escala invertida
   c = característica observável correspondente · src = base conceitual
   ========================================================================= */

const Q = (id, d, tier, w, text, c, src, dep, rev = false) => ({
  id,
  d,
  tier,
  w,
  text,
  c,
  src,
  dep,
  rev,
});

const QUESTIONS = [
  // ── Interação social
  Q(
    "s1",
    D.SOCIAL,
    "core",
    1.2,
    "Você acha difícil perceber quando alguém está perdendo o interesse na conversa?",
    "leitura de sinais sociais sutis exige esforço consciente",
    "dsm5tr",
  ),
  Q(
    "s2",
    D.SOCIAL,
    "core",
    1.1,
    "Em grupos, você sente que precisa se esforçar conscientemente para acompanhar a dinâmica da conversa?",
    "conversas em grupo demandam esforço ativo de acompanhamento",
    "aq",
  ),
  Q(
    "s3",
    D.SOCIAL,
    "core",
    0.9,
    "Você prefere atividades sozinho(a) em vez de atividades com outras pessoas?",
    "preferência por atividades individuais",
    "aq",
  ),
  Q(
    "s4",
    D.SOCIAL,
    "followup",
    1.0,
    "Você costuma ensaiar mentalmente conversas antes de encontros sociais?",
    "preparação antecipada para situações sociais",
    "catq",
  ),
  Q(
    "s5",
    D.SOCIAL,
    "followup",
    1.2,
    "Depois de eventos sociais, você sente um cansaço intenso que exige tempo de recuperação?",
    "necessidade de recuperação após interações sociais",
    "catq",
  ),
  Q(
    "s6",
    D.SOCIAL,
    "followup",
    1.3,
    "Você percebe que imita expressões, gestos ou jeitos de falar de outras pessoas para se enturmar?",
    "uso de estratégias de adaptação social aprendidas",
    "catq",
    { q: "s2", min: 2 },
  ),
  Q(
    "s7",
    D.SOCIAL,
    "followup",
    1.0,
    "Manter contato visual de forma confortável é difícil para você?",
    "desconforto com contato visual sustentado",
    "dsm5tr",
  ),
  Q(
    "s8",
    D.SOCIAL,
    "followup",
    1.1,
    "As chamadas regras não escritas das interações sociais são claras e intuitivas para você?",
    "convenções sociais implícitas pouco intuitivas",
    "aq",
    undefined,
    true,
  ),

  // ── Comunicação
  Q(
    "c1",
    D.COMM,
    "core",
    1.2,
    "Você interpreta expressões figuradas, ironia ou sarcasmo de forma literal?",
    "interpretação predominantemente literal da linguagem",
    "dsm5tr",
  ),
  Q(
    "c2",
    D.COMM,
    "core",
    1.0,
    "Você tem dificuldade em saber a hora certa de entrar ou sair de uma conversa?",
    "dificuldade com o ritmo de entrada e saída em conversas",
    "aq",
  ),
  Q(
    "c3",
    D.COMM,
    "followup",
    0.8,
    "Você prefere comunicação escrita a telefonemas ou conversas ao vivo?",
    "preferência por comunicação escrita",
    "aq",
  ),
  Q(
    "c4",
    D.COMM,
    "followup",
    1.1,
    "Você percebe que fala sobre um assunto por muito tempo sem notar a reação de quem ouve?",
    "monólogos sobre temas de interesse",
    "dsm5tr",
    { q: "c2", min: 2 },
  ),
  Q(
    "c5",
    D.COMM,
    "followup",
    1.0,
    "É difícil para você colocar em palavras o que está sentindo?",
    "dificuldade em nomear estados emocionais",
    "cooccur",
  ),
  Q(
    "c6",
    D.COMM,
    "followup",
    0.9,
    "Pessoas já comentaram que seu tom de voz ou ritmo de fala chama atenção?",
    "prosódia percebida como distinta por terceiros",
    "dsm5tr",
  ),

  // ── Sensorial
  Q(
    "e1",
    D.SENSORY,
    "core",
    1.3,
    "Sons como ventiladores, lâmpadas ou várias conversas ao mesmo tempo incomodam você mais do que parecem incomodar as outras pessoas?",
    "hipersensibilidade auditiva a ruídos de fundo",
    "sensory",
  ),
  Q(
    "e2",
    D.SENSORY,
    "core",
    1.1,
    "Texturas de roupas, etiquetas ou tecidos específicos causam desconforto significativo em você?",
    "desconforto tátil com determinados materiais",
    "sensory",
  ),
  Q(
    "e3",
    D.SENSORY,
    "core",
    1.2,
    "Ambientes movimentados como shoppings, festas ou transporte lotado deixam você sobrecarregado(a)?",
    "sobrecarga em ambientes de alta densidade sensorial",
    "dsm5tr",
  ),
  Q(
    "e4",
    D.SENSORY,
    "followup",
    1.2,
    "Você usa fones, óculos escuros ou outros recursos para reduzir estímulos no dia a dia?",
    "uso de estratégias de regulação sensorial",
    "sensory",
    { q: "e1", min: 2 },
  ),
  Q(
    "e5",
    D.SENSORY,
    "followup",
    1.0,
    "Cheiros ou sabores específicos provocam reações intensas em você?",
    "reatividade intensa a estímulos olfativos ou gustativos",
    "sensory",
  ),
  Q(
    "e6",
    D.SENSORY,
    "followup",
    1.0,
    "Você busca certos estímulos de propósito, como pressão, movimento ou sons repetidos, porque eles acalmam?",
    "busca ativa de estímulos com função calmante",
    "sensory",
  ),
  Q(
    "e7",
    D.SENSORY,
    "followup",
    1.2,
    "Depois de muito estímulo, você precisa de um tempo em silêncio ou no escuro para se recuperar?",
    "necessidade de descompressão sensorial",
    "sensory",
    { q: "e3", min: 2 },
  ),

  // ── Comportamentos repetitivos
  Q(
    "r1",
    D.REPETITIVE,
    "core",
    1.2,
    "Você faz movimentos repetitivos, como balançar, mexer nas mãos, girar objetos ou bater o pé, quando está concentrado(a) ou ansioso(a)?",
    "movimentos repetitivos ligados a concentração ou tensão",
    "dsm5tr",
  ),
  Q(
    "r2",
    D.REPETITIVE,
    "core",
    1.0,
    "Você repete frases, sons ou músicas de forma automática, em voz alta ou mentalmente?",
    "repetição automática de sons, frases ou músicas",
    "rrb",
  ),
  Q(
    "r3",
    D.REPETITIVE,
    "followup",
    1.1,
    "Você tem rituais que precisam ser feitos em uma ordem específica?",
    "sequências ritualizadas em atividades cotidianas",
    "rrb",
  ),
  Q(
    "r4",
    D.REPETITIVE,
    "followup",
    0.9,
    "Você se sente melhor quando os objetos estão organizados de uma maneira específica?",
    "necessidade de organização espacial específica",
    "rrb",
  ),
  Q(
    "r5",
    D.REPETITIVE,
    "followup",
    1.2,
    "Esses comportamentos ajudam você a se regular emocionalmente?",
    "comportamentos repetitivos com função autorregulatória",
    "rrb",
    { q: "r1", min: 2 },
  ),

  // ── Rotina
  Q(
    "o1",
    D.ROUTINE,
    "core",
    1.3,
    "Você se sente desconfortável quando sua rotina muda inesperadamente?",
    "desconforto com quebras inesperadas de rotina",
    "dsm5tr",
  ),
  Q(
    "o2",
    D.ROUTINE,
    "core",
    1.0,
    "Você prefere fazer as coisas sempre da mesma forma e no mesmo horário?",
    "preferência por constância de método e horário",
    "rrb",
  ),
  Q(
    "o3",
    D.ROUTINE,
    "followup",
    1.2,
    "Mudanças de planos de última hora afetam seu humor pelo resto do dia?",
    "impacto prolongado de mudanças de última hora",
    "rrb",
    { q: "o1", min: 2 },
  ),
  Q(
    "o4",
    D.ROUTINE,
    "followup",
    1.1,
    "Você precisa saber os detalhes de um compromisso com antecedência para ficar tranquilo(a)?",
    "necessidade de previsibilidade antecipada",
    "dsm5tr",
  ),
  Q(
    "o5",
    D.ROUTINE,
    "followup",
    1.0,
    "Você tem dificuldade em fazer a transição entre atividades, mesmo entre atividades agradáveis?",
    "dificuldade em transições entre atividades",
    "rrb",
  ),

  // ── Interesses intensos
  Q(
    "i1",
    D.INTERESTS,
    "core",
    1.2,
    "Você tem assuntos que ocupam grande parte do seu tempo e atenção, com profundidade incomum?",
    "interesses de profundidade e duração incomuns",
    "dsm5tr",
  ),
  Q(
    "i2",
    D.INTERESTS,
    "core",
    1.0,
    "Você perde a noção do tempo quando está envolvido(a) nesses interesses?",
    "imersão profunda com perda da noção de tempo",
    "rrb",
  ),
  Q(
    "i3",
    D.INTERESTS,
    "followup",
    1.0,
    "Você costuma colecionar, catalogar ou organizar informações sobre esses assuntos?",
    "coleta e catalogação sistemática de informações",
    "rrb",
  ),
  Q(
    "i4",
    D.INTERESTS,
    "followup",
    0.9,
    "Pessoas já comentaram que você fala muito sobre esses temas?",
    "comentários de terceiros sobre foco temático",
    "dsm5tr",
    { q: "i1", min: 2 },
  ),
  Q(
    "i5",
    D.INTERESTS,
    "followup",
    1.1,
    "Esses interesses funcionam como fonte de conforto e regulação para você?",
    "interesses com função de conforto e regulação",
    "rrb",
  ),

  // ── Funções executivas
  Q(
    "x1",
    D.EXEC,
    "core",
    1.2,
    "Você tem dificuldade em começar tarefas mesmo sabendo exatamente o que precisa fazer?",
    "dificuldade de iniciação de tarefas",
    "exec",
  ),
  Q(
    "x2",
    D.EXEC,
    "core",
    1.1,
    "Organizar as etapas de uma tarefa maior costuma ser difícil para você?",
    "dificuldade em sequenciar tarefas complexas",
    "exec",
  ),
  Q(
    "x3",
    D.EXEC,
    "followup",
    0.9,
    "Você perde objetos do dia a dia com frequência?",
    "perda frequente de objetos cotidianos",
    "exec",
  ),
  Q(
    "x4",
    D.EXEC,
    "followup",
    1.0,
    "Estimar quanto tempo uma tarefa vai levar é difícil para você?",
    "dificuldade em estimar duração de tarefas",
    "exec",
  ),
  Q(
    "x5",
    D.EXEC,
    "followup",
    1.0,
    "Você adia tarefas até o prazo forçar a ação?",
    "adiamento até a pressão do prazo",
    "exec",
    { q: "x1", min: 2 },
  ),
  Q(
    "x6",
    D.EXEC,
    "followup",
    1.1,
    "Alternar entre várias demandas ao mesmo tempo deixa você travado(a)?",
    "travamento diante de demandas simultâneas",
    "exec",
  ),

  // ── Atenção
  Q(
    "a1",
    D.ATTENTION,
    "core",
    1.1,
    "Sua atenção se dispersa durante leituras, reuniões ou conversas longas?",
    "dispersão em atividades longas",
    "cooccur",
  ),
  Q(
    "a2",
    D.ATTENTION,
    "core",
    1.0,
    "Você começa várias atividades e tem dificuldade em terminá-las?",
    "múltiplas atividades iniciadas e não concluídas",
    "cooccur",
  ),
  Q(
    "a3",
    D.ATTENTION,
    "followup",
    1.0,
    "Detalhes passam despercebidos e geram erros por desatenção?",
    "erros por desatenção a detalhes",
    "cooccur",
  ),
  Q(
    "a4",
    D.ATTENTION,
    "followup",
    1.0,
    "Você se distrai com facilidade com o que acontece ao redor?",
    "alta distratibilidade ambiental",
    "cooccur",
    { q: "a1", min: 2 },
  ),
  Q(
    "a5",
    D.ATTENTION,
    "followup",
    0.9,
    "Você consegue manter foco muito intenso e prolongado em coisas do seu interesse?",
    "foco intenso e prolongado em temas de interesse",
    "cooccur",
  ),

  // ── Ansiedade
  Q(
    "n1",
    D.ANXIETY,
    "core",
    1.2,
    "Você sente preocupação difícil de controlar na maior parte dos dias?",
    "preocupação persistente de difícil controle",
    "anxdep",
  ),
  Q(
    "n2",
    D.ANXIETY,
    "core",
    1.1,
    "Situações sociais novas provocam ansiedade antes mesmo de acontecerem?",
    "ansiedade antecipatória diante de situações novas",
    "anxdep",
  ),
  Q(
    "n3",
    D.ANXIETY,
    "followup",
    1.0,
    "Você percebe sinais no corpo, como tensão, coração acelerado ou estômago fechado, em situações de estresse?",
    "manifestações corporais de tensão",
    "anxdep",
  ),
  Q(
    "n4",
    D.ANXIETY,
    "followup",
    1.1,
    "Você evita situações por antecipar que serão desconfortáveis?",
    "evitação antecipatória de situações",
    "anxdep",
    { q: "n2", min: 2 },
  ),
  Q(
    "n5",
    D.ANXIETY,
    "followup",
    1.0,
    "Você tem dificuldade em relaxar mesmo nos momentos de descanso?",
    "dificuldade em relaxar em momentos de descanso",
    "anxdep",
  ),

  // ── Humor
  Q(
    "m1",
    D.MOOD,
    "core",
    1.1,
    "Você tem se sentido desanimado(a) ou com o humor mais baixo do que o habitual?",
    "humor mais baixo do que o habitual",
    "anxdep",
  ),
  Q(
    "m2",
    D.MOOD,
    "core",
    1.1,
    "Coisas que você costumava aproveitar têm perdido a graça?",
    "redução do prazer em atividades habituais",
    "anxdep",
  ),
  Q(
    "m3",
    D.MOOD,
    "followup",
    0.9,
    "Você tem se sentido mais irritável do que gostaria?",
    "irritabilidade acima do habitual",
    "anxdep",
  ),
  Q(
    "m4",
    D.MOOD,
    "followup",
    1.0,
    "Sua energia tem estado mais baixa do que o normal?",
    "energia reduzida em relação ao habitual",
    "anxdep",
    { q: "m1", min: 2 },
  ),
  Q(
    "m5",
    D.MOOD,
    "followup",
    1.0,
    "Você sente que precisa se esforçar bastante para parecer bem para os outros?",
    "esforço sustentado para aparentar bem-estar",
    "catq",
  ),

  // ── Sono
  Q(
    "z1",
    D.SLEEP,
    "core",
    1.1,
    "Você demora mais de 30 minutos para adormecer na maioria das noites?",
    "latência prolongada para iniciar o sono",
    "sleep",
  ),
  Q(
    "z2",
    D.SLEEP,
    "core",
    1.0,
    "Você acorda durante a noite e tem dificuldade em voltar a dormir?",
    "despertares noturnos com dificuldade de retomada",
    "sleep",
  ),
  Q(
    "z3",
    D.SLEEP,
    "followup",
    1.0,
    "Você acorda com a sensação de que o sono não foi reparador?",
    "sono percebido como não reparador",
    "sleep",
  ),
  Q(
    "z4",
    D.SLEEP,
    "followup",
    1.0,
    "Sua mente fica acelerada na hora de dormir?",
    "atividade mental acelerada ao deitar",
    "sleep",
    { q: "z1", min: 2 },
  ),
  Q(
    "z5",
    D.SLEEP,
    "followup",
    0.9,
    "Luz, som ou temperatura atrapalham seu sono com frequência?",
    "sensibilidade ambiental que interfere no sono",
    "sensory",
  ),
];

const QUESTION_BY_ID = QUESTIONS.reduce((acc, q) => ((acc[q.id] = q), acc), {});
const CORE_QUESTION_IDS = QUESTIONS.filter((q) => q.tier === "core").map(
  (q) => q.id,
);

/* ============================================================================
   SCORE ENGINE — análise matemática pura. Sem UI, sem React.
   ========================================================================= */

const clamp01 = (n) => Math.max(0, Math.min(1, n));
const mean = (arr) =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

/** Converte um valor Likert (0–4) em [0,1], respeitando escala invertida. */
function normalizeValue(question, value) {
  const n = value / 4;
  return question.rev ? 1 - n : n;
}

/**
 * Calcula score e confiança por domínio.
 * score    → 0–100, indicador de triagem (não probabilidade diagnóstica)
 * confidence → 0–1, combina cobertura de itens e consistência das respostas
 */
function computeDomainScores(responses) {
  const buckets = {};
  DOMAIN_ORDER.forEach((d) => (buckets[d] = { values: [], weights: [] }));

  responses.forEach((r) => {
    const q = QUESTION_BY_ID[r.questionId];
    if (!q) return;
    buckets[q.d].values.push(normalizeValue(q, r.value));
    buckets[q.d].weights.push(q.w);
  });

  const result = {};
  DOMAIN_ORDER.forEach((d) => {
    const { values, weights } = buckets[d];
    const answered = values.length;

    if (answered === 0) {
      result[d] = {
        domain: d,
        score: null,
        answered: 0,
        confidence: 0,
        consistency: 0,
        coverage: 0,
      };
      return;
    }

    const wSum = weights.reduce((a, b) => a + b, 0);
    const weighted =
      values.reduce((acc, v, i) => acc + v * weights[i], 0) / wSum;

    const m = mean(values);
    const variance = mean(values.map((v) => (v - m) ** 2));
    const stdev = Math.sqrt(variance);
    const consistency = answered < 2 ? 0.45 : clamp01(1 - stdev / 0.5);

    const coverage = clamp01(answered / DOMAIN_META[d].target);
    const confidence = clamp01(0.62 * coverage + 0.38 * consistency);

    result[d] = {
      domain: d,
      score: Math.round(weighted * 100),
      answered,
      confidence: Number(confidence.toFixed(3)),
      consistency: Number(consistency.toFixed(3)),
      coverage: Number(coverage.toFixed(3)),
    };
  });

  return result;
}

/** Composto dos domínios centrais, ponderado pela confiança de cada um. */
function computeCoreComposite(domainScores) {
  let num = 0;
  let den = 0;
  CORE_DOMAINS.forEach((d) => {
    const s = domainScores[d];
    if (s.score === null) return;
    const w = 0.5 + s.confidence;
    num += s.score * w;
    den += w;
  });
  return den ? Math.round(num / den) : 0;
}

/** Determina o UserStatus a partir do composto e dos domínios coocorrentes. */
function computeStatus(domainScores) {
  const composite = computeCoreComposite(domainScores);
  const elevatedCooccurring = COOCCURRING_DOMAINS.filter(
    (d) =>
      (domainScores[d].score ?? 0) >= 65 && domainScores[d].confidence >= 0.5,
  );

  let status;
  if (composite < 32) status = STATUS.LOW;
  else if (composite < 52) status = STATUS.MODERATE;
  else if (composite < 70) status = STATUS.HIGH;
  else status = STATUS.PROFESSIONAL;

  // Escalonamento: carga funcional relevante em áreas coocorrentes.
  if (status === STATUS.HIGH && elevatedCooccurring.length >= 1)
    status = STATUS.PROFESSIONAL;
  if (status === STATUS.MODERATE && elevatedCooccurring.length >= 2)
    status = STATUS.HIGH;
  if (status === STATUS.LOW && elevatedCooccurring.length >= 2)
    status = STATUS.MODERATE;

  const overallConfidence = mean(
    CORE_DOMAINS.map((d) => domainScores[d].confidence),
  );

  return {
    status,
    composite,
    elevatedCooccurring,
    confidence: Number(overallConfidence.toFixed(3)),
  };
}

/** Extrai as características observáveis a partir das respostas mais marcantes. */
function extractCharacteristics(responses, limit = 6) {
  return responses
    .map((r) => {
      const q = QUESTION_BY_ID[r.questionId];
      return { q, n: normalizeValue(q, r.value) };
    })
    .filter((x) => x.n >= 0.75)
    .sort((a, b) => b.n * b.q.w - a.n * a.q.w)
    .slice(0, limit)
    .map((x) => ({ text: x.q.c, domain: x.q.d, id: x.q.id }));
}

/** Constrói o resultado completo da avaliação. */
function buildAssessmentResult(responses, intake) {
  const domainScores = computeDomainScores(responses);
  const { status, composite, elevatedCooccurring, confidence } =
    computeStatus(domainScores);

  const ranked = CORE_DOMAINS.filter(
    (d) => domainScores[d].score !== null,
  ).sort((a, b) => domainScores[b].score - domainScores[a].score);

  return {
    id: makeAssessmentId(),
    createdAt: new Date().toISOString(),
    instrumentVersion: INSTRUMENT_VERSION,
    intake,
    responses,
    domainScores,
    status,
    composite,
    confidence,
    elevatedCooccurring,
    topDomains: ranked.slice(0, 3),
    characteristics: extractCharacteristics(responses),
  };
}

function makeAssessmentId() {
  const s = Math.random().toString(36).slice(2, 8).toUpperCase();
  const y = new Date().getFullYear();
  return `AV-${y}-${s}`;
}

/* ============================================================================
   QUESTION ENGINE — seleção adaptativa da próxima pergunta
   ========================================================================= */

function dependencyMet(question, answersById) {
  if (!question.dep) return true;
  const answer = answersById[question.dep.q];
  if (answer === undefined) return false;
  return answer >= question.dep.min;
}

/**
 * getNextQuestion — escolhe a pergunta com maior ganho de informação estimado.
 * Prioriza: incerteza do domínio × peso do item × sinal provisório do domínio.
 * Penaliza repetição imediata de domínio e suprime eixos com sinal baixo.
 */
function getNextQuestion(responses, domainScores) {
  const answeredIds = new Set(responses.map((r) => r.questionId));
  const answersById = responses.reduce(
    (acc, r) => ((acc[r.questionId] = r.value), acc),
    {},
  );
  const lastDomain = responses.length
    ? QUESTION_BY_ID[responses[responses.length - 1].questionId].d
    : null;

  let best = null;
  let bestScore = -Infinity;

  for (const q of QUESTIONS) {
    if (answeredIds.has(q.id)) continue;
    if (!dependencyMet(q, answersById)) continue;

    const ds = domainScores[q.d];
    let priority = q.w * (1 - ds.confidence);

    if (q.tier === "core") {
      priority *= 2.4;
    } else {
      const coreRemaining = QUESTIONS.some(
        (x) => x.d === q.d && x.tier === "core" && !answeredIds.has(x.id),
      );
      if (coreRemaining) continue;

      const provisional = ds.score ?? 50;
      if (provisional < 25)
        priority *= 0.12; // sinal baixo → não insistir
      else if (provisional >= 55)
        priority *= 1.85; // sinal alto → aprofundar
      else priority *= 1.3; // ambíguo → resolver
    }

    if (q.d === lastDomain) priority *= 0.5;
    priority *= 0.92 + Math.random() * 0.16;

    if (priority > bestScore) {
      bestScore = priority;
      best = q;
    }
  }
  return best;
}

function shouldFinish(responses, domainScores) {
  const n = responses.length;
  if (n >= MAX_QUESTIONS) return true;
  if (n < MIN_QUESTIONS) return false;

  const answeredIds = new Set(responses.map((r) => r.questionId));
  const allCoreAnswered = CORE_QUESTION_IDS.every((id) => answeredIds.has(id));
  const avgConfidence = mean(
    DOMAIN_ORDER.map((d) => domainScores[d].confidence),
  );

  return allCoreAnswered && avgConfidence >= TARGET_CONFIDENCE;
}

function calculateProgress(responses, domainScores) {
  const byCount = responses.length / MAX_QUESTIONS;
  const byConfidence =
    mean(DOMAIN_ORDER.map((d) => domainScores[d].confidence)) /
    TARGET_CONFIDENCE;
  return Math.min(
    0.97,
    Math.max(byCount * 0.45 + byConfidence * 0.55, byCount),
  );
}

/* ============================================================================
   UI — tokens, primitivas e acessibilidade
   ========================================================================= */

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,300;6..72,400&display=swap');

    .tri-root {
      --background: #ffffff;
      --foreground: #0f172a;
      --muted: #64748b;
      --primary: #2563eb;
      --primary-dark: #1d4ed8;
      --primary-light: #dbeafe;
      --surface: #f8fafc;
      --border: #e2e8f0;
      font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
      color: var(--foreground);
      background: var(--background);
      -webkit-font-smoothing: antialiased;
    }
    .tri-serif { font-family: 'Newsreader', Georgia, 'Times New Roman', serif; }
    .tri-root h1, .tri-root h2, .tri-root h3 { letter-spacing: -0.02em; }
    .tri-root *:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
      border-radius: 6px;
    }
    .tri-contrast { --muted: #334155; --border: #94a3b8; --primary: #1d4ed8; }
    .tri-fill { transition: width 700ms cubic-bezier(.16,1,.3,1); }
    .tri-reveal { animation: triReveal 480ms cubic-bezier(.16,1,.3,1) both; }
    @keyframes triReveal { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
    .tri-reduce .tri-fill, .tri-reduce .tri-reveal { animation: none !important; transition: none !important; }
    @media (prefers-reduced-motion: reduce) {
      .tri-fill, .tri-reveal { animation: none !important; transition: none !important; }
    }
    .tri-root ::-webkit-scrollbar { width: 10px; height: 10px; }
    .tri-root ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
  `}</style>
);

const A11yContext = React.createContext({
  fontScale: 1,
  reduceMotion: false,
  highContrast: false,
});

function Card({ children, className = "", as: Tag = "div", ...rest }) {
  return (
    <Tag
      className={`rounded-2xl border border-slate-200 bg-white ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-[15px]",
    lg: "px-6 py-3.5 text-base",
  };
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200",
    outline:
      "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
  };
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

function Disclaimer({ compact = false }) {
  return (
    <p
      className={`text-slate-500 ${compact ? "text-xs" : "text-sm"} leading-relaxed`}
    >
      Este resultado é uma triagem orientativa e não substitui uma avaliação
      realizada por um profissional qualificado. Nenhuma informação aqui
      constitui diagnóstico.
    </p>
  );
}

/** Barra de indicador por domínio. */
function IndicatorBar({
  score,
  confidence,
  accent = "#2563eb",
  animate = true,
}) {
  const width = score === null ? 0 : score;
  return (
    <div className="w-full">
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={
            animate ? "tri-fill h-full rounded-full" : "h-full rounded-full"
          }
          style={{
            width: `${width}%`,
            background: accent,
            opacity: 0.35 + 0.65 * (confidence ?? 1),
          }}
        />
      </div>
    </div>
  );
}

/** Padrão visual do perfil — sem quebra-cabeça, apenas geometria e ondas. */
function ProfilePattern({ pattern, accent }) {
  const id = useRef(`pat-${Math.random().toString(36).slice(2, 8)}`).current;
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <defs>
        {pattern === "waves" && (
          <pattern
            id={id}
            width="120"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 30 Q30 10 60 30 T120 30"
              fill="none"
              stroke={accent}
              strokeWidth="1.2"
              opacity="0.25"
            />
            <path
              d="M0 14 Q30 -6 60 14 T120 14"
              fill="none"
              stroke={accent}
              strokeWidth="1"
              opacity="0.14"
            />
          </pattern>
        )}
        {pattern === "grid" && (
          <pattern id={id} width="26" height="26" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.4" fill={accent} opacity="0.28" />
          </pattern>
        )}
        {pattern === "nodes" && (
          <pattern id={id} width="72" height="72" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="2" fill={accent} opacity="0.3" />
            <circle cx="58" cy="34" r="2" fill={accent} opacity="0.3" />
            <circle cx="26" cy="60" r="2" fill={accent} opacity="0.3" />
            <path
              d="M12 12 L58 34 L26 60"
              fill="none"
              stroke={accent}
              strokeWidth="0.8"
              opacity="0.2"
            />
          </pattern>
        )}
        {pattern === "infinity" && (
          <pattern id={id} width="80" height="44" patternUnits="userSpaceOnUse">
            <path
              d="M14 22 C14 12, 30 12, 40 22 C50 32, 66 32, 66 22 C66 12, 50 12, 40 22 C30 32, 14 32, 14 22 Z"
              fill="none"
              stroke={accent}
              strokeWidth="1.1"
              opacity="0.22"
            />
          </pattern>
        )}
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/* ============================================================================
   TELAS
   ========================================================================= */

function Header({ view, go, hasResult, onOpenA11y }) {
  const nav = [
    { id: "dashboard", label: "Painel", icon: BarChart3, requiresResult: true },
    {
      id: "report",
      label: "Relatório técnico",
      icon: FileText,
      requiresResult: true,
    },
    {
      id: "sharing",
      label: "Compartilhamento",
      icon: Share2,
      requiresResult: true,
    },
    {
      id: "references",
      label: "Referências",
      icon: BookOpen,
      requiresResult: false,
    },
    {
      id: "professional",
      label: "Portal profissional",
      icon: UserCog,
      requiresResult: false,
    },
  ];
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3">
        <button
          onClick={() => go("landing")}
          className="flex items-center gap-2.5 rounded-lg pr-2 text-left"
          aria-label="Ir para a página inicial"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <InfinityIcon size={17} className="text-white" strokeWidth={2.2} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            Perceber
          </span>
        </button>

        <nav
          className="ml-auto hidden items-center gap-0.5 md:flex"
          aria-label="Navegação principal"
        >
          {nav.map((item) => {
            const disabled = item.requiresResult && !hasResult;
            return (
              <button
                key={item.id}
                onClick={() => !disabled && go(item.id)}
                disabled={disabled}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  view === item.id
                    ? "bg-blue-50 text-blue-700"
                    : disabled
                      ? "text-slate-300"
                      : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <button
          onClick={onOpenA11y}
          className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:ml-2"
          aria-label="Ajustes de acessibilidade"
        >
          <Settings2 size={18} />
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
        {nav.map((item) => {
          const disabled = item.requiresResult && !hasResult;
          return (
            <button
              key={item.id}
              onClick={() => !disabled && go(item.id)}
              disabled={disabled}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${
                view === item.id
                  ? "bg-blue-50 text-blue-700"
                  : disabled
                    ? "text-slate-300"
                    : "text-slate-600"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}

function AccessibilityPanel({ open, onClose, settings, setSettings }) {
  if (!open) return null;
  const { fontScale, reduceMotion, highContrast } = settings;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/25 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Ajustes de acessibilidade"
    >
      <Card className="w-full max-w-md p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Ajustes de acessibilidade</h2>
            <p className="mt-1 text-sm text-slate-500">
              Suas preferências valem para toda a plataforma.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="fontScale"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <TypeIcon size={15} className="text-slate-400" /> Tamanho do texto
            </label>
            <input
              id="fontScale"
              type="range"
              min="0.9"
              max="1.35"
              step="0.05"
              value={fontScale}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  fontScale: Number(e.target.value),
                }))
              }
              className="mt-3 w-full accent-blue-600"
            />
            <p className="mt-1 text-xs text-slate-400">
              {Math.round(fontScale * 100)}% do tamanho padrão
            </p>
          </div>

          <ToggleRow
            icon={Waves}
            label="Reduzir animações"
            hint="Remove transições e movimentos da interface."
            checked={reduceMotion}
            onChange={(v) => setSettings((s) => ({ ...s, reduceMotion: v }))}
          />
          <ToggleRow
            icon={Eye}
            label="Aumentar contraste"
            hint="Escurece textos secundários e reforça bordas."
            checked={highContrast}
            onChange={(v) => setSettings((s) => ({ ...s, highContrast: v }))}
          />
        </div>

        <Button className="mt-6 w-full" onClick={onClose}>
          Salvar preferências
        </Button>
      </Card>
    </div>
  );
}

function ToggleRow({ icon: Icon, label, hint, checked, onChange }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={15} className="mt-1 text-slate-400" />
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-slate-300"}`}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  );
}

/* ── Landing ─────────────────────────────────────────────────────────────── */

function Landing({ go }) {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-slate-200">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <ProfilePattern pattern="waves" accent="#2563eb" />
        </div>
        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <div className="max-w-2xl">
            <p className="text-sm text-blue-700">
              Triagem orientativa · não diagnóstica
            </p>
            <h1 className="tri-serif mt-4 text-[2.6rem] font-light leading-[1.08] text-slate-900 sm:text-6xl">
              Entenda melhor o seu perfil.
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-slate-600">
              Uma experiência de triagem baseada em perguntas adaptativas para
              ajudar você a compreender características comportamentais e
              identificar quando uma avaliação profissional pode ser importante.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={() => go("consent")}>
                Começar avaliação <ArrowRight size={17} />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => go("references")}
              >
                Ver a base científica
              </Button>
            </div>
            <p className="mt-6 text-sm text-slate-500">
              Entre 24 e 40 perguntas, cerca de 10 minutos. Você pode parar
              quando quiser.
            </p>
          </div>
        </div>
      </section>

      <Section
        title="Como funciona"
        lead="O questionário se ajusta conforme você responde, em vez de aplicar a mesma lista a todo mundo."
      >
        <ol className="grid gap-5 sm:grid-cols-3">
          {[
            [
              "Você responde",
              "As perguntas aparecem uma por vez, com cinco opções de frequência. Sem formulários longos.",
            ],
            [
              "O sistema se adapta",
              "Respostas fortes em um eixo abrem perguntas complementares. Eixos sem sinal saem do caminho.",
            ],
            [
              "Você recebe um mapa",
              "Indicadores separados por domínio, características observadas e um relatório para levar a um profissional.",
            ],
          ].map(([t, d], i) => (
            <li key={t} className="border-t-2 border-blue-600 pt-4">
              <p className="text-sm text-slate-400">Etapa {i + 1}</p>
              <h3 className="mt-1 font-semibold">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{d}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="O que esta plataforma não faz" surface>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-6">
            <X size={18} className="text-slate-400" />
            <h3 className="mt-3 font-semibold">Não diagnostica</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Nenhum resultado aqui afirma que você tem autismo, TDAH, ansiedade
              ou qualquer outra condição. Diagnóstico é ato de profissional
              habilitado, feito com histórico, entrevista e observação.
            </p>
          </Card>
          <Card className="p-6">
            <Check size={18} className="text-blue-600" />
            <h3 className="mt-3 font-semibold">Organiza informação</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Transforma percepções difusas em indicadores por domínio, com as
              bases conceituais usadas e suas limitações declaradas. Serve para
              começar uma conversa, não para encerrá-la.
            </p>
          </Card>
        </div>
      </Section>

      <Section
        title="Privacidade"
        lead="Os dados da triagem são seus e ficam separados por finalidade."
      >
        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {[
            [
              Lock,
              "Compartilhamento só com seu consentimento",
              "Nenhum profissional recebe seu relatório automaticamente. Você gera o acesso, define o prazo e pode revogar a qualquer momento.",
            ],
            [
              Shield,
              "Separação por finalidade",
              "Dados pessoais, respostas, indicadores, relatórios, compartilhamentos e logs são armazenados em camadas distintas.",
            ],
            [
              Trash2,
              "Exclusão a qualquer momento",
              "Você pode apagar uma avaliação específica ou toda a conta, incluindo o histórico.",
            ],
            [
              Clock,
              "Registro de acessos",
              "Cada abertura do relatório por um profissional fica registrada com data e hora.",
            ],
          ].map(([Icon, t, d]) => (
            <div key={t} className="flex gap-3.5">
              <Icon size={18} className="mt-0.5 shrink-0 text-blue-600" />
              <div>
                <h3 className="text-[15px] font-semibold">{t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  {d}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Perguntas frequentes" surface>
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {[
            [
              "O resultado vale como laudo?",
              "Não. O relatório reúne suas respostas de forma organizada e pode ser levado a uma consulta, mas não tem valor diagnóstico nem pericial.",
            ],
            [
              "Por que as perguntas mudam entre pessoas?",
              "O motor escolhe cada próxima pergunta com base no que você já respondeu. Se um eixo não apresenta sinal, ele deixa de ser explorado, o que encurta o questionário.",
            ],
            [
              "Vocês usam testes como AQ ou RAADS?",
              "Não reproduzimos instrumentos proprietários. Os itens são de autoria própria, organizados a partir dos domínios descritos na literatura, com as fontes listadas na área de referências.",
            ],
            [
              "Posso responder por outra pessoa?",
              "A versão atual é de autorrelato adulto. Respostas em nome de terceiros mudam a interpretação e não são recomendadas.",
            ],
            [
              "Meus indicadores altos significam que tenho autismo?",
              "Não. Vários dos indicadores investigados aparecem em outras condições e também em pessoas sem qualquer condição. É por isso que o resultado é apresentado por domínio e não como um número único.",
            ],
          ].map(([q, a]) => (
            <details key={q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium">
                {q}
                <ChevronRight
                  size={17}
                  className="shrink-0 text-slate-400 transition-transform group-open:rotate-90"
                />
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
                {a}
              </p>
            </details>
          ))}
        </div>
      </Section>

      <footer className="border-t border-slate-200 px-5 py-10">
        <div className="mx-auto max-w-6xl">
          <Disclaimer />
          <p className="mt-4 text-xs text-slate-400">
            Perceber · versão {APP_VERSION} · instrumento {INSTRUMENT_VERSION}
          </p>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, lead, children, surface = false }) {
  return (
    <section
      className={`border-b border-slate-200 px-5 py-16 ${surface ? "bg-slate-50" : ""}`}
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
          {title}
        </h2>
        {lead && (
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-600">
            {lead}
          </p>
        )}
        <div className="mt-9">{children}</div>
      </div>
    </section>
  );
}

/* ── Consentimento ───────────────────────────────────────────────────────── */

function Consent({ go }) {
  const [checks, setChecks] = useState({
    purpose: false,
    data: false,
    notMedical: false,
  });
  const all = Object.values(checks).every(Boolean);

  const items = [
    [
      "purpose",
      "Entendi que esta é uma triagem orientativa",
      "O resultado não diagnostica autismo nem qualquer outra condição e não substitui avaliação profissional.",
    ],
    [
      "data",
      "Autorizo o tratamento das minhas respostas",
      "As respostas serão usadas para gerar seus indicadores e seu relatório. Nada é compartilhado sem que você gere um acesso explicitamente.",
    ],
    [
      "notMedical",
      "Entendi as limitações",
      "Autorrelato tem precisão limitada e é influenciado pelo momento de vida, pelo sono e pelo humor do dia.",
    ],
  ];

  return (
    <div className="mx-auto max-w-2xl px-5 py-14">
      <h1 className="text-3xl font-semibold tracking-tight">
        Antes de começar
      </h1>
      <p className="mt-3 leading-relaxed text-slate-600">
        Três confirmações rápidas. Elas existem para que o resultado seja lido
        do jeito certo.
      </p>

      <div className="mt-8 space-y-3">
        {items.map(([key, label, desc]) => (
          <label
            key={key}
            className={`flex cursor-pointer gap-3.5 rounded-2xl border p-5 transition-colors ${
              checks[key]
                ? "border-blue-300 bg-blue-50/60"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <input
              type="checkbox"
              checked={checks[key]}
              onChange={(e) =>
                setChecks((c) => ({ ...c, [key]: e.target.checked }))
              }
              className="mt-1 h-[18px] w-[18px] shrink-0 accent-blue-600"
            />
            <span>
              <span className="block text-[15px] font-medium">{label}</span>
              <span className="mt-1.5 block text-sm leading-relaxed text-slate-600">
                {desc}
              </span>
            </span>
          </label>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button size="lg" disabled={!all} onClick={() => go("intake")}>
          Continuar <ArrowRight size={17} />
        </Button>
        <Button size="lg" variant="ghost" onClick={() => go("landing")}>
          Voltar
        </Button>
      </div>
    </div>
  );
}

/* ── Coleta inicial ──────────────────────────────────────────────────────── */

function Intake({ go, setIntake }) {
  const [form, setForm] = useState({
    firstName: "",
    ageRange: "",
    context: "",
    previousEval: "",
  });
  const valid =
    form.firstName.trim().length >= 2 && form.ageRange && form.context;

  const field =
    "mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-[15px] outline-none focus:border-blue-500";

  return (
    <div className="mx-auto max-w-2xl px-5 py-14">
      <h1 className="text-3xl font-semibold tracking-tight">
        Algumas informações
      </h1>
      <p className="mt-3 leading-relaxed text-slate-600">
        Só o necessário para contextualizar seu resultado. Nada aqui altera o
        cálculo dos indicadores.
      </p>

      <div className="mt-8 space-y-6">
        <div>
          <label htmlFor="firstName" className="text-sm font-medium">
            Como você quer ser chamado(a)?
          </label>
          <input
            id="firstName"
            value={form.firstName}
            onChange={(e) =>
              setForm((f) => ({ ...f, firstName: e.target.value }))
            }
            className={field}
            placeholder="Primeiro nome ou apelido"
          />
        </div>

        <div>
          <span className="text-sm font-medium">Faixa etária</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {["18–24", "25–34", "35–44", "45–59", "60+"].map((r) => (
              <Chip
                key={r}
                selected={form.ageRange === r}
                onClick={() => setForm((f) => ({ ...f, ageRange: r }))}
              >
                {r}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <span className="text-sm font-medium">O que te trouxe até aqui?</span>
          <div className="mt-2 space-y-2">
            {[
              "Quero entender melhor características que percebo em mim",
              "Alguém próximo sugeriu que eu investigasse",
              "Estou considerando procurar avaliação profissional",
              "Curiosidade sobre a metodologia",
            ].map((opt) => (
              <button
                key={opt}
                onClick={() => setForm((f) => ({ ...f, context: opt }))}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                  form.context === opt
                    ? "border-blue-400 bg-blue-50 text-blue-900"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-sm font-medium">
            Você já passou por avaliação profissional relacionada a isso?
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {["Não", "Estou em processo", "Sim", "Prefiro não informar"].map(
              (r) => (
                <Chip
                  key={r}
                  selected={form.previousEval === r}
                  onClick={() => setForm((f) => ({ ...f, previousEval: r }))}
                >
                  {r}
                </Chip>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="mt-9 flex flex-wrap gap-3">
        <Button
          size="lg"
          disabled={!valid}
          onClick={() => {
            setIntake(form);
            go("assessment");
          }}
        >
          Iniciar questionário <ArrowRight size={17} />
        </Button>
        <Button size="lg" variant="ghost" onClick={() => go("consent")}>
          Voltar
        </Button>
      </div>
    </div>
  );
}

function Chip({ selected, children, ...rest }) {
  return (
    <button
      className={`rounded-full border px-4 py-2 text-sm transition-colors ${
        selected
          ? "border-blue-400 bg-blue-50 text-blue-900"
          : "border-slate-200 text-slate-700 hover:border-slate-300"
      }`}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ── Questionário adaptativo ─────────────────────────────────────────────── */

function Assessment({ responses, setResponses, onFinish, go }) {
  const domainScores = useMemo(
    () => computeDomainScores(responses),
    [responses],
  );
  const finished = useMemo(
    () => shouldFinish(responses, domainScores),
    [responses, domainScores],
  );
  const question = useMemo(
    () => (finished ? null : getNextQuestion(responses, domainScores)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [responses.length, finished],
  );
  const progress = calculateProgress(responses, domainScores);
  const liveRef = useRef(null);

  useEffect(() => {
    if (finished || !question) onFinish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, question]);

  if (!question) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );
  }

  const meta = DOMAIN_META[question.d];
  const Icon = meta.icon;

  const answer = (value) => {
    setResponses((prev) => [
      ...prev,
      { questionId: question.id, value, answeredAt: Date.now() },
    ]);
  };

  const undo = () => setResponses((prev) => prev.slice(0, -1));

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:py-16">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>Pergunta {responses.length + 1}</span>
        <span aria-live="polite" ref={liveRef}>
          {Math.round(progress * 100)}% concluído
        </span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="tri-fill h-full rounded-full bg-blue-600"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div key={question.id} className="tri-reveal mt-12">
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <Icon size={15} /> {meta.label}
        </div>
        <h1 className="mt-4 text-[26px] font-medium leading-snug sm:text-[30px]">
          {question.text}
        </h1>

        <div
          className="mt-9 space-y-2.5"
          role="group"
          aria-label="Opções de resposta"
        >
          {LIKERT.map((opt) => (
            <button
              key={opt.id}
              onClick={() => answer(opt.value)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-5 py-4 text-left text-[15px] transition-colors hover:border-blue-400 hover:bg-blue-50/50"
            >
              {opt.label}
              <ChevronRight size={16} className="text-slate-300" />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={responses.length === 0}
        >
          <ChevronLeft size={15} /> Corrigir anterior
        </Button>
        <Button variant="ghost" size="sm" onClick={() => go("landing")}>
          Sair sem salvar
        </Button>
      </div>

      <p className="mt-10 text-xs leading-relaxed text-slate-400">
        O número de perguntas varia conforme suas respostas. Eixos sem sinal
        deixam de ser explorados.
      </p>
    </div>
  );
}

/* ── Processamento ───────────────────────────────────────────────────────── */

function Processing({ onDone }) {
  const steps = [
    "Consolidando respostas",
    "Calculando indicadores por domínio",
    "Avaliando consistência interna",
    "Montando o relatório",
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= steps.length) {
      const t = setTimeout(onDone, 350);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), 620);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5">
      <h1 className="text-xl font-medium">Analisando suas respostas</h1>
      <ul className="mt-7 space-y-3">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-3 text-[15px]">
            {i < step ? (
              <Check size={17} className="text-blue-600" />
            ) : i === step ? (
              <Loader2 size={17} className="animate-spin text-blue-600" />
            ) : (
              <span className="h-[17px] w-[17px] rounded-full border border-slate-200" />
            )}
            <span className={i <= step ? "text-slate-800" : "text-slate-400"}>
              {s}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Resultado ───────────────────────────────────────────────────────────── */

function Result({ result, go }) {
  const meta = STATUS_META[result.status];
  const StatusIcon = meta.icon;
  const name = result.intake?.firstName;

  const cooccurring = COOCCURRING_DOMAINS.map((d) => ({
    d,
    ...result.domainScores[d],
  }))
    .filter((x) => (x.score ?? 0) >= 55)
    .sort((a, b) => b.score - a.score);

  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <div className="tri-reveal">
        <p className="text-sm text-slate-500">
          {name
            ? `${name}, seu resultado está pronto.`
            : "Seu resultado está pronto."}
        </p>
        <h1 className="tri-serif mt-3 text-[2.1rem] font-light leading-tight sm:text-[2.6rem]">
          Encontramos algumas características que merecem ser compreendidas com
          mais atenção.
        </h1>
      </div>

      <Card
        className="relative mt-9 overflow-hidden p-7"
        style={{ borderColor: meta.line }}
      >
        <div
          className="absolute inset-0 opacity-60"
          style={{ background: meta.soft }}
        />
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <ProfilePattern pattern={meta.pattern} accent={meta.accent} />
        </div>
        <div className="relative">
          <div className="flex items-start gap-4">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ background: meta.accent }}
            >
              <StatusIcon size={21} className="text-white" strokeWidth={2} />
            </span>
            <div>
              <p className="text-sm" style={{ color: meta.accent }}>
                Status da triagem
              </p>
              <h2 className="mt-0.5 text-xl font-semibold">{meta.label}</h2>
            </div>
          </div>
          <p className="mt-5 max-w-xl leading-relaxed text-slate-700">
            {meta.summary}
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
            {meta.tone}
          </p>
          <p className="mt-5 text-xs text-slate-500">
            Confiança do resultado: {Math.round(result.confidence * 100)}% ·{" "}
            {result.responses.length} perguntas respondidas
          </p>
        </div>
      </Card>

      <h2 className="mt-14 text-xl font-semibold">O que encontramos</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
        Suas respostas apresentaram maior concentração de indicadores nestes
        domínios:
      </p>
      <ol className="mt-5 space-y-4">
        {result.topDomains.map((d, i) => {
          const s = result.domainScores[d];
          const dm = DOMAIN_META[d];
          const Icon = dm.icon;
          return (
            <li key={d} className="flex items-start gap-4">
              <span className="mt-0.5 w-4 shrink-0 text-sm text-slate-400">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="flex items-center gap-2 text-[15px] font-medium">
                    <Icon size={15} className="text-slate-400" /> {dm.label}
                  </span>
                  <span className="text-sm tabular-nums text-slate-500">
                    {s.score}
                  </span>
                </div>
                <div className="mt-2">
                  <IndicatorBar
                    score={s.score}
                    confidence={s.confidence}
                    accent={meta.accent}
                  />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {dm.about}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {result.characteristics.length > 0 && (
        <>
          <h2 className="mt-14 text-xl font-semibold">
            Características observadas
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
            Padrões que apareceram com mais força nas suas respostas. Não são
            causas nem conclusões — são o que você descreveu.
          </p>
          <ul className="mt-5 space-y-2.5">
            {result.characteristics.map((c) => (
              <li
                key={c.id}
                className="flex gap-3 text-[15px] leading-relaxed text-slate-700"
              >
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: meta.accent }}
                />
                {c.text}
              </li>
            ))}
          </ul>
        </>
      )}

      {cooccurring.length > 0 && (
        <>
          <h2 className="mt-14 text-xl font-semibold">
            Possíveis áreas para investigação
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
            Além dos eixos acima, estas áreas apresentaram indicadores que podem
            ser úteis de conversar com um profissional. São observações de
            rastreio, não conclusões.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {cooccurring.map((x) => {
              const dm = DOMAIN_META[x.d];
              const Icon = dm.icon;
              return (
                <Card key={x.d} className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[15px] font-medium">
                      <Icon size={15} className="text-slate-400" /> {dm.label}
                    </span>
                    <span className="text-sm tabular-nums text-slate-500">
                      {x.score}
                    </span>
                  </div>
                  <div className="mt-3">
                    <IndicatorBar
                      score={x.score}
                      confidence={x.confidence}
                      accent="#475569"
                    />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    Foram identificados indicadores relacionados a{" "}
                    {dm.label.toLowerCase()}. Pode ser útil conversar sobre isso
                    em uma avaliação.
                  </p>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <h2 className="mt-14 text-xl font-semibold">O que isso significa</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-slate-700">
        <p>
          Esses indicadores podem estar presentes em diferentes condições e
          também ocorrem em pessoas sem TEA. Uma pontuação alta em um domínio
          descreve a frequência com que você relata determinadas experiências —
          não a causa delas.
        </p>
        <p>
          Por isso o resultado não representa um diagnóstico e não deve ser lido
          como probabilidade de ter uma condição.
        </p>
      </div>

      <h2 className="mt-12 text-xl font-semibold">Próximo passo recomendado</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
        Conversar com um profissional qualificado para uma avaliação
        individualizada. O relatório técnico organiza suas respostas em um
        formato que facilita essa conversa.
      </p>

      <div className="mt-9 flex flex-wrap gap-3">
        <Button size="lg" onClick={() => go("dashboard")}>
          Ver meu painel
        </Button>
        <Button size="lg" variant="outline" onClick={() => go("report")}>
          <FileText size={16} /> Relatório técnico
        </Button>
        <Button size="lg" variant="outline" onClick={() => go("sharing")}>
          <Share2 size={16} /> Compartilhar
        </Button>
      </div>

      <div className="mt-12 border-t border-slate-200 pt-6">
        <Disclaimer />
      </div>
    </div>
  );
}

/* ── Painel ──────────────────────────────────────────────────────────────── */

function Dashboard({ result, history, go, onRestart }) {
  const meta = STATUS_META[result.status];
  const StatusIcon = meta.icon;

  const radarData = DOMAIN_ORDER.filter(
    (d) => result.domainScores[d].score !== null,
  ).map((d) => ({
    domain: DOMAIN_META[d].short,
    valor: result.domainScores[d].score,
  }));

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Seu perfil de triagem
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Avaliação {result.id} ·{" "}
            {new Date(result.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <Button variant="outline" onClick={onRestart}>
          Nova avaliação
        </Button>
      </div>

      <div className="mt-7 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Card
          className="relative overflow-hidden p-6"
          style={{ borderColor: meta.line }}
        >
          <div
            className="absolute inset-0"
            style={{ background: meta.soft, opacity: 0.7 }}
          />
          <div className="pointer-events-none absolute inset-0">
            <ProfilePattern pattern={meta.pattern} accent={meta.accent} />
          </div>
          <div className="relative">
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: meta.accent }}
              >
                <StatusIcon size={19} className="text-white" />
              </span>
              <div>
                <p className="text-xs" style={{ color: meta.accent }}>
                  Status atual
                </p>
                <h2 className="text-lg font-semibold">{meta.label}</h2>
              </div>
            </div>
            <dl className="mt-6 grid grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">Perfil predominante</dt>
                <dd className="mt-1 font-medium">
                  {DOMAIN_META[result.topDomains[0]]?.short ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Composto central</dt>
                <dd className="mt-1 font-medium tabular-nums">
                  {result.composite}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Confiança</dt>
                <dd className="mt-1 font-medium tabular-nums">
                  {Math.round(result.confidence * 100)}%
                </dd>
              </div>
            </dl>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="px-2 pt-1 text-sm font-medium text-slate-600">
            Distribuição por domínio
          </h2>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="domain"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                />
                <PolarRadiusAxis
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  dataKey="valor"
                  stroke={meta.accent}
                  fill={meta.accent}
                  fillOpacity={0.18}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <h2 className="mt-12 text-lg font-semibold">Indicadores</h2>
      <p className="mt-1.5 text-sm text-slate-500">
        Cada domínio tem seu próprio indicador. Eles não se somam em uma nota
        única.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DOMAIN_ORDER.map((d) => {
          const s = result.domainScores[d];
          const dm = DOMAIN_META[d];
          const Icon = dm.icon;
          const answered = s.score !== null;
          return (
            <Card key={d} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <span className="flex items-center gap-2 text-[15px] font-medium">
                  <Icon size={15} className="text-slate-400" /> {dm.label}
                </span>
                <span className="text-sm tabular-nums text-slate-500">
                  {answered ? s.score : "—"}
                </span>
              </div>
              <div className="mt-3">
                <IndicatorBar
                  score={s.score}
                  confidence={s.confidence}
                  accent={dm.group === "core" ? meta.accent : "#475569"}
                />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {answered
                  ? `${s.answered} ${s.answered === 1 ? "pergunta" : "perguntas"} · confiança ${Math.round(s.confidence * 100)}%`
                  : "Não explorado nesta avaliação"}
              </p>
            </Card>
          );
        })}
      </div>

      {result.characteristics.length > 0 && (
        <>
          <h2 className="mt-12 text-lg font-semibold">
            Características observadas
          </h2>
          <Card className="mt-4 divide-y divide-slate-100">
            {result.characteristics.map((c) => (
              <div
                key={c.id}
                className="flex items-start gap-3 p-4 text-[15px]"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                <span className="flex-1 leading-relaxed text-slate-700">
                  {c.text}
                </span>
                <span className="shrink-0 text-xs text-slate-400">
                  {DOMAIN_META[c.domain].short}
                </span>
              </div>
            ))}
          </Card>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Estas características foram relatadas por você. Não é possível
            afirmar que decorram de TEA ou de qualquer outra condição
            específica.
          </p>
        </>
      )}

      {history.length > 1 && (
        <>
          <h2 className="mt-12 text-lg font-semibold">Histórico</h2>
          <Card className="mt-4 divide-y divide-slate-100">
            {history.map((h) => (
              <div
                key={h.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4 text-sm"
              >
                <span className="font-medium tabular-nums">{h.id}</span>
                <span className="text-slate-500">
                  {new Date(h.createdAt).toLocaleDateString("pt-BR")}
                </span>
                <span className="text-slate-600">
                  {STATUS_META[h.status].label}
                </span>
                <span className="ml-auto tabular-nums text-slate-500">
                  composto {h.composite}
                </span>
              </div>
            ))}
          </Card>
        </>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => go("report")}>
          <FileText size={16} /> Relatório técnico
        </Button>
        <Button variant="outline" onClick={() => go("sharing")}>
          <Share2 size={16} /> Compartilhar avaliação
        </Button>
        <Button variant="outline" onClick={() => go("references")}>
          <BookOpen size={16} /> Referências
        </Button>
      </div>

      <div className="mt-10 border-t border-slate-200 pt-6">
        <Disclaimer />
      </div>
    </div>
  );
}

/* ── Relatório técnico ───────────────────────────────────────────────────── */

function TechnicalReport({ result, history }) {
  const [tab, setTab] = useState("overview");
  const tabs = [
    ["overview", "Informações"],
    ["results", "Resultado"],
    ["evidence", "Evidências"],
    ["responses", "Respostas"],
    ["history", "Histórico"],
  ];

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">
        Relatório técnico
      </h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Formato objetivo, pensado para leitura por profissional de saúde.
      </p>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm transition-colors ${
              tab === id
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-7">
        {tab === "overview" && (
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {[
              ["ID da avaliação", result.id],
              ["Data", new Date(result.createdAt).toLocaleString("pt-BR")],
              ["Versão do instrumento", result.instrumentVersion],
              [
                "Perguntas respondidas",
                `${result.responses.length} de ${QUESTIONS.length} disponíveis`,
              ],
              [
                "Domínios analisados",
                `${DOMAIN_ORDER.filter((d) => result.domainScores[d].score !== null).length} de ${DOMAIN_ORDER.length}`,
              ],
              ["Faixa etária informada", result.intake?.ageRange ?? "—"],
              ["Avaliação prévia relatada", result.intake?.previousEval || "—"],
              ["Confiança global", `${Math.round(result.confidence * 100)}%`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-sm text-slate-500">{k}</dt>
                <dd className="mt-1 text-[15px] font-medium tabular-nums">
                  {v}
                </dd>
              </div>
            ))}
            <div className="sm:col-span-2">
              <dt className="text-sm text-slate-500">Metodologia</dt>
              <dd className="mt-1.5 text-[15px] leading-relaxed text-slate-700">
                Questionário adaptativo de autorrelato com escala Likert de
                frequência de cinco pontos. A seleção de itens é feita por um
                motor que prioriza o domínio de maior incerteza, pondera o peso
                do item e suprime eixos com sinal baixo. O escore de cada
                domínio é a média ponderada dos itens normalizados; a confiança
                combina cobertura de itens (62%) e consistência interna das
                respostas (38%). O composto central é a média dos seis domínios
                do eixo TEA, ponderada pela confiança de cada um. Nenhum ponto
                de corte diagnóstico é aplicado.
              </dd>
            </div>
          </dl>
        )}

        {tab === "results" && (
          <div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm text-slate-500">Status da triagem</p>
              <p className="mt-1 text-lg font-semibold">
                {STATUS_META[result.status].label}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Composto central {result.composite} · confiança{" "}
                {Math.round(result.confidence * 100)}%
              </p>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2.5 pr-4 font-medium">Domínio</th>
                    <th className="py-2.5 pr-4 font-medium">Eixo</th>
                    <th className="py-2.5 pr-4 text-right font-medium">
                      Indicador
                    </th>
                    <th className="py-2.5 pr-4 text-right font-medium">
                      Itens
                    </th>
                    <th className="py-2.5 text-right font-medium">Confiança</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {DOMAIN_ORDER.map((d) => {
                    const s = result.domainScores[d];
                    return (
                      <tr key={d}>
                        <td className="py-2.5 pr-4">{DOMAIN_META[d].label}</td>
                        <td className="py-2.5 pr-4 text-slate-500">
                          {DOMAIN_META[d].group === "core"
                            ? "Central"
                            : "Coocorrente"}
                        </td>
                        <td className="py-2.5 pr-4 text-right tabular-nums">
                          {s.score ?? "—"}
                        </td>
                        <td className="py-2.5 pr-4 text-right tabular-nums">
                          {s.answered}
                        </td>
                        <td className="py-2.5 text-right tabular-nums">
                          {s.answered
                            ? `${Math.round(s.confidence * 100)}%`
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              Os indicadores expressam a frequência relatada de experiências
              dentro de cada domínio. Não são probabilidades diagnósticas nem
              escores padronizados com norma populacional.
            </p>
          </div>
        )}

        {tab === "evidence" && (
          <div className="space-y-4">
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
              As fontes abaixo são bases conceituais para a organização dos
              domínios. Os itens do questionário são de autoria própria e não
              reproduzem instrumentos proprietários. As referências devem ser
              validadas pela equipe científica antes do uso em produção.
            </p>
            {DOMAIN_ORDER.filter(
              (d) => result.domainScores[d].score !== null,
            ).map((d) => {
              const dm = DOMAIN_META[d];
              const s = result.domainScores[d];
              return (
                <Card key={d} className="p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-semibold">{dm.label}</h3>
                    <span className="text-sm tabular-nums text-slate-500">
                      indicador {s.score}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {dm.about}
                  </p>
                  <div className="mt-4 space-y-2.5">
                    {dm.sources.map((sid) => {
                      const src = SOURCES[sid];
                      return (
                        <div
                          key={sid}
                          className="border-l-2 border-slate-200 pl-3.5"
                        >
                          <p className="text-sm font-medium">{src.name}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {src.reference}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600">
                    <span className="font-medium">Limitações. </span>
                    {dm.limits}
                  </p>
                </Card>
              );
            })}
          </div>
        )}

        {tab === "responses" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2.5 pr-4 font-medium">#</th>
                  <th className="py-2.5 pr-4 font-medium">Item</th>
                  <th className="py-2.5 pr-4 font-medium">Domínio</th>
                  <th className="py-2.5 text-right font-medium">Resposta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.responses.map((r, i) => {
                  const q = QUESTION_BY_ID[r.questionId];
                  const opt = LIKERT.find((o) => o.value === r.value);
                  return (
                    <tr key={r.questionId}>
                      <td className="py-2.5 pr-4 tabular-nums text-slate-400">
                        {i + 1}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="block max-w-md leading-relaxed">
                          {q.text}
                        </span>
                        <span className="text-xs text-slate-400">
                          {q.id} · peso {q.w}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-500">
                        {DOMAIN_META[q.d].short}
                      </td>
                      <td className="py-2.5 text-right">{opt?.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === "history" && (
          <div>
            {history.length <= 1 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                <p className="text-[15px] font-medium">
                  Ainda não há o que comparar
                </p>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                  A comparação entre avaliações aparece a partir da segunda
                  triagem. Refazer depois de algumas semanas ajuda a distinguir
                  traços estáveis de oscilações do momento.
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2.5 pr-4 font-medium">Avaliação</th>
                    <th className="py-2.5 pr-4 font-medium">Data</th>
                    <th className="py-2.5 pr-4 font-medium">Status</th>
                    <th className="py-2.5 pr-4 text-right font-medium">
                      Composto
                    </th>
                    <th className="py-2.5 text-right font-medium">Itens</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td className="py-2.5 pr-4 tabular-nums">{h.id}</td>
                      <td className="py-2.5 pr-4">
                        {new Date(h.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-2.5 pr-4">
                        {STATUS_META[h.status].label}
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">
                        {h.composite}
                      </td>
                      <td className="py-2.5 text-right tabular-nums">
                        {h.responses.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <div className="mt-12 border-t border-slate-200 pt-6">
        <Disclaimer />
      </div>
    </div>
  );
}

/* ── Compartilhamento ────────────────────────────────────────────────────── */

function Sharing({ result, shares, setShares }) {
  const [form, setForm] = useState({ name: "", days: "30", scope: "full" });
  const [copied, setCopied] = useState(null);

  const create = () => {
    const code = `${result.id}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const expires = new Date(Date.now() + Number(form.days) * 86400000);
    setShares((s) => [
      {
        code,
        professional: form.name.trim(),
        scope: form.scope,
        createdAt: new Date().toISOString(),
        expiresAt: expires.toISOString(),
        lastAccess: null,
        revoked: false,
      },
      ...s,
    ]);
    setForm({ name: "", days: "30", scope: "full" });
  };

  const revoke = (code) =>
    setShares((s) =>
      s.map((x) => (x.code === code ? { ...x, revoked: true } : x)),
    );

  const copy = (code) => {
    setCopied(code);
    setTimeout(() => setCopied(null), 1800);
  };

  const active = shares.filter((s) => !s.revoked);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">
        Compartilhar avaliação
      </h1>
      <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-slate-600">
        Nenhum profissional recebe seu relatório automaticamente. Você gera um
        código de acesso, define o prazo e pode revogar a qualquer momento.
      </p>

      <Card className="mt-7 p-6">
        <h2 className="font-semibold">Gerar novo acesso</h2>
        <div className="mt-5 space-y-5">
          <div>
            <label htmlFor="profName" className="text-sm font-medium">
              Para quem é este acesso?
            </label>
            <input
              id="profName"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nome do profissional ou da clínica"
              className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-[15px] outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <span className="text-sm font-medium">Validade</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                ["7", "7 dias"],
                ["30", "30 dias"],
                ["90", "90 dias"],
              ].map(([v, l]) => (
                <Chip
                  key={v}
                  selected={form.days === v}
                  onClick={() => setForm((f) => ({ ...f, days: v }))}
                >
                  {l}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <span className="text-sm font-medium">
              O que o profissional poderá ver
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                ["full", "Relatório completo"],
                ["summary", "Somente resumo e indicadores"],
              ].map(([v, l]) => (
                <Chip
                  key={v}
                  selected={form.scope === v}
                  onClick={() => setForm((f) => ({ ...f, scope: v }))}
                >
                  {l}
                </Chip>
              ))}
            </div>
          </div>
        </div>
        <Button
          className="mt-6"
          disabled={form.name.trim().length < 2}
          onClick={create}
        >
          <Share2 size={16} /> Gerar acesso
        </Button>
      </Card>

      <h2 className="mt-11 text-lg font-semibold">
        Quem possui acesso ao meu relatório?
      </h2>
      {shares.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <p className="text-[15px] font-medium">Nenhum acesso ativo</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
            Seu relatório está visível apenas para você. Gere um acesso acima
            quando quiser levá-lo a uma consulta.
          </p>
        </div>
      ) : (
        <Card className="mt-4 divide-y divide-slate-100">
          {shares.map((s) => (
            <div
              key={s.code}
              className="flex flex-wrap items-start gap-x-4 gap-y-2 p-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{s.professional}</span>
                  {s.revoked && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      Revogado
                    </span>
                  )}
                </div>
                <p className="mt-1.5 font-mono text-sm text-slate-600">
                  {s.code}
                </p>
                <p className="mt-1.5 text-xs text-slate-500">
                  Criado em {new Date(s.createdAt).toLocaleDateString("pt-BR")}{" "}
                  · expira em{" "}
                  {new Date(s.expiresAt).toLocaleDateString("pt-BR")} ·{" "}
                  {s.scope === "full"
                    ? "relatório completo"
                    : "resumo e indicadores"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Último acesso:{" "}
                  {s.lastAccess
                    ? new Date(s.lastAccess).toLocaleString("pt-BR")
                    : "nunca aberto"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copy(s.code)}
                  disabled={s.revoked}
                >
                  {copied === s.code ? <Check size={14} /> : <Copy size={14} />}
                  {copied === s.code ? "Copiado" : "Copiar código"}
                </Button>
                {!s.revoked && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => revoke(s.code)}
                  >
                    Revogar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}

      <p className="mt-5 text-sm leading-relaxed text-slate-500">
        {active.length > 0
          ? `${active.length} ${active.length === 1 ? "acesso ativo" : "acessos ativos"}. Revogar interrompe a visualização imediatamente, inclusive para links já abertos.`
          : "Revogar um acesso interrompe a visualização imediatamente, inclusive para links já abertos."}
      </p>

      <div className="mt-10 border-t border-slate-200 pt-6">
        <Disclaimer />
      </div>
    </div>
  );
}

/* ── Portal do profissional ──────────────────────────────────────────────── */

function ProfessionalPortal({ result, shares, setShares, notes, setNotes }) {
  const [code, setCode] = useState("");
  const [openCode, setOpenCode] = useState(null);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");

  const share = shares.find((s) => s.code === openCode);

  const open = () => {
    const found = shares.find(
      (s) => s.code.toUpperCase() === code.trim().toUpperCase(),
    );
    if (!found)
      return setError(
        "Código não encontrado. Confira com a pessoa que gerou o acesso.",
      );
    if (found.revoked)
      return setError("Este acesso foi revogado pela pessoa avaliada.");
    if (new Date(found.expiresAt) < new Date())
      return setError("Este acesso expirou.");
    setError("");
    setOpenCode(found.code);
    setShares((s) =>
      s.map((x) =>
        x.code === found.code
          ? { ...x, lastAccess: new Date().toISOString() }
          : x,
      ),
    );
  };

  if (!share) {
    return (
      <div className="mx-auto max-w-md px-5 py-16">
        <UserCog size={22} className="text-blue-600" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Portal do profissional
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
          Informe o código de acesso que a pessoa avaliada compartilhou com
          você.
        </p>
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && open()}
          placeholder="AV-2026-XXXXXX-XXXX"
          className="mt-6 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 font-mono text-[15px] outline-none focus:border-blue-500"
          aria-label="Código de acesso"
        />
        {error && (
          <p className="mt-3 flex items-start gap-2 text-sm text-red-700">
            <AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}
          </p>
        )}
        <Button
          className="mt-5 w-full"
          onClick={open}
          disabled={code.trim().length < 6}
        >
          Abrir avaliação
        </Button>
        <p className="mt-8 text-xs leading-relaxed text-slate-500">
          Cada abertura fica registrada com data e hora e é visível para a
          pessoa avaliada. O acesso pode ser revogado por ela a qualquer
          momento.
        </p>
      </div>
    );
  }

  const meta = STATUS_META[result.status];
  const noteList = notes[share.code] ?? [];

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Avaliação de {result.intake?.firstName || "usuário"}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            {result.id} ·{" "}
            {new Date(result.createdAt).toLocaleDateString("pt-BR")} · acesso{" "}
            {share.scope === "full" ? "completo" : "resumido"} até{" "}
            {new Date(share.expiresAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            setOpenCode(null);
            setCode("");
          }}
        >
          Fechar
        </Button>
      </div>

      <Card
        className="mt-6 p-5"
        style={{ borderColor: meta.line, background: meta.soft }}
      >
        <p className="text-sm" style={{ color: meta.accent }}>
          Status da triagem
        </p>
        <p className="mt-0.5 text-lg font-semibold">{meta.label}</p>
        <p className="mt-2 text-sm text-slate-700">
          Composto central {result.composite} · confiança{" "}
          {Math.round(result.confidence * 100)}% · {result.responses.length}{" "}
          itens respondidos
        </p>
      </Card>

      <h2 className="mt-9 text-lg font-semibold">Indicadores por domínio</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {DOMAIN_ORDER.filter((d) => result.domainScores[d].score !== null).map(
          (d) => {
            const s = result.domainScores[d];
            return (
              <div key={d} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium">
                    {DOMAIN_META[d].label}
                  </span>
                  <span className="text-sm tabular-nums text-slate-500">
                    {s.score}
                  </span>
                </div>
                <div className="mt-2.5">
                  <IndicatorBar
                    score={s.score}
                    confidence={s.confidence}
                    accent={meta.accent}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {s.answered} itens · confiança{" "}
                  {Math.round(s.confidence * 100)}%
                </p>
              </div>
            );
          },
        )}
      </div>

      {share.scope === "full" && (
        <>
          <h2 className="mt-9 text-lg font-semibold">Respostas</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2.5 pr-4 font-medium">Item</th>
                  <th className="py-2.5 pr-4 font-medium">Domínio</th>
                  <th className="py-2.5 text-right font-medium">Resposta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.responses.map((r) => {
                  const q = QUESTION_BY_ID[r.questionId];
                  return (
                    <tr key={r.questionId}>
                      <td className="py-2.5 pr-4">
                        <span className="block max-w-md leading-relaxed">
                          {q.text}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-500">
                        {DOMAIN_META[q.d].short}
                      </td>
                      <td className="py-2.5 text-right">
                        {LIKERT.find((o) => o.value === r.value)?.label}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2 className="mt-9 text-lg font-semibold">Observações profissionais</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
        Registros feitos por você. Ficam vinculados a este acesso e não alteram
        os indicadores da triagem.
      </p>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={4}
        placeholder="Hipóteses, encaminhamentos, recomendações, plano de acompanhamento"
        className="mt-4 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-[15px] leading-relaxed outline-none focus:border-blue-500"
      />
      <Button
        className="mt-3"
        disabled={draft.trim().length < 3}
        onClick={() => {
          setNotes((n) => ({
            ...n,
            [share.code]: [
              { text: draft.trim(), at: new Date().toISOString() },
              ...(n[share.code] ?? []),
            ],
          }));
          setDraft("");
        }}
      >
        Salvar observação
      </Button>

      {noteList.length > 0 && (
        <Card className="mt-5 divide-y divide-slate-100">
          {noteList.map((n) => (
            <div key={n.at} className="p-4">
              <p className="text-xs text-slate-400">
                {new Date(n.at).toLocaleString("pt-BR")}
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">
                {n.text}
              </p>
            </div>
          ))}
        </Card>
      )}

      <p className="mt-10 border-t border-slate-200 pt-6 text-sm leading-relaxed text-slate-500">
        Esta triagem organiza autorrelato e não substitui julgamento clínico,
        entrevista, anamnese ou instrumentos aplicados por profissional
        habilitado.
      </p>
    </div>
  );
}

/* ── Referências ─────────────────────────────────────────────────────────── */

function References() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Base científica</h1>
      <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-slate-600">
        Os itens deste questionário são de autoria própria. As fontes abaixo
        orientaram a organização dos domínios, e não foram copiadas nem
        adaptadas de instrumentos proprietários.
      </p>

      <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
        Antes de ir para produção, cada referência precisa ser conferida por uma
        equipe científica, junto com a revisão dos itens, dos pesos e dos pontos
        de escalonamento de status.
      </p>

      <div className="mt-8 space-y-4">
        {Object.values(SOURCES).map((s) => (
          <Card key={s.id} className="p-6">
            <h2 className="font-semibold">{s.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {s.authors?.join(", ")} · {s.year} · população: {s.population}
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
              {s.purpose}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              <span className="font-medium">Limitações. </span>
              {s.limitations}
            </p>
            <p className="mt-3 text-xs text-slate-500">{s.reference}</p>
          </Card>
        ))}
      </div>

      <h2 className="mt-12 text-lg font-semibold">
        Limitações gerais desta triagem
      </h2>
      <ul className="mt-4 space-y-2.5 text-[15px] leading-relaxed text-slate-700">
        {[
          "É autorrelato: depende de como você se percebe hoje, e a percepção muda com sono, humor e contexto.",
          "Não foi normatizada em uma amostra brasileira nem tem pontos de corte validados.",
          "Não diferencia entre condições. Indicadores altos em vários domínios podem ter origens muito diferentes.",
          "Foi desenhada para adultos que respondem sobre si mesmos. Não serve para avaliar crianças nem terceiros.",
          "Não avalia impacto funcional, história de desenvolvimento nem contexto familiar — três elementos centrais de uma avaliação real.",
        ].map((t) => (
          <li key={t} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
            {t}
          </li>
        ))}
      </ul>

      <div className="mt-10 border-t border-slate-200 pt-6">
        <Disclaimer />
      </div>
    </div>
  );
}

/* ============================================================================
   APP
   ========================================================================= */

export default function App() {
  const [view, setView] = useState("landing");
  const [intake, setIntake] = useState(null);
  const [responses, setResponses] = useState([]);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [shares, setShares] = useState([]);
  const [notes, setNotes] = useState({});
  const [a11yOpen, setA11yOpen] = useState(false);
  const [settings, setSettings] = useState({
    fontScale: 1,
    reduceMotion: false,
    highContrast: false,
  });

  const go = useCallback(
    (next) => {
      setView(next);
      window.scrollTo?.({
        top: 0,
        behavior: settings.reduceMotion ? "auto" : "smooth",
      });
    },
    [settings.reduceMotion],
  );

  const finishAssessment = useCallback(() => {
    setView("processing");
  }, []);

  const commitResult = useCallback(() => {
    const built = buildAssessmentResult(responses, intake);
    setResult(built);
    setHistory((h) => [built, ...h]);
    setView("result");
  }, [responses, intake]);

  const restart = () => {
    setResponses([]);
    setResult(null);
    setView("consent");
  };

  return (
    <A11yContext.Provider value={settings}>
      <GlobalStyles />
      <div
        className={`tri-root min-h-screen ${settings.reduceMotion ? "tri-reduce" : ""} ${settings.highContrast ? "tri-contrast" : ""}`}
        style={{ fontSize: `${settings.fontScale * 16}px` }}
      >
        {view !== "assessment" && view !== "processing" && (
          <Header
            view={view}
            go={go}
            hasResult={!!result}
            onOpenA11y={() => setA11yOpen(true)}
          />
        )}

        <main className="w-full">
          {view === "landing" && <Landing go={go} />}
          {view === "consent" && <Consent go={go} />}
          {view === "intake" && <Intake go={go} setIntake={setIntake} />}
          {view === "assessment" && (
            <Assessment
              responses={responses}
              setResponses={setResponses}
              onFinish={finishAssessment}
              go={go}
            />
          )}
          {view === "processing" && <Processing onDone={commitResult} />}
          {view === "result" && result && <Result result={result} go={go} />}
          {view === "dashboard" && result && (
            <Dashboard
              result={result}
              history={history}
              go={go}
              onRestart={restart}
            />
          )}
          {view === "report" && result && (
            <TechnicalReport result={result} history={history} />
          )}
          {view === "sharing" && result && (
            <Sharing result={result} shares={shares} setShares={setShares} />
          )}
          {view === "references" && <References />}
          {view === "professional" &&
            (result ? (
              <ProfessionalPortal
                result={result}
                shares={shares}
                setShares={setShares}
                notes={notes}
                setNotes={setNotes}
              />
            ) : (
              <div className="mx-auto max-w-md px-5 py-20 text-center">
                <UserCog size={22} className="mx-auto text-slate-400" />
                <h1 className="mt-4 text-xl font-semibold">
                  Nenhuma avaliação disponível
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Nesta demonstração, complete uma triagem e gere um código na
                  área de compartilhamento para abri-lo aqui.
                </p>
                <Button className="mt-6" onClick={() => go("consent")}>
                  Fazer uma triagem
                </Button>
              </div>
            ))}
        </main>

        <AccessibilityPanel
          open={a11yOpen}
          onClose={() => setA11yOpen(false)}
          settings={settings}
          setSettings={setSettings}
        />
      </div>
    </A11yContext.Provider>
  );
}
