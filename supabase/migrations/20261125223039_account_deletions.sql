-- Fase 1, entrega 1.10: registro de exclusões de conta concluídas (D-14).
-- Não tem nenhuma ligação com o usuário excluído: só prova que uma exclusão aconteceu e quando.
-- Só o servidor grava, com a chave secreta.
create table public.account_deletions (
  id uuid primary key default gen_random_uuid(),
  completed_at timestamptz not null default now()
);

revoke all on public.account_deletions from anon, authenticated;

alter table public.account_deletions enable row level security;
