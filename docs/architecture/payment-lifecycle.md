# SWIFTPAY — Ciclo de Vida do Pagamento

> **Data de análise:** 21/05/2026

---

## 1. Visão Geral do Fluxo

Este documento traça o ciclo de vida **completo** de uma transação PIX, desde a criação até o saque final pelo merchant, incluindo todas as entidades criadas, mensagens RabbitMQ publicadas e operações de ledger registradas.

---

## 2. Fase 1: Criação do Pagamento

### Ponto de Entrada: `POST /v1/transactions` (swiftpay-api-payment)

```
POST /v1/transactions
Body: { method: "pix", amount: 10000, externalId: "...", customer: {...} }
Auth: JWT (pk_/sk_ credentials)
```

### Fluxo Interno

```
CreateTransactionEndpoint
  └─▶ TransactionService.CreateAsync(input)
      ├─ 1. Valida input por método (PIX)
      ├─ 2. Resolve/Cria Customer (por Document → Email → novo)
      └─ 3. PaymentMethodServiceFactory.GetService(Pix)
          └─▶ PixTransactionService.CreateAsync(input)
              ├─ 4. Carrega MerchantAcquirer + Acquirer + A/B test
              ├─ 5. Valida: adquirente ativa, suporta PIX, PIX habilitado, limites
              ├─ 6. Carrega fee settings: MerchantPaymentFeeSettings
              │       (MerchantSettings → fallback PlatformSettings)
              ├─ 7. Calcula fees:
              │       platformFee    = FeeCalculator(mode, fixed, pct)
              │       checkoutFee    = template fee (se checkout)
              │       acquirerFee    = FeeCalculator(acquirerPixInMode, ...)
              │       netAmount      = amount - platformFee - checkoutFee
              │       settlementAmt  = netAmount * (1 - reservePct)
              │       acquirerNetAmt = amount - acquirerFee
              ├─ 8. Cria entidade Payment (Status = Pending)
              ├─ 9. Gera PIX na adquirente:
              │       PixService.GeneratePixAsync()
              │       └─▶ AcquirerServiceFactory.GetService(acquirerType)
              │           └─▶ BankiziService.GeneratePixAsync(config, request)
              │               └─▶ BankiziClient → POST /pix/qrcode/dynamic
              │                   └─▶ Response: TxId, AcquirerPaymentId, CopyAndPaste, ExpiresAt
              ├─ 10. Cria PaymentPix (TxId, QrCode, CopyAndPaste, ExpiresAt)
              ├─ 11. SaveChanges (Payment + PaymentPix em uma transação)
              └─ 12. Publish RecordLedgerPendingMessage → RabbitMQ
```

### Entidades Criadas

| Entidade | Campos |
|----------|--------|
| `Payment` | Id, MerchantId, Amount=10000, PlatformFee=200, AcquirerFee=100, NetAmount=9800, MerchantSettlementAmount=9604, AcquirerNetAmount=9900, Status=Pending, Method=Pix, ExternalId, Environment |
| `PaymentPix` | Id, PaymentId, TxId, QrCode, CopyAndPaste, ExpiresAt (UTC+30min) |
| `Customer` (opcional) | Se CustomerName informado sem CustomerId |

### RabbitMQ Publicado: `swiftpay.ledger.pending`

---

## 3. Fase 2: Registro Pendente no Ledger

### Consumer: `RecordLedgerPendingConsumer` (swiftpay-api-payment)

```
Mensagem: RecordLedgerPendingMessage { PaymentId, MerchantId, Amount, PlatformFee }

RecordLedgerPendingConsumer
  └─▶ LedgerService.RecordPaymentPendingAsync(paymentId)
      ├─ Idempotência: verifica se já existe entry Pending para este PaymentId
      └─ Cria LedgerTransaction (Operation=PixIn, Status=Pending)
         └─ LedgerEntry: CREDIT MerchantPending (+netAmount = 9800)
            └─ UPDATE Accounts SET Balance = Balance + 9800 (MerchantPending)
```

### Estado Após Fase 2

```
Accounts:
  MerchantPending: +9800

Payment: Status = Pending
```

---

## 4. Fase 3: Confirmação do Pagamento (Webhook)

### Adquirente → SWIFTPAY

```
Bankizi POST /v1/internal/bankizi/webhooks
Body: { event: "PIX_IN", txId: "TX123", status: "PAID", endToEndId: "E123...", ... }
```

### Pipeline de Processamento

