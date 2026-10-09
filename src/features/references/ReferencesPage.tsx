import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { DOMAINS } from '../../domain/domains'
import { MODULES } from '../../domain/modules'
import { REFERENCES, REFERENCE_TYPE_LABEL } from '../../domain/references'
import type { ReferenceType } from '../../domain/types'
import { TextField } from '../../ui/Field'
import { PageHeader } from '../../ui/PageHeader'
import { Callout, EmptyState } from '../../ui/Surface'
import { cx } from '../../ui/cx'

const TYPES = Object.keys(REFERENCE_TYPE_LABEL) as ReferenceType[]

export function ReferencesPage() {
  const [type, setType] = useState<ReferenceType | 'all'>('all')
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const list = REFERENCES.filter(
    (r) => (type === 'all' || r.types.includes(type)) && (!q || `${r.citation} ${r.title} ${r.relation}`.toLowerCase().includes(q)),
  ).sort((a, b) => b.year - a.year)

  const usedBy = (id: string) => [
    ...MODULES.filter((m) => m.sources.includes(id)).map((m) => m.code),
    ...DOMAINS.filter((d) => d.basis.includes(id)).map((d) => d.code),
  ]

  return (
    <div className="container-page grid gap-12 pb-10">
      <PageHeader
        title="Base científica."
        lead="Os itens do PERCEBER são de autoria própria. Estas fontes orientaram a organização dos domínios e as regras do sistema; nenhuma foi copiada nem adaptada de instrumento protegido."
      />
      <Callout tone="neutral" title="Vigência a verificar">
        Normas e diretrizes mudam. Antes de qualquer lançamento, a equipe responsável deve conferir a versão vigente de cada uma, registrar a data de acesso e a situação no SATEPSI.
      </Callout>
      <div className="grid gap-6">
        <div role="radiogroup" aria-label="Filtrar por tipo de evidência" className="flex flex-wrap gap-2">
          {(['all', ...TYPES] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={type === t}
              onClick={() => setType(t)}
              className={cx(
                'h-9 rounded-full px-3.5 text-sm font-semibold ring-1 transition-colors',
                type === t ? 'bg-accent text-on-accent ring-accent' : 'bg-surface text-text-muted ring-line hover:text-ink hover:ring-control',
              )}
            >
              {t === 'all' ? 'Todas' : REFERENCE_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        <TextField label="Buscar por autor, título ou uso" type="search" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-md" />
        <p className="text-sm text-text-subtle" aria-live="polite">
          {list.length} {list.length === 1 ? 'fonte' : 'fontes'}
        </p>
      </div>
      {list.length ? (
        <ol className="grid">
          {list.map((r) => {
            const used = usedBy(r.id)
            return (
              <li key={r.id} className="grid gap-4 border-t border-line py-7 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
                <div className="grid content-start gap-2">
                  <p className="text-sm text-text-muted">
                    {r.citation} · <span className="tabular">{r.year}</span>
                  </p>
                  <h2 className="text-title">
                    <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-baseline gap-1.5 text-ink hover:text-accent-strong">
                      {r.title}
                      <ExternalLink size={15} aria-hidden="true" className="shrink-0 translate-y-0.5 text-accent" />
                      <span className="sr-only">(abre em nova aba)</span>
                    </a>
                  </h2>
                  {r.doi && <p className="label-data text-text-subtle">DOI {r.doi}</p>}
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {r.types.map((t) => (
                      <li key={t} className="rounded-full bg-surface-sunken px-2.5 py-0.5 text-caption font-semibold text-text-muted ring-1 ring-line">
                        {REFERENCE_TYPE_LABEL[t]}
                      </li>
                    ))}
                  </ul>
                </div>
                <dl className="grid content-start gap-3 text-sm">
                  <div>
                    <dt className="text-text-subtle">População</dt>
                    <dd className="text-ink">{r.population}</dd>
                  </div>
                  <div>
                    <dt className="text-text-subtle">Limitações</dt>
                    <dd className="text-ink">{r.limitations}</dd>
                  </div>
                  <div>
                    <dt className="text-text-subtle">Relação com o PERCEBER</dt>
                    <dd className="text-ink">
                      {r.relation}
                      {used.length > 0 && <span className="label-data mt-1 block text-text-subtle">{used.join(' · ')}</span>}
                    </dd>
                  </div>
                </dl>
              </li>
            )
          })}
        </ol>
      ) : (
        <EmptyState title="Nenhuma fonte com esse filtro.">Escolha “Todas” ou busque outra palavra.</EmptyState>
      )}
    </div>
  )
}
