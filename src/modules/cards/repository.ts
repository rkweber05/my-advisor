import type { ServerClient } from "@/lib/supabase/server";

import type { Card, CardInput } from "./schemas";

export async function listCards(supabase: ServerClient): Promise<Card[]> {
  const { data, error } = await supabase
    .from("cards")
    .select(
      "id, name, institution, brand, credit_limit_cents, closing_day, due_day, is_active",
    )
    .order("is_active", { ascending: false })
    .order("name");

  if (error) throw new Error(`cards_read_failed: ${error.code}`);
  return data as Card[];
}

export function insertCard(supabase: ServerClient, input: CardInput) {
  return supabase.from("cards").insert(input);
}

export function updateCard(
  supabase: ServerClient,
  id: string,
  changes: Partial<CardInput> & { is_active?: boolean },
) {
  return supabase.from("cards").update(changes).eq("id", id);
}

export function deleteCard(supabase: ServerClient, id: string) {
  return supabase.from("cards").delete().eq("id", id);
}
