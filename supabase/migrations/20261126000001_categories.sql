-- Fase 2, entrega 2.3: categorias (D-19, D-23, D-38).
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (name = btrim(name) and char_length(name) between 1 and 40),
  type text not null check (type in ('income', 'expense')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  -- Alvo da FK de `transactions`: garante que a categoria é da pessoa e do mesmo tipo.
  unique (user_id, id, type)
);

create unique index categories_user_type_name_key
on public.categories (user_id, type, lower(name));

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

-- `user_id` vem sempre do padrão; o tipo não muda depois de criada.
revoke all on public.categories from anon, authenticated;
grant select, delete on public.categories to authenticated;
grant insert (name, type) on public.categories to authenticated;
grant update (name, is_active) on public.categories to authenticated;

alter table public.categories enable row level security;

create policy categories_select_own on public.categories
for select to authenticated using ((select auth.uid()) = user_id);
create policy categories_insert_own on public.categories
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy categories_update_own on public.categories
for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy categories_delete_own on public.categories
for delete to authenticated using ((select auth.uid()) = user_id);

-- D-38 (ADR 0003): a função que já cria o perfil passa a criar também as categorias padrão
-- do SDD. Continua sendo a única SECURITY DEFINER, sem entrada do usuário além do nome.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, btrim(new.raw_user_meta_data ->> 'name'));

  insert into public.categories (user_id, name, type)
  values
    (new.id, 'Alimentação', 'expense'),
    (new.id, 'Moradia', 'expense'),
    (new.id, 'Transporte', 'expense'),
    (new.id, 'Combustível', 'expense'),
    (new.id, 'Saúde', 'expense'),
    (new.id, 'Educação', 'expense'),
    (new.id, 'Lazer', 'expense'),
    (new.id, 'Assinaturas', 'expense'),
    (new.id, 'Compras', 'expense'),
    (new.id, 'Viagens', 'expense'),
    (new.id, 'Contas e serviços', 'expense'),
    (new.id, 'Outros', 'expense'),
    (new.id, 'Salário', 'income'),
    (new.id, 'Freelance', 'income'),
    (new.id, 'Rendimentos', 'income'),
    (new.id, 'Vendas', 'income'),
    (new.id, 'Outros', 'income');

  return new;
end;
$$;

-- Contas criadas antes desta migration recebem as mesmas categorias.
insert into public.categories (user_id, name, type)
select u.id, d.name, d.type
from auth.users u
cross join (
  values
    ('Alimentação', 'expense'), ('Moradia', 'expense'), ('Transporte', 'expense'),
    ('Combustível', 'expense'), ('Saúde', 'expense'), ('Educação', 'expense'),
    ('Lazer', 'expense'), ('Assinaturas', 'expense'), ('Compras', 'expense'),
    ('Viagens', 'expense'), ('Contas e serviços', 'expense'), ('Outros', 'expense'),
    ('Salário', 'income'), ('Freelance', 'income'), ('Rendimentos', 'income'),
    ('Vendas', 'income'), ('Outros', 'income')
) as d (name, type)
where not exists (select 1 from public.categories c where c.user_id = u.id);
