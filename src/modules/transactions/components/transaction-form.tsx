"use client";

import Link from "next/link";
import { startTransition, useActionState, useId, useState } from "react";

import { ChoiceGroup, type Choice } from "@/components/form/choice-group";
import { FormMessage } from "@/components/form/form-message";
import { SubmitButton } from "@/components/form/submit-button";
import { TextField } from "@/components/form/text-field";
import { useFocusFirstError } from "@/components/form/use-focus-first-error";
import { Button } from "@/components/ui/button";
import { emptyFormState, type FormState } from "@/lib/forms/form-state";
import { formatCents } from "@/lib/money/format";

import {
  paymentMethodLabels,
  paymentMethods,
  transactionTypes,
  typeLabels,
  typeLongLabels,
  typeNotes,
  type TransactionType,
} from "../labels";
import type { FormOptions } from "../service";

export type TransactionFormValues = {
  type: TransactionType;
  amount_cents: number;
  transaction_date: string;
  category_id: string;
  payment_method: string;
  account_id: string;
  card_id: string;
  destination_account_id: string;
  description: string;
  notes: string;
  pending: boolean;
};

type TransactionFormProps = {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  options: FormOptions;
  initial: TransactionFormValues;
  // Só na criação: identifica este envio, para o reenvio não duplicar (D-22).
  idempotencyKey?: string;
  // Só na edição.
  transactionId?: string;
};

const MAX_DIGITS = 11;
const typeChoices: Choice[] = transactionTypes.map((type) => ({
  value: type,
  label: typeLabels[type],
}));

function methodChoices(type: TransactionType): Choice[] {
  return paymentMethods
    .filter((method) => type === "expense" || method !== "credit_card")
    .map((method) => ({ value: method, label: paymentMethodLabels[method] }));
}

