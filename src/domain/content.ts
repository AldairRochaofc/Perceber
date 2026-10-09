import type { Professional } from './types'

export const DISCLAIMER = 'Este sistema realiza triagem e organiza informações. Ele não confirma nem exclui diagnóstico de autismo.'

/** Orientação de segurança. Não é avaliação de risco automatizada. */
export const CRISIS = {
  title: 'Se você está em sofrimento intenso agora',
  intro: 'Você não precisa continuar a avaliação. Procure apoio agora mesmo:',
  items: [
    { label: 'Risco imediato à sua vida ou à de outra pessoa', action: 'Ligue 192 (SAMU) ou vá ao pronto-socorro mais próximo.', href: 'tel:192', cta: 'Ligar 192' },
    { label: 'Conversar com alguém agora', action: 'CVV — Centro de Valorização da Vida: ligue 188, gratuito, 24 horas, ou use o chat em cvv.org.br.', href: 'tel:188', cta: 'Ligar 188' },
    { label: 'Acompanhamento na rede pública', action: 'Procure a Unidade Básica de Saúde ou o CAPS da sua região.', href: null, cta: null },
    { label: 'Alguém de confiança', action: 'Avise uma pessoa próxima e peça que fique com você.', href: null, cta: null },
  ],
  outro: 'Você pode voltar ao PERCEBER quando se sentir mais seguro(a). Suas respostas salvas continuam aqui.',
}

export const TIME_STEPS = [
  { step: 'Consentimentos e perfil', time: '3 a 5 minutos' },
  { step: 'Antes de começar', time: '1 minuto' },
  { step: 'Eixo central', time: '8 a 12 minutos' },
  { step: 'Áreas coocorrentes (opcional)', time: '3 a 5 minutos' },
]

export const FAQ: { q: string; a: string; topic: 'triagem' | 'diagnostico' | 'privacidade' | 'compartilhamento' }[] = [
  { topic: 'diagnostico', q: 'O resultado vale como laudo?', a: 'Não. O relatório organiza suas respostas e pode ser levado a uma consulta, mas não tem valor diagnóstico, pericial ou de atestado.' },
  { topic: 'diagnostico', q: 'Muitos relatos frequentes significam que sou autista?', a: 'Não. Vários domínios observados aparecem em outras condições e também em pessoas sem nenhuma condição. Por isso o resultado é mostrado por domínio, com limites e explicações alternativas.' },
  { topic: 'diagnostico', q: 'E poucos relatos significam que não sou?', a: 'Também não. Autorrelato depende de autopercepção, de camuflagem e do momento de vida. Se as dúvidas continuam, uma conversa profissional é o caminho.' },
  { topic: 'triagem', q: 'Por que as perguntas mudam entre pessoas?', a: 'Cada domínio tem três perguntas fixas. Quando suas respostas a elas chegam, em média, a “Às vezes” ou mais, aparecem até duas perguntas de aprofundamento. A regra é a mesma para todo mundo.' },
  { topic: 'triagem', q: 'Vocês usam testes como AQ, RAADS-R ou CAT-Q?', a: 'Não. As perguntas são de autoria própria, escritas a partir dos domínios descritos na literatura. As fontes estão na Base científica.' },
  { topic: 'triagem', q: 'Posso responder por outra pessoa?', a: 'Esta versão é de autorrelato para adultos. Respostas em nome de outra pessoa mudam a interpretação e não são recomendadas.' },
  { topic: 'triagem', q: 'Posso parar no meio?', a: 'Sim. Suas respostas ficam salvas e você continua de onde parou. Você também pode pular qualquer pergunta.' },
  { topic: 'privacidade', q: 'Onde ficam minhas respostas?', a: 'Nesta versão de demonstração, apenas neste navegador. Nenhum servidor recebe seus dados. Você pode exportar ou apagar tudo em Meu perfil.' },
  { topic: 'privacidade', q: 'Meus dados vão para pesquisa?', a: 'Só se você autorizar e só depois que o protocolo for aprovado por um comitê de ética. Recusar não muda nada no seu acesso.' },
  { topic: 'compartilhamento', q: 'Como um profissional vê meu relatório?', a: 'Você gera um código de acesso, escolhe o que ele pode ver e por quanto tempo. Cada abertura fica registrada e você pode revogar quando quiser. Não enviamos nada por e-mail ou link público.' },
  { topic: 'compartilhamento', q: 'O profissional pode me diagnosticar pela plataforma?', a: 'Não. Ele pode deixar observações para você, mas qualquer conclusão clínica depende de uma avaliação feita fora da plataforma.' },
]

