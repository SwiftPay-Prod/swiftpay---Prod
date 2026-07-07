# SWIFTPAY — Mapa de Webhooks

> **Data de análise:** 21/05/2026

---

## 1. Visão Geral do Sistema de Webhooks

O SWIFTPAY opera webhooks em **duas direções**:

| Direção | Origem | Destino | Propósito | Tráfego |
|---------|--------|---------|-----------|---------|
| **Incoming** | Adquirentes (9) | swiftpay-api-payment | Notificação de pagamento/saque processado | Webhook HTTP POST |
| **Outgoing** | swiftpay-api-payment | Merchant (URL de callback) | Notificação de evento de pagamento/saque | Webhook HTTP POST (+ retry) |

Arquitetura: **Publish-Subscribe via RabbitMQ** para desacoplar o recebimento do webhook do processamento dos efeitos colaterais (ledger, notificações, emails, dashboard).

---

## 2. Incoming Webhooks — Endpoints por Adquirente

Todos os endpoints de webhook estão em `swiftpay-api-payment` sob o prefixo `/v1/internal/{acquirer}/webhooks`.

| # | Adquirente | Rota Completa | Auth Mode |
|---|-----------|---------------|-----------|
| 1 | Bankizi | `POST /v1/internal/bankizi/webhooks` | HMAC-SHA256 + Token |
| 2 | IHubBanking | `POST /v1/internal/ihubbanking/webhooks` | Token |
| 3 | Rapdyn | `POST /v1/internal/rapdyn/webhooks` | Token |
| 4 | Accithus | `POST /v1/internal/accithus/webhooks` | HMAC-SHA256 |
| 5 | Coldfy | `POST /v1/internal/coldfy/webhooks` | Token |
| 6 | HeartPay | `POST /v1/internal/heartpay/webhooks` | HMAC-SHA256 (especial) |
| 7 | HunterPay | `POST /v1/internal/hunterpay/webhooks` | HMAC-SHA256 |
| 8 | Pluggou | `POST /v1/internal/pluggou/webhooks` | Token |
| 9 | ActivePayments | `POST /v1/internal/activepayments/webhooks` | HMAC-SHA256 + IP |

---

## 3. Fluxo de Processamento — Incoming Webhook

### Pipeline (ordem de execução)

```
POST /v1/internal/{code}/webhooks
  │
  ├─▶ AcquirerWebhookAuthMiddleware (opcional)
  │   └─ Regex match: /v1/internal/([^/]+)/
  │   └─ Exclui: cashouts, transactions, orders
  │   └─ Valida: Token / IP / HMAC (conforme WebhookAuthMode)
  │
  ├─▶ AcquirerWebhookAuthPreProcessor (FastEndpoints Global PreProcessor)
  │   ├─ 1. Extrai acquirerCode da rota
  │   ├─ 2. Busca todos Acquirers ativos com Code correspondente (suporta variantes: heartpay, heartpay_1)
  │   ├─ 3. Tenta autenticar cada candidato
  │   ├─ 4. Validação:
  │   │   ├─ Token: Authorization Bearer, X-Webhook-Token, X-Webhook-Code
  │   │   ├─ IP: X-Forwarded-For (primeiro IP), RemoteIpAddress, CIDR suportado
  │   │   └─ HMAC-SHA256: X-Webhook-Signature (hex, base64, base64url)
  │   │       └─ HeartPay especial: X-HeartPay-Signature + X-HeartPay-Timestamp → "{ts}.{body}"
  │   ├─ 5. Loga request bruto (AcquirerWebhookLogs)
  │   └─ 6. Armazena Acquirer no HttpContext.Items
  │
  ├─▶ FastEndpoints: Deserialize + Validate (FluentValidation)
  │
  └─▶ AcquirerWebhookEndpoint.HandleAsync()
      ├─ Discriminação de evento (PIX_IN vs PIX_OUT, Transaction vs TransferOut, etc.)
      ├─ Status mapping (AcquirerStatus → PaymentStatus / PayoutStatus)
      ├─ Payment branch:
      │   └─ paymentProcessingService.ProcessAcquirerWebhookAsync(data)
      └─ Cashout branch:
          └─ cashoutService.ProcessAcquirerWebhookAsync(data)
```

