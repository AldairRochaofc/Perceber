import { useState } from 'react'
import { Clock, EyeOff, FileLock2, History, ListChecks, PauseCircle, ShieldCheck, Trash2 } from 'lucide-react'
import { DOMAINS, GROUP_DESCRIPTION, GROUP_LABEL } from '../../domain/domains'
import { CRISIS, DISCLAIMER, FAQ, TIME_STEPS } from '../../domain/content'
import { MODULE_BY_ID } from '../../domain/modules'
import { REFERENCE_BY_ID, shortCitation } from '../../domain/references'
import { CANNOT_SUPPORT, CAN_SUPPORT } from '../../domain/signals'
import type { DomainGroup, DomainId } from '../../domain/types'
import { navigate } from '../../lib/router'
import { switchRole, useStore } from '../../state/store'
import { Button } from '../../ui/Button'
import { Disclosure } from '../../ui/Disclosure'
import { Surface } from '../../ui/Surface'
import { cx } from '../../ui/cx'
import { HeroMap } from './HeroMap'

export function LandingPage() {
  const { profile } = useStore()
  const central = MODULE_BY_ID.central
  const startTo = profile ? '/avaliacoes' : '/comecar'

  return (
    <>
      {/* ───────── Abertura ───────── */}
      <section className="relative isolate overflow-hidden pb-16 lg:pb-24" aria-labelledby="hero-title">
        <div aria-hidden="true" className="dot-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_70%_30%,#000_20%,transparent_70%)]" />
        <div className="container-page grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
          <div className="grid gap-8">
            <p className="inline-flex w-fit items-center gap-2 rounded-full bg-surface px-3.5 py-1.5 text-sm font-semibold text-accent-strong shadow-soft ring-1 ring-accent-line">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
              Triagem orientativa, não diagnóstica
            </p>
            <h1 id="hero-title" data-page-title tabIndex={-1} className="text-display-xl font-light outline-none">
              Entenda melhor o <em className="font-normal text-accent">seu perfil.</em>
            </h1>
            <p className="measure text-lead text-text-muted">
              Perguntas sobre como você percebe o mundo e as pessoas, organizadas em um mapa por domínio, para ajudar você a decidir se uma avaliação profissional pode ser importante.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button to={startTo} size="lg">
                {profile ? 'Ir para as avaliações' : 'Começar avaliação'}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                Como funciona
              </Button>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2.5 text-sm text-text-muted">
              <li className="inline-flex items-center gap-2">
                <Clock size={16} aria-hidden="true" className="text-accent" />
                {central.minutes[0]} a {central.minutes[1]} minutos
              </li>
              <li className="inline-flex items-center gap-2">
                <ListChecks size={16} aria-hidden="true" className="text-accent" />
                {central.questions[0]} a {central.questions[1]} perguntas
              </li>
              <li className="inline-flex items-center gap-2">
                <PauseCircle size={16} aria-hidden="true" className="text-accent" />
                Pause e continue depois
              </li>
            </ul>
            <p className="measure border-l-2 border-accent pl-4 text-sm font-medium text-ink">{DISCLAIMER}</p>
          </div>
          <div className="relative mx-auto w-full max-w-[40rem]">
            <div aria-hidden="true" className="pointer-events-none absolute inset-[-8%] -z-10 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-accent)_13%,transparent),transparent)]" />
            <HeroMap />
          </div>
        </div>
      </section>

      {/* ───────── Como funciona ───────── */}
      <section id="como-funciona" tabIndex={-1} className="section-space scroll-mt-28 outline-none" aria-labelledby="como-title">
        <div className="container-page grid gap-14">
          <div className="grid max-w-3xl gap-4">
            <h2 id="como-title" className="text-display-lg font-light">
              Um questionário que escuta antes de perguntar.
            </h2>
            <p className="measure text-lead text-text-muted">
              Todo mundo responde ao mesmo núcleo. Só onde suas respostas mostram frequência aparecem perguntas de aprofundamento, com a mesma regra para todas as pessoas.
            </p>
          </div>
          <div className="relative">
          <div aria-hidden="true" className="absolute top-7 right-[16%] left-[16%] hidden h-px bg-line-strong md:block" />
          <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
            {[
              { title: 'Você responde', body: 'Uma frase por vez, com cinco opções de frequência, de “Nunca” a “Quase sempre”. Dá para pular, voltar e pausar.', art: <StepAnswer /> },
              { title: 'O sistema aprofunda', body: 'Três perguntas por domínio. Se a média delas chega a “Às vezes”, entram até duas perguntas a mais. Sem sinal, o domínio fecha.', art: <StepBranch /> },
              { title: 'Você recebe um mapa', body: 'Indicadores separados por domínio, com limites, incertezas e um relatório para levar a um profissional, se quiser.', art: <StepMap /> },
            ].map((s, i) => (
              <li key={s.title} className="relative grid content-start gap-5">
                <div className="flex items-center gap-4">
                  <span className="relative z-10 grid h-14 w-14 place-items-center rounded-full bg-surface font-display text-title text-accent-strong shadow-soft ring-1 ring-line">
                    {i + 1}
                  </span>
                  <h3 className="text-display-sm">{s.title}</h3>
                </div>
                <div className="rounded-lg bg-surface-sunken p-5 ring-1 ring-line">{s.art}</div>
                <p className="text-text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
          </div>
        </div>
      </section>

      {/* ───────── Tempo e quem vê ───────── */}
      <section className="border-y border-line bg-surface" aria-labelledby="tempo-title">
        <div className="container-page grid gap-14 py-20 md:grid-cols-2 md:gap-20 md:py-28">
          <div className="grid content-start gap-6">
            <h2 id="tempo-title" className="text-display-md font-light">
              Quanto tempo leva.
            </h2>
            <dl className="grid">
              {TIME_STEPS.map((s) => (
                <div key={s.step} className="flex items-baseline justify-between gap-6 border-b border-line py-4">
                  <dt className="text-ink">{s.step}</dt>
                  <dd className="text-sm whitespace-nowrap text-text-muted tabular">{s.time}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-text-subtle">Sem cronômetro. Suas respostas ficam salvas se você precisar parar.</p>
          </div>
          <div className="grid content-start gap-6">
            <h2 className="text-display-md font-light">Quem vê suas respostas.</h2>
            <ul className="grid gap-5">
              {[
                { icon: <EyeOff size={20} aria-hidden="true" />, title: 'Só você, por padrão', body: 'Nenhum profissional recebe nada automaticamente.' },
                { icon: <FileLock2 size={20} aria-hidden="true" />, title: 'Profissionais, se você liberar', body: 'Com código de acesso, o conteúdo que você escolher e prazo para acabar.' },
                { icon: <ShieldCheck size={20} aria-hidden="true" />, title: 'Pesquisa, se você autorizar', body: 'Separada da sua identidade e só depois de aprovação por comitê de ética.' },
              ].map((p) => (
                <li key={p.title} className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-accent-soft text-accent">{p.icon}</span>
                  <span className="grid gap-1">
                    <span className="font-semibold text-ink">{p.title}</span>
                    <span className="text-text-muted">{p.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ───────── Domínios ───────── */}
      <DomainExplorer />

      {/* ───────── O que faz e não faz ───────── */}
      <section className="pb-[var(--section-space)]" aria-labelledby="limites-title">
        <div className="container-page grid gap-12">
          <h2 id="limites-title" className="max-w-3xl text-display-lg font-light">
            O que esta plataforma não faz, e o que ela faz.
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Surface tone="feature" className="grid content-start gap-5 p-7 sm:p-9">
              <h3 className="text-display-sm">Não faz</h3>
              <ul className="grid gap-3">
                {CANNOT_SUPPORT.map((t) => (
                  <li key={t} className="flex gap-3 text-text-muted">
                    <span aria-hidden="true" className="mt-2.5 h-px w-4 shrink-0 bg-text-subtle" />
                    {t}
                  </li>
                ))}
              </ul>
            </Surface>
            <Surface tone="deep" className="grid content-start gap-5 p-7 sm:p-9">
              <h3 className="text-display-sm text-on-deep">Faz</h3>
              <ul className="grid gap-3">
                {CAN_SUPPORT.map((t) => (
                  <li key={t} className="flex gap-3 text-on-deep-muted">
                    <span aria-hidden="true" className="mt-2.5 h-px w-4 shrink-0 bg-accent-on-deep" />
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm text-on-deep-subtle">Diagnóstico é ato de profissional habilitado, com história de vida, entrevista e observação.</p>
            </Surface>
          </div>
        </div>
      </section>

      {/* ───────── Privacidade ───────── */}
      <section className="border-y border-line bg-surface" aria-labelledby="privacidade-title">
        <div className="container-page grid gap-12 py-20 md:py-28 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="grid content-start gap-4">
            <h2 id="privacidade-title" className="text-display-lg font-light">
              Os dados da triagem são seus.
            </h2>
            <p className="text-lead text-text-muted">Separados por finalidade. Nada sai daqui sem que você decida.</p>
            <p className="text-sm text-text-subtle">Nesta demonstração, tudo fica apenas no seu navegador.</p>
          </div>
          <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {[
              { icon: <FileLock2 size={20} aria-hidden="true" />, title: 'Consentimentos separados', body: 'Um para cada finalidade, com data, versão e o texto exato que você leu.' },
              { icon: <ShieldCheck size={20} aria-hidden="true" />, title: 'Compartilhamento com prazo', body: 'Você escolhe quem, o quê e até quando. E pode revogar a qualquer momento.' },
              { icon: <History size={20} aria-hidden="true" />, title: 'Registro de acessos', body: 'Cada abertura do seu relatório fica registrada com data e hora, visível para você.' },
              { icon: <Trash2 size={20} aria-hidden="true" />, title: 'Exportar e excluir', body: 'Baixe seus dados ou apague uma avaliação, ou tudo, quando quiser.' },
            ].map((p) => (
              <li key={p.title} className="grid content-start gap-2 border-t border-line pt-5">
                <span className="text-accent">{p.icon}</span>
                <span className="font-semibold text-ink">{p.title}</span>
                <span className="text-text-muted">{p.body}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────── Perguntas frequentes ───────── */}
      <section className="section-space" aria-labelledby="faq-title">
        <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div className="grid content-start gap-4">
            <h2 id="faq-title" className="text-display-lg font-light">
              Perguntas frequentes.
            </h2>
            <p className="text-text-muted">
              Outras respostas, glossário e ajustes de acessibilidade estão em <a href="#/ajuda">Ajuda</a>.
            </p>
          </div>
          <div className="border-t border-line">
            {FAQ.slice(0, 6).map((f) => (
              <Disclosure key={f.q} summary={f.q}>
                {f.a}
              </Disclosure>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Ajuda imediata ───────── */}
      <section className="container-page" aria-labelledby="agora-title">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-lg bg-surface-sunken px-6 py-6 ring-1 ring-line sm:px-8">
          <div className="grid gap-1">
            <h2 id="agora-title" className="font-display text-title">
              {CRISIS.title}
            </h2>
            <p className="text-text-muted">CVV: ligue 188, gratuito, 24 horas. Risco imediato: ligue 192 (SAMU).</p>
          </div>
          <Button to="/ajuda?secao=agora" variant="secondary">
            Ver onde buscar ajuda
          </Button>
        </div>
      </section>

      {/* ───────── Chamada final ───────── */}
      <section className="container-page mt-16" aria-labelledby="cta-title">
        <Surface tone="deep" className="relative grid gap-8 px-7 py-14 sm:px-14 sm:py-20 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -bottom-40 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgb(122_162_255/0.28),transparent_62%)]" />
          <div className="relative grid gap-4">
            <h2 id="cta-title" className="text-display-lg font-light text-on-deep">
              Comece quando se sentir pronto(a).
            </h2>
            <p className="measure text-lead text-on-deep-muted">Você pode pausar, corrigir respostas e sair a qualquer momento. Nada é compartilhado sem a sua decisão.</p>
          </div>
          <div className="relative flex flex-wrap gap-3 lg:justify-end">
            <Button to={startTo} variant="on-deep" size="lg">
              Começar avaliação
            </Button>
            <button
              type="button"
              onClick={() => {
                switchRole('professional')
                navigate('/portal')
              }}
              className="inline-flex h-14 items-center rounded-full px-6 font-semibold text-on-deep ring-1 ring-on-deep-line transition-colors hover:bg-white/10"
            >
              Sou profissional
            </button>
          </div>
        </Surface>
      </section>
    </>
  )
}

function DomainExplorer() {
  const [group, setGroup] = useState<DomainGroup>('central')
  const list = DOMAINS.filter((d) => d.group === group)
  const [selected, setSelected] = useState<DomainId>('social')
  const current = DOMAINS.find((d) => d.id === selected && d.group === group) ?? list[0]!

  return (
    <section className="section-space" aria-labelledby="dominios-title">
      <div className="container-page grid gap-12">
        <div className="grid max-w-3xl gap-4">
          <h2 id="dominios-title" className="text-display-lg font-light">
            Treze domínios, cada um com seu próprio indicador.
          </h2>
          <p className="measure text-lead text-text-muted">
            Seis formam o eixo central investigado. Dois dão contexto. Cinco são áreas que aparecem junto com frequência. Eles nunca se somam em uma nota única.
          </p>
        </div>
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div className="grid content-start gap-6">
            <div role="radiogroup" aria-label="Grupo de domínios" className="inline-flex w-fit flex-wrap gap-1 rounded-full bg-surface-sunken p-1 ring-1 ring-line">
              {(['central', 'context', 'cooccurring'] as DomainGroup[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  role="radio"
                  aria-checked={group === g}
                  onClick={() => {
                    setGroup(g)
                    setSelected(DOMAINS.find((d) => d.group === g)!.id)
                  }}
                  className={cx('h-10 rounded-full px-4 text-sm font-semibold transition-colors', group === g ? 'bg-surface text-ink shadow-soft' : 'text-text-muted hover:text-ink')}
                >
                  {GROUP_LABEL[g]}
                </button>
              ))}
            </div>
            <p className="text-sm text-text-subtle">{GROUP_DESCRIPTION[group]}</p>
            <ul className="grid">
              {list.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    aria-pressed={current.id === d.id}
                    onClick={() => setSelected(d.id)}
                    className={cx(
                      'flex w-full items-baseline gap-4 border-b border-line py-3.5 text-left transition-colors',
                      current.id === d.id ? 'text-accent-strong' : 'text-ink hover:text-accent-strong',
                    )}
                  >
                    <span className="label-data w-10 shrink-0 text-text-subtle">{d.code}</span>
                    <span className="min-w-0 font-display text-display-sm font-light hyphens-auto [overflow-wrap:anywhere]">{d.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <Surface tone="feature" className="grid content-start gap-6 p-7 sm:p-10" aria-live="polite">
            <div className="grid gap-2">
              <span className="label-data text-text-subtle">
                {current.code} · {GROUP_LABEL[current.group]}
              </span>
              <h3 className="text-display-md font-light">{current.label}</h3>
            </div>
            <p className="text-lead text-ink">{current.observes}</p>
            <div className="grid gap-2">
              <p className="text-sm font-semibold text-ink">Outras explicações possíveis para relatos frequentes</p>
              <ul className="flex flex-wrap gap-2">
                {current.alternatives.map((a) => (
                  <li key={a} className="rounded-full bg-surface-sunken px-3 py-1 text-sm text-text-muted ring-1 ring-line">
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            <p className="rounded-md bg-surface-sunken p-4 text-sm text-text-muted">
              <strong className="text-ink">Limites deste indicador.</strong> {current.limits}
            </p>
            <p className="text-sm text-text-subtle">
              Bases conceituais: {current.basis.map((id) => REFERENCE_BY_ID[id]).filter(Boolean).map((r) => shortCitation(r!)).join('; ')}
            </p>
          </Surface>
        </div>
      </div>
    </section>
  )
}

/* Pequenos diagramas dos passos: desenho técnico, sem ilustração figurativa. */
function StepAnswer() {
  const labels = ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Quase sempre']
  return (
    <div aria-hidden="true" className="grid gap-1.5">
      {labels.map((l, i) => (
        <span key={l} className={cx('flex h-7 items-center rounded-full px-3 text-caption font-semibold', i === 3 ? 'bg-accent text-on-accent' : 'bg-surface text-text-subtle ring-1 ring-line')}>
          {l}
        </span>
      ))}
    </div>
  )
}

function StepBranch() {
  return (
    <svg aria-hidden="true" viewBox="0 0 240 150" className="h-auto w-full">
      <g style={{ stroke: 'var(--color-line-strong)' }} strokeWidth="1.5" fill="none">
        <path d="M30 75H90" />
        <path d="M90 75C120 75 120 40 150 40H200" style={{ stroke: 'var(--color-accent)' }} />
        <path d="M90 75C120 75 120 110 150 110H200" strokeDasharray="4 4" />
      </g>
      {[30, 60, 90].map((x) => (
        <circle key={x} cx={x} cy={75} r={8} style={{ fill: 'var(--color-accent)' }} />
      ))}
      {[170, 200].map((x) => (
        <circle key={x} cx={x} cy={40} r={8} style={{ fill: 'var(--color-surface)', stroke: 'var(--color-accent)' }} strokeWidth="2" />
      ))}
      <text x="30" y="108" style={{ fill: 'var(--color-text-subtle)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>núcleo</text>
      <text x="150" y="24" style={{ fill: 'var(--color-text-subtle)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>aprofundamento</text>
      <text x="150" y="132" style={{ fill: 'var(--color-text-subtle)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>domínio fecha</text>
    </svg>
  )
}

function StepMap() {
  return (
    <svg aria-hidden="true" viewBox="0 0 240 150" className="h-auto w-full">
      {[0, 1, 2, 3, 4].map((i) => (
        <ellipse key={i} cx={120 + i * 3} cy={78 - i * 2} rx={100 - i * 19} ry={60 - i * 11} fill="none" style={{ stroke: 'var(--color-accent)' }} strokeOpacity={0.2 + i * 0.15} />
      ))}
      {[
        [48, 60],
        [92, 34],
        [168, 46],
        [196, 96],
        [140, 120],
        [70, 112],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={4.5} style={{ fill: 'var(--color-accent)' }} />
      ))}
    </svg>
  )
}
