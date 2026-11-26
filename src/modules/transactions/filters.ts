import { monthRange } from "@/lib/dates/month";

import {
  paymentMethods,
  transactionTypes,
  type PaymentMethod,
  type TransactionType,
} from "./labels";

export const PAGE_SIZE = 50;
const MAX_LIMIT = 500;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type TransactionFilters = {
  month: string;
  q: string;
  type?: TransactionType;
  category?: string;
  method?: PaymentMethod;
  limit: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

function text(params: SearchParams, key: string): string {
  const value = params[key];
  return typeof value === "string" ? value : "";
}

// Lê os filtros do endereço. Valor desconhecido é descartado, nunca repassado à consulta.
export function parseFilters(
  params: SearchParams,
  currentMonth: string,
): TransactionFilters {
  const month = text(params, "month");
  const limit = Number(text(params, "limit"));

  return {
    month: monthRange(month) ? month : currentMonth,
    q: text(params, "q").trim().slice(0, 140),
    type: transactionTypes.find((value) => value === text(params, "type")),
    category: UUID.test(text(params, "category"))
      ? text(params, "category")
      : undefined,
    method: paymentMethods.find((value) => value === text(params, "method")),
    limit:
      Number.isInteger(limit) && limit > PAGE_SIZE
        ? Math.min(limit, MAX_LIMIT)
        : PAGE_SIZE,
  };
}

// Endereço da lista com os filtros dados; o que está vazio fica de fora.
export function transactionsHref(
  filters: TransactionFilters,
  changes: Partial<TransactionFilters> = {},
): string {
  const merged = { ...filters, ...changes };
  const query = new URLSearchParams();

  query.set("month", merged.month);
  if (merged.q) query.set("q", merged.q);
  if (merged.type) query.set("type", merged.type);
  if (merged.category) query.set("category", merged.category);
  if (merged.method) query.set("method", merged.method);
  if (merged.limit > PAGE_SIZE) query.set("limit", String(merged.limit));

  return `/transactions?${query.toString()}`;
}

// O texto da busca é tratado como literal: `%`, `_` e `\` perdem o sentido de curinga.
export function escapeLikePattern(text: string): string {
  return text.replace(/[\\%_]/g, "\\$&");
}
