"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/form/form-message";
import { SubmitButton } from "@/components/form/submit-button";
import { TextField } from "@/components/form/text-field";
import { useFocusFirstError } from "@/components/form/use-focus-first-error";
import { emptyFormState } from "@/lib/forms/form-state";

import { createCategoryAction, renameCategoryAction } from "../actions";
import type { Category, CategoryType } from "../schemas";

type CategoryFormProps =
  | { category: Category; type?: never }
  | { category?: never; type: CategoryType };

// Cria uma categoria do tipo informado ou renomeia uma existente. O tipo não muda (regra 11).
export function CategoryForm({ category, type }: CategoryFormProps) {
  const [state, formAction, pending] = useActionState(
    category ? renameCategoryAction : createCategoryAction,
    emptyFormState,
  );
  const formRef = useFocusFirstError(state);

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="flex flex-col gap-4"
    >
      {category ? (
        <input type="hidden" name="id" value={category.id} />
      ) : (
        <input type="hidden" name="type" value={type} />
      )}
      <TextField
        label={category ? "Nome" : "Nome da nova categoria"}
        name="name"
        maxLength={40}
        required
        defaultValue={state.values?.name ?? category?.name ?? ""}
        error={state.fieldErrors?.name}
      />
      <FormMessage state={state} />
      <SubmitButton pending={pending} pendingLabel="Salvando…">
        {category ? "Salvar" : "Criar categoria"}
      </SubmitButton>
    </form>
  );
}
