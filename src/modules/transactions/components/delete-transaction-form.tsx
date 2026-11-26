"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/form/form-message";
import { SubmitButton } from "@/components/form/submit-button";
import { emptyFormState } from "@/lib/forms/form-state";

import { deleteTransactionAction } from "../actions";

// A confirmação fica na própria tela: abrir a seção já é o primeiro passo.
export function DeleteTransactionForm({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(
    deleteTransactionAction,
    emptyFormState,
  );

  return (
    <details>
      <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium text-danger-strong outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        Excluir este lançamento
      </summary>
      <form action={formAction} className="flex flex-col gap-4 pt-3">
        <input type="hidden" name="id" value={id} />
        <p>Excluir este lançamento? Não tem volta.</p>
        <FormMessage state={state} />
        <SubmitButton
          pending={pending}
          pendingLabel="Excluindo…"
          variant="destructive"
        >
          Excluir em definitivo
        </SubmitButton>
      </form>
    </details>
  );
}
