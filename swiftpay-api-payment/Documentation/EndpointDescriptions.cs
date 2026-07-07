namespace swiftpay_api_payment.Documentation;

/// <summary>
/// Documentação centralizada dos endpoints da API.
/// Mantém as descrições detalhadas separadas do código dos endpoints.
/// </summary>
public static partial class EndpointDescriptions
{
    /// <summary>
    /// Descrição geral da API para o OpenAPI Document.
    /// </summary>
    public const string ApiDescription = @"
## 🚀 Introdução

**Seu parceiro financeiro de confiança.**

Nós somos a SwiftPay, uma plataforma especializada em soluções de pagamento PIX. Com um serviço personalizado e focado nas suas necessidades, estamos prontos para apoiar sua empresa em cada etapa do processo.

- ✅ Conte com o **PIX** como método de pagamento rápido, seguro e alinhado com as melhores práticas de conformidade e prevenção a fraudes.
- 📊 Gerencie suas finanças de forma simples e acessível por meio de uma interface completa e intuitiva.
- 💬 Nosso time de suporte está sempre disponível para oferecer um atendimento exclusivo e eficiente.

## 🤔 Precisa de Ajuda?

A equipe da SwiftPay quer garantir que sua integração seja um sucesso. Se tiver dúvidas ou precisar de suporte, não hesite em nos contatar:

📩 **suporte@swiftpay.com.br**

---

## 💰 Valores Monetários

Todos os valores monetários são representados em **centavos** (menor unidade da moeda).

| Valor Real | Valor na API |
|------------|--------------|
| R$ 1,00    | 100          |
| R$ 10,50   | 1050         |
| R$ 100,00  | 10000        |
";

    /// <summary>
    /// Documentação do endpoint de autenticação.
    /// </summary>
    public static class Auth
    {
        public const string Token = @"
Autentica sua aplicação usando as credenciais de API (`publicKey` e `secretKey`) e retorna um **access token JWT** para uso nas demais requisições.

### 📋 Fluxo de Autenticação

1. **Obtenha suas credenciais**: Acesse o painel SwiftPay e crie uma credencial de API
2. **Solicite o token**: Faça uma requisição `POST` para este endpoint
3. **Use o token**: Inclua o token no header `Authorization: Bearer {token}`
4. **Renove antes de expirar**: O token expira em **1 hora (3600 segundos)**

### 🌐 Ambientes

| Ambiente | Descrição |
|----------|----------|
| **Sandbox** | Use credenciais de sandbox para testes. Pagamentos são simulados. |
| **Production** | Use credenciais de produção para transações reais via PIX. |

### 🔒 Boas Práticas de Segurança

- ⚠️ **Nunca exponha** suas credenciais no frontend ou código-fonte público
- 🔐 Armazene o `clientSecret` de forma segura (variáveis de ambiente, vault, etc.)
- 🔄 Renove o token antes da expiração para evitar interrupções
- 🌐 Configure IPs permitidos no painel para maior segurança
";
    }

    /// <summary>
    /// Documentação dos endpoints de cobranças PIX.
    /// </summary>
    public static class Pix
    {
        public const string Create = @"
Cria uma nova cobrança PIX e retorna o **QR Code** e o código **Copia e Cola** para o cliente efetuar o pagamento.

### 📋 Fluxo de Pagamento

1. **Crie a cobrança**: Chame este endpoint com o valor desejado
2. **Exiba o QR Code**: Use o campo `pix.qrCode` (Base64) ou `pix.copyAndPaste`
3. **Aguarde o pagamento**: O status mudará de `Pending` para `Completed`
4. **Receba a notificação**: Configure um webhook para ser notificado automaticamente

### 💰 Valores Monetários

⚠️ **IMPORTANTE**: Todos os valores são em **centavos** (menor unidade da moeda).

| Valor Real | Valor na API |
|------------|-------------|
| R$ 1,00    | 100         |
| R$ 10,50   | 1050        |
| R$ 100,00  | 10000       |
| R$ 1.000,00| 100000      |

### 💸 Taxas

A taxa é calculada automaticamente e descontada do valor recebido:
- O campo `amount` é o valor total da cobrança
- O campo `fee` é a taxa cobrada pela SwiftPay
- O campo `netAmount` é o valor líquido que será creditado

### ⏱️ Expiração

O campo `expirationMinutes` define o tempo de validade do QR Code (padrão: 30 minutos, máximo: 1440 minutos / 24 horas).

### 🔗 Idempotência

Use o campo `externalId` para garantir idempotência. Se enviar o mesmo `externalId`, receberá erro `409 Conflict`.
";

