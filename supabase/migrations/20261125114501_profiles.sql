-- Fase 1, entrega 1.3: perfil do usuário.
-- Decisões D-11 (a chave é o próprio auth.users.id) e D-31 (perfil criado por gatilho).

-- Mantém `updated_at`. É a função única usada por todas as tabelas que têm a coluna.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Aceita só nomes de fuso IANA. `at time zone` sozinho também aceitaria abreviações e
-- especificações POSIX arbitrárias, que o JavaScript recusa.
create function public.is_valid_timezone(tz text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (select 1 from pg_catalog.pg_timezone_names where name = tz);
$$;

revoke execute on function public.is_valid_timezone(text) from public, anon;
grant execute on function public.is_valid_timezone(text) to authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null
    check (char_length(btrim(name)) >= 1 and char_length(name) <= 80),
  currency text not null default 'BRL' check (currency = 'BRL'),
  timezone text not null default 'America/Sao_Paulo'
    check (public.is_valid_timezone(timezone)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Privilégio mínimo: o usuário lê a própria linha e altera só nome e fuso.
-- Não há INSERT nem DELETE: a linha nasce pelo gatilho abaixo e some pelo `cascade`.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (name, timezone) on public.profiles to authenticated;

alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
for select to authenticated
using ((select auth.uid()) = id);

create policy profiles_update_own on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Única função SECURITY DEFINER do projeto (ADR 0002, D-31). Roda como dona da tabela porque
-- quem insere em auth.users é o serviço de autenticação, que não tem acesso a public.profiles.
-- A única entrada do usuário é o nome, que passa pelas restrições da tabela: sem nome válido,
-- a conta não é criada.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, btrim(new.raw_user_meta_data ->> 'name'));
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
