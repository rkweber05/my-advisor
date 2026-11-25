-- Fase 1, entrega 1.6: cadastro fechado por lista de e-mails (D-12).
-- A lista é mantida pelo proprietário direto no banco; não há tela.
create table public.signup_allowlist (
  email text primary key check (email = lower(btrim(email))),
  created_at timestamptz not null default now()
);

revoke all on public.signup_allowlist from anon, authenticated;

alter table public.signup_allowlist enable row level security;

-- Única política: o serviço de autenticação lê a lista para decidir o cadastro.
grant usage on schema public to supabase_auth_admin;
grant select on public.signup_allowlist to supabase_auth_admin;

create policy signup_allowlist_auth_admin_select on public.signup_allowlist
for select to supabase_auth_admin
using (true);

-- Gancho "before user created" do Supabase Auth: recusa e-mail fora da lista.
-- Vale para qualquer caminho de criação de conta, não só para a tela de cadastro.
create function public.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.signup_allowlist
    where email = lower(btrim(event -> 'user' ->> 'email'))
  ) then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error',
    jsonb_build_object('http_code', 403, 'message', 'signup_not_allowed')
  );
end;
$$;

revoke execute on function public.hook_before_user_created(jsonb)
from public, anon, authenticated;
grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin;
