import { expect, test } from "@playwright/test";

import { allowEmail, createTestUser, uniqueEmail } from "../helpers/supabase";
import {
  accountDeletionCount,
  auditEventsOf,
  countEmailsTo,
  emailLinkFor,
  login,
  profileOf,
  userExists,
} from "./helpers";

const password = "senha-ficticia-de-teste";
const invalidCredentials = "E-mail ou senha incorretos.";

async function fillRegistration(
  page: import("@playwright/test").Page,
  email: string,
) {
  await page.goto("/register");
  await page.getByLabel("Nome").fill("Pessoa de Teste");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(
    page.getByRole("heading", { name: "Confira seu e-mail" }),
  ).toBeVisible();
}

// Critérios 2, 9 e 14
test("e-mail autorizado cria conta, confirma, entra e sai", async ({
  page,
  context,
}) => {
  const email = uniqueEmail();
  await allowEmail(email);

  await fillRegistration(page, email);
  await page.goto(await emailLinkFor(email));
  await page.getByRole("button", { name: "Confirmar e-mail" }).click();
  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByRole("heading", { name: "Início" })).toBeVisible();

  const cookies = await context.cookies();
  const sessionCookies = cookies.filter(({ name }) => name.startsWith("sb-"));
  expect(sessionCookies.length).toBeGreaterThan(0);
  expect(sessionCookies.every((cookie) => cookie.httpOnly)).toBe(true);
  expect(await page.evaluate(() => document.cookie.includes("sb-"))).toBe(
    false,
  );

  await page.goto("/settings");
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL("/login");

  // O cookie antigo, recolocado no navegador, não abre mais nada.
  await context.addCookies(cookies);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText("Sua sessão terminou.")).toBeVisible();

  await context.clearCookies();
  await login(page, email, password);
  await expect(page).toHaveURL("/dashboard");
});

// Critério 3, pela tela
test("e-mail fora da lista vê a mesma tela e não ganha conta", async ({
  page,
}) => {
  const email = uniqueEmail();

  await fillRegistration(page, email);
  await page.waitForTimeout(1500);
  expect(await countEmailsTo(email)).toBe(0);

  await login(page, email, password);
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    invalidCredentials,
  );
});

// Critério 4
test("senha errada e e-mail inexistente dão a mesma resposta", async ({
  page,
}) => {
  const user = await createTestUser("Ana");

  await login(page, user.email, "senha-errada-qualquer");
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    invalidCredentials,
  );
  await expect(page.getByLabel("E-mail")).toHaveValue(user.email);
  await expect(page.getByLabel("Senha", { exact: true })).toHaveValue("");

  await login(page, uniqueEmail(), "senha-errada-qualquer");
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    invalidCredentials,
  );
});

test("campos inválidos mostram o erro junto do campo", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Nome").fill("Ana");
  await page.getByLabel("E-mail").fill("ana@");
  await page.getByLabel("Senha", { exact: true }).fill("curta");
  await page.getByRole("button", { name: "Criar conta" }).click();

  await expect(page.getByText("Informe um e-mail válido.")).toBeVisible();
  await expect(
    page.getByText("A senha precisa ter pelo menos 12 caracteres."),
  ).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeFocused();
  await expect(page.getByLabel("Nome")).toHaveValue("Ana");
});

// Critério 16
test("login só com teclado", async ({ page }) => {
  const user = await createTestUser("Ana");

  await page.goto("/login");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("E-mail")).toBeFocused();
  await page.keyboard.type(user.email);
  await page.keyboard.press("Tab");
  await page.keyboard.type(user.password);
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL("/dashboard");
});

test("depois do login, volta para a página pedida", async ({ page }) => {
  const user = await createTestUser("Ana");

  await page.goto("/settings");
  await expect(page).toHaveURL(/\/login\?next=%2Fsettings/);
  await page.getByLabel("E-mail").fill(user.email);
  await page.getByLabel("Senha", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL("/settings");
});

// Critérios 11 e 14
test("recuperação de senha de ponta a ponta", async ({ page }) => {
  const user = await createTestUser("Ana");
  const newPassword = "nova-senha-ficticia-1";

  await page.goto("/forgot-password");
  await page.getByLabel("E-mail").fill(user.email);
  await page.getByRole("button", { name: "Enviar instruções" }).click();
  await expect(page.getByRole("main").getByRole("status")).toHaveText(
    "Se este e-mail tiver conta, enviamos as instruções.",
  );

  await page.goto(await emailLinkFor(user.email));
  await page.getByRole("button", { name: "Definir nova senha" }).click();
  await expect(page).toHaveURL("/update-password");
  await page.getByLabel("Nova senha").fill(newPassword);
  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  await expect(page).toHaveURL("/dashboard");

  await page.goto("/settings");
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL("/login");

  await login(page, user.email, user.password);
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    invalidCredentials,
  );
  await login(page, user.email, newPassword);
  await expect(page).toHaveURL("/dashboard");

  expect(await auditEventsOf(user.id)).toEqual([
    "login",
    "password_changed",
    "logout",
    "login",
  ]);
});

test("e-mail sem conta recebe a mesma resposta na recuperação", async ({
  page,
}) => {
  const email = uniqueEmail();

  await page.goto("/forgot-password");
  await page.getByLabel("E-mail").fill(email);
  await page.getByRole("button", { name: "Enviar instruções" }).click();

  await expect(page.getByRole("main").getByRole("status")).toHaveText(
    "Se este e-mail tiver conta, enviamos as instruções.",
  );
  expect(await countEmailsTo(email)).toBe(0);
});

