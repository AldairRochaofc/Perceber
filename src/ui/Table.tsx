import type { ReactNode } from 'react'
import { cx } from './cx'

/** Tabela com rolagem horizontal própria (a página nunca rola de lado) e legenda. */
export function Table({ caption, captionHidden, children, className }: { caption: ReactNode; captionHidden?: boolean; children: ReactNode; className?: string }) {
  return (
    // Região rolável precisa receber foco para quem usa só o teclado (WCAG 2.1.1).
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <div className={cx('print-plain relative overflow-x-auto rounded-lg bg-surface ring-1 ring-line', className)} tabIndex={0} role="region" aria-label={typeof caption === 'string' ? caption : undefined}>
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <caption className={cx('px-5 pt-4 pb-2 text-left text-caption text-text-subtle', captionHidden && 'sr-only')}>{caption}</caption>
        {children}
      </table>
    </div>
  )
}

export const th = 'border-b border-line bg-surface-sunken/60 px-5 py-3 text-caption font-semibold text-text-muted'
export const td = 'border-b border-line px-5 py-3.5 align-top text-ink'
