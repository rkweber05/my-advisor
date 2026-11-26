# Segurança — Meu Advisor

Estado da segurança ao fim de cada fase. Requisitos no [SDD §6](SDD.md); desenho em
[ARCHITECTURE.md](ARCHITECTURE.md); riscos em [ANALISE-SDD.md §5](ANALISE-SDD.md).

Última atualização: Fase 2 implementada localmente (2026-11-25).

## O que já está em vigor

### Segredos e variáveis de ambiente

- Nenhum segredo no repositório. `.env*` está fora do Git, exceto `.env.example`, que só tem nomes.
- As variáveis são validadas na inicialização (`src/config/env.ts`, chamado por
  `src/instrumentation.ts`). Se faltar alguma, o servidor não sobe e a mensagem diz qual.
- Variáveis públicas: URL e chave pública do Supabase.
- `SUPABASE_SECRET_KEY` é a única secreta. Ignora o RLS, por isso só é lida em
  `src/lib/supabase/admin.ts`, marcado `server-only`, com dois usos: excluir o usuário e gravar
  em `account_deletions`. Um teste E2E falha se o valor ou o nome dela aparecer no pacote
  enviado ao navegador.
- Os testes usam só a chave do Supabase local (no `.env.local` e no job do CI, que a mascara
  nos logs). O apoio dos testes recusa rodar contra um endereço que não seja local.
- Regra permanente: variável secreta nunca recebe o prefixo `NEXT_PUBLIC_`.

### Headers de resposta

A CSP é montada em `src/proxy.ts` a cada requisição; os demais ficam em `next.config.ts`. Todos
são conferidos por teste E2E (`tests/e2e/smoke.spec.ts`).

| Header                      | Valor                                      |
| --------------------------- | ------------------------------------------ |
| `Content-Security-Policy`   | ver abaixo                                 |
| `Strict-Transport-Security` | `max-age=63072000`                         |
| `X-Content-Type-Options`    | `nosniff`                                  |
| `X-Frame-Options`           | `DENY`                                     |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`          |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=()` |

CSP (D-30, `src/lib/security/csp.ts`): `default-src 'self'`; scripts só com o nonce da
resposta (`'nonce-…' 'strict-dynamic'`), sem `'unsafe-inline'`; estilos de mesma origem ou com
o nonce; nenhuma conexão com outra origem, nem com o Supabase, porque não há cliente no
navegador (D-32); `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`;
`frame-ancestors 'none'`.

- O nonce é novo a cada resposta. Para isso toda página é renderizada por requisição: Cache
  Components está desligado e o layout raiz chama `connection()`.
- **Só em desenvolvimento** a CSP libera `'unsafe-eval'` em scripts e `'unsafe-inline'` em
  estilos, exigidos pelas ferramentas de erro do Next.js. Os testes E2E rodam contra o build de
  produção e conferem que nenhum dos dois aparece.
- **Consequência a observar**: em produção, atributo `style` inline é bloqueado. Se algum
  componente de interface depender dele, a exceção volta para decisão; não é liberada em
  silêncio.

`includeSubDomains` e `preload` não foram adicionados ao HSTS: valem para o domínio inteiro e
dependem do que mais roda nele. Decidir na configuração do domínio (Fase 8).

### Sessão e autorização

- `src/proxy.ts` renova a sessão e manda o visitante sem sessão para `/login`. A lista de rotas
  públicas é fechada (`src/lib/auth/routes.ts`): rota nova nasce privada. Isso é conveniência
  de navegação, não autorização.
- `requireUser()` (`src/lib/auth/require-user.ts`) é o ponto único de autorização no servidor.
  Consulta o serviço de autenticação a cada chamada. Toda página privada começa por ela.
- `profiles` tem RLS, privilégio mínimo por coluna e testes de acesso cruzado com dois usuários
  e um visitante anônimo (pgTAP e integração). Um teste falha se existir tabela em `public`
  sem RLS.
- `handle_new_user()` é a única função `SECURITY DEFINER` (ADR 0002, D-31); um teste falha se
  aparecer outra.
- **Cookie de sessão** `httpOnly`, `SameSite=Lax` e, em produção, `Secure` (D-32). Não há
  cliente Supabase no navegador: toda autenticação passa por Server Action.
- **Toda Server Action privada começa por `requireUser()`.** O proxy não redireciona Server
  Action; quem recusa é a própria ação.
- **Cadastro fechado** (D-12): o gancho `hook_before_user_created` do Supabase Auth recusa
  e-mail fora de `signup_allowlist`, também em chamada direta ao serviço. A tela responde igual
  nos dois casos. A API administrativa, com a chave secreta, não passa pelo gancho.