        public const string Get = @"
Retorna os dados completos de uma cobrança PIX específica, incluindo informações do QR Code e dados do pagador (após confirmação do pagamento).

### 📊 Status da Cobrança

| Status | Descrição |
|--------|----------|
| `Pending` | Aguardando pagamento |
| `Processing` | Processando confirmação |
| `Completed` | ✅ Pagamento confirmado |
| `Failed` | ❌ Falha no processamento |
| `Refunded` | 🔄 Pagamento estornado |
| `Expired` | ⏰ PIX expirou |
| `Cancelled` | 🚫 Cobrança cancelada |

### 📦 Campos Retornados

- `id` - Identificador único da cobrança na SwiftPay
- `externalId` - Seu identificador interno (se informado na criação)
- `amount` - Valor da cobrança em centavos
- `fee` - Taxa cobrada em centavos
- `netAmount` - Valor líquido em centavos
- `status` - Status atual da cobrança
- `pix` - Dados do PIX (QR Code, TxId, pagador, etc.)
- `completedAt` - Data/hora do pagamento (quando `Completed`)

### 👤 Dados do Pagador

Após o pagamento ser confirmado, os campos abaixo são preenchidos:
- `pix.payerName` - Nome do pagador
- `pix.payerDocument` - CPF/CNPJ do pagador (parcialmente mascarado)
- `pix.endToEndId` - Identificador único da transação PIX
";

        public const string List = @"
Retorna uma lista paginada de todas as cobranças PIX da sua organização, com totalizadores e suporte a diversos filtros.

### 📋 Parâmetros de Query

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|----------|
| `page` | int | 1 | Página atual |
| `pageSize` | int | 20 | Itens por página (máx: 100) |
| `status` | string | - | Filtrar por status (Pending, Completed, etc.) |
| `startDate` | datetime | - | Data inicial (ISO 8601) |
| `endDate` | datetime | - | Data final (ISO 8601) |
| `customerId` | guid | - | Filtrar por cliente |
| `externalId` | string | - | Buscar por externalId exato |

### 📊 Totalizadores

A resposta inclui totalizadores considerando os filtros aplicados:
- `totalItems` - Quantidade total de cobranças
- `totalAmount` - Soma dos valores das cobranças
- `totalFees` - Soma das taxas
- `totalNetAmount` - Soma dos valores líquidos
";

        public const string Simulate = @"
# Simular Pagamento PIX (Sandbox)

⚠️ **ATENÇÃO: Este endpoint está disponível apenas em ambiente Sandbox.**

Use este endpoint para simular o fluxo de pagamento durante o desenvolvimento e testes da sua integração. Isso permite testar toda a sua lógica de recebimento de pagamentos sem precisar realizar transações reais.

### 🎯 Ações Disponíveis

| Ação | Descrição |
|------|----------|
| `complete` | ✅ Simula a **confirmação** do pagamento. O status muda para `Completed`. |
| `expire` | ⏰ Simula a **expiração** do PIX. O status muda para `Expired`. |

### 📋 Pré-requisitos

- A cobrança deve estar com status `Pending`
- O token deve ser de um ambiente **Sandbox**

### 🔔 Webhooks

Após a simulação, um webhook será enviado automaticamente para a URL configurada:
- `payment.completed` - Quando usar ação `complete`
- `payment.expired` - Quando usar ação `expire`

### 👤 Dados Simulados do Pagador

Quando você simula um pagamento completo, os seguintes dados são preenchidos:
- `payerName`: ""Cliente Sandbox""
- `payerDocument`: ""12345678900""
- `payerBank`: ""Banco Sandbox""
";
    }