export const GLOSSARY: { term: string; definition: string }[] = [
  { term: 'Triagem', definition: 'Levantamento inicial que indica se pode valer a pena investigar mais. Não confirma nem exclui condições.' },
  { term: 'Diagnóstico', definition: 'Conclusão clínica feita por profissional habilitado, com história de vida, entrevista, observação e outras fontes.' },
  { term: 'Sinal de triagem', definition: 'Resultado que pode justificar investigação adicional. Aqui, conta quantos domínios do eixo central reuniram relatos frequentes.' },
  { term: 'Domínio', definition: 'Um conjunto de experiências relacionadas, como comunicação ou processamento sensorial, observado por algumas perguntas.' },
  { term: 'Escore bruto', definition: 'Soma das respostas de um domínio (0 a 4 por pergunta). Não é porcentagem nem probabilidade.' },
  { term: 'Faixa descritiva', definition: 'O rótulo da escala de resposta mais próximo da sua média em um domínio, por exemplo “perto de Frequentemente”.' },
  { term: 'Ponto de corte', definition: 'Valor usado para separar faixas. Não é fronteira biológica. Os deste módulo são provisórios.' },
  { term: 'Norma populacional', definition: 'Dados de um grupo de referência que permitem comparar uma pessoa com outras. Este módulo ainda não tem.' },
  { term: 'Erro de medida', definition: 'Quanto um escore pode variar por imprecisão do instrumento. Só pode ser estimado com estudos de confiabilidade.' },
  { term: 'Camuflagem', definition: 'Esforço, consciente ou não, para esconder ou compensar diferenças em situações sociais.' },
  { term: 'Pseudonimização', definition: 'Troca da identidade por um código. Quem tem a chave ainda consegue ligar o código à pessoa.' },
  { term: 'Anonimização', definition: 'Tratamento que impede ligar o dado à pessoa por meios razoáveis. Reduz riscos, mas não é garantia absoluta.' },
  { term: 'Revogação', definition: 'Retirar uma autorização dada antes. Vale imediatamente para o futuro.' },
]

export const CONTEXT_FACTORS = [
  'Dormi mal ou estou com sono',
  'Estou passando por um período de muito estresse',
  'Tenho outra condição de saúde que pode influenciar',
  'Uso medicamento que pode influenciar',
  'Respondi com ajuda de outra pessoa',
  'Fui interrompido(a) várias vezes',
  'Algumas perguntas foram difíceis de entender',
]

export const REASONS = [
  'Quero me conhecer melhor',
  'Pretendo procurar avaliação profissional',
  'Um profissional sugeriu',
  'Alguém próximo comentou',
  'Curiosidade ou pesquisa',
]

/** Diretório de demonstração. Todos os registros são fictícios e marcados como tal. */
export const PROFESSIONALS: Professional[] = [
  {
    id: 'pro-a',
    name: 'Serviço-escola de Psicologia (exemplo)',
    profession: 'Psicologia — serviço-escola',
    registry: 'Registro fictício',
    areas: ['Avaliação de adultos', 'Neurodesenvolvimento'],
    modality: ['presencial', 'remoto'],
    accessibility: ['Sala com pouca luz e ruído', 'Atendimento por texto sob agendamento'],
    location: 'Cidade de exemplo, SP',
    availability: 'Lista de espera informada no contato',
    fictitious: true,
  },
  {
    id: 'pro-b',
    name: 'Psicóloga de exemplo B',
    profession: 'Psicologia',
    registry: 'CRP 00/000000 (fictício)',
    areas: ['Autismo em adultos', 'Camuflagem e esgotamento'],
    modality: ['remoto'],
    accessibility: ['Legendas em videochamada', 'Envio prévio de roteiro'],
    location: 'Atendimento remoto',
    availability: 'Novos atendimentos às quintas',
    fictitious: true,
  },
  {
    id: 'pro-c',
    name: 'Psiquiatra de exemplo C',
    profession: 'Psiquiatria',
    registry: 'CRM 000000 (fictício)',
    areas: ['Avaliação multiprofissional', 'Condições coocorrentes'],
    modality: ['presencial'],
    accessibility: ['Acesso sem degraus'],
    location: 'Cidade de exemplo, MG',
    availability: 'Agenda mensal',
    fictitious: true,
  },
  {
    id: 'pro-d',
    name: 'Ambulatório de exemplo D',
    profession: 'Equipe multiprofissional',
    registry: 'CNES 0000000 (fictício)',
    areas: ['Avaliação diagnóstica de adultos', 'Fonoaudiologia', 'Terapia ocupacional'],
    modality: ['presencial', 'remoto'],
    accessibility: ['Intérprete de Libras sob agendamento', 'Acesso sem degraus'],
    location: 'Cidade de exemplo, PE',
    availability: 'Encaminhamento pela rede pública',
    fictitious: true,
  },
]

export const PROFESSIONAL_BY_ID = Object.fromEntries(PROFESSIONALS.map((p) => [p.id, p])) as Record<string, Professional>
