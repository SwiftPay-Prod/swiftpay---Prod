---
description: "Use when creating or updating endpoints, request and response models, groups, validators, and shared endpoint utilities."
applyTo: 'Endpoints/**/*.cs, EndpointsGroups/**/*.cs, Endpoints/Models/**/*.cs, Validators/**/*.cs, Mappers/**/*.cs'
---

## Criando um Endpoint

### 1. Estrutura de Pasta

Cada endpoint deve estar em sua própria pasta com dois arquivos:
- `[NomeAcao]Endpoint.cs` - Lógica do endpoint
- `[NomeAcao]Models.cs` - Request, Response e Validator

Exemplo para `ReadSettings`:
```
Endpoints/Merchants/ReadSettings/
├── ReadSettingsEndpoint.cs
└── ReadSettingsModels.cs
```

### 2. Arquivo de Models (`[NomeAcao]Models.cs`)

```csharp
using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Merchants.ReadSettings;

// Request - sempre sealed class
public sealed class ReadSettingsRequest
{
    public Guid MerchantId { get; set; }
}

// Validator - opcional, mas recomendado
public sealed class ReadSettingsRequestValidator : Validator<ReadSettingsRequest>
{
    public ReadSettingsRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");
    }
}

// Response - herda de BaseResponse<T>
public sealed class ReadSettingsResponse : BaseResponse<ReadSettingsData>;

// Data - modelo de dados da resposta
public sealed class ReadSettingsData
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    // ... outras propriedades
}
```

### 3. Arquivo de Endpoint (`[NomeAcao]Endpoint.cs`)

```csharp
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api.Models.Database;

namespace safefy_api.Endpoints.Merchants.ReadSettings;

public sealed class ReadSettingsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadSettingsRequest, ReadSettingsResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/settings");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadSettingsRequest req, CancellationToken ct)
    {
        // 1. Validar token/usuário
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadSettingsResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        // 2. Buscar dados
        var merchant = await dbContext.Merchants
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ReadSettingsResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        // 3. Retornar sucesso
        await Send.OkAsync(new ReadSettingsResponse
        {
            Data = new(new ReadSettingsData
            {
                Id = merchant.Id,
                Name = merchant.Name
            })
        }, ct);
    }
}
```

---

## Modelos de Resposta Padrão

### BaseResponse

Todas as respostas devem herdar de `BaseResponse<T>`:

```csharp
// Localização: Endpoints/Models/BaseResponse.cs

// Resposta simples (sem dados)
public class BaseResponse
{
    public string? Message { get; set; }
    public ErrorResponse? Error { get; set; }
}

// Resposta com dados tipados
public class BaseResponse<T>
{
    public T? Data { get; set; }
    public string? Message { get; set; }
    public ErrorResponse? Error { get; set; }
}

// Erro da resposta
public class ErrorResponse
{
    public string? Message { get; set; }
}
```

### Uso nos Endpoints

```csharp
// Sucesso com dados
await Send.OkAsync(new MyResponse
{
    Data = new MyData { ... }
}, ct);

// Sucesso com dados e mensagem
await Send.OkAsync(new MyResponse
{
    Data = new MyData { ... },
    Message = "Operação realizada com sucesso!"
}, ct);

// Sucesso apenas com mensagem (BaseResponse sem tipo)
await Send.OkAsync(new MyResponse
{
    Message = "Operação realizada com sucesso!"
}, ct);

// Erro
await Send.ResponseAsync(new MyResponse
{
    Error = new("Mensagem de erro.")
}, 400, ct);
```

### Paginação

Para endpoints com listagem paginada:

```csharp
// No Models
public sealed class ListRequest : IPaginatedRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public sealed class ListResponse : BaseResponse<Paginated<ItemData>>;

// No Validator
public sealed class ListValidator : Validator<ListRequest>
{
    public ListValidator()
    {
        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();
    }
}

// No Endpoint
var items = await dbContext.Items
    .Skip((req.Page - 1) * req.PageSize)
    .Take(req.PageSize)
    .ToListAsync(ct);

var totalItems = await dbContext.Items.CountAsync(ct);

await Send.OkAsync(new ListResponse
{
    Data = new Paginated<ItemData>
    {
        Items = items.Select(x => new ItemData { ... }).ToList(),
        TotalItems = totalItems,
        Page = req.Page,
        PageSize = req.PageSize,
        TotalPages = (int)Math.Ceiling(totalItems / (double)req.PageSize)
    }
}, ct);
```