    /// <summary>
    /// Documentação dos endpoints de clientes.
    /// </summary>
    public static class Customers
    {
        public const string Create = @"
Cria um novo cliente associado à sua organização. Os clientes podem ser reutilizados em múltiplas cobranças, facilitando o acompanhamento e gestão dos seus pagadores.

### 📋 Campos Obrigatórios

| Campo | Tipo | Descrição |
|-------|------|----------|
| `name` | string | Nome completo do cliente |
| `email` | string | E-mail do cliente |

### 📋 Campos Opcionais

| Campo | Tipo | Descrição |
|-------|------|----------|
| `externalId` | string | Seu identificador interno (para integração) |
| `document` | string | CPF ou CNPJ (apenas números) |
| `documentType` | string | Tipo: `CPF` ou `CNPJ` |
| `phone` | string | Telefone com código do país (aceita com ou sem `+`; salvo apenas com dígitos) |
| `metadata` | string | JSON com dados adicionais |

### 🔗 Idempotência

Use o campo `externalId` para garantir idempotência. Se enviar o mesmo `externalId`, receberá erro `409 Conflict`.
";

        public const string Get = @"
Retorna os dados completos de um cliente específico pelo seu ID.

### 📊 Status do Cliente

| Status | Descrição |
|--------|----------|
| `Active` | ✅ Cliente ativo, pode ser usado em cobranças |
| `Inactive` | ❌ Cliente inativo, não pode ser usado em novas cobranças |

### 📦 Campos Retornados

- `id` - Identificador único do cliente na SwiftPay
- `externalId` - Seu identificador interno (se informado na criação)
- `name` - Nome do cliente
- `email` - E-mail do cliente
- `document` - CPF/CNPJ
- `documentType` - Tipo do documento
- `phone` - Telefone
- `status` - Status atual
- `metadata` - Dados adicionais (JSON)
- `createdAt` - Data de criação
";

        public const string List = @"
Retorna uma lista paginada de todos os clientes da sua organização com suporte a filtros.

### 📋 Parâmetros de Query

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|----------|
| `page` | int | 1 | Página atual |
| `pageSize` | int | 20 | Itens por página (máx: 100) |
| `status` | string | - | Filtrar por status (`Active`, `Inactive`) |
| `documentType` | string | - | Filtrar por tipo de documento (`CPF`, `CNPJ`) |
| `search` | string | - | Buscar por nome, e-mail ou documento |
| `externalId` | string | - | Filtrar por ID externo exato |
| `startDate` | datetime | - | Data inicial de criação (ISO 8601) |
| `endDate` | datetime | - | Data final de criação (ISO 8601) |
";

        public const string Update = @"
Atualiza os dados de um cliente existente. Este endpoint utiliza o método `PATCH`, ou seja, **apenas os campos enviados serão atualizados**. Os demais campos mantêm seus valores atuais.

### 📋 Campos Atualizáveis

| Campo | Tipo | Descrição |
|-------|------|----------|
| `name` | string | Nome do cliente |
| `email` | string | E-mail do cliente |
| `document` | string | CPF ou CNPJ |
| `documentType` | string | Tipo: `CPF` ou `CNPJ` |
| `phone` | string | Telefone com código do país (aceita com ou sem `+`; salvo apenas com dígitos) |
| `status` | string | Status: `Active` ou `Inactive` |
| `metadata` | string | Dados adicionais (JSON) |

### ⚠️ Observações

- O campo `externalId` **não pode ser alterado** após a criação
- Para desativar um cliente, envie `""status"": ""Inactive""`
- Clientes inativos não podem ser usados em novas cobranças
";
    }

    #region Balance

    /// <summary>
    /// Descrição do endpoint de consultar saldo.
    /// </summary>
    public const string GetBalanceDescription = @"
Retorna o saldo atual e volumes de transações da sua organização.

### 💰 Valores Monetários

⚠️ **IMPORTANTE**: Todos os valores são em **centavos** (menor unidade da moeda).

| Valor Real | Valor na API |
|------------|-------------|
| R$ 1,00    | 100         |
| R$ 10,50   | 1050        |
| R$ 100,00  | 10000       |

### 📊 Estrutura da Resposta

**Balance (Saldo)**
- `available` - Saldo disponível para saque agora (regra operacional)
- `withdrawNowAvailable` - Disponível para saque imediato no ciclo atual
- `requiresFullWithdrawalNow` - Quando `true`, o valor do próximo saque deve ser exatamente `withdrawNowAvailable`
- `pending` - Saldo pendente (aguardando liquidação)
- `total` - Saldo total (available + pending)

**Totals (Totais Lifetime)**
- `volume` - Volume total recebido desde o início
- `fees` - Total de taxas cobradas
- `netVolume` - Volume líquido total
- `transactions` - Quantidade total de transações

**Period (Período)**
- `today` - Volumes do dia atual
- `week` - Volumes dos últimos 7 dias
- `month` - Volumes dos últimos 30 dias

### ⚠️ Observações Importantes

- Os volumes consideram **apenas pagamentos com status `Completed`**
- Transações pendentes, expiradas ou canceladas **não são contabilizadas** nos volumes
- O saldo `pending` representa valores já recebidos mas ainda não disponíveis para saque
";

