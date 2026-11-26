import { z } from "zod";

import { parseSignedAmountToCents } from "@/lib/money/parse";
import { catalogNameSchema } from "@/modules/categories/schemas";

export const accountTypes = [
  "checking",
  "savings",
  "cash",
  "investment",
  "other",
] as const;
export type AccountType = (typeof accountTypes)[number];

export const accountTypeLabels: Record<AccountType, string> = {
  checking: "Conta corrente",
  savings: "Poupança",
  cash: "Dinheiro em espécie",
  investment: "Investimento",
  other: "Outra",
};

// Texto opcional de até 40 caracteres; vazio vira nulo.
export const optionalInstitution = z
  .string()
  .trim()
  .max(40, { error: "Use no máximo 40 caracteres." })
  .transform((value) => (value === "" ? null : value));

// "1.234,56" ou "-50,00" para centavos; vazio vale zero.
const balance = z
  .string()
  .transform((value) =>
    value.trim() === "" ? 0 : parseSignedAmountToCents(value),
  )
  .refine((value): value is number => value !== null, {
    error: "Informe um valor em reais, como 1.234,56.",
  });

export const accountSchema = z.object({
  name: catalogNameSchema,
  institution: optionalInstitution,
  account_type: z.enum(accountTypes),
  initial_balance_cents: balance,
});

export type AccountInput = z.infer<typeof accountSchema>;

export type Account = {
  id: string;
  name: string;
  institution: string | null;
  account_type: AccountType;
  initial_balance_cents: number;
  is_active: boolean;
};

export type AccountWithBalance = Account & { balance_cents: number };
