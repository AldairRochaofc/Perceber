import { useState } from 'react'
import { CONTEXT_FACTORS } from '../../domain/content'
import type { AssessmentSession, ContextFactors } from '../../domain/types'
import { Button } from '../../ui/Button'
import { Checkbox, Switch, TextArea } from '../../ui/Field'
import { useFocusOnMount } from '../../ui/useFocusOnMount'

/** Etapa final, opcional: fatores que podem ter influenciado e comentário para o relatório. */
export function ContextStep({ session, onBack, onSubmit }: { session: AssessmentSession; onBack: () => void; onSubmit: (ctx: ContextFactors) => void }) {
  const ref = useFocusOnMount<HTMLHeadingElement>()
  const [factors, setFactors] = useState<string[]>(session.context?.factors ?? [])
  const [comment, setComment] = useState(session.context?.comment ?? '')
  const [include, setInclude] = useState(session.context?.includeComment ?? true)

  return (
    <section className="container-task grid gap-10 py-10 sm:py-14" aria-labelledby="context-title">
      <div className="grid gap-4">
        <p className="text-sm font-semibold text-success">Você respondeu a todas as perguntas.</p>
        <h1 id="context-title" ref={ref} tabIndex={-1} data-page-title className="text-display-md font-light outline-none">
          Quer acrescentar algum contexto?
        </h1>
        <p className="text-lead text-text-muted">Opcional. Isso não muda nenhum escore, mas aparece junto do resultado para ajudar na leitura.</p>
      </div>

      <fieldset className="grid gap-3">
        <legend className="mb-1 font-semibold text-ink">Algo pode ter influenciado suas respostas hoje?</legend>
        <div className="grid gap-2.5">
          {CONTEXT_FACTORS.map((f) => (
            <Checkbox
              key={f}
              tone="card"
              label={f}
              checked={factors.includes(f)}
              onChange={(e) => setFactors((list) => (e.target.checked ? [...list, f] : list.filter((x) => x !== f)))}
            />
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5">
        <TextArea
          label="Comentário para o relatório"
          optional
          hint="Exemplos da sua vida, algo que as perguntas não cobriram, ou o que você gostaria que um profissional soubesse."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={800}
        />
        {comment.trim() && (
          <Switch
            label="Incluir este comentário no relatório"
            description="Se desligado, o comentário fica salvo só para você."
            checked={include}
            onChange={setInclude}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="quiet" onClick={onBack}>
          Revisar respostas
        </Button>
        <Button size="lg" onClick={() => onSubmit({ factors, comment: comment.trim(), includeComment: include })}>
          Ver meu resultado
        </Button>
      </div>
    </section>
  )
}
