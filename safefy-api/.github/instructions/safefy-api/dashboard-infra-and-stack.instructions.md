---
description: "Use when editing dashboard cache processing, infrastructure behavior, health checks, startup, and platform stack conventions."
applyTo: 'Endpoints/**/Dashboard/**/*.cs, Services/Internal/*Dashboard*.cs, Consumers/*Dashboard*.cs, Program.cs, Extensions/**/*.cs'
---

## Sistema de Cache de Dashboards

O dashboard utiliza uma arquitetura de cache com processamento assíncrono via fila para evitar race conditions e garantir respostas rápidas.

### Arquitetura

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    ARQUITETURA DE CACHE DE DASHBOARDS                         │
└──────────────────────────────────────────────────────────────────────────────┘

    Requisição GET /dashboard
           │
           ▼
    ┌─────────────────────────────────────┐
    │ 1. Buscar cache existente           │
    │ 2. Buscar balance (tempo real)      │
    │ 3. Verificar se deve processar      │
    └───────────────┬─────────────────────┘
                    │
           ┌────────┴────────┐
           ▼                 ▼
    ┌─────────────┐   ┌─────────────────────┐
    │ Retornar    │   │ Publicar mensagem   │
    │ resposta    │   │ na fila RabbitMQ    │
    │ imediata    │   │ (assíncrono)        │
    └─────────────┘   └──────────┬──────────┘
                                 │
                                 ▼
                      ┌─────────────────────┐
                      │ Consumer processa   │
                      │ e atualiza cache    │
                      └─────────────────────┘
```

### Campos de Controle

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `IsProcessing` | bool | Indica se o cache está sendo processado |
| `NextProcessAt` | DateTime? | Data mínima para próximo processamento |
| `ExpiresAt` | DateTime | Data de expiração do cache |
| `CalculatedAt` | DateTime | Data do último cálculo |

### Regras de Processamento

1. **Condição para processar**: `cache == null || (cache.ExpiresAt <= now && !cache.IsProcessing)`
2. **Resposta imediata**: O endpoint sempre retorna imediatamente com os dados em cache (ou vazio)
3. **Balance em tempo real**: Os dados de saldo vêm do `LedgerService` e são sempre atualizados
4. **Cache de KPIs**: Estatísticas de transações são calculadas assincronamente
5. **Falhas no dashboard da adquirente**: O KPI de falhas agrega pagamentos com `PaymentStatus.Failed` e `PaymentStatus.Cancelled`, além de saques com `PayoutStatus.Failed`, `PayoutStatus.Rejected` e `PayoutStatus.Cancelled`; expiração de pagamento permanece em `ExpiredTransactions`

### Dashboard do Merchant - Regras de KPIs e Filtro por Período

- O endpoint `GET /v1/merchant/{merchantId}/dashboard` suporta período customizado por query (`startDate` e `endDate`, formato `yyyy-MM-dd`).
- No dashboard do merchant:
    - `Saldo disponível` permanece em tempo real (não filtrado por período)
    - `Total de vendas` representa o volume bruto acumulado de vendas aprovadas (não filtrado por período)
    - Demais métricas (pendências, ticket médio, saques pendentes, volume do período, reembolso e chargeback) devem respeitar o período selecionado
- A série de evolução deve adaptar a granularidade do período customizado:
    - intervalo de até `2` dias: agrupamento por hora
    - intervalo de `3` dias ou mais: agrupamento por dia

### Entidades

| Entidade | Descrição |
|----------|-----------|
| `MerchantDashboardCache` | Cache de KPIs por merchant + environment |
| `AdminDashboardCache` | Cache de KPIs globais (singleton) |

### Tipos de Dados (safefy-api-core)

Os tipos de dados para gráficos ficam em `safefy_api_core.Models.Dashboard`:

| Tipo | Descrição |
|------|-----------|
| `MerchantDailyVolumeData` | Volume diário do merchant (Date, Volume, TransactionCount) |
| `MerchantWeeklyVolumeData` | Volume semanal do merchant (WeekNumber, Label, Volume, TransactionCount) |
| `AdminMerchantDailyVolumeData` | Volume diário do merchant para admin (inclui Fees) |
| `AdminDailyVolumeData` | Volume diário global (Date, Volume, Fees, TransactionCount) |
| `AdminDailyRegistrationData` | Registros diários (Date, NewUsers, NewMerchants) |

### Uso nos Endpoints

```csharp
// Verificar se deve processar
var shouldProcess = cache == null
    || (cache.ExpiresAt <= now && !cache.IsProcessing)
    || (cache.NextProcessAt.HasValue && cache.NextProcessAt.Value <= now && !cache.IsProcessing);

