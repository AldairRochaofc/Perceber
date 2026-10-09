import { useState } from 'react'
import { Download } from 'lucide-react'
import { useDB, type PersonRecord, type RespondTime } from '../../data/db'
import { FORM_LABEL, ITEMS } from '../../domain/items'
import { AGE_LABEL, GENDER_LABEL, ageBreakdown, binaryAudience, genderBreakdown, predominantAge } from '../../domain/people'
import { SIGNALS } from '../../domain/signals'
import { COMPLEXITY_LABEL, RELIABILITY_LABEL, fmtSeconds, itemTiming, mean, median, reliabilityLevel } from '../../domain/timing'
import { fmtDateShort } from '../../lib/format'
import { downloadFile } from '../../lib/storage'
import { Button } from '../../ui/Button'
import { TextField } from '../../ui/Field'
import { PageHeader, SectionTitle } from '../../ui/PageHeader'
import { Kpi } from '../../ui/Stats'
import { Badge } from '../../ui/Surface'
import { Table, td, th } from '../../ui/Table'

const pct = (x: number) => `${x.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
const relText = (r: number | null) => (r === null ? '—' : `${Math.round(r * 100)}% · ${RELIABILITY_LABEL[reliabilityLevel(r)]}`)

function toCSV(rows: Record<string, string | number | null>[]) {
  if (!rows.length) return ''
  const head = Object.keys(rows[0]!)
  const esc = (v: string | number | null) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [head.join(';'), ...rows.map((r) => head.map((h) => esc(r[h] ?? null)).join(';'))].join('\n')
}

const today = () => new Date().toISOString().slice(0, 10)

function exportPeople(people: PersonRecord[]) {
  const csv = toCSV(
    people.map((p) => ({
      id: p.id,
      nome: p.name,
      genero: GENDER_LABEL[p.gender],
      faixa_etaria: AGE_LABEL[p.ageBand],
      cadastro: p.createdAt,
      avaliacoes: p.completed,
      ultimo_sinal: p.lastSignal ? SIGNALS[p.lastSignal].label : '',
      confiabilidade: p.reliability,
      origem: p.source,
    })),
  )
  downloadFile(`perceber-participantes-${today()}.csv`, csv, 'text/csv')
}

function exportRespondTimes(rows: RespondTime[]) {
  const csv = toCSV(
    rows.map((r) => ({
      id: r.id,
      pessoa: r.personId,
      avaliacao: r.sessionId,
      modulo: r.moduleId,
      item: r.itemId,
      forma: FORM_LABEL[r.form] ?? r.form,
      complexidade: COMPLEXITY_LABEL[r.complexity],
      tempo_ms: r.latencyMs,
      tempo_ideal_ms: r.idealMs,
      confianca_tempo: r.timeConfidence,
      confianca_resposta: r.answerConfidence,
      confiabilidade: r.reliability,
      registrado_em: r.at,
      origem: r.source,
    })),
  )
  downloadFile(`perceber-respondtime-${today()}.csv`, csv, 'text/csv')
}

/** Relatório automático de participantes. Somente administração. */
export function ParticipantsPage() {
  const { people, respondTimes } = useDB()
  const [query, setQuery] = useState('')
  const audience = binaryAudience(people)
  const genders = genderBreakdown(people)
  const ages = ageBreakdown(people)
  const topAge = predominantAge(people)
  const simulated = people.filter((p) => p.source === 'simulado').length

  const q = query.trim().toLowerCase()
  const list = [...people]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .filter((p) => !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))

  const perItem = ITEMS.map((item) => {
    const rows = respondTimes.filter((r) => r.itemId === item.id)
    const inWindow = rows.filter((r) => {
      const t = itemTiming(r.itemId, r.form)
      return r.latencyMs >= t.minMs && r.latencyMs <= t.maxMs
    }).length
    return {
      item,
      timing: itemTiming(item.id, 0),
      n: rows.length,
      median: median(rows.map((r) => r.latencyMs)),
      inWindow: rows.length ? Math.round((inWindow / rows.length) * 100) : null,
      reliability: mean(rows.map((r) => r.reliability)),
    }
  }).filter((r) => r.n > 0)

  const latest = [...respondTimes].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 20)

  return (
    <div className="container-page grid gap-14 pb-10">
      <PageHeader
        title="Participantes."
        lead="Relatório automático de todas as pessoas que usaram o PERCEBER e guardaram suas informações. Visível somente para a administração."
        meta={
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent">Sem banco de dados: variável global PERCEBER_DB</Badge>
            <Badge>{simulated} registros simulados</Badge>
          </div>
        }
      />

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label="Pessoas registradas" value={people.length} />
        <Kpi label="Homens" value={pct(audience.menPct)} note={`${audience.men} pessoas`} />
        <Kpi label="Mulheres" value={pct(audience.womenPct)} note={`${audience.women} pessoas`} />
        <Kpi label="Razão de gênero" value={audience.ratio === null ? '—' : audience.ratio.toLocaleString('pt-BR')} note="homens para cada 100 mulheres" />
        <Kpi label="Faixa etária predominante" value={topAge ? topAge.label : '—'} note={topAge ? `${topAge.n} pessoas · ${pct(topAge.pct)}` : undefined} />
      </dl>

      <section aria-labelledby="publico-title" className="grid gap-6">
        <SectionTitle id="publico-title" title="Público pesquisado" lead="Porcentagens por gênero e faixa etária, calculadas sobre todas as pessoas registradas." />
        <div className="grid gap-6 lg:grid-cols-3">
          <Table caption="Porcentagem por gênero">
            <thead>
              <tr>
                <th className={th} scope="col">Gênero</th>
                <th className={th} scope="col">Quantidade</th>
                <th className={th} scope="col">% do total</th>
              </tr>
            </thead>
            <tbody>
              {genders.map((g) => (
                <tr key={g.gender}>
                  <th className={td} scope="row">{g.label}</th>
                  <td className={`${td} tabular`}>{g.n}</td>
                  <td className={`${td} tabular`}>{pct(g.pct)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Table caption="Homens e mulheres (base: só homens + mulheres)">
            <thead>
              <tr>
                <th className={th} scope="col">Público</th>
                <th className={th} scope="col">Quantidade</th>
                <th className={th} scope="col">%</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th className={td} scope="row">Homens</th>
                <td className={`${td} tabular`}>{audience.men}</td>
                <td className={`${td} tabular`}>{pct(audience.menPct)}</td>
              </tr>
              <tr>
                <th className={td} scope="row">Mulheres</th>
                <td className={`${td} tabular`}>{audience.women}</td>
                <td className={`${td} tabular`}>{pct(audience.womenPct)}</td>
              </tr>
              <tr>
                <th className={`${td} font-semibold`} scope="row">Total</th>
                <td className={`${td} tabular font-semibold`}>{audience.total}</td>
                <td className={`${td} tabular font-semibold`}>100%</td>
              </tr>
              <tr>
                <th className={td} scope="row">Razão de gênero</th>
                <td className={`${td} tabular`} colSpan={2}>
                  {audience.ratio === null ? '—' : `${audience.ratio.toLocaleString('pt-BR')} homens / 100 mulheres`}
                </td>
              </tr>
            </tbody>
          </Table>
          <Table caption="Faixa etária">
            <thead>
              <tr>
                <th className={th} scope="col">Faixa</th>
                <th className={th} scope="col">Quantidade</th>
                <th className={th} scope="col">%</th>
              </tr>
            </thead>
            <tbody>
              {ages.map((a) => (
                <tr key={a.ageBand} className={a.ageBand === topAge?.ageBand ? 'bg-accent-soft/40' : undefined}>
                  <th className={td} scope="row">
                    {a.label}
                    {a.ageBand === topAge?.ageBand && <span className="block text-caption text-text-subtle">predominante</span>}
                  </th>
                  <td className={`${td} tabular`}>{a.n}</td>
                  <td className={`${td} tabular`}>{pct(a.pct)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </section>

      <section aria-labelledby="registro-title" className="grid gap-6">
        <SectionTitle id="registro-title" title="Pessoas registradas" lead="ID, nome, gênero e faixa etária de cada pessoa, com avaliações e confiabilidade das respostas." />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <TextField label="Buscar por nome ou ID" value={query} onChange={(e) => setQuery(e.target.value)} className="w-full max-w-sm" autoComplete="off" />
          <Button variant="secondary" size="sm" icon={<Download size={16} aria-hidden="true" />} onClick={() => exportPeople(people)}>
            Baixar CSV
          </Button>
        </div>
        <Table caption={`${list.length} de ${people.length} pessoas`}>
          <thead>
            <tr>
              <th className={th} scope="col">ID</th>
              <th className={th} scope="col">Nome</th>
              <th className={th} scope="col">Gênero</th>
              <th className={th} scope="col">Faixa etária</th>
              <th className={th} scope="col">Cadastro</th>
              <th className={th} scope="col">Avaliações</th>
              <th className={th} scope="col">Último sinal</th>
              <th className={th} scope="col">Confiabilidade</th>
              <th className={th} scope="col">Origem</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td className={`${td} label-data whitespace-nowrap`}>{p.id}</td>
                <td className={`${td} whitespace-nowrap`}>{p.name}</td>
                <td className={td}>{GENDER_LABEL[p.gender]}</td>
                <td className={`${td} whitespace-nowrap`}>{AGE_LABEL[p.ageBand]}</td>
                <td className={`${td} whitespace-nowrap`}>{fmtDateShort(p.createdAt)}</td>
                <td className={`${td} tabular`}>{p.completed}</td>
                <td className={td}>{p.lastSignal ? SIGNALS[p.lastSignal].label : '—'}</td>
                <td className={`${td} whitespace-nowrap tabular`}>{relText(p.reliability)}</td>
                <td className={td}>{p.source === 'app' ? <Badge tone="accent">App</Badge> : <Badge>Simulado</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </section>

      <section aria-labelledby="respondtime-title" className="grid gap-6">
        <SectionTitle
          id="respondtime-title"
          title="RespondTime: tempo de cada pergunta"
          lead="Complexidade e tempo ideal referem-se à forma A. Cada resposta é avaliada pela forma que a pessoa leu. “No tempo” = entre o mínimo de leitura e três vezes o tempo ideal."
        />
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" icon={<Download size={16} aria-hidden="true" />} onClick={() => exportRespondTimes(respondTimes)}>
            Baixar RespondTime (CSV)
          </Button>
        </div>
        <Table caption="Tempo ideal, tempo real e confiabilidade por pergunta">
          <thead>
            <tr>
              <th className={th} scope="col">Item</th>
              <th className={th} scope="col">Pergunta</th>
              <th className={th} scope="col">Complexidade</th>
              <th className={th} scope="col">Tempo ideal</th>
              <th className={th} scope="col">Tempo real (mediana)</th>
              <th className={th} scope="col">No tempo</th>
              <th className={th} scope="col">Confiabilidade</th>
              <th className={th} scope="col">Respostas</th>
            </tr>
          </thead>
          <tbody>
            {perItem.map((r) => (
              <tr key={r.item.id}>
                <td className={`${td} label-data`}>{r.item.id}</td>
                <td className={`${td} min-w-[18rem]`}>{r.item.text}</td>
                <td className={td}>{COMPLEXITY_LABEL[r.timing.complexity]}</td>
                <td className={`${td} tabular whitespace-nowrap`}>{fmtSeconds(r.timing.idealMs)}</td>
                <td className={`${td} tabular whitespace-nowrap`}>{r.median === null ? '—' : fmtSeconds(r.median)}</td>
                <td className={`${td} tabular`}>{r.inWindow === null ? '—' : `${r.inWindow}%`}</td>
                <td className={`${td} tabular whitespace-nowrap`}>{relText(r.reliability)}</td>
                <td className={`${td} tabular`}>{r.n}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Table caption="Últimos 20 registros de RespondTime">
          <thead>
            <tr>
              <th className={th} scope="col">Pessoa</th>
              <th className={th} scope="col">Item</th>
              <th className={th} scope="col">Forma</th>
              <th className={th} scope="col">Complexidade</th>
              <th className={th} scope="col">Tempo</th>
              <th className={th} scope="col">Ideal</th>
              <th className={th} scope="col">Conf. tempo</th>
              <th className={th} scope="col">Conf. resposta</th>
              <th className={th} scope="col">Confiabilidade</th>
            </tr>
          </thead>
          <tbody>
            {latest.map((r) => (
              <tr key={r.id}>
                <td className={`${td} label-data whitespace-nowrap`}>{r.personId}</td>
                <td className={`${td} label-data`}>{r.itemId}</td>
                <td className={td}>{FORM_LABEL[r.form] ?? r.form}</td>
                <td className={td}>{COMPLEXITY_LABEL[r.complexity]}</td>
                <td className={`${td} tabular whitespace-nowrap`}>{fmtSeconds(r.latencyMs)}</td>
                <td className={`${td} tabular whitespace-nowrap`}>{fmtSeconds(r.idealMs)}</td>
                <td className={`${td} tabular`}>{r.timeConfidence.toFixed(2)}</td>
                <td className={`${td} tabular`}>{r.answerConfidence.toFixed(2)}</td>
                <td className={`${td} tabular`}>{r.reliability.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </section>
    </div>
  )
}
