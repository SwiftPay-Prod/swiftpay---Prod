---
description: "Use when defining response model naming, mapper usage, and endpoint code style or HTTP conventions."
applyTo: 'Endpoints/Admin/**/*.cs, Endpoints/Models/**/*.cs, Mappers/**/*.cs, Endpoints/**/*.cs'
---

## Padrão de Nomenclatura de Modelos de Resposta

### Regra Fundamental

> **⚠️ Todos os modelos de resposta de Admin endpoints DEVEM ter o prefixo `Admin`.** Isso garante clareza e evita conflitos com modelos de endpoints públicos.

### Tipos de Modelos de Resposta

Cada entidade deve ter no máximo **2 ou 3** tipos de modelo de resposta:

| Tipo | Nomenclatura | Uso | Método Mapper |
|------|--------------|-----|---------------|
| **Minimal** | `Admin{Entidade}Minimal` ou `AdminMinimal{Entidade}` | Listagens (List endpoints) - dados resumidos | `ToMinimalData()` |
| **Details** | `Admin{Entidade}Details` | Detalhes (Read/Get endpoints) - dados completos | `ToDetailsData()` |
| **Data** | `Admin{Entidade}Data` | Dados genéricos ou retorno de ações (Create/Update) | `ToData()` |

### Exemplos por Entidade

| Entidade | Listagem | Detalhes | Ação |
|----------|----------|----------|------|
| **Transaction** | `AdminMinimalTransaction` | `AdminTransactionDetails` | - |
| **Cashout** | `AdminMinimalCashout` | `AdminCashoutDetails` | `AdminCashoutEvaluationData` |
| **Merchant** | `AdminMinimalMerchant` | `AdminMerchantData` | - |
| **User** | `AdminMinimalUser` | `AdminUserDetails` | - |
| **Acquirer** | `AdminAcquirerData` | `AdminAcquirerData` (reutilizado) | `AdminAcquirerStatsData` |
| **Settings** | - | `AdminPlatformSettingsData` | - |
| **Dashboard** | - | `AdminDashboardData` | - |

### Classes Aninhadas (Info/Details)

Para propriedades aninhadas dentro dos modelos, use o padrão:

| Tipo Pai | Propriedade | Nomenclatura |
|----------|-------------|--------------|
| `AdminMinimal{Entidade}` | `Merchant` | `AdminMinimal{Entidade}MerchantInfo` |
| `Admin{Entidade}Details` | `Merchant` | `Admin{Entidade}MerchantDetails` |

### Exemplos

```csharp
// ✅ CORRETO - Listagem com Minimal
public sealed class AdminMinimalCashout
{
    public Guid Id { get; set; }
    public AdminMinimalCashoutMerchantInfo Merchant { get; set; } = null!;
    public AdminMinimalCashoutAccountInfo PayoutAccount { get; set; } = null!;
}

// ✅ CORRETO - Detalhes com Details
public sealed class AdminCashoutDetails
{
    public Guid Id { get; set; }
    public AdminCashoutMerchantDetails Merchant { get; set; } = null!;
    public AdminCashoutAccountDetails PayoutAccount { get; set; } = null!;
}

// ❌ ERRADO - Sem prefixo Admin
public sealed class CashoutData { ... }
public sealed class ReadCashoutData { ... }

// ❌ ERRADO - Inconsistência de nomenclatura
public sealed class AdminTransactionListItem { ... }  // Use AdminMinimalTransaction
public sealed class AcquirerData { ... }              // Use AdminAcquirerData
```

### Regras Importantes

1. **Prefixo obrigatório**: Todos os modelos em endpoints Admin devem ter prefixo `Admin`
2. **Consistência**: Use `Minimal` para listagens e `Details` para detalhes
3. **Reutilização**: Um modelo `Data` pode ser reutilizado em List e Read se os campos forem iguais
4. **Classes aninhadas**: Mantenha o contexto do pai no nome (ex: `AdminCashoutMerchantDetails`)
5. **Evite redundâncias**: Não use prefixos como `Read`, `List` nos nomes das classes

---

## Mappers

### Regra Fundamental

> **⚠️ NUNCA crie objetos de Response manualmente no Endpoint.** Sempre utilize Mappers para converter entidades do banco em objetos de resposta.

