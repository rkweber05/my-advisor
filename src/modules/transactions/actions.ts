"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth/require-user";
import { textFrom, type FormState } from "@/lib/forms/form-state";
import { createClient } from "@/lib/supabase/server";

import { findTransaction } from "./repository";
import { parseTransaction, type RawTransaction } from "./rules";
import {
  changeTransaction,
  createTransaction,
  removeTransaction,
  type SaveResult,
} from "./service";

const uuid = z.uuid();
const FIELDS = [
  "type",
  "amount_cents",
  "transaction_date",
  "category_id",
  "payment_method",
  "account_id",
  "card_id",
  "destination_account_id",
  "description",
  "notes",
] as const;

const messages = {
  invalid:
    "Não foi possível gravar. Confira a conta, o cartão e a categoria escolhidos.",
  not_found: "Este lançamento não existe mais.",
  expired: "Este formulário expirou. Recarregue a página e tente de novo.",
} as const;

function rawFrom(formData: FormData): RawTransaction {
  const raw: RawTransaction = {
    status: formData.get("pending") === "on" ? "pending" : "completed",
  };
  for (const field of FIELDS) raw[field] = textFrom(formData, field);
  return raw;
}

function failure(result: Exclude<SaveResult, { ok: true }>): FormState {
  if (result.reason === "duplicate") return { duplicate: result.question };
  return { message: messages[result.reason] };
}

// Volta para o histórico do mês do lançamento, com a confirmação.
function redirectToSaved(id: string, date: string): never {
  redirect(`/transactions?month=${date.slice(0, 7)}&saved=${id}`);
}

export async function createTransactionAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();

  const key = uuid.safeParse(textFrom(formData, "idempotency_key"));
  if (!key.success) return { message: messages.expired };

  const parsed = parseTransaction(rawFrom(formData));
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };

  const result = await createTransaction(
    parsed.row,
    key.data,
    formData.get("confirm_duplicate") === "1",
  );
  if (!result.ok) return failure(result);

  redirectToSaved(result.id, parsed.row.transaction_date);
}

export async function updateTransactionAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();

  const id = uuid.safeParse(textFrom(formData, "id"));
  if (!id.success) return { message: messages.not_found };

  // O tipo vem do banco, não do formulário: ele não muda depois de criado (D-39).
  const current = await findTransaction(await createClient(), id.data);
  if (!current) return { message: messages.not_found };

  const parsed = parseTransaction({
    ...rawFrom(formData),
    type: current.type,
  });
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors };

  const result = await changeTransaction(id.data, parsed.row);
  if (!result.ok) return failure(result);

  redirectToSaved(result.id, parsed.row.transaction_date);
}

export async function deleteTransactionAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();

  const id = uuid.safeParse(textFrom(formData, "id"));
  if (!id.success || !(await removeTransaction(id.data))) {
    return { message: messages.not_found };
  }

  redirect("/transactions?deleted=1");
}
