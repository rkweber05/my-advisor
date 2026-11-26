import type { Metadata } from "next";

import { Panel } from "@/components/layout/panel";
import { requireUser } from "@/lib/auth/require-user";
import { UpdatePasswordForm } from "@/modules/auth/components/update-password-form";

export const metadata: Metadata = { title: "Nova senha — Meu Advisor" };

export default async function UpdatePasswordPage() {
  await requireUser();

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Nova senha</h1>
      <p className="mt-2 mb-5 text-muted-foreground">
        Escolha a nova senha. Os outros aparelhos serão desconectados.
      </p>
      <Panel className="max-w-sm">
        <UpdatePasswordForm />
      </Panel>
    </>
  );
}
