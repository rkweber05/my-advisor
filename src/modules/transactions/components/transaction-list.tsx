import { ArrowLeftRight, CreditCard } from "lucide-react";
import Link from "next/link";

import { Money } from "@/components/money";
import { dayLabel } from "@/lib/dates/labels";

import {
  paymentMethodLabels,
  typeLongLabels,
  type PaymentMethod,
} from "../labels";
import type { Transaction } from "../repository";

export type Names = Map<string, string>;

type TransactionListProps = {
  transactions: Transaction[];
  today: string;
  categories: Names;
  accounts: Names;
  cards: Names;
};

function nameOf(names: Names, id: string | null): string {
  return (id && names.get(id)) || "—";
}

function title(item: Transaction, categories: Names): string {
  return item.category_id
    ? nameOf(categories, item.category_id)
    : typeLongLabels[item.type];
}

// De onde saiu e para onde foi, conforme o tipo.
function origin(item: Transaction, accounts: Names, cards: Names): string {
  if (item.type === "transfer") {
    return `${nameOf(accounts, item.account_id)} para ${nameOf(accounts, item.destination_account_id)}`;
  }
  if (item.type === "card_payment") {
    return `${nameOf(cards, item.card_id)}, pago por ${nameOf(accounts, item.account_id)}`;
  }

  const method = paymentMethodLabels[item.payment_method as PaymentMethod];
  const where = item.card_id
    ? nameOf(cards, item.card_id)
    : nameOf(accounts, item.account_id);
  return `${method} · ${where}`;
}

function groupByDay(transactions: Transaction[]): [string, Transaction[]][] {
  const groups = new Map<string, Transaction[]>();
  for (const item of transactions) {
    const group = groups.get(item.transaction_date) ?? [];
    group.push(item);
    groups.set(item.transaction_date, group);
  }
  return [...groups.entries()];
}

function Row({
  item,
  categories,
  accounts,
  cards,
}: Omit<TransactionListProps, "transactions" | "today"> & {
  item: Transaction;
}) {
  const Icon =
    item.type === "transfer"
      ? ArrowLeftRight
      : item.type === "card_payment"
        ? CreditCard
        : null;

  return (
    <li className="border-b border-border last:border-b-0">
      <Link
        href={`/transactions/${item.id}`}
        className="flex min-h-14 items-center justify-between gap-3 py-2.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2 font-medium">
            {Icon && (
              <Icon aria-hidden className="size-4 text-muted-foreground" />
            )}
            <span className="truncate">{title(item, categories)}</span>
            {item.status === "pending" && (
              <span className="shrink-0 rounded-sm bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning-strong">
                Pendente
              </span>
            )}
          </span>
          <span className="block truncate text-sm text-muted-foreground">
            {[item.description, origin(item, accounts, cards)]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </span>
        <Money
          cents={item.amount_cents}
          tone={item.type === "income" ? "income" : "plain"}
        />
      </Link>
    </li>
  );
}

// Lista agrupada por dia. Receita leva sinal de mais e cor; despesa fica sem cor (DESIGN.md);
// transferência e fatura têm ícone próprio, em tom neutro.
export function TransactionList({
  transactions,
  today,
  ...names
}: TransactionListProps) {
  return (
    <div className="flex flex-col gap-5">
      {groupByDay(transactions).map(([date, items]) => (
        <section key={date}>
          <h2 className="text-sm font-semibold text-muted-foreground">
            {dayLabel(date, today)}
          </h2>
          <ul>
            {items.map((item) => (
              <Row key={item.id} item={item} {...names} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
