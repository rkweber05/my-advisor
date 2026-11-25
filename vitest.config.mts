import { existsSync } from "node:fs";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Os testes de integração leem as chaves do Supabase local. No CI elas já vêm do ambiente.
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "jsdom",
          include: ["tests/unit/**/*.test.{ts,tsx}"],
          // Valores fictícios, para módulos que leem o env ao serem importados.
          env: {
            NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "chave-publica-de-teste",
            SUPABASE_SECRET_KEY: "chave-secreta-de-teste",
          },
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          // Um arquivo por vez: todos usam o mesmo banco local.
          fileParallelism: false,
        },
      },
    ],
  },
});
