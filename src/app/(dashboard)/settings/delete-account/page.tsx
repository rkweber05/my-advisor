import type { Metadata } from "next";

import { TextLink } from "@/components/form/text-link";
import { requireUser } from "@/lib/auth/require-user";
import { DeleteAccountForm } from "@/modules/auth/components/delete-account-form";

export const metadata: Metadata = { title: "Excluir conta — Meu Advisor" };

export default async function DeleteAccountPage() {
  await requireUser();

  return (
    <div className="flex max-w-sm flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Excluir conta</h1>
      <div className="flex flex-col gap-3">
        <p>A exclusão é definitiva e apaga:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>a conta e o acesso por este e-mail;</li>
          <li>o perfil;</li>
          <li>o histórico de eventos da conta.</li>
        </ul>
        <p className="text-muted-foreground">
          Não existe cópia para restaurar depois. Fica só o registro de que uma
          exclusão aconteceu, sem nenhum dado seu.
        </p>
      </div>
      <DeleteAccountForm />
      <TextLink href="/settings">Cancelar e voltar</TextLink>
    </div>
  );
}
