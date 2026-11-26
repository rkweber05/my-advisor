-- Fase 2: categorias, contas, cartões, movimentações e saldo.
begin;

create extension if not exists pgtap with schema extensions;

select plan(31);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-00000000000a', 'ana@example.test', '{"name": "Ana"}'),
  ('00000000-0000-0000-0000-00000000000b', 'bia@example.test', '{"name": "Bia"}');

-- Estrutura
select policies_are('public', 'categories',
  array['categories_select_own', 'categories_insert_own', 'categories_update_own', 'categories_delete_own'],
  'categories tem as quatro políticas');
select policies_are('public', 'accounts',
  array['accounts_select_own', 'accounts_insert_own', 'accounts_update_own', 'accounts_delete_own'],
  'accounts tem as quatro políticas');
select policies_are('public', 'cards',
  array['cards_select_own', 'cards_insert_own', 'cards_update_own', 'cards_delete_own'],
  'cards tem as quatro políticas');
select policies_are('public', 'transactions',
  array['transactions_select_own', 'transactions_insert_own', 'transactions_update_own', 'transactions_delete_own'],
  'transactions tem as quatro políticas');

-- Categorias padrão (critério 1)
select results_eq(
  $$ select type, count(*) from public.categories
     where user_id = '00000000-0000-0000-0000-00000000000a' group by type order by type $$,
  $$ values ('expense', 12::bigint), ('income', 5::bigint) $$,
  'conta nova recebe 12 categorias de despesa e 5 de receita'
);

-- Contas e cartões com id fixo, criados pelo dono do banco: pela API o id não é informado
insert into public.accounts (id, user_id, name, account_type)
values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b', 'Conta da Bia', 'checking');
insert into public.cards (id, user_id, name, brand)
values ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-00000000000b', 'Cartão da Bia', 'visa');

insert into public.accounts (id, user_id, name, account_type, initial_balance_cents)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', 'Corrente', 'checking', 100000),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000000a', 'Carteira', 'cash', 0);
insert into public.cards (id, user_id, name, brand)
values ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-00000000000a', 'Cartão', 'visa');

-- Usuária Ana
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

select results_eq(
  'select count(*) from public.accounts',
  $$ values (2::bigint) $$,
  'Ana vê só as próprias contas'
);
select is_empty('select 1 from public.cards where name = ''Cartão da Bia''', 'Ana não vê o cartão de Bia');

select throws_ok(
  $$ insert into public.categories (user_id, name, type)
     values ('00000000-0000-0000-0000-00000000000b', 'Forjada', 'expense') $$,
  '42501', null, 'Ana não cria categoria em nome de Bia');
select throws_ok(
  $$ update public.categories set type = 'income' where name = 'Lazer' $$,
  '42501', null, 'o tipo da categoria não muda');
select throws_ok(
  $$ insert into public.categories (name, type) values ('lazer', 'expense') $$,
  '23505', null, 'nome de categoria é único por tipo, sem diferenciar maiúsculas');
select lives_ok(
  $$ insert into public.categories (name, type) values ('Lazer', 'income') $$,
  'o mesmo nome pode existir no outro tipo');

-- Movimentações válidas: uma de cada forma
select lives_ok($$
  insert into public.transactions
    (type, amount_cents, transaction_date, category_id, payment_method, account_id, idempotency_key)
  select 'expense', 15050, '2026-11-10', id, 'pix', '00000000-0000-0000-0000-0000000000a1', gen_random_uuid()
  from public.categories where name = 'Alimentação' and type = 'expense' $$,
  'despesa no Pix com conta');
select lives_ok($$
  insert into public.transactions
    (type, amount_cents, transaction_date, category_id, payment_method, card_id, idempotency_key)
  select 'expense', 20000, '2026-11-11', id, 'credit_card', '00000000-0000-0000-0000-0000000000a3', gen_random_uuid()
  from public.categories where name = 'Compras' and type = 'expense' $$,
  'despesa no crédito com cartão e sem conta');
select lives_ok($$
  insert into public.transactions
    (type, amount_cents, transaction_date, category_id, payment_method, account_id, idempotency_key)
  select 'income', 500000, '2026-11-05', id, 'bank_transfer', '00000000-0000-0000-0000-0000000000a1', gen_random_uuid()
  from public.categories where name = 'Salário' and type = 'income' $$,
  'receita com conta');
select lives_ok($$
  insert into public.transactions
    (type, amount_cents, transaction_date, account_id, destination_account_id, idempotency_key)
  values ('transfer', 30000, '2026-11-12', '00000000-0000-0000-0000-0000000000a1',
          '00000000-0000-0000-0000-0000000000a2', gen_random_uuid()) $$,
  'transferência entre contas próprias');
select lives_ok($$
  insert into public.transactions
    (type, amount_cents, transaction_date, account_id, card_id, idempotency_key)
  values ('card_payment', 20000, '2026-11-20', '00000000-0000-0000-0000-0000000000a1',
          '00000000-0000-0000-0000-0000000000a3', gen_random_uuid()) $$,
  'pagamento de fatura');
