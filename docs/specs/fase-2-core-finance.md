# Fase 2 — Núcleo financeiro: especificação e plano

Etapas A (specification) e B (planning) do §13 do SDD. Status: **spec e decisões aprovadas em
2026-11-25** ([ADR 0003](../decisions/0003-nucleo-financeiro.md)).

Requisitos em [../SDD.md](../SDD.md) (Módulos 03, 04 e 05; §5); produto em
[../../PRODUCT.md](../../PRODUCT.md); convenções em [../ARCHITECTURE.md](../ARCHITECTURE.md) §6
a §8.

## A. Especificação

### Objetivo

A pessoa registra receitas, despesas, transferências e pagamentos de fatura, organiza contas,
cartões e categorias, e consulta, corrige e apaga o que registrou. Tudo sem IA.

Até a Fase 5, o lançamento manual é o fluxo mais importante do produto: no celular, logo depois
do gasto, em poucos toques.

### Escopo

| Entra                                                    | Não entra                                          |
| -------------------------------------------------------- | -------------------------------------------------- |
| Categorias: padrão e personalizadas, editar, desativar   | Ícone e cor escolhidos pelo usuário                |
| Contas: criar, editar, desativar, saldo                  | Conciliação com extrato, Open Finance              |
| Cartões de crédito: criar, editar, desativar             | Fatura, limite disponível, parcelamento            |
| Receita, despesa, transferência e pagamento de fatura    | Lançamento recorrente (Fase 4)                     |
| Histórico com filtros e busca                            | Indicadores, gráficos e totais do mês (Fase 3)     |
| Edição e exclusão, com evento de auditoria               | Registro por frase (Fase 5), importação de arquivo |
| Proteção contra lançamento duplicado                     | Outra moeda além de BRL                            |
| Atalhos de lançamento na tela Início e item novo no menu | Exportação (Fase 6)                                |

### Regras de negócio

1. **Tipos de movimentação** (D-17, D-18): receita (`income`), despesa (`expense`),
   transferência entre contas próprias (`transfer`) e pagamento de fatura (`card_payment`).
2. **Só receita e despesa entram em indicadores.** Transferência e pagamento de fatura nunca
   contam como receita nem como despesa, e a interface diz isso na própria tela.
3. **Compra no cartão de crédito é despesa na data da compra.** O pagamento da fatura é outra
   movimentação, do tipo `card_payment`, que tira dinheiro da conta e não gera despesa.
4. **Valor** sempre positivo, em centavos inteiros (D-16), de R$ 0,01 a R$ 999.999.999,99. O
   sentido (entrada ou saída) vem do tipo, nunca do sinal.
5. **Data** obrigatória, sem hora. O padrão é hoje no fuso do perfil. Data futura é aceita e
   nasce com status pendente.
6. **Status** (D-20): `completed` ou `pending`. Saldo de conta soma só o que está `completed`.
7. **O que cada tipo exige**:

   | Tipo           | Categoria               | Forma de pagamento       | Conta                | Cartão      | Conta de destino |
   | -------------- | ----------------------- | ------------------------ | -------------------- | ----------- | ---------------- |
   | `expense`      | Obrigatória, de despesa | Obrigatória              | Exceto no crédito    | Só crédito  | —                |
   | `income`       | Obrigatória, de receita | Obrigatória, sem crédito | Obrigatória          | —           | —                |
   | `transfer`     | —                       | —                        | Obrigatória (origem) | —           | Obrigatória      |
   | `card_payment` | —                       | —                        | Obrigatória (origem) | Obrigatório | —                |

   A regra é garantida no banco, por restrição, e não só no formulário.

8. **Despesa no crédito** exige cartão e não tem conta. As demais formas de pagamento exigem
   conta (D-37). Cartão de débito é forma de pagamento ligada à conta (D-21).
9. **Transferência**: origem e destino são contas diferentes da mesma pessoa.
10. **Nada de outra conta.** Categoria, conta e cartão usados em uma movimentação pertencem à
    mesma pessoa. Garantido por chave estrangeira composta com `user_id`, além do RLS.
