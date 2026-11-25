import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { env } from "@/config/env";
import { sessionCookieOptions } from "@/lib/supabase/cookie-options";
import type { Database } from "@/lib/supabase/database.types";

// Cliente padrão do servidor: usa os cookies da requisição e age como o usuário logado.
// Toda consulta feita por ele passa pelo RLS.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions: sessionCookieOptions,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Em Server Components os cookies são somente leitura.
            // A renovação da sessão é feita pelo proxy (src/proxy.ts).
          }
        },
      },
    },
  );
}

export type ServerClient = Awaited<ReturnType<typeof createClient>>;
