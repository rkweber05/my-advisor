import { describe, expect, it } from "vitest";

import {
  escapeLikePattern,
  parseFilters,
  transactionsHref,
} from "@/modules/transactions/filters";
import { parseTransaction } from "@/modules/transactions/rules";

const account = "00000000-0000-4000-8000-0000000000a1";
const other = "00000000-0000-4000-8000-0000000000a2";
const card = "00000000-0000-4000-8000-0000000000a3";
const category = "00000000-0000-4000-8000-0000000000a4";

const expense = {
  type: "expense",
  amount_cents: "1550",
  transaction_date: "2026-11-25",
  category_id: category,
  payment_method: "pix",
  account_id: account,
  card_id: card,
  destination_account_id: other,
  description: "  Almoço  ",
  notes: "",
  status: "completed",
};

function rowOf(raw: Record<string, string>) {
  const parsed = parseTransaction(raw);
  if (!parsed.ok) throw new Error(JSON.stringify(parsed.fieldErrors));
  return parsed.row;
}

function errorsOf(raw: Record<string, string>) {
  const parsed = parseTransaction(raw);
  return parsed.ok ? {} : parsed.fieldErrors;
}

describe("parseTransaction", () => {
  it("despesa fora do crédito fica com a conta e sem cartão", () => {
    expect(rowOf(expense)).toEqual({
      type: "expense",
      amount_cents: 1550,
      transaction_date: "2026-11-25",
      description: "Almoço",
      notes: null,
      status: "completed",
      category_id: category,
      payment_method: "pix",
      account_id: account,
      card_id: null,
      destination_account_id: null,
    });
  });

  it("despesa no crédito fica com o cartão e sem conta", () => {
    const row = rowOf({ ...expense, payment_method: "credit_card" });

    expect(row.card_id).toBe(card);
    expect(row.account_id).toBeNull();
  });

  it("despesa no crédito sem cartão é recusada", () => {
    expect(
      errorsOf({ ...expense, payment_method: "credit_card", card_id: "" }),
    ).toEqual({ card_id: "Escolha o cartão." });
  });

  it("despesa no Pix sem conta é recusada", () => {
    expect(errorsOf({ ...expense, account_id: "" })).toEqual({
      account_id: "Escolha a conta.",
    });
  });

  it("receita não aceita crédito", () => {
    expect(
      errorsOf({ ...expense, type: "income", payment_method: "credit_card" }),
    ).toEqual({ payment_method: "Escolha a forma de pagamento." });
  });

  it("transferência não leva categoria nem forma de pagamento", () => {
    const row = rowOf({ ...expense, type: "transfer" });

    expect(row).toMatchObject({
      category_id: null,
      payment_method: null,
      card_id: null,
      account_id: account,
      destination_account_id: other,
    });
  });

  it("transferência para a mesma conta é recusada", () => {
    expect(
      errorsOf({
        ...expense,
        type: "transfer",
        destination_account_id: account,
      }),
    ).toEqual({
      destination_account_id: "Origem e destino precisam ser diferentes.",
    });
  });

  it("pagamento de fatura leva conta e cartão, sem categoria", () => {
    const row = rowOf({ ...expense, type: "card_payment" });

    expect(row).toMatchObject({
      category_id: null,
      payment_method: null,
      account_id: account,
      card_id: card,
      destination_account_id: null,
    });
  });

  it.each([
    ["zero", "0"],
    ["negativo", "-100"],
    ["fracionado", "10.5"],
    ["texto", "abc"],
    ["acima do limite", "100000000000"],
  ])("recusa valor %s", (_label, amount_cents) => {
    expect(errorsOf({ ...expense, amount_cents })).toHaveProperty(
      "amount_cents",
    );
  });

  it.each(["2026-02-30", "25/11/2026", ""])("recusa a data %s", (date) => {
    expect(errorsOf({ ...expense, transaction_date: date })).toEqual({
      transaction_date: "Informe uma data válida.",
    });
  });

  it("recusa tipo desconhecido e categoria que não é um id", () => {
    expect(errorsOf({ ...expense, type: "investimento" })).toHaveProperty(
      "type",
    );
    expect(errorsOf({ ...expense, category_id: "1 or 1=1" })).toEqual({
      category_id: "Escolha a categoria.",
    });
  });
});

describe("filtros do histórico", () => {
  it("descarta valores desconhecidos e usa o mês corrente", () => {
    const filters = parseFilters(
      {
        month: "2026-13",
        type: "roubo",
        method: "cheque",
        category: "x",
        limit: "abc",
      },
      "2026-11",
    );

    expect(filters).toEqual({
      month: "2026-11",
      q: "",
      type: undefined,
      category: undefined,
      method: undefined,
      limit: 50,
    });
  });

  it("aceita os filtros válidos e limita o tamanho da página", () => {
    const filters = parseFilters(
      {
        month: "2026-10",
        q: "  mercado ",
        type: "expense",
        method: "pix",
        category,
        limit: "99999",
      },
      "2026-11",
    );

    expect(filters).toEqual({
      month: "2026-10",
      q: "mercado",
      type: "expense",
      category,
      method: "pix",
      limit: 500,
    });
  });

  it("monta o endereço só com o que está preenchido", () => {
    const filters = parseFilters({ q: "50% off" }, "2026-11");

    expect(transactionsHref(filters)).toBe(
      "/transactions?month=2026-11&q=50%25+off",
    );
    expect(transactionsHref(filters, { q: "", type: "income" })).toBe(
      "/transactions?month=2026-11&type=income",
    );
  });

  it("trata o texto da busca como literal", () => {
    expect(escapeLikePattern("50%_off\\")).toBe("50\\%\\_off\\\\");
  });
});
