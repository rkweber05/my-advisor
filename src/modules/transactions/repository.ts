import { monthRange } from "@/lib/dates/month";
import type { ServerClient } from "@/lib/supabase/server";

import { escapeLikePattern, type TransactionFilters } from "./filters";
import { INDICATOR_TYPES, type TransactionType } from "./labels";
import type { TransactionRow } from "./rules";

const COLUMNS =
  "id, type, amount_cents, transaction_date, description, notes, status, category_id, payment_method, account_id, card_id, destination_account_id";

export type Transaction = TransactionRow & { id: string };

export function insertTransaction(
  supabase: ServerClient,
  row: TransactionRow,
  idempotencyKey: string,
) {
  return supabase
    .from("transactions")
    .insert({ ...row, idempotency_key: idempotencyKey })
    .select("id")
    .single();
}

export function findTransactionIdByKey(
  supabase: ServerClient,
  idempotencyKey: string,
) {
  return supabase
    .from("transactions")
    .select("id")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
}

export async function findTransaction(
  supabase: ServerClient,
  id: string,
): Promise<Transaction | null> {
  const { data, error } = await supabase
    .from("transactions")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`transaction_read_failed: ${error.code}`);
  return data as Transaction | null;
}

// O tipo não é alterável (D-39): fica fora da atualização.
export function updateTransaction(
  supabase: ServerClient,
  id: string,
  row: TransactionRow,
) {
  const changes: Partial<TransactionRow> = { ...row };
  delete changes.type;

  return supabase
    .from("transactions")
    .update(changes)
    .eq("id", id)
    .select("id");
}

export function deleteTransaction(supabase: ServerClient, id: string) {
  return supabase.from("transactions").delete().eq("id", id).select("id");
}

export async function countSimilar(
  supabase: ServerClient,
  row: Pick<TransactionRow, "type" | "amount_cents" | "transaction_date">,
): Promise<number> {
  const { count, error } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("type", row.type)
    .eq("amount_cents", row.amount_cents)
    .eq("transaction_date", row.transaction_date);

  if (error) throw new Error(`transaction_count_failed: ${error.code}`);
  return count ?? 0;
}

export async function listTransactions(
  supabase: ServerClient,
  filters: TransactionFilters,
): Promise<Transaction[]> {
  const range = monthRange(filters.month);
  if (!range) return [];

  let query = supabase
    .from("transactions")
    .select(COLUMNS)
    .gte("transaction_date", range.start)
    .lt("transaction_date", range.endExclusive);

  if (filters.type) query = query.eq("type", filters.type);
  if (filters.category) query = query.eq("category_id", filters.category);
  if (filters.method) query = query.eq("payment_method", filters.method);
  if (filters.q) {
    query = query.ilike("description", `%${escapeLikePattern(filters.q)}%`);
  }

  const { data, error } = await query
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(filters.limit);

  if (error) throw new Error(`transactions_read_failed: ${error.code}`);
  return data as Transaction[];
}

export type RecentChoice = {
  type: TransactionType;
  category_id: string | null;
  payment_method: string | null;
  account_id: string | null;
  card_id: string | null;
};

// Últimas receitas e despesas: servem para pôr na frente o que a pessoa mais usa.
export async function listRecentChoices(
  supabase: ServerClient,
): Promise<RecentChoice[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("type, category_id, payment_method, account_id, card_id")
    .in("type", [...INDICATOR_TYPES])
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(`recent_choices_failed: ${error.code}`);
  return data as RecentChoice[];
}
