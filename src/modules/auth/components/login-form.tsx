"use client";

import { useActionState } from "react";

import { FormMessage, Notice } from "@/components/form/form-message";
import { PasswordField } from "@/components/form/password-field";
import { SubmitButton } from "@/components/form/submit-button";
import { TextField } from "@/components/form/text-field";
import { TextLink } from "@/components/form/text-link";
import { useFocusFirstError } from "@/components/form/use-focus-first-error";
import { emptyFormState } from "@/lib/forms/form-state";

import { loginAction } from "../actions";

type LoginFormProps = { next?: string; notice?: string };

export function LoginForm({ next, notice }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(
    loginAction,
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
      <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
      {notice && !state.message && <Notice>{notice}</Notice>}
      <FormMessage state={state} />
      {next && <input type="hidden" name="next" value={next} />}
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
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password}
      />
      <SubmitButton pending={pending} pendingLabel="Entrando…">
        Entrar
      </SubmitButton>
      <div className="flex flex-wrap justify-between gap-x-6">
        <TextLink href="/forgot-password">Esqueci a senha</TextLink>
        <TextLink href="/register">Criar conta</TextLink>
      </div>
    </form>
  );
}