### 3.1 Algoritmo de Lock Otimista (Race Condition Prevention)

Ambos `PaymentProcessingService` e `CashoutService` usam o mesmo padrão:

```
Entrada: AcquirerPaymentId, targetStatus, payer data

1. GetValidSourceStatuses(targetStatus):
   → Completed/Failed/Expired/Cancelled: [Pending, Processing]
   → Refunded/PartiallyRefunded:           [Completed]
   → Processing (refund request):         [Completed]

2. FindAndLockPayment (ExecuteUpdateAsync — ATÔMICO):
   UPDATE Payments SET Status = 'Confirming'
   WHERE AcquirerPaymentId = @id AND Status IN (@validSources)
   
   Se 0 linhas afetadas → tenta por ExternalId (Guid) → tenta por TxId (PaymentPix)

3. Se lock obtido:
   ├─ ApplyStatusChange:
   │   Completed:  payment.CompletedAt = UtcNow, EndToEndId/PayerName/Document/Bank = webhookData
   │   Failed:     payment.FailureReason = errorMessage ?? "Falha no processamento"
   │   Cancelled:  payment.FailureReason = errorMessage ?? "Pagamento cancelado"
   │   Expired:    payment.FailureReason = "PIX expirado" / "Boleto expirado"
   │   Refunded:   payment.RefundedAt = UtcNow, payment.RefundedAmount = webhookData.RefundedAmount
   │   PartiallyRefunded: payment.RefundedAmount += webhookData.RefundedAmount
   ├─ SaveChanges
   └─ Publish PaymentCompletedMessage → RabbitMQ

4. Se lock NÃO obtido → AlreadyProcessed (idempotência)
```

### 3.2 Proteção de Ledger para Saques

```
HasSettlementOutRecordedAsync(payoutId):
  Se já existe SettlementOut no ledger para este PayoutId:
    → Webhooks negativos (Failed/Rejected/Cancelled) são IGNORADOS
    → Payout permanece como Completed
    → Previne flutuação de saldo por webhooks atrasados
```

---

## 4. Mapeamento de Status por Adquirente

### 4.1 Payment Status Mapping

| Adquirente | Pago | Expirado | Falhou | Cancelado | Reembolsado | Reemb. Parcial |
|-----------|------|----------|--------|-----------|-------------|----------------|
| **Bankizi** | `PAID` | `EXPIRED` | — | `CANCELLED` | `REFUNDED` | `PARTIALLY_REFUNDED` |
| **IHub** | `cashin.paid` | `cashin.expired` | `cashin.failed` | `cashin.cancelled` | `cashin.refunded` | — |
| **Rapdyn** | Via converter | — | — | — | Via converter | — |
| **Accithus** | Via converter | — | — | — | Via converter | — |
| **Coldfy** | Via converter | — | — | — | — | — |
| **HeartPay** | `ChargePaid` | `ChargeExpired` | `ChargeFailed` | `ChargeCancelled` | — | — |
| **HunterPay** | Via converter | — | Via converter | Via converter | Via converter | — |
| **Pluggou** | Via converter | — | — | — | — | — |
| **ActivePayments** | `ChargePaid`, `BilletPaid` | `ChargeExpired`, `BilletExpired` | `ChargeFailed` | `ChargeCancelled` | — | — |

### 4.2 Cashout Status Mapping

| Adquirente | Concluído | Falhou | Rejeitado | Cancelado |
|-----------|-----------|--------|-----------|-----------|
| **Bankizi** | `DONE` | `FAILED` | `REJECT` | — |
| **IHub** | `cashout.success` | `cashout.failed`, `cashout.error` | `cashout.rejected` | — |
| **Rapdyn** | Via converter | — | — | — |
| **Accithus** | Via converter | — | — | — |
| **Coldfy** | Via converter | — | — | — |
| **HeartPay** | `PayoutCompleted` | `PayoutFailed` | `PayoutRejected` | `PayoutCancelled` |
| **HunterPay** | Via converter | — | — | — |
| **Pluggou** | Via converter | — | — | — |
| **ActivePayments** | `WithdrawalCompleted`, `WithdrawalDone`, `WithdrawalApproved` | `WithdrawalFailed` | `WithdrawalRejected` | — |

