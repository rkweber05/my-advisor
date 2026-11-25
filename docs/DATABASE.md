# Banco de dados — Meu Advisor

Convenções, fluxo de migrations e esquema atual. Desenho geral em
[ARCHITECTURE.md §6](ARCHITECTURE.md).

Última atualização: Fase 1 implementada localmente (2026-11-25).

## Esquema atual

### `profiles`

Perfil do usuário. Migration `20261125114501_profiles.sql`.

| Coluna       | Tipo          | Regra                                                           |
| ------------ | ------------- | --------------------------------------------------------------- |
| `id`         | `uuid`        | Chave primária e FK para `auth.users (id)`, `on delete cascade` |
| `name`       | `text`        | Obrigatório, de 1 a 80 caracteres, não pode ser só espaços      |
| `currency`   | `text`        | Padrão `BRL`; só `BRL` é aceito                                 |
| `timezone`   | `text`        | Padrão `America/Sao_Paulo`; precisa ser um nome de fuso IANA    |
| `created_at` | `timestamptz` | Padrão `now()`                                                  |
| `updated_at` | `timestamptz` | Mantido pelo gatilho `set_updated_at()`                         |

- **Foge à convenção de `user_id`** de propósito (D-11): a chave é o próprio `auth.users.id`.
- **RLS**: SELECT e UPDATE só da própria linha. Sem política de INSERT nem de DELETE.
- **Privilégios**: `anon` não tem nenhum. `authenticated` tem SELECT e UPDATE apenas das colunas
  `name` e `timezone`; `id`, `currency` e as datas não são alteráveis pela API.
- **Criação**: o gatilho `on_auth_user_created` em `auth.users` chama `handle_new_user()`, que
  insere o perfil com o nome informado no cadastro. Sem nome válido, a conta não é criada.
  É a única função `SECURITY DEFINER` do projeto (ADR 0002, D-31).

### `audit_events`

Registro de auditoria (D-15). Migration `20261125223037_audit_events.sql`.

| Coluna        | Tipo          | Regra                                                                                         |
| ------------- | ------------- | --------------------------------------------------------------------------------------------- |
| `id`          | `uuid`        | Chave primária                                                                                |
| `user_id`     | `uuid`        | `default auth.uid()`, FK para `auth.users`, `on delete cascade`                               |
| `event_type`  | `text`        | Um de: `login`, `logout`, `profile_updated`, `password_changed`, `account_deletion_requested` |
| `entity_type` | `text`        | Opcional; usado a partir da Fase 2                                                            |
| `entity_id`   | `uuid`        | Opcional; usado a partir da Fase 2                                                            |
| `created_at`  | `timestamptz` | Padrão `now()`                                                                                |

- **RLS**: SELECT e INSERT só do próprio usuário. Sem UPDATE nem DELETE.
- **Privilégios**: `authenticated` lê e insere informando só `event_type`, `entity_type` e
  `entity_id`; `user_id` e `created_at` vêm sempre dos padrões.
- Índice em `(user_id, created_at)`.

### `signup_allowlist`

E-mails autorizados a criar conta (D-12). Migration `20261125223038_signup_allowlist.sql`.
Colunas: `email` (chave primária, sempre em minúsculas) e `created_at`.

- **RLS**: uma política, de leitura, para o papel `supabase_auth_admin`. `anon` e
  `authenticated` não têm nenhum privilégio.
- É mantida pelo proprietário direto no banco:

```sql
insert into public.signup_allowlist (email) values ('pessoa@exemplo.com');
```

### `account_deletions`

Uma linha por exclusão de conta concluída (D-14): `id` e `completed_at`, sem ligação com a
pessoa. Migration `20261125223039_account_deletions.sql`. RLS habilitado, nenhuma política e
nenhum privilégio para `anon` e `authenticated`: só o servidor grava, com a chave secreta.

### Funções

