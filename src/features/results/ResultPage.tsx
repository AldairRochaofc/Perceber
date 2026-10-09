import { useState } from 'react'
import { FileText, Share2, Layers, RotateCcw } from 'lucide-react'
import { DOMAIN_BY_ID } from '../../domain/domains'
import { MODULE_BY_ID } from '../../domain/modules'
import { CANNOT_SUPPORT, CAN_SUPPORT, NEXT_STEP, SIGNALS } from '../../domain/signals'
import { COMPLEXITY_LABEL, RELIABILITY_LABEL, fmtSeconds, sessionReliability } from '../../domain/timing'
import type { AssessmentSession } from '../../domain/types'
import { fmtDateTime } from '../../lib/format'
import { navigate } from '../../lib/router'
import type { RouteMatch } from '../../lib/router'
import { latestCompleted, sessionById, startOver, useStore } from '../../state/store'
import { Button } from '../../ui/Button'
import { Dialog } from '../../ui/Dialog'
import { DomainList } from '../../ui/DomainList'
import { PageHeader, SectionTitle } from '../../ui/PageHeader'
import { PatternSwatch } from '../../ui/patterns'
import { SignalMeter } from '../../ui/SignalMeter'
import { Callout, Meta, Surface } from '../../ui/Surface'
import { Table, td, th } from '../../ui/Table'
import { ContextFactorsPanel, HowWeCalculated, QualityPanel, UncertaintyPanel } from './Explain'
import { PerceptionMap } from './PerceptionMap'
import { ResultCharts } from './ResultCharts'

