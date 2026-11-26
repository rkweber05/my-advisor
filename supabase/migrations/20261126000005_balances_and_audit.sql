-- Fase 2, entregas 2.7 e 2.9: saldo por conta (D-35) e auditoria de movimentações (D-36).

-- Saldo = saldo inicial + receitas + transferências recebidas − tudo o que saiu da conta
-- (despesas pagas por ela, transferências enviadas e pagamentos de fatura). Só entra o que
-- está `completed`. Compra no crédito não tem conta e não mexe em saldo.
-- `security_invoker`: a view respeita o RLS de quem consulta.
create view public.account_balances
with (security_invoker = true)
as
select
  a.id as account_id,
  a.user_id,
  (
    a.initial_balance_cents
    + coalesce(
      (
        select sum(
          case
            when t.type = 'income' then t.amount_cents
            when t.type = 'transfer' and t.destination_account_id = a.id then t.amount_cents
            else -t.amount_cents
          end
        )
        from public.transactions t
        where t.user_id = a.user_id
          and t.status = 'completed'
          and (t.account_id = a.id or t.destination_account_id = a.id)
      ),
      0
    )
  )::bigint as balance_cents
from public.accounts a;

revoke all on public.account_balances from anon, authenticated;
grant select on public.account_balances to authenticated;

alter table public.audit_events drop constraint audit_events_event_type_check;
alter table public.audit_events add constraint audit_events_event_type_check check (
  event_type in (
    'login',
    'logout',
    'profile_updated',
    'password_changed',
    'account_deletion_requested',
    'transaction_created',
    'transaction_updated',
    'transaction_deleted'
  )
);
