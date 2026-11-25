import type { Metadata } from "next";

import { TextLink } from "@/components/form/text-link";
import { ConfirmLinkForm } from "@/modules/auth/components/confirm-link-form";
import { authMessages } from "@/modules/auth/messages";
import { confirmLinkSchema } from "@/modules/auth/schemas";

export const metadata: Metadata = {
  title: "Confirmar — Meu Advisor",
  // O endereço carrega o token do e-mail: não deve ser indexado nem vazar como referência.
  robots: { index: false },
  referrer: "no-referrer",
};

// Destino dos links de e-mail. Só mostra um botão; nada acontece antes do clique.
export default async function ConfirmPage({
  searchParams,
}: PageProps<"/auth/confirm">) {
  const parsed = confirmLinkSchema.safeParse(await searchParams);

  if (!parsed.success) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Link inválido</h1>
        <p className="text-muted-foreground">{authMessages.link_invalid}</p>
        <TextLink href="/login">Voltar ao login</TextLink>
      </div>
    );
  }

  return (
    <ConfirmLinkForm
      tokenHash={parsed.data.token_hash}
      type={parsed.data.type}
    />
  );
}
