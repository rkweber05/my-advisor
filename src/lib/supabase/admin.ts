import "server-only";

import { createClient } from "@supabase/supabase-js";

import { env } from "@/config/env";
import type { Database } from "@/lib/supabase/database.types";

// Cliente com a chave secreta: ignora o RLS. Usos permitidos (ADR 0002): excluir o usuário e
// gravar em `account_deletions`. Qualquer outro uso exige ADR.
export function createAdminClient() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
