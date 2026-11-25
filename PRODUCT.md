# Product

<!-- impeccable:product-schema 1 -->

Registro do produto para o trabalho de design. Os requisitos completos estão em
[docs/SDD.md](docs/SDD.md); este arquivo guarda só o que orienta decisões de interface. Origem
de cada fato: SDD v1.0 ou respostas do proprietário em 2026-11-24.

## Platform

web

## Users

O usuário principal é o próprio dono do projeto: uma pessoa que quer controlar as finanças
pessoais, em reais, no Brasil.

A situação mais comum de uso é **no celular, logo depois de um gasto**: registrar a movimentação
em poucos segundos, com uma frase ou poucos toques. O computador é usado em revisões ocasionais,
para olhar o dashboard, o planejamento e os relatórios.

A arquitetura é multiusuário, com isolamento completo entre contas, mas não há outros usuários
confirmados. O cadastro permanece fechado, por lista de e-mails, até a revisão jurídica (decisão D-12).

## Product Purpose

Centralizar receitas e despesas, mostrar a situação financeira do mês e ajudar a planejar. O
produto não deve só mostrar quanto foi gasto: deve ajudar a pessoa a entender a própria situação,
planejar melhor e decidir com mais consciência.

Sucesso, para o MVP: o usuário registra tudo o que gasta sem que isso vire um peso, confia nos
números do dashboard e sabe, a qualquer momento, quanto ainda pode gastar no mês.

## Positioning

O registro em linguagem natural. O usuário escreve "gastei 150 de gasolina no cartão Nubank" e o
sistema interpreta, mostra o que entendeu e só grava depois da confirmação. A inteligência
artificial interpreta e redige; todo cálculo financeiro é feito por regras determinísticas, a
partir dos lançamentos gravados.

## Operating Context

- Registro no momento do gasto, pelo celular: muitas vezes com uma mão, em pé, com pressa.
- Formas de pagamento brasileiras: Pix, dinheiro, cartão de crédito, cartão de débito,
  transferência bancária, boleto.
- Contas e cartões de várias instituições ao mesmo tempo (por exemplo Nubank, Inter, Itaú).
- Ciclo mensal: o mês é a unidade de orçamento, de comparação e de planejamento.
- Navegação principal definida no SDD: Dashboard, Meus lançamentos, Planejamento, Metas,
  Relatórios, Dicas do Advisor, Configurações.
- Evolução prevista: o mesmo registro por conversa pelo WhatsApp, com texto e áudio.

## Capabilities and Constraints

Capacidades previstas, por fase do roadmap ([docs/ROADMAP.md](docs/ROADMAP.md)): autenticação;
lançamentos, contas, cartões e categorias; dashboard; planejamento e metas; registro e consulta
por conversa; relatórios.

Restrições que a interface precisa respeitar:

- Idioma pt-BR, moeda BRL (`R$ 1.234,56`), fuso `America/Sao_Paulo`.
- Transferência entre contas próprias e pagamento de fatura não são receita nem despesa, e a
  interface precisa deixar isso evidente.
- Nada interpretado pela IA é gravado sem confirmação do usuário. Informação que não estava na
  mensagem é mostrada como ausente, nunca preenchida em silêncio.
- O Advisor não indica investimentos específicos, não promete rentabilidade e não apresenta
  estimativa como garantia.
- Nunca são pedidos nem guardados número completo de cartão, CVV, senha ou credencial bancária.
- Dado de demonstração é sempre identificado como fictício.
- Toda tela precisa de estado vazio, para conta sem movimentações.

Limitações do MVP que a interface não pode esconder: sem parcelamento, sem controle de fatura, só
uma moeda.

Em aberto: fórmula da "capacidade de investimento" (D-24), provedor de IA (D-27), abertura do
cadastro (D-12).

## Brand Commitments

- Nome: **Meu Advisor**.
- Posicionamento: "Seu dinheiro, sob controle."
- Tom de voz: **franco, sem suavizar**. O produto aponta o problema com clareza, mesmo quando
  incomoda ("Lazer estourou o orçamento em R$ 80"), sem elogio de cortesia e sem alarmismo.
- Estilo pedido no SDD §8.1, registrado como está: moderno, minimalista, profissional, inspirado
  em fintechs.
- Não há logotipo, paleta nem tipografia definidos.

## Evidence on Hand

- [docs/SDD.md](docs/SDD.md): especificação completa do produto.
- Esboço de quatro telas com dados fictícios, visto pelo proprietário em 2026-11-23:
  https://claude.ai/artifact/Xo6SCBqqvkATxrY75959aR. É um rascunho de direção, não um sistema
  visual aprovado.
- Não existem usuários, depoimentos, métricas de uso, casos de sucesso nem imprensa. Trabalho
  futuro não pode inventá-los.
- Os valores de exemplo do SDD (R$ 6.500, R$ 4.230, R$ 2.270, R$ 800) são ilustrativos.

## Product Principles

1. **Registrar tem que ser mais rápido que deixar para depois.** O caminho do gasto até o
   lançamento gravado, no celular, é o fluxo mais importante do produto.
2. **O número mostrado é sempre verdadeiro.** Sem dupla contagem, sem arredondamento escondido,
   sem estimativa vestida de fato.
3. **O usuário confirma; a máquina não decide por ele.** Interpretação automática é uma proposta.
4. **Dizer a verdade com clareza.** O produto informa a situação financeira como ela é.
5. **Privacidade antes de conveniência.** Pedir e mostrar só o dado necessário.

## Accessibility & Inclusion

WCAG 2.2 nível AA em todas as telas: contraste, navegação completa por teclado, compatibilidade
com leitor de tela e alvos de toque adequados ao uso no celular.
