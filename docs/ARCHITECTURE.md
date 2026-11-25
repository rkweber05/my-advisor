# Arquitetura — Meu Advisor

Status: **D-01 a D-10 aplicadas na Fase 0; D-11 a D-15 e D-30 a D-33 aplicadas na Fase 1**. Os demais trechos marcados com `(D-xx)`
dependem de uma decisão pendente em [decisions/README.md](decisions/README.md) e descrevem a
alternativa recomendada. Requisitos em [SDD.md](SDD.md); justificativas em [ANALISE-SDD.md](ANALISE-SDD.md).

## 1. Princípios

1. **Isolamento por usuário em três camadas**: proxy, servidor e RLS. Nenhuma depende das
   outras para negar acesso.
2. **Regra de negócio em um lugar só**: o serviço do módulo. Interface, IA e WhatsApp são
   apenas entradas diferentes para o mesmo serviço.
3. **Cálculo financeiro determinístico**, em centavos inteiros, agregado no banco.
4. **O servidor é a fronteira de confiança.** Nada que vem do navegador ou da IA é aceito sem
   validação por schema.
5. **Só o necessário.** Pasta, tabela e abstração nascem na fase que precisa delas.

## 2. Visão geral

```
 Navegador (React, shadcn/ui)
        │  HTTPS, cookie de sessão httpOnly
        ▼
 ┌──────────────────────────── Next.js na Vercel (região gru1) ───────────────────────────┐
 │ proxy.ts            renova a sessão, redireciona quem não está logado                   │
 │                                                                                         │
 │ app/                Server Components (leitura) · Server Actions (mutações da UI)       │
 │                     Route Handlers (webhook, exportação, streaming da IA)               │
 │        │  requireUser() + validação Zod                                                 │
 │        ▼                                                                                │
 │ modules/<domínio>   service  → regras de negócio                                        │
 │                     repository → consultas, com o token do usuário                      │
 │        │                                        │                                       │
 └────────┼────────────────────────────────────────┼───────────────────────────────────────┘
          ▼                                        ▼
 Supabase (sa-east-1)                       AIProvider (porta)
 Auth · Postgres com RLS                    implementação do fornecedor escolhido (D-27)
```

## 3. Camadas e regra de dependência

| Camada  | Onde                      | Pode                                                         | Não pode                                                 |
| ------- | ------------------------- | ------------------------------------------------------------ | -------------------------------------------------------- |
| Entrada | `src/app/**`              | Autenticar, validar a entrada, chamar um serviço, renderizar | Conter regra de negócio, cálculo ou consulta ao banco    |
| Módulo  | `src/modules/<domínio>/`  | Regras, cálculos, consultas do seu domínio                   | Importar de `app/`; ler cookies ou `Request` diretamente |
| Base    | `src/lib/`, `src/config/` | Clientes Supabase, dinheiro, datas, segurança, env           | Conhecer qualquer módulo                                 |

Dependências só apontam para baixo: `app → modules → lib`. Um módulo pode usar o serviço público
de outro (o dashboard lê movimentações), nunca o repositório.

Dentro de um módulo:

```
modules/transactions/
├── schemas.ts        Zod: entrada de formulário e de API (compartilhado por cliente e servidor)
├── service.ts        regras de negócio; recebe o usuário já autenticado
├── repository.ts     consultas Supabase; única parte que conhece tabelas
├── actions.ts        Server Actions: requireUser → schema → service
├── components/       componentes específicos do domínio
└── types.ts
```

## 4. Estrutura de pastas (D-05)

```
meu-advisor/
├── docs/                     SDD, arquitetura, roadmap, segurança, LGPD, banco, decisões, specs
├── src/
│   ├── app/
│   │   ├── (auth)/           login, register, recuperação           (Fase 1)
│   │   ├── (dashboard)/      rotas privadas, uma pasta por tela     (a partir da Fase 1)
│   │   └── api/              só Route Handlers para consumidores externos
│   ├── components/           apenas compartilhados: ui/ (shadcn), layout/, charts/
│   ├── modules/              um diretório por domínio, criado na fase que o implementa
│   ├── lib/
│   │   ├── supabase/         server.ts, proxy.ts, admin.ts
│   │   ├── auth/             requireUser()
│   │   ├── money/            centavos, parse e formatação em BRL
│   │   ├── dates/            mês e "hoje" no fuso do perfil
│   │   └── security/         headers, rate limit, auditoria
│   ├── config/               env.ts (variáveis validadas por Zod)
│   └── proxy.ts
├── supabase/
│   ├── migrations/
│   ├── seed.sql              apenas dados fictícios
│   └── config.toml
├── tests/
│   ├── unit/                 Vitest
│   ├── integration/          Vitest contra o Supabase local (serviços, RLS)
│   └── e2e/                  Playwright
└── .github/workflows/        CI (D-08)
```

