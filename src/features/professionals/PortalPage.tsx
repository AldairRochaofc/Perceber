import { useMemo, useState, type FormEvent } from 'react'
import { BadgeCheck, Eye, KeyRound, LogOut } from 'lucide-react'
import { DOMAIN_BY_ID } from '../../domain/domains'
import { ITEM_BY_ID, SCALE_LABEL } from '../../domain/items'
import { MODULE_BY_ID } from '../../domain/modules'
import { BAND_LABEL, QUALITY_LEVEL_LABEL } from '../../domain/scoring'
import { SIGNALS } from '../../domain/signals'
import type { ShareGrant } from '../../domain/types'
import { fmtDateShort, fmtDateTime } from '../../lib/format'
import { shortHash } from '../../lib/sha256'
import { addObservation, getState, openShare, professionalName, sessionById, shareStatus, useStore } from '../../state/store'
import { Button } from '../../ui/Button'
import { DomainList } from '../../ui/DomainList'
import { TextArea, TextField } from '../../ui/Field'
import { PageHeader, SectionTitle } from '../../ui/PageHeader'
import { PatternSwatch } from '../../ui/patterns'
import { Badge, Callout, Surface } from '../../ui/Surface'
import { Table, td, th } from '../../ui/Table'
import { notify } from '../../ui/Toast'
import { ContextFactorsPanel, UncertaintyPanel } from '../results/Explain'
import { payloadHash, reportPayload } from '../report/reportPayload'
import { SCOPE_INFO } from '../sharing/SharingPage'

const REASONS = {
  'not-found': 'Código não encontrado. Confira as letras e números com a pessoa.',
  expired: 'Este acesso expirou. Peça à pessoa que gere um novo código, se ela quiser.',
  revoked: 'Este acesso foi revogado pela pessoa avaliada.',
} as const

