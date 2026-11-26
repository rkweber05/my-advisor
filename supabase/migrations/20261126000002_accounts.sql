-- Fase 2, entrega 2.4: contas. Valores em centavos inteiros (D-16).
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (name = btrim(name) and char_length(name) between 1 and 40),
  institution text check (institution = btrim(institution) and char_length(institution) between 1 and 40),
  account_type text not null check (
    account_type in ('checking', 'savings', 'cash', 'investment', 'other')
  ),
  initial_balance_cents bigint not null default 0 check (
    initial_balance_cents between -99999999999 and 99999999999
  ),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id)
);

create unique index accounts_user_name_key on public.accounts (user_id, lower(name));

create trigger accounts_set_updated_at
before update on public.accounts
for each row execute function public.set_updated_at();

revoke all on public.accounts from anon, authenticated;
grant select, delete on public.accounts to authenticated;
grant insert (name, institution, account_type, initial_balance_cents)
on public.accounts to authenticated;
grant update (name, institution, account_type, initial_balance_cents, is_active)
on public.accounts to authenticated;

alter table public.accounts enable row level security;

create policy accounts_select_own on public.accounts
for select to authenticated using ((select auth.uid()) = user_id);
create policy accounts_insert_own on public.accounts
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy accounts_update_own on public.accounts
for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy accounts_delete_own on public.accounts
for delete to authenticated using ((select auth.uid()) = user_id);
