import { useState, type FormEvent } from 'react'
import { Copy, KeyRound, ShieldOff } from 'lucide-react'
import { CONSENT_BY_ID } from '../../domain/consents'
import { PROFESSIONALS } from '../../domain/content'
import { MODULE_BY_ID } from '../../domain/modules'
import type { ShareGrant, ShareScope } from '../../domain/types'
import { daysUntil, fmtDateShort, fmtDateTime, plural } from '../../lib/format'
import type { RouteMatch } from '../../lib/router'
import { completedSessions, createShare, professionalName, revokeShare, shareStatus, useStore } from '../../state/store'
import { Button } from '../../ui/Button'
import { Dialog } from '../../ui/Dialog'
import { Checkbox, ChoiceGroup, Select, TextField } from '../../ui/Field'
import { PageHeader, SectionTitle } from '../../ui/PageHeader'
import { Badge, Callout, EmptyState, Surface } from '../../ui/Surface'
import { Table, td, th } from '../../ui/Table'
import { notify } from '../../ui/Toast'

export const SCOPE_INFO: Record<ShareScope, { label: string; description: string }> = {
  summary: { label: 'Síntese', description: 'Sinal de triagem, faixas por domínio e qualidade dos dados. O mínimo necessário para começar a conversa.' },
  scores: { label: 'Síntese e pontuações', description: 'Inclui escores brutos, médias, limites e fatores de contexto.' },
  full: { label: 'Completo', description: 'Inclui também cada resposta e o comentário que você decidiu colocar no relatório.' },
}

const STATUS_LABEL = { active: 'Ativo', expired: 'Expirado', revoked: 'Revogado' } as const

export function SharingPage({ match }: { match: RouteMatch }) {
  const state = useStore()
  const sessions = completedSessions(state)
  const [created, setCreated] = useState<ShareGrant | null>(null)
  const grants = [...state.shares].reverse()

  return (
    <div className="container-page grid gap-16 pb-10">
      <PageHeader
        title="Você decide quem vê."
        lead="Nenhum profissional recebe seu relatório automaticamente. Você gera um código, escolhe o conteúdo e o prazo, e pode revogar a qualquer momento."
      />

      {sessions.length === 0 ? (
        <EmptyState
          title="Conclua uma avaliação para poder compartilhar."
          icon={<KeyRound size={20} aria-hidden="true" />}
          action={
            <Button to="/avaliacoes" size="sm">
              Ver avaliações
            </Button>
          }
        />
      ) : (
        <NewShare
          key={match.query.get('avaliacao') ?? 'new'}
          defaultSession={match.query.get('avaliacao') ?? sessions[0]!.id}
          defaultPro={match.query.get('profissional') ?? ''}
          onCreated={setCreated}
        />
      )}

      <section aria-labelledby="acessos-title" className="grid gap-6">
        <SectionTitle id="acessos-title" title="Quem possui acesso" lead="Revogar interrompe a visualização imediatamente, inclusive para quem já está com o relatório aberto." />
        {grants.length ? (
          <ul className="grid gap-4">
            {grants.map((g) => (
              <GrantCard key={g.id} grant={g} />
            ))}
          </ul>
        ) : (
          <EmptyState title="Nenhum acesso ativo." icon={<ShieldOff size={20} aria-hidden="true" />}>
            Seu relatório está visível apenas para você. Gere um acesso quando quiser levá-lo a uma consulta.
          </EmptyState>
        )}
      </section>

      <Dialog
        open={!!created}
        onClose={() => setCreated(null)}
        title="Acesso criado"
        description="Informe o código ao profissional pessoalmente ou por um canal que você confia. O PERCEBER não envia e-mails nem links públicos."
        actions={<Button onClick={() => setCreated(null)}>Entendi</Button>}
      >
        {created && (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-sunken p-5 ring-1 ring-line">
              <span className="font-mono text-display-sm tracking-[0.08em] text-ink" aria-label={`Código ${created.code.split('').join(' ')}`}>
                {created.code}
              </span>
              <Button
                variant="secondary"
                size="sm"
                icon={<Copy size={16} aria-hidden="true" />}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(created.code)
                    notify('Código copiado')
                  } catch {
                    notify('Não foi possível copiar. Selecione o código e copie manualmente.', 'info')
                  }
                }}
              >
                Copiar
              </Button>
            </div>
            <p className="text-sm text-text-muted">
              Válido até {fmtDateShort(created.expiresAt)} · {SCOPE_INFO[created.scope].label} · para {professionalName(created)}
            </p>
          </div>
        )}
      </Dialog>
    </div>
  )
}

