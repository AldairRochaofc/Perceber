import { CheckCircle2, CircleDashed, PlayCircle } from 'lucide-react'
import { DOMAIN_BY_ID } from '../../domain/domains'
import { remainingRange } from '../../domain/engine'
import { LIFECYCLE, MODULES, USAGE_LABEL } from '../../domain/modules'
import { REFERENCE_BY_ID, shortCitation } from '../../domain/references'
import type { AssessmentModule } from '../../domain/types'
import { fmtDateShort, plural } from '../../lib/format'
import { latestCompleted, mySessions, useStore, type State } from '../../state/store'
import { Button } from '../../ui/Button'
import { PageHeader } from '../../ui/PageHeader'
import { Badge, Meta, Surface } from '../../ui/Surface'
import { cx } from '../../ui/cx'

export function ModulesPage() {
  const state = useStore()
  return (
    <div className="container-page grid gap-12 pb-10">
      <PageHeader
        title="Avaliações."
        lead="Cada módulo informa o que mede, para quem foi pensado, quanto tempo leva e quais são seus limites. Todos estão em fase de pesquisa."
      />
      <div className="grid gap-6">
        {MODULES.map((m, i) => (
          <ModuleCard key={m.id} module={m} state={state} primary={i === 0} />
        ))}
      </div>
    </div>
  )
}

function ModuleCard({ module: m, state, primary }: { module: AssessmentModule; state: State; primary: boolean }) {
  const open = mySessions(state).find((s) => s.moduleId === m.id && s.status === 'in-progress')
  const last = latestCompleted(state, m.id)
  const remaining = open ? remainingRange(m.id, open.responses) : null
  const stage = LIFECYCLE.find((l) => l.id === m.lifecycle)?.label

  return (
    <Surface tone={primary ? 'feature' : 'panel'} as="article" className="grid gap-8 p-6 sm:p-9" aria-labelledby={`mod-${m.id}`}>
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-14">
        <div className="grid content-start gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{USAGE_LABEL[m.usageStatus]}</Badge>
            <Badge>Etapa: {stage}</Badge>
            <span className="label-data text-text-subtle">
              {m.code} v{m.version}
            </span>
          </div>
          <h2 id={`mod-${m.id}`} className={cx(primary ? 'text-display-md' : 'text-display-sm', 'font-light')}>
            {m.name}
          </h2>
          <p className="measure text-text-muted">{m.purpose}</p>
          <ul className="flex flex-wrap gap-2" aria-label="Domínios observados">
            {m.constructs.map((d) => (
              <li key={d} className="rounded-full bg-surface-sunken px-3 py-1 text-sm text-text-muted ring-1 ring-line">
                {DOMAIN_BY_ID[d].label}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {open ? (
              <>
                <Button to={`/avaliacao/${open.id}`} icon={<PlayCircle size={18} aria-hidden="true" />}>
                  Continuar de onde parei
                </Button>
                <span className="text-sm text-text-muted">
                  {plural(open.responses.length, 'resposta salva', 'respostas salvas')}, faltam {remaining![0] === remaining![1] ? remaining![0] : `${remaining![0]} a ${remaining![1]}`}
                </span>
              </>
            ) : (
              <Button to={`/antes-de-comecar?modulo=${m.id}`} variant={primary || !last ? 'primary' : 'secondary'}>
                {last ? 'Responder de novo' : 'Começar'}
              </Button>
            )}
            {last && (
              <Button to={`/resultado/${last.id}`} variant="quiet" icon={<CheckCircle2 size={18} aria-hidden="true" />}>
                Ver resultado de {fmtDateShort(last.completedAt!)}
              </Button>
            )}
          </div>
        </div>
        <dl className="grid content-start gap-5 rounded-lg bg-surface-sunken p-5 ring-1 ring-line sm:grid-cols-2 lg:grid-cols-1">
          <Meta label="Tempo estimado">
            {m.minutes[0] === m.minutes[1] ? m.minutes[0] : `${m.minutes[0]} a ${m.minutes[1]}`} minutos
          </Meta>
          <Meta label="Perguntas">{m.questions[0] === m.questions[1] ? m.questions[0] : `${m.questions[0]} a ${m.questions[1]}`}</Meta>
          <Meta label="Para quem">{m.population}</Meta>
          <Meta label="Salvar e retomar">{m.resumable ? 'Sim, sem prejuízo para o resultado' : 'Não'}</Meta>
        </dl>
      </div>

      <details className="group rounded-lg ring-1 ring-line [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-5 py-4 font-semibold text-ink hover:bg-surface-sunken">
          Ficha técnica do módulo
          <span aria-hidden="true" className="text-accent transition-transform duration-300 group-open:rotate-180">
            ▾
          </span>
        </summary>
        <div className="grid gap-8 border-t border-line px-5 py-6 md:grid-cols-2">
          <TechBlock title="Instruções de resposta">{m.instructions}</TechBlock>
          <TechBlock title="Como as perguntas são escolhidas">{m.administration}</TechBlock>
          <TechBlock title="Direitos de uso e reprodução">{m.rights}</TechBlock>
          <TechBlock title="Fontes conceituais">
            {m.sources.map((id) => REFERENCE_BY_ID[id]).filter(Boolean).map((r) => shortCitation(r!)).join('; ')}
          </TechBlock>
          <div className="grid content-start gap-2">
            <h3 className="font-sans text-sm font-semibold text-ink">Limitações conhecidas</h3>
            <ul className="grid gap-1.5 text-sm text-text-muted">
              {m.limitations.map((l) => (
                <li key={l} className="flex gap-2">
                  <span aria-hidden="true">·</span>
                  {l}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid content-start gap-2">
            <h3 className="font-sans text-sm font-semibold text-ink">Adaptações de acessibilidade</h3>
            <ul className="grid gap-1.5 text-sm text-text-muted">
              {m.accessibility.map((a) => (
                <li key={a.adaptation} className="flex items-start gap-2">
                  <CircleDashed size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-text-subtle" />
                  <span>
                    {a.adaptation} — <span className="font-semibold">{a.validated ? 'validada' : 'não validada'}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </details>
    </Surface>
  )
}

function TechBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid content-start gap-2">
      <h3 className="font-sans text-sm font-semibold text-ink">{title}</h3>
      <p className="text-sm leading-relaxed text-text-muted">{children}</p>
    </div>
  )
}
