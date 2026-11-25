# Análise do SDD v1.0

Data: 2026-11-23. Cobre os itens 1 a 5 da primeira missão (SDD §14): requisitos conflitantes ou
ausentes, avaliação da arquitetura, riscos e melhorias.

As referências `D-xx` apontam para as decisões em [decisions/README.md](decisions/README.md).
Nada aqui altera o SDD: são pontos a aprovar.

## 1. Resumo

O SDD é consistente no que mais importa: stack coerente, RLS desde a primeira migration,
cálculos determinísticos fora da IA, fases com critério de conclusão. Os problemas se
concentram em três lugares:

1. **Modelo financeiro incompleto.** Transferência, pagamento de fatura, status da
   movimentação e contribuição de meta não têm como ser representados no esquema do §5 sem
   dupla contagem ou perda de informação. São as decisões de maior impacto, porque migrar
   dado financeiro depois custa caro.
2. **Requisitos de segurança e LGPD sem lugar no esquema nem no roadmap.** Auditoria,
   consentimento, exclusão de conta e exportação de dados são exigidos, mas não têm tabela nem
   fase.
3. **Infraestrutura subentendida.** Banco dos previews, backups, e-mail transacional e rate
   limiting dependem de plano contratado e de fornecedores que o SDD não nomeia.

Nenhum desses pontos bloqueia a Fase 0, exceto os de ambiente (D-01 a D-10).

## 2. Requisitos conflitantes

| ID   | Onde                        | Conflito                                                                                                                                                                                                                                       | Encaminhamento                                                                   |
| ---- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| C-01 | §5.1 `profiles`             | Tem `id` e `user_id`; um dos dois é redundante.                                                                                                                                                                                                | D-11                                                                             |
| C-02 | Módulo 03 × §5.1            | "Transferência entre contas" exige origem e destino; `transactions` só tem um `account_id`.                                                                                                                                                    | D-17                                                                             |
| C-03 | Módulo 03 × §5.1            | O pagamento de fatura deve ser "liquidação", sem virar despesa, mas não existe tipo nem entidade para ele, e faturas ficam "para depois". `accounts.initial_balance` pressupõe saldo por conta, que só fecha se esse pagamento for registrado. | D-18                                                                             |
| C-04 | SEC-001 × §5.1 `categories` | "Toda entidade financeira deve possuir user_id" × categorias globais com `user_id` nulo. E "possibilidade de editar categorias" × categoria global, que o usuário não pode editar.                                                             | D-19                                                                             |
| C-05 | TRANS-006 × §5              | "Sem ponto flutuante" × `NUMERIC`: a API do Supabase devolve `numeric` como número JSON, que o JavaScript lê como `double`. O banco fica exato; a aplicação, não.                                                                              | D-16                                                                             |
| C-06 | AI-004 × fluxo do Módulo 08 | AI-004 pede confirmação só das movimentações ambíguas; o passo 7 do fluxo registra "após confirmação", sempre.                                                                                                                                 | D-27                                                                             |
| C-07 | §6.5 × §11                  | §6.5 fala em desenvolvimento, staging e produção; §11 define desenvolvimento, preview e produção.                                                                                                                                              | D-03                                                                             |
| C-08 | Módulo 04 × §5.1 `cards`    | "Bandeira" está no módulo e falta na tabela. "Cartão de débito" é forma de pagamento, mas `cards` só modela crédito (limite, fechamento, vencimento).                                                                                          | D-21                                                                             |
| C-09 | §8.3 × roadmap              | O dashboard (Fase 3) exibe Metas, Alertas e Recomendações, que só passam a existir nas Fases 4 e 5.                                                                                                                                            | Roadmap: cada widget entra na fase dona do dado                                  |
| C-10 | §3.1                        | `src/services/` × `src/modules/*`; `components/transactions` × `modules/transactions`; `lib/validations` × schemas do módulo. Dois lugares para a mesma coisa convidam à duplicação que o §2.6 proíbe.                                         | D-05                                                                             |
| C-11 | Módulo 02 × §2.6            | "Dados fictícios no ambiente de demonstração" × "não utilizar dados mockados em produção": não está dito se existe um ambiente de demonstração.                                                                                                | Proposta: dado fictício só em seed local e de preview; sem modo demo em produção |
| C-12 | §8.2 × §3.1                 | O menu não tem Contas, Cartões nem Categorias, mas as rotas existem.                                                                                                                                                                           | Proposta: ficam dentro de Configurações (confirmar na Fase 2)                    |
| C-13 | AUTH-005, §7.4 × §10        | Exclusão de conta e exportação de dados são exigidas, mas não constam nas atividades de nenhuma fase.                                                                                                                                          | D-14                                                                             |
| C-14 | §6.4, §7.3 × §5.1           | Auditoria e registro de consentimento são exigidos e não têm tabela.                                                                                                                                                                           | D-15                                                                             |

