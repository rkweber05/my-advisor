-- Fase 1, entrega 1.3: gatilho de criação de perfil, privilégios e políticas de `profiles`.
-- Usuários fictícios; tudo é desfeito pelo rollback.
begin;

create extension if not exists pgtap with schema extensions;

select plan(18);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-00000000000a', 'ana@example.test', '{"name": "  Ana  "}'),
  ('00000000-0000-0000-0000-00000000000b', 'bia@example.test', '{"name": "Bia"}');

-- Estrutura
select policies_are(
  'public',
  'profiles',
  array['profiles_select_own', 'profiles_update_own'],
  'profiles tem só as políticas de SELECT e UPDATE'
);

select is(
  (select prosecdef from pg_catalog.pg_proc where oid = 'public.handle_new_user()'::regprocedure),
  true,
  'handle_new_user é SECURITY DEFINER'
);

select is_empty(
  $$
    select p.oid::regprocedure::text
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and p.oid <> 'public.handle_new_user()'::regprocedure
  $$,
  'nenhuma outra função de public é SECURITY DEFINER'
);

-- Gatilho (critério 5)
select results_eq(
  $$ select name, currency, timezone from public.profiles
     where id = '00000000-0000-0000-0000-00000000000a' $$,
  $$ values ('Ana', 'BRL', 'America/Sao_Paulo') $$,
  'conta nova ganha perfil com nome sem espaços nas pontas, BRL e America/Sao_Paulo'
);

select throws_ok(
  $$ insert into auth.users (id, email)
     values ('00000000-0000-0000-0000-00000000000c', 'sem-nome@example.test') $$,
  '23502',
  null,
  'conta sem nome não é criada'
);

select throws_ok(
  $$ insert into auth.users (id, email, raw_user_meta_data)
     values ('00000000-0000-0000-0000-00000000000d', 'longo@example.test',
             jsonb_build_object('name', repeat('a', 81))) $$,
  '23514',
  null,
  'conta com nome acima de 80 caracteres não é criada'
);

-- Usuária Ana (critério 6)
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

select results_eq(
  'select id from public.profiles',
  $$ values ('00000000-0000-0000-0000-00000000000a'::uuid) $$,
  'Ana lê só o próprio perfil'
);

select lives_ok(
  $$ update public.profiles set name = 'Ana Souza', timezone = 'America/Manaus'
     where id = '00000000-0000-0000-0000-00000000000a' $$,
  'Ana altera o próprio nome e fuso'
);

select is(
  (select updated_at >= created_at from public.profiles
   where id = '00000000-0000-0000-0000-00000000000a'),
  true,
  'updated_at é mantido pelo gatilho'
);

select results_eq(
  $$ with changed as (
       update public.profiles set name = 'Invadida'
       where id = '00000000-0000-0000-0000-00000000000b'
       returning id
     )
     select count(*) from changed $$,
  $$ values (0::bigint) $$,
  'Ana não altera o perfil de Bia'
);

select throws_ok(
  $$ update public.profiles set timezone = 'UTC+3'
     where id = '00000000-0000-0000-0000-00000000000a' $$,
  '23514',
  null,
  'fuso que não é IANA é recusado'
);

select throws_ok(
  $$ update public.profiles set currency = 'USD'
     where id = '00000000-0000-0000-0000-00000000000a' $$,
  '42501',
  null,
  'Ana não altera a moeda'
);

select throws_ok(
  $$ update public.profiles set id = '00000000-0000-0000-0000-00000000000e'
     where id = '00000000-0000-0000-0000-00000000000a' $$,
  '42501',
  null,
  'Ana não altera o id do perfil'
);

select throws_ok(
  $$ insert into public.profiles (id, name)
     values ('00000000-0000-0000-0000-00000000000e', 'Falsa') $$,
  '42501',
  null,
  'Ana não insere perfil'
);

select throws_ok(
  $$ delete from public.profiles where id = '00000000-0000-0000-0000-00000000000a' $$,
  '42501',
  null,
  'Ana não apaga perfil'
);

-- Visitante anônimo (critério 7)
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';

select throws_ok(
  'select * from public.profiles',
  '42501',
  null,
  'visitante anônimo não lê perfis'
);

-- Estado final, visto pelo dono do banco
reset role;

select results_eq(
  $$ select name from public.profiles where id = '00000000-0000-0000-0000-00000000000b' $$,
  $$ values ('Bia') $$,
  'o perfil de Bia continua intacto'
);

delete from auth.users where id = '00000000-0000-0000-0000-00000000000a';

select is_empty(
  $$ select 1 from public.profiles where id = '00000000-0000-0000-0000-00000000000a' $$,
  'excluir a conta apaga o perfil'
);

select * from finish();

rollback;
