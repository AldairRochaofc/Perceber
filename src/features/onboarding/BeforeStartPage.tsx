import { useState, type FormEvent } from 'react'
import { Phone } from 'lucide-react'
import { isGranted } from '../../domain/consents'
import { CRISIS } from '../../domain/content'
import { MODULE_BY_ID } from '../../domain/modules'
import type { ModuleId } from '../../domain/types'
import { crossThreshold } from '../../layout/curtainStore'
import { useReducedMotion } from '../../lib/motion'
import { navigate, type RouteMatch } from '../../lib/router'
import { recordEligibility, setPrefs, startSession, useStore } from '../../state/store'
import { Button } from '../../ui/Button'
import { Checkbox, ChoiceGroup } from '../../ui/Field'
import { PageHeader } from '../../ui/PageHeader'
import { Callout, Surface } from '../../ui/Surface'
import { useFocusOnMount } from '../../ui/useFocusOnMount'

type Answers = {
  adult: 'yes' | 'no' | null
  understands: 'yes' | 'read' | null
  language: 'fluent' | 'some-difficulty' | 'no' | null
  distress: 'no' | 'yes' | null
}

const ADAPTATIONS = [
  { id: 'larger-text', label: 'Texto maior', description: 'Aumenta todo o texto para 130%.' },
  { id: 'contrast', label: 'Mais contraste', description: 'Escurece textos secundários e reforça bordas.' },
  { id: 'less-motion', label: 'Menos animação', description: 'Sem transições nem movimentos.' },
  { id: 'confirm', label: 'Confirmar cada resposta', description: 'A próxima pergunta só aparece quando você tocar em Próxima.' },
]

