import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, LifeBuoy, LogOut, Pause, Settings2 } from 'lucide-react'
import { DOMAIN_BY_ID } from '../../domain/domains'
import { itemOf, nextItem, remainingRange, sections, toMap } from '../../domain/engine'
import { SCALE, itemsFor } from '../../domain/items'
import { MODULE_BY_ID } from '../../domain/modules'
import type { AnswerValue, AssessmentSession, Item } from '../../domain/types'
import { A11yPanel } from '../../layout/A11yPanel'
import { crossThreshold } from '../../layout/curtainStore'
import { useReducedMotion } from '../../lib/motion'
import { navigate, type RouteMatch } from '../../lib/router'
import { answer, completeSession, sessionById, setContext, useStore } from '../../state/store'
import { Button, IconButton } from '../../ui/Button'
import { Dialog } from '../../ui/Dialog'
import { PageHeader } from '../../ui/PageHeader'
import { Spinner } from '../../ui/Spinner'
import { cx } from '../../ui/cx'
import { LogoMark } from '../../ui/Logo'
import { ContextStep } from './ContextStep'
import { CrisisList } from '../help/CrisisList'

export function AssessmentPage({ match }: { match: RouteMatch }) {
  const state = useStore()
  const session = sessionById(state, match.params.id ?? '')

  useEffect(() => {
    if (session?.status === 'completed') navigate(`/resultado/${session.id}`, { replace: true })
  }, [session?.status, session?.id])

  if (!session) {
    return (
      <div className="container-task grid gap-6 py-24">
        <PageHeader title="Não encontramos esta avaliação." lead="Ela pode ter sido excluída." size="md" />
        <div>
          <Button to="/avaliacoes">Ver avaliações</Button>
        </div>
      </div>
    )
  }
  if (session.status === 'completed') return null
  return <Runner key={session.id} session={session} />
}

