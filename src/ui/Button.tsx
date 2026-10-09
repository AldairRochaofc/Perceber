import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from '../lib/router'
import { cx } from './cx'
import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'on-deep' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'relative inline-flex select-none items-center justify-center gap-2 max-w-full rounded-full text-center font-semibold leading-tight transition-[background-color,color,box-shadow,transform,border-color] duration-200 ease-calm active:translate-y-px disabled:pointer-events-none aria-disabled:pointer-events-none [&>svg]:shrink-0'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-on-accent shadow-glow hover:bg-accent-strong disabled:bg-surface-sunken disabled:text-text-disabled disabled:shadow-none aria-disabled:bg-surface-sunken aria-disabled:text-text-disabled aria-disabled:shadow-none',
  secondary:
    'bg-surface text-ink shadow-soft ring-1 ring-line-strong hover:ring-accent hover:text-accent-strong disabled:text-text-disabled disabled:shadow-none',
  quiet: 'text-text-muted hover:bg-surface-tint hover:text-accent-strong disabled:text-text-disabled',
  'on-deep': 'bg-white text-deep hover:bg-accent-soft disabled:opacity-60',
  danger: 'bg-surface text-danger ring-1 ring-danger/40 hover:bg-danger-soft disabled:text-text-disabled disabled:ring-line',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-4 py-1.5 text-sm',
  md: 'min-h-11 px-5 py-2 text-ui',
  lg: 'min-h-14 px-7 py-3 text-ui',
}

type Common = {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  iconAfter?: ReactNode
  loading?: boolean
  className?: string
  children: ReactNode
}

type AsButton = Common & ButtonHTMLAttributes<HTMLButtonElement> & { to?: undefined }
type AsLink = Common & { to: string; onClick?: () => void; 'aria-describedby'?: string }

export function Button(props: AsButton | AsLink) {
  const { variant = 'primary', size = 'md', icon, iconAfter, loading, className, children } = props
  const classes = cx(base, variants[variant], sizes[size], className)
  const content = (
    <>
      {loading ? <Spinner size={16} /> : icon}
      <span className="min-w-0">{children}</span>
      {iconAfter}
    </>
  )
  if ('to' in props && props.to !== undefined) {
    return (
      <Link to={props.to} onClick={props.onClick} className={classes} aria-describedby={props['aria-describedby']}>
        {content}
      </Link>
    )
  }
  const { variant: _v, size: _s, icon: _i, iconAfter: _ia, loading: _l, className: _c, children: _ch, type = 'button', ...rest } = props as AsButton
  return (
    <button type={type} className={classes} aria-busy={loading || undefined} disabled={rest.disabled || loading} {...rest}>
      {content}
    </button>
  )
}

export function IconButton({ label, children, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        'grid h-11 w-11 place-items-center rounded-full text-text-muted transition-colors duration-200 hover:bg-surface-tint hover:text-accent-strong disabled:text-text-disabled',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
