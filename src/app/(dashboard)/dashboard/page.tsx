import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = { title: "Início — Meu Advisor" };

// Estado vazio até a Fase 3.
export default async function DashboardPage() {
  await requireUser();

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Início</h1>
      <p className="mt-2 text-muted-foreground">
        Ainda não há lançamentos para mostrar.
      </p>
    </>
  );
}
