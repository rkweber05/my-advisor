import type { PostgrestError } from "@supabase/supabase-js";

// Mensagens comuns aos cadastros de apoio (categorias, contas e cartões).
export const catalogMessages = {
  duplicateName: "Já existe um item com esse nome.",
  inUse: "Tem lançamentos. Dá para desativar, não para excluir.",
  unexpected: "Não foi possível concluir. Tente de novo.",
} as const;

const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";

export function catalogErrorMessage(error: PostgrestError): string {
  if (error.code === UNIQUE_VIOLATION) return catalogMessages.duplicateName;
  if (error.code === FOREIGN_KEY_VIOLATION) return catalogMessages.inUse;

  console.error("catalog_write_failed", error.code);
  return catalogMessages.unexpected;
}
