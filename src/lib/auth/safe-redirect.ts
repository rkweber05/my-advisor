import { HOME_PATH } from "@/lib/auth/routes";

// Destino depois do login. Só aceita caminho interno: uma única barra no início, sem barra
// invertida nem caractere de controle. Qualquer outra coisa vira a página inicial.
export function safeRedirectPath(value: unknown): string {
  if (typeof value !== "string") return HOME_PATH;
  if (!/^\/(?![/\\])/.test(value)) return HOME_PATH;
  if (/[\\\u0000-\u001f]/.test(value)) return HOME_PATH;
  return value;
}