---

## Grupos de Endpoints

Os grupos definem prefixos de rota e configurações compartilhadas:

### MerchantGroup
```csharp
// Prefixo: /v1/merchant
// Requer autenticação (padrão)
Group<MerchantGroup>();
```

### AdminGroup
```csharp
// Prefixo: /v1/admin
// Requer roles: God ou Admin
Group<AdminGroup>();
```

### AuthGroup
```csharp
// Prefixo: /v1/auth
// Permite acesso anônimo
// Rate limiting: "auth"
Group<AuthGroup>();
```

### UserGroup
```csharp
// Prefixo: /v1/users
// Requer autenticação
Group<UserGroup>();
```

### FileGroup
```csharp
// Prefixo: /v1/files
// Requer autenticação
// Usado para obter URLs de arquivos com autorização
Group<FileGroup>();
```

---

## Utilitários (EndpointUtils)

```csharp
using safefy_api_core.Utils;

// Obter ID do usuário autenticado
var userId = EndpointUtils.GetUserId(User);

// Obter role do usuário
var role = EndpointUtils.GetUserRole(User);

// Obter email do usuário
var email = EndpointUtils.GetUserEmail(User);

// Obter nome do usuário
var name = EndpointUtils.GetUserName(User);

// Obter IP do cliente
var ip = EndpointUtils.GetIpAddress(HttpContext);

// Obter User-Agent
var userAgent = EndpointUtils.GetUserAgent(HttpContext);
```

---

## Utilitários de Criptografia (CryptoUtils)

```csharp
using safefy_api_core.Utils;

// Gerar token seguro (Base64 URL-safe, 32 bytes)
var token = CryptoUtils.GenerateToken();

// Gerar código numérico de 6 dígitos
var code = CryptoUtils.GenerateCode();

// Gerar senha segura
var password = CryptoUtils.GenerateSecurePassword(12);

// Hash SHA256
var hash = CryptoUtils.ComputeSha256Hash(input);

// Gerar credenciais de API (pk_ para chave pública, sk_ para chave privada)
var (clientId, clientSecret, clientSecretHash) = CryptoUtils.GenerateApiCredentials("Production");
// clientId = "pk_production_..." (chave pública)
// clientSecret = "sk_production_..." (chave privada)

// Gerar webhook secret
var webhookSecret = CryptoUtils.GenerateWebhookSecret(); // whsec_...

// Computar HMAC-SHA256 para webhook
var signature = CryptoUtils.ComputeHmacSha256(payload, secret);
```

---

## Utilitários de Cálculo de Taxas (FeeCalculator)

```csharp
using safefy_api_core.Utils;

// Calcular taxa com base no modo de cobrança
var fee = FeeCalculator.Calculate(amount, feeMode, fixedFee, percentageBasisPoints);

// Calcular valor máximo líquido para saque dado um saldo disponível
var maxNet = FeeCalculator.CalculateMaxNetForWithdrawal(availableBalance, feeMode, fixedFee, percentageBasisPoints);
```

**Importante**: Sempre use `FeeCalculator` no backend para cálculos de taxas. Nunca faça cálculos de taxa no frontend, pois JavaScript e .NET podem ter diferenças de precisão. Use os endpoints de preview para obter os valores calculados pelo backend.

### Endpoints de Preview de Taxas

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `POST /v1/merchant/{merchantId}/payments/preview` | POST | Preview de taxa para criação de transação |
| `POST /v1/merchant/{merchantId}/cashouts/preview` | POST | Preview de taxa para criação de saque |

- Defina e mantenha o contrato em `[NomeAcao]Models.cs` de cada endpoint.
- O retorno deve seguir o padrão `BaseResponse<T>` e expor apenas os campos financeiros necessários para a decisão do cliente.

---



