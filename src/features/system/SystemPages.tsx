import { Compass, Lock } from 'lucide-react'
import { HOME_FOR_ROLE, ROLE_LABEL } from '../../domain/roles'
import type { Role } from '../../domain/types'
import { RoleSwitcher } from '../../layout/RoleSwitcher'
import { useStore } from '../../state/store'
import { Button } from '../../ui/Button'
import { PageHeader } from '../../ui/PageHeader'
import { Callout } from '../../ui/Surface'

export function AccessDenied({ allowed }: { allowed: Role[] }) {
  const { role } = useStore()
  return (
    <div className="container-page grid max-w-3xl gap-8 pb-10">
      <PageHeader
        title="Esta área não faz parte do seu perfil."
        lead={`Você está como ${ROLE_LABEL[role]}. Esta página é para: ${allowed.map((r) => ROLE_LABEL[r]).join(', ')}. Cada perfil vê só o necessário para a sua função.`}
        size="md"
      />
      <Callout tone="neutral" title="Por que o acesso é separado" >
        Administradores não veem respostas individuais, pesquisadores não veem identidades e profissionais só veem o que a pessoa liberou. Isso protege dados de saúde, que são sensíveis pela LGPD.
      </Callout>
      <div className="flex flex-wrap items-center gap-3">
        <Button to={HOME_FOR_ROLE[role]} icon={<Lock size={18} aria-hidden="true" />}>
          Voltar para a minha área
        </Button>
        <RoleSwitcher />
      </div>
    </div>
  )
}

export function NotFound() {
  return (
    <div className="container-page grid max-w-3xl gap-8 pb-10">
      <PageHeader title="Não encontramos esta página." lead="O endereço pode ter mudado ou estar incompleto." size="md" />
      <div>
        <Button to="/" icon={<Compass size={18} aria-hidden="true" />}>
          Ir para o início
        </Button>
      </div>
    </div>
  )
}
