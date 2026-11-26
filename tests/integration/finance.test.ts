import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  anonClient,
  createTestUser,
  deleteAllTestData,
  type TestUser,
} from "../helpers/supabase";

let ana: TestUser;
let bia: TestUser;
let anaAccount: string;
let biaAccount: string;
let biaCard: string;
let anaExpenseCategory: string;
let biaExpenseCategory: string;

async function idOf(
  user: TestUser,
  table: string,
  values: Record<string, unknown>,
): Promise<string> {
  const { data, error } = await user.client
    .from(table)
    .insert(values)
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

async function categoryOf(user: TestUser, name: string, type: string) {
  const { data, error } = await user.client
    .from("categories")
    .select("id")
    .eq("name", name)
    .eq("type", type)
    .single();
  if (error) throw error;
  return data.id as string;
}

function expense(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    type: "expense",
    amount_cents: 1550,
    transaction_date: "2026-11-10",
    category_id: anaExpenseCategory,
    payment_method: "pix",
    account_id: anaAccount,
    idempotency_key: randomUUID(),
    ...overrides,
  };
}

beforeAll(async () => {
  ana = await createTestUser("Ana");
  bia = await createTestUser("Bia");
  anaAccount = await idOf(ana, "accounts", {
    name: "Corrente",
    account_type: "checking",
    initial_balance_cents: 100000,
  });
  biaAccount = await idOf(bia, "accounts", {
    name: "Conta da Bia",
    account_type: "checking",
  });
  biaCard = await idOf(bia, "cards", { name: "Cartão da Bia", brand: "visa" });
  anaExpenseCategory = await categoryOf(ana, "Alimentação", "expense");
  biaExpenseCategory = await categoryOf(bia, "Alimentação", "expense");
});

afterAll(deleteAllTestData);

describe("isolamento entre contas (critério 9)", () => {
  it.each(["categories", "accounts", "cards", "transactions"])(
    "usuária não lê %s de outra conta",
    async (table) => {
      const { data, error } = await ana.client
        .from(table)
        .select("id")
        .eq("user_id", bia.id);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    },
  );

  it("usuária não altera nem apaga a conta de outra pessoa", async () => {
    const update = await ana.client
      .from("accounts")
      .update({ name: "Invadida" })
      .eq("id", biaAccount)
      .select("id");
    const remove = await ana.client
      .from("accounts")
      .delete()
      .eq("id", biaAccount)
      .select("id");
    const { data } = await bia.client
      .from("accounts")
      .select("name")
      .eq("id", biaAccount)
      .single();

    expect(update.data).toEqual([]);
    expect(remove.data).toEqual([]);
    expect(data).toEqual({ name: "Conta da Bia" });
  });

  it.each([
    ["a conta", () => expense({ account_id: biaAccount })],
    ["a categoria", () => expense({ category_id: biaExpenseCategory })],
    [
      "o cartão",
      () =>
        expense({
          payment_method: "credit_card",
          account_id: null,
          card_id: biaCard,
        }),
    ],
    [
      "a conta de destino",
      (): Record<string, unknown> => ({
        type: "transfer",
        amount_cents: 100,
        transaction_date: "2026-11-10",
        account_id: anaAccount,
        destination_account_id: biaAccount,
        idempotency_key: randomUUID(),
      }),
    ],
  ])(
    "movimentação não referencia %s de outra pessoa",
    async (_label, build) => {
      const { error } = await ana.client.from("transactions").insert(build());

      expect(error?.code).toBe("23503");
    },
  );

  it("usuária não grava movimentação em nome de outra conta", async () => {
    const { error } = await ana.client
      .from("transactions")
      .insert(expense({ user_id: bia.id }));

    expect(error?.code).toBe("42501");
  });

  it("usuária não vê o saldo das contas de outra pessoa", async () => {
    const { data } = await ana.client
      .from("account_balances")
      .select("account_id");

    expect(data).toEqual([{ account_id: anaAccount }]);
  });
});