export function PortalPage() {
  const state = useStore()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const grant = openId ? state.shares.find((g) => g.id === openId) ?? null : null
  const demoCodes = state.shares.filter((g) => shareStatus(g) === 'active')

  const open = (raw: string) => {
    const res = openShare(raw, 'Profissional (demonstração)')
    if (res.ok) {
      setError('')
      setOpenId(res.grant.id)
      window.scrollTo(0, 0)
    } else {
      setError(REASONS[res.reason])
    }
  }

  // revogado ou expirado enquanto aberto: a visualização para na hora
  if (grant && shareStatus(grant) !== 'active') {
    return (
      <div className="container-page grid max-w-3xl gap-8 pb-10">
        <PageHeader title="Este acesso não está mais disponível." lead={REASONS[shareStatus(grant) as 'expired' | 'revoked']} size="md" />
        <div>
          <Button onClick={() => setOpenId(null)}>Voltar ao portal</Button>
        </div>
      </div>
    )
  }

  if (grant) return <ProfessionalView grant={grant} onClose={() => setOpenId(null)} />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return setError('Digite o código de acesso.')
    open(code)
  }

  return (
    <div className="container-page grid gap-12 pb-10">
      <PageHeader title="Portal do profissional." lead="Informe o código de acesso que a pessoa avaliada compartilhou com você. Você verá só o que ela liberou, pelo prazo que ela definiu." />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Surface tone="feature" className="grid content-start gap-6 p-6 sm:p-9">
          <form onSubmit={submit} noValidate className="grid gap-5">
            <TextField
              label="Código de acesso"
              hint="Formato PRC-XXXX-XXXX. Letras maiúsculas ou minúsculas, com ou sem hífen."
              value={code}
              onChange={(e) => {
                setCode(e.target.value)
                setError('')
              }}
              error={error}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="[&_input]:font-mono [&_input]:tracking-[0.06em]"
            />
            <div>
              <Button type="submit" icon={<KeyRound size={18} aria-hidden="true" />}>
                Abrir relatório
              </Button>
            </div>
          </form>
          <p className="text-sm text-text-muted">Cada abertura fica registrada com data e hora e é visível para a pessoa avaliada. Ela pode revogar o acesso a qualquer momento.</p>
        </Surface>
        <div className="grid content-start gap-4">
          <Callout tone="attention" title="Cadastro profissional">
            A validação de identidade e de registro no conselho (CRP, CRM e outros) ainda não está implementada nesta demonstração. Em uso real, ela é obrigatória, com autenticação multifator.
          </Callout>
          <div className="grid gap-3 rounded-lg bg-surface p-5 ring-1 ring-line">
            <p className="font-semibold text-ink">Demonstração · códigos ativos neste navegador</p>
            {demoCodes.length ? (
              <ul className="grid gap-2">
                {demoCodes.map((g) => (
                  <li key={g.id}>
                    <button type="button" onClick={() => open(g.code)} className="flex w-full items-center justify-between gap-3 rounded-md bg-surface-sunken px-4 py-3 text-left hover:bg-surface-tint">
                      <span className="label-data text-ink">{g.code}</span>
                      <span className="text-sm text-text-muted">{SCOPE_INFO[g.scope].label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-text-muted">Nenhum. Para testar, entre como Participante, conclua uma triagem e gere um código em Compartilhar.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfessionalView({ grant, onClose }: { grant: ShareGrant; onClose: () => void }) {
  const state = useStore()
  const session = sessionById(state, grant.sessionId)
  const [note, setNote] = useState('')
  const result = session?.result
  const hash = useMemo(() => (session?.result ? payloadHash(reportPayload(session, getState().profile)) : ''), [session])
  const lastAccess = grant.accessLog.at(-1)

  if (!session || !result) {
    return (
      <div className="container-page grid max-w-3xl gap-6 pb-10">
        <PageHeader title="A avaliação ligada a este acesso foi excluída." size="md" />
        <div>
          <Button onClick={onClose}>Voltar ao portal</Button>
        </div>
      </div>
    )
  }

  const signal = result.signal ? SIGNALS[result.signal] : null
  const module = MODULE_BY_ID[session.moduleId]
  const scope = grant.scope
  const exported = state.exports.filter((e) => e.sessionId === session.id)

  return (
    <div className="container-page grid gap-12 pb-10">
      <PageHeader
        title={`Relatório de ${state.profile?.preferredName ?? 'pessoa avaliada'}`}
        lead={`${module.name} · concluída em ${fmtDateShort(session.completedAt!)}`}
        size="md"
        actions={
          <Button variant="secondary" onClick={onClose} icon={<LogOut size={18} aria-hidden="true" />}>
            Fechar relatório
          </Button>
        }
      />

      <Callout tone="info" title={`Acesso por ${professionalName(grant)} até ${fmtDateShort(grant.expiresAt)}`}>
        Escopo: <strong>{SCOPE_INFO[scope].label}</strong>. {SCOPE_INFO[scope].description}
        {lastAccess && (
          <span className="mt-1 flex items-center gap-1.5">
            <Eye size={15} aria-hidden="true" /> Esta abertura foi registrada em {fmtDateTime(lastAccess.at)} e é visível para a pessoa.
          </span>
        )}
      </Callout>

      <section aria-labelledby="pv-sintese" className="grid gap-6">
        <SectionTitle id="pv-sintese" title="Síntese" />
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="grid content-start gap-4 rounded-lg bg-surface p-6 ring-1 ring-line">
            {signal ? (
              <div className="flex items-center gap-4">
                <PatternSwatch pattern={signal.pattern} color={signal.colorVar} size={48} />
                <div>
                  <p className="text-sm text-text-subtle">Sinal de triagem</p>
                  <p className="font-display text-title" style={{ color: signal.textVar }}>
                    {signal.label}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-text-muted">Módulo sem sinal único.</p>
            )}
            <p className="text-sm text-text-muted">
              Qualidade dos dados: {QUALITY_LEVEL_LABEL[result.quality.level].toLowerCase()} · {result.quality.answered} de {result.quality.presented} respondidas.
            </p>
          </div>
          {scope === 'summary' ? (
            <ul className="grid rounded-lg bg-surface px-6 py-2 ring-1 ring-line">
              {result.domains.map((d) => (
                <li key={d.domain} className="flex items-baseline justify-between gap-4 border-b border-line py-3 last:border-0">
                  <span className="font-semibold text-ink">{DOMAIN_BY_ID[d.domain].label}</span>
                  <span className="text-sm text-text-muted">{BAND_LABEL[d.band]}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-lg bg-surface p-6 ring-1 ring-line">
              <UncertaintyPanel />
            </div>
          )}
        </div>
      </section>

      {scope !== 'summary' && (
        <>
          <section aria-labelledby="pv-dominios" className="grid gap-5">
            <SectionTitle id="pv-dominios" title="Indicadores por domínio" />
            <DomainList scores={result.domains} />
          </section>
          <section aria-labelledby="pv-contexto" className="grid gap-5">
            <SectionTitle id="pv-contexto" title="Fatores de contexto" />
            <ContextFactorsPanel session={{ ...session, context: session.context ? { ...session.context, comment: scope === 'full' ? session.context.comment : '' } : undefined }} forReport />
          </section>
        </>
      )}

      {scope === 'full' && (
        <section aria-labelledby="pv-respostas" className="grid gap-5">
          <SectionTitle id="pv-respostas" title="Respostas" lead="Na ordem em que foram apresentadas." />
          <Table caption="Respostas item a item" captionHidden>
            <thead>
              <tr>
                <th className={th} scope="col">Item</th>
                <th className={th} scope="col">Domínio</th>
                <th className={th} scope="col">Resposta</th>
              </tr>
            </thead>
            <tbody>
              {session.responses.map((r) => {
                const item = ITEM_BY_ID[r.itemId]!
                return (
                  <tr key={r.itemId}>
                    <td className={td}>
                      {item.text}
                      {item.reverse && <span className="block text-caption text-text-subtle">frase invertida na pontuação</span>}
                    </td>
                    <td className={`${td} whitespace-nowrap`}>{DOMAIN_BY_ID[item.domain].code}</td>
                    <td className={`${td} whitespace-nowrap`}>{r.value === null ? 'Prefiro não responder' : SCALE_LABEL(r.value)}</td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </section>
      )}

      <section aria-labelledby="pv-integridade" className="grid gap-3 rounded-lg bg-surface-sunken p-5 ring-1 ring-line">
        <h2 id="pv-integridade" className="inline-flex items-center gap-2 font-sans text-ui font-semibold">
          <BadgeCheck size={18} aria-hidden="true" className="text-success" />
          Integridade
        </h2>
        <p className="label-data break-all text-text-muted">SHA-256 do conteúdo: {hash}</p>
        <p className="text-sm text-text-muted">
          {exported.some((e) => e.hash === hash)
            ? `Confere com ${exported.filter((e) => e.hash === hash).length} versão(ões) exportada(s) pela pessoa (${shortHash(hash)}).`
            : 'A pessoa ainda não exportou este relatório. Se ela mostrar um arquivo, compare a impressão digital.'}
        </p>
      </section>

      <section aria-labelledby="pv-obs" className="grid gap-6">
        <SectionTitle id="pv-obs" title="Observações para a pessoa" lead="Ficam ligadas a este acesso e não alteram os indicadores." />
        <Callout tone="neutral">Esta triagem organiza autorrelato e não substitui julgamento clínico, entrevista, anamnese ou instrumentos aplicados por profissional habilitado. Não registre diagnóstico pela plataforma.</Callout>
        {grant.observations.length > 0 && (
          <ul className="grid gap-3">
            {grant.observations.map((o) => (
              <li key={o.id} className="rounded-lg bg-surface p-5 ring-1 ring-line">
                <p className="text-sm text-text-subtle">{fmtDateTime(o.at)}</p>
                <p className="text-ink">{o.text}</p>
              </li>
            ))}
          </ul>
        )}
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!note.trim()) return
            addObservation(grant.id, note.trim(), professionalName(grant))
            setNote('')
            notify('Observação registrada')
          }}
        >
          <TextArea label="Nova observação" hint="Por exemplo: sugestões de próximos passos, materiais de leitura ou como agendar uma conversa." value={note} onChange={(e) => setNote(e.target.value)} maxLength={600} />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="secondary" disabled={!note.trim()}>
              Registrar observação
            </Button>
            <Badge>Visível para a pessoa</Badge>
          </div>
        </form>
      </section>
    </div>
  )
}
