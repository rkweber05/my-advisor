import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { HOME_PATH, loginPathWithNotice } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

// Único ponto que decide se há usuário. Toda página privada, Server Action e Route Handler
// começa por aqui. Consulta o serviço de autenticação (`getUser`), e não só a assinatura do
// token, para que logout e exclusão de conta valham na hora.
export async function requireUser(): Promise<User> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect(loginPathWithNotice("session_ended"));
  }

  return data.user;
}

// Para as telas públicas de autenticação: quem já está logado vai direto para a área logada.
export async function redirectIfAuthenticated(): Promise<void> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect(HOME_PATH);
  }
}