    #endregion

    #region Transactions

    /// <summary>
    /// Descrição do endpoint de criar transação.
    /// </summary>
    public const string CreateTransactionDescription = @"
Cria uma nova transação unificada. Este endpoint suporta múltiplos métodos de pagamento: **PIX**, **Cartão de Crédito** e **Boleto**.

### 📋 Métodos de Pagamento

| Método | Valor | Status |
|--------|-------|--------|
| PIX | `pix` | ✅ Disponível |
| Cartão de Crédito | `creditCard` | 🔜 Em breve |
| Boleto | `boleto` | 🔜 Em breve |

### 📋 Campos Obrigatórios

| Campo | Tipo | Descrição |
|-------|------|----------|
| `method` | string | Método de pagamento (`pix`, `creditCard`, `boleto`) |
| `amount` | long | Valor em centavos (mín: 1, máx: 100000000) |
| `currency` | string | Moeda (`BRL`) |
| `description` | string | Descrição da transação (máx: 500 caracteres) |

### 📋 Campos Opcionais

| Campo | Tipo | Descrição |
|-------|------|----------|
| `externalId` | string | ID externo para referência (máx: 100 caracteres) |
| `customerId` | guid | ID do cliente cadastrado |
| `callbackUrl` | string | URL para receber webhooks |
| `metadata` | string | Metadados adicionais em JSON |

### 💰 Valores Monetários

⚠️ **IMPORTANTE**: Todos os valores são em **centavos** (menor unidade da moeda).

| Valor Real | Valor na API |
|------------|-------------|
| R$ 1,00    | 100         |
| R$ 10,50   | 1050        |
| R$ 100,00  | 10000       |

### 📦 Campos Específicos por Método

**PIX:**
- `pixExpirationMinutes` - Tempo de expiração (5-1440 minutos, padrão: 30)
- `customerName` - Nome do pagador (opcional)
- `customerDocument` - CPF/CNPJ do pagador (opcional)

**Cartão de Crédito (em breve):**
- `cardNumber` - Número do cartão (obrigatório)
- `cardHolderName` - Nome impresso no cartão (obrigatório)
- `cardExpirationMonth` - Mês de expiração (obrigatório)
- `cardExpirationYear` - Ano de expiração (obrigatório)
- `installments` - Número de parcelas (1-12)
- `cardCvv` - CVV do cartão

**Boleto (em breve):**
- `boletoDueDate` - Data de vencimento
- `boletoInstructions` - Instruções do boleto
";

    /// <summary>
    /// Descrição do endpoint de listar transações.
    /// </summary>
    public const string ListTransactionsDescription = @"
Retorna uma lista paginada de todas as transações da sua organização, com suporte a diversos filtros.

### 📋 Parâmetros de Query

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|----------|
| `page` | int | 1 | Página atual |
| `pageSize` | int | 20 | Itens por página (máx: 100) |
| `method` | string | - | Filtrar por método: `Pix`, `CreditCard`, `Boleto` |
| `status` | string | - | Filtrar por status: `Pending`, `Completed`, `Expired`, `Failed`, `Refunded` |
| `externalId` | string | - | Buscar por externalId exato |
| `customerId` | guid | - | Filtrar por ID do cliente |
| `startDate` | datetime | - | Data inicial de criação (ISO 8601) |
| `endDate` | datetime | - | Data final de criação (ISO 8601) |

### 📊 Status Disponíveis

| Status | Descrição |
|--------|----------|
| `Pending` | Aguardando pagamento |
| `Completed` | ✅ Pagamento confirmado |
| `Expired` | ⏰ Transação expirou |
| `Failed` | ❌ Falha no processamento |
| `Refunded` | 🔄 Pagamento estornado |

### 📦 Resposta

A resposta inclui uma lista paginada com os seguintes dados por transação:
- `id` - ID da transação
- `externalId` - ID externo (se informado)
- `method` - Método de pagamento
- `amount`, `fee`, `netAmount` - Valores em centavos
- `status` - Status atual
- `customer` - Dados do cliente (se vinculado)
- `createdAt`, `expiresAt`, `completedAt` - Datas relevantes
";

