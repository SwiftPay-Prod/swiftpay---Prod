# SWIFTPAY — Mapa de Providers (Adquirentes e Integrações)

> **Data de análise:** 21/05/2026

---

## 1. Arquitetura de Adquirentes (Plug-in Pattern)

Todas as adquirentes seguem o mesmo padrão de integração:

```
Client/{Acquirer}/     → HTTP transport (requisições à API externa)
Service/Acquirers/     → Domain orchestration (lógica de negócio)
Endpoints/Acquirers/   → Webhook receivers (callbacks das adquirentes)
Interfaces/Acquirers/  → Contratos (interfaces)
```

### Contrato Base: `IAcquirerService`

```csharp
public interface IAcquirerService
{
    AcquirerType AcquirerType { get; }
    bool SupportsPix { get; }
    bool SupportsBoleto { get; }
    bool SupportsCreditCard { get; }
    bool SupportsWithdraw { get; }
    
    Task<PixGenerationResult> GeneratePixAsync(AcquirerConfig config, PixGenerationRequest request);
    Task<PixStatusResult> GetPixStatusAsync(AcquirerConfig config, string acquirerPaymentId);
    Task<WithdrawResult> WithdrawAsync(AcquirerConfig config, WithdrawRequest request);
}
```

### Factory: `AcquirerServiceFactory`

Resolve `IAcquirerService` por `AcquirerType` via dicionário DI:

```csharp
public class AcquirerServiceFactory : IAcquirerServiceFactory
{
    private readonly Dictionary<AcquirerType, IAcquirerService> _services;
    
    public AcquirerServiceFactory(IEnumerable<IAcquirerService> services)
    {
        _services = services.ToDictionary(s => s.AcquirerType);
    }
    
    public IAcquirerService GetService(AcquirerType type) => _services[type];
}
```

---

## 2. Catálogo de Adquirentes

### 2.1 Bankizi

| Característica | Detalhe |
|---------------|---------|
| **Tipo** | `AcquirerType.Bankizi` |
| **Autenticação** | OAuth2 `client_credentials` → Bearer token |
| **Token endpoint** | `POST /auth/oauth/token` |
| **Cache de token** | MemoryCache com semáforo (lock) |
| **PIX geração** | `POST /pix/qrcode/dynamic` |
| **PIX status** | Não exposto separadamente (via webhook) |
| **Saque** | `POST /pix/withdraw/direct` |
| **Webhook Auth** | HMAC-SHA256 + Token |
| **Suporta PIX** | ✅ |
| **Suporta Boleto** | ❌ |
| **Suporta Cartão** | ❌ |
| **Suporta Saque** | ✅ |
| **Submerchant** | ❌ |
| **Status mapping** | `GENERATED→Pending, PAID→Completed, REQUESTED_REFUND→Processing, REFUNDED→Refunded, PARTIALLY_REFUNDED→PartiallyRefunded, EXPIRED→Expired, CANCELLED→Cancelled` |
| **Webhook discriminator** | `req.Event` campo (`"PIX_IN"` / `"PIX_OUT"`) |

### 2.2 IHubBanking

| Característica | Detalhe |
|---------------|---------|
| **Tipo** | `AcquirerType.IHubBanking` |
| **Autenticação** | Basic Auth (Secret Key) |
| **PIX geração** | `POST /pix/v2/qrcode` |
| **Saque** | `POST /pix/v2/out` |
| **Webhook Auth** | Token |
| **Eventos** | `cashin.paid→Completed, cashin.refunded→Refunded, cashin.failed→Failed, cashout.success→Completed, cashout.failed→Failed, cashout.rejected→Rejected` |
| **Suporta PIX** | ✅ |
| **Suporta Saque** | ✅ |

### 2.3 ActivePayments

