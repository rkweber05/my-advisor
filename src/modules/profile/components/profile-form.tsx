"use client";

import { useActionState, useId } from "react";

import {
  describedBy,
  fieldControlClass,
  FieldShell,
} from "@/components/form/field-shell";
import { FormMessage } from "@/components/form/form-message";
import { SubmitButton } from "@/components/form/submit-button";
import { TextField } from "@/components/form/text-field";
import { useFocusFirstError } from "@/components/form/use-focus-first-error";
import { emptyFormState } from "@/lib/forms/form-state";

import { updateProfileAction } from "../actions";

type ProfileFormProps = {
  name: string;
  timezone: string;
  brazilTimezones: readonly string[];
  otherTimezones: readonly string[];
};

function timezoneLabel(timezone: string) {
  return timezone.replaceAll("_", " ");
}

export function ProfileForm({
  name,
  timezone,
  brazilTimezones,
  otherTimezones,
}: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    emptyFormState,
  );
  const formRef = useFocusFirstError(state);
  const timezoneId = useId();
  const timezoneError = state.fieldErrors?.timezone;

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="flex flex-col gap-5"
    >
      <TextField
        label="Nome"
        name="name"
        autoComplete="name"
        maxLength={80}
        required
        defaultValue={state.values?.name ?? name}
        error={state.fieldErrors?.name}
      />
      <FieldShell
        id={timezoneId}
        label="Fuso horário"
        hint="Define em que dia e mês cada lançamento entra."
        error={timezoneError}
      >
        <select
          id={timezoneId}
          name="timezone"
          defaultValue={state.values?.timezone ?? timezone}
          aria-invalid={timezoneError ? true : undefined}
          aria-describedby={describedBy(
            timezoneId,
            "Define em que dia e mês cada lançamento entra.",
            timezoneError,
          )}
          className={`${fieldControlClass} w-full rounded-lg border border-input bg-transparent outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50`}
        >
          <optgroup label="Brasil">
            {brazilTimezones.map((option) => (
              <option key={option} value={option}>
                {timezoneLabel(option)}
              </option>
            ))}
          </optgroup>
          <optgroup label="Outros">
            {otherTimezones.map((option) => (
              <option key={option} value={option}>
                {timezoneLabel(option)}
              </option>
            ))}
          </optgroup>
        </select>
      </FieldShell>
      <FormMessage state={state} />
      <SubmitButton pending={pending} pendingLabel="Salvando…">
        Salvar perfil
      </SubmitButton>
    </form>
  );
}
