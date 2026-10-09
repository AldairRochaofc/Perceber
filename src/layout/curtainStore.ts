import { useSyncExternalStore } from 'react'

/**
 * Cortina: transição de tela cheia usada SÓ em dois limiares — entrar na
 * avaliação e revelar o resultado. Todas as outras trocas de tela são um
 * fade curto. Com movimento reduzido, a cortina não aparece.
 */
type CurtainState = { phase: 'idle' | 'covering' | 'covered' | 'revealing'; message: string }

let state: CurtainState = { phase: 'idle', message: '' }
const listeners = new Set<() => void>()
let resolveCover: (() => void) | null = null
let resolveReveal: (() => void) | null = null

const set = (next: CurtainState) => {
  state = next
  listeners.forEach((l) => l())
}

export function useCurtain() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
    () => state,
  )
}

export function coverCurtain(message: string): Promise<void> {
  return new Promise((resolve) => {
    resolveCover = resolve
    set({ phase: 'covering', message })
  })
}

export function curtainCovered() {
  set({ ...state, phase: 'covered' })
  resolveCover?.()
  resolveCover = null
}

export function revealCurtain(): Promise<void> {
  return new Promise((resolve) => {
    resolveReveal = resolve
    set({ ...state, phase: 'revealing' })
  })
}

export function curtainRevealed() {
  set({ phase: 'idle', message: '' })
  resolveReveal?.()
  resolveReveal = null
}

/** Passa por um limiar: cobre, troca de tela, mostra a mensagem por um instante e revela. */
export async function crossThreshold(message: string, go: () => void, reduced: boolean) {
  if (reduced) {
    go()
    return
  }
  await coverCurtain(message)
  go()
  await new Promise((r) => setTimeout(r, 900))
  await revealCurtain()
}
