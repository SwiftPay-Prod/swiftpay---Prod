# Swiftpay Acquirer Integration

## Sub-skills
- **swiftpay-payment-processing** — payment flow that calls acquirers
- **swiftpay-webhooks** — incoming webhook processing
- **dotnet/dotnet-webapi** — HTTP client patterns

## Architecture
Strategy + Factory pattern with 4 layers per acquirer:

```
AcquirerServiceFactory (resolves by AcquirerType)
  → IAcquirerService (strategy interface)
    → {Acquirer}Service (business logic)
      → {Acquirer}Client (HTTP transport)
      → {Acquirer}ResponseParser (response parsing)
      → {Acquirer}StatusConverter (status mapping)
```

## Integration Checklist (for each new acquirer)
1. Add `AcquirerType` enum value
2. Create HTTP client: `{Acquirer}Client.cs`
3. Create response parser: `{Acquirer}ResponseParser.cs`
4. Create status converter: `{Acquirer}StatusConverter.cs`
5. Create service: `{Acquirer}Service.cs` implementing `IAcquirerService`
6. Register in `AcquirerServiceFactory` DI
7. Add configuration seeding (URLs, default credentials)
8. Add webhook route + auth

## IAcquirerService Interface
```csharp
public interface IAcquirerService
{
    AcquirerType AcquirerType { get; }
    Task<PixGenerationResult> GeneratePixAsync(AcquirerConfig config, PixGenerationRequest request);
    Task<PixStatusResult> GetPixStatusAsync(AcquirerConfig config, string txId);
    Task<WithdrawResult> WithdrawAsync(AcquirerConfig config, WithdrawRequest request);
}
```

## Client Layer Rules
- ONLY HTTP transport: request building, sending, status code handling
- NO business logic, NO inline JSON parsing, NO status mapping
- Return `AcquirerClientResponse<T>` (Success, StatusCode, ErrorCode, ErrorMessage, Data)
- Use typed HttpClient via DI

## Parser Layer
- Parse acquirer response into internal models
- Handle error responses, extract error codes/messages
- Use case-insensitive property lookup

## Status Converter
- Map acquirer-specific statuses to internal `PaymentStatus`:
```csharp
PaymentStatus ToPaymentStatus(AcquirerSpecificStatus status);
WithdrawStatus ToWithdrawStatus(AcquirerSpecificWithdrawStatus? status);
```

## Webhook Auth Modes
- **None**: No auth
- **Token**: Check `Authorization: Bearer`, `X-Webhook-Token`, `X-Webhook-Secret`, `X-Api-Key`
- **IP**: Check `WebhookAllowedIps` (supports CIDR)
- **TokenAndIp**: Both must pass
- **HmacSha256**: Body + timestamp HMAC verification

## Credential Management
- `Acquirer.CredentialSchema`: JSON Schema defining required fields
- `Acquirer.DefaultCredentials` / `DefaultCredentialsSandbox`: Default JSON values
- `MerchantAcquirer.Credentials`: Merchant-specific overrides (merged on top)
- All credentials stored as JSONB, resolved at runtime

## Nominal A/B Testing
- Suporta distribuição entre duas adquirentes por peso percentual
- Finalização automática: por dias ou por número de transações
- Na finalização: calcula winner (maior taxa de completed), desativa perdedoras
