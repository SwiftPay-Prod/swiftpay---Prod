---
description: "Use when changing project structure conventions, stack configuration, broker contracts, and extension wiring in Program setup."
applyTo: 'Program.cs, Extensions/**/*.cs, Consumers/**/*.cs, Interfaces/**/*.cs'
---

## Estrutura de Pastas

```
swiftpay-api-payment/
├── Clients/                    # Clientes HTTP para APIs externas
│   ├── Bankizi/
│   │   ├── BankiziClient.cs
│   │   └── Models/
│   └── IHubBanking/
│       ├── IHubBankingClient.cs
│       └── Models/
├── Endpoints/                  # Endpoints da API organizados por domínio
│   ├── Auth/                   # Autenticação via API credentials
│   ├── Transactions/           # Criação e consulta de transações
│   ├── Cashouts/               # Saques via API
│   ├── Internal/               # Endpoints internos (webhooks, swiftpay-api)
│   └── Models/                 # BaseResponse, Paginated
├── EndpointsGroups/            # Grupos de endpoints
├── Extensions/                 # Extension methods (Program.cs limpo)
├── Filters/                    # Filtros globais
├── Interfaces/                 # Contratos/interfaces
├── Mappers/                    # Mapeamento entre DTOs e entidades
├── Middlewares/                # Middlewares específicos da API
├── Models/                     # Models internos da aplicação
└── Services/                   # Lógica de negócio
    └── Acquirers/              # Implementações específicas por adquirente
```

---

## Tecnologias Principais

- **.NET 10.0** com **FastEndpoints**
- **Entity Framework Core** com PostgreSQL
- **FluentValidation** para validações
- **Polly** para resiliência HTTP (Circuit Breaker, Retry, Timeout)
- **MassTransit.RabbitMQ** para mensageria
- Autenticação JWT Bearer

---

## Message Broker (MassTransit/RabbitMQ)

Esta API atua como **publisher** e **consumer** de mensagens:

**Filas que este projeto PUBLICA:**

| Fila | Descrição |
|------|-----------|
| `swiftpay.notification.created` | Notificações para envio via SignalR (consumido por swiftpay-api) |
| `swiftpay.ledger.pending` | Registro de transação pendente no ledger |
| `swiftpay.payment.completed` | Processar pagamento confirmado (ledger, notificações, webhook) |
| `swiftpay.cashout.process` | Processar saque na adquirente |
| `swiftpay.webhook.send` | Enviar webhook para merchant |

**Filas que este projeto CONSOME:**

| Fila | Consumer | Descrição |
|------|----------|-----------|
| `swiftpay.ledger.pending` | `RecordLedgerPendingConsumer` | Registra transação no ledger em background |
| `swiftpay.payment.completed` | `PaymentCompletedConsumer` | Processa pagamento (ledger, notificação, webhook) |
| `swiftpay.cashout.process` | `ProcessCashoutConsumer` | Chama adquirente para processar saque |
| `swiftpay.webhook.send` | `SendWebhookConsumer` | Envia webhook HTTP para merchant |

**Exemplo de publicação:**

```csharp
// Publica para processar pagamento confirmado
await messagePublisher.PublishAsync(
    RabbitMQQueues.PaymentCompleted,
    new PaymentCompletedMessage
    {
        PaymentId = payment.Id,
        MerchantId = payment.MerchantId,
        // ...
    });
```

**Configuração:**

```csharp
// Extensions/MassTransitExtensions.cs
builder.Services.AddMassTransitWithConsumers(builder.Configuration);
```

---

## Extension Methods (Program.cs Limpo)

O Program.cs utiliza extension methods para manter o código organizado:

```csharp
// Extensions/
├── SettingsExtensions.cs       # AddSettings()
├── AuthenticationExtensions.cs # AddJwtAuthentication()
├── CorsExtensions.cs           # AddApiCors()
├── DatabaseExtensions.cs       # AddDatabaseHealthChecks()
├── ServiceCollectionExtensions.cs # AddApplicationServices()
├── DocumentationExtensions.cs  # AddSwaggerDocumentation()
├── MassTransitExtensions.cs    # AddMassTransitWithConsumers()
└── WebApplicationExtensions.cs # UseApiMiddlewares()
```

---