---

## 5. Outgoing Webhooks — Envio ao Merchant

### 5.1 Trigger — Quem dispara o envio

| Evento | Disparado por | Condição |
|--------|--------------|----------|
| `payment.completed` | PaymentCompletedConsumer | `!SuppressWebhookAndNotification && !IsWayneProtocol && CallbackUrl != null` |
| `payment.expired` | PaymentCompletedConsumer | Mesma condição |
| `payment.failed` | PaymentCompletedConsumer | Mesma condição |
| `payment.cancelled` | PaymentCompletedConsumer | Mesma condição |
| `payment.refunded` | PaymentCompletedConsumer | Mesma condição |
| `payment.partially_refunded` | PaymentCompletedConsumer | Mesma condição |
| `cashout.completed` | CashoutService | `CallbackUrl != null` |
| `cashout.failed` | CashoutService | Mesma condição |
| `cashout.rejected` | CashoutService | Mesma condição |
| `cashout.cancelled` | CashoutService | Mesma condição |

### 5.2 Payload — Estrutura JSON

```json
{
  "id": "<webhookId (GuidV7)>",
  "type": "payment.completed|cashout.completed|...",
  "createdAt": "<ISO 8601 UTC>",
  "data": {
    "id": "<payment.id>",
    "externalId": "<payment.externalId>",
    "amount": 150000,
    "fee": 15000,
    "netAmount": 135000,
    "currency": "BRL",
    "method": "Pix|Boleto|CreditCard",
    "status": "Completed|Expired|Failed|Cancelled|Refunded|PartiallyRefunded",
    "environment": "Production|Sandbox",
    "description": "...",
    "completedAt": "<ISO 8601>",
    "refundedAt": "<ISO 8601>",
    "expiresAt": "<ISO 8601>",
    "failureReason": "...",
    "customerId": "<guid>",
    "pix": {
      "txId": "...",
      "endToEndId": "...",
      "payerName": "...",
      "payerDocument": "...",
      "payerBank": "..."
    }
  }
}
```

### 5.3 HMAC-SHA256 — Assinatura de Saída

```
Algoritmo: HMAC-SHA256
Segredo: payment.Id.ToString() (Guid)
Entrada: JSON completo do payload (UTF-8)
Formato do header: "sha256={hex_lowercase}"

Headers enviados:
  X-Safefy-Signature: sha256={hmac_hex}
  X-Safefy-Event: payment.completed|cashout.completed|...
  X-Safefy-Delivery: {webhookId}
  X-Safefy-Attempt: {attemptNumber}
  Content-Type: application/json
```

### 5.4 Retry Logic

| Parâmetro | Valor |
|-----------|-------|
| Máximo de tentativas | 3 |
| Estratégia | Exponential backoff: 2s → 4s → 8s |
| Timeout HTTP | 10s |
| Circuit Breaker | 80% falhas em 10+ requests → 1 min |
| Falha final | `CallbackStatus = Failed` + notificação `Priority=High` ao merchant |

### 5.5 Rastreamento de Callback

Campos na tabela `Payments` / `Payouts`:
```
CallbackStatus: NotConfigured → Pending → Sent / Failed
CallbackAttempts: número de tentativas
CallbackLastAttemptAt: timestamp
CallbackError: mensagem de erro (se falhou)
```

---

## 6. RabbitMQ — Fluxo de Mensagens

### Incoming Webhook → Processamento