| Característica | Detalhe |
|---------------|---------|
| **Tipo** | `AcquirerType.ActivePayments` |
| **Autenticação** | API Key (Public Key + Secret Key) |
| **PIX geração** | `POST /v1/pix/qrcode` |
| **Boleto geração** | `POST /v1/boleto` |
| **Webhook Auth** | HMAC-SHA256 + IP |
| **Suporta PIX** | ✅ |
| **Suporta Boleto** | ✅ |
| **Suporta Saque** | ❌ |
| **Webhook health check** | Event `Ping` retorna OK imediatamente |
| **Dual-source status** | Resolve de `Event` e `Data.Status`, payload tem prioridade para estados terminais |

### 2.4 Rapdyn

| Característica | Detalhe |
|---------------|---------|
| **Tipo** | `AcquirerType.Rapdyn` |
| **Autenticação** | Bearer Token |
| **PIX geração** | `POST /pix/v2/qrcode` |
| **Saque** | `POST /pix/v2/transfer-out` |
| **Webhook Auth** | Token |
| **Webhook discriminator** | `req.NotificationType` (`Transaction` / `TransferOut`) |
| **Fallback especial** | Quando lock primário falha, tenta correlação por **amount + PIX key** (única adquirente com este comportamento) |
| **Suporta PIX** | ✅ |
| **Suporta Saque** | ✅ |

### 2.5 Coldfy

| Característica | Detalhe |
|---------------|---------|
| **Tipo** | `AcquirerType.Coldfy` |
| **Autenticação** | Basic Auth (Secret Key + Company ID) |
| **PIX geração** | `POST /pix/qrcode` |
| **Boleto geração** | `POST /boleto` |
| **Webhook Auth** | Token |
| **Webhook discriminator** | Presença de `req.Withdrawal` vs `req.Data` + `req.Type==Transaction` |
| **Suporta PIX** | ✅ |
| **Suporta Boleto** | ✅ |
| **Suporta Saque** | ✅ |

### 2.6 Pluggou

| Característica | Detalhe |
|---------------|---------|
| **Tipo** | `AcquirerType.Pluggou` |
| **Autenticação** | Headers (Public Key + Secret Key) |
| **PIX geração** | `POST /pix/v2/qrcode/static` |
| **Saque** | `POST /pix/v2/out` |
| **Webhook Auth** | Token |
| **Webhook discriminator** | `req.EventType` enum (`Transaction` / `Withdrawal`) |
| **Suporta PIX** | ✅ |
| **Suporta Saque** | ✅ |

### 2.7 HunterPay

| Característica | Detalhe |
|---------------|---------|
| **Tipo** | `AcquirerType.HunterPay` |
| **Autenticação** | Basic Auth (API Key + Company ID) |
| **URL base** | `api.huntersub.com.br` (auto-normaliza host legado) |
| **PIX geração** | `POST /pix/qrcode` |
| **Saque** | `POST /withdrawal` |
| **Webhook Auth** | HMAC-SHA256 |
| **Webhook discriminator** | Multi-strategy: `Type` enum, `Event` enum, ou presença de IDs |
| **Status mapping** | `HunterPayStatusConverter` |
| **Suporta PIX** | ✅ |
| **Suporta Saque** | ✅ |
| **Fallback** | Campos opcionais com fallback automático |

### 2.8 HeartPay

| Característica | Detalhe |
|---------------|---------|
| **Tipo** | `AcquirerType.HeartPay` |
| **Autenticação** | Bearer Token |
| **URL base** | `app.heartpag.com/api` (auto-normaliza URLs legadas) |
| **PIX geração** | `POST /charges/pix` |
| **Boleto geração** | `POST /charges/boleto` |
| **Saque** | `POST /payouts` |
| **Webhook Auth** | HMAC-SHA256 (especial: `X-HeartPay-Signature` + `X-HeartPay-Timestamp`) |
| **HMAC payload** | `{timestamp}.{body}` |
| **Field resolver** | Usa `WebhookFieldResolver` para navegação multinível de payload |
| **ID resolution** | Prioriza `correlationID` sobre `id` |
| **Referência canônica** | Implementação de referência para novas adquirentes |
| **Suporta PIX** | ✅ |
| **Suporta Boleto** | ✅ |
| **Suporta Saque** | ✅ |

### 2.9 Accithus

