import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { IconButton } from './Button'
import { cx } from './cx'

/**
 * Diálogo com <dialog> nativo: foco preso, Esc fecha, fundo inerte.
 * O foco volta para o elemento que abriu o diálogo.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  size = 'md',
  side = false,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  actions?: ReactNode
  size?: 'sm' | 'md'
  side?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) {
      const opener = document.activeElement as HTMLElement | null
      el.showModal()
      const restore = () => opener?.focus?.()
      el.addEventListener('close', restore, { once: true })
    } else if (!open && el.open) {
      el.close()
    }
  }, [open])

  return (
    // Clique no fundo fecha por conveniência; teclado fecha com Esc ou com o botão Fechar.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className={cx(
        'm-auto bg-surface p-0 text-ink shadow-lift ring-1 ring-line backdrop:bg-deep/45 backdrop:backdrop-blur-[3px]',
        side
          ? 'mr-0 h-full max-h-none w-full max-w-md rounded-none sm:rounded-l-xl'
          : cx('w-[calc(100%-2rem)] rounded-xl', size === 'sm' ? 'max-w-md' : 'max-w-xl'),
      )}
    >
      {open && (
        <div className={cx('flex flex-col gap-5 p-6 sm:p-8', side && 'min-h-full')}>
          <div className="flex items-start justify-between gap-4">
            <div className="grid gap-2">
              <h2 id={titleId} className="text-display-sm">
                {title}
              </h2>
              {description && (
                <p id={descId} className="text-text-muted">
                  {description}
                </p>
              )}
            </div>
            <IconButton label="Fechar" onClick={onClose} className="-mt-1 -mr-2 shrink-0">
              <X size={20} aria-hidden="true" />
            </IconButton>
          </div>
          {children}
          {actions && <div className="mt-auto flex flex-wrap justify-end gap-3 pt-2">{actions}</div>}
        </div>
      )}
    </dialog>
  )
}