11. **Categorias** (D-19): toda conta nova recebe uma cópia das categorias padrão do SDD. Cada
    categoria é de receita ou de despesa, e isso não muda depois de criada. Nome único por
    pessoa e tipo, sem diferenciar maiúsculas.
12. **Desativar em vez de excluir** (D-23): categoria, conta ou cartão com movimentação não
    pode ser excluído, só desativado. Item desativado some das listas de escolha e continua
    aparecendo no histórico.
13. **Saldo da conta** (D-35) = saldo inicial + receitas − despesas pagas pela conta −
    transferências enviadas + transferências recebidas − pagamentos de fatura, só com
    movimentações `completed`. Compra no crédito não mexe em saldo de conta.
14. **Duplicidade** (D-22): cada abertura do formulário carrega uma chave única; o segundo envio
    com a mesma chave não cria outra movimentação. Além disso, se já existe lançamento com
    mesmo tipo, valor e data, a tela avisa e pede confirmação antes de gravar.
15. **Edição e exclusão**: a pessoa edita qualquer campo, menos o tipo (D-39). A exclusão é
    definitiva (D-36). As duas geram evento de auditoria com o tipo do evento e o id do
    registro, sem valor nem descrição.
16. **Cartão**: nunca são pedidos nem guardados número, CVV, validade ou senha. Só nome,
    instituição, bandeira, limite informado, dia de fechamento e dia de vencimento.

### Entidades

Todas seguem as convenções de [../DATABASE.md](../DATABASE.md): `id`, `user_id` com
`default auth.uid()`, `created_at`, `updated_at`, `unique (user_id, id)`, RLS com quatro
políticas e privilégios explícitos.

**`categories`**

| Coluna      | Tipo      | Regra                                            |
| ----------- | --------- | ------------------------------------------------ |
| `name`      | `text`    | De 1 a 40 caracteres; único por pessoa e tipo    |
| `type`      | `text`    | `income` ou `expense`; não muda depois de criada |
| `is_active` | `boolean` | Padrão `true`                                    |

O SDD lista `icon` e `color`; ficam fora até existir tela que os use.

**`accounts`**

| Coluna                  | Tipo      | Regra                                                  |
| ----------------------- | --------- | ------------------------------------------------------ |
| `name`                  | `text`    | De 1 a 40 caracteres; único por pessoa                 |
| `institution`           | `text`    | Opcional, até 40 caracteres                            |
| `account_type`          | `text`    | `checking`, `savings`, `cash`, `investment` ou `other` |
| `initial_balance_cents` | `bigint`  | Padrão 0; pode ser negativo                            |
| `is_active`             | `boolean` | Padrão `true`                                          |

**`cards`** (só cartão de crédito, D-21)

| Coluna               | Tipo       | Regra                                                       |
| -------------------- | ---------- | ----------------------------------------------------------- |
| `name`               | `text`     | De 1 a 40 caracteres; único por pessoa                      |
| `institution`        | `text`     | Opcional                                                    |
| `brand`              | `text`     | `visa`, `mastercard`, `elo`, `amex`, `hipercard` ou `other` |
| `credit_limit_cents` | `bigint`   | Opcional; maior que zero                                    |
| `closing_day`        | `smallint` | Opcional; de 1 a 31                                         |
| `due_day`            | `smallint` | Opcional; de 1 a 31                                         |
| `is_active`          | `boolean`  | Padrão `true`                                               |

O `account_id` que o SDD prevê em `cards` fica fora: a conta que paga a fatura é informada em
cada pagamento.

**`transactions`**

| Coluna                   | Tipo     | Regra                                                                               |
| ------------------------ | -------- | ----------------------------------------------------------------------------------- |
| `type`                   | `text`   | `income`, `expense`, `transfer` ou `card_payment`                                   |
| `amount_cents`           | `bigint` | Entre 1 e 99.999.999.999                                                            |
| `transaction_date`       | `date`   | Obrigatória                                                                         |
| `description`            | `text`   | Opcional, até 140 caracteres (D-37)                                                 |
| `category_id`            | `uuid`   | FK composta `(user_id, category_id, type)`: a categoria é da pessoa e do mesmo tipo |
| `payment_method`         | `text`   | `pix`, `cash`, `credit_card`, `debit_card`, `bank_transfer`, `boleto` ou `other`    |
| `account_id`             | `uuid`   | FK composta com `user_id`                                                           |
| `card_id`                | `uuid`   | FK composta com `user_id`                                                           |
| `destination_account_id` | `uuid`   | FK composta com `user_id`; diferente de `account_id`                                |
| `status`                 | `text`   | `completed` ou `pending`                                                            |
| `notes`                  | `text`   | Opcional, até 500 caracteres                                                        |
| `idempotency_key`        | `uuid`   | Única por pessoa                                                                    |