function NewShare({ defaultSession, defaultPro, onCreated }: { defaultSession: string; defaultPro: string; onCreated: (g: ShareGrant) => void }) {
  const state = useStore()
  const sessions = completedSessions(state)
  const [sessionId, setSessionId] = useState(sessions.some((s) => s.id === defaultSession) ? defaultSession : sessions[0]!.id)
  const [pro, setPro] = useState(defaultPro)
  const [otherName, setOtherName] = useState('')
  const [scope, setScope] = useState<ShareScope>('summary')
  const [days, setDays] = useState('30')
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const consentDef = CONSENT_BY_ID.share

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!pro) next.pro = 'Escolha para quem é o acesso.'
    if (pro === 'other' && !otherName.trim()) next.other = 'Escreva o nome do profissional ou serviço.'
    if (!consent) next.consent = 'Marque a autorização para criar o acesso.'
    setErrors(next)
    if (Object.keys(next).length) return
    const grant = createShare({
      sessionId,
      professionalId: pro === 'other' ? null : pro,
      professionalLabel: pro === 'other' ? otherName.trim() : '',
      scope,
      days: Number(days),
    })
    setConsent(false)
    onCreated(grant)
  }

  return (
    <Surface tone="feature" as="section" aria-labelledby="novo-title" className="p-6 sm:p-10">
      <form onSubmit={submit} noValidate className="grid gap-8">
        <h2 id="novo-title" className="text-display-sm">
          Criar um acesso
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Select
            label="Qual avaliação"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            options={sessions.map((s) => ({ value: s.id, label: `${MODULE_BY_ID[s.moduleId].name} · ${fmtDateShort(s.completedAt!)}` }))}
          />
          <Select
            label="Para quem é este acesso?"
            value={pro}
            onChange={(e) => setPro(e.target.value)}
            error={errors.pro}
            hint="O diretório desta demonstração é fictício."
            options={[
              { value: '', label: 'Escolha um profissional' },
              ...PROFESSIONALS.map((p) => ({ value: p.id, label: `${p.name} (fictício)` })),
              { value: 'other', label: 'Outro profissional, fora do diretório' },
            ]}
          />
          {pro === 'other' && (
            <TextField label="Nome do profissional ou serviço" value={otherName} onChange={(e) => setOtherName(e.target.value)} error={errors.other} className="md:col-span-2" />
          )}
        </div>
        <ChoiceGroup
          legend="O que o profissional poderá ver"
          hint="Comece pelo mínimo. Você pode criar outro acesso depois."
          name="scope"
          value={scope}
          onChange={setScope}
          columns={3}
          options={(Object.keys(SCOPE_INFO) as ShareScope[]).map((k) => ({ value: k, label: SCOPE_INFO[k].label, description: SCOPE_INFO[k].description }))}
        />
        <ChoiceGroup
          legend="Validade"
          name="days"
          value={days}
          onChange={setDays}
          columns={3}
          options={[
            { value: '7', label: '7 dias' },
            { value: '30', label: '30 dias' },
            { value: '90', label: '90 dias' },
          ]}
        />
        <div className="grid gap-2">
          <Checkbox tone="card" label={consentDef.title} description={consentDef.text} checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          {errors.consent && (
            <p role="alert" className="text-sm font-medium text-danger">
              {errors.consent}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" icon={<KeyRound size={18} aria-hidden="true" />}>
            Gerar código de acesso
          </Button>
          <span className="text-sm text-text-subtle">Cada abertura fica registrada com data e hora, visível para você.</span>
        </div>
      </form>
    </Surface>
  )
}

function GrantCard({ grant }: { grant: ShareGrant }) {
  const status = shareStatus(grant)
  const [confirm, setConfirm] = useState(false)
  const left = daysUntil(grant.expiresAt)
  return (
    <li className="grid gap-5 rounded-lg bg-surface p-5 ring-1 ring-line sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1.5">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink">{professionalName(grant)}</span>
            <Badge tone={status === 'active' ? 'success' : status === 'revoked' ? 'danger' : 'neutral'}>{STATUS_LABEL[status]}</Badge>
          </span>
          <span className="text-sm text-text-muted">
            <span className="label-data text-ink">{grant.code}</span> · {SCOPE_INFO[grant.scope].label} · criado em {fmtDateShort(grant.createdAt)} ·{' '}
            {status === 'active' ? `expira em ${plural(left, 'dia', 'dias')}` : status === 'expired' ? `expirou em ${fmtDateShort(grant.expiresAt)}` : `revogado em ${fmtDateShort(grant.revokedAt!)}`}
          </span>
        </div>
        {status === 'active' && (
          <Button variant="danger" size="sm" onClick={() => setConfirm(true)}>
            Revogar
          </Button>
        )}
      </div>
      <details className="group [&_summary::-webkit-details-marker]:hidden">
        <summary className="w-fit cursor-pointer list-none rounded-sm text-sm font-semibold text-accent hover:text-accent-strong">
          Histórico de acessos ({grant.accessLog.length}) e observações ({grant.observations.length})
        </summary>
        <div className="mt-4 grid gap-4">
          {grant.accessLog.length ? (
            <Table caption="Aberturas do relatório por este acesso">
              <thead>
                <tr>
                  <th className={th} scope="col">Quando</th>
                  <th className={th} scope="col">Quem</th>
                </tr>
              </thead>
              <tbody>
                {[...grant.accessLog].reverse().map((a) => (
                  <tr key={a.at}>
                    <td className={td}>{fmtDateTime(a.at)}</td>
                    <td className={td}>{a.actor}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-sm text-text-muted">Ainda não foi aberto.</p>
          )}
          {grant.observations.map((o) => (
            <Callout key={o.id} tone="neutral" title={`Observação de ${o.author} · ${fmtDateShort(o.at)}`}>
              {o.text}
            </Callout>
          ))}
        </div>
      </details>
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        size="sm"
        title="Revogar este acesso?"
        description={`${professionalName(grant)} deixará de ver o relatório imediatamente. O histórico de acessos continua visível para você.`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Manter acesso
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                revokeShare(grant.id)
                setConfirm(false)
                notify('Acesso revogado')
              }}
            >
              Revogar acesso
            </Button>
          </>
        }
      />
    </li>
  )
}