// Só dígitos: "1550" é mostrado como R$ 15,50. Não há vírgula para procurar no teclado.
function AmountField({
  cents,
  onChange,
  error,
  autoFocus,
}: {
  cents: number;
  onChange: (cents: number) => void;
  error?: string;
  autoFocus: boolean;
}) {
  const id = useId();

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        Valor
      </label>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder={formatCents(0)}
        value={cents > 0 ? formatCents(cents) : ""}
        onChange={(event) =>
          onChange(
            Number(event.target.value.replace(/\D/g, "").slice(-MAX_DIGITS)),
          )
        }
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="h-16 w-full rounded-lg border border-input bg-card px-3 text-3xl font-semibold tracking-tight tabular-nums outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-danger-strong"
      />
      <input type="hidden" name="amount_cents" value={cents} />
      {error && (
        <p
          id={`${id}-error`}
          className="text-sm font-medium text-danger-strong"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function NoAccounts() {
  return (
    <p className="rounded-lg border border-info/40 bg-info-soft px-3 py-2.5 text-sm">
      Cadastre uma conta para lançar.{" "}
      <Link
        href="/settings/accounts"
        className="font-medium text-primary underline"
      >
        Cadastrar conta
      </Link>
    </p>
  );
}

function NoCards() {
  return (
    <p className="rounded-lg border border-info/40 bg-info-soft px-3 py-2.5 text-sm">
      Cadastre um cartão para lançar no crédito.{" "}
      <Link
        href="/settings/cards"
        className="font-medium text-primary underline"
      >
        Cadastrar cartão
      </Link>
    </p>
  );
}

export function TransactionForm({
  action,
  options,
  initial,
  idempotencyKey,
  transactionId,
}: TransactionFormProps) {
  const [state, formAction, pending] = useActionState(action, emptyFormState);
  const formRef = useFocusFirstError(state);
  const [values, setValues] = useState(initial);
  const errors = state.fieldErrors ?? {};
  const isEdit = Boolean(transactionId);
  const { type } = values;
  const hasCategory = type === "expense" || type === "income";
  const onCredit =
    type === "expense" && values.payment_method === "credit_card";
  const showCard = onCredit || type === "card_payment";
  const showAccount = !onCredit;

  function set<K extends keyof TransactionFormValues>(
    field: K,
    value: TransactionFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  // Trocar o tipo troca os campos: a categoria é de outro tipo, e receita não tem crédito.
  function changeType(next: string) {
    setValues((current) => ({
      ...current,
      type: next as TransactionType,
      category_id: "",
      payment_method:
        next === "income" && current.payment_method === "credit_card"
          ? "pix"
          : current.payment_method,
    }));
  }

  // Envio pelo próprio componente: o envio automático do React limparia os botões de opção
  // depois de uma resposta com erro, e a pessoa perderia o que já escolheu.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-6"
    >
      {idempotencyKey && (
        <input type="hidden" name="idempotency_key" value={idempotencyKey} />
      )}
      {transactionId && <input type="hidden" name="id" value={transactionId} />}

      {isEdit ? (
        <p className="text-sm text-muted-foreground">
          Tipo:{" "}
          <span className="font-medium text-foreground">
            {typeLongLabels[type]}
          </span>
          . Para trocar o tipo, exclua e lance de novo.
        </p>
      ) : (
        <ChoiceGroup
          legend="Tipo"
          name="type"
          options={typeChoices}
          value={type}
          onChange={changeType}
        />
      )}
      {typeNotes[type] && (
        <p className="text-sm text-muted-foreground">{typeNotes[type]}</p>
      )}

      <AmountField
        cents={values.amount_cents}
        onChange={(cents) => set("amount_cents", cents)}
        error={errors.amount_cents}
        autoFocus={!isEdit}
      />

      {hasCategory && (
        <ChoiceGroup
          legend="Categoria"
          name="category_id"
          options={options.categories[type]}
          value={values.category_id}
          onChange={(value) => set("category_id", value)}
          error={errors.category_id}
        />
      )}
      {hasCategory && (
        <ChoiceGroup
          legend="Forma de pagamento"
          name="payment_method"
          options={methodChoices(type)}
          value={values.payment_method}
          onChange={(value) => set("payment_method", value)}
          error={errors.payment_method}
        />
      )}

      {showCard &&
        (options.cards.length > 0 ? (
          <ChoiceGroup
            legend="Cartão"
            name="card_id"
            options={options.cards}
            value={values.card_id}
            onChange={(value) => set("card_id", value)}
            error={errors.card_id}
          />
        ) : (
          <NoCards />
        ))}
      {showAccount &&
        (options.accounts.length > 0 ? (
          <ChoiceGroup
            legend={
              type === "transfer"
                ? "Conta de origem"
                : type === "card_payment"
                  ? "Conta que paga"
                  : "Conta"
            }
            name="account_id"
            options={options.accounts}
            value={values.account_id}
            onChange={(value) => set("account_id", value)}
            error={errors.account_id}
          />
        ) : (
          <NoAccounts />
        ))}
      {type === "transfer" && options.accounts.length > 0 && (
        <ChoiceGroup
          legend="Conta de destino"
          name="destination_account_id"
          options={options.accounts.filter(
            (account) => account.value !== values.account_id,
          )}
          value={values.destination_account_id}
          onChange={(value) => set("destination_account_id", value)}
          error={errors.destination_account_id}
        />
      )}

      <TextField
        label="Data"
        name="transaction_date"
        type="date"
        required
        value={values.transaction_date}
        onChange={(event) => set("transaction_date", event.target.value)}
        error={errors.transaction_date}
      />

      <details
        className="rounded-lg border border-border"
        open={Boolean(
          errors.description ||
          errors.notes ||
          initial.description ||
          initial.notes ||
          initial.pending,
        )}
      >
        <summary className="flex min-h-11 cursor-pointer items-center px-3 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          Mais detalhes
        </summary>
        <div className="flex flex-col gap-4 px-3 pb-4">
          <TextField
            label="Descrição (opcional)"
            name="description"
            maxLength={140}
            value={values.description}
            onChange={(event) => set("description", event.target.value)}
            error={errors.description}
          />
          <TextField
            label="Observações (opcional)"
            name="notes"
            maxLength={500}
            value={values.notes}
            onChange={(event) => set("notes", event.target.value)}
            error={errors.notes}
          />
          <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              name="pending"
              checked={values.pending}
              onChange={(event) => set("pending", event.target.checked)}
              className="size-5 accent-primary"
            />
            Ainda não foi pago
          </label>
        </div>
      </details>

      <FormMessage state={state} />

      {state.duplicate ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-warning/50 bg-warning-soft p-3"
        >
          <p className="text-sm font-medium">{state.duplicate}</p>
          <div className="flex flex-wrap gap-3">
            <input type="hidden" name="confirm_duplicate" value="1" />
            <Button type="submit" disabled={pending} className="h-11 px-4">
              Lançar mesmo assim
            </Button>
            <Link
              href="/transactions"
              className="inline-flex h-11 items-center rounded-lg border border-input bg-card px-4 text-sm font-medium"
            >
              Cancelar
            </Link>
          </div>
        </div>
      ) : (
        <div className="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] -mx-5 border-t border-border bg-card px-5 py-3 md:bottom-0">
          <SubmitButton pending={pending} pendingLabel="Salvando…">
            {isEdit ? "Salvar alterações" : "Salvar"}
          </SubmitButton>
        </div>
      )}
    </form>
  );
}
