-- Fase 1: `audit_events`, `signup_allowlist`, gancho de cadastro e `account_deletions`.
begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-00000000000a', 'ana@example.test', '{"name": "Ana"}'),
  ('00000000-0000-0000-0000-00000000000b', 'bia@example.test', '{"name": "Bia"}');

insert into public.audit_events (user_id, event_type)
values ('00000000-0000-0000-0000-00000000000b', 'login');

insert into public.signup_allowlist (email) values ('convidada@example.test');
insert into public.account_deletions default values;

-- Estrutura
select policies_are(
  'public', 'audit_events',
  array['audit_events_select_own', 'audit_events_insert_own'],
  'audit_events tem só as políticas de SELECT e INSERT'
);
select policies_are(
  'public', 'signup_allowlist',
  array['signup_allowlist_auth_admin_select'],
  'signup_allowlist só é lida pelo serviço de autenticação'
);
select policies_are(
  'public', 'account_deletions', array[]::text[],
  'account_deletions não tem nenhuma política'
);

-- Gancho de cadastro (critério 3)
select is(
  public.hook_before_user_created('{"user": {"email": "Convidada@Example.test "}}'::jsonb),
  '{}'::jsonb,
  'e-mail da lista é aceito, sem diferenciar maiúsculas'
);
select is(
  public.hook_before_user_created('{"user": {"email": "intrusa@example.test"}}'::jsonb)
    #>> '{error,http_code}',
  '403',
  'e-mail fora da lista é recusado'
);
select is(
  public.hook_before_user_created('{"user": {}}'::jsonb) #>> '{error,http_code}',
  '403',
  'evento sem e-mail é recusado'
);
select throws_ok(
  $$ insert into public.signup_allowlist (email) values ('Maiuscula@example.test') $$,
  '23514', null,
  'a lista só guarda e-mail em minúsculas'
);

-- Usuária Ana
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

select lives_ok(
  $$ insert into public.audit_events (event_type) values ('login') $$,
  'Ana grava evento próprio sem informar o user_id'
);
select results_eq(
  'select user_id, event_type from public.audit_events',
  $$ values ('00000000-0000-0000-0000-00000000000a'::uuid, 'login') $$,
  'Ana lê só os próprios eventos'
);
select throws_ok(
  $$ insert into public.audit_events (user_id, event_type)
     values ('00000000-0000-0000-0000-00000000000b', 'login') $$,
  '42501', null,
  'Ana não grava evento em nome de Bia'
);
select throws_ok(
  $$ insert into public.audit_events (event_type) values ('evento_inventado') $$,
  '23514', null,
  'tipo de evento desconhecido é recusado'
);
select throws_ok(
  $$ update public.audit_events set event_type = 'logout' $$,
  '42501', null,
  'evento gravado não é alterado'
);
select throws_ok(
  $$ delete from public.audit_events $$,
  '42501', null,
  'evento gravado não é apagado'
);
select throws_ok(
  'select * from public.signup_allowlist',
  '42501', null,
  'Ana não lê a lista de autorizados'
);
select throws_ok(
  'select * from public.account_deletions',
  '42501', null,
  'Ana não lê o registro de exclusões'
);
select throws_ok(
  $$ select public.hook_before_user_created('{}'::jsonb) $$,
  '42501', null,
  'Ana não chama a função do gancho'
);

-- Visitante anônimo
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';

select throws_ok(
  'select * from public.audit_events',
  '42501', null,
  'visitante anônimo não lê eventos'
);

select * from finish();

rollback;
