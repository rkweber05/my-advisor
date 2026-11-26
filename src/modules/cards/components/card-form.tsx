"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/form/form-message";
import { SelectField } from "@/components/form/select-field";
import { SubmitButton } from "@/components/form/submit-button";
import { TextField } from "@/components/form/text-field";
import { useFocusFirstError } from "@/components/form/use-focus-first-error";
import { emptyFormState } from "@/lib/forms/form-state";
import { formatCents } from "@/lib/money/format";

import { saveCardAction } from "../actions";
import { cardBrandLabels, cardBrands, type Card } from "../schemas";

function dayText(day: number | null | undefined) {
  return day ? String(day) : "";
}

export function CardForm({ card }: { card?: Card }) {
  const [state, formAction, pending] = useActionState(
    saveCardAction,
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
      {card && <input type="hidden" name="id" value={card.id} />}
      <TextField
        label="Nome do cartão"
        name="name"
        maxLength={40}
        required
        defaultValue={values?.name ?? card?.name ?? ""}
        error={state.fieldErrors?.name}
      />
      <SelectField
        label="Bandeira"
        name="brand"
        defaultValue={values?.brand ?? card?.brand ?? "visa"}
        error={state.fieldErrors?.brand}
      >
        {cardBrands.map((brand) => (
          <option key={brand} value={brand}>
            {cardBrandLabels[brand]}
          </option>
        ))}
      </SelectField>
      <TextField
        label="Instituição (opcional)"
        name="institution"
        maxLength={40}
        defaultValue={values?.institution ?? card?.institution ?? ""}
        error={state.fieldErrors?.institution}
      />
      <TextField
        label="Limite (opcional)"
        name="credit_limit_cents"
        inputMode="decimal"
        autoComplete="off"
        defaultValue={
          values?.credit_limit_cents ??
          (card?.credit_limit_cents ? formatCents(card.credit_limit_cents) : "")
        }
        error={state.fieldErrors?.credit_limit_cents}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Dia de fechamento"
          name="closing_day"
          inputMode="numeric"
          autoComplete="off"
          defaultValue={values?.closing_day ?? dayText(card?.closing_day)}
          error={state.fieldErrors?.closing_day}
        />
        <TextField
          label="Dia de vencimento"
          name="due_day"
          inputMode="numeric"
          autoComplete="off"
          defaultValue={values?.due_day ?? dayText(card?.due_day)}
          error={state.fieldErrors?.due_day}
        />
      </div>
      <FormMessage state={state} />
      <SubmitButton pending={pending} pendingLabel="Salvando…">
        {card ? "Salvar" : "Criar cartão"}
      </SubmitButton>
    </form>
  );
}