```
AcquirerWebhookAuthPreProcessor
  ├─ Autentica (HMAC-SHA256)
  ├─ Loga request bruto (AcquirerWebhookLogs)
  └─ Armazena Acquirer no HttpContext

BankiziWebhookEndpoint.HandleAsync()
  ├─ Discrimina: event "PIX_IN" → payment branch
  ├─ Status mapping: PAID → Completed
  └─▶ PaymentProcessingService.ProcessAcquirerWebhookAsync(data)
      ├─ 1. GetValidSourceStatuses(Completed) → [Pending, Processing]
      ├─ 2. Lock atômico:
      │       UPDATE Payments SET Status = 'Confirming'
      │       WHERE AcquirerPaymentId = 'TX123' AND Status IN ('Pending', 'Processing')
      │       → 1 row afetada (lock obtido)
      ├─ 3. ApplyStatusChange:
      │       payment.Status = Completed
      │       payment.CompletedAt = UtcNow
      │       payment.PaymentPix.EndToEndId = "E123..."
      │       payment.PaymentPix.PayerName = "João"
      │       payment.PaymentPix.PayerDocument = "123.456.789-00"
      ├─ 4. SaveChanges
      └─ 5. Publish PaymentCompletedMessage → RabbitMQ
```

### Estado Após Fase 3 (antes do consumer)

```
Payment: Status = Completed, CompletedAt = 2026-05-21T14:30:00Z
PaymentPix: EndToEndId = "E123...", PayerName = "João"
```

---

## 5. Fase 4: Processamento Pós-Pagamento (PaymentCompletedConsumer)

### Consumer: `PaymentCompletedConsumer` (swiftpay-api-payment)

```
Mensagem: PaymentCompletedMessage {
  PaymentId, MerchantId, Amount=10000, PlatformFee=200, AcquirerFee=100,
  NetAmount=9800, MerchantSettlementAmount=9604, NewStatus=Completed, ...
}

PaymentCompletedConsumer.Consume(msg)
  └─ NewStatus == Completed → ProcessCompletedAsync(msg)
```

### 5.1 Ledger — Registro de Pagamento Recebido

```
LedgerService.RecordPaymentReceivedAsync(paymentId)

Nova LedgerTransaction (Operation=PixIn, Status=Approved, Reference=paymentId):
  ├─ DEBIT  MerchantPending    -9800  "Pagamento confirmado (saída do pendente)"
  ├─ CREDIT MerchantAvailable  +9604  "PIX recebido (líquido disponível)"
  ├─ CREDIT MerchantReserved   +196   "PIX recebido (saldo reservado — 2%)"
  └─ CREDIT AcquirerSettlement +9900  "PIX recebido (líquido)"
  
  MerchantBalance KPIs atualizados:
    LifetimeVolume += 10000, LifetimeFeesPaid += 200
    VolumeToday++, VolumeThisWeek++, VolumeThisMonth++
```

### 5.2 Referral Commission

```
ReferralCommissionCompilationService.RegisterPaymentCompletedMovementAsync()

Se usuário foi indicado e está dentro da janela:
  commission = floor((platformFee - acquirerFee) * commissionPct / 10000)
            = floor((200 - 100) * 500 / 10000) = floor(5) = 5
  
  ReferralCommissionMovement {
    SourceType = Payment, SourceId = paymentId,
    ReferrerUserId, ReferredUserId, Amount = 5, Environment
  }
  ReferralCommissionBalance.AvailableBalance += 5
```

### 5.3 Notificações

```
NotificationService:
  └─ Cria Notification (Scope=Merchant, StatusType=PaymentCompleted)
     └─ Publish NotificationCreatedMessage → RabbitMQ
        └─▶ NotificationCreatedConsumer (swiftpay-api-core)
            └─▶ SignalR: MainHub.SendToMerchantAsync(merchantId, notification)
```

### 5.4 Emails ao Cliente

```
Publish SendCustomerEmailsMessage → RabbitMQ
  └─▶ SendCustomerEmailsConsumer (swiftpay-api-payment)
      ├─ Email de boas-vindas (se primeira compra)
      ├─ Email de confirmação de pagamento
      └─ Publish ProcessDigitalDeliveryMessage
```

### 5.5 Webhook ao Merchant

```
Publish SendWebhookMessage → RabbitMQ
  └─▶ SendWebhookConsumer
      └─▶ WebhookService.SendWebhookAsync(paymentId, "payment.completed")
          ├─ Monta payload JSON com dados do pagamento
          ├─ HMAC-SHA256: secret = payment.Id, header = "sha256={hex}"
          ├─ POST {CallbackUrl} com headers:
          │     X-SwiftPay-Signature, X-SwiftPay-Event,
          │     X-SwiftPay-Delivery, X-SwiftPay-Attempt
          └─ Retry: 3 tentativas (2s → 4s → 8s)
```

