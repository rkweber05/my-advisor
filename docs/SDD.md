# MEU ADVISOR — Software Design & Specification (SDD)

> Transcrição da especificação v1.0 entregue pelo proprietário do projeto. É a fonte de verdade
> dos requisitos. Não alterar sem aprovação; pontos em aberto e propostas de ajuste ficam em
> [ANALISE-SDD.md](ANALISE-SDD.md) e [decisions/README.md](decisions/README.md).

- **Versão:** 1.0
- **Status:** Planejamento inicial
- **Tipo:** Aplicação web de gestão financeira pessoal
- **Idioma:** Português brasileiro (pt-BR)
- **Moeda padrão:** BRL (R$)
- **Timezone padrão:** America/Sao_Paulo

---

## 1. VISÃO DO PRODUTO

### 1.1. Objetivo

O Meu Advisor é uma aplicação web de gestão financeira pessoal que permite ao usuário registrar receitas e despesas, acompanhar sua vida financeira, visualizar indicadores, organizar seu orçamento e receber recomendações inteligentes.

O sistema terá como principal diferencial a possibilidade de registrar movimentações financeiras utilizando linguagem natural, por meio de uma interface conversacional.

Exemplo:

> "Gastei R$ 150 no posto Ipiranga com gasolina, paguei no cartão de crédito Nubank."

O sistema deverá interpretar a mensagem, identificar as informações relevantes, solicitar dados faltantes quando necessário e registrar a movimentação após validação.

Futuramente, o mesmo mecanismo poderá funcionar pelo WhatsApp, incluindo mensagens de texto e áudio.

### 1.2. Público inicial

O primeiro usuário será o próprio proprietário do projeto.

Entretanto, a arquitetura deverá ser preparada para suportar múltiplos usuários, com isolamento completo dos dados financeiros.

Não implementar funcionalidades complexas de administração de clientes ou cobrança nesta primeira versão.

### 1.3. Objetivos do MVP

- Centralizar receitas e despesas.
- Registrar movimentações financeiras.
- Controlar diferentes formas de pagamento.
- Gerenciar cartões e instituições financeiras.
- Visualizar indicadores em dashboard.
- Acompanhar despesas por categoria.
- Organizar orçamento mensal.
- Definir metas financeiras.
- Estimar capacidade mensal de poupança e investimento.
- Oferecer recomendações baseadas nos dados registrados.

---

## 2. STACK TECNOLÓGICA

### 2.1. Frontend

- Next.js (App Router).
- React.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- Lucide Icons.
- Recharts para gráficos.
- React Hook Form.
- Zod para validação.

### 2.2. Backend

Utilizar Next.js como aplicação full-stack.

- Route Handlers para endpoints HTTP.
- Server Actions quando apropriado.
- Serviços separados para regras de negócio.
- Validação server-side.
- Middleware apenas para funcionalidades adequadas ao middleware, nunca como única camada de autorização.

### 2.3. Banco de dados

- PostgreSQL.
- Supabase.
- Supabase Auth.
- Row Level Security (RLS).
- Migrations SQL versionadas.

### 2.4. Infraestrutura

- Vercel para hospedagem.
- Domínio próprio já disponível.
- GitHub para versionamento.
- Vercel Preview Deployments.
- Vercel Production Deployment.
- Supabase para banco de dados e autenticação.

### 2.5. Testes

- Vitest para testes unitários.
- Testing Library para componentes.
- Playwright para testes E2E.
- Testes de integração para serviços e banco de dados.
- Testes específicos de autorização e isolamento entre usuários.

### 2.6. Regras de desenvolvimento

- TypeScript strict obrigatório.
- Evitar utilização de any.
- Não duplicar regras de negócio.
- Não colocar cálculos financeiros diretamente nos componentes.
- Separar interface, serviços, validações e acesso aos dados.
- Componentes reutilizáveis.
- Código modular.
- Documentar decisões arquiteturais relevantes.
- Todas as alterações de banco devem possuir migrations.
- Não utilizar dados mockados em produção.

---

## 3. ARQUITETURA DO SISTEMA

### 3.1. Organização arquitetural

Adotar uma arquitetura modular, organizada por domínio de negócio.

Estrutura inicial sugerida:

