import { expect, test, type Page } from "@playwright/test";

import { todayIn } from "../../src/lib/dates/today";
import { createTestUser, type TestUser } from "../helpers/supabase";
import {
  auditEntitiesOf,
  categoryIdOf,
  login,
  seedAccount,
  seedCard,
  seedTransaction,
  transactionsOf,
} from "./helpers";

const today = todayIn("America/Sao_Paulo");
const thisMonth = today.slice(0, 7);

async function signedIn(page: Page): Promise<TestUser> {
  const user = await createTestUser("Ana");
  await login(page, user.email, user.password);
  await expect(page).toHaveURL("/dashboard");
  return user;
}

function choose(page: Page, group: string, option: string) {
  return page
    .getByRole("group", { name: group })
    .getByText(option, { exact: true })
    .click();
}

function panel(page: Page, heading: string) {
  return page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: heading }) });
}

function row(page: Page, name: string) {
  return page.locator("li").filter({ hasText: name });
}

// Linha de cadastro pelo nome exato: "Corrente" não pode casar com "Conta corrente".
function item(page: Page, name: string) {
  return page
    .locator("li")
    .filter({ has: page.getByText(name, { exact: true }) });
}

// Critério 2
test("pessoa cria, edita, desativa e exclui conta, cartão e categoria", async ({
  page,
}) => {
  await signedIn(page);

  await page.goto("/settings/accounts");
  await expect(page.getByText("Nenhuma conta cadastrada.")).toBeVisible();
  const newAccount = panel(page, "Nova conta");
  await newAccount.getByLabel("Nome").fill("Corrente");
  await newAccount.getByLabel("Saldo inicial").fill("1.000,00");
  await newAccount.getByRole("button", { name: "Criar conta" }).click();
  await expect(item(page, "Corrente")).toContainText("R$ 1.000,00");

  await newAccount.getByLabel("Nome").fill("corrente");
  await newAccount.getByRole("button", { name: "Criar conta" }).click();
  await expect(newAccount.getByRole("alert")).toHaveText(
    "Já existe um item com esse nome.",
  );

  await item(page, "Corrente").getByText("Editar").click();
  await item(page, "Corrente").getByLabel("Nome").fill("Conta principal");
  await item(page, "Corrente").getByRole("button", { name: "Salvar" }).click();
  await expect(row(page, "Conta principal")).toBeVisible();

  await page.goto("/settings/cards");
  const newCard = panel(page, "Novo cartão");
  await newCard.getByLabel("Nome do cartão").fill("Roxinho");
  await newCard.getByLabel("Dia de fechamento").fill("40");
  await newCard.getByRole("button", { name: "Criar cartão" }).click();
  await expect(newCard.getByText("Informe um dia de 1 a 31.")).toBeVisible();
  await newCard.getByLabel("Dia de fechamento").fill("3");
  await newCard.getByLabel("Dia de vencimento").fill("10");
  await newCard.getByRole("button", { name: "Criar cartão" }).click();
  await expect(row(page, "Roxinho")).toContainText("fecha dia 3");

  await page.goto("/settings/categories");
  await expect(row(page, "Alimentação")).toBeVisible();
  const expenses = panel(page, "Despesa");
  await expenses.getByLabel("Nome da nova categoria").fill("Pets");
  await expenses.getByRole("button", { name: "Criar categoria" }).click();
  await expect(row(page, "Pets")).toBeVisible();

  await row(page, "Pets").getByText("Editar").click();
  await row(page, "Pets").getByRole("button", { name: "Desativar" }).click();
  await expect(row(page, "Pets")).toContainText("Desativado");
  await row(page, "Pets").getByRole("button", { name: "Excluir" }).click();
  await expect(row(page, "Pets")).toHaveCount(0);
});

