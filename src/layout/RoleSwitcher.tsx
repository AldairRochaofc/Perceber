import { useState } from 'react'
import { ShieldCheck, UserRound } from 'lucide-react'
import { HOME_FOR_ROLE, ROLES, ROLE_LABEL } from '../domain/roles'
import type { Role } from '../domain/types'
import { navigate } from '../lib/router'
import { switchRole, useStore } from '../state/store'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { ChoiceGroup } from '../ui/Field'
import { Callout } from '../ui/Surface'
import { cx } from '../ui/cx'

/** Troca de perfil da demonstração. Em produção, cada perfil é uma conta com MFA. */
export function RoleSwitcher({ className, onDone }: { className?: string; onDone?: () => void }) {
  const { role } = useStore()
  const [open, setOpen] = useState(false)
  const [choice, setChoice] = useState<Role>(role)

  const confirm = () => {
    switchRole(choice)
    setOpen(false)
    onDone?.()
    navigate(HOME_FOR_ROLE[choice])
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setChoice(role)
          setOpen(true)
        }}
        className={cx(
          'inline-flex h-11 items-center gap-2 rounded-full px-3.5 text-sm font-semibold text-text-muted ring-1 ring-line transition-colors hover:text-ink hover:ring-control',
          className,
        )}
      >
        <UserRound size={17} aria-hidden="true" />
        <span>
          <span className="sr-only">Perfil de acesso: </span>
          {ROLE_LABEL[role]}
        </span>
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Perfil de acesso"
        description="Nesta demonstração você pode ver o PERCEBER pelo olhar de cada perfil. Cada um enxerga só o que precisa."
        actions={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirm} disabled={choice === role}>
              Entrar como {ROLE_LABEL[choice]}
            </Button>
          </>
        }
      >
        <ChoiceGroup
          legend="Escolha um perfil"
          name="role"
          value={choice}
          onChange={setChoice}
          options={ROLES.map((r) => ({ value: r.id, label: r.label, description: r.description }))}
        />
        {ROLES.find((r) => r.id === choice)?.mfa && (
          <Callout tone="neutral" title="Em produção, este perfil exige autenticação multifator">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={16} aria-hidden="true" /> E cada acesso fica registrado no log de auditoria.
            </span>
          </Callout>
        )}
      </Dialog>
    </>
  )
}
