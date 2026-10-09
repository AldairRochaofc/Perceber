import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { useSyncExternalStore } from 'react'
import { useStore } from '../state/store'

gsap.registerPlugin(useGSAP)

/** Constantes de movimento espelham os tokens de CSS. */
export const MOTION = {
  quick: 0.16,
  base: 0.28,
  slow: 0.56,
  ease: 'power3.out',
  easeInOut: 'power2.inOut',
} as const

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

const systemReduced = () => window.matchMedia(QUERY).matches

/** Verdadeiro se o sistema OU a preferência do produto pedem menos movimento. */
export function useReducedMotion(): boolean {
  const sys = useSyncExternalStore(subscribe, systemReduced, () => false)
  const { prefs } = useStore()
  return sys || prefs.motion === 'reduce'
}

export { gsap, useGSAP }
