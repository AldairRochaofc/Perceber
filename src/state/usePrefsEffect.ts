import { useEffect, useSyncExternalStore } from 'react'
import { useReducedMotion } from '../lib/motion'
import { useStore } from './store'

const DARK = '(prefers-color-scheme: dark)'
const subscribeDark = (cb: () => void) => {
  const mq = window.matchMedia(DARK)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

/** Aplica as preferências de acessibilidade no <html>. */
export function usePrefsEffect() {
  const { prefs } = useStore()
  const reduced = useReducedMotion()
  const systemDark = useSyncExternalStore(subscribeDark, () => window.matchMedia(DARK).matches, () => false)
  const dusk = prefs.theme === 'dusk' || (prefs.theme === 'system' && systemDark)

  useEffect(() => {
    const root = document.documentElement
    root.style.fontSize = `${prefs.fontScale * 100}%`
    root.classList.toggle('hc', prefs.contrast === 'high')
    root.classList.toggle('theme-dusk', dusk)
    root.classList.toggle('reduce-motion', reduced)
    const meta = document.querySelector('meta[name="theme-color"]')
    meta?.setAttribute('content', dusk ? '#0c1430' : '#0a1a47')
  }, [prefs.fontScale, prefs.contrast, dusk, reduced])
}
