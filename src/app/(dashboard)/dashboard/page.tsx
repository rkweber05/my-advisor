import type { Metadata } from "next";

import { Panel } from "@/components/layout/panel";
import { requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = { title: "Início — Meu Advisor" };

// Sem indicadores até a Fase 3: só aponta para a ação principal.
export default async function DashboardPage() {
  await requireUser();

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Início</h1>
      <Panel className="mt-5">
        <p className="text-muted-foreground">
          Os números do mês aparecem aqui em breve. Para registrar um gasto, use
          o botão Lançar.
        </p>
      </Panel>
    </>
  );
}
