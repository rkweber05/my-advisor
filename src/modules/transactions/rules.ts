import { z } from "zod";

import { isCalendarDate } from "@/lib/dates/month";
import { MAX_AMOUNT_CENTS } from "@/lib/money/parse";

import {
  paymentMethods,
  transactionTypes,
  type PaymentMethod,
  type TransactionType,
} from "./labels";

// Linha pronta para o banco: o que o tipo não usa vai sempre nulo (regra 7 da spec).
export type TransactionRow = {
  type: TransactionType;
  amount_cents: number;
  transaction_date: string;
  description: string | null;
  notes: string | null;
  status: "completed" | "pending";
  category_id: string | null;
  payment_method: PaymentMethod | null;
  account_id: string | null;
  card_id: string | null;
  destination_account_id: string | null;
};

export type RawTransaction = Record<string, string>;

export type ParsedTransaction =
  | { ok: true; row: TransactionRow }
  | { ok: false; fieldErrors: Record<string, string> };

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Use no máximo ${max} caracteres.` })
    .transform((value) => (value === "" ? null : value));

const commonSchema = z.object({
  type: z.enum(transactionTypes),
  amount_cents: z.coerce
    .number({ error: "Informe um valor maior que zero." })
    .int({ error: "Informe um valor maior que zero." })
    .min(1, { error: "Informe um valor maior que zero." })
    .max(MAX_AMOUNT_CENTS, { error: "O valor máximo é R$ 999.999.999,99." }),
  transaction_date: z
    .string()
    .refine(isCalendarDate, { error: "Informe uma data válida." }),
  description: optionalText(140),
  notes: optionalText(500),
  status: z.enum(["completed", "pending"]),
});

const uuid = z.uuid();

function pick(
  raw: RawTransaction,
  field: string,
  message: string,
  errors: Record<string, string>,
): string | null {
  const parsed = uuid.safeParse(raw[field]);
  if (parsed.success) return parsed.data;

  errors[field] = message;
  return null;
}

function pickMethod(
  raw: RawTransaction,
  allowed: readonly PaymentMethod[],
  errors: Record<string, string>,
): PaymentMethod | null {
  const method = allowed.find((option) => option === raw.payment_method);
  if (method) return method;

  errors.payment_method = "Escolha a forma de pagamento.";
  return null;
}

type Links = Pick<
  TransactionRow,
  | "category_id"
  | "payment_method"
  | "account_id"
  | "card_id"
  | "destination_account_id"
>;

const NO_LINKS: Links = {
  category_id: null,
  payment_method: null,
  account_id: null,
  card_id: null,
  destination_account_id: null,
};

function expenseLinks(raw: RawTransaction, errors: Record<string, string>) {
  const payment_method = pickMethod(raw, paymentMethods, errors);
  const onCredit = payment_method === "credit_card";

  return {
    ...NO_LINKS,
    category_id: pick(raw, "category_id", "Escolha a categoria.", errors),
    payment_method,
    // Compra no crédito tem cartão e não tem conta; as demais formas, o contrário.
    card_id: onCredit
      ? pick(raw, "card_id", "Escolha o cartão.", errors)
      : null,
    account_id: onCredit
      ? null
      : pick(raw, "account_id", "Escolha a conta.", errors),
  };
}

function incomeLinks(raw: RawTransaction, errors: Record<string, string>) {
  const withoutCredit = paymentMethods.filter(
    (method) => method !== "credit_card",
  );

  return {
    ...NO_LINKS,
    category_id: pick(raw, "category_id", "Escolha a categoria.", errors),
    payment_method: pickMethod(raw, withoutCredit, errors),
    account_id: pick(raw, "account_id", "Escolha a conta.", errors),
  };
}

function transferLinks(raw: RawTransaction, errors: Record<string, string>) {
  const account_id = pick(
    raw,
    "account_id",
    "Escolha a conta de origem.",
    errors,
  );
  const destination_account_id = pick(
    raw,
    "destination_account_id",
    "Escolha a conta de destino.",
    errors,
  );
  if (account_id && account_id === destination_account_id) {
    errors.destination_account_id = "Origem e destino precisam ser diferentes.";
  }

  return { ...NO_LINKS, account_id, destination_account_id };
}

function cardPaymentLinks(raw: RawTransaction, errors: Record<string, string>) {
  return {
    ...NO_LINKS,
    card_id: pick(raw, "card_id", "Escolha o cartão.", errors),
    account_id: pick(raw, "account_id", "Escolha a conta que paga.", errors),
  };
}

const linksByType: Record<
  TransactionType,
  (raw: RawTransaction, errors: Record<string, string>) => Links
> = {
  expense: expenseLinks,
  income: incomeLinks,
  transfer: transferLinks,
  card_payment: cardPaymentLinks,
};

// Valida o que veio do formulário e devolve a linha, com o que cada tipo exige.
// Os erros dos campos comuns e dos vínculos saem juntos, para a pessoa corrigir de uma vez.
export function parseTransaction(raw: RawTransaction): ParsedTransaction {
  const fieldErrors: Record<string, string> = {};
  const common = commonSchema.safeParse(raw);
  for (const issue of common.error?.issues ?? []) {
    fieldErrors[String(issue.path[0])] ??= issue.message;
  }

  const type = transactionTypes.find((value) => value === raw.type);
  const links = type ? linksByType[type](raw, fieldErrors) : NO_LINKS;

  if (!common.success || Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }
  return { ok: true, row: { ...common.data, ...links } };
}
