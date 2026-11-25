import { existsSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

// Chaves do Supabase local. No CI elas já vêm do ambiente.
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const port = 3100;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  // O uso principal é no celular: toda a suíte roda também em viewport de celular.
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  // Os testes rodam contra o build de produção: é nele que os headers de segurança valem.
  webServer: {
    command: `pnpm build && pnpm start --port ${port}`,
    url: `${baseURL}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
      SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY ?? "",
    },
  },
});
