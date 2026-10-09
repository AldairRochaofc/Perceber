import { useState } from 'react'
import { ArrowDownRight, ArrowRight, ArrowUpRight, FileText, GitCompareArrows, MessageSquareText, Minus, PlayCircle, Trash2 } from 'lucide-react'
import { DOMAIN_BY_ID } from '../../domain/domains'
import { remainingRange } from '../../domain/engine'
import { MODULES, MODULE_BY_ID } from '../../domain/modules'
import { QUALITY_LEVEL_LABEL } from '../../domain/scoring'
import { SIGNALS } from '../../domain/signals'
import type { AssessmentSession } from '../../domain/types'
import { fmtDateShort, fmtDecimal, plural } from '../../lib/format'
import { completedSessions, deleteSession, latestCompleted, professionalName, shareStatus, useStore } from '../../state/store'
import { Button } from '../../ui/Button'
import { Dialog } from '../../ui/Dialog'
import { Strip } from '../../ui/DomainList'
import { PageHeader, SectionTitle } from '../../ui/PageHeader'
import { PatternSwatch } from '../../ui/patterns'
import { Badge, EmptyState, Surface } from '../../ui/Surface'
import { Table, td, th } from '../../ui/Table'
import { notify } from '../../ui/Toast'

export function DashboardPage() {
  const state = useStore()
  const done = completedSessions(state)
  const latest = latestCompleted(state, 'central')
  const [toDelete, setToDelete] = useState<AssessmentSession | null>(null)
  const activeShares = state.shares.filter((g) => shareStatus(g) === 'active')
  const observations = state.shares.flatMap((g) => g.observations.map((o) => ({ ...o, grant: g })))

  return (
    <div className="container-page grid gap-16 pb-10">
      <PageHeader title={`Olá, ${state.profile?.preferredName}.`} lead="Suas avaliações, resultados e compartilhamentos, num só lugar. Tudo aqui é visível só para você." />

      {/* Módulos */}
      <section aria-labelledby="modulos-title" className="grid gap-5">
        <SectionTitle id="modulos-title" title="Seus módulos" />
        <ul className="grid gap-3">
          {MODULES.map((m) => {
            const open = state.sessions.find((s) => s.moduleId === m.id && s.status === 'in-progress')
            const last = latestCompleted(state, m.id)
            const left = open ? remainingRange(m.id, open.responses) : null
            return (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-surface px-5 py-4 ring-1 ring-line">
                <div className="grid gap-0.5">
                  <span className="font-semibold text-ink">{m.name}</span>
                  <span className="text-sm text-text-muted">
                    {open
                      ? `Em andamento · ${plural(open.responses.length, 'resposta salva', 'respostas salvas')}, faltam ${left![0] === left![1] ? left![0] : `${left![0]} a ${left![1]}`}`
                      : last
                        ? `Concluído em ${fmtDateShort(last.completedAt!)}`
                        : 'Ainda não respondido'}
                  </span>
                </div>
                {open ? (
                  <Button to={`/avaliacao/${open.id}`} size="sm" icon={<PlayCircle size={16} aria-hidden="true" />}>
                    Continuar
                  </Button>
                ) : last ? (
                  <Button to={`/resultado/${last.id}`} size="sm" variant="secondary">
                    Ver resultado
                  </Button>
                ) : (
                  <Button to={`/antes-de-comecar?modulo=${m.id}`} size="sm" variant={m.id === 'central' ? 'primary' : 'secondary'}>
                    Começar
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {/* Último resultado */}
      {latest?.result ? (
        <Surface tone="feature" as="section" aria-labelledby="ultimo-title" className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_1.2fr] lg:gap-14">
          <div className="grid content-start gap-5">
            <h2 id="ultimo-title" className="text-display-sm">
              Último resultado do eixo central
            </h2>
            {latest.result.signal && (
              <div className="flex items-center gap-4">
                <PatternSwatch pattern={SIGNALS[latest.result.signal].pattern} color={SIGNALS[latest.result.signal].colorVar} size={48} />
                <div className="grid">
                  <span className="font-display text-title" style={{ color: SIGNALS[latest.result.signal].textVar }}>
                    {SIGNALS[latest.result.signal].label}
                  </span>
                  <span className="text-sm text-text-muted">
                    {fmtDateShort(latest.completedAt!)} · qualidade {QUALITY_LEVEL_LABEL[latest.result.quality.level].toLowerCase()}
                  </span>
                </div>
              </div>
            )}
            <p className="text-text-muted">{latest.result.signal ? SIGNALS[latest.result.signal].tone : ''}</p>
            <div className="flex flex-wrap gap-3">
              <Button to={`/resultado/${latest.id}`} iconAfter={<ArrowRight size={18} aria-hidden="true" />}>
                Abrir resultado
              </Button>
              <Button to={`/relatorio/${latest.id}`} variant="secondary" icon={<FileText size={18} aria-hidden="true" />}>
                Relatório
              </Button>
            </div>
          </div>
          <ul className="grid content-start">
            {latest.result.domains
              .filter((d) => DOMAIN_BY_ID[d.domain].group === 'central')
              .map((d) => (
                <li key={d.domain} className="grid grid-cols-[8.5rem_1fr_2.5rem] items-center gap-3 border-b border-line py-2.5 sm:grid-cols-[11rem_1fr_3rem]">
                  <span className="truncate text-sm font-semibold text-ink">{DOMAIN_BY_ID[d.domain].label}</span>
                  <Strip score={d} compact />
                  <span className="text-right text-sm font-semibold text-ink tabular">{d.mean === null ? '—' : fmtDecimal(d.mean)}</span>
                </li>
              ))}
          </ul>
        </Surface>
      ) : (
        <EmptyState
          title="Seu mapa aparece aqui depois do primeiro módulo."
          action={
            <Button to="/antes-de-comecar?modulo=central" size="sm">
              Começar o eixo central
            </Button>
          }
        >
          O eixo central leva de 8 a 12 minutos, e você pode pausar quando quiser.
        </EmptyState>
      )}

      <Comparison sessions={done.filter((s) => s.moduleId === 'central')} />

      {/* Histórico */}
      <section aria-labelledby="historico-title" className="grid gap-5">
        <SectionTitle id="historico-title" title="Histórico" lead="Todas as avaliações concluídas. Excluir uma avaliação revoga os acessos ligados a ela." />
        {done.length ? (
          <Table caption="Avaliações concluídas, da mais recente para a mais antiga" captionHidden>
            <thead>
              <tr>
                <th className={th} scope="col">Data</th>
                <th className={th} scope="col">Módulo</th>
                <th className={th} scope="col">Sinal</th>
                <th className={th} scope="col">Qualidade</th>
                <th className={th} scope="col">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {done.map((s) => (
                <tr key={s.id}>
                  <td className={td}>{fmtDateShort(s.completedAt!)}</td>
                  <td className={td}>{MODULE_BY_ID[s.moduleId].name}</td>
                  <td className={td}>{s.result?.signal ? SIGNALS[s.result.signal].label : 'Sem sinal único'}</td>
                  <td className={td}>{QUALITY_LEVEL_LABEL[s.result!.quality.level]}</td>
                  <td className={`${td} text-right whitespace-nowrap`}>
                    <a href={`#/resultado/${s.id}`} className="mr-4 font-semibold">
                      Resultado
                    </a>
                    <a href={`#/relatorio/${s.id}`} className="mr-4 font-semibold">
                      Relatório
                    </a>
                    <button type="button" onClick={() => setToDelete(s)} className="inline-flex items-center gap-1 rounded-sm font-semibold text-danger hover:underline">
                      <Trash2 size={15} aria-hidden="true" />
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <p className="text-text-muted">Nenhuma avaliação concluída ainda.</p>
        )}
      </section>

      {/* Compartilhamentos e observações */}
      <section aria-labelledby="compart-title" className="grid gap-6 lg:grid-cols-2">
        <div className="grid content-start gap-4 rounded-lg bg-surface p-6 ring-1 ring-line">
          <h2 id="compart-title" className="text-display-sm">
            Compartilhamentos
          </h2>
          <p className="text-text-muted">
            {activeShares.length ? `${plural(activeShares.length, 'acesso ativo', 'acessos ativos')}.` : 'Nenhum acesso ativo. Seu relatório está visível só para você.'}
          </p>
          <div>
            <Button to="/compartilhar" variant="secondary" size="sm">
              Gerenciar acessos
            </Button>
          </div>
        </div>
        <div className="grid content-start gap-4 rounded-lg bg-surface p-6 ring-1 ring-line">
          <h2 className="text-display-sm">Observações de profissionais</h2>
          {observations.length ? (
            <ul className="grid gap-3">
              {observations.slice(-3).reverse().map((o) => (
                <li key={o.id} className="grid gap-1 border-t border-line pt-3">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
                    <MessageSquareText size={16} aria-hidden="true" className="text-accent" />
                    {professionalName(o.grant)} · {fmtDateShort(o.at)}
                  </span>
                  <span className="text-text-muted">{o.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-text-muted">Quando um profissional com acesso deixar uma observação, ela aparece aqui.</p>
          )}
        </div>
      </section>

      <Dialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        size="sm"
        title="Excluir esta avaliação?"
        description="As respostas e o resultado serão apagados deste navegador, e os acessos ligados a ela serão revogados. Não é possível desfazer."
        actions={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)}>
              Manter
            </Button>
            <Button
              variant="danger"
              icon={<Trash2 size={17} aria-hidden="true" />}
              onClick={() => {
                deleteSession(toDelete!.id)
                setToDelete(null)
                notify('Avaliação excluída')
              }}
            >
              Excluir avaliação
            </Button>
          </>
        }
      />
    </div>
  )
}

function Comparison({ sessions }: { sessions: AssessmentSession[] }) {
  if (sessions.length < 2) {
    return (
      <section aria-labelledby="comparar-title" className="grid gap-4">
        <SectionTitle id="comparar-title" title="Comparar avaliações" />
        <EmptyState title="Ainda não há o que comparar." icon={<GitCompareArrows size={20} aria-hidden="true" />}>
          A comparação aparece a partir da segunda avaliação do eixo central. Refazer depois de algumas semanas ajuda a distinguir traços estáveis de oscilações do momento.
        </EmptyState>
      </section>
    )
  }
  const [latest, previous] = sessions as [AssessmentSession, AssessmentSession]
  return (
    <section aria-labelledby="comparar-title" className="grid gap-5">
      <SectionTitle
        id="comparar-title"
        title="Comparar avaliações"
        lead={`${fmtDateShort(previous.completedAt!)} → ${fmtDateShort(latest.completedAt!)}. Diferenças pequenas cabem na variação natural de poucas perguntas.`}
        aside={
          latest.moduleVersion !== previous.moduleVersion ? <Badge tone="attention">Versões diferentes do módulo</Badge> : undefined
        }
      />
      <Table caption="Média por domínio nas duas avaliações mais recentes" captionHidden>
        <thead>
          <tr>
            <th className={th} scope="col">Domínio</th>
            <th className={th} scope="col">Antes</th>
            <th className={th} scope="col">Agora</th>
            <th className={th} scope="col">Mudança</th>
          </tr>
        </thead>
        <tbody>
          {latest.result!.domains.map((d) => {
            const prev = previous.result!.domains.find((x) => x.domain === d.domain)
            const delta = d.mean !== null && prev?.mean != null ? d.mean - prev.mean : null
            const small = delta !== null && Math.abs(delta) < 0.75
            return (
              <tr key={d.domain}>
                <td className={td}>{DOMAIN_BY_ID[d.domain].label}</td>
                <td className={`${td} tabular`}>{prev?.mean == null ? '—' : fmtDecimal(prev.mean)}</td>
                <td className={`${td} tabular`}>{d.mean === null ? '—' : fmtDecimal(d.mean)}</td>
                <td className={td}>
                  {delta === null ? (
                    '—'
                  ) : (
                    <span className="inline-flex items-center gap-1.5 tabular">
                      {small ? <Minus size={15} aria-hidden="true" /> : delta > 0 ? <ArrowUpRight size={15} aria-hidden="true" /> : <ArrowDownRight size={15} aria-hidden="true" />}
                      {delta > 0 ? '+' : ''}
                      {fmtDecimal(delta)}
                      {small && <span className="text-text-subtle">(pequena)</span>}
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    </section>
  )
}
