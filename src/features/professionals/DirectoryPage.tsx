import { useState } from 'react'
import { MapPin, Search } from 'lucide-react'
import { PROFESSIONALS } from '../../domain/content'
import { useStore } from '../../state/store'
import { Button } from '../../ui/Button'
import { ChoiceGroup, TextField } from '../../ui/Field'
import { PageHeader } from '../../ui/PageHeader'
import { Badge, Callout, EmptyState } from '../../ui/Surface'

export function DirectoryPage() {
  const { role, profile } = useStore()
  const [mode, setMode] = useState<'all' | 'presencial' | 'remoto'>('all')
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const list = PROFESSIONALS.filter(
    (p) =>
      (mode === 'all' || p.modality.includes(mode)) &&
      (!q || [p.name, p.profession, p.location, ...p.areas].some((t) => t.toLowerCase().includes(q))),
  )

  return (
    <div className="container-page grid gap-12 pb-10">
      <PageHeader
        back={role === 'participant' && profile ? { to: '/compartilhar', label: 'Compartilhar' } : undefined}
        title="Profissionais e serviços."
        lead="Para quem procura avaliação. Mostramos áreas, modalidade, acessibilidade e disponibilidade, sem avaliar qualidade clínica."
      />
      <Callout tone="attention" title="Diretório de demonstração">
        Todos os registros abaixo são fictícios. Em uso real, só entram profissionais e serviços com identidade e registro no conselho validados.
      </Callout>
      <div className="grid gap-6 md:grid-cols-[1fr_1.4fr] md:items-end">
        <TextField label="Buscar por área, profissão ou cidade" value={query} onChange={(e) => setQuery(e.target.value)} type="search" />
        <ChoiceGroup
          legend="Modalidade"
          name="mode"
          value={mode}
          onChange={setMode}
          columns={3}
          options={[
            { value: 'all', label: 'Todas' },
            { value: 'presencial', label: 'Presencial' },
            { value: 'remoto', label: 'Remoto' },
          ]}
        />
      </div>
      {list.length ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {list.map((p) => (
            <li key={p.id} className="grid content-start gap-4 rounded-lg bg-surface p-6 ring-1 ring-line">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid gap-1">
                  <h2 className="text-title">{p.name}</h2>
                  <p className="text-sm text-text-muted">
                    {p.profession} · <span className="label-data">{p.registry}</span>
                  </p>
                </div>
                <Badge tone="attention">Fictício</Badge>
              </div>
              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="text-text-subtle">Áreas</dt>
                  <dd className="text-ink">{p.areas.join(', ')}</dd>
                </div>
                <div>
                  <dt className="text-text-subtle">Modalidade</dt>
                  <dd className="text-ink">{p.modality.map((m) => (m === 'remoto' ? 'Remoto' : 'Presencial')).join(' e ')}</dd>
                </div>
                <div>
                  <dt className="text-text-subtle">Acessibilidade</dt>
                  <dd className="text-ink">{p.accessibility.join('; ')}</dd>
                </div>
                <div>
                  <dt className="text-text-subtle">Disponibilidade</dt>
                  <dd className="text-ink">{p.availability}</dd>
                </div>
              </dl>
              <p className="inline-flex items-center gap-1.5 text-sm text-text-muted">
                <MapPin size={15} aria-hidden="true" />
                {p.location}
              </p>
              {role === 'participant' && profile && (
                <div>
                  <Button to={`/compartilhar?profissional=${p.id}`} variant="secondary" size="sm">
                    Compartilhar com este serviço
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="Nenhum resultado para esses filtros." icon={<Search size={20} aria-hidden="true" />}>
          Tente outra palavra ou escolha “Todas” as modalidades.
        </EmptyState>
      )}
    </div>
  )
}
