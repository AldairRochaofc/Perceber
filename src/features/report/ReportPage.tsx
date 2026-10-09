import { useMemo } from 'react'
import { Download, Printer, Share2 } from 'lucide-react'
import { DISCLAIMER } from '../../domain/content'
import { DOMAIN_BY_ID } from '../../domain/domains'
import { MODULE_BY_ID, PLATFORM_VERSION } from '../../domain/modules'
import { QUALITY_LEVEL_LABEL } from '../../domain/scoring'
import { NEXT_STEP, SIGNALS } from '../../domain/signals'
import { fmtDateTime } from '../../lib/format'
import type { RouteMatch } from '../../lib/router'
import { shortHash } from '../../lib/sha256'
import { downloadFile } from '../../lib/storage'
import { recordExport, sessionById, useStore } from '../../state/store'
import { Button } from '../../ui/Button'
import { DomainList } from '../../ui/DomainList'
import { PageHeader } from '../../ui/PageHeader'
import { PatternSwatch } from '../../ui/patterns'
import { Meta } from '../../ui/Surface'
import { Table, td, th } from '../../ui/Table'
import { notify } from '../../ui/Toast'
import { ContextFactorsPanel, UncertaintyPanel } from '../results/Explain'
import { CrisisList } from '../help/CrisisList'
import { payloadHash, reportHTML, reportPayload } from './reportPayload'