> **⚠️ Isso inclui DTOs e projeções.** Ao criar objetos como `AdminMinimalMerchant`, `AdminMinimalTransaction` ou similares em queries LINQ `.Select()`, extraia a lógica para um Mapper. Use `ToMinimalData()` para versões resumidas.

### Estrutura

Os mappers ficam na pasta `Mappers/` e seguem o padrão:

```
Mappers/
├── AcquirerMapper.cs
├── AdminDashboardMapper.cs
├── AdminMerchantMapper.cs
├── AdminMinimalMerchantMapper.cs
├── ApiCredentialMapper.cs
├── CashoutMapper.cs
├── MerchantMapper.cs
├── MerchantSettingsMapper.cs
├── NotificationMapper.cs
├── PaymentMapper.cs
├── PlatformSettingsMapper.cs
└── UserMapper.cs
```

### Nomenclatura

- Nome: `[Contexto][Entidade]Mapper` (ex: `AdminMerchantMapper`, `CashoutMapper`)
- Métodos: `ToData()`, `ToMinimalData()`, `ToDetailsData()`
- Classes: sempre `static`

### Exemplo de Mapper para DTO/Projeção

```csharp
using swiftpay_api.Endpoints.Admin.Merchants.ReadListMerchants;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Mappers;

public static class AdminMinimalMerchantMapper
{
    public static AdminMinimalMerchant ToMinimalData(
        Merchant merchant,
        long lifetimeVolume = 0,
        long totalFeesPaid = 0)
    {
        var activeAcquirer = merchant.MerchantAcquirers?.FirstOrDefault(ma => ma.IsActive && ma.IsDefault);

        return new AdminMinimalMerchant
        {
            Id = merchant.Id,
            UserId = merchant.UserId,
            UserName = merchant.User?.Name,
            // ... demais campos
            LifetimeVolume = lifetimeVolume,
            TotalFeesPaid = totalFeesPaid
        };
    }
}
```

### Uso no Endpoint (DTO/Projeção)

```csharp
// ✅ CORRETO - Usar mapper para projeções
var merchants = await query.ToListAsync(ct);
var items = merchants.Select(m =>
{
    balances.TryGetValue(m.Id, out var volume);
    return AdminMinimalMerchantMapper.ToMinimalData(m, volume);
}).ToList();

// ❌ ERRADO - Criar objeto inline no Select
var merchants = await query.Select(m => new AdminMinimalMerchant
{
    Id = m.Id,
    Name = m.Name,
    // ... muitos campos inline
}).ToListAsync(ct);
```

### Exemplo de Mapper Completo

```csharp
using swiftpay_api.Endpoints.Admin.Merchants.ReadMerchantDashboard;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Ledger;

namespace swiftpay_api.Mappers;

public static class AdminMerchantDashboardMapper
{
    public static AdminReadMerchantDashboardData ToData(
        MerchantDashboardCache cache,
        MerchantBalanceInfo balance,
        int cacheDurationMinutes)
    {
        return new AdminReadMerchantDashboardData
        {
            Kpis = ToKpiData(cache),
            Balance = ToBalanceData(balance),
            VolumeChart = ParseVolumeChart(cache.VolumeChartJson),
            CacheInfo = ToCacheInfo(cache, cacheDurationMinutes)
        };
    }

    public static AdminMerchantKpiData ToKpiData(MerchantDashboardCache cache)
    {
        return new AdminMerchantKpiData
        {
            TotalVolume = cache.TotalVolume,
            TotalFees = cache.TotalFees,
            // ... demais campos
        };
    }
}
```

### Uso no Endpoint

```csharp
// ✅ CORRETO - Usar mapper
await Send.ResponseAsync(new MyResponse
{
    Data = MyMapper.ToData(entity)
}, 200, ct);

// ❌ ERRADO - Criar manualmente
await Send.ResponseAsync(new MyResponse
{
    Data = new MyData
    {
        Id = entity.Id,
        Name = entity.Name,
        // ... muitos campos
    }
}, 200, ct);
```

### Benefícios

1. **Reutilização**: O mesmo mapper pode ser usado em múltiplos endpoints
2. **Manutenção**: Alterações no mapeamento ficam centralizadas
3. **Testabilidade**: Mappers podem ser testados isoladamente
4. **Legibilidade**: Endpoints ficam mais limpos e focados na lógica de negócio

