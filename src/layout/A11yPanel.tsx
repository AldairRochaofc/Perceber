import { Accessibility } from 'lucide-react'
import { setPrefs, useStore, DEFAULT_PREFS } from '../state/store'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { Switch } from '../ui/Field'
import { cx } from '../ui/cx'

const SCALES = [
  { value: 0.9, label: '90%' },
  { value: 1, label: '100%' },
  { value: 1.15, label: '115%' },
  { value: 1.3, label: '130%' },
  { value: 1.5, label: '150%' },
]

const THEMES = [
  { value: 'light', label: 'Claro' },
  { value: 'dusk', label: 'Escuro suave' },
  { value: 'system', label: 'Como no sistema' },
] as const

/** Ajustes de conforto. Valem para toda a plataforma e ficam salvos neste navegador. */
export function A11ySettings() {
  const { prefs } = useStore()
  return (
    <div className="grid gap-8">
      <fieldset className="grid gap-3">
        <legend className="mb-1 font-semibold text-ink">Tamanho do texto</legend>
        <div className="grid grid-cols-5 gap-1.5 rounded-lg bg-surface-sunken p-1.5 ring-1 ring-line">
          {SCALES.map((s, i) => (
            <label key={s.value} className="relative">
              <input
                type="radio"
                name="font-scale"
                className="peer sr-only"
                checked={prefs.fontScale === s.value}
                onChange={() => setPrefs({ fontScale: s.value })}
              />
              <span
                className={cx(
                  'grid h-12 cursor-pointer place-items-center rounded-md font-display text-text-muted transition-colors peer-checked:bg-surface peer-checked:text-accent-strong peer-checked:shadow-soft peer-focus-visible:ring-[var(--focus-width)] peer-focus-visible:ring-focus',
                )}
                style={{ fontSize: `${0.8 + i * 0.16}rem` }}
              >
                <span aria-hidden="true">Aa</span>
                <span className="sr-only">{s.label}</span>
              </span>
            </label>
          ))}
        </div>
        <p className="text-sm text-text-subtle tabular">{Math.round(prefs.fontScale * 100)}% do tamanho padrão. Todo o texto da plataforma acompanha.</p>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="mb-1 font-semibold text-ink">Tema</legend>
        <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-surface-sunken p-1.5 ring-1 ring-line">
          {THEMES.map((t) => (
            <label key={t.value} className="relative">
              <input type="radio" name="theme" className="peer sr-only" checked={prefs.theme === t.value} onChange={() => setPrefs({ theme: t.value })} />
              <span className="grid min-h-12 cursor-pointer place-items-center rounded-md px-2 text-center text-sm font-semibold text-text-muted transition-colors peer-checked:bg-surface peer-checked:text-ink peer-checked:shadow-soft peer-focus-visible:ring-[var(--focus-width)] peer-focus-visible:ring-focus">
                {t.label}
              </span>
            </label>
          ))}
        </div>
        <p className="text-sm text-text-subtle">O escuro suave reduz o brilho para quem é sensível à luz.</p>
      </fieldset>

      <div className="grid gap-6">
        <Switch
          label="Aumentar contraste"
          description="Escurece textos secundários e reforça bordas e foco."
          checked={prefs.contrast === 'high'}
          onChange={(v) => setPrefs({ contrast: v ? 'high' : 'normal' })}
        />
        <Switch
          label="Reduzir animações"
          description="Remove transições e movimentos. Também segue a configuração do seu sistema."
          checked={prefs.motion === 'reduce'}
          onChange={(v) => setPrefs({ motion: v ? 'reduce' : 'system' })}
        />
        <Switch
          label="Avançar ao escolher uma resposta"
          description="Quando desligado, você confirma cada resposta com o botão Próxima."
          checked={prefs.autoAdvance}
          onChange={(v) => setPrefs({ autoAdvance: v })}
        />
      </div>
    </div>
  )
}

export function A11yPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      side
      title="Conforto e acessibilidade"
      description="Ajuste a experiência ao seu jeito. As escolhas ficam salvas neste navegador."
      actions={
        <>
          <Button variant="quiet" onClick={() => setPrefs(DEFAULT_PREFS)}>
            Restaurar padrão
          </Button>
          <Button onClick={onClose}>Pronto</Button>
        </>
      }
    >
      <A11ySettings />
    </Dialog>
  )
}

export const A11yIcon = Accessibility
