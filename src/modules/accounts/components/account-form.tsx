"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/form/form-message";
import { SelectField } from "@/components/form/select-field";
import { SubmitButton } from "@/components/form/submit-button";
import { TextField } from "@/components/form/text-field";
import { useFocusFirstError } from "@/components/form/use-focus-first-error";
import { emptyFormState } from "@/lib/forms/form-state";
import { formatCents } from "@/lib/money/format";

import { saveAccountAction } from "../actions";
import { accountTypeLabels, accountTypes, type Account } from "../schemas";

export function AccountForm({ account }: { account?: Account }) {
  const [state, formAction, pending] = useActionState(
    saveAccountAction,
    emptyFormState,
  );
  const formRef = useFocusFirstError(state);
  const values = state.values;

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="flex flex-col gap-4"
    >
      {account && <input type="hidden" name="id" value={account.id} />}
      <TextField
        label="Nome"
        name="name"
        maxLength={40}
        required
        defaultValue={values?.name ?? account?.name ?? ""}
        error={state.fieldErrors?.name}
      />
      <SelectField
        label="Tipo"
        name="account_type"
        defaultValue={
          values?.account_type ?? account?.account_type ?? "checking"
        }
        error={state.fieldErrors?.account_type}
      >
        {accountTypes.map((type) => (
          <option key={type} value={type}>
            {accountTypeLabels[type]}
          </option>
        ))}
      </SelectField>
      <TextField
        label="Instituição (opcional)"
        name="institution"
        maxLength={40}
        defaultValue={values?.institution ?? account?.institution ?? ""}
        error={state.fieldErrors?.institution}
      />
      <TextField
        label="Saldo inicial"
        name="initial_balance_cents"
        inputMode="decimal"
        autoComplete="off"
        hint="Quanto havia na conta antes do primeiro lançamento. Pode ser negativo."
        defaultValue={
          values?.initial_balance_cents ??
          (account ? formatCents(account.initial_balance_cents) : "")
        }
        error={state.fieldErrors?.initial_balance_cents}
      />
      <FormMessage state={state} />
      <SubmitButton pending={pending} pendingLabel="Salvando…">
        {account ? "Salvar" : "Criar conta"}
      </SubmitButton>
    </form>
  );
}
