# Roadmap técnico — Meu Advisor

Detalha o §10 do SDD. Cada fase segue as etapas A a E do §13 (spec, plano, implementação,
validação, aprovação) e só começa com a anterior aprovada e com as suas decisões fechadas.

Status: **Fase 0 implementada localmente** (falta CI e preview); **Fase 1 implementada
localmente** em 2026-11-25, aguardando aprovação e o CI; **Fase 2 implementada localmente** em 2026-11-25; as demais fases
são proposta. Decisões `D-xx` em
[decisions/README.md](decisions/README.md).

## Visão geral

| Fase | Entrega                                     | Depende de            | Decisões a fechar antes  | Tamanho |
| ---- | ------------------------------------------- | --------------------- | ------------------------ | ------- |
| 0    | Fundação: projeto, ferramentas, CI, preview | —                     | D-01 a D-10              | P       |
| 1    | Autenticação, perfil, isolamento            | 0                     | D-11 a D-15              | M       |
| 2    | Núcleo financeiro                           | 1                     | D-16 a D-23, D-35 a D-39 | G       |
| 3    | Dashboard                                   | 2                     | —                        | M       |
| 4    | Planejamento e metas                        | 2 (3 para os widgets) | D-24 a D-26              | M       |
| 5    | Advisor IA                                  | 2, 3, 4               | D-27, D-28               | G       |
| 6    | Relatórios e exportação                     | 2                     | —                        | M       |
| 7    | WhatsApp                                    | 5                     | spec própria             | G       |
| 8    | Preparação para produção                    | todas                 | D-29                     | M       |

Tamanho é relativo (P, M, G), não é prazo.

**Ajustes em relação ao §10 do SDD**, todos sujeitos à aprovação:

- Exclusão de conta, auditoria e registro de consentimento entram na Fase 1 (C-13, C-14).
- Os widgets de Metas, Alertas e Recomendações do dashboard entram nas Fases 4 e 5 (C-09).
- Exportação dos dados do titular (LGPD §7.4) entra na Fase 6 e é pré-requisito para abrir o
  cadastro.
- A documentação de LGPD e segurança cresce a cada fase; a Fase 8 revisa.

**Prioridade de dispositivo** (aprovada em 2026-11-24, ver [PRODUCT.md](../PRODUCT.md)): o uso
principal é no celular, logo depois de um gasto. Toda tela é desenhada primeiro para o celular e
depois adaptada ao computador, que serve à revisão. O registro por conversa só chega na Fase 5;
até lá, o lançamento manual da Fase 2 é o fluxo mais importante do produto.

---

## Fase 0 — Fundação

Spec completa em [specs/fase-0-foundation.md](specs/fase-0-foundation.md).

**Entregas**: scaffold Next.js com TypeScript strict; Tailwind e shadcn/ui; lint e formatação;
Supabase local e clientes; variáveis de ambiente validadas; Vitest e Playwright com um teste de
fumaça cada; headers de segurança; CI; `SECURITY.md`, `LGPD.md` e `DATABASE.md` iniciais; projeto
na Vercel com preview protegido.

**Sem migrations de tabelas.** Nenhum módulo financeiro.

**Conclusão**: aplicação roda localmente, CI verde, preview publicado.

## Fase 1 — Autenticação e isolamento

Spec completa em [specs/fase-1-authentication.md](specs/fase-1-authentication.md).

**Entregas, em ordem**

1. Migration `profiles` com RLS e teste de acesso cruzado; teste "nenhuma tabela sem RLS".
2. `proxy.ts`, `requireUser()` e layout das rotas privadas.
3. Cadastro, login, logout, recuperação de senha (mensagens que não revelam se o e-mail existe).
4. Tela de perfil (nome, fuso).
5. `audit_events` e registro de login, logout e alteração de perfil.
6. Exclusão de conta: reautenticação, confirmação explícita, revogação de sessões, exclusão em
   cascata, registro de conclusão sem dado pessoal.
7. `consents`, se alguma base legal exigir consentimento (D-15).

**Testes**: unitários dos schemas; integração de RLS com dois usuários; E2E de cadastro, login,
rota privada sem sessão, sessão expirada, logout, recuperação (e-mail capturado pelo Supabase
local).

**Conclusão**: critérios de aceite do Módulo 01 e AUTH-001 a AUTH-006 demonstrados por teste.

## Fase 2 — Núcleo financeiro

Spec completa em [specs/fase-2-core-finance.md](specs/fase-2-core-finance.md), aprovada em
2026-11-25.

**Entregas, em ordem**