    /// <summary>
    /// Descrição do endpoint de obter transação.
    /// </summary>
    public const string GetTransactionDescription = @"
Retorna os dados completos de uma transação específica, incluindo informações do método de pagamento e dados do pagador (quando disponíveis).

### 📊 Status da Transação

| Status | Descrição |
|--------|----------|
| `pending` | Aguardando pagamento |
| `completed` | ✅ Pagamento confirmado |
| `expired` | ⏰ Transação expirou |
| `failed` | ❌ Falha no processamento |
| `refunded` | 🔄 Pagamento estornado |

### 📦 Campos Específicos

A resposta inclui campos específicos baseados no método de pagamento:
- **PIX**: `txId`, `endToEndId`, `qrCode`, `copyAndPaste`, dados do pagador
- **Cartão** (futuro): `lastFour`, `brand`, `authorizationCode`
- **Boleto** (futuro): `barcode`, `digitableLine`, `pdfUrl`
";

    /// <summary>
    /// Descrição do endpoint de simular transação.
    /// </summary>
    public const string SimulateTransactionDescription = @"
⚠️ **ATENÇÃO: Este endpoint está disponível apenas em ambiente Sandbox.**

Use este endpoint para simular ações em transações durante o desenvolvimento e testes.

### 📋 Campos Obrigatórios

| Campo | Tipo | Descrição |
|-------|------|----------|
| `action` | string | Ação a simular: `complete`, `expire`, `fail`, `refund` |

### 🎯 Ações Disponíveis

| Ação | Status Anterior | Novo Status | Descrição |
|------|-----------------|-------------|-----------|
| `complete` | `Pending` | `Completed` | ✅ Simula a **confirmação** do pagamento |
| `expire` | `Pending` | `Expired` | ⏰ Simula a **expiração** da transação |
| `fail` | `Pending` | `Failed` | ❌ Simula uma **falha** no processamento |
| `refund` | `Completed` | `Refunded` | 🔄 Simula um **estorno** do pagamento |

### 📋 Pré-requisitos

- O token deve ser de um ambiente **Sandbox**
- Para `complete`, `expire` e `fail`: a transação deve estar com status `Pending`
- Para `refund`: a transação deve estar com status `Completed`

### 🔔 Webhooks

Após a simulação, um webhook será enviado para a URL configurada na transação (`callbackUrl`).
";

    #endregion

    #region Cashouts

    /// <summary>
    /// Documentação dos endpoints de saques (cashouts).
    /// </summary>
    public static class Cashouts
    {
        public const string Create = @"
Solicita um novo saque (cashout) do seu saldo disponível para a conta PIX cadastrada.

### 📋 Campos Obrigatórios

| Campo | Tipo | Descrição |
|-------|------|----------|
| `amount` | long | Valor do saque em centavos (mín: depende das configurações) |

### 📋 Campos Opcionais

| Campo | Tipo | Descrição |
|-------|------|----------|
| `payoutAccountId` | guid | ID da conta de destino (usa a padrão se não informado) |
| `externalId` | string | ID externo para referência (máx: 100 caracteres) |
| `callbackUrl` | string | URL para receber webhooks |

### 💰 Valores Monetários

⚠️ **IMPORTANTE**: Todos os valores são em **centavos** (menor unidade da moeda).

| Valor Real | Valor na API |
|------------|-------------|
| R$ 1,00    | 100         |
| R$ 100,00  | 10000       |
| R$ 1.000,00| 100000      |

### 💸 Taxas

A taxa de saque é calculada automaticamente conforme sua configuração:
- `amount` - Valor solicitado para saque
- `fee` - Taxa de saque cobrada
- `netAmount` - Valor líquido transferido (amount - fee)

### 📊 Fluxo de Processamento

1. **Solicitação**: O saque é criado com status `Pending`
2. **Aprovação**: Dependendo das configurações, pode requerer aprovação manual
3. **Processamento**: Após aprovado, o status muda para `Processing`
4. **Conclusão**: O valor é transferido e o status muda para `Completed`

### ⚠️ Observações

- Você precisa ter uma conta de saque (PIX) cadastrada e ativa
- O saque considera o saldo operacional do ciclo atual (`withdrawNowAvailable`)
- Quando `requiresFullWithdrawalNow = true`, o saque deve ser exatamente `withdrawNowAvailable`
- Se o valor estiver acima do disponível agora, a API retorna `insufficient_balance`
- Em sandbox, o saque é simulado instantaneamente
";

