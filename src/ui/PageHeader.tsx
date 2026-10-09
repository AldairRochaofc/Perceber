import { forwardRef, type ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from '../lib/router'
import { cx } from './cx'

/** Cabeçalho de página. O h1 recebe o foco a cada mudança de rota. */
export const PageHeader = forwardRef<HTMLHeadingElement, {
  title: ReactNode
  lead?: ReactNode
  back?: { to: string; label: string }
  meta?: ReactNode
  actions?: ReactNode
  size?: 'md' | 'lg'
  className?: string
}>(function PageHeader({ title, lead, back, meta, actions, size = 'lg', className }, ref) {
  return (
    <header className={cx('grid gap-5', className)}>
      {back && (
        <Link to={back.to} className="no-print inline-flex w-fit items-center gap-1.5 rounded-full py-1 pr-2 text-sm font-semibold text-text-muted no-underline hover:text-accent-strong">
          <ArrowLeft size={16} aria-hidden="true" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <div className="grid max-w-3xl gap-4">
          <h1 ref={ref} tabIndex={-1} data-page-title className={cx('font-light outline-none', size === 'lg' ? 'text-display-lg' : 'text-display-md')}>
            {title}
          </h1>
          {lead && <p className="measure text-lead text-text-muted">{lead}</p>}
        </div>
        {actions && <div className="no-print flex flex-wrap gap-3">{actions}</div>}
      </div>
      {meta && <div className="flex flex-wrap gap-x-8 gap-y-3">{meta}</div>}
    </header>
  )
})

/** Título de seção dentro de uma página. */
export function SectionTitle({ title, lead, id, aside }: { title: ReactNode; lead?: ReactNode; id?: string; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="grid max-w-2xl gap-2">
        <h2 id={id} className="text-display-sm">
          {title}
        </h2>
        {lead && <p className="text-text-muted">{lead}</p>}
      </div>
      {aside}
    </div>
  )
}