Uma restrição `check` aplica a tabela da regra 7. Índices: `(user_id, transaction_date desc, id)`
para o histórico, e por categoria, conta e cartão para os filtros e para a regra 12.

`audit_events` ganha os tipos `transaction_created`, `transaction_updated` e
`transaction_deleted`, e passa a usar `entity_type` e `entity_id`.

### Telas e rotas

Toda tela é desenhada primeiro para o celular. Antes de codificar, o desenho das telas é
aprovado pelo proprietário. O visual segue o [DESIGN.md](../../DESIGN.md), adotado em
2026-11-25; o fluxo parte das telas 1, 2 e 4 do esboço.

| Rota                   | O que faz                                            |
| ---------------------- | ---------------------------------------------------- |
| `/dashboard`           | Continua em estado vazio; aponta para o botão Lançar |
| `/transactions`        | Histórico do mês, com filtros, busca e troca de mês  |
| `/transactions/new`    | Formulário de lançamento; o tipo é escolhido no topo |
| `/transactions/[id]`   | Edição e exclusão                                    |
| `/settings/accounts`   | Contas, com saldo                                    |
| `/settings/cards`      | Cartões                                              |
| `/settings/categories` | Categorias, separadas em despesa e receita           |

- **Formulário de lançamento**: valor em primeiro lugar, com teclado numérico e máscara de
  reais; depois categoria, forma de pagamento e conta ou cartão, cada um já preenchido com o
  último usado; data preenchida com hoje. Descrição e observações ficam por último e são
  opcionais. Uma despesa repetida do dia a dia sai com valor, um toque na categoria e Salvar.
- **Menu**: no celular, a barra inferior passa a ter Início, Lançar e Lançamentos;
  Configurações vai para o topo.
- **Primeiro uso**: sem conta cadastrada, a tela de lançamento leva a criar a primeira conta e
  volta ao lançamento.
- **Estado vazio** em todas as listas.
- **Histórico**: mostra 50 por vez, do mais recente para o mais antigo, com "carregar mais".

### Limitações conhecidas do MVP

A interface não pode esconder nenhuma delas:

- **Sem parcelamento**: compra em 10 vezes entra inteira no mês da compra.
- **Sem fatura**: o sistema não sabe quanto do cartão está em aberto.
- **Uma moeda só**: BRL.

### Riscos

| Risco                                                                 | Mitigação                                                                                  |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Movimentação aponta para conta, cartão ou categoria de outra pessoa   | FK composta com `user_id` em cada vínculo; teste de integração tentando o cruzamento       |
| Valor perde precisão no caminho                                       | Centavos inteiros do banco à tela; um único módulo converte texto em centavos, sem `float` |
| Fatura ou transferência contada como despesa                          | Tipos próprios; teste unitário de cada regra de contabilização e do saldo de conta         |
| Lançamento duplicado por duplo toque ou reenvio                       | Chave de idempotência com restrição única; teste E2E de duplo envio                        |
| "Hoje" e o mês calculados no fuso do servidor                         | Módulo único de datas, que recebe o fuso do perfil; teste na virada de dia e de mês        |
| Busca por descrição injeta padrão no filtro                           | Texto do usuário tratado como literal na consulta; teste com `%` e `_`                     |
| Formulário lento no celular derruba o uso                             | Desenho aprovado antes do código; E2E do fluxo em viewport de celular, contando os passos  |
| Categorias padrão exigem mexer na única função com privilégio elevado | Decisão D-38; a função continua mínima e ganha teste próprio                               |
| Contas criadas na Fase 1 ficam sem categorias                         | A migration de categorias também preenche as contas existentes                             |
| Primeira fase com dado financeiro real                                | O cadastro continua fechado; `LGPD.md` e `SECURITY.md` atualizados na mesma fase           |