export function ReportPage({ match }: { match: RouteMatch }) {
  const state = useStore()
  const session = sessionById(state, match.params.id ?? '')
  const result = session?.result
  const payload = useMemo(() => (session?.result ? reportPayload(session, state.profile) : null), [session, state.profile])
  const hash = useMemo(() => (payload ? payloadHash(payload) : ''), [payload])

  if (!session || !result || !payload) {
    return (
      <div className="container-page grid max-w-3xl gap-6 pb-10">
        <PageHeader title="Este relatório não está disponível." size="md" />
        <div>
          <Button to="/painel">Ir para o painel</Button>
        </div>
      </div>
    )
  }

  const module = MODULE_BY_ID[session.moduleId]
  const signal = result.signal ? SIGNALS[result.signal] : null
  const exports = state.exports.filter((e) => e.sessionId === session.id)
  const frequentDomains = result.domains.filter((d) => d.mean !== null && d.mean >= 2.5)
  const languageNote = state.eligibility?.language === 'some-difficulty'

  const print = () => {
    recordExport(session.id, hash, 'print')
    window.print()
  }
  const download = () => {
    const rec = recordExport(session.id, hash, 'html')
    downloadFile(`perceber-relatorio-${rec.id}.html`, reportHTML(session, state.profile, rec.id, hash, rec.at), 'text/html')
    notify('Relatório baixado')
  }

  return (
    <article className="container-page grid max-w-5xl gap-14 pb-10" aria-labelledby="report-title">
      <div className="no-print">
        <PageHeader
          back={{ to: `/resultado/${session.id}`, label: 'Resultado' }}
          title="Relatório"
          lead="Um documento organizado para você guardar ou levar a uma conversa profissional."
          size="md"
          actions={
            <>
              <Button variant="secondary" onClick={print} icon={<Printer size={18} aria-hidden="true" />}>
                Imprimir ou salvar PDF
              </Button>
              <Button variant="secondary" onClick={download} icon={<Download size={18} aria-hidden="true" />}>
                Baixar arquivo
              </Button>
              <Button to={`/compartilhar?avaliacao=${session.id}`} icon={<Share2 size={18} aria-hidden="true" />}>
                Compartilhar
              </Button>
            </>
          }
        />
      </div>

      {/* Documento */}
      <div className="print-plain grid gap-12 rounded-xl bg-surface p-6 shadow-lift ring-1 ring-line sm:p-12">
        <header className="grid gap-6 border-b border-line pb-8">
          <p className="label-data text-text-subtle">
            Perceber {PLATFORM_VERSION} · {module.code} v{result.moduleVersion} · {result.algorithmVersion}
          </p>
          <h2 id="report-title" className="text-display-lg font-light">
            Percepção inicial baseada nas respostas
          </h2>
          <p className="rounded-md border-2 border-deep p-4 font-semibold text-ink dusk:border-ink">
            {DISCLAIMER} Este documento não é diagnóstico, laudo, atestado ou conclusão clínica.
          </p>
          <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Meta label="Nome de preferência">{state.profile?.preferredName ?? 'não informado'}</Meta>
            <Meta label="Concluída em">{fmtDateTime(session.completedAt!)}</Meta>
            <Meta label="Finalidade informada">{state.profile?.reason ?? 'não informada'}</Meta>
            <Meta label="Módulo">{module.name}</Meta>
          </dl>
        </header>

        <section className="avoid-break grid gap-5" aria-labelledby="r-sinal">
          <h3 id="r-sinal" className="text-display-sm">
            Síntese
          </h3>
          {signal ? (
            <div className="flex flex-wrap items-start gap-5">
              <PatternSwatch pattern={signal.pattern} color={signal.colorVar} size={48} />
              <div className="grid max-w-2xl gap-2">
                <p className="font-display text-title" style={{ color: signal.textVar }}>
                  {signal.label}
                </p>
                <p className="text-text-muted">{signal.summary}</p>
              </div>
            </div>
          ) : (
            <p className="text-text-muted">Este módulo não gera sinal único. Cada área tem indicador próprio.</p>
          )}
          <p className="text-text-muted">
            {frequentDomains.length
              ? `Relatos frequentes (média 2,5 ou mais) em: ${frequentDomains.map((d) => DOMAIN_BY_ID[d.domain].label.toLowerCase()).join(', ')}.`
              : 'Nenhum domínio ficou com média de 2,5 ou mais.'}{' '}
            Qualidade dos dados: {QUALITY_LEVEL_LABEL[result.quality.level].toLowerCase()} ({result.quality.answered} de {result.quality.presented} perguntas respondidas).
          </p>
        </section>

        <section className="grid gap-5" aria-labelledby="r-dominios">
          <h3 id="r-dominios" className="text-display-sm">
            Pontuações por domínio
          </h3>
          <DomainList scores={result.domains} headingLevel={4} />
        </section>

        <section className="avoid-break grid gap-5" aria-labelledby="r-incerteza">
          <h3 id="r-incerteza" className="text-display-sm">
            Limites e incertezas
          </h3>
          <UncertaintyPanel />
        </section>

        <section className="avoid-break grid gap-5" aria-labelledby="r-alternativas">
          <h3 id="r-alternativas" className="text-display-sm">
            Explicações alternativas a considerar
          </h3>
          {frequentDomains.length ? (
            <ul className="grid gap-3">
              {frequentDomains.map((d) => (
                <li key={d.domain} className="grid gap-1 border-t border-line pt-3">
                  <span className="font-semibold text-ink">{DOMAIN_BY_ID[d.domain].label}</span>
                  <span className="text-sm text-text-muted">Relatos frequentes aqui também podem estar ligados a: {DOMAIN_BY_ID[d.domain].alternatives.join(', ')}.</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-text-muted">Sem domínios com relatos frequentes para comentar.</p>
          )}
          <ul className="grid gap-1.5 text-sm text-text-muted">
            {module.limitations.map((l) => (
              <li key={l}>· {l}</li>
            ))}
          </ul>
        </section>

        <section className="avoid-break grid gap-5" aria-labelledby="r-contexto">
          <h3 id="r-contexto" className="text-display-sm">
            Contexto e comentários da pessoa
          </h3>
          <ContextFactorsPanel session={session} forReport />
          {languageNote && <p className="text-sm text-text-muted">Informou alguma dificuldade para ler em português.</p>}
        </section>

        <section className="avoid-break grid gap-5" aria-labelledby="r-proximo">
          <h3 id="r-proximo" className="text-display-sm">
            Próximo passo
          </h3>
          <p className="measure text-text-muted">{NEXT_STEP}</p>
          <div className="no-print">
            <CrisisList />
          </div>
          <p className="hidden text-sm print:block">Apoio imediato: CVV 188 (gratuito, 24 horas) · SAMU 192 · UBS ou CAPS da região.</p>
        </section>

        <footer className="avoid-break grid gap-3 border-t border-line pt-6">
          <p className="text-sm font-semibold text-ink">Integridade</p>
          <p className="label-data break-all text-text-muted">SHA-256 do conteúdo: {hash}</p>
          <p className="text-sm text-text-subtle">Se qualquer informação deste relatório mudar, a impressão digital muda também.</p>
        </footer>
      </div>

      <section className="no-print grid gap-5" aria-labelledby="exports-title">
        <h2 id="exports-title" className="text-display-sm">
          Versões exportadas
        </h2>
        {exports.length ? (
          <Table caption="Cada exportação recebe identificador, data, versão e impressão digital.">
            <thead>
              <tr>
                <th className={th} scope="col">Identificador</th>
                <th className={th} scope="col">Data</th>
                <th className={th} scope="col">Formato</th>
                <th className={th} scope="col">Impressão digital</th>
              </tr>
            </thead>
            <tbody>
              {[...exports].reverse().map((e) => (
                <tr key={e.id}>
                  <td className={`${td} label-data`}>{e.id}</td>
                  <td className={td}>{fmtDateTime(e.at)}</td>
                  <td className={td}>{e.format === 'html' ? 'Arquivo' : e.format === 'print' ? 'Impressão/PDF' : 'Dados'}</td>
                  <td className={`${td} label-data`}>
                    {shortHash(e.hash)} {e.hash === hash ? <span className="font-sans text-success">· confere</span> : <span className="font-sans text-attention">· conteúdo mudou</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <p className="text-text-muted">Nenhuma versão exportada ainda.</p>
        )}
      </section>
    </article>
  )
}