Diferenças em relação ao §3.1 do SDD: sai `src/services/`; saem as pastas de domínio de
`src/components/`; `lib/validations` vira `schemas.ts` de cada módulo; `src/types` só é criado
se surgir tipo realmente transversal.

## 5. Autenticação e autorização

| Camada                    | Responsabilidade                                                                                                             | Se falhar sozinha                     |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `proxy.ts`                | Renova o cookie de sessão; redireciona visitante para `/login`                                                               | As duas camadas seguintes ainda negam |
| Servidor: `requireUser()` | Valida o token junto ao Supabase Auth e devolve o usuário. Toda Server Action, Route Handler e página privada começa por ela | O RLS ainda nega                      |
| Banco: RLS                | `user_id = auth.uid()` em SELECT, INSERT, UPDATE e DELETE                                                                    | —                                     |

Regras:

- O `user_id` nunca vem do cliente. Vem do token, e no banco é `default auth.uid()`.
- Validar a sessão sempre com a chamada que verifica o token no servidor, nunca lendo o cookie
  sem verificação (R-06).
- Clientes Supabase:
  - `server.ts`: usa os cookies da requisição e age **como o usuário**. É o cliente padrão.
  - Não há cliente no navegador (D-32): toda autenticação passa por Server Action.
  - `admin.ts`: chave secreta, marcado `server-only`. Usos permitidos: exclusão de conta e
    rotina de retenção. Qualquer outro uso exige ADR.

## 6. Banco de dados

Convenções aplicadas a toda tabela com dado do usuário:

```sql
create table public.exemplo (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- colunas do domínio
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id)                      -- alvo das FKs compostas
);

alter table public.exemplo enable row level security;

create policy exemplo_select on public.exemplo for select to authenticated
  using ((select auth.uid()) = user_id);
create policy exemplo_insert on public.exemplo for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy exemplo_update on public.exemplo for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy exemplo_delete on public.exemplo for delete to authenticated
  using ((select auth.uid()) = user_id);
```

- **FK composta** entre tabelas do usuário:
  `foreign key (user_id, account_id) references accounts (user_id, id)`. Impede referência a
  registro de outro usuário (R-02).
- **Views** com `security_invoker = true`. Funções `SECURITY DEFINER` só com ADR (R-03).
- **Índices** por `(user_id, transaction_date)` e pelos filtros do histórico.
- **Migrations**: SQL versionado pelo Supabase CLI, uma por mudança, RLS na mesma migration que
  cria a tabela. Mudança destrutiva em dois passos (expandir, depois contrair), nunca automática.
- **Seed**: só dados fictícios, só em local e preview.

O esquema de cada tabela é definido na spec da fase correspondente e documentado em
`DATABASE.md`.

## 7. Dinheiro e datas

- **Dinheiro (D-16)**: centavos inteiros do banco à interface (`amount_cents bigint`). Na
  aplicação, um único módulo `lib/money` converte texto digitado ("150,50") em centavos, sem
  passar por ponto flutuante, e formata em BRL. Somas e médias são feitas no Postgres.
- **Datas**: `transaction_date` é `date`, sem hora. "Hoje" e os limites do mês são calculados no
  fuso do perfil (`America/Sao_Paulo` por padrão), nunca no fuso do servidor.
- **Moeda**: MVP somente em BRL.

## 8. Regras de contabilização (D-17, D-18, D-20, D-26)

| Tipo           | Origem → destino  | Entra em receita/despesa?  |
| -------------- | ----------------- | -------------------------- |
| `income`       | → conta           | Receita                    |
| `expense`      | conta ou cartão → | Despesa, na data da compra |
| `transfer`     | conta → conta     | Não                        |
| `card_payment` | conta → cartão    | Não (liquida a fatura)     |

- Indicadores somam apenas `income` e `expense` com status efetivado.
- Compra no crédito não altera o saldo da conta; o `card_payment` altera.
- Limitações conhecidas do MVP: sem parcelamento, sem entidade de fatura.

## 9. Validação e erros

- Um schema Zod por operação, usado no formulário (React Hook Form) e repetido no servidor. A
  validação do cliente é conveniência; a do servidor é a que vale.
- Serviços devolvem resultado tipado (`ok` ou erro de domínio). Erros inesperados são
  registrados no servidor e chegam ao usuário como mensagem genérica, sem detalhe interno.
- Logs técnicos não contêm valores financeiros, descrições nem texto de conversa (§6.4).

## 10. IA (Fase 5)

```ts
interface AIProvider {
  interpretTransaction(input): Promise<TransactionDraft>;
  classifyCategory(input): Promise<CategorySuggestion>;
  generateFinancialInsights(input): Promise<Insight[]>;
  answerFinancialQuestion(input): Promise<Answer>;
}
```

