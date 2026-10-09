import { useState } from 'react'
import { Check, Lock, Minus, ShieldAlert, ShieldCheck, X } from 'lucide-react'
import { ACTION_LABEL, verifyChain } from '../../domain/audit'
import { CONSENT_VERSION } from '../../domain/consents'
import { ITEM_BANK_VERSION } from '../../domain/items'
import { CHECKLIST_LABEL, EVIDENCE_LABEL, LIFECYCLE, MODULES, PLATFORM_VERSION, USAGE_LABEL, releaseBlockers } from '../../domain/modules'
import { PERMISSIONS, ROLES, ROLE_LABEL, type Access } from '../../domain/roles'
import { ALGORITHM_VERSION } from '../../domain/scoring'
import type { AssessmentModule, ChecklistKey, EvidenceStatus } from '../../domain/types'
import { fmtDateShort, fmtDateTime } from '../../lib/format'
import { shortHash } from '../../lib/sha256'
import { logAuditVerification, setChecklist, useStore } from '../../state/store'
import { Button } from '../../ui/Button'
import { Switch } from '../../ui/Field'
import { PageHeader, SectionTitle } from '../../ui/PageHeader'
import { Badge, Callout, Meta } from '../../ui/Surface'
import { Table, td, th } from '../../ui/Table'
import { Tabs } from '../../ui/Tabs'
import { cx } from '../../ui/cx'

type Tab = 'modules' | 'release' | 'audit' | 'permissions' | 'pending'

export function GovernancePage() {
  const [tab, setTab] = useState<Tab>('modules')
  return (
    <div className="container-page grid gap-10 pb-10">
      <PageHeader
        title="Governança."
        lead="Módulos, versões, aprovações, permissões e auditoria. Respostas individuais ficam com a pessoa e com quem ela autorizar."
      />
      <dl className="grid gap-6 rounded-lg bg-surface p-5 ring-1 ring-line sm:grid-cols-4">
        <Meta label="Plataforma" mono>
          {PLATFORM_VERSION}
        </Meta>
        <Meta label="Banco de itens" mono>
          {ITEM_BANK_VERSION}
        </Meta>
        <Meta label="Algoritmo" mono>
          {ALGORITHM_VERSION}
        </Meta>
        <Meta label="Termo de consentimento" mono>
          {CONSENT_VERSION}
        </Meta>
      </dl>
      <Tabs
        label="Seções de governança"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'modules', label: 'Módulos e evidências' },
          { id: 'release', label: 'Liberação' },
          { id: 'audit', label: 'Auditoria' },
          { id: 'permissions', label: 'Permissões' },
          { id: 'pending', label: 'Pendências e riscos' },
        ]}
      >
        {tab === 'modules' && <ModulesEvidence />}
        {tab === 'release' && <Release />}
        {tab === 'audit' && <Audit />}
        {tab === 'permissions' && <Permissions />}
        {tab === 'pending' && <Pending />}
      </Tabs>
    </div>
  )
}

const evidenceTone = (s: EvidenceStatus): 'success' | 'accent' | 'neutral' | 'attention' =>
  s === 'documented' ? 'success' : s === 'in-progress' ? 'accent' : s === 'not-applicable' ? 'neutral' : 'attention'

function Lifecycle({ module }: { module: AssessmentModule }) {
  const current = LIFECYCLE.findIndex((l) => l.id === module.lifecycle)
  return (
    <ol className="grid grid-cols-4 gap-1.5 sm:grid-cols-8" aria-label={`Ciclo de vida de ${module.name}`}>
      {LIFECYCLE.map((l, i) => (
        <li key={l.id} className="grid gap-1.5" aria-current={i === current ? 'step' : undefined}>
          <span aria-hidden="true" className={cx('h-1.5 rounded-full', i < current ? 'bg-accent' : i === current ? 'bg-accent/45' : 'bg-surface-sunken ring-1 ring-line')} />
          <span className={cx('text-caption leading-tight', i === current ? 'font-semibold text-ink' : 'text-text-subtle')}>{l.label}</span>
        </li>
      ))}
    </ol>
  )
}