## 3. Requisitos ausentes ou indefinidos

| ID   | Lacuna                                                                                                                                                                             | Encaminhamento                                           |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| L-01 | `transactions.status` não tem valores nem efeito definido nos indicadores (DASH-005 depende disso).                                                                                | D-20                                                     |
| L-02 | "Capacidade de poupança" e "capacidade de investimento" não têm fórmula. No exemplo do Módulo 02, o saldo é R$ 2.270 e o investimento R$ 800, sem regra que ligue um ao outro.     | D-24                                                     |
| L-03 | Dívidas, compromissos financeiros e "reserva planejada" (Módulo 06) não têm entidade. `recurring_expenses` não tem data de término; `incomes.payment_date` deveria ser dia do mês. | D-25                                                     |
| L-04 | "Registrar contribuições" de meta não tem tabela, e não está definido se a contribuição é uma movimentação nem se conta como despesa.                                              | D-26                                                     |
| L-05 | TRANS-007 (evitar duplicação) não define o mecanismo.                                                                                                                              | D-22                                                     |
| L-06 | Parcelamento adiado: compra em 10x entra inteira no mês da compra e distorce o orçamento mensal.                                                                                   | Registrar como limitação conhecida do MVP                |
| L-07 | Faltam timestamps: `updated_at` em `categories`, `accounts`, `cards`; `created_at` e `updated_at` em `incomes`, `recurring_expenses`, `budgets`, `financial_goals`.                | Padronizar nas migrations                                |
| L-08 | `accounts.account_type` sem valores; `budgets` sem unicidade por usuário, categoria e mês; orçamento global do mês não previsto.                                                   | Specs das Fases 2 e 4                                    |
| L-09 | "Mês" precisa ser calculado no fuso do perfil; a Vercel roda em UTC.                                                                                                               | Arquitetura §7                                           |
| L-10 | O perfil tem `currency`, a movimentação não.                                                                                                                                       | Proposta: MVP só em BRL; coluna do perfil fica reservada |
| L-11 | Rate limiting sem infraestrutura: função serverless não guarda estado entre requisições.                                                                                           | D-28                                                     |
| L-12 | E-mail transacional: o SMTP padrão do Supabase Auth serve só para desenvolvimento. Produção exige SMTP próprio, que é mais um fornecedor para o §7.6.                              | D-13                                                     |
| L-13 | Cadastro aberto ou fechado? Confirmação de e-mail obrigatória?                                                                                                                     | D-12                                                     |
| L-14 | Banco usado pelos Preview Deployments não definido.                                                                                                                                | D-03                                                     |
| L-15 | Backups dependem do plano do Supabase.                                                                                                                                             | D-29                                                     |
| L-16 | Ferramenta de CI não nomeada.                                                                                                                                                      | D-08                                                     |
| L-17 | Provedor de IA, prazo de retenção das conversas e onde vive o rascunho "aguardando confirmação".                                                                                   | D-27                                                     |
| L-18 | Ferramenta de monitoramento de erros (mais um fornecedor).                                                                                                                         | D-29                                                     |
| L-19 | MFA não é mencionado, e o app guarda dado financeiro.                                                                                                                              | D-29                                                     |
| L-20 | Retenção configurável exige um agendador para a limpeza.                                                                                                                           | Spec da Fase 5                                           |
| L-21 | Comportamento ao excluir categoria, conta ou cartão em uso.                                                                                                                        | D-23                                                     |
| L-22 | Política de senha (tamanho mínimo, senha vazada).                                                                                                                                  | Spec da Fase 1                                           |

## 4. Avaliação da arquitetura proposta