### Critérios de aceite

Cada critério é demonstrado por teste automático.

| #   | Critério                                                                                     | Requisito            |
| --- | -------------------------------------------------------------------------------------------- | -------------------- |
| 1   | Conta nova já tem as categorias padrão do SDD, de despesa e de receita                       | Módulo 05            |
| 2   | Pessoa cria, edita e desativa categoria, conta e cartão                                      | Módulos 04 e 05      |
| 3   | Item em uso não é excluído; desativado, some das escolhas e continua no histórico            | D-23                 |
| 4   | Pessoa registra receita e despesa; valor zero, negativo ou acima do limite é recusado        | TRANS-002, TRANS-004 |
| 5   | Despesa no crédito exige cartão; as demais exigem conta; o banco recusa combinação inválida  | Módulo 03            |
| 6   | Categoria de receita não é aceita em despesa, nem o contrário                                | TRANS-003            |
| 7   | Transferência e pagamento de fatura não aparecem como receita nem despesa                    | Regra financeira     |
| 8   | O saldo de cada conta bate com um conjunto fictício de valores conhecidos                    | D-35                 |
| 9   | Usuário A não lê, altera nem referencia categoria, conta, cartão ou movimentação de B        | TRANS-001, TRANS-008 |
| 10  | Visitante anônimo não lê nenhuma das tabelas novas; nenhuma tabela fica sem RLS              | SEC-003              |
| 11  | "150,50", "1.234,56" e "0,01" viram os centavos exatos; nenhum cálculo usa ponto flutuante   | TRANS-006            |
| 12  | Envio repetido do mesmo formulário grava uma movimentação só                                 | TRANS-007            |
| 13  | Lançamento igual a um já existente gera aviso antes de gravar                                | TRANS-007            |
| 14  | Pessoa edita e exclui movimentação; cada operação gera evento de auditoria sem valores       | TRANS-005, §6.4      |
| 15  | Histórico filtra por período, categoria, forma de pagamento e tipo, e busca por descrição    | Módulo 03            |
| 16  | "Hoje" e o mês do histórico seguem o fuso do perfil, inclusive na virada do mês              | L-09                 |
| 17  | Sem sessão, nenhuma Server Action da fase executa                                            | TRANS-008            |
| 18  | No celular, uma despesa é registrada informando só valor e categoria, depois do primeiro uso | Roadmap              |

## Decisões aprovadas

Alternativas e motivos de D-16 a D-23 em [../decisions/README.md](../decisions/README.md).

| ID   | Decisão                       | Recomendação                                                                                                                |
| ---- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| D-16 | Dinheiro                      | Centavos inteiros (`bigint`) do banco à tela. **Altera o §5 do SDD**, que pede `NUMERIC`                                    |
| D-17 | Transferência                 | Uma linha, com conta de origem e conta de destino                                                                           |
| D-18 | Pagamento de fatura           | Tipo `card_payment`, fora de receita e despesa; sem entidade de fatura                                                      |
| D-19 | Categorias padrão             | Copiadas para cada conta; toda categoria tem `user_id`. **Altera o §5 do SDD**                                              |
| D-20 | Status                        | `pending` e `completed`                                                                                                     |
| D-21 | Cartões                       | Coluna `brand`; `cards` é só crédito; débito é forma de pagamento ligada à conta                                            |
| D-22 | Duplicidade                   | Chave de idempotência e aviso de lançamento parecido                                                                        |
| D-23 | Exclusão de item em uso       | Bloquear e oferecer desativar                                                                                               |
| D-35 | Saldo por conta               | Mostrar na lista de contas já nesta fase. Alternativa: deixar para a Fase 3                                                 |
| D-36 | Exclusão de movimentação      | Definitiva, com evento de auditoria. Alternativa: lixeira com restauração                                                   |
| D-37 | Campos obrigatórios           | Valor, categoria, forma de pagamento e conta ou cartão. Descrição opcional. Alternativa: descrição obrigatória              |
| D-38 | Criação das categorias padrão | Na mesma função que já cria o perfil, a única com privilégio elevado. Alternativa: criar no primeiro acesso, pela aplicação |
| D-39 | Tipo da movimentação          | Não muda depois de criada; para trocar, exclui e lança de novo. Alternativa: permitir a troca                               |

