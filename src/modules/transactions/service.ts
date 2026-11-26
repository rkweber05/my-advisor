import "server-only";

import type { Choice } from "@/components/form/choice-group";
import { formatCents } from "@/lib/money/format";
import { createClient } from "@/lib/supabase/server";
import { listAccounts } from "@/modules/accounts/repository";
import { recordAuditEvent } from "@/modules/audit/service";
import { listCards } from "@/modules/cards/repository";
import { listCategories } from "@/modules/categories/repository";

import { typeLongLabels } from "./labels";
import {
  countSimilar,
  deleteTransaction,
  findTransactionIdByKey,
  insertTransaction,
  listRecentChoices,
  updateTransaction,
  type RecentChoice,
  type Transaction,
} from "./repository";
import type { TransactionRow } from "./rules";

const UNIQUE_VIOLATION = "23505";

export type SaveResult =
  | { ok: true; id: string }
  | { ok: false; reason: "duplicate"; question: string }
  | { ok: false; reason: "invalid" | "not_found" };

function duplicateQuestion(row: TransactionRow): string {
  const label = typeLongLabels[row.type].toLowerCase();
  return `Já existe um lançamento do tipo ${label} de ${formatCents(row.amount_cents)} nesta data. Lançar mesmo assim?`;
}

// Cria a movimentação. A chave de idempotência vem do formulário: o segundo envio com a mesma
// chave devolve a movimentação já gravada, sem criar outra (D-22).
export async function createTransaction(
  row: TransactionRow,
  idempotencyKey: string,
  confirmedDuplicate: boolean,
): Promise<SaveResult> {
  const supabase = await createClient();

  const existing = await findTransactionIdByKey(supabase, idempotencyKey);
  if (existing.data) return { ok: true, id: existing.data.id };

  if (!confirmedDuplicate && (await countSimilar(supabase, row)) > 0) {
    return { ok: false, reason: "duplicate", question: duplicateQuestion(row) };
  }

  const { data, error } = await insertTransaction(
    supabase,
    row,
    idempotencyKey,
  );
  if (error?.code === UNIQUE_VIOLATION) {
    const again = await findTransactionIdByKey(supabase, idempotencyKey);
    if (again.data) return { ok: true, id: again.data.id };
  }
  if (error || !data) {
    console.error("transaction_create_failed", error?.code);
    return { ok: false, reason: "invalid" };
  }

  await recordAuditEvent(supabase, "transaction_created", data.id);
  return { ok: true, id: data.id };
}

export async function changeTransaction(
  id: string,
  row: TransactionRow,
): Promise<SaveResult> {
  const supabase = await createClient();
  const { data, error } = await updateTransaction(supabase, id, row);

  if (error) {
    console.error("transaction_update_failed", error.code);
    return { ok: false, reason: "invalid" };
  }
  if (data.length === 0) return { ok: false, reason: "not_found" };

  await recordAuditEvent(supabase, "transaction_updated", id);
  return { ok: true, id };
}

// Exclusão definitiva (D-36). Fica o evento de auditoria, só com o id.
export async function removeTransaction(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await deleteTransaction(supabase, id);
  if (error || data.length === 0) return false;

  await recordAuditEvent(supabase, "transaction_deleted", id);
  return true;
}

export type FormOptions = {
  categories: { expense: Choice[]; income: Choice[] };
  accounts: Choice[];
  cards: Choice[];
  defaults: { payment_method: string; account_id: string; card_id: string };
};

type Item = { id: string; name: string; is_active: boolean };

function usageOf(recent: RecentChoice[], field: keyof RecentChoice) {
  const usage = new Map<string, number>();
  for (const choice of recent) {
    const id = choice[field];
    if (id) usage.set(id, (usage.get(id) ?? 0) + 1);
  }
  return usage;
}

// Itens ativos, os mais usados primeiro. O item já escolhido em uma movimentação antiga
// continua aparecendo mesmo desativado, para a edição não perdê-lo.
function toChoices(
  items: Item[],
  usage: Map<string, number>,
  keep: Array<string | null | undefined>,
): Choice[] {
  return items
    .filter((item) => item.is_active || keep.includes(item.id))
    .sort((a, b) => (usage.get(b.id) ?? 0) - (usage.get(a.id) ?? 0))
    .map((item) => ({ value: item.id, label: item.name }));
}

export async function getFormOptions(
  current?: Transaction,
): Promise<FormOptions> {
  const supabase = await createClient();
  const [categories, accounts, cards, recent] = await Promise.all([
    listCategories(supabase),
    listAccounts(supabase),
    listCards(supabase),
    listRecentChoices(supabase),
  ]);
  const categoryUsage = usageOf(recent, "category_id");
  const keep = [
    current?.category_id,
    current?.account_id,
    current?.card_id,
    current?.destination_account_id,
  ];
  const ofType = (type: string) =>
    toChoices(
      categories.filter((category) => category.type === type),
      categoryUsage,
      keep,
    );
  const accountChoices = toChoices(
    accounts,
    usageOf(recent, "account_id"),
    keep,
  );
  const cardChoices = toChoices(cards, usageOf(recent, "card_id"), keep);
  const isOffered = (choices: Choice[], id: string | null | undefined) =>
    choices.some((choice) => choice.value === id);

  // O último usado já vem marcado; sem histórico, o primeiro da lista.
  const lastAccount = recent.find((choice) =>
    isOffered(accountChoices, choice.account_id),
  )?.account_id;
  const lastCard = recent.find((choice) =>
    isOffered(cardChoices, choice.card_id),
  )?.card_id;

  return {
    categories: { expense: ofType("expense"), income: ofType("income") },
    accounts: accountChoices,
    cards: cardChoices,
    defaults: {
      payment_method: recent[0]?.payment_method ?? "pix",
      account_id: lastAccount ?? accountChoices[0]?.value ?? "",
      card_id: lastCard ?? cardChoices[0]?.value ?? "",
    },
  };
}
