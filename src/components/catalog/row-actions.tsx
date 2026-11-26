"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { emptyFormState, type FormState } from "@/lib/forms/form-state";

type RowAction = (
  previous: FormState,
  formData: FormData,
) => Promise<FormState>;

type RowActionsProps = {
  id: string;
  isActive: boolean;
  toggleAction: RowAction;
  deleteAction: RowAction;
};

// Desativar e excluir um item de cadastro. Excluir só dá certo para item sem lançamento;
// para os demais, o servidor responde com a explicação.
export function RowActions({
  id,
  isActive,
  toggleAction,
  deleteAction,
}: RowActionsProps) {
  const [toggleState, toggle, toggling] = useActionState(
    toggleAction,
    emptyFormState,
  );
  const [deleteState, remove, removing] = useActionState(
    deleteAction,
    emptyFormState,
  );
  const message = toggleState.message ?? deleteState.message;

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex flex-wrap gap-3">
        <form action={toggle}>
          <input type="hidden" name="id" value={id} />
          <input
            type="hidden"
            name="is_active"
            value={isActive ? "false" : "true"}
          />
          <Button
            type="submit"
            variant="outline"
            disabled={toggling}
            className="h-11 border-input px-4"
          >
            {isActive ? "Desativar" : "Reativar"}
          </Button>
        </form>
        <form action={remove}>
          <input type="hidden" name="id" value={id} />
          <Button
            type="submit"
            variant="destructive"
            disabled={removing}
            className="h-11 px-4"
          >
            Excluir
          </Button>
        </form>
      </div>
      {message && (
        <p role="alert" className="text-sm font-medium text-danger-strong">
          {message}
        </p>
      )}
    </div>
  );
}
