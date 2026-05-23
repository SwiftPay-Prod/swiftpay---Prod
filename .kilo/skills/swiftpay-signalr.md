# Swiftpay SignalR (Real-Time)

## Sub-skills
- **swiftpay-messaging** — dashboard cache consumers publish SignalR events
- **swiftpay-payment-processing** — payment status changes trigger SignalR
- **swiftpay-webhooks** — webhook delivery vs real-time delivery

## Architecture
SignalR hubs for real-time dashboard updates. Events published from consumers after database writes.

## Hubs

### PaymentHub
- `PaymentStatusChanged(paymentId, status, amount)` — sent after any payment status change
- Clients: merchant dashboard (authenticated by merchantId)

### DashboardHub
- `DashboardDataUpdated(merchantId, data)` — KPI cache refresh
- `BalanceUpdated(merchantId, available, pending)` — balance changes
- Clients: merchant dashboard

### AdminHub
- `AdminDashboardUpdated(data)` — admin-level metrics
- Clients: admin users (God/Admin roles)

## SignalR Message Flow
```
PaymentProcessingService (webhook) 
  → Publica PaymentCompleted (RabbitMQ)
    → PaymentCompletedConsumer 
      → Ledger, webhook, email...
      → Publica ProcessMerchantDashboard (RabbitMQ)
        → ProcessMerchantDashboardConsumer
          → Atualiza KPIs no banco
          → Envia DashboardDataUpdated via SignalR
```

## Client-Side Usage (Next.js)
```typescript
// Connect to hub
const connection = new HubConnectionBuilder()
  .withUrl(`${API_URL}/hubs/payment`)
  .withAutomaticReconnect()
  .build();

// Listen for events
connection.on('PaymentStatusChanged', (paymentId, status, amount) => {
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
  queryClient.invalidateQueries({ queryKey: ['balance'] });
});

// Start connection
await connection.start();
```

## Key Rules
- **Max message size**: 32KB (configured in SignalR options)
- **Authentication**: Hubs require authenticated connection (JWT in query string)
- **Group-based**: Messages sent to specific merchant groups (not broadcast)
- **Reconnection**: Client must handle automatic reconnection
- **Fallback**: Dashboard also polls every 30s if SignalR disconnects
- **No business logic in hub**: Hubs only relay pre-formatted data
