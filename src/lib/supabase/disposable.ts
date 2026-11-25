import "server-only";

import { createClient } from "@supabase/supabase-js";

import { env } from "@/config/env";

// Cliente sem cookies, usado só para conferir a senha atual sem tocar na sessão do navegador.
export function createDisposableClient() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
