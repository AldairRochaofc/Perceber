import { useEffect, useRef } from 'react'

/** Leva o foco ao título quando uma tela muda sem trocar de rota (ex.: etapas). */
export function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    ref.current?.focus({ preventScroll: false })
  }, [])
  return ref
}
