import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Notice } from "@/components/form/form-message";
import { SelectField } from "@/components/form/select-field";
import { TextField } from "@/components/form/text-field";
import { Panel } from "@/components/layout/panel";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/require-user";
import { monthLabel } from "@/lib/dates/labels";
import { shiftMonth } from "@/lib/dates/month";
import { currentMonthIn, todayIn } from "@/lib/dates/today";
import { formatCents } from "@/lib/money/format";
import { createClient } from "@/lib/supabase/server";
import { listAccounts } from "@/modules/accounts/repository";
import { listCards } from "@/modules/cards/repository";
import { listCategories } from "@/modules/categories/repository";
import { getProfile } from "@/modules/profile/service";
import { TransactionList } from "@/modules/transactions/components/transaction-list";
import {
  PAGE_SIZE,
  parseFilters,
  transactionsHref,
  type TransactionFilters,
} from "@/modules/transactions/filters";
import {
  paymentMethodLabels,
  paymentMethods,
  transactionTypes,
  typeLongLabels,
} from "@/modules/transactions/labels";
import {
  findTransaction,
  listTransactions,
} from "@/modules/transactions/repository";

export const metadata: Metadata = { title: "Lançamentos — Meu Advisor" };

const UUID = /^[0-9a-f-]{36}$/i;
const navClass =
  "inline-flex size-11 items-center justify-center rounded-lg border border-input bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

type ActiveFilter = { label: string; href: string };

function activeFilters(
  filters: TransactionFilters,
  categoryNames: Map<string, string>,
): ActiveFilter[] {
  const chips: ActiveFilter[] = [];
  const without = (changes: Partial<TransactionFilters>) =>
    transactionsHref(filters, { ...changes, limit: PAGE_SIZE });

  if (filters.q) {
    chips.push({ label: `Busca: ${filters.q}`, href: without({ q: "" }) });
  }
  if (filters.type) {
    chips.push({
      label: typeLongLabels[filters.type],
      href: without({ type: undefined }),
    });
  }
  if (filters.category) {
    chips.push({
      label: categoryNames.get(filters.category) ?? "Categoria",
      href: without({ category: undefined }),
    });
  }
  if (filters.method) {
    chips.push({
      label: paymentMethodLabels[filters.method],
      href: without({ method: undefined }),
    });
  }
  return chips;
}

export default async function TransactionsPage({
  searchParams,
}: PageProps<"/transactions">) {
  const user = await requireUser();
  const [profile, params, supabase] = await Promise.all([
    getProfile(user.id),
    searchParams,
    createClient(),
  ]);
  const filters = parseFilters(params, currentMonthIn(profile.timezone));
  const [transactions, categories, accounts, cards] = await Promise.all([
    listTransactions(supabase, filters),
    listCategories(supabase),
    listAccounts(supabase),
    listCards(supabase),
  ]);
  const names = (items: { id: string; name: string }[]) =>
    new Map(items.map((item) => [item.id, item.name]));
  const categoryNames = names(categories);
  const chips = activeFilters(filters, categoryNames);
  const saved =
    typeof params.saved === "string" && UUID.test(params.saved)
      ? await findTransaction(supabase, params.saved)
      : null;

  return (
    <>
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">
        Lançamentos
      </h1>
      <div className="flex flex-col gap-4">
        {saved && (
          <Notice>
            Lançamento gravado: {typeLongLabels[saved.type].toLowerCase()} de{" "}
            {formatCents(saved.amount_cents)}.
          </Notice>
        )}
        {params.deleted === "1" && <Notice>Lançamento excluído.</Notice>}

        <Panel className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <Link
              href={transactionsHref(filters, {
                month: shiftMonth(filters.month, -1) ?? filters.month,
                limit: PAGE_SIZE,
              })}
              aria-label="Mês anterior"
              className={navClass}
            >
              <ChevronLeft aria-hidden className="size-5" />
            </Link>
            <p className="text-lg font-semibold tracking-tight first-letter:uppercase">
              {monthLabel(filters.month)}
            </p>
            <Link
              href={transactionsHref(filters, {
                month: shiftMonth(filters.month, 1) ?? filters.month,
                limit: PAGE_SIZE,
              })}
              aria-label="Mês seguinte"
              className={navClass}
            >
              <ChevronRight aria-hidden className="size-5" />
            </Link>
          </div>

          <form action="/transactions" className="flex flex-col gap-3">
            <input type="hidden" name="month" value={filters.month} />
            <TextField
              label="Buscar na descrição"
              name="q"
              type="search"
              maxLength={140}
              defaultValue={filters.q}
            />
            <details
              open={Boolean(filters.type || filters.category || filters.method)}
            >
              <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                Filtros
              </summary>
              <div className="flex flex-col gap-3 pt-2">
                <SelectField
                  label="Tipo"
                  name="type"
                  defaultValue={filters.type ?? ""}
                >
                  <option value="">Todos</option>
                  {transactionTypes.map((type) => (
                    <option key={type} value={type}>
                      {typeLongLabels[type]}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="Categoria"
                  name="category"
                  defaultValue={filters.category ?? ""}
                >
                  <option value="">Todas</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} (
                      {category.type === "income" ? "receita" : "despesa"})
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label="Forma de pagamento"
                  name="method"
                  defaultValue={filters.method ?? ""}
                >
                  <option value="">Todas</option>
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {paymentMethodLabels[method]}
                    </option>
                  ))}
                </SelectField>
              </div>
            </details>
            <Button
              type="submit"
              variant="outline"
              className="h-11 border-input"
            >
              Aplicar
            </Button>
          </form>

          {chips.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Filtros ativos">
              {chips.map((chip) => (
                <li key={chip.label}>
                  <Link
                    href={chip.href}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-muted px-3 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {chip.label}
                    <X aria-hidden className="size-4" />
                    <span className="sr-only">Remover filtro</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-muted-foreground">
                {chips.length > 0
                  ? "Nenhum lançamento com esses filtros."
                  : `Nenhum lançamento em ${monthLabel(filters.month)}.`}
              </p>
              <Link
                href="/transactions/new"
                className="inline-flex h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                Lançar
              </Link>
            </div>
          ) : (
            <TransactionList
              transactions={transactions}
              today={todayIn(profile.timezone)}
              categories={categoryNames}
              accounts={names(accounts)}
              cards={names(cards)}
            />
          )}
          {transactions.length === filters.limit && (
            <Link
              href={transactionsHref(filters, {
                limit: filters.limit + PAGE_SIZE,
              })}
              className="mt-4 inline-flex min-h-11 items-center font-medium text-primary underline"
            >
              Carregar mais
            </Link>
          )}
        </Panel>
      </div>
    </>
  );
}