select lives_ok($$
  insert into public.transactions
    (type, amount_cents, transaction_date, category_id, payment_method, account_id, status, idempotency_key)
  select 'expense', 99900, '2026-11-28', id, 'boleto', '00000000-0000-0000-0000-0000000000a1', 'pending', gen_random_uuid()
  from public.categories where name = 'Moradia' and type = 'expense' $$,
  'despesa pendente');

-- Saldo (critério 8): 1000,00 + 5000,00 − 150,50 − 300,00 − 200,00 = 5.349,50; a pendente não entra
select results_eq(
  $$ select a.name, b.balance_cents from public.account_balances b
     join public.accounts a on a.id = b.account_id order by a.name $$,
  $$ values ('Carteira', 30000::bigint), ('Corrente', 534950::bigint) $$,
  'o saldo de cada conta bate com os lançamentos concluídos'
);

-- Combinações inválidas (critérios 5 e 6)
select throws_ok($$
  insert into public.transactions
    (type, amount_cents, transaction_date, category_id, payment_method, account_id, idempotency_key)
  select 'expense', 100, '2026-11-10', id, 'credit_card', '00000000-0000-0000-0000-0000000000a1', gen_random_uuid()
  from public.categories where name = 'Lazer' and type = 'expense' $$,
  '23514', null, 'despesa no crédito sem cartão é recusada');
select throws_ok($$
  insert into public.transactions
    (type, amount_cents, transaction_date, category_id, payment_method, idempotency_key)
  select 'expense', 100, '2026-11-10', id, 'pix', gen_random_uuid()
  from public.categories where name = 'Lazer' and type = 'expense' $$,
  '23514', null, 'despesa no Pix sem conta é recusada');
select throws_ok($$
  insert into public.transactions
    (type, amount_cents, transaction_date, category_id, payment_method, account_id, idempotency_key)
  select 'expense', 100, '2026-11-10', id, 'pix', '00000000-0000-0000-0000-0000000000a1', gen_random_uuid()
  from public.categories where name = 'Salário' and type = 'income' $$,
  '23503', null, 'categoria de receita não entra em despesa');
select throws_ok($$
  insert into public.transactions
    (type, amount_cents, transaction_date, account_id, destination_account_id, idempotency_key)
  values ('transfer', 100, '2026-11-10', '00000000-0000-0000-0000-0000000000a1',
          '00000000-0000-0000-0000-0000000000a1', gen_random_uuid()) $$,
  '23514', null, 'transferência para a mesma conta é recusada');
select throws_ok($$
  insert into public.transactions
    (type, amount_cents, transaction_date, category_id, payment_method, account_id, idempotency_key)
  select 'expense', 0, '2026-11-10', id, 'pix', '00000000-0000-0000-0000-0000000000a1', gen_random_uuid()
  from public.categories where name = 'Lazer' and type = 'expense' $$,
  '23514', null, 'valor zero é recusado');

-- Nada de outra conta (critério 9)
select throws_ok($$
  insert into public.transactions
    (type, amount_cents, transaction_date, category_id, payment_method, account_id, idempotency_key)
  select 'expense', 100, '2026-11-10', id, 'pix', '00000000-0000-0000-0000-0000000000b1', gen_random_uuid()
  from public.categories where name = 'Lazer' and type = 'expense' $$,
  '23503', null, 'Ana não lança na conta de Bia');
select throws_ok($$
  insert into public.transactions
    (type, amount_cents, transaction_date, account_id, card_id, idempotency_key)
  values ('card_payment', 100, '2026-11-10', '00000000-0000-0000-0000-0000000000a1',
          '00000000-0000-0000-0000-0000000000b2', gen_random_uuid()) $$,
  '23503', null, 'Ana não paga a fatura do cartão de Bia');
select throws_ok($$
  insert into public.transactions
    (user_id, type, amount_cents, transaction_date, account_id, destination_account_id, idempotency_key)
  values ('00000000-0000-0000-0000-00000000000b', 'transfer', 100, '2026-11-10',
          '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a2', gen_random_uuid()) $$,
  '42501', null, 'Ana não lança em nome de Bia');

-- Duplicidade e imutáveis
select throws_ok($$
  insert into public.transactions
    (type, amount_cents, transaction_date, account_id, destination_account_id, idempotency_key)
  select 'transfer', 100, '2026-11-10', account_id, destination_account_id, idempotency_key
  from public.transactions where type = 'transfer' $$,
  '23505', null, 'a mesma chave de idempotência não grava duas vezes');
select throws_ok(
  $$ update public.transactions set type = 'income' where type = 'transfer' $$,
  '42501', null, 'o tipo da movimentação não muda');

-- Item em uso (critério 3)
select throws_ok(
  $$ delete from public.accounts where id = '00000000-0000-0000-0000-0000000000a1' $$,
  '23503', null, 'conta com lançamento não é excluída');
select throws_ok(
  $$ delete from public.categories where name = 'Alimentação' and type = 'expense' $$,
  '23503', null, 'categoria com lançamento não é excluída');

-- Visitante anônimo (critério 10)
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';

select throws_ok(
  'select * from public.transactions', '42501', null,
  'visitante anônimo não lê movimentações');

select * from finish();

rollback;
