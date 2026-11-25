import type { ServerClient } from "@/lib/supabase/server";

export type AuditEventType =
  | "login"
  | "logout"
  | "profile_updated"
  | "password_changed"
  | "account_deletion_requested";

// O `user_id` não é informado: vem do padrão `auth.uid()` da tabela.
export async function insertAuditEvent(
  supabase: ServerClient,
  eventType: AuditEventType,
) {
  return supabase.from("audit_events").insert({ event_type: eventType });
}