**O que está certo e deve ser mantido**

- Next.js full-stack com Supabase é proporcional a um desenvolvedor e a um produto que começa
  com um usuário. Não há motivo para backend separado.
- RLS como barreira final, com autorização também no servidor (AUTH-006, SEC-005).
- Cálculo financeiro em serviço determinístico; a IA só interpreta e redige.
- `AIProvider` como porta independente de fornecedor.
- `transactions` como única fonte dos registros efetivos; recorrências são planejamento.
- Fases com critério de conclusão e aprovação entre elas.

**O que precisa de ajuste**

1. **Dono único por responsabilidade (D-05).** Cada módulo em `src/modules/<domínio>` passa a
   conter schemas, serviço, acesso a dados e componentes próprios. `src/services/` sai.
   `src/components/` fica só com o que é compartilhado (ui, layout, charts).
2. **Pastas criadas sob demanda.** O próprio SDD pede que a estrutura evolua "conforme a
   necessidade real". Dez pastas de módulo vazias na Fase 0 não ajudam; cada uma nasce na fase
   que a implementa.
3. **Fronteira de entrada explícita (D-07).** "Server Actions quando apropriado" é ambíguo.
   Proposta: Server Actions para toda mutação vinda da interface; Route Handlers apenas para
   consumidores que não são a interface (webhook do WhatsApp, download de exportação, streaming
   da IA). Os dois chamam o mesmo serviço do módulo.
4. **Dados só pelo servidor (D-06).** O navegador não consulta o Supabase diretamente. Reduz a
   superfície de ataque e mantém validação e auditoria em um caminho só. O RLS continua
   obrigatório, porque a chave pública permite acesso direto ao banco de qualquer forma.
5. **"Middleware" virou "proxy".** No Next.js 16 o arquivo é `proxy.ts`. A regra do SDD segue
   válida: ele renova a sessão e redireciona, e nunca é a única camada de autorização.

O resultado está em [ARCHITECTURE.md](ARCHITECTURE.md).

## 5. Riscos técnicos e de segurança

Ordenados por gravidade. Os seis primeiros podem expor dado financeiro de um usuário a outro.

