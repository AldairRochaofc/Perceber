import { useState, type FormEvent } from 'react'
import { Download } from 'lucide-react'
import { ACTION_LABEL } from '../../domain/audit'
import { CONSENTS, CONSENT_BY_ID, consentState } from '../../domain/consents'
import { REASONS } from '../../domain/content'
import type { AgeBand } from '../../domain/types'
import { fmtDateTime } from '../../lib/format'
import { shortHash } from '../../lib/sha256'
import { downloadFile } from '../../lib/storage'
import { exportAllData, recordConsent, updateProfile, useStore } from '../../state/store'
import { Button } from '../../ui/Button'
import { Dialog } from '../../ui/Dialog'
import { Checkbox, Select, TextField } from '../../ui/Field'
import { PageHeader, SectionTitle } from '../../ui/PageHeader'
import { Badge, Callout } from '../../ui/Surface'
import { Table, td, th } from '../../ui/Table'
import { notify } from '../../ui/Toast'
import { AGE_OPTIONS } from '../onboarding/StartPage'

export function ProfilePage() {
  const state = useStore()
  return (
    <div className="container-page grid gap-16 pb-10">
      <PageHeader title="Meu perfil e privacidade." lead="Corrija seus dados, revise o que você autorizou e exerça seus direitos sobre as informações." />
      <ProfileForm />
      <ConsentManager />
      <Rights />
      <section aria-labelledby="atividade-title" className="grid gap-5">
        <SectionTitle id="atividade-title" title="Atividade na sua conta" lead="Registro somente-leitura, encadeado por hash. Mostra as 15 ações mais recentes." />
        <Table caption="Atividade recente" captionHidden>
          <thead>
            <tr>
              <th className={th} scope="col">Quando</th>
              <th className={th} scope="col">O que aconteceu</th>
              <th className={th} scope="col">Detalhe</th>
            </tr>
          </thead>
          <tbody>
            {state.audit
              .slice(-15)
              .reverse()
              .map((e) => (
                <tr key={e.seq}>
                  <td className={`${td} whitespace-nowrap`}>{fmtDateTime(e.at)}</td>
                  <td className={td}>{ACTION_LABEL[e.action] ?? e.action}</td>
                  <td className={`${td} text-text-muted`}>{[e.target, e.detail].filter(Boolean).join(' · ') || '—'}</td>
                </tr>
              ))}
          </tbody>
        </Table>
      </section>
    </div>
  )
}

