"use client";

import { useActionState, useEffect, useRef } from "react";

import { FormMessage } from "@/components/form/form-message";
import { PasswordField } from "@/components/form/password-field";
import { SubmitButton } from "@/components/form/submit-button";
import { TextField } from "@/components/form/text-field";
import { TextLink } from "@/components/form/text-link";
import { useFocusFirstError } from "@/components/form/use-focus-first-error";
import { emptyFormState } from "@/lib/forms/form-state";

import { registerAction } from "../actions";
import { PASSWORD_MIN_LENGTH } from "../schemas";

// Mesma tela para e-mail autorizado e não autorizado: não revela quem está na lista.
function CheckYourEmail({ email }: { email: string }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-2xl font-semibold tracking-tight outline-none"
      >
        Confira seu e-mail
      </h1>
      <p>
        Se <strong className="font-semibold break-all">{email}</strong> estiver
        autorizado, enviamos um link de confirmação.
      </p>
      <p className="text-muted-foreground">
        O cadastro é fechado: e-mails fora da lista não recebem nada.
      </p>
      <TextLink href="/login">Voltar ao login</TextLink>
    </div>
  );
}

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerAction,
    emptyFormState,
  );
  const formRef = useFocusFirstError(state);

  if (state.success) {
    return <CheckYourEmail email={state.success} />;
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="flex flex-col gap-5"
    >
      <h1 className="text-2xl font-semibold tracking-tight">Criar conta</h1>
      <FormMessage state={state} />
      <TextField
        label="Nome"
        name="name"
        autoComplete="name"
        maxLength={80}
        required
        defaultValue={state.values?.name}
        error={state.fieldErrors?.name}
      />
      <TextField
        label="E-mail"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <PasswordField
        label="Senha"
        name="password"
        autoComplete="new-password"
        required
        hint={`Mínimo de ${PASSWORD_MIN_LENGTH} caracteres.`}
        error={state.fieldErrors?.password}
      />
      <SubmitButton pending={pending} pendingLabel="Criando conta…">
        Criar conta
      </SubmitButton>
      <TextLink href="/login">Já tenho conta</TextLink>
    </form>
  );
}
