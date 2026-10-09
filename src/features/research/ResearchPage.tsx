import { useMemo, useState } from 'react'
import { Database, Download, Lock, ShieldCheck, UserRoundX } from 'lucide-react'
import { DOMAINS, DOMAIN_BY_ID, domainsIn } from '../../domain/domains'
import { SIGNALS } from '../../domain/signals'
import { DIMENSIONS, SMALL_CELL, SYNTHETIC_SEED, countBy, domainMeanBy, generateSynthetic, missingByItem, signalDistribution, toAggregateCSV, type Dimension } from '../../domain/synthetic'
import type { DomainId } from '../../domain/types'
import { fmtDateTime, fmtDecimal, fmtInt } from '../../lib/format'
import { downloadFile } from '../../lib/storage'
import { logResearchExport, useStore } from '../../state/store'
import { Button } from '../../ui/Button'
import { Select } from '../../ui/Field'
import { PageHeader, SectionTitle } from '../../ui/PageHeader'
import { Callout, Meta } from '../../ui/Surface'
import { Table, td, th } from '../../ui/Table'
import { Tabs } from '../../ui/Tabs'
import { notify } from '../../ui/Toast'

type Tab = 'protocol' | 'dictionary' | 'quality' | 'aggregates' | 'equity' | 'exports'

export function ResearchPage() {
  const data = useMemo(() => generateSynthetic(), [])
  const [tab, setTab] = useState<Tab>('protocol')
  const { researchExports } = useStore()

  return (
    <div className="container-page grid gap-10 pb-10">
      <PageHeader
        title="Pesquisa e dados agregados."
        lead="Acesso apenas a dados pseudonimizados e agregados, conforme protocolo aprovado. Identidade e dados de pesquisa ficam separados."
      />
      <Callout tone="attention" title="Protocolo aguardando aprovação ética · dados sintéticos">
        O protocolo PERC-PESQ-01 está em submissão ao sistema CEP/CONEP. Nenhum dado real é usado em pesquisa até a aprovação. Os números abaixo vêm de um conjunto sintético de {fmtInt(data.length)} registros (semente {SYNTHETIC_SEED}), gerado só para demonstrar esta área. Eles não representam pessoas nem sustentam conclusões.
      </Callout>
      <Tabs
        label="Seções da área de pesquisa"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'protocol', label: 'Protocolo' },
          { id: 'dictionary', label: 'Dicionário de dados' },
          { id: 'quality', label: 'Qualidade' },
          { id: 'aggregates', label: 'Agregados' },
          { id: 'equity', label: 'Equidade' },
          { id: 'exports', label: 'Exportações', count: researchExports.length },
        ]}
      >
        {tab === 'protocol' && <Protocol />}
        {tab === 'dictionary' && <Dictionary />}
        {tab === 'quality' && <Quality data={data} />}
        {tab === 'aggregates' && <Aggregates data={data} />}
        {tab === 'equity' && <Equity data={data} />}
        {tab === 'exports' && <Exports />}
      </Tabs>
    </div>
  )
}