Sobre a **D-37**: exigir conta em todo lançamento que não é de crédito obriga a pessoa a
cadastrar pelo menos uma conta antes do primeiro lançamento. Em troca, o saldo por conta fecha.
Depois do primeiro uso, o formulário já vem com a última conta escolhida.

Sobre a **D-38**: o ADR 0002 aprovou uma única função `SECURITY DEFINER`, com escopo mínimo.
Criar as categorias dentro dela amplia esse escopo: a função passa a inserir em duas tabelas. A
alternativa mantém a função como está, mas deixa a conta sem categorias se a pessoa nunca
passar pela tela que as cria.

## B. Plano

### Arquitetura

```
src/
├── app/(dashboard)/
│   ├── transactions/            page.tsx · new/page.tsx · [id]/page.tsx
│   └── settings/                accounts/ · cards/ · categories/
├── modules/
│   ├── categories/   schemas.ts · service.ts · repository.ts · actions.ts · components/
│   ├── accounts/     idem, mais balance.ts (regra do saldo)
│   ├── cards/        idem
│   └── transactions/ idem, mais rules.ts (regra 7) e filters.ts
└── lib/
    ├── money/        parse.ts · format.ts
    └── dates/        today.ts · month.ts
```

- Toda Server Action começa por `requireUser()`, valida com Zod e chama o serviço do módulo.
  Nenhum serviço recebe `user_id` do cliente.
- Somas ficam no Postgres. O saldo vem de uma view com `security_invoker = true`.
- Os tipos de movimentação que contam em indicadores ficam em uma constante única, usada pelo
  saldo e, na Fase 3, pelo dashboard.
- Formulários com `useActionState`, como na Fase 1.

### Banco de dados

Cinco migrations, cada uma com RLS, políticas e privilégios no mesmo arquivo:

1. `categories`, a criação das categorias padrão e o preenchimento das contas existentes.
2. `accounts`.
3. `cards`.
4. `transactions`, com as chaves compostas, a restrição da regra 7 e os índices.
5. Novos tipos em `audit_events` e a view de saldo.

Depois de cada uma, os tipos de `src/lib/supabase/database.types.ts` são gerados de novo.

### Testes

| Tipo       | O que cobre                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------- |
| Unitário   | `lib/money`, `lib/dates`, schemas, regra 7, regra do saldo                                        |
| Banco      | Políticas e privilégios de cada tabela; restrição da regra 7; chaves compostas; categorias padrão |
| Integração | Critérios 5, 6, 8, 9, 10 e 12, com dois usuários fictícios e um visitante anônimo                 |
| E2E        | Critérios 2, 3, 4, 7, 13, 14, 15, 17 e 18, no computador e em viewport de celular                 |

### Entregas, em ordem

Cada entrega termina com os testes passando e pode virar um commit.

| #    | Entrega                                                            | Verificação               |
| ---- | ------------------------------------------------------------------ | ------------------------- |
| 2.1  | `lib/money` e `lib/dates`                                          | Critérios 11 e 16         |
| 2.2  | Desenho das telas da fase com a skill `impeccable` (`shape`)       | Aprovação do proprietário |
| 2.3  | Categorias: migration, categorias padrão, tela                     | Critérios 1, 2, 9, 10     |
| 2.4  | Contas: migration, tela                                            | Critérios 2, 9, 10        |
| 2.5  | Cartões: migration, tela                                           | Critérios 2, 9, 10        |
| 2.6  | Movimentações: migration; receita e despesa; formulário no celular | Critérios 4, 5, 6, 18     |
| 2.7  | Transferência e pagamento de fatura; saldo por conta               | Critérios 7 e 8           |
| 2.8  | Histórico com filtros e busca                                      | Critério 15               |
| 2.9  | Edição e exclusão, com auditoria; desativar item em uso            | Critérios 3 e 14          |
| 2.10 | Duplicidade                                                        | Critérios 12 e 13         |
| 2.11 | Atalhos na tela Início, menu, estados vazios, revisão no celular   | Critérios 17 e 18         |
| 2.12 | Documentação: `DATABASE.md`, `SECURITY.md`, `LGPD.md`, ADR da fase | Revisão                   |

