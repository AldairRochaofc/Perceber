import type { SignalLevel } from './types'

export type SignalPattern = 'grid' | 'waves' | 'nodes' | 'contour' | 'none'

/**
 * Faixas de sinal de triagem. A intensidade é codificada por profundidade do
 * azul, por padrão gráfico e por texto — nunca só por cor, nunca em vermelho.
 */
export const SIGNALS: Record<SignalLevel, {
  label: string
  step: number // posição no medidor (0–3); -1 = fora da escala
  pattern: SignalPattern
  colorVar: string
  softVar: string
  textVar: string
  summary: string
  tone: string
}> = {
  low: {
    label: 'Baixa indicação',
    step: 0,
    pattern: 'grid',
    colorVar: 'var(--color-signal-low)',
    softVar: 'var(--color-signal-low-soft)',
    textVar: 'var(--color-signal-low-text)',
    summary: 'Suas respostas trouxeram poucos relatos frequentes nos domínios do eixo central.',
    tone: 'Isso não descarta nada e também não confirma nada. É o retrato do que você respondeu hoje.',
  },
  moderate: {
    label: 'Indicação moderada',
    step: 1,
    pattern: 'waves',
    colorVar: 'var(--color-signal-moderate)',
    softVar: 'var(--color-signal-moderate-soft)',
    textVar: 'var(--color-signal-moderate)',
    summary: 'Dois ou três domínios do eixo central reuniram relatos frequentes. Isso pode justificar uma investigação mais cuidadosa.',
    tone: 'Vale observar esses pontos com calma e, se fizer sentido para você, levá-los a uma conversa profissional.',
  },
  high: {
    label: 'Indicação elevada',
    step: 2,
    pattern: 'nodes',
    colorVar: 'var(--color-signal-high)',
    softVar: 'var(--color-signal-high-soft)',
    textVar: 'var(--color-signal-high)',
    summary: 'Quatro ou mais domínios do eixo central reuniram relatos frequentes. Isso pode justificar uma avaliação profissional.',
    tone: 'Muitas pessoas convivem com essas características a vida toda sem um nome para elas. Ter as informações organizadas costuma facilitar o próximo passo.',
  },
  wide: {
    label: 'Avaliação profissional sugerida',
    step: 3,
    pattern: 'contour',
    colorVar: 'var(--color-signal-wide)',
    softVar: 'var(--color-signal-wide-soft)',
    textVar: 'var(--color-signal-wide)',
    summary: 'Quatro ou mais domínios do eixo central reuniram relatos frequentes, e você relatou impacto frequente no dia a dia. Uma avaliação profissional pode ser especialmente útil.',
    tone: 'Isso não é um diagnóstico nem uma sentença. É uma sugestão de próximo passo, e você decide o ritmo.',
  },
  insufficient: {
    label: 'Dados insuficientes',
    step: -1,
    pattern: 'none',
    colorVar: 'var(--color-signal-none)',
    softVar: 'var(--color-signal-none-soft)',
    textVar: 'var(--color-text-subtle)',
    summary: 'Algumas áreas ficaram com poucas respostas, então não é possível indicar um sinal com segurança.',
    tone: 'Se quiser, faça uma nova avaliação respondendo às perguntas que ficaram em branco.',
  },
}

export const SIGNAL_ORDER: SignalLevel[] = ['low', 'moderate', 'high', 'wide']

export const CAN_SUPPORT = [
  'Organizar o que você percebe em você, por domínio.',
  'Começar uma conversa com um profissional, com suas palavras e exemplos.',
  'Acompanhar mudanças se você refizer a avaliação depois de algumas semanas.',
]

export const CANNOT_SUPPORT = [
  'Confirmar ou descartar autismo, TDAH, ansiedade ou qualquer condição.',
  'Servir como laudo, atestado ou documento para benefícios.',
  'Indicar tratamento, medicação ou gravidade.',
  'Comparar você com outras pessoas: o módulo ainda não tem norma populacional.',
]

export const CUTOFF_NOTICE =
  'Pontos de corte não são fronteiras biológicas nem diagnósticas. Os deste módulo são provisórios, definidos por consenso interno, e ainda não passaram por estudo de validade.'

export const NEXT_STEP =
  'Conversar com um profissional habilitado pode ajudar se você tem interesse em entender melhor essas características, se elas trazem sofrimento ou dificuldades no dia a dia, ou se as dúvidas continuam. O relatório organiza suas respostas para essa conversa.'
