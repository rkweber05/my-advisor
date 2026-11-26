import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

import { TextLink } from "@/components/form/text-link";
import { Panel } from "@/components/layout/panel";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { updateTransactionAction } from "@/modules/transactions/actions";
import { DeleteTransactionForm } from "@/modules/transactions/components/delete-transaction-form";
import { TransactionForm } from "@/modules/transactions/components/transaction-form";
import { findTransaction } from "@/modules/transactions/repository";
import { getFormOptions } from "@/modules/transactions/service";

export const metadata: Metadata = { title: "Editar lançamento — Meu Advisor" };

export default async function EditTransactionPage({
  params,
}: PageProps<"/transactions/[id]">) {
  await requireUser();

  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();

  // O RLS só devolve movimentação da própria pessoa: a de outra conta dá "não encontrado".
  const transaction = await findTransaction(await createClient(), id.data);
  if (!transaction) notFound();

  const options = await getFormOptions(transaction);

  return (
    <>
      <TextLink href="/transactions">Lançamentos</TextLink>
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">
        Editar lançamento
      </h1>
      <div className="flex flex-col gap-4">
        <Panel className="max-w-md">
          <TransactionForm
            action={updateTransactionAction}
            options={options}
            transactionId={transaction.id}
            initial={{
              type: transaction.type,
              amount_cents: transaction.amount_cents,
              transaction_date: transaction.transaction_date,
              category_id: transaction.category_id ?? "",
              payment_method: transaction.payment_method ?? "",
              account_id: transaction.account_id ?? "",
              card_id: transaction.card_id ?? "",
              destination_account_id: transaction.destination_account_id ?? "",
              description: transaction.description ?? "",
              notes: transaction.notes ?? "",
              pending: transaction.status === "pending",
            }}
          />
        </Panel>
        <Panel className="max-w-md">
          <DeleteTransactionForm id={transaction.id} />
        </Panel>
      </div>
    </>
  );
}
