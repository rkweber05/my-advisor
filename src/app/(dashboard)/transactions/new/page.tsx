import { randomUUID } from "node:crypto";

import type { Metadata } from "next";

import { Panel } from "@/components/layout/panel";
import { requireUser } from "@/lib/auth/require-user";
import { todayIn } from "@/lib/dates/today";
import { getProfile } from "@/modules/profile/service";
import { createTransactionAction } from "@/modules/transactions/actions";
import { TransactionForm } from "@/modules/transactions/components/transaction-form";
import { getFormOptions } from "@/modules/transactions/service";

export const metadata: Metadata = { title: "Lançar — Meu Advisor" };

export default async function NewTransactionPage() {
  const user = await requireUser();
  const [profile, options] = await Promise.all([
    getProfile(user.id),
    getFormOptions(),
  ]);

  return (
    <>
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">Lançar</h1>
      <Panel className="max-w-md">
        <TransactionForm
          action={createTransactionAction}
          options={options}
          idempotencyKey={randomUUID()}
          initial={{
            type: "expense",
            amount_cents: 0,
            // "Hoje" no fuso do perfil, não no do servidor.
            transaction_date: todayIn(profile.timezone),
            category_id: "",
            payment_method: options.defaults.payment_method,
            account_id: options.defaults.account_id,
            card_id: options.defaults.card_id,
            destination_account_id: "",
            description: "",
            notes: "",
            pending: false,
          }}
        />
      </Panel>
    </>
  );
}
