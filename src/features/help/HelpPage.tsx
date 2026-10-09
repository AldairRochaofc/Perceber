import { useState } from 'react'
import { Phone } from 'lucide-react'
import { FAQ, GLOSSARY } from '../../domain/content'
import { A11ySettings } from '../../layout/A11yPanel'
import { useStore } from '../../state/store'
import { Disclosure } from '../../ui/Disclosure'
import { PageHeader, SectionTitle } from '../../ui/PageHeader'
import { Callout } from '../../ui/Surface'
import { cx } from '../../ui/cx'
import { CrisisList } from './CrisisList'

const TOPICS = [
  { id: 'all', label: 'Todas' },
  { id: 'triagem', label: 'Triagem' },
  { id: 'diagnostico', label: 'Diagnóstico' },
  { id: 'privacidade', label: 'Privacidade' },
  { id: 'compartilhamento', label: 'Compartilhamento' },
] as const

export function HelpPage() {
  const { profile } = useStore()
  const [topic, setTopic] = useState<(typeof TOPICS)[number]['id']>('all')
  const faq = FAQ.filter((f) => topic === 'all' || f.topic === topic)

  return (
    <div className="container-page grid gap-20 pb-10">
      <PageHeader title="Ajuda e acessibilidade." lead="Onde buscar apoio, como ajustar a plataforma ao seu jeito e respostas para as dúvidas mais comuns." />

      <section id="agora" tabIndex={-1} aria-labelledby="agora-title" className="grid scroll-mt-28 gap-6 outline-none lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <div className="grid content-start gap-3">
          <h2 id="agora-title" className="text-display-md font-light">
            Preciso de ajuda agora.
          </h2>
          <p className="text-text-muted">Estas orientações são informativas. O PERCEBER não avalia risco e não aciona ninguém automaticamente.</p>
        </div>
        <div className="grid gap-4">
          <CrisisList />
          {profile?.supportContact && (
            <Callout tone="safety" title={`Seu contato de apoio: ${profile.supportContact.name}`}>
              {profile.supportContact.phone && (
                <a href={`tel:${profile.supportContact.phone}`} className="inline-flex items-center gap-1.5 font-semibold">
                  <Phone size={15} aria-hidden="true" />
                  {profile.supportContact.phone}
                </a>
              )}
            </Callout>
          )}
        </div>
      </section>

      <section aria-labelledby="ajustes-title" className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <div className="grid content-start gap-3">
          <h2 id="ajustes-title" className="text-display-md font-light">
            Ajustes de conforto.
          </h2>
          <p className="text-text-muted">Valem para toda a plataforma e ficam salvos neste navegador. Também abrem pelo ícone de ajustes no topo de qualquer tela.</p>
        </div>
        <div className="rounded-xl bg-surface p-6 shadow-soft ring-1 ring-line sm:p-8">
          <A11ySettings />
        </div>
      </section>

      <section aria-labelledby="teclado-title" className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <div className="grid content-start gap-3">
          <h2 id="teclado-title" className="text-display-md font-light">
            Teclado e leitores de tela.
          </h2>
          <p className="text-text-muted">Tudo funciona sem mouse. O foco é sempre visível e cada nova tela é anunciada.</p>
        </div>
        <dl className="grid gap-0">
          {[
            ['Tab e Shift + Tab', 'Avançar e voltar entre os controles'],
            ['1 a 5', 'Escolher uma resposta no questionário'],
            ['Seta para a esquerda', 'Voltar à pergunta anterior'],
            ['Enter', 'Confirmar a resposta escolhida'],
            ['Esc', 'Fechar janelas e painéis'],
            ['Setas', 'Mudar de aba em áreas com abas'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-6 border-b border-line py-3.5">
              <dt>
                <kbd className="rounded-xs bg-surface-sunken px-2 py-1 font-mono text-caption text-ink ring-1 ring-line">{k}</kbd>
              </dt>
              <dd className="text-right text-text-muted">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="faq-title" className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <div className="grid content-start gap-4">
          <h2 id="faq-title" className="text-display-md font-light">
            Perguntas frequentes.
          </h2>
          <div role="radiogroup" aria-label="Filtrar perguntas por tema" className="flex flex-wrap gap-2">
            {TOPICS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={topic === t.id}
                onClick={() => setTopic(t.id)}
                className={cx(
                  'h-9 rounded-full px-3.5 text-sm font-semibold ring-1 transition-colors',
                  topic === t.id ? 'bg-accent text-on-accent ring-accent' : 'bg-surface text-text-muted ring-line hover:text-ink',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="border-t border-line">
          {faq.map((f) => (
            <Disclosure key={f.q} summary={f.q}>
              {f.a}
            </Disclosure>
          ))}
        </div>
      </section>

      <section aria-labelledby="glossario-title" className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <div className="grid content-start gap-3">
          <h2 id="glossario-title" className="text-display-md font-light">
            Glossário.
          </h2>
          <p className="text-text-muted">As palavras técnicas que aparecem nos resultados e no relatório, em linguagem simples.</p>
        </div>
        <dl className="grid gap-0">
          {GLOSSARY.map((g) => (
            <div key={g.term} className="grid gap-1 border-b border-line py-4 sm:grid-cols-[11rem_1fr] sm:gap-6">
              <dt className="font-semibold text-ink">{g.term}</dt>
              <dd className="text-text-muted">{g.definition}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="suporte-title" className="grid gap-5">
        <SectionTitle id="suporte-title" title="Suporte humano" />
        <Callout tone="neutral" title="Ainda não disponível nesta demonstração">
          Em uso real, haverá um canal de suporte com atendimento por pessoas, por texto e por voz, definido pela instituição responsável. Para emergências, use sempre os contatos acima.
        </Callout>
      </section>
    </div>
  )
}
