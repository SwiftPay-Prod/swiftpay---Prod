# Swiftpay Clean Architecture

## Sub-skills
- **dotnet:dotnet-aspnet** — ASP.NET Core API patterns (endpoints, middleware, routing)
- **dotnet:dotnet-data** — EF Core configuration, migrations, query patterns
- **dotnet:dotnet-test** — Test project setup, mocking patterns
- **superpowers:test-driven-development** — TDD for every layer
- **swiftpay-ledger** — double-entry accounting placement
- **swiftpay-messaging** — MassTransit/RabbitMQ placement
- **swiftpay-payment-processing** — payment flow architecture
- **swiftpay-acquirer-integration** — multi-provider strategy
- **swiftpay-webhooks** — webhook system architecture
- **swiftpay-signalr** — real-time updates placement
- **swiftpay-admin-web** — Next.js admin frontend
- **swiftpay-checkout** — public checkout frontend

## Full System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Swiftpay — Complete Architecture                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    SWIFTPAY.WEBAPI                            │    │
│  │  FastEndpoints (Controllers) | Middleware | SignalR Hubs     │    │
│  └─────────────────────────────────────────────────────────────┘    │
│         │                    │                    │                  │
│  ┌──────┴──────┐    ┌───────┴────────┐    ┌─────┴──────────┐        │
│  │  Auth       │    │ Payment        │    │  Internal      │        │
│  │  Endpoints  │    │ Endpoints      │    │  Endpoints     │        │
│  │  /v1/auth   │    │ /v1/transactions│   │  /v1/internal  │        │
│  └─────────────┘    └───────┬────────┘    └────────────────┘        │
│                             │                                       │
├─────────────────────────────┼───────────────────────────────────────┤
│  ┌──────────────────────────┴──────────────────────────────────┐    │
│  │                 SWIFTPAY.APPLICATION                          │    │
│  │  MediatR | CQRS | FluentValidation | Result<T>               │    │
│  │                                                              │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐              │    │
│  │  │ Auth       │  │ Payment    │  │ Wallet     │              │    │
│  │  │ Use Cases  │  │ Use Cases  │  │ Use Cases  │              │    │
│  │  └────────────┘  └────────────┘  └────────────┘              │    │
│  └──────────────────────────────────────────────────────────────┘    │
│         │                  │                    │                     │
├─────────┼──────────────────┼────────────────────┼───────────────────┤
│  ┌──────┴──────────────────┴────────────────────┴────────────────┐  │
│  │                  SWIFTPAY.INFRASTRUCTURE                        │  │
│  │                                                                │  │
│  │  ┌──────────────┐  ┌──────────────────┐  ┌────────────────┐    │  │
│  │  │ EF Core      │  │ MassTransit      │  │ SignalR        │    │  │
│  │  │ PostgreSQL   │  │ RabbitMQ         │  │ Hubs           │    │  │
│  │  └──────────────┘  └──────────────────┘  └────────────────┘    │  │
│  │                                                                │  │
│  │  ┌──────────────┐  ┌──────────────────┐  ┌────────────────┐    │  │
│  │  │ Repositories  │  │ Acquirer Clients │  │ JWT + Redis    │    │  │
│  │  │ (EF Core)    │  │ (9 adquirentes)  │  │ Cache/Session  │    │  │
│  │  └──────────────┘  └──────────────────┘  └────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                  SWIFTPAY.DOMAIN                               │    │
│  │  Entities: Account, LedgerEntry, LedgerTransaction,            │    │
│  │  Payment, PaymentPix, PaymentLink, User, Company, Withdrawal   │    │
│  │  ValueObjects: Money, Email | Enums: todos os status/type     │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    MESSAGING (RabbitMQ / MassTransit)                │
│                                                                     │
│  PixTransactionService → [RecordLedgerPending] → RecordLedgerConsumer
│  PaymentProcessingService → [PaymentCompleted] → PaymentCompletedConsumer
│  PaymentCompletedConsumer → [ProcessMerchantDashboard] → DashboardConsumer
│  PaymentCompletedConsumer → [SendWebhook] → WebhookConsumer
│  CashoutService → [ProcessCashout] → CashoutConsumer
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTENDS (Next.js 16)                            │
│                                                                     │
│  swiftpay-web (Admin)         swiftpay-web-checkout (Público)        │
│  ┌─────────────────────┐      ┌────────────────────────────┐        │
│  │ /dashboard          │      │ /checkout/{slug}           │        │
│  │ /dashboard/wallet   │      │ /checkout/{slug}/pix      │        │
│  │ /dashboard/transactions  │  │ /checkout/{slug}/boleto   │        │
│  │ /dashboard/payment-links │  │ /checkout/{slug}/card     │        │
│  │ /dashboard/withdrawals   │  │ /checkout/{slug}/success  │        │
│  └─────────────────────┘      └────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────┘
```

## Layer Rules (Strict)
- **Domain**: ZERO external dependencies. Pure C# classes only. No NuGet packages. No EF Core attributes. No JSON attributes.
- **Application**: Depends ONLY on Domain. Contains MediatR handlers (NuGet allowed), DTOs, validation, repository interfaces.
- **Infrastructure**: Implements Application interfaces. EF Core, JWT generation, Acquirer SDKs, MassTransit, SignalR.
- **WebApi**: Composition root. Registers all DI, FastEndpoints (or Controllers), middleware pipeline, SignalR hubs.

## Layer Rules (Strict)
- **Domain**: ZERO external dependencies. Pure C# classes only. No NuGet packages. No EF Core attributes. No JSON attributes.
- **Application**: Depends ONLY on Domain. Contains MediatR handlers (NuGet allowed), DTOs, validation, repository interfaces.
- **Infrastructure**: Implements Application interfaces. EF Core, JWT generation, Payment Gateway SDK, email sending.
- **WebApi**: Composition root. Registers all DI, middleware pipeline, controllers.

## Project References (Exact)
```
Domain ← (no references)
Application → Domain
Infrastructure → Application (NEVER reference Domain directly)
WebApi → Infrastructure
```

## Dependency Injection Pattern (per layer)

### Domain
```csharp
// No DependencyInjection.cs — Domain has no dependencies to register
```

### Application
```csharp
// Swiftpay.Application/DependencyInjection.cs
public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
        return services;
    }
}
```

### Infrastructure
```csharp
// Swiftpay.Infrastructure/DependencyInjection.cs
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string connectionString)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));
        services.AddScoped<IPaymentLinkRepository, PaymentLinkRepository>();
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        return services;
    }
}
```

### WebApi (Program.cs)
```csharp
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration.GetConnectionString("DefaultConnection"));
builder.Services.AddControllers();
```

## Naming Conventions
- Projects: `Swiftpay.{Layer}` (Swiftpay.Domain, Swiftpay.Application, etc.)
- Test projects: `Swiftpay.{Layer}.Tests`
- Files: PascalCase
- Folders: PascalCase
- Namespaces: match folder structure
- Private fields: `_camelCase`
- Parameters: `camelCase`

## CQRS Conventions (MediatR)

### Commands (write operations)
```csharp
// Record for the command
public record CreatePaymentLinkCommand(string Title, long Amount) : IRequest<Guid>;

