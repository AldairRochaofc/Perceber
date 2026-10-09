import { CircleCheck, TriangleAlert } from 'lucide-react'
import { MODULE_BY_ID } from '../../domain/modules'
import { FREQUENT_CUTOFF, MIN_ANSWERED_PER_DOMAIN, MIN_COMPLETENESS, QUALITY_FLAG_TEXT, QUALITY_LEVEL_LABEL } from '../../domain/scoring'
import { CUTOFF_NOTICE } from '../../domain/signals'
import type { AssessmentSession, ScoreResult } from '../../domain/types'
import { fmtDecimal, fmtInt } from '../../lib/format'
import { Meta } from '../../ui/Surface'
import { cx } from '../../ui/cx'

export function QualityPanel({ result }: { result: ScoreResult }) {
  const q = result.quality
  const ok = q.level === 'adequate'
  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-3">
        {ok ? <CircleCheck size={22} aria-hidden="true" className="text-success" /> : <TriangleAlert size={22} aria-hidden="true" className="text-attention" />}
        <p className="font-display text-title">
          Qualidade dos dados: <span className={ok ? 'text-success' : 'text-attention'}>{QUALITY_LEVEL_LABEL[q.level]}</span>
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        <Meta label="Perguntas apresentadas">{fmtInt(q.presented)}</Meta>
        <Meta label="Respondidas">{fmtInt(q.answered)}</Meta>
        <Meta label="Sem resposta">{fmtInt(q.skipped)}</Meta>
        <Meta label="Tempo mediano por pergunta">{q.medianLatencyMs === null ? '—' : `${fmtDecimal(q.medianLatencyMs / 1000)} s`}</Meta>
      </dl>
      {q.flags.length > 0 ? (
        <ul className="grid gap-3">
          {q.flags.map((f) => (
            <li key={f} className="rounded-md bg-attention-soft p-4 ring-1 ring-attention-line">
              <p className="font-semibold text-ink">{QUALITY_FLAG_TEXT[f].title}</p>
              <p className="text-sm text-text-muted">{QUALITY_FLAG_TEXT[f].body}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-text-muted">Nenhum padrão de resposta pede atenção. Isso não muda os escores; só indica que os dados parecem consistentes.</p>
      )}
    </div>
  )
}

export function UncertaintyPanel() {
  return (
    <dl className="grid gap-6 sm:grid-cols-2">
      {[
        {
          t: 'Erro de medida',
          b: 'Não estimado. O módulo ainda não tem estudo de confiabilidade, então não exibimos intervalos de erro nem índices de precisão.',
        },
        {
          t: 'Comparação com outras pessoas',
          b: 'Indisponível. Não há norma populacional. As faixas descrevem a sua média na própria escala de resposta.',
        },
        {
          t: 'Peso de cada resposta',
          b: 'Com três a cinco perguntas por domínio, uma única resposta pode mover a média em mais de um ponto. A linha de cada domínio mostra essa dispersão.',
        },
        { t: 'Pontos de corte', b: CUTOFF_NOTICE },
      ].map((x) => (
        <div key={x.t} className="grid content-start gap-1.5 border-t border-line pt-4">
          <dt className="font-semibold text-ink">{x.t}</dt>
          <dd className="text-sm leading-relaxed text-text-muted">{x.b}</dd>
        </div>
      ))}
    </dl>
  )
}

export function ContextFactorsPanel({ session, forReport }: { session: AssessmentSession; forReport?: boolean }) {
  const ctx = session.context
  const comment = ctx?.comment && (!forReport || ctx.includeComment) ? ctx.comment : null
  if (!ctx || (!ctx.factors.length && !comment)) {
    return <p className="text-text-muted">Nenhum fator de contexto informado.</p>
  }
  return (
    <div className="grid gap-4">
      {ctx.factors.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {ctx.factors.map((f) => (
            <li key={f} className="rounded-full bg-surface-sunken px-3 py-1 text-sm text-text-muted ring-1 ring-line">
              {f}
            </li>
          ))}
        </ul>
      )}
      {comment && (
        <blockquote className="measure border-l-2 border-accent pl-4 font-display text-lead text-ink">
          “{comment}”
          {!ctx.includeComment && <span className="mt-2 block font-sans text-sm text-text-subtle">Só você vê este comentário. Ele não entra no relatório.</span>}
        </blockquote>
      )}
    </div>
  )
}

export function HowWeCalculated({ result, className }: { result: ScoreResult; className?: string }) {
  const m = MODULE_BY_ID[result.moduleId]
  return (
    <details className={cx('group rounded-lg ring-1 ring-line [&_summary::-webkit-details-marker]:hidden', className)}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-5 py-4 font-semibold text-ink hover:bg-surface-sunken">
        Como este resultado foi calculado
        <span aria-hidden="true" className="text-accent transition-transform duration-300 group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="grid gap-6 border-t border-line px-5 py-6">
        <ol className="measure grid list-decimal gap-2 pl-5 text-sm leading-relaxed text-text-muted marker:text-text-subtle">
          <li>Cada resposta vale de 0 (Nunca) a 4 (Quase sempre). Frases escritas no sentido oposto são invertidas.</li>
          <li>Por domínio, somamos as respostas (escore bruto) e calculamos a média. Sem pesos, sem porcentagens.</li>
          <li>A faixa descritiva é o rótulo da escala mais próximo da média.</li>
          {result.signal !== null && (
            <li>
              O sinal conta quantos domínios do eixo central ficaram com média de {fmtDecimal(FREQUENT_CUTOFF)} ou mais: até 1, baixa; 2 ou 3, moderada; 4 ou mais, elevada; 4 ou mais com impacto no dia a dia também frequente, avaliação profissional sugerida.
            </li>
          )}
          <li>
            Sem sinal quando algum domínio central tem menos de {MIN_ANSWERED_PER_DOMAIN} respostas ou menos de {Math.round(MIN_COMPLETENESS * 100)}% das perguntas foram respondidas.
          </li>
          <li>A qualidade dos dados é mostrada ao lado e nunca altera os escores.</li>
        </ol>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Meta label="Módulo" mono>
            {m.code} v{result.moduleVersion}
          </Meta>
          <Meta label="Banco de itens" mono>
            {result.itemBankVersion}
          </Meta>
          <Meta label="Algoritmo" mono>
            {result.algorithmVersion}
          </Meta>
          <Meta label="Impressão digital das respostas" mono>
            <span className="break-all">{result.inputHash.slice(0, 24)}…</span>
          </Meta>
        </dl>
        <p className="text-sm text-text-subtle">
          As mesmas respostas, com as mesmas versões, produzem sempre o mesmo resultado. A impressão digital (SHA-256) permite conferir isso.
        </p>
      </div>
    </details>
  )
}
