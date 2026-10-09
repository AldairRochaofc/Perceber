import { useEffect, useState, type ReactNode } from 'react'
import { Menu, Settings2 } from 'lucide-react'
import { DISCLAIMER } from '../domain/content'
import { ITEM_BANK_VERSION } from '../domain/items'
import { PLATFORM_VERSION } from '../domain/modules'
import { ALGORITHM_VERSION } from '../domain/scoring'
import type { Role } from '../domain/types'
import { Link, useLocationPath } from '../lib/router'
import { useStore } from '../state/store'
import { Button, IconButton } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { Logo } from '../ui/Logo'
import { cx } from '../ui/cx'
import { A11yPanel } from './A11yPanel'
import { RoleSwitcher } from './RoleSwitcher'

type NavItem = { to: string; label: string; match?: string[] }

function navFor(role: Role, hasProfile: boolean): NavItem[] {
  const common: NavItem[] = [
    { to: '/referencias', label: 'Base científica' },
    { to: '/ajuda', label: 'Ajuda' },
  ]
  switch (role) {
    case 'participant':
      return hasProfile
        ? [
            { to: '/painel', label: 'Painel', match: ['/resultado', '/relatorio'] },
            { to: '/avaliacoes', label: 'Avaliações', match: ['/avaliacao', '/antes-de-comecar'] },
            { to: '/compartilhar', label: 'Compartilhar', match: ['/profissionais'] },
            ...common,
          ]
        : [{ to: '/', label: 'Início' }, ...common]
    case 'professional':
      return [{ to: '/portal', label: 'Portal profissional' }, { to: '/profissionais', label: 'Diretório' }, ...common]
    case 'researcher':
      return [{ to: '/pesquisa', label: 'Pesquisa' }, ...common]
    case 'admin':
    case 'committee':
      return [{ to: '/governanca', label: 'Governança' }, ...common]
  }
}

const isActive = (path: string, item: NavItem) =>
  item.to === '/' ? path === '/' : path.startsWith(item.to) || !!item.match?.some((m) => path.startsWith(m))

export function AppShell({ children, focusMode }: { children: ReactNode; focusMode?: boolean }) {
  const { role, profile } = useStore()
  const path = useLocationPath()
  const [a11yOpen, setA11yOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const items = navFor(role, !!profile)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMenuOpen(false), [path])

  const cta =
    role === 'participant' ? (
      profile ? (
        <Button to="/avaliacoes" size="sm">
          Avaliações
        </Button>
      ) : (
        <Button to="/comecar" size="sm">
          Começar
        </Button>
      )
    ) : null

  return (
    <div className="flex min-h-svh flex-col">
      <a href="#conteudo" className="sr-only-focusable top-3 left-3 z-[100] rounded-full bg-deep px-5 py-3 font-semibold text-on-deep">
        Pular para o conteúdo
      </a>

      {!focusMode && (
        <header className="no-print fixed inset-x-0 top-3 z-50 px-3 sm:top-4">
          <div
            className={cx(
              'glass mx-auto flex h-16 max-w-6xl items-center gap-2 rounded-full pr-2 pl-4 ring-1 ring-line transition-shadow duration-500',
              scrolled ? 'shadow-lift' : 'shadow-soft',
            )}
          >
            <Link to={role === 'participant' && profile ? '/painel' : '/'} className="mr-2 rounded-full no-underline" aria-label="Perceber, página inicial">
              <Logo size={32} />
            </Link>
            <nav aria-label="Principal" className="hidden flex-1 lg:block">
              <ul className="flex items-center gap-0.5">
                {items.map((item) => {
                  const active = isActive(path, item)
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        aria-current={active ? 'page' : undefined}
                        className={cx(
                          'inline-flex h-10 items-center rounded-full px-3.5 text-sm font-semibold no-underline transition-colors',
                          active ? 'bg-accent-soft text-accent-strong' : 'text-text-muted hover:text-ink',
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
            <div className="ml-auto flex items-center gap-1.5">
              <IconButton label="Ajustes de acessibilidade" onClick={() => setA11yOpen(true)}>
                <Settings2 size={20} aria-hidden="true" />
              </IconButton>
              <span className="hidden md:inline-flex">
                <RoleSwitcher />
              </span>
              <span className="hidden sm:inline-flex">{cta}</span>
              <IconButton label="Abrir menu" className="lg:hidden" onClick={() => setMenuOpen(true)} aria-expanded={menuOpen}>
                <Menu size={22} aria-hidden="true" />
              </IconButton>
            </div>
          </div>
        </header>
      )}

      <Dialog open={menuOpen} onClose={() => setMenuOpen(false)} side title="Menu">
        <nav aria-label="Menu">
          <ul className="grid">
            {items.map((item) => (
              <li key={item.to} className="border-b border-line">
                <Link
                  to={item.to}
                  aria-current={isActive(path, item) ? 'page' : undefined}
                  className="block py-4 font-display text-display-sm font-light text-ink no-underline aria-[current=page]:text-accent-strong"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="grid gap-3">
          {cta}
          <RoleSwitcher onDone={() => setMenuOpen(false)} className="w-fit" />
          {role === 'participant' && profile && (
            <Link to="/perfil" className="text-sm font-semibold">
              Meu perfil e privacidade
            </Link>
          )}
        </div>
      </Dialog>

      <A11yPanel open={a11yOpen} onClose={() => setA11yOpen(false)} />

      <main id="conteudo" tabIndex={-1} className={cx('flex-1 outline-none', !focusMode && 'pt-28 sm:pt-32')}>
        {children}
      </main>

      {!focusMode && <Footer role={role} hasProfile={!!profile} />}
    </div>
  )
}

function Footer({ role, hasProfile }: { role: Role; hasProfile: boolean }) {
  const links: NavItem[] = [
    ...(role === 'participant' ? [{ to: hasProfile ? '/avaliacoes' : '/comecar', label: hasProfile ? 'Avaliações' : 'Começar' }] : []),
    ...(role === 'participant' && hasProfile ? [{ to: '/perfil', label: 'Meu perfil e privacidade' }] : []),
    { to: '/referencias', label: 'Base científica' },
    { to: '/ajuda', label: 'Ajuda e acessibilidade' },
    { to: '/ajuda?secao=agora', label: 'Preciso de ajuda agora' },
  ]
  return (
    <footer className="no-print mt-24 border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.2fr_1fr]">
        <div className="grid content-start gap-4">
          <Logo size={34} />
          <p className="measure text-lead text-ink">{DISCLAIMER}</p>
          <p className="measure text-sm text-text-muted">
            Versão de demonstração: os dados ficam apenas neste navegador. Diretório profissional e dados de pesquisa são fictícios.
          </p>
        </div>
        <nav aria-label="Rodapé" className="md:justify-self-end">
          <ul className="grid gap-2.5">
            {links.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="font-semibold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-line">
        <p className="container-page label-data py-5 text-text-subtle">
          Perceber {PLATFORM_VERSION} · banco de itens {ITEM_BANK_VERSION} · algoritmo {ALGORITHM_VERSION}
        </p>
      </div>
    </footer>
  )
}