### O que depende de você

- Aprovar, na entrega 2.2, o desenho das telas.
- Confirmar o resultado do CI da Fase 1 no GitHub. Não consegui consultá-lo daqui.
- Na pasta nova: `pnpm install`, recriar o `.env.local` e reinstalar a skill `impeccable`, que
  não vieram na cópia.

### Complexidade

Grande. É a fase com mais tabelas e mais telas até aqui, e a primeira com dado financeiro. Os
pontos delicados são a restrição que amarra tipo, forma de pagamento, conta e cartão; as chaves
compostas; e o formulário de lançamento, que decide se o produto é usado no dia a dia.

## Desenho das telas (entrega 2.2)

Brief de desenho. Status: **aprovado pelo proprietário em 2026-11-25**. O visual segue
o [DESIGN.md](../../DESIGN.md). Respostas do proprietário em 2026-11-25: o formulário abre por
um botão Lançar na barra inferior; a categoria é escolhida em botões visíveis; depois de salvar,
a tela vai para Lançamentos.

Essas respostas mudam dois pontos da seção A: não há atalhos de lançamento na tela Início, e o
tipo da movimentação é escolhido no topo do formulário, não antes dele.

### 1. Quem chega e para quê

A pessoa acabou de gastar, está com o celular em uma mão e quer registrar antes de esquecer. O
sucesso é medido em toques: valor, categoria, Salvar. Tudo o mais já vem preenchido. As telas
de contas, cartões e categorias são visitadas poucas vezes, quase sempre no primeiro uso.

### 2. Navegação

- **Barra inferior** com três itens: Início, **Lançar** e Lançamentos. Lançar fica no centro,
  em destaque: botão cheio na cor de ação, com ícone de mais e o rótulo "Lançar".
- **Configurações** sai da barra e vira um ícone de engrenagem na faixa do topo. Contas,
  Cartões e Categorias são seções dentro de Configurações.
- **No computador**, a coluna lateral lista Início, Lançamentos e Configurações, com o botão
  Lançar no topo dela.

### 3. Formulário de lançamento (`/transactions/new`)

De cima para baixo:

1. **Tipo**: quatro opções em linha, Despesa (já marcada), Receita, Transferência e Fatura.
   Trocar o tipo troca os campos de baixo, sem sair da tela.
2. **Valor**: o maior elemento da tela, com foco automático e teclado numérico. A pessoa
   digita só números e a tela formata como reais ("1550" vira "R$ 15,50").
3. **Categoria** (despesa e receita): botões com o nome, as mais usadas primeiro. Um toque
   marca.
4. **Forma de pagamento** (despesa e receita): botões, com a última usada já marcada.
5. **Conta ou cartão**: botões, com o último usado já marcado. Com crédito marcado aparecem os
   cartões; com as outras formas, as contas.
6. **Data**: "Hoje" já preenchido; tocar abre o seletor de data do celular.
7. **Mais detalhes**, recolhido: descrição, observações e a opção "ainda não foi pago".
8. **Salvar**: botão largo, fixo no rodapé da tela, acima da barra de navegação.

- **Transferência** mostra conta de origem e conta de destino, com a frase "Não conta como
  despesa nem como receita."
- **Fatura** mostra o cartão e a conta que paga, com a frase "O pagamento da fatura não é uma
  nova despesa: as compras já foram lançadas."
- **Sem conta cadastrada**: no lugar dos botões de conta aparece "Cadastre uma conta para
  lançar", com o botão que leva ao cadastro e volta ao formulário com o valor preservado.
- **Lançamento parecido**: antes de gravar, um aviso no próprio formulário: "Já existe uma
  despesa de R$ 15,50 hoje. Lançar mesmo assim?", com Lançar mesmo assim e Cancelar.

### 4. Lançamentos (`/transactions`)

- **Mês** no topo, com setas para o anterior e o seguinte. Sem totais: indicadores são da
  Fase 3.
- **Busca** por descrição e um botão **Filtros**, que abre tipo, categoria e forma de
  pagamento. Filtro ativo aparece como etiqueta removível.
