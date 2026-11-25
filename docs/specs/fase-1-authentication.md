# Fase 1 — Autenticação e isolamento: especificação e plano

Etapas A (specification) e B (planning) do §13 do SDD. Status: **spec e decisões aprovadas em
2026-11-24** ([ADR 0002](../decisions/0002-autenticacao.md)).

A implementação (etapa C) estava condicionada à conclusão da Fase 0 (CI verde no GitHub e
preview publicado). Em 2026-11-25 o proprietário decidiu começar antes disso, ciente de que
contraria a regra 2 do §13 do SDD. As pendências da Fase 0 continuam abertas. Andamento na
seção [C](#c-implementação).

O plano segue as nove decisões da seção [Decisões aprovadas](#decisões-aprovadas). Requisitos em [../SDD.md](../SDD.md)
(Módulo 01, §6 e §7); produto em [../../PRODUCT.md](../../PRODUCT.md).

## A. Especificação

### Objetivo

Uma pessoa autorizada cria a conta, entra, mantém o perfil e sai. Ninguém acessa dado de outra
conta, por nenhum caminho: nem pela interface, nem chamando o banco direto com a chave pública.

A fase também deixa prontas as três peças que todas as fases seguintes usam: `requireUser()`, o
padrão de tabela com RLS e o registro de auditoria.

### Escopo

| Entra                                                        | Não entra                                           |
| ------------------------------------------------------------ | --------------------------------------------------- |
| Cadastro por e-mail e senha, com confirmação de e-mail       | Login social, link mágico, passkey                  |
| Login, logout, recuperação e troca de senha                  | MFA (avaliação na Fase 8, D-29)                     |
| Perfil: nome e fuso horário                                  | Troca de e-mail                                     |
| Proteção das rotas privadas e casca da área logada           | Qualquer tela ou tabela financeira                  |
| Tabelas `profiles`, `audit_events` e as de apoio ao cadastro | Tela de administração de usuários                   |
| Exclusão de conta                                            | Exportação dos dados (Fase 6)                       |
| Testes de isolamento entre dois usuários                     | SMTP de produção e Política de Privacidade (Fase 8) |

### Regras de negócio

1. **Cadastro fechado.** Só cria conta quem está na lista de e-mails autorizados. A regra vale no
   próprio serviço de autenticação, não só na tela, para não ser contornada por chamada direta.
2. **E-mail confirmado antes do primeiro login.**
3. **Senha**: mínimo de 12 caracteres, sem regra de composição (D-33).
4. **Mensagens que não revelam se um e-mail tem conta.** Login errado: "E-mail ou senha
   incorretos." Recuperação: "Se este e-mail tiver conta, enviamos as instruções."
5. **Toda conta tem um perfil**, criado junto com ela, com moeda `BRL` e fuso
   `America/Sao_Paulo`.
6. **A sessão é validada no servidor a cada requisição privada.** Sessão expirada ou encerrada
   não lê nem grava nada.
7. **Logout encerra a sessão em todos os dispositivos.**
8. **Exclusão de conta** exige a senha atual e uma confirmação digitada. Apaga em definitivo a
   conta e tudo o que pertence a ela, e deixa apenas um registro sem dado pessoal de que uma
   exclusão foi concluída.
9. **Auditoria** registra login, logout, alteração de perfil, troca de senha e pedido de exclusão.
   Nunca guarda senha, token, valor financeiro, IP ou agente do navegador.

### Entidades

**`profiles`** (D-11)

| Coluna       | Tipo          | Regra                                                           |
| ------------ | ------------- | --------------------------------------------------------------- |
| `id`         | `uuid`        | Chave primária e FK para `auth.users (id)`, `on delete cascade` |
| `name`       | `text`        | Obrigatório, de 1 a 80 caracteres                               |
| `currency`   | `text`        | Padrão `BRL`; só `BRL` é aceito no MVP                          |
| `timezone`   | `text`        | Padrão `America/Sao_Paulo`; precisa ser um fuso IANA válido     |
| `created_at` | `timestamptz` | Padrão `now()`                                                  |
| `updated_at` | `timestamptz` | Mantido por gatilho                                             |

RLS: SELECT e UPDATE só da própria linha (`(select auth.uid()) = id`). Sem política de INSERT nem
de DELETE, de propósito: a linha nasce pelo gatilho de criação de conta e some pelo `cascade`.

**`audit_events`** (D-15)

| Coluna        | Tipo          | Regra                                                                                         |
| ------------- | ------------- | --------------------------------------------------------------------------------------------- |
| `id`          | `uuid`        | Chave primária                                                                                |
| `user_id`     | `uuid`        | `default auth.uid()`, FK para `auth.users`, `on delete cascade`                               |
| `event_type`  | `text`        | Um de: `login`, `logout`, `profile_updated`, `password_changed`, `account_deletion_requested` |
| `entity_type` | `text`        | Opcional; usado a partir da Fase 2                                                            |
| `entity_id`   | `uuid`        | Opcional; usado a partir da Fase 2                                                            |
| `created_at`  | `timestamptz` | Padrão `now()`                                                                                |

RLS: SELECT e INSERT só do próprio usuário. Sem política de UPDATE nem de DELETE: evento gravado
não se altera. Índice em `(user_id, created_at)`.

**`signup_allowlist`** (D-12): `email` (chave primária, em minúsculas) e `created_at`. RLS
habilitado e nenhuma política: só o serviço de autenticação e o administrador do banco leem. É
mantida pelo proprietário direto no banco; não há tela.

**`account_deletions`** (D-14): `id` e `completed_at`. Nenhuma ligação com o usuário excluído.
RLS habilitado e nenhuma política.

### Telas e rotas

URLs em inglês, interface em pt-BR (D-10). Toda tela é desenhada primeiro para o celular.

| Rota               | Acesso  | O que faz                                               |
| ------------------ | ------- | ------------------------------------------------------- |
| `/login`           | Pública | E-mail e senha                                          |
| `/register`        | Pública | Nome, e-mail e senha; termina em "confira seu e-mail"   |
| `/forgot-password` | Pública | Pede o e-mail e sempre mostra a mesma resposta          |
| `/auth/confirm`    | Pública | Destino dos links de e-mail (confirmação e recuperação) |
| `/update-password` | Privada | Define a nova senha depois do link de recuperação       |
| `/dashboard`       | Privada | Início da área logada, em estado vazio até a Fase 3     |
| `/settings`        | Privada | Perfil, troca de senha, sair, excluir conta             |

A casca da área logada mostra só o que existe: Início e Configurações. Os demais itens do menu do
SDD entram nas fases que os implementam.

Antes de codificar as telas, o desenho passa pelo comando `shape` da skill `impeccable`, com o
[PRODUCT.md](../../PRODUCT.md) como base. O esboço atual não tem telas de autenticação.

### Riscos

| Risco                                                                                   | Mitigação                                                                                        |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Política RLS errada em `profiles` expõe dados de outra conta                            | Teste com dois usuários e com visitante anônimo; teste que falha se houver tabela sem RLS        |
| Gatilho de criação de perfil roda com privilégio elevado                                | Função mínima, `search_path` vazio, sem entrada do usuário além do nome; ADR próprio (D-31)      |
| Regra da lista de autorizados mal configurada tranca o cadastro ou deixa todos entrarem | Teste de integração chamando o serviço de autenticação direto, com e-mail dentro e fora da lista |
| Primeiro uso da chave secreta do Supabase                                               | Um único arquivo `server-only`; checagem no CI de que o nome da variável não aparece fora dele   |
| Redirecionamento aberto pelo parâmetro de retorno do login                              | Só caminho relativo começando com uma única barra; teste unitário                                |
| Leitor de e-mail abre o link e consome o token antes do usuário                         | O link leva a uma página com botão; o token só é trocado no clique                               |
| Token de acesso continua válido depois do logout                                        | `requireUser()` consulta o serviço de autenticação a cada requisição; teste específico           |
| Limite local de 2 e-mails por hora quebra os testes E2E                                 | Aumentar o limite só em `supabase/config.toml` (local e CI)                                      |
| Mensagens de erro revelam se o e-mail tem conta                                         | Mapa único de mensagens; teste E2E compara as respostas para e-mail existente e inexistente      |
| Sessão lida fora de `<Suspense>` quebra o build com Cache Components                    | Vale só se a D-30 ficar na alternativa A; a leitura fica em componente dentro do limite          |

### Critérios de aceite

Cada critério é demonstrado por teste automático, salvo indicação.

| #   | Critério                                                                                            | Requisito          |
| --- | --------------------------------------------------------------------------------------------------- | ------------------ |
| 1   | Visitante que abre `/dashboard` ou `/settings` vai para `/login`                                    | AUTH-002           |
| 2   | E-mail autorizado cria conta, confirma o e-mail e entra                                             | AUTH-001           |
| 3   | E-mail fora da lista não cria conta, nem chamando o serviço de autenticação direto                  | AUTH-001, AUTH-006 |
| 4   | Login com senha errada e com e-mail inexistente dão a mesma resposta                                | AUTH-001           |
| 5   | Conta criada já tem perfil com `BRL` e `America/Sao_Paulo`                                          | —                  |
| 6   | Usuário A não lê nem altera o perfil nem os eventos do usuário B, direto no banco                   | AUTH-004, AUTH-006 |
| 7   | Visitante anônimo, com a chave pública, não lê nenhuma linha de nenhuma tabela                      | AUTH-006           |
| 8   | Não existe tabela em `public` sem RLS                                                               | SEC-003            |
| 9   | Depois do logout, o cookie antigo e o token antigo não leem nem gravam nada                         | AUTH-003           |
| 10  | Sessão expirada não executa Server Action privada                                                   | AUTH-003           |
| 11  | Recuperação de senha funciona de ponta a ponta, e a senha antiga deixa de valer                     | AUTH-001           |
| 12  | Usuário altera nome e fuso; o `user_id` de uma requisição forjada é ignorado                        | SEC-006            |
| 13  | Exclusão de conta remove o usuário, o perfil e os eventos, e grava uma linha em `account_deletions` | AUTH-005           |
| 14  | Login, logout, alteração de perfil, troca de senha e pedido de exclusão geram evento de auditoria   | §6.4               |
| 15  | A chave secreta não aparece no pacote enviado ao navegador                                          | SEC-007            |
| 16  | Login e cadastro funcionam em viewport de celular e só com teclado                                  | WCAG 2.2 AA        |

## Decisões aprovadas

Aprovadas pelo proprietário em 2026-11-24. Alternativas consideradas em
[../decisions/README.md](../decisions/README.md).

| ID   | Decisão                       | Aprovado                                                                                                                          |
| ---- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| D-11 | Chave de `profiles`           | `profiles.id` é o próprio `auth.users.id`                                                                                         |
| D-12 | Cadastro                      | Fechado por lista de e-mails, aplicada por um gancho do Supabase Auth antes de criar o usuário; confirmação de e-mail obrigatória |
| D-13 | E-mail em produção            | Provedor de SMTP definido só na Fase 8. No preview, o envio padrão do Supabase basta para o e-mail do proprietário                |
| D-14 | Exclusão de conta             | Nesta fase, definitiva e em cascata                                                                                               |
| D-15 | Auditoria e consentimento     | `audit_events` nesta fase. `consents` não é criada: nenhum tratamento da fase depende de consentimento                            |
| D-30 | CSP                           | **Mudar para CSP com nonce e desligar Cache Components**                                                                          |
| D-31 | Criação do perfil             | Gatilho no banco, na criação do usuário. É a única função `SECURITY DEFINER` do projeto                                           |
| D-32 | Cliente Supabase no navegador | Não usar. Toda autenticação passa por Server Action, e o cookie de sessão vira `httpOnly`                                         |
| D-33 | Senha                         | Mínimo de 12 caracteres, sem regra de composição                                                                                  |

Sobre a **D-30**, a troca é esta. Hoje a CSP permite script inline, o que tira dela quase toda a
proteção contra XSS. Com nonce, só roda o script que o servidor autorizou naquela resposta. O
custo é que toda página passa a ser renderizada a cada requisição e o projeto sai do padrão do
Next.js 16. Como toda tela com dado financeiro já é renderizada por requisição, a perda prática é
pequena, e é mais barato decidir agora do que depois de dez telas prontas. Não testei a
alternativa com nonce nesta stack: a entrega 1.1 existe para provar que funciona antes do resto.

Sobre a **D-32**: sem cliente no navegador, o JavaScript da página não consegue ler o token de
sessão, o arquivo `src/lib/supabase/browser.ts` criado na Fase 0 é removido e a CSP deixa de
liberar conexão com o Supabase. O `@supabase/ssr` não marca o cookie como `httpOnly` por padrão;
a opção precisa ser validada na implementação.

## B. Plano

### Arquitetura

```
src/
├── app/
│   ├── (auth)/login, register, forgot-password      páginas públicas
│   ├── auth/confirm/                                 página com botão; troca o token no clique
│   ├── (dashboard)/layout.tsx                        casca da área logada
│   ├── (dashboard)/dashboard, settings, update-password
├── modules/
│   ├── auth/      schemas.ts · service.ts · actions.ts · messages.ts · components/
│   ├── profile/   schemas.ts · service.ts · repository.ts · actions.ts · components/
│   └── audit/     service.ts · repository.ts
├── lib/
│   ├── auth/require-user.ts
│   ├── auth/safe-redirect.ts
│   └── supabase/admin.ts                             chave secreta, `server-only`
```

- **`requireUser()`** é o único ponto que decide se há usuário. Consulta o serviço de
  autenticação (`getUser`), e não apenas a assinatura do token, para que logout e exclusão valham
  na hora. Toda página privada, Server Action e Route Handler começa por ela. Nenhum serviço
  recebe `user_id` vindo do cliente.
- **`src/proxy.ts`** continua renovando a sessão e passa a redirecionar visitante sem cookie para
  `/login`. É conveniência de navegação, não autorização.
- **Mutações** são Server Actions (D-07): validam com Zod, chamam o serviço do módulo e devolvem
  um resultado tipado. Formulários com React Hook Form e o mesmo schema.
- **`admin.ts`** tem dois usos permitidos: excluir o usuário e gravar em `account_deletions`.
- **Exclusão de conta**, em ordem: `requireUser()` → confere a frase digitada → confere a senha
  atual em um cliente descartável, sem tocar nos cookies → grava `account_deletion_requested` →
  encerra as sessões → exclui o usuário (o `cascade` leva perfil e eventos) → grava a linha em
  `account_deletions` → limpa os cookies e redireciona para `/login`.

### Banco de dados

Quatro migrations, cada uma com RLS e políticas no mesmo arquivo:

1. `profiles`, a função única de `updated_at` e o gatilho de criação de perfil.
2. `audit_events`.
3. `signup_allowlist` e a função do gancho, com permissão de execução só para o serviço de
   autenticação.
4. `account_deletions`.

Configuração em `supabase/config.toml`: confirmação de e-mail obrigatória, senha mínima de 12,
gancho de criação de usuário habilitado, modelos de e-mail em pt-BR em `supabase/templates/` e
limite de e-mails ampliado para os testes. No projeto de preview, as mesmas opções são aplicadas
pelo painel do Supabase, o que depende de você.

O seed local inclui um e-mail fictício na lista de autorizados.

### Variáveis de ambiente novas

| Variável               | Onde        | Uso                                                 |
| ---------------------- | ----------- | --------------------------------------------------- |
| `SUPABASE_SECRET_KEY`  | Só servidor | Exclusão de conta. Nunca com prefixo `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SITE_URL` | Pública     | Endereço usado nos links dos e-mails                |

### Testes

| Tipo       | Ferramenta                 | O que cobre                                                                           |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------- |
| Unitário   | Vitest                     | Schemas (e-mail, senha, nome, fuso), mapa de mensagens, redirecionamento seguro       |
| Banco      | pgTAP (`supabase test db`) | Nenhuma tabela sem RLS; políticas de cada tabela; gatilho de perfil; função do gancho |
| Integração | Vitest + Supabase local    | Critérios 3, 6, 7, 9, 12, 13 e 14, com dois usuários fictícios e um cliente anônimo   |
| E2E        | Playwright + Mailpit       | Critérios 1, 2, 4, 10, 11 e 16; e-mails lidos pela API do Mailpit do Supabase local   |

Todo usuário de teste usa e-mail fictício em domínio reservado (`@example.test`) e é removido ao
fim da execução. A chave secreta usada nos testes é a do Supabase local.

O CI ganha dois passos no job que já sobe o Supabase: `supabase test db` e os testes de
integração.

### Entregas, em ordem

Cada entrega termina com os testes passando e pode virar um commit.

| #    | Entrega                                                                                                                                   | Verificação                                                                     |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1.1  | CSP conforme a D-30                                                                                                                       | E2E: header com nonce e sem `unsafe-inline` em scripts; página inicial funciona |
| 1.2  | Base de testes: projeto de integração no Vitest, criação de usuários fictícios, pgTAP, passos no CI                                       | Um teste de cada tipo rodando local e no CI                                     |
| 1.3  | Migration `profiles` com gatilho e RLS                                                                                                    | Critérios 5, 6, 7 e 8                                                           |
| 1.4  | `requireUser()`, redirecionamento no proxy, casca da área logada, `/dashboard` vazio                                                      | Critérios 1 e 10                                                                |
| 1.5  | Desenho das telas de autenticação com a skill `impeccable` (`shape`)                                                                      | Aprovação do proprietário                                                       |
| 1.6  | Cadastro: lista de autorizados, gancho, confirmação por e-mail, modelos em pt-BR                                                          | Critérios 2 e 3                                                                 |
| 1.7  | Login e logout; migration `audit_events` e serviço de auditoria                                                                           | Critérios 4, 9 e 14 (login e logout)                                            |
| 1.8  | Recuperação e troca de senha                                                                                                              | Critérios 11 e 14 (troca de senha)                                              |
| 1.9  | Perfil: nome e fuso                                                                                                                       | Critérios 12 e 14 (perfil)                                                      |
| 1.10 | Exclusão de conta: `admin.ts`, migration `account_deletions`                                                                              | Critérios 13, 14 (exclusão) e 15                                                |
| 1.11 | Acessibilidade e celular: revisão das telas com `audit` da skill                                                                          | Critério 16                                                                     |
| 1.12 | Documentação: `DATABASE.md`, `SECURITY.md`, `LGPD.md` (nome e e-mail passam a ser tratados), `ARCHITECTURE.md`, consequências no ADR 0002 | Revisão                                                                         |

### Arquivos previstos

```
src/app/(auth)/login/page.tsx, register/page.tsx, forgot-password/page.tsx
src/app/auth/confirm/page.tsx
src/app/(dashboard)/layout.tsx, dashboard/page.tsx, settings/page.tsx, update-password/page.tsx
src/modules/auth/schemas.ts, service.ts, actions.ts, messages.ts, components/*
src/modules/profile/schemas.ts, service.ts, repository.ts, actions.ts, components/*
src/modules/audit/service.ts, repository.ts
src/lib/auth/require-user.ts, safe-redirect.ts
src/lib/supabase/admin.ts
supabase/migrations/<data>_profiles.sql, _audit_events.sql, _signup_allowlist.sql, _account_deletions.sql
supabase/templates/confirmation.html, recovery.html
supabase/tests/*.sql
tests/unit/auth/*, tests/integration/*, tests/e2e/auth.spec.ts
```

Alterados: `src/proxy.ts`, `src/lib/supabase/proxy.ts`, `src/lib/supabase/server.ts`,
`src/config/env.ts`, `next.config.ts`, `src/app/page.tsx` (passa a redirecionar),
`supabase/config.toml`, `supabase/seed.sql`, `vitest.config.mts`, `.github/workflows/ci.yml`,
`.env.example`. Removido: `src/lib/supabase/browser.ts` (D-32).

Dependências novas: `react-hook-form`, `@hookform/resolvers` e `server-only`.

### O que depende de você

- Concluir a Fase 0: repositório, CI e preview.
- Atualizar a CLI do Supabase.
- Aprovar, na entrega 1.5, o desenho das telas.
- No projeto de preview do Supabase: aplicar as opções de autenticação, cadastrar a variável
  secreta na Vercel e incluir o seu e-mail na lista de autorizados.

### Complexidade

Média. A parte delicada não é o volume de código, e sim três pontos de segurança que precisam
estar certos na primeira vez: as políticas RLS, o gatilho com privilégio elevado e o primeiro uso
da chave secreta. Por isso a base de testes (1.2) vem antes de qualquer tabela.

Pontos que eu não validei e que a implementação precisa confirmar na documentação e por teste: o
formato exato do gancho de criação de usuário, o cookie `httpOnly` no `@supabase/ssr`, o
comportamento de `getUser` depois do logout e a CSP com nonce no Next.js 16.

## Desenho das telas (entrega 1.5)

Brief de desenho. Status: **aprovado pelo proprietário em 2026-11-25**. Respostas do
proprietário em 2026-11-25: e-mail fora da lista recebe a mesma resposta dos demais; a sessão
dura até a pessoa sair; as telas seguem o visual do esboço.

### 1. Quem chega e para quê

O dono do produto, no celular, quase sempre já logado. As telas de autenticação são um desvio
raro: a primeira entrada em cada aparelho, uma senha esquecida, uma sessão encerrada. São telas
de tarefa. O sucesso delas é sumir do caminho: entrar leva um toque quando o gerenciador de
senhas preenche os campos.

### 2. Direção

- **Visual**: o do esboço. Fundo claro, neutros frios, verde-azulado escuro como única cor de
  ação, letra Inter. Nenhuma ilustração, painel de marketing, depoimento ou número decorativo.
- **Estrutura**: uma coluna, uma tarefa por tela, um botão principal por tela. No computador a
  mesma coluna fica centralizada e estreita; não ganha segunda coluna.
- **Marca**: só o nome "Meu Advisor" e a frase "Seu dinheiro, sob controle." no topo das telas
  públicas. Dentro da área logada, só o nome.
- **Voz**: franca e curta. A mensagem diz o que aconteceu e o que fazer, sem pedir desculpa e
  sem exclamação.

### 3. Telas

| Tela                         | Conteúdo                                               | Botão principal                         | Saídas secundárias            |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------- | ----------------------------- |
| `/login`                     | E-mail, senha                                          | Entrar                                  | Esqueci a senha · Criar conta |
| `/register`                  | Nome, e-mail, senha                                    | Criar conta                             | Já tenho conta                |
| `/register`, depois do envio | "Confira seu e-mail", com o endereço digitado          | —                                       | Voltar ao login               |
| `/forgot-password`           | E-mail                                                 | Enviar instruções                       | Voltar ao login               |
| `/auth/confirm`              | Uma frase dizendo o que o botão faz                    | Confirmar e-mail, ou Definir nova senha | —                             |
| `/update-password`           | Nova senha                                             | Salvar nova senha                       | —                             |
| `/dashboard`                 | Estado vazio: "Ainda não há lançamentos para mostrar." | —                                       | —                             |
| `/settings`                  | Perfil, Senha, Sessão, Excluir conta, nesta ordem      | Um por seção                            | —                             |

- **Senha**: um campo só, com botão de mostrar e ocultar. Não há campo de repetir a senha. A
  regra "Mínimo de 12 caracteres" fica visível embaixo do campo desde o início, não aparece só
  como erro. Colar é permitido. Sem medidor de força.
- **Cadastro fechado**: a tela de depois do envio é sempre a mesma. Texto: "Se este e-mail
  estiver autorizado, enviamos um link de confirmação. O cadastro é fechado: e-mails fora da
  lista não recebem nada." Diz a verdade sem revelar quem está na lista.
- **Recuperação**: sempre "Se este e-mail tiver conta, enviamos as instruções."
- **`/auth/confirm`**: o link do e-mail nunca age sozinho; a troca do token só acontece no
  toque do botão. Link vencido ou já usado: "Este link expirou ou já foi usado.", com o caminho
  para pedir outro.
- **Sem "lembrar de mim"**: a sessão sempre continua até a pessoa sair.
- **Casca da área logada**: no celular, barra inferior com Início e Configurações, ao alcance
  do polegar; no computador, a mesma navegação na lateral. Só aparecem itens que existem. A
  barra inferior comporta até cinco itens; quando o menu do SDD passar disso, o excedente vai
  para um item "Mais", a decidir na fase que o exigir.
- **Configurações**:
  - Perfil: nome e fuso horário editáveis; e-mail visível, sem edição.
  - Senha: senha atual e nova senha.
  - Sessão: botão Sair, com a frase "Sai de todos os aparelhos."
  - Excluir conta: fica por último e separada. O botão leva a um passo próprio, que lista o que
    será apagado, diz que não tem volta e pede a senha atual e a palavra `EXCLUIR` digitada. O
    botão final só habilita com os dois preenchidos.

### 4. Estados

| Situação                     | O que a tela faz                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| Enviando                     | Botão desabilitado com o verbo em andamento ("Entrando…"); campos preservados            |
| Campo inválido               | Mensagem embaixo do campo, ligada a ele para o leitor de tela; foco vai ao primeiro erro |
| Login recusado               | "E-mail ou senha incorretos." acima do formulário; o e-mail fica, a senha é limpa        |
| Muitas tentativas            | "Muitas tentativas. Tente de novo em alguns minutos."                                    |
| Falha do servidor ou da rede | "Não foi possível concluir. Tente de novo." Nunca o erro técnico                         |
| Sessão encerrada             | Login com o aviso "Sua sessão terminou. Entre de novo."                                  |
| Alteração salva              | Confirmação curta junto da seção alterada, anunciada ao leitor de tela                   |
| Conta excluída               | Login com o aviso "Sua conta foi excluída."                                              |

Faixas: nome de 1 a 80 caracteres, que precisa quebrar linha sem estourar a tela; e-mail longo
trunca só na exibição, nunca no campo.

### 5. Restrições

- **Celular primeiro**: tela de 360 px de largura sem rolagem horizontal; alvos de toque de pelo
  menos 44 px; teclado de e-mail no campo de e-mail; atributos de preenchimento automático
  corretos em todos os campos, para o gerenciador de senhas funcionar.
- **WCAG 2.2 AA**: rótulo visível em todo campo (texto de exemplo não substitui rótulo), foco
  visível, tudo operável por teclado, erro identificado em texto e não só por cor, contraste
  mínimo de 4,5:1 no texto.
- **CSP**: nenhum atributo `style` inline; ele é bloqueado em produção.
- **Componentes**: os do shadcn/ui já adotado (botão, campo, rótulo, seletor). Nenhuma
  biblioteca nova de interface.
- **E-mails** de confirmação e de recuperação usam a mesma voz e o mesmo nome do produto, em
  pt-BR, com um único botão.

### 6. Fora do desenho

Login social, link mágico, MFA, troca de e-mail, foto de perfil, tema escuro e qualquer conteúdo
de marketing nas telas públicas.

## C. Implementação

Concluída localmente em 2026-11-25. O CI ainda não rodou no GitHub e não há preview.

| #    | Entrega                        | Situação | Evidência                                                                          |
| ---- | ------------------------------ | -------- | ---------------------------------------------------------------------------------- |
| 1.1  | CSP com nonce                  | Feita    | E2E: nonce novo por resposta, sem `unsafe-inline` em scripts, tela sem violação    |
| 1.2  | Base de testes                 | Feita    | `pnpm test:db` e `pnpm test:integration`; passos adicionados ao CI                 |
| 1.3  | `profiles` com gatilho e RLS   | Feita    | pgTAP e integração                                                                 |
| 1.4  | `requireUser()`, proxy, casca  | Feita    | E2E                                                                                |
| 1.5  | Desenho das telas              | Feita    | Brief aprovado pelo proprietário em 2026-11-25                                     |
| 1.6  | Cadastro fechado e confirmação | Feita    | Integração e E2E com a caixa de e-mail local                                       |
| 1.7  | Login, logout, `audit_events`  | Feita    | E2E, integração e pgTAP                                                            |
| 1.8  | Recuperação e troca de senha   | Feita    | E2E                                                                                |
| 1.9  | Perfil                         | Feita    | E2E                                                                                |
| 1.10 | Exclusão de conta              | Feita    | E2E                                                                                |
| 1.11 | Acessibilidade e celular       | Parcial  | Suíte E2E inteira em viewport de celular, login só com teclado; ver seção D        |
| 1.12 | Documentação                   | Feita    | Este arquivo, `SECURITY.md`, `DATABASE.md`, `LGPD.md`, `ARCHITECTURE.md`, ADR 0002 |

**Diferenças em relação ao plano**

- **Sem React Hook Form.** Os formulários usam `useActionState` com Server Action, que é o
  caminho da documentação do Next.js 16: a validação acontece uma vez, no servidor, com o
  schema Zod, e o projeto fica com duas dependências a menos. Dependência nova: só
  `server-only`.
- **Sem `NEXT_PUBLIC_SITE_URL`.** O endereço dos links de e-mail vem do `site_url` do próprio
  Supabase, usado nos modelos de e-mail.
- **`signup_allowlist` tem uma política**, e não nenhuma: leitura pelo papel do serviço de
  autenticação, sem a qual o gancho não enxerga a lista.
- **Rotas públicas em lista fechada** (`src/lib/auth/routes.ts`): rota nova nasce privada.
- **Privilégio por coluna**: em `profiles`, a API só altera `name` e `timezone`; em
  `audit_events`, só informa o tipo do evento. `anon` não tem privilégio em nenhuma tabela.
- **Sem nome válido, a conta não é criada.** O gatilho não usa nome padrão.
- **Entrar pelo link de confirmação conta como login** na auditoria.
- **Trocar a senha derruba as outras sessões.**
- **Nova senha sem a atual** (`/update-password`) só vale para sessão aberta por link de e-mail
  há menos de uma hora. O serviço de autenticação não distingue link de recuperação de link de
  confirmação: marca os dois como `otp`.
- **Tela própria para a exclusão** (`/settings/delete-account`), como no brief.
- **Server Action sem sessão não é redirecionada pelo proxy**: ela chega ao `requireUser()`,
  que responde com o redirecionamento que o navegador sabe seguir.
- **Limites de autenticação ampliados no ambiente local** (`supabase/config.toml`), para a
  suíte E2E não esbarrar neles. Os do projeto real são definidos no painel do Supabase.

## D. Validação

Rodado localmente em 2026-11-25: formatação, lint e tipos sem erro; 52 testes unitários, 36
asserções pgTAP, 20 testes de integração e 46 execuções E2E (23 testes, no computador e em
viewport de celular).

| #   | Critério                                                   | Resultado   | Onde                                         |
| --- | ---------------------------------------------------------- | ----------- | -------------------------------------------- |
| 1   | Visitante em rota privada vai para o login                 | Atendido    | `tests/e2e/smoke.spec.ts`                    |
| 2   | E-mail autorizado cria conta, confirma e entra             | Atendido    | `tests/e2e/auth.spec.ts`                     |
| 3   | E-mail fora da lista não cria conta, nem direto no serviço | Atendido    | `tests/integration/auth.test.ts`, pgTAP, E2E |
| 4   | Senha errada e e-mail inexistente: mesma resposta          | Atendido    | E2E                                          |
| 5   | Conta nova tem perfil com `BRL` e `America/Sao_Paulo`      | Atendido    | Integração, pgTAP                            |
| 6   | Usuário A não lê nem altera dados de B                     | Atendido    | Integração, pgTAP                            |
| 7   | Visitante anônimo não lê nenhuma tabela                    | Atendido    | Integração, pgTAP                            |
| 8   | Nenhuma tabela em `public` sem RLS                         | Atendido    | `supabase/tests/database/00_rls.test.sql`    |
| 9   | Depois do logout, cookie e token antigos não leem nada     | **Parcial** | Ver abaixo                                   |
| 10  | Sem sessão, Server Action privada não executa              | Atendido    | E2E                                          |
| 11  | Recuperação de senha de ponta a ponta                      | Atendido    | E2E                                          |
| 12  | Altera nome e fuso; id forjado é ignorado                  | Atendido    | E2E                                          |
| 13  | Exclusão remove usuário, perfil e eventos                  | Atendido    | E2E                                          |
| 14  | Eventos de auditoria dos cinco tipos                       | Atendido    | E2E                                          |
| 15  | Chave secreta fora do pacote do navegador                  | Atendido    | `tests/e2e/smoke.spec.ts`                    |
| 16  | Login e cadastro no celular e só com teclado               | **Parcial** | Ver abaixo                                   |

**Critério 9, parcial.** Pela aplicação, está atendido: o cookie antigo é recusado na hora,
porque `requireUser()` consulta o serviço de autenticação. Mas quem tiver copiado o token de
acesso antes do logout ainda consegue ler o banco **direto pela API do Supabase** até o token
vencer, em até uma hora. É o comportamento do Supabase: a API de dados confere só a assinatura e
a validade do token. O token fica em cookie `httpOnly`, fora do alcance do JavaScript da página.
Decisão **D-34**, aprovada em 2026-11-25: a validade do token caiu para 10 minutos. A janela
diminuiu, não foi fechada, e por isso o critério continua parcial.

**Critério 16, parcial.** Conferido: a suíte inteira passa em viewport de celular; o login foi
feito só com teclado; todo campo tem rótulo visível e erro em texto, ligado ao campo; o foco vai
ao primeiro erro; os alvos de toque têm 44 px ou mais. Não conferido: leitor de tela real,
contraste medido por ferramenta e aparelho físico. O comando `audit` da skill `impeccable` não
foi rodado; rodou só o detector mecânico dela, sem achados.

**Não verificado**: CI no GitHub, preview na Vercel, envio real de e-mail e as opções de
autenticação do projeto de preview do Supabase, que são aplicadas pelo painel.

## E. Aprovação

Pendente. A fase só é concluída com a aprovação do proprietário e o CI verde.