| Característica | Detalhe |
|---------------|---------|
| **Tipo** | `AcquirerType.Accithus` |
| **Autenticação** | Basic Auth (Public Key + Secret Key) |
| **PIX geração** | `POST /transactions/pix` |
| **Cartão geração** | `POST /transactions/credit-card` |
| **Boleto geração** | `POST /transactions/boleto` |
| **Saque** | `POST /withdrawals` |
| **Webhook Auth** | HMAC-SHA256 |
| **Webhook discriminator** | Prefixo do campo `Event` (`transaction.*`/`payment.*` vs `withdrawal.*`/`payout.*`) |
| **Submerchant** | ✅ (IP — Instituição de Pagamento) |
| **Split config sync** | Atualizado automaticamente quando Admin altera MerchantSettings |
| **Suporta PIX** | ✅ |
| **Suporta Boleto** | ✅ |
| **Suporta Cartão** | ✅ |
| **Suporta Saque** | ✅ |

---

## 3. Modos de Autenticação de Webhook

| Modo | Validação | Uso |
|------|-----------|-----|
| `None` | Sem validação (apenas em dev/sandbox) | — |
| `Token` | `Authorization: Bearer {token}` / `X-Webhook-Token` / `X-Webhook-Code` / `X-Api-Key` / `X-Webhook-Secret` / query `?token=` | Várias adquirentes |
| `Ip` | IP whitelist (CIDR suportado, wildcard `*`) | — |
| `TokenAndIp` | Token + IP (ambos) | — |
| `HmacSha256` | `X-Webhook-Signature: sha256={hex}` (tenta hex, base64, base64url) | Bankizi, ActivePayments, HeartPay, Accithus |

### HeartPay — HMAC Especial
```
Header: X-HeartPay-Signature: sha256={hex}
Header: X-HeartPay-Timestamp: {unix_timestamp}
Payload para HMAC: "{timestamp}.{body}"
```

---

## 4. Resiliência HTTP (Polly)

Configuração aplicada a todos os HttpClient de adquirentes:

| Mecanismo | Parâmetro |
|-----------|----------|
| **Circuit Breaker** | 50% falhas em 5+ requests → abre por 30s |
| **Retry** | 3 tentativas: 500ms → 1s → 2s (+ jitter) |
| **Timeout** | 15 segundos |

Para webhooks enviados (outgoing):
| Mecanismo | Parâmetro |
|-----------|----------|
| **Circuit Breaker** | 80% em 10+ requests → abre por 1 min |
| **Retry** | 3 tentativas: 2s → 4s → 8s |
| **Timeout** | 10 segundos |

---

## 5. Credenciais das Adquirentes

### Modelos de Credencial

```csharp
public enum AcquirerCredentialType
{
    OAuth2ClientCredentials,  // client_id + client_secret
    BasicAuth,                // username + password + optional extra fields
    ApiKey,                   // public_key + secret_key
    BearerToken,              // token
    ApiHeaders                // chaves enviadas como headers HTTP
}

public class AcquirerCredentialField  // schema field definition
{
    string Key;           // internal name
    string Label;         // display name
    string Type;          // "text" / "password" / "select" / "number"
    string Placeholder;
    string Description;
    string[] Options;     // for select type
    bool Required;
    bool Sensitive;       // masked in UI
    int Order;
}
```

### Exemplos de Configuração

**Bankizi (OAuth2):**
```
client_id, client_secret, scope, token_url, base_url
```

**ActivePayments (API Key):**
```
public_key (pk_), secret_key (sk_), webhook_secret (whsec_), base_url
```

**HeartPay (Bearer):**
```
bearer_token, base_url, webhook_token
```

### Armazenamento Seguro
- Credenciais sensíveis (`Sensitive = true`) são criptografadas com `ICryptoUtils`
- Chaves exibidas apenas uma vez na criação, regeneráveis a qualquer momento
- Validação em tempo real na `swiftpay-api-payment` nos endpoints de criação de cobrança

---

## 6. Modelo Merchant-Acquirer

### Entidades

