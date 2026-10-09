import { useId } from 'react'
import { cx } from './cx'

export const INFINITY_PATH =
  'M12 12c-1.6-2.1-2.8-3.15-4.15-3.15a3.15 3.15 0 1 0 0 6.3c1.35 0 2.55-1.05 4.15-3.15Zm0 0c1.6 2.1 2.8 3.15 4.15 3.15a3.15 3.15 0 1 0 0-6.3c-1.35 0-2.55 1.05-4.15 3.15Z'

/** Marca: o símbolo ∞ em um quadrado de cantos suaves, do azul elétrico ao profundo. */
export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={cx('shrink-0', className)}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2563eb" />
          <stop offset="1" stopColor="#0a1a47" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="7.2" fill={`url(#${id}-g)`} />
      <path d={INFINITY_PATH} fill="none" stroke="#fff" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Logo({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      <span className="font-display text-title leading-none font-book tracking-tight text-ink">Perceber</span>
    </span>
  )
}