function Runner({ session }: { session: AssessmentSession }) {
  const { prefs, profile } = useStore()
  const reduced = useReducedMotion()
  const module = MODULE_BY_ID[session.moduleId]
  const [cursor, setCursor] = useState<number | null>(null)
  const [phase, setPhase] = useState<'questions' | 'context' | 'processing'>('questions')
  const [pauseOpen, setPauseOpen] = useState(false)
  const [exitOpen, setExitOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [a11yOpen, setA11yOpen] = useState(false)
  const [pending, setPending] = useState<AnswerValue | null | undefined>(undefined)
  const shownAt = useRef(performance.now())
  const headingRef = useRef<HTMLHeadingElement>(null)
  const advanceTimer = useRef<number | null>(null)

  const responses = session.responses
  const viewingPast = cursor !== null && cursor < responses.length
  const item: Item | null = viewingPast ? itemOf(responses[cursor]!.itemId) : nextItem(session.moduleId, responses)
  const saved = viewingPast ? responses[cursor]!.value : undefined
  const selected = pending !== undefined ? pending : saved
  const position = viewingPast ? cursor : responses.length
  const secs = useMemo(() => sections(session.moduleId, responses), [session.moduleId, responses])
  const [minLeft, maxLeft] = remainingRange(session.moduleId, responses)
  const dialogOpen = pauseOpen || exitOpen || helpOpen || a11yOpen

  // ao trocar de pergunta: zera seleção pendente, marca o tempo e leva o foco ao enunciado
  useEffect(() => {
    setPending(undefined)
    shownAt.current = performance.now()
    headingRef.current?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [item?.id, position])

  useEffect(() => {
    if (cursor !== null && cursor >= responses.length) setCursor(null)
  }, [cursor, responses.length])

  useEffect(() => {
    if (phase === 'questions' && !item) setPhase('context')
  }, [item, phase])

  useEffect(() => () => {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current)
  }, [])

  const commit = useCallback(
    (value: AnswerValue | null) => {
      if (!item) return
      answer(session.id, item.id, value, performance.now() - shownAt.current)
      setCursor((c) => (c === null ? null : c + 1 < responses.length ? c + 1 : null))
    },
    [item, session.id, responses.length],
  )

  const choose = useCallback(
    (value: AnswerValue | null) => {
      setPending(value)
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current)
      if (prefs.autoAdvance) advanceTimer.current = window.setTimeout(() => commit(value), reduced ? 120 : 380)
    },
    [prefs.autoAdvance, commit, reduced],
  )

  const goBack = useCallback(() => {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current)
    setCursor((c) => {
      const from = c ?? responses.length
      return from > 0 ? from - 1 : c
    })
  }, [responses.length])

  // teclado: 1–5 escolhem, 0 pula, ← volta, Enter confirma
  useEffect(() => {
    if (phase !== 'questions' || dialogOpen) return
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('input, textarea, select, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return
      if (/^[1-5]$/.test(e.key)) {
        e.preventDefault()
        choose((Number(e.key) - 1) as AnswerValue)
      } else if (e.key === 'ArrowLeft' && position > 0) {
        e.preventDefault()
        goBack()
      } else if (e.key === 'Enter' && selected !== undefined && !target.closest('button, a')) {
        e.preventDefault()
        commit(selected)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, dialogOpen, choose, goBack, commit, selected, position])

  const finish = async () => {
    setPhase('processing')
    completeSession(session.id)
    if (!reduced) await new Promise((r) => setTimeout(r, 700))
    const name = profile?.preferredName
    await crossThreshold(name ? `Seu mapa está pronto, ${name}.` : 'Seu mapa está pronto.', () => navigate(`/resultado/${session.id}`), reduced)
  }

  const currentSection = item ? secs.find((s) => s.domain === item.domain) : null
  const sectionIndex = item ? module.constructs.indexOf(item.domain) : module.constructs.length
  const domainItems = item ? [...itemsFor(item.domain, 'core'), ...(currentSection?.followupsOpen ? itemsFor(item.domain, 'followup') : [])] : []
  const inSection = item ? domainItems.findIndex((i) => i.id === item.id) + 1 : 0
  const answers = toMap(responses)

  return (
    <div className="flex min-h-svh flex-col">
      {/* Barra superior calma: sair, módulo, pausa e ajustes */}
      <header className="no-print border-b border-line bg-surface/80 backdrop-blur">
        <div className="container-task flex h-16 items-center gap-2">
          <button
            type="button"
            onClick={() => setExitOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full pr-3 pl-2 text-sm font-semibold text-text-muted hover:bg-surface-tint hover:text-ink"
          >
            <LogOut size={17} aria-hidden="true" className="rotate-180" />
            Sair
          </button>
          <span className="mx-auto flex min-w-0 items-center gap-2 truncate text-sm text-text-muted">
            <LogoMark size={22} />
            <span className="truncate">{module.name}</span>
          </span>
          <IconButton label="Fazer uma pausa" onClick={() => setPauseOpen(true)}>
            <Pause size={19} aria-hidden="true" />
          </IconButton>
          <IconButton label="Ajustes de acessibilidade" onClick={() => setA11yOpen(true)}>
            <Settings2 size={19} aria-hidden="true" />
          </IconButton>
        </div>
      </header>

      {phase === 'questions' && item && (
        <>
          <ExplorationMap secs={secs} current={item.domain} index={sectionIndex} total={module.constructs.length} />
          <section className="container-task flex flex-1 flex-col py-8 sm:py-12" aria-labelledby="question">
            <div className="grid gap-3">
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-subtle">
                <span className="label-data">{DOMAIN_BY_ID[item.domain].code}</span>
                <span className="font-semibold text-text-muted">{DOMAIN_BY_ID[item.domain].label}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular">
                  Pergunta {inSection} de {domainItems.length} nesta seção
                </span>
                {item.tier === 'followup' && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-caption font-semibold text-accent-strong">aprofundamento</span>}
              </p>
              <h1 id="question" ref={headingRef} tabIndex={-1} data-page-title className="text-display-md font-light outline-none">
                {item.text}
              </h1>
              {item.example && <p className="text-text-muted">{item.example}</p>}
            </div>

            <fieldset className="mt-8 grid gap-2.5" aria-describedby="scale-hint">
              <legend className="sr-only">Com que frequência isso acontece com você?</legend>
              <p id="scale-hint" className="mb-1 text-sm text-text-subtle">
                Com que frequência isso acontece com você? Pense nos últimos seis meses.
              </p>
              {SCALE.map((opt) => {
                const checked = selected === opt.value
                return (
                  <label
                    key={opt.value}
                    className={cx(
                      'group relative flex min-h-14 cursor-pointer items-center gap-4 rounded-full px-5 py-3 ring-1 transition-[background-color,box-shadow,color] duration-200',
                      checked ? 'bg-accent text-on-accent shadow-glow ring-accent' : 'bg-surface text-ink ring-line-strong hover:ring-accent',
                      'has-[:focus-visible]:ring-[var(--focus-width)] has-[:focus-visible]:ring-focus has-[:focus-visible]:ring-offset-2',
                    )}
                  >
                    <input
                      type="radio"
                      name={`q-${item.id}`}
                      value={opt.value}
                      checked={checked}
                      onChange={() => choose(opt.value as AnswerValue)}
                      onClick={() => {
                        if (checked) choose(opt.value as AnswerValue)
                      }}
                      className="sr-only"
                    />
                    <span className={cx('grid h-7 w-7 shrink-0 place-items-center rounded-full text-caption font-bold tabular', checked ? 'bg-white/20 text-on-accent' : 'bg-surface-sunken text-text-muted')} aria-hidden="true">
                      {checked ? <Check size={15} strokeWidth={3} /> : opt.value + 1}
                    </span>
                    <span className="text-ui font-semibold">{opt.label}</span>
                  </label>
                )
              })}
              <button
                type="button"
                onClick={() => choose(null)}
                aria-pressed={selected === null}
                className={cx(
                  'mt-1 w-fit rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                  selected === null ? 'bg-surface-sunken text-ink ring-1 ring-control' : 'text-text-muted hover:bg-surface-tint hover:text-ink',
                )}
              >
                Prefiro não responder
              </button>
            </fieldset>

            <div className="mt-auto grid gap-5 pt-10">
              <div className="flex items-center justify-between gap-3">
                <Button variant="quiet" onClick={goBack} disabled={position === 0} icon={<ArrowLeft size={18} aria-hidden="true" />}>
                  Anterior
                </Button>
                {(!prefs.autoAdvance || viewingPast) && (
                  <Button onClick={() => selected !== undefined && commit(selected)} disabled={selected === undefined}>
                    {viewingPast ? 'Salvar e seguir' : 'Próxima'}
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-line pt-5 text-sm text-text-subtle">
                <p className="max-w-md">
                  {minLeft === maxLeft ? `Faltam ${minLeft} perguntas.` : `Faltam entre ${minLeft} e ${maxLeft} perguntas.`} O número varia conforme suas respostas.
                  <span className="hidden sm:inline"> Teclas 1 a 5 escolhem; seta para a esquerda volta.</span>
                </p>
                <button type="button" onClick={() => setHelpOpen(true)} className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-semibold text-accent hover:text-accent-strong">
                  <LifeBuoy size={16} aria-hidden="true" />
                  Precisa de ajuda agora?
                </button>
              </div>
            </div>
          </section>
          <p className="sr-only" aria-live="polite">
            {answers.has(item.id) ? 'Resposta salva.' : ''}
          </p>
        </>
      )}

      {phase === 'context' && (
        <ContextStep
          session={session}
          onBack={() => {
            setPhase('questions')
            setCursor(Math.max(0, responses.length - 1))
          }}
          onSubmit={(ctx) => {
            setContext(session.id, ctx)
            void finish()
          }}
        />
      )}

      {phase === 'processing' && (
        <div className="container-task grid flex-1 place-items-center py-24">
          <div className="grid justify-items-center gap-4 text-center">
            <Spinner size={28} />
            <p className="font-display text-title" role="status">
              Organizando suas respostas por domínio
            </p>
          </div>
        </div>
      )}

      <PauseDialog open={pauseOpen} onClose={() => setPauseOpen(false)} reduced={reduced} />
      <Dialog
        open={exitOpen}
        onClose={() => setExitOpen(false)}
        size="sm"
        title="Sair e continuar depois?"
        description="Suas respostas até aqui estão salvas neste navegador. Você continua de onde parou em Avaliações."
        actions={
          <>
            <Button variant="secondary" onClick={() => setExitOpen(false)}>
              Continuar respondendo
            </Button>
            <Button to="/avaliacoes">Sair</Button>
          </>
        }
      />
      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} title="Se você está em sofrimento agora" description="Você pode parar a qualquer momento. Suas respostas ficam salvas.">
        <CrisisList />
      </Dialog>
      <A11yPanel open={a11yOpen} onClose={() => setA11yOpen(false)} />
    </div>
  )
}

/** Mapa de exploração: seções do módulo, sem porcentagem e sem contagem regressiva. */
function ExplorationMap({ secs, current, index, total }: { secs: ReturnType<typeof sections>; current: string; index: number; total: number }) {
  return (
    <nav aria-label="Mapa de exploração" className="no-print border-b border-line bg-surface/60">
      <div className="container-task py-4">
        <p className="mb-3 text-sm text-text-muted">
          <span className="font-semibold text-ink">Seção {index + 1} de {total}</span>
          <span className="sr-only">. Seções concluídas: {secs.filter((s) => s.state === 'done').length}.</span>
        </p>
        <ol className="grid grid-flow-col gap-1.5" style={{ gridTemplateColumns: `repeat(${secs.length}, minmax(0, 1fr))` }}>
          {secs.map((s) => {
            const d = DOMAIN_BY_ID[s.domain]
            const here = s.domain === current
            return (
              <li key={s.domain} className="grid gap-1.5" aria-current={here ? 'step' : undefined}>
                <span
                  aria-hidden="true"
                  className={cx(
                    'h-1.5 rounded-full transition-colors duration-300',
                    s.state === 'done' ? 'bg-accent' : here ? 'bg-accent/45' : 'bg-surface-sunken ring-1 ring-line',
                  )}
                />
                <span className={cx('hidden truncate text-caption md:block', here ? 'font-semibold text-ink' : s.state === 'done' ? 'text-text-muted' : 'text-text-subtle')}>
                  {d.short}
                  <span className="sr-only">{s.state === 'done' ? ' — concluída' : here ? ' — atual' : ' — a seguir'}</span>
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}

function PauseDialog({ open, onClose, reduced }: { open: boolean; onClose: () => void; reduced: boolean }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Uma pausa, no seu tempo"
      description="Suas respostas estão guardadas. Volte quando se sentir pronto(a). Não há pressa."
      actions={<Button onClick={onClose}>Voltar às perguntas</Button>}
    >
      <div className="grid justify-items-center gap-5 py-4">
        <div aria-hidden="true" className="relative grid h-40 w-40 place-items-center">
          <span className="absolute inset-0 rounded-full bg-accent-soft" />
          <span className={cx('absolute inset-4 rounded-full bg-accent/25', !reduced && 'animate-[breathe_10s_ease-in-out_infinite]')} />
          <span className="relative h-10 w-10 rounded-full bg-accent" />
        </div>
        <p className="text-center text-text-muted">
          {reduced ? 'Inspire contando até quatro. Solte o ar contando até seis.' : 'Inspire enquanto o círculo cresce. Solte o ar enquanto ele diminui.'}
        </p>
      </div>
    </Dialog>
  )
}
