import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { Check } from 'lucide-react'
import { cx } from './cx'

/**
 * Campos de formulário. Todo campo tem rótulo visível, dica opcional e
 * mensagem de erro ligada por aria-describedby. Opcional/obrigatório é dito
 * em texto, não só por asterisco.
 */

type FieldShellProps = {
  id: string
  label: ReactNode
  hint?: ReactNode
  error?: string
  optional?: boolean
  children: ReactNode
  className?: string
}

export function FieldShell({ id, label, hint, error, optional, children, className }: FieldShellProps) {
  return (
    <div className={cx('grid gap-2', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
        {optional && <span className="ml-2 font-normal text-text-subtle">opcional</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="-mt-1 text-sm text-text-subtle">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

const control =
  'w-full rounded-md border border-control bg-surface px-4 text-ui text-ink placeholder:text-text-subtle transition-[border-color,box-shadow] duration-200 hover:border-ink focus-visible:border-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/30 aria-invalid:border-danger disabled:bg-surface-sunken disabled:text-text-disabled'

const describedBy = (id: string, hint?: unknown, error?: unknown) =>
  [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: ReactNode
  hint?: ReactNode
  error?: string
  optional?: boolean
}

export function TextField({ label, hint, error, optional, className, ...rest }: TextFieldProps) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <input id={id} className={cx(control, 'h-12')} aria-invalid={!!error || undefined} aria-describedby={describedBy(id, hint, error)} {...rest} />
    </FieldShell>
  )
}

type TextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
  label: ReactNode
  hint?: ReactNode
  error?: string
  optional?: boolean
}

export function TextArea({ label, hint, error, optional, className, maxLength, value, ...rest }: TextAreaProps) {
  const id = useId()
  const length = typeof value === 'string' ? value.length : 0
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <textarea
        id={id}
        className={cx(control, 'min-h-32 py-3 leading-relaxed')}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy(id, hint, error)}
        maxLength={maxLength}
        value={value}
        {...rest}
      />
      {maxLength && (
        <p className="label-data text-right text-text-subtle tabular" aria-live="polite">
          {length}/{maxLength}
        </p>
      )}
    </FieldShell>
  )
}

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & {
  label: ReactNode
  hint?: ReactNode
  error?: string
  optional?: boolean
  options: { value: string; label: string }[]
}

export function Select({ label, hint, error, optional, options, className, ...rest }: SelectProps) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <div className="relative">
        <select id={id} className={cx(control, 'h-12 appearance-none pr-11')} aria-invalid={!!error || undefined} aria-describedby={describedBy(id, hint, error)} {...rest}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg aria-hidden="true" viewBox="0 0 20 20" className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-text-subtle">
          <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </FieldShell>
  )
}

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'> & {
  label: ReactNode
  description?: ReactNode
  tone?: 'plain' | 'card'
}

export function Checkbox({ label, description, tone = 'plain', className, checked, ...rest }: CheckboxProps) {
  const id = useId()
  return (
    <div
      className={cx(
        'group relative flex gap-3.5',
        tone === 'card' && 'rounded-lg border border-line-strong bg-surface p-4 transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent-soft/60',
        className,
      )}
    >
      <span className="relative mt-0.5 grid h-6 w-6 shrink-0 place-items-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          className="peer absolute inset-0 h-6 w-6 cursor-pointer appearance-none rounded-xs border-2 border-control bg-surface transition-colors checked:border-accent checked:bg-accent focus-visible:outline-none"
          aria-describedby={description ? `${id}-desc` : undefined}
          {...rest}
        />
        <Check aria-hidden="true" size={15} strokeWidth={3} className="pointer-events-none relative text-on-accent opacity-0 peer-checked:opacity-100" />
        <span aria-hidden="true" className="pointer-events-none absolute -inset-1 rounded-sm ring-focus peer-focus-visible:ring-[var(--focus-width)]" />
      </span>
      <span className="grid gap-1">
        <label htmlFor={id} className="cursor-pointer font-semibold text-ink after:absolute after:inset-0 after:content-['']">
          {label}
        </label>
        {description && (
          <span id={`${id}-desc`} className="text-sm text-text-muted">
            {description}
          </span>
        )}
      </span>
    </div>
  )
}

type SwitchProps = {
  checked: boolean
  onChange: (next: boolean) => void
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
}

export function Switch({ checked, onChange, label, description, disabled }: SwitchProps) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-6">
      <span className="grid gap-1">
        <span id={`${id}-label`} className="font-semibold text-ink">
          {label}
        </span>
        {description && (
          <span id={`${id}-desc`} className="text-sm text-text-muted">
            {description}
          </span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 transition-colors duration-200',
          checked ? 'border-accent bg-accent' : 'border-control bg-surface-sunken',
          disabled && 'opacity-50',
        )}
      >
        <span
          aria-hidden="true"
          className={cx(
            'absolute h-5 w-5 rounded-full shadow-soft transition-transform duration-200 ease-calm',
            checked ? 'translate-x-[1.35rem] bg-on-accent' : 'translate-x-0.5 bg-surface ring-1 ring-control',
          )}
        />
        <span className="sr-only">{checked ? 'ligado' : 'desligado'}</span>
      </button>
    </div>
  )
}

type ChoiceOption<T extends string> = { value: T; label: ReactNode; description?: ReactNode }

/** Grupo de escolha única com cartões (radio nativo, setas funcionam). */
export function ChoiceGroup<T extends string>({
  legend,
  hint,
  name,
  value,
  onChange,
  options,
  columns = 1,
  error,
}: {
  legend: ReactNode
  hint?: ReactNode
  name: string
  value: T | null
  onChange: (v: T) => void
  options: ChoiceOption<T>[]
  columns?: 1 | 2 | 3
  error?: string
}) {
  const id = useId()
  return (
    <fieldset className="grid gap-3" aria-describedby={[hint ? `${id}-hint` : '', error ? `${id}-err` : ''].join(' ').trim() || undefined}>
      <legend className="mb-1 font-semibold text-ink">{legend}</legend>
      {hint && (
        <p id={`${id}-hint`} className="-mt-2 text-sm text-text-subtle">
          {hint}
        </p>
      )}
      <div className={cx('grid gap-2.5', columns === 2 && 'sm:grid-cols-2', columns === 3 && 'sm:grid-cols-3')}>
        {options.map((o) => {
          const oid = `${id}-${o.value}`
          return (
            <label
              key={o.value}
              htmlFor={oid}
              className="relative flex cursor-pointer gap-3 rounded-lg border border-line-strong bg-surface p-4 transition-colors hover:border-control has-[:checked]:border-accent has-[:checked]:bg-accent-soft/60 has-[:focus-visible]:ring-[var(--focus-width)] has-[:focus-visible]:ring-focus has-[:focus-visible]:ring-offset-2"
            >
              <input
                id={oid}
                type="radio"
                name={name}
                value={o.value}
                checked={value === o.value}
                onChange={() => onChange(o.value)}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-accent)] focus-visible:outline-none"
              />
              <span className="grid gap-0.5">
                <span className="font-semibold text-ink">{o.label}</span>
                {o.description && <span className="text-sm text-text-muted">{o.description}</span>}
              </span>
            </label>
          )
        })}
      </div>
      {error && (
        <p id={`${id}-err`} role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </fieldset>
  )
}