```
meu-advisor/
│
├── docs/
│   ├── SDD.md
│   ├── ARCHITECTURE.md
│   ├── SECURITY.md
│   ├── LGPD.md
│   ├── DATABASE.md
│   ├── ROADMAP.md
│   └── decisions/
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── transactions/
│   │   │   ├── categories/
│   │   │   ├── accounts/
│   │   │   ├── cards/
│   │   │   ├── planning/
│   │   │   ├── goals/
│   │   │   ├── reports/
│   │   │   ├── advisor/
│   │   │   └── settings/
│   │   │
│   │   └── api/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── charts/
│   │   └── forms/
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── transactions/
│   │   ├── categories/
│   │   ├── accounts/
│   │   ├── cards/
│   │   ├── dashboard/
│   │   ├── planning/
│   │   ├── goals/
│   │   ├── reports/
│   │   └── advisor/
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   ├── validations/
│   │   ├── security/
│   │   ├── formatters/
│   │   └── utils/
│   │
│   ├── services/
│   ├── types/
│   └── config/
│
├── supabase/
│   ├── migrations/
│   └── seed.sql
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

A estrutura deverá evoluir conforme a necessidade real do projeto. Não criar abstrações complexas sem justificativa.

---

## 4. MÓDULOS FUNCIONAIS

### MODULE 01 — AUTENTICAÇÃO

**Objetivo**

Garantir que cada usuário tenha acesso somente à própria conta e aos próprios dados.

**Funcionalidades**

- Login por e-mail e senha.
- Cadastro de usuário.
- Recuperação de senha.
- Logout.
- Gerenciamento de sessão.
- Proteção das rotas privadas.
- Configuração de perfil.

**Requisitos**

- **AUTH-001:** O sistema deve permitir autenticação segura.
- **AUTH-002:** O sistema deve proteger todas as páginas privadas.
- **AUTH-003:** A sessão deve ser validada no servidor.
- **AUTH-004:** O sistema deve impedir acesso a dados de outros usuários.
- **AUTH-005:** O usuário poderá solicitar exclusão da própria conta.
- **AUTH-006:** As políticas RLS devem impedir consultas não autorizadas mesmo quando alguém tentar acessar diretamente o banco por uma credencial pública.

**Critérios de aceite**

- Usuário não autenticado não acessa o dashboard.
- Sessão expirada não permite operações privadas.
- Usuário A não consegue consultar dados do usuário B.
- Recuperação de senha funciona.
- Logout invalida a sessão adequadamente.

---

### MODULE 02 — DASHBOARD FINANCEIRO

**Objetivo**

Apresentar uma visão consolidada da situação financeira do usuário.

**Indicadores principais**

1. Receitas do mês.
2. Despesas do mês.
3. Saldo do período.
4. Capacidade estimada de poupança.
5. Total de despesas por categoria.
6. Evolução financeira mensal.
7. Comparação com o mês anterior.
8. Principais formas de pagamento.

**Componentes visuais**

- Cards financeiros.
- Gráfico de receitas versus despesas.
- Gráfico de distribuição de despesas.
- Lista de principais gastos.
- Últimas movimentações.
- Alertas financeiros.
- Recomendações do Advisor.

**Requisitos**

- **DASH-001:** O dashboard deve respeitar o período selecionado.
- **DASH-002:** Todos os valores devem ser calculados a partir dos dados persistidos.
- **DASH-003:** Deve existir filtro mensal.
- **DASH-004:** O usuário deve conseguir visualizar os gastos por categoria.
- **DASH-005:** O sistema deve diferenciar despesas realizadas de receitas recebidas.
- **DASH-006:** O dashboard não deve apresentar dados de terceiros.
- **DASH-007:** Deve existir estado vazio para usuários sem movimentações.

**Dados ilustrativos para desenvolvimento**

- Receita mensal: R$ 6.500,00.
- Despesas: R$ 4.230,00.
- Saldo: R$ 2.270,00.
- Capacidade estimada de investimento: R$ 800,00.

Todos os valores deverão ser identificados como dados fictícios no ambiente de demonstração.

---

### MODULE 03 — LANÇAMENTOS FINANCEIROS

**Objetivo**

Permitir o registro e gerenciamento de receitas e despesas.

**Tipos de movimentação**

- Receita.
- Despesa.
- Transferência entre contas.

**Informações de uma movimentação**

- ID.
- User ID.
- Tipo.
- Descrição.
- Valor.
- Categoria.
- Data da movimentação.
- Forma de pagamento.
- Conta relacionada.
- Cartão relacionado, quando aplicável.
- Status.
- Observações.
- Data de criação.
- Data de atualização.

**Formas de pagamento**

- Pix.
- Dinheiro.
- Cartão de crédito.
- Cartão de débito.
- Transferência bancária.
- Boleto.
- Outros.

**Funcionalidades**

- Criar movimentação.
- Editar movimentação.
- Excluir movimentação.
- Consultar histórico.
- Filtrar por categoria.
- Filtrar por período.
- Filtrar por forma de pagamento.
- Pesquisar por descrição.

**Requisitos**

- **TRANS-001:** Todo lançamento deve pertencer a um usuário.
- **TRANS-002:** O valor deve ser positivo.
- **TRANS-003:** A categoria deve pertencer ao usuário ou ser uma categoria padrão disponibilizada pelo sistema.
- **TRANS-004:** A movimentação deve possuir data.
- **TRANS-005:** O sistema deve permitir edição e exclusão.
- **TRANS-006:** O sistema deve armazenar valores monetários sem utilizar ponto flutuante para cálculos financeiros.
- **TRANS-007:** O sistema deve evitar duplicação acidental de lançamentos.
- **TRANS-008:** Toda operação deve validar autorização no servidor.

**Regra financeira importante**

Uma compra realizada no cartão de crédito deve ser registrada como despesa no momento da compra.

O pagamento posterior da fatura não pode gerar uma segunda despesa.

O pagamento da fatura deve ser tratado como liquidação de uma obrigação financeira, evitando duplicidade nos indicadores.

Transferências entre contas próprias também não devem ser contabilizadas como receita ou despesa.

Parcelamentos e controle completo de faturas poderão ser implementados em uma etapa posterior.

---

### MODULE 04 — CONTAS E CARTÕES

**Objetivo**

Permitir que o usuário organize suas instituições financeiras e meios de pagamento.

**Contas**

Exemplos:

- Nubank.
- Inter.
- Itaú.
- Dinheiro em espécie.

**Cartões**

Informações:

- Nome do cartão.
- Instituição.
- Bandeira.
- Limite informado pelo usuário.
- Dia de fechamento.
- Dia de vencimento.
- Ativo/inativo.

Não armazenar número completo, CVV, senha ou credenciais bancárias.

**Requisitos**

- O usuário pode cadastrar várias contas.
- O usuário pode cadastrar vários cartões.
- O usuário pode associar despesas aos respectivos cartões.
- O sistema pode apresentar gastos por cartão.
- O usuário pode editar ou desativar cartões.

---

### MODULE 05 — CATEGORIAS

**Objetivo**

Organizar automaticamente as movimentações.

**Categorias iniciais**

Despesas:

- Alimentação.
- Moradia.
- Transporte.
- Combustível.
- Saúde.
- Educação.
- Lazer.
- Assinaturas.
- Compras.
- Viagens.
- Contas e serviços.
- Outros.

Receitas:

- Salário.
- Freelance.
- Rendimentos.
- Vendas.
- Outros.

**Requisitos**

- Categorias padrão.
- Categorias personalizadas.
- Identificação de receitas e despesas.
- Associação de categoria à movimentação.
- Possibilidade de editar categorias.

---

### MODULE 06 — PLANEJAMENTO FINANCEIRO

**Objetivo**

Permitir que o usuário informe quanto ganha, quais são seus compromissos e quanto pode gastar.

**Dados necessários**

- Renda mensal líquida.
- Outras fontes de renda.
- Despesas fixas.
- Compromissos financeiros.
- Dívidas.
- Objetivos mensais.

**Funcionalidades**

- Cadastro de renda.
- Cadastro de despesas recorrentes.
- Planejamento mensal.
- Orçamento por categoria.
- Comparação entre orçamento planejado e realizado.
- Estimativa de saldo restante.

**Exemplo**

- Renda: R$ 6.500,00.
- Despesas fixas: R$ 2.500,00.
- Despesas variáveis planejadas: R$ 1.500,00.
- Reserva financeira planejada: R$ 1.000,00.
- Margem restante: R$ 1.500,00.

**Requisitos**

- **PLAN-001:** O sistema deve diferenciar valores planejados de valores efetivamente realizados.
- **PLAN-002:** O orçamento deve ser mensal.
- **PLAN-003:** O sistema deve apresentar desvios entre planejamento e realidade.
- **PLAN-004:** O usuário deve conseguir alterar seus objetivos.
- **PLAN-005:** O cálculo deve considerar compromissos financeiros futuros cadastrados.

---

### MODULE 07 — METAS FINANCEIRAS

**Objetivo**

Permitir que o usuário defina objetivos financeiros.

**Exemplos**

- Reserva de emergência.
- Viagem.
- Compra de veículo.
- Compra de imóvel.
- Investimentos.
- Objetivos personalizados.

**Informações**

- Nome da meta.
- Valor desejado.
- Valor acumulado.
- Prazo.
- Data de criação.
- Status.

**Requisitos**

- Criar metas.
- Editar metas.
- Acompanhar progresso.
- Registrar contribuições.
- Visualizar percentual concluído.

---

### MODULE 08 — MEU ADVISOR (INTELIGÊNCIA FINANCEIRA)

**Objetivo**

Criar um assistente que interprete mensagens e gere recomendações com base nas informações financeiras do usuário.

**Primeira versão**

O usuário poderá registrar despesas por texto dentro do aplicativo.

Exemplo:

> "Gastei 150 reais de gasolina no cartão Nubank."

A IA deverá identificar:

- Valor: 150.
- Categoria: Combustível.
- Tipo: Despesa.
- Pagamento: Crédito.
- Instituição: Nubank.
- Descrição: Gasolina.

**Fluxo**

1. Usuário envia mensagem.
2. Backend recebe a mensagem.
3. Serviço de IA interpreta o conteúdo.
4. IA retorna informações estruturadas.
5. Backend valida os dados.
6. Se houver informações ambíguas, solicitar confirmação.
7. Registrar a movimentação após confirmação.
8. Atualizar o dashboard.

**Requisitos**

- **AI-001:** A IA não pode registrar transações sem validação do backend.
- **AI-002:** A IA deve retornar dados estruturados.
- **AI-003:** A IA não pode inventar valores ou informações ausentes.
- **AI-004:** O usuário deve confirmar movimentações ambíguas.
- **AI-005:** O sistema deve permitir corrigir informações interpretadas incorretamente.
- **AI-006:** A IA deve utilizar somente os dados necessários para responder à solicitação.
- **AI-007:** O sistema deve impedir que instruções contidas em mensagens do usuário alterem regras internas ou permissões.

**Consultas futuras**

- Quanto gastei este mês?
- Quanto gastei com alimentação?
- Qual foi meu maior gasto?
- Quanto posso gastar até o final do mês?
- Quanto consigo reservar para investimentos?

**Recomendações**

- Identificação de categorias com aumento de despesas.
- Comparação entre períodos.
- Identificação de gastos recorrentes.
- Sugestões de economia.
- Estimativa de capacidade de poupança.

A IA não deverá indicar investimentos específicos, prometer rentabilidade ou apresentar estimativas como garantias.

Os cálculos financeiros serão executados por serviços determinísticos do backend.

---

### MODULE 09 — RELATÓRIOS

**Objetivo**

Disponibilizar informações detalhadas sobre a evolução financeira.

**Relatórios**

- Receitas mensais.
- Despesas mensais.
- Gastos por categoria.
- Gastos por cartão.
- Gastos por instituição.
- Gastos por forma de pagamento.
- Comparativo mensal.
- Histórico de movimentações.

Futuramente:

- Exportação CSV.
- Exportação PDF.
- Relatórios anuais.

---

## 5. BANCO DE DADOS

### 5.1. Entidades iniciais

Estruturar o banco com as seguintes tabelas:

**profiles**

- id
- user_id
- name
- currency
- timezone
- created_at
- updated_at

**transactions**

- id
- user_id
- type
- description
- amount
- category_id
- account_id
- card_id
- payment_method
- transaction_date
- status
- notes
- created_at
- updated_at

**categories**

- id
- user_id (nullable para categorias globais)
- name
- type
- icon
- color
- created_at

**accounts**

- id
- user_id
- name
- institution
- account_type
- initial_balance
- is_active
- created_at

**cards**

- id
- user_id
- account_id
- name
- institution
- credit_limit
- closing_day
- due_day
- is_active
- created_at

**incomes**

- id
- user_id
- description
- amount
- frequency
- payment_date
- is_active

**recurring_expenses**

- id
- user_id
- description
- amount
- category_id
- frequency
- next_due_date
- is_active

**budgets**

- id
- user_id
- category_id
- amount
- month
- year

**financial_goals**

- id
- user_id
- name
- target_amount
- current_amount
- target_date
- status

**ai_conversations**

- id
- user_id
- message
- response
- created_at

A persistência de mensagens deverá ser limitada ao necessário, com política de retenção configurável. Não armazenar conversas financeiras indefinidamente sem justificativa.

**Observações de modelagem**

- Utilizar UUID para identificadores.
- Utilizar NUMERIC/DECIMAL para valores monetários.
- Definir foreign keys.
- Criar índices para consultas por usuário e período.
- Criar políticas RLS em todas as tabelas que contenham dados pessoais.
- Criar migrations versionadas.
- Garantir integridade referencial.
- Não permitir que user_id seja definido livremente pelo frontend.

A tabela de movimentações deverá ser a fonte principal dos registros efetivos. Receitas recorrentes e despesas recorrentes serão configurações de planejamento, não movimentações automaticamente duplicadas.

---

## 6. SEGURANÇA DA INFORMAÇÃO

Este é um requisito crítico do projeto.

O Meu Advisor trabalhará com informações financeiras pessoais. Portanto, segurança deverá ser aplicada desde a primeira migration.

### 6.1. Autorização e isolamento

- **SEC-001:** Todas as entidades financeiras devem possuir user_id.
- **SEC-002:** Todas as consultas devem respeitar o usuário autenticado.
- **SEC-003:** RLS deve estar habilitado em todas as tabelas privadas.
- **SEC-004:** Políticas SELECT, INSERT, UPDATE e DELETE devem ser definidas individualmente.
- **SEC-005:** Operações devem validar o usuário autenticado no servidor.
- **SEC-006:** Não confiar no user_id recebido do frontend.
- **SEC-007:** Não utilizar a service_role key no navegador.
- **SEC-008:** Testar tentativas de acesso cruzado entre dois usuários.

### 6.2. Segredos e credenciais

- Utilizar variáveis de ambiente.
- Criar .env.example sem valores reais.
- Não versionar .env.
- Não expor tokens em logs.
- Não expor chaves administrativas.
- Não enviar credenciais para a IA.
- Não armazenar senhas bancárias.

### 6.3. Proteção de APIs

- Validar todas as entradas.
- Aplicar rate limiting.
- Proteger endpoints contra abuso.
- Implementar proteção CSRF quando aplicável.
- Utilizar cookies seguros para sessões.
- Aplicar headers de segurança.
- Limitar tamanho de payload.
- Sanitizar informações apresentadas na interface.
- Implementar tratamento seguro de erros.

### 6.4. Auditoria

Registrar eventos relevantes:

- Login.
- Logout.
- Criação de movimentação.
- Alteração de movimentação.
- Exclusão de movimentação.
- Alteração de configurações.
- Solicitação de exclusão de conta.

Não registrar valores financeiros ou conteúdo de conversas em logs técnicos sem necessidade.

### 6.5. Proteção contra vazamento

- Separação entre desenvolvimento, staging e produção.
- Banco de dados de produção independente.
- Proibição de utilizar dados reais em testes.
- Dados fictícios para demonstrações.
- Revisão de permissões.
- Backups protegidos.
- Testes de autorização.
- Monitoramento de erros sem exposição de dados pessoais.

---

## 7. LGPD E PRIVACIDADE

O projeto deverá ser desenvolvido considerando a Lei Geral de Proteção de Dados (Lei 13.709/2018).

### 7.1. Princípios

- Finalidade.
- Adequação.
- Necessidade.
- Livre acesso.
- Qualidade dos dados.
- Transparência.
- Segurança.
- Prevenção.
- Não discriminação.
- Responsabilização.

### 7.2. Dados coletados

Coletar somente o necessário:

- Nome.
- E-mail.
- Dados financeiros informados pelo usuário.
- Histórico de receitas e despesas.
- Preferências de utilização.

Não coletar dados pessoais sem finalidade definida.

### 7.3. Consentimento e bases legais

Antes da produção, documentar a finalidade de cada tratamento e a respectiva base legal aplicável.

Não presumir que consentimento é a única base legal possível.

Quando houver consentimento, registrar sua versão, finalidade, data e possibilidade de revogação.

### 7.4. Direitos do titular

O sistema deverá permitir:

- Consultar os dados pessoais.
- Solicitar correção.
- Solicitar exportação.
- Solicitar exclusão.
- Revogar consentimentos quando aplicável.
- Consultar informações sobre o tratamento.

### 7.5. Exclusão de conta

Criar fluxo de solicitação de exclusão.

O fluxo deverá:

1. Confirmar a identidade do usuário.
2. Solicitar confirmação explícita.
3. Revogar sessões.
4. Excluir ou anonimizar os dados conforme a política de retenção e as obrigações legais aplicáveis.
5. Tratar backups de acordo com política documentada.
6. Registrar a conclusão do processo.

### 7.6. Fornecedores externos

Avaliar os fornecedores utilizados:

- Vercel.
- Supabase.
- Provedor de IA.
- Futuramente, WhatsApp Business Platform.

Documentar:

- Quais dados são compartilhados.
- Finalidade do compartilhamento.
- Localização do processamento e armazenamento.
- Política de retenção.
- Condições contratuais.
- Mecanismos de transferência internacional, quando aplicáveis.

Não enviar dados financeiros completos para provedores de IA quando uma mensagem minimizada for suficiente.

### 7.7. Documentação obrigatória

Criar:

- Política de Privacidade.
- Termos de Uso.
- Política de Retenção.
- Registro das operações de tratamento.
- Processo de atendimento aos titulares.
- Procedimento de resposta a incidentes.

Avaliar a necessidade de um Relatório de Impacto à Proteção de Dados Pessoais (RIPD), considerando os riscos e as operações efetivamente realizadas.

A documentação deverá ser revisada juridicamente antes da disponibilização pública.

---

## 8. EXPERIÊNCIA DO USUÁRIO (UI/UX)

### 8.1. Identidade

- **Nome:** Meu Advisor.
- **Posicionamento:** Seu dinheiro, sob controle.

Estilo visual:

- Moderno.
- Minimalista.
- Profissional.
- Inspirado em fintechs.
- Interface responsiva.
- Boa experiência em desktop e mobile.

### 8.2. Navegação principal

Menu lateral:

1. Dashboard.
2. Meus lançamentos.
3. Planejamento.
4. Metas.
5. Relatórios.
6. Dicas do Advisor.
7. Configurações.

### 8.3. Dashboard

Exibir:

- Saudação personalizada.
- Filtro de período.
- Cards financeiros.
- Gráfico de evolução.
- Gastos por categoria.
- Principais despesas.
- Metas.
- Recomendações.
- Últimas movimentações.

### 8.4. Responsividade

O sistema deverá funcionar em:

- Desktop.
- Notebook.
- Tablet.
- Smartphones.

Priorizar uma experiência de navegação simples em telas pequenas.

---

## 9. INTEGRAÇÕES FUTURAS

Não implementar no MVP, mas preparar a arquitetura para evolução.

### 9.1. WhatsApp

Integração futura com WhatsApp Business Platform oficial.

Funcionalidades previstas:

- Receber mensagens.
- Receber áudios.
- Transcrever áudio.
- Interpretar despesas.
- Consultar informações financeiras.
- Confirmar movimentações.
- Responder com resumos.

O webhook deverá validar a autenticidade das requisições, impedir processamento duplicado e associar cada número a uma conta verificada.

Não permitir acesso financeiro apenas pela informação de um número de telefone sem processo de vinculação e autenticação.

### 9.2. Inteligência artificial

Criar uma camada independente do fornecedor de IA.

Exemplo:

`AIProvider`

- `interpretTransaction()`
- `classifyCategory()`
- `generateFinancialInsights()`
- `answerFinancialQuestion()`

O sistema deverá permitir trocar de fornecedor sem reescrever as regras financeiras.

### 9.3. Open Finance

Possibilidade futura de integração com instituições financeiras por meio de provedores autorizados e mecanismos oficiais.

Exigências:

- Consentimento adequado.
- Segurança.
- Revogação de acesso.
- Minimização de dados.
- Gestão de tokens.
- Conformidade regulatória.

Não armazenar credenciais bancárias do usuário.

---

## 10. PLANO DE DESENVOLVIMENTO — ROADMAP

O desenvolvimento será dividido em fases independentes.

Cada fase deverá possuir especificação, implementação, testes e validação.

### FASE 0 — FOUNDATION

Objetivo: estruturar o projeto.

Atividades:

- Criar repositório.
- Inicializar Next.js.
- Configurar TypeScript strict.
- Configurar Tailwind.
- Configurar shadcn/ui.
- Configurar Supabase.
- Configurar variáveis de ambiente.
- Configurar lint e formatação.
- Configurar Vitest.
- Configurar Playwright.
- Configurar migrations.
- Criar documentação inicial.
- Configurar Vercel Preview.

Critério de conclusão:

Aplicação funcionando localmente e deploy de preview concluído.

### FASE 1 — AUTHENTICATION

Objetivo: implementar autenticação e isolamento.

Atividades:

- Cadastro.
- Login.
- Logout.
- Recuperação de senha.
- Perfil.
- Proteção de rotas.
- Políticas RLS.
- Testes de isolamento.

Critério de conclusão:

Usuário autenticado acessa exclusivamente os próprios dados.

### FASE 2 — CORE FINANCE

Objetivo: implementar o núcleo financeiro.

Atividades:

- Categorias.
- Contas.
- Cartões.
- Receitas.
- Despesas.
- Transferências.
- Histórico.
- Edição.
- Exclusão.
- Filtros.

Critério de conclusão:

O usuário consegue controlar suas movimentações financeiras sem depender de IA.

### FASE 3 — DASHBOARD

Objetivo: apresentar os indicadores financeiros.

Atividades:

- Cards de receitas e despesas.
- Saldo.
- Gráficos.
- Gastos por categoria.
- Comparação mensal.
- Principais despesas.
- Histórico recente.

Critério de conclusão:

Indicadores calculados corretamente a partir dos registros persistidos.

### FASE 4 — PLANEJAMENTO E METAS

Objetivo: organizar o futuro financeiro.

Atividades:

- Cadastro de renda.
- Despesas recorrentes.
- Orçamentos.
- Metas.
- Capacidade de poupança.
- Capacidade estimada de investimento.

Critério de conclusão:

Usuário consegue planejar seu mês e comparar o planejado com o realizado.

### FASE 5 — MEU ADVISOR AI

Objetivo: adicionar interpretação de linguagem natural.

Atividades:

- Criar camada de integração com IA.
- Criar schemas de resposta.
- Implementar interpretação de despesas.
- Implementar confirmação de lançamentos.
- Criar histórico conversacional com retenção definida.
- Implementar consultas financeiras.
- Implementar recomendações.

Critério de conclusão:

Usuário consegue registrar e consultar movimentações por conversa, com validação e autorização no backend.

### FASE 6 — RELATÓRIOS

Objetivo: oferecer visão detalhada da evolução financeira.

Atividades:

- Relatórios mensais.
- Comparação anual.
- Filtros avançados.
- Exportação CSV.
- Exportação PDF.

Critério de conclusão:

Relatórios consistentes e protegidos por usuário.

### FASE 7 — WHATSAPP

Objetivo: permitir interação externa.

Atividades:

- Configurar WhatsApp Business Platform.
- Implementar webhook.
- Vincular número à conta.
- Implementar recebimento de texto.
- Implementar recebimento de áudio.
- Implementar transcrição.
- Integrar com serviço de IA.
- Registrar movimentações.
- Implementar idempotência.
- Implementar monitoramento.

Critério de conclusão:

Usuário consegue enviar uma mensagem pelo WhatsApp e visualizar o registro no aplicativo web.

### FASE 8 — PRODUCTION HARDENING

Objetivo: preparar o sistema para produção e eventual expansão comercial.

Atividades:

- Revisão de segurança.
- Revisão LGPD.
- Testes de autorização.
- Testes de carga.
- Revisão de performance.
- Backup e recuperação.
- Monitoramento.
- Política de privacidade.
- Termos de uso.
- Configuração de domínio.
- Configuração de produção.
- Plano de resposta a incidentes.

Critério de conclusão:

Todos os requisitos críticos de segurança, privacidade, funcionamento e recuperação aprovados.

---

## 11. CI/CD E DEPLOY

### Ambientes

Desenvolvimento:

- Execução local.
- Banco de desenvolvimento.
- Dados fictícios.

Preview:

- Deploy automático de branches e pull requests.
- Configuração isolada.
- Validação de funcionalidades.

Produção:

- Domínio próprio.
- Banco de produção.
- Variáveis exclusivas.
- Backups.
- Monitoramento.

### Pipeline

Ao abrir um Pull Request:

1. Instalar dependências.
2. Executar lint.
3. Executar TypeScript check.
4. Executar testes unitários.
5. Executar testes de integração.
6. Validar migrations.
7. Executar testes E2E críticos.
8. Gerar Preview Deployment.

A produção somente deverá receber alterações após aprovação.

Não executar migrations destrutivas automaticamente sem revisão e estratégia de rollback.

---

## 12. DEFINITION OF DONE

Uma funcionalidade somente será considerada concluída quando:

- [ ] Requisitos implementados.
- [ ] Validações frontend implementadas.
- [ ] Validações backend implementadas.
- [ ] Autorização verificada.
- [ ] RLS revisado.
- [ ] Testes unitários aprovados.
- [ ] Testes de integração aprovados.
- [ ] Testes E2E necessários aprovados.
- [ ] Responsividade validada.
- [ ] Tratamento de erros implementado.
- [ ] Documentação atualizada.
- [ ] Nenhum segredo exposto.
- [ ] Nenhum dado de outro usuário acessível.
- [ ] Preview validado.
- [ ] Aprovação antes de produção.

---

## 13. REGRAS PARA O CLAUDE CODE

Você atuará como engenheiro de software responsável por auxiliar no planejamento e implementação do Meu Advisor.

Respeite obrigatoriamente as seguintes regras:

1. Não implemente todo o sistema de uma única vez.
2. Não avance para outra fase sem concluir e validar a atual.
3. Leia a documentação existente antes de modificar o projeto.
4. Antes de implementar um módulo, produza sua especificação técnica.
5. Apresente os arquivos que serão criados ou alterados.
6. Explique as decisões arquiteturais relevantes.
7. Implemente testes junto com as funcionalidades.
8. Não utilize dados reais para testes.
9. Não desative políticas RLS para facilitar o desenvolvimento.
10. Não utilize credenciais administrativas no frontend.
11. Não invente requisitos que não foram aprovados.
12. Quando existir ambiguidade, apresente as alternativas antes de implementar.
13. Mantenha documentação atualizada.
14. Não considere uma funcionalidade concluída apenas porque a interface está pronta.
15. Priorize segurança, integridade financeira e privacidade.

### Processo obrigatório por funcionalidade

Para cada módulo:

**ETAPA A — SPECIFICATION**

- Entender o requisito.
- Identificar regras de negócio.
- Identificar entidades envolvidas.
- Identificar riscos.
- Definir critérios de aceite.

**ETAPA B — PLANNING**

- Definir arquitetura.
- Definir alterações no banco.
- Definir endpoints.
- Definir componentes.
- Definir testes.
- Estimar complexidade.

**ETAPA C — IMPLEMENTATION**

- Implementar em pequenas entregas.
- Criar migrations.
- Implementar validações.
- Implementar testes.
- Atualizar documentação.

**ETAPA D — VALIDATION**

- Executar testes.
- Validar segurança.
- Validar experiência.
- Corrigir problemas.
- Apresentar resultado.

**ETAPA E — APPROVAL**

Aguardar aprovação antes de iniciar o próximo módulo.

---

## 14. PRIMEIRA MISSÃO DO CLAUDE CODE

Neste primeiro momento, NÃO desenvolver o sistema completo.

Sua missão inicial será:

1. Analisar esta especificação.
2. Identificar requisitos ausentes ou conflitantes.
3. Avaliar a arquitetura proposta.
4. Identificar riscos técnicos e de segurança.
5. Sugerir melhorias necessárias.
6. Criar um documento de arquitetura.
7. Criar um roadmap técnico detalhado.
8. Criar a estrutura inicial do projeto.
9. Preparar a FASE 0.
10. Apresentar as decisões que precisam de aprovação.

Não iniciar módulos financeiros antes de concluir a estrutura inicial e validar as decisões arquiteturais.

O objetivo é construir uma aplicação sustentável, segura, testável e preparada para crescer.

---

## 15. VISÃO DE LONGO PRAZO

O Meu Advisor deverá evoluir de um sistema pessoal de controle financeiro para uma plataforma de gestão financeira inteligente.

Possíveis evoluções:

- Aplicativo mobile.
- Integração com WhatsApp.
- Reconhecimento de áudio.
- Open Finance.
- Controle compartilhado entre pessoas.
- Relatórios inteligentes.
- Assistente financeiro personalizado.
- Planos de assinatura.
- Gestão de múltiplos perfis.

Entretanto, todas essas evoluções deverão respeitar a arquitetura modular, o isolamento de dados e a privacidade dos usuários.

**PRINCÍPIO CENTRAL DO PRODUTO:**

O Meu Advisor não deve apenas mostrar quanto o usuário gastou. Deve ajudá-lo a compreender sua situação financeira, planejar melhor e tomar decisões mais conscientes.