        public const string Get = @"
Retorna os dados completos de um saque específico pelo seu ID.

### 📊 Status do Saque

| Status | Descrição |
|--------|----------|
| `Pending` | Aguardando processamento/aprovação |
| `Processing` | 🔄 Em processamento |
| `Completed` | ✅ Saque concluído |
| `Failed` | ❌ Falha no processamento |
| `Rejected` | 🚫 Saque rejeitado |
| `Cancelled` | ❌ Saque cancelado |

### 📦 Campos Retornados

- `id` - Identificador único do saque
- `amount` - Valor solicitado em centavos
- `fee` - Taxa cobrada em centavos
- `netAmount` - Valor líquido transferido em centavos
- `status` - Status atual do saque
- `pix.pixKeyType` - Tipo da chave PIX
- `pix.pixKey` - Chave PIX (mascarada)
- `pix.endToEndId` - ID da transação PIX (quando concluído)
- `requestedAt` - Data da solicitação
- `processedAt` - Data do início do processamento
- `completedAt` - Data da conclusão
- `failureReason` - Motivo da falha (quando aplicável)
";

        public const string List = @"
Retorna uma lista paginada de todos os saques da sua organização com suporte a filtros.

### 📋 Parâmetros de Query

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|----------|
| `page` | int | 1 | Página atual |
| `pageSize` | int | 20 | Itens por página (máx: 100) |
| `status` | string | - | Filtrar por status |
| `startDate` | datetime | - | Data inicial (ISO 8601) |
| `endDate` | datetime | - | Data final (ISO 8601) |

### 📊 Status Disponíveis

| Status | Descrição |
|--------|----------|
| `Pending` | Aguardando processamento |
| `Processing` | 🔄 Em processamento |
| `Completed` | ✅ Saque concluído |
| `Failed` | ❌ Falha no processamento |
| `Rejected` | 🚫 Saque rejeitado |
| `Cancelled` | ❌ Saque cancelado |
";

        public const string Cancel = @"
Cancela um saque pendente. Apenas saques com status `Pending` podem ser cancelados.

### 📋 Pré-requisitos

- O saque deve estar com status `Pending`
- Apenas a própria organização pode cancelar seus saques

### 📊 Após o Cancelamento

- O status do saque muda para `Cancelled`
- O saldo é devolvido para a conta da organização (se já havia sido reservado)
- Não é possível desfazer o cancelamento

### ⚠️ Observações

- Saques em processamento (`Processing`) ou já concluídos (`Completed`) **não podem** ser cancelados
- Para contestar um saque concluído, entre em contato com o suporte
";

        public const string Simulate = @"
⚠️ **ATENÇÃO: Este endpoint está disponível apenas em ambiente Sandbox.**

Use este endpoint para simular o processamento de um saque durante o desenvolvimento e testes da sua integração.

### 🎯 Ações Disponíveis

| Ação | Status Anterior | Novo Status | Descrição |
|------|-----------------|-------------|-----------|
| `Complete` | `Pending` ou `Processing` | `Completed` | ✅ Simula a **conclusão** do saque |
| `Fail` | `Pending` ou `Processing` | `Failed` | ❌ Simula uma **falha** no processamento |
| `Reject` | `Pending` | `Rejected` | 🚫 Simula a **rejeição** do saque |

### 📋 Pré-requisitos

- O token deve ser de um ambiente **Sandbox**
- O saque deve estar em um status compatível com a ação

### 📦 Dados Simulados

Quando você simula um saque completo, os seguintes dados são preenchidos automaticamente:
- `endToEndId` - Identificador único da transação PIX (simulado)
- `acquirerTransactionId` - ID da transação na adquirente (simulado)
- `completedAt` - Data/hora da conclusão

### 🔔 Webhooks

Após a simulação, um webhook será enviado para a URL configurada:
- `cashout.completed` - Quando usar ação `Complete`
- `cashout.failed` - Quando usar ação `Fail`
- `cashout.rejected` - Quando usar ação `Reject`

### ⚠️ Observações

- Em ambiente **Production**, os saques são processados automaticamente pela adquirente
- Este endpoint permite testar seu fluxo de tratamento de saques sem realizar transações reais
";
    }

    #endregion
}
