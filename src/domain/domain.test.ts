import { describe, expect, it } from 'vitest'
import { sha256, canonicalJSON } from '../lib/sha256'
import { appendAudit, verifyChain } from './audit'
import { deriveSequence, nextItem, pruneResponses, remainingRange, toMap } from './engine'
import { ITEMS, itemsFor } from './items'
import { MODULE_BY_ID, releaseBlockers } from './modules'
import { computeResult, ALGORITHM_VERSION, bandFor } from './scoring'
import { generateSynthetic, countBy, domainMeanBy, SMALL_CELL } from './synthetic'
import { consentTextHash, CONSENTS } from './consents'
import { accessCode, normalizeCode } from '../lib/ids'
import type { AnswerValue, ModuleId, Response } from './types'

const answerAll = (moduleId: ModuleId, pick: (itemId: string) => AnswerValue | null, latencyMs = 4000): Response[] => {
  const out: Response[] = []
  for (let guard = 0; guard < 200; guard++) {
    const item = nextItem(moduleId, out)
    if (!item) break
    out.push({ itemId: item.id, value: pick(item.id), answeredAt: '2026-10-09T12:00:00.000Z', latencyMs })
  }
  return out
}

describe('sha256', () => {
  it('confere com vetores conhecidos', () => {
    expect(sha256('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    expect(sha256('a'.repeat(1000))).toBe('41edece42d63e8d9bf515a9ba6932e1c20cbc9f5a5d134645adb5db1b9737ea3')
    expect(sha256('ação')).toHaveLength(64)
  })
  it('serialização canônica independe da ordem das chaves', () => {
    expect(canonicalJSON({ b: 1, a: [2, { d: 1, c: 2 }] })).toBe(canonicalJSON({ a: [2, { c: 2, d: 1 }], b: 1 }))
  })
})

describe('banco de itens', () => {
  it('tem ids únicos e 3 itens de núcleo por domínio', () => {
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length)
    for (const m of Object.values(MODULE_BY_ID)) for (const d of m.constructs) expect(itemsFor(d, 'core')).toHaveLength(3)
  })
})

describe('motor de apresentação', () => {
  it('sem sinal, apresenta só o núcleo (24 perguntas no eixo central)', () => {
    const r = answerAll('central', () => 0)
    expect(r).toHaveLength(24)
  })
  it('com sinal em todos os domínios, apresenta o máximo (38)', () => {
    const r = answerAll('central', (id) => (id === 'c3' || id === 'o3' ? 0 : 4))
    expect(r).toHaveLength(38)
  })
  it('a faixa declarada no módulo bate com o motor', () => {
    expect(MODULE_BY_ID.central.questions).toEqual([24, 38])
    expect(answerAll('cooccurring', () => 2)).toHaveLength(15)
  })
  it('descarta aprofundamentos que deixam de se aplicar', () => {
    const r = answerAll('central', (id) => (id === 'c3' || id === 'o3' ? 0 : 4))
    expect(r.some((x) => x.itemId === 's4')).toBe(true)
    const edited = r.map((x) => (x.itemId.startsWith('s') && ['s1', 's2', 's3'].includes(x.itemId) ? { ...x, value: 0 as AnswerValue } : x))
    const pruned = pruneResponses('central', edited)
    expect(pruned.some((x) => x.itemId === 's4')).toBe(false)
    expect(deriveSequence('central', toMap(pruned)).some((i) => i.id === 's4')).toBe(false)
  })
  it('informa quantas perguntas ainda podem aparecer', () => {
    expect(remainingRange('central', [])).toEqual([24, 38])
  })
})

describe('pontuação', () => {
  it('é reprodutível a partir das mesmas respostas e versões', () => {
    const r = answerAll('central', (id) => ((id.charCodeAt(0) + id.charCodeAt(1)) % 5) as AnswerValue)
    const a = computeResult('central', r, '2026-10-09T00:00:00.000Z')
    const b = computeResult('central', JSON.parse(JSON.stringify(r)), '2026-10-09T00:00:00.000Z')
    expect(b).toEqual(a)
    expect(a.algorithmVersion).toBe(ALGORITHM_VERSION)
    expect(a.inputHash).toHaveLength(64)
  })
  it('não calcula percentual: escores são soma, máximo e média 0–4', () => {
    const r = answerAll('central', () => 2)
    const res = computeResult('central', r)
    for (const d of res.domains) {
      expect(d.raw).toBeLessThanOrEqual(d.maxRaw)
      expect(d.mean).toBeGreaterThanOrEqual(0)
      expect(d.mean).toBeLessThanOrEqual(4)
    }
  })
  it('itens invertidos são pontuados ao contrário', () => {
    const r = answerAll('central', (id) => (id === 'c3' ? 4 : 0))
    const comm = computeResult('central', r).domains.find((d) => d.domain === 'communication')!
    expect(comm.raw).toBe(0)
  })
  it('sinal: baixa, moderada, elevada e sugerida seguem a regra documentada', () => {
    const low = computeResult('central', answerAll('central', (id) => (id === 'c3' || id === 'o3' ? 4 : 0)))
    expect(low.signal).toBe('low')
    const hi = (domains: string[], impact: AnswerValue) =>
      computeResult('central', answerAll('central', (id) => {
        const item = ITEMS.find((i) => i.id === id)!
        if (item.domain === 'impact') return impact
        const on = domains.includes(item.domain)
        const v: AnswerValue = on ? 4 : 0
        return item.reverse ? ((4 - v) as AnswerValue) : v
      }))
    expect(hi(['social', 'communication'], 0).signal).toBe('moderate')
    expect(hi(['social', 'communication', 'sensory', 'routine'], 0).signal).toBe('high')
    expect(hi(['social', 'communication', 'sensory', 'routine'], 4).signal).toBe('wide')
  })
  it('sem respostas suficientes, não indica sinal', () => {
    const r = answerAll('central', (id) => (id.startsWith('s') ? null : 2))
    expect(computeResult('central', r).signal).toBe('insufficient')
  })
  it('faixa descritiva é o rótulo da escala mais próximo da média', () => {
    expect(bandFor(0.2, 3)).toBe('never')
    expect(bandFor(2.49, 3)).toBe('sometimes')
    expect(bandFor(2.5, 3)).toBe('often')
    expect(bandFor(3.6, 3)).toBe('almost-always')
    expect(bandFor(3.6, 1)).toBe('insufficient')
  })
  it('sinaliza respostas idênticas e rápidas sem mudar escores', () => {
    const r = answerAll('central', () => 2, 600)
    const res = computeResult('central', r)
    expect(res.quality.flags).toContain('straight-lining')
    expect(res.quality.flags).toContain('very-fast')
    expect(res.quality.level).toBe('limited')
  })
  it('módulo coocorrente nunca gera sinal único', () => {
    expect(computeResult('cooccurring', answerAll('cooccurring', () => 4)).signal).toBeNull()
  })
})

describe('auditoria', () => {
  it('detecta adulteração na cadeia', () => {
    let log = appendAudit([], { role: 'participant', action: 'profile.created', at: '2026-10-09T00:00:00.000Z' })
    log = appendAudit(log, { role: 'participant', action: 'consent.granted', target: 'account', at: '2026-10-09T00:00:01.000Z' })
    log = appendAudit(log, { role: 'admin', action: 'audit.verified', at: '2026-10-09T00:00:02.000Z' })
    expect(verifyChain(log)).toEqual({ ok: true, count: 3 })
    const tampered = log.map((e) => (e.seq === 2 ? { ...e, target: 'research' } : e))
    expect(verifyChain(tampered)).toEqual({ ok: false, brokenAt: 2 })
  })
})

describe('pesquisa', () => {
  it('nunca exibe células com menos de 5 pessoas', () => {
    const data = generateSynthetic()
    for (const row of countBy(data, 'race')) if (row.n !== null) expect(row.n === 0 || row.n >= SMALL_CELL).toBe(true)
    for (const row of domainMeanBy(data, 'gender', 'social')) if (row.mean !== null) expect(row.n).toBeGreaterThanOrEqual(SMALL_CELL)
  })
  it('é determinístico', () => {
    expect(generateSynthetic(20)).toEqual(generateSynthetic(20))
  })
})

describe('consentimentos, liberação e códigos', () => {
  it('cada consentimento tem hash de texto próprio', () => {
    expect(new Set(CONSENTS.map((c) => consentTextHash(c.id))).size).toBe(CONSENTS.length)
  })
  it('bloqueia uso profissional sem evidências e aprovações', () => {
    const allApproved = { technical: { approved: true }, psychometric: { approved: true }, ethics: { approved: true }, legal: { approved: true }, security: { approved: true } }
    expect(releaseBlockers(MODULE_BY_ID.central, allApproved).length).toBeGreaterThan(0)
  })
  it('códigos de acesso evitam caracteres ambíguos e aceitam digitação livre', () => {
    const code = accessCode()
    expect(code).toMatch(/^PRC-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/)
    expect(normalizeCode(code.toLowerCase().replace(/-/g, ' '))).toBe(code)
  })
})
