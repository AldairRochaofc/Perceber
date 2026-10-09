import type { ReactNode } from 'react'
import { Plus } from 'lucide-react'

/** Pergunta e resposta com <details> nativo: funciona sem JavaScript e com leitores de tela. */
export function Disclosure({ summary, children, defaultOpen }: { summary: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group border-b border-line py-1 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-6 rounded-sm py-4 font-display text-title text-ink transition-colors hover:text-accent-strong">
        <span>{summary}</span>
        <Plus aria-hidden="true" size={22} className="mt-1 shrink-0 text-accent transition-transform duration-300 ease-calm group-open:rotate-45" />
      </summary>
      <div className="measure pb-6 text-text-muted">{children}</div>
    </details>
  )
}
