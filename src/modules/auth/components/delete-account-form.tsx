"use client";

import { useActionState, useState } from "react";

import { FormMessage } from "@/components/form/form-message";
import { PasswordField } from "@/components/form/password-field";
import { SubmitButton } from "@/components/form/submit-button";
import { TextField } from "@/components/form/text-field";
import { useFocusFirstError } from "@/components/form/use-focus-first-error";
import { emptyFormState } from "@/lib/forms/form-state";

import { deleteAccountAction } from "../actions";
import { DELETE_CONFIRMATION_WORD } from "../schemas";

export function DeleteAccountForm() {
  const [state, formAction, pending] = useActionState(
    deleteAccountAction,
    emptyFormState,
  );
  const formRef = useFocusFirstError(state);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const ready =
    password.length > 0 && confirmation === DELETE_CONFIRMATION_WORD;

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="flex flex-col gap-5"
    >
      <PasswordField
        label="Senha atual"
        name="currentPassword"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={state.fieldErrors?.currentPassword}
      />
      <TextField
        label={`Digite ${DELETE_CONFIRMATION_WORD} para confirmar`}
        name="confirmation"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        required
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        error={state.fieldErrors?.confirmation}
      />
      <FormMessage state={state} />
      <SubmitButton
        pending={pending}
        pendingLabel="Excluindo…"
        disabled={!ready}
        variant="destructive"
      >
        Excluir minha conta
      </SubmitButton>
    </form>
  );
}