### 5.6 Dashboard Updates

```
Publish ProcessMerchantDashboardMessage → RabbitMQ
Publish ProcessAdminDashboardMessage → RabbitMQ
Publish ProcessAcquirerDashboardMessage → RabbitMQ

(assíncrono — dashboards atualizados com KPIs cacheados)
```

### 5.7 SignalR — Tempo Real

```
SignalR: PaymentStatusHub.Clients.Group($"payment_{paymentId}")
  .SendAsync("PaymentStatusChanged", paymentId, "Completed")
```

---

## 6. Fase 5: Saque (Withdrawal)

### 6.1 Criação do Saque

```
POST /v1/cashouts
Body: { amount: 9604, payoutAccountId: "..." }
Auth: JWT

CashoutService.CreateAsync(input)
  ├─ 1. Validações: ambiente (não sandbox), merchant ativo
  ├─ 2. Verifica saldo disponível: LedgerService.GetAvailableBalanceAsync()
  ├─ 3. Carrega payout account (PIX key)
  ├─ 4. Calcula taxas de saque:
  │       platformFee = FeeCalculator(amount, wfs.FeeMode, ...) = 50
  │       acquirerFee = FeeCalculator(amount, acquirer.PayoutFeeMode, ...) = 30
  │       netAmount   = amount - platformFee = 9554
  ├─ 5. Ledger: RecordWithdrawalRequestedAsync
  │       ├─ DEBIT  MerchantAvailable  -9604  "Saque solicitado"
  │       └─ CREDIT MerchantBlocked    +9604  "Saque em processamento"
  ├─ 6. Cria Payout (Status = Pending → Processing se auto-aprovado)
  └─ 7. Se auto-aprovado: Publish ProcessCashoutMessage → RabbitMQ
```

### 6.2 Processamento do Saque

```
ProcessCashoutConsumer
  ├─ Carrega Payout com MerchantAcquirer, PayoutAccount
  └─▶ WithdrawService.ProcessWithdrawAsync()
      └─▶ AcquirerServiceFactory.GetService(acquirerType)
          └─▶ BankiziService.WithdrawAsync()
              └─▶ BankiziClient → POST /pix/withdraw/direct
```

### 6.3 Confirmação do Saque (Webhook)

```
Bankizi POST webhook: event "PIX_OUT", status "DONE"

CashoutService.ProcessAcquirerWebhookAsync(data)
  ├─ Lock atômico: Processing → Confirming
  ├─ Status Completed:
  │   └─ Ledger: RecordWithdrawalCompletedAsync
  │       ├─ DEBIT  MerchantBlocked   -9604  "Saque concluído"
  │       ├─ CREDIT MerchantPayoutsOut +9554 "Saque enviado (líquido)"
  │       └─ CREDIT AcquirerPayoutsOut +9584 "Saque processado (total)"
  │
  │       MerchantBalance: LifetimePayouts += 9554
  │
  ├─ Referral commission (sobre profit do saque)
  ├─ Notificação + email
  └─ Publish SendCashoutWebhookMessage → RabbitMQ
      └─▶ SendCashoutWebhookConsumer
          └─▶ CashoutWebhookService.SendWebhookAsync(payoutId, "cashout.completed")
```

---

## 7. State Machines Completas

### Payment Status

```
[CREATE] ──▶ Pending ──▶ Confirming ──▶ Completed ──┬──▶ Refunded
              │  │                    │    │         ├──▶ PartiallyRefunded
              │  │                    │    └─────────┼──▶ Disputed
              ├──┼──▶ Expired         │              │
              ├──┼──▶ Failed          │              │
              └──┼──▶ Cancelled       │              │
                 │                    │              │
                 └────────────────────┘              │
                 (do Pending direto                   │
                  via webhook)                        │
                                                     │
               Processing ◄──────────────────────────┘
               (refund_requested do Completed)
```

### Payout Status

```
[CREATE] ──▶ Pending ──▶ Processing ──▶ Confirming ──▶ Completed
              │                                        │
              ├──▶ Cancelled (user)                     ├──▶ Failed
              ├──▶ Rejected (admin)                     ├──▶ Rejected (acquirer)
              └──▶ Cancelled (admin)                    └──▶ Cancelled (acquirer)
```

---

## 8. RabbitMQ — Mapa de Mensagens no Ciclo

