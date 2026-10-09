import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react'

/**
 * Roteador por hash. Sem servidor: funciona em hospedagem estática, em
 * subcaminhos e offline. Cada rota tem endereço próprio, então o botão
 * Voltar do navegador e os links diretos funcionam.
 */

export type RouteMatch = {
  path: string
  params: Record<string, string>
  query: URLSearchParams
}

function currentPath(): string {
  const hash = globalThis.location?.hash ?? ''
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  return raw.startsWith('/') ? raw : `/${raw}`
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export function useLocationPath(): string {
  return useSyncExternalStore(subscribe, currentPath, () => '/')
}

export function navigate(to: string, { replace = false } = {}) {
  const target = `#${to.startsWith('/') ? to : `/${to}`}`
  if (replace) {
    history.replaceState(null, '', target)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else if (location.hash === target) {
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else {
    location.hash = target
  }
}

/** Compara '/resultado/:id' com '/resultado/abc' */
export function matchPattern(pattern: string, fullPath: string): RouteMatch | null {
  const [pathname = '/', search = ''] = fullPath.split('?')
  const p = pattern.split('/').filter(Boolean)
  const s = pathname.split('/').filter(Boolean)
  if (p.length !== s.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < p.length; i++) {
    const seg = p[i]!
    const val = s[i]!
    if (seg.startsWith(':')) params[seg.slice(1)] = decodeURIComponent(val)
    else if (seg !== val) return null
  }
  return { path: pathname, params, query: new URLSearchParams(search) }
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string }

export function Link({ to, onClick, children, ...rest }: LinkProps) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    navigate(to)
  }
  return (
    <a href={`#${to}`} onClick={handle} {...rest}>
      {children}
    </a>
  )
}
