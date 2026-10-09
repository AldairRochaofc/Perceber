import { useId } from 'react'
import { CONSENT_VERSION, DISCLOSURE, type ConsentDefinition } from '../../domain/consents'
import { cx } from '../../ui/cx'

export type ConsentAnswer = 'granted' | 'declined' | null

/** O que a pessoa precisa saber antes de confirmar. Sempre visível, nunca escondido em link. */
export function DisclosureGrid() {
  return (
    <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
      {DISCLOSURE.map((d) => (
        <div key={d.title} className="grid content-start gap-1.5 border-t border-line pt-4">
          <dt className="font-semibold text-ink">{d.title}</dt>
          <dd className="text-sm leading-relaxed text-text-muted">{d.body}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * Um consentimento = uma decisão explícita. Nada vem marcado por padrão,
 * e "Não" tem o mesmo peso visual que "Sim".
 */
export function ConsentCard({
  def,
  value,
  onChange,
  error,
}: {
  def: ConsentDefinition
  value: ConsentAnswer
  onChange: (v: Exclude<ConsentAnswer, null>) => void
  error?: string
}) {
  const id = useId()
  return (
    <fieldset
      className={cx(
        'grid gap-4 rounded-lg bg-surface p-5 ring-1 sm:p-6',
        error ? 'ring-danger' : value ? 'ring-accent-line' : 'ring-line-strong',
      )}
      aria-describedby={`${id}-text${def.note ? ` ${id}-note` : ''}${error ? ` ${id}-err` : ''}`}
    >
      <legend className="sr-only">{def.title}</legend>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p aria-hidden="true" className="font-display text-title text-ink">
          {def.title}
        </p>
        <span className={cx('rounded-full px-2.5 py-1 text-caption font-semibold ring-1 ring-inset', def.required ? 'bg-accent-soft text-accent-strong ring-accent-line' : 'bg-surface-sunken text-text-muted ring-line')}>
          {def.required ? 'Necessário' : 'Opcional'}
        </span>
      </div>
      <p id={`${id}-text`} className="text-text-muted">
        {def.text}
      </p>
      {def.note && (
        <p id={`${id}-note`} className="rounded-md bg-surface-sunken px-4 py-3 text-sm text-text-muted">
          {def.note}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2.5 sm:max-w-md">
        {(['granted', 'declined'] as const).map((choice) => (
          <label
            key={choice}
            className="flex cursor-pointer items-center gap-3 rounded-md border border-line-strong px-4 py-3 font-semibold text-ink transition-colors hover:border-control has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:focus-visible]:ring-[var(--focus-width)] has-[:focus-visible]:ring-focus"
          >
            <input
              type="radio"
              name={`consent-${def.id}`}
              checked={value === choice}
              onChange={() => onChange(choice)}
              className="h-4 w-4 accent-[var(--color-accent)] focus-visible:outline-none"
            />
            {choice === 'granted' ? 'Sim, autorizo' : 'Não autorizo'}
          </label>
        ))}
      </div>
      {error && (
        <p id={`${id}-err`} role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </fieldset>
  )
}

export function ConsentVersion() {
  return <p className="label-data text-text-subtle">Termo {CONSENT_VERSION}</p>
}
