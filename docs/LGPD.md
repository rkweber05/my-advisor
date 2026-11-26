# LGPD e privacidade — Meu Advisor

Registro vivo do que o sistema trata, por quê e com quem compartilha. Cada fase acrescenta o que
passou a tratar; a Fase 8 faz a revisão final. Requisitos no [SDD §7](SDD.md).

Última atualização: Fase 2 implementada localmente (2026-11-25).

> Este documento é um registro técnico. Não substitui a revisão jurídica exigida pelo SDD §7.7
> antes da disponibilização pública.

## Situação atual

Com a Fase 1, o sistema passa a tratar **nome, e-mail e senha** de quem cria conta, e a registrar
eventos de auditoria. Nenhum dado real foi tratado até aqui: só existem o ambiente local e os
usuários fictícios dos testes.

- **Nome e e-mail**: pedidos no cadastro. O e-mail fica no Supabase Auth; o nome, em `profiles`.
- **Senha**: guardada só como hash, pelo Supabase Auth. A aplicação não a armazena nem registra.
- **Fuso horário**: preferência do perfil.
- **Lista de autorizados** (`signup_allowlist`): e-mails de pessoas convidadas, incluídos pelo
  proprietário antes de elas terem conta.
- **Auditoria** (`audit_events`): tipo do evento e data, por conta. Sem IP, sem agente do
  navegador, sem valores.
- **Exclusão de conta**: definitiva, feita pela própria pessoa em Configurações. Apaga a conta,
  o perfil e os eventos. Fica uma linha em `account_deletions` com a data, sem ligação com a
  pessoa. O e-mail **não** é removido da lista de autorizados.
- **E-mails de conta** (confirmação e recuperação) são enviados pelo Supabase Auth.

Com a Fase 2, o sistema passa a tratar **dados financeiros**: movimentações (valor, data,
descrição, observações), contas, cartões e categorias. De cartão ficam só nome, instituição,
bandeira, limite e dias de fechamento e vencimento; nunca número, validade ou código. Descrição
e observações são texto livre: a pessoa pode escrever nelas dado de terceiros. Tudo é apagado
junto com a conta. Não há exportação até a Fase 6.

## Registro das operações de tratamento

Preencher a cada fase. A base legal de cada linha precisa ser definida antes da produção
(SDD §7.3); consentimento não é a única base possível.

| Dado                              | Finalidade                          | Base legal  | Onde fica                     | Retenção                | Desde a fase |
| --------------------------------- | ----------------------------------- | ----------- | ----------------------------- | ----------------------- | ------------ |
| Nome e e-mail                     | Identificar e autenticar a conta    | [A DEFINIR] | Supabase Auth, profiles       | [A DEFINIR]             | 1            |
| Movimentações, contas, cartões    | Controle financeiro do titular      | [A DEFINIR] | Postgres (Supabase)           | [A DEFINIR]             | 2            |
| Planejamento e metas              | Planejamento financeiro             | [A DEFINIR] | Postgres (Supabase)           | [A DEFINIR]             | 4            |
| Mensagens enviadas ao Advisor     | Interpretar e registrar lançamentos | [A DEFINIR] | Postgres; provedor de IA      | 30 dias (proposta D-27) | 5            |
| Eventos de auditoria, sem valores | Segurança e rastreabilidade         | [A DEFINIR] | Postgres (Supabase)           | [A DEFINIR]             | 1            |
| E-mail de pessoa convidada        | Controlar quem pode criar conta     | [A DEFINIR] | Postgres (`signup_allowlist`) | [A DEFINIR]             | 1            |

## Fornecedores

| Fornecedor                 | Papel                          | Dados compartilhados                | Local                               | Contrato e transferência internacional |
| -------------------------- | ------------------------------ | ----------------------------------- | ----------------------------------- | -------------------------------------- |
| Vercel                     | Hospedagem da aplicação        | Requisições e logs de acesso        | Funções em `gru1`, São Paulo (D-04) | [A VERIFICAR]                          |
| Supabase                   | Banco de dados e autenticação  | Todos os dados do titular           | `sa-east-1`, São Paulo (D-04)       | [A VERIFICAR]                          |
| GitHub                     | Código-fonte e CI              | Nenhum dado pessoal de titulares    | Não se aplica                       | Não se aplica                          |
| Provedor de IA             | Interpretar mensagens (Fase 5) | Texto da mensagem e contexto mínimo | [A DEFINIR] (D-27)                  | [A VERIFICAR]                          |
| Provedor de e-mail         | E-mails de conta (produção)    | E-mail do titular                   | [A DEFINIR] (D-13)                  | [A VERIFICAR]                          |
| WhatsApp Business Platform | Canal de conversa (Fase 7)     | Número de telefone e mensagens      | [A DEFINIR]                         | [A VERIFICAR]                          |

As regiões da Vercel e do Supabase valem a partir da criação dos projetos. A região do Supabase é
escolhida na criação do projeto e precisa ser `sa-east-1`. Mesmo com a região em São Paulo, os
dois fornecedores podem processar metadados e logs fora do Brasil: confirmar nos contratos.

## Direitos do titular

| Direito (SDD §7.4)             | Como será atendido                                                            | Fase  |
| ------------------------------ | ----------------------------------------------------------------------------- | ----- |
| Consultar os dados             | As próprias telas do aplicativo                                               | 1 a 4 |
| Corrigir                       | Edição de perfil e de cada registro                                           | 1 e 2 |
| Exportar                       | Exportação completa dos dados                                                 | 6     |
| Excluir                        | Exclusão de conta, definitiva e em cascata                                    | 1     |
| Revogar consentimento          | Não se aplica por enquanto: nenhum tratamento depende de consentimento (D-15) | —     |
| Informações sobre o tratamento | Política de Privacidade                                                       | 8     |

## Pendências

- Definir a base legal de cada tratamento.
- Definir prazos de retenção e o tratamento de backups na exclusão de conta.
- Política de Privacidade, Termos de Uso, Política de Retenção, processo de atendimento a
  titulares e procedimento de resposta a incidentes (Fase 8).
- Avaliar a necessidade de RIPD (Fase 8).
- O cadastro permanece fechado até a conclusão desses itens (D-12).
- Definir o que acontece com o e-mail na lista de autorizados quando a conta é excluída: hoje
  ele permanece, e a pessoa pode criar conta de novo.
- Definir a retenção dos eventos de auditoria; hoje duram enquanto a conta existir.