- A porta fica em `modules/advisor`; a implementação do fornecedor fica isolada atrás dela.
- O modelo não tem ferramentas nem acesso ao banco. Recebe a mensagem e o mínimo de contexto
  (nomes de categorias, contas e cartões) e devolve um objeto validado por schema.
- **Registro**: a IA devolve um rascunho → o servidor valida → o usuário revisa em um formulário
  pré-preenchido → o salvamento usa o mesmo serviço do lançamento manual (D-27).
- **Consulta**: o serviço determinístico calcula; a IA só escolhe a consulta e redige a
  resposta com os números que recebeu.
- Texto do usuário é dado, não instrução (AI-007): vai em campo separado do prompt de sistema e
  não altera permissões, porque a IA não tem nenhuma.

## 11. Segurança transversal

- **Segredos**: só em variáveis de ambiente, validadas na inicialização por `config/env.ts`.
  Prefixo `NEXT_PUBLIC_` apenas para URL e chave pública do Supabase.
- **Headers**: HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` e
  `Permissions-Policy`, em `next.config.ts`. A CSP leva um nonce por requisição e é montada em
  `src/proxy.ts` (D-30); detalhes em [SECURITY.md](SECURITY.md).
- **CSRF**: Server Actions já verificam a origem; Route Handlers com cookie verificam `Origin`
  e usam cookie `SameSite=Lax`.
- **Rate limiting (D-28)**: limites próprios do Supabase Auth em login e recuperação; limite
  por usuário no endpoint de IA.
- **Auditoria (D-15)**: tabela `audit_events`, somente inserção, com tipo de evento, data e
  id do registro afetado, sem valores.
- **Cache**: Cache Components está desligado (D-30) e toda página é renderizada por
  requisição, o que o layout raiz garante com `connection()`. Nenhum dado privado é guardado
  em cache.

## 12. Ambientes e deploy (D-02, D-03, D-04)

| Ambiente | Aplicação                          | Banco                                                      | Dados         |
| -------- | ---------------------------------- | ---------------------------------------------------------- | ------------- |
| Local    | `pnpm dev`                         | Supabase CLI em Docker                                     | Seed fictício |
| Preview  | Vercel Preview, protegido          | Projeto Supabase de preview (sa-east-1)                    | Seed fictício |
| Produção | Vercel Production, domínio próprio | Projeto Supabase de produção (sa-east-1), criado na Fase 8 | Reais         |

Pipeline de Pull Request (D-08): instalar → lint → typecheck → testes unitários → subir Supabase
local e aplicar todas as migrations → testes de integração → E2E críticos → Preview Deployment.
Produção só recebe mudança aprovada; migration de produção é aplicada manualmente após revisão.

## 13. Testes

| Tipo       | Ferramenta              | Cobre                                                              |
| ---------- | ----------------------- | ------------------------------------------------------------------ |
| Unitário   | Vitest                  | Regras de serviço, dinheiro, datas, schemas                        |
| Componente | Testing Library         | Formulários e estados de tela                                      |
| Integração | Vitest + Supabase local | Repositórios, serviços com banco real, **RLS com dois usuários**   |
| E2E        | Playwright              | Fluxos críticos: login, criar lançamento, isolamento visível na UI |

Todo teste usa dado fictício. Cada tabela nova traz o seu teste de acesso cruzado.

## 14. Convenções

- Código, banco e URLs em inglês; interface em pt-BR (D-10).
- TypeScript `strict`, `noUncheckedIndexedAccess`, `any` proibido por lint.
- Decisão arquitetural relevante vira ADR em `docs/decisions/`.
- Documentação é atualizada na mesma entrega que muda o comportamento.

## 15. Versões em uso

Fixadas em `pnpm-lock.yaml` no scaffold da Fase 0 (2026-11-23).

| Pacote                                | Versão       | Observação                                                   |
| ------------------------------------- | ------------ | ------------------------------------------------------------ |
| Node.js                               | 26 (local)   | CI em Node 24; Next 16 exige ≥ 20.9                          |
| next                                  | 16.4.6       | `proxy.ts` no lugar de `middleware.ts`; sem Cache Components |
| react                                 | 19.3         |                                                              |
| typescript                            | 5.9          | Versão fixada pelo gerador do Next.js                        |
| tailwindcss                           | 4.3          | Configuração em CSS, sem `tailwind.config.js`                |
| shadcn/ui                             | 4.23         | Estilo `base-nova`, sobre Base UI                            |
| zod                                   | 4.6          |                                                              |
| @supabase/supabase-js / @supabase/ssr | 2.119 / 0.12 |                                                              |
| supabase (CLI)                        | 2.118        | Há a 3.4; atualização pendente                               |
| vitest / @playwright/test             | 5.1 / 1.65   |                                                              |
| eslint / prettier                     | 9.39 / 3.10  | ESLint fixado pelo gerador do Next.js                        |
