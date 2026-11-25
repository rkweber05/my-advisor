# ADR 0001 — Fundação do projeto

- **Status:** aprovada
- **Data:** 2026-11-23
- **Decisões cobertas:** D-01 a D-10

## Contexto

A Fase 0 precisava de escolhas de ferramenta e de estrutura antes do scaffold. As alternativas e
os motivos estão em [README.md](README.md). O proprietário aprovou as dez recomendações em
conjunto.

## Decisão

| ID   | Decisão                                                                                       |
| ---- | --------------------------------------------------------------------------------------------- |
| D-01 | pnpm como gerenciador de pacotes                                                              |
| D-02 | Banco de desenvolvimento local, pela CLI do Supabase em Docker                                |
| D-03 | Ambientes: local, um projeto Supabase de preview agora e o de produção criado na Fase 8       |
| D-04 | Supabase em `sa-east-1` e funções da Vercel em `gru1`                                         |
| D-05 | Cada módulo é dono de schemas, serviço, repositório e componentes; pastas criadas sob demanda |
| D-06 | Acesso a dados somente pelo servidor                                                          |
| D-07 | Server Actions para mutações da interface; Route Handlers só para consumidores externos       |
| D-08 | GitHub Actions como CI                                                                        |
| D-09 | ESLint e Prettier                                                                             |
| D-10 | Código, banco e URLs em inglês; interface em pt-BR                                            |

## Consequências observadas no scaffold

- **Versões.** O gerador do Next.js 16.4 fixa TypeScript 5.9 e ESLint 9. O projeto segue essas
  versões em vez de TypeScript 7 e ESLint 10, o que encerra o risco R-18. A troca fica para quando
  o próprio Next.js adotar as novas.
- **Cache Components.** O Next.js 16 habilita `cacheComponents` e `partialPrefetching` por padrão,
  e o projeto mantém. Nada é guardado em cache sem `use cache` explícito, o que combina com a
  regra de nunca pôr dado privado em cache. O efeito colateral é a incompatibilidade com CSP de
  nonce, registrada como D-30.
- **shadcn/ui.** A configuração padrão atual usa Base UI (`@base-ui/react`) como biblioteca de
  primitivos e o pacote `cn` para classes, no lugar de Radix e `clsx` + `tailwind-merge`.
- **`vercel.json`** fixa a região das funções em `gru1` (D-04).
- **Testes.** Os testes E2E rodam contra o build de produção, na porta 3100, e não dependem do
  Supabase local enquanto não houver autenticação.
