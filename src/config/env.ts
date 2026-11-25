import { z } from "zod";

// Variáveis de ambiente validadas na inicialização do servidor (src/instrumentation.ts).
// Este módulo só é importado por código de servidor. A chave secreta nunca recebe o prefixo
// NEXT_PUBLIC_ e só é usada em src/lib/supabase/admin.ts.
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({
    error: "obrigatória e deve ser uma URL válida",
  }),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string({ error: "obrigatória" })
    .min(1, { error: "obrigatória" }),
  SUPABASE_SECRET_KEY: z
    .string({ error: "obrigatória" })
    .min(1, { error: "obrigatória" }),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Variáveis de ambiente inválidas ou ausentes:\n${problems}\nConsulte o arquivo .env.example.`,
    );
  }

  return result.data;
}

export const env = parseEnv({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
});