```
POST /v1/internal/{acquirer}/webhooks
  │
  ├─▶ PaymentProcessingService.ProcessAcquirerWebhookAsync()
  │   └─ Publish: RabbitMQQueues.PaymentCompleted
  │       └─ Consumed by: PaymentCompletedConsumer
  │           ├─ Ledger recording (LedgerService)
  │           ├─ Notification (via SignalR)
  │           ├─ Stock release/confirmation
  │           ├─ Customer emails → Publish SendCustomerEmails
  │           ├─ Digital delivery → Publish ProcessDigitalDelivery
  │           ├─ Achievement check
  │           ├─ Wayne Protocol evaluation
  │           ├─ IF callback configured AND not suppressed:
  │           │   └─ Publish: RabbitMQQueues.SendWebhook
  │           │       └─ Consumed by: SendWebhookConsumer
  │           │           └─ WebhookService.SendWebhookAsync()
  │           └─ SignalR: hubContext.Clients.Group($"payment_{id}").SendAsync("PaymentStatusChanged")
  │
  └─▶ CashoutService.ProcessAcquirerWebhookAsync()
      └─ Publish: SendCashoutWebhook (se CallbackUrl configurado)
          └─ Consumed by: SendCashoutWebhookConsumer
              └─ CashoutWebhookService.SendWebhookAsync()
```

---

## 7. Logging e Observabilidade de Webhooks

### Três camadas de log:

**Layer 1: AcquirerWebhookLogEntry** (Log DB — tabela `AcquirerWebhookLogs`)
- Logado pelo `AcquirerWebhookAuthPreProcessor` em todo webhook real
- Campos: AcquirerId, AcquirerType, Endpoint, QueryString, RequestBody (max 200KB), RequestHeaders (sensíveis redacted), IpAddress, CorrelationId
- Headers sensíveis redacted: `Authorization`, `X-Webhook-Token`, `X-Webhook-Secret`, `X-Api-Key`

**Layer 2: ApiLog** (Log DB — tabela `ApiLogs`)
- Logado por cada endpoint via `WebhookLogHelper`
- Campos: Action=`AcquirerWebhookReceived`, Status=`Success/Warning/Failed`, StatusCode, ResourceId, ResourceType, AcquirerType, RequestBody, ResponseBody

**Layer 3: Log Queue System**
- `ILogQueue<T>` → enfileiramento em memória
- `LogBackgroundService` → flush batch para LogDbContext
- Evita IO síncrono no pipeline de requisição

### Admin Log Access:
- `GET /v1/admin/logs` com filtros: `AcquirerCode`, `AcquirerId`, `AcquirerType`, `IpAddress`, `StatusCode`, `CreatedAt`

---

## 8. State Machines

### Payment Status

```
                 ┌────────────────────────────────┐
                 │                                │
                 ▼                                │
[CREATE] ─▶ Pending ─▶ Confirming ─▶ Completed ──┼──▶ Refunded
              │  │                    │    │      │    PartiallyRefunded
              │  │                    │    └──────┼──▶ Disputed
              ├──┼──▶ Expired         │           │
              ├──┼──▶ Failed          │           │
              └──┼──▶ Cancelled       │           │
                 │                    │           │
                 └────────────────────┘           │
                                                  │
              Pending/Processing ◄────────────────┘
              (refund_requested)
```

**11 statuses:** `Pending`, `Processing`, `Confirming`, `Completed`, `Failed`, `Refunded`, `PartiallyRefunded`, `Disputed`, `Expired`, `Cancelled`

### Payout Status

```
[CREATE] ─▶ Pending ─▶ Processing ─▶ Confirming ─▶ Completed
              │                                        │
              ├──▶ Cancelled (user)                     ├──▶ Failed
              └──▶ Rejected (admin)                     ├──▶ Rejected (acquirer)
                                                        └──▶ Cancelled (acquirer)
```

---

## 9. Eventos de Webhook — Lista Completa

### Payment Events

| Event String | Trigger |
|-------------|---------|
| `payment.completed` | Webhook confirma pagamento |
| `payment.expired` | Webhook reporta expiração |
| `payment.failed` | Webhook reporta falha |
| `payment.cancelled` | Webhook reporta cancelamento |
| `payment.refunded` | Webhook reporta reembolso total |
| `payment.partially_refunded` | Webhook reporta reembolso parcial |
| `payment.refund_requested` | Webhook reporta solicitação de reembolso |

### Cashout Events

| Event String | Trigger |
|-------------|---------|
| `cashout.completed` | Saque processado com sucesso |
| `cashout.failed` | Saque falhou |
| `cashout.rejected` | Saque rejeitado pela adquirente |
| `cashout.cancelled` | Saque cancelado |
