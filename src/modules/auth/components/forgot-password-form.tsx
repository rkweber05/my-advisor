"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/form/form-message";
import { SubmitButton } from "@/components/form/submit-button";
import { TextField } from "@/components/form/text-field";
import { TextLink } from "@/components/form/text-link";
import { useFocusFirstError } from "@/components/form/use-focus-first-error";
import { emptyFormState } from "@/lib/forms/form-state";

import { forgotPasswordAction } from "../actions";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    emptyFormState,
  );
  const formRef = useFocusFirstError(state);

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="flex flex-col gap-5"
    >
      <h1 className="text-2xl font-semibold tracking-tight">
        Recuperar a senha
      </h1>
      <p className="text-muted-foreground">
        Informe o e-mail da conta. Enviamos um link para definir uma nova senha.
      </p>
      <FormMessage state={state} />
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
      <SubmitButton pending={pending} pendingLabel="Enviando…">
        Enviar instruções
      </SubmitButton>
      <TextLink href="/login">Voltar ao login</TextLink>
    </form>
  );
}
