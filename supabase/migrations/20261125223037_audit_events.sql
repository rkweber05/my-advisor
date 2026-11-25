-- Fase 1, entrega 1.7: registro de auditoria (D-15).
-- Guarda só o tipo do evento, a data e, a partir da Fase 2, o registro afetado.
-- Nunca guarda senha, token, valor financeiro, IP ou agente do navegador.
create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  event_type text not null check (
    event_type in (
      'login',
      'logout',
      'profile_updated',
      'password_changed',
      'account_deletion_requested'
    )
  ),
  entity_type text,
  entity_id uuid,
  created_at timestamptz not null default now()
);

create index audit_events_user_id_created_at_idx
on public.audit_events (user_id, created_at);

-- Privilégio mínimo: o usuário lê os próprios eventos e insere informando só o tipo e o
-- registro afetado. `user_id` e `created_at` vêm sempre dos padrões da tabela.
-- Sem UPDATE nem DELETE: evento gravado não se altera.
revoke all on public.audit_events from anon, authenticated;
grant select on public.audit_events to authenticated;
grant insert (event_type, entity_type, entity_id) on public.audit_events to authenticated;

alter table public.audit_events enable row level security;

create policy audit_events_select_own on public.audit_events
for select to authenticated
using ((select auth.uid()) = user_id);

create policy audit_events_insert_own on public.audit_events
for insert to authenticated
with check ((select auth.uid()) = user_id);
