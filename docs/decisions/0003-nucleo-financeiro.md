# ADR 0003 — Núcleo financeiro

- **Status:** aprovada
- **Data:** 2026-11-25
- **Decisões cobertas:** D-16 a D-23 e D-35 a D-39

## Contexto

A Fase 2 implementa categorias, contas, cartões e movimentações. As alternativas e os motivos
estão em [README.md](README.md); o plano está em
[../specs/fase-2-core-finance.md](../specs/fase-2-core-finance.md). O proprietário aprovou as
treze recomendações em conjunto, antes da implementação.

## Decisão

| ID   | Decisão                                                                                           |
| ---- | ------------------------------------------------------------------------------------------------- |
| D-16 | Dinheiro em centavos inteiros (`bigint`), do banco à tela                                         |
| D-17 | Transferência é uma linha, com conta de origem e conta de destino                                 |
| D-18 | Pagamento de fatura é o tipo `card_payment`, fora de receita e despesa; não há entidade de fatura |
| D-19 | Categorias padrão são copiadas para cada conta; toda categoria tem `user_id`                      |
| D-20 | Status `pending` e `completed`; só `completed` entra em saldo e em indicadores de realizado       |
| D-21 | `cards` tem `brand` e representa só cartão de crédito; débito é forma de pagamento ligada à conta |
| D-22 | Chave de idempotência por envio do formulário e aviso de lançamento parecido                      |
| D-23 | Categoria, conta ou cartão em uso não é excluído, só desativado                                   |
| D-35 | O saldo por conta aparece na lista de contas já na Fase 2                                         |
| D-36 | Exclusão de movimentação é definitiva, com evento de auditoria sem valores                        |
| D-37 | Obrigatórios: valor, categoria, forma de pagamento e conta ou cartão. Descrição é opcional        |
| D-38 | As categorias padrão são criadas pela função que já cria o perfil (`handle_new_user`)             |
| D-39 | O tipo da movimentação não muda depois de criada                                                  |

## Consequências esperadas

- **D-16 e D-19 alteram o §5 do SDD**: `NUMERIC` dá lugar a centavos inteiros, e não existem
  categorias globais com `user_id` nulo.
- **D-38 amplia o escopo da única função `SECURITY DEFINER`** aprovada no ADR 0002 (D-31): ela
  passa a inserir em `profiles` e em `categories`. Continua sem receber entrada do usuário além
  do nome, com `search_path` vazio, e ganha teste próprio. Não é criada uma segunda função com
  privilégio elevado.
- **D-37 exige uma conta cadastrada** antes do primeiro lançamento que não seja no crédito.
- **D-36**: exclusão por engano não tem volta.
- **D-18 e D-21**: o sistema não sabe quanto de cada cartão está em aberto. É limitação
  conhecida do MVP, junto com a falta de parcelamento.

## Consequências observadas

- **D-16**: o valor é digitado só com números e nunca vira fração: o formulário envia centavos
  inteiros. Saldo inicial e limite, digitados como "1.234,56", passam pelo conversor de
  `src/lib/money`.
- **D-19 e D-38**: as contas criadas na Fase 1 receberam as categorias pela própria migration.
  A função `handle_new_user` continua sendo a única `SECURITY DEFINER`; um teste falha se
  aparecer outra.
- **D-23**: o bloqueio é do banco. Excluir item em uso falha na chave estrangeira, e a tela
  traduz o erro.
- **D-37**: sem conta cadastrada, o formulário de lançamento mostra o caminho para cadastrar.
- **D-39**: o tipo fica fora dos privilégios de atualização da tabela; na edição, o servidor lê
  o tipo do banco e ignora o que vier do formulário.
- **D-22**: o aviso de lançamento parecido compara tipo, valor e data.
- **Privilégio por coluna em todas as tabelas novas**: pela API ninguém informa `user_id` nem
  `id`.
