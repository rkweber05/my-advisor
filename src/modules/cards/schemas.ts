import { z } from "zod";

import { parseAmountToCents } from "@/lib/money/parse";
import { optionalInstitution } from "@/modules/accounts/schemas";
import { catalogNameSchema } from "@/modules/categories/schemas";

export const cardBrands = [
  "visa",
  "mastercard",
  "elo",
  "amex",
  "hipercard",
  "other",
] as const;
export type CardBrand = (typeof cardBrands)[number];

export const cardBrandLabels: Record<CardBrand, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  elo: "Elo",
  amex: "American Express",
  hipercard: "Hipercard",
  other: "Outra",
};

// Dia do mês, opcional: vazio vira nulo.
const optionalDay = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : Number(value)))
  .refine(
    (value) =>
      value === null || (Number.isInteger(value) && value >= 1 && value <= 31),
    { error: "Informe um dia de 1 a 31." },
  );

const optionalLimit = z
  .string()
  .transform((value) =>
    value.trim() === "" ? null : (parseAmountToCents(value) ?? Number.NaN),
  )
  .refine((value) => value === null || value > 0, {
    error: "Informe um valor em reais maior que zero, como 5.000,00.",
  });

// Nunca há campo de número, validade, CVV ou senha (regra 16).
export const cardSchema = z.object({
  name: catalogNameSchema,
  institution: optionalInstitution,
  brand: z.enum(cardBrands),
  credit_limit_cents: optionalLimit,
  closing_day: optionalDay,
  due_day: optionalDay,
});

export type CardInput = z.infer<typeof cardSchema>;

export type Card = {
  id: string;
  name: string;
  institution: string | null;
  brand: CardBrand;
  credit_limit_cents: number | null;
  closing_day: number | null;
  due_day: number | null;
  is_active: boolean;
};