test("link de e-mail inválido ou já usado é recusado", async ({ page }) => {
  await page.goto("/auth/confirm?token_hash=token-inventado&type=email");
  await page.getByRole("button", { name: "Confirmar e-mail" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Este link expirou ou já foi usado.",
  );

  await page.goto("/auth/confirm?type=magiclink&token_hash=x");
  await expect(
    page.getByRole("heading", { name: "Link inválido" }),
  ).toBeVisible();
});

test("sem link de recuperação não se define senha sem a atual", async ({
  page,
}) => {
  const user = await createTestUser("Ana");
  await login(page, user.email, user.password);
  await expect(page).toHaveURL("/dashboard");

  await page.goto("/update-password");
  await page.getByLabel("Nova senha").fill("tentativa-sem-senha-atual");
  await page.getByRole("button", { name: "Salvar nova senha" }).click();

  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "peça um novo link de recuperação",
  );
});

// Critérios 12 e 14
test("usuária altera nome e fuso; um id forjado é ignorado", async ({
  page,
}) => {
  const ana = await createTestUser("Ana");
  const bia = await createTestUser("Bia");
  await login(page, ana.email, ana.password);
  await expect(page).toHaveURL("/dashboard");

  await page.goto("/settings");
  await page.getByLabel("Nome").fill("Ana Souza");
  await page.getByLabel("Fuso horário").selectOption("America/Manaus");
  await page.evaluate((otherId) => {
    const form = document.querySelector<HTMLFormElement>(
      'form:has([name="timezone"])',
    );
    for (const name of ["id", "user_id", "userId"]) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = otherId;
      form?.append(input);
    }
  }, bia.id);
  await page.getByRole("button", { name: "Salvar perfil" }).click();
  await expect(page.getByText("Perfil salvo.")).toBeVisible();

  expect(await profileOf(ana.id)).toEqual({
    name: "Ana Souza",
    timezone: "America/Manaus",
  });
  expect(await profileOf(bia.id)).toEqual({
    name: "Bia",
    timezone: "America/Sao_Paulo",
  });
  expect(await auditEventsOf(ana.id)).toEqual(["login", "profile_updated"]);

  await page.reload();
  await expect(page.getByLabel("Nome")).toHaveValue("Ana Souza");
});

// Critério 10
test("sem sessão, a ação de salvar o perfil não é executada", async ({
  page,
  context,
}) => {
  const user = await createTestUser("Ana");
  await login(page, user.email, user.password);
  await expect(page).toHaveURL("/dashboard");
  await page.goto("/settings");

  await page.getByLabel("Nome").fill("Nome que não pode ser gravado");
  await context.clearCookies();
  await page.getByRole("button", { name: "Salvar perfil" }).click();

  await expect(page).toHaveURL(/\/login/);
  expect((await profileOf(user.id)).name).toBe("Ana");
});

// Critério 14
test("troca de senha exige a senha atual", async ({ page }) => {
  const user = await createTestUser("Ana");
  const newPassword = "outra-senha-ficticia-2";
  await login(page, user.email, user.password);
  await expect(page).toHaveURL("/dashboard");
  await page.goto("/settings");

  await page.getByLabel("Senha atual").fill("senha-atual-errada");
  await page.getByLabel("Nova senha").fill(newPassword);
  await page.getByRole("button", { name: "Alterar senha" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Senha atual incorreta.",
  );

  await page.getByLabel("Senha atual").fill(user.password);
  await page.getByLabel("Nova senha").fill(newPassword);
  await page.getByRole("button", { name: "Alterar senha" }).click();
  await expect(page.getByText("Senha alterada.")).toBeVisible();

  expect(await auditEventsOf(user.id)).toEqual(["login", "password_changed"]);
});

// Critérios 13 e 14
test("exclusão de conta apaga tudo e deixa só o registro anônimo", async ({
  page,
}) => {
  const user = await createTestUser("Ana");
  const deletionsBefore = await accountDeletionCount();
  await login(page, user.email, user.password);
  await expect(page).toHaveURL("/dashboard");

  await page.goto("/settings");
  await page.getByRole("link", { name: "Continuar para a exclusão" }).click();
  await expect(page).toHaveURL("/settings/delete-account");
  const submit = page.getByRole("button", { name: "Excluir minha conta" });
  await expect(submit).toBeDisabled();

  await page.getByLabel("Senha atual").fill(user.password);
  await page.getByLabel("Digite EXCLUIR para confirmar").fill("EXCLUIR");
  await submit.click();

  await expect(page).toHaveURL(/\/login\?notice=account_deleted/);
  await expect(page.getByText("Sua conta foi excluída.")).toBeVisible();
  expect(await userExists(user.id)).toBe(false);
  expect(await auditEventsOf(user.id)).toEqual([]);
  expect(await accountDeletionCount()).toBeGreaterThan(deletionsBefore);

  await login(page, user.email, user.password);
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    invalidCredentials,
  );
});

test("exclusão de conta recusa a senha errada", async ({ page }) => {
  const user = await createTestUser("Ana");
  await login(page, user.email, user.password);
  await expect(page).toHaveURL("/dashboard");

  await page.goto("/settings/delete-account");
  await page.getByLabel("Senha atual").fill("senha-atual-errada");
  await page.getByLabel("Digite EXCLUIR para confirmar").fill("EXCLUIR");
  await page.getByRole("button", { name: "Excluir minha conta" }).click();

  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Senha atual incorreta.",
  );
  expect(await userExists(user.id)).toBe(true);
});