```
Merchant ──▶ MerchantAcquirer (many-to-many com IsActive)
                ├── AcquirerId
                ├── IsActive: bool (apenas 1 ativo por vez)
                ├── Credentials: JSONB (campos preenchidos por acquirer)
                ├── PayoutFeeMode, PayoutFeeFixed, PayoutFeePercentage
                ├── PixInFeeMode, PixInFeeFixed, PixInFeePercentage
                ├── BoletoInFeeMode, BoletoInFeeFixed, BoletoInFeePercentage
                ├── CreditCardInFeeMode, CreditCardInFeeFixed, CreditCardInFeePercentage
                ├── MinPixAmount, MaxPixAmount
                └── MerchantNominalAbTests (A/B testing)
            ──▶ Acquirer
                ├── Name, Code, Type
                ├── IsActive
                ├── WebhookAuthMode, WebhookToken, WebhookAllowedIps
                ├── NominalHistory (PixNominalHistory)
                ├── DashboardCache
                └── RequiredFields (KYC)
```

### Regras de Binding
- Apenas 1 `MerchantAcquirer.IsActive = true` por merchant
- Troca não requer saldo zero
- Adquirente inativa (`IsActive = false`) → não pode ser vinculada
- Histórico de trocas registrado em `MerchantAcquirerChangeHistory`
- Merchant NUNCA sabe qual adquirente está ativa (invisible acquirer)

---

## 7. Outros Providers Integrados

| Provider | Tipo | Propósito | API / SDK |
|----------|------|-----------|-----------|
| **DigitalOcean Spaces** | Storage | Upload de arquivos, imagens de produtos, KYC (S3-compatível) | AWSSDK.S3 |
| **Resend** | Email | Envio de emails transacionais | Resend .NET SDK |
| **Firebase** | Push | Push notifications (FCM) | Firebase SDK |
| **MailHog** | Email (dev) | Captura de emails em desenvolvimento | SMTP local |
| **MinIO** | Storage (dev) | S3-compatível local para desenvolvimento | AWSSDK.S3 |
| **Utmify** | Tracking | Tracking de pedidos | `POST https://api.utmify.com.br/api-credentials/orders` |
| **Otimizey** | Tracking | Tracking de pedidos | `POST https://api.otimizey.com.br/webhooks/credential/{id}` |
| **Microsoft Clarity** | Analytics | Análise de comportamento no frontend | Script client-side |
| **Facebook Pixel + CAPI** | Tracking | Conversão de anúncios | Script + Server API |
| **TikTok Pixel** | Tracking | Conversão de anúncios | Script client-side |
| **Google Tag Manager** | Tracking | Gerenciamento de tags | Script client-side |
| **Kwai Pixel** | Tracking | Conversão de anúncios | Script client-side |
| **Pinterest Tag** | Tracking | Conversão de anúncios | Script client-side |
| **Taboola Pixel** | Tracking | Conversão de anúncios | Script client-side |

---

## 8. Checklist para Nova Adquirente

Seguindo o padrão canônico (ref: HeartPay):

1. Atualizar `Acquirer.cs` — adicionar ao enum `AcquirerType`
2. Atualizar `SystemIds.cs` — adicionar `SystemAcquirerIds`
3. Atualizar `AcquirerRequiredFieldsDefaults.cs` — definir campos KYC obrigatórios
4. Atualizar `PrimaryDbInitialize.cs` — seed inicial
5. Atualizar `ServiceCollectionExtensions.cs` — registro DI
6. Atualizar `AcquirerWebhookUtils.cs` — registro de rota
7. Criar `EndpointsGroups/Acquirers/{Acquirer}Group.cs`
8. Criar `Endpoints/Acquirers/{Acquirer}/Webhook/`
9. Criar `Clients/{Acquirer}/` — Client.cs + ResponseParser.cs + Models/
10. Criar `Services/Acquirers/` — Service.cs + Utils/StatusConverter.cs
11. Criar `Interfaces/Acquirers/I{Acquirer}Service.cs`
12. Testes: `AcquirerStatusMappingTests.cs` (integração) + parser tests (unit)