export function BeforeStartPage({ match }: { match: RouteMatch }) {
  const { profile, consents, eligibility, prefs } = useStore()
  const reduced = useReducedMotion()
  const moduleId = (match.query.get('modulo') === 'cooccurring' ? 'cooccurring' : 'central') as ModuleId
  const module = MODULE_BY_ID[moduleId]
  const [answers, setAnswers] = useState<Answers>({
    adult: eligibility?.adult ? 'yes' : null,
    understands: eligibility?.understands ? 'yes' : null,
    language: eligibility?.language && eligibility.language !== 'no' ? eligibility.language : null,
    distress: null,
  })
  const [adaptations, setAdaptations] = useState<string[]>(() => [
    ...(prefs.fontScale >= 1.3 ? ['larger-text'] : []),
    ...(prefs.contrast === 'high' ? ['contrast'] : []),
    ...(prefs.motion === 'reduce' ? ['less-motion'] : []),
    ...(!prefs.autoAdvance ? ['confirm'] : []),
  ])
  const [errors, setErrors] = useState<Partial<Record<keyof Answers, string>>>({})
  const [outcome, setOutcome] = useState<'minor' | 'language' | 'safety' | null>(null)
  const [busy, setBusy] = useState(false)

  if (!isGranted(consents, 'modules')) {
    return (
      <div className="container-page grid max-w-3xl gap-8 pb-10">
        <PageHeader title="Falta uma autorização para responder." size="md" back={{ to: '/avaliacoes', label: 'Avaliações' }} />
        <Callout tone="attention" title="O consentimento para responder aos módulos não está ativo">
          Você pode concedê-lo de novo em Meu perfil, na seção de consentimentos.
        </Callout>
        <div>
          <Button to="/perfil">Abrir Meu perfil</Button>
        </div>
      </div>
    )
  }

  if (outcome) return <Outcome kind={outcome} />

  const set = <K extends keyof Answers>(k: K, v: Answers[K]) => {
    setAnswers((a) => ({ ...a, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    for (const k of Object.keys(answers) as (keyof Answers)[]) if (!answers[k]) next[k] = 'Escolha uma opção.'
    if (answers.understands === 'read') next.understands = 'Leia o texto acima e confirme quando estiver tudo claro.'
    setErrors(next)
    if (Object.keys(next).length) return

    recordEligibility({
      adult: answers.adult === 'yes',
      understands: true,
      language: answers.language!,
      adaptations,
      distress: answers.distress === 'yes',
    })
    if (answers.distress === 'yes') return setOutcome('safety')
    if (answers.adult === 'no') return setOutcome('minor')
    if (answers.language === 'no') return setOutcome('language')

    setPrefs({
      ...(adaptations.includes('larger-text') ? { fontScale: Math.max(prefs.fontScale, 1.3) } : {}),
      ...(adaptations.includes('contrast') ? { contrast: 'high' as const } : {}),
      ...(adaptations.includes('less-motion') ? { motion: 'reduce' as const } : {}),
      ...(adaptations.includes('confirm') ? { autoAdvance: false } : {}),
    })
    setBusy(true)
    const id = startSession(moduleId)
    const name = profile?.preferredName
    await crossThreshold(
      name ? `Respire fundo, ${name}. Não existem respostas certas ou erradas.` : 'Respire fundo. Não existem respostas certas ou erradas.',
      () => navigate(`/avaliacao/${id}`),
      reduced || adaptations.includes('less-motion'),
    )
  }

  return (
    <form onSubmit={submit} noValidate className="container-page grid max-w-4xl gap-12 pb-10">
      <PageHeader
        back={{ to: '/avaliacoes', label: 'Avaliações' }}
        title="Antes de começar."
        lead="Cinco perguntas rápidas para saber se esta é a hora certa e se você quer alguma adaptação. Não fazem parte do resultado."
        size="md"
      />

      <Surface tone="inset" className="grid gap-3 p-5 sm:p-6">
        <p className="font-semibold text-ink">
          {module.name} · {module.minutes[0]} a {module.minutes[1]} minutos
        </p>
        <p className="text-text-muted">{module.instructions}</p>
      </Surface>

      <ChoiceGroup
        legend="Você tem 18 anos ou mais?"
        name="adult"
        value={answers.adult}
        onChange={(v) => set('adult', v)}
        columns={2}
        error={errors.adult}
        options={[
          { value: 'yes', label: 'Sim' },
          { value: 'no', label: 'Não' },
        ]}
      />

      <div className="grid gap-4">
        <ChoiceGroup
          legend="Você entendeu que esta é uma triagem, e não um diagnóstico?"
          name="understands"
          value={answers.understands}
          onChange={(v) => set('understands', v)}
          columns={2}
          error={errors.understands}
          options={[
            { value: 'yes', label: 'Sim, entendi' },
            { value: 'read', label: 'Quero entender melhor' },
          ]}
        />
        {answers.understands === 'read' && (
          <Callout tone="info" title="Triagem organiza; diagnóstico conclui">
            Suas respostas viram indicadores por domínio que podem mostrar se vale investigar mais. Nenhum resultado aqui afirma que você é ou não é autista. Essa conclusão depende de avaliação com profissional habilitado, com sua história de vida, entrevista e observação.
          </Callout>
        )}
      </div>

      <ChoiceGroup
        legend="Você consegue ler e responder em português sem dificuldade?"
        name="language"
        value={answers.language}
        onChange={(v) => set('language', v)}
        columns={3}
        error={errors.language}
        options={[
          { value: 'fluent', label: 'Sim' },
          { value: 'some-difficulty', label: 'Com alguma dificuldade', description: 'Isso fica registrado como fator de contexto.' },
          { value: 'no', label: 'Não' },
        ]}
      />

      <fieldset className="grid gap-3">
        <legend className="mb-1 font-semibold text-ink">Quer alguma adaptação?</legend>
        <p className="-mt-2 text-sm text-text-subtle">Opcional. Você pode mudar isso depois em Ajustes de acessibilidade.</p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {ADAPTATIONS.map((a) => (
            <Checkbox
              key={a.id}
              tone="card"
              label={a.label}
              description={a.description}
              checked={adaptations.includes(a.id)}
              onChange={(e) => setAdaptations((list) => (e.target.checked ? [...list, a.id] : list.filter((x) => x !== a.id)))}
            />
          ))}
        </div>
        <p className="text-sm text-text-subtle">
          Instruções em áudio ainda não estão disponíveis porque não foram validadas. Leitores de tela funcionam em todas as telas.
        </p>
      </fieldset>

      <ChoiceGroup
        legend="Neste momento, você está em sofrimento intenso ou pensando em se machucar?"
        hint="Se a resposta for sim, a avaliação não começa e mostramos onde buscar apoio agora."
        name="distress"
        value={answers.distress}
        onChange={(v) => set('distress', v)}
        columns={2}
        error={errors.distress}
        options={[
          { value: 'no', label: 'Não' },
          { value: 'yes', label: 'Sim' },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" loading={busy}>
          Começar o módulo
        </Button>
        <Button to="/avaliacoes" variant="quiet" size="lg">
          Voltar
        </Button>
      </div>
    </form>
  )
}

function Outcome({ kind }: { kind: 'minor' | 'language' | 'safety' }) {
  const ref = useFocusOnMount<HTMLHeadingElement>()
  if (kind === 'safety') return <SafetyStop />
  return (
    <div className="container-page grid max-w-3xl gap-8 pb-10">
      <PageHeader
        ref={ref}
        size="md"
        title={kind === 'minor' ? 'Esta versão é para pessoas adultas.' : 'Por enquanto, o PERCEBER só está em português.'}
        lead={
          kind === 'minor'
            ? 'As perguntas e a interpretação foram pensadas para quem tem 18 anos ou mais. Se você tem dúvidas sobre suas características, converse com um adulto de confiança ou com um profissional de saúde.'
            : 'Responder em um idioma que não é confortável muda o resultado. Procure um profissional que atenda no seu idioma.'
        }
      />
      <div>
        <Button to="/" variant="secondary">
          Voltar ao início
        </Button>
      </div>
    </div>
  )
}

export function SafetyStop() {
  const ref = useFocusOnMount<HTMLHeadingElement>()
  return (
    <div className="container-page grid max-w-3xl gap-10 pb-10">
      <PageHeader ref={ref} size="md" title="Vamos pausar aqui." lead={CRISIS.intro} />
      <ul className="grid gap-3">
        {CRISIS.items.map((c) => (
          <li key={c.label} className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-surface p-5 ring-1 ring-line-strong">
            <span className="grid gap-1">
              <span className="font-semibold text-ink">{c.label}</span>
              <span className="text-text-muted">{c.action}</span>
            </span>
            {c.href && (
              <a href={c.href} className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 font-semibold text-on-accent no-underline hover:bg-accent-strong hover:text-on-accent">
                <Phone size={17} aria-hidden="true" />
                {c.cta}
              </a>
            )}
          </li>
        ))}
      </ul>
      <p className="text-text-muted">{CRISIS.outro}</p>
      <div className="flex flex-wrap gap-3">
        <Button to="/painel" variant="secondary">
          Ir para o painel
        </Button>
        <Button to="/ajuda" variant="quiet">
          Ajuda e acessibilidade
        </Button>
      </div>
    </div>
  )
}
