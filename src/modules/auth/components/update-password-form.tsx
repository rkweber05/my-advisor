"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/form/form-message";
import { PasswordField } from "@/components/form/password-field";
import { SubmitButton } from "@/components/form/submit-button";
import { useFocusFirstError } from "@/components/form/use-focus-first-error";
import { emptyFormState } from "@/lib/forms/form-state";

import { updatePasswordAction } from "../actions";
import { PASSWORD_MIN_LENGTH } from "../schemas";

export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePasswordAction,
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
      <FormMessage state={state} />
      <PasswordField
        label="Nova senha"
        name="password"
        autoComplete="new-password"
        required
        hint={`Mínimo de ${PASSWORD_MIN_LENGTH} caracteres.`}
        error={state.fieldErrors?.password}
      />
      <SubmitButton pending={pending} pendingLabel="Salvando…">
        Salvar nova senha
      </SubmitButton>
    </form>
  );
}