export function ResultPage({ match }: { match: RouteMatch }) {
  const state = useStore()
  const session = sessionById(state, match.params.id ?? '')
  const result = session?.result
  const [restartOpen, setRestartOpen] = useState(false)

  if (!session || !result) {
    return (
      <div className="container-page grid max-w-3xl gap-6 pb-10">
        <PageHeader title="Este resultado não está disponível." lead="A avaliação pode estar em andamento ou ter sido excluída." size="md" />
        <div>
          <Button to="/painel">Ir para o painel</Button>
        </div>
      </div>
    )
  }

  const module = MODULE_BY_ID[session.moduleId]
  const isCentral = session.moduleId === 'central'
  const mapScores = result.domains.filter((d) => (isCentral ? DOMAIN_BY_ID[d.domain].group === 'central' : true))
  const centralScores = result.domains.filter((d) => DOMAIN_BY_ID[d.domain].group === 'central')
  const contextScores = result.domains.filter((d) => DOMAIN_BY_ID[d.domain].group === 'context')
  const signal = result.signal ? SIGNALS[result.signal] : null
  const hasCooccurring = !!latestCompleted(state, 'cooccurring')
  const mood = result.domains.find((d) => d.domain === 'mood')

  return (
    <div className="container-page grid gap-16 pb-10">
      <PageHeader
        back={{ to: '/painel', label: 'Painel' }}
        title={isCentral ? 'O que suas respostas mostram.' : 'Suas áreas coocorrentes.'}
        lead={
          isCentral
            ? 'Um retrato do que você relatou hoje, organizado por domínio. Não é diagnóstico e não compara você com outras pessoas.'
            : 'Cada área tem indicador próprio. Elas não se somam entre si nem ao eixo central.'
        }
        meta={
          <dl className="flex flex-wrap gap-x-8 gap-y-3">
            <Meta label="Concluída em">{fmtDateTime(session.completedAt!)}</Meta>
            <Meta label="Módulo">
              {module.name} <span className="label-data font-normal text-text-subtle">v{module.version}</span>
            </Meta>
            <Meta label="Status do módulo">Pesquisa, sem validação psicométrica</Meta>
          </dl>
        }
      />

      {/* ───────── Mapa + sinal ───────── */}
      <Surface tone="feature" as="section" aria-labelledby="sinal-title" className="grid gap-0 lg:grid-cols-[1.15fr_1fr]">
        <div className="relative border-b border-line bg-surface-sunken/50 p-4 sm:p-8 lg:border-r lg:border-b-0">
          <PerceptionMap scores={mapScores} />
          <p className="mt-2 text-center text-sm text-text-subtle">
            Altura do relevo = média das respostas no domínio, de 0 a 4. Os números estão na lista abaixo.
          </p>
        </div>
        <div className="grid content-center gap-7 p-6 sm:p-10">
          {signal ? (
            <>
              <div className="grid gap-4">
                <p className="text-sm font-semibold text-text-muted" id="sinal-title">
                  Sinal de triagem
                </p>
                <div className="flex items-center gap-4">
                  <PatternSwatch pattern={signal.pattern} color={signal.colorVar} size={52} />
                  <p className="font-display text-display-sm" style={{ color: signal.textVar }}>
                    {signal.label}
                  </p>
                </div>
                <SignalMeter level={result.signal!} />
              </div>
              <p className="text-lead text-ink">{signal.summary}</p>
              <p className="text-text-muted">{signal.tone}</p>
              <p className="rounded-md bg-surface-sunken px-4 py-3 text-sm text-text-muted">
                {result.signal === 'insufficient'
                  ? 'O sinal só é calculado quando cada domínio central tem ao menos 2 respostas.'
                  : `${result.frequentCentral} de 6 domínios do eixo central com média de 2,5 ou mais (perto de “Frequentemente”).`}
              </p>
            </>
          ) : (
            <div className="grid gap-4">
              <h2 id="sinal-title" className="text-display-sm">
                Sem nota única, de propósito.
              </h2>
              <p className="text-text-muted">
                Funções executivas, atenção, ansiedade, humor e sono mudam a leitura do eixo central, mas aparecem em muitas condições. Por isso cada área é mostrada separadamente.
              </p>
            </div>
          )}
        </div>
      </Surface>

      {mood && mood.mean !== null && mood.mean >= 2.5 && (
        <Callout
          tone="safety"
          title="Se você tem se sentido assim, conversar com alguém pode ajudar"
          action={
            <Button to="/ajuda?secao=agora" variant="secondary" size="sm">
              Ver onde buscar apoio
            </Button>
          }
        >
          Tristeza persistente e esgotamento merecem atenção por si só, com ou sem outras características. Isto não é uma avaliação de risco.
        </Callout>
      )}

      {/* ───────── Gráficos ───────── */}
      <ResultCharts result={result} />

      {/* ───────── Pode e não pode ───────── */}
      <section aria-labelledby="apoia-title" className="grid gap-6">
        <SectionTitle id="apoia-title" title="O que este resultado pode e não pode apoiar" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="grid content-start gap-3 rounded-lg bg-surface p-6 ring-1 ring-line">
            <h3 className="font-sans text-ui font-semibold">Pode apoiar</h3>
            <ul className="grid gap-2 text-text-muted">
              {CAN_SUPPORT.map((t) => (
                <li key={t} className="flex gap-3">
                  <span aria-hidden="true" className="mt-2.5 h-px w-3 shrink-0 bg-accent" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid content-start gap-3 rounded-lg bg-surface p-6 ring-1 ring-line">
            <h3 className="font-sans text-ui font-semibold">Não pode apoiar</h3>
            <ul className="grid gap-2 text-text-muted">
              {CANNOT_SUPPORT.map((t) => (
                <li key={t} className="flex gap-3">
                  <span aria-hidden="true" className="mt-2.5 h-px w-3 shrink-0 bg-text-subtle" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ───────── Domínios ───────── */}
      <section aria-labelledby="dominios-title" className="grid gap-6">
        <SectionTitle
          id="dominios-title"
          title={isCentral ? 'Eixo central, domínio por domínio' : 'Área por área'}
          lead="Cada ponto é uma resposta. O traço escuro é a média. A linha fina vai da menor à maior resposta."
        />
        <DomainList scores={isCentral ? centralScores : result.domains} />
      </section>

      {isCentral && contextScores.length > 0 && (
        <section aria-labelledby="contexto-title" className="grid gap-6">
          <SectionTitle
            id="contexto-title"
            title="Contexto: camuflagem e impacto"
            lead="Não entram na contagem do sinal. A camuflagem pode esconder características; o impacto ajuda a pensar se vale procurar apoio."
          />
          <DomainList scores={contextScores} />
        </section>
      )}

      {/* ───────── Qualidade e incerteza ───────── */}
      <section aria-labelledby="incerteza-title" className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="grid content-start gap-6">
          <SectionTitle id="incerteza-title" title="Limites e incertezas" />
          <UncertaintyPanel />
        </div>
        <div className="grid content-start gap-6">
          <h2 className="text-display-sm">Respostas e qualidade</h2>
          <QualityPanel result={result} />
        </div>
      </section>

      <TimeReliability session={session} />

      <section aria-labelledby="fatores-title" className="grid gap-5">
        <SectionTitle id="fatores-title" title="Fatores de contexto que você informou" lead="Podem ter influenciado as respostas de hoje." />
        <ContextFactorsPanel session={session} />
      </section>

      <HowWeCalculated result={result} />

      {/* ───────── Próximo passo ───────── */}
      <Surface tone="deep" as="section" aria-labelledby="proximo-title" className="grid gap-8 p-7 sm:p-12 lg:grid-cols-[1.3fr_1fr] lg:items-end">
        <div className="grid gap-4">
          <h2 id="proximo-title" className="text-display-md font-light text-on-deep">
            Próximo passo, se fizer sentido para você.
          </h2>
          <p className="measure text-on-deep-muted">{NEXT_STEP}</p>
        </div>
        <div className="flex flex-wrap gap-3 lg:justify-end">
          <Button to={`/relatorio/${session.id}`} variant="on-deep" icon={<FileText size={18} aria-hidden="true" />}>
            Abrir relatório
          </Button>
          <Button to={`/compartilhar?avaliacao=${session.id}`} variant="secondary" icon={<Share2 size={18} aria-hidden="true" />}>
            Compartilhar
          </Button>
          {isCentral && !hasCooccurring && (
            <Button to="/antes-de-comecar?modulo=cooccurring" variant="secondary" icon={<Layers size={18} aria-hidden="true" />}>
              Responder áreas coocorrentes
            </Button>
          )}
          <Button variant="secondary" onClick={() => setRestartOpen(true)} icon={<RotateCcw size={18} aria-hidden="true" />}>
            Refazer o teste
          </Button>
        </div>
      </Surface>

      <Dialog
        open={restartOpen}
        onClose={() => setRestartOpen(false)}
        size="sm"
        title="Começar um teste do zero?"
        description="O teste recomeça como para alguém que nunca usou o PERCEBER: consentimentos, cadastro e perguntas com outra redação. Este resultado continua registrado."
        actions={
          <>
            <Button variant="secondary" onClick={() => setRestartOpen(false)}>
              Cancelar
            </Button>
            <Button
              icon={<RotateCcw size={17} aria-hidden="true" />}
              onClick={() => {
                setRestartOpen(false)
                startOver()
                navigate('/comecar')
              }}
            >
              Começar do zero
            </Button>
          </>
        }
      />
    </div>
  )
}

function TimeReliability({ session }: { session: AssessmentSession }) {
  const rel = sessionReliability(session.responses, session.form)
  if (rel.mean === null) return null
  return (
    <section aria-labelledby="tempo-title" className="grid gap-6">
      <SectionTitle
        id="tempo-title"
        title="Confiabilidade pelo tempo de resposta"
        lead="Cada pergunta tem um tempo ideal, conforme a complexidade (baixa, média ou alta). Confiabilidade = confiança do tempo × resposta dada."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="grid content-start gap-2 rounded-lg bg-surface p-6 ring-1 ring-line">
          <p className="text-sm font-semibold text-text-muted">Confiabilidade geral</p>
          <p className="font-display text-display-md tabular">{Math.round(rel.mean * 100)}%</p>
          <p className="font-semibold text-ink">{RELIABILITY_LABEL[rel.level!]}</p>
          <p className="text-sm text-text-muted">
            {rel.tooFast} {rel.tooFast === 1 ? 'resposta rápida demais' : 'respostas rápidas demais'} para a leitura · {rel.tooSlow} {rel.tooSlow === 1 ? 'muito demorada' : 'muito demoradas'}
          </p>
        </div>
        <Table caption="Tempo ideal e tempo real por complexidade da pergunta">
          <thead>
            <tr>
              <th className={th} scope="col">Complexidade</th>
              <th className={th} scope="col">Perguntas</th>
              <th className={th} scope="col">Tempo ideal</th>
              <th className={th} scope="col">Seu tempo (mediana)</th>
              <th className={th} scope="col">Confiabilidade</th>
            </tr>
          </thead>
          <tbody>
            {rel.byComplexity.map((c) => (
              <tr key={c.complexity}>
                <th className={td} scope="row">{COMPLEXITY_LABEL[c.complexity]}</th>
                <td className={`${td} tabular`}>{c.n}</td>
                <td className={`${td} tabular`}>{c.idealMs === null ? '—' : fmtSeconds(c.idealMs)}</td>
                <td className={`${td} tabular`}>{c.medianMs === null ? '—' : fmtSeconds(c.medianMs)}</td>
                <td className={`${td} tabular`}>{c.mean === null ? '—' : `${Math.round(c.mean * 100)}%`}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </section>
  )
}
