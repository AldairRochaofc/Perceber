import{M as h,al as p,aS as f,aT as g,a2 as b,D as $,a4 as E,aa as x,ac as c,an as y,am as I,af as w}from"./index-Cc8zlm53.js";function v(e,n){const t=e.result,i=h[e.moduleId];return{documento:"Percepção inicial baseada nas respostas",plataforma:p,avaliacao:e.id,modulo:`${i.code} v${t.moduleVersion}`,bancoDeItens:t.itemBankVersion,algoritmo:t.algorithmVersion,respostasHash:t.inputHash,concluidaEm:e.completedAt,nome:n?.preferredName??null,finalidade:n?.reason??null,sinal:t.signal,qualidade:t.quality.level,dominios:t.domains.map(d=>({d:d.domain,bruto:d.raw,max:d.maxRaw,media:d.mean,respondidas:d.answered,puladas:d.skipped})),fatores:e.context?.factors??[],comentario:e.context?.includeComment&&e.context.comment||null}}const A=e=>f(g(e)),a=e=>e.replace(/[&<>"]/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[n]);function D(e,n,t,i,d){const o=v(e,n),s=e.result,l=s.signal?b[s.signal]:null,u=s.domains.map(r=>{const m=$[r.domain];return`<tr><td><code>${m.code}</code> ${a(m.label)}</td><td>${r.mean===null?"—":E(r.mean)}</td><td>${r.raw} de ${r.maxRaw}</td><td>${r.answered} / ${r.presented}</td><td>${a(x[r.band])}</td></tr>`}).join("");return`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Percepção inicial baseada nas respostas — ${a(o.nome??"PERCEBER")}</title>
<style>
body{font:16px/1.6 system-ui,'Segoe UI',sans-serif;color:#0b1733;background:#fff;max-width:46rem;margin:2.5rem auto;padding:0 1rem}
h1,h2{font-family:Georgia,serif;font-weight:400;line-height:1.15}h1{font-size:2.1rem;margin:.2rem 0 1rem}h2{font-size:1.35rem;margin-top:2.2rem;border-top:1px solid #dbe2ef;padding-top:1rem}
.notice{border:2px solid #0a1a47;border-radius:12px;padding:1rem 1.2rem;font-weight:600}
table{width:100%;border-collapse:collapse;font-size:.92rem}th,td{text-align:left;padding:.5rem .4rem;border-bottom:1px solid #dbe2ef;vertical-align:top}
code,.mono{font-family:ui-monospace,Consolas,monospace;font-size:.85em}.muted{color:#34405c}.small{font-size:.85rem}
</style></head><body>
<p class="muted small">PERCEBER ${a(p)} · documento exportado em ${a(c(d))}</p>
<h1>Percepção inicial baseada nas respostas</h1>
<p class="notice">${a(I)} Este documento não é diagnóstico, laudo, atestado ou conclusão clínica.</p>
<h2>Identificação</h2>
<p>Nome de preferência: <strong>${a(o.nome??"não informado")}</strong><br>Avaliação concluída em ${a(c(e.completedAt))}<br>Módulo <code>${a(o.modulo)}</code> · banco de itens <code>${a(o.bancoDeItens)}</code> · algoritmo <code>${a(o.algoritmo)}</code><br>Finalidade informada: ${a(o.finalidade??"não informada")}</p>
<h2>Sinal de triagem</h2>
<p>${l?`<strong>${a(l.label)}</strong>. ${a(l.summary)}`:"Este módulo não gera sinal único: cada área tem indicador próprio."}</p>
<p>Qualidade dos dados: ${a(y[s.quality.level])} (${s.quality.answered} de ${s.quality.presented} perguntas respondidas).</p>
<h2>Indicadores por domínio</h2>
<table><thead><tr><th>Domínio</th><th>Média (0–4)</th><th>Escore bruto</th><th>Respondidas</th><th>Faixa descritiva</th></tr></thead><tbody>${u}</tbody></table>
<p class="small muted">Escores brutos e médias na escala de resposta. Sem norma populacional, sem estimativa de erro de medida. Pontos de corte provisórios, sem estudo de validade.</p>
<h2>Fatores de contexto</h2><p>${o.fatores.length?o.fatores.map(a).join("; "):"Nenhum informado."}</p>
${o.comentario?`<h2>Comentário incluído pela pessoa</h2><blockquote>${a(o.comentario)}</blockquote>`:""}
<h2>Próximo passo</h2><p>${a(w)}</p>
<h2>Integridade</h2>
<p class="small">Identificador da exportação: <code>${a(t)}</code><br>Impressão digital do conteúdo (SHA-256):<br><code>${i}</code></p>
<p class="small muted">Para conferir, compare esta impressão digital com a registrada em “Versões exportadas” no relatório dentro do PERCEBER, ou peça à pessoa avaliada que gere um acesso.</p>
</body></html>`}export{D as a,A as p,v as r};
