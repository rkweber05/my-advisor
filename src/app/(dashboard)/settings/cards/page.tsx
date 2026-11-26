import type { Metadata } from "next";

import {
  CatalogList,
  CatalogRow,
  EmptyCatalog,
} from "@/components/catalog/catalog-row";
import { RowActions } from "@/components/catalog/row-actions";
import { TextLink } from "@/components/form/text-link";
import { Panel } from "@/components/layout/panel";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { deleteCardAction, toggleCardAction } from "@/modules/cards/actions";
import { CardForm } from "@/modules/cards/components/card-form";
import { listCards } from "@/modules/cards/repository";
import { cardBrandLabels, type Card } from "@/modules/cards/schemas";

export const metadata: Metadata = { title: "Cartões — Meu Advisor" };

function cardDetail(card: Card): string {
  return [
    cardBrandLabels[card.brand],
    card.closing_day ? `fecha dia ${card.closing_day}` : null,
    card.due_day ? `vence dia ${card.due_day}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export default async function CardsPage() {
  await requireUser();
  const cards = await listCards(await createClient());

  return (
    <>
      <TextLink href="/settings">Configurações</TextLink>
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">Cartões</h1>
      <div className="flex flex-col gap-4">
        <Panel className="max-w-md">
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold tracking-tight">
              Seus cartões de crédito
            </h2>
            <p className="text-sm text-muted-foreground">
              Não pedimos número, validade nem código. Compra parcelada entra
              inteira no mês da compra.
            </p>
            {cards.length === 0 && (
              <EmptyCatalog>Nenhum cartão cadastrado.</EmptyCatalog>
            )}
            <CatalogList>
              {cards.map((card) => (
                <CatalogRow
                  key={card.id}
                  title={card.name}
                  detail={cardDetail(card)}
                  isActive={card.is_active}
                >
                  <CardForm card={card} />
                  <RowActions
                    id={card.id}
                    isActive={card.is_active}
                    toggleAction={toggleCardAction}
                    deleteAction={deleteCardAction}
                  />
                </CatalogRow>
              ))}
            </CatalogList>
          </section>
        </Panel>
        <Panel className="max-w-md">
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold tracking-tight">
              Novo cartão
            </h2>
            <CardForm />
          </section>
        </Panel>
      </div>
    </>
  );
}
