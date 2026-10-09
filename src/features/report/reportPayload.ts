import { DOMAIN_BY_ID } from '../../domain/domains'
import { MODULE_BY_ID, PLATFORM_VERSION } from '../../domain/modules'
import { BAND_LABEL, QUALITY_LEVEL_LABEL } from '../../domain/scoring'
import { DISCLAIMER } from '../../domain/content'
import { NEXT_STEP, SIGNALS } from '../../domain/signals'
import type { AssessmentSession, Profile } from '../../domain/types'
import { fmtDateTime, fmtDecimal } from '../../lib/format'
import { canonicalJSON, sha256 } from '../../lib/sha256'

/**
 * Conteúdo canônico do relatório. O hash SHA-256 deste objeto é a
 * impressão digital impressa em toda versão exportada: qualquer alteração
 * no conteúdo muda o hash.
 */
export function reportPayload(session: AssessmentSession, profile: Profile | null) {
  const r = session.result!
  const module = MODULE_BY_ID[session.moduleId]
  return {
    documento: 'Percepção inicial baseada nas respostas',
    plataforma: PLATFORM_VERSION,
    avaliacao: session.id,
    modulo: `${module.code} v${r.moduleVersion}`,
    bancoDeItens: r.itemBankVersion,
    algoritmo: r.algorithmVersion,
    respostasHash: r.inputHash,
    concluidaEm: session.completedAt,
    nome: profile?.preferredName ?? null,
    finalidade: profile?.reason ?? null,
    sinal: r.signal,
    qualidade: r.quality.level,
    dominios: r.domains.map((d) => ({ d: d.domain, bruto: d.raw, max: d.maxRaw, media: d.mean, respondidas: d.answered, puladas: d.skipped })),
    fatores: session.context?.factors ?? [],
    comentario: session.context?.includeComment ? session.context.comment || null : null,
  }
}

export const payloadHash = (payload: ReturnType<typeof reportPayload>) => sha256(canonicalJSON(payload))

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/** Arquivo HTML autônomo, legível offline e imprimível. */
export function reportHTML(session: AssessmentSession, profile: Profile | null, exportId: string, hash: string, exportedAt: string) {
  const p = reportPayload(session, profile)
  const r = session.result!
  const signal = r.signal ? SIGNALS[r.signal] : null
  const rows = r.domains
    .map((d) => {
      const dom = DOMAIN_BY_ID[d.domain]
      return `<tr><td><code>${dom.code}</code> ${esc(dom.label)}</td><td>${d.mean === null ? '—' : fmtDecimal(d.mean)}</td><td>${d.raw} de ${d.maxRaw}</td><td>${d.answered} / ${d.presented}</td><td>${esc(BAND_LABEL[d.band])}</td></tr>`
    })
    .join('')
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Percepção inicial baseada nas respostas — ${esc(p.nome ?? 'PERCEBER')}</title>
<style>
body{font:16px/1.6 system-ui,'Segoe UI',sans-serif;color:#0b1733;background:#fff;max-width:46rem;margin:2.5rem auto;padding:0 1rem}
h1,h2{font-family:Georgia,serif;font-weight:400;line-height:1.15}h1{font-size:2.1rem;margin:.2rem 0 1rem}h2{font-size:1.35rem;margin-top:2.2rem;border-top:1px solid #dbe2ef;padding-top:1rem}
.notice{border:2px solid #0a1a47;border-radius:12px;padding:1rem 1.2rem;font-weight:600}
table{width:100%;border-collapse:collapse;font-size:.92rem}th,td{text-align:left;padding:.5rem .4rem;border-bottom:1px solid #dbe2ef;vertical-align:top}
code,.mono{font-family:ui-monospace,Consolas,monospace;font-size:.85em}.muted{color:#34405c}.small{font-size:.85rem}
</style></head><body>
<p class="muted small">PERCEBER ${esc(PLATFORM_VERSION)} · documento exportado em ${esc(fmtDateTime(exportedAt))}</p>
<h1>Percepção inicial baseada nas respostas</h1>
<p class="notice">${esc(DISCLAIMER)} Este documento não é diagnóstico, laudo, atestado ou conclusão clínica.</p>
<h2>Identificação</h2>
<p>Nome de preferência: <strong>${esc(p.nome ?? 'não informado')}</strong><br>Avaliação concluída em ${esc(fmtDateTime(session.completedAt!))}<br>Módulo <code>${esc(p.modulo)}</code> · banco de itens <code>${esc(p.bancoDeItens)}</code> · algoritmo <code>${esc(p.algoritmo)}</code><br>Finalidade informada: ${esc(p.finalidade ?? 'não informada')}</p>
<h2>Sinal de triagem</h2>
<p>${signal ? `<strong>${esc(signal.label)}</strong>. ${esc(signal.summary)}` : 'Este módulo não gera sinal único: cada área tem indicador próprio.'}</p>
<p>Qualidade dos dados: ${esc(QUALITY_LEVEL_LABEL[r.quality.level])} (${r.quality.answered} de ${r.quality.presented} perguntas respondidas).</p>
<h2>Indicadores por domínio</h2>
<table><thead><tr><th>Domínio</th><th>Média (0–4)</th><th>Escore bruto</th><th>Respondidas</th><th>Faixa descritiva</th></tr></thead><tbody>${rows}</tbody></table>
<p class="small muted">Escores brutos e médias na escala de resposta. Sem norma populacional, sem estimativa de erro de medida. Pontos de corte provisórios, sem estudo de validade.</p>
<h2>Fatores de contexto</h2><p>${p.fatores.length ? p.fatores.map(esc).join('; ') : 'Nenhum informado.'}</p>
${p.comentario ? `<h2>Comentário incluído pela pessoa</h2><blockquote>${esc(p.comentario)}</blockquote>` : ''}
<h2>Próximo passo</h2><p>${esc(NEXT_STEP)}</p>
<h2>Integridade</h2>
<p class="small">Identificador da exportação: <code>${esc(exportId)}</code><br>Impressão digital do conteúdo (SHA-256):<br><code>${hash}</code></p>
<p class="small muted">Para conferir, compare esta impressão digital com a registrada em “Versões exportadas” no relatório dentro do PERCEBER, ou peça à pessoa avaliada que gere um acesso.</p>
</body></html>`
}
