"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/form/form-message";
import { SubmitButton } from "@/components/form/submit-button";
import { TextLink } from "@/components/form/text-link";
import { emptyFormState } from "@/lib/forms/form-state";

import { confirmLinkAction } from "../actions";

const copy = {
  email: {
    title: "Confirmar e-mail",
    text: "Toque no botão para confirmar seu e-mail e entrar.",
    retry: { href: "/register", label: "Fazer o cadastro de novo" },
  },
  recovery: {
    title: "Definir nova senha",
    text: "Toque no botão para continuar e escolher a nova senha.",
    retry: { href: "/forgot-password", label: "Pedir outro link" },
  },
} as const;

type ConfirmLinkFormProps = { tokenHash: string; type: keyof typeof copy };

// O token do link só é trocado no clique: leitor de e-mail que abre o link não o consome.
export function ConfirmLinkForm({ tokenHash, type }: ConfirmLinkFormProps) {
  const [state, formAction, pending] = useActionState(
    confirmLinkAction,
    emptyFormState,
  );
  const { title, text, retry } = copy[type];

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">{text}</p>
      <FormMessage state={state} />
      <input type="hidden" name="token_hash" value={tokenHash} />
      <input type="hidden" name="type" value={type} />
      <SubmitButton pending={pending} pendingLabel="Confirmando…">
        {title}
      </SubmitButton>
      {state.message && <TextLink href={retry.href}>{retry.label}</TextLink>}
    </form>
  );
}
