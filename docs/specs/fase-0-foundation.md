# Fase 0 — Fundação: especificação e plano

Etapas A (specification) e B (planning) do §13 do SDD. Status: **aguardando aprovação**. A
implementação (etapa C) só começa com D-01 a D-10 aprovadas.

O plano abaixo assume as alternativas recomendadas em
[../decisions/README.md](../decisions/README.md). Se alguma for recusada, o plano é ajustado
antes de começar.

## A. Especificação

### Objetivo

Um projeto que roda localmente, passa no CI e publica um preview, pronto para receber a Fase 1.
Nenhuma funcionalidade de produto.

### Fora do escopo

- Qualquer tabela, tela ou regra de módulo (autenticação incluída).
- Projeto Supabase de produção, domínio e SMTP (Fase 8).
- Pastas de módulos que ainda não existem.

### Regras

- TypeScript `strict`; `any` proibido por lint.
- Nenhum segredo no repositório; `.env.example` só com nomes.
- Nenhum dado real; preview usa projeto Supabase separado.
- Versões fixadas no lockfile.

### Riscos

- **Compatibilidade entre versões novas** (R-18): TypeScript 7 com Next 16, ESLint 10 e
  shadcn/ui. Se alguma ferramenta recusar o TypeScript 7, usar a última 5.x e registrar em ADR.
- **`create-next-app` em pasta não vazia**: o gerador recusa diretórios com arquivos que
  conflitam. O scaffold é gerado em pasta temporária e movido para a raiz, preservando `docs/`.
- **CLI do Supabase desatualizada** (2.118 instalada, 3.3 disponível): atualizar antes do
  `supabase init`.

### Critérios de aceite

1. `pnpm dev` abre a página inicial em `http://localhost:3000`.
2. `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm test:e2e` terminam sem erro.
3. `supabase start` sobe o banco local e `supabase db reset` aplica as migrations (nenhuma ainda).
4. A aplicação falha na inicialização, com mensagem clara, se faltar variável de ambiente.
5. A resposta HTTP traz os headers de segurança definidos.
6. O CI roda em Pull Request e fica verde.
7. Um Preview Deployment da Vercel está publicado, protegido por login e ligado ao projeto
   Supabase de preview.
8. `SECURITY.md`, `LGPD.md` e `DATABASE.md` existem com o conteúdo inicial.

## B. Plano

### Pré-requisitos que dependem de você

| O quê                                                                               | Por quê                                                 |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Criar o repositório privado no GitHub e fazer os commits                            | Commits e pushes são sempre seus                        |
| Criar o projeto de preview no Supabase, região sa-east-1                            | Exige a sua conta                                       |
| Criar o projeto na Vercel, ligar ao repositório e cadastrar as variáveis de Preview | Exige a sua conta                                       |
| Atualizar a CLI do Supabase                                                         | Instalação de software na sua máquina                   |
| Opcional: instalar `gh` e `vercel`                                                  | Não estão instalados; dá para fazer tudo pelo navegador |

### Entregas, em ordem

Cada entrega é pequena, verificável e pode virar um commit.

| #    | Entrega                                                                                                                           | Verificação                                               |
| ---- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 0.1  | Scaffold Next.js 16 (App Router, `src/`, Tailwind 4, ESLint) com pnpm                                                             | `pnpm dev` abre; `pnpm build` conclui                     |
| 0.2  | TypeScript `strict` + `noUncheckedIndexedAccess`; regra de lint que proíbe `any`; Prettier; scripts `lint`, `typecheck`, `format` | Os três scripts passam; um `any` proposital quebra o lint |
| 0.3  | shadcn/ui inicializado; layout raiz em `pt-BR`; página inicial provisória com o nome do produto                                   | Página renderiza com um componente do shadcn              |
| 0.4  | `src/config/env.ts` validando as variáveis com Zod                                                                                | Teste unitário: variável ausente gera erro legível        |
| 0.5  | `supabase init`; clientes `lib/supabase/server.ts`, `browser.ts` e `proxy.ts`; `src/proxy.ts` só renovando a sessão               | `supabase start` e `supabase db reset` funcionam          |
| 0.6  | Vitest + Testing Library configurados                                                                                             | `pnpm test` roda o teste da 0.4 e um teste de componente  |
| 0.7  | Playwright configurado, com um teste de fumaça                                                                                    | `pnpm test:e2e`: a página inicial carrega                 |
| 0.8  | Headers de segurança em `next.config.ts`                                                                                          | E2E confere os headers na resposta                        |
| 0.9  | Workflow de CI: instalar, lint, typecheck, unitários, Supabase local + `db reset`, E2E                                            | Pull Request com CI verde                                 |
| 0.10 | `SECURITY.md`, `LGPD.md` (registro de fornecedores e de operações de tratamento), `DATABASE.md` (convenções); README atualizado   | Revisão                                                   |
| 0.11 | Projeto Vercel ligado, variáveis de Preview, proteção de deployment                                                               | Preview publicado e acessível só com login                |

