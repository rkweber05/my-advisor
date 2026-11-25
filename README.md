# Meu Advisor

Gestão financeira pessoal com registro de movimentações em linguagem natural.
_Seu dinheiro, sob controle._

## Status

**Fase 0 (fundação) implementada localmente**; faltam o repositório no GitHub, o primeiro CI e o
Preview Deployment na Vercel para ela ser concluída.

**Fase 1 (autenticação) implementada localmente**: cadastro fechado por lista de e-mails, login,
logout, recuperação de senha, perfil, auditoria e exclusão de conta. Faltam a aprovação do
proprietário e o CI. Ainda não há funcionalidade financeira.

## Como rodar

Requisitos: Node.js 24 ou mais recente, pnpm, Docker e a CLI do Supabase.

```bash
pnpm install
supabase start          # banco local; mostra a URL e a chave pública
cp .env.example .env.local   # preencha com os valores de `supabase status`
pnpm dev
```

| Comando                 | O que faz                                          |
| ----------------------- | -------------------------------------------------- |
| `pnpm dev`              | Servidor de desenvolvimento                        |
| `pnpm lint`             | ESLint                                             |
| `pnpm typecheck`        | Gera os tipos de rota e roda o TypeScript          |
| `pnpm format`           | Prettier                                           |
| `pnpm test`             | Testes unitários (Vitest)                          |
| `pnpm test:db`          | Testes de banco (pgTAP); exige `supabase start`    |
| `pnpm test:integration` | Testes de integração contra o Supabase local       |
| `pnpm test:e2e`         | Testes E2E (Playwright) contra o build de produção |

Na primeira vez, instale o navegador dos testes E2E com `pnpm exec playwright install chromium`.

## Documentação

| Documento                                                                  | Conteúdo                                                   |
| -------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [docs/SDD.md](docs/SDD.md)                                                 | Especificação do produto (fonte de verdade dos requisitos) |
| [docs/ANALISE-SDD.md](docs/ANALISE-SDD.md)                                 | Conflitos, lacunas, riscos e melhorias encontrados no SDD  |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)                               | Arquitetura proposta                                       |
| [docs/ROADMAP.md](docs/ROADMAP.md)                                         | Roadmap técnico por fase                                   |
| [docs/decisions/README.md](docs/decisions/README.md)                       | Decisões pendentes e aprovadas                             |
| [docs/specs/fase-0-foundation.md](docs/specs/fase-0-foundation.md)         | Especificação e plano da Fase 0                            |
| [docs/specs/fase-1-authentication.md](docs/specs/fase-1-authentication.md) | Especificação, plano e andamento da Fase 1                 |
| [PRODUCT.md](PRODUCT.md)                                                   | Registro do produto para o trabalho de design              |

Também: [docs/SECURITY.md](docs/SECURITY.md), [docs/LGPD.md](docs/LGPD.md) e
[docs/DATABASE.md](docs/DATABASE.md).

## Como o trabalho avança

Uma fase por vez, cada uma com especificação, plano, implementação, validação e aprovação
(SDD §13). Nenhuma fase começa com decisão pendente que a bloqueie.

## Estrutura

```
docs/                  documentação
src/app/               rotas e layout (App Router)
src/components/ui/     componentes do shadcn/ui
src/config/env.ts      variáveis de ambiente validadas
src/lib/supabase/      clientes do Supabase (servidor, navegador, proxy)
src/proxy.ts           renova a sessão a cada requisição
supabase/              configuração local, migrations e seed
tests/                 unit, integration, e2e
.github/workflows/     CI
```

Os módulos de domínio (`src/modules/`) são criados na fase que os implementa.
# my-advisor