| Função                            | Uso                                                                                                 |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| `set_updated_at()`                | Gatilho único de `updated_at`, para toda tabela que tem a coluna                                    |
| `is_valid_timezone(text)`         | Restrição de `profiles.timezone`                                                                    |
| `handle_new_user()`               | Gatilho de criação de perfil; `SECURITY DEFINER`                                                    |
| `hook_before_user_created(jsonb)` | Gancho do Supabase Auth: recusa e-mail fora de `signup_allowlist`; só `supabase_auth_admin` executa |

## Ambiente local

O banco de desenvolvimento roda em Docker pela CLI do Supabase (Postgres 17).

```bash
supabase start        # sobe o banco e aplica todas as migrations
supabase status       # mostra URLs e chaves locais
supabase db reset     # recria o banco, reaplica migrations e o seed
supabase stop         # para os containers
```

Os valores de `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e
`SUPABASE_SECRET_KEY` do `.env.local` vêm de `supabase status`.

## Testes

```bash
pnpm test:db            # pgTAP: supabase/tests/database/*.test.sql
pnpm test:integration   # Vitest contra o Supabase local: tests/integration/
```

- **pgTAP** confere estrutura, políticas e privilégios dentro do banco. `00_rls.test.sql` falha
  se existir tabela em `public` sem RLS.
- **Integração** confere o mesmo pela API, como o navegador ou um atacante fariam: dois usuários
  fictícios e um visitante anônimo. Os usuários usam e-mail `@example.test` e são apagados ao
  fim. O apoio (`tests/integration/helpers/supabase.ts`) recusa rodar fora do Supabase local.
- Toda tabela nova ganha um arquivo de cada tipo na mesma entrega.

## Migrations

- Uma migration por mudança, criada com `supabase migration new <nome>`, em
  `supabase/migrations/`.
- Nunca editar migration já aplicada em preview ou produção: criar uma nova.
- A migration que cria uma tabela também habilita o RLS, cria as políticas e concede só os
  privilégios necessários (`revoke all` de `anon` e `authenticated`, depois `grant` explícito).
- Mudança destrutiva (remover ou renomear coluna, mudar tipo) é feita em dois passos, expandir e
  depois contrair, com o rollback descrito em comentário no topo do arquivo. Nunca é aplicada
  automaticamente em produção.
- O CI sobe o banco do zero e aplica todas as migrations em cada Pull Request.

## Convenções de tabela

- Chave primária `id uuid default gen_random_uuid()`.
- `user_id uuid not null default auth.uid() references auth.users (id) on delete cascade`.
- `created_at` e `updated_at` (`timestamptz`), com gatilho único para `updated_at`.
- `unique (user_id, id)` em toda tabela do usuário, para servir de alvo às chaves estrangeiras
  compostas `(user_id, <outra>_id)`. Isso impede referência a registro de outro usuário.
- Políticas RLS separadas para SELECT, INSERT, UPDATE e DELETE, todas com
  `(select auth.uid()) = user_id`.
- Views com `security_invoker = true`. `SECURITY DEFINER` exige ADR.
- Datas de movimentação em `date`; valores em centavos inteiros (proposta D-16, a aprovar na
  Fase 2).
- Nomes de tabelas e colunas em inglês, `snake_case`.

## Autenticação local

`supabase/config.toml` define, para o ambiente local e o CI: confirmação de e-mail obrigatória,
senha mínima de 12 caracteres, o gancho de cadastro, os modelos de e-mail em pt-BR
(`supabase/templates/`) e limites de tentativa ampliados para os testes. Os e-mails enviados
localmente ficam na caixa do Mailpit, em `http://127.0.0.1:54324`.

No projeto real, as mesmas opções são aplicadas pelo painel do Supabase; os limites de tentativa
ficam nos padrões do serviço.

## Tipos

`src/lib/supabase/database.types.ts` é gerado a partir do banco local. Depois de toda migration:

```bash
supabase gen types typescript --local > src/lib/supabase/database.types.ts
pnpm format
```

## Seed

`supabase/seed.sql` contém apenas dados fictícios e só roda em ambiente local e de preview.
Inclui um e-mail fictício na lista de autorizados.