`lib/supabase/admin.ts` e a chave secreta **não** entram na Fase 0: o primeiro uso é a exclusão
de conta, na Fase 1.

### Arquivos que serão criados

```
package.json, pnpm-lock.yaml, tsconfig.json, next.config.ts
eslint.config.mjs, .prettierrc, .prettierignore
postcss.config.mjs, components.json
vitest.config.ts, playwright.config.ts
src/app/layout.tsx, src/app/page.tsx, src/app/globals.css
src/components/ui/button.tsx          (primeiro componente do shadcn)
src/lib/utils.ts                      (gerado pelo shadcn)
src/config/env.ts
src/lib/supabase/server.ts, browser.ts, proxy.ts
src/proxy.ts
supabase/config.toml, supabase/seed.sql (vazio)
tests/unit/env.test.ts, tests/unit/home.test.tsx
tests/e2e/smoke.spec.ts
.github/workflows/ci.yml
docs/SECURITY.md, docs/LGPD.md, docs/DATABASE.md
```

Alterados: `README.md`, `.env.example`, `.gitignore`.

### Testes

- Unitário: validação de variáveis de ambiente.
- Componente: página inicial renderiza.
- E2E: página inicial carrega e traz os headers de segurança.
- Integração: sem alvo nesta fase; a estrutura e o passo do CI ficam prontos para a Fase 1.

### Complexidade

Baixa. O ponto de atenção é a compatibilidade das versões (R-18); o restante é configuração
conhecida. As entregas 0.9 e 0.11 dependem dos pré-requisitos acima.

## C. Implementação (2026-11-23)

Entregas 0.1 a 0.8 e 0.10 concluídas. Diferenças em relação ao plano:

- TypeScript 5.9 e ESLint 9, que são as versões fixadas pelo gerador do Next.js.
- Cache Components habilitado, por ser o padrão do Next.js 16. Gerou a decisão D-30 sobre a CSP.
- `src/instrumentation.ts` foi acrescentado para a validação de ambiente rodar na inicialização.
- `vercel.json` foi acrescentado para fixar a região `gru1` (D-04).
- `vite-tsconfig-paths` não foi usado: o Vite resolve os caminhos do `tsconfig` nativamente.
- `AGENTS.md` e `pnpm-workspace.yaml` vieram do gerador do Next.js.

## D. Validação (2026-11-23)

| Critério                                            | Resultado                                                              |
| --------------------------------------------------- | ---------------------------------------------------------------------- |
| 1. `pnpm dev` abre a página inicial                 | Verificado no navegador, sem erro no console                           |
| 2. lint, typecheck, testes unitários e E2E sem erro | Verificado: 5 testes unitários e 2 E2E                                 |
| 3. `supabase start` e `supabase db reset`           | Verificado com a CLI 2.118                                             |
| 4. Falha na inicialização sem variável de ambiente  | Verificado: o servidor não sobe e a mensagem nomeia as variáveis       |
| 5. Headers de segurança na resposta                 | Verificado por teste E2E contra o build de produção                    |
| 6. CI verde em Pull Request                         | **Não verificado**: o workflow está escrito, mas nunca rodou no GitHub |
| 7. Preview Deployment protegido                     | **Pendente**: depende dos projetos na Vercel e no Supabase             |
| 8. `SECURITY.md`, `LGPD.md` e `DATABASE.md`         | Escritos                                                               |

## E. Aprovação

Pendente. A fase só é considerada concluída com os critérios 6 e 7 atendidos.
