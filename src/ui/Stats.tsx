import type { ReactNode } from 'react'
import { cx } from './cx'

/** Indicador numérico de painel. */
export function Kpi({ label, value, note, className }: { label: string; value: ReactNode; note?: ReactNode; className?: string }) {
  return (
    <div className={cx('grid content-start gap-1 rounded-lg bg-surface p-5 ring-1 ring-line', className)}>
      <dt className="text-sm font-semibold text-text-muted">{label}</dt>
      <dd className="font-display text-display-sm tabular text-ink">{value}</dd>
      {note && <dd className="text-sm text-text-subtle">{note}</dd>}
    </div>
  )
}

/** Barras horizontais com valor e porcentagem escritos (nunca só a barra). */
export function Bars({ title, rows, format }: { title: string; rows: { label: string; n: number }[]; format?: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.n))
  const total = rows.reduce((a, r) => a + r.n, 0)
  return (
    <figure className="grid content-start gap-4 rounded-lg bg-surface p-6 ring-1 ring-line">
      <figcaption className="font-semibold text-ink">{title}</figcaption>
      <ul className="grid gap-3">
        {rows.map((r) => (
          <li key={r.label} className="grid gap-1.5">
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-text-muted">{r.label}</span>
              <span className="tabular font-semibold text-ink">
                {format ? format(r.n) : r.n}
                {!format && total > 0 && <span className="font-normal text-text-subtle"> · {Math.round((r.n / total) * 100)}%</span>}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-surface-sunken" aria-hidden="true">
              <div className="h-full rounded-full bg-accent" style={{ width: `${(r.n / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </figure>
  )
}