function ModulesEvidence() {
  return (
    <div className="grid gap-14">
      {MODULES.map((m) => (
        <section key={m.id} aria-labelledby={`ev-${m.id}`} className="grid gap-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="grid gap-1">
              <span className="label-data text-text-subtle">
                {m.code} v{m.version}
              </span>
              <h2 id={`ev-${m.id}`} className="text-display-sm">
                {m.name}
              </h2>
            </div>
            <Badge tone="accent">Status de uso: {USAGE_LABEL[m.usageStatus]}</Badge>
          </div>
          <Lifecycle module={m} />
          <Table caption="Repositório de evidências: campos mínimos exigidos antes de qualquer uso profissional">
            <thead>
              <tr>
                <th className={th} scope="col">Evidência</th>
                <th className={th} scope="col">Situação</th>
                <th className={th} scope="col">Nota</th>
              </tr>
            </thead>
            <tbody>
              {m.evidence.map((e) => (
                <tr key={e.key}>
                  <td className={`${td} font-semibold`}>{e.label}</td>
                  <td className={`${td} whitespace-nowrap`}>
                    <Badge tone={evidenceTone(e.status)}>{EVIDENCE_LABEL[e.status]}</Badge>
                  </td>
                  <td className={`${td} text-text-muted`}>{e.note}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </section>
      ))}
    </div>
  )
}

function Release() {
  const { checklist, role } = useStore()
  const canApprove = role === 'admin'
  return (
    <div className="grid gap-12">
      <section aria-labelledby="checklist-title" className="grid gap-6">
        <SectionTitle
          id="checklist-title"
          title="Checklist de liberação"
          lead={canApprove ? 'Cada aprovação fica registrada com data e responsável no log de auditoria.' : 'Somente o comitê registra aprovações. A administração acompanha.'}
        />
        <div className="grid gap-5 rounded-lg bg-surface p-6 ring-1 ring-line">
          {(Object.keys(CHECKLIST_LABEL) as ChecklistKey[]).map((k) => (
            <div key={k} className="border-b border-line pb-5 last:border-0 last:pb-0">
              <Switch
                label={`Aprovação ${CHECKLIST_LABEL[k].toLowerCase()}`}
                description={checklist[k].approved && checklist[k].at ? `Registrada por ${checklist[k].by} em ${fmtDateShort(checklist[k].at!)}` : 'Pendente'}
                checked={checklist[k].approved}
                onChange={(v) => setChecklist(k, v)}
                disabled={!canApprove}
              />
            </div>
          ))}
        </div>
      </section>
      {MODULES.map((m) => {
        const blockers = releaseBlockers(m, checklist)
        return (
          <section key={m.id} aria-labelledby={`rel-${m.id}`} className="grid gap-5">
            <SectionTitle id={`rel-${m.id}`} title={`Liberar ${m.name} para uso profissional`} />
            <div className="flex flex-wrap items-center gap-4">
              <Button disabled={blockers.length > 0} icon={<Lock size={17} aria-hidden="true" />} aria-describedby={`blk-${m.id}`}>
                Liberar para uso profissional
              </Button>
              <span id={`blk-${m.id}`} className="text-sm font-semibold text-attention">
                Bloqueado: {blockers.length} requisito{blockers.length === 1 ? '' : 's'} pendente{blockers.length === 1 ? '' : 's'}
              </span>
            </div>
            <ul className="grid gap-1.5 text-sm text-text-muted sm:columns-2 sm:block">
              {blockers.map((b) => (
                <li key={b} className="mb-1.5 flex break-inside-avoid gap-2">
                  <X size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-attention" />
                  {b}
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

function Audit() {
  const { audit, role } = useStore()
  const [verification, setVerification] = useState<ReturnType<typeof verifyChain> | null>(null)
  const counts = Object.entries(
    audit.reduce<Record<string, number>>((acc, e) => {
      acc[e.action] = (acc[e.action] ?? 0) + 1
      return acc
    }, {}),
  ).sort((a, b) => b[1] - a[1])

  const verify = () => {
    const r = verifyChain(audit)
    setVerification(r)
    logAuditVerification(r.ok)
  }

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="secondary" onClick={verify} icon={<ShieldCheck size={17} aria-hidden="true" />}>
          Verificar integridade do log
        </Button>
        <span className="text-sm text-text-subtle">Cada registro guarda o hash do anterior. Alterar um registro antigo quebra a cadeia.</span>
      </div>
      {verification && (
        <Callout tone={verification.ok ? 'success' : 'attention'} role="status" title={verification.ok ? `Cadeia íntegra: ${verification.count} registros conferidos` : `Quebra na cadeia no registro ${verification.brokenAt}`} />
      )}
      {role === 'admin' ? (
        <Table caption="Log de auditoria, do mais recente para o mais antigo. Detalhes de conteúdo nunca são registrados.">
          <thead>
            <tr>
              {['#', 'Quando', 'Perfil', 'Ação', 'Alvo', 'Hash'].map((h) => (
                <th key={h} className={th} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...audit].reverse().slice(0, 60).map((e) => (
              <tr key={e.seq}>
                <td className={`${td} tabular`}>{e.seq}</td>
                <td className={`${td} whitespace-nowrap`}>{fmtDateTime(e.at)}</td>
                <td className={td}>{ROLE_LABEL[e.role] ?? e.role}</td>
                <td className={td}>{ACTION_LABEL[e.action] ?? e.action}</td>
                <td className={`${td} text-text-muted`}>{e.target || '—'}</td>
                <td className={`${td} label-data`}>{shortHash(e.hash)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Table caption="O comitê vê apenas contagens por tipo de ação, sem registros individuais">
          <thead>
            <tr>
              <th className={th} scope="col">Ação</th>
              <th className={`${th} text-right`} scope="col">
                Ocorrências
              </th>
            </tr>
          </thead>
          <tbody>
            {counts.map(([action, n]) => (
              <tr key={action}>
                <td className={td}>{ACTION_LABEL[action] ?? action}</td>
                <td className={`${td} text-right tabular`}>{n}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  )
}

const ACCESS_ICON: Record<Access, { icon: React.ReactNode; label: string }> = {
  full: { icon: <Check size={16} aria-hidden="true" className="text-success" />, label: 'Acesso' },
  partial: { icon: <Minus size={16} aria-hidden="true" className="text-accent" />, label: 'Parcial' },
  none: { icon: <X size={16} aria-hidden="true" className="text-text-subtle" />, label: 'Sem acesso' },
}

function Permissions() {
  return (
    <div className="grid gap-6">
      <Table caption="Matriz de permissões por perfil (princípio do menor privilégio)">
        <thead>
          <tr>
            <th className={th} scope="col">Recurso</th>
            {ROLES.map((r) => (
              <th key={r.id} className={th} scope="col">
                {r.label}
              </th>
            ))}
            <th className={th} scope="col">Regra</th>
          </tr>
        </thead>
        <tbody>
          {PERMISSIONS.map((p) => (
            <tr key={p.resource}>
              <th scope="row" className={`${td} text-left font-semibold`}>
                {p.resource}
              </th>
              {ROLES.map((r) => (
                <td key={r.id} className={td}>
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    {ACCESS_ICON[p.access[r.id]].icon}
                    {ACCESS_ICON[p.access[r.id]].label}
                  </span>
                </td>
              ))}
              <td className={`${td} text-text-muted`}>{p.note}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <p className="text-sm text-text-subtle">
        Profissionais e administração exigem autenticação multifator em produção. Nesta demonstração, a troca de perfil é livre e fica registrada.
      </p>
    </div>
  )
}

export const PENDING_DECISIONS = [
  'Instituição controladora dos dados e encarregado (DPO).',
  'Base legal para cada finalidade de tratamento de dados de saúde.',
  'Manter a ramificação condicional antes da calibração, ou usar forma fixa até haver estudo de equivalência.',
  'Pontos de corte definitivos, e se haverá faixas, só depois de estudo com critério externo.',
  'Hospedagem, criptografia em repouso, gestão de chaves e backups com teste de restauração.',
  'Processo de validação de profissionais junto aos conselhos.',
  'Política de retenção e descarte por tipo de dado.',
  'Produção e validação de instruções em áudio e outras adaptações.',
  'Revisão da linguagem por pessoas autistas e por especialistas em linguagem simples.',
]

export const RISKS: { risk: string; mitigation: string }[] = [
  { risk: 'O sinal ser lido como diagnóstico.', mitigation: 'Avisos em todas as telas, faixas descritivas, relatório com declaração destacada. Falta testar a compreensão com usuários.' },
  { risk: 'Autorrelato afetado por camuflagem e pelo momento de vida, gerando falsos negativos.', mitigation: 'Domínio de camuflagem como contexto, recomendação não prescritiva e convite a refazer.' },
  { risk: 'Viés por gênero, raça/cor, escolaridade e cultura.', mitigation: 'Monitoramento por grupo; nenhuma norma antes de estudos de invariância e DIF.' },
  { risk: 'Dados de saúde em navegador compartilhado (protótipo).', mitigation: 'Aviso explícito, exclusão total em um passo. Autenticação e servidor seguro antes do uso real.' },
  { risk: 'Pessoa em sofrimento durante a avaliação.', mitigation: 'Pergunta de segurança antes de começar, ajuda sempre visível e pausa. Sem avaliação automatizada de risco.' },
  { risk: 'Reidentificação em pesquisa com grupos pequenos.', mitigation: 'Supressão de células menores que 5. Falta implementar supressão complementar.' },
  { risk: 'Uso do relatório como laudo.', mitigation: 'Declaração no documento e impressão digital para verificar adulteração.' },
]

function Pending() {
  const evidenceGaps = MODULES.flatMap((m) => m.evidence.filter((e) => e.status !== 'documented').map((e) => `${m.code}: ${e.label}`))
  return (
    <div className="grid gap-14">
      <section aria-labelledby="dec-title" className="grid gap-5">
        <SectionTitle id="dec-title" title="Decisões ainda pendentes" />
        <ul className="grid gap-2">
          {PENDING_DECISIONS.map((d) => (
            <li key={d} className="flex gap-3 border-b border-line pb-2 text-ink">
              <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {d}
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="risk-title" className="grid gap-5">
        <SectionTitle id="risk-title" title="Riscos não resolvidos e mitigação atual" />
        <Table caption="Matriz de riscos" captionHidden>
          <thead>
            <tr>
              <th className={th} scope="col">Risco</th>
              <th className={th} scope="col">Mitigação atual</th>
            </tr>
          </thead>
          <tbody>
            {RISKS.map((r) => (
              <tr key={r.risk}>
                <td className={`${td} font-semibold`}>
                  <span className="inline-flex gap-2">
                    <ShieldAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-attention" />
                    {r.risk}
                  </span>
                </td>
                <td className={`${td} text-text-muted`}>{r.mitigation}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </section>
      <section aria-labelledby="ev-gap-title" className="grid gap-5">
        <SectionTitle id="ev-gap-title" title="Evidências a coletar antes de qualquer uso clínico ou profissional" lead={`${evidenceGaps.length} itens nos dois módulos.`} />
        <ul className="grid gap-1.5 text-sm text-text-muted sm:block sm:columns-2">
          {evidenceGaps.map((g) => (
            <li key={g} className="mb-1.5 break-inside-avoid">
              · {g}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
