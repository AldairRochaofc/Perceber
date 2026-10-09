import { lazy, Suspense, useEffect, useRef, useState, type ComponentType } from 'react'
import { AREA_ACCESS } from './domain/roles'
import type { Role } from './domain/types'
import { Curtain } from './layout/Curtain'
import { AppShell } from './layout/AppShell'
import { matchPattern, navigate, useLocationPath, type RouteMatch } from './lib/router'
import { useStore } from './state/store'
import { usePrefsEffect } from './state/usePrefsEffect'
import { Spinner } from './ui/Spinner'
import { ToastRegion } from './ui/Toast'
import { LandingPage } from './features/landing/LandingPage'
import { AccessDenied, NotFound } from './features/system/SystemPages'

const page = <T extends Record<string, unknown>>(loader: () => Promise<T>, name: keyof T) =>
  lazy(async () => ({ default: (await loader())[name] as ComponentType<{ match: RouteMatch }> }))

const StartPage = page(() => import('./features/onboarding/StartPage'), 'StartPage')
const BeforeStartPage = page(() => import('./features/onboarding/BeforeStartPage'), 'BeforeStartPage')
const ModulesPage = page(() => import('./features/assessment/ModulesPage'), 'ModulesPage')
const AssessmentPage = page(() => import('./features/assessment/AssessmentPage'), 'AssessmentPage')
const ResultPage = page(() => import('./features/results/ResultPage'), 'ResultPage')
const ReportPage = page(() => import('./features/report/ReportPage'), 'ReportPage')
const DashboardPage = page(() => import('./features/dashboard/DashboardPage'), 'DashboardPage')
const ProfilePage = page(() => import('./features/profile/ProfilePage'), 'ProfilePage')
const SharingPage = page(() => import('./features/sharing/SharingPage'), 'SharingPage')
const DirectoryPage = page(() => import('./features/professionals/DirectoryPage'), 'DirectoryPage')
const PortalPage = page(() => import('./features/professionals/PortalPage'), 'PortalPage')
const ResearchPage = page(() => import('./features/research/ResearchPage'), 'ResearchPage')
const GovernancePage = page(() => import('./features/governance/GovernancePage'), 'GovernancePage')
const ReferencesPage = page(() => import('./features/references/ReferencesPage'), 'ReferencesPage')
const HelpPage = page(() => import('./features/help/HelpPage'), 'HelpPage')

type RouteDef = {
  pattern: string
  component: ComponentType<{ match: RouteMatch }>
  roles?: Role[] // ausente = público
  needsProfile?: boolean
  focusMode?: boolean
}

const P = AREA_ACCESS.participant!

const ROUTES: RouteDef[] = [
  { pattern: '/', component: LandingPage as ComponentType<{ match: RouteMatch }> },
  { pattern: '/referencias', component: ReferencesPage },
  { pattern: '/ajuda', component: HelpPage },
  { pattern: '/comecar', component: StartPage, roles: P },
  { pattern: '/perfil', component: ProfilePage, roles: P, needsProfile: true },
  { pattern: '/antes-de-comecar', component: BeforeStartPage, roles: P, needsProfile: true },
  { pattern: '/avaliacoes', component: ModulesPage, roles: P, needsProfile: true },
  { pattern: '/avaliacao/:id', component: AssessmentPage, roles: P, needsProfile: true, focusMode: true },
  { pattern: '/resultado/:id', component: ResultPage, roles: P, needsProfile: true },
  { pattern: '/relatorio/:id', component: ReportPage, roles: P, needsProfile: true },
  { pattern: '/painel', component: DashboardPage, roles: P, needsProfile: true },
  { pattern: '/compartilhar', component: SharingPage, roles: P, needsProfile: true },
  { pattern: '/profissionais', component: DirectoryPage, roles: ['participant', 'professional'] },
  { pattern: '/portal', component: PortalPage, roles: AREA_ACCESS.professional },
  { pattern: '/pesquisa', component: ResearchPage, roles: AREA_ACCESS.research },
  { pattern: '/governanca', component: GovernancePage, roles: AREA_ACCESS.governance },
]

function resolve(path: string) {
  for (const route of ROUTES) {
    const match = matchPattern(route.pattern, path)
    if (match) return { route, match }
  }
  return null
}

/** Anuncia a nova página para leitores de tela e leva o foco ao título. */
function useRouteFocus(path: string) {
  const [announcement, setAnnouncement] = useState('')
  const first = useRef(true)
  useEffect(() => {
    const query = new URLSearchParams(path.split('?')[1] ?? '')
    const section = query.get('secao')
    let tries = 0
    const tick = () => {
      const h1 = document.querySelector<HTMLElement>('[data-page-title]')
      if (!h1 && tries++ < 20) {
        requestAnimationFrame(tick)
        return
      }
      const title = h1?.textContent?.trim() ?? 'Perceber'
      document.title = `${title} · Perceber`
      if (section) {
        document.getElementById(section)?.scrollIntoView({ block: 'start' })
        document.getElementById(section)?.focus({ preventScroll: true })
      } else if (!first.current) {
        window.scrollTo(0, 0)
        h1?.focus({ preventScroll: true })
      }
      if (!first.current) setAnnouncement(`Página: ${title}`)
      first.current = false
    }
    requestAnimationFrame(tick)
  }, [path])
  return announcement
}

export function App() {
  usePrefsEffect()
  const path = useLocationPath()
  const state = useStore()
  const resolved = resolve(path)
  const announcement = useRouteFocus(path)

  let content
  let focusMode = false
  if (!resolved) {
    content = <NotFound />
  } else {
    const { route, match } = resolved
    focusMode = !!route.focusMode
    if (route.roles && !route.roles.includes(state.role)) {
      content = <AccessDenied allowed={route.roles} />
    } else if (route.needsProfile && !state.profile) {
      content = <Redirect to="/comecar" />
    } else {
      const C = route.component
      content = <C match={match} />
    }
  }

  return (
    <>
      <AppShell focusMode={focusMode}>
        <Suspense
          fallback={
            <div className="container-page grid min-h-[50vh] place-items-center">
              <Spinner label="Carregando" />
            </div>
          }
        >
          <div key={path.split('?')[0]} className="route-enter">
            {content}
          </div>
        </Suspense>
      </AppShell>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <Curtain />
      <ToastRegion />
    </>
  )
}

function Redirect({ to }: { to: string }) {
  useEffect(() => navigate(to, { replace: true }), [to])
  return null
}
