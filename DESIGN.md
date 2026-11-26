# Design

Identidade visual e Design System do Meu Advisor. Adotada pelo proprietário em 2026-11-25, a
partir do documento "Implementação da Identidade Visual e Design System", com quatro ajustes
aprovados: variantes escuras das cores semânticas para texto, esmeralda mais escuro nos botões,
borda própria para campos e uma seção de celular.

Substitui o visual do esboço (verde-azulado e Inter) usado na Fase 1. O que o produto é e para
quem está em [PRODUCT.md](PRODUCT.md); este arquivo só trata da aparência.

## Conceito

Fintech premium: sóbria, minimalista, com hierarquia clara e números fáceis de ler. Tema claro.
Sem gradiente, sem sombra forte, sem elemento decorativo sem função.

O escopo do produto continua sendo o do SDD: controle de receitas e despesas. A identidade não
acrescenta funcionalidade de investimento.

## Onde ficam os tokens

Tudo em `src/app/globals.css`: os valores no bloco `:root`, e a exposição ao Tailwind no bloco
`@theme inline`. Nenhum componente declara cor em hexadecimal; usa a classe do token
(`bg-brand`, `text-danger-strong`, `shadow-card`).

## Cores

### Marca e superfícies

| Token                | Valor     | Classe                   | Uso                                           |
| -------------------- | --------- | ------------------------ | --------------------------------------------- |
| `--brand`            | `#14263D` | `bg-brand`, `text-brand` | Navegação lateral, cabeçalho no celular, nome |
| `--brand-secondary`  | `#233E5C` | `bg-brand-secondary`     | Item ativo da navegação lateral               |
| `--brand-muted`      | `#B4C0D0` | `text-brand-muted`       | Texto inativo sobre a cor da marca            |
| `--brand-active`     | `#5FD6AE` | `text-brand-active`      | Ícone ativo e foco sobre a cor da marca       |
| `--accent-brand`     | `#0F8B6D` | —                        | Esmeralda oficial; só marcador e gráfico      |
| `--background`       | `#F4F6F9` | `bg-background`          | Fundo da aplicação                            |
| `--card`             | `#FFFFFF` | `bg-card`                | Cards, formulários, tabelas, barra inferior   |
| `--foreground`       | `#172033` | `text-foreground`        | Títulos e informação principal                |
| `--muted-foreground` | `#586579` | `text-muted-foreground`  | Informação complementar                       |
| `--border`           | `#E2E8F0` | `border-border`          | Divisórias                                    |
| `--input`            | `#8693A6` | `border-input`           | Borda de campo e de botão de contorno         |

### Ação

| Token         | Valor     | Classe                       | Uso                               |
| ------------- | --------- | ---------------------------- | --------------------------------- |
| `--primary`   | `#0B7559` | `bg-primary`, `text-primary` | Botão principal, link, item ativo |
| `--secondary` | `#14263D` | `bg-secondary`               | Botão secundário                  |
| `--ring`      | `#0B7559` | `ring-ring`                  | Foco                              |

Nos nomes do shadcn/ui, `primary` é a cor de **ação**. A cor que o documento original chama de
"Primary" (navy) é `brand` aqui.

### Semânticas

Cada significado tem três tons: a cor oficial marca (ícone, ponto, barra de gráfico), a variante
`strong` serve para texto, e a `soft` é fundo de aviso.

| Significado | Oficial   | `-strong` (texto) | `-soft` (fundo) | Uso                                       |
| ----------- | --------- | ----------------- | --------------- | ----------------------------------------- |
| `success`   | `#16A36A` | `#0D7A4D`         | `#E8F6EF`       | Resultado positivo, confirmação           |
| `danger`    | `#DC5252` | `#B63636`         | `#FBECEC`       | Resultado negativo, erro, ação destrutiva |
| `warning`   | `#D99A27` | `#8A5A00`         | `#FBF3E2`       | Situação que pede atenção                 |
| `info`      | `#3985C8` | `#24639F`         | `#EAF2FA`       | Informação e aviso neutro                 |

### Regras de cor

1. **Texto colorido usa a variante `strong`.** As cores oficiais não passam em contraste como
   texto sobre branco.
2. **Uma cor, um significado.** `primary` é ação; `success` é resultado. Um valor positivo nunca
   usa a cor do botão.
3. **Despesa não é vermelha.** Quase toda linha do produto é despesa. `danger` fica para o que
   saiu do previsto: orçamento estourado, saldo negativo, erro.
4. **Cor nunca vai sozinha.** Positivo e negativo levam sinal ou ícone além da cor.
5. **Gráficos** (a partir da Fase 3): navy para o principal, esmeralda para crescimento, âmbar
   para categoria secundária, vermelho para resultado negativo (`--chart-1` a `--chart-5`).

### Contraste conferido