- **Lista agrupada por dia** ("Hoje", "Ontem", "23 de novembro"). Cada linha: categoria e
  descrição à esquerda, valor à direita em números tabulares, e embaixo a conta ou o cartão.
- **Como cada tipo aparece**: receita com sinal de mais e a cor de resultado positivo; despesa
  sem sinal e sem cor; transferência e fatura com ícone próprio e texto de apoio, em tom
  neutro. Pendente leva a etiqueta "Pendente".
- **Tocar na linha** abre a edição (`/transactions/[id]`): o mesmo formulário, sem a troca de
  tipo, com Salvar e, separado no fim, Excluir. Excluir pede confirmação na própria tela:
  "Excluir este lançamento? Não tem volta."
- **Depois de salvar**, o lançamento novo aparece no topo com a confirmação "Despesa de
  R$ 15,50 lançada."
- **Vazio**: "Nenhum lançamento em novembro.", com o botão Lançar.

### 5. Contas, cartões e categorias (em Configurações)

- **Contas**: lista com nome, instituição e saldo em números tabulares; saldo negativo na cor
  de resultado negativo, com o sinal. Formulário: nome, tipo, instituição e saldo inicial.
- **Cartões**: lista com nome, bandeira e dias de fechamento e vencimento. Formulário sem
  nenhum campo de número de cartão, com a frase "Não pedimos número, validade nem código."
- **Categorias**: duas listas, Despesa e Receita. Renomear na própria linha; criar no fim de
  cada lista.
- **Desativar** é uma chave em cada linha. Item desativado vai para o fim, esmaecido, com a
  etiqueta "Desativado". **Excluir** só aparece para item sem lançamento; para os demais, a
  tela explica: "Tem lançamentos. Dá para desativar, não para excluir."

### 6. Início

Continua em estado vazio, agora com uma frase que aponta para o botão Lançar. Os números do
mês chegam na Fase 3.

### 7. Estados e faixas

- Envio em andamento, erro de campo, erro geral e sessão encerrada seguem o padrão da Fase 1.
- Valor inválido: "Informe um valor maior que zero." Acima do limite: "O valor máximo é
  R$ 999.999.999,99."
- Nome de categoria, conta ou cartão com até 40 caracteres, sem estourar a linha no celular.
  Descrição com até 140; na lista, corta em uma linha.
- Até 30 categorias de um tipo cabem como botões sem rolagem horizontal; a lista quebra em
  linhas.
- Valores de R$ 0,01 a R$ 999.999.999,99 precisam caber na linha da lista em 360 px.

### 8. Restrições

- Celular primeiro, alvos de 44 px, WCAG 2.2 AA e nenhum estilo inline (CSP), como no
  [DESIGN.md](../../DESIGN.md).
- Botões de escolha são grupos de opção de verdade para o teclado e o leitor de tela, não só
  aparência.
- Limitações do MVP ficam à vista no formulário de cartão: "Compra parcelada entra inteira no
  mês da compra."

### 9. Fora do desenho

Totais e gráficos, parcelamento, fatura do cartão, ícone e cor por categoria, anexos e
lançamento recorrente.

## C. Implementação

Concluída localmente em 2026-11-25. O resultado do CI no GitHub não foi conferido por quem
implementou.

| #    | Entrega                            | Situação                            |
| ---- | ---------------------------------- | ----------------------------------- |
| 2.1  | Dinheiro e datas                   | Feita                               |
| 2.2  | Desenho das telas                  | Feita; brief aprovado em 2026-11-25 |
| 2.3  | Categorias                         | Feita                               |
| 2.4  | Contas                             | Feita                               |
| 2.5  | Cartões                            | Feita                               |
| 2.6  | Receita e despesa; formulário      | Feita                               |
| 2.7  | Transferência, fatura e saldo      | Feita                               |
| 2.8  | Histórico com filtros e busca      | Feita                               |
| 2.9  | Edição, exclusão e desativação     | Feita                               |
| 2.10 | Duplicidade                        | Feita                               |
| 2.11 | Navegação, estados vazios, celular | Feita                               |
| 2.12 | Documentação                       | Feita                               |

**Diferenças em relação ao plano e ao brief**

