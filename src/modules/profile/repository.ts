import type { ServerClient } from "@/lib/supabase/server";

import type { ProfileInput } from "./schemas";

export async function findProfile(supabase: ServerClient, userId: string) {
  return supabase
    .from("profiles")
    .select("name, timezone")
    .eq("id", userId)
    .single();
}

export async function updateProfile(
  supabase: ServerClient,
  userId: string,
  input: ProfileInput,
) {
  return supabase.from("profiles").update(input).eq("id", userId);
}
