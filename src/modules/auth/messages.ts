import type { LoginNotice } from "@/lib/auth/routes";

// Mapa único das mensagens de autenticação. Nenhuma revela se um e-mail tem conta.
export const authMessages = {
  invalid_credentials: "E-mail ou senha incorretos.",
  email_not_confirmed:
    "Confirme seu e-mail antes de entrar. O link está na mensagem que enviamos.",
  rate_limited: "Muitas tentativas. Tente de novo em alguns minutos.",
  unexpected: "Não foi possível concluir. Tente de novo.",
  link_invalid: "Este link expirou ou já foi usado.",
  wrong_password: "Senha atual incorreta.",
  same_password: "A nova senha precisa ser diferente da atual.",
  recovery_required:
    "Para definir uma nova senha sem a atual, peça um novo link de recuperação.",
} as const;

export type AuthFailure = keyof typeof authMessages;

export const resetRequestedMessage =
  "Se este e-mail tiver conta, enviamos as instruções.";

export const loginNotices: Record<LoginNotice, string> = {
  session_ended: "Sua sessão terminou. Entre de novo.",
  account_deleted: "Sua conta foi excluída.",
};

export function loginNoticeFor(value: unknown): string | undefined {
  if (typeof value !== "string" || !Object.hasOwn(loginNotices, value)) {
    return undefined;
  }
  return loginNotices[value as LoginNotice];
}
