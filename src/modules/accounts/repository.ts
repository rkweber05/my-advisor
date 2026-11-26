import type { ServerClient } from "@/lib/supabase/server";

import type { Account, AccountInput, AccountWithBalance } from "./schemas";

export async function listAccounts(supabase: ServerClient): Promise<Account[]> {
  const { data, error } = await supabase
    .from("accounts")
    .select(
      "id, name, institution, account_type, initial_balance_cents, is_active",
    )
    .order("is_active", { ascending: false })
    .order("name");

  if (error) throw new Error(`accounts_read_failed: ${error.code}`);
  return data as Account[];
}

// O saldo é somado no banco, pela view `account_balances` (D-35).
export async function listAccountsWithBalance(
  supabase: ServerClient,
): Promise<AccountWithBalance[]> {
  const [accounts, balances] = await Promise.all([
    listAccounts(supabase),
    supabase.from("account_balances").select("account_id, balance_cents"),
  ]);
  if (balances.error) {
    throw new Error(`balances_read_failed: ${balances.error.code}`);
  }

  const byAccount = new Map(
    balances.data.map((row) => [row.account_id, row.balance_cents]),
  );
  return accounts.map((account) => ({
    ...account,
    balance_cents: byAccount.get(account.id) ?? account.initial_balance_cents,
  }));
}

export function insertAccount(supabase: ServerClient, input: AccountInput) {
  return supabase.from("accounts").insert(input);
}

export function updateAccount(
  supabase: ServerClient,
  id: string,
  changes: Partial<AccountInput> & { is_active?: boolean },
) {
  return supabase.from("accounts").update(changes).eq("id", id);
}

export function deleteAccount(supabase: ServerClient, id: string) {
  return supabase.from("accounts").delete().eq("id", id);
}