// Critérios 4, 14 e 18
test("uma despesa é lançada informando só valor e categoria", async ({
  page,
}) => {
  const user = await signedIn(page);
  await seedAccount(user.id, "Corrente", 100000);

  await page.getByRole("link", { name: "Lançar" }).click();
  await expect(page).toHaveURL("/transactions/new");
  await expect(page.getByLabel("Valor")).toBeFocused();
  await page.getByLabel("Valor").fill("1550");
  await expect(page.getByLabel("Valor")).toHaveValue(/15,50/);
  await choose(page, "Categoria", "Alimentação");
  await page.getByRole("button", { name: "Salvar" }).click();

  await expect(page).toHaveURL(
    new RegExp(`/transactions\\?month=${thisMonth}`),
  );
  await expect(page.getByText("Lançamento gravado: despesa de")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hoje" })).toBeVisible();
  await expect(row(page, "Alimentação")).toContainText("R$ 15,50");
  await expect(row(page, "Alimentação")).toContainText("Pix · Corrente");

  const saved = await transactionsOf(user.id);
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({
    type: "expense",
    amount_cents: 1550,
    payment_method: "pix",
    status: "completed",
  });
  expect(await auditEntitiesOf(user.id)).toEqual([
    {
      event_type: "transaction_created",
      entity_type: "transaction",
      entity_id: saved[0]?.id,
    },
  ]);

  await page.goto("/settings/accounts");
  await expect(item(page, "Corrente")).toContainText("R$ 984,50");
});

test("valor e categoria ausentes são apontados nos campos", async ({
  page,
}) => {
  const user = await signedIn(page);
  await seedAccount(user.id, "Corrente");

  await page.goto("/transactions/new");
  await page.getByRole("button", { name: "Salvar" }).click();

  await expect(
    page.getByText("Informe um valor maior que zero."),
  ).toBeVisible();
  await expect(page.getByText("Escolha a categoria.")).toBeVisible();
  expect(await transactionsOf(user.id)).toHaveLength(0);
});

test("sem conta cadastrada, o formulário leva ao cadastro", async ({
  page,
}) => {
  await signedIn(page);

  await page.goto("/transactions/new");

  await expect(page.getByText("Cadastre uma conta para lançar.")).toBeVisible();
  await page.getByRole("link", { name: "Cadastrar conta" }).click();
  await expect(page).toHaveURL("/settings/accounts");
});

// Critério 5
test("despesa no crédito pede o cartão, não a conta", async ({ page }) => {
  const user = await signedIn(page);
  await seedAccount(user.id, "Corrente");
  const card = await seedCard(user.id, "Roxinho");

  await page.goto("/transactions/new");
  await page.getByLabel("Valor").fill("20000");
  await choose(page, "Categoria", "Compras");
  await choose(page, "Forma de pagamento", "Crédito");
  await expect(page.getByRole("group", { name: "Conta" })).toHaveCount(0);
  await choose(page, "Cartão", "Roxinho");
  await page.getByRole("button", { name: "Salvar" }).click();

  await expect(row(page, "Compras")).toContainText("Crédito · Roxinho");
  expect((await transactionsOf(user.id))[0]).toMatchObject({
    payment_method: "credit_card",
    card_id: card,
    account_id: null,
  });
});

// Critérios 7 e 8
test("transferência e fatura mexem no saldo e não viram despesa", async ({
  page,
}) => {
  const user = await signedIn(page);
  await seedAccount(user.id, "Corrente", 100000);
  await seedAccount(user.id, "Carteira");
  await seedCard(user.id, "Roxinho");

  await page.goto("/transactions/new");
  await choose(page, "Tipo", "Transferência");
  await expect(
    page.getByText("Não conta como despesa nem como receita."),
  ).toBeVisible();
  await expect(page.getByRole("group", { name: "Categoria" })).toHaveCount(0);
  await page.getByLabel("Valor").fill("30000");
  await choose(page, "Conta de origem", "Corrente");
  await choose(page, "Conta de destino", "Carteira");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(row(page, "Transferência entre contas")).toContainText(
    "Corrente para Carteira",
  );

  await page.goto("/transactions/new");
  await choose(page, "Tipo", "Fatura");
  await expect(page.getByText("não é uma nova despesa")).toBeVisible();
  await page.getByLabel("Valor").fill("20000");
  await choose(page, "Cartão", "Roxinho");
  await choose(page, "Conta que paga", "Corrente");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(row(page, "Pagamento de fatura")).toContainText(
    "Roxinho, pago por Corrente",
  );

  expect((await transactionsOf(user.id)).map((item) => item.type)).toEqual([
    "transfer",
    "card_payment",
  ]);
  await page.goto("/settings/accounts");
  await expect(item(page, "Corrente")).toContainText("R$ 500,00");
  await expect(item(page, "Carteira")).toContainText("R$ 300,00");

  await page.goto(`/transactions?month=${thisMonth}&type=expense`);
  await expect(
    page.getByText("Nenhum lançamento com esses filtros."),
  ).toBeVisible();
});

// Critério 13
test("lançamento igual a um já existente pede confirmação", async ({
  page,
}) => {
  const user = await signedIn(page);
  const account = await seedAccount(user.id, "Corrente");
  await seedTransaction(user.id, {
    type: "expense",
    amount_cents: 1000,
    transaction_date: today,
    category_id: await categoryIdOf(user.id, "Lazer", "expense"),
    payment_method: "pix",
    account_id: account,
  });

  await page.goto("/transactions/new");
  await page.getByLabel("Valor").fill("1000");
  await choose(page, "Categoria", "Lazer");
  await page.getByRole("button", { name: "Salvar" }).click();

  await expect(page.getByText("Lançar mesmo assim?")).toBeVisible();
  expect(await transactionsOf(user.id)).toHaveLength(1);
  // O que já foi escolhido continua no formulário.
  await expect(page.getByLabel("Valor")).toHaveValue(/10,00/);
  await expect(page.getByRole("radio", { name: "Lazer" })).toBeChecked();

  await page.getByRole("button", { name: "Lançar mesmo assim" }).click();
  await expect(page).toHaveURL(/\/transactions\?month=/);
  expect(await transactionsOf(user.id)).toHaveLength(2);
});

// Critério 14
test("pessoa edita e exclui um lançamento, com auditoria", async ({ page }) => {
  const user = await signedIn(page);
  const account = await seedAccount(user.id, "Corrente");
  const id = await seedTransaction(user.id, {
    type: "expense",
    amount_cents: 4200,
    transaction_date: today,
    description: "Cinema",
    category_id: await categoryIdOf(user.id, "Lazer", "expense"),
    payment_method: "pix",
    account_id: account,
  });

  await page.goto("/transactions");
  await row(page, "Cinema").getByRole("link").click();
  await expect(page).toHaveURL(`/transactions/${id}`);
  await expect(page.getByRole("group", { name: "Tipo" })).toHaveCount(0);
  await expect(page.getByLabel("Valor")).toHaveValue(/42,00/);
  await page.getByLabel("Valor").fill("5000");
  await page.getByLabel("Descrição (opcional)").fill("Cinema e pipoca");
  await page.getByRole("button", { name: "Salvar alterações" }).click();

  await expect(row(page, "Cinema e pipoca")).toContainText("R$ 50,00");
  expect((await transactionsOf(user.id))[0]?.amount_cents).toBe(5000);

  await row(page, "Cinema e pipoca").getByRole("link").click();
  await page.getByText("Excluir este lançamento", { exact: true }).click();
  await page.getByRole("button", { name: "Excluir em definitivo" }).click();

  await expect(page.getByText("Lançamento excluído.")).toBeVisible();
  expect(await transactionsOf(user.id)).toHaveLength(0);
  expect(await auditEntitiesOf(user.id)).toEqual([
    {
      event_type: "transaction_updated",
      entity_type: "transaction",
      entity_id: id,
    },
    {
      event_type: "transaction_deleted",
      entity_type: "transaction",
      entity_id: id,
    },
  ]);
});

// Critério 15
test("histórico filtra por mês, tipo e categoria e busca por descrição", async ({
  page,
}) => {
  const user = await signedIn(page);
  const account = await seedAccount(user.id, "Corrente");
  const food = await categoryIdOf(user.id, "Alimentação", "expense");
  const salary = await categoryIdOf(user.id, "Salário", "income");
  const base = { payment_method: "pix", account_id: account };
  const lastMonth = `${new Date(`${thisMonth}-01T00:00:00Z`).getUTCMonth() === 0 ? Number(thisMonth.slice(0, 4)) - 1 : thisMonth.slice(0, 4)}-${String(((Number(thisMonth.slice(5)) + 10) % 12) + 1).padStart(2, "0")}`;
  await seedTransaction(user.id, {
    ...base,
    type: "expense",
    amount_cents: 8000,
    transaction_date: today,
    description: "Mercado do bairro",
    category_id: food,
  });
  await seedTransaction(user.id, {
    ...base,
    type: "expense",
    amount_cents: 3000,
    transaction_date: today,
    description: "Padaria 100%",
    category_id: food,
  });
  await seedTransaction(user.id, {
    ...base,
    type: "income",
    amount_cents: 500000,
    transaction_date: today,
    description: "Pagamento",
    category_id: salary,
  });
  await seedTransaction(user.id, {
    ...base,
    type: "expense",
    amount_cents: 1200,
    transaction_date: `${lastMonth}-15`,
    description: "Feira antiga",
    category_id: food,
  });

  await page.goto("/transactions");
  await expect(row(page, "Mercado do bairro")).toBeVisible();
  await expect(row(page, "Pagamento")).toContainText("+R$ 5.000,00");
  await expect(row(page, "Feira antiga")).toHaveCount(0);

  await page.getByLabel("Buscar na descrição").fill("merc");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(row(page, "Mercado do bairro")).toBeVisible();
  await expect(row(page, "Padaria 100%")).toHaveCount(0);

  // O curinga digitado é texto, não padrão.
  await page.getByLabel("Buscar na descrição").fill("%");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(row(page, "Padaria 100%")).toBeVisible();
  await expect(row(page, "Mercado do bairro")).toHaveCount(0);
  await page.getByRole("link", { name: /Busca: %/ }).click();
  await expect(row(page, "Mercado do bairro")).toBeVisible();

  await page.getByText("Filtros", { exact: true }).click();
  await page.getByLabel("Tipo").selectOption("income");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(row(page, "Pagamento")).toBeVisible();
  await expect(row(page, "Mercado do bairro")).toHaveCount(0);

  await page.goto(
    `/transactions?month=${thisMonth}&category=${food}&method=pix`,
  );
  await expect(row(page, "Mercado do bairro")).toBeVisible();
  await expect(row(page, "Pagamento")).toHaveCount(0);

  await page.goto("/transactions");
  await page.getByRole("link", { name: "Mês anterior" }).click();
  await expect(row(page, "Feira antiga")).toBeVisible();
  await expect(row(page, "Mercado do bairro")).toHaveCount(0);
});

// Critério 3
test("item em uso não é excluído; desativado, some das escolhas e fica no histórico", async ({
  page,
}) => {
  const user = await signedIn(page);
  const account = await seedAccount(user.id, "Conta antiga");
  await seedAccount(user.id, "Conta nova");
  await seedTransaction(user.id, {
    type: "expense",
    amount_cents: 900,
    transaction_date: today,
    description: "Café",
    category_id: await categoryIdOf(user.id, "Alimentação", "expense"),
    payment_method: "pix",
    account_id: account,
  });

  await page.goto("/settings/accounts");
  await row(page, "Conta antiga").getByText("Editar").click();
  await row(page, "Conta antiga")
    .getByRole("button", { name: "Excluir" })
    .click();
  await expect(row(page, "Conta antiga").getByRole("alert")).toHaveText(
    "Tem lançamentos. Dá para desativar, não para excluir.",
  );
  await row(page, "Conta antiga")
    .getByRole("button", { name: "Desativar" })
    .click();
  await expect(row(page, "Conta antiga")).toContainText("Desativado");

  await page.goto("/transactions/new");
  const accounts = page.getByRole("group", { name: "Conta" });
  await expect(accounts.getByText("Conta nova")).toBeVisible();
  await expect(accounts.getByText("Conta antiga")).toHaveCount(0);

  await page.goto("/transactions");
  await expect(row(page, "Café")).toContainText("Conta antiga");
});

// Critério 17
test("sem sessão, o lançamento não é gravado", async ({ page, context }) => {
  const user = await signedIn(page);
  await seedAccount(user.id, "Corrente");

  await page.goto("/transactions/new");
  await page.getByLabel("Valor").fill("9999");
  await choose(page, "Categoria", "Lazer");
  await context.clearCookies();
  await page.getByRole("button", { name: "Salvar" }).click();

  await expect(page).toHaveURL(/\/login/);
  expect(await transactionsOf(user.id)).toHaveLength(0);
});

// Critério 9, pela tela
test("lançamento de outra conta não abre para edição", async ({ page }) => {
  const other = await createTestUser("Bia");
  const account = await seedAccount(other.id, "Conta da Bia");
  const foreign = await seedTransaction(other.id, {
    type: "expense",
    amount_cents: 100,
    transaction_date: today,
    category_id: await categoryIdOf(other.id, "Lazer", "expense"),
    payment_method: "pix",
    account_id: account,
  });
  await signedIn(page);

  const response = await page.goto(`/transactions/${foreign}`);

  expect(response?.status()).toBe(404);
  await page.goto("/transactions");
  await expect(page.getByText("Conta da Bia")).toHaveCount(0);
});
