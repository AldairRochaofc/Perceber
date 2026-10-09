import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from './cx'

/** Abas acessíveis: setas, Home e End movem o foco; só a aba ativa é tabulável. */
export function Tabs<T extends string>({
  label,
  tabs,
  value,
  onChange,
  children,
}: {
  label: string
  tabs: { id: T; label: ReactNode; count?: number }[]
  value: T
  onChange: (id: T) => void
  children: ReactNode
}) {
  const base = useId()
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const index = tabs.findIndex((t) => t.id === value)

  const onKey = (e: KeyboardEvent) => {
    let next = index
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length
    else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    else return
    e.preventDefault()
    onChange(tabs[next]!.id)
    refs.current[next]?.focus()
  }

  return (
    <div className="grid gap-6">
      <div className="relative -mx-1 overflow-x-auto px-1 pb-1">
        <div role="tablist" aria-label={label} className="inline-flex min-w-max gap-1 rounded-full bg-surface-sunken p-1 ring-1 ring-line">
          {tabs.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[i] = el
              }}
              role="tab"
              type="button"
              id={`${base}-tab-${t.id}`}
              aria-selected={t.id === value}
              aria-controls={`${base}-panel`}
              tabIndex={t.id === value ? 0 : -1}
              onClick={() => onChange(t.id)}
              onKeyDown={onKey}
              className={cx(
                'inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors duration-200',
                t.id === value ? 'bg-surface text-ink shadow-soft' : 'text-text-muted hover:text-ink',
              )}
            >
              {t.label}
              {t.count !== undefined && <span className="label-data rounded-full bg-surface-tint px-1.5 text-text-muted tabular">{t.count}</span>}
            </button>
          ))}
        </div>
      </div>
      <div role="tabpanel" id={`${base}-panel`} aria-labelledby={`${base}-tab-${value}`} tabIndex={0} className="focus-visible:outline-offset-8">
        {children}
      </div>
    </div>
  )
}
