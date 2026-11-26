-- Fase 2, entregas 2.6 e 2.7: movimentações (D-16 a D-18, D-20, D-22, D-37, D-39).
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type text not null check (type in ('income', 'expense', 'transfer', 'card_payment')),
  -- Sempre positivo: o sentido vem do tipo, nunca do sinal (TRANS-002).
  amount_cents bigint not null check (amount_cents between 1 and 99999999999),
  transaction_date date not null,
  description text check (description = btrim(description) and char_length(description) between 1 and 140),
  category_id uuid,
  payment_method text check (
    payment_method in (
      'pix', 'cash', 'credit_card', 'debit_card', 'bank_transfer', 'boleto', 'other'
    )
  ),
  account_id uuid,
  card_id uuid,
  destination_account_id uuid,
  status text not null default 'completed' check (status in ('completed', 'pending')),
  notes text check (notes = btrim(notes) and char_length(notes) between 1 and 500),
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  -- Reenvio do mesmo formulário não cria outra movimentação (TRANS-007).
  unique (user_id, idempotency_key),

  -- Chaves compostas com `user_id`: nada aponta para registro de outra pessoa. A da
  -- categoria inclui o tipo, para receita não usar categoria de despesa.
  foreign key (user_id, category_id, type)
    references public.categories (user_id, id, type),
  foreign key (user_id, account_id) references public.accounts (user_id, id),
  foreign key (user_id, card_id) references public.cards (user_id, id),
  foreign key (user_id, destination_account_id) references public.accounts (user_id, id),

  -- O que cada tipo exige (regra 7 da spec da Fase 2).
  constraint transactions_fields_by_type check (
    (
      type = 'expense'
      and category_id is not null
      and payment_method is not null
      and destination_account_id is null
      and (
        (payment_method = 'credit_card' and card_id is not null and account_id is null)
        or (payment_method <> 'credit_card' and card_id is null and account_id is not null)
      )
    )
    or (
      type = 'income'
      and category_id is not null
      and payment_method is not null
      and payment_method <> 'credit_card'
      and account_id is not null
      and card_id is null
      and destination_account_id is null
    )
    or (
      type = 'transfer'
      and category_id is null
      and payment_method is null
      and account_id is not null
      and card_id is null
      and destination_account_id is not null
      and destination_account_id <> account_id
    )
    or (
      type = 'card_payment'
      and category_id is null
      and payment_method is null
      and account_id is not null
      and card_id is not null
      and destination_account_id is null
    )
  )
);

create index transactions_user_date_idx
on public.transactions (user_id, transaction_date desc, created_at desc);
create index transactions_category_idx on public.transactions (user_id, category_id);
create index transactions_account_idx on public.transactions (user_id, account_id);
create index transactions_card_idx on public.transactions (user_id, card_id);
create index transactions_destination_idx
on public.transactions (user_id, destination_account_id);

create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

-- `user_id` vem do padrão. O tipo e a chave de idempotência não mudam depois de criados.
revoke all on public.transactions from anon, authenticated;
grant select, delete on public.transactions to authenticated;
grant insert (
  type, amount_cents, transaction_date, description, category_id, payment_method,
  account_id, card_id, destination_account_id, status, notes, idempotency_key
) on public.transactions to authenticated;
grant update (
  amount_cents, transaction_date, description, category_id, payment_method,
  account_id, card_id, destination_account_id, status, notes
) on public.transactions to authenticated;

alter table public.transactions enable row level security;

create policy transactions_select_own on public.transactions
for select to authenticated using ((select auth.uid()) = user_id);
create policy transactions_insert_own on public.transactions
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy transactions_update_own on public.transactions
for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy transactions_delete_own on public.transactions
for delete to authenticated using ((select auth.uid()) = user_id);
