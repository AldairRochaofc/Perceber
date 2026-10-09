import { useDB } from '../../data/db'
import { ageBreakdown, genderBreakdown } from '../../domain/people'
import { SIGNALS } from '../../domain/signals'
import { COMPLEXITIES, COMPLEXITY_LABEL, RELIABILITY_LABEL, fmtSeconds, itemTiming, mean, median, reliabilityLevel, type ReliabilityLevel } from '../../domain/timing'
import type { SignalLevel } from '../../domain/types'
import { PageHeader, SectionTitle } from '../../ui/PageHeader'
import { Bars, Kpi } from '../../ui/Stats'
import { Table, td, th } from '../../ui/Table'

const SIGNAL_ORDER: SignalLevel[] = ['low', 'moderate', 'high', 'wide', 'insufficient']
const LEVELS: ReliabilityLevel[] = ['alta', 'media', 'baixa']

const monthKey = (iso: string) => iso.slice(0, 7)
const monthLabel = (key: string) =>
  new Date(`${key}-15T12:00:00`).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '')

/** Relatório BI: só números agregados, sem nomes nem identificadores. */
export function BiPage() {
  const { people, respondTimes } = useDB()
  const sessions = new Set(respondTimes.map((r) => r.sessionId))
  const completed = people.reduce((a, p) => a + p.completed, 0)
  const relMean = mean(respondTimes.map((r) => r.reliability))
  const medianMs = median(respondTimes.map((r) => r.latencyMs))

  const months = Array.from({ length: 6 }, (_, k) => {
    const d = new Date()
    d.setDate(15)
    d.setMonth(d.getMonth() - (5 - k))
    return d.toISOString().slice(0, 7)
  })
  const byMonth = months.map((m) => ({ label: monthLabel(m), n: people.filter((p) => monthKey(p.createdAt) === m).length }))

  const moduleUse = [
    { label: 'Eixo central', n: new Set(respondTimes.filter((r) => r.moduleId === 'central').map((r) => r.personId)).size },
    { label: 'Áreas coocorrentes', n: new Set(respondTimes.filter((r) => r.moduleId === 'cooccurring').map((r) => r.personId)).size },
  ]

  const withSignal = people.filter((p) => p.lastSignal)
  const signals = SIGNAL_ORDER.map((s) => ({ label: SIGNALS[s].label, n: withSignal.filter((p) => p.lastSignal === s).length }))

  const withRel = people.filter((p) => p.reliability !== null)
  const relLevels = LEVELS.map((l) => ({ label: RELIABILITY_LABEL[l], n: withRel.filter((p) => reliabilityLevel(p.reliability!) === l).length }))

  return (
    <div className="container-page grid gap-12 pb-10">
      <PageHeader
        title="Relatório BI."
        lead="Uso do PERCEBER em números agregados. Sem nomes, sem identificadores e sem respostas individuais."
      />

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label="Pessoas que usaram" value={people.length} />
        <Kpi label="Avaliações concluídas" value={completed} note={`${sessions.size} com tempos registrados`} />
        <Kpi label="Respostas registradas" value={respondTimes.length.toLocaleString('pt-BR')} />
        <Kpi label="Tempo mediano por pergunta" value={medianMs === null ? '—' : fmtSeconds(medianMs)} />
        <Kpi label="Confiabilidade média" value={relMean === null ? '—' : `${Math.round(relMean * 100)}%`} note={relMean === null ? undefined : RELIABILITY_LABEL[reliabilityLevel(relMean)]} />
      </dl>

      <section aria-labelledby="uso-title" className="grid gap-6">
        <SectionTitle id="uso-title" title="Quem usou e quando" />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Bars title="Novos participantes por mês" rows={byMonth} />
          <Bars title="Faixa etária" rows={ageBreakdown(people).map((r) => ({ label: r.label, n: r.n }))} />
          <Bars title="Gênero" rows={genderBreakdown(people).map((r) => ({ label: r.label, n: r.n }))} />
          <Bars title="Pessoas por módulo respondido" rows={moduleUse} />
          <Bars title="Sinal de triagem (último resultado)" rows={signals} />
          <Bars title="Confiabilidade por pessoa" rows={relLevels} />
        </div>
      </section>

      <section aria-labelledby="tempo-bi-title" className="grid gap-6">
        <SectionTitle
          id="tempo-bi-title"
          title="Tempo de resposta por complexidade"
          lead="Tempo ideal calculado pela complexidade de cada pergunta. Confiabilidade = confiança do tempo × resposta."
        />
        <Table caption="Tempo e confiabilidade por complexidade da pergunta">
          <thead>
            <tr>
              <th className={th} scope="col">Complexidade</th>
              <th className={th} scope="col">Respostas</th>
              <th className={th} scope="col">Tempo ideal (mediana)</th>
              <th className={th} scope="col">Tempo real (mediana)</th>
              <th className={th} scope="col">Rápidas demais</th>
              <th className={th} scope="col">Confiabilidade média</th>
            </tr>
          </thead>
          <tbody>
            {COMPLEXITIES.map((c) => {
              const rows = respondTimes.filter((r) => r.complexity === c)
              const ideal = median(rows.map((r) => r.idealMs))
              const real = median(rows.map((r) => r.latencyMs))
              const rel = mean(rows.map((r) => r.reliability))
              const fast = rows.filter((r) => r.latencyMs < itemTiming(r.itemId, r.form).minMs).length
              return (
                <tr key={c}>
                  <th className={td} scope="row">
                    {COMPLEXITY_LABEL[c]}
                  </th>
                  <td className={`${td} tabular`}>{rows.length.toLocaleString('pt-BR')}</td>
                  <td className={`${td} tabular`}>{ideal === null ? '—' : fmtSeconds(ideal)}</td>
                  <td className={`${td} tabular`}>{real === null ? '—' : fmtSeconds(real)}</td>
                  <td className={`${td} tabular`}>{rows.length ? `${Math.round((fast / rows.length) * 100)}%` : '—'}</td>
                  <td className={`${td} tabular`}>{rel === null ? '—' : `${Math.round(rel * 100)}%`}</td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </section>
    </div>
  )
}