function Protocol() {
  return (
    <div className="grid gap-12">
      <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Meta label="Protocolo" mono>
          PERC-PESQ-01 v0.3
        </Meta>
        <Meta label="Situação">Aguardando CEP/CONEP</Meta>
        <Meta label="Retenção">5 anos após o fim do estudo, depois descarte seguro</Meta>
        <Meta label="Reidentificação">Proibida e auditada</Meta>
      </dl>
      <div className="grid gap-10 lg:grid-cols-2">
        <ProtocolBlock title="Objetivo">
          Estudar validade de conteúdo, estrutura interna, confiabilidade, estabilidade e funcionamento entre grupos dos módulos PERC-EC e PERC-AC, antes de qualquer uso profissional.
        </ProtocolBlock>
        <ProtocolBlock title="População e critérios">
          Adultos (18+) que leem português do Brasil, com consentimento específico para pesquisa. Exclusão: respostas em nome de outra pessoa; interrupção por sofrimento intenso.
        </ProtocolBlock>
        <ProtocolBlock title="Plano de análise">
          Teoria Clássica dos Testes e modelos de resposta ao item comparados quando a teoria e os dados justificarem; análise fatorial confirmatória; confiabilidade por ômega e teste-reteste em 4 a 8 semanas; invariância multigrupo; funcionamento diferencial dos itens; relação com avaliação diagnóstica independente.
        </ProtocolBlock>
        <ProtocolBlock title="Controles de qualidade">
          Padrões de resposta idêntica, tempos muito curtos, inconsistência em itens invertidos e proporção de itens não respondidos — sinalizados, nunca usados para excluir sem regra pré-registrada.
        </ProtocolBlock>
      </div>
      <section aria-labelledby="camadas-title" className="grid gap-6">
        <SectionTitle id="camadas-title" title="Três camadas de dados, separadas tecnicamente" />
        <ol className="grid gap-4 md:grid-cols-3">
          {[
            { icon: <Lock size={20} aria-hidden="true" />, t: 'Identificáveis', b: 'Nome, contato, consentimentos. Só a própria pessoa e, com autorização, o profissional escolhido.' },
            { icon: <UserRoundX size={20} aria-hidden="true" />, t: 'Pseudonimizados', b: 'Respostas com código P-XXXXXX. A chave fica com o controlador, fora do ambiente de pesquisa.' },
            { icon: <ShieldCheck size={20} aria-hidden="true" />, t: 'Anonimizados e agregados', b: `Tabelas com supressão de células menores que ${SMALL_CELL}. Única camada exportável.` },
          ].map((l) => (
            <li key={l.t} className="grid content-start gap-3 rounded-lg bg-surface p-6 ring-1 ring-line">
              <span className="text-accent">{l.icon}</span>
              <span className="font-display text-title">{l.t}</span>
              <span className="text-sm text-text-muted">{l.b}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

function ProtocolBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid content-start gap-2 border-t border-line pt-4">
      <h3 className="font-sans text-ui font-semibold">{title}</h3>
      <p className="text-text-muted">{children}</p>
    </div>
  )
}

const DICTIONARY = [
  ['pid', 'texto', 'Pseudônimo estável por participante (P-XXXXXX)', 'Sistema', 'Pseudonimizado'],
  ['faixa_etaria', 'categoria', '18–24, 25–34, 35–44, 45–59, 60+', 'Perfil', 'Pessoal'],
  ['genero', 'categoria', 'Autodeclarado; opção de não informar', 'Questionário de pesquisa', 'Sensível'],
  ['raca_cor', 'categoria', 'Categorias do IBGE; opção de não informar', 'Questionário de pesquisa', 'Sensível'],
  ['escolaridade', 'categoria', 'Fundamental a pós-graduação', 'Questionário de pesquisa', 'Pessoal'],
  ['regiao', 'categoria', 'Macrorregião do Brasil', 'Questionário de pesquisa', 'Pessoal'],
  ['item_<id>', 'inteiro 0–4 ou ausente', 'Resposta a cada item; ausente quando não respondido', 'Módulos', 'Saúde (sensível)'],
  ['latencia_<id>', 'inteiro (ms)', 'Tempo até a resposta', 'Módulos', 'Pessoal'],
  ['media_<dominio>', 'decimal 0–4', 'Média por domínio (ALG-1.0.0)', 'Derivado', 'Saúde (sensível)'],
  ['sinal', 'categoria', 'Faixa de sinal de triagem', 'Derivado', 'Saúde (sensível)'],
  ['versoes', 'texto', 'Módulo, banco de itens e algoritmo', 'Sistema', 'Técnico'],
]

function Dictionary() {
  return (
    <Table caption="Variáveis previstas no protocolo. Nenhuma variável identificável entra na base de pesquisa.">
      <thead>
        <tr>
          {['Variável', 'Tipo', 'Descrição', 'Origem', 'Sensibilidade'].map((h) => (
            <th key={h} className={th} scope="col">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {DICTIONARY.map((row) => (
          <tr key={row[0]}>
            <td className={`${td} label-data`}>{row[0]}</td>
            <td className={td}>{row[1]}</td>
            <td className={td}>{row[2]}</td>
            <td className={td}>{row[3]}</td>
            <td className={td}>{row[4]}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

/** Barra horizontal fina, ancorada na base, em um único tom (magnitude). O valor sempre vem em texto ao lado. */
function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  return (
    <div className="flex items-center gap-3" title={label}>
      <div aria-hidden="true" className="h-2.5 flex-1 rounded-r-xs bg-surface-sunken">
        <div className="h-full rounded-r-xs bg-accent" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
      </div>
    </div>
  )
}

function Quality({ data }: { data: ReturnType<typeof generateSynthetic> }) {
  const missing = missingByItem(data).slice(0, 10)
  const straight = data.filter((r) => r.straightLining).length
  const dist = signalDistribution(data)
  const maxN = Math.max(...dist.map((d) => d.n ?? 0))
  return (
    <div className="grid gap-12">
      <dl className="grid gap-6 sm:grid-cols-3">
        <Meta label="Registros">{fmtInt(data.length)}</Meta>
        <Meta label="Respostas idênticas em quase tudo">{fmtDecimal((straight / data.length) * 100)}%</Meta>
        <Meta label="Itens com mais ausências">{missing[0]?.item.id.toUpperCase()}</Meta>
      </dl>
      <div className="grid gap-10 lg:grid-cols-2">
        <Table caption="Itens com maior proporção de não resposta">
          <thead>
            <tr>
              <th className={th} scope="col">Item</th>
              <th className={th} scope="col">
                <span className="sr-only">Proporção</span>
              </th>
              <th className={`${th} text-right`} scope="col">
                Ausente
              </th>
            </tr>
          </thead>
          <tbody>
            {missing.map((m) => (
              <tr key={m.item.id}>
                <td className={`${td} w-2/5`}>
                  <span className="label-data text-text-subtle">{m.item.id}</span> <span className="text-sm">{DOMAIN_BY_ID[m.item.domain].short}</span>
                </td>
                <td className={`${td} w-2/5`}>
                  <Bar value={m.rate} max={missing[0]!.rate} label={`${fmtDecimal(m.rate * 100)}%`} />
                </td>
                <td className={`${td} text-right tabular`}>{fmtDecimal(m.rate * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Table caption={`Distribuição do sinal de triagem (células com n < ${SMALL_CELL} suprimidas)`}>
          <thead>
            <tr>
              <th className={th} scope="col">Faixa</th>
              <th className={th} scope="col">
                <span className="sr-only">Proporção</span>
              </th>
              <th className={`${th} text-right`} scope="col">
                n
              </th>
            </tr>
          </thead>
          <tbody>
            {dist.map((d) => (
              <tr key={d.level}>
                <td className={td}>{SIGNALS[d.level].label}</td>
                <td className={td}>{d.n !== null && <Bar value={d.n} max={maxN} label={`${d.n}`} />}</td>
                <td className={`${td} text-right tabular`}>{d.n === null ? `< ${SMALL_CELL}` : fmtInt(d.n)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  )
}

function Aggregates({ data }: { data: ReturnType<typeof generateSynthetic> }) {
  const [dim, setDim] = useState<Dimension>('ageBand')
  const [domain, setDomain] = useState<DomainId>('sensory')
  const rows = domainMeanBy(data, dim, domain)
  const counts = countBy(data, dim)
  return (
    <div className="grid gap-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <Select label="Agrupar por" value={dim} onChange={(e) => setDim(e.target.value as Dimension)} options={(Object.keys(DIMENSIONS) as Dimension[]).map((d) => ({ value: d, label: DIMENSIONS[d].label }))} />
        <Select label="Domínio" value={domain} onChange={(e) => setDomain(e.target.value as DomainId)} options={DOMAINS.map((d) => ({ value: d.id, label: `${d.code} · ${d.label}` }))} />
      </div>
      <Table caption={`Média em ${DOMAIN_BY_ID[domain].label} por ${DIMENSIONS[dim].label.toLowerCase()} (escala 0–4). Grupos com menos de ${SMALL_CELL} pessoas aparecem como suprimidos.`}>
        <thead>
          <tr>
            <th className={th} scope="col">{DIMENSIONS[dim].label}</th>
            <th className={`${th} text-right`} scope="col">
              n
            </th>
            <th className={th} scope="col">
              <span className="sr-only">Média, em barra</span>
            </th>
            <th className={`${th} text-right`} scope="col">
              Média
            </th>
            <th className={`${th} text-right`} scope="col">
              DP
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.value}>
              <td className={td}>{r.value}</td>
              <td className={`${td} text-right tabular`}>{r.n === null ? `< ${SMALL_CELL}` : counts[i]?.n === 0 ? '0' : fmtInt(r.n)}</td>
              <td className={`${td} w-1/3`}>{r.mean !== null ? <Bar value={r.mean} max={4} label={fmtDecimal(r.mean)} /> : <span className="text-sm text-text-subtle">suprimido</span>}</td>
              <td className={`${td} text-right tabular`}>{r.mean === null ? '—' : fmtDecimal(r.mean)}</td>
              <td className={`${td} text-right tabular`}>{'sd' in r && r.sd != null ? fmtDecimal(r.sd) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div className="flex flex-wrap items-center gap-4">
        <Button
          variant="secondary"
          icon={<Download size={17} aria-hidden="true" />}
          onClick={() => {
            const csv = toAggregateCSV(data, dim, domain)
            downloadFile(`perceber-agregado-${dim}-${domain}.csv`, csv, 'text/csv')
            logResearchExport(DIMENSIONS[dim].label, DOMAIN_BY_ID[domain].label, rows.length)
            notify('Exportação registrada')
          }}
        >
          Exportar tabela agregada (CSV)
        </Button>
        <span className="text-sm text-text-subtle">Só tabelas agregadas, com supressão aplicada, podem ser exportadas. Cada exportação é registrada.</span>
      </div>
      <p className="text-sm text-text-subtle">
        Em uso real, a supressão também precisa ser complementar: esconder células que permitiriam deduzir uma célula pequena por subtração.
      </p>
    </div>
  )
}

function Equity({ data }: { data: ReturnType<typeof generateSynthetic> }) {
  const [dim, setDim] = useState<Dimension>('gender')
  const central = domainsIn('central')
  const groups = DIMENSIONS[dim].values
  const table = central.map((d) => ({ d, rows: domainMeanBy(data, dim, d.id) }))
  return (
    <div className="grid gap-8">
      <Callout tone="neutral" title="Diferenças entre grupos não são interpretáveis ainda">
        Sem estudo de invariância de medida e de funcionamento diferencial dos itens, uma média diferente pode vir do próprio instrumento, e não de uma diferença real entre grupos. Esta tabela serve para monitorar, não para concluir.
      </Callout>
      <div className="max-w-sm">
        <Select label="Comparar por" value={dim} onChange={(e) => setDim(e.target.value as Dimension)} options={(Object.keys(DIMENSIONS) as Dimension[]).map((d) => ({ value: d, label: DIMENSIONS[d].label }))} />
      </div>
      <Table caption={`Média por domínio do eixo central e ${DIMENSIONS[dim].label.toLowerCase()} (0–4). Traço = grupo suprimido (n < ${SMALL_CELL}).`}>
        <thead>
          <tr>
            <th className={th} scope="col">Domínio</th>
            {groups.map((g) => (
              <th key={g} className={`${th} text-right`} scope="col">
                {g}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.map(({ d, rows }) => (
            <tr key={d.id}>
              <th scope="row" className={`${td} text-left font-semibold`}>
                {d.label}
              </th>
              {rows.map((r) => (
                <td key={r.value} className={`${td} text-right tabular`}>
                  {r.mean === null ? <span className="text-text-subtle">—</span> : fmtDecimal(r.mean)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}

function Exports() {
  const { researchExports } = useStore()
  if (!researchExports.length) {
    return (
      <div className="flex items-center gap-3 text-text-muted">
        <Database size={18} aria-hidden="true" />
        Nenhuma exportação registrada. Exportações feitas em Agregados aparecem aqui.
      </div>
    )
  }
  return (
    <Table caption="Registro de exportações da área de pesquisa">
      <thead>
        <tr>
          <th className={th} scope="col">Quando</th>
          <th className={th} scope="col">Agrupamento</th>
          <th className={th} scope="col">Domínio</th>
          <th className={`${th} text-right`} scope="col">
            Linhas
          </th>
        </tr>
      </thead>
      <tbody>
        {[...researchExports].reverse().map((e) => (
          <tr key={e.id}>
            <td className={td}>{fmtDateTime(e.at)}</td>
            <td className={td}>{e.dimension}</td>
            <td className={td}>{e.domain}</td>
            <td className={`${td} text-right tabular`}>{e.rows}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
