"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

import { logoutAction } from "../actions";

function LogoutButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      disabled={pending}
      className="h-12 w-full border-input text-base"
    >
      {pending ? "Saindo…" : "Sair"}
    </Button>
  );
}

export function LogoutForm() {
  return (
    <form action={logoutAction}>
      <LogoutButton />
    </form>
  );
}
