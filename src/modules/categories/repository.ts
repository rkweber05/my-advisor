import type { ServerClient } from "@/lib/supabase/server";

import type { Category, CategoryType } from "./schemas";

// O RLS já limita tudo ao usuário da sessão; nenhuma função recebe `user_id`.
export async function listCategories(
  supabase: ServerClient,
): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, type, is_active")
    .order("is_active", { ascending: false })
    .order("name");

  if (error) throw new Error(`categories_read_failed: ${error.code}`);
  return data as Category[];
}

export function insertCategory(
  supabase: ServerClient,
  input: { name: string; type: CategoryType },
) {
  return supabase.from("categories").insert(input);
}

export function updateCategory(
  supabase: ServerClient,
  id: string,
  changes: { name?: string; is_active?: boolean },
) {
  return supabase.from("categories").update(changes).eq("id", id);
}

export function deleteCategory(supabase: ServerClient, id: string) {
  return supabase.from("categories").delete().eq("id", id);
}
