# Swiftpay Messaging System

## Sub-skills
- **swiftpay-payment-processing** — payment messages
- **swiftpay-ledger** — ledger messages
- **swiftpay-webhooks** — webhook messages
- **swiftpay-architecture** — overall message flow

## Architecture
MassTransit + RabbitMQ for async message processing. Messages are published after database writes and processed by dedicated consumers.

## Message Types

### Payment Messages
| Message | Publisher | Consumer | Purpose |
|---------|-----------|----------|---------|
| `RecordLedgerPending` | PixTransactionService | RecordLedgerPendingConsumer | Credit MerchantPending |
| `PaymentCompleted` | PaymentProcessingService | PaymentCompletedConsumer | Full post-payment processing |
| `SendWebhook` | PaymentCompletedConsumer | SendWebhookConsumer | Send merchant webhook |
| `SendCustomerEmails` | PaymentCompletedConsumer | SendCustomerEmailsConsumer | Send email notifications |

### Withdrawal Messages
| Message | Publisher | Consumer | Purpose |
|---------|-----------|----------|---------|
| `ProcessCashout` | CashoutService | ProcessCashoutConsumer | Execute withdrawal |
| `SendCashoutWebhook` | ProcessCashoutConsumer | SendCashoutWebhookConsumer | Send withdrawal notification |

### Platform Messages
| Message | Publisher | Consumer | Purpose |
|---------|-----------|----------|---------|
| `ProcessPlatformPayout` | PlatformPayoutService | ProcessPlatformPayoutConsumer | Start platform payout |
| `ProcessPlatformPayoutItem` | ProcessPlatformPayoutConsumer | ProcessPlatformPayoutItemConsumer | Per-acquirer payout |

### Dashboard Messages
| Message | Publisher | Consumer | Purpose |
|---------|-----------|----------|---------|
| `ProcessMerchantDashboard` | PaymentCompletedConsumer | ProcessMerchantDashboardConsumer | Update merchant KPIs |
| `ProcessAdminDashboard` | PaymentCompletedConsumer | ProcessAdminDashboardConsumer | Update admin KPIs |
| `ProcessPlatformBalance` | PaymentCompletedConsumer | ProcessPlatformBalanceConsumer | Update platform balance cache |

## Consumer Pattern
```csharp
public class MyConsumer : IConsumer<MyMessage>
{
    public async Task Consume(ConsumeContext<MyMessage> context)
    {
        // 1. Load entities
        var payment = await _paymentRepo.GetByIdAsync(context.Message.PaymentId);

        // 2. Validate status (prevent double processing)
        if (payment.Status != PaymentStatus.Pending) return;

        // 3. Execute business logic
        await _ledgerService.RecordAsync(payment);

        // 4. Atomic status update (prevent race conditions)
        await _paymentRepo.UpdateStatusAsync(payment.Id, PaymentStatus.Processing);

        // 5. Publish next message if needed
        await context.Publish(new NextMessage { PaymentId = payment.Id });
    }
}
```

## Key Rules
- **Idempotency**: Always check current status before processing (messages can be redelivered)
- **Atomic locks**: Use `ExecuteUpdateAsync` for terminal status transitions
- **Scope per consumer**: Each consumer resolves its own service scope (DbContext is scoped)
- **Error handling**: Log failures, never silently catch — DLQ for poison messages
- **Retry policy**: Use `UseMessageRetry` with exponential backoff for transient failures
- **Environment filtering**: All messages carry environment; consumers filter by current environment
- **Minimum thread pool**: Set `ThreadPool.SetMinThreads(100, 100)` for high throughput