| Fase | Mensagem | Fila | Quem Publica | Quem Consome |
|------|----------|------|-------------|-------------|
| Criação | `RecordLedgerPending` | `swiftpay.ledger.pending` | PixTransactionService | RecordLedgerPendingConsumer |
| Webhook | `PaymentCompleted` | `swiftpay.payment.completed` | PaymentProcessingService | PaymentCompletedConsumer |
| Pós-pagamento | `NotificationCreated` | `swiftpay.notification.created` | PaymentCompletedConsumer | NotificationCreatedConsumer |
| Pós-pagamento | `SendCustomerEmails` | `swiftpay.email.customer` | PaymentCompletedConsumer | SendCustomerEmailsConsumer |
| Pós-pagamento | `ProcessDigitalDelivery` | `swiftpay.digital.delivery` | SendCustomerEmailsConsumer | ProcessDigitalDeliveryConsumer |
| Pós-pagamento | `SendWebhook` | `swiftpay.webhook.send` | PaymentCompletedConsumer | SendWebhookConsumer |
| Pós-pagamento | `ProcessMerchantDashboard` | `swiftpay.dashboard.merchant` | PaymentCompletedConsumer | ProcessMerchantDashboardConsumer |
| Pós-pagamento | `ProcessAdminDashboard` | `swiftpay.dashboard.admin` | PaymentCompletedConsumer | ProcessAdminDashboardConsumer |
| Pós-pagamento | `ProcessAcquirerDashboard` | `swiftpay.dashboard.acquirer` | PaymentCompletedConsumer | ProcessAcquirerDashboardConsumer |
| Saque | `ProcessCashout` | `swiftpay.cashout.process` | CashoutService | ProcessCashoutConsumer |
| Saque webhook | `SendCashoutWebhook` | `swiftpay.cashout.webhook.send` | CashoutService | SendCashoutWebhookConsumer |

---

## 9. Linha do Tempo Completa

```
T0  POST /transactions (PIX, R$100)
T0  ├─ PixTransactionService.CreateAsync
T0  ├─ PixService.GeneratePixAsync → Bankizi POST /pix/qrcode/dynamic
T0  ├─ Payment (Pending) + PaymentPix criados
T0  └─ RabbitMQ: RecordLedgerPending → Ledger: MerchantPending +R$98

T1  Cliente escaneia QR code e paga...

T2  Bankizi POST webhook (txId, PAID)
T2  ├─ PaymentProcessingService: lock Pending→Confirming, Completed, endToEndId
T2  └─ RabbitMQ: PaymentCompleted

T3  PaymentCompletedConsumer
T3  ├─ Ledger: MerchantPending -98, MerchantAvailable +96.04, MerchantReserved +1.96
T3  ├─ AcquirerSettlement +99
T3  ├─ Referral commission (se aplicável)
T3  ├─ Notification (SignalR)
T3  ├─ Customer emails → entrega digital
T3  ├─ Webhook ao merchant (POST callback_url, HMAC signed, 3 retries)
T3  └─ Dashboard updates (async)

T4  Merchant solicita saque (R$96.04)
T4  ├─ Ledger: MerchantAvailable -96.04, MerchantBlocked +96.04
T4  └─ Payout (Processing) + RabbitMQ: ProcessCashout

T5  ProcessCashoutConsumer → Bankizi POST /pix/withdraw/direct

T6  Bankizi POST webhook (withdrawalId, DONE)
T6  ├─ Ledger: MerchantBlocked -96.04, MerchantPayoutsOut +95.54
T6  ├─ AcquirerPayoutsOut +95.84
T6  ├─ Notificação + email
T6  └─ Webhook de saque ao merchant
```

---

## 10. Fórmulas de Cálculo

### Criação do Pagamento

```
platformFee    = Calculate(amount, feeMode, feeFixed, feePercentage)
acquirerFee    = Calculate(amount, acquirerPixInFeeMode, acquirerPixInFeeFixed, acquirerPixInFeePercentage)
checkoutFee    = Calculate(amount, templateFeeMode, ...)  // apenas se checkout
netAmount      = amount - platformFee - checkoutFee
settlementAmt  = netAmount * (1 - reservePercentage / 10000)
acquirerNetAmt = amount - acquirerFee
```

### FeeCalculator

```
FixedOnly:          fee = fixedFee
PercentageOnly:     fee = ceil(amount * basisPoints / 10000)
FixedAndPercentage: fee = fixedFee + ceil(amount * basisPoints / 10000)
```

### Saque

```
platformFee    = Calculate(amount, wfs.FeeMode, wfs.FeeFixed, wfs.FeePercentage)
acquirerFee    = Calculate(amount, acquirer.PayoutFeeMode, ...)
netAmount      = amount - platformFee
amountToSend   = feeHandling == FeeDeducted ? netAmount + acquirerFee : netAmount
```

### Referral Commission

```
profit       = platformFee - acquirerFee
commission   = floor(profit * commissionBasisPoints / 10000)
```
