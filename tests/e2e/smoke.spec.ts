import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

test("a tela de login carrega em pt-BR", async ({ page }) => {
  await page.goto("/login");

  await expect(
    page.getByRole("heading", { level: 1, name: "Entrar" }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
});

test("a tela de login não viola a CSP", async ({ page }) => {
  const violations: string[] = [];
  page.on("console", (message) => {
    if (message.text().includes("Content Security Policy")) {
      violations.push(message.text());
    }
  });

  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Mostrar senha" }).click();

  expect(violations).toEqual([]);
});

test("a CSP usa um nonce novo a cada resposta e não libera script inline", async ({
  request,
}) => {
  const first = await request.get("/login");
  const second = await request.get("/login");
  const csp = first.headers()["content-security-policy"] ?? "";
  const scriptSrc = csp.split("; ").find((d) => d.startsWith("script-src"));
  const nonce = /'nonce-([^']+)'/.exec(csp)?.[1];

  expect(scriptSrc).toBeDefined();
  expect(scriptSrc).not.toContain("'unsafe-inline'");
  expect(scriptSrc).not.toContain("'unsafe-eval'");
  expect(nonce).toBeDefined();
  expect(await first.text()).toContain(`nonce="${nonce}"`);
  expect(second.headers()["content-security-policy"]).not.toBe(csp);
});

test("a resposta traz os headers de segurança", async ({ request }) => {
  const response = await request.get("/login");
  const headers = response.headers();

  expect(headers["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect(headers["content-security-policy"]).toContain("object-src 'none'");
  expect(headers["strict-transport-security"]).toContain("max-age=");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toBeDefined();
});

// Critério 1
for (const path of ["/dashboard", "/settings", "/settings/delete-account"]) {
  test(`visitante que abre ${path} vai para o login`, async ({ page }) => {
    await page.goto(path);

    await expect(page).toHaveURL(/\/login\?next=/);
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  });
}

function filesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

// Critério 15
test("a chave secreta não vai no pacote enviado ao navegador", () => {
  const secret = process.env.SUPABASE_SECRET_KEY ?? "";
  expect(secret).not.toBe("");

  const leaking = filesUnder(".next/static").filter((file) => {
    const content = readFileSync(file, "utf8");
    return content.includes(secret) || content.includes("SUPABASE_SECRET_KEY");
  });

  expect(leaking).toEqual([]);
});
