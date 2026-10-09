import { useSyncExternalStore } from 'react'
import { CheckCircle2, Info, X } from 'lucide-react'

/** Notificações curtas. Região aria-live; somem sozinhas em 6 s ou ao fechar. */
type Toast = { id: number; message: string; tone: 'success' | 'info' }

let toasts: Toast[] = []
let seq = 0
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function notify(message: string, tone: Toast['tone'] = 'success') {
  const id = ++seq
  toasts = [...toasts, { id, message, tone }]
  emit()
  setTimeout(() => dismiss(id), 6000)
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

export function ToastRegion() {
  const list = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => toasts,
    () => toasts,
  )
  return (
    <div aria-live="polite" aria-atomic="false" className="no-print pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
      {list.map((t) => (
        <div key={t.id} role="status" className="pointer-events-auto flex max-w-md items-center gap-3 rounded-full bg-deep py-2.5 pr-2 pl-4 text-sm font-medium text-on-deep shadow-lift">
          {t.tone === 'success' ? <CheckCircle2 size={18} aria-hidden="true" className="text-accent-on-deep" /> : <Info size={18} aria-hidden="true" className="text-accent-on-deep" />}
          <span>{t.message}</span>
          <button type="button" onClick={() => dismiss(t.id)} aria-label="Fechar aviso" className="on-deep grid h-8 w-8 place-items-center rounded-full text-on-deep-muted hover:bg-white/10 hover:text-on-deep">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  )
}