---

## Padrões de Código

### Nomenclatura

- Endpoints: `[Acao][Recurso]Endpoint` (ex: `ReadSettingsEndpoint`, `CreateMerchantEndpoint`)
- Requests: `[Acao][Recurso]Request`
- Responses: `[Acao][Recurso]Response`
- Data: `[Recurso]Data` ou `[Acao][Recurso]Data`

### Verbos HTTP

- `GET` - Leitura (Read, List)
- `POST` - Criação (Create, Submit)
- `PATCH` - Atualização parcial (Update)
- `PUT` - Atualização completa
- `DELETE` - Remoção

### Convenções de Rota

```csharp
// Listar recursos
Get("");                              // GET /v1/merchant

// Ler um recurso
Get("{merchantId:guid}");             // GET /v1/merchant/{id}

// Criar recurso
Post("");                             // POST /v1/merchant

// Atualizar recurso
Patch("{merchantId:guid}");           // PATCH /v1/merchant/{id}

// Deletar recurso
Delete("{merchantId:guid}");          // DELETE /v1/merchant/{id}

// Ações especiais
Post("{merchantId:guid}/submit");     // POST /v1/merchant/{id}/submit
```

### Respostas HTTP

- `200` - Sucesso
- `201` - Criado
- `400` - Erro de validação ou regra de negócio
- `401` - Não autenticado
- `403` - Não autorizado
- `404` - Não encontrado
- `500` - Erro interno

---

## Exemplo Completo

### UpdateMerchantSettings

**Models:**
```csharp
using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Merchants.UpdateSettings;

public sealed class UpdateSettingsRequest
{
    public Guid MerchantId { get; set; }
    public string? WebhookUrl { get; set; }
    public bool? WebhookEnabled { get; set; }
    public int? PixTimeoutMinutes { get; set; }
}

public sealed class UpdateSettingsRequestValidator : Validator<UpdateSettingsRequest>
{
    public UpdateSettingsRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.WebhookUrl)
            .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
            .When(x => !string.IsNullOrEmpty(x.WebhookUrl))
            .WithMessage("A URL do webhook deve ser válida.");

        RuleFor(x => x.PixTimeoutMinutes)
            .InclusiveBetween(5, 60)
            .When(x => x.PixTimeoutMinutes.HasValue)
            .WithMessage("O timeout do PIX deve ser entre 5 e 60 minutos.");
    }
}

public sealed class UpdateSettingsResponse : BaseResponse<SettingsData>;

public sealed class SettingsData
{
    public Guid Id { get; set; }
    public string? WebhookUrl { get; set; }
    public bool WebhookEnabled { get; set; }
    public int PixTimeoutMinutes { get; set; }
}
```

**Endpoint:**
```csharp
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Merchants.UpdateSettings;

public sealed class UpdateSettingsEndpoint(
    PrimaryDbContext dbContext,
    INotificationService notificationService
) : Endpoint<UpdateSettingsRequest, UpdateSettingsResponse>
{
    public override void Configure()
    {
        Patch("{merchantId:guid}/settings");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(UpdateSettingsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new UpdateSettingsResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .Include(m => m.MerchantSettings)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new UpdateSettingsResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var settings = merchant.MerchantSettings;
        if (settings == null)
        {
            await Send.ResponseAsync(new UpdateSettingsResponse
            {
                Error = new("Configurações não encontradas.")
            }, 404, ct);
            return;
        }

        // Atualizar campos
        if (req.WebhookUrl != null) settings.WebhookUrl = req.WebhookUrl;
        if (req.WebhookEnabled.HasValue) settings.WebhookEnabled = req.WebhookEnabled.Value;
        if (req.PixTimeoutMinutes.HasValue) settings.PixTimeoutMinutes = req.PixTimeoutMinutes.Value;

        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new UpdateSettingsResponse
        {
            Data = new SettingsData
            {
                Id = settings.Id,
                WebhookUrl = settings.WebhookUrl,
                WebhookEnabled = settings.WebhookEnabled,
                PixTimeoutMinutes = settings.PixTimeoutMinutes
            },
            Message = "Configurações atualizadas com sucesso!"
        }, ct);
    }
}
```

---



