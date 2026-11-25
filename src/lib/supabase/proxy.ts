import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/config/env";
import { sessionCookieOptions } from "@/lib/supabase/cookie-options";

type SessionUpdate = { response: NextResponse; hasSession: boolean };

// Renova a sessão e devolve os cookies atualizados na resposta.
// Não autoriza nada: a autorização fica no servidor (requireUser) e no RLS.
export async function updateSession(
  request: NextRequest,
): Promise<SessionUpdate> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions: sessionCookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }

          response = NextResponse.next({ request });

          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  // Precisa rodar antes de qualquer resposta ser enviada: é o que dispara a renovação.
  const { data } = await supabase.auth.getClaims();

  return { response, hasSession: Boolean(data?.claims) };
}