describe("visitante anônimo (critério 10)", () => {
  it.each([
    "categories",
    "accounts",
    "cards",
    "transactions",
    "account_balances",
  ])("não lê %s", async (table) => {
    const { error } = await anonClient().from(table).select("*");

    expect(error?.code).toBe("42501");
  });
});

describe("regras da movimentação", () => {
  it("grava uma despesa só com valor, data, categoria, forma e conta (critério 4)", async () => {
    const { data, error } = await ana.client
      .from("transactions")
      .insert(expense())
      .select("status, description")
      .single();

    expect(error).toBeNull();
    expect(data).toEqual({ status: "completed", description: null });
  });

  it.each([
    ["valor zero", { amount_cents: 0 }],
    ["valor negativo", { amount_cents: -100 }],
    ["valor acima do limite", { amount_cents: 100_000_000_000 }],
    ["crédito sem cartão", { payment_method: "credit_card" }],
    ["Pix sem conta", { account_id: null }],
  ])("recusa %s (critérios 4 e 5)", async (_label, change) => {
    const { error } = await ana.client
      .from("transactions")
      .insert(expense(change));

    expect(error?.code).toBe("23514");
  });

  it("recusa categoria de despesa em uma receita (critério 6)", async () => {
    const { error } = await ana.client
      .from("transactions")
      .insert(expense({ type: "income" }));

    expect(error?.code).toBe("23503");
  });

  it("o mesmo envio não grava duas vezes (critério 12)", async () => {
    const row = expense({ amount_cents: 777 });

    const first = await ana.client.from("transactions").insert(row);
    const second = await ana.client.from("transactions").insert(row);
    const { data } = await ana.client
      .from("transactions")
      .select("id")
      .eq("idempotency_key", row.idempotency_key);

    expect(first.error).toBeNull();
    expect(second.error?.code).toBe("23505");
    expect(data).toHaveLength(1);
  });
});

describe("saldo da conta (critério 8)", () => {
  it("soma só o que está concluído, e transferência e fatura não viram despesa", async () => {
    const eva = await createTestUser("Eva");
    const main = await idOf(eva, "accounts", {
      name: "Principal",
      account_type: "checking",
      initial_balance_cents: 100000,
    });
    const wallet = await idOf(eva, "accounts", {
      name: "Carteira",
      account_type: "cash",
    });
    const card = await idOf(eva, "cards", { name: "Cartão", brand: "elo" });
    const food = await categoryOf(eva, "Alimentação", "expense");
    const salary = await categoryOf(eva, "Salário", "income");
    const base = { transaction_date: "2026-11-10" };
    const rows = [
      {
        type: "income",
        amount_cents: 500000,
        category_id: salary,
        payment_method: "pix",
        account_id: main,
      },
      {
        type: "expense",
        amount_cents: 15050,
        category_id: food,
        payment_method: "debit_card",
        account_id: main,
      },
      {
        type: "expense",
        amount_cents: 20000,
        category_id: food,
        payment_method: "credit_card",
        card_id: card,
      },
      {
        type: "transfer",
        amount_cents: 30000,
        account_id: main,
        destination_account_id: wallet,
      },
      {
        type: "card_payment",
        amount_cents: 20000,
        account_id: main,
        card_id: card,
      },
      {
        type: "expense",
        amount_cents: 99900,
        category_id: food,
        payment_method: "boleto",
        account_id: main,
        status: "pending",
      },
    ].map((row) => ({
      // Em inserção em lote, coluna ausente em uma linha vai como nula: tudo explícito.
      status: "completed",
      category_id: null,
      payment_method: null,
      account_id: null,
      card_id: null,
      destination_account_id: null,
      ...base,
      ...row,
      idempotency_key: randomUUID(),
    }));
    const insert = await eva.client.from("transactions").insert(rows);

    const { data } = await eva.client
      .from("account_balances")
      .select("account_id, balance_cents");

    expect(insert.error).toBeNull();
    // 1.000,00 + 5.000,00 − 150,50 − 300,00 − 200,00 = 5.349,50
    expect(data).toEqual(
      expect.arrayContaining([
        { account_id: main, balance_cents: 534950 },
        { account_id: wallet, balance_cents: 30000 },
      ]),
    );
  });
});