- **Sem `service.ts` em categorias, contas e cartões.** São cadastros sem regra própria: a
  Server Action valida e chama o repositório. Só `transactions` tem serviço.
- **Cadastros em uma tela só.** Cada linha de conta, cartão ou categoria abre a edição no
  próprio lugar; não há página por item. Renomear categoria também é assim, e não direto na
  linha.
- **Desativar é um botão** dentro da linha aberta, não uma chave.
- **Excluir aparece sempre**; para item em uso, o servidor recusa e a tela explica. O brief
  previa esconder o botão.
- **Cadastrar a primeira conta não preserva o valor digitado**: o formulário de lançamento só
  leva à tela de contas.
- **Confirmação depois de salvar**: "Lançamento gravado: despesa de R$ 15,50.", em vez de
  "Despesa de R$ 15,50 lançada.", para a frase servir aos quatro tipos.
- **Aviso de lançamento parecido** considera tipo, valor e data. A descrição ficou de fora
  porque é opcional.
- **Categorias no formulário**: as mais usadas primeiro, pelas últimas 200 receitas e despesas.
- **`cards` sem `account_id`** e **`categories` sem `icon` e `color`**, como previsto na seção A.
- **Busca e filtros ficam sempre visíveis** no topo do histórico, com Aplicar. No celular isso
  ocupa a primeira tela; recolher é um ajuste de desenho em aberto.

## D. Validação

Rodado localmente em 2026-11-25: formatação, lint e tipos sem erro; 133 testes unitários, 67
asserções pgTAP, 45 testes de integração e 70 execuções E2E (35 testes, no computador e em
viewport de celular).

| #   | Critério                                                 | Resultado | Onde                                                  |
| --- | -------------------------------------------------------- | --------- | ----------------------------------------------------- |
| 1   | Conta nova tem as categorias padrão                      | Atendido  | pgTAP                                                 |
| 2   | Cria, edita e desativa categoria, conta e cartão         | Atendido  | E2E                                                   |
| 3   | Item em uso não é excluído; desativado some das escolhas | Atendido  | E2E, pgTAP                                            |
| 4   | Registra receita e despesa; valor inválido é recusado    | Atendido  | E2E, integração, unitário                             |
| 5   | Crédito exige cartão; as demais exigem conta             | Atendido  | E2E, integração, pgTAP                                |
| 6   | Categoria de receita não entra em despesa                | Atendido  | Integração, pgTAP                                     |
| 7   | Transferência e fatura não aparecem como despesa         | Atendido  | E2E                                                   |
| 8   | Saldo bate com valores conhecidos                        | Atendido  | Integração, pgTAP, E2E                                |
| 9   | Nada de outra conta é lido, alterado ou referenciado     | Atendido  | Integração, pgTAP, E2E                                |
| 10  | Visitante anônimo não lê; nenhuma tabela sem RLS         | Atendido  | Integração, pgTAP                                     |
| 11  | Texto vira centavos exatos, sem ponto flutuante          | Atendido  | Unitário                                              |
| 12  | Envio repetido grava uma vez                             | Atendido  | Integração, pgTAP                                     |
| 13  | Lançamento parecido gera aviso                           | Atendido  | E2E                                                   |
| 14  | Edita e exclui, com auditoria sem valores                | Atendido  | E2E                                                   |
| 15  | Filtros e busca                                          | Atendido  | E2E, unitário                                         |
| 16  | "Hoje" e o mês seguem o fuso do perfil                   | Parcial   | Unitário das funções; sem E2E na virada do mês        |
| 17  | Sem sessão, nenhuma Server Action executa                | Parcial   | E2E só do lançamento; as demais por leitura do código |
| 18  | Despesa no celular só com valor e categoria              | Atendido  | E2E em viewport de celular                            |

**Critério 12**: a restrição única foi testada no banco e pela API. O duplo toque na tela não
tem teste E2E próprio.

**Não verificado**: CI no GitHub, preview, aparelho físico, leitor de tela, e o formato da data
em navegador configurado em português (o do teste está em inglês).

## E. Aprovação

Aprovada pelo proprietário em 2026-11-25, com os critérios 16 e 17 registrados como parciais. O
resultado do CI no GitHub ainda não foi conferido.