| ID   | Risco                                                                                                                                                                                     | Mitigação                                                                                                                                                                                                         |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-01 | **Falha de isolamento por RLS**: tabela nova sem RLS, política ausente ou permissiva.                                                                                                     | RLS e as quatro políticas na mesma migration que cria a tabela. Teste automático que falha se existir tabela em `public` sem RLS. Teste de acesso cruzado com dois usuários para cada tabela (SEC-008).           |
| R-02 | **FK cruzando usuários**: o Postgres não aplica RLS ao validar chave estrangeira. O usuário A consegue gravar uma movimentação apontando para a conta do usuário B, se souber o id.       | Chaves estrangeiras compostas `(user_id, <id>)` entre tabelas do usuário.                                                                                                                                         |
| R-03 | **Views e funções que ignoram RLS**: view sem `security_invoker`, função `SECURITY DEFINER`.                                                                                              | Toda view com `security_invoker = true`. `SECURITY DEFINER` só com ADR.                                                                                                                                           |
| R-04 | **Vazamento da chave secreta** (antiga `service_role`): variável com prefixo `NEXT_PUBLIC_`, import em componente cliente.                                                                | Um único módulo `lib/supabase/admin.ts` marcado `server-only`. Checagem no CI: o nome da variável não pode aparecer fora dele.                                                                                    |
| R-05 | **Cache do Next.js servindo dado de um usuário a outro.**                                                                                                                                 | Rotas autenticadas sempre dinâmicas. Proibido cache compartilhado para dado privado.                                                                                                                              |
| R-06 | **Sessão aceita sem verificação** (ler o cookie sem validar o token).                                                                                                                     | Um único ponto de entrada, `requireUser()`, que valida o token no servidor. Nenhum serviço recebe `user_id` do cliente.                                                                                           |
| R-07 | **Dupla contagem**: fatura, transferência e contribuição de meta somadas como despesa.                                                                                                    | Tipos explícitos de movimentação; indicadores somam só receita e despesa; teste unitário para cada regra (D-17, D-18, D-26).                                                                                      |
| R-08 | **Erro de arredondamento** por ponto flutuante.                                                                                                                                           | D-16. Agregação sempre no Postgres.                                                                                                                                                                               |
| R-09 | **Virada de mês no fuso errado**: lançamento das 22h do dia 31 cai no mês seguinte.                                                                                                       | `transaction_date` do tipo `date`; "hoje" e "mês atual" calculados no fuso do perfil.                                                                                                                             |
| R-10 | **Prompt injection e valores inventados pela IA.**                                                                                                                                        | O modelo não tem ferramentas nem acesso ao banco: recebe texto e devolve um objeto validado por schema. Campo ausente volta nulo. Todo registro passa por confirmação do usuário e pelo mesmo serviço de criação. |
| R-11 | **Abuso e custo do endpoint de IA.**                                                                                                                                                      | Rate limit por usuário, limite de tamanho da mensagem, teto de gasto no provedor (D-28).                                                                                                                          |
| R-12 | **LGPD, transferência internacional**: Vercel, Supabase e provedor de IA processam fora do Brasil por padrão.                                                                             | Supabase e funções da Vercel em São Paulo (D-04). Registro de fornecedores em `LGPD.md`. Minimização do que vai para a IA.                                                                                        |
| R-13 | **Preview público ou apontando para produção.**                                                                                                                                           | Projeto Supabase separado para preview (D-03), variáveis por ambiente, proteção de deployment da Vercel ativa.                                                                                                    |
| R-14 | **Limites do plano gratuito**: projeto pausado por inatividade, sem backup gerenciado, SMTP limitado.                                                                                     | Aceitável até a Fase 7. Decidir plano antes de dado real (D-29). Conferir os limites na contratação.                                                                                                              |
| R-15 | **Migration destrutiva.**                                                                                                                                                                 | Nunca automática. Padrão expandir e contrair, com revisão manual e rollback descrito na própria migration.                                                                                                        |
| R-16 | **Enumeração de contas** em login e recuperação de senha.                                                                                                                                 | Mensagens genéricas ("se o e-mail existir, enviaremos...").                                                                                                                                                       |
| R-17 | **Escopo × um desenvolvedor**: nove módulos e oito fases.                                                                                                                                 | Entregas pequenas, corte explícito por fase, nada de adiantar fase.                                                                                                                                               |
| R-18 | **Stack em versões novas** (Next 16, Tailwind 4, Zod 4, TypeScript 7, ESLint 10): exemplos antigos não se aplicam, e a compatibilidade entre as ferramentas ainda precisa ser confirmada. | Validar no scaffold da Fase 0 e fixar versões no lockfile. Se o TypeScript 7 não for aceito por alguma ferramenta, usar a última 5.x e registrar.                                                                 |

## 6. Melhorias sugeridas

Além das decisões listadas, proponho:

1. **Regras de banco aplicadas por padrão**, para que a segurança não dependa de lembrar:
   `user_id uuid not null default auth.uid()`, o que tira o campo do alcance do frontend
   (SEC-006); gatilho único de `updated_at`; FKs compostas (R-02).
2. **Teste de "nenhuma tabela sem RLS" desde a Fase 1**, rodando no CI.
3. **Cadastro fechado até a Fase 8** (D-12). O §7.7 exige revisão jurídica antes da
   disponibilização pública; com cadastro aberto, um terceiro pode criar conta antes disso.
4. **Exclusão de conta já na Fase 1** (D-14). É simples enquanto só existe `profiles`, e cada
   fase seguinte só precisa garantir `on delete cascade`.
5. **Confirmação sempre obrigatória no registro por IA** (D-27), com rascunho sem estado no
   servidor: a IA devolve o formulário preenchido, o usuário revisa e salva pelo fluxo normal.
   Atende AI-001, AI-004 e AI-005 sem tabela de pendências.
6. **Documentação LGPD incremental.** `LGPD.md` nasce na Fase 0 com o registro de fornecedores e
   de operações de tratamento, e cada fase acrescenta os dados que passou a tratar. A Fase 8
   revisa, em vez de escrever tudo de uma vez.
7. **Limitações do MVP escritas no produto**: sem parcelamento, sem fatura, só BRL. Evita que a
   IA ou o dashboard prometam o que o modelo não sustenta.
