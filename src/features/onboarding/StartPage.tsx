import { useEffect, useRef, useState, type FormEvent } from "react";
import { CONSENTS } from "../../domain/consents";
import { REASONS } from "../../domain/content";
import type { AgeBand, ConsentId } from "../../domain/types";
import { navigate } from "../../lib/router";
import { createProfile, recordConsent, useStore } from "../../state/store";
import { Button } from "../../ui/Button";
import { Select, TextField } from "../../ui/Field";
import { PageHeader } from "../../ui/PageHeader";
import { Callout } from "../../ui/Surface";
import { notify } from "../../ui/Toast";
import {
  ConsentCard,
  ConsentVersion,
  DisclosureGrid,
  type ConsentAnswer,
} from "./ConsentBlocks";

const ONBOARDING = CONSENTS.filter((c) => c.askedAt === "onboarding");

export const AGE_OPTIONS: { value: AgeBand | ""; label: string }[] = [
  { value: "", label: "Escolha uma faixa" },
  { value: "18-24", label: "18 a 24 anos" },
  { value: "25-34", label: "25 a 34 anos" },
  { value: "35-44", label: "35 a 44 anos" },
  { value: "45-59", label: "45 a 59 anos" },
  { value: "60+", label: "60 anos ou mais" },
  { value: "prefer-not", label: "Prefiro não informar" },
];

export function StartPage() {
  const { profile, consents } = useStore();
  const [step, setStep] = useState<1 | 2>(() =>
    consents.some((c) => c.consentId === "account" && c.choice === "granted")
      ? 2
      : 1,
  );
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (profile) navigate("/avaliacoes", { replace: true });
  }, [profile]);

  useEffect(() => {
    titleRef.current?.focus();
    window.scrollTo(0, 0);
  }, [step]);

  return (
    <div className="container-page grid max-w-4xl gap-10 pb-10">
      <p className="label-data text-text-subtle" aria-hidden="true">
        Passo {step} de 2
      </p>
      {step === 1 ? (
        <ConsentStep titleRef={titleRef} onDone={() => setStep(2)} />
      ) : (
        <AboutStep titleRef={titleRef} />
      )}
    </div>
  );
}

function ConsentStep({
  titleRef,
  onDone,
}: {
  titleRef: React.RefObject<HTMLHeadingElement | null>;
  onDone: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, ConsentAnswer>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [blocked, setBlocked] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    for (const c of ONBOARDING)
      if (!answers[c.id]) next[c.id] = "Escolha uma opção para continuar.";
    setErrors(next);
    if (Object.keys(next).length) {
      document
        .querySelector<HTMLInputElement>(
          `input[name="consent-${Object.keys(next)[0]}"]`,
        )
        ?.focus();
      return;
    }
    const requiredDeclined = ONBOARDING.some(
      (c) => c.required && answers[c.id] === "declined",
    );
    if (requiredDeclined) {
      setBlocked(true);
      return;
    }
    for (const c of ONBOARDING)
      recordConsent(c.id as ConsentId, answers[c.id] as "granted" | "declined");
    notify("Consentimentos registrados");
    onDone();
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-10">
      <PageHeader
        ref={titleRef}
        title="O que acontece com seus dados?"
        lead="Abaixo explicamos quais dados são registrados e para quê. Depois, você decide cada autorização separadamente. Nenhuma vem marcada, e recusar as opcionais não limita seu acesso."
        size="md"
      />
      <DisclosureGrid />
      <div className="grid gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-display-sm">Suas autorizações</h2>
          <ConsentVersion />
        </div>
        {ONBOARDING.map((c) => (
          <ConsentCard
            key={c.id}
            def={c}
            value={answers[c.id] ?? null}
            error={errors[c.id]}
            onChange={(v) => {
              setAnswers((a) => ({ ...a, [c.id]: v }));
              setErrors((e) => ({ ...e, [c.id]: "" }));
              setBlocked(false);
            }}
          />
        ))}
        <p className="text-sm text-text-subtle">
          O compartilhamento com profissionais é perguntado separadamente, cada
          vez que você decidir compartilhar.
        </p>
      </div>
      {blocked && (
        <Callout
          tone="attention"
          role="alert"
          title="Sem essas duas autorizações, não é possível responder"
        >
          Criar o perfil e registrar respostas são necessários para mostrar seus
          resultados. Você pode ler a Base científica e a Ajuda sem criar
          perfil.
        </Callout>
      )}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg">
          Registrar e continuar
        </Button>
        <Button to="/" variant="quiet" size="lg">
          Agora não
        </Button>
      </div>
    </form>
  );
}

function AboutStep({
  titleRef,
}: {
  titleRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const { consents } = useStore();
  const contactGranted = consents.some(
    (c) => c.consentId === "contact" && c.choice === "granted",
  );
  const [name, setName] = useState("");
  const [age, setAge] = useState<AgeBand | "">("");
  const [pronouns, setPronouns] = useState("");
  const [reason, setReason] = useState("");
  const [contact, setContact] = useState("");
  const [errors, setErrors] = useState<{ name?: string; age?: string }>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim())
      next.name = "Escreva como você quer ser chamado(a). Pode ser um apelido.";
    if (!age) next.age = "Escolha uma faixa, ou “Prefiro não informar”.";
    setErrors(next);
    if (next.name || next.age) return;
    createProfile({
      preferredName: name.trim(),
      ageBand: age as AgeBand,
      pronouns: pronouns.trim() || undefined,
      reason: reason || undefined,
      contactChannel: contactGranted ? contact.trim() || undefined : undefined,
      researchInvites: contactGranted,
    });
    notify(`Perfil criado. Boas-vindas, ${name.trim()}.`);
    navigate("/antes-de-comecar?modulo=central");
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-10">
      <PageHeader
        ref={titleRef}
        title="Algumas informações sobre você."
        lead="Só o necessário para contextualizar seu resultado. Nada aqui muda o cálculo dos indicadores."
        size="md"
      />
      <div className="grid max-w-xl gap-6">
        <TextField
          label="Como você quer ser chamado(a)?"
          hint="Usamos este nome nas telas e no relatório. Não precisa ser o nome civil."
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="nickname"
          error={errors.name}
          required
        />
        <Select
          label="Faixa etária"
          hint="Esta versão é para pessoas adultas."
          value={age}
          onChange={(e) => setAge(e.target.value as AgeBand | "")}
          options={AGE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          error={errors.age}
          required
        />
        <TextField
          label="Pronomes"
          optional
          hint="Por exemplo: ela/dela, ele/dele, elu/delu."
          value={pronouns}
          onChange={(e) => setPronouns(e.target.value)}
        />
        <Select
          label="O que trouxe você até aqui?"
          optional
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          options={[
            { value: "", label: "Prefiro não dizer" },
            ...REASONS.map((r) => ({ value: r, label: r })),
          ]}
        />
        {contactGranted && (
          <TextField
            label="Canal para convites de estudos"
            optional
            hint="Você autorizou receber convites. Informe um e-mail ou telefone, se quiser."
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            autoComplete="email"
          />
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg">
          Criar perfil
        </Button>
      </div>
    </form>
  );
}
