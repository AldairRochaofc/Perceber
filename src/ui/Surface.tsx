import type { HTMLAttributes, ReactNode } from 'react'
import { AlertTriangle, Info, LifeBuoy, CheckCircle2 } from 'lucide-react'
import { cx } from './cx'

/**
 * Superfícies por hierarquia (não um único "card" para tudo):
 *  - panel: conteúdo contido e interativo (raio lg)
 *  - feature: momento de destaque, com textura (raio xl)
 *  - inset: área recuada dentro de outra superfície (raio md)
 */
type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
  tone?: 'panel' | 'feature' | 'inset' | 'deep' | 'outline'
  as?: 'div' | 'section' | 'article' | 'aside'
}

const tones = {
  panel: 'rounded-lg bg-surface shadow-soft ring-1 ring-line',
  feature: 'grain overflow-hidden rounded-xl bg-surface shadow-lift ring-1 ring-line',
  inset: 'rounded-md bg-surface-sunken',
  deep: 'on-deep grain overflow-hidden rounded-xl bg-deep text-on-deep',
  outline: 'rounded-lg border border-line-strong',
}

export function Surface({ tone = 'panel', as: Tag = 'div', className, ...rest }: SurfaceProps) {
  return <Tag className={cx(tones[tone], 'print-plain', className)} {...rest} />
}

type CalloutTone = 'info' | 'attention' | 'safety' | 'success' | 'neutral'

const calloutTones: Record<CalloutTone, { box: string; icon: ReactNode }> = {
  info: { box: 'bg-accent-soft text-ink ring-accent-line', icon: <Info size={20} aria-hidden="true" className="text-accent" /> },
  attention: { box: 'bg-attention-soft text-ink ring-attention-line', icon: <AlertTriangle size={20} aria-hidden="true" className="text-attention" /> },
  safety: { box: 'bg-surface text-ink ring-line-strong', icon: <LifeBuoy size={20} aria-hidden="true" className="text-accent" /> },
  success: { box: 'bg-success-soft text-ink ring-success/30', icon: <CheckCircle2 size={20} aria-hidden="true" className="text-success" /> },
  neutral: { box: 'bg-surface-sunken text-ink ring-line', icon: <Info size={20} aria-hidden="true" className="text-text-subtle" /> },
}

export function Callout({
  tone = 'info',
  title,
  children,
  className,
  role,
  action,
}: {
  tone?: CalloutTone
  title?: ReactNode
  children?: ReactNode
  className?: string
  role?: 'status' | 'alert' | 'note'
  action?: ReactNode
}) {
  const t = calloutTones[tone]
  return (
    <div role={role} className={cx('print-plain flex gap-3.5 rounded-md p-4 ring-1 sm:p-5', t.box, className)}>
      <span className="mt-0.5 shrink-0">{t.icon}</span>
      <div className="grid min-w-0 gap-1.5">
        {title && <p className="font-semibold text-ink">{title}</p>}
        {children && <div className="text-sm leading-relaxed text-text-muted [&_strong]:text-ink">{children}</div>}
        {action && <div className="mt-1.5">{action}</div>}
      </div>
    </div>
  )
}

type BadgeTone = 'neutral' | 'accent' | 'attention' | 'success' | 'danger' | 'deep'

const badgeTones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-sunken text-text-muted ring-line',
  accent: 'bg-accent-soft text-accent-strong ring-accent-line',
  attention: 'bg-attention-soft text-attention ring-attention-line',
  success: 'bg-success-soft text-success ring-success/30',
  danger: 'bg-danger-soft text-danger ring-danger/30',
  deep: 'bg-deep text-on-deep ring-deep',
}

export function Badge({ tone = 'neutral', children, className, icon }: { tone?: BadgeTone; children: ReactNode; className?: string; icon?: ReactNode }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-semibold ring-1 ring-inset', badgeTones[tone], className)}>
      {icon}
      {children}
    </span>
  )
}

/** Par rótulo/valor para metadados. */
export function Meta({ label, children, mono }: { label: ReactNode; children: ReactNode; mono?: boolean }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-caption text-text-subtle">{label}</dt>
      <dd className={cx('text-sm font-semibold text-ink', mono && 'label-data font-medium')}>{children}</dd>
    </div>
  )
}

export function EmptyState({ title, children, action, icon }: { title: string; children?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="grid justify-items-start gap-3 rounded-lg border border-dashed border-line-strong bg-surface/60 p-6 sm:p-8">
      {icon && <span className="grid h-11 w-11 place-items-center rounded-md bg-accent-soft text-accent">{icon}</span>}
      <p className="font-display text-title text-ink">{title}</p>
      {children && <div className="measure text-text-muted">{children}</div>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