function ProfileForm() {
  const { profile, consents } = useStore()
  const contactGranted = consentState(consents, 'contact')?.choice === 'granted'
  const [form, setForm] = useState({
    preferredName: profile?.preferredName ?? '',
    pronouns: profile?.pronouns ?? '',
    ageBand: profile?.ageBand ?? ('' as AgeBand | ''),
    reason: profile?.reason ?? '',
    civilName: profile?.civilName ?? '',
    contactChannel: profile?.contactChannel ?? '',
    supportName: profile?.supportContact?.name ?? '',
    supportPhone: profile?.supportContact?.phone ?? '',
  })
  const [supportConsent, setSupportConsent] = useState(!!profile?.supportContact)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!form.preferredName.trim()) next.preferredName = 'Informe como você quer ser chamado(a).'
    if (!form.ageBand) next.ageBand = 'Escolha uma faixa.'
    if ((form.supportName || form.supportPhone) && !supportConsent) next.support = 'Marque a autorização para guardar este contato, ou deixe os campos vazios.'
    setErrors(next)
    if (Object.keys(next).length) return
    updateProfile({
      preferredName: form.preferredName.trim(),
      pronouns: form.pronouns.trim() || undefined,
      ageBand: form.ageBand as AgeBand,
      reason: form.reason || undefined,
      civilName: form.civilName.trim() || undefined,
      contactChannel: contactGranted ? form.contactChannel.trim() || undefined : undefined,
      supportContact:
        supportConsent && form.supportName.trim()
          ? { name: form.supportName.trim(), phone: form.supportPhone.trim(), consentAt: profile?.supportContact?.consentAt ?? new Date().toISOString() }
          : undefined,
    })
    notify('Perfil atualizado')
  }

  return (
    <form onSubmit={save} noValidate aria-labelledby="dados-title" className="grid gap-8">
      <SectionTitle id="dados-title" title="Seus dados" lead="Coletamos o mínimo. Só o nome de preferência e a faixa etária são necessários." />
      <div className="grid gap-6 md:grid-cols-2">
        <TextField label="Nome de preferência" value={form.preferredName} onChange={set('preferredName')} error={errors.preferredName} />
        <TextField label="Pronomes" optional value={form.pronouns} onChange={set('pronouns')} />
        <Select label="Faixa etária" value={form.ageBand} onChange={set('ageBand')} options={AGE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} error={errors.ageBand} />
        <Select label="O que trouxe você até aqui?" optional value={form.reason} onChange={set('reason')} options={[{ value: '', label: 'Prefiro não dizer' }, ...REASONS.map((r) => ({ value: r, label: r }))]} />
        <TextField
          label="Nome civil"
          optional
          hint="Não é necessário para usar o PERCEBER. Preencha só se um serviço exigir no relatório."
          value={form.civilName}
          onChange={set('civilName')}
          autoComplete="name"
        />
        {contactGranted ? (
          <TextField label="Canal para convites de estudos" optional value={form.contactChannel} onChange={set('contactChannel')} />
        ) : (
          <p className="self-end rounded-md bg-surface-sunken p-4 text-sm text-text-muted">Para informar um canal de convites, autorize primeiro o contato para estudos futuros, logo abaixo.</p>
        )}
      </div>
      <fieldset className="grid gap-4 rounded-lg bg-surface p-5 ring-1 ring-line sm:p-6">
        <legend className="sr-only">Contato de apoio</legend>
        <p aria-hidden="true" className="font-display text-title">
          Contato de apoio <span className="font-sans text-sm text-text-subtle">opcional</span>
        </p>
        <p className="text-sm text-text-muted">
          Alguém que você gostaria de ter à mão em um momento difícil. Ele aparece só para você, junto das orientações de ajuda. Nunca é acionado automaticamente.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <TextField label="Nome" optional value={form.supportName} onChange={set('supportName')} />
          <TextField label="Telefone" optional type="tel" value={form.supportPhone} onChange={set('supportPhone')} autoComplete="tel" />
        </div>
        <Checkbox
          label="Autorizo guardar este contato neste navegador"
          description="Consentimento específico. Desmarque e salve para apagar."
          checked={supportConsent}
          onChange={(e) => setSupportConsent(e.target.checked)}
        />
        {errors.support && (
          <p role="alert" className="text-sm font-medium text-danger">
            {errors.support}
          </p>
        )}
      </fieldset>
      <div>
        <Button type="submit">Salvar alterações</Button>
      </div>
    </form>
  )
}

