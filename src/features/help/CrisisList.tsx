import { Phone } from 'lucide-react'
import { CRISIS } from '../../domain/content'

/** Orientação de segurança. Informativa: não avalia risco automaticamente. */
export function CrisisList() {
  return (
    <div className="grid gap-4">
      <ul className="grid gap-2.5">
        {CRISIS.items.map((c) => (
          <li key={c.label} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-surface-sunken p-4">
            <span className="grid gap-0.5">
              <span className="font-semibold text-ink">{c.label}</span>
              <span className="text-sm text-text-muted">{c.action}</span>
            </span>
            {c.href && (
              <a href={c.href} className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-on-accent no-underline hover:bg-accent-strong hover:text-on-accent">
                <Phone size={16} aria-hidden="true" />
                {c.cta}
              </a>
            )}
          </li>
        ))}
      </ul>
      <p className="text-sm text-text-muted">{CRISIS.outro}</p>
    </div>
  )
}
