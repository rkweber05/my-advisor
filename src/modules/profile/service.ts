import "server-only";

import { createClient } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/modules/audit/service";

import { findProfile, updateProfile } from "./repository";
import type { ProfileInput } from "./schemas";

export type Profile = { name: string; timezone: string };

// O `userId` vem sempre do `requireUser()`, nunca do cliente.
export async function getProfile(userId: string): Promise<Profile> {
  const supabase = await createClient();
  const { data, error } = await findProfile(supabase, userId);

  if (error) throw new Error(`profile_read_failed: ${error.code}`);
  return data;
}

export async function saveProfile(
  userId: string,
  input: ProfileInput,
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await updateProfile(supabase, userId, input);
  if (error) {
    console.error("profile_update_failed", error.code);
    return false;
  }

  await recordAuditEvent(supabase, "profile_updated");
  return true;
}
