-- Fase 2, entrega 2.5: cartões de crédito (D-21).
-- Nunca guarda número, validade, CVV nem senha: só o que a pessoa informa para se organizar.
create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (name = btrim(name) and char_length(name) between 1 and 40),
  institution text check (institution = btrim(institution) and char_length(institution) between 1 and 40),
  brand text not null check (
    brand in ('visa', 'mastercard', 'elo', 'amex', 'hipercard', 'other')
  ),
  credit_limit_cents bigint check (credit_limit_cents between 1 and 99999999999),
  closing_day smallint check (closing_day between 1 and 31),
  due_day smallint check (due_day between 1 and 31),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id)
);

create unique index cards_user_name_key on public.cards (user_id, lower(name));

create trigger cards_set_updated_at
before update on public.cards
for each row execute function public.set_updated_at();

revoke all on public.cards from anon, authenticated;
grant select, delete on public.cards to authenticated;
grant insert (name, institution, brand, credit_limit_cents, closing_day, due_day)
on public.cards to authenticated;
grant update (name, institution, brand, credit_limit_cents, closing_day, due_day, is_active)
on public.cards to authenticated;

alter table public.cards enable row level security;

create policy cards_select_own on public.cards
for select to authenticated using ((select auth.uid()) = user_id);
create policy cards_insert_own on public.cards
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy cards_update_own on public.cards
for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy cards_delete_own on public.cards
for delete to authenticated using ((select auth.uid()) = user_id);