function ConsentManager() {
  const { consents } = useStore()
  const list = CONSENTS.filter((c) => c.askedAt === 'onboarding')
  const [confirm, setConfirm] = useState<string | null>(null)

  return (
    <section aria-labelledby="consent-title" className="grid gap-6">
      <SectionTitle id="consent-title" title="Consentimentos" lead="O último registro de cada um é o que vale. Revogar vale para o futuro, imediatamente." />
      <ul className="grid gap-3">
        {list.map((c) => {
          const current = consentState(consents, c.id)
          const granted = current?.choice === 'granted'
          return (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-surface px-5 py-4 ring-1 ring-line">
              <div className="grid min-w-0 gap-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{c.title}</span>
                  <Badge tone={granted ? 'success' : 'neutral'}>{granted ? 'Autorizado' : current?.choice === 'revoked' ? 'Revogado' : 'Não autorizado'}</Badge>
                </span>
                {current && (
                  <span className="text-sm text-text-subtle">
                    Desde {fmtDateTime(current.at)} · <span className="label-data">{current.version}</span>
                  </span>
                )}
              </div>
              {granted ? (
                <Button variant="secondary" size="sm" onClick={() => (c.required ? setConfirm(c.id) : (recordConsent(c.id, 'revoked'), notify('Consentimento revogado')))}>
                  Revogar
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    recordConsent(c.id, 'granted')
                    notify('Consentimento concedido')
                  }}
                >
                  Autorizar
                </Button>
              )}
            </li>
          )
        })}
      </ul>

      <details className="group rounded-lg ring-1 ring-line [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-5 py-4 font-semibold hover:bg-surface-sunken">
          Histórico completo de consentimentos
          <span aria-hidden="true" className="text-accent transition-transform group-open:rotate-180">
            ▾
          </span>
        </summary>
        <div className="border-t border-line p-4">
          <Table caption="Cada registro guarda versão, data, hora, escolha e o hash do texto exibido">
            <thead>
              <tr>
                <th className={th} scope="col">Quando</th>
                <th className={th} scope="col">Consentimento</th>
                <th className={th} scope="col">Escolha</th>
                <th className={th} scope="col">Hash do texto</th>
              </tr>
            </thead>
            <tbody>
              {[...consents].reverse().map((r) => (
                <tr key={r.id}>
                  <td className={`${td} whitespace-nowrap`}>{fmtDateTime(r.at)}</td>
                  <td className={td}>
                    {CONSENT_BY_ID[r.consentId].title}
                    {r.context && <span className="block text-caption text-text-subtle">ligado a um compartilhamento</span>}
                  </td>
                  <td className={td}>{r.choice === 'granted' ? 'Autorizou' : r.choice === 'declined' ? 'Não autorizou' : 'Revogou'}</td>
                  <td className={`${td} label-data`}>{shortHash(r.textHash)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </details>

      <Dialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        size="sm"
        title="Revogar este consentimento?"
        description="Sem ele você não poderá criar novas avaliações. Seus dados atuais continuam aqui até você excluí-los."
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Manter
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                recordConsent(confirm as 'account' | 'modules', 'revoked')
                setConfirm(null)
                notify('Consentimento revogado')
              }}
            >
              Revogar
            </Button>
          </>
        }
      />
    </section>
  )
}

function Rights() {
  return (
    <section aria-labelledby="direitos-title" className="grid gap-6">
      <SectionTitle id="direitos-title" title="Seus direitos sobre os dados" lead="Acesso, correção e portabilidade. Nesta demonstração, tudo acontece no seu navegador." />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid content-start gap-3 rounded-lg bg-surface p-6 ring-1 ring-line">
          <h3 className="font-sans text-ui font-semibold">Exportar meus dados</h3>
          <p className="text-sm text-text-muted">Um arquivo JSON com perfil, consentimentos, respostas, resultados, compartilhamentos e atividade.</p>
          <div>
            <Button
              variant="secondary"
              size="sm"
              icon={<Download size={16} aria-hidden="true" />}
              onClick={() => {
                downloadFile(`perceber-meus-dados-${new Date().toISOString().slice(0, 10)}.json`, exportAllData(), 'application/json')
                notify('Dados exportados')
              }}
            >
              Baixar meus dados
            </Button>
          </div>
        </div>
        <div className="grid content-start gap-3 rounded-lg bg-surface p-6 ring-1 ring-line">
          <h3 className="font-sans text-ui font-semibold">Dados coletados ficam registrados</h3>
          <p className="text-sm text-text-muted">Você autorizou a coleta antes de começar. Por isso, respostas e resultados já registrados não podem ser excluídos por aqui.</p>
        </div>
      </div>
      <Callout tone="neutral" title="Em uso real">
        Pedidos de informação e eventuais registros que precisem ser mantidos por obrigação legal serão tratados pelo encarregado de dados da instituição responsável, ainda a definir.
      </Callout>
    </section>
  )
}