// Publicar mensagem para fila
if (shouldProcess)
{
    await messagePublisher.PublishAsync(
        RabbitMQQueues.ProcessMerchantDashboard,
        new ProcessMerchantDashboardMessage
        {
            MerchantId = merchantId,
            Environment = environment
        });
}

// Retornar resposta imediata com dados em cache + balance em tempo real
var balanceInfo = await ledgerService.GetMerchantBalanceInfoAsync(merchantId, environment);
await SendCachedResponse(cache, balanceInfo, ct);
```

---

## Infraestrutura e Resiliência

### Health Checks

Ambas as APIs expõem endpoints de health check:

```
GET /health/live
GET /health/ready
GET /health
```

Retorna:
- `200 OK` em `/health/live` quando a API está de pé (sem validar dependências externas)
- `200 OK` em `/health/ready` e `/health` quando as dependências estão saudáveis
- `503 Service Unavailable` em `/health/ready` e `/health` quando há dependências indisponíveis

Checks implementados:
- PostgreSQL (PrimaryDb)

### Startup Não Bloqueante

- O bootstrap da API deve aplicar migrations do `PrimaryDbContext` e do `LogDbContext` no startup antes de iniciar pipeline/jobs
- O warmup em `BackgroundService` permanece com retry para robustez operacional e reexecução segura de inicialização
- Deploy deve usar `/health/live` para startup probe e `/health/ready` para readiness probe

### Correlation ID

Todas as requisições são rastreadas com um ID de correlação:

- Header: `X-Correlation-Id`
- Se o cliente enviar o header, o mesmo ID é mantido
- Se não enviar, um novo GUID v7 é gerado
- O ID é retornado no response header
- Todos os logs incluem o CorrelationId automaticamente

---

## Tecnologias Principais

- **.NET 10.0** com **FastEndpoints**
- **Entity Framework Core** com PostgreSQL
- **FluentValidation** para validações
- **MassTransit.RabbitMQ** para mensageria
- **SignalR** para notificações em tempo real
- Autenticação JWT Bearer

### Projetos

| Projeto | Descrição |
|---------|-----------|
| `safefy-api` | API principal (autenticação, merchants, admin, consumer MassTransit) |
| `safefy-api-payment` | API de pagamentos (transações, webhooks, publisher MassTransit) |
| `safefy-api-core` | Biblioteca compartilhada (DbContext, Utils, Middlewares, Consumers) |

### safefy-api-core

Biblioteca compartilhada que contém:

- **Database**: `PrimaryDbContext`, `LogDbContext` (DbContext unificado)
- **Utils**: `CryptoUtils`, `EndpointUtils`, `FeeCalculator`
- **Middlewares**: `CorrelationIdMiddleware`, `ApiLogContextMiddleware`, `SecurityLogContextMiddleware`
- **Interfaces**: `ILedgerService`, `INotificationService`, `IPushNotificationService`, `IEmailService`, `IMessagePublisher`, etc.
- **Repositories**: `LedgerRepository` (operações atômicas com SQL transactions)
- **Models**: Entidades do banco de dados compartilhadas
- **Consumers**: `NotificationCreatedConsumer` (MassTransit)
- **Extensions**: `SettingsExtensions`, `MassTransitExtensions`

### Extension Methods (Program.cs Limpo)

O Program.cs utiliza extension methods para manter o código organizado:

```csharp
// Extensions/
├── SettingsExtensions.cs       # AddSettings()
├── AuthenticationExtensions.cs # AddJwtAuthentication()
├── CorsExtensions.cs           # AddApiCors()
├── DatabaseExtensions.cs       # AddDatabaseHealthChecks()
├── RateLimiterExtensions.cs    # AddApiRateLimiter()
├── ServiceCollectionExtensions.cs # AddApplicationServices()
├── DocumentationExtensions.cs  # AddSwaggerDocumentation()
├── MassTransitExtensions.cs    # AddMassTransitWithConsumers()
└── WebApplicationExtensions.cs # UseApiMiddlewares()
```

### Regras de Dependências

> **⚠️ IMPORTANTE**: **NÃO UTILIZAR pacotes em versão beta, preview, rc ou qualquer versão pré-release**. A aplicação requer máxima estabilidade e segurança. Sempre utilize apenas versões estáveis (stable/GA) dos pacotes NuGet.

### Regras de Logging

O sistema de logging segue uma filosofia clara de separação:

**1. ILogger (.NET) - Apenas para Erros Técnicos**
- Use **apenas** `LogError` para registrar erros que quebram o sistema
- Erros de integração com serviços externos (APIs, banco de dados)
- Exceções não tratadas em catch blocks
- **NUNCA** use `LogInformation`, `LogDebug` ou `LogWarning` em código de produção

```csharp
// ✅ CORRETO - Apenas LogError
catch (Exception ex)
{
    logger.LogError(ex, "Error processing payment: PaymentId={PaymentId}", paymentId);
    throw;
}

