import type { Metadata } from "next";

import {
  CatalogList,
  CatalogRow,
  EmptyCatalog,
} from "@/components/catalog/catalog-row";
import { RowActions } from "@/components/catalog/row-actions";
import { TextLink } from "@/components/form/text-link";
import { Panel } from "@/components/layout/panel";
import { Money } from "@/components/money";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import {
  deleteAccountRecordAction,
  toggleAccountAction,
} from "@/modules/accounts/actions";
import { AccountForm } from "@/modules/accounts/components/account-form";
import { listAccountsWithBalance } from "@/modules/accounts/repository";
import { accountTypeLabels } from "@/modules/accounts/schemas";

export const metadata: Metadata = { title: "Contas — Meu Advisor" };

export default async function AccountsPage() {
  await requireUser();
  const accounts = await listAccountsWithBalance(await createClient());

  return (
    <>
      <TextLink href="/settings">Configurações</TextLink>
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">Contas</h1>
      <div className="flex flex-col gap-4">
        <Panel className="max-w-md">
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold tracking-tight">
              Suas contas
            </h2>
            <p className="text-sm text-muted-foreground">
              O saldo soma o saldo inicial e os lançamentos concluídos. Compra
              no crédito não entra.
            </p>
            {accounts.length === 0 && (
              <EmptyCatalog>Nenhuma conta cadastrada.</EmptyCatalog>
            )}
            <CatalogList>
              {accounts.map((account) => (
                <CatalogRow
                  key={account.id}
                  title={account.name}
                  detail={[
                    accountTypeLabels[account.account_type],
                    account.institution,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  value={<Money cents={account.balance_cents} tone="result" />}
                  isActive={account.is_active}
                >
                  <AccountForm account={account} />
                  <RowActions
                    id={account.id}
                    isActive={account.is_active}
                    toggleAction={toggleAccountAction}
                    deleteAction={deleteAccountRecordAction}
                  />
                </CatalogRow>
              ))}
            </CatalogList>
          </section>
        </Panel>
        <Panel className="max-w-md">
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold tracking-tight">Nova conta</h2>
            <AccountForm />
          </section>
        </Panel>
      </div>
    </>
  );
}
