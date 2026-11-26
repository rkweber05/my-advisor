import type { ServerClient } from "@/lib/supabase/server";

import { insertAuditEvent, type AuditEventType } from "./repository";

// Registra o evento em nome do usuário logado. De uma movimentação vai só o id, nunca o
// valor nem a descrição. Uma falha aqui não desfaz a operação
// principal; fica no log técnico, só com o tipo do evento e o código do erro.
export async function recordAuditEvent(
  supabase: ServerClient,
  eventType: AuditEventType,
  transactionId?: string,
): Promise<void> {
  const { error } = await insertAuditEvent(supabase, eventType, transactionId);

  if (error) {
    console.error("audit_event_failed", eventType, error.code);
  }
}