WCAG 2.2 AA: 4,5:1 para texto, 3:1 para borda de campo.

| Par                                     | Contraste    |
| --------------------------------------- | ------------ |
| Texto branco no botão principal         | 5,67         |
| Link (`primary`) no branco e no fundo   | 5,67 e 5,24  |
| `foreground` no fundo                   | 15,03        |
| `muted-foreground` no branco e no fundo | 5,91 e 5,46  |
| `success-strong` no branco              | 5,37         |
| `danger-strong` no branco               | 5,88         |
| `warning-strong` no branco              | 5,93         |
| `info-strong` no branco                 | 6,25         |
| Branco e `brand-muted` sobre `brand`    | 15,28 e 8,29 |
| `brand-active` sobre `brand`            | 8,52         |
| Borda de campo (`input`) no branco      | 3,12         |

Campos ficam sempre sobre superfície branca; direto sobre o fundo a borda cai para 2,88.

## Tipografia

- **Geist** em toda a interface, carregada por `next/font` em `src/app/layout.tsx`.
- **Números financeiros** usam a classe `tabular-nums`, para os dígitos alinharem em coluna, e
  nunca ficam abaixo de 16 px.
- Título de página: 24 px, peso 600. Título de seção: 18 px, peso 600. Corpo: 16 px. Apoio:
  14 px.
- Campo de formulário com texto de 16 px, para o celular não dar zoom ao focar.

## Forma

| Token           | Valor                             | Classe        | Uso                     |
| --------------- | --------------------------------- | ------------- | ----------------------- |
| `--radius-sm`   | 6px                               | `rounded-sm`  | Marcadores, etiquetas   |
| `--radius-lg`   | 10px                              | `rounded-lg`  | Botões, campos, avisos  |
| `--radius-xl`   | 16px                              | `rounded-xl`  | Cards e painéis         |
| `--shadow-card` | `0 2px 12px rgb(20 38 61 / 0.05)` | `shadow-card` | Única sombra do sistema |

Card tem sombra **ou** borda, nunca os dois. Card dentro de card não existe.

Espaçamento na escala do Tailwind: 20 px de respiro interno em card, 16 px entre cards, 20 px
entre campos de um formulário.

## Componentes

| Componente                   | Arquivo                                 | Papel                                                           |
| ---------------------------- | --------------------------------------- | --------------------------------------------------------------- |
| `Panel`                      | `src/components/layout/panel.tsx`       | Superfície branca: card, formulário, lista                      |
| `Button`                     | `src/components/ui/button.tsx`          | `default` esmeralda, `secondary` navy, `outline`, `destructive` |
| `TextField`, `PasswordField` | `src/components/form/`                  | Campo com rótulo, apoio e erro ligados                          |
| `FormMessage`, `Notice`      | `src/components/form/form-message.tsx`  | Erro (`danger`), sucesso (`success`), aviso (`info`)            |
| `SubmitButton`               | `src/components/form/submit-button.tsx` | Botão de envio com estado de andamento                          |
| `TextLink`                   | `src/components/form/text-link.tsx`     | Link de texto com área de toque de 44 px                        |
| `MainNav`                    | `src/components/shell/main-nav.tsx`     | Navegação principal                                             |

### Estados

- **Hover** do botão principal escurece; nunca clareia.
- **Foco**: anel de 3 px na cor `ring`; sobre a cor da marca, `brand-active`.
- **Desabilitado**: 50% de opacidade, sem resposta ao toque.
- **Erro em campo**: borda `danger-strong` e mensagem em texto, embaixo do campo.

## Celular

O uso principal é no celular. Toda tela é desenhada primeiro para 360 px de largura.

- **Navegação**: barra inferior branca, ao alcance do polegar, com até cinco itens; item ativo
  em `primary`. No topo, uma faixa na cor da marca com o nome do produto.
- **Computador** (a partir de 768 px): a mesma navegação vira coluna lateral na cor da marca,
  com o item ativo sobre `brand-secondary` e ícone em `brand-active`.
- **Conteúdo**: uma coluna. No computador ela fica com largura limitada; não ganha colunas só
  porque há espaço.
- **Alvos de toque**: 44 px no mínimo; campos e botões de formulário com 48 px de altura.
- **Listas no lugar de tabelas**: no celular, uma movimentação é uma linha com descrição e
  categoria à esquerda e valor à direita, em `tabular-nums`. Tabela só no computador.
- **Formulário de lançamento**: valor em primeiro lugar e em destaque, com teclado numérico; o
  botão de salvar fica ao alcance do polegar.

## Restrição técnica

A política de segurança (CSP) bloqueia atributo `style` inline em produção. Componente que
depende de estilo inline para se posicionar não entra sem decisão registrada. Vale também para
a escolha da biblioteca de gráficos, na Fase 3.
