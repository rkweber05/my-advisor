import { NextResponse, type NextRequest } from "next/server";

import { isPublicPath, LOGIN_PATH } from "@/lib/auth/routes";
import { buildContentSecurityPolicy } from "@/lib/security/csp";
import { updateSession } from "@/lib/supabase/proxy";

const CSP_HEADER = "Content-Security-Policy";
const isDev = process.env.NODE_ENV === "development";

function hadSessionCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some(({ name }) => name.startsWith("sb-"));
}

// Leva junto os cookies que a renovação da sessão tenha alterado.
function redirectToLogin(request: NextRequest, sessionResponse: NextResponse) {
  const url = new URL(LOGIN_PATH, request.url);
  url.searchParams.set("next", request.nextUrl.pathname);
  if (hadSessionCookie(request)) {
    url.searchParams.set("notice", "session_ended");
  }

  const redirect = NextResponse.redirect(url);
  for (const cookie of sessionResponse.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }
  return redirect;
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildContentSecurityPolicy(nonce, isDev);

  // O Next.js lê o nonce do header da requisição para aplicá-lo aos scripts que ele gera.
  request.headers.set(CSP_HEADER, csp);

  const { response, hasSession } = await updateSession(request);

  // Conveniência de navegação, não autorização: quem autoriza é o requireUser() e o RLS.
  // Server Action não é redirecionada aqui: ela mesma chama requireUser() e responde com o
  // redirecionamento que o navegador sabe seguir.
  const isServerAction = request.headers.has("next-action");
  if (
    !hasSession &&
    !isServerAction &&
    !isPublicPath(request.nextUrl.pathname)
  ) {
    return redirectToLogin(request, response);
  }

  response.headers.set(CSP_HEADER, csp);
  return response;
}

export const config = {
  // Tudo, menos arquivos estáticos e imagens.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