// ❌ ERRADO - Não usar LogInformation, LogDebug, LogWarning
logger.LogInformation("Payment created: {PaymentId}", payment.Id);
logger.LogDebug("Processing request for {MerchantId}", merchantId);
logger.LogWarning("Rate limit exceeded for {MerchantId}", merchantId);
```

**2. Log Service (Banco de Dados) - Para Operações de Negócio Críticas**

| Projeto | Serviço | Uso |
|---------|---------|-----|
| safefy-api | `ISecurityLogService` | Login, logout, alteração de senha, dispositivos confiáveis |
| safefy-api | `IApiLogService` | Operações financeiras no painel (criar/cancelar/aprovar/rejeitar saques) |
| safefy-api-payment | `IApiLogService` | Criação de transações, criação/cancelamento de saques, criação de clientes |

**Operações que DEVEM ter log no banco:**
- Criação de transações/pagamentos (`ApiLogAction.CreateTransaction`)
- Criação de saques (`ApiLogAction.CreateCashout`)
- Cancelamento de saques (`ApiLogAction.CancelCashout`)
- Aprovação de saques (`ApiLogAction.ApproveCashout`)
- Rejeição de saques (`ApiLogAction.RejectCashout`)
- Criação de clientes (`ApiLogAction.CreateCustomer`)
- Atualização de clientes (`ApiLogAction.UpdateCustomer`)
- Login/Logout (`SecurityLogAction.UserSignIn`, `SecurityLogAction.UserSignOut`)
- Alteração de senha (`SecurityLogAction.PasswordChanged`)

**Regra de ouro:** Operações financeiras devem usar `IApiLogService` (ApiLogs). Não registrar saques em `SecurityLogs`.

**Operações que NÃO devem ter log no banco:**
- Operações de leitura (GET, List)
- Consultas de status
- Operações frequentes que geram muito volume

**Exemplo de uso do ApiLogService:**
```csharp
// No endpoint de criação
await apiLogService.LogAsync(new ApiLogInput
{
    Action = ApiLogAction.CreateCashout,
    Status = ApiLogStatus.Success,
    ResourceId = result.Payout.Id,
    ResourceType = ApiLogResourceType.Payout,
    StatusCode = 201
});
```

**Auditoria de erros de adquirentes:**
- Erros de integração com adquirentes são gravados em `ApiLogs` com `ResponseBody`, `ErrorCode` e dados da adquirente
- A tela de logs do admin consome o endpoint `GET /v1/admin/logs`

### Logs dedicados de webhook de adquirente

- Webhooks recebidos das adquirentes devem ser registrados na tabela dedicada `AcquirerWebhookLogs` (Log DB), separada de `ApiLogs`.
- Campos mínimos obrigatórios no registro:
    - `AcquirerId`, `AcquirerType`, `AcquirerCode`
    - `HttpMethod`, `Endpoint`, `QueryString`
    - `RequestHeaders` (mascarando headers sensíveis) e `RequestBody`
    - `IpAddress`, `UserAgent`, `Location`, `CorrelationId`
    - `ContentType`, `ContentLength`, `StatusCode`, `CreatedAt`
- O endpoint `GET /v1/admin/logs` deve suportar `type = AcquirerWebhook` para leitura desses registros.

---



