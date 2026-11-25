# ADR 0002 — Autenticação e isolamento

- **Status:** aprovada
- **Data:** 2026-11-24
- **Decisões cobertas:** D-11 a D-15, D-30 a D-33 e D-34 (acrescentada em 2026-11-25)

## Contexto

A Fase 1 implementa autenticação, perfil e isolamento entre contas. As alternativas e os motivos
estão em [README.md](README.md); o plano está em
[../specs/fase-1-authentication.md](../specs/fase-1-authentication.md). O proprietário aprovou as
nove recomendações em conjunto, antes da implementação.

## Decisão

| ID   | Decisão                                                                                                         |
| ---- | --------------------------------------------------------------------------------------------------------------- |
| D-11 | `profiles.id` é o próprio `auth.users.id`; não há coluna `user_id` em `profiles`                                |
| D-12 | Cadastro fechado por lista de e-mails, aplicada por gancho do Supabase Auth; confirmação de e-mail obrigatória  |
| D-13 | O provedor de SMTP de produção é definido na Fase 8                                                             |
| D-14 | Exclusão de conta entra na Fase 1, definitiva e em cascata; exportação de dados fica na Fase 6                  |
| D-15 | `audit_events` é criada na Fase 1; `consents` não é criada enquanto nenhum tratamento depender de consentimento |
| D-30 | CSP com nonce por requisição; Cache Components é desligado                                                      |
| D-31 | O perfil é criado por gatilho no banco, na criação do usuário                                                   |
| D-32 | Não há cliente Supabase no navegador; a autenticação passa por Server Action e o cookie de sessão é `httpOnly`  |
| D-33 | Senha com mínimo de 12 caracteres, sem regra de composição                                                      |
| D-34 | O token de acesso vale 10 minutos, e não 1 hora                                                                 |

## Consequências esperadas

- **D-30 altera a Fase 0.** `cacheComponents` e `partialPrefetching` saem de `next.config.ts`, a
  CSP passa a ser montada no proxy e toda página é renderizada por requisição. A regra de
  [ARCHITECTURE.md](../ARCHITECTURE.md) §11 sobre cache deixa de depender de Cache Components.
- **D-31 é a única exceção** à regra de não usar `SECURITY DEFINER`. A função do gatilho não
  recebe entrada do usuário além do nome e roda com `search_path` vazio. Qualquer outra função
  com privilégio elevado continua exigindo ADR próprio.
- **D-32 remove** `src/lib/supabase/browser.ts` e a liberação de conexão com o Supabase na CSP.
- **D-12 exige manutenção manual** da lista de e-mails, direto no banco, enquanto o cadastro
  estiver fechado.

## Confirmado na implementação

Os quatro pontos aprovados sem teste prévio, conferidos em 2026-11-25 no Supabase local:

1. A CSP com nonce funciona no Next.js 16 sem Cache Components (D-30). **Confirmado** por E2E no
   build de produção.
2. O `@supabase/ssr` aceita o cookie de sessão `httpOnly` (D-32). **Confirmado**: a opção
   `cookieOptions` vale para o servidor e para o proxy, e um E2E confere o atributo e que o
   JavaScript da página não enxerga o cookie.
3. O gancho de criação de usuário barra e-mails fora da lista (D-12). **Confirmado** por teste
   de integração chamando o serviço direto. A API administrativa, com a chave secreta, não passa
   pelo gancho; isso é esperado e é o que os testes usam para criar usuários.
4. `getUser` rejeita o token depois do logout (regra 6 da spec). **Confirmado**, com uma
   ressalva que virou a decisão D-34: a API de dados do Supabase não consulta a sessão e aceita
   o token antigo até ele vencer. Com a D-34, isso dura no máximo 10 minutos.

## Consequências observadas

- **D-30**: o layout raiz chama `connection()` para que nenhuma página seja gerada no build. Em
  produção a CSP também bloqueia atributo `style` inline; por isso o seletor de fuso é o
  `<select>` nativo, e não um componente com posicionamento por estilo.
- **D-31**: a função do gatilho não inventa nome. Conta criada sem nome válido falha, inclusive
  por chamada direta ao serviço de autenticação.
- **D-11**: além do RLS, `profiles` ganhou privilégio por coluna: pela API só `name` e
  `timezone` são alteráveis.
- **D-32**: `src/lib/supabase/browser.ts` foi removido e a CSP não libera o Supabase. O cookie
  de sessão é `httpOnly`, `SameSite=Lax` e, em produção, `Secure`.
- **D-12**: a tela de cadastro responde igual para e-mail autorizado e não autorizado, por
  escolha do proprietário. A diferença de tempo de resposta entre os dois casos não foi
  tratada. `signup_allowlist` precisou de uma política de leitura para o papel do serviço de
  autenticação.
- **D-14**: a exclusão usa a chave secreta em um único arquivo `server-only`
  (`src/lib/supabase/admin.ts`). Se a exclusão falhar depois de as sessões serem encerradas, a
  conta continua existindo e a pessoa precisa entrar de novo para repetir.
- **D-33**: o serviço de autenticação também recusa senha com menos de 12 caracteres; o limite
  superior é de 72, do algoritmo de hash.
- **D-34**: a janela em que um token copiado antes do logout ainda lê o banco direto pela API
  caiu para 10 minutos. Ela não foi fechada. O custo é uma renovação de sessão a cada 10
  minutos de uso, feita pelo proxy. No projeto real o valor é aplicado pelo painel do Supabase.