// Handler
public class CreatePaymentLinkHandler : IRequestHandler<CreatePaymentLinkCommand, Guid>
{
    public async Task<Guid> Handle(CreatePaymentLinkCommand request, CancellationToken ct) { }
}
```

### Queries (read operations)
```csharp
public record GetPaymentLinkQuery(Guid Id) : IRequest<PaymentLinkResponse>;

public class GetPaymentLinkHandler : IRequestHandler<GetPaymentLinkQuery, PaymentLinkResponse>
{
    public async Task<PaymentLinkResponse> Handle(GetPaymentLinkQuery request, CancellationToken ct) { }
}
```

## Error Handling — Result Pattern
```csharp
public class Result<T>
{
    public bool IsSuccess { get; }
    public T Value { get; }
    public Error Error { get; }
    public static Result<T> Success(T value) => new() { IsSuccess = true, Value = value };
    public static Result<T> Failure(Error error) => new() { IsSuccess = false, Error = error };
}

public record Error(string Code, string Message);
```

- Application handlers return `Result<T>` (not exceptions for expected failures)
- Validation errors → `Result.Failure(Error("VALIDATION", message))`
- Not found → `Result.Failure(Error("NOT_FOUND", "Payment link not found"))`
- Infrastructure exceptions → throw, caught by global middleware

## API Response Envelope
```csharp
// All API responses wrapped
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T Data { get; set; }
    public string Message { get; set; }
    public List<string> Errors { get; set; }
}
```

## Cross-cutting Concerns
- **Validation Pipeline**: FluentValidation auto-validates before handlers run (MediatR pipeline behavior)
- **Audit Logging**: All status changes logged (who, what, when)
- **Global Exception Middleware**: Catches unhandled exceptions, returns 500 with ApiResponse
- **Request/Response Logging**: Middleware logs all API traffic (method, path, status, duration)
