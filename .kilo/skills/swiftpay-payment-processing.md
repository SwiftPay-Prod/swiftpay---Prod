# Swiftpay Payment Processing

## Sub-skills
- **swiftpay-ledger** — how payments generate ledger entries
- **swiftpay-acquirer-integration** — how acquirers process payments
- **swiftpay-messaging** — PaymentCompleted consumer
- **swiftpay-signalr** — real-time payment status updates

## Architecture
Strategy + Factory pattern. Each payment method (PIX, Boleto, Card) has its own `IPaymentMethodService` implementation. A factory resolves the correct service at runtime.

```
TransactionService.CreateAsync
  → PaymentMethodServiceFactory.GetService(method)
  → PixTransactionService.CreateAsync
    → PixService.GeneratePixAsync
      → AcquirerServiceFactory.GetService(acquirer)
      → BankiziService.GeneratePixAsync (ou outro)
    → Salva Payment + PaymentPix
    → Publica RecordLedgerPending (RabbitMQ)

PaymentProcessingService.ProcessAcquirerWebhookAsync
  ← Recebe webhook da adquirente
  → Lock otimista (status Confirming)
  → Atualiza status + PaymentPix
  → Publica PaymentCompleted (RabbitMQ)
```

## IPaymentMethodService
```csharp
public interface IPaymentMethodService
{
    PaymentMethod Method { get; }
    Task<PaymentResult> CreateAsync(PaymentRequest request);
}
```

Implementations: `PixTransactionService`, `BoletoTransactionService`, `CreditCardTransactionService`.

## Payment Status Machine
```
Pending → Processing → Completed (sucesso)
Pending → Processing → Failed (recusado)
Pending → Expired (tempo esgotado)
Completed → Refunded (estorno)
Completed → PartiallyRefunded (estorno parcial)
```

## Locking Strategy (Webhook Processing)
Optimistic locking via `ExecuteUpdateAsync`:
1. `UPDATE Payments SET Status = 'Confirming' WHERE Id = @id AND Status = 'Pending'`
2. If affected rows > 0: lock acquired → process normally
3. If affected rows = 0: another webhook already processing → check current status

## Payment Status Processor (`PaymentCompletedConsumer`)
Routes by `NewStatus`:
- **Completed**: Ledger settlement, referral commissions, stock, order, notification, email, dashboard KPIs, webhook
- **Expired/Failed/Cancelled**: Ledger cancellation, stock release, order status, notification
- **Refunded/PartiallyRefunded**: Ledger refund

## Fee Calculation
```csharp
PlatformFee = feeSettings.PlatformFeeType switch {
    Percentage => amount * platformPercent / 100 + platformFixed,
    Fixed => platformFixed
};
AcquirerFee = amount * acquirerPercent / 100 + acquirerFixed;
NetAmount = amount - PlatformFee - AcquirerFee;
MerchantSettlementAmount = amount - PlatformFee; // o que cai na conta do merchant
AcquirerNetAmount = amount - NetAmount - AcquirerFee; // o que a plataforma ganha
```

## Key Rules
- **Fail-fast**: Validate all conditions before calling acquirer API
- **Payment method enablement**: Check both platform settings AND merchant settings
- **A/B testing**: Support nominal distribution between two acquirers with weight-based routing
- **Customer fallback**: Auto-generate customer data (CPF, email, phone) for checkout payments
- **Sandbox**: Fake PIX data (sandbox_txId, fake QR code) when `IsSimulated=true`