1. `lib/money` e `lib/dates` com testes unitários.
2. Categorias: migration, categorias padrão, CRUD.
3. Contas: migration, CRUD, ativar e desativar.
4. Cartões: migration, CRUD, ativar e desativar.
5. Movimentações: migration com FKs compostas e restrições de consistência (forma de pagamento
   × cartão × conta); criar receita e despesa. O formulário de lançamento é desenhado primeiro
   para o celular: valor em primeiro lugar, com teclado numérico; categoria e forma de pagamento
   com as opções mais usadas à mão; data preenchida com hoje.
6. Transferência e pagamento de fatura.
7. Histórico com filtros (categoria, período, forma de pagamento) e busca por descrição.
8. Edição e exclusão, com evento de auditoria.
9. Proteção contra duplicidade (D-22).

**Testes**: unitários de cada regra de contabilização (fatura e transferência não viram
despesa); integração de RLS e de FK cruzada por tabela; E2E de criar, editar, filtrar e excluir,
com o fluxo de criar despesa rodando também em viewport de celular.

**Conclusão**: TRANS-001 a TRANS-008 demonstrados; o usuário controla as movimentações sem IA e
registra uma despesa pelo celular em poucos toques.

## Fase 3 — Dashboard

**Entregas, em ordem**

1. Serviço de indicadores (receitas, despesas, saldo, por categoria, por forma de pagamento,
   comparação com o mês anterior), agregando no banco.
2. Filtro mensal e estado vazio.
3. Cards, gráfico de receitas × despesas, distribuição por categoria.
4. Principais gastos e últimas movimentações.

Ficam para depois: capacidade de poupança, metas e alertas (Fase 4); recomendações (Fase 5).

**Testes**: unitários e de integração dos indicadores com conjunto fictício de valores
conhecidos, incluindo virada de mês no fuso do perfil; E2E do filtro e do estado vazio.

**Conclusão**: DASH-001 a DASH-007 demonstrados; cada número da tela bate com o banco.

## Fase 4 — Planejamento e metas

**Entregas, em ordem**

1. Rendas e despesas recorrentes (configuração de planejamento, não geram movimentação).
2. Orçamento mensal por categoria e comparação planejado × realizado.
3. Metas e contribuições (D-26).
4. Capacidade de poupança e de investimento, com as fórmulas aprovadas (D-24).
5. Widgets de metas e alertas determinísticos no dashboard.

**Testes**: unitários de cada fórmula com os exemplos do SDD; integração de RLS; E2E do
planejamento do mês.

**Conclusão**: PLAN-001 a PLAN-005 demonstrados.

## Fase 5 — Advisor IA

**Entregas, em ordem**

1. Porta `AIProvider`, implementação do fornecedor escolhido e implementação falsa para testes.
2. Schema do rascunho de movimentação e interpretação de texto.
3. Tela de conversa com revisão e confirmação do rascunho.
4. Rate limit, limite de tamanho e teto de gasto.
5. Consultas ("quanto gastei este mês?") sobre os serviços determinísticos.
6. Recomendações e widget no dashboard.
7. Histórico de conversa com retenção e rotina de limpeza.

**Testes**: unitários com o provedor falso (campo ausente volta nulo, nunca inventado);
conjunto de mensagens de injeção de prompt; integração de RLS de `ai_conversations`; E2E do
registro por conversa.

**Conclusão**: AI-001 a AI-007 demonstrados. `LGPD.md` atualizado com o provedor de IA.

## Fase 6 — Relatórios

**Entregas**: relatórios mensais e comparação anual; filtros avançados; exportação CSV e PDF;
exportação completa dos dados do titular.

**Conclusão**: números iguais aos do dashboard para o mesmo período; arquivos gerados só com
dados do próprio usuário.

## Fase 7 — WhatsApp

**Entregas**: vínculo verificado entre número e conta; webhook com validação de assinatura e
idempotência; texto, depois áudio com transcrição; confirmação da movimentação pela conversa;
monitoramento.

Requer spec própria antes de começar: muda o modelo de autenticação e acrescenta um fornecedor.

## Fase 8 — Preparação para produção

**Entregas**: revisão de segurança e de LGPD; testes de carga; backup e teste de restauração;
monitoramento de erros sem dado pessoal; Política de Privacidade, Termos de Uso e Política de
Retenção revisados juridicamente; projeto de produção, domínio e SMTP; plano de resposta a
incidentes; avaliação de MFA e de RIPD.

**Conclusão**: todos os itens críticos aprovados. Só então o cadastro pode ser aberto.