- **Mensagens** de login e de recuperação não revelam se o e-mail tem conta
  (`src/modules/auth/messages.ts`).
- **Senha**: mínimo de 12 caracteres, conferido na aplicação e no serviço de autenticação.
  Trocar a senha exige a atual e derruba as outras sessões. Definir senha sem a atual só vale
  para sessão aberta por link de e-mail há menos de uma hora.
- **Links de e-mail** levam a uma página com botão; o token só é trocado no clique.
- **Logout** encerra todas as sessões da conta.
- **Redirecionamento depois do login** só aceita caminho interno
  (`src/lib/auth/safe-redirect.ts`).
- **Auditoria**: `audit_events` registra login, logout, alteração de perfil, troca de senha e
  pedido de exclusão. Só o tipo e a data; o usuário não altera nem apaga eventos.
- **Exclusão de conta**: exige a senha atual e a palavra `EXCLUIR`; apaga usuário, perfil e
  eventos, e deixa uma linha sem dado pessoal em `account_deletions`.

### Dados financeiros (Fase 2)

- **Isolamento em duas camadas**: RLS em cada tabela e chave estrangeira composta com `user_id`
  em cada vínculo. Uma movimentação não consegue apontar para conta, cartão ou categoria de
  outra pessoa, mesmo com o id em mãos.
- **Privilégio por coluna**: pela API ninguém informa `id` nem `user_id`, e o tipo da
  movimentação não é alterável.
- **Regras no banco**: a combinação de tipo, forma de pagamento, conta e cartão é uma restrição
  da tabela, não só do formulário.
- **Toda Server Action da fase começa por `requireUser()`** e valida os campos antes de tocar
  no banco. Ids vindos do formulário precisam ser UUID.
- **Filtros do histórico** aceitam só valores conhecidos; o texto da busca é tratado como
  literal.
- **Auditoria** de criação, edição e exclusão guarda só o id da movimentação.
- **Log técnico** registra código de erro, nunca valor, descrição ou nome.
- **Cartão**: não existe campo para número, validade, código ou senha.

### Limitações conhecidas

- **Token de acesso depois do logout (D-34).** A aplicação recusa a sessão encerrada na hora.
  A API de dados do Supabase, chamada direto, ainda aceita o token antigo até ele vencer. A
  validade foi reduzida para 10 minutos; a janela diminuiu, não foi fechada. O token fica em
  cookie `httpOnly`.
- **Tempo de resposta do cadastro.** A tela responde igual para e-mail autorizado e não
  autorizado, mas o tempo de resposta pode diferir. Não foi tratado.
- **Login com a senha certa e e-mail não confirmado** recebe "Confirme seu e-mail antes de
  entrar". Só quem já sabe a senha vê essa mensagem.
- **Limites de tentativa** são os do Supabase Auth. No ambiente local eles estão ampliados para
  os testes; os do projeto real são definidos no painel e ainda não foram configurados.

### Cache

Toda página é renderizada por requisição e nada é guardado em cache. Regra: dado privado nunca
entra em cache compartilhado.

### Dependências

Versões fixadas em `pnpm-lock.yaml`; o CI instala com `--frozen-lockfile`. Scripts de instalação
de pacotes só rodam para os que estão liberados em `pnpm-workspace.yaml`.

## O que ainda não está em vigor

| Item                                                    | Fase                                 |
| ------------------------------------------------------- | ------------------------------------ |
| Opções de autenticação e limites no projeto real        | 1, depende da criação do projeto     |
| Rate limiting do Advisor                                | 5                                    |
| Proteção de deployment e variáveis de Preview na Vercel | 0, depende da criação do projeto     |
| CI executado no GitHub                                  | 0, depende da criação do repositório |
| Monitoramento, backup, resposta a incidentes, MFA       | 8                                    |

## Regras para as próximas fases

1. Tabela nova nasce com RLS, as políticas necessárias e privilégios explícitos na mesma
   migration.
2. Chave estrangeira entre tabelas do usuário é composta com `user_id`.
3. View usa `security_invoker = true`. `SECURITY DEFINER` exige ADR.
4. O `user_id` nunca vem do cliente.
5. A chave secreta do Supabase só pode ser lida em `src/lib/supabase/admin.ts`.
6. Log técnico não contém valor financeiro, descrição de lançamento nem texto de conversa.
7. Teste nunca usa dado real.
8. Toda Server Action privada começa por `requireUser()`.
