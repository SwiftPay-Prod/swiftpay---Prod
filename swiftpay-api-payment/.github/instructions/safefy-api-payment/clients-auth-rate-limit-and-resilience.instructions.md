---
description: "Use when editing external API clients, JSON mapping, credential validation, rate limiting, and HTTP resilience policies."
applyTo: 'Clients/**/*.cs, Endpoints/Auth/**/*.cs, Middlewares/**/*.cs, Extensions/**/*.cs, Services/**/*.cs'
---

## Integração com APIs Externas (Clients)

### Mapeamento JSON para Respostas

Ao criar models para respostas de integração com APIs externas, **sempre** utilizar `[JsonPropertyName]`:

```csharp
using System.Text.Json.Serialization;

public sealed class ExampleResponse
{
    [JsonPropertyName("transactionId")]
    public string? TransactionId { get; set; }
    
    [JsonPropertyName("txId")]
    public string? TxId { get; set; }
    
    [JsonPropertyName("amount")]
    public long? Amount { get; set; }
    
    [JsonPropertyName("status")]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ExampleStatus? Status { get; set; }
}
```

**Motivo:** As APIs externas geralmente retornam propriedades em camelCase, enquanto o C# usa PascalCase.

### Wrapper de Resposta (Envelope por Provider)

Não congele exemplos de payload bruto da adquirente nas instructions.

Quando o provider encapsular dados em envelope com metadados e `data`, deserializar usando o wrapper específico daquele provider:
```csharp
var apiResponse = JsonSerializer.Deserialize<ProviderEnvelopeResponse<MyResponse>>(responseBody, JsonOptions);
var result = apiResponse?.Data;
```

Use o tipo de envelope real existente no client do provider.

Se o contrato da adquirente mudar, ajuste os models do client e os testes de integração, sem replicar JSON fixo neste arquivo.

### Enums em Respostas JSON

Para enums que vêm como string na resposta da API:
```csharp
[JsonPropertyName("status")]
[JsonConverter(typeof(JsonStringEnumConverter))]
public MyEnumType? Status { get; set; }
```

---

## Validação de Credenciais em Tempo Real

O `CredentialValidationMiddleware` valida a cada requisição autenticada se a credencial ainda está ativa:

**Funcionamento:**
1. Após o usuário obter um token JWT via `/v1/auth/token`, cada requisição subsequente passa pelo middleware
2. O middleware extrai o `credential_id` e `secret_version` do token JWT
3. Verifica no banco se a credencial ainda está `Active`, se o merchant está `Active` e se a versão do secret é a mesma
4. Se a credencial foi revogada/inativa, merchant desativado ou credencial regenerada, retorna `401 Unauthorized`

**Campo `SecretVersion`:**
- Cada credencial tem um campo `SecretVersion` (int) que começa em 1
- Quando a credencial é regenerada, o `SecretVersion` é incrementado
- O token JWT contém a claim `secret_version` com o valor no momento da geração
- O middleware compara a versão do token com a versão atual da credencial

**Códigos de Erro:**

| Código | Mensagem |
|--------|----------|
| `credential_not_found` | Credencial não encontrada |
| `credential_inactive` | Credencial inativa, revogada ou regenerada |
| `merchant_inactive` | Conta do merchant inativa |

**Paths excluídos da validação:**
- `/v1/auth/token` - Endpoint de autenticação
- `/v1/internal/*` - Webhooks de adquirentes
- `/health` - Health check
- `/docs` - Documentação

---

## Rate Limiting

Rate limiting é aplicado nos endpoints de criação de transação:
- `/v1/pix` (POST)
- `/v1/transactions` (POST)

Limites configuráveis por merchant (via Admin na safefy-api):
- `RateLimitPerMinute`: 60 req/min (padrão)
- `RateLimitPerHour`: 1.000 req/hora (padrão)
- `RateLimitPerDay`: 10.000 req/dia (padrão)

Headers de resposta:
- `X-RateLimit-Limit-Minute`
- `X-RateLimit-Remaining-Minute`
- `X-RateLimit-Limit-Hour`
- `X-RateLimit-Remaining-Hour`
- `Retry-After` (quando bloqueado)

---

## Circuit Breaker e Resiliência HTTP

Os clientes HTTP das adquirentes usam políticas de resiliência:

```csharp
// Configuração via Extension Methods
builder.Services.AddAcquirerHttpClient<IProviderAClient, ProviderAClient>("provider-a");
builder.Services.AddAcquirerHttpClient<IProviderBClient, ProviderBClient>("provider-b");
builder.Services.AddWebhookHttpClient();
```

**Políticas para Adquirentes:**
- **Circuit Breaker**: Abre após 50% de falhas em 5+ requests, fecha após 30s
- **Retry**: 3 tentativas com exponential backoff (500ms, 1s, 2s) + jitter
- **Timeout**: 15 segundos por tentativa

**Políticas para Webhooks:**
- **Circuit Breaker**: 80% de falhas em 10+ requests, fecha após 1 minuto
- **Retry**: 3 tentativas com backoff (2s, 4s, 8s)
- **Timeout**: 10 segundos por tentativa

---
